const argv = require('minimist')(process.argv.slice(2));
const path = require("path");
const beatlength = parseFloat(argv.b || argv.beatlength);
// Sequences will be sorted and then assigned alphabetically
const sequence = (argv.s || argv.sequence).split('');
const startPoint = parseFloat(argv['start'] || 0);
const useSilence = !!(argv['use-silence']);
const fs = require("fs");
const Ciseaux = require("ciseaux/node");
const Tape = require("ciseaux/lib/tape");
const cwd = process.cwd();
const inWavPath = path.resolve(cwd, argv.i);
const outWavPath = path.resolve(cwd, argv.o);

if (!sequence) {
    throw new Error('Must specify beat sequence with -s or --sequence')
}

if (!beatlength) {
    throw new Error('Must specify beat length with -b or --beatlength');
}

// Becomes the map to a given beat in the specified interval
const sequenceCharMap = {};

const sequenceChars = sequence.slice().sort();
sequenceChars.forEach((sc, index) => {
    if (sc !== '_') {
        sequenceCharMap[sc] = index;
    } else {
        sequenceCharMap[sc] = null;
    }
});
const sequencePrediction = sequence.map(letter => {
    if (sequenceCharMap[letter] !== null) {
        return sequenceCharMap[letter] + 1;
    } else {
        return null;
    }
});

// Informational logging
const sequenceLength = sequencePrediction.length;
console.log('New beat sequence constructed:', sequencePrediction);
const sequenceDuration = sequenceLength * beatlength;
console.log('Each sequence will be', sequenceDuration, 'second(s) long');

// create a tape instance from the filepath
console.log('Attempting to read file from:', inWavPath);
Ciseaux.from(inWavPath).then((originalTape) => {
    console.log('Done.');
    const measureCount = originalTape.duration / beatlength;

    // Create a blank Tape to append to
    let runningTape = new Tape();
    // Split all of the tapes out by the number of beats there are. Bump by the startPoint, too.
    let allSlices = originalTape.slice(startPoint).split(measureCount);

    let currentSequenceIndex = 0;
    // The index of the set of audio clips that will be picked
    // from to populate the current sequence
    let currentSequenceFrame = 0;
    for (let i = 0; i < allSlices.length; i++) {
        // This is the beat in the sequence we want to put in this slot
        const beatTarget = sequencePrediction[currentSequenceIndex];
        // This is the adjustment we want to make for the current sequence frame,
        // given the sequence length
        const sequenceFrameOffset = currentSequenceFrame * sequenceLength;

        // Is the target actually null, indicating a beat omission?
        if (beatTarget === null) {
            // If we set useSilence to true, then replace the beat drop with silence.
            if (useSilence) {
                runningTape = runningTape.concat(Ciseaux.silence(beatLength));
            }
            // Otherwise, we omit adding the slice, resulting in a shorter file.
        } else {
            // This is the clip we actually want to get
            const clipTargetIndex = sequenceFrameOffset + beatTarget;
            // Is there nothing to grab because we're at the end? Then just pop in
            // the current clip.
            if (clipTargetIndex > allSlices.length - 1) {
                runningTape = runningTape.concat(allSlices[i]);
            } else {
                // Otherwise, just grab that dang clip and put it in there.
                runningTape = runningTape.concat(allSlices[clipTargetIndex]);
            }
        }

        // Wrap around the sequence index when we're at the end and then bump the frame
        // so we target the clips for the next sequence
        currentSequenceIndex++;
        if (currentSequenceIndex > sequencePrediction.length - 1) {
            currentSequenceIndex = 0;
            currentSequenceFrame++;
        }
    }

    return runningTape.render();
}).then(legacyBuffer => {
    // Ciseaux seems to return an old-style buffer that doesn't write out
    // properly so we just rewrap it.
    const buffer = Buffer.from(legacyBuffer);
    return new Promise(resolve => {
        console.log('Writing beatswapped file to:', outWavPath);
        fs.writeFile(outWavPath, buffer, resolve);
    }).then(() => {
        console.log('Done. Enjoy!');
    });
});
