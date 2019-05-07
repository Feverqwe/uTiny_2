import {autorun} from "mobx";
import {flow, types} from "mobx-state-tree";
import ConfigStore from "./ConfigStore";
import getLogger from "../tools/getLogger";
import ClientStore from "./ClientStore";
import callApi from "../tools/callApi";
import FileListStore from "./FileListStore";
import TorrentListStore from "./TorrentListStore";
import PutFilesDialogStore from "./PutFilesDialogStore";
import CreateLabelDialogStore from "./CreateLabelDialogStore";

const logger = getLogger('RootStore');

let dialogIndex = 0;

/**
 * @typedef {{}} RootStore
 * @property {string} [state]
 * @property {ConfigStore|undefined} config
 * @property {ClientStore|undefined} client
 * @property {TorrentListStore} [torrentList]
 * @property {FileListStore|undefined} fileList
 * @property {Map<*,*>} dialogs
 * @property {function:Promise} init
 * @property {function} flushTorrentList
 * @property {function} createFileList
 * @property {function} destroyFileList
 * @property {function} createDialog
 * @property {function} destroyDialog
 * @property {function} handleReady
 * @property {function} updateTorrentList
 * @property {*} isPopup
 */
const RootStore = types.model('RootStore', {
  state: types.optional(types.enumeration(['idle', 'pending', 'done', 'error']), 'idle'),
  config: types.maybe(ConfigStore),
  client: types.maybe(ClientStore),
  torrentList: types.optional(TorrentListStore, {}),
  fileList: types.maybe(FileListStore),
  dialogs: types.map(types.union(PutFilesDialogStore, CreateLabelDialogStore)),
}).actions((self) => {
  return {
    init: flow(function* () {
      if (self.state === 'pending') return;
      self.state = 'pending';
      try {
        self.config = yield fetchConfig();
        self.client = yield fetchClient();
        self.client.getSettings().catch((err) => {
          logger.error('init getSettings error', err);
        });
        self.handleReady();
        self.state = 'done';
      } catch (err) {
        logger.error('init error', err);
        self.state = 'error';
      }
    }),
    flushTorrentList() {
      return self.torrentList = {};
    },
    createFileList(id) {
      return self.fileList = {id};
    },
    destroyFileList() {
      self.fileList = undefined;
    },
    createDialog(dialog) {
      const id = `dialog_${++dialogIndex}`;
      self.dialogs.set(id, Object.assign({id}, dialog));
      return self.dialogs.get(id);
    },
    destroyDialog(id) {
      self.dialogs.delete(id);
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