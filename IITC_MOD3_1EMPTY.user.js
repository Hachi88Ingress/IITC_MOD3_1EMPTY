// ==UserScript==
// @id             different-mod-owners-no-self
// @name           Different MOD Owners + Empty (No Self)
// @category       Highlighter
// @version        1.3.0
// @description    Highlights portals with 1-3 MODs owned by different agents, excluding your own MODs
// @match          https://intel.ingress.com/*
// @grant          none
// ==/UserScript==

(function() {
  'use strict';

  var setup = function() {
    var plugin = {};

    /*
     * ============================================================
     * MOD条件判定
     * ============================================================
     *
     * MOD 3個 / 空き1個 → 黄色
     * MOD 2個 / 空き2個 → オレンジ
     * MOD 1個 / 空き3個 → 紫
     *
     * 共通条件:
     * ・MOD所有者が全員異なる
     * ・自分のMODが含まれていない
     *
     * ※ポータル詳細の自動取得は行わない
     */


    plugin.getType = function(portal) {

      if (!portal || !portal.guid) {
        return null;
      }


      /*
       * IITCに既に保存されている
       * ポータル詳細情報を取得
       */
      var details = null;

      if (window.IITC &&
          IITC.portal &&
          IITC.portal.details &&
          typeof IITC.portal.details.get === 'function') {

        details = IITC.portal.details.get(portal.guid);

      } else if (window.portalDetail &&
                 typeof window.portalDetail.get === 'function') {

        // 旧IITC APIとの互換性
        details = window.portalDetail.get(portal.guid);
      }


      /*
       * 詳細情報がまだ取得されていない
       * ポータルは対象外
       */
      if (!details) {
        return null;
      }


      var mods = details.mods;


      /*
       * MODスロットは4つ必要
       */
      if (!Array.isArray(mods) || mods.length !== 4) {
        return null;
      }


      /*
       * 入っているMODだけ抽出
       */
      var installedMods = mods.filter(function(mod) {
        return mod !== null && typeof mod === 'object';
      });


      var modCount = installedMods.length;


      /*
       * MOD 1～3個だけ対象
       *
       * MOD 0個
       * MOD 4個
       * は対象外
       */
      if (modCount < 1 || modCount > 3) {
        return null;
      }


      /*
       * 自分のエージェント名を取得
       */
      var myNickname = null;

      if (window.PLAYER && PLAYER.nickname) {
        myNickname = String(PLAYER.nickname);
      }


      /*
       * MOD所有者を取得
       */
      var owners = installedMods.map(function(mod) {

        if (mod.owner) {
          return String(mod.owner);
        }

        return null;
      });


      /*
       * 所有者情報が存在しないMODがあれば対象外
       */
      if (owners.indexOf(null) !== -1) {
        return null;
      }


      /*
       * ★ 自分のMODが1つでも入っていたら除外
       */
      if (myNickname &&
          owners.indexOf(myNickname) !== -1) {

        return null;
      }


      /*
       * ★ MOD所有者が全員異なる必要がある
       *
       * 例:
       * A / B / C → OK
       * A / B     → OK
       * A         → OK
       *
       * A / A / B → NG
       * A / B / B → NG
       */
      if (new Set(owners).size !== modCount) {
        return null;
      }


      /*
       * 条件を満たしたMOD数を返す
       */
      return modCount;
    };


    /*
     * ============================================================
     * ハイライト処理
     * ============================================================
     */

    plugin.highlight = function(data) {

      if (!data || !data.portal) {
        return;
      }


      /*
       * IITCのハイライターでは
       * data.portal.options がポータル情報
       */
      var portal = data.portal.options;


      if (!portal) {
        return;
      }


      /*
       * MOD数を判定
       */
      var modCount = plugin.getType(portal);


      if (!modCount) {
        return;
      }


      var style = null;


      /*
       * ------------------------------------------------------------
       * MOD 3個 / 空き1個
       * → 黄色
       * ------------------------------------------------------------
       */
      if (modCount === 3) {

        style = {
          fillColor: '#FFD400',
          fillOpacity: 0.9,
          color: '#FF8800',
          opacity: 1,
          weight: 4
        };


      /*
       * ------------------------------------------------------------
       * MOD 2個 / 空き2個
       * → オレンジ
       *
       * 緑・青は陣営色と被るため使用しない
       * ------------------------------------------------------------
       */
      } else if (modCount === 2) {

        style = {
          fillColor: '#FF8C00',
          fillOpacity: 0.9,
          color: '#CC5500',
          opacity: 1,
          weight: 4
        };


      /*
       * ------------------------------------------------------------
       * MOD 1個 / 空き3個
       * → 紫
       *
       * 緑・青は陣営色と被るため使用しない
       * ------------------------------------------------------------
       */
      } else if (modCount === 1) {

        style = {
          fillColor: '#B060E0',
          fillOpacity: 0.9,
          color: '#7030A0',
          opacity: 1,
          weight: 4
        };
      }


      /*
       * ハイライト適用
       */
      if (style) {
        data.portal.setStyle(style);
      }
    };


    /*
     * ============================================================
     * IITCポータルハイライターへ登録
     * ============================================================
     */

    if (typeof window.addPortalHighlighter === 'function') {

      window.addPortalHighlighter(
        'Different MOD Owners + Empty (No Self)',
        plugin.highlight
      );
    }
  };


  /*
   * ============================================================
   * IITC起動後にセットアップ
   * ============================================================
   */

  if (window.iitcLoaded) {

    setup();

  } else {

    window.bootPlugins = window.bootPlugins || [];

    window.bootPlugins.push(setup);
  }

})();