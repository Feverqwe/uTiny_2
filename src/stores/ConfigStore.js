import {types} from "mobx-state-tree";
import {defaultConfig} from "../tools/loadConfig";

/**
 * @typedef {{}} ColumnsStore
 * @property {string} column
 * @property {number} display
 * @property {number} order
 * @property {number} width
 * @property {string} lang
 */
const ColumnsStore =  types.model('ColumnsStore', {
  column: types.string,
  display: types.number,
  order: types.number,
  width: types.number,
  lang: types.string,
});

/**
 * @typedef {{}} FolderStore
 * @property {string} volume
 * @property {string} name
 * @property {string} path
 */
const FolderStore = types.model('FolderStore', {
  volume: types.string,
  name: types.string,
  path: types.string
});

/**
 * @typedef {{}} ConfigStore
 * @property {string} [hostname]
 * @property {boolean} [ssl]
 * @property {number} [port]
 * @property {string} [pathname]
 * @property {boolean} [authenticationRequired]
 * @property {string} [login]
 * @property {string} [password]
 * @property {boolean} [showActiveCountBadge]
 * @property {boolean} [showDownloadCompleteNotifications]
 * @property {number} [backgroundUpdateInterval]
 * @property {number} [uiUpdateInterval]
 * @property {boolean} [hideSeedingTorrents]
 * @property {boolean} [hideFinishedTorrents]
 * @property {boolean} [showSpeedGraph]
 * @property {number} [popupHeight]
 * @property {boolean} [selectDownloadCategoryAfterPutTorrentFromContextMenu]
 * @property {string} [contextMenuType]
 * @property {boolean} [treeViewContextMenu]
 * @property {boolean} [putDefaultPathInContextMenu]
 * @property {string} [badgeColor]
 * @property {boolean} [showFreeSpace]
 * @property {boolean} [fixCyrillicTorrentName]
 * @property {boolean} [fixCyrillicDownloadPath]
 * @property {FolderStore[]} folders
 * @property {string[]} labels
 * @property {ColumnsStore[]} torrentColumns
 * @property {ColumnsStore[]} filesColumns
 * @property {{by:string,[direction]:number}} [torrentsSort]
 * @property {{by:string,[direction]:number}} [filesSort]
 * @property {{label:string,custom:boolean}} [selectedLabel]
 * @property {number} [configVersion]
 * @property {function} patchOptions
 * @property {function} afterCreate
 * @property {function} beforeDestroy
 */
const ConfigStore = types.model('ConfigStore', {
  hostname: types.optional(types.string, ''),
  ssl: types.optional(types.boolean, false),
  port: types.optional(types.number, 8080),
  pathname: types.optional(types.string, '/gui/'),

  authenticationRequired: types.optional(types.boolean, true),
  login: types.optional(types.string, ''),
  password: types.optional(types.string, ''),

  showActiveCountBadge: types.optional(types.boolean, true),
  showDownloadCompleteNotifications: types.optional(types.boolean, true),
  backgroundUpdateInterval: types.optional(types.number, 120000),
  uiUpdateInterval: types.optional(types.number, 1000),

  hideSeedingTorrents: types.optional(types.boolean, false),
  hideFinishedTorrents: types.optional(types.boolean, false),
  showSpeedGraph: types.optional(types.boolean, true),

  popupHeight: types.optional(types.number, 350),
  selectDownloadCategoryAfterPutTorrentFromContextMenu: types.optional(types.boolean, false),
  contextMenuType: types.optional(types.enumeration(['folder', 'label']), 'folder'),
  treeViewContextMenu: types.optional(types.boolean, false),
  putDefaultPathInContextMenu: types.optional(types.boolean, false),

  badgeColor: types.optional(types.string, '0,0,0,0.40'),

  showFreeSpace: types.optional(types.boolean, true),

  fixCyrillicTorrentName: types.optional(types.boolean, false),
  fixCyrillicDownloadPath: types.optional(types.boolean, false),

  folders: types.array(FolderStore),
  labels: types.array(types.string),

  torrentColumns: types.array(ColumnsStore),
  filesColumns: types.array(ColumnsStore),

  torrentsSort: types.optional(types.model({
    by: types.string,
    direction: types.optional(types.number, 1)
  }), {by: 'name'}),

  filesSort: types.optional(types.model({
    by: types.string,
    direction: types.optional(types.number, 1)
  }), {by: 'name'}),

  selectedLabel: types.optional(types.model({
    label: types.string,
    custom: types.boolean,
  }), {label: 'ALL', custom: true}),

  configVersion: types.optional(types.number, 2),
}).actions((self) => {
  return {
    addFolder(volume, path, name = '') {
      self.folders.push({volume, path, name});
      chrome.storage.local.set({
        folders: self.folders.toJSON()
      });
    },
    addLabel(label) {
      self.labels.push(label);
      chrome.storage.local.set({
        labels: self.labels.toJSON()
      });
    },
    setKeyValue(keyValue) {
      Object.assign(self, keyValue);
    }
  };
}).views((self) => {
  const storageChangeListener = (changes, namespace) => {
    if (namespace === 'local') {
      const keyValue = {};
      Object.entries(changes).forEach(([key, {newValue}]) => {
        if (defaultConfig.hasOwnProperty(key)) {
          keyValue[key] = newValue;
        }
      });
      self.setKeyValue(keyValue);
    }
  };

  const customLabels = ['ALL', 'DL', 'SEEDING', 'COMPL', 'ACTIVE', 'INACTIVE', 'NOLABEL'];

  return {
    get visibleTorrentColumns() {
      return self.torrentColumns.filter(column => column.display);
    },
    get allLabels() {
      const cLabels = customLabels.map((label) => {
        return {label, custom: true};
      });
      const labels = self.labels.map((label) => {
        return {label, custom: false};
      });
      return [].concat(cLabels, labels);
    },
    afterCreate() {
      chrome.storage.onChanged.addListener(storageChangeListener);
    },
    beforeDestroy() {
      chrome.storage.onChanged.removeListener(storageChangeListener);
    },
  };
});

export default ConfigStore;