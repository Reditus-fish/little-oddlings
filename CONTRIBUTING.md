# Contributing to little oddlings

Small, funny, gentle contributions are welcome. Please open an issue with the
problem or idea before starting a large change. A short recording or screenshot
helps explain an interaction much faster than a long feature list.

## Good first contributions

- Improve one personality's reaction in `public/core/content.js`.
- Propose a short English or Traditional Chinese joke with its cultural context.
  Adapt the joke, not just the words: 社恐 / 社交恐怖份子 needs different delivery
  from ordinary English "social anxiety".
- Draw an original accessory in `public/cartoon.js` or an object in `public/objects.js`.
- Fix keyboard, contrast, small-screen, or reduced-motion behavior.
- Report a confusing first minute, with your browser and steps to reproduce.

The current release does not have a complete localization system. Discuss a locale
file structure before adding translated copies throughout the interface. Likewise,
the engine currently expects three residents: adding a fourth needs a save migration
and validation changes, not only another content record.

## Run and check

Use Node.js 22+. Run `npm start`, then open http://127.0.0.1:4173.
Run `npm test` for state/API checks. Run `npm run build` and `npm run preview` to
check the browser-only version at http://127.0.0.1:4174.

Keep game rules in the pure shared engine and data/text in the content module.
For changes to persistence or behavior, include a test of the actual failure case.
For visual changes, include before/after screenshots and check keyboard navigation,
small screens, and both art styles. Do not commit `data/`, browser saves, `dist/`,
or personal logs. The project runs without dependencies; discuss additions first.

## Design boundaries

- No absence punishment, streak pressure, forced grind, or pay-to-comfort behavior.
- Let a creature say "enough". Extra poking must not prolong its recovery.
- Make a joke understandable in a short clip; do not require humiliating a player.
- Keep quiet mode calm and screen-reader announcements restrained.
- No network calls, telemetry, accounts, or executable third-party mods by default.

Contributions are accepted under the project's MIT license. Only include work you
have the right to share, and add art provenance to ASSETS.md. Generated art must be
identified as such. Please be considerate in issues and reviews; a joke in the game
is not a reason to target real contributors.
