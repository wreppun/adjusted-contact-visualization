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
    return average(bipData, bip => bip.xwoba).toFixed(3);
  },

  actual (bipData) {
    return average(
        bipData.map(getBipScore),
        bs => bs.score,
        bs => bs.ab
      )
      .toFixed(3);
  },

  league (leagueData) {
    return average(leagueData, bucket => bucket.woba, bucket => bucket.ab).toFixed(3);
  }
};

function average (data, getValue, getWeight) {
  const totals = data.reduce((agg, d) => {
    const weight = getWeight ? getWeight(d) : 1;
    const value = getValue ? getValue(d) : d;

    agg.sum += value * weight;
    agg.count += weight;

    return agg;
  }, { sum: 0, count: 0 });

  return totals.sum / totals.count;
}

function toFixed (num, fixed) {
  return Math.floor(Math.pow(10, fixed) * num) / Math.pow(10, fixed);
}

export { woba, toFixed };
