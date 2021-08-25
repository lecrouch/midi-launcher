const vlcPlayer = require('vlc-simple-player');
const vlcController = require("vlc-client");

const vlcOptions = {
  arguments: [
      `--loop`,
      `--no-video-title`,
      `--random`,
      `--no-audio`,
      `--width=1920`,
      `--height=1080`,
      `--aspect-ratio=16x9`,
  ],
    password: `vlc`,
    port: 8080
};

const VLC_PLAYLISTS = [
    `/Users/juliancrouch/StreamingAssets/video-clips/combined.m3u`,
    `/Users/juliancrouch/StreamingAssets/video-clips/beeple-tunnels-pl.m3u`,
    `/Users/juliancrouch/StreamingAssets/video-clips/beeple-four-color-pl.m3u`,
    `/Users/juliancrouch/StreamingAssets/video-clips/beeple-vj-pl.m3u`
];

function sleep(seconds ) {
    return new Promise(resolve => setTimeout(resolve, seconds * 1000));
}


async function nextTrack(connection, rate) {
    await sleep(rate);
    console.log(`Slept for ${rate} seconds`);
    await connection.next();
    console.log(`skipped to next track`);
}

async function skipForward(connection, seconds, rate) {
    await sleep(rate);
    console.log(`Slept for ${rate} seconds`);
    await connection.jumpForward(seconds);
    console.log(`skipped forward ${seconds} seconds`);
}

async function doStuff(controller) {
    for (let i = 0; i < 5; i++) {
        await nextTrack(controller, 2);
        for (let j = 0; j < 10; j++) {
            await skipForward(controller, 10, 2);
        }
        await skipForward(controller, 10, 2);
    }
}

async function pauseVlcPlayback(controller) {
    while (await controller.isPlaying()) {
        console.log(`Attempting pause.`);
        await controller.pause();
    }
    console.log(`Paused.`);
}


(async () => {
    const player = new vlcPlayer(VLC_PLAYLISTS[0], vlcOptions);

// log current track time every second
//     player.on('statuschange', (error, status) => {
//         console.log('current time', status.time);
//     });

    const controller = new vlcController.Client({
        ip: "localhost",
        port: 8080,
        password: `vlc`
    });
    await sleep(2);
    await pauseVlcPlayback(controller);

    // await sleep(40);

    // for (let i = 0; i < 5; i++) {
    //     // await nextTrack(controller, 2);
    //     // for (let j = 0; j < 10; j++) {
    //     //     await skipForward(controller, 10, 2);
    //     // }
    //     await skipForward(controller, 10, 2);
    // }

    // await doStuff(controller);
    // await controller.stop();
    // await controller.togglePlay();
    // while (await controller.isPlaying()) {
    //     console.log(`Attempting pause.`)
    //     await controller.togglePlay();
    // }
    // // await controller.pause();
    // // console.log(controller.isPlaying());
    // console.log(`paused?`);
    // await sleep(5);
    // await controller.play();
    // console.log(await controller.isPlaying());
    // console.log(`played?`);
    // await controller.pause();
    // console.log(`paused again?`);
    await sleep(10);
    // await controller.emptyPlaylist();
    let playlist = await controller.getPlaylist();
    let playlistLength = playlist.length;
    console.log(`playlist 1 received`);

    // await sleep(10);
    await controller.playFile(VLC_PLAYLISTS[1], {noaudio: true});
    let secondPlaylist = await controller.getPlaylist();
    let secondPlaylistLength = secondPlaylist.length;
    console.log(`playlist 2 received`);
    await pauseVlcPlayback(controller);
    for (let i = 0; i < playlistLength; i++) {
        await controller.removeFromPlaylist(i);
    }
    await sleep(3);
})();
