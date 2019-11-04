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
        // console.log(editor, editor.config)
        var userSearch = editor.config.userSearch;
        var roomSearch = editor.config.roomSearch;
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

        var template = `
            <div class="kolo-link">
                <div class="link-container">
                    <h3>插入链接</h3>
                    <div class="link">
                        <p>
                            <span>T</span>
                            <input type="text" placeholder="输入链接文本" id="${inputTextId}"/>
                        </p>
                        <div class="error-word ${inputTextId}">请输入链接文本</div>
                        <p>
                            <span><i class="w-e-icon-link"></i></span>
                            <input type="text" placeholder="输入链接地址" id="${inputLinkId}"/>
                        </p>
                        <div class="error-word ${inputLinkId} link-error">请输入链接地址</div>
                        <div class="error-word ${inputLinkId} error-other">请输入正确的链接</div>
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
                            <div class="${ searchList } search-list"></div>
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
        var linkInfo = {
            type: 0,
            text,
            link
        };
        //关闭弹窗     
        document.querySelector('#' + linkId).addEventListener('click', (e)=>{
            e.stopPropagation()
            var dom = document.querySelector('#' + dialogId);
            dom.parentNode.removeChild(dom);
        }) 
                
        //添加链接
        document.querySelector('#' + btnOkId).addEventListener('click', (e)=> {
            e.stopPropagation();
            linkInfo.text = document.querySelector('#' + inputTextId).value.trim();
            linkInfo.link = document.querySelector('#' + inputLinkId).value.trim();
            // console.log(linkInfo,document.querySelector('.' + inputTextId),document.querySelector('.' + inputLinkId + '.link-error'));
            //校验
            if(!linkInfo.text) {
                document.querySelector('.' + inputTextId + '.error-word').style.display = 'block';
            } else {
                document.querySelector('.' + inputTextId + '.error-word').style.display = 'none';
            }
            if(!linkInfo.link) {
                document.querySelector('.' + inputLinkId + '.link-error').style.display = 'block';
            } else {
                document.querySelector('.' + inputLinkId + '.link-error').style.display = 'none';
            }
            if(!linkInfo.text || !linkInfo.link) {
                return
            }
            //链接格式校验
            if(linkInfo.link.indexOf('https://') == -1 && linkInfo.link.indexOf('kolo://') == -1 && linkInfo.link.indexOf('http://') == -1) {
                document.querySelector('.' + inputLinkId + '.error-other').style.display = 'block';
                return
            } else {
                document.querySelector('.' + inputLinkId + '.error-other').style.display = 'none';
            }

            // console.log(linkInfo.type, 'type', JSON.stringify(linkInfo), this)
            
            if(linkInfo.type == 0) {
                //添加文本链接
                this._insertLink(linkInfo.text, linkInfo.link);
            } else if(linkInfo.type == 1) {
                //添加卡片链接
                this._insertCardLink(linkInfo.text, linkInfo.subText, linkInfo.link, linkInfo.type, linkInfo.head)
            } else if(linkInfo.type == 2) {
                this._insertCardLink(linkInfo.text, linkInfo.subText, linkInfo.link, linkInfo.type, linkInfo.head)
            }
            setTimeout(()=>{
                var dom = document.querySelector('#' + dialogId);
                dom.parentNode.removeChild(dom);
            })
        })

        var dropListDom = document.querySelector('#' + searchList);
        var dropListContent = document.querySelector('.' + searchList);
        var dropListUserDom = document.querySelector('.' + userBtnId);
        var dropListCourseDom = document.querySelector('.' + courseBtnId);

        //弹窗显示控制
        dialog.addEventListener('click', (e)=> {
            e.stopPropagation();
            if(dropListDom.style.display == 'block') {
                dropListDom.style.display = 'none';
                if(linkInfo.type == 1 && !linkInfo.head) {
                    linkInfo.type = 0;
                    document.querySelector('#' + userBtnId).className = '';
                }
                if(linkInfo.type == 2 && !linkInfo.subText) {
                    linkInfo.type = 0;
                    document.querySelector('#' + courseBtnId).className = '';
                }
            }
        })
        dropListDom.addEventListener('click', (e)=> {
            e.stopPropagation();
        })        

        //弹窗
        function addNewLinkInfo() {
            document.querySelector('#' + inputTextId).value = linkInfo.text;
            document.querySelector('#' + inputLinkId).value = linkInfo.link;
            dropListDom.style.display = 'none';
        }

        //搜索个人主页
        document.querySelector('#' + userBtnId).addEventListener('click', (e)=> {
            e.stopPropagation();

            dropListContent.innerHTML = '';
            dropListDom.style.display = 'none';
            document.querySelector('#' + courseBtnId).className = '';
            if(dropListDom.style.display == 'block') {
                dropListDom.style.display = 'none';
                document.querySelector('#' + userBtnId).className = '';
                linkInfo.type = 0;
                return
            }
            linkInfo.type = 1;
            document.querySelector('#' + userBtnId).className = 'actived';
            dropListDom.style.display = 'block';
            dropListUserDom.style.display = 'block';
            dropListCourseDom.style.display = 'none';

            //
            var params = {pageIndex: 1, pageSize: 10, key: ''}, 
                list = [], 
                searchDom = document.querySelector('#' + searchUserlinkId); 
                searchDom.value = '';

            //输入检查
            searchDom.addEventListener('input', (e)=>{
                e.stopPropagation();
                params.key = searchDom.value;
                params.pageIndex = 1;
                userSearch(params).then(res => {
                    if(res) {
                        list = res;
                        this.searchListDomCreated(list, dropListContent, linkInfo, addNewLinkInfo);
                    }
                })
            })
            //点击搜索
            document.querySelector('#' + searchUserBtn).addEventListener('click', (e)=>{
                e.stopPropagation();
                if(params.pageIndex * params.pageSize > list.length) {
                    return 
                } else {
                    params.pageIndex++;
                    userSearch(params).then(res => {
                        if(res) {
                            list = list.concat(res);
                            this.searchListDomCreated(list, dropListContent, linkInfo, addNewLinkInfo);
                        }
                    })
                }
            })
            //滚动检查
            dropListContent.addEventListener('scroll', (e)=> {
                // console.log('滚动', e.target.scrollTop, e.target.scrollHeight, e.target.offsetHeight);
                var scrollTop = e.target.scrollTop, 
                    allHeight = e.target.scrollHeight,
                    contentHeight = e.target.offsetHeight;
                if(scrollTop + contentHeight == allHeight) {
                    if(params.pageIndex * params.pageSize > list.length) {
                        return 
                    } else {
                        params.pageIndex++;
                        userSearch(params).then(res => {
                            if(res) {
                                list = list.concat(res);
                                this.searchListDomCreated(list, dropListContent, linkInfo, addNewLinkInfo);
                            }
                        })
                    }
                }    
            })
        })

        //搜索工作室
        document.querySelector('#' + courseBtnId).addEventListener('click', (e)=> {
            e.stopPropagation();

            dropListContent.innerHTML = '';
            dropListDom.style.display = 'none';
            document.querySelector('#' + userBtnId).className = '';
            if(dropListDom.style.display == 'block') {
                dropListDom.style.display = 'none';
                document.querySelector('#' + courseBtnId).className = '';
                linkInfo.type = 0;
                return
            }
            linkInfo.type = 2;
            document.querySelector('#' + courseBtnId).className = 'actived';
            dropListDom.style.display = 'block';
            dropListUserDom.style.display = 'none';
            dropListCourseDom.style.display = 'block';
            
            //
            var params = {pageIndex: 1, pageSize: 10, key: ''}, 
                list = [], 
                searchDom = document.querySelector('#' + searchRoomlinkId); 
                searchDom.value = '';

            //输入检查
            searchDom.addEventListener('input', (e)=>{
                e.stopPropagation();
                params.key = searchDom.value;
                params.pageIndex = 1;
                roomSearch(params).then(res => {
                    if(res) {
                        list = res;
                        this.searchListDomCreated(list, dropListContent, linkInfo, addNewLinkInfo);
                    }
                })
            })
            //点击搜索
            document.querySelector('#' + searchRoomBtn).addEventListener('click', (e)=>{
                e.stopPropagation();
                if(params.pageIndex * params.pageSize > list.length) {
                    return 
                } else {
                    params.pageIndex++;
                    roomSearch(params).then(res => {
                        if(res) {
                            list = list.concat(res);
                            this.searchListDomCreated(list, dropListContent, linkInfo, addNewLinkInfo);
                        }
                    })
                }
            })
            //滚动检查
            dropListContent.addEventListener('scroll', (e)=> {
                // console.log('滚动', e.target.scrollTop, e.target.scrollHeight, e.target.offsetHeight);
                var scrollTop = e.target.scrollTop, 
                    allHeight = e.target.scrollHeight,
                    contentHeight = e.target.offsetHeight;
                if(scrollTop + contentHeight == allHeight) {
                    if(params.pageIndex * params.pageSize > list.length) {
                        return 
                    } else {
                        params.pageIndex++;
                        roomSearch(params).then(res => {
                            if(res) {
                                list = list.concat(res);
                                this.searchListDomCreated(list, dropListContent, linkInfo, addNewLinkInfo);
                            }
                        })
                    }
                }    
            })  
        })
    },

    //拼装列表
    searchListDomCreated(list, dom, linkInfo, fn) {
        var htmlString = '';
        list.forEach(el => {
            htmlString +=  `<div class="search-li" data-head="${el.fullHeadImage}" data-id="${ el.id }" data-type="${ el.userType }" data-name="${ el.nickName }" data-sub="${ el.singleIntroduction }">
                <div class="search-li-left"><img src="${el.fullHeadImage}"></div>
                <div class="search-li-right">
                    <h3>${ el.nickName || '' }</h3>
                    <p>${ el.singleIntroduction || '' }</p>
                </div>
            </div>`
        });
        dom.innerHTML = htmlString;

        setTimeout(()=>{
            //添加事件
            var doms = document.querySelectorAll('.search-li');
            doms.forEach(item => {
                item.addEventListener('click', (e)=> {
                    e.stopPropagation();
                    if(linkInfo.type == 1) {
                        let userType = item.getAttribute('data-type');
                        if(userType == 2) {
                            linkInfo.link = 'kolo://user/' + item.getAttribute('data-id');
                        } 
                        if(userType == 3) {
                            linkInfo.link = 'kolo://studio/' + item.getAttribute('data-id');
                        }
                        linkInfo.head = item.getAttribute('data-head');
                    } else if(linkInfo.type == 2) {
                        linkInfo.link = 'kolo://toStudioCard/' + item.getAttribute('data-id');
                    }
                    linkInfo.text = item.getAttribute('data-name') || '--';
                    linkInfo.subText = item.getAttribute('data-sub') || '--';
                    // console.log(JSON.stringify(linkInfo));
                    fn();
                })
            })
        })
    },

    // 插入文本链接
    _insertLink: function (text, link) {
        const editor = this.editor;
        // console.log('生成链接', text, link)
        if(!text || !link) {
            return
        }

        editor.cmd.do('insertHTML', `<a class="kolo-inline-link" target="_blank" href="${ link }">${text}</a>`)
    },

    // 插入卡片链接
    _insertCardLink: function (title, text, link, type, headImage) {
        const editor = this.editor;
        
        var imageUrl = '';
        if(type == 1) {
            imageUrl = headImage;
        } else if(type == 2) {
            imageUrl = 'http://image.kolocdn.com/o_1c3k1l4vp1ujq19pfmijgho1sg6e.jpg';
        }
        
        editor.cmd.do('insertHTML', 
            `<div class="kolo-link" contenteditable="false">
                <a href="${link}" target="_blank">
                    <div class="link-img">
                        <img src="${ imageUrl }?imageView2/1/w/80/h/80"/>
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