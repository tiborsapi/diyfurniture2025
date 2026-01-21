import { Directive } from '@angular/core';
import { Rectangle } from 'src/app/draw2d/lib/model/furniture-body.model';
import { EventHandler } from './EventHandler';
import { FurnitureElement, HorizontalSplit, VerticalSplit, FurnitureBody } from '../model/furniture-body.model';
@Directive()
export class MoveEventHandler extends EventHandler {
  private selectedElement: Rectangle | null = null;
  private selectedSplit: { element: FurnitureElement, split: HorizontalSplit | VerticalSplit } | null = null;
  private isDragging: boolean = false;
  private dragStartX: number = 0;
  private dragStartY: number = 0;
  private originalElementX: number = 0;
  private originalElementY: number = 0;
  private originalSplitPosition: number = 0;
  private dragIds: number[] = [];
  private dragStartPositions: Map<number, { x: number; y: number }> = new Map();

  public onInit(): void {
    this.drawSupport.setDrawColor('#000');
    this.drawSupport.drawExistingElements();
  }

  public onFinsish(): void {
    this.isDragging = false;
    this.selectedElement = null;
    this.selectedSplit = null;
    this.dragIds = [];
    this.dragStartPositions.clear();
  }

  public onStart(x: number, y: number): void {
  console.log('### MOVE HANDLER VERSION: 2026-01-20 A (FIXED) ###');
  console.log('[MOVE] onStart called with coordinates:', { x, y });

  const shift = (window.event as MouseEvent | undefined)?.shiftKey === true;

  this.selectedSplit = this.modelManager.findSelectedSplit(x, y);
  console.log('[MOVE] Split detection result:', this.selectedSplit);

  if (this.selectedSplit) {
    this.isDragging = true;
    this.dragStartX = x;
    this.dragStartY = y;

    if (this.selectedSplit.split instanceof HorizontalSplit) {
      this.originalSplitPosition = this.selectedSplit.split.relativePositionY;
    } else if (this.selectedSplit.split instanceof VerticalSplit) {
      this.originalSplitPosition = this.selectedSplit.split.relativePositionX;
    }

    return;
  }

  const hitElement = this.modelManager.findSelectedElement(x, y);
  console.log('[MOVE] Element detection result:', hitElement);

  if (!hitElement) {
    this.isDragging = false;
    this.dragIds = [];
    this.dragStartPositions.clear();
    return;
  }

  const body = this.modelManager.findBody(hitElement as FurnitureElement) as any;
  const hitId = body?.id ?? 0;

  if (shift) {
    if (hitId !== 0) {
      this.modelManager.toggleSelectedElement(hitId);
    }
    this.isDragging = false;
    this.dragIds = [];
    this.dragStartPositions.clear();
    this.drawSupport.drawExistingElements();
    return;
  }

  const selectedIds = this.modelManager.getSelectedElementIds();
  const isHitAlreadySelected = hitId !== 0 && selectedIds.includes(hitId);
  const hasMultiSelected = selectedIds.length > 1;

  if (isHitAlreadySelected && hasMultiSelected) {
    this.dragIds = selectedIds;
  } else {
    this.modelManager.setSingleSelectedElement(hitId);
    this.dragIds = hitId !== 0 ? [hitId] : [];
  }

  this.dragStartPositions.clear();
  for (const sid of this.dragIds) {
    const el = this.modelManager.findElementById(sid) as any;
    if (!el) continue;

    const isBody = el.x !== undefined && el.y !== undefined;
    this.dragStartPositions.set(sid, {
      x: isBody ? el.x : el.posX,
      y: isBody ? el.y : el.posY,
    });
  }

  this.isDragging = true;
  this.dragStartX = x;
  this.dragStartY = y;

  console.log('[MOVE] dragIds:', this.dragIds);
  this.drawSupport.drawExistingElements();
}
  public onMove(xPrev: number, yPrev: number, x: number, y: number): void {
  console.log('[MOVE] onMove called:', { xPrev, yPrev, x, y, isDragging: this.isDragging });

  const gridSize = 3;

  if (this.selectedSplit && this.isDragging) {
    const deltaX = x - this.dragStartX;
    const deltaY = y - this.dragStartY;

    if (this.selectedSplit.split instanceof HorizontalSplit) {
      const rawPosition = this.originalSplitPosition + deltaY;
      const newPosition = Math.max(
        5,
        Math.min(this.selectedSplit.element.height - 5, Math.round(rawPosition / gridSize) * gridSize)
      );

      this.selectedSplit.split.relativePositionY = newPosition;

      const split = this.selectedSplit.split;
      const element = this.selectedSplit.element;
      split.topElement.height = newPosition;
      split.bottomElement.posY = newPosition;
      split.bottomElement.height = element.height - newPosition;

    } else if (this.selectedSplit.split instanceof VerticalSplit) {
      const rawPosition = this.originalSplitPosition + deltaX;
      const newPosition = Math.max(
        5,
        Math.min(this.selectedSplit.element.width - 5, Math.round(rawPosition / gridSize) * gridSize)
      );

      this.selectedSplit.split.relativePositionX = newPosition;

      const split = this.selectedSplit.split;
      const element = this.selectedSplit.element;
      split.leftElement.width = newPosition;
      split.rightElement.posX = newPosition;
      split.rightElement.width = element.width - newPosition;
    }

    this.normalizeLayout(this.selectedSplit.element);
    this.modelManager.refresh(this.selectedSplit.element);
    this.drawSupport.drawExistingElements();

  } else if (this.isDragging && this.dragIds.length > 0) {
    const deltaX = x - this.dragStartX;
    const deltaY = y - this.dragStartY;

    for (const sid of this.dragIds) {
      const el = this.modelManager.findElementById(sid) as any;
      const start = this.dragStartPositions.get(sid);
      if (!el || !start) continue;

      const newPosX = start.x + deltaX;
      const newPosY = start.y + deltaY;

      const snappedX = Math.round(newPosX / gridSize) * gridSize;
      const snappedY = Math.round(newPosY / gridSize) * gridSize;

      const isBody = el.x !== undefined && el.y !== undefined;

      if (isBody) {
        el.x = snappedX;
        el.y = snappedY;
      } else {
        el.posX = snappedX;
        el.posY = snappedY;
      }
    }

    this.drawSupport.drawExistingElements();

  } else if (!this.selectedElement && !this.selectedSplit) {
    this.drawSupport.translatePage(xPrev - x, yPrev - y);
    this.drawSupport.drawExistingElements();
  }
}

  // Recursively normalize a subtree so that after a split movement or parent resize,
  // all nested children align to their parent's dimensions.
  private normalizeLayout(element: FurnitureElement): void {
    if (!element || !element.split) return;

    if (element.split instanceof HorizontalSplit) {
      const split = element.split;
      const parent = element;

      // Children widths follow parent width; align to left
      split.topElement.width = parent.width;
      split.bottomElement.width = parent.width;
      split.topElement.posX = 0;
      split.bottomElement.posX = 0;

      // Heights based on split position
      split.topElement.height = split.relativePositionY;
      split.topElement.posY = 0;

      split.bottomElement.posY = split.relativePositionY;
      split.bottomElement.height = parent.height - split.relativePositionY;

      // Recurse
      this.normalizeLayout(split.topElement);
      this.normalizeLayout(split.bottomElement);
    } else if (element.split instanceof VerticalSplit) {
      const split = element.split;
      const parent = element;

      // Children heights follow parent height; align to top
      split.leftElement.height = parent.height;
      split.rightElement.height = parent.height;
      split.leftElement.posY = 0;
      split.rightElement.posY = 0;

      // Widths based on split position
      split.leftElement.width = split.relativePositionX;
      split.leftElement.posX = 0;

      split.rightElement.posX = split.relativePositionX;
      split.rightElement.width = parent.width - split.relativePositionX;

      // Recurse
      this.normalizeLayout(split.leftElement);
      this.normalizeLayout(split.rightElement);
    }
  }

  public onEnd(x: number, y: number): void {
    console.log('[MOVE] onEnd called:', { x, y, isDragging: this.isDragging, selectedSplit: !!this.selectedSplit, selectedElement: !!this.selectedElement });

    if (this.isDragging) {
      if (this.selectedSplit) {
        // Finalize the split move by updating the model
        console.log('[MOVE] Finalizing split move');
        this.modelManager.refresh(this.selectedSplit.element);
      } else if (this.dragIds.length > 0) {
        for (const sid of this.dragIds) {
          const el = this.modelManager.findElementById(sid);
          if (el) this.modelManager.refresh(el);
        }
    }
  }

    this.isDragging = false;
    this.selectedElement = null;
    this.selectedSplit = null;
    console.log('[MOVE] Drag operation ended');
  }
}

