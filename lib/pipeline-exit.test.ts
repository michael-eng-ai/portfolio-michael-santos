import { describe, expect, it } from "vitest";

import { decideExitCode } from "@/lib/pipeline-exit";

describe("decideExitCode", () => {
  it("returns 0 when there were no candidates", () => {
    expect(decideExitCode({ candidates: 0, succeeded: 0, failed: 0 })).toBe(0);
  });

  it("returns 1 when there were candidates and every one failed", () => {
    expect(decideExitCode({ candidates: 5, succeeded: 0, failed: 5 })).toBe(1);
  });

  it("returns 0 on partial success", () => {
    expect(decideExitCode({ candidates: 5, succeeded: 2, failed: 3 })).toBe(0);
  });

  it("returns 0 when all candidates succeeded", () => {
    expect(decideExitCode({ candidates: 5, succeeded: 5, failed: 0 })).toBe(0);
  });
});
