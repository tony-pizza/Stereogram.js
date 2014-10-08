/*! MagicEye.js (https://github.com/peeinears/MagicEye.js)
 *
 *  MIT License (http://www.opensource.org/licenses/mit-license.html)
 *  Copyright (c) 2014 Ian Pearce
 */

!(function(){
  'use strict';

  window.MagicEye = function (el, opts) {
    if (!opts) opts = {};

    this.el = el;

    // set options to specified or default values
    for (var property in this._defaultOptions) {
      this[property] = (opts && opts[property]) ? opts[property] : this._defaultOptions[property];
    }

    return this;
  };

  MagicEye.prototype._defaultOptions = {
    width: null,
    height: null,
    depthMap: '0',
    imageType: 'png',
    palette: [
      [255, 255, 255, 255],
      [0, 0, 0, 255]
    ]
  };

  MagicEye.prototype._generatePixelData = function () {

    /*
     * This algorithm was published in a paper authored by by Harold W.
     * Thimbleby, Stuart Inglis, and Ian H. Witten. The following code was
     * translated from the C code that was featured in the article.
     * http://www.cs.sfu.ca/CourseCentral/414/li/material/refs/SIRDS-Computer-94.pdf
     */

    var x, y, left, right, visible, t, zt, k, sep, z, row,
        width = this._width,
        height = this._height,
        depthMap = this._depthMap,
        numColors = this.palette.length,
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

    this._pixels = pixels;
    return this;
  };

  MagicEye.prototype._formatDepthMap = function () {

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
        width = this._width,
        height = this._height,
        template = this.depthMap,
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
        throw('MagicEye: invalid depth map template format');
      }
    } else {
      throw('MagicEye: invalid depth map template format');
    }

    for (y = 0; y < height; y++) {
      depthMap[y] = [];
      templateY = Math.floor(y * templateHeight / height);
      for (x = 0; x < width; x++) {
        depthMap[y].push( template[templateY][Math.floor(x * templateWidth / width)] );
      }
    }

    this._depthMap = depthMap;
    return this;
  };

  MagicEye.prototype._renderToImg = function (img) {
    img = img || this._element;
    var canvas = document.createElement('canvas');
    canvas.width = this._width;
    canvas.height = this._height;
    this._renderToCanvas(canvas);
    img.src = canvas.toDataURL('image/' + this.imageType);
    return this;
  };

  MagicEye.prototype._renderToCanvas = function (canvas) {
    canvas = canvas || this._element;
    var x, y, i, rgba, yOffset, xOffset,
        context = canvas.getContext("2d"),
        imageData = context.createImageData(this._width, this._height);

    for (y = 0; y < this._height; y++) {
      yOffset = y * this._width * 4;
      for (x = 0; x < this._width; x++) {
        rgba = this.palette[this._pixels[y][x]];
        xOffset = x * 4;
        for (i = 0; i < 4; i++) {
          imageData.data[yOffset + xOffset + i] = rgba[i];
        }
      }
    }
    context.putImageData(imageData, 0, 0);
    return this;
  };

  MagicEye.prototype._setElement = function () {
    this._element = (typeof this.el === 'string' ? document.getElementById(this.el) : this.el);
    if (!this._element || !this._element.tagName) throw('MagicEye: Could not find element: ' + this.el);
    return this;
  };

  MagicEye.prototype._setHeightAndWidth = function () {
    // use element's height and width unless height and width is provided
    this._width = this.width || this._element.width;
    if (!this._width) throw('MagicEye: width not set and could not be inferred from element: ' + this.el);
    this._height = this.height || this._element.height;
    if (!this._height) throw('MagicEye: height not set and could not be inferred from element: ' + this.el);
    return this;
  };

  MagicEye.prototype._setupRender = function () {
    return this._setElement()
      ._setHeightAndWidth()
      ._formatDepthMap()
      ._generatePixelData();
  };

  MagicEye.prototype.render = function () {

    this._setupRender();

    switch (this._element.tagName.toLowerCase()) {
      case 'img':
        this._renderToImg();
        break;
      case 'canvas':
        this._renderToCanvas();
        break;
      default:
        throw("MagicEye: invalid element, can only render to <img> or <canvas>");
    }

    return this;
  };


  // -- Utils --

  MagicEye.utils = {

    // async
    depthMapFromImageURL: function (src, fn) {
      var img = new Image();
      img.onload = function () {
        fn.call(null, MagicEye.utils.depthMapFromImg(img));
      };
      img.src = src;
    },

    depthMapFromImg: function (img) {
      // not async, assumes img is already loaded
      var canvas = document.createElement('canvas'),
          context = canvas.getContext("2d");
      canvas.width = img.width;
      canvas.height = img.height;
      context.drawImage(img, 0, 0, canvas.width, canvas.height);
      return MagicEye.utils.depthMapFromCanvas(canvas);
    },

    depthMapFromCanvas: function (canvas) {
      var x, y, row, offset,
          context = canvas.getContext("2d"),
          depthMap = [],
          width = canvas.width,
          height = canvas.height,
          pixelData = context.getImageData(0, 0, width, height).data;
      for (y = 0; y < height; y++) {
        row = [];
        offset = width * y * 4;
        for (x = 0; x < width; x++) {
          // assume grayscale (R, G, and B are equal)
          row.push(pixelData[offset + (x * 4)]);
        }
        depthMap.push(row);
      }
      return depthMap;
    },

    randomRGBa: function () {
      return [Math.floor(Math.random() * 256),
              Math.floor(Math.random() * 256),
              Math.floor(Math.random() * 256),
              255];
    },

    randomPalette: function (numColors) {
      numColors = numColors || Math.ceil((Math.random() * 9) + 1); // 2 - 10
      var palette = [];
      for (var i = 0; i < numColors; i++) {
        palette.push(MagicEye.utils.randomRGBa());
      }
      return palette;
    }

  };

})();
