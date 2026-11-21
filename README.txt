РЕСПУБЛИКА — Alpha 0.18.0

Startup fix for reported issue where EXE stayed on new-game menu and the preview was blank.

Changes:
- Electron now loads the Vite-bundled renderer from dist-web/index.html.
- Desktop build runs the browser bundle step before packaging.
- Menu interaction is moved into its own src/menu.js module, so start/menu logic doesn't depend on WebGL/Three.js map initialization.
- Menu canvas preview is drawn independently as a simple fallback.
- Removed duplicate menu handler from city3d.js.
- Added src/menu.js to syntax checks.
- CI builds both Web and Windows portable EXE.

Build:
npm install
npm run check
npm run build:web
npm run start
Windows: npm run dist:win

This should resolve the startup deadlock/blank preview symptom. Still must be confirmed by testing the Windows EXE on a real machine.


Alpha 0.19.0 simulation additions:
- Advance calendar month-by-month (year changes after December).
- Campaign button cycles through a simplified party list and changes support.
- Law proposal prompt and prototype vote tally against a 226/450 threshold.
- Top header metrics (year, stability, budget, population) now display dynamic prototype values.
- Simulation remains a prototype and uses placeholder/random monthly values; online multiplayer is not yet active.
