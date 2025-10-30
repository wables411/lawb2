const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/add-GudSa5Ja.js","assets/index-Cfjwa-7s.js","assets/wagmi-vendor-Dpe0V0Cz.js","assets/react-vendor-ZyuiJZO_.js","assets/chess-vendor-JTxzwGi1.js","assets/ui-vendor-BgPmeekb.js","assets/index-DCUXUex1.css","assets/all-wallets-DXDbcqqB.js","assets/arrow-bottom-circle-C9vL0IDV.js","assets/app-store-z55015wZ.js","assets/apple-CO0r0PT7.js","assets/arrow-bottom-CqGW8zgv.js","assets/arrow-left-Cc-zW6E_.js","assets/arrow-right-D1ZoBJXa.js","assets/arrow-top-CVDoN7lt.js","assets/bank-pp_ouqQg.js","assets/browser-xQMcZG-X.js","assets/card-BNh-Y2Fb.js","assets/checkmark-B7lnusk5.js","assets/checkmark-bold-C8XEIr3e.js","assets/chevron-bottom-D9DadZAG.js","assets/chevron-left-RLuc_UFd.js","assets/chevron-right-CtWxh_Sq.js","assets/chevron-top-JweLdPd4.js","assets/chrome-store-dXUQ2ymj.js","assets/clock-ZlW6yQnQ.js","assets/close-BKiiCVxy.js","assets/compass-CePsHXnX.js","assets/coinPlaceholder-QpEHwBfN.js","assets/copy-DT_-m92J.js","assets/cursor-CAyeFV5b.js","assets/cursor-transparent-KY7kUnyJ.js","assets/desktop-uP2wipgq.js","assets/disconnect-Lad6Sz-Q.js","assets/discord-CAGVjRoe.js","assets/etherscan-BkSit91j.js","assets/extension-aC0QDpai.js","assets/external-link-B2_zKm7u.js","assets/facebook-BWEbWLtn.js","assets/farcaster-CJG1OryZ.js","assets/filters-CZe0-1JN.js","assets/github-BunT8aHP.js","assets/google-D_paJ6DO.js","assets/help-circle-DjEHwI-k.js","assets/image-BLgOQHIC.js","assets/id-BhOQG_vl.js","assets/info-circle-thhrSf9l.js","assets/lightbulb-CYxq3c3L.js","assets/mail-CEopm00U.js","assets/mobile-CvHbUOx4.js","assets/more-CIA_LIj6.js","assets/network-placeholder-BO9TB8xE.js","assets/nftPlaceholder-6bqGwjjf.js","assets/off-D-PjsQrJ.js","assets/play-store-6varwYNo.js","assets/plus-CRxzIsFI.js","assets/qr-code-BggiYAwt.js","assets/recycle-horizontal-Cb23liUs.js","assets/refresh-BKS4hnkn.js","assets/search-BpE2evqf.js","assets/send-CCPsWq8E.js","assets/swapHorizontal-DUVgBIjL.js","assets/swapHorizontalMedium-BlrVhhp0.js","assets/swapHorizontalBold-CKFw6FAS.js","assets/swapHorizontalRoundedBold-_p6J8vuz.js","assets/swapVertical-VvdIIEFY.js","assets/telegram-C6KG17ka.js","assets/three-dots-C-m2I9HW.js","assets/twitch-D8XwvChI.js","assets/x-CMAUhZoW.js","assets/twitterIcon-BtebDd8Q.js","assets/verify-CKlswkMB.js","assets/verify-filled-CtdHPKxP.js","assets/wallet-B-1DdVpN.js","assets/walletconnect-CJzCRfh1.js","assets/wallet-placeholder-DiFBc3TV.js","assets/warning-circle-B3dXJhTL.js","assets/info-CnAJpLer.js","assets/exclamation-triangle-DyqZoeOK.js","assets/reown-logo-BKJ_HRLY.js"])))=>i.map(i=>d[i]);
import{aj as t,ak as a,al as e,am as r,k as o,n as i,i as n,x as s,an as c}from"./index-Cfjwa-7s.js";import{h as l,i as g,j as w}from"./core-RUy0VZu4.js";import{_ as p}from"./wagmi-vendor-Dpe0V0Cz.js";
/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */class v{constructor(t){this.G=t}disconnect(){this.G=void 0}reconnect(t){this.G=t}deref(){return this.G}}class h{constructor(){this.Y=void 0,this.Z=void 0}get(){return this.Y}pause(){this.Y??(this.Y=new Promise(t=>this.Z=t))}resume(){var t;null==(t=this.Z)||t.call(this),this.Y=this.Z=void 0}}
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const u=t=>!r(t)&&"function"==typeof t.then,d=1073741823;const _=t(class extends a{constructor(){super(...arguments),this._$Cwt=d,this._$Cbt=[],this._$CK=new v(this),this._$CX=new h}render(...t){return t.find(t=>!u(t))??e}update(t,a){const r=this._$Cbt;let o=r.length;this._$Cbt=a;const i=this._$CK,n=this._$CX;this.isConnected||this.disconnected();for(let e=0;e<a.length&&!(e>this._$Cwt);e++){const t=a[e];if(!u(t))return this._$Cwt=e,t;e<o&&t===r[e]||(this._$Cwt=d,o=0,Promise.resolve(t).then(async a=>{for(;n.get();)await n.get();const e=i.deref();if(void 0!==e){const r=e._$Cbt.indexOf(t);r>-1&&r<e._$Cwt&&(e._$Cwt=r,e.setValue(a))}}))}return e}disconnected(){this._$CK.disconnect(),this._$CX.pause()}reconnected(){this._$CK.reconnect(this),this._$CX.resume()}}),m={getSpacingStyles:(t,a)=>Array.isArray(t)?t[a]?`var(--wui-spacing-${t[a]})`:void 0:"string"==typeof t?`var(--wui-spacing-${t})`:void 0,getFormattedDate:t=>new Intl.DateTimeFormat("en-US",{month:"short",day:"numeric"}).format(t),getHostName(t){try{return new URL(t).hostname}catch(a){return""}},getTruncateString:({string:t,charsStart:a,charsEnd:e,truncate:r})=>t.length<=a+e?t:"end"===r?`${t.substring(0,a)}...`:"start"===r?`...${t.substring(t.length-e)}`:`${t.substring(0,Math.floor(a))}...${t.substring(t.length-Math.floor(e))}`,generateAvatarColors(t){const a=t.toLowerCase().replace(/^0x/iu,"").replace(/[^a-f0-9]/gu,"").substring(0,6).padEnd(6,"0"),e=this.hexToRgb(a),r=getComputedStyle(document.documentElement).getPropertyValue("--w3m-border-radius-master"),o=100-3*Number(null==r?void 0:r.replace("px","")),i=`${o}% ${o}% at 65% 40%`,n=[];for(let s=0;s<5;s+=1){const t=this.tintColor(e,.15*s);n.push(`rgb(${t[0]}, ${t[1]}, ${t[2]})`)}return`\n    --local-color-1: ${n[0]};\n    --local-color-2: ${n[1]};\n    --local-color-3: ${n[2]};\n    --local-color-4: ${n[3]};\n    --local-color-5: ${n[4]};\n    --local-radial-circle: ${i}\n   `},hexToRgb(t){const a=parseInt(t,16);return[a>>16&255,a>>8&255,255&a]},tintColor(t,a){const[e,r,o]=t;return[Math.round(e+(255-e)*a),Math.round(r+(255-r)*a),Math.round(o+(255-o)*a)]},isNumber:t=>/^[0-9]+$/u.test(t),getColorTheme(t){var a;return t||("undefined"!=typeof window&&window.matchMedia?(null==(a=window.matchMedia("(prefers-color-scheme: dark)"))?void 0:a.matches)?"dark":"light":"dark")},splitBalance(t){const a=t.split(".");return 2===a.length?[a[0],a[1]]:["0","00"]},roundNumber:(t,a,e)=>t.toString().length>=a?Number(t).toFixed(e):t,formatNumberToLocalString:(t,a=2)=>void 0===t?"0.00":"number"==typeof t?t.toLocaleString("en-US",{maximumFractionDigits:a,minimumFractionDigits:a}):parseFloat(t).toLocaleString("en-US",{maximumFractionDigits:a,minimumFractionDigits:a})};function y(t){return function(a){return"function"==typeof a?function(t,a){return customElements.get(t)||customElements.define(t,a),a}(t,a):function(t,a){const{kind:e,elements:r}=a;return{kind:e,elements:r,finisher(a){customElements.get(t)||customElements.define(t,a)}}}(t,a)}}const f=o`
  :host {
    display: flex;
    width: inherit;
    height: inherit;
  }
`;var S=function(t,a,e,r){var o,i=arguments.length,n=i<3?a:null===r?r=Object.getOwnPropertyDescriptor(a,e):r;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)n=Reflect.decorate(t,a,e,r);else for(var s=t.length-1;s>=0;s--)(o=t[s])&&(n=(i<3?o(n):i>3?o(a,e,n):o(a,e))||n);return i>3&&n&&Object.defineProperty(a,e,n),n};let b=class extends n{render(){return this.style.cssText=`\n      flex-direction: ${this.flexDirection};\n      flex-wrap: ${this.flexWrap};\n      flex-basis: ${this.flexBasis};\n      flex-grow: ${this.flexGrow};\n      flex-shrink: ${this.flexShrink};\n      align-items: ${this.alignItems};\n      justify-content: ${this.justifyContent};\n      column-gap: ${this.columnGap&&`var(--wui-spacing-${this.columnGap})`};\n      row-gap: ${this.rowGap&&`var(--wui-spacing-${this.rowGap})`};\n      gap: ${this.gap&&`var(--wui-spacing-${this.gap})`};\n      padding-top: ${this.padding&&m.getSpacingStyles(this.padding,0)};\n      padding-right: ${this.padding&&m.getSpacingStyles(this.padding,1)};\n      padding-bottom: ${this.padding&&m.getSpacingStyles(this.padding,2)};\n      padding-left: ${this.padding&&m.getSpacingStyles(this.padding,3)};\n      margin-top: ${this.margin&&m.getSpacingStyles(this.margin,0)};\n      margin-right: ${this.margin&&m.getSpacingStyles(this.margin,1)};\n      margin-bottom: ${this.margin&&m.getSpacingStyles(this.margin,2)};\n      margin-left: ${this.margin&&m.getSpacingStyles(this.margin,3)};\n    `,s`<slot></slot>`}};b.styles=[l,f],S([i()],b.prototype,"flexDirection",void 0),S([i()],b.prototype,"flexWrap",void 0),S([i()],b.prototype,"flexBasis",void 0),S([i()],b.prototype,"flexGrow",void 0),S([i()],b.prototype,"flexShrink",void 0),S([i()],b.prototype,"alignItems",void 0),S([i()],b.prototype,"justifyContent",void 0),S([i()],b.prototype,"columnGap",void 0),S([i()],b.prototype,"rowGap",void 0),S([i()],b.prototype,"gap",void 0),S([i()],b.prototype,"padding",void 0),S([i()],b.prototype,"margin",void 0),b=S([y("wui-flex")],b);const E=new class{constructor(){this.cache=new Map}set(t,a){this.cache.set(t,a)}get(t){return this.cache.get(t)}has(t){return this.cache.has(t)}delete(t){this.cache.delete(t)}clear(){this.cache.clear()}},x=o`
  :host {
    display: flex;
    aspect-ratio: var(--local-aspect-ratio);
    color: var(--local-color);
    width: var(--local-width);
  }

  svg {
    width: inherit;
    height: inherit;
    object-fit: contain;
    object-position: center;
  }

  .fallback {
    width: var(--local-width);
    height: var(--local-height);
  }
`;var R=function(t,a,e,r){var o,i=arguments.length,n=i<3?a:null===r?r=Object.getOwnPropertyDescriptor(a,e):r;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)n=Reflect.decorate(t,a,e,r);else for(var s=t.length-1;s>=0;s--)(o=t[s])&&(n=(i<3?o(n):i>3?o(a,e,n):o(a,e))||n);return i>3&&n&&Object.defineProperty(a,e,n),n};const j={add:async()=>(await p(async()=>{const{addSvg:t}=await import("./add-GudSa5Ja.js");return{addSvg:t}},__vite__mapDeps([0,1,2,3,4,5,6]))).addSvg,allWallets:async()=>(await p(async()=>{const{allWalletsSvg:t}=await import("./all-wallets-DXDbcqqB.js");return{allWalletsSvg:t}},__vite__mapDeps([7,1,2,3,4,5,6]))).allWalletsSvg,arrowBottomCircle:async()=>(await p(async()=>{const{arrowBottomCircleSvg:t}=await import("./arrow-bottom-circle-C9vL0IDV.js");return{arrowBottomCircleSvg:t}},__vite__mapDeps([8,1,2,3,4,5,6]))).arrowBottomCircleSvg,appStore:async()=>(await p(async()=>{const{appStoreSvg:t}=await import("./app-store-z55015wZ.js");return{appStoreSvg:t}},__vite__mapDeps([9,1,2,3,4,5,6]))).appStoreSvg,apple:async()=>(await p(async()=>{const{appleSvg:t}=await import("./apple-CO0r0PT7.js");return{appleSvg:t}},__vite__mapDeps([10,1,2,3,4,5,6]))).appleSvg,arrowBottom:async()=>(await p(async()=>{const{arrowBottomSvg:t}=await import("./arrow-bottom-CqGW8zgv.js");return{arrowBottomSvg:t}},__vite__mapDeps([11,1,2,3,4,5,6]))).arrowBottomSvg,arrowLeft:async()=>(await p(async()=>{const{arrowLeftSvg:t}=await import("./arrow-left-Cc-zW6E_.js");return{arrowLeftSvg:t}},__vite__mapDeps([12,1,2,3,4,5,6]))).arrowLeftSvg,arrowRight:async()=>(await p(async()=>{const{arrowRightSvg:t}=await import("./arrow-right-D1ZoBJXa.js");return{arrowRightSvg:t}},__vite__mapDeps([13,1,2,3,4,5,6]))).arrowRightSvg,arrowTop:async()=>(await p(async()=>{const{arrowTopSvg:t}=await import("./arrow-top-CVDoN7lt.js");return{arrowTopSvg:t}},__vite__mapDeps([14,1,2,3,4,5,6]))).arrowTopSvg,bank:async()=>(await p(async()=>{const{bankSvg:t}=await import("./bank-pp_ouqQg.js");return{bankSvg:t}},__vite__mapDeps([15,1,2,3,4,5,6]))).bankSvg,browser:async()=>(await p(async()=>{const{browserSvg:t}=await import("./browser-xQMcZG-X.js");return{browserSvg:t}},__vite__mapDeps([16,1,2,3,4,5,6]))).browserSvg,card:async()=>(await p(async()=>{const{cardSvg:t}=await import("./card-BNh-Y2Fb.js");return{cardSvg:t}},__vite__mapDeps([17,1,2,3,4,5,6]))).cardSvg,checkmark:async()=>(await p(async()=>{const{checkmarkSvg:t}=await import("./checkmark-B7lnusk5.js");return{checkmarkSvg:t}},__vite__mapDeps([18,1,2,3,4,5,6]))).checkmarkSvg,checkmarkBold:async()=>(await p(async()=>{const{checkmarkBoldSvg:t}=await import("./checkmark-bold-C8XEIr3e.js");return{checkmarkBoldSvg:t}},__vite__mapDeps([19,1,2,3,4,5,6]))).checkmarkBoldSvg,chevronBottom:async()=>(await p(async()=>{const{chevronBottomSvg:t}=await import("./chevron-bottom-D9DadZAG.js");return{chevronBottomSvg:t}},__vite__mapDeps([20,1,2,3,4,5,6]))).chevronBottomSvg,chevronLeft:async()=>(await p(async()=>{const{chevronLeftSvg:t}=await import("./chevron-left-RLuc_UFd.js");return{chevronLeftSvg:t}},__vite__mapDeps([21,1,2,3,4,5,6]))).chevronLeftSvg,chevronRight:async()=>(await p(async()=>{const{chevronRightSvg:t}=await import("./chevron-right-CtWxh_Sq.js");return{chevronRightSvg:t}},__vite__mapDeps([22,1,2,3,4,5,6]))).chevronRightSvg,chevronTop:async()=>(await p(async()=>{const{chevronTopSvg:t}=await import("./chevron-top-JweLdPd4.js");return{chevronTopSvg:t}},__vite__mapDeps([23,1,2,3,4,5,6]))).chevronTopSvg,chromeStore:async()=>(await p(async()=>{const{chromeStoreSvg:t}=await import("./chrome-store-dXUQ2ymj.js");return{chromeStoreSvg:t}},__vite__mapDeps([24,1,2,3,4,5,6]))).chromeStoreSvg,clock:async()=>(await p(async()=>{const{clockSvg:t}=await import("./clock-ZlW6yQnQ.js");return{clockSvg:t}},__vite__mapDeps([25,1,2,3,4,5,6]))).clockSvg,close:async()=>(await p(async()=>{const{closeSvg:t}=await import("./close-BKiiCVxy.js");return{closeSvg:t}},__vite__mapDeps([26,1,2,3,4,5,6]))).closeSvg,compass:async()=>(await p(async()=>{const{compassSvg:t}=await import("./compass-CePsHXnX.js");return{compassSvg:t}},__vite__mapDeps([27,1,2,3,4,5,6]))).compassSvg,coinPlaceholder:async()=>(await p(async()=>{const{coinPlaceholderSvg:t}=await import("./coinPlaceholder-QpEHwBfN.js");return{coinPlaceholderSvg:t}},__vite__mapDeps([28,1,2,3,4,5,6]))).coinPlaceholderSvg,copy:async()=>(await p(async()=>{const{copySvg:t}=await import("./copy-DT_-m92J.js");return{copySvg:t}},__vite__mapDeps([29,1,2,3,4,5,6]))).copySvg,cursor:async()=>(await p(async()=>{const{cursorSvg:t}=await import("./cursor-CAyeFV5b.js");return{cursorSvg:t}},__vite__mapDeps([30,1,2,3,4,5,6]))).cursorSvg,cursorTransparent:async()=>(await p(async()=>{const{cursorTransparentSvg:t}=await import("./cursor-transparent-KY7kUnyJ.js");return{cursorTransparentSvg:t}},__vite__mapDeps([31,1,2,3,4,5,6]))).cursorTransparentSvg,desktop:async()=>(await p(async()=>{const{desktopSvg:t}=await import("./desktop-uP2wipgq.js");return{desktopSvg:t}},__vite__mapDeps([32,1,2,3,4,5,6]))).desktopSvg,disconnect:async()=>(await p(async()=>{const{disconnectSvg:t}=await import("./disconnect-Lad6Sz-Q.js");return{disconnectSvg:t}},__vite__mapDeps([33,1,2,3,4,5,6]))).disconnectSvg,discord:async()=>(await p(async()=>{const{discordSvg:t}=await import("./discord-CAGVjRoe.js");return{discordSvg:t}},__vite__mapDeps([34,1,2,3,4,5,6]))).discordSvg,etherscan:async()=>(await p(async()=>{const{etherscanSvg:t}=await import("./etherscan-BkSit91j.js");return{etherscanSvg:t}},__vite__mapDeps([35,1,2,3,4,5,6]))).etherscanSvg,extension:async()=>(await p(async()=>{const{extensionSvg:t}=await import("./extension-aC0QDpai.js");return{extensionSvg:t}},__vite__mapDeps([36,1,2,3,4,5,6]))).extensionSvg,externalLink:async()=>(await p(async()=>{const{externalLinkSvg:t}=await import("./external-link-B2_zKm7u.js");return{externalLinkSvg:t}},__vite__mapDeps([37,1,2,3,4,5,6]))).externalLinkSvg,facebook:async()=>(await p(async()=>{const{facebookSvg:t}=await import("./facebook-BWEbWLtn.js");return{facebookSvg:t}},__vite__mapDeps([38,1,2,3,4,5,6]))).facebookSvg,farcaster:async()=>(await p(async()=>{const{farcasterSvg:t}=await import("./farcaster-CJG1OryZ.js");return{farcasterSvg:t}},__vite__mapDeps([39,1,2,3,4,5,6]))).farcasterSvg,filters:async()=>(await p(async()=>{const{filtersSvg:t}=await import("./filters-CZe0-1JN.js");return{filtersSvg:t}},__vite__mapDeps([40,1,2,3,4,5,6]))).filtersSvg,github:async()=>(await p(async()=>{const{githubSvg:t}=await import("./github-BunT8aHP.js");return{githubSvg:t}},__vite__mapDeps([41,1,2,3,4,5,6]))).githubSvg,google:async()=>(await p(async()=>{const{googleSvg:t}=await import("./google-D_paJ6DO.js");return{googleSvg:t}},__vite__mapDeps([42,1,2,3,4,5,6]))).googleSvg,helpCircle:async()=>(await p(async()=>{const{helpCircleSvg:t}=await import("./help-circle-DjEHwI-k.js");return{helpCircleSvg:t}},__vite__mapDeps([43,1,2,3,4,5,6]))).helpCircleSvg,image:async()=>(await p(async()=>{const{imageSvg:t}=await import("./image-BLgOQHIC.js");return{imageSvg:t}},__vite__mapDeps([44,1,2,3,4,5,6]))).imageSvg,id:async()=>(await p(async()=>{const{idSvg:t}=await import("./id-BhOQG_vl.js");return{idSvg:t}},__vite__mapDeps([45,1,2,3,4,5,6]))).idSvg,infoCircle:async()=>(await p(async()=>{const{infoCircleSvg:t}=await import("./info-circle-thhrSf9l.js");return{infoCircleSvg:t}},__vite__mapDeps([46,1,2,3,4,5,6]))).infoCircleSvg,lightbulb:async()=>(await p(async()=>{const{lightbulbSvg:t}=await import("./lightbulb-CYxq3c3L.js");return{lightbulbSvg:t}},__vite__mapDeps([47,1,2,3,4,5,6]))).lightbulbSvg,mail:async()=>(await p(async()=>{const{mailSvg:t}=await import("./mail-CEopm00U.js");return{mailSvg:t}},__vite__mapDeps([48,1,2,3,4,5,6]))).mailSvg,mobile:async()=>(await p(async()=>{const{mobileSvg:t}=await import("./mobile-CvHbUOx4.js");return{mobileSvg:t}},__vite__mapDeps([49,1,2,3,4,5,6]))).mobileSvg,more:async()=>(await p(async()=>{const{moreSvg:t}=await import("./more-CIA_LIj6.js");return{moreSvg:t}},__vite__mapDeps([50,1,2,3,4,5,6]))).moreSvg,networkPlaceholder:async()=>(await p(async()=>{const{networkPlaceholderSvg:t}=await import("./network-placeholder-BO9TB8xE.js");return{networkPlaceholderSvg:t}},__vite__mapDeps([51,1,2,3,4,5,6]))).networkPlaceholderSvg,nftPlaceholder:async()=>(await p(async()=>{const{nftPlaceholderSvg:t}=await import("./nftPlaceholder-6bqGwjjf.js");return{nftPlaceholderSvg:t}},__vite__mapDeps([52,1,2,3,4,5,6]))).nftPlaceholderSvg,off:async()=>(await p(async()=>{const{offSvg:t}=await import("./off-D-PjsQrJ.js");return{offSvg:t}},__vite__mapDeps([53,1,2,3,4,5,6]))).offSvg,playStore:async()=>(await p(async()=>{const{playStoreSvg:t}=await import("./play-store-6varwYNo.js");return{playStoreSvg:t}},__vite__mapDeps([54,1,2,3,4,5,6]))).playStoreSvg,plus:async()=>(await p(async()=>{const{plusSvg:t}=await import("./plus-CRxzIsFI.js");return{plusSvg:t}},__vite__mapDeps([55,1,2,3,4,5,6]))).plusSvg,qrCode:async()=>(await p(async()=>{const{qrCodeIcon:t}=await import("./qr-code-BggiYAwt.js");return{qrCodeIcon:t}},__vite__mapDeps([56,1,2,3,4,5,6]))).qrCodeIcon,recycleHorizontal:async()=>(await p(async()=>{const{recycleHorizontalSvg:t}=await import("./recycle-horizontal-Cb23liUs.js");return{recycleHorizontalSvg:t}},__vite__mapDeps([57,1,2,3,4,5,6]))).recycleHorizontalSvg,refresh:async()=>(await p(async()=>{const{refreshSvg:t}=await import("./refresh-BKS4hnkn.js");return{refreshSvg:t}},__vite__mapDeps([58,1,2,3,4,5,6]))).refreshSvg,search:async()=>(await p(async()=>{const{searchSvg:t}=await import("./search-BpE2evqf.js");return{searchSvg:t}},__vite__mapDeps([59,1,2,3,4,5,6]))).searchSvg,send:async()=>(await p(async()=>{const{sendSvg:t}=await import("./send-CCPsWq8E.js");return{sendSvg:t}},__vite__mapDeps([60,1,2,3,4,5,6]))).sendSvg,swapHorizontal:async()=>(await p(async()=>{const{swapHorizontalSvg:t}=await import("./swapHorizontal-DUVgBIjL.js");return{swapHorizontalSvg:t}},__vite__mapDeps([61,1,2,3,4,5,6]))).swapHorizontalSvg,swapHorizontalMedium:async()=>(await p(async()=>{const{swapHorizontalMediumSvg:t}=await import("./swapHorizontalMedium-BlrVhhp0.js");return{swapHorizontalMediumSvg:t}},__vite__mapDeps([62,1,2,3,4,5,6]))).swapHorizontalMediumSvg,swapHorizontalBold:async()=>(await p(async()=>{const{swapHorizontalBoldSvg:t}=await import("./swapHorizontalBold-CKFw6FAS.js");return{swapHorizontalBoldSvg:t}},__vite__mapDeps([63,1,2,3,4,5,6]))).swapHorizontalBoldSvg,swapHorizontalRoundedBold:async()=>(await p(async()=>{const{swapHorizontalRoundedBoldSvg:t}=await import("./swapHorizontalRoundedBold-_p6J8vuz.js");return{swapHorizontalRoundedBoldSvg:t}},__vite__mapDeps([64,1,2,3,4,5,6]))).swapHorizontalRoundedBoldSvg,swapVertical:async()=>(await p(async()=>{const{swapVerticalSvg:t}=await import("./swapVertical-VvdIIEFY.js");return{swapVerticalSvg:t}},__vite__mapDeps([65,1,2,3,4,5,6]))).swapVerticalSvg,telegram:async()=>(await p(async()=>{const{telegramSvg:t}=await import("./telegram-C6KG17ka.js");return{telegramSvg:t}},__vite__mapDeps([66,1,2,3,4,5,6]))).telegramSvg,threeDots:async()=>(await p(async()=>{const{threeDotsSvg:t}=await import("./three-dots-C-m2I9HW.js");return{threeDotsSvg:t}},__vite__mapDeps([67,1,2,3,4,5,6]))).threeDotsSvg,twitch:async()=>(await p(async()=>{const{twitchSvg:t}=await import("./twitch-D8XwvChI.js");return{twitchSvg:t}},__vite__mapDeps([68,1,2,3,4,5,6]))).twitchSvg,twitter:async()=>(await p(async()=>{const{xSvg:t}=await import("./x-CMAUhZoW.js");return{xSvg:t}},__vite__mapDeps([69,1,2,3,4,5,6]))).xSvg,twitterIcon:async()=>(await p(async()=>{const{twitterIconSvg:t}=await import("./twitterIcon-BtebDd8Q.js");return{twitterIconSvg:t}},__vite__mapDeps([70,1,2,3,4,5,6]))).twitterIconSvg,verify:async()=>(await p(async()=>{const{verifySvg:t}=await import("./verify-CKlswkMB.js");return{verifySvg:t}},__vite__mapDeps([71,1,2,3,4,5,6]))).verifySvg,verifyFilled:async()=>(await p(async()=>{const{verifyFilledSvg:t}=await import("./verify-filled-CtdHPKxP.js");return{verifyFilledSvg:t}},__vite__mapDeps([72,1,2,3,4,5,6]))).verifyFilledSvg,wallet:async()=>(await p(async()=>{const{walletSvg:t}=await import("./wallet-B-1DdVpN.js");return{walletSvg:t}},__vite__mapDeps([73,1,2,3,4,5,6]))).walletSvg,walletConnect:async()=>(await p(async()=>{const{walletConnectSvg:t}=await import("./walletconnect-CJzCRfh1.js");return{walletConnectSvg:t}},__vite__mapDeps([74,1,2,3,4,5,6]))).walletConnectSvg,walletConnectLightBrown:async()=>(await p(async()=>{const{walletConnectLightBrownSvg:t}=await import("./walletconnect-CJzCRfh1.js");return{walletConnectLightBrownSvg:t}},__vite__mapDeps([74,1,2,3,4,5,6]))).walletConnectLightBrownSvg,walletConnectBrown:async()=>(await p(async()=>{const{walletConnectBrownSvg:t}=await import("./walletconnect-CJzCRfh1.js");return{walletConnectBrownSvg:t}},__vite__mapDeps([74,1,2,3,4,5,6]))).walletConnectBrownSvg,walletPlaceholder:async()=>(await p(async()=>{const{walletPlaceholderSvg:t}=await import("./wallet-placeholder-DiFBc3TV.js");return{walletPlaceholderSvg:t}},__vite__mapDeps([75,1,2,3,4,5,6]))).walletPlaceholderSvg,warningCircle:async()=>(await p(async()=>{const{warningCircleSvg:t}=await import("./warning-circle-B3dXJhTL.js");return{warningCircleSvg:t}},__vite__mapDeps([76,1,2,3,4,5,6]))).warningCircleSvg,x:async()=>(await p(async()=>{const{xSvg:t}=await import("./x-CMAUhZoW.js");return{xSvg:t}},__vite__mapDeps([69,1,2,3,4,5,6]))).xSvg,info:async()=>(await p(async()=>{const{infoSvg:t}=await import("./info-CnAJpLer.js");return{infoSvg:t}},__vite__mapDeps([77,1,2,3,4,5,6]))).infoSvg,exclamationTriangle:async()=>(await p(async()=>{const{exclamationTriangleSvg:t}=await import("./exclamation-triangle-DyqZoeOK.js");return{exclamationTriangleSvg:t}},__vite__mapDeps([78,1,2,3,4,5,6]))).exclamationTriangleSvg,reown:async()=>(await p(async()=>{const{reownSvg:t}=await import("./reown-logo-BKJ_HRLY.js");return{reownSvg:t}},__vite__mapDeps([79,1,2,3,4,5,6]))).reownSvg};let P=class extends n{constructor(){super(...arguments),this.size="md",this.name="copy",this.color="fg-300",this.aspectRatio="1 / 1"}render(){return this.style.cssText=`\n      --local-color: var(--wui-color-${this.color});\n      --local-width: var(--wui-icon-size-${this.size});\n      --local-aspect-ratio: ${this.aspectRatio}\n    `,s`${_(async function(t){if(E.has(t))return E.get(t);const a=(j[t]??j.copy)();return E.set(t,a),a}(this.name),s`<div class="fallback"></div>`)}`}};P.styles=[l,g,x],R([i()],P.prototype,"size",void 0),R([i()],P.prototype,"name",void 0),R([i()],P.prototype,"color",void 0),R([i()],P.prototype,"aspectRatio",void 0),P=R([y("wui-icon")],P);const k=o`
  :host {
    display: inline-flex !important;
  }

  slot {
    width: 100%;
    display: inline-block;
    font-style: normal;
    font-family: var(--wui-font-family);
    font-feature-settings:
      'tnum' on,
      'lnum' on,
      'case' on;
    line-height: 130%;
    font-weight: var(--wui-font-weight-regular);
    overflow: inherit;
    text-overflow: inherit;
    text-align: var(--local-align);
    color: var(--local-color);
  }

  .wui-line-clamp-1 {
    overflow: hidden;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 1;
  }

  .wui-line-clamp-2 {
    overflow: hidden;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
  }

  .wui-font-medium-400 {
    font-size: var(--wui-font-size-medium);
    font-weight: var(--wui-font-weight-light);
    letter-spacing: var(--wui-letter-spacing-medium);
  }

  .wui-font-medium-600 {
    font-size: var(--wui-font-size-medium);
    letter-spacing: var(--wui-letter-spacing-medium);
  }

  .wui-font-title-600 {
    font-size: var(--wui-font-size-title);
    letter-spacing: var(--wui-letter-spacing-title);
  }

  .wui-font-title-6-600 {
    font-size: var(--wui-font-size-title-6);
    letter-spacing: var(--wui-letter-spacing-title-6);
  }

  .wui-font-mini-700 {
    font-size: var(--wui-font-size-mini);
    letter-spacing: var(--wui-letter-spacing-mini);
    text-transform: uppercase;
  }

  .wui-font-large-500,
  .wui-font-large-600,
  .wui-font-large-700 {
    font-size: var(--wui-font-size-large);
    letter-spacing: var(--wui-letter-spacing-large);
  }

  .wui-font-2xl-500,
  .wui-font-2xl-600,
  .wui-font-2xl-700 {
    font-size: var(--wui-font-size-2xl);
    letter-spacing: var(--wui-letter-spacing-2xl);
  }

  .wui-font-paragraph-400,
  .wui-font-paragraph-500,
  .wui-font-paragraph-600,
  .wui-font-paragraph-700 {
    font-size: var(--wui-font-size-paragraph);
    letter-spacing: var(--wui-letter-spacing-paragraph);
  }

  .wui-font-small-400,
  .wui-font-small-500,
  .wui-font-small-600 {
    font-size: var(--wui-font-size-small);
    letter-spacing: var(--wui-letter-spacing-small);
  }

  .wui-font-tiny-400,
  .wui-font-tiny-500,
  .wui-font-tiny-600 {
    font-size: var(--wui-font-size-tiny);
    letter-spacing: var(--wui-letter-spacing-tiny);
  }

  .wui-font-micro-700,
  .wui-font-micro-600 {
    font-size: var(--wui-font-size-micro);
    letter-spacing: var(--wui-letter-spacing-micro);
    text-transform: uppercase;
  }

  .wui-font-tiny-400,
  .wui-font-small-400,
  .wui-font-medium-400,
  .wui-font-paragraph-400 {
    font-weight: var(--wui-font-weight-light);
  }

  .wui-font-large-700,
  .wui-font-paragraph-700,
  .wui-font-micro-700,
  .wui-font-mini-700 {
    font-weight: var(--wui-font-weight-bold);
  }

  .wui-font-medium-600,
  .wui-font-medium-title-600,
  .wui-font-title-6-600,
  .wui-font-large-600,
  .wui-font-paragraph-600,
  .wui-font-small-600,
  .wui-font-tiny-600,
  .wui-font-micro-600 {
    font-weight: var(--wui-font-weight-medium);
  }

  :host([disabled]) {
    opacity: 0.4;
  }
`;var T=function(t,a,e,r){var o,i=arguments.length,n=i<3?a:null===r?r=Object.getOwnPropertyDescriptor(a,e):r;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)n=Reflect.decorate(t,a,e,r);else for(var s=t.length-1;s>=0;s--)(o=t[s])&&(n=(i<3?o(n):i>3?o(a,e,n):o(a,e))||n);return i>3&&n&&Object.defineProperty(a,e,n),n};let L=class extends n{constructor(){super(...arguments),this.variant="paragraph-500",this.color="fg-300",this.align="left",this.lineClamp=void 0}render(){const t={[`wui-font-${this.variant}`]:!0,[`wui-color-${this.color}`]:!0,[`wui-line-clamp-${this.lineClamp}`]:!!this.lineClamp};return this.style.cssText=`\n      --local-align: ${this.align};\n      --local-color: var(--wui-color-${this.color});\n    `,s`<slot class=${c(t)}></slot>`}};L.styles=[l,k],T([i()],L.prototype,"variant",void 0),T([i()],L.prototype,"color",void 0),T([i()],L.prototype,"align",void 0),T([i()],L.prototype,"lineClamp",void 0),L=T([y("wui-text")],L);const O=o`
  :host {
    display: inline-flex;
    justify-content: center;
    align-items: center;
    position: relative;
    overflow: hidden;
    background-color: var(--wui-color-gray-glass-020);
    border-radius: var(--local-border-radius);
    border: var(--local-border);
    box-sizing: content-box;
    width: var(--local-size);
    height: var(--local-size);
    min-height: var(--local-size);
    min-width: var(--local-size);
  }

  @supports (background: color-mix(in srgb, white 50%, black)) {
    :host {
      background-color: color-mix(in srgb, var(--local-bg-value) var(--local-bg-mix), transparent);
    }
  }
`;var D=function(t,a,e,r){var o,i=arguments.length,n=i<3?a:null===r?r=Object.getOwnPropertyDescriptor(a,e):r;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)n=Reflect.decorate(t,a,e,r);else for(var s=t.length-1;s>=0;s--)(o=t[s])&&(n=(i<3?o(n):i>3?o(a,e,n):o(a,e))||n);return i>3&&n&&Object.defineProperty(a,e,n),n};let z=class extends n{constructor(){super(...arguments),this.size="md",this.backgroundColor="accent-100",this.iconColor="accent-100",this.background="transparent",this.border=!1,this.borderColor="wui-color-bg-125",this.icon="copy"}render(){const t=this.iconSize||this.size,a="lg"===this.size,e="xl"===this.size,r=a?"12%":"16%",o=a?"xxs":e?"s":"3xl",i="gray"===this.background,n="opaque"===this.background,c="accent-100"===this.backgroundColor&&n||"success-100"===this.backgroundColor&&n||"error-100"===this.backgroundColor&&n||"inverse-100"===this.backgroundColor&&n;let l=`var(--wui-color-${this.backgroundColor})`;return c?l=`var(--wui-icon-box-bg-${this.backgroundColor})`:i&&(l=`var(--wui-color-gray-${this.backgroundColor})`),this.style.cssText=`\n       --local-bg-value: ${l};\n       --local-bg-mix: ${c||i?"100%":r};\n       --local-border-radius: var(--wui-border-radius-${o});\n       --local-size: var(--wui-icon-box-size-${this.size});\n       --local-border: ${"wui-color-bg-125"===this.borderColor?"2px":"1px"} solid ${this.border?`var(--${this.borderColor})`:"transparent"}\n   `,s` <wui-icon color=${this.iconColor} size=${t} name=${this.icon}></wui-icon> `}};z.styles=[l,w,O],D([i()],z.prototype,"size",void 0),D([i()],z.prototype,"backgroundColor",void 0),D([i()],z.prototype,"iconColor",void 0),D([i()],z.prototype,"iconSize",void 0),D([i()],z.prototype,"background",void 0),D([i({type:Boolean})],z.prototype,"border",void 0),D([i()],z.prototype,"borderColor",void 0),D([i()],z.prototype,"icon",void 0),z=D([y("wui-icon-box")],z);const I=o`
  :host {
    display: block;
    width: var(--local-width);
    height: var(--local-height);
  }

  img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center center;
    border-radius: inherit;
  }
`;var $=function(t,a,e,r){var o,i=arguments.length,n=i<3?a:null===r?r=Object.getOwnPropertyDescriptor(a,e):r;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)n=Reflect.decorate(t,a,e,r);else for(var s=t.length-1;s>=0;s--)(o=t[s])&&(n=(i<3?o(n):i>3?o(a,e,n):o(a,e))||n);return i>3&&n&&Object.defineProperty(a,e,n),n};let V=class extends n{constructor(){super(...arguments),this.src="./path/to/image.jpg",this.alt="Image",this.size=void 0}render(){return this.style.cssText=`\n      --local-width: ${this.size?`var(--wui-icon-size-${this.size});`:"100%"};\n      --local-height: ${this.size?`var(--wui-icon-size-${this.size});`:"100%"};\n      `,s`<img src=${this.src} alt=${this.alt} @error=${this.handleImageError} />`}handleImageError(){this.dispatchEvent(new CustomEvent("onLoadError",{bubbles:!0,composed:!0}))}};V.styles=[l,g,I],$([i()],V.prototype,"src",void 0),$([i()],V.prototype,"alt",void 0),$([i()],V.prototype,"size",void 0),V=$([y("wui-image")],V);const A=o`
  :host {
    display: flex;
    justify-content: center;
    align-items: center;
    height: var(--wui-spacing-m);
    padding: 0 var(--wui-spacing-3xs) !important;
    border-radius: var(--wui-border-radius-5xs);
    transition:
      border-radius var(--wui-duration-lg) var(--wui-ease-out-power-1),
      background-color var(--wui-duration-lg) var(--wui-ease-out-power-1);
    will-change: border-radius, background-color;
  }

  :host > wui-text {
    transform: translateY(5%);
  }

  :host([data-variant='main']) {
    background-color: var(--wui-color-accent-glass-015);
    color: var(--wui-color-accent-100);
  }

  :host([data-variant='shade']) {
    background-color: var(--wui-color-gray-glass-010);
    color: var(--wui-color-fg-200);
  }

  :host([data-variant='success']) {
    background-color: var(--wui-icon-box-bg-success-100);
    color: var(--wui-color-success-100);
  }

  :host([data-variant='error']) {
    background-color: var(--wui-icon-box-bg-error-100);
    color: var(--wui-color-error-100);
  }

  :host([data-size='lg']) {
    padding: 11px 5px !important;
  }

  :host([data-size='lg']) > wui-text {
    transform: translateY(2%);
  }
`;var C=function(t,a,e,r){var o,i=arguments.length,n=i<3?a:null===r?r=Object.getOwnPropertyDescriptor(a,e):r;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)n=Reflect.decorate(t,a,e,r);else for(var s=t.length-1;s>=0;s--)(o=t[s])&&(n=(i<3?o(n):i>3?o(a,e,n):o(a,e))||n);return i>3&&n&&Object.defineProperty(a,e,n),n};let B=class extends n{constructor(){super(...arguments),this.variant="main",this.size="lg"}render(){this.dataset.variant=this.variant,this.dataset.size=this.size;const t="md"===this.size?"mini-700":"micro-700";return s`
      <wui-text data-variant=${this.variant} variant=${t} color="inherit">
        <slot></slot>
      </wui-text>
    `}};B.styles=[l,A],C([i()],B.prototype,"variant",void 0),C([i()],B.prototype,"size",void 0),B=C([y("wui-tag")],B);const H=o`
  :host {
    display: flex;
  }

  :host([data-size='sm']) > svg {
    width: 12px;
    height: 12px;
  }

  :host([data-size='md']) > svg {
    width: 16px;
    height: 16px;
  }

  :host([data-size='lg']) > svg {
    width: 24px;
    height: 24px;
  }

  :host([data-size='xl']) > svg {
    width: 32px;
    height: 32px;
  }

  svg {
    animation: rotate 2s linear infinite;
  }

  circle {
    fill: none;
    stroke: var(--local-color);
    stroke-width: 4px;
    stroke-dasharray: 1, 124;
    stroke-dashoffset: 0;
    stroke-linecap: round;
    animation: dash 1.5s ease-in-out infinite;
  }

  :host([data-size='md']) > svg > circle {
    stroke-width: 6px;
  }

  :host([data-size='sm']) > svg > circle {
    stroke-width: 8px;
  }

  @keyframes rotate {
    100% {
      transform: rotate(360deg);
    }
  }

  @keyframes dash {
    0% {
      stroke-dasharray: 1, 124;
      stroke-dashoffset: 0;
    }

    50% {
      stroke-dasharray: 90, 124;
      stroke-dashoffset: -35;
    }

    100% {
      stroke-dashoffset: -125;
    }
  }
`;var M=function(t,a,e,r){var o,i=arguments.length,n=i<3?a:null===r?r=Object.getOwnPropertyDescriptor(a,e):r;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)n=Reflect.decorate(t,a,e,r);else for(var s=t.length-1;s>=0;s--)(o=t[s])&&(n=(i<3?o(n):i>3?o(a,e,n):o(a,e))||n);return i>3&&n&&Object.defineProperty(a,e,n),n};let F=class extends n{constructor(){super(...arguments),this.color="accent-100",this.size="lg"}render(){return this.style.cssText="--local-color: "+("inherit"===this.color?"inherit":`var(--wui-color-${this.color})`),this.dataset.size=this.size,s`<svg viewBox="25 25 50 50">
      <circle r="20" cy="50" cx="50"></circle>
    </svg>`}};F.styles=[l,H],M([i()],F.prototype,"color",void 0),M([i()],F.prototype,"size",void 0),F=M([y("wui-loading-spinner")],F);export{m as U,y as c};
