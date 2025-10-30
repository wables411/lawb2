const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/add-DaG5DsVp.js","assets/index-FICmtEPc.js","assets/wagmi-vendor-Bzrt1iI4.js","assets/react-vendor-CFG7hIzY.js","assets/chess-vendor-Bf0-dA_p.js","assets/ui-vendor-mkN-aWYF.js","assets/index-DCUXUex1.css","assets/all-wallets-Bdp5VW8k.js","assets/arrow-bottom-circle-BMSdeM2r.js","assets/app-store-B60QxunJ.js","assets/apple-Cgj58hnU.js","assets/arrow-bottom-0XcnriRS.js","assets/arrow-left-CJo6vF_0.js","assets/arrow-right-Dm4OFtB-.js","assets/arrow-top-DoOid3Is.js","assets/bank-CA5R2Xol.js","assets/browser-Dl15PvS8.js","assets/card-NgBK415y.js","assets/checkmark-v0i3veMN.js","assets/checkmark-bold-DZNNrd1A.js","assets/chevron-bottom-BeXmB5j8.js","assets/chevron-left-qVmnvDOr.js","assets/chevron-right-CzYVQ5ij.js","assets/chevron-top-ClDD7I0e.js","assets/chrome-store-ByrdU6vR.js","assets/clock-8zodnf3Y.js","assets/close-jv2fVNNV.js","assets/compass-DmLXZdhp.js","assets/coinPlaceholder-BwiKOyry.js","assets/copy-CeFnyPAA.js","assets/cursor-Cz8XQ4R_.js","assets/cursor-transparent-Bne_niYt.js","assets/desktop-BACAGYQr.js","assets/disconnect-Cemyr3bI.js","assets/discord-CWb_ZG3O.js","assets/etherscan-Z4aR30-Y.js","assets/extension-BnzQTRtZ.js","assets/external-link-CG8eiLKv.js","assets/facebook-BLLjw51G.js","assets/farcaster-C2J589zv.js","assets/filters-BcPlBDVp.js","assets/github-CXN7F2q4.js","assets/google-IQadYmZG.js","assets/help-circle-CdCKuCco.js","assets/image-DXPJFYXf.js","assets/id-DWQVnVkY.js","assets/info-circle-C-UDulO4.js","assets/lightbulb-DQ1dcbgB.js","assets/mail-CmIbyti9.js","assets/mobile-XiQarPpT.js","assets/more-jY6mc48a.js","assets/network-placeholder-1L5r14Gr.js","assets/nftPlaceholder-CP-nvHsT.js","assets/off-CPTS3g0c.js","assets/play-store-DygLP6uN.js","assets/plus-BwwH-3F8.js","assets/qr-code-BMCRjEbw.js","assets/recycle-horizontal-k72lKJ6R.js","assets/refresh-sT_uwqUL.js","assets/search-CnSzBWkH.js","assets/send-PMVunQC2.js","assets/swapHorizontal-Diwbp3nS.js","assets/swapHorizontalMedium-BO3yJV5d.js","assets/swapHorizontalBold-BvW-UUke.js","assets/swapHorizontalRoundedBold-CIYFalCv.js","assets/swapVertical-Ccqpzw8I.js","assets/telegram-ariGLVX9.js","assets/three-dots-Bwcq6lkp.js","assets/twitch-C1hckqaG.js","assets/x-wRsQSJUd.js","assets/twitterIcon-yZ6gaMup.js","assets/verify-Bwqmm1en.js","assets/verify-filled-BWs9Yurd.js","assets/wallet-Cb2omsN0.js","assets/walletconnect-CLcFx8qk.js","assets/wallet-placeholder-nVQNVYqL.js","assets/warning-circle-CFhDy2n2.js","assets/info-DW572DdY.js","assets/exclamation-triangle-v5wah7Sm.js","assets/reown-logo-CmiLvigu.js"])))=>i.map(i=>d[i]);
import{F as t,G as e,H as a,I as r,R as o,S as i,T as n,U as s,Q as c}from"./index-FICmtEPc.js";import{r as l,k as g,e as w}from"./core-DVil2PsT.js";import{_ as p}from"./wagmi-vendor-Bzrt1iI4.js";const v={getSpacingStyles:(t,e)=>Array.isArray(t)?t[e]?`var(--wui-spacing-${t[e]})`:void 0:"string"==typeof t?`var(--wui-spacing-${t})`:void 0,getFormattedDate:t=>new Intl.DateTimeFormat("en-US",{month:"short",day:"numeric"}).format(t),getHostName(t){try{return new URL(t).hostname}catch(e){return""}},getTruncateString:({string:t,charsStart:e,charsEnd:a,truncate:r})=>t.length<=e+a?t:"end"===r?`${t.substring(0,e)}...`:"start"===r?`...${t.substring(t.length-a)}`:`${t.substring(0,Math.floor(e))}...${t.substring(t.length-Math.floor(a))}`,generateAvatarColors(t){const e=t.toLowerCase().replace(/^0x/iu,"").replace(/[^a-f0-9]/gu,"").substring(0,6).padEnd(6,"0"),a=this.hexToRgb(e),r=getComputedStyle(document.documentElement).getPropertyValue("--w3m-border-radius-master"),o=100-3*Number(null==r?void 0:r.replace("px","")),i=`${o}% ${o}% at 65% 40%`,n=[];for(let s=0;s<5;s+=1){const t=this.tintColor(a,.15*s);n.push(`rgb(${t[0]}, ${t[1]}, ${t[2]})`)}return`\n    --local-color-1: ${n[0]};\n    --local-color-2: ${n[1]};\n    --local-color-3: ${n[2]};\n    --local-color-4: ${n[3]};\n    --local-color-5: ${n[4]};\n    --local-radial-circle: ${i}\n   `},hexToRgb(t){const e=parseInt(t,16);return[e>>16&255,e>>8&255,255&e]},tintColor(t,e){const[a,r,o]=t;return[Math.round(a+(255-a)*e),Math.round(r+(255-r)*e),Math.round(o+(255-o)*e)]},isNumber:t=>/^[0-9]+$/u.test(t),getColorTheme(t){var e;return t||("undefined"!=typeof window&&window.matchMedia?(null==(e=window.matchMedia("(prefers-color-scheme: dark)"))?void 0:e.matches)?"dark":"light":"dark")},splitBalance(t){const e=t.split(".");return 2===e.length?[e[0],e[1]]:["0","00"]},roundNumber:(t,e,a)=>t.toString().length>=e?Number(t).toFixed(a):t,formatNumberToLocalString:(t,e=2)=>void 0===t?"0.00":"number"==typeof t?t.toLocaleString("en-US",{maximumFractionDigits:e,minimumFractionDigits:e}):parseFloat(t).toLocaleString("en-US",{maximumFractionDigits:e,minimumFractionDigits:e})};function h(t){return function(e){return"function"==typeof e?function(t,e){return customElements.get(t)||customElements.define(t,e),e}(t,e):function(t,e){const{kind:a,elements:r}=e;return{kind:a,elements:r,finisher(e){customElements.get(t)||customElements.define(t,e)}}}(t,e)}}const u=t`
  :host {
    display: flex;
    width: inherit;
    height: inherit;
  }
`;var d=function(t,e,a,r){var o,i=arguments.length,n=i<3?e:null===r?r=Object.getOwnPropertyDescriptor(e,a):r;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)n=Reflect.decorate(t,e,a,r);else for(var s=t.length-1;s>=0;s--)(o=t[s])&&(n=(i<3?o(n):i>3?o(e,a,n):o(e,a))||n);return i>3&&n&&Object.defineProperty(e,a,n),n};let _=class extends a{render(){return this.style.cssText=`\n      flex-direction: ${this.flexDirection};\n      flex-wrap: ${this.flexWrap};\n      flex-basis: ${this.flexBasis};\n      flex-grow: ${this.flexGrow};\n      flex-shrink: ${this.flexShrink};\n      align-items: ${this.alignItems};\n      justify-content: ${this.justifyContent};\n      column-gap: ${this.columnGap&&`var(--wui-spacing-${this.columnGap})`};\n      row-gap: ${this.rowGap&&`var(--wui-spacing-${this.rowGap})`};\n      gap: ${this.gap&&`var(--wui-spacing-${this.gap})`};\n      padding-top: ${this.padding&&v.getSpacingStyles(this.padding,0)};\n      padding-right: ${this.padding&&v.getSpacingStyles(this.padding,1)};\n      padding-bottom: ${this.padding&&v.getSpacingStyles(this.padding,2)};\n      padding-left: ${this.padding&&v.getSpacingStyles(this.padding,3)};\n      margin-top: ${this.margin&&v.getSpacingStyles(this.margin,0)};\n      margin-right: ${this.margin&&v.getSpacingStyles(this.margin,1)};\n      margin-bottom: ${this.margin&&v.getSpacingStyles(this.margin,2)};\n      margin-left: ${this.margin&&v.getSpacingStyles(this.margin,3)};\n    `,r`<slot></slot>`}};_.styles=[l,u],d([e()],_.prototype,"flexDirection",void 0),d([e()],_.prototype,"flexWrap",void 0),d([e()],_.prototype,"flexBasis",void 0),d([e()],_.prototype,"flexGrow",void 0),d([e()],_.prototype,"flexShrink",void 0),d([e()],_.prototype,"alignItems",void 0),d([e()],_.prototype,"justifyContent",void 0),d([e()],_.prototype,"columnGap",void 0),d([e()],_.prototype,"rowGap",void 0),d([e()],_.prototype,"gap",void 0),d([e()],_.prototype,"padding",void 0),d([e()],_.prototype,"margin",void 0),_=d([h("wui-flex")],_);
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
 */const f=t=>!s(t)&&"function"==typeof t.then,S=1073741823;const b=o(class extends i{constructor(){super(...arguments),this._$Cwt=S,this._$Cbt=[],this._$CK=new m(this),this._$CX=new y}render(...t){return t.find(t=>!f(t))??n}update(t,e){const a=this._$Cbt;let r=a.length;this._$Cbt=e;const o=this._$CK,i=this._$CX;this.isConnected||this.disconnected();for(let n=0;n<e.length&&!(n>this._$Cwt);n++){const t=e[n];if(!f(t))return this._$Cwt=n,t;n<r&&t===a[n]||(this._$Cwt=S,r=0,Promise.resolve(t).then(async e=>{for(;i.get();)await i.get();const a=o.deref();if(void 0!==a){const r=a._$Cbt.indexOf(t);r>-1&&r<a._$Cwt&&(a._$Cwt=r,a.setValue(e))}}))}return n}disconnected(){this._$CK.disconnect(),this._$CX.pause()}reconnected(){this._$CK.reconnect(this),this._$CX.resume()}});const E=new class{constructor(){this.cache=new Map}set(t,e){this.cache.set(t,e)}get(t){return this.cache.get(t)}has(t){return this.cache.has(t)}delete(t){this.cache.delete(t)}clear(){this.cache.clear()}},x=t`
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
`;var R=function(t,e,a,r){var o,i=arguments.length,n=i<3?e:null===r?r=Object.getOwnPropertyDescriptor(e,a):r;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)n=Reflect.decorate(t,e,a,r);else for(var s=t.length-1;s>=0;s--)(o=t[s])&&(n=(i<3?o(n):i>3?o(e,a,n):o(e,a))||n);return i>3&&n&&Object.defineProperty(e,a,n),n};const P={add:async()=>(await p(async()=>{const{addSvg:t}=await import("./add-DaG5DsVp.js");return{addSvg:t}},__vite__mapDeps([0,1,2,3,4,5,6]))).addSvg,allWallets:async()=>(await p(async()=>{const{allWalletsSvg:t}=await import("./all-wallets-Bdp5VW8k.js");return{allWalletsSvg:t}},__vite__mapDeps([7,1,2,3,4,5,6]))).allWalletsSvg,arrowBottomCircle:async()=>(await p(async()=>{const{arrowBottomCircleSvg:t}=await import("./arrow-bottom-circle-BMSdeM2r.js");return{arrowBottomCircleSvg:t}},__vite__mapDeps([8,1,2,3,4,5,6]))).arrowBottomCircleSvg,appStore:async()=>(await p(async()=>{const{appStoreSvg:t}=await import("./app-store-B60QxunJ.js");return{appStoreSvg:t}},__vite__mapDeps([9,1,2,3,4,5,6]))).appStoreSvg,apple:async()=>(await p(async()=>{const{appleSvg:t}=await import("./apple-Cgj58hnU.js");return{appleSvg:t}},__vite__mapDeps([10,1,2,3,4,5,6]))).appleSvg,arrowBottom:async()=>(await p(async()=>{const{arrowBottomSvg:t}=await import("./arrow-bottom-0XcnriRS.js");return{arrowBottomSvg:t}},__vite__mapDeps([11,1,2,3,4,5,6]))).arrowBottomSvg,arrowLeft:async()=>(await p(async()=>{const{arrowLeftSvg:t}=await import("./arrow-left-CJo6vF_0.js");return{arrowLeftSvg:t}},__vite__mapDeps([12,1,2,3,4,5,6]))).arrowLeftSvg,arrowRight:async()=>(await p(async()=>{const{arrowRightSvg:t}=await import("./arrow-right-Dm4OFtB-.js");return{arrowRightSvg:t}},__vite__mapDeps([13,1,2,3,4,5,6]))).arrowRightSvg,arrowTop:async()=>(await p(async()=>{const{arrowTopSvg:t}=await import("./arrow-top-DoOid3Is.js");return{arrowTopSvg:t}},__vite__mapDeps([14,1,2,3,4,5,6]))).arrowTopSvg,bank:async()=>(await p(async()=>{const{bankSvg:t}=await import("./bank-CA5R2Xol.js");return{bankSvg:t}},__vite__mapDeps([15,1,2,3,4,5,6]))).bankSvg,browser:async()=>(await p(async()=>{const{browserSvg:t}=await import("./browser-Dl15PvS8.js");return{browserSvg:t}},__vite__mapDeps([16,1,2,3,4,5,6]))).browserSvg,card:async()=>(await p(async()=>{const{cardSvg:t}=await import("./card-NgBK415y.js");return{cardSvg:t}},__vite__mapDeps([17,1,2,3,4,5,6]))).cardSvg,checkmark:async()=>(await p(async()=>{const{checkmarkSvg:t}=await import("./checkmark-v0i3veMN.js");return{checkmarkSvg:t}},__vite__mapDeps([18,1,2,3,4,5,6]))).checkmarkSvg,checkmarkBold:async()=>(await p(async()=>{const{checkmarkBoldSvg:t}=await import("./checkmark-bold-DZNNrd1A.js");return{checkmarkBoldSvg:t}},__vite__mapDeps([19,1,2,3,4,5,6]))).checkmarkBoldSvg,chevronBottom:async()=>(await p(async()=>{const{chevronBottomSvg:t}=await import("./chevron-bottom-BeXmB5j8.js");return{chevronBottomSvg:t}},__vite__mapDeps([20,1,2,3,4,5,6]))).chevronBottomSvg,chevronLeft:async()=>(await p(async()=>{const{chevronLeftSvg:t}=await import("./chevron-left-qVmnvDOr.js");return{chevronLeftSvg:t}},__vite__mapDeps([21,1,2,3,4,5,6]))).chevronLeftSvg,chevronRight:async()=>(await p(async()=>{const{chevronRightSvg:t}=await import("./chevron-right-CzYVQ5ij.js");return{chevronRightSvg:t}},__vite__mapDeps([22,1,2,3,4,5,6]))).chevronRightSvg,chevronTop:async()=>(await p(async()=>{const{chevronTopSvg:t}=await import("./chevron-top-ClDD7I0e.js");return{chevronTopSvg:t}},__vite__mapDeps([23,1,2,3,4,5,6]))).chevronTopSvg,chromeStore:async()=>(await p(async()=>{const{chromeStoreSvg:t}=await import("./chrome-store-ByrdU6vR.js");return{chromeStoreSvg:t}},__vite__mapDeps([24,1,2,3,4,5,6]))).chromeStoreSvg,clock:async()=>(await p(async()=>{const{clockSvg:t}=await import("./clock-8zodnf3Y.js");return{clockSvg:t}},__vite__mapDeps([25,1,2,3,4,5,6]))).clockSvg,close:async()=>(await p(async()=>{const{closeSvg:t}=await import("./close-jv2fVNNV.js");return{closeSvg:t}},__vite__mapDeps([26,1,2,3,4,5,6]))).closeSvg,compass:async()=>(await p(async()=>{const{compassSvg:t}=await import("./compass-DmLXZdhp.js");return{compassSvg:t}},__vite__mapDeps([27,1,2,3,4,5,6]))).compassSvg,coinPlaceholder:async()=>(await p(async()=>{const{coinPlaceholderSvg:t}=await import("./coinPlaceholder-BwiKOyry.js");return{coinPlaceholderSvg:t}},__vite__mapDeps([28,1,2,3,4,5,6]))).coinPlaceholderSvg,copy:async()=>(await p(async()=>{const{copySvg:t}=await import("./copy-CeFnyPAA.js");return{copySvg:t}},__vite__mapDeps([29,1,2,3,4,5,6]))).copySvg,cursor:async()=>(await p(async()=>{const{cursorSvg:t}=await import("./cursor-Cz8XQ4R_.js");return{cursorSvg:t}},__vite__mapDeps([30,1,2,3,4,5,6]))).cursorSvg,cursorTransparent:async()=>(await p(async()=>{const{cursorTransparentSvg:t}=await import("./cursor-transparent-Bne_niYt.js");return{cursorTransparentSvg:t}},__vite__mapDeps([31,1,2,3,4,5,6]))).cursorTransparentSvg,desktop:async()=>(await p(async()=>{const{desktopSvg:t}=await import("./desktop-BACAGYQr.js");return{desktopSvg:t}},__vite__mapDeps([32,1,2,3,4,5,6]))).desktopSvg,disconnect:async()=>(await p(async()=>{const{disconnectSvg:t}=await import("./disconnect-Cemyr3bI.js");return{disconnectSvg:t}},__vite__mapDeps([33,1,2,3,4,5,6]))).disconnectSvg,discord:async()=>(await p(async()=>{const{discordSvg:t}=await import("./discord-CWb_ZG3O.js");return{discordSvg:t}},__vite__mapDeps([34,1,2,3,4,5,6]))).discordSvg,etherscan:async()=>(await p(async()=>{const{etherscanSvg:t}=await import("./etherscan-Z4aR30-Y.js");return{etherscanSvg:t}},__vite__mapDeps([35,1,2,3,4,5,6]))).etherscanSvg,extension:async()=>(await p(async()=>{const{extensionSvg:t}=await import("./extension-BnzQTRtZ.js");return{extensionSvg:t}},__vite__mapDeps([36,1,2,3,4,5,6]))).extensionSvg,externalLink:async()=>(await p(async()=>{const{externalLinkSvg:t}=await import("./external-link-CG8eiLKv.js");return{externalLinkSvg:t}},__vite__mapDeps([37,1,2,3,4,5,6]))).externalLinkSvg,facebook:async()=>(await p(async()=>{const{facebookSvg:t}=await import("./facebook-BLLjw51G.js");return{facebookSvg:t}},__vite__mapDeps([38,1,2,3,4,5,6]))).facebookSvg,farcaster:async()=>(await p(async()=>{const{farcasterSvg:t}=await import("./farcaster-C2J589zv.js");return{farcasterSvg:t}},__vite__mapDeps([39,1,2,3,4,5,6]))).farcasterSvg,filters:async()=>(await p(async()=>{const{filtersSvg:t}=await import("./filters-BcPlBDVp.js");return{filtersSvg:t}},__vite__mapDeps([40,1,2,3,4,5,6]))).filtersSvg,github:async()=>(await p(async()=>{const{githubSvg:t}=await import("./github-CXN7F2q4.js");return{githubSvg:t}},__vite__mapDeps([41,1,2,3,4,5,6]))).githubSvg,google:async()=>(await p(async()=>{const{googleSvg:t}=await import("./google-IQadYmZG.js");return{googleSvg:t}},__vite__mapDeps([42,1,2,3,4,5,6]))).googleSvg,helpCircle:async()=>(await p(async()=>{const{helpCircleSvg:t}=await import("./help-circle-CdCKuCco.js");return{helpCircleSvg:t}},__vite__mapDeps([43,1,2,3,4,5,6]))).helpCircleSvg,image:async()=>(await p(async()=>{const{imageSvg:t}=await import("./image-DXPJFYXf.js");return{imageSvg:t}},__vite__mapDeps([44,1,2,3,4,5,6]))).imageSvg,id:async()=>(await p(async()=>{const{idSvg:t}=await import("./id-DWQVnVkY.js");return{idSvg:t}},__vite__mapDeps([45,1,2,3,4,5,6]))).idSvg,infoCircle:async()=>(await p(async()=>{const{infoCircleSvg:t}=await import("./info-circle-C-UDulO4.js");return{infoCircleSvg:t}},__vite__mapDeps([46,1,2,3,4,5,6]))).infoCircleSvg,lightbulb:async()=>(await p(async()=>{const{lightbulbSvg:t}=await import("./lightbulb-DQ1dcbgB.js");return{lightbulbSvg:t}},__vite__mapDeps([47,1,2,3,4,5,6]))).lightbulbSvg,mail:async()=>(await p(async()=>{const{mailSvg:t}=await import("./mail-CmIbyti9.js");return{mailSvg:t}},__vite__mapDeps([48,1,2,3,4,5,6]))).mailSvg,mobile:async()=>(await p(async()=>{const{mobileSvg:t}=await import("./mobile-XiQarPpT.js");return{mobileSvg:t}},__vite__mapDeps([49,1,2,3,4,5,6]))).mobileSvg,more:async()=>(await p(async()=>{const{moreSvg:t}=await import("./more-jY6mc48a.js");return{moreSvg:t}},__vite__mapDeps([50,1,2,3,4,5,6]))).moreSvg,networkPlaceholder:async()=>(await p(async()=>{const{networkPlaceholderSvg:t}=await import("./network-placeholder-1L5r14Gr.js");return{networkPlaceholderSvg:t}},__vite__mapDeps([51,1,2,3,4,5,6]))).networkPlaceholderSvg,nftPlaceholder:async()=>(await p(async()=>{const{nftPlaceholderSvg:t}=await import("./nftPlaceholder-CP-nvHsT.js");return{nftPlaceholderSvg:t}},__vite__mapDeps([52,1,2,3,4,5,6]))).nftPlaceholderSvg,off:async()=>(await p(async()=>{const{offSvg:t}=await import("./off-CPTS3g0c.js");return{offSvg:t}},__vite__mapDeps([53,1,2,3,4,5,6]))).offSvg,playStore:async()=>(await p(async()=>{const{playStoreSvg:t}=await import("./play-store-DygLP6uN.js");return{playStoreSvg:t}},__vite__mapDeps([54,1,2,3,4,5,6]))).playStoreSvg,plus:async()=>(await p(async()=>{const{plusSvg:t}=await import("./plus-BwwH-3F8.js");return{plusSvg:t}},__vite__mapDeps([55,1,2,3,4,5,6]))).plusSvg,qrCode:async()=>(await p(async()=>{const{qrCodeIcon:t}=await import("./qr-code-BMCRjEbw.js");return{qrCodeIcon:t}},__vite__mapDeps([56,1,2,3,4,5,6]))).qrCodeIcon,recycleHorizontal:async()=>(await p(async()=>{const{recycleHorizontalSvg:t}=await import("./recycle-horizontal-k72lKJ6R.js");return{recycleHorizontalSvg:t}},__vite__mapDeps([57,1,2,3,4,5,6]))).recycleHorizontalSvg,refresh:async()=>(await p(async()=>{const{refreshSvg:t}=await import("./refresh-sT_uwqUL.js");return{refreshSvg:t}},__vite__mapDeps([58,1,2,3,4,5,6]))).refreshSvg,search:async()=>(await p(async()=>{const{searchSvg:t}=await import("./search-CnSzBWkH.js");return{searchSvg:t}},__vite__mapDeps([59,1,2,3,4,5,6]))).searchSvg,send:async()=>(await p(async()=>{const{sendSvg:t}=await import("./send-PMVunQC2.js");return{sendSvg:t}},__vite__mapDeps([60,1,2,3,4,5,6]))).sendSvg,swapHorizontal:async()=>(await p(async()=>{const{swapHorizontalSvg:t}=await import("./swapHorizontal-Diwbp3nS.js");return{swapHorizontalSvg:t}},__vite__mapDeps([61,1,2,3,4,5,6]))).swapHorizontalSvg,swapHorizontalMedium:async()=>(await p(async()=>{const{swapHorizontalMediumSvg:t}=await import("./swapHorizontalMedium-BO3yJV5d.js");return{swapHorizontalMediumSvg:t}},__vite__mapDeps([62,1,2,3,4,5,6]))).swapHorizontalMediumSvg,swapHorizontalBold:async()=>(await p(async()=>{const{swapHorizontalBoldSvg:t}=await import("./swapHorizontalBold-BvW-UUke.js");return{swapHorizontalBoldSvg:t}},__vite__mapDeps([63,1,2,3,4,5,6]))).swapHorizontalBoldSvg,swapHorizontalRoundedBold:async()=>(await p(async()=>{const{swapHorizontalRoundedBoldSvg:t}=await import("./swapHorizontalRoundedBold-CIYFalCv.js");return{swapHorizontalRoundedBoldSvg:t}},__vite__mapDeps([64,1,2,3,4,5,6]))).swapHorizontalRoundedBoldSvg,swapVertical:async()=>(await p(async()=>{const{swapVerticalSvg:t}=await import("./swapVertical-Ccqpzw8I.js");return{swapVerticalSvg:t}},__vite__mapDeps([65,1,2,3,4,5,6]))).swapVerticalSvg,telegram:async()=>(await p(async()=>{const{telegramSvg:t}=await import("./telegram-ariGLVX9.js");return{telegramSvg:t}},__vite__mapDeps([66,1,2,3,4,5,6]))).telegramSvg,threeDots:async()=>(await p(async()=>{const{threeDotsSvg:t}=await import("./three-dots-Bwcq6lkp.js");return{threeDotsSvg:t}},__vite__mapDeps([67,1,2,3,4,5,6]))).threeDotsSvg,twitch:async()=>(await p(async()=>{const{twitchSvg:t}=await import("./twitch-C1hckqaG.js");return{twitchSvg:t}},__vite__mapDeps([68,1,2,3,4,5,6]))).twitchSvg,twitter:async()=>(await p(async()=>{const{xSvg:t}=await import("./x-wRsQSJUd.js");return{xSvg:t}},__vite__mapDeps([69,1,2,3,4,5,6]))).xSvg,twitterIcon:async()=>(await p(async()=>{const{twitterIconSvg:t}=await import("./twitterIcon-yZ6gaMup.js");return{twitterIconSvg:t}},__vite__mapDeps([70,1,2,3,4,5,6]))).twitterIconSvg,verify:async()=>(await p(async()=>{const{verifySvg:t}=await import("./verify-Bwqmm1en.js");return{verifySvg:t}},__vite__mapDeps([71,1,2,3,4,5,6]))).verifySvg,verifyFilled:async()=>(await p(async()=>{const{verifyFilledSvg:t}=await import("./verify-filled-BWs9Yurd.js");return{verifyFilledSvg:t}},__vite__mapDeps([72,1,2,3,4,5,6]))).verifyFilledSvg,wallet:async()=>(await p(async()=>{const{walletSvg:t}=await import("./wallet-Cb2omsN0.js");return{walletSvg:t}},__vite__mapDeps([73,1,2,3,4,5,6]))).walletSvg,walletConnect:async()=>(await p(async()=>{const{walletConnectSvg:t}=await import("./walletconnect-CLcFx8qk.js");return{walletConnectSvg:t}},__vite__mapDeps([74,1,2,3,4,5,6]))).walletConnectSvg,walletConnectLightBrown:async()=>(await p(async()=>{const{walletConnectLightBrownSvg:t}=await import("./walletconnect-CLcFx8qk.js");return{walletConnectLightBrownSvg:t}},__vite__mapDeps([74,1,2,3,4,5,6]))).walletConnectLightBrownSvg,walletConnectBrown:async()=>(await p(async()=>{const{walletConnectBrownSvg:t}=await import("./walletconnect-CLcFx8qk.js");return{walletConnectBrownSvg:t}},__vite__mapDeps([74,1,2,3,4,5,6]))).walletConnectBrownSvg,walletPlaceholder:async()=>(await p(async()=>{const{walletPlaceholderSvg:t}=await import("./wallet-placeholder-nVQNVYqL.js");return{walletPlaceholderSvg:t}},__vite__mapDeps([75,1,2,3,4,5,6]))).walletPlaceholderSvg,warningCircle:async()=>(await p(async()=>{const{warningCircleSvg:t}=await import("./warning-circle-CFhDy2n2.js");return{warningCircleSvg:t}},__vite__mapDeps([76,1,2,3,4,5,6]))).warningCircleSvg,x:async()=>(await p(async()=>{const{xSvg:t}=await import("./x-wRsQSJUd.js");return{xSvg:t}},__vite__mapDeps([69,1,2,3,4,5,6]))).xSvg,info:async()=>(await p(async()=>{const{infoSvg:t}=await import("./info-DW572DdY.js");return{infoSvg:t}},__vite__mapDeps([77,1,2,3,4,5,6]))).infoSvg,exclamationTriangle:async()=>(await p(async()=>{const{exclamationTriangleSvg:t}=await import("./exclamation-triangle-v5wah7Sm.js");return{exclamationTriangleSvg:t}},__vite__mapDeps([78,1,2,3,4,5,6]))).exclamationTriangleSvg,reown:async()=>(await p(async()=>{const{reownSvg:t}=await import("./reown-logo-CmiLvigu.js");return{reownSvg:t}},__vite__mapDeps([79,1,2,3,4,5,6]))).reownSvg};let j=class extends a{constructor(){super(...arguments),this.size="md",this.name="copy",this.color="fg-300",this.aspectRatio="1 / 1"}render(){return this.style.cssText=`\n      --local-color: var(--wui-color-${this.color});\n      --local-width: var(--wui-icon-size-${this.size});\n      --local-aspect-ratio: ${this.aspectRatio}\n    `,r`${b(async function(t){if(E.has(t))return E.get(t);const e=(P[t]??P.copy)();return E.set(t,e),e}(this.name),r`<div class="fallback"></div>`)}`}};j.styles=[l,g,x],R([e()],j.prototype,"size",void 0),R([e()],j.prototype,"name",void 0),R([e()],j.prototype,"color",void 0),R([e()],j.prototype,"aspectRatio",void 0),j=R([h("wui-icon")],j);const k=t`
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
`;var T=function(t,e,a,r){var o,i=arguments.length,n=i<3?e:null===r?r=Object.getOwnPropertyDescriptor(e,a):r;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)n=Reflect.decorate(t,e,a,r);else for(var s=t.length-1;s>=0;s--)(o=t[s])&&(n=(i<3?o(n):i>3?o(e,a,n):o(e,a))||n);return i>3&&n&&Object.defineProperty(e,a,n),n};let L=class extends a{constructor(){super(...arguments),this.variant="paragraph-500",this.color="fg-300",this.align="left",this.lineClamp=void 0}render(){const t={[`wui-font-${this.variant}`]:!0,[`wui-color-${this.color}`]:!0,[`wui-line-clamp-${this.lineClamp}`]:!!this.lineClamp};return this.style.cssText=`\n      --local-align: ${this.align};\n      --local-color: var(--wui-color-${this.color});\n    `,r`<slot class=${c(t)}></slot>`}};L.styles=[l,k],T([e()],L.prototype,"variant",void 0),T([e()],L.prototype,"color",void 0),T([e()],L.prototype,"align",void 0),T([e()],L.prototype,"lineClamp",void 0),L=T([h("wui-text")],L);const O=t`
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
`;var D=function(t,e,a,r){var o,i=arguments.length,n=i<3?e:null===r?r=Object.getOwnPropertyDescriptor(e,a):r;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)n=Reflect.decorate(t,e,a,r);else for(var s=t.length-1;s>=0;s--)(o=t[s])&&(n=(i<3?o(n):i>3?o(e,a,n):o(e,a))||n);return i>3&&n&&Object.defineProperty(e,a,n),n};let I=class extends a{constructor(){super(...arguments),this.size="md",this.backgroundColor="accent-100",this.iconColor="accent-100",this.background="transparent",this.border=!1,this.borderColor="wui-color-bg-125",this.icon="copy"}render(){const t=this.iconSize||this.size,e="lg"===this.size,a="xl"===this.size,o=e?"12%":"16%",i=e?"xxs":a?"s":"3xl",n="gray"===this.background,s="opaque"===this.background,c="accent-100"===this.backgroundColor&&s||"success-100"===this.backgroundColor&&s||"error-100"===this.backgroundColor&&s||"inverse-100"===this.backgroundColor&&s;let l=`var(--wui-color-${this.backgroundColor})`;return c?l=`var(--wui-icon-box-bg-${this.backgroundColor})`:n&&(l=`var(--wui-color-gray-${this.backgroundColor})`),this.style.cssText=`\n       --local-bg-value: ${l};\n       --local-bg-mix: ${c||n?"100%":o};\n       --local-border-radius: var(--wui-border-radius-${i});\n       --local-size: var(--wui-icon-box-size-${this.size});\n       --local-border: ${"wui-color-bg-125"===this.borderColor?"2px":"1px"} solid ${this.border?`var(--${this.borderColor})`:"transparent"}\n   `,r` <wui-icon color=${this.iconColor} size=${t} name=${this.icon}></wui-icon> `}};I.styles=[l,w,O],D([e()],I.prototype,"size",void 0),D([e()],I.prototype,"backgroundColor",void 0),D([e()],I.prototype,"iconColor",void 0),D([e()],I.prototype,"iconSize",void 0),D([e()],I.prototype,"background",void 0),D([e({type:Boolean})],I.prototype,"border",void 0),D([e()],I.prototype,"borderColor",void 0),D([e()],I.prototype,"icon",void 0),I=D([h("wui-icon-box")],I);const z=t`
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
`;var $=function(t,e,a,r){var o,i=arguments.length,n=i<3?e:null===r?r=Object.getOwnPropertyDescriptor(e,a):r;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)n=Reflect.decorate(t,e,a,r);else for(var s=t.length-1;s>=0;s--)(o=t[s])&&(n=(i<3?o(n):i>3?o(e,a,n):o(e,a))||n);return i>3&&n&&Object.defineProperty(e,a,n),n};let V=class extends a{constructor(){super(...arguments),this.src="./path/to/image.jpg",this.alt="Image",this.size=void 0}render(){return this.style.cssText=`\n      --local-width: ${this.size?`var(--wui-icon-size-${this.size});`:"100%"};\n      --local-height: ${this.size?`var(--wui-icon-size-${this.size});`:"100%"};\n      `,r`<img src=${this.src} alt=${this.alt} @error=${this.handleImageError} />`}handleImageError(){this.dispatchEvent(new CustomEvent("onLoadError",{bubbles:!0,composed:!0}))}};V.styles=[l,g,z],$([e()],V.prototype,"src",void 0),$([e()],V.prototype,"alt",void 0),$([e()],V.prototype,"size",void 0),V=$([h("wui-image")],V);const A=t`
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
`;var C=function(t,e,a,r){var o,i=arguments.length,n=i<3?e:null===r?r=Object.getOwnPropertyDescriptor(e,a):r;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)n=Reflect.decorate(t,e,a,r);else for(var s=t.length-1;s>=0;s--)(o=t[s])&&(n=(i<3?o(n):i>3?o(e,a,n):o(e,a))||n);return i>3&&n&&Object.defineProperty(e,a,n),n};let B=class extends a{constructor(){super(...arguments),this.variant="main",this.size="lg"}render(){this.dataset.variant=this.variant,this.dataset.size=this.size;const t="md"===this.size?"mini-700":"micro-700";return r`
      <wui-text data-variant=${this.variant} variant=${t} color="inherit">
        <slot></slot>
      </wui-text>
    `}};B.styles=[l,A],C([e()],B.prototype,"variant",void 0),C([e()],B.prototype,"size",void 0),B=C([h("wui-tag")],B);const H=t`
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
`;var F=function(t,e,a,r){var o,i=arguments.length,n=i<3?e:null===r?r=Object.getOwnPropertyDescriptor(e,a):r;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)n=Reflect.decorate(t,e,a,r);else for(var s=t.length-1;s>=0;s--)(o=t[s])&&(n=(i<3?o(n):i>3?o(e,a,n):o(e,a))||n);return i>3&&n&&Object.defineProperty(e,a,n),n};let G=class extends a{constructor(){super(...arguments),this.color="accent-100",this.size="lg"}render(){return this.style.cssText="--local-color: "+("inherit"===this.color?"inherit":`var(--wui-color-${this.color})`),this.dataset.size=this.size,r`<svg viewBox="25 25 50 50">
      <circle r="20" cy="50" cx="50"></circle>
    </svg>`}};G.styles=[l,H],F([e()],G.prototype,"color",void 0),F([e()],G.prototype,"size",void 0),G=F([h("wui-loading-spinner")],G);export{v as U,h as c};
