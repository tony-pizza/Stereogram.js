MagicEye.js
===========

## Description

A JavaScript library for generating single image random dot stereograms
(SIRDS) AKA Autostereograms AKA those &quot;Magic Eye&quot; things in
the browser (with or without `<canvas>`).
https://github.com/peeinears/MagicEye.js

## Usage

### Setup

#### Render pixel data to `<canvas>`

Create a `<canvas>` with a width and height:

    <canvas id="magic-eye" width="500" height="400"></canvas>

#### Render as Base64 encoded BMP to `<img>`

__Note:__ Requires Neil Fraser's bmp_lib
(http://neil.fraser.name/software/bmp_lib/). Included in this repo at
lib/bmp_lib.js.

Create an `<img>` with a width and height:

    <img id="magic-eye" width="500" height="400" />

### Basic Usage

__Note:__ The following don't set depth maps, so they will be quite
uninteresting.

Create and render a new `MagicEye` object:

    var magicEye = new MagicEye();
    magicEye.el = "magic-eye";
    magicEye.width = 500;
    magicEye.height = 400;
    magicEye.render();

One-line it:

    var magicEye = new MagicEye({ el: "magic-eye", width: 500, height: 400 }).render();

Pass in the element itself:

    var canvas = document.getElementById("magic-eye");
    var magicEye = new MagicEye({ el: canvas, width: 500, height: 400 });
    magicEye.render();
    
Inherit height and width from element:

    var magicEye = new MagicEye({ el: "magic-eye", adaptToElementSize: true });
    magicEye.render();
    
### Depth Maps

MagicEye understands a couple different depth map formats. It also
resizes depth maps to the width and height of your MagicEye. The idea
here is to make it easy to write your own depth maps and try them out.

#### Formats

These each create a floating box at the center of the `MagicEye`:

    var myDepthMap = ["   ",
                      " # ",
                      "   "];

    var myDepthMap = ["000",
                      "010",
                      "000"];

    var myDepthMap = "   \n # \n   ";

    var myDepthMap = "000\n010\n000";

    var myDepthMap = [[0, 0, 0],
                      [0, 1, 0],
                      [0, 0, 0]];

Of course, you can have varying depths:

    var myDepthMap = ["001",
                      "012",
                      "123"];

    var myDepthMap = [[0.0, 0.0, 0.3],
                      [0.0, 0.3, 0.6],
                      [0.3, 0.6, 0.9]];

#### Setting Depth Maps

    var magicEye = new MagicEye({ el: "magic-eye", depthMap: myDepthMap });

or:

    magicEye.depthMap = myDepthMap;

### Other Options

    var magicEye = new MagicEye({
      el: "magic-eye",            // no default
      width: 500,                 // defaults to 400
      height: 400,                // defaults to 300
      adaptToElementSize: true,   // defaults to false
      depthMap: "01\n10",         // defaults to '0' (blank)
      numColors: 5,               // defaults to 10
      palette: [ [255, 0, 0, 125],     // set pixel colors
                 [0, 255, 0, 255],     // 2-d array of RGBa vals
                 [0, 0, 255, 125] ]    // generated randomly by default
    });


### Other Methods

Generate a new random palette for an existing MagicEye:

    magicEye.regeneratePalette();

Render to an element that isn't `this.el`:

    var canvas = document.getElementById("other-canvas");
    magicEye.renderToCanvas(canvas);

    var img = document.getElementById("other-img");
    magicEye.renderBMP(img);

### Algorithm

The main stereogram-generating algorithm was very closely adapted from
an algorithm (written in C) that was featured in an article published in
IEEE in 1994. The authors explain the algorithm in detail.

#### Reference

Harold W. Thimbleby, Stuart Inglis, Ian H. Witten: Displaying 3D Images:
Algorithms for Single Image Random-Dot Stereograms. *IEEE Journal
Computer*, October 1994, S. 38 - 48.

### Links

 * [SIRDS on Wikipedia](http://en.wikipedia.org/wiki/Autostereogram#Random-dot)
 * [Depth maps on Wikipedia](http://en.wikipedia.org/wiki/Depth_map)
 * [PDF of paper with C algorithm](http://www.cs.sfu.ca/CourseCentral/414/li/material/refs/SIRDS-Computer-94.pdf)
 * [Another JS autostereogram library!](https://github.com/dgtized/autostereogram/)
 * [Neil Fraser's BMP
   Library](http://neil.fraser.name/software/bmp_lib/)

__Note:__ Code here is in no way affiliated with Magic Eye Inc. I just
liked the name.

