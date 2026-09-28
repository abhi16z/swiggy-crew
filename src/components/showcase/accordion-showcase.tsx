import { Text, View } from 'react-native';

import { Accordion } from '@/components/ui/accordion';

export function AccordionShowcase() {
  return (
    <View className="gap-4">
      <Text className="text-xl font-semibold text-black dark:text-white">Accordion</Text>
      <View className="rounded-2xl bg-white px-4 dark:bg-neutral-900">
        <Accordion title="Sort by" summary="Recommended">
          <Text className="pb-4 text-base text-neutral-700 dark:text-neutral-300">
            Collapsed by default. The content mounts on first expand and animates its height.
          </Text>
        </Accordion>
      </View>
    </View>
  );
}
