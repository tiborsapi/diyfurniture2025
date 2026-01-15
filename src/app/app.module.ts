import { FurnituremodelModule } from "./furnituremodel/furnituremodel.module";
import { View3DModule } from "./view3d/view3d.module";
import { Draw2dModule } from "./draw2d/draw2d.module";
import { ProjectModule } from "./project/project.module";
import { MaterialModule } from "./material.module";
import { NgModule } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";
import { HttpClientModule } from "@angular/common/http";
import {
  provideNgxWebstorage,
  withLocalStorage,
  withSessionStorage,
  withNgxWebstorageConfig,
} from "ngx-webstorage";

import { AppComponent } from "./app.component";
import { AppRoutingModule } from "./app-routing.module";
import { FurnituremodelService } from "./furnituremodel/furnituremodel.service";
import { BillofmaterialsComponent } from "./billofmaterials/billofmaterials.component";
import { MatPaginatorModule } from "@angular/material/paginator";

@NgModule({
  declarations: [AppComponent, BillofmaterialsComponent],
  imports: [
    BrowserModule,
    HttpClientModule,
    MaterialModule,
    AppRoutingModule,
    Draw2dModule,
    View3DModule,
    FurnituremodelModule,
    ProjectModule,
    MatPaginatorModule,
  ],
  providers: [
    FurnituremodelService,
    provideNgxWebstorage(
      withLocalStorage(),
      withSessionStorage()
      // Optionally keep old keys by configuring prefix/separator:
      // withNgxWebstorageConfig({ prefix: 'ngx-webstorage', separator: '|', caseSensitive: false })
    ),
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
