import getLogger from "./getLogger";
import storageGet from "./storageGet";
import storageSet from "./storageSet";

const logger = getLogger('loadConfig');

const oldConfigMap = {
  useSSL: 'ssl',
  ip: 'hostname',
  path: 'pathname',
  displayActiveTorrentCountIcon: 'showActiveCountBadge',
  showNotificationOnDownloadCompleate: 'showDownloadCompleteNotifications',
  popupUpdateInterval: 'uiUpdateInterval',
  hideSeedStatusItem: 'hideSeedingTorrents',
  hideFnishStatusItem: 'hideFinishedTorrents',
  selectDownloadCategoryOnAddItemFromContextMenu: 'selectDownloadCategoryAfterPutTorrentFromContextMenu',
  ctxMenuType: 'contextMenuType',
  showDefaultFolderContextMenuItem: 'putDefaultPathInContextMenu',
  fixCirilicTitle: 'fixCyrillicTorrentName',
  fixCirilicTorrentPath: 'fixCyrillicDownloadPath',
  folderList: 'folders',
  labelList: 'labels',
  torrentListColumnList: 'torrentColumns',
  fileListColumnList: 'filesColumns',
};

const oldConfigDefaults = Object.keys(oldConfigMap);

const loadConfig = (keys) => {
  return storageGet(keys).then((config) => {
    if (config.configVersion !== 2) {
      return storageGet(oldConfigDefaults).then((oldConfig) => {
        return migrateConfig(oldConfig, config);
      }).then((config) => {
        config.configVersion = 2;
        return storageSet(config).then(() => config);
      });
    }
    return config;
  }).then((config) => {
    if (config.selectedLabel) {
      if (typeof config.selectedLabel.custom === "number") {
        config.selectedLabel.custom = !!config.selectedLabel.custom;
      }
    }

    ['showSpeedGraph', 'treeViewContextMenu', 'showFreeSpace'].forEach((key) => {
      if (typeof config[key] === 'number') {
        config[key] = !!config[key];
      }
    });

    return config;
  });
};

function migrateConfig(oldConfig, config) {
  const transformMap = {
    useSSL: intToBoolean,
    displayActiveTorrentCountIcon: intToBoolean,
    showNotificationOnDownloadCompleate: intToBoolean,
    hideSeedStatusItem: intToBoolean,
    hideFnishStatusItem: intToBoolean,
    showSpeedGraph: intToBoolean,
    selectDownloadCategoryOnAddItemFromContextMenu: intToBoolean,
    ctxMenuType: value => value ? 'folder' : 'label',
    treeViewContextMenu: intToBoolean,
    showDefaultFolderContextMenuItem: intToBoolean,
    showFreeSpace: intToBoolean,
    fixCirilicTitle: intToBoolean,
    fixCirilicTorrentPath: intToBoolean,
    folderList: folderListToFolders,
    selectedLabel: selectedLabelToLabel,
  };

  Object.entries(oldConfig).forEach(([key, value]) => {
    const newKey = oldConfigMap[key];

    const transform = transformMap[key];
    if (transform) {
      value = transform(value);
    }

    config[newKey || key] = value;
  });

  function intToBoolean(value) {
    return typeof value === 'boolean' ? value : !!value;
  }

  function folderListToFolders(value) {
    return value.map(([volume, path, label]) => {
      return {
        volume: parseInt(volume, 10),
        path,
        name: label || ''
      };
    });
  }

  function selectedLabelToLabel(value) {
    return {
      label: value.label,
      custom: !!value.custom
    };
  }

  return config;
}

export default loadConfig;
export {migrateConfig};