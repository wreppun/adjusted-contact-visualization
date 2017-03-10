import {render} from './bipCartographer.js';
import * as Players from './league/players.json';

import Vue from 'vue';
import VueResource from 'vue-resource';

Vue.use(VueResource);

new Vue({
  el: '#main',

  data: {
    playerInput: null,
    filteredPlayer: [],
    overflow: 0,
    currentPlayer: {},
    arrowed: 0,
    scaleType: 'league'
  },

  computed: {
    filteredPlayers: function () {
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
    }
  },

  methods: {
    setPlayer: function (player) {
      this.currentPlayer = player;
      this.playerInput = null;
      this.overflow = 0;
      this.fetchBatter(player.id)
        .then(results => {
          this.currentPlayer.results = results;
          render(this.scaleType, results);
        });
    },

    fetchBatter: function (batterId) {
      return this.$http.get(`http://localhost:3714/batter/${batterId}`)
        .then(results => {
          console.log(results);
          return results;
        })
        .then(results => results.body);
    },
    selectArrowed: function () {
      const selectedViaArrow = this.filteredPlayers[this.arrowed];

      if (selectedViaArrow) {
        this.setPlayer(selectedViaArrow);
      }
    },
    moveArrow: function (increment) {
      this.arrowed = bound(this.arrowed + increment, 0, this.filteredPlayers.length);
    }
  },

  watch: {
    scaleType: function (scaleType) {
      if (this.currentPlayer.results) {
        render(scaleType, this.currentPlayer.results);
      }
    }
  }
});

function bound (value, min, max) {
  return Math.min(max, Math.max(value, min));
}
