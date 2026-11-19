//
// Procedurally animated depth maps ("depth movies") for movie.html.
// Each scene is a DepthMapper whose make(width, height, frame) advances its
// own clock by frame.delta, so it plays, pauses and changes speed with the
// animation that drives it.
//
var Scenes = {};

Scenes.Base = Stereogram.DepthMapper.extend({

  autoResize: false,

  constructor: function (opts) {
    this.opts = opts || {};
    this.time = 0;
    this.speed = 1;
  },

  make: function (width, height, frame) {
    if (frame) this.time += frame.delta * this.speed;
    var map = this._map, y;
    if (!map || map.length !== height || map[0].length !== width) {
      map = this._map = [];
      for (y = 0; y < height; y++) map[y] = new Float32Array(width);
    }
    this.draw(map, width, height, this.time);
    return map;
  },

  draw: function (map, width, height, time) {}

});
Scenes.Base.extend = Stereogram.DepthMapper.extend;

function fillMap(map, value) {
  for (var y = 0; y < map.length; y++) map[y].fill(value);
}


// A planet with moons orbiting in front of and behind it
Scenes.Orbits = Scenes.Base.extend({

  draw: function (map, width, height, time) {
    var unit = Math.min(width, height),
        bodies = [{ x: 0, y: 0, z: 0, r: 0.17 }],
        moons = [
          { orbit: 0.36, radius: 0.065, speed: 0.9,  tilt: 0.35,  phase: 0 },
          { orbit: 0.44, radius: 0.085, speed: 0.55, tilt: -0.22, phase: 2.2 },
          { orbit: 0.27, radius: 0.05,  speed: 1.4,  tilt: 0.65,  phase: 4.1 }
        ],
        i, m, a;

    fillMap(map, 0);

    for (i = 0; i < moons.length; i++) {
      m = moons[i];
      a = (time * m.speed) + m.phase;
      bodies.push({
        x: m.orbit * Math.cos(a),
        y: m.orbit * Math.sin(a) * Math.sin(m.tilt),
        z: m.orbit * Math.sin(a) * Math.cos(m.tilt),
        r: m.radius
      });
    }

    for (i = 0; i < bodies.length; i++) {
      this.drawSphere(map, width, height, unit, bodies[i]);
    }
  },

  // z-buffered sphere; world z of 0 maps to depth 0.45, nearer is higher
  drawSphere: function (map, width, height, unit, b) {
    var perspective = 1 + (0.6 * b.z),
        cx = (width / 2) + (b.x * unit * perspective),
        cy = (height / 2) + (b.y * unit * perspective),
        rs = b.r * unit * perspective,
        x0 = Math.max(0, Math.floor(cx - rs)), x1 = Math.min(width - 1, Math.ceil(cx + rs)),
        y0 = Math.max(0, Math.floor(cy - rs)), y1 = Math.min(height - 1, Math.ceil(cy + rs)),
        base = 0.45 + (0.9 * b.z),
        bulge = 0.9 * b.r,
        x, y, dx, dy, d2, v, row;

    for (y = y0; y <= y1; y++) {
      row = map[y];
      dy = (y - cy) / rs;
      for (x = x0; x <= x1; x++) {
        dx = (x - cx) / rs;
        d2 = (dx * dx) + (dy * dy);
        if (d2 < 1) {
          v = base + (bulge * Math.sqrt(1 - d2));
          if (v > row[x]) row[x] = v;
        }
      }
    }
  }

});


// Raindrops falling on a pool, sending out rings of ripples
Scenes.Ripples = Scenes.Base.extend({

  draw: function (map, width, height, time) {
    var unit = Math.min(width, height),
        drops = this.drops || (this.drops = []),
        waveSpeed = 0.22 * unit,          // px per second
        k = 2 * Math.PI / (0.07 * unit),  // wavelength
        lifetime = 4,
        i, d, age, front, sigma, amp, maxR, lut, r, x, y, x0, x1, y0, y1, dx, dy, row, dist, ri;

    if (this.nextDrop === undefined || time < this.lastTime) {
      drops.length = 0;
      this.nextDrop = 0;
    }
    this.lastTime = time;

    while (time >= this.nextDrop) {
      drops.push({ x: Math.random() * width, y: Math.random() * height, born: this.nextDrop });
      this.nextDrop += 0.35 + (Math.random() * 0.5);
    }
    while (drops.length && time - drops[0].born > lifetime) drops.shift();

    fillMap(map, 0.3);

    for (i = 0; i < drops.length; i++) {
      d = drops[i];
      age = time - d.born;
      front = waveSpeed * age;
      sigma = (0.05 * unit) + (0.03 * unit * age);
      amp = 0.3 * Math.exp(-age * 0.9);
      maxR = Math.ceil(front + (2.5 * sigma));

      // radial profile of this drop's ripple ring
      lut = new Float32Array(maxR + 1);
      for (r = 0; r <= maxR; r++) {
        dist = (r - front) / sigma;
        lut[r] = amp * Math.cos(k * (r - front)) * Math.exp(-dist * dist) / (1 + (r / (0.15 * unit)));
      }

      x0 = Math.max(0, Math.floor(d.x - maxR)); x1 = Math.min(width - 1, Math.ceil(d.x + maxR));
      y0 = Math.max(0, Math.floor(d.y - maxR)); y1 = Math.min(height - 1, Math.ceil(d.y + maxR));
      for (y = y0; y <= y1; y++) {
        row = map[y];
        dy = y - d.y;
        for (x = x0; x <= x1; x++) {
          dx = x - d.x;
          ri = Math.sqrt((dx * dx) + (dy * dy)) | 0;
          if (ri <= maxR) row[x] += lut[ri];
        }
      }
    }

    for (y = 0; y < height; y++) {
      row = map[y];
      for (x = 0; x < width; x++) {
        if (row[x] < 0) row[x] = 0;
        else if (row[x] > 1) row[x] = 1;
      }
    }
  }

});


// A cube tumbling in space
Scenes.Cube = Scenes.Base.extend({

  draw: function (map, width, height, time) {
    var unit = Math.min(width, height),
        s = 0.2 * unit, // half the edge length
        maxZ = s * Math.sqrt(3),
        cx = width / 2,
        cy = (height / 2) + (Math.sin(time * 1.3) * 0.04 * unit),
        ax = time * 0.7, ay = time * 0.9, az = time * 0.3,
        normals = [], i, j, n, x, y, px, py, upper, lower, rhs, nz, row, hit,
        x0, x1, y0, y1;

    // rotation matrix columns: rotate the unit axes
    var cxa = Math.cos(ax), sxa = Math.sin(ax),
        cya = Math.cos(ay), sya = Math.sin(ay),
        cza = Math.cos(az), sza = Math.sin(az);
    function rotate(v) {
      // around x
      var y1 = (v[1] * cxa) - (v[2] * sxa), z1 = (v[1] * sxa) + (v[2] * cxa), x1 = v[0];
      // around y
      var x2 = (x1 * cya) + (z1 * sya), z2 = (-x1 * sya) + (z1 * cya);
      // around z
      return [(x2 * cza) - (y1 * sza), (x2 * sza) + (y1 * cza), z2];
    }
    var axes = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
    for (i = 0; i < 3; i++) {
      n = rotate(axes[i]);
      normals.push(n, [-n[0], -n[1], -n[2]]);
    }

    fillMap(map, 0);

    x0 = Math.max(0, Math.floor(cx - maxZ)); x1 = Math.min(width - 1, Math.ceil(cx + maxZ));
    y0 = Math.max(0, Math.floor(cy - maxZ)); y1 = Math.min(height - 1, Math.ceil(cy + maxZ));

    // The cube is every point p with n·p <= s for all six face normals. Along
    // the line of sight through (px, py) that bounds z from above and below;
    // the upper bound is the visible front face.
    for (y = y0; y <= y1; y++) {
      row = map[y];
      py = y - cy;
      for (x = x0; x <= x1; x++) {
        px = x - cx;
        upper = Infinity;
        lower = -Infinity;
        hit = true;
        for (j = 0; j < 6; j++) {
          n = normals[j];
          nz = n[2];
          rhs = s - (n[0] * px) - (n[1] * py);
          if (nz > 1e-6) {
            if (rhs / nz < upper) upper = rhs / nz;
          } else if (nz < -1e-6) {
            if (rhs / nz > lower) lower = rhs / nz;
          } else if (rhs < 0) {
            hit = false;
            break;
          }
        }
        if (hit && upper >= lower) row[x] = 0.5 + (0.4 * upper / maxZ);
      }
    }
  }

});
