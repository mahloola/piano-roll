# MIDI -> Synthesia

Welcome to my MIDI visualizer project.
To get started:

- Visit [this link](https://mahloola.github.io/piano-roll/)
- Sign up
- Upload a MIDI file - must be below 50MB but I'd be impressed if your MIDI exceeds that
- If not already redirected to /uploads, then click the top left 'Uploads' to view your history
- Go into any of your uploads to see the 'Synthesia' style visualizer.

I used [Supabase](https://supabase.com/) for storage and authentication, [canvas API](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API) for visualizing, and [tone](https://github.com/Tonejs/Tone.js) for audio processing.

Known issues:

- Resizing the window while MIDI is playing breaks the canvas
- MIDI player should auto-stop when there's no more notes
