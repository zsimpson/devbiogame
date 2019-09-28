// Inspired by hyperscript, with no dependencies and a bit simpler
function z() {
    var a = arguments[0];
    var m = a.split(/(?=[\.#])/g);
    var e = document.createElement(m[0]);
    m.slice(1).forEach(function (i) {
        let term = i.substring(1);
        if(i[0] === '.') {
            e.className += ' ' + term;
        }
        else if(i[0] === '#') {
            e.setAttribute('id', term);
        }
    });
    for(var i=1; i<arguments.length; i++) {
        let a = arguments[i];
        if(typeof a === 'string') {
            e.appendChild(document.createTextNode(a));
        }
        else if(a instanceof Array) {
            for(let j=0; j<a.length; j++) {
                if(typeof a[j] !== 'undefined') {
                    e.appendChild(a[j]);
                }
            }
        }
        else if(a instanceof HTMLElement) {
            e.appendChild(a);
        }
        else if(a instanceof Object) {
            for(let key in a) {
                if(a.hasOwnProperty(key)) {
                    if(key == 'data') {
                        for(let d in a[key]) {
                            e.dataset[d] = a[key][d];
                        }
                    }
                    else {
                        e.setAttribute(key, a[key]);
                    }
                }
            }
        }
    }
    return e;
}

function timeSince(date) {
    let seconds = Math.floor((new Date()) / 1000 - date);
    let intervals = [
        [31536000, "year"],
        [2592000, "month"],
        [86400, "day"],
        [3600, "hour"],
        [60, "minute"],
        [1, "second"],
    ];
    for(let _i in intervals) {
        let i = intervals[_i];
        let interval = Math.floor(seconds / i[0]);
        if(interval >= 1 || i[0] == 1) {
            return interval + " " + i[1] + (interval > 1 ? "s" : "");
        }
    }
}
