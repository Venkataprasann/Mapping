import { BANGALORE_ORIGIN_LOCATIONS, BANGALORE_DESTINATIONS, BangaloreLocation } from '@/constants/bangaloreLocations';

export interface RoadRoute {
  path: Array<{ lat: number; lng: number }>;
  distanceKm: number;
  durationMins: number;
  trafficStatus: 'normal' | 'moderate' | 'heavy';
}

/**
 * Fetches real road geometry snapping to actual streets, flyovers, and highways in Bengaluru
 * using OSRM with automatic fallback to high-fidelity urban road corridors.
 */
export async function fetchBangaloreRoadRoute(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number }
): Promise<RoadRoute> {
  const url = `https://router.project-osrm.org/route/v1/driving/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000); // 4s timeout

    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      const route = data.routes?.[0];

      if (route && route.geometry?.coordinates?.length > 0) {
        // OSRM coordinates are [lng, lat]
        const rawCoords: [number, number][] = route.geometry.coordinates;

        // Downsample points slightly if huge (e.g. 600 points -> ~100 points) for buttery smooth 60fps animation
        const step = Math.max(1, Math.floor(rawCoords.length / 90));
        const path: Array<{ lat: number; lng: number }> = [];

        for (let i = 0; i < rawCoords.length; i += step) {
          path.push({ lat: rawCoords[i][1], lng: rawCoords[i][0] });
        }
        // Ensure destination is always exact last point
        const last = rawCoords[rawCoords.length - 1];
        if (path[path.length - 1].lat !== last[1] || path[path.length - 1].lng !== last[0]) {
          path.push({ lat: last[1], lng: last[0] });
        }

        const distanceMeters = route.distance || 0;
        const distanceKm = Math.round((distanceMeters / 1000) * 10) / 10;

        // Bengaluru peak traffic adjustment:
        // OSRM provides free-flow driving duration. In Bengaluru peak hours,
        // average speed is ~18-24 km/h depending on distance.
        const baseSeconds = route.duration || 600;
        let trafficMultiplier = 1.6;
        if (distanceKm > 25) trafficMultiplier = 1.35; // Airport expressways
        else if (distanceKm < 7) trafficMultiplier = 1.9; // Inner core bottlenecks

        const trafficSeconds = Math.round(baseSeconds * trafficMultiplier);
        const durationMins = Math.max(10, Math.round(trafficSeconds / 60));

        const trafficStatus = durationMins > distanceKm * 2.2 ? 'heavy' : durationMins > distanceKm * 1.5 ? 'moderate' : 'normal';

        return {
          path,
          distanceKm,
          durationMins,
          trafficStatus
        };
      }
    }
  } catch (err) {
    console.warn('[RoutingService] OSRM live routing fetch failed or timed out. Using fallback corridor path.', err);
  }

  // Fallback: Compute curved road corridor path
  return computeFallbackCorridor(origin, destination);
}

/**
 * Fallback realistic road path with urban curvature
 */
function computeFallbackCorridor(
  start: { lat: number; lng: number },
  end: { lat: number; lng: number }
): RoadRoute {
  const points: Array<{ lat: number; lng: number }> = [];
  const numSteps = 40;

  const deltaLat = end.lat - start.lat;
  const deltaLng = end.lng - start.lng;
  const perpLat = -deltaLng * 0.15;
  const perpLng = deltaLat * 0.15;

  for (let i = 0; i <= numSteps; i++) {
    const t = i / numSteps;
    const arc = 4 * t * (1 - t);
    const lat = (1 - t) * start.lat + t * end.lat + arc * perpLat;
    const lng = (1 - t) * start.lng + t * end.lng + arc * perpLng;
    points.push({ lat: Number(lat.toFixed(5)), lng: Number(lng.toFixed(5)) });
  }

  // Haversine distance
  const R = 6371;
  const dLat = ((end.lat - start.lat) * Math.PI) / 180;
  const dLng = ((end.lng - start.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((start.lat * Math.PI) / 180) *
      Math.cos((end.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const roadKm = Math.round(R * c * 1.38 * 10) / 10;
  const durationMins = Math.max(10, Math.round((roadKm / 21) * 60));

  return {
    path: points,
    distanceKm: roadKm,
    durationMins,
    trafficStatus: 'moderate'
  };
}

export interface SearchedLocation {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  zone?: string;
}

/**
 * Live search for any location, neighborhood, tech park, or mall across Bengaluru
 */
export async function searchBangaloreLocations(query: string): Promise<SearchedLocation[]> {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const results: SearchedLocation[] = [];

  // 1. Search local curated Bangalore places first for instant zero-latency feedback
  const localMatches = [...BANGALORE_ORIGIN_LOCATIONS, ...BANGALORE_DESTINATIONS].filter(
    item => item.name.toLowerCase().includes(q) || item.description?.toLowerCase().includes(q)
  );

  for (const m of localMatches) {
    results.push({
      id: m.id,
      name: m.name,
      address: m.description || `${m.name}, Bengaluru`,
      lat: m.lat,
      lng: m.lng,
      zone: m.zone
    });
  }

  // 2. Query Nominatim for live geocoding across all of Bengaluru
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query + ' bengaluru')}&limit=5&countrycodes=in`;
    const response = await fetch(nominatimUrl, {
      signal: controller.signal,
      headers: {
        'Accept-Language': 'en'
      }
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      for (const item of data) {
        const lat = parseFloat(item.lat);
        const lng = parseFloat(item.lon);

        // Only include if within greater Bengaluru bounding box: lat ~ 12.7 to 13.3, lng ~ 77.4 to 77.8
        if (lat >= 12.7 && lat <= 13.35 && lng >= 77.35 && lng <= 77.85) {
          const parts = item.display_name.split(',');
          const name = parts[0]?.trim() || query;
          const address = parts.slice(1, 4).join(',').trim() || 'Bengaluru, Karnataka';

          // Avoid duplicates
          if (!results.some(r => Math.abs(r.lat - lat) < 0.003 && Math.abs(r.lng - lng) < 0.003)) {
            results.push({
              id: `nom-${item.place_id || Date.now()}-${Math.random()}`,
              name,
              address,
              lat,
              lng
            });
          }
        }
      }
    }
  } catch (err) {
    // If live geocoding fails, local matches are still returned
    console.warn('[RoutingService] Nominatim search query error:', err);
  }

  return results.slice(0, 6);
}
