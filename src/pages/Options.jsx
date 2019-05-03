import "../assets/css/options.css";
import "../assets/css/bootstrap-colorpicker.css";
import React from "react";
import RootStore from "../stores/RootStore";
import ReactDOM from "react-dom";
import {Provider} from "mobx-react";

class Options extends React.Component {
  render() {
    return (
      <div>
        Options
      </div>
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