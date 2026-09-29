import { lazy, Suspense } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { usePerformancePanelVisible } from './store';

const PerformancePanelBody = lazy(() => import('./panel'));

// App-wide overlay mounted once in the root layout, above every tab and sheet.
// The panel code is only loaded the first time it is switched on.
export function PerformancePanel() {
  const visible = usePerformancePanelVisible();
  const insets = useSafeAreaInsets();

  if (!visible) return null;

  return (
    <View
      className="absolute inset-x-0 top-0"
      pointerEvents="box-none"
      style={{ paddingTop: insets.top }}
    >
      <Suspense fallback={null}>
        <PerformancePanelBody />
      </Suspense>
    </View>
  );
}
