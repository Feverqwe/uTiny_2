import {flow, isAlive, types} from "mobx-state-tree";
import ConfigStore from "./ConfigStore";
import getLogger from "../tools/getLogger";
import loadConfig, {defaultConfig} from "../tools/loadConfig";

const logger = getLogger('RootStore');

/**
 * @typedef {{}} RootStore
 * @property {ConfigStore|undefined} config
 * @property {function:Promise} fetchConfig
 */
const RootStore = types.model('RootStore', {
  config: types.maybe(ConfigStore),
  configState: types.optional(types.enumeration(['idle', 'pending', 'done', 'error']), 'idle'),
}).actions((self) => {
  return {
    fetchConfig: flow(function* () {
      if (self.configState === 'pending') return;
      self.configState = 'pending';
      try {
        self.config = yield loadConfig();
        if (isAlive(self)) {
          self.configState = 'done';
        }
      } catch (err) {
        logger.error('fetchConfig error, use default config', err);
        if (isAlive(self)) {
          self.config = defaultConfig;
          self.configState = 'error';
        }
      }
    }),
  };
});

export default RootStore;