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
    mono.setBadgeText = function(size, text, cb) {
        var self = require('sdk/self');
        var xhr = new engine.ajax.xhr();
        var url = self.data.url('./icons/icon-'+size+'.png');
        if (!text) {
            return cb(url);
        }
        xhr.open('GET', url);
        xhr.responseType = 'blob';
        xhr.onload = function() {
            var reader = new window.FileReader();
            reader.onloadend = function() {
                var base64data = reader.result;
                var pos = base64data.indexOf(';');
                base64data = base64data.substr(pos);
                base64data = 'data:image/png'+base64data;

                var box_w = 14;
                var box_h = 10;
                var text_p = 2;
                var fSize = 10;
                if (text < 10) {
                    box_w = 8;
                }
                if (size === 32) {
                    box_w = 20;
                    box_h = 16;
                    text_p = 2;
                    fSize = 16;
                    if (text < 10) {
                        box_w = 12;
                    }
                }
                if (size === 64) {
                    box_w = 38;
                    box_h = 30;
                    text_p = 4;
                    fSize = 30;
                    if (text < 10) {
                        box_w = 21;
                    }
                }
                var left_p = size - box_w;

                var img = 'data:image/svg+xml;utf8,'+'<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" ' +
                    'width="'+size+'" height="'+size+'">'
                    +'<image x="0" y="0" width="'+size+'" height="'+size+'" xlink:href="'+base64data+'" />'
                    +'<rect rx="4" ry="4" x="'+left_p+'" y="'+(size-box_h)+'" '
                    +'width="'+box_w+'" height="'+box_h+'" '
                    +'style="fill:rgba(60,60,60,0.8);stroke:black;stroke-width:1;opacity:0.6;"/>'
                    +'<text fill="white" x="'+(left_p+parseInt( text_p / 2 ))+'" y="'+(size-text_p)+'" style="' +
                    'font-family: Arial;' +
                    'font-weight: bolder;' +
                    'font-size: '+fSize+'px;' +
                    'background-color: black;'+
                    '">'+text+'</text>'+'</svg>';
                cb(img);
            };
            reader.readAsDataURL(xhr.response);
        };
        xhr.send();
    };
})();

var engine = {
    settings: {},
    defaultSettings: {
        useSSL: {value: false, lang: 'useSSL'},
        ip: {value: "127.0.0.1", lang: 'PRS_COL_IP'},
        port: {value: 8080, lang: 'PRS_COL_PORT'},
        path: {value: "gui/", lang: 'apiPath'},
        displayActiveTorrentCountIcon: {value: true, lang: 'displayActiveTorrentCountIcon'},
        showNotificationOnDownloadCompleate: {value: true, lang: 'showNotificationOnDownloadCompleate'},
        notificationTimeout: {value: 5000, lang: 'notificationTimeout'},
        backgroundUpdateInterval: {value: 120000, lang: 'backgroundUpdateInterval'},
        popupUpdateInterval: {value: 1000, lang: 'popupUpdateInterval'},

        login: {value: undefined, lang: 'DLG_SETTINGS_9_WEBUI_03'},
        password: {value: undefined, lang: 'DLG_SETTINGS_9_WEBUI_05'},

        hideSeedStatusItem: {value: false, lang: 'hideSeedStatusItem'},
        hideFnishStatusItem: {value: false, lang: 'hideFnishStatusItem'},
        showSpeedGraph: {value: true, lang: 'showSpeedGraph'},
        popupHeight: {value: 300, lang: 'popupHeight'},
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
         {column: 'checkbox',   display: 1, order: 0, width: 19,  lang: 'selectAll'},
         {column: 'name',       display: 1, order: 1, width: 300, lang: 'FI_COL_NAME'},
         {column: 'size',       display: 1, order: 1, width: 60,  lang: 'FI_COL_SIZE'},
         {column: 'downloaded', display: 1, order: 1, width: 60,  lang: 'OV_COL_DOWNLOADED'},
         {column: 'done',       display: 1, order: 1, width: 70,  lang: 'OV_COL_DONE'},
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
        settings: [],
        lastPublicStatus: '-_-',
        trafficList: [{name:'download', values: []}, {name:'upload', values: []}],
        startTime: parseInt(Date.now() / 1000),
        activeCount: 0,
        notifyList: {},

        folderList: [],
        labelList: []
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

        var isFormData = false;

        if (data && typeof data !== "string") {
            isFormData = data && data.constructor && data.constructor.name === "FormData";
            if (!isFormData) {
                data = engine.param(data);
            }
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

        if (data && !obj.headers["Content-Type"] && !isFormData) {
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
                engine.publicStatus('');
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
                onError && onError({status: xhr.status, statusText: xhr.statusText});
            }
        });
    },
    sendAction: function(origData, onLoad, onError, force) {
        if (engine.varCache.token === undefined) {
            return engine.getToken(function onGetToken() {
                engine.sendAction.call(engine, origData, onLoad, onError, force || 1);
            });
        }

        var data = origData;
        if (typeof data === "string") {
            data = 'token='+engine.varCache.token+'&'+data;
        } else {
            data.token = engine.varCache.token;
        }

        var url = engine.varCache.webUiUrl;
        var type;
        if (data.hasOwnProperty('torrent_file')) {
            type = 'POST';
            var formData = new window.FormData();
            var file = data.torrent_file;
            formData.append("torrent_file", file);

            data = {};
            for (var key in origData) {
                data[key] = origData[key];
            }
            delete data.torrent_file;
            url += '?' + engine.param(data);
            data = formData;
        } else {
            type = 'GET';
        }

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
                engine.publicStatus('');
                onLoad && onLoad(data);
                engine.readResponse(data, origData.cid);
            },
            error: function(xhr) {
                if (xhr.status === 400) {
                    if (force === undefined) {
                        force = 0;
                    }
                    force++;
                    engine.varCache.token = undefined;
                    if (force < 2) {
                        return engine.sendAction.call(engine, origData, onLoad, onError, force);
                    }
                }
                engine.publicStatus('Can\'t send action! '+xhr.statusText+' (Code: '+xhr.status+')');
                onError && onError();
            }
        });
    },
    readResponse: function(data, cid) {
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

        var newTorrentList = data.torrents || data.torrentp;
        if (newTorrentList !== undefined) {
            engine.utils(engine.varCache.torrents, newTorrentList);
        }

        if (data.torrents !== undefined) {
            //Full torrent list
            engine.varCache.torrents = data.torrents;
        } else
        if (data.torrentp !== undefined) {
            // Updated torrent list with CID
            var list = engine.varCache.torrents;
            var newItem = [];
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
                    newItem.push(item_p);
                    list.push(item_p);
                }
            }
            engine.varCache.newFileListener && engine.varCache.newFileListener(newItem, cid);
        }

        if (data.label !== undefined) {
            // Labels
            engine.varCache.labels = data.label;
        }

        if (data.settings !== undefined) {
            // Settings
            engine.varCache.settings = data.settings;
        }

        engine.settings.displayActiveTorrentCountIcon && engine.displayActiveItemsCountIcon(engine.varCache.torrents);
    },
    updateTrackerList: function() {
        engine.sendAction({list: 1, cid: engine.varCache.cid}, function(data) {
            if (data.torrentc !== undefined) {
                engine.varCache.cid = data.torrentc;
            }
        });
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
        optionsList.push('folderList');
        optionsList.push('labelList');

        mono.storage.get(optionsList, function(storage) {
            var settings = {};

            for (var item in defaultSettings) {
                settings[item] = storage.hasOwnProperty(item) ? storage[item] : defaultSettings[item].value;
            }

            settings.lang = storage.language;

            engine.varCache.folderList = storage.folderList || engine.varCache.folderList;
            engine.varCache.labelList = storage.labelList || engine.varCache.labelList;

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
    trafficCounter: function(torrentList) {
        var limit = 90;
        var dlSpeed = 0;
        var upSpeed = 0;
        for (var i = 0, item; item = torrentList[i]; i++) {
            dlSpeed += item[9];
            upSpeed += item[8];
        }
        var dlSpeedList = engine.varCache.trafficList[0].values;
        var upSpeedList = engine.varCache.trafficList[1].values;
        var now = parseInt(Date.now() / 1000) - engine.varCache.startTime;
        dlSpeedList.push({time: now, pos: dlSpeed});
        upSpeedList.push({time: now, pos: upSpeed});
        if (dlSpeedList.length > limit) {
            dlSpeedList.shift();
            upSpeedList.shift();
        }
    },
    showNotification: mono.isModule ? function(icon, title, desc) {
        var notification = require("sdk/notifications");
        notification.notify({title: String(title), text: String(desc), iconURL: icon});
    } : function(icon, title, desc, id) {
        var notifyId = 'notify';
        if (id !== undefined) {
            notifyId += id;
        } else {
            notifyId += Date.now();
        }
        var timerId = notifyId + 'Timer';

        var notifyList = engine.varCache.notifyList;

        if (id !== undefined && notifyList[notifyId] !== undefined) {
            clearTimeout(notifyList[timerId]);
            delete notifyList[notifyId];
            chrome.notifications.clear(notifyId, function(){});
        }
        /**
         * @namespace chrome.notifications
         */
        chrome.notifications.create(
            notifyId,
            {
                type: 'basic',
                iconUrl: icon,
                title: String(title),
                message: String(desc)
            },
            function(id) {
                notifyList[notifyId] = id;
            }
        );
        if (engine.settings.notificationTimeout > 0) {
            notifyList[timerId] = setTimeout(function () {
                notifyList[notifyId] = undefined;
                chrome.notifications.clear(notifyId, function(){});
            }, engine.settings.notificationTimeout);
        }
    },
    onCompleteNotification: function(oldTorrentList, newTorrentList) {
        if (oldTorrentList.length === 0) {
            return;
        }
        for (var i = 0, newItem; newItem = newTorrentList[i]; i++) {
            if (newItem[4] !== 1000) {
                continue;
            }
            for (var n = 0, oldItem; oldItem = oldTorrentList[n]; n++) {
                if (oldItem[4] === 1000 || ( oldItem[24] !== 0 && oldItem[24] !== undefined ) || oldItem[0] !== newItem[0]) {
                    continue;
                }
                engine.showNotification(engine.icons.complete, newItem[2], (newItem[21] !== undefined) ? engine.language.OV_COL_STATUS + ': ' + newItem[21] : '');
            }
        }
    },
    displayActiveItemsCountIcon: function(newTorrentList) {
        var activeCount = 0;
        for (var i = 0, item; item = newTorrentList[i]; i++) {
            if (item[4] !== 1000 && ( item[24] === undefined || item[24] === 0) ) {
                activeCount++;
            }
        }
        if (engine.varCache.activeCount === activeCount) {
            return;
        }
        engine.varCache.activeCount = activeCount;
        var text = activeCount ? String(activeCount) : '';
        if (mono.isChrome) {
            chrome.browserAction.setBadgeText({
                text: text
            });
        } else {
            mono.setBadgeText(16, text, function(url16) {
                mono.setBadgeText(32, text, function(url32) {
                    mono.setBadgeText(64, text, function(url64) {
                        mono.ffButton.icon = {
                            16: url16,
                            32: url32,
                            64: url64
                        };
                    });
                });
            });
        }
    },
    utils: function(oldTorrentList, newTorrentList) {
        engine.settings.showSpeedGraph && engine.trafficCounter(newTorrentList);
        engine.settings.showNotificationOnDownloadCompleate && engine.onCompleteNotification(oldTorrentList.slice(0), newTorrentList);
    },
    downloadFile: function (url, cb, referer) {
        var xhr = new engine.ajax.xhr();
        xhr.open('GET', url, true);
        xhr.responseType = 'blob';
        if (referer !== undefined) {
            xhr.setRequestHeader('Referer', referer);
        }
        xhr.onprogress = function (e) {
            if (e.total > 1048576 * 10 || e.loaded > 1048576 * 10) {
                xhr.abort();
                engine.showNotification(engine.icons.error, engine.language.OV_FL_ERROR, engine.language.fileSizeError);
            }
        };
        xhr.onload = function () {
            cb(xhr.response);
        };
        xhr.onerror = function () {
            if (xhr.status === 0) {
                engine.showNotification(engine.icons.error, xhr.status, engine.language.unexpectedError);
            } else {
                engine.showNotification(engine.icons.error, xhr.status, xhr.statusText);
            }
        };
        xhr.send();
    },
    setOnFileAddListener: function(label, requestCid) {
        engine.varCache.newFileListener = function(newFile, cid) {
            if (cid !== requestCid) return;
            delete engine.varCache.newFileListener;
            if (newFile.length === 0) {
                engine.showNotification(engine.icons.error, engine.language.torrentFileExists, '');
                return;
            }
            if (newFile.length !== 1) {
                return;
            }
            var item = newFile[0];
            if (label && !item[11]) {
                engine.sendAction({action: 'setprops', s: 'label', hash: item[0], v: label});
            }
            if (engine.settings.selectDownloadCategoryOnAddItemFromContextMenu) {
                mono.storage.set({selected_label: {label: 'DL', custom: 1}});
            }
            engine.showNotification(engine.icons.add, item[2], engine.language.torrentAdded);
        }
    },
    sendFile: function(url, folder, label) {
        var isUrl;
        if (isUrl = typeof url === "string") {
            if (url.substr(0, 7).toLowerCase() !== 'magnet:') {
                engine.downloadFile(url, function (file) {
                    if (url.substr(0,5).toLowerCase() === 'blob:') {
                        window.URL.revokeObjectURL(url);
                    }
                    engine.sendFile(file, folder, label);
                });
                return;
            }
        }
        engine.sendAction({list: 1}, function (data) {
            var cid = data.torrentc;
            var oldTorrentList = engine.varCache.torrents.slice(0);
            var args = {};
            if (isUrl) {
                args.action = 'add-url';
                args.s = url;
            } else {
                args.action = 'add-file';
                args.torrent_file = url;
            }
            if (folder) {
                args.download_dir = folder.download_dir;
                args.path = folder.path;
            }
            engine.sendAction(args, function (data) {
                if (data.error !== undefined) {
                    engine.showNotification(engine.icons.error, engine.language.OV_FL_ERROR, data.error);
                    return;
                }
                engine.setOnFileAddListener(label, cid);
                engine.sendAction({list: 1, cid: cid});
            });
        });
    },
    onCtxMenuCall: function (e) {
        /**
         * @namespace e.linkUrl
         * @namespace e.menuItemId
         */
        var link = e.linkUrl;
        var id = e.menuItemId;
        var updateMenu = false;
        var contextMenu = engine.createFolderCtxMenu.contextMenu;
        if (id === 'new') {
            var path = window.prompt(engine.language.enterNewDirPath, contextMenu[0][1]);
            if (!path) {
                return;
            }
            var download_dir = contextMenu[0][0];
            id = contextMenu.length;
            contextMenu.push([download_dir, path]);
            engine.varCache.folderList.push([download_dir, path]);
            updateMenu = true;
        }
        if (id === 'main' || id === 'default') {
            engine.sendFile(link);
            return;
        }
        var dir, label;
        var item = contextMenu[id];
        if (engine.settings.enableLabelContextMenu) {
            label = item[1];
        } else {
            dir = {download_dir: item[0], path: item[1]};
        }
        if (updateMenu) {
            mono.storage.set({ folderList: JSON.stringify(engine.varCache.folderList) }, function() {
                engine.createFolderCtxMenu();
            });
        }
        engine.sendFile(link, dir, label);
    },
    listToTreeList: function() {
        var tmp_folders_array = [];
        var tree = {};
        var sepType;
        var treeLen = 0;
        for (var i = 0, item; item = engine.createFolderCtxMenu.contextMenu[i]; i++) {
            var path = item[1];
            if (sepType === undefined) {
                sepType = path.indexOf('/') === -1 ? path.indexOf('\\') === -1 ? undefined : '\\' : '/';
            } else {
                if (sepType === '\\') {
                    item[1] = path.replace(/\//g, '\\');
                } else {
                    item[1] = path.replace(/\\/g, '/');
                }
            }
        }
        if (sepType === undefined) {
            sepType = '';
        }
        for (var i = 0, item; item = engine.createFolderCtxMenu.contextMenu[i]; i++) {
            var _disk = item[0];
            var path = item[1];
            if (!path) {
                continue;
            }

            var dblSep = sepType+sepType;
            var splitedPath = [];
            if (path.search(/[a-zA-Z]{1}:(\/\/|\\\\)/) === 0) {
                var disk = path.split(':'+dblSep);
                if (disk.length === 2) {
                    disk[0] += ':'+dblSep;
                    splitedPath.push(disk[0]);
                    path = disk[1];
                }
            }

            var pathList;
            if (sepType.length !== 0) {
                pathList = path.split(sepType);
            } else {
                pathList = [path];
            }

            splitedPath = splitedPath.concat(pathList);

            if (splitedPath[0] === '') {
                splitedPath.shift();
                splitedPath[0] = sepType + splitedPath[0];
            }

            if (splitedPath.slice(-1)[0] === '') {
                splitedPath.splice(-1);
            }

            var lastDir = undefined;
            var folderPath = undefined;
            for (var m = 0, len = splitedPath.length; m < len; m++) {
                var cPath = (lastDir !== undefined)?lastDir:tree;
                var jPath = splitedPath[m];
                if (folderPath === undefined) {
                    folderPath = jPath;
                } else {
                    if (m === 1 && folderPath.slice(-3) === ':'+dblSep) {
                        folderPath += jPath;
                    } else {
                        folderPath += sepType + jPath;
                    }
                }

                lastDir = cPath[ jPath ];
                if (lastDir === undefined) {
                    if (cPath === tree) {
                        treeLen++;
                    }
                    lastDir = cPath[ jPath ] = {
                        arrayIndex: tmp_folders_array.length,
                        currentPath: jPath
                    };
                    tmp_folders_array.push([ _disk , folderPath ]);
                }
            }
            if (lastDir) {
                lastDir.end = true;
            }
        }

        var smartTree = [];

        var createSubMenu = function(parentId, itemList) {
            var childList = [];
            for (var subPath in itemList) {
                var item = itemList[subPath];
                if (item.currentPath !== undefined) {
                    childList.push(item);
                }
            }
            var childListLen = childList.length;
            if (childListLen === 1 && itemList.end === undefined) {
                var cPath = itemList.currentPath;
                if (itemList.currentPath.slice(-1) !== sepType) {
                    cPath += sepType;
                }
                childList[0].currentPath = cPath + childList[0].currentPath;
                createSubMenu(parentId, childList[0]);
                return;
            }
            var hasChild = childListLen !== 0;
            var id = (hasChild) ? 'p'+String(itemList.arrayIndex) : String(itemList.arrayIndex);
            if (itemList.currentPath) {
                smartTree.push({
                    id: id,
                    parentId: parentId,
                    title: itemList.currentPath
                });
                if (hasChild) {
                    smartTree.push({
                        id: id.substr(1),
                        parentId: id,
                        title: lang_arr.cmCf
                    });
                }
            }
            childList.forEach(function(item) {
                createSubMenu(id, item);
            });
        };

        for (var item in tree) {
            createSubMenu('main', tree[item]);
        }

        return {tree: smartTree, list: tmp_folders_array};
    },
    createFolderCtxMenu: mono.isModule ? (function() {
        var contentScript = (function() {
            var onClick = function() {
                self.on("click", function(node) {
                    var href = node.href;
                    if (!href) {
                        return self.postMessage({error: 0});
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
                                cb({error: 0});
                            }
                        };
                        xhr.onload = function () {
                            cb( URL.createObjectURL(xhr.response) );
                        };
                        xhr.onerror = function () {
                            if (xhr.status === 0) {
                                cb({error: 1, url: url, referer: window.location.href});
                            } else {
                                cb({error: 1, status: xhr.status, statusText: xhr.statusText});
                            }
                        };
                        xhr.send();
                    };
                    downloadFile(href, self.postMessage);
                });
            };
            var minifi = function(str) {
                var list = str.split('\n');
                var newList = [];
                list.forEach(function(line) {
                    newList.push(line.trim());
                });
                return newList.join('');
            };
            var onClickString = onClick.toString();
            var n_pos =  onClickString.indexOf('\n')+1;
            onClickString = onClickString.substr(n_pos, onClickString.length - 1 - n_pos).trim();
            return minifi(onClickString);
        })();

        var topLevel = undefined;

        var readData = function(data, cb) {
            if (typeof data === 'object') {
                if (data.error === 0) {
                    return engine.showNotification(engine.icons.error, engine.language.OV_FL_ERROR, engine.language.fileSizeError);
                }
                if (data.error === 1) {
                    if (data.url) {
                        return cb();
                    }
                    return engine.showNotification(engine.icons.error, data.status, engine.language.unexpectedError);
                }
                if (data.error === 2) {
                    return engine.showNotification(engine.icons.error, data.status, data.statusText);
                }
            }
            cb();
        };

        return function() {
            var contextMenu = engine.createFolderCtxMenu.contextMenu = engine.varCache.folderList.slice(0);

            var self = require('sdk/self');
            var cm = require("sdk/context-menu");
            try {
                if (topLevel && topLevel.parentMenu) {
                    topLevel.parentMenu.removeItem(topLevel);
                }
            } catch (e) {
                topLevel = undefined;
            }
            if (!engine.enableFolderContextMenu) {
                return;
            }

            if (contextMenu.length === 0) {
                topLevel = cm.Item({
                    label: engine.language.addInTorrentClient,
                    context: cm.SelectorContext("a"),
                    image: self.data.url('./icons/icon-16.png'),
                    contentScript: contentScript,
                    onMessage: function (data) {
                        readData(data, function() {
                            engine.sendFile(data);
                        });
                    }
                });
                return;
            }

            var onMessage = function(data) {
                var _this = this;
                readData(data, function() {
                    engine.onCtxMenuCall({
                        linkUrl: data,
                        menuItemId: _this.data
                    }, (data && data.error === 1) ? data.referer : undefined);
                });
            };
            var items = [];
            if (engine.settings.treeViewContextMenu) {
                var treeList = engine.listToTreeList();
                var createItems = function(parentId, itemList) {
                    var menuItemList = [];
                    for (var i = 0, item; item = itemList[i]; i++) {
                        if (item.parentId !== parentId) {
                            continue;
                        }
                        var itemOpt = { label: item.title, context: cm.SelectorContext("a") };
                        var subItems = createItems( item.id, itemList );
                        if (subItems.length !== 0) {
                            itemOpt.items = subItems;
                            menuItemList.push(cm.Menu(itemOpt));
                        } else {
                            itemOpt.onMessage = onMessage;
                            itemOpt.contentScript = contentScript;
                            itemOpt.data = item.id;
                            menuItemList.push(cm.Item(itemOpt));
                        }
                    }
                    return menuItemList;
                };
                items = createItems('main', treeList.tree);
                engine.createFolderCtxMenu.contextMenu = treeList.list;
            } else {
                for (var i = 0, item; item = contextMenu.folders_array[i]; i++) {
                    items.push(cm.Item({
                        label: item[1],
                        data: String(i),
                        context: cm.SelectorContext("a"),
                        onMessage: onMessage,
                        contentScript: contentScript
                    }));
                }
            }

            if (engine.settings.showDefaultFolderContextMenuItem) {
                items.push(cm.Item({
                    label: engine.language.defaultPath,
                    data: 'default',
                    context: cm.SelectorContext("a"),
                    onMessage: onMessage,
                    contentScript: contentScript
                }));
            }
            items.push(cm.Item({ label: engine.language.add,
                data: 'new',
                context: cm.SelectorContext("a"),
                onMessage: onMessage,
                contentScript: contentScript
            }));

            topLevel = cm.Menu({
                label: engine.language.addInTorrentClient,
                context: cm.SelectorContext("a"),
                image: self.data.url('./icons/icon-16.png'),
                items: items
            });
        }
    })() : function() {
        var contextMenu = engine.createFolderCtxMenu.contextMenu = engine.varCache.folderList.slice(0);

        chrome.contextMenus.removeAll(function () {
            if (!engine.settings.enableFolderContextMenu) {
                return;
            }

            chrome.contextMenus.create({
                id: 'main',
                title: engine.language.addInTorrentClient,
                contexts: ["link"],
                onclick: engine.onCtxMenuCall
            }, function () {
                if (contextMenu.length === 0) {
                    return;
                }
                if (engine.settings.treeViewContextMenu) {
                    var treeList = engine.listToTreeList();
                    for (var i = 0, item; item = treeList.tree[i]; i++) {
                        chrome.contextMenus.create({
                            id: item.id,
                            parentId: item.parentId,
                            title: item.title,
                            contexts: ["link"],
                            onclick: engine.onCtxMenuCall
                        });
                    }
                    engine.createFolderCtxMenu.contextMenu = treeList.list;
                } else {
                    for (var i = 0, item; item = contextMenu[i]; i++) {
                        chrome.contextMenus.create({
                            id: String(i),
                            parentId: 'main',
                            title: item[1],
                            contexts: ["link"],
                            onclick: engine.onCtxMenuCall
                        });
                    }
                }
                if (engine.settings.showDefaultFolderContextMenuItem) {
                    chrome.contextMenus.create({
                        id: 'default',
                        parentId: 'main',
                        title: engine.language.defaultPath,
                        contexts: ["link"],
                        onclick: engine.onCtxMenuCall
                    });
                }
                chrome.contextMenus.create({
                    id: 'new',
                    parentId: 'main',
                    title: engine.language.add,
                    contexts: ["link"],
                    onclick: engine.onCtxMenuCall
                });
            });
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

                engine.createFolderCtxMenu();
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
        getDefaultSettings: function(message, response) {
            response(engine.defaultSettings);
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
        setTrColumnArray: function(message, response) {
            engine.torrentListColumnList = message.data;
            mono.storage.set({torrentListColumnList: message.data}, response);
        },
        setFlColumnArray: function(message, response) {
            engine.fileListColumnList = message.data;
            mono.storage.set({fileListColumnList: message.data}, response);
        },
        onSendFile: function(message, response) {
            engine.sendFile(message.url, message.folder, message.label);
        },
        getTraffic: function(message, response) {
            response({list: engine.varCache.trafficList, startTime: engine.varCache.startTime});
        },
        getDirList: function(message, response) {
            engine.sendAction({action: 'list-dirs'}, response, function() {
                response({});
            });
        },
        checkSettings: function(message, response) {
            engine.loadSettings(function() {
                engine.getLanguage(function () {
                    engine.getToken(function() {
                        response({});
                    }, function(statusObj) {
                        response({error: statusObj});
                    });
                });
            });
        },
        reloadSettings: function(message, response) {
            engine.loadSettings(function() {
                engine.getLanguage(function () {
                    engine.createFolderCtxMenu();
                });
            });
        }
    }
};

(function() {
    var init = function(addon, button) {
        if (addon) {
            mono = mono.init(addon);

            mono.ffButton = button;

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
            chrome.browserAction.setBadgeBackgroundColor({
                color: [0, 0, 0, 40]
            });
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
