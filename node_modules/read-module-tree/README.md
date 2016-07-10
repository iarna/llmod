# read-module-tree

By contrast with `read-package-tree`, this reads a tree of modules as
understood by node itself. A valid module can just have an `index.js` with
no metadata– not a valida package, but absolutely a valid module.

Also by contrast with `read-package-tree` this does not return a tree,
instead it streams an ordered list of modules. And that order is breadth
first, alphabetized by `localeCompare`. The first node emitted will always
be the top of the tree.

## Usage

```
var readModuleTree = require('read-module-tree')
var through2 = require('through2')
new readModuleTree().pipe(through2(function (module, next) {
  console.log(module.name)
  console.log(module.path)
  next()
})
```
