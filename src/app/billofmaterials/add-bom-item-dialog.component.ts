import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { BomItem } from '../models/bom.models';

@Component({
  selector: 'app-add-bom-item-dialog',
  templateUrl: './add-bom-item-dialog.component.html',
  styleUrls: ['./add-bom-item-dialog.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
  ]
})
export class AddBomItemDialogComponent implements OnInit {
  bomItemForm: FormGroup;
  unitOptions = [
    { value: 'piece', label: 'Darab (db)' },
    { value: 'square_meter', label: 'Négyzetméter (m²)' },
    { value: 'linear_meter', label: 'Folyóméter (m)' },
    { value: 'kg', label: 'Kilogramm (kg)' }
  ];

  typeOptions = [
    { value: 'raw_material', label: 'Nyersanyag' },
    { value: 'manufactured_component', label: 'Gyártott komponens' }
  ];

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<AddBomItemDialogComponent>
  ) {
    this.bomItemForm = this.fb.group({
      type: ['raw_material', Validators.required],
      name: ['', Validators.required],
      material_type: [''],
      length: [null],
      width: [null],
      height: [null],
      quantity: [1, [Validators.required, Validators.min(1)]],
      unit: ['piece', Validators.required],
      weight: [null, Validators.min(0)],
      notes: ['']
    });
  }

  ngOnInit(): void {
    // Update validators based on type
    this.bomItemForm.get('type')?.valueChanges.subscribe(type => {
      if (type === 'raw_material') {
        // For raw materials, dimensions and material_type are more relevant
        this.bomItemForm.get('material_type')?.setValidators([]);
        this.bomItemForm.get('length')?.setValidators([Validators.min(0)]);
        this.bomItemForm.get('width')?.setValidators([Validators.min(0)]);
        this.bomItemForm.get('height')?.setValidators([Validators.min(0)]);
      } else {
        // For manufactured components, dimensions are optional
        this.bomItemForm.get('material_type')?.clearValidators();
        this.bomItemForm.get('length')?.clearValidators();
        this.bomItemForm.get('width')?.clearValidators();
        this.bomItemForm.get('height')?.clearValidators();
      }
      this.bomItemForm.get('material_type')?.updateValueAndValidity();
      this.bomItemForm.get('length')?.updateValueAndValidity();
      this.bomItemForm.get('width')?.updateValueAndValidity();
      this.bomItemForm.get('height')?.updateValueAndValidity();
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSubmit(): void {
    if (this.bomItemForm.valid) {
      const formValue = this.bomItemForm.value;
      
      // Build the BomItem object
      const bomItem: BomItem = {
        id: Date.now(), // Temporary ID
        position: 0, // Will be set by parent component
        type: formValue.type,
        name: formValue.name,
        material_type: formValue.material_type || undefined,
        dimensions: (formValue.length && formValue.width && formValue.height) ? {
          length: formValue.length,
          width: formValue.width,
          height: formValue.height
        } : undefined,
        quantity: formValue.quantity,
        unit: formValue.unit,
        weight: formValue.weight || undefined,
        notes: formValue.notes || undefined
      };

      this.dialogRef.close(bomItem);
    }
  }

  get isRawMaterial(): boolean {
    return this.bomItemForm.get('type')?.value === 'raw_material';
  }
}

