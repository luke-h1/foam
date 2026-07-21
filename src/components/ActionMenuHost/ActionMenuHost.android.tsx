import { Fragment, useSyncExternalStore } from 'react';
import { StyleSheet, useColorScheme } from 'react-native';

import {
  Column,
  HorizontalDivider,
  Host,
  ListItem,
  ModalBottomSheet,
  Text,
  TextButton,
} from '@expo/ui/jetpack-compose';
import {
  clickable,
  fillMaxWidth,
  padding,
  paddingAll,
} from '@expo/ui/jetpack-compose/modifiers';

import {
  dismissActionMenu,
  getActionMenuState,
  subscribeActionMenu,
} from '@app/store/overlays/actionMenuStore';
import { theme } from '@app/styles/themes';

export function ActionMenuHost() {
  const colorScheme = useColorScheme();
  const scheme = colorScheme === 'light' ? 'light' : 'dark';
  const options = useSyncExternalStore(
    subscribeActionMenu,
    getActionMenuState,
    getActionMenuState,
  );

  if (!options) {
    return null;
  }

  return (
    <Host
      colorScheme={scheme}
      style={StyleSheet.absoluteFill}
      pointerEvents='box-none'
    >
      <ModalBottomSheet
        containerColor={theme.color.menu.background[scheme]}
        contentColor={theme.color.text[scheme]}
        onDismissRequest={dismissActionMenu}
        showDragHandle
        skipPartiallyExpanded
      >
        <Column
          horizontalAlignment='center'
          modifiers={[fillMaxWidth(), padding(16, 8, 16, 24)]}
          verticalArrangement={{ spacedBy: 8 }}
        >
          <Text
            color={theme.color.textSecondary[scheme]}
            style={{ typography: 'titleSmall', textAlign: 'center' }}
          >
            {options.title}
          </Text>
          <Column modifiers={[fillMaxWidth()]}>
            {options.actions.map((action, index) => (
              <Fragment key={action.label}>
                {index > 0 ? (
                  <HorizontalDivider color={theme.color.menu.border[scheme]} />
                ) : null}
                <ListItem
                  colors={{
                    containerColor: theme.color.menu.cardActive[scheme],
                    contentColor: theme.color.text[scheme],
                  }}
                  modifiers={[
                    clickable(() => {
                      dismissActionMenu();
                      requestAnimationFrame(() => action.onPress());
                    }),
                  ]}
                >
                  <ListItem.HeadlineContent>
                    <Text
                      color={theme.color.text[scheme]}
                      style={{ typography: 'titleMedium', fontWeight: '600' }}
                    >
                      {action.label}
                    </Text>
                  </ListItem.HeadlineContent>
                </ListItem>
              </Fragment>
            ))}
          </Column>
          <TextButton
            colors={{ contentColor: theme.color.textSecondary[scheme] }}
            modifiers={[fillMaxWidth(), paddingAll(4)]}
            onClick={dismissActionMenu}
          >
            <Text
              color={theme.color.textSecondary[scheme]}
              style={{ typography: 'titleMedium', fontWeight: '600' }}
            >
              {options.cancelLabel}
            </Text>
          </TextButton>
        </Column>
      </ModalBottomSheet>
    </Host>
  );
}
