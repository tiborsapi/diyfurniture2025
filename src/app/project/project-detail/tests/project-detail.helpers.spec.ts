import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ProjectDetailComponent } from "../project-detail.component";
import { ProjectService } from "../../../services/project.service";
import { MatSnackBar } from "@angular/material/snack-bar";
import { MatDialog } from "@angular/material/dialog";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { MatIconModule } from "@angular/material/icon";
import { MatButtonModule } from "@angular/material/button";
import { MatTooltipModule } from "@angular/material/tooltip";
import { ProjectBodyDto } from "../../../models/project.models";
import {
  createMockDialog,
  createMockProjectService,
  createMockSnackBar,
  mockVersion1,
  mockVersion2,
} from "./test-helpers";

describe("ProjectDetailComponent - Helper Methods", () => {
  let component: ProjectDetailComponent;
  let fixture: ComponentFixture<ProjectDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ProjectDetailComponent],
      imports: [
        NoopAnimationsModule,
        MatIconModule,
        MatButtonModule,
        MatTooltipModule,
      ],
      providers: [
        { provide: ProjectService, useValue: createMockProjectService() },
        { provide: MatSnackBar, useValue: createMockSnackBar() },
        { provide: MatDialog, useValue: createMockDialog() },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProjectDetailComponent);
    component = fixture.componentInstance;
  });

  describe("formatDate", () => {
    it('should return "-" for null', () => {
      expect(component.formatDate(null)).toBe("-");
    });

    it('should return "-" for undefined', () => {
      expect(component.formatDate(undefined)).toBe("-");
    });

    it('should return "-" for empty string', () => {
      expect(component.formatDate("")).toBe("-");
    });

    it("should format valid date string", () => {
      const result = component.formatDate("2026-01-15T14:30:00");
      expect(result).toContain("2026");
      expect(result).toContain("Jan");
      expect(result).toContain("15");
    });
  });

  describe("formatDimension", () => {
    it("should format small values in mm", () => {
      expect(component.formatDimension(500)).toBe("500mm");
    });

    it("should format values under 1000 in mm", () => {
      expect(component.formatDimension(999)).toBe("999mm");
    });

    it("should format 1000+ values in meters", () => {
      expect(component.formatDimension(1000)).toBe("1.00m");
    });

    it("should format large values in meters with 2 decimals", () => {
      expect(component.formatDimension(2500)).toBe("2.50m");
    });

    it("should handle zero", () => {
      expect(component.formatDimension(0)).toBe("0mm");
    });
  });

  describe("getTotalBodies", () => {
    it("should return 0 if no selectedVersion", () => {
      component.selectedVersion = null;
      expect(component.getTotalBodies()).toBe(0);
    });

    it("should return 0 if selectedVersion has no bodies", () => {
      component.selectedVersion = mockVersion1;
      expect(component.getTotalBodies()).toBe(0);
    });

    it("should return correct count", () => {
      component.selectedVersion = mockVersion2;
      expect(component.getTotalBodies()).toBe(2);
    });
  });

  describe("calculateVolume", () => {
    it("should calculate volume in cubic meters", () => {
      const body: ProjectBodyDto = {
        id: 1,
        width: 1000,
        heigth: 1000,
        depth: 1000,
      };
      expect(component.calculateVolume(body)).toBe("1.000");
    });

    it("should handle small volumes", () => {
      const body: ProjectBodyDto = {
        id: 1,
        width: 100,
        heigth: 100,
        depth: 100,
      };
      expect(component.calculateVolume(body)).toBe("0.001");
    });

    it("should handle zero dimensions", () => {
      const body: ProjectBodyDto = { id: 1, width: 0, heigth: 500, depth: 300 };
      expect(component.calculateVolume(body)).toBe("0.000");
    });
  });

  describe("getBodyColor", () => {
    it("should return first color for index 0", () => {
      expect(component.getBodyColor(0)).toBe("#3B82F6");
    });

    it("should cycle through colors", () => {
      const color0 = component.getBodyColor(0);
      const color10 = component.getBodyColor(10);
      expect(color0).toBe(color10);
    });

    it("should return different colors for different indices", () => {
      const colors = new Set();
      for (let i = 0; i < 10; i++) {
        colors.add(component.getBodyColor(i));
      }
      expect(colors.size).toBe(10);
    });
  });

  describe("getPreviewWidth", () => {
    it("should return minimum 20 for small width", () => {
      const body: ProjectBodyDto = {
        id: 1,
        width: 100,
        heigth: 100,
        depth: 100,
      };
      expect(component.getPreviewWidth(body)).toBe(20);
    });

    it("should return maximum 80 for large width", () => {
      const body: ProjectBodyDto = {
        id: 1,
        width: 10000,
        heigth: 100,
        depth: 100,
      };
      expect(component.getPreviewWidth(body)).toBe(80);
    });

    it("should scale proportionally for medium width", () => {
      const body: ProjectBodyDto = {
        id: 1,
        width: 2500,
        heigth: 100,
        depth: 100,
      };
      expect(component.getPreviewWidth(body)).toBe(50);
    });
  });

  describe("getPreviewHeight", () => {
    it("should return minimum 15 for small height", () => {
      const body: ProjectBodyDto = {
        id: 1,
        width: 100,
        heigth: 100,
        depth: 100,
      };
      expect(component.getPreviewHeight(body)).toBe(15);
    });

    it("should return maximum 60 for large height", () => {
      const body: ProjectBodyDto = {
        id: 1,
        width: 100,
        heigth: 10000,
        depth: 100,
      };
      expect(component.getPreviewHeight(body)).toBe(60);
    });
  });

  describe("getBlockWidth", () => {
    it("should return minimum 24 for small width", () => {
      const body: ProjectBodyDto = {
        id: 1,
        width: 100,
        heigth: 100,
        depth: 100,
      };
      expect(component.getBlockWidth(body)).toBe(24);
    });

    it("should return maximum 120 for large width", () => {
      const body: ProjectBodyDto = {
        id: 1,
        width: 10000,
        heigth: 100,
        depth: 100,
      };
      expect(component.getBlockWidth(body)).toBe(120);
    });
  });

  describe("getBlockHeight", () => {
    it("should return minimum 24 for small height", () => {
      const body: ProjectBodyDto = {
        id: 1,
        width: 100,
        heigth: 100,
        depth: 100,
      };
      expect(component.getBlockHeight(body)).toBe(24);
    });

    it("should return maximum 80 for large height", () => {
      const body: ProjectBodyDto = {
        id: 1,
        width: 100,
        heigth: 10000,
        depth: 100,
      };
      expect(component.getBlockHeight(body)).toBe(80);
    });
  });
});
