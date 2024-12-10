import { useScrollToTop } from '@react-navigation/native';
import { StatusBar, StatusBarProps } from 'expo-status-bar';
import React, { useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  KeyboardAvoidingViewProps,
  LayoutChangeEvent,
  Platform,
  ScrollView,
  ScrollViewProps,
  StyleProp,
  View,
  ViewStyle,
} from 'react-native';
import {
  Edge,
  SafeAreaView,
  SafeAreaViewProps,
} from 'react-native-safe-area-context';
