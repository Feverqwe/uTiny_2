import utils from "./utils";
import storageGet from "../tools/storageGet";
import utFixCirilic from "../tools/utFixCirilic";
import toCp1251 from "../tools/toCp1251";

const defaultTorrentListColumnList = [
  {column: 'checkbox', display: 1, order: 0, width: 19, lang: 'selectAll'},
  {column: 'name', display: 1, order: 1, width: 200, lang: 'OV_COL_NAME'},
  {column: 'order', display: 0, order: 1, width: 20, lang: 'OV_COL_ORDER'},
  {column: 'size', display: 1, order: 1, width: 60, lang: 'OV_COL_SIZE'},
  {column: 'remaining', display: 0, order: 1, width: 60, lang: 'OV_COL_REMAINING'},
  {column: 'done', display: 1, order: 1, width: 70, lang: 'OV_COL_DONE'},
  {column: 'status', display: 1, order: 1, width: 70, lang: 'OV_COL_STATUS'},
  {column: 'seeds', display: 0, order: 1, width: 30, lang: 'OV_COL_SEEDS'},
  {column: 'peers', display: 0, order: 1, width: 30, lang: 'OV_COL_PEERS'},
  {column: 'seeds_peers', display: 1, order: 1, width: 40, lang: 'OV_COL_SEEDS_PEERS'},
  {column: 'downspd', display: 1, order: 1, width: 60, lang: 'OV_COL_DOWNSPD'},
  {column: 'upspd', display: 1, order: 1, width: 60, lang: 'OV_COL_UPSPD'},
  {column: 'eta', display: 1, order: 1, width: 70, lang: 'OV_COL_ETA'},
  {column: 'upped', display: 0, order: 1, width: 60, lang: 'OV_COL_UPPED'},
  {column: 'downloaded', display: 0, order: 1, width: 60, lang: 'OV_COL_DOWNLOADED'},
  {column: 'shared', display: 0, order: 1, width: 60, lang: 'OV_COL_SHARED'},
  {column: 'avail', display: 0, order: 1, width: 60, lang: 'OV_COL_AVAIL'},
  {column: 'label', display: 0, order: 1, width: 100, lang: 'OV_COL_LABEL'},
  {column: 'added', display: 0, order: 1, width: 120, lang: 'OV_COL_DATE_ADDED'},
  {column: 'completed', display: 0, order: 1, width: 120, lang: 'OV_COL_DATE_COMPLETED'},
  {column: 'actions', display: 1, order: 0, width: 57, lang: 'Actions'}
];

const defaultFileListColumnList = [
  {column: 'checkbox', display: 1, order: 0, width: 19, lang: 'selectAll'},
  {column: 'name', display: 1, order: 1, width: 300, lang: 'FI_COL_NAME'},
  {column: 'size', display: 1, order: 1, width: 60, lang: 'FI_COL_SIZE'},
  {column: 'downloaded', display: 1, order: 1, width: 60, lang: 'OV_COL_DOWNLOADED'},
  {column: 'done', display: 1, order: 1, width: 70, lang: 'OV_COL_DONE'},
  {column: 'prio', display: 1, order: 1, width: 74, lang: 'FI_COL_PRIO'}
];

const defaultSettings = {
  useSSL: 0,
  ip: "127.0.0.1",
  port: 8080,
  path: "gui/",
  displayActiveTorrentCountIcon: 1,
  showNotificationOnDownloadCompleate: 1,
  notificationTimeout: 5000,
  backgroundUpdateInterval: 120000,
  popupUpdateInterval: 1000,

  login: '',
  password: '',

  hideSeedStatusItem: 0,
  hideFnishStatusItem: 0,
  showSpeedGraph: 1,
  popupHeight: 350,
  selectDownloadCategoryOnAddItemFromContextMenu: 0,

  ctxMenuType: 1,
  treeViewContextMenu: 0,
  showDefaultFolderContextMenuItem: 0,

  badgeColor: '0,0,0,0.40',

  showFreeSpace: 1,

  fixCirilicTitle: 0,
  fixCirilicTorrentPath: 0,

  folderList: [],
  labelList: [],

  torrentListColumnList: defaultTorrentListColumnList,
  fileListColumnList: defaultFileListColumnList,
};

const notificationIcons = {
  complete: require('!file-loader!../assets/img/notification_done.png'),
  add: require('!file-loader!../assets/img/notification_add.png'),
  error: require('!file-loader!../assets/img/notification_error.png')
};

var engine = {
  settings: null,
  varCache: {
    webUiUrl: undefined,
    token: undefined,
    cid: undefined,
    torrents: [],
    labels: [],
    settings: [],
    lastPublicStatus: '-_-',
    trafficList: [{name: 'download', values: []}, {name: 'upload', values: []}],
    startTime: parseInt(Date.now() / 1000),
    activeCount: 0
  },
  publicStatus: function (statusText) {
    if (engine.varCache.lastPublicStatus === statusText) return;

    engine.varCache.lastPublicStatus = statusText;
    chrome.runtime.sendMessage({setStatus: statusText});
  },
  parseXhrHeader: function (head) {
    head = head.split(/\r?\n/);
    var headers = {};
    head.forEach(function (line) {
      "use strict";
      var sep = line.indexOf(':');
      if (sep === -1) {
        return;
      }
      var key = line.substr(0, sep).trim().toLowerCase();
      var value = line.substr(sep + 1).trim();
      headers[key] = value;
    });
    return headers;
  },
  request: function (obj, origCb) {
    "use strict";
    var result = {};
    var cb = function (e, body) {
      cb = null;
      if (request.timeoutTimer) {
        clearTimeout(request.timeoutTimer);
      }

      var err = null;
      if (e) {
        err = String(e.message || e) || 'ERROR';
      }

      var response = getResponse(body);

      origCb && origCb(err, response, body);
    };

    var getResponse = function (body) {
      var response = {
        statusCode: 0,
        statusText: '',
        headers: {},
        body: ''
      };

      if (xhr) {
        response.statusCode = xhr.status;
        response.statusText = xhr.statusText;

        var headers = null;
        var allHeaders = xhr.getAllResponseHeaders();
        if (typeof allHeaders === 'string') {
          headers = engine.parseXhrHeader(allHeaders);
        }
        response.headers = headers || {};

        response.body = body || '';
      }

      return response;
    };

    if (typeof obj !== 'object') {
      obj = {url: obj};
    }

    var url = obj.url;

    var method = obj.method || obj.type || 'GET';
    method = method.toUpperCase();

    var data = obj.data;

    var isFormData = false;

    if (typeof data !== "string") {
      isFormData = String(data) === '[object FormData]';
      if (!isFormData) {
        data = engine.queryStringify(data || {});
      }
    }

    if (data && method === 'GET') {
      url += (/\?/.test(url) ? '&' : '?') + data;
      data = undefined;
    }

    if (obj.cache === false && ['GET', 'HEAD'].indexOf(method) !== -1) {
      url += (/\?/.test(url) ? '&' : '?') + '_=' + Date.now();
    }

    obj.headers = obj.headers || {};

    if (data && !isFormData) {
      obj.headers["Content-Type"] = obj.contentType || obj.headers["Content-Type"] || 'application/x-www-form-urlencoded; charset=UTF-8';
    }

    var request = {};
    request.url = url;
    request.method = method;

    data && (request.data = data);
    obj.json && (request.json = true);
    obj.xml && (request.xml = true);
    obj.timeout && (request.timeout = obj.timeout);
    obj.mimeType && (request.mimeType = obj.mimeType);
    obj.withCredentials && (request.withCredentials = true);
    Object.keys(obj.headers).length && (request.headers = obj.headers);

    if (request.timeout > 0) {
      request.timeoutTimer = setTimeout(function () {
        cb && cb(new Error('ETIMEDOUT'));
        xhr.abort();
      }, request.timeout);
    }

    var xhrSuccessStatus = {
      0: 200,
      1223: 204
    };

    var xhr = new XMLHttpRequest();
    xhr.open(request.method, request.url, true);

    if (request.mimeType) {
      xhr.overrideMimeType(request.mimeType);
    }
    if (request.withCredentials) {
      xhr.withCredentials = true;
    }
    for (var key in request.headers) {
      xhr.setRequestHeader(key, request.headers[key]);
    }

    xhr.onload = function () {
      var status = xhrSuccessStatus[xhr.status] || xhr.status;
      try {
        if (status >= 200 && status < 300 || status === 304) {
          var body = xhr.responseText;
          if (request.json) {
            body = JSON.parse(body);
          } else
          if (request.xml) {
            body = (new DOMParser()).parseFromString(body, "text/xml");
          } else
          if (typeof body !== 'string') {
            console.error('Response is not string!', body);
            throw new Error('Response is not string!');
          }
          return cb && cb(null, body);
        }
        throw new Error(xhr.status + ' ' + xhr.statusText);
      } catch (e) {
        return cb && cb(e);
      }
    };

    var errorCallback = xhr.onerror = function () {
      cb && cb(new Error(xhr.status + ' ' + xhr.statusText));
    };

    var stateChange = null;
    if (xhr.onabort !== undefined) {
      xhr.onabort = errorCallback;
    } else {
      stateChange = function () {
        if (xhr.readyState === 4) {
          cb && setTimeout(function () {
            return errorCallback();
          });
        }
      };
    }

    if (stateChange) {
      xhr.onreadystatechange = stateChange;
    }

    try {
      xhr.send(request.data || null);
    } catch (e) {
      setTimeout(function () {
        cb && cb(e);
      });
    }

    result.abort = function () {
      cb = null;
      xhr.abort();
    };

    return result;
  },
  timer: {
    timer: null,
    state: 0,
    start: function () {
      this.state = 1;

      this.timer && clearInterval(this.timer);
      this.timer = null;

      if (engine.settings.backgroundUpdateInterval <= 1000) {
        return;
      }

      this.timer = setInterval(function () {
        engine.updateTrackerList();
      }, engine.settings.backgroundUpdateInterval);
    },
    stop: function () {
      this.timer && clearInterval(this.timer);
      this.timer = null;

      this.state = 0;
    }
  },
  getToken: function (onReady, onError, force) {
    engine.publicStatus('Try get token!' + (force ? ' Retry: ' + force : ''));

    engine.request({
      url: engine.varCache.webUiUrl + 'token.html',
      headers: {
        Authorization: 'Basic ' + btoa(engine.settings.login + ":" + engine.settings.password)
      }
    }, function (err, resp, data) {
      if (err) {
        engine.publicStatus('Get token error! ' + err);
        force = force || 0;
        force++;

        if (force < 4) {
          return engine.getToken.call(engine, onReady, onError, force);
        }

        return onError && onError(err);
      }

      var token = data.match(/>([^<]+)</);
      if (token) {
        token = token[1];
        engine.publicStatus('Token is found!');
      } else {
        engine.publicStatus('Token not found!');
      }

      engine.varCache.token = token;
      engine.publicStatus('');
      onReady && onReady();
    });
  },
  sendAction: function (origData, onLoad, onError, force) {
    if (engine.varCache.token === undefined) {
      return engine.getToken(function onGetToken() {
        engine.sendAction.call(engine, origData, onLoad, onError, force || 1);
      });
    }

    var data = origData;
    if (typeof data === "string") {
      data = 'token=' + engine.varCache.token + '&' + data;
    } else {
      data.token = engine.varCache.token;
    }

    var url = engine.varCache.webUiUrl;
    var type;
    if (data.hasOwnProperty('torrent_file')) {
      type = 'POST';
      var formData = new FormData();
      var file = data.torrent_file;
      formData.append("torrent_file", file);

      data = {};
      for (var key in origData) {
        data[key] = origData[key];
      }
      delete data.torrent_file;
      url += '?' + engine.queryStringify(data);
      data = formData;
    } else {
      type = 'GET';
    }

    engine.request({
      type: type,
      url: url,
      headers: {
        Authorization: 'Basic ' + btoa(engine.settings.login + ":" + engine.settings.password)
      },
      data: data
    }, function (err, resp, data) {
      if (err) {
        force = force || 0;
        force++;
        if (resp.statusCode === 400) {
          engine.varCache.token = undefined;
        }

        if (force < 2) {
          return engine.sendAction.call(engine, origData, onLoad, onError, force);
        }

        engine.publicStatus('Can\'t send action! ' + err);
        return onError && onError();
      }

      try {
        if (engine.settings.fixCirilicTitle) {
          data = utFixCirilic(data);
        }
        data = JSON.parse(data);
      } catch (err) {
        return engine.publicStatus('Data parse error!');
      }

      engine.publicStatus('');
      onLoad && onLoad(data);
      engine.readResponse(data, origData.cid);
    });
  },
  readResponse: function (data, cid) {
    if (data.torrentm !== undefined) {
      // Removed torrents
      var list = engine.varCache.torrents;
      for (var i = 0, item_m; item_m = data.torrentm[i]; i++) {
        for (var n = 0, item_s; item_s = list[n]; n++) {
          if (item_s[0] === item_m) {
            list.splice(n, 1);
            break;
          }
        }
      }
    }

    var newTorrentList = data.torrents || data.torrentp;
    if (newTorrentList !== undefined) {
      engine.utils(engine.varCache.torrents, newTorrentList);
    }

    if (data.torrents !== undefined) {
      //Full torrent list
      engine.varCache.torrents = data.torrents;
    } else
    if (data.torrentp !== undefined) {
      // Updated torrent list with CID
      var list = engine.varCache.torrents;
      var newItem = [];
      for (var i = 0, item_p; item_p = data.torrentp[i]; i++) {
        var found = false;
        for (var n = 0, item_s; item_s = list[n]; n++) {
          if (item_s[0] !== item_p[0]) {
            continue;
          }
          list[n] = item_p;
          found = true;
          break;
        }
        if (found === false) {
          newItem.push(item_p);
          list.push(item_p);
        }
      }
      engine.varCache.newFileListener && engine.varCache.newFileListener(newItem, cid);
    }

    if (data.label !== undefined) {
      // Labels
      engine.varCache.labels = data.label;
    }

    if (data.settings !== undefined) {
      // Settings
      engine.varCache.settings = data.settings;
    }

    engine.settings.displayActiveTorrentCountIcon && engine.displayActiveItemsCountIcon(engine.varCache.torrents);
  },
  updateTrackerList: function () {
    engine.sendAction({list: 1, cid: engine.varCache.cid}, function (data) {
      if (data.torrentc !== undefined) {
        engine.varCache.cid = data.torrentc;
      }
    }, function () {
      engine.timer.stop();
    });
  },
  loadSettings() {
    return storageGet(defaultSettings).then((settings) => {
      [{
        key: 'fileListColumnList',
        defColumns: defaultFileListColumnList,
      }, {
        key: 'torrentListColumnList',
        defColumns: defaultTorrentListColumnList,
      }].forEach(({key, defColumns}) => {
        const columns = settings[key];

        mergeColumns(columns, defColumns);
      });

      engine.settings = settings;

      engine.varCache.webUiUrl = (settings.useSSL ? 'https://' : 'http://') + settings.ip + ':' + settings.port + '/' + settings.path;
    });
  },
  trafficCounter: function (torrentList) {
    var limit = 90;
    var dlSpeed = 0;
    var upSpeed = 0;
    for (var i = 0, item; item = torrentList[i]; i++) {
      dlSpeed += item[9];
      upSpeed += item[8];
    }
    var dlSpeedList = engine.varCache.trafficList[0].values;
    var upSpeedList = engine.varCache.trafficList[1].values;
    var now = parseInt(Date.now() / 1000) - engine.varCache.startTime;
    dlSpeedList.push({time: now, pos: dlSpeed});
    upSpeedList.push({time: now, pos: upSpeed});
    if (dlSpeedList.length > limit) {
      dlSpeedList.shift();
      upSpeedList.shift();
    }
  },
  showNotification: function (icon, title, desc, details) {
    details = details || {};
    details.notificationTimeout = engine.settings.notificationTimeout;
    showNotification(icon, title, desc, details);
  },
  onCompleteNotification: function (oldTorrentList, newTorrentList) {
    if (oldTorrentList.length === 0) {
      return;
    }
    for (var i = 0, newItem; newItem = newTorrentList[i]; i++) {
      if (newItem[4] !== 1000) {
        continue;
      }
      for (var n = 0, oldItem; oldItem = oldTorrentList[n]; n++) {
        if (oldItem[0] !== newItem[0] || oldItem[4] === 1000 || oldItem[24]) {
          continue;
        }
        var desc = (newItem[21] !== undefined) ? chrome.i18n.getMessage('OV_COL_STATUS') + ': ' + newItem[21] : '';
        engine.showNotification(
          notificationIcons.complete,
          newItem[2],
          desc
        );
      }
    }
  },
  setBadgeText: function (text) {
    "use strict";
    engine.setBadgeText.lastText = text;

    setBadgeText(text);

    if (engine.settings && engine.settings.badgeColor) {
      setBadgeBackgroundColor(engine.settings.badgeColor);
    }
  },
  displayActiveItemsCountIcon: function (newTorrentList) {
    var activeCount = 0;
    for (var i = 0, item; item = newTorrentList[i]; i++) {
      if (item[4] !== 1000 && (item[24] === undefined || item[24] === 0)) {
        activeCount++;
      }
    }
    if (engine.varCache.activeCount === activeCount) {
      return;
    }
    engine.varCache.activeCount = activeCount;
    var text = activeCount ? String(activeCount) : '';
    engine.setBadgeText(text);
  },
  utils: function (oldTorrentList, newTorrentList) {
    engine.settings.showSpeedGraph && engine.trafficCounter(newTorrentList);
    engine.settings.showNotificationOnDownloadCompleate && engine.onCompleteNotification(oldTorrentList.slice(0), newTorrentList);
  },
  downloadFile: function (url, cb, referer) {
    var xhr = new XMLHttpRequest();
    try {
      xhr.open('GET', url, true);
    } catch (e) {
      engine.showNotification(
        notificationIcons.error,
        xhr.status,
        chrome.i18n.getMessage('unexpectedError')
      );
      return;
    }
    xhr.responseType = 'blob';
    if (referer) {
      xhr.setRequestHeader('Referer', referer);
    }
    xhr.onprogress = function (e) {
      if (e.total > 1024 * 1024 * 10 || e.loaded > 1024 * 1024 * 10) {
        xhr.abort();
        engine.showNotification(
          notificationIcons.error,
          chrome.i18n.getMessage('OV_FL_ERROR'),
          chrome.i18n.getMessage('fileSizeError')
        );
      }
    };
    xhr.onload = function () {
      return cb(xhr.response);
    };
    xhr.onerror = function () {
      if (xhr.status === 0) {
        engine.showNotification(
          notificationIcons.error,
          xhr.status,
          chrome.i18n.getMessage('unexpectedError')
        );
      } else {
        engine.showNotification(
          notificationIcons.error,
          xhr.status,
          xhr.statusText
        );
      }
    };
    xhr.send();
  },
  setOnFileAddListener: function (label, requestCid) {
    engine.varCache.newFileListener = function (newFile, cid) {
      if (cid !== requestCid) return;
      delete engine.varCache.newFileListener;
      if (newFile.length === 0) {
        engine.showNotification(
          notificationIcons.error,
          chrome.i18n.getMessage('torrentFileExists'),
          ''
        );
        return;
      }
      if (newFile.length !== 1) {
        return;
      }
      var item = newFile[0];
      if (label && !item[11]) {
        engine.sendAction({action: 'setprops', s: 'label', hash: item[0], v: label});
      }
      if (engine.settings.selectDownloadCategoryOnAddItemFromContextMenu) {
        chrome.storage.local.set({selectedLabel: {label: 'DL', custom: 1}});
      }
      engine.showNotification(
        notificationIcons.add,
        item[2],
        chrome.i18n.getMessage('torrentAdded')
      );
    };
  },
  sendFile: function (url, folder, label, referer) {
    var isUrl;
    if (isUrl = typeof url === "string") {
      if (url.substr(0, 7).toLowerCase() !== 'magnet:') {
        engine.downloadFile(url, function (file) {
          if (url.substr(0, 5).toLowerCase() === 'blob:') {
            URL.revokeObjectURL(url);
          }
          engine.sendFile(file, folder, label, referer);
        }, referer);
        return;
      }
    }
    engine.sendAction({list: 1}, function (data) {
      var cid = data.torrentc;
      var args = {};
      if (isUrl) {
        args.action = 'add-url';
        args.s = url;
      } else {
        args.action = 'add-file';
        args.torrent_file = url;
      }
      if (folder) {
        args.download_dir = folder.download_dir;
        args.path = folder.path;
      }
      engine.sendAction(args, function (data) {
        if (data.error !== undefined) {
          engine.showNotification(
            notificationIcons.error,
            chrome.i18n.getMessage('OV_FL_ERROR'),
            data.error
          );
          return;
        }
        engine.setOnFileAddListener(label, cid);
        engine.sendAction({list: 1, cid: cid});
      });
    });
  },
  onCtxMenuCall: function (e) {
    /**
     * @namespace e.linkUrl
     * @namespace e.menuItemId
     */
    var link = e.linkUrl;
    var id = e.menuItemId;
    var updateMenu = false;
    var contextMenu = engine.createFolderCtxMenu.contextMenu;
    var defaultItem = contextMenu[0] ? contextMenu[0] : ['0', '', ''];
    if (id === 'newFolder') {
      var path = prompt(chrome.i18n.getMessage('enterNewDirPath'), defaultItem[1]);
      if (!path) {
        return;
      }
      var download_dir = defaultItem[0];
      id = -1;
      for (var i = 0, item; item = contextMenu[i]; i++) {
        if (item[1] === path && item[0] === download_dir) {
          id = i;
          break;
        }
      }
      if (id === -1) {
        id = contextMenu.length;
        contextMenu.push([download_dir, path, '']);
        engine.settings.folderList.push([download_dir, path, '']);
        updateMenu = true;
      }
    }
    if (id === 'newLabel') {
      var newLabel = prompt(chrome.i18n.getMessage('enterNewLabel'));
      if (!newLabel) {
        return;
      }
      id = -1;
      for (var i = 0, item; item = contextMenu[i]; i++) {
        if (item === newLabel) {
          id = i;
          break;
        }
      }
      if (id === -1) {
        id = contextMenu.length;
        contextMenu.push(newLabel);
        engine.settings.labelList.push(newLabel);
        updateMenu = true;
      }
    }
    if (id === 'main' || id === 'default') {
      return engine.sendFile(link, undefined, undefined, e.referer);
    }
    var dir, label;
    var item = contextMenu[id];
    if (typeof item === 'string') {
      label = item;
    } else {
      dir = {download_dir: item[0], path: item[1]};
    }
    if (updateMenu) {
      chrome.storage.local.set({
        folderList: engine.settings.folderList,
        labelList: engine.settings.labelList
      }, function () {
        engine.createFolderCtxMenu();
      });
    }
    engine.sendFile(link, dir, label, e.referer);
  },
  listToTreeList: function (contextMenu) {
    var tmp_folders_array = [];
    var tree = {};
    var sepType;
    var treeLen = 0;
    for (var i = 0, item; item = contextMenu[i]; i++) {
      var path = item[1];
      if (sepType === undefined) {
        sepType = path.indexOf('/') === -1 ? path.indexOf('\\') === -1 ? undefined : '\\' : '/';
      } else {
        if (sepType === '\\') {
          item[1] = path.replace(/\//g, '\\');
        } else {
          item[1] = path.replace(/\\/g, '/');
        }
      }
    }
    if (sepType === undefined) {
      sepType = '';
    }
    for (var i = 0, item; item = contextMenu[i]; i++) {
      var _disk = item[0];
      var path = item[1];
      if (!path) {
        continue;
      }

      var dblSep = sepType + sepType;
      var splitedPath = [];
      if (path.search(/[a-zA-Z]{1}:(\/\/|\\\\)/) === 0) {
        var disk = path.split(':' + dblSep);
        if (disk.length === 2) {
          disk[0] += ':' + dblSep;
          splitedPath.push(disk[0]);
          path = disk[1];
        }
      }

      var pathList;
      if (sepType.length !== 0) {
        pathList = path.split(sepType);
      } else {
        pathList = [path];
      }

      splitedPath = splitedPath.concat(pathList);

      if (splitedPath[0] === '') {
        splitedPath.shift();
        splitedPath[0] = sepType + splitedPath[0];
      }

      if (splitedPath.slice(-1)[0] === '') {
        splitedPath.splice(-1);
      }

      var lastDir = undefined;
      var folderPath = undefined;
      for (var m = 0, len = splitedPath.length; m < len; m++) {
        var cPath = (lastDir !== undefined) ? lastDir : tree;
        var jPath = splitedPath[m];
        if (folderPath === undefined) {
          folderPath = jPath;
        } else {
          if (m === 1 && folderPath.slice(-3) === ':' + dblSep) {
            folderPath += jPath;
          } else {
            folderPath += sepType + jPath;
          }
        }

        lastDir = cPath[jPath];
        if (lastDir === undefined) {
          if (cPath === tree) {
            treeLen++;
          }
          lastDir = cPath[jPath] = {
            arrayIndex: tmp_folders_array.length,
            currentPath: jPath
          };
          tmp_folders_array.push([_disk, folderPath]);
        }
      }
      if (lastDir) {
        lastDir.end = true;
      }
    }

    var smartTree = [];

    var createSubMenu = function (parentId, itemList) {
      var childList = [];
      for (var subPath in itemList) {
        var item = itemList[subPath];
        if (item.currentPath !== undefined) {
          childList.push(item);
        }
      }
      var childListLen = childList.length;
      if (childListLen === 1 && itemList.end === undefined) {
        var cPath = itemList.currentPath;
        if (itemList.currentPath.slice(-1) !== sepType) {
          cPath += sepType;
        }
        childList[0].currentPath = cPath + childList[0].currentPath;
        createSubMenu(parentId, childList[0]);
        return;
      }
      var hasChild = childListLen !== 0;
      var id = (hasChild) ? 'p' + String(itemList.arrayIndex) : String(itemList.arrayIndex);
      if (itemList.currentPath) {
        smartTree.push({
          id: id,
          parentId: parentId,
          title: itemList.currentPath
        });
        if (hasChild) {
          smartTree.push({
            id: id.substr(1),
            parentId: id,
            title: chrome.i18n.getMessage('currentDirectory')
          });
        }
      }
      childList.forEach(function (item) {
        createSubMenu(id, item);
      });
    };

    for (var item in tree) {
      createSubMenu('main', tree[item]);
    }

    return {tree: smartTree, list: tmp_folders_array};
  },
  createFolderCtxMenu: function () {
    chrome.contextMenus.removeAll(function () {
      var enableFolders, enableLabels;
      if (!(enableFolders = engine.settings.ctxMenuType === 1) && !(enableLabels = engine.settings.ctxMenuType === 2)) {
        return;
      }

      var contextMenu = engine.createFolderCtxMenu.contextMenu = [];

      var folderList = engine.settings.folderList;
      var labelList = engine.settings.labelList;

      chrome.contextMenus.create({
        id: 'main',
        title: chrome.i18n.getMessage('addInTorrentClient'),
        contexts: ["link"],
        onclick: engine.onCtxMenuCall
      }, function () {
        if (enableFolders) {
          Array.prototype.push.apply(contextMenu, folderList);
          if (folderList.length > 0) {
            if (engine.settings.treeViewContextMenu) {
              var treeList = engine.listToTreeList(folderList.slice(0));
              for (var i = 0, item; item = treeList.tree[i]; i++) {
                chrome.contextMenus.create({
                  id: item.id,
                  parentId: item.parentId,
                  title: item.title,
                  contexts: ["link"],
                  onclick: engine.onCtxMenuCall
                });
              }
              contextMenu.splice(0);
              Array.prototype.push.apply(contextMenu, treeList.list);
            } else {
              for (var i = 0, item; item = folderList[i]; i++) {
                chrome.contextMenus.create({
                  id: String(i),
                  parentId: 'main',
                  title: item[2] || item[1],
                  contexts: ["link"],
                  onclick: engine.onCtxMenuCall
                });
              }
            }
          }
          if (engine.settings.showDefaultFolderContextMenuItem) {
            chrome.contextMenus.create({
              id: 'default',
              parentId: 'main',
              title: chrome.i18n.getMessage('defaultPath'),
              contexts: ["link"],
              onclick: engine.onCtxMenuCall
            });
          }
          if (folderList.length > 0 || engine.settings.showDefaultFolderContextMenuItem) {
            chrome.contextMenus.create({
              id: 'newFolder',
              parentId: 'main',
              title: chrome.i18n.getMessage('add') + '...',
              contexts: ["link"],
              onclick: engine.onCtxMenuCall
            });
          }
        } else
        if (enableLabels && labelList.length > 0) {
          Array.prototype.push.apply(contextMenu, labelList);
          for (var i = 0, item; item = labelList[i]; i++) {
            chrome.contextMenus.create({
              id: String(i),
              parentId: 'main',
              title: item,
              contexts: ["link"],
              onclick: engine.onCtxMenuCall
            });
          }
          chrome.contextMenus.create({
            id: 'newLabel',
            parentId: 'main',
            title: chrome.i18n.getMessage('add') + '...',
            contexts: ["link"],
            onclick: engine.onCtxMenuCall
          });
        }
      });
    });
  },
  run: function () {
    return engine.loadSettings().then(function () {
      engine.varCache.isReady = 1;

      var msgStack = engine.varCache.msgStack;
      var result = null;
      var args = null;
      while (args = msgStack.shift()) {
        result = engine.onMessage.apply(engine, args);
        if (result !== true) {
          args[2](null);
        }
      }

      engine.updateTrackerList();

      engine.timer.start();

      engine.createFolderCtxMenu();
    });
  },
  onMessage: function (msgList, sender, response) {
    if (engine.varCache.isReady !== 1) {
      engine.varCache.msgStack.push(arguments);
      return true;
    }
    var fn = engine.actionList[msgList.action];
    return fn && fn(msgList, response);
  },
  actionList: {
    getSettings: function (message, response) {
      response(engine.settings);
    },
    getDefaultSettings: function (message, response) {
      response(defaultSettings);
    },
    getTrColumnArray: function (message, response) {
      response(engine.settings.torrentListColumnList);
    },
    getFlColumnArray: function (message, response) {
      response(engine.settings.fileListColumnList);
    },
    getRemoteTorrentList: function (message, response) {
      response(engine.varCache.torrents);
    },
    getRemoteLabels: function (message, response) {
      response(engine.varCache.labels);
    },
    getRemoteSettings: function (message, response) {
      response(engine.varCache.settings);
    },
    getPublicStatus: function (message, responose) {
      responose(engine.varCache.lastPublicStatus);
    },
    api: function (message, response) {
      engine.sendAction(message.data, response);
      return true;
    },
    setTrColumnArray: function (message, response) {
      engine.settings.torrentListColumnList = message.data;
      chrome.storage.local.set({torrentListColumnList: message.data}, response);
      return true;
    },
    setFlColumnArray: function (message, response) {
      engine.settings.fileListColumnList = message.data;
      chrome.storage.local.set({fileListColumnList: message.data}, response);
      return true;
    },
    onSendFile: function (message, response) {
      if (message.base64) {
        var b64Data = message.base64;
        var type = message.type;
        delete message.base64;
        delete message.type;

        message.url = utils.base64ToUrl(b64Data, type);
      }

      engine.sendFile(message.url, message.folder, message.label);
    },
    getTraffic: function (message, response) {
      response({trafficList: engine.varCache.trafficList, startTime: engine.varCache.startTime});
    },
    getDirList: function (message, response) {
      engine.sendAction({action: 'list-dirs'}, response, function () {
        response({});
      });
      return true;
    },
    checkSettings: function (message, response) {
      engine.loadSettings().then(function () {
        engine.getToken(function () {
          return response({});
        }, function (err) {
          return response({error: err});
        });
      });
      return true;
    },
    reloadSettings: function (message, response) {
      engine.loadSettings().then(function () {
        engine.createFolderCtxMenu();
        if (!engine.settings.displayActiveTorrentCountIcon
          && engine.varCache.activeCount > 0) {
          engine.varCache.activeCount = 0;
          engine.setBadgeText('');
        }
        response();
      });
      return true;
    },
    managerIsOpen: function (message, response) {
      if (engine.timer.state !== 1) {
        engine.timer.start();
      }
    },
    changeBadgeColor: function (message) {
      engine.settings.badgeColor = message.color;
      engine.setBadgeText(engine.setBadgeText.lastText || '0');
    }
  },
  queryStringify(params) {
    const result = [];

    if (params.token) {
      result.push([encodeURIComponent('token'), encodeURIComponent(params.token)]);
    }

    Object.entries(params).forEach(([key, value]) => {
      if (key === 'token') return;

      if (value === undefined || value === null) {
        value = '';
      }

      if (Array.isArray(value)) {
        value.forEach((value) => {
          result.push([encodeURIComponent(key), encodeURIComponent(value)]);
        });
      } else
      if (engine.settings.fixCirilicTorrentPath && key === 'path' && params.download_dir !== undefined) {
        result.push([encodeURIComponent(key), toCp1251(value)]);
      } else {
        result.push([encodeURIComponent(key), encodeURIComponent(value)]);
      }
    });

    return result.map(keyValue => keyValue.join('=')).join('&');
  },
  init: function () {
    engine.setBadgeText('');

    engine.varCache.msgStack = [];

    chrome.runtime.onMessage.addListener(engine.onMessage);

    return engine.run();
  }
};

var notificationIdList = {};
const showNotification = (icon, title, desc, details) => {
  details = details || {};
  var id = details.id;
  var timeout = details.notificationTimeout;

  var notifyId = 'notify';
  if (id !== undefined) {
    notifyId += id;
  } else {
    notifyId += Date.now();
  }
  var timerId = notifyId + 'Timer';

  if (id !== undefined && notificationIdList[notifyId] !== undefined) {
    clearTimeout(notificationIdList[timerId]);
    delete notificationIdList[notifyId];
    chrome.notifications.clear(notifyId, function () {
    });
  }
  /**
   * @namespace chrome.notifications
   */
  chrome.notifications.create(
    notifyId,
    {
      type: 'basic',
      iconUrl: icon,
      title: String(title),
      message: String(desc)
    },
    function (id) {
      notificationIdList[notifyId] = id;
    }
  );
  if (timeout > 0) {
    notificationIdList[timerId] = setTimeout(function () {
      notificationIdList[notifyId] = undefined;
      chrome.notifications.clear(notifyId, function () {
      });
    }, timeout);
  }
};

const setBadgeText = (text) => {
  chrome.browserAction.setBadgeText({
    text: text
  });
};

const setBadgeBackgroundColor = (color) => {
  var chColor = color.split(',').map(function (i) {
    return parseFloat(i);
  });
  if (chColor.length === 4) {
    chColor.push(parseInt(255 * chColor.splice(-1)[0]));
  }
  chrome.browserAction.setBadgeBackgroundColor({
    color: chColor
  });
};


const mergeColumns = (columns, defColumns) => {
  const defIdIndex = {};

  const defIdColumn = defColumns.reduce((result, item, index) => {
    defIdIndex[item.column] = index;
    result[item.column] = item;
    return result;
  }, {});

  const removedIds = Object.keys(defIdColumn);

  columns.forEach((column) => {
    const id = column.column;

    const pos = removedIds.indexOf(id);
    if (pos !== -1) {
      removedIds.splice(pos, 1);
    }

    const normColumn = Object.assign({}, defIdColumn[id], column);

    Object.assign(column, normColumn);
  });

  removedIds.forEach((id) => {
    const column = Object.assign({}, defIdColumn[id]);
    columns.splice(defIdIndex[id], 0, column);
  });
};

engine.init();