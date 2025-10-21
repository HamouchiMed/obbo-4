import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

export default function DealerHomeScreen({ onNavigateBaskets, onNavigateOrders, onNavigateProfile, reservations = [], createdBaskets = [] }) {
  const totalReservations = reservations.length;
  const totalBaskets = createdBaskets.length;
  const rawAvailable = totalBaskets - totalReservations; // can be negative when overbooked
  const availableBaskets = Math.max(rawAvailable, 0);

  const stats = [
    {
      title: 'Paniers créés',
      value: totalBaskets,
      icon: 'shopping-basket',
      color: '#2d5a27',
    },
    {
      title: 'Réservations',
      value: totalReservations,
      icon: 'notifications',
      color: '#ff6b35',
    },
    {
      title: 'Disponibles',
      value: availableBaskets,
      raw: rawAvailable,
      icon: 'check-circle',
      color: '#4caf50',
    },
  ];

  const quickActions = [
    {
      title: 'Mes Paniers',
      subtitle: 'Gérer mes paniers',
      icon: 'shopping-basket',
      color: '#2d5a27',
      onPress: onNavigateBaskets,
    },
    {
      title: 'Commandes',
      subtitle: `${totalReservations} nouvelle(s)`,
      icon: 'notifications',
      color: '#ff6b35',
      onPress: onNavigateOrders,
      badge: totalReservations > 0,
    },
    {
      title: 'Profil',
      subtitle: 'Paramètres du compte',
      icon: 'person',
      color: '#2196f3',
      onPress: onNavigateProfile,
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#2d5a27" />

      <View style={styles.hero}>
        <View style={styles.heroInner}>
          <View>
            <Text style={styles.greeting}>Bonjour 👋</Text>
            <Text style={styles.welcomeText}>Gérez vos paniers et commandes</Text>
          </View>
          <TouchableOpacity style={styles.profileButton} onPress={onNavigateProfile}>
            <MaterialIcons name="store" size={22} color="#2d5a27" />
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.heroStats}>
          {stats.map((s, i) => (
            <View key={i} style={styles.heroStatCard}>
              <View style={[styles.heroStatIcon, { backgroundColor: s.color + '20' }]}>
                <MaterialIcons name={s.icon} size={18} color={s.color} />
              </View>
              <View style={styles.heroStatInfo}>
                {typeof s.raw === 'number' && s.raw < 0 ? (
                  <Text style={[styles.heroStatValue, styles.heroStatValueOverbooked]}>-{Math.abs(s.raw)}</Text>
                ) : (
                  <Text style={styles.heroStatValue}>{s.value}</Text>
                )}
                <Text style={styles.heroStatLabel}>{s.title}</Text>
              </View>
            </View>
          ))}
        </ScrollView>
      </View>

  <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 220 }} showsVerticalScrollIndicator={false}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickActionsRow}>
          {quickActions.map((action, idx) => (
            <TouchableOpacity key={idx} style={styles.quickAction} onPress={action.onPress} activeOpacity={0.85}>
              <View style={[styles.quickActionIcon, { backgroundColor: action.color + '20' }]}>
                <MaterialIcons name={action.icon} size={22} color={action.color} />
              </View>
              <Text style={styles.quickActionTitle}>{action.title}</Text>
              <Text style={styles.quickActionSubtitle}>{action.subtitle}</Text>
              {action.badge && <View style={styles.quickActionBadge}><Text style={styles.quickActionBadgeText}>{totalReservations}</Text></View>}
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionCardTitle}>Activité récente</Text>
          {reservations.length > 0 ? (
            reservations.slice(0,5).map((r, i) => (
              <View key={i} style={styles.activityRow}>
                <View style={styles.avatar}><MaterialIcons name="person" size={18} color="#fff" /></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.activityText}><Text style={{ fontWeight: '700' }}>{r.customerName}</Text> a réservé</Text>
                  <Text style={styles.activityMeta}>{new Date(r.reservedAt).toLocaleString('fr-FR')}</Text>
                </View>
                <Text style={styles.activityStatus}>#{r.id || (i+1)}</Text>
              </View>
            ))
          ) : (
            <View style={styles.emptyStateRow}>
              <MaterialIcons name="inbox" size={36} color="#cfd8cd" />
              <Text style={styles.emptyStateText}>Aucune activité pour le moment</Text>
            </View>
          )}
        </View>
      </ScrollView>

      <View style={styles.bottomHeader}>
        <TouchableOpacity style={[styles.headerItem, styles.activeHeaderItem]}>
          <MaterialIcons name="home" size={22} color="#fff" />
          <Text style={styles.activeHeaderItemText}>Accueil</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.headerItem} onPress={onNavigateBaskets}>
          <MaterialIcons name="shopping-basket" size={22} color="#2d5a27" />
          <Text style={styles.headerItemText}>Mes Paniers</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.headerItem} onPress={onNavigateOrders}>
          <MaterialIcons name="receipt" size={22} color="#2d5a27" />
          <Text style={styles.headerItemText}>Commandes</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.headerItem} onPress={onNavigateProfile}>
          <MaterialIcons name="person" size={22} color="#2d5a27" />
          <Text style={styles.headerItemText}>Profil</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity style={styles.fab} onPress={onNavigateBaskets} activeOpacity={0.9}>
        <MaterialIcons name="add-shopping-cart" size={22} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f7f3',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    paddingTop: 20,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
  },
  welcomeText: {
    fontSize: 14,
    color: '#ecf7ee',
    marginTop: 4,
  },
  profileIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#ffffff66',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hero: {
    backgroundColor: '#2d5a27',
    paddingHorizontal: 16,
    paddingBottom: 20,
    paddingTop: 22,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  heroInner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  profileButton: {
    backgroundColor: '#ecf7ee',
    padding: 8,
    borderRadius: 10,
  },
  heroStats: {
    marginTop: 16,
    flexDirection: 'row',
    gap: 10,
  },
  heroStatCard: {
    flex: 0,
    minWidth: 110,
    backgroundColor: '#ffffff20',
    borderRadius: 12,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  heroStatIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  heroStatInfo: {},
  heroStatValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  heroStatValueOverbooked: {
    color: '#ff6b6b',
  },
  heroStatLabel: {
    fontSize: 10,
    color: '#ecf7ee',
  },
  section: {
    marginBottom: 24,
  },
  sectionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginHorizontal: 0,
    elevation: 2,
  },
  sectionCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2d5a27',
    marginBottom: 12,
  },
  quickActionsRow: {
    flexDirection: 'row',
    paddingHorizontal: 2,
    marginTop: 12,
    marginBottom: 18,
  },
  quickAction: {
    flex: 0,
    minWidth: 140,
    maxWidth: 220,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginRight: 12,
    alignItems: 'flex-start',
  },
  quickActionIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  quickActionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#333',
    flexShrink: 1,
    flexWrap: 'wrap',
  },
  quickActionSubtitle: {
    fontSize: 11,
    color: '#777',
    marginTop: 4,
    flexWrap: 'wrap',
  },
  quickActionBadge: {
    position: 'absolute',
    top: 8,
    right: 10,
    backgroundColor: '#ff4444',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  quickActionBadgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f2',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#2d5a27',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  activityText: { fontSize: 14, color: '#222', flexWrap: 'wrap' },
  activityMeta: { fontSize: 12, color: '#777', marginTop: 2 },
  activityStatus: { fontSize: 12, color: '#999' },
  emptyStateRow: { alignItems: 'center', padding: 28 },
  emptyStateText: { color: '#8a8f85', marginTop: 8 },
  fab: {
    position: 'absolute',
    right: 22,
    bottom: 140,
    backgroundColor: '#2d5a27',
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 12,
    zIndex: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 12,
  },
  bottomHeader: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#dcefe0',
    borderRadius: 500,
    paddingVertical: 10,
    zIndex: 10,
    elevation: 8,
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
  notificationBadge: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: '#ff4444',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
});
