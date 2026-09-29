import { Text, View } from 'react-native';

import { ScreenSafeArea } from '@/components/ui/screen-safe-area/screen-safe-area';

export default function AboutScreen() {
  return (
    <View className="flex-1 bg-white dark:bg-black">
      <ScreenSafeArea>
        <View className="flex-1 items-center justify-center">
          <Text className="text-2xl text-green-500">Welcome to about</Text>
        </View>
      </ScreenSafeArea>
    </View>
  );
}
