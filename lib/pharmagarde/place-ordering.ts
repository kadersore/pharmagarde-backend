import { HealthPlace } from "./types";

const UNKNOWN_DISTANCE_KM = Number.POSITIVE_INFINITY;

function openRank(place: HealthPlace) {
  return place.isOpen === true ? 0 : 1;
}

function distanceRank(place: HealthPlace) {
  return typeof place.distanceKm === "number" && Number.isFinite(place.distanceKm) ? place.distanceKm : UNKNOWN_DISTANCE_KM;
}

export function comparePlacesByOpenThenDistance(a: HealthPlace, b: HealthPlace) {
  const byOpenStatus = openRank(a) - openRank(b);
  if (byOpenStatus !== 0) return byOpenStatus;

  const aDistance = distanceRank(a);
  const bDistance = distanceRank(b);
  if (aDistance !== bDistance) return aDistance < bDistance ? -1 : 1;

  return a.name.localeCompare(b.name, "fr", { sensitivity: "base" });
}

export function sortPlacesByOpenThenDistance(places: HealthPlace[]) {
  return [...places].sort(comparePlacesByOpenThenDistance);
}
