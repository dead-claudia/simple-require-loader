/* eslint strict: [2, "global"] */
/* eslint-env node */
"use strict"

// Create a minified release version of a file. Input is stdin, output is
// stdout.

var cp = require("child_process")
var path = require("path")
var pkg = require("./package.json")

process.stdout.write(
    "/*" + pkg.name + " " + pkg.version +
    " - Copyright (c) 2016-current, Isiah Meadows. " +
    "Licensed under the ISC License.*/")

var uglify = path.resolve(__dirname, "node_modules/.bin/uglifyjs")
var res = cp.spawnSync(uglify, ["-cm"], {stdio: "inherit"})
if (res.error != null) throw res.error
process.exit(res.status)
