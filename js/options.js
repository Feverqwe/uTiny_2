function isDOM()
{
    return 'opt';
}
function save_tab_list()
{
    var bg = chrome.extension.getBackgroundPage();
    var full_table_colums = bg.engine.load_table_colum();
    var cols = ['t_name','t_size','t_dune','t_status','t_eta','t_down_speed','t_uplo_speed','t_seeds_peers','t_position','t_ostalos',
    't_seeds','t_peers','t_otdano','t_poluchino','t_koeficient','t_dostupno','t_metka','t_time_dobavleno','t_time_zavircheno','t_controls'];
    if (localStorage.colums_arr===undefined)
    {
        //старый код>
        var en_list = '';
        var pos_list = '';
        for (var q=0;q<20;q++)
        {
            for (var i=0;i<20;i++)
            {
                if ($('#writeTabList').children('li').eq(i).attr('id')==cols[q])
                {
                    if ($('#writeTabList').children('li').eq(i).children('input:checkbox').attr('checked')=='checked')
                    {
                        full_table_colums[cols[q]][0] = 1;
                        en_list += '1';
                    } else {
                        en_list += '0';
                        full_table_colums[cols[q]][0] = 0;
                    }
                    pos_list += (i+1);
                    full_table_colums[cols[q]][2] = i+1;
                    if (q!=19) {
                        en_list+=',';
                        pos_list+=',';
                    }
                }
            }
        }
        if (localStorage.colums != en_list || localStorage.colums_pos != pos_list)
            delete localStorage.MainListSort;
        localStorage.colums = en_list;
        localStorage.colums_pos = pos_list;
        if (localStorage.colums!==undefined)
            delete localStorage.colums;
        if (localStorage.colums_pos!==undefined)
            delete localStorage.colums_pos;
        localStorage.colums_arr = JSON.stringify(full_table_colums);
    //<старый код
    } else {
        for (var q=0;q<20;q++) {
            for (var i=0;i<20;i++) {
                if ($('#writeTabList').children('li').eq(i).attr('id')==cols[q]) {
                    if ($('#writeTabList').children('li').eq(i).children('input:checkbox').attr('checked')=='checked') {
                        full_table_colums[cols[q]][0] = 1;
                    } else {
                        full_table_colums[cols[q]][0] = 0;
                    }
                    full_table_colums[cols[q]][2] = i+1;
                }
            }
        }
        if (localStorage.colums_arr!=JSON.stringify(full_table_colums)) {
            delete localStorage.MainListSort;
            localStorage.colums_arr = JSON.stringify(full_table_colums);
        }
    }
}
function save_options() {
    save_tab_list();
    var lang = $('select[name=lang]').val();
    var obj = null;
    obj = $('#utorrent_ip');
    var ip = (obj.val()=='') ? obj.attr('placeholder') : obj.val();
    obj = $('#utorrent_port');
    var port = (obj.val()=='' || parseInt(obj.val())<1) ? obj.attr('placeholder') : obj.val();	
    obj = $('#utorrent_interval');
    var interval = (obj.val()=='' || parseInt(obj.val())<1) ? obj.attr('placeholder') : obj.val();
    obj = $('#utorrent_note_interval');
    var note_interval = (obj.val()=='' || parseInt(obj.val())<0) ? obj.attr('placeholder') : obj.val();
    obj = $('#monitor_height');
    var monitor_height = (obj.val()=='' || parseInt(obj.val())<100) ? obj.attr('placeholder') : obj.val();
    obj = $('#utorrent_manager_interval');
    var manager_interval = (obj.val()=='' || parseInt(obj.val())<1) ? obj.attr('placeholder') : obj.val();
    obj = $('#utorrent_path');
    var path = (obj.val()=='') ? obj.attr('placeholder') : obj.val();
    var login = $('#utorrent_login').val();
    var password = $('#utorrent_password').val();
    localStorage.encoding = 1;
    login = encodeURIComponent(login);
    password = encodeURIComponent(password);
    var note_enable = (document.getElementById('note_enable').checked) ? '1' : '0';
    var hide_finished = (document.getElementById('hide_finished').checked) ? '1' : '0';
    var graph_enable = (document.getElementById('graph_enable').checked) ? '1' : '0';
    var autosort = (document.getElementById('autosort').checked) ? '1' : '0';
    var fl_auto_update = (document.getElementById('fl_auto_update').checked) ? '1' : '0';
    var counter = (document.getElementById('counter').checked) ? '1' : '0';
    //var vlc_active = (document.getElementById('vlc_active').checked) ? '1' : '0';
    //var vlc_for_mp4 = (document.getElementById('vlc_for_mp4').checked) ? '1' : '0';
    //if (vlc_active=='0') vlc_for_mp4 = '0';
    var hide_seeding = (document.getElementById('hide_seeding').checked) ? '1' : '0';
    var use_https = (document.getElementById('use_https').checked) ? '1' : '0';
    var ctx_link_menu = (document.getElementById('ctx_link_menu').checked) ? '1' : '0';
    var note_link_enable = (document.getElementById('note_link_enable').checked) ? '1' : '0';
    var go_in_downloads = (document.getElementById('go_in_downloads').checked) ? '1' : '0';
    localStorage.utorrent_ip = ip;
    localStorage.utorrent_port = port;
    localStorage.utorrent_interval = interval;
    localStorage.utorrent_note_interval = note_interval;
    localStorage.monitor_height = monitor_height;
    localStorage.lang = lang;
    localStorage.utorrent_manager_interval = manager_interval;
    localStorage.utorrent_path = path;
    localStorage.utorrent_login = login;
    localStorage.utorrent_password = password;
    localStorage.note_enable = note_enable;
    localStorage.hide_finished = hide_finished;
    localStorage.graph_enable = graph_enable;
    localStorage.autosort = autosort;
    localStorage.fl_auto_update = fl_auto_update;
    localStorage.counter = counter;
    //localStorage.vlc_for_mp4 = vlc_for_mp4;
    //localStorage.vlc_active = vlc_active;
    localStorage.hide_seeding = hide_seeding;
    localStorage.use_https = use_https;
    localStorage.ctx_link_menu = ctx_link_menu;
    localStorage.note_link_enable = note_link_enable;
    localStorage.go_in_downloads = go_in_downloads;
    localStorage.folders_array = JSON.stringify(create_arr());
	
    chrome.browserAction.setBadgeText({
        "text" : ''
    });
    updateGUIurl();
    var bg = chrome.extension.getBackgroundPage();
    bg.engine.updateSetup();
    updateStatus();
    restore_options();	
    rullback = JSON.stringify(localStorage);		
}
function updateGUIurl(){
    var	use_https = (localStorage.use_https !== undefined) ? localStorage.use_https : 0;
    var proto_https = (use_https==1) ? 'https' : 'http';
    if (localStorage.utorrent_ip !== undefined&&localStorage.utorrent_port !== undefined&&localStorage.utorrent_path !== undefined)
        $('#url').html(proto_https+'://'+localStorage.utorrent_ip+':'+localStorage.utorrent_port+'/'+localStorage.utorrent_path);
    else
        $('#url').empty();
}
function updateStatus()
{
    var bg = chrome.extension.getBackgroundPage();
    var status = bg.engine.updateStatus(null);
    if (status=='progress') {
        this.setTimeout(function(){
            updateStatus();
        }, 500);
        $('label.status').html('<img src="images/loading.gif" />');
    }
    if (status=='ok') {
        $('label.status').html(lang_arr[37]).css('color','green');
        var t = chrome.extension.getViews({
            type:'popup'
        });
        if (t!=null&&t[0]!=null) {
            if (t[0].isDOM()=='opt')
                window.location = "manager.html";
        }
    }
    if (status=='error') {
        $('label.status').html((lang_arr[bg.engine.getNote()]!=null) ? lang_arr[bg.engine.getNote()] : bg.engine.getNote()).css('color','red');
    }		
}
function restore_options() {
    if (localStorage.lang !== undefined) {
        $('select[name=lang]').children('option[value='+localStorage.lang+']').attr('selected','selected');
    }
    var obj = null;
    obj = localStorage.utorrent_ip;
    if(obj!==undefined) $('#utorrent_ip').val(obj);
    obj = localStorage.utorrent_port;
    if(obj!==undefined) $('#utorrent_port').val(obj);
    obj = localStorage.utorrent_interval;
    if(obj!==undefined) $('#utorrent_interval').val(obj);
    obj = localStorage.utorrent_note_interval;
    if(obj!==undefined) $('#utorrent_note_interval').val(obj);
    obj = localStorage.monitor_height;
    if(obj!==undefined) $('#monitor_height').val(obj);
    obj = localStorage.utorrent_manager_interval;
    if(obj!==undefined) $('#utorrent_manager_interval').val(obj);
    obj = localStorage.utorrent_path;
    if(obj!==undefined) $('#utorrent_path').val(obj);
    obj = (localStorage.utorrent_login !== undefined) ? localStorage.utorrent_login : '';
    var encoding_pwd = (localStorage.encoding !== undefined) ? localStorage.encoding : 0;
    if(obj!==undefined) $('#utorrent_login').val((encoding_pwd == 1) ? decodeURIComponent(obj) : obj);
    obj = (localStorage.utorrent_password !== undefined) ? localStorage.utorrent_password : '';
    if(obj!==undefined) $('#utorrent_password').val((encoding_pwd == 1) ? decodeURIComponent(obj) : obj);
    obj = localStorage.note_enable;
    if(obj=='1') document.getElementById('note_enable').checked=true;
    if(obj===undefined) document.getElementById('note_enable').checked=true;
		
    obj = localStorage.hide_finished;
    if(obj=='1') document.getElementById('hide_finished').checked=true;
	
    obj = localStorage.graph_enable;
    if(obj=='1') document.getElementById('graph_enable').checked=true;
    if(obj===undefined) document.getElementById('graph_enable').checked=true;
		
    obj = localStorage.note_link_enable;
    if(obj=='1') document.getElementById('note_link_enable').checked=true;
    if(obj===undefined) document.getElementById('note_link_enable').checked=true;
		
    obj = localStorage.go_in_downloads;
    if(obj=='1') document.getElementById('go_in_downloads').checked=true;
    if(obj===undefined) document.getElementById('go_in_downloads').checked=false;
		
    obj = localStorage.ctx_link_menu ;
    if(obj=='1') document.getElementById('ctx_link_menu').checked=true;
    if(obj===undefined) document.getElementById('ctx_link_menu').checked=true;
		
    obj = localStorage.autosort;
    if(obj=='1') document.getElementById('autosort').checked=true;
    if(obj===undefined) document.getElementById('autosort').checked=false;
		
    obj = localStorage.fl_auto_update;
    if(obj=='1') document.getElementById('fl_auto_update').checked=true;
    if(obj===undefined) document.getElementById('fl_auto_update').checked=true;
		
    obj = localStorage.counter;
    if(obj=='1') document.getElementById('counter').checked=true;
    if(obj===undefined) document.getElementById('counter').checked=false;
		
    /*var obj = localStorage.vlc_for_mp4;
	if(obj=='1') document.getElementById('vlc_for_mp4').checked=true;*/
		
    /*var obj = localStorage.vlc_active;
	if(obj=='1') document.getElementById('vlc_active').checked=true;
	if(obj=='0'||obj===undefined) document.getElementById('vlc_for_mp4').checked=false;*/
		
    obj = localStorage.hide_seeding;
    if(obj=='1') document.getElementById('hide_seeding').checked=true;
		
    obj = localStorage.use_https;
    if(obj=='1') document.getElementById('use_https').checked=true;
		
    $('select[name=lang]').change(function () {
        var lang = (localStorage.lang !== undefined) ? localStorage.lang : 'en';
        if ($(this).val()!=lang) {
            localStorage.lang = $(this).val();
            top.location.reload();
        }
    });
	
    var folders_arr = localStorage.folders_array;
    if(folders_arr!==undefined) {
        folders_arr = JSON.parse(folders_arr);
        var folders_len = folders_arr.length;
        $('#paths').empty();
        for (var i=0;i<folders_len;i++)
            $('#paths').append($('<option>', {
                value : '{"key":"'+folders_arr[i][0]+'","val":"'+folders_arr[i][1]+'"}'
            }).text(folders_arr[i][0]+'/'+folders_arr[i][1]));
    }
		
    updateGUIurl();
}
var backup_update = function () {
    $('#backup').children('textarea').val(JSON.stringify(localStorage));
}
var restore_settings = function () {
    try {
        var rst = JSON.parse($('#restore').children('textarea').val());
        $.each(rst, function(key, value) {
            localStorage[key] = value;
        });
        restore_options();
        $('#rollback_btn').css('display','block');
        $('#writeTabList').empty();
        writeTabList();
    } catch(err) {
        alert(lang_arr[108][1]);
    }
}
var rollback_settings = function () {
    try {
        var rst = JSON.parse(rullback);
        $.each(rst, function(key, value) {
            localStorage[key] = value;
        });
        restore_options();
		
        $('#writeTabList').empty();
        writeTabList();
    } catch(err) {
        alert(lang_arr[108][0]);
    }
}
function writeTabList()
{
    var bg = chrome.extension.getBackgroundPage();
    var full_table_colums = bg.engine.load_table_colum();
    var st = 0;
    $.each(full_table_colums, function(key, value) {
        if (value[0]==1)
            st = 'checked="checked"'; else st = '';
        $('#writeTabList').append('<li id="'+key+'"><input type="checkbox" '+st+' onclick="checker_f(this);"/>'+lang_arr[value[3]][1]+'<img class="drageble" style="margin-top: 3px;" src="images/draggable.png"/></li>');
    });
}
function defTables()
{
    var full_table_colums = {
        //[13,74,14,75,15,16,76,77,20,18,19,17,78,79,80,81,82,83,84,21]
        't_name' : [1,200,1,13],
        't_position' : [0,20,2,74],
        't_size' : [1,60,3,14],
        't_ostalos' : [0,60,4,75],
        't_dune' : [1,70,5,15],
        't_status' : [1,70,6,16],
        't_seeds' : [0,30,7,76],
        't_peers' : [0,30,8,77],
        't_seeds_peers' : [1,40,9,20],
        't_down_speed' : [1,60,10,18],
        't_uplo_speed' : [1,60,11,19],
        't_eta' : [1,70,12,17],
        't_otdano' : [0,60,13,78],
        't_poluchino' : [0,60,14,79],
        't_koeficient' : [0,60,15,80],
        't_dostupno' : [0,60,16,81],
        't_metka' : [0,100,17,82],
        't_time_dobavleno' : [0,120,18,83],
        't_time_zavircheno' : [0,120,19,84],
        't_controls' : [1,57,20,21]
    //[0-активность,1-размер,2-позиция,3-язык]
    }
    $('#writeTabList').empty();
    var st = 0;
    $.each(full_table_colums, function(key, value) {
        if (value[0]==1)
            st = 'checked="checked"'; else st = '';
        $('#writeTabList').append('<li id="'+key+'"><input type="checkbox" '+st+' onclick="checker_f(this);"/>'+lang_arr[value[3]][1]+'<img class="drageble" style="margin-top: 3px;" src="images/draggable.png"/></li>');
    });
}
function checker_f(obj)
{
    if (obj.checked)
        $(obj).attr('checked','checked');
    else
        $(obj).removeAttr('checked');
}
var create_arr = function () {
    var opt = $('#paths').children('option');
    var opt_l = opt.length;
    var arr = new Array();
    ;
    var obj = '';
    for (var i=0;i<opt_l;i++)
    {
        obj = jQuery.parseJSON(opt.eq(i).val());
        arr[i] = [obj['key'],obj['val']];
    }
    return arr;
}
var get_list = function ()
{
    if ($('#folder_path').val()==null)
    {
        $('#folder_path').css('background-color','#EEE');
    }
    var bg = chrome.extension.getBackgroundPage();
    if (bg.engine.updateStatus(null)=='ok') {
        bg.engine.actionSend(null,'list-dirs',false);
        window.setTimeout(function(){
            $('#folder_path').css('background-color','#FFF');
            var arrs = bg.engine.get_folders();
            $('#folder_path').empty();
            $.each(arrs, function(key, value) {
                $('#folder_path').append($('<option>', {
                    value : key
                }).text('['+bytesToSize(value['available']*1024*1024)+' '+lang_arr[107][1]+'] '+value['path']));
            });
        }, 1000);
    } else {
        alert(lang_arr[107][0]);
        $('#folder_path').css('background-color','#FFF');
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
var translate_page = function () {
    $('input[name=rollback_trigger]').val(lang_arr[108][2]);
    $('input[name=restore_trigger]').val(lang_arr[108][3]);
    $('input[name=backup_trigger]').val(lang_arr[108][4]);
    $('input[name=default_settings]').val(lang_arr[85]);
    $('input[name=path_remove]').val(lang_arr[107][3]);
    $('input[name=path_add]').val(lang_arr[107][2]);
    $('input.button[name=save]').val(lang_arr[62]);
    $('h2[data-lang=39]').html(lang_arr[39]);
    $('legend[data-lang=63]').html(lang_arr[63]);
    $('div[data-lang=64]').html(lang_arr[64]);
    $('option[data-lang=65_0]').html(lang_arr[65][0]);
    $('option[data-lang=65_1]').html(lang_arr[65][1]);
    $('legend[data-lang=40]').html(lang_arr[40]);
    $('div[data-lang=41]').html(lang_arr[41]);
    $('div[data-lang=42]').html(lang_arr[42]);
    $('div[data-lang=43]').html(lang_arr[43]);
    $('div[data-lang=44]').html(lang_arr[44]);
    $('div[data-lang=66]').html(lang_arr[66]);
    $('legend[data-lang=45]').html(lang_arr[45]);
    $('div[data-lang=46]').html(lang_arr[46]);
    $('div[data-lang=47]').html(lang_arr[47]);
    $('legend[data-lang=48]').html(lang_arr[48]);
    $('div[data-lang=49]').html(lang_arr[49]);
    $('div[data-lang=50_0]').html(lang_arr[50][0]);
    $('span[data-lang=50_1]').html(lang_arr[50][1]);
    $('div[data-lang=51_0]').html(lang_arr[51][0]);
    $('span[data-lang=51_1]').html(lang_arr[51][1]);
    $('legend[data-lang=108_7]').html(lang_arr[108][7]);
    $('legend[data-lang=107_6]').html(lang_arr[107][6]);
    $('legend[data-lang=97]').html(lang_arr[97]);
    $('legend[data-lang=95]').html(lang_arr[95]);
    $('legend[data-lang=52]').html(lang_arr[52]);
    $('div[data-lang=53_0]').html(lang_arr[53][0]);
    $('div[data-lang=54]').html(lang_arr[54]);
    $('div[data-lang=55]').html(lang_arr[55]);
    $('div[data-lang=72]').html(lang_arr[72]);
    $('div[data-lang=92]').html(lang_arr[92]);
    $('div[data-lang=56_0]').html(lang_arr[56][0]);
    $('span[data-lang=56_1]').html(lang_arr[56][1]);
    $('div[data-lang=86_0]').html(lang_arr[86][0]);
    $('div[data-lang=96]').html(lang_arr[96]);
    $('div[data-lang=94_0]').html(lang_arr[94][0]);
    $('div[data-lang=94_1]').html(lang_arr[94][1]);
    $('div[data-lang=98]').html(lang_arr[98]);
    $('div[data-lang=99]').html(lang_arr[99]);
    $('div[data-lang=105]').html(lang_arr[105]);
    $('center[data-lang=107_7]').html(lang_arr[107][7]);
    $('span[data-lang=107_5]').html(lang_arr[107][5]);
    $('span[data-lang=107_4]').html(lang_arr[107][4]);
    $('a[data-lang=108_6]').html(lang_arr[108][6]);
    $('a[data-lang=108_5]').html(lang_arr[108][5]);
    $('div[data-lang=109]').html(lang_arr[109]);
}
$(function() {
    translate_page();
    var rullback = JSON.stringify(localStorage);
    $('#backup_btn').unbind('click').click(function () {
        $('#backup').css('display','block');
        $('#backup_btn').attr('class','active');
        $('#restore').css('display','none');
        $('#restore_btn').attr('class','inactive');
        backup_update();
        return false;
    });
    $('#restore_btn').unbind('click').click(function () {
        $('#restore').css('display','block');
        $('#restore_btn').attr('class','active');
        $('#backup').css('display','none');
        $('#backup_btn').attr('class','inactive');
        return false;
    });
    $('input[name=restore_trigger]').unbind('click').click(function(){
        restore_settings();
        return false;
    });
    $('input[name=rollback_trigger]').unbind('click').click(function(){
        rollback_settings();
        return false;
    });
    $('input[name=default_settings]').unbind('click').click(function(){
        defTables();
        return false;
    });
    $('input[name=backup_trigger]').unbind('click').click(function(){
        backup_update();
        return false;
    });
    $('select[name=folder_path]').unbind('click').click(function(){
        get_list();
    });	
	
    writeTabList();
    $( ".sortable" ).sortable();
    $( ".sortable" ).disableSelection();
    $('#path_add').unbind('click').click(function(){
        if ($('#folder_path').val()==null) return;
        var path = $('#folder_path :selected').val();
        var path_text = $('#folder_path :selected').text();
        var sub_path = $('#folder_subpath').val();
        $('#paths')
        .append($('<option>', {
            value : '{"key":"'+path+'","val":"'+sub_path+'"}'
        }).text(path+'/'+sub_path)); 
        $('#folder_subpath').val('');
    });
    $('#path_remove').unbind('click').click(function(){
        $('#paths :selected').remove();
    });
    $('form[name=save_opt]').submit(function () {
        save_options();
        return false;
    });	
    restore_options();
});