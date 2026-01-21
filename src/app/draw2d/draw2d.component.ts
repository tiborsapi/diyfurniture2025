import { ModelchangeService } from './lib/eventhandling/modelchange.service';
import { EventHandlerManagerService } from './lib/eventhandling/event-handler-manager.service';
import {
  Component,
  Input,
  ElementRef,
  AfterViewInit,
  ViewChild,
  SimpleChanges,
  HostListener,
} from '@angular/core';
import { BehaviorSubject, from, fromEvent, Observable, of , Subscription} from 'rxjs';
import { DiyFurnitureMouseEvent } from './lib/model/my-mouse-event.model';
import { FurnitureBody, FurnitureElement, FurnitureElementType, Rectangle, SelectedFurniture, HorizontalSplit, VerticalSplit } from './lib/model/furniture-body.model';
import { FurnitureModelManagerService } from './lib/model/furniture-model-manager.service';
import { EventTranslateService } from './lib/eventhandling/event-translate.service';
import { Draw2DSupportService } from './lib/draw/draw2-dsupport.service';
import { MatSelectChange } from '@angular/material/select';

import { FurnitureApiService } from './lib/services/furniture-api.service';

interface FrontType {
  value: string;
  viewValue: string;
}

@Component({
    selector: 'app-draw2d',
    templateUrl: './draw2d.component.html',
    styleUrls: ['./draw2d.component.scss'],
    providers: [
        FurnitureModelManagerService,
        Draw2DSupportService,
        EventTranslateService,
        EventHandlerManagerService,
    ],
    standalone: false
})
export class Draw2dComponent implements AfterViewInit {
  constructor(
    private modelManager: FurnitureModelManagerService,
    private drawSupport: Draw2DSupportService,
    private eventTranslate: EventTranslateService,
    private eventHandler: EventHandlerManagerService,
    private modelEvent: ModelchangeService,
    private apiService: FurnitureApiService
  ) {}

  @ViewChild('canvas') public canvas?: ElementRef;

  private width = 400;
  private height = 400;
  @Input('lineWidth') lineWidth: number = 1;
  public figureType: string = 'crop_square';

  private cx!: CanvasRenderingContext2D;

  private scale: number = 1;

  private keySub?: Subscription;

  private _selectedElement: SelectedFurniture | null = null;

  private _selectedElementBody: FurnitureBody | null = null;

  private selectedElement$: BehaviorSubject<SelectedFurniture | null> =
    new BehaviorSubject<SelectedFurniture | null>(null);

  private mapStringToFurnitureElementType(str: string): FurnitureElementType {
    let color = str.toLocaleUpperCase() as keyof typeof FurnitureElementType;
    return FurnitureElementType[color];
  }

  public selectFrontType(elem: MatSelectChange){
    if(this.selectedElement == undefined){
      return;
    }
    this.selectedElement.origin.type = this.mapStringToFurnitureElementType(elem.value);
    this.selectedElement.furnitureType = this.mapStringToFurnitureElementType(elem.value);
    this.modelManager.refresh(this.selectedElement.origin);
  }

  frontTypes: FrontType[] = [
    {value: 'door', viewValue: 'Door'},
    {value: 'drawer', viewValue: 'Drawer'},
  ];

  selectedFrontTypes : string | undefined;

  public set selectedElement(selectedElement: SelectedFurniture | null) {
    this.selectedElement$.next(selectedElement);
  }

  public changeBodyDetails(): void {
    if (this._selectedElementBody != null) {
      if (this.selectedElement && this.selectedElement.origin) {
        this.selectedElement.origin.material = this._selectedElementBody.material;
      }
      this.modelManager.refresh(this._selectedElementBody as FurnitureElement);
    }
    
    this.drawRectangles();
  }


  public onSelectedElementSizeChanged(): void {
    if (!this._selectedElement) {
      return;
    }
    const origin = this._selectedElement.origin;

    const desiredWidth = this._selectedElement.width;
    const desiredHeight = this._selectedElement.height;

    const widthChanged = desiredWidth !== origin.width;
    const heightChanged = desiredHeight !== origin.height;

    if (heightChanged) {
      this.modelManager.resizeElementHeightPreservingPercent(origin, desiredHeight);
    }
    if (widthChanged) {
      this.modelManager.resizeElementWidthNoOverlap(origin, desiredWidth);
    }

    // Sync UI with actual model sizes after adjustment
    this._selectedElement.width = origin.width;
    this._selectedElement.height = origin.height;

    this.drawRectangles();
  }

  public get selectedElement(): SelectedFurniture | null {
    return this._selectedElement;
  }

  public set selectedElementBody(selectedElement: FurnitureBody | null) {
    this._selectedElementBody = selectedElement;
  }

  public get selectedElementBody(): FurnitureBody | null {
    return this._selectedElementBody;
  }

  public onSelect(id: Event): void {
    console.log((id.target as HTMLInputElement)?.value);
    this.figureType = (id.target as HTMLInputElement)?.value;
  }

  public ngAfterViewInit() {
    this.eventHandler.initServices(this.drawSupport, this.modelManager);
    const canvasEl: HTMLCanvasElement = this.canvas?.nativeElement;
    const ctx = canvasEl.getContext('2d');
    if (!ctx) {
      console.error('2D canvas context not available');
      return;
    }
    this.cx = ctx;
    this.modelManager.cx = this.cx;

    this.width = canvasEl == null ? 400 : canvasEl.clientWidth;
    this.height = canvasEl == null ? 400 : canvasEl.clientHeight;
    canvasEl.width = this.width;
    canvasEl.height = this.height;

    this.eventTranslate.setCanvas(canvasEl);
    this.drawSupport.setCanvas(canvasEl);
    this.drawSupport.setModelManager(this.modelManager);

    this.eventTranslate.init();
    this.drawSupport.init(this.selectedElement$);

    this.captureEvents(canvasEl);
    this.keySub = fromEvent<KeyboardEvent>(window, 'keydown').subscribe((e) => {
  const isCtrlD = (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd';
  if (!isCtrlD) return;

  e.preventDefault();
  e.stopPropagation();

  const ids = this.modelManager.getSelectedElementIds?.() ?? [];
  if (ids.length === 0) return;

  this.modelManager.duplicateSelected(10, 10);
  this.drawRectangles();
});

  }

  @HostListener('mousewheel', ['$event'])
  public scroll(event: MouseEvent) {
    if (this.cx != null && event instanceof WheelEvent) {
      var scale =
        event.deltaY > 0
          ? this.scale < 4
            ? 1.1
            : 0
          : this.scale > 0.25
          ? 0.9
          : 0;

      if (
        scale != 0 &&
        ((this.scale < 4 && scale > 1) || (this.scale > 0.25 && scale < 1))
      ) {
        this.cx.scale(scale, scale);
        this.scale *= scale == 0 ? 1 : scale;
      }
      this.cx.beginPath();
      var point = this.toCanvas(this.cx.canvas.width, this.cx.canvas.height);
      this.cx.clearRect(0, 0, point.x, point.y);
      this.drawSupport.drawExistingElements();
    }
  }

  private toCanvas(x: number, y: number) {
    var matrix = this.cx.getTransform();
    var point = new DOMPoint(x, y);
    return point.matrixTransform(matrix);
  }

  private getCursor(): string {
    switch (this.figureType) {
      case 'select':
        return 'grab';
      case 'move':
        return 'move';
      case 'split_rectangle_horizontal':
        return 'n-resize';
      case 'split_rectangle_vertical':
        return 'w-resize';
    }
    return 'default';
  }

  public captureEvents(canvasEl: HTMLCanvasElement): void {
    this.selectedElement$.subscribe((event) => {
      this._selectedElement = event;
      if (event == null) {
        this._selectedElementBody = null;
        this.selectedFrontTypes = undefined;
        this.drawRectangles();
        return;
      }
      
      this.selectedFrontTypes = FurnitureElementType[event.furnitureType].toString().toLocaleLowerCase();
      this._selectedElementBody = this.modelManager.findBody(event.origin);

      this.drawRectangles(); 
    });

    fromEvent<MouseEvent>(canvasEl, 'mousemove').subscribe((event) => {
      const rect = canvasEl.getBoundingClientRect();
      var posX = event.clientX - rect.left;
      var posY = event.clientY - rect.top;
      var a = this.toWorld(posX, posY);

      if (this.figureType === 'move') {
        var split = this.modelManager.findSelectedSplit(a.x, a.y);
        if (split != null && this.canvas && this.canvas.nativeElement) {
          const cursorType = split.split instanceof HorizontalSplit ? 'n-resize' : 'w-resize';
          this.canvas.nativeElement.style.cursor = cursorType;
          this.highlightSplit(split);
          return;
        }
      }

      var elem = this.modelManager.findSelectedElement(a.x, a.y);
      if (elem == null && this.canvas != undefined) {
        this.canvas.nativeElement.style.cursor = 'default';
        this.clearHighlight();
      } else if (this.canvas != undefined) {
        this.canvas.nativeElement.style.cursor = this.getCursor();
        if (this.figureType === 'move' && elem != null) {
          this.highlightElement(elem);
        } else {
          this.clearHighlight();
        }
      }
    });

    this.eventTranslate.mouseEvents$.subscribe(
      (event: DiyFurnitureMouseEvent) => {
        this.eventHandler.onEvent(event);
        
        this.drawRectangles(); 
      }
    );

    this.modelEvent.subject$.subscribe((ev) => {
      this.drawRectangles();
    });
  }

  public ngOnChanges(changes: SimpleChanges): void {
    for (const propName in changes) {
      if (changes.hasOwnProperty(propName)) {
        if (propName === 'lineWidth') {
          const chng = changes[propName];
          console.log(chng);
          if (chng.currentValue && !chng.firstChange) {
            const cur = JSON.stringify(chng.currentValue);
            const prev = JSON.stringify(chng.previousValue);
            this.cx.lineWidth = chng.currentValue
              ? chng.currentValue
              : this.lineWidth;
            console.log(
              `${propName}: currentValue = ${cur}, previousValue = ${prev}`
            );
          }
        }
        if (propName === 'figureType') {
          const chng = changes[propName];
          console.log(chng);
          if (chng.currentValue && !chng.firstChange) {
            this.figureType = chng.currentValue
              ? chng.currentValue
              : this.figureType;
          }
        }
      }
    }
  }

  public onDrawActionChange(value: string): void {
    this.figureType = value;
    this.eventHandler.actionType = this.figureType;

    this.drawRectangles();
  }

  public drawRectangles(): void {
    const isMoveMode = this.figureType === 'move';

    this.drawSupport.drawExistingElements(isMoveMode);

    if (this.selectedElement) {
      const rect: Rectangle = {
        posX: this.selectedElement.origin.absoluteX,
        posY: this.selectedElement.origin.absoluteY,
        width: this.selectedElement.width,
        height: this.selectedElement.height
      };
      this.drawSupport.drawDimensions(rect);
    }
  }

  public deleteSelectedElement(): void {
    if (this.selectedElement) {
      // Remove the selected element from the model manager
      this.modelManager.removeElement(this.selectedElement.origin);
      // Clear the selection
      this.selectedElement = null;
      this.selectedElementBody = null;
      // Redraw the canvas
      this.drawRectangles();
    }
  }

  public clearAllElements(): void {
    // Clear all elements from the model manager
    this.modelManager.clearAllElements();
    // Clear any selections
    this.selectedElement = null;
    this.selectedElementBody = null;
    // Redraw the canvas to show empty state
    this.drawRectangles();
  }

  private toWorld(x: number, y: number) {
    var matrix = this.cx.getTransform();
    var inverseMatrix = matrix.inverse();
    var point = new DOMPoint(x, y);
    var transformed = point.matrixTransform(inverseMatrix);
    return transformed;
  }

  private debugLog(message: string, data?: any): void {
    console.log(`[DEBUG] ${message}`, data);
  }

  private highlightSplit(split: { element: FurnitureElement, split: HorizontalSplit | VerticalSplit }): void {
    if (!this.canvas) return;

    // Set red color for highlighting
    this.cx.strokeStyle = '#ff0000';
    this.cx.lineWidth = 3;

    // Draw highlight for the split line
    if (split.element instanceof FurnitureBody) {
      const bodyX = split.element.x + split.element.posX;
      const bodyY = split.element.y + split.element.posY;

      if (split.split instanceof HorizontalSplit) {
        const splitY = bodyY + split.split.relativePositionY;
        this.cx.beginPath();
        this.cx.moveTo(bodyX, splitY);
        this.cx.lineTo(bodyX + split.element.width, splitY);
        this.cx.stroke();
      } else if (split.split instanceof VerticalSplit) {
        const splitX = bodyX + split.split.relativePositionX;
        this.cx.beginPath();
        this.cx.moveTo(splitX, bodyY);
        this.cx.lineTo(splitX, bodyY + split.element.height);
        this.cx.stroke();
      }
    }
  }

  private highlightElement(element: FurnitureElement): void {
    if (!this.canvas) return;

    this.cx.strokeStyle = '#ff0000';
    this.cx.lineWidth = 3;

    const posX = element.absoluteX;
    const posY = element.absoluteY;

    this.cx.strokeRect(posX, posY, element.width, element.height);
  }

  private clearHighlight(): void {
    this.drawRectangles();
  }

  public onGenerateShelves(count: string): void {
    const shelfCount = parseInt(count, 10);
    if(this.selectedElement && shelfCount > 0) {
      this.modelManager.generateShelves(this.selectedElement.origin, shelfCount);
      this.drawRectangles();
    }
  }

  public exportPlan(): void {
    this.drawSupport.exportAsImage(`furniture-plan${new Date().getTime()}.png`);
    this.drawRectangles();
  }

  public get isDark(): boolean {
    return this.drawSupport.isDarkMode;
  }

  public toggleTheme(): void {
    this.drawSupport.toggleTheme();
    this.drawRectangles();
  }

  public loadProject(): void {
    this.apiService.getAllFurniture().subscribe({
      next: (furnitures: any[]) => {
        if (furnitures && furnitures.length > 0) {
          const lastSaved = furnitures[furnitures.length - 1];
          if (lastSaved.layout) {
            const loadedData = JSON.parse(lastSaved.layout);
            
            this.modelManager.loadFurnitures([loadedData]);
            
            this.drawRectangles();
            
            alert("Plan uploaded!");
          }
        }
      }
    });
  }

  public saveProject(): void {
    const allFurnitures = this.modelManager.getViewFurnitures();
    if (!allFurnitures || allFurnitures.length === 0) return;
    
    const rootFurniture = (allFurnitures[0] as any).model;

    if (rootFurniture) {
      const payload = {
        width: rootFurniture.width,
        heigth: rootFurniture.height,
        depth: rootFurniture.deepth || 0, 
        material: rootFurniture.material || 'pine',
        layout: JSON.stringify(rootFurniture)
      };

      this.apiService.saveFurniture(payload).subscribe({
        next: (res) => alert('Plan saved!'),
        error: (err) => {
          console.error('Error:', err);
          alert('Error while saving data.');
        }
      });
    }
  }
  
  public async undo(): Promise<void> {
    await this.modelManager.undo();
    this.selectedElement = null;
    this.selectedElementBody = null;
    this.drawRectangles();
  }
}
