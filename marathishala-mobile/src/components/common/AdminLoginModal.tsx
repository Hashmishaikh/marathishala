import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: () => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
}) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  const correctPin = process.env.EXPO_PUBLIC_ADMIN_PIN || '1234';

  const handleVerify = () => {
    if (pin === correctPin) {
      setError('');
      setPin('');
      onLoginSuccess();
      onClose();
    } else {
      setError('Invalid Admin PIN. Please try again.');
    }
  };

  const handleKeyPress = (digit: string) => {
    if (pin.length < 4) {
      const nextPin = pin + digit;
      setPin(nextPin);
      if (nextPin.length === 4) {
        if (nextPin === correctPin) {
          setError('');
          setPin('');
          onLoginSuccess();
          onClose();
        } else {
          setError('Invalid PIN. Default is 1234');
        }
      }
    }
  };

  const handleDelete = () => {
    setPin((prev) => prev.slice(0, -1));
    setError('');
  };

  return (
    <Modal visible={isOpen} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <View style={styles.lockIconBox}>
              <MaterialCommunityIcons name="shield-lock-outline" size={28} color="#38bdf8" />
            </View>
            <Text style={styles.title}>Admin Access Required</Text>
            <Text style={styles.subtitle}>Enter 4-digit PIN to unlock Scorer & Admin tools</Text>
          </View>

          {/* PIN Indicators */}
          <View style={styles.dotsRow}>
            {[0, 1, 2, 3].map((idx) => {
              const isFilled = pin.length > idx;
              return (
                <View
                  key={idx}
                  style={[styles.pinDot, isFilled && styles.pinDotFilled]}
                />
              );
            })}
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          {/* Keypad */}
          <View style={styles.keypad}>
            {[['1', '2', '3'], ['4', '5', '6'], ['7', '8', '9'], ['', '0', 'del']].map(
              (row, rIdx) => (
                <View key={rIdx} style={styles.keyRow}>
                  {row.map((k, kIdx) => {
                    if (k === '') {
                      return <View key={kIdx} style={styles.emptyKey} />;
                    }
                    if (k === 'del') {
                      return (
                        <TouchableOpacity
                          key={kIdx}
                          style={styles.keyBtn}
                          onPress={handleDelete}
                          activeOpacity={0.7}
                        >
                          <Ionicons name="backspace-outline" size={24} color="#94a3b8" />
                        </TouchableOpacity>
                      );
                    }
                    return (
                      <TouchableOpacity
                        key={kIdx}
                        style={styles.keyBtn}
                        onPress={() => handleKeyPress(k)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.keyText}>{k}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )
            )}
          </View>

          <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#0f172a',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  lockIconBox: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#0c2444',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#0284c7',
  },
  title: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
  },
  subtitle: {
    color: '#94a3b8',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  pinDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#1e293b',
    borderWidth: 1.5,
    borderColor: '#334155',
  },
  pinDotFilled: {
    backgroundColor: '#38bdf8',
    borderColor: '#0284c7',
  },
  errorText: {
    color: '#f43f5e',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 12,
  },
  keypad: {
    width: '100%',
    gap: 10,
  },
  keyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  emptyKey: {
    flex: 1,
    height: 54,
  },
  keyBtn: {
    flex: 1,
    height: 54,
    borderRadius: 14,
    backgroundColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  keyText: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '700',
  },
  cancelBtn: {
    marginTop: 18,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  cancelText: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '600',
  },
});
