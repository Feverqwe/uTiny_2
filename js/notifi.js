var hash = null;
function getHash()
{
    return hash;
}
function update_status()
{
    var bg = chrome.extension.getBackgroundPage();
    var arr = bg.engine.getArr();
    $.each(arr, function(key, value) {
        if (value[4]==hash)
        {
            $('#status').text(lang_arr[57]+value[2]);
        }
    });
}
$(document).ready(function() {
    hash = top.location.href.replace(/.*\/(.+?)\?/, '');
    var bg = chrome.extension.getBackgroundPage();
    var arr = bg.engine.getArr();
    $.each(arr, function(key, value) {
        if (value[4]==hash)
        {
            /*3 - name
			  2 - status*/
            $('#name').text(value[3]).attr('title',value[3]);
            $('#status').text(lang_arr[57]+value[2]);
        }
    });
    $("#status").everyTime(3000, function(i) {
        update_status();
    });
    $('body').click(function (){
        window.close();
    });
});