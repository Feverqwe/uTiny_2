var mono = (typeof mono !== 'undefined') ? mono : undefined;
var require = (typeof require !== 'undefined') ? require : undefined;

(function() {
    if (typeof window !== 'undefined') return;
    var self = require('sdk/self');
    mono = require('toolkit/loader').main(require('toolkit/loader').Loader({
        paths: {
            'data/': self.data.url('js/')
        },
        name: self.name,
        prefixURI: self.data.url().match(/([^:]+:\/\/[^/]+\/)/)[1],
        globals: {
            console: console,
            _require: function(path) {
                switch (path) {
                    case 'sdk/simple-storage':
                        return require('sdk/simple-storage');
                    case 'sdk/window/utils':
                        return require('sdk/window/utils');
                    case 'sdk/self':
                        return require('sdk/self');
                    default:
                        console.log('Module not found!', path);
                }
            }
        }
    }), "data/mono");
})();

var engine = {
    settings: {},
    defaultSettings: {
        useSSL: {value: false, lang: 'useSSL'},
        ip: {value: "127.0.0.1", lang: 'PRS_COL_IP'},
        port: {value: 8080, lang: 'PRS_COL_PORT'},
        path: {value: "gui/", lang: 'apiPath'},
        disapleActiveTorrentCountIcon: {value: true, lang: 'disapleActiveTorrentCountIcon'},
        showNotificationOnDownloadCompleate: {value: true, lang: 'showNotificationOnDownloadCompleate'},
        notificationTimeout: {value: 5000, lang: 'notificationTimeout'},
        backgroundUpdateInterval: {value: 120000, lang: 'backgroundUpdateInterval'},
        popupUpdateInterval: {value: 1000, lang: 'popupUpdateInterval'},

        login: {value: undefined, lang: 'DLG_SETTINGS_9_WEBUI_03'},
        password: {value: undefined, lang: 'DLG_SETTINGS_9_WEBUI_05'},

        hideSeedStatusItem: {value: false, lang: 'hideSeedStatusItem'},
        hideFnishStatusItem: {value: false, lang: 'hideFnishStatusItem'},
        showSpeedGraph: {value: true, lang: 'showSpeedGraph'},
        popupHeight: {value: 0, lang: 'popupHeight'},
        selectDownloadCategoryOnAddItemFromContextMenu: {value: false, lang: 'selectDownloadCategoryOnAddItemFromContextMenu'},

        enableFolderContextMenu: {value: true, lang: 'enableFolderContextMenu'},
        treeViewContextMenu: {value: false, lang: 'treeViewContextMenu'},
        showDefaultFolderContextMenuItem: {value: false, lang: 'showDefaultFolderContextMenuItem'},

        enableLabelContextMenu: {value: false, lang: 'enableLabelContextMenu'},

        fixCirilic: {value: false, lang: 'fixCirilic'},
        fixCirilicTorrentPath: {value: false, lang: 'fixCirilicTorrentPath'}
    },
    torrentListColumnList: {},
    defaultTorrentListColumnList: [
         {column: 'name',        display: 1, order: 1, width: 200, lang: 'OV_COL_NAME'},
         {column: 'order',       display: 0, order: 1, width: 20,  lang: 'OV_COL_ORDER'},
         {column: 'size',        display: 1, order: 1, width: 60,  lang: 'OV_COL_SIZE'},
         {column: 'remaining',   display: 0, order: 1, width: 60,  lang: 'OV_COL_REMAINING'},
         {column: 'done',        display: 1, order: 1, width: 70,  lang: 'OV_COL_DONE'},
         {column: 'status',      display: 1, order: 1, width: 70,  lang: 'OV_COL_STATUS'},
         {column: 'seeds',       display: 0, order: 1, width: 30,  lang: 'OV_COL_SEEDS'},
         {column: 'peers',       display: 0, order: 1, width: 30,  lang: 'OV_COL_PEERS'},
         {column: 'seeds_peers', display: 1, order: 1, width: 40,  lang: 'OV_COL_SEEDS_PEERS'},
         {column: 'downspd',     display: 1, order: 1, width: 60,  lang: 'OV_COL_DOWNSPD'},
         {column: 'upspd',       display: 1, order: 1, width: 60,  lang: 'OV_COL_UPSPD'},
         {column: 'eta',         display: 1, order: 1, width: 70,  lang: 'OV_COL_ETA'},
         {column: 'upped',       display: 0, order: 1, width: 60,  lang: 'OV_COL_UPPED'},
         {column: 'downloaded',  display: 0, order: 1, width: 60,  lang: 'OV_COL_DOWNLOADED'},
         {column: 'shared',      display: 0, order: 1, width: 60,  lang: 'OV_COL_SHARED'},
         {column: 'avail',       display: 0, order: 1, width: 60,  lang: 'OV_COL_AVAIL'},
         {column: 'label',       display: 0, order: 1, width: 100, lang: 'OV_COL_LABEL'},
         {column: 'added',       display: 0, order: 1, width: 120, lang: 'OV_COL_DATE_ADDED'},
         {column: 'completed',   display: 0, order: 1, width: 120, lang: 'OV_COL_DATE_COMPLETED'},
         {column: 'actions',     display: 1, order: 0, width: 57,  lang: 'Actions'}
    ],
    fileListColumnList: {},
    defaultFileListColumnList: [
         {column: 'checkbox',   display: 1, order: 0, width: 19,  lang: ''},
         {column: 'name',       display: 1, order: 1, width: 300, lang: 'FI_COL_NAME'},
         {column: 'size',       display: 1, order: 1, width: 60,  lang: 'FI_COL_SIZE'},
         {column: 'downloaded', display: 1, order: 1, width: 60,  lang: 'OV_COL_DOWNLOADED'},
         {column: 'pcnt',       display: 1, order: 1, width: 70,  lang: 'FI_COL_PCNT'},
         {column: 'prio',       display: 1, order: 1, width: 74,  lang: 'FI_COL_PRIO'}
    ],
    icons: {
        complete: 'images/notification_done.png',
        add:      'images/notification_add.png',
        error:    'images/notification_error.png'
    },
    capitalize: function(string) {
        return string.substr(0, 1).toUpperCase()+string.substr(1);
    },
    varCache: {
        webUiUrl: undefined,
        token: undefined,
        cid: undefined,
        torrents: [],
        labels: [],
        settings: {},
        trListItems: {},
        lastPublicStatus: 'Sleep'
    },
    param: function(params) {
        if (typeof params === 'string') return params;

        var args = [];
        for (var key in params) {
            var value = params[key];
            if (value === null || value === undefined) {
                continue;
            }
            args.push(encodeURIComponent(key) + '=' + encodeURIComponent(value));
        }
        return args.join('&');
    },
    publicStatus: function(statusText) {
        if (engine.varCache.lastPublicStatus === statusText) return;

        engine.varCache.lastPublicStatus = statusText;
        mono.sendMessage({setStatus: statusText});
    },
    ajax: function(obj) {
        var url = obj.url;

        var method = obj.type || 'GET';
        method.toUpperCase();

        var data = obj.data;

        if (data && typeof data !== "string") {
            data = engine.param(data);
        }

        if (data && method === 'GET') {
            url += (url.indexOf('?') === -1 ? '?' : '&') + data;
            data = undefined;
        }

        if (obj.cache === false && ['GET','HEAD'].indexOf(method) !== -1) {
            var nc = '_=' + Date.now();
            url += (url.indexOf('?') === -1 ? '?' : '&') + nc;
        }

        var xhr = new engine.ajax.xhr();

        xhr.open(method, url, true);

        if (obj.timeout !== undefined) {
            xhr.timeout = obj.timeout;
        }

        if (obj.dataType) {
            obj.dataType = obj.dataType.toLowerCase();

            xhr.responseType = obj.dataType;
        }

        if (!obj.headers) {
            obj.headers = {};
        }

        if (obj.contentType) {
            obj.headers["Content-Type"] = obj.contentType;
        }

        if (data && !obj.headers["Content-Type"]) {
            obj.headers["Content-Type"] = 'application/x-www-form-urlencoded; charset=UTF-8';
        }

        if (obj.mimeType) {
            xhr.overrideMimeType(obj.mimeType);
        }
        if (obj.headers) {
            for (var key in obj.headers) {
                xhr.setRequestHeader(key, obj.headers[key]);
            }
        }

        if (obj.onTimeout !== undefined) {
            xhr.ontimeout = obj.onTimeout;
        }

        xhr.onload = function () {
            if (xhr.status >= 200 && xhr.status < 300 || xhr.status === 304) {
                var response = (obj.dataType) ? xhr.response : xhr.responseText;
                return obj.success && obj.success(response, xhr);
            }
            obj.error && obj.error(xhr);
        };

        xhr.onerror = function() {
            obj.error && obj.error(xhr);
        };

        xhr.send(data);

        return xhr;
    },
    timer: {
        clearInterval: typeof clearInterval !== 'undefined' ? clearInterval.bind() : undefined,
        setInterval: typeof setInterval !== 'undefined' ? setInterval.bind() : undefined,
        timer: undefined,
        start: function() {
            this.clearInterval(this.timer);
            this.timer = this.setInterval(function() {
                engine.updateTrackerList();
            }, engine.settings.backgroundUpdateInterval);
        },
        stop: function() {
            this.clearInterval(this.timer);
        }
    },
    getToken: function(onReady, onError, force) {
        engine.publicStatus('Try get token!' + (force ? ' Retry: ' + force : ''));

        engine.ajax({
            url: engine.varCache.webUiUrl + 'token.html',
            headers: {
                Authorization: 'Basic ' + window.btoa(engine.settings.login + ":" + engine.settings.password)
            },
            success: function(data) {
                var token = data.match(/>([^<]+)</);
                if (token !== null) {
                    token = token[1];
                    engine.publicStatus('Token is found!');
                } else {
                    engine.publicStatus('Token not found!');
                }
                engine.varCache.token = token;
                engine.publicStatus('Connected');
                onReady && onReady();
            },
            error: function(xhr) {
                engine.publicStatus('Get token error! Code: '+xhr.status);
                if (force === undefined) {
                    force = 0;
                }
                force++;
                if (force <= 5) {
                    return engine.getToken.call(engine, onReady, onError, force);
                }
                onError && onError();
            }
        });
    },
    sendAction: function(data, onLoad, onError, force) {
        if (engine.varCache.token === undefined) {
            return engine.getToken(function onGetToken() {
                engine.sendAction.call(engine, data, onLoad, onError, force || 1);
            });
        }

        data.token = engine.varCache.token;
        data.cid = engine.varCache.cid;

        var type = 'GET';
        var url = engine.varCache.webUiUrl;

        engine.ajax({
            type: type,
            url: url,
            headers: {
                Authorization: 'Basic ' + window.btoa(engine.settings.login + ":" + engine.settings.password)
            },
            data: data,
            success: function(data, xhr) {
                var data = xhr.responseText;
                try {
                    data = JSON.parse(data);
                } catch (err) {
                    return engine.publicStatus('Data parse error!');
                }
                engine.publicStatus('Connected');
                onLoad && onLoad(data);
                engine.readResponse(data);
            },
            onerror: function(xhr) {
                if (xhr.status === 400) {
                    if (force === undefined) {
                        force = 0;
                    }
                    force++;
                    engine.varCache.token = undefined;
                    if (force < 2) {
                        return engine.sendAction.call(engine, data, onLoad, onError, force);
                    }
                }
                onError && onError();
            }
        });
    },
    readResponse: function(data) {
        if (data.torrentc !== undefined) {
            // CID
            engine.varCache.cid = data.torrentc;
        }
        if (data.torrentm !== undefined) {
            // Removed torrents
            var list = engine.varCache.torrents;
            for (var i = 0, item_m; item_m = data.torrentm[i]; i++) {
                for (var n = 0, item_s; item_s = list[n]; n++) {
                    if (item_s[0] === item_m) {
                        list.splice(n, 1);
                        break;
                    }
                }
            }
        }

        if (data.torrents !== undefined) {
            //Full torrent list
            engine.varCache.torrents = data.torrents;
        } else
        if (data.torrentp !== undefined) {
            // Updated torrent list with CID
            var list = engine.varCache.torrents;
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
        }

        if (data.label !== undefined) {
            // Labels
            engine.varCache.labels = data.label;
        }

        if (data.settings !== undefined) {
            // Settings
            engine.varCache.settings = data.settings;
        }
    },
    updateTrackerList: function() {
        engine.sendAction({list: 1});
    },
    ready: function() {

    },
    loadSettings: function(cb) {
        var defaultSettings = engine.defaultSettings;

        var optionsList = [];
        for (var item in defaultSettings) {
            optionsList.push(item);
        }

        var columnList = ['fileListColumnList', 'torrentListColumnList'];
        columnList.forEach(function(item) {
            optionsList.push(item);
        });

        optionsList.push('language');

        mono.storage.get(optionsList, function(storage) {
            var settings = {};

            for (var item in defaultSettings) {
                settings[item] = storage.hasOwnProperty(item) ? storage[item] : defaultSettings[item].value;
            }

            settings.lang = storage.language;

            engine.settings = settings;

            columnList.forEach(function(item) {
                engine[item] = storage.hasOwnProperty(item) ? storage[item] : engine['default'+engine.capitalize(item)];
            });

            engine.varCache.webUiUrl = (settings.useSSL ? 'https://' : 'http://') + settings.ip + ':' + settings.port + '/' + settings.path;

            return cb();
        });
    },
    checkAvailableLanguage: function(lang) {
        lang = lang.substr(0, 2);
        return ['ru', 'fr', 'en'].indexOf(lang) !== -1 ? lang : 'en';
    },
    getLocale: function() {
        if (engine.getLocale.locale !== undefined) {
            return engine.getLocale.locale;
        }

        var getLang = mono.isFF ? function() {
            var window = require('sdk/window/utils').getMostRecentBrowserWindow();
            return String(window.navigator.language).toLowerCase();
        } : function() {
            return String(navigator.language).toLowerCase();
        };

        var lang = getLang();
        var match = lang.match(/\(([^)]+)\)/);
        if (match !== null) {
            lang = match[1];
        }

        var tPos = lang.indexOf('-');
        if (tPos !== -1) {
            var left = lang.substr(0, tPos);
            var right = lang.substr(tPos + 1);
            if (left === right) {
                lang = left;
            } else {
                lang = left + '-' + right.toUpperCase();
            }
        }
        return engine.getLocale.locale = lang;
    },
    detectLanguage: mono.isChrome ? function() {
        return chrome.i18n.getMessage('lang');
    } : mono.isFF ? function() {
        var lang = require("sdk/l10n").get('lang');
        if (lang !== 'lang') {
            return lang;
        }
        return engine.getLocale();
    } : function() {
        return engine.getLocale();
    },
    readChromeLocale: function(lang) {
        var language = {};
        for (var key in lang) {
            language[key] = lang[key].message;
        }
        return language;
    },
    getLanguage: function(cb, force) {
        var lang = force || engine.checkAvailableLanguage((engine.settings.language || engine.detectLanguage()));

        engine.settings.lang = engine.settings.lang || lang;

        var url = '_locales/' + lang + '/messages.json';
        if (mono.isFF) {
            try {
                engine.language = engine.readChromeLocale(JSON.parse(self.data.load(url)));
                cb();
            } catch (e) {
                if (lang !== 'en') {
                    return engine.getLanguage(cb, 'en');
                }
                console.error('Can\'t load language!');
            }
            return;
        }
        engine.ajax({
            url: url,
            dataType: 'JSON',
            success: function(data) {
                engine.language = engine.readChromeLocale(data);
                cb();
            },
            error: function() {
                if (lang !== 'en') {
                    return engine.getLanguage(cb, 'en');
                }
                console.error('Can\'t load language!');
            }
        });
    },
    run: function() {
        engine.loadSettings(function() {
            engine.getLanguage(function() {
                engine.varCache.isReady = 1;

                var msg;
                while ( msg = engine.varCache.msgStack.shift() ) {
                    engine.onMessage.apply(engine, msg);
                }

                engine.updateTrackerList();

                engine.timer.start();
            });
        });
    },
    onMessage: function(msgList, response) {
        if (engine.varCache.isReady !== 1) {
            return engine.varCache.msgStack.push([msgList, response]);
        }
        if (Array.isArray(msgList)) {
            var c_wait = msgList.length;
            var c_ready = 0;
            var resultList = {};
            var ready = function(key, data) {
                c_ready++;
                resultList[key] = data;
                if (c_wait === c_ready) {
                    response(resultList);
                }
            };
            msgList.forEach(function(message) {
                var fn = engine.actionList[message.action];
                fn && fn(message, function(response) {
                    ready(message.action, response);
                });
            });
            return;
        }
        var fn = engine.actionList[msgList.action];
        fn && fn(msgList, response);
    },
    storageCache: {},
    actionList: {
        getLanguage: function(message, response) {
            response(engine.language);
        },
        getSettings: function(message, response) {
            response(engine.settings);
        },
        getTrColumnArray: function(message, response) {
            response(engine.torrentListColumnList);
        },
        getFlColumnArray: function(message, response) {
            response(engine.fileListColumnList);
        },
        getRemoteTorrentList: function(message, response) {
            response(engine.varCache.torrents);
        },
        getRemoteLabels: function(message, response) {
            response(engine.varCache.labels);
        },
        getRemoteSettings: function(message, response) {
            response(engine.varCache.settings);
        },
        getPublicStatus: function(message, responose) {
            responose(engine.varCache.lastPublicStatus);
        },
        api: function(message, response) {
            engine.sendAction(message.data, response);
        },
        setTrColumnArray: function(message) {
            engine.torrentListColumnList = message.data;
            mono.storage.set({torrentListColumnList: message.data});
        },
        setFlColumnArray: function(message) {
            engine.fileListColumnList = message.data;
            mono.storage.set({fileListColumnList: message.data});
        }
    }
};

(function() {
    var init = function(addon) {
        if (addon) {
            mono = mono.init(addon);

            var sdkTimers = require("sdk/timers");
            engine.timer.setInterval = sdkTimers.setInterval;
            engine.timer.clearInterval = sdkTimers.clearInterval;

            var self = require('sdk/self');
            engine.icons.complete = self.data.url(engine.icons.complete);
            engine.icons.add = self.data.url(engine.icons.add);
            engine.icons.error = self.data.url(engine.icons.error);

            engine.ajax.xhr = require('sdk/net/xhr').XMLHttpRequest;
        } else {
            engine.ajax.xhr = XMLHttpRequest;
        }

        engine.varCache.msgStack = [];

        mono.onMessage(engine.onMessage);

        engine.run();
    };
    if (typeof window === 'undefined') {
        exports.init = init;
    } else {
        init();
    }
})();
