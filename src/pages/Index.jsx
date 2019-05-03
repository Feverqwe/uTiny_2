import "../assets/css/stylesheet.css";
import "../assets/css/jquery.contextMenu.css";
import "../assets/css/selectBox.css";
import React from "react";
import Menu from "../components/Menu";
import {inject, observer, Provider} from "mobx-react";
import PropTypes from "prop-types";
import ReactDOM from "react-dom";
import RootStore from "../stores/RootStore";
import TorrentTable from "../components/TorrentTable";
import FileTable from "../components/FileTable";

@inject('rootStore')
@observer
class Index extends React.Component {
  static propTypes = {
    rootStore: PropTypes.object,
  };

  constructor(props) {
    super(props);

    this.rootStore.init();

    if (!this.rootStore.isPopup) {
      document.body.parentNode.style.height = '100%';
      document.body.style.height = '100%';
    }
  }

  /**@return {RootStore}*/
  get rootStore() {
    return this.props.rootStore;
  }

  render() {
    if (this.rootStore.state === 'pending') {
      return `Loading: ${this.rootStore.state}`;
    }

    return (
      <>
        <Menu/>
        <div className="drop_layer"/>
        <TorrentTable/>
        <table className="status-panel" width="100%" border="0" cellSpacing="0" cellPadding="0">
          <tfoot>
          <tr>
            <td className="status">
              <div/>
            </td>
            <td className="space"/>
            <td className="speed download"/>
            <td className="speed upload"/>
          </tr>
          </tfoot>
        </table>
        <div className="file-list">
          <FileTable/>
          <ul className="bottom-menu">
            <li className="path"><input type="text" readOnly="readonly"/></li>
            <li className="btn"><a className="close" data-lang="DLG_BTN_CLOSE,title"/></li>
            <li className="btn"><a className="update" data-lang="refresh,title"/></li>
          </ul>
        </div>
      </>
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