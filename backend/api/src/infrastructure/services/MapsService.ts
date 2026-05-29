import axios from 'axios';
import { env } from '../../config/env';
import { Coordinates, FareEstimate } from '../../shared/types';

const orsHttp = axios.create({
  baseURL: 'https://api.openrouteservice.org',
  headers: { Authorization: env.ORS_API_KEY },
  timeout: 10000,
});

export interface RouteResult {
  distanceKm: number;
  durationMinutes: number;
  geometry?: unknown;
}

export class MapsService {
  async getRoute(from: Coordinates, to: Coordinates): Promise<RouteResult> {
    if (!env.ORS_API_KEY) {
      // Fallback: Haversine distance estimate
      const dist = this.haversineKm(from, to);
      return { distanceKm: dist, durationMinutes: Math.round(dist * 3.5) };
    }

    const { data } = await orsHttp.post('/v2/directions/driving-car/json', {
      coordinates: [
        [from.lng, from.lat],
        [to.lng, to.lat],
      ],
    });

    const summary = data.routes[0].summary;
    return {
      distanceKm: +(summary.distance / 1000).toFixed(2),
      durationMinutes: Math.round(summary.duration / 60),
      geometry: data.routes[0].geometry,
    };
  }

  async geocode(query: string): Promise<Coordinates | null> {
    try {
      const { data } = await orsHttp.get('/geocode/search', {
        params: { text: query, size: 1 },
      });
      if (!data.features?.length) return null;
      const [lng, lat] = data.features[0].geometry.coordinates;
      return { lat, lng };
    } catch {
      return null;
    }
  }

  estimateFare(route: RouteResult, surgeMultiplier = 1, vehicleType: 'standard' | 'electric' = 'standard'): FareEstimate {
    const baseFare = env.BASE_FARE_KES;
    const distanceFare = route.distanceKm * env.KM_RATE_KES;
    const electricSurcharge = vehicleType === 'electric' ? 1.2 : 1;
    const surgeFare = (baseFare + distanceFare) * surgeMultiplier * electricSurcharge - (baseFare + distanceFare);
    const totalFare = Math.ceil((baseFare + distanceFare + surgeFare) * electricSurcharge);

    return {
      distanceKm: route.distanceKm,
      durationMinutes: route.durationMinutes,
      baseFare,
      distanceFare: +distanceFare.toFixed(2),
      surgeFare: +surgeFare.toFixed(2),
      totalFare,
      currency: 'KES',
    };
  }

  private haversineKm(a: Coordinates, b: Coordinates): number {
    const R = 6371;
    const dLat = this.deg2rad(b.lat - a.lat);
    const dLng = this.deg2rad(b.lng - a.lng);
    const x =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(a.lat)) * Math.cos(this.deg2rad(b.lat)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return +(R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x))).toFixed(2);
  }

  private deg2rad(d: number): number {
    return d * (Math.PI / 180);
  }
}

export const mapsService = new MapsService();
