var use_costum_path = false;
var replace_string = '';
var replacein_string = '';
if (localStorage["costum_path"]!==undefined&&localStorage["costum_path"]==1) {
    use_costum_path = true;
    replace_string = localStorage["replace_string"];
    replacein_string = localStorage["replacein_string"];
}
function getFileType(a)
{
    var t = a.split('.');
    var ex = t[t.length-1];
    if (localStorage["vlc_active"]==1)
    {
        if ($.inArray(ex,['3gp','asf','wmv','asf','wmv','au','avi','flv','mov','ogm','ogg','mkv','mka','ts','mpg','mpg','mp2','nsc','nsv','nut','ra','ram','rm','rv ','rmbv','a52','dts','aac','flac','dv','vid','tta','tac','ty','wav','dts','xa'])!=-1)
            ex = 'vlc';
        if (localStorage["vlc_for_mp4"]==1&&ex=='mp4')
            ex = 'vlc';
    }
    return ex;
}
function init_ap(pl)
{
    new jPlayerPlaylist({
        jPlayer: "#jquery_jplayer_1",
        cssSelectorAncestor: "#jp_container_1"
    }, pl, {
        ready: function () {
            $("audio").attr('autoplay','autoplay');
        },
        swfPath: "js/ap",
        supplied: "mp3"
    });
}
function writePlayer(t,a)
{
    switch (t) {
        case ('video-js'):
            var html5_v = '<div class="video-js-box vim-css"><video id="player1" class="video-js" width="640" height="360" controls="controls" preload="auto" autoplay="true">'+a[0]+'</video></div>';
            $('#media-box').html(html5_v);
            VideoJS.setupAllWhenReady();
            $('#media-box').css('top',($('body').height()/2-$('#media-box').height()/2)+'px');
            $(window).resize(function () {
                var v = $('body').height()/2-$('#media-box').height()/2;
                if (v>0)
                    $('#media-box').css('top',v+'px');
            });
            $('head').children('title').text(a[2]+wind_head);
            break;
        case ('jplayer-audio'):
            var player = '<div id="jp_container_1" class="jp-video jp-video-full v2"><div class="jp-type-playlist"><div id="jquery_jplayer_1" class="jp-jplayer"></div><div class="jp-video-play"><a href="javascript:;" class="jp-video-play-icon" tabindex="1">play</a></div><div class="jp-interface"><div class="jp-progress"><div class="jp-seek-bar"><div class="jp-play-bar"></div></div></div><div class="jp-current-time"></div><div class="jp-duration"></div><div class="jp-controls-holder"><ul class="jp-controls"><li><a href="javascript:;" class="jp-previous" tabindex="1">previous</a></li><li><a href="javascript:;" class="jp-play" tabindex="1">play</a></li><li><a href="javascript:;" class="jp-pause" tabindex="1">pause</a></li><li><a href="javascript:;" class="jp-next" tabindex="1">next</a></li><li><a href="javascript:;" class="jp-stop" tabindex="1">stop</a></li><li><a href="javascript:;" class="jp-mute" tabindex="1" title="mute">mute</a></li><li><a href="javascript:;" class="jp-unmute" tabindex="1" title="unmute">unmute</a></li><li><a href="javascript:;" class="jp-volume-max" tabindex="1" title="max volume">max volume</a></li></ul><div class="jp-volume-bar"><div class="jp-volume-bar-value"></div></div><ul class="jp-toggles"><li><a href="javascript:;" class="jp-full-screen" tabindex="1" title="full screen">full screen</a></li><li><a href="javascript:;" class="jp-restore-screen" tabindex="1" title="restore screen">restore screen</a></li><li><a href="javascript:;" class="jp-shuffle" tabindex="1" title="shuffle">shuffle</a></li><li><a href="javascript:;" class="jp-shuffle-off" tabindex="1" title="shuffle off">shuffle off</a></li><li><a href="javascript:;" class="jp-repeat" tabindex="1" title="repeat">repeat</a></li><li><a href="javascript:;" class="jp-repeat-off" tabindex="1" title="repeat off">repeat off</a></li></ul></div><div class="jp-title"><ul><li></li></ul></div></div><div class="jp-playlist"><ul><!-- The method Playlist.displayPlaylist() uses this unordered list --><li></li></ul></div><div class="jp-no-solution"><span>Update Required</span>To play the media you will need to either update your browser to a recent version or update your <a href="http://get.adobe.com/flashplayer/" target="_blank">Flash plugin</a>.</div></div></div>';
            $('#media-box').html(player);
            $('#media-box').css('height',$('body').height()-65+'px');
            $(window).resize(function () {
                var v = $('body').height()-65;
                if (v>0)
                    $('#media-box').css('height',v+'px');
            });
            init_ap(playList);
            break;
        case ('vlc'):
            if (use_costum_path == true)
            {
                a[0] = a[3].replace(replace_string,replacein_string)+'/'+a[2];
            }
            var player = '<embed type="application/x-vlc-plugin" id="vlc" name="vlc" width="100%" height="100%" target="'+a[0]+'" />';
            $('#media-box').html(player);
            $('head').children('title').text(a[2]+wind_head);
            $('body').css('overflow','hidden');
            break;
    };
}
function addFileInPlayer(a)
{
    switch (getFileType(a[0])) {
        case ('mp4'):
            player_type = 'video-js';
            playList = ['<source src="'+a[1]+'" type=\'video/mp4; codecs="avc1.42E01E, mp4a.40.2"\' />',
            null,a[0]];
            break;
        case ('webm'):
            player_type = 'video-js';
            playList = ['<source src="'+a[1]+'" type=\'video/webm; codecs="vp8, vorbis"\' />',
            null,a[0]];
            break;
        case ('ogv'):
            player_type = 'video-js';
            playList = ['<source src="'+a[1]+'" type=\'video/ogg; codecs="theora, vorbis"\' />',
            null,a[0]];
            break;
        case ('vlc'):
            player_type = 'vlc';
            playList = [a[1],null,a[0],a[2]];
            break;
        case ('mp3'):
            player_type = 'jplayer-audio';
            var sp_arr = a[0].split('/');
            if (!$.isArray(playList)) playList = [];
            playList[playList.length] = {
                title: (sp_arr.length>0) ? sp_arr[sp_arr.length-1] : a[0],
                artist: (sp_arr.length>1) ? sp_arr[sp_arr.length-2] : '',
                mp3: a[1]
            };
            break;
    };
}
var player_type = ''; //html5 // other
var playList = '';
var wind_head = ' - uT Media';
$(function() {
    var bg = chrome.extension.getBackgroundPage();
    var arr = bg.engine.getMedia();
    $.each(arr, function(key, value) {
        addFileInPlayer(value);
    });
    writePlayer(player_type,playList);
});