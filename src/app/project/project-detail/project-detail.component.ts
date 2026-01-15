import {
  Component,
  OnInit,
  OnDestroy,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  SimpleChanges,
} from "@angular/core";
import { Subject } from "rxjs";
import { takeUntil, finalize } from "rxjs/operators";
import { ProjectService } from "../../services/project.service";
import { MatSnackBar } from "@angular/material/snack-bar";
import { MatDialog } from "@angular/material/dialog";
import { EditProjectDialogComponent } from "../edit-item-dialog/edit-item-dialog.component";
import {
  ProjectDetailResponse,
  ProjectVersionDto,
  ProjectBodyDto,
} from "../../models/project.models";

@Component({
  selector: "app-project-detail",
  templateUrl: "./project-detail.component.html",
  styleUrls: ["./project-detail.component.scss"],
  standalone: false,
})
export class ProjectDetailComponent implements OnInit, OnDestroy, OnChanges {
  @Input() projectId: number | null = null;
  @Input() isOpen = false;

  @Output() closed = new EventEmitter<void>();
  @Output() projectUpdated = new EventEmitter<ProjectDetailResponse>();
  @Output() projectDeleted = new EventEmitter<number>();
  @Output() projectArchived = new EventEmitter<number>();

  // State
  loading = false;
  error = "";
  project: ProjectDetailResponse | null = null;

  // Version management
  selectedVersion: ProjectVersionDto | null = null;
  restoringVersion = false;

  // View state for bodies
  bodiesViewMode: "grid" | "table" | "visual" = "grid";

  private destroy$ = new Subject<void>();

  constructor(
    private projectService: ProjectService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    if (this.projectId && this.isOpen) {
      this.loadProjectDetails();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Reload when projectId changes or panel opens
    if (
      (changes["projectId"] || changes["isOpen"]) &&
      this.projectId &&
      this.isOpen
    ) {
      this.loadProjectDetails();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadProjectDetails(): void {
    if (!this.projectId) return;

    this.loading = true;
    this.error = "";
    this.project = null;

    this.projectService
      .getProjectDetail(this.projectId)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.loading = false))
      )
      .subscribe({
        next: (response: ProjectDetailResponse) => {
          this.project = response;
          // Select the latest version by default
          if (this.project.versions?.length > 0) {
            this.selectedVersion = this.getLatestVersion();
          }
        },
        error: (err) => {
          console.error("Failed to load project details:", err);
          this.error = "Failed to load project details. Please try again.";
        },
      });
  }

  close(): void {
    this.closed.emit();
  }

  openEditDialog(): void {
    if (!this.project) return;

    const dialogRef = this.dialog.open(EditProjectDialogComponent, {
      width: "800px",
      data: { project: this.project },
      disableClose: true,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadProjectDetails();
        this.projectUpdated.emit(result);
      }
    });
  }

  async deleteProject(): Promise<void> {
    if (!this.project) return;

    const confirmed = confirm(
      `Are you sure you want to delete "${this.project.name}"? This action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      await this.projectService.deleteProject(this.project.id);
      this.snackBar.open("Project deleted successfully", "Close", {
        duration: 3000,
        horizontalPosition: "right",
        verticalPosition: "top",
      });
      this.projectDeleted.emit(this.project.id);
      this.close();
    } catch (error) {
      this.snackBar.open("Failed to delete project", "Close", {
        duration: 4000,
        panelClass: ["error-snackbar"],
      });
    }
  }

  archiveProject(): void {
    if (!this.project) return;

    this.projectService
      .archiveProject(this.project.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.snackBar.open(
            `Project "${this.project?.name}" archived`,
            "Close",
            { duration: 3000 }
          );
          this.projectArchived.emit(this.project!.id);
          this.close();
        },
        error: (err) => {
          console.error("Failed to archive project:", err);
          this.snackBar.open("Failed to archive project", "Close", {
            duration: 4000,
          });
        },
      });
  }

  selectVersion(version: ProjectVersionDto): void {
    this.selectedVersion = version;
  }

  restoreVersion(version: ProjectVersionDto): void {
    if (!this.project) return;

    const confirmed = confirm(`Restore to version ${version.versionNumber}?`);
    if (!confirmed) return;

    this.restoringVersion = true;

    this.projectService
      .restoreVersion(this.project.id, version.id)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.restoringVersion = false))
      )
      .subscribe({
        next: () => {
          this.snackBar.open(
            `Restored to version ${version.versionNumber}`,
            "Close",
            { duration: 3000 }
          );
          this.loadProjectDetails();
        },
        error: (err) => {
          console.error("Failed to restore version:", err);
          this.snackBar.open("Failed to restore version", "Close", {
            duration: 4000,
          });
        },
      });
  }

  // Helper methods
  getLatestVersion(): ProjectVersionDto | null {
    if (!this.project?.versions?.length) return null;
    return this.project.versions.reduce((latest, v) =>
      v.versionNumber > latest.versionNumber ? v : latest
    );
  }

  getLatestVersionNumber(): number {
    const latest = this.getLatestVersion();
    return latest?.versionNumber || 0;
  }

  isLatestVersion(version: ProjectVersionDto): boolean {
    return version.versionNumber === this.getLatestVersionNumber();
  }

  formatDate(dateString: string | null | undefined): string {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  formatDimension(mm: number): string {
    if (mm >= 1000) {
      return `${(mm / 1000).toFixed(2)}m`;
    }
    return `${mm}mm`;
  }

  getTotalBodies(): number {
    return this.selectedVersion?.bodies?.length || 0;
  }

  calculateVolume(body: ProjectBodyDto): string {
    const volumeM3 = (body.width * body.heigth * body.depth) / 1000000000;
    return volumeM3.toFixed(3);
  }

  getBodyColor(index: number): string {
    const colors = [
      "#3B82F6",
      "#10B981",
      "#F59E0B",
      "#EF4444",
      "#8B5CF6",
      "#EC4899",
      "#06B6D4",
      "#84CC16",
      "#F97316",
      "#6366F1",
    ];
    return colors[index % colors.length];
  }

  getPreviewWidth(body: ProjectBodyDto): number {
    return Math.max(20, Math.min(80, body.width / 50));
  }

  getPreviewHeight(body: ProjectBodyDto): number {
    return Math.max(15, Math.min(60, body.heigth / 50));
  }

  getBlockWidth(body: ProjectBodyDto): number {
    return Math.max(24, Math.min(120, body.width / 40));
  }

  getBlockHeight(body: ProjectBodyDto): number {
    return Math.max(24, Math.min(80, body.heigth / 40));
  }
}
