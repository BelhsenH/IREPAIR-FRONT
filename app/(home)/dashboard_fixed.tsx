import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, SafeAreaView, StatusBar, Platform } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

// Professional color palette for mechanics
const Colors = {
  primary: '#1E3A8A', // Deep blue
  secondary: '#3B82F6', // Bright blue
  accent: '#F59E0B', // Amber/orange
  background: '#F8FAFC', // Light gray
  surface: '#FFFFFF',
  cardBackground: '#FFFFFF',
  textPrimary: '#1F2937',
  textSecondary: '#6B7280',
  textLight: '#9CA3AF',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  border: '#E5E7EB',
  sidebarBackground: '#F8FAFC',
  headerGradient: ['#1E3A8A', '#3B82F6'] as const,
};

const Dashboard = () => {
  const { language, translations, toggleLanguage } = useLanguage();
  const { user, fetchUserProfile, logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const isRTL = language === 'ar';

  useEffect(() => {
    if (!user) {
      fetchUserProfile();
    }
  }, [user, fetchUserProfile]);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleLogout = async () => {
    Alert.alert(
      translations[language].logout,
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/(auth)/Login');
          }
        }
      ]
    );
  };

  const closeSidebar = () => {
    if (isSidebarOpen) {
      setIsSidebarOpen(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />
      
      {/* Overlay for sidebar */}
      {isSidebarOpen && (
        <TouchableOpacity 
          style={styles.overlay} 
          activeOpacity={1} 
          onPress={closeSidebar}
        />
      )}

      {/* Enhanced Sidebar - Only visible when open */}
      {isSidebarOpen && (
        <View style={[
          styles.sidebar, 
          { 
            width: '80%', 
            [isRTL ? 'right' : 'left']: 0,
          }
        ]}>
          <LinearGradient
            colors={[Colors.primary, Colors.secondary]}
            style={styles.sidebarHeader}
          >
            <View style={styles.sidebarUserInfo}>
              <View style={styles.userAvatar}>
                <Ionicons name="person" size={32} color={Colors.surface} />
              </View>
              <Text style={styles.sidebarUserName}>
                {user?.nomGarage || 'Garage Name'}
              </Text>
              <Text style={styles.sidebarUserRole}>
                {translations[language].managerName || 'Manager'}
              </Text>
            </View>
          </LinearGradient>
          
          <ScrollView contentContainerStyle={styles.sidebarContent}>
            <TouchableOpacity style={styles.sidebarItem} onPress={() => router.push('/service-management')}>
              <View style={styles.sidebarIconContainer}>
                <Ionicons name="build" size={22} color={Colors.secondary} />
              </View>
              <Text style={[styles.sidebarText, { textAlign: isRTL ? 'right' : 'left' }]}>
                {translations[language].serviceManagement}
              </Text>
              <Ionicons name="chevron-forward" size={18} color={Colors.textLight} />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.sidebarItem} onPress={() => router.push('/my-services')}>
              <View style={styles.sidebarIconContainer}>
                <Ionicons name="list" size={22} color={Colors.secondary} />
              </View>
              <Text style={[styles.sidebarText, { textAlign: isRTL ? 'right' : 'left' }]}>
                {translations[language].myServices}
              </Text>
              <Ionicons name="chevron-forward" size={18} color={Colors.textLight} />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.sidebarItem} onPress={() => console.log('Navigate to service requests')}>
              <View style={styles.sidebarIconContainer}>
                <Ionicons name="clipboard" size={22} color={Colors.secondary} />
              </View>
              <Text style={[styles.sidebarText, { textAlign: isRTL ? 'right' : 'left' }]}>
                {translations[language].serviceRequests}
              </Text>
              <Ionicons name="chevron-forward" size={18} color={Colors.textLight} />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.sidebarItem} onPress={() => console.log('Navigate to parts inventory')}>
              <View style={styles.sidebarIconContainer}>
                <Ionicons name="cube" size={22} color={Colors.secondary} />
              </View>
              <Text style={[styles.sidebarText, { textAlign: isRTL ? 'right' : 'left' }]}>
                {translations[language].partsInventory}
              </Text>
              <Ionicons name="chevron-forward" size={18} color={Colors.textLight} />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.sidebarItem} onPress={() => console.log('Navigate to appointments')}>
              <View style={styles.sidebarIconContainer}>
                <Ionicons name="calendar" size={22} color={Colors.secondary} />
              </View>
              <Text style={[styles.sidebarText, { textAlign: isRTL ? 'right' : 'left' }]}>
                {translations[language].appointments}
              </Text>
              <Ionicons name="chevron-forward" size={18} color={Colors.textLight} />
            </TouchableOpacity>
            
            <View style={styles.sidebarDivider} />
            
            <TouchableOpacity style={styles.sidebarItem} onPress={() => router.push('/(home)/edit-profile')}>
              <View style={styles.sidebarIconContainer}>
                <Ionicons name="person-circle" size={22} color={Colors.secondary} />
              </View>
              <Text style={[styles.sidebarText, { textAlign: isRTL ? 'right' : 'left' }]}>
                {translations[language].profile}
              </Text>
              <Ionicons name="chevron-forward" size={18} color={Colors.textLight} />
            </TouchableOpacity>
            
            <TouchableOpacity style={[styles.sidebarItem, styles.logoutItem]} onPress={handleLogout}>
              <View style={styles.sidebarIconContainer}>
                <Ionicons name="log-out" size={22} color={Colors.danger} />
              </View>
              <Text style={[styles.sidebarText, { color: Colors.danger, textAlign: isRTL ? 'right' : 'left' }]}>
                {translations[language].logout}
              </Text>
              <Ionicons name="chevron-forward" size={18} color={Colors.danger} />
            </TouchableOpacity>
          </ScrollView>
        </View>
      )}

      {/* Enhanced Header */}
      <LinearGradient
        colors={Colors.headerGradient}
        style={styles.header}
      >
        <TouchableOpacity style={styles.menuButton} onPress={toggleSidebar}>
          <Ionicons name={isSidebarOpen ? 'close' : 'menu'} size={28} color={Colors.surface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {translations[language].dashboard}
        </Text>
        <TouchableOpacity style={styles.languageToggle} onPress={toggleLanguage}>
          <Text style={styles.languageText}>
            {language === 'fr' ? 'عربي' : 'Français'}
          </Text>
        </TouchableOpacity>
      </LinearGradient>

      {/* Enhanced Main Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Overview Card */}
        <View style={styles.profileContainer}>
          <Text style={[styles.sectionTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
            {translations[language].profileTitle}
          </Text>
          <View style={styles.profileCard}>
            <LinearGradient
              colors={[Colors.accent, '#FDB85C']}
              style={styles.profileGradient}
            >
              <View style={styles.profileHeader}>
                <View style={styles.profileAvatarLarge}>
                  <Ionicons name="business" size={32} color={Colors.surface} />
                </View>
                <View style={styles.profileHeaderText}>
                  <Text style={styles.profileName}>
                    {user?.nomGarage || 'Garage Name'}
                  </Text>
                  <Text style={styles.profileSubtitle}>
                    {translations[language].managerName}: {user?.nomResponsable || 'Manager'}
                  </Text>
                </View>
              </View>
            </LinearGradient>
            
            <View style={styles.profileDetails}>
              <View style={styles.profileDetailRow}>
                <Ionicons name="location" size={18} color={Colors.secondary} />
                <Text style={styles.profileDetailText}>
                  {user?.adresse || user?.zoneGeo || 'Location'}
                </Text>
              </View>
              <View style={styles.profileDetailRow}>
                <Ionicons name="call" size={18} color={Colors.secondary} />
                <Text style={styles.profileDetailText}>
                  {user?.phoneNumber || 'Phone'}
                </Text>
              </View>
              <View style={styles.profileDetailRow}>
                <Ionicons name="construct" size={18} color={Colors.secondary} />
                <Text style={styles.profileDetailText}>
                  {user?.typeService?.join(', ') || 'Services'}
                </Text>
              </View>
            </View>
            
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => router.push('/(home)/edit-profile')}
            >
              <Ionicons name="create" size={18} color={Colors.surface} />
              <Text style={styles.editButtonText}>
                {translations[language].editProfile}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Map Section */}
        {user?.geolocation && (
          <View style={styles.mapContainer}>
            <Text style={[styles.sectionTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
              <Ionicons name="map" size={20} color={Colors.primary} /> {translations[language].mapLocation}
            </Text>
            <View style={styles.mapCard}>
              <MapView
                style={styles.map}
                region={{
                  latitude: user.geolocation.lat,
                  longitude: user.geolocation.lng,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                }}
                showsUserLocation={false}
                scrollEnabled={false}
                zoomEnabled={false}
                pitchEnabled={false}
                rotateEnabled={false}
              >
                <Marker
                  coordinate={{
                    latitude: user.geolocation.lat,
                    longitude: user.geolocation.lng,
                  }}
                  title={user.nomGarage}
                  description={user.adresse || user.zoneGeo}
                />
              </MapView>
            </View>
          </View>
        )}

        {/* Quick Actions Grid */}
        <View style={styles.quickActions}>
          <Text style={[styles.sectionTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
            <Ionicons name="flash" size={20} color={Colors.primary} /> {translations[language].quickActions}
          </Text>
          <View style={styles.actionGrid}>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/service-management')}
            >
              <LinearGradient
                colors={[Colors.primary, Colors.secondary]}
                style={styles.actionIconContainer}
              >
                <Ionicons name="build" size={28} color={Colors.surface} />
              </LinearGradient>
              <Text style={styles.actionTitle}>
                {translations[language].serviceManagement}
              </Text>
              <Text style={styles.actionSubtitle}>Manage your services</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/my-services')}
            >
              <LinearGradient
                colors={[Colors.success, '#34D399']}
                style={styles.actionIconContainer}
              >
                <Ionicons name="list" size={28} color={Colors.surface} />
              </LinearGradient>
              <Text style={styles.actionTitle}>
                {translations[language].myServices}
              </Text>
              <Text style={styles.actionSubtitle}>View all services</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => console.log('Navigate to appointments')}
            >
              <LinearGradient
                colors={[Colors.warning, '#FBBF24']}
                style={styles.actionIconContainer}
              >
                <Ionicons name="calendar" size={28} color={Colors.surface} />
              </LinearGradient>
              <Text style={styles.actionTitle}>
                {translations[language].appointments}
              </Text>
              <Text style={styles.actionSubtitle}>Schedule & manage</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => console.log('Navigate to analytics')}
            >
              <LinearGradient
                colors={['#8B5CF6', '#A78BFA']}
                style={styles.actionIconContainer}
              >
                <Ionicons name="analytics" size={28} color={Colors.surface} />
              </LinearGradient>
              <Text style={styles.actionTitle}>Analytics</Text>
              <Text style={styles.actionSubtitle}>View performance</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// Enhanced Styles
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    zIndex: 2,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.surface,
    textAlign: 'center',
    flex: 1,
  },
  menuButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  languageToggle: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    minWidth: 80,
    alignItems: 'center',
  },
  languageText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.surface,
  },
  sidebar: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    backgroundColor: Colors.sidebarBackground,
    zIndex: 3,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  sidebarHeader: {
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  sidebarUserInfo: {
    alignItems: 'center',
  },
  userAvatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  sidebarUserName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.surface,
    textAlign: 'center',
    marginBottom: 4,
  },
  sidebarUserRole: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  sidebarContent: {
    paddingVertical: 10,
  },
  sidebarItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginHorizontal: 12,
    borderRadius: 12,
    marginBottom: 4,
  },
  sidebarIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sidebarText: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
    marginRight: 8,
  },
  sidebarDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginHorizontal: 20,
    marginVertical: 12,
  },
  logoutItem: {
    marginTop: 8,
  },
  content: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: 20,
  },
  profileContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginBottom: 16,
    marginTop: 16,
  },
  profileCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  profileGradient: {
    padding: 20,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileAvatarLarge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  profileHeaderText: {
    flex: 1,
  },
  profileName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.surface,
    marginBottom: 4,
  },
  profileSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  profileDetails: {
    padding: 20,
  },
  profileDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  profileDetailText: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginLeft: 12,
    flex: 1,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
  },
  editButtonText: {
    color: Colors.surface,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  mapContainer: {
    marginBottom: 24,
  },
  mapCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  map: {
    height: 200,
    width: '100%',
  },
  quickActions: {
    marginBottom: 32,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCard: {
    width: '48%',
    backgroundColor: Colors.cardBackground,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 4,
  },
  actionSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});

export default Dashboard;
