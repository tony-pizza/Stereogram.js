/*
 * Converts depth maps of various formats into the format
 * readable by `generatePixelData()`.
 *
 * These all return the same depth map:
 *
 * var template = ["   ",
 *                 " # ",
 *                 "   "];
 *
 * var template = ["000",
 *                 "010",
 *                 "000"];
 *
 * var template = "   \n # \n   ";
 *
 * var template = "000\n010\n000";
 *
 * var template = [[0, 0, 0],
 *                 [0, 1, 0],
 *                 [0, 0, 0]];
 *
 * Of course, you can have varying depths:
 *
 * var template = ["001",
 *                 "012",
 *                 "123"];
 *
 * var template = [[0.0, 0.0, 0.3],
 *                 [0.0, 0.3, 0.6],
 *                 [0.3, 0.6, 0.9]];
 *
 */

MagicEye.TemplateDepthMapper = MagicEye.DepthMapper.extend({

  constructor: function (template) {
    this.template = template;
  },

  make: function () {

    var x, y, highest, templateY,
        template = this.template,
        templateWidth = 0,
        depthMap = [];

    // '   \n # \n   ' --> ['   ', ' # ', '   ']
    if (typeof template === 'string') {
      template = template.split(/\n/);
    }

    if (typeof template === 'object' && template.hasOwnProperty(0)) {

      // ['   ', ' # ', '   '] --> [[0, 0, 0], [0, 1, 0], [0, 0, 0]]
      if (typeof template[0] === 'string') {

        for (y = 0; y < template.length; y++) {
          template[y] = template[y].replace(/ /g, '0'); // replace spaces with 0
          template[y] = template[y].replace(/[^\d\n]/g, '1'); // replace non-digits with 1
          template[y] = template[y].split(''); // turn '010' into ['0', '1', '0']

          // turn ['0', '1', '0'] into [0, 1, 0]
          for (x = 0; x < template[y].length; x++) {
            template[y][x] = parseInt(template[y][x]);
          }
        }

      }

      if (typeof template[0] === 'object') {

        // get template width and highest level
        highest = 0;
        for (y = 0; y < template.length; y++) {
          if (template[y].length > templateWidth) {
            templateWidth = template[y].length;
          }
          for (x = 0; x < template[y].length; x++) {
            if (template[y][x] > highest) {
              highest = template[y][x];
            }
          }
        }

        // scale levels down to fractions and add zeros for rows of length less than template width
        for (y = 0; y < template.length; y++) {
          for (x = 0; x < templateWidth; x++) {
            if (typeof template[y][x] === 'undefined') {
              template[y][x] = 0;
            } else {
              template[y][x] = template[y][x] / highest;
            }
          }
        }

      } else {
        throw('MagicEye: invalid depth map template format');
      }
    } else {
      throw('MagicEye: invalid depth map template format');
    }

    return template;
  },

});
