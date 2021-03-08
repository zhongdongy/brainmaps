
import "./style/index.sass";
import * as _ from 'lodash';
import { BrainMaps, BrainMapsPath2D, CenterAnchorShapes, Drawable, textNode } from "./libs";

const BRAINMAPS = document.querySelector('#brainmaps') as HTMLCanvasElement;

const bm = new BrainMaps(BRAINMAPS);

let testOBJ = textNode("Hello World! 万骏不承认他比我月半，可是我的确比他瘦", 400, 400, {
  textColor: '#FFFFFF',
  textSize: 24,
  textAlign: 'left',
  textMaxWidth: 300
});


testOBJ.onHover = (obj) => {
  obj.lineWidth = 4;
  bm.draw()
};
testOBJ.onMouseLeave = (obj) => {
  obj.lineWidth = 2;
  bm.draw();
}
bm.addObject(testOBJ);
bm.draw();