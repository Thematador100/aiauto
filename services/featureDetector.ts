// services/featureDetector.ts
// This service now proxies feature detection through the Railway backend
import { backendService } from './backendService';

/**
 * Detects vehicle features from an image via backend AI vision service.
 * Backend handles API keys securely (uses Gemini vision model)
 *
 * @param imageBase64 The base64 encoded image data.
 * @returns A promise that resolves to an array of detected feature strings.
 */
export const detectVehicleFeaturesFromImage = async (imageBase64: string): Promise<string[]> => {
  console.log('[FeatureDetector] Proxying feature detection through Railway backend');

  try {
    const features = await backendService.detectVehicleFeatures(imageBase64);
    return features;
  } catch (error) {
    console.error('[FeatureDetector] Error detecting vehicle features:', error);
    return ['Feature detection unavailable - backend error'];
  }
};
