import { validateInventory } from "../domain/validation";
import { mappingProblems, type Mapping } from "../domain/inventory";
import {
  fillStep,
  previewFill,
  repairedRow,
  type FillStep,
} from "../domain/repair";
import { parseCsv, type Source } from "../domain/csv";
import { matchesReply, type Identity, type Reply } from "./protocol";
import { requestSchema } from "./request-schema";

export function createHandler(send: (reply: Reply) => void) {
  let job = 0;
  let processing: Identity | undefined;
  let confirmed:
    { identity: Identity; source: Source; steps: FillStep[] } | undefined;
  let preview:
    | { id: string; step: FillStep; mapping: Mapping; affected: number }
    | undefined;
  return async (input: unknown) => {
    const checked = requestSchema.safeParse(input);
    if (!checked.success) return;
    const request = checked.data;
    const identity: Identity = {
      requestId: request.requestId,
      sessionId: request.sessionId,
      revision: request.revision,
    };
    if (request.type === "CANCEL") {
      if (!processing || !matchesReply(identity, processing)) return;
      job++;
      preview = undefined;
      send({ ...identity, type: "cancelled" });
      return;
    }
    processing = identity;
    const activeJob = ++job;
    const cancelled = () => job !== activeJob;
    const pending = preview;
    preview = undefined;
    try {
      if (request.type === "IMPORT") {
        const source = await parseCsv(request.file, request.options, {
          cancelled,
          progress: (rows) => {
            if (!cancelled()) send({ ...identity, type: "progress", rows });
          },
        });
        if (cancelled()) return;
        // Replace original and repairs together only after the import succeeds.
        confirmed = { identity, source, steps: [] };
        send({
          ...identity,
          type: "imported",
          headers: source.headers,
          total: source.rows.length,
          rows: source.rows.slice(0, 50),
        });
        return;
      }
      if (
        !confirmed ||
        confirmed.identity.sessionId !== request.sessionId ||
        confirmed.identity.revision !== request.revision
      )
        throw new Error(
          "Source session is unavailable. Import the file again.",
        );
      const session = confirmed;
      if (request.type === "GET_ROWS") {
        send({
          ...identity,
          type: "page",
          page: request.page,
          rows: session.source.rows.slice(
            request.page * 50,
            (request.page + 1) * 50,
          ),
        });
        return;
      }
      if (request.type === "PREVIEW_FILL") {
        if (session.steps.length >= 100)
          throw new Error(
            "This alpha supports up to 100 repair steps. Reimport the original to start again.",
          );
        const step = fillStep(
          session.source,
          request.mapping,
          request.field,
          request.value,
        );
        const result = await previewFill(
          session.source,
          session.steps,
          step,
          cancelled,
        );
        if (!result || cancelled()) return;
        preview = {
          id: request.requestId,
          step,
          mapping: request.mapping,
          affected: result.affected,
        };
        send({ ...identity, type: "fill_preview", preview: result });
        return;
      }
      const mapping =
        request.type === "COMMIT_FILL" ? pending?.mapping : request.mapping;
      if (!mapping)
        throw new Error("Preview this repair again before applying it.");
      const problems = mappingProblems(mapping, session.source.headers);
      if (problems.length) throw new Error(problems.join(" "));
      let steps = session.steps;
      if (request.type === "COMMIT_FILL") {
        if (
          !pending ||
          pending.id !== request.previewId ||
          pending.affected === 0
        )
          throw new Error("Preview this repair again before applying it.");
        steps = [...steps, pending.step];
      }
      const result = await validateInventory(
        session.source,
        mapping,
        cancelled,
        (row) => repairedRow(row, steps),
      );
      if (!result || cancelled()) return;
      if (request.type === "COMMIT_FILL") {
        session.steps = steps;
        session.identity = { ...identity, revision: identity.revision + 1 };
        send({
          ...identity,
          type: "fill_committed",
          newRevision: session.identity.revision,
          result,
          stepCount: steps.length,
        });
      } else send({ ...identity, type: "validated", result });
    } catch (error) {
      if (cancelled()) return;
      send({
        ...identity,
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Processing failed. The source was not changed; retry the file.",
      });
    }
  };
}
