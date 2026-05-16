import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { MapsService } from './maps.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('maps')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('maps')
export class MapsController {
  constructor(private maps: MapsService) {}

  @Get('geocode')
  @ApiOperation({ summary: 'Geocode an address — returns lat/lng results' })
  async geocode(@Query('q') query: string): Promise<any> {
    return this.maps.geocode(query);
  }

  @Get('reverse-geocode')
  @ApiOperation({ summary: 'Reverse geocode — lat/lng to address' })
  async reverseGeocode(@Query('lat') lat: string, @Query('lng') lng: string): Promise<any> {
    return this.maps.reverseGeocode(+lat, +lng);
  }

  @Get('route')
  @ApiOperation({ summary: 'Get route between two points' })
  async getRoute(
    @Query('fromLat') fromLat: string,
    @Query('fromLng') fromLng: string,
    @Query('toLat') toLat: string,
    @Query('toLng') toLng: string,
  ): Promise<any> {
    return this.maps.getRoute(
      { lat: +fromLat, lng: +fromLng },
      { lat: +toLat, lng: +toLng },
    );
  }

  @Get('static-map')
  @ApiOperation({ summary: 'Get a static map image URL' })
  async staticMap(
    @Query('lat') lat: string,
    @Query('lng') lng: string,
    @Query('zoom') zoom = '14',
  ): Promise<any> {
    return this.maps.getStaticMapUrl({ lat: +lat, lng: +lng }, +zoom);
  }
}
