const path = require('path');

class ContextMenu {
  constructor(/**Bg*/bg) {
    this.bg = bg;

    this.create();
    this.bindClick();
  }

  bindClick() {
    if (!chrome.contextMenus.onClicked.hasListener(this.handleClick)) {
      chrome.contextMenus.onClicked.addListener(this.handleClick);
    }
  }

  handleClick = (info, tab) => {
    const {menuItemId, linkUrl, frameId} = info;
    const itemInfo = JSON.parse(menuItemId);
    switch (itemInfo.type) {
      case 'action': {
        switch (itemInfo.name) {
          case 'default': {
            console.log('default');
            break;
          }
          case 'createFolder': {
            console.log('createFolder');
            break;
          }
          case 'createLabel': {
            console.log('createLabel');
            break;
          }
        }
        break;
      }
      case 'folder': {
        const folder = this.bg.config.folders[itemInfo.index];
        console.log('folder', folder);
        break;
      }
      case 'label': {
        const label = this.bg.config.labels[itemInfo.index];
        console.log('label', label);
        break;
      }
    }
  };

  create() {
    chrome.contextMenus.removeAll(() => {
      const menuId = JSON.stringify({type: 'action', name: 'default', source: 'main'});
      chrome.contextMenus.create({
        id: menuId,
        title: chrome.i18n.getMessage('addInTorrentClient'),
        contexts: ['link']
      }, () => {
        switch (this.bg.config.contextMenuType) {
          case 'folder': {
            this.createFolderMenu(menuId);
            break;
          }
          case 'label': {
            this.createLabelMenu(menuId);
            break;
          }
        }
      });
    });
  }

  createFolderMenu(parentId) {
    const folders = this.bg.config.folders;
    if (this.bg.config.treeViewContextMenu) {
      this.transformFoldersToTree(folders).forEach((folder) => {
        let name = folder.name;
        if (name === './') {
          name = chrome.i18n.getMessage('currentDirectory');
        }
        chrome.contextMenus.create({
          id: folder.id,
          parentId: folder.parentId || parentId,
          title: name,
          contexts: ['link']
        });
      });
    } else {
      folders.forEach((folder, index) => {
        chrome.contextMenus.create({
          id: JSON.stringify({type: 'folder', index}),
          parentId: parentId,
          title: folder.name || folder.path,
          contexts: ['link']
        });
      });
    }

    if (folders.length) {
      if (this.bg.config.putDefaultPathInContextMenu) {
        chrome.contextMenus.create({
          id: JSON.stringify({type: 'action', name: 'default', source: 'folder'}),
          parentId: parentId,
          title: chrome.i18n.getMessage('defaultPath'),
          contexts: ['link']
        });
      }

      chrome.contextMenus.create({
        id: JSON.stringify({type: 'action', name: 'createFolder'}),
        parentId: parentId,
        title: chrome.i18n.getMessage('add') + '...',
        contexts: ['link']
      });
    }
  }

  createLabelMenu(parentId) {
    const labels = this.bg.config.labels;
    labels.forEach((label, index) => {
      chrome.contextMenus.create({
        id: JSON.stringify({type: 'label', index}),
        parentId: parentId,
        title: label,
        contexts: ['link']
      });
    });

    if (labels.length) {
      chrome.contextMenus.create({
        id: JSON.stringify({type: 'action', name: 'createLabel'}),
        parentId: parentId,
        title: chrome.i18n.getMessage('add') + '...',
        contexts: ['link']
      });
    }
  }

  transformFoldersToTree(folders) {
    const placeFolderMap = {};
    const places = [];

    let sep = null;
    
    folders.forEach((folder) => {
      const place = folder.path;
      if (sep === null) {
        sep = /\//.test(place) ? '/' : '\\';
      }
      let normPath = place.split(/[\\/]/).join('/');
      normPath = path.normalize(normPath);
      if (/\/$/.test(normPath)) {
        normPath = normPath.slice(0, -1);
      }
      placeFolderMap[normPath] = folder;
      places.push(normPath);
    });

    const lowKeyMap = {};
    const tree = {};
    places.forEach((place) => {
      const parts = place.split('/');
      if (parts[0] === '') {
        parts.unshift([parts.shift(), parts.shift()].join(sep));
      }

      let parentThree = tree;
      parts.forEach((part, index) => {
        const lowPart = parts.slice(0, index + 1).join('/').toLowerCase();
        let caseKey = lowKeyMap[lowPart];
        if (!caseKey) {
          caseKey = lowKeyMap[lowPart] = part;
        }
        let subTree = parentThree[caseKey];
        if (!subTree) {
          subTree = parentThree[caseKey] = {};
        }
        if (index === parts.length - 1) {
          subTree['./'] = place;
        }
        parentThree = subTree;
      });
    });

    const joinSingleParts = (tree, part) => {
      if (typeof tree !== 'object') return;
      const subTree = tree[part];
      const subParts = Object.keys(subTree);
      if (subParts.length === 1) {
        const subPart = subParts.shift();
        if (subPart === './') {
          tree[part] = subTree[subPart];
        } else {
          const joinedPart = part + sep + subPart;
          delete tree[part];
          tree[joinedPart] = subTree[subPart];
          joinSingleParts(tree, joinedPart);
        }
      } else {
        subParts.forEach((part) => {
          joinSingleParts(subTree, part);
        });
      }
    };
    Object.keys(tree).forEach((part) => {
      joinSingleParts(tree, part);
    });

    const menus = [];
    const makeMenuItems = (tree, parentId) => {
      Object.entries(tree).forEach(([name, item]) => {
        if (typeof item === 'object') {
          const branch = item;
          const id = JSON.stringify({type: 'branch', index: menus.length});
          menus.push({
            name: name,
            id,
            parentId
          });
          makeMenuItems(branch, id);
        } else {
          const place = item;
          const folder = placeFolderMap[place];
          const id = JSON.stringify({type: 'folder', index: folders.indexOf(folder)});
          menus.push(Object.assign(folder, {
            name,
            id,
            parentId
          }));
        }
      });
    };
    makeMenuItems(tree);

    return menus;
  }
}

export default ContextMenu;