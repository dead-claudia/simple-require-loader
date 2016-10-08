(function (global) {
    "use strict"

    function ObjectMap() {}
    ObjectMap.prototype = null
    var counter = 0

    global.factory = function () {
        var map = new ObjectMap()

        return function (name) {
            if (name in map) return map[name]
            return map[name] = "module-" + name + "--" + counter++
        }
    }
})(this)
