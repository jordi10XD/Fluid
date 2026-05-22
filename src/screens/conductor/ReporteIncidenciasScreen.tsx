import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { Colors, Spacing, Radius, Shadow } from '../../theme/colors';

interface ReporteIncidenciasProps {
  onClose: () => void;
  unidad: string;
  ruta: string;
  location?: Location.LocationObject | null;
}

export default function ReporteIncidenciasModal({ onClose, unidad, ruta, location }: ReporteIncidenciasProps) {
  const [tipo, setTipo] = useState('Desvío de Ruta');
  const [desc, setDesc] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const TIPOS = ['Desvío de Ruta', 'Accidente Vial', 'Falla Mecánica', 'Retraso por Tráfico', 'Otro'];

  return (
    <View style={styles.modalOverlay}>
      <View style={styles.modalContent}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color={Colors.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>REPORTE DE INCIDENCIA</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Unit info */}
          <View style={styles.unitBanner}>
            <View style={styles.unitDot} />
            <Text style={styles.unitText}>{unidad} · {ruta}</Text>
          </View>

          {/* Location */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>UBICACIÓN ACTUAL (GPS)</Text>
            <View style={styles.locationCard}>
              <Ionicons name="navigate" size={20} color={Colors.accent} />
              <View style={{ flex: 1 }}>
                <Text style={styles.locationMain}>Ubicación Actual</Text>
                <Text style={styles.locationSub}>
                  Lat: {location ? location.coords.latitude.toFixed(4) : '--'}, 
                  Lon: {location ? location.coords.longitude.toFixed(4) : '--'} 
                  · Vel: {location && location.coords.speed && location.coords.speed > 0 ? (location.coords.speed * 3.6).toFixed(1) : '0'} km/h
                </Text>
              </View>
              <View style={styles.liveIndicator}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>LIVE</Text>
              </View>
            </View>
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>DESCRIPCIÓN DETALLADA</Text>
            <TextInput
              style={styles.textArea}
              multiline
              numberOfLines={4}
              placeholder="Describe la situación actual en la vía..."
              placeholderTextColor={Colors.textMuted}
              value={desc}
              onChangeText={setDesc}
              textAlignVertical="top"
            />
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
              <Text style={styles.successDesc}>El centro de control ha sido notificado.</Text>
            </View>
          ) : (
            <TouchableOpacity style={styles.submitBtn} onPress={() => setSubmitted(true)}>
              <Ionicons name="send" size={18} color={Colors.white} />
              <Text style={styles.submitText}>Enviar Reporte</Text>
            </TouchableOpacity>
          )}
          <View style={{ height: 20 }} />
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl,
    height: '90%',
  },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.white, paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg, borderBottomWidth: 1, borderBottomColor: Colors.border,
    borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl,
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
    fontSize: 14, color: Colors.textPrimary, minHeight: 100, ...Shadow.sm,
    borderWidth: 1, borderColor: Colors.border,
  },
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
