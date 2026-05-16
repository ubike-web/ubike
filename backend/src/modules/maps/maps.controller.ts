import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { MapsService } from './maps.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('maps')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('maps')
export class MapsController {
  constructor(private maps: MapsService) {}

  @Get('geocode')
  @ApiOperation({ summary: 'Geocode an address — returns lat/lng results' })
  geocode(@Query('q') query: string) {
    return this.maps.geocode(query);
  }

  @Get('reverse-geocode')
  @ApiOperation({ summary: 'Reverse geocode — lat/lng to address' })
  reverseGeocode(@Query('lat') lat: string, @Query('lng') lng: string) {
    return this.maps.reverseGeocode(+lat, +lng);
  }

  @Get('route')
  @ApiOperation({ summary: 'Get route between two points' })
  getRoute(
    @Query('fromLat') fromLat: string,
    @Query('fromLng') fromLng: string,
    @Query('toLat') toLat: string,
    @Query('toLng') toLng: string,
  ) {
    return this.maps.getRoute(
      { lat: +fromLat, lng: +fromLng },
      { lat: +toLat, lng: +toLng },
    );
  }

  @Get('static-map')
  @ApiOperation({ summary: 'Get a static map image URL' })
  staticMap(
    @Query('lat') lat: string,
    @Query('lng') lng: string,
    @Query('zoom') zoom = '14',
  ) {
    return this.maps.getStaticMapUrl({ lat: +lat, lng: +lng }, +zoom);
  }
}
