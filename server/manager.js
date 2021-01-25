const { MPD_Client } = require('./mpd_client.js');
const { TelegramBot_poll } = require('./telegram_bot_poll.js');
const util = require('util');
// const mpris = require('node-mpris');
// const msheet = require('./mandala_sheet_service/');

function debug(value) {
  console.log(util.inspect(value, { showHidden: false, depth: 1, colorize: true }));
}
const hasProperty = Object.prototype.hasOwnProperty;

class BotManager {
  constructor(config) {
    this.config = { ...config };
    this.iv = 0;
    this.in_process = false;
    this.mpd = undefined;
    this.mpris = undefined;
    this.playerctl = undefined;
    this.tg = undefined;
  }

  async start() {
    this.in_process = true;
    this.mpd = new MPD_Client(this.config);
    this.tg = new TelegramBot_poll(this.config);
    await Promise.all([await this.mpd.setup(), await this.tg.setup()]);
    await Promise.all([await this.mpd.prepare(this.tg), await this.tg.prepare(this.mpd)]);
    // debugger;
    await this.end().catch(console.log);
  }

  async end() {
    if (this.iv !== 0) {
      clearInterval(this.iv);
      this.iv = 0;
    }
    await Promise.all([await this.mpd.destory(), await this.tg.destory()]);
    this.in_process = false;
  }

  async timer() {
    console.log('[Qu-on] wakeup...' + new Date());
    if (!this.in_process && !this.iv) {
      await this.start();
      const iv = setInterval(() => this.comsumeRequests(), this.config.process_interval_milsec);
      this.iv = iv;
    }
    return this.iv;
  }

  async comsumeRequests() {
    throw new Error('Not suported action');
  }
}

module.exports = {
  BotManager,
};
