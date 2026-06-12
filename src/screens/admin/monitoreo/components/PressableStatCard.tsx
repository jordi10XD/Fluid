import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius, Shadow } from '../../../../theme/colors';

interface PressableStatCardProps {
  title: string;
  value: string;
  subtext?: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  onPress: () => void;
}

export default function PressableStatCard({ title, value, subtext, icon, color, onPress }: PressableStatCardProps) {
  return (
    <Pressable 
      onPress={onPress} 
      style={({ pressed }) => [
        styles.card,
        // Aplica el efecto de fondo oscuro al presionar
        pressed && styles.cardPressed 
      ]}
    >
      {({ pressed }) => (
        <>
          <View style={styles.header}>
            <View style={[styles.iconBox, { backgroundColor: pressed ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.03)' }]}>
              <Ionicons name={icon} size={16} color={pressed ? Colors.white : color} />
            </View>
            <Text style={[styles.title, pressed && { color: Colors.white }]}>{title}</Text>
          </View>
          <Text style={[styles.value, { color: pressed ? Colors.white : color }]}>{value}</Text>
          {subtext && (
            <Text style={[styles.subtext, pressed && { color: 'rgba(255,255,255,0.7)' }]}>{subtext}</Text>
          )}
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: Radius.xl,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
    ...Shadow.sm,
  },
  cardPressed: {
    backgroundColor: Colors.primary, // Efecto azul oscuro
    borderColor: Colors.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  iconBox: {
    width: 28,
    height: 28,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.textSecondary,
    flex: 1,
  },
  value: {
    fontSize: 34,
    fontWeight: '900',
    marginBottom: 4,
  },
  subtext: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textMuted,
  },
});