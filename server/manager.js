const { MPD_Client } = require('./mpd_client.js');
const { TelegramBot_poll } = require('./telegram_bot_poll.js');
// const mpris = require('node-mpris');
// const msheet = require('./mandala_sheet_service/');

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

  async start(func) {
    this.in_process = true;
    this.mpd = new MPD_Client(this.config);
    this.tg = new TelegramBot_poll(this.config);
    await Promise.all([await this.mpd.setup(), await this.tg.setup()]);
    await Promise.all([await this.mpd.prepare(this.tg), await this.tg.prepare(this.mpd)]);

    if (typeof func === 'function') {
      await this.timer(func);
      // debugger;
    }
    await this.end().catch(console.log);
  }

  async end() {
    if (this.iv !== 0) {
      // clearInterval(this.iv);
      this.iv = 0;
    }
    await Promise.all([await this.mpd.destory(), await this.tg.destory()]);
    this.in_process = false;
  }

  async sleep(sec = 1) {
    const milsec = sec * 1000;
    await new Promise((resolve) => setTimeout(resolve, milsec));
  }

  async timer(callback = () => {}) {
    console.log('[Qu-on] wakeup...' + new Date());
    if (this.in_process && this.iv === 0) {
      // eslint-disable-next-line no-constant-condition
      while (true) {
        this.iv += 1;
        // 本処理と sleep を同時実行して最低間隔を確保する
        await Promise.all([callback(), this.sleep(this.config.process_interval_sec)]);
      }
    }
    // throw new Error('Not suported action');
  }
}

module.exports = {
  BotManager,
};
