import {getRoot, types} from "mobx-state-tree";
import callApi from "../tools/callApi";
import speedToStr from "../tools/speedToStr";
import getEta from "../tools/getEta";
import fecha from "fecha";
import utStateToText from "../tools/utStateToText";

const filesize = require('filesize');

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
 * @property {function} start
 * @property {function} pause
 * @property {function} stop
 * @property {*} remaining
 * @property {*} remainingStr
 * @property {*} isCompleted
 * @property {*} sizeStr
 * @property {*} progressStr
 * @property {*} uploadSpeedStr
 * @property {*} downloadSpeedStr
 * @property {*} etaStr
 * @property {*} uploadedStr
 * @property {*} downloadedStr
 * @property {*} availableStr
 * @property {*} addedTimeStr
 * @property {*} completedTimeStr
 * @property {*} stateText
 * @property {*} selected
 * @property {*} actions
 * @property {*} isSeeding
 * @property {*} isDownloading
 * @property {*} isPaused
 * @property {*} isActive
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
      return callApi({action: 'start', ids: [self.id]});
    },
    pause() {
      return callApi({action: 'pause', ids: [self.id]});
    },
    stop() {
      return callApi({action: 'stop', ids: [self.id]});
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
    },
    get selected() {
      /**@type RootStore*/const rootStore = getRoot(self);
      return rootStore.torrentList.selectedIds.indexOf(self.id) !== -1;
    },
    get actions() {
      const stat = self.state;
      const loaded = !!(stat & 128);
      const queued = !!(stat & 64);
      const paused = !!(stat & 32);
      const error = !!(stat & 16);
      const checked = !!(stat & 8);
      const start_after_check = !!(stat & 4);
      const checking = !!(stat & 2);
      const started = !!(stat & 1);

      const actions = [];
      if (!checking && !started && !queued) {
        actions.push('recheck');
      }
      if (checking || started || queued) {
        actions.push('stop');
      }
      if ((started || checking) && paused) {
        actions.push('unpause');
      }
      if (!paused && (checking || started || queued)) {
        actions.push('pause');
      }
      if (!queued || paused) {
        actions.push('start');
      }
      if ((!started || queued || paused) && !checking) {
        actions.push('forcestart');
      }

      if (actions.indexOf('pause') !== -1) {
        const pos = actions.indexOf('unpause');
        if (pos !== -1) {
          actions.splice(pos, 1);
        }
      }

      return actions;
    },
    get isSeeding() {
      return !!(self.state & 1 && self.progress === 1000);
    },
    get isDownloading() {
      return !!(self.state & 1 && self.progress !== 1000);
    },
    get isPaused() {
      return !!(self.state & 32 && !(self.state & 2));
    },
    get isActive() {
      return !!(self.downloadSpeed || self.uploadSpeed);
    }
  };
});

export default TorrentStore;