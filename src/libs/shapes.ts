/**
 * Built-in Shapes Library
 * 
 * Defines the shapes interface and some libraries to create anchor-centered 
 * drawable objects.
 * 
 * Zhongdong Yang (zhongdong_y@outlook.com)
 * March 8, 2021
 */
import { BrainMapsPath2D, Point } from "./brainmaps";

interface Shapes {
  roundedRectangle(
    anchorX: number,
    anchorY: number,
    width: number,
    height: number,
    borderRadius: number
  ): BrainMapsPath2D;
}

const CenterAnchorShapes: Shapes = class CenterAnchorShapes {
  public static roundedRectangle(anchorX: number, anchorY: number, width: number, height: number, borderRadius = 0) {
    if (
      anchorX < 0 ||
      anchorY < 0 ||
      width <= 0 ||
      height <= 0 ||
      borderRadius < 0
    )
      throw new Error('Invalid input');

    let node = new BrainMapsPath2D();
    if (borderRadius === 0) {
      // Standard retangle;
      node.rect(anchorX - 0.5 * width, anchorY - 0.5 * height, width, height);
    } else {
      // Rounded retangle;
      // Assign a valid borderRadius value.
      borderRadius = Math.min(0.5 * Math.min(width, height), borderRadius);
      let topLeftCorner: Point = {
        x: anchorX - 0.5 * width,
        y: anchorY - 0.5 * height
      }
      let topRightCorner: Point = {
        x: anchorX + 0.5 * width,
        y: anchorY - 0.5 * height
      }
      let bottomLeftCorner: Point = {
        x: anchorX - 0.5 * width,
        y: anchorY + 0.5 * height
      }
      let bottomRightCorner: Point = {
        x: anchorX + 0.5 * width,
        y: anchorY + 0.5 * height
      }
      let topLeftCenter: Point = {
        x: topLeftCorner.x + borderRadius,
        y: topLeftCorner.y + borderRadius
      };
      let topRightCenter: Point = {
        x: topRightCorner.x - borderRadius,
        y: topRightCorner.y + borderRadius
      };
      let bottomLeftCenter: Point = {
        x: bottomLeftCorner.x + borderRadius,
        y: bottomLeftCorner.y - borderRadius
      };
      let bottomRightCenter: Point = {
        x: bottomRightCorner.x - borderRadius,
        y: bottomRightCorner.y - borderRadius
      };
      // Top left rounded corner.
      node.moveTo(topLeftCorner.x, topLeftCorner.y + borderRadius);
      node.arc(topLeftCenter.x, topLeftCenter.y, borderRadius, -Math.PI, -Math.PI / 2);
      node.lineTo(topRightCorner.x - borderRadius, topRightCorner.y);
      // Top right rounded corner.
      node.arc(topRightCenter.x, topRightCenter.y, borderRadius, -Math.PI / 2, 0);
      node.lineTo(bottomRightCorner.x, bottomRightCorner.y - borderRadius);
      // Bottom right rounded corner.
      node.arc(bottomRightCenter.x, bottomRightCenter.y, borderRadius, 0, Math.PI / 2);
      node.lineTo(bottomLeftCorner.x + borderRadius, bottomLeftCorner.y);
      // Bottom left rounded corner.
      node.arc(bottomLeftCenter.x, bottomLeftCenter.y, borderRadius, Math.PI / 2, Math.PI);
      node.lineTo(topLeftCorner.x, topLeftCorner.y + borderRadius);
      node.closePath();
    }
    return node;
  }
}

export { Shapes, CenterAnchorShapes };