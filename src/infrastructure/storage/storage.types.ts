export type SaveInput = { key: string; body: Uint8Array; contentType: string };
export type SignedUrlDisposition = "inline" | "attachment";
export interface StorageProvider {
  save(input: SaveInput): Promise<void>;
  delete(key: string): Promise<void>;
  getSignedUrl(key: string, expiresInSeconds?: number, disposition?: SignedUrlDisposition): Promise<string>;
  getSignedUploadUrl(key: string, contentType: string, expiresInSeconds?: number): Promise<string>;
}
