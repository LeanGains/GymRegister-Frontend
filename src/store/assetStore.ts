import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Asset {
  id: number;
  asset_tag: string;
  item_type: string;
  description: string;
  location: string;
  last_seen: string;
  status: 'Active' | 'Out of Service' | 'Missing';
  weight?: string;
  condition: 'Excellent' | 'Good' | 'Fair' | 'Poor' | 'Needs Repair';
  notes?: string;
}

export interface AuditLog {
  id: number;
  asset_tag: string;
  action: string;
  timestamp: string;
  location: string;
  notes?: string;
}

export interface AnalysisResult {
  asset_tags: Array<{
    tag: string;
    confidence: number;
    location_description: string;
  }>;
  equipment: Array<{
    type: string;
    weight: string;
    description: string;
    condition: string;
    suggested_asset_tag: string;
    location_in_image: string;
  }>;
  image_quality: string;
  total_items: number;
  recommendations?: string;
  error?: string;
  raw_response?: string;
}

export interface StoredAnalysisResult {
  id: string;
  timestamp: string;
  result: any;
  image: string;
}

interface AssetStore {
  // Assets data
  assets: Asset[];
  auditLogs: AuditLog[];
  
  // UI state
  loading: boolean;
  error: string | null;
  
  // Analysis state
  analysisResult: AnalysisResult | null;
  analysisHistory: StoredAnalysisResult[];
  registeredItems: Set<string>;
  
  // Actions
  setAssets: (assets: Asset[]) => void;
  addAsset: (asset: Omit<Asset, 'id'>) => void;
  updateAsset: (id: number, updates: Partial<Asset>) => void;
  deleteAsset: (id: number) => void;
  
  setAuditLogs: (logs: AuditLog[]) => void;
  addAuditLog: (log: Omit<AuditLog, 'id'>) => void;
  
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  setAnalysisResult: (result: AnalysisResult | null) => void;
  addAnalysisResult: (result: StoredAnalysisResult) => void;
  clearAnalysisHistory: () => void;
  addRegisteredItem: (itemKey: string) => void;
  removeRegisteredItem: (itemKey: string) => void;
  clearRegisteredItems: () => void;
  
  // Computed getters
  getAssetByTag: (tag: string) => Asset | undefined;
  getAssetsByType: (type: string) => Asset[];
  getAssetsByStatus: (status: string) => Asset[];
  getAssetsByLocation: (location: string) => Asset[];
  
  // Statistics
  getTotalAssets: () => number;
  getActiveAssets: () => number;
  getMissingAssets: () => number;
  getAssetsNeedingRepair: () => number;
}

export const useAssetStore = create<AssetStore>()(
  persist(
    (set, get) => ({
      // Initial state
      assets: [],
      auditLogs: [],
      loading: false,
      error: null,
      analysisResult: null,
      analysisHistory: [],
      registeredItems: new Set(),

      // Asset actions
      setAssets: (assets) => set({ assets }),
      
      addAsset: (assetData) => {
        const newAsset: Asset = {
          ...assetData,
          id: Date.now(), // Simple ID generation for in-memory storage
        };
        
        set((state) => ({
          assets: [...state.assets, newAsset],
        }));
        
        // Add audit log
        get().addAuditLog({
          asset_tag: assetData.asset_tag,
          action: 'REGISTERED',
          timestamp: new Date().toISOString(),
          location: assetData.location,
          notes: `Added ${assetData.item_type}`,
        });
      },
      
      updateAsset: (id, updates) => {
        set((state) => ({
          assets: state.assets.map((asset) =>
            asset.id === id ? { ...asset, ...updates } : asset
          ),
        }));
        
        // Add audit log for location updates
        if (updates.location) {
          const asset = get().assets.find(a => a.id === id);
          if (asset) {
            get().addAuditLog({
              asset_tag: asset.asset_tag,
              action: 'MOVED',
              timestamp: new Date().toISOString(),
              location: updates.location,
              notes: updates.notes || 'Location updated',
            });
          }
        }
      },
      
      deleteAsset: (id) => {
        const asset = get().assets.find(a => a.id === id);
        if (asset) {
          set((state) => ({
            assets: state.assets.filter((a) => a.id !== id),
          }));
          
          get().addAuditLog({
            asset_tag: asset.asset_tag,
            action: 'DELETED',
            timestamp: new Date().toISOString(),
            location: asset.location,
            notes: 'Asset removed from system',
          });
        }
      },

      // Audit log actions
      setAuditLogs: (logs) => set({ auditLogs: logs }),
      
      addAuditLog: (logData) => {
        const newLog: AuditLog = {
          ...logData,
          id: Date.now(),
        };
        
        set((state) => ({
          auditLogs: [...state.auditLogs, newLog],
        }));
      },

      // UI state actions
      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),

      // Analysis actions
      setAnalysisResult: (result) => set({ analysisResult: result }),
      
      addAnalysisResult: (result) => {
        set((state) => ({
          analysisHistory: [...state.analysisHistory, result],
        }));
      },
      
      clearAnalysisHistory: () => set({ analysisHistory: [] }),
      
      addRegisteredItem: (itemKey) => {
        set((state) => ({
          registeredItems: new Set([...Array.from(state.registeredItems), itemKey]),
        }));
      },
      
      removeRegisteredItem: (itemKey) => {
        set((state) => {
          const newSet = new Set(state.registeredItems);
          newSet.delete(itemKey);
          return { registeredItems: newSet };
        });
      },
      
      clearRegisteredItems: () => set({ registeredItems: new Set() }),

      // Getters
      getAssetByTag: (tag) => {
        return get().assets.find((asset) => 
          asset.asset_tag.toLowerCase() === tag.toLowerCase()
        );
      },
      
      getAssetsByType: (type) => {
        return get().assets.filter((asset) => asset.item_type === type);
      },
      
      getAssetsByStatus: (status) => {
        return get().assets.filter((asset) => asset.status === status);
      },
      
      getAssetsByLocation: (location) => {
        return get().assets.filter((asset) => 
          asset.location.toLowerCase().includes(location.toLowerCase())
        );
      },

      // Statistics
      getTotalAssets: () => get().assets.length,
      
      getActiveAssets: () => 
        get().assets.filter((asset) => asset.status === 'Active').length,
      
      getMissingAssets: () => 
        get().assets.filter((asset) => asset.status === 'Missing').length,
      
      getAssetsNeedingRepair: () => 
        get().assets.filter((asset) => asset.condition === 'Needs Repair').length,
    }),
    {
      name: 'gym-register-storage',
      partialize: (state) => ({
        assets: state.assets,
        auditLogs: state.auditLogs,
        analysisHistory: state.analysisHistory,
      }),
    }
  )
);