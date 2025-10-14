import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Image, Keyboard, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { ModernInput } from '../../components/modern/ModernInput';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { authService } from '../../scripts/auth-script';

const countryCodes = [
  { code: '+213', flag: '🇩🇿' },
  { code: '+216', flag: '🇹🇳' },
];

const LoginScreen = () => {
  const { language, translations, toggleLanguage } = useLanguage();
  const { login } = useAuth();
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
        // Use AuthContext to properly store token and user
        console.log('🔑 Storing token and user data via AuthContext...');
        console.log('🔍 User data from response:', response.data.user);
        
        // Map the response user to AuthUser format
        const authUser = {
          ...response.data.user,
          // Ensure geolocation exists (required by AuthUser interface)
          geolocation: (response.data.user as any).geolocation || { lat: 0, lng: 0 }
        };
        
        await login(response.data.token, authUser);
        console.log('✅ Token and user data stored successfully');
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
        
        {/* Enhanced Language Toggle */}
        <TouchableOpacity
          style={styles.languageToggle}
          onPress={() => {
            if (typeof toggleLanguage === 'function') toggleLanguage();
          }}
        >
          <Ionicons name="language-outline" size={16} color="#000" style={styles.langIcon} />
          <Text style={styles.languageText}>
            {language === 'fr' ? 'العربية' : 'Français'}
          </Text>
        </TouchableOpacity>

        {/* Back Button */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>

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
            {/* Header Section */}
            <View style={styles.headerSection}>
              <View style={styles.logoContainer}>
                <Image
                  source={require('../../assets/images/irepair-logo.png')}
                  style={styles.miniLogo}
                  resizeMode="contain"
                />
              </View>
              <Text style={styles.title}>
                {translations[language].loginTitle || 'Welcome Back'}
              </Text>
              <Text style={styles.subtitle}>
                {translations[language].loginSubtitle || 'Sign in to continue to your account'}
              </Text>
            </View>

            {/* Form Section */}
            <View style={styles.formSection}>
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
                  label="Phone"
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

              {/* Password Input */}
              <View style={styles.inputContainer}>
                <ModernInput
                  label="Password"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  variant="filled"
                  leftIcon={<Ionicons name="lock-closed-outline" size={20} color="#666" />}
                />
              </View>

              {/* Forgot Password */}
              <TouchableOpacity
                style={styles.forgotPassword}
                onPress={() => router.push('/(auth)/forgotPassword')}
              >
                <Text style={styles.forgotPasswordText}>
                  {translations[language].forgotPassword || 'Forgot Password?'}
                </Text>
              </TouchableOpacity>

              {/* Login Button */}
              <TouchableOpacity 
                style={[styles.loginButton, isLoading && styles.buttonDisabled]} 
                onPress={handleLogin}
                disabled={isLoading}
                activeOpacity={0.8}
              >
                {isLoading ? (
                  <View style={styles.loadingContainer}>
                    <Ionicons name="refresh" size={20} color="#000" style={styles.spinIcon} />
                    <Text style={styles.loginButtonText}>
                      {translations[language].signingIn || 'Signing In...'}
                    </Text>
                  </View>
                ) : (
                  <>
                    <Ionicons name="log-in-outline" size={20} color="#000" style={styles.buttonIcon} />
                    <Text style={styles.loginButtonText}>
                      {translations[language].login || 'Sign In'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              {/* Divider */}
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Sign Up Link */}
              <View style={styles.signupContainer}>
                <Text style={styles.signupText}>
                  {translations[language].noAccount || "Don't have an account?"}{' '}
                </Text>
                <TouchableOpacity onPress={() => router.push('/(auth)/signup')}>
                  <Text style={styles.signupLink}>
                    {translations[language].register || 'Create Account'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
          </TouchableWithoutFeedback>
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
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  languageToggle: {
    position: 'absolute',
    top: 50,
    right: 20,
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    zIndex: 10,
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
  languageText: {
    color: '#000',
    fontWeight: '600' as const,
    fontSize: 14,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  content: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 40,
    zIndex: 2,
    justifyContent: 'center',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingTop: 100,
    paddingBottom: 50,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  miniLogo: {
    width: 40,
    height: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: '800' as const,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#E0E0E0',
    textAlign: 'center',
    lineHeight: 22,
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
    marginBottom: 20,
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
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 30,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: '#BF2000',
    fontWeight: '500' as const,
  },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    borderRadius: 14,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonDisabled: {
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  buttonIcon: {
    marginRight: 8,
  },
  loginButtonText: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#000',
    letterSpacing: 0.5,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinIcon: {
    marginRight: 8,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  dividerText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500' as const,
    marginHorizontal: 16,
    opacity: 0.7,
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  signupText: {
    color: '#E0E0E0',
    fontSize: 16,
  },
  signupLink: {
    color: '#BF2000',
    fontWeight: '600' as const,
    fontSize: 16,
  },
  // Unused styles to remove later
  textContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 40,
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
    fontWeight: '600' as const,
    color: '#1A1A1A',
  },
  signupLinkContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 10,
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
    fontWeight: '600' as const,
    color: '#333',
  },
});

export default LoginScreen;