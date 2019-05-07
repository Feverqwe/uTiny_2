import "react-contexify/dist/ReactContexify.min.css";
import "../assets/css/stylesheet.less";
import "../assets/css/selectBox.css";
import React from "react";
import Menu from "../components/Menu";
import {inject, observer, Provider} from "mobx-react";
import PropTypes from "prop-types";
import ReactDOM from "react-dom";
import RootStore from "../stores/RootStore";
import TorrentListTable from "../components/TorrentListTable";
import FileListTable from "../components/FileListTable";
import Footer from "../components/Footer";
import PutFilesDialog from "../components/PutFilesDialog";
import CreateLabelDialog from "../components/CreateLabelDialog";

@inject('rootStore')
@observer
class Index extends React.Component {
  static propTypes = {
    rootStore: PropTypes.object,
  };

  constructor(props) {
    super(props);

    this.rootStore.init();

    if (this.rootStore.isPopup) {
      document.body.classList.add('popup');
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

    let fileList = null;
    if (this.rootStore.fileList) {
      fileList = (
        <FileListTable/>
      );
    }

    let setPopupHeight = null;
    if (this.rootStore.isPopup) {
      setPopupHeight = (
        <SetPopupHeight key={'h-' + this.rootStore.config.popupHeight} height={this.rootStore.config.popupHeight}/>
      );
    }

    return (
      <>
        <Menu/>
        <TorrentListTable/>
        <Footer/>
        {setPopupHeight}
        {fileList}
        {<Dialogs/>}
      </>
    );
  }
}

@inject('rootStore')
@observer
class Dialogs extends React.Component {
  static propTypes = {
    rootStore: PropTypes.object,
  };

  /**@return {RootStore}*/
  get rootStore() {
    return this.props.rootStore;
  }

  render() {
    const dialogs = Array.from(this.rootStore.dialogs.values()).map((dialog) => {
      switch (dialog.type) {
        case 'putFiles': {
          return (
            <PutFilesDialog key={dialog.id} dialogStore={dialog}/>
          );
        }
        case 'createLabel': {
          return (
            <CreateLabelDialog key={dialog.id} dialogStore={dialog}/>
          );
        }
      }
    });

    return (
      dialogs
    );
  }
}

class SetPopupHeight extends React.PureComponent {
  static propTypes = {
    height: PropTypes.number.isRequired
  };

  constructor(props) {
    super(props);

    document.getElementById('root').style.minHeight = this.props.height + 'px';
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