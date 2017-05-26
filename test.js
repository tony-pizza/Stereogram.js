var MagicEye = require("./magiceye.js").MagicEye;
var opts = {
  width: 128,
  height: 128,
	output: "test_simple",
};
MagicEye.render(opts);

require("./depthmappers/TextDepthMapper.js");
var textOpts = {
  width: 800,
  height: 600,
  colors: ['0f0', '00f', 'f00', 'ff0', 'f0f', '0ff'],
	output: "test_text",
  text: "HELLO WORLD",
};
MagicEye.render(textOpts);

console.log("No errors were thrown, but check the png output!");
