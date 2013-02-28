var Benchmark = require('benchmark');
var Polygon = require('polygon');
var offset = require('../offset');
var suite = new Benchmark.Suite();
var Vec2 = require('vec2');

suite.add('offset square', function() {
  offset([
    Vec2(20, 25),
    Vec2(20, 400),
    Vec2(400, 400),
    Vec2(400, 25)
  ], 25);
});

suite.add('offset square negative', function() {
  offset([
    Vec2(20, 25),
    Vec2(20, 400),
    Vec2(400, 400),
    Vec2(400, 25)
  ], -25);
});


suite.on('cycle', function(event) {
  console.log(''+event.target);
});

suite.on('complete', function() {
  console.log('Fastest is ' + this.filter('fastest').pluck('name'));
})

suite.run({ async : true });