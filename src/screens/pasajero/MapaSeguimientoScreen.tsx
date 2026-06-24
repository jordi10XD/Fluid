import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, StatusBar, Dimensions,
  Modal, TextInput, ActivityIndicator, Image, Alert
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
  const [driverPhoto, setDriverPhoto] = useState<string | null>(null);
  const mapRef = React.useRef<MapView | null>(null);
  const lastSelectedTripIdRef = React.useRef<string | null>(null);

  const [assistModalVisible, setAssistModalVisible] = useState(false);
  const [assistMsg, setAssistMsg] = useState('');
  const [assistSeverity, setAssistSeverity] = useState('Moderado');
  const [isSubmittingAssist, setIsSubmittingAssist] = useState(false);
  const [activeAlert, setActiveAlert] = useState<any | null>(null);

  // Subscribe to changes in the selected trip's state (detect when driver ends the trip)
  useEffect(() => {
    if (!selectedBus?.trip_id) return;

    const tripId = selectedBus.trip_id;
    const channelName = `realtime_trip_status_${tripId}_${Math.random()}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'trips', filter: `id=eq.${tripId}` },
        (payload: any) => {
          if (payload.new && payload.new.estado === 'Finalizado') {
            Alert.alert(
              'Viaje Finalizado',
              'El viaje ha finalizado. Gracias por viajar con nosotros.',
              [{ text: 'Entendido', onPress: () => navigation.goBack() }]
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedBus?.trip_id]);

  // Subscribe to driver incidents in real-time
  useEffect(() => {
    if (!selectedBus?.trips?.conductor_id) return;

    const conductorId = selectedBus.trips.conductor_id;
    const channelName = `realtime_incidents_${conductorId}_${Math.random()}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'incidencias', filter: `conductor_id=eq.${conductorId}` },
        (payload: any) => {
          if (payload.new) {
            setActiveAlert(payload.new);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedBus?.trips?.conductor_id]);

  const handleSendAssist = async () => {
    if (!assistMsg.trim()) {
      alert('Por favor ingrese el motivo de la asistencia.');
      return;
    }
    
    setIsSubmittingAssist(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const email = userData?.user?.email || 'Pasajero Anónimo';

      const { error } = await supabase.from('incidencias').insert({
        unidad_placa: selectedBus?.trips?.unidad_placa || 'N/A',
        ruta_nombre: selectedBus?.trips?.ruta_nombre || 'N/A',
        tipo: 'Asistencia Pasajero',
        severidad: assistSeverity,
        descripcion: `Solicitud de Pasajero (${email}): ${assistMsg}`,
        estado: 'PENDIENTE',
        lat: location?.coords.latitude || null,
        lng: location?.coords.longitude || null
      });

      if (error) throw error;

      alert('Solicitud de asistencia enviada exitosamente.');
      setAssistModalVisible(false);
      setAssistMsg('');
      setAssistSeverity('Moderado');
    } catch (e) {
      console.log('Error al enviar asistencia:', e);
      alert('Hubo un error al guardar la solicitud de asistencia.');
    } finally {
      setIsSubmittingAssist(false);
    }
  };

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
            ruta_id: trip.ruta_id,
            conductor_id: trip.conductor_id,
            conductor_nombre: trip.conductor_nombre
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

  // Fetch driver profile photo when selectedBus changes
  useEffect(() => {
    if (selectedBus?.trips?.conductor_id) {
      const fetchDriverPhoto = async () => {
        try {
          const { data, error } = await supabase
            .from('user_photos')
            .select('photo')
            .eq('user_id', selectedBus.trips.conductor_id)
            .single();
          if (!error && data) {
            setDriverPhoto(data.photo);
          } else {
            setDriverPhoto(null);
          }
        } catch (err) {
          console.log('Error fetching driver photo:', err);
          setDriverPhoto(null);
        }
      };
      fetchDriverPhoto();
    } else {
      setDriverPhoto(null);
    }
  }, [selectedBus?.trips?.conductor_id]);

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

      {/* Banner de Incidencia del Conductor en Vivo */}
      {activeAlert && (
        <View style={[
          styles.incidentBanner,
          activeAlert.severidad === 'Crítico' ? styles.bannerCritical : 
          activeAlert.severidad === 'Moderado' ? styles.bannerModerate : styles.bannerLow
        ]}>
          <View style={styles.bannerIconContainer}>
            <Ionicons 
              name={activeAlert.severidad === 'Crítico' ? 'alert-circle' : 'warning'} 
              size={24} 
              color={Colors.white} 
            />
          </View>
          <View style={styles.bannerTextContainer}>
            <Text style={styles.bannerTitle}>REPORTE EN VIVO: {activeAlert.tipo?.toUpperCase()}</Text>
            <Text style={styles.bannerDescription}>{activeAlert.descripcion}</Text>
          </View>
          <TouchableOpacity 
            style={styles.bannerCloseBtn} 
            onPress={() => setActiveAlert(null)}
          >
            <Text style={styles.bannerCloseText}>OK</Text>
          </TouchableOpacity>
        </View>
      )}

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
        {selectedBus ? (
          <>
            {/* Header info */}
            <View style={styles.headerRow}>
              <View style={styles.unitBadge}>
                <Ionicons name="bus-outline" size={14} color={Colors.primary} />
                <Text style={styles.unitText}>UNIDAD {selectedBus.trips?.unidad_numero || 'S/N'}</Text>
              </View>
              <View style={styles.etaContainer}>
                <Ionicons name="time-outline" size={16} color={Colors.primary} />
                <Text style={styles.etaText}>
                  {routeDetails?.tiempo_min ? `ETA: ~ ${routeDetails.tiempo_min} min` : 'ETA: --'}
                </Text>
              </View>
            </View>

            {/* Route Name */}
            <Text style={styles.routeName} numberOfLines={1} adjustsFontSizeToFit>
              {selectedBus.trips?.ruta_nombre || 'Ruta en curso'}
            </Text>

            {/* Conductor Profile Row */}
            <View style={styles.driverProfileRow}>
              {driverPhoto ? (
                <Image 
                  source={{ uri: `data:image/jpeg;base64,${driverPhoto}` }} 
                  style={styles.driverAvatar} 
                />
              ) : (
                <View style={styles.driverAvatarPlaceholder}>
                  <Ionicons name="person" size={20} color={Colors.textSecondary} />
                </View>
              )}
              <View style={styles.driverInfoContainer}>
                <Text style={styles.driverLabel}>CONDUCTOR ASIGNADO</Text>
                <Text style={styles.driverName}>
                  {selectedBus.trips?.conductor_nombre || 'No asignado'}
                </Text>
              </View>
            </View>

            {/* Timeline Visualizer */}
            <View style={styles.timelineContainer}>
              <View style={styles.timelineLine}>
                <View style={[styles.timelineProgress, { width: getProgressWidth() as any }]} />
              </View>
              <View style={[styles.timelineBusIndicator, { left: getProgressWidth() as any }]}>
                <Ionicons name="bus" size={14} color={Colors.white} />
              </View>
              <View style={styles.timelineNodesRow}>
                <View style={styles.timelineNodeContainer}>
                  <View style={[styles.timelineNodeDot, { backgroundColor: Colors.success }]} />
                  <Text style={styles.timelineNodeName} numberOfLines={1}>
                    {routeDetails?.origen || 'Origen'}
                  </Text>
                </View>
                <View style={[styles.timelineNodeContainer, { alignItems: 'flex-end' }]}>
                  <View style={[styles.timelineNodeDot, { backgroundColor: Colors.danger }]} />
                  <Text style={styles.timelineNodeName} numberOfLines={1}>
                    {routeDetails?.destino || 'Destino'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Info Grid Card */}
            <View style={styles.detailsCard}>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>DISTANCIA</Text>
                <Text style={styles.detailValue}>
                  {routeDetails?.distancia_km ? `${routeDetails.distancia_km} km` : '--'}
                </Text>
              </View>
              <View style={[styles.detailItem, { borderLeftWidth: 1, borderRightWidth: 1, borderColor: '#E2E8F0' }]}>
                <Text style={styles.detailLabel}>VELOCIDAD</Text>
                <Text style={styles.detailValue}>{selectedBus.speed_kmh} km/h</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>PLACA</Text>
                <Text style={styles.detailValue}>{selectedBus.trips?.unidad_placa || '--'}</Text>
              </View>
            </View>

            {/* Actions */}
            <View style={styles.actionRow}>
              <TouchableOpacity 
                style={styles.assistBtn}
                onPress={() => setAssistModalVisible(true)}
              >
                <Ionicons name="help-circle-outline" size={20} color={Colors.white} />
                <Text style={styles.assistText}>Solicitar Asistencia</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <View style={{ paddingVertical: 20, alignItems: 'center' }}>
            <Ionicons name="information-circle-outline" size={32} color={Colors.textMuted} style={{ marginBottom: 8 }} />
            <Text style={{ fontSize: 14, fontWeight: '700', color: Colors.textSecondary }}>
              SIN UNIDADES EN RUTA EN ESTE MOMENTO
            </Text>
          </View>
        )}
      </View>

      {/* Modal de Asistencia */}
      <Modal
        visible={assistModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setAssistModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Solicitar Asistencia Médica o Técnica</Text>
            
            {/* Severity Selector */}
            <Text style={[styles.detailLabel, { marginBottom: 8 }]}>SEVERIDAD</Text>
            <View style={styles.severityRow}>
              {[
                { label: 'Leve', color: Colors.success },
                { label: 'Moderado', color: Colors.warning },
                { label: 'Crítico', color: Colors.danger },
              ].map((s) => (
                <TouchableOpacity 
                  key={s.label} 
                  style={[
                    styles.severityChip, 
                    { borderColor: s.color },
                    assistSeverity === s.label && { backgroundColor: s.color + '20' }
                  ]}
                  onPress={() => setAssistSeverity(s.label)}
                >
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: s.color }} />
                  <Text style={[styles.severityChipText, { color: s.color }]}>{s.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Message input */}
            <Text style={[styles.detailLabel, { marginBottom: 8 }]}>DESCRIPCIÓN DEL INCIDENTE</Text>
            <TextInput
              style={styles.textArea}
              multiline
              numberOfLines={4}
              placeholder="Describa brevemente la situación o ayuda requerida..."
              placeholderTextColor={Colors.textMuted}
              value={assistMsg}
              onChangeText={setAssistMsg}
            />

            {/* Actions */}
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.modalCancelBtn}
                onPress={() => {
                  setAssistModalVisible(false);
                  setAssistMsg('');
                  setAssistSeverity('Moderado');
                }}
                disabled={isSubmittingAssist}
              >
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalSubmitBtn, isSubmittingAssist && { opacity: 0.7 }]}
                onPress={handleSendAssist}
                disabled={isSubmittingAssist}
              >
                {isSubmittingAssist ? (
                  <ActivityIndicator size="small" color={Colors.white} />
                ) : (
                  <Text style={styles.modalSubmitText}>Enviar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    backgroundColor: Colors.white, borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 20, ...Shadow.lg,
  },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  unitBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#EFF6FF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16,
  },
  unitText: { fontSize: 13, fontWeight: '700', color: Colors.primary },
  etaContainer: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  etaText: { fontSize: 13, fontWeight: '700', color: Colors.primary },
  routeName: { fontSize: 18, fontWeight: '800', color: Colors.textPrimary, marginBottom: 12 },
  
  // Timeline
  timelineContainer: { marginVertical: 8, height: 44, position: 'relative', justifyContent: 'center' },
  timelineLine: { height: 4, backgroundColor: Colors.border, borderRadius: 2 },
  timelineProgress: { height: '100%', backgroundColor: Colors.primary, borderRadius: 2 },
  timelineBusIndicator: {
    position: 'absolute', top: 8, width: 28, height: 28, borderRadius: 14,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: Colors.white, marginLeft: -14, ...Shadow.sm,
  },
  timelineNodesRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  timelineNodeContainer: { flex: 1 },
  timelineNodeDot: { width: 8, height: 8, borderRadius: 4, marginBottom: 4 },
  timelineNodeName: { fontSize: 12, fontWeight: '700', color: Colors.textSecondary },
  
  // Details card
  detailsCard: {
    flexDirection: 'row', backgroundColor: '#F8FAFC', borderRadius: Radius.lg,
    padding: 12, marginVertical: 14, justifyContent: 'space-between',
  },
  detailItem: { alignItems: 'center', flex: 1 },
  detailLabel: { fontSize: 9, fontWeight: '700', color: Colors.textMuted, letterSpacing: 0.5, marginBottom: 2 },
  detailValue: { fontSize: 14, fontWeight: '800', color: Colors.textPrimary },
  
  // Actions
  actionRow: { flexDirection: 'row', gap: Spacing.sm },
  assistBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#EF4444', borderRadius: Radius.md, padding: 14, ...Shadow.sm,
  },
  assistText: { color: Colors.white, fontSize: 14, fontWeight: '700' },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: Colors.white, width: '88%', borderRadius: Radius.xl, padding: 20, ...Shadow.lg },
  modalTitle: { fontSize: 16, fontWeight: '800', color: Colors.primary, marginBottom: 16, textAlign: 'center' },
  severityRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  severityChip: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4,
    paddingVertical: 10, borderRadius: Radius.md, borderWidth: 1.5, backgroundColor: Colors.white,
  },
  severityChipText: { fontSize: 12, fontWeight: '700' },
  textArea: {
    backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md,
    padding: 12, height: 80, fontSize: 14, color: Colors.textPrimary, textAlignVertical: 'top',
    marginBottom: 20,
  },
  modalActions: { flexDirection: 'row', gap: 10 },
  modalCancelBtn: {
    flex: 1, paddingVertical: 12, borderRadius: Radius.md, borderWidth: 1.5,
    borderColor: Colors.border, alignItems: 'center',
  },
  modalCancelText: { fontSize: 14, fontWeight: '700', color: Colors.textSecondary },
  modalSubmitBtn: { flex: 1, backgroundColor: Colors.primary, paddingVertical: 12, borderRadius: Radius.md, alignItems: 'center' },
  modalSubmitText: { fontSize: 14, fontWeight: '700', color: Colors.white },
  driverProfileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.sm,
    marginBottom: Spacing.sm,
    gap: 12,
  },
  driverAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  driverAvatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  driverInfoContainer: {
    flex: 1,
  },
  driverLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.textSecondary,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  driverName: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  incidentBanner: {
    position: 'absolute',
    top: 105,
    left: Spacing.md,
    right: Spacing.md,
    zIndex: 100,
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: Radius.md,
    ...Shadow.lg,
  },
  bannerCritical: {
    backgroundColor: '#EF4444',
  },
  bannerModerate: {
    backgroundColor: '#F59E0B',
  },
  bannerLow: {
    backgroundColor: '#00B4D8',
  },
  bannerIconContainer: {
    marginRight: Spacing.sm,
  },
  bannerTextContainer: {
    flex: 1,
  },
  bannerTitle: {
    color: Colors.white,
    fontWeight: '800',
    fontSize: 12,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  bannerDescription: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: '600',
  },
  bannerCloseBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.sm,
    marginLeft: Spacing.sm,
  },
  bannerCloseText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '800',
  },
});
