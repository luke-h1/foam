import { Typography } from '@app/components';
import { useAuthContext } from '@app/context';
import { useHeader } from '@app/hooks';
import { BackButton } from '@app/navigators';
import React, { useState } from 'react';
import { useWindowDimensions, View, TouchableOpacity } from 'react-native';
import { TabView, SceneMap } from 'react-native-tab-view';
import { createStyleSheet, useStyles } from 'react-native-unistyles';
import { TopCategoriesScreen } from './TopCategoriesScreen';
import { TopStreamsScreen } from './TopStreamsScreen';

export function TopScreen() {
  const layout = useWindowDimensions();
  const [index, setIndex] = useState<number>(0);
  const { styles, theme } = useStyles(stylesheet);

  const { user } = useAuthContext();

  const [routes] = useState([
    { key: 'streams', title: 'Streams' },
    { key: 'categories', title: 'Categories' },
  ]);
  const [currentTitle, setCurrentTitle] = useState<string>('Streams');

  useHeader(
    {
      title: currentTitle,
      LeftActionComponent: user ? <BackButton /> : undefined,
    },
    [currentTitle],
  );

  const renderScene = SceneMap({
    streams: TopStreamsScreen,
    categories: TopCategoriesScreen,
  });

  return (
    <TabView
      navigationState={{ index, routes }}
      renderScene={renderScene}
      onIndexChange={setIndex}
      initialLayout={{ width: layout.width }}
      style={{
        backgroundColor: theme.colors.screen,
      }}
      renderTabBar={props => (
        <View style={styles.tabContainer}>
          {props.navigationState.routes.map((route, i) => {
            return (
              <TouchableOpacity
                key={route.key}
                onPress={() => {
                  props.jumpTo(route.key);
                  setCurrentTitle(route.title);
                }}
                style={[
                  styles.tab,
                  {
                    borderBottomColor: index === i ? 'purple' : 'transparent',
                  },
                ]}
              >
                <Typography>{route.title}</Typography>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    />
  );
}

const stylesheet = createStyleSheet(() => ({
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 15,
  },
  tab: {
    marginTop: 2,
    borderBottomWidth: 2.15,
    padding: 5,
    marginHorizontal: 10,
  },
}));
