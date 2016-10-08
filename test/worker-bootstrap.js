/* eslint-env worker */

// This is the worker end of the bootstrapping process for the worker tests.
(function () {
    "use strict"

    importScripts("../r.js", "./factory.js")

    // Error instances need serialized through the structured clone algorithm,
    // since passing them like any other object causes unwanted errors to be
    // thrown.
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

    function type(value) {
        if (typeof value !== "object") return typeof value
        if (value === null) return "null"
        if (Array.isArray(value)) return "array"
        return "object"
    }

    self.onmessage = function (e) {
        var data = e.data
        var called = false

        function send(type) {
            return function () {
                if (called) return
                called = true

                // Error instances need serialized through the structured clone
                // algorithm, since passing them like any other object causes
                // unwanted errors to be thrown.
                var args = []

                for (var i = 0; i < arguments.length; i++) {
                    args.push(serialize(arguments[i]))
                }

                postMessage({
                    type: type,
                    id: data.id,
                    args: args
                })
            }
        }

        try {
            /* eslint-disable no-new-func */

            var func = new Function("r, type, name, error, done", data.callback)

            /* eslint-enable no-new-func */

            func(self.r, type, self.factory(), send("error"), send("return"))
        } catch (err) {
            send("error")(err)
        }
    }

    postMessage({type: "init"})
})()
