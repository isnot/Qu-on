const Utils = require('./utility.js');
const HOLDER = { chat: undefined };

class YouTube_Client {
  constructor(config) {
    this.config = { ...config };
  }

  getChat() {
    return HOLDER.chat;
  }

  async setup() {
    this.mpd.on('error', async (e) => {
      console.log('%s [Qu-on] YouTube ERROR %s', new Date(), String(e).substr(0, 99));
    });
    this.mpd.on('ready', async (status, server) => {
      console.log('%s [Qu-on] YouTube ready. %o %o', new Date(), server, status);
      if (Utils.hasProperty(status, 'error')) {
        this.getChat().sendMessage(`[Qu-on] YouTube Ready. last error message: ${status.error}`);
      }
    });
    this.mpd.on('update', async (changed) => {
      console.log('%s [Qu-on] YouTube Update:', new Date(), changed);
      if (changed === 'player') {
        this.songId = parseInt(this.mpd.status.songid, 10);
        if (this.inProcess) {
          console.log('%s [Qu-on] YouTube ignored duplicate update process.', new Date());
        } else {
          this.inProcess = true;
          await this.chat_now();
          this.inProcess = false;
        }
      }
    });
  }

  async destory() {
    console.log('%s [Qu-on] YouTube will be stopped...', new Date());
    this.mpd = undefined;
    delete this.mpd;
  }

}

module.exports = {
  YouTube_Client,
};
