import {inject, observer} from "mobx-react";
import React from "react";
import PropTypes from "prop-types";

@inject('rootStore')
@observer
class TorrentListTableItem extends React.Component {
  static propTypes = {
    torrent: PropTypes.object.isRequired,
    rootStore: PropTypes.object,
  };

  /**@return {RootStore}*/
  get rootStore() {
    return this.props.rootStore;
  }

  /**@return {TorrentStore}*/
  get torrentStore() {
    return this.props.torrent;
  }

  handleSelect = (e) => {
    // e.currentTarget
  };

  handleStart = (e) => {
    e.preventDefault();
    this.torrentStore.start();
  };

  handlePause = (e) => {
    e.preventDefault();
    this.torrentStore.pause();
  };

  handleStop = (e) => {
    e.preventDefault();
    this.torrentStore.stop();
  };

  handleDblClick = (e) => {
    e.preventDefault();
    this.rootStore.createFileList(this.torrentStore.id);
  };

  render() {
    const torrent = this.torrentStore;
    const visibleTorrentColumns = this.rootStore.config.visibleTorrentColumns;

    const columns = [];
    visibleTorrentColumns.forEach(({column: name}) => {
      switch (name) {
        case 'checkbox': {
          columns.push(
            <td key={name} className={name}>
              <input onChange={this.handleSelect} type="checkbox"/>
            </td>
          );
          break;
        }
        case 'name': {
          columns.push(
            <td key={name} className={name}>
              <div>
                <span>{torrent.name}</span>
              </div>
            </td>
          );
          break;
        }
        case 'order': {
          let value = torrent.order;
          if (value < 0) {
            value = '*';
          }

          columns.push(
            <td key={name} className={name}>
              <div>{value}</div>
            </td>
          );
          break;
        }
        case 'size': {
          columns.push(
            <td key={name} className={name}>
              <div title={torrent.sizeStr}>{torrent.sizeStr}</div>
            </td>
          );
          break;
        }
        case 'remaining': {
          columns.push(
            <td key={name} className={name}>
              <div>{torrent.remainingStr}</div>
            </td>
          );
          break;
        }
        case 'done': {
          const color = (torrent.status === 201 && torrent.progress === 1000) ? '#41B541' : '#3687ED';
          const width = torrent.progressStr;

          columns.push(
            <td key={name} className={name}>
              <div className="progress_b">
                <div className="val">{torrent.progressStr}</div>
                <div style={{color, width}} className="progress_b_i"/>
              </div>
            </td>
          );
          break;
        }
        case 'status': {
          columns.push(
            <td key={name} className={name}>
              <div title={torrent.stateText}>{torrent.stateText}</div>
            </td>
          );
          break;
        }
        case 'seeds': {
          columns.push(
            <td key={name} className={name}>
              <div>{torrent.seeds}</div>
            </td>
          );
          break;
        }
        case 'peers': {
          columns.push(
            <td key={name} className={name}>
              <div>{torrent.peers}</div>
            </td>
          );
          break;
        }
        case 'seeds_peers': {
          columns.push(
            <td key={name} className={name}>
              <div>{torrent.activePeers} / {torrent.activeSeeds}</div>
            </td>
          );
          break;
        }
        case 'downspd': {
          columns.push(
            <td key={name} className={name}>
              <div>{torrent.downloadSpeedStr}</div>
            </td>
          );
          break;
        }
        case 'upspd': {
          columns.push(
            <td key={name} className={name}>
              <div>{torrent.uploadSpeedStr}</div>
            </td>
          );
          break;
        }
        case 'eta': {
          columns.push(
            <td key={name} className={name}>
              <div title={torrent.etaStr}>{torrent.etaStr}</div>
            </td>
          );
          break;
        }
        case 'upped': {
          columns.push(
            <td key={name} className={name}>
              <div>{torrent.uploadedStr}</div>
            </td>
          );
          break;
        }
        case 'downloaded': {
          columns.push(
            <td key={name} className={name}>
              <div>{torrent.downloadedStr}</div>
            </td>
          );
          break;
        }
        case 'shared': {
          columns.push(
            <td key={name} className={name}>
              <div>{torrent.shared / 1000}</div>
            </td>
          );
          break;
        }
        case 'avail': {
          columns.push(
            <td key={name} className={name}>
              <div>{torrent.availableStr}</div>
            </td>
          );
          break;
        }
        case 'label': {
          columns.push(
            <td key={name} className={name}>
              <div title={torrent.label}>{torrent.label}</div>
            </td>
          );
          break;
        }
        case 'added': {
          columns.push(
            <td key={name} className={name}>
              <div title={torrent.addedTimeStr}>{torrent.addedTimeStr}</div>
            </td>
          );
          break;
        }
        case 'completed': {
          columns.push(
            <td key={name} className={name}>
              <div title={torrent.completedTimeStr}>{torrent.completedTimeStr}</div>
            </td>
          );
          break;
        }
        case 'actions': {
          columns.push(
            <td key={name} className={name}>
              <div className="btns">
                <a onClick={this.handleStart} title={chrome.i18n.getMessage('ML_START')} className="start"
                   href="#start"/>
                <a onClick={this.handlePause} title={chrome.i18n.getMessage('ML_PAUSE')} className="pause"
                   href="#pause"/>
                <a onClick={this.handleStop} title={chrome.i18n.getMessage('ML_STOP')} className="stop" href="#stop"/>
              </div>
            </td>
          );
          break;
        }
      }
    });

    return (
      <tr id={torrent.id} onDoubleClick={this.handleDblClick}>
        {columns}
      </tr>
    );
  }
}

export default TorrentListTableItem;