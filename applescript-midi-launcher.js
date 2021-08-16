const applescriptMidiLauncher = require('easymidi');
const applescript = require('applescript');

var controller = `Arturia BeatStep`;

var inputs = applescriptMidiLauncher.getInputs();
var outputs = applescriptMidiLauncher.getOutputs();

function getAppleScriptForKey(key) {
  // Assumes hotkeys with COMMAND + key combo
  return `
  tell application "OBS"
    activate
    tell application "System Events"
      key code ${key} using {command down}
    end tell
  end tell
  `
}

function generateVLCAppleScript(secs) {
  const fastForward = `key code 124 using {command down, option down} \n delay ${secs}`;
  const nextTrack = `key code 124 using command down \n  delay ${secs}`;
  const pauseTrack = `key code 35 using command down \n delay ${secs}`;

  let script =
    `tell application "VLC"
    activate
    tell application "System Events"
  `;

  let scriptEnd = `end tell \nend tell`;

  script = script.concat(`\n`, nextTrack);

  for (let i = 0; i < 3; i++) {
    script = script.concat(`\n`, fastForward);
  }

  script = script.concat(`\n`, nextTrack);
  script = script.concat(`\n`, nextTrack);

  for (let i = 0; i < 5; i++) {
    script = script.concat(`\n`, fastForward);
  }
  for (let i = 0; i < 3; i++) {
    script = script.concat(`\n`, fastForward);
  }

  script = script.concat(`\n`, nextTrack);
  script = script.concat(`\n`, nextTrack);
  script = script.concat(`\n`, nextTrack);

  for (let i = 0; i < 4; i++) {
    script = script.concat(`\n`, fastForward);
  }

  script = script.concat(`\n`, nextTrack);
  script = script.concat(`\n`, nextTrack);

  script = script.concat(`\n`, pauseTrack);
  script = script.concat(`\n`, scriptEnd);

  return script;
}

function sleep(seconds ) {
  return new Promise(resolve => setTimeout(resolve, seconds * 1000));
}

console.log('Inputs found:', inputs);
console.log('Outputs found:', outputs);

console.log('Looking for proper input/output...');
for (i = 0, input = null; input = inputs[i++];) {
    if (~input.indexOf(controller)) {
        console.log(`Found matching input "${input}" at index ${i - 1}.`);
        global.input = new applescriptMidiLauncher.Input(input);
        break;
    }
}

if (!global.input) {
    console.error(`No controller matching "${controller}" was found. Quitting...`);
    process.exit();
    return;
}

/*
All Possible MIDI inputs:
=================================================================================
input.on('noteon', args => console.log('noteon', args));
input.on('poly aftertouch', args => console.log('poly aftertouch', args));
input.on('cc', args => console.log('cc', args));
input.on('program', args => console.log('program', args));
input.on('channel aftertouch', args => console.log('channel aftertouch', args));
input.on('pitch', args => console.log('pitch', args));
input.on('position', args => console.log('position', args));
input.on('mtc', args => console.log('mtc', args));
input.on('select', args => console.log('select', args));
input.on('sysex', args => console.log('sysex', args));
*/

// Looking for normal keypresses (Channel & Key, Velocity is ignored.)
input.on('noteon', (args) => {
  console.log('noteon', args);

// AppleScript key codes can be found here: https://eastmanreference.com/complete-list-of-applescript-key-codes

  if (args.channel === 0) {
    switch (args.note) {

      // ST LOGO :: CMD + 9 :: MIDI Key 36
      case 36: {
        applescript.execString(getAppleScriptForKey(25), (error, results) => {
          if (error) {
            console.error(error.message);
          }
        });
        break;
      }

      // 3D DECKS :: CMD + 3 :: MIDI Key 42
      case 42: {
        applescript.execString(getAppleScriptForKey(21), (error, results) => {
          if (error) {
            console.error(error.message);
          }
        });
        break;
      }

      // RANDOM CAMS :: CMD + 1 :: MIDI Key 43
      case 43: {
        applescript.execString(getAppleScriptForKey(18), (error, results) => {
          if (error) {
            console.error(error.message);
          }
        });
        break;
      }

      // 3D Heart :: CMD + 0 :: MIDI Key 44
      case 44: {
        applescript.execString(getAppleScriptForKey(29), (error, results) => {
          if (error) {
            console.error(error.message);
          }
        });
        break;
      }

      // 3D GOPRO :: CMD + 4 :: MIDI Key 50
      case 50: {
        applescript.execString(getAppleScriptForKey(20), (error, results) => {
          if (error) {
            console.error(error.message);
          }
        });
        break;
      }

      // NO CAMS :: CMD + 2 :: MIDI Key 51
      case 51: {
        applescript.execString(getAppleScriptForKey(19), (error, results) => {
          if (error) {
            console.error(error.message);
          }
        });
        break;
      }

      case 39: {
        applescript.execString(getAppleScriptForKey(28), (error, results) => {
          if (error) {
            console.error(error.message);
          }
        });
        break;
      }

      case 40: {
        applescript.execString(getAppleScriptForKey(26), (error, results) => {
          if (error) {
            console.error(error.message);
          }
        });
        break;
      }

      case 47: {
        applescript.execString(generateVLCAppleScript(0.5), (error, results) => {
          if (error) {
            console.error(error.message);
          }
        });
        break;
      }

      case 48: {
        applescript.execString(generateVLCAppleScript(1), (error, results) => {
          if (error) {
            console.error(error.message);
          }
        });
        break;
      }

      // case 46: {
      //   applescript.execString(generateVLCAppleScript(.1), (error, results) => {
      //     if (error) {
      //       console.error(error.message);
      //     }
      //   });
      //   break;
      // }

      default:
        console.log(`Error: Channel ${args.channel} & Key ${args.note} not mapped.`);
        break;
    }
  }
});
