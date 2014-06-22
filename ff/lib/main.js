var { ToggleButton } = require('sdk/ui/button/toggle');
var panels = require("sdk/panel");
var self = require("sdk/self");
var mono = require("./monoLib.js");

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

var popup = panels.Panel({
    width: 800,
    height: 300,
    contentURL: self.data.url("./manager.html"),
    onHide: function () {
        button.state('window', {checked: false});
        popup.port.emit('mgr', {
            data: 'sleep',
            monoTo: 'mgr',
            monoFrom: 'system'
        });
    },
    onShow: function() {
        popup.port.emit('mgr', {
            data: 'wake',
            monoTo: 'mgr',
            monoFrom: 'system'
        });
    }
});

var bg = require("./background.js");
bg.init(popup);

mono.inti([{id: ['mgr', 'opt'], page: popup}], ['mgr', 'opt']);