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
    obs.on(`SceneItemVisibilityChanged`, data => {
        console.log(`${data['scene-name']}: Item ${data['item-name']} has changed visibility to ${data['item-visible']}`);
    });
    // obs.on(`SceneItemTransformChanged`, data => {
    //     console.log(`${data['scene-name']}: Item ${data['item-name']} has been transformed ${JSON.stringify(data['transform'])}`);
    // });
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

async function toggleAllOff(sceneName, itemNames) {
    for (const name of itemNames) {
        await obs.send(`SetSceneItemProperties`, {
            'scene-name': sceneName,
            item: {
                name: name
            },
            visible: false
        });
    }
}

async function lutSwapper(scene) {
    const itemNames = getRelevantSceneItems(scene.sources, `gopro`)
    await toggleAllOff(`lut test`, itemNames);
    let lastName = ``;
    for (let i = 0; i < 5; i++) {
        for (let j = 0; j < itemNames.length; j++) {
            await obs.send(`SetSceneItemProperties`, {
                'scene-name': scene.name,
                item: {
                    name: itemNames[j]
                },
                visible: true
            });
            if (lastName) {
                await obs.send(`SetSceneItemProperties`, {
                    'scene-name': scene.name,
                    item: {
                        name: lastName
                    },
                    visible: false
                });
            }
            lastName = itemNames[j];
            await sleep(1);
        }
    }
}

async function transformSpin(scene) {
    for (let i = 0; i < 5; i++) {
        console.log(`cropping top 540:, y: 540`);
        await obs.send(`SetSceneItemProperties`, {
            'scene-name': scene.name,
            item: {
                name: `gopro - inverted`
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
        await sleep(0.5);
        console.log(`cropping right: 960, x: -960`);
        await obs.send(`SetSceneItemProperties`, {
            'scene-name': scene.name,
            item: {
                name: `gopro - inverted`
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
        await sleep(0.5);
        console.log(`cropping bottom: 540, y: 0`);
        await obs.send(`SetSceneItemProperties`, {
            'scene-name': scene.name,
            item: {
                name: `gopro - inverted`
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
        await sleep(0.5);
        console.log(`cropping left: 960, x: 960`);
        await obs.send(`SetSceneItemProperties`, {
            'scene-name': scene.name,
            item: {
                name: `gopro - inverted`
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
        await sleep(0.5);
        await obs.send(`SetSceneItemProperties`, {
            'scene-name': scene.name,
            item: {
                name: `gopro - inverted`
            },
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


async function lutHorizStripe(scene) {
    const size = 135; // 108
    for (let j = 0; j < 10; j++) {
        for (let i = 0; i < 8; i++ ) {
            await obs.send(`SetSceneItemProperties`, {
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
            await sleep(.3);
        }
        for (let i = 6; i > 0; i-- ) {
            await obs.send(`SetSceneItemProperties`, {
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
            await sleep(.3);
        }
    }
}

async function lutVertStripe(scene) {
    const size = 240;
    for (let j = 0; j < 10; j++) {
        for (let i = 0; i < 8; i++ ) {
            await obs.send(`SetSceneItemProperties`, {
                'scene-name': scene.name,
                item: {
                    name: `gopro - neon`
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
            await sleep(.3);
        }
        for (let i = 6; i > 0; i-- ) {
            await obs.send(`SetSceneItemProperties`, {
                'scene-name': scene.name,
                item: {
                    name: `gopro - neon`
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
            await sleep(.3);
        }
    }
}

async function doubleLutHorizStripe(scene) {
    const size = 135;
    let counter = 0;
    for (let j = 0; j < 10; j++) {
        counter = 8;
        for (let i = 0; i < 4; i++ ) {
            console.log(`top loop i = ${i}`);
            await obs.send(`SetSceneItemProperties`, {
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

            await obs.send(`SetSceneItemProperties`, {
                'scene-name': scene.name,
                item: {
                    name: `gopro - reds`
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
            await sleep(0.4);
        }

        counter = 5;
        for (let i = 2; i > 0; i-- ) {
            console.log(`bottom loop i = ${i}`);
            await obs.send(`SetSceneItemProperties`, {
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

            await obs.send(`SetSceneItemProperties`, {
                'scene-name': scene.name,
                item: {
                    name: `gopro - reds`
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
            await sleep(0.4);
        }
    }
}

async function doubleLutVertStripe(scene) {
    const size = 240;
    let counter = 0;
    for (let j = 0; j < 10; j++) {
        counter = 8;
        for (let i = 0; i < 4; i++ ) {
            console.log(`top loop i = ${i}`);
            await obs.send(`SetSceneItemProperties`, {
                'scene-name': scene.name,
                item: {
                    name: `gopro - neon`
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

            await obs.send(`SetSceneItemProperties`, {
                'scene-name': scene.name,
                item: {
                    name: `gopro - reds`
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
            await sleep(0.4);
        }

        counter = 5;
        for (let i = 2; i > 0; i-- ) {
            console.log(`bottom loop i = ${i}`);
            await obs.send(`SetSceneItemProperties`, {
                'scene-name': scene.name,
                item: {
                    name: `gopro - neon`
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

            await obs.send(`SetSceneItemProperties`, {
                'scene-name': scene.name,
                item: {
                    name: `gopro - reds`
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
            await sleep(0.4);
        }
    }
}

async function strobe(scene) {
    const itemNames = getRelevantSceneItems(scene.sources, `strobe`)
    // await toggleAllOff(`lut test`, itemNames);
    let toggleState = true;
    for (let i = 0; i < 200; i++) {
        await obs.send(`SetSceneItemProperties`, {
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

(async () => {
    let connection = await connectObs();
    registerListeners();

    // await executeObsHotkey(connection, `OBS_KEY_1`);
    // await sleep(5);
    // await executeObsHotkey(connection, `OBS_KEY_1`);
    // await obs.send(`SetCurrentScene`, {
    //     'scene-name': `lut test`
    // });
    await obs.send(`SetCurrentScene`, {
        'scene-name': `strobe test`
    });
    let scene = await obs.send(`GetCurrentScene`);
    // await lutSwapper(scene);
    // await transformSpin(scene);
    // await lutHorizStripe(scene);
    // await lutVertStripe(scene);
    // await doubleLutHorizStripe(scene);
    // await doubleLutVertStripe(scene);
    await strobe(scene);

    let hey = 0;


})();