import {types, flow, isAlive, resolveIdentifier} from "mobx-state-tree";
import {FileStore, TorrentStore} from "./ClientStore";
import callApi from "../tools/callApi";
import getLogger from "../tools/getLogger";

const logger = getLogger('FileListStore');

/**
 * @typedef {{}} FileListStore
 * @property {string} [state]
 * @property {string} id
 * @property {FileStore[]} files
 * @property {function:Promise} fetchFiles
 * @property {function} afterCreate
 * @property {function} beforeDestroy
 */
const FileListStore = types.model('FileListStore', {
  state: types.optional(types.enumeration(['idle', 'pending', 'done', 'error']), 'idle'),
  id: types.string,
  files: types.array(FileStore),
  isLoading: types.optional(types.boolean, true),
}).actions((self) => {
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
    afterCreate() {
      intervalId = setInterval(() => {
        self.fetchFiles();
      });
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