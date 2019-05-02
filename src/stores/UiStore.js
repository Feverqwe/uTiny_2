import {flow, types} from "mobx-state-tree";
import ConfigStore from "./ConfigStore";
import getLogger from "../tools/getLogger";
import loadConfig, {defaultConfig} from "../tools/loadConfig";
import ClientStore from "./ClientStore";

const logger = getLogger('UiStore');

const UiStore = types.model('UiStore', {
  config: types.maybe(ConfigStore),
  client: types.optional(ClientStore, {}),
}).actions((self) => {
  return {
    fetchConfig: flow(function* () {
      try {
        self.config = yield loadConfig();
      } catch (err) {
        logger.error('fetchConfig error, use default config', err);
        self.config = defaultConfig;
      }
    }),
    flushClient() {
      self.client = ClientStore.create();
    }
  };
});

export default UiStore;