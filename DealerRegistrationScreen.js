import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Image,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

export default function DealerRegistrationScreen({ onBack, onGoToLogin, onBasketCreation }) {
  const [businessType, setBusinessType] = useState('');
  const [address, setAddress] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [managerName, setManagerName] = useState('');
  const [logoUri, setLogoUri] = useState(null);
  // Confirmation / OTP states
  const [confirmStep, setConfirmStep] = useState(false);
  const [confirmationMethod, setConfirmationMethod] = useState(null); // 'email' or 'phone'
  const [generatedCode, setGeneratedCode] = useState(null);
  const [codeInput, setCodeInput] = useState('');
  const [sending, setSending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const pickLogo = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Permission requise', "Accès à la galerie nécessaire pour choisir un logo.");
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setLogoUri(result.assets[0].uri);
      }
    } catch (e) {
      console.warn('Image pick error', e);
    }
  };

  const handleSubmit = () => {
    // Basic validation
    if (!businessType.trim()) {
      Alert.alert('Erreur', 'Veuillez saisir le type de commerce.');
      return;
    }
    if (!address.trim()) {
      Alert.alert('Erreur', 'Veuillez saisir l\'adresse.');
      return;
    }
    if (!email.trim()) {
      Alert.alert('Erreur', 'Veuillez saisir l\'email professionnel.');
      return;
    }
    if (!phone.trim()) {
      Alert.alert('Erreur', 'Veuillez saisir le numéro de téléphone.');
      return;
    }
    if (!managerName.trim()) {
      Alert.alert('Erreur', 'Veuillez saisir le nom du responsable.');
      return;
    }

    console.log('Dealer signup', { businessType, address, email, phone, managerName });
    // Start confirmation step (choose method if both provided)
    setCodeInput('');
    setGeneratedCode(null);
    setConfirmationMethod(null);
    setConfirmStep(true);
  };

  useEffect(() => {
    let t;
    if (resendCooldown > 0) {
      t = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
    }
    return () => clearTimeout(t);
  }, [resendCooldown]);

  const generateAndSendCode = async (method) => {
    // method: 'email' or 'phone'
    setConfirmationMethod(method);
    setSending(true);
    // simulate network delay
    await new Promise((r) => setTimeout(r, 800));
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    setGeneratedCode(code);
    setResendCooldown(30);
    setSending(false);
    // For now, we simulate sending by logging. Replace with API call to send real email/SMS.
    console.log(`Simulated send OTP to ${method === 'email' ? email : phone}:`, code);
    Alert.alert('Code envoyé', `Un code a été envoyé par ${method === 'email' ? 'e-mail' : 'SMS'} au contact fourni.`);
  };

  const handleVerifyCode = () => {
    if (!codeInput.trim()) {
      Alert.alert('Erreur', 'Veuillez saisir le code reçu.');
      return;
    }
    if (codeInput.trim() === generatedCode) {
      // Success: finalize registration
      setConfirmStep(false);
      Alert.alert(
        'Inscription réussie!',
        'Votre compte commerçant a été vérifié et créé. Vous pouvez maintenant créer votre premier panier.',
        [
          { text: 'Créer un panier', onPress: () => onBasketCreation?.() }
        ]
      );
    } else {
      Alert.alert('Code invalide', 'Le code saisi est incorrect. Veuillez réessayer.');
    }
  };

  const handleResend = async () => {
    if (!confirmationMethod) return;
    if (resendCooldown > 0) return;
    await generateAndSendCode(confirmationMethod);
  };


  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      <TouchableOpacity style={styles.backButton} onPress={onBack}>
        <MaterialIcons name="arrow-back" size={24} color="#2d5a27" />
      </TouchableOpacity>

  <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.cardWrapper}>
          {!confirmStep ? (
            <View style={styles.card}>
              <Text style={styles.title}>Inscription Commerçant</Text>

              <View style={styles.logoRow}>
                <TouchableOpacity style={styles.logoButton} onPress={pickLogo}>
                  {logoUri ? (
                    <Image source={{ uri: logoUri }} style={styles.logoPreview} />
                  ) : (
                    <MaterialIcons name="add" size={28} color="#2d5a27" />
                  )}
                </TouchableOpacity>
                <View style={styles.logoHint}>
                  <Text style={styles.logoHintTitle}>{businessType || 'Type de commerce'}</Text>
                  <Text style={styles.logoHintSub}>Ajouter un logo pour mieux représenter la boutique</Text>
                </View>
              </View>

              <View style={styles.underlineInput}>
                <TextInput
                  style={styles.underlineText}
                  placeholder="Type de commerce"
                  value={businessType}
                  onChangeText={setBusinessType}
                  placeholderTextColor="#888"
                />
              </View>

              <View style={styles.underlineInput}>
                <TextInput
                  style={styles.underlineText}
                  placeholder="Adresse complète"
                  value={address}
                  onChangeText={setAddress}
                  placeholderTextColor="#888"
                />
              </View>

              <View style={styles.underlineInput}>
                <TextInput
                  style={styles.underlineText}
                  placeholder="E-mail professionnel"
                  value={email}
                  onChangeText={setEmail}
                  placeholderTextColor="#888"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.underlineInput}>
                <TextInput
                  style={styles.underlineText}
                  placeholder="Numéro de téléphone"
                  value={phone}
                  onChangeText={setPhone}
                  placeholderTextColor="#888"
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.underlineInput}>
                <TextInput
                  style={styles.underlineText}
                  placeholder="Nom du responsable"
                  value={managerName}
                  onChangeText={setManagerName}
                  placeholderTextColor="#888"
                />
              </View>

              <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
                <Text style={styles.submitText}>S'inscrire</Text>
              </TouchableOpacity>

              <Text style={styles.footerText} onPress={onGoToLogin}>Déjà un compte ? Se connecter</Text>
            </View>
          ) : (
            // Confirmation Step inside card
            <View style={styles.card}>
              <View style={styles.confirmBoxInline}>
                <Text style={styles.confirmTitle}>Confirmer le compte</Text>
                <Text style={styles.confirmSubtitle}>Choisissez une méthode pour recevoir le code de vérification</Text>

                <View style={styles.methodRow}>
                  <TouchableOpacity
                    style={[styles.methodButton, { opacity: email ? 1 : 0.45 }]}
                    disabled={!email || sending}
                    onPress={() => generateAndSendCode('email')}
                  >
                    <Text style={styles.methodText}>E-mail{email ? ` • ${email}` : ''}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.methodButton, { opacity: phone ? 1 : 0.45 }]}
                    disabled={!phone || sending}
                    onPress={() => generateAndSendCode('phone')}
                  >
                    <Text style={styles.methodText}>SMS{phone ? ` • ${phone}` : ''}</Text>
                  </TouchableOpacity>
                </View>

                {generatedCode && (
                  <>
                    <Text style={styles.codeLabel}>Entrez le code reçu</Text>
                    <TextInput
                      value={codeInput}
                      onChangeText={setCodeInput}
                      style={styles.codeInput}
                      placeholder="0000"
                      keyboardType="numeric"
                    />

                    <View style={styles.confirmActions}>
                      <TouchableOpacity style={styles.smallButton} onPress={() => { setConfirmStep(false); }}>
                        <Text style={styles.smallButtonText}>Modifier les infos</Text>
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
                  </>
                )}

                {sending && <Text style={styles.sendingText}>Envoi en cours...</Text>}
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    flexGrow: 1,
    justifyContent: 'center',
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 10,
    padding: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'left',
    marginTop: 6,
    marginBottom: 18,
  },
  logoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 20,
    color: '#000',
  },
  logoButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#eef8ef',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#dfeee0',
  },
  logoPreview: {
    width: 68,
    height: 68,
    borderRadius: 34,
  },
  logoHint: {
    marginLeft: 14,
    flex: 1,
    justifyContent: 'center',
  },
  logoHintTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#123a1a',
  },
  logoHintSub: {
    fontSize: 12,
    color: '#567a58',
  },
  underlineInput: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#eef6ee',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  underlineText: {
    fontSize: 16,
    paddingVertical: 6,
    color: '#0b2b14',
  },
  submitButton: {
    backgroundColor: '#1f7a3d',
    marginTop: 18,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    elevation: 4,
  },
  submitText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  footerText: {
    textAlign: 'center',
    marginTop: 16,
    color: '#000',
    fontSize: 16,
  },
  /* Confirmation styles */
  cardWrapper: {
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    width: '100%',
    maxWidth: 720,
    backgroundColor: '#fbfffb',
    borderRadius: 14,
    padding: 18,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 4,
  },
  confirmBoxInline: {
    paddingVertical: 4,
  },
  confirmTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0b3b17',
    marginBottom: 6,
  },
  confirmSubtitle: {
    color: '#375b3d',
    marginBottom: 12,
  },
  methodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  methodButton: {
    flex: 1,
    marginHorizontal: 6,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#dfeee0',
    alignItems: 'center',
  },
  methodText: {
    color: '#1f5a2d',
    fontWeight: '600',
  },
  codeLabel: {
    marginTop: 10,
    marginBottom: 6,
    color: '#2d5a27',
  },
  codeInput: {
    borderWidth: 1,
    borderColor: '#d0e0cc',
    padding: 12,
    borderRadius: 8,
    fontSize: 18,
    backgroundColor: '#fff',
  },
  confirmActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  smallButton: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: '#e9f3ea',
    borderRadius: 8,
  },
  smallButtonText: {
    color: '#1f5a2d',
    fontWeight: '600',
  },
  resendRow: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resendText: {
    color: '#444',
  },
  resendLink: {
    color: '#1f5a2d',
    fontWeight: '700',
  },
  sendingText: {
    marginTop: 8,
    color: '#666',
  },
});


