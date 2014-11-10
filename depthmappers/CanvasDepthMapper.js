//
// Parses a <canvas>'s pixel data and generates a depth map
//
MagicEye.CanvasDepthMapper = MagicEye.DepthMapper.extend({

  constructor: function (canvas) {
    this.canvas = canvas;
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
        depthMap[y][x] = pixelData[offset + (x * 4)];
      }
    }
    return depthMap;
  }

});
