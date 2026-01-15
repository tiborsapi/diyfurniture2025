import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick,
} from "@angular/core/testing";
import { ProjectDetailComponent } from "../project-detail.component";
import { ProjectService } from "../../../services/project.service";
import { MatSnackBar } from "@angular/material/snack-bar";
import { MatDialog } from "@angular/material/dialog";
import { of, throwError } from "rxjs";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { MatIconModule } from "@angular/material/icon";
import { MatButtonModule } from "@angular/material/button";
import { MatTooltipModule } from "@angular/material/tooltip";
import {
  mockProject,
  createMockProjectService,
  createMockSnackBar,
  createMockDialog,
} from "./test-helpers";

describe("ProjectDetailComponent - Actions", () => {
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

  describe("deleteProject", () => {
    beforeEach(() => {
      component.project = mockProject;
    });

    it("should not delete if no project", async () => {
      component.project = null;
      spyOn(window, "confirm");
      await component.deleteProject();
      expect(window.confirm).not.toHaveBeenCalled();
    });

    it("should ask for confirmation", async () => {
      spyOn(window, "confirm").and.returnValue(false);
      await component.deleteProject();
      expect(window.confirm).toHaveBeenCalledWith(
        'Are you sure you want to delete "Test Project"? This action cannot be undone.'
      );
    });

    it("should not delete if user cancels", async () => {
      spyOn(window, "confirm").and.returnValue(false);
      await component.deleteProject();
      expect(projectServiceSpy.deleteProject).not.toHaveBeenCalled();
    });

    it("should call deleteProject service on confirm", async () => {
      spyOn(window, "confirm").and.returnValue(true);
      await component.deleteProject();
      expect(projectServiceSpy.deleteProject).toHaveBeenCalledWith(1);
    });

    it("should show success snackbar on delete", async () => {
      spyOn(window, "confirm").and.returnValue(true);
      await component.deleteProject();
      expect(snackBarSpy.open).toHaveBeenCalledWith(
        "Project deleted successfully",
        "Close",
        jasmine.objectContaining({ duration: 3000 })
      );
    });

    it("should emit projectDeleted on success", async () => {
      spyOn(window, "confirm").and.returnValue(true);
      spyOn(component.projectDeleted, "emit");
      await component.deleteProject();
      expect(component.projectDeleted.emit).toHaveBeenCalledWith(1);
    });

    it("should close panel on success", async () => {
      spyOn(window, "confirm").and.returnValue(true);
      spyOn(component, "close");
      await component.deleteProject();
      expect(component.close).toHaveBeenCalled();
    });

    it("should show error snackbar on failure", async () => {
      spyOn(window, "confirm").and.returnValue(true);
      projectServiceSpy.deleteProject.and.returnValue(
        Promise.reject(new Error("Delete failed"))
      );
      await component.deleteProject();
      expect(snackBarSpy.open).toHaveBeenCalledWith(
        "Failed to delete project",
        "Close",
        jasmine.objectContaining({ duration: 4000 })
      );
    });
  });

  describe("archiveProject", () => {
    beforeEach(() => {
      component.project = mockProject;
    });

    it("should not archive if no project", () => {
      component.project = null;
      component.archiveProject();
      expect(projectServiceSpy.archiveProject).not.toHaveBeenCalled();
    });

    it("should call archiveProject service", fakeAsync(() => {
      component.archiveProject();
      tick();
      expect(projectServiceSpy.archiveProject).toHaveBeenCalledWith(1);
    }));

    it("should show success snackbar on archive", fakeAsync(() => {
      component.archiveProject();
      tick();
      expect(snackBarSpy.open).toHaveBeenCalledWith(
        'Project "Test Project" archived',
        "Close",
        { duration: 3000 }
      );
    }));

    it("should emit projectArchived on success", fakeAsync(() => {
      spyOn(component.projectArchived, "emit");
      component.archiveProject();
      tick();
      expect(component.projectArchived.emit).toHaveBeenCalledWith(1);
    }));

    it("should close panel on success", fakeAsync(() => {
      spyOn(component, "close");
      component.archiveProject();
      tick();
      expect(component.close).toHaveBeenCalled();
    }));

    it("should show error snackbar on failure", fakeAsync(() => {
      projectServiceSpy.archiveProject.and.returnValue(
        throwError(() => new Error("Archive failed"))
      );
      component.archiveProject();
      tick();
      expect(snackBarSpy.open).toHaveBeenCalledWith(
        "Failed to archive project",
        "Close",
        { duration: 4000 }
      );
    }));
  });

  describe("openEditDialog", () => {
    beforeEach(() => {
      component.project = mockProject;
    });

    it("should not open dialog if no project", () => {
      component.project = null;
      component.openEditDialog();
      expect(dialogSpy.open).not.toHaveBeenCalled();
    });

    it("should open edit dialog with correct config", () => {
      const dialogRefSpy = jasmine.createSpyObj("MatDialogRef", [
        "afterClosed",
      ]);
      dialogRefSpy.afterClosed.and.returnValue(of(null));
      dialogSpy.open.and.returnValue(dialogRefSpy);

      component.openEditDialog();

      expect(dialogSpy.open).toHaveBeenCalledWith(
        jasmine.any(Function),
        jasmine.objectContaining({
          width: "800px",
          data: { project: mockProject },
          disableClose: true,
        })
      );
    });

    it("should reload and emit on dialog close with result", fakeAsync(() => {
      const updatedProject = { ...mockProject, name: "Updated" };
      const dialogRefSpy = jasmine.createSpyObj("MatDialogRef", [
        "afterClosed",
      ]);
      dialogRefSpy.afterClosed.and.returnValue(of(updatedProject));
      dialogSpy.open.and.returnValue(dialogRefSpy);

      spyOn(component, "loadProjectDetails");
      spyOn(component.projectUpdated, "emit");

      component.openEditDialog();
      tick();

      expect(component.loadProjectDetails).toHaveBeenCalled();
      expect(component.projectUpdated.emit).toHaveBeenCalledWith(
        updatedProject
      );
    }));

    it("should not reload on dialog cancel", fakeAsync(() => {
      const dialogRefSpy = jasmine.createSpyObj("MatDialogRef", [
        "afterClosed",
      ]);
      dialogRefSpy.afterClosed.and.returnValue(of(null));
      dialogSpy.open.and.returnValue(dialogRefSpy);

      spyOn(component, "loadProjectDetails");

      component.openEditDialog();
      tick();

      expect(component.loadProjectDetails).not.toHaveBeenCalled();
    }));
  });
});
