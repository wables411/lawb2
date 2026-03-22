const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/add-wMOT7yJU.js","assets/index-OpbypVz_.js","assets/wagmi-vendor-Sv5HvNCH.js","assets/ui-vendor-GwtnLNQ7.js","assets/chess-vendor-C25K65co.js","assets/index-CJgu2NYH.css","assets/all-wallets-BIqgjf5o.js","assets/arrow-bottom-circle-Dg8nFMxH.js","assets/app-store-D-V5cTR3.js","assets/apple-D_ZqGsNk.js","assets/arrow-bottom-Bv_FvoPk.js","assets/arrow-left-DBhgUAs8.js","assets/arrow-right-nEvlEFoD.js","assets/arrow-top-DdHOjqYk.js","assets/bank-B-KLz_Lg.js","assets/browser-CXPsUs3w.js","assets/card-wQGhOPU2.js","assets/checkmark-CPC7tCVd.js","assets/checkmark-bold-BEgg5Yxq.js","assets/chevron-bottom-DShvlUDX.js","assets/chevron-left-BMUXeG71.js","assets/chevron-right-DkGHepiw.js","assets/chevron-top-Ci1OrHuH.js","assets/chrome-store-DQI6e32y.js","assets/clock-CyRcqbag.js","assets/close-DAs3DvEg.js","assets/compass-CbTDJHVm.js","assets/coinPlaceholder-IJK68PlA.js","assets/copy-AaCtJyz8.js","assets/cursor-C6ytbugI.js","assets/cursor-transparent-CtF07Xqg.js","assets/desktop-ZyZtGrBH.js","assets/disconnect-DgRi_90g.js","assets/discord-4_y3s67U.js","assets/etherscan-DKd6NEf7.js","assets/extension-CtK7sYpg.js","assets/external-link-Dy2iPxKr.js","assets/facebook-DaD3UocR.js","assets/farcaster-Jw5TEpX1.js","assets/filters-CNtFOQmP.js","assets/github-DKZD5k1r.js","assets/google-CaNZiB_E.js","assets/help-circle-65xR7mkY.js","assets/image-DRobiNMr.js","assets/id-47oMB1Vo.js","assets/info-circle-BkLC6t6-.js","assets/lightbulb-2veYnLhz.js","assets/mail-CXRiXOAg.js","assets/mobile-BwiilPux.js","assets/more-B3o9UmmO.js","assets/network-placeholder-BppoYkJI.js","assets/nftPlaceholder-7uTf7lWd.js","assets/off-D6l8YvM2.js","assets/play-store-yxHKWDec.js","assets/plus-ivsL4vGT.js","assets/qr-code--Ai_85jE.js","assets/recycle-horizontal-D3ihVcTb.js","assets/refresh-ChzqudTW.js","assets/search-DCuDsO_B.js","assets/send-BClhhstQ.js","assets/swapHorizontal-Bq9W9pCv.js","assets/swapHorizontalMedium-Cx1EDJ-U.js","assets/swapHorizontalBold-D0q6bsD_.js","assets/swapHorizontalRoundedBold-cNFOQQQt.js","assets/swapVertical-CB84CyO5.js","assets/telegram-DlMQQDRn.js","assets/three-dots-BpVzsdMp.js","assets/twitch-dYks2tkA.js","assets/x-DvgBM0i8.js","assets/twitterIcon-gD7ES-TT.js","assets/verify-CXCksGIB.js","assets/verify-filled-CpxgE_se.js","assets/wallet-AovSDRco.js","assets/walletconnect-1-3IYj7H.js","assets/wallet-placeholder-Ruj9fpCJ.js","assets/warning-circle-CaQGNpRT.js","assets/info-Tazvq48O.js","assets/exclamation-triangle-D9TKQ1bj.js","assets/reown-logo-BzGUL5Vu.js"])))=>i.map(i=>d[i]);
import{a1 as t,U as a,X as e,Y as r,aE as o,aF as i,aG as n,aH as s,aI as c}from"./index-OpbypVz_.js";import{r as l,c as g,e as w}from"./core-sbHsey_K.js";import{_ as p}from"./wagmi-vendor-Sv5HvNCH.js";const v={getSpacingStyles:(t,a)=>Array.isArray(t)?t[a]?`var(--wui-spacing-${t[a]})`:void 0:"string"==typeof t?`var(--wui-spacing-${t})`:void 0,getFormattedDate:t=>new Intl.DateTimeFormat("en-US",{month:"short",day:"numeric"}).format(t),getHostName(t){try{return new URL(t).hostname}catch(a){return""}},getTruncateString:({string:t,charsStart:a,charsEnd:e,truncate:r})=>t.length<=a+e?t:"end"===r?`${t.substring(0,a)}...`:"start"===r?`...${t.substring(t.length-e)}`:`${t.substring(0,Math.floor(a))}...${t.substring(t.length-Math.floor(e))}`,generateAvatarColors(t){const a=t.toLowerCase().replace(/^0x/iu,"").replace(/[^a-f0-9]/gu,"").substring(0,6).padEnd(6,"0"),e=this.hexToRgb(a),r=getComputedStyle(document.documentElement).getPropertyValue("--w3m-border-radius-master"),o=100-3*Number(null==r?void 0:r.replace("px","")),i=`${o}% ${o}% at 65% 40%`,n=[];for(let s=0;s<5;s+=1){const t=this.tintColor(e,.15*s);n.push(`rgb(${t[0]}, ${t[1]}, ${t[2]})`)}return`\n    --local-color-1: ${n[0]};\n    --local-color-2: ${n[1]};\n    --local-color-3: ${n[2]};\n    --local-color-4: ${n[3]};\n    --local-color-5: ${n[4]};\n    --local-radial-circle: ${i}\n   `},hexToRgb(t){const a=parseInt(t,16);return[a>>16&255,a>>8&255,255&a]},tintColor(t,a){const[e,r,o]=t;return[Math.round(e+(255-e)*a),Math.round(r+(255-r)*a),Math.round(o+(255-o)*a)]},isNumber:t=>/^[0-9]+$/u.test(t),getColorTheme(t){var a;return t||("undefined"!=typeof window&&window.matchMedia?(null==(a=window.matchMedia("(prefers-color-scheme: dark)"))?void 0:a.matches)?"dark":"light":"dark")},splitBalance(t){const a=t.split(".");return 2===a.length?[a[0],a[1]]:["0","00"]},roundNumber:(t,a,e)=>t.toString().length>=a?Number(t).toFixed(e):t,formatNumberToLocalString:(t,a=2)=>void 0===t?"0.00":"number"==typeof t?t.toLocaleString("en-US",{maximumFractionDigits:a,minimumFractionDigits:a}):parseFloat(t).toLocaleString("en-US",{maximumFractionDigits:a,minimumFractionDigits:a})};function h(t){return function(a){return"function"==typeof a?function(t,a){return customElements.get(t)||customElements.define(t,a),a}(t,a):function(t,a){const{kind:e,elements:r}=a;return{kind:e,elements:r,finisher(a){customElements.get(t)||customElements.define(t,a)}}}(t,a)}}const u=t`
  :host {
    display: flex;
    width: inherit;
    height: inherit;
  }
`;var d=function(t,a,e,r){var o,i=arguments.length,n=i<3?a:null===r?r=Object.getOwnPropertyDescriptor(a,e):r;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)n=Reflect.decorate(t,a,e,r);else for(var s=t.length-1;s>=0;s--)(o=t[s])&&(n=(i<3?o(n):i>3?o(a,e,n):o(a,e))||n);return i>3&&n&&Object.defineProperty(a,e,n),n};let _=class extends e{render(){return this.style.cssText=`\n      flex-direction: ${this.flexDirection};\n      flex-wrap: ${this.flexWrap};\n      flex-basis: ${this.flexBasis};\n      flex-grow: ${this.flexGrow};\n      flex-shrink: ${this.flexShrink};\n      align-items: ${this.alignItems};\n      justify-content: ${this.justifyContent};\n      column-gap: ${this.columnGap&&`var(--wui-spacing-${this.columnGap})`};\n      row-gap: ${this.rowGap&&`var(--wui-spacing-${this.rowGap})`};\n      gap: ${this.gap&&`var(--wui-spacing-${this.gap})`};\n      padding-top: ${this.padding&&v.getSpacingStyles(this.padding,0)};\n      padding-right: ${this.padding&&v.getSpacingStyles(this.padding,1)};\n      padding-bottom: ${this.padding&&v.getSpacingStyles(this.padding,2)};\n      padding-left: ${this.padding&&v.getSpacingStyles(this.padding,3)};\n      margin-top: ${this.margin&&v.getSpacingStyles(this.margin,0)};\n      margin-right: ${this.margin&&v.getSpacingStyles(this.margin,1)};\n      margin-bottom: ${this.margin&&v.getSpacingStyles(this.margin,2)};\n      margin-left: ${this.margin&&v.getSpacingStyles(this.margin,3)};\n    `,r`<slot></slot>`}};_.styles=[l,u],d([a()],_.prototype,"flexDirection",void 0),d([a()],_.prototype,"flexWrap",void 0),d([a()],_.prototype,"flexBasis",void 0),d([a()],_.prototype,"flexGrow",void 0),d([a()],_.prototype,"flexShrink",void 0),d([a()],_.prototype,"alignItems",void 0),d([a()],_.prototype,"justifyContent",void 0),d([a()],_.prototype,"columnGap",void 0),d([a()],_.prototype,"rowGap",void 0),d([a()],_.prototype,"gap",void 0),d([a()],_.prototype,"padding",void 0),d([a()],_.prototype,"margin",void 0),_=d([h("wui-flex")],_);
/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
class m{constructor(t){this.G=t}disconnect(){this.G=void 0}reconnect(t){this.G=t}deref(){return this.G}}class y{constructor(){this.Y=void 0,this.Z=void 0}get(){return this.Y}pause(){this.Y??(this.Y=new Promise(t=>this.Z=t))}resume(){var t;null==(t=this.Z)||t.call(this),this.Y=this.Z=void 0}}
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const f=t=>!s(t)&&"function"==typeof t.then,S=1073741823;const b=o(class extends i{constructor(){super(...arguments),this._$Cwt=S,this._$Cbt=[],this._$CK=new m(this),this._$CX=new y}render(...t){return t.find(t=>!f(t))??n}update(t,a){const e=this._$Cbt;let r=e.length;this._$Cbt=a;const o=this._$CK,i=this._$CX;this.isConnected||this.disconnected();for(let n=0;n<a.length&&!(n>this._$Cwt);n++){const t=a[n];if(!f(t))return this._$Cwt=n,t;n<r&&t===e[n]||(this._$Cwt=S,r=0,Promise.resolve(t).then(async a=>{for(;i.get();)await i.get();const e=o.deref();if(void 0!==e){const r=e._$Cbt.indexOf(t);r>-1&&r<e._$Cwt&&(e._$Cwt=r,e.setValue(a))}}))}return n}disconnected(){this._$CK.disconnect(),this._$CX.pause()}reconnected(){this._$CK.reconnect(this),this._$CX.resume()}});const E=new class{constructor(){this.cache=new Map}set(t,a){this.cache.set(t,a)}get(t){return this.cache.get(t)}has(t){return this.cache.has(t)}delete(t){this.cache.delete(t)}clear(){this.cache.clear()}},x=t`
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
`;var R=function(t,a,e,r){var o,i=arguments.length,n=i<3?a:null===r?r=Object.getOwnPropertyDescriptor(a,e):r;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)n=Reflect.decorate(t,a,e,r);else for(var s=t.length-1;s>=0;s--)(o=t[s])&&(n=(i<3?o(n):i>3?o(a,e,n):o(a,e))||n);return i>3&&n&&Object.defineProperty(a,e,n),n};const P={add:async()=>(await p(async()=>{const{addSvg:t}=await import("./add-wMOT7yJU.js");return{addSvg:t}},__vite__mapDeps([0,1,2,3,4,5]))).addSvg,allWallets:async()=>(await p(async()=>{const{allWalletsSvg:t}=await import("./all-wallets-BIqgjf5o.js");return{allWalletsSvg:t}},__vite__mapDeps([6,1,2,3,4,5]))).allWalletsSvg,arrowBottomCircle:async()=>(await p(async()=>{const{arrowBottomCircleSvg:t}=await import("./arrow-bottom-circle-Dg8nFMxH.js");return{arrowBottomCircleSvg:t}},__vite__mapDeps([7,1,2,3,4,5]))).arrowBottomCircleSvg,appStore:async()=>(await p(async()=>{const{appStoreSvg:t}=await import("./app-store-D-V5cTR3.js");return{appStoreSvg:t}},__vite__mapDeps([8,1,2,3,4,5]))).appStoreSvg,apple:async()=>(await p(async()=>{const{appleSvg:t}=await import("./apple-D_ZqGsNk.js");return{appleSvg:t}},__vite__mapDeps([9,1,2,3,4,5]))).appleSvg,arrowBottom:async()=>(await p(async()=>{const{arrowBottomSvg:t}=await import("./arrow-bottom-Bv_FvoPk.js");return{arrowBottomSvg:t}},__vite__mapDeps([10,1,2,3,4,5]))).arrowBottomSvg,arrowLeft:async()=>(await p(async()=>{const{arrowLeftSvg:t}=await import("./arrow-left-DBhgUAs8.js");return{arrowLeftSvg:t}},__vite__mapDeps([11,1,2,3,4,5]))).arrowLeftSvg,arrowRight:async()=>(await p(async()=>{const{arrowRightSvg:t}=await import("./arrow-right-nEvlEFoD.js");return{arrowRightSvg:t}},__vite__mapDeps([12,1,2,3,4,5]))).arrowRightSvg,arrowTop:async()=>(await p(async()=>{const{arrowTopSvg:t}=await import("./arrow-top-DdHOjqYk.js");return{arrowTopSvg:t}},__vite__mapDeps([13,1,2,3,4,5]))).arrowTopSvg,bank:async()=>(await p(async()=>{const{bankSvg:t}=await import("./bank-B-KLz_Lg.js");return{bankSvg:t}},__vite__mapDeps([14,1,2,3,4,5]))).bankSvg,browser:async()=>(await p(async()=>{const{browserSvg:t}=await import("./browser-CXPsUs3w.js");return{browserSvg:t}},__vite__mapDeps([15,1,2,3,4,5]))).browserSvg,card:async()=>(await p(async()=>{const{cardSvg:t}=await import("./card-wQGhOPU2.js");return{cardSvg:t}},__vite__mapDeps([16,1,2,3,4,5]))).cardSvg,checkmark:async()=>(await p(async()=>{const{checkmarkSvg:t}=await import("./checkmark-CPC7tCVd.js");return{checkmarkSvg:t}},__vite__mapDeps([17,1,2,3,4,5]))).checkmarkSvg,checkmarkBold:async()=>(await p(async()=>{const{checkmarkBoldSvg:t}=await import("./checkmark-bold-BEgg5Yxq.js");return{checkmarkBoldSvg:t}},__vite__mapDeps([18,1,2,3,4,5]))).checkmarkBoldSvg,chevronBottom:async()=>(await p(async()=>{const{chevronBottomSvg:t}=await import("./chevron-bottom-DShvlUDX.js");return{chevronBottomSvg:t}},__vite__mapDeps([19,1,2,3,4,5]))).chevronBottomSvg,chevronLeft:async()=>(await p(async()=>{const{chevronLeftSvg:t}=await import("./chevron-left-BMUXeG71.js");return{chevronLeftSvg:t}},__vite__mapDeps([20,1,2,3,4,5]))).chevronLeftSvg,chevronRight:async()=>(await p(async()=>{const{chevronRightSvg:t}=await import("./chevron-right-DkGHepiw.js");return{chevronRightSvg:t}},__vite__mapDeps([21,1,2,3,4,5]))).chevronRightSvg,chevronTop:async()=>(await p(async()=>{const{chevronTopSvg:t}=await import("./chevron-top-Ci1OrHuH.js");return{chevronTopSvg:t}},__vite__mapDeps([22,1,2,3,4,5]))).chevronTopSvg,chromeStore:async()=>(await p(async()=>{const{chromeStoreSvg:t}=await import("./chrome-store-DQI6e32y.js");return{chromeStoreSvg:t}},__vite__mapDeps([23,1,2,3,4,5]))).chromeStoreSvg,clock:async()=>(await p(async()=>{const{clockSvg:t}=await import("./clock-CyRcqbag.js");return{clockSvg:t}},__vite__mapDeps([24,1,2,3,4,5]))).clockSvg,close:async()=>(await p(async()=>{const{closeSvg:t}=await import("./close-DAs3DvEg.js");return{closeSvg:t}},__vite__mapDeps([25,1,2,3,4,5]))).closeSvg,compass:async()=>(await p(async()=>{const{compassSvg:t}=await import("./compass-CbTDJHVm.js");return{compassSvg:t}},__vite__mapDeps([26,1,2,3,4,5]))).compassSvg,coinPlaceholder:async()=>(await p(async()=>{const{coinPlaceholderSvg:t}=await import("./coinPlaceholder-IJK68PlA.js");return{coinPlaceholderSvg:t}},__vite__mapDeps([27,1,2,3,4,5]))).coinPlaceholderSvg,copy:async()=>(await p(async()=>{const{copySvg:t}=await import("./copy-AaCtJyz8.js");return{copySvg:t}},__vite__mapDeps([28,1,2,3,4,5]))).copySvg,cursor:async()=>(await p(async()=>{const{cursorSvg:t}=await import("./cursor-C6ytbugI.js");return{cursorSvg:t}},__vite__mapDeps([29,1,2,3,4,5]))).cursorSvg,cursorTransparent:async()=>(await p(async()=>{const{cursorTransparentSvg:t}=await import("./cursor-transparent-CtF07Xqg.js");return{cursorTransparentSvg:t}},__vite__mapDeps([30,1,2,3,4,5]))).cursorTransparentSvg,desktop:async()=>(await p(async()=>{const{desktopSvg:t}=await import("./desktop-ZyZtGrBH.js");return{desktopSvg:t}},__vite__mapDeps([31,1,2,3,4,5]))).desktopSvg,disconnect:async()=>(await p(async()=>{const{disconnectSvg:t}=await import("./disconnect-DgRi_90g.js");return{disconnectSvg:t}},__vite__mapDeps([32,1,2,3,4,5]))).disconnectSvg,discord:async()=>(await p(async()=>{const{discordSvg:t}=await import("./discord-4_y3s67U.js");return{discordSvg:t}},__vite__mapDeps([33,1,2,3,4,5]))).discordSvg,etherscan:async()=>(await p(async()=>{const{etherscanSvg:t}=await import("./etherscan-DKd6NEf7.js");return{etherscanSvg:t}},__vite__mapDeps([34,1,2,3,4,5]))).etherscanSvg,extension:async()=>(await p(async()=>{const{extensionSvg:t}=await import("./extension-CtK7sYpg.js");return{extensionSvg:t}},__vite__mapDeps([35,1,2,3,4,5]))).extensionSvg,externalLink:async()=>(await p(async()=>{const{externalLinkSvg:t}=await import("./external-link-Dy2iPxKr.js");return{externalLinkSvg:t}},__vite__mapDeps([36,1,2,3,4,5]))).externalLinkSvg,facebook:async()=>(await p(async()=>{const{facebookSvg:t}=await import("./facebook-DaD3UocR.js");return{facebookSvg:t}},__vite__mapDeps([37,1,2,3,4,5]))).facebookSvg,farcaster:async()=>(await p(async()=>{const{farcasterSvg:t}=await import("./farcaster-Jw5TEpX1.js");return{farcasterSvg:t}},__vite__mapDeps([38,1,2,3,4,5]))).farcasterSvg,filters:async()=>(await p(async()=>{const{filtersSvg:t}=await import("./filters-CNtFOQmP.js");return{filtersSvg:t}},__vite__mapDeps([39,1,2,3,4,5]))).filtersSvg,github:async()=>(await p(async()=>{const{githubSvg:t}=await import("./github-DKZD5k1r.js");return{githubSvg:t}},__vite__mapDeps([40,1,2,3,4,5]))).githubSvg,google:async()=>(await p(async()=>{const{googleSvg:t}=await import("./google-CaNZiB_E.js");return{googleSvg:t}},__vite__mapDeps([41,1,2,3,4,5]))).googleSvg,helpCircle:async()=>(await p(async()=>{const{helpCircleSvg:t}=await import("./help-circle-65xR7mkY.js");return{helpCircleSvg:t}},__vite__mapDeps([42,1,2,3,4,5]))).helpCircleSvg,image:async()=>(await p(async()=>{const{imageSvg:t}=await import("./image-DRobiNMr.js");return{imageSvg:t}},__vite__mapDeps([43,1,2,3,4,5]))).imageSvg,id:async()=>(await p(async()=>{const{idSvg:t}=await import("./id-47oMB1Vo.js");return{idSvg:t}},__vite__mapDeps([44,1,2,3,4,5]))).idSvg,infoCircle:async()=>(await p(async()=>{const{infoCircleSvg:t}=await import("./info-circle-BkLC6t6-.js");return{infoCircleSvg:t}},__vite__mapDeps([45,1,2,3,4,5]))).infoCircleSvg,lightbulb:async()=>(await p(async()=>{const{lightbulbSvg:t}=await import("./lightbulb-2veYnLhz.js");return{lightbulbSvg:t}},__vite__mapDeps([46,1,2,3,4,5]))).lightbulbSvg,mail:async()=>(await p(async()=>{const{mailSvg:t}=await import("./mail-CXRiXOAg.js");return{mailSvg:t}},__vite__mapDeps([47,1,2,3,4,5]))).mailSvg,mobile:async()=>(await p(async()=>{const{mobileSvg:t}=await import("./mobile-BwiilPux.js");return{mobileSvg:t}},__vite__mapDeps([48,1,2,3,4,5]))).mobileSvg,more:async()=>(await p(async()=>{const{moreSvg:t}=await import("./more-B3o9UmmO.js");return{moreSvg:t}},__vite__mapDeps([49,1,2,3,4,5]))).moreSvg,networkPlaceholder:async()=>(await p(async()=>{const{networkPlaceholderSvg:t}=await import("./network-placeholder-BppoYkJI.js");return{networkPlaceholderSvg:t}},__vite__mapDeps([50,1,2,3,4,5]))).networkPlaceholderSvg,nftPlaceholder:async()=>(await p(async()=>{const{nftPlaceholderSvg:t}=await import("./nftPlaceholder-7uTf7lWd.js");return{nftPlaceholderSvg:t}},__vite__mapDeps([51,1,2,3,4,5]))).nftPlaceholderSvg,off:async()=>(await p(async()=>{const{offSvg:t}=await import("./off-D6l8YvM2.js");return{offSvg:t}},__vite__mapDeps([52,1,2,3,4,5]))).offSvg,playStore:async()=>(await p(async()=>{const{playStoreSvg:t}=await import("./play-store-yxHKWDec.js");return{playStoreSvg:t}},__vite__mapDeps([53,1,2,3,4,5]))).playStoreSvg,plus:async()=>(await p(async()=>{const{plusSvg:t}=await import("./plus-ivsL4vGT.js");return{plusSvg:t}},__vite__mapDeps([54,1,2,3,4,5]))).plusSvg,qrCode:async()=>(await p(async()=>{const{qrCodeIcon:t}=await import("./qr-code--Ai_85jE.js");return{qrCodeIcon:t}},__vite__mapDeps([55,1,2,3,4,5]))).qrCodeIcon,recycleHorizontal:async()=>(await p(async()=>{const{recycleHorizontalSvg:t}=await import("./recycle-horizontal-D3ihVcTb.js");return{recycleHorizontalSvg:t}},__vite__mapDeps([56,1,2,3,4,5]))).recycleHorizontalSvg,refresh:async()=>(await p(async()=>{const{refreshSvg:t}=await import("./refresh-ChzqudTW.js");return{refreshSvg:t}},__vite__mapDeps([57,1,2,3,4,5]))).refreshSvg,search:async()=>(await p(async()=>{const{searchSvg:t}=await import("./search-DCuDsO_B.js");return{searchSvg:t}},__vite__mapDeps([58,1,2,3,4,5]))).searchSvg,send:async()=>(await p(async()=>{const{sendSvg:t}=await import("./send-BClhhstQ.js");return{sendSvg:t}},__vite__mapDeps([59,1,2,3,4,5]))).sendSvg,swapHorizontal:async()=>(await p(async()=>{const{swapHorizontalSvg:t}=await import("./swapHorizontal-Bq9W9pCv.js");return{swapHorizontalSvg:t}},__vite__mapDeps([60,1,2,3,4,5]))).swapHorizontalSvg,swapHorizontalMedium:async()=>(await p(async()=>{const{swapHorizontalMediumSvg:t}=await import("./swapHorizontalMedium-Cx1EDJ-U.js");return{swapHorizontalMediumSvg:t}},__vite__mapDeps([61,1,2,3,4,5]))).swapHorizontalMediumSvg,swapHorizontalBold:async()=>(await p(async()=>{const{swapHorizontalBoldSvg:t}=await import("./swapHorizontalBold-D0q6bsD_.js");return{swapHorizontalBoldSvg:t}},__vite__mapDeps([62,1,2,3,4,5]))).swapHorizontalBoldSvg,swapHorizontalRoundedBold:async()=>(await p(async()=>{const{swapHorizontalRoundedBoldSvg:t}=await import("./swapHorizontalRoundedBold-cNFOQQQt.js");return{swapHorizontalRoundedBoldSvg:t}},__vite__mapDeps([63,1,2,3,4,5]))).swapHorizontalRoundedBoldSvg,swapVertical:async()=>(await p(async()=>{const{swapVerticalSvg:t}=await import("./swapVertical-CB84CyO5.js");return{swapVerticalSvg:t}},__vite__mapDeps([64,1,2,3,4,5]))).swapVerticalSvg,telegram:async()=>(await p(async()=>{const{telegramSvg:t}=await import("./telegram-DlMQQDRn.js");return{telegramSvg:t}},__vite__mapDeps([65,1,2,3,4,5]))).telegramSvg,threeDots:async()=>(await p(async()=>{const{threeDotsSvg:t}=await import("./three-dots-BpVzsdMp.js");return{threeDotsSvg:t}},__vite__mapDeps([66,1,2,3,4,5]))).threeDotsSvg,twitch:async()=>(await p(async()=>{const{twitchSvg:t}=await import("./twitch-dYks2tkA.js");return{twitchSvg:t}},__vite__mapDeps([67,1,2,3,4,5]))).twitchSvg,twitter:async()=>(await p(async()=>{const{xSvg:t}=await import("./x-DvgBM0i8.js");return{xSvg:t}},__vite__mapDeps([68,1,2,3,4,5]))).xSvg,twitterIcon:async()=>(await p(async()=>{const{twitterIconSvg:t}=await import("./twitterIcon-gD7ES-TT.js");return{twitterIconSvg:t}},__vite__mapDeps([69,1,2,3,4,5]))).twitterIconSvg,verify:async()=>(await p(async()=>{const{verifySvg:t}=await import("./verify-CXCksGIB.js");return{verifySvg:t}},__vite__mapDeps([70,1,2,3,4,5]))).verifySvg,verifyFilled:async()=>(await p(async()=>{const{verifyFilledSvg:t}=await import("./verify-filled-CpxgE_se.js");return{verifyFilledSvg:t}},__vite__mapDeps([71,1,2,3,4,5]))).verifyFilledSvg,wallet:async()=>(await p(async()=>{const{walletSvg:t}=await import("./wallet-AovSDRco.js");return{walletSvg:t}},__vite__mapDeps([72,1,2,3,4,5]))).walletSvg,walletConnect:async()=>(await p(async()=>{const{walletConnectSvg:t}=await import("./walletconnect-1-3IYj7H.js");return{walletConnectSvg:t}},__vite__mapDeps([73,1,2,3,4,5]))).walletConnectSvg,walletConnectLightBrown:async()=>(await p(async()=>{const{walletConnectLightBrownSvg:t}=await import("./walletconnect-1-3IYj7H.js");return{walletConnectLightBrownSvg:t}},__vite__mapDeps([73,1,2,3,4,5]))).walletConnectLightBrownSvg,walletConnectBrown:async()=>(await p(async()=>{const{walletConnectBrownSvg:t}=await import("./walletconnect-1-3IYj7H.js");return{walletConnectBrownSvg:t}},__vite__mapDeps([73,1,2,3,4,5]))).walletConnectBrownSvg,walletPlaceholder:async()=>(await p(async()=>{const{walletPlaceholderSvg:t}=await import("./wallet-placeholder-Ruj9fpCJ.js");return{walletPlaceholderSvg:t}},__vite__mapDeps([74,1,2,3,4,5]))).walletPlaceholderSvg,warningCircle:async()=>(await p(async()=>{const{warningCircleSvg:t}=await import("./warning-circle-CaQGNpRT.js");return{warningCircleSvg:t}},__vite__mapDeps([75,1,2,3,4,5]))).warningCircleSvg,x:async()=>(await p(async()=>{const{xSvg:t}=await import("./x-DvgBM0i8.js");return{xSvg:t}},__vite__mapDeps([68,1,2,3,4,5]))).xSvg,info:async()=>(await p(async()=>{const{infoSvg:t}=await import("./info-Tazvq48O.js");return{infoSvg:t}},__vite__mapDeps([76,1,2,3,4,5]))).infoSvg,exclamationTriangle:async()=>(await p(async()=>{const{exclamationTriangleSvg:t}=await import("./exclamation-triangle-D9TKQ1bj.js");return{exclamationTriangleSvg:t}},__vite__mapDeps([77,1,2,3,4,5]))).exclamationTriangleSvg,reown:async()=>(await p(async()=>{const{reownSvg:t}=await import("./reown-logo-BzGUL5Vu.js");return{reownSvg:t}},__vite__mapDeps([78,1,2,3,4,5]))).reownSvg};let j=class extends e{constructor(){super(...arguments),this.size="md",this.name="copy",this.color="fg-300",this.aspectRatio="1 / 1"}render(){return this.style.cssText=`\n      --local-color: var(--wui-color-${this.color});\n      --local-width: var(--wui-icon-size-${this.size});\n      --local-aspect-ratio: ${this.aspectRatio}\n    `,r`${b(async function(t){if(E.has(t))return E.get(t);const a=(P[t]??P.copy)();return E.set(t,a),a}(this.name),r`<div class="fallback"></div>`)}`}};j.styles=[l,g,x],R([a()],j.prototype,"size",void 0),R([a()],j.prototype,"name",void 0),R([a()],j.prototype,"color",void 0),R([a()],j.prototype,"aspectRatio",void 0),j=R([h("wui-icon")],j);const k=t`
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
`;var T=function(t,a,e,r){var o,i=arguments.length,n=i<3?a:null===r?r=Object.getOwnPropertyDescriptor(a,e):r;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)n=Reflect.decorate(t,a,e,r);else for(var s=t.length-1;s>=0;s--)(o=t[s])&&(n=(i<3?o(n):i>3?o(a,e,n):o(a,e))||n);return i>3&&n&&Object.defineProperty(a,e,n),n};let L=class extends e{constructor(){super(...arguments),this.variant="paragraph-500",this.color="fg-300",this.align="left",this.lineClamp=void 0}render(){const t={[`wui-font-${this.variant}`]:!0,[`wui-color-${this.color}`]:!0,[`wui-line-clamp-${this.lineClamp}`]:!!this.lineClamp};return this.style.cssText=`\n      --local-align: ${this.align};\n      --local-color: var(--wui-color-${this.color});\n    `,r`<slot class=${c(t)}></slot>`}};L.styles=[l,k],T([a()],L.prototype,"variant",void 0),T([a()],L.prototype,"color",void 0),T([a()],L.prototype,"align",void 0),T([a()],L.prototype,"lineClamp",void 0),L=T([h("wui-text")],L);const O=t`
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
`;var D=function(t,a,e,r){var o,i=arguments.length,n=i<3?a:null===r?r=Object.getOwnPropertyDescriptor(a,e):r;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)n=Reflect.decorate(t,a,e,r);else for(var s=t.length-1;s>=0;s--)(o=t[s])&&(n=(i<3?o(n):i>3?o(a,e,n):o(a,e))||n);return i>3&&n&&Object.defineProperty(a,e,n),n};let I=class extends e{constructor(){super(...arguments),this.size="md",this.backgroundColor="accent-100",this.iconColor="accent-100",this.background="transparent",this.border=!1,this.borderColor="wui-color-bg-125",this.icon="copy"}render(){const t=this.iconSize||this.size,a="lg"===this.size,e="xl"===this.size,o=a?"12%":"16%",i=a?"xxs":e?"s":"3xl",n="gray"===this.background,s="opaque"===this.background,c="accent-100"===this.backgroundColor&&s||"success-100"===this.backgroundColor&&s||"error-100"===this.backgroundColor&&s||"inverse-100"===this.backgroundColor&&s;let l=`var(--wui-color-${this.backgroundColor})`;return c?l=`var(--wui-icon-box-bg-${this.backgroundColor})`:n&&(l=`var(--wui-color-gray-${this.backgroundColor})`),this.style.cssText=`\n       --local-bg-value: ${l};\n       --local-bg-mix: ${c||n?"100%":o};\n       --local-border-radius: var(--wui-border-radius-${i});\n       --local-size: var(--wui-icon-box-size-${this.size});\n       --local-border: ${"wui-color-bg-125"===this.borderColor?"2px":"1px"} solid ${this.border?`var(--${this.borderColor})`:"transparent"}\n   `,r` <wui-icon color=${this.iconColor} size=${t} name=${this.icon}></wui-icon> `}};I.styles=[l,w,O],D([a()],I.prototype,"size",void 0),D([a()],I.prototype,"backgroundColor",void 0),D([a()],I.prototype,"iconColor",void 0),D([a()],I.prototype,"iconSize",void 0),D([a()],I.prototype,"background",void 0),D([a({type:Boolean})],I.prototype,"border",void 0),D([a()],I.prototype,"borderColor",void 0),D([a()],I.prototype,"icon",void 0),I=D([h("wui-icon-box")],I);const z=t`
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
`;var $=function(t,a,e,r){var o,i=arguments.length,n=i<3?a:null===r?r=Object.getOwnPropertyDescriptor(a,e):r;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)n=Reflect.decorate(t,a,e,r);else for(var s=t.length-1;s>=0;s--)(o=t[s])&&(n=(i<3?o(n):i>3?o(a,e,n):o(a,e))||n);return i>3&&n&&Object.defineProperty(a,e,n),n};let V=class extends e{constructor(){super(...arguments),this.src="./path/to/image.jpg",this.alt="Image",this.size=void 0}render(){return this.style.cssText=`\n      --local-width: ${this.size?`var(--wui-icon-size-${this.size});`:"100%"};\n      --local-height: ${this.size?`var(--wui-icon-size-${this.size});`:"100%"};\n      `,r`<img src=${this.src} alt=${this.alt} @error=${this.handleImageError} />`}handleImageError(){this.dispatchEvent(new CustomEvent("onLoadError",{bubbles:!0,composed:!0}))}};V.styles=[l,g,z],$([a()],V.prototype,"src",void 0),$([a()],V.prototype,"alt",void 0),$([a()],V.prototype,"size",void 0),V=$([h("wui-image")],V);const A=t`
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
`;var C=function(t,a,e,r){var o,i=arguments.length,n=i<3?a:null===r?r=Object.getOwnPropertyDescriptor(a,e):r;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)n=Reflect.decorate(t,a,e,r);else for(var s=t.length-1;s>=0;s--)(o=t[s])&&(n=(i<3?o(n):i>3?o(a,e,n):o(a,e))||n);return i>3&&n&&Object.defineProperty(a,e,n),n};let B=class extends e{constructor(){super(...arguments),this.variant="main",this.size="lg"}render(){this.dataset.variant=this.variant,this.dataset.size=this.size;const t="md"===this.size?"mini-700":"micro-700";return r`
      <wui-text data-variant=${this.variant} variant=${t} color="inherit">
        <slot></slot>
      </wui-text>
    `}};B.styles=[l,A],C([a()],B.prototype,"variant",void 0),C([a()],B.prototype,"size",void 0),B=C([h("wui-tag")],B);const H=t`
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
`;var F=function(t,a,e,r){var o,i=arguments.length,n=i<3?a:null===r?r=Object.getOwnPropertyDescriptor(a,e):r;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)n=Reflect.decorate(t,a,e,r);else for(var s=t.length-1;s>=0;s--)(o=t[s])&&(n=(i<3?o(n):i>3?o(a,e,n):o(a,e))||n);return i>3&&n&&Object.defineProperty(a,e,n),n};let G=class extends e{constructor(){super(...arguments),this.color="accent-100",this.size="lg"}render(){return this.style.cssText="--local-color: "+("inherit"===this.color?"inherit":`var(--wui-color-${this.color})`),this.dataset.size=this.size,r`<svg viewBox="25 25 50 50">
      <circle r="20" cy="50" cx="50"></circle>
    </svg>`}};G.styles=[l,H],F([a()],G.prototype,"color",void 0),F([a()],G.prototype,"size",void 0),G=F([h("wui-loading-spinner")],G);export{v as U,h as c};
