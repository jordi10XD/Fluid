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
              placeholder="Ej: Quito"
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
              placeholder="Ej: Guayaquil"
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
          onPress={() => {
            navigation.navigate('ResultadosHorarios', {
              origen: origen.trim(),
              destino: destino.trim(),
              fecha: fecha
            });
          }}
        >
          <Ionicons name="search" size={18} color={Colors.white} />
          <Text style={styles.searchBtnText}>Buscar Rutas</Text>
        </TouchableOpacity>
      </View>

      {/* Info banner */}
      <View style={styles.infoBanner}>
        <Ionicons name="information-circle-outline" size={18} color={Colors.primary} />
        <Text style={styles.infoText}>
          Ingrese el origen y destino para consultar los horarios disponibles, el estado de las unidades en ruta y la telemetría cinética en tiempo real.
        </Text>
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
