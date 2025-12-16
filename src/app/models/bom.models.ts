/**
 * BOM Data Models based on database schema
 */

export interface RawMaterialType {
  id: number;
  name: string;
  created_at: Date;
  updated_at: Date;
}

export interface ManufacturedComponentType {
  id: number;
  name: string;
  created_at: Date;
  updated_at: Date;
}

export interface RawMaterial {
  id: number;
  height: number;
  width: number;
  length: number;
  raw_material_type_id: number;
  manufactured_component_type_id: number | null;
  quantity: number;
  created_at: Date;
  updated_at: Date;
  // Joined data (for display)
  raw_material_type?: RawMaterialType;
}

export interface ManufacturedComponent {
  id: number;
  component_list_id: number;
  manufactured_component_type_id: number;
  quantity: number;
  created_at: Date;
  updated_at: Date;
  // Joined data (for display)
  manufactured_component_type?: ManufacturedComponentType;
}

export interface ComponentList {
  id: number;
  created_by: number;
  created_at: Date;
  updated_at: Date;
  // Related data
  raw_materials?: RawMaterial[];
  manufactured_components?: ManufacturedComponent[];
}

export interface ComponentListAudit {
  id: number;
  operation_name: string;
  user_id: number;
  created_at: Date;
  updated_at: Date;
}

/**
 * Unified BOM Item for UI display
 * Combines raw materials and manufactured components into a single view
 */
export interface BomItem {
  id: number;
  position: number;
  type: 'raw_material' | 'manufactured_component';
  name: string;
  material_type?: string; // For raw materials
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  quantity: number;
  unit: 'piece' | 'square_meter' | 'linear_meter' | 'kg';
  weight?: number; // Calculated or specified weight
  notes?: string;
}

