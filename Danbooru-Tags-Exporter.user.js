// ==UserScript==
// @name         Danbooru Tags Select to Export
// @name:zh-TW   Danbooru 标签导出器
// @name:zh-HK   Danbooru 标签导出器
// @name:zh-CN   Danbooru 标签导出器
// @name:ja      Danbooru Tags Select to Export
// @namespace    https://github.com/kozeki-uii/Danbooru-Tags-Exporter
// @supportURL   https://github.com/kozeki-uii/Danbooru-Tags-Exporter/issues
// @homepageURL  https://github.com/kozeki-uii/Danbooru-Tags-Exporter
// @updateURL    https://raw.githubusercontent.com/kozeki-uii/Danbooru-Tags-Exporter/main/Danbooru-Tags-Exporter.user.js
// @downloadURL  https://raw.githubusercontent.com/kozeki-uii/Danbooru-Tags-Exporter/main/Danbooru-Tags-Exporter.user.js
// @require      https://greasemonkey.github.io/gm4-polyfill/gm4-polyfill.js
// @version      0.6.0
// @description  Select tags and copy to clipboard. Category filtering, +/- weight, SD/NAI format, silent mode.
// @description:zh-CN  选择标签复制到剪贴板，分类提取、加减权重、SD/NAI 格式、静默模式
// @description:zh-TW  選擇標籤複製到剪貼板，分類提取、加減權重、SD/NAI 格式、靜默模式
// @description:zh-HK  選擇標籤複製到剪貼板，分類提取、加減權重、SD/NAI 格式、靜默模式
// @author       FSpark / kozeki-uii
// @match        https://danbooru.donmai.us/posts/*
// @match        https://safebooru.donmai.us/posts/*
// @match        https://aibooru.online/posts/*
// @match        https://betabooru.donmai.us/posts/*
// @match        https://gelbooru.com/index.php?page=post&s=view&id=*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=donmai.us
// @grant        GM.setClipboard
// @grant        GM.notification
// @grant        GM.addStyle
// @grant        GM_getValue
// @grant        GM_setValue
// @license      AGPL-3.0
// ==/UserScript==

(function () {
    'use strict';

    // 防止重复注入
    if (document.getElementById('tags-exporter-setting')) return;

    // ============================================================
    //  样式
    // ============================================================
    GM_addStyle(`
        #tags-exporter-setting {
            background: rgba(0,0,0,0.03);
            border: 1px solid rgba(0,0,0,0.08);
            border-radius: 6px;
            padding: 8px 12px;
            margin: 6px 0;
            font-size: 13px;
            line-height: 1.5;
        }
        #tags-exporter-setting h2 {
            margin: 0 0 4px 0;
            font-size: 13px;
            font-weight: 600;
            color: inherit;
        }
        #tags-exporter-setting .opt-row {
            display: flex;
            align-items: center;
            flex-wrap: wrap;
            gap: 4px 14px;
            margin: 1px 0;
        }
        #tags-exporter-setting .opt-row label {
            margin: 0;
            white-space: nowrap;
            display: inline-flex;
            align-items: center;
            gap: 3px;
        }
        #tags-exporter-setting .opt-row label input { margin: 0; }
        #tags-exporter-setting code {
            font-size: 0.9em;
            background: rgba(0,0,0,0.06);
            padding: 1px 4px;
            border-radius: 3px;
        }

        #tags-exporter-container {
            display: flex;
            align-items: center;
            flex-wrap: wrap;
            gap: 4px;
            margin: 4px 0;
        }
        #tags-exporter-container button, #tag-list button {
            padding: 2px 10px;
            border: 1px solid #bbb;
            border-radius: 4px;
            background: #f8f8f8;
            cursor: pointer;
            font-size: 12px;
            line-height: 1.6;
            transition: background 0.15s;
        }
        #tags-exporter-container button:hover, #tag-list button:hover { background: #eee; }
        #tags-exporter-container button:active, #tag-list button:active { background: #ddd; }

        .tag-weight {
            display: inline-flex;
            align-items: center;
            gap: 2px;
            margin: 0 3px;
        }
        .tag-weight .w-btn {
            width: 20px; height: 20px; padding: 0;
            font-size: 13px; font-weight: bold; line-height: 1;
            cursor: pointer; border: 1px solid #bbb; border-radius: 3px;
            background: #f5f5f5; color: #333; user-select: none;
            display: inline-flex; align-items: center; justify-content: center;
            transition: background 0.12s;
        }
        .tag-weight .w-btn:hover { background: #ddd; }
        .tag-weight .w-btn:active { background: #ccc; }
        .tag-weight .w-val {
            display: inline-block; min-width: 22px; text-align: center;
            font-size: 12px; font-weight: 600; font-family: monospace;
            color: #555;
        }

        .tag-count {
            font-size: 12px; color: #999; margin-left: 6px;
        }
        #tag-summary {
            font-size: 11px; color: #aaa; margin-top: 2px;
        }

        #weight-format-group .opt-row {
            margin: 2px 0;
        }

        /* Toast */
        #exporter-toast {
            position: fixed; bottom: 20px; right: 20px;
            background: #333; color: #fff;
            padding: 8px 16px; border-radius: 6px;
            font-size: 13px; z-index: 99999;
            opacity: 0; transition: opacity 0.25s ease;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
            pointer-events: none;
        }
        #exporter-toast.show { opacity: 0.95; }

        /* 暗色 */
        @media (prefers-color-scheme: dark) {
            #tags-exporter-setting {
                background: rgba(255,255,255,0.04);
                border-color: rgba(255,255,255,0.08);
            }
            #tags-exporter-setting code { background: rgba(255,255,255,0.08); }
            #tags-exporter-container button, #tag-list button {
                background: #3a3a3a; border-color: #555; color: #ddd;
            }
            #tags-exporter-container button:hover, #tag-list button:hover { background: #4a4a4a; }
            .tag-weight .w-btn {
                background: #444; border-color: #666; color: #eee;
            }
            .tag-weight .w-btn:hover { background: #555; }
            .tag-weight .w-val { color: #ccc; }
            .tag-count { color: #999; }
            #tag-summary { color: #888; }
        }

        /* Gelbooru 覆写 */
        body:not(.default-css) #tags-exporter-setting h2 { font-size: 1.2em; }
        body:not(.default-css) #tags-exporter-setting {
            margin: 0 10px;
        }
        body:not(.default-css) #tags-exporter-container button,
        body:not(.default-css) #tag-list button { padding: 0.1em 0.3em; margin-bottom: 0.1em; }
        body:not(.default-css) #tags-exporter-container { margin: 0 10px; }
    `);

    // ============================================================
    //  Toast
    // ============================================================
    function showToast(msg) {
        var old = document.getElementById('exporter-toast');
        if (old) old.remove();
        var t = document.createElement('div');
        t.id = 'exporter-toast';
        t.textContent = msg;
        document.body.appendChild(t);
        requestAnimationFrame(function () { t.classList.add('show'); });
        setTimeout(function () {
            t.classList.remove('show');
            setTimeout(function () { t.remove(); }, 250);
        }, 2000);
    }

    // ============================================================
    //  设置面板（紧凑布局）
    // ============================================================
    var panel = document.createElement('section');
    panel.id = 'tags-exporter-setting';
    panel.innerHTML = [
        '<h2>Danbooru 标签导出器</h2>',
        '<div class="opt-row">',
        '  <label><input type="checkbox" id="bracket-escape" checked/> 转义括号</label>',
        '  <label><input type="checkbox" id="export-metadata" checked/> 元数据</label>',
        '  <label><input type="checkbox" id="set-weight"/> 权重</label>',
        '  <label><input type="checkbox" id="silent-export"/> 静默</label>',
        '</div>',
        '<div id="weight-format-group" style="display:none">',
        '  <div class="opt-row">',
        '    <span>格式：</span>',
        '    <label><input type="radio" name="wf" value="sd" checked/> <code>(tag:1.5)</code> SD</label>',
        '    <label><input type="radio" name="wf" value="nai"/> <code>1.5::tag::</code> NAI</label>',
        '    <span style="margin-left:6px;">步进：</span>',
        '    <label><input type="radio" name="wstep" value="0.1"/> 0.1</label>',
        '    <label><input type="radio" name="wstep" value="0.5" checked/> 0.5</label>',
        '    <label><input type="radio" name="wstep" value="1"/> 1</label>',
        '  </div>',
        '</div>',
        '<div id="tag-summary"></div>'
    ].join('\n');

    // ============================================================
    //  操作按钮模板
    // ============================================================
    var btnTpl = document.createElement('div');
    btnTpl.id = 'tags-exporter-container';
    btnTpl.innerHTML = [
        '<button name="select_all">全选</button>',
        '<button name="select_none">取消</button>',
        '<button name="invert_select">反选</button>',
        '<button name="export">导出</button>',
        '<span class="tag-count"></span>'
    ].join('');

    // ============================================================
    //  DOM 工具
    // ============================================================
    function insertAfter(n, ref) {
        ref.parentNode.insertBefore(n, ref.nextSibling);
    }

    function getRef(sel) {
        var el = document.querySelector(sel);
        return el;
    }

    // ============================================================
    //  插入面板
    // ============================================================
    var isGel = location.host === 'gelbooru.com';
    if (isGel) {
        var ref = getRef('.aside>.tag-list');
        if (ref) {
            ref.parentNode.insertBefore(panel, ref);
            ref.parentNode.insertBefore(btnTpl, ref);
        }
    } else {
        var sb = getRef('#search-box');
        if (sb) {
            insertAfter(panel, sb);
            var h2 = panel.querySelector('h2');
            if (h2) insertAfter(btnTpl, h2);
        }
    }

    // ============================================================
    //  权重格式化
    // ============================================================
    function fmtWeight(tag, val, fmt) {
        if (val === 0) return tag;
        var s = val.toFixed(1);
        if (fmt === 'nai') {
            var close = /[0-9]$/.test(tag) ? ' ::' : '::';
            return s + '::' + tag + close;
        }
        return '(' + tag + ':' + s + ')';
    }

    function adjWeight(cur, delta, fmt, step) {
        var nv = cur + delta * step;
        nv = Math.round(nv * 100) / 100;
        if (fmt === 'sd') {
            if (nv < 0) return 0;
            if (nv > 3) return 3;
            return nv;
        }
        if (nv > 5) return 5;
        if (nv < -5) return -5;
        return nv;
    }

    // ============================================================
    //  导出（防抖 + 去重 + 静默）
    // ============================================================
    var locked = false;

    function doExport(target) {
        if (locked) return;
        locked = true;
        setTimeout(function () { locked = false; }, 500);

        var esc = document.getElementById('bracket-escape').checked;
        var wOn = document.getElementById('set-weight').checked;
        var meta = document.getElementById('export-metadata').checked;
        var silent = document.getElementById('silent-export').checked;
        var fmtEl = document.querySelector('input[name="wf"]:checked');
        var fmt = fmtEl ? fmtEl.value : 'sd';
        var stepEl = document.querySelector('input[name="wstep"]:checked');
        var step = stepEl ? parseFloat(stepEl.value) : 0.5;

        var out = [], seen = new Set();

        document.querySelectorAll(target).forEach(function (cb) {
            var li = cb.closest('li');
            if (li) {
                if (li.closest('.meta-tag-list, .tag-type-metadata') && !meta) return;
            }

            var tag = cb.value;
            var key = tag.toLowerCase().trim();
            if (seen.has(key)) return;
            seen.add(key);

            tag = tag.replaceAll('_', ' ');

            if (esc) {
                tag = tag.replaceAll('(', '\\(').replaceAll(')', '\\)');
            }

            if (wOn) {
                var wc = li ? li.querySelector('.tag-weight') : null;
                if (wc) {
                    var vs = wc.querySelector('.w-val');
                    var v = parseFloat(vs.textContent) || 0;
                    tag = fmtWeight(tag, v, fmt);
                }
            }

            out.push(tag);
        });

        if (!out.length) {
            if (silent) showToast('没有选中任何标签！');
            else GM.notification('没有选中任何标签！', 'Danbooru 标签导出器');
            return;
        }

        GM.setClipboard(out.join(', '));
        var msg = '已复制 ' + out.length + ' 个标签到剪贴板！';
        if (silent) showToast(msg);
        else GM.notification(msg, 'Danbooru 标签导出器');
    }

    // ============================================================
    //  设置持久化
    // ============================================================
    var SKEY = 'dte_settings_v3';

    function save() {
        var wf = document.querySelector('input[name="wf"]:checked');
        var ws = document.querySelector('input[name="wstep"]:checked');
        GM_setValue(SKEY, {
            be: document.getElementById('bracket-escape').checked,
            em: document.getElementById('export-metadata').checked,
            sw: document.getElementById('set-weight').checked,
            wf: wf ? wf.value : 'sd',
            ws: ws ? ws.value : '0.5',
            se: document.getElementById('silent-export').checked
        });
    }

    function load() {
        var s = GM_getValue(SKEY, null);
        if (!s) return;
        var el;
        el = document.getElementById('bracket-escape');      if (el && s.be !== undefined) el.checked = s.be;
        el = document.getElementById('export-metadata');    if (el && s.em !== undefined) el.checked = s.em;
        el = document.getElementById('silent-export');      if (el && s.se !== undefined) el.checked = s.se;
        el = document.getElementById('set-weight');         if (el && s.sw !== undefined) { el.checked = s.sw; fire(el, 'change'); }
        if (s.wf) { var r1 = document.querySelector('input[name="wf"][value="' + s.wf + '"]'); if (r1) { r1.checked = true; fire(r1, 'change'); } }
        if (s.ws) { var r2 = document.querySelector('input[name="wstep"][value="' + s.ws + '"]'); if (r2) r2.checked = true; }
    }

    function fire(el, ev) {
        var e = document.createEvent('HTMLEvents');
        e.initEvent(ev, false, true);
        el.dispatchEvent(e);
    }

    document.addEventListener('change', function (e) {
        if (/^(bracket-escape|export-metadata|set-weight|silent-export)$/.test(e.target.id) ||
            e.target.name === 'wf' || e.target.name === 'wstep') save();
    });

    // ============================================================
    //  计数
    // ============================================================
    function updCount(ctx) {
        if (!ctx) ctx = document;
        var c = ctx.querySelectorAll('input[type="checkbox"][name$="s"]:checked').length;
        var t = ctx.querySelectorAll('input[type="checkbox"][name$="s"]').length;
        var el = ctx.querySelector('.tag-count');
        if (el) el.textContent = c > 0 ? (c + '/' + t) : '';
    }

    function summary() {
        var t = document.querySelectorAll('#tag-list input[type="checkbox"], .tag-list input[type="checkbox"]').length;
        var el = document.getElementById('tag-summary');
        if (el) el.textContent = '共 ' + t + ' 个标签';
    }

    // ============================================================
    //  权重控件
    // ============================================================
    function mkWeight() {
        var c = document.createElement('span');
        c.className = 'tag-weight';
        c.style.display = 'none';
        c.innerHTML = '<button class="w-btn wm" type="button">−</button><span class="w-val">0</span><button class="w-btn wp" type="button">+</button>';
        return c;
    }

    // ============================================================
    //  分类按钮
    // ============================================================
    function bindBtns(ct, prefix) {
        ct.querySelector("[name='select_all']").onclick = function () {
            document.querySelectorAll('[name="' + prefix + '"]').forEach(function (b) { b.checked = true; });
            updCount(ct);
        };
        ct.querySelector("[name='select_none']").onclick = function () {
            document.querySelectorAll('[name="' + prefix + '"]').forEach(function (b) { b.checked = false; });
            updCount(ct);
        };
        ct.querySelector("[name='invert_select']").onclick = function () {
            document.querySelectorAll('[name="' + prefix + '"]').forEach(function (b) { b.checked = !b.checked; });
            updCount(ct);
        };
        ct.querySelector("[name='export']").onclick = function () {
            doExport('[name="' + prefix + '"]:checked');
        };
    }

    // ============================================================
    //  Danbooru 分类
    // ============================================================
    function insDan(t) {
        var h = document.querySelector('h3.' + t + '-list');
        if (!h) return;
        var pfx = t + 's';
        var ct = btnTpl.cloneNode(true);
        ct.id = t + '-buttons';
        insertAfter(ct, h);
        document.querySelectorAll('.' + t + '-list > li').forEach(function (li) {
            if (!li.dataset.tagName) return;
            var cb = document.createElement('input');
            cb.type = 'checkbox'; cb.name = pfx;
            cb.value = li.dataset.tagName.replaceAll('_', ' ');
            li.insertBefore(cb, li.firstChild);
            insertAfter(mkWeight(), cb);
        });
        bindBtns(ct, pfx);
        ct.querySelectorAll('[name="' + pfx + '"]').forEach(function (b) {
            b.addEventListener('change', function () { updCount(ct); });
        });
        updCount(ct);
    }

    // ============================================================
    //  Gelbooru 分类
    // ============================================================
    function insGel(t) {
        var el = document.querySelector('.' + t);
        if (!el) return;
        var ref = el.previousSibling;
        var pfx = t + 's';
        var ct = btnTpl.cloneNode(true);
        ct.id = t + '-buttons';
        insertAfter(ct, ref);
        document.querySelectorAll('.' + t).forEach(function (li) {
            var a = li.querySelector(':scope > a');
            if (!a) return;
            var cb = document.createElement('input');
            cb.type = 'checkbox'; cb.name = pfx;
            cb.value = a.textContent.replaceAll('_', ' ');
            li.insertBefore(cb, li.firstChild);
            insertAfter(mkWeight(), cb);
        });
        bindBtns(ct, pfx);
        ct.querySelectorAll('[name="' + pfx + '"]').forEach(function (b) {
            b.addEventListener('change', function () { updCount(ct); });
        });
        updCount(ct);
    }

    // ============================================================
    //  挂载
    // ============================================================
    // Danbooru — 注意 Meta 用的是 meta-tag-list，不是 metadata-tag-list
    ['artist-tag', 'character-tag', 'copyright-tag', 'meta-tag', 'general-tag'].forEach(insDan);
    // Gelbooru
    ['tag-type-artist', 'tag-type-character', 'tag-type-copyright', 'tag-type-metadata', 'tag-type-general'].forEach(insGel);

    // ============================================================
    //  全局按钮
    // ============================================================
    btnTpl.querySelector("[name='select_all']").onclick = function () {
        document.querySelectorAll('#tag-list input[type="checkbox"], .tag-list input[type="checkbox"]').forEach(function (b) { b.checked = true; });
        updCount();
    };
    btnTpl.querySelector("[name='select_none']").onclick = function () {
        document.querySelectorAll('#tag-list input[type="checkbox"], .tag-list input[type="checkbox"]').forEach(function (b) { b.checked = false; });
        updCount();
    };
    btnTpl.querySelector("[name='invert_select']").onclick = function () {
        document.querySelectorAll('#tag-list input[type="checkbox"], .tag-list input[type="checkbox"]').forEach(function (b) { b.checked = !b.checked; });
        updCount();
    };
    btnTpl.querySelector("[name='export']").onclick = function () {
        doExport('#tag-list input[type="checkbox"]:checked, .tag-list input[type="checkbox"]:checked');
    };

    document.addEventListener('change', function (e) {
        if (e.target.type === 'checkbox' && e.target.name && e.target.name.endsWith('s')) {
            updCount(e.target.closest('[id$="-buttons"]') || btnTpl);
        }
    });
    updCount();

    // ============================================================
    //  总标签数
    // ============================================================
    summary();

    // ============================================================
    //  权重开关
    // ============================================================
    document.getElementById('set-weight').onchange = function (e) {
        var v = e.target.checked;
        document.querySelectorAll('.tag-weight').forEach(function (el) { el.style.display = v ? '' : 'none'; });
        document.getElementById('weight-format-group').style.display = v ? 'block' : 'none';
    };

    // ============================================================
    //  元数据开关（Danbooru: .meta-tag-list, Gelbooru: .tag-type-metadata）
    // ============================================================
    document.getElementById('export-metadata').onchange = function (e) {
        var v = e.target.checked;
        document.querySelectorAll('.meta-tag-list, .tag-type-metadata').forEach(function (el) {
            el.style.display = v ? '' : 'none';
        });
        document.querySelectorAll('[id$="-buttons"]').forEach(function (el) {
            if (/meta/i.test(el.id)) el.style.display = v ? '' : 'none';
        });
    };

    // ============================================================
    //  ± 按钮
    // ============================================================
    document.addEventListener('click', function (e) {
        var btn = e.target.closest('.w-btn');
        if (!btn) return;
        e.preventDefault();
        var ctrl = btn.closest('.tag-weight');
        if (!ctrl) return;
        var fmt = (document.querySelector('input[name="wf"]:checked') || {}).value || 'sd';
        var step = parseFloat((document.querySelector('input[name="wstep"]:checked') || {}).value || '0.5');
        var vs = ctrl.querySelector('.w-val');
        var cur = parseFloat(vs.textContent) || 0;
        var d = btn.classList.contains('wp') ? 1 : -1;
        vs.textContent = adjWeight(cur, d, fmt, step).toFixed(step >= 1 ? 0 : 1);
    });

    // ============================================================
    //  切换格式 → 修正值
    // ============================================================
    document.querySelectorAll('input[name="wf"]').forEach(function (r) {
        r.addEventListener('change', function () {
            var fmt = this.value;
            document.querySelectorAll('.w-val').forEach(function (s) {
                var cur = parseFloat(s.textContent) || 0;
                if (fmt === 'sd') {
                    if (cur < 0) { s.textContent = '0.0'; return; }
                    if (cur > 3) s.textContent = '3.0';
                } else {
                    if (cur < -5) s.textContent = '-5.0';
                    if (cur > 5) s.textContent = '5.0';
                }
            });
        });
    });

    // ============================================================
    //  加载已保存设置
    // ============================================================
    load();

})();
