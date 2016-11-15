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
		ay: 300,
		color: 'white',
		drag: 0.01,
		alpha: 1,
		radius: 2,
		minRadius: 1,
		life: 3.000,
		velocity: 600,
		angle: Math.PI*7/4,
		angleA: -Math.PI/8,
		angleD: +Math.PI/16,
		fadeOutDuration: 1.00,
		distMax: 18,
		distSplit: 25,
		dist: 1,
		attraction: 150
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

				if (i>0 && i<len-1 && avg >= opt.distSplit) {
					var p0 = particles[i-1],
							p2 = particles[i+1];

					var u = 0.4;
					var pp = {};
					pp.x  = nefu.math.bspline(u, p0.x,  p.x,  p2.x);
					pp.y  = nefu.math.bspline(u, p0.y,  p.y,  p2.y),
					pp.vx = nefu.math.bspline(u, p0.vx, p.vx, p2.vx);
					pp.vy = nefu.math.bspline(u, p0.vy, p.vy, p2.vy);

					pp.density = p.density/2;
					pp.wait = 0;
					pp.avgDist = p0.dist;
					pp.radius = opt.radius * (1 - Math.min(1, pp.avgDist / opt.distMax)) * pp.density;

					var arr0 = particles.slice(0, i);
					arr0.push(pp);
					g.particles = arr0;

					var u = 0.6;
					p.x  = nefu.math.bspline(u, p0.x,  p.x,  p2.x);
					p.y  = nefu.math.bspline(u, p0.y,  p.y,  p2.y);
					p.vx = nefu.math.bspline(u, p0.vx, p.vx, p2.vx);
					p.vy = nefu.math.bspline(u, p0.vy, p.vy, p2.vy);
					
					p.density = p.density/2;
					p.avgDist = p.dist;
					p.radius = opt.radius * (1 - Math.min(1, p.avgDist / opt.distMax)) * p.density;

					var arr1 = particles.slice(i);
					groups.add({
						particles: arr1,
						life: g.life
					});

					break;
				}
			}
		}
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
				if (p1.wait > 0) { break; }

				var p0 = particles[Math.max(0,i-1)];
				var p2 = particles[Math.min(len-1,i+1)];

				var alpha = opt.alpha * galpha;

				var du = opt.dist / p1.avgDist;
				for (var u=0; u<1; u+=du) {
					var x = nefu.math.bspline(u, p0.x, p1.x, p2.x),
							y = nefu.math.bspline(u, p0.y, p1.y, p2.y),
							r = nefu.math.bspline(u, p0.radius, p1.radius, p2.radius);

					r = Math.max(0.1, r);

					ctx.beginPath();
					ctx.fillStyle = opt.color;
					ctx.arc(x, y, r, 0, Math.PI*2, false);
					ctx.globalAlpha = alpha;
					ctx.fill();
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
		this._isStarted = true;
	},

	_emit: function(dt) {
		var opt = this.option;

		/*
			velocity: ADSR
			angle: ADSR
			density: ADSR
			timing: ADSR
		*/

		this._emitOneShot({
			x: opt.x,
			y: opt.y,
			velocity: opt.velocity,
			velocityA: 300,
			velocityD: -400,
			angle: opt.angle,
			angleA: opt.angleA,
			angleD: opt.angleD,
			duration: 0.30,
			durationA: 0.150,
			interval: 0.020,
			intervalDeviation: 0.02
		});

		this._waitEmit = 1.500;
	},

	_calcADSR: function(t, timing, val) {
		if (t < timing.att) {
			return val.bias
							+ val.att * (t/timing.att);
		}
		if (t < timing.dec) {
			return val.bias + val.att
							+ (val.dec-val.att) * (t-timing.att) / (timing.dec-timing.att);
		}
		if (t < timing.sus) {
			return val.bias + val.sus;
		}
		if (t <= timing.rel) {
			return val.bias + val.sus
							+ (val.rel-val.sus) * (t-timing.sus) / (timing.rel-timing.sus);
		}
		return val.bias;
	},

	_emitOneShot: function(conf) {
		var particles = [];
		var opt = this.option;

		var durA = conf.durationA,
				durD = conf.duration - conf.durationA;

		var t = 0;
		while (t < conf.duration) {
			var interval = conf.interval + conf.intervalDeviation * (2*Math.random()-1);

			var angle;
			var velocity;

			if (t < durA) {
				var k = t / durA + Math.random()*0.2;
				angle = conf.angle + conf.angleA * k;
				velocity = conf.velocity + conf.velocityA * k;
			}
			else {
				var k = (t-durA) / durD + Math.random()*0.2;
				angle = conf.angle + conf.angleA + conf.angleD * k;
				velocity = conf.velocity + conf.velocityA + conf.velocityD * k;
			}

			var vx = velocity * Math.cos(angle);
			var vy = velocity * Math.sin(angle);

			particles.push({
				wait: t,
				x: conf.x,
				y: conf.y,
				vx: vx,
				vy: vy,
				density: 1
			});

			t += interval;
		}

		this._groups.add({
			life: opt.life,
			particles: particles
		});
	}
};


