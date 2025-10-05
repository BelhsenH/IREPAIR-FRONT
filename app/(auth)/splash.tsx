import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { Dimensions, Image, StatusBar, StyleSheet, Text, View } from 'react-native';
import * as Animatable from 'react-native-animatable';

const { width, height } = Dimensions.get('window');

const SplashScreen: React.FC = () => {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace('/(auth)/intro');
    }, 3500);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <View style={styles.container}>
      <StatusBar hidden />
      
      {/* Modern gradient background */}
      <LinearGradient
        colors={['#FFFFFF', '#F8F9FA', '#FFFFFF']}
        style={styles.gradient}
        locations={[0, 0.5, 1]}
      />
      
      {/* Animated background elements */}
      <Animatable.View
        animation="pulse"
        iterationCount="infinite"
        duration={4000}
        style={styles.backgroundCircle1}
      />
      <Animatable.View
        animation="pulse"
        iterationCount="infinite"
        duration={3000}
        delay={1000}
        style={styles.backgroundCircle2}
      />
      
      {/* Main content */}
      <View style={styles.contentContainer}>
        <Animatable.View
          animation="zoomIn"
          duration={1500}
          style={styles.logoContainer}
          iterationDelay={300}
          easing="ease-out"
        >
          <View style={styles.logoWrapper}>
            <Image
              source={require('../../assets/images/irepairlogo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
        </Animatable.View>
        
        <Animatable.View
          animation="fadeInUp"
          duration={1200}
          delay={800}
          style={styles.textContainer}
        >
          <Text style={styles.brandName}>iRepair</Text>
          <Text style={styles.slogan}>
            Effectuer les réparations{'\n'}avec précision et soin
          </Text>
          <View style={styles.taglineContainer}>
            <Text style={styles.tagline}>Professional Auto Care Solutions</Text>
          </View>
        </Animatable.View>
        
        {/* Loading indicator */}
        <Animatable.View
          animation="fadeIn"
          duration={800}
          delay={1500}
          style={styles.loadingContainer}
        >
          <View style={styles.loadingDots}>
            <Animatable.View
              animation="bounce"
              iterationCount="infinite"
              duration={1000}
              style={[styles.dot, styles.dot1]}
            />
            <Animatable.View
              animation="bounce"
              iterationCount="infinite"
              duration={1000}
              delay={200}
              style={[styles.dot, styles.dot2]}
            />
            <Animatable.View
              animation="bounce"
              iterationCount="infinite"
              duration={1000}
              delay={400}
              style={[styles.dot, styles.dot3]}
            />
          </View>
        </Animatable.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    position: 'relative',
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  backgroundCircle1: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(255, 215, 0, 0.05)',
    top: '10%',
    right: '-20%',
  },
  backgroundCircle2: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
    bottom: '15%',
    left: '-15%',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  logoContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  logoWrapper: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 15,
    borderWidth: 3,
    borderColor: 'rgba(255, 215, 0, 0.1)',
  },
  logo: {
    width: 100,
    height: 100,
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  brandName: {
    fontSize: 36,
    fontWeight: '800' as const,
    color: '#000',
    letterSpacing: 3,
    marginBottom: 12,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  slogan: {
    textAlign: 'center',
    fontSize: 18,
    color: '#333',
    fontWeight: '500' as const,
    letterSpacing: 1,
    fontStyle: 'italic',
    lineHeight: 26,
    marginBottom: 16,
    paddingHorizontal: 40,
  },
  taglineContainer: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.2)',
  },
  tagline: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600' as const,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  loadingContainer: {
    position: 'absolute',
    bottom: 80,
    alignItems: 'center',
  },
  loadingDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dot1: {
    backgroundColor: '#FFD700',
  },
  dot2: {
    backgroundColor: '#333',
  },
  dot3: {
    backgroundColor: '#FFD700',
  },
});

export default SplashScreen;