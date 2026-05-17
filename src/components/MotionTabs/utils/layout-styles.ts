import { StyleSheet } from 'react-native';

const layoutStyles = StyleSheet.create({
  card: {
    borderRadius: 28,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  cardShadow: {
    borderRadius: 28,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
  },
  dock: {
    alignItems: 'center',
    bottom: 0,
    left: 0,
    paddingTop: 8,
    position: 'absolute',
    right: 0,
  },
  root: {
    overflow: 'visible',
  },
  toolbarRow: {
    alignItems: 'center',
    alignSelf: 'center',
    flexDirection: 'row',
    gap: 2,
    padding: 6,
  },
});

export { layoutStyles };
