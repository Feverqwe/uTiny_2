import {applyPatch, types} from "mobx-state-tree";
import {defaultConfig} from "../../tools/loadConfig";
import mobxCompare from "../../tools/mobxCompare";

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
 * @property {string} name
 * @property {string} path
 */
const FolderStore = types.model('FolderStore', {
  name: types.string,
  path: types.string
});

/**
 * @typedef {{}} ConfigStore
 * @property {string} hostname
 * @property {boolean} ssl
 * @property {number} port
 * @property {string} pathname
 * @property {boolean} authenticationRequired
 * @property {string} login
 * @property {string} password
 * @property {boolean} showActiveCountBadge
 * @property {boolean} showDownloadCompleteNotifications
 * @property {number} backgroundUpdateInterval
 * @property {number} uiUpdateInterval
 * @property {boolean} hideSeedingTorrents
 * @property {boolean} hideFinishedTorrents
 * @property {boolean} showSpeedGraph
 * @property {number} popupHeight
 * @property {boolean} selectDownloadCategoryAfterPutTorrentFromContextMenu
 * @property {string} contextMenuType
 * @property {boolean} treeViewContextMenu
 * @property {boolean} putDefaultPathInContextMenu
 * @property {string} badgeColor
 * @property {boolean} showFreeSpace
 * @property {boolean} fixCyrillicTorrentName
 * @property {boolean} fixCyrillicDownloadPath
 * @property {FolderStore[]} folders
 * @property {string[]} labels
 * @property {ColumnsStore[]} torrentColumns
 * @property {ColumnsStore[]} filesColumns
 * @property {number} configVersion
 * @property {function} patchOptions
 * @property {function} afterCreate
 * @property {function} beforeDestroy
 */
const ConfigStore = types.model('ConfigStore', {
  hostname: types.string,
  ssl: types.boolean,
  port: types.number,
  pathname: types.string,

  authenticationRequired: types.boolean,
  login: types.string,
  password: types.string,

  showActiveCountBadge: types.boolean,
  showDownloadCompleteNotifications: types.boolean,
  backgroundUpdateInterval: types.number,
  uiUpdateInterval: types.number,

  hideSeedingTorrents: types.boolean,
  hideFinishedTorrents: types.boolean,
  showSpeedGraph: types.boolean,

  popupHeight: types.number,
  selectDownloadCategoryAfterPutTorrentFromContextMenu: types.boolean,
  contextMenuType: types.enumeration(['folder', 'label']),
  treeViewContextMenu: types.boolean,
  putDefaultPathInContextMenu: types.boolean,

  badgeColor: types.string,

  showFreeSpace: types.boolean,

  fixCyrillicTorrentName: types.boolean,
  fixCyrillicDownloadPath: types.boolean,

  folders: types.array(FolderStore),
  labels: types.array(types.string),

  torrentColumns: types.array(ColumnsStore),
  filesColumns: types.array(ColumnsStore),

  configVersion: types.number,
}).actions((self) => {
  return {
    patchOptions(patch) {
      applyPatch(self, patch);
    }
  };
}).views((self) => {
  const storageChangeListener = (changes, namespace) => {
    if (namespace === 'local') {
      let hasChanges = false;
      const currentOptions = {};
      const options = {};
      Object.entries(changes).forEach(([key, {newValue}]) => {
        if (defaultConfig.hasOwnProperty(key)) {
          hasChanges = true;
          options[key] = newValue;
          currentOptions[key] = self[key].toJSON();
        }
      });
      if (hasChanges) {
        const diff = mobxCompare(currentOptions, options);
        self.patchOptions(diff);
      }
    }
  };

  return {
    afterCreate() {
      chrome.storage.onChanged.addListener(storageChangeListener);
    },
    beforeDestroy() {
      chrome.storage.onChanged.removeListener(storageChangeListener);
    },
  };
});

export default ConfigStore;