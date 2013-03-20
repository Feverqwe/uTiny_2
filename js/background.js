var engine = function() {
    var def_settings = {
        ssl : {"v":0,"t":"checkbox"},
        ut_ip: {"v":"127.0.0.1","t":"text"},
        ut_port : {"v":8080,"t":"number"},
        ut_path: {"v":"gui/","t":"text"},
        show_active_tr_on_icon: {"v":1,"t":"checkbox"},
        notify_on_dl_comp: {"v":1,"t":"checkbox"},
        bg_update_interval: {"v":60000*3,"t":"number"},
        mgr_update_interval: {"v":2000,"t":"number"},
        notify_visbl_interval: {"v":5000,"t":"number"},
        login: {"v":null,"t":"text"},
        password: {"v":null,"t":"password"},
        hide_seeding: {"v":0,"t":"checkbox"},
        hide_finished: {"v":0,"t":"checkbox"},
        graph: {"v":0,"t":"checkbox"},
        window_height: {"v":(300 - 54),"t":"number"},
        change_downloads: {"v":0,"t":"checkbox"},
        auto_order : {"v":0,"t":"checkbox"},
        context_menu_trigger : {"v":1,"t":"checkbox"},
    }
    var settings = {
        ut_url : null,
        ssl : (localStorage.ssl !== undefined) ? localStorage.ssl : def_settings.ssl.v,
        ut_ip: (localStorage.ut_ip !== undefined) ? localStorage.ut_ip : def_settings.ut_ip.v,
        ut_port : (localStorage.ut_port !== undefined) ? localStorage.ut_port : def_settings.ut_port.v,
        ut_path: (localStorage.ut_path !== undefined) ? localStorage.ut_path : def_settings.ut_path.v,
        show_active_tr_on_icon: (localStorage.show_active_tr_on_icon !== undefined) ? localStorage.show_active_tr_on_icon : def_settings.show_active_tr_on_icon.v,
        notify_on_dl_comp: (localStorage.notify_on_dl_comp !== undefined) ? localStorage.notify_on_dl_comp : def_settings.notify_on_dl_comp.v,
        bg_update_interval: (localStorage.bg_update_interval !== undefined && localStorage.bg_update_interval > 5000) ? localStorage.bg_update_interval : def_settings.bg_update_interval.v,
        mgr_update_interval: (localStorage.mgr_update_interval !== undefined && localStorage.mgr_update_interval > 500) ? localStorage.mgr_update_interval : def_settings.mgr_update_interval.v,
        notify_visbl_interval: (localStorage.notify_visbl_interval !== undefined) ? localStorage.notify_visbl_interval : def_settings.notify_visbl_interval.v,
        login: (localStorage.login !== undefined) ? localStorage.login : def_settings.login.v,
        password: (localStorage.password !== undefined) ? localStorage.password : def_settings.password.v,
        hide_seeding: (localStorage.hide_seeding !== undefined) ? localStorage.hide_seeding : def_settings.hide_seeding.v,
        hide_finished: (localStorage.hide_finished !== undefined) ? localStorage.hide_finished : def_settings.hide_finished.v,
        graph: (localStorage.graph !== undefined) ? localStorage.graph : def_settings.graph.v,
        window_height: (localStorage.window_height !== undefined) ? (localStorage.window_height - 54) : def_settings.window_height.v,
        change_downloads: (localStorage.change_downloads !== undefined) ? (localStorage.change_downloads) : def_settings.change_downloads.v,
        auto_order : (localStorage.auto_order !== undefined) ? (localStorage.auto_order) : def_settings.auto_order.v,
        context_menu_trigger : (localStorage.context_menu_trigger !== undefined) ? (localStorage.context_menu_trigger) : def_settings.context_menu_trigger.v,
        folders_array : (localStorage.folders_array !== undefined) ? JSON.parse(localStorage.folders_array) : null,
    };
    var colums = {
        'name': {'a': 1, 'size': 200, 'pos': 1, 'lang': 13, 'order': 1},
        'position': {'a': 0, 'size': 20, 'pos': 2, 'lang': 74, 'order': 1},
        'size': {'a': 1, 'size': 60, 'pos': 3, 'lang': 14, 'order': 1},
        'ostalos': {'a': 0, 'size': 60, 'pos': 4, 'lang': 75, 'order': 1},
        'progress': {'a': 1, 'size': 70, 'pos': 5, 'lang': 15, 'order': 1},
        'status': {'a': 1, 'size': 70, 'pos': 6, 'lang': 16, 'order': 1},
        'seeds': {'a': 0, 'size': 30, 'pos': 7, 'lang': 76, 'order': 1},
        'peers': {'a': 0, 'size': 30, 'pos': 8, 'lang': 77, 'order': 1},
        'seeds_peers': {'a': 1, 'size': 40, 'pos': 9, 'lang': 20, 'order': 1},
        'down_speed': {'a': 1, 'size': 60, 'pos': 10, 'lang': 18, 'order': 1},
        'uplo_speed': {'a': 1, 'size': 60, 'pos': 11, 'lang': 19, 'order': 1},
        'time': {'a': 1, 'size': 70, 'pos': 12, 'lang': 17, 'order': 1},
        'otdano': {'a': 0, 'size': 60, 'pos': 13, 'lang': 78, 'order': 1},
        'poluchino': {'a': 0, 'size': 60, 'pos': 14, 'lang': 79, 'order': 1},
        'koeficient': {'a': 0, 'size': 60, 'pos': 15, 'lang': 80, 'order': 1},
        'dostupno': {'a': 0, 'size': 60, 'pos': 16, 'lang': 81, 'order': 1},
        'metka': {'a': 0, 'size': 100, 'pos': 17, 'lang': 82, 'order': 1},
        'time_dobavleno': {'a': 0, 'size': 120, 'pos': 18, 'lang': 83, 'order': 1},
        'time_zavircheno': {'a': 0, 'size': 120, 'pos': 19, 'lang': 84, 'order': 1},
        'controls': {'a': 1, 'size': 57, 'pos': 20, 'lang': 21, 'order': 0}
    };
    var fl_colums = {
        'select': {'a': 1, 'size': 19, 'pos': 1, 'lang': 113, 'order': 0},
        'name': {'a': 1, 'size': 300, 'pos': 2, 'lang': 88, 'order': 1},
        'size': {'a': 1, 'size': 60, 'pos': 3, 'lang': 14, 'order': 1},
        'download': {'a': 1, 'size': 60, 'pos': 4, 'lang': 79, 'order': 1},
        'progress': {'a': 1, 'size': 70, 'pos': 5, 'lang': 15, 'order': 1},
        'priority': {'a': 1, 'size': 74, 'pos': 6, 'lang': 89, 'order': 1},
    };
    var timer = function() {
        var status = 0;
        var tmr = null;
        var interval = settings.bg_update_interval;
        var start = function() {
            if (status)
                return 0;
            if (settings.show_active_tr_on_icon == 0 && settings.notify_on_dl_comp == 0) {
                return 0;
            }
            status = 1;
            tmr = setInterval(function() {
                getTorrentList();
            }, interval);
            return 1;
        };
        var stop = function() {
            if (status) {
                clearInterval(tmr);
                status = 0;
            }
            return 1;
        };
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
        };
    }();
    var tmp_vars = {
        'token_reconnect_counter': 0,
        'get': {},
        'last_complite_time': 0,
        'active_torrent': 0,
        'get_repeat': 0,
    };
    var status = function() {
        var storage = {};
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
        };
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
        };
        return {
            connection: function(s, d) {
                return connection(s, d);
            },
            get: function(t) {
                return get(t);
            }
        };
    }();
    var getToken = function(callback, callbackfail) {
        status.connection(-1);
        $.ajax({
            type: "GET",
            url: settings.ut_url + "token.html",
            beforeSend: function(xhr) {
                xhr.setRequestHeader("Authorization", "Basic " + window.btoa(settings.login + ":" + settings.password) + "=");
            },
            success: function(data) {
                status.connection(0);
                tmp_vars.get = {};
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
                callbackfail();
            }
        });
    };
    var popup = function() {
        var popup = {'window': null};
        return {
            get: function() {
                tmp_vars['popup'] = popup;
                return popup;
            },
            set: function() {
                var windows = chrome.extension.getViews({type: 'popup'});
                popup = {'window': null};
                var t = 0;
                for (var n = 0; n < windows.length; n++) {
                    if (t < windows[n].create_time) {
                        popup = windows[n];
                        t = windows[n].create_time;
                    }
                }
                tmp_vars['popup'] = popup;
            },
            chk: function() {
                return (popup.window) ? 1 : 0;
            }
        };
    }();
    var addons_notify = function(olda, newa) {
        if (!settings.notify_on_dl_comp) {
            return;
        }
        if (!olda) {
            return;
        }
        var co = olda.length;
        var cn = newa.length;
        for (var nn = 0; nn < cn; nn++) {
            if (newa[nn][4] == 1000 && newa[nn][24] > tmp_vars.last_complite_time) {
                for (var no = 0; no < co; no++) {
                    if (olda[no][0] == newa[nn][0] && olda[no][4] != 1000 && olda[no][24] == 0) {
                        (function notify(nn) {
                            var notification = webkitNotifications.createNotification(
                                    '/images/icon.png',
                                    newa[nn][2],
                                    lang_arr[57] + newa[nn][21]
                                    );
                            notification.show();
                            if (settings.notify_visbl_interval) {
                                this.setTimeout(function() {
                                    notification.cancel();
                                }, settings.notify_visbl_interval);
                            }
                        })(nn);
                    }
                }
            }
        }
    };
    var addons_active = function(arr) {
        if (!settings.show_active_tr_on_icon)
            return;
        var c = arr.length;
        var ac = 0;
        for (var n = 0; n < c; n++) {
            if (arr[n][4] != 1000 && arr[n][24] == 0) {
                ac++;
            }
        }
        if (tmp_vars.active_torrent != ac) {
            tmp_vars.active_torrent = ac;
            chrome.browserAction.setBadgeText({
                "text": (tmp_vars.active_torrent) ? '' + tmp_vars.active_torrent : ''
            });
        }
    };
    var get = function(action, cid)
    {
        if (!tmp_vars.get['token']) {
            getToken(function() {
                tmp_vars['get_repeat'] += 1;
                get(action, cid);
            });
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
                        tmp_vars.get['build'] = obj['build'];
                    }
                }
                if ('torrentc' in obj) {
                    //get CID
                    tmp_vars.get['torrentc'] = obj['torrentc'];
                }
                if ('torrentm' in obj) {
                    //remove torrent
                    tmp_vars.get['torrentm'] = obj['torrentm'];
                    var cm = tmp_vars.get['torrentm'].length;
                    for (var nm = 0; nm < cm; nm++) {
                        var cs = tmp_vars.get['torrents'].length;
                        for (var ns = 0; ns < cs; ns++) {
                            if (tmp_vars.get['torrents'][ns][0] == tmp_vars.get['torrentm'][nm]) {
                                tmp_vars.get['torrents'].splice(ns, 1);
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
                    addons_notify(tmp_vars.get['torrents'], obj['torrentp']);
                    tmp_vars.get['torrentp'] = obj['torrentp'];
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
                            if (tmp_vars.new_file_monitoring) {
                                tmp_vars.new_file_monitoring(obj['torrentp'][np][2]);
                                tmp_vars.new_file_monitoring = null;
                            }
                        }
                    }
                    if (tmp_vars.new_file_monitoring) {
                        tmp_vars.new_file_monitoring(null, 1);
                        tmp_vars.new_file_monitoring = null;
                    }
                    if (popup.chk()) {
                        tmp_vars.popup.manager.updateList(obj['torrentp'], 1);
                    }
                    addons_active(tmp_vars.get['torrentp']);
                }
                if ('torrents' in obj) {
                    if (tmp_vars.new_file_monitoring) {
                        tmp_vars.new_file_monitoring(obj['torrents'][obj['torrents'].length - 1][2]);
                        tmp_vars.new_file_monitoring = null;
                    }
                    //Full torrent list
                    addons_notify(tmp_vars.get['torrents'], obj['torrents']);
                    tmp_vars.get['torrents'] = obj['torrents'];
                    if (popup.chk()) {
                        tmp_vars.popup.manager.updateList(obj['torrents'], 0);
                    }
                    addons_active(tmp_vars.get['torrents']);
                }
                if ('download-dirs' in obj) {
                    tmp_vars.get['download-dirs'] = obj['download-dirs'];
                }
                if ('label' in obj) {
                    if ('label' in tmp_vars.get == false || tmp_vars.get['label'].toString() != obj['label'].toString()) {
                        tmp_vars.get['label'] = obj['label'];
                        if (popup.chk()) {
                            tmp_vars.popup.manager.setLabels(tmp_vars.get['label']);
                        }
                    }
                }
                if ('settings' in obj) {
                    tmp_vars.get['settings'] = obj['settings'];
                    if (popup.chk()) {
                        tmp_vars.popup.manager.setSpeedLimit(tmp_vars.get['settings']);
                    }
                }
                if ('files' in obj) {
                    tmp_vars.get['files'] = obj['files'];
                    if (popup.chk()) {
                        tmp_vars.popup.manager.setFileList(tmp_vars.get['files']);
                    }
                }
                status.connection(0, 22);
                tmp_vars['get_repeat'] = 0;
            },
            error: function(xhr, ajaxOptions, thrownError) {
                var error_desk = (xhr.status == 0) ? 36 : (xhr.status == 400) ? 38 :
                        lang_arr[71] + xhr.status + ' ' + thrownError;
                status.connection(1, error_desk);
                if (xhr.status == 400 && tmp_vars['get_repeat'] <= 3) {
                    tmp_vars.get['token'] = null;
                    getToken(function() {
                        tmp_vars['get_repeat'] += 1;
                        get(action, cid);
                    });
                }
            }
        });
    };
    var context_menu_obj = function() {
        var context_menu = null;
        var tmr = null;
        var notification_link = null;
        var getTorrentsList = function() {
            try {
                var xhr = new XMLHttpRequest();
                xhr.open("GET", settings.ut_url + "?token=" + tmp_vars.get['token'] + "&list=1" + "&cid=" + tmp_vars.get['torrentc'], false);
                xhr.setRequestHeader("Authorization", "Basic " + window.btoa(settings.login + ":" + settings.password) + "=");
                xhr.send(null);
            } catch (e) {
                return null;
            }
            // convert response to an object
            return JSON.parse(xhr.responseText);
        };
        var handleResponse = function(responseText) {
            // check for errors
            var response = null;
            try {
                response = JSON.parse(responseText);
            } catch (err) {
                link_note(lang_arr[103], err.toString(), 1);
            }
            if (response.error) {
                link_note(lang_arr[23], response.error, 1);
            } else {
                tmp_vars.new_file_monitoring = function(name, e) {
                    if (e) {
                        link_note(lang_arr[112], null, 1);
                    } else {
                        link_note(name, lang_arr[102], null);
                        if (settings.change_downloads) {
                            var label = {k: 'download', v: null};
                            localStorage.selected_label = JSON.stringify(label);
                            if (popup.chk()) {
                                tmp_vars.popup.manager.setLabel(label);
                            }
                        }
                    }
                };
                get("&list=1");
            }
        };
        var downloadFile = function(url, callback) {
            var xhr = new XMLHttpRequest();
            xhr.open("GET", url, true);
            xhr.overrideMimeType("text/plain; charset=x-user-defined");
            xhr.responseType = "blob";
            xhr.onload = function() {
                callback(xhr.response);
            };
            xhr.send(null);
        };
        var uploadTorrent = function(file, dir_url) {
            var formdata = new FormData();
            formdata.append("torrent_file", file);
            var xhr = new XMLHttpRequest();
            xhr.open("POST", settings.ut_url + "?token=" + tmp_vars.get['token'] + "&action=add-file" + dir_url, true);
            xhr.onreadystatechange = function() {
                if (xhr.readyState === 4) {
                    handleResponse(xhr.responseText);
                }
            };
            xhr.send(formdata);
        };
        var uploadMagnet = function(url, dir_url) {
            var xhr = new XMLHttpRequest();
            xhr.open("GET", settings.ut_url + "?token=" + tmp_vars.get['token'] + "&action=add-url&s=" + url + dir_url, true);
            xhr.onreadystatechange = function() {
                if (xhr.readyState === 4) {
                    handleResponse(xhr.responseText);
                }
            };
            xhr.send(null);
        };
        var link_note = function(a, b, e)
        {
            if (notification_link) {
                notification_link.cancel();
                notification_link = null;
                clearInterval(tmr);
            }
            var icon = 'images/add.png';
            if (e) {
                icon = 'images/warning.png';
            }
            notification_link = webkitNotifications.createNotification(
                    'images/' + ((e) ? 'warning.png' : 'add.png'),
                    a, (b) ? b : ''
                    );
            notification_link.show();
            tmr = setTimeout(function() {
                if (notification_link) {
                    notification_link.cancel();
                }
            }, (settings.notify_visbl_interval)?settings.notify_visbl_interval:2000);
        };
        var addTorrent = function(a) {
            if (!tmp_vars.get['token']) {
                return getToken(function() {
                    addTorrent(a);
                }, function() {
                    link_note(lang_arr[38], null, 1);
                });
            }
            var dir_url = '';
            if (context_menu) {
                var context = context_menu[a.menuItemId];
                dir_url = "&download_dir=" + encodeURIComponent(context.key) + "&path=" + encodeURIComponent(context.val);
            }
            chrome.tabs.getSelected(null, function(tab) {
                if (a.linkUrl.substr(0, 7) == 'magnet:')
                    uploadMagnet(encodeURIComponent(a.linkUrl), dir_url);
                else
                    downloadFile(a.linkUrl, function(file) {
                        uploadTorrent(file, dir_url);
                    });
            });
        };
        return {
            'load': function() {
                chrome.contextMenus.removeAll();
                var parentID = chrome.contextMenus.create({
                    "title": lang_arr[104],
                    "contexts": ["link"],
                    "onclick": addTorrent
                });
                //выбор каталога из контекстного меню>
                if (settings.folders_array)
                {
                    var arr = settings.folders_array;
                    var c = arr.length;
                    var items = [];
                    for (var i = 0; i < c; i++)
                    {
                        var item = chrome.contextMenus.create({
                            "title": arr[i][1],
                            "contexts": ["link"],
                            "onclick": addTorrent,
                            "parentId": parentID
                        });
                        items[item] = {
                            'key': arr[i][0],
                            'val': arr[i][1]
                        };
                    }
                    context_menu = items;
                }
            }
        };
    }();
    var getTorrentList = function(subaction) {
        var action = "&list=1" + ((subaction) ? subaction : '');
        get(action);
    };
    var sendAction = function(action, cid) {
        get(action, cid);
    };
    return {
        begin: function() {
            settings.ut_url = ((settings.ssl)?'https' : 'http') + "://" + settings.ut_ip + ':' + settings.ut_port + '/' + settings.ut_path,
            timer.start();
            if (settings.context_menu_trigger) {
                context_menu_obj.load();
            }
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
            return (localStorage.colums !== undefined) ? JSON.parse(localStorage.colums) : colums;
        },
        getDefColums: function() {
            return colums;
        },
        getDefFlColums: function() {
            return fl_colums;
        },
        getFlColums: function() {
            return (localStorage.fl_colums !== undefined) ? JSON.parse(localStorage.fl_colums) : fl_colums;
        },
        setFlColums: function(a) {
            localStorage.fl_colums = JSON.stringify(a);
        },
        setColums: function(a) {
            localStorage.colums = JSON.stringify(a);
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
        },
        getDefSettings: function () {
            return def_settings;
        }
    };
}();
$(document).ready(function() {
    chrome.browserAction.setBadgeBackgroundColor({
        "color": [0, 0, 0, 40]
    });
    chrome.browserAction.setBadgeText({
        "text": ''
    });
    engine.begin();
});