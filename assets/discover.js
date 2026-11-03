/*
 * Reef Keeper — runs on encyclopedia pages. If the visitor discovered this
 * species in the game and hasn't claimed the reading reward yet, it shows a
 * small pill and pays out after 20 s on the page or reading half of it.
 *   ReefDiscover.init({ sid, store, lang, gameUrl, eligible?, minSeconds?, scrollRatio? })
 */
(function (root) {
	'use strict';

	var CSS = '.rkd{position:fixed;right:16px;bottom:16px;z-index:99998;display:flex;align-items:center;gap:10px;max-width:calc(100vw - 32px);' +
		'background:#0f2438;color:#fff;border-radius:99px;padding:8px 16px 8px 8px;box-shadow:0 8px 24px rgba(0,0,0,.25);' +
		'font:600 14px/1.3 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;transition:transform .3s,background .3s}' +
		'.rkd svg{flex:none;width:36px;height:36px}.rkd a{color:#ffd65a;text-decoration:underline}' +
		'.rkd-done{background:#14784f;animation:rkd-pop .4s}@keyframes rkd-pop{50%{transform:scale(1.06)}}';

	function init(cfg) {
		var t = root.ReefI18n.make(cfg.lang || 'en');
		var reward = root.ReefEngine.READ_REWARD.coins;
		var minMs = (cfg.minSeconds || 20) * 1000;
		var ratio = cfg.scrollRatio || 0.5;

		eligible(cfg).then(function (ok) {
			if (!ok) return;
			var style = document.createElement('style');
			style.textContent = CSS;
			document.head.appendChild(style);
			var pill = document.createElement('div');
			pill.className = 'rkd';
			pill.setAttribute('role', 'status');
			pill.innerHTML = '<svg viewBox="0 0 36 36"><circle cx="18" cy="18" r="15" fill="none" stroke="rgba(255,255,255,.2)" stroke-width="4"/>' +
				'<circle class="rkd-ring" cx="18" cy="18" r="15" fill="none" stroke="#ffd65a" stroke-width="4" stroke-linecap="round" ' +
				'stroke-dasharray="94.25" stroke-dashoffset="94.25" transform="rotate(-90 18 18)"/></svg><span>' +
				esc(t('read_progress', { n: reward })) + '</span>';
			document.body.appendChild(pill);
			var ring = pill.querySelector('.rkd-ring');

			var visibleMs = 0;
			var last = Date.now();
			var done = false;
			var timer = root.setInterval(tick, 250);
			root.addEventListener('scroll', tick, { passive: true });

			function tick() {
				if (done) return;
				var now = Date.now();
				if (document.visibilityState === 'visible') visibleMs += now - last;
				last = now;
				var doc = document.documentElement;
				var max = Math.max(1, doc.scrollHeight - root.innerHeight);
				var scrolled = clampScroll(root.scrollY / max / ratio);
				var progress = Math.max(visibleMs / minMs, scrolled);
				ring.setAttribute('stroke-dashoffset', String(94.25 * (1 - Math.min(1, progress))));
				if (progress >= 1) finish();
			}

			function finish() {
				done = true;
				root.clearInterval(timer);
				cfg.store.claimRead(cfg.sid).then(function (r) {
					if (!r.result || !r.result.ok) {
						pill.remove();
						return;
					}
					pill.classList.add('rkd-done');
					pill.innerHTML = '<span>' + esc(t('read_done', { n: reward })) + ' <a href="' + esc(cfg.gameUrl) + '">' + esc(t('read_back')) + ' →</a></span>';
				}, function () { pill.remove(); });
			}
		});
	}

	function esc(s) {
		return String(s).replace(/[&<>"]/g, function (c) {
			return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
		});
	}

	function clampScroll(v) {
		return Math.max(0, Math.min(1, v || 0));
	}

	function eligible(cfg) {
		if (cfg.eligible != null) return Promise.resolve(!!cfg.eligible);
		return cfg.store.load().then(function (r) {
			var s = r.view.state;
			return s.discovered.indexOf(cfg.sid) >= 0 && s.read.indexOf(cfg.sid) < 0;
		}, function () { return false; });
	}

	root.ReefDiscover = { init: init };
})(this);
