// MIDI Control
const easymidi = require('easymidi');
// VLC Control
const vlcPlayer = require('vlc-simple-player');
const vlcController = require("vlc-client");
// OBS Control
const OBSWebSocket = require('obs-websocket-js');
// Keymap & Settings Control
const { readFileSync } = require(`fs`);

const midiControllerName = `Arturia BeatStep`;
const vlcFilePath = `/Users/juliancrouch/Documents/CUTS.m3u`;
const OBS_CONTROLLER = new OBSWebSocket();
let VLC_CONTROLLER;

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

let vlcLoopControl = {
    sleepDuration: 0,
    fastForwardSeconds: 0,
    nextTrackLoopCounter: 0,
    fastForwardLoopCounter: 0
}

// Unused now, but will build out a "vlc kill switch" in the future
async function killVlcLoops() {
    vlcLoopControl.sleepDuration = 0;
    vlcLoopControl.fastForwardSeconds = 0;
    vlcLoopControl.nextTrackLoopCounter = 0;
    vlcLoopControl.fastForwardLoopCounter = 0;
    await pauseVlcPlayback();
}

const keyMap = JSON.parse(readFileSync(`midi_key_map.json`));

const obsOptions = {
    address: 'localhost:4444',
    password: 'shytiegr'
};



async function establishObsConnection() {
    // const connection = await OBS.connect(obsOptions);
    await OBS_CONTROLLER.connect(obsOptions);
    console.log(`Success! We're connected & authenticated.`);
}

async function executeMidiKeyTrigger(hotkeyData) {
    // let obsHotkey = `OBS_KEY_1`;
    await executeObsHotkey(hotkeyData.key, hotkeyData.keyModifiers);
    console.log(`OBS Hotkey using ${hotkeyData.key} successfully sent`);
    if (VLC_CONTROLLER && hotkeyData.vlc) {
        vlcLoopControl.sleepDuration = hotkeyData.vlc.sleepDuration;
        vlcLoopControl.fastForwardSeconds = hotkeyData.vlc.fastForwardSeconds;
        vlcLoopControl.nextTrackLoopCounter = hotkeyData.vlc.nextTrackLoopCounter;
        vlcLoopControl.fastForwardLoopCounter = hotkeyData.vlc.fastForwardLoopCounter;
        await vlcVideoChop();
    }
}

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
    new vlcPlayer(filepath, options);

    const controller = await new vlcController.Client({
        ip: "localhost",
        port: 8080,
        password: `vlc`
    });

    await sleep(2);
    await controller.pause();
    return controller;
}

async function pauseVlcPlayback() {
    while (await VLC_CONTROLLER.isPlaying()) {
        console.log(`Attempting pause.`);
        await VLC_CONTROLLER.togglePlay();
    }
    console.log(`Paused.`);
}

async function nextVlcTrack(sleepDuration) {
    await sleep(sleepDuration);
    console.log(`Slept for ${sleepDuration} seconds`);
    await VLC_CONTROLLER.next();
    console.log(`skipped to next track`);
}

async function randomVlcSkipTracks() {
    for (let i = 0; i < getRandomInt(1, 5); i++) {
        await VLC_CONTROLLER.next();
        sleep(0.2);
    }
    await VLC_CONTROLLER.pause();
}


async function fastForwardVlcTrack(fastForwardSeconds, sleepDuration) {
    await sleep(sleepDuration);
    console.log(`Slept for ${sleepDuration} seconds`);
    await VLC_CONTROLLER.jumpForward(fastForwardSeconds);
    console.log(`skipped forward ${fastForwardSeconds} seconds`);
}


async function vlcVideoChop() {
    console.log(`Priming new starting point`);
    // await randomVlcSkipTracks();
    console.log(`starting chop loop`);
    for (let i = 0; i < vlcLoopControl.nextTrackLoopCounter; i++) {
        await nextVlcTrack( vlcLoopControl.sleepDuration);
        for (let j = 0; j < vlcLoopControl.fastForwardLoopCounter; j++) {
            await fastForwardVlcTrack( vlcLoopControl.fastForwardSeconds, vlcLoopControl.sleepDuration);
        }
    }
    // await pauseVlcPlayback();
    await VLC_CONTROLLER.pause();
    console.log(`chop loop done.`);
    await executeMidiKeyTrigger(keyMap.defaultScene);
}

function registerObsListeners() {
    OBS_CONTROLLER.on('SwitchScenes', data => {
        console.log(`New Active Scene: ${data.sceneName}`);
    });
    OBS_CONTROLLER.on('error', err => {
        console.error('socket error:', err);
    });
}
async function executeObsHotkey(key, keyModifiers) {
    return await OBS_CONTROLLER.send(`TriggerHotkeyBySequence`, {
        keyId: key,
        keyModifiers: keyModifiers
    });
}

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1) + min);
}

(async () => {
    setupMIDI(midiControllerName);
    VLC_CONTROLLER = await initializeVLC(vlcFilePath, vlcOptions);
    await randomVlcSkipTracks();
    await establishObsConnection();
    registerObsListeners();


    input.on('noteon', (args) => {
        console.log('noteon', args);
        let midiString = `c` + (args.channel + 1) + `n` + args.note;
        if (keyMap[midiString]) {
            executeMidiKeyTrigger(keyMap[midiString]);
        } else {
            console.log(`No midi trigger set for channel ${args.channel} and note ${args.note}`);
        }
    });
})();
