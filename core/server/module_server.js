import { compile, compileModule } from "svelte/compiler";
import { DEV } from "esm-env";
import { init, parse } from 'es-module-lexer';
import { join } from "node:path";
import { exporter } from "./exporter.js";
import { HttpError } from "./error.js";
import { handleNotModified, isModified } from "./static_server.js";

await init;

export function rewrite(code) {
    const [imports] = parse(code);
    let result = "", offset = 0;
    for (let i of imports) {
        result += code.substring(offset, i.s);
        offset = i.e;
        if (i.n[0] == '.' || i.n[0] == '/') {
            result += i.n;
        } else {
            result += `/module/${i.n}.js`
        }
    }
    result += code.substring(offset)
    return result
}

/**
 * 
 * @return {ServerMux}
 */
export async function createModuleServer(options) {
    options.ttl = options.ttl || 10;
    // 导出模块
    const lastModified = new Date();
    const e = new exporter(options);
    if (!Array.isArray(options.modules)) options.modules = [];
    if (!options.modules.includes("svelte")) options.modules.push("svelte");
    for (const module of options.modules) {
        await e.collect(module);
    }
    const r = await e.build();
    const modules = new Map();
    for (const module of r.outputs) {
        modules.set(join("/module", module.path), module);
    }
    await e.cleanup();

    const server = async function (url, req) {
        if (url.pathname.endsWith(".svelte") || url.pathname.endsWith(".svelte.js") || url.pathname.endsWith(".svelte.ts")) {
            const file = Bun.file(join(options.public, url.pathname));
            if (!isModified(new Date(file.lastModified), req))
                return handleNotModified(lastModified, options);

            const compileOptions = Object.assign({}, options.compile, {
                filename: url.pathname,
                dev: DEV,
            });
            let result;
            if (url.pathname.endsWith(".svelte")) {
                result = compile(await file.text(), compileOptions);
            } else {
                result = compileModule(await file.text(), compileOptions);
            }
            const code = rewrite(result.js.code);
            return new Response(code, {
                headers: {
                    "content-type": "application/javascript",
                    "cache-control": `max-age=${options.ttl}, must-revalidate`,
                    "last-modified": lastModified.toUTCString(),
                }
            });
        } else if (url.pathname.startsWith("/module/")) {
            if (!isModified(lastModified, req))
                return handleNotModified(lastModified, options);
            const module = modules.get(url.pathname);
            if (module) {
                return new Response(module, {
                    headers: {
                        "content-type": "application/javascript",
                        // 内置模块极小改动，可以缓存很长时间
                        "cache-control": `max-age=${options.ttl*10}, must-revalidate`, 
                        "last-modified": lastModified.toUTCString(),
                    }
                });
            }
            return new HttpError(`unexported module: ${url.pathname}`, 404, 404, "module not exported");
        }
        return false;
    };
    server.options = options;
    return server; 
}
