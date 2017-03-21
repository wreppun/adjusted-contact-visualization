import * as d3 from 'd3';
import {polarToGrid, sizeSegments, bipTypeClass} from './graphUtils';
import {angleBucketer, velocityBucketer} from './partitions';
import * as LeagueData from './static/league/production.json';

const width = 660;
const height = 900;
const chartRadius = 600;
const arcLength = Math.PI / 3;

// init
const initGraph =
  d3.select('#launch-angle-exit-velocity-wrapper').append('svg')
      .attr('class', 'ev-graph')
      .attr('width', width)
      .attr('height', height)
    .append('g')
      .attr('transform', 'translate(0,' + height / 2 + ')');

initGraph.append('text')
  .append('textPath')
  .attr('xlink:href', '#launchAngleLabel')
  .style('text-anchor', 'middle')
  .attr('startOffset', '50%')
  .attr('class', 'axis-label')
  .text('LAUNCH ANGLE');

initGraph.append('text')
  .attr('dy', -48)
  .append('textPath')
  .attr('xlink:href', '#exitVelocityLabel')
  .style('text-anchor', 'left')
  .attr('startOffset', '5%')
  .attr('class', 'axis-label')
  .text('EXIT VELOCITY');

// .402 is league average
const color = d3.scaleLinear()
  .domain([0, 0.402, 1.5])
  .range(['#f27e74', '#fffbf5', 'green']);

const pie = d3.pie()
    .startAngle(0)
    .endAngle(arcLength)
    .sort(null)
    .value(function (d) { return Math.max(5, d.sampleSize); });

const scaleAndDraw = (function () {
  const leagueLaScale = angleBucketer.map(b => {
    const sampleSize = LeagueData
      .filter(lp => lp.laMin === b.laMin && lp.laMax === b.laMax)
      .reduce((agg, lp) => agg + lp.abs, 0);

    return Object.assign({}, b, {sampleSize});
  });

  const leagueEvScale = velocityBucketer.map(b => {
    const sampleSize = LeagueData
      .filter(lp => lp.evMin === b.evMin && lp.evMax === b.evMax)
      .reduce((agg, lp) => agg + lp.abs, 0);

    return Object.assign({}, b, {sampleSize});
  });

  return (scaleType, bipData, setTooltip) => {
    if (scaleType === 'player') {
      draw(
        angleBucket(bipData, angleBucketer),
        velocityBucket(bipData, velocityBucketer),
        LeagueData,
        bipData,
        setTooltip
      );
    } else if (scaleType === 'league') {
      draw(
        leagueLaScale,
        leagueEvScale,
        LeagueData,
        bipData,
        setTooltip
      );
    } else {
      console.log('Unknown scale type', scaleType);
    }
  };
}());

const lookupWoba = (production, params) => {
  const leagueResults = production.find(p =>
      p.evMin === params.evMin &&
      p.evMax === params.evMax &&
      p.laMin === params.laMin &&
      p.laMax === params.laMax);

  return leagueResults ? leagueResults.wobaAvg : 0;
};

function initBuckets (bucketer) {
  return bucketer.map(b => Object.assign({}, b, {sampleSize: 0}));
}

function angleBucket (velAngles, bucketer) {
  return bucketThings(velAngles, bucketer, va => va.angle);
}

function velocityBucket (velAngles, bucketer) {
  return bucketThings(velAngles, bucketer, va => va.velocity);
}

function bucketThings (velAngles, bucketer, getThing) {
  const buckets = initBuckets(bucketer);

  velAngles.map(getThing)
    .forEach(thing => bucketer.forEach((b, i) => {
      if (b.fits(thing)) {
        buckets[i].sampleSize += 1;
      }
    }));

  return buckets;
}

function calculateRadii (bucketed, accessor) {
  return sizeSegments(bucketed, accessor)
    .map(segment => Object.assign(segment, {
      innerRadius: shiftArc(segment.left) + 2,
      outerRadius: shiftArc(segment.right)
    }));
}

function shiftArc (scaled) {
  return scaled * (chartRadius * 0.7) + (chartRadius * 0.3);
}

function rotatePied (bucketed) {
  const pied = pie(bucketed);

  const {startAngle} = pied.find(p => p.data.laMin === 10 ? p : null);

  // Reverse and rotate the chart so that ground balls (< 10 degrees)
  // have a negative angle
  const piedShifted = pied.map(p => {
    p.startAngle = (p.startAngle - startAngle) * (-1) + (Math.PI / 2);
    p.endAngle = (p.endAngle - startAngle) * (-1) + (Math.PI / 2);

    return p;
  });

  return piedShifted;
}

function getLaunchAngleTextArc (pied) {
  const radius = shiftArc(1.1);
  // backwards, because we run wedges counter clockwise
  const startAngle = pied.reduce((agg, p) => Math.min(agg, p.endAngle), 2 * Math.PI);
  const endAngle = pied.reduce((agg, p) => Math.max(agg, p.startAngle), -2 * Math.PI);
  const arcStart = polarToGrid({r: radius, theta: startAngle});
  const arcEnd = polarToGrid({r: radius, theta: endAngle});

  // from https://www.visualcinnamon.com/2015/09/placing-text-on-arcs.html
  const path = `M ${arcStart.x},${arcStart.y} A ${radius},${radius} 0 0,1 ${arcEnd.x} ${arcEnd.y}`;

  return path;
}

function getLaunchAngleTicks (pied) {
  const radiusStart = shiftArc(1);
  const radiusEnd = shiftArc(1.1);

  return pied.slice(1, pied.length)
    .map(p => Object.assign({
      coords: [
        polarToGrid({r: radiusStart, theta: p.startAngle}),
        polarToGrid({r: radiusEnd, theta: p.startAngle})
      ],
      id: 'la' + p.data.laMin,
      label: p.data.laMin
    }));
}

function getExitVelocityTicks (pied, radialSections) {
  // path angle (since it is measured from the top of the circle) is the same
  // as the angle needed when creating a perpendicular line.
  const pathAngle = pied.reduce((agg, p) => Math.min(agg, p.endAngle), 2 * Math.PI);
  const offset = xyOffset(pathAngle, 32);

  return radialSections.slice(1, radialSections.length).map(r => {
    const perpIntersection = polarToGrid({ r: r.innerRadius, theta: pathAngle });

    const segmentEnd = {
      x: perpIntersection.x - offset.x,
      y: perpIntersection.y - offset.y
    };

    return {
      coords: [
        segmentEnd,
        perpIntersection
      ],
      label: r.evMin,
      id: 'ev' + r.evMin
    };
  });
}

function xyOffset (angle, hypotenuse) {
  return {
    x: Math.cos(angle) * hypotenuse,
    y: Math.sin(angle) * hypotenuse
  };
}

function getExitVelocityTextPath (pied) {
  const innerRadius = shiftArc(0);
  const outerRadius = shiftArc(1);
  const pathAngle = pied.reduce((agg, p) => Math.min(agg, p.endAngle), 2 * Math.PI);

  const pathBegin = polarToGrid({r: innerRadius, theta: pathAngle});
  const pathEnd = polarToGrid({r: outerRadius, theta: pathAngle});

  const path = `M ${pathBegin.x},${pathBegin.y} L ${pathEnd.x},${pathEnd.y}`;

  return path;
}

function arcTween (radius) {
  return function factory (dParent) {
    const iStart = d3.interpolate(this._current.startAngle, dParent.startAngle);
    const iEnd = d3.interpolate(this._current.endAngle, dParent.endAngle);
    const iInner = d3.interpolate(this._current.innerRadius, radius.innerRadius);
    const iOuter = d3.interpolate(this._current.outerRadius, radius.outerRadius);

    // store the current for next interpolation
    this._current = Object.assign({}, dParent, radius);

    return function onTick (t) {
      return d3.arc()({
        innerRadius: iInner(t),
        outerRadius: iOuter(t),
        startAngle: iStart(t),
        endAngle: iEnd(t),
        padAngle: dParent.padAngle
      });
    };
  };
}

function draw (angles, velocities, leagueProduction, velAngles, setTooltip) {
  const radialSections = calculateRadii(velocities, d => Math.max(d.sampleSize, 5));
  const pied = rotatePied(angles);
  const plotted = mapToChart(
    velocities,
    radialSections.map(r => Object.assign({
      min: r.innerRadius,
      max: r.outerRadius
    })),
    angles,
    pied.map(p => Object.assign({
      min: p.startAngle,
      max: p.endAngle
    })),
    velAngles
  );
  const launchAngleTextArc = getLaunchAngleTextArc(pied);
  const launchTicksD = getLaunchAngleTicks(pied);
  const exitVelocityTextPath = getExitVelocityTextPath(pied);
  const velocityTicksD = getExitVelocityTicks(pied, radialSections);

  const svg = d3.select('#launch-angle-exit-velocity-wrapper svg g');

  const tickSegment = d3.line()
    .x(function (d) { return d.x; })
    .y(function (d) { return d.y; });

  const launchTicks = svg.selectAll('.launch-tick')
    .data(launchTicksD, function (d) { return d.id; });

  launchTicks.enter()
    .append('path')
      .attr('class', 'launch-tick')
      .attr('id', function (d) { return d.id; })
      .attr('d', function (d) { return tickSegment(d.coords); });

  launchTicks.enter()
    .append('text')
      .attr('dy', 6)
      .attr('class', 'launch-tick-label')
    .append('textPath')
      .attr('xlink:href', function (d) { return '#' + d.id; })
      .style('text-anchor', 'middle')
      .attr('startOffset', '50%')
      .text(function (d) { return d.label; });

  launchTicks.transition().duration(400)
    .attr('d', function (d) { return tickSegment(d.coords); });

  const velocityTicks = svg.selectAll('.velocity-tick')
    .data(velocityTicksD, function (d) { return d.id; });

  velocityTicks.enter()
    .append('path')
      .attr('class', 'velocity-tick')
      .attr('id', function (d) { return d.id; })
      .attr('d', function (d) { return tickSegment(d.coords); });

  velocityTicks.enter()
    .append('text')
      .attr('dy', 6)
      .attr('class', 'velocity-tick-label')
    .append('textPath')
      .attr('xlink:href', function (d) { return '#' + d.id; })
      .style('text-anchor', 'end')
      .attr('startOffset', '60%')
      .text(function (d) { return d.label; });

  velocityTicks.transition().duration(400)
    .attr('d', function (d) { return tickSegment(d.coords); });

  // launch angle label
  const laLabel = svg.selectAll('#launchAngleLabel')
    .data([launchAngleTextArc]);

  laLabel.enter()
    .append('path')
      .attr('id', 'launchAngleLabel')
      .attr('d', function (d) { return d; })
      .style('fill', 'none');

  laLabel.transition().duration(400)
    .attr('d', function (d) { return d; });

  // exit velocity label
  const evLabel = svg.selectAll('#exitVelocityLabel')
    .data([exitVelocityTextPath]);

  evLabel.enter()
    .append('path')
      .attr('id', 'exitVelocityLabel')
      .attr('d', function (d) { return d; })
      .style('fill', 'none');

  evLabel.transition().duration(400)
    .attr('d', function (d) { return d; });

  const wedges = svg.selectAll('.wedge')
      .data(pied);

  // insert new wedges
  const newWedges = wedges.enter()
    .append('g')
      .attr('class', 'wedge');

  // draw wedge sub-sections
  radialSections.forEach((radius, i) => {
    wedges.select('.arc' + i)
      .transition()
      .duration(400)
      .attrTween('d', arcTween(radius));

    newWedges.append('path')
      .attr('class', 'arc' + i)
      // need a function here because of this binding
      .each(function (d) {
        d.innerRadius = radius.innerRadius;
        d.outerRadius = radius.outerRadius;

        d.woba = lookupWoba(leagueProduction, {
          evMin: radius.evMin,
          evMax: radius.evMax,
          laMin: d.data.laMin,
          laMax: d.data.laMax
        });

        // store current for second transition interpolation
        this._current = Object.assign({}, d, radius);
      })
      .attr('d', d3.arc())
      .style('fill', function (d) { return color(d.woba); });
  });

  // plot points
  const points = svg.selectAll('.bip')
    .data(
      plotted
        .map(polarToGrid)
        .map(d => Object.assign({}, d, {
          bipClass: bipTypeClass(d)
        }))
      );

  points.enter()
    .append('circle')
      .attr('class', function (d) { return 'bip ' + d.bipClass; })
      .attr('cx', d => d.x)
      .attr('cy', d => d.y)
      .attr('r', 2)
      .style('opacity', 0)
      .on('mouseover', function (d) { setTooltip(Object.assign({}, d)); })
      .on('mouseout', function (d) { setTooltip({}); })
      .transition()
      .delay(300)
      .duration(300)
      .style('opacity', 1);

  points.transition().duration(100)
      .style('opacity', 0)
      .transition().duration(0)
      .attr('class', function (d) { return 'bip ' + d.bipClass; })
      .attr('cx', d => d.x)
      .attr('cy', d => d.y)
      .transition().delay(200).duration(300)
      .style('opacity', 1);

  points.exit().remove();
}

function mapToChart (rBuckets, rMinMax, thetaBuckets, thetaMinMax, velAngles) {
  const rMapper = merge(rBuckets, rMinMax);
  const thetaMapper = merge(thetaBuckets, thetaMinMax);

  return velAngles.map(v => Object.assign(
    {
      r: mapValue(rMapper, v.velocity),
      theta: mapValue(thetaMapper, v.angle)
    },
    v
  ));

  function mapValue (mapper, value) {
    const fit = mapper.find(m => m.fits(value) ? m : null);
    const scalar = fit.interpolate(value);

    return scalar * (fit.max - fit.min) + fit.min;
  }
}

function merge (arr1, arr2) {
  if (arr1.length !== arr2.length) {
    throw new Error('merging arrays of differing length');
  }

  return arr1.map((a, i) => Object.assign({}, a, arr2[i]));
}

export {
  scaleAndDraw as render
};
