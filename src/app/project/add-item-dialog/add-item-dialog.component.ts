import { Component, Inject, Optional } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { MatSnackBar } from "@angular/material/snack-bar";
import { Project, ProjectService } from "../../services/project.service";
import { BodyDto } from "../../models/project.models";
import { Observable } from "rxjs";

export interface AddItemDialogData {
  bodies?: BodyDto[];
}

@Component({
  selector: "app-add-item-dialog",
  templateUrl: "./add-item-dialog.component.html",
  styleUrls: ["./add-item-dialog.component.scss"],
  standalone: false,
})
export class AddItemDialogComponent {
  itemForm: FormGroup;
  isSaving = false;
  errorMessage = "";

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<AddItemDialogComponent>,
    private projectService: ProjectService,
    private snackBar: MatSnackBar,
    @Optional() @Inject(MAT_DIALOG_DATA) public data: AddItemDialogData
  ) {
    this.itemForm = this.fb.group({
      name: ["", Validators.required],
      description: [""],
    });
  }

  async onSubmit() {
    if (this.itemForm.invalid) return;

    this.isSaving = true;
    this.errorMessage = "";

    const payload = {
      ...this.itemForm.value,
      bodies: this.data?.bodies ?? [],
    };

    try {
      const newItem = await this.projectService.createProject(payload); // Promise-t ad vissza axios
      this.snackBar.open("Project created successfully!", "Close", {
        duration: 3000,
        horizontalPosition: "right",
        verticalPosition: "top",
        panelClass: ["success-snackbar"],
      });
      this.dialogRef.close(newItem);
    } catch (error) {
      console.error(error);
      this.errorMessage = "Failed to create project. Please try again.";
      this.isSaving = false;
    } finally {
      this.isSaving = false;
    }
  }

  onCancel() {
    this.dialogRef.close();
  }
}
function firstValueFrom(arg0: Observable<Project>) {
  throw new Error("Function not implemented.");
}
