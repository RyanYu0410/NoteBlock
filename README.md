# Audiovisual Playground

A browser-based p5.js and Tone.js audiovisual sketch with virtual fruit controls and optional camera-based color detection.

## Project Structure

```text
.
├── index.html                  # App shell and DOM markup
├── src/
│   ├── scripts/app.js          # p5, Tone, camera, and interaction logic
│   └── styles/main.css         # Visual styling for the UI and canvas overlays
└── canvas/audiovisual_playground.html
    # Earlier standalone canvas version kept as a reference
```

## Run Locally

Start a static server from the project root:

```sh
python3 -m http.server 5173
```

Then open `http://localhost:5173`.

Camera access requires a browser context that supports `getUserMedia`; `localhost` is supported by modern browsers.
