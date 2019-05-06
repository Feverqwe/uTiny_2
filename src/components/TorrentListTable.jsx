import React from "react";
import {inject, observer} from "mobx-react";
import PropTypes from "prop-types";
import TableHeadColumn from "./TableHeadColumn";

@observer
class TorrentListTable extends React.Component {
  handleScroll = (e) => {
    this.refFixedHead.current.style.left = `${e.currentTarget.scrollLeft * -1}px`;
  };

  refFixedHead = React.createRef();

  render() {
    return (
      <div onScroll={this.handleScroll} className="torrent-list-layer">
        <table ref={this.refFixedHead} className="torrent-table-head" border="0" cellSpacing="0" cellPadding="0">
          <TorrentListTableHead withStyle={true}/>
        </table>
        <table className="torrent-table-body" border="0" cellSpacing="0" cellPadding="0">
          <TorrentListTableHead/>
          <TorrentListTableTorrents/>
        </table>
      </div>
    );
  }
}

@inject('rootStore')
@observer
class TorrentListTableHead extends React.Component {
  static propTypes = {
    rootStore: PropTypes.object,
    withStyle: PropTypes.bool,
  };

  /**@return {RootStore}*/
  get rootStore() {
    return this.props.rootStore;
  }

  handleSort = (column, directoin) => {
    this.rootStore.config.setTorrentsSort(column, directoin);
  };

  handleMoveColumn = (from, to) => {
    this.rootStore.config.moveTorrensColumn(from, to);
  };

  handleSaveColumns = () => {
    this.rootStore.config.saveTorrentsColumns();
  };

  render() {
    const torrentsSort = this.rootStore.config.torrentsSort;
    const torrentColumns = this.rootStore.config.visibleTorrentColumns;
    const columns = [];
    torrentColumns.forEach((column) => {
      columns.push(
        <TorrentListTableHeadColumn key={column.column} column={column}
          isSorted={torrentsSort.by === column.column} sortDirection={torrentsSort.direction}
          onMoveColumn={this.handleMoveColumn}
          onSort={this.handleSort}
          onSaveColumns={this.handleSaveColumns}
          withStyle={this.props.withStyle}
        />
      );
    });

    return (
      <thead>
      <tr>
        {columns}
      </tr>
      </thead>
    );
  }
}

@observer
class TorrentListTableHeadColumn extends TableHeadColumn {
  type = 'tr';

  render() {
    const {column, isSorted, sortDirection} = this.props;
    const classList = [column.column];
    if (isSorted) {
      if (sortDirection === 1) {
        classList.push('sortDown');
      } else {
        classList.push('sortUp');
      }
    }

    let body = null;
    if (column.column === 'checkbox') {
      body = (
        <div>
          <input type="checkbox"/>
        </div>
      );
    } else {
      body = (
        <div>
          {chrome.i18n.getMessage(column.lang + '_SHORT') || chrome.i18n.getMessage(column.lang)}
        </div>
      );
    }

    let style = null;
    if (this.props.withStyle) {
      const styleText = `.torrent-list-layer th.${column.column}, .torrent-list-layer td.${column.column} {
        min-width: ${column.width}px;
        max-width: ${column.width}px;
      }`;
      style = (
        <style>{styleText}</style>
      );
    }

    let arraw = null;
    if (column.order !== 0) {
      arraw = (
        <i className="arrow"/>
      );
    }

    return (
      <th ref={this.refTh} onClick={this.handleSort} onDragStart={this.handleDragStart} onDragOver={this.handleDragOver} onDrop={this.handleDrop} className={classList.join(' ')} title={chrome.i18n.getMessage(column.lang)} draggable={true}>
        {body}
        <div className="resize-el" draggable={false} onClick={this.handleResizeClick} onMouseDown={this.handleResizeMouseDown}/>
        {arraw}
        {style}
      </th>
    );
  }
}

@inject('rootStore')
@observer
class TorrentListTableTorrents extends React.Component {
  static propTypes = {
    rootStore: PropTypes.object,
  };

  /**@return {RootStore}*/
  get rootStore() {
    return this.props.rootStore;
  }

  render() {
    const torrens = this.rootStore.client.sortedTorrents.map((torrent) => {
      return (
        <TorrentListTableTorrent key={torrent.id} torrent={torrent}/>
      );
    });

    return (
      <tbody>
        {torrens}
      </tbody>
    );
  }
}

@inject('rootStore')
@observer
class TorrentListTableTorrent extends React.Component {
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
                <a onClick={this.handleStart} title={chrome.i18n.getMessage('ML_START')} className="start" href="#start"/>
                <a onClick={this.handlePause} title={chrome.i18n.getMessage('ML_PAUSE')} className="pause" href="#pause"/>
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

export default TorrentListTable;