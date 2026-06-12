import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar,
  TextInput, Alert, Modal, Pressable
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, Shadow } from '../../theme/colors';
import { supabase } from '../../lib/supabase';
import { useNavigation } from '@react-navigation/native';

type AudienceKey = 'all' | 'passengers' | 'drivers';

const TITLE_LIMIT = 60;
const BODY_LIMIT  = 280;

const AUDIENCES: { key: AudienceKey; label: string; desc: string; icon: any; color: string }[] = [
  { key: 'all',        label: 'Todos (Pasajeros y Conductores)', desc: 'La notificación se enviará a todos los usuarios.', icon: 'people', color: '#0284C7' },
  { key: 'drivers',    label: 'Solo Conductores',                 desc: 'La notificación se enviará a los conductores.',    icon: 'bus', color: '#16A34A' },
  { key: 'passengers', label: 'Solo Pasajeros',                   desc: 'La notificación se enviará a los pasajeros.',      icon: 'person', color: '#EA580C' },
];

export default function EmisorNotificacionesScreen() {
  const navigation = useNavigation<any>();
  const [audience, setAudience]   = useState<AudienceKey>('all');
  const [title,    setTitle]      = useState('');
  const [body,     setBody]       = useState('');
  const [sendState, setSendState] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [showDropdown, setShowDropdown] = useState(false);
  const [stats, setStats] = useState({ todos: 0, conductores: 0, pasajeros: 0 });

  const titleOk = title.trim().length >= 3;
  const bodyOk  = body.trim().length  >= 10;
  const canSend = titleOk && bodyOk && sendState === 'idle';

  const selectedAudience = AUDIENCES.find(a => a.key === audience)!;

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from('notificaciones_historial')
        .select('audiencia')
        .gte('created_at', today.toISOString());

      if (!error && data) {
        const counts = { todos: 0, conductores: 0, pasajeros: 0 };
        data.forEach(n => {
          if (n.audiencia === 'all') counts.todos++;
          else if (n.audiencia === 'drivers') counts.conductores++;
          else if (n.audiencia === 'passengers') counts.pasajeros++;
        });
        setStats(counts);
      }
    } catch (e) {
      console.log('Error al cargar estadísticas de notificaciones:', e);
    }
  };

  const handleSend = async () => {
    if (!canSend) {
      Alert.alert('Campos requeridos', 'El título (mín. 3 chars) y el mensaje (mín. 10 chars) son obligatorios.');
      return;
    }
    setSendState('sending');

    try {
      // Intentar invocar la Edge Function para disparar vía OneSignal REST API
      const { error: fnError } = await supabase.functions.invoke('send-notification', {
        body: { title: title.trim(), message: body.trim(), audience },
      });

      if (fnError) throw fnError;

      // Guardar en el historial de la base de datos
      await supabase.from('notificaciones_historial').insert({
        titulo: title.trim(),
        mensaje: body.trim(),
        audiencia: audience,
        estado: 'Enviado'
      });

      setSendState('sent');
      Alert.alert('Éxito', 'Notificación enviada correctamente');
      handleReset();
      fetchStats();
    } catch (err: any) {
      console.error('Error enviando notificación:', err);
      // Intentar guardar en base de datos aunque la Edge Function falle (para entornos de pruebas locales)
      try {
        await supabase.from('notificaciones_historial').insert({
          titulo: title.trim(),
          mensaje: body.trim(),
          audiencia: audience,
          estado: 'Enviado'
        });
        Alert.alert('Simulación', 'Notificación registrada localmente en base de datos (Edge Function offline).');
        setSendState('sent');
        handleReset();
        fetchStats();
      } catch (dbErr) {
        Alert.alert('Error', err.message || 'No se pudo enviar la notificación.');
        setSendState('idle');
      }
    }
  };

  const handleReset = () => {
    setTitle(''); setBody(''); setAudience('all'); setSendState('idle');
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />

      {/* Compose card */}
      <View style={styles.composeCard}>
        <View style={styles.composeHeader}>
          <Text style={styles.composeTitle}>Enviar Notificación</Text>
          <TouchableOpacity 
            style={styles.historyBtn}
            onPress={() => navigation.getParent()?.navigate('HistorialNotificaciones') || navigation.navigate('HistorialNotificaciones')}
          >
            <Ionicons name="time-outline" size={14} color={Colors.primary} />
            <Text style={styles.historyBtnText}>Ver historial</Text>
          </TouchableOpacity>
        </View>

        {/* Destino Selector */}
        <Text style={styles.sectionLabel}>Destino</Text>
        <TouchableOpacity 
          style={styles.dropdownToggle} 
          onPress={() => setShowDropdown(true)}
          disabled={sendState !== 'idle'}
        >
          <View style={[styles.audienceIconContainer, { backgroundColor: selectedAudience.color + '20' }]}>
            <Ionicons name={selectedAudience.icon as any} size={16} color={selectedAudience.color} />
          </View>
          <Text style={styles.dropdownSelected}>{selectedAudience.label}</Text>
          <Ionicons name="chevron-down" size={18} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.inputHint}>{selectedAudience.desc}</Text>

        {/* Dropdown Modal */}
        <Modal visible={showDropdown} transparent animationType="fade" onRequestClose={() => setShowDropdown(false)}>
          <Pressable style={styles.modalOverlay} onPress={() => setShowDropdown(false)}>
            <View style={styles.dropdownMenu}>
              {AUDIENCES.map((a) => (
                <TouchableOpacity 
                  key={a.key}
                  style={styles.dropdownOption}
                  onPress={() => { setAudience(a.key); setShowDropdown(false); }}
                >
                  <View style={[styles.audienceIconContainer, { backgroundColor: a.color + '20' }]}>
                    <Ionicons name={a.icon as any} size={16} color={a.color} />
                  </View>
                  <Text style={styles.dropdownOptionText}>{a.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Pressable>
        </Modal>

        {/* Title */}
        <Text style={styles.sectionLabel}>Título</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={[styles.input, sendState !== 'idle' && styles.inputDisabled]}
            placeholder="Ej: Cierre parcial en Vía E35"
            placeholderTextColor={Colors.textMuted}
            value={title}
            onChangeText={t => setTitle(t.slice(0, TITLE_LIMIT))}
            editable={sendState === 'idle'}
          />
          <Text style={styles.charCountInside}>{title.length}/{TITLE_LIMIT}</Text>
        </View>

        {/* Mensaje */}
        <Text style={styles.sectionLabel}>Mensaje</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={[styles.textArea, sendState !== 'idle' && styles.inputDisabled]}
            multiline
            placeholder="Escribe aquí el contenido de tu mensaje..."
            placeholderTextColor={Colors.textMuted}
            value={body}
            onChangeText={t => setBody(t.slice(0, BODY_LIMIT))}
            textAlignVertical="top"
            editable={sendState === 'idle'}
          />
          <Text style={styles.charCountInsideTopRight}>{body.length}/{BODY_LIMIT}</Text>
        </View>

        {/* Info banner */}
        <View style={styles.infoBanner}>
          <Ionicons name="information-circle-outline" size={15} color={Colors.primary} />
          <Text style={styles.infoText}>
            El mensaje será enviado con prioridad alta a través de OneSignal.
          </Text>
        </View>

        {/* Botón Enviar */}
        <TouchableOpacity
          style={[styles.sendBtn, !canSend && styles.sendBtnDisabled]}
          onPress={handleSend}
          disabled={!canSend}
        >
          <Ionicons name="send" size={16} color={Colors.white} />
          <Text style={styles.sendBtnText}>
            {sendState === 'sending' ? 'Enviando...' : 'Enviar Notificación'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Resumen de hoy */}
      <View style={styles.resumenCard}>
        <Text style={styles.resumenTitle}>Resumen de hoy</Text>
        
        <View style={styles.statsGrid}>
          <View style={[styles.statBox, { backgroundColor: '#F0F9FF' }]}>
            <View style={styles.statBoxHeader}>
              <Ionicons name="people" size={24} color="#0284C7" />
              <Text style={styles.statNumber}>{stats.todos}</Text>
            </View>
            <Text style={[styles.statLabel, { color: '#0284C7' }]}>Todos</Text>
          </View>
          
          <View style={[styles.statBox, { backgroundColor: '#F0FDF4' }]}>
            <View style={styles.statBoxHeader}>
              <Ionicons name="bus" size={24} color="#16A34A" />
              <Text style={styles.statNumber}>{stats.conductores}</Text>
            </View>
            <Text style={[styles.statLabel, { color: '#16A34A' }]}>Conductores</Text>
          </View>
          
          <View style={[styles.statBox, { backgroundColor: '#FFF7ED' }]}>
            <View style={styles.statBoxHeader}>
              <Ionicons name="person" size={24} color="#EA580C" />
              <Text style={styles.statNumber}>{stats.pasajeros}</Text>
            </View>
            <Text style={[styles.statLabel, { color: '#EA580C' }]}>Pasajeros</Text>
          </View>
        </View>

        <View style={styles.totalBar}>
          <Ionicons name="bar-chart" size={16} color={Colors.textMuted} />
          <Text style={styles.totalText}>Total de mensajes enviados hoy</Text>
          <Text style={styles.totalNumber}>{stats.todos + stats.conductores + stats.pasajeros}</Text>
        </View>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },

  composeCard: {
    margin: Spacing.lg,
    backgroundColor: Colors.white, borderRadius: Radius.xl, padding: Spacing.lg, ...Shadow.sm,
  },
  composeHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.lg },
  composeTitle:  { fontSize: 18, fontWeight: '800', color: '#0F172A' },
  
  historyBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderColor: '#E2E8F0', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 },
  historyBtnText: { fontSize: 12, fontWeight: '700', color: Colors.primary },

  sectionLabel: { fontSize: 13, fontWeight: '700', color: '#0F172A', marginBottom: 6 },
  
  dropdownToggle: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: '#E2E8F0', borderRadius: Radius.md,
    paddingHorizontal: 12, paddingVertical: 10, marginBottom: 4,
  },
  audienceIconContainer: { width: 32, height: 32, borderRadius: 6, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  dropdownSelected: { flex: 1, fontSize: 14, fontWeight: '600', color: '#0F172A' },
  inputHint: { fontSize: 11, color: '#64748B', marginBottom: Spacing.lg },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.1)', justifyContent: 'center', padding: 20 },
  dropdownMenu: { backgroundColor: '#fff', borderRadius: Radius.md, padding: 10, ...Shadow.md },
  dropdownOption: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  dropdownOptionText: { fontSize: 14, fontWeight: '600', color: '#0F172A' },

  inputContainer: { position: 'relative', marginBottom: Spacing.lg },
  input: {
    borderWidth: 1, borderColor: '#E2E8F0', borderRadius: Radius.md,
    padding: 12, fontSize: 14, color: '#0F172A', paddingRight: 50,
  },
  textArea: {
    borderWidth: 1, borderColor: '#E2E8F0', borderRadius: Radius.md,
    padding: 12, fontSize: 14, color: '#0F172A',
    minHeight: 100, paddingTop: 30,
  },
  charCountInside: { position: 'absolute', right: 12, top: 14, fontSize: 12, color: '#94A3B8', fontWeight: '500' },
  charCountInsideTopRight: { position: 'absolute', right: 12, top: 10, fontSize: 12, color: '#94A3B8', fontWeight: '500' },
  inputDisabled: { opacity: 0.6, backgroundColor: '#F1F5F9' },

  infoBanner: {
    flexDirection: 'row', gap: 8, alignItems: 'center',
    backgroundColor: '#F0F9FF', borderRadius: Radius.md, padding: 12, marginBottom: Spacing.lg,
  },
  infoText: { flex: 1, fontSize: 12, color: '#0284C7', fontWeight: '500' },

  sendBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#0F172A', borderRadius: Radius.md, padding: 16,
  },
  sendBtnDisabled: { opacity: 0.5 },
  sendBtnText: { color: Colors.white, fontSize: 15, fontWeight: '700' },

  resumenCard: {
    marginHorizontal: Spacing.lg, backgroundColor: Colors.white,
    borderRadius: Radius.xl, padding: Spacing.lg, ...Shadow.sm,
  },
  resumenTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A', marginBottom: 16 },
  
  statsGrid: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  statBox: { flex: 1, borderRadius: Radius.md, padding: 12, alignItems: 'center' },
  statBoxHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  statNumber: { fontSize: 24, fontWeight: '800', color: '#0F172A' },
  statLabel: { fontSize: 11, fontWeight: '700' },

  totalBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F8FAFC', borderRadius: Radius.md, padding: 12,
  },
  totalText: { flex: 1, marginLeft: 8, fontSize: 13, color: '#64748B', fontWeight: '600' },
  totalNumber: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
});
