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
 * This is a primitive JS module loader that only supports local modules.
 */

this.r || (function (global, modules, factories) { // eslint-disable-line
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

    global.r = {
        define: function (name, impl) {
            // Namespace clashes should be detected in a regular define.
            if (name in modules) {
                throw Error("Module already defined: " + name)
            }

            modules[name] = {}
            factories[name] = impl
        },

        require: function (name) {
            if (!(name in modules)) {
                throw Error("Could not find module: " + name)
            }

            init(name)
            return modules[name]
        },

        unload: function (name) {
            delete modules[name]
            // This probably doesn't exist, but just in case
            delete factories[name]
        },

        redefine: function (name, impl) {
            modules[name] = {}
            factories[name] = impl
            init(name)
        }
    }
})(this)
