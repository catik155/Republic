РЕСПУБЛИКА — Alpha 0.20.0

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


Alpha 0.20.0 — Network MVP:
- PeerJS added for direct WebRTC peer connections using a public PeerJS broker and STUN.
- Create room button generates a six-digit room code; players can join using that code.
- Host is authoritative for turn advance, campaign actions, and law prototype results; clients send actions to host and receive updated state.
- Online selection no longer blocks campaign creation; lobby controls are available in the right panel after entering the game.
- This is an early peer-to-peer test: it depends on network access to the PeerJS broker/STUN, has no guaranteed TURN relay for restrictive NAT/firewalls, and lacks lobby player limits/party assignment/full save migration. Test with two devices/browsers before treating multiplayer as reliable.
- Local save key changed to republic-save-v020.


Network improvements in latest commits: lobby now displays named player list and host enforces configured maximum player count when accepting peers. Roster entries are tracked per PeerJS connection and removed when a peer disconnects. Political prototype now adjusts support over time, reallocates campaign support across parties, and uses weighted simulated votes instead of guaranteed law passage. These systems remain untested with two real devices; confirm GitHub Actions artifacts before download.
