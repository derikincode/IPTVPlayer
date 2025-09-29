// src/hooks/useNetworkStatus.ts
import { useState, useEffect } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

interface NetworkStatus {
  isConnected: boolean;
  connectionType: string;
  isInternetReachable: boolean | null;
  isExpensive: boolean;
}

export const useNetworkStatus = () => {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    isConnected: false,
    connectionType: 'none',
    isInternetReachable: null,
    isExpensive: false,
  });

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      setNetworkStatus({
        isConnected: state.isConnected ?? false,
        connectionType: state.type,
        isInternetReachable: state.isInternetReachable,
        isExpensive: state.details?.isConnectionExpensive ?? false,
      });
    });

    return () => unsubscribe();
  }, []);

  const checkConnection = async (): Promise<boolean> => {
    const state = await NetInfo.fetch();
    return state.isConnected ?? false;
  };

  return {
    ...networkStatus,
    checkConnection,
  };
};