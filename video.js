const fs = require("fs");
const path = require("path");
const ffmpeg = require('fluent-ffmpeg');
const command = ffmpeg();
const asyncPool = require('tiny-async-pool');
// const Ciseaux = require("ciseaux/node");
// const Tape = require("ciseaux/lib/tape");

// Video support
// https://askubuntu.com/questions/59383/extract-part-of-a-video-with-a-one-line-command/59388
// https://github.com/fluent-ffmpeg/node-fluent-ffmpeg
// equivalent of what I need to do:
// 1. take in .input streams
// 2. use .seek
// 3. use .duration
// 4. use .mergeToFile
// maybe REALLY slow?

// https://ffmpeg.org/ffmpeg.html


const beatswap = (options) => {
    const {
        inFilePath,
        outFilePath,
        beatLength,
        sequenceOrder,
        startPoint,
    } = options;

    console.log('Warning: beatswapping video can take a long time!')
    const tmpDir = path.resolve(process.cwd(), 'beatswaptmp')
    console.log('Setting up temporary directory:', tmpDir);
    if (!fs.existsSync(tmpDir)) {
        fs.mkdirSync(tmpDir);
    }

    const inputPathParse = path.parse(inFilePath);
    const inputPathName = inputPathParse.name;
    const inputPathExt = inputPathParse.ext;

    let duration;
    ffmpeg.ffprobe(inFilePath, function (err, metadata) {
        if (err) {
            console.log('Error occurred while analyzing input:', err);
            process.exit(-1);
        }
        duration = metadata.format.duration;

        // @TODO: Incorporate start/endpoints.
        // @TODO: Add truncate flag with start/end.

        const beatCount = duration / beatLength;
        // const beatCount = 20;

        console.log('Found', Math.floor(beatCount), 'beats in video. Slicing into parts...');
        let doneCount = 0;

        const beatarr = [];
        for (let i = 0; i < beatCount; i++) {
            // Because the startPoint could push the actual beats up
            // to past the end of the file, we need to ensure we don't
            // seek to a point off the end of the video file. Otherwise
            // we'll encounter an error.
            if (startPoint + (i * beatLength) < duration) {
                beatarr.push(i);
            }
        }

        // @KLUDGE: Pretty sure this can just be fixed up at beatCount but too
        // tired to fix atm
        const actualBeatCount = beatarr.length;

        const kickOffFfmpeg = (i) => {
            const tmpName = inputPathName + '_' + i + inputPathExt;
            const outPath = path.resolve(tmpDir, tmpName);
            const seek = startPoint + (i * beatLength);
            return new Promise((resolve, reject) => {
                ffmpeg(inFilePath)
                    .seekInput(seek)
                    .duration(beatLength)
                    // @TODO: Customize codec outputs
                    .on('start', function (commandLine) {
                        // @TODO: Enable with debugging
                        console.log('Spawned ffmpeg with command: ' + commandLine);
                    })
                    .on('error', function (err) {
                        console.log('An error occurred while trying to slice video:', err.message);
                        reject();
                        process.exit(-1);
                    })
                    .on('end', () => {
                        doneCount++;
                        if (doneCount % 10 === 0) {
                            const percentageDone = Math.round(doneCount / actualBeatCount * 100, 2);
                            console.log(percentageDone + '%', 'done...');
                        }
                        resolve(outPath);
                    })
                    .save(outPath)
            });
        };
        asyncPool(20, beatarr, kickOffFfmpeg)
            .then(results => {
                console.log('Done slicing videos.');
                console.log('Rebuilding into sequence.');
                let merge = ffmpeg();

                const reorderedClips = [];

                // Lifted wholesale from the audio beatswapping.
                let currentSequenceIndex = 0;
                let currentSequenceFrame = 0;
                for (let i = 0; i < actualBeatCount; i++) {
                    const beatTarget = sequenceOrder[currentSequenceIndex];
                    const sequenceFrameOffset = currentSequenceFrame * sequenceOrder.length;
                    // @TODO: Implement outputting null
                    if (beatTarget !== null) {
                        const clipTargetIndex = sequenceFrameOffset + beatTarget;
                        if (clipTargetIndex > actualBeatCount - 1) {
                            reorderedClips.push(results[i]);
                        } else {
                            reorderedClips.push(results[clipTargetIndex]);
                        }
                    }

                    currentSequenceIndex++;
                    if (currentSequenceIndex > sequenceOrder.length - 1) {
                        currentSequenceIndex = 0;
                        currentSequenceFrame++;
                    }
                }
                // console.log(reorderedClips);

                reorderedClips.forEach(clip => {
                    merge = merge.input(clip);
                });
                merge
                    .on('progress', progress => {
                        // @TODO: Make this format better
                        console.log(progress.timemark);
                    })
                    .on('start', commandLine => {
                        // @TODO: Enable with debugging
                        // console.log('Spawned ffmpeg with command: ' + commandLine);
                    })
                    .on('error', err => {
                        console.log('An error occurred while trying to merge videos:', err.message);
                        process.exit(-1);
                    })
                    .on('end', () => {
                        console.log('Done. Whew! Output file to:', outFilePath);
                    })
                    .mergeToFile(outFilePath);
            })
            .catch((err) => {
                console.log(err);
                process.exit(-1);
            });

    });
};

// const beatswap = (options) => {
//     const {
//         inFilePath,
//         outFilePath,
//         beatLength,
//         sequenceOrder,
//         startPoint,
//         useSilence,
//     } = options;
//     // create a tape instance from the filepath
//     console.log('Attempting to read file from:', inFilePath);
//     Ciseaux.from(inFilePath).then((originalTape) => {
//         console.log('Done.');
//         const measureCount = originalTape.duration / beatLength;

//         // Create a blank Tape to append to
//         let runningTape = new Tape();
//         // Split all of the tapes out by the number of beats there are. Bump by the startPoint, too.
//         let allSlices = originalTape.slice(startPoint).split(measureCount);
//         console.log('Processing', allSlices.length, 'beats...');

//         let currentSequenceIndex = 0;
//         // The index of the set of audio clips that will be picked
//         // from to populate the current sequence
//         let currentSequenceFrame = 0;
//         for (let i = 0; i < allSlices.length; i++) {
//             // This is the beat in the sequence we want to put in this slot
//             const beatTarget = sequenceOrder[currentSequenceIndex];
//             // This is the adjustment we want to make for the current sequence frame,
//             // given the sequence length
//             const sequenceFrameOffset = currentSequenceFrame * sequenceOrder.length;

//             // Is the target actually null, indicating a beat omission?
//             if (beatTarget === null) {
//                 // If we set useSilence to true, then replace the beat drop with silence.
//                 if (useSilence) {
//                     runningTape = runningTape.concat(Ciseaux.silence(beatLength));
//                 }
//                 // Otherwise, we omit adding the slice, resulting in a shorter file.
//             } else {
//                 // This is the clip we actually want to get
//                 const clipTargetIndex = sequenceFrameOffset + beatTarget;
//                 // Is there nothing to grab because we're at the end? Then just pop in
//                 // the current clip.
//                 if (clipTargetIndex > allSlices.length - 1) {
//                     runningTape = runningTape.concat(allSlices[i]);
//                 } else {
//                     // Otherwise, just grab that dang clip and put it in there.
//                     runningTape = runningTape.concat(allSlices[clipTargetIndex]);
//                 }
//             }

//             // Wrap around the sequence index when we're at the end and then bump the frame
//             // so we target the clips for the next sequence
//             currentSequenceIndex++;
//             if (currentSequenceIndex > sequenceOrder.length - 1) {
//                 currentSequenceIndex = 0;
//                 currentSequenceFrame++;
//             }
//         }

//         return runningTape.render();
//     }).then(legacyBuffer => {
//         // Ciseaux seems to return an old-style buffer that doesn't write out
//         // properly so we just rewrap it.
//         const buffer = Buffer.from(legacyBuffer);
//         return new Promise(resolve => {
//             console.log('Writing beatswapped file to:', outFilePath);
//             fs.writeFile(outFilePath, buffer, resolve);
//         }).then(() => {
//             console.log('Done. Enjoy!');
//         });
//     });
// };

module.exports = {
    beatswap: beatswap,
};
