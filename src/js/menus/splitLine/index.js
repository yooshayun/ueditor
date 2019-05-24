/**
 *  分割线 splitline
 */

import $ from '../../util/dom-core.js'
import { getRandom } from '../../util/util.js'

function SplitLine (editor) {
    this.editor = editor;
    this.$elem = $(
        `<div class="w-e-menu">
            <i title="分割线" class="w-e-icon-split"></i>
        </div>`
    )
    this.type = 'click';
    
    //是否选中分割线
    this._active = false;
}

SplitLine.prototype = {
    constructor: SplitLine,

    //点击事件
    onClick: function(e) {
        //
        this._createinsertDom();
    },

    //创建新的分割线
    _createinsertDom: function() {
        const editor = this.editor;
        let html = '<hr/><p><br></p>';

        editor.cmd.do('insertHTML', html);
    }
}


export default SplitLine