import {playerCsv, setPlayerScale} from './bipCartographer.js';

import Vue from 'vue';

new Vue({
  el: '#main',

  data: {
    currentPlayer: {},
    players: [
      {
        name: 'Norichika Aoki',
        id: 'aoki.csv'
      },
      {
        name: 'Todd Frazier',
        id: 'frazier.csv'
      },
      {
        name: 'Mookie Betts',
        id: 'mookie.csv'
      },
      {
        name: 'Christian Yelich',
        id: 'yelich.csv'
      },
      {
        name: 'Ryan Schimpf',
        id: 'schimpf.csv'
      }
    ]
  },

  methods: {
    setScale: function (isPlayerScale) {
      setPlayerScale(isPlayerScale);
      if (this.currentPlayer.id) {
        playerCsv('./players/' + this.currentPlayer.id);
      }
    }
  },

  watch: {
    currentPlayer: function (newCurrent) {
      playerCsv('./players/' + newCurrent.id);
    }
  }
});
