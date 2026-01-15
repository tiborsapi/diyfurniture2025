import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick,
} from "@angular/core/testing";
import { ProjectDetailComponent } from "../project-detail.component";
import { ProjectService, Project } from "../../../services/project.service";
import { MatSnackBar } from "@angular/material/snack-bar";
import { MatDialog } from "@angular/material/dialog";
import { of, throwError, Subject } from "rxjs";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { MatIconModule } from "@angular/material/icon";
import { MatButtonModule } from "@angular/material/button";
import { MatTooltipModule } from "@angular/material/tooltip";
import {
  mockProject,
  mockVersion1,
  mockVersion2,
  createMockProjectService,
  createMockSnackBar,
  createMockDialog,
} from "./test-helpers";

describe("ProjectDetailComponent - Version Management", () => {
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

  describe("selectVersion", () => {
    it("should set selectedVersion", () => {
      component.selectVersion(mockVersion1);
      expect(component.selectedVersion).toEqual(mockVersion1);
    });
  });

  describe("getLatestVersion", () => {
    it("should return null if no project", () => {
      component.project = null;
      expect(component.getLatestVersion()).toBeNull();
    });

    it("should return null if no versions", () => {
      component.project = { ...mockProject, versions: [] };
      expect(component.getLatestVersion()).toBeNull();
    });

    it("should return version with highest versionNumber", () => {
      component.project = mockProject;
      const result = component.getLatestVersion();
      expect(result).toEqual(mockVersion2);
    });
  });

  describe("getLatestVersionNumber", () => {
    it("should return 0 if no latest version", () => {
      component.project = null;
      expect(component.getLatestVersionNumber()).toBe(0);
    });

    it("should return latest version number", () => {
      component.project = mockProject;
      expect(component.getLatestVersionNumber()).toBe(2);
    });
  });

  describe("isLatestVersion", () => {
    beforeEach(() => {
      component.project = mockProject;
    });

    it("should return true for latest version", () => {
      expect(component.isLatestVersion(mockVersion2)).toBeTrue();
    });

    it("should return false for older version", () => {
      expect(component.isLatestVersion(mockVersion1)).toBeFalse();
    });
  });

  describe("restoreVersion", () => {
    beforeEach(() => {
      component.project = mockProject;
    });

    it("should not restore if no project", () => {
      component.project = null;
      spyOn(window, "confirm");
      component.restoreVersion(mockVersion1);
      expect(window.confirm).not.toHaveBeenCalled();
    });

    it("should ask for confirmation", () => {
      spyOn(window, "confirm").and.returnValue(false);
      component.restoreVersion(mockVersion1);
      expect(window.confirm).toHaveBeenCalledWith("Restore to version 1?");
    });

    it("should not restore if user cancels", () => {
      spyOn(window, "confirm").and.returnValue(false);
      component.restoreVersion(mockVersion1);
      expect(projectServiceSpy.restoreVersion).not.toHaveBeenCalled();
    });

    it("should call restoreVersion service on confirm", fakeAsync(() => {
      spyOn(window, "confirm").and.returnValue(true);
      component.restoreVersion(mockVersion1);
      tick();
      expect(projectServiceSpy.restoreVersion).toHaveBeenCalledWith(1, 1);
    }));

    it("should set restoringVersion to true while restoring", fakeAsync(() => {
      spyOn(window, "confirm").and.returnValue(true);
      const subject = new Subject<Project>();
      projectServiceSpy.restoreVersion.and.returnValue(subject.asObservable());

      component.restoreVersion(mockVersion1);
      expect(component.restoringVersion).toBeTrue();

      subject.next({} as Project);
      subject.complete();
      tick();
      expect(component.restoringVersion).toBeFalse();
    }));

    it("should show success snackbar on restore", fakeAsync(() => {
      spyOn(window, "confirm").and.returnValue(true);
      component.restoreVersion(mockVersion1);
      tick();
      expect(snackBarSpy.open).toHaveBeenCalledWith(
        "Restored to version 1",
        "Close",
        { duration: 3000 }
      );
    }));

    it("should reload project details on success", fakeAsync(() => {
      spyOn(window, "confirm").and.returnValue(true);
      spyOn(component, "loadProjectDetails");
      component.restoreVersion(mockVersion1);
      tick();
      expect(component.loadProjectDetails).toHaveBeenCalled();
    }));

    it("should show error snackbar on failure", fakeAsync(() => {
      spyOn(window, "confirm").and.returnValue(true);
      projectServiceSpy.restoreVersion.and.returnValue(
        throwError(() => new Error("Restore failed"))
      );
      component.restoreVersion(mockVersion1);
      tick();
      expect(snackBarSpy.open).toHaveBeenCalledWith(
        "Failed to restore version",
        "Close",
        { duration: 4000 }
      );
    }));
  });
});
