# Simple module loader

[![Build Status](https://travis-ci.org/isiahmeadows/simple-require-loader.svg?branch=master)](https://travis-ci.org/isiahmeadows/simple-require-loader)

This is a simple JS loader that can dynamically load files as well as support multiple modules within a single file. It also supports hot swapping. This plus its 510-byte minified+gzipped size (562 bytes with worker support) makes it a pretty nice solution for a simple module system. Also, it's one of the smallest loaders I know of, yet has more features than most other module loaders its size.

## Features

- Highly unopinionated
- Hot swapping support via `r.redefine()`
- Lazy instantiation
- Optional asynchronous file loading support
- Node-like cyclic dependency handling
- Supports browsers and workers
- Very small (510 bytes minified + gzipped, 562 with worker support)
    - Without file loading support: 335 bytes minified + gzipped
- Easy bundling with concatenation
- Thoroughly tested

## Example Usage

```html
<!doctype html>
<meta charset="utf-8">
<!-- Include this utility. -->
<script src="browser.js"></script>
<script>
// Alias these utilities, calling their respective methods to detach them from
// the global object.
r.load("/jquery.min.js", function (err) {
    if (err) return
    r.redefine("jquery", $.noConflict)
})

r.load("/underscore.min.js", function (err) {
    if (err) return
    r.redefine("underscore", _.noConflict)
})

// Define a few modules
r.define("foo", function (exports) { return "default export" })

r.define("assert", function (exports) {
    return function assert(condition, message) {
        if (!condition) throw new Error(message)
    }
})

r.define("main", function () {
    var assert = r.require("assert")

	assert(r.require("foo") === "default export",
        "default exports are read correctly")

    r.load("page/base", "/page.js", function (err, BaseComponent) {
        if (err != null) return displayError(err)
        renderComponent(document.getElementById("body"), BaseComponent)
    })

	r.redefine("assert", function () {
        return function assert() {
            return true
        }
    })

    r.unload("bad-module")
})

// You have to explicitly initialize the main module.
r.require("main")
</script>
```

## Documentation

**r.define("module-name", impl)**

- `"module-name"` is the name of your module. Anything that can be an object key works, really. Even multi-line strings or ES6 symbols work.
- `impl` is the function to initialize the module. It's called by need with one argument: `exports`, which acts a lot like CommonJS's and AMD's `exports` variable

If `"module-name"` is already defined, this throws a synchronous error.

**r.require("module-name")**

Require `"module-name"` CommonJS-style. This throws an error if the module is not defined.

**r.unload("module-name")**

Unload `"module-name"` if it was previously loaded. This silently fails if the module doesn't exist.

**r.redefine("module-name", impl)**

Redefine an existing module. If the module was already instantiated, this will synchronously re-initialize it with the new function.

- `"module-name"` is the name of the module.
- `impl` is the function to initialize the module.

**r.load("module-name", "/remote-resource", callback?)**
**r.load("/remote-resource", callback?)**

*Note: This is not available in `local.js`.*

- `"module-name"` is the name of the module to call `callback` with
- `"/remote-resource"` is the name of the remote resource to get. It is assumed to contain only JavaScript.
- `callback` is a required Node-style callback, called with the following arguments:

    - `err`, the unmodified error if one occurred when either getting the module or initializing it, or `null` otherwise. In browsers, if the script failed to load, then this is the corresponding `error` event.
    - `data`, the result of requiring `"module-name"`, or `undefined` if no such module was defined, or if the module name itself is `null` or not given.

The callback is always called asynchronously.

## Versions

There are three versions of this API:

- `browser.js` for standard browsers. Scripts are loaded via `script` elements appended to the body.
- `combined.js` for both browsers and web workers. Scripts are loaded via `script` elements appended to the body in the main thread, and via `importScripts` in workers.
- `local.js`, which sacrifices file loading support for a significant reduction in size and wider compatibility (it should be runnable in even Netscape 3).

Each of these has a minified variant within this repo as well, generated via `npm run minify`.

Here's a size comparison in bytes for each file at the time of writing:

File            | Size | Gzipped
----------------|------|--------
combined.js     | 3718 | 1309
browser.js      | 3021 | 1229
local.js        | 2153 | 974
combined.min.js | 1142 | 562
browser.min.js  | 968  | 510
local.min.js    | 548  | 335

*Note that these include the copyright header.*

## Contributing

Pull requests are always welcome. Mocha is used for tests, and Chai for assertions.

- `npm test` - Lint this with ESLint and run the tests in PhantomJS. This doesn't run the worker tests, as PhantomJS doesn't support those. Also note that this runs them with the `file:` protocol.
- `npm run minify` - Regenerate the minified variants with UglifyJS2. This is done through minify.js in the project root.

Do note that when running the tests, the browser (or PhantomJS) *will* rightly complain about missing files. If it's about `test/fixtures/missing.js`, that's intentional, and you don't have to worry.

And do check out [http-server](https://www.npmjs.com/package/http-server). It will make testing smaller browser things much easier. I use that to load the web pages here for testing.

## License

ISC License

Copyright (c) 2016-current, Isiah Meadows.

Permission to use, copy, modify, and/or distribute this software for any purpose with or without fee is hereby granted, provided that the above copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
