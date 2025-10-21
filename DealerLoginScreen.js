import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

export default function DealerLoginScreen({ onBack, onGoToRegistration, onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    // Basic validation
    if (!email.trim()) {
      Alert.alert('Erreur', 'Veuillez saisir votre email.');
      return;
    }
    if (!password.trim()) {
      Alert.alert('Erreur', 'Veuillez saisir votre mot de passe.');
      return;
    }

    setIsLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // For demo purposes, accept any email/password
      console.log('Dealer login', { email, password });
      
      // Go directly to basket list without showing success message
      onLoginSuccess?.();
    } catch (error) {
      // Removed error message
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email?.trim()) {
      Alert.alert('Email requis', 'Veuillez saisir votre adresse email professionnelle dans le champ "Email professionnel", puis appuyez à nouveau sur "Mot de passe oublié ?".');
      return;
    }

    setIsLoading(true);
    try {
      // Simulate sending a reset link
      await new Promise(resolve => setTimeout(resolve, 1000));
      Alert.alert('Email envoyé', `Un lien de réinitialisation a été envoyé à ${email}. Vérifiez votre boîte de réception.`);
    } catch (err) {
      Alert.alert('Erreur', 'Impossible d\'envoyer le lien de réinitialisation. Veuillez réessayer plus tard.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <MaterialIcons name="arrow-back" size={22} color="#2d5a27" />
        </TouchableOpacity>

        <View style={styles.hero}>
          <View style={styles.logoWrap}>
            <MaterialIcons name="storefront" size={48} color="#fff" />
          </View>
          <Text style={styles.heroTitle}>Espace Commerçant</Text>
          <Text style={styles.heroSubtitle}>Gérez vos paniers et commandes</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Connexion</Text>

          <View style={styles.inputRow}>
            <MaterialIcons name="email" size={20} color="#9aa" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Email professionnel"
              value={email}
              onChangeText={setEmail}
              placeholderTextColor="#bbb"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputRow}>
            <MaterialIcons name="lock" size={20} color="#9aa" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Mot de passe"
              value={password}
              onChangeText={setPassword}
              placeholderTextColor="#bbb"
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <TouchableOpacity style={styles.forgotPassword} onPress={handleForgotPassword}>
            <Text style={styles.forgotPasswordText}>Mot de passe oublié ?</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            <Text style={styles.loginButtonText}>{isLoading ? 'Connexion...' : 'Se connecter'}</Text>
          </TouchableOpacity>

          <View style={styles.footerRow}>
            <Text style={styles.footerText}>Pas de compte ?</Text>
            <TouchableOpacity onPress={onGoToRegistration}>
              <Text style={styles.signupLink}>Créer un compte commerçant</Text>
            </TouchableOpacity>
          </View>
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
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 10,
    padding: 10,
  },
  hero: {
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 18,
  },
  logoWrap: {
    width: 84,
    height: 84,
    borderRadius: 22,
    backgroundColor: '#2d5a27',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    elevation: 4,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#223',
  },
  heroSubtitle: {
    fontSize: 13,
    color: '#666',
    marginTop: 6,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
    color: '#222',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fafafa',
    borderRadius: 12,
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#333',
    paddingVertical: 6,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 12,
  },
  forgotPasswordText: {
    color: '#2d5a27',
    fontSize: 13,
    fontWeight: '600',
  },
  loginButton: {
    backgroundColor: '#2d5a27',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
  loginButtonDisabled: {
    backgroundColor: '#cfcfcf',
  },
  loginButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  footerText: { color: '#666', marginRight: 8 },
  signupLink: { color: '#2d5a27', fontWeight: '700' },
  scrollView: { flex: 1 },
  scrollContent: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 18, paddingBottom: 40 },
  backButton: { position: 'absolute', top: 18, left: 18, zIndex: 10, padding: 8 },
});
