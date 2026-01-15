import { ModelchangeService } from "./lib/eventhandling/modelchange.service";
import { EventHandlerManagerService } from "./lib/eventhandling/event-handler-manager.service";
import {
  Component,
  Input,
  ElementRef,
  AfterViewInit,
  ViewChild,
  SimpleChanges,
  HostListener,
} from "@angular/core";
import { BehaviorSubject, from, fromEvent, Observable, of } from "rxjs";
import { DiyFurnitureMouseEvent } from "./lib/model/my-mouse-event.model";
import {
  FurnitureBody,
  FurnitureElement,
  FurnitureElementType,
  Rectangle,
  SelectedFurniture,
  HorizontalSplit,
  VerticalSplit,
} from "./lib/model/furniture-body.model";
import { FurnitureModelManagerService } from "./lib/model/furniture-model-manager.service";
import { EventTranslateService } from "./lib/eventhandling/event-translate.service";
import { Draw2DSupportService } from "./lib/draw/draw2-dsupport.service";
import { MatSelectChange } from "@angular/material/select";
import { ProjectService } from "../services/project.service";
import {
  BodyDto,
  CreateProjectDto,
  ProjectDetailResponse,
  UpdateProjectRequest,
} from "../models/project.models";
import {
  AddItemDialogComponent,
  AddItemDialogData,
} from "../project/add-item-dialog/add-item-dialog.component";
import { MatDialog } from "@angular/material/dialog";
import { ActivatedRoute, Router } from "@angular/router";

import { MatSnackBar } from "@angular/material/snack-bar";

interface FrontType {
  value: string;
  viewValue: string;
}

@Component({
  selector: "app-draw2d",
  templateUrl: "./draw2d.component.html",
  styleUrls: ["./draw2d.component.scss"],
  providers: [
    FurnitureModelManagerService,
    Draw2DSupportService,
    EventTranslateService,
    EventHandlerManagerService,
  ],
  standalone: false,
})
export class Draw2dComponent implements AfterViewInit {
  constructor(
    private modelManager: FurnitureModelManagerService,
    private drawSupport: Draw2DSupportService,
    private eventTranslate: EventTranslateService,
    private eventHandler: EventHandlerManagerService,
    private modelEvent: ModelchangeService,
    private projectService: ProjectService,
    private dialog: MatDialog,
    private route: ActivatedRoute,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  @ViewChild("canvas") public canvas?: ElementRef;

  public isLoading = false;

  private width = 400;
  private height = 400;
  @Input("lineWidth") lineWidth: number = 1;
  public figureType: string = "crop_square";

  private cx!: CanvasRenderingContext2D;

  private scale: number = 1;

  private _selectedElement: SelectedFurniture | null = null;

  private _selectedElementBody: FurnitureBody | null = null;

  public currentProjectId: number | null = null;
  public currentProjectName: string | null = null;
  public currentVersionNumber: number | null = null;
  public hasUnsavedChanges: boolean = false;

  private selectedElement$: BehaviorSubject<SelectedFurniture | null> =
    new BehaviorSubject<SelectedFurniture | null>(null);

  private mapStringToFurnitureElementType(str: string): FurnitureElementType {
    let color = str.toLocaleUpperCase() as keyof typeof FurnitureElementType;
    return FurnitureElementType[color];
  }

  public selectFrontType(elem: MatSelectChange) {
    if (this.selectedElement == undefined) {
      return;
    }
    this.selectedElement.origin.type = this.mapStringToFurnitureElementType(
      elem.value
    );
    this.selectedElement.furnitureType = this.mapStringToFurnitureElementType(
      elem.value
    );
    this.modelManager.refresh(this.selectedElement.origin);
  }

  frontTypes: FrontType[] = [
    { value: "door", viewValue: "Door" },
    { value: "drawer", viewValue: "Drawer" },
  ];

  selectedFrontTypes: string | undefined;

  public set selectedElement(selectedElement: SelectedFurniture | null) {
    this.selectedElement$.next(selectedElement);
  }

  public changeBodyDetails(): void {
    if (this._selectedElementBody != null) {
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
      this.modelManager.resizeElementHeightPreservingPercent(
        origin,
        desiredHeight
      );
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
    const ctx = canvasEl.getContext("2d");
    if (!ctx) {
      console.error("2D canvas context not available");
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

    this.route.params.subscribe((params) => {
      const projectId = params["id"];
      if (projectId) {
        this.loadProject(Number(projectId));
      }
    });

    this.modelEvent.subject$.subscribe(() => {
      if (this.currentProjectId) {
        this.hasUnsavedChanges = true;
      }
    });
  }

  @HostListener("mousewheel", ["$event"])
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
      case "select":
        return "grab";
      case "move":
        return "move";
      case "split_rectangle_horizontal":
        return "n-resize";
      case "split_rectangle_vertical":
        return "w-resize";
    }
    return "default";
  }
  public captureEvents(canvasEl: HTMLCanvasElement): void {
    this.selectedElement$.subscribe((event) => {
      this._selectedElement = event;
      if (event == null) {
        this._selectedElementBody = null;
        this.selectedFrontTypes = undefined;
        return;
      }
      this.selectedFrontTypes = FurnitureElementType[event.furnitureType]
        .toString()
        .toLocaleLowerCase();
      this._selectedElementBody = this.modelManager.findBody(event.origin);
    });

    fromEvent<MouseEvent>(canvasEl, "mousemove").subscribe((event) => {
      const rect = canvasEl.getBoundingClientRect();
      var posX = event.clientX - rect.left;
      var posY = event.clientY - rect.top;
      var a = this.toWorld(posX, posY);

      this.debugLog("Mouse move event:", {
        clientX: event.clientX,
        clientY: event.clientY,
        canvasX: posX,
        canvasY: posY,
        worldX: a.x,
        worldY: a.y,
        figureType: this.figureType,
      });

      // Check for split lines first (in move mode)
      if (this.figureType === "move") {
        var split = this.modelManager.findSelectedSplit(a.x, a.y);
        this.debugLog("Split detection result:", split);
        if (split != null && this.canvas && this.canvas.nativeElement) {
          this.debugLog("Split found, setting cursor");
          const cursorType =
            split.split instanceof HorizontalSplit ? "n-resize" : "w-resize";
          this.debugLog("Setting cursor to:", cursorType);
          try {
            this.canvas.nativeElement.style.cursor = cursorType;
            this.debugLog(
              "Cursor set successfully to:",
              this.canvas.nativeElement.style.cursor
            );
          } catch (error) {
            this.debugLog("Error setting cursor:", error);
          }
          this.highlightSplit(split);
          return;
        }
      }

      var elem = this.modelManager.findSelectedElement(a.x, a.y);
      this.debugLog("Element detection result:", elem);
      if (elem == null && this.canvas != undefined) {
        this.canvas.nativeElement.style.cursor = "default";
        this.clearHighlight();
      } else if (this.canvas != undefined) {
        this.canvas.nativeElement.style.cursor = this.getCursor();
        if (this.figureType === "move" && elem != null) {
          this.highlightElement(elem);
        } else {
          this.clearHighlight();
        }
      }
    });
    this.eventTranslate.mouseEvents$.subscribe(
      (event: DiyFurnitureMouseEvent) => {
        this.eventHandler.onEvent(event);
      }
    );

    this.modelEvent.subject$.subscribe((ev) => {
      this.drawSupport.drawExistingElements();
    });
  }
  public ngOnChanges(changes: SimpleChanges): void {
    for (const propName in changes) {
      if (changes.hasOwnProperty(propName)) {
        if (propName === "lineWidth") {
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
        if (propName === "figureType") {
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
  }

  public drawRectangles(): void {
    this.drawSupport.drawExistingElements();
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

  private highlightSplit(split: {
    element: FurnitureElement;
    split: HorizontalSplit | VerticalSplit;
  }): void {
    if (!this.canvas) return;

    // Set red color for highlighting
    this.cx.strokeStyle = "#ff0000";
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

    // Set red color for highlighting
    this.cx.strokeStyle = "#ff0000";
    this.cx.lineWidth = 3;

    // Always use absolute coordinates so highlights align with drawn elements
    const posX = element.absoluteX;
    const posY = element.absoluteY;

    this.cx.strokeRect(posX, posY, element.width, element.height);
  }

  private clearHighlight(): void {
    // Redraw everything to clear any highlights
    this.drawSupport.drawExistingElements();
  }

  public saveProject(): void {
    const bodies = this.modelManager.getBodiesForApi();

    if (this.currentProjectId) {
      this.updateExistingProject(bodies);
      return;
    }

    this.createNewProject(bodies);
  }

  private createNewProject(bodies: BodyDto[]): void {
    const dialogData: AddItemDialogData = { bodies };

    const dialogRef = this.dialog.open(AddItemDialogComponent, {
      width: "400px",
      data: dialogData,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.currentProjectId = result.id;
        this.currentProjectName = result.name;
        this.currentVersionNumber = 1; // Első verzió
        this.hasUnsavedChanges = false;
      }
    });
  }

  private updateExistingProject(bodies: BodyDto[]): void {
    if (!this.currentProjectId || !this.currentProjectName) return;

    const request: UpdateProjectRequest = {
      name: this.currentProjectName,
      description: "",
      bodies: bodies,
    };

    this.projectService
      .updateProject(this.currentProjectId, request)
      .subscribe({
        next: (response) => {
          // Verzió számot növeljük
          this.currentVersionNumber = (this.currentVersionNumber || 0) + 1;
          this.hasUnsavedChanges = false;

          this.snackBar.open(
            `Saved as version ${this.currentVersionNumber}!`,
            "Close",
            {
              duration: 3000,
              horizontalPosition: "right",
              verticalPosition: "top",
              panelClass: ["success-snackbar"],
            }
          );
        },
        error: (err) => {
          console.error("Update failed", err);
          this.snackBar.open("Failed to save", "Close", {
            duration: 3000,
            panelClass: ["error-snackbar"],
          });
        },
      });
  }

  // Új metódus - projekt betöltése
  private loadProject(projectId: number): void {
    this.isLoading = true;

    this.projectService.getProjectDetail(projectId).subscribe({
      next: (project: ProjectDetailResponse) => {
        this.currentProjectId = project.id;
        this.currentProjectName = project.name;

        // Legutolsó version
        const latestVersion = project.versions[project.versions.length - 1];
        if (latestVersion) {
          this.currentVersionNumber = latestVersion.versionNumber; // ÚJ

          if (latestVersion.bodies.length > 0) {
            this.modelManager.clearMemory();
            this.modelManager.loadBodiesFromProject(latestVersion.bodies);
            this.drawRectangles();
          }
        }

        this.hasUnsavedChanges = false; // Frissen betöltve, nincs unsaved
        this.isLoading = false;
      },
      error: (err) => {
        console.error("Failed to load project:", err);
        this.isLoading = false;
      },
    });
  }
}
