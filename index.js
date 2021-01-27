'use strict';

const { BotManager } = require('./server/manager.js');
const config = require('./settings.json');

(async () => {
  const bot = new BotManager(config);
  console.log('%s [Qu-on] wakeup...', new Date());
  try {
    await bot.start(() => {});
  } catch (e) {
    console.log('DEBUG toplevel', e);
  }
  if (!bot.in_process) {
    // eslint-disable-next-line no-undef
    setTimeout(() => process.exit(), 10000);
  }
})();
