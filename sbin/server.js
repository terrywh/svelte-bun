import { serve } from "../core/server/main.js"
import { resolve } from "path";
import { createStaticServer } from "../core/server/static_server.js"
import { createModuleServer } from "../core/server/module_server.js"
import { createRestfulServer } from "../core/server/restful_server.js"

const root = resolve(import.meta.dir, "..")

serve([
    await createRestfulServer(Object.assign({}, 
        (await import("../service/hello.js")).default,
    )),
    await createModuleServer({
        root: root,
        public: `${root}/public`,
    }),
    await createStaticServer({
        public: `${root}/public`,
    }),
], {
    // hostname: "127.0.0.1",
    // port: 3000,
})