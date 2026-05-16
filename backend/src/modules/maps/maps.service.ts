import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

interface Coordinates {
  lat: number;
  lng: number;
}

interface RouteResult {
  distanceKm: number;
  durationMinutes: number;
  geometry: any;
}

@Injectable()
export class MapsService {
  private readonly logger = new Logger(MapsService.name);
  private readonly mapboxToken: string;
  private readonly mapboxBase: string;

  constructor(private config: ConfigService) {
    this.mapboxToken = config.getOrThrow('MAPBOX_ACCESS_TOKEN');
    this.mapboxBase = config.get('MAPBOX_BASE_URL', 'https://api.mapbox.com');
  }

  async geocode(query: string): Promise<{ lat: number; lng: number; address: string }[]> {
    const url = `${this.mapboxBase}/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json`;
    const response = await axios.get(url, {
      params: {
        access_token: this.mapboxToken,
        country: 'ke,ug,tz,gh,ng',
        limit: 5,
        types: 'address,place,poi',
      },
    });

    return (response.data.features || []).map((f: any) => ({
      lat: f.center[1],
      lng: f.center[0],
      address: f.place_name,
    }));
  }

  async reverseGeocode(lat: number, lng: number): Promise<string> {
    const url = `${this.mapboxBase}/geocoding/v5/mapbox.places/${lng},${lat}.json`;
    const response = await axios.get(url, {
      params: { access_token: this.mapboxToken, limit: 1 },
    });

    const feature = response.data.features?.[0];
    return feature?.place_name || `${lat}, ${lng}`;
  }

  async getRoute(origin: Coordinates, destination: Coordinates): Promise<RouteResult> {
    const url = `${this.mapboxBase}/directions/v5/mapbox/driving/${origin.lng},${origin.lat};${destination.lng},${destination.lat}`;

    const response = await axios.get(url, {
      params: {
        access_token: this.mapboxToken,
        geometries: 'geojson',
        overview: 'simplified',
        steps: false,
      },
    });

    const route = response.data.routes?.[0];
    if (!route) throw new BadRequestException('No route found');

    return {
      distanceKm: Math.round((route.distance / 1000) * 10) / 10,
      durationMinutes: Math.round(route.duration / 60),
      geometry: route.geometry,
    };
  }

  async getRouteWithWaypoints(points: Coordinates[]): Promise<RouteResult> {
    if (points.length < 2) throw new BadRequestException('At least 2 points required');

    const coords = points.map((p) => `${p.lng},${p.lat}`).join(';');
    const url = `${this.mapboxBase}/directions/v5/mapbox/driving/${coords}`;

    const response = await axios.get(url, {
      params: { access_token: this.mapboxToken, geometries: 'geojson', overview: 'simplified' },
    });

    const route = response.data.routes?.[0];
    if (!route) throw new BadRequestException('No route found');

    return {
      distanceKm: Math.round((route.distance / 1000) * 10) / 10,
      durationMinutes: Math.round(route.duration / 60),
      geometry: route.geometry,
    };
  }

  calculateHaversineDistance(origin: Coordinates, destination: Coordinates): number {
    const R = 6371;
    const dLat = this.toRad(destination.lat - origin.lat);
    const dLng = this.toRad(destination.lng - origin.lng);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(this.toRad(origin.lat)) *
        Math.cos(this.toRad(destination.lat)) *
        Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  async getStaticMapUrl(center: Coordinates, zoom = 14, width = 600, height = 400): Promise<string> {
    return `${this.mapboxBase}/styles/v1/mapbox/dark-v11/static/${center.lng},${center.lat},${zoom}/${width}x${height}?access_token=${this.mapboxToken}`;
  }

  private toRad(deg: number): number {
    return (deg * Math.PI) / 180;
  }
}
