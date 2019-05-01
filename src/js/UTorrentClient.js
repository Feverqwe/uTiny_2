import "whatwg-fetch";
import ErrorWithCode from "../tools/errorWithCode";
import utFixCyrillic from "../tools/utFixCyrillic";
import getLogger from "../tools/getLogger";
import queryStringify from "../tools/utQueryStringify";

const url = require('url');

const logger = getLogger('UTorrentClient');

class UTorrentClient {
  constructor(/**Bg*/bg) {
    this.bg = bg;

    this.token = null;
    this.cid = null;
    this.url = this.getUrl();
    this.tokenUrl = this.getTokenUrl();
  }

  getUrl() {
    return url.format({
      protocol: this.bg.bgStore.config.ssl ? 'https' : 'http',
      port: this.bg.bgStore.config.port,
      hostname: this.bg.bgStore.config.hostname,
      pathname: this.bg.bgStore.config.pathname,
    });
  }

  getTokenUrl() {
    return new URL('token.html', this.url).toString();
  }

  updateTorrents() {
    const params = {
      list: 1
    };
    if (this.cid) {
      params.cid = this.cid;
    }
    return this.sendAction(params).then((result) => {
      this.cid = result.cid;
    });
  }

  sendAction(query, body) {
    return this.retryIfTokenInvalid((token) => {
      const params = queryStringify(Object.assign({token}, query), this.bg.bgStore.config.fixCyrillicDownloadPath);

      const init = {};
      if (body) {
        init.method = 'POST';
        init.body = body;
      }

      return fetch(this.url + '?' + params, this.sign(init)).then((response) => {
        if (!response.ok) {
          const error = new ErrorWithCode(`${response.status}: ${response.statusText}`, `RESPONSE_IS_NOT_OK`);
          error.status = response.status;
          error.statusText = response.statusText;
          if (error.status === 400) {
            error.code = 'INVALID_TOKEN';
          }
          throw error;
        }

        if (this.bg.bgStore.config.fixCyrillicTorrentName) {
          return response.text().then((body) => {
            return JSON.parse(utFixCyrillic(body));
          });
        } else {
          return response.json();
        }
      });
    }).then(this.normalizeResponse);
  }

  sendFile({file, url}, directory) {
    return Promise.resolve().then(() => {
      if (url) {
        return this.sendAction(putDirectory({
          action: 'add-url',
          s: url
        }));
      } else {
        const formData = new FormData();
        formData.append("torrent_file", file);

        return this.sendAction(putDirectory({
          action: 'add-file',
        }), formData);
      }
    }).catch((err) => {
      if (err.code === 'UTORRENT_ERROR') {
        this.bg.handleTorrentError(err.message);
      } else {
        this.bg.handleTorrentError('Unexpected error');
      }
      throw err;
    });

    function putDirectory(query) {
      if (directory) {
        query.download_dir = directory.download_dir;
        query.path = directory.path;
      }
      return query;
    }
  }

  putTorrent({file, magnet}, directory, label) {
    return this.sendAction({list: 1}).then((result) => {
      const cid = result.cid;
      const previousTorrentIds = this.bg.bgStore.client.torrentIds;

      return this.sendFile({file, magnet}, directory).then(() => {
        return this.sendAction({list: 1, cid});
      }).then(() => {
        const torrentIds = this.bg.bgStore.client.torrentIds;
        const newIds = arrayDifferent(torrentIds, previousTorrentIds);
        if (!newIds.length) {
          this.bg.handleTorrentExists();
        } else {
          return Promise.all(newIds.map((torrentId) => {
            // new
            const torrent = this.bg.bgStore.client.torrents.get(torrentId);
            if (torrent) {
              this.bg.handleTorrentAdded(torrent);

              if (label && !torrent.label) {
                return this.sendAction({action: 'setprops', s: 'label', hash: torrent.id, v: label}).catch((err) => {
                  logger.error('Set torrent label error', torrent.id, err);
                });
              }
            }
          }));
        }
      });
    });
  }

  retryIfTokenInvalid(callback) {
    return this.getValidToken().then(callback).catch((err) => {
      if (err.code === 'INVALID_TOKEN') {
        this.token = null;
        return this.getValidToken().then(callback);
      }
      throw err;
    });
  }

  getValidToken() {
    return Promise.resolve().then(() => {
      if (!this.token) {
        return this.requestToken().then((token) => {
          return this.token = token;
        });
      }
      return this.token;
    });
  }

  sign(fetchOptions = {}) {
    if (this.bg.bgStore.config.authenticationRequired) {
      if (!fetchOptions.headers) {
        fetchOptions.headers = {};
      }
      fetchOptions.headers.Authorization = 'Basic ' + btoa([this.bg.bgStore.config.login, this.bg.bgStore.config.password].join(':'));
    }
    return fetchOptions;
  }

  requestToken() {
    const init = this.sign();
    return fetch(this.tokenUrl, init).then((response) => {
      if (!response.ok) {
        const error = new ErrorWithCode(`${response.status}: ${response.statusText}`, `RESPONSE_IS_NOT_OK`);
        error.status = response.status;
        error.statusText = response.statusText;
        throw error;
      }
      return response.text();
    }).then((body) => {
      const m = />([^<]+)</.exec(body);
      if (!m) {
        throw new ErrorWithCode('Token not found', 'TOKEN_NOT_FOUND');
      }
      return m[1];
    });
  }

  normalizeResponse = (response) => {
    const previousActiveTorrentIds = this.bg.bgStore.client.activeTorrentIds;

    const result = {};

    if (response.error) {
      throw new ErrorWithCode(response.error, 'UTORRENT_ERROR');
    }

    if (response.torrentc) {
      result.cid = response.torrentc;
    }

    if (response.torrentm) {
      // Removed torrents
      result.removedTorrentIds = response.torrentm;
      this.bg.bgStore.client.removeTorrentByIds(result.removedTorrentIds);
    }

    if (response.torrentp) {
      // sync part of list
      result.changedTorernts = response.torrentp.map(this.normalizeTorrent);
      this.bg.bgStore.client.syncChanges(result.changedTorernts);
    }

    if (response.torrents) {
      // sync full list
      result.torrents = response.torrents.map(this.normalizeTorrent);
      this.bg.bgStore.client.sync(result.torrents);
    }

    if (response.label) {
      // labels
      result.labels = response.label.map(this.normalizeLabel);
      this.bg.bgStore.client.setLabels(result.labels);
    }

    if (response.settings) {
      // settings
      result.settings = this.normalizeSettings(response.settings);
      this.bg.bgStore.client.setSettings(result.settings);
    }

    if (response.files) {
      const [torrentId, files] = response.files;
      result.files = {
        [torrentId]: files.map(this.normalizeFile)
      };
      // this.bg.bgStore.client.setFileList(torrentId, files.map(this.normalizeFile));
    }

    const activeTorrentIds = this.bg.bgStore.client.activeTorrentIds;
    arrayDifferent(previousActiveTorrentIds, activeTorrentIds).forEach((torrentId) => {
      // not active anymore
      const torrent = this.bg.bgStore.client.torrents.get(torrentId);
      if (torrent) {
        this.bg.handleTorrentComplete(torrent);
      }
    });

    return result;
  };

  normalizeTorrent = (torrent) => {
    const id = torrent[0];
    const state = torrent[1];
    const name = torrent[2];
    const size = torrent[3];
    const progress = torrent[4];
    const downloaded = torrent[5];
    const uploaded = torrent[6];
    const shared = torrent[7];
    const uploadSpeed = torrent[8];
    const downloadSpeed = torrent[9];
    const eta = torrent[10];
    const label = torrent[11];
    const activePeers = torrent[12];
    const peers = torrent[13];
    const activeSeeds = torrent[14];
    const seeds = torrent[15];
    const available = torrent[16];
    const order = torrent[17];
    const status = torrent[21];
    const sid = torrent[22];
    const addedTime = torrent[23];
    const completedTime = torrent[24];
    const directory = torrent[26];

    return {
      id, state, name, size, progress,
      downloaded, uploaded, shared, uploadSpeed, downloadSpeed,
      eta, label, activePeers, peers, activeSeeds,
      seeds, available, order, status, sid,
      addedTime, completedTime, directory
    };
  };

  normalizeFile = (file) => {
    const name = file[0];
    const size = file[1];
    const downloaded = file[2];
    const priority = file[3];

    return {name, size, downloaded, priority};
  };

  normalizeLabel = (label) => {
    const name = label[0];

    return {name};
  };

  normalizeSettings = (settings) => {
    const result = {};
    settings.forEach(([key, type, value]) => {
      // type 0 - integer, 1 - bool, 2 - string
      if (key === 'max_dl_rate' || key === 'max_ul_rate') {
        result[key] = utSettingParse(type, value);
      }
    });
    return result;
  };

  destroy() {

  }
}

function utSettingParse(type, value) {
  switch (type) {
    case 0: {
      return parseInt(value, 10);
    }
    case 1: {
      return value === 'true';
    }
    case 2: {
      return value;
    }
  }
}

function arrayDifferent(prev, current) {
  return prev.filter(i => current.indexOf(i) === -1);
}

export default UTorrentClient;