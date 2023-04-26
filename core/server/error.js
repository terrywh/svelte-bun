export class HTTPError {
    /**
     * 
     * @param {number} status 
     * @param {number} code 
     * @param {string} info 
     * @param {*} extra 
     */
    constructor(status, code, info, extra) {
        this.status = status;
        this.code = code;
        this.info = info;
        this.extra = extra;
    }

    toJSON() {
        return {"error": {"code": this.code, "info": this.info}};
    }
}