import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, ScrollView, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Picker } from '@react-native-picker/picker';
import { useLanguage } from '../../contexts/LanguageContext';
import { useRouter } from 'expo-router';
import { authService } from '../../scripts/auth-script';
import AsyncStorage from '@react-native-async-storage/async-storage';
const ForgotPasswordScreen = () => {
  const { language, translations, toggleLanguage } = useLanguage();
  const router = useRouter();
  const [countryCode, setCountryCode] = useState('+213');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleForgotPassword = async () => {
    setError(null);
    setLoading(true);
    try {
      const fullPhoneNumber = `${countryCode}${phoneNumber}`;
      const response = await authService.forgotPassword({ phoneNumber: fullPhoneNumber });
      console.log('Forgot password response:', response);
      if (response.success) {
        await AsyncStorage.setItem('reset_phone_number', fullPhoneNumber);
        router.push('/(auth)/resetPassword');
      } else {
        setError(
          response.error ||
          translations[language].unexpectedError ||
          'An error occurred. Please try again.'
        );
      }
    } catch (err: any) {
      setError(
        err?.message ||
        translations[language].unexpectedError ||
        'An unexpected error occurred. Please try again.'
      );
      console.error('Forgot password error:', err);
    } finally {
      setLoading(false);
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
        <View style={styles.textContainer}>
          <Text style={styles.title}>
            {translations[language].forgotPasswordTitle || 'Forgot Password'}
          </Text>
          <Text style={styles.subtitle}>
            {translations[language].forgotPasswordSubtitle || 'Enter your phone number to receive a reset code'}
          </Text>
        </View>
        {error && (
          <Text style={styles.errorText}>{error}</Text>
        )}
        <View style={styles.inputContainer}>
          <Picker
            selectedValue={countryCode}
            onValueChange={(itemValue) => setCountryCode(itemValue)}
            style={styles.picker}
          >
            <Picker.Item label="Algeria (+213)" value="+213" />
            <Picker.Item label="Tunisia (+216)" value="+216" />
          </Picker>
          <TextInput
            style={styles.input}
            placeholder={translations[language].phonePlaceholder || 'Enter phone number'}
            keyboardType="phone-pad"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            maxLength={10}
          />
        </View>
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, loading && { opacity: 0.7 }]}
            onPress={handleForgotPassword}
            disabled={loading || !phoneNumber}
          >
            {loading ? (
              <ActivityIndicator color="#1A1A1A" />
            ) : (
              <Text style={styles.buttonText}>
                {translations[language].sendCode || 'Send Code'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
        <View style={styles.backLinkContainer}>
          <Text style={styles.backText}>
            {translations[language].backToLogin || 'Back to '}{' '}
            <Text
              style={styles.backLink}
              onPress={() => router.push('/(auth)/Login')}
            >
              {translations[language].login || 'Login'}
            </Text>
          </Text>
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
  textContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFD700',
    textAlign: 'center',
    marginBottom: 10,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 16,
    color: '#CCCCCC',
    textAlign: 'center',
    lineHeight: 22,
  },
  inputContainer: {
    flexDirection: 'row',
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
    width: 150,
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
  buttonContainer: {
    flexDirection: 'column',
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
  backLinkContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  backText: {
    color: '#fff',
    fontSize: 16,
  },
  backLink: {
    color: '#FFD700',
    fontWeight: 'bold',
    textDecorationLine: 'underline',
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
});

export default ForgotPasswordScreen;