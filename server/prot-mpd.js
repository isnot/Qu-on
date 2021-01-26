'use strict';

const { BotManager } = require('./manager.js');
const config = require('./settings.json');

console.log('%s [Qu-on] wakeup...', new Date());
(async () => {
  const bot = new BotManager(config);

  try {
    // await bot.start().catch(console.log);
    await bot.start(() => {});
  } catch (e) {
    console.log('DEBUG toplevel', e);
  }
  if (!bot.in_process) {
    // eslint-disable-next-line no-undef
    setTimeout(() => process.exit(), 10000);
  }
})();
