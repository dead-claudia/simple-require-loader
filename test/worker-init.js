/* eslint-env browser */

(function () {
    "use strict"

    if (!window.Worker) return

    // Error instances need serialized through the structured clone algorithm,
    // since passing them like any other object causes errors to be thrown.
    function deserialize(value) {
        if (value.type === "error") {
            // Try to recreate the native equivalent.
            var C = window[value.name]
            var ret

            if (typeof C === "function") {
                ret = new C(value.message)
                ret.stack = value.stack
                C = Error
            } else {
                ret = new Error(value.message)
                ret.name = value.name
                ret.stack = value.stack
            }

            return ret
        } else if (value.type === "other") {
            return value.value
        } else {
            throw new Error("unreachable")
        }
    }

    var worker = new Worker("worker-bootstrap.js")

    var datas = {}
    var ids = 0

    function run(res, name) {
        var data = datas[res.id]

        datas[res.id] = null

        var done = data.done
        var f = data[name] || done
        var args = res.args

        for (var i = 0; i < args.length; i++) {
            args[i] = deserialize(args[i])
        }

        try {
            f.apply(null, args)
            return done()
        } catch (e) {
            return done(e)
        }
    }

    var waiting = true
    var callback

    worker.onmessage = function (e) {
        switch (e.data.type) {
        case "return":
            if (waiting) throw new Error("Still waiting on worker!")
            return run(e.data, "callback")

        case "error":
            if (waiting) throw new Error("Still waiting on worker!")
            return run(e.data, "errback")

        case "init":
            // Because GC isn't perfect.
            waiting = false
            if (callback) {
                var ref = callback

                callback = null
                return ref()
            }
            return undefined

        default: throw new Error("Unknown type: " + e.data.type)
        }
    }

    window.waitForWorker = function (done) {
        if (!waiting) return done()
        callback = done
        return undefined
    }

    window.callWorker = function (done, init, callback, errback) {
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
