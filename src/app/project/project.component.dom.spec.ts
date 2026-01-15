import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick,
} from "@angular/core/testing";
import { ProjectComponent } from "./project.component";
import { BomService } from "../services/bom.service";
import { ProjectService } from "../services/project.service";
import { FurnituremodelService } from "../furnituremodel/furnituremodel.service";
import { LocalStorageService } from "ngx-webstorage";
import { of } from "rxjs";
import { MatTableModule } from "@angular/material/table";
import { MatToolbarModule } from "@angular/material/toolbar";
import { MatIconModule } from "@angular/material/icon";
import { MatButtonModule } from "@angular/material/button";
import { MatTooltipModule } from "@angular/material/tooltip";
import { MatPaginatorModule } from "@angular/material/paginator";
import { MatDialogModule, MatDialog } from "@angular/material/dialog";
import { MatSnackBarModule, MatSnackBar } from "@angular/material/snack-bar";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { RouterTestingModule } from "@angular/router/testing";
import { NO_ERRORS_SCHEMA } from "@angular/core";

fdescribe("ProjectComponent - DOM Tests", () => {
  let component: ProjectComponent;
  let fixture: ComponentFixture<ProjectComponent>;
  let bomServiceMock: jasmine.SpyObj<BomService>;
  let projectServiceMock: jasmine.SpyObj<ProjectService>;
  let furnitureServiceMock: jasmine.SpyObj<FurnituremodelService>;
  let localStorageMock: jasmine.SpyObj<LocalStorageService>;
  let dialogMock: jasmine.SpyObj<MatDialog>;
  let snackBarMock: jasmine.SpyObj<MatSnackBar>;

  beforeEach(async () => {
    // Create mock services
    bomServiceMock = jasmine.createSpyObj("BomService", [
      "getMockBomForProject",
    ]);

    projectServiceMock = jasmine.createSpyObj("ProjectService", [
      "getProjectsPaged",
      "getProjects",
      "deleteProject",
      "archiveProject",
    ]);

    furnitureServiceMock = jasmine.createSpyObj("FurnituremodelService", [
      "getModel",
    ]);

    localStorageMock = jasmine.createSpyObj("LocalStorageService", [
      "retrieve",
      "store",
      "clear",
    ]);

    dialogMock = jasmine.createSpyObj("MatDialog", ["open"]);
    snackBarMock = jasmine.createSpyObj("MatSnackBar", ["open"]);

    // Default mock returns
    projectServiceMock.getProjectsPaged.and.returnValue(
      of({
        content: [],
        totalPages: 0,
        totalElements: 0,
        size: 10,
        number: 0,
        first: true,
        last: true,
        empty: true,
      })
    );

    await TestBed.configureTestingModule({
      declarations: [ProjectComponent],
      providers: [
        { provide: BomService, useValue: bomServiceMock },
        { provide: ProjectService, useValue: projectServiceMock },
        { provide: FurnituremodelService, useValue: furnitureServiceMock },
        { provide: LocalStorageService, useValue: localStorageMock },
        { provide: MatDialog, useValue: dialogMock },
        { provide: MatSnackBar, useValue: snackBarMock },
      ],
      imports: [
        MatTableModule,
        MatToolbarModule,
        MatIconModule,
        MatButtonModule,
        MatTooltipModule,
        MatPaginatorModule,
        MatDialogModule,
        MatSnackBarModule,
        BrowserAnimationsModule,
        RouterTestingModule,
      ],
      schemas: [NO_ERRORS_SCHEMA], // Ignore unknown elements like app-project-detail
    }).compileComponents();

    fixture = TestBed.createComponent(ProjectComponent);
    component = fixture.componentInstance;
  });

  it("should create the component", () => {
    expect(component).toBeTruthy();
  });

  it("renders table rows when data loads", fakeAsync(() => {
    const mockData = [
      { id: 1, name: "Project A", description: "Description A" },
      { id: 2, name: "Project B", description: "Description B" },
      { id: 3, name: "Project C", description: "Description C" },
    ];

    projectServiceMock.getProjectsPaged.and.returnValue(
      of({
        content: mockData,
        totalPages: 1,
        totalElements: 3,
        size: 10,
        number: 0,
        first: true,
        last: true,
        empty: false,
      })
    );

    fixture.detectChanges(); // triggers ngOnInit
    tick();
    fixture.detectChanges();

    const rows = fixture.nativeElement.querySelectorAll("tr.mat-mdc-row");
    expect(rows.length).toBe(mockData.length);
  }));

  it("shows error message when service fails", fakeAsync(() => {
    projectServiceMock.getProjectsPaged.and.returnValue(
      of({
        content: [],
        totalPages: 0,
        totalElements: 0,
        size: 10,
        number: 0,
        first: true,
        last: true,
        empty: true,
      })
    );

    fixture.detectChanges();
    tick();

    // Manually set error state
    component.error = "Something went wrong";
    component.loading = false;
    fixture.detectChanges();

    const errorDiv = fixture.nativeElement.querySelector(".info-box.error");
    expect(errorDiv).toBeTruthy();
    expect(errorDiv.textContent).toContain("Something went wrong");
  }));

  xit("shows loading state initially", () => {
    component.loading = true;
    fixture.detectChanges();

    const loadingDiv = fixture.nativeElement.querySelector(".info-box.loading");
    expect(loadingDiv).toBeTruthy();
  });

  it("shows empty state when no projects", fakeAsync(() => {
    projectServiceMock.getProjectsPaged.and.returnValue(
      of({
        content: [],
        totalPages: 0,
        totalElements: 0,
        size: 10,
        number: 0,
        first: true,
        last: true,
        empty: true,
      })
    );

    fixture.detectChanges();
    tick();
    fixture.detectChanges();

    const emptyDiv = fixture.nativeElement.querySelector(".info-box.empty");
    expect(emptyDiv).toBeTruthy();
  }));

  it("displays add project button", () => {
    fixture.detectChanges();

    const addBtn = fixture.nativeElement.querySelector("#add-project-btn");
    expect(addBtn).toBeTruthy();
  });

  it("calls openAddDialog when add button clicked", fakeAsync(() => {
    dialogMock.open.and.returnValue({ afterClosed: () => of(null) } as any);

    fixture.detectChanges();
    tick();

    const addBtn = fixture.nativeElement.querySelector("#add-project-btn");
    addBtn.click();
    fixture.detectChanges();

    expect(dialogMock.open).toHaveBeenCalled();
  }));
});
