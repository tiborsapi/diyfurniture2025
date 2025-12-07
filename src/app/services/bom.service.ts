import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { delay, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import {
  BomItem,
  ComponentList,
  RawMaterial,
  RawMaterialType,
  ManufacturedComponent,
  ManufacturedComponentType,
} from '../models/bom.models';

export interface FurnitureBackendItem {
  id: number;
  width: number;
  heigth: number;
  depth: number;
}

@Injectable({
  providedIn: 'root',
})
export class BomService {
  private readonly baseUrl = environment.apiBase;

  // Mock data - Raw Material Types
  private readonly MOCK_RAW_MATERIAL_TYPES: RawMaterialType[] = [
    { id: 1, name: 'Fenyőfa', created_at: new Date('2024-01-01'), updated_at: new Date('2024-01-01') },
    { id: 2, name: 'Bükkfa', created_at: new Date('2024-01-01'), updated_at: new Date('2024-01-01') },
    { id: 3, name: 'Tölgyfa', created_at: new Date('2024-01-01'), updated_at: new Date('2024-01-01') },
    { id: 4, name: 'Alumínium', created_at: new Date('2024-01-01'), updated_at: new Date('2024-01-01') },
    { id: 5, name: 'Üveg', created_at: new Date('2024-01-01'), updated_at: new Date('2024-01-01') },
    { id: 6, name: 'MDF', created_at: new Date('2024-01-01'), updated_at: new Date('2024-01-01') },
  ];

  // Mock data - Manufactured Component Types
  private readonly MOCK_MANUFACTURED_COMPONENT_TYPES: ManufacturedComponentType[] = [
    { id: 1, name: 'Fém kilincs', created_at: new Date('2024-01-01'), updated_at: new Date('2024-01-01') },
    { id: 2, name: 'Fa kilincs', created_at: new Date('2024-01-01'), updated_at: new Date('2024-01-01') },
    { id: 3, name: 'Zár', created_at: new Date('2024-01-01'), updated_at: new Date('2024-01-01') },
    { id: 4, name: 'Csavar (M6x40)', created_at: new Date('2024-01-01'), updated_at: new Date('2024-01-01') },
    { id: 5, name: 'Csavar (M8x60)', created_at: new Date('2024-01-01'), updated_at: new Date('2024-01-01') },
    { id: 6, name: 'Sarkantyú', created_at: new Date('2024-01-01'), updated_at: new Date('2024-01-01') },
    { id: 7, name: 'Pant', created_at: new Date('2024-01-01'), updated_at: new Date('2024-01-01') },
  ];

  // Mock data - Component List with Raw Materials and Manufactured Components
  private readonly MOCK_COMPONENT_LIST: ComponentList = {
    id: 1,
    created_by: 1,
    created_at: new Date('2024-01-15'),
    updated_at: new Date('2024-01-20'),
    raw_materials: [
      {
        id: 1,
        height: 50,
        width: 200,
        length: 800,
        raw_material_type_id: 1,
        manufactured_component_type_id: null,
        quantity: 4,
        created_at: new Date('2024-01-15'),
        updated_at: new Date('2024-01-15'),
        raw_material_type: this.MOCK_RAW_MATERIAL_TYPES[0], // Fenyőfa
      },
      {
        id: 2,
        height: 50,
        width: 200,
        length: 600,
        raw_material_type_id: 1,
        manufactured_component_type_id: null,
        quantity: 2,
        created_at: new Date('2024-01-15'),
        updated_at: new Date('2024-01-15'),
        raw_material_type: this.MOCK_RAW_MATERIAL_TYPES[0], // Fenyőfa
      },
      {
        id: 3,
        height: 20,
        width: 800,
        length: 600,
        raw_material_type_id: 6,
        manufactured_component_type_id: null,
        quantity: 1,
        created_at: new Date('2024-01-15'),
        updated_at: new Date('2024-01-15'),
        raw_material_type: this.MOCK_RAW_MATERIAL_TYPES[5], // MDF
      },
      {
        id: 4,
        height: 5,
        width: 800,
        length: 600,
        raw_material_type_id: 5,
        manufactured_component_type_id: null,
        quantity: 1,
        created_at: new Date('2024-01-15'),
        updated_at: new Date('2024-01-15'),
        raw_material_type: this.MOCK_RAW_MATERIAL_TYPES[4], // Üveg
      },
      {
        id: 5,
        height: 30,
        width: 30,
        length: 400,
        raw_material_type_id: 4,
        manufactured_component_type_id: null,
        quantity: 2,
        created_at: new Date('2024-01-15'),
        updated_at: new Date('2024-01-15'),
        raw_material_type: this.MOCK_RAW_MATERIAL_TYPES[3], // Alumínium
      },
    ],
    manufactured_components: [
      {
        id: 1,
        component_list_id: 1,
        manufactured_component_type_id: 1,
        quantity: 2,
        created_at: new Date('2024-01-15'),
        updated_at: new Date('2024-01-15'),
        manufactured_component_type: this.MOCK_MANUFACTURED_COMPONENT_TYPES[0], // Fém kilincs
      },
      {
        id: 2,
        component_list_id: 1,
        manufactured_component_type_id: 3,
        quantity: 1,
        created_at: new Date('2024-01-15'),
        updated_at: new Date('2024-01-15'),
        manufactured_component_type: this.MOCK_MANUFACTURED_COMPONENT_TYPES[2], // Zár
      },
      {
        id: 3,
        component_list_id: 1,
        manufactured_component_type_id: 4,
        quantity: 16,
        created_at: new Date('2024-01-15'),
        updated_at: new Date('2024-01-15'),
        manufactured_component_type: this.MOCK_MANUFACTURED_COMPONENT_TYPES[3], // Csavar (M6x40)
      },
      {
        id: 4,
        component_list_id: 1,
        manufactured_component_type_id: 7,
        quantity: 2,
        created_at: new Date('2024-01-15'),
        updated_at: new Date('2024-01-15'),
        manufactured_component_type: this.MOCK_MANUFACTURED_COMPONENT_TYPES[6], // Pant
      },
    ],
  };

  constructor(private http: HttpClient) {}

  /**
   * Converts ComponentList to unified BomItem array for UI display
   */
  private convertToBomItems(componentList: ComponentList): BomItem[] {
    const items: BomItem[] = [];
    let position = 1;

    // Add raw materials
    if (componentList.raw_materials) {
      for (const rawMaterial of componentList.raw_materials) {
        const materialType = rawMaterial.raw_material_type || 
          this.MOCK_RAW_MATERIAL_TYPES.find(t => t.id === rawMaterial.raw_material_type_id);
        
        // Calculate weight (simplified: density * volume)
        const volume = (rawMaterial.length * rawMaterial.width * rawMaterial.height) / 1000000; // Convert to m³
        const density = this.getMaterialDensity(materialType?.name || '');
        const weight = volume * density * rawMaterial.quantity;

        items.push({
          id: rawMaterial.id,
          position: position++,
          type: 'raw_material',
          name: materialType?.name || 'Ismeretlen anyag',
          material_type: materialType?.name,
          dimensions: {
            length: rawMaterial.length,
            width: rawMaterial.width,
            height: rawMaterial.height,
          },
          quantity: rawMaterial.quantity,
          unit: 'piece',
          weight: Math.round(weight * 100) / 100,
        });
      }
    }

    // Add manufactured components
    if (componentList.manufactured_components) {
      for (const component of componentList.manufactured_components) {
        const componentType = component.manufactured_component_type ||
          this.MOCK_MANUFACTURED_COMPONENT_TYPES.find(t => t.id === component.manufactured_component_type_id);

        items.push({
          id: component.id,
          position: position++,
          type: 'manufactured_component',
          name: componentType?.name || 'Ismeretlen komponens',
          quantity: component.quantity,
          unit: 'piece',
        });
      }
    }

    return items;
  }

  /**
   * Get approximate density for material types (kg/m³)
   */
  private getMaterialDensity(materialName: string): number {
    const densities: { [key: string]: number } = {
      'Fenyőfa': 500,
      'Bükkfa': 720,
      'Tölgyfa': 750,
      'Alumínium': 2700,
      'Üveg': 2500,
      'MDF': 750,
    };
    return densities[materialName] || 500;
  }

  /**
   * Get BOM for a specific body/project
   * GET /api/bom?bodyId=:id
   */
  getBom(bodyId: number): Observable<BomItem[]> {
    // const params = new HttpParams().set('bodyId', String(bodyId));
    // return this.http.get<ComponentList>(`${this.baseUrl}/bom`, { params }).pipe(
    //   map(list => this.convertToBomItems(list))
    // );
    
    // Mock: return BOM with delay to simulate API call
    return of(this.convertToBomItems(this.MOCK_COMPONENT_LIST)).pipe(
      delay(500)
    );
  }

  /**
   * Get all BOMs
   * GET /api/bom
   */
  getBoms(): Observable<BomItem[]> {
    // return this.http.get<ComponentList[]>(`${this.baseUrl}/bom`).pipe(
    //   map(lists => lists.flatMap(list => this.convertToBomItems(list)))
    // );
    
    // Mock: return single BOM
    return of(this.convertToBomItems(this.MOCK_COMPONENT_LIST)).pipe(
      delay(300)
    );
  }

  /**
   * Get BOM for a specific project
   * GET /api/bom?projectId=:projectId
   */
  getBomForProject(projectId?: number): Observable<BomItem[]> {
    // const params = projectId ? new HttpParams().set('projectId', String(projectId)) : undefined;
    // return this.http.get<ComponentList>(`${this.baseUrl}/bom`, params ? { params } : {}).pipe(
    //   map(list => this.convertToBomItems(list))
    // );
    
    return of(this.convertToBomItems(this.MOCK_COMPONENT_LIST)).pipe(
      delay(400)
    );
  }

  /**
   * Get furniture items from backend
   */
  getFurnitureItems(): Observable<FurnitureBackendItem[]> {
    return this.http.get<FurnitureBackendItem[]>(`${this.baseUrl}/furniture/all`);
  }

  /**
   * Add a new BOM item
   * POST /api/bom
   */
  addBomItem(item: BomItem): Observable<BomItem> {
    // return this.http.post<BomItem>(`${this.baseUrl}/bom`, item);
    
    // Mock: return the item with a new ID
    const newItem = { ...item, id: Date.now() };
    return of(newItem).pipe(delay(200));
  }

  /**
   * Update a BOM item
   * PUT /api/bom/:id
   */
  updateBomItem(item: BomItem): Observable<BomItem> {
    // return this.http.put<BomItem>(`${this.baseUrl}/bom/${item.id}`, item);
    
    return of(item).pipe(delay(200));
  }

  /**
   * Delete a BOM item
   * DELETE /api/bom/:id
   */
  deleteBomItem(itemId: number): Observable<void> {
    // return this.http.delete<void>(`${this.baseUrl}/bom/${itemId}`);
    
    return of(void 0).pipe(delay(200));
  }

  /**
   * Regenerate BOM for a project
   * POST /api/bom/regenerate?projectId=:projectId
   */
  regenerateBom(projectId: number): Observable<BomItem[]> {
    // return this.http.post<ComponentList>(`${this.baseUrl}/bom/regenerate`, null, {
    //   params: new HttpParams().set('projectId', String(projectId))
    // }).pipe(
    //   map(list => this.convertToBomItems(list))
    // );
    
    return of(this.convertToBomItems(this.MOCK_COMPONENT_LIST)).pipe(
      delay(2000) // Simulate longer processing time for regeneration
    );
  }

  /**
   * Export BOM to CSV
   * GET /api/bom/export?projectId=:projectId&format=csv
   */
  exportBomToCsv(projectId: number): Observable<Blob> {
    // return this.http.get(`${this.baseUrl}/bom/export`, {
    //   params: new HttpParams().set('projectId', String(projectId)).set('format', 'csv'),
    //   responseType: 'blob'
    // });
    
    // Mock: create a simple CSV blob
    const bomItems = this.convertToBomItems(this.MOCK_COMPONENT_LIST);
    const csvContent = this.generateCsv(bomItems);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    return of(blob).pipe(delay(300));
  }

  /**
   * Generate CSV content from BOM items
   */
  private generateCsv(items: BomItem[]): string {
    const headers = ['Pozíció', 'Típus', 'Név', 'Anyagtípus', 'Méretek (LxWxH mm)', 'Mennyiség', 'Egység', 'Súly (kg)'];
    const rows = items.map(item => [
      item.position.toString(),
      item.type === 'raw_material' ? 'Nyersanyag' : 'Gyártott komponens',
      item.name,
      item.material_type || '-',
      item.dimensions ? `${item.dimensions.length}x${item.dimensions.width}x${item.dimensions.height}` : '-',
      item.quantity.toString(),
      item.unit === 'piece' ? 'db' : item.unit === 'square_meter' ? 'm²' : item.unit === 'linear_meter' ? 'm' : 'kg',
      item.weight ? item.weight.toFixed(2) : '-',
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }
}
