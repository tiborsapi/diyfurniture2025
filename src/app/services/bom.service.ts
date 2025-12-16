import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { delay, map, catchError } from 'rxjs/operators';
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

// Backend DTO interfaces
export interface ComponentListDTO {
  id: number;
  createdBy: number;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
  furnitureBodyId?: number;
  rawMaterials?: RawMaterialDTO[];
}

export interface RawMaterialDTO {
  id: number;
  height: number;
  width: number;
  length: number;
  quantity: number;
  rawMaterialTypeName: string;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}

export interface FurnitureBodyDTO {
  id?: number;
  width: number;
  heigth: number; // Note: backend uses "heigth" (typo)
  depth: number;
  thickness: number;
  frontElements?: FrontElementDTO[];
  mainFrontElementId?: number;
}

export interface FrontElementDTO {
  id?: number;
  furnitureBodyId?: number;
  elementType: string;
  posX: number;
  posY: number;
  width: number;
  height: number;
  details?: string;
  rawMaterialTypeName?: string;
}

@Injectable({
  providedIn: 'root',
})
export class BomService {
  private readonly baseUrl = environment.apiBase + '/api';

  // Mock data - Raw Material Types (kept for fallback)
  private readonly MOCK_RAW_MATERIAL_TYPES: RawMaterialType[] = [
    { id: 1, name: 'Fenyőfa', created_at: new Date('2024-01-01'), updated_at: new Date('2024-01-01') },
    { id: 2, name: 'Bükkfa', created_at: new Date('2024-01-01'), updated_at: new Date('2024-01-01') },
    { id: 3, name: 'Tölgyfa', created_at: new Date('2024-01-01'), updated_at: new Date('2024-01-01') },
    { id: 4, name: 'Alumínium', created_at: new Date('2024-01-01'), updated_at: new Date('2024-01-01') },
    { id: 5, name: 'Üveg', created_at: new Date('2024-01-01'), updated_at: new Date('2024-01-01') },
    { id: 6, name: 'MDF', created_at: new Date('2024-01-01'), updated_at: new Date('2024-01-01') },
  ];

  // Mock data - Manufactured Component Types (kept for fallback)
  private readonly MOCK_MANUFACTURED_COMPONENT_TYPES: ManufacturedComponentType[] = [
    { id: 1, name: 'Fém kilincs', created_at: new Date('2024-01-01'), updated_at: new Date('2024-01-01') },
    { id: 2, name: 'Fa kilincs', created_at: new Date('2024-01-01'), updated_at: new Date('2024-01-01') },
    { id: 3, name: 'Zár', created_at: new Date('2024-01-01'), updated_at: new Date('2024-01-01') },
    { id: 4, name: 'Csavar (M6x40)', created_at: new Date('2024-01-01'), updated_at: new Date('2024-01-01') },
    { id: 5, name: 'Csavar (M8x60)', created_at: new Date('2024-01-01'), updated_at: new Date('2024-01-01') },
    { id: 6, name: 'Sarkantyú', created_at: new Date('2024-01-01'), updated_at: new Date('2024-01-01') },
    { id: 7, name: 'Pant', created_at: new Date('2024-01-01'), updated_at: new Date('2024-01-01') },
  ];

  // Mock data - Component List (kept for regenerateBom fallback)
  private readonly MOCK_COMPONENT_LIST: ComponentList = {
    id: 1,
    created_by: 1,
    created_at: new Date('2024-01-15'),
    updated_at: new Date('2024-01-20'),
    raw_materials: [],
    manufactured_components: [],
  };
  
  constructor(private http: HttpClient) {}

  /**
   * Maps backend ComponentListDTO to frontend ComponentList model
   */
  private mapDtoToComponentList(dto: ComponentListDTO): ComponentList {
    const componentList: ComponentList = {
      id: dto.id,
      created_by: dto.createdBy,
      created_at: new Date(dto.createdAt),
      updated_at: new Date(dto.updatedAt),
      raw_materials: [],
      manufactured_components: [], // Backend doesn't return this yet
    };

    if (dto.rawMaterials) {
      componentList.raw_materials = dto.rawMaterials.map(rm => ({
        id: rm.id,
        height: rm.height,
        width: rm.width,
        length: rm.length,
        raw_material_type_id: 0, // Will be resolved by name lookup
        manufactured_component_type_id: null,
        quantity: rm.quantity,
        created_at: new Date(rm.createdAt),
        updated_at: new Date(rm.updatedAt),
        raw_material_type: {
          id: 0, // Will be resolved
          name: rm.rawMaterialTypeName,
          created_at: new Date(rm.createdAt),
          updated_at: new Date(rm.updatedAt),
        },
      }));
    }

    return componentList;
  }

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
          this.MOCK_RAW_MATERIAL_TYPES.find((t: RawMaterialType) => t.id === rawMaterial.raw_material_type_id);
        
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
          this.MOCK_MANUFACTURED_COMPONENT_TYPES.find((t: ManufacturedComponentType) => t.id === component.manufactured_component_type_id);

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
   * GET /api/component-lists?furnitureBodyId=:id
   * Note: Backend doesn't have a direct endpoint for this, so we fetch all and filter
   */
  getBom(bodyId: number): Observable<BomItem[]> {
    return this.http.get<ComponentListDTO[]>(`${this.baseUrl}/component-lists`).pipe(
      map(dtos => {
        // Find component list for the given furniture body ID
        const dto = dtos.find(cl => cl.furnitureBodyId === bodyId);
        if (!dto) {
          return [];
        }
        const componentList = this.mapDtoToComponentList(dto);
        return this.convertToBomItems(componentList);
      }),
      catchError(error => {
        console.error('Error fetching BOM:', error);
        return of([]);
      })
    );
  }

  /**
   * Get all BOMs
   * GET /api/component-lists
   */
  getBoms(): Observable<BomItem[]> {
    return this.http.get<ComponentListDTO[]>(`${this.baseUrl}/component-lists`).pipe(
      map(dtos => {
        const allItems: BomItem[] = [];
        dtos.forEach(dto => {
          const componentList = this.mapDtoToComponentList(dto);
          allItems.push(...this.convertToBomItems(componentList));
        });
        return allItems;
      }),
      catchError(error => {
        console.error('Error fetching BOMs:', error);
        return of([]);
      })
    );
  }

  /**
   * Get BOM for a specific project
   * GET /api/component-lists (filtered by furnitureBodyId if projectId provided)
   */
  getBomForProject(projectId?: number): Observable<BomItem[]> {
    if (projectId) {
      // If projectId is provided, treat it as furnitureBodyId
      return this.getBom(projectId);
    }
    
    // If no projectId, return all BOMs
    return this.getBoms();
  }

  /**
   * Get component list by ID
   * GET /api/component-lists/:id
   */
  getComponentListById(id: number): Observable<ComponentList | null> {
    return this.http.get<ComponentListDTO>(`${this.baseUrl}/component-lists/${id}`).pipe(
      map(dto => this.mapDtoToComponentList(dto)),
      catchError(error => {
        console.error('Error fetching component list:', error);
        return of(null);
      })
    );
  }

  /**
   * Get furniture items from backend
   */
  getFurnitureItems(): Observable<FurnitureBackendItem[]> {
    return this.http.get<FurnitureBackendItem[]>(`${this.baseUrl}/furniture/all`);
  }

  /**
   * Save furniture and create component list
   * POST /api/furniture?createdBy=:userId
   * This uses the ComponentListController endpoint instead of FurnitureController
   */
  saveFurnitureAndComponentList(furnitureBody: FurnitureBodyDTO, createdBy: number): Observable<ComponentListDTO> {
    const params = new HttpParams().set('createdBy', String(createdBy));
    return this.http.post<ComponentListDTO>(`${this.baseUrl}/furniture`, furnitureBody, { params }).pipe(
      catchError(error => {
        console.error('Error saving furniture and component list:', error);
        throw error;
      })
    );
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
   * Note: Backend doesn't have an export endpoint, so we generate CSV on the frontend
   */
  exportBomToCsv(projectId: number): Observable<Blob> {
    // Fetch actual BOM data and generate CSV
    return this.getBomForProject(projectId).pipe(
      map(bomItems => {
        const csvContent = this.generateCsv(bomItems);
        return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      }),
      catchError(error => {
        console.error('Error exporting BOM to CSV:', error);
        // Return empty CSV on error
        const emptyCsv = new Blob([''], { type: 'text/csv;charset=utf-8;' });
        return of(emptyCsv);
      })
    );
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
