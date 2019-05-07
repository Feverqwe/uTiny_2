import {getRoot, getSnapshot, types} from "mobx-state-tree";
import SpeedRollStore from "./SpeedRollStore";
import speedToStr from "../tools/speedToStr";
import TorrentStore from "./TorrentStore";
import callApi from "../tools/callApi";

const byColumnMap = {
  done: 'progress',
  downspd: 'downloadSpeed',
  upspd: 'uploadSpeed',
  upped: 'uploaded',
  avail: 'available',
  added: 'addedTime',
  completed: 'completedTime',
};

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
 * @property {function} setFileList
 * @property {function} setTorrents
 * @property {function} setLabels
 * @property {function} setSettings
 * @property {*} torrentIds
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
 * @property {function} getSnapshot
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
    get sortedTorrents() {
      /**@type RootStore*/const rootStore = getRoot(self);
      const {by, direction} = rootStore.config.torrentsSort;
      const torrents = Array.from(self.torrents.values());

      const byColumn = byColumnMap[by] || by;

      const upDown = [-1, 1];
      if (direction === 1) {
        upDown.reverse();
      }

      torrents.sort((aa, bb) => {
        let a = aa[byColumn];
        let b = bb[byColumn];
        const [up, down] = upDown;

        if (byColumn === 'eta') {
          if (a === -1) {
            a = Infinity;
          }
          if (b === -1) {
            b = Infinity;
          }
        }

        if (byColumn === 'added' || byColumn === 'completed') {
          if (!a) {
            a = Infinity;
          }
          if (!b) {
            b = Infinity;
          }
        }

        if (a === b) {
          return 0;
        }
        if (a > b) {
          return up;
        }
        return down;
      });

      return torrents;
    },
    get sortedTorrentIds() {
      return self.sortedTorrents.map(torrent => torrent.id);
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
      return callApi({action: 'start', ids: ids});
    },
    torrentsForceStart(ids) {
      return callApi({action: 'forcestart', ids: ids});
    },
    torrentsPause(ids) {
      return callApi({action: 'pause', ids: ids});
    },
    torrentsUnpause(ids) {
      return callApi({action: 'unpause', ids: ids});
    },
    torrentsStop(ids) {
      return callApi({action: 'stop', ids: ids});
    },
    torrentsRecheck(ids) {
      return callApi({action: 'recheck', ids: ids});
    },
    torrentsRemove(ids) {
      return callApi({action: 'remove', ids: ids});
    },
    torrentsRemoveTorrent(ids) {
      return callApi({action: 'removetorrent', ids: ids});
    },
    torrentsRemoveFiles(ids) {
      return callApi({action: 'removedata', ids: ids});
    },
    torrentsRemoveTorrentFiles(ids) {
      return callApi({action: 'removedatatorrent', ids: ids});
    },
    torrentsQueueUp(ids) {
      return callApi({action: 'queueUp', ids: ids});
    },
    torrentsQueueDown(ids) {
      return callApi({action: 'queueDown', ids: ids});
    },
    torrentsSetLabel(ids, label) {
      return callApi({action: 'setLabel', label, ids: ids});
    },
    filesSetPriority(id, fileIdxs, level) {
      return callApi({action: 'setPriority', level, id: id, fileIdxs});
    },
    setDownloadSpeedLimit(speed) {
      return callApi({action: 'setDownloadSpeedLimit', speed});
    },
    setUploadSpeedLimit(speed) {
      return callApi({action: 'setUploadSpeedLimit', speed});
    },
    getSettings() {
      return callApi({action: 'getSettings'});
    },
    sendFiles(urls) {
      return callApi({action: 'sendFiles', urls});
    },
    getSnapshot() {
      return getSnapshot(self);
    }
  };
});

export default ClientStore;