//
// Parses a <canvas>'s pixel data and generates a depth map
//
MagicEye.CanvasDepthMapper = MagicEye.DepthMapper.extend({

  constructor: function (canvas, opts) {
    opts = opts || {};
    this.canvas = canvas;
    this.inverted = opts.inverted !== false;
  },

  make: function () {
    var x, y, offset,
        canvas = this.canvas,
        context = canvas.getContext("2d"),
        depthMap = [],
        width = canvas.width,
        height = canvas.height,
        pixelData = context.getImageData(0, 0, width, height).data;
    for (y = 0; y < height; y++) {
      depthMap[y] = new Float32Array(width);
      offset = width * y * 4;
      for (x = 0; x < width; x++) {
        // assume grayscale (R, G, and B are equal)
        if (this.inverted) {
          depthMap[y][x] = 1 - (pixelData[offset + (x * 4)] / 255);
        } else {
          depthMap[y][x] = pixelData[offset + (x * 4)] / 255;
        }
      }
    }
    return depthMap;
  }

});
