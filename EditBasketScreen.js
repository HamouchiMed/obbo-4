import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, StatusBar, TouchableOpacity, TextInput, Alert, Image } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

export default function EditBasketScreen({ onBack, basket, onBasketUpdated }) {
  const [basketName, setBasketName] = useState('');
  const [price, setPrice] = useState('');
  const [collectionDate, setCollectionDate] = useState('');
  const [collectionTime, setCollectionTime] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);

  // Initialize form with existing basket data
  useEffect(() => {
    if (basket) {
      const basketData = basket.basketData || basket;
      setBasketName(basketData.name || '');
      setPrice(basketData.price?.toString() || '');
      setCollectionDate(basketData.collectionDate || '');
      setCollectionTime(basketData.collectionTime || '');
      setSelectedImage(basketData.image || null);
    }
  }, [basket]);

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

  const handleUpdateBasket = () => {
    if (!basketName.trim()) {
      Alert.alert('Erreur', 'Veuillez saisir le nom du panier.');
      return;
    }
    if (!price.trim()) {
      Alert.alert('Erreur', 'Veuillez saisir le prix du panier.');
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

    const updatedBasketData = {
      name: basketName.trim(),
      price: parseFloat(price),
      collectionDate: collectionDate.trim(),
      collectionTime: collectionTime.trim(),
      image: selectedImage,
      updatedAt: new Date(),
    };

    onBasketUpdated?.(basket.id, updatedBasketData);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Modifier le panier</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nom du panier</Text>
            <TextInput
              style={styles.input}
              value={basketName}
              onChangeText={setBasketName}
              placeholder=""
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Prix</Text>
            <TextInput
              style={styles.input}
              value={price}
              onChangeText={setPrice}
              placeholder=""
              placeholderTextColor="#999"
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Date de collecte</Text>
            <TextInput
              style={styles.input}
              value={collectionDate}
              onChangeText={setCollectionDate}
              placeholder=""
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Heure de collecte</Text>
            <TextInput
              style={styles.input}
              value={collectionTime}
              onChangeText={setCollectionTime}
              placeholder=""
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.imageSection}>
            <Text style={styles.label}>Ajouter une photo</Text>
            <TouchableOpacity style={styles.imageButton} onPress={handleImagePicker}>
              {selectedImage ? (
                <View style={styles.imagePreview}>
                  <Image source={{ uri: selectedImage.uri }} style={styles.previewImage} />
                  <View style={styles.imageOverlay}>
                    <MaterialIcons name="check-circle" size={24} color="#2d5a27" />
                    <Text style={styles.imageText}>Photo ajoutée</Text>
                  </View>
                </View>
              ) : (
                <View style={styles.imagePlaceholder}>
                  <MaterialIcons name="camera-alt" size={32} color="#000" />
                  <Text style={styles.placeholderText}>Appuyez pour ajouter une photo</Text>
                  <Text style={styles.placeholderSubtext}>Caméra ou Galerie</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={styles.updateButton} onPress={handleUpdateBasket}>
          <Text style={styles.updateButtonText}>Mettre à jour le panier</Text>
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
    paddingHorizontal: 16,
    paddingVertical: 20,
    paddingTop: 50,
  },
  backButton: {
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  form: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 18,
    color: '#333',
    backgroundColor: '#fff',
    marginTop: 8,
  },
  imageSection: {
    marginBottom: 20,
  },
  imageButton: {
    width: '100%',
    height: 120,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    marginTop: 8,
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
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
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
  updateButton: {
    backgroundColor: '#2d5a27',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  updateButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

