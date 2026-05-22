import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, StatusBar, Animated, PanResponder, Dimensions, Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MapView, { PROVIDER_GOOGLE } from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions';
import * as Location from 'expo-location';
import { supabase } from '../../lib/supabase';
import { Colors, Spacing, Radius, Shadow } from '../../theme/colors';
import { useRole } from '../../context/RoleContext';
import ReporteIncidenciasModal from './ReporteIncidenciasScreen';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const MAX_UP = 600; 
const MIN_DOWN = 180; // reduced height to only show the top part initially
const SNAP_TOP = SCREEN_HEIGHT - MAX_UP;
const SNAP_BOTTOM = SCREEN_HEIGHT - MIN_DOWN;

const DIRECTIONS_API_KEY = process.env.EXPO_PUBLIC_DIRECTIONS_API_KEY || '';
// Default origin/dest just in case
const ORIGIN = { latitude: -2.1658274, longitude: -79.6091504 };
const DESTINATION = { latitude: -1.6627475, longitude: -78.6633838 };

interface Trip {
  id: string;
  ruta_nombre: string;
  unidad_placa: string;
  estado: string;
}

export default function DashboardConductorScreen({ navigation }: any) {
  const { setRole, setUserName, setSupabaseUserId } = useRole();
  const [timer, setTimer] = useState(0);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [routeStats, setRouteStats] = useState({ distance: 0, duration: 0 });
  const [activeTrip, setActiveTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingDots, setLoadingDots] = useState('');
  
  const [showIncidentModal, setShowIncidentModal] = useState(false);
  const [showProfilePopup, setShowProfilePopup] = useState(false);

  const translateY = useRef(new Animated.Value(SNAP_BOTTOM)).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        const nextVal = SNAP_BOTTOM + gestureState.dy;
        if (nextVal >= SNAP_TOP && nextVal <= SNAP_BOTTOM + 50) {
          translateY.setValue(nextVal);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy < -50 || (translateY as any)._value < SNAP_TOP + 100) {
          Animated.spring(translateY, { 
            toValue: SNAP_TOP, 
            useNativeDriver: false, 
            bounciness: 4 
          }).start();
        } else {
          Animated.spring(translateY, { toValue: SNAP_BOTTOM, useNativeDriver: false }).start();
        }
      },
    })
  ).current;

  useEffect(() => {
    fetchActiveTrip();
    
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        Location.watchPositionAsync(
          { accuracy: Location.Accuracy.High, distanceInterval: 10 },
          (loc) => setLocation(loc)
        );
      }
    })();
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (activeTrip && activeTrip.estado === 'En Ruta') {
      interval = setInterval(() => setTimer(t => t + 1), 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeTrip?.estado]);

  // Animación de puntos suspensivos para estado vacío
  useEffect(() => {
    if (!activeTrip && !loading) {
      const interval = setInterval(() => {
        setLoadingDots((prev) => prev.length >= 3 ? '' : prev + '.');
      }, 500);
      return () => clearInterval(interval);
    }
  }, [activeTrip, loading]);

  const fetchActiveTrip = async () => {
    setLoading(true);
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) {
        setLoading(false);
        return;
      }
      
      const { data, error } = await supabase
        .from('trips')
        .select('*')
        .eq('conductor_id', userData.user.id)
        .in('estado', ['Programado', 'En Espera', 'En Ruta'])
        .limit(1)
        .single();
        
      if (!error && data) {
        setActiveTrip(data);
      }
    } catch (e) {
      console.log('Error fetching active trip', e);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setShowProfilePopup(false);
    await supabase.auth.signOut();
    setRole('pasajero');
    setUserName('Usuario');
    setSupabaseUserId(null);
    navigation.replace('Login');
  };

  const handleMarcarEnEspera = async () => {
    if (!activeTrip) return;
    try {
      const { error } = await supabase
        .from('trips')
        .update({ estado: 'En Espera' })
        .eq('id', activeTrip.id);
      
      if (!error) {
        setActiveTrip({ ...activeTrip, estado: 'En Espera' });
      }
    } catch (e) {
      console.log('Error al marcar en espera', e);
    }
  };

  const handleIniciarViaje = async () => {
    if (!activeTrip) return;
    try {
      const { error } = await supabase
        .from('trips')
        .update({ estado: 'En Ruta' })
        .eq('id', activeTrip.id);
      
      if (!error) {
        setActiveTrip({ ...activeTrip, estado: 'En Ruta' });
        navigation.navigate('MapaNavegacion');
      }
    } catch (e) {
      console.log('Error al iniciar viaje', e);
    }
  };

  const formatTimer = (s: number) => {
    const h = Math.floor(s / 3600).toString().padStart(2, '0');
    const m = Math.floor((s % 3600) / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${h}:${m}:${sec}`;
  };

  const formatDuration = (mins: number) => {
    if (mins === 0) return '--';
    if (mins < 60) return `${Math.round(mins)} min`;
    const h = Math.floor(mins / 60);
    const m = Math.round(mins % 60);
    return `${h} h ${m} min`;
  };

  const currentSpeed = location?.coords?.speed && location.coords.speed > 0 
    ? (location.coords.speed * 3.6).toFixed(0) 
    : '0';

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />

      {/* Header flotante */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerBrand}>LOGÍSTICA FLUIDA</Text>
          <Text style={styles.unitId}>{activeTrip ? `UNIDAD ${activeTrip.unidad_placa}` : 'SIN UNIDAD'}</Text>
        </View>
        <View style={styles.headerRight}>
          <Ionicons name="radio-outline" size={20} color={activeTrip ? Colors.primary : Colors.textMuted} />
          <View style={[styles.activeDot, { backgroundColor: activeTrip ? Colors.success : Colors.textMuted }]} />
          
          {/* Profile Button */}
          <TouchableOpacity 
            style={styles.profileBtn}
            onPress={() => setShowProfilePopup(true)}
          >
            <Ionicons name="person-circle" size={32} color={Colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Profile Popup */}
      <Modal visible={showProfilePopup} transparent animationType="fade">
        <TouchableOpacity style={styles.popupOverlay} activeOpacity={1} onPress={() => setShowProfilePopup(false)}>
          <View style={styles.popupContent}>
            <TouchableOpacity 
              style={styles.popupOption} 
              onPress={() => {
                setShowProfilePopup(false);
                // Here we can navigate to full profile or logout
                navigation.navigate('Perfil'); // Si está en el stack
              }}
            >
              <Ionicons name="person-outline" size={20} color={Colors.textPrimary} />
              <Text style={styles.popupOptionText}>Mi Perfil</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.popupOption} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={20} color={Colors.danger} />
              <Text style={[styles.popupOptionText, { color: Colors.danger }]}>Cerrar Sesión</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Mapa de fondo */}
      <View style={styles.mapWrapper}>
        <MapView
          provider={PROVIDER_GOOGLE}
          style={StyleSheet.absoluteFillObject}
          showsUserLocation
          initialRegion={{
            latitude: -2.1658,
            longitude: -79.6091,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }}
        >
          {activeTrip && (
            <MapViewDirections
              origin={location ? { latitude: location.coords.latitude, longitude: location.coords.longitude } : ORIGIN}
              destination={DESTINATION}
              apikey={DIRECTIONS_API_KEY}
              strokeWidth={5}
              strokeColor={Colors.accent}
              onReady={(result) => {
                setRouteStats({ distance: result.distance, duration: result.duration });
              }}
            />
          )}
        </MapView>
        
        {/* Overlay cuando no hay viaje activo */}
        {!activeTrip && !loading && (
          <View style={styles.emptyStateOverlay}>
            <View style={styles.emptyStateCard}>
              <Ionicons name="bus-outline" size={48} color={Colors.textMuted} style={{ marginBottom: 16 }} />
              <Text style={styles.emptyStateText}>Sin viaje asignado</Text>
              <Text style={styles.emptyStateSubtext}>Espere{loadingDots}</Text>
            </View>
          </View>
        )}
      </View>

      {/* Panel Deslizable (Bottom Sheet) */}
      <Animated.View style={[styles.bottomSheet, { transform: [{ translateY }] }]}>
        <View {...panResponder.panHandlers} style={styles.handleContainer}>
          <View style={styles.handleBar} />
          <Text style={styles.handleText}>PANEL DE CONTROL OPERATIVO</Text>
        </View>

        <View style={styles.sheetContent}>
          {/* Botón de Incidencias Principal o Iniciar Viaje */}
          {activeTrip && activeTrip.estado === 'Programado' ? (
            <TouchableOpacity 
              style={[styles.incidentBtn, { backgroundColor: '#F59E0B' }]}
              onPress={handleMarcarEnEspera}
            >
              <Ionicons name="time" size={24} color={Colors.white} />
              <Text style={styles.incidentBtnText}>MARCAR EN ESPERA</Text>
            </TouchableOpacity>
          ) : activeTrip && activeTrip.estado === 'En Espera' ? (
            <TouchableOpacity 
              style={[styles.incidentBtn, { backgroundColor: Colors.success }]}
              onPress={handleIniciarViaje}
            >
              <Ionicons name="play" size={24} color={Colors.white} />
              <Text style={styles.incidentBtnText}>INICIAR VIAJE</Text>
            </TouchableOpacity>
          ) : activeTrip && activeTrip.estado === 'En Ruta' ? (
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: Spacing.lg }}>
              <TouchableOpacity 
                style={[styles.incidentBtn, { flex: 1, marginBottom: 0, backgroundColor: Colors.primary }]}
                onPress={() => navigation.navigate('MapaNavegacion')}
              >
                <Ionicons name="map" size={20} color={Colors.white} />
                <Text style={[styles.incidentBtnText, { fontSize: 13 }]}>VER MAPA</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.incidentBtn, { flex: 1, marginBottom: 0 }]}
                onPress={() => setShowIncidentModal(true)}
              >
                <Ionicons name="warning" size={20} color={Colors.white} />
                <Text style={[styles.incidentBtnText, { fontSize: 13 }]}>REPORTE</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity 
              style={styles.incidentBtn}
              onPress={() => setShowIncidentModal(true)}
              disabled={!activeTrip}
            >
              <Ionicons name="warning" size={24} color={Colors.white} />
              <Text style={styles.incidentBtnText}>REPORTAR INCIDENCIA</Text>
            </TouchableOpacity>
          )}

          {activeTrip ? (
            <View style={styles.infoScroll}>
              {/* Tarjeta de Ruta */}
              <View style={styles.routeCard}>
                <View style={styles.routeAccent} />
                <View style={styles.routeContent}>
                  <Text style={styles.routeLabel}>RUTA ASIGNADA</Text>
                  <Text style={styles.routeTitle}>{activeTrip.ruta_nombre}</Text>
                  <View style={styles.statRow}>
                    <View style={styles.statItem}>
                      <Ionicons name="time-outline" size={16} color="#0284C7" />
                      <Text style={styles.statValSmall}>ETA: {formatDuration(routeStats.duration).toUpperCase()}</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Ionicons name="location-outline" size={16} color={Colors.success} />
                      <Text style={styles.statValSmall}>DIST: {routeStats.distance.toFixed(1)} KM</Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Cuadrícula de Telemetría */}
              <View style={styles.telGrid}>
                <View style={styles.telCell}>
                  <Text style={styles.telLabel}>SATÉLITE</Text>
                  <Text style={styles.telVal}>98%</Text>
                </View>
                <View style={styles.telCell}>
                  <Text style={styles.telLabel}>CONDUCCIÓN</Text>
                  <Text style={styles.telVal}>{formatTimer(timer)}</Text>
                </View>
                <View style={styles.telCell}>
                  <Text style={styles.telLabel}>VELOCIDAD</Text>
                  <Text style={styles.telVal}>{currentSpeed} <Text style={styles.telSub}>km/h</Text></Text>
                </View>
                <View style={styles.telCell}>
                  <Text style={styles.telLabel}>ESTADO</Text>
                  <Text style={[styles.telVal, {color: Colors.success, fontSize: 13}]}>{activeTrip.estado.toUpperCase()}</Text>
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.infoScroll}>
              <Text style={{textAlign: 'center', color: Colors.textMuted, marginTop: 20}}>
                La telemetría se activará cuando inicies un viaje.
              </Text>
            </View>
          )}
        </View>
      </Animated.View>

      {/* Modal de Reporte de Incidencias */}
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  header: {
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.white, paddingHorizontal: Spacing.lg,
    paddingTop: 52, paddingBottom: Spacing.sm,
    ...Shadow.sm,
  },
  headerBrand: { fontSize: 16, fontWeight: '900', color: Colors.primary, letterSpacing: 1 },
  unitId: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  activeDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.success, marginRight: 8 },
  profileBtn: {
    padding: 2,
  },
  
  popupOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.1)',
  },
  popupContent: {
    position: 'absolute', top: 100, right: 20,
    backgroundColor: Colors.white, borderRadius: Radius.lg,
    paddingVertical: Spacing.sm, width: 160,
    ...Shadow.lg, elevation: 10,
  },
  popupOption: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 12, paddingHorizontal: 16,
  },
  popupOptionText: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  
  mapWrapper: { flex: 1, zIndex: 1 },
  
  emptyStateOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  emptyStateCard: {
    backgroundColor: Colors.white,
    padding: 30,
    borderRadius: Radius.xl,
    alignItems: 'center',
    ...Shadow.lg,
    elevation: 10,
    minWidth: 250,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  emptyStateSubtext: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginTop: 8,
    width: 80,
  },
  
  bottomSheet: {
    position: 'absolute', left: 0, right: 0, height: MAX_UP,
    backgroundColor: Colors.white, borderTopLeftRadius: 30, borderTopRightRadius: 30,
    zIndex: 20, ...Shadow.lg, elevation: 25,
  },
  handleContainer: {
    alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: Colors.borderLight,
  },
  handleBar: { width: 40, height: 5, backgroundColor: '#E2E8F0', borderRadius: 3, marginBottom: 8 },
  handleText: { fontSize: 10, fontWeight: '800', color: Colors.textMuted, letterSpacing: 1.5 },
  
  sheetContent: { padding: Spacing.lg, flex: 1 },
  
  incidentBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
    backgroundColor: '#F97316', // Orange warning color
    borderRadius: Radius.lg, padding: Spacing.md,
    marginBottom: Spacing.lg,
    ...Shadow.md,
  },
  incidentBtnText: { color: Colors.white, fontSize: 15, fontWeight: '800', letterSpacing: 1 },
  
  infoScroll: {
    flex: 1,
  },
  
  routeCard: {
    borderRadius: Radius.lg, overflow: 'hidden', borderWidth: 1, borderColor: Colors.border,
    flexDirection: 'row', marginBottom: Spacing.md,
  },
  routeAccent: { width: 5, backgroundColor: Colors.accent },
  routeContent: { flex: 1, padding: Spacing.md },
  routeLabel: { fontSize: 10, color: Colors.textMuted, fontWeight: '700', marginBottom: 4 },
  routeTitle: { fontSize: 18, fontWeight: '800', color: Colors.primary, marginBottom: 8 },
  statRow: { flexDirection: 'row', gap: 15 },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statValSmall: { fontSize: 12, fontWeight: '700', color: Colors.textPrimary },

  telGrid: { 
    flexDirection: 'row', flexWrap: 'wrap', marginBottom: Spacing.md, 
    borderRadius: Radius.md, overflow: 'hidden', borderWidth: 1, borderColor: Colors.border 
  },
  telCell: { width: '50%', padding: 12, borderRightWidth: 0.5, borderBottomWidth: 0.5, borderColor: Colors.border },
  telLabel: { fontSize: 8, color: Colors.textMuted, fontWeight: '700', marginBottom: 2 },
  telVal: { fontSize: 18, fontWeight: '800', color: Colors.textPrimary },
  telSub: { fontSize: 10, color: Colors.textSecondary },
});
