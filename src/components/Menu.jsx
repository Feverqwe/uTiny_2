import React from "react";
import {inject, observer} from "mobx-react";
import PropTypes from "prop-types";

@inject('rootStore')
@observer
class Menu extends React.Component {
  static propTypes = {
    rootStore: PropTypes.object,
  };

  state = {
    showDropLayer: false,
    isDropped: false
  };

  /**@return {RootStore}*/
  get rootStore() {
    return this.props.rootStore;
  }

  componentDidMount() {
    document.body.addEventListener('dragover', this.handleDropOver);
    document.body.addEventListener('drop', this.handleDrop);
  }

  componentWillUnmount() {
    document.body.removeEventListener('dragover', this.handleDropOver);
    document.body.removeEventListener('drop', this.handleDrop);
  }


  dropTimerId = null;

  handleDropOver = (e) => {
    if (['tr', 'fl'].indexOf(e.dataTransfer.types) !== -1) return;
    e.preventDefault();

    if (!this.state.showDropLayer) {
      this.setState({
        showDropLayer: true
      });
    }

    clearTimeout(this.dropTimerId);
    this.dropTimerId = setTimeout(() => {
      if (!this.refFileInput.current) return;
      this.setState({
        showDropLayer: false,
        isDropped: false
      });
    }, 300);
  };

  handleDrop = (e) => {
    e.preventDefault();
    this.setState({
      isDropped: true
    });
    this.onPutFiles(e.dataTransfer.files);
  };

  handleRefresh = (e) => {
    e.preventDefault();
    this.rootStore.client.syncUiClient();
  };

  handleAddFile = (e) => {
    e.preventDefault();
    this.refFileInput.current.dispatchEvent(new MouseEvent('click'));
  };

  handleAddUrl = (e) => {
    e.preventDefault();
    this.rootStore.createDialog({
      type: 'putUrl'
    });
  };

  handleStartAll = (e) => {
    e.preventDefault();
    const ids = this.rootStore.client.pausedTorrentIds;
    this.rootStore.client.torrentsUnpause(ids);
  };

  handlePauseAll = (e) => {
    e.preventDefault();
    const ids = this.rootStore.client.downloadingTorrentIds;
    this.rootStore.client.torrentsPause(ids);
  };

  refFileInput = React.createRef();

  onPutFiles(files) {
    if (!files.length) return;

    const dialog = this.rootStore.createDialog({
      type: 'putFiles'
    });

    dialog.files = Array.from(files);
  }

  handleFileChange = (e) => {
    this.onPutFiles(this.refFileInput.current.files);
    e.currentTarget.value = '';
  };

  render() {
    let dropLayer = null;
    if (this.state.showDropLayer){
      const classList = ['drop_layer'];
      if (this.state.isDropped) {
        classList.push('dropped');
      }
      dropLayer = (
        <div className={classList.join(' ')}/>
      );
    }

    return (
      <>
        <ul className="menu">
          <li>
            <a onClick={this.handleRefresh} title={chrome.i18n.getMessage('refresh')} className="btn refresh"
               target="_blank" href="#refresh"/>
          </li>
          <li>
            <a href={this.rootStore.config.webUiUrl} target="_blank" title={chrome.i18n.getMessage('ST_CAPT_WEBUI')}
               className="btn wui"/>
          </li>
          <li className="separate"/>
          <li>
            <a onClick={this.handleAddFile} title={chrome.i18n.getMessage('Open_file')} className="btn add_file"
               href="#add_file"/>
            <input ref={this.refFileInput} onChange={this.handleFileChange} type="file"
                   accept="application/x-bittorrent" multiple={true} style={{display: 'none'}}/>
          </li>
          <li>
            <a onClick={this.handleAddUrl} title={chrome.i18n.getMessage('MM_FILE_ADD_URL')}
               className="btn add_magnet" href="#add_magnet"/>
          </li>
          <li className="separate"/>
          <li>
            <a onClick={this.handleStartAll} title={chrome.i18n.getMessage('STM_TORRENTS_RESUMEALL')}
               className="btn start_all" href="#start_all"/>
          </li>
          <li>
            <a onClick={this.handlePauseAll} title={chrome.i18n.getMessage('STM_TORRENTS_PAUSEALL')}
               className="btn pause_all" href="#pause_all"/>
          </li>
          <li className="graph"/>
          <LabelSelect/>
        </ul>

        {dropLayer}
      </>
    );
  }
}

@inject('rootStore')
@observer
class LabelSelect extends React.Component {
  static propTypes = {
    rootStore: PropTypes.object,
  };

  /**@return {RootStore}*/
  get rootStore() {
    return this.props.rootStore;
  }

  render() {
    const selectedLabel = this.rootStore.config.selectedLabel;

    const options = this.rootStore.config.allLabels.map((label) => {
      let text = null;
      const name = label.label;
      const custom = label.custom;
      if (custom) {
        if (name === 'SEEDING') {
          text = chrome.i18n.getMessage('OV_FL_' + name.toUpperCase());
        } else {
          text = chrome.i18n.getMessage('OV_CAT_' + name.toUpperCase());
        }
      } else {
        text = name;
      }

      let dataType = null;
      let dataImage = null;
      if (custom) {
        dataType = 'custom';
        if (name !== 'NOLABEL') {
          dataImage = name;
        }
      }

      return (
        <option key={`${name}_${custom}`} value={`${!!custom}_${name}`} data-type={dataType} data-image={dataImage}>{text}</option>
      );
    });

    const selectedValue = `${!!selectedLabel.custom}_${selectedLabel.label}`;

    return (
      <li className="select">
        <select defaultValue={selectedValue}>
          {options}
        </select>
      </li>
    );
  }
}

export default Menu;