var header = '';
var fixedHeader = '';
var fixedFlTab = '';
var table_colums = {};
var cols = [];
var col_lang = [];
var monitor_height = (localStorage.monitor_height !== undefined) ? localStorage.monitor_height : 350;
var manager = function () {
    if (localStorage["last_label"] === undefined) localStorage["last_label"] = '*{[all]}*';
    var encoding_pwd = (localStorage.encoding !== undefined) ? localStorage.encoding : 0;
    var pos_res = monitor_height-24-24;
    var sel_tr = '';
    var sel_tr_hash = '';
    var sel_file_id = '';
    var sel_hash_file = '';
    var file_list_url = '';
    var sel_en = [];
    var hide_finished = (localStorage.hide_finished==1) ? 1 : 0;
    var hide_seeding = (localStorage.hide_seeding==1) ? 1 : 0;
    var manager_interval = (localStorage.utorrent_manager_interval !== undefined) ? localStorage.utorrent_manager_interval*1000 : 3000;
    if (manager_interval<1000) manager_interval = 1000;
    var fl_auto_update = (localStorage.fl_auto_update !== undefined) ? localStorage.fl_auto_update : 1;
    var graph_enable = 0;
    var new_torr = 0;
    var cache_status = '';
    var speedmenu_type = '';
    var down_limit = -1;
    var upl_limit = -1;
    var scroll_fps = {
        timer_status: false,
        timer:null
    };
    var var_arr = {
        oldfl:''
    };
    var list_upd_matrix = {};
    var list_fl_upd_matrix = {};
    var autosort = (localStorage.autosort !== undefined) ? localStorage.autosort : 0;
    var run_graph = function ()
    {		
        graph_enable = (localStorage["graph_enable"] !== undefined) ? localStorage["graph_enable"] : 1;
        if (graph_enable==1)
            graph.init(manager_interval/1000);
        else
            $('div.conv_cont').remove();
    }
    var writeList = function ()
    {
        //пишет лист торрентов с нуля
        var createSpeedLimitContextMenu = function ()
        {
            //создает контекстное меню для ограничения скорости
            var actionSetSpeed = function (speed)
            {
                //послывает действие ограничения скорости
                var bg = chrome.extension.getBackgroundPage();
                if (speedmenu_type=='d')
                {
                    down_limit = speed;
                    bg.engine.actionSend(null,'setsetting&s=max_dl_rate&v='+speed,false);
                } else {
                    upl_limit = speed;
                    bg.engine.actionSend(null,'setsetting&s=max_ul_rate&v='+speed,false);
                }
                bg.engine.setLimites(down_limit,upl_limit);
            }
            var SpeedContextMenu = function ()
            {
                //выстраивает внутренности контекстного меню для ограничения скорости
                var speed_items = {};
                speed_items["sl0"+'_0']={
                    name:lang_arr[69],	
                    callback:function (){
                        actionSetSpeed(0);
                    }, 
                    className: 'zero'
                };
                speed_items["sep"+'_1']='---------';
                var count = Math.round(monitor_height / 27);
                if (count>10) count = 10;
                for (var i=0;i<count;i++)
                {
                    speed_items["sl"+i]={
                        name: '-', 
                        callback: function (name){
                            actionSetSpeed($('li.context-menu-item.speed').eq(name.replace('sl','')).children('span').attr('speed'));
                        }, 
                        className: 'speed'
                    };
                }
                return speed_items;
            }
            $.contextMenu( 'destroy', {
                selector: 'table.bottom-panel > tbody > tr > td[class!=a]'
            } );
            $.contextMenu({
                className: 'speed_ctx',
                selector: 'table.bottom-panel > tbody > tr > td[class!=a]',
                events: {
                    show: function (opt){
                        UpdateSpeed($(this),null);
                    }
                },
                items: SpeedContextMenu()
            });
        }
        $('#tr_list_list thead tr').children('th').unbind();
        $("#tr_list_list").unbind().children('tbody').empty();
        $('ul.context-menu-list.ctx').remove();
        bindFixHead();
        bindFileFixHead();
        headFixPanel();
        createSpeedLimitContextMenu();
        mTimer.stop();
        var bg = chrome.extension.getBackgroundPage();
        var arr = bg.engine.getArr();
        var full_d = full_u = 0;
        var selector_val = localStorage["last_label"];
        $.each(arr, function(key, value) {
            var param = value;
            full_d += param[6];
            full_u += param[7];
            if (!((hide_seeding&&param[1]==1000&&param[5]==201)||(hide_finished&&param[1]==1000&&param[5]==136)))
                swithTr(param,selector_val,1);
        });
        //writeStatus();
        bg.engine.setDOM();
        updownspeed(full_u,full_d);
        labels_arr();
        mTimer.start();
        if (new_torr==0) {
            return;
        }
        new_torr = 0;
        addSorter();
    }
    var selectLabel = function (obj)
    {
        //переписывает лист торрентов при выборе фильтра
        var bg = chrome.extension.getBackgroundPage();
        var arr = bg.engine.getArr();
        $("#tr_list_list").children('tbody').empty();
        var full_d = full_u = 0;
        var selector_val = (typeof obj == "string") ? localStorage["last_label"] : (obj!=null) ? $(obj).val() : '*{[all]}*';
        localStorage["last_label"] = selector_val;
        var with_a = $('#label_select');
        with_a.children('option.sub_select').removeAttr('selected');
        with_a.children('option.sub_select[value="'+selector_val+'"]').attr('selected','selected');
        $.each(arr, function(key, value) {
            full_d += value[6];
            full_u += value[7];
            if (!((hide_seeding&&value[1]==1000&&value[5]==201)||(hide_finished&&value[1]==1000&&value[5]==136)))
                swithTr(value,selector_val,1);
        });
        updownspeed(full_u,full_d);
        icoinselector(selector_val);
        if (new_torr == 0) return;
        new_torr = 0;
        if (addSorter()==false)
        {
            $("#tr_list_list").trigger("update");
            this.setTimeout(function () {
                $("#tr_list_list").trigger("sorton",[null]);
            },1);
        }
    }
    var selectTree = function (obj)
    {
        //переписывает дерево каталогов при выборе фильтра
        $('#fl_list_list tbody tr').css('display','none');
        $('#fl_list_list tbody tr.'+$(obj).val().replace(/ /gi,'.')).css('display','table-row');
        $('th.chk_box').find(':checked').removeAttr('checked');
    }
    var icoinselector = function (selector_val)
    {
        //добавляет иконку в выбранный фильтор
        if (selector_val==null)
        {
            selector_val = localStorage["last_label"];
        }
        var def = ['*{[all]}*','*{[down]}*','*{[uplo]}*','*{[comp]}*','*{[acti]}*','*{[inac]}*'];
        var imgs = ['c_all.png','c_down.png','c_uplo.png','c_uplo.png','c_active.png','c_iact.png'];
        for (var i=0;i<def.length;i++)
            if (selector_val == def[i])
            {
                $('a.selectBox.label_select span.selectBox-label').html('<div class="cat_img" style="background: url(\'images/'+imgs[i]+'\') no-repeat;"></div>'+lang_arr[70][i]);
            }
    }
    var addSorter = function () {
        if ($('ul.context-menu-list.ctx').length==0)
        {
            $('#tr_list_list thead tr').children('th').unbind();
            $("#tr_list_list").tablesorter({
                textExtraction: myTextExtraction,
                widgets: ['zebra'],
                sortList: (localStorage.MainListSort !== undefined) ? JSON.parse(localStorage.MainListSort) : [[3,1], [2,0]],
                autosorter: autosort,
                onheadclick: function () {
                    rewriteFixHead();
                },
                onsort: function (s) {
                    localStorage.MainListSort = JSON.stringify(s);
                }
            });
            createContextMenu();
            return true;
        } else
            return false;
    }
    var updateList = function (arr)
    {
        //обновляет список торрентов
        //var d0 = new Date();
        var full_d = full_u = 0; 
        var selector_val = localStorage["last_label"];
        var rm_obj = null;
        $.each(arr, function(key, value) {
            full_d += value[6];
            full_u += value[7];
            rm_obj = $('#'+value[4]);
            if (hide_finished&&value[1]==1000&&value[5]==136)
            {
                rm_obj.remove();
            } else 
            if (hide_seeding&&value[1]==1000&&value[5]==201)
            {
                rm_obj.remove();
            } else
                swithTr(value,selector_val,0);
        });
        updownspeed(full_u,full_d);
        if (new_torr == 0) {
            if (autosort==1)
                $("#tr_list_list").trigger("update");
            return;
        }
        new_torr = 0;
        if (addSorter() == false)
            $("#tr_list_list").trigger("update");
    //$('.bottom-panel tbody tr').children('td.d').html(new Date() - d0);
    }
    var swithTr = function (param,selector_val,t)
    {
        //сортирует пришедший список торрентов по категориям
        switch (selector_val) {
            case (param[11]):
                if (t) addTorrent(param[4],param); else updTorrent(param[4],param);
                break;
            case ('*{[all]}*'):
                if (t) addTorrent(param[4],param); else updTorrent(param[4],param);
                break;
            case ('*{[down]}*'):
                if (param[1]!=1000) {
                    if (t) addTorrent(param[4],param); else updTorrent(param[4],param);
                } else $('#'+param[4]).remove();
                break;
            case ('*{[acti]}*'):
                if (param[6]!=0||param[7]!=0) {
                    if (t) addTorrent(param[4],param); else updTorrent(param[4],param);
                } else $('#'+param[4]).remove();
                break;
            case ('*{[inac]}*'):
                if (param[6]==0||param[7]==0) {
                    if (t) addTorrent(param[4],param); else updTorrent(param[4],param);
                } else $('#'+param[4]).remove();
                break;
            case ('*{[comp]}*'):
                if (param[1]==1000) {
                    if (t) addTorrent(param[4],param); else updTorrent(param[4],param);
                } else $('#'+param[4]).remove();
                break;
            case ('*{[uplo]}*'):
                if (param[5]==201&&param[1]==1000) {
                    if (t) addTorrent(param[4],param); else updTorrent(param[4],param);
                } else $('#'+param[4]).remove();
                break;
            default:
                $('#'+param[4]).remove();
        }
    }
    var writeTimeFromShtamp = function (shtamp)
    {
        //преврящает TimeShtamp в строчку
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
    var write_list_upd_mtrx = function (id,param)
    {
        /*  'label':param[11],
			'sid':param[22],
			'path':param[23],
			't_name':param[3],
			't_size':param[0],
			't_dune':param[1],
			't_status':param[5],
			't_eta':param[10],
			't_down_speed':param[6],
			't_uplo_speed':param[7],
			't_seeds_peers':param[8]+'/'+param[9],
			't_position':param[2],
			't_ostalos':param[0]-param[16],
			't_seeds':param[13],
			't_peers':param[14],
			't_otdano':param[18],
			't_poluchino':param[16],
			't_koeficient':param[17],
			't_dostupno':param[19],
			't_metka':param[11],
			't_time_dobavleno':param[20],
			't_time_zavircheno':param[21] */
        list_upd_matrix[id] = 
        {
            'n0':param[0],
            'n1':param[1],
            'n2':param[2],
            'n3':param[3],
            'n5':param[5],
            'n6':param[6],
            'n7':param[7],
            'n10':param[10],
            'n11':param[11],
            'n12':param[12],
            'n13':param[13],
            'n14':param[14],
            'n16':param[16],
            'n17':param[17],
            'n18':param[18],
            'n19':param[19],
            'n20':param[20],
            'n21':param[21],
            'n22':param[22],
            'n23':param[23],
            't_seeds_peers':param[8]+'/'+param[9],
            't_ostalos':param[0]-param[16]
        };	
    }
    var addTorrent = function (id,param)
    {
        //добавляет новую строчку в торрент лист
        new_torr++;
        write_list_upd_mtrx(id,param);
        var colum_body = '<tr class="tr" id="'+id+'" data-sid="'+param[22]+'" data-label="'+param[11]+'" data-path="'+param[23]+'">';
        function AddSwith(type,param)
        {
            switch (type) {
                case ('t_name'):
                    return '<td class="t_name"><div title="'+param[3]+'">'+param[3]+'</div></td>';
                    break;
                case ('t_size'):
                    return '<td class="t_size" data-value="'+param[0]+'"><div title="'+bytesToSize(param[0])+'">'+bytesToSize(param[0])+'</div></td>';
                    break;
                case ('t_dune'):
                    var progress = param[1]/10;
                    return '<td class="t_dune" data-value="'+param[1]+'"><div class="np"><div class="progress_b"><div class="progress_b_i" style="width: '+writePersent(progress)+'px;"><div>'+progress+'%</div></div></div></div></td>';
                    break;
                case ('t_status'):
                    return '<td class="t_status" data-value="'+param[5]+'"><div title="'+param[2]+'">'+param[2]+'</div></td>';
                    break;
                case ('t_eta'):
                    return '<td class="t_eta" data-value="'+param[10]+'"><div title="'+unixintime(param[10])+'">'+unixintime(param[10])+'</div></td>'
                    break;
                case ('t_down_speed'):
                    return '<td class="t_down_speed" data-value="'+param[6]+'"><div>'+bytesToSizeInSec(param[6],'')+'</div></td>';
                    break;
                case ('t_uplo_speed'):
                    return '<td class="t_uplo_speed" data-value="'+param[7]+'"><div>'+bytesToSizeInSec(param[7],'')+'</div></td>';
                    break;
                case ('t_seeds_peers'):
                    return '<td class="t_seeds_peers"><div>'+param[8]+'/'+param[9]+'</div></td>';
                    break;
                case ('t_position'):
                    var val = param[12];
                    if (val<0) val = '*';
                    return '<td class="t_position"><div>'+val+'</div></td>';
                    break;
                case ('t_ostalos'):
                    var val = param[0]-param[16];
                    if (val < 0) val = 0;
                    return '<td class="t_ostalos" data-value="'+val+'"><div>'+(bytesToSize(val,0))+'</div></td>';
                    break;
                case ('t_seeds'):
                    return '<td class="t_seeds"><div>'+(param[13])+'</div></td>';
                    break;
                case ('t_peers'):
                    return '<td class="t_peers"><div>'+(param[14])+'</div></td>';
                    break;
                case ('t_otdano'):
                    return '<td class="t_otdano" data-value="'+param[18]+'"><div>'+(bytesToSize(param[18],0))+'</div></td>';
                    break;
                case ('t_poluchino'):
                    return '<td class="t_poluchino" data-value="'+param[16]+'"><div>'+(bytesToSize(param[16],0))+'</div></td>';
                    break;
                case ('t_koeficient'):
                    var val = param[17]/1000;
                    return '<td class="t_koeficient" data-value="'+param[17]+'"><div>'+val+'</div></td>';
                    break;
                case ('t_dostupno'):
                    var val = Math.round((param[19]/65535)*1000)/1000;
                    return '<td class="t_dostupno" data-value="'+param[19]+'"><div>'+val+'</div></td>';
                    break;
                case ('t_metka'):
                    return '<td class="t_metka"><div title="'+param[11]+'">'+param[11]+'</div></td>';
                    break;
                case ('t_time_dobavleno'):
                    return '<td class="t_time_dobavleno" data-value="'+param[20]+'"><div title="'+writeTimeFromShtamp(param[20])+'">'+writeTimeFromShtamp(param[20])+'</div></td>';
                    break;
                case ('t_time_zavircheno'):
                    return '<td class="t_time_zavircheno" data-value="'+param[21]+'"><div title="'+writeTimeFromShtamp(param[21])+'">'+writeTimeFromShtamp(param[21])+'</div></td>';
                    break;
                case ('t_controls'):
                    return '<td class="t_controls l"><div class="form" name="form_buttons_page"><div title="'+lang_arr[0]+'" class="control-button play"></div><div class="control-button pause" title="'+lang_arr[1]+'"></div><div class="control-button stop" title="'+lang_arr[2]+'"></div></div></td>';
                    break;
            }
            return '';
        }
        for (var i=1;i<=20;i++)
        {
            $.each(table_colums, function(key, value) {
                if (value[2]==i)
                {
                    colum_body+=AddSwith(key,param);
                }
            });
        }
        colum_body+='</tr>';
        $('#tr_list_list tbody').prepend(colum_body);
        $('div.form[name=form_buttons_page]').children('div').eq(0).unbind('click').click(function(){
            manager.action(this,'start');
            return false;
        })
        $('div.form[name=form_buttons_page]').children('div').eq(1).unbind('click').click(function(){
            manager.action(this,'pause');
            return false;
        })
        $('div.form[name=form_buttons_page]').children('div').eq(2).unbind('click').click(function(){
            manager.action(this,'stop');
            return false;
        })
        if (table_colums['t_dune']!=null)
        {
            if (param[5]==201&&param[1]==1000) 
                $('#'+id+' td.t_dune div div.progress_b div.progress_b_i').css('background-color','#41B541'); 
            else
                $('#'+id+' td.t_dune div div.progress_b div.progress_b_i').css('background-color','#3687ED');
        }
        $('#'+id).unbind('dblclick').dblclick(function (){
            show_FileList($(this).attr('id'));
        });
        calculate_moveble('t_name',200);
    }
    var updTorrent = function (id,param)
    {
        //обновляет строчку в торрент листе
        var with_a = $('#'+id);
        if (with_a.length==0)
        {
            addTorrent(id,param);
        } else {
            if (list_upd_matrix[id].n11!=param[11])
                with_a.attr('data-label',param[11]);
            if (list_upd_matrix[id].n22!=param[22])
                with_a.attr('data-sid',param[22]);
            if (list_upd_matrix[id].n23!=param[23])
                with_a.attr('data-path',param[23]);
            if (table_colums['t_name']!=null && list_upd_matrix[id].n3!=param[3])
            {
                with_a.children('td.t_name').children('div').attr('title',param[3]).html(param[3]);
            }
            if (table_colums['t_size']!=null && list_upd_matrix[id].n0!=param[0])
            {
                //t_size
                with_a.children('td.t_size').attr('data-value',param[0]).children('div').attr('title',bytesToSize(param[0])).html(bytesToSize(param[0]));
            }
            if (table_colums['t_dune']!=null && (list_upd_matrix[id].n1!=param[1]||list_upd_matrix[id].n5!=param[5]))
            {
                //t_dune
                var progress = param[1]/10;
                var with_c = $(with_a).children('td.t_dune').attr('data-value',param[1]).children('div').children('div.progress_b').children('div.progress_b_i');
                with_c.css('width',writePersent(progress)+'px').children('div').html(progress+'%');
                if (param[5]==201&&param[1]==1000)
                {
                    with_c.css('background-color','#41B541'); 
                } else
                    with_c.css('background-color','#3687ED');
            }
            if (table_colums['t_status']!=null && (list_upd_matrix[id].n5!=param[5]||list_upd_matrix[id].n2!=param[2]))
            {
                //t_status
                with_a.children('td.t_status').attr('data-value',param[5]).children('div').attr('title',param[2]).html(param[2]);
            }
            if (table_colums['t_eta']!=null && list_upd_matrix[id].n10!=param[10])
            {
                //t_eta
                var t = unixintime(param[10]);
                with_a.children('td.t_eta').attr('data-value',param[10]).children('div').attr('title',t).html(t)
            }
            if (table_colums['t_down_speed']!=null && list_upd_matrix[id].n6!=param[6])
            {
                //t_down_speed
                with_a.children('td.t_down_speed').attr('data-value',param[6]).children('div').html(bytesToSizeInSec(param[6],''));
            }
            if (table_colums['t_uplo_speed']!=null && list_upd_matrix[id].n7!=param[7])
            {
                //t_uplo_speed
                with_a.children('td.t_uplo_speed').attr('data-value',param[7]).children('div').html(bytesToSizeInSec(param[7],''));
            }
            if (table_colums['t_seeds_peers']!=null && list_upd_matrix[id].t_seeds_peers!=param[8]+'/'+param[9])
            {
                //t_seeds_peers
                with_a.children('td.t_seeds_peers').children('div').html(param[8]+'/'+param[9]);
            }
            if (table_colums['t_position']!=null && list_upd_matrix[id].n12!=param[12])
            {
                var val = param[12];
                if (val<0) val = '*';
                with_a.children('td.t_position').children('div').html(val);
            }
            if (table_colums['t_ostalos']!=null && list_upd_matrix[id].t_ostalos!=param[0]-param[16])
            {
                var val = param[0]-param[16];
                if (val < 0) val = 0;
                with_a.children('td.t_ostalos').attr('data-value',val).children('div').html(bytesToSize(val,0));
            }
            if (table_colums['t_seeds']!=null && list_upd_matrix[id].n13!=param[13])
            {
                with_a.children('td.t_seeds').children('div').html(param[13]);
            }
            if (table_colums['t_peers']!=null && list_upd_matrix[id].n14!=param[14])
            {
                with_a.children('td.t_peers').children('div').html(param[14]);
            }
            if (table_colums['t_otdano']!=null && list_upd_matrix[id].n18!=param[18])
            {
                with_a.children('td.t_otdano').attr('data-value',param[18]).children('div').html(bytesToSize(param[18],0));
            }
            if (table_colums['t_poluchino']!=null && list_upd_matrix[id].n16!=param[16])
            {
                with_a.children('td.t_poluchino').attr('data-value',param[16]).children('div').html(bytesToSize(param[16],0));
            }
            if (table_colums['t_koeficient']!=null && list_upd_matrix[id].n17!=param[17])
            {
                var val = param[17]/1000;
                with_a.children('td.t_koeficient').attr('data-value',param[17]).children('div').html(val);
            }
            if (table_colums['t_dostupno']!=null && list_upd_matrix[id].n19!=param[19])
            {
                var val = Math.round((param[19]/65535)*1000)/1000;
                with_a.children('td.t_dostupno').attr('data-value',param[19]).children('div').html(val);
            }
            if (table_colums['t_metka']!=null && list_upd_matrix[id].n11!=param[11])
            {
                with_a.children('td.t_metka').children('div').attr('title',param[11]).html(param[11]).attr('title',param[11]);
            }
            if (table_colums['t_time_dobavleno']!=null && list_upd_matrix[id].n20!=param[20])
            {
                var t = writeTimeFromShtamp(param[20]);
                with_a.children('td.t_time_dobavleno').children('div').attr('title',t).html(t);
            }
            if (table_colums['t_time_zavircheno']!=null && list_upd_matrix[id].n21!=param[21])
            {
                var t = writeTimeFromShtamp(param[21]);
                with_a.children('td.t_time_zavircheno').children('div').attr('title',t).html(t);
            }
            if (sel_tr_hash==id)
                $('ul.context-menu-list.ctx').children('li.labelsel').children('span').html(lang_arr[11]+' ('+param[11]+')<label class="context"><img src="images/right.png" /></label>');
            write_list_upd_mtrx(id,param);
        }
    }
    var show_FileList = function (id)
    {
        //Вызывает при показе списка файлов
        var close_FileList = function ()
        {
            //Вызывает при закрытии списка файлов
            $('#fl_box').css('display','none');
            $('#fl_list_fix').css('display','none');
            $('#file-list-layer').remove();
            $('#fl_list_list tbody').empty();
            $('th.chk_box').find(':checked').removeAttr('checked');
            $('#'+sel_hash_file).removeClass('hash_selected');
            file_list_url = '';
            var_arr.oldfl = '';
            $('#tree_select').empty();
            list_fl_upd_matrix = {};
        }
        $('#fl_list_list tbody').empty();
        var fl_box = $('#fl_box');
        $('#'+id).addClass('hash_selected');
        $('#fl_box div.bottom-menu input.path').val($('#'+id).attr('data-path'));
        fl_box.append('<div class="loading"><img src="images/loading.gif" /></div>');
        var left = ($('body').width()-fl_box.width())/2;
        var height_box = ($('body').height()-32*2);
        var left_l = (fl_box.width()-fl_box.children('div.loading').width())/2;
        var top_l = (height_box-fl_box.children('div.loading').height())/2;
        $('#fl_box .tb_box').css('height',height_box-32+'px');
        fl_box.css({
            'height':height_box+'px',
            'left':left,
            'display':'block'
        }).children('div.loading').css({
            'left':left_l,
            'top':top_l,
            'display':'block'
        });
        action(id,'getfiles',false);
        $('body').append('<div id="file-list-layer"></div>');
        $('#file-list-layer').css({
            height: $(window).height(), 
            width: $(window).width(), 
            display: 'block'
        }).unbind().mouseup(function () {
            close_FileList();
        });
        $('div.bottom-menu a.update').unbind('click').click(function () {
            action(id,'getfiles',false);
            return false;
        });
        $('div.bottom-menu a.close').unbind('click').click(function () {
            close_FileList();
            return false;
        });
        if (fl_auto_update==1)
            file_list_url = '&action=getfiles&hash='+id;
    }
    var UpdateFileList = function (arr)
    {
        //обновляет список файлов
        if (var_arr.oldfl==arr.toString()) {
            return;
        }
        var_arr.oldfl = arr.toString();
        var new_c = 0;
        var folder_arr = {};
        var removeSuperSpChars = function (t)
        {
            //очищает строчку перед сортировкой
            return t.replace(/[!@#$%^&*\(\)\-\+\=";:?'\/\\.,\[\]\{\}\~\` ]/gi,'');
        }
        var add_file = function (n,f)
        {
            //добавляет файл в список файлов
			
            if (folder_arr['root'] == null)
            {
                selector.prepend('<option class="sub_select_fl" value="'+'root'+'" selected="selected">/</option>');
                folder_arr['root'] = true;
            }
            var label_l = '';
            var class_l = 'root';
            var path = f[0].replace(/\\/gi,'/').split('/');
            if ($.isArray(path)&&path.length>1)
            {
                var pl = path.length-1;
                for (var i=0;i<pl;i++)
                {
                    label_l = label_l+'/'+path[i];
                    class_l = class_l+' dir_'+removeSuperSpChars(path[i]);					
                    if (folder_arr[class_l] == null)
                    {
                        selector.prepend('<option class="sub_select_fl" value="'+class_l+'">'+label_l+'</option>');
                        folder_arr[class_l] = true;
                    }
                }
            }
			
            new_c++;
            var content = '<tr id="f_'+n+'" num="'+n+'" class="'+class_l+'">';
            content += '<td class="chk_box"><div><input type="checkbox"/></div></td>';
            content += '<td class="fl_name"><div title="'+f[0]+'">'+f[0]+'</div></td>';
            var t = bytesToSize(f[1],'0');
            content += '<td class="fl_size" data-value="'+f[1]+'"><div title="'+t+'">'+t+'</div></td>';
            t = bytesToSize(f[2],'0');
            content += '<td class="fl_comp" data-value="'+f[2]+'"><div title="'+t+'">'+t+'</div></td>';
            var progress = Math.round((f[2]*100/f[1])*10)/10;
            content += '<td class="fl_dune" data-value="'+f[2]+'"><div><div class="progress_b"><div class="progress_b_i" style="width: '+writePersent(progress)+'px;"><div>'+progress+'%</div></div></div></div></td>';
            var p_v = lang_arr[87][f[3]];
            content += '<td class="fl_prio" data-value="'+f[3]+'"><div title="'+p_v+'">'+p_v+'</div></td>';
            content += '</tr>';
            $('#fl_list_list tbody').append(content);
            list_fl_upd_matrix[n] = {
                'f0' : f[0],
                'f1' : f[1],
                'f2' : f[2],
                'f3' : f[3]
            }
        }
        var upd_file = function (n,f)
        {
            //обновляет файл в списоке файлов
            var with_a = $('#f_'+n);
            if (list_fl_upd_matrix[n].f0!=f[0])
                with_a.children('td.fl_name').children('div').html(f[0]).attr('title',f[0]);
            if (list_fl_upd_matrix[n].f1!=f[1])
            {
                var t = bytesToSize(f[1],'0');
                $(with_a).children('td.fl_size').attr('data-value',f[1]).children('div').attr('title',t).html(t);
            }
            if (list_fl_upd_matrix[n].f2!=f[2])
            {
                t = bytesToSize(f[2],'0');
                $(with_a).children('td.fl_comp').attr('data-value',f[2]).children('div').html(t).attr('title',t);
                var progress = Math.round((f[2]*100/f[1])*10)/10;
                $(with_a).children('td.fl_dune').attr('data-value',f[2]).children('div').children('div.progress_b').children('div.progress_b_i').css('width',writePersent(progress)+'px').children('div').html(progress+'%');
            }
            if (list_fl_upd_matrix[n].f3!=f[3])
            {
                var p_v = lang_arr[87][f[3]];
                $(with_a).children('td.fl_prio').attr('data-value',f[3]).children('div').attr('title',p_v).html(p_v);
            }
            list_fl_upd_matrix[n] = {
                'f0' : f[0],
                'f1' : f[1],
                'f2' : f[2],
                'f3' : f[3]
            }
        }
        var selector = $('#tree_select');
        var c = arr[1].length;
        var f_c = $('#fl_list_list tbody').children('tr').length;
        if (f_c!=c)
            $('#fl_list_list tbody').empty();
        //var tmp_var = jQuery('<i/>').attr('id','test').css('display','none').appendTo('body');
        
        $('#fl_list_list tbody').on('click','tr td.chk_box div input',function () {
            manager.checkbox_click(this);
        });
        
        for (var i=0;i<c;i++)
        {
            if ($('#f_'+i).length==0)
            {
                add_file(i,arr[1][i]);
            }else
                upd_file(i,arr[1][i]);
        }
        //tmp_var.remove();
        if (new_c == 0)
            $("#fl_list_list").trigger("update");
        else
        {
            selector.selectBox('options');
            if (fl_auto_update==1&&new_c>60)
                file_list_url = '';
            sel_hash_file = arr[0];
            $('#fl_box div.loading').remove();
            $('#fl_list_list thead tr').children('th').unbind();
            $("#fl_list_list").unbind().tablesorter({
                textExtraction: myTextExtraction,
                widgets: ['zebra'],
                sortList: (localStorage.FileListSort !== undefined) ? JSON.parse(localStorage.FileListSort) : [[1,1]],
                autosorter: autosort,
                onheadclick: function () {
                    rewriteFixHeadFl();
                },
                onsort: function (s) {
                    localStorage.FileListSort = JSON.stringify(s);
                }
            });
            createFilesContextMenu();
        }
        $('th.chk_box').unbind().find().unbind();
        $('th.chk_box div input:checkbox').unbind().click(function () {
            var fil = $('#tree_select').val().replace(/ /gi,'.');
            var t_obj = $('#fl_list_list tbody tr.'+fil);
            if (this.checked)
            {
                $('th.chk_box').find(':checkbox').attr('checked','checked');
                t_obj.children('td.chk_box').find(':checkbox').attr('checked','checked');
                t_obj.addClass('hash_selected');
            } else {
                $('th.chk_box').find(':checked').removeAttr('checked');
                t_obj.children('td.chk_box').find(':checked').removeAttr('checked');
                t_obj.removeClass('hash_selected');
            }
        });
        calculate_moveble('fl_name',270);
    }
    var calculate_moveble = function (section,size) {
        if (size<=70) return;
        var titles = $('td.'+section).find('div');
        var titles_l = titles.length;
        
        for (var i = 0;i<titles_l;i++){
            var str_w = titles.eq(i).text().length * 7;
            if (str_w < size) continue;
            str_w = Math.ceil(str_w/10);
            if (str_w > 10) {
                if (str_w < 100) {
                    var t1 = Math.round(str_w/10);
                    if (t1 > str_w/10)
                        str_w = t1*10*10;
                    else
                        str_w = (t1*10 + 5)*10;
                } else 
                    str_w = str_w * 10;
            } else 
                str_w = str_w * 10;
            var str_s = size;
            var move_name = 'moveble'+'_'+str_s+'_'+str_w;
            if ($('body').find('.'+move_name).length == 0) {
                $('body').append('<style class="'+move_name+'">'
                    +'@-webkit-keyframes a_'+move_name
                    +'{'
                    +'0%{margin-left:2px;padding-right:2px;}'
                    +'50%{margin-left:-'+(str_w-str_s)+'px;padding-right:'+(str_w-str_s)+'px;}'
                    +'90%{margin-left:6px;padding-right:6px;}'
                    +'100%{margin-left:2px;padding-right:2px;}'
                    +'}'
                    +'td.'+section+' > div.'+move_name+':hover {'
                    +'overflow: visible !important;'
                    +'-webkit-animation:a_'+move_name+' 6s 1;'
                    +'}'
                    +'</style>');
            }
            titles.eq(i).attr('class',move_name);
        }
    }
    var checkbox_click = function (obj)
    {
        //обрабатывае клик на чекбокс в списке файлов
        if (obj.checked)
        {
            $('th.chk_box').find(':checked').removeAttr('checked');
            $(obj).parent('div').parent('td').parent('tr').addClass('hash_selected');
        } else {
            $(obj).removeAttr('checked');
            $('th.chk_box').find(':checked').removeAttr('checked');
            $(obj).parent('div').parent('td').parent('tr').removeClass('hash_selected');
        }
    }
    var writeStatus = function (status,note)
    {
        //записывает текущий статус в меню статуса
        if (cache_status==status) return;
        if (status=='progress')
        {
            $('table.bottom-panel tbody tr td.a').html('<img class="status" src="images/status_update.gif" width="12px" height="12px" />');
        } else
        if (status=='ok')
        {
            $('table.bottom-panel tbody tr td.a').html(lang_arr[22]);
        } else
        if (status=='error')
        {
            $('table.bottom-panel tbody tr td.a').html('<img class="status" src="images/status_error.png" /> '+lang_arr[23]+': <a href="options.html">'+(lang_arr[note]!=null) ? lang_arr[note] : note+'</a>');
        }
        cache_status = status;
    }
    var myTextExtraction = function(node)  
    {
        //фильтры для сортировки
        var removeSpChars = function (t)
        {
            //очищает строчку перед сортировкой
            return t.replace(/[!@#$%^&*\(\)\-\_\+=";:?'\/\\.,\[\]\{\}\~\`]/gi,'');
        }
        // extract data from markup and return it  
        if ($(node).attr('data-value')!=null)
            return $(node).attr('data-value');
        if ($(node).children('div')!=null)
            return removeSpChars($(node).children('div').html());
        return $(node).html();
    }
    var actionPause_all = function ()
    {
        //создает и посылает запрос на паузу для всех торрентов
        var bg = chrome.extension.getBackgroundPage();
        var arr = bg.engine.getArr();
        var hash_list = '';
        $.each(arr, function(key, value) {
            if (value[5]==201)
                hash_list += (hash_list == '') ? value[4] : '&hash=' + value[4];
        });
        if (hash_list!='')
            bg.engine.actionSend(hash_list,'pause');
    }
    var actionUnpause_all = function ()
    {
        //создает и посылает запрос на возобновление для всех торрентов
        var bg = chrome.extension.getBackgroundPage();
        var arr = bg.engine.getArr();
        var hash_list = '';
        $.each(arr, function(key, value) {
            if (value[5]==233)
                hash_list += (hash_list == '') ? value[4] : '&hash=' + value[4];
        });
        if (hash_list!='')
            bg.engine.actionSend(hash_list,'unpause');
    }
    var removeTr = function (id)
    {
        //Удаляет торрент из списка торрентов
        $('#'+id).remove();
    }
    var mTimer = function ()
    {
        //обьект для управления таймером
        var timer_obj = 0;
        var status = false;
        var start = function ()
        {
            //запуск таймера
            if (status==true && timer_obj) return;
            timer_obj.everyTime(manager_interval, 'timer', function() {
                var bg = chrome.extension.getBackgroundPage();
                bg.engine.getTorrentList(null,file_list_url);
            });
            status = true;
        }
        var stop = function ()
        {
            //остановка таймера
            if (status==false && timer_obj) return;
            timer_obj.stopTime('timer');
            status = false;
        }
        var init = function()
        {
            timer_obj = $('#timer');
        }
        return {
            start : function () {
                return start();
            },
            stop : function () {
                return stop();
            },
            init : function () {
                return init();
            }
        }
    }();
    var refreshBt = function ()
    {
        //выполняет действие кнопки обновления
        var bg = chrome.extension.getBackgroundPage();
        bg.engine.getTorrentList();
    }
    var action = function (obj,act,list)
    {
        //посылает действие на сервер
        var hash = (typeof obj == "string") ? obj : $(obj).parent().parent().parent().attr('id');
        if (act=='remove'||act=='removedata'||act=='removetorrent'||act=='removedatatorrent')
            $('#'+hash).remove();
        var bg = chrome.extension.getBackgroundPage();
        if (list!=false) list = true;
        bg.engine.actionSend(hash,act,list);
    }
    var createContextMenu = function ()
    {
        //создает контекстное меню торрента
        var hideContextMenu = function (obj)
        {
            //вызывается при закртытии контекстного меню выбора торрентов
            $(obj).removeClass('hash_selected');
        }
        var rewriteContextM = function (obj)
        {
            //обновляет контекстное меню торрента
            var readStatus = function (i)
            {
                //выставляет что можно а что нельзя в контекстном меню торрента
                var minus_par = [];
                var minusSt = function (i)
                {
                    //читает код статуса тооррента
                    if (i>=128)
                    {
                        //Loaded
                        minus_par[128] = true;
                        sel_en[2] = 0;
                        sel_en[3] = 0;
                        return i-128;
                    } else
                    if (i>=64)
                    {
                        //Queued
                        minus_par[64] = true;
                        sel_en[1] = 0;
                        sel_en[3] = 1;
                        return i-64;
                    } else
                    if (i>=32)
                    {
                        //Paused
                        minus_par[32] = true;
                        sel_en[1] = 1;
                        sel_en[5] = 1;
                        sel_en[6] = 1;
                        return i-32;
                    } else
                    if (i>=16)
                    {
                        //Error
                        minus_par[16] = true;
                        sel_en[6] = 1;
                        sel_en[1] = 1;
                        return i-16;
                    } else
                    if (i>=8)
                    {
                        //Checked
                        minus_par[8] = true;
                        sel_en[6] = 1;
                        return i-8;
                    } else
                    if (i>=4)
                    {
                        //Start after check
                        minus_par[4] = true;
                        sel_en[4] = 1;
                        sel_en[1] = 0;
                        sel_en[2] = 1;
                        sel_en[3] = 1;
                        return i-4;
                    } else
                    if (i>=2)
                    {
                        //Checking
                        minus_par[2] = true;
                        sel_en[6] = 0;
                        sel_en[3] = 1;
                        if (!minus_par[32])
                            sel_en[2] = 1;
                        return i-2;
                    } else
                    if (i>=1)
                    {
                        //Started
                        minus_par[1] = true;
                        if (minus_par[32]==null)
                        {
                            sel_en[1] = 0;
                            sel_en[2] = 1;
                            sel_en[3] = 1;
                            sel_en[4] = 1;
                            sel_en[5] = 0;
                        }
                        if (minus_par[8]&&minus_par[1]&&minus_par[64]==null)
                        {
                            sel_en[1] = 1;
                        }
                        sel_en[6] = 0;
                        return i-1;
                    } else
                        return i;
                }
                sel_en[1] = 1; //start
                sel_en[2] = 1; //pause
                sel_en[3] = 1; //stop
                sel_en[4] = 0; //force start
                sel_en[5] = 0; //unpause
                sel_en[6] = 1; //forcer re-check
                sel_en[7] = 1; //remove
                sel_en[8] = 1; //remove data
                sel_en[9] = 1; //label
                var t = i;
                while (t>0)
                {
                    t = minusSt(t);
                }
            }
            $(obj).addClass('hash_selected');
            sel_tr_hash = $(obj).attr('id');
            sel_tr = list_upd_matrix[sel_tr_hash].n3;
            var with_a = $('ul.context-menu-list.ctx').children('li');
            //with_a.eq(0).html(sel_tr).addClass('c_mTop');
            readStatus(list_upd_matrix[sel_tr_hash].n5);
            new_sel_l_arr = [sel_en[1],sel_en[4],sel_en[2],sel_en[5],sel_en[3],1,sel_en[6],sel_en[7],sel_en[8],1,sel_en[9]];
            //				    0         1         2         3         4      5    6         7         8      9   10
            sel_en = new_sel_l_arr;
            var f = false;
            for (var i=0;i<11;i++)
            {
                if (sel_en[i]==0)
                {
                    if (f==true&&(i==0||i==1)) with_a.eq(i).removeClass('c_mTop');
                    with_a.eq(i).addClass('not-enable');
                }
                else
                {
                    if (f==true&&(i==0||i==1)) with_a.eq(i).removeClass('c_mTop');
                    if (f==false) {
                        with_a.eq(i).addClass('c_mTop');
                        f=true;
                    }
                    with_a.eq(i).removeClass('not-enable');
                }
            }
            //$('ul.context-menu-list.ctx').children('li[class!=not-enable]').eq(0).addClass('c_mTop');
            var label = list_upd_matrix[sel_tr_hash].n11;
            with_a.eq(10).addClass('c_mBottom').children('span').html(lang_arr[11]+' ('+label+')<label class="context"><img src="images/right.png" /></label>');
            with_a.eq(8).children('span').html(lang_arr[7]+'<label class="context"><img src="images/right.png" /></label>');
            //работа с метками>
            var items =$('.context-menu-list.labelsel').children('.context-menu-item'); 
            var i_val = '';
            var arrs = items.length;
            for (var i=0;i<arrs;i++)
            {
                i_val = items.eq(i).children('span').html();
                if (i_val == null) continue;
                if (i_val==label)
                {
                    items.eq(i).html('<label>&#9679; </label><span>'+label+'</span>');
                }
                else
                {
                    items.eq(i).children('label').remove();
                }
            }
            items.eq(0).addClass('c_mTop');
            items.eq(arrs-1).addClass('c_mBottom');
        //<работа с метками
        }
        $.contextMenu( 'destroy', {
            selector: '#tr_list_list tbody tr'
        } );
        var sub_arr = {
            r1 : {
                name:lang_arr[8],	
                callback:function() {
                    if (sel_en[7] == 0 ) return;
                    action(sel_tr_hash,'removetorrent');
                }, 
                item:'8', 
                className: 'c_mTop'
            },
            r2 : {
                name:lang_arr[9],	
                callback:function() {
                    if (sel_en[8] == 0 ) return;
                    action(sel_tr_hash,'removedata');
                }, 
                item:'9'
            },
            r3 : {
                name:lang_arr[10],	
                callback:function() {
                    if (sel_en[7] == 0 ) return;
                    action(sel_tr_hash,'removedatatorrent');
                }, 
                item:'10', 
                className: 'c_mBottom'
            }
        };
        $.contextMenu({
            selector: '#tr_list_list tbody tr',
            className: 'ctx',
            events: {
                show: function (opt){
                    rewriteContextM(this);
                },
                hide: function (opt){
                    hideContextMenu(this)
                }
            },
            items: {
                //title: {name: "%name%", className: 'ctx_name', type:"html"},
                a1: {
                    name:lang_arr[0], 
                    className: 'ctx_start',	
                    callback:function() {
                        if (sel_en[0] == 0 ) return;
                        action(sel_tr_hash,'start');
                    }, 
                    item:'1'
                },
                a4: {
                    name:lang_arr[3], 
                    className: 'ctx_forcestart',	
                    callback:function() {
                        if (sel_en[1] == 0 ) return;
                        action(sel_tr_hash,'forcestart');
                    }, 
                    item:'4'
                },
                a2: {
                    name:lang_arr[1], 
                    className: 'ctx_pause',	
                    callback:function() {
                        if (sel_en[2] == 0 ) return;
                        action(sel_tr_hash,'pause');
                    }, 
                    item:'2'
                },
                a5: {
                    name:lang_arr[4], 
                    className: 'ctx_unpause',	
                    callback:function() {
                        if (sel_en[3] == 0 ) return;
                        action(sel_tr_hash,'unpause');
                    }, 
                    item:'5'
                },
                a3: {
                    name:lang_arr[2], 
                    className: 'ctx_stop',	
                    callback:function() {
                        if (sel_en[4] == 0 ) return;
                        action(sel_tr_hash,'stop');
                    }, 
                    item:'3'
                },
                s1:   '--------',
                a6: {
                    name:lang_arr[5], 
                    className: 'ctx_recheck',	
                    callback:function() {
                        if (sel_en[6] == 0 ) return;
                        action(sel_tr_hash,'recheck');
                    }, 
                    item:'6'
                },
                a7: {
                    name:lang_arr[6], 
                    className: 'ctx_remove',	
                    callback:function() {
                        if (sel_en[7] == 0 ) return;
                        
                        apprise(lang_arr[73], {
                            'verify':true,
                            'textYes':lang_arr[110][0], 
                            'textNo':lang_arr[110][1]
                        }, function(r) {
                            if(r) {
                                if(typeof(r)!='string')
                                {
                                    action(sel_tr_hash,'remove');
                                }
                            }
                            else 
                            {
                                return;
                            }
                        });
                    /*
                        if (!confirm(lang_arr[73])) return;
                        action(sel_tr_hash,'remove');
                        */
                    }, 
                    item:'7'
                },
                a8: {
                    name: lang_arr[7], 
                    className: 'delbt', 
                    items: sub_arr
                },
                s2:   '--------',
                Labels: {
                    name: lang_arr[11], 
                    className: 'labelsel', 
                    items: labels_arr()
                }
            }
        });
        $('ul.context-menu-list.ctx li.context-menu-item.labelsel ul.context-menu-list').children('li.context-menu-item').click(function(){
            var label = $(this).children('span').html();
            if (label == lang_arr[12]) label = '';
            action(sel_tr_hash,'setprops&s=label&v='+label);
        });
    }
    var createColumContextMenu = function ()
    {
        //создает контекстное меню для добавления\удаления столбцов
        var rewrite_head = function (n)
        {
            //добавляет или удаляет столбцы
            delete localStorage.MainListSort;
            var bg = chrome.extension.getBackgroundPage();
            var m = bg.engine.table_colem_def(n);
            if (table_colums[n]!=null) delete table_colums[n]; else
                table_colums[n] = [1,m[1],m[2]];
            $('style[name=head_st]').html(writeTableHead());
            header = $("#tr_list_list thead").clone();
            $("#tr_list_fix thead").remove();
            fixedHeader = $("#tr_list_fix").append(header);
            //bindFixHead();
            $('#tr_list_list thead tr').children('th').unbind();
            $("#tr_list_list").unbind().children('tbody').empty();
            $('ul.context-menu-list.ctx').remove();
            bindFixHead();
            //headFixPanel();
            selectLabel('selector');
        }
        var rewriteColumContextM = function (obj)
        {
            //обновляет контекстное меню столбцов таблицы
            for (var i=0;i<20;i++)
            {
                if (table_colums[cols[i]]==null)
                {
                    $('ul.context-menu-list.colum_menu.context-menu-root').children('li').eq(i).children('span').html(lang_arr[col_lang[i]][1]);
                } else {
                    $('ul.context-menu-list.colum_menu.context-menu-root').children('li').eq(i).children('span').html('<label>&#9679; </label>'+lang_arr[col_lang[i]][1]);
                }
            }
            return;
        }
        $.contextMenu( 'destroy', {
            selector: '#tr_list_list thead'
        } );
        $.contextMenu({
            selector: '#tr_list_list thead',
            className: 'colum_menu',
            events: {
                show: function (opt){
                    rewriteColumContextM(this);
                }
            },
            items: {
                o1: {
                    name:lang_arr[col_lang[0]][1], 
                    className:'c_mTop',	
                    callback:function() {
                        rewrite_head(cols[0])
                    }
                },
                o2: {
                    name:lang_arr[col_lang[1]][1],	
                    callback:function() {
                        rewrite_head(cols[1])
                    }
                },
                o3: {
                    name:lang_arr[col_lang[2]][1],	
                    callback:function() {
                        rewrite_head(cols[2])
                    }
                },
                o4: {
                    name:lang_arr[col_lang[3]][1],	
                    callback:function() {
                        rewrite_head(cols[3])
                    }
                },
                o5: {
                    name:lang_arr[col_lang[4]][1],	
                    callback:function() {
                        rewrite_head(cols[4])
                    }
                },
                o6: {
                    name:lang_arr[col_lang[5]][1],	
                    callback:function() {
                        rewrite_head(cols[5])
                    }
                },
                o7: {
                    name:lang_arr[col_lang[6]][1],	
                    callback:function() {
                        rewrite_head(cols[6])
                    }
                },
                o8: {
                    name:lang_arr[col_lang[7]][1],	
                    callback:function() {
                        rewrite_head(cols[7])
                    }
                },
                o9: {
                    name:lang_arr[col_lang[8]][1],	
                    callback:function() {
                        rewrite_head(cols[8])
                    }
                },
                o10: {
                    name:lang_arr[col_lang[9]][1],	
                    callback:function() {
                        rewrite_head(cols[9])
                    }
                },
                o11: {
                    name:lang_arr[col_lang[10]][1],	
                    callback:function() {
                        rewrite_head(cols[10])
                    }
                },
                o12: {
                    name:lang_arr[col_lang[11]][1],	
                    callback:function() {
                        rewrite_head(cols[11])
                    }
                },
                o13: {
                    name:lang_arr[col_lang[12]][1],	
                    callback:function() {
                        rewrite_head(cols[12])
                    }
                },
                o14: {
                    name:lang_arr[col_lang[13]][1],	
                    callback:function() {
                        rewrite_head(cols[13])
                    }
                },
                o15: {
                    name:lang_arr[col_lang[14]][1],	
                    callback:function() {
                        rewrite_head(cols[14])
                    }
                },
                o16: {
                    name:lang_arr[col_lang[15]][1],	
                    callback:function() {
                        rewrite_head(cols[15])
                    }
                },
                o17: {
                    name:lang_arr[col_lang[16]][1],	
                    callback:function() {
                        rewrite_head(cols[16])
                    }
                },
                o18: {
                    name:lang_arr[col_lang[17]][1],	
                    callback:function() {
                        rewrite_head(cols[17])
                    }
                },
                o19: {
                    name:lang_arr[col_lang[18]][1],	
                    callback:function() {
                        rewrite_head(cols[18])
                    }
                },
                o20: {
                    name:lang_arr[col_lang[19]][1], 
                    className:'c_mBottom',	
                    callback:function() {
                        rewrite_head(cols[19])
                    }
                }
            }
        });
    }
    var createFilesContextMenu = function ()
    {
        //Создает контекстное меню в списке файлов торрентов
        var showFileCtxMenu = function (obj)
        {
            function getFileType(a)
            {
                //расширение файла
                var t = a.split('.');
                return t[t.length-1];
            }
            //вызыввается при показе контекстного меню в списке файлов торрентов
            $(obj).addClass('hash_selected');
            sel_file_id = $(obj).attr('num');
            $(obj).children('td.chk_box').children('div').children('input').attr('checked','checked');
            var st = list_fl_upd_matrix[sel_file_id].f3;
            var ul_fm_cmi = $('ul.files_menu');
            ul_fm_cmi.children('.context-menu-item').children('span').children('label').css('display','none');
            if (ul_fm_cmi.children('.context-menu-item.p'+st).children('span').children('label').length==0)
                ul_fm_cmi.children('.context-menu-item.p'+st).children('span').prepend('<label>&#9679; </label>');
            else
                ul_fm_cmi.children('.context-menu-item.p'+st).children('span').children('label').css('display','inline');
            if (list_fl_upd_matrix[sel_file_id].f1==list_fl_upd_matrix[sel_file_id].f2)
            {
                ul_fm_cmi.children('.context-menu-item.context-menu-separator').eq(2).css('display','block');
                ul_fm_cmi.children('.context-menu-item.dl_btn').css('display','block');
                ul_fm_cmi.children('.context-menu-item.p0').removeClass('c_mBottom');
                //> код добавления пункта воспроизведения
                /*var ext = getFileType($(obj).children('td.fl_name').children('div').text());
				var vlc_e = -1;
				if (localStorage["vlc_active"]==1)
					vlc_e = $.inArray(ext,['3gp','asf','wmv','asf','wmv','au','avi','flv','mov','ogm','ogg','mkv','mka','ts','mpg','mpg','mp2','nsc','nsv','nut','ra','ram','rm','rv ','rmbv','a52','dts','aac','flac','dv','vid','tta','tac','ty','wav','dts','xa']);
				if (ext == 'mp3' || ext == 'ogv' || ext == 'webm' || ext == 'mp4' || vlc_e!=-1)
				{
					ul_fm_cmi.children('.context-menu-item.play_it').css('display','block');
					ul_fm_cmi.children('.context-menu-item.context-menu-separator').eq(0).css('display','block');
					ul_fm_cmi.children('.context-menu-item.p3').removeClass('c_mTop');
				} else {*/
                //<======================================
                ul_fm_cmi.children('.context-menu-item.play_it').css('display','none');
                ul_fm_cmi.children('.context-menu-item.context-menu-separator').eq(0).css('display','none');
                ul_fm_cmi.children('.context-menu-item.p3').addClass('c_mTop');
            //}
            } else {
                ul_fm_cmi.children('.context-menu-item.context-menu-separator').eq(2).css('display','none');
                ul_fm_cmi.children('.context-menu-item.dl_btn').css('display','none');
                ul_fm_cmi.children('.context-menu-item.p0').addClass('c_mBottom');
                ul_fm_cmi.children('.context-menu-item.play_it').css('display','none');
                ul_fm_cmi.children('.context-menu-item.context-menu-separator').eq(0).css('display','none');
                ul_fm_cmi.children('.context-menu-item.p3').addClass('c_mTop');
            }
			
        }
        var hideFileCtxMenu = function (obj)
        {
            //вызыввается при зыкрытии контекстного меню в списке файлов торрентов
            $(obj).removeClass('hash_selected').find('input:checked').removeAttr('checked');
        }
        var setPrio = function (id,i)
        {
            //выставляет приоритет файлам
            var arr = id.split('&f=');
            var arr_l = arr.length;
            for (var n=0;n<arr_l;n++)
            {
                var pri = lang_arr[87][i];
                var with_b = $('#f_'+arr[n]+' td.fl_prio').attr('data-value',i).children('div').attr('title',pri).html(pri);
            }
            $('#fl_list_list tbody tr.hash_selected').removeClass('hash_selected').find(':checked').removeAttr('checked');
            $('th.chk_box').find(':checked').removeAttr('checked');
        }
        var get_file_id_list = function ()
        {
            //передает список файлов в url
            var obj = $('#fl_list_list tbody').children('tr.hash_selected');
            var l = obj.length;
            var file_id_list = '';
            for (var i=0;i<l;i++)
                file_id_list += (file_id_list == '') ? obj.eq(i).attr('num') : '&f=' + obj.eq(i).attr('num');
            return file_id_list;
        }
        var get_files_arr = function ()
        {
            //создает вкладку для загрузки выделенных файлов
            var username = (localStorage.utorrent_login !== undefined) ? localStorage.utorrent_login : '';
            var userpassword = (localStorage.utorrent_password !== undefined) ? localStorage.utorrent_password : '';
            var uturl = localStorage.utorrent_ip;
            var utport = localStorage.utorrent_port;
            var url_u = '';
            var num_f = '';
            var obj = $('#fl_list_list tbody').children('tr.hash_selected');
            var l = obj.length;
            for (var i=0;i<l;i++)
            {
                num_f = obj.eq(i).attr('num');
                url_u = 'http://'+username+':'+userpassword+'@'+uturl+':'+utport+'/proxy?sid='+$('#'+sel_hash_file).attr('data-sid')+'&file='+num_f+'&disposition=ATTACHMENT&service=DOWNLOAD&qos=0';
                chrome.tabs.create({
                    url: url_u
                });
            }
            $(obj).removeClass('hash_selected').find(':checked').removeAttr('checked');
            $('th.chk_box').find(':checked').removeAttr('checked');
        }
        function setMediaList()
        {
            //воспроизведение медиа
            var username = (localStorage.utorrent_login !== undefined) ? localStorage.utorrent_login : '';
            var userpassword = (localStorage.utorrent_password !== undefined) ? localStorage.utorrent_password : '';
            var uturl = localStorage.utorrent_ip;
            var utport = localStorage.utorrent_port;
            var url_u = '';
            var num_f = '';
            var obj = $('#fl_list_list tbody').children('tr.hash_selected');
            var l = obj.length;
            var mk_obj = {};
            var bg = chrome.extension.getBackgroundPage();
            for (var i=0;i<l;i++)
            {
                num_f = obj.eq(i).attr('num');
                url_u = 'http://'+username+':'+userpassword+'@'+uturl+':'+utport+'/proxy?sid='+$('#'+sel_hash_file).attr('data-sid')+'&file='+num_f;
                mk_obj[i] = [obj.eq(i).children('td.fl_name').children('div').attr('title'),url_u,$('#'+sel_hash_file).attr('data-path')];
            }
            bg.engine.setMedia(mk_obj);
            $(obj).removeClass('hash_selected').find(':checked').removeAttr('checked');
            $('th.chk_box').find(':checked').removeAttr('checked');
            chrome.windows.create({
                url: 'media.html',
                type : 'popup', 
                focused : true, 
                width:640,
                height:360
            });
        }
        $.contextMenu( 'destroy', {
            selector: '#fl_list_list tbody tr'
        } );
        $.contextMenu({
            className: 'files_menu',
            selector: '#fl_list_list tbody tr',
            events:{
                show: function (opt){
                    showFileCtxMenu(this);
                },
                hide: function (opt){
                    hideFileCtxMenu(this)
                }
            },
            items: {
                m0:   {
                    name:lang_arr[93], 
                    className:'c_mTop play_it', 
                    callback:function() {
                        setMediaList();
                    //chrome.tabs.create({url: 'media.html'});
                    }
                },
                m7:   '--------',
                m1:   {
                    name:lang_arr[87][3], 
                    className:'p3', 
                    callback:function() {
                        action(sel_hash_file,'setprio&p=3&f='+get_file_id_list(),false);
                        setPrio(get_file_id_list(),3);
                    }
                },
                m2:   {
                    name:lang_arr[87][2], 
                    className:'p2', 
                    callback:function() {
                        action(sel_hash_file,'setprio&p=2&f='+get_file_id_list(),false);
                        setPrio(get_file_id_list(),2);
                    }
                },
                m3:   {
                    name:lang_arr[87][1], 
                    className:'p1', 
                    callback:function() {
                        action(sel_hash_file,'setprio&p=1&f='+get_file_id_list(),false);
                        setPrio(get_file_id_list(),1);
                    }
                },
                m4:   '--------',
                m5:   {
                    name:lang_arr[87][0], 
                    className:'p0', 
                    callback:function() {
                        action(sel_hash_file,'setprio&p=0&f='+get_file_id_list(),false);
                        setPrio(get_file_id_list(),0);
                    }
                },
                m6:   '--------',
                mEnd: {
                    name:lang_arr[90], 
                    className:'c_mBottom dl_btn', 
                    callback:get_files_arr
                }
            }
        });
    }
    var UpdateSpeed = function (obj,limites)
    {
        //обновляет контекстное меню ограничения скорости
        if (obj!=null)
            speedmenu_type = $(obj).attr('class');
        if (limites!=null)
        {
            down_limit = limites[0];
            upl_limit = limites[1];
        }
        if (down_limit == -1)
        {
            down_limit = 0;
            upl_limit = 0;
            var bg = chrome.extension.getBackgroundPage();
            bg.engine.getLimites();
        }
        var count = $('li.context-menu-item.speed').length;
        var speed = 0;
        var sp = (speedmenu_type=='d') ? down_limit : upl_limit;
        var count_p = sp;
        if (count_p == 0) count_p = 200;
        if (count_p<Math.round(count/2)) count_p = Math.round(count/2);
        if (sp == 0)
            $('li.context-menu-item.zero span').html('<label>&#9679; </label>'+lang_arr[69]);
        else
            $('li.context-menu-item.zero span').html(lang_arr[69]);
        var with_a = $('li.context-menu-item.speed');
        for (var i=0;i<count;i++)
        {
            speed = Math.round((i+1)/Math.round(count/2)*count_p);
            if (speed == sp)
                with_a.eq(i).children('span').attr('speed',speed).html('<label>&#9679; </label>'+bytesToSizeInSec(speed*1024));	
            else  
                with_a.eq(i).children('span').attr('speed',speed).html(bytesToSizeInSec(speed*1024));
        }
        $('li.context-menu-item.zero').eq(0).addClass('c_mTop');
        with_a.eq(count-1).addClass('c_mBottom');
    }
    var labels_arr = function (n)
    {
        //создает выпадающее меню выбора фильтров
        var labels = {};
        var bg = chrome.extension.getBackgroundPage();
        var arr = bg.engine.getLabels();
        var arrs = arr.length;
        labels["l"+'_0']={
            name: lang_arr[12], 
            callback: function (){
                return
            }
        };
        labels["l"+'_1']='---------';
        var sel_val = localStorage["last_label"];
        var def = ['*{[all]}*','*{[down]}*','*{[uplo]}*','*{[comp]}*','*{[acti]}*','*{[inac]}*',''];
        var with_a = $('#label_select');
        for (var i=0;i<def.length;i++)
        {
            var t = with_a.children('option.sub_select[value="'+def[i]+'"]').val();
            if (t==null||t==lang_arr[70][i])
                with_a.append('<option class="sub_select" value="'+def[i]+'">'+lang_arr[70][i]+'</option>');
        }
        for (var i=0;i<arrs;i++)
        {
            labels["l"+i]={
                name: arr[i][0], 
                callback: function (){
                    return
                }
            };
            t =  with_a.children('option.sub_select[value="'+arr[i][0]+'"]').val();
            if (t==null||t!=arr[i][0])
                with_a.append('<option class="sub_select" value="'+arr[i][0]+'" '+((sel_val==arr[i][0]) ? 'selected=selected' : '')+'>'+arr[i][0]+'</option>');
        }
        if ($('option.sub_select[selected=selected]').length>1||$('option.sub_select[selected=selected]').val()!=sel_val)
        {
            with_a = $('#label_select');
            with_a.children('option.sub_select').removeAttr('selected');
            with_a.children('option.sub_select[value="'+sel_val+'"]').attr('selected','selected');
        }
        with_a = $('option.sub_select[selected=selected]');
        if (with_a.length==0||with_a.val()==null)
        {
            localStorage["last_label"] = '*{[all]}*';
            selectLabel(null);
        }
        if ($('option.sub_select').length!=arrs+7&&arrs!=null)
        {
            $('#label_select').children('option').remove();
            if (n==null)
            {
                labels_arr(1);
                return;
            }
        }
        $('#label_select').selectBox('options');
        var imgs = ['c_all.png','c_down.png','c_uplo.png','c_comp.png','c_active.png','c_iact.png',''];
        for (var i=0;i<def.length;i++)
        {
            var img_c = '';
            if (def[i]!='')
                img_c = '<div class="cat_img" style="background: url(\'images/'+imgs[i]+'\') no-repeat;"></div>';
            $('a[rel="'+def[i]+'"]').html(img_c+lang_arr[70][i]);
        }
        icoinselector(sel_val);
        return labels;
    }
    var writePersent = function (i)
    {
        //выписывает проценты для прогресс баров
        var full = 68;
        return Math.round(full/100*i);
    }
    var updownspeed = function (u,d)
    {
        //обновляет нижнию панель отображения скорости
        var with_a = $('.bottom-panel tbody tr');
        $(with_a).children('td.d').html('D: '+bytesToSizeInSec(d,'-'));
        $(with_a).children('td.u').html('U: '+bytesToSizeInSec(u,'-'));
        if (graph_enable==1)
        {
            graph.move(u,d,0);
        }
    }
    var bytesToSize = function (bytes,nan) {
        //переводит байты в строчки
        var sizes = lang_arr[59];
        if (nan==null) nan = 'n/a';
        if (bytes == 0) return nan;
        var i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
        if (i == 0) {
            return (bytes / Math.pow(1024, i)) + ' ' + sizes[i];
        }
        return (bytes / Math.pow(1024, i)).toFixed(1) + ' ' + sizes[i];
    }
    var bytesToSizeInSec = function (bytes,nan) {
        //переводит байты в строчки\сек
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
        //выписывает отсчет времени из unixtime
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
    var rewriteFixHead = function ()
    {
        $('#tr_list_fix thead tr th').removeClass('headerSortDown').removeClass('headerSortUp');
        var obj = $('#tr_list_list thead tr').children('th.headerSortDown');
        var t_l = obj.length;
        for (var i=0;i<t_l;i++)
            $('#tr_list_fix thead tr th.'+obj.eq(i).attr('class').split(' ')[0]).addClass('headerSortDown');
        obj = $('#tr_list_list thead tr').children('th.headerSortUp');
        t_l = obj.length;
        for (i=0;i<t_l;i++)
            $('#tr_list_fix thead tr th.'+obj.eq(i).attr('class').split(' ')[0]).addClass('headerSortUp');
    }
    var rewriteFixHeadFl = function ()
    {
        $('#fl_list_fix thead tr th').removeClass('headerSortDown').removeClass('headerSortUp');
        var obj = $('#fl_list_list thead tr').children('th.headerSortDown');
        var t_l = obj.length;
        for (var i=0;i<t_l;i++)
            $('#fl_list_fix thead tr th.'+obj.eq(i).attr('class').split(' ')[0]).addClass('headerSortDown');
        obj = $('#fl_list_list thead tr').children('th.headerSortUp');
        t_l = obj.length;
        for (i=0;i<t_l;i++)
            $('#fl_list_fix thead tr th.'+obj.eq(i).attr('class').split(' ')[0]).addClass('headerSortUp');
    }
    var bindFixHead = function ()
    {
        //биндит зафиксированные столбцы таблицы на сортировку в торрент листе
        $('#tr_list_fix thead tr').children('th').unbind().click(function(){
            $('#tr_list_list thead tr th.'+$(this).attr('class').split(' ')[0]).click();
        });
    }
    var bindFileFixHead = function ()
    {
        //биндит зафиксированные столбцы таблицы на сортировку в файл-листе
        $('#fl_list_fix thead tr').children('th').unbind().click(function(){
            $('#fl_list_list thead tr th.'+$(this).attr('class').split(' ')[0]).click();
        });
    }
    var headFixPanel = function ()
    {
        //биндит скролл списка торрентов, на показ фиксированной панели сортировки		
        function fix_left_head_panel(obj)
        {
            var offset_h = $(obj).scrollLeft();
            fixedHeader.css('left',-offset_h+1);
        }
        function set_head_pos()
        {
            obj = $('div.tr-box');
            var offset = obj.scrollTop();
            var h_st = fixedHeader.is(":hidden");
            if (offset >= 34 && h_st) {
                fixedHeader.css('display','inline');
                $('#tr_list_fix').css('width',$('#tr_list_list').width());
                fix_left_head_panel(obj);
            } else 
            if (offset < 34)
                fixedHeader.css('display','none');
            else
                fix_left_head_panel(obj);
        }
        $('div.tr-box').unbind('scroll').scroll(set_head_pos);
    }
    return {
        writeStatus : function (a,b) {
            return writeStatus(a,b);
        },
        writeList : function () {
            return writeList();
        },
        removeTr : function (a) {
            return removeTr(a);
        },
        updateList : function (a) {
            return updateList(a);
        },
        UpdateSpeed : function (a,b) {
            return UpdateSpeed(a,b);
        },
        selectLabel : function (a) {
            return selectLabel(a);
        },
        selectTree : function (a) {
            return selectTree(a);
        },
        pos_res : function () {
            return pos_res;
        },
        createColumContextMenu : function () {
            return createColumContextMenu();
        },
        refreshBt : function () {
            return refreshBt();
        },
        actionUnpause_all : function () {
            return actionUnpause_all();
        },
        actionPause_all : function () {
            return actionPause_all();
        },
        UpdateFileList : function (a) {
            return UpdateFileList(a);
        },
        checkbox_click : function (a) {
            return checkbox_click(a);
        },
        action : function (a,b,c) {
            return action(a,b,c);
        },
        run_graph : function () {
            return run_graph();
        },
        init_timer : function () {
            return mTimer.init();
        }
    }
}();
var isDOM = function ()
{
    return true;
}
var dieDOM = function ()
{
    $(window).unbind('unload');
    window.close();
}

//donate
//var y_new,rc=0,rc_m=getRandomArbitary(0,2),ny=0,rotYINT;
function getRandomArbitary(min, max)
{
    return Math.random() * (max - min) + min;
}
/*
function rotateYDIV()
{
	y_new=document.getElementById("donate-btn");
	clearInterval(rotYINT);
	rotYINT=setInterval("startYRotate()",10);
	$(y_new).css('box-shadow','inset 0 0 3px #c40000');
}
function startYRotate()
{
	ny=ny+2;
	y_new.style.transform="rotateY(" + ny + "deg)";
	y_new.style.webkitTransform="rotateY(" + ny + "deg)";
	y_new.style.OTransform="rotateY(" + ny + "deg)";
	y_new.style.MozTransform="rotateY(" + ny + "deg)";
	if (ny==180 || ny>=360)
	{
		clearInterval(rotYINT);
		if (ny>=360){ny=0;}
		if (rc<=rc_m) {
			rc+=1;
			rotateYDIV();
		} else {
			$(y_new).css('box-shadow','none');
			y_new.style.webkitTransform=null;
			y_new.style.transform=null;
			y_new.style.OTransform=null;
			y_new.style.MozTransform=null;
			
		}
	}
}
*/
//<<donate

//settings chk
var chk = function ()
{
    var username = (localStorage.utorrent_login !== undefined) ? localStorage.utorrent_login : '';
    var userpassword = (localStorage.utorrent_password !== undefined) ? localStorage.utorrent_password : '';
    var uturl = localStorage.utorrent_ip;
    var utport = localStorage.utorrent_port;
    var utpath = localStorage.utorrent_path;
    var manager_interval = localStorage.utorrent_manager_interval*1000;
    if (username === undefined || userpassword === undefined || uturl === undefined || utport === undefined || utpath === undefined || manager_interval === undefined)
        return false;
    return true;
}
//<<sett chk

//localization
var translate_page = function() {
    function write_UI()
    {
        var username = (localStorage.utorrent_login !== undefined) ? localStorage.utorrent_login : '';
        var userpassword = (localStorage.utorrent_password !== undefined) ? localStorage.utorrent_password : '';
        var uturl = localStorage.utorrent_ip;
        var utport = localStorage.utorrent_port;
        var utpath = localStorage.utorrent_path;
        return "http://"+username+":"+userpassword+"@"+uturl+":"+utport+"/"+utpath;
    }

    $('a.refresh').attr('title',lang_arr[24]);
    $('a.donate').attr('title',lang_arr[25]);
    $('a.wui').attr('title',lang_arr[26]);
    $('a.play_all').attr('title',lang_arr[68]);
    $('a.pause_all').attr('title',lang_arr[67]);
    $('a[class=wui]').attr('href',write_UI());
    $('th.fl_name > div').attr('title',lang_arr[88][1]).html(lang_arr[88][0]);
    $('th.fl_size > div').attr('title',lang_arr[14][1]).html(lang_arr[14][0]);
    $('th.fl_comp > div').attr('title',lang_arr[79][1]).html(lang_arr[79][0]);
    $('th.fl_dune > div').attr('title',lang_arr[15][1]).html(lang_arr[15][0]);
    $('th.fl_prio > div').attr('title',lang_arr[89][1]).html(lang_arr[89][0]);
    $('th.chk_box > div').attr('title',lang_arr[91][0]);
    $('a.update').attr('title',lang_arr[91][1]);
    $('a.close').attr('title',lang_arr[91][2]);
    $('#fl_list_fix thead').html($('#fl_list_list thead').html());
}
//<localis

//write table
var writeTableHead = function ()
{
    var bg = chrome.extension.getBackgroundPage();
    table_colums = bg.engine.getTableColums();
    col_lang = bg.engine.getTableColums('lang');
    cols = bg.engine.getTableColums('pos');
    var table_head = '';
    var full_size = 0;
    function AddSwith(type)
    {
        switch (type) {
            case ('t_name'):
                full_size += table_colums[type][1];
                return '<th class="t_name" title="'+lang_arr[13][1]+'" width="'+table_colums[type][1]+'px">'+lang_arr[13][0]+'</th>';
                break;
            case ('t_size'):
                full_size += table_colums[type][1];
                return '<th class="t_size" title="'+lang_arr[14][1]+'" width="'+table_colums[type][1]+'px">'+lang_arr[14][0]+'</th>';
                break;
            case ('t_dune'):
                full_size += table_colums[type][1];
                return '<th class="t_dune" title="'+lang_arr[15][1]+'" width="'+table_colums[type][1]+'px">'+lang_arr[15][0]+'</th>';
                break;
            case ('t_status'):
                full_size += table_colums[type][1];
                return '<th class="t_status" title="'+lang_arr[16][1]+'" width="'+table_colums[type][1]+'px">'+lang_arr[16][0]+'</th>';
                break;
            case ('t_eta'):
                full_size += table_colums[type][1];
                return '<th class="t_eta" title="'+lang_arr[17][1]+'" width="'+table_colums[type][1]+'px">'+lang_arr[17][0]+'</th>';
                break;
            case ('t_down_speed'):
                full_size += table_colums[type][1];
                return '<th class="t_down_speed" title="'+lang_arr[18][1]+'" width="'+table_colums[type][1]+'px">'+lang_arr[18][0]+'</th>';
                break;
            case ('t_uplo_speed'):
                full_size += table_colums[type][1];
                return '<th class="t_uplo_speed" title="'+lang_arr[19][1]+'" width="'+table_colums[type][1]+'px">'+lang_arr[19][0]+'</th>';
                break;
            case ('t_seeds_peers'):
                full_size += table_colums[type][1];
                return '<th class="t_seeds_peers" title="'+lang_arr[20][1]+'" width="'+table_colums[type][1]+'px">'+lang_arr[20][0]+'</th>';
                break;
            case ('t_position'):
                full_size += table_colums[type][1];
                return '<th class="t_position" title="'+lang_arr[74][1]+'" width="'+table_colums[type][1]+'px">'+lang_arr[74][0]+'</th>';
                break;
            case ('t_ostalos'):
                full_size += table_colums[type][1];
                return '<th class="t_ostalos" title="'+lang_arr[75][1]+'" width="'+table_colums[type][1]+'px">'+lang_arr[75][0]+'</th>';
                break;
            case ('t_seeds'):
                full_size += table_colums[type][1];
                return '<th class="t_seeds" title="'+lang_arr[76][1]+'" width="'+table_colums[type][1]+'px">'+lang_arr[76][0]+'</th>';
                break;
            case ('t_peers'):
                full_size += table_colums[type][1];
                return '<th class="t_peers" title="'+lang_arr[77][1]+'" width="'+table_colums[type][1]+'px">'+lang_arr[77][0]+'</th>';
                break;
            case ('t_otdano'):
                full_size += table_colums[type][1];
                return '<th class="t_otdano" title="'+lang_arr[78][1]+'" width="'+table_colums[type][1]+'px">'+lang_arr[78][0]+'</th>';
                break;
            case ('t_poluchino'):
                full_size += table_colums[type][1];
                return '<th class="t_poluchino" title="'+lang_arr[79][1]+'" width="'+table_colums[type][1]+'px">'+lang_arr[79][0]+'</th>';
                break;
            case ('t_koeficient'):
                full_size += table_colums[type][1];
                return '<th class="t_koeficient" title="'+lang_arr[80][1]+'" width="'+table_colums[type][1]+'px">'+lang_arr[80][0]+'</th>';
                break;
            case ('t_dostupno'):
                full_size += table_colums[type][1];
                return '<th class="t_dostupno" title="'+lang_arr[81][1]+'" width="'+table_colums[type][1]+'px">'+lang_arr[81][0]+'</th>';
                break;
            case ('t_metka'):
                full_size += table_colums[type][1];
                return '<th class="t_metka" title="'+lang_arr[82][1]+'" width="'+table_colums[type][1]+'px">'+lang_arr[82][0]+'</th>';
                break;
            case ('t_time_dobavleno'):
                full_size += table_colums[type][1];
                return '<th class="t_time_dobavleno" title="'+lang_arr[83][1]+'" width="'+table_colums[type][1]+'px">'+lang_arr[83][0]+'</th>';
                break;
            case ('t_time_zavircheno'):
                full_size += table_colums[type][1];
                return '<th class="t_time_zavircheno" title="'+lang_arr[84][1]+'" width="'+table_colums[type][1]+'px">'+lang_arr[84][0]+'</th>';
                break;
            case ('t_controls'):
                full_size += table_colums[type][1];
                return '<th class="t_controls l" title="'+lang_arr[21][1]+'" width="'+table_colums[type][1]+'px">'+lang_arr[21][0]+'</th>';
                break;
        }
        return '';
    }
    var vl = '';
    for (i=1;i<=20;i++)
    {
        $.each(table_colums, function(key, value) {
            if (value[2]==i)
            {
                table_head+=AddSwith(key);
                vl += 'th.'+key+', td.'+key+', td.'+key+' > div {max-width:'+value[1]+'px; min-width:'+value[1]+'px}'+" ";
            }
        });
    }
    $('table.tr-list.list > thead > tr.head').html(table_head);
    $('table.tr-list.list').css('width',full_size+'px');
    vl += 'body { height: '+monitor_height+'px; }'+" ";
    return vl;
};
//<<<<<<<<<<

//table resize
var rsz_table = function ()
{
    var w = parseInt($('table.tr-list.list').width()+20);
    if (w<=800)
    {
        if (w<=750) w = 750;
        $('table.tr-list.list').css('width','100%');
        $('body').css('width',w+'px');
    } else {
        $('body').css('width','800px');
    }
}
//<<<<<<<<<<<<

//run script

if (!chk()) {
    window.location = "options.html";
} else
    $(function() {
        $('head').append('<style name="head_st">'+writeTableHead()+'</style>');
        translate_page();
        header = $("#tr_list_list thead").clone();
        fixedHeader = $("#tr_list_fix").append(header);
        fixedFlTab = $('#fl_list_fix');
        rsz_table();
        manager.run_graph();
        manager.init_timer();
        $('#label_select').selectBox();
        $('#tree_select').selectBox();
        $('#label_select').unbind().change(function(){
            manager.selectLabel(this);
        }).keyup(function(){
            manager.selectLabel(this);
        });
        $('#tree_select').unbind().change(function(){
            manager.selectTree(this);
        }).keyup(function(){
            manager.selectTree(this);
        });
        $('.tr-box').css({
            'min-height':monitor_height-51,
            'max-height':monitor_height-51
        });
        $(window).resize(function() {
            $('.tr-box').css({
                'min-height':$('html').height()-51,
                'max-height':$('html').height()-51
            });
        });
        manager.writeList();
        $('a.refresh').unbind().bind({
            dblclick: function() {
                var bg = chrome.extension.getBackgroundPage();
                bg.engine.fullReloadList();
            },
            click: function() {
                manager.refreshBt();
                return false;
            }
        });
        $('a.play_all').unbind().click(function(){
            manager.actionUnpause_all();
            return false;
        });
        $('a.pause_all').unbind().click(function(){
            manager.actionPause_all();
            return false;
        });
        $(window).unload(function () {
            var bg = chrome.extension.getBackgroundPage();
            bg.engine.dieDOM();
        });
        manager.createColumContextMenu();
        $('div.tb_box').scroll(function() {
            var offset = $(this).scrollTop();
            if (offset >= 34 && $(fixedFlTab).is(":hidden")) {
                $(fixedFlTab).css({
                    'display':'inline',
                    'position':'fixed'
                });
            } else if (offset < 34) {
                $(fixedFlTab).css('display','none');
            }
        });
        $(fixedFlTab).css('width',$('#fl_list_list').css('width')+'px');
        $('body').height($('html').height());
        var t = getRandomArbitary(0,10000);
        if (t<6200 && t>5200)
            $('a.donate').css("background","url('images/pig.png') no-repeat center center");
    });
//<<<<<<<<<<<<<<<<<<<