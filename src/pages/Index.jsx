import "../assets/css/stylesheet.css";
import "../assets/css/jquery.contextMenu.css";
import "../assets/css/selectBox.css";
import React from "react";
import Menu from "../components/Menu";
import {inject, observer, Provider} from "mobx-react";
import PropTypes from "prop-types";
import ReactDOM from "react-dom";
import RootStore from "../stores/RootStore";
import TorrentListTable from "../components/TorrentListTable";
import FileListTable from "../components/FileListTable";

@inject('rootStore')
@observer
class Index extends React.Component {
  static propTypes = {
    rootStore: PropTypes.object,
  };

  constructor(props) {
    super(props);

    this.rootStore.init();
  }

  /**@return {RootStore}*/
  get rootStore() {
    return this.props.rootStore;
  }

  render() {
    if (this.rootStore.state === 'pending') {
      return `Loading: ${this.rootStore.state}`;
    }

    let fileList = null;
    if (this.rootStore.fileList) {
      fileList = (
        <FileListTable/>
      );
    }

    const {downloadSpeedStr, uploadSpeedStr} = this.rootStore.client.currentSpeedStr;

    return (
      <>
        <Menu/>
        <div className="drop_layer"/>
        <TorrentListTable/>
        <table className="status-panel" width="100%" border="0" cellSpacing="0" cellPadding="0">
          <tfoot>
          <tr>
            <td className="status">
              <div/>
            </td>
            <td className="space"/>
            <td className="speed download">{downloadSpeedStr}</td>
            <td className="speed upload">{uploadSpeedStr}</td>
          </tr>
          </tfoot>
        </table>
        <SetPopupHeight rootStore={this.rootStore}/>
        {fileList}
      </>
    );
  }
}

class SetPopupHeight extends React.PureComponent {
  static propTypes = {
    rootStore: PropTypes.object,
  };

  constructor(props) {
    super(props);

    if (this.rootStore.isPopup) {
      document.getElementById('root').style.minHeight = this.rootStore.config.popupHeight + 'px';
    }
  }

  /**@return {RootStore}*/
  get rootStore() {
    return this.props.rootStore;
  }

  render() {
    return (
      null
    );
  }
}

const rootStore = window.rootStore = RootStore.create();

ReactDOM.render(
  <Provider rootStore={rootStore}>
    <Index/>
  </Provider>,
  document.getElementById('root')
);