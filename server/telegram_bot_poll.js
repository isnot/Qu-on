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
    await this.tg.start(); // .catch(console.err);
    console.log(new Date(), '[Qu-on] Tg GetUpdateMessageProvider is started');
  }

  async setup() {
    this.tg.setMessageProvider(new telegram.GetUpdateMessageProvider());

    this.tg.on('update', (update) => {
      const chat_id = update.message.chat.id;
      this.reply_chat_id = chat_id;
      this.sendMessage('DEBUG Message' + update.message.text, { chat_id: chat_id });
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
    console.log('[Qu-on] TG will be stopped...' + new Date());
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
    // DEBUG console.log(data);
    const response = await this.tg.sendMessage(data);
    console.log('[Qu-on] sendMessage response: %o', response);
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
