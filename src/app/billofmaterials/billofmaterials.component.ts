import { Body } from './../furnituremodel/furnituremodels';
import { Component, OnInit } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FurnituremodelService } from '../furnituremodel/furnituremodel.service';
import { BomService } from '../services/bom.service';
import { BomItem } from '../models/bom.models';
import { AddBomItemDialogComponent } from './add-bom-item-dialog.component';

@Component({
    selector: 'app-billofmaterials',
    templateUrl: './billofmaterials.component.html',
    styleUrls: ['./billofmaterials.component.scss'],
    standalone: false
})
export class BillofmaterialsComponent implements OnInit {

  private bodies: Body[] = [];
  private selectedBody: number = 0;

  constructor(
    private furniture: FurnituremodelService,
    private bom: BomService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

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

  /**
   * Open dialog to add a new BOM item
   */
  openAddBomItemDialog(): void {
    const dialogRef = this.dialog.open(AddBomItemDialogComponent, {
      width: '600px',
      maxWidth: '90vw'
    });

    dialogRef.afterClosed().subscribe((result: BomItem | undefined) => {
      if (result) {
        this.addBomItem(result);
      }
    });
  }

  /**
   * Add a new BOM item to the list
   */
  private addBomItem(item: BomItem): void {
    // Set the position to be the last item + 1
    const maxPosition = this.dataSource.length > 0
      ? Math.max(...this.dataSource.map(i => i.position))
      : 0;
    item.position = maxPosition + 1;

    // Add to local data source immediately for better UX
    this.dataSource = [...this.dataSource, item];

    // Call service to persist (mock for now)
    this.bom.addBomItem(item).subscribe({
      next: (savedItem) => {
        // Update the item with the saved ID if different
        const index = this.dataSource.findIndex(i => i.id === item.id);
        if (index !== -1) {
          this.dataSource[index] = { ...this.dataSource[index], id: savedItem.id };
          this.dataSource = [...this.dataSource]; // Trigger change detection
        }
        this.snackBar.open('BOM tétel sikeresen hozzáadva', 'Bezárás', {
          duration: 3000
        });
      },
      error: (error) => {
        // Remove from local data source on error
        this.dataSource = this.dataSource.filter(i => i.id !== item.id);
        this.snackBar.open('Hiba történt a BOM tétel hozzáadása során', 'Bezárás', {
          duration: 5000
        });
        console.error('Error adding BOM item:', error);
      }
    });
  }
}
