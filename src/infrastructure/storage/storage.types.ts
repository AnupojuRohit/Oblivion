export type SaveInput = { key: string; body: Uint8Array; contentType: string };
export interface StorageProvider { save(input: SaveInput): Promise<void>; delete(key: string): Promise<void>; getSignedUrl(key: string, expiresInSeconds?: number): Promise<string>; getSignedUploadUrl(key: string, contentType: string, expiresInSeconds?: number): Promise<string>; }
