# Android Jetpack Compose parity plan

Goal: every screen that renders native SwiftUI via `@expo/ui/swift-ui` gets a
matching native Jetpack Compose branch via `@expo/ui/jetpack-compose`, instead of
falling back to a plain React Native layout on Android.

All code below is a reference for you to write yourself. Nothing here is applied
to the repo.

---

## 0. How the code is currently shaped

Each screen branches inline:

```tsx
if (Platform.OS === 'ios') {
  return (/* @expo/ui/swift-ui Host/Form/Section */);
}
return (/* plain RN fallback */);
```

Two facts that shape the plan:

- Many screens already ship a **styled RN fallback** that mimics the grouped
  iOS look (cards, section titles, dividers). Converting those to Compose is
  mostly upside on interactive controls (`Switch`, `TextField`, segmented
  `Picker`, native ripple) and lower value on read-only content.
- `@expo/ui/jetpack-compose` and `useNativeState` are already installed and used
  in `src/utils/actionMenu/ActionMenuHost.android.tsx`,
  `src/utils/media/MediaPermissionHost.android.tsx`,
  `src/screens/Preferences/components/BlockedUsersActionButton.android.tsx`, and
  `src/components/Changelog/ChangelogAndroidHost.android.tsx`. Use those as live
  references.

### Native modules (no action)

`modules/cpu-usage`, `modules/icloud-sync`, `modules/image-cache-limits`,
`modules/image-memory-pressure` are iOS-only by nature (iCloud, iOS image cache,
iOS memory pressure). No Android counterpart is possible/needed - just confirm
their JS callers no-op on Android. `modules/changelog` already has an Android
host.

---

## 1. Verified `@expo/ui/jetpack-compose` API surface

**Components** (`from '@expo/ui/jetpack-compose'`):
`Host`, `Column`, `Row`, `Box`, `Card`, `ListItem` (+ slots
`.HeadlineContent`, `.SupportingContent`, `.LeadingContent`,
`.TrailingContent`, `.OverlineContent`), `HorizontalDivider`, `Text`, `Switch`,
`SyncSwitch`, `TextField`, `OutlinedTextField`, `SingleChoiceSegmentedButtonRow`,
`SegmentedButton`, `DropdownMenu`, `RadioButton`, `LinearProgressIndicator`,
`CircularProgressIndicator`, `LoadingIndicator`, `Button`, `TextButton`,
`IconButton`, `Icon`, `RNHostView`, `Surface`, `Spacer`, `ModalBottomSheet`,
`useNativeState`.

**Modifiers** (`from '@expo/ui/jetpack-compose/modifiers'`):
`fillMaxWidth(fraction?)`, `fillMaxSize()`, `fillMaxHeight()`,
`padding(start, top, end, bottom)`, `paddingAll(n)`,
`clickable(fn, { indication })`, `verticalScroll()`, `background(color)`,
`clip(shape)`, `weight`, `size`, `height`, `width`, `align`, `border`.

**Key prop shapes**

- `Text`: `color={colorValue}` + `style={{ typography: 'titleMedium' | 'bodyLarge' | 'bodyMedium' | 'labelSmall' | 'titleSmall', fontWeight, textAlign }}`
- `Card`: `colors={{ containerColor, contentColor }}`, `elevation?`, `border?`, `modifiers?`
- `ListItem`: `colors={{ containerColor, contentColor, leadingContentColor, trailingContentColor, supportingContentColor }}`, `modifiers?`
- `Switch`: `value: boolean`, `onCheckedChange: (v) => void`, `colors?`, `enabled?`
- `SyncSwitch`: `isOn: ObservableState<boolean>` (from `useNativeState(false)`), `onCheckedChangeSync?` (worklet)
- `TextField`: `value?: ObservableState<string>` (from `useNativeState('')`), `onValueChange?`, `autoFocus?`, `singleLine?`, `keyboardType?`, `onDone/onSearch/onSend?`
- `SingleChoiceSegmentedButtonRow` wraps `SegmentedButton` children: each `SegmentedButton` takes `selected`, `onClick`, `children`
- `LinearProgressIndicator` / `CircularProgressIndicator`: `progress?: number | null` (0-1; omit/null = indeterminate)
- `Icon`: needs an **XML vector drawable** `source` (not an SF Symbol name). For SF symbols, embed the app `SymbolView` inside `RNHostView matchContents`.
- `RNHostView`: `matchContents?`, `children` (single RN element) - the bridge for any RN content inside Compose.

---

## 2. SwiftUI → Compose mapping

| swift-ui                       | jetpack-compose                                                   |
| ------------------------------ | ----------------------------------------------------------------- |
| `Form`                         | `Column` + `verticalScroll()`                                     |
| `Section`                      | title `Text` + `Card` wrapping `Column` of rows                   |
| `List`                         | `LazyColumn` of `ListItem`s (or `Column` for short lists)         |
| `LabeledContent`               | `ListItem` w/ `HeadlineContent`(label) + `TrailingContent`(value) |
| `Button` row                   | `ListItem` + `clickable(fn, { indication: true })`                |
| `Toggle`                       | `Switch` (controlled) or `SyncSwitch` (observable)                |
| `Picker`                       | `SingleChoiceSegmentedButtonRow` or `DropdownMenu`                |
| `TextField` / `SecureField`    | `TextField` (`useNativeState` value)                              |
| `ProgressView`                 | `LinearProgressIndicator` / `CircularProgressIndicator`           |
| `HStack` / `VStack` / `Spacer` | `Row` / `Column` / `Spacer`                                       |
| `Image` / SF Symbol            | `SymbolView` inside `RNHostView matchContents`                    |
| `GlassEffectContainer`         | no analog - `Surface` / `Card` tonal elevation                    |

---

## 3. Step 1 - Shared Compose foundation (do this first)

Create a `NativeForm` component family so every Android branch reads like the
iOS `Form`/`Section` branch. Platform file resolution picks `.android.tsx` on
Android and `.tsx` elsewhere.

### 3a. `src/components/ui/NativeForm/NativeForm.types.ts`

```ts
import type { ReactNode } from 'react';

import type { SymbolViewProps } from '@app/components/ui/Icon/Icon';

export interface NativeFormScreenProps {
  children: ReactNode;
}

export interface NativeSectionProps {
  title?: string;
  children: ReactNode;
}

export interface NativeInfoRowProps {
  label: string;
  value: ReactNode;
}

export interface NativeActionRowProps {
  title: string;
  icon?: SymbolViewProps['name'];
  onPress: () => void;
}
```

### 3b. `src/components/ui/NativeForm/NativeForm.android.tsx` (Compose)

```tsx
import { Children, Fragment } from 'react';
import type { ReactElement, ReactNode } from 'react';

import {
  Card,
  Column,
  HorizontalDivider,
  Host,
  ListItem,
  RNHostView,
  Text,
} from '@expo/ui/jetpack-compose';
import {
  clickable,
  fillMaxSize,
  fillMaxWidth,
  padding,
  verticalScroll,
} from '@expo/ui/jetpack-compose/modifiers';

import { SymbolView, type SymbolViewProps } from '@app/components/ui/Icon/Icon';
import { theme } from '@app/styles/themes';

import type {
  NativeActionRowProps,
  NativeFormScreenProps,
  NativeInfoRowProps,
  NativeSectionProps,
} from './NativeForm.types';

const cardColors = {
  containerColor: theme.color.backgroundSecondary.dark,
  contentColor: theme.color.text.dark,
};

const listItemColors = {
  containerColor: theme.color.backgroundSecondary.dark,
  contentColor: theme.color.text.dark,
};

export function NativeFormScreen({ children }: NativeFormScreenProps) {
  return (
    <Host colorScheme='dark' style={{ flex: 1 }}>
      <Column
        modifiers={[fillMaxSize(), verticalScroll(), padding(0, 16, 0, 56)]}
        verticalArrangement={{ spacedBy: 24 }}
      >
        {children}
      </Column>
    </Host>
  );
}

export function NativeSection({ title, children }: NativeSectionProps) {
  const rows = Children.toArray(children).filter(Boolean);

  return (
    <Column
      modifiers={[fillMaxWidth(), padding(16, 0, 16, 0)]}
      verticalArrangement={{ spacedBy: 8 }}
    >
      {title ? (
        <Text
          color={theme.color.textSecondary.dark}
          modifiers={[padding(4, 0, 4, 0)]}
          style={{ typography: 'labelSmall', fontWeight: '600' }}
        >
          {title.toUpperCase()}
        </Text>
      ) : null}
      <Card colors={cardColors} modifiers={[fillMaxWidth()]}>
        <Column modifiers={[fillMaxWidth()]}>
          {rows.map((row, index) => (
            <Fragment key={index}>
              {index > 0 ? (
                <HorizontalDivider color={theme.colorBorderSecondary} />
              ) : null}
              {row}
            </Fragment>
          ))}
        </Column>
      </Card>
    </Column>
  );
}

export function NativeInfoRow({ label, value }: NativeInfoRowProps) {
  return (
    <ListItem colors={listItemColors}>
      <ListItem.HeadlineContent>
        <Text
          color={theme.color.text.dark}
          style={{ typography: 'bodyLarge', fontWeight: '600' }}
        >
          {label}
        </Text>
      </ListItem.HeadlineContent>
      <ListItem.TrailingContent>
        {typeof value === 'string' || typeof value === 'number' ? (
          <Text
            color={theme.color.textSecondary.dark}
            style={{ typography: 'bodyMedium' }}
          >
            {String(value)}
          </Text>
        ) : (
          <RNHostView matchContents>{value as ReactElement}</RNHostView>
        )}
      </ListItem.TrailingContent>
    </ListItem>
  );
}

export function NativeActionRow({
  title,
  icon,
  onPress,
}: NativeActionRowProps) {
  return (
    <ListItem
      colors={listItemColors}
      modifiers={[clickable(onPress, { indication: true })]}
    >
      {icon ? (
        <ListItem.LeadingContent>
          <RNHostView matchContents>
            <SymbolView
              name={icon as SymbolViewProps['name']}
              size={20}
              tintColor={theme.colorWhite}
            />
          </RNHostView>
        </ListItem.LeadingContent>
      ) : null}
      <ListItem.HeadlineContent>
        <Text
          color={theme.color.text.dark}
          style={{ typography: 'bodyLarge', fontWeight: '600' }}
        >
          {title}
        </Text>
      </ListItem.HeadlineContent>
      <ListItem.TrailingContent>
        <RNHostView matchContents>
          <SymbolView
            name='chevron.right'
            size={16}
            tintColor={theme.colorGreyAlpha}
          />
        </RNHostView>
      </ListItem.TrailingContent>
    </ListItem>
  );
}

export function NativeRawRow({ children }: { children: ReactNode }) {
  return (
    <Card
      colors={cardColors}
      modifiers={[fillMaxWidth(), padding(16, 0, 16, 0)]}
    >
      <RNHostView matchContents>{children as ReactElement}</RNHostView>
    </Card>
  );
}
```

### 3c. `src/components/ui/NativeForm/NativeForm.tsx` (RN fallback for iOS/web bundles)

iOS screens still branch to SwiftUI, so this is only exercised on web/other, but
it must export the same names so `metro` can resolve the import on every
platform.

```tsx
import { Children, isValidElement } from 'react';
import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { PressableArea } from '@app/components/PressableArea/PressableArea';
import { SymbolView } from '@app/components/ui/Icon/Icon';
import { Text } from '@app/components/ui/Text/Text';
import { theme } from '@app/styles/themes';

import type {
  NativeActionRowProps,
  NativeFormScreenProps,
  NativeInfoRowProps,
  NativeSectionProps,
} from './NativeForm.types';

export function NativeFormScreen({ children }: NativeFormScreenProps) {
  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.screenContent}
      contentInsetAdjustmentBehavior='automatic'
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  );
}

export function NativeSection({ title, children }: NativeSectionProps) {
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
    </View>
  );
}

export function NativeInfoRow({ label, value }: NativeInfoRowProps) {
  return (
    <View style={styles.row}>
      <Text weight='semibold' color='gray' style={styles.rowLabel}>
        {label}
      </Text>
      {typeof value === 'string' || typeof value === 'number' ? (
        <Text type='xs' color='gray.textLow' selectable>
          {String(value)}
        </Text>
      ) : (
        <View style={styles.rowValueWrapper}>{value}</View>
      )}
    </View>
  );
}

export function NativeActionRow({
  title,
  icon,
  onPress,
}: NativeActionRowProps) {
  return (
    <PressableArea style={styles.pressableFill} onPress={onPress}>
      <View style={styles.actionRow}>
        {icon ? (
          <SymbolView name={icon} size={20} tintColor={theme.colorWhite} />
        ) : null}
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

export function NativeRawRow({ children }: { children: ReactNode }) {
  const child = Children.toArray(children).find(isValidElement) ?? null;
  return <View style={styles.sectionBody}>{child}</View>;
}

const styles = StyleSheet.create({
  actionLabel: { flex: 1 },
  actionRow: {
    alignItems: 'center',
    borderBottomColor: theme.colorBorderSecondary,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: theme.space12,
    paddingHorizontal: theme.space16,
    paddingVertical: theme.space16,
  },
  pressableFill: { alignSelf: 'stretch' },
  row: {
    borderBottomColor: theme.colorBorderSecondary,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: theme.space8,
    paddingHorizontal: theme.space16,
    paddingVertical: 14,
  },
  rowLabel: { minWidth: 0 },
  rowValueWrapper: { flexShrink: 1 },
  screen: { backgroundColor: theme.color.background.dark, flex: 1 },
  screenContent: {
    gap: theme.space24,
    paddingBottom: theme.space56,
    paddingTop: theme.space16,
  },
  section: { gap: theme.space8 },
  sectionBody: {
    backgroundColor: theme.color.backgroundSecondary.dark,
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius12,
    marginHorizontal: theme.space16,
    overflow: 'hidden',
  },
  sectionTitle: {
    letterSpacing: 0.5,
    paddingHorizontal: theme.space16,
    textTransform: 'uppercase',
  },
});
```

> Import with the full path (no barrel): `@app/components/ui/NativeForm/NativeForm`.

---

## 4. Step 2 - Worked example: `AboutScreen` (read-only grouped form)

Keep the `Platform.OS === 'ios'` SwiftUI branch. Replace the RN `else` return
(and delete the now-unused `AboutSection`/`InfoRow`/`ActionRow` locals,
`useRef`/`ScrollView`/`useScrollToTop`/`PressableArea` imports, and the styles
they used - keep only `identityRow`/`identityText`/`appIcon`).

New imports:

```tsx
import {
  NativeActionRow,
  NativeFormScreen,
  NativeInfoRow,
  NativeRawRow,
  NativeSection,
} from '@app/components/ui/NativeForm/NativeForm';
```

New shared return (used by Android + web):

```tsx
return (
  <NativeFormScreen>
    <NativeRawRow>
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
    </NativeRawRow>

    <NativeSection title={t('builtFor')}>
      <NativeInfoRow label={t('chat')} value={t('chatDescription')} />
      <NativeInfoRow label={t('discovery')} value={t('discoveryDescription')} />
      <NativeInfoRow label={t('viewing')} value={t('viewingDescription')} />
    </NativeSection>

    <NativeSection title={t('resources')}>
      <NativeActionRow
        title={t('website')}
        icon='globe'
        onPress={() => openLinkInBrowser('https://foam-app.com')}
      />
      <NativeActionRow
        title={t('status')}
        icon='shield'
        onPress={() => openLinkInBrowser('https://status.foam-app.com')}
      />
    </NativeSection>

    <NativeSection title={t('build')}>
      <NativeInfoRow
        label={t('version')}
        value={Application.nativeApplicationVersion ?? t('unknown')}
      />
      <NativeInfoRow
        label={t('build')}
        value={Application.nativeBuildVersion ?? t('unknown')}
      />
      <NativeInfoRow label={t('ota')} value={otaLabel} />
    </NativeSection>
  </NativeFormScreen>
);
```

---

## 5. Step 3 - Interactive control snippets

These are the controls the RN fallback can't match natively. Add a
`NativeToggleRow` and `NativePickerRow` to the foundation, or inline per screen.

### 5a. Toggle row (`Section` with `Toggle` on iOS)

```tsx
// inside NativeForm.android.tsx
import { Switch } from '@expo/ui/jetpack-compose';

export function NativeToggleRow({
  label,
  value,
  onValueChange,
}: {
  label: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
}) {
  return (
    <ListItem colors={listItemColors}>
      <ListItem.HeadlineContent>
        <Text color={theme.color.text.dark} style={{ typography: 'bodyLarge' }}>
          {label}
        </Text>
      </ListItem.HeadlineContent>
      <ListItem.TrailingContent>
        <Switch value={value} onCheckedChange={onValueChange} />
      </ListItem.TrailingContent>
    </ListItem>
  );
}
```

Usage in e.g. `SettingsOtherScreen` Android branch:

```tsx
<NativeSection title={t('playback')}>
  <NativeToggleRow
    label={t('autoplay')}
    value={autoplay}
    onValueChange={setAutoplay}
  />
</NativeSection>
```

### 5b. Segmented picker (`Picker` on iOS - e.g. appearance/theme)

```tsx
import {
  SegmentedButton,
  SingleChoiceSegmentedButtonRow,
  Text,
} from '@expo/ui/jetpack-compose';

function ThemePicker({
  options,
  selected,
  onSelect,
}: {
  options: { value: string; label: string }[];
  selected: string;
  onSelect: (value: string) => void;
}) {
  return (
    <SingleChoiceSegmentedButtonRow>
      {options.map(option => (
        <SegmentedButton
          key={option.value}
          selected={option.value === selected}
          onClick={() => onSelect(option.value)}
        >
          <Text style={{ typography: 'labelLarge' }}>{option.label}</Text>
        </SegmentedButton>
      ))}
    </SingleChoiceSegmentedButtonRow>
  );
}
```

For a long option list, use `DropdownMenu` instead of segmented buttons.

### 5c. Text field + list (`BlockedTermsScreen`, `SavedPhrasesScreen`)

Compose `TextField` binds to a `useNativeState` observable - the same pattern
the SwiftUI branch already uses, so the binding concept carries over.

```tsx
import {
  Column,
  ListItem,
  TextField,
  useNativeState,
} from '@expo/ui/jetpack-compose';
import { fillMaxWidth, padding } from '@expo/ui/jetpack-compose/modifiers';

function AddTermField({ onSubmit }: { onSubmit: (term: string) => void }) {
  const term = useNativeState('');

  return (
    <TextField
      value={term}
      singleLine
      autoFocus={false}
      modifiers={[fillMaxWidth(), padding(16, 8, 16, 8)]}
      onDone={value => {
        const trimmed = value.trim();
        if (trimmed) {
          onSubmit(trimmed);
          term.value = '';
        }
      }}
    />
  );
}
```

Render the saved list with `LazyColumn` of `ListItem`s, each with a trailing
delete `IconButton` (SF symbol via `RNHostView`), matching the SwiftUI
`List` + `SwipeActions`. Compose has no swipe-actions primitive, so use an
explicit trailing delete button or a `DropdownMenu`.

> The `doctor.config.json` `react-hooks-js/immutability` override for
> `BlockedTermsScreen`/`SavedPhrasesScreen` exists for the iOS `useNativeState`
> writes. The Compose `term.value = ''` write is the same intended pattern - keep
> the file-scoped exemption, don't disable the rule globally.

### 5d. Progress (`EmoteBadgeViewerScreen`, `ProgressView`)

```tsx
import { CircularProgressIndicator } from '@expo/ui/jetpack-compose';

// indeterminate
<CircularProgressIndicator />

// determinate (0..1)
<CircularProgressIndicator progress={loaded / total} />
```

---

## 6. Per-screen work list

Legend: `[F]` uses the `NativeForm` foundation, `[I]` needs interactive
controls, `[G]` has an iOS-26 glass surface with no Compose analog.

**Settings cluster** (`Form`/`Section`, mostly `[F]`, some `[I]`):

- `src/screens/SettingsScreen/SettingsIndexScreen.tsx` `[F]`
- `src/screens/SettingsScreen/SettingsAppearanceScreen.tsx` `[F][I]` (Toggle + Picker)
- `src/screens/SettingsScreen/SettingsOtherScreen.tsx` `[F][I]` (Toggle)
- `src/screens/SettingsScreen/SettingsCacheScreen.tsx` `[F]`
- `src/screens/SettingsScreen/SettingsDevtoolsScreen.tsx` `[F][I]` (Toggle)
- `src/screens/Other/AboutScreen.tsx` `[F]` (worked above)
- `src/screens/SettingsScreen/components/profile/ProfileCard.ios.tsx` `[F]` (add `.android.tsx`)
- `src/screens/SettingsScreen/EmoteBadgeViewerScreen.tsx` `[I]` (Progress)

**Preferences cluster** (`List` + `TextField` + `useNativeState`, `[I]`):

- `src/screens/Preferences/BlockedTermsScreen.tsx`
- `src/screens/Preferences/SavedPhrasesScreen.tsx`
- `src/screens/Preferences/BlockedUsersScreen.tsx`
- `src/screens/Preferences/ChatPreferenceNativeForm.tsx` (Toggle + Picker)

**Devtools + shared components:**

- `src/screens/DevTools/DebugScreen.tsx` `[F][I]` (Toggle + TextField)
- `src/screens/DevTools/components/PaintRendererSection.tsx` `[I]` (Picker)
- `src/components/ui/Input/Input.ios.tsx` `[I][G]` (add `.android.tsx`)
- `src/components/ui/SearchHistory/SearchHistoryV2.ios.tsx` `[I]` (add `.android.tsx`)
- `src/components/Chat/components/ComposerIconButton.tsx` `[G]` (glass button → `IconButton`)

**Glass surfaces (decide, don't port):** `ComposerIconButton`, `Input.ios.tsx`
use `GlassEffectContainer` (iOS-26 liquid glass). Android has no equivalent -
use a Material `Surface`/`Card` with tonal elevation.

---

## 7. Testing & rebuild

- Compose changes are **native** - rebuild the dev client / AAB. No hot reload,
  no OTA.
- Add/adjust specs to exercise the Android branch. Some native tests pin
  `Platform=android`; follow that pattern (see the iOS-18 native form tests).
- Run `tsc` explicitly after each screen - `babel-jest` skips typecheck, so
  tests passing does not mean it compiles.
- Verify each ported screen against its iOS twin on a device before moving on.

---

## 8. Suggested order

1. Foundation (`NativeForm.*`) - unblocks everything.
2. `AboutScreen` (validates the foundation end-to-end).
3. Rest of the Settings cluster.
4. Preferences cluster (the `useNativeState`/`TextField` rework).
5. Devtools + shared components.
6. Glass-surface fallbacks last.

```

```
