import { Children, Fragment, ReactElement } from 'react';

import {
  Card,
  CardColors,
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
import { SymbolViewProps } from 'expo-symbols';

import { theme } from '@app/styles/themes';

import { SymbolView } from '../Icon/Icon';
import {
  FormActionRowProps,
  FormInfoRowProps,
  FormRawRowProps,
  FormScreenProps,
  FormSectionProps,
} from './Form.types';

const cardColors = {
  containerColor: theme.color.backgroundSecondary.dark,
  contentColor: theme.color.text.dark,
} satisfies CardColors;

const listItemColors = {
  containerColor: theme.color.backgroundSecondary.dark,
  contentColor: theme.color.text.dark,
};

export function FormScreen({ children }: FormScreenProps) {
  return (
    <Host colorScheme='dark' style={{ flex: 1 }}>
      <Column
        modifiers={[fillMaxSize(), verticalScroll(), padding(0, 16, 0, 56)]}
        verticalArrangement={{
          spacedBy: 24,
        }}
      >
        {children}
      </Column>
    </Host>
  );
}

export function FormSection({ children, title }: FormSectionProps) {
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

export function FormInfoRow({ label, value }: FormInfoRowProps) {
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

export function FormActionRow({ onPress, title, icon }: FormActionRowProps) {
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

export function FormRawRow({ children }: FormRawRowProps) {
  return (
    <Card
      colors={cardColors}
      modifiers={[fillMaxWidth(), padding(16, 0, 16, 0)]}
    >
      <RNHostView matchContents>{children as ReactElement}</RNHostView>
    </Card>
  );
}
