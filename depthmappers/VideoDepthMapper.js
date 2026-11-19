//
// Generates a depth map from the current frame of a <video> (or anything else
// you can drawImage(): <canvas>, <img>, ImageBitmap...). Use it with
// Stereogram.animate() to turn a grayscale depth-map video into a 3D movie.
// Lighter is closer, unless `inverted` is set.
//
Stereogram.VideoDepthMapper = Stereogram.DepthMapper.extend({

  autoResize: false,

  constructor: function (video, opts) {
    opts = opts || {};
    this.video = video;
    this.inverted = !!opts.inverted;
    // part of the video to use, as fractions of its size. Handy for videos
    // that show the color footage and its depth map side by side, e.g.
    // { x: 0.5, y: 0, width: 0.5, height: 1 } for the right half.
    this.region = opts.region || { x: 0, y: 0, width: 1, height: 1 };
    // scale depth values; lower it if a depth video looks too extreme
    this.strength = (opts.strength === undefined) ? 1 : opts.strength;
    this.canvas = document.createElement('canvas');
  },

  make: function (width, height) {
    var video = this.video,
        sourceWidth = video.videoWidth || video.naturalWidth || video.width,
        sourceHeight = video.videoHeight || video.naturalHeight || video.height;

    // nothing to draw yet (video still loading)
    if (!sourceWidth || !sourceHeight || (video.readyState !== undefined && video.readyState < 2)) {
      return null;
    }

    var canvas = this.canvas, context, region = this.region,
        sx = region.x * sourceWidth,
        sy = region.y * sourceHeight,
        sw = region.width * sourceWidth,
        sh = region.height * sourceHeight,
        // fit inside the stereogram, keeping the aspect ratio
        scale = Math.min(width / sw, height / sh),
        dw = sw * scale,
        dh = sh * scale;

    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
      this._context = null;
    }
    context = this._context || (this._context = canvas.getContext('2d', { willReadFrequently: true }));

    // letterbox bars sit at the far plane
    context.fillStyle = this.inverted ? '#fff' : '#000';
    context.fillRect(0, 0, width, height);
    context.drawImage(video, sx, sy, sw, sh, (width - dw) / 2, (height - dh) / 2, dw, dh);

    var data = context.getImageData(0, 0, width, height).data,
        depthMap = this._depthMap,
        strength = this.strength / 255,
        x, y, i, row, v;

    if (!depthMap || depthMap.length !== height || depthMap[0].length !== width) {
      depthMap = this._depthMap = [];
      for (y = 0; y < height; y++) depthMap[y] = new Float32Array(width);
    }

    i = 0;
    for (y = 0; y < height; y++) {
      row = depthMap[y];
      for (x = 0; x < width; x++) {
        // luminance, so colored depth maps still roughly work
        v = (0.299 * data[i]) + (0.587 * data[i + 1]) + (0.114 * data[i + 2]);
        if (this.inverted) v = 255 - v;
        v *= strength;
        row[x] = v > 1 ? 1 : v;
        i += 4;
      }
    }

    return depthMap;
  }

});
