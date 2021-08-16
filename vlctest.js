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
        // await nextTrack(controller, 2);
        // for (let j = 0; j < 10; j++) {
        //     await skipForward(controller, 10, 2);
        // }
        await skipForward(controller, 10, 2);
    }
}


(async () => {
    const player = new vlcPlayer('/Users/juliancrouch/Documents/CUTS.m3u', vlcOptions);

// log current track time every second
//     player.on('statuschange', (error, status) => {
//         console.log('current time', status.time);
//     });

    const controller = new vlcController.Client({
        ip: "localhost",
        port: 8080,
        password: `vlc`
    });

    // for (let i = 0; i < 5; i++) {
    //     // await nextTrack(controller, 2);
    //     // for (let j = 0; j < 10; j++) {
    //     //     await skipForward(controller, 10, 2);
    //     // }
    //     await skipForward(controller, 10, 2);
    // }

    await doStuff(controller);
    // await controller.stop();
    await controller.togglePlay();
    while (await controller.isPlaying()) {
        console.log(`Attempting pause.`)
        await controller.togglePlay();
    }
    // await controller.pause();
    // console.log(controller.isPlaying());
    console.log(`paused?`);
    await sleep(5);
    await controller.play();
    console.log(await controller.isPlaying());
    console.log(`played?`);
    // await controller.pause();
    // console.log(`paused again?`);

})();
