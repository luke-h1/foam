import { ParallaxHero } from '@app/components/ParallaxHero/ParallaxHero';
import { ScreenHeader } from '@app/components/ScreenHeader/ScreenHeader';
import { BuildStatus } from '@app/screens/SettingsScreen/components/BuildStatus';
import { theme } from '@app/styles/themes';
import { View, StyleSheet } from 'react-native';
import appIconProduction from '../../../assets/app-icon/app-icon-production.png';
import { AboutCard } from '../SettingsScreen/components/AboutCard';

export function AboutScreen() {
  return (
    <View style={styles.container}>
      <ParallaxHero
        imageSource={appIconProduction}
        title="About Foam"
        shortDescription="A streaming app rebuilt around discovery, live context, and fast chat."
      >
        <View style={styles.content}>
          <ScreenHeader
            title="Built for live viewing"
            subtitle="The current shell borrows reacticx-style motion and editorial structure, then points it at streams and chat."
            size="compact"
          />
          <AboutCard />
          <View style={styles.buildStatusWrap}>
            <BuildStatus />
          </View>
        </View>
      </ParallaxHero>
    </View>
  );
}

const styles = StyleSheet.create({
  buildStatusWrap: {
    marginTop: theme.space20,
  },
  container: {
    backgroundColor: theme.color.background.dark,
    flex: 1,
  },
  content: {
    paddingBottom: theme.space56,
    paddingHorizontal: theme.space20,
  },
});
