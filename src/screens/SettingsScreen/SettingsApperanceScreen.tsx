import { BodyScrollView } from '@app/components/BodyScrollView/BodyScrollView';
import * as Form from '@app/components/Form/Form';
import { ScreenHeader } from '@app/components/ScreenHeader/ScreenHeader';
import { useScrollToTop } from '@app/hooks/useScrollToTop';
import {
  SettingsLinkRow,
  SettingsSection,
  SettingsToggleRow,
} from '@app/components/SettingsSection/SettingsSection';
import { Slider } from '@app/components/Slider/Slider';
import { Switch } from '@app/components/Switch/Switch';
import { Text } from '@app/components/Text/Text';
import { Preferences, usePreferences } from '@app/store/preferenceStore';
import { theme } from '@app/styles/themes';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useRef } from 'react';

export function SettingsAppearanceScreen() {
  const {
    theme: selectedTheme,
    hapticFeedback,
    fontScaling,
    streamListLayout,
    systemScaling,
    update,
  } = usePreferences();
  const scrollRef = useRef<ScrollView>(null);

  useScrollToTop(scrollRef);

  if (Platform.OS === 'ios') {
    return (
      <View style={styles.container}>
        <BodyScrollView contentContainerStyle={styles.iosContent}>
          <ScreenHeader
            title="Appearance"
            subtitle="Theme, layout, and typography controls for browsing streams and chat."
            size="medium"
          />
          <Form.Section title="Theme">
            <Form.Link
              systemImage="moon"
              hint="Foam Dark"
              onPress={() =>
                update({ theme: 'foam-dark' as Preferences['theme'] })
              }
            >
              Theme
            </Form.Link>
          </Form.Section>
          <Form.Section
            title="Browse Layout"
            footer="Compact keeps the feed lean. Media lets thumbnails dominate. Text First pushes title and streamer hierarchy forward while keeping the thumbnail present."
          >
            <Form.Link
              systemImage="rectangle.grid.1x2"
              hint={streamListLayout === 'compact' ? 'Active' : undefined}
              onPress={() => update({ streamListLayout: 'compact' })}
            >
              Compact
            </Form.Link>
            <Form.Link
              systemImage="play.rectangle"
              hint={streamListLayout === 'media' ? 'Active' : undefined}
              onPress={() => update({ streamListLayout: 'media' })}
            >
              Media
            </Form.Link>
            <Form.Link
              systemImage="text.alignleft"
              hint={streamListLayout === 'text' ? 'Active' : undefined}
              onPress={() => update({ streamListLayout: 'text' })}
            >
              Text First
            </Form.Link>
          </Form.Section>
          <Form.Section
            title="Typography"
            footer={`Current scale: ${Math.round(fontScaling * 100)}%`}
          >
            <View style={styles.iosToggleRow}>
              <Form.Text systemImage="textformat.size">
                Use System Text Size
              </Form.Text>
              <Switch
                value={systemScaling}
                onValueChange={value => update({ systemScaling: value })}
              />
            </View>
            <View style={styles.iosSliderRow}>
              <Text type="sm" weight="semibold">
                Manual text scale
              </Text>
              <Text type="xs" color="gray.textLow" style={styles.sliderCopy}>
                Fine-tune text density for stream lists and chat surfaces.
              </Text>
              <Slider
                disabled={systemScaling}
                max={1.2}
                min={0.8}
                onChange={next => update({ fontScaling: next })}
                step={0.1}
                value={fontScaling}
              />
            </View>
          </Form.Section>
          <Form.Section title="Feedback">
            <View style={styles.iosToggleRow}>
              <Form.Text systemImage="iphone">Haptic Feedback</Form.Text>
              <Switch
                value={hapticFeedback}
                onValueChange={value => update({ hapticFeedback: value })}
              />
            </View>
          </Form.Section>
        </BodyScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollRef}
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <ScreenHeader
          title="Appearance"
          subtitle="Theme, layout, and typography controls for browsing streams and chat."
          size="medium"
        />

        <SettingsSection title="Theme">
          <SettingsLinkRow
            title="Theme"
            subtitle="The redesigned app currently ships with one canonical visual mode"
            icon={{ icon: 'moon', color: theme.colorAmber }}
            value={selectedTheme === 'foam-dark' ? 'Foam Dark' : selectedTheme}
            onPress={() => {
              update({ theme: 'foam-dark' as Preferences['theme'] });
            }}
          />
        </SettingsSection>

        <SettingsSection
          title="Browse Layout"
          footer={
            <Text type="xs" color="gray.textLow">
              Compact keeps the feed lean. Media gives thumbnails more weight.
              Text First leads with title and streamer hierarchy while keeping
              the thumbnail visible.
            </Text>
          }
        >
          <SettingsLinkRow
            title="Compact"
            subtitle="Dense list rows with tighter metadata"
            icon={{ icon: 'panel-left', color: theme.colorBlue }}
            value={streamListLayout === 'compact' ? 'Active' : undefined}
            onPress={() => update({ streamListLayout: 'compact' })}
          />
          <SettingsLinkRow
            title="Media"
            subtitle="Larger thumbnails with a more visual browse rhythm"
            icon={{ icon: 'monitor-play', color: theme.colorAmber }}
            value={streamListLayout === 'media' ? 'Active' : undefined}
            onPress={() => update({ streamListLayout: 'media' })}
          />
          <SettingsLinkRow
            title="Text First"
            subtitle="A tighter editorial row with a quieter supporting thumbnail"
            icon={{ icon: 'align-left', color: theme.colorTeal }}
            value={streamListLayout === 'text' ? 'Active' : undefined}
            onPress={() => update({ streamListLayout: 'text' })}
          />
        </SettingsSection>

        <SettingsSection
          title="Typography"
          footer={
            <Text type="xs" color="gray.textLow">
              Current scale: {Math.round(fontScaling * 100)}%
            </Text>
          }
        >
          <SettingsToggleRow
            title="Use System Text Size"
            subtitle="Follow your device accessibility scale"
            icon={{ icon: 'type', color: theme.colorBlue }}
            value={systemScaling}
            onValueChange={value => update({ systemScaling: value })}
          />
          <View style={styles.sliderWrap}>
            <Text type="sm" weight="semibold">
              Manual text scale
            </Text>
            <Text type="xs" color="gray.textLow" style={styles.sliderCopy}>
              Fine-tune text density for stream lists and chat surfaces.
            </Text>
            <Slider
              disabled={systemScaling}
              max={1.2}
              min={0.8}
              onChange={next => update({ fontScaling: next })}
              step={0.1}
              value={fontScaling}
            />
          </View>
        </SettingsSection>

        <SettingsSection title="Feedback">
          <SettingsToggleRow
            title="Haptic Feedback"
            subtitle="Touch feedback for buttons, sheets, and controls"
            icon={{ icon: 'smartphone', color: theme.colorTeal }}
            value={hapticFeedback}
            onValueChange={value => update({ hapticFeedback: value })}
          />
        </SettingsSection>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.color.background.dark,
    flex: 1,
  },
  content: {
    paddingBottom: theme.space56,
    paddingHorizontal: theme.space20,
    paddingTop: theme.space16,
  },
  iosContent: {
    paddingBottom: theme.space56,
  },
  iosSliderRow: {
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  iosToggleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 44,
    paddingHorizontal: 20,
    paddingVertical: 11,
  },
  sliderCopy: {
    marginBottom: theme.space16,
    marginTop: theme.space8,
  },
  sliderWrap: {
    paddingHorizontal: theme.space20,
    paddingVertical: theme.space20,
  },
});
