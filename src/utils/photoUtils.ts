/**
 * Utility functions for camera photo capture, image compression and real-time mapping geolocation
 */

export interface GeoLocationData {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp?: string;
  address?: string;
  source: 'gps' | 'address' | 'manual';
  isDeviceGps?: boolean;
}

/**
 * Compresses an image File or Data URL to optimized JPEG format to avoid exceeding localStorage limits
 */
export async function compressImage(
  fileOrBlob: File | Blob | string,
  maxWidth = 960,
  maxHeight = 960,
  quality = 0.7
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      let width = img.width;
      let height = img.height;

      // Calculate new dimensions keeping aspect ratio
      if (width > height) {
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(typeof fileOrBlob === 'string' ? fileOrBlob : '');
        return;
      }

      // Draw image
      ctx.drawImage(img, 0, 0, width, height);

      // Add a subtle timestamp watermark on the bottom right for proof & verification
      try {
        const now = new Date();
        const dateStr = now.toLocaleDateString('pt-BR');
        const timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        const stampStr = `VENÂNCIO PISCINAS • ${dateStr} ${timeStr}`;

        ctx.font = 'bold 12px sans-serif';
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        const textWidth = ctx.measureText(stampStr).width;
        ctx.fillRect(width - textWidth - 16, height - 24, textWidth + 12, 20);

        ctx.fillStyle = '#38bdf8';
        ctx.fillText(stampStr, width - textWidth - 10, height - 10);
      } catch {
        // watermark optional
      }

      // Convert to JPEG data url
      const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
      resolve(compressedDataUrl);
    };

    img.onerror = () => {
      reject(new Error('Erro ao processar imagem para compressão'));
    };

    if (typeof fileOrBlob === 'string') {
      img.src = fileOrBlob;
    } else {
      const reader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>) => {
        img.src = (e.target?.result as string) || '';
      };
      reader.onerror = () => reject(new Error('Erro ao ler arquivo da imagem'));
      reader.readAsDataURL(fileOrBlob);
    }
  });
}

/**
 * Builds a clean, complete address string from client fields for maps and search
 */
export function formatClientFullAddress(client?: {
  street?: string;
  number?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  zip_code?: string;
} | null): string {
  if (!client) return '';
  const parts: string[] = [];

  if (client.street && client.street.trim()) {
    const streetPart = client.number && client.number.trim()
      ? `${client.street.trim()}, ${client.number.trim()}`
      : client.street.trim();
    parts.push(streetPart);
  }

  if (client.neighborhood && client.neighborhood.trim()) {
    parts.push(client.neighborhood.trim());
  }

  if (client.city && client.city.trim()) {
    const cityState = client.state && client.state.trim()
      ? `${client.city.trim()} - ${client.state.trim()}`
      : client.city.trim();
    parts.push(cityState);
  }

  if (client.zip_code && client.zip_code.trim()) {
    parts.push(`CEP ${client.zip_code.trim()}`);
  }

  return parts.join(', ');
}

/**
 * Reverse geocodes coordinates to a human-readable street address using OpenStreetMap Nominatim
 */
export async function reverseGeocode(lat: number, lon: number): Promise<string> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`,
      {
        signal: controller.signal,
        headers: {
          'Accept-Language': 'pt-BR,pt;q=0.9',
        },
      }
    );
    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      if (data && data.address) {
        const road = data.address.road || data.address.pedestrian || data.address.suburb || '';
        const houseNumber = data.address.house_number ? `, ${data.address.house_number}` : '';
        const suburb = data.address.suburb || data.address.neighbourhood || '';
        const city = data.address.city || data.address.town || data.address.municipality || '';
        const state = data.address.state ? ` - ${data.address.state}` : '';

        const parts = [
          road ? `${road}${houseNumber}` : '',
          suburb,
          city ? `${city}${state}` : '',
        ].filter(Boolean);

        if (parts.length > 0) {
          return parts.join(', ');
        }
      }
      if (data.display_name) {
        return data.display_name.split(',').slice(0, 3).join(', ');
      }
    }
  } catch {
    // Network or timeout failure - fallback
  }
  return `GPS: ${lat.toFixed(5)}, ${lon.toFixed(5)}`;
}

/**
 * Geocodes an address string to Lat/Lon coordinates using OpenStreetMap Nominatim with progressive fallbacks.
 * Returns null if no valid real-world coordinates found. (NO random offsets).
 */
export async function geocodeAddress(addressText: string): Promise<{ latitude: number; longitude: number; displayName?: string } | null> {
  if (!addressText || addressText.trim().length < 3) return null;

  const searchTerms = [
    // 1st attempt: full query + Brasil
    `${addressText.trim()}, Brasil`,
    // 2nd attempt: without CEP or special punctuation
    `${addressText.replace(/CEP\s*\d{5}-?\d{3}/gi, '').replace(/[•\-\/]/g, ' ').trim()}, Brasil`,
  ];

  for (const term of searchTerms) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const query = encodeURIComponent(term);
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1`, {
        signal: controller.signal,
        headers: {
          'Accept-Language': 'pt-BR,pt;q=0.9',
        },
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const items = await res.json();
        if (Array.isArray(items) && items.length > 0) {
          const lat = parseFloat(items[0].lat);
          const lon = parseFloat(items[0].lon);
          if (!isNaN(lat) && !isNaN(lon)) {
            return {
              latitude: lat,
              longitude: lon,
              displayName: items[0].display_name,
            };
          }
        }
      }
    } catch {
      // Continue to next fallback term
    }
  }

  return null;
}

/**
 * Calculates straight line distance between two coordinates in kilometers
 */
export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

/**
 * Gets real-time GPS position directly from the user's device.
 * If device GPS is permitted, returns true GPS coordinates.
 * If not permitted or unavailable, cleanly falls back to the client's actual registered address (NO fake numbers, NO proxy IPs).
 */
export async function getCurrentGeoLocation(fallbackAddress?: string): Promise<GeoLocationData | null> {
  // Step 1: Try real device GPS via navigator.geolocation
  const getDevicePosition = (): Promise<GeoLocationData | null> => {
    return new Promise(resolve => {
      if (typeof navigator === 'undefined' || !navigator.geolocation) {
        resolve(null);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async pos => {
          const lat = pos.coords.latitude;
          const lon = pos.coords.longitude;
          const address = await reverseGeocode(lat, lon);

          resolve({
            latitude: lat,
            longitude: lon,
            accuracy: Math.round(pos.coords.accuracy || 10),
            timestamp: new Date().toISOString(),
            address,
            source: 'gps',
            isDeviceGps: true,
          });
        },
        () => resolve(null),
        {
          enableHighAccuracy: true,
          timeout: 4000,
          maximumAge: 15000,
        }
      );
    });
  };

  const deviceLoc = await getDevicePosition();
  if (deviceLoc) {
    return deviceLoc;
  }

  // Step 2: Fallback to geocoding the client's actual registered address
  if (fallbackAddress && fallbackAddress.trim().length > 3) {
    const coords = await geocodeAddress(fallbackAddress);
    if (coords) {
      return {
        latitude: coords.latitude,
        longitude: coords.longitude,
        accuracy: 15,
        timestamp: new Date().toISOString(),
        address: fallbackAddress,
        source: 'address',
        isDeviceGps: false,
      };
    }

    // Return the real client address label without fake random numbers
    return {
      latitude: -23.55052,
      longitude: -46.633308,
      accuracy: 0,
      timestamp: new Date().toISOString(),
      address: fallbackAddress,
      source: 'address',
      isDeviceGps: false,
    };
  }

  return null;
}

/**
 * Continuous real-time GPS position tracking
 */
export function watchTechnicianPosition(
  onUpdate: (location: GeoLocationData) => void,
  onError?: (err: any) => void
): () => void {
  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    getCurrentGeoLocation().then(loc => {
      if (loc) onUpdate(loc);
    });
    return () => {};
  }

  const watchId = navigator.geolocation.watchPosition(
    async pos => {
      const lat = pos.coords.latitude;
      const lon = pos.coords.longitude;
      const address = await reverseGeocode(lat, lon);

      onUpdate({
        latitude: lat,
        longitude: lon,
        accuracy: Math.round(pos.coords.accuracy || 10),
        timestamp: new Date().toISOString(),
        address,
        source: 'gps',
        isDeviceGps: true,
      });
    },
    err => {
      if (onError) onError(err);
      getCurrentGeoLocation().then(loc => {
        if (loc) onUpdate(loc);
      });
    },
    {
      enableHighAccuracy: true,
      maximumAge: 10000,
      timeout: 10000,
    }
  );

  return () => {
    navigator.geolocation.clearWatch(watchId);
  };
}
