import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, Shadow } from '../../theme/colors';

const HISTORY = [
  { title: 'Aviso de Mantenimiento Vía E35', desc: 'Se informa cierre parcial por obras en km 45...', audience: 'TODOS', time: 'HACE 12 MIN', status: 'ENTREGADO', statusColor: Colors.success },
  { title: 'Nueva Ruta: Guayaquil Exp...', desc: 'Descubre la nueva frecuencia directa sin...', audience: 'PASAJEROS', time: 'HACE 45 MIN', status: 'EN PROCESO', statusColor: Colors.warning },
  { title: 'Cambio de Turno: Sector Sur', desc: 'Sincronización de relevos para flota pesada...', audience: 'CONDUCTORES', time: 'AYER, 18:40', status: 'COMPLETADO', statusColor: Colors.textMuted },
];

const AUDIENCES = [
  { key: 'all', label: 'Todos los Usuarios', desc: 'Envío masivo global' },
  { key: 'passengers', label: 'Pasajeros en Ruta X', desc: 'Segmentado por viaje' },
  { key: 'drivers', label: 'Conductores', desc: 'Exclusivo operativo' },
];

export default function EmisorNotificacionesScreen() {
  const [audience, setAudience] = useState('all');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [sent, setSent] = useState(false);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />
      <View style={styles.header}>
        <TouchableOpacity>
          <Ionicons name="menu" size={26} color={Colors.white} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: Spacing.sm }}>
          <Text style={styles.headerSup}>PANEL DE CONTROL LOGÍSTICO</Text>
        </View>
      </View>

      <View style={styles.pageTitleRow}>
        <Text style={styles.moduleLabel}>» MÓDULO DE COMUNICACIONES</Text>
        <Text style={styles.pageTitle}>Emisor de Notificaciones Push (P16)</Text>
        <Text style={styles.pageDesc}>
          Gestione la comunicación en tiempo real con conductores y pasajeros. Los mensajes emitidos bajo este protocolo tienen prioridad alta.
        </Text>
      </View>

      {/* Compose card */}
      <View style={styles.composeCard}>
        <View style={styles.composeHeader}>
          <View style={styles.composeIconBox}>
            <Ionicons name="create-outline" size={18} color={Colors.primary} />
            <Text style={styles.composeTitle}>Redactar Mensaje</Text>
          </View>
          <View style={styles.secureBadge}>
            <Text style={styles.secureText}>MODO SEGURO{'\n'}ACTIVO</Text>
          </View>
        </View>

        <Text style={styles.sectionLabel}>SELECCIONAR AUDIENCIA</Text>
        {AUDIENCES.map((a) => (
          <TouchableOpacity
            key={a.key}
            style={[styles.audienceOption, audience === a.key && styles.audienceOptionActive]}
            onPress={() => setAudience(a.key)}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.audienceLabel}>{a.label}</Text>
              <Text style={styles.audienceDesc}>{a.desc}</Text>
            </View>
            {audience === a.key && (
              <Ionicons name="checkmark-circle" size={22} color={Colors.primary} />
            )}
          </TouchableOpacity>
        ))}

        <Text style={styles.sectionLabel}>TÍTULO DE LA NOTIFICACIÓN</Text>
        <TextInput
          style={styles.input}
          placeholder="Ej: Retraso en Ruta Norte"
          placeholderTextColor={Colors.textMuted}
          value={title}
          onChangeText={setTitle}
        />

        <Text style={styles.sectionLabel}>CUERPO DEL MENSAJE</Text>
        <TextInput
          style={styles.textArea}
          multiline
          numberOfLines={4}
          placeholder="Escriba aquí el contenido detallado del mensaje..."
          placeholderTextColor={Colors.textMuted}
          value={body}
          onChangeText={setBody}
          textAlignVertical="top"
        />

        <View style={styles.infoBanner}>
          <Ionicons name="information-circle-outline" size={16} color={Colors.accent} />
          <Text style={styles.infoText}>
            El mensaje será enviado inmediatamente tras validación del protocolo de seguridad técnica.
          </Text>
        </View>

        {sent ? (
          <View style={styles.successBanner}>
            <Ionicons name="checkmark-circle" size={24} color={Colors.success} />
            <Text style={styles.successText}>Notificación enviada correctamente</Text>
          </View>
        ) : (
          <TouchableOpacity style={styles.sendBtn} onPress={() => setSent(true)}>
            <Text style={styles.sendBtnText}>Enviar Notificación</Text>
            <Ionicons name="arrow-forward" size={18} color={Colors.white} />
          </TouchableOpacity>
        )}
      </View>

      {/* Metrics */}
      <View style={styles.metricsCard}>
        <Text style={styles.metricsLabel}>MÉTRICAS DE HOY</Text>
        <Text style={styles.metricsNum}>1,284 <Text style={styles.metricsUnit}>Impactos</Text></Text>
        <View style={styles.metricsRow}>
          {[['ENTREGADOS', '98.2%'], ['CLICKS', '14.5%']].map(([l, v]) => (
            <View key={l}>
              <Text style={styles.metricsItemLabel}>{l}</Text>
              <Text style={styles.metricsItemVal}>{v}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* History */}
      <View style={styles.historySection}>
        <View style={styles.historyHeader}>
          <Ionicons name="time-outline" size={18} color={Colors.textSecondary} />
          <Text style={styles.historyTitle}>Historial Reciente</Text>
        </View>
        {HISTORY.map((h, i) => (
          <View key={i} style={styles.historyItem}>
            <View style={styles.historyItemHeader}>
              <Text style={styles.historyItemTitle}>{h.title}</Text>
              <View style={[styles.historyBadge, { backgroundColor: h.statusColor + '20' }]}>
                <Text style={[styles.historyBadgeText, { color: h.statusColor }]}>{h.status}</Text>
              </View>
            </View>
            <Text style={styles.historyDesc}>{h.desc}</Text>
            <View style={styles.historyMeta}>
              <Ionicons name="people-outline" size={12} color={Colors.textMuted} />
              <Text style={styles.historyMetaText}>{h.audience}</Text>
              <Ionicons name="time-outline" size={12} color={Colors.textMuted} />
              <Text style={styles.historyMetaText}>{h.time}</Text>
            </View>
          </View>
        ))}
        <TouchableOpacity style={styles.viewAll}>
          <Text style={styles.viewAllText}>VER HISTORIAL COMPLETO</Text>
        </TouchableOpacity>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.footerStatus}>
          <View style={styles.statusDot} />
          <Text style={styles.footerText}>CORE API V8.1 ONLINE</Text>
        </View>
        <View style={styles.footerStatus}>
          <Ionicons name="lock-closed-outline" size={12} color={Colors.textMuted} />
          <Text style={styles.footerText}>ENCRIPTACIÓN AES-256</Text>
        </View>
      </View>
      <View style={{ height: 80 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.primary, paddingTop: 52, paddingBottom: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  headerSup: { fontSize: 11, color: 'rgba(255,255,255,0.6)', fontWeight: '700', letterSpacing: 0.5 },
  pageTitleRow: { padding: Spacing.lg },
  moduleLabel: { fontSize: 11, color: Colors.accent, fontWeight: '700', letterSpacing: 0.5, marginBottom: 6 },
  pageTitle: { fontSize: 22, fontWeight: '900', color: Colors.textPrimary, marginBottom: 8, lineHeight: 28 },
  pageDesc: { fontSize: 13, color: Colors.textSecondary, lineHeight: 18 },
  composeCard: { marginHorizontal: Spacing.lg, backgroundColor: Colors.white, borderRadius: Radius.xl, padding: Spacing.md, ...Shadow.sm, marginBottom: Spacing.md },
  composeHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: Spacing.md },
  composeIconBox: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  composeTitle: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  secureBadge: { backgroundColor: Colors.borderLight, borderRadius: Radius.sm, padding: 6, alignItems: 'center' },
  secureText: { fontSize: 9, fontWeight: '700', color: Colors.textSecondary, letterSpacing: 0.5, textAlign: 'center' },
  sectionLabel: { fontSize: 10, fontWeight: '700', color: Colors.textSecondary, letterSpacing: 1, marginBottom: 8, marginTop: Spacing.md },
  audienceOption: { borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, padding: Spacing.md, flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  audienceOptionActive: { borderColor: Colors.primary, backgroundColor: '#EEF2FF' },
  audienceLabel: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  audienceDesc: { fontSize: 12, color: Colors.textMuted },
  input: { backgroundColor: Colors.background, borderRadius: Radius.md, padding: Spacing.md, fontSize: 14, color: Colors.textPrimary, borderWidth: 1, borderColor: Colors.border, marginBottom: Spacing.sm },
  textArea: { backgroundColor: Colors.background, borderRadius: Radius.md, padding: Spacing.md, fontSize: 14, color: Colors.textPrimary, minHeight: 100, borderWidth: 1, borderColor: Colors.border, marginBottom: Spacing.md },
  infoBanner: { flexDirection: 'row', gap: 8, backgroundColor: '#EFF9FC', borderRadius: Radius.md, padding: Spacing.sm, marginBottom: Spacing.md },
  infoText: { flex: 1, fontSize: 12, color: Colors.textSecondary, lineHeight: 16 },
  sendBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Colors.primary, borderRadius: Radius.md, padding: 14 },
  sendBtnText: { color: Colors.white, fontSize: 15, fontWeight: '700' },
  successBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#DCFCE7', borderRadius: Radius.md, padding: 14, justifyContent: 'center' },
  successText: { color: Colors.success, fontSize: 14, fontWeight: '700' },
  metricsCard: { marginHorizontal: Spacing.lg, backgroundColor: Colors.primary, borderRadius: Radius.xl, padding: Spacing.lg, marginBottom: Spacing.md },
  metricsLabel: { fontSize: 10, color: 'rgba(255,255,255,0.6)', fontWeight: '700', letterSpacing: 1, marginBottom: 8 },
  metricsNum: { fontSize: 36, fontWeight: '900', color: Colors.white, marginBottom: Spacing.md },
  metricsUnit: { fontSize: 16, fontWeight: '400' },
  metricsRow: { flexDirection: 'row', gap: Spacing.xl },
  metricsItemLabel: { fontSize: 10, color: 'rgba(255,255,255,0.6)', fontWeight: '600', letterSpacing: 0.5, marginBottom: 2 },
  metricsItemVal: { fontSize: 18, fontWeight: '800', color: Colors.white },
  historySection: { padding: Spacing.lg },
  historyHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: Spacing.md },
  historyTitle: { fontSize: 18, fontWeight: '800', color: Colors.textPrimary },
  historyItem: { borderBottomWidth: 1, borderBottomColor: Colors.border, paddingVertical: Spacing.md },
  historyItemHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 4 },
  historyItemTitle: { flex: 1, fontSize: 14, fontWeight: '700', color: Colors.textPrimary, marginRight: 8 },
  historyBadge: { borderRadius: Radius.sm, paddingHorizontal: 8, paddingVertical: 3 },
  historyBadgeText: { fontSize: 11, fontWeight: '700' },
  historyDesc: { fontSize: 13, color: Colors.textSecondary, marginBottom: 6 },
  historyMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  historyMetaText: { fontSize: 11, color: Colors.textMuted },
  viewAll: { paddingTop: Spacing.md, alignItems: 'center' },
  viewAllText: { fontSize: 13, fontWeight: '700', color: Colors.primary, letterSpacing: 0.5 },
  footer: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.border },
  footerStatus: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.success },
  footerText: { fontSize: 10, color: Colors.textMuted, fontWeight: '600', letterSpacing: 0.3 },
});
