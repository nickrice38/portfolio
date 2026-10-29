# Ideas backlog

Ideas for the crosshair homepage, roughly in the order we plan to build them.
Tick them off as they land.

## Rewards
- [x] Score pop-up: bold yellow "+500" above the crosshair on a shot
- [x] Labels: "+500 HEADSHOT" for a dead-centre shot, "+100 HIT" for an edge shot
- [x] Stacking: rapid shots merge into one rising total
- [x] "+1000 NEW PROJECT" the first time a project is opened
- [x] "FIRST BLOOD +250" on the first project of a visit
- [x] Streak medals after 3 / 5 / 10 projects ("3 PROJECT STREAK", "RECRUITER'S DELIGHT")
- [ ] Collectibles: points for visiting About, Contact etc.; "100% COMPLETE" when all found
- [ ] Double XP: a random timed bonus, just for fun

## HUD
- [x] Kill feed (bottom left): "Nick ⌖ Project 09" for each project opened
- [x] Running score counter in a corner
- [x] Ammo counter: projects seen, e.g. "07 / 12"
- [ ] XP bar that fills while exploring; "level up" unlocks CV download / contact
- [ ] Minimap that shows position and doubles as a jump-to menu

## Aiming and feel
- [x] Aim down sights: hold right-click or Shift to zoom in on a card
- [ ] Hit sound and shot sound, muted by default, with a toggle
- [ ] Faint white screen flash on a headshot (~40ms)
- [ ] Mouse sway: the grid shifts a few pixels with mouse movement
- [ ] Depth shading: cards darken or fade as the warp curves them away
- [ ] Warp only while dragging, flat at rest
- [ ] Pinch / ctrl+scroll zoom towards the pointer
- [ ] Snap to nearest card after a throw (partly covered by aim assist settle)
- [ ] Esc waits for settle to finish so the menu is always perfectly centred

## Menu and content
- [ ] Decide the menu items (src/menu.js) and wire each one up
- [ ] Projects: a plain list view, the escape hatch for recruiters in a hurry
- [ ] Settings: let visitors pick control mode and aim assist, like a game
- [ ] About / Contact as panels inside the menu gap
- [ ] Real project view to replace the placeholder shot
- [ ] Real project data and images on the cards

## Accessibility
- [ ] Tab / Shift+Tab cycles targets, Enter shoots
- [ ] Respect reduced motion everywhere (recoil, sway, pop-ups)
