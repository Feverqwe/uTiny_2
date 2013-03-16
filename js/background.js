var engine = function() {
    var settings = {
        debug: 1,
        ut_url: ((localStorage.ssl !== undefined && localStorage.ssl) ? 'https' : 'http') +
                "://" +
                ((localStorage.ut_ip !== undefined) ? localStorage.ut_ip : '127.0.0.1') +
                ':' +
                ((localStorage.ut_port !== undefined) ? localStorage.ut_port : '8080') +
                '/' +
                ((localStorage.ut_path !== undefined) ? localStorage.ut_path : 'gui/'),
        icon_dl_count: (localStorage.icon_dl_count !== undefined) ? localStorage.icon_dl_count : 1,
        dl_cmpl_notify: (localStorage.dl_cmpl_notify !== undefined) ? localStorage.dl_cmpl_notify : 1,
        bg_update_interval: (localStorage.bg_update_interval !== undefined) ? localStorage.bg_update_interval : 60000,
        mgr_update_interval: (localStorage.mgr_update_interval !== undefined) ? localStorage.mgr_update_interval : 3000,
        notify_visbl_interval: (localStorage.notify_visbl_interval !== undefined) ? localStorage.notify_visbl_interval : 30000,
        login: (localStorage.login !== undefined) ? localStorage.login : null,
        password: (localStorage.password !== undefined) ? localStorage.password : null,
        hide_seeding: (localStorage.hide_seeding !== undefined) ? localStorage.hide_seeding : 0,
        hide_finished: (localStorage.hide_finished !== undefined) ? localStorage.hide_finished : 0,
        graph: (localStorage.graph !== undefined) ? localStorage.graph : 1,
        window_height: (localStorage.graph !== undefined) ? localStorage.window_height : 300,
    }
    var colums = {
        'name': {'a': 1, 'size': 200, 'pos': 1, 'lang': 13},
        'position': {'a': 0, 'size': 20, 'pos': 2, 'lang': 74},
        'size': {'a': 1, 'size': 60, 'pos': 3, 'lang': 14},
        'ostalos': {'a': 0, 'size': 60, 'pos': 4, 'lang': 75},
        'progress': {'a': 1, 'size': 70, 'pos': 5, 'lang': 15},
        'status': {'a': 1, 'size': 70, 'pos': 6, 'lang': 16},
        'seeds': {'a': 0, 'size': 30, 'pos': 7, 'lang': 76},
        'peers': {'a': 0, 'size': 30, 'pos': 8, 'lang': 77},
        'seeds_peers': {'a': 1, 'size': 40, 'pos': 9, 'lang': 20},
        'down_speed': {'a': 1, 'size': 60, 'pos': 10, 'lang': 18},
        'uplo_speed': {'a': 1, 'size': 60, 'pos': 11, 'lang': 19},
        'time': {'a': 1, 'size': 70, 'pos': 12, 'lang': 17},
        'otdano': {'a': 0, 'size': 60, 'pos': 13, 'lang': 78},
        'poluchino': {'a': 0, 'size': 60, 'pos': 14, 'lang': 79},
        'koeficient': {'a': 0, 'size': 60, 'pos': 15, 'lang': 80},
        'dostupno': {'a': 0, 'size': 60, 'pos': 16, 'lang': 81},
        'metka': {'a': 0, 'size': 100, 'pos': 17, 'lang': 82},
        'time_dobavleno': {'a': 0, 'size': 120, 'pos': 18, 'lang': 83},
        'time_zavircheno': {'a': 0, 'size': 120, 'pos': 19, 'lang': 84},
        'controls': {'a': 1, 'size': 57, 'pos': 20, 'lang': 21}
    }
    var timer = function() {
        var status = 0;
        var tmr = null;
        var interval = settings.bg_update_interval;
        var start = function() {
            if (status)
                return 0;
            if (settings.icon_dl_count == 0 && settings.dl_cmpl_notify == 0) {
                return 0;
            }
            status = 1;
            tmr = setInterval(function() {
                getTorrentList();
            }, interval);
            return 1;
        }
        var stop = function() {
            if (status) {
                clearInterval(tmr);
                status = 0;
            }
            return 1;
        }
        return {
            start: function() {
                return start();
            },
            stop: function() {
                return stop();
            },
            status: function() {
                return status;
            },
        }
    }();
    var tmp_vars = {
        'token_reconnect_counter': 0,
        'get': {},
    }
    var status = function() {
        var storage = {}
        var connection = function(s, d) {
            var old_s = -1;
            var old_d = null;
            if ('connection' in storage) {
                old_s = storage.connection.status;
                old_d = storage.connection.name;
            }
            if (s != null) {
                storage['connection'] = {'status': s, 'name': d};
            }
            if ((old_s != s || old_d != d) && popup.chk()) {
                tmp_vars.popup.manager.setStatus(s, (typeof(d) == 'number') ? lang_arr[d] : d);
            }
        }
        var get = function(type) {
            var s = -1;
            var d = null;
            if (type in storage) {
                s = storage[type]['status'];
                d = storage[type]['name'];
            }
            if (popup.chk()) {
                tmp_vars.popup.manager.setStatus(s, (typeof(d) == 'number') ? lang_arr[d] : d);
            }
        }
        return {
            connection: function(s, d) {
                return connection(s, d);
            },
            get: function(t) {
                return get(t);
            }
        }
    }()
    var getToken = function(callback) {
        status.connection(-1);
        $.ajax({
            type: "GET",
            url: settings.ut_url + "token.html",
            beforeSend: function(xhr) {
                xhr.setRequestHeader("Authorization", "Basic " + window.btoa(settings.login + ":" + settings.password) + "=");
            },
            success: function(data) {
                status.connection(0);
                tmp_vars.get = {}
                tmp_vars.get['token'] = $(data).text();
                tmp_vars.get['torrentc'] = 0;
                tmp_vars.token_reconnect_counter = 0;
                if (typeof(callback) === 'function') {
                    callback();
                }
            },
            error: function(xhr, ajaxOptions, thrownError) {
                var error_desk = (xhr.status == 0) ? 36 : (xhr.status == 404) ? 35 :
                        (xhr.status == 401) ? 34 : (xhr.status == 400) ? 38 :
                        lang_arr[71] + xhr.status + ' ' + thrownError;
                status.connection(1, error_desk);
                tmp_vars.token_reconnect_counter += 1;
                if (tmp_vars.token_reconnect_counter > 3)
                {
                    timer.stop();
                    tmp_vars.token_reconnect_counter = 0;
                }
            }
        });
    }
    var popup = function() {
        var popup = {'window': null}
        return {
            get: function() {
                tmp_vars['popup'] = popup;
                return popup
            },
            set: function() {
                var windows = chrome.extension.getViews({type: 'popup'});
                popup = {'window': null}
                var t = 0;
                for (var n = 0; n < windows.length; n++) {
                    if (t < windows[n].create_time) {
                        popup = windows[n]
                        t = windows[n].create_time;
                    }
                }
                tmp_vars['popup'] = popup;
            },
            chk: function() {
                return (popup.window) ? 1 : 0;
            }
        }
    }()
    var get = function(action, cid)
    {
        if (!tmp_vars.get['token']) {
            getToken(function() {
                tmp_vars['get_repeat'] += 1;
                get(action, cid);
            })
            return 0;
        }

        $.ajax({
            type: "GET",
            cache: 0,
            url: settings.ut_url + "?token=" + tmp_vars.get['token'] + action + ((!cid) ? "&cid=" + tmp_vars.get['torrentc'] : ''),
            beforeSend: function(xhr) {
                xhr.setRequestHeader("Authorization", "Basic " + window.btoa(settings.login + ":" + settings.password) + "=");
            },
            success: function(data) {
                var obj = $.parseJSON(data);
                if ('build' in obj) {
                    //get build
                    if ('build' in tmp_vars.get && obj['build'] != tmp_vars.get['build']) {
                        tmp_vars.get['build'] = obj['build']
                    }
                }
                if ('torrentc' in obj) {
                    //get CID
                    tmp_vars.get['torrentc'] = obj['torrentc']
                }
                if ('torrentm' in obj) {
                    //remove torrent
                    tmp_vars.get['torrentm'] = obj['torrentm']
                    var cm = tmp_vars.get['torrentm'].length;
                    for (var nm = 0; nm < cm; nm++) {
                        var cs = tmp_vars.get['torrents'].length;
                        for (var ns = 0; ns < cs; ns++) {
                            if (tmp_vars.get['torrents'][ns][0] == tmp_vars.get['torrentm'][nm]) {
                                tmp_vars.get['torrents'].splice(ns, 1)
                                break;
                            }
                        }
                    }
                    if (popup.chk()) {
                        tmp_vars.popup.manager.deleteItem(obj['torrentm']);
                    }
                }
                if ('torrentp' in obj) {
                    //update with CID
                    tmp_vars.get['torrentp'] = obj['torrentp']
                    var cs = tmp_vars.get['torrents'].length;
                    var cp = tmp_vars.get['torrentp'].length;
                    for (var np = 0; np < cp; np++) {
                        var ex = 0;
                        for (var ns = 0; ns < cs; ns++) {
                            if (tmp_vars.get['torrents'][ns][0] == tmp_vars.get['torrentp'][np][0]) {
                                tmp_vars.get['torrents'][ns] = tmp_vars.get['torrentp'][np];
                                ex = 1;
                                break;
                            }
                        }
                        if (ex == 0) {
                            tmp_vars.get['torrents'][tmp_vars.get['torrents'].length] = tmp_vars.get['torrentp'][np];
                        }
                    }
                    if (popup.chk()) {
                        tmp_vars.popup.manager.updateList(obj['torrentp'], 1);
                    }
                }
                if ('torrents' in obj) {
                    //Full torrent list
                    tmp_vars.get['torrents'] = obj['torrents']
                    if (popup.chk()) {
                        tmp_vars.popup.manager.updateList(obj['torrents'], 0);
                    }
                }
                if ('download-dirs' in obj) {
                    tmp_vars.get['download-dirs'] = obj['download-dirs']
                }
                if ('label' in obj) {
                    if ('label' in tmp_vars.get == false || tmp_vars.get['label'].toString() != obj['label'].toString()) {
                        tmp_vars.get['label'] = obj['label']
                        if (popup.chk()) {
                            tmp_vars.popup.manager.setLabels(tmp_vars.get['label']);
                        }
                    }
                }
                if ('settings' in obj) {
                    tmp_vars.get['settings'] = obj['settings']
                    if (popup.chk()) {
                        tmp_vars.popup.manager.setSpeedLimit(tmp_vars.get['settings']);
                    }
                }
                if ('files' in obj) {
                    tmp_vars.get['files'] = obj['files']
                }
                status.connection(0, 22);
            },
            error: function(xhr, ajaxOptions, thrownError) {
                var error_desk = (xhr.status == 0) ? 36 : (xhr.status == 400) ? 38 :
                        lang_arr[71] + xhr.status + ' ' + thrownError;
                status.connection(1, error_desk);
                if (xhr.status == 400) {
                    tmp_vars.get['token'] == null;
                    getToken(function() {
                        tmp_vars['get_repeat'] += 1;
                        get(action, cid);
                    });
                }
            }
        });
    }
    var getTorrentList = function(subaction) {
        var action = "&list=1" + ((subaction) ? subaction : '');
        get(action);
    }
    var sendAction = function(action) {
        get(action);
    }
    return {
        begin: function() {
            timer.start();
        },
        getTorrentList: function(t) {
            return getTorrentList(t);
        },
        sendAction: function(t) {
            return sendAction(t);
        },
        get_cache_torrent_list: function() {
            if ('torrents' in tmp_vars.get) {
                if (popup.chk()) {
                    tmp_vars.popup.manager.updateList(tmp_vars.get['torrents']);
                    return 1;
                }
            }
            return 0;
        },
        getToken: function() {
            return getToken();
        },
        getSettings: function() {
            return settings;
        },
        getColums: function() {
            return colums;
        },
        setWindow: function() {
            return popup.set();
        },
        getStatus: function() {
            return status.get('connection');
        },
        getLabels: function() {
            if ('label' in tmp_vars.get && popup.chk()) {
                tmp_vars.popup.manager.setLabels(tmp_vars.get['label']);
                return 1;
            }
            return 0;
        },
        getLimit: function() {
            get('&action=getsettings');
        }
    }
}();
$(document).ready(function() {
    chrome.browserAction.setBadgeBackgroundColor({
        "color": [0, 0, 0, 40]
    })
    engine.begin();
});