import {flow, types} from "mobx-state-tree";
import ConfigStore from "./ConfigStore";
import getLogger from "../tools/getLogger";
import ClientStore from "./ClientStore";
import callApi from "../tools/callApi";

const logger = getLogger('RootStore');

/**
 * @typedef {{}} RootStore
 * @property {string} [state]
 * @property {ConfigStore|undefined} config
 * @property {ClientStore|undefined} client
 * @property {function:Promise} init
 * @property {*} isPopup
 */
const RootStore = types.model('RootStore', {
  state: types.optional(types.enumeration(['idle', 'pending', 'done', 'error']), 'idle'),
  config: types.maybe(ConfigStore),
  client: types.maybe(ClientStore),
}).actions((self) => {
  return {
    init: flow(function* () {
      if (self.state === 'pending') return;
      self.state = 'pending';
      try {
        self.config = yield fetchConfig();
        self.client = yield fetchClient();
        self.state = 'done';
      } catch (err) {
        logger.error('init error', err);
        self.state = 'error';
      }
    }),
  };
}).views(() => {
  return {

    get isPopup() {
      return location.hash === '#popup';
    }
  };
});

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