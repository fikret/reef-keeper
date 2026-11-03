/* Demo harness: a shifted clock for time travel, and a fake membership switch. */
(function (root) {
	'use strict';

	var OFFSET_KEY = 'reef_keeper_demo_offset';
	var MEMBER_KEY = 'reef_keeper_demo_member';

	function get(key) {
		try { return root.localStorage.getItem(key); } catch (e) { return null; }
	}

	function set(key, value) {
		try { root.localStorage.setItem(key, value); } catch (e) {}
	}

	var Demo = {
		clock: function () {
			return Date.now() + (Number(get(OFFSET_KEY)) || 0);
		},
		travel: function (hours) {
			set(OFFSET_KEY, String((Number(get(OFFSET_KEY)) || 0) + hours * 3600 * 1000));
		},
		member: function () {
			return get(MEMBER_KEY) === '1';
		},
		setMember: function (on) {
			set(MEMBER_KEY, on ? '1' : '0');
		},
		lang: function () {
			var m = /[?&]lang=(tr|en)/.exec(root.location.search);
			return m ? m[1] : 'tr';
		},
		reset: function () {
			try {
				Object.keys(root.localStorage).forEach(function (k) {
					if (k.indexOf('reef_keeper_') === 0) root.localStorage.removeItem(k);
				});
			} catch (e) {}
		},
		catalog: function () {
			var c = {};
			root.RK_DEMO_SPECIES.forEach(function (s) { c[s.sid] = s; });
			return c;
		},
		store: function () {
			return new root.ReefStores.LocalStore({
				catalog: Demo.catalog(),
				clock: Demo.clock,
				member: Demo.member
			});
		}
	};

	root.ReefDemo = Demo;
})(this);
