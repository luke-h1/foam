import { ScreenHeader } from '@app/components/ScreenHeader';
import { View } from 'react-native';

export function BlockedUsersScreen() {
  return (
    <View>
      <ScreenHeader
        title="Blocked Users"
        subtitle="Manage your blocked users list"
        size="medium"
        back={false}
      />
      {/* <BlockedUsersList /> */}
    </View>
  );
}
