import React from 'react';
import {Redirect} from "react-router-dom";
import ComponentLoader from "./components/ComponentLoader";
import Index from "./pages";

const routes = [
  {
    path: '/index.html',
    render: () => {
      return (
        <Index/>
      );
    },
  },
  {
    path: '/options.html',
    render: () => {
      return (
        <ComponentLoader load-page={'options'}/>
      );
    },
  },
  {
    render: () => {
      return (
        <Redirect to={"/index.html"}/>
      );
    },
  }
];

export default routes;