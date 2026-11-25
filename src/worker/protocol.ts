import type { z } from "zod";
import type { SourceRow } from "../domain/csv";
import type { requestSchema } from "./request-schema";
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
