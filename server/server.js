/// <reference path="../node_modules/bun-types/types.d.ts" />
import { resolve } from "path";
import { _serveStatic, _serveSvelte } from "./static_server";

const mux = [
    _serveSvelte({
        root: resolve(import.meta.dir, "../public"),
        compile: {
            dev: true,
        }
    }),
    _serveStatic({
        root: resolve(import.meta.dir, "../public"),
    }),
];

Bun.serve({
    baseURI: "http://svelte-dev:3000",
    hostname: "127.0.0.1",
    port: 3000,
    async fetch(req) {
        const url = new URL(req.url);
        for (let serve of mux) {
            let r = await serve(url, req)
            if (r instanceof Response) return r;
        }
    },
});