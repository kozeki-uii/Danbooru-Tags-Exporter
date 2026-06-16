// @grant        GM_getValue
// @grant        GM_setValue
// @license      AGPL-3.0
// ==/UserScript==

(function () {
    'use strict';

    if (document.getElementById('tags-exporter-setting')) return;

    // ============================================================
    //  鏍峰紡
    // ============================================================
    GM.addStyle(`
        #tags-exporter-setting {
            background: rgba(0,0,0,0.03);
            border: 1px solid rgba(0,0,0,0.08);
            border-radius: 6px;
            padding: 8px 12px;
            margin: 6px 0;
            font-size: 13px;
            line-height: 1.5;
            width: 100%;
            box-sizing: border-box;
            text-align: left;
        }
        #tags-exporter-setting h2 {
            margin: 0 0 4px 0;
            font-size: 13px;
            font-weight: 600;
            color: inherit;
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            gap: 0 6px;
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
        #tags-exporter-setting .opt-row > span:first-child {
            min-width: 2.5em;
            flex-shrink: 0;
        }
        #tags-exporter-setting .hint {
            font-size: 11px; color: #aaa; margin-left: 6px;
        }

        /* 鍒嗘閫夋嫨鍣?*/
        .seg-group {
            display: inline-flex;
            border: 1px solid #bbb;
            border-radius: 5px;
            overflow: hidden;
            font-size: 12px;
            line-height: 1;
            vertical-align: middle;
        }
        .seg-group .seg {
            padding: 4px 12px;
            cursor: pointer;
            border-right: 1px solid #bbb;
            background: #f8f8f8;
            color: #555;
            transition: background 0.12s, color 0.12s;
            user-select: none;
            white-space: nowrap;
            text-align: center;
        }
        .seg-group .seg:last-child { border-right: none; }
        .seg-group .seg:hover { background: #eee; }
        .seg-group input[type="radio"] { display: none; }
        .seg-group input[type="radio"]:checked + .seg {
            background: #5aad5a;
            color: #fff;
        }

        /* 鎿嶄綔鎸夐挳缁勶紙鍏ㄩ€夈€佸彇娑堛€佸弽閫夈€佸鍑猴級 */
        .action-group {
            display: inline-flex;
            border: 1px solid #bbb;
            border-radius: 5px;
            overflow: hidden;
        }
        .action-group .act-btn {
            padding: 4px 14px;
            border: none;
            border-right: 1px solid #bbb;
            background: #f8f8f8;
            cursor: pointer;
            font-size: 12px;
            line-height: 1.5;
            transition: background 0.12s;
            color: #333;
            font-family: inherit;
        }
        .action-group .act-btn:last-child { border-right: none; }
        .action-group .act-btn:hover { background: #eee; }
        .action-group .act-btn:active { background: #ddd; }

        #tags-exporter-container {
            display: flex;
            align-items: center;
            flex-wrap: wrap;
            gap: 8px;
            margin: 5px 0;
            justify-content: flex-start;
        }

        /* 鎼滅储妗?*/
        #tag-filter {
            box-sizing: border-box;
            width: 100%;
            padding: 4px 10px;
            border: 1px solid #ccc;
            border-radius: 5px;
            font-size: 12px;
            margin: 4px 0;
            outline: none;
        }
        #tag-filter:focus { border-color: #888; }

        /* 鎶樺彔鎸囩ず鍣?*/
        .ci {
            display: inline-block;
            width: 14px;
            font-size: 10px;
            color: #aaa;
            cursor: pointer;
            user-select: none;
        }
        h3.artist-tag-list, h3.character-tag-list,
        h3.copyright-tag-list, h3.meta-tag-list, h3.general-tag-list {
            cursor: pointer;
            user-select: none;
        }

        /* 鏉冮噸鎺т欢 */
        .tag-weight {
            display: inline-flex;
            align-items: center;
            gap: 2px;
            margin: 0 3px;
        }
        .tag-weight .w-btn {
            width: 16px; height: 16px; padding: 0;
            font-size: 11px; font-weight: bold; line-height: 1;
            cursor: pointer; border: 1px solid #bbb; border-radius: 3px;
            background: #f5f5f5; color: #333; user-select: none;
            display: inline-flex; align-items: center; justify-content: center;
            transition: background 0.12s;
        }
        .tag-weight .w-btn:hover { background: #ddd; }
        .tag-weight .w-btn:active { background: #ccc; }
        .tag-weight .w-val {
            display: inline-block; min-width: 18px; text-align: center;
            font-size: 11px; font-weight: 600; font-family: monospace;
            color: #555;
        }

        .tag-count {
            font-size: 12px; color: #999; cursor: default;
        }
        #tag-summary {
            font-size: 11px; color: #aaa; margin-top: 2px;
        }

        /* 棰勮锛堝琛岋級 */
        #export-preview {
            font-size: 10px;
            color: #999;
            line-height: 1.4;
            margin: 2px 0;
            word-break: break-all;
        }

        #weight-format-group .opt-row { margin: 2px 0; }

        /* 鎼滅储楂樹寒 */
        .phl {
            background: #ffc107;
            color: #333;
            border-radius: 2px;
            padding: 0 2px;
        }
        @media (prefers-color-scheme: dark) {
            .phl { color: #222; }
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

        /* 鏆楄壊 */
        @media (prefers-color-scheme: dark) {
            #tags-exporter-setting {
                background: rgba(255,255,255,0.04);
                border-color: rgba(255,255,255,0.08);
            }
            #tags-exporter-container button, #tag-list button { background: #3a3a3a; border-color: #555; color: #ddd; }
            #tag-filter { background: #333; border-color: #555; color: #ddd; }
            #tag-filter:focus { border-color: #888; }
            #tag-filter::placeholder { color: #777; }
            .tag-weight .w-btn { background: #444; border-color: #666; color: #eee; }
            .tag-weight .w-btn:hover { background: #555; }
            .tag-weight .w-val { color: #ccc; }
            .tag-count { color: #999; }
            #tag-summary { color: #888; }
            .ci { color: #777; }
            #export-preview { color: #888; }
            .seg-group { border-color: #555; }
            .seg-group .seg { background: #3a3a3a; color: #bbb; border-color: #555; }
            .seg-group .seg:hover { background: #4a4a4a; }
            .seg-group input[type="radio"]:checked + .seg { background: #5aad5a; color: #fff; }
            .action-group { border-color: #555; }
            .action-group .act-btn { background: #3a3a3a; color: #ddd; border-color: #555; }
            .action-group .act-btn:hover { background: #4a4a4a; }
        }

        /* Gelbooru 瑕嗗啓 */
        body:not(.default-css) #tags-exporter-setting h2 { font-size: 1.2em; }
        body:not(.default-css) #tags-exporter-setting { margin: 0 10px; }
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
    //  璁剧疆闈㈡澘
    // ============================================================
    var panel = document.createElement('section');
    panel.id = 'tags-exporter-setting';
    panel.innerHTML = [
        '<h2>Danbooru 鏍囩澶嶅埗鍣?<span class="hint">蹇嵎澶嶅埗:Ctrl+Shift+E</span></h2>',
        '<div class="opt-row">',
        '  <label><input type="checkbox" id="bracket-escape" checked/> 杞箟鎷彿</label>',
        '  <label><input type="checkbox" id="export-metadata" checked/> 鍏冩暟鎹?/label>',
        '  <label><input type="checkbox" id="set-weight"/> 鏉冮噸</label>',
        '  <label><input type="checkbox" id="silent-export"/> 鍏抽棴閫氱煡</label>',
        '</div>',
        '<div id="weight-format-group" style="display:none">',
        '  <div class="opt-row">',
        '    <span>鏍煎紡:</span>',
        '    <span class="seg-group">',
        '      <label><input type="radio" name="wf" value="sd" checked/><span class="seg">SD</span></label>',
        '      <label><input type="radio" name="wf" value="nai"/><span class="seg">NAI</span></label>',
        '    </span>',
        '  </div>',
        '  <div class="opt-row">',
        '    <span>姝ヨ繘:</span>',
        '    <span class="seg-group">',
        '      <label><input type="radio" name="wstep" value="0.1"/><span class="seg">0.1</span></label>',
        '      <label><input type="radio" name="wstep" value="0.5" checked/><span class="seg">0.5</span></label>',
        '      <label><input type="radio" name="wstep" value="1"/><span class="seg">1</span></label>',
        '    </span>',
        '  </div>',
        '</div>',
        '<input type="text" id="tag-filter" placeholder="绛涢€夋爣绛?.." />',
        '<div id="export-preview"></div>',
        '<div id="tag-summary"></div>'
    ].join('');

    // ============================================================
    //  鎸夐挳妯℃澘
    // ============================================================
    var btnTpl = document.createElement('div');
    btnTpl.id = 'tags-exporter-container';
    btnTpl.innerHTML = [
        '<span class="action-group">',
        '  <button name="select_all" class="act-btn">鍏ㄩ€?/button>',
        '  <button name="select_none" class="act-btn">鍙栨秷</button>',
        '  <button name="invert_select" class="act-btn">鍙嶉€?/button>',
        '  <button name="export" class="act-btn">澶嶅埗</button>',
        '</span>',
        '<span class="tag-count"></span>'
    ].join('');

    // ============================================================
    //  DOM 宸ュ叿
    // ============================================================
    function insertAfter(n, ref) {
        ref.parentNode.insertBefore(n, ref.nextSibling);
    }

    var isGel = location.host === 'gelbooru.com';

    // ============================================================
    //  鎻掑叆闈㈡澘
    // ============================================================
    if (isGel) {
        var ref = document.querySelector('.aside>.tag-list');
        if (ref) {
            ref.parentNode.insertBefore(panel, ref);
            ref.parentNode.insertBefore(btnTpl, ref);
        }
    } else {
        // 鎸変紭鍏堢骇鏌ユ壘鎻掑叆鐐癸細#tag-list 鈫?#search-box 鈫?绗竴涓爣绛惧垎绫绘爣棰?        var ref = document.querySelector('#tag-list')
               || document.querySelector('#search-box')
               || document.querySelector('h3.artist-tag-list, h3.general-tag-list');
        if (ref) {
            ref.parentNode.insertBefore(panel, ref);
            var h2 = panel.querySelector('h2');
            if (h2) insertAfter(btnTpl, h2);
        }
    }

    // ============================================================
    //  鏉冮噸
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
        var nv = Math.round((cur + delta * step) * 100) / 100;
        if (fmt === 'sd') { if (nv > 3) return 3; if (nv < 0) return 0; return nv; }
        if (nv > 5) return 5; if (nv < -5) return -5; return nv;
    }

    // ============================================================
    //  瀵煎嚭
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
        var fmt = (document.querySelector('input[name="wf"]:checked') || {}).value || 'sd';
        var step = parseFloat((document.querySelector('input[name="wstep"]:checked') || {}).value || '0.5');

        var out = [], seen = new Set();

        document.querySelectorAll(target).forEach(function (cb) {
            var li = cb.closest('li');
            if (li && li.closest('.meta-tag-list, .tag-type-metadata') && !meta) return;

            var tag = cb.value;
            var key = tag.toLowerCase().trim();
            if (seen.has(key)) return;
            seen.add(key);

            tag = tag.replaceAll('_', ' ');
            if (esc) tag = tag.replaceAll('(', '\\(').replaceAll(')', '\\)');
            if (wOn && li) {
                var wc = li.querySelector('.tag-weight');
                if (wc) {
                    var v = parseFloat(wc.querySelector('.w-val').textContent) || 0;
                    tag = fmtWeight(tag, v, fmt);
                }
            }
            out.push(tag);
        });

        if (!out.length) {
            if (silent) showToast('娌℃湁閫変腑浠讳綍鏍囩锛?);
            else GM.notification('娌℃湁閫変腑浠讳綍鏍囩锛?, 'Danbooru 鏍囩瀵煎嚭鍣?);
            return;
        }

        GM.setClipboard(out.join(', '));
        var msg = '宸插鍒?' + out.length + ' 涓爣绛惧埌鍓创鏉匡紒';
        if (silent) showToast(msg);
        else GM.notification(msg, 'Danbooru 鏍囩瀵煎嚭鍣?);
    }

    // ============================================================
    //  璁剧疆鎸佷箙鍖?    // ============================================================
    var SKEY = 'dte_settings_v3';

    function save() {
        GM_setValue(SKEY, {
            be: document.getElementById('bracket-escape').checked,
            em: document.getElementById('export-metadata').checked,
            sw: document.getElementById('set-weight').checked,
            wf: (document.querySelector('input[name="wf"]:checked') || {}).value || 'sd',
            ws: (document.querySelector('input[name="wstep"]:checked') || {}).value || '0.5',
            se: document.getElementById('silent-export').checked
        });
    }

    function load() {
        var s = GM_getValue(SKEY, null);
        if (!s) return;
        var el;
        el = document.getElementById('bracket-escape');   if (el && s.be !== undefined) el.checked = s.be;
        el = document.getElementById('export-metadata'); if (el && s.em !== undefined) el.checked = s.em;
        el = document.getElementById('silent-export');   if (el && s.se !== undefined) el.checked = s.se;
        el = document.getElementById('set-weight');      if (el && s.sw !== undefined) { el.checked = s.sw; fire(el, 'change'); }
        if (s.wf) { var r = document.querySelector('input[name="wf"][value="' + s.wf + '"]'); if (r) { r.checked = true; fire(r, 'change'); } }
        if (s.ws) { var r = document.querySelector('input[name="wstep"][value="' + s.ws + '"]'); if (r) r.checked = true; }
    }

    function fire(el, ev) {
        var e = document.createEvent('HTMLEvents');
        e.initEvent(ev, false, true); el.dispatchEvent(e);
    }

    document.addEventListener('change', function (e) {
        if (/^(bracket-escape|export-metadata|set-weight|silent-export)$/.test(e.target.id) ||
            e.target.name === 'wf' || e.target.name === 'wstep') save();
    });

    // ============================================================
    //  璁℃暟 / 棰勮 / 鎻愮ず
    // ============================================================
    var previewDebounce = null;

    function updPreviewAndTooltip() {
        var names = [];
        document.querySelectorAll('#tag-list input[type="checkbox"]:checked, .tag-list input[type="checkbox"]:checked')
            .forEach(function (cb) { names.push(cb.value.replaceAll('_', ' ')); });

        var preEl = document.getElementById('export-preview');
        if (preEl) {
            var text = names.length ? names.join(', ') : '';
            var q = (document.getElementById('tag-filter').value || '').trim();
            if (q) {
                var esc = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                var re = new RegExp('(' + esc + ')', 'gi');
                preEl.innerHTML = text.replace(re, '<span class="phl">$1</span>');
            } else {
                preEl.textContent = text;
            }
        }

        var tip = names.length ? names.join(', ') : '';
        document.querySelectorAll('.tag-count').forEach(function (el) { el.title = tip; });
    }

    function updCount(ctx) {
        if (!ctx) ctx = document;
        var c = ctx.querySelectorAll('input[type="checkbox"][name$="s"]:checked').length;
        var t = ctx.querySelectorAll('input[type="checkbox"][name$="s"]').length;
        var el = ctx.querySelector('.tag-count');
        if (el) el.textContent = c > 0 ? (c + '/' + t) : '';

        if (previewDebounce) clearTimeout(previewDebounce);
        previewDebounce = setTimeout(updPreviewAndTooltip, 50);
    }

    function summary() {
        var t = document.querySelectorAll('#tag-list input[type="checkbox"], .tag-list input[type="checkbox"]').length;
        var el = document.getElementById('tag-summary');
        if (el) el.textContent = '鍏?' + t + ' 涓爣绛?;
    }

    // ============================================================
    //  鏉冮噸鎺т欢
    // ============================================================
    function mkWeight() {
        var c = document.createElement('span');
        c.className = 'tag-weight';
        c.style.display = 'none';
        c.innerHTML = '<button class="w-btn wm" type="button">鈭?/button><span class="w-val">0</span><button class="w-btn wp" type="button">+</button>';
        return c;
    }

    // ============================================================
    //  鍒嗙被鎸夐挳缁戝畾
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
    //  鍒嗙被鎶樺彔锛堜粎 Danbooru锛?    // ============================================================
    function initCollapse() {
        if (isGel) return;
        document.querySelectorAll('h3.artist-tag-list, h3.character-tag-list, h3.copyright-tag-list, h3.meta-tag-list, h3.general-tag-list')
            .forEach(function (h3) {
                var ind = document.createElement('span');
                ind.className = 'ci';
                ind.textContent = '鈻?;
                h3.insertBefore(ind, h3.firstChild);

                h3.addEventListener('click', function () {
                    var collapsed = h3.classList.toggle('collapsed');
                    var next = h3.nextElementSibling;
                    if (next) {
                        next.style.display = collapsed ? 'none' : '';
                        var ul = next.nextElementSibling;
                        if (ul && ul.tagName === 'UL') ul.style.display = collapsed ? 'none' : '';
                    }
                    ind.textContent = collapsed ? '鈻? : '鈻?;
                });
            });
    }

    // ============================================================
    //  鏍囩鎼滅储杩囨护
    // ============================================================
    function initTagFilter() {
        var input = document.getElementById('tag-filter');
        if (!input) return;
        input.addEventListener('input', function () {
            var q = this.value.toLowerCase().trim();
            document.querySelectorAll('#tag-list li, .tag-list li').forEach(function (li) {
                if (!q) { li.style.display = ''; return; }
                var cb = li.querySelector('input[type="checkbox"]');
                var name = cb ? cb.value.toLowerCase() : '';
                li.style.display = name.indexOf(q) > -1 ? '' : 'none';
            });
            if (previewDebounce) clearTimeout(previewDebounce);
            previewDebounce = setTimeout(updPreviewAndTooltip, 50);
        });
    }

    // ============================================================
    //  蹇嵎閿?Ctrl+Shift+E
    // ============================================================
    document.addEventListener('keydown', function (e) {
        if (e.ctrlKey && e.shiftKey && (e.key === 'e' || e.key === 'E')) {
            e.preventDefault();
            doExport('#tag-list input[type="checkbox"]:checked, .tag-list input[type="checkbox"]:checked');
        }
    });

    // ============================================================
    //  鎻掑叆 Danbooru 鍒嗙被
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
    //  鎻掑叆 Gelbooru 鍒嗙被
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
    //  鎸傝浇
    // ============================================================
    ['artist-tag', 'character-tag', 'copyright-tag', 'meta-tag', 'general-tag'].forEach(insDan);
    ['tag-type-artist', 'tag-type-character', 'tag-type-copyright', 'tag-type-metadata', 'tag-type-general'].forEach(insGel);

    // ============================================================
    //  鍏ㄥ眬鎸夐挳
    // ============================================================
    (function () {
        var g = btnTpl.querySelector("[name='select_all']");
        if (g) g.onclick = function () {
            document.querySelectorAll('#tag-list input[type="checkbox"], .tag-list input[type="checkbox"]').forEach(function (b) { b.checked = true; });
            updCount();
        };
    })();
    (function () {
        var g = btnTpl.querySelector("[name='select_none']");
        if (g) g.onclick = function () {
            document.querySelectorAll('#tag-list input[type="checkbox"], .tag-list input[type="checkbox"]').forEach(function (b) { b.checked = false; });
            updCount();
        };
    })();
    (function () {
        var g = btnTpl.querySelector("[name='invert_select']");
        if (g) g.onclick = function () {
            document.querySelectorAll('#tag-list input[type="checkbox"], .tag-list input[type="checkbox"]').forEach(function (b) { b.checked = !b.checked; });
            updCount();
        };
    })();
    (function () {
        var g = btnTpl.querySelector("[name='export']");
        if (g) g.onclick = function () {
            doExport('#tag-list input[type="checkbox"]:checked, .tag-list input[type="checkbox"]:checked');
        };
    })();

    document.addEventListener('change', function (e) {
        if (e.target.type === 'checkbox' && e.target.name && e.target.name.endsWith('s')) {
            updCount(e.target.closest('[id$="-buttons"]') || btnTpl);
        }
    });
    updCount();

    // ============================================================
    //  鍒濆鍖?    // ============================================================
    summary();
    initCollapse();
    initTagFilter();

    // ============================================================
    //  浜嬩欢缁戝畾
    // ============================================================
    document.getElementById('set-weight').onchange = function (e) {
        var v = e.target.checked;
        document.querySelectorAll('.tag-weight').forEach(function (el) { el.style.display = v ? '' : 'none'; });
        document.getElementById('weight-format-group').style.display = v ? 'block' : 'none';
    };

    document.getElementById('export-metadata').onchange = function (e) {
        var v = e.target.checked;
        document.querySelectorAll('.meta-tag-list, .tag-type-metadata').forEach(function (el) {
            el.style.display = v ? '' : 'none';
        });
        document.querySelectorAll('[id$="-buttons"]').forEach(function (el) {
            if (/meta/i.test(el.id)) el.style.display = v ? '' : 'none';
        });
    };

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

    load();

})();
