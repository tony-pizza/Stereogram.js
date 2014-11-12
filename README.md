MagicEye.js
===========

## Description

MagicEye.js is a JavaScript library for generating "Magic Eye" images (technically single image random dot stereograms, or SIRDS) in the browser.

https://github.com/peeinears/MagicEye.js
  
## Usage

Put an `<img>` or `<canvas>` on the page.

```html
<img id="magic-eye" width="500" height="400" src />
```

This example uses the _TemplateDepthMapper_, which lets you generate full-scale depth maps out of small templates. More on depth maps and _DepthMappers_ below.

```html
<!-- Include magiceye.js -->
<script src="magiceye.js" type="text/javascript"></script>

<!-- Include a DepthMapper -->
<script src="TemplateDepthMapper.js" type="text/javascript"></script>

<!-- Add an <img> to the page and give it an id, width and height -->
<!-- Note: Some browsers require a src attribute (even if it's empty) -->
<img id="magic-eye" width="500" height="400" src />

<script type="text/javascript">

  // Create a depth map template
  // (This one creates a centered hovering rectangle)
  var depthMap = ['   ',
                  ' # ',
                  '   '];
  
  // Tell MagicEye to use your depth map template and render to your <img>
  MagicEye.render({
    el: 'magic-eye',
    depthMapper: new MagicEye.TemplateDepthMapper(depthMap)
  });
</script>
```
    
### _TemplateDepthMapper_

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

