/**
 * @callback ServerMux
 * @param {URL} url
 * @param {Request} req
 * @returns {Promise<Response>|Promise<any>}
 */

import { defaultFileHandler } from "./static_server.js"

/**
 * @param {ServerMux[]} mux
 * @param {Request} req 
 */
function doServe(mux) {
    return async function(req) {
        const url = new URL(req.url)
        for (let serve of mux) { // 依次执行各中间件
            let r = await serve(url, req)
            if (r instanceof Response) return r
        }
    }
}

/**
 * @typedef ServerOption
 * @property {string} [host="0.0.0.0"] 服务器监听地址
 * @property {string|number} [port=process.env.PORT || "3000"] 服务器监听端口
 */

/**
 * @param {ServerMux[]} mux
 * @param {ServerOption} options 
 */
export function serve(mux, options) {
    options.fetch = doServe(mux)
    Bun.serve(options)
}

