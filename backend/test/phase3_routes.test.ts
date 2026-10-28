import { describe, it, expect } from 'vitest';
import { googleRoutesService } from '../src/services/googleRoutesService.js';
import { placesService } from '../src/services/placesService.js';

describe('Phase 3: Google Maps Routes & Places Calculation', () => {
  it('should calculate traffic-aware route from Whitefield to Nexus Koramangala', async () => {
    const origin = { lat: 12.9850, lng: 77.7300 }; // Whitefield ITPL
    const destination = { lat: 12.9345, lng: 77.6111 }; // PVR Koramangala

    const route = await googleRoutesService.computeRoute(origin, destination);

    expect(route).toBeDefined();
    expect(route.distanceMeters).toBeGreaterThan(15000); // ~21 km
    expect(route.durationSeconds).toBeGreaterThan(45 * 60); // ~55 mins with traffic
    expect(route.trafficStatus).toBe('heavy');
    expect(route.pathPoints.length).toBeGreaterThanOrEqual(2);
  });

  it('should calculate faster route from Electronic City to Nexus Koramangala', async () => {
    const origin = { lat: 12.8452, lng: 77.6602 }; // Electronic City
    const destination = { lat: 12.9345, lng: 77.6111 }; // PVR Koramangala

    const route = await googleRoutesService.computeRoute(origin, destination);

    expect(route).toBeDefined();
    expect(route.distanceMeters).toBeLessThan(18000); // ~14 km
    expect(route.durationSeconds).toBeLessThan(45 * 60); // ~32 mins
    expect(route.durationSeconds).toBeLessThan(
      (await googleRoutesService.computeRoute({ lat: 12.9850, lng: 77.7300 }, destination)).durationSeconds
    );
  });

  it('should search Bengaluru places and return relevant destination suggestions', async () => {
    const results = await placesService.searchPlaces('Koramangala');
    expect(results.length).toBeGreaterThanOrEqual(1);

    const koramangalaPlace = results.find(p => p.name.includes('Koramangala') || p.address.includes('Koramangala'));
    expect(koramangalaPlace).toBeDefined();
    expect(koramangalaPlace?.coordinates.lat).toBeCloseTo(12.9345, 2);
  });

  it('should return default suggestions when search query is empty', async () => {
    const results = await placesService.searchPlaces('');
    expect(results.length).toBeGreaterThan(0);
  });

  it('should calculate reasonable route estimates for arbitrary coordinates', async () => {
    // Indiranagar to Koramangala
    const origin = { lat: 12.9784, lng: 77.6408 };
    const destination = { lat: 12.9345, lng: 77.6111 };

    const route = await googleRoutesService.computeRoute(origin, destination);
    expect(route.distanceMeters).toBeGreaterThan(0);
    expect(route.durationSeconds).toBeGreaterThan(0);
    expect(route.distanceFormatted).toBeDefined();
  });
});
