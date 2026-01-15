import { ComponentFixture, TestBed, fakeAsync, tick } from "@angular/core/testing";
import { of, throwError } from "rxjs";
import { ProjectComponent } from "./project.component";
import { BomService } from "../services/bom.service";
import { LocalStorageService } from "ngx-webstorage";
import { Project, ProjectService } from "../services/project.service";
import { MatSnackBar } from "@angular/material/snack-bar";
import { MatDialog } from "@angular/material/dialog";
import { CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";

describe("ProjectComponent", () => {
  let component: ProjectComponent;
  let fixture: ComponentFixture<ProjectComponent>;
  
  // Define variables for mocks
  let bomServiceMock: any;
  let mockProjectService: jasmine.SpyObj<ProjectService>;
  let mockSnackBar: jasmine.SpyObj<MatSnackBar>;
  let mockDialog: jasmine.SpyObj<MatDialog>;

  beforeEach(async () => {
    // 1. Initialize Mocks
    mockProjectService = jasmine.createSpyObj('ProjectService', ['deleteProject', 'createProject']);
    mockSnackBar = jasmine.createSpyObj('MatSnackBar', ['open']);
    mockDialog = jasmine.createSpyObj('MatDialog', ['open']);
    
    bomServiceMock = {
      getMockBomForProject: jasmine.createSpy("getMockBomForProject"),
      getBomForProject: jasmine.createSpy("getBomForProject").and.returnValue(of([]))
    };

    const localStorageMock = {
      retrieve: jasmine.createSpy("retrieve"),
      store: jasmine.createSpy("store"),
      clear: jasmine.createSpy("clear"),
    };

    // 2. Configure TestBed
    await TestBed.configureTestingModule({
      declarations: [ProjectComponent],
      schemas: [CUSTOM_ELEMENTS_SCHEMA], 
      providers: [
        { provide: BomService, useValue: bomServiceMock },
        { provide: LocalStorageService, useValue: localStorageMock },
        { provide: ProjectService, useValue: mockProjectService },
        { provide: MatSnackBar, useValue: mockSnackBar },
        { provide: MatDialog, useValue: mockDialog },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProjectComponent);
    component = fixture.componentInstance;
  });

  // --- EXISTING TESTS ---

  it("loads data successfully on init", () => {
    const mockData = [{ id: 1, name: "Item 1" }, { id: 2, name: "Item 2" }];
    
    // FIX 2: Use .and.returnValue
    bomServiceMock.getMockBomForProject.and.returnValue(of(mockData));

    component.ngOnInit();

    expect(component.loading).toBe(false);
    expect(component.error).toBe("");
    expect(component.dataSource).toEqual(mockData);
  });

  it("shows error message when service fails", () => {
    // FIX 3: Use .and.returnValue
    bomServiceMock.getMockBomForProject.and.returnValue(
      throwError(() => new Error("fail"))
    );

    component.ngOnInit();

    expect(component.loading).toBe(false);
    expect(component.error).toBe("Something went wrong when fetching data.");
    expect(component.dataSource.length).toBe(0);
  });

  it("toggleView switches animatedView", () => {
    const initial = component.animatedView;
    component.toggleView();
    expect(component.animatedView).toBe(!initial);
  });

  it("openItem sets detail state", () => {
    const item = { id: 5, name: "Test Project" };
    component.openItem(item);

    expect(component.selectedItem).toBe(item);
    expect(component.showDetail).toBe(true);
  });

  it("closeDetail clears detail state", () => {
    component.selectedItem = { id: 1, name: "Test Project" };
    component.showDetail = true;

  it("deleteItem removes item", () => {
    spyOn(window, "confirm").and.returnValue(true);
    component.dataSource = [{ id: 1, name: "Test Project"}, { id: 2, name: "Another Project"}];
    component.deleteItem({ id: 1, name: "Test Project" } as any);
    expect(component.dataSource).toEqual([{ id: 2, name: "Another Project"}]);
  });

  it("retry resets error and reloads", () => {
    const spy = spyOn(component, "ngOnInit");
    component.error = "x";

    component.retry();

    expect(component.error).toBe("");
    expect(component.loading).toBe(true);
    expect(spy).toHaveBeenCalled();
  });

  // --- NEW / UPDATED TESTS ---

  it('openAddDialog should add new item to table when dialog returns data', () => {
    const newItem = { id: 999, name: 'New Item', width: 10, height: 10, depth: 10 };
    
    const dialogRefSpy = jasmine.createSpyObj({ afterClosed: of(newItem) });
    mockDialog.open.and.returnValue(dialogRefSpy);

    component.dataSource = []; 

    component.openAddDialog();

    expect(mockDialog.open).toHaveBeenCalled();
    expect(component.dataSource.length).toBe(1);
    expect(component.dataSource[0]).toEqual(newItem);
  });

  it('deleteItem should call service and remove item on user confirmation & success', fakeAsync(() => {
    const itemToDelete = { id: 10, name: 'Chair' };
    const otherItem = { id: 11, name: 'Table' };
    component.dataSource = [itemToDelete, otherItem];

    spyOn(window, 'confirm').and.returnValue(true);
    
    mockProjectService.deleteProject.and.returnValue(Promise.resolve());

    component.deleteItem(itemToDelete);
    tick();

    expect(mockProjectService.deleteProject).toHaveBeenCalledWith(10);
    expect(component.dataSource.length).toBe(1);
    expect(component.dataSource[0]).toEqual(otherItem);
    expect(mockSnackBar.open).toHaveBeenCalledWith(jasmine.stringMatching(/success/i), 'Close', jasmine.any(Object));
  }));

  it('deleteItem should NOT call service if user cancels confirmation', () => {
    const item = { id: 10, name: 'Desk' };
    component.dataSource = [item];
    
    spyOn(window, 'confirm').and.returnValue(false);

    component.deleteItem(item);

    expect(mockProjectService.deleteProject).not.toHaveBeenCalled();
    expect(component.dataSource.length).toBe(1);
  });

  it('deleteItem should NOT remove item from table if API fails', fakeAsync(() => {
    const item = { id: 10, name: 'Lamp' };
    component.dataSource = [item];

    spyOn(window, 'confirm').and.returnValue(true);
    
    mockProjectService.deleteProject.and.returnValue(Promise.reject('Network Error'));

    component.deleteItem(item);
    tick();

    expect(mockProjectService.deleteProject).toHaveBeenCalled();
    expect(component.dataSource.length).toBe(1);
    expect(mockSnackBar.open).toHaveBeenCalledWith(jasmine.stringMatching(/failed/i), 'Close', jasmine.any(Object));
  }));
});
});