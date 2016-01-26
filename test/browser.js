/* eslint-env mocha, browser */
/* global browser: false, chai: false */
describe("browser", function () { // eslint-disable-line max-statements
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
        expect(browser).to.be.an("object")
    })

    it("loads named exports correctly", function () {
        var object = {}
        browser.define("test1", function (exports) {
            exports.object = object
        })
        var test = browser.require("test1")
        expect(test.object).to.equal(object)
    })

    it("loads default exports correctly", function () {
        var object = {}
        browser.define("test2", function () {
            return object
        })
        var test = browser.require("test2")
        expect(test).to.equal(object)
    })

    it("throws when redefining an existing module", function () {
        browser.define("test3", function () {})

        expect(function () {
            browser.define("test3", function () {})
        }).to["throw"](Error)
    })

    it("throws when loading a module that doesn't exist", function () {
        expect(function () {
            browser.require("test4")
        }).to["throw"](Error)
    })

    it("throws errors thrown during module instantiation", function () {
        browser.define("test5", function () {
            throw new ReferenceError("Hi")
        })

        expect(function () {
            browser.require("test5")
        }).to["throw"](ReferenceError)
    })

    it("only initializes the module once", function () {
        var counter = 0

        browser.define("test6", function () {
            counter++
        })

        browser.require("test6")
        browser.require("test6")
        browser.require("test6")

        expect(counter).to.equal(1)
    })

    it("lazily initializes the module", function () {
        var called = false
        browser.define("test7", function () {
            called = true
        })

        expect(called).to.be["false"]

        browser.require("test7")

        expect(called).to.be["true"]
    })

    it("loads dependencies in the correct order", function () {
        var loaded = []

        browser.define("test8", function () {
            loaded.push("test8")
        })

        browser.define("test9", function () {
            loaded.push("test9")
            browser.require("test8")
        })

        browser.require("test9")

        expect(loaded).to.eql(["test9", "test8"])
    })

    it("loads cyclic dependencies in the correct order", function () {
        var loaded = []

        browser.define("test10", function () {
            loaded.push("test10")
        })

        browser.define("test11", function () {
            loaded.push("test11")
            browser.require("test10")
        })

        browser.require("test11")

        expect(loaded).to.eql(["test11", "test10"])
    })

    it("correctly gets imports for cyclic dependencies", function () {
        var first = {}
        var second = {}

        browser.define("test12", function (exports) {
            var test = browser.require("test13")
            exports.first = first
            exports.retrievedFirst = test
        })

        browser.define("test13", function (exports) {
            var test = browser.require("test12")
            exports.second = second
            exports.retrievedSecond = test
        })

        var test1 = browser.require("test12")
        var test2 = browser.require("test13")

        expect(test1.first).to.equal(first)
        expect(test1.retrievedFirst).to.equal(test2)
        expect(test2.second).to.equal(second)
        expect(test2.retrievedSecond).to.equal(test1)
    })

    it("doesn't pass default export for cyclic dependencies", function () {
        var first = {}
        var second = {}
        var retrievedFirst, retrievedSecond

        browser.define("test14", function () {
            retrievedFirst = browser.require("test15")
            return first
        })

        browser.define("test15", function () {
            retrievedSecond = browser.require("test14")
            return second
        })

        var test1 = browser.require("test14")
        var test2 = browser.require("test15")

        expect(test1).to.equal(first)
        expect(test2).to.equal(second)
        expect(retrievedFirst).to.equal(test2)
        expect(retrievedSecond).to.not.equal(test1)
    })

    it("unloads instantiated modules correctly", function () {
        var object = {}

        browser.define("test16", function () {
            return object
        })

        var test = browser.require("test16")

        expect(test).to.equal(object)

        browser.unload("test16")

        expect(function () {
            browser.require("test16")
        }).to["throw"](Error)
    })

    it("unloads uninstantiated modules correctly", function () {
        browser.unload("test17")

        expect(function () {
            browser.require("test17")
        }).to["throw"](Error)
    })

    it("redefines uninstantiated modules correctly", function () {
        var called = false
        var object = {}

        browser.redefine("test18", function () {
            called = true
            return object
        })

        expect(called).to.be["true"]

        expect(browser.require("test18")).to.equal(object)
    })

    it("redefines instantiated modules correctly", function () {
        var called1 = false
        var called2 = false
        var object1 = {}
        var object2 = {}

        browser.define("test19", function () {
            called1 = true
            return object1
        })

        expect(browser.require("test19")).to.equal(object1)
        expect(called1).to.be["true"]

        browser.redefine("test19", function () {
            called2 = true
            return object2
        })

        expect(called2).to.be["true"]

        expect(browser.require("test19")).to.equal(object2)
    })

    it("throws errors during dependency module instantiation", function () {
        browser.define("test21", function () {
            throw new ReferenceError("Hi")
        })

        browser.define("test22", function () {
            return browser.require("test21")
        })

        expect(function () {
            browser.require("test22")
        }).to["throw"](ReferenceError)
    })

    it("loads remote assets correctly", function (done) {
        browser.load("fixtures/browser1.js", wrap(done, function (err) {
            expect(err).to.not.exist
            expect(browser.require("remote1")).to.equal("Hello")
            done()
        }))
    })

    it("returns an error on missing asset", function (done) {
        browser.load("fixtures/missing.js", wrap(done, function (err) {
            expect(err).to.be.an["instanceof"](Event)
            done()
        }))
    })

    it("loads a namespace from a remote asset", function (done) {
        browser.load("remote2", "fixtures/browser2.js", wrap(done,
            function (err, res) {
                if (err != null) return done(err)
                expect(err).to.not.exist
                expect(res).to.equal("Hello")
                done()
            }))
    })

    it("returns an error on missing asset with a namespace", function (done) {
        browser.load("missing", "fixtures/missing.js", wrap(done,
            function (err, res) {
                expect(err).to.be.an["instanceof"](Event)
                expect(res).to.not.exist
                done()
            }))
    })

    it("returns an error on remote module initialization", function (done) {
        browser.load("remote3", "fixtures/browser3.js", wrap(done,
            function (err, res) {
                expect(err).to.be.an["instanceof"](ReferenceError)
                expect(res).to.not.exist
                done()
            }))
    })
})
