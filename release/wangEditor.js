(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(global.wangEditor = factory());
}(this, (function () { 'use strict';

/*
    poly-fill
*/

var polyfill = function () {

    // Object.assign
    if (typeof Object.assign != 'function') {
        Object.assign = function (target, varArgs) {
            // .length of function is 2
            if (target == null) {
                // TypeError if undefined or null
                throw new TypeError('Cannot convert undefined or null to object');
            }

            var to = Object(target);

            for (var index = 1; index < arguments.length; index++) {
                var nextSource = arguments[index];

                if (nextSource != null) {
                    // Skip over if undefined or null
                    for (var nextKey in nextSource) {
                        // Avoid bugs when hasOwnProperty is shadowed
                        if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
                            to[nextKey] = nextSource[nextKey];
                        }
                    }
                }
            }
            return to;
        };
    }

    // IE 中兼容 Element.prototype.matches
    if (!Element.prototype.matches) {
        Element.prototype.matches = Element.prototype.matchesSelector || Element.prototype.mozMatchesSelector || Element.prototype.msMatchesSelector || Element.prototype.oMatchesSelector || Element.prototype.webkitMatchesSelector || function (s) {
            var matches = (this.document || this.ownerDocument).querySelectorAll(s),
                i = matches.length;
            while (--i >= 0 && matches.item(i) !== this) {}
            return i > -1;
        };
    }
};

/*
    DOM 操作 API
*/

// 根据 html 代码片段创建 dom 对象
function createElemByHTML(html) {
    var div = void 0;
    div = document.createElement('div');
    div.innerHTML = html;
    return div.children;
}

// 是否是 DOM List
function isDOMList(selector) {
    if (!selector) {
        return false;
    }
    if (selector instanceof HTMLCollection || selector instanceof NodeList) {
        return true;
    }
    return false;
}

// 封装 document.querySelectorAll
function querySelectorAll(selector) {
    var result = document.querySelectorAll(selector);
    if (isDOMList(result)) {
        return result;
    } else {
        return [result];
    }
}

// 记录所有的事件绑定
var eventList = [];

// 创建构造函数
function DomElement(selector) {
    if (!selector) {
        return;
    }

    // selector 本来就是 DomElement 对象，直接返回
    if (selector instanceof DomElement) {
        return selector;
    }

    this.selector = selector;
    var nodeType = selector.nodeType;

    // 根据 selector 得出的结果（如 DOM，DOM List）
    var selectorResult = [];
    if (nodeType === 9) {
        // document 节点
        selectorResult = [selector];
    } else if (nodeType === 1) {
        // 单个 DOM 节点
        selectorResult = [selector];
    } else if (isDOMList(selector) || selector instanceof Array) {
        // DOM List 或者数组
        selectorResult = selector;
    } else if (typeof selector === 'string') {
        // 字符串
        selector = selector.replace('/\n/mg', '').trim();
        if (selector.indexOf('<') === 0) {
            // 如 <div>
            selectorResult = createElemByHTML(selector);
        } else {
            // 如 #id .class
            selectorResult = querySelectorAll(selector);
        }
    }

    var length = selectorResult.length;
    if (!length) {
        // 空数组
        return this;
    }

    // 加入 DOM 节点
    var i = void 0;
    for (i = 0; i < length; i++) {
        this[i] = selectorResult[i];
    }
    this.length = length;
}

// 修改原型
DomElement.prototype = {
    constructor: DomElement,

    // 类数组，forEach
    forEach: function forEach(fn) {
        var i = void 0;
        for (i = 0; i < this.length; i++) {
            var elem = this[i];
            var result = fn.call(elem, elem, i);
            if (result === false) {
                break;
            }
        }
        return this;
    },

    // clone
    clone: function clone(deep) {
        var cloneList = [];
        this.forEach(function (elem) {
            cloneList.push(elem.cloneNode(!!deep));
        });
        return $(cloneList);
    },

    // 获取第几个元素
    get: function get(index) {
        var length = this.length;
        if (index >= length) {
            index = index % length;
        }
        return $(this[index]);
    },

    // 第一个
    first: function first() {
        return this.get(0);
    },

    // 最后一个
    last: function last() {
        var length = this.length;
        return this.get(length - 1);
    },

    // 绑定事件
    on: function on(type, selector, fn) {
        // selector 不为空，证明绑定事件要加代理
        if (!fn) {
            fn = selector;
            selector = null;
        }

        // type 是否有多个
        var types = [];
        types = type.split(/\s+/);

        return this.forEach(function (elem) {
            types.forEach(function (type) {
                if (!type) {
                    return;
                }

                // 记录下，方便后面解绑
                eventList.push({
                    elem: elem,
                    type: type,
                    fn: fn
                });

                if (!selector) {
                    // 无代理
                    elem.addEventListener(type, fn);
                    return;
                }

                // 有代理
                elem.addEventListener(type, function (e) {
                    var target = e.target;
                    if (target.matches(selector)) {
                        fn.call(target, e);
                    }
                });
            });
        });
    },

    // 取消事件绑定
    off: function off(type, fn) {
        return this.forEach(function (elem) {
            elem.removeEventListener(type, fn);
        });
    },

    // 获取/设置 属性
    attr: function attr(key, val) {
        if (val == null) {
            // 获取值
            return this[0].getAttribute(key);
        } else {
            // 设置值
            return this.forEach(function (elem) {
                elem.setAttribute(key, val);
            });
        }
    },

    //移除 属性
    removeAttr: function removeAttr(key) {
        this.forEach(function (elem) {
            elem.removeAttribute(key);
        });
    },

    getClass: function getClass() {
        if (this[0].className) {
            return this[0].className || '';
        }
    },
    // 添加 class
    addClass: function addClass(className) {
        if (!className) {
            return this;
        }
        return this.forEach(function (elem) {
            var arr = void 0;
            if (elem.className) {
                // 解析当前 className 转换为数组
                arr = elem.className.split(/\s/);
                arr = arr.filter(function (item) {
                    return !!item.trim();
                });
                // 添加 class
                if (arr.indexOf(className) < 0) {
                    arr.push(className);
                }
                // 修改 elem.class
                elem.className = arr.join(' ');
            } else {
                elem.className = className;
            }
        });
    },

    // 删除 class
    removeClass: function removeClass(className) {
        if (!className) {
            return this;
        }
        return this.forEach(function (elem) {
            var arr = void 0;
            if (elem.className) {
                // 解析当前 className 转换为数组
                arr = elem.className.split(/\s/);
                arr = arr.filter(function (item) {
                    item = item.trim();
                    // 删除 class
                    if (!item || item === className) {
                        return false;
                    }
                    return true;
                });
                // 修改 elem.class
                elem.className = arr.join(' ');
            }
        });
    },

    // 读取/修改 css
    css: function css(key, val) {
        //val为undefined时 读取属性
        if (val === undefined) {
            var styleString = (this[0].getAttribute('style') || '').trim();
            var attrValue = '',
                attrArr = styleString.split(';');
            attrArr.forEach(function (item) {
                var arr = item.split(':').map(function (i) {
                    return i.trim();
                });
                if (arr.length == 2 && arr[0] && arr[1] && arr[0].trim() == key) {
                    attrValue = arr[1].trim();
                }
            });
            return attrValue;
        }
        //添加修改属性
        var currentStyle = '';
        if (val) {
            currentStyle = key + ':' + val + ';';
        }
        return this.forEach(function (elem) {
            var style = (elem.getAttribute('style') || '').trim();
            var styleArr = void 0,
                resultArr = [];
            if (style) {
                // 将 style 按照 ; 拆分为数组
                styleArr = style.split(';');
                styleArr.forEach(function (item) {
                    // 对每项样式，按照 : 拆分为 key 和 value
                    var arr = item.split(':').map(function (i) {
                        return i.trim();
                    });
                    if (arr.length === 2 && arr[0] && arr[1]) {
                        resultArr.push(arr[0] + ':' + arr[1]);
                    }
                });
                // 替换或者新增
                resultArr = resultArr.map(function (item) {
                    if (item.indexOf(key) === 0) {
                        return currentStyle;
                    } else {
                        return item;
                    }
                });
                if (resultArr.indexOf(currentStyle) < 0) {
                    resultArr.push(currentStyle);
                }
                // 结果
                if (resultArr.length == 1 && resultArr[0] == '') {
                    elem.removeAttribute('style');
                } else {
                    elem.setAttribute('style', resultArr.join('; '));
                }
            } else {
                // style 无值
                elem.setAttribute('style', currentStyle);
            }
        });
    },

    // 显示
    show: function show() {
        return this.css('display', 'block');
    },

    // 隐藏
    hide: function hide() {
        return this.css('display', 'none');
    },

    // 获取子节点
    children: function children() {
        var elem = this[0];
        if (!elem) {
            return null;
        }

        return $(elem.children);
    },

    // 获取子节点（包括文本节点）
    childNodes: function childNodes() {
        var elem = this[0];
        if (!elem) {
            return null;
        }

        return $(elem.childNodes);
    },

    // 增加子节点
    append: function append($children) {
        return this.forEach(function (elem) {
            $children.forEach(function (child) {
                elem.appendChild(child);
            });
        });
    },

    // 移除当前节点
    remove: function remove() {
        return this.forEach(function (elem) {
            if (elem.remove) {
                elem.remove();
            } else {
                var parent = elem.parentElement;
                parent && parent.removeChild(elem);
            }
        });
    },

    // 是否包含某个子节点
    isContain: function isContain($child) {
        var elem = this[0];
        var child = $child[0];
        return elem.contains(child);
    },

    // 尺寸数据
    getSizeData: function getSizeData() {
        var elem = this[0];
        return elem.getBoundingClientRect(); // 可得到 bottom height left right top width 的数据
    },

    // 封装 nodeName
    getNodeName: function getNodeName() {
        var elem = this[0];
        return elem.nodeName;
    },

    getNodeType: function getNodeType() {
        var elem = this[0] || this.selector;
        return elem.nodeType;
    },

    // 从当前元素查找
    find: function find(selector) {
        var elem = this[0];
        return $(elem.querySelectorAll(selector));
    },

    // 获取当前元素的 text
    text: function text(val) {
        if (!val) {
            // 获取 text
            var elem = this[0];
            return elem.innerHTML.replace(/<.*?>/g, function () {
                return '';
            });
        } else {
            // 设置 text
            return this.forEach(function (elem) {
                elem.innerHTML = val;
            });
        }
    },

    // 获取 html
    html: function html(value) {
        var elem = this[0];
        if (value == null) {
            return elem.innerHTML;
        } else {
            elem.innerHTML = value;
            return this;
        }
    },

    // 获取 value
    val: function val() {
        var elem = this[0];
        return elem.value.trim();
    },

    // focus
    focus: function focus() {
        return this.forEach(function (elem) {
            elem.focus();
        });
    },

    // parent
    parent: function parent() {
        var elem = this[0] || this.selector;
        return $(elem.parentElement);
    },

    // parentUntil 找到符合 selector 的父节点
    parentUntil: function parentUntil(selector, _currentElem) {
        var results = document.querySelectorAll(selector);
        var length = results.length;
        if (!length) {
            // 传入的 selector 无效
            return null;
        }

        var elem = _currentElem || this[0];
        if (elem.nodeName === 'BODY') {
            return null;
        }

        var parent = elem.parentElement;
        var i = void 0;
        for (i = 0; i < length; i++) {
            if (parent === results[i]) {
                // 找到，并返回
                return $(parent);
            }
        }

        // 继续查找
        return this.parentUntil(selector, parent);
    },

    // 判断两个 elem 是否相等
    equal: function equal($elem) {
        if ($elem.nodeType === 1) {
            return this[0] === $elem;
        } else {
            return this[0] === $elem[0];
        }
    },

    // 将该元素插入到某个元素前面
    insertBefore: function insertBefore(selector) {
        var $referenceNode = $(selector);
        var referenceNode = $referenceNode[0];
        if (!referenceNode) {
            return this;
        }
        return this.forEach(function (elem) {
            var parent = referenceNode.parentNode;
            parent.insertBefore(elem, referenceNode);
        });
    },

    // 将该元素插入到某个元素后面
    insertAfter: function insertAfter(selector) {
        var $referenceNode = $(selector);
        var referenceNode = $referenceNode[0];
        if (!referenceNode) {
            return this;
        }
        return this.forEach(function (elem) {
            var parent = referenceNode.parentNode;
            if (parent.lastChild === referenceNode) {
                // 最后一个元素
                parent.appendChild(elem);
            } else {
                // 不是最后一个元素
                parent.insertBefore(elem, referenceNode.nextSibling);
            }
        });
    }

    // new 一个对象
};function $(selector) {
    return new DomElement(selector);
}

// 解绑所有事件，用于销毁编辑器
$.offAll = function () {
    eventList.forEach(function (item) {
        var elem = item.elem;
        var type = item.type;
        var fn = item.fn;
        // 解绑
        elem.removeEventListener(type, fn);
    });
};

/*
    配置信息
*/

var config = {

    // 默认菜单配置
    menus: ['bold', 'head', 'subhead', 'justify', 'quote', 'splitLine', 'image', 'video', 'audio', 'link', 'justifyLeft', 'justifyCenter', 'justifyRight', 'undo', 'redo'],

    fontNames: ['宋体', '微软雅黑', 'Arial', 'Tahoma', 'Verdana'],

    colors: ['#000000', '#eeece0', '#1c487f', '#4d80bf', '#c24f4a', '#8baa4a', '#7b5ba1', '#46acc8', '#f9963b', '#ffffff'],

    // // 语言配置
    // lang: {
    //     '设置标题': 'title',
    //     '正文': 'p',
    //     '链接文字': 'link text',
    //     '链接': 'link',
    //     '插入': 'insert',
    //     '创建': 'init'
    // },

    // 表情
    emotions: [{
        // tab 的标题
        title: '默认',
        // type -> 'emoji' / 'image'
        type: 'image',
        // content -> 数组
        content: [{
            alt: '[坏笑]',
            src: 'http://img.t.sinajs.cn/t4/appstyle/expression/ext/normal/50/pcmoren_huaixiao_org.png'
        }, {
            alt: '[舔屏]',
            src: 'http://img.t.sinajs.cn/t4/appstyle/expression/ext/normal/40/pcmoren_tian_org.png'
        }, {
            alt: '[污]',
            src: 'http://img.t.sinajs.cn/t4/appstyle/expression/ext/normal/3c/pcmoren_wu_org.png'
        }]
    }, {
        // tab 的标题
        title: '新浪',
        // type -> 'emoji' / 'image'
        type: 'image',
        // content -> 数组
        content: [{
            src: 'http://img.t.sinajs.cn/t35/style/images/common/face/ext/normal/7a/shenshou_thumb.gif',
            alt: '[草泥马]'
        }, {
            src: 'http://img.t.sinajs.cn/t35/style/images/common/face/ext/normal/60/horse2_thumb.gif',
            alt: '[神马]'
        }, {
            src: 'http://img.t.sinajs.cn/t35/style/images/common/face/ext/normal/bc/fuyun_thumb.gif',
            alt: '[浮云]'
        }]
    }, {
        // tab 的标题
        title: 'emoji',
        // type -> 'emoji' / 'image'
        type: 'emoji',
        // content -> 数组
        content: '😀 😃 😄 😁 😆 😅 😂 😊 😇 🙂 🙃 😉 😓 😪 😴 🙄 🤔 😬 🤐'.split(/\s/)
    }],

    // 编辑区域的 z-index
    zIndex: 10000,

    // 是否开启 debug 模式（debug 模式下错误会 throw error 形式抛出）
    debug: false,

    // 插入链接时候的格式校验
    linkCheck: function linkCheck(text, link) {
        // text 是插入的文字
        // link 是插入的链接
        return true; // 返回 true 即表示成功
        // return '校验失败' // 返回字符串即表示失败的提示信息
    },

    // 插入网络图片的校验
    linkImgCheck: function linkImgCheck(src) {
        // src 即图片的地址
        return true; // 返回 true 即表示成功
        // return '校验失败'  // 返回字符串即表示失败的提示信息
    },

    // 粘贴过滤样式，默认开启
    pasteFilterStyle: true,

    // 粘贴内容时，忽略图片。默认关闭
    pasteIgnoreImg: false,

    // 对粘贴的文字进行自定义处理，返回处理后的结果。编辑器会将处理后的结果粘贴到编辑区域中。
    // IE 暂时不支持
    pasteTextHandle: function pasteTextHandle(content) {
        // content 即粘贴过来的内容（html 或 纯文本），可进行自定义处理然后返回
        return content;
    },

    // onchange 事件
    // onchange: function (html) {
    //     // html 即变化之后的内容
    //     console.log(html)
    // },

    // 是否显示添加网络图片的 tab
    showLinkImg: true,

    // 插入网络图片的回调
    linkImgCallback: function linkImgCallback(url) {
        // console.log(url)  // url 即插入图片的地址
    },

    // 默认上传图片 max size: 5M
    uploadImgMaxSize: 5 * 1024 * 1024,

    // 配置一次最多上传几个图片
    // uploadImgMaxLength: 5,

    // 上传图片，是否显示 base64 格式
    uploadImgShowBase64: false,

    // 上传图片，server 地址（如果有值，则 base64 格式的配置则失效）
    // uploadImgServer: '/upload',

    // 自定义配置 filename
    uploadFileName: '',

    // 上传图片的自定义参数
    uploadImgParams: {
        // token: 'abcdef12345'
    },

    // 上传图片的自定义header
    uploadImgHeaders: {
        // 'Accept': 'text/x-json'
    },

    // 配置 XHR withCredentials
    withCredentials: false,

    // 自定义上传图片超时时间 ms
    uploadImgTimeout: 10000,

    // 上传图片 hook 
    uploadImgHooks: {
        // customInsert: function (insertLinkImg, result, editor) {
        //     console.log('customInsert')
        //     // 图片上传并返回结果，自定义插入图片的事件，而不是编辑器自动插入图片
        //     const data = result.data1 || []
        //     data.forEach(link => {
        //         insertLinkImg(link)
        //     })
        // },
        before: function before(xhr, editor, files) {
            // 图片上传之前触发

            // 如果返回的结果是 {prevent: true, msg: 'xxxx'} 则表示用户放弃上传
            // return {
            //     prevent: true,
            //     msg: '放弃上传'
            // }
        },
        success: function success(xhr, editor, result) {
            // 图片上传并返回结果，图片插入成功之后触发
        },
        fail: function fail(xhr, editor, result) {
            // 图片上传并返回结果，但图片插入错误时触发
        },
        error: function error(xhr, editor) {
            // 图片上传出错时触发
        },
        timeout: function timeout(xhr, editor) {
            // 图片上传超时时触发
        }
    },

    // 是否上传七牛云，默认为 false
    qiniu: false,

    uploadConfig: {
        image: null,
        privateFile: null,
        video: null
    },

    //第三方搜索会员方法
    userSearch: function userSearch(params) {
        return new Promise(function (res) {
            setTimeout(function () {
                res([{
                    id: 0,
                    fullHeadImage: 'http://image.kolocdn.com/o_1c3k1l4vp1ujq19pfmijgho1sg6e.jpg',
                    nickName: 'jj--kk',
                    singleIntroduction: '一句话介绍',
                    shareUrl: "http://m.qa.ikolo.me/ssr/#/user/11858"
                }, {
                    id: 1,
                    fullHeadImage: 'http://image.kolocdn.com/o_1c3k1l4vp1ujq19pfmijgho1sg6e.jpg',
                    nickName: 'pp',
                    singleIntroduction: '一句话介绍',
                    shareUrl: "http://m.qa.ikolo.me/ssr/#/user/11858"
                }, {
                    id: 2,
                    fullHeadImage: 'http://image.kolocdn.com/o_1c3k1l4vp1ujq19pfmijgho1sg6e.jpg',
                    nickName: 'ccc',
                    singleIntroduction: '一句话介绍',
                    shareUrl: "http://m.qa.ikolo.me/ssr/#/user/11858"
                }, {
                    id: 3,
                    fullHeadImage: 'http://image.kolocdn.com/o_1c3k1l4vp1ujq19pfmijgho1sg6e.jpg',
                    nickName: 'ddd',
                    singleIntroduction: '一句话介绍',
                    shareUrl: "http://m.qa.ikolo.me/ssr/#/user/11858"
                }]);
            }, 10);
        });
    },

    //第三方搜索工作室方法
    roomSearch: function roomSearch(params) {
        return new Promise(function (res) {
            setTimeout(function () {
                res([{
                    id: 0,
                    fullHeadImage: 'http://image.kolocdn.com/o_1c3k1l4vp1ujq19pfmijgho1sg6e.jpg',
                    nickName: 'jj--kk',
                    singleIntroduction: '一句话介绍',
                    shareUrl: "http://m.qa.ikolo.me/ssr/#/user/11858"
                }, {
                    id: 1,
                    fullHeadImage: 'http://image.kolocdn.com/o_1c3k1l4vp1ujq19pfmijgho1sg6e.jpg',
                    nickName: 'pp',
                    singleIntroduction: '一句话介绍',
                    shareUrl: "http://m.qa.ikolo.me/ssr/#/user/11858"
                }, {
                    id: 2,
                    fullHeadImage: 'http://image.kolocdn.com/o_1c3k1l4vp1ujq19pfmijgho1sg6e.jpg',
                    nickName: 'ccc',
                    singleIntroduction: '一句话介绍',
                    shareUrl: "http://m.qa.ikolo.me/ssr/#/user/11858"
                }, {
                    id: 3,
                    fullHeadImage: '',
                    nickName: 'ddd',
                    singleIntroduction: '一句话介绍',
                    shareUrl: "http://m.qa.ikolo.me/ssr/#/user/11858"
                }]);
            }, 200);
        });
    }

};

/*
    工具
*/

// 和 UA 相关的属性
var UA = {
    _ua: navigator.userAgent,

    // 是否 webkit
    isWebkit: function isWebkit() {
        var reg = /webkit/i;
        return reg.test(this._ua);
    },

    // 是否 IE
    isIE: function isIE() {
        return 'ActiveXObject' in window;
    }

    // 遍历对象
};function objForEach(obj, fn) {
    var key = void 0,
        result = void 0;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) {
            result = fn.call(obj, key, obj[key]);
            if (result === false) {
                break;
            }
        }
    }
}

// 遍历类数组
function arrForEach(fakeArr, fn) {
    var i = void 0,
        item = void 0,
        result = void 0;
    var length = fakeArr.length || 0;
    for (i = 0; i < length; i++) {
        item = fakeArr[i];
        result = fn.call(fakeArr, item, i);
        if (result === false) {
            break;
        }
    }
}

// 获取随机数
function getRandom(prefix) {
    return prefix + Math.random().toString().slice(2);
}

// 替换 html 特殊字符
function replaceHtmlSymbol(html) {
    if (html == null) {
        return '';
    }
    return html.replace(/<br>/gm, '').replace(/</gm, '&lt;').replace(/>/gm, '&gt;').replace(/"/gm, '&quot;');
}

// 返回百分比的格式


// 判断是不是 function
function isFunction(fn) {
    return typeof fn === 'function';
}

/*
    bold-menu
*/
// 构造函数
function Bold(editor) {
    this.editor = editor;
    this.$elem = $('<div class="w-e-menu">\n            <i title="\u52A0\u7C97" class="w-e-icon-bold"></i>\n        </div>');
    this.type = 'click';

    // 当前是否 active 状态
    this._active = false;
}

// 原型
Bold.prototype = {
    constructor: Bold,

    // 点击事件
    onClick: function onClick(e) {
        // 点击菜单将触发这里

        var editor = this.editor;
        var isSeleEmpty = editor.selection.isSelectionEmpty();

        if (isSeleEmpty) {
            // 选区是空的，插入并选中一个“空白”
            editor.selection.createEmptyRange();
        }

        // 执行 bold 命令
        editor.cmd.do('bold');

        if (isSeleEmpty) {
            // 需要将选取折叠起来
            editor.selection.collapseRange();
            editor.selection.restoreSelection();
        }
    },

    // 试图改变 active 状态
    tryChangeActive: function tryChangeActive(e) {
        var editor = this.editor;
        var $elem = this.$elem;
        if (editor.cmd.queryCommandState('bold')) {
            this._active = true;
            $elem.addClass('w-e-active');
        } else {
            this._active = false;
            $elem.removeClass('w-e-active');
        }
    }
};

/*
    menu - header
*/
// 构造函数
function Head(editor) {
    this.editor = editor;
    this.$elem = $('<div class="w-e-menu"><i title="主标题" class="w-e-icon-h1"></i></div>');
    this.type = 'click';

    // 当前是否 active 状态
    this._active = false;
}

// 原型
Head.prototype = {
    constructor: Head,

    onClick: function onClick(e) {
        //
        if (this._active) {
            this._command('<p>');
        } else {
            this._command('<h1>');
        }
    },

    // 执行命令
    _command: function _command(value) {
        var editor = this.editor;

        editor.cmd.do('formatBlock', value);
    },

    // 试图改变 active 状态
    tryChangeActive: function tryChangeActive(e) {
        var editor = this.editor;
        var $elem = this.$elem;
        var reg = /^h1/i;
        var cmdValue = editor.cmd.queryCommandValue('formatBlock');
        if (reg.test(cmdValue)) {
            this._active = true;
            $elem.addClass('w-e-active');
        } else {
            this._active = false;
            $elem.removeClass('w-e-active');
        }
    }
};

/*
    menu - header
*/
// 构造函数
function Subhead(editor) {
    this.editor = editor;
    this.$elem = $('<div class="w-e-menu"><i title="副标题" class="w-e-icon-h2"></i></div>');
    this.type = 'click';

    // 当前是否 active 状态
    this._active = false;
}

// 原型
Subhead.prototype = {
    constructor: Subhead,

    onClick: function onClick(e) {
        //
        if (this._active) {
            this._command('<p>');
        } else {
            this._command('<h2>');
        }
    },

    // 执行命令
    _command: function _command(value) {
        var editor = this.editor;

        // const $selectionElem = editor.selection.getSelectionContainerElem()
        // if (editor.$textElem.equal($selectionElem)) {
        //     // 不能选中多行来设置标题，否则会出现问题
        //     // 例如选中的是 <p>xxx</p><p>yyy</p> 来设置标题，设置之后会成为 <h1>xxx<br>yyy</h1> 不符合预期
        //     return
        // }

        editor.cmd.do('formatBlock', value);
    },

    // 试图改变 active 状态
    tryChangeActive: function tryChangeActive(e) {
        var editor = this.editor;
        var $elem = this.$elem;
        var reg = /^h2/i;
        var cmdValue = editor.cmd.queryCommandValue('formatBlock');
        if (reg.test(cmdValue)) {
            this._active = true;
            $elem.addClass('w-e-active');
        } else {
            this._active = false;
            $elem.removeClass('w-e-active');
        }
    }
};

/**
 *  分割线 splitline
 */

function SplitLine(editor) {
    this.editor = editor;
    this.$elem = $('<div class="w-e-menu">\n            <i title="\u5206\u5272\u7EBF" class="w-e-icon-split"></i>\n        </div>');
    this.type = 'click';

    //是否选中分割线
    this._active = false;
}

SplitLine.prototype = {
    constructor: SplitLine,

    //点击事件
    onClick: function onClick(e) {
        //
        this._createinsertDom();
    },

    //创建新的分割线
    _createinsertDom: function _createinsertDom() {
        var editor = this.editor;
        var html = '<div class="split" contenteditable="false"></div><p><br></p>';

        editor.cmd.do('insertHTML', html);
    }
};

/*
    替换多语言
 */

var replaceLang = function (editor, str) {
    var langArgs = editor.config.langArgs || [];
    var result = str;

    langArgs.forEach(function (item) {
        var reg = item.reg;
        var val = item.val;

        if (reg.test(result)) {
            result = result.replace(reg, function () {
                return val;
            });
        }
    });

    return result;
};

/*
    menu - link
*/
// 构造函数
function Link(editor) {
    this.editor = editor;
    this.$elem = $('<div class="w-e-menu"><i class="w-e-icon-link"></i></div>');
    this.type = 'panel';

    // 当前是否 active 状态
    this._active = false;
}

// 原型
Link.prototype = {
    constructor: Link,

    // 点击事件
    onClick: function onClick(e) {
        var editor = this.editor;
        var $linkelem = void 0;

        if (this._active) {
            // 当前选区在链接里面
            $linkelem = editor.selection.getSelectionContainerElem();
            if (!$linkelem) {
                return;
            }
            // 将该元素都包含在选取之内，以便后面整体替换
            editor.selection.createRangeByElem($linkelem);
            editor.selection.restoreSelection();
            // 显示 panel
            this._createPanel($linkelem.text(), $linkelem.attr('href'));
        } else {
            // 当前选区不在链接里面
            if (editor.selection.isSelectionEmpty()) {
                // 选区是空的，未选中内容
                this._createPanel('', '');
            } else {
                // 选中内容了
                this._createPanel(editor.selection.getSelectionText(), '');
            }
        }
    },

    // 创建 panel
    _createPanel: function _createPanel(text, link) {
        var _this = this;

        // panel 中需要用到的id
        var editor = this.editor;
        // console.log(editor, editor.config)
        var userSearch = editor.config.userSearch;
        var roomSearch = editor.config.roomSearch;
        var containerId = editor.toolbarSelector;

        var dialogId = getRandom('link-dialog');
        var linkId = getRandom('add-linkId');
        var inputLinkId = getRandom('input-link');
        var inputTextId = getRandom('input-text');
        var btnOkId = getRandom('btn-ok');

        var searchList = getRandom('search-list');

        var userBtnId = getRandom('user-btn');
        var courseBtnId = getRandom('course-btn');

        var searchUserlinkId = getRandom('search-link-key0');
        var searchUserBtn = getRandom('search-btn0');
        var searchRoomlinkId = getRandom('search-link-key1');
        var searchRoomBtn = getRandom('search-btn1');

        var template = '\n            <div class="kolo-link">\n                <div class="link-container">\n                    <h3>\u63D2\u5165\u94FE\u63A5</h3>\n                    <div class="link">\n                        <p>\n                            <span>T</span>\n                            <input type="text" placeholder="\u8F93\u5165\u94FE\u63A5\u6587\u672C" id="' + inputTextId + '"/>\n                        </p>\n                        <p>\n                            <span><i class="w-e-icon-link"></i></span>\n                            <input type="text" placeholder="\u8F93\u5165\u94FE\u63A5\u5730\u5740" id="' + inputLinkId + '"/>\n                        </p>\n                    </div>\n                    <div class="other-link">\n                        <p>\n                            <b>\u5185\u90E8\u94FE\u63A5\uFF1A</b>\n                            <span id="' + userBtnId + '">\u4E2A\u4EBA\u4E3B\u9875</span>  |  \n                            <span id="' + courseBtnId + '">\u8BFE\u7A0B\u5361</span>\n                        </p>\n                        <div id="' + searchList + '" class="other-link-content">\n                            <div class="search-box ' + userBtnId + '">\n                                <div class="status-box">\n                                    <img class="search" id="' + searchUserBtn + '" src="http://image.kolocdn.com/FoKx9in6OwMaaNwaN8OlcH7WzYw8" />\n                                </div>\n                                <input type="text" placeholder="\u641C\u7D22\u7528\u6237" id="' + searchUserlinkId + '"/>\n                            </div>\n                            <div class="search-box ' + courseBtnId + '">\n                                <div class="status-box">\n                                    <img class="search" id="' + searchRoomBtn + '" src="http://image.kolocdn.com/FoKx9in6OwMaaNwaN8OlcH7WzYw8" />\n                                </div>\n                                <input type="text" placeholder="\u641C\u7D22\u5DE5\u4F5C\u5BA4" id="' + searchRoomlinkId + '"/>\n                            </div>\n                            <div class="' + searchList + ' search-list"></div>\n                        </div>\n                    </div>\n                    <div class="w-e-up-btn">\n                        <button id="' + btnOkId + '">\u786E\u5B9A</button>\n                    </div>\n                    <i id="' + linkId + '" class="w-e-icon-close">\xD7</i>\n                </div>\n            </div>';

        //替换多语言        
        template = replaceLang(editor, template);

        //
        var dialog = document.createElement('div');
        dialog.className = 'kolo-e-dialog';
        dialog.id = dialogId;
        dialog.innerHTML = template;

        //添加弹窗
        document.querySelector(containerId).appendChild(dialog);

        //初始化输入值
        document.querySelector('#' + inputTextId).value = text;
        document.querySelector('#' + inputLinkId).value = link;
        var linkInfo = {
            type: 0,
            text: text,
            link: link
        };
        //关闭弹窗     
        document.querySelector('#' + linkId).addEventListener('click', function (e) {
            e.stopPropagation();
            var dom = document.querySelector('#' + dialogId);
            dom.parentNode.removeChild(dom);
        });

        //添加链接
        document.querySelector('#' + btnOkId).addEventListener('click', function (e) {
            e.stopPropagation();
            linkInfo.text = document.querySelector('#' + inputTextId).value;
            linkInfo.link = document.querySelector('#' + inputLinkId).value;

            // console.log(linkInfo.type, 'type', JSON.stringify(linkInfo))
            if (linkInfo.type == 0) {
                //添加文本链接
                _this._insertLink(linkInfo.text, linkInfo.link);
            } else if (linkInfo.type == 1) {
                //添加卡片链接
                _this._insertCardLink(linkInfo.text, linkInfo.subText, linkInfo.link, linkInfo.type, linkInfo.head);
            } else if (linkInfo.type == 2) {
                _this._insertCardLink(linkInfo.text, linkInfo.subText, linkInfo.link, linkInfo.type, linkInfo.head);
            }
            setTimeout(function () {
                var dom = document.querySelector('#' + dialogId);
                dom.parentNode.removeChild(dom);
            });
        });

        var dropListDom = document.querySelector('#' + searchList);
        var dropListContent = document.querySelector('.' + searchList);
        var dropListUserDom = document.querySelector('.' + userBtnId);
        var dropListCourseDom = document.querySelector('.' + courseBtnId);

        //弹窗显示控制
        dialog.addEventListener('click', function (e) {
            e.stopPropagation();
            if (dropListDom.style.display == 'block') {
                dropListDom.style.display = 'none';
                if (linkInfo.type == 1 && !linkInfo.head) {
                    linkInfo.type = 0;
                    document.querySelector('#' + userBtnId).className = '';
                }
                if (linkInfo.type == 2 && !linkInfo.subText) {
                    linkInfo.type = 0;
                    document.querySelector('#' + courseBtnId).className = '';
                }
            }
        });
        dropListDom.addEventListener('click', function (e) {
            e.stopPropagation();
        });

        //弹窗
        function addNewLinkInfo() {
            document.querySelector('#' + inputTextId).value = linkInfo.text;
            document.querySelector('#' + inputLinkId).value = linkInfo.link;
            dropListDom.style.display = 'none';
        }

        //搜索个人主页
        document.querySelector('#' + userBtnId).addEventListener('click', function (e) {
            e.stopPropagation();

            dropListContent.innerHTML = '';
            dropListDom.style.display = 'none';
            document.querySelector('#' + courseBtnId).className = '';
            if (dropListDom.style.display == 'block') {
                dropListDom.style.display = 'none';
                document.querySelector('#' + userBtnId).className = '';
                linkInfo.type = 0;
                return;
            }
            linkInfo.type = 1;
            document.querySelector('#' + userBtnId).className = 'actived';
            dropListDom.style.display = 'block';
            dropListUserDom.style.display = 'block';
            dropListCourseDom.style.display = 'none';

            //
            var params = { pageIndex: 1, pageSize: 10, key: '' },
                list = [],
                searchDom = document.querySelector('#' + searchUserlinkId);
            searchDom.value = '';

            //输入检查
            searchDom.addEventListener('input', function (e) {
                e.stopPropagation();
                params.key = searchDom.value;
                params.pageIndex = 1;
                userSearch(params).then(function (res) {
                    if (res) {
                        list = res;
                        _this.searchListDomCreated(list, dropListContent, linkInfo, addNewLinkInfo);
                    }
                });
            });
            //点击搜索
            document.querySelector('#' + searchUserBtn).addEventListener('click', function (e) {
                e.stopPropagation();
                if (params.pageIndex * params.pageSize > list.length) {
                    return;
                } else {
                    params.pageIndex++;
                    userSearch(params).then(function (res) {
                        if (res) {
                            list = list.concat(res);
                            _this.searchListDomCreated(list, dropListContent, linkInfo, addNewLinkInfo);
                        }
                    });
                }
            });
            //滚动检查
            dropListContent.addEventListener('scroll', function (e) {
                // console.log('滚动', e.target.scrollTop, e.target.scrollHeight, e.target.offsetHeight);
                var scrollTop = e.target.scrollTop,
                    allHeight = e.target.scrollHeight,
                    contentHeight = e.target.offsetHeight;
                if (scrollTop + contentHeight == allHeight) {
                    if (params.pageIndex * params.pageSize > list.length) {
                        return;
                    } else {
                        params.pageIndex++;
                        userSearch(params).then(function (res) {
                            if (res) {
                                list = list.concat(res);
                                _this.searchListDomCreated(list, dropListContent, linkInfo, addNewLinkInfo);
                            }
                        });
                    }
                }
            });
        });

        //搜索工作室
        document.querySelector('#' + courseBtnId).addEventListener('click', function (e) {
            e.stopPropagation();

            dropListContent.innerHTML = '';
            dropListDom.style.display = 'none';
            document.querySelector('#' + userBtnId).className = '';
            if (dropListDom.style.display == 'block') {
                dropListDom.style.display = 'none';
                document.querySelector('#' + courseBtnId).className = '';
                linkInfo.type = 0;
                return;
            }
            linkInfo.type = 2;
            document.querySelector('#' + courseBtnId).className = 'actived';
            dropListDom.style.display = 'block';
            dropListUserDom.style.display = 'none';
            dropListCourseDom.style.display = 'block';

            //
            var params = { pageIndex: 1, pageSize: 10, key: '' },
                list = [],
                searchDom = document.querySelector('#' + searchRoomlinkId);
            searchDom.value = '';

            //输入检查
            searchDom.addEventListener('input', function (e) {
                e.stopPropagation();
                params.key = searchDom.value;
                params.pageIndex = 1;
                roomSearch(params).then(function (res) {
                    if (res) {
                        list = res;
                        _this.searchListDomCreated(list, dropListContent, linkInfo, addNewLinkInfo);
                    }
                });
            });
            //点击搜索
            document.querySelector('#' + searchRoomBtn).addEventListener('click', function (e) {
                e.stopPropagation();
                if (params.pageIndex * params.pageSize > list.length) {
                    return;
                } else {
                    params.pageIndex++;
                    roomSearch(params).then(function (res) {
                        if (res) {
                            list = list.concat(res);
                            _this.searchListDomCreated(list, dropListContent, linkInfo, addNewLinkInfo);
                        }
                    });
                }
            });
            //滚动检查
            dropListContent.addEventListener('scroll', function (e) {
                // console.log('滚动', e.target.scrollTop, e.target.scrollHeight, e.target.offsetHeight);
                var scrollTop = e.target.scrollTop,
                    allHeight = e.target.scrollHeight,
                    contentHeight = e.target.offsetHeight;
                if (scrollTop + contentHeight == allHeight) {
                    if (params.pageIndex * params.pageSize > list.length) {
                        return;
                    } else {
                        params.pageIndex++;
                        roomSearch(params).then(function (res) {
                            if (res) {
                                list = list.concat(res);
                                _this.searchListDomCreated(list, dropListContent, linkInfo, addNewLinkInfo);
                            }
                        });
                    }
                }
            });
        });
    },

    //拼装列表
    searchListDomCreated: function searchListDomCreated(list, dom, linkInfo, fn) {
        var htmlString = '';
        list.forEach(function (el) {
            htmlString += '<div class="search-li" data-head="' + el.fullHeadImage + '" data-id="' + el.id + '" data-name="' + el.nickName + '" data-sub="' + el.singleIntroduction + '">\n                <div class="search-li-left"><img src="' + el.fullHeadImage + '"></div>\n                <div class="search-li-right">\n                    <h3>' + (el.nickName || '') + '</h3>\n                    <p>' + (el.singleIntroduction || '') + '</p>\n                </div>\n            </div>';
        });
        dom.innerHTML = htmlString;

        setTimeout(function () {
            //添加事件
            var doms = document.querySelectorAll('.search-li');
            doms.forEach(function (item) {
                item.addEventListener('click', function (e) {
                    e.stopPropagation();
                    if (linkInfo.type == 1) {
                        linkInfo.link = 'kolo://user/' + item.getAttribute('data-id');
                        linkInfo.head = item.getAttribute('data-head');
                    } else if (linkInfo.type == 2) {
                        linkInfo.link = 'kolo://cardList/' + item.getAttribute('data-id');
                    }
                    linkInfo.text = item.getAttribute('data-name');
                    linkInfo.subText = item.getAttribute('data-sub');
                    // console.log(JSON.stringify(linkInfo));
                    fn();
                });
            });
        });
    },


    // 插入文本链接
    _insertLink: function _insertLink(text, link) {
        var editor = this.editor;
        // console.log('生成链接', text, link)
        if (!text || !link) {
            return;
        }

        editor.cmd.do('insertHTML', '<a class="kolo-inline-link" target="_blank" href="' + link + '">' + text + '</a>');
    },

    // 插入卡片链接
    _insertCardLink: function _insertCardLink(title, text, link, type, headImage) {
        var editor = this.editor;
        if (!title || !text || !link) {
            return;
        }

        var imageUrl = '';
        if (type == 1) {
            imageUrl = headImage;
        } else if (type == 2) {
            imageUrl = '';
        }

        editor.cmd.do('insertHTML', '<div class="kolo-link" contenteditable="false">\n                <a href="' + link + '" target="_blank">\n                    <div class="link-img">\n                        <img src="' + imageUrl + '?imageView2/1/w/80/h/80"/>\n                    </div>\n                    <div class="link-content">\n                        <h3>' + title + '</h3>\n                        <p>' + text + '</p>\n                    </div>\n                </a>\n            </div>\n            <p>&#8203;<br></p>');
    },

    // 试图改变 active 状态
    tryChangeActive: function tryChangeActive(e) {
        var editor = this.editor;
        var $elem = this.$elem;
        var $selectionELem = editor.selection.getSelectionContainerElem();
        if (!$selectionELem) {
            return;
        }
        if ($selectionELem.getNodeName() === 'A') {
            this._active = true;
            $elem.addClass('w-e-active');
        } else {
            this._active = false;
            $elem.removeClass('w-e-active');
        }
    }
};

/*
    redo-menu
*/
// 构造函数
function Redo(editor) {
    this.editor = editor;
    this.$elem = $('<div class="w-e-menu">\n            <i title="\u524D\u8FDB" class="w-e-icon-redo"></i>\n        </div>');
    this.type = 'click';

    // 当前是否 active 状态
    this._active = false;
}

// 原型
Redo.prototype = {
    constructor: Redo,

    // 点击事件
    onClick: function onClick(e) {
        // 点击菜单将触发这里

        var editor = this.editor;

        // 执行 redo 命令
        editor.cmd.do('redo');
    }
};

/*
    undo-menu
*/
// 构造函数
function Undo(editor) {
    this.editor = editor;
    this.$elem = $('<div class="w-e-menu">\n            <i title="\u540E\u9000" class="w-e-icon-undo"></i>\n        </div>');
    this.type = 'click';

    // 当前是否 active 状态
    this._active = false;
}

// 原型
Undo.prototype = {
    constructor: Undo,

    // 点击事件
    onClick: function onClick(e) {
        // 点击菜单将触发这里

        var editor = this.editor;

        // 执行 undo 命令
        editor.cmd.do('undo');
    }
};

/*
    droplist
*/
var _emptyFn = function _emptyFn() {};

// 构造函数
function DropList(menu, opt) {
    var _this = this;

    // droplist 所依附的菜单
    var editor = menu.editor;
    this.menu = menu;
    this.opt = opt;
    // 容器
    var $container = $('<div class="w-e-droplist"></div>');

    // 标题
    var $title = opt.$title;
    var titleHtml = void 0;
    if ($title) {
        // 替换多语言
        titleHtml = $title.html();
        titleHtml = replaceLang(editor, titleHtml);
        $title.html(titleHtml);

        $title.addClass('w-e-dp-title');
        $container.append($title);
    }

    var list = opt.list || [];
    var type = opt.type || 'list'; // 'list' 列表形式（如“标题”菜单） / 'inline-block' 块状形式（如“颜色”菜单）
    var onClick = opt.onClick || _emptyFn;

    // 加入 DOM 并绑定事件
    var $list = $('<ul class="' + (type === 'list' ? 'w-e-list' : 'w-e-block') + '"></ul>');
    $container.append($list);
    list.forEach(function (item) {
        var $elem = item.$elem;

        // 替换多语言
        var elemHtml = $elem.html();
        elemHtml = replaceLang(editor, elemHtml);
        $elem.html(elemHtml);

        var value = item.value;
        var $li = $('<li class="w-e-item"></li>');
        if ($elem) {
            $li.append($elem);
            $list.append($li);
            $li.on('click', function (e) {
                onClick(value);

                // 隐藏
                _this.hideTimeoutId = setTimeout(function () {
                    _this.hide();
                }, 0);
            });
        }
    });

    // 绑定隐藏事件
    $container.on('mouseleave', function (e) {
        _this.hideTimeoutId = setTimeout(function () {
            _this.hide();
        }, 0);
    });

    // 记录属性
    this.$container = $container;

    // 基本属性
    this._rendered = false;
    this._show = false;
}

// 原型
DropList.prototype = {
    constructor: DropList,

    // 显示（插入DOM）
    show: function show() {
        if (this.hideTimeoutId) {
            // 清除之前的定时隐藏
            clearTimeout(this.hideTimeoutId);
        }

        var menu = this.menu;
        var $menuELem = menu.$elem;
        var $container = this.$container;
        if (this._show) {
            return;
        }
        if (this._rendered) {
            // 显示
            $container.show();
        } else {
            // 加入 DOM 之前先定位位置
            var menuHeight = $menuELem.getSizeData().height || 0;
            var width = this.opt.width || 100; // 默认为 100
            $container.css('margin-top', menuHeight + 'px').css('width', width + 'px');

            // 加入到 DOM
            $menuELem.append($container);
            this._rendered = true;
        }

        // 修改属性
        this._show = true;
    },

    // 隐藏（移除DOM）
    hide: function hide() {
        if (this.showTimeoutId) {
            // 清除之前的定时显示
            clearTimeout(this.showTimeoutId);
        }

        var $container = this.$container;
        if (!this._show) {
            return;
        }
        // 隐藏并需改属性
        $container.hide();
        this._show = false;
    }
};

/*
    menu - list
*/
// 构造函数
function List(editor) {
    var _this = this;

    this.editor = editor;
    this.$elem = $('<div class="w-e-menu"><i class="w-e-icon-list2"></i></div>');
    this.type = 'droplist';

    // 当前是否 active 状态
    this._active = false;

    // 初始化 droplist
    this.droplist = new DropList(this, {
        width: 120,
        $title: $('<p>设置列表</p>'),
        type: 'list', // droplist 以列表形式展示
        list: [{ $elem: $('<span><i class="w-e-icon-list-numbered"></i> 有序列表</span>'), value: 'insertOrderedList' }, { $elem: $('<span><i class="w-e-icon-list2"></i> 无序列表</span>'), value: 'insertUnorderedList' }],
        onClick: function onClick(value) {
            // 注意 this 是指向当前的 List 对象
            _this._command(value);
        }
    });
}

// 原型
List.prototype = {
    constructor: List,

    // 执行命令
    _command: function _command(value) {
        var editor = this.editor;
        var $textElem = editor.$textElem;
        editor.selection.restoreSelection();
        if (editor.cmd.queryCommandState(value)) {
            return;
        }
        editor.cmd.do(value);

        // 验证列表是否被包裹在 <p> 之内
        var $selectionElem = editor.selection.getSelectionContainerElem();
        if ($selectionElem.getNodeName() === 'LI') {
            $selectionElem = $selectionElem.parent();
        }
        if (/^ol|ul$/i.test($selectionElem.getNodeName()) === false) {
            return;
        }
        if ($selectionElem.equal($textElem)) {
            // 证明是顶级标签，没有被 <p> 包裹
            return;
        }
        var $parent = $selectionElem.parent();
        if ($parent.equal($textElem)) {
            // $parent 是顶级标签，不能删除
            return;
        }

        $selectionElem.insertAfter($parent);
        $parent.remove();
    },

    // 试图改变 active 状态
    tryChangeActive: function tryChangeActive(e) {
        var editor = this.editor;
        var $elem = this.$elem;
        if (editor.cmd.queryCommandState('insertUnOrderedList') || editor.cmd.queryCommandState('insertOrderedList')) {
            this._active = true;
            $elem.addClass('w-e-active');
        } else {
            this._active = false;
            $elem.removeClass('w-e-active');
        }
    }
};

/*
    menu - quote
*/
// 构造函数
function Quote(editor) {
    this.editor = editor;
    this.$elem = $('<div class="w-e-menu">\n            <i title="\u5F15\u7528" class="w-e-icon-quotes-left"></i>\n        </div>');
    this.type = 'click';

    // 当前是否 active 状态
    this._active = false;
}

// 原型
Quote.prototype = {
    constructor: Quote,

    onClick: function onClick(e) {
        var editor = this.editor;
        var $selectionElem = editor.selection.getSelectionContainerElem();
        var nodeName = $selectionElem.getNodeName();
        var range = editor.selection.getRange();
        var start = range.startOffset;
        var end = range.endOffset;
        // console.log(nodeName, start, end);

        // if (!UA.isIE()) {
        //     if (nodeName === 'BLOCKQUOTE') {
        //         // 撤销 quote
        //         editor.cmd.do('formatBlock', '<P>')
        //     } else {
        //         // 转换为 quote
        //         editor.cmd.do('formatBlock', '<BLOCKQUOTE>')
        //     }
        //     return
        // }
        // return

        // IE 中不支持 formatBlock <BLOCKQUOTE> ，要用其他方式兼容
        var content = void 0,
            $targetELem = void 0;
        if (nodeName === 'P' || nodeName === 'H1' || nodeName === 'H2') {
            // 将 P 转换为 quote
            content = $selectionElem.text();
            $targetELem = $('<blockquote>' + content + '</blockquote>');
            $targetELem.insertAfter($selectionElem);
            $selectionElem.remove();
        } else if (nodeName === 'BLOCKQUOTE') {
            // 撤销 quote
            content = $selectionElem.text();
            $targetELem = $('<p>' + content + '</p>');
            $targetELem.insertAfter($selectionElem);
            $selectionElem.remove();
        }
        if (!$targetELem) {
            return;
        }
        // console.log(content, content.length - 1, $targetELem, '修改后的选区');
        editor.selection.setSelectionStart($targetELem[0].firstChild, start);
        editor.selection.setSelectionEnd($targetELem[0].firstChild, end);

        editor.selection.restoreSelection();

        // console.log(editor.selection.getRange(), '获取选区');
    },

    tryChangeActive: function tryChangeActive(e) {
        var editor = this.editor;
        var $elem = this.$elem;
        var reg = /^BLOCKQUOTE$/i;
        var cmdValue = editor.cmd.queryCommandValue('formatBlock');
        if (reg.test(cmdValue)) {
            this._active = true;
            $elem.addClass('w-e-active');
        } else {
            this._active = false;
            $elem.removeClass('w-e-active');
        }
    }
};

/*
    panel
*/

/*
    menu - video
*/
// 构造函数
function Video(editor) {
    this.editor = editor;
    var videoMenuId = getRandom('w-e-video');
    this.$elem = $('<div class="w-e-menu" id="' + videoMenuId + '"><i title="添加视频" class="w-e-icon-play"></i></div>');
    editor.videoMenuId = videoMenuId;
    this.type = 'panel';

    // 当前是否 active 状态
    this._active = false;
}

// 原型
Video.prototype = {
    constructor: Video,

    onClick: function onClick() {
        this._createPanel();
    },

    _createPanel: function _createPanel() {
        var _this = this;
        var editor = this.editor;
        var uploadVideo = editor.uploadVideo;
        var config = editor.config;
        var containerId = editor.toolbarSelector;

        // 创建 id
        var dialogId = getRandom('video-dialog');
        var videoId = getRandom('video-dom');
        var uploadId = getRandom('upload-video');
        var btnId = getRandom('btn');

        //创建弹窗
        var template = '\n                <div class="kolo-upload">\n                    <div class="upload-container">\n                        <h3>\u6DFB\u52A0\u89C6\u9891</h3>\n                        <div class="w-e-up-btn">\n                            <button id="' + uploadId + '">\u9009\u62E9\u89C6\u9891</button>\n                            <p>\u4E3A\u4E86\u83B7\u5F97\u66F4\u597D\u7684\u63A8\u8350</p>\n                            <p>\u5EFA\u8BAE\u4E0A\u4F20720p\uFF081280x720\uFF09\u6216\u66F4\u9AD8\u5206\u8FA8\u7387\u7684\u89C6\u9891</p>\n                        </div>\n                        <i id="' + btnId + '" class="w-e-icon-close">\xD7</i>\n                    </div>\n                </div>';

        //替换多语言        
        template = replaceLang(editor, template);

        //添加弹窗
        var dialog = document.createElement('div');
        dialog.className = 'kolo-e-dialog-up';
        dialog.id = dialogId;
        dialog.innerHTML = template;
        document.querySelector(containerId).appendChild(dialog);

        //关闭弹窗
        document.querySelector('#' + btnId).addEventListener('click', function () {
            var dom = document.querySelector('#' + dialogId);
            dom.parentNode.removeChild(dom);
        });

        var that = this;

        if (config.qiniu) {
            var videoObj = config.uploadConfig.video;
            var plupload = new Qiniu.uploader({
                runtimes: 'html5,flash,html4', // 上传模式,依次退化
                browse_button: uploadId, // 上传按钮的ID
                domain: videoObj.bucketDomain, // bucket 域名，下载资源时用到，**必需**
                get_new_uptoken: false, // 设置上传文件的时候是否每次都重新获取新的token
                uptoken: videoObj.token, // 若未指定uptoken_url,则必须指定 uptoken ,uptoken由其他程序生成
                flash_swf_url: 'js/plupload/Moxie.swf', // 引入flash,相对路径
                max_retries: 3, // 上传失败最大重试次数
                dragdrop: true, // 开启可拖曳上传
                auto_start: false, // 选择文件后自动上传，若关闭需要自己绑定事件触发上传
                chunk_size: '4mb', // 分块大小
                multi_selection: false, // 是否允许同时选择多文件
                unique_names: true, // 默认 false，key为文件名。若开启该选项，SDK为自动生成上传成功后的key（文件名）。
                //save_key: false,  // 默认 false。若在服务端生成uptoken的上传策略中指定了 `sava_key`，则开启，SDK在前端将不对key进行任何处理
                filters: { // 文件类型过滤，这里限制为视频类型
                    max_file_size: '2048mb',
                    prevent_duplicates: true,
                    mime_types: [{
                        title: "Video files",
                        extensions: "mp4" // flv,mpg,mpeg,avi,wmv,mov,asf,rm,rmvb,mkv,m4v,mp4
                    }]
                },

                init: {
                    'FilesAdded': function FilesAdded(up, file) {
                        // console.log(up, file, 'FilesAdded', up.files[0]);
                        that.getVideoInfo(up.files[0]).then(function (res) {
                            dialog.parentNode.removeChild(dialog);

                            //判断时长s
                            if (res.duration <= 5) {
                                // console.log('不能选择小于5秒的视频')
                                that.alertMessage('error', replaceLang(editor, '不能选择小于5秒的视频'));
                                return;
                            }
                            //判断分辨率
                            if (res.w / res.h == 16 / 9 && res.h >= 480) {} else {
                                // console.log('视频尺寸不为16：9或者高度小于480')
                                that.alertMessage('error', replaceLang(editor, '视频尺寸不为16：9或者高度小于480'));
                                return;
                            }
                            // up.stop();
                            up.start();
                            // console.log(plupload, 'plupload')

                            uploadVideo.insertLinkVideo(null, true, videoId, 0);
                        });
                    },
                    'BeforeUpload': function BeforeUpload(up, file) {
                        // plupload.stop();
                        // console.log(up, file, 'BeforeUpload')

                    },
                    'UploadProgress': function UploadProgress(up, file) {
                        var progress = (file.loaded / file.size * 100).toFixed(2);
                        config.isUpload = true;
                        if (progress > 0) {
                            uploadVideo.insertLinkVideo(null, true, videoId, progress);
                        }
                    },
                    'FileUploaded': function FileUploaded(up, file, info) {
                        // console.log(up, file, info, 'FileUploaded')
                        config.isUpload = false;
                        if (info.status == 200) {
                            var data = JSON.parse(info.response);
                            uploadVideo.insertLinkVideo(videoObj.bucketDomain + '/' + data.key, false, videoId, 100, {
                                w: data.w,
                                h: data.h
                            });
                        }
                    },
                    'Error': function Error(up, err, errTip) {
                        // console.log(up, err, 'Error')
                    },
                    'UploadComplete': function UploadComplete(up, file) {
                        // console.log(up, file, 'UploadComplete')
                    }
                }
            });

            plupload.bind('FileUploaded', function () {
                // console.log('hello man,a file is uploaded');
            });

            return;
        }
    },

    //获取本地视频的时长宽高
    getVideoInfo: function getVideoInfo(file) {
        return new Promise(function (res) {
            var video = document.createElement('video');
            video.src = URL.createObjectURL(file.getNative());
            video.id = 'test-video';
            video.style = "display: none";
            video.controls = "controls";
            document.querySelector('body').appendChild(video);
            video.addEventListener('canplay', function () {
                // console.log(video.videoWidth, video.videoHeight, video.duration, 'video');
                var videoObj = {
                    w: video.videoWidth,
                    h: video.videoHeight,
                    duration: video.duration
                };
                document.querySelector('body').removeChild(video);
                res(videoObj);
            });
            video.addEventListener('onerror', function () {
                res({
                    w: 0,
                    h: 0,
                    duration: 0
                });
            });
        });
    },
    alertMessage: function alertMessage(type, message) {
        var svgStr = '';
        if (type == 'success') {
            svgStr = 'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+Cjxzdmcgd2lkdGg9IjQwcHgiIGhlaWdodD0iNDBweCIgdmlld0JveD0iMCAwIDQwIDQwIiB2ZXJzaW9uPSIxLjEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiPgogICAgPCEtLSBHZW5lcmF0b3I6IFNrZXRjaCAzOS4xICgzMTcyMCkgLSBodHRwOi8vd3d3LmJvaGVtaWFuY29kaW5nLmNvbS9za2V0Y2ggLS0+CiAgICA8dGl0bGU+aWNvbl9zdWNjZXNzPC90aXRsZT4KICAgIDxkZXNjPkNyZWF0ZWQgd2l0aCBTa2V0Y2guPC9kZXNjPgogICAgPGRlZnM+PC9kZWZzPgogICAgPGcgaWQ9IkVsZW1lbnQtZ3VpZGVsaW5lLXYwLjIuNCIgc3Ryb2tlPSJub25lIiBzdHJva2Utd2lkdGg9IjEiIGZpbGw9Im5vbmUiIGZpbGwtcnVsZT0iZXZlbm9kZCI+CiAgICAgICAgPGcgaWQ9Ik1lc3NhZ2UiIHRyYW5zZm9ybT0idHJhbnNsYXRlKC02MC4wMDAwMDAsIC0yMTIuMDAwMDAwKSI+CiAgICAgICAgICAgIDxnIGlkPSLluKblgL7lkJFf5L+h5oGvIiB0cmFuc2Zvcm09InRyYW5zbGF0ZSg2MC4wMDAwMDAsIDIxMi4wMDAwMDApIj4KICAgICAgICAgICAgICAgIDxnIGlkPSJSZWN0YW5nbGUtMiI+CiAgICAgICAgICAgICAgICAgICAgPGcgaWQ9Imljb25fc3VjY2VzcyI+CiAgICAgICAgICAgICAgICAgICAgICAgIDxyZWN0IGlkPSJSZWN0YW5nbGUtMiIgZmlsbD0iIzEzQ0U2NiIgeD0iMCIgeT0iMCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIj48L3JlY3Q+CiAgICAgICAgICAgICAgICAgICAgICAgIDxwYXRoIGQ9Ik0yNy44MjU1ODE0LDE3LjE0ODQzNTcgTDE5LjAxNzQ0LDI1LjgyODEyMTMgQzE4LjkwMTE2MDksMjUuOTQyNzA4MyAxOC43NjU1MDMzLDI2IDE4LjYxMDQ2NywyNiBDMTguNDU1NDI3LDI2IDE4LjMxOTc2OTMsMjUuOTQyNzA4MyAxOC4yMDM0ODY1LDI1LjgyODEyMTMgTDE4LjAyOTA3MTYsMjUuNjU2MjUgTDEzLjE3NDQxODYsMjAuODQzNzUgQzEzLjA1ODEzOTUsMjAuNzI5MTYzIDEzLDIwLjU5NTQ4MzcgMTMsMjAuNDQyNzA0NyBDMTMsMjAuMjg5OTI5MyAxMy4wNTgxMzk1LDIwLjE1NjI1IDEzLjE3NDQxODYsMjAuMDQxNjY2NyBMMTQuMzY2Mjc3MiwxOC44NjcxODU3IEMxNC40ODI1NiwxOC43NTI2MDIzIDE0LjYxODIxNzcsMTguNjk1MzEwNyAxNC43NzMyNTc3LDE4LjY5NTMxMDcgQzE0LjkyODI5NCwxOC42OTUzMTA3IDE1LjA2Mzk1MTYsMTguNzUyNjAyMyAxNS4xODAyMzA3LDE4Ljg2NzE4NTcgTDE4LjYxMDQ2NywyMi4yNzYwMzggTDI1LjgxOTc2OTMsMTUuMTcxODcxMyBDMjUuOTM2MDQ4NCwxNS4wNTcyODggMjYuMDcxNzA2LDE1IDI2LjIyNjc0MjMsMTUgQzI2LjM4MTc4MjMsMTUgMjYuNTE3NDQsMTUuMDU3Mjg4IDI2LjYzMzcyMjgsMTUuMTcxODcxMyBMMjcuODI1NTgxNCwxNi4zNDYzNTIzIEMyNy45NDE4NjA1LDE2LjQ2MDkzNTcgMjgsMTYuNTk0NjE1IDI4LDE2Ljc0NzM5NCBDMjgsMTYuOTAwMTczIDI3Ljk0MTg2MDUsMTcuMDMzODUyMyAyNy44MjU1ODE0LDE3LjE0ODQzNTcgTDI3LjgyNTU4MTQsMTcuMTQ4NDM1NyBaIiBpZD0iUGF0aCIgZmlsbD0iI0ZGRkZGRiI+PC9wYXRoPgogICAgICAgICAgICAgICAgICAgIDwvZz4KICAgICAgICAgICAgICAgIDwvZz4KICAgICAgICAgICAgPC9nPgogICAgICAgIDwvZz4KICAgIDwvZz4KPC9zdmc+';
        } else if (type == 'warning') {
            svgStr = 'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+Cjxzdmcgd2lkdGg9IjQwcHgiIGhlaWdodD0iNDBweCIgdmlld0JveD0iMCAwIDQwIDQwIiB2ZXJzaW9uPSIxLjEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiPgogICAgPCEtLSBHZW5lcmF0b3I6IFNrZXRjaCAzOS4xICgzMTcyMCkgLSBodHRwOi8vd3d3LmJvaGVtaWFuY29kaW5nLmNvbS9za2V0Y2ggLS0+CiAgICA8dGl0bGU+aWNvbl93YXJuaW5nPC90aXRsZT4KICAgIDxkZXNjPkNyZWF0ZWQgd2l0aCBTa2V0Y2guPC9kZXNjPgogICAgPGRlZnM+PC9kZWZzPgogICAgPGcgaWQ9IlBhZ2UtMSIgc3Ryb2tlPSJub25lIiBzdHJva2Utd2lkdGg9IjEiIGZpbGw9Im5vbmUiIGZpbGwtcnVsZT0iZXZlbm9kZCI+CiAgICAgICAgPGcgaWQ9Ik1lc3NhZ2UiIHRyYW5zZm9ybT0idHJhbnNsYXRlKC02MC4wMDAwMDAsIC0yNzIuMDAwMDAwKSI+CiAgICAgICAgICAgIDxnIGlkPSLluKblgL7lkJFf5L+h5oGvLWNvcHkiIHRyYW5zZm9ybT0idHJhbnNsYXRlKDYwLjAwMDAwMCwgMjcyLjAwMDAwMCkiPgogICAgICAgICAgICAgICAgPGcgaWQ9IlJlY3RhbmdsZS0yIj4KICAgICAgICAgICAgICAgICAgICA8ZyBpZD0iaWNvbl93YXJuaW5nIj4KICAgICAgICAgICAgICAgICAgICAgICAgPHJlY3QgaWQ9IlJlY3RhbmdsZS0yIiBmaWxsPSIjRjdCQTJBIiB4PSIwIiB5PSIwIiB3aWR0aD0iNDAiIGhlaWdodD0iNDAiPjwvcmVjdD4KICAgICAgICAgICAgICAgICAgICAgICAgPHBhdGggZD0iTTIxLjYxNTM4NDYsMjYuNTQzMjA5OSBDMjEuNjE1Mzg0NiwyNi45NDc4NzUxIDIxLjQ1ODMzNDgsMjcuMjkxODM2OCAyMS4xNDQyMzA4LDI3LjU3NTEwMjkgQzIwLjgzMDEyNjgsMjcuODU4MzY4OSAyMC40NDg3MTk0LDI4IDIwLDI4IEMxOS41NTEyODA2LDI4IDE5LjE2OTg3MzIsMjcuODU4MzY4OSAxOC44NTU3NjkyLDI3LjU3NTEwMjkgQzE4LjU0MTY2NTIsMjcuMjkxODM2OCAxOC4zODQ2MTU0LDI2Ljk0Nzg3NTEgMTguMzg0NjE1NCwyNi41NDMyMDk5IEwxOC4zODQ2MTU0LDE5Ljc0NDg1NiBDMTguMzg0NjE1NCwxOS4zNDAxOTA3IDE4LjU0MTY2NTIsMTguOTk2MjI5IDE4Ljg1NTc2OTIsMTguNzEyOTYzIEMxOS4xNjk4NzMyLDE4LjQyOTY5NjkgMTkuNTUxMjgwNiwxOC4yODgwNjU4IDIwLDE4LjI4ODA2NTggQzIwLjQ0ODcxOTQsMTguMjg4MDY1OCAyMC44MzAxMjY4LDE4LjQyOTY5NjkgMjEuMTQ0MjMwOCwxOC43MTI5NjMgQzIxLjQ1ODMzNDgsMTguOTk2MjI5IDIxLjYxNTM4NDYsMTkuMzQwMTkwNyAyMS42MTUzODQ2LDE5Ljc0NDg1NiBMMjEuNjE1Mzg0NiwyNi41NDMyMDk5IFogTTIwLDE1LjgwNDI5ODEgQzE5LjQ0NDQ0MjcsMTUuODA0Mjk4MSAxOC45NzIyMjQsMTUuNjE5MzY4NyAxOC41ODMzMzMzLDE1LjI0OTUwNDYgQzE4LjE5NDQ0MjcsMTQuODc5NjQwNiAxOCwxNC40MzA1MjU1IDE4LDEzLjkwMjE0OTEgQzE4LDEzLjM3Mzc3MjYgMTguMTk0NDQyNywxMi45MjQ2NTc1IDE4LjU4MzMzMzMsMTIuNTU0NzkzNSBDMTguOTcyMjI0LDEyLjE4NDkyOTUgMTkuNDQ0NDQyNywxMiAyMCwxMiBDMjAuNTU1NTU3MywxMiAyMS4wMjc3NzYsMTIuMTg0OTI5NSAyMS40MTY2NjY3LDEyLjU1NDc5MzUgQzIxLjgwNTU1NzMsMTIuOTI0NjU3NSAyMiwxMy4zNzM3NzI2IDIyLDEzLjkwMjE0OTEgQzIyLDE0LjQzMDUyNTUgMjEuODA1NTU3MywxNC44Nzk2NDA2IDIxLjQxNjY2NjcsMTUuMjQ5NTA0NiBDMjEuMDI3Nzc2LDE1LjYxOTM2ODcgMjAuNTU1NTU3MywxNS44MDQyOTgxIDIwLDE1LjgwNDI5ODEgWiIgaWQ9IkNvbWJpbmVkLVNoYXBlIiBmaWxsPSIjRkZGRkZGIiB0cmFuc2Zvcm09InRyYW5zbGF0ZSgyMC4wMDAwMDAsIDIwLjAwMDAwMCkgc2NhbGUoMSwgLTEpIHRyYW5zbGF0ZSgtMjAuMDAwMDAwLCAtMjAuMDAwMDAwKSAiPjwvcGF0aD4KICAgICAgICAgICAgICAgICAgICA8L2c+CiAgICAgICAgICAgICAgICA8L2c+CiAgICAgICAgICAgIDwvZz4KICAgICAgICA8L2c+CiAgICA8L2c+Cjwvc3ZnPg==';
        } else if (type == 'error') {
            svgStr = 'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+Cjxzdmcgd2lkdGg9IjQwcHgiIGhlaWdodD0iNDBweCIgdmlld0JveD0iMCAwIDQwIDQwIiB2ZXJzaW9uPSIxLjEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiPgogICAgPCEtLSBHZW5lcmF0b3I6IFNrZXRjaCAzOS4xICgzMTcyMCkgLSBodHRwOi8vd3d3LmJvaGVtaWFuY29kaW5nLmNvbS9za2V0Y2ggLS0+CiAgICA8dGl0bGU+aWNvbl9kYW5nZXI8L3RpdGxlPgogICAgPGRlc2M+Q3JlYXRlZCB3aXRoIFNrZXRjaC48L2Rlc2M+CiAgICA8ZGVmcz48L2RlZnM+CiAgICA8ZyBpZD0iRWxlbWVudC1ndWlkZWxpbmUtdjAuMi40IiBzdHJva2U9Im5vbmUiIHN0cm9rZS13aWR0aD0iMSIgZmlsbD0ibm9uZSIgZmlsbC1ydWxlPSJldmVub2RkIj4KICAgICAgICA8ZyBpZD0iTWVzc2FnZSIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTYwLjAwMDAwMCwgLTMzMi4wMDAwMDApIj4KICAgICAgICAgICAgPGcgaWQ9IuW4puWAvuWQkV/kv6Hmga8iIHRyYW5zZm9ybT0idHJhbnNsYXRlKDYwLjAwMDAwMCwgMzMyLjAwMDAwMCkiPgogICAgICAgICAgICAgICAgPGcgaWQ9IlJlY3RhbmdsZS0yIj4KICAgICAgICAgICAgICAgICAgICA8ZyBpZD0iaWNvbl9kYW5nZXIiPgogICAgICAgICAgICAgICAgICAgICAgICA8cmVjdCBpZD0iUmVjdGFuZ2xlLTIiIGZpbGw9IiNGRjQ5NDkiIHg9IjAiIHk9IjAiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+PC9yZWN0PgogICAgICAgICAgICAgICAgICAgICAgICA8cGF0aCBkPSJNMjUuODE3MjYyNywxNi4zNDUxNzk2IEMyNS45MzkwOTAyLDE2LjIyMzM0ODMgMjYsMTYuMDc2MTQxOCAyNiwxNS45MDM1NTIzIEMyNiwxNS43MzA5NjI4IDI1LjkzOTA5MDIsMTUuNTgzNzU2MyAyNS44MTcyNjI3LDE1LjQ2MTkyODkgTDI0LjUwNzYxNTcsMTQuMTgyNzQxMSBDMjQuMzg1Nzg4MiwxNC4wNjA5MTM3IDI0LjI0MzY1NzUsMTQgMjQuMDgxMjE5NiwxNCBDMjMuOTE4NzgxNywxNCAyMy43NzY2NTEsMTQuMDYwOTEzNyAyMy42NTQ4MjM1LDE0LjE4Mjc0MTEgTDIwLDE3LjgzNzU2MzUgTDE2LjMxNDcyMTYsMTQuMTgyNzQxMSBDMTYuMTkyODkwMiwxNC4wNjA5MTM3IDE2LjA1MDc1OTUsMTQgMTUuODg4MzIxNiwxNCBDMTUuNzI1ODg3NiwxNCAxNS41ODM3NTY5LDE0LjA2MDkxMzcgMTUuNDYxOTI5NCwxNC4xODI3NDExIEwxNC4xNTIyODI0LDE1LjQ2MTkyODkgQzE0LjA1MDc1ODIsMTUuNTgzNzU2MyAxNCwxNS43MzA5NjI4IDE0LDE1LjkwMzU1MjMgQzE0LDE2LjA3NjE0MTggMTQuMDUwNzU4MiwxNi4yMjMzNDgzIDE0LjE1MjI4MjQsMTYuMzQ1MTc5NiBMMTcuODM3NTYwOCwyMC4wMDAwMDE5IEwxNC4xNTIyODI0LDIzLjY1NDgyNDMgQzE0LjA1MDc1ODIsMjMuNzc2NjUxNyAxNCwyMy45MjM4NTgyIDE0LDI0LjA5NjQ0NzcgQzE0LDI0LjI2OTAzNzIgMTQuMDUwNzU4MiwyNC40MTYyNDM3IDE0LjE1MjI4MjQsMjQuNTM4MDcxMSBMMTUuNDYxOTI5NCwyNS44MTcyNTg5IEMxNS41ODM3NTY5LDI1LjkzOTA4NjMgMTUuNzI1ODg3NiwyNiAxNS44ODgzMjE2LDI2IEMxNi4wNTA3NTk1LDI2IDE2LjE5Mjg5MDIsMjUuOTM5MDg2MyAxNi4zMTQ3MjE2LDI1LjgxNzI1ODkgTDIwLDIyLjE2MjQzNjUgTDIzLjY1NDgyMzUsMjUuODE3MjU4OSBDMjMuNzc2NjUxLDI1LjkzOTA4NjMgMjMuOTE4NzgxNywyNiAyNC4wODEyMTk2LDI2IEMyNC4yNDM2NTc1LDI2IDI0LjM4NTc4ODIsMjUuOTM5MDg2MyAyNC41MDc2MTU3LDI1LjgxNzI1ODkgTDI1LjgxNzI2MjcsMjQuNTM4MDcxMSBDMjUuOTM5MDkwMiwyNC40MTYyNDM3IDI2LDI0LjI2OTAzNzIgMjYsMjQuMDk2NDQ3NyBDMjYsMjMuOTIzODU4MiAyNS45MzkwOTAyLDIzLjc3NjY1MTcgMjUuODE3MjYyNywyMy42NTQ4MjQzIEwyMi4xMzE5ODA0LDIwLjAwMDAwMTkgTDI1LjgxNzI2MjcsMTYuMzQ1MTc5NiBaIiBpZD0iUGF0aCIgZmlsbD0iI0ZGRkZGRiI+PC9wYXRoPgogICAgICAgICAgICAgICAgICAgIDwvZz4KICAgICAgICAgICAgICAgIDwvZz4KICAgICAgICAgICAgPC9nPgogICAgICAgIDwvZz4KICAgIDwvZz4KPC9zdmc+';
        }
        var dom = document.createElement('div');
        dom.className = 'el-message';
        dom.style = 'z-index: 999999';
        var template = '\n            <img src="' + svgStr + '" alt="" class="el-message__img">\n            <div class="el-message__group">\n                <p>\n                    ' + message + '\n                </p>\n            </div>\n        ';
        dom.innerHTML = template;
        document.querySelector('body').appendChild(dom);
        setTimeout(function () {
            document.querySelector('body').removeChild(dom);
        }, 3000);
    }
};

/*
    menu - img
*/
// 构造函数
function Image(editor) {
    this.editor = editor;
    var imgMenuId = getRandom('w-e-img');
    this.$elem = $('<div class="w-e-menu" id="' + imgMenuId + '"><i title="添加图片" class="w-e-icon-image"></i></div>');
    editor.imgMenuId = imgMenuId;
    this.type = 'panel';

    // 当前是否 active 状态
    this._active = false;
}

// 原型
Image.prototype = {
    constructor: Image,

    onClick: function onClick() {
        var editor = this.editor;
        var config = editor.config;

        this._createInsertPanel();
        if (config.qiniu) {
            return;
        }
    },

    _createInsertPanel: function _createInsertPanel() {
        var editor = this.editor;
        var uploadImg = editor.uploadImg;
        var config = editor.config;

        var containerId = editor.toolbarSelector;

        // id
        var dialogId = getRandom('img-dialog');
        var upTriggerId = getRandom('up-trigger');
        var upFileId = getRandom('up-file');
        var closeUpload = getRandom('cloase-img');

        //创建弹窗 
        var template = '\n                <div class="kolo-upload">\n                    <div class="upload-container">\n                        <h3>\u6DFB\u52A0\u56FE\u7247</h3>\n                        <div class="w-e-up-btn">\n                            <button id="' + upTriggerId + '">\u9009\u62E9\u56FE\u7247</button>\n                            <p>\u4E3A\u4E86\u83B7\u5F97\u66F4\u597D\u7684\u63A8\u8350</p>\n                            <p>\u5EFA\u8BAE\u4E0A\u4F20720p\uFF081280x720\uFF09\u6216\u66F4\u9AD8\u5206\u8FA8\u7387\u7684\u56FE\u7247</p>\n                        </div>\n                        <div style="display:none;">\n                            <input id="' + upFileId + '" type="file" multiple="multiple" accept="image/jpg,image/jpeg,image/png,image/svg,image/gif,image/bmp"/>\n                        </div>\n                        <i id="' + closeUpload + '" class="w-e-icon-close">\xD7</i>\n                    </div>\n                </div>';
        //替换多语言        
        template = replaceLang(editor, template);

        //添加弹窗
        var dialog = document.createElement('div');
        dialog.className = 'kolo-e-dialog-up';
        dialog.id = dialogId;
        dialog.innerHTML = template;
        document.querySelector(containerId).appendChild(dialog);

        //关闭弹窗
        document.querySelector('#' + closeUpload).addEventListener('click', function (e) {
            e.stopPropagation();
            var dom = document.querySelector('#' + dialogId);
            dom.parentNode.removeChild(dom);
        });

        //点击按钮选择图片
        document.querySelector('#' + upTriggerId).addEventListener('click', function (e) {
            e.stopPropagation();
            document.querySelector('#' + upFileId).click();
        });

        //文件选择
        document.querySelector('#' + upFileId).addEventListener('change', function (e) {
            var $file = $('#' + upFileId);
            var fileElem = $file[0];
            if (!fileElem) {
                // 返回 true 可关闭 panel
                return true;
            }

            // 获取选中的 file 对象列表
            var fileList = fileElem.files;
            if (fileList.length) {
                uploadImg.uploadImg(fileList);
                var dom = document.querySelector('#' + dialogId);
                dom.parentNode.removeChild(dom);
            }
        });
    },

    // 试图改变 active 状态
    tryChangeActive: function tryChangeActive(e) {
        // const editor = this.editor
        // const $elem = this.$elem
        // if (editor._selectedImg) {
        //     this._active = true
        //     $elem.addClass('w-e-active')
        // } else {
        //     this._active = false
        //     $elem.removeClass('w-e-active')
        // }
    }
};

/*
    menu - audio
*/
//上传音频
function Audio(editor) {
    var _this = this;

    this.editor = editor;
    var audioMenuId = getRandom('w-e-audio');
    this.$elem = $('<div class="w-e-menu"><i title="添加音乐" class="w-e-icon-audio"></i><audio style="display:none;" id="play-' + audioMenuId + '"></audio></div>');
    editor.audioMenuId = audioMenuId;
    this.type = 'panel';

    // //激活状态
    this._active = false;
}

Audio.prototype = {
    constructor: Audio,

    onClick: function onClick() {
        // var editor = this.editor;
        // var config = editor.config;

        this._createPanel();
    },

    _createPanel: function _createPanel() {
        var _this2 = this;

        var _this = this;
        var editor = this.editor;
        var uploadAudio = editor.uploadAudio;
        var config = editor.config;

        var containerId = editor.toolbarSelector;

        var disabled = true;

        // 各个dom的随机id
        var localAudio = getRandom('local-audio'),
            audioId = getRandom('upload-audio'),
            linkId = getRandom('link-audio'),
            dialogId = getRandom('audio-dialog'),
            searchlinkId = getRandom('link-audio-search'),
            searchBtn = getRandom('audio-search-btn'),
            playBtn = getRandom('play-btn'),
            pauseBtn = getRandom('pause-btn'),
            clearBtn = getRandom('clear-btn');

        // <img class="play" id="${playBtn}" style="display: none;" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABwAAAAcCAYAAAEFCu8CAAAACXBIWXMAAAsTAAALEwEAmpwYAAAFFmlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNS42LWMxNDAgNzkuMTYwNDUxLCAyMDE3LzA1LzA2LTAxOjA4OjIxICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOmRjPSJodHRwOi8vcHVybC5vcmcvZGMvZWxlbWVudHMvMS4xLyIgeG1sbnM6cGhvdG9zaG9wPSJodHRwOi8vbnMuYWRvYmUuY29tL3Bob3Rvc2hvcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RFdnQ9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZUV2ZW50IyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgQ0MgKE1hY2ludG9zaCkiIHhtcDpDcmVhdGVEYXRlPSIyMDE4LTAxLTMwVDEwOjI0OjAyKzA4OjAwIiB4bXA6TW9kaWZ5RGF0ZT0iMjAxOC0wMS0zMFQxMDoyODowNyswODowMCIgeG1wOk1ldGFkYXRhRGF0ZT0iMjAxOC0wMS0zMFQxMDoyODowNyswODowMCIgZGM6Zm9ybWF0PSJpbWFnZS9wbmciIHBob3Rvc2hvcDpDb2xvck1vZGU9IjMiIHBob3Rvc2hvcDpJQ0NQcm9maWxlPSJzUkdCIElFQzYxOTY2LTIuMSIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDo5NjJhMWYyOS1hMmExLTRmNjEtYmZlYS1hN2Q1NjAzYjgxOWQiIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6OTYyYTFmMjktYTJhMS00ZjYxLWJmZWEtYTdkNTYwM2I4MTlkIiB4bXBNTTpPcmlnaW5hbERvY3VtZW50SUQ9InhtcC5kaWQ6OTYyYTFmMjktYTJhMS00ZjYxLWJmZWEtYTdkNTYwM2I4MTlkIj4gPHhtcE1NOkhpc3Rvcnk+IDxyZGY6U2VxPiA8cmRmOmxpIHN0RXZ0OmFjdGlvbj0iY3JlYXRlZCIgc3RFdnQ6aW5zdGFuY2VJRD0ieG1wLmlpZDo5NjJhMWYyOS1hMmExLTRmNjEtYmZlYS1hN2Q1NjAzYjgxOWQiIHN0RXZ0OndoZW49IjIwMTgtMDEtMzBUMTA6MjQ6MDIrMDg6MDAiIHN0RXZ0OnNvZnR3YXJlQWdlbnQ9IkFkb2JlIFBob3Rvc2hvcCBDQyAoTWFjaW50b3NoKSIvPiA8L3JkZjpTZXE+IDwveG1wTU06SGlzdG9yeT4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+IDw/eHBhY2tldCBlbmQ9InIiPz6ZuaZ/AAADN0lEQVRIib2WT4iVZRTGf8+dO0gjYg4OMgoh/WFyIQkjLmbVZkpQtw3SUGFWUIluQgQZJ90bTVgwIDgihkw4wt0IESFUkFS0DIJoZUFoziKQdHpafOf7fOe933fv4MIDl3vf9z3Pc/6855z3yjarJN2w3ak2bM/YHsM2tju2xwCUQlrAInBMEpQqKeNYzrpoe6k6KH2wvTtBnSzRlXkysd1RVziJtCQhCaADtIE5YCT2Kpptye/1AC3bn8Tem7bX2T4m6R/bH7WAB4mZl4BruWfr69atWA/ZnrPdtj0HDEFkNfXM9gjwKXAX2Az8DlyS9GNuLl+P2P7C9uHcjbjHkQpoe8L2+Uzxlbj9Ldn+nO3xErhkezA5nEl+t2vWSyVwPAIvD98Pa6+RySqLSWydPMVNMXZlNZTGgWlgOw1Z7VlZvaQN5Pd4BngG+A9YAW4C85LuJzoFMJNd8T0NDACTwFXbv0k6Wiq1aoA/A8uSliXdkXRF0gHgb9uXUtewfcD2i8nejO2NOaPtedt7bVfAju2BRGFdgA/VgDu2H7oqaSU5Py7pNHArCEZzgroYK5F0HbgBHMzP6rJauvQE8AFwW9LZNQMDdE7S7SZmIlPzvdwO3SqrLahiGbI92wM0CwyF7qqsTgObIt1TtofjMxUjdFPoFPo1M2cQeBvYE1u1tfrI3fGoUt1G3sulRJftWiPfHeBz4MusEEuuntffJH9KeqvBuQngDeA928vAh5J+7bKajLmW7ScbyJ6NNnm1n0fBMxsF8XHZr/kdtoELwEbgrKSvMxIBh4BtwD3gK+AnSY1FEBGfoEj1YeB+avAIxcN5UdJiDfh5AEm/2N4B7AU2UEzQ74Ebkv6twU1RDMvrwLnU4OUgeEfSrRrgTBg8ne2PAvuArcBfkj7LzoeBhYjy9bRoyn65lxtrEttPAfsp3nqAH/phUoM3KdI0CVzpYWQn8DLFv44V4BvgW0kPGiCTCf/DKrU9aHshKmuixtDTto/aftf2C/0iCcxE8C0Ef1dbDEQZd6Ksez4MPQz1b4tsLj4HnKJokT+AC5K+W0tEFI0/CnQ1fqPBRKF89w8Cw2sIru9oe+zD+39bTbkFDwfMFgAAAABJRU5ErkJggg==" />
        // <img class="pause" id="${pauseBtn}" style="display: none;" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABwAAAAcCAYAAAEFCu8CAAAACXBIWXMAAAsTAAALEwEAmpwYAAAFFmlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNS42LWMxNDAgNzkuMTYwNDUxLCAyMDE3LzA1LzA2LTAxOjA4OjIxICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOmRjPSJodHRwOi8vcHVybC5vcmcvZGMvZWxlbWVudHMvMS4xLyIgeG1sbnM6cGhvdG9zaG9wPSJodHRwOi8vbnMuYWRvYmUuY29tL3Bob3Rvc2hvcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RFdnQ9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZUV2ZW50IyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgQ0MgKE1hY2ludG9zaCkiIHhtcDpDcmVhdGVEYXRlPSIyMDE4LTA1LTAyVDExOjQwOjMwKzA4OjAwIiB4bXA6TW9kaWZ5RGF0ZT0iMjAxOC0wNS0zMVQxMTowNjowMiswODowMCIgeG1wOk1ldGFkYXRhRGF0ZT0iMjAxOC0wNS0zMVQxMTowNjowMiswODowMCIgZGM6Zm9ybWF0PSJpbWFnZS9wbmciIHBob3Rvc2hvcDpDb2xvck1vZGU9IjMiIHBob3Rvc2hvcDpJQ0NQcm9maWxlPSJzUkdCIElFQzYxOTY2LTIuMSIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDo4MWI1YjI2NC1jNzg5LTQzYWItYjRlZS00ODY1YjU1ZmNhY2EiIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6ODFiNWIyNjQtYzc4OS00M2FiLWI0ZWUtNDg2NWI1NWZjYWNhIiB4bXBNTTpPcmlnaW5hbERvY3VtZW50SUQ9InhtcC5kaWQ6ODFiNWIyNjQtYzc4OS00M2FiLWI0ZWUtNDg2NWI1NWZjYWNhIj4gPHhtcE1NOkhpc3Rvcnk+IDxyZGY6U2VxPiA8cmRmOmxpIHN0RXZ0OmFjdGlvbj0iY3JlYXRlZCIgc3RFdnQ6aW5zdGFuY2VJRD0ieG1wLmlpZDo4MWI1YjI2NC1jNzg5LTQzYWItYjRlZS00ODY1YjU1ZmNhY2EiIHN0RXZ0OndoZW49IjIwMTgtMDUtMDJUMTE6NDA6MzArMDg6MDAiIHN0RXZ0OnNvZnR3YXJlQWdlbnQ9IkFkb2JlIFBob3Rvc2hvcCBDQyAoTWFjaW50b3NoKSIvPiA8L3JkZjpTZXE+IDwveG1wTU06SGlzdG9yeT4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+IDw/eHBhY2tldCBlbmQ9InIiPz6++U+ZAAAAnklEQVRIie1UQQ6AIAzriE/y/y/gT/UgU9C5mBk1GpoYTaG0Y4KQRI1U3hSRhlggW0lDJAAo2pyOdST1YcVlkntLK6CJXbYjpZaXTy1706Cb1h30MBgcAUC0pZi3unyOyrlZPXxIGN7VsDAcddvHUz285NiF/xA+/6+GHaMIJ43CulVrNOXXp7SZtJ5YxWjNA16osBt2w274vuH/79IJe31HmgGNh/4AAAAASUVORK5CYII=" />

        //创建弹窗
        var template = '\n                <div class="kolo-upload">\n                    <div class="upload-container">\n                        <h3>\u6DFB\u52A0\u97F3\u4E50</h3>\n                        <div class="music">\n                            <audio id="' + audioId + '" style="display: none;"></audio>\n                            <div class="search-box">\n                                <div class="status-box">\n                                    <img class="search" id="' + searchBtn + '" src="http://image.kolocdn.com/FoKx9in6OwMaaNwaN8OlcH7WzYw8" />\n                                </div>\n                                <p>\n                                    <input type="text" id="' + searchlinkId + '"/>\n                                    <i class="w-e-icon-close" id="' + clearBtn + '">\xD7</i>\n                                </p>\n                            </div>\n                            <p class="error-audio"></p>\n                            <div class="music-list"></div>\n                        </div>\n                        <div class="w-e-up-btn">\n                            <button id="' + localAudio + '" disabled="' + disabled + '">\u786E\u5B9A</button>\n                        </div>\n                        <i id="' + linkId + '" class="w-e-icon-close">\xD7</i>\n                    </div>\n                </div>';
        //替换多语言        
        template = replaceLang(editor, template);

        //
        var dialog = document.createElement('div');
        dialog.className = 'kolo-e-dialog';
        dialog.id = dialogId;
        dialog.innerHTML = template;

        //添加弹窗
        document.querySelector(containerId).appendChild(dialog);
        //关闭弹窗     
        document.querySelector('#' + linkId).addEventListener('click', function () {
            var dom = document.querySelector('#' + dialogId);
            dom.parentNode.removeChild(dom);
        });

        //监控输入
        document.querySelector('#' + searchlinkId).addEventListener('keyup', function (e) {
            e.stopPropagation();

            var value = $('#' + searchlinkId).val().trim();
            if (!value) {
                document.querySelector('.music-list').style.display = 'none';
                return;
            }
            disabled = $('#' + searchlinkId).attr('data-id') ? false : true;
            // console.log(value, 'value', document.querySelector('#' + searchlinkId).value);

            document.querySelector('#' + localAudio).disabled = disabled;

            //网易云音乐链接
            _this2.searchMusic(value).then(function (res) {
                if (res.code == 200) {
                    _this2._renderMusicList(res.data.songs, _chooseMusic, audioId);
                }
            });
        });

        //获得焦点
        document.querySelector('#' + searchlinkId).addEventListener('focus', function (e) {
            e.stopPropagation();
            document.querySelector('.music-list').style.display = 'block';
            document.querySelector('#' + clearBtn).style.display = 'block';
        });

        //监控搜索按钮
        document.querySelector('#' + searchBtn).addEventListener('click', function (e) {
            e.stopPropagation();
            var value = $('#' + searchlinkId).val().trim();
            //网易云音乐链接
            _this2.searchMusic(value).then(function (res) {
                if (res.code == 200) {
                    _this2._renderMusicList(res.data.songs, _chooseMusic, audioId);
                }
            });
        });

        //点击输入框和下拉框之外的地方关闭下拉框
        document.querySelector('.music').addEventListener('click', function (e) {
            //输入框和下拉框不触发下拉框 关闭
            e.stopPropagation();
        });
        document.querySelector('.kolo-upload').addEventListener('click', function (e) {
            e.stopPropagation();
            var dom = document.querySelector('.music-list');
            if (dom) {
                dom.style.display = 'none';
            }
        });

        //监控清除输入
        document.querySelector('#' + clearBtn).addEventListener('click', function () {
            document.querySelector('#' + searchlinkId).value = '';
            document.querySelector('.music-list').innerHTML = '';
            document.querySelector('.music-list').style.display = 'none';
            //变回搜索状态   
            var searchDom = document.querySelector('#' + searchBtn);
            if (searchDom && searchDom.style) {
                document.querySelector('#' + searchBtn).style.display = 'inline-block';
            }
            // document.querySelector('#' + playBtn).style && document.querySelector('#' + playBtn).style.display = 'none';
            // document.querySelector('#' + pauseBtn).style && document.querySelector('#' + pauseBtn).style.display = 'none';

            document.querySelector('#' + clearBtn).style.display = 'none';

            document.querySelector('#' + localAudio).setAttribute('disabled', true);
        });

        //确定选择的音乐，并添加到富文本
        document.querySelector('#' + localAudio).addEventListener('click', function (e) {
            e.stopPropagation();
            var dataDom = document.querySelector('#' + searchlinkId);
            var dataUrl = dataDom.getAttribute('data-url'),
                dataPerson = dataDom.getAttribute('data-person'),
                id = dataDom.getAttribute('data-id');
            if (!dataUrl || !dataPerson || !id) {
                document.querySelector('.error-audio').style.display = 'block';
                var word = replaceLang(editor, '未搜索到该音乐');
                document.querySelector('.error-audio').innerText = word;
                return;
            }
            _this2._insert({
                url: dataUrl,
                person: dataPerson,
                name: dataDom.value,
                id: id
            });

            //关闭弹窗
            var dom = document.querySelector('#' + dialogId);
            dom.parentNode.removeChild(dom);
        });

        //音乐列表选择
        function _chooseMusic(e) {
            e.stopPropagation();

            var target = e.target;
            if (target.tagName !== 'LI') {
                return;
            }
            var musicId = target.getAttribute('data-id');

            if (musicId) {
                _this.getMusicUrl(musicId).then(function (url) {
                    if (url.code == 200) {
                        var chooseDom = document.querySelector('#' + searchlinkId);
                        chooseDom.value = target.getAttribute('data-name');
                        chooseDom.setAttribute('data-url', url.data[0].url);
                        chooseDom.setAttribute('data-person', target.getAttribute('data-person'));
                        chooseDom.setAttribute('data-id', target.getAttribute('data-id'));
                        //隐藏下拉列表
                        document.querySelector('.music-list').style.display = 'none';

                        document.querySelector('#' + localAudio).removeAttribute('disabled');
                        //
                        document.querySelectorAll('.music-list ul li .status-box').forEach(function (player) {
                            player.className = 'status-box status-pause';
                            player.setAttribute('data-status', 'pause');
                            player.parentNode.className = '';
                        });
                        target.className = "active-music";

                        //关闭播放器，并添加选择音乐的链接
                        var audioDom = document.querySelector('#' + audioId);
                        audioDom.pause();
                        audioDom.src = url.data[0].url;
                    }
                });
            }
        }
    },

    //生成音乐列表
    _renderMusicList: function _renderMusicList() {
        var list = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];
        var fn = arguments[1];
        var audioId = arguments[2];

        var _this = this;
        //播放器
        var audioDom = document.querySelector('#' + audioId);

        if (list && list.length > 0) {
            //生成列表的容器
            var container = document.querySelector('.music-list');
            container.style.display = 'block';

            var musiclist = '<ul>';
            list.forEach(function (item) {
                musiclist += '\n                    <li data-id="' + item.id + '" data-name="' + item.name + '/' + (item.artists.length ? item.artists[0].name : '--') + '" data-person="' + (item.artists.length > 0 ? item.artists[0].img1v1Url : '') + '">\n                        <div class="name">' + item.name + '/' + (item.artists.length ? item.artists[0].name : '--') + '</div>\n                        <div class="status-box status-pause" data-status="pause">\n                            <img class="play" src="http://image.kolocdn.com/FnC8tIrcowABJDb796JyiJWJ6UqR"/>\n                            <img class="pause" src="http://image.kolocdn.com/FltyRrAsUsvYYwg8uTEvoGHd5X-F"/>\n                        </div>\n                    </li>\n                ';
            });
            musiclist += '</ul>';
            container.innerHTML = musiclist;

            //为每一个列表添加监控事件
            document.querySelectorAll('.music-list ul li').forEach(function (item) {
                item.addEventListener('click', fn);
            });
            //为每一个播放按钮添加事件
            var statusPlays = document.querySelectorAll('.music-list ul li .status-box');
            statusPlays.forEach(function (item) {
                item.addEventListener('click', function (e) {
                    e.stopPropagation();
                    var dataDom = item.parentNode;

                    //如果是关闭的，则打开播放器，关闭其他所有音乐
                    if (item.getAttribute('data-status') == 'pause') {
                        statusPlays.forEach(function (palyer) {
                            palyer.className = 'status-box status-pause';
                            palyer.parentNode.className = '';
                        });
                        dataDom.className = "active-music";
                        audioDom.pause();
                        _this.getMusicUrl(dataDom.getAttribute('data-id')).then(function (urlData) {
                            if (urlData.code == 200) {
                                audioDom.src = urlData.data[0].url;
                                audioDom.play();
                                item.setAttribute('data-status', 'play');
                            }
                        });
                        item.className = 'status-box status-play';
                    } else {
                        item.className = 'status-box status-pause';
                        audioDom.pause();
                    }
                });
            });
        }
    },

    //搜索音乐并生成列表
    searchMusic: function searchMusic(value) {
        var _this3 = this;

        //每次进行搜索需要关闭错误提示
        document.querySelector('.error-audio').style.display = 'none';
        return new Promise(function (res, rej) {
            _this3._http('https://music-api.kolo.la/search?keywords=' + value).then(function (back) {
                if (back.code == 200) {
                    //过滤掉没有版权的音乐    
                    var list = {
                        songCount: back.data.result.songCount,
                        songs: []
                    };
                    var arr = [];
                    back.data.result.songs.forEach(function (item, index) {
                        arr.push(_this3.checkMusic(item.id));
                    });
                    Promise.all(arr).then(function (result) {
                        result.forEach(function (item, index) {
                            if (item) {
                                list.songs.push(back.data.result.songs[index]);
                            }
                        });
                        res({ code: 200, data: list });
                    }).catch(function (error) {
                        console.log(error); // 失败了，打出 '失败'
                    });
                } else {
                    res({ code: 500, data: null });
                }
            });
        });
    },

    //检测音乐是否有权限
    checkMusic: function checkMusic(id) {
        var _this4 = this;

        return new Promise(function (res, rej) {
            _this4._http('https://music-api.kolo.la/check/music?id=' + id).then(function (back) {
                if (back.code == 200 && back.data.success == true) {
                    res(true);
                } else {
                    res(false);
                }
            });
        });
    },

    //根据音乐ID获取音乐链接
    getMusicUrl: function getMusicUrl(id) {
        var _this5 = this;

        return new Promise(function (res, rej) {
            _this5._http('https://music-api.kolo.la/music/url?id=' + id).then(function (data) {
                if (data.code == 200) {
                    res({ code: 200, data: data.data.data });
                } else {
                    res({ code: 500, data: null });
                }
            });
        });
    },

    //请求get
    _http: function _http(uri) {
        return new Promise(function (res, rej) {
            var request = new XMLHttpRequest();
            var timeout = false;
            var timer = setTimeout(function () {
                timeout = true;
                request.abort();
                res({ code: 500, data: null });
            }, 30000);
            request.open("GET", uri);
            request.onreadystatechange = function () {
                if (request.readyState !== 4) return;
                if (timeout) return;
                clearTimeout(timer);
                if (request.status === 200) {
                    res({ code: 200, data: JSON.parse(request.responseText) });
                }
            };
            request.send(null);
        });
    },

    // 插入音频
    _insert: function _insert(obj) {
        var editor = this.editor;
        var uploadAudio = editor.uploadAudio;
        uploadAudio.insertLinkAudio(obj);
    }

};

/*
    menu - justify
*/
// 构造函数
function Justify(editor) {
    this.editor = editor;
    this.$elem = $('<div class="w-e-menu" title="居中"><i class="w-e-icon-paragraph-center"></i></div>');
    this.type = 'click';

    // 当前是否 active 状态
    this._active = false;
}

// 原型
Justify.prototype = {
    constructor: Justify,

    onClick: function onClick(e) {
        var editor = this.editor;
        var $selectionElem = editor.selection.getSelectionListElem();
        var $elem = this.$elem;

        $selectionElem = $selectionElem.filter(function (elem) {
            var name = elem.getNodeName();
            return name === 'H1' || name === 'P' || name === 'H2';
        });
        var lengthElem = $selectionElem.length;

        if (lengthElem == 1) {
            //选中单行区域

            if (this.isJustifyCenter($selectionElem)) {
                $selectionElem[0].css('text-align', '');
                $elem.removeClass('w-e-active');
            } else {
                $selectionElem[0].css('text-align', 'center');
                // editor.cmd.do('justifyCenter');
                $elem.addClass('w-e-active');
            }
        } else {
            //选择多行区域

            if (this.isJustifyCenter($selectionElem)) {
                $selectionElem.forEach(function (element) {
                    element.css('text-align', '');
                });
                $elem.removeClass('w-e-active');
            } else {
                $selectionElem.forEach(function (element) {
                    element.css('text-align', 'center');
                });
                // editor.cmd.do('justifyCenter');
                $elem.addClass('w-e-active');
            }
        }

        editor.selection.restoreSelection();
    },

    //判断选中区域是否处于居中状态
    isJustifyCenter: function isJustifyCenter(list) {
        var bool = false;
        var arr = [];
        //只判断选区中的 文本区域 H1，H2, P
        arr = list.filter(function (elem) {
            var name = elem.getNodeName();
            return name === 'H1' || name === 'P' || name === 'H2';
        });
        if (arr.length == 0) {
            return false;
        }
        bool = arr.every(function (elem) {
            return elem.css('text-align') === 'center';
        });
        return bool;
    },

    tryChangeActive: function tryChangeActive(e) {
        var editor = this.editor;
        var $elem = this.$elem;
        var $selectionELem = editor.selection.getSelectionListElem();

        if (this.isJustifyCenter($selectionELem)) {
            this._active = true;
            $elem.addClass('w-e-active');
        } else {
            this._active = false;
            $elem.removeClass('w-e-active');
        }
    }
};

/*
    menu - justify
*/
// 构造函数
function Justify$1(editor) {
    this.editor = editor;
    this.$elem = $('<div class="w-e-menu" title="居左"><i class="w-e-icon-paragraph-left"></i></div>');
    this.type = 'click';

    // 当前是否 active 状态
    this._active = false;
}

// 原型
Justify$1.prototype = {
    constructor: Justify$1,

    onClick: function onClick(e) {
        var editor = this.editor;
        var $selectionElem = editor.selection.getSelectionListElem();
        var $elem = this.$elem;
        $selectionElem = $selectionElem.filter(function (elem) {
            var name = elem.getNodeName();
            return name === 'H1' || name === 'P' || name === 'H2';
        });
        var lengthElem = $selectionElem.length;

        if (lengthElem == 1) {
            //选中单行区域

            if (this.isJustifyCenter($selectionElem)) {
                $selectionElem[0].css('text-align', '');
                $elem.removeClass('w-e-active');
            } else {
                $selectionElem[0].css('text-align', 'left');
                // editor.cmd.do('justifyCenter');
                $elem.addClass('w-e-active');
            }
        } else {
            //选择多行区域

            if (this.isJustifyCenter($selectionElem)) {
                $selectionElem.forEach(function (element) {
                    element.css('text-align', '');
                });
                $elem.removeClass('w-e-active');
            } else {
                $selectionElem.forEach(function (element) {
                    element.css('text-align', 'left');
                });
                // editor.cmd.do('justifyCenter');
                $elem.addClass('w-e-active');
            }
        }

        editor.selection.restoreSelection();
    },

    //判断选中区域是否处于居中状态
    isJustifyCenter: function isJustifyCenter(list) {
        var bool = false;
        var arr = [];
        //只判断选区中的 文本区域 H1，H2, P
        arr = list.filter(function (elem) {
            var name = elem.getNodeName();
            return name == 'H1' || name == 'P' || name == 'H2';
        });
        if (arr.length == 0) {
            return false;
        }
        bool = arr.every(function (elem) {
            return elem.css('text-align') === 'left';
        });
        return bool;
    },

    tryChangeActive: function tryChangeActive(e) {
        var editor = this.editor;
        var $elem = this.$elem;
        var $selectionELem = editor.selection.getSelectionListElem();
        // const cmdValue = editor.cmd.queryCommandState('justifyCenter');
        if (this.isJustifyCenter($selectionELem)) {
            this._active = true;
            $elem.addClass('w-e-active');
        } else {
            this._active = false;
            $elem.removeClass('w-e-active');
        }
    }
};

/*
    menu - justify
*/
// 构造函数
function Justify$2(editor) {
    this.editor = editor;
    this.$elem = $('<div class="w-e-menu" title="居右"><i class="w-e-icon-paragraph-right"></i></div>');
    this.type = 'click';

    // 当前是否 active 状态
    this._active = false;
}

// 原型
Justify$2.prototype = {
    constructor: Justify$2,

    onClick: function onClick(e) {
        var editor = this.editor;
        var $selectionElem = editor.selection.getSelectionListElem();
        var $elem = this.$elem;
        $selectionElem = $selectionElem.filter(function (elem) {
            var name = elem.getNodeName();
            return name === 'H1' || name === 'P' || name === 'H2';
        });
        var lengthElem = $selectionElem.length;

        if (lengthElem == 1) {
            //选中单行区域

            if (this.isJustifyCenter($selectionElem)) {
                $selectionElem[0].css('text-align', '');
                $elem.removeClass('w-e-active');
            } else {
                $selectionElem[0].css('text-align', 'right');
                // editor.cmd.do('justifyCenter');
                $elem.addClass('w-e-active');
            }
        } else {
            //选择多行区域

            if (this.isJustifyCenter($selectionElem)) {
                $selectionElem.forEach(function (element) {
                    element.css('text-align', '');
                });
                $elem.removeClass('w-e-active');
            } else {
                $selectionElem.forEach(function (element) {
                    element.css('text-align', 'right');
                });
                // editor.cmd.do('justifyCenter');
                $elem.addClass('w-e-active');
            }
        }

        editor.selection.restoreSelection();
    },

    //判断选中区域是否处于居中状态
    isJustifyCenter: function isJustifyCenter(list) {
        var bool = false;
        var arr = [];
        //只判断选区中的 文本区域 H1，H2, P
        arr = list.filter(function (elem) {
            var name = elem.getNodeName();
            return name == 'H1' || name == 'P' || name == 'H2';
        });
        if (arr.length == 0) {
            return false;
        }
        bool = arr.every(function (elem) {
            return elem.css('text-align') === 'right';
        });
        return bool;
    },

    tryChangeActive: function tryChangeActive(e) {
        var editor = this.editor;
        var $elem = this.$elem;
        var $selectionELem = editor.selection.getSelectionListElem();
        // const cmdValue = editor.cmd.queryCommandState('justifyCenter');
        if (this.isJustifyCenter($selectionELem)) {
            this._active = true;
            $elem.addClass('w-e-active');
        } else {
            this._active = false;
            $elem.removeClass('w-e-active');
        }
    }
};

/*
    所有菜单的汇总
*/

// 存储菜单的构造函数
var MenuConstructors = {};

MenuConstructors.bold = Bold;

// import Placeholders from './placeholders/index.js'
// MenuConstructors.placeholders = Placeholders

MenuConstructors.head = Head;

MenuConstructors.subhead = Subhead;

MenuConstructors.splitLine = SplitLine;

// import FontSize from './fontSize/index.js'
// MenuConstructors.fontSize = FontSize

// import FontName from './fontName/index.js'
// MenuConstructors.fontName = FontName

MenuConstructors.link = Link;

// import Italic from './italic/index.js'
// MenuConstructors.italic = Italic

MenuConstructors.redo = Redo;

// import StrikeThrough from './strikethrough/index.js'
// MenuConstructors.strikeThrough = StrikeThrough

// import Underline from './underline/index.js'
// MenuConstructors.underline = Underline

MenuConstructors.undo = Undo;

MenuConstructors.list = List;

// import Justify from './justify/index.js'
// MenuConstructors.justify = Justify

// import ForeColor from './foreColor/index.js'
// MenuConstructors.foreColor = ForeColor

// import BackColor from './backColor/index.js'
// MenuConstructors.backColor = BackColor

MenuConstructors.quote = Quote;

// import Code from './code/index.js'
// MenuConstructors.code = Code

// import Emoticon from './emoticon/index.js'
// MenuConstructors.emoticon = Emoticon

// import Table from './table/index.js'
// MenuConstructors.table = Table

MenuConstructors.video = Video;

MenuConstructors.image = Image;

MenuConstructors.audio = Audio;

MenuConstructors.justifyCenter = Justify;

MenuConstructors.justifyLeft = Justify$1;

MenuConstructors.justifyRight = Justify$2;

/*
    菜单集合
*/
// 构造函数
function Menus(editor) {
    this.editor = editor;
    this.menus = {};
}

// 修改原型
Menus.prototype = {
    constructor: Menus,

    // 初始化菜单
    init: function init() {
        var _this = this;

        var editor = this.editor;
        var config = editor.config || {};
        var configMenus = config.menus || []; // 获取配置中的菜单
        // console.log(configMenus, 'configMenus');

        // 根据配置信息，创建菜单
        configMenus.forEach(function (menuKey) {
            var MenuConstructor = MenuConstructors[menuKey];
            if (MenuConstructor && typeof MenuConstructor === 'function') {
                // 创建单个菜单
                _this.menus[menuKey] = new MenuConstructor(editor);
            }
        });

        // 添加到菜单栏
        this._addToToolbar();

        // 绑定事件
        this._bindEvent();
    },

    // 添加到菜单栏
    _addToToolbar: function _addToToolbar() {
        var editor = this.editor;
        var $toolbarElem = editor.$toolbarElem;
        var menus = this.menus;
        var config = editor.config;
        // config.zIndex 是配置的编辑区域的 z-index，菜单的 z-index 得在其基础上 +1
        var zIndex = config.zIndex + 1;
        objForEach(menus, function (key, menu) {
            var $elem = menu.$elem;
            if ($elem) {
                // 设置 z-index
                $elem.css('z-index', zIndex);
                $toolbarElem.append($elem);
            }
        });
    },

    // 绑定菜单 click mouseenter 事件
    _bindEvent: function _bindEvent() {
        var _this2 = this;

        var menus = this.menus;
        var editor = this.editor;
        objForEach(menus, function (key, menu) {
            var type = menu.type;
            if (!type) {
                return;
            }
            var $elem = menu.$elem;
            var droplist = menu.droplist;
            // const panel = menu.panel

            // 点击类型，例如 bold
            if (type === 'click' && menu.onClick) {
                $elem.on('click', function (e) {
                    if (editor.selection.getRange() == null) {
                        return;
                    }
                    menu.onClick(e);
                    setTimeout(function () {
                        _this2.changeActive();
                    }, 20);
                });
            }

            // // 下拉框，例如 head
            // if (type === 'droplist' && droplist) {
            //     $elem.on('mouseenter', e => {
            //         if (editor.selection.getRange() == null) {
            //             return
            //         }
            //         // 显示
            //         droplist.showTimeoutId = setTimeout(() => {
            //             droplist.show()
            //         }, 200)
            //     }).on('mouseleave', e => {
            //         // 隐藏
            //         droplist.hideTimeoutId = setTimeout(() => {
            //             droplist.hide()
            //         }, 0)
            //     })
            // }

            // 弹框类型，例如 link
            if (type === 'panel' && menu.onClick) {
                $elem.on('click', function (e) {
                    e.stopPropagation();
                    if (editor.selection.getRange() == null) {
                        return;
                    }
                    // 在自定义事件中显示 panel
                    menu.onClick(e);
                });
            }
        });
    },

    // 尝试修改菜单状态
    changeActive: function changeActive() {
        var menus = this.menus;
        objForEach(menus, function (key, menu) {
            if (menu.tryChangeActive) {
                setTimeout(function () {
                    menu.tryChangeActive();
                }, 100);
            }
        });
    }
};

/*
    粘贴信息的处理
*/

// 获取粘贴的纯文本
function getPasteText(e) {
    var clipboardData = e.clipboardData || e.originalEvent && e.originalEvent.clipboardData;
    var pasteText = void 0;
    if (clipboardData == null) {
        pasteText = window.clipboardData && window.clipboardData.getData('text');
    } else {
        pasteText = clipboardData.getData('text/plain');
    }

    return replaceHtmlSymbol(pasteText);
}

// 获取粘贴的html
function getPasteHtml(e, filterStyle, ignoreImg) {
    var clipboardData = e.clipboardData || e.originalEvent && e.originalEvent.clipboardData;
    var pasteText = void 0,
        pasteHtml = void 0;
    if (clipboardData == null) {
        pasteText = window.clipboardData && window.clipboardData.getData('text');
    } else {
        pasteText = clipboardData.getData('text/plain');
    }

    // console.log(pasteText, 'pasteText')
    pasteHtml = '';
    if (pasteText) {
        pasteText.split('\n').forEach(function (item) {
            if (item && item !== '\n') {
                pasteHtml += '<p>' + replaceHtmlSymbol(item) + '</p>';
            }
        });
    }

    if (!pasteHtml) {
        return;
    }

    // 过滤word中状态过来的无用字符
    var docSplitHtml = pasteHtml.split('</html>');
    if (docSplitHtml.length === 2) {
        pasteHtml = docSplitHtml[0];
    }

    // 过滤无用标签
    pasteHtml = pasteHtml.replace(/<(meta|script|link).+?>/igm, '');
    // 去掉注释
    pasteHtml = pasteHtml.replace(/<!--.*?-->/mg, '');
    // 去掉空的p标签
    pasteHtml = pasteHtml.replace(/<p>[\s\t\n]{1}<\/p>/mg, '');
    //去掉非法字符
    pasteHtml = pasteHtml.replace(/\u200B/g, '');
    // 过滤 data-xxx 属性
    pasteHtml = pasteHtml.replace(/\s?data-.+?=('|").+?('|")/igm, '');

    if (ignoreImg) {
        // 忽略图片
        pasteHtml = pasteHtml.replace(/<img.+?>/igm, '');
    }

    if (filterStyle) {
        // 过滤样式
        pasteHtml = pasteHtml.replace(/\s?(class|style)=('|").*?('|")/igm, '');
    } else {
        // 保留样式
        pasteHtml = pasteHtml.replace(/\s?class=('|").*?('|")/igm, '');
    }

    return pasteHtml;
}

// 获取粘贴的图片文件
function getPasteImgs(e) {
    var result = [];
    var txt = getPasteText(e);
    if (txt) {
        // 有文字，就忽略图片
        return result;
    }

    var clipboardData = e.clipboardData || e.originalEvent && e.originalEvent.clipboardData || {};
    var items = clipboardData.items;
    if (!items) {
        return result;
    }

    objForEach(items, function (key, value) {
        var type = value.type;
        if (/image/i.test(type)) {
            result.push(value.getAsFile());
        }
    });

    return result;
}

/*
    编辑区域
*/

// 获取一个 elem.childNodes 的 JSON 数据
function getChildrenJSON($elem) {
    var result = [];
    var $children = $elem.childNodes() || []; // 注意 childNodes() 可以获取文本节点
    $children.forEach(function (curElem) {
        var elemResult = void 0;
        var nodeType = curElem.nodeType;

        // 文本节点
        if (nodeType === 3) {
            elemResult = curElem.textContent;
            elemResult = replaceHtmlSymbol(elemResult);
        }

        // 普通 DOM 节点
        if (nodeType === 1) {
            elemResult = {};

            // tag
            elemResult.tag = curElem.nodeName.toLowerCase();
            // attr
            var attrData = [];
            var attrList = curElem.attributes || {};
            var attrListLength = attrList.length || 0;
            for (var i = 0; i < attrListLength; i++) {
                var attr = attrList[i];
                //对于编辑区的input，记录其输入的值
                if (elemResult.tag == 'input' && attr.name == 'value') {
                    attr.value = curElem.value;
                }
                attrData.push({
                    name: attr.name,
                    value: attr.value
                });
            }
            elemResult.attrs = attrData;
            // children（递归）
            elemResult.children = getChildrenJSON($(curElem));
        }

        result.push(elemResult);
    });
    return result;
}

// 构造函数
function Text(editor) {
    this.editor = editor;
}

// 修改原型
Text.prototype = {
    constructor: Text,

    // 初始化
    init: function init() {
        // 绑定事件
        this._bindEvent();
    },

    // 清空内容
    clear: function clear() {
        this.html('<p><br></p>');
    },

    // 获取 设置 html
    html: function html(val) {
        var editor = this.editor;
        var $textElem = editor.$textElem;
        var html = void 0;
        if (val == null) {
            html = $textElem.html();
            // 未选中任何内容的时候点击“加粗”或者“斜体”等按钮，就得需要一个空的占位符 &#8203 ，这里替换掉
            html = html.replace(/\u200b/gm, '');
            return html;
        } else {
            $textElem.html(val);

            // 初始化选取，将光标定位到内容尾部
            editor.initSelection();
        }
    },

    // 获取 JSON
    getJSON: function getJSON() {
        var editor = this.editor;
        var $textElem = editor.$textElem;
        return getChildrenJSON($textElem);
    },

    // 获取 设置 text
    text: function text(val) {
        var editor = this.editor;
        var $textElem = editor.$textElem;
        var text = void 0;
        if (val == null) {
            text = $textElem.text();
            // 未选中任何内容的时候点击“加粗”或者“斜体”等按钮，就得需要一个空的占位符 &#8203 ，这里替换掉
            text = text.replace(/\u200b/gm, '');
            return text;
        } else {
            $textElem.text('<p>' + val + '</p>');

            // 初始化选取，将光标定位到内容尾部
            editor.initSelection();
        }
    },

    // 追加内容
    append: function append(html) {
        var editor = this.editor;
        var $textElem = editor.$textElem;
        $textElem.append($(html));

        // 初始化选取，将光标定位到内容尾部
        editor.initSelection();
    },

    // 绑定事件
    _bindEvent: function _bindEvent() {
        // 实时保存选取
        this._saveRangeRealTime();

        // 按回车建时的特殊处理
        this._enterKeyHandle();

        // 清空时保留 <p><br></p>
        this._clearHandle();

        // 粘贴事件（粘贴文字，粘贴图片）
        this._pasteHandle();

        // tab 特殊处理
        this._tabHandle();

        // img 点击
        this._imgHandle();

        // 拖拽事件
        this._dragHandle();
    },

    // 实时保存选取
    _saveRangeRealTime: function _saveRangeRealTime() {
        var editor = this.editor;
        var $textElem = editor.$textElem;

        // 保存当前的选区
        function saveRange(e) {
            // 随时保存选区
            editor.selection.saveRange();
            // 更新按钮 ative 状态
            editor.menus.changeActive();
        }
        // 按键后保存
        $textElem.on('keyup', saveRange);
        $textElem.on('mousedown', function (e) {
            // mousedown 状态下，鼠标滑动到编辑区域外面，也需要保存选区
            $textElem.on('mouseleave', saveRange);
        });
        $textElem.on('mouseup', function (e) {
            saveRange();
            // 在编辑器区域之内完成点击，取消鼠标滑动到编辑区外面的事件
            $textElem.off('mouseleave', saveRange);
        });
    },

    // 按回车键时的特殊处理
    _enterKeyHandle: function _enterKeyHandle() {
        var editor = this.editor;
        var $textElem = editor.$textElem;

        function insertEmptyP($selectionElem) {
            var $p = $('<p><br></p>');
            $p.insertBefore($selectionElem);
            editor.selection.createRangeByElem($p, true);
            editor.selection.restoreSelection();
            $selectionElem.remove();
        }

        // 将回车之后生成的非 <p> 的顶级标签，改为 <p>
        function pHandle(e) {
            var $selectionElem = editor.selection.getSelectionContainerElem();
            var $parentElem = $selectionElem.parent();

            if ($parentElem.html() === '<code><br></code>') {
                // 回车之前光标所在一个 <p><code>.....</code></p> ，忽然回车生成一个空的 <p><code><br></code></p>
                // 而且继续回车跳不出去，因此只能特殊处理
                insertEmptyP($selectionElem);
                return;
            }

            if (!$parentElem.equal($textElem)) {
                // 不是顶级标签
                return;
            }

            var nodeName = $selectionElem.getNodeName();
            if (nodeName === 'P') {
                // 当前的标签是 P ，不用做处理
                return;
            }

            if ($selectionElem.text()) {
                // 有内容，不做处理
                return;
            }

            // 插入 <p> ，并将选取定位到 <p>，删除当前标签
            insertEmptyP($selectionElem);
        }

        $textElem.on('keyup', function (e) {
            if (e.keyCode !== 13) {
                // 不是回车键
                return;
            }
            // 将回车之后生成的非 <p> 的顶级标签，改为 <p>
            pHandle(e);
        });

        // <pre><code></code></pre> 回车时 特殊处理
        function codeHandle(e) {
            var $selectionElem = editor.selection.getSelectionContainerElem();
            if (!$selectionElem) {
                return;
            }
            var $parentElem = $selectionElem.parent();
            var selectionNodeName = $selectionElem.getNodeName();
            var parentNodeName = $parentElem.getNodeName();

            if (selectionNodeName !== 'CODE' || parentNodeName !== 'PRE') {
                // 不符合要求 忽略
                return;
            }

            if (!editor.cmd.queryCommandSupported('insertHTML')) {
                // 必须原生支持 insertHTML 命令
                return;
            }

            // 处理：光标定位到代码末尾，联系点击两次回车，即跳出代码块
            if (editor._willBreakCode === true) {
                // 此时可以跳出代码块
                // 插入 <p> ，并将选取定位到 <p>
                var $p = $('<p><br></p>');
                $p.insertAfter($parentElem);
                editor.selection.createRangeByElem($p, true);
                editor.selection.restoreSelection();

                // 修改状态
                editor._willBreakCode = false;

                e.preventDefault();
                return;
            }

            var _startOffset = editor.selection.getRange().startOffset;

            // 处理：回车时，不能插入 <br> 而是插入 \n ，因为是在 pre 标签里面
            editor.cmd.do('insertHTML', '\n');
            editor.selection.saveRange();
            if (editor.selection.getRange().startOffset === _startOffset) {
                // 没起作用，再来一遍
                editor.cmd.do('insertHTML', '\n');
            }

            var codeLength = $selectionElem.html().length;
            if (editor.selection.getRange().startOffset + 1 === codeLength) {
                // 说明光标在代码最后的位置，执行了回车操作
                // 记录下来，以便下次回车时候跳出 code
                editor._willBreakCode = true;
            }

            // 阻止默认行为
            e.preventDefault();
        }

        $textElem.on('keydown', function (e) {
            if (e.keyCode !== 13) {
                // 不是回车键
                // 取消即将跳转代码块的记录
                editor._willBreakCode = false;
                return;
            }
            // <pre><code></code></pre> 回车时 特殊处理
            codeHandle(e);
        });
    },

    // 清空时保留 <p><br></p>
    _clearHandle: function _clearHandle() {
        var editor = this.editor;
        var $textElem = editor.$textElem;

        $textElem.on('keydown', function (e) {
            if (e.keyCode !== 8) {
                return;
            }
            var txtHtml = $textElem.html().toLowerCase().trim();
            if (txtHtml === '<p><br></p>') {
                // 最后剩下一个空行，就不再删除了
                e.preventDefault();
                return;
            }
        });

        $textElem.on('keyup', function (e) {
            if (e.keyCode !== 8) {
                return;
            }
            var $p = void 0;
            var txtHtml = $textElem.html().toLowerCase().trim();

            // firefox 时用 txtHtml === '<br>' 判断，其他用 !txtHtml 判断
            if (!txtHtml || txtHtml === '<br>') {
                // 内容空了
                $p = $('<p><br/></p>');
                $textElem.html(''); // 一定要先清空，否则在 firefox 下有问题
                $textElem.append($p);
                editor.selection.createRangeByElem($p, false, true);
                editor.selection.restoreSelection();
            }
        });
    },

    // 粘贴事件（粘贴文字 粘贴图片）
    _pasteHandle: function _pasteHandle() {
        var editor = this.editor;
        var config = editor.config;
        var pasteFilterStyle = config.pasteFilterStyle;
        var pasteTextHandle = config.pasteTextHandle;
        var ignoreImg = config.pasteIgnoreImg;
        var $textElem = editor.$textElem;

        // 粘贴图片、文本的事件，每次只能执行一个
        // 判断该次粘贴事件是否可以执行
        var pasteTime = 0;
        function canDo() {
            var now = Date.now();
            var flag = false;
            if (now - pasteTime >= 100) {
                // 间隔大于 100 ms ，可以执行
                flag = true;
            }
            pasteTime = now;
            return flag;
        }
        function resetTime() {
            pasteTime = 0;
        }

        // 粘贴文字
        $textElem.on('paste', function (e) {
            if (UA.isIE()) {
                return;
            } else {
                // 阻止默认行为，使用 execCommand 的粘贴命令
                e.preventDefault();
            }

            // 粘贴图片和文本，只能同时使用一个
            if (!canDo()) {
                return;
            }

            // 获取粘贴的文字
            var pasteHtml = getPasteHtml(e, pasteFilterStyle, ignoreImg);
            var pasteText = getPasteText(e);
            pasteText = pasteText.replace(/\n/gm, '<br>');
            // console.log(e, '文字粘贴', pasteHtml);

            var $selectionElem = editor.selection.getSelectionContainerElem();
            if (!$selectionElem) {
                return;
            }
            var nodeName = $selectionElem.getNodeName();

            //富文本中输入框的粘贴
            var bool = false,
                activeElement = void 0;
            if (document.hasFocus() && document.activeElement) {
                document.querySelectorAll('.input-p input').forEach(function (item) {
                    if (document.activeElement == item) {
                        activeElement = item;
                        bool = true;
                    }
                });
                if (bool) {
                    var setCaretPosition = function setCaretPosition(ctrl, pos) {
                        if (ctrl.setSelectionRange) {
                            ctrl.focus();
                            ctrl.setSelectionRange(pos, pos);
                        } else if (ctrl.createTextRange) {
                            var range = ctrl.createTextRange();
                            range.collapse(true);
                            range.moveEnd('character', pos);
                            range.moveStart('character', pos);
                            range.select();
                        }
                    };

                    pasteText = pasteText.replace(/<br>/gm, '；').replace(/&lt;/gm, '<').replace(/&gt;/gm, '>').replace(/&quot;/gm, '"');
                    var start = activeElement.selectionStart,
                        end = activeElement.selectionEnd;
                    var str = activeElement.value.substring(0, start) + pasteText + activeElement.value.substring(end);
                    activeElement.value = pasteTextHandle(str) || '';
                    //设置光标到指定位置
                    setCaretPosition(activeElement, start + pasteText.length);

                    return;
                }
            }

            // code 中只能粘贴纯文本
            if (nodeName === 'CODE' || nodeName === 'PRE') {
                if (pasteTextHandle && isFunction(pasteTextHandle)) {
                    // 用户自定义过滤处理粘贴内容
                    pasteText = '' + (pasteTextHandle(pasteText) || '');
                }
                editor.cmd.do('insertHTML', '<p>' + pasteText + '</p>');
                return;
            }

            if (nodeName == 'BLOCKQUOTE') {
                editor.cmd.do('insertHTML', '<span>' + pasteText + '</span>');
                return;
            }

            // 先放开注释，有问题再追查 ————
            // // 表格中忽略，可能会出现异常问题
            // if (nodeName === 'TD' || nodeName === 'TH') {
            //     return
            // }

            if (!pasteHtml) {
                // 没有内容，可继续执行下面的图片粘贴
                resetTime();
                return;
            }
            try {
                // firefox 中，获取的 pasteHtml 可能是没有 <ul> 包裹的 <li>
                // 因此执行 insertHTML 会报错
                if (pasteTextHandle && isFunction(pasteTextHandle)) {
                    // 用户自定义过滤处理粘贴内容
                    pasteHtml = '' + (pasteTextHandle(pasteHtml) || '');
                }
                editor.cmd.do('insertHTML', pasteHtml);
            } catch (ex) {
                // 此时使用 pasteText 来兼容一下
                if (pasteTextHandle && isFunction(pasteTextHandle)) {
                    // 用户自定义过滤处理粘贴内容
                    pasteText = '' + (pasteTextHandle(pasteText) || '');
                }
                editor.cmd.do('insertHTML', '<p>' + pasteText + '</p>');
            }
        });

        // 粘贴图片
        $textElem.on('paste', function (e) {
            if (UA.isIE()) {
                return;
            } else {
                e.preventDefault();
            }

            // 粘贴图片和文本，只能同时使用一个
            if (!canDo()) {
                return;
            }

            // console.log(e, '粘贴图片');

            // 获取粘贴的图片
            var pasteFiles = getPasteImgs(e);
            if (!pasteFiles || !pasteFiles.length) {
                return;
            }

            // 获取当前的元素
            var $selectionElem = editor.selection.getSelectionContainerElem();
            if (!$selectionElem) {
                return;
            }
            var nodeName = $selectionElem.getNodeName();

            // code 中粘贴忽略
            if (nodeName === 'CODE' || nodeName === 'PRE') {
                return;
            }

            if (nodeName == 'BLOCKQUOTE') {
                editor.cmd.do('insertText', '' + pasteText);
            }

            // 上传图片
            var uploadImg = editor.uploadImg;
            uploadImg.uploadImg(pasteFiles);
        });
    },

    // tab 特殊处理
    _tabHandle: function _tabHandle() {
        var editor = this.editor;
        var $textElem = editor.$textElem;

        $textElem.on('keydown', function (e) {
            if (e.keyCode !== 9) {
                return;
            }
            if (!editor.cmd.queryCommandSupported('insertHTML')) {
                // 必须原生支持 insertHTML 命令
                return;
            }
            var $selectionElem = editor.selection.getSelectionContainerElem();
            if (!$selectionElem) {
                return;
            }
            var $parentElem = $selectionElem.parent();
            var selectionNodeName = $selectionElem.getNodeName();
            var parentNodeName = $parentElem.getNodeName();

            if (selectionNodeName === 'CODE' && parentNodeName === 'PRE') {
                // <pre><code> 里面
                editor.cmd.do('insertHTML', '    ');
            } else {
                // 普通文字
                editor.cmd.do('insertHTML', '&nbsp;&nbsp;&nbsp;&nbsp;');
            }

            e.preventDefault();
        });
    },

    // img 点击
    _imgHandle: function _imgHandle() {
        var editor = this.editor;
        var $textElem = editor.$textElem;

        // 为图片增加 selected 样式
        $textElem.on('click', 'img', function (e) {
            var img = this;
            var $img = $(img);

            if ($img.attr('data-w-e') === '1') {
                // 是表情图片，忽略
                return;
            }

            // 记录当前点击过的图片
            editor._selectedImg = $img;

            // 修改选区并 restore ，防止用户此时点击退格键，会删除其他内容
            editor.selection.createRangeByElem($img);
            editor.selection.restoreSelection();
        });

        // 去掉图片的 selected 样式
        $textElem.on('click  keyup', function (e) {
            if (e.target.matches('img')) {
                // 点击的是图片，忽略
                return;
            }
            // 删除记录
            editor._selectedImg = null;
        });
    },

    // 拖拽事件
    _dragHandle: function _dragHandle() {
        var editor = this.editor;

        // 禁用 document 拖拽事件
        var $document = $(document);
        $document.on('dragleave drop dragenter dragover', function (e) {
            e.preventDefault();
        });

        // 添加编辑区域拖拽事件
        var $textElem = editor.$textElem;
        $textElem.on('drop', function (e) {
            e.preventDefault();
            var files = e.dataTransfer && e.dataTransfer.files;
            if (!files || !files.length) {
                return;
            }

            // 上传图片
            var uploadImg = editor.uploadImg;
            uploadImg.uploadImg(files);
        });
    }
};

/*
    命令，封装 document.execCommand
*/

// 构造函数
function Command(editor) {
    this.editor = editor;
}

// 修改原型
Command.prototype = {
    constructor: Command,

    // 执行命令
    do: function _do(name, value) {
        var editor = this.editor;

        // 使用 styleWithCSS
        if (!editor._useStyleWithCSS) {
            document.execCommand('styleWithCSS', null, true);
            editor._useStyleWithCSS = true;
        }

        // 如果无选区，忽略
        if (!editor.selection.getRange()) {
            return;
        }

        // 恢复选取
        editor.selection.restoreSelection();

        // 执行
        var _name = '_' + name;
        if (this[_name]) {
            // 有自定义事件
            this[_name](value);
        } else {
            // 默认 command
            this._execCommand(name, value);
        }

        // 修改菜单状态
        editor.menus.changeActive();

        // 最后，恢复选取保证光标在原来的位置闪烁
        editor.selection.saveRange();
        editor.selection.restoreSelection();

        // 触发 onchange
        editor.change && editor.change();
    },

    // 自定义 insertHTML 事件
    _insertHTML: function _insertHTML(html) {
        var editor = this.editor;
        var range = editor.selection.getRange();

        if (this.queryCommandSupported('insertHTML')) {
            // W3C
            this._execCommand('insertHTML', html);
        } else if (range.insertNode) {
            // IE
            range.deleteContents();
            range.insertNode($(html)[0]);
        } else if (range.pasteHTML) {
            // IE <= 10
            range.pasteHTML(html);
        }
    },

    // 插入 elem
    _insertElem: function _insertElem($elem) {
        var editor = this.editor;
        var range = editor.selection.getRange();

        if (range.insertNode) {
            range.deleteContents();
            range.insertNode($elem[0]);
        }
    },

    // 封装 execCommand
    _execCommand: function _execCommand(name, value) {
        document.execCommand(name, false, value);
    },

    // 封装 document.queryCommandValue
    queryCommandValue: function queryCommandValue(name) {
        return document.queryCommandValue(name);
    },

    // 封装 document.queryCommandState
    queryCommandState: function queryCommandState(name) {
        return document.queryCommandState(name);
    },

    // 封装 document.queryCommandSupported
    queryCommandSupported: function queryCommandSupported(name) {
        return document.queryCommandSupported(name);
    }
};

/*
    selection range API
*/

// 构造函数
function API(editor) {
    this.editor = editor;
    this._currentRange = null;
}

// 修改原型
API.prototype = {
    constructor: API,

    // 获取 range 对象
    getRange: function getRange() {
        return this._currentRange;
    },

    // 保存选区
    saveRange: function saveRange(_range) {
        if (_range) {
            // 保存已有选区
            this._currentRange = _range;
            return;
        }

        // 获取当前的选区
        var selection = window.getSelection();
        if (selection.rangeCount === 0) {
            return;
        }
        var range = selection.getRangeAt(0);

        // 判断选区内容是否在编辑内容之内
        var $containerElem = this.getSelectionContainerElem(range);
        if (!$containerElem) {
            return;
        }

        // 判断选区内容是否在不可编辑区域之内
        if ($containerElem.attr('contenteditable') === 'false' || $containerElem.parentUntil('[contenteditable=false]')) {
            return;
        }

        var editor = this.editor;
        var $textElem = editor.$textElem;
        if ($textElem.isContain($containerElem)) {
            // 是编辑内容之内的
            this._currentRange = range;
        }
    },

    // 折叠选区
    collapseRange: function collapseRange(toStart) {
        if (toStart == null) {
            // 默认为 false
            toStart = false;
        }
        var range = this._currentRange;
        if (range) {
            range.collapse(toStart);
        }
    },

    // 选中区域的文字
    getSelectionText: function getSelectionText() {
        var range = this._currentRange;
        if (range) {
            return this._currentRange.toString();
        } else {
            return '';
        }
    },

    // 选区的 $Elem
    getSelectionContainerElem: function getSelectionContainerElem(range) {
        range = range || this._currentRange;
        var elem = void 0;
        if (range) {
            elem = range.commonAncestorContainer;
            return $(elem.nodeType === 1 ? elem : elem.parentNode);
        }
    },
    getSelectionStartElem: function getSelectionStartElem(range) {
        range = range || this._currentRange;
        var elem = void 0;
        if (range) {
            elem = range.startContainer;
            return $(elem.nodeType === 1 ? elem : elem.parentNode);
        }
    },
    getSelectionEndElem: function getSelectionEndElem(range) {
        range = range || this._currentRange;
        var elem = void 0;
        if (range) {
            elem = range.endContainer;
            return $(elem.nodeType === 1 ? elem : elem.parentNode);
        }
    },
    //获取选中区域的所有一级dom
    getSelectionListElem: function getSelectionListElem(range) {
        range = range || this._currentRange;
        var elems = [];
        if (!range) {
            return;
        }

        var start = null,
            end = null,
            content = $('.w-e-text').children();

        var dom = $(range.startContainer);
        //判断当前选区是否为全部区域
        if (dom.getNodeType() === 1 && dom.getNodeName() === 'DIV' && dom.getClass() === 'w-e-text') {
            var length = content.length;
            for (var j = 0; j < length; j++) {
                var _dom = $(content[j]);
                var name = _dom.getNodeName();
                if (name == 'P' || name == 'H1' || name == 'H2') {
                    elems.push(_dom);
                }
            }
            return elems;
        }

        // console.log(range, dom, dom.getNodeType())
        while (dom.getNodeType() !== 1 || dom.getNodeName() !== 'DIV' || dom.getClass() !== 'w-e-text') {
            start = dom;
            dom = dom.parent();
            // console.log('查询：', start, dom)
        }
        var dom1 = $(range.endContainer);
        while (dom1.getNodeType() !== 1 || dom1.getNodeName() !== 'DIV' || dom1.getClass() !== 'w-e-text') {
            end = dom1;
            dom1 = dom1.parent();
            // console.log('查询：', end, dom1)
        }
        // console.log('当前dom:', content, range, start, end);

        if (start[0] === end[0]) {
            //选择单个dom，返回光标所在dom

            elems.push(start);
        } else {
            //选择多个dom 包含起始位置的所有dom

            var _length = content.length,
                startIndex = 0,
                endIndex = _length - 1;
            for (var i = 0; i < _length; i++) {
                if (content[i] == start[0]) {
                    startIndex = i;
                }
                if (content[i] == end[0]) {
                    endIndex = i;
                }
            }
            // console.log(content, startIndex, endIndex);
            for (var _j = startIndex; _j <= endIndex; _j++) {
                var _dom2 = $(content[_j]);
                var _name = _dom2.getNodeName();
                if (_name == 'P' || _name == 'H1' || _name == 'H2') {
                    elems.push(_dom2);
                }
            }
        }

        return elems;
    },

    //设置选区的起点
    setSelectionStart: function setSelectionStart(node) {
        var offset = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;

        var range = this._currentRange;
        if (range && node) {
            range.setStart(node, offset);
        }
    },

    //设置选区的终点
    setSelectionEnd: function setSelectionEnd(node) {
        var offset = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;

        var range = this._currentRange;
        if (range && node) {
            range.setEnd(node, offset);
        }
    },

    // 选区是否为空
    isSelectionEmpty: function isSelectionEmpty() {
        var range = this._currentRange;
        if (range && range.startContainer) {
            if (range.startContainer === range.endContainer) {
                if (range.startOffset === range.endOffset) {
                    return true;
                }
            }
        }
        return false;
    },

    // 恢复选区
    restoreSelection: function restoreSelection() {
        var selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(this._currentRange);
    },

    // 创建一个空白（即 &#8203 字符）选区
    createEmptyRange: function createEmptyRange() {
        var editor = this.editor;
        var range = this.getRange();
        var $elem = void 0;

        if (!range) {
            // 当前无 range
            return;
        }
        if (!this.isSelectionEmpty()) {
            // 当前选区必须没有内容才可以
            return;
        }

        try {
            // 目前只支持 webkit 内核
            if (UA.isWebkit()) {
                // 插入 &#8203
                editor.cmd.do('insertHTML', '&#8203;');
                // 修改 offset 位置
                range.setEnd(range.endContainer, range.endOffset + 1);
                // 存储
                this.saveRange(range);
            } else {
                $elem = $('<strong>&#8203;</strong>');
                editor.cmd.do('insertElem', $elem);
                this.createRangeByElem($elem, true);
            }
        } catch (ex) {
            // 部分情况下会报错，兼容一下
        }
    },

    // 根据 $Elem 设置选区
    createRangeByElem: function createRangeByElem($elem, toStart, isContent) {
        // $elem - 经过封装的 elem
        // toStart - true 开始位置，false 结束位置
        // isContent - 是否选中Elem的内容
        if (!$elem.length) {
            return;
        }

        var elem = $elem[0];
        var range = document.createRange();

        if (isContent) {
            range.selectNodeContents(elem);
        } else {
            range.selectNode(elem);
        }

        if (typeof toStart === 'boolean') {
            range.collapse(toStart);
        }

        // 存储 range
        this.saveRange(range);
    }
};

/*
    上传进度条
*/

function Progress(editor) {
    this.editor = editor;
    this._time = 0;
    this._isShow = false;
    this._isRender = false;
    this._timeoutId = 0;
    this.$textContainer = editor.$textContainerElem;
    this.$bar = $('<div class="w-e-progress"></div>');
}

Progress.prototype = {
    constructor: Progress,

    show: function show(progress) {
        var _this = this;

        // 状态处理
        if (this._isShow) {
            return;
        }
        this._isShow = true;

        // 渲染
        var $bar = this.$bar;
        if (!this._isRender) {
            var $textContainer = this.$textContainer;
            $textContainer.append($bar);
        } else {
            this._isRender = true;
        }

        // 改变进度（节流，100ms 渲染一次）
        if (Date.now() - this._time > 100) {
            if (progress <= 1) {
                $bar.css('width', progress * 100 + '%');
                this._time = Date.now();
            }
        }

        // 隐藏
        var timeoutId = this._timeoutId;
        if (timeoutId) {
            clearTimeout(timeoutId);
        }
        timeoutId = setTimeout(function () {
            _this._hide();
        }, 500);
    },

    _hide: function _hide() {
        var $bar = this.$bar;
        $bar.remove();

        // 修改状态
        this._time = 0;
        this._isShow = false;
        this._isRender = false;
    }
};

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) {
  return typeof obj;
} : function (obj) {
  return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
};

/*
    上传图片
*/

// 构造函数
function UploadImg(editor) {
    this.editor = editor;
    this.imgEvent = [];
}

// 原型
UploadImg.prototype = {
    constructor: UploadImg,

    // 根据 debug 弹出不同的信息
    _alert: function _alert(alertInfo, debugInfo) {
        var editor = this.editor;
        var debug = editor.config.debug;
        var customAlert = editor.config.customAlert;

        if (debug) {
            throw new Error('wangEditor: ' + (debugInfo || alertInfo));
        } else {
            if (customAlert && typeof customAlert === 'function') {
                customAlert(alertInfo);
            } else {
                alert(alertInfo);
            }
        }
    },

    // 根据链接插入图片
    insertLinkImg: function insertLinkImg(link) {
        var _this2 = this;

        if (!link) {
            return;
        }
        var editor = this.editor;
        var config = editor.config;

        //创建新的图片id
        var randomId = getRandom('kolo-img');

        // 校验格式
        var linkImgCheck = config.linkImgCheck;
        var checkResult = void 0;
        if (linkImgCheck && typeof linkImgCheck === 'function') {
            checkResult = linkImgCheck(link);
            if (typeof checkResult === 'string') {
                // 校验失败，提示信息
                alert(checkResult);
                return;
            }
        }

        editor.cmd.do('insertHTML', '<div class="kolo-img" contenteditable="false">\n            <img preview="0" preview-text="\u63CF\u8FF0\u6587\u5B57" src="' + link + '" style="max-width:100%;"/>\n            <i class="w-e-icon-close" id="' + randomId + '" ><img src="https://qncdn.file.sinostage.com/close.svg"/></i><br/>\n         </div><p>&#8203;<br></p>');

        // this.imgEvent.push({
        //     selector: '#' + randomId,
        //     type: 'delete',
        //     fn: (selector)=>{
        //         document.querySelector(selector).addEventListener('click', (e)=>{
        //             e.stopPropagation();
        //             let target = e.target.parentNode;
        //             target.parentNode.removeChild(target);
        //             this.imgEvent.forEach((item, index)=>{
        //                 if(item.selector == selector) {
        //                     this.imgEvent.splice(index, 1);
        //                 }
        //             })
        //         })
        //     }
        // })
        this.imgEvent.forEach(function (item) {
            item.fn(item.selector);
        });

        // 验证图片 url 是否有效，无效的话给出提示
        var img = document.createElement('img');
        img.onload = function () {
            var callback = config.linkImgCallback;
            if (callback && typeof callback === 'function') {
                callback(link);
            }

            img = null;
        };
        img.onerror = function () {
            img = null;
            // 无法成功下载图片
            _this2._alert('插入图片错误', 'error: \u63D2\u5165\u56FE\u7247\u51FA\u9519\uFF0C\u56FE\u7247\u94FE\u63A5\u662F "' + link + '"');
            return;
        };
        img.onabort = function () {
            img = null;
        };
        img.src = link;
    },

    // 上传图片
    uploadImg: function uploadImg(files) {
        var _this3 = this;

        if (!files || !files.length) {
            return;
        }

        // ------------------------------ 获取配置信息 ------------------------------
        var editor = this.editor;
        var config = editor.config;
        var uploadImgServer = config.uploadImgServer;
        var uploadImgShowBase64 = config.uploadImgShowBase64;

        var maxSize = config.uploadImgMaxSize;
        var maxSizeM = maxSize / 1024 / 1024;
        var maxLength = config.uploadImgMaxLength || 10000;
        var uploadFileName = config.uploadFileName || '';
        var uploadImgParams = config.uploadImgParams || {};
        var uploadImgParamsWithUrl = config.uploadImgParamsWithUrl;
        var uploadImgHeaders = config.uploadImgHeaders || {};
        var hooks = config.uploadImgHooks || {};
        var timeout = config.uploadImgTimeout || 3000;
        var withCredentials = config.withCredentials;
        if (withCredentials == null) {
            withCredentials = false;
        }
        var customUploadImg = config.customUploadImg;

        if (!customUploadImg) {
            // 没有 customUploadImg 的情况下，需要如下两个配置才能继续进行图片上传
            if (!uploadImgServer && !uploadImgShowBase64) {
                return;
            }
        }

        // ------------------------------ 验证文件信息 ------------------------------
        var resultFiles = [];
        var errInfo = [];
        arrForEach(files, function (file) {
            var name = file.name;
            var size = file.size;

            // chrome 低版本 name === undefined
            if (!name || !size) {
                return;
            }

            if (/\.(jpg|jpeg|png|bmp|gif|webp)$/i.test(name) === false) {
                // 后缀名不合法，不是图片
                errInfo.push('\u3010' + name + '\u3011\u4E0D\u662F\u56FE\u7247');
                return;
            }
            if (maxSize < size) {
                // 上传图片过大
                errInfo.push('\u3010' + name + '\u3011\u5927\u4E8E ' + maxSizeM + 'M');
                return;
            }

            // 验证通过的加入结果列表
            resultFiles.push(file);
        });
        // 抛出验证信息
        if (errInfo.length) {
            this._alert('图片验证未通过: \n' + errInfo.join('\n'));
            return;
        }
        if (resultFiles.length > maxLength) {
            this._alert('一次最多上传' + maxLength + '张图片');
            return;
        }

        // ------------------------------ 自定义上传 ------------------------------
        if (customUploadImg && typeof customUploadImg === 'function') {
            customUploadImg(resultFiles, this.insertLinkImg.bind(this));

            // 阻止以下代码执行
            return;
        }

        // 添加图片数据
        var formdata = new FormData();
        arrForEach(resultFiles, function (file) {
            var name = uploadFileName || file.name;
            formdata.append(name, file);
        });

        // ------------------------------ 上传图片 ------------------------------
        if (uploadImgServer && typeof uploadImgServer === 'string') {
            // 添加参数
            var uploadImgServerArr = uploadImgServer.split('#');
            uploadImgServer = uploadImgServerArr[0];
            var uploadImgServerHash = uploadImgServerArr[1] || '';
            objForEach(uploadImgParams, function (key, val) {
                // 因使用者反应，自定义参数不能默认 encode ，由 v3.1.1 版本开始注释掉
                // val = encodeURIComponent(val)

                // 第一，将参数拼接到 url 中
                if (uploadImgParamsWithUrl) {
                    if (uploadImgServer.indexOf('?') > 0) {
                        uploadImgServer += '&';
                    } else {
                        uploadImgServer += '?';
                    }
                    uploadImgServer = uploadImgServer + key + '=' + val;
                }

                // 第二，将参数添加到 formdata 中
                formdata.append(key, val);
            });
            if (uploadImgServerHash) {
                uploadImgServer += '#' + uploadImgServerHash;
            }

            // 定义 xhr
            var xhr = new XMLHttpRequest();
            xhr.open('POST', uploadImgServer);

            // 设置超时
            xhr.timeout = timeout;
            xhr.ontimeout = function () {
                // hook - timeout
                if (hooks.timeout && typeof hooks.timeout === 'function') {
                    hooks.timeout(xhr, editor);
                }

                _this3._alert('上传图片超时');
            };

            // 监控 progress
            if (xhr.upload) {
                xhr.upload.onprogress = function (e) {
                    var percent = void 0;
                    // 进度条
                    var progressBar = new Progress(editor);
                    if (e.lengthComputable) {
                        percent = e.loaded / e.total;
                        progressBar.show(percent);
                    }
                };
            }

            // 返回数据
            xhr.onreadystatechange = function () {
                var result = void 0;
                if (xhr.readyState === 4) {
                    if (xhr.status < 200 || xhr.status >= 300) {
                        // hook - error
                        if (hooks.error && typeof hooks.error === 'function') {
                            hooks.error(xhr, editor);
                        }

                        // xhr 返回状态错误
                        _this3._alert('上传图片发生错误', '\u4E0A\u4F20\u56FE\u7247\u53D1\u751F\u9519\u8BEF\uFF0C\u670D\u52A1\u5668\u8FD4\u56DE\u72B6\u6001\u662F ' + xhr.status);
                        return;
                    }

                    result = xhr.responseText;
                    if ((typeof result === 'undefined' ? 'undefined' : _typeof(result)) !== 'object') {
                        try {
                            result = JSON.parse(result);
                        } catch (ex) {
                            // hook - fail
                            if (hooks.fail && typeof hooks.fail === 'function') {
                                hooks.fail(xhr, editor, result);
                            }

                            _this3._alert('上传图片失败', '上传图片返回结果错误，返回结果是: ' + result);
                            return;
                        }
                    }
                    if (!hooks.customInsert && result.errno != '0') {
                        // hook - fail
                        if (hooks.fail && typeof hooks.fail === 'function') {
                            hooks.fail(xhr, editor, result);
                        }

                        // 数据错误
                        _this3._alert('上传图片失败', '上传图片返回结果错误，返回结果 errno=' + result.errno);
                    } else {
                        if (hooks.customInsert && typeof hooks.customInsert === 'function') {
                            // 使用者自定义插入方法
                            hooks.customInsert(_this3.insertLinkImg.bind(_this3), result, editor);
                        } else {
                            // 将图片插入编辑器
                            var data = result.data || [];
                            data.forEach(function (link) {
                                _this3.insertLinkImg(link);
                            });
                        }

                        // hook - success
                        if (hooks.success && typeof hooks.success === 'function') {
                            hooks.success(xhr, editor, result);
                        }
                    }
                }
            };

            // hook - before
            if (hooks.before && typeof hooks.before === 'function') {
                var beforeResult = hooks.before(xhr, editor, resultFiles);
                if (beforeResult && (typeof beforeResult === 'undefined' ? 'undefined' : _typeof(beforeResult)) === 'object') {
                    if (beforeResult.prevent) {
                        // 如果返回的结果是 {prevent: true, msg: 'xxxx'} 则表示用户放弃上传
                        this._alert(beforeResult.msg);
                        return;
                    }
                }
            }

            // 自定义 headers
            objForEach(uploadImgHeaders, function (key, val) {
                xhr.setRequestHeader(key, val);
            });

            // 跨域传 cookie
            xhr.withCredentials = withCredentials;

            // 发送请求
            xhr.send(formdata);

            // 注意，要 return 。不去操作接下来的 base64 显示方式
            return;
        }

        // ------------------------------ 显示 base64 格式 ------------------------------
        if (uploadImgShowBase64) {
            arrForEach(files, function (file) {
                var _this = _this3;
                var reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onload = function () {
                    _this.insertLinkImg(this.result);
                };
            });
        }
    }
};

/**
 * 
 * @param {editor} editor
 * 上传视频 
 */
function UploadVideo(editor) {
    this.editor = editor;
    var videoId = getRandom('kolo-video');

    this.videoId = videoId;
}

//
UploadVideo.prototype = {
    constructor: UploadVideo,

    //根据链接插入视频
    insertLinkVideo: function insertLinkVideo(link) {
        var loading = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
        var id = arguments[2];
        var process = arguments[3];
        var videoInfo = arguments[4];

        var _this2 = this;

        var editor = this.editor;
        var config = editor.config;

        // console.log(config);

        var videoId = void 0;
        if (id) {
            videoId = id;
        } else {
            videoId = this.videoId;
        }

        //创建新的视频操作按钮id
        var randomId = getRandom('kolo-video-close');

        // 校验格式
        // console.log(link, loading);

        var obj = {
            w: 640,
            h: 360
        };

        if (videoInfo && (typeof videoInfo === 'undefined' ? 'undefined' : _typeof(videoInfo)) == 'object') {
            obj.w = videoInfo.w;
            obj.h = videoInfo.h;
        }

        //视频上传时图片的loading的id,如果存在就添加loading
        if (loading) {
            if (process == 0) {
                //插入视频
                var template = '\n                    <div class="kolo-video" id="' + videoId + '" contenteditable="false">\n                        <div class="kolo-video-container">\n                            <div class="progress-content">\n                                <p class="subtitle-video">\u89C6\u9891\u6B63\u5728\u4E0A\u4F20,\u4E0D\u5F71\u54CD\u7F16\u8F91</p>\n                                <p class="' + (videoId + '-' + videoId) + '"></p>\n                            </div>\n                        </div>\n                        <span data-src="' + (link ? link : '') + '" class="before-img">\u66F4\u6362\u5C01\u9762</span>\n                        <i class="w-e-icon-close" id="' + randomId + '"><img src="https://qncdn.file.sinostage.com/close.svg"/></i><br/>\n                    </div>\n                    <p>&#8203;<br/></p>\n                ';

                //替换多语言        
                template = replaceLang(editor, template);

                editor.cmd.do('insertHTML', template);

                document.querySelector('#' + videoId + ' .before-img').style.display = "none";
            } else if (process > 0 && process < 100) {
                document.querySelector('.' + videoId + '-' + videoId).innerHTML = process + '%';
            }
            return;
        } else {
            if (!link) {
                return;
            }
            var upDateImg = document.querySelector('#' + videoId + ' .before-img');
            upDateImg.style.display = "";

            var beforeImg = link + '?vframe/jpg/offset/3/w/' + obj.w + '/h/' + obj.h;

            //插入视频
            var template2 = '\n                <div class="video-content">\n                    <img class="video-bg" src="' + beforeImg + '" />\n                    <video class="video-dom" data-w="' + obj.w + '" data-h="' + obj.h + '" style="display: none;" controls="controls" src="' + link + '"></video>\n                    <img class="video-control-btn" src="https://qncdn.file.sinostage.com/paly1.svg" />\n                </div>\n            ';
            //替换多语言        
            template2 = replaceLang(editor, template2);

            var loaderDom = document.querySelector('#' + videoId + ' .kolo-video-container');

            loaderDom.innerHTML = template2;

            //视频播放
            var videoDom = document.querySelector('#' + videoId + ' .video-dom'),
                btnDom = document.querySelector('#' + videoId + ' .video-control-btn'),
                beforeDom = document.querySelector('#' + videoId + ' .before-img');
            btnDom.addEventListener('click', function () {
                // console.log('视频播放--');
                document.querySelector('#' + videoId + ' .video-bg').style.display = 'none';
                btnDom.style.display = 'none';
                // beforeDom.style.display = 'none';
                videoDom.style.display = 'block';
                videoDom.play();
            });
        }

        //更换封面图片
        document.querySelector('#' + videoId + ' .before-img').addEventListener('click', function (e) {
            e.stopPropagation();

            if (document.querySelector('.kolo-e-dialog-up')) {
                return;
            }

            var videoDom = document.querySelector('#' + videoId + ' .video-dom');
            videoDom.pause();
            videoDom.style.display = 'none';
            document.querySelector('#' + videoId + ' .video-bg').style.display = 'block';
            document.querySelector('#' + videoId + ' .video-control-btn').style.display = 'block';

            //更换图片自定义上传
            var changeUploadImg = config.changeUploadImg;

            var containerId = editor.toolbarSelector;

            // id
            var dialogId = getRandom('img-dialog');
            var upTriggerId = getRandom('up-trigger');
            var upFileId = getRandom('up-file');
            var closeUpload = getRandom('cloase-img');

            //创建弹窗 
            var template = '\n                    <div class="kolo-upload">\n                        <div class="upload-container">\n                            <h3>\u66F4\u6362\u5C01\u9762</h3>\n                            <div class="w-e-up-btn">\n                                <button id="' + upTriggerId + '">\u9009\u62E9\u56FE\u7247</button>\n                                <p>\u4E3A\u4E86\u83B7\u5F97\u66F4\u597D\u7684\u63A8\u8350</p>\n                                <p>\u5EFA\u8BAE\u4E0A\u4F20720p\uFF081280x720\uFF09\u6216\u66F4\u9AD8\u5206\u8FA8\u7387\u7684\u56FE\u7247</p>\n                            </div>\n                            <div style="display:none;">\n                                <input id="' + upFileId + '" type="file" multiple="multiple" accept="image/jpg,image/jpeg,image/png,image/gif,image/bmp"/>\n                            </div>\n                            <i id="' + closeUpload + '" class="w-e-icon-close">\xD7</i>\n                        </div>\n                    </div>';
            //替换多语言        
            template = replaceLang(editor, template);

            //添加弹窗
            var dialog = document.createElement('div');
            dialog.className = 'kolo-e-dialog-up';
            dialog.id = dialogId;
            dialog.innerHTML = template;
            document.querySelector(containerId).appendChild(dialog);

            // console.log(dialogId, 'dialogId');

            //关闭弹窗
            document.querySelector('#' + closeUpload).addEventListener('click', function (e) {
                e.stopPropagation();
                var dom = document.querySelector('#' + dialogId);
                // console.log(dialogId, 'dialogId-closeUpload');
                dom.parentNode.removeChild(dom);
            });

            //点击按钮选择图片
            document.querySelector('#' + upTriggerId).addEventListener('click', function (e) {
                e.stopPropagation();
                // console.log(dialogId, 'dialogId-upTriggerId');

                document.querySelector('#' + upFileId).click();
            });

            //文件选择
            document.querySelector('#' + upFileId).addEventListener('change', function (e) {
                e.stopPropagation();
                var fileElem = document.querySelector('#' + upFileId);
                // console.log(dialogId, 'dialogId-upFileId');
                if (!fileElem) {
                    // 返回 true 可关闭 panel
                    return true;
                }

                // 获取选中的 file 对象列表
                var fileList = fileElem.files;
                if (fileList.length) {
                    // console.log(dialogId, 'dialogId-changeUploadImg');
                    changeUploadImg(fileList, updateBeforeImg);
                }
            });

            //更换封面
            function updateBeforeImg(link) {
                // console.log(document.querySelector('#' + videoId + ' .before-img'));
                document.querySelector('#' + videoId + ' .before-img').setAttribute('data-src', link);
                var progressDom = document.querySelector('#' + videoId + ' .kolo-video-container .progress-content');
                //如果视频还未上传完毕，则添加到progress中
                if (progressDom) {
                    var imgDom = document.createElement('img');
                    imgDom.src = link;
                    progressDom.appendChild(imgDom);
                } else {
                    //视频上传完毕，则更改图片路径
                    var _imgDom = document.querySelector('#' + videoId + ' .video-bg');
                    _imgDom.src = link + '?imageView/1//w/' + obj.w + '/h/' + obj.h;
                }
                // console.log(dialogId, 'dialogId');
                var dom = document.querySelector('#' + dialogId);
                dom.parentNode.removeChild(dom);
            }
        });
    }

};

/**
 *
 * @param {editor} editor
 * 上传音频
 */
function UploadAudio(editor) {
    this.editor = editor;
    this.audioEvent = [];
}
UploadAudio.prototype = {
    constructor: UploadAudio,
    //插入音频
    insertLinkAudio: function insertLinkAudio(obj) {
        var _this = this;

        if (!obj.url) {
            return;
        }
        var that = this;
        var editor = this.editor,
            config = editor.config;

        var audioId = getRandom('audio' + obj.id);
        var closeId = getRandom('audio-close' + obj.id);

        // 格式校验 //<p class="subtitle-audio">音频尚未发布，暂时无法播放</p>
        var names = obj.name.split('/');
        editor.cmd.do('insertHTML', '\n            <div class="kolo-audio" contenteditable="false">\n                <div class="audio-content" data-id="' + obj.id + '" data-person="' + obj.person + '">\n                    <div class="music-img">\n                        <img src="http://image.kolocdn.com/FkLcNneCxiAouJwhGrloaMMKBj7f" />\n                    </div>\n                    <div class="audio-title">\n                        <h3>' + names[0] + '</h3>\n                        <p>' + names[1] + '</p>\n                    </div>\n                    <div class="audio-control status-play">\n                        <img class="play play-' + audioId + '" \n                            src="https://image.kolocdn.com/Fvb6y33-Cy1gomZwCp_v2jyOJsYc"/>\n                        <img class="pause pause-' + audioId + '" \n                            src="https://image.kolocdn.com/Ftvd5iTGO6rf1RPgGM1NxISiflys"/>\n                    </div>\n                </div>\n                <p class="input-p">\n                    <input type="text" maxlength="90"  value="" placeholder="\u70B9\u51FB\u6DFB\u52A0\u97F3\u4E50\u63CF\u8FF0(\u6700\u591A90\u5B57\u7B26)"/>\n                </p>\n                <i id="' + closeId + '" class="w-e-icon-close"><img src="https://qncdn.file.sinostage.com/close.svg"/></i>\n            </div>\n            <p>&#8203;<br></p>\n        ');
        this.audioEvent.push({
            selector: audioId,
            type: 'control',
            fn: function fn(selector) {
                // console.log(selector, 'selector');
                //对添加的audio添加播放/暂停事件
                if (!document.querySelector('.play-' + selector)) {
                    return;
                }
                document.querySelector('.play-' + selector).addEventListener('click', function (e) {
                    e.stopPropagation();
                    var audioDom = document.querySelector('#play-' + editor.audioMenuId);
                    //关闭播放中的音频
                    audioDom.pause();
                    //所有音频恢复默认状态
                    document.querySelectorAll('.audio-control').forEach(function (el) {
                        el.className = 'audio-control status-play';
                    });

                    var domNode = e.target.parentNode.parentNode;
                    var musicId = domNode.getAttribute('data-id');
                    _this.getMusicUrl(musicId).then(function (res) {
                        audioDom.src = res.data[0].url;
                        audioDom.play();
                        e.target.parentNode.className = 'audio-control status-pause';
                    });
                });
                if (!document.querySelector('.pause-' + selector)) {
                    return;
                }
                document.querySelector('.pause-' + selector).addEventListener('click', function (e) {
                    e.stopPropagation();
                    var audioDom = document.querySelector('#play-' + editor.audioMenuId);
                    audioDom.pause();
                    e.target.parentNode.className = 'audio-control status-play';
                });
            }
        });
        this.audioEvent.forEach(function (item) {
            item.fn(item.selector);
        });

        //验证url是否有效
        var audio = document.createElement('audio');
        audio.src = obj.url;
        audio.onload = function () {
            audio = null;
        };
        audio.onerror = function () {
            audio = null;
            alert('无效地址');
            return;
        };
        audio.onabort = function () {
            audio = null;
        };
    },

    //根据音乐ID获取音乐链接
    getMusicUrl: function getMusicUrl(id) {
        var _this2 = this;

        return new Promise(function (res, rej) {
            _this2._http('https://music-api.kolo.la/music/url?id=' + id).then(function (data) {
                if (data.code == 200) {
                    res({ code: 200, data: data.data.data });
                } else {
                    res({ code: 500, data: null });
                }
            });
        });
    },

    //请求get
    _http: function _http(uri) {
        return new Promise(function (res, rej) {
            var request = new XMLHttpRequest();
            var timeout = false;
            var timer = setTimeout(function () {
                timeout = true;
                request.abort();
                res({ code: 500, data: null });
            }, 30000);
            request.open("GET", uri);
            request.onreadystatechange = function () {
                if (request.readyState !== 4) return;
                if (timeout) return;
                clearTimeout(timer);
                if (request.status === 200) {
                    res({ code: 200, data: JSON.parse(request.responseText) });
                }
            };
            request.send(null);
        });
    }
};

/*
    编辑器构造函数
*/

// id，累加
var editorId = 1;

// 构造函数
function Editor(toolbarSelector, textSelector) {
    if (toolbarSelector == null) {
        // 没有传入任何参数，报错
        throw new Error('错误：初始化编辑器时候未传入任何参数，请查阅文档');
    }
    // id，用以区分单个页面不同的编辑器对象
    this.id = 'wangEditor-' + editorId++;

    this.toolbarSelector = toolbarSelector;
    this.textSelector = textSelector;

    this.containtCss = '.w-e-text h1,.w-e-text h2{font-weight:500;text-align:center}.w-e-text{padding:10px 10px 0}.w-e-text h1,.w-e-text h2,.w-e-text h3,.w-e-text h4,.w-e-text h5,.w-e-text p,.w-e-text pre,.w-e-text table{margin:10px 0;line-height:1.5}.w-e-text h1{font-size:16px;font-family:Ubuntu-Medium;color:#333}.w-e-text h2{font-size:12px;font-family:Ubuntu-regular;color:#aaa}.w-e-text p{font-size:16px;font-family:Montserrat-Light;font-weight:300;color:#666}.w-e-text ol,.w-e-text ul{margin:10px 0 10px 20px}.w-e-text blockquote{display:block;border-left:2px solid #E2E2E2;padding:5px 10px;margin:10px 0;line-height:1.4;font-size:14px;color:#AAA}.w-e-text .kolo-audio i,.w-e-text .kolo-img i{right:-10px;top:-10px;color:#fff;font-size:12px;line-height:20px;text-align:center;cursor:pointer}.w-e-text code{display:inline-block;background-color:#f1f1f1;border-radius:3px;padding:3px 5px;margin:0 3px}.w-e-text pre code{display:block}.w-e-text div.split{width:20%;height:1px;background:#E2E2E2;margin:30px auto}.w-e-text div.split:before{content:\' \'}.w-e-text table{border-top:1px solid #ccc;border-left:1px solid #ccc}.w-e-text table td,.w-e-text table th{border-bottom:1px solid #ccc;border-right:1px solid #ccc;padding:3px 5px}.w-e-text table th{border-bottom:2px solid #ccc;text-align:center}.w-e-text:focus{outline:0}.w-e-text img,.w-e-text video{cursor:pointer}.w-e-text .kolo-img{width:100%;max-width:345px;margin:15px auto;position:relative}.w-e-text .kolo-img img{width:100%}.w-e-text .kolo-img i{position:absolute;background:#ccc;width:20px;height:20px;border-radius:50%;display:none}.w-e-text .kolo-img i img{width:100%;height:100%;pointer-events:none}.w-e-text .kolo-img:hover i{display:block}.w-e-text .kolo-audio{width:100%;max-width:345px;margin:10px auto;position:relative;padding-bottom:10px}.w-e-text .kolo-audio .audio-content{width:100%;margin-bottom:2px;height:90px;background:#f9f9f9;border-radius:4px;padding:15px;box-sizing:border-box}.w-e-text .kolo-audio i{position:absolute;background:#ccc;width:20px;height:20px;border-radius:50%;display:none}.w-e-text .kolo-audio i img{width:100%;height:100%;pointer-events:none}.w-e-text .kolo-audio:hover i{display:block}.w-e-text .kolo-audio .music-img{width:60px;height:60px;border-radius:4px;margin-right:10px;float:left}.w-e-text .kolo-audio .music-img img{width:100%;height:100%}.w-e-text .kolo-audio .audio-title{width:calc(100% - 100px);float:left;display:-ms-flexbox;display:flex;-ms-flex-direction:column;flex-direction:column;-ms-flex-pack:center;justify-content:center;height:60px}.w-e-text .kolo-audio .audio-title h3{font-size:14px;font-family:Montserrat-Medium;font-weight:500;color:#333;line-height:18px;margin:0;overflow:hidden;white-space:nowrap;text-overflow:ellipsis}.w-e-text .kolo-audio .audio-title p{font-size:10px;font-family:Montserrat-Regular;font-weight:400;color:#aaa;line-height:13px;margin:6px 0}.w-e-text .kolo-audio .audio-control{float:left;padding-top:15px}.w-e-text .kolo-audio .audio-control img{width:28px;height:28px}.w-e-text .kolo-audio .audio-control.status-play img{display:inline-block}.w-e-text .kolo-audio .audio-control.status-pause img,.w-e-text .kolo-audio .audio-control.status-play img:nth-child(2){display:none}.w-e-text .kolo-audio .audio-control.status-pause img:nth-child(2){display:inline-block}.w-e-text .kolo-audio .input-p{text-align:center;width:100%;max-width:345px;margin:auto;line-height:1.2}.w-e-text .kolo-audio .input-p input{width:100%;height:37px;line-height:36px;background:#fff;border-radius:2px;border:1px solid #e2e2e2;padding:0 15px;box-sizing:border-box;font-size:12px;font-family:Montserrat-Regular;font-weight:400;color:#aaa}.w-e-text .kolo-audio .input-p input::-moz-placeholder,.w-e-text .kolo-audio .input-p input::-ms-input-placeholder,.w-e-text .kolo-audio .input-p input::-webkit-input-placeholder{color:red}.w-e-text .kolo-audio .input-p span{font-size:12px;font-family:Montserrat-Regular;font-weight:400;color:#aaa}.w-e-text .kolo-video{width:100%;max-width:345px;margin:15px auto;height:auto;display:-ms-flexbox;display:flex;position:relative}.w-e-text .kolo-video .kolo-video-container{width:100%;min-height:140px;background:#000;display:-ms-flexbox;display:flex;position:relative}.w-e-text .kolo-video .kolo-video-container .progress-content{width:100%;display:-ms-flexbox;display:flex;max-width:345px;min-height:260px;-ms-flex-align:center;align-items:center;-ms-flex-direction:column;flex-direction:column;-ms-flex-pack:center;justify-content:center;position:relative}.w-e-text .kolo-video .kolo-video-container .progress-content p{height:20px;position:absolute;bottom:20px;margin:auto}.w-e-text .kolo-video .kolo-video-container .progress-content p:first-child{bottom:50px}.w-e-text .kolo-video .kolo-video-container .progress-content p:last-child{bottom:20px}.w-e-text .kolo-video .kolo-video-container .progress-content img{-ms-flex-align:center;align-items:center;width:100%;max-width:345px}.w-e-text .kolo-video .kolo-video-container .progress-content .video-control-btn{width:40px;height:40px;position:absolute;left:0;right:0;top:0;bottom:0;margin:auto}.w-e-text .kolo-video .kolo-video-container .progress-content .subtitle-video,.w-e-text .kolo-video .kolo-video-container .progress-content .video-progress{text-align:center;font-size:12px;color:#fff}.w-e-text .kolo-video .kolo-video-container .video-content{display:-ms-flexbox;display:flex;-ms-flex-align:center;align-items:center}.w-e-text .kolo-video .kolo-video-container .video-content img{-ms-flex-align:center;align-items:center}.w-e-text .kolo-video .kolo-video-container .video-content img,.w-e-text .kolo-video .kolo-video-container .video-content video{width:100%;max-width:345px;min-height:180px;max-height:195px}.w-e-text .kolo-video .kolo-video-container .video-content .video-control-btn{width:40px;height:40px;min-height:40px;position:absolute;left:0;right:0;top:0;bottom:0;margin:auto}.w-e-text .kolo-video .kolo-video-container .video-content p{position:absolute;bottom:0;text-align:center;width:100%;color:#ccc}.w-e-text .kolo-video i{position:absolute;cursor:pointer;right:-10px;top:-10px;color:#fff;font-size:14px;width:20px;height:20px;text-align:center;line-height:20px;border-radius:50%}.w-e-text .kolo-video i img{width:100%;height:100%;pointer-events:none}.w-e-text .kolo-video .before-img{position:absolute;cursor:pointer;left:10px;top:10px;font-size:12px;color:#333;padding:3px 6px;background:#fff;border-radius:10px}.w-e-text .kolo-video .before-img,.w-e-text .kolo-video .w-e-icon-close{display:none}.w-e-text .kolo-video:hover .before-img,.w-e-text .kolo-video:hover .w-e-icon-close{display:block}.w-e-text .kolo-inline-link{text-decoration:underline;color:rgba(65,55,56,.7);cursor:pointer}.w-e-text .kolo-link{width:100%;max-width:300px;margin:15px auto;display:-ms-flexbox;display:flex;position:relative;height:90px;background:#f9f9f9;border-radius:4px;box-shadow:0 0 3px 3px #eee}.w-e-text .kolo-link>a{display:-ms-flexbox;display:flex;overflow:hidden;text-decoration:none;padding:15px;width:100%}.w-e-text .kolo-link>a .link-img{width:60px;min-width:60px;height:60px}.w-e-text .kolo-link>a .link-img img{width:100%;height:100%}.w-e-text .kolo-link>a .link-content{width:100%;padding-left:20px;display:-ms-flexbox;display:flex;-ms-flex-direction:column;flex-direction:column;-ms-flex-pack:center;justify-content:center}.w-e-text .kolo-link>a .link-content h3{font-size:14px;font-family:Montserrat-Medium;font-weight:500;color:#333;line-height:30px;margin:0;overflow:hidden;white-space:nowrap;text-overflow:ellipsis}.w-e-text .kolo-link>a .link-content p{font-size:10px;font-family:Montserrat-Regular;font-weight:400;color:#aaa;line-height:0;margin:0;overflow:hidden;white-space:nowrap;text-overflow:ellipsis}';

    // 自定义配置
    this.customConfig = {};
}

// 修改原型
Editor.prototype = {
    constructor: Editor,

    // 初始化配置
    _initConfig: function _initConfig() {
        // _config 是默认配置，this.customConfig 是用户自定义配置，将它们 merge 之后再赋值
        var target = {};
        this.config = Object.assign(target, config, this.customConfig);

        // 将语言配置，生成正则表达式
        var langConfig = this.config.lang || {};
        var langArgs = [];
        objForEach(langConfig, function (key, val) {
            // key 即需要生成正则表达式的规则，如“插入链接”
            // val 即需要被替换成的语言，如“insert link”
            langArgs.push({
                reg: new RegExp(key, 'img'),
                val: val

            });
        });
        this.config.langArgs = langArgs;
    },

    // 初始化 DOM
    _initDom: function _initDom() {
        var _this = this;

        var toolbarSelector = this.toolbarSelector;
        var $toolbarSelector = $(toolbarSelector);
        var textSelector = this.textSelector;

        var config$$1 = this.config;
        var zIndex = config$$1.zIndex;

        // 定义变量
        var $toolbarElem = void 0,
            $textContainerElem = void 0,
            $textElem = void 0,
            $children = void 0;

        if (textSelector == null) {
            // 只传入一个参数，即是容器的选择器或元素，toolbar 和 text 的元素自行创建
            $toolbarElem = $('<div></div>');
            $textContainerElem = $('<div></div>');

            // 将编辑器区域原有的内容，暂存起来
            $children = $toolbarSelector.children();

            // 添加到 DOM 结构中
            $toolbarSelector.append($toolbarElem).append($textContainerElem);

            // 自行创建的，需要配置默认的样式
            $toolbarElem.css('background-color', '#fff').css('border-top', '1px solid rgba(238,238,238,1)').css('border-bottom', '1px solid rgba(238,238,238,1)');
        } else {
            // toolbar 和 text 的选择器都有值，记录属性
            $toolbarElem = $toolbarSelector;
            $textContainerElem = $(textSelector);
            // 将编辑器区域原有的内容，暂存起来
            $children = $textContainerElem.children();
        }

        // 编辑区域
        $textElem = $('<div></div>');
        $textElem.attr('contenteditable', 'true').css('width', '100%').css('height', '100%').css('min-height', '300px');

        // 初始化编辑区域内容
        if ($children && $children.length) {
            $textElem.append($children);
        } else {
            $textElem.append($('<p><br></p>'));
        }

        // 编辑区域加入DOM
        $textContainerElem.append($textElem);

        // 设置通用的 class
        $toolbarElem.addClass('w-e-toolbar');
        $textContainerElem.addClass('w-e-text-container');
        $textContainerElem.css('z-index', zIndex + 2);
        $textElem.addClass('w-e-text');

        // 添加 ID
        var toolbarElemId = getRandom('toolbar-elem');
        $toolbarElem.attr('id', toolbarElemId);
        var textElemId = getRandom('text-elem');
        $textElem.attr('id', textElemId);

        // 记录属性
        this.$toolbarElem = $toolbarElem;
        this.$textContainerElem = $textContainerElem;
        this.$textElem = $textElem;
        this.toolbarElemId = toolbarElemId;
        this.textElemId = textElemId;

        // 记录输入法的开始和结束
        var compositionEnd = true;
        $textContainerElem.on('compositionstart', function () {
            // 输入法开始输入
            compositionEnd = false;
        });
        $textContainerElem.on('compositionend', function () {
            // 输入法结束输入
            compositionEnd = true;
        });

        // 绑定 onchange
        $textContainerElem.on('click keyup', function () {
            // 输入法结束才出发 onchange
            compositionEnd && _this.change && _this.change();
        });
        $toolbarElem.on('click', function () {
            this.change && this.change();
        });

        //绑定 onfocus 与 onblur 事件
        if (config$$1.onfocus || config$$1.onblur) {
            // 当前编辑器是否是焦点状态
            this.isFocus = false;

            $(document).on('click', function (e) {
                //判断当前点击元素是否在编辑器内
                var isChild = $textElem.isContain($(e.target));

                //判断当前点击元素是否为工具栏
                var isToolbar = $toolbarElem.isContain($(e.target));
                var isMenu = $toolbarElem[0] == e.target ? true : false;

                if (!isChild) {
                    //若为选择工具栏中的功能，则不视为成blur操作
                    if (isToolbar && !isMenu) {
                        return;
                    }

                    if (_this.isFocus) {
                        _this.onblur && _this.onblur();
                    }
                    _this.isFocus = false;
                } else {
                    if (!_this.isFocus) {
                        _this.onfocus && _this.onfocus();
                    }
                    _this.isFocus = true;
                }
            });
        }
    },

    // 封装 command
    _initCommand: function _initCommand() {
        this.cmd = new Command(this);
    },

    // 封装 selection range API
    _initSelectionAPI: function _initSelectionAPI() {
        this.selection = new API(this);
    },

    // 添加图片上传
    _initUploadImg: function _initUploadImg() {
        this.uploadImg = new UploadImg(this);
    },

    // 添加视频上传
    _initUploadVideo: function _initUploadVideo() {
        this.uploadVideo = new UploadVideo(this);
    },

    // 添加音频上传
    _initUploadAudio: function _initUploadAudio() {
        this.uploadAudio = new UploadAudio(this);
    },

    // 初始化菜单
    _initMenus: function _initMenus() {
        this.menus = new Menus(this);
        this.menus.init();
    },

    // 添加 text 区域
    _initText: function _initText() {
        this.txt = new Text(this);
        this.txt.init();
    },

    // 初始化选区，将光标定位到内容尾部
    initSelection: function initSelection(newLine) {
        var $textElem = this.$textElem;
        var $children = $textElem.children();
        if (!$children.length) {
            // 如果编辑器区域无内容，添加一个空行，重新设置选区
            $textElem.append($('<p><br></p>'));
            this.initSelection();
            return;
        }

        var $last = $children.last();

        if (newLine) {
            // 新增一个空行
            var html = $last.html().toLowerCase();
            var nodeName = $last.getNodeName();
            if (html !== '<br>' && html !== '<br\/>' || nodeName !== 'P') {
                // 最后一个元素不是 <p><br></p>，添加一个空行，重新设置选区
                $textElem.append($('<p><br></p>'));
                this.initSelection();
                return;
            }
        }

        this.selection.createRangeByElem($last, false, true);
        this.selection.restoreSelection();
    },

    // 绑定事件
    _bindEvent: function _bindEvent() {
        // -------- 绑定 onchange 事件 --------
        var onChangeTimeoutId = 0;
        var beforeChangeHtml = this.txt.html();
        var config$$1 = this.config;

        // onchange 触发延迟时间
        var onchangeTimeout = config$$1.onchangeTimeout;
        onchangeTimeout = parseInt(onchangeTimeout, 10);
        if (!onchangeTimeout || onchangeTimeout <= 0) {
            onchangeTimeout = 200;
        }

        var onchange = config$$1.onchange;
        if (onchange && typeof onchange === 'function') {
            // 触发 change 的有三个场景：
            // 1. $textContainerElem.on('click keyup')
            // 2. $toolbarElem.on('click')
            // 3. editor.cmd.do()
            this.change = function () {
                // 判断是否有变化
                var currentHtml = this.txt.html();

                if (currentHtml.length === beforeChangeHtml.length) {
                    // 需要比较每一个字符
                    if (currentHtml === beforeChangeHtml) {
                        return;
                    }
                }

                // 执行，使用节流
                if (onChangeTimeoutId) {
                    clearTimeout(onChangeTimeoutId);
                }
                onChangeTimeoutId = setTimeout(function () {
                    // 触发配置的 onchange 函数
                    onchange(currentHtml);
                    beforeChangeHtml = currentHtml;
                }, onchangeTimeout);
            };
        }

        // -------- 绑定 onblur 事件 --------
        var onblur = config$$1.onblur;
        if (onblur && typeof onblur === 'function') {
            this.onblur = function () {
                var currentHtml = this.txt.html();
                onblur(currentHtml);
            };
        }

        // -------- 绑定 onfocus 事件 --------
        var onfocus = config$$1.onfocus;
        if (onfocus && typeof onfocus === 'function') {
            this.onfocus = function () {
                onfocus();
            };
        }
    },

    // 创建编辑器
    create: function create() {
        // 初始化配置信息
        this._initConfig();

        // 初始化 DOM
        this._initDom();

        // 封装 command API
        this._initCommand();

        // 封装 selection range API
        this._initSelectionAPI();

        // 添加 text
        this._initText();

        // 初始化菜单
        this._initMenus();

        // 添加 图片上传
        this._initUploadImg();

        // 添加 视频上传
        this._initUploadVideo();

        // 添加 音频上传
        this._initUploadAudio();

        // 初始化选区，将光标定位到内容尾部
        this.initSelection(true);

        // 绑定事件
        this._bindEvent();
    },

    // 解绑所有事件（暂时不对外开放）
    _offAllEvent: function _offAllEvent() {
        $.offAll();
    }
};

// 检验是否浏览器环境
try {
    document;
} catch (ex) {
    throw new Error('请在浏览器环境下运行');
}

// polyfill
polyfill();

// 这里的 `inlinecss` 将被替换成 css 代码的内容，详情可去 ./gulpfile.js 中搜索 `inlinecss` 关键字
var inlinecss = '.w-e-toolbar,.w-e-text-container,.w-e-menu-panel {  padding: 0;  margin: 0;  box-sizing: border-box;}.w-e-toolbar *,.w-e-text-container *,.w-e-menu-panel * {  padding: 0;  margin: 0;  box-sizing: border-box;}.w-e-text-container {  position: relative;  padding: 60px 80px;  border: 0;  border-bottom: 1px solid #eeeeee;}.w-e-text-container:before {  content: \' \';  width: 16px;  height: 16px;  border-bottom: 1px solid #d8d8d8;  border-right: 1px solid #d8d8d8;  position: absolute;  left: 62px;  top: 48px;}.w-e-text-container:after {  content: \'\';  width: 16px;  height: 16px;  border-bottom: 1px solid #d8d8d8;  border-left: 1px solid #d8d8d8;  position: absolute;  right: 62px;  top: 48px;}.w-e-text-container .w-e-progress {  position: absolute;  background-color: #1e88e5;  bottom: 0;  left: 0;  height: 1px;}.w-e-clear-fix:after {  content: "";  display: table;  clear: both;}.kolo-e-dialog,.kolo-e-dialog-up {  position: fixed;  left: 0;  top: 0;  width: 100%;  height: 100%;  background: rgba(0, 0, 0, 0.6);  filter: progid:DXImageTransform.Microsoft.gradient(startColorstr=\'#99000000\', endColorstr=\'#99000000\');  z-index: 100001;}:root .kolo-e-dialog,.kolo-e-dialog-up {  filter: none\\9;}.kolo-e-dialog .kolo-upload,.kolo-e-dialog-up .kolo-upload {  width: 600px;  height: 250px;  box-sizing: border-box;  margin: auto;  margin-top: 30vh;  background: #fff;  border-radius: 4px;  padding: 40px;}.kolo-e-dialog .kolo-upload h3,.kolo-e-dialog-up .kolo-upload h3 {  text-align: center;  margin-bottom: 30px;  margin-top: 0;}.kolo-e-dialog .kolo-upload .w-e-up-btn,.kolo-e-dialog-up .kolo-upload .w-e-up-btn {  text-align: center;}.kolo-e-dialog .kolo-upload .w-e-up-btn button,.kolo-e-dialog-up .kolo-upload .w-e-up-btn button {  cursor: pointer;  width: 140px;  height: 42px;  line-height: 42px;  background: #EB2135;  border-radius: 4px;  font-family: Ubuntu-Regular;  font-size: 14px;  border: 0;  margin: 0;  padding: 0;  color: #fff;  outline: none;  margin-top: 40px;}.kolo-e-dialog .kolo-upload .w-e-up-btn button[disabled=true],.kolo-e-dialog-up .kolo-upload .w-e-up-btn button[disabled=true] {  opacity: 0.7;  filter: alpha(opacity=70);}.kolo-e-dialog .kolo-upload .w-e-up-btn p,.kolo-e-dialog-up .kolo-upload .w-e-up-btn p {  font-family: Ubuntu-Regular;  margin: 0;  margin-bottom: 5px;  font-weight: 400;}.kolo-e-dialog .kolo-upload .upload-container,.kolo-e-dialog-up .kolo-upload .upload-container {  position: absolute;  width: 520px;  height: 170px;}.kolo-e-dialog .kolo-upload .w-e-icon-close,.kolo-e-dialog-up .kolo-upload .w-e-icon-close {  position: absolute;  right: -28px;  top: -32px;  cursor: pointer;  color: #aaa;}.kolo-e-dialog .upload-container,.kolo-e-dialog-up .upload-container {  position: relative;  z-index: 99;}.kolo-e-dialog .music,.kolo-e-dialog-up .music {  height: 46px;  width: 70%;  position: relative;  margin: auto;}.kolo-e-dialog .music .search-box,.kolo-e-dialog-up .music .search-box {  box-sizing: border-box;  border: 1px solid #E2E2E2;  box-shadow: 0 1px 4px 0 rgba(0, 0, 0, 0.05);  border-radius: 2px;  height: 44px;  line-height: 44px;}.kolo-e-dialog .music .search-box .status-box,.kolo-e-dialog-up .music .search-box .status-box {  width: 42px;  text-align: center;  float: left;}.kolo-e-dialog .music .search-box .status-box img,.kolo-e-dialog-up .music .search-box .status-box img {  width: 14px;  height: 14px;  vertical-align: -2px;}.kolo-e-dialog .music .search-box p,.kolo-e-dialog-up .music .search-box p {  float: left;  width: 320px;  padding-top: 5px;  margin: 0;}.kolo-e-dialog .music .search-box p input,.kolo-e-dialog-up .music .search-box p input {  min-width: 120px;  border: 0;  padding: 0;  box-shadow: none;  outline: none;  height: 32px;  width: 290px;  line-height: 32px;  float: left;}.kolo-e-dialog .music .search-box p .w-e-icon-close,.kolo-e-dialog-up .music .search-box p .w-e-icon-close {  cursor: pointer;  width: 30px;  float: left;  line-height: 32px;  position: static;  text-align: center;  color: #aaa;  display: none;}.kolo-e-dialog .music .error-audio,.kolo-e-dialog-up .music .error-audio {  color: #EB2135;  font-size: 12px;  text-align: left;}.kolo-e-dialog .music .music-list,.kolo-e-dialog-up .music .music-list {  width: 100%;  position: absolute;  top: 50px;  z-index: 10;  background: #fff;}.kolo-e-dialog .music .music-list ul,.kolo-e-dialog-up .music .music-list ul {  height: 240px;  overflow-y: scroll;  padding: 10px 0;  margin: 0;  box-shadow: 0px 1px 4px 0px rgba(0, 0, 0, 0.08);}.kolo-e-dialog .music .music-list ul::-webkit-scrollbar,.kolo-e-dialog-up .music .music-list ul::-webkit-scrollbar {  width: 1px;  background-color: #eee;}.kolo-e-dialog .music .music-list li,.kolo-e-dialog-up .music .music-list li {  list-style: none;  display: -ms-flexbox;  display: flex;  padding: 0 16px;  -ms-flex-pack: center;      justify-content: center;  -ms-flex-align: center;      align-items: center;  -ms-flex-wrap: wrap;      flex-wrap: wrap;  box-sizing: border-box;  cursor: pointer;  height: 36px;  line-height: 36px;  margin-bottom: 5px;  font-size: 14px;  font-family: Ubuntu-Regular;}.kolo-e-dialog .music .music-list li.active-music,.kolo-e-dialog-up .music .music-list li.active-music,.kolo-e-dialog .music .music-list li:hover,.kolo-e-dialog-up .music .music-list li:hover {  background: #333;}.kolo-e-dialog .music .music-list li.active-music .name,.kolo-e-dialog-up .music .music-list li.active-music .name,.kolo-e-dialog .music .music-list li:hover .name,.kolo-e-dialog-up .music .music-list li:hover .name {  color: #fff;}.kolo-e-dialog .music .music-list li .name,.kolo-e-dialog-up .music .music-list li .name {  -ms-flex: 1;      flex: 1;  white-space: nowrap;  overflow: hidden;  text-overflow: ellipsis;  pointer-events: none;}.kolo-e-dialog .music .music-list li .status-box,.kolo-e-dialog-up .music .music-list li .status-box {  width: 16px;  -ms-flex: 0 0 16px;      flex: 0 0 16px;}.kolo-e-dialog .music .music-list li .status-box img,.kolo-e-dialog-up .music .music-list li .status-box img {  width: 14px;  height: 14px;  display: block;  vertical-align: -2px;}.kolo-e-dialog .music .music-list li .status-box.status-pause img,.kolo-e-dialog-up .music .music-list li .status-box.status-pause img {  display: none;}.kolo-e-dialog .music .music-list li .status-box.status-pause img:nth-child(2),.kolo-e-dialog-up .music .music-list li .status-box.status-pause img:nth-child(2) {  display: inline-block;  *display: inline;  *zoom: 1;}.kolo-e-dialog .music .music-list li .status-box.status-play img,.kolo-e-dialog-up .music .music-list li .status-box.status-play img {  display: inline-block;  *display: inline;  *zoom: 1;}.kolo-e-dialog .music .music-list li .status-box.status-play img:nth-child(2),.kolo-e-dialog-up .music .music-list li .status-box.status-play img:nth-child(2) {  display: none;}.kolo-e-dialog .kolo-link .link-container {  width: 400px;  height: 320px;  box-sizing: border-box;  margin: auto;  margin-top: 30vh;  background: #fff;  border-radius: 4px;  padding: 40px;  position: relative;}.kolo-e-dialog .kolo-link .link-container h3 {  text-align: center;  margin-bottom: 30px;  margin-top: 0;  font-weight: 500;}.kolo-e-dialog .kolo-link .link-container .link {  width: 100%;}.kolo-e-dialog .kolo-link .link-container .link p {  width: 100%;  margin-bottom: 20px;  overflow: hidden;  position: relative;}.kolo-e-dialog .kolo-link .link-container .link p span {  color: #aaaaaa;  position: absolute;  width: 40px;  border-right: 1px solid #E2E2E2;  text-align: center;  box-sizing: border-box;  height: 42px;  line-height: 42px;}.kolo-e-dialog .kolo-link .link-container .link p input {  width: 100%;  height: 42px;  padding-left: 50px;  float: left;  outline: none;  box-sizing: border-box;  background: #FFFFFF;  border: 1px solid #E2E2E2;  box-shadow: 0 1px 4px 0 rgba(0, 0, 0, 0.05);  border-radius: 2px;}.kolo-e-dialog .kolo-link .link-container .link p input::-webkit-input-placeholder {  color: #ddd;}.kolo-e-dialog .kolo-link .link-container .other-link {  font-weight: 400;  font-style: normal;  font-size: 14px;  color: #7F7F7F;  text-align: left;  line-height: 24px;  position: relative;}.kolo-e-dialog .kolo-link .link-container .other-link > p b {  font-weight: 500;}.kolo-e-dialog .kolo-link .link-container .other-link > p span {  cursor: pointer;  margin: 0 5px;}.kolo-e-dialog .kolo-link .link-container .other-link > p span.actived {  text-decoration: underline;}.kolo-e-dialog .kolo-link .link-container .other-link .other-link-content {  display: none;  padding: 14px 10px;  box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.07);  position: absolute;  width: 100%;  top: 30px;  z-index: 2;  background: #fff;  border-radius: 4px;  min-height: 217px;}.kolo-e-dialog .kolo-link .link-container .other-link .search-box {  width: 100%;  margin-bottom: 20px;  overflow: hidden;  position: relative;}.kolo-e-dialog .kolo-link .link-container .other-link .search-box .status-box {  color: #aaaaaa;  position: absolute;  width: 40px;  text-align: center;  box-sizing: border-box;  height: 42px;  display: -ms-flexbox;  display: flex;  -ms-flex-pack: center;      justify-content: center;  -ms-flex-align: center;      align-items: center;}.kolo-e-dialog .kolo-link .link-container .other-link .search-box .status-box img {  width: 18px;  height: 18px;}.kolo-e-dialog .kolo-link .link-container .other-link .search-box input {  width: 100%;  height: 42px;  padding-left: 50px;  float: left;  outline: none;  box-sizing: border-box;  background: #FFFFFF;  border: 1px solid #E2E2E2;  box-shadow: 0 1px 4px 0 rgba(0, 0, 0, 0.05);  border-radius: 2px;}.kolo-e-dialog .kolo-link .link-container .other-link .search-box input::-webkit-input-placeholder {  color: #ddd;}.kolo-e-dialog .kolo-link .link-container .other-link .searchList {  position: absolute;}.kolo-e-dialog .kolo-link .link-container .other-link .search-list {  height: 200px;  max-height: 200px;  overflow-y: auto;  overflow-x: hidden;}.kolo-e-dialog .kolo-link .link-container .other-link .search-list .search-li {  width: 320px;  padding: 10px;  box-sizing: border-box;  display: -ms-flexbox;  display: flex;  cursor: pointer;}.kolo-e-dialog .kolo-link .link-container .other-link .search-list .search-li:hover {  background: #eaeaea;}.kolo-e-dialog .kolo-link .link-container .other-link .search-list .search-li .search-li-left {  width: 48px;  min-width: 48px;  height: 48px;  margin-right: 12px;  border-radius: 50%;  background: #7F7F7F;  border: 1px solid #fff;  overflow: hidden;  box-sizing: border-box;}.kolo-e-dialog .kolo-link .link-container .other-link .search-list .search-li .search-li-left img {  width: 100%;  height: 100%;  border-radius: 50%;}.kolo-e-dialog .kolo-link .link-container .other-link .search-list .search-li .search-li-right {  width: 260px;}.kolo-e-dialog .kolo-link .link-container .other-link .search-list .search-li .search-li-right h3,.kolo-e-dialog .kolo-link .link-container .other-link .search-list .search-li .search-li-right p {  margin: 0;  text-align: left;}.kolo-e-dialog .kolo-link .link-container .other-link .search-list .search-li .search-li-right p {  font-size: 12px;}.kolo-e-dialog .kolo-link .link-container .w-e-up-btn {  text-align: center;}.kolo-e-dialog .kolo-link .link-container .w-e-up-btn button {  cursor: pointer;  width: 140px;  height: 42px;  line-height: 42px;  background: #EB2135;  border-radius: 4px;  font-family: Ubuntu-Regular;  font-size: 14px;  border: 0;  margin: 0;  padding: 0;  color: #fff;  outline: none;}.kolo-e-dialog .kolo-link .link-container .w-e-up-btn button[disabled=true] {  opacity: 0.6;  filter: alpha(opacity=60);}.kolo-e-dialog .kolo-link .link-container .w-e-up-btn p {  font-family: Ubuntu-Regular;  margin: 0;  margin-bottom: 5px;  font-weight: 400;}.kolo-e-dialog .kolo-link .link-container .w-e-icon-close {  position: absolute;  right: 8px;  top: 4px;  cursor: pointer;  color: #aaa;}.kolo-e-dialog-up .kolo-upload {  width: 439px;  height: 235px;}.kolo-e-dialog-up .kolo-upload .upload-container {  width: 360px;}.kolo-e-dialog-up .kolo-upload .w-e-up-btn button {  margin-top: 0;  margin-bottom: 24px;  cursor: pointer;}.kolo-e-dialog-up .kolo-upload .w-e-up-btn p {  font-size: 12px;  color: #aaaaaa;  text-align: center;}.w-e-toolbar .w-e-droplist {  position: absolute;  left: 0;  top: 0;  background-color: #fff;  border: 1px solid #f1f1f1;  border-right-color: #ccc;  border-bottom-color: #ccc;}.w-e-toolbar .w-e-droplist .w-e-dp-title {  text-align: center;  color: #999;  line-height: 2;  border-bottom: 1px solid #f1f1f1;  font-size: 13px;}.w-e-toolbar .w-e-droplist ul.w-e-list {  list-style: none;  line-height: 1;}.w-e-toolbar .w-e-droplist ul.w-e-list li.w-e-item {  color: #333;  padding: 5px 0;}.w-e-toolbar .w-e-droplist ul.w-e-list li.w-e-item:hover {  background-color: #f1f1f1;}.w-e-toolbar .w-e-droplist ul.w-e-block {  list-style: none;  text-align: left;  padding: 5px;}.w-e-toolbar .w-e-droplist ul.w-e-block li.w-e-item {  display: inline-block;  *display: inline;  *zoom: 1;  padding: 3px 5px;}.w-e-toolbar .w-e-droplist ul.w-e-block li.w-e-item:hover {  background-color: #f1f1f1;}@font-face {  font-family: \'w-e-icon\';  src: url(data:application/x-font-woff;charset=utf-8;base64,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) format(\'truetype\');  font-weight: normal;  font-style: normal;}[class^="w-e-icon-"],[class*=" w-e-icon-"] {  /* use !important to prevent issues with browser extensions that change fonts */  font-family: \'w-e-icon\' !important;  speak: none;  font-style: normal;  font-weight: normal;  font-variant: normal;  text-transform: none;  line-height: 1;  /* Better Font Rendering =========== */  -webkit-font-smoothing: antialiased;  -moz-osx-font-smoothing: grayscale;}.w-e-icon-upload2:before {  content: "\\e9c6";}.w-e-icon-trash-o:before {  content: "\\f014";}.w-e-icon-header:before {  content: "\\f1dc";}.w-e-icon-pencil2:before {  content: "\\e906";}.w-e-icon-paint-brush:before {  content: "\\f1fc";}.w-e-icon-image:before {  content: "\\e90d";}.w-e-icon-play:before {  content: "\\e912";}.w-e-icon-location:before {  content: "\\e947";}.w-e-icon-undo:before {  content: "\\e965";}.w-e-icon-redo:before {  content: "\\e966";}.w-e-icon-quotes-left:before {  content: "\\e977";}.w-e-icon-list-numbered:before {  content: "\\e9b9";}.w-e-icon-list2:before {  content: "\\e9bb";}.w-e-icon-link:before {  content: "\\e9cb";}.w-e-icon-happy:before {  content: "\\e9df";}.w-e-icon-bold:before {  content: "\\ea62";}.w-e-icon-underline:before {  content: "\\ea63";}.w-e-icon-italic:before {  content: "\\ea64";}.w-e-icon-strikethrough:before {  content: "\\ea65";}.w-e-icon-table2:before {  content: "\\ea71";}.w-e-icon-paragraph-left:before {  content: "\\ea77";}.w-e-icon-paragraph-center:before {  content: "\\ea78";}.w-e-icon-paragraph-right:before {  content: "\\ea79";}.w-e-icon-terminal:before {  content: "\\f120";}.w-e-icon-page-break:before {  content: "\\ea68";}.w-e-icon-cancel-circle:before {  content: "\\ea0d";}.w-e-icon-font:before {  content: "\\ea5c";}.w-e-icon-text-heigh:before {  content: "\\ea5f";}/*自定义样式icon*/@font-face {  font-family: \'kolo-iconfont\';  src: url(data:application/x-font-woff2;charset=utf-8;base64,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) format(\'woff2\'), url(\'fonts/ueditor.woff\') format(\'woff\'), url(\'fonts/ueditor.ttf\') format(\'truetype\');  font-weight: normal;  font-style: normal;}.w-e-icon-bold,.w-e-icon-h1,.w-e-icon-h2,.w-e-icon-quotes-left,.w-e-icon-split,.w-e-icon-image,.w-e-icon-play,.w-e-icon-audio,.w-e-icon-undo,.w-e-icon-redo {  font-family: "kolo-iconfont" !important;  font-size: 16px;  font-style: normal;  -webkit-font-smoothing: antialiased;  -moz-osx-font-smoothing: grayscale;}.w-e-icon-bold:before {  content: \'\\e60e\';}.w-e-icon-split:before {  content: \'\\e606\';}.w-e-icon-h1:before {  content: \'\\e608\';}.w-e-icon-h2:before {  content: \'\\e60d\';}.w-e-icon-image:before {  content: \'\\e609\';}.w-e-icon-quotes-left:before {  content: \'\\e60b\';}.w-e-icon-play:before {  content: \'\\e607\';}.w-e-icon-audio:before {  content: \'\\e60c\';}.w-e-icon-undo:before {  content: \'\\e605\';}.w-e-icon-redo:before {  content: \'\\e60a\';}.w-e-toolbar {  display: -ms-flexbox;  display: flex;  height: 40px;  line-height: 40px;  /* flex-wrap: wrap; */  /* 单个菜单 */}.w-e-toolbar .w-e-menu {  position: relative;  text-align: center;  padding: 0 16px;  cursor: pointer;}.w-e-toolbar .w-e-menu i {  color: #8590A6;  font-size: 16px;}.w-e-toolbar .w-e-menu:hover i {  color: #333;}.w-e-toolbar .w-e-active i {  color: #1e88e5;}.w-e-toolbar .w-e-active:hover i {  color: #1e88e5;}.w-e-text-container .w-e-panel-container {  position: absolute;  top: 0;  left: 50%;  border: 1px solid #ccc;  border-top: 0;  box-shadow: 1px 1px 2px #ccc;  color: #333;  background-color: #fff;  /* 为 emotion panel 定制的样式 */  /* 上传图片的 panel 定制样式 */}.w-e-text-container .w-e-panel-container .w-e-panel-close {  position: absolute;  right: 0;  top: 0;  padding: 5px;  margin: 2px 5px 0 0;  cursor: pointer;  color: #999;}.w-e-text-container .w-e-panel-container .w-e-panel-close:hover {  color: #333;}.w-e-text-container .w-e-panel-container .w-e-panel-tab-title {  list-style: none;  display: -ms-flexbox;  display: flex;  font-size: 14px;  margin: 2px 10px 0 10px;  border-bottom: 1px solid #f1f1f1;}.w-e-text-container .w-e-panel-container .w-e-panel-tab-title .w-e-item {  padding: 3px 5px;  color: #999;  cursor: pointer;  margin: 0 3px;  position: relative;  top: 1px;}.w-e-text-container .w-e-panel-container .w-e-panel-tab-title .w-e-active {  color: #333;  border-bottom: 1px solid #333;  cursor: default;  font-weight: 700;}.w-e-text-container .w-e-panel-container .w-e-panel-tab-content {  padding: 10px 15px 10px 15px;  font-size: 16px;  /* 输入框的样式 */  /* 按钮的样式 */}.w-e-text-container .w-e-panel-container .w-e-panel-tab-content input:focus,.w-e-text-container .w-e-panel-container .w-e-panel-tab-content textarea:focus,.w-e-text-container .w-e-panel-container .w-e-panel-tab-content button:focus {  outline: none;}.w-e-text-container .w-e-panel-container .w-e-panel-tab-content textarea {  width: 100%;  border: 1px solid #ccc;  padding: 5px;}.w-e-text-container .w-e-panel-container .w-e-panel-tab-content textarea:focus {  border-color: #1e88e5;}.w-e-text-container .w-e-panel-container .w-e-panel-tab-content input[type=text] {  border: none;  border-bottom: 1px solid #ccc;  font-size: 14px;  height: 20px;  color: #333;  text-align: left;}.w-e-text-container .w-e-panel-container .w-e-panel-tab-content input[type=text].small {  width: 30px;  text-align: center;}.w-e-text-container .w-e-panel-container .w-e-panel-tab-content input[type=text].block {  display: block;  width: 100%;  margin: 10px 0;}.w-e-text-container .w-e-panel-container .w-e-panel-tab-content input[type=text]:focus {  border-bottom: 2px solid #1e88e5;}.w-e-text-container .w-e-panel-container .w-e-panel-tab-content .w-e-button-container button {  font-size: 14px;  color: #1e88e5;  border: none;  padding: 5px 10px;  background-color: #fff;  cursor: pointer;  border-radius: 3px;}.w-e-text-container .w-e-panel-container .w-e-panel-tab-content .w-e-button-container button.left {  float: left;  margin-right: 10px;}.w-e-text-container .w-e-panel-container .w-e-panel-tab-content .w-e-button-container button.right {  float: right;  margin-left: 10px;}.w-e-text-container .w-e-panel-container .w-e-panel-tab-content .w-e-button-container button.gray {  color: #999;}.w-e-text-container .w-e-panel-container .w-e-panel-tab-content .w-e-button-container button.red {  color: #c24f4a;}.w-e-text-container .w-e-panel-container .w-e-panel-tab-content .w-e-button-container button:hover {  background-color: #f1f1f1;}.w-e-text-container .w-e-panel-container .w-e-panel-tab-content .w-e-button-container:after {  content: "";  display: table;  clear: both;}.w-e-text-container .w-e-panel-container .w-e-emoticon-container .w-e-item {  cursor: pointer;  font-size: 18px;  padding: 0 3px;  display: inline-block;  *display: inline;  *zoom: 1;}.w-e-text-container .w-e-panel-container .w-e-up-img-container {  text-align: center;}.w-e-text-container .w-e-panel-container .w-e-up-img-container .w-e-up-btn {  display: inline-block;  *display: inline;  *zoom: 1;  color: #999;  cursor: pointer;  font-size: 60px;  line-height: 1;}.w-e-text-container .w-e-panel-container .w-e-up-img-container .w-e-up-btn:hover {  color: #333;}.w-e-text {  padding: 0 10px;  padding-top: 10px;}.w-e-text p,.w-e-text h1,.w-e-text h2,.w-e-text h3,.w-e-text h4,.w-e-text h5,.w-e-text table,.w-e-text pre {  margin: 10px 0;  line-height: 1.5;}.w-e-text h1 {  font-size: 16px;  font-family: Ubuntu-Medium;  font-weight: 500;  color: #333;  text-align: center;}.w-e-text h2 {  font-size: 12px;  font-family: Ubuntu-regular;  font-weight: 500;  color: #aaa;  text-align: center;}.w-e-text p {  font-size: 16px;  font-family: Montserrat-Light;  font-weight: 300;  color: #666666;}.w-e-text ul,.w-e-text ol {  margin: 10px 0 10px 20px;}.w-e-text blockquote {  display: block;  border-left: 2px solid #E2E2E2;  padding: 5px 10px;  margin: 10px 0;  line-height: 1.4;  font-size: 14px;  color: #AAA;}.w-e-text code {  display: inline-block;  *display: inline;  *zoom: 1;  background-color: #f1f1f1;  border-radius: 3px;  padding: 3px 5px;  margin: 0 3px;}.w-e-text pre code {  display: block;}.w-e-text div.split {  width: 20%;  height: 1px;  background: #E2E2E2;  margin: 30px auto;}.w-e-text div.split:before {  content: \' \';}.w-e-text table {  border-top: 1px solid #ccc;  border-left: 1px solid #ccc;}.w-e-text table td,.w-e-text table th {  border-bottom: 1px solid #ccc;  border-right: 1px solid #ccc;  padding: 3px 5px;}.w-e-text table th {  border-bottom: 2px solid #ccc;  text-align: center;}.w-e-text:focus {  outline: none;}.w-e-text img,.w-e-text video {  cursor: pointer;}.w-e-text .kolo-img {  width: 100%;  max-width: 345px;  margin: 15px auto;  position: relative;}.w-e-text .kolo-img img {  width: 100%;}.w-e-text .kolo-img i {  position: absolute;  cursor: pointer;  right: -10px;  top: -10px;  color: #fff;  background: #ccc;  font-size: 12px;  width: 20px;  height: 20px;  text-align: center;  line-height: 20px;  border-radius: 50%;  display: none;}.w-e-text .kolo-img i img {  width: 100%;  height: 100%;  pointer-events: none;}.w-e-text .kolo-img:hover i {  display: block;}.w-e-text .kolo-audio {  width: 100%;  max-width: 345px;  margin: 10px auto;  position: relative;  padding-bottom: 10px;}.w-e-text .kolo-audio .audio-content {  width: 100%;  margin-bottom: 2px;  height: 90px;  background: #f9f9f9;  border-radius: 4px;  padding: 15px;  box-sizing: border-box;}.w-e-text .kolo-audio i {  position: absolute;  cursor: pointer;  right: -10px;  top: -10px;  color: #fff;  background: #ccc;  font-size: 12px;  width: 20px;  height: 20px;  text-align: center;  line-height: 20px;  border-radius: 50%;  display: none;}.w-e-text .kolo-audio i img {  width: 100%;  height: 100%;  pointer-events: none;}.w-e-text .kolo-audio:hover i {  display: block;}.w-e-text .kolo-audio .music-img {  width: 60px;  height: 60px;  border-radius: 4px;  margin-right: 10px;  float: left;}.w-e-text .kolo-audio .music-img img {  width: 100%;  height: 100%;}.w-e-text .kolo-audio .audio-title {  width: calc(100% - 100px);  float: left;  display: -ms-flexbox;  display: flex;  -ms-flex-direction: column;      flex-direction: column;  -ms-flex-pack: center;      justify-content: center;  height: 60px;}.w-e-text .kolo-audio .audio-title h3 {  font-size: 14px;  font-family: Montserrat-Medium;  font-weight: 500;  color: #333333;  line-height: 18px;  margin: 0;  overflow: hidden;  white-space: nowrap;  text-overflow: ellipsis;}.w-e-text .kolo-audio .audio-title p {  font-size: 10px;  font-family: Montserrat-Regular;  font-weight: 400;  color: #aaaaaa;  line-height: 13px;  margin: 6px 0;}.w-e-text .kolo-audio .audio-control {  float: left;  padding-top: 15px;}.w-e-text .kolo-audio .audio-control img {  width: 28px;  height: 28px;}.w-e-text .kolo-audio .audio-control.status-play img {  display: inline-block;  *display: inline;  *zoom: 1;}.w-e-text .kolo-audio .audio-control.status-play img:nth-child(2) {  display: none;}.w-e-text .kolo-audio .audio-control.status-pause img {  display: none;}.w-e-text .kolo-audio .audio-control.status-pause img:nth-child(2) {  display: inline-block;  *display: inline;  *zoom: 1;}.w-e-text .kolo-audio .input-p {  text-align: center;  width: 100%;  max-width: 345px;  margin: auto;  line-height: 1.2;}.w-e-text .kolo-audio .input-p input {  width: 100%;  height: 37px;  line-height: 36px;  background: #ffffff;  border-radius: 2px;  border: 1px solid #e2e2e2;  padding: 0 15px;  box-sizing: border-box;  font-size: 12px;  font-family: Montserrat-Regular;  font-weight: 400;  color: #aaa;}.w-e-text .kolo-audio .input-p input::-webkit-input-placeholder,.w-e-text .kolo-audio .input-p input::-moz-placeholder,.w-e-text .kolo-audio .input-p input::-ms-input-placeholder {  color: red;}.w-e-text .kolo-audio .input-p span {  font-size: 12px;  font-family: Montserrat-Regular;  font-weight: 400;  color: #aaa;}.w-e-text .kolo-video {  width: 100%;  max-width: 345px;  margin: 15px auto;  height: auto;  display: -ms-flexbox;  display: flex;  position: relative;}.w-e-text .kolo-video .kolo-video-container {  width: 100%;  min-height: 140px;  background: #000000;  display: -ms-flexbox;  display: flex;  position: relative;}.w-e-text .kolo-video .kolo-video-container .progress-content {  width: 100%;  display: -ms-flexbox;  display: flex;  max-width: 345px;  min-height: 260px;  -ms-flex-align: center;      align-items: center;  -ms-flex-direction: column;      flex-direction: column;  -ms-flex-pack: center;      justify-content: center;  position: relative;}.w-e-text .kolo-video .kolo-video-container .progress-content p {  height: 20px;  margin: 0;  margin-bottom: 10px;  position: absolute;  bottom: 20px;  margin: auto;}.w-e-text .kolo-video .kolo-video-container .progress-content p:first-child {  bottom: 50px;}.w-e-text .kolo-video .kolo-video-container .progress-content p:last-child {  bottom: 20px;}.w-e-text .kolo-video .kolo-video-container .progress-content img {  -ms-flex-align: center;      align-items: center;  width: 100%;  max-width: 345px;}.w-e-text .kolo-video .kolo-video-container .progress-content .video-control-btn {  width: 40px;  height: 40px;  position: absolute;  left: 0;  right: 0;  top: 0;  bottom: 0;  margin: auto;}.w-e-text .kolo-video .kolo-video-container .progress-content .subtitle-video {  text-align: center;  font-size: 12px;  color: #fff;}.w-e-text .kolo-video .kolo-video-container .progress-content .video-progress {  text-align: center;  font-size: 12px;  color: #fff;}.w-e-text .kolo-video .kolo-video-container .video-content {  display: -ms-flexbox;  display: flex;  -ms-flex-align: center;      align-items: center;}.w-e-text .kolo-video .kolo-video-container .video-content img {  -ms-flex-align: center;      align-items: center;}.w-e-text .kolo-video .kolo-video-container .video-content video,.w-e-text .kolo-video .kolo-video-container .video-content img {  width: 100%;  max-width: 345px;  min-height: 180px;  max-height: 195px;}.w-e-text .kolo-video .kolo-video-container .video-content .video-control-btn {  width: 40px;  height: 40px;  min-height: 40px;  position: absolute;  left: 0;  right: 0;  top: 0;  bottom: 0;  margin: auto;}.w-e-text .kolo-video .kolo-video-container .video-content p {  position: absolute;  bottom: 0;  text-align: center;  width: 100%;  color: #ccc;}.w-e-text .kolo-video i {  position: absolute;  cursor: pointer;  right: -10px;  top: -10px;  color: #fff;  font-size: 14px;  width: 20px;  height: 20px;  text-align: center;  line-height: 20px;  border-radius: 50%;}.w-e-text .kolo-video i img {  width: 100%;  height: 100%;  pointer-events: none;}.w-e-text .kolo-video .before-img {  position: absolute;  cursor: pointer;  left: 10px;  top: 10px;  font-size: 12px;  color: #333;  padding: 3px 6px;  background: #fff;  border-radius: 10px;}.w-e-text .kolo-video .before-img,.w-e-text .kolo-video .w-e-icon-close {  display: none;}.w-e-text .kolo-video:hover .before-img,.w-e-text .kolo-video:hover .w-e-icon-close {  display: block;}.w-e-text .kolo-inline-link {  text-decoration: underline;  color: rgba(65, 55, 56, 0.7);  cursor: pointer;}.w-e-text .kolo-link {  width: 100%;  max-width: 300px;  margin: 15px auto;  height: auto;  display: -ms-flexbox;  display: flex;  position: relative;  height: 90px;  background: #f9f9f9;  border-radius: 4px;  box-shadow: 0 0 3px 3px #eee;}.w-e-text .kolo-link > a {  display: -ms-flexbox;  display: flex;  overflow: hidden;  text-decoration: none;  padding: 15px;  width: 100%;}.w-e-text .kolo-link > a .link-img {  width: 60px;  min-width: 60px;  height: 60px;}.w-e-text .kolo-link > a .link-img img {  width: 100%;  height: 100%;}.w-e-text .kolo-link > a .link-content {  width: 100%;  padding-left: 20px;  display: -ms-flexbox;  display: flex;  -ms-flex-direction: column;      flex-direction: column;  -ms-flex-pack: center;      justify-content: center;}.w-e-text .kolo-link > a .link-content h3 {  font-size: 14px;  font-family: Montserrat-Medium;  font-weight: 500;  color: #333333;  line-height: 30px;  margin: 0;  overflow: hidden;  white-space: nowrap;  text-overflow: ellipsis;}.w-e-text .kolo-link > a .link-content p {  font-size: 10px;  font-family: Montserrat-Regular;  font-weight: 400;  color: #aaaaaa;  line-height: 0px;  margin: 0;  overflow: hidden;  white-space: nowrap;  text-overflow: ellipsis;}';

// 将 css 代码添加到 <style> 中
var style = document.createElement('style');
style.type = 'text/css';
style.innerHTML = inlinecss;
document.getElementsByTagName('HEAD').item(0).appendChild(style);

// 返回
var index = window.wangEditor || Editor;

return index;

})));
