/**
 * src/screens/admin/control/tabs/RutasTab.tsx
 *
 * Secciones:
 *   1. TYPES
 *   2. HOOK   — useRutas()
 *   3. MODAL  — RutaModal()
 *   4. SCREEN — RutasTab()
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Modal,
  FlatList, StyleSheet, ActivityIndicator,
  KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MapView, { PROVIDER_GOOGLE, Marker } from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions';
import * as Location from 'expo-location';

const DIRECTIONS_API_KEY = process.env.EXPO_PUBLIC_DIRECTIONS_API_KEY || '';

import { Colors, Spacing, Radius, Shadow } from '../../../../theme/colors';
import { fetchList, createItem, updateItem, deleteItem } from '../shared/supabaseList';
import {
  SearchActionBar, ItemCard, EmptyState,
  SkeletonCard, FormField, fieldStyles,
} from '../shared/components';

// ══════════════════════════════════════════════════════════════════════════════
// 1. TYPES
// ══════════════════════════════════════════════════════════════════════════════

interface Coord {
  latitude: number;
  longitude: number;
}

interface Ruta {
  id:           string;
  codigo:       string;       // ej: R-001
  nombre:       string;       // ej: Milagro — Riobamba
  origen:       string;
  destino:      string;
  paradas:      string[];     // paradas intermedias
  distancia_km: number;
  tiempo_min:   number;       // tiempo estimado en minutos
  origen_coords?: Coord | null;
  destino_coords?: Coord | null;
  paradas_coords?: Coord[];
}

type RutaDraft = Omit<Ruta, 'id'>;
type FormErrors = Partial<Record<keyof RutaDraft, string>>;

const EMPTY_DRAFT: RutaDraft = {
  codigo:       '',
  nombre:       '',
  origen:       '',
  destino:      '',
  paradas:      [],
  distancia_km: 0,
  tiempo_min:   0,
  origen_coords: null,
  destino_coords: null,
  paradas_coords: [],
};

// ══════════════════════════════════════════════════════════════════════════════
// 2. HOOK — useRutas
// ══════════════════════════════════════════════════════════════════════════════

function useRutas() {
  const [items,   setItems]   = useState<Ruta[]>([]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await fetchList<Ruta>('routes', 'codigo', true);
    if (result.error) setError(result.error);
    else              setItems(result.data);
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const create = useCallback(async (draft: RutaDraft): Promise<string | null> => {
    const { error } = await createItem('routes', draft);
    if (!error) await refresh();
    return error;
  }, [refresh]);

  const update = useCallback(async (id: string, draft: RutaDraft): Promise<string | null> => {
    const { error } = await updateItem('routes', id, draft);
    if (!error) await refresh();
    return error;
  }, [refresh]);

  const remove = useCallback(async (id: string): Promise<string | null> => {
    const { error } = await deleteItem('routes', id);
    if (!error) setItems(prev => prev.filter(r => r.id !== id));
    return error;
  }, []);

  return { items, loading, error, refresh, create, update, remove };
}

// ══════════════════════════════════════════════════════════════════════════════
// 3. MODAL — RutaModal
// ══════════════════════════════════════════════════════════════════════════════

interface RutaModalProps {
  visible:      boolean;
  mode:         'create' | 'edit';
  initialData?: Ruta;
  onClose:      () => void;
  onSave:       (draft: RutaDraft) => Promise<string | null>;
}

function RutaModal({ visible, mode, initialData, onClose, onSave }: RutaModalProps) {
  const [form,       setForm]       = useState<RutaDraft>(EMPTY_DRAFT);
  const [errors,     setErrors]     = useState<FormErrors>({});
  const [saving,     setSaving]     = useState(false);
  const [paradaInput, setParadaInput] = useState(''); // input temporal para chips

  useEffect(() => {
    if (!visible) return;
    setForm(
      initialData
        ? {
            codigo:       initialData.codigo || '',
            nombre:       initialData.nombre || '',
            origen:       initialData.origen || '',
            destino:      initialData.destino || '',
            paradas:      initialData.paradas || [],
            distancia_km: initialData.distancia_km || 0,
            tiempo_min:   initialData.tiempo_min || 0,
            origen_coords: initialData.origen_coords || null,
            destino_coords: initialData.destino_coords || null,
            paradas_coords: initialData.paradas_coords || [],
          }
        : EMPTY_DRAFT,
    );
    setErrors({});
    setParadaInput('');
  }, [visible, initialData]);

  const set = <K extends keyof RutaDraft>(field: K, value: RutaDraft[K]) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const [mapVisible, setMapVisible] = useState(false);
  const [mapMode, setMapMode] = useState<'origen' | 'destino' | 'paradas'>('origen');

  const handleMapPress = async (e: any) => {
    const coord = e.nativeEvent.coordinate;
    let addressName = 'Ubicación seleccionada';
    try {
      const [address] = await Location.reverseGeocodeAsync(coord);
      if (address) {
        addressName = [address.street, address.streetNumber, address.city].filter(Boolean).join(', ') || address.name || addressName;
      }
    } catch (err) {}

    if (mapMode === 'origen') {
      set('origen_coords', coord);
      set('origen', addressName);
    } else if (mapMode === 'destino') {
      set('destino_coords', coord);
      set('destino', addressName);
    } else if (mapMode === 'paradas') {
      set('paradas_coords', [...(form.paradas_coords || []), coord]);
      set('paradas', [...form.paradas, addressName]);
    }
  };

  // ── Gestión de paradas (chips) ──────────────────────────────────────────────
  function addParada() {
    const val = paradaInput.trim();
    if (!val) return;
    set('paradas', [...form.paradas, val]);
    setParadaInput('');
  }

  function removeParada(index: number) {
    set('paradas', form.paradas.filter((_, i) => i !== index));
    if (form.paradas_coords && form.paradas_coords.length > index) {
      set('paradas_coords', form.paradas_coords.filter((_, i) => i !== index));
    }
  }

  // ── Validación ──────────────────────────────────────────────────────────────
  function validate(): boolean {
    const e: FormErrors = {};
    if (!form.codigo.trim())  e.codigo  = 'El código es requerido (ej: R-001)';
    if (!form.nombre.trim())  e.nombre  = 'El nombre / descripción es requerido';
    if (!form.origen.trim())  e.origen  = 'El origen es requerido';
    if (!form.destino.trim()) e.destino = 'El destino es requerido';
    if (!form.distancia_km || form.distancia_km < 1) e.distancia_km = 'Ingresa la distancia en km';
    if (!form.tiempo_min   || form.tiempo_min   < 1) e.tiempo_min   = 'Ingresa el tiempo estimado en minutos';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    setSaving(true);
    const serverError = await onSave(form);
    if (serverError) setErrors({ codigo: serverError });
    else             onClose();
    setSaving(false);
  }

  // ── Helpers de formato ──────────────────────────────────────────────────────
  function formatTiempo(min: number): string {
    if (!min) return '';
    const h = Math.floor(min / 60);
    const m = min % 60;
    return h > 0 ? `${h}h ${m}min` : `${m}min`;
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={modal.container}>

          <View style={modal.handle} />

          <View style={modal.titleRow}>
            <Text style={modal.title}>{mode === 'create' ? 'Nueva Ruta' : 'Editar Ruta'}</Text>
            <TouchableOpacity onPress={onClose} style={modal.closeBtn}>
              <Ionicons name="close" size={22} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView style={modal.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <TouchableOpacity style={modal.openMapBtn} onPress={() => setMapVisible(true)}>
              <Ionicons name="map" size={20} color="#FFF" />
              <Text style={modal.openMapText}>Seleccionar en Mapa Interactivo</Text>
            </TouchableOpacity>

            {/* Código */}
            <FormField label="Código de Ruta" error={errors.codigo}>
              <TextInput
                style={[fieldStyles.input, errors.codigo && fieldStyles.inputError]}
                placeholder="R-001"
                placeholderTextColor={Colors.textMuted}
                value={form.codigo}
                onChangeText={t => set('codigo', t.toUpperCase())}
                autoCapitalize="characters"
              />
            </FormField>

            {/* Nombre */}
            <FormField label="Nombre / Descripción" error={errors.nombre}>
              <TextInput
                style={[fieldStyles.input, errors.nombre && fieldStyles.inputError]}
                placeholder="Milagro — Riobamba"
                placeholderTextColor={Colors.textMuted}
                value={form.nombre}
                onChangeText={t => set('nombre', t)}
              />
            </FormField>

            {/* Origen */}
            <FormField label="Origen" error={errors.origen}>
              <TextInput
                style={[fieldStyles.input, errors.origen && fieldStyles.inputError]}
                placeholder="Terminal Terrestre Milagro"
                placeholderTextColor={Colors.textMuted}
                value={form.origen}
                onChangeText={t => set('origen', t)}
              />
            </FormField>

            {/* Destino */}
            <FormField label="Destino" error={errors.destino}>
              <TextInput
                style={[fieldStyles.input, errors.destino && fieldStyles.inputError]}
                placeholder="Terminal Principal Riobamba"
                placeholderTextColor={Colors.textMuted}
                value={form.destino}
                onChangeText={t => set('destino', t)}
              />
            </FormField>

            {/* Paradas Intermedias (chips) */}
            <FormField label="Paradas Intermedias">
              <View style={modal.chipInput}>
                <TextInput
                  style={[fieldStyles.input, { flex: 1 }]}
                  placeholder="Agregar parada..."
                  placeholderTextColor={Colors.textMuted}
                  value={paradaInput}
                  onChangeText={setParadaInput}
                  onSubmitEditing={addParada}
                  returnKeyType="done"
                />
                <TouchableOpacity style={modal.addChipBtn} onPress={addParada}>
                  <Ionicons name="add" size={20} color="#FFF" />
                </TouchableOpacity>
              </View>
              {/* Chips */}
              {form.paradas.length > 0 && (
                <View style={modal.chipsRow}>
                  {form.paradas.map((p, i) => (
                    <View key={i} style={modal.chip}>
                      <Text style={modal.chipText}>{p}</Text>
                      <TouchableOpacity onPress={() => removeParada(i)} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                        <Ionicons name="close-circle" size={15} color={Colors.primary} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </FormField>

            {/* Distancia */}
            <FormField label="Distancia (km)" error={errors.distancia_km}>
              <TextInput
                style={[fieldStyles.input, errors.distancia_km && fieldStyles.inputError]}
                placeholder="185"
                placeholderTextColor={Colors.textMuted}
                value={form.distancia_km ? String(form.distancia_km) : ''}
                onChangeText={t => set('distancia_km', parseFloat(t) || 0)}
                keyboardType="numeric"
              />
            </FormField>

            {/* Tiempo estimado */}
            <FormField label="Tiempo Estimado (minutos)" error={errors.tiempo_min}>
              <TextInput
                style={[fieldStyles.input, errors.tiempo_min && fieldStyles.inputError]}
                placeholder="210  →  3h 30min"
                placeholderTextColor={Colors.textMuted}
                value={form.tiempo_min ? String(form.tiempo_min) : ''}
                onChangeText={t => set('tiempo_min', parseInt(t, 10) || 0)}
                keyboardType="numeric"
              />
              {form.tiempo_min > 0 && (
                <Text style={modal.hint}>≈ {formatTiempo(form.tiempo_min)}</Text>
              )}
            </FormField>

            <View style={{ height: 32 }} />
          </ScrollView>

          <View style={modal.footer}>
            <TouchableOpacity style={modal.cancelBtn} onPress={onClose}>
              <Text style={modal.cancelText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[modal.saveBtn, saving && modal.saveBtnDisabled]}
              onPress={handleSave}
              disabled={saving}
              activeOpacity={0.8}
            >
              {saving
                ? <ActivityIndicator size="small" color="#FFF" />
                : <Text style={modal.saveText}>Guardar</Text>
              }
            </TouchableOpacity>
          </View>

        </View>

        {/* Map Picker Modal */}
        <Modal visible={mapVisible} animationType="slide" onRequestClose={() => setMapVisible(false)}>
          <View style={styles.mapScreenContainer}>
            <View style={styles.mapHeader}>
              <TouchableOpacity onPress={() => setMapVisible(false)}>
                <Ionicons name="arrow-back" size={24} color={Colors.primary} />
              </TouchableOpacity>
              <Text style={styles.mapHeaderTitle}>Selección en Mapa</Text>
              <View style={{ width: 24 }} />
            </View>
            
            <View style={styles.mapModeSelector}>
              {(['origen', 'destino', 'paradas'] as const).map(m => (
                <TouchableOpacity 
                  key={m} 
                  style={[styles.mapModeBtn, mapMode === m && styles.mapModeBtnActive]}
                  onPress={() => setMapMode(m)}
                >
                  <Text style={[styles.mapModeText, mapMode === m && styles.mapModeTextActive]}>
                    {m.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={{ flex: 1 }}>
              <MapView
                provider={PROVIDER_GOOGLE}
                style={StyleSheet.absoluteFillObject}
                onPress={handleMapPress}
                initialRegion={{
                  latitude: form.origen_coords?.latitude || -2.1658,
                  longitude: form.origen_coords?.longitude || -79.6091,
                  latitudeDelta: 0.5,
                  longitudeDelta: 0.5,
                }}
              >
                {form.origen_coords && (
                  <Marker coordinate={form.origen_coords} title="Origen" pinColor={Colors.success} />
                )}
                {form.destino_coords && (
                  <Marker coordinate={form.destino_coords} title="Destino" pinColor={Colors.primary} />
                )}
                {form.paradas_coords?.map((coord, i) => (
                  <Marker key={i} coordinate={coord} title={`Parada ${i+1}`} pinColor={Colors.warning} />
                ))}

                {form.origen_coords && form.destino_coords && (
                  <MapViewDirections
                    origin={form.origen_coords}
                    destination={form.destino_coords}
                    waypoints={form.paradas_coords}
                    apikey={DIRECTIONS_API_KEY}
                    strokeWidth={4}
                    strokeColor={Colors.accent}
                    optimizeWaypoints={true}
                    onReady={(res) => {
                      set('distancia_km', parseFloat(res.distance.toFixed(1)));
                      set('tiempo_min', Math.ceil(res.duration));
                    }}
                  />
                )}
              </MapView>
              <View style={styles.mapInstructions}>
                <Text style={styles.mapInstructionsText}>
                  Toca en el mapa para establecer: <Text style={{fontWeight: '800', color: Colors.primary}}>{mapMode.toUpperCase()}</Text>
                </Text>
              </View>
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const modal = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  handle:    { width: 36, height: 4, borderRadius: 2, backgroundColor: Colors.border, alignSelf: 'center', marginTop: 10 },
  titleRow:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border },
  title:     { fontSize: 18, fontWeight: '800', color: Colors.textPrimary },
  closeBtn:  { padding: 4 },
  scroll:    { flex: 1, paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg },
  hint:      { fontSize: 11, color: Colors.primary, marginTop: 4, fontWeight: '600' },

  chipInput:  { flexDirection: 'row', gap: 8, alignItems: 'center' },
  addChipBtn: { backgroundColor: Colors.primary, borderRadius: Radius.md, padding: 12 },
  chipsRow:   { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  chip:       { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.primary + '15', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  chipText:   { fontSize: 13, color: Colors.primary, fontWeight: '600' },

  footer:          { flexDirection: 'row', gap: 12, padding: Spacing.lg, borderTopWidth: 1, borderTopColor: Colors.border },
  cancelBtn:       { flex: 1, paddingVertical: 14, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, alignItems: 'center' },
  cancelText:      { fontSize: 15, fontWeight: '600', color: Colors.textSecondary },
  saveBtn:         { flex: 2, paddingVertical: 14, borderRadius: Radius.md, backgroundColor: Colors.primary, alignItems: 'center', minHeight: 50 },
  saveBtnDisabled: { opacity: 0.6 },
  saveText:        { fontSize: 15, fontWeight: '700', color: '#FFF' },
  openMapBtn:      { flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.accent, borderRadius: Radius.md, paddingVertical: 14, marginBottom: Spacing.lg },
  openMapText:     { color: '#FFF', fontWeight: '700', fontSize: 15 },
});

const styles = StyleSheet.create({
  mapScreenContainer: { flex: 1, backgroundColor: '#FFF' },
  mapHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingTop: 50, paddingBottom: 15, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: Colors.border },
  mapHeaderTitle: { fontSize: 16, fontWeight: '800', color: Colors.textPrimary },
  mapModeSelector: { flexDirection: 'row', padding: Spacing.md, backgroundColor: Colors.white, gap: 8 },
  mapModeBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border },
  mapModeBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  mapModeText: { fontSize: 12, fontWeight: '700', color: Colors.textSecondary },
  mapModeTextActive: { color: Colors.white },
  mapInstructions: { position: 'absolute', bottom: 40, alignSelf: 'center', backgroundColor: '#FFF', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 24, ...Shadow.md },
  mapInstructionsText: { fontSize: 14, color: Colors.textPrimary },
});

// ══════════════════════════════════════════════════════════════════════════════
// 4. SCREEN — RutasTab
// ══════════════════════════════════════════════════════════════════════════════

export default function RutasTab() {
  const { items, loading, error, remove, create, update } = useRutas();

  const [search,     setSearch]     = useState('');
  const [modalOpen,  setModalOpen]  = useState(false);
  const [editTarget, setEditTarget] = useState<Ruta | undefined>();

  const filtered = items.filter(r =>
    (r.codigo || '').toLowerCase().includes(search.toLowerCase()) ||
    (r.nombre || '').toLowerCase().includes(search.toLowerCase()),
  );

  function openCreate() { setEditTarget(undefined); setModalOpen(true); }
  function openEdit(item: Ruta) { setEditTarget(item); setModalOpen(true); }

  return (
    <View style={screen.container}>

      <SearchActionBar
        value={search}
        onChangeText={setSearch}
        placeholder="Buscar por código o nombre"
        onNew={openCreate}
      />

      {error && <Text style={screen.errorBanner}>⚠ {error}</Text>}

      {loading ? (
        <View><SkeletonCard /><SkeletonCard /><SkeletonCard /></View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          contentContainerStyle={filtered.length === 0 ? { flex: 1 } : { paddingBottom: 32 }}
          ListEmptyComponent={
            <EmptyState icon="map-outline" message={'No hay rutas registradas.\nPresiona + Nuevo para agregar una.'} />
          }
          renderItem={({ item }) => (
            <ItemCard
              badge={item.codigo}
              title={item.nombre}
              onEdit={() => openEdit(item)}
              onDelete={() => remove(item.id)}
            >
              <View style={screen.routeInfo}>
                {/* Origen */}
                <View style={screen.routeRow}>
                  <Ionicons name="ellipse" size={8} color={Colors.success} />
                  <View>
                    <Text style={screen.routeLabel}>ORIGEN</Text>
                    <Text style={screen.routeValue}>{item.origen}</Text>
                  </View>
                </View>

                {/* Paradas intermedias */}
                {item.paradas.length > 0 && (
                  <View style={screen.routeRow}>
                    <Ionicons name="ellipse-outline" size={8} color={Colors.textMuted} />
                    <View>
                      <Text style={screen.routeLabel}>PARADA INTERMEDIA</Text>
                      <Text style={screen.routeValue}>{item.paradas.join(' · ')}</Text>
                    </View>
                  </View>
                )}

                {/* Destino */}
                <View style={screen.routeRow}>
                  <Ionicons name="ellipse" size={8} color={Colors.danger} />
                  <View>
                    <Text style={screen.routeLabel}>DESTINO</Text>
                    <Text style={screen.routeValue}>{item.destino}</Text>
                  </View>
                </View>

                {/* Distancia y tiempo */}
                <View style={screen.routeMeta}>
                  <Text style={screen.metaText}>
                    <Ionicons name="navigate-outline" size={11} /> {item.distancia_km} km
                  </Text>
                  <Text style={screen.metaDot}>·</Text>
                  <Text style={screen.metaText}>
                    <Ionicons name="time-outline" size={11} /> {Math.floor(item.tiempo_min / 60)}h {item.tiempo_min % 60}min
                  </Text>
                </View>
              </View>
            </ItemCard>
          )}
        />
      )}

      <RutaModal
        visible={modalOpen}
        mode={editTarget ? 'edit' : 'create'}
        initialData={editTarget}
        onClose={() => setModalOpen(false)}
        onSave={draft => editTarget ? update(editTarget.id, draft) : create(draft)}
      />
    </View>
  );
}

const screen = StyleSheet.create({
  container:   { flex: 1, backgroundColor: Colors.background },
  errorBanner: { marginHorizontal: Spacing.lg, marginBottom: Spacing.sm, fontSize: 13, color: Colors.danger, textAlign: 'center' },

  routeInfo: { gap: 8 },
  routeRow:  { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  routeLabel: { fontSize: 9, fontWeight: '700', color: Colors.textMuted, letterSpacing: 0.5 },
  routeValue: { fontSize: 13, color: Colors.textPrimary, fontWeight: '500', marginTop: 1 },

  routeMeta:  { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4, paddingTop: 8, borderTopWidth: 1, borderTopColor: Colors.border },
  metaText:   { fontSize: 12, color: Colors.textSecondary, fontWeight: '600' },
  metaDot:    { color: Colors.border },
});
