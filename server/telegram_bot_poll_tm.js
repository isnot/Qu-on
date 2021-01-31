// eslint-disable-next-line no-undef
process.env['NTBA_FIX_319'] = 1;
const Promise = require('bluebird');
Promise.config({
  cancellation: true,
});
const TelegramBot = require('node-telegram-bot-api');
const Utils = require('./utility.js');

class TelegramBot_poll {
  constructor(config) {
    this.config = { ...config };
    this.tg = new TelegramBot(config.bot_api_key, {
      polling: {
        autoStart: false,
      },
    });
    this.player = undefined;
    this.reply_chat_id = undefined;
    this.last_message_id = undefined;
  }

  async setup() {
    this.tg.on('message', async (update) => {
      // console.log('DEBUG tgu', update);
      const command = this.parseMessage({ message: update });
      console.log('DEBUG tg command', command);
      this.reply_chat_id = command.chat_id;
      // this.sendMessage(`DEBUG Message: ${command.message_text}`);

      this.player_command(command);
    });
    this.tg.on('callback_query', async (update) => {
      // console.log('DEBUG tgc', update);
      const command = this.parseMessage({ callback_query: update });
      console.log('DEBUG tg command', command);
      this.reply_chat_id = command.chat_id;
      await this.answerCallbackQuery(command).catch(console.log);

      this.player_command(command);
    });
  }

  async prepare(player) {
    this.player = player; // TODO
    console.log('%s [Qu-on] Tg startPolling', new Date());
    await this.tg.startPolling();
  }

  async destory() {
    console.log('%s [Qu-on] TG will be stopped...', new Date());
    await this.tg.stopPolling();
    this.tg = undefined;
    delete this.tg;
  }

  async player_command(command = {}) {
    const player = this.player; // TODO
    if (typeof player[command.name] === 'function') {
      try {
        await player[command.name].call(player, command);
      } catch (e) {
        console.log('PLAYER ERROR %o', e);
      }
    } else {
      console.log(`DEBUG notexists ${command.name}`);
    }
  }

  parseMessage(incomming) {
    const command = {};
    const callback_query = Utils.deepRetrieve(incomming, 'callback_query');
    const i_message = Utils.deepRetrieve(incomming, 'message');
    const message = callback_query ? callback_query.message : i_message;
    if (callback_query) {
      command.message_text = callback_query.data;
      command.from = callback_query.from;
      command.callback_query_id = callback_query.id;
      command.chat_instance = callback_query.chat_instance;
    }
    if (i_message) {
      command.message_text = message.text;
      command.from = message.from;
    }
    command.chat_id = message.chat.id;
    command.message_id = message.message_id;

    const params = command.message_text.split(' ');
    command.name = 'chat_' + params.shift();
    command.params = params;
    // console.log('DEBUG pM', message, command);
    return command;
  }

  async sendMessage(text = '*', options = {}) {
    const fallback_chat_id = Number.isSafeInteger(this.reply_chat_id)
      ? this.reply_chat_id
      : this.config.chat_id;
    const data = {
      chat_id: fallback_chat_id,
      text: Utils.replaceCharactorEntity4TgHtml(text),
      disable_web_page_preview: this.config.disable_web_page_preview,
      parse_mode: this.config.parse_mode,
      ...options,
    };
    // console.log('DEBUG', data);
    const response = await this.tg.sendMessage(data.chat_id, data.text, data);
    console.log('[Qu-on] sendMessage response: %o', response);
    this.last_message_id = Utils.deepRetrieve(response, 'message_id');
  }

  stopReply() {
    this.last_message_id = undefined;
  }

  async updateMessage(text = '', reply_markup) {
    console.log('DEBUG updateMes c%s m%s %s', this.reply_chat_id, this.last_message_id, text);
    if (Number.isSafeInteger(this.reply_chat_id) && Number.isSafeInteger(this.last_message_id)) {
      return await this.updateMessageHTML(
        this.reply_chat_id,
        this.last_message_id,
        Utils.replaceCharactorEntity4TgHtml(text),
        reply_markup
      );
    }
  }

  async updateMessageHTML(chat_id, message_id, text = '', reply_markup) {
    const data = {
      chat_id: chat_id || this.config.chat_id,
      message_id: message_id,
      text: text,
      disable_web_page_preview: this.config.disable_web_page_preview,
      parse_mode: this.config.parse_mode,
    };
    if (!text || text === '') {
      throw new Error('updateMessageHTML: need text');
    }
    if (!message_id) {
      throw new Error('updateMessageHTML: need message_id');
    }
    if (typeof reply_markup === 'string' && reply_markup !== '') {
      data.reply_markup = reply_markup;
    } else if (typeof reply_markup === 'object' && reply_markup !== null) {
      data.reply_markup = JSON.stringify(reply_markup);
    }
    const response = await this.tg.editMessageText(data.text, data);
    console.log('[Qu-on] editMessageText response: %o', response);
  }

  async answerCallbackQuery(command = {}) {
    // console.debug('answerCQ', command);
    const response = await this.tg.answerCallbackQuery(command.callback_query_id, {
      text: `OK ${command.from.username}, ${command.message_text} ${command.params.join('|')}`,
      show_alert: Utils.safeRetrieve(this.config, 'show_alert', false),
    });
    console.log('[Qu-on] answerCallbackQuery response: %o', response);
    // return await this.tg.answerCallbackQuery(callback_query_id);
  }
}

// reply_markup: {
//   inline_keyboard: [
//     [
//       {
//         text: 'Visit us!',
//         url: 'https://github.com/mast/telegram-bot-api'}
//     ]
//   ]
// }

module.exports = {
  TelegramBot_poll,
};
