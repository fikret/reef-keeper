/*
 * Reef Keeper — wiring on the live site. The plugin prints window.RK_CONFIG.
 * Guests play from localStorage; members from the REST API. A guest who signs
 * up keeps their tank: the first member visit uploads it once.
 */
(function (root) {
	'use strict';

	var St = root.ReefStores;

	function catalogOf(species) {
		var c = {};
		species.forEach(function (s) { c[s.sid] = s; });
		return c;
	}

	function storeFor(cfg) {
		if (cfg.member) return new St.RestStore({ root: cfg.rest, nonce: cfg.nonce });
		return new St.LocalStore({ catalog: catalogOf(cfg.species) });
	}

	function game(cfg) {
		var mount = document.getElementById(cfg.mount);
		if (!mount) return;
		var store = storeFor(cfg);
		var guest = cfg.member ? St.readJSON(St.GUEST_KEY) : null;
		var ready = guest ? store.migrate(guest).then(function () { St.writeJSON(St.GUEST_KEY, null); }, function () {}) : Promise.resolve();
		ready.then(function () {
			root.ReefKeeper.mount(mount, {
				store: store,
				species: cfg.species,
				lang: cfg.lang,
				member: cfg.member,
				urls: cfg.urls
			});
		});
	}

	function discover(cfg) {
		if (!cfg.member && !St.readJSON(St.GUEST_KEY)) return;
		root.ReefDiscover.init({
			sid: cfg.sid,
			store: storeFor(cfg),
			lang: cfg.lang,
			gameUrl: cfg.gameUrl,
			eligible: cfg.member ? cfg.eligible : null
		});
	}

	var cfg = root.RK_CONFIG;
	if (!cfg) return;
	var start = function () {
		if (cfg.page === 'game') game(cfg);
		else if (cfg.page === 'discover') discover(cfg);
	};
	if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
	else start();
})(this);
