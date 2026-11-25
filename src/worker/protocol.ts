import { z } from "zod";
import type { SourceRow } from "../domain/csv";
const identity = {
  requestId: z.string().min(1),
  sessionId: z.string().min(1),
  revision: z.number().int().nonnegative(),
};
export const requestSchema = z.discriminatedUnion("type", [
  z.object({
    ...identity,
    type: z.literal("IMPORT"),
    file: z.instanceof(Blob),
    options: z.object({
      delimiter: z.enum([",", ";", "\t"]),
      header: z.boolean(),
    }),
  }),
  z.object({
    ...identity,
    type: z.literal("GET_ROWS"),
    page: z.number().int().min(0).max(1999),
  }),
  z.object({ ...identity, type: z.literal("CANCEL") }),
]);
export type Request = z.infer<typeof requestSchema>;
export type Identity = Pick<Request, "requestId" | "sessionId" | "revision">;
export type Reply = Identity &
  (
    | { type: "progress"; rows: number }
    | { type: "imported"; total: number; headers: string[]; rows: SourceRow[] }
    | { type: "page"; page: number; rows: SourceRow[] }
    | { type: "cancelled" }
    | { type: "error"; message: string }
  );
export function matchesReply(reply: Identity, active: Identity): boolean {
  return (
    reply.requestId === active.requestId &&
    reply.sessionId === active.sessionId &&
    reply.revision === active.revision
  );
}
