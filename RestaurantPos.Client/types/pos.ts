export enum StationType {
  Kitchen = 0,
  Bar = 1
}

export interface ProductDto {
  id: string; // Guid
  name: string;
  basePrice: number;
  isActive: boolean;
  categoryId: string;
  preparationStation: number;
  modifierGroups: ModifierGroupDto[];
}

export interface ModifierGroupDto {
  id: string;
  name: string;
  selectionType: number; // 0 = Single, 1 = Multiple
  minSelection: number;
  maxSelection: number;
  modifiers: ModifierDto[];
}

export interface ModifierDto {
  id: string;
  name: string;
  priceAdjustment: number;
}

export enum TableStatus {
  Free = 0,
  Occupied = 1,
  Reserved = 2
}

export interface Table {
  id: string;
  name: string;
  capacity: number;
  status: TableStatus;
}
