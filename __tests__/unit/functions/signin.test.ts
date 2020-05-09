import { sessionExpiry } from "../../../src/functions/signin/utils";

describe("session expiry functional tests", () => {
  it("should return a timestamp approximately 1 week in the future", () => {
    const weekInSeconds = 7 * 24 * 60 * 60;
    const expiresAt = sessionExpiry();
    expect(expiresAt - Date.now() / 1000 - weekInSeconds).toBeGreaterThan(-10);
  });
});
