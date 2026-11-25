import { ImportError, parseCsv, type Source } from "../domain/csv";
import { requestSchema, type Identity, type Reply } from "./protocol";

export function createHandler(send: (reply: Reply) => void) {
  let job = 0;
  let confirmed: { identity: Identity; source: Source } | undefined;
  return async (input: unknown) => {
    const checked = requestSchema.safeParse(input);
    if (!checked.success) return; // Invalid internal requests cannot read or modify a session.
    const request = checked.data;
    const respond = (reply: Reply) => send(reply);
    if (request.type === "CANCEL") {
      job++;
      respond({ ...request, type: "cancelled" });
      return;
    }
    if (request.type === "GET_ROWS") {
      if (
        !confirmed ||
        confirmed.identity.sessionId !== request.sessionId ||
        confirmed.identity.revision !== request.revision
      ) {
        respond({
          ...request,
          type: "error",
          message: "Source session is unavailable. Import the file again.",
        });
        return;
      }
      respond({
        ...request,
        type: "page",
        rows: confirmed.source.rows.slice(
          request.page * 50,
          (request.page + 1) * 50,
        ),
      });
      return;
    }
    const activeJob = ++job;
    // Retain the previous confirmed source until the new import succeeds.
    try {
      const source = await parseCsv(request.file, request.options, {
        cancelled: () => job !== activeJob,
        progress: (rows) => {
          if (job === activeJob)
            respond({ ...request, type: "progress", rows });
        },
      });
      if (job !== activeJob) return;
      confirmed = { identity: request, source };
      respond({
        ...request,
        type: "imported",
        headers: source.headers,
        total: source.rows.length,
        rows: source.rows.slice(0, 50),
      });
    } catch (error) {
      if (job !== activeJob) return;
      respond({
        ...request,
        type: "error",
        message:
          error instanceof ImportError
            ? error.message
            : "Import failed. The source was not changed; retry the file.",
      });
    }
  };
}
