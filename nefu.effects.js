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
			return Math.sqrt(nefu.math.dist2(p1, p2));
		},
		bspline: function(t, x0, x1, x2) {
			return 0.5*(x1+x0) + t*(x1-x0) + 0.5*t*t*(x2-2.0*x1+x0);
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









nefu.effects.MilkEmitter = function(opt) {
	this.option = $.extend({
		x: 0,
		y: 0,
		ax: 0,
		ay: 500,
		color: 'white',
		drag: 0.003,
		alpha: 1,
		radius: 3,
		minRadius: 1,
		life: 1.500,
		velocity: 1200,
		angle: Math.PI*7/4,
		angleA: -Math.PI/8,
		angleD: +Math.PI/16,
		fadeOutDuration: 0.50,
		distMax: 80,
		distSplit: 100,
		dist: 1,
		attraction: 150,
		interval: 1.5
	}, opt);

	this._groups = new Set();

	this._isStarted = false;
	this._waitEmit = 0;

};
nefu.effects.MilkEmitter.prototype = {
	update: function(dt) {
		if (!this._isStarted) { return; }

		this._waitEmit -= dt;
		if (this._waitEmit <= 0) {
			this._emit(dt);
		}

		var groups = this._groups,
				opt = this.option;

		var dvx = opt.ax * dt,
				dvy = opt.ay * dt,
				ddt = opt.drag * dt;

		for (let g of groups) {
			var particles = g.particles;

			g.life -= dt;
			if (g.life <= 0) {
				groups.delete(g);
				continue;
			}

			for (var i=0, len=particles.length; i<len; i++) {
				var p = particles[i];
				var pn = i<len-1 ? particles[i+1] : null;

				var dt_ = dt;

				if (p.wait > 0) {
					p.wait -= dt;
					
					if (p.wait < 0) {
						dt_ += p.wait;
						p.wait = 0;
					}
					else {
						continue;
					}
				}

				// Update velocity, position
				var v = Math.sqrt(p.vx*p.vx + p.vy*p.vy);
				p.vx += dvx - v*p.vx*ddt;
				p.vy += dvy - v*p.vy*ddt;
				p.x += p.vx * dt_;
				p.y += p.vy * dt_;

				if (pn) {
					// Update distance
					var dist2 = nefu.math.dist2(p, pn);
					p.dist = Math.sqrt(dist2);

					// Calculate intermolecular force
					if (p.dist > 5) {
						var dx = pn.x - p.x,
								dy = pn.y - p.y;

						// ToDo: 加速度なので速度に加算すべき
						var power = opt.attraction * p.density * pn.density / dist2 * dt_;
						p.x += power * dx;
						p.y += power * dy;
						pn.x -= power * dx;
						pn.y -= power * dy;
					}
				}
				else {
					p.dist = 0;
				}
			}


			for (var i=0, len=particles.length; i<len; i++) {
				var p = particles[i];
				var avg = i==0 ? p.dist : 
									i==len-1 ? particles[i-1].dist :
									(p.dist + particles[i-1].dist) / 2;

				p.avgDist = avg;
				p.radius = opt.radius * (1 - Math.min(1, avg / opt.distMax)) * p.density;
				p.split = false;//p.split || avg >= opt.distSplit;
			}
		}

		this._t += dt;
	},

	draw: function(ctx) {
		var groups = this._groups,
				opt = this.option,
				distSplit = opt.distSplit;

		for (let g of groups) {
			var particles = g.particles;
			var galpha = g.life < opt.fadeOutDuration ? g.life / opt.fadeOutDuration : 1;

			for (var i=0, len=particles.length; i<len; i++) {
				var p1 = particles[i];

				var p0 = particles[Math.max(0,i-1)];
				var p2 = particles[Math.min(len-1,i+1)];
				//if (p2.wait > 0) { break; }

				var alpha = opt.alpha * galpha;
				var dist = p1.avgDist;

				if (!p1.split) {
					var du = opt.dist / dist;
					for (var u=0; u<1; u+=du) {
						var x = nefu.math.bspline(u, p0.x, p1.x, p2.x),
								y = nefu.math.bspline(u, p0.y, p1.y, p2.y),
								radius = nefu.math.bspline(u, p0.radius, p1.radius, p2.radius);

						var r = Math.max(0.1, radius);

						ctx.beginPath();
						ctx.fillStyle = opt.color;
						ctx.arc(x, y, r, 0, Math.PI*2, false);
						ctx.globalAlpha = alpha;
						ctx.fill();
					}
				}
				else {
					var k = 0.5 + 0.5*Math.min(1, (dist-distSplit)/5);	// ToDo: parameter

					for (var d=0; d<dist; d+=opt.dist) {
						var u = d / dist;
						var x, y, radius, r;
						var x = nefu.math.bspline(u, p0.x, p1.x, p2.x),
								y = nefu.math.bspline(u, p0.y, p1.y, p2.y),
								radius = nefu.math.bspline(u, p0.radius, p1.radius, p2.radius);

						if (u < 0.5) {
							if (d >= distSplit/2) continue;
							r = Math.min(1, d / (distSplit/2));
						}
						else {
							if (dist-d >= distSplit/2) continue;
							r = Math.min(1, (dist-d) / (distSplit/2));
						}

						r = Math.max(0.1, Math.max(opt.minRadius*r*k, radius));

						ctx.beginPath();
						ctx.fillStyle = opt.color;
						ctx.arc(x, y, r, 0, Math.PI*2, false);
						ctx.globalAlpha = alpha;
						ctx.fill();
					}
				}
			}
		}

		//this._drawDebug(ctx);
	},

	_drawDebug: function(ctx) {
		var groups = this._groups;

		ctx.fillStyle = 'red';
		ctx.strokeStyle = 'red';
		ctx.globalAlpha = 0.5;

		for (let g of groups) {
			var particles = g.particles;

			for (var i=0, len=particles.length; i<len-1; i++) {
				var p0 = particles[i];
				var p1 = particles[i+1];

				ctx.beginPath();
				ctx.arc(p1.x, p1.y, 1, 0, Math.PI*2, false);
				ctx.fill();

				ctx.beginPath();
				ctx.moveTo(p0.x, p0.y);
				ctx.lineTo(p1.x, p1.y);
				ctx.stroke();
			}
		}
	},

	start: function() {
		this._t = 0;
		this._isStarted = true;
	},

	_emit: function(dt) {
		var opt = this.option;

		var conf = {
			timing: {
				delay: 0,
				att: 1.000,
				dec: 3.000,
				sus: 8.000,
				rel: 10.000
			},
			power: {
				bias: 0.8,
				max: 0.2,
				sus: -0.5,
				rel: -0.8,
				rnd: 0.1
			}
		};

		var t = this._t;
		var power = this._calcADSR(t, conf.timing, conf.power);

		var interval = 0.800 + 2.000*(1-power);
		var interval = (1-0.4*Math.random()) * interval;
		var velocity = opt.velocity * power;
		var dur = (1-0.5*power) * (1-0.4*Math.random());
		var maxVelocity = (1-0.5*power) * (1-0.3*Math.random());
		var density = (1-0.5*power);
		var rel = 1-0.8*power;

		this._emitOneShot({
			x: opt.x,
			y: opt.y,
			velocity: {
				bias: velocity*maxVelocity,
				max: velocity*(1-maxVelocity),
				sus: 0,
				rel: -velocity*maxVelocity,
				rnd: 0.1
			},
			angle: {
				bias: opt.angle,
				max: Math.PI*0.01,
				sus: 0,
				rel: -Math.PI*0.1,
				rnd: 0.01
			},
			density: {
				bias: 0.9 * density,
				max: 0.1 * density,
				sus: -0.5 * density,
				rel: -0.7 * density,
				rnd: 0.2
			},
			interval: {
				bias: 0.02,
				max: 0,
				sus: 0,
				rel: 0.02,
				rnd: 0
			},
			timing: {
				delay: 0,
				att: 0.05*dur,
				dec: 0.2*dur,
				sus: 0,
				rel: 0.8*dur*rel
			}
		});

		this._waitEmit = interval;
	},

	// timing: {delay, att, dec, sus ,rel}
	// val: {bias, max ,sus, rel}
	_calcADSR: function(t, timing, val) {
		if (t < timing.delay) {
			return val.bias;
		}
		t -= timing.delay;
		if (t < timing.att) {
			return val.bias + val.max * t/timing.att;
		}
		t -= timing.att;
		if (t < timing.dec) {
			return val.bias + val.max + (val.sus-val.max) * t/timing.dec;
		}
		t -= timing.dec;
		if (t < timing.sus) {
			return val.bias + val.sus;
		}
		t -= timing.sus;
		if (t <= timing.rel) {
			return val.bias + val.sus + (val.rel-val.sus) * t/timing.rel;
		}
		return val.bias + val.rel;
	},

	_emitOneShot: function(conf) {
		var particles = [];
		var opt = this.option;

		var dur = conf.timing.delay + conf.timing.att + conf.timing.dec + conf.timing.sus + conf.timing.rel;

		var t = 0;
		while (t < dur) {
			var interval = this._calcADSR(t, conf.timing, conf.interval);

			if (Math.random() < 0.2 && particles.length > 0) {
				this._groups.add({
					life: opt.life,
					particles: particles
				});

				particles = [];
				interval = 0.01;
			}

			var ang = this._calcADSR(t, conf.timing, conf.angle) * (1-conf.angle.rnd*Math.random());
			var vel = this._calcADSR(t, conf.timing, conf.velocity) * (1-conf.velocity.rnd*Math.random());
			var den = this._calcADSR(t, conf.timing, conf.density) * (1-conf.density.rnd*Math.random());

			var vx = vel * Math.cos(ang);
			var vy = vel * Math.sin(ang);

			t += interval;
			particles.push({
				wait: t,
				x: conf.x,
				y: conf.y,
				vx: vx,
				vy: vy,
				density: den,
				dist: 0
			});

		}

		if (particles.length > 0) {
			this._groups.add({
				life: opt.life,
				particles: particles
			});
		}
	}
};


