import { useState, useCallback } from 'react';
import { InspectionState, Vehicle, InspectionChecklistItem, InspectionSection, InspectionPhoto, InspectionAudio, ConditionRating } from '../types';
import { VEHICLE_INSPECTION_TEMPLATES, COMMERCIAL_DOT_COMPLIANCE, RV_HABITABILITY_CHECKLIST, CLASSIC_AUTHENTICITY_CHECKLIST } from '../constants';

export type VehicleType = keyof typeof VEHICLE_INSPECTION_TEMPLATES;

const createChecklistFromTemplate = (template: Record<string, string[]>): InspectionSection => {
  const checklist: InspectionSection = {};
  for (const category in template) {
    const items = template[category] as string[];
    if (Array.isArray(items)) {
      checklist[category] = items.map((item: string): InspectionChecklistItem => ({
        item,
        checked: false,
        condition: 'unchecked',
        notes: '',
        photos: [],
        audio: null,
      }));
    }
  }
  return checklist;
};

const createInitialChecklist = (vehicleType: VehicleType): InspectionSection => {
  const template = VEHICLE_INSPECTION_TEMPLATES[vehicleType];
  return createChecklistFromTemplate(template as Record<string, string[]>);
};

const createComplianceChecklist = (vehicleType: VehicleType): InspectionSection => {
  switch (vehicleType) {
    case 'Commercial':
      return createChecklistFromTemplate(COMMERCIAL_DOT_COMPLIANCE);
    case 'RV':
      return createChecklistFromTemplate(RV_HABITABILITY_CHECKLIST);
    case 'Classic':
      return createChecklistFromTemplate(CLASSIC_AUTHENTICITY_CHECKLIST);
    default:
      return {};
  }
};

export const useInspectionState = () => {
  const [state, setState] = useState<InspectionState | null>(null);

  const initializeState = useCallback((vehicle: Vehicle, vehicleType: VehicleType) => {
    setState({
      vehicle,
      vehicleType,
      checklist: createInitialChecklist(vehicleType),
      complianceChecklist: createComplianceChecklist(vehicleType),
      overallNotes: '',
      odometer: '',
    });
  }, []);

  const updateChecklistItem = useCallback((category: string, itemIndex: number, updates: Partial<InspectionChecklistItem>) => {
    setState(prevState => {
      if (!prevState) return null;

      // Check if this category is in the main checklist or compliance checklist
      const isCompliance = !(category in prevState.checklist) && category in prevState.complianceChecklist;
      const targetKey = isCompliance ? 'complianceChecklist' : 'checklist';
      const targetChecklist = { ...prevState[targetKey] };
      const newItems = [...targetChecklist[category]];
      newItems[itemIndex] = { ...newItems[itemIndex], ...updates };
      targetChecklist[category] = newItems;
      return { ...prevState, [targetKey]: targetChecklist };
    });
  }, []);

  const setOdometer = useCallback((value: string) => {
    setState(prevState => prevState ? { ...prevState, odometer: value } : null);
  }, []);

  const setOverallNotes = useCallback((value: string) => {
    setState(prevState => prevState ? { ...prevState, overallNotes: value } : null);
  }, []);

  const addPhotoToChecklistItem = useCallback((category: string, itemIndex: number, photo: InspectionPhoto) => {
    setState(prevState => {
        if (!prevState) return null;
        const isCompliance = !(category in prevState.checklist) && category in prevState.complianceChecklist;
        const targetKey = isCompliance ? 'complianceChecklist' : 'checklist';
        const targetChecklist = { ...prevState[targetKey] };
        const newItems = [...targetChecklist[category]];
        const currentItem = { ...newItems[itemIndex] };
        currentItem.photos = [...currentItem.photos, photo];
        newItems[itemIndex] = currentItem;
        targetChecklist[category] = newItems;
        return { ...prevState, [targetKey]: targetChecklist };
    });
  }, []);

  const removePhotoFromChecklistItem = useCallback((category: string, itemIndex: number, photoId: string) => {
    setState(prevState => {
        if (!prevState) return null;
        const isCompliance = !(category in prevState.checklist) && category in prevState.complianceChecklist;
        const targetKey = isCompliance ? 'complianceChecklist' : 'checklist';
        const targetChecklist = { ...prevState[targetKey] };
        const newItems = [...targetChecklist[category]];
        const currentItem = { ...newItems[itemIndex] };
        currentItem.photos = currentItem.photos.filter(p => p.id !== photoId);
        newItems[itemIndex] = currentItem;
        targetChecklist[category] = newItems;
        return { ...prevState, [targetKey]: targetChecklist };
    });
  }, []);

  const addAudioToChecklistItem = useCallback((category: string, itemIndex: number, audio: InspectionAudio) => {
    setState(prevState => {
        if (!prevState) return null;
        const isCompliance = !(category in prevState.checklist) && category in prevState.complianceChecklist;
        const targetKey = isCompliance ? 'complianceChecklist' : 'checklist';
        const targetChecklist = { ...prevState[targetKey] };
        const newItems = [...targetChecklist[category]];
        const currentItem = { ...newItems[itemIndex] };
        currentItem.audio = audio;
        newItems[itemIndex] = currentItem;
        targetChecklist[category] = newItems;
        return { ...prevState, [targetKey]: targetChecklist };
    });
  }, []);

  return {
    inspectionState: state,
    initializeState,
    updateChecklistItem,
    setOdometer,
    setOverallNotes,
    addPhotoToChecklistItem,
    removePhotoFromChecklistItem,
    addAudioToChecklistItem,
  };
};
