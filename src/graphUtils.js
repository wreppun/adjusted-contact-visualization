const polarToGrid = polar => {
  const x = Math.sin(polar.theta) * polar.r;
  const y = -Math.cos(polar.theta) * polar.r;

  return { x, y };
};

// last in wins
const distinctByKey = (dataArray, keyGenerator) => {
  const distinctMap = dataArray
    .reduce((agg, datum) => {
      agg[keyGenerator(datum)] = datum;
      return agg;
    }, {});

  return Object.keys(distinctMap).map(key => distinctMap[key]);
};

// The padding unit is weird; it's relative to the number of
// total units (sum) returned by getScalar.
const sizeSegments = (segments, getScalar, padding) => {
  getScalar = getScalar || (d => d);
  padding = padding || 0;

  const sum = segments
    .map(getScalar)
    .reduce((agg, v) => agg + v, 0) +
    padding * (segments.length - 1);

  const sized = [];
  let count = 0;

  segments.forEach(segment => {
    const v = getScalar(segment);
    const left = count / sum;
    const right = (count + v) / sum;

    sized.push(Object.assign(
      {},
      segment,
      {
        left,
        right
      }
    ));

    count += (v + padding);
  });

  return sized;
};

export {
  polarToGrid,
  distinctByKey,
  sizeSegments
};
