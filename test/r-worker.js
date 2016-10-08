/* eslint-env mocha, browser */
/* global chai, waitForWorker, callWorker */
describe("worker", function () { // eslint-disable-line max-statements, max-len
    "use strict"

    if (typeof Worker !== "function") {
        self.it.skip("isn't supported", function () {
            // do nothing here.
        })

        return
    }

    var expect = chai.expect

    function it(name, src, callback, errback) {
        self.it(name, function (done) {
            callWorker(done, src, callback, errback)
        })
    }

    before(waitForWorker)

    // Since the worker scripts often pass 6+ arguments, it's easiest to just
    // disable it here.
    /* eslint-disable max-params */

    it("exists", "done(type(r))", function (type) {
        expect(type).to.equal("object")
    })

    it("has the correct naming mocks", [
        "done(name('foo'), name('foo'), name('bar'), name('bar'))"
    ], function (foo1, foo2, bar1, bar2) {
        expect(foo1).to.equal(foo2)
        expect(bar1).to.equal(bar2)
        expect(foo1).to.not.equal(bar1)
        expect(foo2).to.not.equal(bar2)
    })

    it("loads named exports correctly", [
        "var t1 = r.defined(name('foo'))",
        "var t2 = r.required(name('foo'))",
        "",
        "r.define(name('foo'), function (exports) {",
        "    exports.prop = 'hi'",
        "})",
        "",
        "var t3 = r.defined(name('foo'))",
        "var t4 = r.required(name('foo'))",
        "",
        "var mod = r.require(name('foo'))",
        "",
        "done(t1, t2, t3, t4,",
        "    r.defined(name('foo')),",
        "    r.required(name('foo')),",
        "    mod.prop,",
        "    type(mod))"
    ], function (t1, t2, t3, t4, t5, t6, t7, t8) {
        expect(t1).to.be["false"]
        expect(t2).to.be["false"]

        expect(t3).to.be["true"]
        expect(t4).to.be["false"]

        expect(t5).to.be["true"]
        expect(t6).to.be["true"]

        expect(t7).to.equal("hi")
        expect(t8).to.equal("object")
    })

    it("loads default exports correctly", [
        "r.define(name('foo'), function () {",
        "    return 'hi'",
        "})",
        "var test = r.require(name('foo'))",
        "",
        "done(test)"
    ], function (test) {
        expect(test).to.equal("hi")
    })

    it("loads immediate modules correctly", [
        "var t1 = r.defined(name('foo'))",
        "var t2 = r.required(name('foo'))",
        "",
        "r.module(name('foo'), 'hi')",
        "",
        "var t3 = r.defined(name('foo'))",
        "var t4 = r.required(name('foo'))",
        "",
        "done(t1, t2, t3, t4,",
        "    r.require(name('foo')),",
        "    r.defined(name('foo')),",
        "    r.required(name('foo')))"
    ], function (t1, t2, t3, t4, test, t5, t6) {
        expect(t1).to.be["false"]
        expect(t2).to.be["false"]
        expect(t3).to.be["true"]
        expect(t4).to.be["true"]
        expect(t5).to.be["true"]
        expect(t6).to.be["true"]
        expect(test).to.equal("hi")
    })

    it("refuses to redefine existing uninstantiated modules", [
        "r.define(name('foo'), function () {})",
        "r.define(name('foo'), function () {})",
        "done(new Error('Expected an error to be thrown'))"
    ], null, function (err) {
        expect(err).to.be.an["instanceof"](Error)
    })

    it("refuses to redefine existing instantiated modules", [
        "r.module(name('foo'), {})",
        "r.define(name('foo'), function () {})",
        "done(new Error('Expected an error to be thrown'))"
    ], null, function (err) {
        expect(err).to.be.an["instanceof"](Error)
    })

    it("refuses to replace existing instantiated modules", [
        "r.module(name('foo'), {})",
        "r.module(name('foo'), {})",
        "done(new Error('Expected an error to be thrown'))"
    ], null, function (err) {
        expect(err).to.be.an["instanceof"](Error)
    })

    it("refuses to replace existing uninstantiated modules", [
        "r.define(name('foo'), function () {})",
        "r.module(name('foo'), {})",
        "done(new Error('Expected an error to be thrown'))"
    ], null, function (err) {
        expect(err).to.be.an["instanceof"](Error)
    })

    it("throws when loading a module that doesn't exist", [
        "r.require(name('foo'))",
        "done(new Error('Expected an error to be thrown'))"
    ], null, function (err) {
        expect(err).to.be.an["instanceof"](Error)
    })

    it("only initializes the module once", [
        "var counter = 0",
        "",
        "r.define(name('foo'), function () {",
        "    counter++",
        "    return 'hi'",
        "})",
        "",
        "done(",
        "    r.require(name('foo')),",
        "    r.require(name('foo')),",
        "    r.require(name('foo')),",
        "    counter)"
    ], function (mod1, mod2, mod3, counter) {
        expect(mod1).to.equal("hi")
        expect(mod2).to.equal("hi")
        expect(mod3).to.equal("hi")
        expect(counter).to.equal(1)
    })

    it("lazily initializes the module", [
        "var called = false",
        "",
        "r.define(name('foo'), function () {",
        "    called = true",
        "})",
        "",
        "var before = called",
        "var t1 = r.defined(name('foo'))",
        "var t2 = r.required(name('foo'))",
        "",
        "r.require(name('foo'))",
        "",
        "done(before, called, t1, t2)"
    ], function (before, called, t1, t2) {
        expect(before).to.be["false"]
        expect(called).to.be["true"]
        expect(t1).to.be["true"]
        expect(t2).to.be["false"]
    })

    it("loads dependencies in the correct order", [
        "var loaded = []",
        "",
        "r.define(name('one'), function () {",
        "    loaded.push(name('one'))",
        "    r.require(name('two'))",
        "})",
        "",
        "r.define(name('two'), function () {",
        "    loaded.push(name('two'))",
        "})",
        "",
        "r.require(name('one'))",
        "",
        "done(loaded, name('one'), name('two'))"
    ], function (loaded, name1, name2) {
        expect(loaded).to.eql([name1, name2])
    })

    it("loads cyclic dependencies in the correct order", [
        "var loaded = []",
        "",
        "r.define(name('one'), function () {",
        "    loaded.push(name('one'))",
        "})",
        "",
        "r.define(name('two'), function () {",
        "    loaded.push(name('two'))",
        "    r.require(name('one'))",
        "})",
        "",
        "r.require(name('two'))",
        "",
        "done(loaded, name('one'), name('two'))"
    ], function (loaded, name1, name2) {
        expect(loaded).to.eql([name2, name1])
    })

    it("correctly gets imports for cyclic dependencies", [
        "var first = {first: true}",
        "var second = {second: true}",
        "",
        "r.define(name('one'), function (exports) {",
        "    var test = r.require(name('two'))",
        "",
        "    exports.first = first",
        "    exports.retrievedFirst = test",
        "})",
        "",
        "r.define(name('two'), function (exports) {",
        "    var test = r.require(name('one'))",
        "",
        "    exports.second = second",
        "    exports.retrievedSecond = test",
        "})",
        "",
        "var test1 = r.require(name('one'))",
        "var test2 = r.require(name('two'))",
        "",
        "done(",
        "    test1.first === first,",
        "    test1.retrievedFirst === test2,",
        "    test2.second === second,",
        "    test2.retrievedSecond === test1)"
    ], function (first, retrievedFirst, second, retrievedSecond) {
        expect(first).to.be["true"]
        expect(retrievedFirst).to.be["true"]
        expect(second).to.be["true"]
        expect(retrievedSecond).to.be["true"]
    })

    it("doesn't pass default export for cyclic dependencies", [
        "var retrievedFirst, retrievedSecond",
        "",
        "r.define(name('one'), function () {",
        "    retrievedFirst = r.require(name('two'))",
        "    return 'first'",
        "})",
        "",
        "r.define(name('two'), function () {",
        "    retrievedSecond = r.require(name('one'))",
        "    return 'second'",
        "})",
        "",
        "done(",
        "    r.require(name('one')),",
        "    r.require(name('two')),",
        "    retrievedFirst,",
        "    retrievedSecond)"
    ], function (test1, test2, retrievedFirst, retrievedSecond) {
        expect(test1).to.equal("first")
        expect(test2).to.equal("second")
        expect(retrievedFirst).to.equal(test2)
        expect(retrievedSecond).to.not.equal(test1)
    })

    it("unloads instantiated modules correctly", [
        "r.module(name('foo'), {})",
        "r.unload(name('foo'))",
        "done(r.defined(name('foo')), r.required(name('foo')))"
    ], function (defined, required) {
        expect(defined).to.be["false"]
        expect(required).to.be["false"]
    })

    it("unloads uninstantiated modules correctly", [
        "r.unload(name('foo'))",
        "done(r.defined(name('foo')), r.required(name('foo')))"
    ], function (defined, required) {
        expect(defined).to.be["false"]
        expect(required).to.be["false"]
    })

    it("replaces uninstantiated modules correctly", [
        "r.module(name('foo'), 'hi')",
        "done(",
        "    r.defined(name('foo')),",
        "    r.required(name('foo')),",
        "    r.require(name('foo')))"
    ], function (defined, required, mod) {
        expect(defined).to.be["true"]
        expect(required).to.be["true"]
        expect(mod).to.equal("hi")
    })

    it("loads remote assets correctly", [
        "r.load('fixtures/remote1.js', function (err) {",
        "    done(err, r.require('remote1'))",
        "})"
    ], function (err, result) {
        expect(err).to.not.exist
        expect(result).to.equal("Hello")
    })

    it("returns an error on missing asset", [
        "r.load('fixtures/missing.js', done)"
    ], function (err) {
        expect(err).to.be.an["instanceof"](Error)
    })

    it("loads a namespace from a remote asset", [
        "r.load('remote2', 'fixtures/remote2.js', done)"
    ], function (err, result) {
        expect(err).to.not.exist
        expect(result).to.equal("Hello")
    })

    it("returns an error on missing asset with a namespace", [
        "r.load('missing', 'fixtures/missing.js', done)"
    ], function (err, result) {
        expect(err).to.be.an["instanceof"](Error)
        expect(result).to.not.exist
    })

    it("returns an error on remote module initialization", [
        "r.load('remote3', 'fixtures/remote3.js', done)"
    ], function (err, result) {
        expect(err).to.be.an["instanceof"](ReferenceError)
        expect(result).to.not.exist
    })

    it("returns an error on remote asset missing namespace", [
        "r.load('missing', 'fixtures/remote4.js', done)"
    ], function (err, result) {
        expect(err).to.be.an["instanceof"](Error)
        expect(result).to.not.exist
    })
})
