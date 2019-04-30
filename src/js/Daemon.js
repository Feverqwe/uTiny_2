import getLogger from "../tools/getLogger";

const logger = getLogger('Daemon');

class Daemon {
  constructor(/**Bg*/bg) {
    this.bg = bg;

    this.isActive = false;
    this.intervalId = null;
    this.inProgress = false;

    this.start();
  }

  handleFire() {
    if (this.inProgress) return;
    this.inProgress = true;

    this.bg.client.updateTorrents().catch((err) => {
      logger.warn('Daemon stopped, cause', err);
      this.stop();
    }).then(() => {
      this.inProgress = false;
    });
  }

  start() {
    this.stop();

    if (this.bg.config.backgroundUpdateInterval >= 1000) {
      this.isActive = true;
      this.intervalId = setInterval(() => {
        this.handleFire();
      }, this.bg.config.backgroundUpdateInterval);
      this.handleFire();
    }
  }

  stop() {
    this.isActive = false;
    clearInterval(this.intervalId);
  }

  destroy() {
    this.stop();
  }
}

export default Daemon;