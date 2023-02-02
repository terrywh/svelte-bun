/**
 * 错误处理回调
 * @callback StaticErrorHandler
 * @param {Request} req
 * @param {*} err
 */

/**
 * 文件服务配置
 * @typedef {Object} FileServerOptions
 * @property {string} root 根路径，查找静态文件
 * @property {string} index 索引文件, 默认 "index.html"
 * @property {StaticErrorHandler} error 错误处理回调
 */

/**
 * 编译 Svelte 配置
 * @typedef {Object} SvelteServerOptions
 * @property {string} root 根路径，查找和编译 ${root}/*.svelte 文件
 * @property {StaticErrorHandler} error 错误处理回调
 * @property {import("svelte/types/compiler").CompileOptions} compile 编译配置
 */

/**
 * @callback ServerMux
 * @param {URL} url
 * @param {Request} req 
 * @return {Promise<Response>|Promise<boolean>}
 */

import { HTTPError } from "./error";
import { stat, Stats } from "fs";
import { extname, join } from "path";
import { promisify } from "util";
import { resolve } from "path";
import { compile } from "svelte/compiler";
/**
 * @callback
 * @return {Promise<Stats>}
 */
const asyncStat = promisify(stat);
/**
 * 
 * @param {Request} req 
 * @returns {Date|null}
 */
function parseSince(req) {
    const since = req.headers.get("if-modified-since")
    return since ? new Date(since) : null
}

const MIME_TYPE = {
    ".html": "text/html",
    ".js": "text/javascript",
    ".mjs": "text/javascript",
    ".css": "text/css",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".bin": "application/octet-stream",
}

function contentType(file) {
    return MIME_TYPE[extname(file)] || MIME_TYPE[".bin"];
}
/**
 * 
 * @param {Request} req 
 * @return {Promise<Response>}
 */
export async function defaultErrorHandler(req, err) {
    console.error("request: (", req.method, ")", req.url, "failed, response: (", err.status, ") error: (", err.code, ")", err.info, err.extra);
    if (err instanceof HTTPError) return new Response(JSON.stringify(err), {status: err.status});
    else return new Response(JSON.stringify({
            "error": {"code": 500, "info": "unknown error"},
        }), {status: 500});
}
/**
 * 
 * @param {FileServerOptions} options
 * @return {ServerMux}
 */
export function _serveStatic(options) {
    /**
     * 
     * @param {URL} url 
     * @param {Request} req 
     */
    const staticServer = async function (url, req) {
        let path = resolve(options.root, url.pathname.substring(1)), stat;
        try {
            stat = await asyncStat(path);
            // 访问目录时转接到对应 index 文件
            if (!!stat && stat.isDirectory()) {
                path = join(path, options.index || "index.html")
                stat = await asyncStat(path);
            }
        } catch(ex) {
            stat = null;
        }
        // 无法找到文件
        if (!stat || !stat.isFile())
            return (options.error || defaultErrorHandler)(req, new HTTPError(404, 404, "file not found", {path}));
        // 文件未修改
        const since = parseSince(req);
        if (!!since && parseInt(since.getTime()/1000) >= parseInt(stat.mtime.getTime()/1000))
            return new Response("", {
                status: 304,
                headers: {
                    "cache-control": "max-age=10, must-revalidate",
                    "last-modified": stat.mtime.toUTCString(),
                },
            });
        // 返回文件内容
        return new Response(Bun.file(path), {
            headers: {
                "content-type": contentType(path),
                "cache-control": "max-age=10, must-revalidate",
                "last-modified": stat.mtime.toUTCString(),
            },
        });
    };
    staticServer.options = options;
    return staticServer; 
}
const cacheSvelte = new Map;
/**
 * 
 * @param {string} path 
 * @param {import("svelte/types/compiler").CompileOptions} options 
 * @returns 
 */
async function compileSvelte(path, stat, options) {
    if (!stat || !stat.isFile()) throw new HTTPError(404, 404, "file not found", {path});
    const modify = cacheSvelte.get(path + "/modify");

    if (!modify || modify < stat.mtime.getTime()) {
        const cc = compile(await Bun.file(path).text(), options);
        cc.mtime = stat.mtime;

        cacheSvelte.set(path + "/modify", stat.mtime.getTime());
        cacheSvelte.set(path, cc);
        return cc;
    } else {
        return cacheSvelte.get(path);
    }
}

/**
 * 
 * @param {SvelteServerOptions} options
 * @return {ServerMux}
 */
export function _serveSvelte(options) {
    options.compile = Object.assign(options.compile || {}, {
        sveltePath: "/svelte",
    })
    const serveModule = _serveStatic({
        root: resolve(import.meta.dir, "../node_modules"),
        index: "index.mjs",
    });
    /**
     * 
     * @param {URL} url 
     * @param {Request} req 
     * @returns 
     */
    const serveSvelte = async function(url, req) {
        const path = resolve(options.root, url.pathname.substring(1));
        let stat;
        try {
            stat = await asyncStat(path);
        } catch(ex) {
            stat = null;
        }
        if (!stat || !stat.isFile())
            return (options.error || defaultErrorHandler)(req, new HTTPError(404, 404, "file not found", {path}));
        const since = parseSince(req);
        if (!!since && parseInt(since.getTime()/1000) >= parseInt(stat.mtime.getTime()/1000)) {
            return new Response("", {
                status: 304,
                headers: {
                    "cache-control": "max-age=5, must-revalidate",
                    "last-modified": stat.mtime.toUTCString(),
                },
            });
        }
        let compiled;
        try {
            compiled = await compileSvelte(path, stat, options.compile);
        } catch (ex) {
            return (options.error || defaultErrorHandler)(req, ex, {path});
        }

        return new Response(compiled.js.code, {headers: {
            "content-type": contentType("svelte.js"),
            "cache-control": "max-age=5, must-revalidate",
            "last-modified": stat.mtime.toUTCString(),
        }});
    };
    /**
     * 
     * @param {URL} url 
     * @param {Request} req 
     */
    const svelteServer = async function (url, req) {
        if (url.pathname.startsWith("/svelte/"))
            return serveModule(url, req);
        if (url.pathname.endsWith(".svelte"))
            return serveSvelte(url, req);

        return null;
    };
    svelteServer.options = options;
    return svelteServer;
}
