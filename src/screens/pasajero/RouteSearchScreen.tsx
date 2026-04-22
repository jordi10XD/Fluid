import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, Shadow } from '../../theme/colors';

const ORIGENES = ['Terminal Quitumbe', 'Terminal Terrestre GYE', 'Terminal Guamaní', 'Terminal Norte'];
const DESTINOS = ['Terminal Pascuales', 'Terminal Central Cuenca', 'Manta Terminal', 'Baños de Agua Santa'];

export default function RouteSearchScreen({ navigation }: any) {
  const [origen, setOrigen] = useState('Terminal Central');
  const [destino, setDestino] = useState('Centro Costa Norte');
  const [fecha] = useState('Lunes, 24 Oct 2024');
  const [filtro, setFiltro] = useState('Siguientes Salidas');

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
          onPress={() => navigation.navigate('ResultadosHorarios')}
        >
          <Ionicons name="search" size={18} color={Colors.white} />
          <Text style={styles.searchBtnText}>Buscar Rutas</Text>
        </TouchableOpacity>
      </View>

      {/* Recents */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>BÚSQUEDAS RECIENTES</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {['Terminal Central → Costa Norte', 'Estadio → Quitumbe', 'Guayaquil → Cuenca'].map((r, i) => (
            <View key={i} style={styles.recentChip}>
              <Ionicons name="time-outline" size={14} color={Colors.textSecondary} />
              <Text style={styles.recentText}>{r}</Text>
            </View>
          ))}
        </ScrollView>
      </View>

      {/* Filter tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
        {['Siguientes Salidas', 'Madrugada', 'Tarde', 'Noche'].map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterChip, filtro === f && styles.filterChipActive]}
            onPress={() => setFiltro(f)}
          >
            <Text style={[styles.filterText, filtro === f && styles.filterTextActive]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Info banner */}
      <View style={styles.infoBanner}>
        <Ionicons name="information-circle-outline" size={18} color={Colors.accent} />
        <Text style={styles.infoText}>
          <Text style={{ fontWeight: '700' }}>Modo Suscriptor: </Text>
          Suscríbete a un viaje para ver la posición del bus en tiempo real. Ideal para familiares o personas esperando a alguien en la terminal.
        </Text>
      </View>

      {/* Results */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>VIAJES ACTIVOS</Text>
        {SCHEDULES.map((s, i) => (
          <View key={i} style={styles.scheduleCard}>
            {/* Status indicator */}
            <View style={styles.statusRow}>
              <View style={[styles.statusDot, { backgroundColor: s.activo ? Colors.success : Colors.textMuted }]} />
              <Text style={[styles.statusText, { color: s.activo ? Colors.success : Colors.textMuted }]}>
                {s.activo ? 'EN RUTA · EN VIVO' : 'AÚN NO INICIA'}
              </Text>
              <View style={styles.busBadge}>
                <Ionicons name="bus-outline" size={11} color={Colors.textSecondary} />
                <Text style={styles.busBadgeText}>{s.bus}</Text>
              </View>
            </View>

            {/* Times */}
            <View style={styles.timeRow}>
              <View>
                <Text style={styles.timeMain}>{s.salida}</Text>
                <Text style={styles.timeTag}>SALIDA</Text>
              </View>
              <View style={styles.durationPill}>
                <Ionicons name="time-outline" size={14} color={Colors.textSecondary} />
                <Text style={styles.durationText}>{s.duracion}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.timeMain}>{s.llegada}</Text>
                <Text style={styles.timeTag}>LLEGADA EST.</Text>
              </View>
            </View>

            <Text style={styles.empresaName}>{s.empresa}</Text>

            {/* Subscribe action */}
            <TouchableOpacity
              style={[styles.subscribeBtn, !s.activo && styles.subscribeBtnDisabled]}
              disabled={!s.activo}
            >
              <Ionicons
                name={s.activo ? 'location' : 'lock-closed-outline'}
                size={16}
                color={s.activo ? Colors.white : Colors.textMuted}
              />
              <Text style={[styles.subscribeBtnText, !s.activo && styles.subscribeBtnTextDisabled]}>
                {s.activo ? 'Seguir Viaje en Tiempo Real' : 'Viaje no iniciado'}
              </Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>
      <View style={{ height: 80 }} />
    </ScrollView>
  );
}

const SCHEDULES = [
  { salida: '08:30', llegada: '12:15', duracion: '3h 45m', empresa: 'SwiftPath Express', bus: 'BUS-402', activo: true },
  { salida: '09:15', llegada: '13:25', duracion: '4h 10m', empresa: 'Logística Horizonte Azul', bus: 'BUS-115', activo: false },
  { salida: '10:45', llegada: '14:40', duracion: '3h 55m', empresa: 'Urban Flow Coaches', bus: 'BUS-088', activo: true },
];

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
  filterRow: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
  filterChip: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: Radius.full,
    backgroundColor: Colors.white, marginRight: 8, borderWidth: 1, borderColor: Colors.border,
  },
  filterChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterText: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  filterTextActive: { color: Colors.white },
  recentChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.white,
    borderRadius: Radius.full, paddingHorizontal: 12, paddingVertical: 8,
    marginRight: 8, borderWidth: 1, borderColor: Colors.border,
  },
  recentText: { fontSize: 12, color: Colors.textSecondary },
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
