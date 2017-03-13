import * as production from './static/league/production.json';
import {distinctByKey} from './graphUtils';

function buildBucketer (sortedLimits, getMin, getMax) {
  const bucketer = new Array(sortedLimits.length);

  // First and last are special cases
  const first = sortedLimits[0];
  const last = sortedLimits[sortedLimits.length - 1];

  // Adjusted fit for all data points less than first limit
  bucketer[0] = Object.assign({
    label: '< ' + getMax(first),
    fits: angle => angle < getMax(first),
    interpolate: () => 0.5
  }, first);

  // Adjusted fit for all data points greater than first limit
  bucketer[sortedLimits.length - 1] = Object.assign({
    label: '> ' + getMin(last),
    fits: angle => angle >= getMin(last),
    interpolate: () => 0.5
  }, last);

  for (let i = 1; i < sortedLimits.length - 1; i++) {
    const limit = sortedLimits[i];
    const min = getMin(limit);
    const max = getMax(limit);

    bucketer[i] = Object.assign({
      label: '[' + min + ', ' + max + ')',
      fits: input => input >= min && input < max,
      interpolate: input => (input - min) / (max - min)
    }, limit);
  }

  return bucketer;
}

function angleLimits (performanceData) {
  return distinctByKey(performanceData, p => p.laMin + ':' + p.laMax)
    .map(p => Object.assign({
      laMin: p.laMin,
      laMax: p.laMax
    }))
    .sort((a, b) => a.laMin - b.laMin);
}

function velocityLimits (performanceData) {
  return distinctByKey(performanceData, p => p.evMin + ':' + p.evMax)
    .map(p => Object.assign({
      evMin: p.evMin,
      evMax: p.evMax
    }))
    .sort((a, b) => a.evMin - b.evMin);
}

const laBucketer = buildBucketer(
  angleLimits(production),
  p => p.laMin,
  p => p.laMax);

const evBucketer = buildBucketer(
  velocityLimits(production),
  p => p.evMin,
  p => p.evMax);

function fromPartitioningArray (splitPoints) {
  splitPoints.sort((a, b) => a - b);

  // insert left padded bound
  splitPoints.splice(0, 0, splitPoints[0] - 10);

  // insert right padded bound
  splitPoints.push(splitPoints[splitPoints.length - 1] + 10);

  const partitions = [];

  for (let i = 0; i < splitPoints.length - 1; i++) {
    partitions.push({
      min: splitPoints[i],
      max: splitPoints[i + 1]
    });
  }

  return buildBucketer(partitions, p => p.min, p => p.max);
}

export {
  laBucketer as angleBucketer,
  evBucketer as velocityBucketer,
  fromPartitioningArray
};
