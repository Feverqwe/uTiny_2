import {types} from "mobx-state-tree";

/**
 * @typedef {{}} SpeedRollStore
 * @property {{download:number,upload:number,time:number}[]} data
 * @property {function} add
 * @property {function} clean
 * @property {function} flush
 */
const SpeedRollStore = types.model('SpeedRollStore', {
  data: types.array(types.model({
    download: types.number,
    upload: types.number,
    time: types.number
  }))
}).actions((self) => {
  return {
    add(download, upload) {
      self.data.push({
        download, upload,
        time: Date.now()
      });

      self.clean();
    },

    clean() {
      const oldestTime = Date.now() - 5 * 60 * 1000;
      while (self.data.length && self.data[0].time < oldestTime) {
        self.data.shift();
      }
    }
  };
});

export default SpeedRollStore;