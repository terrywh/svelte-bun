import { VERSION } from "svelte/compiler";

export default {
    "/version": async function () {
        return new Response(JSON.stringify({"svelte": "v" + VERSION, "bun": "v" + Bun.version}));
    },
}