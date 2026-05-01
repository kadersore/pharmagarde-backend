import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import { PropsWithChildren, createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Platform } from "react-native";

import { fetchClinics, fetchMedicines, fetchPharmacies, normalizeBaseUrl } from "./api";
import { DEFAULT_LOCATION, getDefaultLocationFallback } from "./location-policy";
import { CombinedSearchItem, Coordinates, FavoriteItem, HealthPlace, Medicine, favoriteKey } from "./types";

const FAVORITES_KEY = "pharmagarde:favorites:v1";
const API_URL_KEY = "pharmagarde:api-url:v1";
const INITIAL_API_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? "";

type DataErrors = {
  pharmacies?: string;
  clinics?: string;
  medicines?: string;
  location?: string;
};

type PharmaGardeContextValue = {
  apiBaseUrl: string;
  isApiConfigured: boolean;
  updateApiBaseUrl: (value: string) => Promise<void>;
  userLocation?: Coordinates;
  locationMessage?: string;
  pharmacies: HealthPlace[];
  clinics: HealthPlace[];
  medicines: Medicine[];
  favorites: FavoriteItem[];
  favoriteKeys: Set<string>;
  errors: DataErrors;
  loading: boolean;
  refreshingLocation: boolean;
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  requestLocation: () => Promise<void>;
  refreshData: () => Promise<void>;
  toggleFavorite: (item: FavoriteItem) => Promise<void>;
  searchResults: CombinedSearchItem[];
};

const PharmaGardeContext = createContext<PharmaGardeContextValue | null>(null);

function toFavoriteFromPlace(place: HealthPlace): FavoriteItem {
  return {
    id: place.id,
    entityType: place.type,
    title: place.name,
    subtitle: place.address ?? place.city,
    metadata: place.distanceKm !== undefined ? `${place.distanceKm.toFixed(1)} km` : place.isOpen === true ? "Ouvert" : undefined,
    phone: place.phone,
    latitude: place.latitude,
    longitude: place.longitude,
  };
}

function toFavoriteFromMedicine(medicine: Medicine): FavoriteItem {
  return {
    id: medicine.id,
    entityType: "medicine",
    title: medicine.name,
    subtitle: medicine.category,
    metadata: medicine.pharmaceuticalType,
  };
}

function asSearchText(item: FavoriteItem) {
  return [item.title, item.subtitle, item.metadata, item.entityType].filter(Boolean).join(" ").toLowerCase();
}

export function PharmaGardeProvider({ children }: PropsWithChildren) {
  const [apiBaseUrl, setApiBaseUrl] = useState(normalizeBaseUrl(INITIAL_API_URL));
  const [userLocation, setUserLocation] = useState<Coordinates | undefined>(DEFAULT_LOCATION);
  const [locationMessage, setLocationMessage] = useState<string | undefined>(undefined);
  const [pharmacies, setPharmacies] = useState<HealthPlace[]>([]);
  const [clinics, setClinics] = useState<HealthPlace[]>([]);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [errors, setErrors] = useState<DataErrors>({});
  const [loading, setLoading] = useState(false);
  const [refreshingLocation, setRefreshingLocation] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const isApiConfigured = apiBaseUrl.length > 0;

  useEffect(() => {
    let mounted = true;
    async function hydrate() {
      const [storedApiUrl, storedFavorites] = await Promise.all([AsyncStorage.getItem(API_URL_KEY), AsyncStorage.getItem(FAVORITES_KEY)]);
      if (!mounted) return;
      if (storedApiUrl) setApiBaseUrl(normalizeBaseUrl(storedApiUrl));
      if (storedFavorites) {
        try {
          const parsed = JSON.parse(storedFavorites) as FavoriteItem[];
          if (Array.isArray(parsed)) setFavorites(parsed);
        } catch {
          setFavorites([]);
        }
      }
    }
    hydrate();
    return () => {
      mounted = false;
    };
  }, []);

  const requestLocation = useCallback(async () => {
    setRefreshingLocation(true);
    setLocationMessage(undefined);

    const useDefaultLocation = () => {
      const fallback = getDefaultLocationFallback();
      setUserLocation(fallback.location);
      setLocationMessage(fallback.message);
    };

    try {
      if (Platform.OS === "web" && typeof navigator !== "undefined" && !navigator.geolocation) {
        useDefaultLocation();
        return;
      }
      const serviceEnabled = Platform.OS === "web" ? true : await Location.hasServicesEnabledAsync();
      if (!serviceEnabled) {
        useDefaultLocation();
        return;
      }
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== "granted") {
        useDefaultLocation();
        return;
      }
      const current = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setUserLocation({ latitude: current.coords.latitude, longitude: current.coords.longitude });
      setLocationMessage("Position détectée pour les recherches de proximité.");
    } catch {
      useDefaultLocation();
    } finally {
      setRefreshingLocation(false);
    }
  }, []);

  const refreshData = useCallback(async () => {
    if (!isApiConfigured) {
      setPharmacies([]);
      setClinics([]);
      setMedicines([]);
      setErrors({
        pharmacies: "Configurez l’URL API dans le menu pour charger les pharmacies réelles.",
        clinics: "Configurez l’URL API dans le menu pour charger les cliniques réelles.",
        medicines: "Configurez l’URL API dans le menu pour charger les médicaments réels.",
      });
      return;
    }

    setLoading(true);
    const nextErrors: DataErrors = {};
    const [pharmacyResult, clinicResult, medicineResult] = await Promise.allSettled([
      fetchPharmacies(apiBaseUrl, userLocation),
      fetchClinics(apiBaseUrl, userLocation),
      fetchMedicines(apiBaseUrl),
    ]);

    if (pharmacyResult.status === "fulfilled") setPharmacies(pharmacyResult.value);
    else {
      setPharmacies([]);
      nextErrors.pharmacies = pharmacyResult.reason instanceof Error ? pharmacyResult.reason.message : "Erreur de chargement des pharmacies.";
    }

    if (clinicResult.status === "fulfilled") setClinics(clinicResult.value);
    else {
      setClinics([]);
      nextErrors.clinics = clinicResult.reason instanceof Error ? clinicResult.reason.message : "Erreur de chargement des cliniques.";
    }

    if (medicineResult.status === "fulfilled") setMedicines(medicineResult.value);
    else {
      setMedicines([]);
      nextErrors.medicines = medicineResult.reason instanceof Error ? medicineResult.reason.message : "Erreur de chargement des médicaments.";
    }

    setErrors(nextErrors);
    setLoading(false);
  }, [apiBaseUrl, isApiConfigured, userLocation]);

  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const updateApiBaseUrl = useCallback(async (value: string) => {
    const next = normalizeBaseUrl(value);
    setApiBaseUrl(next);
    await AsyncStorage.setItem(API_URL_KEY, next);
  }, []);

  const toggleFavorite = useCallback(async (item: FavoriteItem) => {
    const key = favoriteKey(item.entityType, item.id);
    setFavorites((current) => {
      const exists = current.some((favorite) => favoriteKey(favorite.entityType, favorite.id) === key);
      const next = exists ? current.filter((favorite) => favoriteKey(favorite.entityType, favorite.id) !== key) : [item, ...current];
      AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const favoriteKeys = useMemo(() => new Set(favorites.map((item) => favoriteKey(item.entityType, item.id))), [favorites]);

  const allSearchItems = useMemo<CombinedSearchItem[]>(() => {
    return [
      ...pharmacies.map((place) => ({ ...toFavoriteFromPlace(place), sourceLabel: "Pharmacie" })),
      ...clinics.map((place) => ({ ...toFavoriteFromPlace(place), sourceLabel: "Clinique" })),
      ...medicines.map((medicine) => ({ ...toFavoriteFromMedicine(medicine), sourceLabel: "Médicament" })),
    ];
  }, [clinics, medicines, pharmacies]);

  const searchResults = useMemo(() => {
    const normalized = searchQuery.trim().toLowerCase();
    if (!normalized) return allSearchItems;
    return allSearchItems.filter((item) => asSearchText(item).includes(normalized));
  }, [allSearchItems, searchQuery]);

  const value = useMemo<PharmaGardeContextValue>(() => ({
    apiBaseUrl,
    isApiConfigured,
    updateApiBaseUrl,
    userLocation,
    locationMessage,
    pharmacies,
    clinics,
    medicines,
    favorites,
    favoriteKeys,
    errors,
    loading,
    refreshingLocation,
    searchQuery,
    setSearchQuery,
    requestLocation,
    refreshData,
    toggleFavorite,
    searchResults,
  }), [apiBaseUrl, clinics, errors, favoriteKeys, favorites, isApiConfigured, loading, locationMessage, medicines, pharmacies, refreshingLocation, requestLocation, refreshData, searchQuery, searchResults, toggleFavorite, updateApiBaseUrl, userLocation]);

  return <PharmaGardeContext.Provider value={value}>{children}</PharmaGardeContext.Provider>;
}

export function usePharmaGarde() {
  const context = useContext(PharmaGardeContext);
  if (!context) {
    throw new Error("usePharmaGarde doit être utilisé dans PharmaGardeProvider");
  }
  return context;
}

export { toFavoriteFromMedicine, toFavoriteFromPlace };
