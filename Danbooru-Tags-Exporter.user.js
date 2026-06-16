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
// @version      0.5.0
// @description  Select tags and copy to clipboard. Supports category filtering, +/- weight control, SD / NAI format, silent mode, auto update.
// @description:zh-CN  选择标签并复制到剪贴板，支持分类提取、加减权重、SD/NAI 格式、静默模式、自动更新
// @description:zh-TW  選擇標籤並複製到剪貼板，支援分類提取、加減權重、SD/NAI 格式、靜默模式、自動更新
// @description:zh-HK  選擇標籤並複製到剪貼板，支援分類提取、加減權重、SD/NAI 格式、靜默模式、自動更新
// @description:ja  指定したタグを選択し、クリップボードにコピー
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

    // 防止重复注入（Danbooru 的 PJAX 导航可能导致脚本多次执行）
    if (document.getElementById('tags-exporter-setting')) return;

    // ============================================================
    //  样式
    // ============================================================
    var commonStyle = `
        #tags-exporter-setting {
            background: rgba(0,0,0,0.03);
            border: 1px solid rgba(0,0,0,0.08);
            border-radius: 8px;
            padding: 10px 14px;
            margin: 8px 0;
        }
        #tags-exporter-setting h2 {
            margin: 0 0 8px 0;
            font-size: 1.1em;
        }
        #tags-exporter-setting label { margin: .25em; line-height: 1.6em; }

        #tags-exporter-container {
            margin: 6px 0;
            display: flex;
            align-items: center;
            flex-wrap: wrap;
            gap: 4px;
        }
        #tags-exporter-container button, #tag-list button {
            padding: 0.25em 0.75em;
            border: 1px solid #bbb;
            border-radius: 4px;
            background: #f8f8f8;
            cursor: pointer;
            font-size: 13px;
            transition: background 0.15s;
        }
        #tags-exporter-container button:hover, #tag-list button:hover {
            background: #eee;
        }
        #tags-exporter-container button:active, #tag-list button:active {
            background: #ddd;
        }

        .tag-weight {
            display: inline-flex;
            align-items: center;
            gap: 2px;
            margin: 0 4px;
        }
        .tag-weight .w-btn {
            width: 22px;
            height: 22px;
            padding: 0;
            font-size: 15px;
            font-weight: bold;
            line-height: 1;
            cursor: pointer;
            border: 1px solid #bbb;
            border-radius: 3px;
            background: #f5f5f5;
            color: #333;
            user-select: none;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            transition: background 0.15s;
        }
        .tag-weight .w-btn:hover { background: #ddd; }
        .tag-weight .w-btn:active { background: #ccc; }
        .tag-weight .w-val {
            display: inline-block;
            min-width: 24px;
            text-align: center;
            font-size: 13px;
            font-weight: bold;
            font-family: monospace;
            color: #555;
        }

        .tag-count {
            font-size: 0.85em;
            color: #888;
            margin-left: 8px;
        }
        #tag-summary {
            font-size: 0.85em;
            color: #999;
            margin-top: 4px;
        }

        #weight-format-group {
            margin: 4px 0 4px 1.5em;
        }
        #weight-format-group label {
            display: block;
            font-size: 13px;
        }

        /* 静默导出 Toast */
        #exporter-toast {
            position: fixed;
            bottom: 24px;
            right: 24px;
            background: #333;
            color: #fff;
            padding: 10px 18px;
            border-radius: 8px;
            font-size: 14px;
            z-index: 99999;
            opacity: 0;
            transition: opacity 0.3s ease;
            box-shadow: 0 2px 12px rgba(0,0,0,0.2);
            pointer-events: none;
        }
        #exporter-toast.show { opacity: 0.95; }

        /* 暗色模式 */
        @media (prefers-color-scheme: dark) {
            #tags-exporter-setting {
                background: rgba(255,255,255,0.05);
                border-color: rgba(255,255,255,0.1);
            }
            #tags-exporter-container button, #tag-list button {
                background: #3a3a3a;
                border-color: #555;
                color: #ddd;
            }
            #tags-exporter-container button:hover, #tag-list button:hover {
                background: #4a4a4a;
            }
            #tags-exporter-container button:active, #tag-list button:active {
                background: #555;
            }
            .tag-weight .w-btn {
                background: #444;
                border-color: #666;
                color: #eee;
            }
            .tag-weight .w-btn:hover { background: #555; }
            .tag-weight .w-btn:active { background: #333; }
            .tag-weight .w-val { color: #ccc; }
            .tag-count { color: #aaa; }
            #tag-summary { color: #888; }
        }
    `;

    // Gelbooru 覆写样式
    var gelStyle = `
        #tags-exporter-setting h2 { font-size: 1.2em; }
        #tags-exporter-setting { margin: 0px 10px 0px 10px; }
        #tags-exporter-container button, #tag-list button { padding: 0.1em 0.3em; margin-bottom: 0.1em; }
        #tags-exporter-container { margin: 0px 10px 0px 10px; }
        ul.tag-list li { margin: 2px 0; }
    `;

    if (location.host === "gelbooru.com") {
        GM_addStyle(gelStyle + commonStyle);
    } else {
        GM_addStyle(commonStyle);
    }

    // ============================================================
    //  Toast 提示（静默模式使用）
    // ============================================================
    function showToast(message) {
        var existing = document.getElementById('exporter-toast');
        if (existing) existing.remove();

        var toast = document.createElement('div');
        toast.id = 'exporter-toast';
        toast.textContent = message;
        document.body.appendChild(toast);

        // 触发 CSS 过渡动画
        requestAnimationFrame(function () {
            toast.classList.add('show');
        });

        setTimeout(function () {
            toast.classList.remove('show');
            setTimeout(function () { toast.remove(); }, 300);
        }, 2000);
    }

    // ============================================================
    //  设置面板
    // ============================================================
    var SettingPanel = document.createElement('section');
    SettingPanel.id = "tags-exporter-setting";
    SettingPanel.innerHTML = [
        '<h2>🎨 标签导出设置</h2>',
        '<input type="checkbox" id="bracket-escape" checked/>',
        '<label for="bracket-escape">转义括号 ( ) → \\\\( \\\\)（SD WebUI 兼容）</label><br>',
        '<input type="checkbox" id="export-metadata" checked/>',
        '<label for="export-metadata">包含元数据标签（rating、分辨率等）</label><br>',
        '<input type="checkbox" id="set-weight"/>',
        '<label for="set-weight">启用权重设置（<code>−</code> <code>+</code> 调整，步进 0.5）</label><br>',
        '<div id="weight-format-group" style="display:none;">',
        '  <label style="font-weight:bold;">权重格式：</label>',
        '  <label><input type="radio" name="weight-format" value="sd" checked/>',
        '  <code>(tag:1.5)</code> 数字格式 — SD WebUI（0~3，不支持负值）</label>',
        '  <label><input type="radio" name="weight-format" value="nai"/>',
        '  <code>1.5::tag::</code> 冒号格式 — NAI（-5~5，前后都有 <code>::</code>）</label>',
        '</div>',
        '<input type="checkbox" id="silent-export"/>',
        '<label for="silent-export">静默模式（不弹窗口通知，只显示页面角落提示）</label><br>',
        '<div id="tag-summary"></div>'
    ].join('\n');

    // ============================================================
    //  操作按钮模板（会被克隆到每个分类区域）
    // ============================================================
    var Container = document.createElement('div');
    Container.id = "tags-exporter-container";
    Container.innerHTML = [
        '<button name="select_all">✅ 全选</button>',
        '<button name="select_none">❌ 取消</button>',
        '<button name="invert_select">🔄 反选</button>',
        '<button name="export">📋 导出</button>',
        '<span class="tag-count"></span>'
    ].join('');

    // ============================================================
    //  DOM 工具
    // ============================================================
    function insertAfter(newNode, referenceNode) {
        referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
    }

    function insertBefore(newNode, referenceNode) {
        referenceNode.parentNode.insertBefore(newNode, referenceNode);
    }

    // ============================================================
    //  插入面板到页面
    // ============================================================
    if (location.host === "gelbooru.com") {
        var ref = document.querySelector(".aside>.tag-list");
        if (ref) {
            insertBefore(SettingPanel, ref);
            insertBefore(Container, ref);
        }
    } else {
        var searchBox = document.querySelector("#search-box");
        if (searchBox) {
            insertAfter(SettingPanel, searchBox);
            var h2 = document.querySelector("#tags-exporter-setting > h2");
            if (h2) {
                // Container 插入到 h2 后面
                h2.parentNode.insertBefore(Container, h2.nextSibling);
            }
        }
    }

    // ============================================================
    //  权重格式化
    // ============================================================
    function formatTagWithWeight(tag, weightVal, formatType) {
        if (weightVal === 0) return tag;

        var val = weightVal.toFixed(1);

        if (formatType === 'sd') {
            return "(" + tag + ":" + val + ")";
        } else if (formatType === 'nai') {
            // NAI 格式 1.5::tag::
            // 如果标签末尾是数字，在结尾 :: 前加空格，避免被误认为权重数字
            var closing = /[0-9]$/.test(tag) ? " ::" : "::";
            return val + "::" + tag + closing;
        }
        return tag;
    }

    // ============================================================
    //  权重加减逻辑（SD / NAI 不同范围）
    // ============================================================
    function adjustWeightValue(current, delta, format) {
        if (format === 'sd') {
            // SD: 0~3，跳过 0.5，1.0 起步
            if (current === 0 && delta < 0) return 0;
            var nv = current + delta * 0.5;
            if (nv <= 0) return 0;
            if (nv >= 3) return 3;
            if (nv < 1.0 && nv > 0) {
                return delta > 0 ? 1.0 : 0;
            }
            return Math.round(nv * 10) / 10;
        } else {
            // NAI: -5~5，步进 0.5
            var nv = current + delta * 0.5;
            nv = Math.round(nv * 10) / 10;
            if (nv > 5) return 5;
            if (nv < -5) return -5;
            return nv;
        }
    }

    // ============================================================
    //  导出标签（带防抖、去重、静默模式）
    // ============================================================
    var exportLock = false;

    function exportTags(target) {
        // 防抖：500ms 内禁止重复导出
        if (exportLock) return;
        exportLock = true;
        setTimeout(function () { exportLock = false; }, 500);

        var tags = [];
        var seenTags = new Set();

        var bracketEscape = document.getElementById("bracket-escape").checked;
        var weightOn = document.getElementById("set-weight").checked;
        var exportMeta = document.getElementById("export-metadata").checked;
        var silentMode = document.getElementById("silent-export").checked;
        var fmtEl = document.querySelector('input[name="weight-format"]:checked');
        var fmt = fmtEl ? fmtEl.value : 'sd';

        document.querySelectorAll(target).forEach(function (e) {
            // 元数据过滤
            var li = e.closest('li');
            if (li) {
                var isMeta = li.closest('.metadata-tag-list, .tag-type-metadata');
                if (isMeta && !exportMeta) return;
            }

            var tagText = e.value;

            // 去重（基于原始标签名，忽略大小写）
            var tagKey = tagText.toLowerCase().trim();
            if (seenTags.has(tagKey)) return;
            seenTags.add(tagKey);

            // 下划线统一替换为空格
            tagText = tagText.replaceAll("_", " ");

            // 转义括号（转义标签本身自带的括号，不影响权重格式）
            if (bracketEscape) {
                tagText = tagText.replaceAll('(', '\\(').replaceAll(')', '\\)');
            }

            // 权重
            if (weightOn) {
                var li2 = e.closest('li');
                var wc = li2 ? li2.querySelector('.tag-weight') : null;
                if (wc) {
                    var valSpan = wc.querySelector('.w-val');
                    var val = parseFloat(valSpan.textContent) || 0;
                    tagText = formatTagWithWeight(tagText, val, fmt);
                }
            }

            tags.push(tagText);
        });

        if (tags.length === 0) {
            if (silentMode) {
                showToast("没有选中任何标签！");
            } else {
                GM.notification("没有选中任何标签！", "Danbooru 标签导出器");
            }
            return;
        }

        // 英文逗号 + 空格分隔（确保全英文符号）
        var res = tags.join(", ");
        GM.setClipboard(res);

        var msg = "已复制 " + tags.length + " 个标签到剪贴板！";
        if (silentMode) {
            showToast(msg);
        } else {
            GM.notification(msg, "Danbooru 标签导出器");
        }
    }

    // ============================================================
    //  设置持久化
    // ============================================================
    var SETTINGS_KEY = 'dte_settings_v2';

    function saveSettings() {
        var fmtEl = document.querySelector('input[name="weight-format"]:checked');
        GM_setValue(SETTINGS_KEY, {
            bracketEscape: document.getElementById('bracket-escape').checked,
            exportMeta: document.getElementById('export-metadata').checked,
            setWeight: document.getElementById('set-weight').checked,
            weightFormat: fmtEl ? fmtEl.value : 'sd',
            silentExport: document.getElementById('silent-export').checked
        });
    }

    function loadSettings() {
        var saved = GM_getValue(SETTINGS_KEY, null);
        if (!saved) return;

        var el;
        el = document.getElementById('bracket-escape');
        if (el && saved.bracketEscape !== undefined) el.checked = saved.bracketEscape;

        el = document.getElementById('export-metadata');
        if (el && saved.exportMeta !== undefined) el.checked = saved.exportMeta;

        el = document.getElementById('set-weight');
        if (el && saved.setWeight !== undefined) {
            el.checked = saved.setWeight;
            // 触发 onchange 显示/隐藏权重控件
            var evt = document.createEvent('HTMLEvents');
            evt.initEvent('change', false, true);
            el.dispatchEvent(evt);
        }

        el = document.getElementById('silent-export');
        if (el && saved.silentExport !== undefined) el.checked = saved.silentExport;

        if (saved.weightFormat) {
            var radio = document.querySelector('input[name="weight-format"][value="' + saved.weightFormat + '"]');
            if (radio) {
                radio.checked = true;
                // 触发格式切换逻辑
                var evt2 = document.createEvent('HTMLEvents');
                evt2.initEvent('change', false, true);
                radio.dispatchEvent(evt2);
            }
        }
    }

    // 所有设置控件的统一保存监听
    document.addEventListener('change', function (e) {
        if (e.target.id === 'bracket-escape' ||
            e.target.id === 'export-metadata' ||
            e.target.id === 'set-weight' ||
            e.target.id === 'silent-export' ||
            e.target.name === 'weight-format') {
            saveSettings();
        }
    });

    // ============================================================
    //  计数更新
    // ============================================================
    function updateCount(container) {
        if (!container) container = document;
        var checked = container.querySelectorAll('input[type="checkbox"][name$="s"]:checked').length;
        var total = container.querySelectorAll('input[type="checkbox"][name$="s"]').length;
        var counter = container.querySelector('.tag-count');
        if (counter) {
            counter.textContent = checked > 0 ? ("已选 " + checked + "/" + total) : "";
        }
    }

    // ============================================================
    //  总标签数统计
    // ============================================================
    function updateTagSummary() {
        var total = document.querySelectorAll('#tag-list input[type="checkbox"], .tag-list input[type="checkbox"]').length;
        var el = document.getElementById('tag-summary');
        if (el) {
            el.textContent = "共 " + total + " 个标签";
        }
    }

    // ============================================================
    //  创建权重 ± 控件
    // ============================================================
    function createWeightControl() {
        var ctrl = document.createElement('span');
        ctrl.className = 'tag-weight';
        ctrl.style.display = 'none';
        ctrl.innerHTML =
            '<button class="w-btn w-minus" type="button">−</button>' +
            '<span class="w-val">0</span>' +
            '<button class="w-btn w-plus" type="button">+</button>';
        return ctrl;
    }

    // ============================================================
    //  分类按钮事件绑定
    // ============================================================
    function bindCategoryButtons(buttonContainer, namePrefix) {
        buttonContainer.querySelector("[name='select_all']").onclick = function () {
            document.querySelectorAll('[name="' + namePrefix + '"]').forEach(function (cb) { cb.checked = true; });
            updateCount(buttonContainer);
        };
        buttonContainer.querySelector("[name='select_none']").onclick = function () {
            document.querySelectorAll('[name="' + namePrefix + '"]').forEach(function (cb) { cb.checked = false; });
            updateCount(buttonContainer);
        };
        buttonContainer.querySelector("[name='invert_select']").onclick = function () {
            document.querySelectorAll('[name="' + namePrefix + '"]').forEach(function (cb) { cb.checked = !cb.checked; });
            updateCount(buttonContainer);
        };
        buttonContainer.querySelector("[name='export']").onclick = function () {
            exportTags('[name="' + namePrefix + '"]:checked');
        };
    }

    // ============================================================
    //  插入 Danbooru 分类标签
    // ============================================================
    function insertDanbooruCategory(target) {
        var head = document.querySelector("h3." + target + "-list");
        if (!head) return;

        var namePrefix = target + "s";
        var buttonContainer = Container.cloneNode(true);
        buttonContainer.id = target + "-buttons";
        insertAfter(buttonContainer, head);

        document.querySelectorAll("." + target + "-list > li").forEach(function (e) {
            if (!e.dataset.tagName) return;

            var chk = document.createElement('input');
            chk.type = "checkbox";
            chk.name = namePrefix;
            chk.value = e.dataset.tagName.replaceAll("_", " ");
            e.insertBefore(chk, e.firstChild);

            var wc = createWeightControl();
            insertAfter(wc, chk);
        });

        bindCategoryButtons(buttonContainer, namePrefix);

        buttonContainer.querySelectorAll('[name="' + namePrefix + '"]').forEach(function (cb) {
            cb.addEventListener('change', function () { updateCount(buttonContainer); });
        });

        updateCount(buttonContainer);
    }

    // ============================================================
    //  插入 Gelbooru 分类标签
    // ============================================================
    function insertGelbooruCategory(target) {
        var el = document.querySelector("." + target);
        if (!el) return;
        var ref = el.previousSibling;

        var namePrefix = target + "s";
        var buttonContainer = Container.cloneNode(true);
        buttonContainer.id = target + "-buttons";
        insertAfter(buttonContainer, ref);

        document.querySelectorAll("." + target).forEach(function (e) {
            var a = e.querySelector(':scope > a');
            if (!a) return;

            var chk = document.createElement('input');
            chk.type = "checkbox";
            chk.name = namePrefix;
            chk.value = a.textContent.replaceAll("_", " ");
            e.insertBefore(chk, e.firstChild);

            var wc = createWeightControl();
            insertAfter(wc, chk);
        });

        bindCategoryButtons(buttonContainer, namePrefix);

        buttonContainer.querySelectorAll('[name="' + namePrefix + '"]').forEach(function (cb) {
            cb.addEventListener('change', function () { updateCount(buttonContainer); });
        });

        updateCount(buttonContainer);
    }

    // ============================================================
    //  挂载所有标签分类
    // ============================================================
    ["artist-tag", "character-tag", "copyright-tag", "metadata-tag", "general-tag"].forEach(function (t) {
        insertDanbooruCategory(t);
    });
    ["tag-type-artist", "tag-type-character", "tag-type-copyright", "tag-type-metadata", "tag-type-general"].forEach(function (t) {
        insertGelbooruCategory(t);
    });

    // ============================================================
    //  全局按钮（页面顶部面板）
    // ============================================================
    Container.querySelector("[name='select_all']").onclick = function () {
        document.querySelectorAll("#tag-list input[type='checkbox'], .tag-list input[type='checkbox']").forEach(function (cb) { cb.checked = true; });
        updateCount();
    };
    Container.querySelector("[name='select_none']").onclick = function () {
        document.querySelectorAll("#tag-list input[type='checkbox'], .tag-list input[type='checkbox']").forEach(function (cb) { cb.checked = false; });
        updateCount();
    };
    Container.querySelector("[name='invert_select']").onclick = function () {
        document.querySelectorAll("#tag-list input[type='checkbox'], .tag-list input[type='checkbox']").forEach(function (cb) { cb.checked = !cb.checked; });
        updateCount();
    };
    Container.querySelector("[name='export']").onclick = function () {
        exportTags("#tag-list input[type='checkbox']:checked, .tag-list input[type='checkbox']:checked");
    };

    // ============================================================
    //  实时计数监听
    // ============================================================
    document.addEventListener('change', function (e) {
        if (e.target.type === 'checkbox' && e.target.name && e.target.name.endsWith('s')) {
            var container = e.target.closest('[id$="-buttons"]') || Container;
            updateCount(container);
        }
    });
    updateCount();

    // ============================================================
    //  总标签数统计（必须在所有分类挂载后执行）
    // ============================================================
    updateTagSummary();

    // ============================================================
    //  权重开关 → 显示/隐藏 ± 控件
    // ============================================================
    document.getElementById("set-weight").onchange = function (e) {
        var show = e.target.checked;
        document.querySelectorAll(".tag-weight").forEach(function (el) {
            el.style.display = show ? '' : 'none';
        });
        document.getElementById("weight-format-group").style.display = show ? 'block' : 'none';
    };

    // ============================================================
    //  元数据开关 → 显示/隐藏 metadata 区域
    // ============================================================
    document.getElementById("export-metadata").onchange = function (e) {
        var show = e.target.checked;
        document.querySelectorAll('.metadata-tag-list, .tag-type-metadata').forEach(function (el) {
            el.style.display = show ? '' : 'none';
        });
        document.querySelectorAll('[id$="metadata-buttons"]').forEach(function (el) {
            el.style.display = show ? '' : 'none';
        });
    };

    // ============================================================
    //  ± 按钮事件（全局事件委托）
    // ============================================================
    document.addEventListener('click', function (e) {
        var btn = e.target.closest('.w-btn');
        if (!btn) return;
        e.preventDefault();

        var ctrl = btn.closest('.tag-weight');
        if (!ctrl) return;

        var fmtEl = document.querySelector('input[name="weight-format"]:checked');
        var fmt = fmtEl ? fmtEl.value : 'sd';

        var valSpan = ctrl.querySelector('.w-val');
        var current = parseFloat(valSpan.textContent) || 0;
        var delta = btn.classList.contains('w-plus') ? 1 : -1;
        var newVal = adjustWeightValue(current, delta, fmt);
        valSpan.textContent = newVal.toFixed(1);
    });

    // ============================================================
    //  切换权重格式 → 自动修正已有值
    // ============================================================
    document.querySelectorAll('input[name="weight-format"]').forEach(function (radio) {
        radio.addEventListener('change', function () {
            var fmt = this.value;
            document.querySelectorAll('.w-val').forEach(function (span) {
                var cur = parseFloat(span.textContent) || 0;
                if (fmt === 'sd') {
                    if (cur < 0) span.textContent = '0.0';
                    else if (cur > 3) span.textContent = '3.0';
                    else if (cur > 0 && cur < 1.0) span.textContent = '1.0';
                }
            });
        });
    });

    // ============================================================
    //  读取已保存的设置（必须在事件绑定之后）
    // ============================================================
    loadSettings();

})();
