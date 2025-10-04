// ES module wrapper for use-sync-external-store/shim
// Since React 18+ has native useSyncExternalStore, we export it directly from React
import React from 'react';

const useSyncExternalStore = React.useSyncExternalStore || React.experimental_useSyncExternalStore;

export { useSyncExternalStore };
export default useSyncExternalStore;