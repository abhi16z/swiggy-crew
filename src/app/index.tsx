import { View } from 'react-native';

import { DiscoverFeed } from '@/components/discover-feed/discover-feed';
import { HomeActions } from '@/components/home-actions/home-actions';

export default function HomeScreen() {
  return (
    <View className="flex-1 bg-white dark:bg-black">
      <DiscoverFeed />
      <HomeActions />
    </View>
  );
}
