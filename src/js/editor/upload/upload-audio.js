import { getRandom } from '../../util/util.js';
/**
 * 
 * @param {editor} editor
 * 上传音频 
 */
function UploadAudio(editor) {
    this.editor = editor;
    this.audioEvent = [];
}
UploadAudio.prototype = {
    constructor: UploadAudio,
    //插入音频
    insertLinkAudio: function insertLinkAudio(obj) {
        if(!obj.url) {
            return;
        }
        var that = this;
        var editor = this.editor,
            config = editor.config;

        var audioId = getRandom('audio');
        var closeId = getRandom('audio-close');

        // 格式校验
        let names = obj.name.split('/');
        editor.cmd.do('insertHTML', `
            <div class="kolo-audio" contenteditable="false">
                <div class="audio-content" data-id="${obj.id}" data-person="${obj.person}">
                    <div class="music-img">
                        <img src="${obj.person}" />
                    </div>
                    <div class="audio-title">
                        <h3>${names[0]}</h3>
                        <p>${names[1]}</p>
                        <p class="subtitle-audio">音频尚未发布，暂时无法播放</p>
                    </div>
                    <div class="audio-control status-play">
                        <img class="play play-${audioId}" 
                            src="http://image.kolocdn.com/FiRivA6DQMhn8liMvS82Q_DcFij6"/>
                        <img class="pause pause-${audioId}" 
                            src="http://image.kolocdn.com/FmzMS6qi1lLCWzwZG_LcrHkryAff"/>
                    </div>
                </div>
                <p class="input-p">
                    <input type="text" value="" placeholder="点击添加音乐描述(最多50字符)"/>
                </p>
                <i id="${closeId}" class="w-e-icon-close"></i>
            </div>
            <p><br></p>
        `);
        // var audioDom = document.querySelector('#play-' + editor.audioMenuId);
        // this.audioEvent.push({
        //     selector: audioId,
        //     type: 'control',
        //     fn: (selector)=>{
        //         //对添加的audio添加播放/暂停事件
        //         document.querySelector('.play-' + selector).addEventListener('click', (e)=>{
        //             e.stopPropagation();
        //             //关闭播放中的音频
        //             audioDom.pause();
        //             //所有音频恢复默认状态
        //             document.querySelectorAll('.audio-control').forEach(el => {
        //                 el.className = 'audio-control status-play';
        //             })

        //             let domNode = e.target.parentNode.parentNode;
        //             audioDom.src = domNode.getAttribute('data-src');
        //             audioDom.play();
        //             e.target.parentNode.className='audio-control status-pause';
        //         })
        //         document.querySelector('.pause-' + selector).addEventListener('click', (e)=>{
        //             e.stopPropagation();
        //             audioDom.pause();
        //             e.target.parentNode.className='audio-control status-play';
        //         })
        //     }
        // })
        this.audioEvent.push({
            selector: '#' + closeId,
            type: 'delete',
            fn: (selector)=>{
                //删除该条音乐
                document.querySelector(selector).addEventListener('click', (e)=>{
                    e.stopPropagation();
                    var dom = document.querySelector('.kolo-audio');
                    if(dom) {
                        dom.parentNode.removeChild(dom);
                    }
                    that.audioEvent.forEach((item, index)=>{
                        if(item.selector == selector) {
                            that.audioEvent.splice(index, 1);
                        }
                    })
                });
            }
        })

        this.audioEvent.forEach(item => {
            item.fn(item.selector);
        });        

        //验证url是否有效
        var audio = document.createElement('audio');
        audio.src = obj.url;
        audio.onload = function() {
            audio = null;
        }
        audio.onerror = function () {
            audio = null;
            alert('无效地址');
            return;
        }
        audio.onabort = function() {
            audio = null;
        }        
    }
}

export default UploadAudio