var options = function() {
    "use strict";
    var activePage = undefined;
    var activeItem = undefined;
    var listOptions = undefined;
    var saveInputTimer = {};
    var dom_cache = {};
    var var_cache = {};

    var set_place_holder = function() {
        $.each(options.defaultSettings, function(key, defaultValue) {
            var el = document.querySelector('input[data-option="' + key + '"]');
            if (el === null) {
                return console.log('El not found!', key);
            }
            if (['text', 'number', 'password'].indexOf(el.type) !== -1) {
                if (options.settings[key] !== defaultValue) {
                    el.value = options.settings[key];
                } else {
                    el.value = '';
                }
                if (defaultValue || defaultValue === '') {
                    el.placeholder = defaultValue;
                }
            } else if (el.type === "checkbox") {
                el.checked = !!options.settings[key];
            } else if (el.type === "radio") {
                var _el = document.querySelector('input[data-option="' + key + '"][value="'+options.settings[key]+'"]');
                if (_el !== null) {
                    el = _el;
                }
                el.checked = true;
            }
        });
    };

    var onHashChange = function() {
        var hash = location.hash.substr(1) || 'client';
        var $activeItem = $('a[data-page="'+hash+'"]');
        if ($activeItem.length === 0) {
            $activeItem = $('a[data-page="client"]');
        }
        $activeItem.trigger('click');
    };

    var saveChange = function(e) {
        var el = e.target;
        if (el.tagName !== 'INPUT') {
            return;
        }
        var key = el.dataset.option;
        if (!key) {
            return;
        }
        var value;
        if (el.type === 'checkbox') {
            value = el.checked ? 1 : 0;
        } else
        if (el.type === 'radio') {
            value = parseInt(el.value);
        } else
        if (el.type === 'number') {
            value = parseInt(el.value);
        } else
        if (['text', 'password'].indexOf(el.type) !== -1) {
            value = el.value;
        }

        var obj = {};
        obj[key] = value;
        mono.storage.set(obj);
    };

    var saveTextInput = function(e) {
        var _this = this;
        var key = _this.dataset.option;
        if (!key) {
            return;
        }
        clearTimeout(saveInputTimer[key]);
        saveInputTimer[key] = setTimeout(function() {
            var value = _this.value;
            if (value.length === 0) {
                value = _this.placeholder;
            }
            if (_this.type === 'number') {
                value = parseInt(value);
            }
            var obj = {};
            obj[key] = value;
            mono.storage.set(obj);
        }, 500);
    };

    var bindTextInput = function() {
        var list = document.querySelectorAll('input');
        for (var i = 0, len = list.length; i < len; i++) {
            var item = list[i];
            if ( ['text', 'number', 'password'].indexOf(item.type) !== -1 ) {
                item.addEventListener('input', saveTextInput);
            }
        }
    };

    var getBackupJson = function(cb) {
        mono.storage.get(null, function(storage) {
            for (var key in storage) {
                if (['topList', 'click_history', 'history', 'optMigrated', 'qualityBoxCache', 'qualityCache'].indexOf(key) !== -1) {
                    delete storage[key];
                }
            }
            cb && cb(JSON.stringify(storage));
        });
    };

    var restoreSettings = function(storage) {
        mono.storage.clear();
        var data = {};
        for (var item in storage) {
            var value = storage[item];
            if (storage.hasOwnProperty(item) === false || value === null) {
                continue;
            }
            data[item] = value;
        }
        mono.storage.set(data, function() {
            window.location.reload();
        });
    };

    var makeBackupForm = function() {
        dom_cache.backupUpdateBtn.on('click', function() {
            getBackupJson(function(json) {
                dom_cache.backupInp.val( json );
            });
        });
        dom_cache.restoreBtn.on('click', function() {
            mono.storage.get(['history', 'click_history'], function(storage) {
                try {
                    var data = JSON.parse(dom_cache.restoreInp.val());
                } catch (error) {
                    return alert(_lang.optRestoreError + "\n" + error);
                }
                data = $.extend(storage, data);
                restoreSettings(data);
            });
        });
        dom_cache.clearCloudStorageBtn.on('click', function() {
            mono.storage.sync.clear();
            dom_cache.getFromCloudBtn.prop('disabled', true);
        });
        dom_cache.saveInCloudBtn.on('click', function() {
            var _this = this;
            _this.disabled = true;
            setTimeout(function() {
                _this.disabled = false;
            }, 750);
            getBackupJson(function(json) {
                /*savePartedBackup('bk_ch_', json);*/
                dom_cache.getFromCloudBtn.prop('disabled', false);
            });
        });
        dom_cache.getFromCloudBtn.on('click', function() {
            /*readPartedBackup('bk_ch_', function(data) {
                dom_cache.restoreInp.val( JSON.stringify(data) );
            });*/
        });

    };


    var writeLanguage = function(body) {
        var elList = (body || document).querySelectorAll('[data-lang]');
        for (var i = 0, el; el = elList[i]; i++) {
            var langList = el.dataset.lang.split('|');
            for (var m = 0, lang; lang = langList[m]; m++) {
                var args = lang.split(',');
                var locale = options.language[args.shift()];
                if (locale === undefined) {
                    console.log('Lang not found!', el.dataset.lang);
                    continue;
                }
                if (args.length !== 0) {
                    args.forEach(function (item) {
                        if (item === 'sub') {
                            var _el = null;
                            while ( _el === null ? _el = el.firstChild : _el = _el.nextSibling) {
                                if (_el.nodeType === 3) {
                                    break;
                                }
                            }
                            if (_el !== null) {
                                el = _el;
                            } else {
                                console.log('Text node not found!', el.dataset.lang);
                            }
                            return 1;
                        } else
                        if (item === 'text') {
                            el.textContent = locale;
                            return 1;
                        } else
                        if (item === 'html') {
                            el.innerHTML = locale;
                            return 1;
                        }
                        el.setAttribute(item, locale);
                    });
                } else if (el.tagName === 'DIV') {
                    el.setAttribute('title', locale);
                } else if (['A', 'LEGEND', 'SPAN', 'LI', 'TH', 'P', 'OPTION', 'H1', 'H2'].indexOf(el.tagName) !== -1) {
                    el.textContent = locale;
                } else if (el.tagName === 'INPUT') {
                    el.value = locale;
                } else {
                    console.log('Tag name not found!', el.tagName);
                }
            }
        }
    };

    return {
        start: function() {
            mono.storage.get([
                'folderList',
                'labelList'
            ], function(storage) {
                mono.sendMessage([
                    {action: 'getLanguage'},
                    {action: 'getSettings'},
                    {action: 'getTrColumnArray'},
                    {action: 'getFlColumnArray'},
                    {action: 'getDefaultSettings'}
                ], function (data) {
                    options.settings = data.getSettings;
                    options.defaultSettings = data.getDefaultSettings;
                    options.language = data.getLanguage;

                    writeLanguage();

                    dom_cache.container = $('div.container');
                    dom_cache.menu = $('.menu');
                    dom_cache.sectionList = $('.sectionList');

                    dom_cache.backupUpdateBtn = $('#backupUpdate');
                    dom_cache.restoreBtn = $('#restoreBtn');
                    dom_cache.saveInCloudBtn = $('#saveInCloud');
                    dom_cache.getFromCloudBtn = $('#getFromCloudBtn');
                    dom_cache.clearCloudStorageBtn = $('#clearCloudStorage');
                    dom_cache.backupInp = $('#backupInp');
                    dom_cache.restoreInp = $('#restoreInp');

                    set_place_holder();

                    if (!mono.isChrome) {
                        dom_cache.saveInCloudBtn.hide();
                        dom_cache.getFromCloudBtn.hide();
                        dom_cache.clearCloudStorageBtn.hide();
                    }

                    bindTextInput();
                    makeBackupForm();

                    dom_cache.menu.on('click', 'a', function(e) {
                        if (this.classList.contains('active')) {
                            return;
                        }
                        activeItem && activeItem.classList.remove('active');
                        this.classList.add('active');
                        activeItem = this;
                        activePage && activePage.removeClass('active');
                        var page = this.dataset.page;
                        var currentPage = $('.page.' + page);
                        currentPage.addClass('active');
                        activePage = currentPage;
                        if (page === 'backup') {
                            dom_cache.backupUpdateBtn.trigger('click');
                        }
                        if (page === 'restore') {
                            /*mono.storage.sync.get("bk_ch_inf", function(storage) {
                             if (storage.bk_ch_inf !== undefined) {
                             return;
                             }
                             dom_cache.getFromCloudBtn.prop('disabled', true);
                             });*/
                        }
                    });
                    window.addEventListener("hashchange", onHashChange);
                    onHashChange();

                    document.body.addEventListener('click', saveChange);

                });
            });
        }
    }
}();

options.start();