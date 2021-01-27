const telegram = require('telegram-bot-api');

class TelegramBot_poll {
  constructor(config) {
    this.config = { ...config };
    this.tg = new telegram({ token: config.bot_api_key });
    this.player = undefined;
    this.reply_chat_id = undefined;
  }

  async prepare(player) {
    this.player = player;
    await this.tg.start();
    console.log('%s [Qu-on] Tg GetUpdateMessageProvider is started', new Date());
  }

  async setup() {
    this.tg.setMessageProvider(new telegram.GetUpdateMessageProvider());
    this.tg.on('update', (update) => {
      console.log('DEBUG %o', update);
      // const callback_query = '';
      const chat_id = update.message.chat.id;
      this.reply_chat_id = chat_id;
      this.sendMessage('DEBUG Message: ' + update.message.text, { chat_id: chat_id });
      const command = this.parseMessage(update.message);
      console.log('DEBUG tg command:=', command);
      if (typeof this.player[command.name] === 'function') {
        this.player[command.name].call(this.player, command);
      } else {
        console.log(`DEBUG notexists ${command.name}`);
      }
    });
  }

  async destory() {
    console.log('%s [Qu-on] TG will be stopped...', new Date());
    this.tg.stop();
    this.tg = undefined;
  }

  parseMessage(message) {
    const command = {};
    const params = message.text.split(' ');
    command.name = 'chat_' + params.shift();
    command.params = params;
    return command;
  }

  async sendMessage(text = '*', options = {}) {
    const fallback_chat_id = Number.isSafeInteger(this.reply_chat_id)
      ? this.reply_chat_id
      : this.config.chat_id;
    const data = {
      chat_id: fallback_chat_id,
      text: text,
      disable_web_page_preview: this.config.disable_web_page_preview,
      parse_mode: this.config.parse_mode,
      ...options,
    };
    console.log('DEBUG', data);
    const response = await this.tg.sendMessage(data);
    console.log('[Qu-on] sendMessage response: %o', response);
  }

  async updateMessageHTML(chat_id, message_id, text = '', reply_markup) {
    const config = this.config;
    const data = {
      chat_id: chat_id || config.chat_id,
      message_id: message_id,
      text: text,
      disable_web_page_preview: config.disable_web_page_preview,
      parse_mode: config.parse_mode,
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
    return this.tg.editMessageText(data);
  }

  async answerCallbackQuery(callback_query_id, options = {}) {
    const data = {
      callback_query_id: callback_query_id,
      cache_time: 0,
      show_alert: true,
      text: 'acepted!',
      ...options,
    };
    return await this.tg.answerCallbackQuery(data);
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
