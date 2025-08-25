const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/add-leJEwW1O.js","assets/index-DXlF7dvv.js","assets/wagmi-vendor-O52zNBec.js","assets/react-vendor-ZyuiJZO_.js","assets/chess-vendor-JTxzwGi1.js","assets/ui-vendor-BgPmeekb.js","assets/index-DCUXUex1.css","assets/all-wallets-B4me0K5m.js","assets/arrow-bottom-circle-BbZeFhay.js","assets/app-store-Qv2ptS3f.js","assets/apple-C5l4kwkh.js","assets/arrow-bottom-DwGqOnGA.js","assets/arrow-left-DefnsrID.js","assets/arrow-right-Cq0dDmyx.js","assets/arrow-top-zCeiVcat.js","assets/bank-DJsO82uc.js","assets/browser-DO6tW0wn.js","assets/card-CRYPZgjf.js","assets/checkmark-Bcx2tEBG.js","assets/checkmark-bold-BQ8epFIO.js","assets/chevron-bottom-BApXLOtb.js","assets/chevron-left-KyMwQd4x.js","assets/chevron-right-g1Biyx9y.js","assets/chevron-top-CCjpO72D.js","assets/chrome-store-xyJghvN2.js","assets/clock-BwBC3-Bu.js","assets/close-T4IBTcDe.js","assets/compass-D3d5JyZA.js","assets/coinPlaceholder-DPsWKOSs.js","assets/copy-XBBhYvsN.js","assets/cursor-B1CGOnxM.js","assets/cursor-transparent-D5h5Pv4_.js","assets/desktop-Dgp9N5jg.js","assets/disconnect-CtvZ3GQt.js","assets/discord-5pwKNfED.js","assets/etherscan-DbatbZ3N.js","assets/extension-DwJV5o5F.js","assets/external-link-86INwhuY.js","assets/facebook-DExC2uv0.js","assets/farcaster-DbJFpnjS.js","assets/filters-fnB9McJY.js","assets/github-UX6YIAgE.js","assets/google-DsxLXj9F.js","assets/help-circle-DcTZzNSz.js","assets/image-OVOlig16.js","assets/id-Bv45C3_1.js","assets/info-circle-DX58wlPN.js","assets/lightbulb-7U02MALa.js","assets/mail-C7-nMA8v.js","assets/mobile-DbypDvE8.js","assets/more-CxfPtOVd.js","assets/network-placeholder-DtIlSaKi.js","assets/nftPlaceholder-DaZASi_D.js","assets/off-CZBty2S1.js","assets/play-store-6o9eslyP.js","assets/plus-D0Bgxhf1.js","assets/qr-code-BkxK9Dvo.js","assets/recycle-horizontal-B317D2uX.js","assets/refresh-DaarRSO4.js","assets/search-DKuu-fFH.js","assets/send-DMmz0Tv5.js","assets/swapHorizontal-B4KztdD5.js","assets/swapHorizontalMedium-Brfk01FB.js","assets/swapHorizontalBold-BIsK4YtH.js","assets/swapHorizontalRoundedBold-CHXC4mBR.js","assets/swapVertical-9sfhsBEz.js","assets/telegram-BEY4pYb8.js","assets/three-dots-CwzR49O7.js","assets/twitch-BEMZIo2G.js","assets/x-DnxX4PfM.js","assets/twitterIcon-DBuzrWwd.js","assets/verify-BhPIbx1p.js","assets/verify-filled-CorPln4z.js","assets/wallet-BTqRjXxG.js","assets/walletconnect-CRxGzAth.js","assets/wallet-placeholder-DOkcpRsH.js","assets/warning-circle-D-2JKkn1.js","assets/info-BHdAgQyu.js","assets/exclamation-triangle-DZp_c314.js","assets/reown-logo-DAznGM6m.js"])))=>i.map(i=>d[i]);
import{q as t,u as a,x as r,y as o,ar as e,as as i}from"./index-DXlF7dvv.js";import{r as n,c as s,e as c}from"./core-CPB-qoZL.js";import{_ as l}from"./wagmi-vendor-O52zNBec.js";const g={getSpacingStyles:(t,a)=>Array.isArray(t)?t[a]?`var(--wui-spacing-${t[a]})`:void 0:"string"==typeof t?`var(--wui-spacing-${t})`:void 0,getFormattedDate:t=>new Intl.DateTimeFormat("en-US",{month:"short",day:"numeric"}).format(t),getHostName(t){try{return new URL(t).hostname}catch(a){return""}},getTruncateString:({string:t,charsStart:a,charsEnd:r,truncate:o})=>t.length<=a+r?t:"end"===o?`${t.substring(0,a)}...`:"start"===o?`...${t.substring(t.length-r)}`:`${t.substring(0,Math.floor(a))}...${t.substring(t.length-Math.floor(r))}`,generateAvatarColors(t){const a=t.toLowerCase().replace(/^0x/iu,"").replace(/[^a-f0-9]/gu,"").substring(0,6).padEnd(6,"0"),r=this.hexToRgb(a),o=getComputedStyle(document.documentElement).getPropertyValue("--w3m-border-radius-master"),e=100-3*Number(null==o?void 0:o.replace("px","")),i=`${e}% ${e}% at 65% 40%`,n=[];for(let s=0;s<5;s+=1){const t=this.tintColor(r,.15*s);n.push(`rgb(${t[0]}, ${t[1]}, ${t[2]})`)}return`\n    --local-color-1: ${n[0]};\n    --local-color-2: ${n[1]};\n    --local-color-3: ${n[2]};\n    --local-color-4: ${n[3]};\n    --local-color-5: ${n[4]};\n    --local-radial-circle: ${i}\n   `},hexToRgb(t){const a=parseInt(t,16);return[a>>16&255,a>>8&255,255&a]},tintColor(t,a){const[r,o,e]=t;return[Math.round(r+(255-r)*a),Math.round(o+(255-o)*a),Math.round(e+(255-e)*a)]},isNumber:t=>/^[0-9]+$/u.test(t),getColorTheme(t){var a;return t||("undefined"!=typeof window&&window.matchMedia?(null==(a=window.matchMedia("(prefers-color-scheme: dark)"))?void 0:a.matches)?"dark":"light":"dark")},splitBalance(t){const a=t.split(".");return 2===a.length?[a[0],a[1]]:["0","00"]},roundNumber:(t,a,r)=>t.toString().length>=a?Number(t).toFixed(r):t,formatNumberToLocalString:(t,a=2)=>void 0===t?"0.00":"number"==typeof t?t.toLocaleString("en-US",{maximumFractionDigits:a,minimumFractionDigits:a}):parseFloat(t).toLocaleString("en-US",{maximumFractionDigits:a,minimumFractionDigits:a})};function w(t){return function(a){return"function"==typeof a?function(t,a){return customElements.get(t)||customElements.define(t,a),a}(t,a):function(t,a){const{kind:r,elements:o}=a;return{kind:r,elements:o,finisher(a){customElements.get(t)||customElements.define(t,a)}}}(t,a)}}const p=t`
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
`;var _=function(t,a,r,o){var e,i=arguments.length,n=i<3?a:null===o?o=Object.getOwnPropertyDescriptor(a,r):o;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)n=Reflect.decorate(t,a,r,o);else for(var s=t.length-1;s>=0;s--)(e=t[s])&&(n=(i<3?e(n):i>3?e(a,r,n):e(a,r))||n);return i>3&&n&&Object.defineProperty(a,r,n),n};const m={add:async()=>(await l(async()=>{const{addSvg:t}=await import("./add-leJEwW1O.js");return{addSvg:t}},__vite__mapDeps([0,1,2,3,4,5,6]))).addSvg,allWallets:async()=>(await l(async()=>{const{allWalletsSvg:t}=await import("./all-wallets-B4me0K5m.js");return{allWalletsSvg:t}},__vite__mapDeps([7,1,2,3,4,5,6]))).allWalletsSvg,arrowBottomCircle:async()=>(await l(async()=>{const{arrowBottomCircleSvg:t}=await import("./arrow-bottom-circle-BbZeFhay.js");return{arrowBottomCircleSvg:t}},__vite__mapDeps([8,1,2,3,4,5,6]))).arrowBottomCircleSvg,appStore:async()=>(await l(async()=>{const{appStoreSvg:t}=await import("./app-store-Qv2ptS3f.js");return{appStoreSvg:t}},__vite__mapDeps([9,1,2,3,4,5,6]))).appStoreSvg,apple:async()=>(await l(async()=>{const{appleSvg:t}=await import("./apple-C5l4kwkh.js");return{appleSvg:t}},__vite__mapDeps([10,1,2,3,4,5,6]))).appleSvg,arrowBottom:async()=>(await l(async()=>{const{arrowBottomSvg:t}=await import("./arrow-bottom-DwGqOnGA.js");return{arrowBottomSvg:t}},__vite__mapDeps([11,1,2,3,4,5,6]))).arrowBottomSvg,arrowLeft:async()=>(await l(async()=>{const{arrowLeftSvg:t}=await import("./arrow-left-DefnsrID.js");return{arrowLeftSvg:t}},__vite__mapDeps([12,1,2,3,4,5,6]))).arrowLeftSvg,arrowRight:async()=>(await l(async()=>{const{arrowRightSvg:t}=await import("./arrow-right-Cq0dDmyx.js");return{arrowRightSvg:t}},__vite__mapDeps([13,1,2,3,4,5,6]))).arrowRightSvg,arrowTop:async()=>(await l(async()=>{const{arrowTopSvg:t}=await import("./arrow-top-zCeiVcat.js");return{arrowTopSvg:t}},__vite__mapDeps([14,1,2,3,4,5,6]))).arrowTopSvg,bank:async()=>(await l(async()=>{const{bankSvg:t}=await import("./bank-DJsO82uc.js");return{bankSvg:t}},__vite__mapDeps([15,1,2,3,4,5,6]))).bankSvg,browser:async()=>(await l(async()=>{const{browserSvg:t}=await import("./browser-DO6tW0wn.js");return{browserSvg:t}},__vite__mapDeps([16,1,2,3,4,5,6]))).browserSvg,card:async()=>(await l(async()=>{const{cardSvg:t}=await import("./card-CRYPZgjf.js");return{cardSvg:t}},__vite__mapDeps([17,1,2,3,4,5,6]))).cardSvg,checkmark:async()=>(await l(async()=>{const{checkmarkSvg:t}=await import("./checkmark-Bcx2tEBG.js");return{checkmarkSvg:t}},__vite__mapDeps([18,1,2,3,4,5,6]))).checkmarkSvg,checkmarkBold:async()=>(await l(async()=>{const{checkmarkBoldSvg:t}=await import("./checkmark-bold-BQ8epFIO.js");return{checkmarkBoldSvg:t}},__vite__mapDeps([19,1,2,3,4,5,6]))).checkmarkBoldSvg,chevronBottom:async()=>(await l(async()=>{const{chevronBottomSvg:t}=await import("./chevron-bottom-BApXLOtb.js");return{chevronBottomSvg:t}},__vite__mapDeps([20,1,2,3,4,5,6]))).chevronBottomSvg,chevronLeft:async()=>(await l(async()=>{const{chevronLeftSvg:t}=await import("./chevron-left-KyMwQd4x.js");return{chevronLeftSvg:t}},__vite__mapDeps([21,1,2,3,4,5,6]))).chevronLeftSvg,chevronRight:async()=>(await l(async()=>{const{chevronRightSvg:t}=await import("./chevron-right-g1Biyx9y.js");return{chevronRightSvg:t}},__vite__mapDeps([22,1,2,3,4,5,6]))).chevronRightSvg,chevronTop:async()=>(await l(async()=>{const{chevronTopSvg:t}=await import("./chevron-top-CCjpO72D.js");return{chevronTopSvg:t}},__vite__mapDeps([23,1,2,3,4,5,6]))).chevronTopSvg,chromeStore:async()=>(await l(async()=>{const{chromeStoreSvg:t}=await import("./chrome-store-xyJghvN2.js");return{chromeStoreSvg:t}},__vite__mapDeps([24,1,2,3,4,5,6]))).chromeStoreSvg,clock:async()=>(await l(async()=>{const{clockSvg:t}=await import("./clock-BwBC3-Bu.js");return{clockSvg:t}},__vite__mapDeps([25,1,2,3,4,5,6]))).clockSvg,close:async()=>(await l(async()=>{const{closeSvg:t}=await import("./close-T4IBTcDe.js");return{closeSvg:t}},__vite__mapDeps([26,1,2,3,4,5,6]))).closeSvg,compass:async()=>(await l(async()=>{const{compassSvg:t}=await import("./compass-D3d5JyZA.js");return{compassSvg:t}},__vite__mapDeps([27,1,2,3,4,5,6]))).compassSvg,coinPlaceholder:async()=>(await l(async()=>{const{coinPlaceholderSvg:t}=await import("./coinPlaceholder-DPsWKOSs.js");return{coinPlaceholderSvg:t}},__vite__mapDeps([28,1,2,3,4,5,6]))).coinPlaceholderSvg,copy:async()=>(await l(async()=>{const{copySvg:t}=await import("./copy-XBBhYvsN.js");return{copySvg:t}},__vite__mapDeps([29,1,2,3,4,5,6]))).copySvg,cursor:async()=>(await l(async()=>{const{cursorSvg:t}=await import("./cursor-B1CGOnxM.js");return{cursorSvg:t}},__vite__mapDeps([30,1,2,3,4,5,6]))).cursorSvg,cursorTransparent:async()=>(await l(async()=>{const{cursorTransparentSvg:t}=await import("./cursor-transparent-D5h5Pv4_.js");return{cursorTransparentSvg:t}},__vite__mapDeps([31,1,2,3,4,5,6]))).cursorTransparentSvg,desktop:async()=>(await l(async()=>{const{desktopSvg:t}=await import("./desktop-Dgp9N5jg.js");return{desktopSvg:t}},__vite__mapDeps([32,1,2,3,4,5,6]))).desktopSvg,disconnect:async()=>(await l(async()=>{const{disconnectSvg:t}=await import("./disconnect-CtvZ3GQt.js");return{disconnectSvg:t}},__vite__mapDeps([33,1,2,3,4,5,6]))).disconnectSvg,discord:async()=>(await l(async()=>{const{discordSvg:t}=await import("./discord-5pwKNfED.js");return{discordSvg:t}},__vite__mapDeps([34,1,2,3,4,5,6]))).discordSvg,etherscan:async()=>(await l(async()=>{const{etherscanSvg:t}=await import("./etherscan-DbatbZ3N.js");return{etherscanSvg:t}},__vite__mapDeps([35,1,2,3,4,5,6]))).etherscanSvg,extension:async()=>(await l(async()=>{const{extensionSvg:t}=await import("./extension-DwJV5o5F.js");return{extensionSvg:t}},__vite__mapDeps([36,1,2,3,4,5,6]))).extensionSvg,externalLink:async()=>(await l(async()=>{const{externalLinkSvg:t}=await import("./external-link-86INwhuY.js");return{externalLinkSvg:t}},__vite__mapDeps([37,1,2,3,4,5,6]))).externalLinkSvg,facebook:async()=>(await l(async()=>{const{facebookSvg:t}=await import("./facebook-DExC2uv0.js");return{facebookSvg:t}},__vite__mapDeps([38,1,2,3,4,5,6]))).facebookSvg,farcaster:async()=>(await l(async()=>{const{farcasterSvg:t}=await import("./farcaster-DbJFpnjS.js");return{farcasterSvg:t}},__vite__mapDeps([39,1,2,3,4,5,6]))).farcasterSvg,filters:async()=>(await l(async()=>{const{filtersSvg:t}=await import("./filters-fnB9McJY.js");return{filtersSvg:t}},__vite__mapDeps([40,1,2,3,4,5,6]))).filtersSvg,github:async()=>(await l(async()=>{const{githubSvg:t}=await import("./github-UX6YIAgE.js");return{githubSvg:t}},__vite__mapDeps([41,1,2,3,4,5,6]))).githubSvg,google:async()=>(await l(async()=>{const{googleSvg:t}=await import("./google-DsxLXj9F.js");return{googleSvg:t}},__vite__mapDeps([42,1,2,3,4,5,6]))).googleSvg,helpCircle:async()=>(await l(async()=>{const{helpCircleSvg:t}=await import("./help-circle-DcTZzNSz.js");return{helpCircleSvg:t}},__vite__mapDeps([43,1,2,3,4,5,6]))).helpCircleSvg,image:async()=>(await l(async()=>{const{imageSvg:t}=await import("./image-OVOlig16.js");return{imageSvg:t}},__vite__mapDeps([44,1,2,3,4,5,6]))).imageSvg,id:async()=>(await l(async()=>{const{idSvg:t}=await import("./id-Bv45C3_1.js");return{idSvg:t}},__vite__mapDeps([45,1,2,3,4,5,6]))).idSvg,infoCircle:async()=>(await l(async()=>{const{infoCircleSvg:t}=await import("./info-circle-DX58wlPN.js");return{infoCircleSvg:t}},__vite__mapDeps([46,1,2,3,4,5,6]))).infoCircleSvg,lightbulb:async()=>(await l(async()=>{const{lightbulbSvg:t}=await import("./lightbulb-7U02MALa.js");return{lightbulbSvg:t}},__vite__mapDeps([47,1,2,3,4,5,6]))).lightbulbSvg,mail:async()=>(await l(async()=>{const{mailSvg:t}=await import("./mail-C7-nMA8v.js");return{mailSvg:t}},__vite__mapDeps([48,1,2,3,4,5,6]))).mailSvg,mobile:async()=>(await l(async()=>{const{mobileSvg:t}=await import("./mobile-DbypDvE8.js");return{mobileSvg:t}},__vite__mapDeps([49,1,2,3,4,5,6]))).mobileSvg,more:async()=>(await l(async()=>{const{moreSvg:t}=await import("./more-CxfPtOVd.js");return{moreSvg:t}},__vite__mapDeps([50,1,2,3,4,5,6]))).moreSvg,networkPlaceholder:async()=>(await l(async()=>{const{networkPlaceholderSvg:t}=await import("./network-placeholder-DtIlSaKi.js");return{networkPlaceholderSvg:t}},__vite__mapDeps([51,1,2,3,4,5,6]))).networkPlaceholderSvg,nftPlaceholder:async()=>(await l(async()=>{const{nftPlaceholderSvg:t}=await import("./nftPlaceholder-DaZASi_D.js");return{nftPlaceholderSvg:t}},__vite__mapDeps([52,1,2,3,4,5,6]))).nftPlaceholderSvg,off:async()=>(await l(async()=>{const{offSvg:t}=await import("./off-CZBty2S1.js");return{offSvg:t}},__vite__mapDeps([53,1,2,3,4,5,6]))).offSvg,playStore:async()=>(await l(async()=>{const{playStoreSvg:t}=await import("./play-store-6o9eslyP.js");return{playStoreSvg:t}},__vite__mapDeps([54,1,2,3,4,5,6]))).playStoreSvg,plus:async()=>(await l(async()=>{const{plusSvg:t}=await import("./plus-D0Bgxhf1.js");return{plusSvg:t}},__vite__mapDeps([55,1,2,3,4,5,6]))).plusSvg,qrCode:async()=>(await l(async()=>{const{qrCodeIcon:t}=await import("./qr-code-BkxK9Dvo.js");return{qrCodeIcon:t}},__vite__mapDeps([56,1,2,3,4,5,6]))).qrCodeIcon,recycleHorizontal:async()=>(await l(async()=>{const{recycleHorizontalSvg:t}=await import("./recycle-horizontal-B317D2uX.js");return{recycleHorizontalSvg:t}},__vite__mapDeps([57,1,2,3,4,5,6]))).recycleHorizontalSvg,refresh:async()=>(await l(async()=>{const{refreshSvg:t}=await import("./refresh-DaarRSO4.js");return{refreshSvg:t}},__vite__mapDeps([58,1,2,3,4,5,6]))).refreshSvg,search:async()=>(await l(async()=>{const{searchSvg:t}=await import("./search-DKuu-fFH.js");return{searchSvg:t}},__vite__mapDeps([59,1,2,3,4,5,6]))).searchSvg,send:async()=>(await l(async()=>{const{sendSvg:t}=await import("./send-DMmz0Tv5.js");return{sendSvg:t}},__vite__mapDeps([60,1,2,3,4,5,6]))).sendSvg,swapHorizontal:async()=>(await l(async()=>{const{swapHorizontalSvg:t}=await import("./swapHorizontal-B4KztdD5.js");return{swapHorizontalSvg:t}},__vite__mapDeps([61,1,2,3,4,5,6]))).swapHorizontalSvg,swapHorizontalMedium:async()=>(await l(async()=>{const{swapHorizontalMediumSvg:t}=await import("./swapHorizontalMedium-Brfk01FB.js");return{swapHorizontalMediumSvg:t}},__vite__mapDeps([62,1,2,3,4,5,6]))).swapHorizontalMediumSvg,swapHorizontalBold:async()=>(await l(async()=>{const{swapHorizontalBoldSvg:t}=await import("./swapHorizontalBold-BIsK4YtH.js");return{swapHorizontalBoldSvg:t}},__vite__mapDeps([63,1,2,3,4,5,6]))).swapHorizontalBoldSvg,swapHorizontalRoundedBold:async()=>(await l(async()=>{const{swapHorizontalRoundedBoldSvg:t}=await import("./swapHorizontalRoundedBold-CHXC4mBR.js");return{swapHorizontalRoundedBoldSvg:t}},__vite__mapDeps([64,1,2,3,4,5,6]))).swapHorizontalRoundedBoldSvg,swapVertical:async()=>(await l(async()=>{const{swapVerticalSvg:t}=await import("./swapVertical-9sfhsBEz.js");return{swapVerticalSvg:t}},__vite__mapDeps([65,1,2,3,4,5,6]))).swapVerticalSvg,telegram:async()=>(await l(async()=>{const{telegramSvg:t}=await import("./telegram-BEY4pYb8.js");return{telegramSvg:t}},__vite__mapDeps([66,1,2,3,4,5,6]))).telegramSvg,threeDots:async()=>(await l(async()=>{const{threeDotsSvg:t}=await import("./three-dots-CwzR49O7.js");return{threeDotsSvg:t}},__vite__mapDeps([67,1,2,3,4,5,6]))).threeDotsSvg,twitch:async()=>(await l(async()=>{const{twitchSvg:t}=await import("./twitch-BEMZIo2G.js");return{twitchSvg:t}},__vite__mapDeps([68,1,2,3,4,5,6]))).twitchSvg,twitter:async()=>(await l(async()=>{const{xSvg:t}=await import("./x-DnxX4PfM.js");return{xSvg:t}},__vite__mapDeps([69,1,2,3,4,5,6]))).xSvg,twitterIcon:async()=>(await l(async()=>{const{twitterIconSvg:t}=await import("./twitterIcon-DBuzrWwd.js");return{twitterIconSvg:t}},__vite__mapDeps([70,1,2,3,4,5,6]))).twitterIconSvg,verify:async()=>(await l(async()=>{const{verifySvg:t}=await import("./verify-BhPIbx1p.js");return{verifySvg:t}},__vite__mapDeps([71,1,2,3,4,5,6]))).verifySvg,verifyFilled:async()=>(await l(async()=>{const{verifyFilledSvg:t}=await import("./verify-filled-CorPln4z.js");return{verifyFilledSvg:t}},__vite__mapDeps([72,1,2,3,4,5,6]))).verifyFilledSvg,wallet:async()=>(await l(async()=>{const{walletSvg:t}=await import("./wallet-BTqRjXxG.js");return{walletSvg:t}},__vite__mapDeps([73,1,2,3,4,5,6]))).walletSvg,walletConnect:async()=>(await l(async()=>{const{walletConnectSvg:t}=await import("./walletconnect-CRxGzAth.js");return{walletConnectSvg:t}},__vite__mapDeps([74,1,2,3,4,5,6]))).walletConnectSvg,walletConnectLightBrown:async()=>(await l(async()=>{const{walletConnectLightBrownSvg:t}=await import("./walletconnect-CRxGzAth.js");return{walletConnectLightBrownSvg:t}},__vite__mapDeps([74,1,2,3,4,5,6]))).walletConnectLightBrownSvg,walletConnectBrown:async()=>(await l(async()=>{const{walletConnectBrownSvg:t}=await import("./walletconnect-CRxGzAth.js");return{walletConnectBrownSvg:t}},__vite__mapDeps([74,1,2,3,4,5,6]))).walletConnectBrownSvg,walletPlaceholder:async()=>(await l(async()=>{const{walletPlaceholderSvg:t}=await import("./wallet-placeholder-DOkcpRsH.js");return{walletPlaceholderSvg:t}},__vite__mapDeps([75,1,2,3,4,5,6]))).walletPlaceholderSvg,warningCircle:async()=>(await l(async()=>{const{warningCircleSvg:t}=await import("./warning-circle-D-2JKkn1.js");return{warningCircleSvg:t}},__vite__mapDeps([76,1,2,3,4,5,6]))).warningCircleSvg,x:async()=>(await l(async()=>{const{xSvg:t}=await import("./x-DnxX4PfM.js");return{xSvg:t}},__vite__mapDeps([69,1,2,3,4,5,6]))).xSvg,info:async()=>(await l(async()=>{const{infoSvg:t}=await import("./info-BHdAgQyu.js");return{infoSvg:t}},__vite__mapDeps([77,1,2,3,4,5,6]))).infoSvg,exclamationTriangle:async()=>(await l(async()=>{const{exclamationTriangleSvg:t}=await import("./exclamation-triangle-DZp_c314.js");return{exclamationTriangleSvg:t}},__vite__mapDeps([78,1,2,3,4,5,6]))).exclamationTriangleSvg,reown:async()=>(await l(async()=>{const{reownSvg:t}=await import("./reown-logo-DAznGM6m.js");return{reownSvg:t}},__vite__mapDeps([79,1,2,3,4,5,6]))).reownSvg};let y=class extends r{constructor(){super(...arguments),this.size="md",this.name="copy",this.color="fg-300",this.aspectRatio="1 / 1"}render(){return this.style.cssText=`\n      --local-color: var(--wui-color-${this.color});\n      --local-width: var(--wui-icon-size-${this.size});\n      --local-aspect-ratio: ${this.aspectRatio}\n    `,o`${e(async function(t){if(h.has(t))return h.get(t);const a=(m[t]??m.copy)();return h.set(t,a),a}(this.name),o`<div class="fallback"></div>`)}`}};y.styles=[n,s,d],_([a()],y.prototype,"size",void 0),_([a()],y.prototype,"name",void 0),_([a()],y.prototype,"color",void 0),_([a()],y.prototype,"aspectRatio",void 0),y=_([w("wui-icon")],y);const f=t`
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
`;var D=function(t,a,r,o){var e,i=arguments.length,n=i<3?a:null===o?o=Object.getOwnPropertyDescriptor(a,r):o;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)n=Reflect.decorate(t,a,r,o);else for(var s=t.length-1;s>=0;s--)(e=t[s])&&(n=(i<3?e(n):i>3?e(a,r,n):e(a,r))||n);return i>3&&n&&Object.defineProperty(a,r,n),n};let L=class extends r{constructor(){super(...arguments),this.variant="main",this.size="lg"}render(){this.dataset.variant=this.variant,this.dataset.size=this.size;const t="md"===this.size?"mini-700":"micro-700";return o`
      <wui-text data-variant=${this.variant} variant=${t} color="inherit">
        <slot></slot>
      </wui-text>
    `}};L.styles=[n,T],D([a()],L.prototype,"variant",void 0),D([a()],L.prototype,"size",void 0),L=D([w("wui-tag")],L);const O=t`
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
    </svg>`}};I.styles=[n,O],z([a()],I.prototype,"color",void 0),z([a()],I.prototype,"size",void 0),I=z([w("wui-loading-spinner")],I);export{g as U,w as c};
