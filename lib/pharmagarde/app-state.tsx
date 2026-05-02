import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import { PropsWithChildren, createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Platform } from "react-native";

import { useThemeContext } from "@/lib/theme-provider";
import { fetchClinics, fetchMedicines, fetchPharmacies, getDefaultApiBaseUrl, normalizeBaseUrl } from "./api";
import { filterPlacesByCity, inferCityFromAddressParts, inferNearestKnownCity, normalizeCityName } from "./city-utils";
import { DEFAULT_LOCATION, getDefaultLocationFallback } from "./location-policy";
import { LOCAL_ESSENTIAL_MEDICINES, LOCAL_MEDICINES_NOTICE } from "./medicines-data";
import { sortPlacesByOpenThenDistance } from "./place-ordering";
import { AppPreferences, CombinedSearchItem, Coordinates, FavoriteItem, HealthPlace, Medicine, favoriteKey } from "./types";

const FAVORITES_KEY = "pharmagarde:favorites:v1";
const API_URL_KEY = "pharmagarde:api-url:v1";
const PREFERENCES_KEY = "pharmagarde:preferences:v1";
const INITIAL_API_URL = getDefaultApiBaseUrl();

const DEFAULT_PREFERENCES: AppPreferences = {
  mode: "Clair",
  language: "FR",
  mapType: "Standard",
  city: "Ouagadougou",
};

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
  preferences: AppPreferences;
  updatePreference: <Key extends keyof AppPreferences>(key: Key, value: AppPreferences[Key]) => Promise<void>;
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
    rating: place.rating,
    latitude: place.latitude,
    longitude: place.longitude,
  };
}

function toFavoriteFromMedicine(medicine: Medicine): FavoriteItem {
  const price = medicine.priceApprox !== undefined ? `${medicine.priceApprox.toLocaleString("fr-FR")} FCFA` : undefined;
  return {
    id: medicine.id,
    entityType: "medicine",
    title: medicine.name,
    subtitle: medicine.category,
    metadata: [medicine.ageCategory, medicine.pharmaceuticalType, price].filter(Boolean).join(" · "),
  };
}

function asSearchText(item: FavoriteItem) {
  return [item.title, item.subtitle, item.metadata, item.entityType].filter(Boolean).join(" ").toLowerCase();
}

function normalizePreferences(value: Partial<AppPreferences> | null | undefined): AppPreferences {
  const mode = value?.mode === "Sombre" ? "Sombre" : "Clair";
  const language = value?.language === "EN" ? "EN" : "FR";
  const mapType = value?.mapType === "Satellite" ? "Satellite" : "Standard";
  const city = typeof value?.city === "string" && value.city.trim().length > 0 ? value.city.trim() : DEFAULT_PREFERENCES.city;

  return { mode, language, mapType, city };
}

export function PharmaGardeProvider({ children }: PropsWithChildren) {
  const { setColorScheme } = useThemeContext();
  const [apiBaseUrl, setApiBaseUrl] = useState(normalizeBaseUrl(INITIAL_API_URL));
  const [userLocation, setUserLocation] = useState<Coordinates | undefined>(DEFAULT_LOCATION);
  const [locationMessage, setLocationMessage] = useState<string | undefined>(undefined);
  const [pharmacies, setPharmacies] = useState<HealthPlace[]>([]);
  const [clinics, setClinics] = useState<HealthPlace[]>([]);
  const [medicines, setMedicines] = useState<Medicine[]>(LOCAL_ESSENTIAL_MEDICINES);
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [errors, setErrors] = useState<DataErrors>({});
  const [loading, setLoading] = useState(false);
  const [refreshingLocation, setRefreshingLocation] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [preferences, setPreferences] = useState<AppPreferences>(DEFAULT_PREFERENCES);
  const lastAutoCityRef = useRef<string | undefined>(undefined);

  const isApiConfigured = apiBaseUrl.length > 0;

  useEffect(() => {
    let mounted = true;
    async function hydrate() {
      const [storedApiUrl, storedFavorites, storedPreferences] = await Promise.all([
        AsyncStorage.getItem(API_URL_KEY),
        AsyncStorage.getItem(FAVORITES_KEY),
        AsyncStorage.getItem(PREFERENCES_KEY),
      ]);
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
      if (storedPreferences) {
        try {
          const parsed = JSON.parse(storedPreferences) as Partial<AppPreferences>;
          setPreferences(normalizePreferences(parsed));
        } catch {
          setPreferences(DEFAULT_PREFERENCES);
        }
      }
    }
    hydrate();
    return () => {
      mounted = false;
    };
  }, []);

  const persistNextPreferences = useCallback((updater: (current: AppPreferences) => AppPreferences) => {
    setPreferences((current) => {
      const next = updater(current);
      AsyncStorage.setItem(PREFERENCES_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const updateCityFromCoordinates = useCallback(async (coordinates: Coordinates, source: "manual" | "watch" | "fallback" = "manual") => {
    const fallbackCity = inferNearestKnownCity(coordinates);
    let detectedCity = fallbackCity;

    try {
      const addresses = await Location.reverseGeocodeAsync(coordinates);
      const firstAddress = addresses[0];
      detectedCity = inferCityFromAddressParts([firstAddress?.city, firstAddress?.district, firstAddress?.subregion, firstAddress?.name, firstAddress?.formattedAddress]) ?? fallbackCity;
    } catch {
      detectedCity = fallbackCity;
    }

    const normalizedCity = normalizeCityName(detectedCity);
    if (source === "watch" && lastAutoCityRef.current === normalizedCity) return;
    lastAutoCityRef.current = normalizedCity;

    persistNextPreferences((current) => current.city === normalizedCity ? current : { ...current, city: normalizedCity });
    setLocationMessage(source === "fallback" ? `Position de référence utilisée pour ${normalizedCity}.` : `Position détectée : affichage des lieux de ${normalizedCity}.`);
  }, [persistNextPreferences]);

  const requestLocation = useCallback(async () => {
    setRefreshingLocation(true);
    setLocationMessage(undefined);

    const useDefaultLocation = async () => {
      const fallback = getDefaultLocationFallback();
      setUserLocation(fallback.location);
      await updateCityFromCoordinates(fallback.location, "fallback");
    };

    try {
      if (Platform.OS === "web" && typeof navigator !== "undefined" && !navigator.geolocation) {
        await useDefaultLocation();
        return;
      }
      const serviceEnabled = Platform.OS === "web" ? true : await Location.hasServicesEnabledAsync();
      if (!serviceEnabled) {
        await useDefaultLocation();
        return;
      }
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== "granted") {
        await useDefaultLocation();
        return;
      }
      const current = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const coordinates = { latitude: current.coords.latitude, longitude: current.coords.longitude };
      setUserLocation(coordinates);
      await updateCityFromCoordinates(coordinates, "manual");
    } catch {
      await useDefaultLocation();
    } finally {
      setRefreshingLocation(false);
    }
  }, [updateCityFromCoordinates]);

  const refreshData = useCallback(async () => {
    if (!isApiConfigured) {
      setPharmacies([]);
      setClinics([]);
      setMedicines(LOCAL_ESSENTIAL_MEDICINES);
      setErrors({
        pharmacies: "L’URL du backend est indisponible dans cet environnement. Réessayez depuis le domaine de prévisualisation ou après publication.",
        clinics: "L’URL du backend est indisponible dans cet environnement. Réessayez depuis le domaine de prévisualisation ou après publication.",
      });
      return;
    }

    setLoading(true);
    const nextErrors: DataErrors = {};
    const selectedCity = preferences.city;
    const [pharmacyResult, clinicResult, medicineResult] = await Promise.allSettled([
      fetchPharmacies(apiBaseUrl, userLocation, selectedCity),
      fetchClinics(apiBaseUrl, userLocation, selectedCity),
      fetchMedicines(apiBaseUrl),
    ]);

    if (pharmacyResult.status === "fulfilled") setPharmacies(sortPlacesByOpenThenDistance(filterPlacesByCity(pharmacyResult.value, selectedCity)));
    else {
      setPharmacies([]);
      nextErrors.pharmacies = pharmacyResult.reason instanceof Error ? pharmacyResult.reason.message : "Erreur de chargement des pharmacies.";
    }

    if (clinicResult.status === "fulfilled") setClinics(sortPlacesByOpenThenDistance(filterPlacesByCity(clinicResult.value, selectedCity)));
    else {
      setClinics([]);
      nextErrors.clinics = clinicResult.reason instanceof Error ? clinicResult.reason.message : "Erreur de chargement des cliniques.";
    }

    if (medicineResult.status === "fulfilled" && medicineResult.value.length > 0) setMedicines(medicineResult.value);
    else {
      setMedicines(LOCAL_ESSENTIAL_MEDICINES);
      nextErrors.medicines = medicineResult.status === "rejected" && medicineResult.reason instanceof Error ? `${medicineResult.reason.message} ${LOCAL_MEDICINES_NOTICE}` : LOCAL_MEDICINES_NOTICE;
    }

    setErrors(nextErrors);
    setLoading(false);
  }, [apiBaseUrl, isApiConfigured, preferences.city, userLocation]);

  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  useEffect(() => {
    let mounted = true;
    let subscription: Location.LocationSubscription | undefined;

    async function watchLocationChanges() {
      if (Platform.OS === "web") return;
      const permission = await Location.getForegroundPermissionsAsync();
      if (!mounted || permission.status !== "granted") return;
      const serviceEnabled = await Location.hasServicesEnabledAsync();
      if (!mounted || !serviceEnabled) return;

      subscription = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.Balanced, distanceInterval: 1200, timeInterval: 120000 },
        (position) => {
          const coordinates = { latitude: position.coords.latitude, longitude: position.coords.longitude };
          setUserLocation(coordinates);
          updateCityFromCoordinates(coordinates, "watch");
        },
      );
    }

    watchLocationChanges();
    return () => {
      mounted = false;
      subscription?.remove();
    };
  }, [updateCityFromCoordinates]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  useEffect(() => {
    setColorScheme(preferences.mode === "Sombre" ? "dark" : "light");
  }, [preferences.mode, setColorScheme]);

  const updateApiBaseUrl = useCallback(async (value: string) => {
    const next = normalizeBaseUrl(value);
    setApiBaseUrl(next);
    await AsyncStorage.setItem(API_URL_KEY, next);
  }, []);

  const updatePreference = useCallback(async <Key extends keyof AppPreferences>(key: Key, value: AppPreferences[Key]) => {
    persistNextPreferences((current) => {
      const nextValue = key === "city" && typeof value === "string" ? normalizeCityName(value) : value;
      return { ...current, [key]: nextValue };
    });
  }, [persistNextPreferences]);

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
    preferences,
    updatePreference,
    requestLocation,
    refreshData,
    toggleFavorite,
    searchResults,
  }), [apiBaseUrl, clinics, errors, favoriteKeys, favorites, isApiConfigured, loading, locationMessage, medicines, pharmacies, preferences, refreshingLocation, requestLocation, refreshData, searchQuery, searchResults, toggleFavorite, updateApiBaseUrl, updatePreference, userLocation]);

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
