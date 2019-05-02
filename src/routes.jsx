import React from 'react';
import Index from "./pages";
import ComponentLoader from "./components/ComponentLoader";

const routes = [
  {
    path: '/index.html',
    component: Index,
  },
  {
    path: '/options.html',
    render: () => {
      return (
        <ComponentLoader load-page={'options'}/>
      );
    },
  }
];

export default routes;