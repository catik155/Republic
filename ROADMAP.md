# Republic — Development Roadmap

This document tracks the game direction requested by the player across earlier development chats. Keep it updated as work lands.

## Game pillars
- [ ] Turn the prototype into a cohesive, playable political/city simulation (not a static dashboard).
- [ ] The simulation advances automatically; player actions can also advance time.
- [ ] The city is built once per session and persists as the world, not regenerated every month.
- [ ] Browser HTML game remains the primary easy-to-play version; no dedicated server required for local play.

## City and residents
- [x] Dark 3D city, 25 district polygons, connected streets, government landmark, party headquarters, parks.
- [x] Densify building blocks; extend city floor/camera bounds.
- [x] Residents have goal-directed street movement.
- [ ] Basic residential lifecycle code exists (street destination → fade/inside → return), but door alignment and actual visible behavior still need browser verification.
- [x] Pair encounters pause residents and show a conversation bubble; conversation rate, range and cooldown are adjustable in the city admin panel.
- [ ] Fix house entrance alignment/door visibility and verify movement visually.
- [x] Keep transparent district overlays from writing depth and hiding pedestrians; move pedestrian start waypoints off intersection centers.
- [x] Split district overlay into 25 grid cells and rename regions by location; avoid falsely calling a district 'Riverside' when no river is present.
- [x] Move parks into block interiors, away from the road center lines.
- [x] Shortest-path routing on the street graph with cached distance maps; still requires visual verification and pedestrian avoidance refinements.
- [x] Expand resident outing destinations to shops, civic buildings, party headquarters, and parks; park/shop stops and office visits use deterministic selection and street-graph routing.
- [ ] Add benches, workplace destinations, errands, and more varied activity durations; verify indoor/door transitions visually.
- [x] Increase pedestrian pool to 150; admin default displays 110, adjustable 90–150.
- [x] Reduce casual conversations with distance gating, 12% encounter probability, short conversation durations, and 25-second individual cooldowns; adjustable in the admin panel.
- [x] Add an in-game admin panel for pedestrian count and conversation behavior settings.
- [x] Add automatic placement checks for party HQs against road corridors and building footprints, with admin-panel audit display.
- [x] Add fixed park benches and small trees to the three static park spaces.
- [x] Add deterministic static city details: facade window instancing, rooftop HVAC/vents, central crosswalk markings, sidewalk street lamps, storefront canopies, and civic entrance columns (built once with the map).
- [x] Align storefront canopies/supports and civic columns/lintels to each building's street-facing facade (fixes fixed-side detailing).
- [ ] Expand city streets, coherent block geometry, more buildings, distinct neighborhood landmarks and visual polish; 25-cell district grid and off-road parks now implemented, needs browser visual review.
- [x] Remove sidewalk strips, curbs, and painted pedestrian crosswalks; pedestrians now use road-centered waypoints with slight deterministic variation.
- [ ] Make citizen circles represent residents consistently, with grouping/interaction and readable activity state.

## Political simulation
- [x] Multiple parties, support, ideology and colors; AI opponents act independently.
- [x] Campaign action choices: rally, media campaign, resident outreach.
- [x] Laws with party ideology weighted votes and visual circular vote-result breakdown (yes/no/abstain); 226-seat threshold.
- [x] Autonomous rival party law proposals are periodically introduced and voted on; accepted initiatives apply small policy effects.
- [x] Coalition suggestions now prioritize parties ideologically closest to the election winner, using seats as tie-breaker.
- [ ] Expand ideology system beyond a single left/right scale into detailed political families and issue-based platforms.
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
- [ ] Expand law effects into named policy types with stronger long-term economy, population, district, and election consequences (passed laws now have modest immediate effects on economy/stability/unrest and support).
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
