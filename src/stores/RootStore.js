import {autorun} from "mobx";
import {flow, types} from "mobx-state-tree";
import ConfigStore from "./ConfigStore";
import getLogger from "../tools/getLogger";
import ClientStore from "./ClientStore";
import callApi from "../tools/callApi";
import FileListStore from "./FileListSore";

const logger = getLogger('RootStore');

/**
 * @typedef {{}} RootStore
 * @property {string} [state]
 * @property {ConfigStore|undefined} config
 * @property {ClientStore|undefined} client
 * @property {FileListStore|undefined} fileList
 * @property {function:Promise} init
 * @property {function} createFileList
 * @property {function} destroyFileList
 * @property {function} handleReady
 * @property {function} updateTorrentList
 * @property {*} isPopup
 */
const RootStore = types.model('RootStore', {
  state: types.optional(types.enumeration(['idle', 'pending', 'done', 'error']), 'idle'),
  config: types.maybe(ConfigStore),
  client: types.maybe(ClientStore),
  fileList: types.maybe(FileListStore),
}).actions((self) => {
  return {
    init: flow(function* () {
      if (self.state === 'pending') return;
      self.state = 'pending';
      try {
        self.config = yield fetchConfig();
        self.client = yield fetchClient();
        self.handleReady();
        self.state = 'done';
      } catch (err) {
        logger.error('init error', err);
        self.state = 'error';
      }
    }),
    createFileList(id) {
      return self.fileList = {id};
    },
    destroyFileList() {
      self.fileList = undefined;
    }
  };
}).views((self) => {
  let intervalId = null;

  const handleReady = () => {
    autorun(() => {
      clearInterval(intervalId);
      intervalId = setInterval(() =>{
        self.updateTorrentList();
      }, self.config.uiUpdateInterval);
    });
  };

  return {
    handleReady() {
      handleReady();
    },
    updateTorrentList() {
      return updateTorrentList().then((client) => {
        self.client.setTorrents(client.torrents);
        self.client.setLabels(client.labels);
        self.client.setSettings(client.settings);
        self.client.speedRoll.setData(client.speedRoll.data);
      });
    },
    get isPopup() {
      return location.hash === '#popup';
    }
  };
});

const updateTorrentList = () => {
  return callApi({
    action: 'updateTorrentList'
  });
};

const fetchClient = () => {
  return callApi({
    action: 'getClientStore'
  });
};

const fetchConfig = () => {
  return callApi({
    action: 'getConfigStore'
  });
};

export default RootStore;