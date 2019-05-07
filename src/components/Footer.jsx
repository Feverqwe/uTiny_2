import React from "react";
import {inject, observer} from "mobx-react";
import PropTypes from "prop-types";
import {contextMenu} from "react-contexify";
import SpeedMenu from "./SpeedMenu";

@inject('rootStore')
@observer
class Footer extends React.Component {
  static propTypes = {
    rootStore: PropTypes.object,
  };

  /**@return {RootStore}*/
  get rootStore() {
    return this.props.rootStore;
  }

  handleDownloadContextMenu = (e) => {
    e.preventDefault();

    contextMenu.show({
      id: 'speed_menu',
      event: e,
      props: {
        type: 'download'
      }
    });
  };

  handleUploadContextMenu = (e) => {
    e.preventDefault();

    contextMenu.show({
      id: 'speed_menu',
      event: e,
      props: {
        type: 'upload'
      }
    });
  };

  handleResetDownloadSpeed = (e) => {
    e.preventDefault();

    this.rootStore.client.setDownloadSpeedLimit(0);
  };

  handleResetUploadSpeed = (e) => {
    e.preventDefault();

    this.rootStore.client.setUploadSpeedLimit(0);
  };

  render() {
    const {downloadSpeedStr, uploadSpeedStr} = this.rootStore.client.currentSpeedStr;

    let downloadLimit = null;
    let uploadLimit = null;
    const settings = this.rootStore.client.settings;
    if (settings) {
      if (settings.downloadSpeedLimit) {
        downloadLimit = (
          <span onClick={this.handleResetDownloadSpeed} className="limit dl">{settings.downloadSpeedLimitStr}</span>
        );
      }
      if (settings.uploadSpeedLimit) {
        uploadLimit = (
          <span onClick={this.handleResetUploadSpeed} className="limit up">{settings.uploadSpeedLimitStr}</span>
        );
      }
    }

    return (
      <table className="status-panel" width="100%" border="0" cellSpacing="0" cellPadding="0">
        <tfoot>
        <tr>
          <td className="status">
            <div/>
          </td>
          <td className="space"/>
          <td onContextMenu={this.handleDownloadContextMenu} className="speed download">{downloadSpeedStr}{downloadLimit}</td>
          <td onContextMenu={this.handleUploadContextMenu} className="speed upload">{uploadSpeedStr}{uploadLimit}</td>
          <SpeedMenu/>
        </tr>
        </tfoot>
      </table>
    );
  }
}

export default Footer;