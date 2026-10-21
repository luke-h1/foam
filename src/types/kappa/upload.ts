export interface KappaUploadAsset {
  uri: string;
  fileName?: string | undefined;
  mimeType?: string | undefined;
}

export interface KappaUploadResult {
  link: string;
}
