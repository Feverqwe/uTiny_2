import React from "react";
import {Item, Menu, Separator, Submenu} from "react-contexify";
import {inject, observer} from "mobx-react";
import PropTypes from "prop-types";
import ContextMenuBody from "./ContextMenuBody";

const torrentMenuItems = [
  'start', 'forcestart', 'pause', 'unpause',
  'stop', '_', 'recheck', 'remove',
  'remove_with', '_', 'order', 'torrent_files', 'labels'
];

const TorrentMenu = React.memo(() => {
  return (
    <Menu id="torrent_menu">
      <TorrentMenuBody/>
    </Menu>
  )
});

@inject('rootStore')
@observer
class TorrentMenuBody extends ContextMenuBody {
  /**@return {RootStore}*/
  get rootStore() {
    return this.props.rootStore;
  }

  /**@return {TorrentListStore}*/
  get torrentListStore() {
    return this.rootStore.torrentList;
  }

  handleStart = ({event: e, props}) => {
    this.rootStore.client.torrentsStart(this.torrentListStore.selectedIds);
  };

  handleForceStart = ({event: e, props}) => {
    this.rootStore.client.torrentsForceStart(this.torrentListStore.selectedIds);
  };

  handlePause = ({event: e, props}) => {
    this.rootStore.client.torrentsPause(this.torrentListStore.selectedIds);
  };

  handleUnpause = ({event: e, props}) => {
    this.rootStore.client.torrentsUnpause(this.torrentListStore.selectedIds);
  };

  handleStop = ({event: e, props}) => {
    this.rootStore.client.torrentsStop(this.torrentListStore.selectedIds);
  };

  handleRecheck = ({event: e, props}) => {
    this.rootStore.client.torrentsRecheck(this.torrentListStore.selectedIds);
  };

  handleRemove = ({event: e, props}) => {
    this.rootStore.client.torrentsRemove(this.torrentListStore.selectedIds);
  };

  handleRemoveTorrent = ({event: e, props}) => {
    this.rootStore.client.torrentsRemoveTorrent(this.torrentListStore.selectedIds);
  };

  handleRemoveFiles = ({event: e, props}) => {
    this.rootStore.client.torrentsRemoveFiles(this.torrentListStore.selectedIds);
  };

  handleRemoveTorrentFiles = ({event: e, props}) => {
    this.rootStore.client.torrentsRemoveTorrentFiles(this.torrentListStore.selectedIds);
  };

  handleQueueUp = ({event: e, props}) => {
    this.rootStore.client.torrentsQueueUp(this.torrentListStore.selectedIds);
  };

  handleQueueDown = ({event: e, props}) => {
    this.rootStore.client.torrentsQueueDown(this.torrentListStore.selectedIds);
  };

  handleShowFiles = ({event: e, props}) => {
    if (selectedIds.length) {
      const id = selectedIds[0];
      this.rootStore.createFileList({id});
    }
  };

  handleCreateLabel = ({event: e, props}) => {
    // todo: create label dialog
    return;
    this.rootStore.client.torrentsSetLabel(this.torrentListStore.selectedIds, label);
  };

  handleRemoveLabel = ({event: e, props}) => {
    this.rootStore.client.torrentsSetLabel(this.torrentListStore.selectedIds, '');
  };

  handleSetLabel = ({event: e, props, label}) => {
    this.rootStore.client.torrentsSetLabel(this.torrentListStore.selectedIds, label);
  };

  render() {
    const selectedIds = this.torrentListStore.selectedIds;
    if (!selectedIds.length) {
      return null;
    }

    const disabledActions = [];
    if (selectedIds.length > 1) {
      disabledActions.push('torrent_files');
    }

    const actions = ['_', 'remove', 'remove_with', 'order', 'torrent_files', 'labels'];
    selectedIds.forEach((id) => {
      const torrent = this.rootStore.client.torrents.get(id);
      if (torrent) {
        torrent.actions.forEach((action) => {
          if (actions.indexOf(action) === -1) {
            actions.push(action);
          }
        });
      }
    });

    const firstTorrentId = selectedIds[0];
    const firstTorrent = this.rootStore.client.torrents.get(firstTorrentId);

    const buttons = [];
    torrentMenuItems.forEach((action, index) => {
      if (disabledActions.indexOf(action) !== -1) return;
      if (actions.indexOf(action) === -1) return;

      switch (action) {
        case 'start': {
          buttons.push(
            <Item key={'start'} onClick={this.handleStart}>{chrome.i18n.getMessage('ML_START')}</Item>
          );
          break;
        }
        case 'forcestart': {
          buttons.push(
            <Item key={'forcestart'} onClick={this.handleForceStart}>{chrome.i18n.getMessage('ML_FORCE_START')}</Item>
          );
          break;
        }
        case 'pause': {
          buttons.push(
            <Item key={'pause'} onClick={this.handlePause}>{chrome.i18n.getMessage('ML_PAUSE')}</Item>
          );
          break;
        }
        case 'unpause': {
          buttons.push(
            <Item key={'unpause'} onClick={this.handleUnpause}>{chrome.i18n.getMessage('resume')}</Item>
          );
          break;
        }
        case 'stop': {
          buttons.push(
            <Item key={'stop'} onClick={this.handleStop}>{chrome.i18n.getMessage('ML_STOP')}</Item>
          );
          break;
        }
        case 'recheck': {
          buttons.push(
            <Item key={'recheck'} onClick={this.handleRecheck}>{chrome.i18n.getMessage('ML_FORCE_RECHECK')}</Item>
          );
          break;
        }
        case 'remove': {
          buttons.push(
            <Item key={'remove'} onClick={this.handleRemove}>{chrome.i18n.getMessage('ML_REMOVE')}</Item>
          );
          break;
        }
        case 'remove_with': {
          buttons.push(
            <Submenu key={'remove_with'} label={chrome.i18n.getMessage('ML_REMOVE_AND')}>
              <Item onClick={this.handleRemoveTorrent}>{chrome.i18n.getMessage('ML_DELETE_TORRENT')}</Item>
              <Item onClick={this.handleRemoveFiles}>{chrome.i18n.getMessage('ML_DELETE_DATA')}</Item>
              <Item onClick={this.handleRemoveTorrentFiles}>{chrome.i18n.getMessage('ML_DELETE_DATATORRENT')}</Item>
            </Submenu>
          );
          break;
        }
        case 'order': {
          buttons.push(
            <Submenu key={'order'} label={chrome.i18n.getMessage('OV_COL_ORDER')}>
              <Item onClick={this.handleQueueUp}>{chrome.i18n.getMessage('up')}</Item>
              <Item onClick={this.handleQueueDown}>{chrome.i18n.getMessage('down')}</Item>
            </Submenu>
          );
          break;
        }
        case 'torrent_files': {
          buttons.push(
            <Item key={'torrent_files'} onClick={this.handleShowFiles}>{chrome.i18n.getMessage('showFileList')}</Item>
          );
          break;
        }
        case 'labels': {
          const subButtons = [];

          this.rootStore.client.allLabels.forEach((label) => {
            let selected = false;
            if (selectedIds.length === 1 && firstTorrent.label === label) {
              selected = true;
            }
            subButtons.push(
              <LabelItem key={`label-${label}`} label={label} selected={selected} onSetLabel={this.handleSetLabel}/>
            );
          });

          if (subButtons.length) {
            subButtons.unshift(
              <Separator key={'separator'}/>
            );
          }

          if (selectedIds.length > 1 || firstTorrent.label) {
            subButtons.unshift(
              <Item key={'remove'} onClick={this.handleRemoveLabel}>{chrome.i18n.getMessage('OV_REMOVE_LABEL')}</Item>
            );
          } else {
            subButtons.unshift(
              <Item key={'create'} onClick={this.handleCreateLabel}>{chrome.i18n.getMessage('OV_NEW_LABEL')}</Item>
            );
          }

          let label = null;
          if (selectedIds.length === 1 && firstTorrent.label) {
            label = (
              <>
                {chrome.i18n.getMessage('OV_COL_LABEL')}
                <i>{firstTorrent.label}</i>
              </>
            );
          } else {
            label = chrome.i18n.getMessage('OV_COL_LABEL');
          }

          buttons.push(
            <Submenu key={'labels'} label={label}>
              {subButtons}
            </Submenu>
          );
          break;
        }
        case '_': {
          buttons.push(
            <Separator key={'separator_' + index}/>
          );
          break;
        }
      }
    });

    return (
      buttons
    );
  }
}

class LabelItem extends React.PureComponent {
  static propTypes = {
    label: PropTypes.string.isRequired,
    selected: PropTypes.bool.isRequired,
    onSetLabel: PropTypes.func.isRequired,
  };

  handleClick = ({event, props}) => {
    this.props.onSetLabel({event, props, label: this.props.label});
  };

  render() {
    let selected = null;
    if (this.props.selected) {
      selected = (
        <label>●</label>
      )
    }

    return (
      <Item onClick={this.handleClick}>{selected}{this.props.label}</Item>
    );
  }
}

export default TorrentMenu;