import { render, screen } from '@testing-library/react-native';
import React from 'react';
import TabBarLabel from '../TabBarLabel';

describe('TabBarLabel', () => {
  test('renders correctly', () => {
    render(<TabBarLabel>Test Label</TabBarLabel>);
    expect(screen.getByText('Test Label')).toBeTruthy();
  });
});
