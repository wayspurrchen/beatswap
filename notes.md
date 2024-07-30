Moshing / Beatswapping music videos

https://wiki.videolan.org/VLC_command-line_help
https://wiki.videolan.org/Documentation:Streaming_HowTo/Advanced_Streaming_Using_the_Command_Line/#access

- beatswap music video
- prep file with moshy
- ikill
- rebuild indexes in vlc (or DivFix++)
- bake with moshy
- match up extracted music to resulting file

nodemon cli.js -- -i "Bad_Romance.mkv" -o "Bad_Romance_betascrewed.mkv" -b 0.25 -s adcenbeaollcuevwbkjxcrte --start 1.432 --verbose # may need to tweak ulimit `ulimit -s 65532`
moshy -m prep -i Bad_Romance_betaswapped.mkv -o Bad_Romance_betaswapped_prepped.avi -b 8392
python2 ../tomato/tomato.py -i Bad_Romance_betaswapped_prepped_ikill.avi -m ikill Bad_Romance_betaswapped_prepped_ikill_tombake.mp4
vlc Bad_Romance_betaswapped_prepped_ikill.avi --avi-index=3 --sout '#standard{mux=avi,access=file,dst=Bad_Romance_betaswapped_prepped_ikill_indexed.avi} # `so close..`
moshy -m bake -i Bad_Romance_betaswapped_prepped_ikill_index.avi -o Bad_Romance_betaswapped_prepped_ikill_index_bake.mp4 -b 8392

How the F did I get the audio to keep before??
Temporary stupid workaround: edit the audio to be shorter lol