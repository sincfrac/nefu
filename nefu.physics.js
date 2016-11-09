/*
'nefu' MMORPG-style Web UI Library

Copyright (C) 2016 sincfrac

This software is released under the MIT License.
http://opensource.org/licenses/mit-license.php
*/


function nefuCanvasContext2d(canvasElement) {
	var ctx = canvasElement.getContext('2d');

	ctx.width = canvasElement.width;
	ctx.height = canvasElement.height;

	ctx.clear = function() {
		ctx.clearRect(0, 0, ctx.width, ctx.height);
	};

	return ctx;
}


var nfMath = {
	dist2: function(p1, p2) {
		return (p1.x-p2.x)*(p1.x-p2.x) + (p1.y-p2.y)*(p1.y-p2.y);
	},
	dist: function(p1, p2) {
		return Math.sqrt(nfMath.dist2(p1, p2));
	}
};


function nefuPhysics(canvasElement) {
	this.objs =  new Set();
	this._canvas = canvasElement;
	this._ctx = nefuCanvasContext2d(canvasElement);
	this._timer = null;
	this._lastUpdate;
	this._maxDt = 0.1;
	this._interval = 10;
}
nefuPhysics.prototype = {
	update: function(dt) {
		var objs = this.objs;
		var ctx = this._ctx;

		ctx.clear();

		for(let obj of objs) {
			var valid = obj.update(dt);
			if (valid) {
				obj.draw(ctx);
			} else {
				objs.delete(obj);
			}
		}
	},

	tick: function() {
		var time = new Date();
		var dt = (time - this._lastUpdate) / 1000;
		dt = Math.min(this._maxDt, dt);

		if (dt == 0) { return; }
		this.update(dt);

		this._lastUpdate = time;
	},

	start: function() {
		if (this._timer) { return; }

		this._lastUpdate = new Date();

		var self = this;
		this._timer = setInterval(function() {
			self.tick();
		},
		this._interval);
	},

	stop: function() {
		if (this._timer) {
			clearInterval(this._timer);
		}
	},

	add: function(obj) {
		this.objs.add(obj);
	}
};





function nfSimpleParticle(opt) {
	this.x = opt.x;
	this.y = opt.y;
	this.vx = opt.vx;
	this.vy = opt.vy;
	this.ax = opt.ax;
	this.ay = opt.ay;
	this.r = opt.r;
}
nfSimpleParticle.prototype = {
	update: function(dt) {
		this.vx += this.ax * dt;
		this.vy += this.ay * dt;
		this.x += this.vx * dt;
		this.y += this.vy * dt;
		return true;
	},

	draw: function(ctx) {
		ctx.beginPath();
		ctx.arc(this.x, this.y, this.r, 0, Math.PI*2, false);
		ctx.fillStyle = 'black';
		ctx.fill();
	}
};


function nfSplineParticles(opt) {
	this.option = $.extend({
		ax: 0,
		ay: 0,
		color: 'black',
		dist: 2,
		drag: 0.01,
		default: {
			x: 0,
			y: 0,
			vx: 0,
			vy: 0,
			r: 1,
			alpha: 0
		}
	}, opt);

	this.particles = [];
}
nfSplineParticles.prototype = {
	update: function(dt) {
		var particles = this.particles;
		var dvx = this.option.ax * dt,
				dvy = this.option.ay * dt,
				ddt = this.option.drag * dt;

		for(var i=0, len=particles.length; i<len; i++) {
			var p = particles[i];
			var v = Math.sqrt(p.vx*p.vx + p.vy*p.vy);
			p.vx += dvx - v*p.vx*ddt;
			p.vy += dvy - v*p.vy*ddt;
			p.x += p.vx * dt;
			p.y += p.vy * dt;
		}

		return true;
	},

	drawParticle: function(ctx, p) {
		ctx.beginPath();
		ctx.arc(p.x, p.y, p.r, 0, Math.PI*2, false);
		ctx.fillStyle = this.option.color;
		ctx.globalAlpha = p.alpha;
		ctx.fill();
	},

	draw: function(ctx) {
		var particles = this.particles;
		var dist = this.option.dist;
		var dist2 = dist*dist;

		if (particles.length < 2) { return; }

		var q = particles[0];

		for(var i=0, len=particles.length; i<len-1; i++) {
			var p0 = particles[i];
			var p1 = particles[i+1];

			var vx = p1.x - p0.x,
					vy = p1.y - p0.y,
					vr = p1.r - p0.r,
					va = p1.alpha - p0.alpha;

			var vx2 = vx*vx,
					vy2 = vy*vy;

			var L2 = vx2 + vy2;
			var dd = dist2*(vx2 + vy2);

			while(true) {
				var dx = q.x - p0.x,
						dy = q.y - p0.y;

				/*
					equation: dist^2 = ( dx - t*vx )^2 + ( dy - t*vy )^2
					solve for t
				*/

				var dx2 = dx*dx,
						dy2 = dy*dy,
						dxvx = dx*vx,
						dyvy = dy*vy;

				var D2 = 2*(dxvx*dyvy) - (dx2*vy2 + dy2*vx2) + dd;
				var D = Math.sqrt(D2);
				var b = dxvx + dyvy;
				var t = (D + b) / L2;

				if (t >= 0 && t < 1) {
					q = {
						x: p0.x + t*vx,
						y: p0.y + t*vy,
						r: p0.r + t*vr,
						alpha: p0.alpha + t*va
					};
					this.drawParticle(ctx, q);
				}
				else {
					break;
				}
			}
		}
	},

	add: function(particle) {
		this.particles.push(
			$.extend({}, this.option.default, particle)
		);
	}
};

