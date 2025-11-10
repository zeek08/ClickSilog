import { useState, useEffect, useMemo, useCallback } from 'react';
import { Dimensions, useWindowDimensions } from 'react-native';
import { 
  getScreenDimensions, 
  getCurrentBreakpoint, 
  getSpacing, 
  scaleFont, 
  scaleWidth, 
  scaleHeight,
  FLEX_LAYOUTS,
  COMPONENT_BOUNDARIES,
  CONTAINER_GROUPS,
  BOUNDARY_RELATIONSHIPS,
} from '../utils/layoutBoundaries';
import { 
  getCachedDimensions, 
  clearDimensionCache, 
  detectDeviceType,
  getDeviceLayoutAdjustments,
} from '../utils/deviceDetection';

/**
 * Hook for responsive layout with boundary-based relationships
 * Updates when screen size changes (e.g., device rotation)
 * Caches layout calculations to avoid recomputation on every render
 */
export const useResponsiveLayout = () => {
  const windowDimensions = useWindowDimensions();
  const [dimensions, setDimensions] = useState(() => getScreenDimensions());
  const [breakpoint, setBreakpoint] = useState(() => getCurrentBreakpoint());

  // Memoize device type detection
  const deviceType = useMemo(() => detectDeviceType(), [dimensions.width, dimensions.height]);
  
  // Memoize layout adjustments
  const layoutAdjustments = useMemo(() => getDeviceLayoutAdjustments(), [deviceType]);

  // Update dimensions on orientation change only
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      clearDimensionCache(); // Clear cache on orientation change
      const newDimensions = getScreenDimensions();
      const newBreakpoint = getCurrentBreakpoint();
      setDimensions(newDimensions);
      setBreakpoint(newBreakpoint);
    });

    return () => subscription?.remove();
  }, []);

  // Memoize return value to prevent unnecessary re-renders
  return useMemo(() => ({
    ...dimensions,
    breakpoint,
    deviceType,
    layoutAdjustments,
    getSpacing, // Renamed to avoid confusion with theme.spacing
    scaleFont,
    scaleWidth,
    scaleHeight,
    layouts: FLEX_LAYOUTS,
    boundaries: COMPONENT_BOUNDARIES,
    containers: CONTAINER_GROUPS,
    relationships: BOUNDARY_RELATIONSHIPS,
  }), [dimensions, breakpoint, deviceType, layoutAdjustments]);
};

export default useResponsiveLayout;

