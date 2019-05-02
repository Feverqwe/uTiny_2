import {flow, types} from "mobx-state-tree";
import ConfigStore from "./ConfigStore";
import getLogger from "../../tools/getLogger";
import loadConfig, {defaultConfig} from "../../tools/loadConfig";
import ClientStore from "./ClientStore";

const logger = getLogger('BgStore');

/**
 * @typedef {{}} BgStore
 * @property {ConfigStore|undefined} config
 * @property {ClientStore} [client]
 * @property {function:Promise} fetchConfig
 * @property {function} flushClient
 * @property {function} legacyConfig
 */
const BgStore = types.model('BgStore', {
  config: types.maybe(ConfigStore),
  client: types.optional(ClientStore, {}),
}).actions((self) => {
  return {
    fetchConfig: flow(function* () {
      try {
        self.config = yield loadConfig();
      } catch (err) {
        logger.error('fetchConfig error, use default config', err);
        self.config = defaultConfig;
      }
    }),
    flushClient() {
      self.client = ClientStore.create();
    }
  };
}).views((self) => {
  return {
    legacyConfig() {
      const config = Object.assign({}, self.config);

      config.useSSL = config.ssl;
      config.ip = config.hostname;
      config.path = config.pathname;
      config.displayActiveTorrentCountIcon = config.showActiveCountBadge;
      config.showNotificationOnDownloadCompleate = config.showDownloadCompleteNotifications;
      config.popupUpdateInterval = config.uiUpdateInterval;
      config.hideSeedStatusItem = config.hideSeedingTorrents;
      config.hideFnishStatusItem = config.hideFinishedTorrents;
      config.selectDownloadCategoryOnAddItemFromContextMenu = config.selectDownloadCategoryAfterPutTorrentFromContextMenu;
      config.ctxMenuType = config.contextMenuType === 'folder';
      config.showDefaultFolderContextMenuItem = config.putDefaultPathInContextMenu;
      config.fixCirilicTitle = config.fixCyrillicTorrentName;
      config.fixCirilicTorrentPath = config.fixCyrillicDownloadPath;
      config.folderList = config.folders;
      config.labelList = config.labels;
      config.torrentListColumnList = config.torrentColumns;
      config.fileListColumnList = config.filesColumns;

      return config;
    },
  };
});

export default BgStore;