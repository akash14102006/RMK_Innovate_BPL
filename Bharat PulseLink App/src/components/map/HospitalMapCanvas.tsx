import React from 'react';
import { Platform } from 'react-native';
import HospitalMapCanvasNative from './HospitalMapCanvas.native';
import HospitalMapCanvasWeb from './HospitalMapCanvas.web';
import { HospitalMapMarkerData, MapRegion } from '../../types/map';
import { GeoLocationState } from '../../types/hospitals';

export interface HospitalMapCanvasProps {
  hospitals: HospitalMapMarkerData[];
  selectedHospital: HospitalMapMarkerData | null;
  searchLocation: GeoLocationState;
  onSelectHospital: (hospital: HospitalMapMarkerData) => void;
  onRegionChangeComplete?: (region: MapRegion) => void;
  region: MapRegion;
  setRegion: (region: MapRegion) => void;
}

export const HospitalMapCanvas: React.FC<HospitalMapCanvasProps> = (props) => {
  if (Platform.OS === 'web') {
    return <HospitalMapCanvasWeb {...props} />;
  }
  return <HospitalMapCanvasNative {...props} />;
};

export default HospitalMapCanvas;
