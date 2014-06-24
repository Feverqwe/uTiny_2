/**
 * Created by Anton on 21.06.2014.
 *
 * Mono cross-browser engine.
 */
var mono = function (env) {
    var mono = function() {
        // mono like console.log
        var args = Array.prototype.slice.call(arguments);
        args.unshift('monoLog:');
        console.log.apply(console, args);
    };

    var defaultId = 'monoScope';
    var addon;
    if (typeof window === 'undefined') {
        mono.isModule = true;
        mono.isFF = true;
        addon = env;
    } else {
        if (window.chrome !== undefined) {
            mono.isChrome = true;
        } else {
            addon = [window.addon || window.self];
            if (addon[0] !== undefined) {
                mono.isFF = true;

            }
        }
    }
    mono.pageId = defaultId;
    mono.debug = {};

    var externalStorage = {
        get: function(src, cb) {
            mono.sendMessage({action: 'get', data: src}, cb, 'monoStorage');
        },
        set: function(obj, cb) {
            mono.sendMessage({action: 'set', data: obj}, cb, 'monoStorage');
        },
        clear: function(cb) {
            mono.sendMessage({action: 'clear'}, cb, 'monoStorage');
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
            if (Array.isArray(src) === true) {
                for (var i = 0, len = src.length; i < len; i++) {
                    key = src[i];
                    obj[key] = localStorage[key];
                }
            } else {
                for (key in src) {
                    obj[key] = localStorage[key];
                }
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
                for (key in ss.storage) {
                    delete ss.storage[key];
                }
                cb && cb();
            }
        }
    };
    var storage_fn = function(mode) {
        var _get, _set, _clear;
        if (mono.isModule) {
            if (monoStorage.get === undefined) {
                monoStorage = monoStorage();
            }
            _get = monoStorage.get;
            _set = monoStorage.set;
            _clear = monoStorage.clear;
        } else
        if (mono.isFF) {
            _get = externalStorage.get;
            _set = externalStorage.set;
            _clear = externalStorage.clear;
        } else
        if (mono.isChrome && chrome.storage !== undefined) {
            _get = function(obj, cb) {
                chrome.storage[mode].get(obj, cb);
            };
            _set = function(obj, cb) {
                chrome.storage[mode].set(obj, cb);
            };
            _clear = function(cb) {
                chrome.storage[mode].clear(cb);
            }
        } else
        if (window.localStorage !== undefined) {
            _get = localStorageMode.get;
            _set = localStorageMode.set;
            _clear = localStorageMode.clear;
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
            if (addon[message.monoTo] !== undefined) {
                addon[message.monoTo].port.emit(message.monoTo, message);
            } else
            if (message.monoTo === defaultId) {
                addon[0].port.emit(message.monoTo, message);
            } else {
                var pageList = [];
                for (var key in addon) {
                    var page = addon[key];
                    if (pageList.indexOf(page) !== -1) {
                        continue;
                    }
                    pageList.push(page);
                    page.port.emit(message.monoTo, message);
                }
            }
        };
        var _on = function(cb) {
            var pageId = mono.pageId;
            var pageList = [];
            for (var key in addon) {
                var page = addon[key];
                if (pageList.indexOf(page) !== -1) {
                    continue;
                }
                pageList.push(page);
                page.port.on(pageId, function(message) {
                    if (message.monoTo !== pageId && message.monoTo !== defaultId) {
                        return;
                    }
                    var response;
                    if (message.monoResponseId) {
                        if (cbList[message.monoResponseId] === undefined) {
                            return mono(pageId+':','Message response not found!', message);
                        }
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
            }
        };
        return {
            send: _send,
            on: _on
        }
    };
    if (mono.isFF) {
        ffMessaging = ffMessaging();
    }

    var chMessaging = function() {
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
            chrome.runtime.sendMessage(message);
        };
        var _on = function(cb) {
            var pageId = mono.pageId;
            chrome.runtime.onMessage.addListener(function(message) {
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
    };
    if (mono.isChrome) {
        chMessaging = chMessaging();
    }

    mono.sendMessage = function(message, cb, to) {
        message = {
            data: message,
            monoTo: to || defaultId,
            monoFrom: mono.pageId
        };
        mono.sendMessage.send(message, cb);
    };
    // sendMessage init
    if (mono.isChrome) {
        /*
            mono.sendMessage.send = chrome.runtime.sendMessage;
        */
        mono.sendMessage.send = chMessaging.send;
    } else
    if (mono.isFF) {
        mono.sendMessage.send = ffMessaging.send;
    }

    mono.onMessage = function(cb) {
        if (mono.isChrome) {
            /*
            chrome.runtime.onMessage.addListener(function(message, sender, response) {
                if (message.monoTo !== mono.pageId && message.monoTo !== defaultId) {
                    return;
                }
                cb(message.data, response);
            });*/
            chMessaging.on(cb);
        } else
        if (mono.isFF) {
            ffMessaging.on(cb);
        }
    };

    if (!mono.isModule) {
        window.mono = mono;
    } else {
        return mono;
    }
};
if (typeof window !== "undefined") {
    mono(window);
} else {
    exports.init = mono;
}
