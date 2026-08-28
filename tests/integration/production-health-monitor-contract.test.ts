import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const workflow = readFileSync(
  resolve(process.cwd(), ".github/workflows/health-monitor.yml"),
  "utf8"
);

describe("production health monitor contract", () => {
  it("runs externally every five minutes with bounded retries", () => {
    expect(workflow).toContain('cron: "*/5 * * * *"');
    expect(workflow).toContain("https://vuyela-seven.vercel.app/api/health");
    expect(workflow).toContain("--connect-timeout 10");
    expect(workflow).toContain("--max-time 30");
    expect(workflow).toContain("--retry 2");
  });

  it("requires the expected application readiness contract", () => {
    expect(workflow).toContain('$service" == "vuyela-web"');
    expect(workflow).toContain('$state" == "ready"');
    expect(workflow).toContain('$http_status" == "200"');
  });

  it("deduplicates incidents and closes them after recovery", () => {
    expect(workflow).toContain("issues.find");
    expect(workflow).toContain("github.rest.issues.create");
    expect(workflow).toContain('state: "open"');
    expect(workflow).toContain('state: "closed"');
  });
});
