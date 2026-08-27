export interface Category {
  box_art_url: string;
  id: string;
  igdb_id?: string; // the API can send an empty string
  name: string;
}
