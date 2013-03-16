var manager = function () {
    var _engine = (chrome.extension.getBackgroundPage()).engine;
    var settings = null;
    var tables = null;
    var chk_settings = function () {
        if (settings == null || 
            settings['login'] == null ||
            settings['password'] == null) {
            return 0;
        }
        return 1;
    }
    tmp_vars = {
        'sel_label' : {'k':'all','v':null},
        'new_tr_count' : 0,
    }
    var write_language = function() {
        function ui_url()
        {
            return ((localStorage.ssl !== undefined && localStorage.ssl) ? 'https':'http')+"://"+
                    localStorage.login+":"+localStorage.password+"@"+
                    localStorage.ut_ip+":"+localStorage.ut_port+"/"+localStorage.ut_path;
        }
        tables['menu'].find('a.refresh').attr('title',lang_arr[24]);
        tables['menu'].find('a.donate').attr('title',lang_arr[25]);
        tables['menu'].find('a.wui').attr('title',lang_arr[26]);
        tables['menu'].find('a.start_all').attr('title',lang_arr[68]);
        tables['menu'].find('a.pause_all').attr('title',lang_arr[67]);
        tables['menu'].find('a.wui').attr('href',ui_url());
        $('th.select').attr('title',lang_arr[91][0]);
        $('#file-list').find('th.name').attr('title',lang_arr[88][1]).html(lang_arr[88][0]);
        $('#file-list').find('th.size').attr('title',lang_arr[14][1]).html(lang_arr[14][0]);
        $('#file-list').find('th.download').attr('title',lang_arr[79][1]).html(lang_arr[79][0]);
        $('#file-list').find('th.progress').attr('title',lang_arr[15][1]).html(lang_arr[15][0]);
        $('#file-list').find('th.priority').attr('title',lang_arr[89][1]).html(lang_arr[89][0]);
        tables['fl-bottom'].children('a.update').attr('title',lang_arr[91][1]);
        tables['fl-bottom'].children('a.close').attr('title',lang_arr[91][2]);
        tables['fl-head'].clone().appendTo(tables['fl-fixed']);
    }
    var torrent_list_head = function () {
        var colums = _engine.getColums();
        $('.torrent-style').remove();
        var style = '<style class="torrent-style">';
        var thead = '<tr>';
        var sum_width = 0;
        $.each(colums, function(key, value) {
            if (value.a) {
                thead += '<th class="'+key+'" title="'+lang_arr[value.lang][1]+'"><div>'+lang_arr[value.lang][0]+'</div></th>';
                style += 'th.'+key+', td.'+key+' {max-width:'+value.size+'px; min-width:'+value.size+'px}';
                sum_width += value.size;
            }
        });
        thead += '</tr>';
        style += '</style>';
        tables['tr-head'].html(thead);
        tables['tr-fixed_head'].html(thead);
        tables['body'].children('style.torrent-style').remove();
        tables['body'].append(style);
        if (sum_width < 800) {
            tables.body.css('width',(sum_width+59)+'px');
        } else {
            tables.body.css('width','800px');
        }
        torrent_list_order();
    }
    var torrent_list_order = function () {
        tables['table-main'].tablesorter({
            textExtraction: function (node) {
                if ($(node).data('value'))
                    return $(node).data('value');
                return $(node).html();
            },
            sortList: (localStorage.tr_order !== undefined) ? JSON.parse(localStorage.tr_order) : [[1,1]],
            autosorter: true,
            onsort: function (s) {
                localStorage.tr_order = JSON.stringify(s);
            },
            selectorHeaders : '.torrent-table-head thead th'
        });
    }
    var timer = function () {
        var status = 0;
        var tmr = null;
        var interval = settings.mgr_update_interval;
        var start = function () {
            if (status) return 0;
            status = 1;
            tmr = setInterval(function () {
                get_torrent_list();
            }, interval);
            return 1;
        }
        var stop = function () {
            if (status) {
                clearInterval(tmr);
                status = 0;
            }
            return 1;
        }
        return {
            start : function () {
                return start();
            },
            stop : function () {
                return stop();
            },
            status : function () {
                return status;
            },
        }
    };
    var get_torrent_list = function () {
        timer.stop();
        _engine.getTorrentList();
    }
    /*
            ,arr[i][0] /* •˜
            ,arr[i][1] /* STATUS CODE
            ,arr[i][2] /* ˆŒŸ
            ,arr[i][3] /* €‡Œ…
            ,arr[i][4] /* Ž–…’ ‚›Ž‹…ˆŸ
            ,arr[i][5]/*  çàãðóæåíî
            ,arr[i][6]/*  Ž‡„€Ž
            ,arr[i][7]/*  ŠŽ””ˆ–ˆ…’
            ,arr[i][8] /* ‘ŠŽŽ‘’œ €‡„€—ˆ
            ,arr[i][9] /* ‘ŠŽŽ‘’œ ‡€ƒ“‡Šˆ
            ,arr[i][10] /*ETA
            ,arr[i][11] /*Œ…’Š€ 
            ,arr[i][12] /*Ž„Š‹ž—…Ž ˆŽ‚
            ,arr[i][13] /*ˆ› ‚ Ž…
            ,arr[i][14] /*Ž„Š‹ž—…Ž ‘ˆ„Ž‚
            ,arr[i][15] /*‘ˆ„› ‚ Ž… 
            ,arr[i][16]/* „Ž‘’“Ž‘’œ
            ,arr[i][17] /*ŽŸ„ŽŠ Ž—……„ˆ ’Ž…’Ž‚ 
            ,arr[i][18]/* îòäàíî
            ,arr[i][19]/* ?
            ,arr[i][20]/* ? 
            ,arr[i][21] /*ñòàòóñ òåñêñòîì
            ,arr[i][23]/* âðåìß ñòàðòà
            ,arr[i][24]/* âðåìß çàâåðøåíèß
            ,arr[i][22]/* sid
            ,arr[i][26]/* path_to_file
     */
    var write_torrent_list = function (arr,update) {
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
            tmp_vars.new_tr_count = 0;
        }
        tr_table_controller.filter();
        tables['dl-speed'].text(bytesToSizeInSec(sum_dl,'-'));
        tables['up-speed'].text(bytesToSizeInSec(sum_up,'-'));
        if (settings.graph)
            graph.move(sum_dl,sum_up,0);
        timer.start();
    }
    var update_item = function (modifed_arr,v) {
        var c = modifed_arr.length;
        for (var n = 0; n < c; n++)
            switching(modifed_arr[n]);
        function switching(key)
        {
            var item = null;
            var upd_list = {};
            switch (key) {
                case 11:
                    if (!item) item = $('#'+v[0]);
                    item.attr('data-label',v[11]);
                    break;
                case 22:
                    if (!item) item = $('#'+v[0]);
                    item.attr('data-sid',v[22]);
                    break;
                case 26:
                    if (!item) item = $('#'+v[0]);
                    item.attr('data-path',v[26]);
                    break;
                case 2:
                    if (!item) item = $('#'+v[0]);
                    item.childen('td.name').children('div').attr('title',v[2]).children('span').text(v[2]);
                    break;
                case 3:
                    if (!item) item = $('#'+v[0]);
                    var t_s = bytesToSize(v[3]);
                    item.children('td.size').attr('data-value',v[3]).children('div').attr('title',t_s).html(t_s);
                    break;
                case 4:
                case 1:
                    if ('4.1' in upd_list == false) upd_list['2.1'] = 1; else break;
                    if (!item) item = $('#'+v[0]);
                    var progress = v[4]/10;
                    var with_c = item.children('td.progress').attr('data-value',v[4]).children('div.progress_b').children('div.progress_b_i');
                    with_c.css('width',writePersent(progress)+'px').children('div').html(progress+'%');
                    if (v[1]==201&&v[4]==1000)
                    {
                        with_c.css('background-color','#41B541'); 
                    } else {
                        with_c.css('background-color','#3687ED');
                    }
                    break;
                case 21:
                case 1:
                    if ('21.1' in upd_list == false) upd_list['21.1'] = 1; else break;
                    if (!item) item = $('#'+v[0]);
                    item.children('td.status').attr('data-value',v[1]).children('div').attr('title',v[21]).html(v[21]);
                    break;
                case 9:
                    if (!item) item = $('#'+v[0]);
                    item.children('td.down_speed').attr('data-value',v[9]).children('div').html(bytesToSizeInSec(v[9],''));
                    break;
                case 8:
                    if (!item) item = $('#'+v[0]);
                    item.children('td.uplo_speed').attr('data-value',v[8]).children('div').html(bytesToSizeInSec(v[8],''));
                    break;
                case 14:
                case 12:
                    if ('14.12' in upd_list == false) upd_list['14.12'] = 1; else break;
                    if (!item) item = $('#'+v[0]);
                    item.children('td.seeds_peers').children('div').html(v[14]+'/'+v[12]);
                    break;
                case 9:
                    if (!item) item = $('#'+v[0]);
                    var val = v[9];
                    if (val<0) val = '*';
                    item.children('td.position').children('div').html(val);
                    break;
                case 9:
                case 3:
                    if ('9.3' in upd_list == false) upd_list['9.3'] = 1; else break;
                    if (!item) item = $('#'+v[0]);
                    var val = v[3]-v[9];
                    if (val < 0) val = 0;
                    item.children('td.ostalos').attr('data-value',val).children('div').html(bytesToSize(val,0));
                    break;
                case 15:
                    if (!item) item = $('#'+v[0]);
                    item.children('td.seeds').children('div').html(v[15]);
                    break;
                case 13:
                    if (!item) item = $('#'+v[0]);
                    item.children('td.peers').children('div').html(v[13]);
                    break;
                case 10:
                    if (!item) item = $('#'+v[0]);
                    var s_time = unixintime(v[10]);
                    item.children('td.time').attr('data-value',v[10]).children('div').attr('title',s_time).html(s_time);
                    break;
                case 6:
                    if (!item) item = $('#'+v[0]);
                    item.children('td.otdano').attr('data-value',v[6]).children('div').html(bytesToSize(v[6],0));
                    break;
                case 5:
                    if (!item) item = $('#'+v[0]);
                    item.children('td.poluchino').attr('data-value',v[5]).children('div').html(bytesToSize(v[5],0));
                    break;
                case 7:
                    if (!item) item = $('#'+v[0]);
                    var val = v[7]/1000;
                    item.children('td.koeficient').attr('data-value',v[7]).children('div').html(val);
                    break;
                case 16:
                    if (!item) item = $('#'+v[0]);
                    var val = Math.round((v[16]/65535)*1000)/1000;
                    item.children('td.dostupno').attr('data-value',v[16]).children('div').html(val);
                    break;
                case 11:
                    if (!item) item = $('#'+v[0]);
                    item.children('td.metka').children('div').attr('title',v[11]).html(v[11]);
                    break;
                case 23:
                    if (!item) item = $('#'+v[0]);
                    var str_time = writeTimeFromShtamp(v[23]);
                    item.children('td.time_dobavleno').children('div').attr('title',str_time).html(str_time);
                    break;
                case 24:
                    if (!item) item = $('#'+v[0]);
                    var str_time = writeTimeFromShtamp(v[24]);
                    item.children('td.time_zavircheno').children('div').attr('title',str_time).html(str_time);
                    break;
            }
        }
    }
    var create_item = function (v) {
        var colums = _engine.getColums();
        var item = '<tr id="'+v[0]+'" data-label="'+v[11]+'" data-sid="'+v[22]+'" data-path="'+v[26]+'">';
        $.each(colums, function(key, value) {
            if (value.a) {
                item += switching(key);
            }
        });
        item += '</tr>';
        tables['tr-body'].prepend(item);
        function switching(key)
        {
            switch (key) {
                case 'name':
                    return '<td class="'+key+'"><div title="'+v[2]+'"><span>'+v[2]+'</span></div></td>';
                    break;
                case 'size':
                    return '<td class="'+key+'" data-value="'+v[3]+'"><div title="'+bytesToSize(v[3])+'">'+bytesToSize(v[3])+'</div></td>';
                    break;
                case 'progress':
                    var progress = v[4]/10;
                    var color = (v[1]==201&&v[4]==1000)?'#41B541':'#3687ED';
                    return '<td class="'+key+'" data-value="'+v[4]+'"><div class="progress_b"><div class="progress_b_i" style="width: '+writePersent(progress)+'px; background-color: '+color+';"><div>'+progress+'%</div></div></div></td>';
                    break;
                case 'status':
                    return '<td class="'+key+'" data-value="'+v[1]+'"><div title="'+v[21]+'">'+v[21]+'</div></td>';
                    break;
                case 'down_speed':
                    return '<td class="'+key+'" data-value="'+v[9]+'"><div>'+bytesToSizeInSec(v[9],'')+'</div></td>';
                    break;
                case 'uplo_speed':
                    return '<td class="'+key+'" data-value="'+v[8]+'"><div>'+bytesToSizeInSec(v[8],'')+'</div></td>';
                    break;
                case 'seeds_peers':
                    return '<td class="'+key+'"><div>'+v[14]+'/'+v[12]+'</div></td>';
                    break;
                case 'position':
                    var val = v[9];
                    if (val<0) val = '*';
                    return '<td class="'+key+'"><div>'+val+'</div></td>';
                    break;
                case 'ostalos':
                    var val = v[3]-v[9];
                    if (val < 0) val = 0;
                    return '<td class="'+key+'" data-value="'+val+'"><div>'+(bytesToSize(val,0))+'</div></td>';
                    break;
                case 'seeds':
                    return '<td class="'+key+'"><div>'+(v[15])+'</div></td>';
                    break;
                case 'peers':
                    return '<td class="'+key+'"><div>'+(v[13])+'</div></td>';
                    break;
                case 'time':
                    var s_time = unixintime(v[10]);
                    return '<td class="'+key+'" data-value="'+v[10]+'"><div title="'+s_time+'">'+s_time+'</div></td>'
                    break;
                case 'otdano':
                    return '<td class="'+key+'" data-value="'+v[6]+'"><div>'+(bytesToSize(v[6],0))+'</div></td>';
                    break;
                case 'poluchino':
                    return '<td class="'+key+'" data-value="'+v[5]+'"><div>'+(bytesToSize(v[5],0))+'</div></td>';
                    break;
                case 'koeficient':
                    var val = v[7]/1000;
                    return '<td class="'+key+'" data-value="'+v[7]+'"><div>'+val+'</div></td>';
                    break;
                case 'dostupno':
                    var val = Math.round((v[16]/65535)*1000)/1000;
                    return '<td class="'+key+'" data-value="'+v[16]+'"><div>'+val+'</div></td>';
                    break;
                case 'metka':
                    return '<td class="'+key+'"><div title="'+v[11]+'">'+v[11]+'</div></td>';
                    break;
                case 'time_dobavleno':
                    var str_time = writeTimeFromShtamp(v[23]);
                    return '<td class="'+key+'" data-value="'+v[23]+'"><div title="'+str_time+'">'+str_time+'</div></td>';
                    break;
                case 'time_zavircheno':
                    var str_time = writeTimeFromShtamp(v[24]);
                    return '<td class="'+key+'" data-value="'+v[24]+'"><div title="'+str_time+'">'+str_time+'</div></td>';
                    break;
                case 'controls':
                    return '<td class="'+key+'"><div class="btns"><div title="'+lang_arr[0]+'" class="start"></div><div class="pause" title="'+lang_arr[1]+'"></div><div class="stop" title="'+lang_arr[2]+'"></div></div></td>';
                    break;
            }
            return '';
        }
    }
    var tr_table_controller = function () {
        var cached = {}
        var clear = function () {
            tables['tr-body'].empty();
            cached = {};
        }
        var add = function (v) {
            var id = v[0];
            if (id in cached) {
                var tr = cached[id]['api'];
                var c = v.length;
                var modifed_arr = [];
                for ( var n = 0; n < c; n++) {
                    if (tr[n] != v[n]) {
                        modifed_arr[modifed_arr.length] = n;
                        cached[id]['api'][n] = v[n];
                    }
                }
                update_item(modifed_arr,v);
            } else {
                cached[id] = {
                    'api' : null,
                    'gui' : {
                        'display' : 1
                    }
                }
                cached[id]['api'] = v
                create_item(v);
                tmp_vars.new_tr_count++;
            }
        }
        var filter = function (a,b) {
            if (a) {
                tmp_vars.sel_label = {'k':a,'v':b};
            }
            $.each(cached, function (id,val) {
                sorting_torrent_list(id,val.gui.display,val.api);
                settings_filtering(id,val.gui.display,val.api);
            });
        }
        var hide = function (id) {
            if (cached[id]['gui']['display']) {
                cached[id]['gui']['display'] = 0;
                $('#'+id).css('display','none');
            }
        }
        var show = function (id) {
            if (!cached[id]['gui']['display']) {
                cached[id]['gui']['display'] = 1;
                $('#'+id).css('display','table-row');
            }
        }
        var get = function (id) {
            if (id in cached)
                return cached[id]['api'];
            else
                return null;
        }
        var del = function (id) {
            if (id in cached)
                delete cached[id]
            $('#'+id).remove();
        }
        return {
            add : function (t) {
                add(t);
            },
            get : function (t) {
                get(t);
            },
            del : function (t) {
                del(t);
            },
            show : function (t) {
                show(t);
            },
            hide : function (t) {
                hide(t);
            },
            clear : function () {
                clear();
            },
            filter : function (a,b) {
                filter(a,b);
            }
        }
    }()
    var settings_filtering = function (id,display,v) {
        if ((settings.hide_seeding&&v[4]==1000&&v[1]==201)||
                (settings.hide_finished&&v[4]==1000&&v[1]==136)) {
            if (display)
                tr_table_controller.hide(id);
        }
    }
    var sorting_torrent_list = function (id,display,param) {
        if (isNumber(tmp_vars.sel_label.k) == false) {
            switch (tmp_vars.sel_label.k) {
                case ('all'):
                    if (!display) {
                        tr_table_controller.show(id);
                    }
                    break;
                case ('download'):
                    if (param[4]!=1000) {
                        tr_table_controller.show(id);
                    } else
                    if (display) {
                        tr_table_controller.hide(id);
                    }
                    break;
                case ('active'):
                    if (param[9]!=0 || param[8]!=0) {
                        tr_table_controller.show(id);
                    } else 
                    if (display) {
                        tr_table_controller.hide(id);
                    }
                    break;
                case ('inacive'):
                    if (param[9]==0||param[8]==0) {
                        tr_table_controller.show(id);
                    } else 
                    if (display) {
                        tr_table_controller.hide(id);
                    }
                    break;
                case ('complite'):
                    if (param[4]==1000) {
                        tr_table_controller.show(id);
                    } else 
                    if (display) {
                        tr_table_controller.hide(id);
                    }
                    break;
                case ('seeding'):
                    if (param[1]==201&&param[4]==1000) {
                        tr_table_controller.show(id);
                    } else 
                    if (display) {
                        tr_table_controller.hide(id);
                    }
                    break;
                case ('no label'):
                    if (param[11].length == 0) {
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
            if (tmp_vars.sel_label.v == param[11]) {
                if (!display) {
                    tr_table_controller.show(id);
                }
            } else {
                if (display) {
                    tr_table_controller.hide(id);
                }
            }
        }
    }
    var delete_from_table = function (arr) {
        var c = arr.length;
        for ( var n = 0; n < c; n++ ) {
            tr_table_controller.del(arr[n]);
        }
    }
    var set_status = function (a,b) {
        tables.status.text(b);
    }
    var set_labels = function (arr) {
        var c = arr.length;
        var costum = ['all','download','seeding','complite','active','inacive','no label'];
        var cc = costum.length;
        var options = '';
        for ( var n = 0; n < cc; n++ ) {
            options += '<option value="'+costum[n]+'"'+( ( isNumber(tmp_vars.sel_label.k) == false && tmp_vars.sel_label.k == costum[n])?' selected':'' )+'>'+lang_arr[70][n]+'</option>'
        }
        for ( var n = 0; n < c; n++ ) {
            options += '<option value="'+arr[n][1]+'"'+( ( isNumber(tmp_vars.sel_label.k) && tmp_vars.sel_label.k == arr[n][1])?' selected':'' )+'>'+arr[n][0]+'</option>'
        }
        tables['label-select'].selectBox('options',options);
    }
    //==================
    function isNumber(n) {
        return !isNaN(parseFloat(n)) && isFinite(n);
    }
    var bytesToSize = function (bytes,nan) {
        //ïåðåâîäèò áàéòû â ñòðî÷êè
        var sizes = lang_arr[59];
        if (nan==null) nan = 'n/a';
        if (bytes == 0) return nan;
        var i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
        if (i == 0) {
            return (bytes / Math.pow(1024, i)) + ' ' + sizes[i];
        }
        return (bytes / Math.pow(1024, i)).toFixed(1) + ' ' + sizes[i];
    }
    var writePersent = function (i)
    {
        //âûïèñûâàåò ïðîöåíòû äëß ïðîãðåññ áàðîâ
        var full = 68;
        return Math.round(full/100*i);
    }
    var bytesToSizeInSec = function (bytes,nan) {
        //ïåðåâîäèò áàéòû â ñòðî÷êè\ñåê
        var sizes = lang_arr[60];
        if (bytes == 0) return nan;
        var i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
        if (i == 0) {
            return (bytes / Math.pow(1024, i)) + ' ' + sizes[i];
        }
        return (bytes / Math.pow(1024, i)).toFixed(1) + ' ' + sizes[i];
    }
    var unixintime = function (i)
    {
        //âûïèñûâàåò îòñ÷åò âðåìåíè èç unixtime
        if (i<0) return '&#8734;';
        var day = Math.floor(i/60/60/24);
        var week = Math.floor(day/7);
        var hour = Math.floor((i - day*60*60*24)/60/60);
        var minutes = Math.floor((i - day*60*60*24 - hour*60*60)/60);
        var seconds = Math.floor((i - day*60*60*24 - hour*60*60 - minutes*60));
        day = Math.floor(i/60/60/24 - 7*week);
        if (week>10) return '&#8734;';
        if (week>0)
            return week +lang_arr[61][0]+' '+ day+lang_arr[61][1];
        if (day>0)
            return day+lang_arr[61][1]+' '+hour+lang_arr[61][2];
        if (hour>0)
            return hour+lang_arr[61][2]+' '+minutes+lang_arr[61][3];
        if (minutes>0)
            return minutes+lang_arr[61][3]+' '+seconds+lang_arr[61][4];
        if (seconds>0)
            return seconds+lang_arr[61][4];
        return '&#8734;';
    }
    var writeTimeFromShtamp = function (shtamp)
    {
        //ïðåâðßùàåò TimeShtamp â ñòðî÷êó
        var dt = new Date(shtamp * 1000);
        var m = dt.getMonth()+1;
        if (m.toString().length==1)
            m = '0'+m.toString();
        var d = dt.getDate();
        if (d.toString().length==1)
            d = '0'+d.toString();
        var h = dt.getHours();
        if (h.toString().length==1)
            h = '0'+h.toString();
        var mi = dt.getMinutes();
        if (mi.toString().length==1)
            mi = '0'+mi.toString();
        var sec = dt.getSeconds();
        if (sec.toString().length==1)
            sec = '0'+sec.toString();
        var t = dt.getFullYear()+'-'+m+'-'+d+' '+h+':'+mi+':'+sec;
        return t;
    }
    //=================
    return {
        begin : function () {
            settings = _engine.getSettings();
            if (!chk_settings()) {
                window.location = "options.html";
                return 0;
            }
            _engine.setWindow();
            timer = timer();
            tables = {
                'body' : $('body'),
                'menu' : $('ul.menu'),
                'dl-speed' : $('.status-panel td.speed.download'),
                'up-speed' : $('.status-panel td.speed.upload'),
                'status' : $('.status-panel td.status'),
                'label-select' : $('ul.menu li.select select'),
                'table-body' : $('.torrent-list-layer'),
                'table-main' : $('.torrent-table-body'),
                'table-fixed' : $('.torrent-table-head'),
                'tr-body' : $('.torrent-table-body').children('tbody'),
                'tr-head' : $('.torrent-table-body').children('thead'),
                'tr-fixed_head' : $('.torrent-table-head').children('thead'),
                'fl-body' : $('#file-list').children('table').eq(1).children('tbody'),
                'fl-head' : $('#file-list').children('table').eq(1).children('thead'),
                'fl-fixed' : $('#file-list').children('table').eq(0),
                'fl-bottom' : $('div.file-list-layer > div.bottom-menu'),
            }
            torrent_list_head();
            tables['label-select'].selectBox().change( function() {
                var val = $(this).val();
                var item = null;
                if (isNumber(val)) {
                    var item = tables['label-select'].find('option[value="'+$(this).val()+'"]').text();
                }
                tr_table_controller.filter(val,item);
            } );
            tables['table-body'].on('scroll',function () {
                tables['table-fixed'].css('left',-($(this).scrollLeft()));
            });
            
            
            
            if (settings.graph) {
                $('li.graph').append('<canvas id="graph"></canvas>');
                graph.init(settings.mgr_update_interval/1000);
            }
            write_language();
            _engine.getLabels();
            _engine.getStatus();
            if (!_engine.get_cache_torrent_list()) {
                get_torrent_list();
            }
            return 1;
        },
        updateList : function (a,b) {
            write_torrent_list(a,b);
        },
        deleteItem : function (a) {
            delete_from_table(a);
        },
        setStatus : function (a,b) {
            set_status(a,b);
        },
        setLabels : function (a) {
            set_labels(a);
        }
    }
}();
$(function () {
    if (!manager.begin())
        return 0;
});
create_time = (new Date()).getTime();