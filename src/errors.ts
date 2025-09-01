export class PreparedStatementError extends Error {
  public readonly uri: string;
  constructor(message: string, uri: string) {
    super(message);
    this.uri = uri;
    this.name = "PreparedStatementError";
  }
}
