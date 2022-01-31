const puppeteer = require('puppeteer-extra');

// const AdblockerPlugin = require('puppeteer-extra-plugin-adblocker');
// puppeteer.use(AdblockerPlugin());

const blockResourcesPlugin = require('puppeteer-extra-plugin-block-resources')({
  blockedTypes: new Set(['image', 'stylesheet', 'font']),
});
puppeteer.use(blockResourcesPlugin);

const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

(async () => {
  try {
    const browser = await puppeteer.launch({ headless: false }).catch((e) => { console.log('launch', e); });
    const page = await browser.newPage().catch((e) => { console.log('newPage', e); });
    page.on('console', (msg) => {
      const err = msg.text();
      if (err.indexOf('load resouce') < 0) {
        console.log('PAGE LOG:', err);
      }
    });

    await page.goto('https://soundcloud.com/isnot-jp/sets/fav', { waitUntil: 'domcontentloaded' }).catch((e) => { console.log('goto', e); });
    await page.waitForSelector('#onetrust-accept-btn-handler').catch((e) => { console.log('wait0', e); });
    await page.click('#onetrust-accept-btn-handler').catch((e) => { console.log('click1', e); });

    await page.waitForTimeout(50000).catch((e) => { console.log('wait1', e); });
    await page.click('div.playControls button.playControls__next.skipControl__next').catch((e) => { console.log('click2', e); });
    await page.waitForTimeout(5000).catch((e) => { console.log('wait2', e); });

    await page.screenshot({ path: 'testresult.png', fullPage: true }).catch((e) => { console.log('screenshot', e); });

    await browser.close().catch((e) => { console.log('close', e); });
  } catch (e) {
    console.log(e);
  }
})().catch((err) => {
  console.error(err);
});

// blockResourcesPlugin.blockedTypes.delete('stylesheet')
// blockResourcesPlugin.blockedTypes.delete('other')
// isIABGlobal=false&
