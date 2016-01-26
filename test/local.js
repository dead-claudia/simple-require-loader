/* eslint-env mocha */
/* global local: false, chai: false */
describe("local", function () {
    "use strict"

    var expect = chai.expect

    it("exists", function () {
        expect(local).to.be.an("object")
    })

    it("loads named exports correctly", function () {
        var object = {}
        local.define("test1", function (exports) {
            exports.object = object
        })
        var test = local.require("test1")
        expect(test.object).to.equal(object)
    })

    it("loads named exports correctly", function () {
        var object = {}
        local.define("test2", function () {
            return object
        })
        var test = local.require("test2")
        expect(test).to.equal(object)
    })

    it("throws when redefining an existing module", function () {
        local.define("test3", function () {})

        expect(function () {
            local.define("test3", function () {})
        }).to["throw"](Error)
    })

    it("throws when loading a module that doesn't exist", function () {
        expect(function () {
            local.require("test4")
        }).to["throw"](Error)
    })

    it("only initializes the module once", function () {
        var counter = 0

        local.define("test6", function () {
            counter++
        })

        local.require("test6")
        local.require("test6")
        local.require("test6")

        expect(counter).to.equal(1)
    })

    it("lazily initializes the module", function () {
        var called = false
        local.define("test7", function () {
            called = true
        })

        expect(called).to.be["false"]

        local.require("test7")

        expect(called).to.be["true"]
    })

    it("loads dependencies in the correct order", function () {
        var loaded = []

        local.define("test8", function () {
            loaded.push("test8")
        })

        local.define("test9", function () {
            loaded.push("test9")
            local.require("test8")
        })

        local.require("test9")

        expect(loaded).to.eql(["test9", "test8"])
    })

    it("loads cyclic dependencies in the correct order", function () {
        var loaded = []

        local.define("test10", function () {
            loaded.push("test10")
        })

        local.define("test11", function () {
            loaded.push("test11")
            local.require("test10")
        })

        local.require("test11")

        expect(loaded).to.eql(["test11", "test10"])
    })

    it("correctly gets imports for cyclic dependencies", function () {
        var first = {}
        var second = {}

        local.define("test12", function (exports) {
            var test = local.require("test13")
            exports.first = first
            exports.retrievedFirst = test
        })

        local.define("test13", function (exports) {
            var test = local.require("test12")
            exports.second = second
            exports.retrievedSecond = test
        })

        var test1 = local.require("test12")
        var test2 = local.require("test13")

        expect(test1.first).to.equal(first)
        expect(test1.retrievedFirst).to.equal(test2)
        expect(test2.second).to.equal(second)
        expect(test2.retrievedSecond).to.equal(test1)
    })

    it("doesn't pass default export for cyclic dependencies", function () {
        var first = {}
        var second = {}
        var retrievedFirst, retrievedSecond

        local.define("test14", function () {
            retrievedFirst = local.require("test15")
            return first
        })

        local.define("test15", function () {
            retrievedSecond = local.require("test14")
            return second
        })

        var test1 = local.require("test14")
        var test2 = local.require("test15")

        expect(test1).to.equal(first)
        expect(test2).to.equal(second)
        expect(retrievedFirst).to.equal(test2)
        expect(retrievedSecond).to.not.equal(test1)
    })

    it("unloads instantiated modules correctly", function () {
        var object = {}

        local.define("test16", function () {
            return object
        })

        var test = local.require("test16")

        expect(test).to.equal(object)

        local.unload("test16")

        expect(function () {
            local.require("test16")
        }).to["throw"](Error)
    })

    it("unloads uninstantiated modules correctly", function () {
        local.unload("test17")

        expect(function () {
            local.require("test17")
        }).to["throw"](Error)
    })

    it("redefines uninstantiated modules correctly", function () {
        var called = false
        var object = {}

        local.redefine("test18", function () {
            called = true
            return object
        })

        expect(called).to.be["true"]

        expect(local.require("test18")).to.equal(object)
    })

    it("redefines instantiated modules correctly", function () {
        var called1 = false
        var called2 = false
        var object1 = {}
        var object2 = {}

        local.define("test19", function () {
            called1 = true
            return object1
        })

        expect(local.require("test19")).to.equal(object1)
        expect(called1).to.be["true"]

        local.redefine("test19", function () {
            called2 = true
            return object2
        })

        expect(called2).to.be["true"]

        expect(local.require("test19")).to.equal(object2)
    })
})
