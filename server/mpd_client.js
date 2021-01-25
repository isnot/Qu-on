const MPD = require('tm-node-mpd');

class MPD_Client {
  constructor(config) {
    this.config = { ...config };
    this.mpd = new MPD(config.mpd_connect);
    this.chat = undefined;
  }

  async prepare(chat) {
    this.chat = chat;
    await this.mpd.connect();
    console.log(new Date(), '[Qu-on] MPD Client is connected');
  }

  async setup() {
    this.mpd.on('error', async (e) => {
      console.log(new Date(), '[Qu-on] MPD ERROR', String(e).substr(0, 40));
    });
    this.mpd.on('ready', async () => {
      try {
        console.log(this.mpd.status);
      } catch (e) {
        console.error(e);
      }
    });
    this.mpd.on('update', async (status) => {
      console.log('MPD Update:', status);
      if (status === 'playlist') {
        await this.mpd.updateStatus();
        const nowplaying = this.mpd.playlist[this.mpd.status.playlist];
        console.log('[Qu-on] now playing', nowplaying);
        this.chat.sendMessage(`💿▶${String(nowplaying)}`);
      }
    });
  }

  async destory() {
    console.log('[Qu-on] MPD will be stopped...' + new Date());
    this.mpd.disconnect();
    this.mpd = undefined;
  }

  async wait_sec(sec = 1) {
    const milsec = sec * 1000;
    await new Promise((resolve) => setTimeout(resolve, milsec));
  }

  async chat_crossfade(arg = { params: [] }) {
    const sec = arg.params.length > 0 ? arg.params.shift() : 1;
    if (Number.isSafeInteger(sec)) {
      console.log(`[Qu-on] set crossfade to ${sec} sec.`);
      await this.mpd.crossfade(sec);
    }
  }

  // 即時、フェードアウトしながら停止する
  async chat_fadeout(sec = 14) {
    const period = sec / 7;
    await this.mpd.volume(90);
    await this.wait_sec(period * 2);
    await this.mpd.volume(80);
    await this.wait_sec(period * 2);
    await this.mpd.volume(70);
    await this.wait_sec(period);
    await this.mpd.volume(50);
    await this.wait_sec(period);
    await this.mpd.volume(20);
    await this.wait_sec(period);
    await this.mpd.pause();
    await this.mpd.volume(100);
  }

  // 今の曲の最後でフェードアウト
  async chat_stop_on_now_playing() {
    await this.mpd.updateStatus();
    const remains = this.mpd.status.duration - this.mpd.status.elapsed;
    console.log(`[Qu-on] going to stop in ${remains} sec`);
    this.chat.sendMessage(`⛔going to stop in ${parseInt(remains, 10)} sec⏰`);
    await this.wait_sec(remains - 14);
    await this.chat_fadeout();
  }

  // 次の曲の最後でフェードアウト
  async stop_on_next_playing() {}

  // n分後、再生中の曲の最後でフェードアウト
  async chat_after_minute_and_stop_on_playing(arg = { params: [] }) {
    const min = arg.params.length > 0 ? Number(arg.params.shift()) : 1;
    console.log(`DEBUG going to stop in ${min} min`);
    if (Number.isSafeInteger(min)) {
      console.log(`[Qu-on] going to stop in ${min} min`);
      this.chat.sendMessage(`timer set by ${min}+ min⏰`);
      await this.wait_sec(min * 60);
      await this.chat_stop_on_now_playing();
    }
  }

  // 今の曲の最後、もしくはn分後のいずれか早い方でフェードアウト
  async chat_stop_on_now_playing_or_minute(arg = { params: [] }) {
    const min = arg.params.length > 0 ? Number(arg.params.shift()) : 1;
    if (Number.isSafeInteger(min)) {
      const waitsec = min * 60;
      await this.mpd.updateStatus();
      const remains = this.mpd.status.duration - this.mpd.status.elapsed;
      if (waitsec > remains) {
        await this.chat_stop_on_now_playing();
      } else {
        console.log(`[Qu-on] going to stop in ${min} min`);
        this.chat.sendMessage(`⛔going to stop in ${min} min⏰`);
        await this.wait_sec(min * 60);
        await this.chat_fadeout();
      }
    }
  }

  async chat_now() {
    await this.mpd.updateStatus();
    console.log(this.mpd.playlist, this.mpd.status);
    const nowplaying = ''; // this.mpd.playlist[this.mpd.status.playlist];
    console.log('[Qu-on] now playing', nowplaying);
    this.chat.sendMessage(`💿▶${String(nowplaying)}`);
  }
}

module.exports = {
  MPD_Client,
};
