import { describe, expect, it } from "vitest";

import {
  getDefinePasswordPath,
  getPasswordRecoveryPath,
  getPortalNextPath,
  parseAuthPortal
} from "@/features/auth/portal";

describe("portal-aware authentication", () => {
  it("keeps valid destinations inside their originating portal", () => {
    expect(getPortalNextPath("business", "/negocio?vista=equipa")).toBe("/negocio?vista=equipa");
    expect(getPortalNextPath("pos", "/negocio")).toBe("/pos");
    expect(getPortalNextPath("admin", "//outside.example")).toBe("/admin");
    expect(getPortalNextPath("business", "/negocio-malicioso")).toBe("/negocio");
    expect(getPortalNextPath("admin", "/administrator")).toBe("/admin");
  });

  it("builds recovery and password update paths without losing the destination", () => {
    expect(getPasswordRecoveryPath("pos", "/pos?etapa=services")).toBe(
      "/recuperar-acesso?portal=pos&next=%2Fpos%3Fetapa%3Dservices"
    );
    expect(getDefinePasswordPath("admin", "/admin?view=support")).toBe(
      "/definir-senha?portal=admin&next=%2Fadmin%3Fview%3Dsupport"
    );
    expect(parseAuthPortal("unknown")).toBe("customer");
  });
});
