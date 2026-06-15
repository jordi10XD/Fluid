import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity, Alert, ActivityIndicator, Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Colors, Spacing, Radius, Shadow } from '../theme/colors';
import { supabase } from '../lib/supabase';
import { useRole } from '../context/RoleContext';

export default function PhotoPromptModal() {
  const { role } = useRole();
  const [userId, setUserId] = useState<string | null>(null);
  const [hasPhoto, setHasPhoto] = useState<boolean | null>(null);
  const [skipped, setSkipped] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  const checkUserAndPhoto = useCallback(async () => {
    setChecking(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        const { data, error } = await supabase
          .from('user_photos')
          .select('photo')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) {
          // If table not found or query error, default to hasPhoto = false
          setHasPhoto(false);
        } else if (data?.photo) {
          setHasPhoto(true);
        } else {
          setHasPhoto(false);
          setSkipped(false);
        }
      } else {
        setUserId(null);
        setHasPhoto(null);
      }
    } catch (e) {
      console.log('Error checking user/photo:', e);
      setHasPhoto(false);
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    checkUserAndPhoto();
  }, [role, checkUserAndPhoto]);

  // Subscribe to changes in the user_photos table to update state in real-time
  useEffect(() => {
    if (!userId) return;

    const channelName = `realtime_user_photos_modal_${userId}_${Math.random()}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'user_photos', filter: `user_id=eq.${userId}` },
        (payload: any) => {
          if (payload.new && payload.new.photo) {
            setHasPhoto(true);
          } else {
            setHasPhoto(false);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const handleLaunchCamera = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permiso requerido',
          'Se necesita acceso a la cámara para tomar tu foto de perfil.'
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
        base64: true,
      });

      if (!result.canceled && result.assets[0].base64 && userId) {
        setLoading(true);
        const base64 = result.assets[0].base64;

        const { error } = await supabase
          .from('user_photos')
          .upsert({
            user_id: userId,
            photo: base64,
          });

        if (error) throw error;

        Alert.alert('Éxito', 'Foto de perfil guardada correctamente.');
        setHasPhoto(true);
      }
    } catch (e: any) {
      Alert.alert('Error', e.message || 'No se pudo guardar la foto.');
    } finally {
      setLoading(false);
    }
  };

  const isDriver = role === 'conductor';
  const showModal = !checking && hasPhoto === false && !skipped && userId !== null;

  if (!showModal) return null;

  return (
    <Modal visible={showModal} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.decorBar} />

          {/* Header */}
          <View style={styles.iconWrap}>
            <View style={[styles.iconBox, isDriver && styles.driverIconBox]}>
              <Ionicons 
                name={isDriver ? "shield-checkmark-outline" : "person-add-outline"} 
                size={36} 
                color={Colors.white} 
              />
            </View>
          </View>

          <Text style={styles.title}>
            {isDriver ? 'Foto de Perfil Requerida' : 'Completa tu Perfil'}
          </Text>

          <Text style={styles.description}>
            {isDriver 
              ? 'Como conductor de la red, es obligatorio registrar una foto de perfil clara para que los pasajeros y administradores puedan reconocerte en ruta.'
              : 'Sube una foto de perfil opcional para personalizar tu cuenta y mejorar tu seguridad en el sistema.'}
          </Text>

          {/* Preview Placeholder */}
          <View style={styles.avatarPlaceholder}>
            <Ionicons name="camera-reverse-outline" size={48} color={Colors.textMuted} />
          </View>

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[styles.btn, styles.btnPrimary, loading && styles.btnDisabled]} 
              onPress={handleLaunchCamera}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <>
                  <Ionicons name="camera" size={20} color={Colors.white} />
                  <Text style={styles.btnPrimaryText}>Abrir Cámara</Text>
                </>
              )}
            </TouchableOpacity>

            {!isDriver && (
              <TouchableOpacity 
                style={[styles.btn, styles.btnSecondary]} 
                onPress={() => setSkipped(true)}
                disabled={loading}
              >
                <Text style={styles.btnSecondaryText}>Omitir por ahora</Text>
              </TouchableOpacity>
            )}
          </View>
          
          {isDriver && (
            <Text style={styles.warningFooter}>
              * Los conductores no pueden omitir este paso
            </Text>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(10, 25, 49, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: Colors.white,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    alignItems: 'center',
    ...Shadow.lg,
    position: 'relative',
    overflow: 'hidden',
  },
  decorBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 6,
    backgroundColor: Colors.accent,
  },
  iconWrap: {
    marginBottom: Spacing.md,
    marginTop: Spacing.sm,
  },
  iconBox: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.md,
  },
  driverIconBox: {
    backgroundColor: Colors.primary,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.primary,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  description: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.xs,
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.borderLight,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
    borderStyle: 'dashed',
  },
  buttonContainer: {
    width: '100%',
    gap: Spacing.sm,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: 14,
    borderRadius: Radius.md,
    width: '100%',
  },
  btnPrimary: {
    backgroundColor: Colors.primary,
  },
  btnDisabled: {
    opacity: 0.7,
  },
  btnPrimaryText: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: '700',
  },
  btnSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  btnSecondaryText: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  warningFooter: {
    marginTop: Spacing.md,
    fontSize: 11,
    color: Colors.danger,
    fontWeight: '600',
  },
});
