import getLogger from "../tools/getLogger";
import UTorrentClient from "./UTorrentClient";
import Daemon from "./Daemon";
import ContextMenu from "./ContextMenu";
import BgStore from "./stores/BgStore";
import {autorun} from "mobx";

const serializeError = require('serialize-error');
const logger = getLogger('background');

const notificationIcons = {
  complete: require('!file-loader!../assets/img/notification_done.png'),
  add: require('!file-loader!../assets/img/notification_add.png'),
  error: require('!file-loader!../assets/img/notification_error.png')
};

class Bg {
  constructor() {
    /**@type BgStore*/
    this.bgStore = BgStore.create();
    this.client = null;
    this.daemon = null;
    this.contextMenu = null;

    this.initPromise = null;

    this.init().catch((err) => {
      logger.error('init error', err);
    });
  }

  init() {
    chrome.runtime.onMessage.addListener(this.handleMessage);

    return this.initPromise = this.bgStore.fetchConfig().then(() => {
      this.daemon = new Daemon(this);
      this.contextMenu = new ContextMenu(this);

      const logger = getLogger('autorun');

      autorun(() => {
        logger('daemon');
        this.daemon.start();
      });

      autorun(() => {
        logger('client');
        const dep = [
          this.bgStore.config.ssl,
          this.bgStore.config.port,
          this.bgStore.config.hostname,
          this.bgStore.config.pathname,
          this.bgStore.config.authenticationRequired,
          this.bgStore.config.fixCyrillicTorrentName
        ];

        if (dep.length) {
          this.bgStore.flushClient();
          this.client = new UTorrentClient(this);
          this.client.updateTorrents().catch((err) => {
            logger.error('client', 'updateTorrents error', err);
          });
        }
      });

      autorun(() => {
        logger('badge');
        if (this.bgStore.config.showActiveCountBadge) {
          const count = this.bgStore.client.activeCount;
          if (count > 0) {
            setBadgeText('' + count);
          }
        } else {
          setBadgeText('');
        }
      });

      autorun(() => {
        logger('badgeColor');
        setBadgeBackgroundColor(this.bgStore.config.badgeColor);
      });

      autorun(() => {
        logger('contextMenu');
        const dep = [
          this.bgStore.config.folders,
          this.bgStore.config.labels,
          this.bgStore.config.contextMenuType,
          this.bgStore.config.treeViewContextMenu,
          this.bgStore.config.putDefaultPathInContextMenu
        ];

        if (dep.length) {
          this.contextMenu.create();
        }
      });
    });
  }

  whenReady() {
    return this.initPromise;
  }

  handleMessage = (message, sender, response) => {
    let promise = null;

    switch (message && message.action) {
      case '': {
        promise = this.whenReady().then(() => {

        });
        break;
      }
      default: {
        promise = Promise.reject(new Error('Unknown request'));
      }
    }

    if (promise) {
      promise.then((result) => {
        response({result});
      }, (err) => {
        response({error: serializeError(err)});
      }).catch((err) => {
        logger.error('Send response error', err);
      });
      return true;
    }
  };

  handleTorrentAdded(torrent) {
    const icon = notificationIcons.add;
    const statusText = chrome.i18n.getMessage('torrentAdded');
    showNotification(torrent.id, icon, torrent.name, statusText);
  }

  handleTorrentExists() {
    const icon = notificationIcons.error;
    const title = chrome.i18n.getMessage('torrentFileExists');
    showNotification(icon, title);
  }

  handleTorrentComplete(torrent) {
    const icon = notificationIcons.complete;
    let statusText = '';
    if (torrent.status) {
      statusText = chrome.i18n.getMessage('OV_COL_STATUS') + ': ' + torrent.status;
    }
    showNotification(torrent.id, icon, torrent.name, statusText);
  }

  handleTorrentError(message) {
    const icon = notificationIcons.error;
    const title = chrome.i18n.getMessage('OV_FL_ERROR');
    showNotification(icon, title, message);
  }
}

function setBadgeText(text) {
  chrome.browserAction.setBadgeText({
    text: text
  });
}

function showNotification(id, iconUrl, title = '', message = '') {
  chrome.notifications.create(id, {
    type: 'basic',
    iconUrl: iconUrl,
    title: title,
    message: message
  });
}

function setBadgeBackgroundColor(color) {
  const colors = color.split(',').map(i => parseFloat(i));
  if (colors.length === 4) {
    colors.push(parseInt(255 * colors.pop(), 10));
  }
  chrome.browserAction.setBadgeBackgroundColor({
    color: colors
  });
}

const bg = window.bg = new Bg();

export default bg;