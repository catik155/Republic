REPUBLIC — Alpha 0.17.0
Desktop architecture: Electron + Three.js.
Parallel output targets:
- Web build: npm run build:web -- --base=./ (Vite outputs dist-web)
- Windows portable EXE: npm run dist:win (electron-builder outputs dist)
Checks: npm run check

Alpha 0.17 visual changes:
- pedestrians are low-poly person silhouettes, not dots;
- 70 pedestrian models animate along sidewalk lanes;
- routes are kept away from road centers;
- fixed city layout, not procedural random generation.

CI: .github/workflows/build-two-versions.yml runs syntax checks and publishes Republic-Web and Republic-Windows-EXE artifacts. The web build has passed in the current CI run; the Windows portable build is still being checked.

Multiplayer is not yet implemented. The city/political systems remain prototypes.