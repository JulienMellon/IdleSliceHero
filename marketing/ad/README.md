# 15 s promo ad (placeholder)

`slice-empire-ad-15s-draft1.mp4`: 1080×1920 (9:16), 30 fps, H.264 + AAC, 15.0 s, −16 LUFS integrated, −3.5 dBTP. Made 2026-10-31 from the v5.6 web build. It's a placeholder until real ad work (UA platforms, ad networks) starts.

| Time | Footage | Caption |
| --- | --- | --- |
| 0.0–2.3 s | Waterfront kitchen, taps prep → oven → counter (tap ripples drawn on) | Tap. Bake. Serve. |
| 2.3–4.6 s | same, "+$" pops | Every pizza = cash! |
| 4.6–8.4 s | Maxed Industrial flagship, crew-run, two rush taps | Hire a crew. Watch it run. |
| 8.4–10.8 s | Uptown, Waterfront, Suburbs (0.8 s each) | 6 pizzerias. One city. |
| 10.8–11.8 s | City map | Build your pizza empire. |
| 11.8–15.0 s | Title-card logo + Nonna, slow push-in | Play free · Coming soon on iPhone |

Audio: the Downtown loop from its A section (pre-lofi score), tap SFX on every tap, collect ka-ching + `milestone_big` stinger on the end card.

## Rebuild
```
npx expo export --platform web                          # in the repo root
python3 marketing/ad/record.py dist /tmp/ad-raw         # ~2 min; steps the page's fake clock 1/30 s per frame
cd marketing/ad && mkdir -p audio && cp ../../assets/audio/music/downtown.m4a ../../assets/audio/sfx/tap_*.m4a \
   ../../assets/audio/sfx/collect_2.m4a ../../assets/audio/sting/downtown_milestone_big.m4a audio/ \
 && cp ../../node_modules/@expo-google-fonts/fredoka/{700Bold/Fredoka_700Bold,600SemiBold/Fredoka_600SemiBold}.ttf . \
 && python3 compose_ad.py /tmp/ad-raw out.mp4
```
`record.py` reads the HUD's "Tap to serve / bake / prep" line and taps that station, so taps never get refused. Station tap points are in 9:16 frame pixels (`STATION_PX`); re-measure them if the shop layout changes.

## Before running it as a paid ad
- Swap "Coming soon on iPhone" for the store CTA and Apple's official badge once the app is live.
- Platform specs differ (TikTok/Meta safe zones keep the bottom ~20% and right edge clear of UI). Captions currently sit at y ≈ 1745, inside TikTok's bottom UI zone: move them to y ≈ 1350 for TikTok cuts.
- Re-record with the lofi score once it's final, if you want the ad to match the game.
