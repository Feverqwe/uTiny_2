var { ToggleButton } = require('sdk/ui/button/toggle');
var panels = require("sdk/panel");
var self = require("sdk/self");
var monoLib = require("./monoLib.js");
var lang = require("./lang.js");

var button = ToggleButton({
    id: "uTinyOpenBtn",
    label: "uTorrent easy client",
    icon: {
        "16": "./icons/icon-16.png",
        "32": "./icons/icon-32.png",
        "64": "./icons/icon-64.png"
    },
    onChange: function (state) {
        if (!state.checked) {
            return;
        }
        popup.show({
            position: button
        });
    }
});

var displayState = false;
var popup = panels.Panel({
    width: 800,
    height: 350,
    contentURL: self.data.url("./manager.html"),
    onHide: function () {
        button.state('window', {checked: false});
        displayState = false;
        popup.port.emit('monoScope', {
            data: 'sleep',
            monoTo: 'monoScope',
            monoFrom: 'system'
        });
    },
    onShow: function() {
        displayState = true;
        popup.port.emit('monoScope', {
            data: 'wake',
            monoTo: 'monoScope',
            monoFrom: 'system'
        });
    },
    onMessage: function(msg) {
        if (msg === 'isShow') {
            if (!displayState) {
                popup.port.emit('monoScope', {
                    data: 'sleep',
                    monoTo: 'monoScope',
                    monoFrom: 'system'
                });
            }
        }
    }
});

var route = {'mgr': popup, 'opt': popup};

var bg = require("./background.js");
var bg_addon = monoLib.virtualAddon('bg');
route['bg'] = bg_addon;
monoLib.addPages(route);

bg.init(bg_addon, lang);