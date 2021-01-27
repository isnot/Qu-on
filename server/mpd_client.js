const MPD = require('tm-node-mpd');
const Utils = require('./utility.js');

class MPD_Client {
  constructor(config) {
    this.config = { ...config };
    this.mpd = new MPD(config.mpd_connect);
    this.chat = undefined;
    this.songId = 0;
    this.lastSongId = 0;
    this.stop_at = 0;
  }

  async setup() {
    this.mpd.on('error', async (e) => {
      console.log('%s [Qu-on] MPD ERROR %s', new Date(), String(e).substr(0, 90));
    });
    this.mpd.on('ready', async (status, server) => {
      console.debug('DEBUG ready', server, status);
    });
    this.mpd.on('update', async (changed) => {
      console.debug('DEBUG MPD Update:', changed);
      if (changed === 'player') {
        this.songId = Number(this.mpd.status.songid);
        await this.chat_now();
      }
    });
  }

  async prepare(chat) {
    this.chat = chat;
    await this.mpd.connect();
    console.log('%s [Qu-on] MPD Client is connected', new Date());
  }

  async destory() {
    console.log('%s [Qu-on] MPD will be stopped...', new Date());
    await this.mpd.disconnect();
    this.mpd = undefined;
    delete this.mpd;
  }

  formatSong(song) {
    const artist = Utils.safeRetrieve(song, 'Artist', '');
    const title = Utils.safeRetrieve(song, 'Title', '');
    const file = Utils.safeRetrieve(song, 'file', '');
    const id = Utils.safeRetrieve(song, 'Id', '');
    const elapsed = Utils.safeRetrieve(song, 'elapsed', '');
    return `[${id}] ${Utils.formatSeconds(elapsed)}\n👤${artist} 🎵${title}\n💿${file}`;
  }

  isPlaying() {
    return this.mpd.status.state === 'play' && Number(this.mpd.status.songid) > 0;
  }

  remainsSec() {
    return this.mpd.status.duration - this.mpd.status.elapsed;
  }

  async wait_and_fadeout(sec) {
    this.stop_at = Date.now() + sec * 1000;
    console.log('DEBUG timer start [%o] => %s sec', Utils.timer_id, sec);
    await Utils.wait_sec(sec);
    console.log('DEBUG timer end [%o] => %s sec', Utils.timer_id, sec);
    await this.chat_fadeout();
    this.stop_at = Date.now();
  }

  async chat_set_crossfade(arg = { params: [] }) {
    const sec = arg.params.length > 0 ? arg.params.shift() : 1;
    if (Number.isSafeInteger(sec)) {
      console.log(`[Qu-on] set crossfade to ${sec} sec.`);
      await this.mpd.crossfade(sec);
    }
  }

  // 即時、フェードアウトしながら停止する
  async chat_fadeout(sec = 14) {
    if (!this.isPlaying()) {
      return;
    }
    const period = sec / 7;
    await this.mpd.volume(90);
    await Utils.simple_wait_sec(period * 2);
    await this.mpd.volume(80);
    await Utils.simple_wait_sec(period * 2);
    await this.mpd.volume(70);
    await Utils.simple_wait_sec(period);
    await this.mpd.volume(50);
    await Utils.simple_wait_sec(period);
    await this.mpd.volume(20);
    await Utils.simple_wait_sec(period);
    await this.mpd.pause(1); // no resume playback
    await this.mpd.volume(100);
  }

  // 今の曲の最後でフェードアウト
  async chat_stop_on_now_playing() {
    await this.mpd.updateStatus();
    const remains = this.remainsSec();
    console.log(`[Qu-on] going to stop in ${remains} sec`);
    await Promise.all([
      await this.chat.sendMessage(`⛔going to stop in ${Utils.formatSeconds(remains)}`),
      await this.wait_and_fadeout(remains - 14),
    ]);
    this.chat.stopReply();
  }

  // 次の曲の最後でフェードアウト
  async stop_on_next_playing() {}

  // n分後、再生中の曲の最後でフェードアウト
  async chat_after_minute_and_stop_on_playing(arg = { params: [] }) {
    const min = arg.params.length > 0 ? Number(arg.params.shift()) : 1;
    if (Number.isSafeInteger(min)) {
      console.log(`[Qu-on] going to stop in ${min} min`);
      await this.chat.sendMessage(`⏰timer set ${min}+ min`);
      this.chat.stopReply();
      await Utils.wait_sec(min * 60);
      await this.chat_stop_on_now_playing();
    }
  }

  // 今の曲の最後、もしくはn分後のいずれか早い方でフェードアウト
  async chat_stop_on_now_playing_or_minute(arg = { params: [] }) {
    const min = arg.params.length > 0 ? Number(arg.params.shift()) : 1;
    if (Number.isSafeInteger(min)) {
      const waitsec = min * 60;
      await this.mpd.updateStatus();
      const remains = this.remainsSec();
      if (waitsec > remains) {
        await this.chat_stop_on_now_playing();
      } else {
        console.log(`[Qu-on] going to stop in ${min} min`);
        await this.chat.sendMessage(`⛔going to stop in ${min} min`);
        this.chat.stopReply();
        await this.wait_and_fadeout(min * 60);
      }
    }
  }

  async chat_now() {
    if (!this.isPlaying()) {
      return;
    }
    const now = await this.mpd.currentSong();
    console.log('DEBUG', now, this.mpd.status.elapsed);

    await this.mpd.updateStatus();
    const nowplaying = this.formatSong({ ...this.mpd.status, ...now });
    console.log('[Qu-on] now playing', nowplaying);

    const dt = new Date(this.stop_at).toLocaleTimeString();
    const will_stop_at = this.stop_at > Date.now() ? `⏲${dt}\n` : '';
    const message = `${will_stop_at}▶${nowplaying}`;
    if (this.lastSongId === Number(now.Id)) {
      if (this.isPlaying()) {
        await this.chat.updateMessage(message);
      }
    } else {
      await this.chat.sendMessage(message);
      this.lastSongId = Number(now.Id);
    }
  }

  async chat_play() {
    await this.mpd.play();
  }

  async chat_pause_or_resume() {
    await this.mpd.pause().catch(console.log);
  }

  async chat_stop() {
    await this.mpd.stop();
  }

  async chat_clear_timer() {
    this.stop_at = 0;
    Utils.clearTimer();
    this.chat.stopReply();
  }

  async chat_key() {
    await this.chat.sendMessage('?', {
      reply_markup: {
        inline_keyboard: this.config.user_keybord,
      },
    });
    this.chat.stopReply();
  }
}

module.exports = {
  MPD_Client,
};
