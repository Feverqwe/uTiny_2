import "../css/options.css";
import "../css/bootstrap-colorpicker.css";
import utils from "./utils";
import jQuery from "jquery";
import "../vendor/bootstrap-colorpicker";

window.$ = jQuery;

var options = function () {
  "use strict";
  var activePage = null;
  var activeItem = undefined;
  var domCache = {};
  var varCache = {};

  var set_place_holder = function () {
    for (var key in options.defaultSettings) {
      var defaultValue = options.defaultSettings[key];
      var el = document.querySelector('input[data-option="' + key + '"]');
      if (el === null) {
        console.log('El not found!', key);
        continue;
      }
      if (['text', 'number', 'password'].indexOf(el.type) !== -1) {
        if (options.settings[key] !== defaultValue) {
          el.value = options.settings[key];
        } else {
          el.value = '';
        }
        if (defaultValue || defaultValue === '' || defaultValue === 0) {
          el.placeholder = defaultValue;
        }
      } else
      if (el.type === "checkbox") {
        el.checked = !!options.settings[key];
      } else
      if (el.type === "radio") {
        var _el = document.querySelector('input[data-option="' + key + '"][value="' + options.settings[key] + '"]');
        if (_el !== null) {
          el = _el;
        }
        el.checked = true;
      }
    }
  };

  var onHashChange = function () {
    var hash = location.hash.substr(1) || 'client';
    var activeItem = document.querySelector('a[data-page="' + hash + '"]');
    if (activeItem === null) {
      activeItem = document.querySelector('a[data-page="client"]');
    }
    activeItem.dispatchEvent(new CustomEvent('click', {bubbles: true}));
  };

  var saveChange = function (e) {
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
      var number = parseInt(el.value);
      if (isNaN(number)) {
        number = parseInt(el.placeholder);
      }
      var min = parseInt(el.min);
      if (!isNaN(min) && number < min) {
        number = min;
        el.value = number;
      }
      if (isNaN(number)) {
        return;
      }
      value = number;
    } else
    if (['text', 'password'].indexOf(el.type) !== -1) {
      value = el.value;
      var placehoder = el.placeholder;
      if (!value && placehoder) {
        value = placehoder;
      }
    }

    var obj = {};
    obj[key] = value;

    var cb = this.cb;
    chrome.storage.local.set(obj, function () {
      chrome.runtime.sendMessage({action: 'reloadSettings'}, cb);
    });
  };

  var getBackupJson = function (cb) {
    chrome.storage.local.get(null, function (storage) {
      cb && cb(JSON.stringify(storage));
    });
  };

  var restoreSettings = function (storage) {
    chrome.storage.local.clear();
    var data = {};
    for (var item in storage) {
      var value = storage[item];
      if (storage.hasOwnProperty(item) === false || value === null) {
        continue;
      }
      data[item] = value;
    }
    chrome.storage.local.set(data, function () {
      chrome.runtime.sendMessage({action: 'reloadSettings'}, function () {
        window.location.reload();
      });
    });
  };

  var makeBackupForm = function () {
    domCache.backupUpdateBtn.on('click', function () {
      getBackupJson(function (json) {
        domCache.backupInp.val(json);
      });
    });
    domCache.restoreBtn.on('click', function () {
      try {
        var data = JSON.parse(domCache.restoreInp.val());
      } catch (error) {
        return alert(chrome.i18n.getMessage('OV_FL_ERROR') + "\n" + error);
      }
      restoreSettings(data);
    });
    domCache.clearCloudStorageBtn.on('click', function () {
      chrome.storage.sync.clear();
      domCache.getFromCloudBtn.prop('disabled', true);
    });
    domCache.saveInCloudBtn.on('click', function () {
      var _this = this;
      _this.disabled = true;
      setTimeout(function () {
        _this.disabled = false;
      }, 750);
      getBackupJson(function (json) {
        chrome.storage.sync.set({backup: json}, function () {
          domCache.getFromCloudBtn.prop('disabled', false);
        });
      });
    });
    domCache.getFromCloudBtn.on('click', function () {
      chrome.storage.sync.get('backup', function (storage) {
        domCache.restoreInp.val(storage.backup);
      });
    });
  };

  var writeLanguage = function (body) {
    var elList = (body || document).querySelectorAll('[data-lang]');
    for (var i = 0, el; el = elList[i]; i++) {
      var langList = el.dataset.lang.split('|');
      for (var m = 0, lang; lang = langList[m]; m++) {
        var args = lang.split(',');
        var locale = chrome.i18n.getMessage(args.shift());
        if (locale === undefined) {
          console.log('Language string is not found!', el.dataset.lang);
          continue;
        }
        if (args.length !== 0) {
          args.forEach(function (item) {
            if (item === 'text') {
              el.textContent = locale;
              return 1;
            }
            el.setAttribute(item, locale);
          });
        } else
        if (el.tagName === 'DIV') {
          el.title = locale;
        } else
        if (['A', 'LEGEND', 'SPAN', 'LI', 'TH', 'P', 'OPTION', 'BUTTON', 'H2', 'H3'].indexOf(el.tagName) !== -1) {
          el.textContent = locale;
        } else
        if (el.tagName === 'INPUT') {
          el.value = locale;
        } else {
          console.log('Tag name not found!', el.tagName);
        }
      }
    }
  };

  var bytesToText = function (bytes, nan, ps) {
    //переводит байты в строчки
    var sizes = (ps === undefined) ? chrome.i18n.getMessage('sizeList') : chrome.i18n.getMessage('sizePsList');
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
    var toFixed = 1;
    if (i > 2) {
      toFixed = 2;
    }
    return (bytes / Math.pow(1024, i)).toFixed(toFixed) + ' ' + sizes[i];
  };

  var updateDirList = function () {
    chrome.runtime.sendMessage({action: 'getDirList'}, function (data) {
      var select = domCache.dirList;
      select.textContent = '';
      var dirList = data['download-dirs'];
      if (!dirList) {
        select.selectedIndex = -1;
        select.dispatchEvent(new CustomEvent('change'));
        return;
      }
      for (var i = 0, item; item = dirList[i]; i++) {
        select.appendChild(utils.create('option', {
          value: i,
          text: item.path,
          data: {
            available: item.available
          }
        }));
      }
      select.selectedIndex = 0;
      select.dispatchEvent(new CustomEvent('change'));
    });
  };

  var folderLoadList = function (folderList) {
    for (var i = 0, item; item = folderList[i]; i++) {
      domCache.folderList.appendChild(utils.create('option', {
        text: (item[2] ? '[' + item[2] + '] ' : '') + item[1],
        data: {
          dir: item[0],
          subPath: item[1],
          label: item[2] || ''
        }
      }));
    }
  };

  var folderSaveList = window.folderSaveList = function () {
    var optionList = [];
    var optionNodeList = domCache.folderList.childNodes;
    for (var i = 0, item; item = optionNodeList[i]; i++) {
      optionList.push([item.dataset.dir, item.dataset.subPath, item.dataset.label]);
    }
    chrome.storage.local.set({folderList: optionList}, function () {
      chrome.runtime.sendMessage({action: 'reloadSettings'});
    });
  };

  var labelLoadList = function (labelList) {
    for (var i = 0, item; item = labelList[i]; i++) {
      domCache.labelList.appendChild(utils.create('option', {
        text: item,
        data: {
          label: item
        }
      }));
    }
  };

  var labelSaveList = window.labelSaveList = function () {
    var optionList = [];
    var optionNodeList = domCache.labelList.childNodes;
    for (var i = 0, item; item = optionNodeList[i]; i++) {
      optionList.push(item.dataset.label);
    }
    chrome.storage.local.set({labelList: optionList}, function () {
      chrome.runtime.sendMessage({action: 'reloadSettings'});
    });
  };

  var removeOption = function (type) {
    var container = domCache[type + 'List'];
    var rmList = [];
    var optionNodeList = container.childNodes;
    for (var i = 0, item; item = optionNodeList[i]; i++) {
      if (!item.selected) continue;
      rmList.push(item);
    }
    for (var i = 0, item; item = rmList[i]; i++) {
      item.parentNode.removeChild(item);
    }

    window[type + 'SaveList']();
  };

  var optionUp = function (type) {
    var container = domCache[type + 'List'];
    var optionIndex = container.selectedIndex;
    if (optionIndex === -1) {
      return;
    }
    var option = container.childNodes[optionIndex];
    if (!option.previousElementSibling) return;
    container.insertBefore(option, option.previousElementSibling);

    window[type + 'SaveList']();
  };

  var optionDown = function (type) {
    var container = domCache[type + 'List'];
    var optionIndex = container.selectedIndex;
    if (optionIndex === -1) {
      return;
    }
    var option = container.childNodes[optionIndex];
    var next = option.nextElementSibling;
    if (!next) return;
    if (!next.nextElementSibling) {
      container.appendChild(option);
    } else {
      container.insertBefore(option, next.nextElementSibling);
    }

    window[type + 'SaveList']();
  };

  var setColorPicker = function () {
    var isFocus = false;
    var input = document.querySelector('input[data-option="badgeColor"]');
    var $btn = $(input.parentNode.querySelector('.selectColor'));

    var lastColor = options.settings.badgeColor;
    $btn.data('color', 'rgba(' + lastColor + ')');
    $btn.css('backgroundColor', 'rgba(' + lastColor + ')');

    var onColorSelect = function (e) {
      var color = e.color.toRGB();

      var iconColor = color.r + ',' + color.g + ',' + color.b + ',' + color.a;
      lastColor = iconColor;

      $btn.css('backgroundColor', 'rgba(' + iconColor + ')');
      chrome.runtime.sendMessage({action: 'changeBadgeColor', color: iconColor});

      if (!isFocus) {
        input.value = lastColor;
      }
    };

    var onHidePicker = function () {
      input.dispatchEvent(new CustomEvent('keyup'));
    };

    input.addEventListener('keyup', function () {
      $btn.colorpicker('setValue', 'rgba(' + input.value + ')');
    });

    input.addEventListener('focus', function () {
      isFocus = true;
    });

    input.addEventListener('blur', function () {
      isFocus = false;
    });

    $btn.colorpicker();

    $btn.on('changeColor.colorpicker', onColorSelect);
    $btn.on('hidePicker.colorpicker', onHidePicker);
  };

  return {
    start: function () {
      chrome.storage.local.get([
        'folderList',
        'labelList'
      ], function (storage) {
        utils.joinMessages([
          {action: 'getSettings'},
          {action: 'getTrColumnArray'},
          {action: 'getFlColumnArray'},
          {action: 'getDefaultSettings'}
        ]).then(function (data) {
          options.settings = data.getSettings;
          options.defaultSettings = data.getDefaultSettings;

          if (chrome.i18n.getMessage('lang') !== "ru") {
            document.querySelector('.cirilicFixs').style.display = 'none';
          }

          writeLanguage();

          document.body.classList.remove('loading');

          domCache.folderList = document.getElementById('folderList');
          folderLoadList(storage.folderList || []);
          domCache.subPath = document.getElementById('subPath');
          domCache.pathLabel = document.getElementById('pathLabel');
          domCache.addSubPath = document.getElementById('addSubPath');
          domCache.addSubPath.addEventListener('click', function () {
            var dirIndex = domCache.dirList.selectedIndex;
            if (dirIndex === -1) {
              return;
            }
            var dir = parseInt(domCache.dirList.childNodes[dirIndex].value);
            var subPath = domCache.subPath.value;
            if (!subPath) {
              return;
            }
            var label = domCache.pathLabel.value;
            domCache.folderList.appendChild(utils.create('option', {
              text: (label ? '[' + label + '] ' : '') + subPath,
              data: {
                dir: dir,
                subPath: subPath,
                label: label
              }
            }));

            domCache.subPath.value = '';
            domCache.pathLabel.value = '';
            folderSaveList();
          });
          domCache.subPath.addEventListener('keydown', function (e) {
            if (e.keyCode === 13) {
              domCache.addSubPath.dispatchEvent(new CustomEvent('click'));
            }
          });
          domCache.pathLabel.addEventListener('keydown', function (e) {
            if (e.keyCode === 13) {
              domCache.addSubPath.dispatchEvent(new CustomEvent('click'));
            }
          });

          domCache.label = document.getElementById('label');
          domCache.labelList = document.getElementById('labelList');
          labelLoadList(storage.labelList || []);
          domCache.addLabel = document.getElementById('addLabel');
          domCache.addLabel.addEventListener('click', function () {
            var label = domCache.label.value;
            if (!label) {
              return;
            }
            domCache.labelList.appendChild(utils.create('option', {
              text: label,
              data: {
                label: label
              }
            }));

            domCache.label.value = '';
            labelSaveList();
          });
          domCache.label.addEventListener('keydown', function (e) {
            if (e.keyCode === 13) {
              domCache.addLabel.dispatchEvent(new CustomEvent('click'));
            }
          });

          domCache.folderDeleteSelected = document.getElementById('folderDeleteSelected');
          domCache.folderDeleteSelected.addEventListener('click', removeOption.bind(null, 'folder'));
          domCache.folderUp = document.getElementById('folderUp');
          domCache.folderUp.addEventListener('click', optionUp.bind(null, 'folder'));
          domCache.folderDown = document.getElementById('folderDown');
          domCache.folderDown.addEventListener('click', optionDown.bind(null, 'folder'));

          domCache.labelDeleteSelected = document.getElementById('labelDeleteSelected');
          domCache.labelDeleteSelected.addEventListener('click', removeOption.bind(null, 'label'));
          domCache.labelUp = document.getElementById('labelUp');
          domCache.labelUp.addEventListener('click', optionUp.bind(null, 'label'));
          domCache.labelDown = document.getElementById('labelDown');
          domCache.labelDown.addEventListener('click', optionDown.bind(null, 'label'));

          domCache.backupUpdateBtn = $('#backupUpdate');
          domCache.restoreBtn = $('#restoreBtn');
          domCache.saveInCloudBtn = $('#saveInCloud');
          domCache.getFromCloudBtn = $('#getFromCloudBtn');
          domCache.clearCloudStorageBtn = $('#clearCloudStorage');
          domCache.backupInp = $('#backupInp');
          domCache.restoreInp = $('#restoreInp');

          set_place_holder();

          setColorPicker();

          makeBackupForm();

          domCache.menu = document.querySelector('.menu');
          domCache.menu.addEventListener('click', function (e) {
            var el = e.target;
            if (el.tagName !== 'A') return;

            if (el.classList.contains('active')) {
              return;
            }
            activeItem && activeItem.classList.remove('active');
            activeItem = el;
            activeItem.classList.add('active');
            activePage && activePage.classList.remove('active');
            var page = el.dataset.page;
            activePage = document.querySelector('.page.' + page);
            activePage.classList.add('active');
            if (page === 'backup') {
              domCache.backupUpdateBtn.trigger('click');
            }
            if (page === 'restore') {
              chrome.storage.sync.get('backup', function (storage) {
                if (storage.backup !== undefined) {
                  return;
                }
                domCache.getFromCloudBtn.prop('disabled', true);
              });
            }
            if (page === 'ctx') {
              updateDirList();
            }
          });
          window.addEventListener("hashchange", onHashChange);
          onHashChange();

          domCache.clientCheckBtn = document.getElementById('clientCheckBtn');
          domCache.clientCheckBtn.addEventListener('click', function (e) {
            var statusEl = document.getElementById('clientStatus');
            statusEl.textContent = '';
            statusEl.appendChild(utils.create('img', {
              src: require('!url-loader!../assets/img/loading.gif')
            }));
            chrome.runtime.sendMessage({action: 'checkSettings'}, function (response) {
              statusEl.textContent = '';
              var span;
              if (response.error) {
                let error = null;
                if (typeof response.error === 'string') {
                  error = response.error;
                } else
                if (response.error.statusText) {
                  error = response.error.statusText;
                }
                span = utils.create('span', {
                  text: error,
                  style: {
                    color: 'red'
                  }
                });
              } else {
                span = utils.create('span', {
                  text: chrome.i18n.getMessage('DLG_BTN_OK'),
                  style: {
                    color: 'green'
                  }
                });
                var windowMode = !chrome.extension.getViews({
                  type: 'popup'
                }).some(function (_window) {
                  return window === _window;
                });
                if (!windowMode) {
                  return window.location = "manager.html";
                }
              }
              statusEl.appendChild(span);

              clearTimeout(varCache.statusTimer);
              varCache.statusTimer = setTimeout(function () {
                statusEl.textContent = '';
              }, 2500);
            });
          });

          domCache.dirList = document.getElementById("dirList");
          domCache.dirList.addEventListener('change', function () {
            var selectedOption = this.childNodes[this.selectedIndex];
            var value = -1;
            if (selectedOption) {
              value = bytesToText(selectedOption.dataset.available * 1024 * 1024);
              domCache.addSubPath.disabled = false;
            } else {
              domCache.addSubPath.disabled = true;
            }
            document.getElementById("availableCount").textContent = value;
          });

          domCache.updateDirList = document.getElementById("updateDirList");
          domCache.updateDirList.addEventListener('click', function () {
            updateDirList();
          });

          var checkInputList = document.querySelectorAll('input[data-option="login"], input[data-option="password"], input[data-option="ip"], input[data-option="port"]');
          for (var i = 0, el; el = checkInputList[i]; i++) {
            el.addEventListener('keydown', function (e) {
              if (e.keyCode === 13) {
                saveChange.call({
                  cb: function () {
                    domCache.clientCheckBtn.dispatchEvent(new CustomEvent('click'));
                  }
                }, {target: this});
              }
            });
          }

          var inputList = document.querySelectorAll('input[type=text], input[type=password], input[type=number]');

          for (var i = 0, el; el = inputList[i]; i++) {
            el.addEventListener('keyup', utils.debounce(saveChange, 500));
          }

          document.body.addEventListener('click', saveChange);

          const helpImgCtr = document.body.querySelector('.helpImgContainer');
          const helpImg = document.createElement('img');
          let url = null;
          switch (chrome.i18n.getMessage('lang')) {
            case 'fr': {
              url = require('../assets/img/help_how_to_fr.png');
              break;
            }
            case 'ru': {
              url = require('../assets/img/help_how_to_ru.png');
              break;
            }
            default: {
              url = require('../assets/img/help_how_to_en.png');
            }
          }
          helpImg.src = url;
          helpImgCtr.appendChild(helpImg);
        });
      });
    }
  }
}();

options.start();