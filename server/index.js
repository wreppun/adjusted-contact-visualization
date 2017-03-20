const express = require('express');
const {db} = require('./db');
const {rename} = require('./utils');

const app = express();

app.get('/batter/:batter', (req, res) => {
  db('exit_velocity')
    .select('hit_speed', 'hit_angle', 'is_bip_out', 'result', 'xwoba')
    .where('batter', req.params.batter)
    .map(rename([
      {
        from: 'hit_speed',
        to: 'velocity'
      },
      {
        from: 'hit_angle',
        to: 'angle'
      },
      {
        from: 'is_bip_out',
        to: 'isOut'
      }
    ]))
    .then(results => {
      res.set('Access-Control-Allow-Origin', 'http://localhost:8082');
      res.set('Vary', 'Origin');
      res.send(results);
    })
    .catch(error => {
      console.log('failed to retrieve: ', JSON.stringify(req), 'error', error);
    });
});

app.use(express.static('public'));

app.listen(3714, 'localhost', () => {
  console.log('listening on ' + 3714);
});
