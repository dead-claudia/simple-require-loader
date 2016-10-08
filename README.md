# Simple module loader

A simple, dynamic, powerful module loader with hot swapping and optional remote loading support.

[![Build Status](https://travis-ci.org/isiahmeadows/simple-require-loader.svg?branch=master)](https://travis-ci.org/isiahmeadows/simple-require-loader)

This is a simple JS loader that can dynamically load files as well as support multiple modules within a single file. It also supports hot swapping. This plus its 528-byte minified+gzipped size makes it a pretty nice solution for a simple module system if you need one. Also, it's one of the smallest module loaders I know of, yet compares feature-wise to ones over 3 times its size (1.5+ kilobytes).

## Features

- Concise syntax
- Namespaced modules with optional default exports
- Hot swapping and introspection
- Lazy, synchronous instantiation
- Optional asynchronous, dynamic remote loading support
- Node-like cyclic dependency handling
- Very small (528 bytes minified + gzipped, 340 without remote loading support)
- Fully supports both browsers and workers (and shells, but without remote loading support)
- Easy bundling with concatenation or whatever else you like
- Thoroughly tested

## Example Usage

```html
<!-- Include this -->
<script src="r.min.js"></script>
<script>
// Alias these utilities, calling their respective methods to detach them from
// the global object. Once they're both loaded, load the main module. Note that
// it's just another module - it doesn't magically load like an inline
// `<script>` element.
var remaining = 2

r.load("/jquery.min.js", function (err) {
    if (err) return console.error(err)
    r.module("jquery", $.noConflict())
    if (--remaining) r.require("main")
})

r.load("/lodash.min.js", function (err) {
    if (err) return console.error(err)
    r.module("lodash", _.noConflict())
    if (--remaining) r.require("main")
})

// Define a few modules - not loaded yet!
r.define("foo", function () { return "default export" })
r.define("bar", function (exports) { exports.named = "named export" })

r.define("assert", function () {
    return function assert(condition, message) {
        if (!condition) throw new Error(message)
    }
})

// Define our main module
r.define("main", function () {
    // Load an `assert` module
    var assert = r.require("assert")
    var $ = r.require("jquery")
    var _ = r.require("lodash")

    // And use its export
	assert(r.require("foo") === "default export",
        "default exports are read correctly")

    assert(_.matches(r.require("bar"), {named: "named export"}),
        "named exports are read correctly")

    // Load a remote module and immediately use it
    r.load("page/base", "/page.js", function (err, BaseComponent) {
        if (err != null) return displayError(err)
        renderComponent($("#body").get(0), BaseComponent)
    })

    // Hot-swap an existing module
    r.unload("assert")
	r.define("assert", function () {
        return function assert() {
            return true
        }
    })

    // Hot-unload an existing module
    r.unload("bad-module")
})
</script>
```

## Documentation

**r.defined("module-name")**

Check if `"module-name"` is defined (regardless of whether it is loaded or not).

**r.required("module-name")**

Check if `"module-name"` has been defined *and* loaded.

**r.unload("module-name")**

Unload `"module-name"` if it was previously loaded. If there was no such module, this does nothing (no need to remove non-existent modules).

**r.require("module-name")**

Require `"module-name"` CommonJS-style. This throws an error if the module is not defined.

- `"module-name"` is the name of the module.
- `impl` is the function to initialize the module.

**r.module("module-name", impl)**

Define an already-instantiated module. It's equivalent to the following below, but much simpler under the hood:

```js
r.define("module-name", function () { return impl })
r.require("module-name")
```

- `"module-name"` is the name of your module. Anything that can be an object key works, really. Even multi-line strings or ES6 symbols work.
- `impl` is the actual exported value of the module, or `{}` if it is `null`/`undefined`.

If `"module-name"` is already defined, this throws an error.

**r.define("module-name", impl)**

- `"module-name"` is the name of your module. Anything that can be an object key works, really. Even multi-line strings or ES6 symbols work.
- `impl` is the function to initialize the module. It's called by need with one argument: `exports`, which acts a lot like CommonJS's and AMD's `exports` variable.

If `impl` returns anything other than `null`/`undefined`, that return value is used as the export.

If `"module-name"` is already defined, this throws an error.

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

There are two versions of this API (and `\*.min.js` minified variants):

- `r.js` for browsers and web workers. Scripts are loaded via `script` elements appended to the body in the main thread, and via `importScripts` in workers.
- `local.js`, which sacrifices file loading support for a significant reduction in size and wider compatibility (it is pure ES5, with no native or runtime-specific dependency).

Each of these has a minified variant within this repo as well, generated via `npm run minify`.

Here's a size comparison in bytes for each file (complete with license header) at the time of writing:

File         | Size | Gzipped
-------------|------|--------
r.js         | 4066 | 1279
local.js     | 2405 | 933
r.min.js     | 1126 | 528
local.min.js | 665  | 340

## Contributing

If you found a bug, [please tell me](https://github.com/isiahmeadows/simple-require-loader)! I'd like to make sure things remain in *working* order.

Pull requests are always welcome. Mocha is used for tests, and Chai for assertions.

- If you haven't already, [install Node and `npm`](https://nodejs.org).
- `npm test` - Lint this with ESLint and run the tests in PhantomJS. This doesn't run the worker tests, as PhantomJS doesn't support those. Also note that this runs them with the `file:` protocol.
- `node minify` - Regenerate the minified variants with UglifyJS2.

Do note that when running the tests, the browser (or PhantomJS) *will* rightly complain about missing files. If it's about `test/fixtures/missing.js`, that's intentional, and you don't have to worry.

Note that the two files are separately written, to minimize minified+gzipped file size.

And do check out [http-server](https://www.npmjs.com/package/http-server). It will make testing smaller browser things much easier. I use that to load the web pages here for testing.

## License

[ISC License](https://github.com/isiahmeadows/simple-require-loader/blob/master/LICENSE.md)
