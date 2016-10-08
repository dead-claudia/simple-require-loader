/* eslint-env mocha, browser */
/* global chai, factory */
describe("browser", function (r) { // eslint-disable-line max-statements
    "use strict"

    function wrap(done, func) {
        return function () {
            try {
                return func.apply(null, arguments)
            } catch (e) {
                return done(e)
            }
        }
    }

    var expect = chai.expect

    it("exists", function () {
        expect(r).to.be.an("object")
    })

    it("has the correct naming mocks", function () {
        var name1 = factory()
        var name2 = factory()

        expect(name1("foo")).to.equal(name1("foo"))
        expect(name2("foo")).to.equal(name2("foo"))
        expect(name1("foo")).to.not.equal(name2("foo"))
        expect(name2("foo")).to.not.equal(name1("foo"))
    })

    it("loads named exports correctly", function () {
        var object = {object: true}
        var name = factory()

        expect(r.defined(name("foo"))).to.be["false"]
        expect(r.required(name("foo"))).to.be["false"]

        r.define(name("foo"), function (exports) {
            exports.object = object
        })

        expect(r.defined(name("foo"))).to.be["true"]
        expect(r.required(name("foo"))).to.be["false"]

        var test = r.require(name("foo"))

        expect(r.defined(name("foo"))).to.be["true"]
        expect(r.required(name("foo"))).to.be["true"]

        expect(test.object).to.equal(object)
        expect(test).to.not.equal(object)
    })

    it("loads default exports correctly", function () {
        var object = {object: true}
        var name = factory()

        r.define(name("foo"), function () {
            return object
        })
        var test = r.require(name("foo"))

        expect(test).to.equal(object)
    })

    it("loads immediate modules correctly", function () {
        var object = {object: true}
        var name = factory()

        expect(r.defined(name("foo"))).to.be["false"]
        expect(r.required(name("foo"))).to.be["false"]

        r.module(name("foo"), object)

        expect(r.defined(name("foo"))).to.be["true"]
        expect(r.required(name("foo"))).to.be["true"]

        var test = r.require(name("foo"))

        expect(r.defined(name("foo"))).to.be["true"]
        expect(r.required(name("foo"))).to.be["true"]

        expect(test).to.equal(object)
    })

    it("refuses to redefine existing uninstantiated modules", function () {
        var name = factory()

        r.define(name("foo"), function () {})

        expect(function () {
            r.define(name("foo"), function () {})
        }).to["throw"](Error)
    })

    it("refuses to redefine existing instantiated modules", function () {
        var name = factory()

        r.module(name("foo"), {})

        expect(function () {
            r.define(name("foo"), function () {})
        }).to["throw"](Error)
    })

    it("refuses to replace existing instantiated modules", function () {
        var name = factory()

        r.module(name("foo"), {})

        expect(function () {
            r.module(name("foo"), {})
        }).to["throw"](Error)
    })

    it("refuses to replace existing uninstantiated modules", function () {
        var name = factory()

        r.define(name("foo"), function () {})

        expect(function () {
            r.module(name("foo"), {})
        }).to["throw"](Error)
    })

    it("throws when loading a module that doesn't exist", function () {
        var name = factory()

        expect(function () {
            r.require(name("foo"))
        }).to["throw"](Error)
    })

    it("only initializes the module once", function () {
        var name = factory()
        var counter = 0
        var object = {object: true}

        r.define(name("foo"), function () {
            counter++
            return object
        })

        expect(r.require(name("foo"))).to.equal(object)
        expect(r.require(name("foo"))).to.equal(object)
        expect(r.require(name("foo"))).to.equal(object)

        expect(counter).to.equal(1)
    })

    it("lazily initializes the module", function () {
        var name = factory()
        var called = false

        r.define(name("foo"), function () {
            called = true
        })

        expect(called).to.be["false"]
        expect(r.defined(name("foo"))).to.be["true"]
        expect(r.required(name("foo"))).to.be["false"]

        r.require(name("foo"))

        expect(called).to.be["true"]
    })

    it("loads dependencies in the correct order", function () {
        var name = factory()
        var loaded = []

        r.define(name("one"), function () {
            loaded.push(name("one"))
            r.require(name("two"))
        })

        r.define(name("two"), function () {
            loaded.push(name("two"))
        })

        r.require(name("one"))

        expect(loaded).to.eql([name("one"), name("two")])
    })

    it("loads cyclic dependencies in the correct order", function () {
        var name = factory()
        var loaded = []

        r.define(name("one"), function () {
            loaded.push(name("one"))
        })

        r.define(name("two"), function () {
            loaded.push(name("two"))
            r.require(name("one"))
        })

        r.require(name("two"))

        expect(loaded).to.eql([name("two"), name("one")])
    })

    it("correctly gets imports for cyclic dependencies", function () {
        var name = factory()
        var first = {first: true}
        var second = {second: true}

        r.define(name("one"), function (exports) {
            var test = r.require(name("two"))

            exports.first = first
            exports.retrievedFirst = test
        })

        r.define(name("two"), function (exports) {
            var test = r.require(name("one"))

            exports.second = second
            exports.retrievedSecond = test
        })

        var test1 = r.require(name("one"))
        var test2 = r.require(name("two"))

        expect(test1.first).to.equal(first)
        expect(test1.retrievedFirst).to.equal(test2)
        expect(test2.second).to.equal(second)
        expect(test2.retrievedSecond).to.equal(test1)
    })

    it("doesn't pass default export for cyclic dependencies", function () {
        var name = factory()
        var first = {first: true}
        var second = {second: true}
        var retrievedFirst, retrievedSecond

        r.define(name("one"), function () {
            retrievedFirst = r.require(name("two"))
            return first
        })

        r.define(name("two"), function () {
            retrievedSecond = r.require(name("one"))
            return second
        })

        var test1 = r.require(name("one"))
        var test2 = r.require(name("two"))

        expect(test1).to.equal(first)
        expect(test2).to.equal(second)
        expect(retrievedFirst).to.equal(test2)
        expect(retrievedSecond).to.not.equal(test1)
    })

    it("unloads instantiated modules correctly", function () {
        var name = factory()

        r.module(name("foo"), {})
        r.unload(name("foo"))
        expect(r.defined(name("foo"))).to.be["false"]
        expect(r.required(name("foo"))).to.be["false"]
    })

    it("unloads uninstantiated modules correctly", function () {
        var name = factory()

        r.unload(name("foo"))
        expect(r.defined(name("foo"))).to.be["false"]
        expect(r.required(name("foo"))).to.be["false"]
    })

    it("replaces uninstantiated modules correctly", function () {
        var name = factory()
        var object = {object: true}

        r.module(name("foo"), object)

        expect(r.defined(name("foo"))).to.be["true"]
        expect(r.required(name("foo"))).to.be["true"]
        expect(r.require(name("foo"))).to.equal(object)
    })

    it("loads remote assets correctly", function (done) {
        var called = false

        r.load("fixtures/remote1.js", wrap(done, function (err) {
            called = true
            expect(err).to.not.exist
            expect(r.require("remote1")).to.equal("Hello")
            done()
        }))

        expect(called).to.be["false"]
    })

    it("returns an error on missing asset", function (done) {
        var called = false

        r.load("fixtures/missing.js", wrap(done, function (err) {
            called = true
            expect(err).to.be.an["instanceof"](Event)
            done()
        }))

        expect(called).to.be["false"]
    })

    it("loads a namespace from a remote asset", function (done) {
        var called = false

        r.load("remote2", "fixtures/remote2.js", wrap(done,
            function (err, res) {
                if (err != null) return done(err)
                called = true
                expect(err).to.not.exist
                expect(res).to.equal("Hello")
                return done()
            }))

        expect(called).to.be["false"]
    })

    it("returns an error on missing asset with a namespace", function (done) {
        var called = false

        r.load("missing", "fixtures/missing.js", wrap(done,
            function (err, res) {
                called = true
                expect(err).to.be.an["instanceof"](Event)
                expect(res).to.not.exist
                done()
            }))

        expect(called).to.be["false"]
    })

    it("returns an error on remote module initialization", function (done) {
        var called = false

        r.load("remote3", "fixtures/remote3.js", wrap(done,
            function (err, res) {
                called = true
                expect(err).to.be.an["instanceof"](ReferenceError)
                expect(res).to.not.exist
                done()
            }))

        expect(called).to.be["false"]
    })

    it("returns an error on remote asset missing namespace", function (done) {
        var called = false

        r.load("missing", "fixtures/remote4.js", wrap(done,
            function (err, res) {
                called = true
                expect(err).to.be.an["instanceof"](Error)
                expect(res).to.not.exist
                done()
            }))

        expect(called).to.be["false"]
    })
})
