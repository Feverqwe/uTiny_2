/**
 * Created by Anton on 21.06.2014.
 *
 * Mono cross-browser engine. Firefox lib.
 */

var monoStorage = function() {
    var ss = require("sdk/simple-storage");
    return {
        get: function (src, cb) {
            var key, obj = {};
            if (src === undefined || src === null) {
                for (key in ss.storage) {
                    if (!ss.storage.hasOwnProperty(key)) {
                        continue;
                    }
                    obj[key] = ss.storage[key];
                }
                return cb(obj);
            }
            if (typeof src === 'string') {
                src = [src];
            }
            if (Array.isArray(src) === true) {
                for (var i = 0, len = src.length; i < len; i++) {
                    key = src[i];
                    obj[key] = ss.storage[key];
                }
            } else {
                for (key in src) {
                    obj[key] = ss.storage[key];
                }
            }
            cb(obj);
        },
        set: function (obj, cb) {
            var key;
            for (key in obj) {
                ss.storage[key] = obj[key];
            }
            cb && cb();
        },
        clear: function (cb) {
            var key;
            for (key in ss.storage) {
                delete ss.storage[key];
            }
            cb && cb();
        }
    }
}();

var init = function(route) {
    var tabs = require("sdk/tabs");
    var defaultId = 'monoScope';
    var monoStorageFrom = 'monoStorage';
    var routing = {};

    var monoStorageMsg = function(message) {
        var response;
        var to = message.monoFrom;
        var msg = message.data;
        if (message.monoCallbackId !== undefined) {
            response = function(responseMessage) {
                responseMessage = {
                    data: responseMessage,
                    monoTo: to,
                    monoFrom: monoStorageFrom,
                    monoResponseId: message.monoCallbackId
                };
                routing[to].forEach(function(page) {
                    page.port.emit(to, responseMessage);
                });
            }
        }
        if (msg.action === 'get') {
            return monoStorage.get(msg.data, response);
        }
        if (msg.action === 'set') {
            return monoStorage.set(msg.data, response);
        }
        if (msg.action === 'clear') {
            return monoStorage.clear(response);
        }
    };


    var serviceMsgFrom = 'service';
    var serviceMsg = function(message) {
        var response;
        var to = message.monoFrom;
        var msg = message.data;
        if (message.monoCallbackId !== undefined) {
            response = function(responseMessage) {
                responseMessage = {
                    data: responseMessage,
                    monoTo: to,
                    monoFrom: serviceMsgFrom,
                    monoResponseId: message.monoCallbackId
                };
                routing[to].forEach(function(page) {
                    page.port.emit(to, responseMessage);
                });
            }
        }

        if (msg.action === 'resize') {
            return routing[to].forEach(function(page) {
                if (msg.width) {
                    page.width = msg.width;
                }
                if (msg.height) {
                    page.height = msg.height;
                }
            });
        }

        if (msg.action === 'openTab') {
            return tabs.open(msg.url);
        }
    };

    routing[defaultId] = [];
    for (var key in route) {
        var page = route[key];
        routing[key] = [page];
        if (routing[defaultId].indexOf(page) !== -1) {
            continue;
        }
        routing[defaultId].push(page);
        page.port.on(monoStorageFrom, function(message) {
            monoStorageMsg(message);
        });
        page.port.on(defaultId, function(message) {
            routing[defaultId].forEach(function(page){
                page.port.emit(defaultId, message);
            });
        });
        page.port.on(serviceMsgFrom, function(message) {
            serviceMsg(message);
        });
    }
};
exports.inti = init;