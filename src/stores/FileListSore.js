import {types, flow, isAlive, resolveIdentifier, getRoot} from "mobx-state-tree";
import {FileStore, TorrentStore} from "./ClientStore";
import callApi from "../tools/callApi";
import getLogger from "../tools/getLogger";
import ListSelectStore from "./ListSelectStore";

const logger = getLogger('FileListStore');

const byColumnMap = {
  done: 'progress',
};

/**
 * @typedef {ListSelectStore} FileListStore
 * @property {function:Promise} fetchFiles
 * @property {*} torrent
 * @property {*} sortedFiles
 * @property {*} _sortedIds
 * @property {*} isSelectedAll
 * @property {function} afterCreate
 * @property {function} beforeDestroy
 */
const FileListStore = types.compose('FileListStore', ListSelectStore, types.model({
  id: types.identifier,
  state: types.optional(types.enumeration(['idle', 'pending', 'done', 'error']), 'idle'),
  files: types.array(FileStore),
  isLoading: types.optional(types.boolean, true),
})).actions((self) => {
  return {
    fetchFiles: flow(function* () {
      if (self.state === 'pending') return;
      self.state = 'pending';
      try {
         const files = yield fetchFileList(self.id);
         if (isAlive(self)) {
           self.files = files;
           self.isLoading = false;
           self.state = 'done';
         }
      } catch (err) {
        logger.error('fetchFiles error', err);
        self.state = 'error';
      }
    }),
  };
}).views((self) => {
  let intervalId = null;

  return {
    get torrent() {
      return resolveIdentifier(TorrentStore, self, self.id);
    },
    get sortedFiles() {
      /**@type RootStore*/const rootStore = getRoot(self);
      const {by, direction} = rootStore.config.filesSort;
      const files = self.files.slice(0);

      const byColumn = byColumnMap[by] || by;

      const upDown = [-1, 1];
      if (direction === 1) {
        upDown.reverse();
      }

      files.sort((aa, bb) => {
        const a = aa[byColumn];
        const b = bb[byColumn];
        const [up, down] = upDown;

        if (a === b) {
          return 0;
        }
        if (a > b) {
          return up;
        }
        return down;
      });

      return files;
    },
    get _sortedIds() {
      return self.sortedFiles.map(file => file.name);
    },
    get isSelectedAll() {
      const ids = self._sortedIds;
      if (!self.isLoading && self.selectedIds.length === ids.length) {
        return self.selectedIds.every(id => ids.indexOf(id) !== -1);
      }
      return false;
    },
    afterCreate() {
      /**@type RootStore*/const rootStore = getRoot(self);
      intervalId = setInterval(() => {
        self.fetchFiles();
      }, rootStore.config.uiUpdateInterval);
      self.fetchFiles();
    },
    beforeDestroy() {
      clearInterval(intervalId);
    }
  };
});

const fetchFileList = (id) => {
  return callApi({
    action: 'getFileList',
    id
  });
};

export default FileListStore;