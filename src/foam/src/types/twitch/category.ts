export interface Category {
  box_art_url: string;
  id: string;
  igdb_id?: string; // can be an empty string so we specify undefined to represent the falsy value
  name: string;
}
