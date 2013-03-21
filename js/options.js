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
                    if (k == "folders_array" && set[k] != null) {
                        var arr = set[k];
                        for (var n = 0; n < arr.length; n++) {
                            $('select.folders').append(new Option(arr[n].v, JSON.stringify(arr[n])));
                        }
                    }
                }
            }
        });
    };
    var make_bakup_form = function() {
        $('div.backup_form div').children('a.backup_tab').click(function(event) {
            event.preventDefault();
            $(this).parents().eq(1).children('div.restore').slideUp('fast');
            $(this).parent().children('a.restore_tab').removeClass('active');
            $(this).parents().eq(1).children('div.backup').slideDown('fast');
            $(this).parent().children('a.backup_tab').addClass('active');
            //view.getBackup();
        });
        $('div.backup_form div').children('a.restore_tab').click(function(event) {
            event.preventDefault();
            $(this).parents().eq(1).children('div.backup').slideUp('fast');
            $(this).parent().children('a.backup_tab').removeClass('active');
            $(this).parents().eq(1).children('div.restore').slideDown('fast');
            $(this).parent().children('a.restore_tab').addClass('active');
        });
        $('div.backup_form').find('input[name=backup_btn]').click(function(event) {
            event.preventDefault();
            //view.getBackup();
        });
        $('div.backup_form').find('input[name=restore_btn]').click(function(event) {
            event.preventDefault();
            //view.stngsRestore($(this).parent().children('textarea').val());
        });
    };
    var write_sortable_tables = function() {
        function ap(t, k, v) {
            t.append('<li class="item ui-state-default" data-key="' + k + '"><div class="info"><div>' + lang_arr[v.lang][1] + '</div>[<div>ширина: <label>' + v.size + '</label>px;</div> <div>показывать:<input type="checkbox"' + ((v.a) ? ' checked' : '') + '/>]</div></div><div class="size" style="width:' + v.size + 'px"></div></li>');
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
            if (v.a) {
                info.eq(2).children("input")[0].checked = true;
            } else {
                info.eq(2).children("input")[0].checked = false;
            }
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
    }
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
    return {
        begin: function() {
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
                var obj = {k: $('select.folder_arr').val(), v: $(this).parent().children('input[type=text]').val()};
                if (obj.v.length < 1) return;
                $('select.folders').append(new Option(obj.v, JSON.stringify(obj)));
                $(this).parent().children('input[type=text]').val("");
            });
            $('input.rm_folder').on('click', function() {
                $('select.folders :selected').remove();
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