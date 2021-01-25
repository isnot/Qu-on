const MPD = require('tm-node-mpd');

class MPD_Client {
  constructor(config) {
    this.config = { ...config };
    this.mpd = new MPD(config.mpd_connect);
    this.chat = undefined;
    this.songId = undefined;
  }

  async prepare(chat) {
    this.chat = chat;
    await this.mpd.connect();
    console.log(new Date(), '[Qu-on] MPD Client is connected');
  }

  async setup() {
    this.mpd.on('error', async (e) => {
      console.log(new Date(), '[Qu-on] MPD ERROR', String(e).substr(0, 90));
    });
    this.mpd.on('ready', async () => {
      try {
        console.log('ready', this.mpd.status);
      } catch (e) {
        console.error(e);
      }
    });
    this.mpd.on('update', async (status) => {
      console.log('MPD Update:', status);
      if (status === 'player') {
        await this.updateStatus();
        await this.chat_now();
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

  async updateStatus(callback) {
    const oldSongId = this.mpd.songId;
    await this.mpd.updateStatus();
    if (this.hasProperty(this, callback)) {
      await this[callback].call(this);
    }
    if (oldSongId !== this.mpd.songId) {
      this.songId = this.mpd.songId;
    }
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
    await this.updateStatus();
    const remains = this.mpd.status.duration - this.mpd.status.elapsed;
    console.log(`[Qu-on] going to stop in ${remains} sec`);
    const procedure = [await this.chat.sendMessage(`⛔going to stop in ${this.formatSeconds(remains)}`)];
    procedure.push(
      (async () => {
        await this.wait_sec(remains - 14);
        await this.chat_fadeout();
      })()
    );
    await Promise.all(procedure);
  }

  // 次の曲の最後でフェードアウト
  async stop_on_next_playing() {}

  // n分後、再生中の曲の最後でフェードアウト
  async chat_after_minute_and_stop_on_playing(arg = { params: [] }) {
    const min = arg.params.length > 0 ? Number(arg.params.shift()) : 1;
    console.log(`DEBUG going to stop in ${min} min`);
    if (Number.isSafeInteger(min)) {
      console.log(`[Qu-on] going to stop in ${min} min`);
      await this.chat.sendMessage(`⏰timer set ${min}+ min`);
      await this.wait_sec(min * 60);
      await this.chat_stop_on_now_playing();
    }
  }

  // 今の曲の最後、もしくはn分後のいずれか早い方でフェードアウト
  async chat_stop_on_now_playing_or_minute(arg = { params: [] }) {
    const min = arg.params.length > 0 ? Number(arg.params.shift()) : 1;
    if (Number.isSafeInteger(min)) {
      const waitsec = min * 60;
      await this.updateStatus();
      const remains = this.mpd.status.duration - this.mpd.status.elapsed;
      if (waitsec > remains) {
        await this.chat_stop_on_now_playing();
      } else {
        console.log(`[Qu-on] going to stop in ${min} min`);
        await this.chat.sendMessage(`⛔going to stop in ${min} min`);
        await this.wait_sec(min * 60);
        await this.chat_fadeout();
      }
    }
  }

  async chat_now() {
    const oldSongId = this.mpd.songId;
    const now = await this.mpd.currentSong();
    console.log(now, this.mpd.status);
    await this.updateStatus();
    if (oldSongId !== this.mpd.songId) {
      const nowplaying = this.parseSong({ ...this.mpd.status, ...now });
      console.log('[Qu-on] now playing', nowplaying);
      await this.chat.sendMessage(`▶${nowplaying}`);
    }
  }

  async chat_key() {
    await this.chat.sendMessage('?', {
      reply_markup: {
        inline_keyboard: this.config.user_keybord,
      },
    });
  }

  parseSong(song) {
    const artist = this.safeRetrieve(song, 'Artist', '');
    const title = this.safeRetrieve(song, 'Title', '');
    const file = this.safeRetrieve(song, 'file', '');
    const id = this.safeRetrieve(song, 'Id', '');
    const elapsed = this.safeRetrieve(song, 'elapsed', '');
    return `[${id}] ${this.formatSeconds(elapsed)}\n👤${artist} 🎵${title}\n💿${file}`;
  }

  safeRetrieve(target, pos, alternate) {
    try {
      const value = this.deepRetrieve(target, pos);
      return typeof value === 'string' ? value : alternate;
    } catch (e) {
      return alternate;
    }
  }

  deepRetrieve(target, pos) {
    let cur = target;
    if (typeof pos !== 'string' || typeof target !== 'object' || target === null) {
      return undefined;
    }
    try {
      pos.split('.').forEach((el) => {
        if (this.hasProperty(cur, el)) {
          cur = cur[el];
        } else {
          throw new Error('deepRetrieve: element not found');
        }
      });
    } catch (e) {
      return undefined;
    }
    return cur;
  }

  // const hasProperty = Object.prototype.hasOwnProperty;
  hasProperty(obj, prop) {
    return Object.prototype.hasOwnProperty.call(obj, prop);
  }

  formatSeconds(sec = 0) {
    const min = Math.trunc(sec / 60);
    const sec_f = Number.parseFloat(sec % 60).toFixed(2);
    const s_sec = Number(sec_f) < 10 ? `0${sec_f}` : String(sec_f);
    return `${min}:${s_sec}`;
  }

  // const util = require('util');
  // util.inspect(value, { showHidden: false, depth: 1, colorize: true });
}

module.exports = {
  MPD_Client,
};
