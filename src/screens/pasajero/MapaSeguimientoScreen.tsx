import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, StatusBar, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MapView, { PROVIDER_GOOGLE, Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { supabase } from '../../lib/supabase';
import { Colors, Spacing, Radius, Shadow } from '../../theme/colors';

export default function MapaSeguimientoScreen({ route, navigation }: any) {
  const [buses, setBuses] = useState<any[]>([]);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [selectedBus, setSelectedBus] = useState<any | null>(null);
  const [routeDetails, setRouteDetails] = useState<any | null>(null);
  const mapRef = React.useRef<MapView | null>(null);
  const lastSelectedTripIdRef = React.useRef<string | null>(null);

  const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const getProgressWidth = () => {
    if (!selectedBus || !routeDetails) return '0%';
    const busCoords = selectedBus.current_location?.coordinates;
    if (!busCoords || busCoords.length < 2) return '0%';
    const busLong = busCoords[0];
    const busLat = busCoords[1];

    const orig = routeDetails.origen_coords;
    const dest = routeDetails.destino_coords;
    if (!orig || !dest || typeof orig.latitude !== 'number' || typeof dest.latitude !== 'number') {
      return '0%';
    }

    const totalDist = getDistance(orig.latitude, orig.longitude, dest.latitude, dest.longitude);
    if (totalDist <= 0) return '0%';

    const distToDest = getDistance(busLat, busLong, dest.latitude, dest.longitude);
    const progress = Math.min(100, Math.max(0, (1 - (distToDest / totalDist)) * 100));
    return `${progress.toFixed(0)}%`;
  };

  const getGpsStatusText = () => {
    if (!selectedBus) return 'SIN SEÑAL ACTIVA · GPS OFF';

    if (selectedBus.id && String(selectedBus.id).startsWith('fallback-')) {
      return 'SIN SEÑAL · ORIGEN DE RUTA';
    }

    const diffMs = Date.now() - new Date(selectedBus.recorded_at).getTime();
    const diffSec = Math.max(0, Math.round(diffMs / 1000));

    if (diffSec < 30) {
      return `GPS ACTIVO · ACT. HACE ${diffSec} SEG`;
    }
    const diffMin = Math.round(diffSec / 60);
    if (diffMin < 60) {
      return `ÚLTIMA SEÑAL HACE ${diffMin} MIN`;
    }
    const diffHrs = Math.round(diffMin / 60);
    if (diffHrs < 24) {
      return `ÚLTIMA SEÑAL HACE ${diffHrs} HORAS`;
    }
    return 'ÚLTIMA SEÑAL HACE MÁS DE 24H';
  };

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        let loc = await Location.getCurrentPositionAsync({});
        setLocation(loc);
      }
    })();
  }, []);

  const fetchBuses = async () => {
    try {
      // 1. Fetch active trips
      const { data: trips, error: tripsError } = await supabase
        .from('trips')
        .select('*')
        .eq('estado', 'En Ruta');

      if (tripsError) throw tripsError;
      if (!trips) return;

      // 2. Fetch latest telemetry locations
      const { data: locations, error: locError } = await supabase
        .from('trip_locations')
        .select('*');

      // 3. Fetch routes (for fallbacks and progress calculations)
      const { data: routes, error: routesError } = await supabase
        .from('routes')
        .select('*');

      // 4. Merge
      const mergedBuses = trips.map(trip => {
        const loc = locations?.find(l => l.trip_id === trip.id);
        const routeInfo = routes?.find(r => r.id === trip.ruta_id);

        let current_location = loc?.current_location;
        let speed_kmh = loc?.speed_kmh;
        let recorded_at = loc?.recorded_at;

        // Fallback to route origin if location is completely missing or null
        if (!current_location && routeInfo?.origen_coords) {
          current_location = {
            type: 'Point',
            coordinates: [routeInfo.origen_coords.longitude, routeInfo.origen_coords.latitude]
          };
          speed_kmh = 0;
          recorded_at = trip.created_at || new Date().toISOString();
        }

        return {
          id: loc?.id || `fallback-${trip.id}`,
          trip_id: trip.id,
          current_location,
          speed_kmh: speed_kmh !== null && speed_kmh !== undefined ? Number(speed_kmh) : 0,
          recorded_at: recorded_at || new Date().toISOString(),
          trips: {
            id: trip.id,
            unidad_placa: trip.unidad_placa,
            unidad_numero: trip.unidad_numero,
            ruta_nombre: trip.ruta_nombre,
            ruta_id: trip.ruta_id
          },
          route_details: routeInfo || null
        };
      }).filter(b => b.current_location !== null && b.current_location !== undefined);

      setBuses(mergedBuses);

      // Auto-select based on route params if available, otherwise keep current or select first
      const targetTripId = route.params?.tripId;
      if (mergedBuses.length > 0) {
        if (targetTripId) {
          const targetBus = mergedBuses.find((b) => b.trip_id === targetTripId);
          if (targetBus) {
            setSelectedBus(targetBus);
          } else {
            setSelectedBus(mergedBuses[0]);
          }
        } else {
          setSelectedBus((prev: any) => {
            const stillActive = mergedBuses.find((b) => b.trip_id === prev?.trip_id);
            return stillActive || mergedBuses[0];
          });
        }
      } else {
        setSelectedBus(null);
      }
    } catch (err) {
      console.log("Error fetching active buses & merging:", err);
    }
  };

  useEffect(() => {
    fetchBuses();

    // Subscribe to changes in trip_locations table in real-time
    const channel = supabase
      .channel(`trip-locations-realtime-${Date.now()}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'trip_locations'
      }, async () => {
        fetchBuses();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [route.params?.tripId]);

  // Center map on selection changes
  useEffect(() => {
    if (selectedBus) {
      const tripId = selectedBus.trip_id;
      if (tripId !== lastSelectedTripIdRef.current) {
        lastSelectedTripIdRef.current = tripId;
        const coords = selectedBus.current_location?.coordinates;
        if (coords && coords.length >= 2) {
          const longitude = coords[0];
          const latitude = coords[1];
          mapRef.current?.animateToRegion({
            latitude,
            longitude,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }, 1000);
        }
      }
    } else {
      lastSelectedTripIdRef.current = null;
    }
  }, [selectedBus]);

  // Fetch route details whenever the selected bus changes
  useEffect(() => {
    if (selectedBus?.route_details) {
      setRouteDetails(selectedBus.route_details);
    } else if (selectedBus?.trips?.ruta_id) {
      const fetchRoute = async () => {
        const { data, error } = await supabase
          .from('routes')
          .select('*')
          .eq('id', selectedBus.trips.ruta_id)
          .single();
        if (!error && data) {
          setRouteDetails(data);
        }
      };
      fetchRoute();
    } else {
      setRouteDetails(null);
    }
  }, [selectedBus]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>RASTREO DE BUSES</Text>
        <TouchableOpacity>
          <Ionicons name="person-circle-outline" size={28} color={Colors.white} />
        </TouchableOpacity>
      </View>

      {/* Map */}
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          provider={PROVIDER_GOOGLE}
          style={StyleSheet.absoluteFillObject}
          showsUserLocation
          initialRegion={{
            latitude: location ? location.coords.latitude : -1.9,
            longitude: location ? location.coords.longitude : -79.1,
            latitudeDelta: 1.5,
            longitudeDelta: 1.5,
          }}
        >
          {buses.map((bus, i) => {
            const coords = bus.current_location?.coordinates;
            if (!coords || coords.length < 2) return null;

            const longitude = coords[0];
            const latitude = coords[1];
            const isSelected = selectedBus?.trip_id === bus.trip_id;

            return (
              <Marker
                key={bus.trip_id || i}
                coordinate={{ latitude, longitude }}
                title={`Unidad ${bus.trips?.unidad_numero || 'S/N'}`}
                description={`Placa: ${bus.trips?.unidad_placa || '--'} · Velocidad: ${bus.speed_kmh} km/h`}
                onPress={() => setSelectedBus(bus)}
              >
                <View style={[
                  styles.busMarkerLive,
                  isSelected && { backgroundColor: Colors.accent, borderColor: Colors.white }
                ]}>
                  <Ionicons name="bus" size={20} color={Colors.white} />
                </View>
              </Marker>
            );
          })}
        </MapView>
        <View style={styles.zoomControls}>
          <TouchableOpacity style={styles.zoomBtn} onPress={() => mapRef.current?.animateToRegion({
            latitude: selectedBus?.current_location?.coordinates[1] || -1.9,
            longitude: selectedBus?.current_location?.coordinates[0] || -79.1,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          })}>
            <Ionicons name="locate" size={22} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Telemetry card */}
        <View style={styles.telCard}>
          <View style={styles.telHeader}>
            <Text style={styles.telTitle}>
              {selectedBus ? `TELEMETRÍA UNIDAD ${selectedBus.trips?.unidad_numero || 'S/N'}` : 'BUSCANDO UNIDAD'}
            </Text>
            <View style={[styles.telDot, { backgroundColor: selectedBus ? Colors.success : Colors.textMuted }]} />
          </View>
          <View style={styles.telRow}>
            <Text style={styles.telLabel}>Velocidad</Text>
            <Text style={styles.telVal}>
              {selectedBus ? selectedBus.speed_kmh : '--'} <Text style={styles.telUnit}>km/h</Text>
            </Text>
          </View>
          <View style={styles.telRow}>
            <Text style={styles.telLabel}>Placa</Text>
            <Text style={[styles.telVal, { fontSize: 13, fontWeight: '800' }]}>
              {selectedBus ? (selectedBus.trips?.unidad_placa || '--') : '--'}
            </Text>
          </View>
        </View>
        {/* GPS badge */}
        <View style={styles.gpsBadge}>
          <Ionicons name="radio-outline" size={14} color={Colors.white} />
          <Text style={styles.gpsText}>
            {getGpsStatusText()}
          </Text>
        </View>
      </View>

      {/* Bottom Sheet */}
      <View style={styles.bottomSheet}>
        <View style={styles.routeRow}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <Text style={styles.routeLabel}>RUTA EN CURSO</Text>
            <Text style={styles.routeName} numberOfLines={1} adjustsFontSizeToFit>
              {selectedBus ? (selectedBus.trips?.ruta_nombre || '--') : 'SIN UNIDADES EN RUTA'}
            </Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.etaLabel}>ETA ESTIMADO</Text>
            <Text style={styles.etaVal}>
              {routeDetails?.tiempo_min ? `Llegada ~ ${routeDetails.tiempo_min} min` : '--'}
            </Text>
          </View>
        </View>
        {/* Progress bar */}
        <View style={styles.progressBg}>
          <View style={[styles.progressFill, { width: getProgressWidth() as any }]} />
        </View>
        <View style={styles.terminalRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.terminalLabel}>ORIGEN</Text>
            <Text style={styles.terminalName} numberOfLines={1} adjustsFontSizeToFit>
              {routeDetails?.origen || '--'}
            </Text>
          </View>
          <View style={{ flex: 1, alignItems: 'flex-end' }}>
            <Text style={styles.terminalLabel}>DESTINO</Text>
            <Text style={styles.terminalName} numberOfLines={1} adjustsFontSizeToFit>
              {routeDetails?.destino || '--'}
            </Text>
          </View>
        </View>
        {/* Actions */}
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.assistBtn}>
            <Ionicons name="help-circle-outline" size={18} color={Colors.white} />
            <Text style={styles.assistText}>Solicitar Asistencia</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.primary },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.primary, paddingHorizontal: Spacing.lg,
    paddingTop: 52, paddingBottom: Spacing.md,
  },
  headerTitle: { color: Colors.white, fontSize: 18, fontWeight: '900', letterSpacing: 1 },
  // Map
  mapContainer: { flex: 1, position: 'relative', overflow: 'hidden', backgroundColor: Colors.background },
  busMarkerLive: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: Colors.white,
    ...Shadow.sm,
  },
  zoomControls: { position: 'absolute', right: Spacing.md, bottom: Spacing.xl },
  zoomBtn: {
    width: 44, height: 44, borderRadius: Radius.md, backgroundColor: Colors.white,
    alignItems: 'center', justifyContent: 'center', marginBottom: 4, ...Shadow.sm,
  },
  telCard: {
    position: 'absolute', top: Spacing.md, left: Spacing.md,
    backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: Radius.lg,
    padding: Spacing.md, width: 180, ...Shadow.md,
  },
  telHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  telTitle: { fontSize: 9, fontWeight: '700', color: Colors.textSecondary, letterSpacing: 0.5 },
  telDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.success },
  telRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 },
  telLabel: { fontSize: 13, color: Colors.textSecondary },
  telVal: { fontSize: 22, fontWeight: '800', color: Colors.textPrimary },
  telUnit: { fontSize: 12, fontWeight: '400' },
  gpsBadge: {
    position: 'absolute', bottom: Spacing.md, left: Spacing.md,
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.primary, borderRadius: Radius.md,
    paddingHorizontal: 12, paddingVertical: 8,
  },
  gpsText: { fontSize: 10, color: Colors.white, fontWeight: '600', letterSpacing: 0.5 },

  // Bottom sheet
  bottomSheet: {
    backgroundColor: Colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: Spacing.lg, ...Shadow.lg,
  },
  routeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.sm },
  routeLabel: { fontSize: 11, color: Colors.textMuted, fontWeight: '600', letterSpacing: 0.5, marginBottom: 4 },
  routeName: { fontSize: 26, fontWeight: '800', color: Colors.primary },
  etaLabel: { fontSize: 11, color: Colors.textMuted, fontWeight: '600', letterSpacing: 0.5, marginBottom: 4, textAlign: 'right' },
  etaVal: { fontSize: 22, fontWeight: '800', color: Colors.primary, textAlign: 'right' },
  progressBg: { height: 4, backgroundColor: Colors.border, borderRadius: 2, marginBottom: Spacing.md },
  progressFill: { height: '100%', backgroundColor: Colors.primary, borderRadius: 2 },
  terminalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.md },
  terminalLabel: { fontSize: 10, color: Colors.textMuted, fontWeight: '600', letterSpacing: 1, marginBottom: 3 },
  terminalName: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  actionRow: { flexDirection: 'row', gap: Spacing.sm },
  assistBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.primary, borderRadius: Radius.md, padding: 16,
  },
  assistText: { color: Colors.white, fontSize: 15, fontWeight: '700' },
});
