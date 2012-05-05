/*
 * Copyright (C) 2012 Ian Pearce (ian@ianpearce.org)
 * http://github.com/peeinears/
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 *
 */

function MagicEye(opts) {

  var self = this;

  function init(opts) {
    if (!opts) opts = {};
    self.el = opts.el;
    self.width = opts.width || 400;
    self.height = opts.height || 300;
    self.numColors  = opts.numColors || 10;
    self.palette = opts.palette || generatePalette(self.numColors);
    self.depthMap = opts.depthMap || '0';
    self.adaptToElementSize = opts.adaptToElementSize || false;
  }

  function randomRGB() {
    return [Math.floor(Math.random() * 256),
            Math.floor(Math.random() * 256),
            Math.floor(Math.random() * 256)];
  }

  function generatePalette(numColors) {
    var palette = [];
    for (var i = 0; i < numColors; i++) {
      palette.push(randomRGB());
    }
    return palette;
  }

  function generatePixelData(width, height, depthMap, numColors) {

    /*
     * This algorithm was published in a paper authored by by Harold W.
     * Thimbleby, Stuart Inglis, and Ian H. Witten. The following code was
     * translated from the C code that was featured in the article.
     * http://www.cs.sfu.ca/CourseCentral/414/li/material/refs/SIRDS-Computer-94.pdf
     */

    var x, y, left, right, visible, t, zt, k, sep, z,
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
  }

  function formatDepthMap(width, height, template) {

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
  }


  // instance methods

  this.renderBMP = function (img) {
    // render Base64 encoded BMP to <img> with bmp_lib
    if (!bmp_lib || !bmp_lib.render) {
      throw('Stereogram.render: bmp_lib object not found');
    }
    this.setupRender(img);
    bmp_lib.render(img, this.pixels, this.palette);
    return this;
  };

  this.renderToCanvas = function (canvas) {
    this.setupRender(canvas);
    var x, y, rgb, yOffset, xOffset,
        context = canvas.getContext("2d"),
        imageData = context.createImageData(this.width, this.height);

    for (y = 0; y < this.height; y++) {
      yOffset = y * this.width * 4;
      for (x = 0; x < this.width; x++) {
        rgb = this.palette[this.pixels[y][x]];
        xOffset = x * 4;
        imageData.data[yOffset + xOffset] = rgb[0];
        imageData.data[yOffset + xOffset + 1] = rgb[1];
        imageData.data[yOffset + xOffset + 2] = rgb[2];
        imageData.data[yOffset + xOffset + 3] = 255;
      }
    }
    context.putImageData(imageData, 0, 0);
    return this;
  };

  this.regeneratePalette = function (numColors) {
    this.numColors = numColors || this.numColors;
    this.palette = generatePalette(this.numColors);
    return this;
  };

  this.setupRender = function (element) {

    // set size and generate depth map and pixel data

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

    // generate properly formatted depth map from template
    this.rawDepthMap = formatDepthMap(this.width, this.height, this.depthMap);

    // generate the pixel data for the stereogram
    this.pixels = generatePixelData(this.width, this.height, this.rawDepthMap, this.numColors);

    return this;
  };

  this.render = function () {
    var element = (typeof this.el === 'string' ? document.getElementById(this.el) : this.el);

    if (!element || !element.tagName) {
      throw('Stereogram.render: invalid element: ' + element);
    }

    if (element.tagName.toLowerCase() === 'img') {
      this.renderBMP(element);
    } else if (element.tagName.toLowerCase() === 'canvas') {
      this.renderToCanvas(element);
    } else {
      throw("Stereogram.render: invalid element, can only render to <img> or <canvas>");
    }

    return this;
  };

  init(opts);

  return this;
}
