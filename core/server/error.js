/**
 * 
 * @param {Request} req 
 * @return {Promise<Response>}
 */
export async function defaultErrorHandler(req, err) {
    if (err instanceof HttpError) {
        console.warn(new Date(), `${req.method} ${req.url} - failed, respond with status=${err.status} code=${err.code} cause='${err.cause}'\n`, err)
        return new Response(JSON.stringify(err), {
            status: err.status,
            headers: { "content-type": "application/json" }
        })
    } else {
        console.error(new Date(), `${req.method} ${req.url} - failed, respond with status=500\n`, err)
        return new Response(JSON.stringify({
            "error": {"code": 10500, "desc": "unknown error"},
        }), {
            status: 500,
            headers: { "content-type": "application/json" }
        });
    }
}

/**
 * @typedef ErrorInfo
 * @property {number} code
 * @property {string} desc
 */

/**
 * 错误
 */
export class HttpError extends Error {
    /**
     * 
     * @param {number} code 
     * @param {string} desc 
     */
    constructor(desc, code, status, cause) {
        super(desc, {cause: cause})
        this.name = "HttpError"
        this.code = code
        this.status = status || 200
    }

    toString() {
        return `(${this.code}) ${this.desc}`
    }

    toJSON() {
        return {"error": {"code": this.code, "desc": this.message}};
    }
}
