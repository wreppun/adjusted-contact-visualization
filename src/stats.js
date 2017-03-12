const WOBA_2016 = {
  SINGLE: 0.878,
  DOUBLE: 1.242,
  TRIPLE: 1.569,
  HOME_RUN: 2.015
};

// we only have ab events for now
function getBipScore (bip) {
  switch (bip.result) {
    case 'Single':
      return { ab: 1, score: WOBA_2016.SINGLE };
    case 'Double':
      return { ab: 1, score: WOBA_2016.DOUBLE };
    case 'Triple':
      return { ab: 1, score: WOBA_2016.TRIPLE };
    case 'Home Run':
      return { ab: 1, score: WOBA_2016.HOME_RUN };
    default:
      return { ab: 1, score: 0 };
  }
}

const woba = {
  expected (bipData) {
    return (bipData.reduce((agg, bip) => agg + bip.xwoba, 0) / bipData.length).toFixed(3);

    // return toFixed(
    //   bipData.reduce((agg, bip) => agg + bip.xwoba, 0) / bipData.length,
    //   3
    // );
  },

  actual (bipData) {
    const bipTotals = bipData.reduce((agg, bip) => {
      const bipScore = getBipScore(bip);
      agg.score += bipScore.score;
      agg.abs += bipScore.ab;

      return agg;
    }, { score: 0, abs: 0 });

    return (bipTotals.score / bipTotals.abs).toFixed(3);
    // return toFixed(
    //   bipTotals.score / bipTotals.abs,
    //   3
    // );
  }
};

function toFixed (num, fixed) {
  return Math.floor(Math.pow(10, fixed) * num) / Math.pow(10, fixed);
}

export { woba, toFixed };
