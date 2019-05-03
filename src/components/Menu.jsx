import React from "react";
import {inject, observer} from "mobx-react";
import PropTypes from "prop-types";

class Menu extends React.Component {
  handleRefresh = (e) => {
    e.preventDefault();
  };

  handleOpenWebUi = (e) => {
    e.preventDefault();
  };

  handleAddFile = (e) => {
    e.preventDefault();
  };

  handleAddUrl = (e) => {
    e.preventDefault();
  };

  handleStartAll = (e) => {
    e.preventDefault();
  };

  handlePauseAll = (e) => {
    e.preventDefault();
  };

  render() {
    return (
      <ul className="menu">
        <li>
          <a onClick={this.handleRefresh} title={chrome.i18n.getMessage('refresh')} className="btn refresh"
             target="_blank" href="#refresh"/>
        </li>
        <li>
          <a onClick={this.handleOpenWebUi} title={chrome.i18n.getMessage('ST_CAPT_WEBUI')} className="btn wui"
             target="_blank" href="#wui"/>
        </li>
        <li className="separate"/>
        <li>
          <a onClick={this.handleAddFile} title={chrome.i18n.getMessage('Open_file')} className="btn add_file"
             href="#add_file"/>
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