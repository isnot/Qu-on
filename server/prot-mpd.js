
const MPD = require('tm-node-mpd');
const mpd = new MPD({ type: 'ipc' });
const util = require('util');
// const mpris = require('node-mpris');



mpd.on('ready', async () => {
  try {
    console.log(mpd.status);
    // await mpd.volume(volume);

  } catch (e) {
    console.error(e);
  } finally {
    mpd.disconnect();
  }
});

mpd.connect();

function debug(value) {
  console.log(util.inspect(value, showHidden=false, depth=2, colorize=true));
}
