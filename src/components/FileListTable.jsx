import React from "react";
import {inject, observer} from "mobx-react";
import TableHeadColumn from "./TableHeadColumn";
import PropTypes from "prop-types";

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
                <FileListTableHead/>
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
class FileListTableHeadColumn extends TableHeadColumn {
  type = 'fl';

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

    const styleText = `.fl-layer th.${column.column}, .fl-layer td.${column.column} {
      min-width: ${column.width}px;
      max-width: ${column.width}px;
    }`;

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
        <style>{styleText}</style>
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
    const torrens = this.rootStore.fileList.sortedFiles.map((file) => {
      return (
        <FileListTableFile key={file.name} file={file}/>
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
class FileListTableFile extends React.Component {
  static propTypes = {
    file: PropTypes.object.isRequired,
    rootStore: PropTypes.object,
  };

  /**@return {RootStore}*/
  get rootStore() {
    return this.props.rootStore;
  }

  /**@return {FileStore}*/
  get fileStore() {
    return this.props.file;
  }

  handleSelect = (e) => {
    // e.currentTarget
  };

  render() {
    const file = this.fileStore;
    const visibleFileColumns = this.rootStore.config.visibleFileColumns;

    const columns = [];
    visibleFileColumns.forEach(({column: name}) => {
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
                <span>{file.name}</span>
              </div>
            </td>
          );
          break;
        }
        case 'size': {
          columns.push(
            <td key={name} className={name}>
              <div>{file.sizeStr}</div>
            </td>
          );
          break;
        }
        case 'downloaded': {
          columns.push(
            <td key={name} className={name}>
              <div>{file.downloadedStr}</div>
            </td>
          );
          break;
        }
        case 'done': {
          const backgroundColor = (file.size === file.downloaded && file.priority !== 0) ? '#41B541' : '#3687ED';
          const width = file.progressStr;

          columns.push(
            <td key={name} className={name}>
              <div className="progress_b">
                <div className="val">{file.progressStr}</div>
                <div className="progress_b_i" style={{backgroundColor, width}}/>
              </div>
            </td>
          );
          break;
        }
        case 'prio': {
          columns.push(
            <td key={name} className={name}>
              <div>{file.priorityStr}</div>
            </td>
          );
          break;
        }
      }
    });

    return (
      <tr>
        {columns}
      </tr>
    );
  }
}

export default FileListTable;