import axios from 'axios';

const AUDIUS_APP_NAME = process.env.AUDIUS_APP_NAME || 'AuraSoundGateway';
const AUDIUS_DISCOVERY_NODES = [
  'https://discoveryprovider.audius.co',
  'https://audius-dp.amsterdam.creatorseed.com',
  'https://dn2.audius.l2.im',
  'https://discoveryprovider2.audius.co'
];

export interface StandardTrackResponse {
  id?: string;
  source: 'audius' | 'youtube';
  externalId: string;
  title: string;
  artist: string;
  coverUrl: string;
  streamUrl: string;
  durationSeconds: number;
  genre: string;
}

export class AudiusService {
  private activeHost: string = AUDIUS_DISCOVERY_NODES[0];

  constructor() {
    this.findWorkingHost();
  }

  private async findWorkingHost(): Promise<string> {
    for (const host of AUDIUS_DISCOVERY_NODES) {
      try {
        const res = await axios.get(`${host}/health_check`, { timeout: 2500 });
        if (res.status === 200 && res.data?.data) {
          this.activeHost = host;
          return host;
        }
      } catch {
        // Continue to next node
      }
    }
    return this.activeHost;
  }

  public async getTrendingTracks(limit = 20): Promise<StandardTrackResponse[]> {
    for (let attempts = 0; attempts < AUDIUS_DISCOVERY_NODES.length; attempts++) {
      try {
        const url = `${this.activeHost}/v1/tracks/trending?app_name=${AUDIUS_APP_NAME}&limit=${limit}`;
        const response = await axios.get(url, { timeout: 6000 });

        if (response.data && Array.isArray(response.data.data)) {
          return response.data.data.map((item: any) => ({
            source: 'audius' as const,
            externalId: String(item.id),
            title: item.title || 'Untitled Track',
            artist: item.user?.name || 'Unknown Artist',
            coverUrl:
              item.artwork?.['480x480'] ||
              item.artwork?.['150x150'] ||
              'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80',
            streamUrl: `${this.activeHost}/v1/tracks/${item.id}/stream?app_name=${AUDIUS_APP_NAME}`,
            durationSeconds: Math.round(item.duration || 180),
            genre: item.genre || 'Electronic'
          }));
        }
      } catch (err) {
        // Rotate to another host on failure
        const nextIdx = (AUDIUS_DISCOVERY_NODES.indexOf(this.activeHost) + 1) % AUDIUS_DISCOVERY_NODES.length;
        this.activeHost = AUDIUS_DISCOVERY_NODES[nextIdx];
      }
    }
    return [];
  }

  public async searchTracks(query: string, limit = 20): Promise<StandardTrackResponse[]> {
    for (let attempts = 0; attempts < AUDIUS_DISCOVERY_NODES.length; attempts++) {
      try {
        const url = `${this.activeHost}/v1/tracks/search?query=${encodeURIComponent(
          query
        )}&app_name=${AUDIUS_APP_NAME}&limit=${limit}`;
        const response = await axios.get(url, { timeout: 6000 });

        if (response.data && Array.isArray(response.data.data)) {
          return response.data.data.map((item: any) => ({
            source: 'audius' as const,
            externalId: String(item.id),
            title: item.title || 'Untitled Track',
            artist: item.user?.name || 'Unknown Artist',
            coverUrl:
              item.artwork?.['480x480'] ||
              item.artwork?.['150x150'] ||
              'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80',
            streamUrl: `${this.activeHost}/v1/tracks/${item.id}/stream?app_name=${AUDIUS_APP_NAME}`,
            durationSeconds: Math.round(item.duration || 180),
            genre: item.genre || 'Electronic'
          }));
        }
      } catch {
        const nextIdx = (AUDIUS_DISCOVERY_NODES.indexOf(this.activeHost) + 1) % AUDIUS_DISCOVERY_NODES.length;
        this.activeHost = AUDIUS_DISCOVERY_NODES[nextIdx];
      }
    }
    return [];
  }
}

export const audiusService = new AudiusService();
