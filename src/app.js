import {render} from './bipCartographer';
import {init as initGraph} from './velocityCartographer';
import * as Players from './static/league/players.json';
import * as LeagueData from './static/league/productionAll.json';
import {woba} from './stats';
import {fromPartitioningArray} from './partitions';
import intro from './intro.js';

import Vue from 'vue';
import VueResource from 'vue-resource';

Vue.use(VueResource);
Vue.component('intro', intro);

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

const emptySafePartition = {
  expected: 0,
  actual: 0,
  count: 0
};

const diffTypes = {
  EXPECTED_LEAGUE: {
    id: 'expectedLeague',
    label: 'Expected vs. League',
    calculation: 'Expected - League',
    fwoba: woba => woba.expected - woba.league
  },
  ACTUAL_LEAGUE: {
    id: 'actualLeague',
    label: 'Actual vs. League',
    calculation: 'Actual - League',
    fwoba: woba => woba.actual - woba.league
  },
  ACTUAL_EXPECTED: {
    id: 'expectedActual',
    label: 'Actual vs. Expected',
    calculation: 'Actual - Expected',
    fwoba: woba => woba.actual - woba.expected
  }
};

const volumeTypes = {
  EXPECTED: {
    id: 'expected',
    label: 'Expected',
    calculation: 'Expected',
    fwoba: woba => woba.expected
  },
  ACTUAL: {
    id: 'actual',
    label: 'Actual',
    calculation: 'Actual',
    fwoba: woba => woba.actual
  }
};

const renderVelo = initGraph('exit-velocity-svg-wrapper');
const renderAngle = initGraph('launch-angle-svg-wrapper');

const routes = {
  HOME: 'home',
  PLAYER: 'player',
  WHAT_IT_IS: 'whatItIs'
};

/* eslint-disable no-new */
new Vue({
/* eslint-enable no-new */
  el: '#main',

  data: {
    playerInput: null,
    overflow: 0,
    currentPlayer: {},
    recentPlayers: [],
    arrowed: 0,
    scaleType: 'league',
    diffOptions: [
      diffTypes.EXPECTED_LEAGUE,
      diffTypes.ACTUAL_LEAGUE,
      diffTypes.ACTUAL_EXPECTED
    ],
    angleDiffType: diffTypes.EXPECTED_LEAGUE,
    velocityDiffType: diffTypes.EXPECTED_LEAGUE,
    volumeOptions: [
      volumeTypes.EXPECTED,
      volumeTypes.ACTUAL
    ],
    angleVolumeType: volumeTypes.EXPECTED,
    velocityVolumeType: volumeTypes.EXPECTED,
    playerBipData: [],
    anglePartitions: anglePartitions, // doesn't need to be in data for now
    velocityPartitions: velocityPartitions, // doesn't need to be in data for now
    evBipTooltip: {},
    laBipTooltip: {},
    evlaBipTooltip: {},
    page: routes.HOME
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

      const lettersInOrderRegExp = new RegExp(this.playerInput.toLowerCase().split('').join('.*'));
      const filtered = Players.filter(p => lettersInOrderRegExp.test(p.normalized));
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

      return {
        expected,
        actual,
        count: this.playerBipData.length
      };
    },

    playerAngleWoba () {
      return partitionBips(this.playerBipData, this.anglePartitioner, d => d.angle);
    },

    playerVelocityWoba () {
      return partitionBips(this.playerBipData, this.velocityPartitioner, d => d.velocity);
    },

    leagueWoba () {
      return woba.league(LeagueData);
    }
  },

  methods: {
    setVelocityTooltip (tooltip) {
      this.evBipTooltip = tooltip;
    },

    setAngleTooltip (tooltip) {
      this.laBipTooltip = tooltip;
    },

    setEvLaTooltip (tooltip) {
      this.evlaBipTooltip = tooltip;
    },

    setPlayer (player) {
      ifFoundRemove(player, this.recentPlayers);
      ifFoundRemove(this.currentPlayer, this.recentPlayers);

      if (this.currentPlayer.name) {
        this.recentPlayers.splice(0, 0, this.currentPlayer);
      }

      this.currentPlayer = player;
      this.playerInput = null;
      this.overflow = 0;

      if (player.id) {
        this.fetchBatter(player.id)
          .then(results => {
            this.playerBipData = results;
            render(this.scaleType, results, this.setEvLaTooltip);
          });
      }
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
        this.goPlayer(selectedViaArrow);
      }
    },

    moveArrow (increment) {
      this.arrowed = bound(this.arrowed + increment, 0, this.filteredPlayers.length);
    },

    renderAngleGraph () {
      renderGraph(
        this.playerAngleWoba,
        this.angleDiffType,
        this.angleVolumeType,
        this.setAngleTooltip,
        renderAngle
      );
    },

    renderVelocityGraph () {
      renderGraph(
        this.playerVelocityWoba,
        this.velocityDiffType,
        this.velocityVolumeType,
        this.setVelocityTooltip,
        renderVelo
      );
    },

    goHome () {
      this.setPlayer({});
      this.page = routes.HOME;
    },

    isHome () {
      return this.page === routes.HOME;
    },

    goPlayer (player) {
      this.setPlayer(player);
      this.page = routes.PLAYER;
    },

    isPlayer () {
      return this.page === routes.PLAYER;
    },

    goWhatItIs () {
      this.setPlayer({});
      this.page = routes.WHAT_IT_IS;
    },

    isWhatItIs () {
      return this.page === routes.WHAT_IT_IS;
    }
  },

  watch: {
    scaleType: function (scaleType) {
      if (this.playerBipData.length) {
        render(scaleType, this.playerBipData, this.setEvLaTooltip);
      }
    },

    playerVelocityWoba: function (pvw) {
      this.renderVelocityGraph();
    },

    velocityDiffType: function (vst) {
      this.renderVelocityGraph();
    },

    velocityVolumeType: function (vvt) {
      this.renderVelocityGraph();
    },

    playerAngleWoba: function () {
      this.renderAngleGraph();
    },

    angleDiffType: function () {
      this.renderAngleGraph();
    },

    angleVolumeType: function () {
      this.renderAngleGraph();
    }
  }
});

function renderGraph (wobas, diffType, volumeType, setTt, renderFn) {
  // Don't modify original woba!
  const withDerived = wobas.map(woba => Object.assign(
    {
      diff: diffType.fwoba(woba),
      volume: volumeType.fwoba(woba)
    },
    woba
  ));

  return renderFn(withDerived, setTt);
}

function partitionBips (playerBips, partitioner, measurement) {
  if (!playerBips.length) {
    return [];
  }

  return partitioner.map(partition => {
    const partitionedBip = playerBips.filter(bip => partition.fits(measurement(bip)));
    const partitionedLeague = LeagueData.filter(leagueBucket => partition.fits(measurement(leagueBucket)));
    const leagueWoba = woba.league(partitionedLeague);

    if (!partitionedBip.length) {
      return Object.assign({
        label: partition.label,
        min: partition.min,
        league: leagueWoba
      }, emptySafePartition);
    }

    const expected = woba.expected(partitionedBip);
    const actual = woba.actual(partitionedBip);

    return {
      label: partition.label,
      min: partition.min,
      count: partitionedBip.length,
      expected,
      actual,
      league: leagueWoba
    };
  });
}

function ifFoundRemove (player, players) {
  const existing = players.findIndex(p => p.name === player.name);

  if (existing > -1) {
    players.splice(existing, 1);
  }
}

function bound (value, min, max) {
  return Math.min(max, Math.max(value, min));
}
