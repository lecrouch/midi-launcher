const OBSWebSocket = require('obs-websocket-js');

function sleep(seconds ) {
    return new Promise(resolve => setTimeout(resolve, seconds * 1000));
}

const obs = new OBSWebSocket();

async function connectObs() {
    let connection = await obs.connect({
        address: 'localhost:4444',
        password: 'shytiegr'
    });
    console.log(`Success! We're connected & authenticated.`);
    return connection;
}

async function executeObsHotkey(connection, key) {
    return await obs.send(`TriggerHotkeyBySequence`, {
        keyId: key,
        keyModifiers: {
            command: true,
            control: false
        }
    });
}

function registerListeners() {
    obs.on('SwitchScenes', data => {
        console.log(`New Active Scene: ${data.sceneName}`);
    });
    obs.on('error', err => {
        console.error('socket error:', err);
    });
}

(async () => {
    let connection = await connectObs();
    registerListeners();

    await executeObsHotkey(connection, `OBS_KEY_1`);
    await sleep(5);
    await executeObsHotkey(connection, `OBS_KEY_1`);


})();