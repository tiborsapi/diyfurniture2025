import { FurnituremodelModule } from "../furnituremodel/furnituremodel.module";
import { ProjectComponent } from "./project.component";
import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { MaterialModule } from "../material.module";
import { ReactiveFormsModule } from "@angular/forms";
import { AddItemDialogComponent } from "./add-item-dialog/add-item-dialog.component";
import { MatPaginatorModule } from "@angular/material/paginator";
import { MatTableModule } from "@angular/material/table";
import { EditProjectDialogComponent } from "./edit-item-dialog/edit-item-dialog.component";
import { ProjectDetailComponent } from "./project-detail/project-detail.component";

@NgModule({
  declarations: [
    ProjectComponent,
    AddItemDialogComponent,
    EditProjectDialogComponent,
    ProjectDetailComponent,
  ],
  imports: [
    CommonModule,
    MaterialModule,
    FurnituremodelModule,
    ReactiveFormsModule,
    MatPaginatorModule,
    MatTableModule,
  ],
  exports: [ProjectComponent],
})
export class ProjectModule {}
