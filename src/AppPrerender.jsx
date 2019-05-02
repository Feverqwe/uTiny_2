import React from 'react';
import ReactDOMServer from 'react-dom/server';
import {Provider, useStaticRendering} from 'mobx-react';
import {Route, StaticRouter, Switch} from "react-router-dom";
import UiStore from "./stores/UiStore";
import routes from "./routes";

useStaticRendering(true);

export default (params) => {
  const /**UiStore*/uiStore = UiStore.create();

  const script = document.createElement('script');
  script.id = 'uiStore';
  script.type = 'application/json';
  script.textContent = `<!--${JSON.stringify(uiStore)}-->`;
  document.body.appendChild(script);

  return ReactDOMServer.renderToString(
    <Provider uiStore={uiStore}>
      <StaticRouter location={params.location}>
        <Switch>
          {routes.map(route => {
            return (
              <Route key={`route-${route.path}`} {...route}/>
            );
          })}
        </Switch>
      </StaticRouter>
    </Provider>
  );
}