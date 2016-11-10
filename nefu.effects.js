/*
'nefu' MMORPG-style Web UI Library

Copyright (C) 2016 sincfrac

This software is released under the MIT License.
http://opensource.org/licenses/mit-license.php
*/

var nefu = nefu || {};
nefu.effects = nefu.effects || {};


nefu.getCanvasContext2d = function(canvasElement) {
	var ctx = canvasElement.getContext('2d');

	ctx.width = canvasElement.width;
	ctx.height = canvasElement.height;

	ctx.clear = function() {
		ctx.clearRect(0, 0, ctx.width, ctx.height);
	};

	return ctx;
};


nefu.math = (function(){
	return {
		dist2: function(p1, p2) {
			return (p1.x-p2.x)*(p1.x-p2.x) + (p1.y-p2.y)*(p1.y-p2.y);
		},
		dist: function(p1, p2) {
			return Math.sqrt(nfMath.dist2(p1, p2));
		}
	};
})();




nefu.effects.Set = function() {
	this.effects = new Set();
};
nefu.effects.Set.prototype = {
	update: function(dt) {
		var effects = this.effects;
		for(let ef of effects) {
			ef.update(dt);
		}
	},
	draw: function(ctx) {
		var effects = this.effects;
		for(let ef of effects) {
			ef.draw(ctx);
		}
	}
};


nefu.effects.Empty = function() {
};
nefu.effects.Empty.prototype = {
	update: function(dt) { },
	draw: function(ctx) { }
};


nefu.effects.Manager = function(canvasElement) {
	this.effect = new nefu.effects.Empty();
	this._canvas = canvasElement;
	this._ctx = nefu.getCanvasContext2d(canvasElement);
	this._timer = null;
	this._lastUpdate;
	this._maxDt = 0.1;
	this._interval = 10;
};
nefu.effects.Manager.prototype = {
	update: function(dt) {
		return this.effect.update(dt);
	},

	draw: function() {
		this.effect.draw(this._ctx);
	},

	clear: function() {
		this._ctx.clear();
	},

	tick: function() {
		var time = new Date();
		var dt = (time - this._lastUpdate) / 1000;
		dt = Math.min(this._maxDt, dt);

		if (dt == 0) { return; }
		this.effect.update(dt);

		var ctx = this._ctx;
		ctx.clear();
		this.effect.draw(ctx);

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
	}
};



//
// particle: {x, y, vx, vy, r, alpha}
//

nefu.effects.SplineParticle = function(opt) {
	this.option = $.extend({
		ax: 0,
		ay: 0,
		color: 'black',
		dist: 2,
		drag: 0.01
	}, opt);

	this.particles = [];
};
nefu.effects.SplineParticle.prototype = {
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
		if (particles.length == 0) { return; }

		var dist = this.option.dist;
		var dist2 = dist*dist;
		var q = particles[0];

		this.drawParticle(ctx, q);

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

				//	equation: dist^2 = ( dx - t*vx )^2 + ( dy - t*vy )^2
				//	solve for t

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
		this.particles.push(particle);
	}
};



nefu.effects.MilkEmitter = function(opt) {
	this.option = $.extend({
		x: 0,
		y: 0,
		maxVelocity: 600,
		startAngle: -Math.PI/4,
		endAngle: (-Math.PI/4)*0.9,
		peakAngleAdd: -Math.PI * 0.01,
		peakDuration: 0.100,
		duration: 10,
		minRest: 0.200,
		maxRest: 1.000,
		ax: 0,
		ay: 500,
		color: 'white',
		dist: 2,
		drag: 0.01,
		minDuration: 0.100,
		maxDuration: 0.500,
		maxRadius: 5,
	}, opt);

	this._isStarted = false;
	this._splines = new Set();
	this._cur = {};
	this._isEmitting = false;
	this._time = 0;
	this._nextTime = 0;

};
nefu.effects.MilkEmitter.prototype = {
	update: function(dt) {
		if (!this._isStarted) { return; }

		if (this._isEmitting) {
			this._emit(dt);
		}
		else {
			if (this._time >= this._nextTime) {
				this._startEmit();
			}
		}

		var splines = this._splines;
		for(let sp of splines) {
			sp.update(dt);
		}

		this._time += dt;
	},
	draw: function(ctx) {
		var splines = this._splines;
		for(let sp of splines) {
			sp.draw(ctx);
		}
	},

	start: function() {
		this._splines = new Set();
		this._cur = {};
		this._isEmitting = false;
		this._time = 0;
		this._nextTime = 0;
		this._isStarted = true;
	},

	_rand: function(x, a) {
		var ret = x + x*a*(-1+2*Math.random());
		return Math.max(0, Math.min(1, ret));
	},

	_startEmit: function() {
		var opt = this.option,
				cur = this._cur;

		// Calc power
		var k = 1 - this._time / opt.duration;
		if (k < 0) { return; }

		// Create spline
		var spline = new nefu.effects.SplineParticle({
			ax: opt.ax,
			ay: opt.ay,
			color: opt.color,
			dist: opt.dist,
			drag: opt.drag
		});

		this._splines.add(spline);
		cur.spline = spline;


		// Set duration
		cur.time = 0;
		cur.duration = opt.minDuration + (opt.maxDuration - opt.minDuration) * k;
		var ke = 1 - (this._time + cur.duration) / opt.duration;

		// Set velocity
		var velocity = opt.maxVelocity * k;
		cur.velocity = velocity;

		// Set angle
		var sAngle = opt.startAngle + (opt.endAngle-opt.startAngle) * k;
		var eAngle = opt.startAngle + (opt.endAngle-opt.startAngle) * ke;
		var pAngle = opt.peakAngleAdd * k;

		cur.peakT = opt.peakDuration / cur.duration;

		cur.angle0 = sAngle;
		cur.angle_d0 = pAngle;
		cur.angle1 = sAngle + pAngle;
		cur.angle_d1 = eAngle - (sAngle + pAngle);

		// Set radius
		cur.startRadius = opt.maxRadius;
		cur.endRadius = 1;

		//
		this._nextTime = this._time + cur.duration + opt.minRest + (opt.maxRest - opt.minRest) * ke;

		//
		this._isEmitting = true;
	},

	_calcAngle: function(t) {
		var cur = this._cur;
		if (t <= cur.peakT) {
			t = t / cur.peakT;
			return cur.angle0 + cur.angle_d0 * t;
		} else {
			t = (t - cur.peakT) / (1 - cur.peakT);
			return cur.angle1 + cur.angle_d1 * (1 - t);
		}
	},

	_calcVelocity: function(t) {
		return this._cur.velocity;
	},

	_calcRadius: function(t) {
		var cur = this._cur;
		return cur.startRadius + (cur.endRadius - cur.startRadius) * t;
	},

	_calcAlpha: function(t) {
		return 1;
	},

	_emit: function(dt) {
		var opt = this.option,
				cur = this._cur;

		cur.time = cur.time + dt;

		if (cur.time > cur.duration) {
			this._isEmitting = false;
			return;
		}

		var t = cur.time / cur.duration;

		var angle = this._calcAngle(t);
		var velocity = this._calcVelocity(t);
		var radius = this._calcRadius(t);
		var alpha = this._calcAlpha(t);
		var x = opt.x;
		var y = opt.y;

		var vx = velocity * Math.cos(angle);
		var vy = velocity * Math.sin(angle);

		cur.spline.add({
			x: x,
			y: y,
			vx: vx,
			vy: vy,
			r: radius,
			alpha: alpha
		});
	}
};


