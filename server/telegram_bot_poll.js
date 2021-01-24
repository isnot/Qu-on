const telegram = require('telegram-bot-api');

class TelegramBot_poll {
  constructor(config) {
    this.config = { ...config };
    this.tg = new telegram({ token: config.bot_api_key });
    this.player = undefined;
  }

  async setup(player) {
    this.tg.setMessageProvider(new telegram.GetUpdateMessageProvider());
    this.player = player;

    tg.on('update', (update) => {
      const chat_id = update.message.chat.id;
      this.sendMessage('your Message is: ' + update.message.text, { chat_id: chat_id });
      const command = this.parseMessage(update.message);
      console.log('DEBUG tg setup command:=', command);
      if (Object.hasOwnProperty.call(this.player, command.name)) {
        this.player[command.name].call(null, command);
      }
    });

    await this.tg.start(); // .catch(console.err);
    console.log(new Date(), 'Tg GetUpdateMessageProvider is started');
  }

  async destory() {
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
    const data = {
      chat_id: this.config.chat_id,
      text: text,
      disable_web_page_preview: this.config.disable_web_page_preview,
      parse_mode: this.config.parse_mode,
      ...options,
    };
    console.log(data);
    const response = await this.tg.sendMessage(data);
    console.log('[Qu-on] sendMessage response: ', response);
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
