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
    
    // Show success message and navigate to basket creation
    Alert.alert(
      'Inscription réussie!', 
      'Votre compte commerçant a été créé. Vous pouvez maintenant créer votre premier panier.',
      [
        {
          text: 'Créer un panier',
          onPress: () => onBasketCreation?.(),
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      <TouchableOpacity style={styles.backButton} onPress={onBack}>
        <MaterialIcons name="arrow-back" size={24} color="#2d5a27" />
      </TouchableOpacity>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Inscription Commerçant</Text>

        <View style={styles.logoRow}>
          <TouchableOpacity style={styles.logoButton} onPress={pickLogo}>
            {logoUri ? (
              <Image source={{ uri: logoUri }} style={styles.logoPreview} />
            ) : (
              <>
                <MaterialIcons name="add" size={24} color="#2d5a27" />
                <Text style={styles.logoText}>Logo</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
        <View style={styles.underlineInput}>
          <TextInput
            style={styles.underlineText}
            placeholder="Type de commerce"
            value={businessType}
            onChangeText={setBusinessType}
            placeholderTextColor="#444"
          />
        </View>

        <View style={styles.underlineInput}>
          <TextInput
            style={styles.underlineText}
            placeholder="Adresse Compete"
            value={address}
            onChangeText={setAddress}
            placeholderTextColor="#444"
          />
        </View>

        <View style={styles.underlineInput}>
          <TextInput
            style={styles.underlineText}
            placeholder="E-mail Professionnel"
            value={email}
            onChangeText={setEmail}
            placeholderTextColor="#444"
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.underlineInput}>
          <TextInput
            style={styles.underlineText}
            placeholder="Numéro de telephone"
            value={phone}
            onChangeText={setPhone}
            placeholderTextColor="#444"
            keyboardType="phone-pad"
          />
        </View>

        <View style={styles.underlineInput}>
          <TextInput
            style={styles.underlineText}
            placeholder="Nom du responsable"
            value={managerName}
            onChangeText={setManagerName}
            placeholderTextColor="#444"
          />
        </View>

        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitText}>S'inscrire</Text>
        </TouchableOpacity>

        <Text style={styles.footerText} onPress={onGoToLogin}>Déjà un compte ? Se connecter</Text>
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'left',
    marginTop: 100,
    marginBottom: 30,
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
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#2d5a27',
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  logoPreview: {
    width: 40,
    height: 40,
    borderRadius: 8,
  },
  logoText: {
    marginLeft: 6,
    color: '#2d5a27',
    fontSize: 16,
    fontWeight: '600',
  },
  underlineInput: {
    borderBottomWidth: 2,
    borderColor: '#cfcfcf',
    marginTop: 24,
  },
  underlineText: {
    fontSize: 20,
    paddingVertical: 10,
    color: '#000',
  },
  submitButton: {
    backgroundColor: '#1f5a2d',
    marginTop: 40,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    elevation: 3,
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
});


