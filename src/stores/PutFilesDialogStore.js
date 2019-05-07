import {types, getRoot} from "mobx-state-tree";

/**
 * @typedef {{}} PutFilesDialogStore
 * @property {number} id
 * @property {string} type
 * @property {*} files
 * @property {function} close
 */
const PutFilesDialogStore = types.model('PutFilesDialogStore', {
  id: types.identifier,
  type: types.literal('putFiles'),
}).views((self) => {
  let _files = null;
  return {
    set files(files) {
      _files = files;
    },
    get files() {
      return _files;
    },
    close() {
      /**@type RootStore*/const rootStore = getRoot(self);
      rootStore.destroyDialog(self.id);
    }
  };
});

export default PutFilesDialogStore;