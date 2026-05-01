export type HealthPlaceType = "pharmacy" | "clinic";

export type HealthPlace = {
  id: string;
  type: HealthPlaceType;
  name: string;
  address: string;
  city: string;
  phone?: string;
  latitude: number;
  longitude: number;
  isOpen?: boolean;
  distanceKm?: number;
};

export const pharmacies: HealthPlace[] = [
  {
    id: "pharmacie-ouaga-centre",
    type: "pharmacy",
    name: "Pharmacie Ouaga Centre",
    address: "Avenue Kwame Nkrumah, centre-ville",
    city: "Ouagadougou",
    phone: "+226 25 30 00 00",
    latitude: 12.3686,
    longitude: -1.5275,
    isOpen: true,
  },
  {
    id: "pharmacie-wemtenga",
    type: "pharmacy",
    name: "Pharmacie de Wemtenga",
    address: "Quartier Wemtenga",
    city: "Ouagadougou",
    phone: "+226 25 36 10 10",
    latitude: 12.3761,
    longitude: -1.4854,
    isOpen: true,
  },
  {
    id: "pharmacie-pissy",
    type: "pharmacy",
    name: "Pharmacie de Pissy",
    address: "Secteur Pissy",
    city: "Ouagadougou",
    phone: "+226 25 43 20 20",
    latitude: 12.3441,
    longitude: -1.5852,
    isOpen: false,
  },
  {
    id: "pharmacie-bobo-centre",
    type: "pharmacy",
    name: "Pharmacie Bobo Centre",
    address: "Centre-ville",
    city: "Bobo-Dioulasso",
    phone: "+226 20 97 00 00",
    latitude: 11.1771,
    longitude: -4.2979,
    isOpen: true,
  },
];

export const clinics: HealthPlace[] = [
  {
    id: "clinique-les-genets",
    type: "clinic",
    name: "Clinique Les Genêts",
    address: "Zone du Bois",
    city: "Ouagadougou",
    phone: "+226 25 36 40 40",
    latitude: 12.3832,
    longitude: -1.5009,
    isOpen: true,
  },
  {
    id: "clinique-notre-dame-paix",
    type: "clinic",
    name: "Clinique Notre Dame de la Paix",
    address: "Quartier Patte d’Oie",
    city: "Ouagadougou",
    phone: "+226 25 38 50 50",
    latitude: 12.3296,
    longitude: -1.5283,
    isOpen: true,
  },
  {
    id: "clinique-sandof",
    type: "clinic",
    name: "Clinique Sandof",
    address: "Secteur 22",
    city: "Bobo-Dioulasso",
    phone: "+226 20 98 11 11",
    latitude: 11.1689,
    longitude: -4.3075,
    isOpen: true,
  },
];

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

export function calculateDistanceKm(origin: { lat: number; lng: number }, place: Pick<HealthPlace, "latitude" | "longitude">) {
  const earthRadiusKm = 6371;
  const latitudeDelta = toRadians(place.latitude - origin.lat);
  const longitudeDelta = toRadians(place.longitude - origin.lng);
  const originLatitude = toRadians(origin.lat);
  const placeLatitude = toRadians(place.latitude);

  const haversine =
    Math.sin(latitudeDelta / 2) * Math.sin(latitudeDelta / 2) +
    Math.cos(originLatitude) * Math.cos(placeLatitude) * Math.sin(longitudeDelta / 2) * Math.sin(longitudeDelta / 2);

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}

export function getNearbyPlaces(places: HealthPlace[], origin: { lat: number; lng: number }, maxDistanceKm = 25) {
  return places
    .map((place) => ({
      ...place,
      distanceKm: Number(calculateDistanceKm(origin, place).toFixed(2)),
    }))
    .filter((place) => place.distanceKm <= maxDistanceKm)
    .sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0));
}
