const MPD = require('tm-node-mpd');
const Utils = require('./utility.js');
const HOLDER = { chat: undefined };

class MPD_Client {
  constructor(config) {
    this.config = { ...config };
    this.mpd = new MPD(config.mpd_connect);
    this.songId = 0;
    this.lastSongId = 0;
    this.stopAt = 0;
  }

  getChat() {
    return HOLDER.chat;
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
    HOLDER.chat = chat;
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

  async currentSong() {
    try {
      return await this.mpd.currentSong().catch(console.log);
    } catch (e) {
      throw new Error('currentSong is not suported.', e);
    }
  }

  async wait_and_fadeout(sec) {
    this.stopAt = Date.now() + sec * 1000;
    console.log('DEBUG timer start %s sec', sec);
    await Utils.wait_sec(sec);
    console.log('DEBUG timer end %s sec', sec);
    await this.fadeout();
    this.stopAt = Date.now();
  }

  async fadeout(sec = 15) {
    const [STEP1, STEP2, THRESHOLD, NUMS] = [4, 9, 40, 35];
    if (!this.isPlaying()) {
      return;
    }
    const period = sec / NUMS;
    const ori_vol = Number(this.mpd.status.volume);
    let vol = parseInt(ori_vol * 100, 10);
    vol = vol > 100 ? 100 : vol;
    console.time('DEBUG_fadeout');
    while (vol > THRESHOLD) {
      vol -= STEP1;
      console.debug(`DEBUG fadeout vol${vol}`);
      await Promise.all([await Utils.simple_wait_sec(period * 2), await this.mpd.volume(vol)]);
      // console.timeLog('DEBUG_fadeout');
    }
    while (vol > 0) {
      vol -= STEP2;
      vol = vol < 0 ? 0 : vol;
      console.debug(`DEBUG fadeout vol${vol}`);
      await Promise.all([await Utils.simple_wait_sec(period), await this.mpd.volume(vol)]);
    }
    console.timeEnd('DEBUG_fadeout');
    await this.mpd.pause(1); // no resume playback
    await this.mpd.volume(100); // restore volume
  }

  async chat_set_crossfade(arg = { params: [] }) {
    const sec = arg.params.length > 0 ? arg.params.shift() : 1;
    if (Number.isSafeInteger(sec)) {
      console.log(`[Qu-on] set crossfade to ${sec} sec.`);
      await this.mpd.crossfade(sec);
    }
  }

  // 即時、フェードアウトしながら停止する
  async chat_fadeout(arg = { params: [] }) {
    const sec = arg.params.length > 0 ? arg.params.shift() : 14;
    await this.fadeout(sec);
  }

  // 今の曲の最後でフェードアウト
  async chat_stop_on_now_playing() {
    const chat = this.getChat();
    await this.mpd.updateStatus();
    const remains = this.remainsSec();
    console.log(`[Qu-on] going to stop in ${remains} sec`);
    await Promise.all([
      await chat.sendMessage(`⛔going to stop in ${Utils.formatSeconds(remains)}`),
      await this.wait_and_fadeout(remains - 14),
    ]);
    chat.stopReply();
  }

  // 次の曲の最後でフェードアウト
  async stop_on_next_playing() {}

  // n分後、再生中の曲の最後でフェードアウト
  async chat_after_minute_and_stop_on_playing(arg = { params: [] }) {
    const chat = this.getChat();
    const min = arg.params.length > 0 ? Number(arg.params.shift()) : 1;
    if (Number.isSafeInteger(min)) {
      console.log(`[Qu-on] going to stop in ${min} min`);
      await chat.sendMessage(`⏰timer set ${min}+ min`);
      chat.stopReply();
      await Utils.wait_sec(min * 60);
      await this.chat_stop_on_now_playing();
    }
  }

  // 今の曲の最後、もしくはn分後のいずれか早い方でフェードアウト
  async chat_stop_on_now_playing_or_minute(arg = { params: [] }) {
    const chat = this.getChat();
    const min = arg.params.length > 0 ? Number(arg.params.shift()) : 1;
    if (Number.isSafeInteger(min)) {
      const waitsec = min * 60;
      await this.mpd.updateStatus();
      const remains = this.remainsSec();
      if (waitsec > remains) {
        await this.chat_stop_on_now_playing();
      } else {
        console.log(`[Qu-on] going to stop in ${min} min`);
        await chat.sendMessage(`⛔going to stop in ${min} min`);
        chat.stopReply();
        await this.wait_and_fadeout(min * 60);
      }
    }
  }

  async chat_now() {
    if (!this.isPlaying()) {
      return;
    }
    const chat = this.getChat();
    const now = await this.currentSong();
    console.log('DEBUG', now, this.mpd.status.elapsed);

    await this.mpd.updateStatus();
    const nowplaying = this.formatSong({ ...this.mpd.status, ...now });
    console.log('[Qu-on] now playing', nowplaying);

    const dt = new Date(this.stopAt).toLocaleTimeString();
    const will_stop_at = this.stopAt > Date.now() ? `⏲${dt}\n` : '';
    const message = `${will_stop_at}▶${nowplaying}`;
    if (this.lastSongId === Number(now.Id)) {
      if (this.isPlaying()) {
        await chat.updateMessage(message);
      }
    } else {
      await chat.sendMessage(message);
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
    this.stopAt = 0;
    Utils.clearTimer();
    this.getChat().stopReply();
  }

  async chat_key() {
    const chat = this.getChat();
    await chat.sendMessage('?', {
      reply_markup: {
        inline_keyboard: this.config.user_keybord,
      },
    });
    chat.stopReply();
  }
}

module.exports = {
  MPD_Client,
};
