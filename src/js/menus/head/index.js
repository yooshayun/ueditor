/*
    menu - header
*/
import $ from '../../util/dom-core.js'

// 构造函数
function Head(editor) {
    this.editor = editor
    this.$elem = $('<div class="w-e-menu"><i title="主标题" class="w-e-icon-h1"></i></div>')
    this.type = 'click'

    // 当前是否 active 状态
    this._active = false
}

// 原型
Head.prototype = {
    constructor: Head,

    onClick: function(e) {
        //
        if(this._active) {
            this._command('<p>')
        } else {
            this._command('<h1>')
        }
    },

    // 执行命令
    _command: function (value) {
        const editor = this.editor
        const $selectionElem = editor.selection.getSelectionContainerElem();
        const nodeName = $selectionElem.getNodeName();
        const $elem = this.$elem;
        //选区
        let start = editor.selection.getSelectionStartElem()[0];
        let end = editor.selection.getSelectionEndElem()[0];
        
        //对引用内容不生效
        if (nodeName === 'BLOCKQUOTE') {
            return;
        }

        //选择多行区域
        if(nodeName == 'DIV' && $selectionElem[0].className.indexOf('w-e-text') >= 0) {
            // console.log('多区域选中！！', $selectionElem[0].children, start, end);
            let arr = $selectionElem[0].children, length = arr.length;
            let startIndex = 0, endIndex = length, selectionDom = [];
            for(let i = 0; i < length; i++) {
                if(arr[i] == start) {
                    startIndex = i;
                }
                if(arr[i] == end) {
                    endIndex = i;
                }
            }
            let isCenter = true; //判断当前区域的状态  只要有一个不居中，则不是居中状态。 false布局中，true居中 
            
            for(let i = startIndex; i <= endIndex; i++) {
                let dom = $(arr[i]);
                // console.log(dom, dom.getNodeName())
                let name = dom.getNodeName();
                if(name == 'P' || name == 'H1' || name == 'H2') {
                    
                }
            }
            if(isCenter) {
                
            } else {
                
            }
            // console.log(startIndex, endIndex, selectionDom, 'selectionDom');
        } else {
            //选中单行区域
            
        }

        editor.cmd.do('formatBlock', value)
    },

    // 试图改变 active 状态
    tryChangeActive: function (e) {
        const editor = this.editor
        const $elem = this.$elem
        const reg = /^h1/i
        const cmdValue = editor.cmd.queryCommandValue('formatBlock')
        if (reg.test(cmdValue)) {
            this._active = true
            $elem.addClass('w-e-active')
        } else {
            this._active = false
            $elem.removeClass('w-e-active')
        }
    }
}

export default Head