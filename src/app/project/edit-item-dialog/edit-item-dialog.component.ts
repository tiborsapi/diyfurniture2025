import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogContent, MatDialogActions } from '@angular/material/dialog';
import { Project, ProjectService } from '../../services/project.service';
import { ProjectVersionResponse } from 'src/app/models/project.models';
import { MatFormField, MatLabel } from "@angular/material/form-field";
import { MatProgressSpinner } from "@angular/material/progress-spinner";
import { MatIcon } from "@angular/material/icon";

@Component({
  selector: 'app-edit-item-dialog',
  templateUrl: './edit-item-dialog.component.html',
  styleUrls: ['./edit-item-dialog.component.scss'],
  standalone: false,
  // imports: [MatDialogContent, MatFormField, MatLabel, MatProgressSpinner, MatDialogActions, MatIcon]
})
export class EditProjectDialogComponent implements OnInit {
  editForm: FormGroup;
  versions: ProjectVersionResponse[] = [];
  isSaving = false;
  isLoadingVersions = false;

  constructor(
    private fb: FormBuilder,
    private projectService: ProjectService,
    private dialogRef: MatDialogRef<EditProjectDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { project: Project }
  ) {
    this.editForm = this.fb.group({
      name: [data.project.name, [Validators.required]],
      description: [data.project.description]
    });
  }

  ngOnInit(): void {
    this.loadVersions();
  }

  loadVersions(): void {
    this.isLoadingVersions = true;
    this.projectService.getProjectVersions(this.data.project.id).subscribe({
      next: (res) => {
        this.versions = res;
        this.isLoadingVersions = false;
      },
      error: () => this.isLoadingVersions = false
    });
  }

  onSave(): void {
    if (this.editForm.valid) {
      this.isSaving = true;
      this.projectService.updateProject(this.data.project.id, this.editForm.value).subscribe({
        next: (updatedProject) => {
          this.isSaving = false;
          this.dialogRef.close(updatedProject); // Return the updated item
        },
        error: () => this.isSaving = false
      });
    }
  }

  onRestore(version: ProjectVersionResponse): void {
    if (confirm(`Restore project to version ${version.versionNumber}? Current changes will be saved as a new version.`)) {
      this.projectService.restoreVersion(this.data.project.id, version.id).subscribe({
        next: (restoredProject) => {
          // Update form with restored data
          this.editForm.patchValue({
            name: restoredProject.name,
            description: restoredProject.description
          });
          this.loadVersions(); // Refresh history
          alert("Version restored successfully!");
          this.dialogRef.close(restoredProject); // This triggers the refresh in ProjectComponent
        }
      });
    }
  }
}