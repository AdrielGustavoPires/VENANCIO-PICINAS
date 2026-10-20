import { Pool, PoolType } from '../types';
import poolFibraImg from '../assets/images/pool_fibra_moderna_1790617142886.jpg';
import poolAlvenariaImg from '../assets/images/pool_alvenaria_hijau_1790617153280.jpg';
import poolAzulejoImg from '../assets/images/pool_azulejo_clube_1790617163621.jpg';
import poolVinilImg from '../assets/images/pool_vinil_gourmet_1790617173122.jpg';
import poolSpaImg from '../assets/images/pool_spa_cobertura_1790617182989.jpg';

export interface PoolPresetImage {
  id: string;
  type: PoolType;
  label: string;
  subtitle: string;
  defaultSize: string;
  defaultVolume: number;
  url: string;
}

export const POOL_PRESET_IMAGES: PoolPresetImage[] = [
  {
    id: 'preset-fibra',
    type: 'Fibra',
    label: 'Fibra de Vidro Moderna',
    subtitle: 'Deck de madeira e água azul-turquesa',
    defaultSize: '8m x 4m x 1.4m',
    defaultVolume: 35000,
    url: poolFibraImg,
  },
  {
    id: 'preset-alvenaria',
    type: 'Alvenaria',
    label: 'Alvenaria / Pedra Hijau',
    subtitle: 'Borda infinita e acabamento em pedra natural',
    defaultSize: '10m x 4.5m x 1.5m',
    defaultVolume: 60000,
    url: poolAlvenariaImg,
  },
  {
    id: 'preset-azulejo',
    type: 'Azulejo',
    label: 'Azulejo / Pastilha Clube',
    subtitle: 'Revestimento cerâmico clássico cristalino',
    defaultSize: '12m x 6m x 1.5m',
    defaultVolume: 95000,
    url: poolAzulejoImg,
  },
  {
    id: 'preset-vinil',
    type: 'Vinil',
    label: 'Vinil com Prainha & Gourmet',
    subtitle: 'Estampa mosaico com banco molhado e hidro',
    defaultSize: '7m x 3.5m x 1.3m',
    defaultVolume: 30000,
    url: poolVinilImg,
  },
  {
    id: 'preset-outro',
    type: 'Outro',
    label: 'Spa / Cobertura Aquecida',
    subtitle: 'Deck elevado com cascata e hidromassagem',
    defaultSize: '5m x 3m x 1.1m',
    defaultVolume: 16000,
    url: poolSpaImg,
  },
];

export function getDefaultPoolImageByType(type?: PoolType, name?: string): string {
  const lowerName = (name || '').toLowerCase();
  if (lowerName.includes('cobertura') || lowerName.includes('spa') || lowerName.includes('hidro')) {
    return poolSpaImg;
  }

  switch (type) {
    case 'Fibra':
      return poolFibraImg;
    case 'Alvenaria':
      return poolAlvenariaImg;
    case 'Azulejo':
      return poolAzulejoImg;
    case 'Vinil':
      return poolVinilImg;
    case 'Outro':
      return poolSpaImg;
    default:
      return poolFibraImg;
  }
}

export function getPoolImage(pool?: Partial<Pool> | null): string {
  if (!pool) return poolFibraImg;
  if (
    pool.photo_url &&
    pool.photo_url.trim() !== '' &&
    !pool.photo_url.includes('images.unsplash.com')
  ) {
    return pool.photo_url;
  }
  return getDefaultPoolImageByType(pool.type, pool.name);
}
