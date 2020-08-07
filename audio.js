const fs = require("fs");
const Ciseaux = require("ciseaux/node");
const Tape = require("ciseaux/lib/tape");

const beatswap = (options) => {
    const {
        inFilePath,
        outFilePath,
        beatLength,
        sequenceOrder,
        startPoint,
        useSilence,
    } = options;
    // create a tape instance from the filepath
    console.log('Attempting to read file from:', inFilePath);
    Ciseaux.from(inFilePath).then((originalTape) => {
        console.log('Done.');
        const measureCount = originalTape.duration / beatLength;

        // Create a blank Tape to append to
        let runningTape = new Tape();
        // Split all of the tapes out by the number of beats there are. Bump by the startPoint, too.
        let allSlices = originalTape.slice(startPoint).split(measureCount);
        console.log('Processing', allSlices.length, 'beats...');

        let currentSequenceIndex = 0;
        // The index of the set of audio clips that will be picked
        // from to populate the current sequence
        let currentSequenceFrame = 0;
        for (let i = 0; i < allSlices.length; i++) {
            // This is the beat in the sequence we want to put in this slot
            let beatTarget = sequenceOrder[currentSequenceIndex];
            let reversed = false;
            if (beatTarget < 0) {
                beatTarget = -beatTarget;
                reversed = true;
            }
            // This is the adjustment we want to make for the current sequence frame,
            // given the sequence length
            const sequenceFrameOffset = currentSequenceFrame * sequenceOrder.length;

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
                    if (reversed) {
                        // reverse and concat.
                        runningTape = runningTape.concat(allSlices[clipTargetIndex].reverse());
                    } else {
                        // Otherwise, just grab that dang clip and put it in there.
                        runningTape = runningTape.concat(allSlices[clipTargetIndex]);
                    }
                }
            }

            // Wrap around the sequence index when we're at the end and then bump the frame
            // so we target the clips for the next sequence
            currentSequenceIndex++;
            if (currentSequenceIndex > sequenceOrder.length - 1) {
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
            console.log('Writing beatswapped file to:', outFilePath);
            fs.writeFile(outFilePath, buffer, resolve);
        }).then(() => {
            console.log('Done. Enjoy!');
        });
    });
};

module.exports = {
    beatswap: beatswap,
};
