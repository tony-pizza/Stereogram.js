//
// Generates depth maps of text crawling up and away into the distance on a
// tilted plane, like the opening crawl of a space movie. Works with any amount
// of text: lines are rendered lazily as they scroll into view.
//
// Use with Stereogram.animate() and the text will scroll on its own, or call
// generate(width, height) yourself after changing `position`.
//
Stereogram.TextCrawlDepthMapper = Stereogram.DepthMapper.extend({

  autoResize: false,

  constructor: function (text, opts) {
    opts = opts || {};
    var defaults = {
      speed: 40,                 // pixels per second (measured at the bottom of the screen)
      fontSize: null,            // px at the bottom of the screen; default: width / 7
      fontFamily: 'Helvetica, Arial, sans-serif',
      fontWeight: 'bold',
      lineHeight: 1.25,          // multiple of fontSize
      textAlign: 'center',       // 'center', 'justify', 'left' or 'right'; with 'justify',
                                 //   one-line and ALL-CAPS paragraphs (titles) are centered
      padding: 0.04,             // left/right padding, fraction of width. A word too wide
                                 //   for the screen is never broken; its line runs off the edges
      angle: 0.3,                // how steeply the text recedes, 0 to 1: at 0 it scrolls straight
                                 //   up at full size; at 1 it shrinks to 20% by the top
      tilt: 1,                   // vertical squash of the letters (1 = none)
      textDepth: 0.85,           // how far letters stand out from the plane, 0 to 1
                                 //   (depths above 1 are clipped)
      planeDepth: 0.15,          // depth of the plane at the bottom; it recedes with the angle
      fadeTop: 0.1,              // letters flatten out over this fraction of the screen at
                                 //   the top before scrolling off (0 for no fade)
      loop: true,                // start over after the last line disappears
      loopGap: 0.5               // pause before looping, as a fraction of the screen height
    };
    for (var property in defaults) {
      this[property] = opts.hasOwnProperty(property) ? opts[property] : defaults[property];
    }
    this.position = opts.position || 0; // how far the text has scrolled, in texture pixels
    this.setText(text || '');
  },

  setText: function (text) {
    this.text = text;
    this._layoutKey = null;
    return this;
  },

  restart: function () {
    this.position = 0;
    return this;
  },

  // true once the last line has scrolled off the top
  isFinished: function () {
    return this._layout ? this.position > this._endPosition(this._height) : false;
  },

  // Perspective for a screen `height` px tall. The text lies on a plane seen
  // from above; `scale` at screen row y is (y - horizonY) / span, 1 at the
  // bottom and `topScale` at the top.
  _perspective: function (height) {
    var angle = Math.min(Math.max(this.angle, 0), 1),
        topScale = Math.min(1 - (0.8 * angle), 0.999),
        horizonY = -height * topScale / (1 - topScale),
        span = height - horizonY;
    return {
      horizonY: horizonY,
      span: span,
      distance: this.tilt * span, // text px per unit of (1 / scale)
      topScale: topScale
    };
  },

  // the scroll position at which the last line has gone off the top
  _endPosition: function (height) {
    var view = this._perspective(height);
    return (this._layout.lines.length * this._layout.lineHeight) +
      (view.distance * ((1 / view.topScale) - 1));
  },

  make: function (width, height, frame) {
    if (frame) this.position += this.speed * frame.delta;

    this._ensureLayout(width, height);
    this._height = height;

    var layout = this._layout,
        lineHeight = layout.lineHeight,
        numLines = layout.lines.length,
        textHeight = numLines * lineHeight,
        view = this._perspective(height),
        fadeRows = this.fadeTop * height,
        cx = width / 2,
        x, y, p, w, line, ly, mask, data, maskWidth, plane, amp, fade, u, v, rowStart, row,
        minLine = Infinity, maxLine = -1;

    if (this.loop && this.position > this._endPosition(height) + (this.loopGap * height)) {
      this.position = 0;
    }

    if (!this._depthMap || this._depthMap.length !== height || this._depthMap[0].length !== width) {
      this._depthMap = [];
      for (y = 0; y < height; y++) this._depthMap[y] = new Float32Array(width);
    }

    for (y = 0; y < height; y++) {
      row = this._depthMap[y];
      p = (y + 0.5 - view.horizonY) / view.span; // perspective scale, 1 at the bottom

      plane = this.planeDepth * p;
      row.fill(plane);

      // which row of the text sits on this row of the screen
      w = this.position - (view.distance * ((1 / p) - 1));
      if (w < 0 || w >= textHeight) continue;
      line = Math.floor(w / lineHeight);
      if (line < minLine) minLine = line;
      if (line > maxLine) maxLine = line;
      mask = this._lineMask(line);
      if (!mask) continue;
      data = mask.data;
      maskWidth = mask.width;
      ly = Math.floor(w - (line * lineHeight));
      rowStart = ly * maskWidth;

      // letters keep their full height, except in a short fade at the very top
      fade = fadeRows > 0 ? Math.min(y / fadeRows, 1) : 1;
      fade = fade * fade * (3 - (2 * fade)); // smoothstep
      amp = this.textDepth * fade / 255;

      for (x = 0; x < width; x++) {
        u = Math.floor(((x - cx) / p) + (maskWidth / 2));
        if (u >= 0 && u < maskWidth) {
          v = plane + (amp * data[rowStart + u]);
          row[x] = v > 1 ? 1 : v;
        }
      }
    }

    // forget lines that have scrolled out of view
    for (var key in this._masks) {
      if (key < minLine - 1 || key > maxLine + 1) delete this._masks[key];
    }

    return this._depthMap;
  },

  _font: function (size) {
    return this.fontWeight + ' ' + size + 'px ' + this.fontFamily;
  },

  _ensureLayout: function (width, height) {
    var fontSize = Math.round(this.fontSize || width / 7),
        key = [width, height, this.text, fontSize, this.fontFamily, this.fontWeight,
               this.lineHeight, this.textAlign, this.padding].join('|');
    if (this._layoutKey === key) return;
    this._layoutKey = key;

    var canvas = this._canvas || (this._canvas = document.createElement('canvas')),
        lineHeight = Math.round(fontSize * this.lineHeight),
        paddingX = Math.round(width * this.padding),
        maxWidth = width - (2 * paddingX);

    canvas.width = width;
    canvas.height = lineHeight;
    this._context = canvas.getContext('2d', { willReadFrequently: true });
    this._context.font = this._font(fontSize);

    var lines = [],
        paragraphs = this.text.replace(/\r\n?/g, '\n').split('\n');
    for (var i = 0; i < paragraphs.length; i++) {
      this._wrapParagraph(paragraphs[i], maxWidth, lines);
    }

    this._layout = {
      lines: lines,
      width: width,
      fontSize: fontSize,
      lineHeight: lineHeight,
      paddingX: paddingX,
      maxWidth: maxWidth
    };
    this._masks = {};
  },

  _wrapParagraph: function (paragraph, maxWidth, lines) {
    var context = this._context,
        words = paragraph.trim().split(/\s+/),
        start = lines.length,
        current = [],
        i, word;

    if (!words[0]) {
      lines.push(null); // blank line
      return;
    }

    // Wrap only between words. A word wider than the screen ends up alone on
    // its own line, which is allowed to run past the edges.
    for (i = 0; i < words.length; i++) {
      word = words[i];
      if (current.length && context.measureText(current.concat(word).join(' ')).width > maxWidth) {
        lines.push({ words: current, last: false });
        current = [];
      }
      current.push(word);
    }
    lines.push({ words: current, last: true });

    // one-line and ALL-CAPS paragraphs are titles: centered when justifying
    var title = (lines.length - start) === 1 || !/[a-z]/.test(paragraph);
    for (i = start; i < lines.length; i++) lines[i].title = title;
  },

  _lineMask: function (index) {
    if (this._masks.hasOwnProperty(index)) return this._masks[index];

    var line = this._layout.lines[index],
        mask = null;

    if (line) {
      var layout = this._layout,
          context = this._context,
          canvas = this._canvas,
          words = line.words,
          text = words.join(' '),
          align = this.textAlign,
          baseline = Math.round((layout.lineHeight + (layout.fontSize * 0.7)) / 2),
          x, i, gap, wordsWidth, data, textWidth, maskWidth;

      context.font = this._font(layout.fontSize);
      textWidth = context.measureText(text).width;

      // a line too wide for the screen gets a wider canvas, centered
      maskWidth = Math.max(layout.width, Math.ceil(textWidth + (2 * layout.paddingX)));
      if (maskWidth > layout.width) align = 'center';

      // don't stretch titles, last lines, or lines so short they'd be mostly gaps
      if (align === 'justify' && (line.title || line.last || words.length < 2 ||
                                  textWidth < layout.maxWidth * 0.6)) {
        align = line.title ? 'center' : 'left';
      }

      if (canvas.width !== maskWidth) canvas.width = maskWidth; // also resets the context
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.font = this._font(layout.fontSize);
      context.fillStyle = '#fff';
      context.textBaseline = 'alphabetic';

      if (align === 'justify') {
        wordsWidth = 0;
        for (i = 0; i < words.length; i++) wordsWidth += context.measureText(words[i]).width;
        gap = (layout.maxWidth - wordsWidth) / (words.length - 1);
        x = layout.paddingX;
        for (i = 0; i < words.length; i++) {
          context.fillText(words[i], x, baseline);
          x += context.measureText(words[i]).width + gap;
        }
      } else {
        if (align === 'center') x = (canvas.width - textWidth) / 2;
        else if (align === 'right') x = canvas.width - layout.paddingX - textWidth;
        else x = layout.paddingX;
        context.fillText(text, x, baseline);
      }

      data = context.getImageData(0, 0, canvas.width, canvas.height).data;
      mask = { width: maskWidth, data: new Uint8Array(canvas.width * canvas.height) };
      for (i = 0; i < mask.data.length; i++) mask.data[i] = data[(i * 4) + 3];
    }

    this._masks[index] = mask;
    return mask;
  }

});
