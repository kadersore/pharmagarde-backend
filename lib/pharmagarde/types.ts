export type EntityType = "pharmacy" | "clinic" | "medicine";

export type Coordinates = {
  latitude: number;
  longitude: number;
};

export type HealthPlace = {
  id: string;
  type: "pharmacy" | "clinic";
  name: string;
  address?: string;
  city?: string;
  phone?: string;
  distanceKm?: number;
  latitude?: number;
  longitude?: number;
  isOpen?: boolean;
};

export type MedicineAgeCategory = "Enfant" | "Adulte" | "Tous";

export type Medicine = {
  id: string;
  type: "medicine";
  name: string;
  category?: string;
  ageCategory?: MedicineAgeCategory;
  pharmaceuticalType?: string;
  priceApprox?: number;
  description?: string;
  imageUrl?: string;
};

export type AppMode = "Clair" | "Sombre" | "Système";
export type AppLanguage = "Français" | "Mooré" | "Dioula" | "Fulfuldé";
export type MapPreference = "Standard" | "Satellite";

export type AppPreferences = {
  mode: AppMode;
  language: AppLanguage;
  mapType: MapPreference;
  city: string;
};

export type FavoriteItem = {
  id: string;
  entityType: EntityType;
  title: string;
  subtitle?: string;
  metadata?: string;
  phone?: string;
  latitude?: number;
  longitude?: number;
};

export type ApiState = {
  configured: boolean;
  message?: string;
};

export type CombinedSearchItem = FavoriteItem & {
  sourceLabel: string;
};

export function favoriteKey(entityType: EntityType, id: string) {
  return `${entityType}:${id}`;
}
