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

        var audioId = getRandom('audio' + obj.id);
        var closeId = getRandom('audio-close' + obj.id);

        // 格式校验 //<p class="subtitle-audio">音频尚未发布，暂时无法播放</p>
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
                    </div>
                    <div class="audio-control status-play">
                        <img class="play play-${audioId}" 
                            src="https://image.kolocdn.com/Fvb6y33-Cy1gomZwCp_v2jyOJsYc"/>
                        <img class="pause pause-${audioId}" 
                            src="https://image.kolocdn.com/Ftvd5iTGO6rf1RPgGM1NxISiflys"/>
                    </div>
                </div>
                <p class="input-p">
                    <input type="text" value="" placeholder="点击添加音乐描述(最多50字符)"/>
                </p>
                <i id="${closeId}" class="w-e-icon-close"><img src="https://qncdn.file.sinostage.com/close.svg"/></i>
            </div>
            <p><br></p>
        `);
        this.audioEvent.push({
            selector: audioId,
            type: 'control',
            fn: (selector)=>{
                // console.log(selector, 'selector');
                //对添加的audio添加播放/暂停事件
                document.querySelector('.play-' + selector).addEventListener('click', (e)=>{
                    e.stopPropagation();
                    var audioDom = document.querySelector('#play-' + editor.audioMenuId);
                    //关闭播放中的音频
                    audioDom.pause();
                    //所有音频恢复默认状态
                    document.querySelectorAll('.audio-control').forEach(el => {
                        el.className = 'audio-control status-play';
                    })

                    let domNode = e.target.parentNode.parentNode;
                    let musicId = domNode.getAttribute('data-id');
                    this.getMusicUrl(musicId).then((res)=>{
                        audioDom.src = res.data[0].url;
                        audioDom.play();
                        e.target.parentNode.className='audio-control status-pause';
                    })
                })
                document.querySelector('.pause-' + selector).addEventListener('click', (e)=>{
                    var audioDom = document.querySelector('#play-' + editor.audioMenuId);

                    e.stopPropagation();
                    audioDom.pause();
                    e.target.parentNode.className='audio-control status-play';
                })
            }
        })
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
    },

    //根据音乐ID获取音乐链接
    getMusicUrl: function(id) {
        return new Promise((res, rej)=>{
            this._http('https://music-api.kolo.la/music/url?id=' + id).then(data=>{
                if(data.code == 200){
                    res({code:200, data: data.data.data});
                } else {
                    res({code:500, data: null});
                }
            })
        })
    },

    //请求get
    _http: function(uri) {
        return new Promise(function(res, rej){
            var request = new XMLHttpRequest();
            var timeout = false;
            var timer = setTimeout( function(){
                timeout = true;
                request.abort();
                res({code:500, data: null})
            }, 30000 );
            request.open( "GET", uri);
            request.onreadystatechange = function(){
                if( request.readyState !== 4 ) return;
                if( timeout ) return;
                clearTimeout( timer );
                if( request.status === 200 ){
                    res({code:200, data: JSON.parse(request.responseText)})
                }
            }
            request.send( null );
        })
    }
}

export default UploadAudio
