import {getRoot, getSnapshot, types} from "mobx-state-tree";
import SpeedRollStore from "./SpeedRollStore";
import speedToStr from "../tools/speedToStr";
import TorrentStore from "./TorrentStore";
import callApi from "../tools/callApi";

/**
 * @typedef {{}} LabelStore
 * @property {string} name
 */
const LabelStore = types.model('LabelStore', {
  name: types.identifier,
});

/**
 * @typedef {{}} SettingsStore
 * @property {number|undefined} downloadSpeedLimit
 * @property {number|undefined} uploadSpeedLimit
 * @property {*} downloadSpeedLimitStr
 * @property {*} uploadSpeedLimitStr
 */
const SettingsStore = types.model('SettingsStore', {
  downloadSpeedLimit: types.maybe(types.number),
  uploadSpeedLimit: types.maybe(types.number),
}).views((self) => {
  return {
    get downloadSpeedLimitStr() {
      return speedToStr(self.downloadSpeedLimit * 1024);
    },
    get uploadSpeedLimitStr() {
      return speedToStr(self.uploadSpeedLimit * 1024);
    },
  };
});

/**
 * @typedef {{}} ClientStore
 * @property {Map<*,TorrentStore>} torrents
 * @property {LabelStore[]|undefined} labels
 * @property {SettingsStore|undefined} settings
 * @property {SpeedRollStore} [speedRoll]
 * @property {function} removeTorrentByIds
 * @property {function} sync
 * @property {function} syncChanges
 * @property {function} setTorrents
 * @property {function} setLabels
 * @property {function} setSettings
 * @property {*} torrentIds
 * @property {*} downloadingTorrentIds
 * @property {*} pausedTorrentIds
 * @property {*} sortedTorrents
 * @property {*} sortedTorrentIds
 * @property {*} activeTorrentIds
 * @property {*} activeCount
 * @property {*} currentSpeed
 * @property {*} currentSpeedStr
 * @property {*} allLabels
 * @property {function} torrentsStart
 * @property {function} torrentsForceStart
 * @property {function} torrentsPause
 * @property {function} torrentsUnpause
 * @property {function} torrentsStop
 * @property {function} torrentsRecheck
 * @property {function} torrentsRemove
 * @property {function} torrentsRemoveTorrent
 * @property {function} torrentsRemoveFiles
 * @property {function} torrentsRemoveTorrentFiles
 * @property {function} torrentsQueueUp
 * @property {function} torrentsQueueDown
 * @property {function} torrentsSetLabel
 * @property {function} filesSetPriority
 * @property {function} setDownloadSpeedLimit
 * @property {function} setUploadSpeedLimit
 * @property {function} getSettings
 * @property {function} sendFiles
 * @property {function} getSnapshot
 * @property {function} syncUiClient
 */
const ClientStore = types.model('ClientStore', {
  torrents: types.map(TorrentStore),
  // files: types.map(types.array(FileStore)),
  labels: types.maybe(types.array(LabelStore)),
  settings: types.maybe(SettingsStore),
  speedRoll: types.optional(SpeedRollStore, {}),
}).actions((self) => {
  return {
    removeTorrentByIds(ids) {
      ids.forEach(id => {
        self.torrents.delete(id);
        // self.files.delete(id);
      });
    },
    sync(torrents) {
      const removedIds = Array.from(self.torrents.keys());

      torrents.forEach((torrent) => {
        const id = torrent.id;

        const pos = removedIds.indexOf(id);
        if (pos !== -1) {
          removedIds.splice(pos, 1);
        }

        self.torrents.set(id, torrent);
      });

      self.removeTorrentByIds(removedIds);
    },
    syncChanges(torrents) {
      torrents.forEach((torrent) => {
        self.torrents.set(torrent.id, torrent);
      });
    },
    /*setFileList(torrentId, files) {
      self.files.set(torrentId, files);
    },*/
    setTorrents(torrents) {
      self.torrents = torrents;
    },
    setLabels(labels) {
      self.labels = labels;
    },
    setSettings(settings) {
      self.settings = settings;
    },
  };
}).views((self) => {
  const syncUiWrap = (fn) => {
    return Promise.resolve(fn()).then((result) => {
      return self.syncUiClient().then(() => result);
    });
  };

  return {
    get torrentIds() {
      return Array.from(self.torrents.keys());
    },
    get downloadingTorrentIds() {
      const result = [];
      for (const torrent of self.torrents.values()) {
        if (torrent.isDownloading) {
          result.push(torrent.id);
        }
      }
      return result;
    },
    get pausedTorrentIds() {
      const result = [];
      for (const torrent of self.torrents.values()) {
        if (torrent.isPaused) {
          result.push(torrent.id);
        }
      }
      return result;
    },
    get activeTorrentIds() {
      const result = [];
      for (const torrent of self.torrents.values()) {
        if (!torrent.isCompleted) {
          result.push(torrent.id);
        }
      }
      return result;
    },
    get activeCount() {
      return self.activeTorrentIds.length;
    },
    get currentSpeed() {
      let downloadSpeed = 0;
      let uploadSpeed = 0;
      for (const torrent of self.torrents.values()) {
        downloadSpeed += torrent.downloadSpeed;
        uploadSpeed += torrent.uploadSpeed;
      }
      return {
        downloadSpeed,
        uploadSpeed
      };
    },
    get currentSpeedStr() {
      const {downloadSpeed,uploadSpeed} = self.currentSpeed;
      return {
        downloadSpeedStr: speedToStr(downloadSpeed),
        uploadSpeedStr: speedToStr(uploadSpeed),
      };
    },
    get allLabels() {
      /**@type RootStore*/const rootStore = getRoot(self);
      const result = rootStore.config.labels.slice(0);
      self.labels.forEach(({name}) => {
        if (result.indexOf(name) === -1) {
          result.push(name);
        }
      });
      return result;
    },
    torrentsStart(ids) {
      return syncUiWrap(() => {
        return callApi({action: 'start', ids: ids});
      });
    },
    torrentsForceStart(ids) {
      return syncUiWrap(() => {
        return callApi({action: 'forcestart', ids: ids});
      });
    },
    torrentsPause(ids) {
      return syncUiWrap(() => {
        return callApi({action: 'pause', ids: ids});
      });
    },
    torrentsUnpause(ids) {
      return syncUiWrap(() => {
        return callApi({action: 'unpause', ids: ids});
      });
    },
    torrentsStop(ids) {
      return syncUiWrap(() => {
        return callApi({action: 'stop', ids: ids});
      });
    },
    torrentsRecheck(ids) {
      return syncUiWrap(() => {
        return callApi({action: 'recheck', ids: ids});
      });
    },
    torrentsRemove(ids) {
      return syncUiWrap(() => {
        return callApi({action: 'remove', ids: ids});
      });
    },
    torrentsRemoveTorrent(ids) {
      return syncUiWrap(() => {
        return callApi({action: 'removetorrent', ids: ids});
      });
    },
    torrentsRemoveFiles(ids) {
      return syncUiWrap(() => {
        return callApi({action: 'removedata', ids: ids});
      });
    },
    torrentsRemoveTorrentFiles(ids) {
      return syncUiWrap(() => {
        return callApi({action: 'removedatatorrent', ids: ids});
      });
    },
    torrentsQueueUp(ids) {
      return syncUiWrap(() => {
        return callApi({action: 'queueUp', ids: ids});
      });
    },
    torrentsQueueDown(ids) {
      return syncUiWrap(() => {
        return callApi({action: 'queueDown', ids: ids});
      });
    },
    torrentsSetLabel(ids, label) {
      return syncUiWrap(() => {
        return callApi({action: 'setLabel', label, ids: ids});
      });
    },
    filesSetPriority(id, fileIdxs, level) {
      return syncUiWrap(() => {
        return callApi({action: 'setPriority', level, id: id, fileIdxs});
      });
    },
    setDownloadSpeedLimit(speed) {
      return syncUiWrap(() => {
        return callApi({action: 'setDownloadSpeedLimit', speed});
      });
    },
    setUploadSpeedLimit(speed) {
      return syncUiWrap(() => {
        return callApi({action: 'setUploadSpeedLimit', speed});
      });
    },
    getSettings() {
      return syncUiWrap(() => {
        return callApi({action: 'getSettings'});
      });
    },
    sendFiles(urls, directory, label) {
      return syncUiWrap(() => {
        return callApi({action: 'sendFiles', urls, directory, label});
      });
    },
    getSnapshot() {
      return getSnapshot(self);
    },
    syncUiClient() {
      return updateTorrentList().then((client) => {
        self.setTorrents(client.torrents);
        self.setLabels(client.labels);
        self.setSettings(client.settings);
        self.speedRoll.setData(client.speedRoll.data);
      });
    }
  };
});

const updateTorrentList = () => {
  return callApi({
    action: 'updateTorrentList'
  });
};

export default ClientStore;