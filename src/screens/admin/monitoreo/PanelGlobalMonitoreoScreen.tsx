import React, { useState } from 'react';
import { View, Text, StyleSheet, Dimensions, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MapView, { PROVIDER_GOOGLE, Marker } from 'react-native-maps';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';

// Importaciones de tema (Ajusta la ruta de los '../' si es necesario según tu proyecto)
import { Colors, Spacing, Radius, Shadow } from '../../../theme/colors';

// Importación del componente de tarjeta (asegúrate de haberlo creado en la carpeta components)
import PressableStatCard from './components/PressableStatCard';
import { MonitoreoStackParamList } from './MonitoreoNavigator';

// ─── Tipos y Mock Data (Igual a tu versión original) ────────────────────────
type BusStatus = 'active' | 'delayed' | 'stopped';
interface BusData { id: string; lat: number; lng: number; route: string; status: BusStatus }

const BUSES: BusData[] = [
  { id: '312', lat: -2.1894, lng: -79.8891, route: 'R-012', status: 'active' },
  { id: '402', lat: -1.6669, lng: -78.6536, route: 'R-001', status: 'active' },
  { id: '115', lat: -0.2295, lng: -78.5243, route: 'R-001', status: 'delayed' },
];

const BUS_COLOR: Record<BusStatus, string> = {
  active:  Colors.success,
  delayed: Colors.warning,
  stopped: Colors.danger,
};

// ─── Configuración del Panel Deslizable ──────────────────────────────────────
const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const MIN_SHEET_HEIGHT = 300; // Altura cuando el panel está minimizado (se ven las 4 tarjetas)
const MAX_SHEET_HEIGHT = SCREEN_HEIGHT * 0.75; // Altura máxima al expandirse

type NavProp = StackNavigationProp<MonitoreoStackParamList, 'MonitoreoGlobal'>;

export default function PanelGlobalMonitoreoScreen() {
  const navigation = useNavigation<NavProp>();
  const [selectedBus, setSelectedBus] = useState<string | null>(null);
  
  // Reanimated valor para la posición en Y del panel
  const translateY = useSharedValue(0);

  // Configuración del gesto de arrastre (Draggable)
  const gesture = Gesture.Pan()
    .onUpdate((event) => {
      // Limitamos para que no suba más allá del tope establecido
      if (translateY.value + event.translationY > -(MAX_SHEET_HEIGHT - MIN_SHEET_HEIGHT)) {
        translateY.value = event.translationY;
      }
    })
    .onEnd((event) => {
      // Si el usuario desliza rápido hacia arriba o pasa la mitad, se expande
      if (event.translationY < -50 || event.velocityY < -500) {
        translateY.value = withSpring(-(MAX_SHEET_HEIGHT - MIN_SHEET_HEIGHT), { damping: 15 });
      } else {
        // De lo contrario, regresa a su estado minimizado
        translateY.value = withSpring(0, { damping: 15 });
      }
    });

  const animatedSheetStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
    };
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      
      {/* ── Mapa a Pantalla Completa ─────────────────────── */}
      <MapView
        provider={PROVIDER_GOOGLE}
        style={StyleSheet.absoluteFillObject}
        initialRegion={{ latitude: -1.6669, longitude: -78.6536, latitudeDelta: 2.2, longitudeDelta: 2.2 }}
      >
        {BUSES.map((bus) => (
          <Marker
            key={bus.id}
            coordinate={{ latitude: bus.lat, longitude: bus.lng }}
            onPress={() => setSelectedBus(bus.id === selectedBus ? null : bus.id)}
          >
            <View style={styles.markerWrap}>
              {selectedBus === bus.id && (
                <View style={[styles.markerLabel, { borderColor: BUS_COLOR[bus.status] }]}>
                  <Text style={[styles.markerLabelText, { color: BUS_COLOR[bus.status] }]}>
                    BUS {bus.id} · {bus.route}
                  </Text>
                </View>
              )}
              <View style={[styles.markerPin, { backgroundColor: BUS_COLOR[bus.status] }]}>
                <Ionicons name="bus" size={14} color={Colors.white} />
              </View>
            </View>
          </Marker>
        ))}
      </MapView>

      {/* ── Header Flotante (Sobre el mapa) ─────────────────────────────── */}
      <View style={styles.floatingHeader}>
        <View>
          <Text style={styles.headerTitle}>Monitoreo Global</Text>
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>EN VIVO</Text>
          </View>
        </View>
        <View style={styles.avatarCircle}>
          <Ionicons name="person" size={18} color={Colors.white} />
        </View>
      </View>

      {/* ── Panel Inferior Deslizable (Draggable Bottom Sheet) ─────────────── */}
      <GestureDetector gesture={gesture}>
        <Animated.View style={[styles.bottomSheet, animatedSheetStyle]}>
          
          {/* Handle bar (Barra gris) */}
          <View style={styles.handleContainer}>
            <View style={styles.handle} />
          </View>

          <Text style={styles.sheetTitle}>Resumen de Operación</Text>

          {/* Grid de 4 tarjetas con efecto degradado */}
          <View style={styles.grid}>
            <View style={styles.row}>
              <PressableStatCard 
                title="BUSES ACTIVOS" 
                value="24" 
                icon="bus" 
                color={Colors.primary}
                onPress={() => navigation.navigate('BusesActivos')} 
              />
              <PressableStatCard 
                title="RETRASOS" 
                value="03" 
                subtext="Requieren atención"
                icon="time" 
                color={Colors.warning}
                onPress={() => navigation.navigate('Retrasos')} 
              />
            </View>
            <View style={styles.row}>
              <PressableStatCard 
                title="ALERTAS CRÍTICAS" 
                value="01" 
                subtext="Ver detalles →"
                icon="warning" 
                color={Colors.danger}
                onPress={() => navigation.navigate('AlertasCriticas')} 
              />
              <PressableStatCard 
                title="RUTAS ACTIVAS" 
                value="05" 
                subtext="De 7 programadas" 
                icon="map" 
                color={Colors.accent}
                onPress={() => navigation.navigate('RutasActivas')} 
              />
            </View>
          </View>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

// ─── Estilos Corregidos ────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  
  // Header Flotante
  floatingHeader: {
    position: 'absolute',
    top: 55, left: 20, right: 20,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: 20, paddingVertical: 14,
    borderRadius: Radius.xl, 
    ...Shadow.md,
  },
  headerTitle: { fontSize: 18, fontWeight: '900', color: Colors.primary },
  liveBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.success },
  liveText: { fontSize: 10, fontWeight: '800', color: Colors.success, letterSpacing: 0.5 },
  avatarCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  
  // Marcadores de Mapa
  markerWrap: { alignItems: 'center' },
  markerLabel: {
    backgroundColor: Colors.white, borderRadius: Radius.sm, borderWidth: 1.5,
    paddingHorizontal: 8, paddingVertical: 3, marginBottom: 4, ...Shadow.sm,
  },
  markerLabelText: { fontSize: 10, fontWeight: '800' },
  markerPin: { width: 34, height: 34, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center', ...Shadow.sm, borderWidth: 2, borderColor: Colors.white },

  // Panel Deslizable (Asegúrate de que este nombre sea 'bottomSheet')
  bottomSheet: {
    position: 'absolute',
    left: 0, 
    right: 0,
    // Calculamos el bottom dinámicamente según la altura de la pantalla
    bottom: -(MAX_SHEET_HEIGHT - MIN_SHEET_HEIGHT), 
    height: MAX_SHEET_HEIGHT,
    backgroundColor: Colors.background,
    borderTopLeftRadius: 32, 
    borderTopRightRadius: 32,
    paddingHorizontal: Spacing.lg,
    ...Shadow.lg,
  },
  handleContainer: { alignItems: 'center', paddingVertical: 15, paddingBottom: 20 },
  handle: { width: 45, height: 5, backgroundColor: Colors.border, borderRadius: 3 },
  sheetTitle: { fontSize: 16, fontWeight: '800', color: Colors.textPrimary, marginBottom: 15, paddingHorizontal: 5 },
  
  // Grid de Tarjetas
  grid: { gap: 12 },
  row: { flexDirection: 'row', gap: 12 },
});