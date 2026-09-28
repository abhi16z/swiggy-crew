import { TabList, TabSlot, TabTrigger, Tabs } from 'expo-router/ui';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export default function AppTabs() {
  return (
    <Tabs>
      <TabSlot style={styles.slot} />
      <TabList asChild>
        <View className="absolute bottom-0 w-full flex-row justify-center bg-neutral-100 dark:bg-neutral-900">
          <TabTrigger name="home" href="/" asChild>
            <Pressable className="p-5">
              <Text className="text-black dark:text-white">Home</Text>
            </Pressable>
          </TabTrigger>
          <TabTrigger name="showcase" href="/showcase" asChild>
            <Pressable className="p-5">
              <Text className="text-black dark:text-white">Showcase</Text>
            </Pressable>
          </TabTrigger>
          <TabTrigger name="about" href="/about" asChild>
            <Pressable className="p-5">
              <Text className="text-black dark:text-white">About</Text>
            </Pressable>
          </TabTrigger>
          <TabTrigger name="settings" href="/settings" asChild>
            <Pressable className="p-5">
              <Text className="text-black dark:text-white">Settings</Text>
            </Pressable>
          </TabTrigger>
        </View>
      </TabList>
    </Tabs>
  );
}

// TabSlot's container won't shrink by default, so a tall page stretched it and the whole
// document scrolled instead of the page's own list. A bounded slot gives the feed a viewport
// to virtualize against. TabSlot is not a core component, so NativeWind classes don't reach it.
const styles = StyleSheet.create({
  slot: { flexShrink: 1 },
});
