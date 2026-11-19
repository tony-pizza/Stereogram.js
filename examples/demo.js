// Shared helpers for the animated examples (crawl.html, movie.html)
var Demo = {

  palettes: {
    bw: ['#ffffff', '#000000'],
    gold: ['#000000', '#f2c230', '#7a5c00'],
    rainbow: ['#00ff00', '#0000ff', '#ff0000', '#ffff00', '#ff00ff', '#00ffff'],
    ocean: ['#03045e', '#0077b6', '#00b4d8', '#90e0ef', '#caf0f8']
  },

  // Wires the common controls (play/pause, stable pattern, depth map, colors,
  // stats) to an animation. Any control missing from the page is skipped.
  bindControls: function (animation, ids) {
    var $ = function (id) { return id && document.getElementById(id); },
        playButton = $(ids.play),
        stable = $(ids.stable),
        depthMap = $(ids.depthMap),
        palette = $(ids.palette),
        stats = $(ids.stats),
        frames = 0,
        renderTotal = 0,
        windowStart = Date.now();

    function updatePlayButton() {
      if (playButton) playButton.textContent = animation.playing ? 'Pause' : 'Play';
    }

    // redraw the current moment when something changes while paused
    function redrawIfPaused() {
      if (!animation.playing) animation.renderFrame(0);
    }

    if (playButton) {
      playButton.addEventListener('click', function () {
        animation.toggle();
        updatePlayButton();
        if (ids.onToggle) ids.onToggle(animation.playing);
      });
    }

    if (stable) {
      animation.stablePattern = stable.checked;
      stable.addEventListener('change', function () {
        animation.stablePattern = stable.checked;
        redrawIfPaused();
      });
    }

    if (depthMap) {
      animation.showDepthMap = depthMap.checked;
      depthMap.addEventListener('change', function () {
        animation.showDepthMap = depthMap.checked;
        redrawIfPaused();
      });
    }

    if (palette) {
      animation.setColors(Demo.palettes[palette.value]);
      palette.addEventListener('change', function () {
        animation.setColors(Demo.palettes[palette.value]);
        redrawIfPaused();
      });
    }

    var previousOnFrame = animation.onFrame;
    animation.onFrame = function (info) {
      if (previousOnFrame) previousOnFrame(info);
      if (!stats) return;
      frames++;
      renderTotal += info.renderTime;
      var elapsed = Date.now() - windowStart;
      if (elapsed >= 1000) {
        stats.textContent = Math.round(frames * 1000 / elapsed) + ' fps · ' +
          Math.round(renderTotal / frames) + ' ms/frame';
        frames = 0;
        renderTotal = 0;
        windowStart = Date.now();
      }
    };

    // space bar toggles play/pause (unless typing)
    document.addEventListener('keydown', function (e) {
      var tag = e.target.tagName;
      if (e.key !== ' ' || tag === 'TEXTAREA' || tag === 'INPUT' || tag === 'SELECT' || tag === 'BUTTON') return;
      e.preventDefault();
      if (playButton) playButton.click();
    });

    updatePlayButton();
    return { updatePlayButton: updatePlayButton };
  }

};
