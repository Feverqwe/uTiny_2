import {getRoot, types} from "mobx-state-tree";
import ListSelectStore from "./ListSelectStore";

/**
 * @typedef {ListSelectStore} TorrentListStore
 * @property {*} _sortedIds
 */
const TorrentListStore = types.compose('TorrentListStore', ListSelectStore, types.model({

})).actions((self) => {
  return {};
}).views((self) => {
  return {
    get _sortedIds() {
      /**@type RootStore*/const rootStore = getRoot(self);
      return rootStore.client.sortedTorrentIds;
    }
  };
});

export default TorrentListStore;