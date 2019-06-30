/*
    menu - quote
*/
import $ from '../../util/dom-core.js'
import { UA } from '../../util/util.js'

// 构造函数
function Quote(editor) {
    this.editor = editor
    this.$elem = $(
        `<div class="w-e-menu">
            <i title="引用" class="w-e-icon-quotes-left"></i>
        </div>`
    )
    this.type = 'click'

    // 当前是否 active 状态
    this._active = false
}

// 原型
Quote.prototype = {
    constructor: Quote,

    onClick: function (e) {
        const editor = this.editor
        const $selectionElem = editor.selection.getSelectionContainerElem()
        const nodeName = $selectionElem.getNodeName();
        const range = editor.selection.getRange();
        const start = range.startOffset;
        const end = range.endOffset;
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
        let content, $targetELem
        if (nodeName === 'P' || nodeName === 'H1' || nodeName === 'H2') {
            // 将 P 转换为 quote
            content = $selectionElem.text()
            $targetELem = $(`<blockquote>${content}</blockquote>`)
            $targetELem.insertAfter($selectionElem)
            $selectionElem.remove()
        } else if (nodeName === 'BLOCKQUOTE') {
            // 撤销 quote
            content = $selectionElem.text()
            $targetELem = $(`<p>${content}</p>`)
            $targetELem.insertAfter($selectionElem)
            $selectionElem.remove()
        }
        if(!$targetELem) {
            return;
        }
        // console.log(content, content.length - 1, $targetELem, '修改后的选区');
        editor.selection.setSelectionStart($targetELem[0].firstChild, start);
        editor.selection.setSelectionEnd($targetELem[0].firstChild, end);
        
        editor.selection.restoreSelection();

        // console.log(editor.selection.getRange(), '获取选区');
    },

    tryChangeActive: function (e) {
        const editor = this.editor
        const $elem = this.$elem
        const reg = /^BLOCKQUOTE$/i
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

export default Quote