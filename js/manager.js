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
    domCache: {
        body: document.body,
        menu: document.querySelector('ul.menu'),
        dlSpeed: document.querySelector('.status-panel td.speed.download'),
        upSpeed: document.querySelector('.status-panel td.speed.upload'),
        status: document.querySelector('.status-panel td.status'),
        labelBox: document.querySelector('ul.menu li.select select'),
        trLayer: document.querySelector('.torrent-list-layer'),
        trTableMain: document.querySelector('.torrent-table-body'),
        trTableFixed: document.querySelector('.torrent-table-head'),
        trBody: document.querySelector('.torrent-table-body > tbody'),
        trHead: document.querySelector('.torrent-table-body > thead'),
        trFixedHead: document.querySelector('.torrent-table-head > thead'),
        fl: document.querySelector(".file-list"),
        flLayer: document.querySelector('.file-list > .fl-layer'),
        flTable_main: document.querySelector('.fl-table-body'),
        flTable_fixed: document.querySelector('.fl-table-head'),
        flBody: document.querySelector('.fl-table-body > tbody'),
        flHead: document.querySelector('.fl-table-body > thead'),
        flFixed_head: document.querySelector('.fl-table-head > thead'),
        flBottom: document.querySelector('.file-list ul.bottom-menu'),
        dropLayer: document.querySelector('div.drop_layer')
    },
    varCache: {
        currentFilter: {label: 'all', custom: 1},
        torrentListColumnList: {},
        trListItems: {},
        trSortColumn: 'name',
        trSortBy: 1,
        trSortList: [],
        fileListColumnList: {},
        flSortColumn: 'name',
        flSortBy: 1,
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
    writeTrHead: function() {
        var styleBody = '';
        var width = 0;
        var head = mono.create('tr', {
            append: (function() {
                var thList = [];
                for (var key in manager.varCache.torrentListColumnList) {
                    var value = manager.varCache.torrentListColumnList[key];
                    if (!value.display) {
                        continue;
                    }
                    var orderClass = (manager.varCache.trSortColumn !== key) ? undefined : (manager.varCache.trSortBy === 1) ? 'sortDown' : 'sortUp';
                    thList.push(mono.create('th', {
                        class: [key, orderClass],
                        title: manager.language[value.lang+'_TITLE'],
                        data: {
                            type: key
                        },
                        append: [
                            mono.create('div', {
                                text: manager.language[value.lang+'_TEXT']
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
        document.body.style.width = width;
        mono.isFF && mono.sendMessage({action: 'resize', width: width}, undefined, 'service');

        manager.domCache.trFixedHead.appendChild(head);
        manager.domCache.trHead.appendChild(head.cloneNode(true));

        var graph = document.querySelector('li.graph');
        var selectBox = document.querySelector('li.select');
        graph.style.width = selectBox.offsetLeft - graph.offsetLeft - 5;
    },
    writeFlHead: function() {
        var styleBody = '';
        var width = 0;
        var head = mono.create('tr', {
            append: (function() {
                var thList = [];
                for (var key in manager.varCache.fileListColumnList) {
                    var value = manager.varCache.fileListColumnList[key];
                    if (!value.display) {
                        continue;
                    }
                    var orderClass = (manager.varCache.flSortColumn !== key) ? undefined : (manager.varCache.flSortBy === 1) ? 'sortDown' : 'sortUp';
                    thList.push(mono.create('th', {
                        class: [key, orderClass],
                        title: manager.language[value.lang+'_TITLE'],
                        data: {
                            type: key
                        },
                        append: [
                            (key === 'select') ? mono.create('div', {
                                append: mono.create('input', {
                                    type: 'checkbox'
                                })
                            }) : mono.create('div', {
                                text: manager.language[value.lang+'_TEXT']
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

        if (width > document.body.clientWidth) {
            width = document.body.clientWidth;
            styleBody += 'div.file-list {max-width:' + document.body.clientWidth + 'px; border-radius: 0;}';
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

        var flBodyHeight = popupHeight - 34 - 19;
        var flTableHeight = flBodyHeight - 34;
        manager.varCache.flHeight = flTableHeight;
        manager.varCache.flLeft = (document.body.clientHeight - width) / 2;
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

        manager.domCache.flFixed_head.appendChild(head);
        manager.domCache.flHead.appendChild(head.cloneNode(true));
    },
    getLabelOptionNode: function(item, isCustom) {
        return mono.create('option', {
            value: item,
            text: isCustom ? manager.language['CUSTOM_LABEL_'+item.toUpperCase()] : item,
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
        all: function() {
            return true;
        },
        download: function(item) {
            return item.api[4] !== 1000;
        },
        seeding: function(item) {
            return item.api[1] === 201 && item.api[4] === 1000;
        },
        complite: function(item) {
            return item.api[4] === 1000;
        },
        active: function(item) {
            return item.api[9] !== 0 || item.api[8] !== 0;
        },
        inacive: function(item) {
            return item.api[9] === 0 && item.api[8] === 0;
        },
        no_label: function(item) {
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
            return document.body.appendChild(mono.create('style', {
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

        document.body.appendChild(mono.create('style', {
            class: 'tr-filter',
            text: '.torrent-table-body tbody > tr.filtered{' +
                'display: none;' +
            '}'
        }));
    },
    setStatus: function(statusText) {
        manager.domCache.status.textContent = statusText;
    },
    trGetStatusInfo: function(state, dune) {
        if (state & 32) { // paused
            if (state & 2) {
                //OV_FL_CHECKED //Progress
                return _lang_arr.status[0];
            } else {
                //OV_FL_PAUSED
                return _lang_arr.status[1];
            }
        } else if (state & 1) { // started, seeding or leeching
            var status = '';
            if (dune === 1000) {
                //OV_FL_SEEDING
                status = _lang_arr.status[2];
            } else {
                //OV_FL_DOWNLOADING
                status = _lang_arr.status[3];
            }
            if (!(state & 64)) {
                return "[F] " + status;
            } else {
                return status;
            }
        } else if (state & 2) { // checking
            //OV_FL_CHECKED //Progress
            return _lang_arr.status[0];
        } else if (state & 16) { // error
            //OV_FL_ERROR //Progress
            return _lang_arr.status[4];
        } else if (state & 64) { // queued
            if (dune === 1000) {
                //OV_FL_QUEUED_SEED
                return _lang_arr.status[5];
            } else {
                //OV_FL_QUEUED
                return _lang_arr.status[6];
            }
        } else if (dune == 1000) { // finished
            //OV_FL_FINISHED
            return _lang_arr.status[7];
        } else { // stopped
            //OV_FL_STOPPED
            return _lang_arr.status[8];
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
                var progress = api[4] / 10;
                var color = (api[1] === 201 && api[4] === 1000) ? '#41B541' : '#3687ED';
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
        status: function(key, api) {
            var div;
            var node = mono.create('td', {
                class: key,
                append: div = mono.create('div')
            });
            var update = function(api) {
                var text = (api[21] !== undefined) ? api[21] : manager.trGetStatusInfo(api[1], api[4]);
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
                            title: manager.language['btnStart'],
                            class: 'start'
                        }),
                        mono.create('a', {
                            href: '#pause',
                            title: manager.language['btnPause'],
                            class: 'pause'
                        }),
                        mono.create('a', {
                            href: '#stop',
                            title: manager.language['btnStop'],
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
                for (var columnName in manager.varCache.torrentListColumnList) {
                    var column = manager.varCache.torrentListColumnList[columnName];
                    if (column.display) {
                        var cell = manager.trCreateCell[columnName](columnName, item.api);
                        item.cell[columnName] = cell.update;
                        tdList.push(cell.node);
                    }
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
    getApiDiff: function(oldArr, newArray) {
        var first = oldArr;
        var second = newArray;
        if (first.length < second.length) {
            second = first;
            first = newArray;
        }
        var diff = [];
        for (var i = 0, lenA = first.length; i < lenA; i++) {
            if (manager.apiIndexToChanges[i] === undefined) {
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
    apiIndexToChanges: {
        1: function(changes) {
            changes.status = manager.varCache.torrentListColumnList.status.display;
            changes.dune = manager.varCache.torrentListColumnList.dune.display;
        },
        2: function(changes) {
            changes.name = manager.varCache.torrentListColumnList.name.display;
        },
        3: function(changes) {
            changes.size = manager.varCache.torrentListColumnList.size.display;
            changes.remaining = manager.varCache.torrentListColumnList.remaining.display;
        },
        4: function(changes) {
            changes.dune = manager.varCache.torrentListColumnList.dune.display;
        },
        21: function(changes) {
            changes.status = manager.varCache.torrentListColumnList.status.display;
        },
        9: function(changes) {
            changes.downspd = manager.varCache.torrentListColumnList.downspd.display;
            changes.remaining = manager.varCache.torrentListColumnList.remaining.display;
        },
        8: function(changes) {
            changes.upspd = manager.varCache.torrentListColumnList.upspd.display;
        },
        12: function(changes) {
            changes.seeds_peers = manager.varCache.torrentListColumnList.seeds_peers.display;
        },
        14: function(changes) {
            changes.seeds_peers = manager.varCache.torrentListColumnList.seeds_peers.display;
        },
        17: function(changes) {
            changes.order = manager.varCache.torrentListColumnList.order.display;
        },
        15: function(changes) {
            changes.seeds = manager.varCache.torrentListColumnList.seeds.display;
        },
        13: function(changes) {
            changes.peers = manager.varCache.torrentListColumnList.peers.display;
        },
        10: function(changes) {
            changes.eta = manager.varCache.torrentListColumnList.eta.display;
        },
        6: function(changes) {
            changes.upped = manager.varCache.torrentListColumnList.upped.display;
        },
        5: function(changes) {
            changes.downloaded = manager.varCache.torrentListColumnList.downloaded.display;
        },
        7: function(changes) {
            changes.shared = manager.varCache.torrentListColumnList.shared.display;
        },
        16: function(changes) {
            changes.avail = manager.varCache.torrentListColumnList.avail.display;
        },
        11: function(changes) {
            changes.label = manager.varCache.torrentListColumnList.label.display;
            changes.data_label = 1;
        },
        23: function(changes) {
            changes.added = manager.varCache.torrentListColumnList.added.display;
        },
        24: function(changes) {
            changes.completed = manager.varCache.torrentListColumnList.completed.display;
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
            manager.apiIndexToChanges[index](changes);
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
    columnToApiIndex: {
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
        var fromIndex = undefined;
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
    trSort: function(column, by) {
        if (column === undefined) {
            column = manager.varCache.trSortColumn;
        }
        if (by === undefined) {
            by = manager.varCache.trSortBy;
        }
        manager.varCache.trSortColumn = column;
        manager.varCache.trSortBy = by;

        var columnIndex = manager.columnToApiIndex[column];
        if (columnIndex === undefined) {
            return;
        }

        var sortedList = manager.varCache.trSortList.slice(0);
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
    writeTrList: function(list) {
        var downspd = 0;
        var upspd = 0;

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
                manager.varCache.trSortList.push(item);
            } else {
                var diffList = manager.getApiDiff(item.api, api);
                if (diffList.length === 0) {
                    continue;
                }
                item.api = api;
                manager.trItemUpdate(diffList, item);
            }
        }

        manager.setDownSpd(downspd);
        manager.setUpSpd(upspd);

        manager.trSort();
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
                {action: 'getTorrentListColumnList'},
                {action: 'getFileListColumnList'},
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

                manager.varCache.trSortColumn = storage.trSortColumn || manager.varCache.trSortColumn;
                manager.varCache.trSortBy = storage.trSortBy === undefined ? 1 : storage.trSortBy;
                manager.varCache.flSortColumn = storage.flSortColumn || manager.varCache.flSortColumn;
                manager.varCache.flSortBy = storage.flSortBy === undefined ? 1 : storage.flSortBy;

                manager.varCache.torrentListColumnList = data.getTorrentListColumnList;
                manager.varCache.fileListColumnList = data.getFileListColumnList;

                manager.writeTrHead();

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

                manager.writeTrList(data.getRemoteTorrentList);
            });
        });
    }
};

manager.run();