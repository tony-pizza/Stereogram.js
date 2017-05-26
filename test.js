var MagicEye = require("./magiceye.js").MagicEye;
var opts = {
  width: 128,
  height: 128,
  colors: [
    [255, 255, 255, 255],
    [0, 0, 0, 255]
  ],
	output: "test_simple",
};
MagicEye.renderToFile(opts);

require("./depthmappers/TextDepthMapper.js");
var textOpts = {
  width: 800,
  height: 600,
  colors: [
    [255, 255, 255, 255],
    [0, 0, 0, 255]
  ],
	output: "test_text",
  depthMapper: MagicEye.TextDepthMapper,
  text: "2",
};
MagicEye.renderToFile(textOpts);

console.log("No errors were thrown, but check the png output!");
