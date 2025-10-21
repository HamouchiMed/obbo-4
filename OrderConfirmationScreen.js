import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, StatusBar, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import SafeAreaWrapper from './utils/SafeAreaWrapper';
import { MaterialIcons } from '@expo/vector-icons';
import MapScreen from './MapScreen';

export default function OrderConfirmationScreen({ onBack, cartItems = [], onConfirmOrder }) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isConfirming, setIsConfirming] = useState(false);
  const [fullName, setFullName] = useState('');
  const [exactAddress, setExactAddress] = useState('');
  const [mapOpen, setMapOpen] = useState(false);
  // OTP / confirmation states (client-side simulated)
  const [generatedCode, setGeneratedCode] = useState(null);
  const [codeInput, setCodeInput] = useState('');
  const [sending, setSending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [showCodeInput, setShowCodeInput] = useState(false);
  const codeInputRef = useRef(null);

  // Group items by market/shop
  const groupedItems = cartItems.reduce((groups, item, index) => {
    const shopName = item.shopName || 'Autre';
    if (!groups[shopName]) {
      groups[shopName] = [];
    }
    groups[shopName].push({ ...item, originalIndex: index });
    return groups;
  }, {});

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => total + (item.price || 0), 0);
  };

  const handleConfirmOrder = async () => {
    if (!phoneNumber.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer votre numéro de téléphone');
      return;
    }

    if (phoneNumber.length < 10) {
      Alert.alert('Erreur', 'Veuillez entrer un numéro de téléphone valide');
      return;
    }

    // Instead of immediately confirming, send a simulated OTP to the phone and ask user to verify
    await generateAndSendCode('phone');
  };

  // Generate a 4-digit code, simulate sending (console.log + alert), and start cooldown
  const generateAndSendCode = async (method) => {
    setSending(true);
    // simulate network delay
    await new Promise((r) => setTimeout(r, 800));
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    setGeneratedCode(code);
    setResendCooldown(30);
    setSending(false);
    console.log(`Simulated send OTP to ${method === 'email' ? 'email' : 'phone'}:`, code);
    // Show alert and reveal code input after user taps OK
    Alert.alert(
      'Code envoyé',
      `Un code a été envoyé par ${method === 'email' ? 'e-mail' : 'SMS'} au contact fourni.`,
      [
        {
          text: 'OK',
          onPress: () => {
            // reveal and focus the code input
            setShowCodeInput(true);
            setTimeout(() => codeInputRef.current?.focus?.(), 250);
          }
        }
      ]
    );
  };

  // Countdown for resend cooldown
  useEffect(() => {
    let t;
    if (resendCooldown > 0) {
      t = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
    }
    return () => clearTimeout(t);
  }, [resendCooldown]);

  const handleVerifyCode = async () => {
    if (!codeInput.trim()) {
      Alert.alert('Erreur', 'Veuillez saisir le code reçu.');
      return;
    }
    if (codeInput.trim() !== generatedCode) {
      Alert.alert('Code invalide', 'Le code saisi est incorrect. Veuillez réessayer.');
      return;
    }
    // Code valid — ask user to confirm name & exact address before finalizing
    Alert.alert(
      'Confirmer les informations',
      `Nom: ${fullName || '(non fourni)'}\nAdresse: ${exactAddress || '(non fournie)'}`,
      [
        { text: 'Modifier', style: 'cancel', onPress: () => setMapOpen(true) },
        {
          text: 'Confirmer',
          onPress: async () => {
            setIsConfirming(true);
            try {
              await new Promise((resolve) => setTimeout(resolve, 2000));
              Alert.alert('Commande confirmée!', `Votre commande a été confirmée avec le numéro ${phoneNumber}. Vous recevrez un SMS de confirmation.`);
              // clear OTP state and call callback with name/address included
              setGeneratedCode(null);
              setCodeInput('');
              setShowCodeInput(false);
              onConfirmOrder?.(phoneNumber, cartItems, { fullName, exactAddress });
            } catch (error) {
              Alert.alert('Erreur', 'Une erreur est survenue lors de la confirmation');
            } finally {
              setIsConfirming(false);
            }
          }
        }
      ]
    );
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    await generateAndSendCode('phone');
  };

  // Handle location saved from MapScreen: try reverse geocoding then set exactAddress
  const handleMapSave = async (payload) => {
    const coords = payload?.coords;
    if (!coords) {
      setMapOpen(false);
      return;
    }

    // Try reverse geocoding with OpenStreetMap Nominatim (no API key). Fallback to lat,lng string.
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${coords.latitude}&lon=${coords.longitude}`;
      const res = await fetch(url, { headers: { 'User-Agent': 'obbo-app/1.0' } });
      if (res.ok) {
        const data = await res.json();
        const display = data.display_name || `${coords.latitude.toFixed(6)}, ${coords.longitude.toFixed(6)}`;
        setExactAddress(display);
      } else {
        setExactAddress(`${coords.latitude.toFixed(6)}, ${coords.longitude.toFixed(6)}`);
      }
    } catch (err) {
      console.warn('Reverse geocode failed', err);
      setExactAddress(`${coords.latitude.toFixed(6)}, ${coords.longitude.toFixed(6)}`);
    }

    setMapOpen(false);
  };

  // If mapOpen, show MapScreen full screen (so user can pick/confirm location)
  if (mapOpen) {
    return (
      <MapScreen
        onBack={() => setMapOpen(false)}
        onSaveLocation={handleMapSave}
      />
    );
  }

  return (
    <SafeAreaWrapper style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Confirmer ma commande</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Phone Number Input */}
        <View style={styles.phoneSection}>
          <Text style={styles.sectionTitle}>Numéro de téléphone</Text>
          <Text style={styles.sectionSubtitle}>Nous vous enverrons un SMS de confirmation</Text>
          <View style={styles.phoneInputContainer}>
            <MaterialIcons name="phone" size={20} color="#2d5a27" />
            <TextInput
              style={styles.phoneInput}
              placeholder="Votre numéro de téléphone"
              placeholderTextColor="#999"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
              maxLength={15}
            />
          </View>
          {/* Full name and exact address inputs */}
          <View style={{ marginTop: 12 }}>
            <Text style={[styles.sectionTitle, { fontSize: 14 }]}>Nom complet</Text>
            <TextInput
              style={[styles.codeInput, { marginBottom: 8 }]}
              placeholder="votre nom complet"
              value={fullName}
              onChangeText={setFullName}
            />

            <Text style={[styles.sectionTitle, { fontSize: 14, marginTop: 6 }]}>Adresse exacte</Text>
            <TextInput
              style={[styles.codeInput]}
              placeholder="Ex: 12 Rue de la Paix, Casablanca"
              value={exactAddress}
              onChangeText={setExactAddress}
            />
              <TouchableOpacity style={[styles.smallButton, { marginTop: 8 }]} onPress={() => setMapOpen(true)}>
                <Text style={styles.smallButtonText}>Choisir sur la carte</Text>
              </TouchableOpacity>
          </View>
        </View>

          {mapOpen && (
            <MapScreen
              onBack={() => setMapOpen(false)}
              onSaveLocation={(payload) => {
                const coords = payload?.coords;
                if (coords) {
                  // Store as readable lat,lng — reverse geocoding can be added later
                  setExactAddress(`${coords.latitude.toFixed(6)}, ${coords.longitude.toFixed(6)}`);
                }
                setMapOpen(false);
              }}
            />
          )}

        {/* Order Summary */}
        <View style={styles.orderSection}>
          <Text style={styles.sectionTitle}>Récapitulatif de votre commande</Text>
          
          {Object.entries(groupedItems).map(([shopName, items]) => (
            <View key={shopName} style={styles.marketSection}>
              <View style={styles.marketHeader}>
                <MaterialIcons name="store" size={16} color="#2d5a27" />
                <Text style={styles.marketName}>{shopName}</Text>
                <Text style={styles.marketItemCount}>({items.length} article{items.length > 1 ? 's' : ''})</Text>
              </View>
              
              {items.map((item) => (
                <View key={item.id} style={styles.orderItem}>
                  <View style={styles.itemImage}>
                    <MaterialIcons name="shopping-basket" size={20} color="#2d5a27" />
                  </View>
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemTitle}>{item.title || item.name}</Text>
                    <Text style={styles.itemCategory}>{item.category || 'Menu'}</Text>
                    <Text style={styles.itemTime}>
                      Réservé à {item.reservedAt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>
                  <Text style={styles.itemPrice}>{item.price} DH</Text>
                </View>
              ))}
            </View>
          ))}

          {/* Total */}
          <View style={styles.totalSection}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalAmount}>{calculateTotal().toFixed(2)} DH</Text>
            </View>
            <Text style={styles.totalNote}>Frais de service inclus</Text>
          </View>
        </View>
        {/* Code input / Verification (shown after OTP sent and OK pressed) */}
        {generatedCode && showCodeInput && (
          <View style={[styles.card, { marginVertical: 12 }]}> 
            <Text style={styles.codeLabel}>Entrez le code reçu</Text>
            <TextInput
              ref={codeInputRef}
              value={codeInput}
              onChangeText={setCodeInput}
              style={styles.codeInput}
              placeholder="0000"
              keyboardType="numeric"
            />

            <View style={styles.confirmActions}>
              <TouchableOpacity style={styles.smallButton} onPress={() => { setGeneratedCode(null); setShowCodeInput(false); setCodeInput(''); }}>
                <Text style={styles.smallButtonText}>Modifier le numéro</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.smallButton} onPress={handleVerifyCode}>
                <Text style={styles.smallButtonText}>Vérifier</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.resendRow}>
              <Text style={styles.resendText}>Vous n'avez pas reçu le code ?</Text>
              <TouchableOpacity disabled={resendCooldown > 0} onPress={handleResend}>
                <Text style={[styles.resendLink, { opacity: resendCooldown > 0 ? 0.5 : 1 }]}>Renvoyer{resendCooldown > 0 ? ` (${resendCooldown}s)` : ''}</Text>
              </TouchableOpacity>
            </View>

            {sending && <Text style={styles.sendingText}>Envoi en cours...</Text>}
          </View>
        )}

        {/* Confirm Button (hidden once code input is shown) */}
        {!showCodeInput && (
          <TouchableOpacity 
            style={[styles.confirmButton, isConfirming && styles.confirmButtonDisabled]} 
            onPress={handleConfirmOrder}
            disabled={isConfirming}
          >
            {isConfirming ? (
              <Text style={styles.confirmButtonText}>Confirmation en cours...</Text>
            ) : (
              <>
                <MaterialIcons name="check-circle" size={20} color="#fff" />
                <Text style={styles.confirmButtonText}>Confirmer ma commande</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3fbf5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#ffffff',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  backButton: {
    marginRight: 8,
    padding: 6,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0b3b17',
    flex: 1,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  phoneSection: {
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#123a1a',
    marginBottom: 6,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#567a58',
    marginBottom: 10,
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#e6f0e8',
    elevation: 1,
  },
  phoneInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: '#0b2b14',
  },
  orderSection: {
    marginBottom: 14,
  },
  marketSection: {
    marginBottom: 12,
  },
  marketHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e9f7ee',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    marginBottom: 8,
  },
  marketName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1f5a2d',
    flex: 1,
  },
  marketItemCount: {
    fontSize: 12,
    color: '#567a58',
    fontWeight: '600',
  },
  orderItem: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#edf6ee',
  },
  itemImage: {
    width: 46,
    height: 46,
    backgroundColor: '#eef8ef',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  itemInfo: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#233',
    marginBottom: 2,
  },
  itemCategory: {
    fontSize: 12,
    color: '#6b6b6b',
    marginBottom: 2,
  },
  itemTime: {
    fontSize: 11,
    color: '#8f8f8f',
  },
  itemPrice: {
    fontSize: 15,
    fontWeight: '700',
    color: '#147a3a',
  },
  totalSection: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#e6f0e8',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#233',
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: '800',
    color: '#147a3a',
  },
  totalNote: {
    fontSize: 12,
    color: '#6b6b6b',
    textAlign: 'center',
  },
  /* OTP / code UI */
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e6f0e8',
    elevation: 1,
    marginBottom: 8,
  },
  codeLabel: {
    fontSize: 14,
    color: '#2d5a27',
    marginBottom: 8,
    fontWeight: '600',
  },
  codeInput: {
    borderWidth: 1,
    borderColor: '#d0e0cc',
    padding: 12,
    borderRadius: 10,
    fontSize: 18,
    backgroundColor: '#fbfffb',
    marginBottom: 10,
  },
  confirmActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  smallButton: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: '#eef8ef',
    borderRadius: 10,
    alignItems: 'center',
  },
  smallButtonText: {
    color: '#146731',
    fontWeight: '700',
  },
  resendRow: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resendText: {
    color: '#4a4a4a',
  },
  resendLink: {
    color: '#147a3a',
    fontWeight: '700',
  },
  sendingText: {
    marginTop: 8,
    color: '#666',
  },
  confirmButton: {
    backgroundColor: '#147a3a',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
    marginBottom: 28,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  confirmButtonDisabled: {
    backgroundColor: '#bfcfc0',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
});

