import React from 'react';
import { View, Image, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLanguage } from '../../contexts/LanguageContext';
import { useRouter } from 'expo-router';

const IntroScreen = () => {
  const { language, toggleLanguage, translations } = useLanguage();
  const router = useRouter();

  return (
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
      {/* Language toggle absolutely positioned at top right */}
      <TouchableOpacity style={styles.langToggleAbsolute} onPress={toggleLanguage}>
        <Text style={styles.langToggleText}>
          {language === 'fr' ? 'العربية' : 'Français'}
        </Text>
      </TouchableOpacity>
      <View style={styles.content}>
        <View style={styles.textContainer}>
          <Text style={styles.title}>
            {translations[language].introTitle || "Let's Get started with us"}
          </Text>
          <Text style={styles.subtitle}>
            {translations[language].introSubtitle ||
              'Get convenient repair bookings. Get aquinted with our service design and safegaurd your vehicle against unprofessional repairs.'}
          </Text>
        </View>
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.button}
            onPress={() => router.push('/(auth)/Login')}
          >
            <Text style={styles.buttonText}>
              {translations[language].login || 'Login'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={() => router.push('/(auth)/signup')}>
            <Text style={styles.buttonText}>
              {translations[language].register || 'Register'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
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
  // Absolute language toggle at top right
  langToggleAbsolute: {
    position: 'absolute',
    top: 40,
    right: 30,
    backgroundColor: 'rgba(255,255,255,0.7)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    zIndex: 10,
  },
  langToggleText: {
    color: '#1A1A1A',
    fontWeight: 'bold',
    fontSize: 16,
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
});

export default IntroScreen;