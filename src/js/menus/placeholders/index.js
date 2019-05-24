/*
    placeholders-menu
*/
import $ from '../../util/dom-core.js'

// 构造函数
function Placeholders(editor) {
    this.editor = editor
    this.$elem = $(
        `<div class="w-e-menu">
            
        </div>`
    )
    this.type = 'click'

    // 当前是否 active 状态
    this._active = false
}

export default Placeholders