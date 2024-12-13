import { compile } from "svelte/compiler";
import { join } from "path";
import { file } from "bun";

const SvelteLoader = function(options) {
    options = Object.assign({}, options, {
        dev: process.env.DEBUG ? true : false,
    })
    return {
        name: "module loader",
        /**
         * 
         * @param {import("bun").PluginBuilder} build 
         */
        async setup(build) {
            build.onLoad({ filter: /\.svelte$/, namespace: "svelte" }, async ({ path }) => {
                const text = await file(path).text();
                const c = compile(text, options);
                
                return {
                    contents: c.js.code,
                    loader: "js",
                };
            });
            build.onResolve({ filter: /\.svelte$/}, async ({ path }) => {
                return {
                    path: join(build.config.root, path),
                    namespace: "svelte",
                }
            })
        },   
    };
}
/**
 * 
 * @param {StaticServerOption} options
 * @return {ServerMux}
 */
export function createSvelteServer(options) {
    const server = async function (url, req) {
        if (!url.pathname.endsWith(".svelte.js")) {
            return false; // 未处理（交给下个服务处理器）
        }
        const result = await Bun.build({
            root: options.root,
            entrypoints: [join(options.root, url.pathname)],
            plugins: [SvelteLoader(options.svelte)],

        });
        return new Response(result.outputs[0]);
    };
    server.options = options;
    return server; 
}
