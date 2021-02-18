const MPD = require('tm-node-mpd');
const Utils = require('./utility.js');
const HOLDER = { chat: undefined };

class MPD_Client {
  constructor(config) {
    this.config = { ...config };
    this.mpd = new MPD(config.mpd_connect);
    this.inProcess = false;
    this.songId = 0;
    this.lastSongId = 0;
    this.stopAt = 0;
    this.songMetaDB = {}; // { songId: { key: value, ... }, ... }
  }

  getChat() {
    return HOLDER.chat;
  }

  async setup() {
    this.mpd.on('error', async (e) => {
      console.log('%s [Qu-on] MPD ERROR %s', new Date(), String(e).substr(0, 99));
    });
    this.mpd.on('ready', async (status, server) => {
      console.log('%s [Qu-on] MPD ready. %o %o', new Date(), server, status);
      if (Utils.hasProperty(status, 'error')) {
        this.getChat().sendMessage(`[Qu-on] MPD Ready. last error message: ${status.error}`);
      }
    });
    this.mpd.on('update', async (changed) => {
      console.log('%s [Qu-on] MPD Update:', new Date(), changed);
      if (changed === 'player') {
        this.songId = parseInt(this.mpd.status.songid, 10);
        if (this.inProcess) {
          console.log('%s [Qu-on] MPD ignored duplicate update process.', new Date());
        } else {
          this.inProcess = true;
          await this.chat_now();
          this.inProcess = false;
        }
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
    const file = Utils.safeRetrieve(song, 'file', '');
    const id = Utils.safeRetrieve(song, 'Id', '');
    const artist = Utils.safeRetrieve(song, 'Artist', '');
    const title = Utils.safeRetrieve(song, 'Title', '') || Utils.safeRetrieve(song, 'Name', '');
    const elapsed = Utils.formatSeconds(Utils.safeRetrieve(song, 'elapsed', ''), 0);
    const duration = Utils.formatSeconds(Utils.safeRetrieve(song, 'duration', ''), 0);
    const url = file.match(/^https?:\/\/([^/]+)\//i);
    const file_or_domain = Array.isArray(url) && url.length > 1 ? url[1].replace(/\.+/g, '_') : file;
    return `[${id}] ${elapsed}/${duration}\n👤${artist} 🎵${title}\n💿${file_or_domain}`;
  }

  remainsSec() {
    return Number(this.mpd.status.duration) - Number(this.mpd.status.elapsed);
  }

  isPlaying() {
    const state = Utils.safeRetrieve(this.mpd, 'status.state', '');
    // console.debug('DEBUG isPlaying %s %s', this.mpd.status.state, this.songId);
    if (this.songId < 1) {
      this.mpd.updateStatus();
    }
    return state === 'play';
  }

  async isValidMessage(message = '') {
    const last_song = await this.findSongMeta(this.songId);
    const last_message = Utils.safeRetrieve(last_song, 'lastMessage', '');
    // console.debug('DEBUG isVaM %o %s', last_song, last_message);
    return message !== last_message;
  }

  async findSongInfo(s_id = 0) {
    const data = await this.findSongMeta(s_id).catch((e) => {
      throw new Error(`no data found for songId:${s_id} ` + String(e));
    });
    return this.formatSong(data);
  }

  async findSongMeta(s_id = 0) {
    if (!Number.isSafeInteger(s_id) || s_id === 0) {
      throw new Error(`invalid songId:${s_id}`);
    }
    const song_id = parseInt(s_id, 10);
    // console.log('DEBUG fSM1 %s %o', song_id, this.songMetaDB);
    const song_c = Utils.safeRetrieve(this.songMetaDB, String(song_id), {});
    // console.log('DEBUG fSM2 %s %o', song_id, song_c);
    if (Utils.hasProperty(song_c, 'file')) {
      return song_c;
    }
    try {
      const song_m = await this.mpd.query('playlistid', song_id).catch((e) => {
        throw new Error('song data not found at query. %s %o', song_id, e);
      });
      // console.log('DEBUG fSM3 %s %o', song_id, song_m);
      if (Utils.hasProperty(song_m, 'file')) {
        this.songMetaDB[`${song_id}`] = song_m;
        return song_m;
      }
    } catch (e) {
      throw new Error('exception: unknown song id. %s %o', s_id, e);
    }
    throw new Error('unknown song id. %s', s_id);
  }

  async stop_after_playing(get_sleep_sec) {
    const chat = this.getChat();
    await this.mpd.updateStatus();
    const sleep = await get_sleep_sec();
    console.log('DEBUG sap', typeof get_sleep_sec, sleep);
    console.log(`%s [Qu-on] going to stop after ${sleep} sec`, new Date());
    await Promise.all([
      await chat.sendMessage(`⛔going to stop after ${Utils.formatSeconds(sleep)}`),
      await this.wait_and_fadeout(sleep - 15),
    ]);
    chat.stopReply();
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
    const [STEP1, STEP2, THRESHOLD, NUMS] = this.config.fadeout_operations;
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
      // console.debug(`DEBUG fadeout vol${vol}`);
      await Promise.all([await Utils.simple_wait_sec(period * 2), await this.mpd.volume(vol)]);
      // console.timeLog('DEBUG_fadeout');
    }
    while (vol > 0) {
      vol -= STEP2;
      vol = vol < 0 ? 0 : vol;
      // console.debug(`DEBUG fadeout vol${vol}`);
      await Promise.all([await Utils.simple_wait_sec(period), await this.mpd.volume(vol)]);
    }
    console.timeEnd('DEBUG_fadeout');
    await this.mpd.pause(1); // no resume playback
    await this.mpd.volume(100); // restore volume
  }

  // ////////////////////////
  // chat command: controlling options
  // ////////////////////////

  async chat_set_crossfade(arg = { params: [] }) {
    const sec = arg.params.length > 0 ? arg.params.shift() : 1;
    if (Number.isSafeInteger(sec)) {
      console.log(`%s [Qu-on] set crossfade to ${sec} sec.`, new Date());
      await this.mpd.crossfade(sec);
    }
  }

  // ////////////////////////
  // chat command: controlling stop timer
  // ////////////////////////

  // 即時、フェードアウトしながら停止する
  async chat_fadeout(arg = { params: [] }) {
    const sec = arg.params.length > 0 ? arg.params.shift() : 15;
    await this.fadeout(sec);
  }

  // 今の曲の最後でフェードアウト
  async chat_stop_on_now_playing() {
    await this.stop_after_playing(() => {
      return this.remainsSec();
    });
  }

  // 次の曲の最後でフェードアウト
  async chat_stop_on_next_playing() {
    await this.stop_after_playing(async () => {
      const data = await this.findSongMeta(parseInt(this.mpd.status.nextsongid, 10));
      return this.remainsSec() + Number(data.duration);
    });
  }

  // n分後、再生中の曲の最後でフェードアウト
  async chat_after_minute_and_stop_on_playing(arg = { params: [] }) {
    const chat = this.getChat();
    const min = arg.params.length > 0 ? Number(arg.params.shift()) : 1;
    if (Number.isSafeInteger(min)) {
      console.log(`%s [Qu-on] going to stop in ${min} min`, new Date());
      Utils.clearTimer();
      await chat.sendMessage(`⏰timer set ${min}+ min`);
      await Utils.wait_sec(min * 60);
      await this.chat_stop_on_now_playing(arg);
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
        await this.chat_stop_on_now_playing(arg);
      } else {
        console.log(`%s [Qu-on] going to stop in ${min} min`, new Date());
        await chat.sendMessage(`⛔going to stop in ${min} min`);
        await this.wait_and_fadeout(min * 60);
        chat.stopReply();
      }
    }
  }

  async chat_clear_timer() {
    const chat = this.getChat();
    this.stopAt = 0;
    Utils.clearTimer();
    await Promise.all([
      await chat.sendMessage('♻clear timer'),
      (async () => {
        await this.mpd.command('single', 0);
        await this.mpd.command('repeat', 0);
        await this.mpd.command('random', 0);
        await this.mpd.command('consume', 0);
      })(),
    ]);
    // this.getChat().stopReply();
  }

  // ////////////////////////
  // chat command: show info
  // ////////////////////////

  async chat_now() {
    const chat = this.getChat();
    if (!this.isPlaying()) {
      await chat.sendMessage('zzz...');
      return;
    }

    await this.mpd.updateStatus();
    const data = await this.mpd.query('currentsong').catch(console.log);
    data.elapsed = this.mpd.status.elapsed;
    data.message_id = chat.last_message_id;
    const nowplaying = this.formatSong(data);
    console.log('[Qu-on] now playing', nowplaying, data);

    const dt = new Date(this.stopAt).toLocaleTimeString();
    const will_stop_at = this.stopAt > Date.now() ? `💤⏲${dt}\n` : '';
    const message = `${will_stop_at}▶${nowplaying}`;
    data.lastMessage = message;

    const song_id = parseInt(data.Id, 10);
    if (this.songId === 0) {
      this.songId = song_id;
    }
    this.lastSongId = song_id;
    this.songMetaDB[`${song_id}`] = data;
    await chat.sendMessage(message);

    // console.log('DEBUG now4 m%s l%s s%s %s', data.message_id, this.lastSongId, song_id, message);
    // if (data.message_id > 0 && this.lastSongId === song_id && (await this.isValidMessage(message))) {
    //   await chat.updateMessage(message).catch(async (e) => {
    //     console.log('DEBUG can not update message. %o', e);
    //     await chat.sendMessage(message);
    //   });
    // }
  }

  async chat_status() {
    const chat = this.getChat();
    await this.mpd.updateStatus();
    console.log('DEBUG status %o', this.mpd.status);
    await chat.sendMessage(Utils.objToStr(this.mpd.status));
  }

  async chat_stats() {
    const chat = this.getChat();
    const stats = await this.mpd.query('stats');
    console.log('DEBUG stats %o', stats);
    await chat.sendMessage(Utils.objToStr(stats));
  }

  async chat_next_song() {
    const chat = this.getChat();
    const info = await this.findSongInfo(parseInt(this.mpd.status.nextsongid, 10));
    console.log('DEBUG next song %s', info);
    await chat.sendMessage(info);
  }

  async chat_info(arg = { params: [] }) {
    const chat = this.getChat();
    if (this.songId === 0) {
      await this.mpd.updateStatus();
      this.songId = parseInt(this.mpd.status.songid, 10);
    }
    const id = arg.params.length > 0 ? parseInt(arg.params.shift(), 10) : this.songId;
    // console.log('DEBUG info1 %s %o %o', id, arg, this.mpd.status);
    const info = await this.findSongInfo(id).catch(async (e) => {
      await chat.sendMessage(`no data found for songId:${id} ${String(e)}`);
    });
    console.log('DEBUG info2 %s, %o', id, info);
    if (info) {
      await chat.sendMessage(info);
    }
  }

  // ////////////////////////
  // chat command: simple controlling playback
  // ////////////////////////

  async chat_play() {
    await this.mpd.play();
  }

  async chat_pause_or_resume() {
    await this.mpd.pause().catch(console.log);
  }

  async chat_stop() {
    await this.mpd.stop();
  }

  async chat_next() {
    await this.mpd.next();
  }

  async chat_prev() {
    await this.mpd.previous();
  }

  // ////////////////////////
  // chat command: send inline keyboard
  // ////////////////////////

  async chat_informations() {
    const chat = this.getChat();
    await chat.sendMessage('ℹ', {
      reply_markup: {
        inline_keyboard: this.config.informations_keyboard,
      },
    });
    chat.stopReply();
  }

  async chat_playback_controls() {
    const chat = this.getChat();
    await chat.sendMessage('📻', {
      reply_markup: {
        inline_keyboard: this.config.playback_controls_keyboard,
      },
    });
    chat.stopReply();
  }

  async chat_stop_timer() {
    const chat = this.getChat();
    await chat.sendMessage('⏲', {
      reply_markup: {
        inline_keyboard: this.config.stop_timer_keyboard,
      },
    });
    chat.stopReply();
  }

  async chat_remove_custom_keyboard() {
    const chat = this.getChat();
    await chat.sendMessage('🔚', {
      reply_markup: {
        remove_keyboard: true,
      },
    });
    chat.stopReply();
  }

  async chat_key(arg = {}) {
    const chat = this.getChat();
    const username = Utils.safeRetrieve(arg, 'from.username', '');
    const m_id = Utils.safeRetrieve(arg, 'message_id', 0);
    const reply_to = m_id ? { reply_to_message_id: m_id, selective: true } : {};
    const usage_link = this.config.usage_link_markdown;
    await chat.sendMessage(username ? `@${username} ${usage_link}` : `↓🔣 ${usage_link}`, {
      resize_keyboard: true,
      parse_mode: 'Markdown',
      ...reply_to,
      reply_markup: {
        keyboard: [
          [{ text: 'informations ℹ' }],
          [{ text: 'playback_controls 📻' }],
          [{ text: 'stop_timer ⏲' }],
        ],
      },
    });
    chat.stopReply();
  }
}

module.exports = {
  MPD_Client,
};
