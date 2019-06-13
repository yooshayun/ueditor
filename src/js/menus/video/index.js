/*
    menu - video
*/
import $ from '../../util/dom-core.js'
import { getRandom } from '../../util/util.js'
import Panel from '../panel.js'
import replaceLang from '../../util/replace-lang.js'

// 构造函数
function Video(editor) {
    this.editor = editor;
    var videoMenuId = getRandom('w-e-video');
    this.$elem = $('<div class="w-e-menu" id="' + videoMenuId + '"><i title="添加视频" class="w-e-icon-play"></i></div>');
    editor.videoMenuId = videoMenuId;
    this.type = 'panel';

    // 当前是否 active 状态
    this._active = false
}

// 原型
Video.prototype = {
    constructor: Video,

    onClick: function () {
        this._createPanel()
    },

    _createPanel: function _createPanel() {
        var _this = this;
        var editor = this.editor;
        var uploadVideo = editor.uploadVideo;
        var config = editor.config;
        var containerId = editor.toolbarSelector;

        // 创建 id
        const dialogId = getRandom('video-dialog');
        var localVideoId = getRandom('local-video');
        var uploadId = getRandom('upload-video');
        var btnId = getRandom('btn');

        //创建弹窗
        var template = `
                <div class="kolo-upload">
                    <div class="upload-container">
                        <h3>添加视频</h3>
                        <div class="w-e-up-btn">
                            <button id="${uploadId}">选择视频</button>
                            <div style="display:none;"><input id="${ localVideoId }" type="file" multiple="multiple"/></div>
                            <p>为了获得更好的推荐</p>
                            <p>建议上传720p（1280x720）或更高分辨率的视频</p>
                        </div>
                        <i id="${btnId}" class="w-e-icon-close">×</i>
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
        document.querySelector('#' + btnId).addEventListener('click', ()=>{
            var dom = document.querySelector('#' + dialogId);
            dom.parentNode.removeChild(dom);
        })

        //点击选择视频
        document.querySelector('#' + uploadId).addEventListener('click', (e)=>{
            e.stopPropagation();
            document.querySelector('#' + localVideoId).click();
        })

        //监控选择文件的变化
        document.querySelector('#' + localVideoId).addEventListener('change', (e)=>{
            var fileElem = document.querySelector('#' + localVideoId);
            //视频上传的按钮id,和关闭按钮  视频上传初始化
            uploadVideo.uploadVideo(uploadId, dialogId, fileElem.files);
        })
    },

    // 插入视频
    _insert: function (val) {
        const editor = this.editor
        var uploadVideo = editor.uploadVideo;
        uploadVideo.insertLinkVideo(val);
    }
}

export default Video