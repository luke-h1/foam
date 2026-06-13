import { Image } from '@app/components/Image/Image';
import { PressableArea } from '@app/components/PressableArea/PressableArea';
import { Text } from '@app/components/ui/Text/Text';
import { useScrollToTop } from '@app/hooks/useScrollToTop';
import { theme } from '@app/styles/themes';
import { openLinkInBrowser } from '@app/utils/browser/openLinkInBrowser';
import * as Application from 'expo-application';
import * as Updates from 'expo-updates';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { useRef } from 'react';
import type { ReactNode } from 'react';

import { ScrollView, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

const appIconProduction = require('../../../assets/app-icon/app-icon-production.png');

interface AboutSectionProps {
  title?: string;
  footer?: ReactNode;
  children: ReactNode;
}

interface InfoRowProps {
  label: string;
  value: ReactNode;
}

interface ActionRowProps {
  title: string;
  icon: SymbolViewProps['name'];
  onPress: () => void;
}

function AboutSection({ title, footer, children }: AboutSectionProps) {
  return (
    <View style={styles.section}>
      {title ? (
        <Text
          type='xs'
          weight='semibold'
          color='gray.textLow'
          style={styles.sectionTitle}
        >
          {title}
        </Text>
      ) : null}
      <View style={styles.sectionBody}>{children}</View>
      {footer ? <View style={styles.sectionFooter}>{footer}</View> : null}
    </View>
  );
}

function InfoRow({ label, value }: InfoRowProps) {
  return (
    <View style={styles.row}>
      <Text weight='semibold' color='gray' style={styles.rowLabel}>
        {label}
      </Text>
      {typeof value === 'string' || typeof value === 'number' ? (
        <Text type='xs' color='gray.textLow' selectable>
          {value}
        </Text>
      ) : (
        <View style={styles.rowValueWrapper}>{value}</View>
      )}
    </View>
  );
}

function ActionRow({ title, icon, onPress }: ActionRowProps) {
  return (
    <PressableArea style={styles.pressableFill} onPress={onPress}>
      <View style={styles.actionRow}>
        <SymbolView name={icon} size={20} tintColor={theme.colorWhite} />
        <Text weight='semibold' color='gray' style={styles.actionLabel}>
          {title}
        </Text>
        <SymbolView
          name='chevron.right'
          size={18}
          tintColor={theme.colorGreyAlpha}
        />
      </View>
    </PressableArea>
  );
}

export function AboutScreen() {
  const { t } = useTranslation('about');
  const scrollRef = useRef<ScrollView>(null);
  const otaLabel = Updates.updateId ?? t('embedded');

  useScrollToTop(scrollRef);

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollRef}
        style={styles.main}
        contentContainerStyle={styles.scrollContent}
        contentInsetAdjustmentBehavior='automatic'
        showsVerticalScrollIndicator={false}
      >
        <AboutSection>
          <View style={styles.identityRow}>
            <Image source={appIconProduction} style={styles.appIcon} />
            <View style={styles.identityText}>
              <Text type='lg' weight='bold' numberOfLines={1}>
                {t('appName')}
              </Text>
              <Text type='xs' color='gray.textLow' numberOfLines={2}>
                {t('tagline')}
              </Text>
            </View>
          </View>
        </AboutSection>

        <AboutSection title={t('builtFor')}>
          <InfoRow label={t('chat')} value={t('chatDescription')} />
          <InfoRow label={t('discovery')} value={t('discoveryDescription')} />
          <InfoRow label={t('viewing')} value={t('viewingDescription')} />
        </AboutSection>

        <AboutSection title={t('resources')}>
          <ActionRow
            title={t('website')}
            icon='globe'
            onPress={() => openLinkInBrowser('https://foam-app.com')}
          />
          <ActionRow
            title={t('status')}
            icon='shield'
            onPress={() => openLinkInBrowser('https://status.foam-app.com')}
          />
        </AboutSection>

        <AboutSection title={t('build')}>
          <InfoRow
            label={t('version')}
            value={Application.nativeApplicationVersion ?? t('unknown')}
          />
          <InfoRow
            label={t('build')}
            value={Application.nativeBuildVersion ?? t('unknown')}
          />
          <InfoRow label={t('ota')} value={otaLabel} />
        </AboutSection>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  actionLabel: {
    flex: 1,
  },
  actionRow: {
    alignItems: 'center',
    borderBottomColor: theme.colorBorderSecondary,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: theme.space12,
    paddingHorizontal: theme.space16,
    paddingVertical: theme.space16,
  },
  appIcon: {
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius16,
    height: 56,
    width: 56,
  },
  container: {
    backgroundColor: theme.color.background.dark,
    flex: 1,
  },
  footerText: {
    lineHeight: 18,
  },
  identityRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.space12,
    padding: theme.space16,
  },
  identityText: {
    flex: 1,
    gap: theme.space4,
  },
  main: {
    flex: 1,
  },
  pressableFill: {
    alignSelf: 'stretch',
  },
  row: {
    borderBottomColor: theme.colorBorderSecondary,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: theme.space8,
    paddingHorizontal: theme.space16,
    paddingVertical: 14,
  },
  rowLabel: {
    minWidth: 0,
  },
  rowValueWrapper: {
    flexShrink: 1,
  },
  scrollContent: {
    gap: theme.space24,
    paddingBottom: theme.space56,
    paddingTop: theme.space16,
  },
  section: {
    gap: theme.space8,
  },
  sectionBody: {
    backgroundColor: theme.color.backgroundSecondary.dark,
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius12,
    marginHorizontal: theme.space16,
    overflow: 'hidden',
  },
  sectionFooter: {
    paddingHorizontal: theme.space16,
    paddingTop: theme.space8,
  },
  sectionTitle: {
    letterSpacing: 0.5,
    paddingHorizontal: theme.space16,
    textTransform: 'uppercase',
  },
});
