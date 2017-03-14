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
  .domain([-10, 0, 10])
  .range(['red', 'white', 'blue']);

const yMin = -0.5;
const yMax = 0.5;
const xAxisOffsetPx = 10;
const svgPadding = 20;

const scaleY = d3.scaleLinear()
  .domain([yMin, yMax])
  .range([height / 2 - svgPadding, -height / 2 + svgPadding]);

const yAxisLeftBottom = d3.axisLeft()
  .tickFormat(function (v, i) { return i === 0 ? i : v.toFixed(3); })
  .scale(d3.scaleLinear().domain([0, yMin]).range([0, height / 2 - svgPadding]))
  .ticks(5);

const yAxisLeftTop = d3.axisLeft()
  .tickFormat(function (v, i) { return i === 0 ? i : v.toFixed(3); })
  .scale(d3.scaleLinear().domain([0, yMax]).range([0, -height / 2 + svgPadding]))
  .ticks(5);

initGraph.append('g')
  .attr('class', 'ev-axis')
  .attr('transform', `translate(0, ${xAxisOffsetPx})`)
  .call(yAxisLeftBottom);

initGraph.append('g')
  .attr('class', 'ev-axis')
  .attr('transform', `translate(0, ${-xAxisOffsetPx})`)
  .call(yAxisLeftTop);

const yAxisRightTop = d3.axisRight()
  .tickFormat(function (v, i) { return i === 0 ? i : v.toFixed(3); })
  .scale(d3.scaleLinear().domain([0, (height / 2) / 1000]).range([0, -height / 2 + svgPadding]))
  .ticks(5);

initGraph.append('g')
  .attr('class', 'ev-axis')
  .attr('transform', `translate(${width - 400}, ${-xAxisOffsetPx})`)
  .call(yAxisRightTop);

const scaleXBand = d3.scaleBand().range([0, width - 400]).padding(0.3);

function render (wobas) {
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
      .attr('y', offsetYStart)
      .attr('height', function (d) { return Math.abs(scaleY(d.expected - d.league)); })
      .attr('fill', function (d) { return vLeagueColor((d.expected - d.league) * d.count); });

  leagueBars.transition().duration(400)
      .attr('x', function (d) { return domainedScaleX(d.label); })
      .attr('width', function (d) { return domainedScaleX.bandwidth(); })
      .attr('y', offsetYStart)
      .attr('height', function (d) { return Math.abs(scaleY(d.expected - d.league)); })
      .attr('fill', function (d) { return vLeagueColor((d.expected - d.league) * d.count); });

  const expectedRects = svg.selectAll('.velo-volume-rects')
    .data(wobas, function (woba) { return woba.label; });

  const expectedOffset = 8;

  expectedRects.enter()
    .append('rect')
      .attr('class', 'velo-volume-rects')
      .attr('opacity', 0.1)
      .attr('x', function (d) { return domainedScaleX(d.label) + expectedOffset; })
      .attr('width', function (d) { return domainedScaleX.bandwidth(); })
      .attr('y', function (d) { return scaleY(volumeBarHeight(d)) - xAxisOffsetPx; })
      .attr('height', function (d) { return Math.abs(scaleY(volumeBarHeight(d))); });

  expectedRects.transition().duration(400)
      .attr('x', function (d) { return domainedScaleX(d.label) + expectedOffset; })
      .attr('width', function (d) { return domainedScaleX.bandwidth(); })
      .attr('y', function (d) { return scaleY(volumeBarHeight(d)) - xAxisOffsetPx; })
      .attr('height', function (d) { return Math.abs(scaleY(volumeBarHeight(d))); });

  console.log(
    'total vbh',
    wobas.map(woba => Math.abs(scaleY(volumeBarHeight(woba))))
      .reduce((agg, v) => agg + v, 0)
  );

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

function volumeBarHeight (woba) {
  return woba.expected * woba.frequency * 2.5;
}

function offsetYStart (woba) {
  let y = Math.min(0, scaleY(woba.expected - woba.league));
  y += y < 0 ? -xAxisOffsetPx : xAxisOffsetPx;
  return y;
}

export { render };
