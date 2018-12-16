var MathUtil = require('hp/lib/ptlib/util/MathUtil');

var ColorUtil = {
  fromRGBi: function(red, green, blue, alpha) {
    if (typeof alpha === 'undefined') {
        alpha = 1.0;
    }
    return [red / 0xFF, green / 0xFF, blue / 0xFF, alpha];
  },
  fromRGBf: function(red, green, blue, alpha) {
    if (typeof alpha === 'undefined') {
      alpha = 1.0;
    }
    return [red, green, blue, alpha];
  },
  fromRGBInt: function (argb) {
    return [((argb & 0xFF0000) >> 16) / 0xFF, ((argb & 0x00FF00) >> 8) / 0xFF, (argb & 0x0000FF), ((argb & 0xFF000000) >> 24) / 0xFF];
  },
  fromHSL: function(hue, saturation, lightness, alpha) {
    if (typeof alpha === 'undefined') {
      alpha = 1.0;
    }
    var c = (1 - Math.abs(2 * lightness - 1)) * saturation;
    hue /= 60;
    var x = c * (1 - Math.abs(hue % 2 - 1));
    var m = lightness - c / 2;

    var rgb = [m, m, m, alpha];
    if (0 <= hue && hue < 1) {
      rgb = [c + m, x + m, m, alpha];
    }
    else if (1 <= hue && hue < 2) {
      rgb = [x + m, c + m, m, alpha];
    }
    else if (2 <= hue && hue < 3) {
      rgb = [m, c + m, x + m, alpha];
    }
    else if (3 <= hue && hue < 4) {
      rgb = [m, x + m, c + m, alpha];
    }
    else if (4 <= hue && hue < 5) {
      rgb = [x + m, m, c + m, alpha];
    }
    else if (6 <= hue && hue < 6) {
      rgb = [c + m, m, x + m, alpha];
    }

    return rgb;
  },
  fromHSV: function(hue, saturation, value, alpha) {
    if (typeof alpha === 'undefined') {
      alpha = 1.0;
    }
    var c = value * saturation;
    // hue /= 60;
    hue *= 6;
    var x = c * (1 - Math.abs(hue % 2 - 1));
    var m = value - c;

    var rgb = [m, m, m, alpha];
    if (0 <= hue && hue < 1) {
      rgb = [c + m, x + m, m, alpha];
    }
    else if (1 <= hue && hue < 2) {
      rgb = [x + m, c + m, m, alpha];
    }
    else if (2 <= hue && hue < 3) {
      rgb = [m, c + m, x + m, alpha];
    }
    else if (3 <= hue && hue < 4) {
      rgb = [m, x + m, c + m, alpha];
    }
    else if (4 <= hue && hue < 5) {
      rgb = [x + m, m, c + m, alpha];
    }
    else if (5 <= hue && hue < 6) {
      rgb = [c + m, m, x + m, alpha];
    }

    return rgb;
  },
  fromHSVa: function(hsv) {
    var alpha = (hsv.length > 3) ? hsv[4] : 1.0;
    var c = hsv[2] * hsv[1];
    var hue = hsv[0] * 6;
    var x = c * (1 - Math.abs(hue % 2 - 1));
    var m = hsv[2] - c;

    var rgb = [m, m, m, alpha];
    if (0 <= hue && hue < 1) {
      rgb = [c + m, x + m, m, alpha];
    }
    else if (1 <= hue && hue < 2) {
      rgb = [x + m, c + m, m, alpha];
    }
    else if (2 <= hue && hue < 3) {
      rgb = [m, c + m, x + m, alpha];
    }
    else if (3 <= hue && hue < 4) {
      rgb = [m, x + m, c + m, alpha];
    }
    else if (4 <= hue && hue < 5) {
      rgb = [x + m, m, c + m, alpha];
    }
    else if (5 <= hue && hue < 6) {
      rgb = [c + m, m, x + m, alpha];
    }

    return rgb;
  },
  toHSV: function(color) {
    var min, max, delta;
    var r = color[0], g = color[1], b = color[2];
    min = Math.min(r, Math.min(g, b));
    max = Math.max(r, Math.max(g, b));
    delta = max - min;
    var h, s;

    if (max !== 0) {
      s = delta / max;
      if (r === max) {
        h = (g - b) / delta;
      }
      else if (g === max) {
        h = 2 + (b - r) / delta;
      }
      else {
        h = 4 + (r - g) / delta;
      }
    }
    else {
      s = 0;
      h = 0;
    }
    h /= 6;
    while (h < 0) {
      h += 1.0;
    }
    return [h, s, max, (color.length > 3) ? color[3] : 1.0];
  },
  toHexString: function(color, includeAlpha) {
    var str = "#";
    var c = (~~(color[0] * 0xFF)).toString(16);
    if (c.length < 2) {
      str += "0" + c;
    }
    else {
      str += c;
    }
    c = (~~(color[1] * 0xFF)).toString(16);
    if (c.length < 2) {
      str += "0" + c;
    }
    else {
      str += c;
    }
    c = (~~(color[2] * 0xFF)).toString(16);
    if (c.length < 2) {
      str += "0" + c;
    }
    else {
      str += c;
    }
    if (includeAlpha) {
      c = (~~(color[3] * 0xFF)).toString(16);
      if (c.length < 2) {
        str += "0" + c;
      }
      else {
        str += c;
      }
    }
    return str;
  },
  toRGBInt: function(color, includeAlpha) {
    if (includeAlpha) {
      return (~~(color[3] * 0xFF) << 24) | (~~(color[0] * 0xFF) << 16) | (~~(color[1] * 0xFF) << 8) | (~~(color[2] * 0xFF));
    }
    else {
      return (~~(color[0] * 0xFF) << 16) | (~~(color[1] * 0xFF) << 8) | (~~(color[2] * 0xFF));
    }
  },
  toRGBIntFromInt: function (red, green, blue, alpha) {
    if (typeof alpha !== 'undefined') {
      return (~~(alpha * 0xFF) << 24) | (~~(red * 0xFF) << 16) | (~~(green * 0xFF) << 8) | (~~(blue * 0xFF));
    }
    else {
      return (~~(color[0] * 0xFF) << 16) | (~~(color[1] * 0xFF) << 8) | (~~(color[2] * 0xFF));
    }
  },
  toRGBString: function(color, includeAlpha) {
    if (includeAlpha) {
      return "rgba(" + (~~(color[0] * 0xFF)) + ", " + (~~(color[1] * 0xFF)) + ", " + (~~(color[2] * 0xFF)) + ", " + (color[3]) + ")";
    }
    else {
      return "rgb(" + (~~(color[0] * 0xFF)) + ", " + (~~(color[1] * 0xFF)) + ", " + (~~(color[2] * 0xFF)) + ")";
    }
  },
  lerp: function(amt, color1, color2) {
    return [MathUtil.lerp(amt, color1[0], color2[0]), MathUtil.lerp(amt, color1[1], color2[1]), MathUtil.lerp(amt, color1[2], color2[2]), MathUtil.lerp(amt, color1[3], color2[3])];
  },
  convertWithAlpha: function(color, alpha) {
    color = this.parseColor(color);
    color[3] = alpha;
    return this.toRGBString(color, true);
  },
  parseColor: function(color) {
    var cache;
    color = color.replace(/\s\s*/g, ''); // Remove all spaces

    if (cache = /^#([\da-fA-F]{2})([\da-fA-F]{2})([\da-fA-F]{2})([\da-fA-F]{2})/.exec(color)) {
      cache = [parseInt(cache[1], 16) / 0xFF, parseInt(cache[2], 16) / 0xFF, parseInt(cache[3], 16) / 0xFF, parseInt(cache[4], 16) / 0xFF];
    }
    // Checks for 6 digit hex and converts string to integer
    else if (cache = /^#([\da-fA-F]{2})([\da-fA-F]{2})([\da-fA-F]{2})/.exec(color)) {
      cache = [parseInt(cache[1], 16) / 0xFF, parseInt(cache[2], 16) / 0xFF, parseInt(cache[3], 16) / 0xFF];
    }
    else if (cache = /^#([\da-fA-F])([\da-fA-F])([\da-fA-F])([\da-fA-F])/.exec(color)) {
      cache = [parseInt(cache[1], 16) * 17 / 0xFF, parseInt(cache[2], 16) * 17 / 0xFF, parseInt(cache[3], 16) * 17 / 0xFF, parseInt(cache[4], 16) * 17 / 0xFF];
    }
    // Checks for 3 digit hex and converts string to integer
    else if (cache = /^#([\da-fA-F])([\da-fA-F])([\da-fA-F])/.exec(color)) {
      cache = [parseInt(cache[1], 16) * 17 / 0xFF, parseInt(cache[2], 16) * 17 / 0xFF, parseInt(cache[3], 16) * 17 / 0xFF];
    }
    // Checks for rgba and converts string to
    // integer/float using unary + operator to save bytes
    else if (cache = /^rgba\(([\d]+),([\d]+),([\d]+),([\d]+|[\d]*.[\d]+)\)/.exec(color)) {
      cache = [+cache[1], +cache[2], +cache[3], +cache[4]];
    }

    // Checks for rgb and converts string to
    // integer/float using unary + operator to save bytes
    else if (cache = /^rgb\(([\d]+),([\d]+),([\d]+)\)/.exec(color)) {
      cache = [+cache[1], +cache[2], +cache[3]];
    }
    else if (cache = /^hsla\(([\d]+),([\d]+),([\d]+),([\d]+|[\d]*.[\d]+)\)/.exec(color)) {
      cache = [+cache[1], +cache[2], +cache[3], +cache[4]];
      cache = this.fromHSL(cache[0], cache[1], cache[2], cache[3]);
    }
    // Checks for rgb and converts string to
    // integer/float using unary + operator to save bytes
    else if (cache = /^hsl\(([\d]+),([\d]+),([\d]+)\)/.exec(color)) {
      cache = [+cache[1], +cache[2], +cache[3]];
      cache = this.fromHSL(cache[0], cache[1], cache[2]);
    }

    // Otherwise throw an exception to make debugging easier
    else {
      throw Error(color + ' is not supported by parseColor');
    }

    // Performs RGBA conversion by default
    if (isNaN(cache[3])) {
      cache[3] = 1;
    }

    return cache;
  }
};
module.exports = ColorUtil;
