import { getRandom } from '../../util/util.js';
import replaceLang from '../../util/replace-lang.js'

/**
 * 
 * @param {editor} editor
 * 上传视频 
 */
function UploadVideo(editor) {
    this.editor = editor;
    const videoId = getRandom('kolo-video');

    this.videoId = videoId;
}

//
UploadVideo.prototype = {
    constructor: UploadVideo,

    //根据链接插入视频
    insertLinkVideo: function (link, loading=false, id) {
        var _this2 = this;

        var editor = this.editor;
        var config = editor.config;

        let videoId;
        if(id) {
            videoId = id;
        } else {
            videoId = this.videoId;
        }

        //创建新的视频操作按钮id
        const randomId = getRandom('kolo-video-close');
        const randomChangeId = getRandom('kolo-change-img');
        const canvasId = getRandom('kolo-video-canvas');

        editor.coverVideo = randomChangeId;

        // 校验格式
        // console.log(link, loading);
        
        //视频上传时图片的loading的id,如果存在就添加loading
        if(loading) {
            //插入视频
            var template = `
                <div class="kolo-video" id="${videoId}"  contenteditable="false">
                    <div class="kolo-video-container">
                        <div class="progress-content">
                            <p class="subtitle-video">视频正在上传,不影响编辑</p>
                        </div>
                    </div>
                    <span data-src="${link ? link : ''}" id="${randomChangeId}" class="before-img">更换封面</span>
                    <i class="w-e-icon-close" id="${randomId}"></i><br/>
                </div>
                <p><br/></p>
            `;

            //替换多语言        
            template = replaceLang(editor, template);

            editor.cmd.do('insertHTML', template);

            document.querySelector('#'+randomId).addEventListener('click', (e)=>{
                let target = e.target.parentNode;
                target.parentNode.removeChild(target);
            })
    
        } else {
            if(!link) {
                return 
            }
            let upDateImg = document.querySelector('#' + videoId +  ' .before-img'),
                beforeImg = upDateImg.getAttribute('data-src');
            //插入视频
            var template2 = `
                <div class="video-content">
                    <img class="video-bg" src="${ beforeImg || (link + '?vframe/jpg/offset/3/w/640/')}" />
                    <video class="video-dom" style="display: none;" controls="controls" src="${link}"></video>
                    <img class="video-control-btn" src="http://image.kolocdn.com/FnRbYslhonTMq1_9qUI8751Xp3Ej" />
                    <p class="subtitle-video">视频尚未发布，暂时无法播放</p>
                </div>
            `;
            //替换多语言        
            template2 = replaceLang(editor, template2);

            let loaderDom = document.querySelector('#' + videoId + ' .kolo-video-container');

            loaderDom.innerHTML = template2;
        }

        //更换封面图片
        document.querySelector('#' + videoId + ' .before-img').addEventListener('click', (e)=>{
            e.stopPropagation();

            if(document.querySelector('.kolo-e-dialog-up')) {
                return;
            }

            //更换图片自定义上传
            const changeUploadImg = config.changeUploadImg;

            var containerId = editor.toolbarSelector;

            // id
            const dialogId = getRandom('img-dialog');
            const upTriggerId = getRandom('up-trigger');
            const upFileId = getRandom('up-file');
            const closeUpload = getRandom('cloase-img');
    
            //创建弹窗 
            var template = `
                    <div class="kolo-upload">
                        <div class="upload-container">
                            <h3>更换封面</h3>
                            <div class="w-e-up-btn">
                                <button id="${upTriggerId}">选择图片</button>
                                <p>为了获得更好的推荐</p>
                                <p>建议上传720p（1280x720）或更高分辨率的图片</p>
                            </div>
                            <div style="display:none;">
                                <input id="${upFileId}" type="file" multiple="multiple" accept="image/jpg,image/jpeg,image/png,image/gif,image/bmp"/>
                            </div>
                            <i id="${closeUpload}" class="w-e-icon-close"></i>
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

            // console.log(dialogId, 'dialogId');
    
            //关闭弹窗
            document.querySelector('#' + closeUpload).addEventListener('click', (e)=>{
                e.stopPropagation();
                var dom = document.querySelector('#' + dialogId);
                // console.log(dialogId, 'dialogId-closeUpload');
                dom.parentNode.removeChild(dom);
            })
    
            //点击按钮选择图片
            document.querySelector('#' + upTriggerId).addEventListener('click', (e)=>{
                e.stopPropagation();
                // console.log(dialogId, 'dialogId-upTriggerId');

                document.querySelector('#' + upFileId).click();
            })
    
            //文件选择
            document.querySelector('#' + upFileId).addEventListener('change', (e)=>{
                e.stopPropagation();
                const fileElem = document.querySelector('#' + upFileId)
                // console.log(dialogId, 'dialogId-upFileId');
                if (!fileElem) {
                    // 返回 true 可关闭 panel
                    return true
                }
    
                // 获取选中的 file 对象列表
                const fileList = fileElem.files
                if (fileList.length) {
                    // console.log(dialogId, 'dialogId-changeUploadImg');
                    changeUploadImg(fileList, updateBeforeImg);  
                }        
            })

            //更换封面
            function updateBeforeImg(link){
                // console.log(document.querySelector('#' + videoId + ' .before-img'));
                document.querySelector('#' + videoId + ' .before-img').setAttribute('data-src', link);
                let progressDom = document.querySelector('#' + videoId + ' .kolo-video-container .progress-content');
                //如果视频还未上传完毕，则添加到progress中
                if(progressDom) {
                    let imgDom = document.createElement('img');
                    imgDom.src = link;
                    progressDom.appendChild(imgDom);
                } else {
                    //视频上传完毕，则更改图片路径
                    let imgDom = document.querySelector('#' + videoId + ' .video-bg');
                    imgDom.src = link;   
                }
                // console.log(dialogId, 'dialogId');
                var dom = document.querySelector('#' + dialogId);
                dom.parentNode.removeChild(dom);
            }
        })

        //验证url是否有效
        if(!link) {
            return;
        }
        var video = document.createElement('video');
        video.src = link;
        video.onload = function(e) {
            var callback = config.linkImgCallback;
            if (callback && typeof callback === 'function') {
                callback(link);
            }
            video = null;
        }
        video.onerror = function () {
            video = null;
            var string = '无效地址'
            string = replaceLang(editor, string);
            alert(string);
            return;
        }
        video.onabort = function() {
            video = null;
        }
    },

    //上传视频
    uploadVideo: function uploadVideo(btns, dialogId, files) {
        var _this3 = this;

        if(!btns) {
            return;
        }
        if(!files) {
            return;
        }

        //
        var editor = this.editor;
        var config = editor.config;

        //自定义上传
        var customUploadVideo = config.customUploadVideo;
        if(!customUploadVideo) {
            return;
        }

        if(customUploadVideo && typeof customUploadVideo == 'function') {
            customUploadVideo(files, this.insertLinkVideo.bind(this), dialogId);
        }
    }

}

export default UploadVideo