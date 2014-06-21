/**
 * Created by Anton on 21.06.2014.
 *
 * Mono cross-browser engine.
 */
(function(window) {
    var mono = function() {
        // mono like console.log
        var args = Array.prototype.slice.call(arguments);
        args.unshift('monoLog:');
        console.log.apply(console, args);
    };
    var defaultId = 'monoScope';
    var strunefined = typeof undefined;
    var isArray = Array.isArray;
    var isChrome = window.chrome !== undefined;
    var isFF = window.addon !== undefined;
    mono.pageId = defaultId;

    var externalStorage = {
        get: function(src, cb) {
            mono.sendMessage(src, cb, 'monoStorage');
        },
        set: function(obj, cb) {
            mono.sendMessage(obj, cb, 'monoStorage');
        },
        clear: function(cb) {
            mono.sendMessage('monoStorageClear', cb, 'monoStorage');
        }
    };
    var localStorageMode = {
        get: function (src, cb) {
            var key, obj = {};
            if (src === undefined || src === null) {
                for (key in localStorage) {
                    if (!localStorage.hasOwnProperty(key)) {
                        continue;
                    }
                    obj[key] = localStorage[key];
                }
                return cb(obj);
            }
            if (typeof src === 'string') {
                src = [src];
            }
            if (isArray(src) === true) {
                for (var i = 0, len = src.length; i < len; i++) {
                    key = src[i];
                    obj[key] = localStorage[key];
                }
            } else
                for (key in src) {
                    obj[key] = localStorage[key];
                }
            cb(obj);
        },
        set: function (obj, cb) {
            var key;
            for (key in obj) {
                localStorage[key] = obj[key];
            }
            cb && cb();
        },
        clear: function (cb) {
            localStorage.clear();
            cb && cb();
        }
    };
    var storage_fn = function(mode) {
        var _get, _set, _clear;
        if (isFF && addon.port !== undefined) {
            _get = externalStorage.get;
            _set = externalStorage.set;
            _clear = externalStorage.clear;
        } else
        if (window.localStorage !== undefined) {
            _get = localStorageMode.get;
            _set = localStorageMode.set;
            _clear = localStorageMode.clear;
        } else
        if (isChrome && chrome.storage !== undefined) {
            _get = function(obj, cb) {
                chrome.storage[mode].get(obj, cb);
            };
            _set = function(obj, cb) {
                chrome.storage[mode].set(obj, cb);
            };
            _clear = function(cb) {
                chrome.storage[mode].clear(cb);
            }
        } else {
            _get = externalStorage.get;
            _set = externalStorage.set;
            _clear = externalStorage.clear;
        }
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
        var cbList = {};
        var id = 0;
        var _send = function(message, cb) {
            if (cb !== undefined) {
                id++;
                message.monoCallbackId = id;
                cbList[id] = cb;
            }
            addon.port.emit(message.monoTo, message);
        };
        var _on = function(cb) {
            var pageId = mono.pageId;
            addon.port.on(pageId, function(message) {
                var response;
                if (message.monoResponseId) {
                    return cbList[message.monoResponseId](message.data);
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
    };

    mono.sendMessage = function(message, cb, to) {
        message = {
            data: message,
            monoTo: to || defaultId,
            monoFrom: mono.pageId
        };
        mono.sendMessage.send(message, cb);
    };
    (function() {
        // sendMessage init
        if (isChrome && chrome.runtime.sendMessage) {
            mono.sendMessage.send = chrome.runtime.sendMessage;
        } else
        if (isFF && addon.port !== undefined) {
            mono.sendMessage.send = ffMessaging.send;
        }
    })();

    mono.onMessage = function(cb) {
        if (isChrome && chrome.runtime.sendMessage) {
            chrome.runtime.onMessage.addListener(function(message, sender, response) {
                if (message.monoTo !== mono.pageId && message.monoTo !== defaultId) {
                    return;
                }
                cb(message.data, response);
            });
        } else
        if (isFF && addon.port !== undefined) {
            ffMessaging.on(cb);
        }
    };

    if (typeof window !== strunefined) {
        window.mono = mono;
    }
})(typeof window !== "undefined" ? window : this);
