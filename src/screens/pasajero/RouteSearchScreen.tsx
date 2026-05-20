import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, StatusBar, ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, Shadow } from '../../theme/colors';
import { supabase } from '../../lib/supabase';

export default function RouteSearchScreen({ navigation }: any) {
  const [origen, setOrigen] = useState('');
  const [destino, setDestino] = useState('');
  const [fecha] = useState(new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' }));
  const [filtro, setFiltro] = useState('Siguientes Salidas');
  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    handleSearch();
  }, []);

  const handleSearch = async () => {
    setLoading(true);
    let routeQuery = supabase.from('routes').select('id');
    
    if (origen.trim()) routeQuery = routeQuery.ilike('origen', `%${origen.trim()}%`);
    if (destino.trim()) routeQuery = routeQuery.ilike('destino', `%${destino.trim()}%`);
    
    const { data: routeData } = await routeQuery;
    const routeIds = routeData ? routeData.map(r => r.id) : [];

    if (routeIds.length === 0 && (origen.trim() || destino.trim())) {
      setTrips([]);
      setLoading(false);
      return;
    }

    let tripQuery = supabase.from('trips')
      .select(`
        id, departure_time, estimated_arrival, status,
        routes ( nombre, origen, destino, tiempo_min ),
        buses ( internal_number, plate_number )
      `);
      
    if (routeIds.length > 0) {
      tripQuery = tripQuery.in('route_id', routeIds);
    }
    
    const { data: tripData } = await tripQuery.order('departure_time', { ascending: true });
    if (tripData) setTrips(tripData);
    setLoading(false);
  };

  const swap = () => {
    const tmp = origen;
    setOrigen(destino);
    setDestino(tmp);
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      <View style={styles.searchHeader}>
        <View style={styles.logoRow}>
          <Ionicons name="bus" size={20} color={Colors.primary} />
          <Text style={styles.logoText}>Logística Fluida</Text>
        </View>
        {/* Origin */}
        <View style={styles.inputCard}>
          <Text style={styles.inputLabel}>ORIGEN</Text>
          <View style={styles.inputRow}>
            <Ionicons name="location" size={18} color={Colors.primary} />
            <TextInput
              style={styles.input}
              value={origen}
              onChangeText={setOrigen}
              placeholderTextColor={Colors.textMuted}
            />
          </View>
        </View>
        {/* Swap */}
        <TouchableOpacity style={styles.swapBtn} onPress={swap}>
          <Ionicons name="swap-horizontal" size={20} color={Colors.textSecondary} />
        </TouchableOpacity>
        {/* Destination */}
        <View style={styles.inputCard}>
          <Text style={styles.inputLabel}>DESTINO</Text>
          <View style={styles.inputRow}>
            <Ionicons name="flag" size={18} color={Colors.textSecondary} />
            <TextInput
              style={styles.input}
              value={destino}
              onChangeText={setDestino}
              placeholderTextColor={Colors.textMuted}
            />
          </View>
        </View>
        {/* Date */}
        <View style={styles.inputCard}>
          <Text style={styles.inputLabel}>FECHA</Text>
          <View style={styles.inputRow}>
            <Ionicons name="calendar-outline" size={18} color={Colors.textSecondary} />
            <Text style={styles.inputText}>{fecha}</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.searchBtn}
          onPress={handleSearch}
        >
          <Ionicons name="search" size={18} color={Colors.white} />
          <Text style={styles.searchBtnText}>Buscar Rutas</Text>
        </TouchableOpacity>
      </View>

      {/* Results */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>VIAJES ACTIVOS Y PROGRAMADOS</Text>
        {loading ? (
          <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 20 }} />
        ) : trips.length === 0 ? (
          <View style={{ alignItems: 'center', padding: 20 }}>
            <Ionicons name="bus-outline" size={40} color={Colors.textMuted} />
            <Text style={{ marginTop: 10, color: Colors.textSecondary, fontWeight: '600' }}>No se encontraron viajes</Text>
          </View>
        ) : (
          trips.map((s, i) => {
            const isActivo = s.status === 'en_route';
            const salida = s.departure_time ? new Date(s.departure_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--';
            const llegada = s.estimated_arrival ? new Date(s.estimated_arrival).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--';
            const duracion = s.routes?.tiempo_min ? `${Math.floor(s.routes.tiempo_min / 60)}h ${s.routes.tiempo_min % 60}m` : '--';
            const empresa = s.routes?.nombre || 'Ruta Desconocida';
            const bus = s.buses?.internal_number || s.buses?.plate_number || 'N/A';

            return (
              <View key={s.id} style={styles.scheduleCard}>
                {/* Status indicator */}
                <View style={styles.statusRow}>
                  <View style={[styles.statusDot, { backgroundColor: isActivo ? Colors.success : Colors.textMuted }]} />
                  <Text style={[styles.statusText, { color: isActivo ? Colors.success : Colors.textMuted }]}>
                    {isActivo ? 'EN RUTA · EN VIVO' : s.status === 'scheduled' ? 'PROGRAMADO' : s.status.toUpperCase()}
                  </Text>
                  <View style={styles.busBadge}>
                    <Ionicons name="bus-outline" size={11} color={Colors.textSecondary} />
                    <Text style={styles.busBadgeText}>UNIDAD {bus}</Text>
                  </View>
                </View>

                {/* Times */}
                <View style={styles.timeRow}>
                  <View>
                    <Text style={styles.timeMain}>{salida}</Text>
                    <Text style={styles.timeTag}>SALIDA</Text>
                  </View>
                  <View style={styles.durationPill}>
                    <Ionicons name="time-outline" size={14} color={Colors.textSecondary} />
                    <Text style={styles.durationText}>{duracion}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.timeMain}>{llegada}</Text>
                    <Text style={styles.timeTag}>LLEGADA EST.</Text>
                  </View>
                </View>

                <Text style={styles.empresaName}>{empresa}</Text>

                {/* Subscribe action */}
                <TouchableOpacity
                  style={[styles.subscribeBtn, !isActivo && styles.subscribeBtnDisabled]}
                  disabled={!isActivo}
                >
                  <Ionicons
                    name={isActivo ? 'location' : 'lock-closed-outline'}
                    size={16}
                    color={isActivo ? Colors.white : Colors.textMuted}
                  />
                  <Text style={[styles.subscribeBtnText, !isActivo && styles.subscribeBtnTextDisabled]}>
                    {isActivo ? 'Seguir Viaje en Tiempo Real' : 'Viaje no iniciado'}
                  </Text>
                </TouchableOpacity>
              </View>
            );
          })
        )}
      </View>
      <View style={{ height: 80 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  searchHeader: { backgroundColor: Colors.white, padding: Spacing.lg, ...Shadow.sm },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: Spacing.md },
  logoText: { fontSize: 17, fontWeight: '700', color: Colors.primary },
  inputCard: {
    borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.sm,
  },
  inputLabel: { fontSize: 10, fontWeight: '700', color: Colors.textSecondary, letterSpacing: 1, marginBottom: 6 },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  input: { flex: 1, fontSize: 16, fontWeight: '600', color: Colors.textPrimary },
  inputText: { flex: 1, fontSize: 16, fontWeight: '600', color: Colors.textPrimary },
  swapBtn: {
    alignSelf: 'center', width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.border, marginVertical: -4, zIndex: 1,
  },
  searchBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.primary, borderRadius: Radius.md, padding: 16, marginTop: Spacing.sm,
  },
  searchBtnText: { color: Colors.white, fontSize: 16, fontWeight: '700' },
  section: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: Colors.textSecondary, letterSpacing: 1, marginBottom: 10 },
  scheduleCard: {
    backgroundColor: Colors.white, borderRadius: Radius.lg, padding: Spacing.md,
    marginBottom: Spacing.md, ...Shadow.sm,
  },
  timeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  timeMain: { fontSize: 24, fontWeight: '800', color: Colors.textPrimary },
  timeTag: { fontSize: 10, color: Colors.textMuted, fontWeight: '600', letterSpacing: 0.5 },
  durationPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.background, paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.full,
  },
  durationText: { fontSize: 12, color: Colors.textSecondary },
  empresaName: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary, marginBottom: 6 },
  lowAvailBadge: {
    backgroundColor: '#FEF3C7', borderRadius: Radius.sm, paddingHorizontal: 8, paddingVertical: 3,
    alignSelf: 'flex-start', marginBottom: 6,
  },
  lowAvailText: { fontSize: 10, color: Colors.warning, fontWeight: '700', letterSpacing: 0.5 },
  infoBanner: {
    flexDirection: 'row', gap: 10, backgroundColor: '#EFF9FC', borderRadius: Radius.lg,
    padding: Spacing.md, marginHorizontal: Spacing.lg, marginTop: Spacing.md,
    borderWidth: 1, borderColor: Colors.accentLight,
  },
  infoText: { flex: 1, fontSize: 13, color: Colors.textSecondary, lineHeight: 18 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: Spacing.sm },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { flex: 1, fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  busBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.background, borderRadius: Radius.full,
    paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: Colors.border,
  },
  busBadgeText: { fontSize: 11, fontWeight: '600', color: Colors.textSecondary },
  subscribeBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.primary, borderRadius: Radius.md, padding: 14, marginTop: Spacing.sm,
  },
  subscribeBtnDisabled: { backgroundColor: Colors.borderLight },
  subscribeBtnText: { color: Colors.white, fontSize: 14, fontWeight: '700' },
  subscribeBtnTextDisabled: { color: Colors.textMuted },
});
