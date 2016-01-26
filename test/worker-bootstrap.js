/* eslint strict: [2, "global"] */
/* eslint-env worker */
"use strict"

// This is the worker end of the bootstrapping process for the worker tests.

importScripts("../combined.js")

function makeFunction(str, done, error) {
    /* eslint-disable no-new-func */
    new Function("r, done, error", str)(self.r, done, error)
    /* eslint-enable no-new-func */
}

// Error instances need serialized through the structured clone algorithm, since
// passing them like any other object causes errors to be thrown.
function serialize(value) {
    if (value instanceof Error) {
        return {
            type: "error",
            name: value.name,
            message: value.message,
            stack: value.stack
        }
    } else {
        return {
            type: "other",
            value: value
        }
    }
}

self.onmessage = function (e) {
    var data = e.data
    var called = false
    function done() {
        if (called) return
        called = true

        var args = []
        for (var i = 0; i < arguments.length; i++) {
            args.push(serialize(arguments[i]))
        }

        postMessage({
            type: "return",
            id: data.id,
            args: args
        })
    }

    function error(err) {
        if (called) return
        called = true
        postMessage({
            type: "error",
            id: data.id,
            args: [serialize(err)]
        })
    }

    try {
        makeFunction(data.callback, done, error)
    } catch (err) {
        error(err)
    }
}

postMessage({type: "init"})
