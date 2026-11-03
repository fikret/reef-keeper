/*
 * Reef Keeper — game rules.
 * Pure functions over a plain state object. The same rules are ported to
 * PHP in includes/class-engine.php; tests/vectors.json keeps them in sync.
 */
(function (root) {
	'use strict';

	var HOUR = 3600 * 1000;
	var DAY = 24 * HOUR;

	var CARE = ['easy', 'moderate', 'difficult', 'expert-only'];
	var PRICE = [20, 45, 90, 160];
	var FRAGILITY = [1, 1.15, 1.3, 1.5];

	var TANKS = [
		{ id: 'nano', liters: 20, cap: 3, maxCare: 0, cats: ['fish'], xp: 0, cost: 0 },
		{ id: 'small', liters: 60, cap: 6, maxCare: 1, cats: ['fish'], xp: 150, cost: 100 },
		{ id: 'medium', liters: 150, cap: 10, maxCare: 1, cats: ['fish', 'coral', 'invert'], xp: 400, cost: 250 },
		{ id: 'reef', liters: 300, cap: 15, maxCare: 2, cats: ['fish', 'coral', 'invert'], xp: 900, cost: 500 },
		{ id: 'expert', liters: 500, cap: 22, maxCare: 3, cats: ['fish', 'coral', 'invert'], xp: 1800, cost: 900 }
	];

	// Cooldowns in hours, rewards in coins / xp.
	var TASKS = {
		feed: { cd: 6, coins: 4, xp: 10 },
		test: { cd: 12, coins: 3, xp: 8 },
		glass: { cd: 8, coins: 4, xp: 10 },
		change: { cd: 20, coins: 8, xp: 15 }
	};

	var HUNGER_RATE = 100 / 48;
	var QUALITY_RATE = 100 / 96;
	var ALGAE_RATE = 100 / 72;
	var DAMAGE = 0.9;
	var REGEN = 3;
	var SICK = 75;
	var DEATH_GAP = DAY;
	var MAX_SIM = 60 * DAY;
	var READ_REWARD = { coins: 50, xp: 20 };
	var START_COINS = 40;

	function careRank(care) {
		var i = CARE.indexOf(care);
		return i < 0 ? 0 : i;
	}

	function info(catalog, sid) {
		var s = catalog[sid];
		return s ? { rank: careRank(s.care), cat: s.cat || 'fish' } : { rank: 0, cat: 'fish' };
	}

	function round2(n) {
		return Math.round(n * 100) / 100;
	}

	function pickStarter(catalog) {
		var easyFish = Object.keys(catalog).filter(function (sid) {
			return catalog[sid].cat === 'fish' && careRank(catalog[sid].care) === 0;
		});
		var clown = easyFish.filter(function (sid) {
			return /clown/i.test(catalog[sid].slug || catalog[sid].name || '');
		});
		return clown[0] || easyFish[0] || Object.keys(catalog)[0] || null;
	}

	function newState(catalog, now) {
		var state = {
			v: 1,
			t: now,
			tank: 0,
			coins: START_COINS,
			xp: 0,
			seq: 0,
			fish: [],
			hunger: 0,
			quality: 100,
			algae: 0,
			pending: 0,
			cd: {},
			discovered: [],
			read: [],
			memorial: [],
			events: [],
			lastDeath: 0
		};
		var starter = pickStarter(catalog);
		if (starter) {
			addAnimal(state, starter);
			state.discovered.push(starter);
		}
		return state;
	}

	function addAnimal(state, sid) {
		state.seq += 1;
		state.fish.push({ uid: state.seq, sid: sid, health: 100 });
	}

	function pushEvent(state, ev) {
		state.events.push(ev);
		if (state.events.length > 20) {
			state.events.splice(0, state.events.length - 20);
		}
	}

	/* One simulation step of dt hours ending at time t. */
	function step(state, dt, t, catalog) {
		var tank = TANKS[state.tank];
		var alive = state.fish.length;
		var cleaners = 0;
		var eaters = 0;
		state.fish.forEach(function (f) {
			var c = info(catalog, f.sid).cat;
			if (c === 'invert') cleaners++;
			if (c === 'fish') eaters++;
		});

		if (eaters > 0) state.hunger = Math.min(100, state.hunger + HUNGER_RATE * dt);
		var load = 0.6 + 0.4 * Math.min(1, alive / tank.cap);
		state.quality = Math.max(0, state.quality - QUALITY_RATE * load * dt);
		var algaeRate = ALGAE_RATE * Math.max(0.4, 1 - 0.15 * cleaners);
		state.algae = Math.min(100, state.algae + algaeRate * dt);

		var dying = [];
		state.fish.forEach(function (f) {
			var i = info(catalog, f.sid);
			var stress = 0;
			if (i.cat === 'fish' && state.hunger >= 100) stress += 1;
			if (state.quality < 30) stress += 1;
			if (state.algae >= 90) stress += 0.25;
			if (stress > 0) {
				f.health -= DAMAGE * FRAGILITY[i.rank] * stress * dt;
			} else {
				f.health = Math.min(100, f.health + REGEN * dt);
			}
			if (f.health <= 0) dying.push(f);
			var happy = f.health >= 80 && (i.cat !== 'fish' || state.hunger < 70);
			if (happy) state.pending += 0.25 * dt;
		});
		state.pending = Math.min(state.pending, 6 * Math.max(1, alive));

		if (dying.length) {
			if (state.lastDeath && t - state.lastDeath < DEATH_GAP) {
				dying.forEach(function (f) { f.health = 1; });
			} else {
				dying.sort(function (a, b) {
					return a.health - b.health ||
						info(catalog, b.sid).rank - info(catalog, a.sid).rank ||
						a.uid - b.uid;
				});
				var dead = dying[0];
				state.fish.splice(state.fish.indexOf(dead), 1);
				dying.slice(1).forEach(function (f) { f.health = 1; });
				state.memorial.push({ sid: dead.sid, t: t });
				state.lastDeath = t;
				pushEvent(state, { type: 'death', sid: dead.sid, t: t });
			}
		}
	}

	/* Bring the simulation up to `now`. Returns the state (mutated). */
	function advance(state, now, catalog) {
		if (now - state.t > MAX_SIM) state.t = now - MAX_SIM;
		while (state.t < now) {
			var next = Math.min(now, state.t + HOUR);
			step(state, (next - state.t) / HOUR, next, catalog);
			state.t = next;
		}
		state.hunger = round2(state.hunger);
		state.quality = round2(state.quality);
		state.algae = round2(state.algae);
		state.pending = round2(state.pending);
		state.fish.forEach(function (f) { f.health = round2(f.health); });
		return state;
	}

	function readings(state) {
		var q = state.quality;
		return {
			ph: Math.round((8.3 - (100 - q) * 0.008) * 100) / 100,
			no3: Math.round(2 + (100 - q) * 0.6),
			temp: 25.5,
			status: q >= 60 ? 'ok' : q >= 30 ? 'warn' : 'bad'
		};
	}

	function cooldownLeft(state, task, now) {
		var until = (state.cd[task] || 0) + TASKS[task].cd * HOUR;
		return Math.max(0, until - now);
	}

	function reward(state, r) {
		state.coins += r.coins;
		state.xp += r.xp;
	}

	/* An empty tank with no money for a cheap fish gets a free starter. */
	function restart(state, catalog) {
		if (state.fish.length || state.coins >= PRICE[0]) return { ok: false, error: 'unneeded' };
		var starter = pickStarter(catalog);
		if (!starter) return { ok: false, error: 'unknown' };
		addAnimal(state, starter);
		state.hunger = 0;
		state.quality = 100;
		state.algae = 0;
		return { ok: true, sid: starter };
	}

	/* Run a care task. Call advance() first. */
	function act(state, task, now, catalog) {
		var def = TASKS[task];
		if (task === 'restart') {
			return restart(state, catalog);
		}
		if (task === 'collect') {
			var coins = Math.floor(state.pending);
			if (coins < 1) return { ok: false, error: 'nothing' };
			state.pending = round2(state.pending - coins);
			state.coins += coins;
			return { ok: true, coins: coins, xp: 0 };
		}
		if (!def) return { ok: false, error: 'unknown' };
		if (cooldownLeft(state, task, now) > 0) return { ok: false, error: 'cooldown' };

		var res = { ok: true, coins: def.coins, xp: def.xp };
		if (task === 'feed') {
			if (state.hunger < 25) {
				state.quality = Math.max(0, state.quality - 8);
				state.cd.feed = now;
				return { ok: true, coins: 0, xp: 0, note: 'overfed' };
			}
			state.hunger = 0;
		} else if (task === 'test') {
			res.readings = readings(state);
		} else if (task === 'glass') {
			if (state.algae < 15) return { ok: false, error: 'clean' };
			state.algae = 0;
		} else if (task === 'change') {
			state.quality = Math.min(100, state.quality + 50);
		}
		state.cd[task] = now;
		reward(state, def);
		return res;
	}

	function living(state, catalog, cat) {
		return state.fish.filter(function (f) { return info(catalog, f.sid).cat === cat; }).length;
	}

	function canBuy(state, sid, catalog) {
		var s = catalog[sid];
		var tank = TANKS[state.tank];
		if (!s) return 'unknown';
		if (tank.cats.indexOf(s.cat) < 0) return 'tank';
		if (careRank(s.care) > tank.maxCare) return 'tank';
		if (state.fish.length >= tank.cap) return 'full';
		if (state.coins < price(s)) return 'coins';
		return '';
	}

	function price(s) {
		return PRICE[careRank(s.care)];
	}

	function buy(state, sid, catalog) {
		var why = canBuy(state, sid, catalog);
		if (why) return { ok: false, error: why };
		state.coins -= price(catalog[sid]);
		addAnimal(state, sid);
		var first = state.discovered.indexOf(sid) < 0;
		if (first) state.discovered.push(sid);
		return { ok: true, discovered: first, sid: sid };
	}

	function canUpgrade(state, member) {
		var next = TANKS[state.tank + 1];
		if (!next) return 'max';
		if (!member) return 'member';
		if (state.xp < next.xp) return 'xp';
		if (state.coins < next.cost) return 'coins';
		return '';
	}

	function upgrade(state, member) {
		var why = canUpgrade(state, member);
		if (why) return { ok: false, error: why };
		state.tank += 1;
		state.coins -= TANKS[state.tank].cost;
		state.quality = 100;
		state.algae = 0;
		return { ok: true, tank: state.tank };
	}

	function claimRead(state, sid) {
		if (state.discovered.indexOf(sid) < 0) return { ok: false, error: 'undiscovered' };
		if (state.read.indexOf(sid) >= 0) return { ok: false, error: 'claimed' };
		state.read.push(sid);
		reward(state, READ_REWARD);
		return { ok: true, coins: READ_REWARD.coins, xp: READ_REWARD.xp };
	}

	function isSick(state) {
		return state.fish.some(function (f) { return f.health < SICK; });
	}

	var api = {
		HOUR: HOUR,
		DAY: DAY,
		CARE: CARE,
		TANKS: TANKS,
		TASKS: TASKS,
		SICK: SICK,
		DEATH_GAP: DEATH_GAP,
		READ_REWARD: READ_REWARD,
		careRank: careRank,
		price: price,
		newState: newState,
		advance: advance,
		act: act,
		buy: buy,
		canBuy: canBuy,
		upgrade: upgrade,
		canUpgrade: canUpgrade,
		claimRead: claimRead,
		readings: readings,
		cooldownLeft: cooldownLeft,
		living: living,
		isSick: isSick
	};

	if (typeof module === 'object' && module.exports) {
		module.exports = api;
	} else {
		root.ReefEngine = api;
	}
})(this);
