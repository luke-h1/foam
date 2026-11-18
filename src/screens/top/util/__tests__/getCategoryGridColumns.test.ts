import { getCategoryGridColumns } from '../getCategoryGridColumns';

describe('getCategoryGridColumns', () => {
  test('keeps 3 columns on a phone', () => {
    expect(
      getCategoryGridColumns({ horizontalInsets: 0, windowWidth: 393 }),
    ).toEqual(3);
  });

  test('keeps 3 columns on the Duo outer display', () => {
    expect(
      getCategoryGridColumns({ horizontalInsets: 0, windowWidth: 466 }),
    ).toEqual(3);
  });

  test('adds columns on the Duo inner display', () => {
    expect(
      getCategoryGridColumns({ horizontalInsets: 20, windowWidth: 951 }),
    ).toEqual(6);
  });
});
