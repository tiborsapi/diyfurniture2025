import {
  FurnitureBody,
  FurnitureElementType,
  Rectangle,
} from './furniture-body.model';

export class ModelHelper {
  public static convertRectangleToFurnitureBody(
    rectangle: Rectangle
  ): FurnitureBody {
    const body = new FurnitureBody(
      0,
      0,
      rectangle.width,
      rectangle.height,
      500, //deepth
      18,
      FurnitureElementType.BODY,
      rectangle.posX,
      rectangle.posY,
      null,
      null,
      0,
      'pine'
    );
    return body;
  }
}
