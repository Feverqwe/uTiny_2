var translate_page = function () {
    $('h1[data-lang=106_0]').html(lang_arr[106][0]);
    $('a[data-lang=106_6]').html(lang_arr[106][6]);
    $('a[data-lang=106_3]').html(lang_arr[106][3]);
    $('p[data-lang=106_4]').html(lang_arr[106][4]);
    $('b[data-lang=106_5]').html(lang_arr[106][5]);
}
$(function() {
    translate_page();
});