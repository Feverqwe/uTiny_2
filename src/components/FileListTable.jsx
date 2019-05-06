import React from "react";
import {inject, observer} from "mobx-react";
import TableHeadColumn from "./TableHeadColumn";
import PropTypes from "prop-types";
import FileListTableItem from "./FileListTableItem";
import FileMenu from "./FileMenu";

@inject('rootStore')
@observer
class FileListTable extends React.Component {
  handleScroll = (e) => {
    // todo: fix me
    // this.refFixedHead.current.style.left = `${e.currentTarget.scrollLeft * -1}px`;
  };

  /**@return {RootStore}*/
  get rootStore() {
    return this.props.rootStore;
  }

  /**@return {FileListStore}*/
  get fileListStore() {
    return this.rootStore.fileList;
  }

  refFixedHead = React.createRef();

  handleClose = (e) => {
    e.preventDefault();
    this.rootStore.destroyFileList();
  };

  stopPropagation = (e) => {
    e.stopPropagation();
  };

  render() {
    const torrent = this.fileListStore.torrent;

    let spinner = null;
    if (this.fileListStore.isLoading) {
      spinner = (
        <div className="file-list-loading"/>
      );
    }

    let directory = null;
    if (torrent) {
      directory = torrent.directory;
    }

    return (
      <>
        <div onClick={this.handleClose} className="file-list-warpper">
          <div onClick={this.stopPropagation} className="file-list">
            <div onScroll={this.handleScroll} className="fl-layer">
              {spinner}
              <table ref={this.refFixedHead} className="fl-table-head" border="0" cellSpacing="0" cellPadding="0">
                <FileListTableHead withStyle={true}/>
              </table>
              <table className="fl-table-body" border="0" cellSpacing="0" cellPadding="0">
                <FileListTableHead/>
                <FileListTableFiles/>
              </table>
            </div>
            <ul className="bottom-menu">
              <li className="path">
                <input type="text" value={directory} readOnly="readonly"/>
              </li>
              <li className="btn">
                <a onClick={this.handleClose} className="close" title={chrome.i18n.getMessage('DLG_BTN_CLOSE')}/>
              </li>
              <li className="btn">
                <a className="update" title={chrome.i18n.getMessage('refresh')}/>
              </li>
            </ul>
          </div>
        </div>
      </>
    );
  }
}

@inject('rootStore')
@observer
class FileListTableHead extends React.Component {
  static propTypes = {
    rootStore: PropTypes.object,
    withStyle: PropTypes.bool,
  };

  /**@return {RootStore}*/
  get rootStore() {
    return this.props.rootStore;
  }

  handleSort = (column, directoin) => {
    this.rootStore.config.setFilesSort(column, directoin);
  };

  handleMoveColumn = (from, to) => {
    this.rootStore.config.moveFilesColumn(from, to);
  };

  handleSaveColumns = () => {
    this.rootStore.config.saveFilesColumns();
  };

  render() {
    const sort = this.rootStore.config.filesSort;
    const fileColumns = this.rootStore.config.visibleFileColumns;
    const columns = [];
    fileColumns.forEach((column, index) => {
      if (!column.display) return;

      columns.push(
        <FileListTableHeadColumn key={column.column} column={column}
          isSorted={sort.by === column.column} sortDirection={sort.direction}
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

@inject('rootStore')
@observer
class FileListTableHeadColumn extends TableHeadColumn {
  type = 'fl';

  /**@return {RootStore}*/
  get rootStore() {
    return this.props.rootStore;
  }

  /**@return {FileListStore}*/
  get fileListStore() {
    return this.rootStore.fileList;
  }

  handleSelectAll = (e) => {
    this.fileListStore.toggleSelectAll();
  };

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
          <input checked={this.fileListStore.isSelectedAll} onChange={this.handleSelectAll} type="checkbox"/>
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
      const styleText = `.fl-layer th.${column.column}, .fl-layer td.${column.column} {
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
class FileListTableFiles extends React.Component {
  static propTypes = {
    rootStore: PropTypes.object,
  };

  /**@return {RootStore}*/
  get rootStore() {
    return this.props.rootStore;
  }

  render() {
    const files = this.rootStore.fileList.sortedFiles.map((file) => {
      return (
        <FileListTableItem key={file.name} file={file}/>
      );
    });

    return (
      <tbody>
      {files}
      <FileMenu/>
      </tbody>
    );
  }
}

export default FileListTable;