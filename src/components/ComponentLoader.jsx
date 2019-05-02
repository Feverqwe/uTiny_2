import React from "react";
import PropTypes from "prop-types";

const Options = React.lazy(() => import('../pages/Options'));

const idComponent = {
  options: Options,
};

class ComponentLoader extends React.Component {
  static propTypes = {
    'load-page': PropTypes.string.isRequired,
  };

  render() {
    if (window.PRERENDER) {
      return (
        <Spinner/>
      );
    }

    const {'load-page': componentId} = this.props;

    const Component = idComponent[componentId];

    return (
      <React.Suspense fallback={<Spinner/>}>
        <Component/>
      </React.Suspense>
    );
  }
}

const Spinner = () => 'Loading...';

export default ComponentLoader;