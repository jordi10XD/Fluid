import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  StatusBar, ActivityIndicator, SafeAreaView, Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, Shadow } from '../../theme/colors';
import { supabase } from '../../lib/supabase';

interface RouteDetails {
  id: string;
  origen: string;
  destino: string;
  tiempo_min: number;
  distancia_km: number;
}

interface TelemetryDetails {
  trip_id: string;
  speed_kmh: number;
  recorded_at: string;
}

interface TripItem {
  id: string;
  unidad_placa: string;
  unidad_numero: string;
  ruta_id: string;
  ruta_nombre: string;
  ruta_codigo: string;
  conductor_id?: string;
  conductor_nombre: string;
  conductor_photo?: string | null;
  hora_salida: string;
  estado: string;
  razon_cancelacion: string;
  fecha: string;
  route_details: RouteDetails | null;
  telemetry: TelemetryDetails | null;
}

export default function ResultadosHorariosScreen({ route, navigation }: any) {
  const { origen = '', destino = '', fecha = '' } = route.params || {};

  const [loading, setLoading] = useState(true);
  const [trips, setTrips] = useState<TripItem[]>([]);

  useEffect(() => {
    fetchResults();
  }, [origen, destino]);

  const fetchResults = async () => {
    setLoading(true);
    try {
      // 1. Fetch matching routes
      let routeQuery = supabase.from('routes').select('id, origen, destino, tiempo_min, distancia_km');
      if (origen.trim()) {
        routeQuery = routeQuery.ilike('origen', `%${origen.trim()}%`);
      }
      if (destino.trim()) {
        routeQuery = routeQuery.ilike('destino', `%${destino.trim()}%`);
      }

      const { data: routesData } = await routeQuery;
      const routes = (routesData || []) as RouteDetails[];
      const routeIds = routes.map(r => r.id);

      if (routeIds.length === 0 && (origen.trim() || destino.trim())) {
        setTrips([]);
        setLoading(false);
        return;
      }

      // 2. Fetch trips matching those route IDs
      let tripQuery = supabase.from('trips').select(`
        id,
        unidad_placa,
        unidad_numero,
        ruta_id,
        ruta_nombre,
        ruta_codigo,
        conductor_id,
        conductor_nombre,
        hora_salida,
        estado,
        razon_cancelacion,
        fecha
      `);

      if (routeIds.length > 0) {
        tripQuery = tripQuery.in('ruta_id', routeIds);
      }

      const { data: tripsData } = await tripQuery;
      const rawTrips = tripsData || [];

      // 3. Fetch telemetry for active trips
      const { data: telemetryData } = await supabase.from('trip_locations').select('trip_id, speed_kmh, recorded_at');
      const telemetryList = (telemetryData || []) as TelemetryDetails[];

      // 3.5 Fetch photos for all drivers on matching trips
      const conductorIds = Array.from(new Set(rawTrips.map(t => t.conductor_id).filter(id => !!id)));
      let photosData: { user_id: string; photo: string }[] = [];
      if (conductorIds.length > 0) {
        const { data: photos } = await supabase
          .from('user_photos')
          .select('user_id, photo')
          .in('user_id', conductorIds);
        photosData = photos || [];
      }

      // 4. Merge in memory
      const mergedTrips: TripItem[] = rawTrips.map(trip => {
        const matchingRoute = routes.find(r => r.id === trip.ruta_id) || null;
        const matchingTelemetry = telemetryList.find(t => t.trip_id === trip.id) || null;
        const matchingPhoto = photosData.find(p => p.user_id === trip.conductor_id)?.photo || null;
        return {
          ...trip,
          route_details: matchingRoute,
          telemetry: matchingTelemetry,
          conductor_photo: matchingPhoto
        };
      });

      // Sort by departure time
      mergedTrips.sort((a, b) => (a.hora_salida || '').localeCompare(b.hora_salida || ''));
      setTrips(mergedTrips);
    } catch (error) {
      console.error('Error fetching search results:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateArrival = (horaSalida: string, tiempoMin: number | null) => {
    if (!horaSalida || !tiempoMin) return '--:--';
    const [hStr, mStr] = horaSalida.split(':');
    const h = parseInt(hStr, 10);
    const m = parseInt(mStr, 10);
    if (isNaN(h) || isNaN(m)) return '--:--';

    const totalMinutes = h * 60 + m + tiempoMin;
    const finalH = Math.floor(totalMinutes / 60) % 24;
    const finalM = totalMinutes % 60;
    return `${String(finalH).padStart(2, '0')}:${String(finalM).padStart(2, '0')}`;
  };

  const formatDuration = (min: number | null) => {
    if (!min) return '--';
    const hrs = Math.floor(min / 60);
    const mins = min % 60;
    return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />
      
      {/* TopAppBar */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={Colors.white} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.headerSub}>PANEL DE PASAJERO</Text>
          <Text style={styles.headerTitle}>Horarios Disponibles</Text>
        </View>
        <View style={styles.syncBadge}>
          <View style={styles.pulseDot} />
          <Text style={styles.syncText}>RF-G04</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Search Summary Bento Card */}
        <View style={styles.bentoContainer}>
          <View style={styles.routeCard}>
            <View>
              <Text style={styles.bentoLabel}>ORIGEN</Text>
              <Text style={styles.bentoVal} numberOfLines={1}>{origen || 'Todos'}</Text>
            </View>
            <Ionicons name="arrow-forward-outline" size={20} color={Colors.textMuted} />
            <View>
              <Text style={styles.bentoLabel}>DESTINO</Text>
              <Text style={styles.bentoVal} numberOfLines={1}>{destino || 'Todos'}</Text>
            </View>
          </View>
          <View style={styles.dateCard}>
            <Text style={styles.bentoLabelDate}>FECHA DE VIAJE</Text>
            <View style={styles.dateRow}>
              <Text style={styles.dateVal}>{fecha || 'Hoy'}</Text>
              <Ionicons name="calendar" size={16} color={Colors.white} />
            </View>
          </View>
        </View>

        {/* Results list */}
        {loading ? (
          <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 40 }} />
        ) : trips.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="bus-outline" size={48} color={Colors.textMuted} />
            <Text style={styles.emptyText}>No se encontraron horarios para la ruta seleccionada</Text>
          </View>
        ) : (
          <View style={styles.listContainer}>
            {trips.map((trip) => {
              const isEnRuta = trip.estado === 'En Ruta';
              const isCancelado = trip.estado === 'Cancelado';
              const isRetrasado = trip.estado === 'Retrasado';
              
              const salida = trip.hora_salida || '--:--';
              const llegada = calculateArrival(salida, trip.route_details?.tiempo_min || null);
              const duracion = formatDuration(trip.route_details?.tiempo_min || null);

              // Status styling options
              let statusText = 'PROGRAMADO';
              let statusColor = Colors.textSecondary;
              let statusBg = Colors.borderLight;
              
              if (isEnRuta) {
                statusText = 'EN TIEMPO';
                statusColor = Colors.success;
                statusBg = '#DCFCE7';
              } else if (isCancelado) {
                statusText = 'CANCELADO';
                statusColor = Colors.danger;
                statusBg = '#FEE2E2';
              } else if (isRetrasado) {
                statusText = 'RETRASADO';
                statusColor = Colors.warning;
                statusBg = '#FEF3C7';
              }

              return (
                <View 
                  key={trip.id} 
                  style={[
                    styles.tripCard,
                    isEnRuta && styles.glowPositive,
                    isRetrasado && styles.glowWarning,
                    isCancelado && styles.glowError
                  ]}
                >
                  <View style={styles.cardHeader}>
                    <View style={styles.busInfo}>
                      <View style={styles.busIconContainer}>
                        <Ionicons name="bus" size={18} color={Colors.primary} />
                      </View>
                      <View>
                        <Text style={styles.empresaName}>{trip.ruta_nombre}</Text>
                        <Text style={styles.busDetails}>Unidad #{trip.unidad_numero || 'S/N'} • Placa: {trip.unidad_placa || '--'}</Text>
                      </View>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
                      <Text style={[styles.statusBadgeText, { color: statusColor }]}>{statusText}</Text>
                    </View>
                  </View>

                  {/* Conductor info bar */}
                  <View style={styles.driverBar}>
                    {trip.conductor_photo ? (
                      <Image 
                        source={{ uri: `data:image/jpeg;base64,${trip.conductor_photo}` }} 
                        style={styles.driverCardAvatar} 
                      />
                    ) : (
                      <View style={styles.driverCardAvatarPlaceholder}>
                        <Ionicons name="person" size={10} color={Colors.textSecondary} />
                      </View>
                    )}
                    <Text style={styles.driverBarText}>
                      Conductor: <Text style={styles.driverBarName}>{trip.conductor_nombre || 'No asignado'}</Text>
                    </Text>
                  </View>

                  <View style={styles.cardBody}>
                    <View style={styles.timeColumn}>
                      <Text style={styles.timeLabel}>SALIDA ESTIMADA</Text>
                      <Text style={[styles.timeValText, isCancelado && styles.lineThrough]}>{salida}</Text>
                      <Text style={styles.terminalText}>{trip.route_details?.origen || 'Terminal'}</Text>
                    </View>
                    
                    {!isCancelado && (
                      <View style={styles.durationPill}>
                        <Text style={styles.durationText}>{duracion}</Text>
                      </View>
                    )}

                    <View style={[styles.timeColumn, { alignItems: 'flex-end' }]}>
                      <Text style={styles.timeLabel}>LLEGADA PROYECTADA</Text>
                      <Text style={[styles.timeValText, isCancelado && styles.lineThrough]}>{llegada}</Text>
                      <Text style={styles.terminalText}>{trip.route_details?.destino || 'Destino'}</Text>
                    </View>
                  </View>

                  {isCancelado && (
                    <View style={styles.cancelBanner}>
                      <Text style={styles.cancelLabel}>MOTIVO TÉCNICO</Text>
                      <Text style={styles.cancelText}>{trip.razon_cancelacion || 'Mantenimiento preventivo'}</Text>
                    </View>
                  )}

                  {!isCancelado && (
                    <View style={styles.cardFooter}>
                      {isEnRuta && trip.telemetry ? (
                        <View style={styles.telemetryRow}>
                          <View style={styles.telemetryItem}>
                            <Ionicons name="wifi" size={14} color={Colors.success} />
                            <Text style={styles.telemetryText}>GPS Sincronizado</Text>
                          </View>
                          <View style={styles.telemetryItem}>
                            <Ionicons name="speedometer-outline" size={14} color={Colors.textSecondary} />
                            <Text style={styles.telemetryText}>Velocidad: {trip.telemetry.speed_kmh} km/h</Text>
                          </View>
                        </View>
                      ) : (
                        <View style={styles.telemetryRow}>
                          <View style={styles.telemetryItem}>
                            <Ionicons name="time-outline" size={14} color={Colors.textMuted} />
                            <Text style={styles.telemetryMutedText}>Telemetría inactiva</Text>
                          </View>
                        </View>
                      )}

                      <TouchableOpacity 
                        style={[styles.actionBtn, !isEnRuta && styles.actionBtnDisabled]}
                        disabled={!isEnRuta}
                        onPress={() => navigation.navigate('Mapa', { tripId: trip.id })}
                      >
                        <Text style={[styles.actionBtnText, !isEnRuta && styles.actionBtnTextDisabled]}>
                          Ver Seguimiento
                        </Text>
                        <Ionicons name="chevron-forward" size={14} color={isEnRuta ? Colors.white : Colors.textMuted} />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingTop: StatusBar.currentHeight || 12,
    paddingBottom: Spacing.md, paddingHorizontal: Spacing.lg,
  },
  backBtn: { padding: 4 },
  headerSub: { fontSize: 10, color: 'rgba(255,255,255,0.6)', fontWeight: '700', letterSpacing: 0.5 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: Colors.white },
  syncBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(34,197,94,0.15)', borderRadius: Radius.sm,
    paddingHorizontal: 8, paddingVertical: 4,
  },
  pulseDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.success },
  syncText: { fontSize: 10, fontWeight: '700', color: Colors.success },
  
  scrollContent: { paddingBottom: 40 },

  // Bento layout
  bentoContainer: {
    flexDirection: 'row', gap: 8,
    marginHorizontal: Spacing.lg, marginTop: Spacing.md, marginBottom: Spacing.md,
  },
  routeCard: {
    flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.white, borderRadius: Radius.md, padding: Spacing.md, ...Shadow.sm,
  },
  dateCard: {
    flex: 1, backgroundColor: Colors.primary, borderRadius: Radius.md, padding: Spacing.md, ...Shadow.sm,
  },
  bentoLabel: { fontSize: 9, fontWeight: '700', color: Colors.textSecondary, letterSpacing: 0.5, marginBottom: 2 },
  bentoLabelDate: { fontSize: 9, fontWeight: '700', color: 'rgba(255,255,255,0.6)', letterSpacing: 0.5, marginBottom: 4 },
  bentoVal: { fontSize: 15, fontWeight: '800', color: Colors.primary },
  dateRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dateVal: { fontSize: 13, fontWeight: '800', color: Colors.white },

  listContainer: { paddingHorizontal: Spacing.lg },
  tripCard: {
    backgroundColor: Colors.white, borderRadius: Radius.lg,
    padding: Spacing.md, marginBottom: Spacing.md, ...Shadow.sm,
    borderLeftWidth: 4, borderLeftColor: Colors.border,
  },
  glowPositive: { borderLeftColor: Colors.success },
  glowWarning: { borderLeftColor: Colors.warning },
  glowError: { borderLeftColor: Colors.danger },

  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.md },
  busInfo: { flexDirection: 'row', gap: 10, flex: 1, marginRight: 8 },
  busIconContainer: {
    width: 32, height: 32, borderRadius: Radius.sm,
    backgroundColor: Colors.borderLight, alignItems: 'center', justifyContent: 'center'
  },
  empresaName: { fontSize: 16, fontWeight: '800', color: Colors.textPrimary },
  busDetails: { fontSize: 11, color: Colors.textSecondary, marginTop: 1 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: Radius.full },
  statusBadgeText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },

  cardBody: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  timeColumn: { flex: 1 },
  timeLabel: { fontSize: 9, fontWeight: '700', color: Colors.textMuted, letterSpacing: 0.5, marginBottom: 2 },
  timeValText: { fontSize: 22, fontWeight: '800', color: Colors.textPrimary },
  lineThrough: { textDecorationLine: 'line-through', color: Colors.textMuted },
  terminalText: { fontSize: 11, color: Colors.textSecondary },
  durationPill: {
    backgroundColor: Colors.borderLight, borderRadius: Radius.full,
    paddingHorizontal: 8, paddingVertical: 4,
  },
  durationText: { fontSize: 11, color: Colors.textSecondary, fontWeight: '600' },

  cancelBanner: {
    backgroundColor: '#FEE2E2', borderRadius: Radius.sm, padding: Spacing.sm, marginTop: Spacing.sm,
  },
  cancelLabel: { fontSize: 9, fontWeight: '800', color: Colors.danger, letterSpacing: 0.5, marginBottom: 2 },
  cancelText: { fontSize: 12, color: Colors.danger, fontWeight: '600' },

  cardFooter: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderTopWidth: 1, borderTopColor: Colors.borderLight, paddingTop: Spacing.sm, marginTop: Spacing.sm,
  },
  telemetryRow: { flex: 1, gap: 4 },
  telemetryItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  telemetryText: { fontSize: 11, color: Colors.textPrimary, fontWeight: '600' },
  telemetryMutedText: { fontSize: 11, color: Colors.textMuted },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.primary, borderRadius: Radius.md,
    paddingHorizontal: 12, paddingVertical: 8,
  },
  actionBtnDisabled: { backgroundColor: Colors.borderLight },
  actionBtnText: { fontSize: 12, fontWeight: '700', color: Colors.white },
  actionBtnTextDisabled: { color: Colors.textMuted },

  emptyContainer: { alignItems: 'center', padding: 40, gap: 8 },
  emptyText: { fontSize: 14, color: Colors.textSecondary, fontWeight: '600', textAlign: 'center' },
  driverBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: Radius.sm,
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginBottom: Spacing.sm,
    gap: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  driverCardAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  driverCardAvatarPlaceholder: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  driverBarText: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  driverBarName: {
    fontWeight: '700',
    color: Colors.textPrimary,
  },
});
