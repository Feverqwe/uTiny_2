var options = function() {
    var _engine = (chrome.extension.getBackgroundPage()).engine;
    var set_place_holder = function() {
        var def = _engine.getDefSettings();
        var set = _engine.getSettings();
        $.each(def, function(k, v) {
            if (v.t == "text" || v.t == "number" || v.t == "password") {
                if (k in set && set[k] != v.v) {
                    $('input[name="' + k + '"]').attr("value", set[k]);
                }
                if (v.v != null) {
                    $('input[name="' + k + '"]').attr("placeholder", v.v);
                }
            }
            if (v.t == "checkbox") {
                if (k in set && set[k] != v.v) {
                    $('input[name="' + k + '"]').eq(0)[0].checked = (set[k]) ? 1 : 0;
                } else {
                    $('input[name="' + k + '"]').eq(0)[0].checked = (v.v) ? 1 : 0;
                }
            }
            if (v.t == "array") {
                if (k in set) {
                    if (k == "folders_array") {
                        var arr = set[k];
                        for (var n = 0; n < arr.length; n++) {
                            $('select.folders').append(new Option(arr[n][1], JSON.stringify(arr[n])));
                        }
                    }
                }
            }
        });
    };
    var saveAll = function() {
        var def = _engine.getDefSettings();
        $.each(def, function(key, value) {
            if (value.t == "text") {
                var val = $('input[name="' + key + '"]').val();
                if (val.length <= 0) {
                    val = $('input[name="' + key + '"]').attr('placeholder');
                }
                localStorage[key] = val;
            } else
            if (value.t == "password") {
                var val = $('input[name="' + key + '"]').val();
                localStorage[key] = val;
            } else
            if (value.t == "checkbox") {
                var val = ($('input[name="' + key + '"]').eq(0)[0].checked) ? 1 : 0;
                localStorage[key] = val;
            } else
            if (value.t == "number") {
                var val = $('input[name="' + key + '"]').val();
                if (val.length <= 0) {
                    val = $('input[name="' + key + '"]').attr('placeholder');
                }
                localStorage[key] = val;
            }
        });
        var folders_arr = [];
        var f_sel = $('select.folders').children('option');
        var c = f_sel.length;
        for (var n = 0; n < c; n++) {
            folders_arr[folders_arr.length] = JSON.parse(f_sel.eq(n).val());
        }
        localStorage['folders_array'] = JSON.stringify(folders_arr);

        var tr_colums = _engine.getColums();
        var table = $('ul.tr_colums');
        $.each(tr_colums, function(key, value) {
            var item = table.children('li[data-key="' + key + '"]');
            var active = (item.children('div.info').children('div').eq(2).children('input').eq(0)[0].checked) ? 1 : 0;
            var size = parseInt(item.children('div.info').children('div').eq(1).children('label').text());
            var pos = item.index() + 1;
            tr_colums[key].pos = pos;
            tr_colums[key].size = size;
            tr_colums[key].a = active;
        });
        localStorage['colums'] = JSON.stringify(tr_colums);
        var fl_colums = _engine.getFlColums();
        var table = $('ul.fl_colums');
        $.each(fl_colums, function(key, value) {
            var item = table.children('li[data-key="' + key + '"]');
            var active = (item.children('div.info').children('div').eq(2).children('input').eq(0)[0].checked) ? 1 : 0;
            var size = parseInt(item.children('div.info').children('div').eq(1).children('label').text());
            var pos = item.index() + 1;
            fl_colums[key].pos = pos;
            fl_colums[key].size = size;
            fl_colums[key].a = active;
        });
        localStorage['fl_colums'] = JSON.stringify(fl_colums);
    };
    var getBackup = function() {
        $('textarea[name="backup"]').val(JSON.stringify(localStorage));
    }
    var stngsRestore = function(text) {
        try {
            var rst = JSON.parse(text);
            localStorage.clear();
            for (var key in rst)
            {
                var value = rst[key];
                if (value == undefined || key == 'length')
                    continue;
                localStorage[key] = value;
            }
            top.location.reload();
        } catch (err) {
            alert(lang_arr.settings[51] + "\n" + err);
        }
    }
    var make_bakup_form = function() {
        $('div.backup_form div').children('a.backup_tab').click(function(e) {
            e.preventDefault();
            $(this).parents().eq(1).children('div.restore').slideUp('fast');
            $(this).parent().children('a.restore_tab').removeClass('active');
            $(this).parents().eq(1).children('div.backup').slideDown('fast');
            $(this).parent().children('a.backup_tab').addClass('active');
            getBackup();
        });
        $('div.backup_form div').children('a.restore_tab').click(function(e) {
            e.preventDefault();
            $(this).parents().eq(1).children('div.backup').slideUp('fast');
            $(this).parent().children('a.backup_tab').removeClass('active');
            $(this).parents().eq(1).children('div.restore').slideDown('fast');
            $(this).parent().children('a.restore_tab').addClass('active');
        });
        $('div.backup').find('input').click(function(e) {
            e.preventDefault();
            getBackup();
        });
        $('div.restore').find('input').click(function(e) {
            e.preventDefault();
            stngsRestore($(this).parent().children('textarea').val());
        });
    };
    var write_sortable_tables = function() {
        function ap(t, k, v) {
            t.append('<li class="item ui-state-default" data-key="' + k + '"><div class="info"><div>' + lang_arr[v.lang][1] + '</div>[<div>' + lang_arr.settings[50] + ': <label>' + v.size + '</label>px;</div> <div>' + lang_arr.settings[49] + ':<input type="checkbox"' + ((v.a) ? ' checked' : '') + '/>]</div></div><div class="size" style="width:' + v.size + 'px"></div></li>');
        }
        var tr_colums = _engine.getColums();
        var tr_table = $("ul.tr_colums");
        $.each(tr_colums, function(k, v) {
            ap(tr_table, k, v);
        });
        var fl_colums = _engine.getFlColums();
        var fl_table = $("ul.fl_colums");
        $.each(fl_colums, function(k, v) {
            ap(fl_table, k, v);
        });
        $("ul.sortable").sortable({placeholder: "ui-state-highlight"});
        $("ul.sortable").disableSelection();
        $("ul.sortable").find("div.size").resizable({handles: "e", resize: function(event, ui) {
                $(this).parent().children('div').children("div").eq(1).children('label').html(ui.size.width);
            }});
    };
    var reset_table = function(table, arr) {
        $.each(arr, function(k, v) {
            var t = table.find('li[data-key="' + k + '"]');
            var info = t.children("div.info").children("div");
            t.children("div.size").css("width", v.size);
            info.eq(1).children("label").html(v.size);
            info.eq(2).children("input")[0].checked = (v.a) ? true : false;
        });
    }
    var get_dir_list = function() {
        _engine.sendAction("&action=list-dirs", 1, function(arr) {
            if ('download-dirs' in arr == false)
                return;
            $('input.add_folder')[0].disabled = false;
            $('select.folder_arr').empty();
            $(this).unbind('click');
            $.each(arr['download-dirs'], function(key, value) {
                $('select.folder_arr').append(new Option('[' + bytesToSize(value['available'] * 1024 * 1024) + ' ' + lang_arr[107][1] + '] ' + value['path'], key));
            });
        });
    };
    var bytesToSize = function(bytes, nan) {
        //переводит байты в строчки
        var sizes = lang_arr[59];
        if (nan == null)
            nan = 'n/a';
        if (bytes == 0)
            return nan;
        var i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
        if (i == 0) {
            return (bytes / Math.pow(1024, i)) + ' ' + sizes[i];
        }
        return (bytes / Math.pow(1024, i)).toFixed(1) + ' ' + sizes[i];
    };
    var write_language = function() {
        var lang = lang_arr.settings;
        var language = (localStorage.lang !== undefined) ? localStorage["lang"] : 'en';
        $('.lang').find('select').val(language);
        $.each(lang, function(k, v) {
            var el = $('[data-lang=' + k + ']');
            if (el.length == 0)
                return true;
            var t = el.prop("tagName");
            if (t == "A" || t == "LEGEND" || t == "SPAN" || t == "LI") {
                el.text(v);
            } else
            if (t == "INPUT") {
                el.val(v);
            } else
                console.log(t);
        });
    }
    var popup = function() {
        var isPopup = false;
        var windows = chrome.extension.getViews({type: 'popup'});
        for (var n = 0; n < windows.length; n++) {
            if ("options" in windows[n])
                isPopup = true;
        }
        return isPopup;
    }
    return {
        begin: function() {
            write_language();
             $('.lang').on('change','select',function () {
                 localStorage.lang = $(this).val();
                 window.location.reload();
             })
            $('ul.menu').on('click', 'a', function(e) {
                e.preventDefault();
                $('ul.menu').find('a.active').removeClass('active');
                $(this).addClass('active');
                $('body').find('div.page.active').removeClass('active');
                $('body').find('div.' + $(this).data('page')).addClass('active');
            });
            $("li.default").children('input[name="tr"]').on("click", function() {
                reset_table($("ul.tr_colums"), _engine.getDefColums());
            });
            $("li.default").children('input[name="fl"]').on("click", function() {
                reset_table($("ul.fl_colums"), _engine.getDefFlColums());
            });
            $('select.folder_arr').on('click', get_dir_list);
            $('input.add_folder')[0].disabled = true;
            $('input.add_folder').on('click', function() {
                var arr = [$('select.folder_arr').val(), $(this).parent().children('input[type=text]').val()];
                if (arr[1].length < 1)
                    return;
                $('select.folders').append(new Option(arr[1], JSON.stringify(arr)));
                $(this).parent().children('input[type=text]').val("");
            });
            $('input.rm_folder').on('click', function() {
                $('select.folders :selected').remove();
            });
            $('input[name="save"]').on('click', function() {
                saveAll();
                $('div.page.save > div.status').css('background', 'url(/images/loading.gif) center center no-repeat').text('');
                _engine.updateSettings();
                _engine.getToken(function() {
                    $('input[name="save"]').val('Сохранено!');
                    $('div.page.save > div.status').css('background', 'none').text(lang_arr.settings[52]);
                    if (popup()) {
                        window.location = "manager.html";
                    }
                }, function() {
                    $('div.page.save > div.status').css('background', 'none').text(lang_arr.settings[53] + ' ' + _engine.getStatus());
                })
            });
            set_place_holder();
            make_bakup_form();
            write_sortable_tables();
        }
    };
}();
$(function() {
    options.begin();
});