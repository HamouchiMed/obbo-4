
import React from 'react';
import { View, Text, StatusBar, TouchableOpacity, StyleSheet, ScrollView, Platform } from 'react-native';
import SafeAreaWrapper from './utils/SafeAreaWrapper';
import { MaterialIcons } from '@expo/vector-icons';

export default function DealerProfileScreen({ onNavigateHome, onNavigateBaskets, onNavigateOrders, onLogout }) {
  return (
    <SafeAreaWrapper style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mon Profil Commerçant</Text>
      </View>
      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: Platform.OS === 'android' ? 140 : 100 }} showsVerticalScrollIndicator={false}>
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <MaterialIcons name="store" size={48} color="#2d5a27" />
          </View>
          <Text style={styles.businessName}>Mon Commerce</Text>
          <Text style={styles.businessType}>Commerce Local</Text>
          <Text style={styles.businessPhone}>+212 6 12 34 56 78</Text>

          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>8</Text>
              <Text style={styles.statLabel}>Paniers actifs</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>23</Text>
              <Text style={styles.statLabel}>Commandes</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>4.8</Text>
              <Text style={styles.statLabel}>Note</Text>
            </View>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity style={styles.primaryButton} onPress={onNavigateBaskets}>
              <MaterialIcons name="shopping-basket" size={20} color="#fff" />
              <Text style={styles.primaryButtonText}>Gérer mes paniers</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryButton} onPress={onLogout}>
              <MaterialIcons name="logout" size={20} color="#ff4d4f" />
              <Text style={styles.secondaryButtonText}>Déconnexion</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.menuList}>
          <TouchableOpacity style={styles.menuItem} onPress={onNavigateOrders}>
            <MaterialIcons name="receipt" size={24} color="#2d5a27" />
            <Text style={styles.menuText}>Mes commandes</Text>
            <MaterialIcons name="chevron-right" size={24} color="#ccc" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={onNavigateBaskets}>
            <MaterialIcons name="inventory-2" size={24} color="#2d5a27" />
            <Text style={styles.menuText}>Mes paniers</Text>
            <MaterialIcons name="chevron-right" size={24} color="#ccc" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={onNavigateHome}>
            <MaterialIcons name="dashboard" size={24} color="#2d5a27" />
            <Text style={styles.menuText}>Tableau de bord</Text>
            <MaterialIcons name="chevron-right" size={24} color="#ccc" />
          </TouchableOpacity>
        </View>
      </ScrollView>

      <View style={styles.bottomHeader}>
        <TouchableOpacity style={styles.headerItem} onPress={onNavigateHome}>
          <MaterialIcons name="home" size={22} color="#2d5a27" />
          <Text style={styles.headerItemText}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.headerItem} onPress={onNavigateBaskets}>
          <MaterialIcons name="shopping-bag" size={22} color="#2d5a27" />
          <Text style={styles.headerItemText}>Paniers</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.headerItem} onPress={onNavigateOrders}>
          <MaterialIcons name="receipt" size={22} color="#2d5a27" />
          <Text style={styles.headerItemText}>Commandes</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.headerItem, styles.activeHeaderItem]}>
          <MaterialIcons name="person" size={22} color="#fff" />
          <Text style={styles.activeHeaderItemText}>Profil</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  profileCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 18,
    padding: 22,
    marginBottom: 22,
    shadowColor: '#2d5a27',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.10,
    shadowRadius: 16,
    elevation: 6,
  },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: '#e8f5e8',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 14,
    borderWidth: 2,
    borderColor: '#2d5a27',
  },
  businessName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#222',
    textAlign: 'center',
    marginTop: 2,
  },
  businessType: {
    fontSize: 15,
    color: '#2d5a27',
    textAlign: 'center',
    marginTop: 2,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  businessPhone: {
    fontSize: 15,
    color: '#2d5a27',
    textAlign: 'center',
    marginTop: 7,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 18,
    marginBottom: 2,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#fff',
    paddingVertical: 14,
    marginHorizontal: 6,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2d5a27',
    shadowColor: '#2d5a27',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2d5a27',
  },
  statLabel: {
    fontSize: 11,
    color: '#666',
    marginTop: 4,
  },
  actions: {
    marginTop: 20,
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#2d5a27',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#2d5a27',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 4,
    elevation: 2,
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
  secondaryButton: {
    backgroundColor: '#fff1f0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  secondaryButtonText: {
    color: '#ff4d4f',
    fontWeight: '700',
  },
  menuList: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2d5a27',
    overflow: 'hidden',
    shadowColor: '#2d5a27',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    marginBottom: 18,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginLeft: 16,
  },
  bottomHeader: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#e8f5e8',
    borderRadius: 500,
    paddingVertical: 12,
    shadowColor: '#2d5a27',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  headerItem: {
    alignItems: 'center',
    gap: 4,
  },
  activeHeaderItem: {
    backgroundColor: '#2d5a27',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  headerItemText: {
    color: '#2d5a27',
    fontWeight: '600',
    fontSize: 12,
  },
  activeHeaderItemText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
  },
});
