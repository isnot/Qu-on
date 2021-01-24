'use strict';

const util = require('util');
const hasProperty = Object.prototype.hasOwnProperty;

function debug(value) {
  console.log(util.inspect(value, showHidden=false, depth=2, colorize=true));
}
const { BotManager } = require('./manager.js');
const config = require('./settings.json');

(async () => {
  const bot = new BotManager(config);

  try {
    // await bot.once().catch(console.log);
    bot.start();
  } catch (e) {
    console.log('DEBUG toplevel', e);
  }
  if (!bot.in_process) {
    setTimeout(() => process.exit(), 10000);
  }
})();
