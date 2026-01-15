import { of } from "rxjs";
import { ProjectService, Project } from "../../../services/project.service";
import { MatSnackBar } from "@angular/material/snack-bar";
import { MatDialog } from "@angular/material/dialog";
import {
  ProjectDetailResponse,
  ProjectVersionDto,
  ProjectBodyDto,
} from "../../../models/project.models";

// ============================================
// MOCK DATA
// ============================================

export const mockBody1: ProjectBodyDto = {
  id: 1,
  width: 1000,
  heigth: 500,
  depth: 300,
};

export const mockBody2: ProjectBodyDto = {
  id: 2,
  width: 2000,
  heigth: 1500,
  depth: 400,
};

export const mockVersion1: ProjectVersionDto = {
  id: 1,
  versionNumber: 1,
  savedAt: "2026-01-01T10:00:00",
  versionNote: "Initial version",
  name: "Test Project v1",
  description: "Description v1",
  bodies: [],
};

export const mockVersion2: ProjectVersionDto = {
  id: 2,
  versionNumber: 2,
  savedAt: "2026-01-02T10:00:00",
  versionNote: "Added bodies",
  name: "Test Project v2",
  description: "Description v2",
  bodies: [mockBody1, mockBody2],
};

export const mockProject: ProjectDetailResponse = {
  id: 1,
  name: "Test Project",
  description: "Test Description",
  createdAt: "2026-01-01T10:00:00",
  updatedAt: "2026-01-02T10:00:00",
  deletedAt: null,
  versions: [mockVersion1, mockVersion2],
};

export const mockArchivedProject: ProjectDetailResponse = {
  ...mockProject,
  deletedAt: "2026-01-03T10:00:00",
};

// ============================================
// MOCK FACTORIES
// ============================================

export function createMockProjectService(): jasmine.SpyObj<ProjectService> {
  const spy = jasmine.createSpyObj<ProjectService>("ProjectService", [
    "getProjectDetail",
    "deleteProject",
    "archiveProject",
    "restoreVersion",
  ]);

  spy.getProjectDetail.and.returnValue(of(mockProject));
  spy.archiveProject.and.returnValue(of({} as Project));
  spy.restoreVersion.and.returnValue(of({} as Project));
  spy.deleteProject.and.returnValue(Promise.resolve());

  return spy;
}

export function createMockSnackBar(): jasmine.SpyObj<MatSnackBar> {
  return jasmine.createSpyObj<MatSnackBar>("MatSnackBar", ["open"]);
}

export function createMockDialog(): jasmine.SpyObj<MatDialog> {
  return jasmine.createSpyObj<MatDialog>("MatDialog", ["open"]);
}
