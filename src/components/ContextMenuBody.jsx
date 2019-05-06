import React from "react";
import PropTypes from "prop-types";

class ContextMenuBody extends React.Component {
  static propTypes = {
    rootStore: PropTypes.object,
    propsFromTrigger: PropTypes.object,
  };

  state = {
    onHide: null
  };

  static getDerivedStateFromProps(nextProps, prevState) {
    const nextOnHide = nextProps.propsFromTrigger && nextProps.propsFromTrigger.onHide;
    if (prevState.onHide !== nextOnHide) {
      if (prevState.onHide) {
        prevState.onHide();
      }
      return {
        onHide: nextOnHide
      };
    }
    return null;
  }

  componentWillUnmount() {
    if (this.props.propsFromTrigger && this.props.propsFromTrigger.onHide) {
      this.props.propsFromTrigger.onHide();
    }
  }
}

export default ContextMenuBody;