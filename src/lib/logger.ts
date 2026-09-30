type Metadata = Record<string, unknown>;
const safe = (metadata?: Metadata) => metadata ? JSON.stringify(metadata, (key, value) => /password|token|secret|authorization/i.test(key) ? "[REDACTED]" : value) : "";
export const logger = { info: (message: string, metadata?: Metadata) => console.info(message, safe(metadata)), warn: (message: string, metadata?: Metadata) => console.warn(message, safe(metadata)), error: (message: string, metadata?: Metadata) => console.error(message, safe(metadata)) };
