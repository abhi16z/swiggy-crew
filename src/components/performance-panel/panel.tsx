import { useCallback, useState } from 'react';

import { CompactHud } from './compact-hud';
import { ExpandedHud } from './expanded-hud';
import { usePerfTracker } from './use-perf-tracker';

// Performance HUD (designs 07–09). Opens compact; the tracker keeps running across both
// states, so expanding shows the session so far rather than starting over.
export default function PerformancePanelBody() {
  const [expanded, setExpanded] = useState(false);
  const tracker = usePerfTracker(expanded);
  const expand = useCallback(() => setExpanded(true), []);
  const collapse = useCallback(() => setExpanded(false), []);

  return expanded ? (
    <ExpandedHud tracker={tracker} onCollapse={collapse} />
  ) : (
    <CompactHud tracker={tracker} onExpand={expand} />
  );
}
