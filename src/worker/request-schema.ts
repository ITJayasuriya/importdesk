import { z } from "zod";
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
