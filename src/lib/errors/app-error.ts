/**
 * Represents an expected application failure.
 *
 * Services throw AppError for conditions the API can safely explain to a client.
 * The shared API response layer converts it into a consistent HTTP response.
 */
export class AppError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status = 400,
  ) {
    super(message);
    this.name = "AppError";
  }
}
