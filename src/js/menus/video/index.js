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

        if(config.qiniu) {
            let videoObj = config.uploadConfig.video;
            let plupload = new Qiniu.uploader({
                runtimes: 'html5,flash,html4', // 上传模式,依次退化
                browse_button: uploadId,  // 上传按钮的ID
                domain: videoObj.bucketDomain, // bucket 域名，下载资源时用到，**必需**
                get_new_uptoken: false, // 设置上传文件的时候是否每次都重新获取新的token
                uptoken: videoObj.token, // 若未指定uptoken_url,则必须指定 uptoken ,uptoken由其他程序生成
                flash_swf_url: 'js/plupload/Moxie.swf', // 引入flash,相对路径
                max_retries: 3, // 上传失败最大重试次数
                dragdrop: true, // 开启可拖曳上传
                auto_start: true, // 选择文件后自动上传，若关闭需要自己绑定事件触发上传
                chunk_size: '4mb', // 分块大小
                multi_selection: false, // 是否允许同时选择多文件
                unique_names: true, // 默认 false，key为文件名。若开启该选项，SDK为自动生成上传成功后的key（文件名）。
                 //save_key: false,  // 默认 false。若在服务端生成uptoken的上传策略中指定了 `sava_key`，则开启，SDK在前端将不对key进行任何处理
                filters: { // 文件类型过滤，这里限制为视频类型
                    max_file_size : '2048mb',
                    prevent_duplicates: true,
                    mime_types: [{
                        title: "Video files",
                        extensions: "mp4" // flv,mpg,mpeg,avi,wmv,mov,asf,rm,rmvb,mkv,m4v,mp4
                    }]
                },

                init: {
                    'FilesAdded': function(up, file) {
                        console.log(up, file, 'FilesAdded')
                    },
                    'BeforeUpload': function(up, file) {
                        console.log(up, file, 'BeforeUpload')
                    },
                    'UploadProgress': function(up, file) {
                        console.log(up, file, 'UploadProgress')
                    },
                    'FileUploaded': function(up, file, info) {
                        console.log(up, file, info, 'FileUploaded')
                    },
                    'Error': function(up, err, errTip) {
                        console.log(up, file, 'Error')
                    },
                    'UploadComplete': function() {
                        console.log(up, file, 'UploadComplete')
                    }
                }
            });
            return;
        }

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