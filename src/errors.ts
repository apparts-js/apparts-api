export class PreparedStatementError extends Error {
  constructor(message: string, uri: string) {
    super(message);
    this.uri = uri;
    this.name = "PreparedStatementError";
  }
}
