/**
 * Created by Anton on 21.06.2014.
 *
 * Mono cross-browser engine.
 */
var init = function(addon) {
    var mono = function() {
        // mono like console.log
        var args = Array.prototype.slice.call(arguments);
        args.unshift('monoLog:');
        console.log.apply(console, args);
    };

    var defaultId = 'monoScope';
    var isArray = Array.isArray;
    mono.pageId = defaultId;
    mono.debug = {};


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
                } else
                    for (key in src) {
                        obj[key] = ss.storage[key];
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
                for (key in obj) {
                    delete ss.storage[key];
                }
                cb && cb();
            }
        }
    }();
    var storage_fn = function(mode) {
        var _get, _set, _clear;
        _get = monoStorage.get;
        _set = monoStorage.set;
        _clear = monoStorage.clear;
        return {
            get: _get, // obj, cb
            set: _set, // obj, cb
            clear: _clear // obj, cb
        }
    };
    mono.storage = storage_fn('local');
    mono.storage.local = mono.storage;
    mono.storage.sync = storage_fn('sync');

    var ffMessaging = function() {
        var cbList = mono.debug.messagCbList = {};
        var cbCount = 0;
        var id = 0;
        var _send = function(message, cb) {
            if (cb !== undefined) {
                if (cbCount > 10) {
                    cbList = mono.debug.messagCbList = {};
                    cbCount = 0;
                }
                id++;
                cbCount++;
                message.monoCallbackId = id;
                cbList[id] = cb;
            }
            addon.port.emit(message.monoTo, message);
        };
        var _on = function(cb) {
            var pageId = mono.pageId;
            addon.port.on(pageId, function(message) {
                if (message.monoTo !== pageId && message.monoTo !== defaultId) {
                    return;
                }
                var response;
                if (message.monoResponseId) {
                    cbList[message.monoResponseId](message.data);
                    delete cbList[message.monoResponseId];
                    cbCount--;
                    return;
                }
                if (message.monoCallbackId !== undefined) {
                    response = function(responseMessage) {
                        responseMessage = {
                            data: responseMessage,
                            monoResponseId: message.monoCallbackId,
                            monoTo: message.monoFrom,
                            monoFrom: pageId
                        };
                        _send(responseMessage);
                    }
                }
                cb(message.data, response);
            });
        };
        return {
            send: _send,
            on: _on
        }
    }();

    mono.sendMessage = function(message, cb, to) {
        message = {
            data: message,
            monoTo: to || defaultId,
            monoFrom: mono.pageId
        };
        mono.sendMessage.send(message, cb);
    };
    mono.sendMessage.send = ffMessaging.send;

    mono.onMessage = ffMessaging.on;

    return mono;
};
exports.init = init;