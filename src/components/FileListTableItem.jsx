import {inject, observer} from "mobx-react";
import React from "react";
import PropTypes from "prop-types";
import {contextMenu} from "react-contexify";

@inject('rootStore')
@observer
class FileListTableItem extends React.Component {
  static propTypes = {
    file: PropTypes.object.isRequired,
    rootStore: PropTypes.object,
  };

  /**@return {RootStore}*/
  get rootStore() {
    return this.props.rootStore;
  }

  /**@return {FileListStore}*/
  get fileListStore() {
    return this.rootStore.fileList;
  }

  /**@return {FileStore}*/
  get fileStore() {
    return this.props.file;
  }

  handleSelect = (e) => {
    if (!this.fileStore.selected) {
      if (e.nativeEvent.shiftKey) {
        this.fileListStore.addMultipleSelectedId(this.fileStore.name);
      } else {
        this.fileListStore.addSelectedId(this.fileStore.name);
      }
    } else {
      this.fileListStore.removeSelectedId(this.fileStore.name);
    }
  };

  handleContextMenu = (e) => {
    e.preventDefault();

    let onHide = null;
    if (!this.fileStore.selected) {
      onHide = this.handleContextMenuHide;
      this.fileListStore.addSelectedId(this.fileStore.name);
    }

    contextMenu.show({
      id: 'file_menu',
      event: e,
      props: {
        onHide: onHide
      }
    });
  };

  handleContextMenuHide = () => {
    this.fileListStore.removeSelectedId(this.fileStore.name);
  };

  render() {
    const fileStore = this.fileStore;
    const visibleFileColumns = this.rootStore.config.visibleFileColumns;

    const columns = [];
    visibleFileColumns.forEach(({column: name}) => {
      switch (name) {
        case 'checkbox': {
          columns.push(
            <td key={name} className={name}>
              <input checked={fileStore.selected} onChange={this.handleSelect} type="checkbox"/>
            </td>
          );
          break;
        }
        case 'name': {
          columns.push(
            <td key={name} className={name}>
              <div>
                <span>{fileStore.name}</span>
              </div>
            </td>
          );
          break;
        }
        case 'size': {
          columns.push(
            <td key={name} className={name}>
              <div>{fileStore.sizeStr}</div>
            </td>
          );
          break;
        }
        case 'downloaded': {
          columns.push(
            <td key={name} className={name}>
              <div>{fileStore.downloadedStr}</div>
            </td>
          );
          break;
        }
        case 'done': {
          const backgroundColor = (fileStore.size === fileStore.downloaded && fileStore.priority !== 0) ? '#41B541' : '#3687ED';
          const width = fileStore.progressStr;

          columns.push(
            <td key={name} className={name}>
              <div className="progress_b">
                <div className="val">{fileStore.progressStr}</div>
                <div className="progress_b_i" style={{backgroundColor, width}}/>
              </div>
            </td>
          );
          break;
        }
        case 'prio': {
          columns.push(
            <td key={name} className={name}>
              <div>{fileStore.priorityStr}</div>
            </td>
          );
          break;
        }
      }
    });

    const classList = [];
    if (fileStore.selected) {
      classList.push('selected');
    }

    return (
      <tr onContextMenu={this.handleContextMenu} className={classList.join(' ')}>
        {columns}
      </tr>
    );
  }
}

export default FileListTableItem;