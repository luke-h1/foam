import type { SnapPoint } from '@app/components/bottom-sheet/BottomSheet';

import {
  type ChatSheetLayout,
  getChatSheetHeight,
  getChatSheetSnapPoints,
} from '../chatSheetLayout';

describe('getChatSheetHeight', () => {
  test('adds each row, section gap and section title to the chrome', () => {
    expect(
      getChatSheetHeight(
        {
          chromeHeight: 196,
          kind: 'content',
          minHeight: 360,
          sections: [
            { rowCount: 2 },
            { rowCount: 3 },
            { rowCount: 1, titled: true },
          ],
        },
        1000,
      ),
    ).toEqual(196 + 6 * 57 + 3 * 24 + 26);
  });

  test('never goes below the minimum height', () => {
    expect(
      getChatSheetHeight(
        {
          chromeHeight: 100,
          kind: 'content',
          minHeight: 360,
          sections: [{ rowCount: 1 }],
        },
        1000,
      ),
    ).toEqual(360);
  });

  test('caps the height at 82% of the screen', () => {
    expect(
      getChatSheetHeight(
        {
          chromeHeight: 196,
          kind: 'content',
          sections: [{ rowCount: 20, titled: true }],
        },
        800,
      ),
    ).toEqual(656);
  });

  test('resolves a fraction layout against the screen height', () => {
    expect(
      getChatSheetHeight({ fraction: 0.9, kind: 'fraction' }, 801),
    ).toEqual(721);
  });
});

describe('getChatSheetSnapPoints', () => {
  test('keeps a fraction as a fraction detent', () => {
    expect(
      getChatSheetSnapPoints({ fraction: 0.78, kind: 'fraction' }, 600),
    ).toEqual<SnapPoint[]>([{ fraction: 0.78 }]);
  });

  test('adds a full detent only to an expandable content sheet', () => {
    const layout: ChatSheetLayout = {
      chromeHeight: 100,
      kind: 'content',
      sections: [],
    };

    expect(getChatSheetSnapPoints(layout, 400)).toEqual<SnapPoint[]>([
      { height: 400 },
    ]);

    expect(
      getChatSheetSnapPoints({ ...layout, expandable: true }, 400),
    ).toEqual<SnapPoint[]>([{ height: 400 }, 'full']);
  });
});
