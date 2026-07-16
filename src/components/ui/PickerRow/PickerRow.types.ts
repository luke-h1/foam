export interface PickerOption<T extends string = string> {
  value: T;
  label: string;
}

export interface PickerRowProps<T extends string = string> {
  label: string;
  options: PickerOption<T>[];
  selection: T;
  onSelectionChange: (value: T) => void;
  /**
   * iOS picker style. Android always renders segmented buttons.
   *
   * @default 'menu'
   */
  variant?: 'menu' | 'segmented';
}
