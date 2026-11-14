# Supporting cast — the station heads (owner direction, 2026-10-30)

Julien: "Mark the heads of the shop to become supporting characters in our cast for the storyline." Each pizzeria's three heads are hired in play (Head Prep Cook → prep, Head Baker → ovens, Head Cashier → counter); the General Manager needs all three. Names live in `src/content/tuning.ts` (`HEADS`). On hire each says one line over their station (`HIRE_LINE` in `storefront.tsx`). Story beats for them come with the interludes work and go through the storycritic.

| Shop | Head Prep Cook | Head Baker | Head Cashier | Starting voice notes (draft, to refine with the storycritic) |
| --- | --- | --- | --- | --- |
| Downtown | **Marco** | **Lucia** | **Benny** | Nonna's own crew. Marco: eager, flour everywhere. Lucia: Nonna's niece, guards the oven like a dragon. Benny: knows every regular's order. |
| Suburbs | **Patty** | **Hank** | **Kayla** | Coach Dale's world. Patty: PTA energy, labels everything. Hank: retired dad, grill philosophy. Kayla: teen, first job, deadpan. |
| Waterfront | **Finn** | **Gus** | **Coral** | Marisol's dock. Finn: deckhand, speaks in knots. Gus: old salt, "seen worse ovens in a storm". Coral: runs the register like a harbour master. |
| University | **Raj** | **Mei** | **Tyler** | Priya's campus. Raj: grad student, optimises dough. Mei: chemistry major, bakes by thermometer. Tyler: frat guy, surprisingly great with customers. |
| Industrial | **Stan** | **Ox** | **Rita** | Big Sal's district. Stan: union steward, breaks on time. Ox: huge, gentle, silent. Rita: night-shift veteran, calls everyone "hon". |
| Uptown | **Pierre** | **Margot** | **Sterling** | Genevieve's crowd. Pierre: ex-fine-dining, sulks about toppings. Margot: pastry snob turned pizza convert. Sterling: maître d' energy at a pizza counter. |

Rules: the heads never upstage the neighbourhood's main character (Dale, Marisol, Priya, Sal, Genevieve); Todd/MegaSlice may try to poach one (a natural interlude hook).

## The five General Managers (v5.16, copy: `docs/story/COPY-v5.16.md` section 6)

Julien, 2026-11-13: "I want the managers to become part of the storyline." Each shop's General Manager has a name, a face and one hire scene (`<shop>-hire`, played the moment the manager is hired; ids and names in `MANAGERS`, `src/content/tuning.ts`). Nonna Rosa is Downtown's, and `downtown-4` is her hire scene. Each also speaks one line in a beat 3 or 4, which plays only once the hire scene has been seen. Looks are for the portraits (card T1b).

| Shop | Manager | Who they are (`cast.<id>`) | Look (`look.<id>`) |
| --- | --- | --- | --- |
| Suburbs | **Deb** | Deb runs the Mudhens snack bar like a border crossing, and Coach Dale is a little afraid of her. As Suburbs manager she keeps the line short, the counter clean and a long memory of who owes her. | 50s, frosted blonde perm, the whistle Dale gave her (never blown). |
| Waterfront | **Skip** | Skip was a ferry purser for decades and still counts everything twice. As Waterfront manager he logs every pie, and he has questions about the Great Lobster Escape. | 70s, white crew cut, a purser’s cap with a brass badge. |
| University | **Noor** | Noor is Priya’s TA, writing a thesis on queues, and the shop’s line is her favorite field site. As University manager she times everything and stays calm about all of it, which unnerves people. | Late 20s, black hair in a bun stuck through with pencils, a stopwatch on a lanyard. |
| Industrial | **Dee** | Dee is Big Sal’s shift steward: she runs the whistle, the breaks and, quietly, Sal. As Industrial manager she keeps the ovens hot and the breaks on time, and nobody yells at Ox. | 40s, cropped red hair, a steward’s armband over a hi-vis vest. |
| Uptown | **Anton** | Anton was the finest maître d’ in Uptown until Genevieve fired him, and neither has said why. As Uptown manager he runs the counter like a dining room, one folded napkin at a time. | 60s, silver hair combed back, a white napkin over one forearm. |

Open threads the hire scenes plant (no payoff scheduled yet): the Mudhens bake sale (Deb), the Great Lobster Escape ferry log (Skip), the title of Noor's thesis chapter, what Sal keeps in his locker (Dee), why Genevieve fired Anton.

## Todd (v5.16, script: `docs/story/STORY-v4-final.md`)

One man, Todd Smith, three looks (all variants of the MegaSlice rep): `megaslice-rep` (the shiny suit, "Todd" on screen), `mr-smith` (trench coat, mustache drawn on in marker), `todd-coat` (the same coat, no mustache: waterfront-5 and uptown-4 panel 4) and `slicey` (the foam pizza-slice mascot costume). His name tag is demoted down the script: VP OF EXPANSION, SENIOR ASSOCIATE, ASSOCIATE, INTERN, UNPAID INTERN, VENDING RESTOCKER, Slicey, then TODD · ROSA'S.
