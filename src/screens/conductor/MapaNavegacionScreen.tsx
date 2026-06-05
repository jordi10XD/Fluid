import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, StatusBar, 
  Animated, PanResponder, Dimensions, Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MapView, { PROVIDER_GOOGLE, Marker } from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions';
import * as Location from 'expo-location';
import { supabase } from '../../lib/supabase';
import { Colors, Spacing, Radius, Shadow } from '../../theme/colors';
import ReporteIncidenciasModal from './ReporteIncidenciasScreen';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const MAX_UP = 380; 
const MIN_DOWN = 100; 
const SNAP_TOP = SCREEN_HEIGHT - MAX_UP;
const SNAP_BOTTOM = SCREEN_HEIGHT - MIN_DOWN;

const DIRECTIONS_API_KEY = process.env.EXPO_PUBLIC_DIRECTIONS_API_KEY || '';

// Haversine formula to calculate distance between two coordinates in meters
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3;
  const p1 = lat1 * Math.PI / 180;
  const p2 = lat2 * Math.PI / 180;
  const dp = (lat2 - lat1) * Math.PI / 180;
  const dl = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(dp / 2) * Math.sin(dp / 2) +
            Math.cos(p1) * Math.cos(p2) *
            Math.sin(dl / 2) * Math.sin(dl / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function MapaNavegacionScreen({ navigation }: any) {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [routeInfo, setRouteInfo] = useState({ distance: 0, duration: 0 });
  const [activeTrip, setActiveTrip] = useState<any>(null);
  const [routeDetails, setRouteDetails] = useState<any>(null);
  
  const [steps, setSteps] = useState<any[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  
  const [loading, setLoading] = useState(true);
  const [showIncidentModal, setShowIncidentModal] = useState(false);
  const [trafficAlert, setTrafficAlert] = useState<string | null>(null);

  const translateY = useRef(new Animated.Value(SNAP_BOTTOM)).current;
  const mapRef = useRef<MapView>(null);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        const nextVal = SNAP_BOTTOM + gestureState.dy;
        if (nextVal >= SNAP_TOP && nextVal <= SNAP_BOTTOM) {
          translateY.setValue(nextVal);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        const isMovingUp = gestureState.dy < -50 || (translateY as any)._value < SNAP_TOP + 100;
        if (isMovingUp) {
          Animated.spring(translateY, { toValue: SNAP_TOP, useNativeDriver: false }).start();
        } else {
          Animated.spring(translateY, { toValue: SNAP_BOTTOM, useNativeDriver: false }).start();
        }
      },
    })
  ).current;

  // Initialize tracking and data fetch
  useEffect(() => {
    fetchActiveTrip();
    
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      
      const subscription = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, distanceInterval: 5 },
        (loc) => setLocation(loc)
      );
      
      return () => subscription.remove();
    })();
  }, []);

  // Publish live bus locations to Supabase trip_locations table when position changes and trip is active
  useEffect(() => {
    if (!location || !activeTrip) return;

    const publishLocation = async () => {
      try {
        const { error } = await supabase
          .from('trip_locations')
          .upsert({
            trip_id: activeTrip.id,
            current_location: {
              type: 'Point',
              coordinates: [location.coords.longitude, location.coords.latitude] // [lon, lat] as required by PostGIS GeoJSON
            },
            speed_kmh: location.coords.speed && location.coords.speed > 0 
              ? Math.round(location.coords.speed * 3.6) 
              : 0,
            recorded_at: new Date().toISOString()
          }, { onConflict: 'trip_id' });

        if (error) {
          console.log('Error publishing trip location:', error);
        }
      } catch (err) {
        console.log('Exception publishing trip location:', err);
      }
    };

    publishLocation();
  }, [location, activeTrip]);

  // Update Turn-by-Turn logic and Traffic detection
  useEffect(() => {
    if (location && steps.length > 0 && currentStepIndex < steps.length) {
      const step = steps[currentStepIndex];
      
      // Auto-centrado y rotación tipo GPS 3D
      if (mapRef.current) {
        mapRef.current.animateCamera({
          center: { latitude: location.coords.latitude, longitude: location.coords.longitude },
          pitch: 50,
          heading: location.coords.heading || 0,
          altitude: 800, // para iOS
          zoom: 17 // para Android
        }, { duration: 1000 });
      }

      // Distancia al final del paso actual
      const distToEnd = getDistance(
        location.coords.latitude, location.coords.longitude,
        step.end_location.lat, step.end_location.lng
      );
      
      // Traffic logic: si la velocidad esperada en el paso es menor a 4 m/s (aprox 15 km/h)
      // asumimos tráfico o cierre.
      if (step.distance && step.duration) {
        const expectedSpeed = step.distance.value / step.duration.value;
        if (expectedSpeed < 4) {
          setTrafficAlert("Tráfico denso o posible cierre de vía más adelante.");
        } else {
          setTrafficAlert(null);
        }
      }
      
      // Si estamos a menos de 30 metros del final del paso, avanzamos al siguiente
      if (distToEnd < 30) {
        setCurrentStepIndex(prev => Math.min(prev + 1, steps.length - 1));
      }
    }
  }, [location, steps, currentStepIndex]);

  const fetchActiveTrip = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) return;
      
      // Fetch trip
      const { data: trip } = await supabase
        .from('trips')
        .select('*')
        .eq('conductor_id', userData.user.id)
        .eq('estado', 'En Ruta')
        .limit(1)
        .single();
        
      if (trip) {
        setActiveTrip(trip);
        // Fetch route details
        const { data: route } = await supabase
          .from('routes')
          .select('*')
          .eq('id', trip.ruta_id)
          .single();
          
        if (route) setRouteDetails(route);
      }
    } catch (e) {
      console.log('Error fetching map data:', e);
    } finally {
      setLoading(false);
    }
  };

  const calculateETA = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + routeInfo.duration);
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  const currentSpeed = location?.coords?.speed && location.coords.speed > 0 
    ? (location.coords.speed * 3.6).toFixed(0) 
    : '0';

  // Parser para instrucciones HTML
  const cleanInstruction = (html: string) => {
    if (!html) return '';
    return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  };

  // Ícono de maniobra rudimentario basado en texto
  const getManeuverIcon = (instructions: string) => {
    const text = instructions.toLowerCase();
    if (text.includes('right') || text.includes('derecha')) return 'arrow-forward';
    if (text.includes('left') || text.includes('izquierda')) return 'arrow-back';
    if (text.includes('u-turn') || text.includes('vuelta')) return 'arrow-undo';
    return 'arrow-up';
  };

  const currentInstruction = steps.length > 0 && currentStepIndex < steps.length
    ? cleanInstruction(steps[currentStepIndex].html_instructions)
    : 'Diríjase a la ruta marcada';

  const instructionIcon = steps.length > 0 && currentStepIndex < steps.length
    ? getManeuverIcon(steps[currentStepIndex].html_instructions)
    : 'arrow-up';

  const routeOrigin = routeDetails?.origen_coords 
    ? { latitude: routeDetails.origen_coords.latitude, longitude: routeDetails.origen_coords.longitude } 
    : null;
    
  const routeDestination = routeDetails?.destino_coords
    ? { latitude: routeDetails.destino_coords.latitude, longitude: routeDetails.destino_coords.longitude }
    : null;

  // Usa la posición del usuario si está disponible, sino usa el origen de la ruta
  const mapOrigin = location 
    ? { latitude: location.coords.latitude, longitude: location.coords.longitude }
    : routeOrigin;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />
      
      {/* Header Clásico */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={Colors.primary} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.headerTitle}>MAPA OPERATIVO</Text>
          <Text style={styles.headerSub}>{activeTrip ? activeTrip.ruta_nombre : 'Cargando...'}</Text>
        </View>
        <View style={styles.gpsOnBadge}>
          <View style={styles.gpsDot} />
          <Text style={styles.gpsOnText}>GPS ON</Text>
        </View>
      </View>

      {/* Banner de Instrucción Turn-by-Turn */}
      {routeDetails && (
        <View style={styles.tbtBanner}>
          <View style={styles.tbtIconWrapper}>
            <Ionicons name={instructionIcon as any} size={28} color={Colors.white} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.tbtDistance}>
              {steps[currentStepIndex]?.distance?.text || 'En ruta'}
            </Text>
            <Text style={styles.tbtInstruction} numberOfLines={2}>
              {currentInstruction}
            </Text>
          </View>
        </View>
      )}

      {/* Alerta de Tráfico */}
      {trafficAlert && (
        <View style={styles.trafficBanner}>
          <Ionicons name="warning" size={20} color={Colors.white} />
          <Text style={styles.trafficText}>{trafficAlert}</Text>
        </View>
      )}

      {/* Map Content */}
      <View style={styles.mapWrapper}>
        <MapView
          ref={mapRef}
          provider={PROVIDER_GOOGLE}
          style={StyleSheet.absoluteFillObject}
          showsUserLocation
          showsTraffic={true}
          showsCompass={false}
          initialRegion={{
            latitude: mapOrigin ? mapOrigin.latitude : -1.9,
            longitude: mapOrigin ? mapOrigin.longitude : -79.1,
            latitudeDelta: 0.1,
            longitudeDelta: 0.1,
          }}
        >
          {mapOrigin && routeDestination && (
            <MapViewDirections
              origin={mapOrigin}
              destination={routeDestination}
              apikey={DIRECTIONS_API_KEY}
              strokeWidth={6}
              strokeColor={Colors.accent}
              mode="DRIVING"
              onReady={(result) => {
                setRouteInfo({ distance: result.distance, duration: result.duration });
                // Extraer pasos para Turn-by-Turn
                if (result.legs && result.legs.length > 0) {
                  setSteps(result.legs[0].steps);
                }
              }}
            />
          )}
          
          {routeOrigin && (
            <Marker coordinate={routeOrigin} title="Origen">
              <View style={styles.startPoint}><Text style={styles.startPointText}>O</Text></View>
            </Marker>
          )}
          {routeDestination && (
            <Marker coordinate={routeDestination} title="Destino">
              <View style={[styles.startPoint, { backgroundColor: Colors.primary }]}><Text style={styles.startPointText}>D</Text></View>
            </Marker>
          )}
        </MapView>

        {/* Botón de centrado */}
        <TouchableOpacity 
          style={styles.centerBtn} 
          onPress={() => {
            if (location && mapRef.current) {
              mapRef.current.animateCamera({
                center: { latitude: location.coords.latitude, longitude: location.coords.longitude },
                zoom: 17
              });
            }
          }}
        >
          <Ionicons name="locate" size={24} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Bottom Sheet */}
      <Animated.View style={[styles.bottomSheet, { transform: [{ translateY }] }]}>
        <View {...panResponder.panHandlers} style={styles.handleContainer}>
          <View style={styles.handleBar} />
          <Text style={styles.handleText}>INFO DE TRAYECTO</Text>
        </View>

        <View style={styles.sheetContent}>
          <View style={styles.infoGrid}>
            <InfoCell label="DESTINO" val={routeDetails ? routeDetails.destino : '--'} icon="flag-outline" />
            <InfoCell label="DISTANCIA" val={`${routeInfo.distance.toFixed(1)} km`} icon="navigate-outline" />
            <InfoCell label="VELOCIDAD" val={`${currentSpeed} km/h`} icon="speedometer-outline" />
            <InfoCell label="ETA DESTINO" val={calculateETA()} icon="time-outline" />
          </View>

          <TouchableOpacity style={styles.incidentBtn} onPress={() => setShowIncidentModal(true)}>
            <Ionicons name="warning-outline" size={18} color={Colors.white} />
            <Text style={styles.incidentBtnText}>REPORTAR INCIDENCIA</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Modal de Incidencias */}
      <Modal visible={showIncidentModal} animationType="slide" transparent>
        <ReporteIncidenciasModal 
          onClose={() => setShowIncidentModal(false)}
          unidad={activeTrip?.unidad_placa || ''}
          ruta={activeTrip?.ruta_nombre || ''}
          location={location}
        />
      </Modal>
    </View>
  );
}

const InfoCell = ({ label, val, icon }: any) => (
  <View style={styles.infoCell}>
    <Ionicons name={icon} size={16} color={Colors.accent} />
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoVal} numberOfLines={1}>{val}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    zIndex: 10,
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.white, paddingTop: 52, paddingBottom: Spacing.md,
    paddingHorizontal: Spacing.lg, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  headerTitle: { fontSize: 15, fontWeight: '800', color: Colors.primary },
  headerSub: { fontSize: 12, color: Colors.textMuted },
  gpsOnBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#DCFCE7', borderRadius: Radius.full, paddingHorizontal: 10, paddingVertical: 5 },
  gpsDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: Colors.success },
  gpsOnText: { fontSize: 11, fontWeight: '700', color: Colors.success },
  
  tbtBanner: {
    backgroundColor: '#1E293B',
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    zIndex: 10,
    borderBottomWidth: 2,
    borderBottomColor: Colors.primary,
    ...Shadow.lg,
  },
  tbtIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  tbtDistance: { color: Colors.accent, fontSize: 13, fontWeight: '800', marginBottom: 2 },
  tbtInstruction: { color: Colors.white, fontSize: 18, fontWeight: '700', lineHeight: 22 },

  trafficBanner: {
    backgroundColor: '#DC2626',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: Spacing.lg,
    zIndex: 9,
    gap: 8,
  },
  trafficText: { color: Colors.white, fontSize: 13, fontWeight: '700' },

  mapWrapper: { ...StyleSheet.absoluteFillObject, zIndex: 1 },

  bottomSheet: {
    position: 'absolute', left: 0, right: 0, height: SCREEN_HEIGHT,
    backgroundColor: Colors.white, borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl,
    zIndex: 20, ...Shadow.lg,
  },
  handleContainer: { alignItems: 'center', paddingVertical: 12 },
  handleBar: { width: 40, height: 5, borderRadius: 3, backgroundColor: '#ccc', marginBottom: 8 },
  handleText: { fontSize: 10, fontWeight: '700', color: Colors.textMuted, letterSpacing: 1 },
  sheetContent: { padding: Spacing.lg },
  
  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: Spacing.md },
  infoCell: { width: '50%', paddingVertical: 12, paddingRight: 8 },
  infoLabel: { fontSize: 9, color: Colors.textMuted, fontWeight: '700', marginVertical: 3 },
  infoVal: { fontSize: 16, fontWeight: '800', color: Colors.textPrimary },
  
  incidentBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderRadius: Radius.md, padding: 16, backgroundColor: '#F97316',
    ...Shadow.md,
  },
  incidentBtnText: { fontSize: 15, fontWeight: '800', color: Colors.white, letterSpacing: 1 },
  startPoint: { width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.success, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: Colors.white },
  startPointText: { color: Colors.white, fontSize: 13, fontWeight: '800' },
  centerBtn: {
    position: 'absolute', right: Spacing.lg, top: Spacing.lg,
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: Colors.white,
    alignItems: 'center', justifyContent: 'center',
    ...Shadow.md,
  },
});
