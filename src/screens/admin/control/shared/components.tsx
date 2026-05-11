/**
 * src/screens/admin/control/shared/components.tsx
 *
 * Componentes visuales compartidos entre los 4 tabs.
 * Se exportan con nombre para importarlos donde se necesiten.
 */

import React, { useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Animated, Alert, ActionSheetIOS, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, Shadow } from '../../../../theme/colors';

// ══════════════════════════════════════════════════════════════════════════════
// SearchActionBar
// Buscador contextual + botón "+ Nuevo"
// ══════════════════════════════════════════════════════════════════════════════

interface SearchActionBarProps {
  value:        string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onNew:        () => void;
}

export function SearchActionBar({
  value,
  onChangeText,
  placeholder = 'Buscar...',
  onNew,
}: SearchActionBarProps) {
  return (
    <View style={sab.row}>
      <View style={sab.searchBox}>
        <Ionicons name="search-outline" size={15} color={Colors.textMuted} />
        <TextInput
          style={sab.input}
          placeholder={placeholder}
          placeholderTextColor={Colors.textMuted}
          value={value}
          onChangeText={onChangeText}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
        {value.length > 0 && (
          <TouchableOpacity
            onPress={() => onChangeText('')}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="close-circle" size={15} color={Colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      <TouchableOpacity style={sab.newBtn} onPress={onNew} activeOpacity={0.8}>
        <Ionicons name="add" size={16} color="#FFF" />
        <Text style={sab.newBtnText}>Nuevo</Text>
      </TouchableOpacity>
    </View>
  );
}

const sab = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: Spacing.lg,
    marginVertical: Spacing.md,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFF',
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    ...Shadow.sm,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: Colors.textPrimary,
    padding: 0,
  },
  newBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  newBtnText: { color: '#FFF', fontSize: 14, fontWeight: '700' },
});

// ══════════════════════════════════════════════════════════════════════════════
// ItemCard
// Card genérica con slot de contenido y botón ⋮ → Editar / Eliminar
// ══════════════════════════════════════════════════════════════════════════════

interface ItemCardProps {
  badge?:    string;          // texto pequeño superior (ej: código de ruta)
  title:     string;
  subtitle?: string;
  children?: React.ReactNode; // contenido personalizado según el tab
  onEdit:    () => void;
  onDelete:  () => void;
}

export function ItemCard({
  badge, title, subtitle, children, onEdit, onDelete,
}: ItemCardProps) {

  const confirmDelete = () =>
    Alert.alert(
      'Eliminar',
      `¿Estás seguro de eliminar "${title}"?`,
      [
        { text: 'Cancelar',  style: 'cancel' },
        { text: 'Eliminar',  style: 'destructive', onPress: onDelete },
      ],
    );

  const openMenu = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancelar', 'Editar', 'Eliminar'],
          destructiveButtonIndex: 2,
          cancelButtonIndex: 0,
        },
        (index) => {
          if (index === 1) onEdit();
          if (index === 2) confirmDelete();
        },
      );
    } else {
      Alert.alert('Opciones', undefined, [
        { text: 'Editar',   onPress: onEdit },
        { text: 'Eliminar', onPress: confirmDelete, style: 'destructive' },
        { text: 'Cancelar', style: 'cancel' },
      ]);
    }
  };

  return (
    <View style={ic.card}>
      {/* ── Cabecera ── */}
      <View style={ic.header}>
        <View style={ic.headerLeft}>
          {badge && <Text style={ic.badge}>{badge}</Text>}
          <Text style={ic.title} numberOfLines={2}>{title}</Text>
          {subtitle && <Text style={ic.subtitle}>{subtitle}</Text>}
        </View>

        <TouchableOpacity
          onPress={openMenu}
          style={ic.moreBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="ellipsis-vertical" size={18} color={Colors.textMuted} />
        </TouchableOpacity>
      </View>

      {/* ── Slot de contenido extra ── */}
      {children && (
        <View style={ic.body}>{children}</View>
      )}
    </View>
  );
}

const ic = StyleSheet.create({
  card: {
    backgroundColor: '#FFF',
    borderRadius: Radius.xl,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
    padding: Spacing.md,
    ...Shadow.sm,
  },
  header:     { flexDirection: 'row', alignItems: 'flex-start' },
  headerLeft: { flex: 1 },
  badge:      { fontSize: 10, fontWeight: '700', color: Colors.textMuted, letterSpacing: 0.5, marginBottom: 3 },
  title:      { fontSize: 15, fontWeight: '800', color: Colors.textPrimary, marginBottom: 2 },
  subtitle:   { fontSize: 12, color: Colors.textSecondary },
  moreBtn:    { padding: 4, marginLeft: 8 },
  body: {
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
});

// ══════════════════════════════════════════════════════════════════════════════
// EmptyState
// ══════════════════════════════════════════════════════════════════════════════

interface EmptyStateProps {
  icon?:    keyof typeof Ionicons.glyphMap;
  message?: string;
}

export function EmptyState({
  icon = 'inbox-outline',
  message = 'No hay registros.',
}: EmptyStateProps) {
  return (
    <View style={emp.container}>
      <Ionicons name={icon} size={52} color={Colors.border} />
      <Text style={emp.text}>{message}</Text>
    </View>
  );
}

const emp = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 64 },
  text:      { marginTop: 12, fontSize: 14, color: Colors.textMuted, textAlign: 'center', lineHeight: 22 },
});

// ══════════════════════════════════════════════════════════════════════════════
// SkeletonCard
// ══════════════════════════════════════════════════════════════════════════════

export function SkeletonCard() {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1,   duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 700, useNativeDriver: true }),
      ]),
    ).start();
  }, []);

  return (
    <Animated.View style={[sk.card, { opacity }]}>
      <View style={sk.line1} />
      <View style={sk.line2} />
      <View style={sk.line3} />
    </Animated.View>
  );
}

const sk = StyleSheet.create({
  card:  { backgroundColor: '#FFF', borderRadius: Radius.xl, marginHorizontal: Spacing.lg, marginBottom: Spacing.sm, padding: Spacing.md },
  line1: { height: 10, width: '35%', backgroundColor: Colors.border, borderRadius: 6, marginBottom: 10 },
  line2: { height: 14, width: '70%', backgroundColor: Colors.border, borderRadius: 6, marginBottom: 8 },
  line3: { height: 10, width: '50%', backgroundColor: Colors.border, borderRadius: 6 },
});

// ══════════════════════════════════════════════════════════════════════════════
// FormField
// Wrapper reutilizable para campos de formulario (label + input + error)
// Se usa dentro de los modales de cada Tab.
// ══════════════════════════════════════════════════════════════════════════════

interface FormFieldProps {
  label:    string;
  error?:   string;
  children: React.ReactNode;
}

export function FormField({ label, error, children }: FormFieldProps) {
  return (
    <View style={ff.wrapper}>
      <Text style={ff.label}>{label.toUpperCase()}</Text>
      {children}
      {error ? <Text style={ff.error}>{error}</Text> : null}
    </View>
  );
}

export const fieldStyles = StyleSheet.create({
  input: {
    backgroundColor: Colors.background,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    fontSize: 15,
    color: Colors.textPrimary,
  },
  inputError: { borderColor: Colors.danger },
});

const ff = StyleSheet.create({
  wrapper: { marginBottom: Spacing.md },
  label:   { fontSize: 10, fontWeight: '700', color: Colors.textSecondary, letterSpacing: 0.8, marginBottom: 6 },
  error:   { fontSize: 11, color: Colors.danger, marginTop: 4 },
});
