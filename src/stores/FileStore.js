import {getRoot, types} from "mobx-state-tree";

const filesize = require('filesize');

const priorityLocaleMap = ['MF_DONT', 'MF_LOW', 'MF_NORMAL', 'MF_HIGH'];

/**
 * @typedef {{}} FileStore
 * @property {string} name
 * @property {number} size
 * @property {number} downloaded
 * @property {number} priority
 * @property {*} progress
 * @property {*} progressStr
 * @property {*} sizeStr
 * @property {*} downloadedStr
 * @property {*} priorityStr
 * @property {*} selected
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
    },
    get selected() {
      /**@type RootStore*/const rootStore = getRoot(self);
      return rootStore.fileList.selectedIds.indexOf(self.name) !== -1;
    }
  };
});

export default FileStore;