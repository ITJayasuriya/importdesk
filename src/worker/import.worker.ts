import { createHandler } from "./handler";
import type { Reply } from "./protocol";
const handle = createHandler((reply: Reply) => self.postMessage(reply));
self.onmessage = (event: MessageEvent<unknown>) => {
  void handle(event.data);
};
