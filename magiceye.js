/*! MagicEye.js (https://github.com/peeinears/MagicEye.js)
 *
 *  MIT License (http://www.opensource.org/licenses/mit-license.html)
 *  Copyright (c) 2014 Ian Pearce
 */

!(function(){
  'use strict';

  window.MagicEye = function (opts) {
    if (!opts) opts = {};

    this.el = opts.el;

    // set options to specified or default values
    for (var property in this.defaultOptions) {
      this[property] = (opts && opts[property]) ? opts[property] : this.defaultOptions[property];
    }

    if (!this.palette) this.palette = this.generatePalette(this.numColors);

    return this;
  };

  MagicEye.prototype.defaultOptions = {
    width: 400,
    height: 300,
    numColors: 10,
    depthMap: '0',
    adaptToElementSize: false
  };

  MagicEye.prototype.randomRGB = function () {
    return [Math.floor(Math.random() * 256),
            Math.floor(Math.random() * 256),
            Math.floor(Math.random() * 256),
            255];
  };

  MagicEye.prototype.generatePalette = function (numColors) {
    var palette = [];
    for (var i = 0; i < numColors; i++) {
      palette.push(this.randomRGB());
    }
    return palette;
  };

  MagicEye.prototype.generatePixelData = function (width, height, depthMap, numColors) {

    /*
     * This algorithm was published in a paper authored by by Harold W.
     * Thimbleby, Stuart Inglis, and Ian H. Witten. The following code was
     * translated from the C code that was featured in the article.
     * http://www.cs.sfu.ca/CourseCentral/414/li/material/refs/SIRDS-Computer-94.pdf
     */

    var x, y, left, right, visible, t, zt, k, sep, z, row,
        same, // points to a pixel to the right
        dpi = 72, // assuming output of 72 dots per inch
        eyeSep = Math.round(2.5 * dpi), // eye separation assumed to be 2.5 inches
        mu = (1 / 3), // depth of field (fraction of viewing distance)
        pixels = []; // two-dimensional array of pixels to be returned in the form pixels[y][x]
                     // rather than storing RGB values here, we store a reference to a color in the palette

    for (y = 0; y < height; y++) {
      row = [];
      same = []; // points to a pixel to the right

      for (x = 0; x < width; x++) {
        same[x] = x; // each pixel is initially linked with itself
      }

      for (x = 0; x < width; x++) {

        z = depthMap[y][x];

        // stereo separation corresponding to z
        sep = Math.round((1 - (mu * z)) * eyeSep / (2 - (mu * z)));

        // x-values corresponding to left and right eyes
        left = Math.round(x - ((sep + (sep & y & 1)) / 2));
        right = left + sep;

        if (0 <= left && right < width) {

          // remove hidden surfaces
          t = 1;
          do {
            zt = z + (2 * (2 - (mu * z)) * t / (mu * eyeSep));
            visible = (depthMap[y][x-t] < zt) && (depthMap[y][x+t] < zt); // false if obscured
            t++;
          } while (visible && zt < 1);

          if (visible) {
            // record that left and right pixels are the same
            for (k = same[left]; k !== left && k !== right; k = same[left]) {
              if (k < right) {
                left = k;
              } else {
                left = right;
                right = k;
              }
            }
            same[left] = right;
          }
        }
      }

      for (x = (width - 1); x >= 0; x--) {
        if (same[x] === x) {
          // set random color
          row[x] = Math.floor(Math.random() * numColors);
        } else {
          // constrained pixel, obey constraint
          row[x] = row[same[x]];
        }
      }

      pixels[y] = row;
    }

    return pixels;
  };

  MagicEye.prototype.formatDepthMap = function (width, height, template) {

    /*
     * Resizes and converts depth maps of various formats into the format
     * readable by `generatePixelData()`.
     *
     * These all return the same depth map:
     *
     * var template = ["   ",
     *                 " # ",
     *                 "   "];
     *
     * var template = ["000",
     *                 "010",
     *                 "000"];
     *
     * var template = "   \n # \n   ";
     *
     * var template = "000\n010\n000";
     *
     * var template = [[0, 0, 0],
     *                 [0, 1, 0],
     *                 [0, 0, 0]];
     *
     * Of course, you can have varying depths:
     *
     * var template = ["001",
     *                 "012",
     *                 "123"];
     *
     * var template = [[0.0, 0.0, 0.3],
     *                 [0.0, 0.3, 0.6],
     *                 [0.3, 0.6, 0.9]];
     *
     */

    var x, y, highest, templateY,
        templateHeight = 0,
        templateWidth = 0,
        tmpTemplate = [],
        depthMap = [];

    if (typeof template === 'string') {
      template = template.split(/\n/);
    }

    if (typeof template === 'object' && template.hasOwnProperty(0)) {

      templateHeight = template.length;

      if (typeof template[0] === 'string') {

        for (y = 0; y < templateHeight; y++) {
          template[y] = template[y].replace(/ /g, '0'); // replace spaces with 0
          template[y] = template[y].replace(/[^\d\n]/g, '1'); // replace non-digits with 1
          template[y] = template[y].split('').map( function (v) { return parseInt(v); } ); // turn '0110' into [0, 1, 1, 0]
        }

      }

      if (typeof template[0] === 'object') {

        // get template width and highest level
        highest = 0;
        for (y = 0; y < templateHeight; y++) {
          if (template[y].length > templateWidth) {
            templateWidth = template[y].length;
          }
          for (x = 0; x < template[y].length; x++) {
            if (template[y][x] > highest) {
              highest = template[y][x];
            }
          }
        }

        // scale levels down to fractions and add zeros for rows of length less than template width
        for (y = 0; y < templateHeight; y++) {
          for (x = 0; x < templateWidth; x++) {
            if (typeof template[y][x] === 'undefined') {
              template[y][x] = 0;
            } else {
              template[y][x] = template[y][x] / highest;
            }
          }
        }

      } else {
        throw('Stereogram.formatDepthMap: invalid depth map template format');
      }
    } else {
      throw('Stereogram.formatDepthMap: invalid depth map template format');
    }

    for (y = 0; y < height; y++) {
      depthMap[y] = [];
      templateY = Math.floor(y * templateHeight / height);
      for (x = 0; x < width; x++) {
        depthMap[y].push( template[templateY][Math.floor(x * templateWidth / width)] );
      }
    }

    return depthMap;
  };

  MagicEye.prototype.renderPNG = function (img) {
    var canvas = document.createElement('canvas');
    canvas.width = this.width;
    canvas.height = this.height;
    this.renderToCanvas(canvas);
    img.src = canvas.toDataURL("image/png");
    return this;
  };

  MagicEye.prototype.renderToCanvas = function (canvas) {
    this.setupRender();
    var x, y, i, rgb, yOffset, xOffset,
        context = canvas.getContext("2d"),
        imageData = context.createImageData(this.width, this.height);

    for (y = 0; y < this.height; y++) {
      yOffset = y * this.width * 4;
      for (x = 0; x < this.width; x++) {
        rgb = this.palette[this.pixels[y][x]];
        xOffset = x * 4;
        for (i = 0; i < 4; i++) {
          imageData.data[yOffset + xOffset + i] = rgb[i];
        }
      }
    }
    context.putImageData(imageData, 0, 0);
    return this;
  };

  MagicEye.prototype.regeneratePalette = function (numColors) {
    this.numColors = numColors || this.numColors;
    this.palette = this.generatePalette(this.numColors);
    return this;
  };

  MagicEye.prototype.setupRender = function () {
    // generate properly formatted depth map from template
    this.rawDepthMap = this.formatDepthMap(this.width, this.height, this.depthMap);

    // generate the pixel data for the stereogram
    this.pixels = this.generatePixelData(this.width, this.height, this.rawDepthMap, this.numColors);

    return this;
  };

  MagicEye.prototype.render = function () {
    var element = (typeof this.el === 'string' ? document.getElementById(this.el) : this.el);

    if (!element || !element.tagName) {
      throw('MagicEye.render(): invalid element: ' + element);
    }

    if (this.adaptToElementSize) {
      if (!element || !element.tagName) {
        throw('Stereogram.render: invalid element: ' + element);
      }
      if (typeof element.width === 'number' && typeof element.height === 'number') {
        this.width = element.width;
        this.height = element.height;
      } else {
        throw("Stereogram.render: adaptToElementSize set to true, but size of element " + element + " is unknown");
      }
    }

    if (element.tagName.toLowerCase() === 'img') {
      this.renderPNG(element);
    } else if (element.tagName.toLowerCase() === 'canvas') {
      this.renderToCanvas(element);
    } else {
      throw("MagicEye.render(): invalid element, can only render to <img> or <canvas>");
    }

    return this;
  };

})();
