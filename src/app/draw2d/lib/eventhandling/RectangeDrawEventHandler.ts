import { ModelHelper } from './../model/ModelHelper';
import { DrawHelper, Position } from '../draw/DrawHelper';
import { EventHandler } from './EventHandler';

export class RectangeDrawEventHandler extends EventHandler {
  private startPosition: Position | null = null;

  public onInit(): void {
    this.drawSupport.setDrawColor('#000');
    this.drawSupport.drawExistingElements();
  }
  public onFinsish(): void { }
  public onStart(x: number, y: number): void {
    this.startPosition = { x: x, y: y };
  }
  public onMove(xPrev: number, yPrev: number, x: number, y: number): void {
    if (this.startPosition == null) {
      return;
    }
    this.drawSupport.setDrawColor('#F00');
    const rectangle = DrawHelper.calculateRectangle(
      this.startPosition.x,
      this.startPosition.y,
      x,
      y
    );
    this.drawSupport.drawRectangle(rectangle);
  }

  public onEnd(x: number, y: number): void {
  if (this.startPosition == null) return;

  const rectangle = DrawHelper.calculateRectangle(
    this.startPosition.x, this.startPosition.y, x, y
  );

  const furnitureBody = ModelHelper.convertRectangleToFurnitureBody(rectangle);
  
  // ALAPÉRTELMEZETT ANYAG BEÁLLÍTÁSA:
  (furnitureBody as any).material = 'pine'; 

  this.modelManager.addFurnitureBody(furnitureBody);
  this.drawSupport.clearScrean();
  this.drawSupport.drawExistingElements();
}
}
