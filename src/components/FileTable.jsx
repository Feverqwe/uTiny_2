import React from "react";

class FileTable extends React.Component {
  handleScroll = (e) => {
    this.refFixedHead.current.style.left = `${e.currentTarget.scrollLeft * -1}px`;
  };

  refFixedHead = React.createRef();

  render() {
    return (
      <div onScroll={this.handleScroll} className="fl-layer">
        <table ref={this.refFixedHead} className="fl-table-head" border="0" cellSpacing="0" cellPadding="0">
          <thead/>
        </table>
        <table className="fl-table-body" border="0" cellSpacing="0" cellPadding="0">
          <thead/>
          <tbody/>
        </table>
      </div>
    );
  }
}

export default FileTable;