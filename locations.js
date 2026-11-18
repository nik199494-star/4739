import {normalize} from './model.js';

const isPosition = (xy) => Array.isArray(xy) && xy.length === 2 && xy.every(Number.isFinite)
  && xy[0] >= 40 && xy[0] <= 83 && Math.abs(xy[1]) <= 180;

export function attachLocations(points, coordinates) {
  return points.map(point => {
    const known = Object.hasOwn(coordinates, point.id) ? coordinates[point.id] : null;
    const matches = known && !point.addressConflict && normalize(known.city) === normalize(point.city)
      && normalize(known.address) === normalize(point.address) && isPosition(known.xy);
    return {...point, location: matches ? {state: 'mapped', xy: known.xy} : {state: 'unresolved', xy: null}};
  });
}

export function findCityCenter(cities, city) {
  const key = normalize(city).replace(/^(?:г|город|рп|рабочий поселок|поселок|пгт) /u, '');
  return Object.hasOwn(cities, key) && isPosition(cities[key]) ? cities[key] : null;
}

export async function loadLocations() {
  const read = async (name) => {
    try {
      const response = await fetch(new URL(name, import.meta.url));
      if (response.ok) return await response.json();
    } catch { /* The list remains available when location assets cannot load. */ }
    return {};
  };
  const [coordinates, cities] = await Promise.all([read('coordinates.json'), read('ru-city-centers.json')]);
  return {coordinates, cities};
}
