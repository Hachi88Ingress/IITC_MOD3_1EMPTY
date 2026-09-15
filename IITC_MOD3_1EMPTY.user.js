// ==UserScript==
// @id             different-mod-owners-no-self
// @name           Different MOD Owners + Empty (No Self)
// @category       Highlighter
// @version        1.2.0
// @description    Highlights portals with 1-3 MODs owned by different agents, excluding your own MODs
// @match          https://intel.ingress.com/*
// @grant          none
// ==/UserScript==

(function() {
  'use strict';

  var setup = function() {
    var plugin = {};

    /*
     * 対象判定
     *
     * MOD 3個 → 黄色
     * MOD 2個 → 緑
     * MOD 1個 → 青
     *
     * 共通条件:
     * ・自分のMODがない
     * ・MOD所有者が全員異なる
     */
    plugin.getType = function(portal) {
      if (!portal || !portal.guid) return null;

      // IITCが既に取得している詳細情報のみ使用
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

      // 詳細情報がない場合は対象外
      if (!details) return null;

      var mods = details.mods;

      // MODスロットが4つでなければ対象外
      if (!Array.isArray(mods) || mods.length !== 4) {
        return null;
      }

      // 入っているMODだけ取得
      var installedMods = mods.filter(function(mod) {
        return mod !== null && typeof mod === 'object';
      });

      var modCount = installedMods.length;

      // 1～3個だけ対象
      if (modCount < 1 || modCount > 3) {
        return null;
      }

      // 自分のエージェント名
      var myNickname = null;

      if (window.PLAYER && PLAYER.nickname) {
        myNickname = String(PLAYER.nickname);
      }

      // MOD所有者を取得
      var owners = installedMods.map(function(mod) {
        return mod.owner ? String(mod.owner) : null;
      });

      // 所有者情報がない場合は対象外
      if (owners.indexOf(null) !== -1) {
        return null;
      }

      // ★ 自分のMODが1つでもあれば対象外
      if (myNickname && owners.indexOf(myNickname) !== -1) {
        return null;
      }

      // ★ MOD所有者が全員異なる必要がある
      if (new Set(owners).size !== modCount) {
        return null;
      }

      return modCount;
    };


    /*
     * ハイライト
     */
    plugin.highlight = function(data) {
      if (!data || !data.portal) return;

      var portal = data.portal.options;

      if (!portal) return;

      var modCount = plugin.getType(portal);

      if (!modCount) return;

      var style;

      if (modCount === 3) {

        // MOD 3個 / 空き1個
        style = {
          fillColor: '#FFD400',
          fillOpacity: 0.9,
          color: '#FF8800',
          opacity: 1,
          weight: 4
        };

      } else if (modCount === 2) {

        // MOD 2個 / 空き2個
        style = {
          fillColor: '#00CC66',
          fillOpacity: 0.9,
          color: '#008844',
          opacity: 1,
          weight: 4
        };

      } else if (modCount === 1) {

        // MOD 1個 / 空き3個
        style = {
          fillColor: '#3399FF',
          fillOpacity: 0.9,
          color: '#0066CC',
          opacity: 1,
          weight: 4
        };
      }

      data.portal.setStyle(style);
    };


    // IITCポータルハイライターに登録
    if (typeof window.addPortalHighlighter === 'function') {
      window.addPortalHighlighter(
        'Different MOD Owners + Empty (No Self)',
        plugin.highlight
      );
    }
  };


  // IITC起動後に実行
  if (window.iitcLoaded) {
    setup();
  } else {
    window.bootPlugins = window.bootPlugins || [];
    window.bootPlugins.push(setup);
  }

})();