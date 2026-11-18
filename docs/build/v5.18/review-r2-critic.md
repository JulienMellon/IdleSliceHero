VERDICT: NOT SATISFIED
SUMMARY: The Boston fixes landed. The postcard teaser, per-city map, Fenway awning, six distinct leads, name tag and station-named cues are all visible in pixels. No majors remain, but nine minors are still open, and the gate allows three.

BLOCKERS:
- none (report.json loaded:false and no layout.json are expected for the --only run; errors is empty)

BUGS:
- none new. G109, G110 and G111 are fixed (see below).

VISUAL DESIGN:
- D506 [minor, was major] 107: stars+10 count, confetti and a "Greetings from Boston" postcard are now present. The lower 330 pt is still flat red under the postcard, so the beat feels top-heavy. Fix: centre the block vertically or add a Boston skyline silhouette (#6B1A12) behind the CTA.
- D510 [minor] 109-114 sky: the top-right cloud is still a pale rectangle with a rounded corner that bleeds off the frame, plus a stray dot at the left edge (x 15, y 155). Fix: a single-fill circle-union cloud, or drop it.
- D512 [minor] 145: the "Oven jammed! Tap the wrench" bubble still runs to x 393. Fix: clamp it to the viewport with a 12 pt margin.
- D513 [minor] 143: the queue no longer cuts through the dining room, but it is still a line of near-identical red-cap drivers. Fix: vary hat/skin seeds per slot.
- D514 [minor] 146: the guest is visible at the door but half hidden behind the report strip, and there is still no cold visual. Fix: shift the queue 20 pt up and add a frost tint (#BFE3F5 at 15%) while cold.
- D481 [minor] carried (13, 76, 05): the MegaSlice store sits on the asphalt.
- Fixed in pixels:
  - D507: the Boston map has its own river and park.
  - D508: the Fenway shop has a green awning and green door, and the University steeple is gone. The skyline is still generic; a Green Monster-style wall would be a nice-to-have.
  - D509: the leads now have a collar and cross, a ponytail, a lab coat, a blazer and a lapel pin.
  - D511: the sign is clear of the screen edge in 143 and 145.

DESIGN NOTES:
- D516 fixed: 108 now reads "1 with a manager".
- D517 fixed: 108 shows $142K/s with the "Build $589M" Southie card highlighted.
- D515 fixed: the cue now reads "Prep" in both 143 and 145.
- D493, D495, D505 carried; those shots are not in this round's review set.

FUN AND RETENTION:
- D506 [minor] The franchise payoff is now a gift: the stars count up, there is confetti and a Boston teaser. Monopoly GO! would add a tap-to-burst moment on the star, but that is polish.
- D517 [minor, fixed] The first Boston goal is visible.
- D495 [minor] carried: the first 20 seconds still end with $0 on screen and a $400 first goal.
- D493 [minor] carried: session 1 meets every layer at once.

FIXED SINCE LAST REVIEW: G109, G110, G111, D507, D508, D509, D511, D515, D516, D517 (D506 downgraded to a minor)
STILL OPEN FROM LAST REVIEW: D506 (residual), D510, D512, D513, D514, D481, D493, D495, D505

## Open notes
| ID | sev | owner | where | fix |
| --- | --- | --- | --- | --- |
| D506 | minor | U | 107 / franchise/flow.tsx | Lower 330 pt is flat red; centre the block or add a skyline silhouette behind the CTA |
| D510 | minor | T | 109-114 / backdrop sky | Cloud is a pale rectangle bleeding off the frame, stray dot at left edge; single-fill circle-union or remove |
| D512 | minor | S | 145 / scene bubbles | Jam bubble clipped at x 393; clamp bubbles inside the viewport, 12 pt margin |
| D513 | minor | S | 143 / rush queue | Queue drivers are clones (same red cap); vary seeds per slot |
| D514 | minor | S | 146 / cold line | Guest half hidden behind the report strip, no cold visual; lift queue, frost tint while cold |
| D481 | minor | S | 13, 76, 05 / layers/rival | MegaSlice store sits on the asphalt, 45 pt; put it on the far kerb at about 60%, shutters visible |
| D493 | minor | E | 05 / layers pacing | Session 1 meets every layer at once; open the rival after Suburbs 2 stars |
| D495 | minor | E | 04, 148 / tuning | First 20 s ends at $0, first goal $400; first goal under $50, pops on first serves |
| D505 | minor | U | 81 / banner vs recipe card | Dale banner covers recipe card title; queue the banner after the card or move it below the goal strip |

Next IDs: G112, D518
