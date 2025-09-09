import React, { useEffect } from 'react';
import { View, Image, StyleSheet, StatusBar, Text } from 'react-native';
import { useRouter } from 'expo-router';
import * as Animatable from 'react-native-animatable';

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
      <Animatable.View
        animation="zoomIn"
        duration={2000}
        style={styles.logoContainer}
        iterationDelay={500}
        easing="ease-in"
      >
        <Image
          source={require('../../assets/images/irepairlogo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </Animatable.View>
      <Animatable.Text
        animation="fadeInUp"
        duration={1800}
        delay={800}
        style={styles.slogan}
      >
        Effectuer les réparations{'\n'}avec précision et soin
      </Animatable.Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF', // White background
  },
  logoContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 50,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  logo: {
    width: 200,
    height: 200,
  },
  slogan: {
    textAlign: 'center',
    fontSize: 24,
    color: '#000', // Black text
    fontWeight: '600',
    letterSpacing: 1.5,
    fontStyle: 'italic',
    fontFamily: 'System',
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 6,
    lineHeight: 32,
  },
});

export default SplashScreen;