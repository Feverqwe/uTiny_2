import "../assets/css/options.less";
import "../assets/css/bootstrap-colorpicker.css";
import React from "react";
import RootStore from "../stores/RootStore";
import ReactDOM from "react-dom";
import {inject, observer, Provider} from "mobx-react";
import {HashRouter, Switch, Route, Redirect, NavLink} from "react-router-dom";
import PropTypes from "prop-types";
import {SketchPicker} from "react-color";
import Popover from "react-tiny-popover";

@inject('rootStore')
@observer
class Options extends React.Component {
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
      return (
        <div className="loading"/>
      );
    }

    if (this.rootStore.state !== 'done') {
      return `Loading: ${this.rootStore.state}`;
    }

    return (
      <div className="container">
        <div className="search_panel">
          <h1>uTorrent easy client</h1>
        </div>
        <HashRouter>
          <div className="content">
            <div className="left menu">
              <NavLink to="/" exact={true} activeClassName="active">{chrome.i18n.getMessage('optClient')}</NavLink>
              <NavLink to="/main" activeClassName="active">{chrome.i18n.getMessage('optMain')}</NavLink>
              <NavLink to="/notify" activeClassName="active">{chrome.i18n.getMessage('optNotify')}</NavLink>
              <NavLink to="/ctx" activeClassName="active">{chrome.i18n.getMessage('optCtx')}</NavLink>
              <NavLink to="/backup" activeClassName="active">{chrome.i18n.getMessage('backup')}</NavLink>
              <NavLink to="/restore" activeClassName="active">{chrome.i18n.getMessage('restore')}</NavLink>
            </div>
            <div className="right">
              <Switch>
                <Route path="/" exact={true} component={ClientOptions}/>
                <Route path="/main" exact={true} component={UiOptions}/>
                <Route path="/notify" exact={true} component={NotifyOptions}/>
                <Route path="/ctx" exact={true} component={CtxOptions}/>
                <Route path="/backup" exact={true} component={BackupOptions}/>
                <Route path="/restore" exact={true} component={RestoreOptions}/>
                <Route component={NotFound}/>
              </Switch>
            </div>
          </div>
        </HashRouter>
        <div className="bottom">
          <div className="author"><a title="email: leonardspbox@gmail.com"
                                     href="mailto:leonardspbox@gmail.com">Anton</a>, 2015
          </div>
        </div>
      </div>
    );
  }
}

@inject('rootStore')
@observer
class ClientOptions extends React.Component {
  static propTypes = {
    rootStore: PropTypes.object,
  };

  state = {
    clientStatus: null, // pending, done, error
    clientStatusText: '',
  };

  /**@return {RootStore}*/
  get rootStore() {
    return this.props.rootStore;
  }

  /**@return {ConfigStore}*/
  get configStore() {
    return this.props.rootStore.config;
  }

  handleSubmit = (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    const login = form.elements.login.value;
    const password = form.elements.password.value;
    const hostname = form.elements.hostname.value;
    const port = parseInt(form.elements.port.value, 10);
    const ssl = form.elements.ssl.checked;
    const pathname = form.elements.pathname.value;

    this.setState({
      clientStatus: 'pending'
    });
    return Promise.resolve().then(() => {
      if (!Number.isFinite(port)) {
        throw new Error('Port is incorrect');
      }
      return this.rootStore.config.setOptions({
        login, password, hostname, port, ssl, pathname
      });
    }).then((() => {
      if (!this.refPage.current) return;
      return this.rootStore.client.getSettings();
    })).then(() => {
      if (!this.refPage.current) return;
      this.setState({
        clientStatus: 'done'
      });
    }, (err) => {
      if (!this.refPage.current) return;
      this.setState({
        clientStatus: 'error',
        clientStatusText: `${err.name}: ${err.message}`
      });
    });
  };

  refPage = React.createRef();

  render() {
    let status = null;
    if (this.state.clientStatus) {
      switch (this.state.clientStatus) {
        case 'pending': {
          status = (
            <div>
              <img alt="" src="../assets/img/loading.gif"/>
            </div>
          );
          break;
        }
        case 'done': {
          status = (
            <div>
              <span className="green">{chrome.i18n.getMessage('DLG_BTN_OK')}</span>
            </div>
          );
          break;
        }
        case 'error': {
          status = (
            <div>
              <span className="red">{this.state.clientStatusText}</span>
            </div>
          );
          break;
        }
      }
    }

    return (
      <div ref={this.refPage} className="page client">
        <form onSubmit={this.handleSubmit}>
          <h2>{chrome.i18n.getMessage('optClient')}</h2>
          <label>
            <span>{chrome.i18n.getMessage('DLG_SETTINGS_4_CONN_16')}</span>
            <input name="login" type="text" defaultValue={this.configStore.login}/>
          </label>
          <label>
            <span>{chrome.i18n.getMessage('DLG_SETTINGS_4_CONN_18')}</span>
            <input name="password" type="password" defaultValue={this.configStore.password}/>
          </label>
          <label>
            <span>{chrome.i18n.getMessage('PRS_COL_IP')}</span>
            <input name="hostname" type="text" defaultValue={this.configStore.hostname} placeholder="127.0.0.1"/>
          </label>
          <label>
            <span>{chrome.i18n.getMessage('PRS_COL_PORT')}</span>
            <input name="port" type="number" defaultValue={this.configStore.port}/>
          </label>
          <h3>{chrome.i18n.getMessage('ST_CAPT_ADVANCED')}</h3>
          <label>
            <span>{chrome.i18n.getMessage('useSSL')}</span>
            <input type="checkbox" name="ssl" defaultValue={this.configStore.ssl}/>
          </label>
          <label>
            <span>{chrome.i18n.getMessage('path')}</span>
            <input type="text" name="pathname" defaultValue={this.configStore.pathname}/>
          </label>
          <div id="checkContainer">
            <div>
              <button type="submit">{chrome.i18n.getMessage('DLG_BTN_APPLY')}</button>
            </div>
            {status}
          </div>
          <ClientOptionsHelp/>
        </form>
      </div>
    );
  }
}

class ClientOptionsHelp extends React.Component {
  render() {
    let url = null;
    switch (chrome.i18n.getMessage('lang')) {
      case 'fr': {
        url = require('../assets/img/help_how_to_fr.png');
        break;
      }
      case 'ru': {
        url = require('../assets/img/help_how_to_ru.png');
        break;
      }
      default: {
        url = require('../assets/img/help_how_to_en.png');
      }
    }

    return (
      <>
        <h2>{chrome.i18n.getMessage('help')}</h2>
        <ol className="help">
          <li>{chrome.i18n.getMessage('helpS1')}</li>
          <li>{chrome.i18n.getMessage('helpS2')}</li>
          <li>{chrome.i18n.getMessage('helpS3')}</li>
          <li>{chrome.i18n.getMessage('helpS4')}</li>
          <li>{chrome.i18n.getMessage('helpS5')}</li>
          <li>{chrome.i18n.getMessage('helpS6')}</li>
          <li>{chrome.i18n.getMessage('helpS7')}</li>
        </ol>
        <p className="helpImgContainer">
          <img alt="" src={url}/>
        </p>
      </>
    );
  }
}

class OptionsPage extends React.Component {
  static propTypes = {
    rootStore: PropTypes.object,
  };

  /**@return {RootStore}*/
  get rootStore() {
    return this.props.rootStore;
  }

  /**@return {ConfigStore}*/
  get configStore() {
    return this.props.rootStore.config;
  }

  handleChange = (e) => {
    const checkbox = e.currentTarget;
    this.configStore.setOptions({
      [checkbox.name]: checkbox.checked
    });
  };

  handleSetInt = (e) => {
    const input = e.currentTarget;
    const value = parseInt(input.value, 10);
    if (Number.isFinite(value)) {
      this.configStore.setOptions({
        [input.name]: value
      });
    }
  };
}

@inject('rootStore')
@observer
class UiOptions extends OptionsPage {
  render() {
    return (
      <div className="page main">
        <h2>{chrome.i18n.getMessage('optMain')}</h2>
        <label>
          <span>{chrome.i18n.getMessage('showFreeSpace')}</span>
          <input onChange={this.handleChange} name="showFreeSpace" type="checkbox" defaultChecked={this.configStore.showFreeSpace}/>
        </label>
        <label>
          <span>{chrome.i18n.getMessage('hideSeedStatusItem')}</span>
          <input onChange={this.handleChange} name="hideSeedingTorrents" type="checkbox" defaultChecked={this.configStore.hideSeedingTorrents}/>
        </label>
        <label>
          <span>{chrome.i18n.getMessage('hideFnishStatusItem')}</span>
          <input onChange={this.handleChange} name="hideFinishedTorrents" type="checkbox" defaultChecked={this.configStore.hideFinishedTorrents}/>
        </label>
        <label>
          <span>{chrome.i18n.getMessage('showSpeedGraph')}</span>
          <input onChange={this.handleChange} name="showSpeedGraph" type="checkbox" defaultChecked={this.configStore.showSpeedGraph}/>
        </label>
        <label>
          <span>{chrome.i18n.getMessage('popupHeight')}</span>
          <input onChange={this.handleSetInt} name="popupHeight" type="number" min="0" defaultValue={this.configStore.popupHeight}/>
          {' '}
          <span>{chrome.i18n.getMessage('px')}</span>
        </label>
        <label>
          <span>{chrome.i18n.getMessage('popupUpdateInterval')}</span>
          <input onChange={this.handleSetInt} name="uiUpdateInterval" type="number" min="100" defaultValue={this.configStore.uiUpdateInterval}/>
          {' '}
          <span>{chrome.i18n.getMessage('ms')}</span>
        </label>
        <div className="cirilicFixs">
          <h3>{chrome.i18n.getMessage('fixCirilicIf')}</h3>
          <label>
            <span>{chrome.i18n.getMessage('fixCirilicTitle')}</span>
            <input onChange={this.handleChange} name="fixCyrillicTorrentName" type="checkbox" defaultChecked={this.configStore.fixCyrillicTorrentName}/>
          </label>
          <label>
            <span>{chrome.i18n.getMessage('fixCirilicTorrentPath')}</span>
            <input onChange={this.handleChange} name="fixCyrillicDownloadPath" type="checkbox" defaultChecked={this.configStore.fixCyrillicDownloadPath}/>
          </label>
        </div>
      </div>
    );
  }
}

@inject('rootStore')
@observer
class NotifyOptions extends OptionsPage {
  state = {
    colorPickerOpened: false
  };

  handleToggleColorPicker = (e) => {
    e.preventDefault();
    this.setState({
      colorPickerOpened: !this.state.colorPickerOpened
    });
  };

  handleChangeColor = (color) => {
    const rgba = [color.rgb.r, color.rgb.g, color.rgb.b, color.rgb.a].join(',');
    this.configStore.setOptions({
      badgeColor: rgba
    });
  };

  render() {
    const [r,g,b,a] = this.configStore.badgeColor.split(',');
    const sketchPickerColor = {
      r: parseInt(r, 10),
      g: parseInt(g, 10),
      b: parseInt(b, 10),
      a: parseFloat(a),
    };

    return (
      <div className="page notify">
        <h2>{chrome.i18n.getMessage('optNotify')}</h2>
        <label>
          <span>{chrome.i18n.getMessage('showNotificationOnDownloadCompleate')}</span>
          <input defaultChecked={this.configStore.showDownloadCompleteNotifications} onChange={this.handleChange} type="checkbox" name="showDownloadCompleteNotifications"/>
        </label>
        <label>
          <span>{chrome.i18n.getMessage('displayActiveTorrentCountIcon')}</span>
          <input defaultChecked={this.configStore.showActiveCountBadge} onChange={this.handleChange} type="checkbox" name="showActiveCountBadge"/>
        </label>
        <label>
          <span>{chrome.i18n.getMessage('badgeColor')}</span>
          <Popover
            isOpen={this.state.colorPickerOpened}
            onClickOutside={this.handleToggleColorPicker}
            position={'bottom'}
            content={(
              <SketchPicker color={sketchPickerColor} onChangeComplete={this.handleChangeColor}/>
            )}
          >
            <span onClick={this.handleToggleColorPicker} className="selectColor" style={{backgroundColor: `rgba(${this.configStore.badgeColor})`}}/>
          </Popover>
        </label>
        <label>
          <span>{chrome.i18n.getMessage('backgroundUpdateInterval')}</span>
          <input defaultValue={this.configStore.backgroundUpdateInterval} onChange={this.handleSetInt} type="number" name="backgroundUpdateInterval" min="1000"/>
          {' '}
          <span>{chrome.i18n.getMessage('ms')}</span>
        </label>
      </div>
    );
  }
}

class CtxOptions extends React.Component {
  render() {
    return (
      <div className="page ctx">
        CtxOptions
      </div>
    );
  }
}

class BackupOptions extends React.Component {
  render() {
    return (
      <div className="page backup">
        BackupOptions
      </div>
    );
  }
}

class RestoreOptions extends React.Component {
  render() {
    return (
      <div className="page restore">
        RestoreOptions
      </div>
    );
  }
}

class NotFound extends React.Component {
  render() {
    return (
      <Redirect to={"/"}/>
    );
  }
}

const rootStore = window.rootStore = RootStore.create();

ReactDOM.render(
  <Provider rootStore={rootStore}>
    <Options/>
  </Provider>,
  document.getElementById('root')
);