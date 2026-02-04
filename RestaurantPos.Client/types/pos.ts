export enum StationType {
  Kitchen = 0,
  Bar = 1
}

export enum StationRouting {
  KitchenOnly = 0,
  BarOnly = 1,
  Both = 2
}

export enum AllergenType {
  None = 0,
  Gluten = 1,
  Dairy = 2,
  Nuts = 4,
  Eggs = 8,
  Fish = 16,
  Shellfish = 32,
  Soy = 64,
  Sesame = 128
}

export interface ProductDto {
  id: string; // Guid
  name: string;
  description?: string;
  basePrice: number;
  costPrice?: number;
  discountedPrice?: number;
  isActive: boolean;
  categoryId?: string | null;
  categoryName?: string;
  allergens: number; // AllergenType as int (flags)
  stationRouting: number; // StationRouting as int
  printerIds?: string; // JSON string
  imageUrl?: string;
  preparationStation: number; // Legacy field
  modifierGroups: ModifierGroupDto[];
  recipeItems?: RecipeItemDto[];
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

export interface RecipeItemDto {
  id: string;
  rawMaterialId: string;
  rawMaterialName: string;
  amount: number;
  unit: string;
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

export enum CategoryDisplayMode {
  Grid = 0,
  List = 1,
  ListNoImage = 2,
  CardCarousel = 3
}

export interface CategoryDto {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  sortOrder: number;
  displayMode: CategoryDisplayMode;
  isActive: boolean;
}
