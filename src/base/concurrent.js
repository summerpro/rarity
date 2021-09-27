

function sendRequest(urls, max, callback) {
    let allUrls = [...urls],
        i = 0,
        fetchArr = [];

    function doFetch() {
        // 处理边界的情况
        if (i === allUrls.length) {
            return Promise.resolve();
        }
        //每次调用出去 一个 url， 放入fetch中
        let one = fetch(allUrls[i++]);
        // 将此promise的状态保存在fetchArr中， 执行完之后 从数组中删除。
        let result = one.then(() => fetchArr.splice(fetchArr.indexOf(result), 1));
        result.push(fetchArr);

        // 数量不够就重复调用doFetch， 够了的话就比较
        let p = Promise.resolve();
        if (fetchArr.length >= max) {
            p = Promise.race(fetchArr);
        }
        return p.then(() => doFetch())
    }
    // 最后用all 处理剩余数组中的，等处理完再执行callback
    return doFetch().then(() => Promise.all(fetchArr)).then(() => {
        callback();
    })
}

module.exports = sendRequest;