export interface ProductDto {
  id: string; // Guid
  name: string;
  basePrice: number;
  isActive: boolean;
  categoryId: string;
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
