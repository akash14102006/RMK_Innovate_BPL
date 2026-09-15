/**
 * Bharat PulseLink — Hospital Cluster Marker Component (Prompt 44)
 *
 * Renders aggregated count for dense hospital zones with
 * calm concentric rings. Tapping zooms into the cluster.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { HospitalMapCluster } from '../../types/map';

export interface HospitalClusterMarkerProps {
  cluster: HospitalMapCluster;
  onPress: (cluster: HospitalMapCluster) => void;
}

export const HospitalClusterMarker: React.FC<HospitalClusterMarkerProps> = ({
  cluster,
  onPress,
}) => {
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onPress(cluster)}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={`Cluster of ${cluster.count} hospitals, tap to expand`}
    >
      <View style={styles.outerRing}>
        <View style={styles.innerCore}>
          <Text style={styles.countText}>{cluster.count}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  outerRing: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(15, 118, 110, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0F766E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  innerCore: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#0F766E',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  countText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});

export default HospitalClusterMarker;
