import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar,
  TextInput, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, Shadow } from '../../theme/colors';

import { supabase } from '../../lib/supabase';

// ─── Types ────────────────────────────────────────────────────────────────────
type AudienceKey = 'all' | 'passengers' | 'drivers';
type NotifStatus = 'ENTREGADO' | 'EN PROCESO' | 'COMPLETADO';

interface HistoryItem {
  id: string; title: string; desc: string;
  audience: string; time: string; status: NotifStatus;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const TITLE_LIMIT = 60;
const BODY_LIMIT  = 280;

const AUDIENCES: { key: AudienceKey; label: string; desc: string; icon: any }[] = [
  { key: 'all',        label: 'Todos los Usuarios',    desc: 'Envío masivo global',      icon: 'people-outline' },
  { key: 'passengers', label: 'Pasajeros en Ruta',     desc: 'Segmentado por viaje',     icon: 'person-outline' },
  { key: 'drivers',    label: 'Solo Conductores',       desc: 'Exclusivo operativo',      icon: 'bus-outline' },
];

const STATUS_COLOR: Record<NotifStatus, string> = {
  'ENTREGADO':  Colors.success,
  'EN PROCESO': Colors.warning,
  'COMPLETADO': Colors.textMuted,
};

const INITIAL_HISTORY: HistoryItem[] = [
  { id: 'n1', title: 'Aviso de Mantenimiento Vía E35',  desc: 'Cierre parcial por obras en km 45...', audience: 'TODOS',        time: 'HACE 12 MIN', status: 'ENTREGADO' },
  { id: 'n2', title: 'Nueva Ruta: Guayaquil Express',   desc: 'Nueva frecuencia directa sin paradas...', audience: 'PASAJEROS',    time: 'HACE 45 MIN', status: 'EN PROCESO' },
  { id: 'n3', title: 'Cambio de Turno: Sector Sur',     desc: 'Sincronización de relevos para flota...', audience: 'CONDUCTORES', time: 'AYER, 18:40', status: 'COMPLETADO' },
];

const AUDIENCE_LABEL: Record<AudienceKey, string> = {
  all: 'TODOS', passengers: 'PASAJEROS', drivers: 'CONDUCTORES',
};

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function EmisorNotificacionesScreen() {
  const [audience, setAudience]   = useState<AudienceKey>('all');
  const [title,    setTitle]      = useState('');
  const [body,     setBody]       = useState('');
  const [history,  setHistory]    = useState<HistoryItem[]>(INITIAL_HISTORY);

  // send state: 'idle' | 'sending' | 'sent'
  const [sendState, setSendState] = useState<'idle' | 'sending' | 'sent'>('idle');

  const titleOk = title.trim().length >= 3;
  const bodyOk  = body.trim().length  >= 10;
  const canSend = titleOk && bodyOk && sendState === 'idle';

  /**
   * Envía la notificación a través de la Edge Function 'send-notification',
   * que retransmite a OneSignal REST API.
   */
  const handleSend = async () => {
    if (!canSend) {
      Alert.alert('Campos requeridos', 'El título (mín. 3 chars) y el mensaje (mín. 10 chars) son obligatorios.');
      return;
    }
    setSendState('sending');

    try {
      const { data, error } = await supabase.functions.invoke('send-notification', {
        body: {
          title: title.trim(),
          message: body.trim(),
          audience,
        },
      });

      if (error) throw error;

      const newEntry: HistoryItem = {
        id:       `n${Date.now()}`,
        title:    title.trim(),
        desc:     body.trim().slice(0, 60) + (body.length > 60 ? '...' : ''),
        audience: AUDIENCE_LABEL[audience],
        time:     'AHORA',
        status:   'ENTREGADO',
      };
      setHistory(prev => [newEntry, ...prev]);
      setSendState('sent');
    } catch (err: any) {
      console.error('Error enviando notificación:', err);
      Alert.alert('Error', err.message || 'No se pudo enviar la notificación.');
      setSendState('idle');
    }
  };

  /**
   * FIX: en el original, una vez que `sent = true` no había forma de
   * limpiar el formulario y enviar otra notificación. Ahora "Enviar Otro"
   * resetea correctamente todos los campos.
   */
  const handleReset = () => {
    setTitle(''); setBody(''); setAudience('all'); setSendState('idle');
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerSup}>PANEL DE CONTROL LOGÍSTICO</Text>
          <Text style={styles.pageTitle}>Emisor de Notificaciones</Text>
          <Text style={styles.pageDesc}>Protocolo P16 — prioridad alta garantizada</Text>
        </View>
        <View style={styles.secureBadge}>
          <Ionicons name="lock-closed" size={11} color={Colors.success} />
          <Text style={styles.secureText}>AES-256</Text>
        </View>
      </View>

      {/* ── Module label ─────────────────────────────────────────────── */}
      <View style={styles.moduleLabelRow}>
        <View style={styles.moduleAccent} />
        <Text style={styles.moduleLabel}>MÓDULO DE COMUNICACIONES</Text>
      </View>

      {/* ── Compose card ─────────────────────────────────────────────── */}
      <View style={styles.composeCard}>
        <View style={styles.composeHeader}>
          <Ionicons name="create-outline" size={20} color={Colors.primary} />
          <Text style={styles.composeTitle}>Redactar Mensaje</Text>
        </View>

        {/* Audience selector */}
        <Text style={styles.sectionLabel}>AUDIENCIA</Text>
        {AUDIENCES.map((a) => (
          <TouchableOpacity
            key={a.key}
            style={[styles.audienceOption, audience === a.key && styles.audienceActive]}
            onPress={() => setAudience(a.key)}
            disabled={sendState !== 'idle'}
          >
            <View style={[styles.audienceIcon, { backgroundColor: audience === a.key ? Colors.primary : Colors.borderLight }]}>
              <Ionicons name={a.icon} size={14} color={audience === a.key ? Colors.white : Colors.textMuted} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.audienceLabel, audience === a.key && { color: Colors.primary }]}>{a.label}</Text>
              <Text style={styles.audienceDesc}>{a.desc}</Text>
            </View>
            {audience === a.key && <Ionicons name="checkmark-circle" size={20} color={Colors.primary} />}
          </TouchableOpacity>
        ))}

        {/* Title field */}
        <View style={styles.fieldHeader}>
          <Text style={styles.sectionLabel}>TÍTULO</Text>
          <Text style={[styles.charCount, title.length > TITLE_LIMIT * 0.9 && { color: Colors.danger }]}>
            {title.length}/{TITLE_LIMIT}
          </Text>
        </View>
        <TextInput
          style={[styles.input, sendState !== 'idle' && styles.inputDisabled]}
          placeholder="Ej: Retraso en Ruta Norte"
          placeholderTextColor={Colors.textMuted}
          value={title}
          onChangeText={t => setTitle(t.slice(0, TITLE_LIMIT))}
          editable={sendState === 'idle'}
        />

        {/* Body field */}
        <View style={styles.fieldHeader}>
          <Text style={styles.sectionLabel}>MENSAJE</Text>
          <Text style={[styles.charCount, body.length > BODY_LIMIT * 0.9 && { color: Colors.danger }]}>
            {body.length}/{BODY_LIMIT}
          </Text>
        </View>
        <TextInput
          style={[styles.textArea, sendState !== 'idle' && styles.inputDisabled]}
          multiline
          numberOfLines={4}
          placeholder="Escriba aquí el contenido detallado del mensaje..."
          placeholderTextColor={Colors.textMuted}
          value={body}
          onChangeText={t => setBody(t.slice(0, BODY_LIMIT))}
          textAlignVertical="top"
          editable={sendState === 'idle'}
        />

        {/* Info banner */}
        <View style={styles.infoBanner}>
          <Ionicons name="information-circle-outline" size={15} color={Colors.accent} />
          <Text style={styles.infoText}>
            El mensaje será validado y enviado con prioridad alta a través del protocolo P16.
          </Text>
        </View>

        {/* CTA */}
        {sendState === 'sent' ? (
          <View>
            <View style={styles.successBanner}>
              <Ionicons name="checkmark-circle" size={22} color={Colors.success} />
              <Text style={styles.successText}>Notificación enviada correctamente</Text>
            </View>
            <TouchableOpacity style={styles.resetBtn} onPress={handleReset}>
              <Ionicons name="refresh-outline" size={16} color={Colors.primary} />
              <Text style={styles.resetBtnText}>Enviar Otra Notificación</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.sendBtn, !canSend && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={!canSend}
          >
            {sendState === 'sending' ? (
              <Text style={styles.sendBtnText}>Enviando...</Text>
            ) : (
              <>
                <Text style={styles.sendBtnText}>Enviar Notificación</Text>
                <Ionicons name="arrow-forward" size={18} color={Colors.white} />
              </>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* ── Metrics ──────────────────────────────────────────────────── */}
      <View style={styles.metricsCard}>
        <Text style={styles.metricsLabel}>MÉTRICAS DE HOY</Text>
        <Text style={styles.metricsNum}>
          1,284 <Text style={styles.metricsUnit}>impactos</Text>
        </Text>
        <View style={styles.metricsRow}>
          {[['ENTREGADOS', '98.2%', Colors.success], ['CLICKS', '14.5%', Colors.accentLight]].map(([l, v, c]) => (
            <View key={l} style={styles.metricsItem}>
              <Text style={styles.metricsItemLabel}>{l}</Text>
              <Text style={[styles.metricsItemVal, { color: c as string }]}>{v}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* ── History ──────────────────────────────────────────────────── */}
      <View style={styles.historySection}>
        <View style={styles.historyHeader}>
          <Ionicons name="time-outline" size={18} color={Colors.textSecondary} />
          <Text style={styles.historyTitle}>Historial Reciente</Text>
        </View>
        {history.map((h) => (
          <View key={h.id} style={styles.historyItem}>
            <View style={styles.historyTop}>
              <Text style={styles.historyItemTitle} numberOfLines={1}>{h.title}</Text>
              <View style={[styles.historyBadge, { backgroundColor: STATUS_COLOR[h.status] + '20' }]}>
                <Text style={[styles.historyBadgeText, { color: STATUS_COLOR[h.status] }]}>{h.status}</Text>
              </View>
            </View>
            <Text style={styles.historyDesc} numberOfLines={2}>{h.desc}</Text>
            <View style={styles.historyMeta}>
              <Ionicons name="people-outline" size={11} color={Colors.textMuted} />
              <Text style={styles.historyMetaText}>{h.audience}</Text>
              <Ionicons name="time-outline" size={11} color={Colors.textMuted} />
              <Text style={styles.historyMetaText}>{h.time}</Text>
            </View>
          </View>
        ))}
        <TouchableOpacity style={styles.viewAllBtn}>
          <Text style={styles.viewAllText}>VER HISTORIAL COMPLETO</Text>
          <Ionicons name="chevron-forward" size={14} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {/* ── Footer status ─────────────────────────────────────────────── */}
      <View style={styles.footer}>
        <View style={styles.footerItem}>
          <View style={styles.footerDot} />
          <Text style={styles.footerText}>CORE API V8.1 ONLINE</Text>
        </View>
        <View style={styles.footerItem}>
          <Ionicons name="lock-closed-outline" size={11} color={Colors.textMuted} />
          <Text style={styles.footerText}>ENCRIPTACIÓN AES-256</Text>
        </View>
      </View>

      <View style={{ height: 90 }} />
    </ScrollView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  header: {
    flexDirection: 'row', alignItems: 'flex-end',
    backgroundColor: Colors.primary,
    paddingTop: 52, paddingBottom: Spacing.md, paddingHorizontal: Spacing.lg,
  },
  headerSup:  { fontSize: 10, color: 'rgba(255,255,255,0.55)', fontWeight: '700', letterSpacing: 0.5, marginBottom: 2 },
  pageTitle:  { fontSize: 21, fontWeight: '900', color: Colors.white, marginBottom: 3 },
  pageDesc:   { fontSize: 12, color: 'rgba(255,255,255,0.65)' },
  secureBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(34,197,94,0.15)', borderRadius: Radius.sm,
    paddingHorizontal: 8, paddingVertical: 5, marginLeft: Spacing.sm,
  },
  secureText: { fontSize: 10, fontWeight: '700', color: Colors.success },

  moduleLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, paddingBottom: 4 },
  moduleAccent:   { width: 3, height: 14, backgroundColor: Colors.accent, borderRadius: 2 },
  moduleLabel:    { fontSize: 11, color: Colors.accent, fontWeight: '700', letterSpacing: 0.5 },

  // Compose card
  composeCard: {
    marginHorizontal: Spacing.lg, marginBottom: Spacing.md,
    backgroundColor: Colors.white, borderRadius: Radius.xl, padding: Spacing.md, ...Shadow.sm,
  },
  composeHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: Spacing.md },
  composeTitle:  { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },

  sectionLabel: { fontSize: 10, fontWeight: '700', color: Colors.textSecondary, letterSpacing: 1, marginBottom: 8, marginTop: Spacing.sm },

  // Audience
  audienceOption: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md,
    padding: Spacing.sm, marginBottom: 7,
  },
  audienceActive: { borderColor: Colors.primary, backgroundColor: '#EEF2FF' },
  audienceIcon:   { width: 30, height: 30, borderRadius: Radius.sm, alignItems: 'center', justifyContent: 'center' },
  audienceLabel:  { fontSize: 14, fontWeight: '700', color: Colors.textPrimary, marginBottom: 1 },
  audienceDesc:   { fontSize: 11, color: Colors.textMuted },

  // Fields
  fieldHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  charCount:   { fontSize: 11, color: Colors.textMuted, fontWeight: '600' },
  input: {
    backgroundColor: Colors.background, borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.border,
    padding: Spacing.md, fontSize: 14, color: Colors.textPrimary, marginBottom: Spacing.sm,
  },
  textArea: {
    backgroundColor: Colors.background, borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.border,
    padding: Spacing.md, fontSize: 14, color: Colors.textPrimary,
    minHeight: 100, marginBottom: Spacing.md,
  },
  inputDisabled: { opacity: 0.6 },

  infoBanner: {
    flexDirection: 'row', gap: 8, alignItems: 'flex-start',
    backgroundColor: '#EFF9FC', borderRadius: Radius.md, padding: Spacing.sm, marginBottom: Spacing.md,
  },
  infoText: { flex: 1, fontSize: 12, color: Colors.textSecondary, lineHeight: 16 },

  sendBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.primary, borderRadius: Radius.md, padding: 14,
  },
  sendBtnDisabled: { opacity: 0.5 },
  sendBtnText: { color: Colors.white, fontSize: 15, fontWeight: '700' },

  successBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#DCFCE7', borderRadius: Radius.md, padding: 12, justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  successText: { color: Colors.success, fontSize: 14, fontWeight: '700' },
  resetBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    borderWidth: 1, borderColor: Colors.primary, borderRadius: Radius.md, padding: 12,
  },
  resetBtnText: { color: Colors.primary, fontSize: 14, fontWeight: '700' },

  // Metrics
  metricsCard: {
    marginHorizontal: Spacing.lg, backgroundColor: Colors.primary,
    borderRadius: Radius.xl, padding: Spacing.lg, marginBottom: Spacing.md,
  },
  metricsLabel:     { fontSize: 10, color: 'rgba(255,255,255,0.55)', fontWeight: '700', letterSpacing: 1, marginBottom: 6 },
  metricsNum:       { fontSize: 34, fontWeight: '900', color: Colors.white, marginBottom: Spacing.md },
  metricsUnit:      { fontSize: 15, fontWeight: '400' },
  metricsRow:       { flexDirection: 'row', gap: Spacing.xl },
  metricsItem:      {},
  metricsItemLabel: { fontSize: 10, color: 'rgba(255,255,255,0.55)', fontWeight: '600', letterSpacing: 0.5, marginBottom: 2 },
  metricsItemVal:   { fontSize: 20, fontWeight: '800' },

  // History
  historySection: { padding: Spacing.lg },
  historyHeader:  { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: Spacing.md },
  historyTitle:   { fontSize: 18, fontWeight: '800', color: Colors.textPrimary },
  historyItem:    { borderBottomWidth: 1, borderBottomColor: Colors.border, paddingVertical: Spacing.md },
  historyTop:     { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 4 },
  historyItemTitle: { flex: 1, fontSize: 14, fontWeight: '700', color: Colors.textPrimary, marginRight: 8 },
  historyBadge:   { borderRadius: Radius.sm, paddingHorizontal: 8, paddingVertical: 3 },
  historyBadgeText: { fontSize: 10, fontWeight: '700' },
  historyDesc:    { fontSize: 13, color: Colors.textSecondary, marginBottom: 5 },
  historyMeta:    { flexDirection: 'row', alignItems: 'center', gap: 5 },
  historyMetaText: { fontSize: 11, color: Colors.textMuted },
  viewAllBtn:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingTop: Spacing.md },
  viewAllText:    { fontSize: 13, fontWeight: '700', color: Colors.primary, letterSpacing: 0.5 },

  // Footer
  footer: {
    flexDirection: 'row', justifyContent: 'space-around',
    paddingVertical: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.border,
    marginHorizontal: Spacing.lg,
  },
  footerItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  footerDot:  { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.success },
  footerText: { fontSize: 10, color: Colors.textMuted, fontWeight: '600', letterSpacing: 0.3 },
});
