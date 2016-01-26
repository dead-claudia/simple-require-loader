/* eslint-env mocha, browser */
/* global combined: false, chai: false */
describe("combined (browser)", function () { // eslint-disable-line max-statements, max-len
    "use strict"

    var expect = chai.expect

    function wrap(done, func) {
        return function () {
            try {
                func.apply(null, arguments)
            } catch (e) {
                done(e)
            }
        }
    }

    it("exists", function () {
        expect(combined).to.be.an("object")
    })

    it("loads named exports correctly", function () {
        var object = {}
        combined.define("test1", function (exports) {
            exports.object = object
        })
        var test = combined.require("test1")
        expect(test.object).to.equal(object)
    })

    it("loads default exports correctly", function () {
        var object = {}
        combined.define("test2", function () {
            return object
        })
        var test = combined.require("test2")
        expect(test).to.equal(object)
    })

    it("throws when redefining an existing module", function () {
        combined.define("test3", function () {})

        expect(function () {
            combined.define("test3", function () {})
        }).to["throw"](Error)
    })

    it("throws when loading a module that doesn't exist", function () {
        expect(function () {
            combined.require("test4")
        }).to["throw"](Error)
    })

    it("throws errors thrown during module instantiation", function () {
        combined.define("test5", function () {
            throw new ReferenceError("Hi")
        })

        expect(function () {
            combined.require("test5")
        }).to["throw"](ReferenceError)
    })

    it("only initializes the module once", function () {
        var counter = 0

        combined.define("test6", function () {
            counter++
        })

        combined.require("test6")
        combined.require("test6")
        combined.require("test6")

        expect(counter).to.equal(1)
    })

    it("lazily initializes the module", function () {
        var called = false
        combined.define("test7", function () {
            called = true
        })

        expect(called).to.be["false"]

        combined.require("test7")

        expect(called).to.be["true"]
    })

    it("loads dependencies in the correct order", function () {
        var loaded = []

        combined.define("test8", function () {
            loaded.push("test8")
        })

        combined.define("test9", function () {
            loaded.push("test9")
            combined.require("test8")
        })

        combined.require("test9")

        expect(loaded).to.eql(["test9", "test8"])
    })

    it("loads cyclic dependencies in the correct order", function () {
        var loaded = []

        combined.define("test10", function () {
            loaded.push("test10")
        })

        combined.define("test11", function () {
            loaded.push("test11")
            combined.require("test10")
        })

        combined.require("test11")

        expect(loaded).to.eql(["test11", "test10"])
    })

    it("correctly gets imports for cyclic dependencies", function () {
        var first = {}
        var second = {}

        combined.define("test12", function (exports) {
            var test = combined.require("test13")
            exports.first = first
            exports.retrievedFirst = test
        })

        combined.define("test13", function (exports) {
            var test = combined.require("test12")
            exports.second = second
            exports.retrievedSecond = test
        })

        var test1 = combined.require("test12")
        var test2 = combined.require("test13")

        expect(test1.first).to.equal(first)
        expect(test1.retrievedFirst).to.equal(test2)
        expect(test2.second).to.equal(second)
        expect(test2.retrievedSecond).to.equal(test1)
    })

    it("doesn't pass default export for cyclic dependencies", function () {
        var first = {}
        var second = {}
        var retrievedFirst, retrievedSecond

        combined.define("test14", function () {
            retrievedFirst = combined.require("test15")
            return first
        })

        combined.define("test15", function () {
            retrievedSecond = combined.require("test14")
            return second
        })

        var test1 = combined.require("test14")
        var test2 = combined.require("test15")

        expect(test1).to.equal(first)
        expect(test2).to.equal(second)
        expect(retrievedFirst).to.equal(test2)
        expect(retrievedSecond).to.not.equal(test1)
    })

    it("unloads instantiated modules correctly", function () {
        var object = {}

        combined.define("test16", function () {
            return object
        })

        var test = combined.require("test16")

        expect(test).to.equal(object)

        combined.unload("test16")

        expect(function () {
            combined.require("test16")
        }).to["throw"](Error)
    })

    it("unloads uninstantiated modules correctly", function () {
        combined.unload("test17")

        expect(function () {
            combined.require("test17")
        }).to["throw"](Error)
    })

    it("redefines uninstantiated modules correctly", function () {
        var called = false
        var object = {}

        combined.redefine("test18", function () {
            called = true
            return object
        })

        expect(called).to.be["true"]

        expect(combined.require("test18")).to.equal(object)
    })

    it("redefines instantiated modules correctly", function () {
        var called1 = false
        var called2 = false
        var object1 = {}
        var object2 = {}

        combined.define("test19", function () {
            called1 = true
            return object1
        })

        expect(combined.require("test19")).to.equal(object1)
        expect(called1).to.be["true"]

        combined.redefine("test19", function () {
            called2 = true
            return object2
        })

        expect(called2).to.be["true"]

        expect(combined.require("test19")).to.equal(object2)
    })

    it("throws errors during dependency module instantiation", function () {
        combined.define("test21", function () {
            throw new ReferenceError("Hi")
        })

        combined.define("test22", function () {
            return combined.require("test21")
        })

        expect(function () {
            combined.require("test22")
        }).to["throw"](ReferenceError)
    })

    it("loads remote assets correctly", function (done) {
        combined.load("fixtures/combined1.js", wrap(done, function (err) {
            expect(err).to.not.exist
            expect(combined.require("remote1")).to.equal("Hello")
            done()
        }))
    })

    it("returns an error on missing asset", function (done) {
        combined.load("fixtures/missing.js", wrap(done, function (err) {
            expect(err).to.be.an["instanceof"](Event)
            done()
        }))
    })

    it("loads a namespace from a remote asset", function (done) {
        combined.load("remote2", "fixtures/combined2.js", wrap(done,
            function (err, res) {
                if (err != null) return done(err)
                expect(err).to.not.exist
                expect(res).to.equal("Hello")
                done()
            }))
    })

    it("returns an error on missing asset with a namespace", function (done) {
        combined.load("missing", "fixtures/missing.js", wrap(done,
            function (err, res) {
                expect(err).to.be.an["instanceof"](Event)
                expect(res).to.not.exist
                done()
            }))
    })

    it("returns an error on remote module initialization", function (done) {
        combined.load("remote3", "fixtures/combined3.js", wrap(done,
            function (err, res) {
                expect(err).to.be.an["instanceof"](ReferenceError)
                expect(res).to.not.exist
                done()
            }))
    })
})
