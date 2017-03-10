import * as d3 from 'd3';

const width = 960;
const height = 700;
const chartRadius = 800;
const arcLength = Math.PI / 4;

// init
d3.select('#graph').append('svg')
    .attr('width', width)
    .attr('height', height)
  .append('g')
    .attr('transform', 'translate(' + Math.min(0, width - chartRadius - 10) + ',' + height / 2 + ')');

const polarToGrid = polar => {
  const x = Math.sin(polar.theta) * polar.r;
  const y = -Math.cos(polar.theta) * polar.r;

  return { x, y };
};

const color = d3.scaleLinear()
  .domain([0, 1.0, 1.5])
  .range(['white', 'orange', 'green']);

const pie = d3.pie()
    .startAngle(0)
    .endAngle(arcLength)
    .sort(null)
    .value(function (d) { return Math.max(5, d.sampleSize); });

// last in wins
const distinctByKey = (dataArray, keyGenerator) => {
  const distinctMap = dataArray
    .reduce((agg, datum) => {
      agg[keyGenerator(datum)] = datum;
      return agg;
    }, {});

  return Object.keys(distinctMap).map(key => distinctMap[key]);
};

const angleLimits = performanceData => {
  return distinctByKey(performanceData, p => p.laMin + ':' + p.laMax)
    .map(p => Object.assign({
      laMin: p.laMin,
      laMax: p.laMax
    }))
    .sort((a, b) => a.laMin - b.laMin);
};

const velocityLimits = performanceData => {
  return distinctByKey(performanceData, p => p.evMin + ':' + p.evMax)
    .map(p => Object.assign({
      evMin: p.evMin,
      evMax: p.evMax
    }))
    .sort((a, b) => a.evMin - b.evMin);
};

const buildBucketer = (sortedLimits, getMin, getMax) => {
  const bucketer = new Array(sortedLimits.length);
  const first = sortedLimits[0];
  const last = sortedLimits[sortedLimits.length - 1];

  bucketer[0] = Object.assign({
    label: '< ' + getMax(first),
    fits: angle => angle < getMax(first),
    interpolate: () => 0.5
  }, first);

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
      label: min + '-' + max,
      fits: input => input >= min && input < max,
      interpolate: input => (input - min) / (max - min)
    }, limit);
  }

  return bucketer;
};

const scaleAndDraw = (function () {
  let leagueProdFetched = false;
  let leagueLaScale;
  let leagueEvScale;
  let laBucketer;
  let evBucketer;
  let leagueProduction;

  const drawScaled = (scaleType, bipData) => {
    if (scaleType === 'player') {
      draw(
        angleBucket(bipData, laBucketer),
        velocityBucket(bipData, evBucketer),
        leagueProduction,
        bipData
      );
    } else if (scaleType === 'league') {
      draw(
        leagueLaScale,
        leagueEvScale,
        leagueProduction,
        bipData
      );
    } else {
      console.log('Unknown scale type', scaleType);
    }
  };

  return (scaleType, bipData) => {
    if (leagueProdFetched) {
      drawScaled(scaleType, bipData);
    } else {
      // fetch and parse league production data
      d3.json('./league/production.json', (err, production) => {
        if (err) {
          throw err;
        }

        leagueProdFetched = true;

        leagueProduction = production;

        laBucketer = buildBucketer(
          angleLimits(production),
          p => p.laMin,
          p => p.laMax);

        evBucketer = buildBucketer(
          velocityLimits(production),
          p => p.evMin,
          p => p.evMax);

        leagueLaScale = laBucketer.map(b => {
          const sampleSize = production
            .filter(lp => lp.laMin === b.laMin && lp.laMax === b.laMax)
            .reduce((agg, lp) => agg + lp.abs, 0);

          return Object.assign({}, b, {sampleSize});
        });

        leagueEvScale = evBucketer.map(b => {
          const sampleSize = production
            .filter(lp => lp.evMin === b.evMin && lp.evMax === b.evMax)
            .reduce((agg, lp) => agg + lp.abs, 0);

          return Object.assign({}, b, {sampleSize});
        });

        drawScaled(scaleType, bipData);
      });
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
  const ssAccessor = accessor || (d => d.sampleSizes);
  const sum = bucketed
    .map(ssAccessor)
    .reduce((agg, part) => agg + part, 0);
  const sections = [];

  let runningSum = 0;

  bucketed.forEach(bucket => {
    const sampleSize = ssAccessor(bucket);

    const innerScaled = runningSum / sum;
    const outerScaled = (runningSum + sampleSize) / sum;

    const innerRadius = shiftArc(innerScaled) + 2;
    const outerRadius = shiftArc(outerScaled);

    sections.push(Object.assign({
      cornerRadius: 4,
      innerRadius,
      outerRadius
    }, bucket));

    runningSum += sampleSize;
  });

  return sections;
}

function shiftArc (scaled) {
  return scaled * (chartRadius * 0.7) + (chartRadius * 0.3);
}

function calculatePied (bucketed) {
  const pied = pie(bucketed);

  const {startAngle} = pied.find(p => p.data.label.startsWith('10') ? p : null);

  // rotate the chart so that ground balls (< 10 degrees) have a negative angle
  const piedShifted = pied.map(p => {
    p.startAngle = (p.startAngle - startAngle) * (-1) + (Math.PI / 2);
    p.endAngle = (p.endAngle - startAngle) * (-1) + (Math.PI / 2);

    return p;
  });

  return piedShifted;
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

function draw (angles, velocities, leagueProduction, velAngles) {
  const radialSections = calculateRadii(velocities, d => Math.max(d.sampleSize, 5));
  const pied = calculatePied(angles);
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

  const svg = d3.select('#graph svg g');

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
    .data(plotted.map(polarToGrid));

  points.transition()
    .duration(400)
    .attr('cx', d => d.x)
    .attr('cy', d => d.y);

  points.enter()
    .append('circle')
    .attr('class', 'bip')
    .attr('cx', d => d.x)
    .attr('cy', d => d.y)
    .attr('r', 2)
    .style('opacity', 0)
    .transition()
    .delay(300)
    .duration(600)
    .style('opacity', 1);

  points.exit().remove();
}

function mapToChart (rBuckets, rMinMax, thetaBuckets, thetaMinMax, velAngles) {
  const rMapper = merge(rBuckets, rMinMax);
  const thetaMapper = merge(thetaBuckets, thetaMinMax);

  return velAngles.map(v => Object.assign({
    r: mapValue(rMapper, v.velocity),
    theta: mapValue(thetaMapper, v.angle)
  }));

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
