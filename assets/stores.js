/*
 * Reef Keeper — where the tank lives.
 * LocalStore: guests (and the demo), state in localStorage, rules run here.
 * RestStore: members, state in WordPress user meta, rules run on the server.
 * Both resolve to { result, view } where view = { state, now, member }.
 */
(function (root) {
	'use strict';

	var E = root.ReefEngine;
	var GUEST_KEY = 'reef_keeper_guest_v1';

	function readJSON(key) {
		try {
			var raw = root.localStorage.getItem(key);
			return raw ? JSON.parse(raw) : null;
		} catch (e) {
			return null;
		}
	}

	function writeJSON(key, value) {
		try {
			if (value == null) root.localStorage.removeItem(key);
			else root.localStorage.setItem(key, JSON.stringify(value));
		} catch (e) {
			// Private mode or blocked storage: the game still runs for this visit.
		}
	}

	function LocalStore(opts) {
		this.catalog = opts.catalog;
		this.key = opts.key || GUEST_KEY;
		this.clock = opts.clock || Date.now;
		this.isMember = opts.member || function () { return false; };
		this.memory = null;
	}

	LocalStore.prototype._state = function (now) {
		var state = readJSON(this.key) || this.memory;
		if (!state || state.v !== 1) state = E.newState(this.catalog, now);
		return E.advance(state, now, this.catalog);
	};

	LocalStore.prototype._commit = function (state, now, result) {
		this.memory = state;
		writeJSON(this.key, state);
		return Promise.resolve({
			result: result,
			view: { state: state, now: now, member: this.isMember() }
		});
	};

	LocalStore.prototype._run = function (fn) {
		var now = this.clock();
		var state = this._state(now);
		return this._commit(state, now, fn(state, now));
	};

	LocalStore.prototype.load = function () {
		return this._run(function () { return null; });
	};

	LocalStore.prototype.act = function (task) {
		var catalog = this.catalog;
		return this._run(function (s, now) { return E.act(s, task, now, catalog); });
	};

	LocalStore.prototype.buy = function (sid) {
		var catalog = this.catalog;
		return this._run(function (s) { return E.buy(s, sid, catalog); });
	};

	LocalStore.prototype.upgrade = function () {
		var member = this.isMember();
		return this._run(function (s) { return E.upgrade(s, member); });
	};

	LocalStore.prototype.claimRead = function (sid) {
		return this._run(function (s) { return E.claimRead(s, sid); });
	};

	function RestStore(opts) {
		this.root = opts.root.replace(/\/?$/, '/');
		this.nonce = opts.nonce;
	}

	RestStore.prototype._call = function (method, path, body) {
		return root.fetch(this.root + path, {
			method: method,
			credentials: 'same-origin',
			headers: { 'Content-Type': 'application/json', 'X-WP-Nonce': this.nonce },
			body: body ? JSON.stringify(body) : undefined
		}).then(function (r) {
			return r.json().then(function (data) {
				if (!r.ok && !data.view) throw new Error(data.message || 'HTTP ' + r.status);
				return data;
			});
		});
	};

	RestStore.prototype.load = function () { return this._call('GET', 'state'); };
	RestStore.prototype.act = function (task) { return this._call('POST', 'action', { task: task }); };
	RestStore.prototype.buy = function (sid) { return this._call('POST', 'buy', { sid: sid }); };
	RestStore.prototype.upgrade = function () { return this._call('POST', 'upgrade'); };
	RestStore.prototype.claimRead = function (sid) { return this._call('POST', 'discover', { sid: sid }); };
	RestStore.prototype.migrate = function (state) { return this._call('POST', 'migrate', { state: state }); };

	root.ReefStores = {
		LocalStore: LocalStore,
		RestStore: RestStore,
		GUEST_KEY: GUEST_KEY,
		readJSON: readJSON,
		writeJSON: writeJSON
	};
})(this);
