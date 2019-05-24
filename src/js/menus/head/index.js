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

        // const $selectionElem = editor.selection.getSelectionContainerElem()
        // console.log($selectionElem, editor.$textElem.equal($selectionElem));
        // if (editor.$textElem.equal($selectionElem)) {
        //     // 不能选中多行来设置标题，否则会出现问题
        //     // 例如选中的是 <p>xxx</p><p>yyy</p> 来设置标题，设置之后会成为 <h1>xxx<br>yyy</h1> 不符合预期
        //     return
        // }

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