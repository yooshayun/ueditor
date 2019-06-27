import _http from '@/api/music/getData.js'

/**
 * 删除dom
 */
export function binEvent(){
    document.querySelectorAll('.w-e-text .w-e-icon-close').forEach(item=>{
        item.removeEventListener('click', deleteDom);
        item.addEventListener('click', deleteDom);
    })
}

//删除
function deleteDom (e) {
    e.stopPropagation();
    let target = e.target.parentNode;
    if(!target) {
        return;
    }
    if(e.target.className !== 'w-e-icon-close') {
        return;
    }
    target.parentNode.removeChild(target);
    binEvent();
}

/**
 * 视频播放
 */
function playerVideo(e) {
    e.stopPropagation()
    //关闭音频
    audioPause();

    let target = e.target.parentNode;

    if(!target) {
        return;
    }

    let doms = target.children;

    for(let i = 0; i < doms.length; i++) {
        let dom = doms[i];
        if(dom.className == 'video-bg') {
            dom.style.display = 'none';
        }
        if(dom.className == 'video-dom') {
            dom.style.display = 'block';
            dom.play();
        }
        if(dom.className == 'video-control-btn') {
            dom.style.display = 'none';
        }
    }
}
function pauseVideo (e) {
    e.stopPropagation()
    let isPlay = e.target.paused;
    let target = e.target.parentNode;
    if(!target) {
        return;
    }
    let doms = target.children;

    if(isPlay) {
        for(let i = 0; i < doms.length; i++) {
            let dom = doms[i];
            if(dom.className == 'video-bg') {
                dom.style.display = 'block';
            }
            if(dom.className == 'video-dom') {
                dom.style.display = 'none';
            }
            if(dom.className == 'video-control-btn') {
                dom.style.display = 'block';
            }
        }
    } else {
        document.querySelectorAll('.moble-dialog .video-dom').forEach(item => { 
            if(item !== e.target) {
                item.pause();
            }
        })
        for(let i = 0; i < doms.length; i++) {
            let dom = doms[i];
            if(dom.className == 'video-bg') {
                dom.style.display = 'none';
            }
            if(dom.className == 'video-dom') {
                dom.style.display = 'block';
                dom.play();
            }
            if(dom.className == 'video-control-btn') {
                dom.style.display = 'none';
            }
        }
    }
}

export function videoPlayer(){
    document.querySelectorAll('.moble-dialog .video-control-btn').forEach(item=> {
        item.addEventListener('click', playerVideo)
    })
    document.querySelectorAll('.moble-dialog .video-dom').forEach(item => {
        item.addEventListener('play', pauseVideo)
        item.addEventListener('pause', pauseVideo)
    })
}

/**
 * 取消播放
 */
export function videoPlayerRemove() {
    document.querySelectorAll('.moble-dialog .video-control-btn').forEach(item=> {
        item.removeEventListener('click', playerVideo)
    })
    document.querySelectorAll('.moble-dialog .video-dom').forEach(item => {
        item.pause();
        item.removeEventListener('play', pauseVideo)
        item.addEventListener('pause', pauseVideo)
    })
}

/**
 * 音乐播放
 */
export function audioPlayer(){ 
    let audioDom = document.querySelector('#audioDom');

    if(audioDom) {
        audioDom.pause();
    } else {
        audioDom = document.createElement('audio'); 
        audioDom.id = 'audioDom';
        audioDom.style.display = 'none';
        document.querySelector('.main').appendChild(audioDom);
    }

    let playDoms = document.querySelectorAll('.moble-dialog .audio-control .play');
    let pauseDoms = document.querySelectorAll('.moble-dialog .audio-control .pause');
    playDoms.forEach(item=>{
        item.addEventListener('click', (e)=>{
            let target = e.target.parentNode;

            //关闭所有视频
            document.querySelectorAll('.moble-dialog .video-dom').forEach(dom => {
                dom.pause();
            })
            
            if(!target) {
                return;
            }
            
            //初始化所有音乐，变为关闭状态
            playDoms.forEach(dom => {
                dom.parentNode.className = "audio-control status-play";
            })

            let parentDom = target.parentNode;
            target.className = "audio-control status-pause";

            audioDom.pause();
            _http('queryMusicUrl', {
                id: parentDom.getAttribute('data-id')
            }).then(res => {
                if(res.data.code == 200) {
                    audioDom.src = res.data.data[0].url;
                    audioDom.play();
                } 
            })
        })
    })
    pauseDoms.forEach(item => {
        item.addEventListener('click', (e) => {
            let target = e.target.parentNode;
            
            if(!target) {
                return;
            }
            audioDom.pause();
            //初始化所有音乐，变为关闭状态
            playDoms.forEach(dom => {
                dom.parentNode.className = "audio-control status-play";
            })
        })
    })
}
/**
 * 关闭音乐
 */
export function audioPause() {
    let audioDom = document.querySelector('#audioDom');
    let playDoms = document.querySelectorAll('.moble-dialog .audio-control .play');
               
    //初始化所有音乐，变为关闭状态
    if(playDoms) {
        playDoms.forEach(dom => {
            dom.parentNode.className = "audio-control status-play";
        })
    }
    
    audioDom && audioDom.pause();
}

