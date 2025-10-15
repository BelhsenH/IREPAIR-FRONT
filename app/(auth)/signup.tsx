import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Image, Keyboard, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { ModernInput } from '../../components/modern/ModernInput';
import OpenStreetMapView from '../../components/OpenStreetMapView';
import { useLanguage } from '../../contexts/LanguageContext';
import { authService } from '../../scripts/auth-script';

const SignupScreen = () => {
  const { language, translations, toggleLanguage } = useLanguage();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [garageName, setGarageName] = useState('');
  const [geolocation, setGeolocation] = useState('');
  const [managerName, setManagerName] = useState('');
  const [countryCode, setCountryCode] = useState('+213');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [password, setPassword] = useState('');
  const [mapVisible, setMapVisible] = useState(false);
  const [pickedLocation, setPickedLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialRegion, setInitialRegion] = useState({
    latitude: 36.7525,
    longitude: 3.042,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });

  const services = [
    'Vidange d\'huile',
    'Services de pneus',
    'Réparation de freins',
    'Diagnostic moteur',
    'Lavage de voiture',
    'Réparation de carrosserie',
    'Remplacement de batterie',
  ];

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailError(translations[language].invalidEmail || 'Invalid email address');
      return false;
    }
    setEmailError('');
    return true;
  };

  const handleServiceToggle = (service: string) => {
    setSelectedServices((prev) =>
      prev.includes(service)
        ? prev.filter((item) => item !== service)
        : [...prev, service]
    );
  };

  const handleLocationSelect = (location: { latitude: number; longitude: number }) => {
    setPickedLocation(location);
  };

  const handleConfirmLocation = () => {
    if (pickedLocation) {
      setGeolocation(`${pickedLocation.latitude},${pickedLocation.longitude}`);
      setMapVisible(false);
    }
  };

  const handleOpenMap = async () => {
    setMapVisible(true);
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        let location = await Location.getCurrentPositionAsync({});
        setInitialRegion({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        });
      }
    } catch {
      // fallback to default if error
      setInitialRegion({
        latitude: 36.7525,
        longitude: 3.042,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      });
    }
  };

  const handleNext = async () => {
    setError(null);
    if (step === 1) {
      if (!garageName) {
        setError(translations[language].garageNameRequired || 'Garage name is required');
        return;
      }
      if (!pickedLocation) {
        setError(translations[language].invalidGeolocation || 'Please pick a location on the map');
        return;
      }
      setGeolocation(`${pickedLocation.latitude},${pickedLocation.longitude}`);
    }
    if (step === 2) {
      if (!managerName) {
        setError(translations[language].managerNameRequired || 'Manager name is required');
        return;
      }
      if (!phoneNumber) {
        setError(translations[language].phoneRequired || 'Phone number is required');
        return;
      }
      if (!validateEmail(email)) return;
    }
    if (step === 3 && selectedServices.length === 0) {
      setError(translations[language].serviceRequired || 'Please select at least one service');
      return;
    }
    if (step === 4 && !password) {
      setError(translations[language].passwordRequired || 'Password is required');
      return;
    }
    if (step < 4) {
      setStep(step + 1);
    } else {
      setLoading(true);
      setError(null);
      try {
        const [lat, lng] = geolocation.split(',').map(Number);
        const registerData = {
          type: 'garagiste' as const,
          nomGarage: garageName,
          adresse: '', // required by backend, send as empty string
          zoneGeo: '', // required by backend, send as empty string
          geolocation: { lat, lng },
          nomResponsable: managerName,
          phoneNumber: `${countryCode}${phoneNumber}`,
          email,
          typeService: selectedServices,
          password,
        };
        console.log('Register data:', registerData);
        const response = await authService.register(registerData);
        console.log('Register response:', response);
        setLoading(false);
        if (response.success) {
          await AsyncStorage.setItem('signup_phone_number', `${countryCode}${phoneNumber}`);
          router.push('/(auth)/verify');
        } else {
          const errorMsg = response.error?.toLowerCase() || '';
          if (
            errorMsg.includes('email already exists') ||
            errorMsg.includes('phone number already exists')
          ) {
            setError(translations[language].accountExists || 'Account with this email or phone number already exists.');
          } else {
            setError(
              response.error ||
              translations[language].unexpectedError ||
              'An error occurred during registration. Please try again.'
            );
          }
        }
      } catch (err: any) {
        setLoading(false);
        setError(
          err?.message ||
          translations[language].unexpectedError ||
          'An unexpected error occurred. Please try again.'
        );
        console.error('Registration error:', err);
      }
    }
  };

  const handleBack = () => {
    setError(null);
    if (step > 1) setStep(step - 1);
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <>
            <View style={styles.modernInputContainer}>
              <ModernInput
                label="Garage Name"
                placeholder="Enter your garage name"
                value={garageName}
                onChangeText={setGarageName}
                variant="filled"
                leftIcon={<Ionicons name="business-outline" size={20} color="#666" />}
                style={styles.modernInputStyle}
              />
            </View>
            <TouchableOpacity
              style={styles.modernLocationButton}
              onPress={handleOpenMap}
            >
              <Ionicons name="location-outline" size={24} color="#1A1A1A" />
              <Text style={styles.modernLocationButtonText}>
                {pickedLocation
                  ? (translations[language].locationPicked || 'Location Selected ✓')
                  : (translations[language].pickOnMap || 'Select Location on Map')}
              </Text>
              <Ionicons name="chevron-forward-outline" size={20} color="#666" />
            </TouchableOpacity>
          </>
        );
      case 2:
        return (
          <>
            <View style={styles.modernInputContainer}>
              <ModernInput
                label="Manager Name"
                placeholder="Enter manager name"
                value={managerName}
                onChangeText={setManagerName}
                variant="filled"
                leftIcon={<Ionicons name="person-outline" size={20} color="#666" />}
                style={styles.modernInputStyle}
              />
            </View>
            
            {/* Enhanced Country Code Selector */}
            <View style={styles.countryCodeContainer}>
              <TouchableOpacity
                style={[styles.countryCodeButton, countryCode === '+213' && styles.countryCodeButtonActive]}
                onPress={() => setCountryCode('+213')}
              >
                <Text style={styles.countryCodeEmoji}>🇩🇿</Text>
                <Text style={[styles.countryCodeText, countryCode === '+213' && styles.countryCodeTextActive]}>
                  +213
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.countryCodeButton, countryCode === '+216' && styles.countryCodeButtonActive]}
                onPress={() => setCountryCode('+216')}
              >
                <Text style={styles.countryCodeEmoji}>🇹🇳</Text>
                <Text style={[styles.countryCodeText, countryCode === '+216' && styles.countryCodeTextActive]}>
                  +216
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modernInputContainer}>
              <ModernInput
                label="Phone"
                placeholder="Enter your phone number"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                keyboardType="phone-pad"
                maxLength={10}
                variant="filled"
                leftIcon={
                  <View style={styles.phoneCodePrefix}>
                    <Text style={styles.phonePrefixText}>{countryCode}</Text>
                  </View>
                }
                style={styles.modernInputStyle}
              />
            </View>

            <View style={styles.modernInputContainer}>
              <ModernInput
                label="Email"
                placeholder="Enter your email address"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  validateEmail(text);
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                variant="filled"
                leftIcon={<Ionicons name="mail-outline" size={20} color="#666" />}
                error={emailError}
                style={styles.modernInputStyle}
              />
            </View>
          </>
        );
      case 3:
        return (
          <>
            <ScrollView style={styles.servicesContainer} showsVerticalScrollIndicator={false}>
              {services.map((service) => (
                <TouchableOpacity
                  key={service}
                  style={[
                    styles.serviceItem,
                    selectedServices.includes(service) && styles.serviceItemSelected,
                  ]}
                  onPress={() => handleServiceToggle(service)}
                >
                  <Text style={[
                    styles.serviceText,
                    selectedServices.includes(service) && styles.serviceTextSelected
                  ]}>
                    {service}
                  </Text>
                  {selectedServices.includes(service) && (
                    <Ionicons name="checkmark-circle" size={24} color="#000" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </>
        );
      case 4:
        return (
          <>
            <View style={styles.modernInputContainer}>
              <ModernInput
                label="Password"
                placeholder="Create a secure password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                variant="filled"
                leftIcon={<Ionicons name="lock-closed-outline" size={20} color="#666" />}
                style={styles.modernInputStyle}
              />
            </View>
          </>
        );
    }
  };

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
      enabled={true}
    >
      <View style={styles.container}>
        <Image
          source={require('../../assets/images/intro.jpg')}
          style={styles.image}
          resizeMode="cover"
        />
        <LinearGradient
          colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.8)', 'rgba(0,0,0,0.95)']}
          style={styles.gradient}
          locations={[0, 0.6, 1]}
        />
      
      {/* Enhanced Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.languageButton}
          onPress={() => {
            if (typeof toggleLanguage === 'function') toggleLanguage();
          }}
        >
          <Ionicons name="language-outline" size={16} color="#000" style={styles.langIcon} />
          <Text style={styles.languageButtonText}>
            {language === 'fr' ? 'العربية' : 'Français'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bounces={false}
        keyboardDismissMode="on-drag"
        automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
      >
        <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
          <View style={styles.content}>
        {/* Enhanced Stepper */}
        <View style={styles.stepperContainer}>
          <View style={styles.stepperHeader}>
            <Text style={styles.stepNumber}>Step {step} of 4</Text>
            <Text style={styles.stepTitle}>
              {step === 1 && (translations[language].garageDetails || 'Garage Information')}
              {step === 2 && (translations[language].managerDetails || 'Manager Details')}
              {step === 3 && (translations[language].servicesTitle || 'Select Services')}
              {step === 4 && (translations[language].passwordTitle || 'Set Password')}
            </Text>
          </View>
          
          <View style={styles.stepperDotsContainer}>
            {[1, 2, 3, 4].map((s) => (
              <React.Fragment key={s}>
                <View
                  style={[
                    styles.stepperDot,
                    step >= s && styles.stepperDotActive,
                  ]}
                >
                  {step > s ? (
                    <Ionicons name="checkmark" size={12} color="#000" />
                  ) : (
                    <Text style={[styles.stepperDotText, step >= s && styles.stepperDotTextActive]}>
                      {s}
                    </Text>
                  )}
                </View>
                {s < 4 && <View style={[styles.stepperLine, step > s && styles.stepperLineActive]} />}
              </React.Fragment>
            ))}
          </View>
        </View>

        {error && (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={20} color="#FF3B30" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View style={styles.formContainer}>
          {renderStep()}
        </View>

        <View style={styles.buttonContainer}>
          {step > 1 && (
            <TouchableOpacity 
              style={[styles.button, styles.secondaryButton]} 
              onPress={handleBack}
            >
              <Ionicons name="arrow-back-outline" size={20} color="#fff" style={styles.buttonIcon} />
              <Text style={[styles.buttonText, styles.secondaryButtonText]}>
                {translations[language].back || 'Back'}
              </Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity 
            style={[styles.button, styles.primaryButton, loading && { opacity: 0.7 }]} 
            onPress={handleNext} 
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#000" />
            ) : (
              <>
                <Text style={[styles.buttonText, styles.primaryButtonText]}>
                  {step === 4 ? (translations[language].signup || 'Create Account') : (translations[language].next || 'Next')}
                </Text>
                {step < 4 && <Ionicons name="arrow-forward-outline" size={20} color="#000" style={styles.buttonIconRight} />}
              </>
            )}
          </TouchableOpacity>
        </View>
        </View>
        </TouchableWithoutFeedback>
      </ScrollView>

      {/* Map Modal */}
      <Modal visible={mapVisible} animationType="slide" transparent={false}>
        <View style={{ flex: 1 }}>
          <OpenStreetMapView
            location={pickedLocation || initialRegion}
            interactive={true}
            onLocationSelect={handleLocationSelect}
            style={{ flex: 1 }}
          />
          <View style={styles.mapControls}>
            <TouchableOpacity 
              style={[styles.mapButton, styles.mapCancelButton]}
              onPress={() => setMapVisible(false)}
            >
              <Ionicons name="close-outline" size={20} color="#fff" />
              <Text style={styles.mapButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.mapButton, styles.mapConfirmButton, !pickedLocation && styles.mapButtonDisabled]}
              onPress={handleConfirmLocation} 
              disabled={!pickedLocation}
            >
              <Ionicons name="checkmark-outline" size={20} color={pickedLocation ? "#000" : "#999"} />
              <Text style={[styles.mapButtonText, { color: pickedLocation ? "#000" : "#999" }]}>
                Confirm Location
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#000',
  },
  image: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
    opacity: 0.7,
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 20,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  languageButton: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  langIcon: {
    marginRight: 4,
  },
  languageButtonText: {
    color: '#000',
    fontWeight: '600' as const,
    fontSize: 14,
  },
  content: {
    flexGrow: 1,
    width: '100%',
    alignItems: 'center',
    padding: 20,
    paddingTop: 120,
    zIndex: 2,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 50,
    paddingTop: 20,
  },
  stepperContainer: {
    alignItems: 'center',
    marginBottom: 30,
    width: '100%',
  },
  stepperHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  stepNumber: {
    fontSize: 14,
    color: '#BF2000',
    fontWeight: '600' as const,
    marginBottom: 4,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#fff',
    textAlign: 'center',
  },
  stepperDotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  stepperDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepperDotActive: {
    backgroundColor: '#BF2000',
    borderColor: '#BF2000',
  },
  stepperDotText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#fff',
  },
  stepperDotTextActive: {
    color: '#000',
  },
  stepperLine: {
    width: 30,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  stepperLineActive: {
    backgroundColor: '#BF2000',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 48, 0.3)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
    width: '100%',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 14,
    fontWeight: '500' as const,
    marginLeft: 8,
    flex: 1,
  },
  formContainer: {
    width: '100%',
    maxWidth: 400,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#BF2000',
    textAlign: 'center',
    marginBottom: 20,
    letterSpacing: 1,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    justifyContent: 'center',
    marginTop: 30,
    maxWidth: 400,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    minWidth: 120,
  },
  primaryButton: {
    backgroundColor: '#BF2000',
    flex: 2,
  },
  secondaryButton: {
    backgroundColor: 'rgba(0,0,0,0.8)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    flex: 1,
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonIconRight: {
    marginLeft: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    letterSpacing: 0.5,
  },
  primaryButtonText: {
    color: '#000',
  },
  secondaryButtonText: {
    color: '#fff',
  },
  modernInputContainer: {
    width: '100%',
    marginBottom: 20,
  },
  modernInputStyle: {
    marginBottom: 0,
  },
  modernLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  modernLocationButtonText: {
    fontSize: 16,
    fontWeight: '500' as const,
    color: '#1A1A1A',
    flex: 1,
    marginLeft: 12,
  },
  countryCodeContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  countryCodeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  countryCodeButtonActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderColor: '#000000',
    borderWidth: 2,
  },
  countryCodeEmoji: {
    fontSize: 18,
    marginRight: 8,
  },
  countryCodeText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: '#fff',
  },
  countryCodeTextActive: {
    color: '#000000',
    fontWeight: '700' as const,
  },
  phoneCodePrefix: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 6,
    marginRight: 12,
    minWidth: 50,
    alignItems: 'center',
  },
  phonePrefixText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#333',
  },
  servicesContainer: {
    width: '100%',
    maxHeight: 300,
    marginBottom: 20,
  },
  serviceItem: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  serviceItemSelected: {
    backgroundColor: 'rgba(191,32,0,0.9)',
    borderColor: '#000',
    borderWidth: 2,
  },
  serviceText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500' as const,
    flex: 1,
  },
  serviceTextSelected: {
    color: '#000',
    fontWeight: '600' as const,
  },
  mapControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  mapCancelButton: {
    backgroundColor: '#FF3B30',
  },
  mapConfirmButton: {
    backgroundColor: '#34C759',
  },
  mapButtonDisabled: {
    backgroundColor: '#E0E0E0',
  },
  mapButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#fff',
  },
  // Legacy styles for backward compatibility
  inputContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    width: '85%',
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 25,
    marginBottom: 15,
    paddingHorizontal: 10,
    paddingVertical: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  picker: {
    width: '100%',
    height: 50,
    color: '#1A1A1A',
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 18,
    color: '#1A1A1A',
    paddingHorizontal: 10,
    backgroundColor: 'transparent',
  },
  locationButton: {
    backgroundColor: '#BF2000',
    padding: 10,
    borderRadius: 10,
    marginTop: 5,
  },
  locationButtonText: {
    color: '#1A1A1A',
    fontSize: 16,
    fontWeight: '700' as const,
  },
});

export default SignupScreen;