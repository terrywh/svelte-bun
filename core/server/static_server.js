import { stat as asyncStat } from "fs/promises";
import { extname, join } from "path";
import { resolve } from "path";
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
export function isModified(mtime, req) {
    const since = req.headers.get("if-modified-since");
    if (!since) return true;
    const cache = new Date(since);
    if (!cache) return true;
    return Math.trunc(cache.getTime()/1000) < Math.trunc(mtime.getTime()/1000); // 对齐时间精度
}

/**
 * 静态服务器错误处理器
 * @callback StaticServerHandler
 * @param {Request} req
 * @param {Error} error
 * @returns {void}
 */

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
export function handleNotModified(mtime, options) {
    return new Response(null, {
        status: 304,
        headers: {
            "cache-control": `max-age=${options.ttl || 10}, must-revalidate`,
            "last-modified": mtime.toUTCString(),
        },
    });
}

function handleStaticFile(mtime, path, options) {
    return new Response(Bun.file(path), {
        headers: {
            "Content-Type": parseContentType(path),
            "Cache-Control": `max-age=${options.ttl}, must-revalidate`,
            "Last-Modified": mtime.toUTCString(),
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
 * @property {string } public 静态文件查找路径，访问路径与文件路径映射目录;
 * 1. 多个路径映射其匹配顺序与定义顺序一致
 * 2. XXXX
 * @property {number} [ttl=10] 缓存时间, 默认 10 单位：秒
 * @property {string} [index="index.html"] 索引文件，默认 "index.html" 文件
 * 
 * @example 仅指定根路径
 * { public: "/data/htdocs/xxx" }
 */

/**
 * 创建静态文件服务器
 * @param {StaticServerOption} options
 * @return {ServerMux}
 */
export function createStaticServer(options) {
    options = Object.assign({}, { index: "index.html", handler: {}, ttl: 10 }, options)
    /**
     * 
     * @param {URL} url 
     * @param {Request} req 
     */
    const server = async function (url, req) {
        let path = resolve(options.public, url.pathname.substring(1))
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
        if (!isModified(stat.mtime, req)) // 文件未修改
            return handleNotModified(stat.mtime, options)
        return handleStaticFile(stat.mtime, path, options);
    };
    server.options = options;
    return server; 
}

