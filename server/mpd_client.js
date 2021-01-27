const MPD = require('tm-node-mpd');
const u = require('./utility.js');

class MPD_Client {
  constructor(config) {
    this.config = { ...config };
    this.mpd = new MPD(config.mpd_connect);
    this.chat = undefined;
    this.songId = 0;
    this.lastSongId = 0;
  }

  async prepare(chat) {
    this.chat = chat;
    await this.mpd.connect();
    console.log('%s [Qu-on] MPD Client is connected', new Date());
  }

  async setup() {
    this.mpd.on('error', async (e) => {
      console.log('%s [Qu-on] MPD ERROR %s', new Date(), String(e).substr(0, 90));
    });
    this.mpd.on('ready', async (status, server) => {
      try {
        console.log('DEBUG ready', server, status);
      } catch (e) {
        console.error(e);
      }
    });
    this.mpd.on('update', async (changed) => {
      console.log('DEBUG MPD Update:', changed);
      if (changed === 'player') {
        this.songId = Number(this.mpd.status.songid);
        await this.chat_now();
      }
    });
  }

  async destory() {
    console.log('%S [Qu-on] MPD will be stopped...', new Date());
    this.mpd.disconnect();
    this.mpd = undefined;
  }

  parseSong(song) {
    const artist = u.safeRetrieve(song, 'Artist', '');
    const title = u.safeRetrieve(song, 'Title', '');
    const file = u.safeRetrieve(song, 'file', '');
    const id = u.safeRetrieve(song, 'Id', '');
    const elapsed = u.safeRetrieve(song, 'elapsed', '');
    return `[${id}] ${u.formatSeconds(elapsed)}\n👤${artist} 🎵${title}\n💿${file}`;
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
    await u.wait_sec(period * 2);
    await this.mpd.volume(80);
    await u.wait_sec(period * 2);
    await this.mpd.volume(70);
    await u.wait_sec(period);
    await this.mpd.volume(50);
    await u.wait_sec(period);
    await this.mpd.volume(20);
    await u.wait_sec(period);
    await this.mpd.pause();
    await this.mpd.volume(100);
  }

  // 今の曲の最後でフェードアウト
  async chat_stop_on_now_playing() {
    await this.mpd.updateStatus();
    const remains = this.mpd.status.duration - this.mpd.status.elapsed;
    console.log(`[Qu-on] going to stop in ${remains} sec`);
    const procedure = [await this.chat.sendMessage(`⛔going to stop in ${u.formatSeconds(remains)}`)];
    procedure.push(
      (async () => {
        await u.wait_sec(remains - 14);
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
    if (Number.isSafeInteger(min)) {
      console.log(`[Qu-on] going to stop in ${min} min`);
      await this.chat.sendMessage(`⏰timer set ${min}+ min`);
      await u.wait_sec(min * 60);
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
        await this.chat.sendMessage(`⛔going to stop in ${min} min`);
        await u.wait_sec(min * 60);
        await this.chat_fadeout();
      }
    }
  }

  async chat_now() {
    const now = await this.mpd.currentSong();
    console.log('DEBUG', now, this.mpd.status.elapsed);
    await this.mpd.updateStatus();
    if (this.lastSongId !== Number(now.Id)) {
      const nowplaying = this.parseSong({ ...this.mpd.status, ...now });
      console.log('[Qu-on] now playing', nowplaying);
      await this.chat.sendMessage(`▶${nowplaying}`);
      this.lastSongId = Number(now.Id);
    }
  }

  async chat_key() {
    await this.chat.sendMessage('?', {
      reply_markup: {
        inline_keyboard: this.config.user_keybord,
      },
    });
  }
}

module.exports = {
  MPD_Client,
};
