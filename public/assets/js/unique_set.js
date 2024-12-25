/**
 * @callback CompareCallback
 * @param {T} a
 * @param {T} b
 * @returns {int} 将两个成员 a 与 b 进行比较，返回 0 表示二者相等；返回 >0 时表示 a > b；返回 <0 时表示 a < b;
 */


/**
 * 在有序集合中进行查找
 * @param {Array<T>} array 
 * @param {CompareCallback} pred 
 */
export function find(array, entry, pred) {
    let start = 0, end = array.length - 1, offset, result;
    do {
        offset = (start + end) >> 1;
        result = pred(array[offset], entry);
        if (result == 0) {
            return offset;
        } else if (result < 0) {
            start = offset + 1;
        } else {
            end = offset - 1;
        }
    } while(start <= end);
    return result < 0 ? offset + 1 : offset;
}

/**
 * 唯一容器（支持排序）
 */
export class UniqueSet extends Array {
    /**
     * @type {CompareCallback} 比较函数
     */
    #compare
    /**
    * @param {CompareCallback} 比较函数（若比较函数存在有序判定）
    * @param {Array<T>} init 初始数据
    */
    constructor(compare, init) {
        super();
        if (Array.isArray(compare)) {
            init = compare;
            compare = null;
        }
        if (!compare) {
            compare = function(a, b) {
                return a == b ? 0 : a < b ? -1 : 1;
            }
        }
        this.#compare = compare;
        if (init) for(let item of init) {
            this.append(item)
        }
    }
    append(v) {
        const index = find(this, v, this.#compare);
        if (this.#compare(this[index], v) == 0) {
            return;
        }
        this.splice(index, 0, v);
    }
    remove(v) {
        const index = find(this, v, this.#compare);
        if (this.#compare(this[index], v) != 0) {
            return;
        }
        this.splice(index, 1);
    }
}

/**
 * @callback EqualizerCallback
 * @param {T} a
 * @param {T} b
 * @returns {Boolean} 
 */

/**
 * 唯一容器（支持排序）
 */
export class UniqueArray extends Array {
    /**
     * @type {EqualizerCallback} 比较函数
     */
    #compare
    /**
    * @param {EqualizerCallback} 比较函数（若比较函数存在有序判定）
    * @param {Array<T>} init 初始数据
    */
    constructor(compare, init) {
        super();
        if (Array.isArray(compare)) {
            init = compare;
            compare = null;
        }
        if (!compare) {
            compare = function(a, b) {
                return a == b;
            }
        }
        this.#compare = compare;
        if (init) for(let item of init) {
            this.append(item)
        }
    }
    append(v) {
        const index = this.findIndex((x) => {
            return this.#compare(x, v);
        });
        if (index > -1) {
            return;
        }
        this.push(v);
    }
    remove(v) {
        const index = this.findIndex((x) => {
            return this.#compare(x, v);
        });
        if (index == -1) {
            return;
        }
        this.splice(index, 1);
    }
}

