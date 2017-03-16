import * as d3 from 'd3';
import {sizeSegments} from './graphUtils';

const width = 960;
const height = 400;

const initGraph = d3.select('#exit-velocity').append('svg')
    .attr('width', width)
    .attr('height', height)
  .append('g')
    .attr('id', 'main-velocity')
    .attr('transform', `translate(100, ${height / 2})`);

const vLeagueColor = d3.scaleLinear()
  .domain([-20, 0, 20])
  .range(['red', 'white', 'green'])
  .clamp(true);

const vSelfColor = d3.scaleLinear()
  .domain([-20, 0, 20])
  .range(['orange', 'white', 'blue'])
  .clamp(true);

// Relative Values
const yMin = -0.5;
const yMax = 0.5;
const yMinVolume = 0;
const yMaxVolume = 0.2;
const negYUpperBound = -0.001;

// SVG values (mins/maxes are inverted -- max is down)
const xAxisOffsetPx = 10;
const svgPadding = 20;
const yMinSvg = -height / 2 + svgPadding;
const yMaxSvg = height / 2 - svgPadding;

const scaleY = d3.scaleLinear()
  .domain([yMin, negYUpperBound, 0, yMax])
  .range([yMaxSvg, xAxisOffsetPx, -xAxisOffsetPx, yMinSvg]);

// Always positive, and doesn't include xAxisOffset
const scaleYHeight = function (v) {
  return -scaleY(Math.abs(v)) - xAxisOffsetPx;
};

const scaleYVolume = d3.scaleLinear()
  .domain([yMinVolume, yMaxVolume])
  .range([-xAxisOffsetPx, yMinSvg]);

const scaleYVolumeHeight = function (v) {
  return -scaleYVolume(v) - xAxisOffsetPx;
};

const yAxisLeftBottom = d3.axisLeft()
  .tickFormat(function (v, i) { return i === 0 ? i : v.toFixed(3); })
  .scale(d3.scaleLinear().domain([0, yMin]).range([xAxisOffsetPx, yMaxSvg]))
  .ticks(5);

const yAxisLeftTop = d3.axisLeft()
  .tickFormat(function (v, i) { return i === 0 ? i : v.toFixed(3); })
  .scale(d3.scaleLinear().domain([0, yMax]).range([-xAxisOffsetPx, yMinSvg]))
  .ticks(5);

initGraph.append('g')
  .attr('class', 'ev-axis')
  .call(yAxisLeftBottom);

initGraph.append('g')
  .attr('class', 'ev-axis')
  .call(yAxisLeftTop);

const yAxisRightTop = d3.axisRight()
  .tickFormat(function (v, i) { return i === 0 ? i : v.toFixed(3); })
  .scale(d3.scaleLinear().domain([0, (height / 2) / 1000]).range([0, yMinSvg]))
  .ticks(5);

initGraph.append('g')
  .attr('class', 'ev-axis')
  .attr('transform', `translate(${width - 400}, ${-xAxisOffsetPx})`)
  .call(yAxisRightTop);

const scaleXBand = d3.scaleBand().range([0, width - 400]).padding(0.3);

function render (wobas, setTooltip) {
  const svg = d3.select('#main-velocity');

  wobas = sizeSegments(wobas, d => d.count)
    .map(sized => Object.assign({}, sized, {
      frequency: sized.right - sized.left
    }));

  const leagueBars = svg.selectAll('.velo-league-bars')
    .data(wobas, function (woba) { return woba.label; });

  const domainedScaleX = scaleXBand.domain(wobas.map(woba => woba.label));

  leagueBars.enter()
    .append('rect')
      .attr('class', 'velo-league-bars')
      .attr('x', function (d) { return domainedScaleX(d.label); })
      .attr('width', function (d) { return domainedScaleX.bandwidth(); })
      .attr('y', function (d) { return offsetYStart(d.expected - d.league); })
      .attr('height', function (d) { return scaleYHeight(d.expected - d.league); })
      .attr('fill', function (d) { return vLeagueColor(posOrNeg(d.expected - d.league) * d.count); });

  leagueBars.transition().duration(400)
      .attr('x', function (d) { return domainedScaleX(d.label); })
      .attr('width', function (d) { return domainedScaleX.bandwidth(); })
      .attr('y', function (d) { return offsetYStart(d.expected - d.league); })
      .attr('height', function (d) { return scaleYHeight(d.expected - d.league); })
      .attr('fill', function (d) { return vLeagueColor(posOrNeg(d.expected - d.league) * d.count); });

  const selfBars = svg.selectAll('.velo-self-bars')
    .data(wobas, function (woba) { return woba.label; });

  const stackOffset = 8;

  selfBars.enter()
    .append('rect')
      .attr('class', 'velo-self-bars')
      .attr('x', function (d) { return domainedScaleX(d.label) + stackOffset / 2; })
      .attr('width', function (d) { return 5; })
      .attr('y', function (d) { return offsetYStart(d.actual - d.expected); })
      .attr('height', function (d) { return scaleYHeight(d.actual - d.expected); })
      .attr('fill', function (d) { return vSelfColor(d.count * posOrNeg(d.actual - d.expected)); });

  selfBars.transition().duration(400)
      .attr('x', function (d) { return domainedScaleX(d.label) + stackOffset / 2; })
      .attr('width', function (d) { return 5; })
      .attr('y', function (d) { return offsetYStart(d.actual - d.expected); })
      .attr('height', function (d) { return scaleYHeight(d.actual - d.expected); })
      .attr('fill', function (d) { return vSelfColor(d.count * posOrNeg(d.actual - d.expected)); });

  const expectedVolumeBars = svg.selectAll('.velo-volume-bars')
    .data(wobas, function (woba) { return woba.label; });

  expectedVolumeBars.enter()
    .append('rect')
      .attr('class', 'velo-volume-bars')
      .attr('opacity', 0.1)
      .attr('x', function (d) { return domainedScaleX(d.label) + stackOffset; })
      .attr('width', function (d) { return domainedScaleX.bandwidth(); })
      .attr('y', function (d) { return scaleYVolume(volume(d)); })
      .attr('height', function (d) { return scaleYVolumeHeight(volume(d)); });

  expectedVolumeBars.transition().duration(400)
      .attr('x', function (d) { return domainedScaleX(d.label) + stackOffset; })
      .attr('width', function (d) { return domainedScaleX.bandwidth(); })
      .attr('y', function (d) { return scaleYVolume(volume(d)); })
      .attr('height', function (d) { return scaleYVolumeHeight(volume(d)); });

  const tooltipBars = svg.selectAll('.tooltip-bars')
    .data(wobas, function (woba) { return woba.label; });

  tooltipBars.enter()
    .append('rect')
      .attr('class', 'tooltip-bars')
      .attr('opacity', 0.0) // need fill + opacity = 0 for mouseover/out
      .attr('x', function (d) { return domainedScaleX(d.label) - stackOffset; })
      .attr('width', function (d) { return domainedScaleX.bandwidth() + stackOffset * 2; })
      .attr('y', function (d) { return topTooltipBound(d); })
      .attr('height', function (d) { return tooltipHeight(d); })
      .on('mouseover', showTooltip(setTooltip))
      .on('mouseout', hideToolTip(setTooltip));

  tooltipBars
      .attr('x', function (d) { return domainedScaleX(d.label) - stackOffset; })
      .attr('width', function (d) { return domainedScaleX.bandwidth() + stackOffset * 2; })
      .attr('y', function (d) { return topTooltipBound(d); })
      .attr('height', function (d) { return tooltipHeight(d); });

  // skip the first; don't want a far left bound
  const veloXAxis = svg.selectAll('.velo-x-axis-text')
    .data(wobas.slice(1, wobas.length), function (woba) { return woba.label; });

  veloXAxis.enter()
    .append('text')
      .attr('class', 'velo-x-axis-text')
      .attr('text-anchor', 'middle')
      .attr('x', function (d) { return domainedScaleX(d.label); })
      .attr('y', 5)
      .text(function (d) { return d.min; });

  veloXAxis.transition().duration(400)
      .attr('x', function (d) { return domainedScaleX(d.label); })
      .attr('y', 5);
}

function posOrNeg (v) {
  return v < 0 ? -1 : 1;
}

function volume (woba) {
  return woba.expected * woba.frequency;
}

function offsetYStart (v) {
  return scaleY(v < 0 ? negYUpperBound : v);
}

function showTooltip (setTooltip) {
  return function (d) {
    setTooltip(Object.assign({}, d, {
      eventX: d3.event.pageX,
      eventY: d3.event.pageY
    }));
  };
}

function hideToolTip (setTooltip) {
  return function () {
    setTooltip({});
  };
}

// after scaling, this means the bar furthest above the x-axis (with
// the most negative svg y-value)
function topTooltipBound (woba) {
  return [
    scaleYVolume(volume(woba)),
    scaleY(woba.expected - woba.league),
    scaleY(woba.actual - woba.expected)
  ].reduce((a, b) => a < b ? a : b, -xAxisOffsetPx);
}

// after scaling, this means the bar furthest below the x-axis (with
// the most positive svg y-value)
function bottomTooltipBound (woba) {
  return [
    scaleYVolume(volume(woba)),
    scaleY(woba.expected - woba.league),
    scaleY(woba.actual - woba.expected)
  ].reduce((a, b) => a > b ? a : b, xAxisOffsetPx);
}

function tooltipHeight (woba) {
  const yTop = topTooltipBound(woba);
  const yBot = bottomTooltipBound(woba);

  return yBot - yTop;
}

export { render };
