import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, StatusBar, TouchableOpacity, TextInput, Alert, Image, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

export default function CreateBasketScreen({ onBack, onBasketCreated, dealerProfile }) {
  const [basketName, setBasketName] = useState('');
  const [price, setPrice] = useState('');
  const [collectionDate, setCollectionDate] = useState('');
  const [collectionTime, setCollectionTime] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);

  const handleImagePicker = async () => {
    try {
      // Request both camera and media library permissions
      const [cameraStatus, mediaLibraryStatus] = await Promise.all([
        ImagePicker.requestCameraPermissionsAsync(),
        ImagePicker.requestMediaLibraryPermissionsAsync()
      ]);

      if (cameraStatus.status !== 'granted' && mediaLibraryStatus.status !== 'granted') {
        Alert.alert('Permission requise', 'Nous avons besoin de l\'accès à votre caméra et galerie pour ajouter une image au panier.');
        return;
      }

      // Show action sheet to choose between camera and gallery
      Alert.alert(
        'Choisir une image',
        'Comment souhaitez-vous ajouter une image ?',
        [
          {
            text: 'Appareil photo',
            onPress: () => launchCamera(),
          },
          {
            text: 'Galerie',
            onPress: () => launchImageLibrary(),
          },
          {
            text: 'Annuler',
            style: 'cancel',
          },
        ]
      );
    } catch (error) {
      Alert.alert('Erreur', 'Impossible d\'accéder aux permissions.');
    }
  };

  const launchCamera = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (!result.canceled) {
        setSelectedImage(result.assets[0]);
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible d\'utiliser l\'appareil photo.');
    }
  };

  const launchImageLibrary = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (!result.canceled) {
        setSelectedImage(result.assets[0]);
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible d\'accéder à la galerie.');
    }
  };

  const handleCreateBasket = () => {
    if (!basketName.trim()) {
      Alert.alert('Erreur', 'Veuillez saisir le nom du panier.');
      return;
    }
    if (!price.trim()) {
      Alert.alert('Erreur', 'Veuillez saisir le prix du panier.');
      return;
    }
    // Normalize price: replace comma with dot and parse
    const normalizedPrice = parseFloat(price.replace(',', '.'));
    if (Number.isNaN(normalizedPrice) || normalizedPrice < 0) {
      Alert.alert('Erreur', 'Prix invalide. Utilisez un nombre (ex: 19.99).');
      return;
    }
    if (!collectionDate.trim()) {
      Alert.alert('Erreur', 'Veuillez saisir la date de collecte.');
      return;
    }
    if (!collectionTime.trim()) {
      Alert.alert('Erreur', 'Veuillez saisir l\'heure de collecte.');
      return;
    }

    const basketData = {
      name: basketName.trim(),
      price: normalizedPrice,
      collectionDate: collectionDate.trim(),
      collectionTime: collectionTime.trim(),
      image: selectedImage,
      createdAt: new Date(),
    };

  onBasketCreated?.(basketData);

  // Send realtime notification to backend so admin web receives it
  (async ()=>{
    try{
      // on Android emulator use 10.0.2.2 to reach host machine
      const serverHost = Platform.OS === 'android' ? 'http://10.0.2.2:5000' : 'http://localhost:5000';
      await fetch(serverHost + '/api/realtime/emit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'new-basket',
          data: {
            name: basketData.name,
            price: basketData.price,
            collectionDate: basketData.collectionDate,
            collectionTime: basketData.collectionTime,
            createdAt: basketData.createdAt,
            dealer: {
              name: dealerProfile?.profile?.businessName || dealerProfile?.name || 'Unknown',
              email: dealerProfile?.email || ''
            }
          },
          room: 'admin'
        })
      });
    }catch(err){
      console.warn('Failed to notify backend about new basket', err);
    }
  })();
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="#1f2f1d" />
        </TouchableOpacity>
        <View style={styles.headerTitles}>
          <Text style={styles.headerTitle}>Créer un panier</Text>
          <Text style={styles.headerSubtitle}>Attirez les clients avec une offre claire et une belle photo</Text>
        </View>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }} keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.card}>
            <View style={styles.form}>
              <View style={styles.inputGroupRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Nom du panier</Text>
                  <TextInput
                    style={styles.input}
                    value={basketName}
                    onChangeText={setBasketName}
                    placeholder="Ex: Panier gourmand"
                    placeholderTextColor="#bbb"
                  />
                </View>
                <View style={{ width: 12 }} />
                <View style={{ width: 120 }}>
                  <Text style={styles.label}>Prix (DH)</Text>
                  <TextInput
                    style={styles.inputCompact}
                    value={price}
                    onChangeText={setPrice}
                    placeholder="0.00"
                    placeholderTextColor="#bbb"
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <View style={styles.inputGroupRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Date de collecte</Text>
                  <TextInput
                    style={styles.input}
                    value={collectionDate}
                    onChangeText={setCollectionDate}
                    placeholder="JJ/MM/AAAA"
                    placeholderTextColor="#bbb"
                  />
                </View>
                <View style={{ width: 12 }} />
                <View style={{ width: 140 }}>
                  <Text style={styles.label}>Heure</Text>
                  <TextInput
                    style={styles.inputCompact}
                    value={collectionTime}
                    onChangeText={setCollectionTime}
                    placeholder="HH:MM"
                    placeholderTextColor="#bbb"
                  />
                </View>
              </View>

              <View style={styles.imageSection}>
                <Text style={styles.label}>Photo du panier</Text>
                <TouchableOpacity style={styles.imageButton} onPress={handleImagePicker} activeOpacity={0.8}>
                  {selectedImage ? (
                    <View style={styles.imagePreview}>
                      <Image source={{ uri: selectedImage.uri }} style={styles.previewImage} />
                      <View style={styles.imageOverlay}>
                        <MaterialIcons name="check-circle" size={28} color="#fff" />
                      </View>
                    </View>
                  ) : (
                    <View style={styles.imagePlaceholder}>
                      <MaterialIcons name="camera-alt" size={36} color="#7a8b7a" />
                      <Text style={styles.placeholderText}>Ajouter une photo</Text>
                      <Text style={styles.placeholderSubtext}>Appuyez pour choisir</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <View style={{ height: 120 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={styles.createButtonWrap}>
        <TouchableOpacity style={styles.createButton} onPress={handleCreateBasket} activeOpacity={0.9}>
          <Text style={styles.createButtonText}>Publier le panier</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 48,
    paddingBottom: 8,
  },
  backButton: {
    marginRight: 12,
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#f3f8f3',
  },
  headerTitles: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1f2f1d',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#6b7a6b',
    marginTop: 4,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  form: {
    marginBottom: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 0,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: '#23332a',
    backgroundColor: '#f6fbf6',
    marginTop: 6,
    borderColor: 'transparent',
  },
  inputCompact: {
    borderWidth: 0,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#23332a',
    backgroundColor: '#f6fbf6',
    marginTop: 6,
    textAlign: 'center',
  },
  inputGroupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  imageSection: {
    marginBottom: 12,
  },
  imageButton: {
    width: '100%',
    height: 160,
    borderWidth: 1,
    borderColor: '#dfeee0',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fbfdfb',
    marginTop: 8,
    overflow: 'hidden',
    borderStyle: 'dashed',
  },
  imagePlaceholder: {
    alignItems: 'center',
  },
  placeholderText: {
    marginTop: 8,
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  placeholderSubtext: {
    marginTop: 2,
    fontSize: 12,
    color: '#999',
  },
  imagePreview: {
    position: 'relative',
    width: '100%',
    height: '100%',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    borderRadius: 6,
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(31,47,29,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 6,
  },
  imageText: {
    marginTop: 4,
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  createButtonWrap: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 22,
  },
  createButton: {
    backgroundColor: '#2d5a27',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
});
