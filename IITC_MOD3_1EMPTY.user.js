// ==UserScript==
// @id             IITC_MOD3_1EMPTY
// @name           IITC - 3 Different MOD Owners + 1 Empty
// @category       Highlighter
// @version        1.2.0
// @description    3人の異なるエージェントがMODを1個ずつ装備し、4枠目が空いているポータルをハイライト
// @author         Custom
// @match          https://intel.ingress.com/*
// @grant          none
// ==/UserScript==

(function() {
    'use strict';

    function wrapper(plugin_info) {

        if (typeof window.plugin !== 'function') {
            window.plugin = function() {};
        }

        window.plugin.mod3OneEmpty = {};

        var plugin = window.plugin.mod3OneEmpty;

        /*
         * ============================================================
         * 判定
         * ============================================================
         *
         * 条件：
         *
         *  1. 詳細情報が取得済み
         *  2. MODスロットが4つ
         *  3. MODが3個
         *  4. 空きスロットが1個
         *  5. 3個のMOD所有者が全員異なる
         */

        plugin.isTarget = function(portal) {

            if (!portal || !portal.guid) {
                return false;
            }

            /*
             * IITCが取得済みの詳細情報だけを参照。
             *
             * ここでは request() を呼ばないので、
             * このプラグインから詳細情報を取得することはありません。
             */

            var details = null;

            if (window.IITC &&
                IITC.portal &&
                IITC.portal.details &&
                typeof IITC.portal.details.get === 'function') {

                details = IITC.portal.details.get(portal.guid);

            } else if (window.portalDetail &&
                       typeof window.portalDetail.get === 'function') {

                details = window.portalDetail.get(portal.guid);
            }

            /*
             * 詳細情報がまだ取得されていない
             */
            if (!details) {
                return false;
            }

            /*
             * MOD情報
             */
            var mods = details.mods;

            if (!Array.isArray(mods)) {
                return false;
            }

            /*
             * 今回確認していただいた実データは
             *
             * [
             *   null,
             *   { owner: "ahirnokomm", ... },
             *   { owner: "YKondoh", ... },
             *   { owner: "HiroshiSugawara", ... }
             * ]
             *
             * という4要素配列。
             */

            if (mods.length !== 4) {
                return false;
            }

            /*
             * MODが入っているものだけ取得
             */
            var installedMods = mods.filter(function(mod) {
                return mod !== null &&
                       typeof mod === 'object';
            });

            /*
             * 3個ちょうど
             */
            if (installedMods.length !== 3) {
                return false;
            }

            /*
             * MOD所有者
             */
            var owners = installedMods.map(function(mod) {

                if (!mod.owner) {
                    return null;
                }

                return String(mod.owner);

            });

            /*
             * 所有者情報が3個とも存在すること
             */
            if (owners.indexOf(null) !== -1) {
                return false;
            }

            /*
             * 3人全員が異なる
             */
            var uniqueOwners = new Set(owners);

            if (uniqueOwners.size !== 3) {
                return false;
            }

            return true;
        };


        /*
         * ============================================================
         * ハイライト関数
         * ============================================================
         *
         * IITCのHighlighterには
         *
         *     data.portal.options
         *
         * としてポータルオブジェクトが渡されます。
         */

        plugin.highlight = function(data) {

            if (!data || !data.portal) {
                return;
            }

            var portal = data.portal.options;

            if (!portal) {
                return;
            }

            if (plugin.isTarget(portal)) {

                /*
                 * 対象ポータルを黄色でハイライト
                 */
                data.portal.setStyle({
                    fillColor: '#FFD400',
                    fillOpacity: 0.9,
                    color: '#FF8800',
                    opacity: 1,
                    weight: 4
                });
            }
        };


        /*
         * ============================================================
         * IITCへ登録
         * ============================================================
         */

        var setup = function() {

            window.addPortalHighlighter(
                '3 Different MOD Owners + 1 Empty',
                plugin.highlight
            );

            console.log(
                '[IITC MOD3_1EMPTY] loaded'
            );
        };


        setup.info = plugin_info;

        if (!window.bootPlugins) {
            window.bootPlugins = [];
        }

        window.bootPlugins.push(setup);


        /*
         * IITCが既に起動している場合
         */
        if (window.iitcLoaded) {
            setup();
        }
    }


    /*
     * IITCのページコンテキストで実行
     */
    var script = document.createElement('script');

    var info = {};

    if (typeof GM_info !== 'undefined' &&
        GM_info &&
        GM_info.script) {

        info.script = {
            version: GM_info.script.version,
            name: GM_info.script.name,
            description: GM_info.script.description
        };
    }

    script.appendChild(
        document.createTextNode(
            '(' + wrapper + ')(' +
            JSON.stringify(info) +
            ');'
        )
    );

    (
        document.body ||
        document.head ||
        document.documentElement
    ).appendChild(script);

})();
