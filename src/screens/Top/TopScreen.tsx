import { Button, Typography } from '@app/components';
import { useState } from 'react';
import { SafeAreaView, useWindowDimensions, View } from 'react-native';
import { TabView, SceneMap } from 'react-native-tab-view';
import { createStyleSheet, useStyles } from 'react-native-unistyles';
import { TopCategoriesScreen } from './TopCategoriesScreen';
import { TopStreamsScreen } from './TopStreamsScreen';

export function TopScreen() {
  const layout = useWindowDimensions();
  const [index, setIndex] = useState<number>(0);
  const { styles, theme } = useStyles(stylesheet);

  const [routes] = useState([
    { key: 'streams', title: 'Streams' },
    { key: 'categories', title: 'Categories' },
  ]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_, setCurrentTitle] = useState<string>('Streams');

  const renderScene = SceneMap({
    streams: TopStreamsScreen,
    categories: TopCategoriesScreen,
  });

  return (
    <SafeAreaView style={{ flex: 1 }}>
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
                <Button
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
                </Button>
              );
            })}
          </View>
        )}
      />
    </SafeAreaView>
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
