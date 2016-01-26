/* eslint-env browser */

(function () {
    "use strict"

    if (!window.Worker) return

    function constructError(value) {
        // Get the constructor for this error.
        var C = window[value.name]
        if (typeof C !== "function") C = Error

        var ret = new C(value.message)
        ret.name = value.name

        // If this is ever not the case, it's a bug in this library or the tests
        // for it.
        ret.stack = value.stack

        return ret
    }

    function deserialize(value) {
        switch (value.type) {
        case "error": return constructError(value)
        case "other": return value.value
        default: throw new Error("unreachable")
        }
    }

    function attempt(f, data, args) {
        args = args.map(deserialize)
        var done = data.done || data.errback

        // Prevent duplicate calls to `done`
        if (f === done) return done.apply(null, args)

        try {
            f.apply(null, args)
            done()
        } catch (e) {
            done(e)
        }
    }

    var worker = new Worker("worker-bootstrap.js")

    var datas = {}
    var ids = 0

    function run(res, name) {
        var data = datas[res.id]
        datas[res.id] = null
        return attempt(data[name], data, res.args)
    }

    var waiting = true
    var callback

    worker.onmessage = function (e) {
        switch (e.data.type) {
        case "return": return run(e.data, "callback")
        case "error": return run(e.data, "errback")
        case "init":
            // Because GC isn't perfect.
            waiting = false
            if (callback) {
                var ref = callback
                callback = null
                return ref()
            }
            return

        default: throw new Error("Unknown type: " + e.data.type)
        }
    }

    window.waitForWorker = function (done) {
        if (!waiting) return done()
        callback = done
    }

    window.callWorker = function (init, callback, errback, done) {
        var id = ids++
        datas[id] = {
            callback: callback,
            errback: errback,
            done: done
        }

        if (Array.isArray(init)) init = init.join("\n")

        worker.postMessage({id: id, callback: init})
    }
})()
