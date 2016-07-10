'use test'
var test = require('tap').test
var ReadModuleTree = require('../index.js')
var path = require('path')

test('start', function (t) {
  var rmt = new ReadModuleTree(path.resolve(__dirname, '..'))
  t.ok(rmt)
  var tryPause = false
  rmt.on('data', function (node) {
    if (node.error) console.error(node.error)
    t.ok(node, node.path)
    if (!tryPause) {
      tryPause = true
      rmt.pause()
      setTimeout(function () { rmt.resume() }, 200)
    }
  })
  .on('error', function (err) {
    t.exception(err)
    t.end()
  })
  .on('end', function () {
    t.pass()
    t.end()
  })
})
