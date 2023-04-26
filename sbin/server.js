import { serve } from "../core/server/main.js"
import { resolve } from "path";
import { createSvelteServer } from "../core/server/static_server.js"
import { createRestfulServer } from "../core/server/restful_server.js"

const root = resolve(import.meta.dir, "..")

serve([
    createRestfulServer(Object.assign({}, 
        (await import("../service/hello.js")).default,
    )),
    createSvelteServer({
        static: `${root}/public`,
        module: `${root}/node_modules`, // => /@module
        compile: {
            dev: process.env.DEBUG ? true : false,
        }
    }),
    async function(url, req) {
        return new Response('not found', {status: 404})
    }
], {
    // hostname: "127.0.0.1",
    // port: 3000,
})