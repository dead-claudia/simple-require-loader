/* eslint-env mocha */
/* global waitForWorker, callWorker, chai */
describe("combined (worker)", function () { // eslint-disable-line max-statements, max-len
    "use strict"

    if (typeof Worker !== "function") {
        it("isn't supported", function () {
            // do nothing here.
        })

        return
    }

    var expect = chai.expect

    before(waitForWorker)

    it("exists", function (done) {
        callWorker("done(typeof r)", function (type) {
            expect(type).to.equal("object")
        }, done)
    })

    it("loads named exports correctly", function (done) {
        callWorker([
            "r.define('test1', function (exports) {",
            "    exports.object = 'hi'",
            "})",
            "done(r.require('test1').object)"
        ], function (result) {
            expect(result).to.equal("hi")
        }, done)
    })

    it("loads default exports correctly", function (done) {
        callWorker([
            "r.define('test2', function () {",
            "    return 'hi'",
            "})",
            "done(r.require('test2'))"
        ], function (result) {
            expect(result).to.equal("hi")
        }, done)
    })

    it("throws when redefining an existing module", function (done) {
        callWorker([
            "r.define('test3', function () {})",
            "r.define('test3', function () {})",
            "done(new Error('Expected error to be thrown'))"
        ], done, function (err) {
            expect(err).to.be.an["instanceof"](Error)
        }, done)
    })

    it("throws when loading a module that doesn't exist", function (done) {
        callWorker([
            "r.require('test4')",
            "done(new Error('Expected error to be thrown'))"
        ], done, function (err) {
            expect(err).to.be.an["instanceof"](Error)
        }, done)
    })

    it("only initializes the module once", function (done) {
        callWorker([
            "var counter = 0",
            "",
            "r.define('test6', function () {",
            "    counter++",
            "})",
            "",
            "r.require('test6')",
            "r.require('test6')",
            "r.require('test6')",
            "done(counter)"
        ], function (counter) {
            expect(counter).to.equal(1)
        }, done)
    })

    it("lazily initializes the module", function (done) {
        callWorker([
            "var called = false",
            "r.define('test7', function () {",
            "    called = true",
            "})",
            "var pre = called",
            "",
            "r.require('test7')",
            "done(pre, called)"
        ], function (pre, called) {
            expect(pre).to.be["false"]
            expect(called).to.be["true"]
        }, done)
    })

    it("loads dependencies in the correct order", function (done) {
        callWorker([
            "var loaded = []",
            "",
            "r.define('test8', function () {",
            "    loaded.push('test8')",
            "})",
            "",
            "r.define('test9', function () {",
            "    loaded.push('test9')",
            "    r.require('test8')",
            "})",
            "",
            "r.require('test9')",
            "done(loaded)"
        ], function (loaded) {
            expect(loaded).to.eql(["test9", "test8"])
        }, done)
    })

    it("loads cyclic dependencies in the correct order", function (done) {
        callWorker([
            "var loaded = []",
            "",
            "r.define('test10', function () {",
            "    loaded.push('test10')",
            "})",
            "",
            "r.define('test11', function () {",
            "    loaded.push('test11')",
            "    r.require('test10')",
            "})",
            "",
            "r.require('test11')",
            "done(loaded)"
        ], function (loaded) {
            expect(loaded).to.eql(["test11", "test10"])
        }, done)
    })

    it("correctly gets imports for cyclic dependencies", function (done) {
        callWorker([
            "r.define('test12', function (exports) {",
            "    var test = r.require('test13')",
            "    exports.first = 'first'",
            "    exports.retrievedFirst = test",
            "})",
            "",
            "r.define('test13', function (exports) {",
            "    var test = r.require('test12')",
            "    exports.second = 'second'",
            "    exports.retrievedSecond = test",
            "})",
            "",
            "done(r.require('test12'), r.require('test13'))"
        ], function (test1, test2) {
            expect(test1.first).to.equal("first")
            expect(test1.retrievedFirst).to.equal(test2)
            expect(test2.second).to.equal("second")
            expect(test2.retrievedSecond).to.equal(test1)
        }, done)
    })

    it("doesn't pass default export for cyclic dependencies", function (done) {
        callWorker([
            "var retrievedFirst, retrievedSecond",
            "",
            "r.define('test14', function () {",
            "    retrievedFirst = r.require('test15')",
            "    return 'first'",
            "})",
            "",
            "r.define('test15', function () {",
            "    retrievedSecond = r.require('test14')",
            "    return 'second'",
            "})",
            "",
            "done(",
            "    r.require('test14'),",
            "    r.require('test15'),",
            "    retrievedFirst,",
            "    retrievedSecond)"
        ], function (test1, test2, retrievedFirst, retrievedSecond) {
            expect(test1).to.equal("first")
            expect(test2).to.equal("second")
            expect(retrievedFirst).to.equal(test2)
            expect(retrievedSecond).to.not.equal(test1)
        }, done)
    })

    it("unloads instantiated modules correctly", function (done) {
        callWorker([
            "r.define('test16', function () {})",
            "r.unload('test16')",
            "r.require('test16')",
            "done(new Error('Expected an error to be thrown'))"
        ], done, function (err) {
            expect(err).to.be.an["instanceof"](Error)
        }, done)
    })

    it("unloads uninstantiated modules correctly", function (done) {
        callWorker([
            "r.unload('test17')",
            "r.require('test17')",
            "done(new Error('Expected an error to be thrown'))"
        ], done, function (err) {
            expect(err).to.be.an["instanceof"](Error)
        }, done)
    })

    it("redefines uninstantiated modules correctly", function (done) {
        callWorker([
            "var called = false",
            "r.redefine('test18', function () {",
            "    called = true",
            "    return 'hi'",
            "})",
            "done(called, r.require('test18'))"
        ], function (called, result) {
            expect(called).to.be["true"]
            expect(result).to.equal("hi")
        }, done)
    })

    it("redefines instantiated modules correctly", function (done) {
        callWorker([
            "var called1 = false",
            "var called2 = false",
            "",
            "r.define('test19', function () {",
            "    called1 = true",
            "    return 'one'",
            "})",
            "",
            "var res1 = r.require('test19')",
            "",
            "r.redefine('test19', function () {",
            "    called2 = true",
            "    return 'two'",
            "})",
            "",
            "var res2 = r.require('test19')",
            "done(called1, res1, called2, res2)"
        ], function (called1, res1, called2, res2) {
            expect(called1).to.be["true"]
            expect(res1).to.equal("one")
            expect(called2).to.be["true"]
            expect(res2).to.equal("two")
        }, done)
    })

    it("loads remote assets correctly", function (done) {
        callWorker([
            "r.load('fixtures/worker1.js', function (err) {",
            "    done(err, r.require('remote1'))",
            "})"
        ], function (err, result) {
            expect(err).to.not.exist
            expect(result).to.equal("Hello")
        }, done)
    })

    it("returns an error on missing asset", function (done) {
        callWorker("r.load('fixtures/missing.js', done)", function (err) {
            expect(err).to.be.an["instanceof"](Error)
        }, done)
    })

    it("loads a namespace from a remote asset", function (done) {
        callWorker([
            "r.load('remote2', 'fixtures/worker2.js', done)"
        ], function (err, result) {
            expect(err).to.not.exist
            expect(result).to.equal("Hello")
        }, done)
    })

    it("returns an error on missing asset with a namespace", function (done) {
        callWorker([
            "r.load('missing', 'fixtures/missing.js', done)"
        ], function (err, result) {
            expect(err).to.be.an["instanceof"](Error)
            expect(result).to.not.exist
        }, done)
    })

    it("returns an error on remote module initialization", function (done) {
        callWorker([
            "r.load('remote3', 'fixtures/worker3.js', done)"
        ], function (err, result) {
            expect(err).to.be.an["instanceof"](ReferenceError)
            expect(result).to.not.exist
        }, done)
    })
})
