Stereogram.js
===========

Stereogram.js is a JavaScript library for generating stereogram images (technically, [SIRDS](http://en.wikipedia.org/wiki/Autostereogram#Random-dot)) in the browser. Stereograms were popularized in books by [Magic Eye&trade;](https://www.magiceye.com/).

View the demo: [https://tony-pizza.github.io/Stereogram.js](http://tony-pizza.github.io/Stereogram.js/)

Or check out these other demos:
 - [Text to Stereogram](http://tony-pizza.github.io/Stereogram.js/text-to-stereogram.html)
 - [JPG to Stereogram](http://tony-pizza.github.io/Stereogram.js/jpg-to-stereogram.html)
  
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
