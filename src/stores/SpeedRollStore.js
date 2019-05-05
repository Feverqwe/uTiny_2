import {types} from "mobx-state-tree";

/**
 * @typedef {{}} SpeedRollStore
 * @property {{download:number,upload:number,time:number}[]} data
 * @property {function} add
 * @property {function} clean
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
    },

    setData(data) {
      self.data = data;
    }
  };
}).views((self) => {
  return {
    get graph() {
      const timeline = [];
      const timeSummaryMap = new Map();

      for (let i = 0, item; item = self.data[i]; i++) {
        const {time: timeMs, download, upload} = item;
        const time = Math.trunc(timeMs / 1000);
        let summary = timeSummaryMap.get(time);
        if (!summary) {
          timeline.push(time);
          timeSummaryMap.set(time, summary = {count: 0, download: 0, upload: 0});
        }
        summary.count++;
        summary.download += download;
        summary.upload += upload;
      }

      return timeline.map((time) => {
        const summary = timeSummaryMap.get(time);
        return {
          time,
          download: summary.count / summary.download,
          upload: summary.count / summary.upload
        };
      });
    }
  };
});

export default SpeedRollStore;