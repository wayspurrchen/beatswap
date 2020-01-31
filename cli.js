#!/usr/bin/env node
const argv = require('minimist')(process.argv.slice(2));
const path = require("path");
const detect = require('detect-file-type');
const beatLength = parseFloat(argv.b || argv.beatlength);
// Sequences will be sorted and then assigned alphabetically
const sequenceString = argv.s || argv.sequence;
const useExistingVideoSlices = !!argv['use-existing-video-slices'];
const startPoint = parseFloat(argv['start'] || 0);
const verbose = !!(argv.verbose || argv.v);
const useSilence = !!(argv['use-silence']);
const cwd = process.cwd();
const inFileArg = argv.i;
const outFileArg = argv.o;

// hackity hack hack
global.verbose = verbose;

if (!inFileArg) {
    throw new Error('Must specify input WAV file path with -i')
}

if (!outFileArg) {
    throw new Error('Must specify output WAV file path with -o');
}

if (!sequenceString) {
    throw new Error('Must specify beat sequence with -s or --sequence')
}

if (!beatLength) {
    throw new Error('Must specify beat length with -b or --beatLength');
}

// @TODO: Allow for more expressive sequencing--adding frames
const generateSequenceOrder = (sequenceString) => {
    const sequence = sequenceString.split('').map(l => l.toLowerCase());
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
    const sequenceOrder = sequence.map(letter => {
        if (sequenceCharMap[letter] !== null) {
            return sequenceCharMap[letter] + 1;
        } else {
            return null;
        }
    });
    return sequenceOrder;
};

const sequenceOrder = generateSequenceOrder(sequenceString);

// Informational logging
const sequenceLength = sequenceOrder.length;
console.log('New beat sequence constructed:', sequenceOrder);
const sequenceDuration = sequenceLength * beatLength;
console.log('Each sequence will be', sequenceDuration, 'second(s) long');

const inFilePath = path.resolve(cwd, inFileArg);
const outFilePath = path.resolve(cwd, outFileArg);

detect.fromFile(inFilePath, (err, typeDetect) => {
    if (err) {
        console.log(err);
        process.exit(-1);
    }

    const mimePrefix = typeDetect.mime.split('/')[0];

    if (mimePrefix === 'audio') {
        console.log('Audio file detected; running beatswap in audio mode.');
        const beatswapAudio = require('./audio').beatswap;

        beatswapAudio({
            inFilePath,
            outFilePath,
            sequenceOrder,
            startPoint,
            useSilence,
            beatLength,
        });
    } else if (mimePrefix === 'video') {
        console.log('Video file detected; running beatswap in video mode.');
        const beatswapVideo = require('./video').beatswap;

        beatswapVideo({
            inFilePath,
            outFilePath,
            sequenceOrder,
            startPoint,
            useSilence,
            beatLength,
            useExistingSliceFiles: useExistingVideoSlices
        });
    } else {
        console.log('Unknown file type:', typeDetect);
        console.log('Quitting.');
        process.exit(-1);
    }
});
