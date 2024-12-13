import { serve } from "../core/server/main.js"
import { resolve } from "path";
import { createStaticServer } from "../core/server/static_server.js"
import { createSvelteServer } from "../core/server/script_server.js"
import { createRestfulServer } from "../core/server/restful_server.js"

const root = resolve(import.meta.dir, "..")

serve([
    createRestfulServer(Object.assign({}, 
        (await import("../service/hello.js")).default,
    )),
    createSvelteServer({
        root: `${root}/public`,
        svelte: {
            dev: process.env.DEBUG ? true : false,
        },
    }),
    createStaticServer({
        root: `${root}/public`,
    }),
], {
    // hostname: "127.0.0.1",
    // port: 3000,
})