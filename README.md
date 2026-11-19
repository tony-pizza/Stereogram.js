Stereogram.js
===========

Stereogram.js is a JavaScript library for generating stereogram images (technically, [SIRDS](http://en.wikipedia.org/wiki/Autostereogram#Random-dot)) in the browser. Stereograms were popularized in books by [Magic Eye&trade;](https://www.magiceye.com/).

View the demo: [https://tony-pizza.github.io/Stereogram.js](http://tony-pizza.github.io/Stereogram.js/)

Or check out these other demos:
 - [Text to Stereogram](http://tony-pizza.github.io/Stereogram.js/text-to-stereogram.html)
 - [JPG to Stereogram](http://tony-pizza.github.io/Stereogram.js/jpg-to-stereogram.html)
 - [Stereogram Text Crawl](https://tony-pizza.github.io/Stereogram.js/examples/crawl.html): any amount of text crawling up the screen in a moving stereogram, with embed code for your own page
 - [Stereogram Movies](https://tony-pizza.github.io/Stereogram.js/examples/movie.html): animated depth maps played as 3D movies, including your own depth-map videos

To run the examples locally, serve the repo folder (e.g. `python3 -m http.server`) and open `examples/crawl.html` or `examples/movie.html`.
  
## Usage

Require `stereogram.js` and also a `DepthMapper`. Here we're using the `TextDepthMapper`, which generates depth maps of given text. (More on `DepthMapper`s below.)

```html
<script src="stereogram.js" type="text/javascript"></script>
<script src="TextDepthMapper.js" type="text/javascript"></script>
```

Put an `<img>` or `<canvas>` on the page. Give it an `id` and set a `height` and `width`. Note: `<img>`s should always have a `src` attribute, even if it's empty.

```html
<img id="stereogram" width="500" height="400" src />
```

Tell `Stereogram` to generate a stereogram based on the depth map created by `TextDepthMapper` and render it to your `<img>`.

```javascript
Stereogram.render({
  el: 'stereogram',
  depthMapper: new Stereogram.TextDepthMapper("Hello World")
});
```

#### All together now...

```html
<script src="stereogram.js" type="text/javascript"></script>
<script src="TextDepthMapper.js" type="text/javascript"></script>

<img id="stereogram" width="500" height="400" src />

<script>
Stereogram.render({
  el: 'stereogram',
  depthMapper: new Stereogram.TextDepthMapper("Hello World")
});
</script>
```

## Animation

`Stereogram.animate()` plays a moving stereogram on a `<canvas>`. Every frame it asks the depth mapper for a new depth map, passing a third `frame` argument (`{ index, time, delta }`, times in seconds) so the depth mapper can move things along.

```html
<script src="stereogram.js"></script>
<script src="TextCrawlDepthMapper.js"></script>

<canvas id="stereogram" width="800" height="600"></canvas>

<script>
var animation = Stereogram.animate({
  el: 'stereogram',
  depthMapper: new Stereogram.TextCrawlDepthMapper('A long text...'),
  stablePattern: true
});
</script>
```

Options:

| Option | Default | |
| --- | --- | --- |
| `el` | | A `<canvas>` or its `id` (animations can't render to `<img>`s) |
| `depthMapper` | | Any DepthMapper. Its `make(width, height, frame)` is called for every frame |
| `stablePattern` | `true` | `true` keeps the dot pattern still from frame to frame, changing only the dots that the new depth requires. `false` makes every frame brand new random static |
| `colors` | black & white | Same as `render()` |
| `fps` | `30` | Maximum frames per second (`0` for every display frame) |
| `showDepthMap` | `false` | Draw the raw depth map in grayscale instead of the stereogram |
| `autoplay` | `true` | Start playing right away |
| `onFrame` | | Called after each frame with `{ index, time, delta, renderTime }` |

`stablePattern`, `showDepthMap` and `fps` can be changed at any time by setting them on the animation. It also has these methods: `play()`, `pause()`, `toggle()`, `renderFrame(delta)` (draws one frame now, which is handy while paused), `setColors(colors)`, `setDepthMapper(depthMapper)` and `resetPattern()` (starts the next frame from fresh random dots).

#### How the stable pattern works

In a random-dot stereogram, the depth map links pixels together: linked pixels must be the same color, and everything else is random. With `stablePattern` on, each group of linked pixels takes the color most of its pixels already had in the previous frame. A still scene doesn't change at all, and a moving one changes only where the depth forces it to. In the text crawl demo that's about 1% of the dots per frame, against 50 to 80% for random static (depending on how many colors you use). With it off, every frame is new random static, and the image only exists in 3D.

You can use the same thing without `animate()` by passing `previous` (the last frame's color indices) and `indices` (a `Uint8Array(width * height)` to fill) to `Stereogram.generatePixelData()`.

## Depth Maps

To achieve the 3D illusion, [depth maps](http://en.wikipedia.org/wiki/Depth_map) tell `Stereogram` what parts should appear closer and what parts should appear farther away. `Stereogram` understands depth maps represtented as two-dimensional arrays where each nested array represents a horizontal row of points (or pixels) in the final image. Each element in the nested arrays is a float between 0.0 and 1.0 that describes the closeness of that point, where 1 is the closest and 0 is the farthest. For example:

    [[0.0, 0.0, 0.0], //
     [0.0, 1.0, 0.0], // a centered floating square
     [0.0, 0.0, 0.0]] //
     
If you have a depth map of the correct size, you can pass it in directly via `Stereogram.render()`s `depthMap` option. That route is uncommon, though, because depth maps are a pain to write by hand. This is where _DepthMappers_ come in handy.

## DepthMappers

DepthMappers are tools for easily generating depth maps sized and formatted for `Stereogram`. For example, the TextDepthMapper generates a depth map where a given string of text appears hovering above the background, centered and sized to fit the image.

Call `generate(width, height)` on an instance of DepthMapper to manually generate a depth map.

```javascript
var depthMapper = new Stereogram.DepthMapper(...);
var depthMap = depthMapper.generate(500, 400);
```

### Included DepthMappers

The following DepthMappers are included in this project in the `depthmappers/` directory.

#### TextDepthMapper

Generate depth maps of text. The text will appear hovering above the background, centered and sized to fit the image. The shorter the text the bigger and thus more legible.

```javascript
new TextDepthMapper("Hello!");
```

#### CanvasDepthMapper

Generate depth maps by parsing pixel values in a `<canvas>`. See `examples/paint.html`.

```html
<canvas id="my-canvas" width="500" height="400"></canvas>
<script>
var canvas = document.getElementById('my-canvas');
new CanvasDepthMapper(canvas);
<script>
```

#### ImgDepthMapper

Generate depth maps by parsing pixel values of an `<img>`. This basically let's you convert a black and white depth map image to a depth map for `Stereogram`.

```html
<img id="my-img" src="depthmap.jpg" />
<script>
var img = document.getElementById('my-img');
new ImgDepthMapper(img);
<script>
```

#### TextCrawlDepthMapper

Text crawling up and away into the distance on a tilted plane, like a movie's opening crawl. It takes any amount of text, renders lines only as they come into view, and loops when it's done. Words are never broken: a word too wide for the screen gets a line of its own that runs past the edges. Lines are centered by default; with `textAlign: 'justify'`, one-line and ALL-CAPS paragraphs are still centered as titles. Use it with `Stereogram.animate()`, or set `position` yourself and call `render()`.

```javascript
var crawl = new Stereogram.TextCrawlDepthMapper(longText, {
  speed: 40,          // pixels per second
  fontSize: null,     // default: width / 7
  textAlign: 'center', // or 'justify', 'left', 'right'
  angle: 0.3,         // 0: scrolls straight up at full size, 1: recedes steeply
  textDepth: 0.85,    // how far the letters stand out (0 to 1)
  planeDepth: 0.15,   // depth of the background plane at the bottom (0 for flat)
  loop: true
});
crawl.setText('Something else');
crawl.restart();
crawl.speed = 80;
```

See the top of `depthmappers/TextCrawlDepthMapper.js` for every option (padding, tilt, fadeTop...).

#### VideoDepthMapper

Generate depth maps from the current frame of a `<video>` (or anything else you can `drawImage()`). With `Stereogram.animate()`, it turns a grayscale depth-map video (white is near) into a 3D movie. See `examples/movie.html`.

```javascript
var video = document.getElementById('my-depth-video');
video.play();
Stereogram.animate({
  el: 'stereogram',
  depthMapper: new Stereogram.VideoDepthMapper(video, {
    inverted: false,  // true if dark means near
    region: { x: 0.5, y: 0, width: 0.5, height: 1 } // optional: just the right half
  })
});
```

#### TemplateDepthMapper

Generate full-scale depth maps from smaller hand-made templates.

##### Formats

These each create a floating box at the center of the `Stereogram`:

```javascript
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
```

Of course, you can have varying depths:

```javascript
var myDepthMap = ["001",
                  "012",
                  "123"];

var myDepthMap = [[0.0, 0.0, 0.3],
                  [0.0, 0.3, 0.6],
                  [0.3, 0.6, 0.9]];
```

##### Example

```javascript
myStereogram.depthMap = [
  "                                 ",
  "                                 ",
  "                                 ",
  "                                 ",
  "      # # ### #   #   ### #      ",
  "      # # #   #   #   # # #      ",
  "      ### ### #   #   # # #      ",
  "      # # #   #   #   # #        ",
  "      # # ### ### ### ### #      ",
  "                                 ",
  "                                 ",
  "                                 ",
  "                                 "
];
```

### Creating your own DepthMappers

Extend depth mapper and define your own `constructor()` and `make()` methods.

```javascript
var MyDepthMapper = Stereogram.DepthMapper.extend({

  // If true or left out your DepthMapper will automatically resize
  //  the depth map generated in `make()` to the correct dimensions.
  autoResize: false, // default: true

  constructor: function (...) {
    // If your constructor takes arguments, you should set them on
    //  `this` so you can access them in `make()`.
    // e.g. this.someSetting = someArgument;
  },

  // The `make()` method actually generates and returns the depth map
  make: function (width, height) {
    // code to build a depth map
    return depthMap; // a nested array of floats between 0 and 1
  }

});
```

Use it!

```javascript
Stereogram.render({ el: 'my-stereogram', depthMapper: new MyDepthMapper(...) });
```

To animate, use the third argument to `make()`. It's only passed by `Stereogram.animate()`, so check for it. `examples/scenes.js` has a few animated depth mappers to borrow from.

```javascript
var Pulse = Stereogram.DepthMapper.extend({
  constructor: function () { this.time = 0; },
  make: function (width, height, frame) {
    if (frame) this.time += frame.delta;
    var depth = 0.5 + 0.4 * Math.sin(this.time * 3);
    return [[0, 0, 0], [0, depth, 0], [0, 0, 0]]; // a pulsing square
  }
});

Stereogram.animate({ el: 'my-canvas', depthMapper: new Pulse() });
```

`make()` can return `null` while it has nothing to show yet (e.g. a video that's still loading), and that frame is skipped.

## Other Stuff...

### Wait, what? Why?

I just thought it was cool.

### Algorithm

The main stereogram-generating algorithm was very closely adapted from
an algorithm (written in C) that was featured in an [article](http://www.cs.sfu.ca/CourseCentral/414/li/material/refs/SIRDS-Computer-94.pdf) published in
IEEE in 1994. The authors explain the algorithm in detail.

> Harold W. Thimbleby, Stuart Inglis, Ian H. Witten: Displaying 3D Images: Algorithms for Single Image Random-Dot Stereograms. *IEEE Journal Computer*, October 1994, S. 38 - 48.

### Disclaimer

This project is in no way affiliated with [Magic Eye Inc.](http://www.magiceye.com)

### Author

[Ian Pearce](http://ianpearce.org) / [@tony-pizza](https://github.com/tony-pizza)

### License

MIT
