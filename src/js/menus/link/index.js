/*
    menu - link
*/
import $ from '../../util/dom-core.js'
import { getRandom } from '../../util/util.js'
import replaceLang from '../../util/replace-lang.js'

// 构造函数
function Link(editor) {
    this.editor = editor
    this.$elem = $('<div class="w-e-menu"><i class="w-e-icon-link"></i></div>')
    this.type = 'panel'

    // 当前是否 active 状态
    this._active = false
}

// 原型
Link.prototype = {
    constructor: Link,

    // 点击事件
    onClick: function (e) {
        const editor = this.editor
        let $linkelem

        if (this._active) {
            // 当前选区在链接里面
            $linkelem = editor.selection.getSelectionContainerElem()
            if (!$linkelem) {
                return
            }
            // 将该元素都包含在选取之内，以便后面整体替换
            editor.selection.createRangeByElem($linkelem)
            editor.selection.restoreSelection()
            // 显示 panel
            this._createPanel($linkelem.text(), $linkelem.attr('href'))
        } else {
            // 当前选区不在链接里面
            if (editor.selection.isSelectionEmpty()) {
                // 选区是空的，未选中内容
                this._createPanel('', '')
            } else {
                // 选中内容了
                this._createPanel(editor.selection.getSelectionText(), '')
            }
        }
    },

    // 创建 panel
    _createPanel: function (text, link) {
        // panel 中需要用到的id
        var editor = this.editor;
        var containerId = editor.toolbarSelector;

        const dialogId = getRandom('link-dialog');
        const linkId = getRandom('add-linkId');
        const inputLinkId = getRandom('input-link')
        const inputTextId = getRandom('input-text')
        const btnOkId = getRandom('btn-ok');

        const searchList = getRandom('search-list');

        const userBtnId = getRandom('user-btn');
        const courseBtnId = getRandom('course-btn');

        const searchUserlinkId = getRandom('search-link-key0');
        const searchUserBtn = getRandom('search-btn0');
        const searchRoomlinkId = getRandom('search-link-key1');
        const searchRoomBtn = getRandom('search-btn1');

        var type = 0; //0普通链接、1个人主页链接、2课程卡链接

        var template = `
            <div class="kolo-link">
                <div class="link-container">
                    <h3>插入链接</h3>
                    <div class="link">
                        <p>
                            <span>T</span>
                            <input type="text" placeholder="输入链接文本" id="${inputTextId}"/>
                        </p>
                        <p>
                            <span><i class="w-e-icon-link"></i></span>
                            <input type="text" placeholder="输入链接地址" id="${inputLinkId}"/>
                        </p>
                    </div>
                    <div class="other-link">
                        <p>
                            <b>内部链接：</b>
                            <span id="${ userBtnId }">个人主页</span>  |  
                            <span id="${ courseBtnId }">课程卡</span>
                        </p>
                        <div id="${ searchList }" class="other-link-content">
                            <div class="search-box ${ userBtnId }">
                                <div class="status-box">
                                    <img class="search" id="${searchUserBtn}" src="http://image.kolocdn.com/FoKx9in6OwMaaNwaN8OlcH7WzYw8" />
                                </div>
                                <input type="text" placeholder="搜索用户" id="${searchUserlinkId}"/>
                            </div>
                            <div class="search-box ${ courseBtnId }">
                                <div class="status-box">
                                    <img class="search" id="${searchRoomBtn}" src="http://image.kolocdn.com/FoKx9in6OwMaaNwaN8OlcH7WzYw8" />
                                </div>
                                <input type="text" placeholder="搜索工作室" id="${searchRoomlinkId}"/>
                            </div>
                            <div class="${ searchList }"></div>
                        </div>
                    </div>
                    <div class="w-e-up-btn">
                        <button id="${btnOkId}">确定</button>
                    </div>
                    <i id="${linkId}" class="w-e-icon-close">×</i>
                </div>
            </div>`

        //替换多语言        
        template = replaceLang(editor, template);
        
        //
        var dialog = document.createElement('div');
        dialog.className = 'kolo-e-dialog';
        dialog.id = dialogId;
        dialog.innerHTML = template; 

        //添加弹窗
        document.querySelector(containerId).appendChild(dialog); 

        //初始化输入值
        document.querySelector('#' + inputTextId).value = text;
        document.querySelector('#' + inputLinkId).value = link;

        //关闭弹窗     
        document.querySelector('#' + linkId).addEventListener('click', (e)=>{
            e.stopPropagation()
            var dom = document.querySelector('#' + dialogId);
            dom.parentNode.removeChild(dom);
        })  
        
        //添加链接
        document.querySelector('#' + btnOkId).addEventListener('click', (e)=> {
            e.stopPropagation();
            let _text = document.querySelector('#' + inputTextId).value;
            let _link = document.querySelector('#' + inputLinkId).value;
            if(type == 0) {
                //添加文本链接
                this._insertLink(_text, _link);
            } else if(type == 1) {
                //添加卡片链接

            } else {

            }
            setTimeout(()=>{
                var dom = document.querySelector('#' + dialogId);
                dom.parentNode.removeChild(dom);
            })
        })

        //搜索个人主页
        document.querySelector('#' + userBtnId).addEventListener('click', (e)=> {
            e.stopPropagation();

        })
        //搜索工作室
        document.querySelector('#' + courseBtnId).addEventListener('click', (e)=> {
            e.stopPropagation();

        })
    },

    //

    // 插入文本链接
    _insertLink: function (text, link) {
        const editor = this.editor;
        if(!text || !link) {
            return
        }

        editor.cmd.do('insertHTML', `<a class="kolo-link" href="${link}" target="_blank">${text}</a>`)
    },

    // 插入卡片链接
    _insertCardLink: function (title, text, link, type, headImage) {
        const editor = this.editor;
        if(!title || !text || !link) {
            return
        }
        
        var imageUrl = '';
        if(type == 1) {
            imageUrl = headImage;
        } else if(type == 2) {
            imageUrl = '';
        }
        
        editor.cmd.do('insertHTML', 
            `<div class="kolo-link" contenteditable="false">
                <a href="${link}" target="_blank">
                    <div class="link-img">
                        <img src="${ imageUrl }"/>
                    </div>
                    <div class="link-content">
                        <h3>${title}</h3>
                        <p>${text}</p>
                    </div>
                </a>
            </div>
            <p>&#8203;<br></p>`)
        
    },
    
    // 试图改变 active 状态
    tryChangeActive: function (e) {
        const editor = this.editor
        const $elem = this.$elem
        const $selectionELem = editor.selection.getSelectionContainerElem()
        if (!$selectionELem) {
            return
        }
        if ($selectionELem.getNodeName() === 'A') {
            this._active = true
            $elem.addClass('w-e-active')
        } else {
            this._active = false
            $elem.removeClass('w-e-active')
        }
    }
}

export default Link