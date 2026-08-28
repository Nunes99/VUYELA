import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { GET } from "@/app/api/health/route";
import { isSupabaseConfigured } from "@/lib/env";
import { createSupabasePublicClient } from "@/lib/supabase/public";

vi.mock("@/lib/env", () => ({
  isSupabaseConfigured: vi.fn()
}));

vi.mock("@/lib/supabase/public", () => ({
  createSupabasePublicClient: vi.fn()
}));

describe("GET /api/health", () => {
  const from = vi.fn();
  const select = vi.fn();
  const eq = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "info").mockImplementation(() => undefined);
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    select.mockReturnValue({ eq });
    from.mockReturnValue({ select });
    vi.mocked(createSupabasePublicClient).mockReturnValue({
      from
    } as unknown as ReturnType<typeof createSupabasePublicClient>);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("reports missing production configuration", async () => {
    vi.mocked(isSupabaseConfigured).mockReturnValue(false);

    const response = await GET(healthRequest());

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toMatchObject({
      service: "vuyela-web",
      state: "configuration_missing",
      durationMs: expect.any(Number)
    });
    expect(createSupabasePublicClient).not.toHaveBeenCalled();
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('"status":503'));
  });

  it("reports an unavailable database", async () => {
    vi.mocked(isSupabaseConfigured).mockReturnValue(true);
    eq.mockResolvedValue({ error: new Error("connection failed") });

    const response = await GET(healthRequest());

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toMatchObject({
      service: "vuyela-web",
      state: "database_unavailable",
      durationMs: expect.any(Number)
    });
    expect(response.headers.get("cache-control")).toBe("no-store, max-age=0");
  });

  it("reports readiness and emits a structured success log", async () => {
    vi.mocked(isSupabaseConfigured).mockReturnValue(true);
    eq.mockResolvedValue({ error: null });

    const response = await GET(healthRequest());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      service: "vuyela-web",
      state: "ready",
      durationMs: expect.any(Number)
    });
    expect(body.checkedAt).toEqual(expect.any(String));
    expect(console.info).toHaveBeenCalledWith(
      expect.stringContaining('"requestId":"test-request"')
    );
  });
});

function healthRequest() {
  return new Request("https://vuyela.example/api/health", {
    headers: { "x-request-id": "test-request" }
  });
}
