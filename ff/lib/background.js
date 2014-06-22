var isFF = typeof window === 'undefined';
var isChrome = !isFF;
var timers;
if (isFF) {
    var mono;
    var self = require("sdk/self");
    var monoModule = require('./monoModule.js');
    var langModule = require('./langModule.js');
    var window = require("sdk/window/utils").getMostRecentBrowserWindow();
    timers = require("sdk/timers");
    window.get_lang = langModule.get_lang;
    window.Notifications = require("sdk/notifications");
    const {XMLHttpRequest} = require('sdk/net/xhr');
} else {
    timers = window;
}
var jQ = {
    isPlainObject: function( obj ) {
        var class2type = {};
        var hasOwn = class2type.hasOwnProperty;
        if ( typeof obj !== "object" || obj.nodeType || obj === window ) {
            return false;
        }
        if ( obj.constructor &&
            !hasOwn.call( obj.constructor.prototype, "isPrototypeOf" ) ) {
            return false;
        }
        return true;
    },
    each: function(obj, cb) {
        for (var key in obj) {
            if (!obj.hasOwnProperty(key)) {
                continue;
            }
            cb(key, obj[key]);
        }
    },
    param: function(obj) {
        if (typeof obj === 'string') {
            return obj;
        }
        var itemsList = [];
        for (var key in obj) {
            if (!obj.hasOwnProperty(key)) {
                continue;
            }
            if (obj[key] === undefined) {
                obj[key] = '';
            }
            itemsList.push(encodeURIComponent(key)+'='+encodeURIComponent(obj[key]));
        }
        return itemsList.join('&');
    }
};
jQ.extend = function() {
    var options, name, src, copy, copyIsArray, clone,
        target = arguments[0] || {},
        i = 1,
        length = arguments.length,
        deep = false;
    // Handle a deep copy situation
    if ( typeof target === "boolean" ) {
        deep = target;

        // skip the boolean and the target
        target = arguments[ i ] || {};
        i++;
    }
    // Handle case when target is a string or something (possible in deep copy)
    if ( typeof target !== "object" && !typeof target === "function" ) {
        target = {};
    }
    // extend jQuery itself if only one argument is passed
    if ( i === length ) {
        target = this;
        i--;
    }
    for ( ; i < length; i++ ) {
        // Only deal with non-null/undefined values
        if ( (options = arguments[ i ]) != null ) {
            // Extend the base object
            for ( name in options ) {
                src = target[ name ];
                copy = options[ name ];

                // Prevent never-ending loop
                if ( target === copy ) {
                    continue;
                }
                // Recurse if we're merging plain objects or arrays
                if ( deep && copy && ( jQ.isPlainObject(copy) || (copyIsArray = Array.isArray(copy)) ) ) {
                    if ( copyIsArray ) {
                        copyIsArray = false;
                        clone = src && Array.isArray(src) ? src : [];
                    } else {
                        clone = src && jQ.isPlainObject(src) ? src : {};
                    }
                    // Never move original objects, clone them
                    target[ name ] = jQ.extend( deep, clone, copy );
                    // Don't bring in undefined values
                } else if ( copy !== undefined ) {
                    target[ name ] = copy;
                }
            }
        }
    }
    // Return the modified object
    return target;
};

var init = function(addon) {
    if (isFF) {
        mono = monoModule.init(addon);
    }
    /**
     * @namespace Promise
     * @namespace Promise.all
     */

    mono.pageId = 'bg';
    var actionReader = function(message, cb) {
        if (message === 'lang_arr') {
            return cb(lang_arr);
        }
        if (message === 'settings') {
            return cb(engine.settings);
        }
        if (message === 'getColums') {
            return engine.getColums(cb);
        }
        if (message === 'getFlColums') {
            return engine.getFlColums(cb);
        }
        if (message === 'cache') {
            return cb(engine.cache);
        }
        if (message === 'def_settings') {
            return cb(engine.def_settings);
        }
        if (message === 'getTraffic') {
            return cb(engine.traffic);
        }
        if (message.action === 'sendAction') {
            if (cb) {
                engine.sendAction(message.data, function() {
                    cb();
                });
            } else {
                engine.sendAction(message.data);
            }
            return;
        }
        if (message.action === 'setTrColums') {
            return engine.setTrColums(message.data);
        }
        if (message.action === 'setFlColums') {
            return engine.setFlColums(message.data);
        }
        if (message.action === 'sendFile') {
            return engine.sendFile(message.url, message.folder, message.label);
        }
        if (message.action === 'updateSettings') {
            return engine.updateSettings(message.data, cb);
        }
        if (message === 'getToken') {
            return engine.getToken(function(){
                cb(1);
            }, function(){
                cb(0);
            });
        }
        if (message === 'getDefColums') {
            return cb(engine.getDefColums());
        }
        if (message === 'getDefFlColums') {
            return cb(engine.getDefFlColums());
        }
        mono('>', message);
    };
    mono.onMessage(function(message, response) {
        if (Array.isArray(message)) {
            var c_wait = message.length;
            var c_ready = 0;
            var resultList = {};
            var ready = function(key, data) {
                c_ready+= 1;
                resultList[key] = data;
                if (c_wait === c_ready) {
                    response(resultList);
                }
            };
            message.forEach(function(action) {
                actionReader(action, function (data) {
                    ready(action, data);
                });
            });
            return;
        }
        actionReader(message, response);
    });

    mono.storage.get('lang', function(options) {
        lang_arr = window.get_lang(options.lang || window.navigator.language.substr(0,2));
        engine.boot();
    });
};

if (isFF) {
    exports.init = init;
} else {
    init();
}

var engine = function () {
    var complete_icon = 'images/notification_done.png';
    var add_icon = 'images/notification_add.png';
    var error_icon = 'images/notification_error.png';
    if (isFF) {
        complete_icon = self.data.url(complete_icon);
        add_icon = self.data.url(add_icon);
        error_icon = self.data.url(error_icon);
    }
    var var_cache = {
        client: {},
        traffic: [{name:'download', values: []}, {name:'upload', values: []}],
        //лимит на кол-во получений токена, сбрасывается при первом успешном sendAction
        get_token_count: 0
    };
    var def_settings = {
        ssl: {v: 0, t: "checkbox"},
        ut_ip: {v: "127.0.0.1", t: "text"},
        ut_port: {v: 8080, t: "number", min: 1},
        ut_path: {v: "gui/", t: "text"},
        show_active_tr_on_icon: {v: 1, t: "checkbox"},
        notify_on_dl_comp: {v: 1, t: "checkbox"},
        bg_update_interval: {v: 60000 * 2, t: "number", min: 5000},
        mgr_update_interval: {v: 2000, t: "number", min: 500},
        notify_visbl_interval: {v: 5000, t: "number"},
        login: {v: undefined, t: "text"},
        password: {v: undefined, t: "password"},
        hide_seeding: {v: 0, t: "checkbox"},
        hide_finished: {v: 0, t: "checkbox"},
        graph: {v: 1, t: "checkbox"},
        window_height: {v: 300, t: "number", min: 100},
        change_downloads: {v: 0, t: "checkbox"},
        context_menu_trigger: {v: 1, t: "checkbox"},
        folders_array: {v: [], t: "array"},
        context_labels: {v: 0, t: "checkbox"},
        fix_cirilic: {v: 0, t: "checkbox"}
    };
    var settings = {};
    var loadSettings = function (cb) {
        var keys = [];
        for (var key in def_settings) {
            keys.push(key);
        }
        mono.storage.get(keys, function(options) {
            jQ.each(def_settings, function (key, item) {
                var value = options[key];
                if (value === undefined) {
                    settings[key] = item.v;
                    return 1;
                }
                if (item.t === 'checkbox' || item.t === 'number') {
                    if (item.min !== undefined && value < item.min) {
                        settings[key] = item.min;
                        return 1;
                    }
                    settings[key] = parseInt(value);
                } else if (item.t === 'text' || item.t === 'password') {
                    settings[key] = value;
                } else if (item.t === 'array') {
                    settings[key] = JSON.parse(value);
                }
            });
            var_cache.webui_url = ((settings.ssl) ? 'https' : 'http') + "://" + settings.ut_ip + ':' + settings.ut_port + '/' + settings.ut_path;
            cb && cb();
        });
    };
    var table_colums = {
        name: {a: 1, size: 200, pos: 1, lang: 13, order: 1},
        position: {a: 0, size: 20, pos: 2, lang: 74, order: 1},
        size: {a: 1, size: 60, pos: 3, lang: 14, order: 1},
        ostalos: {a: 0, size: 60, pos: 4, lang: 75, order: 1},
        progress: {a: 1, size: 70, pos: 5, lang: 15, order: 1},
        status: {a: 1, size: 70, pos: 6, lang: 16, order: 1},
        seeds: {a: 0, size: 30, pos: 7, lang: 76, order: 1},
        peers: {a: 0, size: 30, pos: 8, lang: 77, order: 1},
        seeds_peers: {a: 1, size: 40, pos: 9, lang: 20, order: 1},
        down_speed: {a: 1, size: 60, pos: 10, lang: 18, order: 1},
        uplo_speed: {a: 1, size: 60, pos: 11, lang: 19, order: 1},
        time: {a: 1, size: 70, pos: 12, lang: 17, order: 1},
        otdano: {a: 0, size: 60, pos: 13, lang: 78, order: 1},
        poluchino: {a: 0, size: 60, pos: 14, lang: 79, order: 1},
        koeficient: {a: 0, size: 60, pos: 15, lang: 80, order: 1},
        dostupno: {a: 0, size: 60, pos: 16, lang: 81, order: 1},
        metka: {a: 0, size: 100, pos: 17, lang: 82, order: 1},
        time_dobavleno: {a: 0, size: 120, pos: 18, lang: 83, order: 1},
        time_zavircheno: {a: 0, size: 120, pos: 19, lang: 84, order: 1},
        controls: {a: 1, size: 57, pos: 20, lang: 21, order: 0}
    };
    var filelist_colums = {
        select: {a: 1, size: 19, pos: 1, lang: 113, order: 0},
        name: {a: 1, size: 300, pos: 2, lang: 88, order: 1},
        size: {a: 1, size: 60, pos: 3, lang: 14, order: 1},
        download: {a: 1, size: 60, pos: 4, lang: 79, order: 1},
        progress: {a: 1, size: 70, pos: 5, lang: 15, order: 1},
        priority: {a: 1, size: 74, pos: 6, lang: 89, order: 1}
    };
    var bgTimer = function () {
        var timer;
        var start = function () {
            if (bgTimer.isStart || (settings.show_active_tr_on_icon === 0 && settings.notify_on_dl_comp === 0)) {
                return;
            }
            timers.clearInterval(timer);
            timer = timers.setInterval(function () {
                sendAction({list: 1});
            }, settings.bg_update_interval);
            bgTimer.isStart = true;
        };
        var stop = function () {
            if (!bgTimer.isStart) {
                return;
            }
            timers.clearInterval(timer);
            bgTimer.isStart = false;
        };
        return {
            isStart: false,
            start: start,
            stop: stop
        };
    }();
    var showNotifi = function (icon, title, text, one) {
        if (isFF) {
            if (title === 0) {
                title = text;
                text = undefined;
            }
            window.Notifications.notify({title: title, text: text, iconURL: icon });
            return;
        }
        if (isChrome && chrome.notifications !== undefined) {
            var note_id = 'showNotifi';
            if (one !== undefined) {
                note_id += '_' + one;
            } else {
                note_id += Date.now();
            }
            var timer = note_id + '_timer';
            if (one !== undefined && var_cache[note_id] !== undefined) {
                var_cache[note_id] = undefined;
                timers.clearTimeout(var_cache[timer]);
                chrome.notifications.clear(note_id, function() {});
            }
            /**
             * @namespace chrome.notifications
             */
            if (title === 0) {
                title = text;
                text = undefined;
            }
            chrome.notifications.create(
                note_id,
                { type: 'basic',
                    iconUrl: icon,
                    title: title,
                    message: text },
                function(id) {
                    var_cache[note_id] = id;
                }
            );
            if (settings.notify_visbl_interval > 0) {
                var_cache[timer] = timers.setTimeout(function () {
                    var_cache[note_id] = undefined;
                    chrome.notifications.clear(note_id, function() {});
                }, settings.notify_visbl_interval);
            }
            return;
        }
    };
    var setStatus = function (type, data) {
        if (type === 'getToken') {
            if (data[0] === -1) {
                var_cache.client.status = undefined;
            } else if (data[0] === 200) {
                var_cache.client.status = lang_arr[22];
            } else {
                if (data[0] === 404) {
                    data[1] = lang_arr[35];
                } else if (data[0] === 401) {
                    data[1] = lang_arr[34];
                } else if (data[0] === 400) {
                    data[1] = lang_arr[38];
                } else if (data[0] === 0) {
                    data[1] = lang_arr[36];
                }
                var_cache.client.status = data[0] + ', ' + data[1];
            }
            mono.sendMessage({action: 'setStatus', data: var_cache.client.status}, undefined, 'mgr');
        } else {
            //for debug
            //console.log(type, data);
        }
    };
    var getToken = function (onload, onerror) {
        if (var_cache.get_token_count > 5) {
            console.log('Get token timeout!');
            var_cache.get_token_count = 0;
            return;
        }
        var_cache.get_token_count++;
        setStatus('getToken', [-1, 'Getting token...']);

        var url = var_cache.webui_url + "token.html";
        var xhr = new XMLHttpRequest();
        xhr.open("GET", url, true);
        xhr.setRequestHeader("Authorization", "Basic " + window.btoa(settings.login + ":" + settings.password));
        xhr.onload = function() {
            setStatus('getToken', [200]);
            var token = xhr.responseText.match(/>([\d\w_-]+)</);
            if (token.length > 1) {
                token = token[1];
            } else {
                token = '';
            }
            engine.cache = var_cache.client = {
                status: var_cache.client.status,
                token: token
            };
            if (onload !== undefined) {
                onload();
            }
            bgTimer.start();
        };
        xhr.onerror = function() {
            setStatus('getToken', [xhr.status, xhr.statusText]);
            if (onerror !== undefined) {
                onerror();
            }
            if (var_cache.client.getToken_error > 10) {
                bgTimer.stop();
            }
            var_cache.client.getToken_error = (var_cache.client.getToken_error === undefined) ? 1 : var_cache.client.getToken_error + 1;
        };
        xhr.send();
    };
    var sendAction = function (data, onload) {
        if (var_cache.client.token === undefined) {
            getToken(function () {
                sendAction(data, onload);
            });
            return;
        }
        var _data;
        if (typeof data === 'string') {
            _data = 'token=' + var_cache.client.token + '&cid=' + var_cache.client.cid + '&' + data;
        } else {
            _data = jQ.extend({token: var_cache.client.token, cid: var_cache.client.cid}, data);
        }
        if (_data.torrent_file !== undefined) {
            var form_data = new window.FormData();
            var file = _data.torrent_file;
            form_data.append("torrent_file", file);
            var xhr = new XMLHttpRequest();
            delete _data.torrent_file;
            xhr.open("POST", var_cache.webui_url + '?' + jQ.param(_data), true);
            xhr.setRequestHeader("Authorization", "Basic " + window.btoa(settings.login + ":" + settings.password));
            xhr.onload = function () {
                var_cache.get_token_count = 0;
                var data;
                try {
                    var responseText = xhr.responseText;
                    if (settings.fix_cirilic === 1) {
                        responseText = fixCirilic(responseText);
                    }
                    data = JSON.parse(responseText);
                } catch (err) {
                    showNotifi(error_icon, lang_arr[103], '', 'addFile');
                    return;
                }
                if (onload !== undefined) {
                    onload(data);
                }
                readResponse(data);
            };
            xhr.onerror = function () {
                showNotifi(error_icon, xhr.status, xhr.statusText, 'addFile');
                setStatus('sendFile', [xhr.status, xhr.statusText, _data]);
                //400 - invalid request, когда token протухает
                if (var_cache.client.sendAction_error > 3 || xhr.status === 400) {
                    var_cache.client.token = undefined;
                    sendAction(data, onload);
                    return;
                }
                var_cache.client.sendAction_error = (var_cache.client.sendAction_error === undefined) ? 1 : var_cache.client.sendAction_error + 1;
            };
            xhr.send(form_data);
            return;
        }

        var xhr = new XMLHttpRequest();
        xhr.open('GET', var_cache.webui_url + '?' + jQ.param(_data), true);
        xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
        xhr.setRequestHeader("Authorization", "Basic " + window.btoa(settings.login + ":" + settings.password));
        xhr.onload = function() {
            var data = xhr.responseText;
            try {
                if (settings.fix_cirilic === 1) {
                    data = fixCirilic(data);
                }
                data = JSON.parse(data);
            } catch (err) {
                console.log('Data parse error!', data);
                return;
            }
            var_cache.get_token_count = 0;
            setStatus('sendAction', [200]);
            if (onload !== undefined) {
                onload(data);
            }
            readResponse(data);
        };
        xhr.onerror = function() {
            setStatus('sendAction', [xhr.status, xhr.statusText, _data]);
            if (var_cache.client.sendAction_error > 3 || xhr.status === 400) {
                var_cache.client.token = undefined;
                sendAction(data, onload);
                return;
            }
            var_cache.client.sendAction_error = (var_cache.client.sendAction_error === undefined) ? 1 : var_cache.client.sendAction_error + 1;
        };
        xhr.send();
    };
    var readResponse = function (data) {
        /**
         * @namespace data.torrentc
         * @namespace data.torrents
         * @namespace data.torrentp
         * @namespace data.torrentm
         * @namespace data.label
         * @namespace data.settings
         * @namespace data.files
         */
        if (data.torrentc !== undefined) {
            //get CID
            var_cache.client.cid = data.torrentc;
        }
        if (data.torrentm !== undefined && data.torrentm.length > 0) {
            var list = var_cache.client.torrents || [];
            for (var i = 0, item_m; item_m = data.torrentm[i]; i++) {
                for (var n = 0, item_s; item_s = list[n]; n++) {
                    if (item_s[0] === item_m) {
                        list.splice(n, 1);
                        break;
                    }
                }
            }
            mono.sendMessage({action: 'deleteItem', data: data.torrentm}, undefined, 'mgr');
        }
        if (data.torrents !== undefined) {
            //Full torrent list
            var old_arr = (var_cache.client.torrents || []).slice(0);
            var_cache.client.torrents = data.torrents;
            trafficCounter(data.torrents);
            mono.sendMessage({action: 'updateList', data1: data.torrents, data2: 1}, undefined, 'mgr');
            showOnCompleteNotification(old_arr, data.torrents);
            showActiveCount(data.torrents);
        } else if (data.torrentp !== undefined) {
            //update with CID
            var old_arr = (var_cache.client.torrents || []).slice(0);
            var list = var_cache.client.torrents || [];
            var new_item = [];
            for (var i = 0, item_p; item_p = data.torrentp[i]; i++) {
                var found = false;
                for (var n = 0, item_s; item_s = list[n]; n++) {
                    if (item_s[0] !== item_p[0]) {
                        continue;
                    }
                    list[n] = item_p;
                    found = true;
                    break;
                }
                if (found === false) {
                    new_item.push(item_p);
                    list.push(item_p);
                }
            }
            var_cache.client.torrents = list;
            trafficCounter(data.torrentp);
            mono.sendMessage({action: 'updateList', data1: list, data2: 1}, undefined, 'mgr');
            showOnCompleteNotification(old_arr, data.torrentp);
            showActiveCount(list);
            if (var_cache.newFileListener !== undefined) {
                var_cache.newFileListener(new_item);
            }
        }
        if (data['download-dirs'] !== undefined) {
            mono.sendMessage({action: 'setDirList', data: data['download-dirs']}, undefined, 'opt');
        }
        if (data.label !== undefined) {
            var labels = var_cache.client.labels || [];
            if (data.label.length !== labels.length) {
                var_cache.client.labels = data.label;
                mono.sendMessage({action: 'setLabels', data: data.label}, undefined, 'mgr');
            } else {
                for (var i = 0, item_d; item_d = data.label[i]; i++) {
                    var found = false;
                    for (var n = 0, item_s; item_s = labels[n]; n++) {
                        if (item_d[0] === item_s[0]) {
                            found = true;
                            break;
                        }
                    }
                    if (!found) {
                        var_cache.client.labels = data.label;
                        mono.sendMessage({action: 'setLabels', data: data.label}, undefined, 'mgr');
                        break;
                    }
                }
            }
        }
        if (data.settings !== undefined) {
            var_cache.client.settings = data.settings;
            mono.sendMessage({action: 'setSpeedLimit', data: var_cache.client.settings}, undefined, 'mgr');
        }
        if (data.files !== undefined) {
            mono.sendMessage({action: 'setFileList', data: data.files}, undefined, 'mgr');
        }
    };
    var showOnCompleteNotification = function (old_array, new_array) {
        if (!settings.notify_on_dl_comp || old_array.length === 0) {
            return;
        }
        for (var i = 0, item_new; item_new = new_array[i]; i++) {
            if (item_new[4] !== 1000) {
                continue;
            }
            for (var n = 0, item_old; item_old = old_array[n]; n++) {
                if (item_old[4] === 1000 || ( item_old[24] !== 0 && item_old[24] !== undefined ) || item_old[0] !== item_new[0]) {
                    continue;
                }
                showNotifi(complete_icon, item_new[2], (item_new[21]!== undefined)?lang_arr[57] + item_new[21]:'');
            }
        }
    };
    var trafficCounter = function (arr) {
        if (!settings.graph) {
            return;
        }
        var limit = 90;
        var dl_sum = 0;
        var up_sum = 0;
        for (var i = 0, item; item = arr[i]; i++) {
            dl_sum += item[9];
            up_sum += item[8];
        }
        var time = parseInt(Date.now()/1000);
        var traf0 = var_cache.traffic[0];
        var traf1 = var_cache.traffic[1];
        var values_len = traf0.values.length;
        if (values_len > 1 && time - limit > traf0.values[values_len - 1].time) {
            traf0.values = traf0.values.slice(-1);
            traf1.values = traf1.values.slice(-1);
            values_len = 2;
        }
        traf0.values.push({time: time, pos: dl_sum});
        traf1.values.push({time: time, pos: up_sum});
        if (values_len > limit * 3) {
            traf0.values = traf0.values.slice(-limit);
            traf1.values = traf1.values.slice(-limit);
        }
    };
    var showActiveCount = function (arr) {
        if (!isChrome) {
            return;
        }
        if (!settings.show_active_tr_on_icon) {
            return;
        }
        var active = 0;
        for (var i = 0, item; item = arr[i]; i++) {
            if (item[4] !== 1000 && ( item[24] === undefined || item[24] === 0) ) {
                active++;
            }
        }
        if (var_cache.client.active_torrent !== active) {
            var_cache.client.active_torrent = active;
            /**
             * @namespace chrome.browserAction.setBadgeText
             */
            chrome.browserAction.setBadgeText({
                text: (active > 0) ? String(active) : ''
            });
        }
    };
    var setOnFileAddListener = function (label) {
        var_cache.newFileListener = function (new_file) {
            if (new_file.length === 0) {
                var_cache.newFileListener = undefined;
                showNotifi(error_icon, lang_arr[112], '', 'addFile');
                return;
            }
            if (new_file.length !== 1) {
                var_cache.newFileListener = undefined;
                return;
            }
            var item = new_file[0];
            if (label !== undefined && item[11].length === 0) {
                sendAction({action: 'setprops', s: 'label', hash: item[0], v: label});
            }
            if (settings.change_downloads) {
                var ch_label = {label: 'download', custom: 1};
                mono.sendMessage({action: 'setLabel', data: ch_label}, undefined, 'mgr');
                mono.storage.set({selected_label: JSON.stringify(ch_label)});
            }
            showNotifi(add_icon, item[2], lang_arr[102], 'addFile');
            var_cache.newFileListener = undefined;
        };
    };
    var downloadFile = function (url, cb) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.responseType = 'blob';
        xhr.onprogress = function (e) {
            /**
             * @namespace e.total
             * @namespace e.loaded
             */
            if (e.total > 1048576 * 10 || e.loaded > 1048576 * 10) {
                xhr.abort();
                showNotifi(error_icon, lang_arr[122][0],  lang_arr[122][1], 'addFile');
            }
        };
        xhr.onload = function () {
            cb(xhr.response);
        };
        xhr.onerror = function () {
            if (xhr.status === 0) {
                showNotifi(error_icon, xhr.status, lang_arr[103], 'addFile');
            } else {
                showNotifi(error_icon, xhr.status, xhr.statusText, 'addFile');
            }
            setStatus('downloadFile', [xhr.status, xhr.statusText]);
        };
        xhr.send();
    };
    var sendFile = function (url, dir, label) {
        if (typeof url === "string") {
            if (url.substr(0, 7).toLowerCase() === 'magnet:') {
                sendAction({list: 1}, function () {
                    sendAction(jQ.extend({action: 'add-url', s: url}, dir), function (data) {
                        setOnFileAddListener(label);
                        if (data.error !== undefined) {
                            showNotifi(error_icon, lang_arr[23], data.error, 'addFile');
                            var_cache.newFileListener = undefined;
                        }
                        sendAction({list: 1});
                    });
                });
            } else {
                downloadFile(url, function (file) {
                    if (url.substr(0,5) === 'blob:') {
                        window.URL.revokeObjectURL(url);
                    }
                    sendFile(file, dir, label);
                });
            }
        } else {
            sendAction({list: 1}, function () {
                sendAction(jQ.extend({action: 'add-file', torrent_file: url}, dir), function (data) {
                    setOnFileAddListener(label);
                    if (data.error !== undefined) {
                        showNotifi(error_icon, lang_arr[23], data.error, 'addFile');
                        var_cache.newFileListener = undefined;
                    }
                    sendAction({list: 1});
                });
            });
        }
    };
    var onCtxMenuCall = function (e) {
        /**
         * @namespace e.linkUrl
         * @namespace e.menuItemId
         */
        var link = e.linkUrl;
        var id = e.menuItemId;
        if (id === 'main') {
            sendFile(link);
            return;
        }
        var dir, label;
        var item = settings.folders_array[id];
        if (settings.context_labels) {
            label = item[1];
        } else {
            dir = {download_dir: item[0], path: item[1]};
        }
        sendFile(link, dir, label);
    };
    var createCtxMenu = function () {
        if (isFF) {
            var contentScript = function() {
                self.on("click", function(node) {
                    var href = node.href;
                    if (!href) {
                        return;
                    }
                    if (href.substr(0, 7).toLowerCase() === 'magnet:') {
                        return self.postMessage(node.href);
                    }
                    var downloadFile = function (url, cb) {
                        var xhr = new XMLHttpRequest();
                        xhr.open('GET', url, true);
                        xhr.responseType = 'blob';
                        xhr.onprogress = function (e) {
                            if (e.total > 1048576 * 10 || e.loaded > 1048576 * 10) {
                                xhr.abort();
                            }
                        };
                        xhr.onload = function () {
                            cb( URL.createObjectURL(xhr.response) );
                        };
                        xhr.send();
                    };
                    downloadFile(href, self.postMessage);
                });
            };
            contentScript = contentScript.toString();
            var n_pos = contentScript.indexOf('\n')+1;
            contentScript = contentScript.substr(n_pos, contentScript.length - 1 - n_pos).trim();
            var cm = require("sdk/context-menu");
            if (var_cache.topLevel) {
                var_cache.topLevel.parentMenu.removeItem(var_cache.topLevel);
            }
            if (settings.folders_array.length === 0) {
                var_cache.topLevel = cm.Item({
                    label: lang_arr[104],
                    context: cm.SelectorContext("a"),
                    image: self.data.url('./icons/icon-16.png'),
                    contentScript: contentScript,
                    onMessage: function (node) {
                        sendFile(node);
                    }
                });
            } else {
                var onMessage = function(url) {
                    onCtxMenuCall({
                        linkUrl: url,
                        menuItemId: this.data
                    });
                };
                var items = [];
                for (var i = 0, item; item = settings.folders_array[i]; i++) {
                    items.push( cm.Item({ label: item[1], data: String(i), onMessage: onMessage, contentScript: contentScript }) );
                }
                var_cache.topLevel = cm.Menu({
                    label: lang_arr[104],
                    context: cm.SelectorContext("a"),
                    image: self.data.url('./icons/icon-16.png'),
                    items: items
                });
            }
            return;
        }
        if (isChrome) {
            /**
             * @namespace chrome.contextMenus.removeAll
             * @namespace chrome.contextMenus.create
             */
            chrome.contextMenus.removeAll(function () {
                if (!settings.context_menu_trigger) {
                    return;
                }
                chrome.contextMenus.create({
                    id: 'main',
                    title: lang_arr[104],
                    contexts: ["link"],
                    onclick: onCtxMenuCall
                }, function () {
                    if (settings.folders_array.length === 0) {
                        return;
                    }
                    for (var i = 0, item; item = settings.folders_array[i]; i++) {
                        chrome.contextMenus.create({
                            id: String(i),
                            parentId: 'main',
                            title: item[1],
                            contexts: ["link"],
                            onclick: onCtxMenuCall
                        });
                    }
                });
            });
            return;
        }
    };
    var clone_obj = function (obj) {
        return jQ.extend(true, {}, obj);
    };
    var fixCirilic = function () {
        var cirilic = "АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯабвгдеёжзийклмнопрстуфхцчшщъыьэюя";
        var chars = ("\\u037777777720\\u037777777620 \\u037777777720\\u037777777621 " +
            "\\u037777777720\\u037777777622 \\u037777777720\\u037777777623 " +
            "\\u037777777720\\u037777777624 \\u037777777720\\u037777777625 " +
            "\\u037777777720\\u037777777601 \\u037777777720\\u037777777626 " +
            "\\u037777777720\\u037777777627 \\u037777777720\\u037777777630 " +
            "\\u037777777720\\u037777777631 \\u037777777720\\u037777777632 " +
            "\\u037777777720\\u037777777633 \\u037777777720\\u037777777634 " +
            "\\u037777777720\\u037777777635 \\u037777777720\\u037777777636 " +
            "\\u037777777720\\u037777777637 \\u037777777720\\u037777777640 " +
            "\\u037777777720\\u037777777641 \\u037777777720\\u037777777642 " +
            "\\u037777777720\\u037777777643 \\u037777777720\\u037777777644 " +
            "\\u037777777720\\u037777777645 \\u037777777720\\u037777777646 " +
            "\\u037777777720\\u037777777647 \\u037777777720\\u037777777650 " +
            "\\u037777777720\\u037777777651 \\u037777777720\\u037777777652 " +
            "\\u037777777720\\u037777777653 \\u037777777720\\u037777777654 " +
            "\\u037777777720\\u037777777655 \\u037777777720\\u037777777656 " +
            "\\u037777777720\\u037777777657 \\u037777777720\\u037777777660 " +
            "\\u037777777720\\u037777777661 \\u037777777720\\u037777777662 " +
            "\\u037777777720\\u037777777663 \\u037777777720\\u037777777664 " +
            "\\u037777777720\\u037777777665 \\u037777777721\\u037777777621 " +
            "\\u037777777720\\u037777777666 \\u037777777720\\u037777777667 " +
            "\\u037777777720\\u037777777670 \\u037777777720\\u037777777671 " +
            "\\u037777777720\\u037777777672 \\u037777777720\\u037777777673 " +
            "\\u037777777720\\u037777777674 \\u037777777720\\u037777777675 " +
            "\\u037777777720\\u037777777676 \\u037777777720\\u037777777677 " +
            "\\u037777777721\\u037777777600 \\u037777777721\\u037777777601 " +
            "\\u037777777721\\u037777777602 \\u037777777721\\u037777777603 " +
            "\\u037777777721\\u037777777604 \\u037777777721\\u037777777605 " +
            "\\u037777777721\\u037777777606 \\u037777777721\\u037777777607 " +
            "\\u037777777721\\u037777777610 \\u037777777721\\u037777777611 " +
            "\\u037777777721\\u037777777612 \\u037777777721\\u037777777613 " +
            "\\u037777777721\\u037777777614 \\u037777777721\\u037777777615 " +
            "\\u037777777721\\u037777777616 \\u037777777721\\u037777777617").split(' ');
        return function (data) {
            if (data.indexOf("\\u03777777772") === -1) {
                return data;
            }
            for (var i = 0, char_item; char_item = chars[i]; i++) {
                while (data.indexOf(char_item) !== -1) {
                    data = data.replace(char_item, cirilic[i]);
                }
            }
            return data;
        };
    }();
    return {
        boot: function() {
            engine.loadSettings(function() {
                engine.createCtxMenu();
                engine.bgTimer.start();
            });
            if (isChrome) {
                /**
                 * @namespace chrome.browserAction.setBadgeBackgroundColor
                 */
                chrome.browserAction.setBadgeBackgroundColor({
                    color: [0, 0, 0, 40]
                });
                chrome.browserAction.setBadgeText({
                    text: ''
                });
            }
        },
        bgTimer: bgTimer,
        loadSettings: loadSettings,
        settings: settings,
        def_settings: def_settings,
        sendAction: sendAction,
        cache: var_cache.client,
        traffic: var_cache.traffic,
        getToken: getToken,
        getColums: function (cb) {
            mono.storage.get('colums', function(storage) {
                var value = storage.colums;
                if (value === undefined) {
                    return cb(clone_obj(table_colums));
                }
                cb( JSON.parse(value) );
            });
        },
        getDefColums: function () {
            return clone_obj(table_colums);
        },
        getFlColums: function (cb) {
            mono.storage.get('fl_colums', function(storage) {
                var value = storage.fl_colums;
                if (value === undefined) {
                    return cb(clone_obj(filelist_colums));
                }
                cb( JSON.parse(value) );
            });
        },
        getDefFlColums: function () {
            return clone_obj(filelist_colums);
        },
        setFlColums: function (a) {
            mono.storage.set({ fl_colums: JSON.stringify(a) });
        },
        setTrColums: function (a) {
            mono.storage.set({ colums: JSON.stringify(a) });
        },
        updateSettings: function (lang, cb) {
            if (lang) {
                lang_arr = lang;
            }
            loadSettings(function() {
                engine.bgTimer.stop();
                engine.bgTimer.start();
                var_cache.get_token_count = 0;
                engine.cache = var_cache.client = {};
                var_cache.traffic[0].values = [];
                var_cache.traffic[1].values = [];
                createCtxMenu();
                cb && cb();
            });
        },
        sendFile: sendFile,
        createCtxMenu: createCtxMenu
    };
}();