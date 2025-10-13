import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const TestOptimizedPages = () => {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#2563EB', '#3B82F6']}
        style={styles.header}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Test Optimized Pages</Text>
        <View style={styles.headerSpacer} />
      </LinearGradient>

      <View style={styles.content}>
        <Text style={styles.description}>
          Test the new optimized conversation pages with improved performance and better UI
        </Text>

        <TouchableOpacity
          style={styles.testButton}
          onPress={() => router.push('/(home)/conversations-optimized')}
        >
          <LinearGradient
            colors={['#2563EB', '#3B82F6']}
            style={styles.buttonGradient}
          >
            <Ionicons name="chatbubbles" size={24} color="white" />
            <Text style={styles.buttonText}>Optimized Conversations List</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.testButton}
          onPress={() => router.push('/(home)/conversations')}
        >
          <LinearGradient
            colors={['#6B7280', '#9CA3AF']}
            style={styles.buttonGradient}
          >
            <Ionicons name="chatbubbles-outline" size={24} color="white" />
            <Text style={styles.buttonText}>Original Conversations</Text>
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.featuresContainer}>
          <Text style={styles.featuresTitle}>Optimizations Include:</Text>
          
          <View style={styles.feature}>
            <Ionicons name="flash" size={20} color="#10B981" />
            <Text style={styles.featureText}>Faster loading with memoization</Text>
          </View>
          
          <View style={styles.feature}>
            <Ionicons name="refresh" size={20} color="#10B981" />
            <Text style={styles.featureText}>Optimized WebSocket handling</Text>
          </View>
          
          <View style={styles.feature}>
            <Ionicons name="eye" size={20} color="#10B981" />
            <Text style={styles.featureText}>Better UI for sent/received messages</Text>
          </View>
          
          <View style={styles.feature}>
            <Ionicons name="layers" size={20} color="#10B981" />
            <Text style={styles.featureText}>Virtual scrolling for performance</Text>
          </View>
          
          <View style={styles.feature}>
            <Ionicons name="code-slash" size={20} color="#10B981" />
            <Text style={styles.featureText}>Reduced re-renders and memory usage</Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    color: 'white',
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  description: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  testButton: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
  },
  featuresContainer: {
    marginTop: 32,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 12,
    flex: 1,
  },
});

export default TestOptimizedPages;