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

  WebBrowser.maybeCompleteAuthSession();

  export default function ClientAuthScreen({ onBack, onLoginSuccess }) {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
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

    const handleSubmit = () => {
      if (isLogin) {
        console.log('Login pressed', { email, password });
        onLoginSuccess && onLoginSuccess();
      } else {
        console.log('Signup pressed', { name, email, password });
      }
    };

    const toggleMode = () => {
      setIsLogin(!isLogin);
      setEmail('');
      setPassword('');
      setName('');
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
            
            {/* Email Input */}
            <View style={styles.inputContainer}>
              <MaterialIcons name="email" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="#666"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
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
            
            {/* Submit Button */}
            <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
              <Text style={styles.submitButtonText}>
                {isLogin ? 'Se connecter' : 'S\'inscrire'}
              </Text>
            </TouchableOpacity>
            
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
  });
