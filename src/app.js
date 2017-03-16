import {render} from './bipCartographer';
import {render as renderVelo} from './velocityCartographer';
import * as Players from './static/league/players.json';
import * as LeagueData from './static/league/productionAll.json';
import {woba, toFixed} from './stats';
import {fromPartitioningArray} from './partitions';

import Vue from 'vue';
import VueResource from 'vue-resource';

Vue.use(VueResource);

const anglePartitions = [
  -40,
  -30,
  -20,
  -10,
  0,
  10,
  20,
  30,
  40,
  50
];

const velocityPartitions = [
  60,
  65,
  70,
  75,
  80,
  85,
  90,
  95,
  100,
  105,
  110
];

const emptyDisplayPartition = {
  expected: '--',
  actual: '--',
  diff: '--',
  count: '-'
};

const emptySafePartition = {
  expected: 0,
  actual: 0,
  diff: 0,
  count: 0
};

new Vue({
  el: '#main',

  data: {
    playerInput: null,
    overflow: 0,
    currentPlayer: {},
    recentPlayers: [],
    arrowed: 0,
    scaleType: 'league',
    playerBipData: [],
    anglePartitions: anglePartitions,
    velocityPartitions: velocityPartitions
  },

  computed: {
    anglePartitioner () {
      return fromPartitioningArray(this.anglePartitions);
    },

    velocityPartitioner () {
      return fromPartitioningArray(this.velocityPartitions);
    },

    filteredPlayers () {
      if (!this.playerInput) {
        this.overflow = 0;
        this.arrowed = 0;
        return [];
      }

      const allInOrder = new RegExp(this.playerInput.split('').join('.*'), 'i');
      const filtered = Players.filter(p => allInOrder.test(p.name));
      const trimmed = filtered.slice(0, 10);

      if (trimmed.length < filtered.length) {
        this.overflow = filtered.length - trimmed.length;
      } else {
        this.overflow = 0;
      }

      this.arrowed = bound(this.arrowed, 0, trimmed.length);

      return trimmed;
    },

    playerWoba () {
      const expected = woba.expected(this.playerBipData);
      const actual = woba.actual(this.playerBipData);
      const diff = toFixed(actual - expected, 3);

      return {
        expected,
        actual,
        diff,
        count: this.playerBipData.length
      };
    },

    playerAngleWoba () {
      return this.anglePartitioner.map(ap => {
        const partition = this.playerBipData.filter(bip => ap.fits(bip.angle));
        const leaguePartition = LeagueData.filter(bucket => ap.fits(bucket.angle));

        if (!partition.length) {
          return Object.assign({ label: ap.label }, emptyDisplayPartition);
        }

        const expected = woba.expected(partition);
        const actual = woba.actual(partition);
        const league = woba.league(leaguePartition);
        const diff = (actual - expected).toFixed(3);

        return {
          label: ap.label,
          count: partition.length,
          expected,
          actual,
          league,
          diff,
          min: ap.min,
          max: ap.max
        };
      });
    },

    playerVelocityWoba () {
      return this.velocityPartitioner.map(vp => {
        const partition = this.playerBipData.filter(bip => vp.fits(bip.velocity));
        const leaguePartition = LeagueData.filter(bucket => vp.fits(bucket.velocity));
        const league = woba.league(leaguePartition);

        if (!partition.length) {
          return Object.assign({
            label: vp.label,
            min: vp.min,
            league
          }, emptySafePartition);
        }

        const expected = woba.expected(partition);
        const actual = woba.actual(partition);
        const diff = (actual - expected).toFixed(3);

        return {
          label: vp.label,
          min: vp.min,
          count: partition.length,
          expected,
          actual,
          league,
          diff
        };
      });
    },

    leagueWoba () {
      return woba.league(LeagueData);
    }
  },

  methods: {
    setPlayer (player) {
      this.playerBipData = [];

      ifFoundRemove(player, this.recentPlayers);
      ifFoundRemove(this.currentPlayer, this.recentPlayers);

      if (this.currentPlayer.name) {
        this.recentPlayers.splice(0, 0, this.currentPlayer);
      }

      this.currentPlayer = player;
      this.playerInput = null;
      this.overflow = 0;
      this.fetchBatter(player.id)
        .then(results => {
          this.playerBipData = results;
          render(this.scaleType, results);
        });
    },

    getContactWoba () {
    },

    fetchBatter (batterId) {
      return this.$http.get(`/batter/${batterId}`)
        .then(results => {
          return results;
        })
        .then(results => results.body);
    },

    getInitials (player) {
      return player.name.split(' ').map(part => part[0]).join('');
    },

    selectArrowed () {
      const selectedViaArrow = this.filteredPlayers[this.arrowed];

      if (selectedViaArrow) {
        this.setPlayer(selectedViaArrow);
      }
    },

    moveArrow (increment) {
      this.arrowed = bound(this.arrowed + increment, 0, this.filteredPlayers.length);
    }
  },

  watch: {
    scaleType: function (scaleType) {
      if (this.playerBipData.length) {
        render(scaleType, this.playerBipData);
      }
    },

    playerVelocityWoba: function (pvw) {
      if (pvw.length && this.playerBipData.length) {
        renderVelo(pvw);
      }
    }
  }
});

function ifFoundRemove (player, players) {
  const existing = players.findIndex(p => p.name === player.name);

  if (existing > -1) {
    players.splice(existing, 1);
  }
}

function bound (value, min, max) {
  return Math.min(max, Math.max(value, min));
}
