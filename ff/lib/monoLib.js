/**
 * Created by Anton on 21.06.2014.
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

var init = function(pageList, scope) {
    var defaultId = 'monoScope';
    var routing = {};
    var monoStorageFrom = 'monoStorage';

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


    var request = require("sdk/request").Request;
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


        if (msg.action === 'sendXHR') {
            return request({
                url: msg.url,
                overrideMimeType: msg.overrideMimeType,
                contentType: msg.contentType,
                content: msg.content,
                onComplete: function (xhr) {
                    response({ responseText: xhr.responseText, text: xhr.text, json: xhr.json, status: xhr.status, statusText: xhr.statusText });
                },
                headers: msg.headers
            })[msg.method]();
        }
        if (msg.action === 'resize') {
            routing[to].forEach(function(page) {
                if (msg.width) {
                    page.width = msg.width;
                }
                if (msg.height) {
                    page.height = msg.height;
                }
            });
        }
    };

    pageList.forEach(function(item) {
        if (typeof item.id === 'string') {
            item.id = [item.id];
        }
        item.id.forEach(function(id) {
            if (routing[id] === undefined) {
                routing[id] = [];
            }
            routing[id].push(item.page);
        });
        if (routing[defaultId] === undefined) {
            routing[defaultId] = [];
        }
        routing[defaultId].push(item.page);
    });

    pageList.forEach(function(item) {
        item.page.port.on(monoStorageFrom, function(message) {
            monoStorageMsg(message);
        });
        item.page.port.on(defaultId, function(message) {
            routing[defaultId].forEach(function(page){
                page.port.emit(defaultId, message);
            });
        });
        item.page.port.on(serviceMsgFrom, function(message) {
            serviceMsg(message);
        });
        scope.forEach(function(sc) {
            item.page.port.on(sc, function(message) {
                routing[sc].forEach(function(page){
                    page.port.emit(sc, message);
                });
            });
        });
    });
};
exports.inti = init;