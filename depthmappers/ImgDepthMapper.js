//
// Parses an <img>'s pixel data and generates a depth map
//
Stereogram.ImgDepthMapper = Stereogram.DepthMapper.extend({

  constructor: function (img) {
    this.img = img;
  },

  make: function () {

    // not async, assumes img is already loaded
    var canvas = document.createElement('canvas'),
        context = canvas.getContext("2d");
    canvas.width = this.img.width;
    canvas.height = this.img.height;
    context.drawImage(this.img, 0, 0, canvas.width, canvas.height);
    this.depthMapFromCanvas(canvas);
  },

  depthMapFromCanvas: function (canvas) {
    var x, y, offset,
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
