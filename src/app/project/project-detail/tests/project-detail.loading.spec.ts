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
import { of, throwError, Subject } from "rxjs";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { MatIconModule } from "@angular/material/icon";
import { MatButtonModule } from "@angular/material/button";
import { MatTooltipModule } from "@angular/material/tooltip";
import {
  ProjectDetailResponse,
  ProjectVersionDto,
} from "../../../models/project.models";
import {
  mockProject,
  mockVersion1,
  mockVersion2,
  mockArchivedProject,
  createMockProjectService,
  createMockSnackBar,
  createMockDialog,
} from "./test-helpers";

describe("ProjectDetailComponent - Loading & Error States", () => {
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

  describe("loadProjectDetails", () => {
    beforeEach(() => {
      component.projectId = 1;
    });

    it("should not load if projectId is null", () => {
      component.projectId = null;
      component.loadProjectDetails();
      expect(projectServiceSpy.getProjectDetail).not.toHaveBeenCalled();
    });

    it("should set loading to true while fetching", () => {
      const subject = new Subject<ProjectDetailResponse>();
      projectServiceSpy.getProjectDetail.and.returnValue(
        subject.asObservable()
      );
      component.loadProjectDetails();
      expect(component.loading).toBeTrue();
    });

    it("should set loading to false after successful fetch", fakeAsync(() => {
      component.loadProjectDetails();
      tick();
      expect(component.loading).toBeFalse();
    }));

    it("should set project data on success", fakeAsync(() => {
      component.loadProjectDetails();
      tick();
      expect(component.project).toEqual(mockProject);
    }));

    it("should select latest version on success", fakeAsync(() => {
      component.loadProjectDetails();
      tick();
      expect(component.selectedVersion).toEqual(mockVersion2);
    }));

    it("should clear previous error on new load", fakeAsync(() => {
      component.error = "Previous error";
      component.loadProjectDetails();
      tick();
      expect(component.error).toBe("");
    }));

    it("should set error message on failure", fakeAsync(() => {
      projectServiceSpy.getProjectDetail.and.returnValue(
        throwError(() => new Error("Network error"))
      );
      component.loadProjectDetails();
      tick();
      expect(component.error).toBe(
        "Failed to load project details. Please try again."
      );
      expect(component.loading).toBeFalse();
    }));

    it("should clear project on new load", fakeAsync(() => {
      component.project = mockProject;
      const subject = new Subject<ProjectDetailResponse>();
      projectServiceSpy.getProjectDetail.and.returnValue(
        subject.asObservable()
      );
      component.loadProjectDetails();
      expect(component.project).toBeNull();
    }));
  });

  describe("Edge Cases", () => {
    it("should handle project with empty versions array", fakeAsync(() => {
      const emptyVersionsProject = { ...mockProject, versions: [] };
      projectServiceSpy.getProjectDetail.and.returnValue(
        of(emptyVersionsProject)
      );
      component.projectId = 1;
      component.loadProjectDetails();
      tick();
      expect(component.project).toEqual(emptyVersionsProject);
      expect(component.selectedVersion).toBeNull();
    }));

    it("should handle project with single version", fakeAsync(() => {
      const singleVersionProject = { ...mockProject, versions: [mockVersion1] };
      projectServiceSpy.getProjectDetail.and.returnValue(
        of(singleVersionProject)
      );
      component.projectId = 1;
      component.loadProjectDetails();
      tick();
      expect(component.selectedVersion).toEqual(mockVersion1);
    }));

    it("should handle archived project display", fakeAsync(() => {
      projectServiceSpy.getProjectDetail.and.returnValue(
        of(mockArchivedProject)
      );
      component.projectId = 1;
      component.loadProjectDetails();
      tick();
      expect(component.project?.deletedAt).toBeTruthy();
    }));
  });
});
