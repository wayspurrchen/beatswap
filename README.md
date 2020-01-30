# beatswap - resequence audio, just because

A Node.js utility for resequencing clips within WAV audio files.

## Resequencing?

`beatswap` allows you to take a WAV file and "resequence" it. This means that you can define what order you want the audio to be split and reordered into. For example, if you wanted to do an Adam Edmond-style ["<song> but beats 2 and 4 are swapped" track](https://www.youtube.com/watch?v=dSvvlu5zTDQ), you can specify the sequence "ADCB" to say "play the A part, but then the D part, then the C part, and finally the B part". This script will then automatically recombulate (that's a word) the file according to your sequence.

## Why would I do that?

I have no idea.

- Maybe you're an electronic musician who wants to sample some music
- Maybe you want to chop and screw some random audio files
- Maybe you want to destroy music

## Installation

You'll need to install [Node.js](https://nodejs.org/en/) for your computer, at least v12 recommended.

If you're good at computer stuff, I recommend using `Node Version Manager`:
- For Linux/Mac: https://github.com/nvm-sh/nvm
- For Windows: https://github.com/coreybutler/nvm-windows

Once you have Node.js installed, use [the command line](https://lifehacker.com/a-command-line-primer-for-beginners-5633909) to install `beatswap`:

`npm install -g beatswap`

## Usage

`beatswap` uses a single command.

## TODOs

- Support out point