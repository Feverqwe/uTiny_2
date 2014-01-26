var manager = function () {
    var _engine = (chrome.extension.getBackgroundPage()).engine;
    var settings = {};
    var tables = {};
    tmp_vars = {
        sel_label: (localStorage.selected_label !== undefined) ? JSON.parse(localStorage.selected_label) : {k: 'all', v: null},
        new_tr_count: 0,
        label: [],
        torrent_context_menu: null,
        torrent_context_menu_labels: null,
        speed_limit: {},
        moveble_enabled_tr: true,
        moveble_enabled_fl: false,
        auto_order: false,
        tr_auto_order_cell: false,
        tr_auto_order: false,
        fl_auto_order_cell: false,
        fl_auto_order: false,
        filelist_param: {},
        fl_file_selected: null,
        fl_select_array: [],
        fl_prio_param: {},
        lp_path: null,
        tr_word_wrap: false,
        fl_word_wrap: true,
        fl_width: 0,
        fl_height: 0,
        body_width: 0,
        status_cache: null
    };
    var chk_settings = function () {
        if (settings.login === undefined || settings.password === undefined) {
            return 0;
        }
        tmp_vars.lp_path = lp_path();
        return 1;
    };
    var lp_path = function () {
        return ((settings.ssl) ? 'https' : 'http') + "://" +
            settings.login + ":" + settings.password + "@" +
            settings.ut_ip + ":" + settings.ut_port + "/";
    };
    var write_language = function () {
        tables.menu.find('a.refresh').attr('title', lang_arr[24]);
        tables.menu.find('a.wui').attr('title', lang_arr[26]).attr('href', tmp_vars.lp_path + settings.ut_path);
        tables.menu.find('a.add_file').attr('title', lang_arr[118]);
        tables.menu.find('a.add_magnet').attr('title', lang_arr[120]);
        tables.menu.find('a.start_all').attr('title', lang_arr[68]);
        tables.menu.find('a.pause_all').attr('title', lang_arr[67]);
        tables['fl-bottom'].find('a.update').attr('title', lang_arr[91][1]);
        tables['fl-bottom'].find('a.close').attr('title', lang_arr[91][2]);
    };
    var torrent_list_head = function () {
        var colums = tmp_vars.colums;
        var style = '<style class="torrent-style">';
        var thead = $('<tr>');
        var sum_width = 0;
        $.each(colums, function (key, value) {
            if (value.a === 1) {
                thead.append($('<th>', {'class': (key + ((value.order) ? ' s' : '')), title: lang_arr[value.lang][1]}).append($('<div>', {text: lang_arr[value.lang][0]})));
                style += '.torrent-list-layer th.' + key + ', .torrent-list-layer td.' + key + ' {max-width:' + value.size + 'px; min-width:' + value.size + 'px}';
                sum_width += value.size;
            }
        });
        style += '</style>';
        tables['tr-head'].empty().append(thead);
        tables['tr-fixed_head'].empty().append(thead.clone());
        tables.body.children('style.torrent-style').remove();
        tables.body.append(style);
        if (sum_width + 61 < 800) {
            tmp_vars.body_width = sum_width + 61;
            tables.body.css('width', (tmp_vars.body_width) + 'px');
        } else {
            tmp_vars.body_width = 800;
            tables.body.css('width', '800px');
        }
        tmp_vars.body_width = tables.body.width();
    };
    var file_list_head = function () {
        var colums = tmp_vars.fl_colums;
        var style = '<style class="filelist-style">';
        var thead = $('<tr>');
        var sum_width = 0;
        $.each(colums, function (key, value) {
            if (value.a === 1) {
                if (key === 'select') {
                    thead.append($('<th>', {'class': (key + ((value.order) ? ' s' : '')), title: lang_arr[value.lang][1]}).append($('<div>').append($('<input>', {type: 'checkbox'}))));
                } else {
                    thead.append($('<th>', {'class': (key + ((value.order) ? ' s' : '')), title: lang_arr[value.lang][1]}).append($('<div>', {text: lang_arr[value.lang][0]})));
                }
                style += '.fl-layer th.' + key + ', .fl-layer td.' + key + ' {max-width:' + value.size + 'px; min-width:' + value.size + 'px}';
                sum_width += value.size;
            }
        });
        tmp_vars.fl_width = sum_width + 50;
        var fl_h = tables.window.height() - 34 - 19;
        var fl_l_h = tables.window.height() - 34 - 19 - 34;
        var width_limit = '';
        if (tmp_vars.fl_width > tmp_vars.body_width) {
            tmp_vars.fl_width = tmp_vars.body_width;
            width_limit = 'div.file-list {max-width:' + tmp_vars.body_width + 'px; border-radius: 0;}';
        }
        tmp_vars.fl_height = fl_l_h;
        style += 'div.file-list {' +
            'left: ' + ((tmp_vars.body_width - tmp_vars.fl_width) / 2) + "px; " +
            'height: ' + fl_h + 'px; ' +
            'width: ' + tmp_vars.fl_width + 'px;' +
            '}';
        style += 'div.fl-layer {' +
            'max-height: ' + fl_l_h + 'px;' +
            'min-height: ' + fl_l_h + 'px; }';
        style += width_limit + '</style>';
        tables['fl-head'].empty().append(thead);
        tables['fl-fixed_head'].empty().append(thead.clone());
        tables.body.children('style.filelist-style').remove();
        tables.body.append(style);
    };
    var update_tr_order = function (s) {
        var th = tables['tr-fixed_head'].find('th');
        th.removeClass('headerSortDown headerSortUp');
        for (var n = 0; n < s.length; n++) {
            if (s[n][0] > th.length - 1)
                continue;
            if (s[n][1]) {
                th.eq(s[n][0]).addClass('headerSortUp');
            } else {
                th.eq(s[n][0]).addClass('headerSortDown');
            }
        }
        return s;
    };
    var update_fl_order = function (s) {
        var th = tables['fl-fixed_head'].find('th');
        th.removeClass('headerSortDown headerSortUp');
        for (var n = 0; n < s.length; n++) {
            if (s[n][0] > th.length - 1)
                continue;
            if (s[n][1]) {
                th.eq(s[n][0]).addClass('headerSortUp');
            } else {
                th.eq(s[n][0]).addClass('headerSortDown');
            }
        }
        return s;
    };
    var torrent_list_order = function () {
        tables['table-main'].tablesorter({
            textExtraction: function (node) {
                if ($(node).attr('data-value') !== undefined)
                    return $(node).attr('data-value');
                return $(node).html();
            },
            sortList: update_tr_order((localStorage.tr_order !== undefined) ? JSON.parse(localStorage.tr_order) : [
                [0, 0]
            ]),
            onsort: function (s) {
                update_tr_order(s);
                localStorage.tr_order = JSON.stringify(s);
            },
            selectorHeaders: '.torrent-table-head thead th',
            selectorSort: 'th.s'
        });
    };
    var file_list_order = function () {
        tables['fl-table-main'].tablesorter({
            textExtraction: function (node) {
                if ($(node).attr('data-value') !== undefined)
                    return $(node).attr('data-value');
                return $(node).html();
            },
            sortList: update_fl_order((localStorage.fl_order !== undefined) ? JSON.parse(localStorage.fl_order) : [
                [1, 0]
            ]),
            onsort: function (s) {
                update_fl_order(s);
                localStorage.fl_order = JSON.stringify(s);
            },
            selectorHeaders: '.fl-table-head thead th',
            selectorSort: 'th.s'
        });
    };
    var timer = function () {
        var status = 0;
        var timer;
        var start = function () {
            if (status === 1) {
                return 0;
            }
            status = 1;
            clearInterval(timer);
            timer = setInterval(function () {
                get_torrent_list();
            }, settings.mgr_update_interval);
        };
        var stop = function () {
            if (status === 0) {
                return;
            }
            clearInterval(timer);
            status = 0;
        };
        return {
            start: start,
            stop: stop,
            status: function () {
                return status;
            }
        };
    }();
    var get_torrent_list = function () {
        timer.stop();
        _engine.sendAction($.extend({list: 1}, tmp_vars.filelist_param));
    };
    /*
     ,arr[i][0] /* ХЭШ
     ,arr[i][1] /* STATUS CODE
     ,arr[i][2] /* ИМЯ
     ,arr[i][3] /* РАЗМЕР
     ,arr[i][4] /* ПРОЦЕНТ ВЫПОЛНЕНИЯ
     ,arr[i][5]/*  загружено
     ,arr[i][6]/*  РОЗДАНО
     ,arr[i][7]/*  КОЭФФИЦИЕНТ
     ,arr[i][8] /* СКОРОСТЬ РАЗДАЧИ
     ,arr[i][9] /* СКОРОСТЬ ЗАГРУЗКИ
     ,arr[i][10] /*ETA
     ,arr[i][11] /*МЕТКА 
     ,arr[i][12] /*ПОДКЛЮЧЕНО ПИРОВ
     ,arr[i][13] /*ПИРЫ В РОЕ
     ,arr[i][14] /*ПОДКЛЮЧЕНО СИДОВ
     ,arr[i][15] /*СИДЫ В РОЕ 
     ,arr[i][16]/* ДОСТУПНОСТЬ
     ,arr[i][17] /*ПОРЯДОК ОЧЕРЕДИ ТОРРЕНТОВ 
     ,arr[i][18]/* отдано
     ,arr[i][19]/* ?
     ,arr[i][20]/* ? 
     ,arr[i][21] /*статус тескстом
     ,arr[i][23]/* время старта
     ,arr[i][24]/* время завершения
     ,arr[i][22]/* sid
     ,arr[i][26]/* path_to_file
     */
    var write_torrent_list = function (arr, update) {
        var c = arr.length;
        var sum_dl = 0;
        var sum_up = 0;
        tmp_vars.new_tr_count = 0;
        if (!update) {
            tr_table_controller.clear();
        }
        for (var n = 0; n < c; n++) {
            var v = arr[n];
            sum_dl += v[9];
            sum_up += v[8];
            tr_table_controller.add(v);
        }
        if (tmp_vars.new_tr_count) {
            tables['table-main'].trigger('update');
            if (tmp_vars.moveble_enabled_tr) {
                calculate_moveble(tables['table-main'].find('td.name > div > span'), tmp_vars.colums.name.size);
            }
            tmp_vars.new_tr_count = 0;
        }
        tr_table_controller.filter();
        tables['dl-speed'].text(bytesToSize(sum_dl, '-', 1));
        tables['up-speed'].text(bytesToSize(sum_up, '-', 1));
        if (settings.graph)
            graph.move(sum_dl, sum_up, 0);
        timer.start();
    };
    var table_update_switch = function (ch, v) {
        var item = $('#' + v[0]);
        if (ch.data_sid !== undefined) {
            item.attr('data-sid', v[22]);
        }
        if (ch.data_path !== undefined) {
            item.attr('data-path', v[26]);
        }
        if (ch.data_label !== undefined) {
            item.attr('data-label', v[11]);
        }
        if (ch.name !== undefined) {
            var cell = item.children('td.name');
            cell.children('div').attr('title', v[2]).children('span').text(v[2]);
            if (tmp_vars.tr_auto_order_cell) {
                tables['table-main'].trigger('updateCell', [cell[0], tmp_vars.tr_auto_order]);
            }
            if (tmp_vars.moveble_enabled_tr) {
                calculate_moveble(tables['table-main'].find('td.name > div > span'), tmp_vars.colums.name.size);
            }
        }
        if (ch.size !== undefined) {
            var t_s = bytesToSize(v[3]);
            var cell = item.children('td.size');
            cell.attr('data-value', v[3]).children('div').attr('title', t_s).text(t_s);
            if (tmp_vars.tr_auto_order_cell) {
                tables['table-main'].trigger('updateCell', [cell[0], tmp_vars.tr_auto_order]);
            }
        }
        if (ch.progress !== undefined) {
            var progress = v[4] / 10;
            var cell = item.children('td.progress');
            var with_c = cell.attr('data-value', v[4]).children('div.progress_b').children('div.progress_b_i');
            if (tmp_vars.tr_auto_order_cell) {
                tables['table-main'].trigger('updateCell', [cell[0], tmp_vars.tr_auto_order]);
            }
            with_c.css('width', Math.round(progress) + '%').parent().children('div.val').text(progress + '%');
            if (v[1] === 201 && v[4] === 1000) {
                with_c.css('background-color', '#41B541');
            } else {
                with_c.css('background-color', '#3687ED');
            }
        }
        if (ch.status !== undefined) {
            var cell = item.children('td.status');
            cell.attr('data-value', v[1]).children('div').attr('title', v[21]).text(v[21]);
            if (tmp_vars.tr_auto_order_cell) {
                tables['table-main'].trigger('updateCell', [cell[0], tmp_vars.tr_auto_order]);
            }
        }
        if (ch.down_speed !== undefined) {
            var cell = item.children('td.down_speed');
            cell.attr('data-value', v[9]).children('div').text(bytesToSize(v[9], '', 1));
            if (tmp_vars.tr_auto_order_cell) {
                tables['table-main'].trigger('updateCell', [cell[0], tmp_vars.tr_auto_order]);
            }
        }
        if (ch.uplo_speed !== undefined) {
            var cell = item.children('td.uplo_speed');
            cell.attr('data-value', v[8]).children('div').text(bytesToSize(v[8], '', 1));
            if (tmp_vars.tr_auto_order_cell) {
                tables['table-main'].trigger('updateCell', [cell[0], tmp_vars.tr_auto_order]);
            }
        }
        if (ch.seeds_peers !== undefined) {
            var cell = item.children('td.seeds_peers');
            cell.children('div').text(v[14] + '/' + v[12]);
            if (tmp_vars.tr_auto_order_cell) {
                tables['table-main'].trigger('updateCell', [cell[0], tmp_vars.tr_auto_order]);
            }
        }
        if (ch.position !== undefined) {
            var val = v[17];
            if (val < 0)
                val = '*';
            var cell = item.children('td.position');
            cell.children('div').text(val);
            if (tmp_vars.tr_auto_order_cell) {
                tables['table-main'].trigger('updateCell', [cell[0], tmp_vars.tr_auto_order]);
            }
        }
        if (ch.ostalos !== undefined) {
            var val = v[3] - v[5];
            if (val < 0)
                val = 0;
            var cell = item.children('td.ostalos');
            cell.attr('data-value', val).children('div').text(bytesToSize(val, 0));
            if (tmp_vars.tr_auto_order_cell) {
                tables['table-main'].trigger('updateCell', [cell[0], tmp_vars.tr_auto_order]);
            }
        }
        if (ch.seeds !== undefined) {
            var cell = item.children('td.seeds');
            cell.children('div').text(v[15]);
            if (tmp_vars.tr_auto_order_cell) {
                tables['table-main'].trigger('updateCell', [cell[0], tmp_vars.tr_auto_order]);
            }
        }
        if (ch.peers !== undefined) {
            var cell = item.children('td.peers');
            cell.children('div').text(v[13]);
            if (tmp_vars.tr_auto_order_cell) {
                tables['table-main'].trigger('updateCell', [cell[0], tmp_vars.tr_auto_order]);
            }
        }
        if (ch.time !== undefined) {
            var s_time = unixintime(v[10]);
            var cell = item.children('td.time');
            cell.attr('data-value', v[10]).children('div').attr('title', s_time).text(s_time);
            if (tmp_vars.tr_auto_order_cell) {
                tables['table-main'].trigger('updateCell', [cell[0], tmp_vars.tr_auto_order]);
            }
        }
        if (ch.otdano !== undefined) {
            var cell = item.children('td.otdano');
            cell.attr('data-value', v[6]).children('div').text(bytesToSize(v[6], 0));
            if (tmp_vars.tr_auto_order_cell) {
                tables['table-main'].trigger('updateCell', [cell[0], tmp_vars.tr_auto_order]);
            }
        }
        if (ch.poluchino !== undefined) {
            var cell = item.children('td.poluchino');
            cell.attr('data-value', v[5]).children('div').text(bytesToSize(v[5], 0));
            if (tmp_vars.tr_auto_order_cell) {
                tables['table-main'].trigger('updateCell', [cell[0], tmp_vars.tr_auto_order]);
            }
        }
        if (ch.koeficient !== undefined) {
            var val = v[7] / 1000;
            var cell = item.children('td.koeficient');
            cell.attr('data-value', v[7]).children('div').text(val);
            if (tmp_vars.tr_auto_order_cell) {
                tables['table-main'].trigger('updateCell', [cell[0], tmp_vars.tr_auto_order]);
            }
        }
        if (ch.dostupno !== undefined) {
            var val = Math.round((v[16] / 65535) * 1000) / 1000;
            var cell = item.children('td.dostupno');
            cell.attr('data-value', v[16]).children('div').text(val);
            if (tmp_vars.tr_auto_order_cell) {
                tables['table-main'].trigger('updateCell', [cell[0], tmp_vars.tr_auto_order]);
            }
        }
        if (ch.metka !== undefined) {
            var cell = item.children('td.metka');
            cell.children('div').attr('title', v[11]).text(v[11]);
            if (tmp_vars.tr_auto_order_cell) {
                tables['table-main'].trigger('updateCell', [cell[0], tmp_vars.tr_auto_order]);
            }
        }
        if (ch.time_dobavleno !== undefined) {
            var str_time = writeTimeFromShtamp(v[23]);
            var cell = item.children('td.time_dobavleno');
            cell.children('div').attr('title', str_time).text(str_time);
            if (tmp_vars.tr_auto_order_cell) {
                tables['table-main'].trigger('updateCell', [cell[0], tmp_vars.tr_auto_order]);
            }
        }
        if (ch.time_zavircheno === undefined) {
            var str_time = writeTimeFromShtamp(v[24]);
            var cell = item.children('td.time_zavircheno');
            cell.children('div').attr('title', str_time).text(str_time);
            if (tmp_vars.tr_auto_order_cell) {
                tables['table-main'].trigger('updateCell', [cell[0], tmp_vars.tr_auto_order]);
            }
        }
    };
    var table_create_switch = function (key, v) {
        if (key === 'name') {
            return $('<td>', {'class': key}).append($('<div>', {title: v[2]}).append($('<span>', {text: v[2]})));
        } else if (key === 'size') {
            return $('<td>', {'class': key, 'data-value': v[3]}).append($('<div>', {title: bytesToSize(v[3]), text: bytesToSize(v[3])}));
        } else if (key === 'progress') {
            var progress = v[4] / 10;
            var color = (v[1] === 201 && v[4] === 1000) ? '#41B541' : '#3687ED';
            return $('<td>', {'class': key, 'data-value': v[4]}).append($('<div>', {'class': 'progress_b'}).append($('<div>', {'class': 'val', text: progress + '%'}), $('<div>', {'class': 'progress_b_i', style: 'width: ' + Math.round(progress) + '%; background-color: ' + color + ';'})));
        } else if (key === 'status') {
            return $('<td>', {'class': key, 'data-value': v[1]}).append($('<div>', {title: v[21], text: v[21]}));
        } else if (key === 'down_speed') {
            return $('<td>', {'class': key, 'data-value': v[9]}).append($('<div>', {text: bytesToSize(v[9], '', 1)}));
        } else if (key === 'uplo_speed') {
            return $('<td>', {'class': key, 'data-value': v[8]}).append($('<div>', {text: bytesToSize(v[8], '', 1)}));
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
            return $('<td>', {'class': key, 'data-value': val}).append($('<div>', {text: bytesToSize(val, 0)}));
        } else if (key === 'seeds') {
            return $('<td>', {'class': key}).append($('<div>', {text: v[15]}));
        } else if (key === 'peers') {
            return $('<td>', {'class': key}).append($('<div>', {text: v[13]}));
        } else if (key === 'time') {
            var s_time = unixintime(v[10]);
            return $('<td>', {'class': key, 'data-value': v[10]}).append($('<div>', {text: s_time, title: s_time}));
        } else if (key === 'otdano') {
            return $('<td>', {'class': key, 'data-value': v[6]}).append($('<div>', {text: bytesToSize(v[6], 0)}));
        } else if (key === 'poluchino') {
            return $('<td>', {'class': key, 'data-value': v[5]}).append($('<div>', {text: bytesToSize(v[5], 0)}));
        } else if (key === 'koeficient') {
            var val = v[7] / 1000;
            return $('<td>', {'class': key, 'data-value': v[7]}).append($('<div>', {text: val}));
        } else if (key === 'dostupno') {
            var val = Math.round((v[16] / 65535) * 1000) / 1000;
            return $('<td>', {'class': key, 'data-value': v[16]}).append($('<div>', {text: val}));
        } else if (key === 'metka') {
            return $('<td>', {'class': key}).append($('<div>', {title: v[11], text: v[11]}));
        } else if (key === 'time_dobavleno') {
            var str_time = writeTimeFromShtamp(v[23]);
            return $('<td>', {'class': key, 'data-value': v[23]}).append($('<div>', {text: str_time, title: str_time}));
        } else if (key === 'time_zavircheno') {
            var str_time = writeTimeFromShtamp(v[24]);
            return $('<td>', {'class': key, 'data-value': v[24]}).append($('<div>', {text: str_time, title: str_time}));
        } else if (key === 'controls') {
            return $('<td>', {'class': key}).append($('<div>', {'class': 'btns'}).append($('<a>', {href: '#start', title: lang_arr[0], 'class': 'start'}), $('<a>', {href: '#pause', title: lang_arr[1], 'class': 'pause'}), $('<a>', {href: '#stop', title: lang_arr[2], 'class': 'stop'})));
        }
        return '';
    };
    var create_item = function (v) {
        var colums = tmp_vars.colums;
        var item = $('<tr>', {id: v[0], 'data-label': v[11], 'data-sid': v[22], 'data-path': v[26]});
        $.each(colums, function (key, value) {
            if (value.a === 1) {
                item.append(table_create_switch(key, v));
            }
        });
        tables['tr-body'].prepend(item);
    };
    var fl_table_controller = function () {
        var filelist_itemIndexToChanges = function (n, change_list) {
            if (n === 1) {
                change_list.size = (tmp_vars.fl_colums.size.a === 1) ? 1 : undefined;
            } else if (n === 2) {
                change_list.download = (tmp_vars.fl_colums.download.a === 1) ? 1 : undefined;
                change_list.progress = (tmp_vars.fl_colums.progress.a === 1) ? 1 : undefined;
            } else if (n === 3) {
                change_list.priority = (tmp_vars.fl_colums.priority.a === 1) ? 1 : undefined;
            }
        };
        var cached = {};
        var folders = {};
        var clear = function () {
            tables['fl-body'].empty();
            var sel_all = tables['fl-fixed_head'].find('input').eq(0)[0];
            if (sel_all !== undefined) {
                sel_all.checked = false;
            }
            cached = {};
            folders = {};
        };
        var short_name = function (arr, level) {
            if (arr === undefined) {
                $.each(cached, function (k) {
                    if (cached[k].gui.mod_name) {
                        var name = get_folder_link(k, (cached[k].gui.path_arr.length > 1) ? cached[k].gui.path_arr.slice(0, -1) : []) + cached[k].gui.name;
                        $('#' + k).children('td.name').children('div').children('span').html(name);
                        cached[k].gui.mod_name = 0;
                    }
                });
                return;
            }
            $.each(arr, function (k) {
                var name = get_folder_link(k, (cached[k].gui.path_arr.length > 1) ? cached[k].gui.path_arr.slice(0, -1) : [], level) + cached[k].gui.name;
                cached[k].gui.mod_name = 1;
                $('#' + k).children('td.name').children('div').children('span').html(name);
            });
        };
        var show_folder = function (path) {
            if (path === '/') {
                short_name();
                show_all();
                return;
            }
            if (folders[path] === undefined)
                return;
            short_name(folders[path], path.split('/').length);
            hide_all(folders[path]);
        };
        var get_folder_link = function (id, path, level) {
            if (!level) {
                level = 0;
            }
            if (path.length === 0) {
                return '';
            }
            if (cached[id].gui.name_level[level] !== undefined) {
                return cached[id].gui.name_level[level];
            }
            var link = '';
            for (var n = path.length; n >= level; n--) {
                if (n === level) {
                    var fn = path.slice(0, n - 1).join('/');
                    if (fn.length === 0) {
                        fn = '/';
                    }
                    if (n !== 0)
                        link = '<a class="folder c' + n + '" href="#&larr;" data-value="' + fn + '">&larr;</a>' + link;
                    continue;
                }
                var fn = path.slice(0, n);
                var dir_name = fn.slice(-1)[0];
                fn = fn.join('/');
                if (folders[fn] === undefined) {
                    folders[fn] = {};
                }
                if (folders[fn][id] === undefined) {
                    folders[fn][id] = null;
                }
                link = '<a class="folder c' + n + '" href="#' + fn + '" data-value="' + fn + '">' + dir_name + '</a>' + link;
            }
            cached[id].gui.name_level[level] = link;
            return link;
        };
        var add = function (_id, v) {
            var id = 'file_id_' + _id;
            if (cached[id] !== undefined) {
                var tr = cached[id].api;
                var c = v.length;
                var change_list = {};
                var chenge_count = 0;
                for (var n = 0; n < c; n++) {
                    if (tr[n] !== v[n]) {
                        filelist_itemIndexToChanges(n, change_list);
                        chenge_count++;
                    }
                }
                if (chenge_count === 0) {
                    return;
                }
                cached[id].api = v;
                filelist_update_switch(id, v, change_list);
            } else {
                cached[id] = {
                    api: null,
                    gui: null
                };
                var fl_path_arr = v[0].split('/');
                if (fl_path_arr[0].length === 0) {
                    fl_path_arr = fl_path_arr.slice(1);
                }
                var fl_name = (fl_path_arr.length) ? fl_path_arr.slice(-1)[0] : v[0];
                cached[id].api = v;
                cached[id].gui = {
                    name: fl_name,
                    path_arr: fl_path_arr,
                    link_path: '',
                    display: 1,
                    mod_name: 0,
                    name_level: []
                };
                cached[id].gui.link_path = get_folder_link(id, (fl_path_arr.length > 1) ? fl_path_arr.slice(0, -1) : []) + fl_name;
                filelist_create_item(id, cached[id]);
            }
        };
        var get = function (id) {
            if (cached[id] !== undefined)
                return cached[id];
            else
                return null;
        };
        var hide_all = function (ex) {
            $.each(cached, function (id) {
                if (ex && ex[id] !== undefined) {
                    if (cached[id].gui.display === 0)
                        show(id);
                    return true;
                }
                if (cached[id].gui.display === 1)
                    hide(id);
            });
        };
        var show_all = function (ex) {
            $.each(cached, function (id) {
                if (ex && ex[id] !== undefined) {
                    if (cached[id].gui.display === 1)
                        hide(id);
                    return true;
                }
                if (cached[id].gui.display === 0)
                    show(id);
            });
        };
        var hide = function (id) {
            if (cached[id].gui.display) {
                cached[id].gui.display = 0;
                $('#' + id).css('display', 'none');
            }
        };
        var show = function (id) {
            if (!cached[id].gui.display) {
                cached[id].gui.display = 1;
                $('#' + id).css('display', 'table-row');
            }
        };
        return {
            add: function (a, b) {
                add(a, b);
            },
            get: function (t) {
                return get(t);
            },
            clear: function () {
                clear();
            },
            show_folder: function (a) {
                show_folder(a);
            }
        };
    }();
    var filelist_create_switch = function (key, v) {
        if (key === 'select') {
            return $('<td>', {'class': 'select'}).append($('<input>', {type: 'checkbox'}));
        } else if (key === 'name') {
            return $('<td>', {'class': 'name', 'data-value': v.api[0], title: v.gui.name}).append($('<div>').append($('<span>').html(v.gui.link_path)));
        } else if (key === 'size') {
            return $('<td>', {'class': 'size', 'data-value': v.api[1]}).append($('<div>', {text: bytesToSize(v.api[1], '0')}));
        } else if (key === 'download') {
            return $('<td>', {'class': 'download', 'data-value': v.api[2]}).append($('<div>', {text: bytesToSize(v.api[2], '0')}));
        } else if (key === 'progress') {
            var progress = Math.round((v.api[2] * 100 / v.api[1]) * 10) / 10;
            var color = (v.api[1] === v.api[2] && v.api[3] !== 0) ? '#41B541' : '#3687ED';
            return $('<td>', {'class': 'progress', 'data-value': progress}).append($('<div>', {'class': 'progress_b'}).append($('<div>', {'class': 'val', text: progress + '%'}), $('<div>', {'class': 'progress_b_i', style: 'width: ' + Math.round(progress) + '%; background-color: ' + color + ';'})));
        } else if (key === 'priority') {
            var priority = lang_arr[87][v.api[3]];
            return $('<td>', {'class': 'priority', 'data-value': v.api[3], title: priority}).append($('<div>', {text: priority}));
        }
        return '';
    }
    var filelist_create_item = function (id, v) {
        /*
         * name = 0
         * size = 1
         * dwnload = 2
         * dune = 2
         * prio = 3
         */
        var colums = tmp_vars.fl_colums;
        var item = $('<tr>', {id: id});
        $.each(colums, function (key, value) {
            if (value.a === 1) {
                item.append(filelist_create_switch(key, v));
            }
        });
        tables['fl-body'].append(item);
    };
    var filelist_update_switch = function (id, v, ch) {
        var item = $('#' + id);
        if (ch.size !== undefined) {
            var cell = item.children('td.size');
            cell.attr('data-value', v[1]).children('div').text(bytesToSize(v[1], '0'));
            if (tmp_vars.fl_auto_order_cell) {
                tables['fl-table-main'].trigger('updateCell', [cell[0], tmp_vars.fl_auto_order]);
            }
        }
        if (ch.download !== undefined) {
            var cell = item.children('td.download');
            cell.attr('data-value', v[2]).children('div').text(bytesToSize(v[2], '0'));
            if (tmp_vars.fl_auto_order_cell) {
                tables['fl-table-main'].trigger('updateCell', [cell[0], tmp_vars.fl_auto_order]);
            }
        }
        if (ch.progress !== undefined) {
            var cell = item.children('td.progress');
            var progress = Math.round((v[2] * 100 / v[1]) * 10) / 10;
            var color = (v[1] === v[2] && v[3] !== 0) ? '#41B541' : '#3687ED';
            cell.attr('data-value', progress).children('div.progress_b').children('div.progress_b_i').css({width: Math.round(progress) + '%', 'background-color': color}).parent().children('div.val').text(progress + '%');
            if (tmp_vars.fl_auto_order_cell) {
                tables['fl-table-main'].trigger('updateCell', [cell[0], tmp_vars.fl_auto_order]);
            }
        }
        if (ch.priority !== undefined) {
            var cell = item.children('td.priority');
            var priority = lang_arr[87][v[3]];
            cell.attr('data-value', v[3]).attr("title", priority).children('div').text(priority);
            if (tmp_vars.fl_auto_order_cell) {
                tables['fl-table-main'].trigger('updateCell', [cell[0], tmp_vars.fl_auto_order]);
            }
        }
    };
    var tr_table_controller = function () {
        var table_itemIndexToChanges = function (n, change_list) {
            if (n === 1) {
                change_list.status = (tmp_vars.colums.status.a === 1) ? 1 : undefined;
                change_list.progress = (tmp_vars.colums.progress.a === 1) ? 1 : undefined;
            } else if (n === 2) {
                change_list.name = (tmp_vars.colums.name.a === 1) ? 1 : undefined;
            } else if (n === 3) {
                change_list.size = (tmp_vars.colums.size.a === 1) ? 1 : undefined;
                change_list.ostalos = (tmp_vars.colums.ostalos.a === 1) ? 1 : undefined;
            } else if (n === 4) {
                change_list.progress = (tmp_vars.colums.progress.a === 1) ? 1 : undefined;
            } else if (n === 21) {
                change_list.status = (tmp_vars.colums.status.a === 1) ? 1 : undefined;
            } else if (n === 9) {
                change_list.down_speed = (tmp_vars.colums.down_speed.a === 1) ? 1 : undefined;
                change_list.ostalos = (tmp_vars.colums.ostalos.a === 1) ? 1 : undefined;
            } else if (n === 8) {
                change_list.uplo_speed = (tmp_vars.colums.uplo_speed.a === 1) ? 1 : undefined;
            } else if (n === 12) {
                change_list.seeds_peers = (tmp_vars.colums.seeds_peers.a === 1) ? 1 : undefined;
            } else if (n === 14) {
                change_list.seeds_peers = (tmp_vars.colums.seeds_peers.a === 1) ? 1 : undefined;
            } else if (n === 17) {
                change_list.position = (tmp_vars.colums.position.a === 1) ? 1 : undefined;
            } else if (n === 15) {
                change_list.seeds = (tmp_vars.colums.seeds.a === 1) ? 1 : undefined;
            } else if (n === 13) {
                change_list.peers = (tmp_vars.colums.peers.a === 1) ? 1 : undefined;
            } else if (n === 10) {
                change_list.time = (tmp_vars.colums.time.a === 1) ? 1 : undefined;
            } else if (n === 6) {
                change_list.otdano = (tmp_vars.colums.otdano.a === 1) ? 1 : undefined;
            } else if (n === 5) {
                change_list.poluchino = (tmp_vars.colums.poluchino.a === 1) ? 1 : undefined;
            } else if (n === 7) {
                change_list.koeficient = (tmp_vars.colums.koeficient.a === 1) ? 1 : undefined;
            } else if (n === 16) {
                change_list.dostupno = (tmp_vars.colums.dostupno.a === 1) ? 1 : undefined;
            } else if (n === 11) {
                change_list.metka = (tmp_vars.colums.metka.a === 1) ? 1 : undefined;
                change_list.data_label = 1;
            } else if (n === 23) {
                change_list.time_dobavleno = (tmp_vars.colums.time_dobavleno.a === 1) ? 1 : undefined;
            } else if (n === 24) {
                change_list.time_zavircheno = (tmp_vars.colums.time_zavircheno.a === 1) ? 1 : undefined;
            } else if (n === 22) {
                change_list.data_sid = 1;
            } else if (n === 26) {
                change_list.data_path = 1;
            }
        };
        var cached = {};
        var clear = function () {
            tables['tr-body'].empty();
            cached = {};
        };
        var add = function (v) {
            var id = v[0];
            if (cached[id] !== undefined) {
                /*
                 Если в кэше уже есть запись, провреряется какие поля изменились и выписываюются нормера в отдельный массив
                 */
                var tr = cached[id].api;
                var c = v.length;
                var change_list = {};
                var chenge_count = 0;
                for (var n = 0; n < c; n++) {
                    if (tr[n] !== v[n]) {
                        table_itemIndexToChanges(n, change_list);
                        chenge_count++;
                    }
                }
                if (chenge_count === 0) {
                    return;
                }
                table_update_switch(change_list, v);
                cached[id].api = v;
            } else {
                cached[id] = {
                    api: undefined,
                    gui: {
                        display: 1
                    }
                };
                cached[id].api = v;
                create_item(v);
                tmp_vars.new_tr_count++;
            }
        };
        var filter = function (a, b) {
            if (a) {
                tmp_vars.sel_label = {k: a, v: b};
                localStorage.selected_label = JSON.stringify({k: a, v: b});
            }
            $.each(cached, function (id, val) {
                sorting_torrent_list(id, val.gui.display, val.api);
                settings_filtering(id, val.gui.display, val.api);
            });
        };
        var hide = function (id) {
            if (cached[id].gui.display) {
                cached[id].gui.display = 0;
                $('#' + id).css('display', 'none');
            }
        };
        var show = function (id) {
            if (!cached[id].gui.display) {
                cached[id].gui.display = 1;
                $('#' + id).css('display', 'table-row');
            }
        };
        var get = function (id) {
            if (cached[id] !== undefined)
                return cached[id].api;
            else
                return undefined;
        };
        var del = function (id) {
            if (cached[id] !== undefined)
                delete cached[id];
            $('#' + id).remove();
            tables['table-main'].trigger('update');
        };
        return {
            add: function (t) {
                add(t);
            },
            get: function (t) {
                return get(t);
            },
            del: function (t) {
                del(t);
            },
            show: function (t) {
                show(t);
            },
            hide: function (t) {
                hide(t);
            },
            clear: function () {
                clear();
            },
            filter: function (a, b) {
                filter(a, b);
            },
            get_table: function () {
                return cached;
            }
        };
    }();
    var settings_filtering = function (id, display, v) {
        if ((settings.hide_seeding && v[4] === 1000 && v[1] === 201) ||
            (settings.hide_finished && v[4] === 1000 && v[1] === 136)) {
            if (display)
                tr_table_controller.hide(id);
        }
    };
    var sorting_torrent_list = function (id, display, param) {
        if (isNumber(tmp_vars.sel_label.k) === false) {
            switch (tmp_vars.sel_label.k) {
                case ('all'):
                    if (!display) {
                        tr_table_controller.show(id);
                    }
                    break;
                case ('download'):
                    if (param[4] !== 1000) {
                        tr_table_controller.show(id);
                    } else if (display) {
                        tr_table_controller.hide(id);
                    }
                    break;
                case ('active'):
                    if (param[9] !== 0 || param[8] !== 0) {
                        tr_table_controller.show(id);
                    } else if (display) {
                        tr_table_controller.hide(id);
                    }
                    break;
                case ('inacive'):
                    if (param[9] === 0 && param[8] === 0) {
                        tr_table_controller.show(id);
                    } else if (display) {
                        tr_table_controller.hide(id);
                    }
                    break;
                case ('complite'):
                    if (param[4] === 1000) {
                        tr_table_controller.show(id);
                    } else if (display) {
                        tr_table_controller.hide(id);
                    }
                    break;
                case ('seeding'):
                    if (param[1] === 201 && param[4] === 1000) {
                        tr_table_controller.show(id);
                    } else if (display) {
                        tr_table_controller.hide(id);
                    }
                    break;
                case ('no label'):
                    if (param[11].length === 0) {
                        if (!display) {
                            tr_table_controller.show(id);
                        }
                    } else {
                        if (display) {
                            tr_table_controller.hide(id);
                        }
                    }
                    break;
                default:
                    if (display) {
                        tr_table_controller.hide(id);
                    }
            }
        } else {
            if (tmp_vars.sel_label.v === param[11]) {
                if (!display) {
                    tr_table_controller.show(id);
                }
            } else {
                if (display) {
                    tr_table_controller.hide(id);
                }
            }
        }
    };
    var delete_from_table = function (arr) {
        var c = arr.length;
        for (var n = 0; n < c; n++) {
            tr_table_controller.del(arr[n]);
        }
    };
    var set_status = function (a) {
        if (tmp_vars.status_cache === a) {
            return;
        }
        tmp_vars.status_cache = a;
        if (a === undefined) {
            tables.status.html('<img src="/images/status_update.gif"/>');
        } else {
            tables.status.html(a);
        }
    };
    var update_labels_context_menu = function (id) {
        var current_label = undefined;
        if (id) {
            current_label = tr_table_controller.get(id);
            if (current_label === undefined) {
                return;
            }
            current_label = current_label[11];
        }
        var arr = tmp_vars.label;
        var c = arr.length;
        var code = '<li class="context-menu-item select_label" data-key="add_label"><span>' + lang_arr[114] + '</span></li>';
        if (current_label !== undefined && current_label.length) {
            code = '<li class="context-menu-item select_label" data-key="del_label"><span>' + lang_arr[12] + '</span></li>';
        }
        for (var n = 0; n < c; n++) {
            if (current_label !== undefined && current_label === arr[n][0]) {
                code += '<li class="context-menu-item select_label" data-key="' + arr[n][1] + '"><span><label>● </label>' + arr[n][0] + '</span></li>';
            } else {
                code += '<li class="context-menu-item select_label" data-key="' + arr[n][1] + '"><span>' + arr[n][0] + '</span></li>';
            }
        }
        tmp_vars.torrent_context_menu_labels.html(code);
    };
    var set_labels = function (arr) {
        tmp_vars.label = arr;
        tmp_vars.label_obj = {};
        var c = arr.length;
        var costum = ['all', 'download', 'seeding', 'complite', 'active', 'inacive', 'no label'];
        var cc = costum.length;
        var options = '';
        var num = 0;
        for (var n = 0; n < cc; n++) {
            num++;
            options += '<option value="' + costum[n] + '"' + ((isNumber(tmp_vars.sel_label.k) === false && tmp_vars.sel_label.k === costum[n]) ? ' selected' : '') + '>' + lang_arr[70][n] + '</option>';
        }
        for (var n = 0; n < c; n++) {
            num++;
            arr[n][2] = arr[n][1];
            arr[n][1] = num;
            tmp_vars.label_obj[arr[n][1]] = arr[n][0];
            options += '<option value="' + arr[n][1] + '"' + ((isNumber(tmp_vars.sel_label.k) && tmp_vars.sel_label.k === arr[n][1]) ? ' selected' : '') + '>' + arr[n][0] + '</option>';
        }
        tables['label-select'].selectBox('options', options);
        update_labels_context_menu();
        tmp_vars.label = arr;
    };
    var contextActions = function (k, v, opt) {
        if ((k !== 'speed' && !v) || (k === 'speed' && v < 0))
            return;
        switch (k) {
            case ('start'):
                _engine.sendAction({list: 1, action: 'start', hash: v});
                break;
            case ('force_start'):
                _engine.sendAction({list: 1, action: 'forcestart', hash: v});
                break;
            case ('stop'):
                _engine.sendAction({list: 1, action: 'stop', hash: v});
                break;
            case ('pause'):
                _engine.sendAction({list: 1, action: 'pause', hash: v});
                break;
            case ('unpause'):
                _engine.sendAction({list: 1, action: 'unpause', hash: v});
                break;
            case ('recheck'):
                _engine.sendAction({list: 1, action: 'recheck', hash: v});
                break;
            case ('set_label'):
                _engine.sendAction({list: 1, action: 'setprops', s: 'label', v: opt, hash: v});
                break;
            case ('del_label'):
                _engine.sendAction({list: 1, action: 'setprops', s: 'label', v: '', hash: v});
                break;
            case ('remove'):
                _engine.sendAction({list: 1, action: 'remove', hash: v});
                break;
            case ('remove_files'):
                _engine.sendAction({list: 1, action: 'removedata', hash: v});
                break;
            case ('remove_torrent'):
                _engine.sendAction({list: 1, action: 'removetorrent', hash: v});
                break;
            case ('remove_torrent_files'):
                _engine.sendAction({list: 1, action: 'removedatatorrent', hash: v});
                break;
            case ('speed'):
                if (opt) {
                    _engine.sendAction({action: 'setsetting', s: 'max_dl_rate', v: v});
                    tmp_vars.speed_limit.download_limit = parseInt(v);
                } else {
                    _engine.sendAction({action: 'setsetting', s: 'max_ul_rate', v: v});
                    tmp_vars.speed_limit.upload_limit = parseInt(v);
                }
                update_speed_menu(opt);
                break;
            case ('priority'):
                _engine.sendAction($.param({action: 'setprio', p: v}) + '&' + opt);
                break;
            case ('torrent_files'):
                torrent_file_list.open(v);
                break;
        }
    };
    var get_label_context_menu = function () {
        var labels = tmp_vars.label;
        var c = labels.length;
        var menu = {};
        menu.del_label = {
            name: lang_arr[12]
        };
        for (var n = 0; n < c; n++) {
            menu[ labels[n][1] ] = {
                name: labels[n][0]
            };
        }
        return menu;
    };
    var update_torrent_context_menu = function (id) {
        //обновляет контекстное меню торрента
        if (tmp_vars.auto_order) {
            tmp_vars.tr_auto_order = false;
        }
        var readStatus = function (i) {
            //показывает что можно, а что нельзя в контекстном меню торрента - скрывает
            var minus_par = {};
            var sel_en = [];
            var minusSt = function (i) {
                //читает код статуса тооррента
                if (i >= 128) {
                    //Loaded
                    minus_par[128] = true;
                    sel_en[2] = 0;
                    sel_en[3] = 0;
                    return i - 128;
                } else if (i >= 64) {
                    //Queued
                    minus_par[64] = true;
                    sel_en[1] = 0;
                    sel_en[3] = 1;
                    return i - 64;
                } else if (i >= 32) {
                    //Paused
                    minus_par[32] = true;
                    sel_en[1] = 1;
                    sel_en[5] = 1;
                    sel_en[6] = 1;
                    return i - 32;
                } else if (i >= 16) {
                    //Error
                    minus_par[16] = true;
                    sel_en[6] = 1;
                    sel_en[1] = 1;
                    return i - 16;
                } else if (i >= 8) {
                    //Checked
                    minus_par[8] = true;
                    sel_en[6] = 1;
                    return i - 8;
                } else if (i >= 4) {
                    //Start after check
                    minus_par[4] = true;
                    sel_en[4] = 1;
                    sel_en[1] = 0;
                    sel_en[2] = 1;
                    sel_en[3] = 1;
                    return i - 4;
                } else if (i >= 2) {
                    //Checking
                    minus_par[2] = true;
                    sel_en[6] = 0;
                    sel_en[3] = 1;
                    if (!minus_par[32])
                        sel_en[2] = 1;
                    return i - 2;
                } else if (i >= 1) {
                    //Started
                    minus_par[1] = true;
                    if (minus_par[32] === undefined) {
                        sel_en[1] = 0;
                        sel_en[2] = 1;
                        sel_en[3] = 1;
                        sel_en[4] = 1;
                        sel_en[5] = 0;
                    }
                    if (minus_par[8] && minus_par[1] && minus_par[64] === undefined) {
                        sel_en[1] = 1;
                    }
                    sel_en[6] = 0;
                    return i - 1;
                } else
                    return i;
            };
            sel_en[1] = 1; //start
            sel_en[2] = 1; //pause
            sel_en[3] = 1; //stop
            sel_en[4] = 0; //force start
            sel_en[5] = 0; //unpause
            sel_en[6] = 1; //forcer re-check
            var t = i;
            while (t > 0) {
                t = minusSt(t);
            }
            /*
             start,force_start,stop,pause,unpause,recheck
             */
            return {start: sel_en[1], force_start: sel_en[2], stop: sel_en[3], pause: sel_en[4], unpause: sel_en[5], recheck: sel_en[6]};
        };
        var status = tr_table_controller.get(id);
        if (status === undefined)
            return;
        var menu_items = readStatus(status[1]);
        var f = 0;
        $.each(menu_items, function (k, v) {
            if (v && !menu_items.start && !f) {
                f++;
                tmp_vars["torrent_context_menu"].find('li[data-key=' + k + ']').addClass('first').css('display', (v) ? 'block' : 'none');
            } else
                tmp_vars["torrent_context_menu"].find('li[data-key=' + k + ']').css('display', (v) ? 'block' : 'none');
        });
        var current_label = tr_table_controller.get(id);
        if (current_label === undefined)
            return;
        current_label = current_label[11];
        tmp_vars["torrent_context_menu"].attr('data-id', id).attr('data-lable', (current_label.length) ? 1 : 0);
        if (current_label.length) {
            $('.context-menu-item.labels').children('span').html(lang_arr[11] + ' (' + current_label + ')');
        }
        $('#' + id).addClass('selected');
        update_labels_context_menu(id);
    };
    var on_hide_torrent_context_menu = function (id) {
        if ((torrent_file_list.getID()).length === 0) {
            if (tmp_vars.auto_order) {
                tmp_vars.tr_auto_order = true;
            }
            $('#' + id + '.selected').removeClass('selected');
        }
        tmp_vars["torrent_context_menu"].find('li.first').removeClass('first');
        tmp_vars["torrent_context_menu"].attr('data-id', '');
        if (tmp_vars["torrent_context_menu"].attr('data-lable') === '1') {
            $('.context-menu-item.labels').children('span').html(lang_arr[11]);
        }
        tmp_vars["torrent_context_menu"].attr('data-lable', '');
    };
    var make_speed_menu = function () {
        //выстраивает внутренности контекстного меню для ограничения скорости
        var items = {};
        items.unlimited = {
            name: lang_arr[69],
            callback: function (opt) {
                var type = $(this).hasClass('download');
                contextActions('speed', 0, type);
            }
        };
        items["s"] = '-';
        var count = Math.round((settings.window_height - 54) / 27);
        if (count > 10)
            count = 10;
        tmp_vars.speed_limit.count = count;
        for (var i = 0; i < count; i++) {
            items['s' + i] = {
                name: '-',
                callback: function (opt) {
                    var type = $(this).hasClass('download');
                    var v = tmp_vars.speed_context_menu.children('li[data-key=' + opt + ']').attr('data-speed');
                    contextActions('speed', v, type);
                }
            };
        }
        return items;
    };
    var set_speed_limit = function (arr) {
        var c = arr.length;
        var a = 0;
        var b = 0;
        for (var n = 0; n < c; n++) {
            if (arr[n][0] === 'max_dl_rate') {
                tmp_vars.speed_limit.download_limit = parseInt(arr[n][2]);
                a++;
                if (b) {
                    break;
                }
            }
            if (arr[n][0] === 'max_ul_rate') {
                tmp_vars.speed_limit.upload_limit = parseInt(arr[n][2]);
                b++;
                if (a) {
                    break;
                }
            }
        }
        if (tmp_vars.speed_limit['last-type'] !== undefined) {
            update_speed_menu(tmp_vars.speed_limit['last-type']);
        }
    };
    var update_speed_menu = function (type) {
        //обновляет контекстное меню ограничения скорости, в зависимости от скорости
        tmp_vars.speed_limit['last-type'] = type;
        var download_limit = 0;
        var upload_limit = 0;
        if (tmp_vars.speed_limit.download_limit !== undefined) {
            download_limit = tmp_vars.speed_limit.download_limit;
            upload_limit = tmp_vars.speed_limit.upload_limit;
        } else {
            _engine.sendAction({action: 'getsettings'});
        }
        var count = tmp_vars.speed_limit.count;
        var sp = (type) ? download_limit : upload_limit;
        var count_p = sp;
        if (count_p === 0) {
            count_p = 200;
        }
        if (count_p < Math.round(count / 2)) {
            count_p = Math.round(count / 2);
        }
        if (sp === 0) {
            tmp_vars.speed_context_menu.children('li[data-key=unlimited]').children('span').html('<label>● </label>' + lang_arr[69]);
        } else {
            tmp_vars.speed_context_menu.children('li[data-key=unlimited]').children('span').html(lang_arr[69]);
        }
        var with_a = tmp_vars.speed_context_menu.children('li[data-key!=unlimited]');
        for (var i = 0; i <= count; i++) {
            var speed = Math.round((i + 1) / Math.round(count / 2) * count_p);
            if (speed === sp) {
                with_a.eq(i).attr('data-speed', speed).children('span').html('<label>● </label>' + bytesToSize(speed * 1024, undefined, 1));
            } else {
                with_a.eq(i).attr('data-speed', speed).children('span').text(bytesToSize(speed * 1024, undefined, 1));
            }
        }
    };
    var updateColums = function (key) {
        timer.stop();
        tables['table-main'].trigger('destroy');
        var colums = tmp_vars.colums;
        colums[key].a = (colums[key].a) ? 0 : 1;
        _engine.setColums(colums);
        tmp_vars.colums = colums;
        tables['tr-body'].empty();
        tables['tr-head'].empty();
        tables['tr-fixed_head'].empty();
        torrent_list_head();
        //tables['table-main'].trigger('update');
        manager.updateList(_engine.cache.torrents || []);
        //_engine.get_cache_torrent_list();
        torrent_list_order();
        if (tmp_vars.moveble_enabled_tr) {
            calculate_moveble(tables['table-main'].find('td.name > div > span'), tmp_vars.colums.name.size);
        }
        timer.start();
    };
    var updateFlColums = function (key) {
        timer.stop();
        tables['fl-table-main'].trigger('destroy');
        var colums = tmp_vars.fl_colums;
        colums[key].a = (colums[key].a) ? 0 : 1;
        _engine.setFlColums(colums);
        tmp_vars.fl_colums = colums;
        tables['fl-body'].empty();
        tables['fl-head'].empty();
        tables['fl-fixed_head'].empty();
        file_list_head();
        torrent_file_list.clear_list();
        file_list_order();
        _engine.sendAction({action: 'getfiles', hash: torrent_file_list.getID()});
        file_list_order();
        if (tmp_vars.moveble_enabled_tr) {
            calculate_moveble(tables['fl-table-main'].find('td.name > div > span'), tmp_vars.fl_colums.name.size);
        }
        timer.start();
    };
    var torrent_file_list = function () {
        var id = '';
        var clear = 0;
        var display_fl = 0;
        var display_loading = 0;
        var loading_img = function () {
            $('<div class="file-list-loading"></div>').css({
                "top": (tmp_vars.fl_height / 2 - 15) + "px",
                "left": (tmp_vars.fl_width / 2 - 15) + "px"
            }).appendTo(tables['fl-layer']);
            display_loading = 1;
        };
        var setFL = function (arr) {
            if (!display_fl) {
                tmp_vars.filelist_param = {};
                return;
            }
            if (arr[0] !== id) {
                return;
            }
            var files = arr[1];
            if (files.length === 0) {
                return;
            }
            $.each(files, function (k, v) {
                fl_table_controller.add(k, v);
            });
            if (display_loading) {
                tables['fl-layer'].children('div.file-list-loading').remove();
                display_loading = 0;
            }
            if (clear === 1) {
                tables['fl-table-main'].trigger('update');
                if (tmp_vars.moveble_enabled_fl) {
                    calculate_moveble(tables['fl-table-main'].find('td.name > div > span'), 270);
                }
                clear = 0;
            }
        };
        var close = function () {
            display_fl = 0;
            tmp_vars.filelist_param = {};
            $('#' + id).removeClass('selected');
            tables['file-list'].css("display", "none");
            $('div.file-list-layer-temp').remove();
            if (tmp_vars.auto_order) {
                tmp_vars.tr_auto_order = true;
            }
            id = "";
            fl_table_controller.clear();
            clear = 1;
        };
        var add_layer = function () {
            $('<div class="file-list-layer-temp"></div>')
                .css({
                    height: tables.window.height(),
                    width: tables.window.width()
                }).on('mousedown',function () {
                    $(this).remove();
                    close();
                }).appendTo(tables.body);
        };
        return {
            open: function (_id) {
                if (tmp_vars.auto_order) {
                    tmp_vars.tr_auto_order = false;
                }
                id = _id;
                tmp_vars.filelist_param = {action: 'getfiles', hash: id};
                _engine.sendAction(tmp_vars.filelist_param);
                $('#' + id).addClass('selected');
                add_layer();
                tables['file-list'].css("display", "block");
                display_fl = 1;
                loading_img();
                var folder = (tr_table_controller.get(id))[26];
                tables['fl-bottom'].find('input').attr('title', folder).val(folder);
                fl_table_controller.clear();
                clear = 1;
            },
            setFL: function (a) {
                setFL(a);
            },
            getID: function () {
                return id;
            },
            close: function () {
                close();
            },
            clear_list: function () {
                fl_table_controller.clear();
                clear = 1;
            }
        };
    }();
    var calculate_moveble = function (selectors, size) {
        if (size <= 70)
            return;
        var titles = selectors;
        var titles_l = titles.length;

        for (var i = 0; i < titles_l; i++) {
            var str_w = titles.eq(i).width();
            if (str_w === 0) {
                str_w = titles.eq(i).text().length * 7;
            }
            if (str_w < size)
                continue;
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
            var str_s = size;
            var time_calc = Math.round(parseInt(str_w) / parseInt(str_s) * 3.5);
            var move_name = 'moveble' + '_' + str_s + '_' + str_w;
            if ($('body').find('.' + move_name).length === 0) {
                $('body').append('<style class="' + move_name + '">'
                    + '@-webkit-keyframes a_' + move_name
                    + '{'
                    + '0%{margin-left:2px;}'
                    + '50%{margin-left:-' + (str_w - str_s) + 'px;}'
                    + '90%{margin-left:6px;}'
                    + '100%{margin-left:2px;}'
                    + '}'
                    + '@keyframes a_' + move_name
                    + '{'
                    + '0%{margin-left:2px;}'
                    + '50%{margin-left:-' + (str_w - str_s) + 'px;}'
                    + '90%{margin-left:6px;}'
                    + '100%{margin-left:2px;}'
                    + '}'
                    + 'div.' + move_name + ':hover > span {'
                    + 'overflow: visible;'
                    + '-webkit-animation:a_' + move_name + ' ' + time_calc + 's;'
                    + '}'
                    + '</style>');
            }
            titles.eq(i).parent().attr('class', 'title ' + move_name);
        }
    };
    var fl_select_all_check = function () {
        var a = tables['fl-body'].find('input:visible');
        var bc = a.filter(':checked').length;
        var sel_all = tables['fl-fixed_head'].find('input').eq(0)[0];
        if (bc === a.length) {
            sel_all.checked = true;
        } else {
            sel_all.checked = false;
        }
    };
    //==================
    function isNumber(n) {
        return !isNaN(parseFloat(n)) && isFinite(n);
    }
    var bytesToSize = function (bytes, nan, ps) {
        //переводит байты в строчки
        var sizes = (ps === undefined)?lang_arr[59]:lang_arr[60];
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
    var unixintime = function (i) {
        //выписывает отсчет времени из unixtime
        if (i === 0) {
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
            return week + lang_arr[61][0] + ' ' + day + lang_arr[61][1];
        if (day > 0)
            return day + lang_arr[61][1] + ' ' + hour + lang_arr[61][2];
        if (hour > 0)
            return hour + lang_arr[61][2] + ' ' + minutes + lang_arr[61][3];
        if (minutes > 0)
            return minutes + lang_arr[61][3] + ' ' + seconds + lang_arr[61][4];
        if (seconds > 0)
            return seconds + lang_arr[61][4];
        return '∞';
    };
    var writeTimeFromShtamp = function (shtamp) {
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
    //=================
    return {
        begin: function () {
            settings = _engine.settings;
            if (settings.auto_order) {
                tmp_vars.auto_order = true;
                tmp_vars.moveble_enabled_tr = false;
            }
            if (!chk_settings()) {
                window.location = "options.html";
                return;
            }
            _engine.setWindow(window);
            if (tmp_vars.auto_order) {
                tmp_vars.tr_auto_order_cell = true;
                tmp_vars.tr_auto_order = true;
                tmp_vars.fl_auto_order_cell = true;
                tmp_vars.fl_auto_order = true;
            }
            tables = {
                window: $(window),
                body: $('body'),
                menu: $('ul.menu'),
                'dl-speed': $('.status-panel td.speed.download'),
                'up-speed': $('.status-panel td.speed.upload'),
                status: $('.status-panel td.status'),
                'label-select': $('ul.menu li.select select'),
                'table-body': $('.torrent-list-layer'),
                'table-main': $('.torrent-table-body'),
                'table-fixed': $('.torrent-table-head'),
                'tr-body': $('.torrent-table-body').children('tbody'),
                'tr-head': $('.torrent-table-body').children('thead'),
                'tr-fixed_head': $('.torrent-table-head').children('thead'),
                'file-list': $(".file-list"),
                'fl-layer': $(".file-list").children('.fl-layer'),
                'fl-table-main': $('.fl-table-body'),
                'fl-table-fixed': $('.fl-table-head'),
                'fl-body': $('.fl-table-body').children('tbody'),
                'fl-head': $('.fl-table-body').children('thead'),
                'fl-fixed_head': $('.fl-table-head').children('thead'),
                'fl-bottom': $('.file-list ul.bottom-menu'),
                file_select: $('input[name="torrent_file"]')
            };
            if (tmp_vars.tr_word_wrap) {
                tables.body.append('<style>div.torrent-list-layer td div {white-space: normal;word-wrap: break-word;}</style>');
            }
            if (tmp_vars.fl_word_wrap) {
                tables.body.append('<style>div.fl-layer td div {white-space: normal;word-wrap: break-word;}</style>');
            }
            tables['fl-bottom'].on('click', 'a.update', function () {
                _engine.sendAction({action: 'getfiles', hash: torrent_file_list.getID()});
            });
            tables['fl-bottom'].on('click', 'a.close', function () {
                torrent_file_list.close();
            });
            tables['table-body'].css({'max-height': (settings.window_height - 54) + 'px', 'min-height': (settings.window_height - 54) + 'px'});
            tmp_vars.colums = _engine.getColums();
            tmp_vars.fl_colums = _engine.getFlColums();
            torrent_list_head();
            file_list_head();
            torrent_list_order();
            file_list_order();
            tables['label-select'].selectBox().change(function () {
                var val = $(this).val();
                var item = null;
                if (isNumber(val)) {
                    var item = tmp_vars.label_obj[$(this).val()];
                }
                tr_table_controller.filter(val, item);
            });
            tables['fl-body'].on('click', 'input', function () {
                if (this.checked) {
                    $(this).parent().parent().addClass("selected");
                } else {
                    $(this).parent().parent().removeClass("selected");
                }
                fl_select_all_check();
            });
            tables['fl-fixed_head'].on('click', 'input', function () {
                if (this.checked) {
                    var t = tables['fl-body'].find('input:visible');
                    var tc = t.length;
                    for (var n = 0; n < tc; n++) {
                        var el = t.eq(n);
                        el[0].checked = true;
                        el.parent().parent().addClass("selected");
                    }
                } else {
                    var t = tables['fl-body'].find("input:visible");
                    var tc = t.length;
                    for (var n = 0; n < tc; n++) {
                        var el = t.eq(n);
                        el[0].checked = false;
                        el.parent().parent().removeClass("selected");
                    }
                }
            });
            tables['fl-layer'].on('click', 'a.folder', function (e) {
                e.preventDefault();
                fl_table_controller.show_folder($(this).attr('data-value'));
                fl_select_all_check();
            });
            tables['fl-layer'].on('scroll', function () {
                var l = $(this).scrollLeft();
                if (l) {
                    tables['fl-table-fixed'].css('left', -($(this).scrollLeft()));
                } else {
                    tables['fl-table-fixed'].css('left', 'auto');
                }
            });
            tables['table-body'].on('scroll', function () {
                tables['table-fixed'].css('left', -($(this).scrollLeft()));
            });
            tables['table-body'].on('dblclick', 'tbody tr', function () {
                var id = $(this).attr('id');
                torrent_file_list.open(id);
            });
            tables.menu.on('click', 'a.refresh', function (e) {
                e.preventDefault();
                timer.start();
                get_torrent_list();
            });
            tables.menu.on('click', 'a.start_all', function (e) {
                e.preventDefault();
                var table = tr_table_controller.get_table();
                var hash_list = [];
                $.each(table, function (key, value) {
                    if (value.api[1] === 233 && value.gui.display)
                        hash_list.push(key);
                });
                if (hash_list.length > 0) {
                    _engine.sendAction($.param({list: 1, action: 'unpause', hash: hash_list}, true));
                }
            });
            tables.menu.on('click', 'a.add_file', function (e) {
                e.preventDefault();
                tables.file_select.trigger('click');
            });
            tables.menu.on('click', 'a.add_magnet', function (e) {
                e.preventDefault();
                apprise(lang_arr[121], {
                    input: true,
                    textOk: lang_arr[119][0],
                    textCancel: lang_arr[119][1]
                }, function (r) {
                    if (r === false || r.length === 0) {
                        return;
                    }
                    var url = r;
                    if (settings.folders_array.length === 0) {
                        _engine.sendFile(url);
                        return;
                    }
                    apprise(lang_arr[117], {
                        select: settings.folders_array,
                        textOk: lang_arr[119][0],
                        textCancel: lang_arr[119][1]
                    }, function (r) {
                        if (r === false) {
                            return;
                        }
                        r = parseInt(r);
                        if (isNaN(r)) {
                            return;
                        }
                        var folder = {download_dir: settings.folders_array[r][0],
                            path: settings.folders_array[r][1]};
                        if (settings.context_labels) {
                            _engine.sendFile(url, undefined, settings.folders_array[r][1]);
                        } else {
                            _engine.sendFile(url, folder);
                        }
                    });
                });
            });
            tables.file_select.on('change', function (e) {
                e.preventDefault();
                if (settings.folders_array.length === 0) {
                    for (var i = 0, len = this.files.length; i < len; i++) {
                        _engine.sendFile(this.files[i]);
                    }
                    tables.file_select.get(0).value = '';
                    return;
                }
                apprise(lang_arr[117], {
                    select: settings.folders_array,
                    textOk: lang_arr[119][0],
                    textCancel: lang_arr[119][1]
                }, function (r) {
                    if (r === false) {
                        tables.file_select.get(0).value = '';
                        return;
                    }
                    r = parseInt(r);
                    if (isNaN(r)) {
                        return;
                    }
                    var folder = {download_dir: settings.folders_array[r][0],
                        path: settings.folders_array[r][1]};
                    var inp = tables.file_select.get(0);
                    for (var i = 0, len = this.files.length; i < len; i++) {
                        if (settings.context_labels) {
                            _engine.sendFile(inp.files[i], undefined, settings.folders_array[r][1]);
                        } else {
                            _engine.sendFile(inp.files[i], folder);
                        }
                    }
                    tables.file_select.get(0).value = '';
                });
            });
            tables.menu.on('click', 'a.pause_all', function (e) {
                e.preventDefault();
                var table = tr_table_controller.get_table();
                var hash_list = [];
                $.each(table, function (key, value) {
                    if (value.api[1] === 201 && value.gui.display) {
                        hash_list.push(key);
                    }
                });
                if (hash_list.length > 0) {
                    _engine.sendAction($.param({list: 1, action: 'pause', hash: hash_list}, true));
                }
            });
            tables['table-body'].on('click', 'a.start', function (e) {
                e.preventDefault();
                var hash = $(this).parents().eq(2).attr('id');
                _engine.sendAction({list: 1, action: 'start', hash: hash});
            });
            tables['table-body'].on('click', 'a.pause', function (e) {
                e.preventDefault();
                var hash = $(this).parents().eq(2).attr('id');
                _engine.sendAction({list: 1, action: 'pause', hash: hash});
            });
            tables['table-body'].on('click', 'a.stop', function (e) {
                e.preventDefault();
                var hash = $(this).parents().eq(2).attr('id');
                _engine.sendAction({list: 1, action: 'stop', hash: hash});
            });
            $.contextMenu({
                className: 'colum_select',
                selector: 'table.torrent-table-head thead',
                events: {
                    show: function () {
                        var colums = tmp_vars.colums;
                        $.each(colums, function (key, value) {
                            var item = tmp_vars.colums_context_menu.find('li[data-key=' + key + ']');
                            if (value.a === 1 && (tmp_vars.colum_context_menu[key] === 0)) {
                                item.attr('data-active', 1).children('span').html('<label>● </label>' + lang_arr[value.lang][1]);
                                tmp_vars.colum_context_menu[key] = 1;
                            } else if (value.a === 0 && (tmp_vars.colum_context_menu[key] === 1)) {
                                item.attr('data-active', 1).children('span').html(lang_arr[value.lang][1]);
                                tmp_vars.colum_context_menu[key] = 0;
                            }
                        });
                    }
                },
                items: function () {
                    var colums = tmp_vars.colums;
                    var items = {};
                    tmp_vars.colum_context_menu = {};
                    $.each(colums, function (key, value) {
                        tmp_vars.colum_context_menu[key] = 0;
                        items[key] = {
                            name: lang_arr[value.lang][1],
                            callback: function (key) {
                                updateColums(key);
                            }
                        };
                    });
                    return items;
                }()
            });
            tmp_vars.colums_context_menu = $(".context-menu-list.context-menu-root.colum_select");
            $.contextMenu({
                selector: ".torrent-table-body tr",
                className: "torrent",
                events: {
                    show: function () {
                        var id = this[0].id;
                        update_torrent_context_menu(id);
                    },
                    hide: function () {
                        var id = this[0].id;
                        on_hide_torrent_context_menu(id);
                    }
                },
                items: {
                    start: {
                        name: lang_arr[0],
                        callback: function (key, opt) {
                            var id = this[0].id;
                            contextActions(key, id);
                        }
                    },
                    force_start: {
                        name: lang_arr[3],
                        callback: function (key, opt) {
                            var id = this[0].id;
                            contextActions(key, id);
                        }
                    },
                    pause: {
                        name: lang_arr[1],
                        callback: function (key, opt) {
                            var id = this[0].id;
                            contextActions(key, id);
                        }
                    },
                    unpause: {
                        name: lang_arr[4],
                        callback: function (key, opt) {
                            var id = this[0].id;
                            contextActions(key, id);
                        }
                    },
                    stop: {
                        name: lang_arr[2],
                        callback: function (key, opt) {
                            var id = this[0].id;
                            contextActions(key, id);
                        }
                    },
                    s1: '-',
                    recheck: {
                        name: lang_arr[5],
                        callback: function (key, opt) {
                            var id = this[0].id;
                            contextActions(key, id);
                        }
                    },
                    remove: {
                        name: lang_arr[6],
                        callback: function (key, opt) {
                            var id = this[0].id;
                            apprise(lang_arr[73], {
                                verify: true,
                                textYes: lang_arr[110][0],
                                textNo: lang_arr[110][1]
                            }, function (r) {
                                if (r !== true) {
                                    return;
                                }
                                contextActions(key, id);
                            });
                        }
                    },
                    remove_with: {
                        name: lang_arr[7],
                        items: {
                            remove_torrent: {
                                name: lang_arr[8],
                                callback: function (key, opt) {
                                    var id = this[0].id;
                                    contextActions(key, id);
                                }
                            },
                            remove_files: {
                                name: lang_arr[9],
                                callback: function (key, opt) {
                                    var id = this[0].id;
                                    contextActions(key, id);
                                }
                            },
                            remove_torrent_files: {
                                name: lang_arr[10],
                                callback: function (key, opt) {
                                    var id = this[0].id;
                                    contextActions(key, id);
                                }
                            }
                        }
                    },
                    's2': '-',
                    torrent_files: {
                        name: lang_arr[111],
                        callback: function (key, opt) {
                            var id = this[0].id;
                            contextActions(key, id);
                        }
                    },
                    labels: {
                        name: lang_arr[11],
                        className: "labels",
                        items: get_label_context_menu()
                    }
                }
            });
            tmp_vars.torrent_context_menu = $(".context-menu-list.context-menu-root.torrent");
            tmp_vars.torrent_context_menu_labels = $(".context-menu-list.labels");
            tmp_vars.torrent_context_menu_labels.on('click', '.select_label', function () {
                var label_id = $(this).attr('data-key');
                var label = tmp_vars.label_obj[label_id];
                var id = tmp_vars["torrent_context_menu"].attr('data-id');
                if (label_id === 'del_label') {
                    contextActions('del_label', id);
                } else if (label_id === 'add_label') {
                    apprise(lang_arr[115], {
                        input: 1,
                        textOk: lang_arr[116][0],
                        textCancel: lang_arr[116][1]
                    }, function (name) {
                        if (!name) {
                            return;
                        }
                        contextActions('set_label', id, name);
                    });
                } else {
                    contextActions('set_label', id, label);
                }
                $('#context-menu-layer').trigger('mousedown');
            });
            $.contextMenu({
                className: 'speed',
                selector: 'table.status-panel td.speed',
                events: {
                    show: function (opt) {
                        var type = $(this).hasClass('download');
                        update_speed_menu(type);
                    }
                },
                items: make_speed_menu()
            });
            tmp_vars.speed_context_menu = $(".context-menu-list.context-menu-root.speed");
            if (settings.graph) {
                $('li.graph').append($('<canvas>', {id: 'graph'}));
                graph.init(settings.mgr_update_interval / 1000);
            }
            write_language();
            $.contextMenu({
                selector: ".fl-table-body tr",
                className: "filelist",
                events: {
                    show: function () {
                        if (tmp_vars.auto_order) {
                            tmp_vars.fl_auto_order = false;
                        }
                        var id = this[0].id;
                        if ($(this).hasClass('selected')) {
                            tmp_vars.fl_file_selected = 1;
                        } else {
                            $(this).find('input').trigger('click');
                            tmp_vars.fl_file_selected = 0;
                        }
                        var priority = (fl_table_controller.get(id)).api[3];
                        tables.fl_context_manu.find('li.p' + priority).children('span').html('<label>● </label>' + lang_arr[87][priority]);
                        var select_array = tables['fl-table-main'].find('tr.selected');
                        var c = select_array.length;
                        tmp_vars.fl_prio_param = {hash: torrent_file_list.getID()};
                        tmp_vars.fl_select_array = new Array(c);
                        for (var n = 0; n < c; n++) {
                            tmp_vars.fl_select_array[n] = select_array.eq(n)[0].id.replace('file_id_', '');
                        }
                        tmp_vars.fl_prio_param.f = tmp_vars.fl_select_array;
                    },
                    hide: function () {
                        if (tmp_vars.auto_order) {
                            tmp_vars.fl_auto_order = true;
                        }
                        if (tmp_vars.fl_file_selected === 0) {
                            $(this).find('input').trigger('click');
                        }
                        tables.fl_context_manu.find('label').remove();
                        tmp_vars.fl_prio_param = {};
                        tmp_vars.fl_select_array = [];
                    }
                },
                items: {
                    high: {
                        className: 'p3',
                        name: lang_arr[87][3],
                        callback: function (key, opt) {
                            contextActions('priority', 3, $.param(tmp_vars.fl_prio_param, true));
                            tmp_vars.fl_file_selected = 1;
                            tables['fl-body'].find('input:checked').trigger('click');
                        }
                    },
                    normal: {
                        className: 'p2',
                        name: lang_arr[87][2],
                        callback: function (key, opt) {
                            contextActions('priority', 2, $.param(tmp_vars.fl_prio_param, true));
                            tmp_vars.fl_file_selected = 1;
                            tables['fl-body'].find('input:checked').trigger('click');
                        }
                    },
                    low: {
                        className: 'p1',
                        name: lang_arr[87][1],
                        callback: function (key, opt) {
                            contextActions('priority', 1, $.param(tmp_vars.fl_prio_param, true));
                            tmp_vars.fl_file_selected = 1;
                            tables['fl-body'].find('input:checked').trigger('click');
                        }
                    },
                    s: '-',
                    dntdownload: {
                        className: 'p0',
                        name: lang_arr[87][0],
                        callback: function (key, opt) {
                            contextActions('priority', 0, $.param(tmp_vars.fl_prio_param, true));
                            tmp_vars.fl_file_selected = 1;
                            tables['fl-body'].find('input:checked').trigger('click');
                        }
                    },
                    s1: '-',
                    download: {
                        name: lang_arr[90],
                        callback: function (key, opt) {
                            function ui_url(file_number) {
                                return 'proxy?sid=' +
                                    (tr_table_controller.get(torrent_file_list.getID()))[22] + '&file=' + file_number +
                                    '&disposition=ATTACHMENT&service=DOWNLOAD&qos=0';
                            }

                            var c = tmp_vars.fl_select_array.length;
                            /**
                             * @namespace chrome.tabs.create
                             */
                            for (var n = 0; n < c; n++) {
                                chrome.tabs.create({
                                    url: tmp_vars.lp_path + ui_url(tmp_vars.fl_select_array[n])
                                });
                            }
                            tmp_vars.fl_file_selected = 1;
                            tables['fl-body'].find('input:checked').trigger('click');
                        }
                    }
                }
            });
            $.contextMenu({
                className: 'fl_colum_select',
                selector: 'table.fl-table-head thead',
                events: {
                    show: function () {
                        var colums = tmp_vars.fl_colums;
                        $.each(colums, function (key, value) {
                            var item = tmp_vars.fl_colums_context_menu.find('li[data-key=' + key + ']');
                            if (value.a === 1 && (tmp_vars.fl_colum_context_menu[key] === 0)) {
                                item.attr('data-active', 1).children('span').html('<label>● </label>' + lang_arr[value.lang][1]);
                                tmp_vars.fl_colum_context_menu[key] = 1;
                            } else if (value.a === 0 && (tmp_vars.fl_colum_context_menu[key] === 1)) {
                                item.attr('data-active', 1).children('span').html(lang_arr[value.lang][1]);
                                tmp_vars.fl_colum_context_menu[key] = 0;
                            }
                        });
                    }
                },
                items: function () {
                    var colums = tmp_vars.fl_colums;
                    var items = {};
                    tmp_vars.fl_colum_context_menu = {};
                    $.each(colums, function (key, value) {
                        tmp_vars.fl_colum_context_menu[key] = 0;
                        items[key] = {
                            name: lang_arr[value.lang][1],
                            callback: function (key) {
                                updateFlColums(key);
                            }
                        };
                    });
                    return items;
                }()
            });
            tmp_vars.fl_colums_context_menu = $(".context-menu-list.context-menu-root.fl_colum_select");
            tables.fl_context_manu = $('.context-menu-list.filelist');
            manager.setLabels(_engine.cache.labels || []);
            manager.setStatus(_engine.cache.status);
            manager.updateList(_engine.cache.torrents || []);
            get_torrent_list();
            return 1;
        },
        updateList: write_torrent_list,
        deleteItem: delete_from_table,
        setStatus: set_status,
        setLabels: set_labels,
        setLabel: function (a) {
            tr_table_controller.filter(a.k, a.v);
            tables['label-select'].selectBox('value', a.k);
        },
        setSpeedLimit: set_speed_limit,
        setFileList: torrent_file_list.setFL
    };
}();
$(function () {
    manager.begin();
});