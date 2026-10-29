import type { Scene } from '../types';

// City 1 story: Port Marinara. 6 neighborhoods x 4 beats.
// Beat 1 = unlock, 2 = first milestone, 3 = complication (MegaSlice), 4 = resolution.

export const HOME_SCENES: Scene[] = [
  // ───────────────────────────── DOWNTOWN · Nonna Rosa ─────────────────────────────
  {
    id: 'downtown-1',
    city: 'home',
    character: 'nonna-rosa',
    neighborhood: 'downtown',
    beat: 1,
    title: 'The Keys',
    trigger: { kind: 'unlock', neighborhood: 'downtown' },
    panels: [
      {
        backdrop: 'downtown-rain',
        cast: [],
        caption: 'Port Marinara. Rain. One flickering sign: "Rosa\'s Pizza."',
        lines: [],
      },
      {
        backdrop: 'shop',
        cast: [{ id: 'nonna-rosa', mood: 'sad' }],
        caption: 'Inside, one oven. Zero customers.',
        lines: [
          { speaker: 'Nonna Rosa', text: 'Fifty years I run this shop. Now? Even the mice order from MegaSlice.' },
          { speaker: 'Nonna Rosa', text: 'My knees are done. So, cara mia... the keys are yours.' },
        ],
      },
      {
        backdrop: 'shop',
        cast: [{ id: 'nonna-rosa', mood: 'surprised' }],
        lines: [
          { speaker: 'You', text: 'What if we did delivery? Maybe an app? Some marketing?' },
          { speaker: 'Nonna Rosa', text: '"App." "Marketing." Modern ideas! In my day, the pizza WAS the marketing.' },
        ],
      },
      {
        backdrop: 'shop',
        cast: [{ id: 'nonna-rosa', mood: 'neutral' }],
        lines: [
          { speaker: 'Nonna Rosa', text: 'Fine. First you bake. Tap the kitchen, one batch each tap. Tap, tap, tap!' },
          { speaker: 'Nonna Rosa', text: 'Then hire workers. Drivers to deliver, more cooks for the kitchen. Capisce?' },
        ],
      },
      {
        backdrop: 'downtown',
        cast: [{ id: 'nonna-rosa', mood: 'happy' }],
        lines: [
          { speaker: 'Nonna Rosa', text: 'Make Downtown smell like Rosa\'s again. I\'ll be watching. Always watching.' },
        ],
      },
    ],
  },
  {
    id: 'downtown-2',
    city: 'home',
    character: 'nonna-rosa',
    neighborhood: 'downtown',
    beat: 2,
    title: 'First Regulars',
    trigger: { kind: 'deliveries', neighborhood: 'downtown', count: 12 },
    panels: [
      {
        backdrop: 'shop',
        cast: [{ id: 'nonna-rosa', mood: 'surprised' }],
        caption: 'Twelve deliveries. The phone is actually ringing.',
        lines: [
          { speaker: 'Nonna Rosa', text: 'The phone! It rings! I thought it was broken since 1997.' },
        ],
      },
      {
        backdrop: 'downtown',
        cast: [{ id: 'nonna-rosa', mood: 'neutral' }],
        lines: [
          { speaker: 'Nonna Rosa', text: 'The drivers, they come back fast. Hmph. Buy them better rides. Go faster.' },
          { speaker: 'You', text: 'Wait, are you endorsing a modern idea?' },
          { speaker: 'Nonna Rosa', text: 'I endorse nothing. I am simply... noticing.' },
        ],
      },
      {
        backdrop: 'shop',
        cast: [{ id: 'nonna-rosa', mood: 'happy' }],
        lines: [
          { speaker: 'Nonna Rosa', text: 'Twelve pizzas. Is small. Is a start. Keep going, eh?' },
        ],
      },
    ],
  },
  {
    id: 'downtown-3',
    city: 'home',
    character: 'nonna-rosa',
    neighborhood: 'downtown',
    beat: 3,
    title: 'Corporate Crust',
    trigger: { kind: 'deliveries', neighborhood: 'downtown', count: 60 },
    panels: [
      {
        backdrop: 'shop',
        cast: [{ id: 'megaslice-rep', mood: 'happy' }],
        caption: 'A man in a very shiny suit walks in. He does not wipe his feet.',
        lines: [
          { speaker: 'MegaSlice Rep', text: 'Love the vibe! Very "before electricity." MegaSlice wants to buy it!' },
          { speaker: 'MegaSlice Rep', text: 'We\'ll keep the name. Well, the "Pizza" part. Probably.' },
        ],
      },
      {
        backdrop: 'shop',
        cast: [
          { id: 'nonna-rosa', mood: 'angry' },
          { id: 'megaslice-rep', mood: 'surprised' },
        ],
        lines: [
          { speaker: 'Nonna Rosa', text: 'Out! Your crust tastes like a cardboard box that gave up!' },
          { speaker: 'MegaSlice Rep', text: 'Ma\'am, our crust is 40% real bread!' },
        ],
      },
      {
        backdrop: 'megaslice-hq',
        cast: [{ id: 'victor-crust', mood: 'neutral' }],
        lines: [
          { speaker: 'Victor Crust', text: 'One little shop said no? Adorable. Squeeze them.' },
          { speaker: 'Victor Crust', text: 'Every city bends to MegaSlice. Port Marinara will be no different.' },
        ],
      },
      {
        backdrop: 'shop',
        cast: [{ id: 'nonna-rosa', mood: 'neutral' }],
        lines: [
          { speaker: 'Nonna Rosa', text: 'They want a fight? We give them pizza. Lots of pizza. Bake, bake!' },
        ],
      },
    ],
  },
  {
    id: 'downtown-4',
    city: 'home',
    character: 'nonna-rosa',
    neighborhood: 'downtown',
    beat: 4,
    title: 'The Secret Sauce',
    trigger: { kind: 'deliveries', neighborhood: 'downtown', count: 150 },
    reward: 'auto-bake',
    panels: [
      {
        backdrop: 'downtown',
        cast: [],
        caption: '150 deliveries. Downtown smells like Rosa\'s again.',
        lines: [],
      },
      {
        backdrop: 'shop',
        cast: [{ id: 'nonna-rosa', mood: 'happy' }],
        lines: [
          { speaker: 'Nonna Rosa', text: 'Your "modern ideas"... they work. Don\'t tell anyone I said so.' },
          { speaker: 'Nonna Rosa', text: 'Come. Closer. Nobody has seen this card in fifty years.' },
        ],
      },
      {
        backdrop: 'shop',
        prop: 'recipe-card',
        cast: [{ id: 'nonna-rosa', mood: 'neutral' }],
        caption: 'The secret sauce recipe. It is mostly love. And garlic.',
        lines: [
          { speaker: 'You', text: 'That\'s it? Tomatoes, garlic, basil, and "a whisper of patience"?' },
          { speaker: 'Nonna Rosa', text: 'Is the whisper that matters.' },
        ],
      },
      {
        backdrop: 'shop',
        cast: [{ id: 'nonna-rosa', mood: 'happy' }],
        lines: [
          { speaker: 'Nonna Rosa', text: 'From now on, I run the Downtown kitchen myself. You rest your tapping finger.' },
          { speaker: 'Nonna Rosa', text: 'You go open shops in the other neighborhoods. Go! Before I get sentimental.' },
        ],
      },
    ],
  },

  // ───────────────────────────── SUBURBS · Dale ─────────────────────────────
  {
    id: 'suburbs-1',
    city: 'home',
    character: 'dale',
    neighborhood: 'suburbs',
    beat: 1,
    title: 'Meet the Mudhens',
    trigger: { kind: 'unlock', neighborhood: 'suburbs' },
    panels: [
      {
        backdrop: 'suburbs',
        cast: [{ id: 'dale', mood: 'happy' }],
        caption: 'Snip! Your Suburbs pizzeria opens. Lawns, minivans, a loud whistle.',
        lines: [
          { speaker: 'Dale', text: 'Hey there, pal! Dale Hoffman, Mudhens coach. Welcome to the neighborhood!' },
          { speaker: 'Dale', text: 'We\'re oh-and-fourteen this season. Which means we can only go up!' },
        ],
      },
      {
        backdrop: 'suburbs',
        cast: [{ id: 'dale', mood: 'sad' }],
        lines: [
          { speaker: 'Dale', text: 'Problem is, post-game snack is orange slices. The kids are... not inspired.' },
          { speaker: 'You', text: 'What if the post-game snack was pizza?' },
        ],
      },
      {
        backdrop: 'suburbs',
        cast: [{ id: 'dale', mood: 'surprised' }],
        lines: [
          { speaker: 'Dale', text: 'PIZZA?! Pal, these families have big orders and bigger wallets.' },
          { speaker: 'Dale', text: 'Every pizza out here pays way more than Downtown. You picked a good spot!' },
        ],
      },
      {
        backdrop: 'suburbs',
        cast: [{ id: 'dale', mood: 'happy' }],
        lines: [
          { speaker: 'Dale', text: 'Who runs this shop when you\'re gone? Hire a manager, pal. Trust a coach.' },
          { speaker: 'Dale', text: 'Go, Mudhens! ...That\'s our chant. It\'s a work in progress.' },
        ],
      },
    ],
  },
  {
    id: 'suburbs-2',
    city: 'home',
    character: 'dale',
    neighborhood: 'suburbs',
    beat: 2,
    title: 'A Real Goal',
    trigger: { kind: 'deliveries', neighborhood: 'suburbs', count: 300 },
    panels: [
      {
        backdrop: 'suburbs',
        cast: [],
        caption: 'Saturday. The Mudhens trail 6-0. Then the pizza arrives at halftime.',
        lines: [],
      },
      {
        backdrop: 'suburbs',
        cast: [{ id: 'dale', mood: 'surprised' }],
        caption: 'A kid named Tater kicks the ball. It goes in the RIGHT goal.',
        lines: [
          { speaker: 'Dale', text: 'Was that... the correct net? Somebody check! Somebody check the net!' },
        ],
      },
      {
        backdrop: 'suburbs',
        cast: [{ id: 'dale', mood: 'happy' }],
        lines: [
          { speaker: 'Dale', text: 'We lost 6-1 but that is the BEST loss in Mudhens history!' },
          { speaker: 'Dale', text: 'Pizza every game from now on. That\'s not a request, pal. It\'s a strategy.' },
        ],
      },
    ],
  },
  {
    id: 'suburbs-3',
    city: 'home',
    character: 'dale',
    neighborhood: 'suburbs',
    beat: 3,
    title: 'Sponsored by Sadness',
    trigger: { kind: 'deliveries', neighborhood: 'suburbs', count: 2000 },
    panels: [
      {
        backdrop: 'suburbs',
        cast: [{ id: 'megaslice-rep', mood: 'happy' }],
        caption: 'The Mudhens are winning. Someone has noticed.',
        lines: [
          { speaker: 'MegaSlice Rep', text: 'Free jerseys for the team! All you gotta do is say "MegaSlice" a lot.' },
        ],
      },
      {
        backdrop: 'suburbs',
        cast: [
          { id: 'dale', mood: 'surprised' },
          { id: 'megaslice-rep', mood: 'neutral' },
        ],
        lines: [
          { speaker: 'Dale', text: 'Gee, free jerseys. Our current ones are mostly ketchup stains.' },
          { speaker: 'MegaSlice Rep', text: 'And of course, team snack switches to MegaSlice Pizza Product.' },
        ],
      },
      {
        backdrop: 'megaslice-hq',
        cast: [{ id: 'victor-crust', mood: 'happy' }],
        lines: [
          { speaker: 'Victor Crust', text: 'Win the children, win the minivans. Win the minivans, win the suburbs.' },
        ],
      },
      {
        backdrop: 'suburbs',
        cast: [{ id: 'dale', mood: 'neutral' }],
        lines: [
          { speaker: 'Dale', text: 'Lemme think on it, pal. Championship\'s coming up. We need every edge.' },
        ],
      },
    ],
  },
  {
    id: 'suburbs-4',
    city: 'home',
    character: 'dale',
    neighborhood: 'suburbs',
    beat: 4,
    title: 'Mudhens Rise',
    trigger: { kind: 'deliveries', neighborhood: 'suburbs', count: 8000 },
    panels: [
      {
        backdrop: 'suburbs',
        cast: [{ id: 'dale', mood: 'neutral' }],
        caption: 'The championship. Mudhens vs. the undefeated Thunder Llamas.',
        lines: [
          { speaker: 'Dale', text: 'I told that MegaSlice fella no thanks. Jerseys don\'t score goals. Pizza does.' },
        ],
      },
      {
        backdrop: 'suburbs',
        cast: [{ id: 'dale', mood: 'surprised' }],
        caption: 'Final seconds. Tied 2-2. Tater has the ball.',
        lines: [
          { speaker: 'Dale', text: 'Go, Tater, go! Not that way! THAT way! Yes! YES!' },
        ],
      },
      {
        backdrop: 'suburbs',
        cast: [{ id: 'dale', mood: 'happy' }],
        caption: 'MUDHENS WIN. Somebody\'s mom faints.',
        lines: [
          { speaker: 'Dale', text: 'Champions! The Mudhens are champions! I\'m gonna cry. I\'m crying.' },
          { speaker: 'Dale', text: 'Whole Suburbs is eating at your shop now, pal. You\'re family.' },
        ],
      },
    ],
  },

  // ───────────────────────────── WATERFRONT · Marisol ─────────────────────────────
  {
    id: 'waterfront-1',
    city: 'home',
    character: 'marisol',
    neighborhood: 'waterfront',
    beat: 1,
    title: 'Old Salt',
    trigger: { kind: 'unlock', neighborhood: 'waterfront' },
    panels: [
      {
        backdrop: 'waterfront',
        cast: [],
        caption: 'Your new place on the Waterfront opens. Gulls, fog, and old boats.',
        lines: [],
      },
      {
        backdrop: 'shop',
        cast: [{ id: 'marisol', mood: 'neutral' }],
        lines: [
          { speaker: 'Captain Marisol', text: 'Ahoy, landlubber. Captain Marisol. Retired. Mostly. Your first customer.' },
          { speaker: 'Captain Marisol', text: 'Forty years I fished these waters. Now I just feed the gulls and complain.' },
        ],
      },
      {
        backdrop: 'waterfront',
        cast: [{ id: 'marisol', mood: 'happy' }],
        lines: [
          { speaker: 'Captain Marisol', text: 'Dock crews work all hours and tip like sailors. Generously, I mean.' },
          { speaker: 'Captain Marisol', text: 'Pizza out here fetches a fine price. You dropped anchor in the right spot.' },
        ],
      },
      {
        backdrop: 'waterfront',
        cast: [{ id: 'marisol', mood: 'neutral' }],
        lines: [
          { speaker: 'Captain Marisol', text: 'Just keep the anchovies off mine. I\'ve met enough fish for one lifetime.' },
        ],
      },
    ],
  },
  {
    id: 'waterfront-2',
    city: 'home',
    character: 'marisol',
    neighborhood: 'waterfront',
    beat: 2,
    title: 'Pizza Night Dockside',
    trigger: { kind: 'deliveries', neighborhood: 'waterfront', count: 3000 },
    panels: [
      {
        backdrop: 'waterfront',
        cast: [{ id: 'marisol', mood: 'happy' }],
        caption: 'Friday nights, the whole dock eats together now.',
        lines: [
          { speaker: 'Captain Marisol', text: 'Haven\'t seen this many folks on Pier 9 since the Great Lobster Escape of \'88.' },
        ],
      },
      {
        backdrop: 'waterfront',
        cast: [{ id: 'marisol', mood: 'neutral' }],
        lines: [
          { speaker: 'You', text: 'What happened in the Great Lobster Escape?' },
          { speaker: 'Captain Marisol', text: 'We don\'t talk about it. They\'re still out there.' },
        ],
      },
      {
        backdrop: 'waterfront',
        cast: [{ id: 'marisol', mood: 'happy' }],
        lines: [
          { speaker: 'Captain Marisol', text: 'This dock\'s been my home all my life. Nice to see it full again.' },
        ],
      },
    ],
  },
  {
    id: 'waterfront-3',
    city: 'home',
    character: 'marisol',
    neighborhood: 'waterfront',
    beat: 3,
    title: 'For Sale',
    trigger: { kind: 'deliveries', neighborhood: 'waterfront', count: 15000 },
    panels: [
      {
        backdrop: 'waterfront',
        prop: 'sold-sign',
        cast: [{ id: 'marisol', mood: 'sad' }],
        caption: 'A sign appears on Pier 9: "SOLD SOON — FUTURE MEGASLICE MEGASTORE."',
        lines: [
          { speaker: 'Captain Marisol', text: 'The harbor board\'s broke. They\'re selling my dock to the highest bidder.' },
        ],
      },
      {
        backdrop: 'waterfront',
        cast: [
          { id: 'megaslice-rep', mood: 'happy' },
          { id: 'marisol', mood: 'angry' },
        ],
        lines: [
          { speaker: 'MegaSlice Rep', text: 'Picture it! A 40-story pizza megastore! With a parking lot for boats!' },
          { speaker: 'Captain Marisol', text: 'Boats don\'t PARK, you barnacle!' },
        ],
      },
      {
        backdrop: 'megaslice-hq',
        cast: [{ id: 'victor-crust', mood: 'happy' }],
        lines: [
          { speaker: 'Victor Crust', text: 'The auction closes soon. Outbid MegaSlice? With pizza money? Ha!' },
        ],
      },
      {
        backdrop: 'waterfront',
        cast: [{ id: 'marisol', mood: 'neutral' }],
        lines: [
          { speaker: 'You', text: 'Then we sell a LOT of pizza. Captain, we\'re buying your dock.' },
          { speaker: 'Captain Marisol', text: 'Hmph. Never bet against a stubborn crew. All hands!' },
        ],
      },
    ],
  },
  {
    id: 'waterfront-4',
    city: 'home',
    character: 'marisol',
    neighborhood: 'waterfront',
    beat: 4,
    title: 'Dock Saved',
    trigger: { kind: 'deliveries', neighborhood: 'waterfront', count: 50000 },
    panels: [
      {
        backdrop: 'waterfront',
        cast: [{ id: 'megaslice-rep', mood: 'surprised' }],
        caption: 'Auction day. The final bid comes in... from a pizza shop.',
        lines: [
          { speaker: 'MegaSlice Rep', text: 'You outbid us? With PIZZA money? That\'s not in my slideshow!' },
        ],
      },
      {
        backdrop: 'waterfront',
        cast: [{ id: 'marisol', mood: 'happy' }],
        lines: [
          { speaker: 'Captain Marisol', text: 'Pier 9 stays a pier! Somebody ring the bell!' },
          { speaker: 'Captain Marisol', text: 'You saved this old dock, kid. Saved me, too, I reckon.' },
        ],
      },
      {
        backdrop: 'waterfront',
        cast: [{ id: 'marisol', mood: 'happy' }],
        caption: 'The new sign on Pier 9 has a slice of pizza painted on it.',
        lines: [
          { speaker: 'Captain Marisol', text: 'Waterfront\'s yours, Captain. Even the anchovies are on your side now.' },
        ],
      },
    ],
  },

  // ───────────────────────────── UNIVERSITY · Priya ─────────────────────────────
  {
    id: 'university-1',
    city: 'home',
    character: 'priya',
    neighborhood: 'university',
    beat: 1,
    title: 'The Cheapest Slice',
    trigger: { kind: 'unlock', neighborhood: 'university' },
    panels: [
      {
        backdrop: 'university',
        cast: [],
        caption: 'University District, finals week. Your new shop opens. Students pour in.',
        lines: [],
      },
      {
        backdrop: 'shop',
        cast: [{ id: 'priya', mood: 'neutral' }],
        lines: [
          { speaker: 'Priya', text: 'Hi. One plain cheese slice. Your cheapest one. I\'m paying in quarters.' },
          { speaker: 'Priya', text: 'Some dimes. One button. Is a button legal tender? Asking for me.' },
        ],
      },
      {
        backdrop: 'university',
        cast: [{ id: 'priya', mood: 'happy' }],
        lines: [
          { speaker: 'Priya', text: 'Priya. Computer science, year three. Sleep, year zero.' },
          { speaker: 'Priya', text: 'Students order nonstop, all night. Your new place will never be empty.' },
        ],
      },
      {
        backdrop: 'university',
        cast: [{ id: 'priya', mood: 'neutral' }],
        lines: [
          { speaker: 'Priya', text: 'Same time tomorrow? Same slice. Same quarters. Probably fewer quarters.' },
        ],
      },
    ],
  },
  {
    id: 'university-2',
    city: 'home',
    character: 'priya',
    neighborhood: 'university',
    beat: 2,
    title: 'Debugging Dinner',
    trigger: { kind: 'deliveries', neighborhood: 'university', count: 30000 },
    panels: [
      {
        backdrop: 'university',
        cast: [{ id: 'priya', mood: 'surprised' }],
        caption: 'Night 63 of Priya\'s plain cheese slice.',
        lines: [
          { speaker: 'Priya', text: 'Your driver took a weird route. I mapped it. You\'re losing four minutes a trip.' },
        ],
      },
      {
        backdrop: 'university',
        cast: [{ id: 'priya', mood: 'happy' }],
        lines: [
          { speaker: 'Priya', text: 'So I wrote a little routing app. On a napkin. Then on a laptop. Mostly laptop.' },
          { speaker: 'You', text: 'You built that... for one slice of pizza?' },
          { speaker: 'Priya', text: 'For a HOT slice of pizza. There\'s a difference.' },
        ],
      },
      {
        backdrop: 'shop',
        cast: [{ id: 'priya', mood: 'happy' }],
        lines: [
          { speaker: 'You', text: 'Priya, how\'d you like a job? Paid in actual money. And unlimited slices.' },
          { speaker: 'Priya', text: 'Unlimited?? Okay. Okay okay okay. I\'m in.' },
        ],
      },
    ],
  },
  {
    id: 'university-3',
    city: 'home',
    character: 'priya',
    neighborhood: 'university',
    beat: 3,
    title: 'Poached',
    trigger: { kind: 'deliveries', neighborhood: 'university', count: 135000 },
    panels: [
      {
        backdrop: 'university',
        cast: [{ id: 'megaslice-rep', mood: 'happy' }],
        caption: 'Career fair. MegaSlice has a booth. It has a smoke machine.',
        lines: [
          { speaker: 'MegaSlice Rep', text: 'Priya! Come code for MegaSlice! Free kombucha! Beanbags! A LADDER!' },
        ],
      },
      {
        backdrop: 'university',
        cast: [
          { id: 'priya', mood: 'surprised' },
          { id: 'megaslice-rep', mood: 'neutral' },
        ],
        lines: [
          { speaker: 'Priya', text: 'What would I be building?' },
          { speaker: 'MegaSlice Rep', text: 'An app that tells people our pizza is good. Very advanced. Mostly lying.' },
        ],
      },
      {
        backdrop: 'megaslice-hq',
        cast: [{ id: 'victor-crust', mood: 'neutral' }],
        lines: [
          { speaker: 'Victor Crust', text: 'Every genius has a price. Find hers. Double it. Then triple it.' },
        ],
      },
      {
        backdrop: 'shop',
        cast: [{ id: 'priya', mood: 'sad' }],
        lines: [
          { speaker: 'Priya', text: 'They offered me a lot. Like, "pay off my loans" a lot. I need to think.' },
        ],
      },
    ],
  },
  {
    id: 'university-4',
    city: 'home',
    character: 'priya',
    neighborhood: 'university',
    beat: 4,
    title: 'Drone Launch',
    trigger: { kind: 'deliveries', neighborhood: 'university', count: 450000 },
    reward: 'drones',
    panels: [
      {
        backdrop: 'shop',
        cast: [{ id: 'priya', mood: 'happy' }],
        caption: 'Priya returns. She is carrying something with propellers.',
        lines: [
          { speaker: 'Priya', text: 'I said no to MegaSlice. Their code was spaghetti. And not the good kind.' },
          { speaker: 'Priya', text: 'Also you gave me a slice when I had only buttons. That counts for a lot.' },
        ],
      },
      {
        backdrop: 'shop',
        cast: [{ id: 'priya', mood: 'surprised' }],
        lines: [
          { speaker: 'You', text: 'Is that... a flying pizza box?' },
          { speaker: 'Priya', text: 'Delivery drone. GPS, heat-lock lid, and it says "thank you" in nine languages.' },
        ],
      },
      {
        backdrop: 'university',
        cast: [{ id: 'priya', mood: 'happy' }],
        caption: 'A hundred tiny drones lift off over campus. Students cheer.',
        lines: [
          { speaker: 'Priya', text: 'Drones are live! No traffic, no parking, no excuses. Only pizza.' },
          { speaker: 'Priya', text: 'University is officially Team You. Now... about those unlimited slices.' },
        ],
      },
    ],
  },

  // ───────────────────────────── INDUSTRIAL · Big Sal ─────────────────────────────
  {
    id: 'industrial-1',
    city: 'home',
    character: 'big-sal',
    neighborhood: 'industrial',
    beat: 1,
    title: 'Night Shift',
    trigger: { kind: 'unlock', neighborhood: 'industrial' },
    panels: [
      {
        backdrop: 'industrial',
        cast: [],
        caption: 'Opening day in the Industrial Zone. Sparks, smoke, one very large man.',
        lines: [],
      },
      {
        backdrop: 'industrial',
        cast: [{ id: 'big-sal', mood: 'angry' }],
        lines: [
          { speaker: 'Big Sal', text: 'You the pizza kid? I hate pizza. I hate kids. I hate Tuesdays.' },
          { speaker: 'You', text: 'It\'s Thursday.' },
          { speaker: 'Big Sal', text: 'Then I hate Thursdays.' },
        ],
      },
      {
        backdrop: 'industrial',
        cast: [{ id: 'big-sal', mood: 'neutral' }],
        lines: [
          { speaker: 'Big Sal', text: 'Three shifts. Hungry crews. Whole crates of pies at a time. Big money.' },
          { speaker: 'Big Sal', text: 'Don\'t get excited. I said the money\'s big. Not that I like you.' },
        ],
      },
      {
        backdrop: 'industrial',
        cast: [{ id: 'big-sal', mood: 'neutral' }],
        lines: [
          { speaker: 'Big Sal', text: 'Hot by midnight. Cold pizza, you\'re done. Got it? Good.' },
          { speaker: 'Big Sal', text: 'And get a manager. A shop that stops when you leave ain\'t a shop.' },
        ],
      },
    ],
  },
  {
    id: 'industrial-2',
    city: 'home',
    character: 'big-sal',
    neighborhood: 'industrial',
    beat: 2,
    title: 'Almost a Smile',
    trigger: { kind: 'deliveries', neighborhood: 'industrial', count: 100000 },
    panels: [
      {
        backdrop: 'industrial',
        cast: [{ id: 'big-sal', mood: 'neutral' }],
        caption: 'Midnight. A hundred thousand pies in. Not one cold.',
        lines: [
          { speaker: 'Big Sal', text: 'Pizza\'s... fine. Crust\'s fine. Sauce is...' },
        ],
      },
      {
        backdrop: 'industrial',
        cast: [{ id: 'big-sal', mood: 'surprised' }],
        lines: [
          { speaker: 'Big Sal', text: 'Wait. This sauce. Where\'d you get this sauce?' },
          { speaker: 'You', text: 'Family recipe. Well, somebody\'s family.' },
        ],
      },
      {
        backdrop: 'industrial',
        cast: [{ id: 'big-sal', mood: 'sad' }],
        lines: [
          { speaker: 'Big Sal', text: 'Hmph. Tastes like... something I used to know. Forget it. Back to work.' },
        ],
      },
    ],
  },
  {
    id: 'industrial-3',
    city: 'home',
    character: 'big-sal',
    neighborhood: 'industrial',
    beat: 3,
    title: 'Vending Machine War',
    trigger: { kind: 'deliveries', neighborhood: 'industrial', count: 360000 },
    panels: [
      {
        backdrop: 'industrial',
        prop: 'vending-machine',
        cast: [{ id: 'megaslice-rep', mood: 'happy' }],
        caption: 'Overnight, MegaSlice vending machines appear in every break room.',
        lines: [
          { speaker: 'MegaSlice Rep', text: 'Pizza from a machine! 90 seconds! It\'s hot on the outside! Mostly!' },
        ],
      },
      {
        backdrop: 'industrial',
        prop: 'vending-machine',
        cast: [
          { id: 'big-sal', mood: 'angry' },
          { id: 'megaslice-rep', mood: 'surprised' },
        ],
        lines: [
          { speaker: 'Big Sal', text: 'One of my guys bit into that thing and chipped a tooth.' },
          { speaker: 'MegaSlice Rep', text: 'That\'s our signature Crunch-Crust! Very premium!' },
        ],
      },
      {
        backdrop: 'megaslice-hq',
        cast: [{ id: 'victor-crust', mood: 'angry' }],
        lines: [
          { speaker: 'Victor Crust', text: 'Why are factory workers still ordering from that little shop? FIX IT.' },
        ],
      },
      {
        backdrop: 'industrial',
        cast: [{ id: 'big-sal', mood: 'neutral' }],
        lines: [
          { speaker: 'Big Sal', text: 'Kid. Keep the real pizza coming. I\'ll handle the machines.' },
        ],
      },
    ],
  },
  {
    id: 'industrial-4',
    city: 'home',
    character: 'big-sal',
    neighborhood: 'industrial',
    beat: 4,
    title: 'Brother Sal',
    trigger: { kind: 'deliveries', neighborhood: 'industrial', count: 1000000 },
    panels: [
      {
        backdrop: 'industrial',
        cast: [{ id: 'big-sal', mood: 'happy' }],
        caption: 'The MegaSlice machines are gone. Mysteriously. Nobody saw anything.',
        lines: [
          { speaker: 'Big Sal', text: 'My crew voted. Your pizza only. Unanimous. Even Gary, and Gary hates voting.' },
        ],
      },
      {
        backdrop: 'shop',
        cast: [
          { id: 'big-sal', mood: 'neutral' },
          { id: 'nonna-rosa', mood: 'surprised' },
        ],
        caption: 'Big Sal visits Rosa\'s Downtown shop for the first time.',
        lines: [
          { speaker: 'Nonna Rosa', text: '...Salvatore?' },
          { speaker: 'Big Sal', text: 'Hi, Rosie. Forty years. I knew that sauce the second I tasted it.' },
        ],
      },
      {
        backdrop: 'shop',
        cast: [
          { id: 'big-sal', mood: 'sad' },
          { id: 'nonna-rosa', mood: 'sad' },
        ],
        lines: [
          { speaker: 'Big Sal', text: 'I was a stubborn fool. Left over a fight about... what was it?' },
          { speaker: 'Nonna Rosa', text: 'Pineapple. You put pineapple on Mama\'s pizza.' },
          { speaker: 'Big Sal', text: 'And I\'d do it again. ...But I\'m sorry I left.' },
        ],
      },
      {
        backdrop: 'shop',
        cast: [
          { id: 'big-sal', mood: 'happy' },
          { id: 'nonna-rosa', mood: 'happy' },
        ],
        lines: [
          { speaker: 'Nonna Rosa', text: 'Come here, you big meatball.' },
          { speaker: 'Big Sal', text: 'Kid, you brought my family back. Industrial\'s yours. And so\'s my Thursday.' },
        ],
      },
    ],
  },

  // ───────────────────────────── UPTOWN · Genevieve ─────────────────────────────
  {
    id: 'uptown-1',
    city: 'home',
    character: 'genevieve',
    neighborhood: 'uptown',
    beat: 1,
    title: 'One Star',
    trigger: { kind: 'unlock', neighborhood: 'uptown' },
    panels: [
      {
        backdrop: 'uptown',
        cast: [],
        caption: 'Uptown. Tiny dogs in tiny coats. Your newest pizzeria opens.',
        lines: [],
      },
      {
        backdrop: 'shop',
        cast: [{ id: 'genevieve', mood: 'neutral' }],
        lines: [
          { speaker: 'Genevieve', text: 'Genevieve Laurent. Food critic. You may have heard of me. Everyone has.' },
          { speaker: 'Genevieve', text: 'A grand opening. How quaint. Let us see. *one dainty bite*' },
        ],
      },
      {
        backdrop: 'uptown',
        cast: [{ id: 'genevieve', mood: 'angry' }],
        lines: [
          { speaker: 'Genevieve', text: 'Lukewarm. Rushed. The basil is... frightened. One star.' },
          { speaker: 'You', text: 'Frightened basil?!' },
        ],
      },
      {
        backdrop: 'uptown',
        cast: [{ id: 'genevieve', mood: 'neutral' }],
        lines: [
          { speaker: 'Genevieve', text: 'Uptown pays the most in the city, darling. So we expect the most.' },
          { speaker: 'Genevieve', text: 'Impress me, and the whole city will follow. Fail, and... well. One star.' },
        ],
      },
    ],
  },
  {
    id: 'uptown-2',
    city: 'home',
    character: 'genevieve',
    neighborhood: 'uptown',
    beat: 2,
    title: 'Second Bite',
    trigger: { kind: 'deliveries', neighborhood: 'uptown', count: 200000 },
    panels: [
      {
        backdrop: 'uptown',
        cast: [{ id: 'genevieve', mood: 'neutral' }],
        caption: 'Genevieve orders again. Purely for research, she insists.',
        lines: [
          { speaker: 'Genevieve', text: 'I am only here to confirm my one star. Professionally.' },
        ],
      },
      {
        backdrop: 'uptown',
        cast: [{ id: 'genevieve', mood: 'surprised' }],
        caption: 'One bite. The critic goes very, very still.',
        lines: [
          { speaker: 'Genevieve', text: 'Oh. Oh no. I think I... like it?' },
          { speaker: 'Genevieve', text: 'The crust sings. The sauce has a whisper of... patience?' },
        ],
      },
      {
        backdrop: 'uptown',
        cast: [{ id: 'genevieve', mood: 'happy' }],
        lines: [
          { speaker: 'Genevieve', text: 'I may have been... hasty. Do not quote me. I will deny everything.' },
          { speaker: 'Genevieve', text: 'Bring another. For research. And one for my dog, Croissant.' },
        ],
      },
    ],
  },
  {
    id: 'uptown-3',
    city: 'home',
    character: 'genevieve',
    neighborhood: 'uptown',
    beat: 3,
    title: 'A Bribe on Toast',
    trigger: { kind: 'deliveries', neighborhood: 'uptown', count: 625000 },
    panels: [
      {
        backdrop: 'megaslice-hq',
        cast: [{ id: 'victor-crust', mood: 'happy' }],
        caption: 'MegaSlice HQ. The top floor. The air smells like money.',
        lines: [
          { speaker: 'Victor Crust', text: 'Ms. Laurent. One glowing review of MegaSlice and this yacht is yours.' },
        ],
      },
      {
        backdrop: 'megaslice-hq',
        cast: [
          { id: 'genevieve', mood: 'surprised' },
          { id: 'victor-crust', mood: 'neutral' },
        ],
        lines: [
          { speaker: 'Genevieve', text: 'A yacht? For a review? Of THAT pizza?' },
          { speaker: 'Victor Crust', text: 'Two yachts. A matching one for the dog.' },
        ],
      },
      {
        backdrop: 'uptown',
        cast: [{ id: 'megaslice-rep', mood: 'happy' }],
        lines: [
          { speaker: 'MegaSlice Rep', text: 'Big review drops tomorrow! Pretty sure it\'s about us! Ninety percent sure!' },
        ],
      },
      {
        backdrop: 'shop',
        cast: [{ id: 'nonna-rosa', mood: 'sad' }],
        lines: [
          { speaker: 'Nonna Rosa', text: 'A critic with a yacht is a critic with a price. We will see, eh?' },
        ],
      },
    ],
  },
  {
    id: 'uptown-4',
    city: 'home',
    character: 'genevieve',
    neighborhood: 'uptown',
    beat: 4,
    title: 'Five Stars',
    trigger: { kind: 'deliveries', neighborhood: 'uptown', count: 1250000 },
    reward: 'city-complete',
    panels: [
      {
        backdrop: 'uptown',
        cast: [{ id: 'genevieve', mood: 'happy' }],
        caption: 'The Port Marinara Times. Front page. Five stars.',
        lines: [
          { speaker: 'Genevieve', text: '"The best pizza in Port Marinara is not on a yacht. It is on a bike. Lately, a drone."' },
          { speaker: 'Genevieve', text: 'I returned the yacht. Croissant was seasick anyway.' },
        ],
      },
      {
        backdrop: 'megaslice-hq',
        cast: [{ id: 'victor-crust', mood: 'angry' }],
        caption: 'Every neighborhood has chosen you. MegaSlice is out of Port Marinara.',
        lines: [
          { speaker: 'Victor Crust', text: 'One city. You won ONE city. This war is not over, pizza person.' },
          { speaker: 'Victor Crust', text: 'Enjoy your little port. I\'ll be waiting in Boston.' },
        ],
      },
      {
        backdrop: 'shop',
        cast: [
          { id: 'genevieve', mood: 'happy' },
          { id: 'nonna-rosa', mood: 'happy' },
        ],
        lines: [
          { speaker: 'Genevieve', text: 'My review went national, darling. Everyone wants a Rosa\'s now.' },
          { speaker: 'Nonna Rosa', text: 'A new city? Pack the sauce. And take a sweater. Boston is cold.' },
        ],
      },
      {
        backdrop: 'downtown',
        cast: [],
        caption: 'Port Marinara is yours. Next stop: the whole country.',
        lines: [],
      },
    ],
  },
];
