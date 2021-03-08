/**
 * BrainMaps Core Library
 * 
 * Defines the class that is used to layout and manipulate elements in canvas.
 * Also defines event listeners that will be triggered upon user interactions.
 * 
 * Zhongdong Yang (zhongdong_y@outlook.com)
 * March 8, 2021
 */
import _ from "lodash";
import * as uuid from "uuid";

/**
 * All elements in canvas should be described by this interface.
 * The optional methods (or callbacks) are used to handle certain events.
 */
interface Drawable {
  uuid: string;
  id: string;
  path: Path2D;
  fillObject?: boolean;
  fillStyle?: string;
  strokeStyle?: string;
  lineWidth?: number;
  onHover?: (object: Drawable) => void;
  onClick?: (object: Drawable) => void;
  onMouseLeave?: (object: Drawable) => void;
  onRightClick?: (object: Drawable) => void;
  onDoubleClick?: (object: Drawable) => void;
  drawText?: (context: CanvasRenderingContext2D) => void;
}

/**
 * A common object to describe coordinates.
 */
interface Point {
  x: number;
  y: number;
}

/**
 * The BrainMaps Core library main class
 */
class BrainMaps {
  private _canvas: HTMLCanvasElement;
  private _OBJ_STACK: Array<Drawable> = new Array<Drawable>(0);

  /**
   * Returns current screen DPI.
   */
  public static get DPI() {
    return window.devicePixelRatio;
  }
  private _ctx: CanvasRenderingContext2D;

  private _objcache_last_hist: Drawable;

  private _mousemove_callbacks: Array<(obj: Drawable) => void> = new Array<(obj: Drawable) => void>(0);
  private _mouseclick_callbacks: Array<(obj: Drawable) => void> = new Array<(obj: Drawable) => void>(0);
  private _mousedoubleclick_callbacks: Array<(obj: Drawable) => void> = new Array<(obj: Drawable) => void>(0);
  private _mouserightclick_callbacks: Array<(obj: Drawable) => void> = new Array<(obj: Drawable) => void>(0);
  private _mouseleave_callbacks: Array<(obj: Drawable) => void> = new Array<(obj: Drawable) => void>(0);

  /**
   * Create a BrainMaps instance with specific canvas element
   * @param canvas The canvas element to perform content rendering.
   */
  constructor(canvas: HTMLCanvasElement) {
    this._canvas = canvas;
    this._ctx = this._canvas.getContext('2d');
    window.addEventListener('resize', (ev) => {
      this.draw();
    })
    window.addEventListener('mousemove', (ev) => {
      let mouseX = ev.offsetX;
      let mouseY = ev.offsetY;
      this._trigger_events(mouseX, mouseY, 'hover'); // If not on, will call mouseleave event.
    });
    window.addEventListener('click', (ev) => {
      let mouseX = ev.offsetX;
      let mouseY = ev.offsetY;
      this._trigger_events(mouseX, mouseY, 'click');
    });
    window.addEventListener('dblclick', (ev) => {
      let mouseX = ev.offsetX;
      let mouseY = ev.offsetY;
      this._trigger_events(mouseX, mouseY, 'doubleclick');
    });
    window.addEventListener('contextmenu', (ev) => {
      let mouseX = ev.offsetX;
      let mouseY = ev.offsetY;
      let preventDefault = this._trigger_events(mouseX, mouseY, 'rightclick');
      if (preventDefault) {
        // Avoid system context menu.
        ev.preventDefault();
        return false;
      }
    });
  }

  private _trigger_events(mouseX: number, mouseY: number, eventType: 'hover' | 'mouseleave' | 'doubleclick' | 'click' | 'rightclick') {
    let dpi = window.devicePixelRatio;
    mouseX = mouseX * dpi;
    mouseY = mouseY * dpi;

    let hit_objs: Array<Drawable> = [];
    let missed_objs: Array<Drawable> = [];
    let object_hit = false;
    this._OBJ_STACK.slice().reverse().map(obj => {
      if (object_hit === false) {
        // Can only trigger the first object that's being hit.
        if ('fillObject' in obj && obj.fillObject === true) {
          if (this._ctx.isPointInPath(obj.path, mouseX, mouseY)) {
            hit_objs.push(obj);
            object_hit = true;
            if (
              this._objcache_last_hist &&
              this._objcache_last_hist.uuid !== obj.uuid
            ) {
              missed_objs.push(this._objcache_last_hist);
            }
            this._objcache_last_hist = obj;
            return;
          }
        } else {
          if (this._ctx.isPointInStroke(obj.path, mouseX, mouseY)) {
            hit_objs.push(obj);
            object_hit = true;
            if (
              this._objcache_last_hist &&
              this._objcache_last_hist.uuid !== obj.uuid
            ) {
              missed_objs.push(this._objcache_last_hist);
            }
            this._objcache_last_hist = obj;
            return;
          }
        }
      }
      if (
        this._objcache_last_hist &&
        this._objcache_last_hist.uuid === obj.uuid
      ) {
        missed_objs.push(obj);
        this._objcache_last_hist = void 0;
      }
    });

    hit_objs.map((obj) => {
      try {
        switch (eventType) {
          case 'click': {
            if ('onClick' in obj) obj.onClick(obj);
            break;
          }
          case 'doubleclick': {
            if ('onDoubleClick' in obj) obj.onDoubleClick(obj);
            break;
          }
          case 'rightclick': {
            if ('onRightClick' in obj) obj.onRightClick(obj);
            break;
          }
          case 'hover': {
            if ('onHover' in obj) obj.onHover(obj);
            break;
          }
        }
      } catch (error) {
        console.error(`Unable to call ${eventType} listener on drawable object`, obj);
      }
    });

    missed_objs.map((obj) => {
      try {
        if ('onMouseLeave' in obj) obj.onMouseLeave(obj);
      } catch (error) {
        console.error(`Unable to call mouseleave listener on drawable object`, obj);
      }
    });


    return object_hit; // Indicates that an object is hit.
  }

  private _fixDPI() {
    let dpi = window.devicePixelRatio;
    this._canvas.setAttribute('height', `${this._canvas.clientHeight * dpi}`);
    this._canvas.setAttribute('width', `${this._canvas.clientWidth * dpi}`);
  }

  private _drawObject(object: Drawable) {
    if ('fillStyle' in object) {
      this._ctx.fillStyle = object.fillStyle;
    } else this._ctx.fillStyle = 'rgba(255, 255, 255, 1)';
    if ('strokeStyle' in object) {
      this._ctx.strokeStyle = object.strokeStyle;
    } else this._ctx.fillStyle = 'rgba(0, 0, 0, 1)';
    if ('lineWidth' in object) {
      this._ctx.lineWidth = object.lineWidth;
    } else this._ctx.lineWidth = 2;

    if ('fillObject' in object && object.fillObject === true) {
      this._ctx.fill(object.path);
    }
    this._ctx.stroke(object.path);

    // Try draw text
    if ('drawText' in object) {
      try {
        object.drawText(this._ctx);
      } catch (e) {
        console.error('Unable to draw text of object', object);
      }
    }
  }
  /**
   * Add a drawable object to stack (top).
   * 
   * **Note**: this will not call the `draw()` function implicitly, you should
   * perform a explicit function call after all object level operations.
   * @param object A drawable object
   */
  public addObject(object: Drawable) {
    if (!object) throw new Error('Drawable object required');
    this._OBJ_STACK.push(object);

    this._reload_eventlisteners();
  }

  /**
   * Find a previous added drawable object within the scope of current 
   * BrainMaps.
   * @param identifier The id attribute of target drawable object
   * @returns Returns the object if found. `undefined` if not found.
   */
  public searchObject(identifier: string) {
    let target: Drawable = void 0;
    this._OBJ_STACK.map(obj => {
      if (obj.id === identifier) {
        target = obj;
      }
    });
    return target;
  }

  /**
   * Update an existing object within the scope of current BrainMaps.
   * 
   * **Note**: this will not call the `draw()` function implicitly, you should
   * perform a explicit function call after all object level operations.
   * @param object The updated object description.
   */
  public updateObject(object: Drawable) {
    let temp_stack: Array<Drawable> = [];
    this._OBJ_STACK.map(obj => {
      if (obj.uuid === object.uuid) {
        temp_stack.push(object);
      } else {
        temp_stack.push(obj);
      }
    });
    this._OBJ_STACK = temp_stack;
    this._reload_eventlisteners();
  }

  /**
   * Remove a drawable object from current BrainMaps.
   * 
   * **Note**: this will not call the `draw()` function implicitly, you should
   * perform a explicit function call after all object level operations.
   * @param object The object to be removed.
   */
  public removeObject(object: Drawable | string) {
    if (typeof object === 'string') {
      // Check if input content is the UUID string or id string (start with #)
      if (object.startsWith('#')) {
        // ID
        let temp_stack: Array<Drawable> = [];
        this._OBJ_STACK.map(obj => {
          if (obj.id === object) return;
          temp_stack.push(obj);
        });
        this._OBJ_STACK = temp_stack;
      } else {
        // UUID
        let temp_stack: Array<Drawable> = [];
        this._OBJ_STACK.map(obj => {
          if (obj.uuid === object) return;
          temp_stack.push(obj);
        });
        this._OBJ_STACK = temp_stack;
      }
    } else if (typeof object === 'object') {
      // Assume this is a Drawable object.
      let temp_stack: Array<Drawable> = [];
      this._OBJ_STACK.map(obj => {
        if (obj.uuid === object.uuid) return;
        temp_stack.push(obj);
      });
      this._OBJ_STACK = temp_stack;
    }
    this._reload_eventlisteners();
  }

  private _reload_eventlisteners() {
    this._mouseclick_callbacks.splice(0);
    this._mousedoubleclick_callbacks.splice(0);
    this._mouserightclick_callbacks.splice(0);
    this._mousemove_callbacks.splice(0);
    this._mouseleave_callbacks.splice(0);

    this._OBJ_STACK.map(object => {
      if ('onClick' in object) this._mouseclick_callbacks.push(object.onClick);
      if ('onDoubleClick' in object) this._mousedoubleclick_callbacks.push(object.onDoubleClick);
      if ('onRightClick' in object) this._mouserightclick_callbacks.push(object.onRightClick);
      if ('onHover' in object) this._mousemove_callbacks.push(object.onHover);
      if ('onMouseLeave' in object) this._mouseleave_callbacks.push(object.onMouseLeave);
    })
  }

  /**
   * The main function to be called when you are ready to render all drawable
   * objects in the canvas.
   */
  public draw() {
    this._fixDPI();
    if (this._OBJ_STACK.length == 0) {
      this._ctx.clearRect(0, 0, this._canvas.clientWidth, this._canvas.clientHeight);
      return;
    }
    window.requestAnimationFrame(() => {
      // Clear canvas;
      this._ctx.clearRect(0, 0, this._canvas.clientWidth, this._canvas.clientHeight);

      this._OBJ_STACK.map(obj => {
        this._drawObject(obj);
      });
    })
  }

  /**
   * Create a drawable object with object descriptions and path descriptions.
   * @param id Idenfifier of the element
   * @param path A Path2D object that describes the content of the element
   * @param param2 Render options of the element
   * @param isFillObject Should the element be drew in object mode or border (
   * stroke) mode. This will affect event detection that requires mouse pointer
   * detections.
   * @returns A drawable object.
   */
  public static createObject(id: string, path: BrainMapsPath2D, { fillStyle = '#FFFFFF', strokeStyle = '#000000', lineWidth = 2 }, isFillObject = false): Drawable {
    if (!id.startsWith('#'))
      throw new Error('id must start with # and be a valid identifier');
    let uid = uuid.v4();
    return _.merge({
      fillStyle: '#FFFFFF',
      strokeStyle: '#000000',
      lineWidth: 1,
      isFillObject: false
    }, {
      uuid: uid,
      id: id,
      path: path.getPath(),
      fillObject: isFillObject,
      fillStyle: fillStyle,
      strokeStyle: strokeStyle,
      lineWidth: lineWidth,
      isFillObject: isFillObject
    });
  }
}

class BrainMapsPath2D implements CanvasPath {
  private _path2d: Path2D;
  constructor() {
    this._path2d = new Path2D();
  }
  public arc(x: number, y: number, radius: number, startAngle: number, endAngle: number, anticlockwise?: boolean): void {
    let dpi = window.devicePixelRatio;
    this._path2d.arc(x * dpi, y * dpi, radius * dpi, startAngle, endAngle, anticlockwise);
  }
  public arcTo(x1: number, y1: number, x2: number, y2: number, radius: number): void {
    let dpi = window.devicePixelRatio;
    this._path2d.arc(x1 * dpi, y1 * dpi, x2 * dpi, y2 * dpi, radius * dpi);
  }
  public bezierCurveTo(cp1x: number, cp1y: number, cp2x: number, cp2y: number, x: number, y: number): void {
    let dpi = window.devicePixelRatio;
    this._path2d.bezierCurveTo(cp1x * dpi, cp1y * dpi, cp2x * dpi, cp2y * dpi, x * dpi, y * dpi);
  }
  public closePath(): void {
    this._path2d.closePath();
  }
  public ellipse(x: number, y: number, radiusX: number, radiusY: number, rotation: number, startAngle: number, endAngle: number, anticlockwise?: boolean): void {
    let dpi = window.devicePixelRatio;
    this._path2d.ellipse(x * dpi, y * dpi, radiusX * dpi, radiusY * dpi, rotation * dpi, startAngle, endAngle, anticlockwise);
  }
  public lineTo(x: number, y: number): void {
    let dpi = window.devicePixelRatio;
    this._path2d.lineTo(x * dpi, y * dpi);
  }
  public moveTo(x: number, y: number): void {
    let dpi = window.devicePixelRatio;
    this._path2d.moveTo(x * dpi, y * dpi);
  }
  public quadraticCurveTo(cpx: number, cpy: number, x: number, y: number): void {
    let dpi = window.devicePixelRatio;
    this._path2d.quadraticCurveTo(cpx * dpi, cpy * dpi, x * dpi, y * dpi);
  }
  public rect(x: number, y: number, w: number, h: number): void {
    let dpi = window.devicePixelRatio;
    this._path2d.rect(x * dpi, y * dpi, w * dpi, h * dpi);
  }
  public getPath(): Path2D {
    return this._path2d;
  }
}

export { Drawable, BrainMapsPath2D, BrainMaps, Point };