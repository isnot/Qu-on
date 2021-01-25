'use strict';

const { BotManager } = require('./manager.js');
const config = require('./settings.json');

(async () => {
  const bot = new BotManager(config);

  try {
    await bot.start().catch(console.log);
  } catch (e) {
    console.log('DEBUG toplevel', e);
  }
  if (!bot.in_process) {
    setTimeout(() => process.exit(), 10000);
  }
})();
