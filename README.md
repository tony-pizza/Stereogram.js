MagicEye.js
===========

## Description

A JavaScript library for generating single image random dot stereograms (those &quot;Magic Eye&quot; things) in the browser. 

## Usage

### Render pixel data to &lt;canvas&gt;

Create a &lt;canvas&gt; with a width and height:

    <canvas id="magic-eye" width="500" height="400"></canvas>

### Render as Base64 BMP to &lt;img&gt;

Create an &lt;img&gt; with a width and height:

    <img id="magic-eye" width="500" height="400" />


Create and render a new MagicEye object:

    var magicEye = new MagicEye();
    magicEye.el = "magic-eye";
    magicEye.width = 500;
    magicEye.height = 400;
    magicEye.render();

One-line it:

    var magicEye = new MagicEye({ el: "magic-eye", width: 500, height: 400 }).render();

Pass in the element itself:

    var canvas = document.getElementById("magic-eye");
    var magicEye = new MagicEye({ el: canvas, width: 500, height: 400 }).render();
    
Inherit height and width from element:

    var magicEye = new MagicEye({ el: "magic-eye", adaptToElementSize: true }).render();
    

