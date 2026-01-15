import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ProjectDetailComponent } from "../project-detail.component";
import { ProjectService } from "../../../services/project.service";
import { MatSnackBar } from "@angular/material/snack-bar";
import { MatDialog } from "@angular/material/dialog";
import { of } from "rxjs";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { MatIconModule } from "@angular/material/icon";
import { MatButtonModule } from "@angular/material/button";
import { MatTooltipModule } from "@angular/material/tooltip";
import { SimpleChange, SimpleChanges } from "@angular/core";
import {
  createMockProjectService,
  createMockSnackBar,
  createMockDialog,
} from "./test-helpers";

describe("ProjectDetailComponent - Basic", () => {
  let component: ProjectDetailComponent;
  let fixture: ComponentFixture<ProjectDetailComponent>;
  let projectServiceSpy: jasmine.SpyObj<ProjectService>;
  let snackBarSpy: jasmine.SpyObj<MatSnackBar>;
  let dialogSpy: jasmine.SpyObj<MatDialog>;

  beforeEach(async () => {
    projectServiceSpy = createMockProjectService();
    snackBarSpy = createMockSnackBar();
    dialogSpy = createMockDialog();

    await TestBed.configureTestingModule({
      declarations: [ProjectDetailComponent],
      imports: [
        NoopAnimationsModule,
        MatIconModule,
        MatButtonModule,
        MatTooltipModule,
      ],
      providers: [
        { provide: ProjectService, useValue: projectServiceSpy },
        { provide: MatSnackBar, useValue: snackBarSpy },
        { provide: MatDialog, useValue: dialogSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProjectDetailComponent);
    component = fixture.componentInstance;
  });

  describe("Component Creation", () => {
    it("should create", () => {
      expect(component).toBeTruthy();
    });

    it("should have default values", () => {
      expect(component.projectId).toBeNull();
      expect(component.isOpen).toBeFalse();
      expect(component.loading).toBeFalse();
      expect(component.error).toBe("");
      expect(component.project).toBeNull();
      expect(component.selectedVersion).toBeNull();
      expect(component.bodiesViewMode).toBe("grid");
      expect(component.restoringVersion).toBeFalse();
    });
  });

  describe("ngOnInit", () => {
    it("should not load project if projectId is null", () => {
      component.projectId = null;
      component.isOpen = true;
      component.ngOnInit();
      expect(projectServiceSpy.getProjectDetail).not.toHaveBeenCalled();
    });

    it("should not load project if isOpen is false", () => {
      component.projectId = 1;
      component.isOpen = false;
      component.ngOnInit();
      expect(projectServiceSpy.getProjectDetail).not.toHaveBeenCalled();
    });

    it("should load project if projectId exists and isOpen is true", () => {
      component.projectId = 1;
      component.isOpen = true;
      component.ngOnInit();
      expect(projectServiceSpy.getProjectDetail).toHaveBeenCalledWith(1);
    });
  });

  describe("ngOnChanges", () => {
    it("should reload when projectId changes and panel is open", () => {
      component.projectId = 1;
      component.isOpen = true;
      const changes: SimpleChanges = {
        projectId: new SimpleChange(null, 1, false),
      };
      component.ngOnChanges(changes);
      expect(projectServiceSpy.getProjectDetail).toHaveBeenCalledWith(1);
    });

    it("should reload when isOpen changes to true", () => {
      component.projectId = 1;
      component.isOpen = true;
      const changes: SimpleChanges = {
        isOpen: new SimpleChange(false, true, false),
      };
      component.ngOnChanges(changes);
      expect(projectServiceSpy.getProjectDetail).toHaveBeenCalledWith(1);
    });

    it("should not reload when isOpen changes to false", () => {
      component.projectId = 1;
      component.isOpen = false;
      const changes: SimpleChanges = {
        isOpen: new SimpleChange(true, false, false),
      };
      component.ngOnChanges(changes);
      expect(projectServiceSpy.getProjectDetail).not.toHaveBeenCalled();
    });
  });

  describe("ngOnDestroy", () => {
    it("should complete destroy$ subject", () => {
      const destroySpy = spyOn(component["destroy$"], "next");
      const completeSpy = spyOn(component["destroy$"], "complete");
      component.ngOnDestroy();
      expect(destroySpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });
  });

  describe("close", () => {
    it("should emit closed event", () => {
      spyOn(component.closed, "emit");
      component.close();
      expect(component.closed.emit).toHaveBeenCalled();
    });
  });

  describe("bodiesViewMode", () => {
    it("should default to grid", () => {
      expect(component.bodiesViewMode).toBe("grid");
    });

    it("should be settable to table", () => {
      component.bodiesViewMode = "table";
      expect(component.bodiesViewMode).toBe("table");
    });

    it("should be settable to visual", () => {
      component.bodiesViewMode = "visual";
      expect(component.bodiesViewMode).toBe("visual");
    });
  });
});
