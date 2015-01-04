var showNotification = function(template, onClose) {
    var prefix = 'nf';
    var nodeCache = {};
    var nodeCounter = 0;
    var clearNodeCache = function() {
        var rmList = [];
        for (var key in nodeCache) {
            nodeCache[key].remove();
            rmList.push(key);
        }
        for (var i = 0, item; item = rmList[i]; i++) {
            delete nodeCache[item];
        }
    };
    var close = function() {
        clearNodeCache();
        onClose && onClose();
    };
    var getFormData = function() {
        var formData = {};
        for (var name in nodeCache) {
            var el = nodeCache[name];
            if (el[0].tagName === 'INPUT') {
                if (el[0].type === 'text') {
                    formData[name] = el[0].value;
                }
            } else
            if (el[0].tagName === 'SELECT') {
                if (el[0].selectedIndex === -1) {
                    continue;
                }
                formData[name] = el[0].value;
            }
        }
        return formData;
    };
    var createLayer = function () {
        nodeCache.bgLayer = $('<div>', {'class': prefix + '-layer'}).on('mousedown',function () {
            close();
        }).appendTo(document.body);
    };
    var readTemplate = function(template) {
        for (var i = 0, len = template.length; i < len; i++) {
            var el = template[i];
            if (Array.isArray(el)) {
                nodeCounter++;
                var subSection = nodeCache['node'+nodeCounter] = $('<div>', {class: prefix + '-subItem'}).appendTo(this);
                readTemplate.call(subSection, el);
                continue;
            }
            if (typeof el === "object") {
                for (var tagName in el) {
                    var attrList = el[tagName];
                    var on = attrList.on;
                    delete attrList.on;
                    var options = attrList.options;
                    delete attrList.options;
                    nodeCounter++;
                    var $el = nodeCache[attrList.name || 'node'+nodeCounter] = $('<' + tagName + '>', attrList);
                    if (on) {
                        if (typeof on[0] === "string") {
                            $el.on(on[0], on[1].bind({
                                close: close,
                                getFormData: getFormData,
                                nodeCache: nodeCache
                            }));
                        } else {
                            for (var n = 0, subOn; subOn = on[n]; n++) {
                                $el.on(subOn[0], subOn[1].bind({
                                    close: close,
                                    getFormData: getFormData,
                                    nodeCache: nodeCache
                                }));
                            }
                        }
                    }
                    if (options) {
                        if (options.length === 0) {
                            continue;
                        }
                        $el.append(options);
                    }
                    this.append($el);
                }
                continue;
            }
            if (typeof el === "function") {
                el(this);
            }
        }
    };

    createLayer();
    nodeCache.body = $('<div>', {'class': prefix + '-notifi'});
    readTemplate.call(nodeCache.body, template);
    $(document.body).append(nodeCache.body);
};