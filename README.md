MagicEye.js
===========

MagicEye.js is a JavaScript library for generating "Magic Eye" images (technically single image random dot stereograms, or SIRDS) in the browser.

https://github.com/peeinears/MagicEye.js
  
## Usage

Require `magiceye.js` and also a `DepthMapper`. Here we're using the `TextDepthMapper`, which generates depth maps of given text. (More on `DepthMapper`s below.)

```html
<script src="magiceye.js" type="text/javascript"></script>
<script src="TextDepthMapper.js" type="text/javascript"></script>
```

Put an `<img>` or `<canvas>` on the page. Give it an `id` and set a `height` and `width`. Note: `<img>`s should always have a `src` attribute, even if it's empty.

```html
<img id="magic-eye" width="500" height="400" src />
```

Tell `MagicEye` to generate a magic eye based on the depth map created by `TextDepthMapper` and render it to your `<img>`.

```javascript
MagicEye.render({
  el: 'magic-eye',
  depthMapper: new MagicEye.TextDepthMapper("Hello World")
});
```

#### All together now...

```html
<script src="magiceye.js" type="text/javascript"></script>
<script src="TextDepthMapper.js" type="text/javascript"></script>

<img id="magic-eye" width="500" height="400" src />

<script>
MagicEye.render({
  el: 'magic-eye',
  depthMapper: new MagicEye.TextDepthMapper("Hello World")
});
</script>
```

## Depth Maps

To achieve the 3D illusion, [depth maps](http://en.wikipedia.org/wiki/Depth_map) tell `MagicEye` what parts should appear closer and what parts should appear farther away. `MagicEye` understands depth maps represtented as two-dimensional arrays where each nested array represents a horizontal row of points (or pixels) in the final image. Each element in the nested arrays is a float between 0.0 and 1.0 that describes the closeness of that point, where 1 is the closest and 0 is the farthest. For example:

    [[0.0, 0.0, 0.0], //
     [0.0, 1.0, 0.0], // a centered floating square
     [0.0, 0.0, 0.0]] //
     
If you have a depth map of the correct size, you can pass it directly to via `MagicEye.render()`s `depthMap` option. That route is uncommon, though, because depth maps are a pain to write by hand. This is where _DepthMappers_ come in handy.

## DepthMappers

DepthMappers are tools for generating depth maps sized and formatted for `MagicEye`.

### TemplateDepthMapper

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

