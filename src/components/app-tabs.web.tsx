import { TabList, TabSlot, TabTrigger, Tabs } from 'expo-router/ui';
import { Pressable, Text, View } from 'react-native';

export default function AppTabs() {
  return (
    <Tabs>
      <TabSlot />
      <TabList asChild>
        <View className="absolute bottom-0 w-full flex-row justify-center bg-neutral-100 dark:bg-neutral-900">
          <TabTrigger name="home" href="/" asChild>
            <Pressable className="p-5">
              <Text className="text-black dark:text-white">Home</Text>
            </Pressable>
          </TabTrigger>
          <TabTrigger name="about" href="/about" asChild>
            <Pressable className="p-5">
              <Text className="text-black dark:text-white">About</Text>
            </Pressable>
          </TabTrigger>
        </View>
      </TabList>
    </Tabs>
  );
}
