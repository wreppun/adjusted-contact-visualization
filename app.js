import {playerCsv, setPlayerScale} from './bipCartographer.js';

import Vue from 'vue';

new Vue({
  el: '#main',

  data: {
    message: 'Hello World?'
  }
});

const players = [
  'aoki.csv',
  'frazier.csv',
  'mookie.csv',
  'yelich.csv',
  'schimpf.csv'
];

const selector = (function () {
  let currentPlayer = 0;

  return {
    current: () => players[currentPlayer % players.length],

    next: () => {
      currentPlayer += 1;

      return players[currentPlayer % players.length];
    }
  };
}());

playerCsv('./players/' + selector.next());

export const next = () => playerCsv('./players/' + selector.next());
export const setScale = isPlayer => {
  setPlayerScale(isPlayer);
  playerCsv('./players/' + selector.current());
};
