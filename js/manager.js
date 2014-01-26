(function(){
    window._engine = chrome.extension.getBackgroundPage().engine;
    window._lang_arr = chrome.extension.getBackgroundPage().lang_arr;
    window._settings = _engine.settings;
    if (_settings.login === undefined || _settings.password === undefined) {
        window.location = "options.html";
    }
})();
var manager = function() {
    var var_cache = {
        status: null,
        tr_list: {},
        tr_list_dom: {},
        fl_list: [],
        fl_list_dom: [],
        fl_list_gui: [],
        fl_list_gui_display: []
    };
    var dom_cache = {};
    var options = {
        current_label: {},
        tr_word_wrap: false,
        fl_word_wrap: true,
        scroll_width: 15
    };
    var write_tr_head = function () {
        var style_text = '';
        var head = $('<tr>');
        var width = 0;
        $.each(var_cache.tr_colums, function (key, value) {
            if (value.a !== 1) {
                return 1;
            }
            head.append($('<th>', {'class': (key + ((value.order) ? ' s' : '')), title: _lang_arr[value.lang][1]}).append($('<div>', {text: _lang_arr[value.lang][0]})));
            style_text += '.torrent-list-layer th.' + key + ', .torrent-list-layer td.' + key + ' {max-width:' + value.size + 'px; min-width:' + value.size + 'px}';
            //2px padding; 1-border size right; 2px ??
            width += value.size + 2 + 1 + 2;
        });
        //no border last element
        width -= 1;
        width = width + options.scroll_width;
        if (width > 800) {
            width = 800;
        }
        var style = $('<style>',{class: 'torrent-style', text: style_text});
        dom_cache.body.children('style.torrent-style').remove();
        dom_cache.body.append(style);
        dom_cache.body.css('width', width+'px');
        var_cache.body_width = dom_cache.body.width();
        dom_cache.tr_head.html(head);
        dom_cache.tr_fixed_head.html(head.clone());
    };
    var write_fl_head = function () {
        var style_text = '';
        var head = $('<tr>');
        var width = 0;
        var n = 0;
        $.each(var_cache.fl_colums, function (key, value) {
            if (value.a !== 1) {
                return 1;
            }
            n++;
            if (key === 'select') {
                head.append($('<th>', {'class': (key + ((value.order) ? ' s' : '')), title: _lang_arr[value.lang][1]}).append($('<div>').append($('<input>', {type: 'checkbox'}))));
            } else {
                head.append($('<th>', {'class': (key + ((value.order) ? ' s' : '')), title: _lang_arr[value.lang][1]}).append($('<div>', {text: _lang_arr[value.lang][0]})));
            }
            style_text += '.fl-layer th.' + key + ', .fl-layer td.' + key + ' {max-width:' + value.size + 'px; min-width:' + value.size + 'px}';
            //2px padding; 1-border size right; 2px ??
            width += value.size + 2 + 1 + 2;
        });
        //no border last element
        width -= 1;
        width += options.scroll_width;
        var_cache.fl_width = width;
        if (width > var_cache.body_width) {
            width = var_cache.body_width;
            style_text += 'div.file-list {max-width:' + var_cache.body_width + 'px; border-radius: 0;}';
        }
        var fl_body_height = window.innerHeight - 34 - 19;
        var fl_table_height = fl_body_height - 34;
        var_cache.fl_height = fl_table_height;
        style_text += 'div.file-list {' +
            'left: ' + ((var_cache.body_width - width) / 2) + "px; " +
            'height: ' + fl_body_height + 'px; ' +
            'width: ' + width + 'px;' +
            '}';
        style_text += 'div.fl-layer {' +
            'max-height: ' + fl_table_height + 'px;' +
            'min-height: ' + fl_table_height + 'px; }';
        var style = $('<style>', {class: 'filelist-style', text: style_text});
        dom_cache.body.children('style.filelist-style').remove();
        dom_cache.body.append(style);
        dom_cache.fl_head.html(head);
        dom_cache.fl_fixed_head.html(head.clone());
    };
    var writeLanguage = function () {
        var webUi_url = ((_settings.ssl) ? 'https' : 'http') + "://" + _settings.login + ":" + _settings.password + "@" +
            _settings.ut_ip + ":" + _settings.ut_port + "/" + _settings.ut_path;
        dom_cache.menu.find('a.refresh').attr('title', _lang_arr[24]);
        dom_cache.menu.find('a.wui').attr('title', _lang_arr[26]).attr('href', webUi_url);
        dom_cache.menu.find('a.add_file').attr('title', _lang_arr[118]);
        dom_cache.menu.find('a.add_magnet').attr('title', _lang_arr[120]);
        dom_cache.menu.find('a.start_all').attr('title', _lang_arr[68]);
        dom_cache.menu.find('a.pause_all').attr('title', _lang_arr[67]);
        dom_cache.fl_bottom.find('a.update').attr('title', _lang_arr[91][1]);
        dom_cache.fl_bottom.find('a.close').attr('title', _lang_arr[91][2]);
    };
    var setLabels = function (items) {
        var custom = ['all', 'download', 'seeding', 'complite', 'active', 'inacive', 'no label'];
        var $options = [];
        for (var i = 0, item; item = custom[i]; i++) {
            $options.push( $('<option>', {value: item, text: _lang_arr[70][i], selected: (options.current_label.type === 'custom' && options.current_label.text === item)}).data('image', item).data('type', 'custom'));
        }
        for (var i = 0, item; item = items[i]; i++) {
            item = item[0];
            $options.push( $('<option>', {value: item, text: item, selected: (options.current_label.type === undefined && options.current_label.text === item)}) );
        }
        dom_cache.label_select.selectBox('options', $options);
    };
    var tr_itemFilter = function (item) {
        //проверяет запись на фильтр
        return true;
    };
    var tr_changeFilter = function (label, data) {
        if (var_cache.current_filter === label) {
            return;
        }
        var_cache.current_filter = label;
        var isCustom = (data.type === 'custom');

        if (!isCustom) {
            //filter by label
            return;
        }
        //filter by active
    };
    var setStatus = function (text) {
        if (var_cache.status === text) {
            return;
        }
        var_cache.status = text;
        if (text === undefined) {
            dom_cache.status.html($('<img>', {src: '/images/status_update.gif'}));
        } else {
            dom_cache.status.text(text);
        }
    };
    var tr_indexToChanges = function (n, cl) {
        if (n === 1) {
            cl.status = (var_cache.tr_colums.status.a === 1) ? 1 : undefined;
            cl.progress = (var_cache.tr_colums.progress.a === 1) ? 1 : undefined;
        } else if (n === 2) {
            cl.name = (var_cache.tr_colums.name.a === 1) ? 1 : undefined;
        } else if (n === 3) {
            cl.size = (var_cache.tr_colums.size.a === 1) ? 1 : undefined;
            cl.ostalos = (var_cache.tr_colums.ostalos.a === 1) ? 1 : undefined;
        } else if (n === 4) {
            cl.progress = (var_cache.tr_colums.progress.a === 1) ? 1 : undefined;
        } else if (n === 21) {
            cl.status = (var_cache.tr_colums.status.a === 1) ? 1 : undefined;
        } else if (n === 9) {
            cl.down_speed = (var_cache.tr_colums.down_speed.a === 1) ? 1 : undefined;
            cl.ostalos = (var_cache.tr_colums.ostalos.a === 1) ? 1 : undefined;
        } else if (n === 8) {
            cl.uplo_speed = (var_cache.tr_colums.uplo_speed.a === 1) ? 1 : undefined;
        } else if (n === 12) {
            cl.seeds_peers = (var_cache.tr_colums.seeds_peers.a === 1) ? 1 : undefined;
        } else if (n === 14) {
            cl.seeds_peers = (var_cache.tr_colums.seeds_peers.a === 1) ? 1 : undefined;
        } else if (n === 17) {
            cl.position = (var_cache.tr_colums.position.a === 1) ? 1 : undefined;
        } else if (n === 15) {
            cl.seeds = (var_cache.tr_colums.seeds.a === 1) ? 1 : undefined;
        } else if (n === 13) {
            cl.peers = (var_cache.tr_colums.peers.a === 1) ? 1 : undefined;
        } else if (n === 10) {
            cl.time = (var_cache.tr_colums.time.a === 1) ? 1 : undefined;
        } else if (n === 6) {
            cl.otdano = (var_cache.tr_colums.otdano.a === 1) ? 1 : undefined;
        } else if (n === 5) {
            cl.poluchino = (var_cache.tr_colums.poluchino.a === 1) ? 1 : undefined;
        } else if (n === 7) {
            cl.koeficient = (var_cache.tr_colums.koeficient.a === 1) ? 1 : undefined;
        } else if (n === 16) {
            cl.dostupno = (var_cache.tr_colums.dostupno.a === 1) ? 1 : undefined;
        } else if (n === 11) {
            cl.metka = (var_cache.tr_colums.metka.a === 1) ? 1 : undefined;
            cl.data_label = 1;
        } else if (n === 23) {
            cl.time_dobavleno = (var_cache.tr_colums.time_dobavleno.a === 1) ? 1 : undefined;
        } else if (n === 24) {
            cl.time_zavircheno = (var_cache.tr_colums.time_zavircheno.a === 1) ? 1 : undefined;
        } else if (n === 22) {
            cl.data_sid = 1;
        } else if (n === 26) {
            cl.data_path = 1;
        }
    };
    var tr_create_switch = function (key, v) {
        if (key === 'name') {
            return $('<td>', {'class': key}).append($('<div>', {title: v[2]}).append($('<span>', {text: v[2]})));
        } else if (key === 'size') {
            var text = bytesToSize(v[3]);
            return $('<td>', {'class': key}).data('value', v[3]).append($('<div>', {title: text, text: text}));
        } else if (key === 'progress') {
            var progress = v[4] / 10;
            var color = (v[1] === 201 && v[4] === 1000) ? '#41B541' : '#3687ED';
            return $('<td>', {'class': key}).data('value', v[4]).append($('<div>', {'class': 'progress_b'}).append($('<div>', {'class': 'val', text: progress + '%'}), $('<div>', {'class': 'progress_b_i', style: 'width: ' + Math.round(progress) + '%; background-color: ' + color + ';'})));
        } else if (key === 'status') {
            return $('<td>', {'class': key}).data('value', v[1]).append($('<div>', {title: v[21], text: v[21]}));
        } else if (key === 'down_speed') {
            return $('<td>', {'class': key}).data('value', v[9]).append($('<div>', {text: bytesToSize(v[9], '', 1)}));
        } else if (key === 'uplo_speed') {
            return $('<td>', {'class': key}).data('value', v[8]).append($('<div>', {text: bytesToSize(v[8], '', 1)}));
        } else if (key === 'seeds_peers') {
            return $('<td>', {'class': key}).append($('<div>', {text: v[14] + '/' + v[12]}));
        } else if (key === 'position') {
            var val = v[17];
            if (val < 0)
                val = '*';
            return $('<td>', {'class': key}).append($('<div>', {text: val}));
        } else if (key === 'ostalos') {
            var val = v[3] - v[5];
            if (val < 0)
                val = 0;
            return $('<td>', {'class': key}).data('value', val).append($('<div>', {text: bytesToSize(val, 0)}));
        } else if (key === 'seeds') {
            return $('<td>', {'class': key}).append($('<div>', {text: v[15]}));
        } else if (key === 'peers') {
            return $('<td>', {'class': key}).append($('<div>', {text: v[13]}));
        } else if (key === 'time') {
            var s_time = utimeToTimeOutString(v[10]);
            return $('<td>', {'class': key}).data('value', v[10]).append($('<div>', {text: s_time, title: s_time}));
        } else if (key === 'otdano') {
            return $('<td>', {'class': key}).data('value', v[6]).append($('<div>', {text: bytesToSize(v[6], 0)}));
        } else if (key === 'poluchino') {
            return $('<td>', {'class': key}).data('value', v[5]).append($('<div>', {text: bytesToSize(v[5], 0)}));
        } else if (key === 'koeficient') {
            var val = v[7] / 1000;
            return $('<td>', {'class': key}).data('value', v[7]).append($('<div>', {text: val}));
        } else if (key === 'dostupno') {
            var val = Math.round((v[16] / 65535) * 1000) / 1000;
            return $('<td>', {'class': key}).data('value', v[16]).append($('<div>', {text: val}));
        } else if (key === 'metka') {
            return $('<td>', {'class': key}).append($('<div>', {title: v[11], text: v[11]}));
        } else if (key === 'time_dobavleno') {
            var str_time = utimeToTimeStamp(v[23]);
            return $('<td>', {'class': key}).data('value', v[23]).append($('<div>', {text: str_time, title: str_time}));
        } else if (key === 'time_zavircheno') {
            var str_time = utimeToTimeStamp(v[24]);
            return $('<td>', {'class': key}).data('value', v[24]).append($('<div>', {text: str_time, title: str_time}));
        } else if (key === 'controls') {
            return $('<td>', {'class': key}).append($('<div>', {'class': 'btns'}).append($('<a>', {href: '#start', title: _lang_arr[0], 'class': 'start'}), $('<a>', {href: '#pause', title: _lang_arr[1], 'class': 'pause'}), $('<a>', {href: '#stop', title: _lang_arr[2], 'class': 'stop'})));
        }
        return '';
    };
    var tr_item_create = function (v) {
        var item = $('<tr>', {id: v[0], 'data-label': v[11]}).data('sid', v[22]).data('path', v[26]);
        $.each(var_cache.tr_colums, function (key, value) {
            if (value.a === 1) {
                item.append(tr_create_switch(key, v));
            }
        });
        var_cache.tr_list_dom[v[0]] = item;
        dom_cache.tr_body.prepend(item);
    };
    var tr_item_update = function (v, cl) {
        var item = var_cache.tr_list_dom[v[0]];
        if (cl.data_sid !== undefined) {
            item.data('sid', v[22]);
        }
        if (cl.data_path !== undefined) {
            item.data('path', v[26]);
        }
        if (cl.data_label !== undefined) {
            //it data need for filtering list
            item.attr('data-label', v[11]);
        }
        if (cl.name !== undefined) {
            var cell = item.children('td.name');
            cell.children('div').attr('title', v[2]).children('span').text(v[2]);
            if (options.moveble_enabled_tr) {
                calculateMoveble(dom_cache.tr_table_main.find('td.name > div > span'), var_cache.tr_colums.name.size);
            }
        }
        if (cl.size !== undefined) {
            var t_s = bytesToSize(v[3]);
            var cell = item.children('td.size');
            cell.data('value', v[3]).children('div').attr('title', t_s).text(t_s);
        }
        if (cl.progress !== undefined) {
            var progress = v[4] / 10;
            var cell = item.children('td.progress');
            var with_c = cell.data('value', v[4]).children('div.progress_b').children('div.progress_b_i');
            with_c.css('width', Math.round(progress) + '%').parent().children('div.val').text(progress + '%');
            if (v[1] === 201 && v[4] === 1000) {
                with_c.css('background-color', '#41B541');
            } else {
                with_c.css('background-color', '#3687ED');
            }
        }
        if (cl.status !== undefined) {
            var cell = item.children('td.status');
            cell.data('value', v[1]).children('div').attr('title', v[21]).text(v[21]);
        }
        if (cl.down_speed !== undefined) {
            var cell = item.children('td.down_speed');
            cell.data('value', v[9]).children('div').text(bytesToSize(v[9], '', 1));
        }
        if (cl.uplo_speed !== undefined) {
            var cell = item.children('td.uplo_speed');
            cell.data('value', v[8]).children('div').text(bytesToSize(v[8], '', 1));
        }
        if (cl.seeds_peers !== undefined) {
            var cell = item.children('td.seeds_peers');
            cell.children('div').text(v[14] + '/' + v[12]);
        }
        if (cl.position !== undefined) {
            var val = v[17];
            if (val < 0) {
                val = '*';
            }
            var cell = item.children('td.position');
            cell.children('div').text(val);
        }
        if (cl.ostalos !== undefined) {
            var val = v[3] - v[5];
            if (val < 0) {
                val = 0;
            }
            var cell = item.children('td.ostalos');
            cell.data('value', val).children('div').text(bytesToSize(val, 0));
        }
        if (cl.seeds !== undefined) {
            var cell = item.children('td.seeds');
            cell.children('div').text(v[15]);
        }
        if (cl.peers !== undefined) {
            var cell = item.children('td.peers');
            cell.children('div').text(v[13]);
        }
        if (cl.time !== undefined) {
            var text = utimeToTimeOutString(v[10]);
            var cell = item.children('td.time');
            cell.data('value', v[10]).children('div').attr('title', text).text(text);
        }
        if (cl.otdano !== undefined) {
            var cell = item.children('td.otdano');
            cell.data('value', v[6]).children('div').text(bytesToSize(v[6], 0));
        }
        if (cl.poluchino !== undefined) {
            var cell = item.children('td.poluchino');
            cell.data('value', v[5]).children('div').text(bytesToSize(v[5], 0));
        }
        if (cl.koeficient !== undefined) {
            var text = v[7] / 1000;
            var cell = item.children('td.koeficient');
            cell.data('value', v[7]).children('div').text(text);
        }
        if (cl.dostupno !== undefined) {
            var text = Math.round((v[16] / 65535) * 1000) / 1000;
            var cell = item.children('td.dostupno');
            cell.data('value', v[16]).children('div').text(text);
        }
        if (cl.metka !== undefined) {
            var cell = item.children('td.metka');
            cell.children('div').attr('title', v[11]).text(v[11]);
        }
        if (cl.time_dobavleno !== undefined) {
            var text = utimeToTimeStamp(v[23]);
            var cell = item.children('td.time_dobavleno');
            cell.children('div').attr('title', text).text(text);
        }
        if (cl.time_zavircheno === undefined) {
            var text = utimeToTimeStamp(v[24]);
            var cell = item.children('td.time_zavircheno');
            cell.children('div').attr('title', text).text(text);
        }
    };
    var tr_item_delete = function (id) {
        delete var_cache.tr_list[id];
        var_cache.tr_list_dom[id].remove();
        delete var_cache.tr_list_dom[id];
    };
    var tr_list = function (list) {
        var id_list = new Array(list.length);
        for (var i = 0, item; item = list[i]; i++) {
            var id = item[0];
            id_list[i] = id;
            var torrent_item = var_cache.tr_list[id];
            if (torrent_item === undefined) {
                var_cache.tr_list[id] = item;
                tr_item_create(item);
            } else {
                var change_list = {};
                var chenge_count = 0;
                torrent_item.forEach(function (param, n) {
                    if (param !== item[n]) {
                        tr_indexToChanges(n, change_list);
                        chenge_count++;
                    }
                });
                if (chenge_count === 0) {
                    continue;
                }
                tr_item_update(item, change_list);
                var_cache.tr_list[id] = item;
            }
        }
        var rm_list = [];
        $.each(var_cache.tr_list, function (id) {
            if (id_list.indexOf(id) === -1) {
                rm_list.push(id);
            }
        });
        for (var i = 0, item; item = rm_list[i]; i++) {
            tr_item_delete(item);
        }
        mgTimer.start();
    };
    var bytesToSize = function (bytes, nan, ps) {
        //переводит байты в строчки
        var sizes = (ps === undefined)?_lang_arr[59]:_lang_arr[60];
        if (nan === undefined)
            nan = 'n/a';
        if (bytes === 0)
            return nan;
        var i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
        if (i === 0) {
            return (bytes / Math.pow(1024, i)) + ' ' + sizes[i];
        }
        return (bytes / Math.pow(1024, i)).toFixed(1) + ' ' + sizes[i];
    };
    var utimeToTimeOutString = function (i) {
        //выписывает отсчет времени из unixtime
        if (i === -1) {
            return '∞';
        }
        var day = Math.floor(i / 60 / 60 / 24);
        var week = Math.floor(day / 7);
        var hour = Math.floor((i - day * 60 * 60 * 24) / 60 / 60);
        var minutes = Math.floor((i - day * 60 * 60 * 24 - hour * 60 * 60) / 60);
        var seconds = Math.floor((i - day * 60 * 60 * 24 - hour * 60 * 60 - minutes * 60));
        day = Math.floor(i / 60 / 60 / 24 - 7 * week);
        if (week > 10)
            return '∞';
        if (week > 0)
            return week + _lang_arr[61][0] + ' ' + day + _lang_arr[61][1];
        if (day > 0)
            return day + _lang_arr[61][1] + ' ' + hour + _lang_arr[61][2];
        if (hour > 0)
            return hour + _lang_arr[61][2] + ' ' + minutes + _lang_arr[61][3];
        if (minutes > 0)
            return minutes + _lang_arr[61][3] + ' ' + seconds + _lang_arr[61][4];
        if (seconds > 0)
            return seconds + _lang_arr[61][4];
        return '∞';
    };
    var utimeToTimeStamp = function (shtamp) {
        if (shtamp === 0) {
            return '∞';
        }
        var dt = new Date(shtamp * 1000);
        var m = dt.getMonth() + 1;
        if (m < 10)
            m = '0' + m.toString();
        var d = dt.getDate();
        if (d < 10)
            d = '0' + d.toString();
        var h = dt.getHours();
        if (h < 10)
            h = '0' + h.toString();
        var mi = dt.getMinutes();
        if (mi < 10)
            mi = '0' + mi.toString();
        var sec = dt.getSeconds();
        if (sec < 10)
            sec = '0' + sec.toString();
        return dt.getFullYear() + '-' + m + '-' + d + ' ' + h + ':' + mi + ':' + sec;
    };
    var calculateMoveble = function (titles, size, classname) {
        /*
         * Расчитывает стиль прокрутки длиных имен. для Winmap.
         */
        if (classname === undefined) {
            classname = 'title';
        }
        var titles_l = titles.length;

        for (var i = 0; i < titles_l; i++) {
            var str_w = titles.eq(i).width();
            if (str_w <= size) {
                titles.eq(i).parent().attr('class', classname);
                continue;
            }
            str_w = Math.ceil(str_w / 10);
            if (str_w > 10) {
                if (str_w < 100) {
                    var t1 = Math.round(str_w / 10);
                    if (t1 > str_w / 10)
                        str_w = t1 * 10 * 10;
                    else
                        str_w = (t1 * 10 + 5) * 10;
                } else
                    str_w = str_w * 10;
            } else
                str_w = str_w * 10;
            var time_calc = Math.round(parseInt(str_w) / parseInt(size) * 3.5);
            var move_name = 'moveble' + '_' + size + '_' + str_w;
            if (dom_cache.body.children('.' + move_name).length === 0) {
                dom_cache.body.append($('<style>', {'class': move_name, text: '@-webkit-keyframes a_' + move_name
                    + '{'
                    + '0%{margin-left:2px;}'
                    + '50%{margin-left:-' + (str_w - size) + 'px;}'
                    + '90%{margin-left:6px;}'
                    + '100%{margin-left:2px;}'
                    + '}'
                    + 'div.' + move_name + ':hover > span {'
                    + 'overflow: visible;'
                    + '-webkit-animation:a_' + move_name + ' ' + time_calc + 's;'
                    + '}'}));
            }
            titles.eq(i).parent().attr('class', classname + ' ' + move_name);
        }
    };
    var mgTimer = function () {
        var timer;
        var start = function () {
            clearInterval(timer);
            timer = setInterval(function () {
                getTorrentList();
            }, _settings.mgr_update_interval);
            mgTimer.isStart = true;
        };
        var stop = function () {
            if (!mgTimer.isStart) {
                return;
            }
            clearInterval(timer);
            mgTimer.isStart = false;
        };
        return {
            isStart: false,
            start: start,
            stop: stop
        };
    }();
    var getTorrentList = function () {
        mgTimer.stop();
        _engine.sendAction($.extend({list: 1}, var_cache.fl_param));
    };
    var fl_close = function () {
        dom_cache.fl.hide();
        var_cache.fl_show = false;
        var_cache.fl_list = [];
        var_cache.fl_list_dom = [];
        var_cache.fl_list_gui = [];
        var_cache.fl_list_gui_display = [];
        var_cache.fl_param = {};
        var_cache.tr_list_dom[var_cache.fl_id].removeClass('selected');
        dom_cache.body.children('style.fl_filter').remove();
        var_cache.fl_id = undefined;
        var_cache.fl_layer_dom.remove();
        dom_cache.fl_body.empty();
    };
    var fl_show = function (id) {
        var_cache.fl_id = id;
        var_cache.fl_param = {action: 'getfiles', hash: id};
        _engine.sendAction(var_cache.fl_param);
        var_cache.tr_list_dom[id].addClass('selected');
        var_cache.fl_layer_dom = $('<div>', {'class':'file-list-layer-temp'}).css({height: window.innerHeight, width: window.innerWidth})
            .on('mousedown',function () {
                $(this).remove();
                fl_close();
            })
            .appendTo(dom_cache.body);
        dom_cache.fl.show();
        if (!var_cache.fl_loading) {
            var_cache.fl_loading_dom = $('<div>', {'class': 'file-list-loading'}).css({top: var_cache.fl_height / 2 - 15, left: var_cache.fl_width / 2 - 15})
                .appendTo(dom_cache.fl_layer);
            var_cache.fl_loading = true;
        }
        var_cache.fl_show = true;
    };
    var fl_create_gui_link = function (path, n, level) {
        //create gui link
        if (var_cache.fl_list_gui_display[n] === undefined) {
            var_cache.fl_list_gui_display[n] = {mod_name: false, show: false};
        }
        var inCache = false;
        if (level === -1) {
            inCache = true;
            level = 0;
        }
        if (level === undefined) {
            level = 0;
        }
        var name;
        var links = [];
        if (inCache) {
            var dirs = path.split('/');
            name = dirs.splice(-1)[0];
            var path = [];
            for (var i = 0, dir; dir = dirs[i]; i++) {
                path.push(dir);
                var key = path.join('/');
                links.push({path: key, name: dir, back: dirs.slice(0, i).join('/')});
                if (var_cache.fl_list_gui[key] === undefined) {
                    var_cache.fl_list_gui[key] = {items: [], path: dirs.slice(i), level: i + 1, links: links};
                }
                if (var_cache.fl_list_gui[key].items.indexOf(n) === -1) {
                    var_cache.fl_list_gui[key].items.push(n);
                }
            }
        } else {
            var l_pos = path.lastIndexOf('/');
            var cache_path = path.substr(0, l_pos);
            name = path.substr(l_pos+1);
            links = var_cache.fl_list_gui[cache_path].links;
        }

        var dom_links;
        if (level !== 0) {
            var lev = level - 1;
            dom_links = new Array(links.length - lev);
            dom_links[lev] = $('<a>', {class: 'folder c'+lev, text: '←', href: '#'}).data('path', links[lev].back);
        } else {
            dom_links = new Array(links.length);
        }
        for (var i = level, link; link = links[i]; i++) {
            dom_links[i] = $('<a>', {class: 'folder c'+i, text: link.name, href: '#'}).data('path', link.path);
        }
        return {name: name, link: dom_links};
    };
    var fl_onlink_gui = function (path) {
        if (var_cache.fl_list_gui[path] === undefined) {
            var_cache.fl_list.forEach(function (item, n) {
                if (var_cache.fl_list_gui_display[n].mod_name === true) {
                    var gui = fl_create_gui_link(item[0], n);
                    var_cache.fl_list_dom[n].children('td.name').children('div').children('span').text(gui.name).prepend(gui.link);
                    var_cache.fl_list_gui_display[n].mod_name = false;
                }
            });
            dom_cache.body.children('style.fl_filter').remove();
            return;
        }
        for (var i = 0, len = var_cache.fl_list_dom.length; i < len; i++) {
            if (var_cache.fl_list_gui_display[i].show === true && var_cache.fl_list_gui[path].items.indexOf(i) === -1) {
                var_cache.fl_list_dom[i].removeClass('show');
                var_cache.fl_list_gui_display[i].show = false;
            }
        }
        var level = var_cache.fl_list_gui[path].level;
        var_cache.fl_list_gui[path].items.forEach(function (n) {
            var item = var_cache.fl_list[n];
            var gui = fl_create_gui_link(item[0], n, level);
            if (var_cache.fl_list_gui_display[n].show === false) {
                var_cache.fl_list_dom[n].addClass('show').children('td.name').children('div').children('span').text(gui.name).prepend(gui.link);
                var_cache.fl_list_gui_display[n].show = true;
            } else {
                var_cache.fl_list_dom[n].children('td.name').children('div').children('span').text(gui.name).prepend(gui.link);
            }
            var_cache.fl_list_gui_display[n].mod_name = true;
        });
        dom_cache.body.children('style.fl_filter').remove();
        $('<style>', {class: 'fl_filter', text: '.fl-table-body tbody > tr{display: none;}.fl-table-body tbody > tr.show{display:table-row;}'}).appendTo(dom_cache.body);
    };
    var fl_create_switch = function (key, v, n) {
        if (key === 'select') {
            return $('<td>', {'class': 'select'}).append($('<input>', {type: 'checkbox'}));
        } else if (key === 'name') {
            var gui = fl_create_gui_link(v[0], n, -1);
            return $('<td>', {'class': 'name', title: gui.name}).data('value', v[0]).append($('<div>').append($('<span>').text(gui.name).prepend(gui.link)));
        } else if (key === 'size') {
            return $('<td>', {'class': 'size'}).data('value', v[1]).append($('<div>', {text: bytesToSize(v[1], '0')}));
        } else if (key === 'download') {
            return $('<td>', {'class': 'download'}).data('value', v[2]).append($('<div>', {text: bytesToSize(v[2], '0')}));
        } else if (key === 'progress') {
            var progress = Math.round((v[2] * 100 / v[1]) * 10) / 10;
            var color = (v[1] === v[2] && v[3] !== 0) ? '#41B541' : '#3687ED';
            return $('<td>', {'class': 'progress'}).data('value', progress).append($('<div>', {'class': 'progress_b'}).append($('<div>', {'class': 'val', text: progress + '%'}), $('<div>', {'class': 'progress_b_i', style: 'width: ' + Math.round(progress) + '%; background-color: ' + color + ';'})));
        } else if (key === 'priority') {
            var priority = _lang_arr[87][v[3]];
            return $('<td>', {'class': 'priority', title: priority}).data('value', v[3]).append($('<div>', {text: priority}));
        }
        return '';
    };
    var fl_item_create = function (v, n) {
        var item = $('<tr>').data('index', n);
        $.each(var_cache.fl_colums, function (key, value) {
            if (value.a === 1) {
                item.append(fl_create_switch(key, v, n));
            }
        });
        var_cache.fl_list_dom[n] = item;
        dom_cache.fl_body.append(item);
    };
    var fl_indexToChanges = function (n, cl) {
        if (n === 0) {
            cl.name = (var_cache.fl_colums.name.a === 1) ? 1 : undefined;
        } else if (n === 1) {
            cl.size = (var_cache.fl_colums.size.a === 1) ? 1 : undefined;
        } else if (n === 2) {
            cl.download = (var_cache.fl_colums.download.a === 1) ? 1 : undefined;
            cl.progress = (var_cache.fl_colums.progress.a === 1) ? 1 : undefined;
        } else if (n === 3) {
            cl.priority = (var_cache.fl_colums.priority.a === 1) ? 1 : undefined;
        }
    };
    var fl_item_update = function (v, cl, n) {
        var item = var_cache.fl_list_dom[n];
        if (cl.name !== undefined) {
            var cell = item.children('td.name');
            var gui = fl_create_gui_link(v[0], n);
            cell.data('value', gui.name).children('div').children('span').html(gui.link, gui.name);
        }
        if (cl.size !== undefined) {
            var cell = item.children('td.size');
            cell.data('value', v[1]).children('div').text(bytesToSize(v[1], '0'));
        }
        if (cl.download !== undefined) {
            var cell = item.children('td.download');
            cell.data('value', v[2]).children('div').text(bytesToSize(v[2], '0'));
        }
        if (cl.progress !== undefined) {
            var cell = item.children('td.progress');
            var progress = Math.round((v[2] * 100 / v[1]) * 10) / 10;
            var color = (v[1] === v[2] && v[3] !== 0) ? '#41B541' : '#3687ED';
            cell.data('value', progress).children('div.progress_b').children('div.progress_b_i').css({width: Math.round(progress) + '%', 'background-color': color}).parent().children('div.val').text(progress + '%');
        }
        if (cl.priority !== undefined) {
            var cell = item.children('td.priority');
            var priority = _lang_arr[87][v[3]];
            cell.data('value', v[3]).attr("title", priority).children('div').text(priority);
        }
    };
    var fl_list = function (list) {
        if (var_cache.fl_show === false) {
            return;
        }
        var id = list[0];
        list = list[1];
        if (var_cache.fl_id !== id) {
            fl_close();
            return;
        }
        var list_len = list.length;
        if (var_cache.fl_list.length !== list_len) {
            var_cache.fl_list = new Array(list_len);
            var_cache.fl_list_gui_display = new Array(list_len);
        }
        for (var i = 0, item; item = list[i]; i++) {
            var file_item = var_cache.fl_list[i];
            if (file_item === undefined) {
                var_cache.fl_list[i] = item;
                fl_item_create(item, i);
            } else {
                var change_list = {};
                var chenge_count = 0;
                file_item.forEach(function (param, n) {
                    if (param !== item[n]) {
                        fl_indexToChanges(n, change_list);
                        chenge_count++;
                    }
                });
                if (chenge_count === 0) {
                    continue;
                }
                fl_item_update(item, change_list, i);
                var_cache.fl_list[i] = item;
            }
        }
        if (var_cache.fl_loading === true) {
            var_cache.fl_loading_dom.remove();
            var_cache.fl_loading = false;
        }
    };
    return {
        start: function() {
            _engine.setWindow(window);
            dom_cache = {
                body: $('body'),
                menu: $('ul.menu'),
                dl_speed: $('.status-panel td.speed.download'),
                up_speed: $('.status-panel td.speed.upload'),
                status: $('.status-panel td.status'),
                label_select: $('ul.menu li.select select'),
                tr_layer: $('.torrent-list-layer'),
                tr_table_main: $('.torrent-table-body'),
                tr_table_fixed: $('.torrent-table-head'),
                tr_body: $('.torrent-table-body').children('tbody'),
                tr_head: $('.torrent-table-body').children('thead'),
                tr_fixed_head: $('.torrent-table-head').children('thead'),
                fl: $(".file-list"),
                fl_layer: $(".file-list").children('.fl-layer'),
                fl_table_main: $('.fl-table-body'),
                fl_table_fixed: $('.fl-table-head'),
                fl_body: $('.fl-table-body').children('tbody'),
                fl_head: $('.fl-table-body').children('thead'),
                fl_fixed_head: $('.fl-table-head').children('thead'),
                fl_bottom: $('.file-list ul.bottom-menu')
            };
            writeLanguage();
            if (_settings.auto_order) {
                options.auto_order = true;
                options.moveble_enabled_tr = false;
            }
            if (options.auto_order) {
                options.tr_auto_order_cell = true;
                options.tr_auto_order = true;
                options.fl_auto_order_cell = true;
                options.fl_auto_order = true;
            }
            if (options.tr_word_wrap) {
                dom_cache.body.append($('<style>', {text: 'div.torrent-list-layer td div {white-space: normal;word-wrap: break-word;}'}));
            }
            if (options.fl_word_wrap) {
                dom_cache.body.append($('<style>', {text: 'div.fl-layer td div {white-space: normal;word-wrap: break-word;}'}));
            }
            dom_cache.body.append($('<style>', {text: '.torrent-list-layer{max-height: '+(_settings.window_height - 54)+'px; min-height: '+(_settings.window_height - 54)+'px}'}));
            var_cache.tr_colums = _engine.getColums();
            var_cache.fl_colums = _engine.getFlColums();
            write_tr_head();
            write_fl_head();
            //need add order
            dom_cache.label_select.selectBox();
            dom_cache.label_select.on('change', function (e, data) {
                tr_changeFilter(this.value, data);
            });
            setLabels(_engine.cache.labels || []);
            setStatus(_engine.cache.status);
            tr_list(_engine.cache.torrents || []);
            getTorrentList();

            dom_cache.tr_body.on('dblclick', 'tr', function () {
                var id = $(this).attr('id');
                fl_show(id);
            });

            dom_cache.fl_body.on('click', 'a.folder', function (e) {
                e.preventDefault();
                fl_onlink_gui($(this).data('path'));
            });
        },
        setLabel: function (a) {
            //console.log(a);
        },
        setFileList: fl_list,
        setSpeedLimit: function (a) {
            //
        },
        setLabels: function (a) {
            //
        },
        updateList: tr_list, //a, b
        deleteItem: function (rm_list) {
            for (var i = 0, id; id = rm_list[i]; i++) {
                tr_item_delete(id);
            }
        },
        setStatus: setStatus
    };
}();
$(function(){
    manager.start();
});