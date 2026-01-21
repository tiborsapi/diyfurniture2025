import { Observable, BehaviorSubject } from 'rxjs';
import { pairwise, switchMap, takeUntil } from 'rxjs/operators';
import {
  DiyFurnitureMouseEvent,
  MyMouseEventType,
} from 'src/app/draw2d/lib/model/my-mouse-event.model';
import { Injectable } from '@angular/core';
import { FurnitureModelManagerService } from '../model/furniture-model-manager.service';
import { Rectangle, SelectedFurniture } from 'src/app/draw2d/lib/model/furniture-body.model';

@Injectable()
export class Draw2DSupportService {

  constructor(private _modelManager: FurnitureModelManagerService){};
  public setModelManager(modelManager: FurnitureModelManagerService) {
    this._modelManager = modelManager;
  }
  private selectedElement$ : BehaviorSubject<SelectedFurniture | null> | null = null;
  private _cx: CanvasRenderingContext2D | null = null;
  private _canvas: HTMLCanvasElement | null = null;
  private _selectedElement: SelectedFurniture | null = null;

  private selectedElements$ : BehaviorSubject<SelectedFurniture[]> | null = null;
  private _selectedElements: SelectedFurniture[] = [];

//  private _modelManager: FurnitureModelManagerService | null = null;

  private _isDarkMode: boolean = true;

  public set selectedElement(elem: SelectedFurniture | null) {
    this._selectedElement = elem;
  }

  private get modelManager(): FurnitureModelManagerService {
    return this._modelManager
  }

  public get cx() {
    return this._cx == null ? new CanvasRenderingContext2D() : this._cx;
  }

  public get canvas() {
    return this._canvas == null ? new HTMLCanvasElement() : this._canvas;
  }

  public get isDarkMode(): boolean {
    return this._isDarkMode;
  }

  public toggleTheme(): void {
    this._isDarkMode = !this._isDarkMode;
  }

  setCanvas(canvas: HTMLCanvasElement): void {
    this._canvas = canvas;
    this._cx = canvas.getContext('2d');
  }

    init(
    selectedElement$: BehaviorSubject<SelectedFurniture | null>,
    selectedElements$?: BehaviorSubject<SelectedFurniture[]>
  ) {
    this.cx.lineWidth = 1;
    this.cx.lineCap = 'round';
    this.cx.strokeStyle = this._isDarkMode ? '#fff' : '#000';
    this.selectedElement$ = selectedElement$;

    selectedElement$.subscribe((event) => {
      this._selectedElement = event;
    });

    if (selectedElements$) {
      this.selectedElements$ = selectedElements$;
      selectedElements$.subscribe((arr) => {
        this._selectedElements = arr ?? [];
      });
    }
  }

  // public drawExistingElements(isMoveMode: boolean = false): void {
  //   const elements = this.modelManager.getFurnitureBodies();
    
  //   elements.forEach(body => {
  //     // const startX = Number(body.x) || 0;
  //     // const startY = Number(body.y) || 0;
  //     this.cx.save();
  //     this.cx.translate(body.x, body.y);

  //     this.cx.strokeStyle = this.isDarkMode ? '#ffffff' : '#444444';
  //     this.cx.lineWidth = 2;
  //     this.cx.strokeRect(0, 0, body.width, body.height);

  //     // Belső szerkezet (shelves/splits) rajzolása
  //     // Ha a body.model vagy body.split létezik, átadjuk a rekurzív rajzolónak
  //     if (body.split) {
  //       this.drawRecursive(body, 0, 0);
  //     }
  //   });
  // }

  public changeSelectedElement(element: SelectedFurniture | null): void {
      console.log('[SEL] changeSelectedElement CALLED -> this will reset multi if not fixed');

  this._selectedElement = element;
  this.selectedElement$?.next(element);
  this.drawExistingElements(true);
}



  public drawExistingElements(showGrid: boolean = false): void {
    this.cx.save();
    this.cx.setTransform(1, 0, 0, 1, 0, 0);
    
    this.cx.fillStyle = this._isDarkMode ? '#2c2c2c' : '#ffffff';
    this.cx.fillRect(0, 0, this.cx.canvas.width, this.cx.canvas.height);
    this.cx.restore();

    if (showGrid) {
      this.drawGrid(this.cx.canvas.width, this.cx.canvas.height);
    }

    for (var furnitureBody of this.modelManager.getViewFurnitures()) {
      furnitureBody.draw(0, 0, this);
    }
    this.drawSelectionOverlay();

  }

  private toCanvas(x: number, y: number) {
    var matrix = this.cx.getTransform();
    var point = new DOMPoint(x, y);
    return point.matrixTransform(matrix);
  }

  public drawLine(
    startPosX: number,
    startPosY: number,
    endPosX: number,
    endPosY: number
  ): void {
    this.cx.beginPath();
    this.cx.moveTo(startPosX, startPosY);
    this.cx.lineTo(endPosX, endPosY);
    this.cx.stroke();
  }

  public setDrawColor(color: string): void {
    this.cx.strokeStyle = color;
  }

  public clearScrean(): void {
    this.cx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  public translatePage(x: number, y: number): void {
    this.cx.translate(x, y);
  }

  public drawRectangle(rectangle: Rectangle): void {
    const element = rectangle as any;
    const materialColor = this.getMaterialColor(element.material);
    
    const defaultStrokeColor = this._isDarkMode ? '#ffffff' : '#000000';

    this.cx.beginPath();
    this.cx.strokeStyle = (materialColor && materialColor !== 'transparent') ? materialColor : defaultStrokeColor;
    this.cx.lineWidth = 3;
    this.cx.strokeRect(rectangle.posX, rectangle.posY, rectangle.width, rectangle.height);
  }

  private getMaterialColor(material: string | undefined): string {
    switch(material) {
      case 'oak': return '#8b4513';
      case 'pine': return '#deb887';
      case 'beech': return '#cd853f';
      case 'walnut': return '#5d3a1a';
      case 'maple': return '#f4a460';

      case 'white': return '#ffffff';
      case 'antracite': return '#2f4f4f';
      case 'lightgray': return '#d3d3d3';
      case 'black': return '#1a1a1a';

      default: return '#000';
    }
  }

  public drawDimensions(rect: Rectangle): void {
    const offset = 25;
    const tickSize = 5;
    
    this.cx.save();
    this.cx.beginPath();
    this.cx.strokeStyle = '#ff00ff';
    this.cx.fillStyle = '#ff00ff';
    this.cx.font = 'bold 12px Arial';
    this.cx.lineWidth = 1;

    const yPos = rect.posY - offset;
    this.drawLine(rect.posX, yPos, rect.posX + rect.width, yPos);
    this.drawLine(rect.posX, yPos - tickSize, rect.posX, yPos + tickSize);
    this.drawLine(rect.posX + rect.width, yPos - tickSize, rect.posX + rect.width, yPos + tickSize);
    const widthText = `${Math.round(rect.width * 10)} mm`;
    this.cx.fillText(widthText, rect.posX + (rect.width / 2) - 20, yPos - 8);

    const xPos = rect.posX - offset;
    this.drawLine(xPos, rect.posY, xPos, rect.posY + rect.height);
    this.drawLine(xPos - tickSize, rect.posY, xPos + tickSize, rect.posY);
    this.drawLine(xPos - tickSize, rect.posY + rect.height, xPos + tickSize, rect.posY + rect.height);
    
    const heightText = `${Math.round(rect.height * 10)} mm`;
    this.cx.save();
    this.cx.translate(xPos - 8, rect.posY + (rect.height / 2) + 20);
    this.cx.rotate(-Math.PI / 2);
    this.cx.fillText(heightText, 0, 0);
    this.cx.restore();

    this.cx.restore();
  }

  public drawGrid(width: number, height: number): void {
    const smallGrid = 10;
    const largeGrid = 50;
    
    this.cx.save();
    const start = this.toCanvas(-2000, -2000);
    const end = this.toCanvas(4000, 4000);

    const dotColor = this._isDarkMode ? '255, 255, 255' : '0, 0, 0';

    for (let x = Math.round(start.x / smallGrid) * smallGrid; x < end.x; x += smallGrid) {
      for (let y = Math.round(start.y / smallGrid) * smallGrid; y < end.y; y += smallGrid) {

        if (x % largeGrid === 0 && y % largeGrid === 0) {
          this.cx.fillStyle = `rgba(${dotColor}, 0.5)`;
          this.cx.fillRect(x, y, 2, 2);
        } else {
          this.cx.fillStyle = `rgba(${dotColor}, 0.15)`;
          this.cx.fillRect(x, y, 1, 1);
        }
      }
    }
    this.cx.restore();
  }

    public exportAsImage(fileName: string = 'my-furniture-plan.png'): void {
      this.drawExistingElements(false);

      const dataUrl = this.canvas.toDataURL('image/png');

      const link = document.createElement('a');
      link.download = fileName;
      link.href = dataUrl;
      link.click();
    }
    public changeSelectedElements(elements: SelectedFurniture[]): void {
        console.log('[SEL] changeSelectedElements CALLED count=', elements?.length);

  this._selectedElements = elements ?? [];
  this.selectedElements$?.next(this._selectedElements);

  const active = this._selectedElements.length > 0 ? this._selectedElements[0] : null;
  this._selectedElement = active;
  this.selectedElement$?.next(active);

  this.drawExistingElements(true);
}

    private drawSelectionOverlay(): void {
    const elems = this._selectedElements.length > 0
      ? this._selectedElements
      : (this._selectedElement ? [this._selectedElement] : []);

    if (elems.length === 0) return;

    this.cx.save();
    this.cx.lineWidth = 2;
    this.cx.setLineDash([6, 4]);
    this.cx.strokeStyle = '#ffcc66';

    for (const e of elems) {
      this.cx.strokeRect(e.posX, e.posY, e.width, e.height);
    }

    this.cx.restore();
  }

  private drawRecursive(element: any, offsetX: number, offsetY: number): void {
    if (!element) return;

    const x = offsetX + (element.posX || 0);
    const y = offsetY + (element.posY || 0);
    
    this.cx.strokeStyle = this.isDarkMode ? '#ffffff' : '#444444';
    this.cx.lineWidth = 1;
    this.cx.strokeRect(x, y, element.width, element.height);

    if (element.split) {
      if (element.split.topElement) {
        this.drawRecursive(element.split.topElement, offsetX, offsetY);
        this.drawRecursive(element.split.bottomElement, offsetX, offsetY);
      } else if (element.split.leftElement) {
        this.drawRecursive(element.split.leftElement, offsetX, offsetY);
        this.drawRecursive(element.split.rightElement, offsetX, offsetY);
      }
    }
  }
}


