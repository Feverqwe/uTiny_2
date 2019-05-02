import React from 'react';
import ReactDOM from 'react-dom';
import {Provider} from 'mobx-react';
import {BrowserRouter, Route, Switch} from "react-router-dom";
import UiStore from "./stores/UiStore";
import routes from "./routes";

const uiStore = UiStore.create(JSON.parse(document.getElementById('uiStore').innerHTML.slice(4, -3)));

window.uiStore = uiStore;

ReactDOM.hydrate(
  <Provider uiStore={uiStore}>
    <BrowserRouter>
      <Switch>
        {routes.map(route => {
          return (
            <Route key={`route-${route.path}`} {...route}/>
          );
        })}
      </Switch>
    </BrowserRouter>
  </Provider>,
  document.getElementById('root')
);