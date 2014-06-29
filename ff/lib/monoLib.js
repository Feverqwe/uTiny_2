/**
 * Created by Anton on 21.06.2014.
 *
 * Mono cross-browser engine. Firefox lib.
 */
(function() {
    var tabs = require("sdk/tabs");
    var defaultId = 'monoScope';
    var serviceList = {};
    var route = {};

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

    serviceList['monoStorage'] = function(message) {
        var to = message.monoFrom;
        if (route[to] === undefined) {
            return console.log('monoStorage', 'Not found page!', to);
        }
        var msg = message.data;
        var response;
        if (message.monoCallbackId !== undefined) {
            response = function(responseMessage) {
                responseMessage = {
                    data: responseMessage,
                    monoTo: to,
                    monoFrom: 'monoStorage',
                    monoResponseId: message.monoCallbackId
                };
                route[to].port.emit(to, responseMessage);
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

    serviceList['service'] = function(message) {
        var to = message.monoFrom;
        if (route[to] === undefined) {
            return console.log('service', 'Not found page!', to);
        }
        var msg = message.data;
        /*
        var response;
        if (message.monoCallbackId !== undefined) {
            response = function(responseMessage) {
                responseMessage = {
                    data: responseMessage,
                    monoTo: to,
                    monoFrom: 'service',
                    monoResponseId: message.monoCallbackId
                };
                route[to].port.emit(to, responseMessage);
            }
        }
        */
        if (msg.action === 'resize') {
            if (msg.width) {
                route[to].width = msg.width;
            }
            if (msg.height) {
                route[to].height = msg.height;
            }
            return;
        }

        if (msg.action === 'openTab') {
            return tabs.open(msg.url);
        }
    };

    var virtualPageList = {};
    var monoVirtualPage = function(pageId) {
        var subscribList = {};
        var obj = {
            port: {
                on: function(to, cb) {
                    if (subscribList[to] === undefined) {
                        subscribList[to] = [];
                    }
                    subscribList[to].push(cb);
                },
                emit: function(to, message) {
                    if (route[to] !== undefined) {
                        return route[to].port.emit(to, message);
                    }
                    for (var serviceName in serviceList) {
                        if (serviceName === to) {
                            return serviceList[to](message);
                        }
                    }
                    console.log('VirtualPage','emit', 'Not found page!', serviceName);
                }
            },
            gotMessage: function(to, message) {
                subscribList[to].forEach(function(item) {
                    item(message);
                });
            }
        };
        virtualPageList[pageId] = obj;
        return obj;
    };
    exports.virtualAddon = monoVirtualPage;

    var sendTo = function(pageList, message) {
        pageList.forEach(function(pageId) {
            if (route[pageId] === undefined) {
                return console.log('sendTo','emit', 'Not found page!', sendTo);
            }
            route[pageId].port.emit(pageId, message);
        });
    };
    exports.sendTo = sendTo;

    var unicPageList = [];
    var addPage = function(pageId, page) {
        route[pageId] = page;
        if (unicPageList.indexOf(page) !== -1) {
            return;
        }
        unicPageList.push(page);
        for (var serviceName in serviceList) {
            page.port.on(serviceName, serviceList[serviceName]);
        }
        for (var virtualPageName in virtualPageList) {
            if (virtualPageName === pageId) {
                continue;
            }
            page.port.on(virtualPageName, function(message) {
                virtualPageList[virtualPageName].gotMessage(virtualPageName, message);
            });
        }
    };
    exports.addPage = addPage;
})();