/* eslint-env browser */

/**
 * Copyright (c) 2016-current, Isiah Meadows.
 *
 * Permission to use, copy, modify, and/or distribute this software for any
 * purpose with or without fee is hereby granted, provided that the above
 * copyright notice and this permission notice appear in all copies.
 *
 * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
 * REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
 * AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
 * INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
 * LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
 * OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
 * PERFORMANCE OF THIS SOFTWARE.
 */

/**
 * This is a primitive JS module loader that supports dynamic script loading.
 */

window.r || (function (r, modules, factories) { // eslint-disable-line
    "use strict"

    function noop() {}
    noop.prototype = null

    modules = new noop()
    factories = new noop()

    function init(name, res) {
        if (!(name in factories)) return
        res = factories[name]
        delete factories[name]
        res = res(modules[name])
        if (res != null) modules[name] = res
    }

    r.define = function (name, impl) {
        // Namespace clashes should be detected in a regular define.
        if (name in modules) {
            throw Error("Module already defined: " + name)
        }

        modules[name] = {}
        factories[name] = impl
    }

    r.require = function (name) {
        if (!(name in modules)) {
            throw Error("Could not find module: " + name)
        }

        init(name)
        return modules[name]
    }

    r.unload = function (name) {
        delete modules[name]
        // This probably doesn't exist, but just in case
        delete factories[name]
    }

    r.redefine = function (name, impl) {
        modules[name] = {}
        factories[name] = impl
        init(name)
    }

    r.load = function (ns, name, callback) {
        if (typeof name === "function") {
            callback = name
            name = ns
            ns = null
        }

        var el = document.createElement("script")
        el.async = el.defer = true
        el.src = name

        el.onload = function (ev) {
            (ev = ev || event).preventDefault()
            ev.stopPropagation()

            // Remove the node after it loads.
            document.body.removeChild(el)

            try {
                init(ns)
            } catch (e) {
                return callback(e)
            }

            callback(null, modules[ns])
        }

        el.onerror = function (ev) {
            (ev = ev || event).preventDefault()
            ev.stopPropagation()

            // Remove the node after it loads.
            document.body.removeChild(el)

            callback(ev)
        }

        document.body.appendChild(el)
    }
})(window.r = {})
