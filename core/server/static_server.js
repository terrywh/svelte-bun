import { stat as asyncStat } from "fs/promises";
import { extname, join } from "path";
import { resolve } from "path";
import { compile } from "svelte/compiler";
import { rewriteImports } from "./import_rewrite";
import { defaultErrorHandler, HttpError } from "./error";
import { Stats } from "fs";

/**
 * 
 * @param {Request} req 
 * @returns {Date|null}
 */
function parseModifiedSince(req) {
    const since = req.headers.get("if-modified-since")
    return since ? new Date(since) : null
}

function parseContentType(file) {
    const ctypes = {
        ".html": "text/html",
        ".js": "text/javascript",
        ".mjs": "text/javascript",
        ".css": "text/css",
        ".png": "image/png",
        ".jpg": "image/jpeg",
        ".bin": "application/octet-stream",
    }
    return ctypes[extname(file)] || ctypes[".bin"];
}

function parseRequestFile(url, options) {
    if (typeof options.static === "object") {
        let target
        for (let mapping of options.static) {
            if (url.pathname.startsWith(mapping.prefix)) 
                return resolve(mapping.path, url.pathname.substring(mapping.prefix.length))
        }
    }
    return resolve(options.static, url.pathname.substring(1))
}

/**
 * 
 * @param {URL} url 
 * @returns {Promise<import("fs").Stats>}
 */
async function statFile(path) {
    let stat;
    try {
        stat = await asyncStat(path)
    } catch(ex) {
        stat = null
    }
    return stat
}

/**
 * 
 * @param {Stats} stat 
 * @param {Request} req 
 * @returns 
 */
function isfileModified(stat, req) {
    const since = parseModifiedSince(req);
    if (!!since && parseInt(since.getTime()/1000) >= parseInt(stat.mtime.getTime()/1000))
        return false
    return true
}

/**
 * 静态服务器错误处理器
 * @callback StaticServerHandler
 * @param {Request} req
 * @param {string} file
 * @param {Stats} stat
 * @param {StaticServerOption} options
 * @returns {void}
 */

/**
 * 默认静态文件处理器，按 Content-Type 返回对应静态文件
 * @param {import("fs").Stats} stat 
 * @param {string} path 
 * @returns 
 */
export function defaultStaticHandler(req, file, stat, options) {
    return new Response(Bun.file(file), {
        headers: {
            "content-type": parseContentType(file),
            "cache-control": `max-age=${options.ttl}, must-revalidate`,
            "last-modified": stat.mtime.toUTCString(),
        },
    });
}

/**
 * 默认脚本代理处理器，支持 .mjs / .js 文件引用路径处理
 * @param {Request} req 
 * @param {Stats} stat 
 * @param {string} path 
 * @param {StaticServerOption} options 
 * @returns 
 */
export async function defaultScriptHandler(req, file, stat, options) {
    const code = await Bun.file(file).text()
    return new Response(rewriteImports(code, file), {
        headers: {
            "content-type": parseContentType(file),
            "cache-control": `max-age=${options.ttl}, must-revalidate`,
            "last-modified": stat.mtime.toUTCString(),
        },
    });
}
/**
 * 处理 .svelte 文件编译及引用路径
 * @param {Request} req 
 * @param {Stats} stat 
 * @param {string} path 
 * @param {StaticServerOption} options 
 * @returns 
 */
export async function defaultSvelteHandler(req, file, stat, options) {
    let compiled;
    try {
        compiled = await compileSvelte(file, stat, options);
    } catch (ex) {
        return options.errorHandler(req, new HttpError(
            "failed to compile svelte", 10500, 500, `failed to compile svelte '${path}': ${ex}`))
    }

    return new Response(compiled.js.code, {headers: {
        "content-type": parseContentType("svelte.mjs"),
        "cache-control": "max-age=5, must-revalidate",
        "last-modified": stat.mtime.toUTCString(),
    }});
}
/**
 * 默认文件处理器，同时支持静态文件及 .svelte / .mjs / .js 文件及引用路径处理
 * @param {Request} req 
 * @param {Stats} stat 
 * @param {string} path 
 * @param {StaticServerOption} options 
 * @returns 
 */
export function defaultFileHandler(req, path, stat, options) {
    if (path.endsWith(".svelte")) 
        return defaultSvelteHandler(req, path, stat, options)
    if (path.endsWith(".mjs") || path.endsWith(".js"))
        return defaultScriptHandler(req, path, stat, options)
    return defaultStaticHandler(req, path, stat, options)
}

function handleRedirect(url, options) {
    return new Response(null, {
        status: 302,
        headers: {
            "location": url.pathname,
        },
    })
}

/**
 * 
 * @param {Stats} stat 
 * @returns 
 */
function handleNotModified(stat, options) {
    return new Response(null, {
        status: 304,
        headers: {
            "cache-control": `max-age=${options.ttl || 10}, must-revalidate`,
            "last-modified": stat.mtime.toUTCString(),
        },
    });
}

/**
 * @typedef {Object} StaticServerDirMap 静态服务器路径映射配置
 * @property {string} prefix 请求路径前缀
 * @property {string} path 映射物理路径
 * @example
 * [
 *      {"prefix": "/@module/", "path": "/data/htdocs/xxx/node_modules"},
 *      {"prefix": "/", "path": "/data/htdocs/xxx/public"},
 * ]
 * 
 * @typedef {Object} StaticServerOption 静态文件服务器选项
 * @property {string | Record<string, string> | StaticServerDirMap[]} static 静态文件查找路径，访问路径与文件路径映射目录;
 * 1. 多个路径映射其匹配顺序与定义顺序一致
 * 2. XXXX
 * @property {number} [ttl=10] 缓存时间, 默认 10 单位：秒
 * @property {string} [index="index.html"] 索引文件，默认 "index.html" 文件
 * @property {StaticServerHandler} [errorHandler] 错误处理器
 * @property {StaticServerHandler} [fileHandler] 错误处理器
 * 
 * @example 仅指定根路径
 * { static: "/data/htdocs/xxx" }
 * @example 指定多个映射
 * { static: {
 *      "/@module/": "/data/htdocs/xxx/node_modules",
 *      "/": "/data/htdocs/xxx/public"   
 * } }
 */

/**
 * 创建静态文件服务器
 * @param {StaticServerOption} options
 * @return {ServerMux}
 */
export function createStaticServer(options) {
    options = Object.assign({}, { index: "index.html", handler: {}, ttl: 10 }, options)
    options.static = normalizeStaticMapping(options.static)
    if (!Array.isArray(options.static)) 
        throw new TypeError("invalid option in field 'static'")
    if (!options.errorHandler) options.errorHandler = function(req, file, stat, options) {
        return defaultErrorHandler(req, new HttpError("file not found", 10404, 404, `failed to stat file: ${file}`))
    }
    if (!options.fileHandler) options.fileHandler = defaultStaticHandler
    /**
     * 
     * @param {URL} url 
     * @param {Request} req 
     */
    const server = async function (url, req) {
        let path = parseRequestFile(url, options)
        let stat = await statFile(path)

        if (!!stat && stat.isDirectory()) {
            path = join(path, options.index)
            url.pathname = join(url.pathname, options.index)

            if (options.index.redir) 
                return handleRedirect(url)
            
            stat = await statFile(path)
        }
        if (!stat || !stat.isFile()) // 无法找到文件
            return false // 未处理（交给下个服务处理器）
        
        if (!isfileModified(stat, req)) // 文件未修改
            return handleNotModified(stat, options)
        // 返回文件内容
        return options.fileHandler(req, path, stat, options)
    };
    server.options = options;
    return server; 
}

const cacheSvelte = new Map;
/**
 * 
 * @param {string} path 
 * @param {SvelteServerOption} options 
 * @returns 
 */
async function compileSvelte(path, stat, options) {
    if (!stat || !stat.isFile())
        throw new Error("file not found")
    const modify = cacheSvelte.get(path + "/modify");

    if (!modify || modify < stat.mtime.getTime()) {
        const cc = compile(await Bun.file(path).text(), options.compile);
        cc.mtime = stat.mtime;
        cc.js.code = rewriteImports(cc.js.code, path)

        cacheSvelte.set(path + "/modify", stat.mtime.getTime());
        cacheSvelte.set(path, cc);
        return cc;
    } else {
        return cacheSvelte.get(path);
    }
}

/**
 * @typedef {Object} SvelteServerOptionEx 支持 Svelte 组件的静态服务器选项
 * @property {string} [module] 模块路径 (node_modules)
 * @property {import("svelte/types/compiler").CompileOptions} compile 编译选项
 * @typedef {StaticServerOption & SvelteServerOptionEx} SvelteServerOption
 * @see StaticServerOption
 */
/**
 * 创建支持 Svelte 组件的静态服务器
 * @param {SvelteServerOption} options
 * @return {ServerMux}
 */
export function createSvelteServer(options) {
    options = Object.assign({}, {index: "index.html", handler: {}, ttl: 10}, options)
    options.compile = Object.assign(options.compile || {}, {
        sveltePath: "svelte",
        dev: process.env.DEBUG ? true : false,
    })
    if (!options.fileHandler) options.fileHandler = defaultFileHandler // 与默认的静态文件服务器不同
    options.static = normalizeStaticMapping(options.static)
    if (!!options.module) options.static.unshift({prefix: "/@module/", path: options.module})
    const server = createStaticServer(options)
    server.options = options
    return server
}

/**
 * 
 * @param {string | object | []} mapping 
 * @returns {Array}
 */
function normalizeStaticMapping(mapping) {
    let r = []
    if (Array.isArray(mapping) && !!mapping[0].prefix && !!mapping[0].path)
        r = mapping
    else if (typeof mapping === "string")
        r.push({prefix: "/", path: mapping})
    else if (typeof mapping === "object") for (let prefix in mapping)
        r.push({prefix: prefix, path: mapping[prefix]})
    else
        return null
    for (let m of r) {
        if (!m.prefix.startsWith("/")) m.prefix = `/${m.prefix}`
        if (!m.prefix.endsWith("/")) m.prefix = `${m.prefix}/`
    }
    return r
}