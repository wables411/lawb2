import{q as e,x as t,y as i,u as o,O as a,M as r}from"./index-DXlF7dvv.js";import{w as s,p as n,s as c,a as l,M as w,S as d,R as u,r as p,A as m,e as h,c as v,C as g,b as f,d as b,f as y,E as x,O as k,g as C,h as S,i as R,j as N,T as O,k as T,l as A,m as W}from"./core-CPB-qoZL.js";import{c as $,U as E}from"./index-DrrnjRRj.js";import"./wagmi-vendor-O52zNBec.js";import"./react-vendor-ZyuiJZO_.js";import"./chess-vendor-JTxzwGi1.js";import"./ui-vendor-BgPmeekb.js";import"./index.es-D3Dt8WoO.js";const P=n({message:"",open:!1,triggerRect:{width:0,height:0,top:0,left:0},variant:"shade"}),I=s({state:P,subscribe:e=>l(P,()=>e(P)),subscribeKey:(e,t)=>c(P,e,t),showTooltip({message:e,triggerRect:t,variant:i}){P.open=!0,P.message=e,P.triggerRect=t,P.variant=i},hide(){P.open=!1,P.message="",P.triggerRect={width:0,height:0,top:0,left:0}}}),j={isUnsupportedChainView:()=>"UnsupportedChain"===u.state.view||"SwitchNetwork"===u.state.view&&u.state.history.includes("UnsupportedChain"),async safeClose(){if(this.isUnsupportedChainView())return void w.shake();await d.isSIWXCloseDisabled()?w.shake():w.close()}},D=e`
  :host {
    display: block;
    border-radius: clamp(0px, var(--wui-border-radius-l), 44px);
    box-shadow: 0 0 0 1px var(--wui-color-gray-glass-005);
    background-color: var(--wui-color-modal-bg);
    overflow: hidden;
  }

  :host([data-embedded='true']) {
    box-shadow:
      0 0 0 1px var(--wui-color-gray-glass-005),
      0px 4px 12px 4px var(--w3m-card-embedded-shadow-color);
  }
`;let B=class extends t{render(){return i`<slot></slot>`}};B.styles=[p,D],B=function(e,t,i,o){var a,r=arguments.length,s=r<3?t:null===o?o=Object.getOwnPropertyDescriptor(t,i):o;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)s=Reflect.decorate(e,t,i,o);else for(var n=e.length-1;n>=0;n--)(a=e[n])&&(s=(r<3?a(s):r>3?a(t,i,s):a(t,i))||s);return r>3&&s&&Object.defineProperty(t,i,s),s}([$("wui-card")],B);const L=e`
  :host {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--wui-spacing-s);
    border-radius: var(--wui-border-radius-s);
    border: 1px solid var(--wui-color-dark-glass-100);
    box-sizing: border-box;
    background-color: var(--wui-color-bg-325);
    box-shadow: 0px 0px 16px 0px rgba(0, 0, 0, 0.25);
  }

  wui-flex {
    width: 100%;
  }

  wui-text {
    word-break: break-word;
    flex: 1;
  }

  .close {
    cursor: pointer;
  }

  .icon-box {
    height: 40px;
    width: 40px;
    border-radius: var(--wui-border-radius-3xs);
    background-color: var(--local-icon-bg-value);
  }
`;var z=function(e,t,i,o){var a,r=arguments.length,s=r<3?t:null===o?o=Object.getOwnPropertyDescriptor(t,i):o;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)s=Reflect.decorate(e,t,i,o);else for(var n=e.length-1;n>=0;n--)(a=e[n])&&(s=(r<3?a(s):r>3?a(t,i,s):a(t,i))||s);return r>3&&s&&Object.defineProperty(t,i,s),s};let U=class extends t{constructor(){super(...arguments),this.message="",this.backgroundColor="accent-100",this.iconColor="accent-100",this.icon="info"}render(){return this.style.cssText=`\n      --local-icon-bg-value: var(--wui-color-${this.backgroundColor});\n   `,i`
      <wui-flex flexDirection="row" justifyContent="space-between" alignItems="center">
        <wui-flex columnGap="xs" flexDirection="row" alignItems="center">
          <wui-flex
            flexDirection="row"
            alignItems="center"
            justifyContent="center"
            class="icon-box"
          >
            <wui-icon color=${this.iconColor} size="md" name=${this.icon}></wui-icon>
          </wui-flex>
          <wui-text variant="small-500" color="bg-350" data-testid="wui-alertbar-text"
            >${this.message}</wui-text
          >
        </wui-flex>
        <wui-icon
          class="close"
          color="bg-350"
          size="sm"
          name="close"
          @click=${this.onClose}
        ></wui-icon>
      </wui-flex>
    `}onClose(){m.close()}};U.styles=[p,L],z([o()],U.prototype,"message",void 0),z([o()],U.prototype,"backgroundColor",void 0),z([o()],U.prototype,"iconColor",void 0),z([o()],U.prototype,"icon",void 0),U=z([$("wui-alertbar")],U);const H=e`
  :host {
    display: block;
    position: absolute;
    top: var(--wui-spacing-s);
    left: var(--wui-spacing-l);
    right: var(--wui-spacing-l);
    opacity: 0;
    pointer-events: none;
  }
`;var K=function(e,t,i,o){var a,r=arguments.length,s=r<3?t:null===o?o=Object.getOwnPropertyDescriptor(t,i):o;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)s=Reflect.decorate(e,t,i,o);else for(var n=e.length-1;n>=0;n--)(a=e[n])&&(s=(r<3?a(s):r>3?a(t,i,s):a(t,i))||s);return r>3&&s&&Object.defineProperty(t,i,s),s};const V={info:{backgroundColor:"fg-350",iconColor:"fg-325",icon:"info"},success:{backgroundColor:"success-glass-reown-020",iconColor:"success-125",icon:"checkmark"},warning:{backgroundColor:"warning-glass-reown-020",iconColor:"warning-100",icon:"warningCircle"},error:{backgroundColor:"error-glass-reown-020",iconColor:"error-125",icon:"exclamationTriangle"}};let X=class extends t{constructor(){super(),this.unsubscribe=[],this.open=m.state.open,this.onOpen(!0),this.unsubscribe.push(m.subscribeKey("open",e=>{this.open=e,this.onOpen(!1)}))}disconnectedCallback(){this.unsubscribe.forEach(e=>e())}render(){const{message:e,variant:t}=m.state,o=V[t];return i`
      <wui-alertbar
        message=${e}
        backgroundColor=${null==o?void 0:o.backgroundColor}
        iconColor=${null==o?void 0:o.iconColor}
        icon=${null==o?void 0:o.icon}
      ></wui-alertbar>
    `}onOpen(e){this.open?(this.animate([{opacity:0,transform:"scale(0.85)"},{opacity:1,transform:"scale(1)"}],{duration:150,fill:"forwards",easing:"ease"}),this.style.cssText="pointer-events: auto"):e||(this.animate([{opacity:1,transform:"scale(1)"},{opacity:0,transform:"scale(0.85)"}],{duration:150,fill:"forwards",easing:"ease"}),this.style.cssText="pointer-events: none")}};X.styles=H,K([a()],X.prototype,"open",void 0),X=K([$("w3m-alertbar")],X);const M=e`
  button {
    border-radius: var(--local-border-radius);
    color: var(--wui-color-fg-100);
    padding: var(--local-padding);
  }

  @media (max-width: 700px) {
    button {
      padding: var(--wui-spacing-s);
    }
  }

  button > wui-icon {
    pointer-events: none;
  }

  button:disabled > wui-icon {
    color: var(--wui-color-bg-300) !important;
  }

  button:disabled {
    background-color: transparent;
  }
`;var Y=function(e,t,i,o){var a,r=arguments.length,s=r<3?t:null===o?o=Object.getOwnPropertyDescriptor(t,i):o;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)s=Reflect.decorate(e,t,i,o);else for(var n=e.length-1;n>=0;n--)(a=e[n])&&(s=(r<3?a(s):r>3?a(t,i,s):a(t,i))||s);return r>3&&s&&Object.defineProperty(t,i,s),s};let _=class extends t{constructor(){super(...arguments),this.size="md",this.disabled=!1,this.icon="copy",this.iconColor="inherit"}render(){const e="lg"===this.size?"--wui-border-radius-xs":"--wui-border-radius-xxs",t="lg"===this.size?"--wui-spacing-1xs":"--wui-spacing-2xs";return this.style.cssText=`\n    --local-border-radius: var(${e});\n    --local-padding: var(${t});\n`,i`
      <button ?disabled=${this.disabled}>
        <wui-icon color=${this.iconColor} size=${this.size} name=${this.icon}></wui-icon>
      </button>
    `}};_.styles=[p,h,v,M],Y([o()],_.prototype,"size",void 0),Y([o({type:Boolean})],_.prototype,"disabled",void 0),Y([o()],_.prototype,"icon",void 0),Y([o()],_.prototype,"iconColor",void 0),_=Y([$("wui-icon-link")],_);const q=e`
  button {
    display: block;
    display: flex;
    align-items: center;
    padding: var(--wui-spacing-xxs);
    gap: var(--wui-spacing-xxs);
    transition: all var(--wui-ease-out-power-1) var(--wui-duration-md);
    border-radius: var(--wui-border-radius-xxs);
  }

  wui-image {
    border-radius: 100%;
    width: var(--wui-spacing-xl);
    height: var(--wui-spacing-xl);
  }

  wui-icon-box {
    width: var(--wui-spacing-xl);
    height: var(--wui-spacing-xl);
  }

  button:hover {
    background-color: var(--wui-color-gray-glass-002);
  }

  button:active {
    background-color: var(--wui-color-gray-glass-005);
  }
`;var G=function(e,t,i,o){var a,r=arguments.length,s=r<3?t:null===o?o=Object.getOwnPropertyDescriptor(t,i):o;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)s=Reflect.decorate(e,t,i,o);else for(var n=e.length-1;n>=0;n--)(a=e[n])&&(s=(r<3?a(s):r>3?a(t,i,s):a(t,i))||s);return r>3&&s&&Object.defineProperty(t,i,s),s};let F=class extends t{constructor(){super(...arguments),this.imageSrc=""}render(){return i`<button>
      ${this.imageTemplate()}
      <wui-icon size="xs" color="fg-200" name="chevronBottom"></wui-icon>
    </button>`}imageTemplate(){return this.imageSrc?i`<wui-image src=${this.imageSrc} alt="select visual"></wui-image>`:i`<wui-icon-box
      size="xxs"
      iconColor="fg-200"
      backgroundColor="fg-100"
      background="opaque"
      icon="networkPlaceholder"
    ></wui-icon-box>`}};F.styles=[p,h,v,q],G([o()],F.prototype,"imageSrc",void 0),F=G([$("wui-select")],F);const J=e`
  :host {
    height: 64px;
  }

  wui-text {
    text-transform: capitalize;
  }

  wui-flex.w3m-header-title {
    transform: translateY(0);
    opacity: 1;
  }

  wui-flex.w3m-header-title[view-direction='prev'] {
    animation:
      slide-down-out 120ms forwards var(--wui-ease-out-power-2),
      slide-down-in 120ms forwards var(--wui-ease-out-power-2);
    animation-delay: 0ms, 200ms;
  }

  wui-flex.w3m-header-title[view-direction='next'] {
    animation:
      slide-up-out 120ms forwards var(--wui-ease-out-power-2),
      slide-up-in 120ms forwards var(--wui-ease-out-power-2);
    animation-delay: 0ms, 200ms;
  }

  wui-icon-link[data-hidden='true'] {
    opacity: 0 !important;
    pointer-events: none;
  }

  @keyframes slide-up-out {
    from {
      transform: translateY(0px);
      opacity: 1;
    }
    to {
      transform: translateY(3px);
      opacity: 0;
    }
  }

  @keyframes slide-up-in {
    from {
      transform: translateY(-3px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }

  @keyframes slide-down-out {
    from {
      transform: translateY(0px);
      opacity: 1;
    }
    to {
      transform: translateY(-3px);
      opacity: 0;
    }
  }

  @keyframes slide-down-in {
    from {
      transform: translateY(3px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }
`;var Q=function(e,t,i,o){var a,r=arguments.length,s=r<3?t:null===o?o=Object.getOwnPropertyDescriptor(t,i):o;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)s=Reflect.decorate(e,t,i,o);else for(var n=e.length-1;n>=0;n--)(a=e[n])&&(s=(r<3?a(s):r>3?a(t,i,s):a(t,i))||s);return r>3&&s&&Object.defineProperty(t,i,s),s};const Z=["SmartSessionList"];function ee(){var e,t,i,o,a,r,s;const n=null==(t=null==(e=u.state.data)?void 0:e.connector)?void 0:t.name,c=null==(o=null==(i=u.state.data)?void 0:i.wallet)?void 0:o.name,l=null==(r=null==(a=u.state.data)?void 0:a.network)?void 0:r.name,w=c??n,d=C.getConnectors();return{Connect:`Connect ${1===d.length&&"w3m-email"===(null==(s=d[0])?void 0:s.id)?"Email":""} Wallet`,Create:"Create Wallet",ChooseAccountName:void 0,Account:void 0,AccountSettings:void 0,AllWallets:"All Wallets",ApproveTransaction:"Approve Transaction",BuyInProgress:"Buy",ConnectingExternal:w??"Connect Wallet",ConnectingWalletConnect:w??"WalletConnect",ConnectingWalletConnectBasic:"WalletConnect",ConnectingSiwe:"Sign In",Convert:"Convert",ConvertSelectToken:"Select token",ConvertPreview:"Preview convert",Downloads:w?`Get ${w}`:"Downloads",EmailLogin:"Email Login",EmailVerifyOtp:"Confirm Email",EmailVerifyDevice:"Register Device",GetWallet:"Get a wallet",Networks:"Choose Network",OnRampProviders:"Choose Provider",OnRampActivity:"Activity",OnRampTokenSelect:"Select Token",OnRampFiatSelect:"Select Currency",Pay:"How you pay",Profile:void 0,SwitchNetwork:l??"Switch Network",SwitchAddress:"Switch Address",Transactions:"Activity",UnsupportedChain:"Switch Network",UpgradeEmailWallet:"Upgrade your Wallet",UpdateEmailWallet:"Edit Email",UpdateEmailPrimaryOtp:"Confirm Current Email",UpdateEmailSecondaryOtp:"Confirm New Email",WhatIsABuy:"What is Buy?",RegisterAccountName:"Choose name",RegisterAccountNameSuccess:"",WalletReceive:"Receive",WalletCompatibleNetworks:"Compatible Networks",Swap:"Swap",SwapSelectToken:"Select token",SwapPreview:"Preview swap",WalletSend:"Send",WalletSendPreview:"Review send",WalletSendSelectToken:"Select Token",WhatIsANetwork:"What is a network?",WhatIsAWallet:"What is a wallet?",ConnectWallets:"Connect wallet",ConnectSocials:"All socials",ConnectingSocial:S.state.socialProvider?S.state.socialProvider:"Connect Social",ConnectingMultiChain:"Select chain",ConnectingFarcaster:"Farcaster",SwitchActiveChain:"Switch chain",SmartSessionCreated:void 0,SmartSessionList:"Smart Sessions",SIWXSignMessage:"Sign In",PayLoading:"Payment in progress"}}let te=class extends t{constructor(){super(),this.unsubscribe=[],this.heading=ee()[u.state.view],this.network=g.state.activeCaipNetwork,this.networkImage=f.getNetworkImage(this.network),this.showBack=!1,this.prevHistoryLength=1,this.view=u.state.view,this.viewDirection="",this.headerText=ee()[u.state.view],this.unsubscribe.push(b.subscribeNetworkImages(()=>{this.networkImage=f.getNetworkImage(this.network)}),u.subscribeKey("view",e=>{setTimeout(()=>{this.view=e,this.headerText=ee()[e]},y.ANIMATION_DURATIONS.HeaderText),this.onViewChange(),this.onHistoryChange()}),g.subscribeKey("activeCaipNetwork",e=>{this.network=e,this.networkImage=f.getNetworkImage(this.network)}))}disconnectCallback(){this.unsubscribe.forEach(e=>e())}render(){return i`
      <wui-flex .padding=${this.getPadding()} justifyContent="space-between" alignItems="center">
        ${this.leftHeaderTemplate()} ${this.titleTemplate()} ${this.rightHeaderTemplate()}
      </wui-flex>
    `}onWalletHelp(){x.sendEvent({type:"track",event:"CLICK_WALLET_HELP"}),u.push("WhatIsAWallet")}async onClose(){await j.safeClose()}rightHeaderTemplate(){var e,t,o;const a=null==(o=null==(t=null==(e=k)?void 0:e.state)?void 0:t.features)?void 0:o.smartSessions;return"Account"===u.state.view&&a?i`<wui-flex>
      <wui-icon-link
        icon="clock"
        @click=${()=>u.push("SmartSessionList")}
        data-testid="w3m-header-smart-sessions"
      ></wui-icon-link>
      ${this.closeButtonTemplate()}
    </wui-flex> `:this.closeButtonTemplate()}closeButtonTemplate(){return i`
      <wui-icon-link
        icon="close"
        @click=${this.onClose.bind(this)}
        data-testid="w3m-header-close"
      ></wui-icon-link>
    `}titleTemplate(){const e=Z.includes(this.view);return i`
      <wui-flex
        view-direction="${this.viewDirection}"
        class="w3m-header-title"
        alignItems="center"
        gap="xs"
      >
        <wui-text variant="paragraph-700" color="fg-100" data-testid="w3m-header-text"
          >${this.headerText}</wui-text
        >
        ${e?i`<wui-tag variant="main">Beta</wui-tag>`:null}
      </wui-flex>
    `}leftHeaderTemplate(){var e;const{view:t}=u.state,o="Connect"===t,a=k.state.enableEmbedded,s="ApproveTransaction"===t,n="ConnectingSiwe"===t,c="Account"===t,l=k.state.enableNetworkSwitch,w=s||n||o&&a;return c&&l?i`<wui-select
        id="dynamic"
        data-testid="w3m-account-select-network"
        active-network=${r(null==(e=this.network)?void 0:e.name)}
        @click=${this.onNetworks.bind(this)}
        imageSrc=${r(this.networkImage)}
      ></wui-select>`:this.showBack&&!w?i`<wui-icon-link
        data-testid="header-back"
        id="dynamic"
        icon="chevronLeft"
        @click=${this.onGoBack.bind(this)}
      ></wui-icon-link>`:i`<wui-icon-link
      data-hidden=${!o}
      id="dynamic"
      icon="helpCircle"
      @click=${this.onWalletHelp.bind(this)}
    ></wui-icon-link>`}onNetworks(){this.isAllowedNetworkSwitch()&&(x.sendEvent({type:"track",event:"CLICK_NETWORKS"}),u.push("Networks"))}isAllowedNetworkSwitch(){const e=g.getAllRequestedCaipNetworks(),t=!!e&&e.length>1,i=null==e?void 0:e.find(({id:e})=>{var t;return e===(null==(t=this.network)?void 0:t.id)});return t||!i}getPadding(){return this.heading?["l","2l","l","2l"]:["0","2l","0","2l"]}onViewChange(){const{history:e}=u.state;let t=y.VIEW_DIRECTION.Next;e.length<this.prevHistoryLength&&(t=y.VIEW_DIRECTION.Prev),this.prevHistoryLength=e.length,this.viewDirection=t}async onHistoryChange(){var e;const{history:t}=u.state,i=null==(e=this.shadowRoot)?void 0:e.querySelector("#dynamic");t.length>1&&!this.showBack&&i?(await i.animate([{opacity:1},{opacity:0}],{duration:200,fill:"forwards",easing:"ease"}).finished,this.showBack=!0,i.animate([{opacity:0},{opacity:1}],{duration:200,fill:"forwards",easing:"ease"})):t.length<=1&&this.showBack&&i&&(await i.animate([{opacity:1},{opacity:0}],{duration:200,fill:"forwards",easing:"ease"}).finished,this.showBack=!1,i.animate([{opacity:0},{opacity:1}],{duration:200,fill:"forwards",easing:"ease"}))}onGoBack(){u.goBack()}};te.styles=J,Q([a()],te.prototype,"heading",void 0),Q([a()],te.prototype,"network",void 0),Q([a()],te.prototype,"networkImage",void 0),Q([a()],te.prototype,"showBack",void 0),Q([a()],te.prototype,"prevHistoryLength",void 0),Q([a()],te.prototype,"view",void 0),Q([a()],te.prototype,"viewDirection",void 0),Q([a()],te.prototype,"headerText",void 0),te=Q([$("w3m-header")],te);const ie=e`
  :host {
    display: flex;
    column-gap: var(--wui-spacing-s);
    align-items: center;
    padding: var(--wui-spacing-xs) var(--wui-spacing-m) var(--wui-spacing-xs) var(--wui-spacing-xs);
    border-radius: var(--wui-border-radius-s);
    border: 1px solid var(--wui-color-gray-glass-005);
    box-sizing: border-box;
    background-color: var(--wui-color-bg-175);
    box-shadow:
      0px 14px 64px -4px rgba(0, 0, 0, 0.15),
      0px 8px 22px -6px rgba(0, 0, 0, 0.15);

    max-width: 300px;
  }

  :host wui-loading-spinner {
    margin-left: var(--wui-spacing-3xs);
  }
`;var oe=function(e,t,i,o){var a,r=arguments.length,s=r<3?t:null===o?o=Object.getOwnPropertyDescriptor(t,i):o;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)s=Reflect.decorate(e,t,i,o);else for(var n=e.length-1;n>=0;n--)(a=e[n])&&(s=(r<3?a(s):r>3?a(t,i,s):a(t,i))||s);return r>3&&s&&Object.defineProperty(t,i,s),s};let ae=class extends t{constructor(){super(...arguments),this.backgroundColor="accent-100",this.iconColor="accent-100",this.icon="checkmark",this.message="",this.loading=!1,this.iconType="default"}render(){return i`
      ${this.templateIcon()}
      <wui-text variant="paragraph-500" color="fg-100" data-testid="wui-snackbar-message"
        >${this.message}</wui-text
      >
    `}templateIcon(){return this.loading?i`<wui-loading-spinner size="md" color="accent-100"></wui-loading-spinner>`:"default"===this.iconType?i`<wui-icon size="xl" color=${this.iconColor} name=${this.icon}></wui-icon>`:i`<wui-icon-box
      size="sm"
      iconSize="xs"
      iconColor=${this.iconColor}
      backgroundColor=${this.backgroundColor}
      icon=${this.icon}
      background="opaque"
    ></wui-icon-box>`}};ae.styles=[p,ie],oe([o()],ae.prototype,"backgroundColor",void 0),oe([o()],ae.prototype,"iconColor",void 0),oe([o()],ae.prototype,"icon",void 0),oe([o()],ae.prototype,"message",void 0),oe([o()],ae.prototype,"loading",void 0),oe([o()],ae.prototype,"iconType",void 0),ae=oe([$("wui-snackbar")],ae);const re=e`
  :host {
    display: block;
    position: absolute;
    opacity: 0;
    pointer-events: none;
    top: 11px;
    left: 50%;
    width: max-content;
  }
`;var se=function(e,t,i,o){var a,r=arguments.length,s=r<3?t:null===o?o=Object.getOwnPropertyDescriptor(t,i):o;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)s=Reflect.decorate(e,t,i,o);else for(var n=e.length-1;n>=0;n--)(a=e[n])&&(s=(r<3?a(s):r>3?a(t,i,s):a(t,i))||s);return r>3&&s&&Object.defineProperty(t,i,s),s};const ne={loading:void 0,success:{backgroundColor:"success-100",iconColor:"success-100",icon:"checkmark"},error:{backgroundColor:"error-100",iconColor:"error-100",icon:"close"}};let ce=class extends t{constructor(){super(),this.unsubscribe=[],this.timeout=void 0,this.open=R.state.open,this.unsubscribe.push(R.subscribeKey("open",e=>{this.open=e,this.onOpen()}))}disconnectedCallback(){clearTimeout(this.timeout),this.unsubscribe.forEach(e=>e())}render(){const{message:e,variant:t,svg:o}=R.state,a=ne[t],{icon:r,iconColor:s}=o??a??{};return i`
      <wui-snackbar
        message=${e}
        backgroundColor=${null==a?void 0:a.backgroundColor}
        iconColor=${s}
        icon=${r}
        .loading=${"loading"===t}
      ></wui-snackbar>
    `}onOpen(){clearTimeout(this.timeout),this.open?(this.animate([{opacity:0,transform:"translateX(-50%) scale(0.85)"},{opacity:1,transform:"translateX(-50%) scale(1)"}],{duration:150,fill:"forwards",easing:"ease"}),this.timeout&&clearTimeout(this.timeout),R.state.autoClose&&(this.timeout=setTimeout(()=>R.hide(),2500))):this.animate([{opacity:1,transform:"translateX(-50%) scale(1)"},{opacity:0,transform:"translateX(-50%) scale(0.85)"}],{duration:150,fill:"forwards",easing:"ease"})}};ce.styles=re,se([a()],ce.prototype,"open",void 0),ce=se([$("w3m-snackbar")],ce);const le=e`
  :host {
    pointer-events: none;
  }

  :host > wui-flex {
    display: var(--w3m-tooltip-display);
    opacity: var(--w3m-tooltip-opacity);
    padding: 9px var(--wui-spacing-s) 10px var(--wui-spacing-s);
    border-radius: var(--wui-border-radius-xxs);
    color: var(--wui-color-bg-100);
    position: fixed;
    top: var(--w3m-tooltip-top);
    left: var(--w3m-tooltip-left);
    transform: translate(calc(-50% + var(--w3m-tooltip-parent-width)), calc(-100% - 8px));
    max-width: calc(var(--w3m-modal-width) - var(--wui-spacing-xl));
    transition: opacity 0.2s var(--wui-ease-out-power-2);
    will-change: opacity;
  }

  :host([data-variant='shade']) > wui-flex {
    background-color: var(--wui-color-bg-150);
    border: 1px solid var(--wui-color-gray-glass-005);
  }

  :host([data-variant='shade']) > wui-flex > wui-text {
    color: var(--wui-color-fg-150);
  }

  :host([data-variant='fill']) > wui-flex {
    background-color: var(--wui-color-fg-100);
    border: none;
  }

  wui-icon {
    position: absolute;
    width: 12px !important;
    height: 4px !important;
    color: var(--wui-color-bg-150);
  }

  wui-icon[data-placement='top'] {
    bottom: 0px;
    left: 50%;
    transform: translate(-50%, 95%);
  }

  wui-icon[data-placement='bottom'] {
    top: 0;
    left: 50%;
    transform: translate(-50%, -95%) rotate(180deg);
  }

  wui-icon[data-placement='right'] {
    top: 50%;
    left: 0;
    transform: translate(-65%, -50%) rotate(90deg);
  }

  wui-icon[data-placement='left'] {
    top: 50%;
    right: 0%;
    transform: translate(65%, -50%) rotate(270deg);
  }
`;var we=function(e,t,i,o){var a,r=arguments.length,s=r<3?t:null===o?o=Object.getOwnPropertyDescriptor(t,i):o;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)s=Reflect.decorate(e,t,i,o);else for(var n=e.length-1;n>=0;n--)(a=e[n])&&(s=(r<3?a(s):r>3?a(t,i,s):a(t,i))||s);return r>3&&s&&Object.defineProperty(t,i,s),s};let de=class extends t{constructor(){super(),this.unsubscribe=[],this.open=I.state.open,this.message=I.state.message,this.triggerRect=I.state.triggerRect,this.variant=I.state.variant,this.unsubscribe.push(I.subscribe(e=>{this.open=e.open,this.message=e.message,this.triggerRect=e.triggerRect,this.variant=e.variant}))}disconnectedCallback(){this.unsubscribe.forEach(e=>e())}render(){this.dataset.variant=this.variant;const e=this.triggerRect.top,t=this.triggerRect.left;return this.style.cssText=`\n    --w3m-tooltip-top: ${e}px;\n    --w3m-tooltip-left: ${t}px;\n    --w3m-tooltip-parent-width: ${this.triggerRect.width/2}px;\n    --w3m-tooltip-display: ${this.open?"flex":"none"};\n    --w3m-tooltip-opacity: ${this.open?1:0};\n    `,i`<wui-flex>
      <wui-icon data-placement="top" color="fg-100" size="inherit" name="cursor"></wui-icon>
      <wui-text color="inherit" variant="small-500">${this.message}</wui-text>
    </wui-flex>`}};de.styles=[le],we([a()],de.prototype,"open",void 0),we([a()],de.prototype,"message",void 0),we([a()],de.prototype,"triggerRect",void 0),we([a()],de.prototype,"variant",void 0),de=we([$("w3m-tooltip"),$("w3m-tooltip")],de);const ue=e`
  :host {
    --prev-height: 0px;
    --new-height: 0px;
    display: block;
  }

  div.w3m-router-container {
    transform: translateY(0);
    opacity: 1;
  }

  div.w3m-router-container[view-direction='prev'] {
    animation:
      slide-left-out 150ms forwards ease,
      slide-left-in 150ms forwards ease;
    animation-delay: 0ms, 200ms;
  }

  div.w3m-router-container[view-direction='next'] {
    animation:
      slide-right-out 150ms forwards ease,
      slide-right-in 150ms forwards ease;
    animation-delay: 0ms, 200ms;
  }

  @keyframes slide-left-out {
    from {
      transform: translateX(0px);
      opacity: 1;
    }
    to {
      transform: translateX(10px);
      opacity: 0;
    }
  }

  @keyframes slide-left-in {
    from {
      transform: translateX(-10px);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  @keyframes slide-right-out {
    from {
      transform: translateX(0px);
      opacity: 1;
    }
    to {
      transform: translateX(-10px);
      opacity: 0;
    }
  }

  @keyframes slide-right-in {
    from {
      transform: translateX(10px);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
`;var pe=function(e,t,i,o){var a,r=arguments.length,s=r<3?t:null===o?o=Object.getOwnPropertyDescriptor(t,i):o;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)s=Reflect.decorate(e,t,i,o);else for(var n=e.length-1;n>=0;n--)(a=e[n])&&(s=(r<3?a(s):r>3?a(t,i,s):a(t,i))||s);return r>3&&s&&Object.defineProperty(t,i,s),s};let me=class extends t{constructor(){super(),this.resizeObserver=void 0,this.prevHeight="0px",this.prevHistoryLength=1,this.unsubscribe=[],this.view=u.state.view,this.viewDirection="",this.unsubscribe.push(u.subscribeKey("view",e=>this.onViewChange(e)))}firstUpdated(){var e;this.resizeObserver=new ResizeObserver(([e])=>{const t=`${null==e?void 0:e.contentRect.height}px`;"0px"!==this.prevHeight&&(this.style.setProperty("--prev-height",this.prevHeight),this.style.setProperty("--new-height",t),this.style.animation="w3m-view-height 150ms forwards ease",this.style.height="auto"),setTimeout(()=>{this.prevHeight=t,this.style.animation="unset"},y.ANIMATION_DURATIONS.ModalHeight)}),null==(e=this.resizeObserver)||e.observe(this.getWrapper())}disconnectedCallback(){var e;null==(e=this.resizeObserver)||e.unobserve(this.getWrapper()),this.unsubscribe.forEach(e=>e())}render(){return i`<div class="w3m-router-container" view-direction="${this.viewDirection}">
      ${this.viewTemplate()}
    </div>`}viewTemplate(){switch(this.view){case"AccountSettings":return i`<w3m-account-settings-view></w3m-account-settings-view>`;case"Account":return i`<w3m-account-view></w3m-account-view>`;case"AllWallets":return i`<w3m-all-wallets-view></w3m-all-wallets-view>`;case"ApproveTransaction":return i`<w3m-approve-transaction-view></w3m-approve-transaction-view>`;case"BuyInProgress":return i`<w3m-buy-in-progress-view></w3m-buy-in-progress-view>`;case"ChooseAccountName":return i`<w3m-choose-account-name-view></w3m-choose-account-name-view>`;case"Connect":default:return i`<w3m-connect-view></w3m-connect-view>`;case"Create":return i`<w3m-connect-view walletGuide="explore"></w3m-connect-view>`;case"ConnectingWalletConnect":return i`<w3m-connecting-wc-view></w3m-connecting-wc-view>`;case"ConnectingWalletConnectBasic":return i`<w3m-connecting-wc-basic-view></w3m-connecting-wc-basic-view>`;case"ConnectingExternal":return i`<w3m-connecting-external-view></w3m-connecting-external-view>`;case"ConnectingSiwe":return i`<w3m-connecting-siwe-view></w3m-connecting-siwe-view>`;case"ConnectWallets":return i`<w3m-connect-wallets-view></w3m-connect-wallets-view>`;case"ConnectSocials":return i`<w3m-connect-socials-view></w3m-connect-socials-view>`;case"ConnectingSocial":return i`<w3m-connecting-social-view></w3m-connecting-social-view>`;case"Downloads":return i`<w3m-downloads-view></w3m-downloads-view>`;case"EmailLogin":return i`<w3m-email-login-view></w3m-email-login-view>`;case"EmailVerifyOtp":return i`<w3m-email-verify-otp-view></w3m-email-verify-otp-view>`;case"EmailVerifyDevice":return i`<w3m-email-verify-device-view></w3m-email-verify-device-view>`;case"GetWallet":return i`<w3m-get-wallet-view></w3m-get-wallet-view>`;case"Networks":return i`<w3m-networks-view></w3m-networks-view>`;case"SwitchNetwork":return i`<w3m-network-switch-view></w3m-network-switch-view>`;case"Profile":return i`<w3m-profile-view></w3m-profile-view>`;case"SwitchAddress":return i`<w3m-switch-address-view></w3m-switch-address-view>`;case"Transactions":return i`<w3m-transactions-view></w3m-transactions-view>`;case"OnRampProviders":return i`<w3m-onramp-providers-view></w3m-onramp-providers-view>`;case"OnRampActivity":return i`<w3m-onramp-activity-view></w3m-onramp-activity-view>`;case"OnRampTokenSelect":return i`<w3m-onramp-token-select-view></w3m-onramp-token-select-view>`;case"OnRampFiatSelect":return i`<w3m-onramp-fiat-select-view></w3m-onramp-fiat-select-view>`;case"UpgradeEmailWallet":return i`<w3m-upgrade-wallet-view></w3m-upgrade-wallet-view>`;case"UpdateEmailWallet":return i`<w3m-update-email-wallet-view></w3m-update-email-wallet-view>`;case"UpdateEmailPrimaryOtp":return i`<w3m-update-email-primary-otp-view></w3m-update-email-primary-otp-view>`;case"UpdateEmailSecondaryOtp":return i`<w3m-update-email-secondary-otp-view></w3m-update-email-secondary-otp-view>`;case"UnsupportedChain":return i`<w3m-unsupported-chain-view></w3m-unsupported-chain-view>`;case"Swap":return i`<w3m-swap-view></w3m-swap-view>`;case"SwapSelectToken":return i`<w3m-swap-select-token-view></w3m-swap-select-token-view>`;case"SwapPreview":return i`<w3m-swap-preview-view></w3m-swap-preview-view>`;case"WalletSend":return i`<w3m-wallet-send-view></w3m-wallet-send-view>`;case"WalletSendSelectToken":return i`<w3m-wallet-send-select-token-view></w3m-wallet-send-select-token-view>`;case"WalletSendPreview":return i`<w3m-wallet-send-preview-view></w3m-wallet-send-preview-view>`;case"WhatIsABuy":return i`<w3m-what-is-a-buy-view></w3m-what-is-a-buy-view>`;case"WalletReceive":return i`<w3m-wallet-receive-view></w3m-wallet-receive-view>`;case"WalletCompatibleNetworks":return i`<w3m-wallet-compatible-networks-view></w3m-wallet-compatible-networks-view>`;case"WhatIsAWallet":return i`<w3m-what-is-a-wallet-view></w3m-what-is-a-wallet-view>`;case"ConnectingMultiChain":return i`<w3m-connecting-multi-chain-view></w3m-connecting-multi-chain-view>`;case"WhatIsANetwork":return i`<w3m-what-is-a-network-view></w3m-what-is-a-network-view>`;case"ConnectingFarcaster":return i`<w3m-connecting-farcaster-view></w3m-connecting-farcaster-view>`;case"SwitchActiveChain":return i`<w3m-switch-active-chain-view></w3m-switch-active-chain-view>`;case"RegisterAccountName":return i`<w3m-register-account-name-view></w3m-register-account-name-view>`;case"RegisterAccountNameSuccess":return i`<w3m-register-account-name-success-view></w3m-register-account-name-success-view>`;case"SmartSessionCreated":return i`<w3m-smart-session-created-view></w3m-smart-session-created-view>`;case"SmartSessionList":return i`<w3m-smart-session-list-view></w3m-smart-session-list-view>`;case"SIWXSignMessage":return i`<w3m-siwx-sign-message-view></w3m-siwx-sign-message-view>`;case"Pay":return i`<w3m-pay-view></w3m-pay-view>`;case"PayLoading":return i`<w3m-pay-loading-view></w3m-pay-loading-view>`}}onViewChange(e){I.hide();let t=y.VIEW_DIRECTION.Next;const{history:i}=u.state;i.length<this.prevHistoryLength&&(t=y.VIEW_DIRECTION.Prev),this.prevHistoryLength=i.length,this.viewDirection=t,setTimeout(()=>{this.view=e},y.ANIMATION_DURATIONS.ViewTransition)}getWrapper(){var e;return null==(e=this.shadowRoot)?void 0:e.querySelector("div")}};me.styles=ue,pe([a()],me.prototype,"view",void 0),pe([a()],me.prototype,"viewDirection",void 0),me=pe([$("w3m-router")],me);const he=e`
  :host {
    z-index: var(--w3m-z-index);
    display: block;
    backface-visibility: hidden;
    will-change: opacity;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    pointer-events: none;
    opacity: 0;
    background-color: var(--wui-cover);
    transition: opacity 0.2s var(--wui-ease-out-power-2);
    will-change: opacity;
  }

  :host(.open) {
    opacity: 1;
  }

  :host(.appkit-modal) {
    position: relative;
    pointer-events: unset;
    background: none;
    width: 100%;
    opacity: 1;
  }

  wui-card {
    max-width: var(--w3m-modal-width);
    width: 100%;
    position: relative;
    animation: zoom-in 0.2s var(--wui-ease-out-power-2);
    animation-fill-mode: backwards;
    outline: none;
    transition:
      border-radius var(--wui-duration-lg) var(--wui-ease-out-power-1),
      background-color var(--wui-duration-lg) var(--wui-ease-out-power-1);
    will-change: border-radius, background-color;
  }

  :host(.appkit-modal) wui-card {
    max-width: 400px;
  }

  wui-card[shake='true'] {
    animation:
      zoom-in 0.2s var(--wui-ease-out-power-2),
      w3m-shake 0.5s var(--wui-ease-out-power-2);
  }

  wui-flex {
    overflow-x: hidden;
    overflow-y: auto;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
  }

  @media (max-height: 700px) and (min-width: 431px) {
    wui-flex {
      align-items: flex-start;
    }

    wui-card {
      margin: var(--wui-spacing-xxl) 0px;
    }
  }

  @media (max-width: 430px) {
    wui-flex {
      align-items: flex-end;
    }

    wui-card {
      max-width: 100%;
      border-bottom-left-radius: var(--local-border-bottom-mobile-radius);
      border-bottom-right-radius: var(--local-border-bottom-mobile-radius);
      border-bottom: none;
      animation: slide-in 0.2s var(--wui-ease-out-power-2);
    }

    wui-card[shake='true'] {
      animation:
        slide-in 0.2s var(--wui-ease-out-power-2),
        w3m-shake 0.5s var(--wui-ease-out-power-2);
    }
  }

  @keyframes zoom-in {
    0% {
      transform: scale(0.95) translateY(0);
    }
    100% {
      transform: scale(1) translateY(0);
    }
  }

  @keyframes slide-in {
    0% {
      transform: scale(1) translateY(50px);
    }
    100% {
      transform: scale(1) translateY(0);
    }
  }

  @keyframes w3m-shake {
    0% {
      transform: scale(1) rotate(0deg);
    }
    20% {
      transform: scale(1) rotate(-1deg);
    }
    40% {
      transform: scale(1) rotate(1.5deg);
    }
    60% {
      transform: scale(1) rotate(-1.5deg);
    }
    80% {
      transform: scale(1) rotate(1deg);
    }
    100% {
      transform: scale(1) rotate(0deg);
    }
  }

  @keyframes w3m-view-height {
    from {
      height: var(--prev-height);
    }
    to {
      height: var(--new-height);
    }
  }
`;var ve=function(e,t,i,o){var a,r=arguments.length,s=r<3?t:null===o?o=Object.getOwnPropertyDescriptor(t,i):o;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)s=Reflect.decorate(e,t,i,o);else for(var n=e.length-1;n>=0;n--)(a=e[n])&&(s=(r<3?a(s):r>3?a(t,i,s):a(t,i))||s);return r>3&&s&&Object.defineProperty(t,i,s),s};const ge="scroll-lock";class fe extends t{constructor(){super(),this.unsubscribe=[],this.abortController=void 0,this.hasPrefetched=!1,this.enableEmbedded=k.state.enableEmbedded,this.open=w.state.open,this.caipAddress=g.state.activeCaipAddress,this.caipNetwork=g.state.activeCaipNetwork,this.shake=w.state.shake,this.filterByNamespace=C.state.filterByNamespace,this.initializeTheming(),N.prefetchAnalyticsConfig(),this.unsubscribe.push(w.subscribeKey("open",e=>e?this.onOpen():this.onClose()),w.subscribeKey("shake",e=>this.shake=e),g.subscribeKey("activeCaipNetwork",e=>this.onNewNetwork(e)),g.subscribeKey("activeCaipAddress",e=>this.onNewAddress(e)),k.subscribeKey("enableEmbedded",e=>this.enableEmbedded=e),C.subscribeKey("filterByNamespace",e=>{var t;this.filterByNamespace===e||(null==(t=g.getAccountData(e))?void 0:t.caipAddress)||(N.fetchRecommendedWallets(),this.filterByNamespace=e)}))}firstUpdated(){if(this.caipAddress){if(this.enableEmbedded)return w.close(),void this.prefetch();this.onNewAddress(this.caipAddress)}this.open&&this.onOpen(),this.enableEmbedded&&this.prefetch()}disconnectedCallback(){this.unsubscribe.forEach(e=>e()),this.onRemoveKeyboardListener()}render(){return this.style.cssText=`\n      --local-border-bottom-mobile-radius: ${this.enableEmbedded?"clamp(0px, var(--wui-border-radius-l), 44px)":"0px"};\n    `,this.enableEmbedded?i`${this.contentTemplate()}
        <w3m-tooltip></w3m-tooltip> `:this.open?i`
          <wui-flex @click=${this.onOverlayClick.bind(this)} data-testid="w3m-modal-overlay">
            ${this.contentTemplate()}
          </wui-flex>
          <w3m-tooltip></w3m-tooltip>
        `:null}contentTemplate(){return i` <wui-card
      shake="${this.shake}"
      data-embedded="${r(this.enableEmbedded)}"
      role="alertdialog"
      aria-modal="true"
      tabindex="0"
      data-testid="w3m-modal-card"
    >
      <w3m-header></w3m-header>
      <w3m-router></w3m-router>
      <w3m-snackbar></w3m-snackbar>
      <w3m-alertbar></w3m-alertbar>
    </wui-card>`}async onOverlayClick(e){e.target===e.currentTarget&&await this.handleClose()}async handleClose(){await j.safeClose()}initializeTheming(){const{themeVariables:e,themeMode:t}=O.state,i=E.getColorTheme(t);T(e,i)}onClose(){this.open=!1,this.classList.remove("open"),this.onScrollUnlock(),R.hide(),this.onRemoveKeyboardListener()}onOpen(){this.open=!0,this.classList.add("open"),this.onScrollLock(),this.onAddKeyboardListener()}onScrollLock(){const e=document.createElement("style");e.dataset.w3m=ge,e.textContent="\n      body {\n        touch-action: none;\n        overflow: hidden;\n        overscroll-behavior: contain;\n      }\n      w3m-modal {\n        pointer-events: auto;\n      }\n    ",document.head.appendChild(e)}onScrollUnlock(){const e=document.head.querySelector(`style[data-w3m="${ge}"]`);e&&e.remove()}onAddKeyboardListener(){var e;this.abortController=new AbortController;const t=null==(e=this.shadowRoot)?void 0:e.querySelector("wui-card");null==t||t.focus(),window.addEventListener("keydown",e=>{if("Escape"===e.key)this.handleClose();else if("Tab"===e.key){const{tagName:i}=e.target;!i||i.includes("W3M-")||i.includes("WUI-")||null==t||t.focus()}},this.abortController)}onRemoveKeyboardListener(){var e;null==(e=this.abortController)||e.abort(),this.abortController=void 0}async onNewAddress(e){const t=g.state.isSwitchingNamespace,i=A.getPlainAddress(e),o=t&&i;!i&&!t?w.close():o&&u.goBack(),await d.initializeIfEnabled(),this.caipAddress=e,g.setIsSwitchingNamespace(!1)}onNewNetwork(e){var t,i,o;const a=this.caipNetwork,r=null==(t=null==a?void 0:a.caipNetworkId)?void 0:t.toString(),s=null==a?void 0:a.chainNamespace,n=null==(i=null==e?void 0:e.caipNetworkId)?void 0:i.toString(),c=null==e?void 0:e.chainNamespace,l=r!==n,d=l&&!(s!==c),p=(null==a?void 0:a.name)===W.UNSUPPORTED_NETWORK_NAME,m="ConnectingExternal"===u.state.view,h=!(null==(o=g.getAccountData(null==e?void 0:e.chainNamespace))?void 0:o.caipAddress),v="UnsupportedChain"===u.state.view;let f=!1;w.state.open&&!m&&(h?l&&(f=!0):(v||d&&!p)&&(f=!0)),f&&"SIWXSignMessage"!==u.state.view&&u.goBack(),this.caipNetwork=e}prefetch(){this.hasPrefetched||(N.prefetch(),N.fetchWalletsByPage({page:1}),this.hasPrefetched=!0)}}fe.styles=he,ve([o({type:Boolean})],fe.prototype,"enableEmbedded",void 0),ve([a()],fe.prototype,"open",void 0),ve([a()],fe.prototype,"caipAddress",void 0),ve([a()],fe.prototype,"caipNetwork",void 0),ve([a()],fe.prototype,"shake",void 0),ve([a()],fe.prototype,"filterByNamespace",void 0);let be=class extends fe{};be=ve([$("w3m-modal")],be);let ye=class extends fe{};ye=ve([$("appkit-modal")],ye);export{ye as AppKitModal,be as W3mModal,fe as W3mModalBase};
