import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, Shadow } from '../../theme/colors';

export default function ReporteIncidenciasScreen({ navigation }: any) {
  const [tipo, setTipo] = useState('Desvío de Ruta');
  const [desc, setDesc] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const TIPOS = ['Desvío de Ruta', 'Accidente Vial', 'Falla Mecánica', 'Retraso por Tráfico', 'Otro'];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>REPORTE DE INCIDENCIA</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Unit info */}
      <View style={styles.unitBanner}>
        <View style={styles.unitDot} />
        <Text style={styles.unitText}>UNIDAD BUS-402 · RUTA QTO—GYE · RF-G04 ACTIVO</Text>
      </View>

      {/* Type selector */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>TIPO DE INCIDENCIA</Text>
        <View style={styles.chipGrid}>
          {TIPOS.map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.typeChip, tipo === t && styles.typeChipActive]}
              onPress={() => setTipo(t)}
            >
              <Text style={[styles.typeChipText, tipo === t && styles.typeChipTextActive]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Description */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>DESCRIPCIÓN DETALLADA</Text>
        <TextInput
          style={styles.textArea}
          multiline
          numberOfLines={5}
          placeholder="Describe la situación actual en la vía..."
          placeholderTextColor={Colors.textMuted}
          value={desc}
          onChangeText={setDesc}
          textAlignVertical="top"
        />
      </View>

      {/* Location */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>UBICACIÓN ACTUAL (GPS)</Text>
        <View style={styles.locationCard}>
          <Ionicons name="navigate" size={20} color={Colors.accent} />
          <View style={{ flex: 1 }}>
            <Text style={styles.locationMain}>Km 45, Autopista E35</Text>
            <Text style={styles.locationSub}>Lat: -0.2295, Lon: -78.5243 · Precision 1.2m</Text>
          </View>
          <View style={styles.liveIndicator}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LIVE</Text>
          </View>
        </View>
      </View>

      {/* Severity */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>NIVEL DE SEVERIDAD</Text>
        <View style={styles.severityRow}>
          {[
            { label: 'Leve', color: Colors.success },
            { label: 'Moderado', color: Colors.warning },
            { label: 'Crítico', color: Colors.danger },
          ].map((s) => (
            <TouchableOpacity key={s.label} style={[styles.severityBtn, { borderColor: s.color }]}>
              <View style={[styles.severityDot, { backgroundColor: s.color }]} />
              <Text style={[styles.severityText, { color: s.color }]}>{s.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {submitted ? (
        <View style={styles.successBanner}>
          <Ionicons name="checkmark-circle" size={32} color={Colors.success} />
          <Text style={styles.successTitle}>Reporte Enviado</Text>
          <Text style={styles.successDesc}>El centro de control ha sido notificado. RF-G04 activo.</Text>
        </View>
      ) : (
        <TouchableOpacity style={styles.submitBtn} onPress={() => setSubmitted(true)}>
          <Ionicons name="send" size={18} color={Colors.white} />
          <Text style={styles.submitText}>Enviar Reporte al Control</Text>
        </TouchableOpacity>
      )}
      <View style={{ height: 80 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.white, paddingTop: 52, paddingBottom: Spacing.md,
    paddingHorizontal: Spacing.lg, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  headerTitle: { fontSize: 15, fontWeight: '800', color: Colors.primary, letterSpacing: 0.5 },
  unitBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.primary, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm,
  },
  unitDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.success },
  unitText: { fontSize: 11, color: Colors.white, fontWeight: '600', letterSpacing: 0.5 },
  section: { padding: Spacing.lg },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: Colors.textSecondary, letterSpacing: 1, marginBottom: 10 },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typeChip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: Radius.full,
    backgroundColor: Colors.white, borderWidth: 1.5, borderColor: Colors.border,
  },
  typeChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  typeChipText: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  typeChipTextActive: { color: Colors.white },
  textArea: {
    backgroundColor: Colors.white, borderRadius: Radius.lg, padding: Spacing.md,
    fontSize: 14, color: Colors.textPrimary, minHeight: 120, ...Shadow.sm,
    borderWidth: 1, borderColor: Colors.border,
  },
  locationCard: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.white, borderRadius: Radius.lg, padding: Spacing.md, ...Shadow.sm,
  },
  locationMain: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary, marginBottom: 2 },
  locationSub: { fontSize: 11, color: Colors.textMuted },
  liveIndicator: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.success },
  liveText: { fontSize: 10, fontWeight: '800', color: Colors.success },
  severityRow: { flexDirection: 'row', gap: Spacing.sm },
  severityBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 12, borderRadius: Radius.md, borderWidth: 1.5, backgroundColor: Colors.white,
  },
  severityDot: { width: 8, height: 8, borderRadius: 4 },
  severityText: { fontSize: 13, fontWeight: '700' },
  submitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.primary, marginHorizontal: Spacing.lg, borderRadius: Radius.md,
    padding: 18, ...Shadow.md,
  },
  submitText: { color: Colors.white, fontSize: 16, fontWeight: '700' },
  successBanner: {
    alignItems: 'center', marginHorizontal: Spacing.lg, backgroundColor: '#DCFCE7',
    borderRadius: Radius.xl, padding: Spacing.xl,
  },
  successTitle: { fontSize: 20, fontWeight: '800', color: Colors.success, marginTop: 8 },
  successDesc: { fontSize: 13, color: Colors.textSecondary, textAlign: 'center', marginTop: 4 },
});
