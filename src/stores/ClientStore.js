import {types, getSnapshot, getRoot} from "mobx-state-tree";
import SpeedRollStore from "./SpeedRollStore";
import fecha from "fecha";
import utStateToText from "../tools/utStateToText";
import getEta from "../tools/getEta";
import callApi from "../tools/callApi";

const filesize = require('filesize');

const priorityLocaleMap = ['MF_DONT', 'MF_LOW', 'MF_NORMAL', 'MF_HIGH'];

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
 * @typedef {{}} TorrentStore
 * @property {string} id
 * @property {number} state
 * @property {string} name
 * @property {number} size
 * @property {number} progress
 * @property {number} downloaded
 * @property {number} uploaded
 * @property {number} shared
 * @property {number} uploadSpeed
 * @property {number} downloadSpeed
 * @property {number} eta
 * @property {string} label
 * @property {number} activePeers
 * @property {number} peers
 * @property {number} activeSeeds
 * @property {number} seeds
 * @property {number} available
 * @property {number} order
 * @property {string|undefined} status
 * @property {string|undefined} sid
 * @property {number|undefined} addedTime
 * @property {number|undefined} completedTime
 * @property {string|undefined} directory
 * @property {*} remaining
 * @property {*} remainingStr
 * @property {*} isCompleted
 * @property {*} sizeStr
 * @property {*} progressStr
 * @property {*} uploadSpeedStr
 * @property {*} downloadSpeedStr
 * @property {*} uploadedStr
 * @property {*} downloadedStr
 * @property {*} availableStr
 * @property {*} addedTimeStr
 * @property {*} completedTimeStr
 * @property {*} stateText
 */
const TorrentStore = types.model('TorrentStore', {
  id: types.identifier,
  state: types.number,
  name: types.string,
  size: types.number,
  progress: types.number,
  downloaded: types.number,
  uploaded: types.number,
  shared: types.number,
  uploadSpeed: types.number,
  downloadSpeed: types.number,
  eta: types.number,
  label: types.string,
  activePeers: types.number,
  peers: types.number,
  activeSeeds: types.number,
  seeds: types.number,
  available: types.number,
  order: types.number,
  status: types.maybe(types.string),
  sid: types.maybe(types.string),
  addedTime: types.maybe(types.number),
  completedTime: types.maybe(types.number),
  directory: types.maybe(types.string),
}).views((self) => {
  return {
    start() {
      return callApi({action: 'start', id: self.id});
    },
    pause() {
      return callApi({action: 'pause', id: self.id});
    },
    stop() {
      return callApi({action: 'stop', id: self.id});
    },
    get remaining() {
      return self.size - self.downloaded;
    },
    get remainingStr() {
      return filesize(self.remaining);
    },
    get isCompleted() {
      return self.progress === 1000 || !!self.completedTime;
    },
    get sizeStr() {
      return filesize(self.size);
    },
    get progressStr() {
      let progress = self.progress / 10;
      if (progress < 100) {
        return progress.toFixed(1) + '%';
      } else {
        return Math.round(progress) + '%';
      }
    },
    get uploadSpeedStr() {
      return speedToStr(self.uploadSpeed);
    },
    get downloadSpeedStr() {
      return speedToStr(self.downloadSpeed);
    },
    get etaStr() {
      return getEta(self.eta);
    },
    get uploadedStr() {
      return filesize(self.uploaded);
    },
    get downloadedStr() {
      return filesize(self.downloaded);
    },
    get availableStr() {
      return Math.round((self.available / 65535) * 1000) / 1000;
    },
    get addedTimeStr() {
      if (!self.addedTime) {
        return '';
      } else {
        return fecha(self.addedTime, 'YYYY-MM-DD HH:mm:ss');
      }
    },
    get completedTimeStr() {
      if (!self.completedTime) {
        return '';
      } else {
        return fecha(self.completedTime, 'YYYY-MM-DD HH:mm:ss');
      }
    },
    get stateText() {
      return utStateToText(self);
    }
  };
});

function speedToStr(speed) {
  let speedText = null;
  if (speed < 0) {
    speedText = '';
  } else {
    const [size, symbol] = filesize(speed, {
      output: 'array'
    });
    speedText = `${size} ${symbol}/s`;
  }
  return speedText;
}

/**
 * @typedef {{}} FileStore
 * @property {string} name
 * @property {number} size
 * @property {number} downloaded
 * @property {number} priority
 */
const FileStore = types.model('FileStore', {
  name: types.identifier,
  size: types.number,
  downloaded: types.number,
  priority: types.number,
}).views((self) => {
  return {
    get progress() {
      return Math.round((self.downloaded * 100 / self.size) * 10) / 10;
    },
    get progressStr() {
      const progress = self.progress;
      if (progress < 100) {
        return progress.toFixed(1) + '%';
      } else {
        return Math.round(progress) + '%';
      }
    },
    get sizeStr() {
      return filesize(self.size);
    },
    get downloadedStr() {
      return filesize(self.downloaded);
    },
    get priorityStr() {
      return chrome.i18n.getMessage(priorityLocaleMap[self.priority]);
    }
  };
});

/**
 * @typedef {{}} LabelStore
 * @property {string} name
 */
const LabelStore = types.model('LabelStore', {
  name: types.string,
});

/**
 * @typedef {{}} SettingsStore
 * @property {number|undefined} max_dl_rate
 * @property {number|undefined} max_ul_rate
 */
const SettingsStore = types.model('SettingsStore', {
  max_dl_rate: types.maybe(types.number),
  max_ul_rate: types.maybe(types.number),
});

/**
 * @typedef {{}} ClientStore
 * @property {Map<*,TorrentStore>} torrents
 * @property {Map<*,FileStore[]>} files
 * @property {LabelStore[]|undefined} labels
 * @property {SettingsStore|undefined} settings
 * @property {SpeedRollStore} [speedRoll]
 * @property {function} removeTorrentByIds
 * @property {function} sync
 * @property {function} syncChanges
 * @property {function} setFileList
 * @property {function} setLabels
 * @property {function} setSettings
 * @property {*} torrentIds
 * @property {*} activeTorrentIds
 * @property {*} activeCount
 * @property {*} currentSpeed
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
        self.files.delete(id);
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
    setFileList(torrentId, files) {
      self.files.set(torrentId, files);
    },
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
    getSnapshot() {
      return getSnapshot(self);
    }
  };
});

export default ClientStore;
export {FileStore, TorrentStore};