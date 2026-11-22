# Republic — Development Roadmap

This document tracks the game direction requested by the player across earlier development chats. Keep it updated as work lands.

## Game pillars
- [ ] Turn the prototype into a cohesive, playable political/city simulation (not a static dashboard).
- [ ] The simulation advances automatically; player actions can also advance time.
- [ ] The city is built once per session and persists as the world, not regenerated every month.
- [ ] Browser HTML game remains the primary easy-to-play version; no dedicated server required for local play.

## City and residents
- [x] Dark 3D city, district polygons, connected streets, government landmark, party headquarters, parks.
- [x] Densify building blocks; extend city floor/camera bounds.
- [x] Residents have goal-directed street movement.
- [ ] Basic residential lifecycle code exists (street destination → fade/inside → return), but door alignment and actual visible behavior still need browser verification.
- [x] Pair encounters pause residents and show a conversation bubble; conversation rate, range and cooldown are adjustable in the city admin panel.
- [ ] Fix house entrance alignment/door visibility and verify movement visually.
- [x] Shortest-path routing on the street graph with cached distance maps; still requires visual verification and pedestrian avoidance refinements.
- [ ] Expand destinations and routines (shops, government, party offices, benches, work, errands); park leisure stops with a short idle pause are implemented as a basic prototype.
- [x] Increase pedestrian pool to 150; admin default displays 110, adjustable 90–150.
- [x] Reduce casual conversations with distance gating, 12% encounter probability, short conversation durations, and 25-second individual cooldowns; adjustable in the admin panel.
- [x] Add an in-game admin panel for pedestrian count and conversation behavior settings.
- [x] Add automatic placement checks for party HQs against road corridors and building footprints, with admin-panel audit display.
- [x] Add fixed park benches and small trees to the three static park spaces.
- [ ] Expand city streets, coherent block geometry, more buildings, distinct neighborhood landmarks and visual polish.
- [ ] Make citizen circles represent residents consistently, with grouping/interaction and readable activity state.

## Political simulation
- [x] Multiple parties, support, ideology and colors; AI opponents act independently.
- [x] Campaign action choices: rally, media campaign, resident outreach.
- [x] Laws with party ideology weighted votes.
- [x] Stability, unrest, inflation, unemployment, budget, population, monthly income/expenses.
- [x] Crisis events and protests, with choices and consequences.
- [x] Election results and 450-seat parliament diagram.
- [x] Coalition offer after elections; accept, refuse and manually negotiate, or minority government.
- [ ] Four-year election scheduling implemented; end-of-year triggering and modal flow still need gameplay verification.
- [ ] Election cycle: first election currently triggers after the first month as a temporary simplified start; future campaign month should precede election day with rallies, debates, ads, polls, citizen ideology-based voting and changing preferences.
- [ ] Election campaign must last a full political month rather than resolving in a single day/button press.
- [x] Start new games with national budget and political capital at zero; treasury only accrues while a government coalition exists.
- [x] Law voting includes a direct player-party choice (yes/no/abstain); other parties vote by ideology.
- [x] Add separate political capital per party (starts at zero, accrues monthly, and is spent by party actions such as media campaigns and law proposals). Resource initialization is synchronized with the configured party count.
- [x] Campaign spending is restricted to parties in the governing coalition when it uses national budget; opposition cannot spend treasury funds.
- [ ] Add individual party campaign treasuries and autonomous party fund-raising; opposition should use its own money for rallies and outreach.
- [ ] Improve coalition bargaining: cabinet/ministerial portfolios, policy promises, party acceptance, confidence votes.
- [ ] Make laws materially affect economy, population, parties, districts, and future elections.
- [ ] Add party leaders, personalities, priorities, campaign AI and event-driven rival actions.
- [ ] Improve election campaigns, debates, scandals, endorsements, polling and regional vote.
- [ ] Protests, strikes, riots, other parties' reactions and government/opposition actions need more distinct outcomes.

## UI and playability
- [x] Dark political-strategy interface, map layers, inspector, chronicle, tabs and dialogs.
- [x] Add mobile panel toggle to switch between action and inspector panels on narrow screens (visual testing still pending).
- [ ] Add proper map overlays/legend. District inspector now derives building counts, population estimate, and economy/infrastructure/ecology indicators from district data; still needs visual/gameplay validation.
- [ ] Build readable election, government, law, economy and party screens with visual data.
- [ ] Add tooltips, help/tutorial, pause/speed controls, autosave feedback and settings.
- [ ] Add citizen activity feed and city events visible on map.

## Multiplayer
- [x] PeerJS room code, host-authoritative actions, player roster and maximum player limit.
- [ ] Verify real two-device/browser connections; reliability currently depends on broker/STUN and lacks guaranteed relay.
- [ ] Party assignment, turn flow, reconnect handling, state validation and save compatibility.

## Release quality / checks
- [ ] Run CI syntax check and web build on latest commit; keep failures visible and fix them.
- [ ] Browser visual pass on desktop and mobile (not yet available through this workflow).
- [ ] Confirm EXE startup and map on an actual Windows machine; do not claim it is verified until tested.
- [ ] Keep the public web link updated and report build status honestly.

## Reference inspirations
- Resident behavior: state machines with walking, indoor, conversation and activity states; destinations and visible consequences.
- Political gameplay: elections, campaigning, legislation, negotiations, opposition and consequences.
- Keep the rules deterministic/transparent where possible; random events should be understandable and actionable.
