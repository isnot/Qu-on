const MPD = require('tm-node-mpd');

class MPD_Client {
  constructor(config) {
    this.config = { ...config };
    this.mpd = new MPD({ type: 'ipc' });
    this.chat = undefined;
  }

  async setup(chat) {
    this.chat = chat;
    mpd.on('ready', async () => {
      try {
        console.log(mpd.status);
        // await mpd.volume(volume);
      } catch (e) {
        console.error(e);
      }
    });

    await this.mpd.connect();
    console.log(new Date(), 'MPD Client is connected');
  }

  async destory() {
    this.mpd.disconnect();
    this.mpd = undefined;
  }

  async wait_sec(sec = 1) {
    const milsec = sec * 1000;
    await new Promise((resolve) => setTimeout(resolve, milsec));
  }

  async fadeout() {}

  // 即時、フェードアウトしながら停止する
  async fade_and_stop() {}

  // 今の曲の最後でフェードアウト
  async stop_on_now_playing() {}

  // 次の曲の最後でフェードアウト
  async stop_on_next_playing() {}

  // n分後、再生中の曲の最後でフェードアウト
  async after_minute_and_stop_on_playing() {}

  // 今の曲の最後、もしくはn分後のいずれか早い方でフェードアウト
  async stop_on_now_playing_or_minute() {}
}

module.exports = {
  MPD_Client,
};
