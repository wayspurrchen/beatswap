#!/usr/bin/env node
const argv = require('minimist')(process.argv.slice(2));
const path = require("path");
const beatLength = parseFloat(argv.b || argv.beatlength);
// Sequences will be sorted and then assigned alphabetically
const sequenceString = argv.s || argv.sequence;
const startPoint = parseFloat(argv['start'] || 0);
const useSilence = !!(argv['use-silence']);
const cwd = process.cwd();
const inWavString = argv.i;
const outWavString = argv.o;

if (!inWavString) {
    throw new Error('Must specify input WAV file path with -i')
}

if (!outWavString) {
    throw new Error('Must specify output WAV file path with -o');
}

const inWavPath = path.resolve(cwd, inWavString);
const outWavPath = path.resolve(cwd, outWavString);

const beatswap = require('./index').beatswap;

if (!sequenceString) {
    throw new Error('Must specify beat sequence with -s or --sequence')
}

if (!beatLength) {
    throw new Error('Must specify beat length with -b or --beatLength');
}

const generateSequenceOrder = (sequenceString) => {
    const sequence = sequenceString.split('');
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

beatswap({
    inWavPath,
    outWavPath,
    sequenceOrder,
    startPoint,
    useSilence,
});
