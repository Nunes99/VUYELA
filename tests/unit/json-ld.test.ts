import { describe, expect, it } from "vitest";

import { serializeJsonLd } from "@/lib/seo/json-ld";

describe("JSON-LD serialization", () => {
  it("prevents values from closing the script element", () => {
    const serialized = serializeJsonLd({
      name: "</script><script>alert('xss')</script>",
      description: "A & B"
    });

    expect(serialized).not.toContain("<");
    expect(serialized).not.toContain(">");
    expect(serialized).not.toContain("&");
    expect(serialized).toContain("\\u003c/script\\u003e");
    expect(JSON.parse(serialized)).toEqual({
      name: "</script><script>alert('xss')</script>",
      description: "A & B"
    });
  });
});
