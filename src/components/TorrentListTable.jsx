import React from "react";
import {inject, observer} from "mobx-react";
import PropTypes from "prop-types";
import TableHeadColumn from "./TableHeadColumn";
import TorrentListTableItem from "./TorrentListTableItem";

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
        <TorrentListTableItem key={torrent.id} torrent={torrent}/>
      );
    });

    return (
      <tbody>
        {torrens}
      </tbody>
    );
  }
}

export default TorrentListTable;