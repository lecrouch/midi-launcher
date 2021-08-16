const OBSWebSocket = require('obs-websocket-js');

function sleep(seconds ) {
    return new Promise(resolve => setTimeout(resolve, seconds * 1000));
}

const obs = new OBSWebSocket();
// obs.connect({
//     address: 'localhost:4444',
//     password: 'shytiegr'
// })
//     .then(() => {
//         obs.send(`TriggerHotkeyByName`, {
//             hotkeyName: `RANDOM-CAM`
//         });
//     }).catch(err => { // Promise convention dicates you have a catch on every chain.
//     console.log(err);
// });


let connection = obs.connect({
    address: 'localhost:4444',
    password: 'shytiegr'
})
    .then(() => {
        console.log(`Success! We're connected & authenticated.`);

        return obs.send('GetSceneList');
    })
    .then(data => {
        console.log(`${data.scenes.length} Available Scenes!`);


        // obs.send('SetCurrentScene', {
        //     'scene-name': `MAIN -- GOPRO`
        // });
        //
        return new Promise(resolve => {
            resolve('successful');
        });

        // data.scenes.forEach(scene => {
        //     if (scene.name !== data.currentScene) {
        //         console.log(`Found a different scene! Switching to Scene: ${scene.name}`);
        //
        //         obs.send('SetCurrentScene', {
        //             'scene-name': scene.name
        //         });
        //     }
        // });
        // obs.send('TriggerHotkeyByName', {
        //     hotkeyName: `RANDOM-CAM`
        // });

    })
    .catch(err => { // Promise convention dicates you have a catch on every chain.
        console.log(err);
    });

obs.on('SwitchScenes', data => {
    console.log(`New Active Scene: ${data.sceneName}`);
});

// connection.then(() => {
//     // obs.send('SetCurrentScene', {
//     //     'scene-name': `INVERTED -- GOPRO`
//     // });
//
//     obs.send('TriggerHotkeyByName', {
//         'hotkeyName': `RANDOM-CAM`
//     });
// }).catch(err => { // Promise convention dicates you have a catch on every chain.
//     console.log(err);
// });

// connection.then(() => {
//     obs.send('TriggerHotkeyByName', {
//         'hotkeyName': `RANDOM-CAM`
//     });
// });

function key(connection) {
    connection.then((resolve, reject) => {
        obs.send(`TriggerHotkeyBySequence`, {
            keyId: `OBS_KEY_1`,
            keyModifiers: {
                command: true,
                control: true
            }
        });

        if (resolve) {
            console.log(resolve);
        }

        return new Promise(resolve => {
            resolve('successful');
        });
    }).catch(err => { // Promise convention dicates you have a catch on every chain.
        console.log(err);
    });
}

(async () => {
    await key(connection);
    await sleep(5);
    await key(connection);
})();

// You must add this handler to avoid uncaught exceptions.
obs.on('error', err => {
    console.error('socket error:', err);
});