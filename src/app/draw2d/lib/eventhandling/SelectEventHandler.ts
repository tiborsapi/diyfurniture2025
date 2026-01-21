import { FurnitureElementType } from './../model/furniture-body.model';
import { Directive } from '@angular/core';
import { FurnitureElement, Rectangle, SelectedFurniture } from 'src/app/draw2d/lib/model/furniture-body.model';
import { EventHandler } from './EventHandler';
import { FurnitureBody } from 'src/app/draw2d/lib/model/furniture-body.model';

@Directive()
export class SelectEventHandler extends EventHandler {
  private selectedElement: SelectedFurniture | null = null;

  public onInit(): void {
    this.drawSupport.setDrawColor('#000');
  }
  public onFinsish(): void {
    this.drawSupport.drawExistingElements();
  }
  public onStart(x: number, y: number, mod?: { shift?: boolean }): void {
  const shift = mod?.shift === true;

  const selectedElement = this.modelManager.findSelectedElement(x, y);
  const parent = SelectEventHandler.findParrent(selectedElement);
  const id = parent != null ? parent.id : 0;

  if (shift) {
    if (id !== 0) this.modelManager.toggleSelectedElement(id);
  } else {
    this.modelManager.setSingleSelectedElement(id);
  }

  const selected = this.modelManager.getSelectedElements();
  const selectedConverted = selected
    .map(e => convertElement(e))
    .filter(e => e != null) as any[];

  this.drawSupport.changeSelectedElements(selectedConverted);
}
  public onMove(xPrev: number, yPrev: number, x: number, y: number): void {}
  public onEnd(x: number, y: number): void {}

  private static findParrent(element: FurnitureElement | null) : FurnitureElement | null {
    if(element==null || element.parrent==null)
    return element;
    return this.findParrent(element.parrent);
  }
}
function convertElement(selectedElement: FurnitureElement | null) {
  if (selectedElement == null) return null;

  let x = selectedElement.posX;
  let y = selectedElement.posY;

  if (selectedElement instanceof FurnitureBody) {
    x = selectedElement.x + selectedElement.posX;
    y = selectedElement.y + selectedElement.posY;
  }

  return new SelectedFurniture(
    selectedElement,
    x,
    y,
    selectedElement.width,
    selectedElement.height,
    600,
    18,
    selectedElement.type,
    selectedElement.material
  );
}

