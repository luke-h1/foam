export interface SuggestionItemProps<T> {
  item: T;
  onSelect: (item: T) => void;
}
