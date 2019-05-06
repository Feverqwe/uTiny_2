import {inject, observer} from "mobx-react";
import React from "react";
import PropTypes from "prop-types";

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

export default FileListTableItem;