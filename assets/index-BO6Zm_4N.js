const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/add-CMo-jnv1.js","assets/index-BtzNuw2i.js","assets/wagmi-vendor-4NKcJtQE.js","assets/react-vendor-ZyuiJZO_.js","assets/chess-vendor-JTxzwGi1.js","assets/ui-vendor-BgPmeekb.js","assets/index-DCUXUex1.css","assets/all-wallets-DoyJyv73.js","assets/arrow-bottom-circle-DeAg8C9E.js","assets/app-store-DWLpSViR.js","assets/apple-JAFyIGfi.js","assets/arrow-bottom-9rtOgVSA.js","assets/arrow-left-DBF6aCtb.js","assets/arrow-right-CNBcJT7V.js","assets/arrow-top-DDMn_B83.js","assets/bank-BH5zBdv4.js","assets/browser-BPkJYiZF.js","assets/card-D5_Wpv-r.js","assets/checkmark-BKxjwaVM.js","assets/checkmark-bold-BRF1ON24.js","assets/chevron-bottom-76h7gNqP.js","assets/chevron-left-Cy2ki61Y.js","assets/chevron-right-CGsNPo8T.js","assets/chevron-top-BR6xIU49.js","assets/chrome-store-CfLeaTiM.js","assets/clock-B8mpTimV.js","assets/close-BGHvtHu9.js","assets/compass-CQb1OJST.js","assets/coinPlaceholder-C6KqpS-d.js","assets/copy-CqUMcpDl.js","assets/cursor-D_RiX-dz.js","assets/cursor-transparent-B01YLx_O.js","assets/desktop-BEnQgcOj.js","assets/disconnect-BoU2VPhq.js","assets/discord-DhjeOasm.js","assets/etherscan-Cry_c9XF.js","assets/extension-pOaIU-e-.js","assets/external-link-DDN9yoBi.js","assets/facebook-xJS6JZ1H.js","assets/farcaster-BXzvyIoK.js","assets/filters-DL_zo17X.js","assets/github-BEaAdus3.js","assets/google-Clg7uEx-.js","assets/help-circle-D8x4qr-B.js","assets/image-BcC9mKok.js","assets/id-DpSKaqr7.js","assets/info-circle-vAsU3Guh.js","assets/lightbulb-BakTX8J4.js","assets/mail-DI4rDEM6.js","assets/mobile-CWAWbdvV.js","assets/more-CnmQwv9H.js","assets/network-placeholder-DSvdackF.js","assets/nftPlaceholder-DZa04iu2.js","assets/off-BvNXI5O4.js","assets/play-store-edFAmD2R.js","assets/plus-CCOz2Zq1.js","assets/qr-code-6d018BKC.js","assets/recycle-horizontal-CDn-R7qI.js","assets/refresh-BYnUmLbO.js","assets/search-D3CDTkZa.js","assets/send-CQaq3c8T.js","assets/swapHorizontal-BeyBRyuc.js","assets/swapHorizontalMedium-Q0WZZxH3.js","assets/swapHorizontalBold-V4Rk8t1Z.js","assets/swapHorizontalRoundedBold-BS5mQmNx.js","assets/swapVertical-BRQst0ke.js","assets/telegram-DsriKHRF.js","assets/three-dots-rVDrZaYa.js","assets/twitch-D3-ZT9v9.js","assets/x-WM0n5so0.js","assets/twitterIcon-CMO3EkjY.js","assets/verify-CORupMg9.js","assets/verify-filled-C5cE4nfG.js","assets/wallet-BoXLYaTZ.js","assets/walletconnect-BWnqDfsv.js","assets/wallet-placeholder-CumI7QyB.js","assets/warning-circle-DC6EW1WW.js","assets/info-Dm5zyYnl.js","assets/exclamation-triangle-DR_-bIh9.js","assets/reown-logo-DMn0xr6g.js"])))=>i.map(i=>d[i]);
import{i as t,n as a,j as r,x as o,k as e,l as i}from"./index-BtzNuw2i.js";import{r as n,c as s,e as c}from"./core-awz_TGrS.js";import{_ as l}from"./wagmi-vendor-4NKcJtQE.js";const g={getSpacingStyles:(t,a)=>Array.isArray(t)?t[a]?`var(--wui-spacing-${t[a]})`:void 0:"string"==typeof t?`var(--wui-spacing-${t})`:void 0,getFormattedDate:t=>new Intl.DateTimeFormat("en-US",{month:"short",day:"numeric"}).format(t),getHostName(t){try{return new URL(t).hostname}catch(a){return""}},getTruncateString:({string:t,charsStart:a,charsEnd:r,truncate:o})=>t.length<=a+r?t:"end"===o?`${t.substring(0,a)}...`:"start"===o?`...${t.substring(t.length-r)}`:`${t.substring(0,Math.floor(a))}...${t.substring(t.length-Math.floor(r))}`,generateAvatarColors(t){const a=t.toLowerCase().replace(/^0x/iu,"").replace(/[^a-f0-9]/gu,"").substring(0,6).padEnd(6,"0"),r=this.hexToRgb(a),o=getComputedStyle(document.documentElement).getPropertyValue("--w3m-border-radius-master"),e=100-3*Number(null==o?void 0:o.replace("px","")),i=`${e}% ${e}% at 65% 40%`,n=[];for(let s=0;s<5;s+=1){const t=this.tintColor(r,.15*s);n.push(`rgb(${t[0]}, ${t[1]}, ${t[2]})`)}return`\n    --local-color-1: ${n[0]};\n    --local-color-2: ${n[1]};\n    --local-color-3: ${n[2]};\n    --local-color-4: ${n[3]};\n    --local-color-5: ${n[4]};\n    --local-radial-circle: ${i}\n   `},hexToRgb(t){const a=parseInt(t,16);return[a>>16&255,a>>8&255,255&a]},tintColor(t,a){const[r,o,e]=t;return[Math.round(r+(255-r)*a),Math.round(o+(255-o)*a),Math.round(e+(255-e)*a)]},isNumber:t=>/^[0-9]+$/u.test(t),getColorTheme(t){var a;return t||("undefined"!=typeof window&&window.matchMedia?(null==(a=window.matchMedia("(prefers-color-scheme: dark)"))?void 0:a.matches)?"dark":"light":"dark")},splitBalance(t){const a=t.split(".");return 2===a.length?[a[0],a[1]]:["0","00"]},roundNumber:(t,a,r)=>t.toString().length>=a?Number(t).toFixed(r):t,formatNumberToLocalString:(t,a=2)=>void 0===t?"0.00":"number"==typeof t?t.toLocaleString("en-US",{maximumFractionDigits:a,minimumFractionDigits:a}):parseFloat(t).toLocaleString("en-US",{maximumFractionDigits:a,minimumFractionDigits:a})};function w(t){return function(a){return"function"==typeof a?function(t,a){return customElements.get(t)||customElements.define(t,a),a}(t,a):function(t,a){const{kind:r,elements:o}=a;return{kind:r,elements:o,finisher(a){customElements.get(t)||customElements.define(t,a)}}}(t,a)}}const p=t`
  :host {
    display: flex;
    width: inherit;
    height: inherit;
  }
`;var v=function(t,a,r,o){var e,i=arguments.length,n=i<3?a:null===o?o=Object.getOwnPropertyDescriptor(a,r):o;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)n=Reflect.decorate(t,a,r,o);else for(var s=t.length-1;s>=0;s--)(e=t[s])&&(n=(i<3?e(n):i>3?e(a,r,n):e(a,r))||n);return i>3&&n&&Object.defineProperty(a,r,n),n};let u=class extends r{render(){return this.style.cssText=`\n      flex-direction: ${this.flexDirection};\n      flex-wrap: ${this.flexWrap};\n      flex-basis: ${this.flexBasis};\n      flex-grow: ${this.flexGrow};\n      flex-shrink: ${this.flexShrink};\n      align-items: ${this.alignItems};\n      justify-content: ${this.justifyContent};\n      column-gap: ${this.columnGap&&`var(--wui-spacing-${this.columnGap})`};\n      row-gap: ${this.rowGap&&`var(--wui-spacing-${this.rowGap})`};\n      gap: ${this.gap&&`var(--wui-spacing-${this.gap})`};\n      padding-top: ${this.padding&&g.getSpacingStyles(this.padding,0)};\n      padding-right: ${this.padding&&g.getSpacingStyles(this.padding,1)};\n      padding-bottom: ${this.padding&&g.getSpacingStyles(this.padding,2)};\n      padding-left: ${this.padding&&g.getSpacingStyles(this.padding,3)};\n      margin-top: ${this.margin&&g.getSpacingStyles(this.margin,0)};\n      margin-right: ${this.margin&&g.getSpacingStyles(this.margin,1)};\n      margin-bottom: ${this.margin&&g.getSpacingStyles(this.margin,2)};\n      margin-left: ${this.margin&&g.getSpacingStyles(this.margin,3)};\n    `,o`<slot></slot>`}};u.styles=[n,p],v([a()],u.prototype,"flexDirection",void 0),v([a()],u.prototype,"flexWrap",void 0),v([a()],u.prototype,"flexBasis",void 0),v([a()],u.prototype,"flexGrow",void 0),v([a()],u.prototype,"flexShrink",void 0),v([a()],u.prototype,"alignItems",void 0),v([a()],u.prototype,"justifyContent",void 0),v([a()],u.prototype,"columnGap",void 0),v([a()],u.prototype,"rowGap",void 0),v([a()],u.prototype,"gap",void 0),v([a()],u.prototype,"padding",void 0),v([a()],u.prototype,"margin",void 0),u=v([w("wui-flex")],u);const h=new class{constructor(){this.cache=new Map}set(t,a){this.cache.set(t,a)}get(t){return this.cache.get(t)}has(t){return this.cache.has(t)}delete(t){this.cache.delete(t)}clear(){this.cache.clear()}},d=t`
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
`;var _=function(t,a,r,o){var e,i=arguments.length,n=i<3?a:null===o?o=Object.getOwnPropertyDescriptor(a,r):o;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)n=Reflect.decorate(t,a,r,o);else for(var s=t.length-1;s>=0;s--)(e=t[s])&&(n=(i<3?e(n):i>3?e(a,r,n):e(a,r))||n);return i>3&&n&&Object.defineProperty(a,r,n),n};const m={add:async()=>(await l(async()=>{const{addSvg:t}=await import("./add-CMo-jnv1.js");return{addSvg:t}},__vite__mapDeps([0,1,2,3,4,5,6]))).addSvg,allWallets:async()=>(await l(async()=>{const{allWalletsSvg:t}=await import("./all-wallets-DoyJyv73.js");return{allWalletsSvg:t}},__vite__mapDeps([7,1,2,3,4,5,6]))).allWalletsSvg,arrowBottomCircle:async()=>(await l(async()=>{const{arrowBottomCircleSvg:t}=await import("./arrow-bottom-circle-DeAg8C9E.js");return{arrowBottomCircleSvg:t}},__vite__mapDeps([8,1,2,3,4,5,6]))).arrowBottomCircleSvg,appStore:async()=>(await l(async()=>{const{appStoreSvg:t}=await import("./app-store-DWLpSViR.js");return{appStoreSvg:t}},__vite__mapDeps([9,1,2,3,4,5,6]))).appStoreSvg,apple:async()=>(await l(async()=>{const{appleSvg:t}=await import("./apple-JAFyIGfi.js");return{appleSvg:t}},__vite__mapDeps([10,1,2,3,4,5,6]))).appleSvg,arrowBottom:async()=>(await l(async()=>{const{arrowBottomSvg:t}=await import("./arrow-bottom-9rtOgVSA.js");return{arrowBottomSvg:t}},__vite__mapDeps([11,1,2,3,4,5,6]))).arrowBottomSvg,arrowLeft:async()=>(await l(async()=>{const{arrowLeftSvg:t}=await import("./arrow-left-DBF6aCtb.js");return{arrowLeftSvg:t}},__vite__mapDeps([12,1,2,3,4,5,6]))).arrowLeftSvg,arrowRight:async()=>(await l(async()=>{const{arrowRightSvg:t}=await import("./arrow-right-CNBcJT7V.js");return{arrowRightSvg:t}},__vite__mapDeps([13,1,2,3,4,5,6]))).arrowRightSvg,arrowTop:async()=>(await l(async()=>{const{arrowTopSvg:t}=await import("./arrow-top-DDMn_B83.js");return{arrowTopSvg:t}},__vite__mapDeps([14,1,2,3,4,5,6]))).arrowTopSvg,bank:async()=>(await l(async()=>{const{bankSvg:t}=await import("./bank-BH5zBdv4.js");return{bankSvg:t}},__vite__mapDeps([15,1,2,3,4,5,6]))).bankSvg,browser:async()=>(await l(async()=>{const{browserSvg:t}=await import("./browser-BPkJYiZF.js");return{browserSvg:t}},__vite__mapDeps([16,1,2,3,4,5,6]))).browserSvg,card:async()=>(await l(async()=>{const{cardSvg:t}=await import("./card-D5_Wpv-r.js");return{cardSvg:t}},__vite__mapDeps([17,1,2,3,4,5,6]))).cardSvg,checkmark:async()=>(await l(async()=>{const{checkmarkSvg:t}=await import("./checkmark-BKxjwaVM.js");return{checkmarkSvg:t}},__vite__mapDeps([18,1,2,3,4,5,6]))).checkmarkSvg,checkmarkBold:async()=>(await l(async()=>{const{checkmarkBoldSvg:t}=await import("./checkmark-bold-BRF1ON24.js");return{checkmarkBoldSvg:t}},__vite__mapDeps([19,1,2,3,4,5,6]))).checkmarkBoldSvg,chevronBottom:async()=>(await l(async()=>{const{chevronBottomSvg:t}=await import("./chevron-bottom-76h7gNqP.js");return{chevronBottomSvg:t}},__vite__mapDeps([20,1,2,3,4,5,6]))).chevronBottomSvg,chevronLeft:async()=>(await l(async()=>{const{chevronLeftSvg:t}=await import("./chevron-left-Cy2ki61Y.js");return{chevronLeftSvg:t}},__vite__mapDeps([21,1,2,3,4,5,6]))).chevronLeftSvg,chevronRight:async()=>(await l(async()=>{const{chevronRightSvg:t}=await import("./chevron-right-CGsNPo8T.js");return{chevronRightSvg:t}},__vite__mapDeps([22,1,2,3,4,5,6]))).chevronRightSvg,chevronTop:async()=>(await l(async()=>{const{chevronTopSvg:t}=await import("./chevron-top-BR6xIU49.js");return{chevronTopSvg:t}},__vite__mapDeps([23,1,2,3,4,5,6]))).chevronTopSvg,chromeStore:async()=>(await l(async()=>{const{chromeStoreSvg:t}=await import("./chrome-store-CfLeaTiM.js");return{chromeStoreSvg:t}},__vite__mapDeps([24,1,2,3,4,5,6]))).chromeStoreSvg,clock:async()=>(await l(async()=>{const{clockSvg:t}=await import("./clock-B8mpTimV.js");return{clockSvg:t}},__vite__mapDeps([25,1,2,3,4,5,6]))).clockSvg,close:async()=>(await l(async()=>{const{closeSvg:t}=await import("./close-BGHvtHu9.js");return{closeSvg:t}},__vite__mapDeps([26,1,2,3,4,5,6]))).closeSvg,compass:async()=>(await l(async()=>{const{compassSvg:t}=await import("./compass-CQb1OJST.js");return{compassSvg:t}},__vite__mapDeps([27,1,2,3,4,5,6]))).compassSvg,coinPlaceholder:async()=>(await l(async()=>{const{coinPlaceholderSvg:t}=await import("./coinPlaceholder-C6KqpS-d.js");return{coinPlaceholderSvg:t}},__vite__mapDeps([28,1,2,3,4,5,6]))).coinPlaceholderSvg,copy:async()=>(await l(async()=>{const{copySvg:t}=await import("./copy-CqUMcpDl.js");return{copySvg:t}},__vite__mapDeps([29,1,2,3,4,5,6]))).copySvg,cursor:async()=>(await l(async()=>{const{cursorSvg:t}=await import("./cursor-D_RiX-dz.js");return{cursorSvg:t}},__vite__mapDeps([30,1,2,3,4,5,6]))).cursorSvg,cursorTransparent:async()=>(await l(async()=>{const{cursorTransparentSvg:t}=await import("./cursor-transparent-B01YLx_O.js");return{cursorTransparentSvg:t}},__vite__mapDeps([31,1,2,3,4,5,6]))).cursorTransparentSvg,desktop:async()=>(await l(async()=>{const{desktopSvg:t}=await import("./desktop-BEnQgcOj.js");return{desktopSvg:t}},__vite__mapDeps([32,1,2,3,4,5,6]))).desktopSvg,disconnect:async()=>(await l(async()=>{const{disconnectSvg:t}=await import("./disconnect-BoU2VPhq.js");return{disconnectSvg:t}},__vite__mapDeps([33,1,2,3,4,5,6]))).disconnectSvg,discord:async()=>(await l(async()=>{const{discordSvg:t}=await import("./discord-DhjeOasm.js");return{discordSvg:t}},__vite__mapDeps([34,1,2,3,4,5,6]))).discordSvg,etherscan:async()=>(await l(async()=>{const{etherscanSvg:t}=await import("./etherscan-Cry_c9XF.js");return{etherscanSvg:t}},__vite__mapDeps([35,1,2,3,4,5,6]))).etherscanSvg,extension:async()=>(await l(async()=>{const{extensionSvg:t}=await import("./extension-pOaIU-e-.js");return{extensionSvg:t}},__vite__mapDeps([36,1,2,3,4,5,6]))).extensionSvg,externalLink:async()=>(await l(async()=>{const{externalLinkSvg:t}=await import("./external-link-DDN9yoBi.js");return{externalLinkSvg:t}},__vite__mapDeps([37,1,2,3,4,5,6]))).externalLinkSvg,facebook:async()=>(await l(async()=>{const{facebookSvg:t}=await import("./facebook-xJS6JZ1H.js");return{facebookSvg:t}},__vite__mapDeps([38,1,2,3,4,5,6]))).facebookSvg,farcaster:async()=>(await l(async()=>{const{farcasterSvg:t}=await import("./farcaster-BXzvyIoK.js");return{farcasterSvg:t}},__vite__mapDeps([39,1,2,3,4,5,6]))).farcasterSvg,filters:async()=>(await l(async()=>{const{filtersSvg:t}=await import("./filters-DL_zo17X.js");return{filtersSvg:t}},__vite__mapDeps([40,1,2,3,4,5,6]))).filtersSvg,github:async()=>(await l(async()=>{const{githubSvg:t}=await import("./github-BEaAdus3.js");return{githubSvg:t}},__vite__mapDeps([41,1,2,3,4,5,6]))).githubSvg,google:async()=>(await l(async()=>{const{googleSvg:t}=await import("./google-Clg7uEx-.js");return{googleSvg:t}},__vite__mapDeps([42,1,2,3,4,5,6]))).googleSvg,helpCircle:async()=>(await l(async()=>{const{helpCircleSvg:t}=await import("./help-circle-D8x4qr-B.js");return{helpCircleSvg:t}},__vite__mapDeps([43,1,2,3,4,5,6]))).helpCircleSvg,image:async()=>(await l(async()=>{const{imageSvg:t}=await import("./image-BcC9mKok.js");return{imageSvg:t}},__vite__mapDeps([44,1,2,3,4,5,6]))).imageSvg,id:async()=>(await l(async()=>{const{idSvg:t}=await import("./id-DpSKaqr7.js");return{idSvg:t}},__vite__mapDeps([45,1,2,3,4,5,6]))).idSvg,infoCircle:async()=>(await l(async()=>{const{infoCircleSvg:t}=await import("./info-circle-vAsU3Guh.js");return{infoCircleSvg:t}},__vite__mapDeps([46,1,2,3,4,5,6]))).infoCircleSvg,lightbulb:async()=>(await l(async()=>{const{lightbulbSvg:t}=await import("./lightbulb-BakTX8J4.js");return{lightbulbSvg:t}},__vite__mapDeps([47,1,2,3,4,5,6]))).lightbulbSvg,mail:async()=>(await l(async()=>{const{mailSvg:t}=await import("./mail-DI4rDEM6.js");return{mailSvg:t}},__vite__mapDeps([48,1,2,3,4,5,6]))).mailSvg,mobile:async()=>(await l(async()=>{const{mobileSvg:t}=await import("./mobile-CWAWbdvV.js");return{mobileSvg:t}},__vite__mapDeps([49,1,2,3,4,5,6]))).mobileSvg,more:async()=>(await l(async()=>{const{moreSvg:t}=await import("./more-CnmQwv9H.js");return{moreSvg:t}},__vite__mapDeps([50,1,2,3,4,5,6]))).moreSvg,networkPlaceholder:async()=>(await l(async()=>{const{networkPlaceholderSvg:t}=await import("./network-placeholder-DSvdackF.js");return{networkPlaceholderSvg:t}},__vite__mapDeps([51,1,2,3,4,5,6]))).networkPlaceholderSvg,nftPlaceholder:async()=>(await l(async()=>{const{nftPlaceholderSvg:t}=await import("./nftPlaceholder-DZa04iu2.js");return{nftPlaceholderSvg:t}},__vite__mapDeps([52,1,2,3,4,5,6]))).nftPlaceholderSvg,off:async()=>(await l(async()=>{const{offSvg:t}=await import("./off-BvNXI5O4.js");return{offSvg:t}},__vite__mapDeps([53,1,2,3,4,5,6]))).offSvg,playStore:async()=>(await l(async()=>{const{playStoreSvg:t}=await import("./play-store-edFAmD2R.js");return{playStoreSvg:t}},__vite__mapDeps([54,1,2,3,4,5,6]))).playStoreSvg,plus:async()=>(await l(async()=>{const{plusSvg:t}=await import("./plus-CCOz2Zq1.js");return{plusSvg:t}},__vite__mapDeps([55,1,2,3,4,5,6]))).plusSvg,qrCode:async()=>(await l(async()=>{const{qrCodeIcon:t}=await import("./qr-code-6d018BKC.js");return{qrCodeIcon:t}},__vite__mapDeps([56,1,2,3,4,5,6]))).qrCodeIcon,recycleHorizontal:async()=>(await l(async()=>{const{recycleHorizontalSvg:t}=await import("./recycle-horizontal-CDn-R7qI.js");return{recycleHorizontalSvg:t}},__vite__mapDeps([57,1,2,3,4,5,6]))).recycleHorizontalSvg,refresh:async()=>(await l(async()=>{const{refreshSvg:t}=await import("./refresh-BYnUmLbO.js");return{refreshSvg:t}},__vite__mapDeps([58,1,2,3,4,5,6]))).refreshSvg,search:async()=>(await l(async()=>{const{searchSvg:t}=await import("./search-D3CDTkZa.js");return{searchSvg:t}},__vite__mapDeps([59,1,2,3,4,5,6]))).searchSvg,send:async()=>(await l(async()=>{const{sendSvg:t}=await import("./send-CQaq3c8T.js");return{sendSvg:t}},__vite__mapDeps([60,1,2,3,4,5,6]))).sendSvg,swapHorizontal:async()=>(await l(async()=>{const{swapHorizontalSvg:t}=await import("./swapHorizontal-BeyBRyuc.js");return{swapHorizontalSvg:t}},__vite__mapDeps([61,1,2,3,4,5,6]))).swapHorizontalSvg,swapHorizontalMedium:async()=>(await l(async()=>{const{swapHorizontalMediumSvg:t}=await import("./swapHorizontalMedium-Q0WZZxH3.js");return{swapHorizontalMediumSvg:t}},__vite__mapDeps([62,1,2,3,4,5,6]))).swapHorizontalMediumSvg,swapHorizontalBold:async()=>(await l(async()=>{const{swapHorizontalBoldSvg:t}=await import("./swapHorizontalBold-V4Rk8t1Z.js");return{swapHorizontalBoldSvg:t}},__vite__mapDeps([63,1,2,3,4,5,6]))).swapHorizontalBoldSvg,swapHorizontalRoundedBold:async()=>(await l(async()=>{const{swapHorizontalRoundedBoldSvg:t}=await import("./swapHorizontalRoundedBold-BS5mQmNx.js");return{swapHorizontalRoundedBoldSvg:t}},__vite__mapDeps([64,1,2,3,4,5,6]))).swapHorizontalRoundedBoldSvg,swapVertical:async()=>(await l(async()=>{const{swapVerticalSvg:t}=await import("./swapVertical-BRQst0ke.js");return{swapVerticalSvg:t}},__vite__mapDeps([65,1,2,3,4,5,6]))).swapVerticalSvg,telegram:async()=>(await l(async()=>{const{telegramSvg:t}=await import("./telegram-DsriKHRF.js");return{telegramSvg:t}},__vite__mapDeps([66,1,2,3,4,5,6]))).telegramSvg,threeDots:async()=>(await l(async()=>{const{threeDotsSvg:t}=await import("./three-dots-rVDrZaYa.js");return{threeDotsSvg:t}},__vite__mapDeps([67,1,2,3,4,5,6]))).threeDotsSvg,twitch:async()=>(await l(async()=>{const{twitchSvg:t}=await import("./twitch-D3-ZT9v9.js");return{twitchSvg:t}},__vite__mapDeps([68,1,2,3,4,5,6]))).twitchSvg,twitter:async()=>(await l(async()=>{const{xSvg:t}=await import("./x-WM0n5so0.js");return{xSvg:t}},__vite__mapDeps([69,1,2,3,4,5,6]))).xSvg,twitterIcon:async()=>(await l(async()=>{const{twitterIconSvg:t}=await import("./twitterIcon-CMO3EkjY.js");return{twitterIconSvg:t}},__vite__mapDeps([70,1,2,3,4,5,6]))).twitterIconSvg,verify:async()=>(await l(async()=>{const{verifySvg:t}=await import("./verify-CORupMg9.js");return{verifySvg:t}},__vite__mapDeps([71,1,2,3,4,5,6]))).verifySvg,verifyFilled:async()=>(await l(async()=>{const{verifyFilledSvg:t}=await import("./verify-filled-C5cE4nfG.js");return{verifyFilledSvg:t}},__vite__mapDeps([72,1,2,3,4,5,6]))).verifyFilledSvg,wallet:async()=>(await l(async()=>{const{walletSvg:t}=await import("./wallet-BoXLYaTZ.js");return{walletSvg:t}},__vite__mapDeps([73,1,2,3,4,5,6]))).walletSvg,walletConnect:async()=>(await l(async()=>{const{walletConnectSvg:t}=await import("./walletconnect-BWnqDfsv.js");return{walletConnectSvg:t}},__vite__mapDeps([74,1,2,3,4,5,6]))).walletConnectSvg,walletConnectLightBrown:async()=>(await l(async()=>{const{walletConnectLightBrownSvg:t}=await import("./walletconnect-BWnqDfsv.js");return{walletConnectLightBrownSvg:t}},__vite__mapDeps([74,1,2,3,4,5,6]))).walletConnectLightBrownSvg,walletConnectBrown:async()=>(await l(async()=>{const{walletConnectBrownSvg:t}=await import("./walletconnect-BWnqDfsv.js");return{walletConnectBrownSvg:t}},__vite__mapDeps([74,1,2,3,4,5,6]))).walletConnectBrownSvg,walletPlaceholder:async()=>(await l(async()=>{const{walletPlaceholderSvg:t}=await import("./wallet-placeholder-CumI7QyB.js");return{walletPlaceholderSvg:t}},__vite__mapDeps([75,1,2,3,4,5,6]))).walletPlaceholderSvg,warningCircle:async()=>(await l(async()=>{const{warningCircleSvg:t}=await import("./warning-circle-DC6EW1WW.js");return{warningCircleSvg:t}},__vite__mapDeps([76,1,2,3,4,5,6]))).warningCircleSvg,x:async()=>(await l(async()=>{const{xSvg:t}=await import("./x-WM0n5so0.js");return{xSvg:t}},__vite__mapDeps([69,1,2,3,4,5,6]))).xSvg,info:async()=>(await l(async()=>{const{infoSvg:t}=await import("./info-Dm5zyYnl.js");return{infoSvg:t}},__vite__mapDeps([77,1,2,3,4,5,6]))).infoSvg,exclamationTriangle:async()=>(await l(async()=>{const{exclamationTriangleSvg:t}=await import("./exclamation-triangle-DR_-bIh9.js");return{exclamationTriangleSvg:t}},__vite__mapDeps([78,1,2,3,4,5,6]))).exclamationTriangleSvg,reown:async()=>(await l(async()=>{const{reownSvg:t}=await import("./reown-logo-DMn0xr6g.js");return{reownSvg:t}},__vite__mapDeps([79,1,2,3,4,5,6]))).reownSvg};let y=class extends r{constructor(){super(...arguments),this.size="md",this.name="copy",this.color="fg-300",this.aspectRatio="1 / 1"}render(){return this.style.cssText=`\n      --local-color: var(--wui-color-${this.color});\n      --local-width: var(--wui-icon-size-${this.size});\n      --local-aspect-ratio: ${this.aspectRatio}\n    `,o`${e(async function(t){if(h.has(t))return h.get(t);const a=(m[t]??m.copy)();return h.set(t,a),a}(this.name),o`<div class="fallback"></div>`)}`}};y.styles=[n,s,d],_([a()],y.prototype,"size",void 0),_([a()],y.prototype,"name",void 0),_([a()],y.prototype,"color",void 0),_([a()],y.prototype,"aspectRatio",void 0),y=_([w("wui-icon")],y);const f=t`
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
`;var S=function(t,a,r,o){var e,i=arguments.length,n=i<3?a:null===o?o=Object.getOwnPropertyDescriptor(a,r):o;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)n=Reflect.decorate(t,a,r,o);else for(var s=t.length-1;s>=0;s--)(e=t[s])&&(n=(i<3?e(n):i>3?e(a,r,n):e(a,r))||n);return i>3&&n&&Object.defineProperty(a,r,n),n};let E=class extends r{constructor(){super(...arguments),this.variant="paragraph-500",this.color="fg-300",this.align="left",this.lineClamp=void 0}render(){const t={[`wui-font-${this.variant}`]:!0,[`wui-color-${this.color}`]:!0,[`wui-line-clamp-${this.lineClamp}`]:!!this.lineClamp};return this.style.cssText=`\n      --local-align: ${this.align};\n      --local-color: var(--wui-color-${this.color});\n    `,o`<slot class=${i(t)}></slot>`}};E.styles=[n,f],S([a()],E.prototype,"variant",void 0),S([a()],E.prototype,"color",void 0),S([a()],E.prototype,"align",void 0),S([a()],E.prototype,"lineClamp",void 0),E=S([w("wui-text")],E);const b=t`
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
`;var x=function(t,a,r,o){var e,i=arguments.length,n=i<3?a:null===o?o=Object.getOwnPropertyDescriptor(a,r):o;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)n=Reflect.decorate(t,a,r,o);else for(var s=t.length-1;s>=0;s--)(e=t[s])&&(n=(i<3?e(n):i>3?e(a,r,n):e(a,r))||n);return i>3&&n&&Object.defineProperty(a,r,n),n};let R=class extends r{constructor(){super(...arguments),this.size="md",this.backgroundColor="accent-100",this.iconColor="accent-100",this.background="transparent",this.border=!1,this.borderColor="wui-color-bg-125",this.icon="copy"}render(){const t=this.iconSize||this.size,a="lg"===this.size,r="xl"===this.size,e=a?"12%":"16%",i=a?"xxs":r?"s":"3xl",n="gray"===this.background,s="opaque"===this.background,c="accent-100"===this.backgroundColor&&s||"success-100"===this.backgroundColor&&s||"error-100"===this.backgroundColor&&s||"inverse-100"===this.backgroundColor&&s;let l=`var(--wui-color-${this.backgroundColor})`;return c?l=`var(--wui-icon-box-bg-${this.backgroundColor})`:n&&(l=`var(--wui-color-gray-${this.backgroundColor})`),this.style.cssText=`\n       --local-bg-value: ${l};\n       --local-bg-mix: ${c||n?"100%":e};\n       --local-border-radius: var(--wui-border-radius-${i});\n       --local-size: var(--wui-icon-box-size-${this.size});\n       --local-border: ${"wui-color-bg-125"===this.borderColor?"2px":"1px"} solid ${this.border?`var(--${this.borderColor})`:"transparent"}\n   `,o` <wui-icon color=${this.iconColor} size=${t} name=${this.icon}></wui-icon> `}};R.styles=[n,c,b],x([a()],R.prototype,"size",void 0),x([a()],R.prototype,"backgroundColor",void 0),x([a()],R.prototype,"iconColor",void 0),x([a()],R.prototype,"iconSize",void 0),x([a()],R.prototype,"background",void 0),x([a({type:Boolean})],R.prototype,"border",void 0),x([a()],R.prototype,"borderColor",void 0),x([a()],R.prototype,"icon",void 0),R=x([w("wui-icon-box")],R);const j=t`
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
`;var P=function(t,a,r,o){var e,i=arguments.length,n=i<3?a:null===o?o=Object.getOwnPropertyDescriptor(a,r):o;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)n=Reflect.decorate(t,a,r,o);else for(var s=t.length-1;s>=0;s--)(e=t[s])&&(n=(i<3?e(n):i>3?e(a,r,n):e(a,r))||n);return i>3&&n&&Object.defineProperty(a,r,n),n};let k=class extends r{constructor(){super(...arguments),this.src="./path/to/image.jpg",this.alt="Image",this.size=void 0}render(){return this.style.cssText=`\n      --local-width: ${this.size?`var(--wui-icon-size-${this.size});`:"100%"};\n      --local-height: ${this.size?`var(--wui-icon-size-${this.size});`:"100%"};\n      `,o`<img src=${this.src} alt=${this.alt} @error=${this.handleImageError} />`}handleImageError(){this.dispatchEvent(new CustomEvent("onLoadError",{bubbles:!0,composed:!0}))}};k.styles=[n,s,j],P([a()],k.prototype,"src",void 0),P([a()],k.prototype,"alt",void 0),P([a()],k.prototype,"size",void 0),k=P([w("wui-image")],k);const T=t`
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
`;var L=function(t,a,r,o){var e,i=arguments.length,n=i<3?a:null===o?o=Object.getOwnPropertyDescriptor(a,r):o;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)n=Reflect.decorate(t,a,r,o);else for(var s=t.length-1;s>=0;s--)(e=t[s])&&(n=(i<3?e(n):i>3?e(a,r,n):e(a,r))||n);return i>3&&n&&Object.defineProperty(a,r,n),n};let O=class extends r{constructor(){super(...arguments),this.variant="main",this.size="lg"}render(){this.dataset.variant=this.variant,this.dataset.size=this.size;const t="md"===this.size?"mini-700":"micro-700";return o`
      <wui-text data-variant=${this.variant} variant=${t} color="inherit">
        <slot></slot>
      </wui-text>
    `}};O.styles=[n,T],L([a()],O.prototype,"variant",void 0),L([a()],O.prototype,"size",void 0),O=L([w("wui-tag")],O);const D=t`
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
`;var z=function(t,a,r,o){var e,i=arguments.length,n=i<3?a:null===o?o=Object.getOwnPropertyDescriptor(a,r):o;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)n=Reflect.decorate(t,a,r,o);else for(var s=t.length-1;s>=0;s--)(e=t[s])&&(n=(i<3?e(n):i>3?e(a,r,n):e(a,r))||n);return i>3&&n&&Object.defineProperty(a,r,n),n};let I=class extends r{constructor(){super(...arguments),this.color="accent-100",this.size="lg"}render(){return this.style.cssText="--local-color: "+("inherit"===this.color?"inherit":`var(--wui-color-${this.color})`),this.dataset.size=this.size,o`<svg viewBox="25 25 50 50">
      <circle r="20" cy="50" cx="50"></circle>
    </svg>`}};I.styles=[n,D],z([a()],I.prototype,"color",void 0),z([a()],I.prototype,"size",void 0),I=z([w("wui-loading-spinner")],I);export{g as U,w as c};
