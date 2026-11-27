import { it, expect } from "vitest";
import { createHandler } from "./handler";
import { matchesReply, type Reply } from "./protocol";
const identity = { requestId: "import", sessionId: "session", revision: 0 };
const request = (text: string) => ({
  ...identity,
  type: "IMPORT",
  file: new Blob([text]),
  options: { delimiter: ",", header: true },
});
it("returns only current page and refuses a different session or revision", async () => {
  const replies: Reply[] = [];
  const handle = createHandler((reply) => replies.push(reply));
  await handle(request("id\n" + "0001\n".repeat(101)));
  expect(replies.at(-1)).toMatchObject({ type: "imported", total: 101 });
  expect(replies.at(-1)).toHaveProperty("rows.length", 50);
  expect(replies.at(-1)).not.toHaveProperty("file");
  await handle({ ...identity, type: "GET_ROWS", page: 2 });
  expect(replies.at(-1)).toMatchObject({
    type: "page",
    rows: [{ rowId: "row:101" }],
  });
  await handle({ ...identity, revision: 1, type: "GET_ROWS", page: 0 });
  expect(replies.at(-1)?.type).toBe("error");
  await handle({ ...identity, sessionId: "other", type: "GET_ROWS", page: 0 });
  expect(replies.at(-1)?.type).toBe("error");
});
it("cancellation and obsolete jobs cannot publish a completed source", async () => {
  const replies: Reply[] = [];
  const handle = createHandler((reply) => replies.push(reply));
  const pending = handle(request("id\n" + "1\n".repeat(2000)));
  await handle({ ...identity, type: "CANCEL" });
  await pending;
  expect(replies.some((reply) => reply.type === "imported")).toBe(false);
  expect(replies.some((reply) => reply.type === "cancelled")).toBe(true);
});
it("a failed replacement keeps the confirmed source and validates request boundaries", async () => {
  const replies: Reply[] = [];
  const handle = createHandler((reply) => replies.push(reply));
  await handle(request("id\n0001"));
  await handle(request('id\n"broken'));
  await handle({ ...identity, type: "GET_ROWS", page: 0 });
  expect(replies.at(-1)).toMatchObject({
    type: "page",
    rows: [{ cells: ["0001"] }],
  });
  const count = replies.length;
  await handle({ ...identity, type: "GET_ROWS", page: -1 });
  expect(replies).toHaveLength(count);
});
it("UI rejects obsolete request, session and revision replies", () => {
  expect(matchesReply(identity, identity)).toBe(true);
  for (const changed of [
    { requestId: "old" },
    { sessionId: "old" },
    { revision: 1 },
  ]) {
    expect(matchesReply({ ...identity, ...changed }, identity)).toBe(false);
  }
});

it("obsolete cancellation cannot abort a newer import", async () => {
  const replies: Reply[] = [];
  const handle = createHandler((reply) => replies.push(reply));
  const pending = handle(request("id\n" + "1\n".repeat(1000)));
  await handle({ ...identity, requestId: "old", type: "CANCEL" });
  await pending;
  expect(replies.at(-1)?.type).toBe("imported");
});

it("validates required fields without replacing source and rejects invalid/stale mappings", async () => {
  const replies: Reply[] = [];
  const handle = createHandler((reply) => replies.push(reply));
  await handle(
    request(
      "asset_id,label,category,location,inspection_date,quantity\n0001,,x,Hall,01/02/2026,0",
    ),
  );
  const mapping = {
    asset_id: 0,
    label: 1,
    category: 2,
    location: 3,
    inspection_date: 4,
    quantity: 5,
  };
  await handle({ ...identity, type: "VALIDATE_REQUIRED", mapping });
  expect(replies.at(-1)).toMatchObject({
    type: "validated",
    result: {
      total: 1,
      valid: 0,
      rejected: 1,
      examples: [{ rowId: "row:1", field: "label", code: "REQUIRED_EMPTY" }],
    },
  });
  await handle({
    ...identity,
    type: "VALIDATE_REQUIRED",
    mapping: { ...mapping, label: 0 },
  });
  expect(replies.at(-1)).toMatchObject({ type: "error" });
  await handle({
    ...identity,
    revision: 1,
    type: "VALIDATE_REQUIRED",
    mapping,
  });
  expect(replies.at(-1)).toMatchObject({ type: "error" });
  await handle({ ...identity, type: "GET_ROWS", page: 0 });
  expect(replies.at(-1)).toMatchObject({
    type: "page",
    rows: [{ cells: ["0001", "", "x", "Hall", "01/02/2026", "0"] }],
  });
});
it("cancelled or replaced validation cannot publish stale counts", async () => {
  const replies: Reply[] = [];
  const handle = createHandler((reply) => replies.push(reply));
  const header = "asset_id,label,category,location,inspection_date,quantity\n";
  await handle(request(header + "1,x,x,x,x,1\n".repeat(1001)));
  const mapping = {
    asset_id: 0,
    label: 1,
    category: 2,
    location: 3,
    inspection_date: 4,
    quantity: 5,
  };
  let pending = handle({ ...identity, type: "VALIDATE_REQUIRED", mapping });
  await handle({ ...identity, type: "CANCEL" });
  await pending;
  expect(replies.some((reply) => reply.type === "validated")).toBe(false);
  pending = handle({ ...identity, type: "VALIDATE_REQUIRED", mapping });
  await handle({
    ...request(header + "2,y,y,y,y,2"),
    sessionId: "replacement",
  });
  await pending;
  expect(replies.some((reply) => reply.type === "validated")).toBe(false);
});

it("requires a live preview, commits atomically once and rejects obsolete revisions while originals remain unchanged", async () => {
  const replies: Reply[] = [];
  const handle = createHandler((reply) => replies.push(reply));
  await handle(
    request(
      "asset_id,label,category,location,inspection_date,quantity\n0001,,x,Hall,01/02/2026,0",
    ),
  );
  const mapping = {
    asset_id: 0,
    label: 1,
    category: 2,
    location: 3,
    inspection_date: 4,
    quantity: 5,
  };
  const preview = {
    ...identity,
    requestId: "preview",
    type: "PREVIEW_FILL",
    mapping,
    field: "label",
    value: "Spare",
  };
  await handle({ ...identity, type: "COMMIT_FILL", previewId: "preview" });
  expect(replies.at(-1)?.type).toBe("error");
  await handle(preview);
  expect(replies.at(-1)).toMatchObject({
    type: "fill_preview",
    preview: { affected: 1 },
  });
  await handle({
    ...identity,
    requestId: "commit",
    type: "COMMIT_FILL",
    previewId: "preview",
  });
  expect(replies.at(-1)).toMatchObject({
    type: "fill_committed",
    newRevision: 1,
    stepCount: 1,
    result: { valid: 1, rejected: 0 },
  });
  await handle({ ...identity, type: "COMMIT_FILL", previewId: "preview" });
  expect(replies.at(-1)?.type).toBe("error");
  await handle({ ...identity, revision: 1, type: "GET_ROWS", page: 0 });
  expect(replies.at(-1)).toMatchObject({
    type: "page",
    rows: [{ cells: ["0001", "", "x", "Hall", "01/02/2026", "0"] }],
  });
  await handle({ ...preview, revision: 1 });
  expect(replies.at(-1)).toMatchObject({
    type: "fill_preview",
    preview: { affected: 0 },
  });
});
it("cancelled previews/commits cannot mutate the repair revision", async () => {
  const replies: Reply[] = [];
  const handle = createHandler((reply) => replies.push(reply));
  await handle(
    request(
      "asset_id,label,category,location,inspection_date,quantity\n" +
        "1,,x,x,x,1\n".repeat(1001),
    ),
  );
  const mapping = {
    asset_id: 0,
    label: 1,
    category: 2,
    location: 3,
    inspection_date: 4,
    quantity: 5,
  };
  const preview = {
    ...identity,
    type: "PREVIEW_FILL",
    mapping,
    field: "label",
    value: "Spare",
  };
  let pending = handle(preview);
  await handle({ ...identity, type: "CANCEL" });
  await pending;
  expect(replies.some((r) => r.type === "fill_preview")).toBe(false);
  await handle(preview);
  pending = handle({
    ...identity,
    type: "COMMIT_FILL",
    previewId: identity.requestId,
  });
  await handle({ ...identity, type: "CANCEL" });
  await pending;
  expect(replies.some((r) => r.type === "fill_committed")).toBe(false);
  await handle({ ...identity, type: "VALIDATE_REQUIRED", mapping });
  expect(replies.at(-1)).toMatchObject({
    type: "validated",
    result: { rejected: 1001 },
  });
});
