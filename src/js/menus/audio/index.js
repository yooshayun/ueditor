/*
    menu - audio
*/
import $ from '../../util/dom-core.js'
import { getRandom } from '../../util/util.js'
import Panel from '../panel.js'
import replaceLang from '../../util/replace-lang.js'


//上传音频
function Audio(editor) {
    var _this = this;

    this.editor = editor;
    // var audioMenuId = getRandom('w-e-audio');
    this.$elem = $('<div class="w-e-menu"><i title="添加音乐" class="w-e-icon-audio"></i></div>');
    // editor.audioMenuId = audioMenuId;
    this.type = 'panel';

    // //激活状态
    this._active = false;
}

Audio.prototype = {
    constructor: Audio,

    onClick: function onClick() {
        // var editor = this.editor;
        // var config = editor.config;

        this._createPanel();
    },

    _createPanel: function _createPanel() {
        var _this = this;
        var editor = this.editor;
        var uploadAudio = editor.uploadAudio;
        var config = editor.config;

        var containerId = editor.toolbarSelector;

        var disabled = true;

        // 各个dom的随机id
        var localAudio = getRandom('local-audio'),
            audioId = getRandom('upload-audio'),
            linkId = getRandom('link-audio'),
            dialogId = getRandom('audio-dialog'),
            searchlinkId = getRandom('link-audio-search'),
            searchBtn = getRandom('audio-search-btn'),
            playBtn = getRandom('play-btn'),
            pauseBtn = getRandom('pause-btn'),
            clearBtn = getRandom('clear-btn');

            // <img class="play" id="${playBtn}" style="display: none;" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABwAAAAcCAYAAAEFCu8CAAAACXBIWXMAAAsTAAALEwEAmpwYAAAFFmlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNS42LWMxNDAgNzkuMTYwNDUxLCAyMDE3LzA1LzA2LTAxOjA4OjIxICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOmRjPSJodHRwOi8vcHVybC5vcmcvZGMvZWxlbWVudHMvMS4xLyIgeG1sbnM6cGhvdG9zaG9wPSJodHRwOi8vbnMuYWRvYmUuY29tL3Bob3Rvc2hvcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RFdnQ9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZUV2ZW50IyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgQ0MgKE1hY2ludG9zaCkiIHhtcDpDcmVhdGVEYXRlPSIyMDE4LTAxLTMwVDEwOjI0OjAyKzA4OjAwIiB4bXA6TW9kaWZ5RGF0ZT0iMjAxOC0wMS0zMFQxMDoyODowNyswODowMCIgeG1wOk1ldGFkYXRhRGF0ZT0iMjAxOC0wMS0zMFQxMDoyODowNyswODowMCIgZGM6Zm9ybWF0PSJpbWFnZS9wbmciIHBob3Rvc2hvcDpDb2xvck1vZGU9IjMiIHBob3Rvc2hvcDpJQ0NQcm9maWxlPSJzUkdCIElFQzYxOTY2LTIuMSIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDo5NjJhMWYyOS1hMmExLTRmNjEtYmZlYS1hN2Q1NjAzYjgxOWQiIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6OTYyYTFmMjktYTJhMS00ZjYxLWJmZWEtYTdkNTYwM2I4MTlkIiB4bXBNTTpPcmlnaW5hbERvY3VtZW50SUQ9InhtcC5kaWQ6OTYyYTFmMjktYTJhMS00ZjYxLWJmZWEtYTdkNTYwM2I4MTlkIj4gPHhtcE1NOkhpc3Rvcnk+IDxyZGY6U2VxPiA8cmRmOmxpIHN0RXZ0OmFjdGlvbj0iY3JlYXRlZCIgc3RFdnQ6aW5zdGFuY2VJRD0ieG1wLmlpZDo5NjJhMWYyOS1hMmExLTRmNjEtYmZlYS1hN2Q1NjAzYjgxOWQiIHN0RXZ0OndoZW49IjIwMTgtMDEtMzBUMTA6MjQ6MDIrMDg6MDAiIHN0RXZ0OnNvZnR3YXJlQWdlbnQ9IkFkb2JlIFBob3Rvc2hvcCBDQyAoTWFjaW50b3NoKSIvPiA8L3JkZjpTZXE+IDwveG1wTU06SGlzdG9yeT4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+IDw/eHBhY2tldCBlbmQ9InIiPz6ZuaZ/AAADN0lEQVRIib2WT4iVZRTGf8+dO0gjYg4OMgoh/WFyIQkjLmbVZkpQtw3SUGFWUIluQgQZJ90bTVgwIDgihkw4wt0IESFUkFS0DIJoZUFoziKQdHpafOf7fOe933fv4MIDl3vf9z3Pc/6855z3yjarJN2w3ak2bM/YHsM2tju2xwCUQlrAInBMEpQqKeNYzrpoe6k6KH2wvTtBnSzRlXkysd1RVziJtCQhCaADtIE5YCT2Kpptye/1AC3bn8Tem7bX2T4m6R/bH7WAB4mZl4BruWfr69atWA/ZnrPdtj0HDEFkNfXM9gjwKXAX2Az8DlyS9GNuLl+P2P7C9uHcjbjHkQpoe8L2+Uzxlbj9Ldn+nO3xErhkezA5nEl+t2vWSyVwPAIvD98Pa6+RySqLSWydPMVNMXZlNZTGgWlgOw1Z7VlZvaQN5Pd4BngG+A9YAW4C85LuJzoFMJNd8T0NDACTwFXbv0k6Wiq1aoA/A8uSliXdkXRF0gHgb9uXUtewfcD2i8nejO2NOaPtedt7bVfAju2BRGFdgA/VgDu2H7oqaSU5Py7pNHArCEZzgroYK5F0HbgBHMzP6rJauvQE8AFwW9LZNQMDdE7S7SZmIlPzvdwO3SqrLahiGbI92wM0CwyF7qqsTgObIt1TtofjMxUjdFPoFPo1M2cQeBvYE1u1tfrI3fGoUt1G3sulRJftWiPfHeBz4MusEEuuntffJH9KeqvBuQngDeA928vAh5J+7bKajLmW7ScbyJ6NNnm1n0fBMxsF8XHZr/kdtoELwEbgrKSvMxIBh4BtwD3gK+AnSY1FEBGfoEj1YeB+avAIxcN5UdJiDfh5AEm/2N4B7AU2UEzQ74Ebkv6twU1RDMvrwLnU4OUgeEfSrRrgTBg8ne2PAvuArcBfkj7LzoeBhYjy9bRoyn65lxtrEttPAfsp3nqAH/phUoM3KdI0CVzpYWQn8DLFv44V4BvgW0kPGiCTCf/DKrU9aHshKmuixtDTto/aftf2C/0iCcxE8C0Ef1dbDEQZd6Ksez4MPQz1b4tsLj4HnKJokT+AC5K+W0tEFI0/CnQ1fqPBRKF89w8Cw2sIru9oe+zD+39bTbkFDwfMFgAAAABJRU5ErkJggg==" />
            // <img class="pause" id="${pauseBtn}" style="display: none;" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABwAAAAcCAYAAAEFCu8CAAAACXBIWXMAAAsTAAALEwEAmpwYAAAFFmlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNS42LWMxNDAgNzkuMTYwNDUxLCAyMDE3LzA1LzA2LTAxOjA4OjIxICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOmRjPSJodHRwOi8vcHVybC5vcmcvZGMvZWxlbWVudHMvMS4xLyIgeG1sbnM6cGhvdG9zaG9wPSJodHRwOi8vbnMuYWRvYmUuY29tL3Bob3Rvc2hvcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RFdnQ9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZUV2ZW50IyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgQ0MgKE1hY2ludG9zaCkiIHhtcDpDcmVhdGVEYXRlPSIyMDE4LTA1LTAyVDExOjQwOjMwKzA4OjAwIiB4bXA6TW9kaWZ5RGF0ZT0iMjAxOC0wNS0zMVQxMTowNjowMiswODowMCIgeG1wOk1ldGFkYXRhRGF0ZT0iMjAxOC0wNS0zMVQxMTowNjowMiswODowMCIgZGM6Zm9ybWF0PSJpbWFnZS9wbmciIHBob3Rvc2hvcDpDb2xvck1vZGU9IjMiIHBob3Rvc2hvcDpJQ0NQcm9maWxlPSJzUkdCIElFQzYxOTY2LTIuMSIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDo4MWI1YjI2NC1jNzg5LTQzYWItYjRlZS00ODY1YjU1ZmNhY2EiIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6ODFiNWIyNjQtYzc4OS00M2FiLWI0ZWUtNDg2NWI1NWZjYWNhIiB4bXBNTTpPcmlnaW5hbERvY3VtZW50SUQ9InhtcC5kaWQ6ODFiNWIyNjQtYzc4OS00M2FiLWI0ZWUtNDg2NWI1NWZjYWNhIj4gPHhtcE1NOkhpc3Rvcnk+IDxyZGY6U2VxPiA8cmRmOmxpIHN0RXZ0OmFjdGlvbj0iY3JlYXRlZCIgc3RFdnQ6aW5zdGFuY2VJRD0ieG1wLmlpZDo4MWI1YjI2NC1jNzg5LTQzYWItYjRlZS00ODY1YjU1ZmNhY2EiIHN0RXZ0OndoZW49IjIwMTgtMDUtMDJUMTE6NDA6MzArMDg6MDAiIHN0RXZ0OnNvZnR3YXJlQWdlbnQ9IkFkb2JlIFBob3Rvc2hvcCBDQyAoTWFjaW50b3NoKSIvPiA8L3JkZjpTZXE+IDwveG1wTU06SGlzdG9yeT4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+IDw/eHBhY2tldCBlbmQ9InIiPz6++U+ZAAAAnklEQVRIie1UQQ6AIAzriE/y/y/gT/UgU9C5mBk1GpoYTaG0Y4KQRI1U3hSRhlggW0lDJAAo2pyOdST1YcVlkntLK6CJXbYjpZaXTy1706Cb1h30MBgcAUC0pZi3unyOyrlZPXxIGN7VsDAcddvHUz285NiF/xA+/6+GHaMIJ43CulVrNOXXp7SZtJ5YxWjNA16osBt2w274vuH/79IJe31HmgGNh/4AAAAASUVORK5CYII=" />

        //创建弹窗
        var template = `
                <div class="kolo-upload">
                    <div class="upload-container">
                        <h3>添加音乐</h3>
                        <div class="music">
                            <audio id="${audioId}" style="display: none;"></audio>
                            <div class="search-box">
                                <div class="status-box">
                                    <img class="search" id="${searchBtn}" src="http://image.kolocdn.com/FoKx9in6OwMaaNwaN8OlcH7WzYw8" />
                                </div>
                                <p>
                                    <input type="text" id="${searchlinkId}"/>
                                    <i class="w-e-icon-close" id="${clearBtn}"></i>
                                </p>
                            </div>
                            <p class="error-audio"></p>
                            <div class="music-list"></div>
                        </div>
                        <div class="w-e-up-btn">
                            <button id="${localAudio}" disabled="${disabled}">选择音乐</button>
                        </div>
                        <i id="${linkId}" class="w-e-icon-close"></i>
                    </div>
                </div>`;
        //替换多语言        
        template = replaceLang(editor, template);
        
        //
        var dialog = document.createElement('div');
        dialog.className = 'kolo-e-dialog';
        dialog.id = dialogId;
        dialog.innerHTML = template;  
        
        //添加弹窗
        document.querySelector(containerId).appendChild(dialog); 
        //关闭弹窗     
        document.querySelector('#' + linkId).addEventListener('click', ()=>{
            var dom = document.querySelector('#' + dialogId);
            dom.parentNode.removeChild(dom);
        })

        //监控输入
        document.querySelector('#' + searchlinkId).addEventListener('keydown', (e)=>{
            e.stopPropagation();
            if(!document.querySelector('#' + searchlinkId).value) {
                document.querySelector('.music-list').style.display = 'none';
            }
            if(e.keyCode !== 13) {
                return;
            }
            var value = $('#' + searchlinkId).val().trim();
            disabled = value.length === 0;
            // console.log(disabled, document.querySelector('#' +localAudio));
            document.querySelector('#' + localAudio).disabled = disabled;
            //网易云音乐链接
            this.searchMusic(value).then(res=>{
                if(res.code == 200) {
                    this._renderMusicList(res.data.songs, _chooseMusic, audioId);
                }
            });
        })


        //获得焦点
        document.querySelector('#' + searchlinkId).addEventListener('focus', (e)=>{
            e.stopPropagation();
            document.querySelector('.music-list').style.display = 'block';
            document.querySelector('#'+ clearBtn).style.display = 'block';
        })        

        //监控搜索按钮
        document.querySelector('#' + searchBtn).addEventListener('click', (e)=>{
            e.stopPropagation();
            var value = $('#' + searchlinkId).val().trim();
            //网易云音乐链接
            this.searchMusic(value).then(res=> {
                if(res.code == 200) {
                    this._renderMusicList(res.data.songs, _chooseMusic, audioId);
                }
            });

        })

        //点击输入框和下拉框之外的地方关闭下拉框
        document.querySelector('.music').addEventListener('click', (e)=>{
            //输入框和下拉框不触发下拉框 关闭
            e.stopPropagation();
        })
        document.querySelector('.kolo-upload').addEventListener('click', (e)=>{
            e.stopPropagation();
            var dom = document.querySelector('.music-list');
            if(dom) {
                dom.style.display = 'none';
            }
        })


        //监控清除输入
        document.querySelector('#' + clearBtn).addEventListener('click', ()=>{
            document.querySelector('#' + searchlinkId).value = '';
            document.querySelector('.music-list').innerHTML = '';
            document.querySelector('.music-list').style.display = 'none';
            //变回搜索状态   
            var searchDom = document.querySelector('#' + searchBtn); 
            if(searchDom && searchDom.style) {
                document.querySelector('#' + searchBtn).style.display = 'inline-block';
            }
            // document.querySelector('#' + playBtn).style && document.querySelector('#' + playBtn).style.display = 'none';
            // document.querySelector('#' + pauseBtn).style && document.querySelector('#' + pauseBtn).style.display = 'none';

            document.querySelector('#' + clearBtn).style.display = 'none';

            document.querySelector('#' + localAudio).disabled = false;
        }) 

        //确定选择的音乐，并添加到富文本
        document.querySelector('#' + localAudio).addEventListener('click', (e)=>{
            e.stopPropagation();
            var dataDom = document.querySelector('#' + searchlinkId);
            var dataUrl = dataDom.getAttribute('data-url'),
                dataPerson = dataDom.getAttribute('data-person'),
                id = dataDom.getAttribute('data-id');
            if(!dataUrl || !dataPerson || !id) {
                document.querySelector('.error-audio').style.display = 'block';
                var word = replaceLang(editor, '未搜索到该音乐');
                document.querySelector('.error-audio').innerText = word;
                return;
            }
            this._insert({
                url: dataUrl,
                person: dataPerson,
                name: dataDom.value,
                id:id
            })

            //关闭弹窗
            var dom = document.querySelector('#' + dialogId);
            dom.parentNode.removeChild(dom);
        })

        //音乐列表选择
        function _chooseMusic(e) {
            e.stopPropagation();

            var target = e.target;
            if(target.tagName !== 'LI') {
                return;
            }
            var musicId = target.getAttribute('data-id');

            if(musicId) {
                _this.getMusicUrl(musicId).then(url=>{
                    if(url.code == 200) {
                        let chooseDom = document.querySelector('#' + searchlinkId);
                        chooseDom.value = target.getAttribute('data-name');
                        chooseDom.setAttribute('data-url', url.data[0].url);
                        chooseDom.setAttribute('data-person', target.getAttribute('data-person'));
                        chooseDom.setAttribute('data-id', target.getAttribute('data-id'));
                        //隐藏下拉列表
                        document.querySelector('.music-list').style.display = 'none';
                        //
                        document.querySelectorAll('.music-list ul li .status-box').forEach((player)=>{
                            player.className = 'status-box status-pause';
                            player.setAttribute('data-status', 'pause');
                            player.parentNode.className = '';
                        })
                        target.className = "active-music";
                        
                        //关闭播放器，并添加选择音乐的链接
                        var audioDom = document.querySelector('#' + audioId);
                        audioDom.pause();
                        audioDom.src = url.data[0].url;
                    }
                })
            }
        }
        
    },
    
    //生成音乐列表
    _renderMusicList: function(list=[], fn, audioId) {
        var _this = this;
        //播放器
        var audioDom = document.querySelector('#' + audioId);

        if(list && list.length > 0 ) {
            //生成列表的容器
            var container = document.querySelector('.music-list');
            container.style.display = 'block';

            var musiclist = '<ul>';
            list.forEach(item=>{
                musiclist += `
                    <li data-id="${item.id}" data-name="${item.name}/${item.artists.length ? item.artists[0].name : '--'}" data-person="${item.artists.length > 0 ? item.artists[0].img1v1Url : ''}">
                        <div class="name">${item.name}/${item.artists.length ? item.artists[0].name : '--'}</div>
                        <div class="status-box status-pause" data-status="pause">
                            <img class="play" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABwAAAAcCAYAAAEFCu8CAAAACXBIWXMAAAsTAAALEwEAmpwYAAAFFmlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNS42LWMxNDAgNzkuMTYwNDUxLCAyMDE3LzA1LzA2LTAxOjA4OjIxICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOmRjPSJodHRwOi8vcHVybC5vcmcvZGMvZWxlbWVudHMvMS4xLyIgeG1sbnM6cGhvdG9zaG9wPSJodHRwOi8vbnMuYWRvYmUuY29tL3Bob3Rvc2hvcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RFdnQ9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZUV2ZW50IyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgQ0MgKE1hY2ludG9zaCkiIHhtcDpDcmVhdGVEYXRlPSIyMDE4LTA1LTAyVDExOjQwOjMwKzA4OjAwIiB4bXA6TW9kaWZ5RGF0ZT0iMjAxOC0wNS0zMVQxMTowNjowMiswODowMCIgeG1wOk1ldGFkYXRhRGF0ZT0iMjAxOC0wNS0zMVQxMTowNjowMiswODowMCIgZGM6Zm9ybWF0PSJpbWFnZS9wbmciIHBob3Rvc2hvcDpDb2xvck1vZGU9IjMiIHBob3Rvc2hvcDpJQ0NQcm9maWxlPSJzUkdCIElFQzYxOTY2LTIuMSIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDo4MWI1YjI2NC1jNzg5LTQzYWItYjRlZS00ODY1YjU1ZmNhY2EiIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6ODFiNWIyNjQtYzc4OS00M2FiLWI0ZWUtNDg2NWI1NWZjYWNhIiB4bXBNTTpPcmlnaW5hbERvY3VtZW50SUQ9InhtcC5kaWQ6ODFiNWIyNjQtYzc4OS00M2FiLWI0ZWUtNDg2NWI1NWZjYWNhIj4gPHhtcE1NOkhpc3Rvcnk+IDxyZGY6U2VxPiA8cmRmOmxpIHN0RXZ0OmFjdGlvbj0iY3JlYXRlZCIgc3RFdnQ6aW5zdGFuY2VJRD0ieG1wLmlpZDo4MWI1YjI2NC1jNzg5LTQzYWItYjRlZS00ODY1YjU1ZmNhY2EiIHN0RXZ0OndoZW49IjIwMTgtMDUtMDJUMTE6NDA6MzArMDg6MDAiIHN0RXZ0OnNvZnR3YXJlQWdlbnQ9IkFkb2JlIFBob3Rvc2hvcCBDQyAoTWFjaW50b3NoKSIvPiA8L3JkZjpTZXE+IDwveG1wTU06SGlzdG9yeT4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+IDw/eHBhY2tldCBlbmQ9InIiPz6++U+ZAAAAnklEQVRIie1UQQ6AIAzriE/y/y/gT/UgU9C5mBk1GpoYTaG0Y4KQRI1U3hSRhlggW0lDJAAo2pyOdST1YcVlkntLK6CJXbYjpZaXTy1706Cb1h30MBgcAUC0pZi3unyOyrlZPXxIGN7VsDAcddvHUz285NiF/xA+/6+GHaMIJ43CulVrNOXXp7SZtJ5YxWjNA16osBt2w274vuH/79IJe31HmgGNh/4AAAAASUVORK5CYII=" />
                            <img class="pause" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABwAAAAcCAYAAAEFCu8CAAAACXBIWXMAAAsTAAALEwEAmpwYAAAFFmlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNS42LWMxNDAgNzkuMTYwNDUxLCAyMDE3LzA1LzA2LTAxOjA4OjIxICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOmRjPSJodHRwOi8vcHVybC5vcmcvZGMvZWxlbWVudHMvMS4xLyIgeG1sbnM6cGhvdG9zaG9wPSJodHRwOi8vbnMuYWRvYmUuY29tL3Bob3Rvc2hvcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RFdnQ9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZUV2ZW50IyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgQ0MgKE1hY2ludG9zaCkiIHhtcDpDcmVhdGVEYXRlPSIyMDE4LTAxLTMwVDEwOjI0OjAyKzA4OjAwIiB4bXA6TW9kaWZ5RGF0ZT0iMjAxOC0wMS0zMFQxMDoyODowNyswODowMCIgeG1wOk1ldGFkYXRhRGF0ZT0iMjAxOC0wMS0zMFQxMDoyODowNyswODowMCIgZGM6Zm9ybWF0PSJpbWFnZS9wbmciIHBob3Rvc2hvcDpDb2xvck1vZGU9IjMiIHBob3Rvc2hvcDpJQ0NQcm9maWxlPSJzUkdCIElFQzYxOTY2LTIuMSIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDo5NjJhMWYyOS1hMmExLTRmNjEtYmZlYS1hN2Q1NjAzYjgxOWQiIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6OTYyYTFmMjktYTJhMS00ZjYxLWJmZWEtYTdkNTYwM2I4MTlkIiB4bXBNTTpPcmlnaW5hbERvY3VtZW50SUQ9InhtcC5kaWQ6OTYyYTFmMjktYTJhMS00ZjYxLWJmZWEtYTdkNTYwM2I4MTlkIj4gPHhtcE1NOkhpc3Rvcnk+IDxyZGY6U2VxPiA8cmRmOmxpIHN0RXZ0OmFjdGlvbj0iY3JlYXRlZCIgc3RFdnQ6aW5zdGFuY2VJRD0ieG1wLmlpZDo5NjJhMWYyOS1hMmExLTRmNjEtYmZlYS1hN2Q1NjAzYjgxOWQiIHN0RXZ0OndoZW49IjIwMTgtMDEtMzBUMTA6MjQ6MDIrMDg6MDAiIHN0RXZ0OnNvZnR3YXJlQWdlbnQ9IkFkb2JlIFBob3Rvc2hvcCBDQyAoTWFjaW50b3NoKSIvPiA8L3JkZjpTZXE+IDwveG1wTU06SGlzdG9yeT4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+IDw/eHBhY2tldCBlbmQ9InIiPz6ZuaZ/AAADN0lEQVRIib2WT4iVZRTGf8+dO0gjYg4OMgoh/WFyIQkjLmbVZkpQtw3SUGFWUIluQgQZJ90bTVgwIDgihkw4wt0IESFUkFS0DIJoZUFoziKQdHpafOf7fOe933fv4MIDl3vf9z3Pc/6855z3yjarJN2w3ak2bM/YHsM2tju2xwCUQlrAInBMEpQqKeNYzrpoe6k6KH2wvTtBnSzRlXkysd1RVziJtCQhCaADtIE5YCT2Kpptye/1AC3bn8Tem7bX2T4m6R/bH7WAB4mZl4BruWfr69atWA/ZnrPdtj0HDEFkNfXM9gjwKXAX2Az8DlyS9GNuLl+P2P7C9uHcjbjHkQpoe8L2+Uzxlbj9Ldn+nO3xErhkezA5nEl+t2vWSyVwPAIvD98Pa6+RySqLSWydPMVNMXZlNZTGgWlgOw1Z7VlZvaQN5Pd4BngG+A9YAW4C85LuJzoFMJNd8T0NDACTwFXbv0k6Wiq1aoA/A8uSliXdkXRF0gHgb9uXUtewfcD2i8nejO2NOaPtedt7bVfAju2BRGFdgA/VgDu2H7oqaSU5Py7pNHArCEZzgroYK5F0HbgBHMzP6rJauvQE8AFwW9LZNQMDdE7S7SZmIlPzvdwO3SqrLahiGbI92wM0CwyF7qqsTgObIt1TtofjMxUjdFPoFPo1M2cQeBvYE1u1tfrI3fGoUt1G3sulRJftWiPfHeBz4MusEEuuntffJH9KeqvBuQngDeA928vAh5J+7bKajLmW7ScbyJ6NNnm1n0fBMxsF8XHZr/kdtoELwEbgrKSvMxIBh4BtwD3gK+AnSY1FEBGfoEj1YeB+avAIxcN5UdJiDfh5AEm/2N4B7AU2UEzQ74Ebkv6twU1RDMvrwLnU4OUgeEfSrRrgTBg8ne2PAvuArcBfkj7LzoeBhYjy9bRoyn65lxtrEttPAfsp3nqAH/phUoM3KdI0CVzpYWQn8DLFv44V4BvgW0kPGiCTCf/DKrU9aHshKmuixtDTto/aftf2C/0iCcxE8C0Ef1dbDEQZd6Ksez4MPQz1b4tsLj4HnKJokT+AC5K+W0tEFI0/CnQ1fqPBRKF89w8Cw2sIru9oe+zD+39bTbkFDwfMFgAAAABJRU5ErkJggg=="/>
                        </div>
                    </li>
                `
            })
            musiclist += '</ul>'
            container.innerHTML = musiclist;

            //为每一个列表添加监控事件
            document.querySelectorAll('.music-list ul li').forEach(item=>{
                item.addEventListener('click', fn)
            })
            //为每一个播放按钮添加事件
            let statusPlays = document.querySelectorAll('.music-list ul li .status-box');
            statusPlays.forEach(item=>{
                item.addEventListener('click', (e)=>{
                    e.stopPropagation();
                    var dataDom = item.parentNode;

                    //如果是关闭的，则打开播放器，关闭其他所有音乐
                    if(item.getAttribute('data-status') == 'pause') {
                        statusPlays.forEach((palyer)=>{
                            palyer.className = 'status-box status-pause';
                            palyer.parentNode.className = '';
                        })
                        dataDom.className="active-music";
                        audioDom.pause();
                        _this.getMusicUrl(dataDom.getAttribute('data-id')).then(urlData=>{
                            if(urlData.code == 200) {
                                audioDom.src = urlData.data[0].url;
                                audioDom.play();
                                item.setAttribute('data-status', 'play');
                            }
                        })
                        item.className = 'status-box status-play';
                    } else {
                        item.className = 'status-box status-pause';
                        audioDom.pause();
                    }
                })
            })
        }
    },

    //搜索音乐并生成列表
    searchMusic: function(value){
        //每次进行搜索需要关闭错误提示
        document.querySelector('.error-audio').style.display = 'none';
        return new Promise((res, rej)=>{
            this._http('https://music-api.kolo.la/search?keywords=' + value).then(back=>{
                if(back.code == 200) {
                    res({code:200, data: back.data.result});
                } else {
                    res({code:500, data: null});
                }
            })
        })
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
    },

    

    // 插入音频
    _insert: function _insert(obj) {
        var editor = this.editor;
        var uploadAudio = editor.uploadAudio;
        uploadAudio.insertLinkAudio(obj);
    }

}

export default Audio