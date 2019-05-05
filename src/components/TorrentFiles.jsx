import FileListTable from "./FileListTable";
import React from "react";

class TorrentFiles extends React.Component {
  render() {
    return (

      <div className="file-list">
        <FileListTable/>
        <ul className="bottom-menu">
          <li className="path"><input type="text" readOnly="readonly"/></li>
          <li className="btn"><a className="close" data-lang="DLG_BTN_CLOSE,title"/></li>
          <li className="btn"><a className="update" data-lang="refresh,title"/></li>
        </ul>
      </div>
    );
  }
}

export default TorrentFiles;