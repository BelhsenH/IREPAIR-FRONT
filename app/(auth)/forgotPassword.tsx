import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Dimensions, Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as Animatable from 'react-native-animatable';
import { ModernInput } from '../../components/modern/ModernInput';
import { useLanguage } from '../../contexts/LanguageContext';
import { authService } from '../../scripts/auth-script';

const { width } = Dimensions.get('window');

const countryCodes = [
  { code: '+213', flag: '🇩🇿' },
  { code: '+216', flag: '🇹🇳' },
];
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
    <KeyboardAvoidingView 
      style={{ flex: 1 }} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
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
        contentContainerStyle={styles.content} 
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <Animatable.View 
          animation="fadeInDown" 
          duration={800} 
          style={styles.headerSection}
        >
          <View style={styles.iconContainer}>
            <Ionicons name="lock-open-outline" size={48} color="#FFD700" />
          </View>
          <Text style={styles.title}>
            {translations[language].forgotPasswordTitle || 'Forgot Password?'}
          </Text>
          <Text style={styles.subtitle}>
            {translations[language].forgotPasswordSubtitle || 
             'No worries! Enter your phone number and we\'ll send you a reset code.'}
          </Text>
        </Animatable.View>

        <Animatable.View 
          animation="fadeInUp" 
          duration={800} 
          delay={300}
          style={styles.formSection}
        >
          {error && (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={20} color="#FF3B30" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Country Code Selector */}
          <View style={styles.countryCodeContainer}>
            {countryCodes.map(({ code, flag }) => (
              <TouchableOpacity
                key={code}
                style={[
                  styles.countryCodeButton,
                  countryCode === code && styles.countryCodeButtonActive
                ]}
                onPress={() => setCountryCode(code)}
              >
                <Text style={styles.countryCodeEmoji}>{flag}</Text>
                <Text style={[
                  styles.countryCodeText,
                  countryCode === code && styles.countryCodeTextActive
                ]}>
                  {code}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Phone Input */}
          <View style={styles.inputContainer}>
            <ModernInput
              label={translations[language].phonePlaceholder || 'Phone Number'}
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
              maxLength={10}
              variant="filled"
              leftIcon={
                <View style={styles.phonePrefix}>
                  <Text style={styles.phonePrefixText}>{countryCode}</Text>
                </View>
              }
            />
          </View>

          {/* Send Code Button */}
          <TouchableOpacity
            style={[styles.sendButton, (loading || !phoneNumber) && styles.buttonDisabled]}
            onPress={handleForgotPassword}
            disabled={loading || !phoneNumber}
            activeOpacity={0.8}
          >
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator color="#000" size="small" />
                <Text style={styles.sendButtonText}>Sending...</Text>
              </View>
            ) : (
              <>
                <Ionicons name="mail-outline" size={20} color="#000" style={styles.buttonIcon} />
                <Text style={styles.sendButtonText}>
                  {translations[language].sendCode || 'Send Reset Code'}
                </Text>
              </>
            )}
          </TouchableOpacity>

          {/* Back to Login */}
          <View style={styles.backLinkContainer}>
            <Text style={styles.backText}>
              {translations[language].backToLogin || 'Remember your password? '}{' '}
            </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/Login')}>
              <Text style={styles.backLink}>
                {translations[language].login || 'Sign In'}
              </Text>
            </TouchableOpacity>
          </View>
        </Animatable.View>
      </ScrollView>
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
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    paddingTop: 120,
    zIndex: 2,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,215,0,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: 'rgba(255,215,0,0.3)',
  },
  title: {
    fontSize: 28,
    fontWeight: '800' as const,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#E0E0E0',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
    opacity: 0.9,
  },
  formSection: {
    width: '100%',
    maxWidth: 400,
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
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 14,
    fontWeight: '500' as const,
    marginLeft: 8,
    flex: 1,
  },
  countryCodeContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 12,
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
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderColor: '#000',
    borderWidth: 2,
  },
  countryCodeEmoji: {
    fontSize: 18,
    marginRight: 8,
  },
  countryCodeText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#fff',
  },
  countryCodeTextActive: {
    color: '#000',
    fontWeight: '700' as const,
  },
  inputContainer: {
    marginBottom: 30,
  },
  phonePrefix: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 6,
    marginRight: 8,
  },
  phonePrefixText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#666',
  },
  sendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFD700',
    paddingVertical: 16,
    borderRadius: 14,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonDisabled: {
    backgroundColor: 'rgba(255,215,0,0.5)',
  },
  buttonIcon: {
    marginRight: 8,
  },
  sendButtonText: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#000',
    letterSpacing: 0.5,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backLinkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
  },
  backText: {
    color: '#E0E0E0',
    fontSize: 16,
    textAlign: 'center',
  },
  backLink: {
    color: '#FFD700',
    fontWeight: '600' as const,
    fontSize: 16,
  },
  // Legacy styles for backward compatibility
  textContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 40,
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
    fontWeight: '700' as const,
    color: '#1A1A1A',
    letterSpacing: 1,
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
});

export default ForgotPasswordScreen;