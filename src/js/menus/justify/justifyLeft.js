/*
    menu - justify
*/
import $ from '../../util/dom-core.js'
import DropList from '../droplist.js'

// 构造函数
function Justify(editor) {
    this.editor = editor
    this.$elem = $('<div class="w-e-menu"><i class="w-e-icon-paragraph-left"></i></div>');
    this.type = 'click'

    // 当前是否 active 状态
    this._active = false

}

// 原型
Justify.prototype = {
    constructor: Justify,

    onClick: function (e) {
        const editor = this.editor
        const $selectionElem = editor.selection.getSelectionListElem();
        const $elem = this.$elem;
        const lengthElem = $selectionElem.length;
              
        if(lengthElem == 1) {
            //选中单行区域

            if(this.isJustifyCenter($selectionElem)) {
                $selectionElem[0].css('text-align', '');
                $elem.removeClass('w-e-active');
            } else {
                $selectionElem[0].css('text-align', 'left');
                // editor.cmd.do('justifyCenter');
                $elem.addClass('w-e-active');
            }

        } else {
            //选择多行区域

            if(this.isJustifyCenter($selectionElem)) {
                $selectionElem.forEach(element => {
                    element.css('text-align', '');
                });
                $elem.removeClass('w-e-active');
            } else {
                $selectionElem.forEach(element => {
                    element.css('text-align', 'left');
                });
                // editor.cmd.do('justifyCenter');
                $elem.addClass('w-e-active');
            }
        }

        editor.selection.restoreSelection();
    },

    //判断选中区域是否处于居中状态
    isJustifyCenter: function(list) {
        let bool = false;
        let arr = [];
        //只判断选区中的 文本区域 H1，H2, P
        arr = list.filter(elem => {
            let name = elem.getNodeName();
            return name == 'H1' || name == 'P' || name == 'H2'
        })
        bool = arr.every(elem => {
            return elem.css('text-align') === 'left'
        })
        return bool
    },

    tryChangeActive: function (e) {
        const editor = this.editor
        const $elem = this.$elem;
        const $selectionELem = editor.selection.getSelectionListElem()
        // const cmdValue = editor.cmd.queryCommandState('justifyCenter');
        
        if (this.isJustifyCenter($selectionELem)) {
            this._active = true
            $elem.addClass('w-e-active')
        } else {
            this._active = false
            $elem.removeClass('w-e-active')
        }
    }
}

export default Justify