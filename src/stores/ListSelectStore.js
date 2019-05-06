import {types} from "mobx-state-tree";

/**
 * @typedef {{}} ListSelectStore
 * @property {string[]} selectedIds
 * @property {function} addSelectedId
 * @property {function} removeSelectedId
 * @property {function} addMultipleSelectedId
 * @property {function} toggleSelectAll
 * @property {*} _sortedIds
 * @property {*} isSelectedAll
 */
const ListSelectStore = types.model('ListSelectStore', {
  selectedIds: types.array(types.string),
}).actions((self) => {
  return {
    addSelectedId(id) {
      const ids = self.selectedIds.slice(0);
      const pos = ids.indexOf(id);
      if (pos === -1) {
        ids.push(id);
      }
      self.selectedIds = ids;
    },
    removeSelectedId(id) {
      const ids = self.selectedIds.slice(0);
      const pos = ids.indexOf(id);
      if (pos !== -1) {
        ids.splice(pos, 1);
      }
      self.selectedIds = ids;
    },
    addMultipleSelectedId(toId) {
      if (!self.selectedIds.length) {
        return self.selectedIds(toId);
      }

      const fromId = self.selectedIds.slice(-1)[0];
      const ids = self._sortedIds;
      const fromPos = ids.indexOf(fromId);
      const toPos = ids.indexOf(toId);
      if (fromPos < toPos) {
        self.selectedIds = ids.slice(fromPos, toPos + 1);
      } else {
        self.selectedIds = ids.slice(toPos, fromPos + 1);
      }
    },
    toggleSelectAll() {
      if (self.isSelectedAll) {
        self.selectedIds = [];
      } else {
        self.selectedIds = self._sortedIds.slice(0);
      }
    }
  };
}).views((self) => {
  return {
    get _sortedIds() {
      throw new Error('Overwrite me!');
    },
    get isSelectedAll() {
      const ids = self._sortedIds;
      if (self.selectedIds.length === ids.length) {
        return self.selectedIds.every(id => ids.indexOf(id) !== -1);
      }
      return false;
    }
  };
});

export default ListSelectStore;