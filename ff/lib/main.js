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

var bg = panels.Panel({
    contentScriptFile: [self.data.url("./js/mono.js"), self.data.url("./js/jquery-2.1.0.min.js"),
        self.data.url("./js/lang.js"), self.data.url("./js/background.js")]
});

var popup = panels.Panel({
    width: 800,
    height: 300,
    contentURL: self.data.url("./manager.html"),
    onHide: function () {
        button.state('window', {checked: false});
    }
});

mono.inti([{id: 'bg', page: bg}, {id: ['mgr', 'opt'], page: popup}], ['mgr', 'opt', 'bg']);