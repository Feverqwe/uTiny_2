import {Menu as _Menu} from "react-contexify";

class FixedMenu extends _Menu {
  constructor(props) {
    super(props);
    if (/Firefox\/\d/.test(navigator.userAgent)) {
      const prevBindWindowEvent = this.bindWindowEvent;
      this.bindWindowEvent = () => {
        prevBindWindowEvent();
        window.removeEventListener('resize', this.hide);
      };
    }
  }
}

export {FixedMenu};