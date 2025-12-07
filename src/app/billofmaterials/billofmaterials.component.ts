import { Body } from './../furnituremodel/furnituremodels';
import { Component, OnInit } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { FurnituremodelService } from '../furnituremodel/furnituremodel.service';
import { BomService } from '../services/bom.service';
import { BomItem } from '../models/bom.models';

@Component({
    selector: 'app-billofmaterials',
    templateUrl: './billofmaterials.component.html',
    styleUrls: ['./billofmaterials.component.scss'],
    standalone: false
})
export class BillofmaterialsComponent implements OnInit {

  private bodies: Body[] = [];
  private selectedBody: number = 0;

  constructor(private furniture: FurnituremodelService, private bom: BomService) {}

  public displayedColumns: string[] = [
    'position',
    'type',
    'name',
    'material_type',
    'dimensions',
    'quantity',
    'unit',
    'weight'
  ];
  public dataSource: BomItem[] = [];

  ngOnInit(): void {
    this.loadBomForSelected();
    // this.furniture.getFurnitureBody().subscribe((bodies) => {
    //   if (bodies.length < 1)
    //     return;
    //   this.bodies = bodies;
    //   let body = bodies[this.selectedBody];
    // });
    // this.furniture.getSelectedFurniture$().subscribe(id=>{
    //   if(typeof id ==='number'){
    //     this.selectedBody = <number>id;
    //     const selectedElem = this.bodies.find(el=> el.id==this.selectedBody);
    //     if(selectedElem==null)
    //       return;
    //   }
    // });
  }

  private loadBomForSelected(): void {
    this.bom.getBoms().subscribe(items => {
      this.dataSource = items ?? [];
    });
  }

  /**
   * Format dimensions for display
   */
  formatDimensions(item: BomItem): string {
    if (!item.dimensions) {
      return '-';
    }
    return `${item.dimensions.length} × ${item.dimensions.width} × ${item.dimensions.height} mm`;
  }

  /**
   * Format unit for display
   */
  formatUnit(unit: string): string {
    const unitMap: { [key: string]: string } = {
      'piece': 'db',
      'square_meter': 'm²',
      'linear_meter': 'm',
      'kg': 'kg'
    };
    return unitMap[unit] || unit;
  }

  /**
   * Format type for display
   */
  formatType(type: string): string {
    return type === 'raw_material' ? 'Nyersanyag' : 'Gyártott komponens';
  }
}
