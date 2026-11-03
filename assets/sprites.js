/*
 * Reef Keeper — procedural 2D sprites. Every species is drawn from a small
 * "look" (shape, pattern, colours), so new encyclopedia entries need no art.
 * All drawers paint centred on (0, 0), facing right.
 */
(function (root) {
	'use strict';

	var TAU = Math.PI * 2;

	function hash(str) {
		var h = 2166136261;
		for (var i = 0; i < str.length; i++) {
			h ^= str.charCodeAt(i);
			h = Math.imul(h, 16777619);
		}
		return h >>> 0;
	}

	/* Fallback look for species without one: derived from the name. */
	function lookFor(species) {
		if (species.look) return species.look;
		var h = hash(species.slug || species.name || species.sid);
		var hue = h % 360;
		var shapes = { fish: ['round', 'long', 'slim', 'tall'], coral: ['mushroom', 'hammer', 'tree'], invert: ['snail', 'crab'] };
		var list = shapes[species.cat] || shapes.fish;
		var patterns = ['plain', 'stripe', 'split', 'gradient', 'spots'];
		return {
			shape: list[(h >> 8) % list.length],
			pattern: patterns[(h >> 12) % patterns.length],
			body: 'hsl(' + hue + ',75%,58%)',
			accent: 'hsl(' + ((hue + 150) % 360) + ',85%,62%)',
			fin: 'hsl(' + hue + ',70%,48%)'
		};
	}

	function shapeDims(shape) {
		switch (shape) {
			case 'long': return { ry: 0.3, tail: 0.75, dorsal: 0.25 };
			case 'tall': return { ry: 0.78, tail: 0.8, dorsal: 0.7 };
			case 'slim': return { ry: 0.42, tail: 1.1, dorsal: 0.45 };
			default: return { ry: 0.58, tail: 0.85, dorsal: 0.4 };
		}
	}

	function bodyPath(ctx, a, b) {
		ctx.beginPath();
		ctx.moveTo(a, 0);
		ctx.bezierCurveTo(a, -b * 0.9, a * 0.2, -b, -a * 0.2, -b * 0.95);
		ctx.bezierCurveTo(-a * 0.6, -b * 0.85, -a * 0.8, -b * 0.4, -a * 0.85, -b * 0.22);
		ctx.lineTo(-a * 0.85, b * 0.22);
		ctx.bezierCurveTo(-a * 0.8, b * 0.4, -a * 0.6, b * 0.85, -a * 0.2, b * 0.95);
		ctx.bezierCurveTo(a * 0.2, b, a, b * 0.9, a, 0);
		ctx.closePath();
	}

	function drawFish(ctx, look, size, t, sick) {
		var a = size / 2;
		var d = shapeDims(look.shape);
		var b = a * d.ry;
		var wag = Math.sin(t * (sick ? 4 : 9)) * 0.18;

		ctx.save();
		if (sick) ctx.filter = 'saturate(30%) brightness(1.08)';
		ctx.lineJoin = 'round';

		// Tail
		ctx.save();
		ctx.translate(-a * 0.82, 0);
		ctx.rotate(wag);
		ctx.fillStyle = look.fin;
		ctx.beginPath();
		var tl = a * 0.5 * d.tail;
		var th = b * (look.shape === 'long' ? 1.3 : 0.95);
		ctx.moveTo(a * 0.05, 0);
		if (look.shape === 'slim') {
			ctx.lineTo(-tl * 1.3, -th * 1.2);
			ctx.quadraticCurveTo(-tl * 0.55, 0, -tl * 1.3, th * 1.2);
		} else {
			ctx.quadraticCurveTo(-tl * 0.6, -th * 0.9, -tl, -th);
			ctx.quadraticCurveTo(-tl * 0.7, 0, -tl, th);
			ctx.quadraticCurveTo(-tl * 0.6, th * 0.9, a * 0.05, 0);
		}
		ctx.closePath();
		ctx.fill();
		ctx.restore();

		// Dorsal and anal fins
		ctx.fillStyle = look.fin;
		ctx.beginPath();
		ctx.moveTo(a * 0.25, -b * 0.85);
		ctx.quadraticCurveTo(-a * 0.1, -b - a * d.dorsal * (1 + wag * 0.3), -a * 0.7, -b * 0.35);
		ctx.lineTo(-a * 0.2, -b * 0.6);
		ctx.closePath();
		ctx.fill();
		if (look.shape === 'tall') {
			ctx.beginPath();
			ctx.moveTo(a * 0.1, b * 0.85);
			ctx.quadraticCurveTo(-a * 0.2, b + a * d.dorsal * 0.8, -a * 0.7, b * 0.35);
			ctx.lineTo(-a * 0.2, b * 0.6);
			ctx.closePath();
			ctx.fill();
		}

		// Body + pattern
		bodyPath(ctx, a, b);
		ctx.fillStyle = look.body;
		ctx.fill();
		ctx.save();
		bodyPath(ctx, a, b);
		ctx.clip();
		paintPattern(ctx, look, a, b);
		// Soft belly light and back shade for volume
		var g = ctx.createLinearGradient(0, -b, 0, b);
		g.addColorStop(0, 'rgba(0,0,0,0.12)');
		g.addColorStop(0.55, 'rgba(255,255,255,0)');
		g.addColorStop(1, 'rgba(255,255,255,0.28)');
		ctx.fillStyle = g;
		ctx.fillRect(-a, -b, a * 2, b * 2);
		ctx.restore();

		// Pectoral fin
		ctx.save();
		ctx.translate(a * 0.25, b * 0.25);
		ctx.rotate(0.5 + wag);
		ctx.fillStyle = look.fin;
		ctx.globalAlpha = 0.85;
		ctx.beginPath();
		ctx.ellipse(-b * 0.25, 0, b * 0.35, b * 0.15, 0, 0, TAU);
		ctx.fill();
		ctx.restore();

		// Eye
		var er = Math.max(1.5, Math.min(b * 0.24, a * 0.13));
		var ex = a * 0.62;
		var ey = -b * 0.18;
		ctx.fillStyle = '#fff';
		ctx.beginPath();
		ctx.arc(ex, ey, er, 0, TAU);
		ctx.fill();
		ctx.fillStyle = '#16213a';
		ctx.beginPath();
		ctx.arc(ex + er * 0.2, ey, er * 0.62, 0, TAU);
		ctx.fill();
		ctx.fillStyle = '#fff';
		ctx.beginPath();
		ctx.arc(ex + er * 0.4, ey - er * 0.3, er * 0.22, 0, TAU);
		ctx.fill();
		ctx.restore();

		if (sick) {
			// White spots, like marine ich
			ctx.fillStyle = 'rgba(255,255,255,0.9)';
			for (var i = 0; i < 6; i++) {
				var sx = (((i * 37) % 10) / 10 - 0.5) * a * 1.4;
				var sy = (((i * 53) % 10) / 10 - 0.5) * b * 1.2;
				ctx.beginPath();
				ctx.arc(sx, sy, Math.max(1, a * 0.04), 0, TAU);
				ctx.fill();
			}
		}
	}

	function paintPattern(ctx, look, a, b) {
		var c = look.accent;
		switch (look.pattern) {
			case 'bands':
				[0.42, -0.05, -0.58].forEach(function (x, i) {
					var w = a * (i === 1 ? 0.24 : 0.16);
					ctx.fillStyle = '#1b1b24';
					ctx.fillRect(a * x - w / 2 - 2, -b, w + 4, b * 2);
					ctx.fillStyle = c;
					ctx.fillRect(a * x - w / 2, -b, w, b * 2);
				});
				break;
			case 'split':
				ctx.fillStyle = c;
				ctx.fillRect(-a, -b, a * 0.75, b * 2);
				break;
			case 'stripe':
				ctx.fillStyle = c;
				ctx.fillRect(-a, -b * 0.42, a * 2, b * 0.34);
				break;
			case 'gradient':
				var g = ctx.createLinearGradient(a, 0, -a * 0.1, 0);
				g.addColorStop(0, c);
				g.addColorStop(0.45, c);
				g.addColorStop(1, 'rgba(0,0,0,0)');
				ctx.fillStyle = g;
				ctx.fillRect(-a, -b, a * 2, b * 2);
				break;
			case 'spots':
				ctx.fillStyle = c;
				for (var i = 0; i < 14; i++) {
					var x = (((i * 7) % 14) / 14 - 0.5) * a * 1.7;
					var y = (((i * 5) % 9) / 9 - 0.5) * b * 1.6;
					ctx.beginPath();
					ctx.arc(x, y, Math.max(1, a * 0.06), 0, TAU);
					ctx.fill();
				}
				break;
			case 'psy':
				ctx.strokeStyle = c;
				ctx.lineWidth = Math.max(1.5, a * 0.09);
				for (var k = -3; k <= 3; k++) {
					ctx.beginPath();
					for (var px = -a; px <= a; px += a / 8) {
						var py = k * b * 0.3 + Math.sin(px / a * 7 + k) * b * 0.12;
						if (px === -a) ctx.moveTo(px, py);
						else ctx.lineTo(px, py);
					}
					ctx.stroke();
				}
				break;
			default:
				break;
		}
	}

	function drawMushroom(ctx, look, size, t) {
		var r = size / 2;
		for (var i = 0; i < 3; i++) {
			var ox = (i - 1) * r * 0.75;
			var oy = (i === 1 ? -r * 0.15 : r * 0.05);
			var rr = r * (i === 1 ? 0.62 : 0.48) * (1 + Math.sin(t * 1.3 + i) * 0.03);
			ctx.fillStyle = look.fin;
			ctx.beginPath();
			ctx.ellipse(ox, oy + rr * 0.3, rr, rr * 0.45, 0, 0, TAU);
			ctx.fill();
			ctx.fillStyle = look.body;
			ctx.beginPath();
			ctx.ellipse(ox, oy, rr, rr * 0.5, 0, 0, TAU);
			ctx.fill();
			ctx.fillStyle = look.accent;
			for (var k = 0; k < 7; k++) {
				var ang = (k / 7) * TAU;
				ctx.beginPath();
				ctx.arc(ox + Math.cos(ang) * rr * 0.55, oy + Math.sin(ang) * rr * 0.26, Math.max(1, rr * 0.08), 0, TAU);
				ctx.fill();
			}
			ctx.beginPath();
			ctx.arc(ox, oy, Math.max(1.5, rr * 0.12), 0, TAU);
			ctx.fill();
		}
	}

	function drawHammer(ctx, look, size, t) {
		var h = size * 0.8;
		ctx.fillStyle = '#8a7f72';
		ctx.beginPath();
		ctx.ellipse(0, h * 0.05, size * 0.38, size * 0.1, 0, 0, TAU);
		ctx.fill();
		for (var i = 0; i < 6; i++) {
			var base = (i / 5 - 0.5) * size * 0.5;
			var sway = Math.sin(t * 1.6 + i) * size * 0.06;
			var tipX = base * 1.5 + sway;
			var tipY = -h * (0.6 + ((i * 3) % 4) * 0.1);
			ctx.strokeStyle = look.fin;
			ctx.lineWidth = Math.max(2, size * 0.07);
			ctx.lineCap = 'round';
			ctx.beginPath();
			ctx.moveTo(base, 0);
			ctx.quadraticCurveTo(base + sway * 0.5, tipY * 0.5, tipX, tipY);
			ctx.stroke();
			ctx.strokeStyle = look.body;
			ctx.lineWidth = Math.max(3, size * 0.11);
			ctx.beginPath();
			ctx.moveTo(tipX - size * 0.09, tipY - size * 0.02);
			ctx.quadraticCurveTo(tipX, tipY - size * 0.06, tipX + size * 0.09, tipY - size * 0.02);
			ctx.stroke();
			ctx.fillStyle = look.accent;
			ctx.beginPath();
			ctx.arc(tipX - size * 0.09, tipY - size * 0.02, Math.max(1.5, size * 0.04), 0, TAU);
			ctx.arc(tipX + size * 0.09, tipY - size * 0.02, Math.max(1.5, size * 0.04), 0, TAU);
			ctx.fill();
		}
	}

	function drawTree(ctx, look, size, t) {
		var h = size;
		var sway = Math.sin(t * 1.1) * 0.06;
		ctx.save();
		ctx.rotate(sway);
		ctx.strokeStyle = look.fin;
		ctx.lineCap = 'round';
		ctx.lineWidth = Math.max(3, size * 0.14);
		ctx.beginPath();
		ctx.moveTo(0, 0);
		ctx.lineTo(0, -h * 0.45);
		ctx.stroke();
		var tips = [];
		ctx.lineWidth = Math.max(2, size * 0.08);
		[-0.7, -0.3, 0.2, 0.65].forEach(function (dir, i) {
			var x = dir * size * 0.45;
			var y = -h * (0.7 + (i % 2) * 0.15);
			ctx.beginPath();
			ctx.moveTo(0, -h * 0.35);
			ctx.quadraticCurveTo(x * 0.3, -h * 0.55, x, y);
			ctx.stroke();
			tips.push([x, y]);
		});
		tips.push([0, -h * 0.9]);
		tips.forEach(function (p, i) {
			ctx.fillStyle = look.body;
			ctx.beginPath();
			ctx.arc(p[0], p[1], size * 0.16, 0, TAU);
			ctx.fill();
			ctx.fillStyle = look.accent;
			for (var k = 0; k < 6; k++) {
				var ang = (k / 6) * TAU + t * 0.5 + i;
				ctx.beginPath();
				ctx.arc(p[0] + Math.cos(ang) * size * 0.1, p[1] + Math.sin(ang) * size * 0.1, Math.max(1, size * 0.035), 0, TAU);
				ctx.fill();
			}
		});
		ctx.restore();
	}

	function drawSnail(ctx, look, size) {
		var r = size / 2;
		ctx.fillStyle = look.fin;
		ctx.beginPath();
		ctx.ellipse(0, r * 0.45, r * 0.9, r * 0.22, 0, 0, TAU);
		ctx.fill();
		ctx.fillStyle = look.body;
		ctx.beginPath();
		ctx.moveTo(-r * 0.7, r * 0.4);
		ctx.quadraticCurveTo(-r * 0.6, -r * 0.6, 0, -r * 0.9);
		ctx.quadraticCurveTo(r * 0.6, -r * 0.6, r * 0.7, r * 0.4);
		ctx.closePath();
		ctx.fill();
		ctx.strokeStyle = look.accent;
		ctx.lineWidth = Math.max(1.5, r * 0.12);
		for (var i = 0; i < 3; i++) {
			var y = r * (0.25 - i * 0.38);
			var w = r * (0.65 - i * 0.18);
			ctx.beginPath();
			ctx.moveTo(-w, y);
			ctx.quadraticCurveTo(0, y - r * 0.2, w, y);
			ctx.stroke();
		}
	}

	function drawCrab(ctx, look, size, t) {
		var r = size / 2;
		var step = Math.sin(t * 6) * r * 0.08;
		ctx.strokeStyle = look.body;
		ctx.lineWidth = Math.max(1.5, r * 0.1);
		ctx.lineCap = 'round';
		for (var i = 0; i < 3; i++) {
			var lx = r * (0.1 + i * 0.22);
			ctx.beginPath();
			ctx.moveTo(lx, r * 0.15);
			ctx.lineTo(lx + r * 0.25, r * 0.55 + (i % 2 ? step : -step));
			ctx.stroke();
		}
		ctx.fillStyle = look.body;
		ctx.beginPath();
		ctx.ellipse(r * 0.7, -r * 0.05, r * 0.22, r * 0.16, -0.3, 0, TAU);
		ctx.fill();
		ctx.fillStyle = look.accent;
		ctx.beginPath();
		ctx.moveTo(-r * 0.9, r * 0.3);
		ctx.quadraticCurveTo(-r * 0.8, -r * 0.7, 0, -r * 0.75);
		ctx.quadraticCurveTo(r * 0.55, -r * 0.6, r * 0.45, r * 0.3);
		ctx.closePath();
		ctx.fill();
		ctx.strokeStyle = 'rgba(0,0,0,0.25)';
		ctx.lineWidth = Math.max(1, r * 0.06);
		ctx.beginPath();
		ctx.arc(-r * 0.15, -r * 0.1, r * 0.35, 0.4, 4.2);
		ctx.stroke();
		ctx.fillStyle = '#111';
		ctx.beginPath();
		ctx.arc(r * 0.62, -r * 0.42, Math.max(1, r * 0.07), 0, TAU);
		ctx.arc(r * 0.78, -r * 0.38, Math.max(1, r * 0.07), 0, TAU);
		ctx.fill();
	}

	function draw(ctx, species, size, t, sick) {
		var look = lookFor(species);
		ctx.save();
		if (sick && species.cat !== 'fish') ctx.filter = 'saturate(25%) brightness(0.9)';
		switch (look.shape) {
			case 'mushroom': drawMushroom(ctx, look, size, t); break;
			case 'hammer': drawHammer(ctx, look, size, t); break;
			case 'tree': drawTree(ctx, look, size, t); break;
			case 'snail': drawSnail(ctx, look, size, t); break;
			case 'crab': drawCrab(ctx, look, size, t); break;
			default: drawFish(ctx, look, size, t, sick);
		}
		ctx.restore();
	}

	/* A small static picture for shop and album cards. */
	function thumb(species, px, silhouette) {
		var dpr = Math.min(2, root.devicePixelRatio || 1);
		var c = document.createElement('canvas');
		c.width = px * dpr;
		c.height = px * dpr;
		c.style.width = px + 'px';
		c.style.height = px + 'px';
		var ctx = c.getContext('2d');
		ctx.scale(dpr, dpr);
		var look = lookFor(species);
		var fixed = look.shape === 'mushroom' || look.shape === 'hammer' || look.shape === 'tree';
		ctx.translate(px / 2, fixed ? px * 0.82 : px / 2);
		if (silhouette) ctx.filter = 'brightness(0) opacity(0.25)';
		draw(ctx, species, px * (fixed ? 0.62 : 0.66), 0.6, false);
		return c;
	}

	var api = { draw: draw, thumb: thumb, lookFor: lookFor, hash: hash };
	if (typeof module === 'object' && module.exports) module.exports = api;
	else root.ReefSprites = api;
})(this);
