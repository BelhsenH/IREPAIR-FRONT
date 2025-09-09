import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLanguage } from '../../contexts/LanguageContext';
import { router } from 'expo-router';
import { authService } from '../../scripts/auth-script';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { ModernInput } from '../../components/modern/ModernInput';

const countryCodes = [
  { code: '+213', flag: '🇩🇿' },
  { code: '+216', flag: '🇹🇳' },
];

const LoginScreen = () => {
  const { language, translations, toggleLanguage } = useLanguage();
  const [countryCode, setCountryCode] = useState('+213');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (isLoading) return;
    
    if (!phoneNumber.trim() || !password.trim()) {
      setError(translations[language].fillAllFields || 'Please fill in all fields.');
      return;
    }

    setError(null);
    setIsLoading(true);
    
    try {
      const fullPhoneNumber = countryCode + phoneNumber;
      const response = await authService.login({
        phoneNumber: fullPhoneNumber,
        password,
      });
      
      console.log('Login response:', response);
      
      if (response.success && response.data) {
        await AsyncStorage.setItem('@user_data', JSON.stringify(response.data.user));
        router.replace('/(home)/dashboard');
      } else {
        const errorMsg = typeof response.error === 'string' ? response.error.toLowerCase() : '';
        if (
          errorMsg.includes('invalid credentials') ||
          errorMsg.includes('invalid') ||
          errorMsg.includes('wrong') ||
          errorMsg.includes('incorrect') ||
          errorMsg.includes('user not found')
        ) {
          setError(
            translations[language].wrongCredentials ||
              'Incorrect phone number or password.'
          );
        } else if (errorMsg.includes('not verified')) {
          setError(
            translations[language].accountNotVerified ||
              'Please verify your phone number before logging in.'
          );
        } else if (errorMsg) {
          setError(errorMsg);
        } else {
          setError(
            translations[language].unexpectedError ||
              'An unexpected error occurred. Please try again.'
          );
        }
      }
    } catch (err: any) {
      console.error('Login error:', err);
      if (err?.message?.includes('Network')) {
        setError(
          translations[language].networkError ||
          'Network error. Please check your connection and try again.'
        );
      } else {
        setError(
          err?.message ||
          translations[language].unexpectedError ||
          'An unexpected error occurred. Please try again.'
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  // --- Add this for phone code selector style ---
  const phoneCodeContainerStyle = {
    flexDirection: 'row' as const,
    marginBottom: 10,
    gap: 8,
    justifyContent: 'flex-start' as const,
  };
  const phoneCodeButtonStyle = (active: boolean) => ({
    flex: 1,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: active ? '#fff' : 'rgba(255,255,255,0.7)',
    borderWidth: 1,
    borderColor: active ? '#000000ff' : '#ccc',
    alignItems: 'center' as const,
    marginRight: 8,
  });
  const phoneCodeTextStyle = (active: boolean) => ({
    fontSize: 16,
    color: active ? '#0c0c0cff' : '#1A1A1A',
    fontWeight: active ? '700' : '500',
  });
  const phonePrefixStyle = {
    color: '#aa1414ff',
    fontWeight: '700' as const,
    fontSize: 18,
    marginRight: 6,
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      <View style={styles.container}>
        <Image
          source={require('../../assets/images/intro.jpg')}
          style={styles.image}
          resizeMode="cover"
        />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.7)']}
          style={styles.gradient}
          locations={[0.5, 1]}
        />
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'flex-end' }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.content}>
            <View style={styles.textContainer}>
              <Text style={styles.title}>
                {translations[language].loginTitle || 'Welcome Back'}
              </Text>
              <Text style={styles.subtitle}>
                {translations[language].loginSubtitle || 'Sign in with your phone number and password'}
              </Text>
            </View>

            {error && (
              <Text style={{ color: 'red', marginBottom: 10 }}>{error}</Text>
            )}

            {/* --- Phone Code Selector --- */}
            <View style={phoneCodeContainerStyle}>
              {countryCodes.map(({ code, flag }) => (
                <TouchableOpacity
                  key={code}
                  style={phoneCodeButtonStyle(countryCode === code)}
                  onPress={() => setCountryCode(code)}
                >
                  <Text style={phoneCodeTextStyle(countryCode === code)}>
                    {flag} {code}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Phone Input with Modern Component */}
            <View style={styles.modernInputContainer}>
              <ModernInput
                label={translations[language].phonePlaceholder || 'Phone Number'}
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                keyboardType="phone-pad"
                maxLength={10}
                variant="filled"
                style={styles.modernInputStyle}
              />
            </View>

            <View style={styles.modernInputContainer}>
              <ModernInput
                label={translations[language].passwordPlaceholder || 'Password'}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                variant="filled"
                style={styles.modernInputStyle}
              />
            </View>

            <TouchableOpacity
              style={styles.forgotPassword}
              onPress={() => router.push('/(auth)/forgotPassword')}
            >
              <Text style={styles.forgotPasswordText}>
                {translations[language].forgotPassword || 'Forgot Password?'}
              </Text>
            </TouchableOpacity>

            <View style={styles.buttonContainer}>
              <TouchableOpacity 
                style={[styles.button, isLoading && styles.buttonDisabled]} 
                onPress={handleLogin}
                disabled={isLoading}
              >
                {isLoading ? (
                  <View style={styles.loadingContainer}>
                    <Ionicons name="refresh" size={20} color="#1A1A1A" style={styles.spinIcon} />
                    <Text style={styles.buttonText}>
                      {translations[language].signingIn || 'Signing In...'}
                    </Text>
                  </View>
                ) : (
                  <Text style={styles.buttonText}>
                    {translations[language].login || 'Login'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
            <View style={styles.signupLinkContainer}>
              <Text style={styles.signupText}>
                {translations[language].noAccount || "Don't have an account?"}{' '}
                <Text
                  style={styles.signupLink}
                  onPress={() => { router.push(`/(auth)/signup`); }}
                >
                  {translations[language].register || 'Sign Up'}
                </Text>
              </Text>
            </View>
          </View>
        </ScrollView>
        <TouchableOpacity
          style={{
            position: 'absolute',
            top: 40,
            right: 30,
            backgroundColor: 'rgba(255,255,255,0.7)',
            paddingHorizontal: 16,
            paddingVertical: 6,
            borderRadius: 16,
            zIndex: 10,
          }}
          onPress={() => {
            if (typeof toggleLanguage === 'function') toggleLanguage();
          }}
        >
          <Text style={{ color: '#1A1A1A', fontWeight: 'bold', fontSize: 16 }}>
            {language === 'fr' ? 'العربية' : 'Français'}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
    justifyContent: 'flex-end',
  },
  image: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  content: {
    width: '100%',
    alignItems: 'center',
    paddingBottom: 40,
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
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 10,
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
    width: '80%',
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 25,
    marginBottom: 15,
    paddingHorizontal: 10,
  },
  picker: {
    width: 150,
    height: 50,
    color: '#1A1A1A',
  },
  input: {
    flex: 1,
    height: 60,
    fontSize: 18,
    color: '#1A1A1A',
    paddingHorizontal: 10,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginRight: '10%',
    marginBottom: 20,
  },
  forgotPasswordText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  buttonContainer: {
    flexDirection: 'column',
    gap: 15,
    width: '80%',
  },
  button: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 15,
    borderRadius: 25,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  signupLinkContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  signupText: {
    color: '#fff',
    fontSize: 16,
  },
  signupLink: {
    color: '#FFD700',
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
  buttonDisabled: {
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinIcon: {
    marginRight: 8,
  },
  modernInputContainer: {
    width: '85%',
    marginBottom: 16,
  },
  modernInputStyle: {
    marginBottom: 0,
  },
  phoneCodeContainer: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 6,
    marginRight: 8,
  },
  phoneCodeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
});

export default LoginScreen;