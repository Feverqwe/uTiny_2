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
        })
    }
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
    }
    return {
        begin: function() {
            $('ul.menu').on('click', 'a', function(e) {
                e.preventDefault();
                $('ul.menu').find('a.active').removeClass('active');
                $(this).addClass('active');
                $('body').find('div.page.active').removeClass('active');
                $('body').find('div.' + $(this).data('page')).addClass('active');
            });
            set_place_holder();
            make_bakup_form();
        }
    }
}();
$(function() {
    options.begin();
})