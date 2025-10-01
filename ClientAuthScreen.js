  import React, { useEffect, useState } from 'react';
  import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    SafeAreaView,
    StatusBar,
    Image,
    ScrollView,
  } from 'react-native';
  import { MaterialIcons } from '@expo/vector-icons';
  import * as WebBrowser from 'expo-web-browser';
  import * as Google from 'expo-auth-session/providers/google';
  import { api } from './utils/config';

  WebBrowser.maybeCompleteAuthSession();

  export default function ClientAuthScreen({ onBack, onLoginSuccess }) {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [showForgot, setShowForgot] = useState(false);
    const [forgotEmail, setForgotEmail] = useState('');
    const [message, setMessage] = useState('');
    const [usePhone, setUsePhone] = useState(false);
    const [request, response, promptAsync] = Google.useAuthRequest({
      expoClientId: 'YOUR_EXPO_GOOGLE_CLIENT_ID',
      iosClientId: 'YOUR_IOS_GOOGLE_CLIENT_ID',
      androidClientId: 'YOUR_ANDROID_GOOGLE_CLIENT_ID',
      webClientId: 'YOUR_WEB_GOOGLE_CLIENT_ID',
    });

    const handleGoogleLogin = async () => {
      try {
        await promptAsync({ useProxy: true });
      } catch (e) {
        console.warn('Google auth error', e);
      }
    };

    useEffect(() => {
      if (response?.type === 'success') {
        const { authentication } = response;
        console.log('Google authenticated', authentication);
        // TODO: send token to backend or proceed to app
      }
    }, [response]);

    const handleSubmit = async () => {
      if (isLogin) {
        try {
          const loginData = {
            password,
            ...(usePhone ? { phone } : { email })
          };
          
          const res = await fetch(api('/api/auth/login'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(loginData)
          });
          
          const data = await res.json();
          if (data?.success) {
            onLoginSuccess && onLoginSuccess();
          } else {
            setMessage(data?.message || 'Erreur de connexion');
          }
        } catch (e) {
          setMessage('Erreur réseau');
        }
      } else {
        try {
          const registerData = {
            firstName: name.split(' ')[0] || '',
            lastName: name.split(' ').slice(1).join(' ') || '',
            password,
            userType: 'client',
            ...(usePhone ? { phone } : { email })
          };
          
          const res = await fetch(api('/api/auth/register'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(registerData)
          });
          
          const data = await res.json();
          if (data?.success) {
            setMessage('Inscription réussie ! Vous pouvez maintenant vous connecter.');
            setIsLogin(true);
            setEmail('');
            setPhone('');
            setPassword('');
            setName('');
          } else {
            setMessage(data?.message || 'Erreur d\'inscription');
          }
        } catch (e) {
          setMessage('Erreur réseau');
        }
      }
    };

    const handleForgotPassword = async () => {
      try {
        setMessage('');
        const res = await fetch(api('/api/auth/forgot-password'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: forgotEmail || email })
        });
        const data = await res.json();
        if (data?.success) {
          setMessage('Si cet email existe, un lien vous a été envoyé.');
        } else {
          setMessage('Une erreur est survenue. Réessayez.');
        }
      } catch (e) {
        setMessage('Erreur réseau.');
      }
    };

    const toggleMode = () => {
      setIsLogin(!isLogin);
      setEmail('');
      setPhone('');
      setPassword('');
      setName('');
      setMessage('');
    };

    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
        
        {/* Back Button */}
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <MaterialIcons name="arrow-back" size={24} color="#2d5a27" />
        </TouchableOpacity>
        
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Welcome Text */}
          <Text style={styles.welcomeText}>
            {isLogin ? 'Connexion Client' : 'Inscription Client'}
          </Text>
          
          {/* Shopping Bag Image */}
          <View style={styles.imageContainer}>
            <View style={styles.imagePlaceholder}>
              <MaterialIcons name="shopping-bag" size={80} color="#2d5a27" />
            </View>
          </View>
          
          {/* Auth Options */}
          <View style={styles.authContainer}>
            {/* Google Login Button */}
            <TouchableOpacity style={styles.googleButton} onPress={handleGoogleLogin}>
              <View style={styles.googleIcon}>
                <Text style={styles.googleG}>G</Text>
              </View>
              <Text style={styles.googleButtonText}>Se connecter avec Google</Text>
            </TouchableOpacity>
            
            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>Ou</Text>
              <View style={styles.dividerLine} />
            </View>
            
            {/* Name Input (only for signup) */}
            {!isLogin && (
              <View style={styles.inputContainer}>
                <MaterialIcons name="person" size={20} color="#666" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Nom complet"
                  placeholderTextColor="#666"
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                />
              </View>
            )}
            
            {/* Email/Phone Toggle */}
            <View style={styles.toggleContainer}>
              <TouchableOpacity 
                style={[styles.toggleOption, !usePhone && styles.toggleOptionActive]} 
                onPress={() => setUsePhone(false)}
              >
                <Text style={[styles.toggleText, !usePhone && styles.toggleTextActive]}>Email</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.toggleOption, usePhone && styles.toggleOptionActive]} 
                onPress={() => setUsePhone(true)}
              >
                <Text style={[styles.toggleText, usePhone && styles.toggleTextActive]}>Téléphone</Text>
              </TouchableOpacity>
            </View>

            {/* Email/Phone Input */}
            <View style={styles.inputContainer}>
              <MaterialIcons 
                name={usePhone ? "phone" : "email"} 
                size={20} 
                color="#666" 
                style={styles.inputIcon} 
              />
              <TextInput
                style={styles.input}
                placeholder={usePhone ? "Numéro de téléphone" : "Email"}
                placeholderTextColor="#666"
                value={usePhone ? phone : email}
                onChangeText={usePhone ? setPhone : setEmail}
                keyboardType={usePhone ? "phone-pad" : "email-address"}
                autoCapitalize="none"
              />
            </View>
            
          {/* Password Input */}
            <View style={styles.inputContainer}>
              <MaterialIcons name="lock" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Mot de passe"
                placeholderTextColor="#666"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

          {/* Forgot password link */}
          {isLogin && !usePhone && (
            <TouchableOpacity onPress={() => { setShowForgot(true); setForgotEmail(email); }} style={styles.forgotContainer}>
              <Text style={styles.forgotText}>Mot de passe oublié ?</Text>
            </TouchableOpacity>
          )}
            
            {/* Message Display */}
            {message && (
              <Text style={[styles.messageText, message.includes('réussie') ? styles.successMessage : styles.errorMessage]}>
                {message}
              </Text>
            )}

            {/* Submit Button */}
            <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
              <Text style={styles.submitButtonText}>
                {isLogin ? 'Se connecter' : 'S\'inscrire'}
              </Text>
            </TouchableOpacity>
            
          {/* Forgot Password Panel */}
          {showForgot && (
            <View style={styles.forgotPanel}>
              <Text style={styles.forgotTitle}>Réinitialiser le mot de passe</Text>
              <View style={styles.inputContainer}>
                <MaterialIcons name="email" size={20} color="#666" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Votre email"
                  placeholderTextColor="#666"
                  value={forgotEmail}
                  onChangeText={setForgotEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
              <TouchableOpacity style={styles.submitButton} onPress={handleForgotPassword}>
                <Text style={styles.submitButtonText}>Envoyer le lien</Text>
              </TouchableOpacity>
              {!!message && <Text style={styles.infoText}>{message}</Text>}
              <TouchableOpacity style={styles.cancelButton} onPress={() => { setShowForgot(false); setMessage(''); }}>
                <Text style={styles.cancelText}>Annuler</Text>
              </TouchableOpacity>
            </View>
          )}

            {/* Toggle Mode */}
            <TouchableOpacity style={styles.toggleButton} onPress={toggleMode}>
              <Text style={styles.toggleText}>
                {isLogin ? 'Pas de compte ? S\'inscrire' : 'Déjà un compte ? Se connecter'}
              </Text>
            </TouchableOpacity>
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
      paddingHorizontal: 20,
      paddingBottom: 40,
    },
    backButton: {
      position: 'absolute',
      top: 50,
      left: 20,
      zIndex: 10,
      padding: 10,
    },
    welcomeText: {
      fontSize: 24,
      fontWeight: 'bold',
      color: '#000000',
      textAlign: 'center',
      marginTop: 100,
      marginBottom: 30,
    },
    imageContainer: {
      alignItems: 'center',
      marginBottom: 40,
    },
    image: {
      width: 200,
      height: 240,
    },
    imagePlaceholder: {
      width: 200,
      height: 240,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#f5f5f5',
      borderRadius: 20,
    },
    authContainer: {
      paddingHorizontal: 10,
    },
    googleButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#ffffff',
      borderWidth: 1,
      borderColor: '#e0e0e0',
      borderRadius: 12,
      paddingVertical: 15,
      paddingHorizontal: 20,
      marginBottom: 20,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 3,
    },
    googleIcon: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: '#4285f4',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    googleG: {
      color: '#ffffff',
      fontSize: 16,
      fontWeight: 'bold',
    },
    googleButtonText: {
      color: '#000000',
      fontSize: 16,
      fontWeight: '500',
    },
    divider: {
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: 20,
    },
    dividerLine: {
      flex: 1,
      height: 1,
      backgroundColor: '#e0e0e0',
    },
    dividerText: {
      color: '#000000',
      fontSize: 16,
      marginHorizontal: 15,
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#ffffff',
      borderWidth: 1,
      borderColor: '#e0e0e0',
      borderRadius: 12,
      paddingHorizontal: 15,
      marginBottom: 15,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 1,
      },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 2,
    },
    inputIcon: {
      marginRight: 10,
    },
    input: {
      flex: 1,
      paddingVertical: 15,
      fontSize: 16,
      color: '#000000',
    },
    submitButton: {
      backgroundColor: '#2d5a27',
      borderRadius: 12,
      paddingVertical: 15,
      alignItems: 'center',
      marginTop: 10,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 3,
    },
    submitButtonText: {
      color: '#ffffff',
      fontSize: 16,
      fontWeight: 'bold',
    },
    toggleButton: {
      alignItems: 'center',
      marginTop: 20,
    },
    toggleText: {
      color: '#2d5a27',
      fontSize: 14,
      textDecorationLine: 'underline',
    },
    forgotContainer: {
      alignItems: 'flex-end',
      marginBottom: 10,
    },
    forgotText: {
      color: '#2d5a27',
      fontSize: 13,
      textDecorationLine: 'underline',
    },
    forgotPanel: {
      marginTop: 16,
      padding: 12,
      borderWidth: 1,
      borderColor: '#e0e0e0',
      borderRadius: 12,
      backgroundColor: '#fafafa',
    },
    forgotTitle: {
      fontSize: 16,
      fontWeight: '600',
      marginBottom: 8,
      color: '#000',
    },
    infoText: {
      marginTop: 10,
      color: '#2d5a27',
      fontSize: 13,
    },
    cancelButton: {
      alignItems: 'center',
      marginTop: 10,
    },
    cancelText: {
      color: '#666',
      fontSize: 13,
    },
    toggleContainer: {
      flexDirection: 'row',
      backgroundColor: '#f5f5f5',
      borderRadius: 12,
      padding: 4,
      marginBottom: 15,
    },
    toggleOption: {
      flex: 1,
      paddingVertical: 10,
      paddingHorizontal: 15,
      borderRadius: 8,
      alignItems: 'center',
    },
    toggleOptionActive: {
      backgroundColor: '#2d5a27',
    },
    toggleText: {
      fontSize: 14,
      color: '#666',
      fontWeight: '500',
    },
    toggleTextActive: {
      color: '#ffffff',
      fontWeight: '600',
    },
    messageText: {
      fontSize: 14,
      textAlign: 'center',
      marginVertical: 10,
      paddingHorizontal: 10,
    },
    successMessage: {
      color: '#2d5a27',
    },
    errorMessage: {
      color: '#d32f2f',
    },
  });
