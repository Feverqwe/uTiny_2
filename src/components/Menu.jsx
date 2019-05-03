import React from "react";

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
        <li className="select"><select className="prepare"/></li>
      </ul>
    );
  }
}

export default Menu;