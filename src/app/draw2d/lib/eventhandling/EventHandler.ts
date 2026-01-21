import { Directive } from '@angular/core';
import { Draw2DSupportService } from '../draw/draw2-dsupport.service';
import { FurnitureModelManagerService } from '../model/furniture-model-manager.service';

@Directive()
export abstract class EventHandler {
  constructor(
    protected drawSupport: Draw2DSupportService,
    protected modelManager: FurnitureModelManagerService
  ) { }
  public abstract onInit(): void;
  public abstract onStart(x: number, y: number, mod?: { shift?: boolean }): void;
  public abstract onMove(
    xPrev: number,
    yPrev: number,
    x: number,
    y: number
  ): void;
  public abstract onEnd(x: number, y: number): void;
  public abstract onFinsish(): void;
}
