const { BotManager } = require('../server/manager.js');
test('get new instance of BotManager', () => {
  expect(new BotManager()).toBeDefined();
});
