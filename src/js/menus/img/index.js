/*
    menu - img
*/
import $ from '../../util/dom-core.js'
import { getRandom, arrForEach } from '../../util/util.js'
import replaceLang from '../../util/replace-lang.js'

// 构造函数
function Image(editor) {
    this.editor = editor
    const imgMenuId = getRandom('w-e-img')
    this.$elem = $('<div class="w-e-menu" id="' + imgMenuId + '"><i title="添加图片" class="w-e-icon-image"></i></div>')
    editor.imgMenuId = imgMenuId
    this.type = 'panel'

    // 当前是否 active 状态
    this._active = false
}

// 原型
Image.prototype = {
    constructor: Image,

    onClick: function () {
        const editor = this.editor
        const config = editor.config

        this._createInsertPanel();
        if (config.qiniu) {
            return
        }
    },

    _createInsertPanel: function () {
        const editor = this.editor
        const uploadImg = editor.uploadImg
        const config = editor.config

        var containerId = editor.toolbarSelector;

        // id
        const dialogId = getRandom('img-dialog')
        const upTriggerId = getRandom('up-trigger')
        const upFileId = getRandom('up-file')
        const closeUpload = getRandom('cloase-img')

        //创建弹窗 
        var template = `
                <div class="kolo-upload">
                    <div class="upload-container">
                        <h3>添加图片</h3>
                        <div class="w-e-up-btn">
                            <button id="${upTriggerId}">选择图片</button>
                            <p>为了获得更好的推荐</p>
                            <p>建议上传720p（1280x720）或更高分辨率的图片</p>
                        </div>
                        <div style="display:none;">
                            <input id="${upFileId}" type="file" multiple="multiple" accept="image/jpg,image/jpeg,image/png,image/svg,image/gif,image/bmp"/>
                        </div>
                        <i id="${closeUpload}" class="w-e-icon-close">×</i>
                    </div>
                </div>`;
        //替换多语言        
        template = replaceLang(editor, template);

        //添加弹窗
        var dialog = document.createElement('div');
        dialog.className = 'kolo-e-dialog-up';
        dialog.id = dialogId;
        dialog.innerHTML = template;  
        document.querySelector(containerId).appendChild(dialog); 

        //关闭弹窗
        document.querySelector('#' + closeUpload).addEventListener('click', (e)=>{
            e.stopPropagation();
            var dom = document.querySelector('#' + dialogId);
            dom.parentNode.removeChild(dom);
        })

        //点击按钮选择图片
        document.querySelector('#' + upTriggerId).addEventListener('click', (e)=>{
            e.stopPropagation();
            document.querySelector('#' + upFileId).click();
        })

        //文件选择
        document.querySelector('#' + upFileId).addEventListener('change', (e)=>{
            const $file = $('#' + upFileId)
            const fileElem = $file[0];
            if (!fileElem) {
                // 返回 true 可关闭 panel
                return true
            }

            // 获取选中的 file 对象列表
            const fileList = fileElem.files
            if (fileList.length) {
                uploadImg.uploadImg(fileList);
                var dom = document.querySelector('#' + dialogId);
                dom.parentNode.removeChild(dom);
            }        
        })

    },

    // 试图改变 active 状态
    tryChangeActive: function (e) {
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
}

export default Image