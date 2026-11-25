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
