# Reef Keeper

A virtual reef-aquarium care game built as a WordPress plugin for [reefnetwork.com](https://reefnetwork.com). Players care for a tank every couple of days, grow it from a 20 L nano to a 500 L expert reef, and unlock encyclopedia species along the way. Each new species sends them to its encyclopedia page for a reading reward.

**▶ Play the demo:** https://tniron.github.io/reef-keeper/demo/

The demo runs fully in the browser (progress is kept in localStorage) and has a test panel to fast-forward time, toggle membership and switch language (EN/TR).

## How it works
- **Care tasks:** feed, test the water, wipe algae off the glass, change the water. Each has a cooldown and pays coins and XP.
- **Levels:** Nano → Small → Medium → Reef → Expert tanks; each unlocks the next encyclopedia care level (easy, moderate, difficult, expert-only). Corals and invertebrates arrive with the medium tank.
- **Neglect:** animals get sick around day 3 and the weakest one dies around day 5, followed by a 24 h window to save the rest. Members get an email reminder.
- **Membership:** guests play the nano tank; larger tanks need an account, and the guest tank moves to it on sign-up.

## Install
Upload the plugin zip from the [latest release](https://github.com/tniron/reef-keeper/releases/latest) in WordPress → Plugins → Add New → Upload, then put `[reef_keeper]` on a page. Turkish setup notes: [KURULUM.md](KURULUM.md).

## Tests
```bash
node tests/engine.test.js      # JS rules
node tests/make-vectors.js     # regenerate shared vectors
php tests/engine-test.php      # PHP engine matches JS
```
