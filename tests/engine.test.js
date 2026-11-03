// Run: node --test reef-keeper/tests/
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const E = require('../assets/engine.js');
const { scenarios, run } = require('./scenarios.js');

const catalog = require('./catalog.json');
const T0 = Date.UTC(2026, 10, 1);
const H = E.HOUR;

function fresh() {
	return E.newState(catalog, T0);
}

test('starter is the clownfish', () => {
	const s = fresh();
	assert.strictEqual(s.fish.length, 1);
	assert.match(catalog[s.fish[0].sid].name, /Clownfish/);
	assert.deepStrictEqual(s.discovered, [s.fish[0].sid]);
});

test('one day away: hungry but healthy', () => {
	const s = E.advance(fresh(), T0 + 24 * H, catalog);
	assert.ok(s.hunger > 45 && s.hunger < 55);
	assert.strictEqual(s.fish[0].health, 100);
	assert.ok(!E.isSick(s));
});

test('three days away: sick, nobody dead', () => {
	const s = E.advance(fresh(), T0 + 80 * H, catalog);
	assert.ok(E.isSick(s), 'fish should be sick by day 3');
	assert.strictEqual(s.memorial.length, 0);
});

test('five days away: exactly one death, emergency window holds the rest', () => {
	const s = fresh();
	E.buy(s, '16181', catalog);
	E.buy(s, '15943', catalog);
	E.advance(s, T0 + 5 * 24 * H, catalog);
	assert.strictEqual(s.memorial.length, 1);
	assert.strictEqual(s.fish.length, 2);
	const deathAt = s.lastDeath;
	assert.ok(deathAt > T0 + 96 * H && deathAt <= T0 + 120 * H, 'first death in day 5');
	E.advance(s, deathAt + 23 * H, catalog);
	assert.strictEqual(s.memorial.length, 1, 'no second death inside 24h');
	E.advance(s, deathAt + 25 * H, catalog);
	assert.strictEqual(s.memorial.length, 2, 'second death after window');
});

test('care during the emergency window saves the tank', () => {
	const s = fresh();
	E.buy(s, '16181', catalog);
	E.advance(s, T0 + 5 * 24 * H, catalog);
	const now = s.lastDeath + 2 * H;
	E.advance(s, now, catalog);
	E.act(s, 'feed', now);
	E.act(s, 'change', now);
	E.act(s, 'change', now); // cooldown, ignored
	E.advance(s, now + 3 * H, catalog);
	E.act(s, 'glass', now + 3 * H);
	E.advance(s, now + 22 * H, catalog);
	E.act(s, 'feed', now + 22 * H);
	E.act(s, 'change', now + 22 * H);
	E.advance(s, now + 48 * H, catalog);
	assert.strictEqual(s.memorial.length, 1);
	assert.ok(s.fish[0].health > 90);
});

test('cooldowns and overfeeding', () => {
	const s = fresh();
	assert.deepStrictEqual(E.act(s, 'feed', T0), { ok: true, coins: 0, xp: 0, note: 'overfed' });
	assert.strictEqual(s.quality, 92);
	assert.strictEqual(E.act(s, 'feed', T0 + H).error, 'cooldown');
	E.advance(s, T0 + 20 * H, catalog);
	const r = E.act(s, 'feed', T0 + 20 * H);
	assert.strictEqual(r.coins, 4);
	assert.strictEqual(s.hunger, 0);
});

test('buying respects tank rules', () => {
	const s = fresh();
	assert.strictEqual(E.canBuy(s, '15503', catalog), 'tank', 'no corals in nano');
	assert.strictEqual(E.canBuy(s, '5862', catalog), 'tank', 'mandarin too hard');
	assert.strictEqual(E.buy(s, '16181', catalog).discovered, true);
	E.buy(s, '15943', catalog);
	assert.strictEqual(E.canBuy(s, '4873', catalog), 'full');
});

test('upgrade needs membership, xp and coins', () => {
	const s = fresh();
	assert.strictEqual(E.canUpgrade(s, false), 'member');
	assert.strictEqual(E.canUpgrade(s, true), 'xp');
	s.xp = 150;
	assert.strictEqual(E.canUpgrade(s, true), 'coins');
	s.coins = 100;
	assert.ok(E.upgrade(s, true).ok);
	assert.strictEqual(s.tank, 1);
	assert.strictEqual(s.coins, 0);
});

test('empty and broke tank can restart', () => {
	const s = fresh();
	assert.strictEqual(E.act(s, 'restart', T0, catalog).error, 'unneeded');
	E.advance(s, T0 + 10 * 24 * H, catalog);
	assert.strictEqual(s.fish.length, 0);
	s.coins = 5;
	assert.ok(E.act(s, 'restart', T0 + 10 * 24 * H, catalog).ok);
	assert.strictEqual(s.fish.length, 1);
	assert.strictEqual(s.quality, 100);
});

test('read reward is paid once', () => {
	const s = fresh();
	const sid = s.discovered[0];
	assert.strictEqual(E.claimRead(s, sid).coins, 50);
	assert.strictEqual(E.claimRead(s, sid).error, 'claimed');
	assert.strictEqual(E.claimRead(s, '5862').error, 'undiscovered');
});

test('scenarios match the PHP vectors file', () => {
	const file = path.join(__dirname, 'vectors.json');
	const expected = JSON.parse(fs.readFileSync(file, 'utf8'));
	const actual = scenarios.map((sc) => run(E, sc, catalog));
	assert.deepStrictEqual(actual, expected);
});
