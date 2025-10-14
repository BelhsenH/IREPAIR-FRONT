import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React from 'react';
import { Dimensions, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as Animatable from 'react-native-animatable';
import { useLanguage } from '../../contexts/LanguageContext';

const { width } = Dimensions.get('window');

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
        colors={['rgba(0,0,0,0.2)', 'rgba(0,0,0,0.8)', 'rgba(0,0,0,0.95)']}
        style={styles.gradient}
        locations={[0, 0.6, 1]}
      />
      
      {/* Enhanced Language Toggle */}
      <TouchableOpacity style={styles.langToggleAbsolute} onPress={toggleLanguage}>
        <Ionicons name="language-outline" size={16} color="#000" style={styles.langIcon} />
        <Text style={styles.langToggleText}>
          {language === 'fr' ? 'العربية' : 'Français'}
        </Text>
      </TouchableOpacity>

      {/* Logo Section */}
      <Animatable.View 
        animation="fadeInDown" 
        duration={1000} 
        delay={300}
        style={styles.logoSection}
      >
        <View style={styles.logoContainer}>
          <Image
            source={require('../../assets/images/irepair-logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
        <Text style={styles.brandName}>iRepair</Text>
        <Text style={styles.tagline}>Professional Auto Care</Text>
      </Animatable.View>

      <View style={styles.content}>
        <Animatable.View 
          animation="fadeInUp" 
          duration={1000} 
          delay={600}
          style={styles.textContainer}
        >
          <Text style={styles.title}>
            {translations[language].introTitle || "Let's Get Started"}
          </Text>
          <Text style={styles.subtitle}>
            {translations[language].introSubtitle ||
              'Experience premium automotive repair services with trusted professionals. Your vehicle deserves the best care.'}
          </Text>
        </Animatable.View>
        
        <Animatable.View 
          animation="fadeInUp" 
          duration={1000} 
          delay={900}
          style={styles.buttonContainer}
        >
          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={() => router.push('/(auth)/Login')}
            activeOpacity={0.8}
          >
            <Ionicons name="log-in-outline" size={20} color="#000" style={styles.buttonIcon} />
            <Text style={[styles.buttonText, styles.primaryButtonText]}>
              {translations[language].login || 'Sign In'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.button, styles.secondaryButton]} 
            onPress={() => router.push('/(auth)/signup')}
            activeOpacity={0.8}
          >
            <Ionicons name="person-add-outline" size={20} color="#fff" style={styles.buttonIcon} />
            <Text style={[styles.buttonText, styles.secondaryButtonText]}>
              {translations[language].register || 'Create Account'}
            </Text>
          </TouchableOpacity>
        </Animatable.View>

        {/* Features Section */}
        <Animatable.View 
          animation="fadeInUp" 
          duration={1000} 
          delay={1200}
          style={styles.featuresContainer}
        >
          <View style={styles.feature}>
            <Ionicons name="shield-checkmark-outline" size={20} color="#BF2000" />
            <Text style={styles.featureText}>Certified Professionals</Text>
          </View>
          <View style={styles.feature}>
            <Ionicons name="time-outline" size={20} color="#BF2000" />
            <Text style={styles.featureText}>24/7 Service</Text>
          </View>
          <View style={styles.feature}>
            <Ionicons name="star-outline" size={20} color="#BF2000" />
            <Text style={styles.featureText}>Quality Guaranteed</Text>
          </View>
        </Animatable.View>
      </View>
    </View>
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
  langToggleAbsolute: {
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
  langToggleText: {
    color: '#000',
    fontWeight: '600',
    fontSize: 14,
  },
  logoSection: {
    alignItems: 'center',
    paddingTop: 100,
    zIndex: 2,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
    marginBottom: 12,
  },
  logo: {
    width: 70,
    height: 70,
  },
  brandName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 2,
    marginBottom: 4,
  },
  tagline: {
    fontSize: 14,
    color: '#BF2000',
    fontWeight: '500',
    letterSpacing: 1,
  },
  content: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 50,
    zIndex: 2,
  },
  textContainer: {
    alignItems: 'center',
    paddingHorizontal: 30,
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: 0.5,
    lineHeight: 38,
  },
  subtitle: {
    fontSize: 16,
    color: '#E0E0E0',
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: '400',
    opacity: 0.9,
  },
  buttonContainer: {
    width: width - 40,
    gap: 16,
    marginBottom: 30,
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
  },
  primaryButton: {
    backgroundColor: '#FFFFFF',
  },
  secondaryButton: {
    backgroundColor: 'rgba(0,0,0,0.8)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  primaryButtonText: {
    color: '#000',
  },
  secondaryButtonText: {
    color: '#fff',
  },
  featuresContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingHorizontal: 20,
  },
  feature: {
    alignItems: 'center',
    flex: 1,
  },
  featureText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
    textAlign: 'center',
  },
});

export default IntroScreen;