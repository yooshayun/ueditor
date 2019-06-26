/*
    menu - justify
*/
import $ from '../../util/dom-core.js'
import DropList from '../droplist.js'

// 构造函数
function Justify(editor) {
    this.editor = editor
    this.$elem = $('<div class="w-e-menu"><i class="w-e-icon-paragraph-center"></i></div>');
    this.type = 'click'

    // 当前是否 active 状态
    this._active = false

}

// 原型
Justify.prototype = {
    constructor: Justify,

    onClick: function (e) {
        const editor = this.editor
        const $selectionElem = editor.selection.getSelectionContainerElem();
        const nodeName = $selectionElem.getNodeName();
        const $elem = this.$elem;
        let start = editor.selection.getSelectionStartElem()[0];
        let end = editor.selection.getSelectionEndElem()[0];
        const range = editor.selection.getRange();
        console.log(nodeName, $selectionElem, start, end);

        //对引用内容不生效
        if (nodeName === 'BLOCKQUOTE') {
            return;
        }

        //选择多行区域
        if(nodeName == 'DIV' && $selectionElem[0].className.indexOf('w-e-text') >= 0) {
            console.log('多区域选中！！', $selectionElem[0].children, start, end);
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
                selectionDom.push(dom);
                let cmdValue = dom.attr('style') || '';
                let reg = /text-align: center;/i;
                if(!reg.test(cmdValue) && dom.getNodeName() == 'P') {
                    isCenter = false;
                }
            }
            

            console.log(startIndex, endIndex, selectionDom, 'selectionDom');
        } else {
            //选中单行区域
            const cmdValue = $selectionElem.attr('style') || '';
            const reg = /text-align: center;/i;
            console.log(cmdValue, reg.test(cmdValue), 'cmdValue');

            //
            if(reg.test(cmdValue)) {
                if(!cmdValue) {
                    $selectionElem.removeAttr('style');
                } else {
                    $selectionElem.attr('style', cmdValue.replace(reg, ''));
                }
                $elem.removeClass('w-e-active');
            } else {
                $selectionElem.attr('style', cmdValue + 'text-align: center;');
                // editor.cmd.do('justifyCenter');
                $elem.addClass('w-e-active');
            }
        }
    },

    tryChangeActive: function (e) {
        const editor = this.editor
        const $elem = this.$elem;
        // const $selectionELem = editor.selection.getSelectionContainerElem()
        const cmdValue = editor.cmd.queryCommandState('justifyCenter');
        
        // console.log($elem, 'cmdValue:' + cmdValue, $selectionELem, editor.cmd.queryCommandState('justifyCenter'));
        if (cmdValue) {
            this._active = true
            $elem.addClass('w-e-active')
        } else {
            this._active = false
            $elem.removeClass('w-e-active')
        }
    }
}

export default Justify