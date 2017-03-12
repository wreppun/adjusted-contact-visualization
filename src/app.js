import {render} from './bipCartographer';
import * as Players from './static/league/players.json';
import {woba, toFixed} from './stats';
import {fromPartitioningArray} from './partitions';

import Vue from 'vue';
import VueResource from 'vue-resource';

Vue.use(VueResource);

const anglePartitioner = fromPartitioningArray([
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
]);

const velocityPartitioner = fromPartitioningArray([
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
]);

new Vue({
  el: '#main',

  data: {
    playerInput: null,
    overflow: 0,
    currentPlayer: {},
    recentPlayers: [],
    arrowed: 0,
    scaleType: 'league',
    playerBipData: []
  },

  computed: {
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
      console.log('when does this run?');

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
      return anglePartitioner.map(ap => {
        const partition = this.playerBipData.filter(bip => ap.fits(bip.angle));

        if (!partition.length) {
          return Object.assign({ label: ap.label }, emptyPartition);
        }

        const expected = woba.expected(partition);
        const actual = woba.actual(partition);
        const diff = (actual - expected).toFixed(3);

        return {
          label: ap.label,
          count: partition.length,
          expected,
          actual,
          diff
        };
      });
    },

    playerVelocityWoba () {
      return velocityPartitioner.map(vp => {
        const partition = this.playerBipData.filter(bip => vp.fits(bip.velocity));

        if (!partition.length) {
          return Object.assign({ label: vp.label }, emptyPartition);
        }

        const expected = woba.expected(partition);
        const actual = woba.actual(partition);
        const diff = (actual - expected).toFixed(3);

        return {
          label: vp.label,
          count: partition.length,
          expected,
          actual,
          diff
        };
      });
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
      return this.$http.get(`http://localhost:3714/batter/${batterId}`)
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
    }
  }
});

function ifFoundRemove (player, players) {
  const existing = players.findIndex(p => p.name === player.name);

  console.log(existing, player, players);

  if (existing > -1) {
    players.splice(existing, 1);
  }
}

function bound (value, min, max) {
  return Math.min(max, Math.max(value, min));
}

const emptyPartition = {
  expected: '--',
  actual: '--',
  diff: '--',
  count: '-'
};
