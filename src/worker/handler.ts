import { ImportError, parseCsv, type Source } from "../domain/csv";
import { matchesReply, type Identity, type Reply } from "./protocol";
import { requestSchema } from "./request-schema";

export function createHandler(send: (reply: Reply) => void) {
  let job = 0;
  let importing: Identity | undefined;
  let confirmed: { identity: Identity; source: Source } | undefined;
  return async (input: unknown) => {
    const checked = requestSchema.safeParse(input);
    if (!checked.success) return; // Invalid internal requests cannot read or modify a session.
    const request = checked.data;
    const identity: Identity = {
      requestId: request.requestId,
      sessionId: request.sessionId,
      revision: request.revision,
    };
    if (request.type === "CANCEL") {
      if (!importing || !matchesReply(identity, importing)) return;
      job++;
      send({ ...identity, type: "cancelled" });
      return;
    }
    if (request.type === "GET_ROWS") {
      if (
        !confirmed ||
        confirmed.identity.sessionId !== request.sessionId ||
        confirmed.identity.revision !== request.revision
      ) {
        send({
          ...identity,
          type: "error",
          message: "Source session is unavailable. Import the file again.",
        });
        return;
      }
      send({
        ...identity,
        type: "page",
        page: request.page,
        rows: confirmed.source.rows.slice(
          request.page * 50,
          (request.page + 1) * 50,
        ),
      });
      return;
    }
    importing = identity;
    const activeJob = ++job;
    // Retain the previous confirmed source until the new import succeeds.
    try {
      const source = await parseCsv(request.file, request.options, {
        cancelled: () => job !== activeJob,
        progress: (rows) => {
          if (job === activeJob) send({ ...identity, type: "progress", rows });
        },
      });
      if (job !== activeJob) return;
      confirmed = { identity, source };
      send({
        ...identity,
        type: "imported",
        headers: source.headers,
        total: source.rows.length,
        rows: source.rows.slice(0, 50),
      });
    } catch (error) {
      if (job !== activeJob) return;
      send({
        ...identity,
        type: "error",
        message:
          error instanceof ImportError
            ? error.message
            : "Import failed. The source was not changed; retry the file.",
      });
    }
  };
}
