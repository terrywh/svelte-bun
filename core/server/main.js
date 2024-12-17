import { defaultErrorHandler, HttpError } from "./error";

/**
 * @param {ServerMux[]} mux
 * @param {Request} req 
 */
function doServe(mux, options) {
    return async function(req) {
        const url = new URL(req.url)
        try {
            for (let serve of mux) { // 依次执行各中间件
                let r = await serve(url, req)
                if (r instanceof Response) return r;
                if (r instanceof Error) throw r;
            }
        } catch(ex) {
            return options.onerror(url, req, ex);
        }
        return options.onerror(url, req, new HttpError("route not found", 404, 404, "out of servers"));
    }
}

/**
 * @typedef ServerOption
 * @property {string} [host="0.0.0.0"] 服务器监听地址
 * @property {string|number} [port=process.env.PORT || "3000"] 服务器监听端口
 * @property {function} onerror 错误处理
 */

/**
 * @param {ServerMux[]} mux
 * @param {ServerOption} options 
 */
export function serve(mux, options) {
    options.onerror = options.onerror || defaultErrorHandler;
    options.fetch = doServe(mux, options)
    Bun.serve(options)
}
