import {
  BodyFrontDetails,
  FrontElement,
} from './../../../furnituremodel/furnituremodels';
import { ViewFurnitureBody } from './furniture-body.viewmodel';
import {
  FurnitureBody,
  FurnitureElement,
  FurnitureElementType,
  HorizontalSplit,
  Split,
  VerticalSplit,
} from './furniture-body.model';
import { Injectable } from '@angular/core';
import { FurnituremodelService } from 'src/app/furnituremodel/furnituremodel.service';
import { Body } from 'src/app/furnituremodel/furnituremodels';
import { ModelchangeService } from '../eventhandling/modelchange.service';
import { Draw2DSupportService } from '../draw/draw2-dsupport.service';

@Injectable()
export class FurnitureModelManagerService {

  public findBody(element: FurnitureElement) : FurnitureBody {
    const body = this.findParent(element);
    return body as FurnitureBody;
  }

  private findParent(element: FurnitureElement) : FurnitureElement {
    while (element.parrent != null) {
      element = element.parrent;
    }
    return element;
  }

  refresh(element: FurnitureElement) {
    const parent = this.findBody(element);
    this.furnitureService.furnitureBodyPosition.update(parent.id, {
      details: parent.split,
    });
    const resultArray : FrontElement[] = [];
    this.addSplit(parent.split, parent.id, parent.posX, parent.posY,resultArray);
    this.furnitureService.furnitureBodys.update(parent.id,{'frontElements':resultArray,'deepth':parent.deepth, 'thickness':parent.thickness});
  }

  private rectangles: FurnitureBody[] = [];

  private undoStack: any[] = [];
  private readonly undoLimit = 20;

  // Prevent async constructor-load from overwriting manual state changes (undo/import)
  private allowDbHydration: boolean = true;

  private _cx: CanvasRenderingContext2D | null = null;

  private selectedElementIds = new Set<number>();

public setSingleSelectedElement(id: number): void {
  this.selectedElementIds.clear();
  if (id !== 0) this.selectedElementIds.add(id);
  this.furnitureService.setSelectedFurniture(id);
}

public toggleSelectedElement(id: number): void {
  if (id === 0) return;

  if (this.selectedElementIds.has(id)) this.selectedElementIds.delete(id);
  else this.selectedElementIds.add(id);

  this.furnitureService.setSelectedFurniture(this.getActiveSelectedId());
}

public clearSelection(): void {
  this.selectedElementIds.clear();
  this.furnitureService.setSelectedFurniture(0);
}

public getSelectedElementIds(): number[] {
  return Array.from(this.selectedElementIds);
}

public isSelected(id: number): boolean {
  return this.selectedElementIds.has(id);
}

private getActiveSelectedId(): number {
  const it = this.selectedElementIds.values().next();
  return it.done ? 0 : it.value;
}

public getSelectedElements(): FurnitureElement[] {
  return this.getSelectedElementIds()
    .map(id => this.findElementById(id))
    .filter(e => e != null) as FurnitureElement[];
}


  private converSplit(obj: any, parent: FurnitureElement) {
    if (obj == undefined) return null;
    if (obj['topElement'] != undefined) {
      const top = this.convertElem(obj['topElement'], parent);
      const bottom = this.convertElem(obj['bottomElement'], parent);
      return new HorizontalSplit(obj['relativePositionY'], top, bottom);
    }
    const left = this.convertElem(obj['leftElement'], parent);
    const right = this.convertElem(obj['rightElement'], parent);
    return new VerticalSplit(obj['relativePositionX'], left, right);
  }

  convertElem(elem: any, parent: FurnitureElement) {
    let el = new FurnitureElement(
      elem['posX'],
      elem['posY'],
      elem['width'],
      elem['height'],
      elem['type'],
      parent
    );
    el.split = this.converSplit(elem['split'], el);
    return el;
  }

  constructor(
    private furnitureService: FurnituremodelService,
    private eventManager: ModelchangeService
  ) {
    furnitureService.furnitureBodys.toArray().then((allElements) => {
      if (!this.allowDbHydration) return;

      for (let el of allElements) {
        this.findPosition(el.id == undefined ? 0 : el.id)
          .then((pos) => {
            if (pos == undefined) return;
            let fb = new FurnitureBody(
              0,
              0,
              el.width/10,
              el.height/10,
              el.deepth,
              el.thickness,
              FurnitureElementType.BODY,
              pos.x,
              pos.y,
              null,
              null,
              el.id
            );
            var split = this.converSplit(pos.details, fb);
            fb.split = split;
            this.rectangles.push(fb);
          })
          .finally(() => {
            eventManager.modelChanged();
          });
      }
    });
  }

  async findPosition(id: number) {
    return await this.furnitureService.furnitureBodyPosition
      .where({
        bodyId: id,
      })
      .first();
  }

  public set cx(cx: CanvasRenderingContext2D) {
    this._cx = cx;
  }

  public addFurnitureBody(furnitureBody: FurnitureBody): void {
    this.pushUndoState();
    this.allowDbHydration = false;

    this.rectangles.push(furnitureBody);
      const idBody = this.furnitureService.furnitureBodys.add(
          new Body('Item', Math.round(furnitureBody.width*10), Math.round(furnitureBody.height*10),furnitureBody.deepth,furnitureBody.thickness,[])
        );
      idBody.then((id) => {
        furnitureBody.id = id;
        this.furnitureService.furnitureBodyPosition.add(
          new BodyFrontDetails(id, furnitureBody.x, furnitureBody.y, furnitureBody.split)
        );
      });
  }

  private addElement(
    element: FurnitureElement,
    id: number,
    x: number,
    y: number,
    resultArray : FrontElement[]
  ) {
    if (element.split != null) {
      this.addSplit(element.split, id, element.posX + x, element.posY + y,resultArray);
      return;
    }
    resultArray.push(
      new FrontElement(
        id,
        element.type.toString(),
        Math.round((element.posX + x)*10) + 2,
        Math.round((element.posY + y)*10) + 2,
        Math.round(element.width*10) - 4,
        Math.round(element.height*10) - 4
      )
    );
  }

  private addSplit(split: Split | null, id: number, x: number, y: number,resultArray : FrontElement[]) {
    if (split == null) return;
    if (split instanceof HorizontalSplit) {
      this.addElement(split.topElement, id, x, y,resultArray);
      this.addElement(split.bottomElement, id, x, y,resultArray);
      return;
    }
    if (split instanceof VerticalSplit) {
      this.addElement(split.leftElement, id, x, y,resultArray);
      this.addElement(split.rightElement, id, x, y,resultArray);
      return;
    }
  }

  public get cx(): CanvasRenderingContext2D {
    if (this._cx == null) {
      throw new Error('CanvasRenderingContext2D not initialized. Ensure Draw2dComponent sets modelManager.cx before using it.');
    }
    return this._cx;
  }

  public getFurnitureBodies(): FurnitureBody[] {
    return this.rectangles;
  }

  public getViewFurnitures(): ViewFurnitureBody[] {
    const viewFurniture: ViewFurnitureBody[] = [];
    for (var furniture of this.getFurnitureBodies()) {
      viewFurniture.push(new ViewFurnitureBody(furniture));
    }
    return viewFurniture;
  }

  public findSelectedElement(x: number, y: number): FurnitureElement | null {
    var result: FurnitureElement | null = null;
    result = this.findFurnitureElement(x, y, 0, 0, this.getFurnitureBodies());
    return result;
  }

  public findSelectedSplit(x: number, y: number): { element: FurnitureElement, split: HorizontalSplit | VerticalSplit } | null {
    for (let body of this.getFurnitureBodies()) {
      const splitResult = this.findSplitAtPosition(x, y, body, 0, 0);
      if (splitResult) {
        return splitResult;
      }
    }

    return null;
  }

  private findSplitAtPosition(
    x: number,
    y: number,
    element: FurnitureElement,
    offsetX: number,
    offsetY: number
  ): { element: FurnitureElement, split: HorizontalSplit | VerticalSplit } | null {
    if (!element.split) return null;

    const elementX = offsetX + element.posX;
    const elementY = offsetY + element.posY;

    if (element instanceof FurnitureBody) {
      // Use the same coordinate system as mouse events (world coordinates)
      // The mouse coordinates are already in world space, so we need to use the same coordinate system
      const bodyX = element.x + element.posX;
      const bodyY = element.y + element.posY;

      if (element.split instanceof HorizontalSplit) {
        const splitY = bodyY + element.split.relativePositionY;
        // Check if click is near the horizontal split line (within 5 pixels)
        if (Math.abs(y - splitY) <= 5 && x >= bodyX && x <= bodyX + element.width) {
          return { element, split: element.split };
        }
      } else if (element.split instanceof VerticalSplit) {
        const splitX = bodyX + element.split.relativePositionX;
        // Check if click is near the vertical split line (within 5 pixels)
        if (Math.abs(x - splitX) <= 5 && y >= bodyY && y <= bodyY + element.height) {
          return { element, split: element.split };
        }
      }
    } else {
      // For non-body elements, use accumulated offsets to compute the split line position
      if (element.split instanceof HorizontalSplit) {
        const splitY = elementY + element.split.relativePositionY;
        // Check if click is near the horizontal split line (within 5 pixels)
        if (Math.abs(y - splitY) <= 5 && x >= elementX && x <= elementX + element.width) {
          return { element, split: element.split };
        }
      } else if (element.split instanceof VerticalSplit) {
        const splitX = elementX + element.split.relativePositionX;
        // Check if click is near the vertical split line (within 5 pixels)
        if (Math.abs(x - splitX) <= 5 && y >= elementY && y <= elementY + element.height) {
          return { element, split: element.split };
        }
      }
    }

    // Recursively check child elements
    if (element.split instanceof HorizontalSplit) {
      const childResult = this.findSplitAtPosition(x, y, element.split.topElement, elementX, elementY);
      if (childResult) return childResult;

      const childResult2 = this.findSplitAtPosition(x, y, element.split.bottomElement, elementX, elementY);
      if (childResult2) return childResult2;
    } else if (element.split instanceof VerticalSplit) {
      const childResult = this.findSplitAtPosition(x, y, element.split.leftElement, elementX, elementY);
      if (childResult) return childResult;

      const childResult2 = this.findSplitAtPosition(x, y, element.split.rightElement, elementX, elementY);
      if (childResult2) return childResult2;
    }

    return null;
  }

  public setSelectedElement(id: number) {
  this.setSingleSelectedElement(id);
}

  public removeElement(element: FurnitureElement): void {
    this.pushUndoState();
    this.allowDbHydration = false;

    // Find the element in the rectangles array
    const index = this.rectangles.findIndex(rect => rect === element || this.containsElement(rect, element));

    if (index !== -1) {
      const elementToRemove = this.rectangles[index];

      // Remove from database if it has an ID
      if (elementToRemove.id !== undefined) {
        this.furnitureService.furnitureBodys.delete(elementToRemove.id);
        this.furnitureService.furnitureBodyPosition.where({ bodyId: elementToRemove.id }).delete();
      }

      // Remove from the rectangles array
      this.rectangles.splice(index, 1);

      // Notify about the change
      this.eventManager.modelChanged();
    }
  }

  public clearAllElements(): void {
    this.pushUndoState();
    this.allowDbHydration = false;

    // Clear all elements from the rectangles array
    this.rectangles.length = 0;

    // Clear all data from the database
    this.furnitureService.furnitureBodys.clear();
    this.furnitureService.furnitureBodyPosition.clear();

    // Notify about the change
    this.eventManager.modelChanged();
  }

  private pushUndoState(): void {
    // We store a JSON-friendly snapshot (plain objects)
    const snapshot = this.rectangles.map(b => this.toPlainBody(b));
    this.undoStack.push(snapshot);

    if (this.undoStack.length > this.undoLimit) {
      this.undoStack.shift();
    }
  }

  // Convert current model tree into plain objects
  private toPlainBody(body: FurnitureBody): any {
    return {
      id: body.id,
      x: body.x,
      y: body.y,
      posX: body.posX,
      posY: body.posY,
      width: body.width,
      height: body.height,
      deepth: body.deepth,
      thickness: body.thickness,
      material: (body as any).material,
      type: body.type,
      split: this.toPlainSplit(body.split)
    };
  }

  private toPlainElement(el: FurnitureElement): any {
    return {
      posX: el.posX,
      posY: el.posY,
      width: el.width,
      height: el.height,
      type: el.type,
      split: this.toPlainSplit(el.split)
    };
  }

  private toPlainSplit(split: Split | null): any {
    if (!split) return null;

    if (split instanceof HorizontalSplit) {
      return {
        relativePositionY: split.relativePositionY,
        topElement: this.toPlainElement(split.topElement),
        bottomElement: this.toPlainElement(split.bottomElement),
      };
    }

    // VerticalSplit
    return {
      relativePositionX: (split as VerticalSplit).relativePositionX,
      leftElement: this.toPlainElement((split as VerticalSplit).leftElement),
      rightElement: this.toPlainElement((split as VerticalSplit).rightElement),
    };
  }

  private async persistCurrentStateToDb(): Promise<void> {
    // 1) wipe DB
    await this.furnitureService.furnitureBodys.clear();
    await this.furnitureService.furnitureBodyPosition.clear();

    // 2) rebuild from current in-memory state
    for (const b of this.rectangles) {
      const newId = await this.furnitureService.furnitureBodys.add(
        new Body(
          'Item',
          Math.round(b.width * 10),
          Math.round(b.height * 10),
          b.deepth,
          b.thickness,
          []
        )
      );

      b.id = newId;

      await this.furnitureService.furnitureBodyPosition.add(
        new BodyFrontDetails(newId, b.x, b.y, b.split)
      );

      this.refresh(b);
    }
  }


  public async undo(): Promise<void> {
    if (this.undoStack.length === 0) return;

    const prev = this.undoStack.pop();
    if (!prev) return;
    
    this.allowDbHydration = false;

    this.rectangles.length = 0;

    for (const obj of prev) {
      const fb = new FurnitureBody(
        0,
        0,
        obj.width,
        obj.height,
        obj.deepth,
        obj.thickness,
        FurnitureElementType.BODY,
        obj.x,
        obj.y,
        null,
        null,
        obj.id
      );

      fb.split = this.converSplit(obj.split, fb);
      this.rectangles.push(fb);
    }

    await this.persistCurrentStateToDb();
    this.eventManager.modelChanged();
  }


  private containsElement(parent: FurnitureElement, target: FurnitureElement): boolean {
    if (parent === target) return true;

    if (parent.split) {
      if (parent.split instanceof HorizontalSplit) {
        return this.containsElement(parent.split.topElement, target) ||
               this.containsElement(parent.split.bottomElement, target);
      } else if (parent.split instanceof VerticalSplit) {
        return this.containsElement(parent.split.leftElement, target) ||
               this.containsElement(parent.split.rightElement, target);
      }
    }

    return false;
  }

  // Resize utilities and helpers

  public resizeElementHeightPreservingPercent(element: FurnitureElement, newHeight: number): void {
    this.pushUndoState();
    this.allowDbHydration = false;
    
    const body = this.findBody(element);
    if (body.height === 0 || newHeight <= 0) {
      return;
    }
    const percent = element.height / body.height;
    if (percent <= 0) {
      return;
    }
    const newBodyHeight = newHeight / percent;
    const factor = newBodyHeight / body.height;
    this.scaleBodyHeight(body, factor);
    this.refresh(body);
    this.eventManager.modelChanged();
  }

  public resizeElementWidthNoOverlap(element: FurnitureElement, newWidth: number): void {
    if (newWidth <= 0) {
      return;
    }

    this.pushUndoState();
    this.allowDbHydration = false;

    const context = this.findNearestVerticalSplitContext(element);

    if (!context) {
      // No vertical split up the chain; scale the whole body width
      const body = this.findBody(element);
      if (element.width === 0) return;
      const factor = newWidth / element.width;
      this.scaleSubtreeWidthRootedAt(body, factor);
      this.refresh(body);
      this.eventManager.modelChanged();
      return;
    }

    const { ancestor, split, side } = context;
    const container = side === 'left' ? split.leftElement : split.rightElement;

    if (element.width === 0) return;
    const factor = newWidth / element.width;

    // Scale the subtree rooted at the container horizontally
    this.scaleSubtreeWidthRootedAt(container, factor);

    // After scaling, container.width has been multiplied; adjust split to match exact container width
    const containerWidth = Math.min(Math.max(0, container.width), ancestor.width);

    if (side === 'left') {
      split.relativePositionX = containerWidth;
    } else {
      split.relativePositionX = ancestor.width - containerWidth;
    }

    // Normalize children to fill parent exactly according to split
    split.leftElement.posX = 0;
    split.leftElement.width = split.relativePositionX;

    split.rightElement.posX = split.relativePositionX;
    split.rightElement.width = Math.max(0, ancestor.width - split.relativePositionX);

    this.refresh(ancestor);
    this.eventManager.modelChanged();
  }

  private scaleBodyHeight(body: FurnitureBody, factor: number): void {
    if (factor === 1) return;

    const recurse = (e: FurnitureElement, isRoot: boolean) => {
      if (!isRoot) {
        e.posY *= factor;
        e.height *= factor;
      } else {
        // For root, keep posY, only scale height
        e.height *= factor;
      }

      if (e.split instanceof HorizontalSplit) {
        e.split.relativePositionY *= factor;
        recurse(e.split.topElement, false);
        recurse(e.split.bottomElement, false);
      } else if (e.split instanceof VerticalSplit) {
        // Vertical split position is horizontal; no change for Y
        recurse(e.split.leftElement, false);
        recurse(e.split.rightElement, false);
      }
    };

    recurse(body, true);
  }

  private scaleSubtreeWidthRootedAt(element: FurnitureElement, factor: number): void {
    if (factor === 1) return;

    const recurse = (e: FurnitureElement, isRoot: boolean) => {
      if (!isRoot) {
        e.posX *= factor;
        e.width *= factor;
      } else {
        // For the root of this subtree, keep posX, only scale width
        e.width *= factor;
      }

      if (e.split instanceof VerticalSplit) {
        e.split.relativePositionX *= factor;
        recurse(e.split.leftElement, false);
        recurse(e.split.rightElement, false);
      } else if (e.split instanceof HorizontalSplit) {
        // Horizontal split y-position unaffected by width scaling
        recurse(e.split.topElement, false);
        recurse(e.split.bottomElement, false);
      }
    };

    recurse(element, true);
  }

  private findNearestVerticalSplitContext(target: FurnitureElement): { ancestor: FurnitureElement, split: VerticalSplit, side: 'left' | 'right' } | null {
    let current: FurnitureElement | null = target;
    let ancestor: FurnitureElement | null = current?.parrent ?? null;

    while (ancestor) {
      const s = ancestor.split;
      if (s instanceof VerticalSplit) {
        const inLeft = this.containsElement(s.leftElement, target);
        return { ancestor, split: s, side: inLeft ? 'left' : 'right' };
      }
      current = ancestor;
      ancestor = ancestor.parrent;
    }

    return null;
  }

  private findFurnitureElement(
    x: number,
    y: number,
    shiftX: number,
    shiftY: number,
    elemens: FurnitureElement[]
  ): FurnitureElement | null {
    for (var rectangle of elemens) {
      var posX = shiftX + rectangle.posX;
      var posY = shiftY + rectangle.posY;
      if (rectangle instanceof FurnitureBody) {
        // Use the same coordinate system as mouse events (world coordinates)
        posX = (<FurnitureBody>rectangle).x + rectangle.posX;
        posY = (<FurnitureBody>rectangle).y + rectangle.posY;
      }
      this.cx.beginPath();
      const rect = new Path2D();
      rect.rect(posX, posY, rectangle.width, rectangle.height);
      if (this.cx.isPointInPath(rect, x, y)) {
        if (rectangle.split == null) {
          return rectangle;
        }
        if (rectangle.split instanceof HorizontalSplit) {
          const hsplit = <HorizontalSplit>rectangle.split;
          return this.findFurnitureElement(x, y, posX, posY, [
            hsplit.topElement,
            hsplit.bottomElement,
          ]);
        }
        if (rectangle.split instanceof VerticalSplit) {
          const hsplit = <VerticalSplit>rectangle.split;
          return this.findFurnitureElement(x, y, posX, posY, [
            hsplit.leftElement,
            hsplit.rightElement,
          ]);
        }
      }
    }
    return null;
  }

  public generateShelves(element: FurnitureElement, shelfCount: number): void {
    if(!element || shelfCount <= 0) return;

    this.pushUndoState();
    this.allowDbHydration = false;

    let currentParent = element;

    for(let i = 0; i < shelfCount; i++) {
      const remainingSections = shelfCount - i + 1;
      const splitPos = currentParent.height / remainingSections;

      const snappedPos = Math.round(splitPos / 3) * 3;

      const topElem = new FurnitureElement(
        0, 0, currentParent.width, snappedPos, currentParent.type, currentParent
      );
      
      const bottomHeight = currentParent.height - snappedPos;
      const bottomElem = new FurnitureElement(
        0, snappedPos, currentParent.width, bottomHeight, currentParent.type, currentParent
      );

      const horizontalSplit = new HorizontalSplit(snappedPos, topElem, bottomElem);
      currentParent.split = horizontalSplit;

      currentParent = horizontalSplit.bottomElement;
    }

    this.refresh(element);
  }

  public loadFurnitures(data: any[]): void {
    this.rectangles = []; 

    for (const item of data) {
      const revived = this.reviveFurnitureElement(item);
      
      const body = new FurnitureBody(
        0, 0, revived.width, revived.height,
        item.deepth || 500, 
        item.thickness || 18, 
        revived.type, 
        item.x || 50, 
        item.y || 50, 
        null, null, item.id
      );

      body.split = revived.split;
      body.material = revived.material;

      this.rectangles.push(body);
    }

    this.eventManager.modelChanged();
  }

  private reviveFurnitureElement(data: any, parent: FurnitureElement | null = null): FurnitureElement {
    const element = new FurnitureElement(
      data.posX, 
      data.posY, 
      data.width, 
      data.height, 
      data.type,
      parent
    );

    element.material = data.material;
    element.id = data.id;

    if (data.split) {
      if (data.split.topElement) {
        const top = this.reviveFurnitureElement(data.split.topElement, element);
        const bottom = this.reviveFurnitureElement(data.split.bottomElement, element);
        element.split = new HorizontalSplit(data.split.relativePositionY, top, bottom);
      } else if (data.split.leftElement) {
        const left = this.reviveFurnitureElement(data.split.leftElement, element);
        const right = this.reviveFurnitureElement(data.split.rightElement, element);
        element.split = new VerticalSplit(data.split.relativePositionX, left, right);
      }
    }

    return element;
  }
  public findElementById(id: number): FurnitureElement | null {
  if (id === 0) return null;

  for (const body of this.getFurnitureBodies()) {
    const found = this.findElementByIdInTree(body, id);
    if (found) return found;
  }
  return null;
}

private findElementByIdInTree(root: FurnitureElement, id: number): FurnitureElement | null {
  if (root.id === id) return root;

  const s = root.split;
  if (!s) return null;

  if (s instanceof HorizontalSplit) {
    return this.findElementByIdInTree(s.topElement, id) ?? this.findElementByIdInTree(s.bottomElement, id);
  }
  if (s instanceof VerticalSplit) {
    return this.findElementByIdInTree(s.leftElement, id) ?? this.findElementByIdInTree(s.rightElement, id);
  }
  return null;
}

public duplicateSelected(offsetX: number = 10, offsetY: number = 10): void {
  const ids = this.getSelectedElementIds?.() ?? [];
  if (ids.length === 0) return;

  const created: FurnitureBody[] = [];

  for (const id of ids) {
    const original = this.findElementById(id);
    if (!original) continue;

    const body = original instanceof FurnitureBody ? original : (this.findBody(original) as FurnitureBody);
    if (!body) continue;

    const copy = this.cloneBody(body, offsetX, offsetY);
    this.addFurnitureBody(copy);
    created.push(copy);
  }

  if (created.length > 0 && created[created.length - 1].id != null) {
    this.setSingleSelectedElement(created[created.length - 1].id);
  }

  this.eventManager.modelChanged();
}

private cloneBody(src: FurnitureBody, dx: number, dy: number): FurnitureBody {
  const bodyCopy = new FurnitureBody(
    0,
    0,
    src.width,
    src.height,
    src.deepth,
    src.thickness,
    src.type,
    src.x + dx,
    src.y + dy,
    null,
    null,
    undefined
  );

  bodyCopy.split = this.cloneSplit(src.split, bodyCopy);
  return bodyCopy;
}

private cloneSplit(split: Split | null, parent: FurnitureElement): Split | null {
  if (!split) return null;

  if (split instanceof HorizontalSplit) {
    const top = this.cloneElement(split.topElement, parent);
    const bottom = this.cloneElement(split.bottomElement, parent);
    const hs = new HorizontalSplit(split.relativePositionY, top, bottom);
    return hs;
  }

  if (split instanceof VerticalSplit) {
    const left = this.cloneElement(split.leftElement, parent);
    const right = this.cloneElement(split.rightElement, parent);
    const vs = new VerticalSplit(split.relativePositionX, left, right);
    return vs;
  }

  return null;
}

private cloneElement(src: FurnitureElement, parent: FurnitureElement): FurnitureElement {
  const e = new FurnitureElement(
    src.posX,
    src.posY,
    src.width,
    src.height,
    src.type,
    parent
  );

  (e as any).material = (src as any).material;

  e.split = this.cloneSplit(src.split, e);
  return e;
}


}
function convertElem(arg0: any) {
  throw new Error('Function not implemented.');
}

