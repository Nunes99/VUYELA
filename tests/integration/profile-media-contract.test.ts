import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const migration = readFileSync(
  join(process.cwd(), "supabase/migrations/manage_profile_media.sql"),
  "utf8"
);
const mediaService = readFileSync(join(process.cwd(), "lib/profile-media.ts"), "utf8");
const profileAction = readFileSync(
  join(process.cwd(), "features/customer-dashboard/actions.ts"),
  "utf8"
);
const profileView = readFileSync(
  join(process.cwd(), "features/customer-dashboard/dashboard.tsx"),
  "utf8"
);

describe("profile media contract", () => {
  it("stores only a private object path on the profile", () => {
    expect(migration).toContain("add column if not exists avatar_path text");
    expect(migration).toContain("'profile-media'");
    expect(migration).toContain("false");
    expect(migration).not.toMatch(/bytea/i);
  });

  it("restricts every storage operation to the authenticated owner path", () => {
    expect(migration).toContain("profile_media_owner_select");
    expect(migration).toContain("profile_media_owner_insert");
    expect(migration).toContain("profile_media_owner_update");
    expect(migration).toContain("profile_media_owner_delete");
    expect(migration).toContain("(select auth.uid())::text");
  });

  it("validates, signs and safely replaces profile photographs", () => {
    expect(mediaService).toContain("validateImageFile(file)");
    expect(mediaService).toContain("createSignedUrl");
    expect(mediaService).toContain("randomUUID()");
    expect(mediaService).toContain("upsert: false");
    expect(profileAction).toContain("removeProfileAvatar");
    expect(profileAction).toContain("uploadedAvatarPath");
  });

  it("exposes one upload control and the shared avatar renderer", () => {
    expect(profileView).toContain('name="profileImage"');
    expect(profileView).toContain('removeName="removeProfileImage"');
    expect(profileView).toContain("<ProfileAvatar");
  });
});
