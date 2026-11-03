// Shared scenarios for the JS and PHP engines. `node tests/make-vectors.js`
// writes the JS results to vectors.json; tests/engine-test.php checks PHP against it.
const T0 = Date.UTC(2026, 10, 1);

const scenarios = [
	{ name: 'idle-week', ops: [['buy', '16181'], ['buy', '15943'], ['adv', 168]] },
	{ name: 'daily-player', ops: [
		['adv', 7], ['act', 'feed'], ['act', 'test'], ['adv', 17], ['act', 'feed'], ['act', 'change'],
		['act', 'glass'], ['adv', 30], ['act', 'feed'], ['act', 'glass'], ['act', 'collect'], ['buy', '4873'],
		['adv', 49], ['act', 'feed'], ['act', 'change'], ['act', 'test'], ['act', 'collect']
	] },
	{ name: 'emergency-save', ops: [
		['buy', '16181'], ['adv', 120], ['act', 'feed'], ['act', 'change'], ['adv', 10], ['act', 'glass'], ['adv', 40]
	] },
	{ name: 'overfeed-and-limits', ops: [
		['act', 'feed'], ['act', 'feed'], ['buy', '15503'], ['buy', '5862'], ['buy', '16181'], ['buy', '15943'],
		['buy', '4873'], ['upgrade', false], ['upgrade', true], ['read', '16458'], ['read', '16458'], ['adv', 2.5]
	] },
	{ name: 'upgrade-path', ops: [
		['set', { xp: 2000, coins: 5000 }], ['upgrade', true], ['buy', '7499'], ['upgrade', true], ['buy', '15503'],
		['buy', '5728'], ['buy', '11366'], ['upgrade', true], ['buy', '5862'], ['adv', 100], ['act', 'feed']
	] },
	{ name: 'long-absence', ops: [['buy', '16181'], ['buy', '15943'], ['adv', 24 * 90], ['act', 'restart'], ['adv', 5]] }
];

function run(E, sc, catalog) {
	let now = T0;
	const state = E.newState(catalog, now);
	const results = [];
	for (const [op, arg] of sc.ops) {
		if (op === 'adv') {
			now += arg * E.HOUR;
			E.advance(state, now, catalog);
		} else if (op === 'act') {
			results.push(E.act(state, arg, now, catalog));
		} else if (op === 'buy') {
			results.push(E.buy(state, arg, catalog));
		} else if (op === 'upgrade') {
			results.push(E.upgrade(state, arg));
		} else if (op === 'read') {
			results.push(E.claimRead(state, arg));
		} else if (op === 'set') {
			Object.assign(state, arg);
		}
	}
	return { name: sc.name, results, state };
}

module.exports = { scenarios, run, T0 };
