import Geolocation, {
  GeoPosition,
  GeoError,
} from '@react-native-community/geolocation';
import BlockerService from './BlockerService';

interface Coordinate {
  latitude: number;
  longitude: number;
}

/**
 * GPSService
 *
 * Tracks real-time distance for DISTANCE-type goals.
 * Runs in the foreground while the user is active.
 * Calls BlockerService.updateProgress() as the user moves.
 */
class GPSService {
  private watchId: number | null = null;
  private lastCoordinate: Coordinate | null = null;
  private totalMetres: number = 0;
  private onProgressUpdate?: (metres: number) => void;
  private onGoalComplete?: () => void;

  /**
   * Start tracking.
   * @param onProgress - called every GPS tick with total metres covered
   * @param onComplete - called when the distance goal is met
   */
  start(
    onProgress: (metres: number) => void,
    onComplete: () => void,
  ) {
    this.totalMetres = 0;
    this.lastCoordinate = null;
    this.onProgressUpdate = onProgress;
    this.onGoalComplete = onComplete;

    Geolocation.setRNConfiguration({
      skipPermissionRequests: false,
      authorizationLevel: 'always',
    });

    this.watchId = Geolocation.watchPosition(
      (position: GeoPosition) => this.handlePosition(position),
      (error: GeoError) => console.warn('GPS error:', error),
      {
        enableHighAccuracy: true,
        distanceFilter: 5,       // only fire when moved 5+ metres (saves battery)
        interval: 3000,          // Android: poll every 3s
        fastestInterval: 1000,
      }
    );
  }

  stop() {
    if (this.watchId !== null) {
      Geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
    this.lastCoordinate = null;
    this.totalMetres = 0;
  }

  getTotalMetres(): number {
    return this.totalMetres;
  }

  private async handlePosition(position: GeoPosition) {
    const coords: Coordinate = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    };

    if (this.lastCoordinate) {
      const delta = haversineDistance(this.lastCoordinate, coords);
      // Sanity check: ignore GPS jumps > 100m in one tick (GPS glitch)
      if (delta < 100) {
        this.totalMetres += delta;
      }
    }

    this.lastCoordinate = coords;
    this.onProgressUpdate?.(this.totalMetres);

    // Push to the native blocker — this is what triggers unlock
    const result = await BlockerService.updateProgress(this.totalMetres);
    if (result === 'COMPLETED') {
      this.stop();
      this.onGoalComplete?.();
    }
  }
}

/**
 * Haversine formula — great-circle distance between two GPS coordinates
 * Returns distance in metres
 */
function haversineDistance(a: Coordinate, b: Coordinate): number {
  const R = 6371000; // Earth radius in metres
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);

  const sinDLat = Math.sin(dLat / 2);
  const sinDLon = Math.sin(dLon / 2);

  const a2 =
    sinDLat * sinDLat +
    Math.cos(toRad(a.latitude)) *
      Math.cos(toRad(b.latitude)) *
      sinDLon * sinDLon;

  return R * 2 * Math.atan2(Math.sqrt(a2), Math.sqrt(1 - a2));
}

export default new GPSService();
