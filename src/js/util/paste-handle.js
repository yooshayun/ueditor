/*
    粘贴信息的处理
*/

import $ from './dom-core.js'
import { replaceHtmlSymbol } from './util.js'
import { objForEach } from './util.js'

// 获取粘贴的纯文本
export function getPasteText(e) {
    const clipboardData = e.clipboardData || (e.originalEvent && e.originalEvent.clipboardData)
    let pasteText
    if (clipboardData == null) {
        pasteText = window.clipboardData && window.clipboardData.getData('text')
    } else {
        pasteText = clipboardData.getData('text/plain')
    }

    return replaceHtmlSymbol(pasteText)
}

// 获取粘贴的html
export function getPasteHtml(e, filterStyle, ignoreImg) {
    const clipboardData = e.clipboardData || (e.originalEvent && e.originalEvent.clipboardData)
    let pasteText, pasteHtml
    if (clipboardData == null) {
        pasteText = window.clipboardData && window.clipboardData.getData('text')
    } else {
        pasteText = clipboardData.getData('text/plain')
    }
    
    // console.log(pasteText, 'pasteText')
    pasteHtml = '';
    if (pasteText) {
        pasteText.split('\n').forEach(item => {
            if(item && item !== '\n') {
                pasteHtml += '<p>' + replaceHtmlSymbol(item) + '</p>';
            }
        })
    }
    
    if (!pasteHtml) {
        return
    }

    // 过滤word中状态过来的无用字符
    const docSplitHtml = pasteHtml.split('</html>')
    if (docSplitHtml.length === 2) {
        pasteHtml = docSplitHtml[0]
    }

    // 过滤无用标签
    pasteHtml = pasteHtml.replace(/<(meta|script|link).+?>/igm, '')
    // 去掉注释
    pasteHtml = pasteHtml.replace(/<!--.*?-->/mg, '')
    // 去掉空的p标签
    pasteHtml = pasteHtml.replace(/<p>[\s\t\n]{1}<\/p>/mg, '')
    //去掉非法字符
    pasteHtml = pasteHtml.replace(/\u200B/g,'')
    // 过滤 data-xxx 属性
    pasteHtml = pasteHtml.replace(/\s?data-.+?=('|").+?('|")/igm, '')

    if (ignoreImg) {
        // 忽略图片
        pasteHtml = pasteHtml.replace(/<img.+?>/igm, '')
    }

    if (filterStyle) {
        // 过滤样式
        pasteHtml = pasteHtml.replace(/\s?(class|style)=('|").*?('|")/igm, '')
    } else {
        // 保留样式
        pasteHtml = pasteHtml.replace(/\s?class=('|").*?('|")/igm, '')
    }

    return pasteHtml
}

// 获取粘贴的图片文件
export function getPasteImgs(e) {
    const result = []
    const txt = getPasteText(e)
    if (txt) {
        // 有文字，就忽略图片
        return result
    }

    const clipboardData = e.clipboardData || (e.originalEvent && e.originalEvent.clipboardData) || {}
    const items = clipboardData.items
    if (!items) {
        return result
    }

    objForEach(items, (key, value) => {
        const type = value.type
        if (/image/i.test(type)) {
            result.push(value.getAsFile())
        }
    })

    return result
}
