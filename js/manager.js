/**
 * Create new element
 * @param {string} tagName
 * @param {object} obj
 * @returns {Element}
 */
mono.create = function(tagName, obj) {
    var el;
    if ( typeof tagName === 'string') {
        el = document.createElement(tagName);
    } else {
        el = tagName;
    }
    if (obj !== undefined) {
        for (var attr in obj) {
            var value = obj[attr];
            if (mono.create.hookList[attr]) {
                mono.create.hookList[attr](el, value);
                continue;
            }
            if (value === undefined || value === null) {
                continue;
            }
            el[attr] = value;
        }
    }
    return el;
};
mono.create.hookList = {
    text: function(el, value) {
        el.textContent = value;
    },
    data: function(el, value) {
        if (!value) return;

        for (var item in value) {
            var val = value[item];
            if (val !== null && val !== undefined) {
                el.dataset[item] = val;
            }
        }
    },
    class: function(el, value) {
        if (typeof value !== 'string') {
            for (var i = 0, len = value.length; i < len; i++) {
                var className = value[i];
                if (!className) {
                    continue;
                }
                el.classList.add(className);
            }
            return;
        }
        el.setAttribute('class', value);
    },
    style: function(el, value) {
        if (typeof value !== 'string') {
            for (var item in value) {
                el.style[item] = value[item];
            }
            return;
        }
        el.setAttribute('style', value);
    },
    append: function(el, value) {
        if (Array.isArray(value)) {
            for (var i = 0, len = value.length; i < len; i++) {
                var subEl = value[i];
                if (!subEl) {
                    continue;
                }
                if (typeof (subEl) === 'string') {
                    subEl = document.createTextNode(subEl);
                }
                el.appendChild(subEl);
            }
            return;
        }
        el.appendChild(value);
    },
    on: function(el, args) {
        if (typeof args[0] !== 'string') {
            for (var i = 0, len = args.length; i < len; i++) {
                var subArgs = args[i];
                el.addEventListener(subArgs[0], subArgs[1], subArgs[2]);
            }
            return;
        }
        //type, onEvent, useCapture
        el.addEventListener(args[0], args[1], args[2]);
    },
    onCreate: function(el, value) {
        value(el);
    }
};
mono.spaceToUnderline = function(string) {
    return string.replace(/\s/, '_');
};

var manager = {
    language: {},
    settings: {},
    domCache: {
        body: document.body,
        menu: document.querySelector('ul.menu'),
        dlSpeed: document.querySelector('.status-panel td.speed.download'),
        upSpeed: document.querySelector('.status-panel td.speed.upload'),
        status: document.querySelector('.status-panel td.status'),
        statusPanel: document.querySelector('.status-panel'),
        labelBox: document.querySelector('ul.menu li.select select'),
        trLayer: document.querySelector('.torrent-list-layer'),
        trTableMain: document.querySelector('.torrent-table-body'),
        trTableFixed: document.querySelector('.torrent-table-head'),
        trBody: document.querySelector('.torrent-table-body > tbody'),
        trHead: document.querySelector('.torrent-table-body > thead'),
        trFixedHead: document.querySelector('.torrent-table-head > thead'),
        fl: document.querySelector(".file-list"),
        flLayer: document.querySelector('.file-list > .fl-layer'),
        flTableMain: document.querySelector('.fl-table-body'),
        flTableFixed: document.querySelector('.fl-table-head'),
        flBody: document.querySelector('.fl-table-body > tbody'),
        flHead: document.querySelector('.fl-table-body > thead'),
        flFixedHead: document.querySelector('.fl-table-head > thead'),
        flBottom: document.querySelector('.file-list ul.bottom-menu'),
        dropLayer: document.querySelector('div.drop_layer')
    },
    varCache: {
        currentFilter: {label: 'all', custom: 1},
        trColumnList: {},
        trListItems: {},
        trSortColumn: 'name',
        trSortBy: 1,
        trSortList: [],
        flColumnList: {},
        flListLayer: {},
        flListItems: {},
        flSortColumn: 'name',
        flSortBy: 1,
        flSortList: [],
        // filelist layer pos
        flWidth: 0,
        flHeight: 0,
        flLeft: 0,
        // show/hide filelist layer bottom
        flBottomIsHide: 0,
        labels: [],
        speedLimit: {}
    },
    options: {
        scrollWidth: 17,
        trWordWrap: false,
        flWordWrap: true,
        TrMovebleEnabled: true,
        windowMode: false
    },
    trWriteHead: function() {
        var styleBody = '';
        var width = 0;
        var head = mono.create('tr', {
            append: (function() {
                var thList = [];
                for (var key in manager.varCache.trColumnList) {
                    var value = manager.varCache.trColumnList[key];
                    if (value.display !== 1) {
                        continue;
                    }
                    var orderClass = (manager.varCache.trSortColumn !== key) ? undefined : (manager.varCache.trSortBy === 1) ? 'sortDown' : 'sortUp';
                    thList.push(mono.create('th', {
                        class: [key, orderClass],
                        title: manager.language[value.lang+'_SHORT'] || manager.language[value.lang],
                        data: {
                            name: key,
                            type: 'tr'
                        },
                        append: [
                            mono.create('div', {
                                text: manager.language[value.lang+'_SHORT'] || manager.language[value.lang]
                            }),
                            mono.create('div', {
                                class: 'resize-el',
                                on: [
                                    ['click', function(e){e.stopPropagation();}],
                                    ['mousedown', manager.tableResize]
                                ]
                            })
                        ]
                    }));
                    styleBody += '.torrent-list-layer th.' + key + ',' +
                    ' .torrent-list-layer td.' + key + ' {' +
                        'max-width:' + value.width + 'px;' +
                        'min-width:' + value.width + 'px;' +
                    '}';
                    //2px padding; 1-border size right; 2px ??
                    width += value.width + 2 + 1 + 2;
                }
                return thList;
            })()
        });

        if (manager.varCache['style.torrent-style']) {
            manager.varCache['style.torrent-style'].parentNode.removeChild(manager.varCache['style.torrent-style']);
            delete manager.varCache['style.torrent-style'];
        }
        document.body.appendChild(manager.varCache['style.torrent-style'] = mono.create('style', {
            class: 'torrent-style',
            text: styleBody
        }));

        //no border last element
        width -= 1;
        width = width + manager.options.scrollWidth;
        if (width > 800) {
            width = 800;
        }
        if (width < 723) {
            width = 723;
        }
        document.body.style.width = width+'px';
        mono.isFF && mono.sendMessage({action: 'resize', width: width}, undefined, 'service');

        manager.domCache.trFixedHead.appendChild(head);
        manager.domCache.trHead.appendChild(head.cloneNode(true));

        var graph = document.querySelector('li.graph');
        var selectBox = document.querySelector('li.select');
        graph.style.width = selectBox.offsetLeft - graph.offsetLeft - 5;
    },
    flWriteHead: function() {
        var styleBody = '';
        var width = 0;
        var head = mono.create('tr', {
            append: (function() {
                var thList = [];
                for (var key in manager.varCache.flColumnList) {
                    var value = manager.varCache.flColumnList[key];
                    if (value.display !== 1) {
                        continue;
                    }
                    var orderClass = (manager.varCache.flSortColumn !== key) ? undefined : (manager.varCache.flSortBy === 1) ? 'sortDown' : 'sortUp';
                    thList.push(mono.create('th', {
                        class: [key, orderClass],
                        title: manager.language[value.lang+'_SHORT'] || manager.language[value.lang],
                        data: {
                            name: key,
                            type: 'fl'
                        },
                        append: [
                            (key === 'checkbox') ? mono.create('div', {
                                append: mono.create('input', {
                                    type: 'checkbox'
                                })
                            }) : mono.create('div', {
                                text: manager.language[value.lang+'_SHORT'] || manager.language[value.lang]
                            }),
                            mono.create('div', {
                                class: 'resize-el',
                                on: [
                                    ['click', function(e){e.stopPropagation();}],
                                    ['mousedown', manager.tableResize]
                                ]
                            })
                        ]
                    }));
                    styleBody += '.fl-layer th.' + key + ',' +
                    ' .fl-layer td.' + key + ' {' +
                        'max-width:' + value.width + 'px;' +
                        'min-width:' + value.width + 'px;' +
                    '}';
                    //2px padding; 1-border size right; 2px ??
                    width += value.width + 2 + 1 + 2;
                }
                return thList;
            })()
        });
        //no border last element
        width -= 1;
        width += manager.options.scrollWidth;
        manager.varCache.flWidth = width;

        var windowWidth = document.body.clientWidth;
        if (width > windowWidth) {
            width = windowWidth;
            styleBody += 'div.file-list {max-width:' + windowWidth + 'px; border-radius: 0;}';
        }
        if (width < 100) {
            manager.domCache.flBottom.style.display = 'none';
            manager.varCache.flBottomIsHide = 1;
        } else
        if (manager.varCache.flBottomIsHide === 1) {
            manager.domCache.flBottom.style.display = 'block';
            manager.varCache.flBottomIsHide = 0;
        }
        var popupHeight = manager.settings.popupHeight;

        var flBodyHeight = popupHeight - manager.domCache.menu.clientHeight - 1 - manager.domCache.statusPanel.clientHeight - 2;
        var flTableHeight = flBodyHeight - manager.domCache.menu.clientHeight;
        manager.varCache.flHeight = flBodyHeight;
        manager.varCache.flLeft = (windowWidth - width) / 2;
        styleBody += 'div.file-list {' +
            'left: ' + manager.varCache.flLeft + 'px;' +
            'height: ' + manager.varCache.flHeight + 'px;' +
            'width: ' + width + 'px;' +
        '}';
        styleBody += 'div.fl-layer {' +
            'max-height: ' + flTableHeight + 'px;' +
            'min-height: ' + flTableHeight + 'px;' +
        '}';

        if (manager.varCache['style.fileList-style']) {
            manager.varCache['style.fileList-style'].parentNode.removeChild(manager.varCache['style.fileList-style']);
            delete manager.varCache['style.fileList-style'];
        }
        document.body.appendChild(manager.varCache['style.fileList-style'] = mono.create('style', {
            class: 'fileList-style',
            text: styleBody
        }));

        manager.domCache.flFixedHead.appendChild(head);
        manager.domCache.flHead.appendChild(head.cloneNode(true));
    },
    getLabelOptionNode: function(item, isCustom) {
        var hasImage;
        if (isCustom) {
            hasImage = true;
            if (item === 'NOLABEL') {
                hasImage = false;
            }
        }
        return mono.create('option', {
            value: item,
            text: isCustom ? (item === 'SEEDING') ? manager.language['OV_FL_'+item.toUpperCase()] : manager.language['OV_CAT_'+item.toUpperCase()] : item,
            data: !isCustom ? undefined : {
                image: hasImage ? item : undefined,
                type: 'custom'
            }
        })
    },
    setLabels: function(items) {
        var selectedIndex = 0;
        var labels = manager.varCache.labels = [];
        var optionList = document.createDocumentFragment();
        var cIndex = 0;
        for (var item in manager.trCustomFilterObj) {
            labels.push({label: item, custom: 1});
            optionList.appendChild(manager.getLabelOptionNode(item, true));
            if (manager.varCache.currentFilter.custom && manager.varCache.currentFilter.label === item) {
                selectedIndex = cIndex;
            }
            cIndex++;
        }
        for (var i = 0, item; item = items[i]; i++) {
            item = item[0];
            labels.push({label: item});
            optionList.appendChild(manager.getLabelOptionNode(item, false));
            if (!manager.varCache.currentFilter.custom && manager.varCache.currentFilter.label === item) {
                selectedIndex = i;
            }
        }
        manager.domCache.labelBox.appendChild(optionList);
        manager.domCache.labelBox.selectedIndex = selectedIndex;
        manager.varCache.selectBox && manager.varCache.selectBox.update();
    },
    trCustomFilterObj: {
        ALL: function() {
            return true;
        },
        DL: function(item) {
            return item.api[4] !== 1000;
        },
        SEEDING: function(item) {
            return item.api[1] === 201 && item.api[4] === 1000;
        },
        COMPL: function(item) {
            return item.api[4] === 1000;
        },
        ACTIVE: function(item) {
            return item.api[9] !== 0 || item.api[8] !== 0;
        },
        INACTIVE: function(item) {
            return item.api[9] === 0 && item.api[8] === 0;
        },
        NOLABEL: function(item) {
            return item.api[11].length === 0;
        }
    },
    trItemIsInFilter: function(item) {
        //проверяет запись на фильтр
        if (!manager.varCache.currentFilter.custom) {
            return false;
        }
        return !manager.trCustomFilterObj[manager.varCache.currentFilter.label](item);
    },
    trChangeFilterByLabelBox: function() {
        var selectedIndex = manager.domCache.labelBox.selectedIndex;
        var currentLabel = manager.varCache.currentFilter = manager.varCache.labels[selectedIndex];

        mono.storage.set({selectedLabel: currentLabel});

        if (manager.varCache['style.tr-filter']) {
            manager.varCache['style.tr-filter'].parentNode.removeChild(manager.varCache['style.tr-filter']);
        }

        if (!currentLabel.custom) {
            return document.body.appendChild(manager.varCache['style.tr-filter'] = mono.create('style', {
                class: 'tr-filter',
                text: '.torrent-table-body tbody > tr {' +
                    'display: none;' +
                '}' +
                '.torrent-table-body tbody > tr[data-label="' + currentLabel.label + '"] {' +
                    'display: table-row;' +
                '}'
            }));
        }
        for (var key in manager.varCache.trListItems) {
            var item = manager.varCache.trListItems[key];
            if (manager.trItemIsInFilter(item)) {
                if (item.display === 1) {
                    item.node.classList.add('filtered');
                    item.display = 0;
                }
            } else
            if (item.display !== 1) {
                item.node.classList.remove('filtered');
                item.display = 1;
            }
        }
        if (currentLabel.label === 'all') return;

        document.body.appendChild(manager.varCache['style.tr-filter'] = mono.create('style', {
            class: 'tr-filter',
            text: '.torrent-table-body tbody > tr.filtered{' +
                'display: none;' +
            '}'
        }));
    },
    setStatus: function(statusText) {
        manager.domCache.status.textContent = statusText;
    },
    apiGetDone: function(api, noRound) {
        var value = api[4] / 10;
        if (!noRound) {
            value = Math.round(value);
        }
        return value + '%';
    },
    trGetStatusInfo: function(api) {
        var state = api[1];
        var done = api[4];
        if (state & 32) { // paused
            if (state & 2) {
                //OV_FL_CHECKED //Progress
                return manager.language.OV_FL_CHECKED.replace('%:.1d%', manager.apiGetDone(api));
            } else {
                //OV_FL_PAUSED
                return manager.language.OV_FL_PAUSED;
            }
        } else if (state & 1) { // started, seeding or leeching
            var status = '';
            if (done === 1000) {
                //OV_FL_SEEDING
                status = manager.language.OV_FL_SEEDING;
            } else {
                //OV_FL_DOWNLOADING
                status = manager.language.OV_FL_DOWNLOADING;
            }
            if (!(state & 64)) {
                return "[F] " + status;
            } else {
                return status;
            }
        } else if (state & 2) { // checking
            //OV_FL_CHECKED //Progress
            return manager.language.OV_FL_CHECKED.replace('%:.1d%', manager.apiGetDone(api));
        } else if (state & 16) { // error
            //OV_FL_ERROR //Progress
            var error = api[21];
            if (error && manager.language.lang !== 'en' && error.substr(0, 6) === 'Error:') {
                var errMsg = manager.language.OV_FL_ERROR;
                if (errMsg.slice(-1) === '!') {
                    errMsg = errMsg.substr(0, errMsg.length -1);
                }
                error = errMsg+error.substr(5);
            }
            return error || manager.language.OV_FL_ERROR;
        } else if (state & 64) { // queued
            if (done === 1000) {
                //OV_FL_QUEUED_SEED
                return manager.language.OV_FL_QUEUED_SEED;
            } else {
                //OV_FL_QUEUED
                return manager.language.OV_FL_QUEUED;
            }
        } else if (done == 1000) { // finished
            //OV_FL_FINISHED
            return manager.language.OV_FL_FINISHED;
        } else { // stopped
            //OV_FL_STOPPED
            return manager.language.OV_FL_STOPPED;
        }
    },
    bytesToText: function(bytes, nan, ps) {
        //переводит байты в строчки
        var sizes = (ps === undefined) ? manager.language.sizeList : manager.language.sizePsList;
        sizes = JSON.parse(sizes);
        if (nan === undefined) {
            nan = 'n/a';
        }
        if (bytes === 0) {
            return nan;
        }
        var i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
        if (i === 0) {
            return (bytes / Math.pow(1024, i)) + ' ' + sizes[i];
        }
        return (bytes / Math.pow(1024, i)).toFixed(1) + ' ' + sizes[i];
    },
    unixTimeToTextOut: function(i) {
        //выписывает отсчет времени из unixtime
        var timeAgoList = manager.language.timeOutList;
        timeAgoList = JSON.parse(timeAgoList);
        if (i === -1) {
            return '∞';
        }
        var day = Math.floor(i / 60 / 60 / 24);
        var week = Math.floor(day / 7);
        var hour = Math.floor((i - day * 60 * 60 * 24) / 60 / 60);
        var minutes = Math.floor((i - day * 60 * 60 * 24 - hour * 60 * 60) / 60);
        var seconds = Math.floor((i - day * 60 * 60 * 24 - hour * 60 * 60 - minutes * 60));
        day = Math.floor(i / 60 / 60 / 24 - 7 * week);
        if (week > 10)
            return '∞';
        if (week > 0)
            return week + timeAgoList[0] + ' ' + day + timeAgoList[1];
        if (day > 0)
            return day + timeAgoList[1] + ' ' + hour + timeAgoList[2];
        if (hour > 0)
            return hour + timeAgoList[2] + ' ' + minutes + timeAgoList[3];
        if (minutes > 0)
            return minutes + timeAgoList[3] + ' ' + seconds + timeAgoList[4];
        if (seconds > 0)
            return seconds + timeAgoList[4];
        return '∞';
    },
    unixTimeToTimeStamp: function(shtamp) {
        if (!shtamp) {
            return '∞';
        }
        var dt = new Date(shtamp * 1000);
        var m = dt.getMonth() + 1;
        if (m < 10)
            m = '0' + m.toString();
        var d = dt.getDate();
        if (d < 10)
            d = '0' + d.toString();
        var h = dt.getHours();
        if (h < 10)
            h = '0' + h.toString();
        var mi = dt.getMinutes();
        if (mi < 10)
            mi = '0' + mi.toString();
        var sec = dt.getSeconds();
        if (sec < 10)
            sec = '0' + sec.toString();
        return dt.getFullYear() + '-' + m + '-' + d + ' ' + h + ':' + mi + ':' + sec;
    },
    trCreateCell: {
        name: function(key, api) {
            var div, span;
            var node = mono.create('td', {
                class: key,
                append: div = mono.create('div', {
                    append: span = mono.create('span')
                })
            });
            var update = function(api) {
                div.title = api[2];
                span.textContent = api[2];
            };
            update(api);
            return {
                node: node,
                update: update
            };
        },
        order: function(key, api) {
            var div;
            var node = mono.create('td', {
                class: key,
                append: div = mono.create('div')
            });
            var update = function(api) {
                var text = api[17];
                if (text < 0) {
                    text = '*';
                }
                div.textContent = text;
            };
            update(api);
            return {
                node: node,
                update: update
            };
        },
        size: function(key, api) {
            var div;
            var node = mono.create('td', {
                class: key,
                append: div = mono.create('div')
            });
            var update = function(api) {
                var text = manager.bytesToText(api[3]);
                div.title = text;
                div.textContent = text;
            };
            update(api);
            return {
                node: node,
                update: update
            };
        },
        remaining: function(key, api) {
            var div;
            var node = mono.create('td', {
                class: key,
                append: div = mono.create('div')
            });
            var update = function(api) {
                var text = api[3] - api[5];
                if (text < 0) {
                    text = 0;
                }
                div.textContent = text;
            };
            update(api);
            return {
                node: node,
                update: update
            };
        },
        done: function(key, api) {
            var div1, div2;
            var node = mono.create('td', {
                class: key,
                append: mono.create('div', {
                    class: 'progress_b',
                    append: [
                        div1 = mono.create('div', {
                            class: 'val'
                        }),
                        div2 = mono.create('div', {
                            class: 'progress_b_i'
                        })
                    ]
                })
            });
            var update = function(api) {
                var color = (api[1] === 201 && api[4] === 1000) ? '#41B541' : '#3687ED';
                div1.textContent = manager.apiGetDone(api, 1);
                div2.style.width = manager.apiGetDone(api);
                div2.style.backgroundColor = color;
            };
            update(api);
            return {
                node: node,
                update: update
            }
        },
        status: function(key, api) {
            var div;
            var node = mono.create('td', {
                class: key,
                append: div = mono.create('div')
            });
            var update = function(api) {
                var text = manager.trGetStatusInfo(api);
                div.textContent = text;
                div.title = text;
            };
            update(api);
            return {
                node: node,
                update: update
            }
        },
        seeds: function(key, api) {
            var div;
            var node = mono.create('td', {
                class: key,
                append: div = mono.create('div')
            });
            var update = function(api) {
                div.textContent = api[15];
            };
            update(api);
            return {
                node: node,
                update: update
            }
        },
        peers: function(key, api) {
            var div;
            var node = mono.create('td', {
                class: key,
                append: div = mono.create('div')
            });
            var update = function(api) {
                div.textContent = api[13];
            };
            update(api);
            return {
                node: node,
                update: update
            }
        },
        seeds_peers: function(key, api) {
            var div;
            var node = mono.create('td', {
                class: key,
                append: div = mono.create('div')
            });
            var update = function(api) {
                var text = api[14] + '/' + api[12];
                div.textContent = text;
            };
            update(api);
            return {
                node: node,
                update: update
            }
        },
        downspd: function(key, api) {
            var div;
            var node = mono.create('td', {
                class: key,
                append: div = mono.create('div')
            });
            var update = function(api) {
                var text = manager.bytesToText(api[9], '', 1);
                div.textContent = text;
            };
            update(api);
            return {
                node: node,
                update: update
            }
        },
        upspd: function(key, api) {
            var div;
            var node = mono.create('td', {
                class: key,
                append: div = mono.create('div')
            });
            var update = function(api) {
                var text = manager.bytesToText(api[8], '', 1);
                div.textContent = text;
            };
            update(api);
            return {
                node: node,
                update: update
            }
        },
        eta: function(key, api) {
            var div;
            var node = mono.create('td', {
                class: key,
                append: div = mono.create('div')
            });
            var update = function(api) {
                var text = manager.unixTimeToTextOut(api[10]);
                div.textContent = text;
                div.title = text;
            };
            update(api);
            return {
                node: node,
                update: update
            }
        },
        upped: function(key, api) {
            var div;
            var node = mono.create('td', {
                class: key,
                append: div = mono.create('div')
            });
            var update = function(api) {
                var text = manager.bytesToText(api[6], 0);
                div.textContent = text;
            };
            update(api);
            return {
                node: node,
                update: update
            }
        },
        downloaded: function(key, api) {
            var div;
            var node = mono.create('td', {
                class: key,
                append: div = mono.create('div')
            });
            var update = function(api) {
                var text = manager.bytesToText(api[5], 0);
                div.textContent = text;
            };
            update(api);
            return {
                node: node,
                update: update
            }
        },
        shared: function(key, api) {
            var div;
            var node = mono.create('td', {
                class: key,
                append: div = mono.create('div')
            });
            var update = function(api) {
                var text = api[7] / 1000;
                div.textContent = text;
            };
            update(api);
            return {
                node: node,
                update: update
            }
        },
        avail: function(key, api) {
            var div;
            var node = mono.create('td', {
                class: key,
                append: div = mono.create('div')
            });
            var update = function(api) {
                var text = Math.round((api[16] / 65535) * 1000) / 1000;
                div.textContent = text;
            };
            update(api);
            return {
                node: node,
                update: update
            }
        },
        label: function(key, api) {
            var div;
            var node = mono.create('td', {
                class: key,
                append: div = mono.create('div')
            });
            var update = function(api) {
                var text = api[11];
                div.textContent = text;
                div.title = text;
            };
            update(api);
            return {
                node: node,
                update: update
            }
        },
        added: function(key, api) {
            var div;
            var node = mono.create('td', {
                class: key,
                append: div = mono.create('div')
            });
            var update = function(api) {
                var text = manager.unixTimeToTimeStamp(api[23]);
                div.textContent = text;
                div.title = text;
            };
            update(api);
            return {
                node: node,
                update: update
            }
        },
        completed: function(key, api) {
            var div;
            var node = mono.create('td', {
                class: key,
                append: div = mono.create('div')
            });
            var update = function(api) {
                var text = manager.unixTimeToTimeStamp(api[24]);
                div.textContent = text;
                div.title = text;
            };
            update(api);
            return {
                node: node,
                update: update
            }
        },
        actions: function(key, api) {
            var div;
            var node = mono.create('td', {
                class: key,
                append: mono.create('div', {
                    class: 'btns',
                    append: [
                        mono.create('a', {
                            href: '#start',
                            title: manager.language['ML_START'],
                            class: 'start'
                        }),
                        mono.create('a', {
                            href: '#pause',
                            title: manager.language['ML_PAUSE'],
                            class: 'pause'
                        }),
                        mono.create('a', {
                            href: '#stop',
                            title: manager.language['ML_STOP'],
                            class: 'stop'
                        })
                    ]
                })
            });
            return {
                node: node
            }
        }
    },
    trItemCreate: function(item) {
        var api = item.api;
        item.cell = {};
        item.node = mono.create('tr', {
            id: api[0],
            data: {
                label: api[11],
                sid: api[22],
                path: api[26]
            },
            append: (function(){
                var tdList = [];
                for (var columnName in manager.varCache.trColumnList) {
                    var column = manager.varCache.trColumnList[columnName];
                    if (column.display !== 1) {
                        continue;
                    }
                    var cell = manager.trCreateCell[columnName](columnName, item.api);
                    item.cell[columnName] = cell.update;
                    tdList.push(cell.node);
                }
                return tdList;
            }())
        });
        item.display = 1;

        if (manager.trItemIsInFilter(item)) {
            item.node.classList.add('filtered');
            item.display = 0;
        }
    },
    trGetApiDiff: function(oldArr, newArray) {
        var first = oldArr;
        var second = newArray;
        if (first.length < second.length) {
            second = first;
            first = newArray;
        }
        var diff = [];
        for (var i = 0, lenA = first.length; i < lenA; i++) {
            if (manager.trApiIndexToChanges[i] === undefined) {
                continue;
            }
            var itemA = first[i];
            var itemB = second[i];
            if (itemA !== itemB) {
                diff.push(i);
            }
        }
        return diff;
    },
    trApiIndexToChanges: {
        1: function(changes) {
            changes.status = manager.varCache.trColumnList.status.display;
            changes.done = manager.varCache.trColumnList.done.display;
        },
        2: function(changes) {
            changes.name = manager.varCache.trColumnList.name.display;
        },
        3: function(changes) {
            changes.size = manager.varCache.trColumnList.size.display;
            changes.remaining = manager.varCache.trColumnList.remaining.display;
        },
        4: function(changes) {
            changes.done = manager.varCache.trColumnList.done.display;
        },
        21: function(changes) {
            changes.status = manager.varCache.trColumnList.status.display;
        },
        9: function(changes) {
            changes.downspd = manager.varCache.trColumnList.downspd.display;
            changes.remaining = manager.varCache.trColumnList.remaining.display;
        },
        8: function(changes) {
            changes.upspd = manager.varCache.trColumnList.upspd.display;
        },
        12: function(changes) {
            changes.seeds_peers = manager.varCache.trColumnList.seeds_peers.display;
        },
        14: function(changes) {
            changes.seeds_peers = manager.varCache.trColumnList.seeds_peers.display;
        },
        17: function(changes) {
            changes.order = manager.varCache.trColumnList.order.display;
        },
        15: function(changes) {
            changes.seeds = manager.varCache.trColumnList.seeds.display;
        },
        13: function(changes) {
            changes.peers = manager.varCache.trColumnList.peers.display;
        },
        10: function(changes) {
            changes.eta = manager.varCache.trColumnList.eta.display;
        },
        6: function(changes) {
            changes.upped = manager.varCache.trColumnList.upped.display;
        },
        5: function(changes) {
            changes.downloaded = manager.varCache.trColumnList.downloaded.display;
        },
        7: function(changes) {
            changes.shared = manager.varCache.trColumnList.shared.display;
        },
        16: function(changes) {
            changes.avail = manager.varCache.trColumnList.avail.display;
        },
        11: function(changes) {
            changes.label = manager.varCache.trColumnList.label.display;
            changes.data_label = 1;
        },
        23: function(changes) {
            changes.added = manager.varCache.trColumnList.added.display;
        },
        24: function(changes) {
            changes.completed = manager.varCache.trColumnList.completed.display;
        },
        22: function(changes) {
            changes.data_sid = 1;
        },
        26: function(changes) {
            changes.data_path = 1;
        }
    },
    trItemNodeUpdate: {
        data_label: function(item) {
            item.node.dataset.label = item.api[11];
        },
        data_sid: function(item) {
            item.node.dataset.sid = item.api[22];
        },
        data_path: function(item) {
            item.node.dataset.path = item.api[26];
        }
    },
    trItemUpdate: function(diff, item) {
        if (manager.trItemIsInFilter(item)) {
            if (item.display === 1) {
                item.node.classList.add('filtered');
                item.display = 0;
            }
        } else
        if (item.display !== 1) {
            item.node.classList.remove('filtered');
            item.display = 1;
        }
        var changes = {};
        for (var i = 0, len = diff.length; i < len; i++) {
            var index = diff[i];
            manager.trApiIndexToChanges[index](changes);
        }
        for (var columnName in changes) {
            if (changes[columnName] !== 1) {
                continue;
            }
            var fn = item.cell[columnName];
            if (fn !== undefined) {
                fn(item.api);
                continue;
            }
            fn = manager.trItemNodeUpdate[columnName];
            if (fn !== undefined) {
                fn(item.api);
            }
        }
    },
    trSkipItem: function(api) {
        if (manager.settings.hideSeedStatusItem && api[4] === 1000 && api[1] === 201 ||
            manager.settings.hideFnishStatusItem && api[4] === 1000 && api[1] === 136) {
            return true;
        }
    },
    trColumnToApiIndex: {
        name:        2,
        order:       17,
        size:        3,
        remaining:   'remaining',
        done:        4,
        status:      1,
        seeds:       15,
        peers:       13,
        seeds_peers: 14,
        downspd:     9,
        upspd:       8,
        eta:         10,
        upped:       6,
        downloaded:  5,
        shared:      7,
        avail:       16,
        label:       11,
        added:       23,
        completed:   24,
        actions:     undefined
    },
    onSort: function(type, index, by, A, B) {
        var apiA = A.api;
        var apiB = B.api;
        var a;
        var b;
        if (typeof index === 'string') {
            if (index === 'remaining') {
                a = apiA[3] - apiA[5];
                b = apiB[3] - apiB[5];
            } else
            if (index === 'pcnt') {
                a = apiA[2] * 100 / apiA[1];
                b = apiB[2] * 100 / apiB[1];
            }else {
                return 0;
            }
        } else {
            a = apiA[index];
            b = apiB[index];
        }
        if (type === 'tr') {
            if (index === 1) {
                if (a === 201 && apiA[4] < 1000) {
                    a += 50;
                }
                if (b === 201 && apiB[4] < 1000) {
                    b += 50;
                }
            }
            if (index === 24 && (a === 0 || b === 0)) {
                if (a === b) {
                    return 0;
                } else if (a < b) {
                    return (by === 1) ? 1 : -1;
                } else if (a > b) {
                    return (by === 1) ? -1 : 1;
                }
            }
        }
        if (a === b) {
            return 0;
        } else if (a < b) {
            return (by === 1) ? -1 : 1;
        } else if (a > b) {
            return (by === 1) ? 1 : -1;
        }
    },
    sortInsertList: function(type, sortedList, currentList) {
        var newPaste = [];
        var fromIndex = null;
        var elList = null;

        for (var i = 0, item; item = sortedList[i]; i++) {
            if (currentList[i] === item) {
                continue;
            }
            fromIndex = i;

            elList = document.createDocumentFragment();
            while (sortedList[i] !== undefined && sortedList[i] !== currentList[i]) {
                var pos = currentList.indexOf(sortedList[i], i);
                if (pos !== -1) {
                    currentList.splice(pos, 1);
                }
                currentList.splice(i, 0, sortedList[i]);

                elList.appendChild(sortedList[i].node);
                i++;
            }

            newPaste.push({
                pos: fromIndex,
                list: elList
            });
        }

        var table = manager.domCache[type+'Body'];
        for (i = 0, item; item = newPaste[i]; i++) {
            if (item.pos === 0) {
                var firstChild = table.firstChild;
                if (firstChild === null) {
                    table.appendChild(item.list);
                } else {
                    table.insertBefore(item.list, firstChild)
                }
            } else
            if (table.childNodes[item.pos] !== undefined) {
                table.insertBefore(item.list, table.childNodes[item.pos]);
            } else {
                table.appendChild(item.list);
            }
        }

        manager.varCache[type+'SortList'] = currentList;
    },
    sort: function(type, column, by) {
        if (column === undefined) {
            column = manager.varCache[type+'SortColumn'];
        }
        if (by === undefined) {
            by = manager.varCache[type+'SortBy'];
        }
        manager.varCache[type+'SortColumn'] = column;
        manager.varCache[type+'SortBy'] = by;

        var columnIndex = manager[type+'ColumnToApiIndex'][column];
        if (columnIndex === undefined) {
            columnIndex = '';
        }

        var sortedList = [];
        for (var hash in manager.varCache[type+'ListItems']) {
            sortedList.push(manager.varCache[type+'ListItems'][hash]);
        }
        sortedList.sort(manager.onSort.bind(undefined, type, columnIndex, by));
        manager.sortInsertList(type, sortedList, manager.varCache[type+'SortList']);
    },
    setDlSpeed: function(value) {
        value = manager.bytesToText(value, '-', 1);
        if (!manager.domCache.dlSpd) {
            return manager.domCache.dlSpeed.appendChild(manager.domCache.dlSpd = mono.create('span', {
                class: 'sum dl',
                text: value
            }));
        }
        manager.domCache.dlSpd.textContent = value;
    },
    setUpSpeed: function(value) {
        value = manager.bytesToText(value, '-', 1);
        if (!manager.domCache.upSpd) {
            return manager.domCache.upSpeed.appendChild(manager.domCache.upSpd = mono.create('span', {
                class: 'sum up',
                text: value
            }));
        }
        manager.domCache.upSpd.textContent = value;

    },
    trRemoveItem: function(hash) {
        var item = manager.varCache.trListItems[hash];
        if (!item) {
            return;
        }
        manager.varCache.trSortList.splice(manager.varCache.trSortList.indexOf(item), 1);
        item.node.parentNode.removeChild(item.node);
        delete manager.varCache.trListItems[hash];
    },
    trFullUpdatePrepare: function(list) {
        var rmList = [];
        for (var n = 0, item; item = manager.varCache.trSortList[n]; n++) {
            var itemHash = item.api[0];
            var found = false;
            for (var i = 0, apiNew; apiNew = list[i]; i++) {
                if (apiNew[0] === itemHash) {
                    found = true;
                    break;
                }
            }
            if (!found) {
                rmList.push(itemHash);
            }
        }
        for (var i = 0, hash; hash = rmList[i]; i++) {
            manager.trRemoveItem(hash);
        }
    },
    writeTrList: function(data) {
        var dlSpeed = 0;
        var upSpeed = 0;

        if (data.torrentm !== undefined) {
            // remove items from dom
            for (var i = 0, hash; hash = data.torrentm[i]; i++) {
                manager.trRemoveItem(hash);
            }
        }

        if (data.torrents !== undefined) {
            // remove old items
            manager.trFullUpdatePrepare(data.torrents);
        }

        var list = data.torrents || data.torrentp || [];
        for (var i = 0, api; api = list[i]; i++) {
            dlSpeed += api[9];
            upSpeed += api[8];

            if (manager.trSkipItem(api)) {
                continue;
            }

            var hash = api[0];
            var item = manager.varCache.trListItems[hash];
            if (item === undefined) {
                item = manager.varCache.trListItems[hash] = {};
                item.api = api;
                manager.trItemCreate(item);
            } else {
                var diffList = manager.trGetApiDiff(item.api, api);
                if (diffList.length === 0) {
                    continue;
                }
                item.api = api;
                manager.trItemUpdate(diffList, item);
            }
        }

        manager.setDlSpeed(dlSpeed);
        manager.setUpSpeed(upSpeed);

        manager.sort('tr');

        if (data.files !== undefined) {
            manager.writeFlList(data);
        }
    },
    extend: function(objA, objB) {
        for (var key in objB) {
            objA[key] = objB[key];
        }
    },
    updateTrackerList: function(onReady) {
        manager.timer.wait = true;

        var data = {list: 1};
        if (manager.varCache.flListLayer.param !== undefined) {
            manager.extend(data, manager.varCache.flListLayer.param);
        }

        mono.sendMessage({action: 'api', data: data}, function(data) {
            manager.timer.wait = false;
            onReady && onReady();
            manager.writeTrList(data);
        });
    },
    timer: {
        timer: undefined,
        wait: false,
        start: function() {
            var _this = this;
            this.wait = false;
            clearInterval(this.timer);
            this.timer = setInterval(function() {
                if (_this.wait) {
                    return;
                }
                manager.updateTrackerList();
            }, manager.settings.popupUpdateInterval);
        },
        stop: function() {
            clearInterval(this.timer);
        }
    },
    flCreateCell: {
        checkbox: function(columnName, api) {
            var node = mono.create('td', {
                class: columnName,
                append: mono.create('input', {
                    type: 'checkbox'
                })
            });
            return {
                node: node
            }
        },
        name: function(columnName, api) {
            var span;
            var node = mono.create('td', {
                class: columnName,
                append: mono.create('div', {
                    append: [
                        span = mono.create('span')
                    ]
                })
            });
            var update = function(api) {
                node.title = api[0];
                span.textContent = api[0];
            };
            update(api);
            return {
                node: node,
                update: update
            }
        },
        size: function(columnName, api) {
            var node = mono.create('td', {
                class: columnName,
                append: mono.create('div', {
                    text: manager.bytesToText(api[1], '0')
                })
            });
            return {
                node: node
            }
        },
        downloaded: function(columnName, api) {
            var div;
            var node = mono.create('td', {
                class: columnName,
                append: div = mono.create('div')
            });
            var update = function(api) {
                div.textContent = manager.bytesToText(api[2], '0');
            };
            update(api);
            return {
                node: node,
                update: update
            }
        },
        pcnt: function(columnName, api) {
            var div1, div2;
            var node = mono.create('td', {
                class: columnName,
                append: mono.create('div', {
                    class: 'progress_b',
                    append: [
                        div1 = mono.create('div', {
                            class: 'val'
                        }),
                        div2 = mono.create('div', {
                            class: 'progress_b_i'
                        })
                    ]
                })
            });
            var update = function(api) {
                var color = (api[1] === api[2] && api[3] !== 0) ? '#41B541' : '#3687ED';
                var progress = Math.round((api[2] * 100 / api[1]) * 10) / 10;
                div1.textContent = progress + '%';
                div2.style.width = Math.round(progress) + '%';
                div2.style.backgroundColor = color;
            };
            update(api);
            return {
                node: node,
                update: update
            }
        },
        prio: function(columnName, api) {
            var priorityList = ['MF_DONT', 'MF_LOW', 'MF_NORMAL', 'MF_HIGH'];
            var div;
            var node = mono.create('td', {
                class: columnName,
                append: div = mono.create('div')
            });
            var update = function(api) {
                var priority = manager.language[priorityList[api[3]]];
                node.title = priority;
                div.textContent = priority;
            };
            update(api);
            return {
                node: node,
                update: update
            }
        }
    },
    flItemCreate: function(item) {
        item.cell = {};
        item.node = mono.create('tr', {
            data: {
                index: item.index
            },
            append: (function() {
                var tdList = [];
                for (var columnName in manager.varCache.flColumnList) {
                    var column = manager.varCache.flColumnList[columnName];
                    if (column.display !== 1) {
                        continue;
                    }
                    var cell = manager.flCreateCell[columnName](columnName, item.api);
                    item.cell[columnName] = cell.update;
                    tdList.push(cell.node);
                }
                return tdList;
            }())
        });
    },
    flApiIndexToChanges: {
        0: function(changes) {
            changes.name = manager.varCache.flColumnList.name.display;
        },
        1: function(changes) {
            changes.size = manager.varCache.flColumnList.size.display;
        },
        2: function(changes) {
            changes.downloaded = manager.varCache.flColumnList.downloaded.display;
            changes.pcnt = manager.varCache.flColumnList.pcnt.display;
        },
        3: function(changes) {
            changes.prio = manager.varCache.flColumnList.prio.display;
            changes.pcnt = manager.varCache.flColumnList.pcnt.display;
        }
    },
    flGetApiDiff: function(oldArr, newArray) {
        var first = oldArr;
        var second = newArray;
        if (first.length < second.length) {
            second = first;
            first = newArray;
        }
        var diff = [];
        for (var i = 0, lenA = first.length; i < lenA; i++) {
            if (manager.flApiIndexToChanges[i] === undefined) {
                continue;
            }
            var itemA = first[i];
            var itemB = second[i];
            if (itemA !== itemB) {
                diff.push(i);
            }
        }
        return diff;
    },
    flItemUpdate: function(diff, item) {
        var changes = {};
        for (var i = 0, len = diff.length; i < len; i++) {
            var index = diff[i];
            manager.flApiIndexToChanges[index](changes);
        }
        for (var columnName in changes) {
            if (changes[columnName] !== 1) {
                continue;
            }
            var fn = item.cell[columnName];
            if (fn !== undefined) {
                fn(item.api);
            }
        }
    },
    flColumnToApiIndex: {
        checkbox: undefined,
        name: 0,
        size: 1,
        downloaded: 2,
        pcnt: 'pcnt',
        prio: 3
    },
    flClearList: function() {
        manager.varCache.flSortList = [];
        manager.varCache.flListItems = {};
        manager.domCache.flBody.textContent = '';
    },
    writeFlList: function(data) {
        if (!data.files) {
            return;
        }

        var flListLayer = manager.varCache.flListLayer;
        var hash = data.files[0];
        if (hash !== flListLayer.hash) {
            return;
        }

        var fileList = data.files[1];
        if (fileList.length === 0) {
            // if magnet is loading
            return;
        }

        for (var index = 0, api; api = fileList[index]; index++) {
            var item = manager.varCache.flListItems[index];
            if (item === undefined) {
                item = manager.varCache.flListItems[index] = {};
                item.api = api;
                item.index = index;
                manager.flItemCreate(item);
            } else {
                var diffList = manager.flGetApiDiff(item.api, api);
                if (diffList.length === 0) {
                    continue;
                }
                item.api = api;
                manager.flItemUpdate(diffList, item);
            }
        }

        if (flListLayer.loading) {
            flListLayer.loading.parentNode.removeChild(flListLayer.loading);
            delete flListLayer.loading;
        }

        manager.sort('fl');
    },
    flListShow: function(hash) {
        var flListLayer = manager.varCache.flListLayer = {};
        flListLayer.hash = hash;
        var requestData = {action: 'getfiles', hash: hash};

        var trItem = manager.varCache.trListItems[hash];
        var trNode = trItem.node;
        trNode.classList.add('selected');

        document.body.appendChild(flListLayer.closeLayer = mono.create('div', {
            class: 'file-list-layer-temp',
            on: ['mousedown', function() {
                flListLayer.close();
            }]
        }));

        manager.flWriteHead();
        manager.domCache.flLayer.appendChild(flListLayer.loading = mono.create('div', {
            class: 'file-list-loading',
            style: {
                top: (manager.varCache.flHeight / 2 - 15)+'px',
                left: (manager.varCache.flWidth / 2 - 15)+'px'
            }
        }));

        var folderEl = manager.domCache.flBottom.querySelector('li.path > input');
        var folder = trItem.api[26];
        mono.create(folderEl, {
            title: folder,
            value: folder,
            onCreate: function(el) {
                el.focus();
            }
        });

        mono.sendMessage({action: 'api', data: requestData}, function(data) {
            manager.writeFlList(data);
            flListLayer.param = requestData;
        });

        manager.domCache.fl.style.display = 'block';

        flListLayer.close = function() {
            manager.varCache.flListLayer = {};
            manager.domCache.fl.style.display = 'none';
            flListLayer.closeLayer.parentNode.removeChild(flListLayer.closeLayer);
            trNode.classList.remove('selected');

            manager.domCache.flFixedHead.removeChild(manager.domCache.flFixedHead.firstChild);
            manager.domCache.flHead.removeChild(manager.domCache.flHead.firstChild);

            manager.varCache.flSortList = [];
            manager.varCache.flListItems = {};
            manager.domCache.flBody.textContent = '';

            if (flListLayer.loading) {
                flListLayer.loading.parentNode.removeChild(flListLayer.loading);
                delete flListLayer.loading;
            }
        }
    },
    setColumSort: function(node, columnName, by, type) {
        var thList = manager.domCache[type+'FixedHead'].querySelectorAll(['.sortDown', '.sortUp']);
        for (var i = 0, item; item = thList[i]; i++) {
            item.classList.remove('sortDown');
            item.classList.remove('sortUp');
        }

        if (by === undefined) {
            by = manager.varCache[type+'SortBy'];
        } else {
            by = by ? 0 : 1;
        }

        var storage = {};
        storage[type+'SortOptions'] = {
            column: columnName,
            by: by
        };

        manager.varCache[type+'SortBy'] = by;
        manager.varCache[type+'SortColumn'] = columnName;

        manager.sort(type);

        by && node.classList.add('sortDown');
        !by && node.classList.add('sortUp');

        mono.storage.set(storage);
    },
    updateHead: function(type) {
        var oldHead = manager.domCache[type+'FixedHead'].firstChild;
        if (oldHead) {
            oldHead.parentNode.removeChild(oldHead);
        }
        oldHead = manager.domCache[type+'Head'].firstChild;
        if (oldHead) {
            oldHead.parentNode.removeChild(oldHead);
        }

        manager[type+'WriteHead']();
    },
    capitalize: function(string) {
        return string.substr(0, 1).toUpperCase()+string.substr(1);
    },
    tableResize: function(e) {
        if (e.button !== 0) {
            return;
        }
        var _this = manager.tableResize;
        _this.enable = true;

        var column = this.parentNode;
        var type = column.dataset.type;
        var columnName = column.dataset.name;


        var currentSize = column.clientWidth;

        var startXPos = e.clientX;
        var delta = 0;

        var styleType = type === 'tr' ? 'torrent-list' : 'fl';
        var styleBody = '.'+styleType+'-layer th.' + columnName + ',' +
        ' .'+styleType+'-layer td.' + columnName + ' {' +
            'max-width: {size}px;' +
            'min-width: {size}px;' +
        '}';

        var styleEl = mono.create('style');
        document.body.appendChild(styleEl);

        document.body.style.width = document.body.clientWidth+'px';

        var newSize = currentSize;
        var onMouseMove = function(e) {
            var xPos = e.x;
            delta = xPos - startXPos - 6;
            newSize = currentSize + delta;
            if (newSize < 16) {
                newSize = 16;
            }
            styleEl.textContent = styleBody.replace(/\{size\}/g, newSize);
        };
        document.body.addEventListener('mousemove', onMouseMove);
        document.body.addEventListener('mouseup', function onMouseDown(e) {
            e.stopPropagation();
            _this.enable = false;

            document.body.removeEventListener('mousemove', onMouseMove);
            document.body.removeEventListener('mouseup', onMouseDown);
            styleEl.parentNode.removeChild(styleEl);
            document.body.style.width = 'initial';

            manager.varCache[type+'ColumnList'][columnName].width = newSize;
            mono.sendMessage({action: 'set'+manager.capitalize(type)+'ColumnArray', data: manager.varCache[type+'ColumnArray']});

            manager.updateHead(type);
        });
    },
    prepareColumnList: function(columnList) {
        var obj = {};
        for (var n = 0, item; item = columnList[n]; n++) {
            obj[item.column] = item;
        }
        return obj;
    },
    trReadStatus: function(api) {
        var stat = api[1];
        var loaded = !!(stat & 128);
        var queued = !!(stat & 64);
        var paused = !!(stat & 32);
        var error = !!(stat & 16);
        var checked = !!(stat & 8);
        var start_after_check = !!(stat & 4);
        var checking = !!(stat & 2);
        var started = !!(stat & 1);

        var actionList = {
            recheck: !checking && !started && !queued ? 1 : 0,
            stop: checking || started || queued ? 1 : 0,
            unpause: (started || checking) && paused ? 1 : 0,
            pause: !paused && (checking || started || queued) ? 1 : 0,
            start: !(queued || checking) || paused ? 1 : 0,
            forcestart: (!started || queued || paused) && !checking ? 1 : 0
        };
        if (actionList.pause === 1) {
            actionList.unpause = 0;
        }

        return actionList;
    },
    updateLabesCtx: function (trigger, hash) {
        var ul = trigger.items.labels.$node.children('ul');
        var current_label = manager.varCache.trListItems[hash].api[11];
        var items = trigger.items.labels.items;
        if (current_label) {
            if (items.delLabel === undefined) {
                items.delLabel = {
                    name: manager.language.OV_REMOVE_LABEL,
                    $node: $('<li>', {'class': 'context-menu-item'}).data({
                        contextMenuKey: 'delLabel',
                        contextMenu: trigger.items.labels,
                        contextMenuRoot: trigger
                    }).append(
                        $('<span>', {text: manager.language.OV_REMOVE_LABEL})
                    )
                };
                items.delLabel.$node.prependTo(trigger.items.labels.$node.children('ul'));
                items.delLabel.$node.on('click', function () {
                    // sendAction({list: 1, action: 'setprops', s: 'label', hash: trigger.items.labels.id, v: ''});
                    $('#context-menu-layer').trigger('mousedown');
                });
            }
            if (items.addLabel !== undefined) {
                items.addLabel.$node.remove();
                delete items.addLabel;
            }
        } else {
            if (items.addLabel === undefined) {
                items.addLabel = {
                    name: manager.language.OV_NEW_LABEL,
                    $node: $('<li>', {'class': 'context-menu-item'}).data({
                        contextMenuKey: 'addLabel',
                        contextMenu: trigger.items.labels,
                        contextMenuRoot: trigger
                    }).append(
                        $('<span>', {text: manager.language.OV_NEW_LABEL})
                    )
                };
                items.addLabel.$node.prependTo(trigger.items.labels.$node.children('ul'));
                items.addLabel.$node.on('click', function () {
                    /*notify([
                        {type: 'input', text: _lang_arr[115]}
                    ], _lang_arr[116][0], _lang_arr[116][1], function (arr) {
                        if (arr === undefined) {
                            return;
                        }
                        var label = arr[0];
                        if (label === undefined) {
                            return;
                        }
                        sendAction({list: 1, action: 'setprops', s: 'label', hash: trigger.items.labels.id, v: label});
                    });*/
                    $('#context-menu-layer').trigger('mousedown');
                });
            }
            if (items.delLabel !== undefined) {
                items.delLabel.$node.remove();
                delete items.delLabel;
            }
        }
        for (var i = 0, item; item = manager.varCache.labels[i]; i++) {
            if (item.custom) continue;
            var label = item.label;
            if (items['_' + label] === undefined) {
                items['_' + label] = {
                    name: label,
                    $node: $('<li>', {'class': 'context-menu-item'}).data({
                        contextMenuKey: '_' + label,
                        contextMenu: trigger.items.labels,
                        contextMenuRoot: trigger
                    }).append($('<span>', {text: label}))
                };
                items['_' + label].$node.appendTo(trigger.items.labels.$node.children('ul'));
                items['_' + label].$node.on('click', function () {
                    /*
                    sendAction({list: 1, action: 'setprops', s: 'label', hash: trigger.items.labels.id, v: $(this).data('key')});
                    */
                    $('#context-menu-layer').trigger('mousedown');
                });
            }
        }
        if (manager.varCache.labels.length > 0 && items.s === undefined) {
            items.s = {
                name: '-',
                $node: $('<li>', {'class': 'context-menu-item  context-menu-separator not-selectable'}).data({
                    contextMenuKey: 's',
                    contextMenu: trigger.items.labels,
                    contextMenuRoot: trigger
                })
            };
            if (items.delLabel !== undefined) {
                items.delLabel.$node.after(items.s.$node);
            } else {
                items.addLabel.$node.after(items.s.$node);
            }
        } else if (items.s !== undefined) {
            items.s.$node.remove();
            delete items.s;
        }
        for (var key in items) {
            var item = items[key];
            if (key[0] !== '_') {
                continue;
            }
            var found = false;
            for (var i = 0, lItem; lItem = manager.varCache.labels[i]; i++) {
                if (lItem.custom) continue;
                if (lItem.label === item.name) {
                    found = true;
                    break;
                }
            }
            if (!found) {
                item.$node.remove();
                delete items[key];
                continue;
            }
            if (item.name !== current_label) {
                item.labelNode && item.labelNode.remove();
                delete item.labelNode;
            } else
            if (item.labelNode === undefined) {
                item.$node.prepend(item.labelNode = $('<label>', {text: '●'}));
            }
        }
    },
    getSpeedArray: function (currentSpeed, count) {
        if (currentSpeed === 0) {
            currentSpeed = 512;
        }
        if (currentSpeed < Math.round(count / 2)) {
            currentSpeed = Math.round(count / 2);
        }
        var arr = new Array(count);
        for (var i = 0; i < count; i++) {
            arr[i] = Math.round((i + 1) / Math.round(count / 2) * currentSpeed);
        }
        return arr;
    },
    setSpeedDom: function(type, speed) {
        var speedNode = manager.varCache.speedLimit[type+'Node'];
        if (speed === 0) {
            if (!speedNode) {
                return;
            }
            speedNode.parentNode.removeChild(speedNode);
            delete manager.varCache.speedLimit[type+'Node'];
            return;
        }
        var value = manager.bytesToText(speed * 1024, '-', 1);
        if (speedNode === undefined) {
            speedNode = manager.varCache.speedLimit[type+'Node'] = mono.create('span', {'class': 'limit '+type, text: value});
            manager.domCache[type+'Speed'].appendChild(speedNode);
            return;
        }
        speedNode.textContent = value;
    },
    updateSpeedCtxMenu: function() {
        var items = manager.varCache.speedLimit.ctxItems;
        var type = manager.varCache.speedLimit.type;
        if (!items) {
            return;
        }
        var speeds = manager.getSpeedArray(manager.varCache.speedLimit[type+'Speed'] || 0, manager.varCache.speedLimit.count);
        var n = 0;
        for (var key in items) {
            var value = items[key];
            if (value.name === undefined) {
                continue;
            }
            if (key !== 'unlimited') {
                if (value.speed !== speeds[n]) {
                    value.speed = speeds[n];
                    value.$node.children('span').text(manager.bytesToText(value.speed * 1024, undefined, 1));
                }
                n++;
            }
            if (value.type !== type) {
                value.type = type;
            }
            if (manager.varCache.speedLimit[type+'Speed'] !== value.speed) {
                value.labelNode && value.labelNode.remove();
                delete value.labelNode;
            } else
            if (value.labelNode === undefined) {
                value.$node.prepend(value.labelNode = $('<label>', {text: '●'}));
            }
        }
    },
    readSettings: function(data) {
        for (var i = 0, item; item = data.settings[i]; i++) {
            var key = item[0];
            var value = item[2];
            if (key === 'max_dl_rate') {
                value = parseInt(value);
                if (manager.varCache.speedLimit.dlSpeed !== value) {
                    manager.varCache.speedLimit.dlSpeed = value;
                    manager.setSpeedDom('dl', value);
                }
            }
            if (key === 'max_ul_rate') {
                value = parseInt(value);
                if (manager.varCache.speedLimit.upSpeed !== value) {
                    manager.varCache.speedLimit.upSpeed = value;
                    manager.setSpeedDom('up', value);
                }
            }
        }
        manager.updateSpeedCtxMenu();
    },
    trToggleColum: function(column) {
        manager.timer.stop();
        var columnObj = manager.varCache.trColumnList[column];
        columnObj.display = columnObj.display === 1 ? 0 : 1;
        manager.updateHead('tr');
        manager.trFullUpdatePrepare([]);
        mono.sendMessage([
            {action: 'getRemoteTorrentList'},
            {action: 'setTrColumnArray', data: manager.varCache.trColumnArray}
        ], function(data) {
            manager.writeTrList({torrents: data.getRemoteTorrentList});
            manager.timer.start();
        });
    },
    flToggleColum: function(column) {
        var flListLayer = manager.varCache.flListLayer;
        if (!flListLayer.param) {
            return;
        }
        manager.timer.stop();
        var columnObj = manager.varCache.flColumnList[column];
        columnObj.display = columnObj.display === 1 ? 0 : 1;
        manager.updateHead('fl');
        manager.flClearList();
        mono.sendMessage([
            {action: 'api', data: flListLayer.param},
            {action: 'setFlColumnArray', data: manager.varCache.flColumnArray}
        ], function(data) {
            manager.writeFlList(data.api);
            manager.timer.start();
        });
    },
    run: function() {
        console.time('manager ready');
        console.time('remote data');

        mono.storage.get([
            'trSortOptions',
            'flSortOptions',
            'selectedLabel'
        ], function(storage) {
            mono.sendMessage([
                {action: 'getLanguage'},
                {action: 'getSettings'},
                {action: 'getTrColumnArray'},
                {action: 'getFlColumnArray'},
                {action: 'getRemoteTorrentList'},
                {action: 'getRemoteLabels'},
                {action: 'getRemoteSettings'},
                {action: 'getPublicStatus'}
            ], function(data) {
                console.timeEnd('remote data');
                console.time('manager render');

                manager.language = data.getLanguage;
                manager.settings = data.getSettings;

                if (manager.options.trWordWrap) {
                    document.body.appendChild(mono.create('style', {
                        text: 'div.torrent-list-layer td div {' +
                            'white-space: normal;word-wrap: break-word;' +
                        '}'
                    }));
                }
                if (manager.options.flWordWrap) {
                    document.body.appendChild(mono.create('style', {
                        text: 'div.fl-layer td div {' +
                            'white-space: normal;word-wrap: break-word;' +
                        '}'
                    }));
                }

                if (manager.settings.popupHeight > 0) {
                    var panelsHeight = 54;
                    manager.domCache.trLayer.style.maxHeight = (manager.settings.popupHeight - panelsHeight) + 'px';
                    manager.domCache.trLayer.style.minHeight = (manager.settings.popupHeight - panelsHeight) + 'px';
                }

                if (storage.trSortOptions) {
                    manager.varCache.trSortColumn = storage.trSortOptions.column;
                    manager.varCache.trSortBy = storage.trSortOptions.by;
                }
                if (storage.flSortOptions) {
                    manager.varCache.flSortColumn = storage.flSortOptions.column;
                    manager.varCache.flSortBy = storage.flSortOptions.by;
                }

                manager.varCache.trColumnList = manager.prepareColumnList(data.getTrColumnArray);
                manager.varCache.flColumnList = manager.prepareColumnList(data.getFlColumnArray);
                manager.varCache.trColumnArray = data.getTrColumnArray;
                manager.varCache.flColumnArray = data.getFlColumnArray;

                manager.domCache.trLayer.addEventListener('scroll', function() {
                    manager.domCache.trTableFixed.style.left = (-this.scrollLeft)+'px';
                });
                manager.domCache.flLayer.addEventListener('scroll', function() {
                    if (this.scrollLeft !== 0) {
                        manager.domCache.flTableFixed.style.left = (-this.scrollLeft + manager.varCache.flLeft) + 'px';
                    } else {
                        manager.domCache.flTableFixed.style.left = 'auto';
                    }
                });

                manager.trWriteHead();

                manager.varCache.currentFilter = storage.selectedLabel || manager.varCache.currentFilter;
                manager.setLabels(data.getRemoteLabels);
                manager.trChangeFilterByLabelBox();
                manager.domCache.labelBox.addEventListener('change', function() {
                    manager.trChangeFilterByLabelBox();
                });

                manager.setStatus(data.getPublicStatus);

                if (!manager.settings.hideSeedStatusItem && !manager.settings.hideFnishStatusItem) {
                    manager.trSkipItem = function(){
                        return false;
                    };
                }

                manager.writeTrList({torrents: data.getRemoteTorrentList});
                manager.updateTrackerList(function() {
                    manager.timer.start();
                });

                manager.readSettings({settings: data.getRemoteSettings});
                mono.sendMessage({action: 'api', data: {action: 'getsettings'}}, function(data) {
                    manager.readSettings(data);
                });

                manager.domCache.menu.querySelector('a.btn.refresh').addEventListener('click', function(e) {
                    e.preventDefault();
                    manager.updateTrackerList(function() {
                        manager.timer.start();
                    });
                });

                manager.domCache.trBody.addEventListener('dblclick', function(e) {
                    var parent = e.target;
                    while (parent !== this) {
                        parent = parent.parentNode;
                        if (parent.tagName === 'TR') {
                            break;
                        }
                    }
                    var hash = parent.id;
                    if (!hash) return;

                    manager.flListShow(hash);
                });

                var onColumntClick = function(e) {
                    var parent = e.target;
                    while (parent !== this) {
                        parent = parent.parentNode;
                        if (parent.tagName === 'TH') {
                            break;
                        }
                    }

                    var sortBy = parent.classList.contains('sortDown') ? 1 : parent.classList.contains('sortUp') ? 0 : undefined;
                    var columnName = parent.dataset.name;
                    var type = parent.dataset.type;
                    if (!type) {
                        return;
                    }
                    if (manager.varCache[type+'ColumnList'][columnName].order !== 1) {
                        return;
                    }
                    manager.setColumSort(parent, columnName, sortBy, type);
                };
                manager.domCache.trFixedHead.addEventListener('click', onColumntClick);
                manager.domCache.flFixedHead.addEventListener('click', onColumntClick);

                manager.varCache.selectBox = selectBox.wrap(manager.domCache.labelBox);

                console.timeEnd('manager render');
                console.timeEnd('manager ready');

                setTimeout(function() {
                    console.time('jquery ready');
                    document.body.appendChild(mono.create('script', {src: 'js/jquery-2.1.3.min.js'}));
                }, 0);
            });
        });
    },
    onDefine: function() {
        $.contextMenu.defaults.delay = 0;
        $.contextMenu.defaults.animation.hide = 'hide';
        $.contextMenu.defaults.animation.show = 'show';
        $.contextMenu.defaults.animation.duration = 0;
        $.contextMenu.defaults.position = function(opt, x, y) {
            var offset;
            // determine contextMenu position
            if (!x && !y) {
                opt.determinePosition.call(this, opt.$menu);
                return;
            } else
            if (x === "maintain" && y === "maintain") {
                // x and y must not be changed (after re-show on command click)
                offset = opt.$menu.position();
            } else {
                // x and y are given (by mouse event)
                offset = {top: y, left: x + 5};
            }

            var $win = $(window);
            // correct offset if viewport demands it
            var bottom = $win.scrollTop() + $win.height();
            var right = $win.scrollLeft() + $win.width();
            var height = opt.$menu.height();
            var width = opt.$menu.width();

            if (offset.top + height > bottom) {
                offset.top -= height;
            }

            if (height + 2 >= bottom) {
                offset.top = 1;
                offset.height = bottom - 2;
            }

            if (offset.left + width > right) {
                offset.left -= width;
            }

            opt.$menu.css(offset);
        };
        $.contextMenu.defaults.positionSubmenu = function($menu) {
            // determine contextMenu position
            var parentMenuItem = this;
            var parentMenuItemHeight = parentMenuItem.height() + 2;
            var parentMenuItemOffset = parentMenuItem.offset();
            var parentMenuItemTop = parentMenuItemOffset.top;


            var parentMenu = parentMenuItem.parent();
            var parentMenuOffset = parentMenu.offset();
            var parentMenuLeft = parentMenuOffset.left;
            // var parentMenuTop = parentMenuOffset.top;

            var parentMenuWidth = parentMenu.width();
            // var parentMenuHeight = parentMenu.height();

            var docWitdh = document.body.clientWidth;
            var docHeight = document.body.clientHeight;

            $menu.css({opacity: 0});
            var menuHeight = $menu.height();
            var top = -parseInt((menuHeight - parentMenuItemHeight) / 2);
            var menuWidth = $menu.width();

            var left;
            if (menuWidth + parentMenuWidth + parentMenuLeft > docWitdh) {
                left = -menuWidth - 1;
            } else {
                left = this.outerWidth() - 1;
            }

            if (parentMenuItemTop + top + menuHeight < 0) {
                top = -parentMenuItemTop;
            } else
            if (parentMenuItemTop + top + menuHeight > docHeight) {
                top -= (parentMenuItemTop + top + menuHeight - docHeight);
            }

            $menu.css({
                top: top,
                left: left,
                opacity: 1
            });
        };

        $.contextMenu({
            zIndex: 3,
            selector: ".torrent-table-body tr",
            className: "torrent",
            events: {
                show: function(trigger) {
                    var hash = this[0].id;
                    var api = manager.varCache.trListItems[hash].api;
                    this.addClass('selected');
                    var availActions = manager.trReadStatus(api);
                    for (var action in trigger.items) {
                        var item = trigger.items[action];
                        if (action === 'labels') {
                            var lable = api[11];
                            if (item.label === lable) {
                                continue;
                            }
                            if (!lable) {
                                item.labelNode && item.labelNode.remove();
                                delete item.labelNode;
                                delete item.label;
                            } else {
                                if (!item.labelNode) {
                                    item.$node.children('span').append(item.labelNode = $('<i>', {text: lable}));
                                } else {
                                    item.labelNode.text(lable);
                                }
                                item.label = lable;
                            }
                            continue;
                        }

                        var state = availActions[action];
                        if (state === undefined) {
                            continue;
                        }

                        if (state !== item.display) {
                            item.display = state;
                            if (state === 1) {
                                item.$node.removeClass('hidden').show();
                            } else {
                                item.$node.addClass('hidden').hide();
                            }
                        }
                    }
                    manager.updateLabesCtx(trigger, hash);
                },
                hide: function() {
                    var hash = this[0].id;
                    if (manager.varCache.flListLayer.hash !== hash) {
                        this.removeClass('selected');
                    }
                }
            },
            items: {
                start: {
                    name: manager.language.ML_START,
                    callback: function (key, trigger) {
                        // sendAction({list: 1, action: 'start', hash: trigger.items[key].id });
                    }
                },
                force_start: {
                    name: manager.language.ML_FORCE_START,
                    callback: function (key, trigger) {
                        // sendAction({list: 1, action: 'forcestart', hash: trigger.items[key].id });
                    }
                },
                pause: {
                    name: manager.language.OV_FL_PAUSED,
                    callback: function (key, trigger) {
                        // sendAction({list: 1, action: 'pause', hash: trigger.items[key].id });
                    }
                },
                unpause: {
                    name: manager.language.ML_START,
                    callback: function (key, trigger) {
                        // sendAction({list: 1, action: 'unpause', hash: trigger.items[key].id });
                    }
                },
                stop: {
                    name: manager.language.ML_STOP,
                    callback: function (key, trigger) {
                        // sendAction({list: 1, action: 'stop', hash: trigger.items[key].id });
                    }
                },
                s1: '-',
                recheck: {
                    name: manager.language.ML_FORCE_RECHECK,
                    callback: function (key, trigger) {
                        // sendAction({list: 1, action: 'recheck', hash: trigger.items[key].id });
                    }
                },
                remove: {
                    name: manager.language.ML_REMOVE,
                    callback: function (key, trigger) {
                        /*notify([
                            {text: _lang_arr[73], type: 'note'}
                        ], _lang_arr[110][0], _lang_arr[110][1], function (cb) {
                            if (cb === undefined) {
                                return;
                            }
                            sendAction({list: 1, action: 'remove', hash: trigger.items[key].id});
                        });*/
                    }
                },
                remove_with: {
                    name: manager.language.ML_REMOVE_AND,
                    items: {
                        remove_torrent: {
                            name: manager.language.ML_DELETE_TORRENT,
                            callback: function (key, trigger) {
                                /*var params = {list: 1, action: 'removetorrent', hash: trigger.items.remove.id };
                                //для 2.xx проверяем версию по наличию статуса
                                if (var_cache.tr_list[params.hash][21] === undefined) {
                                    params.action = 'remove';
                                }
                                sendAction(params);*/
                            }
                        },
                        remove_files: {
                            name: manager.language.ML_DELETE_DATA,
                            callback: function (key, trigger) {
                                // sendAction({list: 1, action: 'removedata', hash: trigger.items.remove.id });
                            }
                        },
                        remove_torrent_files: {
                            name: manager.language.ML_DELETE_DATATORRENT,
                            callback: function (key, trigger) {
                                /*var params = {list: 1, action: 'removedatatorrent', hash: trigger.items.remove.id };
                                //для 2.xx проверяем версию по наличию статуса
                                if (var_cache.tr_list[params.hash][21] === undefined) {
                                    params.action = 'removedata';
                                }
                                sendAction(params);*/
                            }
                        }
                    }
                },
                's2': '-',
                torrent_files: {
                    name: manager.language.showFileList,
                    callback: function (key, trigger) {
                        manager.flListShow(this[0].id);
                    }
                },
                labels: {
                    name: manager.language.OV_COL_LABEL,
                    className: "labels",
                    label: '',
                    items: {}
                }
            }
        });

        $.contextMenu({
            selector: ".fl-table-body tr",
            className: "filelist",
            events: {
                show: function (trigger) {
                    var index = this[0].dataset.index;
                    if (!this.hasClass('selected')) {
                        this.addClass('selected');
                        this.find('input').trigger('click');
                    } else {
                        this.addClass('force');
                    }
                    var priority = manager.varCache.flListItems[index].api[3];
                    for (var action in trigger.items) {
                        var item = trigger.items[action];
                        if (item.priority === undefined) {
                            continue;
                        }
                        if (item.priority !== priority) {
                            item.labelNode && item.labelNode.remove();
                            delete item.labelNode;
                        } else
                        if (item.labelNode === undefined) {
                            item.$node.prepend(item.labelNode = $('<label>', {text: '●'}));
                        }
                    }
                    manager.varCache.flListLayer.ctxSelectArray = [];
                    var itemList = manager.domCache.flBody.querySelector('input:checked');
                    for (var i = 0, item; item = itemList[i]; i++) {
                        manager.varCache.flListLayer.ctxSelectArray.push(item.parentNode.parentNode.dataset.index);
                    }
                },
                hide: function () {
                    if (this.hasClass('selected') && !this.hasClass('force')) {
                        this.removeClass('selected');
                        this.find('input').trigger('click');
                    } else {
                        this.removeClass('force');
                    }
                    manager.varCache.flListLayer.ctxSelectArray = [];
                }
            },
            items: {
                high: {
                    className: 'p3',
                    name: manager.language.MF_HIGH,
                    priority: 3,
                    callback: function (key, trigger) {
                        /*sendAction($.param({action: 'setprio', p: 3}) + '&' + $.param({hash: var_cache.fl_id, f: var_cache.fl_list_ctx_sel_arr}, true));
                        fl_unckeckCkecked();*/
                    }
                },
                normal: {
                    className: 'p2',
                    name: manager.language.MF_NORMAL,
                    priority: 2,
                    callback: function (key, trigger) {
                        /*sendAction($.param({action: 'setprio', p: 2}) + '&' + $.param({hash: var_cache.fl_id, f: var_cache.fl_list_ctx_sel_arr}, true));
                        fl_unckeckCkecked();*/
                    }
                },
                low: {
                    className: 'p1',
                    priority: 1,
                    name: manager.language.MF_LOW,
                    callback: function (key, trigger) {
                        /*sendAction($.param({action: 'setprio', p: 1}) + '&' + $.param({hash: var_cache.fl_id, f: var_cache.fl_list_ctx_sel_arr}, true));
                        fl_unckeckCkecked();*/
                    }
                },
                s: '-',
                dntdownload: {
                    className: 'p0',
                    priority: 0,
                    name: manager.language.MF_DONT,
                    callback: function (key, trigger) {
                        /*sendAction($.param({action: 'setprio', p: 0}) + '&' + $.param({hash: var_cache.fl_id, f: var_cache.fl_list_ctx_sel_arr}, true));
                        fl_unckeckCkecked();*/
                    }
                },
                s1: '-',
                download: {
                    name: manager.language.DLG_RSSDOWNLOADER_24,
                    callback: function (key, trigger) {
                        /**
                         * @namespace chrome.tabs.create
                         */
                        /*var webUi_url = ((_settings.ssl) ? 'https' : 'http') + "://" + _settings.login + ":" + _settings.password + "@" +
                            _settings.ut_ip + ":" + _settings.ut_port + "/";
                        for (var n = 0, item; item = var_cache.fl_list_ctx_sel_arr[n]; n++) {
                            var sid = var_cache.tr_list[var_cache.fl_id][22];
                            if (sid === undefined) {
                                continue;
                            }
                            var fileUrl = webUi_url + 'proxy?sid=' + sid + '&file=' + item + '&disposition=ATTACHMENT&service=DOWNLOAD&qos=0';
                            if (mono.isChrome) {
                                chrome.tabs.create({
                                    url: fileUrl
                                });
                            } else {
                                mono.sendMessage({action: 'openTab', url: fileUrl}, undefined, 'service');
                            }
                        }
                        fl_unckeckCkecked();*/
                    }
                }
            }
        });

        $.contextMenu({
            className: 'speed',
            selector: 'table.status-panel td.speed',
            events: {
                show: function (trigger) {
                    manager.varCache.speedLimit.ctxItems = trigger.items;
                    manager.varCache.speedLimit.type = this.hasClass('download') ? 'dl' : 'up';
                    manager.updateSpeedCtxMenu();
                }
            },
            items: function () {
                //выстраивает внутренности контекстного меню для ограничения скорости
                var items = {};
                items.unlimited = {
                    name: manager.capitalize(manager.language.MENU_UNLIMITED),
                    speed: 0,
                    callback: function (key, toggle) {
                        /*if (toggle.items[key].type === 'download') {
                            setDlSpeed(0);
                        } else {
                            setUpSpeed(0);
                        }*/
                    }
                };
                items["s"] = '-';
                var count = Math.round((manager.settings.popupHeight - 54) / 27);
                if (count > 10) {
                    count = 10;
                }
                manager.varCache.speedLimit.count = count;
                for (var i = 0; i < count; i++) {
                    items['s' + i] = {
                        name: '-',
                        speed: undefined,
                        callback: function (key, toggle) {
                            /*if (toggle.items[key].type === 'download') {
                                setDlSpeed(toggle.items[key].speed);
                            } else {
                                setUpSpeed(toggle.items[key].speed);
                            }*/
                        }
                    };
                }
                return items;
            }()
        });

        $.contextMenu({
            className: 'trColumSelect',
            selector: 'table.torrent-table-head thead',
            events: {
                show: function (trigger) {
                    $.each(manager.varCache.trColumnList, function (key, value) {
                        var item = trigger.items[key];
                        if (value.display !== item.display) {
                            item.display = value.display;
                            if (value.display !== 1) {
                                item.labelNode && item.labelNode.remove();
                                delete item.labelNode;
                            } else
                            if (item.labelNode === undefined) {
                                item.$node.prepend(item.labelNode = $('<label>', {text: '●'}));
                            }
                        }
                    });
                }
            },
            items: function () {
                var items = {};
                $.each(manager.varCache.trColumnList, function (key, value) {
                    items[key] = {
                        name: manager.language[value.lang],
                        callback: function (key) {
                            manager.trToggleColum(key);
                        }
                    };
                });
                return items;
            }()
        });

        $.contextMenu({
            className: 'flColumSelect',
            selector: 'table.fl-table-head thead',
            events: {
                show: function (trigger) {
                    $.each(manager.varCache.flColumnList, function (key, value) {
                        var item = trigger.items[key];
                        if (value.display !== item.display) {
                            item.display = value.display;
                            if (value.display !== 1) {
                                item.labelNode && item.labelNode.remove();
                                delete item.labelNode;
                            } else
                            if (item.labelNode === undefined) {
                                item.$node.prepend(item.labelNode = $('<label>', {text: '●'}));
                            }
                        }
                    });
                }
            },
            items: function () {
                var items = {};
                $.each(manager.varCache.flColumnList, function (key, value) {
                    items[key] = {
                        name: manager.language[value.lang],
                        callback: function (key) {
                            manager.flToggleColum(key);
                        }
                    };
                });
                return items;
            }()
        });
    }
};

var define = function(name) {
    if (name === 'jquery') {
        console.timeEnd('jquery ready');
        console.time('contextMenu ready');
        document.body.appendChild(mono.create('script', {src: 'js/notifer.js'}));
        document.body.appendChild(mono.create('script', {src: 'js/jquery.contextMenu.js'}));
    }
    if (name === 'contextMenu') {
        console.timeEnd('contextMenu ready');
        manager.onDefine();
    }
};
define.amd = {};

manager.run();