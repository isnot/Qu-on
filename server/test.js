//#!/usr/bin/env node

//  process.exit(code=0);


var util = require('util');
var mpris = require('/home/naoto/repository/node-mpris/mpris.js');

mpris.Player.on('MetadataChanged', function (newValue, oldValue) {
  if(!oldValue || Object.keys(newValue).length != Object.keys(oldValue).length) {
    console.log("Metadata updated:");
    console.log(util.inspect(newValue, showHidden=false, depth=2, colorize=true));
  }
});


mpris.Player.on('PlaybackStatusChanged', function (newValue, oldValue) {
  if(newValue != oldValue) {
    mpris.GetIdentity(function (error, identity) {
      mpris.Player.GetMetadata(function (error, metadata) {
        console.log(identity+' is now '+newValue.toLowerCase()+' "'+metadata['xesam:url']+'"');
      });
    });
  }
});

// mpris.start('vlc', null, function (error) {
//   mpris.Player.OpenUri(argv.uri, function (error) {
//     mpris.Player.Play(function(error){

//       mpris.GetSupportedUriSchemes(function (error, uriSchemes) {
//         console.log("\nSupported Uri Schemes:");
//         console.log(util.inspect(uriSchemes, showHidden=false, depth=2, colorize=true));
//       });
//       mpris.GetSupportedMimeTypes(function (error, mimetypes) {
//         console.log("\nSupported Mimetypes:");
//         console.log(util.inspect(mimetypes, showHidden=false, depth=2, colorize=true));
//       });

//     });
//   });
// });

// vlc
// NuvolaAppYoutubeMusic
// NuvolaAppSoundcloud


// mpris.connect('NuvolaAppSoundcloud', (error) => {
//   mpris.Player.Play();
//   mpris.Player.Next();
//   setTimeout(() => {
//     console.log('NEXT!!');
//     mpris.Player.Next();
//   }, 20000);
//   console.log(error);
//   console.log(mpris.Player.Playlists);
// });

// mpris.connect('NuvolaAppYoutubeMusic', function (error) {
//   console.log(error);
//   mpris.Player.OpenUri('https://youtu.be/c0TJUVQ2hDI', function (error) {
//     mpris.Player.Play(function(error){
//       console.log(error);
//       setTimeout(() => {
//         console.log('NEXT!!');
//         mpris.Player.Next();
//       }, 20000);
//     });
//     console.log(mpris.Player.Playlists);
//   });
// });

mpris.connect('mpd', (error) => {
  console.log(mpris.Player.Playlists);
  mpris.Player.Play();
  mpris.Player.Next();
  setTimeout(() => {
    console.log('NEXT!!');
    mpris.Player.Next();
  }, 20000);
  console.log(error);
  console.log(mpris.Player.Playlists);
});
