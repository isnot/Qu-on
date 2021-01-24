const { MPD_Client } = require('./mpd_client.js');
const { TelegramBot_poll } = require('./telegram_bot_poll.js');
const util = require('util');
// const mpris = require('node-mpris');
// const msheet = require('./mandala_sheet_service/');
// const { getDateTime } = require('./utility.js');

function debug(value) {
  console.log(util.inspect(value, (showHidden = false), (depth = 2), (colorize = true)));
}

class BotManager {
  constructor(config) {
    this.config = { ...config };
    this.iv = 0;
    this.in_process = false;
    this.mpd = undefined;
    this.tg = undefined;
  }

  async start() {
    this.in_process = true;

    this.mpd = new MPD_Client(this.config);
    this.tg = new TelegramBot_poll(this.config);
    await this.mpd.setup();
    await this.tg.setup();
    await this.mpd.prepare(this.tg);
    await this.tg.prepare(this.mpd);
  }

  async end() {
    if (this.iv !== 0) {
      clearInterval(this.iv);
      this.iv = 0;
    }
    this.mpd.destory();
    this.tg.destory();
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

  async once() {
    console.log('[Qu-on] wakeup(once)...' + new Date());
    await this.start();
    await this.comsumeRequests();
    await this.end();
    return 'done';
  }

  async comsumeRequests() {
    try {
      // await new Promise(resolve => setTimeout(resolve, 500));

      const nowCommand = { state: '???' };

      switch (nowCommand.state) {
        case 'stop': {
          // 動作停止の指令あり→プロセス正常終了(非同期処理を待つ)
          console.log('[Qu-on] To be stopped...' + new Date());
          await this.end().catch(console.log);
          break;
        }
        case 'ForceTerminate': {
          // 緊急停止の指令あり→プロセスはエラー終了(非同期処理を待たない)
          console.log('[Qu-on] ForceTerminate!' + new Date());
          await this.end().catch(console.log);
          throw new Error('Terminate');
          // process.exit(-1); // BAD?
          break;
        }
        case 'sleep': {
          console.log("[Qu-on] I'm sleeping..." + new Date());
          break;
        }
        case '': {
          console.log('[Qu-on] No request specified.' + new Date());
          break;
        }
        default:
          console.log('[Qu-on] request unknown.' + new Date());
      }
    } catch (e) {
      console.log('[Qu-on] Error! ' + e);
    }
    // debugger;
    return true;
  }
}

module.exports = {
  BotManager,
};
