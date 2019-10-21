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
    insertLinkVideo: function (link, loading=false, id, process, videoInfo) {
        var _this2 = this;

        var editor = this.editor;
        var config = editor.config;

        // console.log(config);

        let videoId;
        if(id) {
            videoId = id;
        } else {
            videoId = this.videoId;
        }

        //创建新的视频操作按钮id
        const randomId = getRandom('kolo-video-close');

        // 校验格式
        // console.log(link, loading);

        let obj = {
            w: 640,
            h: 360
        }
        
        if(videoInfo && typeof videoInfo == 'object') {
            obj.w = videoInfo.w;
            obj.h = videoInfo.h;
        }
        
        //视频上传时图片的loading的id,如果存在就添加loading
        if(loading) {
            if(process == 0) {
                //插入视频
                var template = `
                    <div class="kolo-video" id="${videoId}" contenteditable="false">
                        <div class="kolo-video-container">
                            <div class="progress-content">
                                <p class="subtitle-video">视频正在上传,不影响编辑</p>
                                <p class="${ videoId + '-' + videoId }"></p>
                            </div>
                        </div>
                        <span data-src="${link ? link : ''}" class="before-img">更换封面</span>
                        <i class="w-e-icon-close" id="${randomId}"><img src="https://qncdn.file.sinostage.com/close.svg"/></i><br/>
                    </div>
                    <p>&#8203;<br/></p>
                `;

                //替换多语言        
                template = replaceLang(editor, template);

                editor.cmd.do('insertHTML', template);

                document.querySelector('#' + videoId +  ' .before-img').style.display = "none";
                
            } else if(process > 0 && process < 100){
                document.querySelector('.' + videoId + '-' + videoId).innerHTML = process + '%';        
            }
            return 
        } else {
            if(!link) {
                return 
            }
            let upDateImg = document.querySelector('#' + videoId +  ' .before-img');
                upDateImg.style.display = "";

            let beforeImg = link + '?vframe/jpg/offset/3/w/'+ obj.w +'/h/' + obj.h;
            
            //插入视频
            var template2 = `
                <div class="video-content">
                    <img class="video-bg" src="${ beforeImg }" />
                    <video class="video-dom" data-w="${obj.w}" data-h="${obj.h}" style="display: none;" controls="controls" src="${link}"></video>
                    <img class="video-control-btn" src="https://qncdn.file.sinostage.com/paly1.svg" />
                </div>
            `;
            //替换多语言        
            template2 = replaceLang(editor, template2);

            let loaderDom = document.querySelector('#' + videoId + ' .kolo-video-container');

            loaderDom.innerHTML = template2;


            //视频播放
            let videoDom = document.querySelector('#' + videoId + ' .video-dom'),
                btnDom = document.querySelector('#' + videoId + ' .video-control-btn'),
                beforeDom = document.querySelector('#' + videoId + ' .before-img');
            btnDom.addEventListener('click', ()=>{
                // console.log('视频播放--');
                document.querySelector('#' + videoId + ' .video-bg').style.display = 'none';
                btnDom.style.display = 'none';
                // beforeDom.style.display = 'none';
                videoDom.style.display = 'block';
                videoDom.play();    
            })
            
        }

        //更换封面图片
        document.querySelector('#' + videoId + ' .before-img').addEventListener('click', (e)=>{
            e.stopPropagation();

            if(document.querySelector('.kolo-e-dialog-up')) {
                return;
            }
            
            let videoDom = document.querySelector('#' + videoId + ' .video-dom');
            videoDom.pause();
            videoDom.style.display = 'none';
            document.querySelector('#' + videoId + ' .video-bg').style.display = 'block';
            document.querySelector('#' + videoId + ' .video-control-btn').style.display = 'block';

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
                    imgDom.src = link + '?imageView/1//w/'+ obj.w +'/h/' + obj.h;;   
                }
                // console.log(dialogId, 'dialogId');
                var dom = document.querySelector('#' + dialogId);
                dom.parentNode.removeChild(dom);
            }
        })
    }

}

export default UploadVideo