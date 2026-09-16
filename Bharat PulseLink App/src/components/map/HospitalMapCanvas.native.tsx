/**
 * Bharat PulseLink — Hospital Map Canvas Component (Prompt 44) Native Implementation
 *
 * Core geospatial rendering surface:
 * 1. Native MapView integration (via react-native-maps)
 * 2. High-performance interactive fallback canvas for testing/offline resilience
 * 3. Marker & cluster projections
 * 4. User search origin marker
 * 5. Selection and focus handling
 */

import React, { useRef, useEffect, useState, useMemo } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Text,
  TouchableOpacity,
  PanResponder,
} from 'react-native';
import Svg, { Rect, Circle, Line, Path, G } from 'react-native-svg';
import { HospitalMapMarkerData, HospitalMapCluster, MapRegion, MapItem } from '../../types/map';
import { GeoLocationState } from '../../types/hospitals';
import HospitalMapService from '../../services/HospitalMapService';
import HospitalMapMarker from './HospitalMapMarker';
import HospitalClusterMarker from './HospitalClusterMarker';
import MapView, { Marker as NativeMarker } from 'react-native-maps';

const NativeMapView: any = MapView;

export interface HospitalMapCanvasProps {
  hospitals: HospitalMapMarkerData[];
  selectedHospital: HospitalMapMarkerData | null;
  searchLocation: GeoLocationState;
  onSelectHospital: (hospital: HospitalMapMarkerData) => void;
  onRegionChangeComplete?: (region: MapRegion) => void;
  region: MapRegion;
  setRegion: (region: MapRegion) => void;
}

export const HospitalMapCanvas: React.FC<HospitalMapCanvasProps> = ({
  hospitals,
  selectedHospital,
  searchLocation,
  onSelectHospital,
  onRegionChangeComplete,
  region,
  setRegion,
}) => {
  const mapRef = useRef<any>(null);
  const isMapReady = useRef(false);
  const [hasMapRenderError, setHasMapRenderError] = useState(false);
  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

  // Compute clustered map items based on active zoom/region
  const mapItems = useMemo(() => {
    return HospitalMapService.clusterHospitalMarkers(hospitals, region);
  }, [hospitals, region]);

  const pendingRegionRef = useRef<MapRegion | null>(null);

  // Center on selected hospital if chosen
  useEffect(() => {
    if (selectedHospital && isMapReady.current && mapRef.current?.animateToRegion) {
      mapRef.current.animateToRegion(
        {
          latitude: selectedHospital.latitude,
          longitude: selectedHospital.longitude,
          latitudeDelta: 0.035,
          longitudeDelta: 0.035,
        },
        500
      );
    }
  }, [selectedHospital]);

  // When region is updated programmatically from outside (e.g. recenter / fitBounds / GPS acquired)
  useEffect(() => {
    if (region && typeof region.latitude === 'number' && typeof region.longitude === 'number') {
      if (isMapReady.current && mapRef.current?.animateToRegion) {
        mapRef.current.animateToRegion(region, 400);
      } else {
        pendingRegionRef.current = region;
      }
    }
  }, [region.latitude, region.longitude, region.latitudeDelta, region.longitudeDelta]);

  // When searchLocation coordinates arrive or change (e.g. fresh GPS acquired)
  useEffect(() => {
    if (searchLocation.latitude && searchLocation.longitude) {
      const target: MapRegion = {
        latitude: searchLocation.latitude,
        longitude: searchLocation.longitude,
        latitudeDelta: region.latitudeDelta || 0.05,
        longitudeDelta: region.longitudeDelta || 0.05,
      };
      if (isMapReady.current && mapRef.current?.animateToRegion) {
        mapRef.current.animateToRegion(target, 400);
      } else {
        pendingRegionRef.current = target;
      }
    }
  }, [searchLocation.latitude, searchLocation.longitude]);

  const handleClusterPress = (cluster: HospitalMapCluster) => {
    const newRegion: MapRegion = {
      latitude: cluster.latitude,
      longitude: cluster.longitude,
      latitudeDelta: region.latitudeDelta / 2.2,
      longitudeDelta: region.longitudeDelta / 2.2,
    };
    setRegion(newRegion);
    if (isMapReady.current && mapRef.current?.animateToRegion) {
      mapRef.current.animateToRegion(newRegion, 400);
    }
  };

  // Convert lat/lng to SVG 2D Canvas coordinate space for fallback renderer
  const projectToCanvas = (lat: number, lng: number) => {
    const minLat = region.latitude - region.latitudeDelta / 2;
    const maxLat = region.latitude + region.latitudeDelta / 2;
    const minLng = region.longitude - region.longitudeDelta / 2;
    const maxLng = region.longitude + region.longitudeDelta / 2;

    const x = ((lng - minLng) / (maxLng - minLng)) * screenWidth;
    const y = ((maxLat - lat) / (maxLat - minLat)) * (screenHeight * 0.55);

    return { x: Math.max(20, Math.min(screenWidth - 20, x)), y: Math.max(20, Math.min(screenHeight * 0.55 - 20, y)) };
  };

  // Drag & Pan support for SVG fallback canvas
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderRelease: (_, gestureState) => {
        const dLat = (gestureState.dy / (screenHeight * 0.55)) * region.latitudeDelta;
        const dLng = -(gestureState.dx / screenWidth) * region.longitudeDelta;
        if (Math.abs(gestureState.dx) > 5 || Math.abs(gestureState.dy) > 5) {
          const next = {
            ...region,
            latitude: region.latitude + dLat,
            longitude: region.longitude + dLng,
          };
          setRegion(next);
          onRegionChangeComplete?.(next);
        }
      },
    })
  ).current;

  // Render native MapView if available
  if (NativeMapView && !hasMapRenderError) {
    return (
      <View style={styles.container} testID="native-map-container">
        <NativeMapView
          ref={mapRef}
          style={styles.map}
          initialRegion={{
            latitude: searchLocation.latitude ?? region.latitude,
            longitude: searchLocation.longitude ?? region.longitude,
            latitudeDelta: region.latitudeDelta,
            longitudeDelta: region.longitudeDelta,
          }}
          onRegionChangeComplete={(r: MapRegion) => {
            setRegion(r);
            onRegionChangeComplete?.(r);
          }}
          onMapReady={() => {
            isMapReady.current = true;
            const target = pendingRegionRef.current || region;
            if (
              target &&
              typeof target.latitude === 'number' &&
              typeof target.longitude === 'number' &&
              mapRef.current?.animateToRegion
            ) {
              mapRef.current.animateToRegion(target, 400);
              pendingRegionRef.current = null;
            }
          }}
          showsUserLocation={true}
          showsMyLocationButton={false}
          showsCompass={false}
          toolbarEnabled={false}
          onError={() => setHasMapRenderError(true)}
        >
          {/* User Search Origin Anchor Marker */}
          {searchLocation.latitude && searchLocation.longitude && NativeMarker && (
            <NativeMarker
              coordinate={{
                latitude: searchLocation.latitude,
                longitude: searchLocation.longitude,
              }}
              title="Your Location"
              accessibilityLabel="Current Patient Location Marker"
              anchor={{ x: 0.5, y: 0.5 }}
            >
              <View style={styles.userOriginMarker}>
                <View style={styles.userOriginCenter} />
              </View>
            </NativeMarker>
          )}

          {/* Dynamic Clustered & Single Hospital Markers */}
          {mapItems.map((item: MapItem) => {
            if (item.type === 'CLUSTER' && NativeMarker) {
              const cluster = item.data;
              return (
                <NativeMarker
                  key={`cluster-${cluster.id}`}
                  coordinate={{
                    latitude: cluster.latitude,
                    longitude: cluster.longitude,
                  }}
                  onPress={() => handleClusterPress(cluster)}
                  tracksViewChanges={false}
                >
                  <HospitalClusterMarker cluster={cluster} onPress={handleClusterPress} />
                </NativeMarker>
              );
            }

            if (item.type === 'MARKER' && NativeMarker) {
              const hospital = item.data;
              const isSelected = selectedHospital?.id === hospital.id;
              return (
                <NativeMarker
                  key={`marker-${hospital.id}`}
                  coordinate={{
                    latitude: hospital.latitude,
                    longitude: hospital.longitude,
                  }}
                  onPress={() => onSelectHospital(hospital)}
                  tracksViewChanges={false}
                >
                  <HospitalMapMarker marker={hospital} isSelected={isSelected} onPress={onSelectHospital} />
                </NativeMarker>
              );
            }
            return null;
          })}
        </NativeMapView>
      </View>
    );
  }

  // ── High-Performance Interactive SVG Canvas Fallback ─────────────────────
  const userPoint = searchLocation.latitude && searchLocation.longitude
    ? projectToCanvas(searchLocation.latitude, searchLocation.longitude)
    : null;

  return (
    <View style={styles.container} {...panResponder.panHandlers} testID="svg-map-fallback">
      <Svg width={screenWidth} height={screenHeight * 0.55} style={styles.svgCanvas}>
        {/* Background Grid Map Styling */}
        <Rect width="100%" height="100%" fill="#E0F2FE" />

        {/* Arterial Grid Roads */}
        <Line x1="0" y1={screenHeight * 0.25} x2={screenWidth} y2={screenHeight * 0.25} stroke="#BAE6FD" strokeWidth="4" />
        <Line x1="0" y1={screenHeight * 0.4} x2={screenWidth} y2={screenHeight * 0.4} stroke="#BAE6FD" strokeWidth="6" />
        <Line x1={screenWidth * 0.35} y1="0" x2={screenWidth * 0.35} y2={screenHeight * 0.55} stroke="#BAE6FD" strokeWidth="5" />
        <Line x1={screenWidth * 0.7} y1="0" x2={screenWidth * 0.7} y2={screenHeight * 0.55} stroke="#BAE6FD" strokeWidth="4" />

        {/* Waterway / Coastal curve aesthetic */}
        <Path
          d={`M ${screenWidth * 0.85} 0 Q ${screenWidth * 0.75} ${screenHeight * 0.25} ${screenWidth * 0.9} ${screenHeight * 0.55} L ${screenWidth} ${screenHeight * 0.55} L ${screenWidth} 0 Z`}
          fill="#BFDBFE"
        />

        {/* User Search Origin Pin on SVG */}
        {userPoint && (
          <G x={userPoint.x} y={userPoint.y}>
            <Circle r="14" fill="#3B82F6" fillOpacity="0.25" />
            <Circle r="6" fill="#1D4ED8" stroke="#FFFFFF" strokeWidth="2" />
          </G>
        )}
      </Svg>

      {/* SVG Canvas Marker Overlay */}
      {mapItems.map((item: MapItem) => {
        if (item.type === 'CLUSTER') {
          const cluster = item.data;
          const pt = projectToCanvas(cluster.latitude, cluster.longitude);
          return (
            <TouchableOpacity
              key={`svg-cluster-${cluster.id}`}
              style={[styles.canvasMarkerAbsolute, { left: pt.x - 20, top: pt.y - 20 }]}
              onPress={() => handleClusterPress(cluster)}
            >
              <HospitalClusterMarker cluster={cluster} onPress={handleClusterPress} />
            </TouchableOpacity>
          );
        }

        if (item.type === 'MARKER') {
          const hospital = item.data;
          const pt = projectToCanvas(hospital.latitude, hospital.longitude);
          const isSelected = selectedHospital?.id === hospital.id;
          return (
            <TouchableOpacity
              key={`svg-marker-${hospital.id}`}
              style={[styles.canvasMarkerAbsolute, { left: pt.x - 18, top: pt.y - 18 }]}
              onPress={() => onSelectHospital(hospital)}
            >
              <HospitalMapMarker marker={hospital} isSelected={isSelected} onPress={onSelectHospital} />
            </TouchableOpacity>
          );
        }
        return null;
      })}

      {/* Offline/Fallback Mode Badge */}
      <View style={styles.fallbackNoticeBadge}>
        <Text style={styles.fallbackNoticeText}>Interactive Map Canvas</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E0F2FE',
    overflow: 'hidden',
  },
  map: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  svgCanvas: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  canvasMarkerAbsolute: {
    position: 'absolute',
    zIndex: 10,
  },
  userOriginMarker: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(59, 130, 246, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userOriginCenter: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#1D4ED8',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  fallbackNoticeBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  fallbackNoticeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});

export default HospitalMapCanvas;
