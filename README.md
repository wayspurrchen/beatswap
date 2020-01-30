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

To use `beatswap` you need a few things:

- A WAV file to input
- The length of a beat in seconds (decimals are fine)
- A sequence you want to use

**A WAV file** (and no other type) is necessary because it is a lossless audio format that is amenable to being chopped up by software. (Technically, WAV can actually contain compressed media files, so make sure that your WAV file is actually a 16-bit PCM file, the most common type of WAV.) If you have an MP3, you can use a free tool like [Audacity](https://www.audacityteam.org/) to convert your MP3 into a WAV.

**The length of the beat you want** in seconds will be figured out by measuring the length of a beat in an audio editing program like Audacity, mentioned previously. Of course, you can just guess, but you probably won't get the best results for music with beats.

**The sequence you want to use** is a simple string of characters that dictates the order of the beats in the file. `beatswap` uses the natural order of the alphabet (A, B, C...) to determine where beats in an audio file already are, and then you use a "sequence string" to tell `beatswap` where those beats should go. An example will help.

For example, if you have an audio file that is someone saying "My name is Bob you seem very cool" where each word is exactly one second long, and you specify a sequence of `abcd`, nothing will change. But if you specify the sequence `adcb` (aka swapping beats B and D, or beats 2 and 4), the resulting audio file would become "My Bob is name you cool very seem". This assumes that you have the beat length set to exactly one second.

Having decided that you want to do this to your audio file called `bobsayshello.wav`, you would use the command:

```
beatswap -i bobsayshello.wav -o bobsayshello_beatswapped.wav -b 1 -s adcb
```

This means, take the input file (`-o`) `bobsayshello.wav`. When we're done beatswapping, output (`-o`) to the file named `bobsayshello_beatswapped.wav` (you have to specify this; the tool doesn't want to overwrite your original file accidentally). We want the beat length (`-b`) to be 1 second long. And finally, we want the sequence (`-s`) to be `adcb`.

### Other sequence usages

This is where `beatswap` gets neat. Because it arbitrarily maps the sequence sections in your file to the letters you specify, you do more interesting things with your sequences like repeat or delete beats. We'll use the "My name is Bob you seem very cool" example to explain.

- Repetition
    - `aaaa` - "My my my my you you you you"
    - `aabb` - "My my is is you you very very"
- Reversal - `dcba` - "Bob is name My cool very seem you"

You can actually _delete_ clips entirely by using the `_` underscore. For instance:

- Deletion
    - `a_b_` - "My is you very" (see [this video](https://www.youtube.com/watch?v=hhEBYGzADeU) for an example)
    - `____` - results in an empty audio file!

For the purposes of this explanation, we've used only 4-character sequences, but there's no actual limit to the number of characters you use. Technically you could create a sequence like `adcenbeaollcuevwbkjxcrte` with 24 beats. Keep in mind that if your beats are set to 1s long, you end up with 24 second-long sequences! Of course, you can use fractional beat lengths like `0.04166` (that's just `1 / 24`), and then one single second of audio would get really screwy. It would _all_ get really screwy. (See an example where I did exactly this in [a video where I "beatscrewed" Lady Gaga's Bad Romance](https://www.youtube.com/watch?v=HAXfEmgOvz4).)

### Arguments

parameter | meaning | default
----- | ----- | -----
`-i` | input file path | none, required
`-o` | output file path | none, required
`-b`, `--beatlength` | the length of a beat (seconds, decimal) | none, required
`-s`, `--sequence` | the sequence string to use | none, required
`--start` | a specific duration in the file, in seconds, at which to begin sequencing the file (good for tracks that have intros or silence at the beginning) | `0` (the very beginning)
`--use-silence` | when you use the beat omission symbol (`_`), replace it with silence instead of omitting entirely | `false`

## TODOs

- Support --end