import React from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';

interface MapLocation {
  latitude: number;
  longitude: number;
}

interface OpenStreetMapViewProps {
  location: MapLocation;
  title?: string;
  description?: string;
  interactive?: boolean;
  zoom?: number;
  style?: any;
  onLocationSelect?: (location: MapLocation) => void;
}

const OpenStreetMapView: React.FC<OpenStreetMapViewProps> = ({
  location,
  title = '',
  description = '',
  interactive = false,
  zoom = 15,
  style,
  onLocationSelect
}) => {
  
  const handleMessage = (event: any) => {
    if (onLocationSelect && interactive) {
      try {
        const data = JSON.parse(event.nativeEvent.data);
        if (data.type === 'mapClick') {
          const { latitude, longitude } = data;
          onLocationSelect({ latitude, longitude });
        }
      } catch (error) {
        console.warn('Failed to parse map message:', error);
      }
    }
  };

  const generateHTML = () => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
           integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
           crossorigin=""/>
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
              integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo="
              crossorigin=""></script>
      <style>
        html, body { 
          height: 100%; 
          margin: 0; 
          padding: 0; 
        }
        #map { 
          height: 100vh; 
          width: 100vw;
        }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        var map = L.map('map').setView([${location.latitude}, ${location.longitude}], ${zoom});
        
        // Use OpenStreetMap tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);
        
        // Add marker
        var marker = L.marker([${location.latitude}, ${location.longitude}]).addTo(map);
        ${title || description ? `marker.bindPopup('${title}${title && description ? '<br>' : ''}${description}').openPopup();` : ''}
        
        ${!interactive ? `
          // Disable interaction for display-only map
          map.dragging.disable();
          map.touchZoom.disable();
          map.doubleClickZoom.disable();
          map.scrollWheelZoom.disable();
          map.boxZoom.disable();
          map.keyboard.disable();
          if (map.tap) map.tap.disable();
          document.getElementById('map').style.cursor = 'default';
        ` : `
          // Enable interaction for selectable map
          var currentMarker = marker;
          
          map.on('click', function(e) {
            // Remove previous marker
            if (currentMarker) {
              map.removeLayer(currentMarker);
            }
            
            // Add new marker
            currentMarker = L.marker([e.latlng.lat, e.latlng.lng]).addTo(map);
            
            // Send location data to React Native
            if (window.ReactNativeWebView) {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'mapClick',
                latitude: e.latlng.lat,
                longitude: e.latlng.lng
              }));
            }
          });
        `}
      </script>
    </body>
    </html>
  `;

  return (
    <View style={[styles.container, style]}>
      <WebView
        style={styles.webview}
        source={{ html: generateHTML() }}
        onMessage={handleMessage}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        scrollEnabled={interactive}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
  webview: {
    flex: 1,
  },
});

export default OpenStreetMapView;