var engine = function () {	
    var encoding_pwd = (localStorage.encoding !== undefined) ? localStorage.encoding : 0;
    var username = (localStorage.utorrent_login !== undefined) ? localStorage.utorrent_login : '';
    var userpassword = (localStorage.utorrent_password !== undefined) ? localStorage.utorrent_password : '';
    var uturl = localStorage.utorrent_ip;
    var utport = localStorage.utorrent_port;
    var utpath = localStorage.utorrent_path;
    var complite_url = uturl+":"+utport+"/"+utpath;
    var interval = (localStorage.utorrent_interval !== undefined) ? localStorage.utorrent_interval*1000 : 60000;
    var note_interval = (localStorage.utorrent_note_interval !== undefined) ? localStorage.utorrent_note_interval*1000 : 6000;
    var note_enable = (localStorage.note_enable !== undefined) ? localStorage.note_enable : 1;
    var note_link_enable = (localStorage.note_link_enable !== undefined) ? localStorage.note_link_enable : 1;
    var ctx_link_menu = (localStorage.ctx_link_menu !== undefined) ? localStorage.ctx_link_menu : 1;
    var	use_https = (localStorage.use_https !== undefined) ? localStorage.use_https : 0;
    var	go_in_downloads = (localStorage.go_in_downloads !== undefined) ? localStorage.go_in_downloads : 0;
    var proto_https = (use_https==1) ? 'https' : 'http';
    var token = '';
    var torarr = {};
    var	labelsarr = {};
    var err_count = 0;
    var update_count = 0;
    var update = false;
    var next_cid = 0;
    var setup_note = '';
    var setup_status = 'progress';
    var fail_conn = 0;
    var timer_status = false;
    var windowsDOM = null;
    var down_upl_limit = [-1,-1];
    var last_update_time = 0;
    var stack_status = new Array(0,0,0);
    /*
		0 - token 0 - false
		1 - getList 0 - false
		2 - action 0 - false
	*/
    var context_menu = [];
    var folder_paths = [];
    var	counter_enable = (localStorage.counter !== undefined) ? localStorage.counter : 0;
    var active_torrents = []; 
    var count_active_torrents = 0; //показывает на иконке количество активных торрентов (кэш) чтоб не переписывать
    var table_colum = {
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
    var colum_list = {};
    var colum_exist = false;
    var table_pos_arr = [];
    var table_lang_arr = [];
    var media_arr = {};
    var load_table_colum = function ()
    {
        if (localStorage.colums_arr===undefined)
        {
            //старый код>
            var cols = ['t_name','t_size','t_dune','t_status','t_eta','t_down_speed','t_uplo_speed','t_seeds_peers','t_position','t_ostalos',
            't_seeds','t_peers','t_otdano','t_poluchino','t_koeficient','t_dostupno','t_metka','t_time_dobavleno','t_time_zavircheno','t_controls'];
            var list_act = localStorage.colums;
            if (list_act !== undefined)
            {
                list_act = list_act.split(',');
                for (var i=0;i<20;i++)
                {
                    if (list_act[i] !== undefined)
                        table_colum[cols[i]][0] = list_act[i];
                }
            }
            var list_pos = localStorage.colums_pos;
            if (list_pos !== undefined)
            {
                list_pos = list_pos.split(',');
                for (var i=0;i<20;i++)
                {
                    if (list_pos[i] !== undefined)
                        table_colum[cols[i]][2] = list_pos[i];
                }
            }
        //<старый код
        } else {
            table_colum = JSON.parse(localStorage.colums_arr);
        }
        colum_exist = false;
        return table_colum;
    }
    var save_table_colum = function ()
    {
        if (localStorage.colums_arr===undefined&&
            localStorage.colums!==undefined&&
            localStorage.colums_pos!==undefined)
            {
            //старый код>
            var cols = ['t_name','t_size','t_dune','t_status','t_eta','t_down_speed','t_uplo_speed','t_seeds_peers','t_position','t_ostalos',
            't_seeds','t_peers','t_otdano','t_poluchino','t_koeficient','t_dostupno','t_metka','t_time_dobavleno','t_time_zavircheno','t_controls'];
            var list_act = [];
            var list_pos = [];
            for (var i=0;i<20;i++)
            {
                list_act[i] = table_colum[cols[i]][0];
                list_pos[i] = table_colum[cols[i]][2];
            }
            localStorage.colums = list_act;
            localStorage.colums_pos = list_pos;
            localStorage.colums_arr = JSON.stringify(table_colum);
        //<старый код
        } else
            localStorage.colums_arr = JSON.stringify(table_colum);
    }
    var getTableColums = function (t)
    {
        if (colum_exist==false)
        {
            table_lang_arr = [];
            table_pos_arr = [];
            load_table_colum();
            colum_list = {};
            for (i=1;i<=20;i++)
            {
                $.each(table_colum, function(key, value) {
                    if (value[2]==i)
                    {
                        table_pos_arr[i-1] = key;
                        table_lang_arr[i-1] = value[3];
                        if (value[0]==1)
                        {
                            colum_list[key]=[1,value[1],value[2]];
                        }
                    }
                });
            }
            colum_exist = true;
        }
        if (t==null)
            return colum_list;
        else
        if (t=='lang')
            return table_lang_arr;
        else
        if (t=='pos')
            return table_pos_arr;
    }
    var updateStatus = function (s)
    {
        if (s!=null&&s == '') s = 'progress';
        if (s!=null) { 
            setup_status = s;
            if (chkDOM())
                windowsDOM.manager.writeStatus(s,setup_note);
        }
        return setup_status;
    }
    var getNote = function ()
    {
        return setup_note;
    }
    var updateSetup = function ()
    {
        username = (localStorage.utorrent_login !== undefined) ? localStorage.utorrent_login : '';
        userpassword = (localStorage.utorrent_password !== undefined) ? localStorage.utorrent_password : '';
        uturl = localStorage.utorrent_ip;
        use_https = localStorage.use_https;
        proto_https = (use_https==1) ? 'https' : 'http';
        utport = localStorage.utorrent_port;
        utpath = localStorage.utorrent_path;
        complite_url = uturl+":"+utport+"/"+utpath;
        interval = localStorage.utorrent_interval*1000;
        counter_enable = localStorage.counter;
        note_interval = localStorage.utorrent_note_interval*1000;
        note_enable = localStorage.note_enable;
        note_link_enable = localStorage.note_link_enable;
        ctx_link_menu = localStorage.ctx_link_menu;
        go_in_downloads = localStorage.go_in_downloads;
        if (ctx_link_menu==0)
            chrome.contextMenus.removeAll();
        else
            add_context_menu();
        setup_status = 'progress';
        setup_note = '';
        if (checkSetup()==false) {
            stopTimer();
            updateStatus('error');
            return false;
        }
        load_table_colum();
        torarr = {};
        labelsarr = {};
        err_count = 0;
        update_count = 0;
        active_torrents = [];
        count_active_torrents = -1;
        update = false;
        getToken(true);
		
    }
    var checkSetup = function ()
    {
        if (username === undefined) {
            setup_note=27;
            return false;
        }
        if (userpassword === undefined) {
            setup_note=28;
            return false;
        }
        if (uturl === undefined) {
            setup_note=29;
            return false;
        }
        if (utport === undefined) {
            setup_note=30;
            return false;
        }
        if (utpath === undefined) {
            setup_note=31;
            return false;
        }
        if (interval === undefined) {
            setup_note=32;
            return false;
        }
        if (note_enable === undefined) {
            note_enable=1;
        }
        if (use_https === undefined) {
            use_https=0;
        }
        proto_https = (use_https==1) ? 'https' : 'http';
        if (note_interval === undefined) {
            note_interval=6000;
        }
        return true;
    }
    var getAuthCookie = function () {
        var cn = "Authorization=";
        var idx = document.cookie.indexOf(cn)
        if (idx != -1) {
            var end = document.cookie.indexOf(";", idx + 1);
            if (end == -1) end = document.cookie.length;
            return unescape(document.cookie.substring(idx + cn.length, end));
        } else {
            return "";
        }
    }
    var getToken = function (debug)
    {
        updateStatus('progress');
        var ts = (new Date()).getTime();
        if (ts-last_update_time<100)
        {
            if (stack_status[0]==0)
            {
                stack_status[0] = 1;
                this.setTimeout(function(){
                    getToken(debug)
                }, 100);
            }
            return;
        }
        stack_status[0] = 0;
        last_update_time = ts;
		
        var header = "Basic " + window.btoa(username + ":" + userpassword);
        document.cookie = "Authorization=" + header;
		
        $.ajax({
            type: "GET",
            url: proto_https+"://"+complite_url+"token.html",
            beforeSend: function(xhr) {
                xhr.setRequestHeader("Authorization", getAuthCookie());
            },
            success: function(msg){
                token = $(msg).html();
                next_cid = 0;
                fail_conn = 0;
                getTorrentList(debug);
                down_upl_limit = [-1,-1];
                if (chkDOM())
                    windowsDOM.manager.writeList();
            },
            statusCode: {
                400: function() {
                    setup_note = 38;
                    updateStatus('error');
                    fail_conn = fail_conn+1;
                    if (fail_conn>10)
                    {
                        stopTimer();
                        fail_conn = 0;
                    }
                },
                401: function() {
                    setup_note = 34;
                    updateStatus('error');
                    fail_conn = fail_conn+1;
                    if (fail_conn>10)
                    {
                        stopTimer();
                        fail_conn = 0;
                    }
                },
                404: function() {
                    setup_note = 35;
                    updateStatus('error');
                    fail_conn = fail_conn+1;
                    if (fail_conn>10)
                    {
                        stopTimer();
                        fail_conn = 0;
                    }
                },
                0: function() {
                    setup_note = 36;
                    updateStatus('error');
                    fail_conn = fail_conn+1;
                    if (fail_conn>10)
                    {
                        stopTimer();
                        fail_conn = 0;
                    }
                }
            },
            error:function (xhr, ajaxOptions, thrownError){
                if (xhr.status==0||xhr.status==404||xhr.status==401)
                {
				
                } else {
                    setup_note = lang_arr[71]+xhr.status+' '+thrownError;
                    updateStatus('error');
                    fail_conn = fail_conn+1;
                    if (fail_conn>10)
                    {
                        stopTimer();
                        fail_conn = 0;
                    }
                }
            }
        });
    }
    var getTorrentList = function (debug,file_list)
    {
        if (update) return false;
        if (token=='')
        {
            getToken(debug);
            return false;
        }
        var ts = (new Date()).getTime();
        if (ts-last_update_time<100)
        {
            if (stack_status[1]==0)
            {
                stack_status[1] = 1;
                this.setTimeout(function(){
                    getTorrentList(debug,file_list)
                }, 100);
            }
            return false;
        }
        stack_status[1] = 0;	
        update = true;
        //updateStatus('progress');
        last_update_time = ts;
        var fl_url = '';
        if (file_list!=null)
        {
            fl_url = file_list;
        }
        $.ajax({
            type: "GET",
            url: proto_https+"://"+complite_url+"?token="+token+"&list=1&cid="+next_cid+"&t="+ts+fl_url,
            beforeSend: function(xhr) {
                xhr.setRequestHeader("Authorization", getAuthCookie());
            },
            success: function(msg, textStatus, xhr){
                err_count = 0;
                fail_conn = 0;
                var obj = jQuery.parseJSON(msg);
                next_cid = obj['torrentc'];
                if (obj['torrentm']!=null)
                    removeTr(obj['torrentm']);
                if (obj['label']!=null)
                    labelsarr = obj['label'];
                if (obj['torrents']!=null)
                {
                    torarr = {};
                    update_count = 0;
                    checkArr(obj['torrents']);
                    if (chkDOM())
                        windowsDOM.manager.writeList();
                }
                if (obj['torrentp']!=null)
                    checkArr(obj['torrentp']);
                if (obj['settings']!=null)
                    readSetting(obj['settings']);
                if (obj['files']!=null)
                    WriteFileList(obj['files']);
                if (debug)
                {
                    stopTimer();
                    startTimer();
                }
                setup_note = 37;
                updateStatus('ok');
            },
            statusCode: {
                400: function() {
                    err_count = err_count+1;
                    setup_note = 38;
                    updateStatus('error');
                    if (err_count>10)
                    {
                        stopTimer();
                        err_count = 0;
                    }
                    else
                        getToken(debug);
                    update = false;
                },
                401: function() {
                    getToken(debug);
                    update = false;
                },
                0: function() {
                    setup_note = 36;
                    updateStatus('error');
                    if (debug)
                    {
                        err_count = 0;
                    }
                    err_count = err_count+1;
                    if (err_count>10)
                    {
                        stopTimer();
                        err_count = 0;
                    }
                    update = false;
                }
            },
            error:function (xhr, ajaxOptions, thrownError){
                if (xhr.status==0||xhr.status==400||xhr.status==401)
                {
                } else {
                    setup_note = lang_arr[71]+xhr.status+' '+thrownError;
                    updateStatus('error');
                    err_count = err_count+1;
                    if (err_count>10)
                    {
                        stopTimer();
                        err_count = 0;
                    }
                }
                update = false;
            }
        });
    }
    var remove_val_from_arr = function (removeItem,arr) {
        return jQuery.grep(arr, function(value) {
            return value != removeItem;
        });
    }
    var removeTr = function (arr)
    {
        var arrs = arr.length;
        for (i=0;i<arrs;i++)
        {
            if (chkDOM())
            {
                windowsDOM.manager.removeTr(arr[i])
            }
            $.each(torarr, function(key, value) { 
                var hash=value[4];
                if (hash == arr[i])
                {
                    delete torarr[key];
                    active_torrents = remove_val_from_arr(hash,active_torrents);
                }
            });
        }
    }
    var checkArr = function (arr)
    {
        var arrs = arr.length;
        var myarrs = torarr.length; //?
        var ex = false;
        var l_u_e = 0;
        var lost_up_arr = {};
        //var count_active_torrents_tmp = 0;
        for (i=0;i<arrs;i++)
        {
            ex = false;
            var f = arr[i][0]+arr[i][23];
            var ttarr = [ 
            arr[i][3] /* 0 РАЗМЕР */
            ,arr[i][4] /*  1 ПРОЦЕНТ ВЫПОЛНЕНИЯ */
            ,arr[i][21] /* 2 */
            ,arr[i][2] /* 3 ИМЯ */
            ,arr[i][0] /* 4 ХЭШ */
            ,arr[i][1] /* 5 STATUS */
            ,arr[i][9] /* 6 СКОРОСТЬ ЗАГРУЗКИ */
            ,arr[i][8] /* 7 СКОРОСТЬ РАЗДАЧИ */
            ,arr[i][14] /* 8 ПОДКЛЮЧЕНО СИДОВ */
            ,arr[i][12] /* 9 ПОДКЛЮЧЕНО ПИРОВ */
            ,arr[i][10] /* 10 ETA */
            ,arr[i][11] /* 11 МЕТКА  */
            ,arr[i][17] /* 12 ПОРЯДОК ОЧЕРЕДИ ТОРРЕНТОВ  */
            ,arr[i][15] /* 13 СИДЫ В РОЕ  */
            ,arr[i][13] /* 14 ПИРЫ В РОЕ */
            ,arr[i][18]/* 15 отдано */
            ,arr[i][5]/* 16 загружено */
            ,arr[i][7]/* 17 КОЭФФИЦИЕНТ */
            ,arr[i][6]/* 18 РОЗДАНО */
            ,arr[i][16]/* 19 ДОСТУПНОСТЬ */
            ,arr[i][23]/* 20 время старта */
            ,arr[i][24]/* 21 время завершения */
            ,arr[i][22]/* 22 sid */
            ,arr[i][26]/* 23 path_to_file */
            ];
            if ( torarr[f]!=null && arr[i][0]==torarr[f][4] )
            {
                //если торрент есть в списке и он был не докачен, а теперь докачен то выводит уведомление
                ex = true;
                if ( arr[i][4]==1000 && torarr[f][1]<1000 )
                {
                    getNotify(arr[i][0]);
                    active_torrents = remove_val_from_arr(arr[i][0],active_torrents);
                }
                torarr[f] = ttarr;
            }
            if (ex==false)
            {
                //если торрент не бы в списке и это не первый запрос списка торрентов и он сразу загружен то выводим уведомление
                if ( update_count > 1 && arr[i][4]==1000 )
                {
                    getNotify(arr[i][0]);
                    active_torrents = remove_val_from_arr(arr[i][0],active_torrents);
                }
                torarr[f] = ttarr;
            }
            if (counter_enable == 1)
                if (arr[i][4] < 1000)
                    if ($.inArray(arr[i][0],active_torrents) == -1) {
                        if ( arr[i][1]==201 )
                            active_torrents[active_torrents.length] = arr[i][0];
                    } else {
                        if ( arr[i][1]!=201 )
                            active_torrents = remove_val_from_arr(arr[i][0],active_torrents);
                    }
            lost_up_arr[f] = ttarr;
        }
        if (counter_enable == 1)
        {
            var count_active_torrents_tmp = active_torrents.length;
            if (count_active_torrents_tmp != count_active_torrents) {
                if ( count_active_torrents_tmp < 1 )
                    chrome.browserAction.setBadgeText({
                        "text" : ''
                    });
                else
                    chrome.browserAction.setBadgeText({
                        "text" : ''+count_active_torrents_tmp+''
                    });
                count_active_torrents = count_active_torrents_tmp;
            }
        }
        update_count = update_count+1;
        update = false;
        if (chkDOM())
            windowsDOM.manager.updateList(lost_up_arr);
    }
    var WriteFileList = function (obj)
    {
        if (chkDOM())
            windowsDOM.manager.UpdateFileList(obj);
    }
    var readSetting = function (obj)
    {
        var t=obj.length;
        var down_limit = 0;
        var upl_limit = 0;
        for (var i=0;i<t;i++)
        {
            if (obj[i][0]=='max_dl_rate')
                down_limit = obj[i][2];
            if (obj[i][0]=='max_ul_rate')
                upl_limit = obj[i][2];
        }
        down_upl_limit = [down_limit,upl_limit];
        if (chkDOM())
            windowsDOM.manager.UpdateSpeed(null,down_upl_limit);
    }
    var getLimites = function ()
    {
        actionSend(null,'getsettings',false);
    }
    var setLimites = function (down_limit,upl_limit)
    {
        down_upl_limit = [down_limit,upl_limit];
    }
    var getNotify = function (hash)
    {
        if (note_enable == 0) return;
		
        var ex_n = false;
        var n_arr = chrome.extension.getViews({
            type:'notification'
        });
        $.each(n_arr, function(key, value) {
            if (jQuery.isFunction(n_arr[key].getHash)==true)
                if (hash==n_arr[key].getHash())
                {
                    ex_n = true;
                }
        });
        if (ex_n) return;
        var notification = webkitNotifications.createHTMLNotification(
            /* 
		  'images/icon.png',  // icon url - can be relative
		  torr[3],  // notification title
		  lang_arr[57]+torr[2]  // notification body text 
		  */
            'notification.html?'+hash
            );
        notification.show();
        if (note_interval>0)
            this.setTimeout(function(){
                notification.cancel()
            }, note_interval);
    }
    var startTimer = function ()
    {
        if (note_enable == 0 && counter_enable == 0) return;
        timer_status = true;
        $('#timer').everyTime(interval, 'timer', function() {
            getTorrentList(false);
            if (update_count > 50)
            {
                update_count = 1;
            }
        });
    }
    var stopTimer = function ()
    {
        timer_status = false;
        $("#timer").stopTime('timer');
    }
    var fullReloadList = function ()
    {
        token = '';
    }
    var getArr = function ()
    {
        if (timer_status==false && (note_enable == 1 || counter_enable == 1))
            startTimer();
        return torarr;
    }
    var getLabels = function ()
    {
        return labelsarr;
    }
    var chkDOM = function ()
    {
        if (windowsDOM==null) return false;
        var t = chrome.extension.getViews({
            type:'popup'
        });
        if (t!=null) {
            windowsDOM = t[0];
            return true;
        } else {
            windowsDOM = null;
            return false;
        }
    }
    var setDOM = function ()
    {
        var t = chrome.extension.getViews({
            type:'popup'
        });
        if (t.length>1&&windowsDOM!=null) 
        {
            t[0].dieDOM();
            t[0] = t[1];
        }
        if (t!=null&&t[0]!=null&&jQuery.isFunction(t[0].isDOM)&&t[0].isDOM()==true) {
            if (windowsDOM==null)
            {
                windowsDOM = t[0];
                getTorrentList();
            }
            windowsDOM = t[0];
        }
    }
    var dieDOM = function ()
    {
        windowsDOM = null;
    }
    var actionSend = function (hash,action,list)
    {
        if (list!=false) list = true;
        var ts = (new Date()).getTime();
        if (ts-last_update_time<100)
        {
            this.setTimeout(function(){
                actionSend(hash,action,list)
            }, 100);
            return;
        }
        update = true;
        stopTimer();
        var url_action = (action!=null)?"&action="+action:'';
        var url_hash = (hash!=null)?"&hash="+hash:'';
        var listing = (list)?'&list=1'+"&cid="+next_cid:'';
        last_update_time = ts;
        $.ajax({
            type: "GET",
            url: proto_https+"://"+complite_url+"?token="+token+url_action+url_hash+listing+"&t="+ts,
            beforeSend: function(xhr) {
                xhr.setRequestHeader("Authorization", getAuthCookie());
            },
            success: function(msg, textStatus, xhr){
                err_count = 0;
                var obj = jQuery.parseJSON(msg);
                if (obj['torrentc']!=null)
                    next_cid = obj['torrentc'];
                if (obj['torrentm']!=null)
                    removeTr(obj['torrentm']);
                if (obj['label']!=null)
                    labelsarr = obj['label'];
                if (obj['download-dirs']!=null)
                    folder_paths = obj['download-dirs'];
                if (obj['torrents']!=null)
                {
                    torarr = {};
                    update_count = 0;
                    active_torrents = [];
                    count_active_torrents = -1;
                    checkArr(obj['torrents']);
                    if (chkDOM())
                        windowsDOM.manager.writeList();
                }
                if (obj['torrentp']!=null)
                    checkArr(obj['torrentp']);
                if (obj['settings']!=null)
                    readSetting(obj['settings']);
                if (obj['files']!=null)
                    WriteFileList(obj['files']);
                update = false;
            },
            statusCode: {
                400: function() {
                    setup_note = 38;
                    updateStatus('error');
                    update = false;
                },
                401: function() {
                    setup_note = 34;
                    updateStatus('error');
                    update = false;
                },
                0: function() {
                    setup_note = 36;
                    updateStatus('error');
                    update = false;
                }
            },
            error:function (xhr, ajaxOptions, thrownError){
                if (xhr.status==0||xhr.status==400||xhr.status==401)
                {
				
                } else {
                    setup_note = lang_arr[71]+xhr.status+' '+thrownError;
                    updateStatus('error');
                }
                update = false;
            }
        });
        startTimer();
    }
    var setMedia = function (a) {
        media_arr = a;
    }
    var getMedia = function () {
        return media_arr;
    }
    var add_context_menu = function () {
        var getTorrentsList = function(cacheId) {
            try {
                var xhr = new XMLHttpRequest();
                xhr.open("GET", proto_https+"://"+complite_url+"?token="+token + "&list=1" + (cacheId ? ("&cid=" + cacheId) : ""), false);
                xhr.setRequestHeader("Authorization", getAuthCookie());
                xhr.send(null);
            } catch(e) {
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
            } catch(err) {
                link_note(lang_arr[103],err.toString(),'error');
            }
            if (response.error) {
                link_note(lang_arr[23], response.error,'error');
            } else {

                // get the name of the last torrent in the list
                var list = getTorrentsList();
                var torrents = list.torrentp || list.torrents;
                if (torrents) {
                    var torrent = torrents[torrents.length - 1];
                    link_note(torrent[2],lang_arr[102],null);
                    if (go_in_downloads == 1) {
                        localStorage["last_label"] = '*{[down]}*';
                        if (chkDOM())
                            windowsDOM.manager.selectLabel('*{[down]}*');
                    }
                }
            }
        };
        var downloadFile = function(url, callback,param) {
            var xhr = new XMLHttpRequest();
            var filename = url.substring(url.lastIndexOf("/") + 1);
            //link_note(filename,lang_arr[101],null);

            xhr.open("GET", url, true);
            xhr.overrideMimeType("text/plain; charset=x-user-defined");
            xhr.responseType = "blob";

            xhr.onload = function() {
                var blob = xhr.response;

                //link_note(filename,lang_arr[100],null);
                callback(blob,param);
            };
            xhr.send(null);
        };
        var uploadTorrent = function(file,param) {

            // prepare torrent file
            var formdata = new FormData();
            formdata.append("torrent_file", file);

            var xhr = new XMLHttpRequest();
            xhr.open("POST", proto_https+"://"+complite_url+"?token="+token + "&action=add-file" + param, true);
            xhr.onreadystatechange = function() {
                if (xhr.readyState === 4) {
                    handleResponse(xhr.responseText);
                }
            };

            // upload it
            xhr.setRequestHeader("Authorization", getAuthCookie());
            xhr.send(formdata);
        };
        var uploadMagnet = function(url) {
            var xhr = new XMLHttpRequest();
            xhr.open("GET", proto_https+"://"+complite_url+"?token="+token + "&action=add-url&s="+url, true);
            xhr.onreadystatechange = function() {
                if (xhr.readyState === 4) {
                    handleResponse(xhr.responseText);
                }
            };

            // upload it
            xhr.setRequestHeader("Authorization", getAuthCookie());
            xhr.send(null);
        };
        var repeat_count = 0;
        var notification_link = null;
        var link_note = function (a,b,i)
        {
            if (note_link_enable == 0) return;
            if (notification_link!=null)
                notification_link.cancel();
            if (b==null) b = '';
            //var icon = 'images/add.png';
            var icon = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAABIAAAASABGyWs+AAAACXZwQWcAAAAgAAAAIACH+pydAAACTElEQVRYw+WXv24TQRDGv927JMZcIgyRaInCCyDRISQKOiReALpYNAjxAEQiNVDQgaK4pKGgokhJRQORQHRABCUSkQBbtm//zAzFnc82uUNZozNFpri902pnf/vtzswecNxNhQ64s3VpKUlOLjebCQCVO1AwxmA4cL1H93ZNiL84FOD0anLz7u3NHRRTq2Id29tP2gA6tQJEUQyILr5l4hnHC8GKBgOwMFhcRR+FupsBgAnE5ds8HwAheLGlfcS+fgBigue0Qp15AVA5AMk8AMjD0rCyr3YA5z1chQKObKC3CYDr7XO6dSZpJctNJXlcZ/EtRayb1IPEJ8YPSp0ZN0zamxdWlxoLKBKVyhLVKGENB0aGff/j2eN3DEyk4qs3zq7ff3jrczbXaEoBCpgRkIZW5cIJOBur/sySY4BIL+LBVuf8i6ef9qcU0For6wxkasIqC5d6ZJFahI51sfACwJOHcWamZBIEoAnWjRNZAWC9wYdvL+GoXytArBsY2F+HAZx3+Nk/gPHd2gFSx4cByCt4p2DdTH6PbKwFzo3P2fgMWPS+vll8zjilRBgiDIFMtyI4saLWWmv2Ypnz7/vyNu3iC1R+UVHj06/ydwUlLpXeaExw/b680dhYv2J2yvo+vpL2607NFxJhBVsRhcwKOFIY/wMAs4arOCdEcwAQ1nBVClDwjs6iQFSpQLYFNQNANHxF1WVW9V9K5e8A/1eByet6fQqQRqQaWdUUydusdLOP6gfoHqS7fm/lGrRAmPP/BAYTIe3798EEx95+A/JoMbRk/Ga1AAAAJXRFWHRkYXRlOmNyZWF0ZQAyMDEwLTAyLTExVDAxOjE5OjAxLTA2OjAwkkuZFgAAACV0RVh0ZGF0ZTptb2RpZnkAMjAwNi0xMC0wNVQxOToxMzo1OC0wNTowMFczbQYAAAAASUVORK5CYII=';
            //if (i=='error') icon = 'images/warning.png';
            if (i=='error') icon = 'data:image/png;base64,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';
            notification_link = webkitNotifications.createNotification(
                icon,
                a,b
                );
            notification_link.show();
            $('#link_timer').stopTime('note_timer');
            $('#link_timer').oneTime(3000,'note_timer',function(){
                notification_link.cancel()
            });
        }
        var addTorrent = function (a) {
            var param = '';
            if (context_menu[a.menuItemId]!==undefined)
                param = "&download_dir="+encodeURIComponent(context_menu[a.menuItemId].key)+"&path="+encodeURIComponent(context_menu[a.menuItemId].val);
            chrome.tabs.getSelected(null, function(tab) {
                // запоминает таб торрента
                tabId = tab.id;

                // запрашивает токен
                if (token == '')
                {
                    if (repeat_count==0)
                        getToken();
                    $('#link_timer').oneTime(100, 'auth_timer', function() {
                        if (repeat_count<10) {
                            repeat_count++;
                            addTorrent(a);
                        } else {
                            link_note(lang_arr[38],null,'error');
                            repeat_count = 0;
                        }
                    });
                } else {
                    $('#link_timer').stopTime('auth_timer');
                    repeat_count = 0;
                }
                try {
                    t=a.linkUrl;
                    if (t.substr(0,7) == 'magnet:')
                        uploadMagnet(encodeURIComponent(t)+param);
                    else
                        downloadFile(t, uploadTorrent, param);
                } finally {
                //hideMessages();
                }
            });
        }
		
        if (ctx_link_menu == 1)
        {
            if ($('#link_timer').length==0)
                $('body').append('<div id="link_timer"></div>');
            chrome.contextMenus.removeAll();
            var parentID = chrome.contextMenus.create({
                "title": lang_arr[104],
                "contexts":["link"],
                "onclick": addTorrent
            });
            //выбор каталога из контекстного меню>
            if (localStorage.folders_array!==undefined)
            {
                var arr = JSON.parse(localStorage.folders_array);
                var arrs = arr.length;
                var itemNum = new Array();
                for (var i=0;i<arrs;i++)
                {
                    SubMenuID = chrome.contextMenus.create({
                        "title": arr[i][1],
                        "contexts":["link"],
                        "onclick": addTorrent,
                        "parentId": parentID
                    });
                    itemNum[SubMenuID] = {
                        'key':arr[i][0],
                        'val':arr[i][1]
                    };
                }
                context_menu = itemNum;
            }
        //<выбор каталога из контекстного меню
        }
    }
    return {
        getArr : function () {
            return getArr();
        },
        setDOM : function () {
            return setDOM();
        },
        getTableColums : function (t) {
            return getTableColums(t);
        },
        actionSend : function (a,b,c) {
            return actionSend(a,b,c);
        },
        checkSetup : function () {
            return checkSetup();
        },
        getMedia : function () {
            return getMedia();
        },
        setMedia : function (a) {
            return setMedia(a);
        },
        getLimites : function () {
            return getLimites();
        },
        setLimites : function (a,b) {
            return setLimites(a,b);
        },
        getLabels : function () {
            return getLabels();
        },
        dieDOM : function () {
            return dieDOM();
        },
        updateSetup : function () {
            return updateSetup();
        },
        updateStatus : function (a) {
            return updateStatus(a);
        },
        getNote : function () {
            return getNote();
        },
        getTorrentList : function (a,b) {
            return getTorrentList(a,b);
        },
        startTimer : function () {
            return startTimer();
        },
        table_colem_def : function (n) {
            table_colum[n][0]=(table_colum[n][0]==1) ? 0 : 1;
            save_table_colum();
            return table_colum[n];
        },
        fullReloadList : function () {
            return fullReloadList();
        },
        load_table_colum : function () {
            return load_table_colum();
        },
        add_context_menu : function () {
            return add_context_menu();
        },
        get_folders : function () {
            return folder_paths;
        }
    }
}();
$(document).ready(function() {
    chrome.browserAction.setBadgeBackgroundColor({
        "color" : [0, 0, 0, 40]
    });
    if (engine.checkSetup()) {
        engine.startTimer();
        engine.add_context_menu();
    }
});