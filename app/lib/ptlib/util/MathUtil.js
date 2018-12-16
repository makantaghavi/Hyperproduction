var MathUtil = {
    TWO_PI: 2 * Math.PI,
    HALF_PI: Math.PI / 2,
    QUARTER_PI: Math.PI / 4,
    LOG2: Math.log(2),
    PHI: 1.6180339887498948482045868,

    sign: function(x) {
        return x ? x < 0 ? -1 : 1 : 0;
    },
    random16: function() {
        return (65280 * Math.random() + 255 * Math.random()) / 65535;
    },
    randInt: function(min, max) {
        return min + ~~(Math.random() * (max - min));
    },
    randFloat: function(min, max) {
        return min + Math.random() * (max - min);
    },
    // Move these Array-oriented functions to ArrayUtil?
    range: function(min, max) {
        var array = new Array(Math.abs(max - min));
        var s = MathUtil.sign(max - min);
        for (var i = 0; i < array.length; i++) {
            array[i] = min + i * s;
        }
        return array;
    },
    oneOf: function(array) {
        return array[~~(Math.random() * array.length)];
    },
    someOf: function(array, n) {
        if (typeof n !== 'number') {
            n = MathUtil.randInt(1, array.length - 1);
        }
        var idxs = MathUtil.range(0, array.length);
        idxs = MathUtil.shuffle(idxs);
        idxs.length = n;
        return idxs.map(function(el) {
            return array[el];
        });
    },
    shuffle: function(list) {
        var t, k;
        for (var i = 0; i < list.length; i++) {
            k = ~~(Math.random() * list.length);
            t = list[i];
            list[i] = list[k];
            list[k] = t;
        }
        return list;
    },
    clip: function(value, min, max) {
        if (value < min) {
            return min;
        }
        if (value > max) {
            return max;
        }
        return value;
    },
    mod: function(value, range) {
        if (value > range) {
            return value - ~~(value / range) * range;
        }
        if (value < 0) {
            return value + ~~(Math.abs(value / range)) * range;
        }
        return value;
    },
    lerp: function(value, min, max) {
        return value * (max - min) + min;
    },
    normalize: function(value, min, max) {
        return (value - min) / (max - min);
    },
    scale: function(value, inMin, inMax, outMin, outMax) {
        return ((value - inMin) * ((outMax - outMin) / (inMax - inMin))) + outMin;
    },
    map: function(value, inMin, inMax, outMin, outMax) {
        return (this.clip(value, inMin, inMax) - inMin) * ((outMax - outMin) / (inMax - inMin)) + outMin;
    },
    nlerp: function(value, outMin, outMax, gamma) {
        return Math.pow(value, gamma) * (outMax - outMin) + outMin;
    },
    nlScale: function(value, inMin, inMax, outMin, outMax, gamma) {
        return Math.pow(value - inMin, gamma) * ((outMax - outMin) / (inMax - inMin)) + outMin;
    },
    distance: function(x1, y1, x2, y2) {
        return Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1));
    },
    cosInterp: function(value, outMin, outMax) {
        var v = (1.0 - Math.cos(value * Math.PI)) * 0.5;
        return outMin * (1.0 - v) + outMax * v;
    },
    cubicInterp: function(value, x0, x1, x2, x3) {
        var v = (x3 - x2) - (x0 - x1);
        return v * (value * value * value) + ((x0 - x1) - v) * (value * value) + (x2 - x0) * value + x1;
    },
    smoothStep: function(value, inMin, inMax) {
        if (value < inMin) {
            value = inMin;
        }
        if (value > inMax) {
            value = inMax;
        }
        value = (value - inMin) / (inMax - inMin);
        return value * value * (3 - 2 * value);
    },
    smootherStep: function(value, inMin, inMax) {
        if (value < inMin) {
            value = inMin;
        }
        if (value > inMax) {
            value = inMax;
        }
        value = (value - inMin) / (inMax - inMin);
        return value * value * value * (value * (value * 6 - 15) + 10);
    },
    noise1D: function(x) {
        x = ~~x;
        x = (x << 13) ^ x;
        return (1.0 - ((x * (x * x * 15731 + 789221) + 1376312589) & 0x7fffffff) / 1073741824.0);
    },
    noise2D: function(x, y) {
        x = ~~x;
        y = ~~y;
        x = x + y * 57;
        x = (x << 13) ^ x;
        return (1.0 - ((x * (x * x * 15731 + 789221) + 1376312589) & 0x7fffffff) / 1073741824.0);
    },
    smooth2Noise1D: function(x) {
        return MathUtil.noise1D(x) / 2.0 + MathUtil.noise1D(x - 1) / 4.0 + MathUtil.noise1D(x + 1) / 4.0;
    },
    interpNoise1D: function(x) {
        var xi = ~~x;
        return MathUtil.lerp(x - xi, MathUtil.smooth2Noise1D(xi), MathUtil.smooth2Noise1D(xi + 1));
    }
};

module.exports = MathUtil;
