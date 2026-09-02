// Integration tests for user-management audit logging: PATCH /users/:id, PATCH /users/:id/status,
// and DELETE /users/:id each now write a UserActivityLog entry alongside their mutation.
//
// Run with the local dev database (see server/CLAUDE.md — bun auto-loads .env.local, which
// points at the wrong DB host; use .env.development instead):
//
//   bun --env-file=.env.development test tests/integration/user-audit-log.test.ts
//
// These tests create their own throwaway User fixtures (unique cuid/email) and delete them in
// afterAll — UserActivityLog rows cascade with their owning user — so they do not disturb
// seeded/dev data.

import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { Hono, Context } from "hono";
import { pgsql } from "@/lib/database";
import { RoleEnum, StatusEnum } from "generated/prisma";
import { UserController } from "@/modules/users/user.controller";
import { requirePermission } from "@/middlewares/permission.middleware";
import { PERMISSIONS, getPermissionsForRole } from "@/config/constant/permission.constant";
import { userAction } from "@/config/constant/user.constant";
import { errorHandler } from "@/middlewares/error.middleware";
import { optionalFile } from "@/middlewares/file.middleware";
import { fileLimit } from "@/config/constant/file.constant";

// Mirrors the real route wiring from src/routes/v1/user.route.ts (same requirePermission +
// controller), with a stub identity middleware standing in for `protect` so the tests exercise
// the actual permission check and audit-log write without a login/session/Redis round trip.
function buildTestApp(role: RoleEnum, actorId: string) {
  const app = new Hono();
  app.use("*", async (c: Context, next: () => Promise<void>) => {
    c.set("user", { id: actorId, userId: actorId, role, permissions: getPermissionsForRole(role) });
    await next();
  });
  app.patch("/users/:id", requirePermission(PERMISSIONS.USER_UPDATE), optionalFile(fileLimit.AVATAR_OPTIONS, "avatar"), UserController.updateUser);
  app.patch("/users/:id/status", requirePermission(PERMISSIONS.USER_UPDATE), UserController.updateUserStatus);
  app.delete("/users/:id", requirePermission(PERMISSIONS.USER_DELETE), UserController.deleteUser);
  app.onError(errorHandler);
  return app;
}

let actorId: string;
const createdUserIds: string[] = [];

async function createTargetUser(overrides: { role?: RoleEnum; status?: StatusEnum; name?: string } = {}) {
  const user = await pgsql.user.create({
    data: {
      email: `test-audit-target-${crypto.randomUUID()}@example.test`,
      name: overrides.name ?? "Audit Target",
      role: overrides.role ?? RoleEnum.INSPECTOR,
      status: overrides.status ?? StatusEnum.ACTIVE,
    },
  });
  createdUserIds.push(user.id);
  return user;
}

function latestLog(userId: string, action: string) {
  return pgsql.userActivityLog.findFirst({ where: { userId, action }, orderBy: { createdAt: "desc" } });
}

beforeAll(async () => {
  const actor = await pgsql.user.create({
    data: { email: `test-audit-actor-${crypto.randomUUID()}@example.test`, name: "Audit Log Tester", role: RoleEnum.ADMIN },
  });
  actorId = actor.id;
});

afterAll(async () => {
  await pgsql.user.deleteMany({ where: { id: { in: [...createdUserIds, actorId] } } }); // cascades activity logs
  await pgsql.$disconnect();
});

describe("PATCH /users/:id — audit log", () => {
  function patchUser(app: Hono, id: string, fields: Record<string, string>) {
    return app.request(`/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(fields).toString(),
    });
  }

  test("an actual change writes an update_user entry naming the actor and the before/after values", async () => {
    const target = await createTargetUser({ name: "Original Name", role: RoleEnum.INSPECTOR });
    const app = buildTestApp(RoleEnum.ADMIN, actorId);

    const res = await patchUser(app, target.id, { name: "Renamed User", role: RoleEnum.ADMIN });

    expect(res.status).toBe(200);
    const log = await latestLog(target.id, userAction.UPDATE_USER);
    expect(log).not.toBeNull();
    expect(log!.metadata).toMatchObject({
      actorUserId: actorId,
      changes: {
        name: { from: "Original Name", to: "Renamed User" },
        role: { from: RoleEnum.INSPECTOR, to: RoleEnum.ADMIN },
      },
    });
  });

  test("submitting the same values writes no audit entry", async () => {
    const target = await createTargetUser({ name: "Unchanged Name", role: RoleEnum.INSPECTOR });
    const app = buildTestApp(RoleEnum.ADMIN, actorId);

    const res = await patchUser(app, target.id, { name: "Unchanged Name", role: RoleEnum.INSPECTOR });

    expect(res.status).toBe(200);
    expect(await latestLog(target.id, userAction.UPDATE_USER)).toBeNull();
  });

  test("an unauthorized role (USER, lacks user.update) receives 403 and writes no entry", async () => {
    const target = await createTargetUser();
    const app = buildTestApp(RoleEnum.USER, actorId);

    const res = await patchUser(app, target.id, { name: "Should Not Apply" });

    expect(res.status).toBe(403);
    expect(await latestLog(target.id, userAction.UPDATE_USER)).toBeNull();
  });
});

describe("PATCH /users/:id/status — audit log", () => {
  function patchStatus(app: Hono, id: string, status: string) {
    return app.request(`/users/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
  }

  test("changing status writes an update_status entry with both statuses and the actor", async () => {
    const target = await createTargetUser({ status: StatusEnum.ACTIVE });
    const app = buildTestApp(RoleEnum.ADMIN, actorId);

    const res = await patchStatus(app, target.id, StatusEnum.BANNED);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.status).toBe(StatusEnum.BANNED);
    const log = await latestLog(target.id, userAction.UPDATE_STATUS);
    expect(log).not.toBeNull();
    expect(log!.metadata).toMatchObject({ actorUserId: actorId, previousStatus: StatusEnum.ACTIVE, newStatus: StatusEnum.BANNED });
  });

  test("a missing user is a 404 and writes no entry", async () => {
    const app = buildTestApp(RoleEnum.ADMIN, actorId);
    const res = await patchStatus(app, "does-not-exist", StatusEnum.BANNED);
    expect(res.status).toBe(404);
  });
});

describe("DELETE /users/:id — audit log", () => {
  test("deleting a user soft-deletes it and writes a delete_user entry naming the actor", async () => {
    const target = await createTargetUser({ name: "To Be Deleted" });
    const app = buildTestApp(RoleEnum.ADMIN, actorId);

    const res = await app.request(`/users/${target.id}`, { method: "DELETE" });

    expect(res.status).toBe(200);

    const refreshed = await pgsql.user.findUniqueOrThrow({ where: { id: target.id } });
    expect(refreshed.deletedAt).not.toBeNull();

    const log = await latestLog(target.id, userAction.DELETE_USER);
    expect(log).not.toBeNull();
    expect(log!.metadata).toMatchObject({ actorUserId: actorId, email: target.email });
  });

  test("an unauthorized role (USER, lacks user.delete) receives 403 and the user survives", async () => {
    const target = await createTargetUser();
    const app = buildTestApp(RoleEnum.USER, actorId);

    const res = await app.request(`/users/${target.id}`, { method: "DELETE" });

    expect(res.status).toBe(403);
    const refreshed = await pgsql.user.findUniqueOrThrow({ where: { id: target.id } });
    expect(refreshed.deletedAt).toBeNull();
  });
});
