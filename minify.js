/* eslint-disable no-process-exit */
/* eslint-env node */
"use strict"

// Regenerate the minified release variants.
var resolve = require("path").resolve.bind(null, __dirname)
var cp = require("child_process")
var pkg = require("./package.json")

function spawn(file) {
    var res = cp.spawnSync(resolve("node_modules/.bin/uglifyjs"), [
        "--preamble", "/*" + pkg.name + " " + pkg.version +
            " - Copyright (c) 2016-current, Isiah Meadows. " +
            "Licensed under the ISC License.*/",
        "--screw-ie8", "false",
        "-cmo", resolve(file + ".min.js"),
        resolve(file + ".js")
    ], {stdio: "inherit"})

    if (res.error != null) throw res.error
    if (res.status) process.exit(res.status)
}

spawn("r")
spawn("local")
