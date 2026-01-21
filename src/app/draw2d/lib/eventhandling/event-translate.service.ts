import { Injectable } from '@angular/core';
import { fromEvent, Observable } from 'rxjs';
import { map, pairwise, switchMap, takeUntil } from 'rxjs/operators';
import { DiyFurnitureMouseEvent, MyMouseEventType } from 'src/app/draw2d/lib/model/my-mouse-event.model';

@Injectable()
export class EventTranslateService {
  private _cx: CanvasRenderingContext2D | null = null;
  private _canvas: HTMLCanvasElement | null = null;

  private _mouseEvents$: Observable<DiyFurnitureMouseEvent> = new Observable();

  public get cx() {
    return this._cx == null ? new CanvasRenderingContext2D() : this._cx;
  }

  public get canvas() {
    return this._canvas == null ? new HTMLCanvasElement() : this._canvas;
  }

  public get mouseEvents$(): Observable<DiyFurnitureMouseEvent> {
    return this._mouseEvents$;
  }

  setCanvas(canvas: HTMLCanvasElement) : void {
    this._canvas = canvas;
    this._cx = canvas.getContext('2d');
  }
  init() {
    this.cx.lineWidth = 1;
    this.cx.lineCap = 'round';
    this.cx.strokeStyle = '#000';

    this.captureEvents();
  }

  private captureEvents(): void {
    this._mouseEvents$ = new Observable<DiyFurnitureMouseEvent>((sub) => {
      fromEvent(this.canvas, 'mousedown')
        .pipe(
          switchMap((e) => {
            return fromEvent<MouseEvent>(this.canvas, 'mousemove').pipe(
              takeUntil(fromEvent(this.canvas, 'mouseup')),
              takeUntil(fromEvent(this.canvas, 'mouseleave')),
              pairwise()
            );
          })
        )
        .subscribe((res: [MouseEvent, MouseEvent]) => {
          const rect = this.canvas.getBoundingClientRect();
          const move: DiyFurnitureMouseEvent = {
            type: MyMouseEventType.MOVE,
            x2: res[0].clientX - rect.left,
            y2: res[0].clientY - rect.top,
            x1: res[1].clientX - rect.left,
            y1: res[1].clientY - rect.top,
            shiftKey: res[1].shiftKey,
          };
          sub.next(move);
        });
      fromEvent<MouseEvent>(this.canvas, 'mousedown').subscribe(
        (event: MouseEvent) => {
          const rect = this.canvas.getBoundingClientRect();
          const start: DiyFurnitureMouseEvent = {
            type: MyMouseEventType.START,
            x2: 0,
            y2: 0,
            x1: event.clientX - rect.left,
            y1: event.clientY - rect.top,
            shiftKey: event.shiftKey,
          };
          sub.next(start);
        }
      );
      fromEvent<MouseEvent>(this.canvas, 'mouseup').subscribe(
        (event: MouseEvent) => {
          const rect = this.canvas.getBoundingClientRect();
          const end: DiyFurnitureMouseEvent = {
            type: MyMouseEventType.END,
            x2: 0,
            y2: 0,
            x1: event.clientX - rect.left,
            y1: event.clientY - rect.top,
            shiftKey: event.shiftKey,
          };
          sub.next(end);
        }
      );
    }).pipe(map(event=>this.transform(event)));
  }

  public toWorld(x: number, y: number) {
    var matrix = this.cx.getTransform();
    var inverseMatrix = matrix.inverse();
    var point = new DOMPoint(x, y);
    return point.matrixTransform(inverseMatrix);
  }

  private transform(
    mouseEvent: DiyFurnitureMouseEvent
  ): DiyFurnitureMouseEvent {
    var scaleX = this.cx.canvas.width / this.cx.canvas.clientWidth;
    var scaleY = this.cx.canvas.height / this.cx.canvas.clientHeight;
    var pos1 = this.toWorld(mouseEvent.x1 * scaleX, mouseEvent.y1 * scaleY);
    var pos2 = this.toWorld(mouseEvent.x2 * scaleX, mouseEvent.y2 * scaleY);
    mouseEvent.x1 = pos1.x;
    mouseEvent.x2 = pos2.x;
    mouseEvent.y1 = pos1.y;
    mouseEvent.y2 = pos2.y;

    return mouseEvent;
  }

  constructor() {
    this._canvas = null;
  }
}
