import {types} from "mobx-state-tree";
import SpeedRoll from "../SpeedRoll";
import SpeedRollStore from "./SpeedRollStore";

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
 * @property {*} isCompleted
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
    get remaining() {
      return self.size - self.downloaded;
    },
    get isCompleted() {
      return this.progress === 1000 || !!this.completedTime;
    }
  };
});

/**
 * @typedef {{}} FileStore
 * @property {string} name
 * @property {number} size
 * @property {number} downloaded
 * @property {number} priority
 */
const FileStore = types.model('FileStore', {
  name: types.string,
  size: types.number,
  downloaded: types.number,
  priority: types.number,
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
 * @property {function} removeTorrentByIds
 * @property {function} sync
 * @property {function} syncChanges
 * @property {function} setFileList
 * @property {function} setLabels
 * @property {function} setSettings
 * @property {*} activeTorrentIds
 * @property {*} activeCount
 * @property {*} currentSpeed
 */
const ClientStore = types.model('ClientStore', {
  torrents: types.map(TorrentStore),
  files: types.map(types.array(FileStore)),
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
      const removedIds = Object.keys(self.torrents);

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
        if (self.torrents.has(torrent.id)) {
          self.torrents.set(torrent.id, torrent);
        }
      });
    },
    setFileList(torrentId, files) {
      self.files.set(torrentId, files);
    },
    setLabels(labels) {
      self.labels = labels;
    },
    setSettings(settings) {
      self.settings = settings;
    }
  };
}).views((self) => {
  return {
    get torrentIds() {
      return Array.from(self.torrents.keys());
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
  };
});

export default ClientStore;