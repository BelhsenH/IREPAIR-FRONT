import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

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
  inputBorder: '#D1D5DB',
  headerGradient: ['#1E3A8A', '#3B82F6'] as const,
};

const services = [
  "Oil Change",
  'Tire Services',
  'Brake Repair',
  'Engine Diagnostics',
  'Car Wash',
  'Body Repair',
  'Battery Replacement',
];

const EditProfile = () => {
  const { language, translations } = useLanguage();
  const { user, updateUser } = useAuth();
  const router = useRouter();
  
  const [garageName, setGarageName] = useState(user?.nomGarage || '');
  const [managerName, setManagerName] = useState(user?.nomResponsable || '');
  const [location, setLocation] = useState(user?.adresse || user?.zoneGeo || '');
  const [contact, setContact] = useState(user?.phoneNumber || '');
  const [email, setEmail] = useState(user?.email || '');
  const [error, setError] = useState<string | null>(null);

  const [selectedServices, setSelectedServices] = useState<string[]>(user?.typeService || [services[0]]);

  useEffect(() => {
    if (user) {
      setGarageName(user.nomGarage || '');
      setManagerName(user.nomResponsable || '');
      setLocation(user.adresse || user.zoneGeo || '');
      setContact(user.phoneNumber || '');
      setEmail(user.email || '');
      setSelectedServices(user.typeService || [services[0]]);
    }
  }, [user]);

  const handleServiceToggle = (service: string) => {
    setSelectedServices(prev => {
      if (prev.includes(service)) {
        return prev.filter(s => s !== service);
      } else {
        return [...prev, service];
      }
    });
  };

  const handleSave = async () => {
    if (!garageName || !managerName || !location || !contact || !email) {
      setError(translations[language].fillAllFields);
      return;
    }

    if (selectedServices.length === 0) {
      setError(translations[language].selectServices);
      return;
    }

    try {
      setError(null);
      
      if (user) {
        const updatedUser = {
          ...user,
          nomGarage: garageName,
          nomResponsable: managerName,
          adresse: location,
          phoneNumber: contact,
          email: email,
          typeService: selectedServices,
        };

        await updateUser(updatedUser);
        
        Alert.alert(
          translations[language].success,
          translations[language].successProfileUpdate,
          [{ text: translations[language].ok, onPress: () => router.push('/(home)/dashboard') }]
        );
      }
    } catch (error) {
      setError(translations[language].profileUpdateFailed);
      console.error('Profile update error:', error);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />
        
        {/* Enhanced Header */}
        <LinearGradient
          colors={Colors.headerGradient}
          style={styles.header}
        >
          <TouchableOpacity onPress={() => router.push('/(home)/dashboard')} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={Colors.surface} />
          </TouchableOpacity>
          <Text style={styles.title}>
            {translations[language].editProfileTitle}
          </Text>
          <View style={styles.headerSpacer} />
        </LinearGradient>

        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={0}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {error && (
              <View style={styles.errorContainer}>
                <Ionicons name="warning" size={20} color={Colors.danger} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* Profile Header Card */}
            <View style={styles.profileHeaderCard}>
              <LinearGradient
                colors={[Colors.accent, '#FBBF24']}
                style={styles.profileHeaderGradient}
              >
                <View style={styles.profileAvatar}>
                  <Ionicons name="business" size={40} color={Colors.surface} />
                </View>
                <Text style={styles.profileHeaderTitle}>{translations[language].garageProfile}</Text>
                <Text style={styles.profileHeaderSubtitle}>{translations[language].updateGarageInfo}</Text>
              </LinearGradient>
            </View>

            <View style={styles.form}>
              {/* Basic Information Section */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  <Ionicons name="information-circle" size={18} color={Colors.primary} /> {translations[language].basicInformation}
                </Text>
                
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>
                    <Ionicons name="storefront" size={16} color={Colors.secondary} /> {translations[language].garageName}
                  </Text>
                  <TextInput
                    style={styles.input}
                    placeholder={translations[language].garageNamePlaceholder}
                    value={garageName}
                    onChangeText={setGarageName}
                    placeholderTextColor={Colors.textLight}
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>
                    <Ionicons name="person" size={16} color={Colors.secondary} /> 
                    {translations[language].managerName}
                  </Text>
                  <TextInput
                    style={styles.input}
                    placeholder={translations[language].managerNamePlaceholder}
                    value={managerName}
                    onChangeText={setManagerName}
                    placeholderTextColor={Colors.textLight}
                  />
                </View>
              </View>

              {/* Contact Information Section */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  <Ionicons name="call" size={18} color={Colors.primary} /> {translations[language].contactInformation}
                </Text>
                
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>
                    <Ionicons name="location" size={16} color={Colors.secondary} /> {translations[language].location}
                  </Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder={translations[language].locationPlaceholder}
                    value={location}
                    onChangeText={setLocation}
                    multiline
                    numberOfLines={2}
                    placeholderTextColor={Colors.textLight}
                  />
                </View>
                
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>
                    <Ionicons name="call" size={16} color={Colors.secondary} /> {translations[language].contactNumber}
                  </Text>
                  <TextInput
                    style={styles.input}
                    placeholder={translations[language].contactPlaceholder}
                    keyboardType="phone-pad"
                    value={contact}
                    onChangeText={setContact}
                    placeholderTextColor={Colors.textLight}
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>
                    <Ionicons name="mail" size={16} color={Colors.secondary} /> {translations[language].email}
                  </Text>
                  <TextInput
                    style={styles.input}
                    placeholder={translations[language].emailPlaceholder}
                    keyboardType="email-address"
                    value={email}
                    onChangeText={setEmail}
                    placeholderTextColor={Colors.textLight}
                  />
                </View>
              </View>

              {/* Services Section */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  <Ionicons name="construct" size={18} color={Colors.primary} /> {translations[language].servicesOffered}
                </Text>
                <Text style={styles.sectionSubtitle}>{translations[language].selectServicesDescription}</Text>
                
                <View style={styles.servicesGrid}>
                  {services.map((service) => (
                    <TouchableOpacity
                      key={service}
                      style={[
                        styles.serviceItem,
                        selectedServices.includes(service) && styles.serviceItemSelected
                      ]}
                      onPress={() => handleServiceToggle(service)}
                    >
                      <View style={[
                        styles.serviceIcon,
                        selectedServices.includes(service) && styles.serviceIconSelected
                      ]}>
                        <Ionicons 
                          name={selectedServices.includes(service) ? 'checkmark' : 'add'} 
                          size={16} 
                          color={selectedServices.includes(service) ? Colors.surface : Colors.secondary} 
                        />
                      </View>
                      <Text style={[
                        styles.serviceText,
                        selectedServices.includes(service) && styles.serviceTextSelected
                      ]}>
                        {service}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Action Buttons */}
              <View style={styles.buttonContainer}>
                <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                  <LinearGradient
                    colors={[Colors.primary, Colors.secondary]}
                    style={styles.buttonGradient}
                  >
                    <Ionicons name="checkmark-circle" size={20} color={Colors.surface} />
                    <Text style={styles.saveButtonText}>
                      {translations[language].saveChanges}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => router.push('/(home)/dashboard')}
                >
                  <Ionicons name="close-circle" size={20} color={Colors.danger} />
                  <Text style={styles.cancelButtonText}>
                    {translations[language].cancel}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.surface,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  headerSpacer: {
    width: 44,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  errorContainer: {
    flexDirection: 'row',
    backgroundColor: '#FEE2E2',
    padding: 16,
    marginHorizontal: 20,
    marginVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  errorText: {
    color: Colors.danger,
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  profileHeaderCard: {
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 24,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  profileHeaderGradient: {
    padding: 24,
    alignItems: 'center',
  },
  profileAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  profileHeaderTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.surface,
    marginBottom: 4,
  },
  profileHeaderSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  form: {
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    backgroundColor: Colors.surface,
    color: Colors.textPrimary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
    paddingTop: 14,
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  serviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    flexBasis: '47%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  serviceItemSelected: {
    backgroundColor: '#DBEAFE',
    borderColor: Colors.secondary,
  },
  serviceIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  serviceIconSelected: {
    backgroundColor: Colors.secondary,
  },
  serviceText: {
    fontSize: 14,
    color: Colors.textPrimary,
    fontWeight: '500',
    flex: 1,
  },
  serviceTextSelected: {
    color: Colors.secondary,
    fontWeight: '600',
  },
  buttonContainer: {
    marginTop: 32,
    gap: 16,
  },
  saveButton: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  saveButtonText: {
    color: Colors.surface,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.danger,
  },
  cancelButtonText: {
    color: Colors.danger,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  // Legacy styles for compatibility
  image: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '30%',
    opacity: 0.2,
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '30%',
  },
  servicesContainer: {
    marginBottom: 24,
  },
  button: {
    backgroundColor: Colors.secondary,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.surface,
  },
});

export default EditProfile;