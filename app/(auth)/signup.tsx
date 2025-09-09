import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, ScrollView, Modal, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Picker } from '@react-native-picker/picker';
import { useLanguage } from '../../contexts/LanguageContext';
import { useRouter } from 'expo-router';
import MapView, { Marker, MapPressEvent } from 'react-native-maps';
import { authService } from '../../scripts/auth-script';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { ModernInput } from '../../components/modern/ModernInput';
import { Ionicons } from '@expo/vector-icons';

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

  const handleMapPress = (event: MapPressEvent) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setPickedLocation({ latitude, longitude });
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
    } catch (e) {
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
          type: 'garagiste',
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
            <Text style={styles.title}>
              {translations[language].garageDetails || 'Garage Details'}
            </Text>
            <View style={styles.modernInputContainer}>
              <ModernInput
                label={translations[language].garageNamePlaceholder || 'Garage Name'}
                value={garageName}
                onChangeText={setGarageName}
                variant="filled"
                leftIcon={<Ionicons name="business-outline" size={20} color="#666" />}
                style={styles.modernInputStyle}
              />
            </View>
            <View style={styles.modernInputContainer}>
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
            </View>
            <Modal visible={mapVisible} animationType="slide" transparent={false}>
              <View style={{ flex: 1 }}>
                <MapView
                  style={{ flex: 1 }}
                  initialRegion={initialRegion}
                  onPress={handleMapPress}
                >
                  {pickedLocation && (
                    <Marker coordinate={pickedLocation} />
                  )}
                </MapView>
                <View style={{ flexDirection: 'row', justifyContent: 'space-around', padding: 16, backgroundColor: '#fff' }}>
                  <TouchableOpacity onPress={() => setMapVisible(false)}>
                    <Text style={{ color: 'red', fontSize: 18 }}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleConfirmLocation} disabled={!pickedLocation}>
                    <Text style={{ color: pickedLocation ? 'green' : 'gray', fontSize: 18 }}>Confirm</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>
          </>
        );
      case 2:
        return (
          <>
            <Text style={styles.title}>
              {translations[language].managerDetails || 'Manager Details'}
            </Text>
            <View style={styles.modernInputContainer}>
              <ModernInput
                label={translations[language].managerNamePlaceholder || 'Manager Name'}
                value={managerName}
                onChangeText={setManagerName}
                variant="filled"
                leftIcon={<Ionicons name="person-outline" size={20} color="#666" />}
                style={styles.modernInputStyle}
              />
            </View>
            
            {/* Country Code Selector */}
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
                label={translations[language].phonePlaceholder || 'Phone Number'}
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
                label={translations[language].emailPlaceholder || 'Email Address'}
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
            <Text style={styles.title}>
              {translations[language].servicesTitle || 'Select Services'}
            </Text>
            <ScrollView style={styles.servicesContainer}>
              {services.map((service) => (
                <TouchableOpacity
                  key={service}
                  style={[
                    styles.serviceItem,
                    selectedServices.includes(service) && styles.serviceItemSelected,
                  ]}
                  onPress={() => handleServiceToggle(service)}
                >
                  <Text style={styles.serviceText}>{service}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </>
        );
      case 4:
        return (
          <>
            <Text style={styles.title}>
              {translations[language].passwordTitle || 'Set Password'}
            </Text>
            <View style={styles.modernInputContainer}>
              <ModernInput
                label={translations[language].passwordPlaceholder || 'Password'}
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
    <View style={styles.container}>
      <Image
        source={require('../../assets/images/intro.jpg')}
        style={styles.image}
        resizeMode="cover"
      />
      <LinearGradient
        colors={['rgba(0,0,0,0.5)', 'rgba(0,0,0,0.7)']}
        style={styles.gradient}
        locations={[0, 1]}
      />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.stepperContainer}>
          <View style={styles.stepperDotsContainer}>
            {[1, 2, 3, 4].map((s) => (
              <View
                key={s}
                style={[
                  styles.stepperDot,
                  step === s && styles.stepperDotActive,
                ]}
              />
            ))}
          </View>
        </View>
        {error && (
          <Text style={styles.errorText}>{error}</Text>
        )}
        {renderStep()}
        <View style={styles.buttonContainer}>
          {step > 1 && (
            <TouchableOpacity style={styles.button} onPress={handleBack}>
              <Text style={styles.buttonText}>
                {translations[language].back || 'Back'}
              </Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={[styles.button, loading && { opacity: 0.7 }]} onPress={handleNext} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#1A1A1A" />
            ) : (
              <Text style={styles.buttonText}>
                {step === 4 ? (translations[language].signup || 'Sign Up') : (translations[language].next || 'Next')}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
      <TouchableOpacity
        style={styles.languageButton}
        onPress={() => {
          if (typeof toggleLanguage === 'function') toggleLanguage();
        }}
      >
        <Text style={styles.languageButtonText}>
          {language === 'fr' ? 'العربية' : 'Français'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#222',
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
  content: {
    flexGrow: 1,
    width: '100%',
    alignItems: 'center',
    padding: 20,
    paddingTop: 80,
    zIndex: 2,
  },
  stepperContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  stepperDotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  stepperDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: 'rgba(255,255,255,0.4)',
    marginHorizontal: 4,
  },
  stepperDotActive: {
    backgroundColor: '#FFD700',
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#1A1A1A',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFD700',
    textAlign: 'center',
    marginBottom: 20,
    letterSpacing: 1,
  },
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
  errorText: {
    color: '#FF0000',
    fontSize: 15,
    marginBottom: 10,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  servicesContainer: {
    width: '85%',
    maxHeight: 300,
    marginBottom: 20,
  },
  serviceItem: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  serviceItemSelected: {
    backgroundColor: '#FFD700',
    borderColor: '#1A1A1A',
  },
  serviceText: {
    fontSize: 16,
    color: '#1A1A1A',
    fontWeight: '600',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 15,
    width: '85%',
    justifyContent: 'center',
    marginTop: 20,
  },
  button: {
    flex: 1,
    backgroundColor: '#FFD700',
    paddingVertical: 15,
    borderRadius: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    letterSpacing: 1,
  },
  locationButton: {
    backgroundColor: '#FFD700',
    padding: 10,
    borderRadius: 10,
    marginTop: 5,
  },
  locationButtonText: {
    color: '#1A1A1A',
    fontSize: 16,
    fontWeight: '700',
  },
  languageButton: {
    position: 'absolute',
    top: 40,
    right: 30,
    backgroundColor: 'rgba(255,255,255,0.7)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    zIndex: 10,
  },
  languageButtonText: {
    color: '#1A1A1A',
    fontWeight: 'bold',
    fontSize: 16,
  },
  modernInputContainer: {
    width: '90%',
    marginBottom: 16,
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
    marginBottom: 16,
    width: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  modernLocationButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1A1A1A',
    flex: 1,
    marginLeft: 12,
  },
  countryCodeContainer: {
    flexDirection: 'row',
    width: '90%',
    gap: 12,
    marginBottom: 16,
  },
  countryCodeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
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
    fontWeight: '500',
    color: '#666',
  },
  countryCodeTextActive: {
    color: '#000000',
    fontWeight: '700',
  },
  phoneCodePrefix: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 6,
    marginRight: 8,
  },
  phonePrefixText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
});

export default SignupScreen;