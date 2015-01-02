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
        flBottomIsHide: false,
        labels: []
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
                    if (!value.display) {
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
                                    ['mousedown', manager.tableResize.start]
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
                    if (!value.display) {
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
                                    ['mousedown', manager.tableResize.start]
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
            manager.varCache.flBottomIsHide = true;
        } else
        if (manager.varCache.flBottomIsHide === true) {
            manager.domCache.flBottom.style.display = 'block';
            manager.varCache.flBottomIsHide = false;
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
        return mono.create('option', {
            value: item,
            text: isCustom ? (item === 'SEEDING') ? manager.language['OV_FL_'+item.toUpperCase()] : manager.language['OV_CAT_'+item.toUpperCase()] : item,
            data: !isCustom ? undefined : {
                image: item,
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
                if (item.display) {
                    item.node.classList.add('filtered');
                    item.display = false;
                }
            } else {
                if (!item.display) {
                    item.node.classList.remove('filtered');
                    item.display = true;
                }
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
            return api[21] || manager.language.OV_FL_ERROR;
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
        if (shtamp === 0 || shtamp === undefined) {
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
                    if (!column.display) {
                        continue;
                    }
                    var cell = manager.trCreateCell[columnName](columnName, item.api);
                    item.cell[columnName] = cell.update;
                    tdList.push(cell.node);
                }
                return tdList;
            }())
        });
        item.display = true;

        if (manager.trItemIsInFilter(item)) {
            item.node.classList.add('filtered');
            item.display = false;
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
            if (item.display) {
                item.node.classList.add('filtered');
                item.display = false;
            }
        } else {
            if (!item.display) {
                item.node.classList.remove('filtered');
                item.display = true;
            }
        }
        var changes = {};
        for (var i = 0, len = diff.length; i < len; i++) {
            var index = diff[i];
            manager.trApiIndexToChanges[index](changes);
        }
        for (var columnName in changes) {
            if (!changes[columnName]) {
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
    trOnSort: function(index, by, A, B) {
        var apiA = A.api;
        var apiB = B.api;
        var a;
        var b;
        if (typeof index === 'string') {
            if (index === 'remaining') {
                a = apiA[3] - apiA[5];
                b = apiB[3] - apiB[5];
            } else {
                return 0;
            }
        } else {
            a = apiA[index];
            b = apiB[index];
        }
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
        if (a === b) {
            return 0;
        } else if (a < b) {
            return (by === 1) ? -1 : 1;
        } else if (a > b) {
            return (by === 1) ? 1 : -1;
        }
    },
    trSortInsertList: function(sortedList, currentList) {
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

        var table = manager.domCache.trBody;
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

        manager.varCache.trSortList = currentList;
    },
    trSort: function(column, by, newItems) {
        if (newItems === undefined) {
            newItems = [];
        }
        if (column === undefined) {
            column = manager.varCache.trSortColumn;
        }
        if (by === undefined) {
            by = manager.varCache.trSortBy;
        }
        manager.varCache.trSortColumn = column;
        manager.varCache.trSortBy = by;

        var columnIndex = manager.trColumnToApiIndex[column];
        if (columnIndex === undefined) {
            columnIndex = '';
        }

        var sortedList = Array.prototype.concat(manager.varCache.trSortList, newItems);
        sortedList.sort(manager.trOnSort.bind(undefined, columnIndex, by));
        manager.trSortInsertList(sortedList, manager.varCache.trSortList);
    },
    setDownSpd: function(value) {
        value = manager.bytesToText(value, '-', 1);
        if (!manager.domCache.dlSpd) {
            return manager.domCache.dlSpeed.appendChild(manager.domCache.dlSpd = mono.create('span', {
                class: 'sum dl',
                text: value
            }));
        }
        manager.domCache.dlSpd.textContent = value;
    },
    setUpSpd: function(value) {
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
        var downspd = 0;
        var upspd = 0;

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

        var newItems = [];
        var list = data.torrents || data.torrentp || [];
        for (var i = 0, api; api = list[i]; i++) {
            downspd += api[9];
            upspd += api[8];

            if (manager.trSkipItem(api)) {
                continue;
            }

            var hash = api[0];
            var item = manager.varCache.trListItems[hash];
            if (item === undefined) {
                item = manager.varCache.trListItems[hash] = {};
                item.api = api;
                manager.trItemCreate(item);
                newItems.push(item);
            } else {
                var diffList = manager.trGetApiDiff(item.api, api);
                if (diffList.length === 0) {
                    continue;
                }
                item.api = api;
                manager.trItemUpdate(diffList, item);
            }
        }

        manager.setDownSpd(downspd);
        manager.setUpSpd(upspd);

        manager.trSort(undefined, undefined, newItems);

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
                    if (!column.display) {
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
            changes.name = manager.varCache.flColumnList.name.display === 1;
        },
        1: function(changes) {
            changes.size = manager.varCache.flColumnList.size.display === 1;
        },
        2: function(changes) {
            changes.downloaded = manager.varCache.flColumnList.downloaded.display === 1;
            changes.pcnt = manager.varCache.flColumnList.pcnt.display === 1;
        },
        3: function(changes) {
            changes.prio = manager.varCache.flColumnList.prio.display === 1;
            changes.pcnt = manager.varCache.flColumnList.pcnt.display === 1;
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
            if (!changes[columnName]) {
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
    flOnSort: function(index, by, A, B) {
        var apiA = A.api;
        var apiB = B.api;
        var a;
        var b;
        if (typeof index === 'string') {
            if (index === 'pcnt') {
                a = apiA[2] * 100 / apiA[1];
                b = apiB[2] * 100 / apiB[1];
            } else {
                return 0;
            }
        } else {
            a = apiA[index];
            b = apiB[index];
        }
        if (a === b) {
            return 0;
        } else if (a < b) {
            return (by === 1) ? -1 : 1;
        } else if (a > b) {
            return (by === 1) ? 1 : -1;
        }
    },
    flSortInsertList: function(sortedList, currentList) {
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

        var table = manager.domCache.flBody;
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

        manager.varCache.flSortList = currentList;
    },
    flSort: function(column, by, newItems) {
        if (newItems === undefined) {
            newItems = [];
        }
        if (column === undefined) {
            column = manager.varCache.flSortColumn;
        }
        if (by === undefined) {
            by = manager.varCache.flSortBy;
        }
        manager.varCache.flSortColumn = column;
        manager.varCache.flSortBy = by;

        var columnIndex = manager.flColumnToApiIndex[column];
        if (columnIndex === undefined) {
            columnIndex = '';
        }

        var sortedList = Array.prototype.concat(manager.varCache.flSortList, newItems);
        sortedList.sort(manager.flOnSort.bind(undefined, columnIndex, by));
        manager.flSortInsertList(sortedList, manager.varCache.flSortList);
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

        var newItems = [];
        for (var index = 0, api; api = fileList[index]; index++) {
            var item = manager.varCache.flListItems[index];
            if (item === undefined) {
                item = manager.varCache.flListItems[index] = {};
                item.api = api;
                item.index = index;
                manager.flItemCreate(item);
                newItems.push(item);
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

        manager.flSort(undefined, undefined, newItems);
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
        storage[type+'SortColumn'] = columnName;
        storage[type+'SortBy'] = by;

        manager.extend(manager.varCache, storage);

        manager[type+'Sort']();

        by && node.classList.add('sortDown');
        !by && node.classList.add('sortUp');
        mono.storage.set(storage);
    },
    flUpdateHead: function() {
        var oldHead = manager.domCache.flFixedHead.firstChild;
        if (oldHead) {
            oldHead.parentNode.removeChild(oldHead);
        }
        oldHead = manager.domCache.flHead.firstChild;
        if (oldHead) {
            oldHead.parentNode.removeChild(oldHead);
        }
        manager.flWriteHead();
    },
    trUpdateHead: function() {
        var oldHead = manager.domCache.trFixedHead.firstChild;
        if (oldHead) {
            oldHead.parentNode.removeChild(oldHead);
        }
        oldHead = manager.domCache.trHead.firstChild;
        if (oldHead) {
            oldHead.parentNode.removeChild(oldHead);
        }

        manager.trWriteHead();
    },
    capitalize: function(string) {
        return string.substr(0, 1).toUpperCase()+string.substr(1);
    },
    tableResize: {
        enable: false,
        start: function(e) {
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

                manager[type+'UpdateHead']();
            });
        }
    },
    prepareColumnList: function(columnList) {
        var obj = {};
        for (var n = 0, item; item = columnList[n]; n++) {
            obj[item.column] = item;
        }
        return obj;
    },
    run: function() {
        mono.storage.get([
            'trSortColumn',
            'trSortBy',
            'flSortColumn',
            'flSortBy',
            'selectedLabel'], function(storage) {
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

                manager.varCache.trSortColumn = storage.trSortColumn || manager.varCache.trSortColumn;
                manager.varCache.trSortBy = storage.trSortBy === undefined ? 1 : storage.trSortBy;
                manager.varCache.flSortColumn = storage.flSortColumn || manager.varCache.flSortColumn;
                manager.varCache.flSortBy = storage.flSortBy === undefined ? 1 : storage.flSortBy;

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
                mono.sendMessage({action: 'api', data: {action: 'getsettings'}}, function(data) {
                    console.log(data);
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
                    manager.setColumSort(parent, columnName, sortBy, type);
                };
                manager.domCache.trFixedHead.addEventListener('click', onColumntClick);
                manager.domCache.flFixedHead.addEventListener('click', onColumntClick);
            });
        });
    }
};

manager.run();