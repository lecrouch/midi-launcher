// MIDI Control
const easymidi = require('easymidi');
// VLC Control
const vlcPlayer = require('vlc-simple-player');
const vlcController = require("vlc-client");

const midiControllerName = `Arturia BeatStep`;

const vlcFilePath = `/Users/juliancrouch/Documents/CUTS.m3u`;

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

function setupMIDI(controllerName) {
    var inputs = easymidi.getInputs();
    var outputs = easymidi.getOutputs();
    console.log('Inputs found:', inputs);
    console.log('Outputs found:', outputs);

    console.log('Looking for proper input/output...');
    for (i = 0, input = null; input = inputs[i++];) {
        if (~input.indexOf(controllerName)) {
            console.log(`Found matching input "${input}" at index ${i - 1}.`);
            global.input = new easymidi.Input(input);
            break;
        }
    }

    if (!global.input) {
        console.error(`No controller matching "${controllerName}" was found. Quitting...`);
        process.exit();
        return;
    }
}

async function initializeVLC(filepath, options) {
    new vlcPlayer(vlcFilePath, vlcOptions);

    const controller = new vlcController.Client({
        ip: "localhost",
        port: 8080,
        password: `vlc`
    });

    // For whatever reason a sleep seems necessary to get this promise to resolve properly...
    await sleep(1);
    await pausePlayback(controller);
    return controller;
}

async function pausePlayback(controller) {
    while (await controller.isPlaying()) {
        console.log(`Attempting pause.`);
        await controller.togglePlay();
    }
    console.log(`Paused.`);
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

async function tester(midiInput, controller) {
    midiInput.on('noteon', (args) => {
        console.log('noteon', args);
        if (args.note === 43) {
            doStuff(controller);
        }
    });
}

async function doStuff(controller) {
    console.log(`starting chop loop`);
    for (let i = 0; i < 2; i++) {
        await nextTrack(controller, 2);
        for (let j = 0; j < 2; j++) {
            await skipForward(controller, 10, 2);
        }
    }
    console.log(`chop loop done.`);
    await pausePlayback(controller);
}

(async () => {

    setupMIDI(midiControllerName);

    const controller = await initializeVLC(vlcFilePath, vlcOptions);
    // await doStuff(controller);
    // await sleep(1);
    // await pausePlayback(controller);

    await tester(input, controller);

    // for (let i = 0; i < 1000; i++) {
    //     if (keyChecker(input, 43)) {
    //         console.log(`success`);
    //     } else {
    //         console.log(`nope`);
    //     }
    //     sleep(0.25);
    // }
})();
