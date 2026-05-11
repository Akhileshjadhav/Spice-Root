import http from "node:http";
import { config } from "./src/config/env.js";
import { handleRequest } from "./src/routes/router.js";

http.createServer(handleRequest).listen(config.port, () => {
  console.log(`Spice Root server running on http://localhost:${config.port}`);
});
