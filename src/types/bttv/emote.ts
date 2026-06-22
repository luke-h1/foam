export interface BttvEmote {
  id: string;
  code: string;
  codeOriginal?: string;
  imageType: string;
  animated: boolean;
  userId: string;
  modifier: boolean;
  user?: {
    name: string;
  };
}
