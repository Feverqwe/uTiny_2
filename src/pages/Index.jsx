import "../assets/css/stylesheet.css";
import "../assets/css/jquery.contextMenu.css";
import "../assets/css/selectBox.css";
import React from "react";
import Menu from "../components/Menu";
import {inject, observer, Provider} from "mobx-react";
import PropTypes from "prop-types";
import ReactDOM from "react-dom";
import RootStore from "../stores/RootStore";

@inject('rootStore')
@observer
class Index extends React.Component {
  static propTypes = {
    rootStore: PropTypes.object,
  };

  /**@return {RootStore}*/
  get rootStore() {
    return this.props.rootStore;
  }

  componentDidMount() {
    if (this.rootStore.configState === 'idle') {
      this.rootStore.fetchConfig();
    }
  }

  render() {
    return (
      <>
        <Menu/>
        <div className="drop_layer"/>
        <div className="torrent-list-layer">
          <table className="torrent-table-head" border="0" cellSpacing="0" cellPadding="0">
            <thead/>
          </table>
          <table className="torrent-table-body" border="0" cellSpacing="0" cellPadding="0">
            <thead/>
            <tbody/>
          </table>
        </div>
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
          <div className="fl-layer">
            <table className="fl-table-head" border="0" cellSpacing="0" cellPadding="0">
              <thead/>
            </table>
            <table className="fl-table-body" border="0" cellSpacing="0" cellPadding="0">
              <thead/>
              <tbody/>
            </table>
          </div>
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