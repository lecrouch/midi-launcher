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
// const vlcFilePath = `/Users/juliancrouch/Documents/CUTS.m3u`;
const vlcFilePath = `/Users/juliancrouch/StreamingAssets/video-clips/combined.m3u`;
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

let BPM = 128;
let MASTER_LOOP = false;
let ROTARY_VALUES = {};
let VLC_PLAYLIST_INDEX = 0;
const VLC_PLAYLISTS = [
    `/Users/juliancrouch/StreamingAssets/video-clips/combined.m3u`,
    `/Users/juliancrouch/StreamingAssets/video-clips/beeple-tunnels-pl.m3u`,
    `/Users/juliancrouch/StreamingAssets/video-clips/beeple-four-color-pl.m3u`,
    `/Users/juliancrouch/StreamingAssets/video-clips/beeple-vj-pl.m3u`
];
const LOOPING_SCENES = [
    `HORIZ LUT STRIPE -- GOPRO`,
    `VERT LUT STRIPE -- GOPRO`,
    `DUB HORIZ LUT STRIPE -- GOPRO`,
    `DUB VERT LUT STRIPE -- GOPRO`,
    `LUT RESIZE SPIRAL -- GOPRO`,
    `LUTS -- GOPRO`,
    `STROBE -- GOPRO`
];

let vlcLoopControl = {
    fastForwardSeconds: 3,
    nextTrackLoopCounter: 5,
    fastForwardLoopCounter: 5
}

const keyMap = JSON.parse(readFileSync(`midi_key_map.json`));

const obsOptions = {
    address: 'localhost:4444',
    password: 'shytiegr'
};

// Unused now, but will build out a "vlc kill switch" in the future
async function killVlcLoops() {
    vlcLoopControl.fastForwardSeconds = 0;
    vlcLoopControl.nextTrackLoopCounter = 0;
    vlcLoopControl.fastForwardLoopCounter = 0;
    await pauseVlcPlayback();
}

async function establishObsConnection() {
    // const connection = await OBS.connect(obsOptions);
    await OBS_CONTROLLER.connect(obsOptions);
    console.log(`Success! We're connected & authenticated.`);
}

async function executeMidiKeyTrigger(hotkeyData) {
    // if (hotkeyData.requresLoop) {
    //     MASTER_LOOP = true;
    // }
    MASTER_LOOP = false;

    if (hotkeyData.key) {
        await selectObsSceneByHotkey(hotkeyData.key, hotkeyData.keyModifiers);
        console.log(`Request sent to change OBS scene to "${hotkeyData.details.sceneName}" via hotkey: ${hotkeyData.key}`);
    } else {
        await selectObsSceneByName(hotkeyData.details.sceneName);
        console.log(`Request sent to change OBS scene to "${hotkeyData.details.sceneName}" via scene name`);
    }
    if (VLC_CONTROLLER && hotkeyData.vlc) {
        await vlcVideoChop();
    }
}

async function executeMidiRotaryController(hotkeyData, midiString, value) {
    let modifier = 0;
    let newValue = false;

    if ( ! (midiString in ROTARY_VALUES)) {
        ROTARY_VALUES[midiString] = 64;
        newValue = true;
    }

    if (ROTARY_VALUES[midiString] < value) {
        if ( ! newValue) {
            modifier = 1;
        }
    } else {
        if ( ! newValue) {
            modifier = -1;
        }
    }

    if ( ! newValue) {
        ROTARY_VALUES[midiString] = value;
    }

    switch (hotkeyData.operation) {
        case `BPM`: {
            BPM += modifier;
            console.log(`BPM Set To: ${BPM}, (${60/BPM} seconds)`);
        }
        break;

        case `fastForwardSeconds`: {
            vlcLoopControl.fastForwardSeconds += modifier;
            console.log(`VLC Fast Forward Seconds Set To: ${vlcLoopControl.fastForwardSeconds}`);
            break;
        }

        case `nextTrackLoopCounter`: {
            vlcLoopControl.nextTrackLoopCounter += modifier;
            console.log(`VLC Next Track Loop Counter Set To: ${vlcLoopControl.nextTrackLoopCounter} Loops`);
            break;
        }

        case `fastForwardLoopCounter`: {
            vlcLoopControl.fastForwardLoopCounter += modifier;
            console.log(`VLC Fast Forward Loop Counter Set To: ${vlcLoopControl.fastForwardLoopCounter} Loops`);
            break;
        }

        case `vlcPlaylistSelect`: {
            let arraySize = VLC_PLAYLISTS.length;
            VLC_PLAYLIST_INDEX += modifier;
            if (VLC_PLAYLIST_INDEX < 0) {
                VLC_PLAYLIST_INDEX = arraySize;
            }
            if (VLC_PLAYLIST_INDEX > arraySize) {
                VLC_PLAYLIST_INDEX = 0;
            }

            let oldPlaylist = await VLC_CONTROLLER.getPlaylist();
            console.log(oldPlaylist.length);
            await VLC_CONTROLLER.playFile(VLC_PLAYLISTS[VLC_PLAYLIST_INDEX], {noaudio: true});
            await pauseVlcPlayback();
            let newplaylist = await VLC_CONTROLLER.getPlaylist();
            console.log(newplaylist.length);
            for (let i = 0; i < oldPlaylist.length; i++) {
                await VLC_CONTROLLER.removeFromPlaylist(i);
                await sleep(1);
            }
            // await sleep(1);
            let newnewplaylist = await VLC_CONTROLLER.getPlaylist();
            console.log(newnewplaylist.length);
            console.log(`Playlist: ${VLC_PLAYLISTS[VLC_PLAYLIST_INDEX]} loaded!`);
            break;
        }

        default: {
            console.log(`No Rotary Encoder Operation Defined`);
        }
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
        await sleep(0.2);
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
        await nextVlcTrack( 60 / BPM);
        for (let j = 0; j < vlcLoopControl.fastForwardLoopCounter; j++) {
            await fastForwardVlcTrack( vlcLoopControl.fastForwardSeconds, 60 / BPM);
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
        if (LOOPING_SCENES.includes(data.sceneName)) {
            executeLoopingScene(data);
        }
    });
    OBS_CONTROLLER.on('error', err => {
        console.error('socket error:', err);
    });
}

async function selectObsSceneByHotkey(key, keyModifiers) {
    await OBS_CONTROLLER.send(`TriggerHotkeyBySequence`, {
        keyId: key,
        keyModifiers: keyModifiers
    });
}

async function selectObsSceneByName(sceneName) {
    await OBS_CONTROLLER.send(`SetCurrentScene`, {
        'scene-name': sceneName
    });
}

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1) + min);
}

async function getCurrentScene() {
    return await OBS_CONTROLLER.send(`GetCurrentScene`);
}

function getRelevantSceneItems(sceneItems, partialName) {
    let names = sceneItems.map(item => {
        if (item.type === `scene` && item.name.includes(partialName)) {
            return item.name;
        }
    });
    return names.filter( name => {
        return typeof name === `string`;
    });
}

async function toggleAllOffAndReset(sceneName, itemNames) {
    for (const name of itemNames) {
        await OBS_CONTROLLER.send(`SetSceneItemProperties`, {
            'scene-name': sceneName,
            item: {
                name: name
            },
            visible: false,
            crop: {
                top: 0,
                bottom: 0,
                left: 0,
                right: 0
            },
            position: {
                x: 0,
                y: 0
            }
        });
    }
}

async function resetSceneItem(scene, itemName) {
    await OBS_CONTROLLER.send(`SetSceneItemProperties`, {
        'scene-name': scene.name,
        item: {
            name: itemName
        },
        crop: {
            top:  0,
            bottom: 0,
            left: 0,
            right: 0
        },
        position: {
            x: 0,
            y: 0
        },
        visible: true
    });
}

async function lutCycle(scene) {
    const itemNames = getRelevantSceneItems(scene.sources, `gopro`)
    await toggleAllOffAndReset(scene.name, itemNames);
    let lastName = ``;
    while (MASTER_LOOP) {
        for (let j = 0; j < itemNames.length; j++) {
            await OBS_CONTROLLER.send(`SetSceneItemProperties`, {
                'scene-name': scene.name,
                item: {
                    name: itemNames[j]
                },
                visible: true
            });
            if (lastName) {
                await OBS_CONTROLLER.send(`SetSceneItemProperties`, {
                    'scene-name': scene.name,
                    item: {
                        name: lastName
                    },
                    visible: false
                });
            }
            lastName = itemNames[j];
            await sleep(60 / BPM);
        }
    }
}

async function transformSpin(scene) {
    while (MASTER_LOOP) {
        // console.log(`cropping top 540:, y: 540`);
        await OBS_CONTROLLER.send(`SetSceneItemProperties`, {
            'scene-name': scene.name,
            item: {
                name: `gopro - neon`
            },
            crop: {
                top: 540,
                bottom: 0,
                left: 0,
                right: 0
            },
            position: {
                x: 0,
                y: 540
            }
        });
        await sleep(60 / BPM);
        // console.log(`cropping right: 960, x: -960`);
        await OBS_CONTROLLER.send(`SetSceneItemProperties`, {
            'scene-name': scene.name,
            item: {
                name: `gopro - neon`
            },
            crop: {
                top: 0,
                bottom: 0,
                left: 0,
                right: 960
            },
            position: {
                x: 0,
                y: 0
            }
        });
        await sleep(60 / BPM);
        // console.log(`cropping bottom: 540, y: 0`);
        await OBS_CONTROLLER.send(`SetSceneItemProperties`, {
            'scene-name': scene.name,
            item: {
                name: `gopro - neon`
            },
            crop: {
                top: 0,
                bottom: 540,
                left: 0,
                right: 0
            },
            position: {
                x: 0,
                y: 0
            }
        });
        await sleep(60 / BPM);
        // console.log(`cropping left: 960, x: 960`);
        await OBS_CONTROLLER.send(`SetSceneItemProperties`, {
            'scene-name': scene.name,
            item: {
                name: `gopro - neon`
            },
            crop: {
                top: 0,
                bottom: 0,
                left: 960,
                right: 0
            },
            position: {
                x: 960,
                y: 0
            }
        });
        await sleep(60 / BPM);

        if ( !  MASTER_LOOP) {
            await resetSceneItem(scene, `gopro - neon`);
        }
    }
}

async function lutHorizStripe(scene) {
    const size = 135;
    while (MASTER_LOOP) {
        for (let i = 0; i < 8; i++ ) {
            await OBS_CONTROLLER.send(`SetSceneItemProperties`, {
                'scene-name': scene.name,
                item: {
                    name: `gopro - neon`
                },
                crop: {
                    top: i * size,
                    bottom: 1080 - ((i + 1) * size),
                    left: 0,
                    right: 0
                },
                position: {
                    x: 0,
                    y: i * size
                }
            });
            await sleep(60 / BPM);
        }
        for (let i = 6; i > 0; i-- ) {
            await OBS_CONTROLLER.send(`SetSceneItemProperties`, {
                'scene-name': scene.name,
                item: {
                    name: `gopro - neon`
                },
                crop: {
                    top: i * size,
                    bottom: 1080 - ((i + 1) * size),
                    left: 0,
                    right: 0
                },
                position: {
                    x: 0,
                    y: i * size
                }
            });
            await sleep(.60 / BPM);
        }
        if ( !  MASTER_LOOP) {
            await resetSceneItem(scene, `gopro - neon`);
        }
    }
}

async function lutVertStripe(scene) {
    const size = 240;
    while (MASTER_LOOP) {
        for (let i = 0; i < 8; i++ ) {
            await OBS_CONTROLLER.send(`SetSceneItemProperties`, {
                'scene-name': scene.name,
                item: {
                    name: `gopro - inverted`
                },
                crop: {
                    top: 0,
                    bottom: 0,
                    left: i * size,
                    right: 1920 - ((i + 1) * size)
                },
                position: {
                    x: i * size,
                    y: 0
                }
            });
            await sleep(60 / BPM);
        }
        for (let i = 6; i > 0; i-- ) {
            await OBS_CONTROLLER.send(`SetSceneItemProperties`, {
                'scene-name': scene.name,
                item: {
                    name: `gopro - inverted`
                },
                crop: {
                    top: 0,
                    bottom: 0,
                    left: i * size,
                    right: 1920 - ((i + 1) * size)
                },
                position: {
                    x: i * size,
                    y: 0
                }
            });
            await sleep(60 / BPM);
        }

        if ( ! MASTER_LOOP) {
            await resetSceneItem(scene, `gopro - inverted`);
        }
    }
}

async function doubleLutHorizStripe(scene) {
    const size = 135;
    let counter = 0;
    while (MASTER_LOOP) {
        counter = 8;
        for (let i = 0; i < 4; i++ ) {
            // console.log(`top loop i = ${i}`);
            await OBS_CONTROLLER.send(`SetSceneItemProperties`, {
                'scene-name': scene.name,
                item: {
                    name: `gopro - magenta orange`
                },
                crop: {
                    top: i * size,
                    bottom: 1080 - ((i + 1) * size),
                    left: 0,
                    right: 0
                },
                position: {
                    x: 0,
                    y: i * size
                }
            });

            await OBS_CONTROLLER.send(`SetSceneItemProperties`, {
                'scene-name': scene.name,
                item: {
                    name: `gopro - magenta orange 2`
                },
                crop: {
                    top:  (counter - 1) * size,
                    bottom: i * size,
                    left: 0,
                    right: 0
                },
                position: {
                    x: 0,
                    y: (counter - 1) * size
                }
            });
            counter--;
            await sleep(60 / BPM);
        }

        counter = 5;
        for (let i = 2; i > 0; i-- ) {
            // console.log(`bottom loop i = ${i}`);
            await OBS_CONTROLLER.send(`SetSceneItemProperties`, {
                'scene-name': scene.name,
                item: {
                    name: `gopro - magenta orange`
                },
                crop: {
                    top: i * size,
                    bottom: 1080 - ((i + 1) * size),
                    left: 0,
                    right: 0
                },
                position: {
                    x: 0,
                    y: i * size
                }
            });

            await OBS_CONTROLLER.send(`SetSceneItemProperties`, {
                'scene-name': scene.name,
                item: {
                    name: `gopro - magenta orange 2`
                },
                crop: {
                    top:  (counter) * size,
                    bottom: i * size,
                    left: 0,
                    right: 0
                },
                position: {
                    x: 0,
                    y: (counter) * size
                }
            });
            counter++;
            await sleep(60 / BPM);
        }
        if ( ! MASTER_LOOP) {
            await resetSceneItem(scene, `gopro - magenta orange`);
            await resetSceneItem(scene, `gopro - magenta orange 2`);
        }
    }
}

async function doubleLutVertStripe(scene) {
    const size = 240;
    let counter = 0;
    while (MASTER_LOOP) {
        counter = 8;
        for (let i = 0; i < 4; i++ ) {
            // console.log(`top loop i = ${i}`);
            await OBS_CONTROLLER.send(`SetSceneItemProperties`, {
                'scene-name': scene.name,
                item: {
                    name: `gopro - infrared`
                },
                crop: {
                    top: 0,
                    bottom: 0,
                    left: i * size,
                    right: 1920 - ((i + 1) * size)
                },
                position: {
                    x: i * size,
                    y: 0
                }
            });

            await OBS_CONTROLLER.send(`SetSceneItemProperties`, {
                'scene-name': scene.name,
                item: {
                    name: `gopro - infrared 2`
                },
                crop: {
                    top:  0,
                    bottom: 0,
                    left: (counter - 1) * size,
                    right: i * size
                },
                position: {
                    x: (counter - 1) * size,
                    y: 0
                }
            });
            counter--;
            await sleep(60 / BPM);
        }

        counter = 5;
        for (let i = 2; i > 0; i-- ) {
            // console.log(`bottom loop i = ${i}`);
            await OBS_CONTROLLER.send(`SetSceneItemProperties`, {
                'scene-name': scene.name,
                item: {
                    name: `gopro - infrared`
                },
                crop: {
                    top: 0,
                    bottom: 0,
                    left: i * size,
                    right: 1920 - ((i + 1) * size)
                },
                position: {
                    x: i * size,
                    y: 0
                }
            });

            await OBS_CONTROLLER.send(`SetSceneItemProperties`, {
                'scene-name': scene.name,
                item: {
                    name: `gopro - infrared 2`
                },
                crop: {
                    top:  0,
                    bottom: 0,
                    left: (counter) * size,
                    right: i * size
                },
                position: {
                    x: (counter) * size,
                    y: 0
                }
            });
            counter++;
            await sleep(60 / BPM);
        }
        if ( ! MASTER_LOOP) {
            await resetSceneItem(scene, `gopro - infrared`);
            await resetSceneItem(scene, `gopro - infrared 2`);
        }
    }
}

async function strobe(scene) {
    // const itemNames = getRelevantSceneItems(scene.sources, `strobe`)
    let toggleState = true;
    for (let i = 0; i < 400; i++) {
        await OBS_CONTROLLER.send(`SetSceneItemProperties`, {
            'scene-name': scene.name,
            item: {
                name: `1080p strobe`
            },
            visible: toggleState
        });
        toggleState = !toggleState;
        await sleep(0.01);
    }
}

async function executeLoopingScene(scene) {
    MASTER_LOOP = true
    switch (scene.sceneName) {
        case `HORIZ LUT STRIPE -- GOPRO`: {
            await lutHorizStripe(scene);
            break;
        }
        case `VERT LUT STRIPE -- GOPRO`: {
            await lutVertStripe(scene);
            break;
        }
        case `DUB HORIZ LUT STRIPE -- GOPRO`: {
            await doubleLutHorizStripe(scene);
            break;
        }
        case `DUB VERT LUT STRIPE -- GOPRO`: {
            await doubleLutVertStripe(scene);
            break;
        }
        case `LUT RESIZE SPIRAL -- GOPRO`: {
            await transformSpin(scene);
            break;
        }
        case `LUTS -- GOPRO`: {
            await lutCycle(scene);
            break;
        }
        case `STROBE -- GOPRO`: {
            await strobe(scene);
            break;
        }
        default: {
            break;
        }
    }
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

    input.on('cc', args => {
        console.log('cc', args);
        let midiString = `c` + (args.channel + 1) + `c` + args.controller;
        if (keyMap[midiString]) {
            executeMidiRotaryController(keyMap[midiString], midiString, args.value);
        } else {
            console.log(`No midi trigger set for channel ${args.channel} and controller ${args.controller}`);
        }
    });
})();
