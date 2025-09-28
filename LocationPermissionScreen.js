import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, SafeAreaView, StatusBar, Alert, ScrollView } from 'react-native';
import * as Location from 'expo-location';

export default function LocationPermissionScreen({ onBack, onGranted, onSkip }) {
  const [requesting, setRequesting] = useState(false);

  const requestPermission = async () => {
    try {
      setRequesting(true);4
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission refusée', "Nous avons besoin de la localisation pour afficher les offres proches.");
        setRequesting(false);
        return;
      }
      const position = await Location.getCurrentPositionAsync({});
      setRequesting(false);
      onGranted?.(position);
    } catch (e) {
      setRequesting(false);
      Alert.alert('Erreur', 'Impossible de récupérer la localisation.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Localise-moi pour trouver les offres autour de toi</Text>

        <View style={styles.imageContainer}>
          <Image source={require('./assets/obbo.png')} style={styles.image} resizeMode="contain" />
        </View>

        <Text style={styles.subtitle}>Obbo utilise ta position pour afficher les paniers à proximité.</Text>

        <TouchableOpacity style={styles.enableButton} onPress={requestPermission} disabled={requesting}>
          <Text style={styles.enableText}>{requesting ? 'Activation…' : 'Activer la localisation'}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={onSkip}>
          <Text style={styles.laterText}>je la renseignerai plus tard</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 24,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginTop: 60,
  },
  imageContainer: {
    alignItems: 'center',
    marginVertical: 24,
  },
  image: {
    width: 260,
    height: 260,
  },
  subtitle: {
    fontSize: 16,
    color: '#000',
    marginBottom: 24,
  },
  enableButton: {
    backgroundColor: '#2d5a27',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  enableText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  laterText: {
    textAlign: 'center',
    marginTop: 18,
    fontSize: 16,
    color: '#000',
  },
});


