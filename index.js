#!/usr/bin/env node
'use strict'
var path = require('path')
var argv = require('yargs')
  .usage('Usage: $0 [dir]\nList javascript source and node modules contained in the directory.')
  .demand(0, 1)
  .argv
var fs = require('fs')
var ReadModuleTree = require('read-module-tree')
var through2 = require('through2')
var hasUnicode = require('has-unicode')
var archy = require('archy')
var Find = require('psilotum')
var color = require('console-control-strings').color

var top = argv._[0] || '.'
var namebits = path.resolve(top).split(path.sep)
var name = namebits.pop()
var parent = namebits.pop()
var tree = {
  name: parent[0] === '@' ? parent + '/' + name : name,
  children: {}
}

// Fill the tree with plain javascript:

Find(top, {filter: matchJsFiles})
  .on('data', function (file) {
    var relative = path.relative(top, file.path).split(path.sep)
    var filename = relative.pop()
    var branch = tree.children
    var cwd = ''
    var dir
    while (dir = relative.shift()) {
      cwd = path.join(cwd, dir)
      if (!branch[dir]) branch[dir] = {
        type: 'directory',
        name: cwd,
        children: {}
      }
      branch = branch[dir].children
    }
    if (file.stat.isDirectory()) {
      branch[filename] = {
        name: path.relative(top, file.path),
        type: 'directory',
        children: {}
      }
    } else {
      branch[filename] = {
        name: path.relative(top, file.path),
        type: 'local'
      }
    }
  })
  .on('error', function (err) {
    console.error(err.message)
    process.exit(1)
  })
  .on('end', thenReadModuleTree)

function matchJsFiles (file, parent, cb) {
  if (file.basename === 'node_modules' || /^[.]/.test(file.basename)) {
    return cb(null, Find.Skip)
  } else if (/[.]js$/.test(file.basename)) {
    return cb(null, Find.Include)
  } else if (file.stat.isDirectory()) {
    return cb(null, Find.Recurse)
  } else {
    return cb(null, Find.Skip)
  }
}

// Fill the tree with node modules
function thenReadModuleTree () {
  new ReadModuleTree(top)
    .pipe(SkipDotModules())
    .pipe(ReadPackageMetadata())
    .on('data', function (mod) {
      // top level is special
      if (mod.modulepath === '/') {
        tree.type = mod.package ? (mod.package.private ? 'private' : 'public') : 'local',
        tree.name = mod.name,
        tree.version = mod.package && mod.package.version
        return
      }
      var modpath = mod.modulepath.split('/').slice(1, mod.name[0] === '@' ? -2 : -1)
      if (!tree.children.node_modules) tree.children.node_modules = {
        name: 'node_modules',
        children: {}
      }
      var branch = tree.children.node_modules
      var parent
      while (parent = modpath.shift()) {
        if (parent[0] === '@') parent = parent + '/' + modpath.shift()
        branch = branch.children[parent]
      }
      branch.children[mod.name] = {
        type: mod.package ? (mod.package.private ? 'private' : 'public') : 'local',
        name: mod.name,
        path: mod.path,
        link: mod.isLink && path.relative(mod.path, mod.realpath),
        version: mod.package && mod.package.version,
        children: {}
      }
    })
    .on('error', function (err) {
      console.error(err)
      process.exit(1)
    })
    .on('end', thenPrintTheTree)
}

// Pretty print the tree
function thenPrintTheTree () {
  process.stdout.write(archy(archyize(tree), '', { unicode: hasUnicode() }))
}

function archyize (tree) {
  var label = ''
  if (tree.package && tree.package.name) {
    label += tree.package.name
  } else if (tree.name) {
    label += tree.name
  }
  if (tree.version) label += '@' + tree.version
  if (tree.type && tree.type !== 'directory') label += (label ? ' ' : '') + colorType(tree.type)
  if (tree.link) {
    label += (label ? ' ' : '') + color('italic') + '→ ' + tree.link + color('stopItalic')
  }
  var children = tree.children
    ? Object.keys(tree.children).map(function (name) { return tree.children[name] })
    : []
  return {
    label: label,
    nodes: children.sort(byName).map(archyize)
  }
}

function byName (aa, bb) {
  var aaName = (aa.package && aa.package.name) || aa.name || ''
  var bbName = (bb.package && bb.package.name) || bb.name || ''
  // node modules always goes at the bottom
  if (aaName === 'node_modules') return 1
  if (bbName === 'node_modules') return -1
  return aaName.localeCompare(bbName)
}

function colorType (type) {
  if (type === 'public') {
    return color('bold','brightWhite') + type + color('reset')
  } else if (type === 'private') {
    return color('bold','brightGreen') + type + color('reset')
  } else if (type === 'local') {
    return color('bold','brightYellow') + type + color('reset')
  } else if (type === 'empty') {
    return color('bold','brightRed') + type + color('reset')
  } else {
    return type
  }
}

function SkipDotModules () {
  return through2.obj(function (mod, _, cb) {
    if (/^[^.]/.test(mod.name)) {
      this.push(mod)
    }
    cb()
  })
}

function ReadPackageMetadata () {
  return through2.obj(function (mod, _, cb) {
    var self = this
    fs.readFile(path.join(mod.path, 'package.json'), 'utf8', function (err, pkg) {
      if (err) {
        mod.error = err
      } else {
        try {
          mod.package = JSON.parse(pkg)
        } catch (ex) {
          mod.error = ex
        }
      }
      self.push(mod)
      cb()
    })
  })
}
