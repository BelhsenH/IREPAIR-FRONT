import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, ScrollView, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLanguage } from '../../contexts/LanguageContext';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '../../scripts/auth-script';
import { ModernInput } from '../../components/modern/ModernInput';
import { Ionicons } from '@expo/vector-icons';

const VerifyScreen = () => {
  const { language, translations, toggleLanguage } = useLanguage();
  const router = useRouter();
  const [code, setCode] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const getPhoneNumber = async () => {
      const storedPhone = await AsyncStorage.getItem('signup_phone_number');
      if (storedPhone) {
        setPhoneNumber(storedPhone);
      } else {
        setError(translations[language].noPhoneNumber || 'No phone number found. Please sign up again.');
      }
    };
    getPhoneNumber();
  }, [language, translations]);

  const handleVerify = async () => {
    setError(null);
    setLoading(true);
    try {
      const response = await authService.verifyPhone({ phoneNumber, code });
      console.log('Verify response:', response);
      if (response.success) {
        await AsyncStorage.removeItem('signup_phone_number');
        router.replace('/(auth)/Login');
      } else {
        setError(
          response.error ||
          translations[language].invalidCode ||
          'Invalid verification code. Please try again.'
        );
      }
    } catch (err: any) {
      setError(
        err?.message ||
        translations[language].unexpectedError ||
        'An unexpected error occurred. Please try again.'
      );
      console.error('Verification error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setError(null);
    setLoading(true);
    try {
      const response = await authService.resendVerificationCode(phoneNumber);
      console.log('Resend code response:', response);
      if (!response.success) {
        setError(
          response.error ||
          translations[language].resendFailed ||
          'Failed to resend code. Please try again.'
        );
      }
    } catch (err: any) {
      setError(
        err?.message ||
        translations[language].unexpectedError ||
        'An unexpected error occurred. Please try again.'
      );
      console.error('Resend code error:', err);
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
            {translations[language].verifyTitle || 'Verify Your Phone'}
          </Text>
          <Text style={styles.subtitle}>
            {translations[language].verifySubtitle || 'Enter the 6-digit code sent to your phone number'}
          </Text>
        </View>
        {error && (
          <Text style={styles.errorText}>{error}</Text>
        )}
        <View style={styles.modernInputContainer}>
          <ModernInput
            label={translations[language].codePlaceholder || 'Verification Code'}
            placeholder="6-digit code"
            value={code}
            onChangeText={setCode}
            keyboardType="number-pad"
            maxLength={6}
            variant="filled"
            leftIcon={<Ionicons name="shield-checkmark-outline" size={20} color="#666" />}
            style={styles.modernInputStyle}
          />
        </View>
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, loading && { opacity: 0.7 }]}
            onPress={handleVerify}
            disabled={loading || code.length !== 6}
          >
            {loading ? (
              <ActivityIndicator color="#1A1A1A" />
            ) : (
              <Text style={styles.buttonText}>
                {translations[language].verify || 'Verify'}
              </Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.resendButton}
            onPress={handleResendCode}
            disabled={loading}
          >
            <Text style={styles.resendButtonText}>
              {translations[language].resendCode || 'Resend Code'}
            </Text>
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
  input: {
    flex: 1,
    height: 50,
    fontSize: 18,
    color: '#1A1A1A',
    paddingHorizontal: 10,
    backgroundColor: 'transparent',
    textAlign: 'center',
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
  resendButton: {
    alignItems: 'center',
  },
  resendButtonText: {
    fontSize: 16,
    color: '#FFD700',
    fontWeight: '600',
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
  modernInputContainer: {
    width: '85%',
    marginBottom: 16,
  },
  modernInputStyle: {
    marginBottom: 0,
  },
});

export default VerifyScreen;