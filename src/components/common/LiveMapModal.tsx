import React, { useState, useEffect } from 'react';
import {
  X,
  MapPin,
  Navigation,
  ExternalLink,
  Compass,
  RefreshCw,
  Clock,
  ChevronRight,
  Sparkles,
  LocateFixed,
  Car,
  CheckCircle2,
  AlertCircle,
  Layers,
} from 'lucide-react';
import { Client, Pool } from '../../types';
import {
  GeoLocationData,
  getCurrentGeoLocation,
  calculateDistanceKm,
  geocodeAddress,
  formatClientFullAddress,
} from '../../utils/photoUtils';
import { useToast } from '../../context/ToastContext';

interface LiveMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetClient?: Client | null;
  targetPool?: Pool | null;
  allTodayClients?: Client[];
  onStartServiceWithPhoto?: (client: Client) => void;
}

export const LiveMapModal: React.FC<LiveMapModalProps> = ({
  isOpen,
  onClose,
  targetClient,
  targetPool,
  allTodayClients = [],
  onStartServiceWithPhoto,
}) => {
  const { success, info } = useToast();

  const [deviceLocation, setDeviceLocation] = useState<GeoLocationData | null>(null);
  const [selectedRouteClient, setSelectedRouteClient] = useState<Client | null>(targetClient || null);
  const [clientCoords, setClientCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [isGeocodingClient, setIsGeocodingClient] = useState(false);
  const [mapProvider, setMapProvider] = useState<'google' | 'osm'>('google');

  // Update selected client when targetClient or list changes
  useEffect(() => {
    if (targetClient) {
      setSelectedRouteClient(targetClient);
    } else if (allTodayClients.length > 0 && !selectedRouteClient) {
      setSelectedRouteClient(allTodayClients[0]);
    }
  }, [targetClient, allTodayClients]);

  // Fetch real device GPS position
  const fetchDeviceGps = async (showToast = false) => {
    setIsLoadingLocation(true);
    try {
      const loc = await getCurrentGeoLocation();
      if (loc && loc.isDeviceGps) {
        setDeviceLocation(loc);
        if (showToast) success('GPS do dispositivo conectado com sucesso!');
      } else {
        setDeviceLocation(null);
        if (showToast) info('GPS do dispositivo aguardando permissão no navegador.');
      }
    } catch {
      setDeviceLocation(null);
    } finally {
      setIsLoadingLocation(false);
    }
  };

  // On open, try to query device GPS
  useEffect(() => {
    if (isOpen) {
      fetchDeviceGps(false);
    }
  }, [isOpen]);

  // Geocode active selected client
  useEffect(() => {
    if (!selectedRouteClient) {
      setClientCoords(null);
      return;
    }

    const fullAddr = formatClientFullAddress(selectedRouteClient);
    if (!fullAddr) {
      setClientCoords(null);
      return;
    }

    setIsGeocodingClient(true);
    geocodeAddress(fullAddr)
      .then(coords => {
        if (coords) {
          setClientCoords({ latitude: coords.latitude, longitude: coords.longitude });
        } else {
          setClientCoords(null);
        }
      })
      .finally(() => setIsGeocodingClient(false));
  }, [selectedRouteClient]);

  if (!isOpen) return null;

  const clientAddress = formatClientFullAddress(selectedRouteClient) || 'Endereço não cadastrado';

  // Calculate real distance if both device GPS and client coordinates exist
  const hasRealDistance = deviceLocation && clientCoords;
  const distanceKm = hasRealDistance
    ? calculateDistanceKm(
        deviceLocation.latitude,
        deviceLocation.longitude,
        clientCoords.latitude,
        clientCoords.longitude
      )
    : null;

  const etaMinutes = distanceKm ? Math.max(3, Math.round((distanceKm / 35) * 60)) : null;

  // Build accurate map embed URL using exact address query
  const googleEmbedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(
    clientAddress && clientAddress !== 'Endereço não cadastrado' ? clientAddress : 'São Paulo - SP'
  )}&t=&z=16&ie=UTF8&iwloc=&output=embed`;

  const osmEmbedUrl = clientCoords
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${clientCoords.longitude - 0.01}%2C${
        clientCoords.latitude - 0.01
      }%2C${clientCoords.longitude + 0.01}%2C${clientCoords.latitude + 0.01}&layer=mapnik&marker=${
        clientCoords.latitude
      }%2C${clientCoords.longitude}`
    : googleEmbedUrl;

  // External Navigation App URLs using real address or coordinates
  const destinationQuery = encodeURIComponent(
    clientAddress && clientAddress !== 'Endereço não cadastrado'
      ? clientAddress
      : clientCoords
      ? `${clientCoords.latitude},${clientCoords.longitude}`
      : 'São Paulo - SP'
  );

  const googleMapsRouteUrl = deviceLocation
    ? `https://www.google.com/maps/dir/?api=1&origin=${deviceLocation.latitude},${deviceLocation.longitude}&destination=${destinationQuery}&travelmode=driving`
    : `https://www.google.com/maps/dir/?api=1&destination=${destinationQuery}&travelmode=driving`;

  const wazeRouteUrl = clientCoords
    ? `https://waze.com/ul?ll=${clientCoords.latitude},${clientCoords.longitude}&navigate=yes`
    : `https://waze.com/ul?q=${destinationQuery}&navigate=yes`;

  const appleMapsUrl = `https://maps.apple.com/?daddr=${destinationQuery}&dirflg=d`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-sky-500/40 rounded-3xl w-full max-w-5xl h-[92vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Modal Top Header */}
        <div className="px-5 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-sky-500/20 text-sky-400 border border-sky-500/30">
              <Navigation className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                <span>Roteirizador & Mapa de Atendimento</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-sky-500/20 text-sky-400 border border-sky-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-400"></span>
                  GPS PRECISO
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Endereço exato do cliente com navegação direta para Google Maps e Waze
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => fetchDeviceGps(true)}
              disabled={isLoadingLocation}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-400 border border-slate-700 transition cursor-pointer flex items-center gap-1.5 text-xs font-bold"
              title="Sincronizar GPS do Aparelho"
            >
              <RefreshCw className={`w-4 h-4 ${isLoadingLocation ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Atualizar GPS</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Main Body */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* Left: Interactive Map Viewport */}
          <div className="flex-1 relative bg-slate-950 flex flex-col">
            {/* Top HUD Overlay */}
            <div className="absolute top-3 left-3 right-3 z-10 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
              {/* Destination Address Pill */}
              <div className="pointer-events-auto bg-slate-900/95 backdrop-blur-md border border-sky-500/40 rounded-2xl p-2.5 shadow-lg flex items-center gap-2.5 text-xs text-white max-w-md">
                <div className="w-3 h-3 rounded-full bg-emerald-500 ring-4 ring-emerald-500/30 shrink-0"></div>
                <div className="min-w-0">
                  <div className="font-bold flex items-center gap-1.5 text-emerald-400 text-[11px] uppercase tracking-wider">
                    <MapPin className="w-3 h-3" />
                    <span>Destino: {selectedRouteClient?.name || 'Cliente'}</span>
                  </div>
                  <div className="text-slate-300 text-[11px] truncate font-medium">
                    {clientAddress}
                  </div>
                </div>
              </div>

              {/* Distance / ETA if GPS active */}
              {distanceKm !== null ? (
                <div className="pointer-events-auto bg-slate-900/95 backdrop-blur-md border border-sky-500/40 rounded-2xl px-3 py-2 shadow-lg flex items-center gap-3 text-xs text-white">
                  <div className="flex items-center gap-1.5">
                    <Car className="w-4 h-4 text-sky-400" />
                    <span className="font-bold text-sky-300">{distanceKm} km</span>
                  </div>
                  <span className="text-slate-600">|</span>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-emerald-400" />
                    <span className="font-bold text-emerald-400">~{etaMinutes} min</span>
                  </div>
                </div>
              ) : (
                <div className="pointer-events-auto bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-2xl px-3 py-1.5 text-[11px] text-slate-400 flex items-center gap-1.5">
                  <LocateFixed className="w-3.5 h-3.5 text-sky-400" />
                  <span>
                    {deviceLocation ? 'GPS do Aparelho Ativo' : 'Endereço Oficial Cadastrado'}
                  </span>
                </div>
              )}
            </div>

            {/* Embedded Map iframe */}
            <div className="flex-1 w-full h-full min-h-[320px] relative bg-slate-900 overflow-hidden">
              <iframe
                title="Mapa do Endereço do Cliente"
                src={mapProvider === 'google' ? googleEmbedUrl : osmEmbedUrl}
                className="w-full h-full border-0"
                loading="lazy"
              />

              {/* Map Provider Switcher & Direct Navigation Bar */}
              <div className="absolute bottom-3 left-3 right-3 z-10 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
                <div className="pointer-events-auto flex items-center gap-2 flex-wrap">
                  <a
                    href={googleMapsRouteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-lg flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Navegar no Google Maps</span>
                  </a>

                  <a
                    href={wazeRouteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-lg flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    <span>Abrir no Waze</span>
                  </a>

                  <a
                    href={appleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hidden sm:flex px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs shadow-lg items-center gap-1.5 transition active:scale-95 cursor-pointer border border-slate-700"
                  >
                    <Compass className="w-3.5 h-3.5 text-slate-400" />
                    <span>Apple Maps</span>
                  </a>
                </div>

                <div className="pointer-events-auto flex items-center gap-1.5 bg-slate-950/90 px-2.5 py-1.5 rounded-xl border border-slate-800 text-[11px] text-slate-300">
                  <span className="text-slate-400">Visualização:</span>
                  <button
                    type="button"
                    onClick={() => setMapProvider('google')}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold transition cursor-pointer ${
                      mapProvider === 'google'
                        ? 'bg-sky-500 text-white'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    Google
                  </button>
                  <button
                    type="button"
                    onClick={() => setMapProvider('osm')}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold transition cursor-pointer ${
                      mapProvider === 'osm'
                        ? 'bg-sky-500 text-white'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    OpenStreetMap
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Selected Client Details & Day Schedule Stops */}
          <div className="w-full lg:w-96 bg-slate-900 border-t lg:border-t-0 lg:border-l border-slate-800 flex flex-col overflow-y-auto p-4 space-y-4">
            {/* Selected Client Card */}
            {selectedRouteClient ? (
              <div className="bg-slate-950 border border-sky-500/30 rounded-2xl p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-black text-sky-400 uppercase tracking-wider block">
                      Destino do Atendimento
                    </span>
                    <h4 className="font-extrabold text-base text-white mt-0.5">
                      {selectedRouteClient.name}
                    </h4>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/10 text-sky-400 border border-sky-500/20">
                    {selectedRouteClient.service_frequency || 'Semanal'}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5">
                  <div className="flex items-start gap-2 text-xs text-slate-200">
                    <MapPin className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold">
                        {selectedRouteClient.street
                          ? `${selectedRouteClient.street}, ${selectedRouteClient.number || 'S/N'}`
                          : 'Rua não informada'}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {[
                          selectedRouteClient.neighborhood,
                          selectedRouteClient.city
                            ? `${selectedRouteClient.city} - ${selectedRouteClient.state || 'SP'}`
                            : '',
                          selectedRouteClient.zip_code ? `CEP ${selectedRouteClient.zip_code}` : '',
                        ]
                          .filter(Boolean)
                          .join(', ')}
                      </div>
                    </div>
                  </div>

                  {clientCoords && (
                    <div className="text-[10px] font-mono text-emerald-400 pt-1 border-t border-slate-800 flex items-center justify-between">
                      <span>Coordenadas GPS:</span>
                      <span>
                        {clientCoords.latitude.toFixed(5)}, {clientCoords.longitude.toFixed(5)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Pool summary */}
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-400">Piscina:</span>
                  <span className="font-bold text-slate-200">
                    {targetPool?.name || 'Piscina Principal'} ({targetPool?.type || 'Fibra'})
                  </span>
                </div>

                {/* Action button: Start with Photo & Check-in */}
                {onStartServiceWithPhoto && (
                  <button
                    type="button"
                    onClick={() => {
                      onStartServiceWithPhoto(selectedRouteClient);
                      onClose();
                    }}
                    className="w-full py-3 px-4 bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-600 hover:to-cyan-600 text-white rounded-xl text-xs sm:text-sm font-black shadow-lg shadow-sky-500/25 active:scale-95 transition cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Fazer Check-in & Tirar Foto</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="p-4 bg-slate-950 rounded-2xl text-center text-xs text-slate-400">
                Selecione um cliente para traçar o roteiro no mapa.
              </div>
            )}

            {/* List of Clients / Route Stops */}
            <div className="space-y-2 flex-1">
              <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                <span>Roteiro de Clientes ({allTodayClients.length})</span>
                <span className="text-[10px] text-sky-400 font-medium">Selecione para mapear</span>
              </h5>

              <div className="space-y-2 max-h-64 lg:max-h-none overflow-y-auto pr-1">
                {allTodayClients.map((client, idx) => {
                  const isSelected = selectedRouteClient?.id === client.id;
                  return (
                    <button
                      key={client.id}
                      type="button"
                      onClick={() => setSelectedRouteClient(client)}
                      className={`w-full p-3 rounded-xl border text-left transition flex items-center justify-between gap-3 cursor-pointer ${
                        isSelected
                          ? 'bg-sky-500/20 border-sky-500 text-white shadow-md'
                          : 'bg-slate-950/60 border-slate-800 hover:bg-slate-800/80 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black shrink-0 ${
                            isSelected ? 'bg-sky-500 text-white' : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {idx + 1}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-xs truncate">{client.name}</div>
                          <div className="text-[10px] text-slate-400 truncate">
                            {client.street
                              ? `${client.street}, ${client.number || 'S/N'}`
                              : client.city || 'Sem endereço'}
                          </div>
                        </div>
                      </div>

                      <ChevronRight
                        className={`w-4 h-4 shrink-0 ${isSelected ? 'text-sky-400' : 'text-slate-600'}`}
                      />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
