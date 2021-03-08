/**
 * Text Node Generator
 * 
 * A util collection for layout text and generate drawable objects.
 * 
 * Zhongdong Yang (zhongdong_y@outlook.com)
 * March 8, 2021
 */
import * as _ from 'lodash';
import { BrainMaps, Drawable } from "./brainmaps";
import { CenterAnchorShapes } from "./shapes";

/**
 * Try to layout text content and return the bounding box along with possible 
 * line breaks.
 * @param text The text content to render
 * @param textOptions Text layout options, e.g. font size, font family.
 * @returns size {width, height} and lines. `lines` specifices the line breaks.
 */
function layoutText(text: string, textOptions: TextOptions): {
  size: {
    width: number,
    height: number
  },
  lines: string[]
} {
  const tryLayout = (str: string) => {
    let _temp_div = document.createElement('div');
    // _temp_div.style.visibility = 'visible';
    _temp_div.style.visibility = 'hidden';
    _temp_div.style.position = 'fixed';
    _temp_div.style.display = 'block';
    _temp_div.style.left = '0';
    _temp_div.style.top = '0';
    _temp_div.style.fontFamily = textOptions.textFont;
    _temp_div.style.fontSize = `${textOptions.textSize}px`;
    _temp_div.style.lineHeight = '1.5'
    _temp_div.textContent = str;
    document.body.appendChild(_temp_div);
    let size = {
      width: _temp_div.clientWidth,
      height: _temp_div.clientHeight
    };
    document.body.removeChild(_temp_div);
    return size;
  }
  if (textOptions.textMaxWidth <= 0) {
    // No limit to line line width
    return {
      size: tryLayout(text),
      lines: [text]
    };
  } else {
    // Limit exists, will break lines
    try {
      let text_groups = text.match(/([a-z!,.'"?()]+\s?)|([^a-z\s])/gi);
      let _temp_text = text_groups.slice();
      let _cnpunc_array: string[] = [];
      for (let i = 0; i < _temp_text.length; i++) {
        if (i > 0 && "，。！；？“”：（）".split('').includes(_temp_text[i])) {
          _cnpunc_array[_cnpunc_array.length - 1] = _cnpunc_array[_cnpunc_array.length - 1] + _temp_text[i];
        }
        else {
          _cnpunc_array.push(_temp_text[i]);
        }
      }
      _temp_text = _cnpunc_array;
      let lines = [''];
      let line_pointer = '';
      let _maxWidth = 0;
      while (_temp_text.length > 0) {
        let next_word = _temp_text.slice(0, 1);
        let _size = tryLayout((line_pointer + next_word).trim());
        if (_size.width <= textOptions.textMaxWidth) {
          line_pointer = line_pointer + next_word;
          lines[lines.length - 1] = line_pointer;
          _temp_text.splice(0, 1);
          _maxWidth = Math.max(_size.width, _maxWidth);
        } else if (lines[lines.length - 1].length !== 0) {
          lines[lines.length - 1] = lines[lines.length - 1].trim();
          lines.push('');
          line_pointer = '';
        }
      }
      return {
        size: {
          width: Math.min(_maxWidth, textOptions.textMaxWidth),
          height: lines.length * textOptions.textSize + (lines.length - 1) * 0.25 * textOptions.textSize
        },
        lines: lines
      }
    } catch (e) {
      throw new Error(`Unable to parse text: ${e}`);
    }
  }
}
interface TextOptions {
  textAlign?: string,
  textSize?: number,
  textColor?: string,
  textFont?: string,
  textMaxWidth?: number
}

/**
 * Create a drawable object with some text.
 * 
 * Draw a one line or multi-line text in a node. If you specify `textMaxWidth` 
 * in textOptions, the text will be broken into multiple lines if exceeds the 
 * maximum length limit.
 * 
 * **Note**: The anchor should be the center point of a container node.
 * @param text The text content to draw in a textnode.
 * @param x Anchor position (X) in px.
 * @param y Anchor position (Y) in px.
 * @param textOptions An object that contains text style or layout limits 
 * @returns Drawable object
 */
function textNode(
  text: string,
  x: number,
  y: number,
  {
    textAlign = 'center',
    textSize = 14,
    textColor = '#000000',
    textFont = 'Arial',
    textMaxWidth = 100
  }: TextOptions,
  nodeType?: 'rectangle' | 'circle'
): Drawable {
  let textOptions: TextOptions = _.merge({}, {
    textAlign: 'center',
    textSize: 14,
    textColor: '#000000',
    textFont: 'Arial',
    textMaxWidth: 100
  }, {
    textAlign,
    textSize,
    textColor,
    textFont,
    textMaxWidth
  })

  let { size, lines } = layoutText(text, textOptions);


  let node = CenterAnchorShapes.roundedRectangle(
    x,
    y,
    Math.max(size.width + 16, Math.min(size.width * 1.5, size.width + 32)),
    Math.max(size.height + 8, Math.min(size.height * 1.5, size.height + 32)),
    8
  );
  let textNodeObject = BrainMaps.createObject(
    '#textnode',
    node,
    {
      lineWidth: 2,
      strokeStyle: "#000000",
      fillStyle: "#f44336"
    },
    true
  );
  textNodeObject.drawText = (context) => {
    context.textAlign = textOptions.textAlign as CanvasTextAlign;
    context.font = `${textOptions.textSize * BrainMaps.DPI}px ${textOptions.textFont}`;
    context.fillStyle = textOptions.textColor;
    context.textBaseline = 'middle';
    let posX = 0;
    let posY = y;
    switch (textOptions.textAlign) {
      case 'left': {
        posX = x - size.width / 2;
        break;
      }
      case 'right': {
        posX = x + size.width / 2;
        break;
      }
      default: {
        posX = x;
      }
    }
    if (lines.length === 1) {
      context.fillText(lines[0], posX * BrainMaps.DPI, posY * BrainMaps.DPI);
    } else {
      if (lines.length % 2 === 1) {
        lines.map((l, idx) => {
          let offsetY =
            posY -
            ((lines.length - 1) / 2 - idx) * (textOptions.textSize * 1.25);
          // 0.25 = (1.5-1) / 2 [half line spacing].
          context.fillText(l, posX * BrainMaps.DPI, offsetY * BrainMaps.DPI);
        })
      } else {
        lines.map((l, idx) => {
          let offsetY =
            posY -
            (lines.length / 2 - 0.5 - idx) * (textOptions.textSize * 1.25);
          // 0.25 = (1.5-1) / 2 [half line spacing].
          context.fillText(l, posX * BrainMaps.DPI, offsetY * BrainMaps.DPI);
        })
      }
    }
  }

  return textNodeObject;
}

export { textNode, TextOptions };