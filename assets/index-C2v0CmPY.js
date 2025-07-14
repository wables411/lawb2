import{i as x,r as I,h as T,a as w,x as l,e as d,t as $,O as v,H as ce,A as m,d as f,M as W,f as k,p as be,C as b,c as _,R as g,b as U,S as P,W as F,k as C,s as pn,o as yi,B as Fi,K as hn,D as S,L as Te,m as wn,n as fn,Q as He,l as mn,T as Kt,U as gn,V as Ci}from"./index-J63mCFLn.js";import{n as c,c as h,o as p,U as A,r as u,e as $i}from"./if-defined-BeqiMS07.js";import"./index-CrA1OqAL.js";import"./index-BcqAjUkO.js";import"./index-BB58t1IL.js";import"./index-H_5XAoGu.js";import{W as as}from"./index-DyMun6tg.js";import"./index-C-DWpr7E.js";import"./index-B3c-N4BK.js";import"./index-Db0C4ytl.js";import"./index-DeKxIIJJ.js";import{n as bn}from"./index-BC-qDi60.js";import"./index-Bub2yXlZ.js";import"./index-r5xja-H5.js";import{M as ki}from"./index-B4cmQlDT.js";import"./index-DgfE55aj.js";import{e as oi,n as ri}from"./ref-Wr46fz2m.js";import"./index-BdOr9fJt.js";import"./index-CBMnj_DI.js";import"./index-DZuCm8NU.js";import"./index-I5h3gt5M.js";import{O as ut}from"./index-D-BYrs1F.js";import{e as xn}from"./index-kIW3rxzi.js";import{N as vn}from"./index-DVxbSRcC.js";import"./index-DnUFBPSE.js";import"./index-CvEcj9MI.js";import"./index-DNJPWgaj.js";import"./index-qJH9avQq.js";import"./index--WX-R_mo.js";import"./ConstantsUtil-Dmg8YACJ.js";const yn=x`
  :host {
    display: block;
  }

  button {
    border-radius: var(--wui-border-radius-3xl);
    background: var(--wui-color-gray-glass-002);
    display: flex;
    gap: var(--wui-spacing-xs);
    padding: var(--wui-spacing-3xs) var(--wui-spacing-xs) var(--wui-spacing-3xs)
      var(--wui-spacing-xs);
    border: 1px solid var(--wui-color-gray-glass-005);
  }

  button:disabled {
    background: var(--wui-color-gray-glass-015);
  }

  button:disabled > wui-text {
    color: var(--wui-color-gray-glass-015);
  }

  button:disabled > wui-flex > wui-text {
    color: var(--wui-color-gray-glass-015);
  }

  button:disabled > wui-image,
  button:disabled > wui-flex > wui-avatar {
    filter: grayscale(1);
  }

  button:has(wui-image) {
    padding: var(--wui-spacing-3xs) var(--wui-spacing-3xs) var(--wui-spacing-3xs)
      var(--wui-spacing-xs);
  }

  wui-text {
    color: var(--wui-color-fg-100);
  }

  wui-flex > wui-text {
    color: var(--wui-color-fg-200);
  }

  wui-image,
  wui-icon-box {
    border-radius: var(--wui-border-radius-3xl);
    width: 24px;
    height: 24px;
    box-shadow: 0 0 0 2px var(--wui-color-gray-glass-005);
  }

  wui-flex {
    border-radius: var(--wui-border-radius-3xl);
    border: 1px solid var(--wui-color-gray-glass-005);
    background: var(--wui-color-gray-glass-005);
    padding: 4px var(--wui-spacing-m) 4px var(--wui-spacing-xxs);
  }

  button.local-no-balance {
    border-radius: 0px;
    border: none;
    background: transparent;
  }

  wui-avatar {
    width: 20px;
    height: 20px;
    box-shadow: 0 0 0 2px var(--wui-color-accent-glass-010);
  }

  @media (max-width: 500px) {
    button {
      gap: 0px;
      padding: var(--wui-spacing-3xs) var(--wui-spacing-xs) !important;
      height: 32px;
    }
    wui-image,
    wui-icon-box,
    button > wui-text {
      visibility: hidden;
      width: 0px;
      height: 0px;
    }
    button {
      border-radius: 0px;
      border: none;
      background: transparent;
      padding: 0px;
    }
  }

  @media (hover: hover) and (pointer: fine) {
    button:hover:enabled > wui-flex > wui-text {
      color: var(--wui-color-fg-175);
    }

    button:active:enabled > wui-flex > wui-text {
      color: var(--wui-color-fg-175);
    }
  }
`;var J=function(a,e,t,n){var o=arguments.length,i=o<3?e:n===null?n=Object.getOwnPropertyDescriptor(e,t):n,r;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")i=Reflect.decorate(a,e,t,n);else for(var s=a.length-1;s>=0;s--)(r=a[s])&&(i=(o<3?r(i):o>3?r(e,t,i):r(e,t))||i);return o>3&&i&&Object.defineProperty(e,t,i),i};let K=class extends w{constructor(){super(...arguments),this.networkSrc=void 0,this.avatarSrc=void 0,this.balance=void 0,this.isUnsupportedChain=void 0,this.disabled=!1,this.loading=!1,this.address="",this.profileName="",this.charsStart=4,this.charsEnd=6}render(){return l`
      <button
        ?disabled=${this.disabled}
        class=${p(this.balance?void 0:"local-no-balance")}
      >
        ${this.balanceTemplate()}
        <wui-flex gap="xxs" alignItems="center">
          <wui-avatar
            .imageSrc=${this.avatarSrc}
            alt=${this.address}
            address=${this.address}
          ></wui-avatar>
          <wui-text variant="paragraph-600" color="inherit">
            ${this.address?A.getTruncateString({string:this.profileName||this.address,charsStart:this.profileName?18:this.charsStart,charsEnd:this.profileName?0:this.charsEnd,truncate:this.profileName?"end":"middle"}):null}
          </wui-text>
        </wui-flex>
      </button>
    `}balanceTemplate(){if(this.isUnsupportedChain)return l` <wui-icon-box
          size="sm"
          iconColor="error-100"
          backgroundColor="error-100"
          icon="warningCircle"
        ></wui-icon-box>
        <wui-text variant="paragraph-600" color="inherit"> Switch Network</wui-text>`;if(this.balance){const e=this.networkSrc?l`<wui-image src=${this.networkSrc}></wui-image>`:l`
            <wui-icon-box
              size="sm"
              iconColor="fg-200"
              backgroundColor="fg-300"
              icon="networkPlaceholder"
            ></wui-icon-box>
          `,t=this.loading?l`<wui-loading-spinner size="md" color="fg-200"></wui-loading-spinner>`:l`<wui-text variant="paragraph-600" color="inherit"> ${this.balance}</wui-text>`;return l`${e} ${t}`}return null}};K.styles=[I,T,yn];J([c()],K.prototype,"networkSrc",void 0);J([c()],K.prototype,"avatarSrc",void 0);J([c()],K.prototype,"balance",void 0);J([c({type:Boolean})],K.prototype,"isUnsupportedChain",void 0);J([c({type:Boolean})],K.prototype,"disabled",void 0);J([c({type:Boolean})],K.prototype,"loading",void 0);J([c()],K.prototype,"address",void 0);J([c()],K.prototype,"profileName",void 0);J([c()],K.prototype,"charsStart",void 0);J([c()],K.prototype,"charsEnd",void 0);K=J([h("wui-account-button")],K);var D=function(a,e,t,n){var o=arguments.length,i=o<3?e:n===null?n=Object.getOwnPropertyDescriptor(e,t):n,r;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")i=Reflect.decorate(a,e,t,n);else for(var s=a.length-1;s>=0;s--)(r=a[s])&&(i=(o<3?r(i):o>3?r(e,t,i):r(e,t))||i);return o>3&&i&&Object.defineProperty(e,t,i),i};class L extends w{constructor(){var e,t,n,o,i,r;super(...arguments),this.unsubscribe=[],this.disabled=!1,this.balance="show",this.charsStart=4,this.charsEnd=6,this.namespace=void 0,this.caipAddress=(e=d.getAccountData(this.namespace))==null?void 0:e.caipAddress,this.balanceVal=(t=d.getAccountData(this.namespace))==null?void 0:t.balance,this.balanceSymbol=(n=d.getAccountData(this.namespace))==null?void 0:n.balanceSymbol,this.profileName=(o=d.getAccountData(this.namespace))==null?void 0:o.profileName,this.profileImage=(i=d.getAccountData(this.namespace))==null?void 0:i.profileImage,this.network=(r=d.getNetworkData(this.namespace))==null?void 0:r.caipNetwork,this.networkImage=$.getNetworkImage(this.network),this.isSupported=v.state.allowUnsupportedChain?!0:d.state.activeChain?d.checkIfSupportedNetwork(d.state.activeChain):!0}firstUpdated(){const e=this.namespace;e?this.unsubscribe.push(d.subscribeChainProp("accountState",t=>{this.caipAddress=t==null?void 0:t.caipAddress,this.balanceVal=t==null?void 0:t.balance,this.balanceSymbol=t==null?void 0:t.balanceSymbol,this.profileName=t==null?void 0:t.profileName,this.profileImage=t==null?void 0:t.profileImage},e),d.subscribeChainProp("networkState",t=>{this.network=t==null?void 0:t.caipNetwork,this.isSupported=d.checkIfSupportedNetwork(e,t==null?void 0:t.caipNetwork),this.networkImage=$.getNetworkImage(t==null?void 0:t.caipNetwork)},e)):this.unsubscribe.push(ce.subscribeNetworkImages(()=>{this.networkImage=$.getNetworkImage(this.network)}),d.subscribeKey("activeCaipAddress",t=>{this.caipAddress=t}),m.subscribeKey("balance",t=>this.balanceVal=t),m.subscribeKey("balanceSymbol",t=>this.balanceSymbol=t),m.subscribeKey("profileName",t=>this.profileName=t),m.subscribeKey("profileImage",t=>this.profileImage=t),d.subscribeKey("activeCaipNetwork",t=>{this.network=t,this.networkImage=$.getNetworkImage(t),this.isSupported=t!=null&&t.chainNamespace?d.checkIfSupportedNetwork(t==null?void 0:t.chainNamespace):!0,this.fetchNetworkImage(t)}))}updated(){this.fetchNetworkImage(this.network)}disconnectedCallback(){this.unsubscribe.forEach(e=>e())}render(){if(!d.state.activeChain)return null;const e=this.balance==="show",t=typeof this.balanceVal!="string";return l`
      <wui-account-button
        .disabled=${!!this.disabled}
        .isUnsupportedChain=${v.state.allowUnsupportedChain?!1:!this.isSupported}
        address=${p(f.getPlainAddress(this.caipAddress))}
        profileName=${p(this.profileName)}
        networkSrc=${p(this.networkImage)}
        avatarSrc=${p(this.profileImage)}
        balance=${e?f.formatBalance(this.balanceVal,this.balanceSymbol):""}
        @click=${this.onClick.bind(this)}
        data-testid=${`account-button${this.namespace?`-${this.namespace}`:""}`}
        .charsStart=${this.charsStart}
        .charsEnd=${this.charsEnd}
        ?loading=${t}
      >
      </wui-account-button>
    `}onClick(){this.isSupported||v.state.allowUnsupportedChain?W.open({namespace:this.namespace}):W.open({view:"UnsupportedChain"})}async fetchNetworkImage(e){var t,n;(t=e==null?void 0:e.assets)!=null&&t.imageId&&(this.networkImage=await $.fetchNetworkImage((n=e==null?void 0:e.assets)==null?void 0:n.imageId))}}D([c({type:Boolean})],L.prototype,"disabled",void 0);D([c()],L.prototype,"balance",void 0);D([c()],L.prototype,"charsStart",void 0);D([c()],L.prototype,"charsEnd",void 0);D([c()],L.prototype,"namespace",void 0);D([u()],L.prototype,"caipAddress",void 0);D([u()],L.prototype,"balanceVal",void 0);D([u()],L.prototype,"balanceSymbol",void 0);D([u()],L.prototype,"profileName",void 0);D([u()],L.prototype,"profileImage",void 0);D([u()],L.prototype,"network",void 0);D([u()],L.prototype,"networkImage",void 0);D([u()],L.prototype,"isSupported",void 0);let Si=class extends L{};Si=D([h("w3m-account-button")],Si);let _i=class extends L{};_i=D([h("appkit-account-button")],_i);const Cn=x`
  :host {
    display: block;
    width: max-content;
  }
`;var Z=function(a,e,t,n){var o=arguments.length,i=o<3?e:n===null?n=Object.getOwnPropertyDescriptor(e,t):n,r;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")i=Reflect.decorate(a,e,t,n);else for(var s=a.length-1;s>=0;s--)(r=a[s])&&(i=(o<3?r(i):o>3?r(e,t,i):r(e,t))||i);return o>3&&i&&Object.defineProperty(e,t,i),i};class G extends w{constructor(){super(...arguments),this.unsubscribe=[],this.disabled=!1,this.balance=void 0,this.size=void 0,this.label=void 0,this.loadingLabel=void 0,this.charsStart=4,this.charsEnd=6,this.namespace=void 0,this.caipAddress=d.state.activeCaipAddress}firstUpdated(){this.namespace?this.unsubscribe.push(d.subscribeChainProp("accountState",e=>{this.caipAddress=e==null?void 0:e.caipAddress},this.namespace)):this.unsubscribe.push(d.subscribeKey("activeCaipAddress",e=>this.caipAddress=e))}disconnectedCallback(){this.unsubscribe.forEach(e=>e())}render(){return this.caipAddress?l`
          <appkit-account-button
            .disabled=${!!this.disabled}
            balance=${p(this.balance)}
            .charsStart=${p(this.charsStart)}
            .charsEnd=${p(this.charsEnd)}
            namespace=${p(this.namespace)}
          >
          </appkit-account-button>
        `:l`
          <appkit-connect-button
            size=${p(this.size)}
            label=${p(this.label)}
            loadingLabel=${p(this.loadingLabel)}
            namespace=${p(this.namespace)}
          ></appkit-connect-button>
        `}}G.styles=Cn;Z([c({type:Boolean})],G.prototype,"disabled",void 0);Z([c()],G.prototype,"balance",void 0);Z([c()],G.prototype,"size",void 0);Z([c()],G.prototype,"label",void 0);Z([c()],G.prototype,"loadingLabel",void 0);Z([c()],G.prototype,"charsStart",void 0);Z([c()],G.prototype,"charsEnd",void 0);Z([c()],G.prototype,"namespace",void 0);Z([u()],G.prototype,"caipAddress",void 0);let Ii=class extends G{};Ii=Z([h("w3m-button")],Ii);let Ti=class extends G{};Ti=Z([h("appkit-button")],Ti);const $n=x`
  :host {
    position: relative;
    display: block;
  }

  button {
    background: var(--wui-color-accent-100);
    border: 1px solid var(--wui-color-gray-glass-010);
    border-radius: var(--wui-border-radius-m);
    gap: var(--wui-spacing-xs);
  }

  button.loading {
    background: var(--wui-color-gray-glass-010);
    border: 1px solid var(--wui-color-gray-glass-010);
    pointer-events: none;
  }

  button:disabled {
    background-color: var(--wui-color-gray-glass-015);
    border: 1px solid var(--wui-color-gray-glass-010);
  }

  button:disabled > wui-text {
    color: var(--wui-color-gray-glass-015);
  }

  @media (hover: hover) and (pointer: fine) {
    button:hover:enabled {
      background-color: var(--wui-color-accent-090);
    }

    button:active:enabled {
      background-color: var(--wui-color-accent-080);
    }
  }

  button:focus-visible {
    border: 1px solid var(--wui-color-gray-glass-010);
    background-color: var(--wui-color-accent-090);
    -webkit-box-shadow: 0px 0px 0px 4px var(--wui-box-shadow-blue);
    -moz-box-shadow: 0px 0px 0px 4px var(--wui-box-shadow-blue);
    box-shadow: 0px 0px 0px 4px var(--wui-box-shadow-blue);
  }

  button[data-size='sm'] {
    padding: 6.75px 10px 7.25px;
  }

  ::slotted(*) {
    transition: opacity var(--wui-ease-out-power-1) var(--wui-duration-md);
    will-change: opacity;
    opacity: var(--local-opacity-100);
  }

  button > wui-text {
    transition: opacity var(--wui-ease-out-power-1) var(--wui-duration-md);
    will-change: opacity;
    opacity: var(--local-opacity-100);
    color: var(--wui-color-inverse-100);
  }

  button[data-size='md'] {
    padding: 9px var(--wui-spacing-l) 9px var(--wui-spacing-l);
  }

  button[data-size='md'] + wui-text {
    padding-left: var(--wui-spacing-3xs);
  }

  @media (max-width: 500px) {
    button[data-size='md'] {
      height: 32px;
      padding: 5px 12px;
    }

    button[data-size='md'] > wui-text > slot {
      font-size: 14px !important;
    }
  }

  wui-loading-spinner {
    width: 14px;
    height: 14px;
  }

  wui-loading-spinner::slotted(svg) {
    width: 10px !important;
    height: 10px !important;
  }

  button[data-size='sm'] > wui-loading-spinner {
    width: 12px;
    height: 12px;
  }
`;var ai=function(a,e,t,n){var o=arguments.length,i=o<3?e:n===null?n=Object.getOwnPropertyDescriptor(e,t):n,r;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")i=Reflect.decorate(a,e,t,n);else for(var s=a.length-1;s>=0;s--)(r=a[s])&&(i=(o<3?r(i):o>3?r(e,t,i):r(e,t))||i);return o>3&&i&&Object.defineProperty(e,t,i),i};let qe=class extends w{constructor(){super(...arguments),this.size="md",this.loading=!1}render(){const e=this.size==="md"?"paragraph-600":"small-600";return l`
      <button data-size=${this.size} ?disabled=${this.loading}>
        ${this.loadingTemplate()}
        <wui-text variant=${e} color=${this.loading?"accent-100":"inherit"}>
          <slot></slot>
        </wui-text>
      </button>
    `}loadingTemplate(){return this.loading?l`<wui-loading-spinner size=${this.size} color="accent-100"></wui-loading-spinner>`:null}};qe.styles=[I,T,$n];ai([c()],qe.prototype,"size",void 0);ai([c({type:Boolean})],qe.prototype,"loading",void 0);qe=ai([h("wui-connect-button")],qe);var we=function(a,e,t,n){var o=arguments.length,i=o<3?e:n===null?n=Object.getOwnPropertyDescriptor(e,t):n,r;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")i=Reflect.decorate(a,e,t,n);else for(var s=a.length-1;s>=0;s--)(r=a[s])&&(i=(o<3?r(i):o>3?r(e,t,i):r(e,t))||i);return o>3&&i&&Object.defineProperty(e,t,i),i};class fe extends w{constructor(){super(),this.unsubscribe=[],this.size="md",this.label="Connect Wallet",this.loadingLabel="Connecting...",this.open=W.state.open,this.loading=this.namespace?W.state.loadingNamespaceMap.get(this.namespace):W.state.loading,this.unsubscribe.push(W.subscribe(e=>{this.open=e.open,this.loading=this.namespace?e.loadingNamespaceMap.get(this.namespace):e.loading}))}disconnectedCallback(){this.unsubscribe.forEach(e=>e())}render(){return l`
      <wui-connect-button
        size=${p(this.size)}
        .loading=${this.loading}
        @click=${this.onClick.bind(this)}
        data-testid=${`connect-button${this.namespace?`-${this.namespace}`:""}`}
      >
        ${this.loading?this.loadingLabel:this.label}
      </wui-connect-button>
    `}onClick(){this.open?W.close():this.loading||W.open({view:"Connect",namespace:this.namespace})}}we([c()],fe.prototype,"size",void 0);we([c()],fe.prototype,"label",void 0);we([c()],fe.prototype,"loadingLabel",void 0);we([c()],fe.prototype,"namespace",void 0);we([u()],fe.prototype,"open",void 0);we([u()],fe.prototype,"loading",void 0);let Ai=class extends fe{};Ai=we([h("w3m-connect-button")],Ai);let Wi=class extends fe{};Wi=we([h("appkit-connect-button")],Wi);const kn=x`
  :host {
    display: block;
  }

  button {
    border-radius: var(--wui-border-radius-3xl);
    display: flex;
    gap: var(--wui-spacing-xs);
    padding: var(--wui-spacing-2xs) var(--wui-spacing-s) var(--wui-spacing-2xs)
      var(--wui-spacing-xs);
    border: 1px solid var(--wui-color-gray-glass-010);
    background-color: var(--wui-color-gray-glass-005);
    color: var(--wui-color-fg-100);
  }

  button:disabled {
    border: 1px solid var(--wui-color-gray-glass-005);
    background-color: var(--wui-color-gray-glass-015);
    color: var(--wui-color-gray-glass-015);
  }

  @media (hover: hover) and (pointer: fine) {
    button:hover:enabled {
      background-color: var(--wui-color-gray-glass-010);
    }

    button:active:enabled {
      background-color: var(--wui-color-gray-glass-015);
    }
  }

  wui-image,
  wui-icon-box {
    border-radius: var(--wui-border-radius-3xl);
    width: 24px;
    height: 24px;
    box-shadow: 0 0 0 2px var(--wui-color-gray-glass-005);
  }
`;var Rt=function(a,e,t,n){var o=arguments.length,i=o<3?e:n===null?n=Object.getOwnPropertyDescriptor(e,t):n,r;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")i=Reflect.decorate(a,e,t,n);else for(var s=a.length-1;s>=0;s--)(r=a[s])&&(i=(o<3?r(i):o>3?r(e,t,i):r(e,t))||i);return o>3&&i&&Object.defineProperty(e,t,i),i};let Ae=class extends w{constructor(){super(...arguments),this.imageSrc=void 0,this.isUnsupportedChain=void 0,this.disabled=!1}render(){return l`
      <button data-testid="wui-network-button" ?disabled=${this.disabled}>
        ${this.visualTemplate()}
        <wui-text variant="paragraph-600" color="inherit">
          <slot></slot>
        </wui-text>
      </button>
    `}visualTemplate(){return this.isUnsupportedChain?l`
        <wui-icon-box
          size="sm"
          iconColor="error-100"
          backgroundColor="error-100"
          icon="warningCircle"
        ></wui-icon-box>
      `:this.imageSrc?l`<wui-image src=${this.imageSrc}></wui-image>`:l`
      <wui-icon-box
        size="sm"
        iconColor="inverse-100"
        backgroundColor="fg-100"
        icon="networkPlaceholder"
      ></wui-icon-box>
    `}};Ae.styles=[I,T,kn];Rt([c()],Ae.prototype,"imageSrc",void 0);Rt([c({type:Boolean})],Ae.prototype,"isUnsupportedChain",void 0);Rt([c({type:Boolean})],Ae.prototype,"disabled",void 0);Ae=Rt([h("wui-network-button")],Ae);const Sn=x`
  :host {
    display: block;
    width: max-content;
  }
`;var le=function(a,e,t,n){var o=arguments.length,i=o<3?e:n===null?n=Object.getOwnPropertyDescriptor(e,t):n,r;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")i=Reflect.decorate(a,e,t,n);else for(var s=a.length-1;s>=0;s--)(r=a[s])&&(i=(o<3?r(i):o>3?r(e,t,i):r(e,t))||i);return o>3&&i&&Object.defineProperty(e,t,i),i};class ne extends w{constructor(){super(),this.unsubscribe=[],this.disabled=!1,this.network=d.state.activeCaipNetwork,this.networkImage=$.getNetworkImage(this.network),this.caipAddress=d.state.activeCaipAddress,this.loading=W.state.loading,this.isSupported=v.state.allowUnsupportedChain?!0:d.state.activeChain?d.checkIfSupportedNetwork(d.state.activeChain):!0,this.unsubscribe.push(ce.subscribeNetworkImages(()=>{this.networkImage=$.getNetworkImage(this.network)}),d.subscribeKey("activeCaipAddress",e=>{this.caipAddress=e}),d.subscribeKey("activeCaipNetwork",e=>{var t;this.network=e,this.networkImage=$.getNetworkImage(e),this.isSupported=e!=null&&e.chainNamespace?d.checkIfSupportedNetwork(e.chainNamespace):!0,$.fetchNetworkImage((t=e==null?void 0:e.assets)==null?void 0:t.imageId)}),W.subscribeKey("loading",e=>this.loading=e))}firstUpdated(){var e,t;$.fetchNetworkImage((t=(e=this.network)==null?void 0:e.assets)==null?void 0:t.imageId)}disconnectedCallback(){this.unsubscribe.forEach(e=>e())}render(){const e=this.network?d.checkIfSupportedNetwork(this.network.chainNamespace):!0;return l`
      <wui-network-button
        .disabled=${!!(this.disabled||this.loading)}
        .isUnsupportedChain=${v.state.allowUnsupportedChain?!1:!e}
        imageSrc=${p(this.networkImage)}
        @click=${this.onClick.bind(this)}
        data-testid="w3m-network-button"
      >
        ${this.getLabel()}
        <slot></slot>
      </wui-network-button>
    `}getLabel(){return this.network?!this.isSupported&&!v.state.allowUnsupportedChain?"Switch Network":this.network.name:this.label?this.label:this.caipAddress?"Unknown Network":"Select Network"}onClick(){this.loading||(k.sendEvent({type:"track",event:"CLICK_NETWORKS"}),W.open({view:"Networks"}))}}ne.styles=Sn;le([c({type:Boolean})],ne.prototype,"disabled",void 0);le([c({type:String})],ne.prototype,"label",void 0);le([u()],ne.prototype,"network",void 0);le([u()],ne.prototype,"networkImage",void 0);le([u()],ne.prototype,"caipAddress",void 0);le([u()],ne.prototype,"loading",void 0);le([u()],ne.prototype,"isSupported",void 0);let Ri=class extends ne{};Ri=le([h("w3m-network-button")],Ri);let Ei=class extends ne{};Ei=le([h("appkit-network-button")],Ei);const _n=x`
  :host {
    display: block;
  }

  button {
    width: 100%;
    display: block;
    padding-top: var(--wui-spacing-l);
    padding-bottom: var(--wui-spacing-l);
    padding-left: var(--wui-spacing-s);
    padding-right: var(--wui-spacing-2l);
    border-radius: var(--wui-border-radius-s);
    background-color: var(--wui-color-accent-glass-010);
  }

  button:hover {
    background-color: var(--wui-color-accent-glass-015) !important;
  }

  button:active {
    background-color: var(--wui-color-accent-glass-020) !important;
  }
`;var Et=function(a,e,t,n){var o=arguments.length,i=o<3?e:n===null?n=Object.getOwnPropertyDescriptor(e,t):n,r;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")i=Reflect.decorate(a,e,t,n);else for(var s=a.length-1;s>=0;s--)(r=a[s])&&(i=(o<3?r(i):o>3?r(e,t,i):r(e,t))||i);return o>3&&i&&Object.defineProperty(e,t,i),i};let We=class extends w{constructor(){super(...arguments),this.label="",this.description="",this.icon="wallet"}render(){return l`
      <button>
        <wui-flex gap="m" alignItems="center" justifyContent="space-between">
          <wui-icon-box
            size="lg"
            iconcolor="accent-100"
            backgroundcolor="accent-100"
            icon=${this.icon}
            background="transparent"
          ></wui-icon-box>

          <wui-flex flexDirection="column" gap="3xs">
            <wui-text variant="paragraph-500" color="fg-100">${this.label}</wui-text>
            <wui-text variant="small-400" color="fg-200">${this.description}</wui-text>
          </wui-flex>

          <wui-icon size="md" color="fg-200" name="chevronRight"></wui-icon>
        </wui-flex>
      </button>
    `}};We.styles=[I,T,_n];Et([c()],We.prototype,"label",void 0);Et([c()],We.prototype,"description",void 0);Et([c()],We.prototype,"icon",void 0);We=Et([h("wui-notice-card")],We);var Ki=function(a,e,t,n){var o=arguments.length,i=o<3?e:n===null?n=Object.getOwnPropertyDescriptor(e,t):n,r;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")i=Reflect.decorate(a,e,t,n);else for(var s=a.length-1;s>=0;s--)(r=a[s])&&(i=(o<3?r(i):o>3?r(e,t,i):r(e,t))||i);return o>3&&i&&Object.defineProperty(e,t,i),i};let Ht=class extends w{constructor(){super(),this.unsubscribe=[],this.socialProvider=be.getConnectedSocialProvider(),this.socialUsername=be.getConnectedSocialUsername(),this.namespace=d.state.activeChain,this.unsubscribe.push(d.subscribeKey("activeChain",e=>{this.namespace=e}))}disconnectedCallback(){this.unsubscribe.forEach(e=>e())}render(){const e=b.getConnectorId(this.namespace),t=b.getAuthConnector();if(!t||e!==_.CONNECTOR_ID.AUTH)return this.style.cssText="display: none",null;const n=t.provider.getEmail()??"";return!n&&!this.socialUsername?(this.style.cssText="display: none",null):l`
      <wui-list-item
        variant="icon"
        iconVariant="overlay"
        icon=${this.socialProvider??"mail"}
        iconSize=${this.socialProvider?"xxl":"sm"}
        data-testid="w3m-account-email-update"
        ?chevron=${!this.socialProvider}
        @click=${()=>{this.onGoToUpdateEmail(n,this.socialProvider)}}
      >
        <wui-text variant="paragraph-500" color="fg-100">${this.getAuthName(n)}</wui-text>
      </wui-list-item>
    `}onGoToUpdateEmail(e,t){t||g.push("UpdateEmailWallet",{email:e,redirectView:"Account"})}getAuthName(e){return this.socialUsername?this.socialProvider==="discord"&&this.socialUsername.endsWith("0")?this.socialUsername.slice(0,-1):this.socialUsername:e.length>30?`${e.slice(0,-3)}...`:e}};Ki([u()],Ht.prototype,"namespace",void 0);Ht=Ki([h("w3m-account-auth-button")],Ht);var oe=function(a,e,t,n){var o=arguments.length,i=o<3?e:n===null?n=Object.getOwnPropertyDescriptor(e,t):n,r;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")i=Reflect.decorate(a,e,t,n);else for(var s=a.length-1;s>=0;s--)(r=a[s])&&(i=(o<3?r(i):o>3?r(e,t,i):r(e,t))||i);return o>3&&i&&Object.defineProperty(e,t,i),i};let Q=class extends w{constructor(){super(),this.usubscribe=[],this.networkImages=ce.state.networkImages,this.address=m.state.address,this.profileImage=m.state.profileImage,this.profileName=m.state.profileName,this.network=d.state.activeCaipNetwork,this.preferredAccountTypes=m.state.preferredAccountTypes,this.disconnecting=!1,this.loading=!1,this.switched=!1,this.text="",this.usubscribe.push(m.subscribe(e=>{e.address&&(this.address=e.address,this.profileImage=e.profileImage,this.profileName=e.profileName,this.preferredAccountTypes=e.preferredAccountTypes)}),m.subscribeKey("preferredAccountTypes",e=>this.preferredAccountTypes=e),d.subscribeKey("activeCaipNetwork",e=>{e!=null&&e.id&&(this.network=e)}))}disconnectedCallback(){this.usubscribe.forEach(e=>e())}render(){var t,n,o;if(!this.address)throw new Error("w3m-account-settings-view: No account provided");const e=this.networkImages[((n=(t=this.network)==null?void 0:t.assets)==null?void 0:n.imageId)??""];return l`
      <wui-flex
        flexDirection="column"
        alignItems="center"
        gap="l"
        .padding=${["0","xl","m","xl"]}
      >
        <wui-avatar
          alt=${this.address}
          address=${this.address}
          imageSrc=${p(this.profileImage)}
          size="2lg"
        ></wui-avatar>
        <wui-flex flexDirection="column" alignItems="center">
          <wui-flex gap="3xs" alignItems="center" justifyContent="center">
            <wui-text variant="title-6-600" color="fg-100" data-testid="account-settings-address">
              ${A.getTruncateString({string:this.address,charsStart:4,charsEnd:6,truncate:"middle"})}
            </wui-text>
            <wui-icon-link
              size="md"
              icon="copy"
              iconColor="fg-200"
              @click=${this.onCopyAddress}
            ></wui-icon-link>
          </wui-flex>
        </wui-flex>
      </wui-flex>
      <wui-flex flexDirection="column" gap="m">
        <wui-flex flexDirection="column" gap="xs" .padding=${["0","l","m","l"]}>
          ${this.authCardTemplate()}
          <w3m-account-auth-button></w3m-account-auth-button>
          <wui-list-item
            .variant=${e?"image":"icon"}
            iconVariant="overlay"
            icon="networkPlaceholder"
            imageSrc=${p(e)}
            ?chevron=${this.isAllowedNetworkSwitch()}
            @click=${this.onNetworks.bind(this)}
            data-testid="account-switch-network-button"
          >
            <wui-text variant="paragraph-500" color="fg-100">
              ${((o=this.network)==null?void 0:o.name)??"Unknown"}
            </wui-text>
          </wui-list-item>
          ${this.togglePreferredAccountBtnTemplate()} ${this.chooseNameButtonTemplate()}
          <wui-list-item
            variant="icon"
            iconVariant="overlay"
            icon="disconnect"
            ?chevron=${!1}
            .loading=${this.disconnecting}
            @click=${this.onDisconnect.bind(this)}
            data-testid="disconnect-button"
          >
            <wui-text variant="paragraph-500" color="fg-200">Disconnect</wui-text>
          </wui-list-item>
        </wui-flex>
      </wui-flex>
    `}chooseNameButtonTemplate(){var i;const e=(i=this.network)==null?void 0:i.chainNamespace,t=b.getConnectorId(e),n=b.getAuthConnector();return!d.checkIfNamesSupported()||!n||t!==_.CONNECTOR_ID.AUTH||this.profileName?null:l`
      <wui-list-item
        variant="icon"
        iconVariant="overlay"
        icon="id"
        iconSize="sm"
        ?chevron=${!0}
        @click=${this.onChooseName.bind(this)}
        data-testid="account-choose-name-button"
      >
        <wui-text variant="paragraph-500" color="fg-100">Choose account name </wui-text>
      </wui-list-item>
    `}authCardTemplate(){var i;const e=(i=this.network)==null?void 0:i.chainNamespace,t=b.getConnectorId(e),n=b.getAuthConnector(),{origin:o}=location;return!n||t!==_.CONNECTOR_ID.AUTH||o.includes(U.SECURE_SITE)?null:l`
      <wui-notice-card
        @click=${this.onGoToUpgradeView.bind(this)}
        label="Upgrade your wallet"
        description="Transition to a self-custodial wallet"
        icon="wallet"
        data-testid="w3m-wallet-upgrade-card"
      ></wui-notice-card>
    `}isAllowedNetworkSwitch(){const e=d.getAllRequestedCaipNetworks(),t=e?e.length>1:!1,n=e==null?void 0:e.find(({id:o})=>{var i;return o===((i=this.network)==null?void 0:i.id)});return t||!n}onCopyAddress(){try{this.address&&(f.copyToClopboard(this.address),P.showSuccess("Address copied"))}catch{P.showError("Failed to copy")}}togglePreferredAccountBtnTemplate(){var i,r;const e=(i=this.network)==null?void 0:i.chainNamespace,t=d.checkIfSmartAccountEnabled(),n=b.getConnectorId(e);return!b.getAuthConnector()||n!==_.CONNECTOR_ID.AUTH||!t?null:(this.switched||(this.text=((r=this.preferredAccountTypes)==null?void 0:r[e])===F.ACCOUNT_TYPES.SMART_ACCOUNT?"Switch to your EOA":"Switch to your smart account"),l`
      <wui-list-item
        variant="icon"
        iconVariant="overlay"
        icon="swapHorizontalBold"
        iconSize="sm"
        ?chevron=${!0}
        ?loading=${this.loading}
        @click=${this.changePreferredAccountType.bind(this)}
        data-testid="account-toggle-preferred-account-type"
      >
        <wui-text variant="paragraph-500" color="fg-100">${this.text}</wui-text>
      </wui-list-item>
    `)}onChooseName(){g.push("ChooseAccountName")}async changePreferredAccountType(){var i,r;const e=(i=this.network)==null?void 0:i.chainNamespace,t=d.checkIfSmartAccountEnabled(),n=((r=this.preferredAccountTypes)==null?void 0:r[e])===F.ACCOUNT_TYPES.SMART_ACCOUNT||!t?F.ACCOUNT_TYPES.EOA:F.ACCOUNT_TYPES.SMART_ACCOUNT;b.getAuthConnector()&&(this.loading=!0,await C.setPreferredAccountType(n,e),this.text=n===F.ACCOUNT_TYPES.SMART_ACCOUNT?"Switch to your EOA":"Switch to your smart account",this.switched=!0,pn.resetSend(),this.loading=!1,this.requestUpdate())}onNetworks(){this.isAllowedNetworkSwitch()&&g.push("Networks")}async onDisconnect(){try{this.disconnecting=!0,await C.disconnect(),W.close()}catch{k.sendEvent({type:"track",event:"DISCONNECT_ERROR"}),P.showError("Failed to disconnect")}finally{this.disconnecting=!1}}onGoToUpgradeView(){k.sendEvent({type:"track",event:"EMAIL_UPGRADE_FROM_MODAL"}),g.push("UpgradeEmailWallet")}};oe([u()],Q.prototype,"address",void 0);oe([u()],Q.prototype,"profileImage",void 0);oe([u()],Q.prototype,"profileName",void 0);oe([u()],Q.prototype,"network",void 0);oe([u()],Q.prototype,"preferredAccountTypes",void 0);oe([u()],Q.prototype,"disconnecting",void 0);oe([u()],Q.prototype,"loading",void 0);oe([u()],Q.prototype,"switched",void 0);oe([u()],Q.prototype,"text",void 0);Q=oe([h("w3m-account-settings-view")],Q);const In=x`
  button {
    background-color: var(--wui-color-gray-glass-002);
    border-radius: var(--wui-border-radius-3xl);
    border: 1px solid var(--wui-color-gray-glass-002);
    padding: var(--wui-spacing-xs) var(--wui-spacing-s) var(--wui-spacing-xs) var(--wui-spacing-xs);
    position: relative;
  }

  wui-avatar {
    width: 32px;
    height: 32px;
    box-shadow: 0 0 0 0;
    outline: 3px solid var(--wui-color-gray-glass-005);
  }

  wui-icon-box,
  wui-image {
    width: 16px;
    height: 16px;
    border-radius: var(--wui-border-radius-3xl);
    position: absolute;
    left: 26px;
    top: 24px;
  }

  wui-image {
    outline: 2px solid var(--wui-color-bg-125);
  }

  wui-icon-box {
    outline: 2px solid var(--wui-color-bg-200);
    background-color: var(--wui-color-bg-250);
  }
`;var _e=function(a,e,t,n){var o=arguments.length,i=o<3?e:n===null?n=Object.getOwnPropertyDescriptor(e,t):n,r;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")i=Reflect.decorate(a,e,t,n);else for(var s=a.length-1;s>=0;s--)(r=a[s])&&(i=(o<3?r(i):o>3?r(e,t,i):r(e,t))||i);return o>3&&i&&Object.defineProperty(e,t,i),i};let ae=class extends w{constructor(){super(...arguments),this.avatarSrc=void 0,this.profileName="",this.address="",this.icon="mail"}render(){const e=d.state.activeChain,n=b.getConnectorId(e)===_.CONNECTOR_ID.AUTH;return l`<button data-testid="wui-profile-button" @click=${this.handleClick}>
      <wui-flex gap="xs" alignItems="center">
        <wui-avatar
          .imageSrc=${this.avatarSrc}
          alt=${this.address}
          address=${this.address}
        ></wui-avatar>
        ${n?this.getIconTemplate(this.icon):""}
        <wui-flex gap="xs" alignItems="center">
          <wui-text variant="large-600" color="fg-100">
            ${A.getTruncateString({string:this.profileName||this.address,charsStart:this.profileName?18:4,charsEnd:this.profileName?0:4,truncate:this.profileName?"end":"middle"})}
          </wui-text>
          <wui-icon size="sm" color="fg-200" name="copy" id="copy-address"></wui-icon>
        </wui-flex>
      </wui-flex>
    </button>`}handleClick(e){var t,n;if(e.target instanceof HTMLElement&&e.target.id==="copy-address"){(t=this.onCopyClick)==null||t.call(this,e);return}(n=this.onProfileClick)==null||n.call(this,e)}getIconTemplate(e){return l`
      <wui-icon-box
        size="xxs"
        iconColor="fg-200"
        backgroundColor="bg-100"
        icon="${e||"networkPlaceholder"}"
      ></wui-icon-box>
    `}};ae.styles=[I,T,In];_e([c()],ae.prototype,"avatarSrc",void 0);_e([c()],ae.prototype,"profileName",void 0);_e([c()],ae.prototype,"address",void 0);_e([c()],ae.prototype,"icon",void 0);_e([c()],ae.prototype,"onProfileClick",void 0);_e([c()],ae.prototype,"onCopyClick",void 0);ae=_e([h("wui-profile-button-v2")],ae);const Tn=x`
  :host {
    display: inline-flex;
    background-color: var(--wui-color-gray-glass-002);
    border-radius: var(--wui-border-radius-3xl);
    padding: var(--wui-spacing-3xs);
    position: relative;
    height: 36px;
    min-height: 36px;
    overflow: hidden;
  }

  :host::before {
    content: '';
    position: absolute;
    pointer-events: none;
    top: 4px;
    left: 4px;
    display: block;
    width: var(--local-tab-width);
    height: 28px;
    border-radius: var(--wui-border-radius-3xl);
    background-color: var(--wui-color-gray-glass-002);
    box-shadow: inset 0 0 0 1px var(--wui-color-gray-glass-002);
    transform: translateX(calc(var(--local-tab) * var(--local-tab-width)));
    transition: transform var(--wui-ease-out-power-1) var(--wui-duration-md);
    will-change: background-color, opacity;
  }

  :host([data-type='flex'])::before {
    left: 3px;
    transform: translateX(calc((var(--local-tab) * 34px) + (var(--local-tab) * 4px)));
  }

  :host([data-type='flex']) {
    display: flex;
    padding: 0px 0px 0px 12px;
    gap: 4px;
  }

  :host([data-type='flex']) > button > wui-text {
    position: absolute;
    left: 18px;
    opacity: 0;
  }

  button[data-active='true'] > wui-icon,
  button[data-active='true'] > wui-text {
    color: var(--wui-color-fg-100);
  }

  button[data-active='false'] > wui-icon,
  button[data-active='false'] > wui-text {
    color: var(--wui-color-fg-200);
  }

  button[data-active='true']:disabled,
  button[data-active='false']:disabled {
    background-color: transparent;
    opacity: 0.5;
    cursor: not-allowed;
  }

  button[data-active='true']:disabled > wui-text {
    color: var(--wui-color-fg-200);
  }

  button[data-active='false']:disabled > wui-text {
    color: var(--wui-color-fg-300);
  }

  button > wui-icon,
  button > wui-text {
    pointer-events: none;
    transition: color var(--wui-e ase-out-power-1) var(--wui-duration-md);
    will-change: color;
  }

  button {
    width: var(--local-tab-width);
    transition: background-color var(--wui-ease-out-power-1) var(--wui-duration-md);
    will-change: background-color;
  }

  :host([data-type='flex']) > button {
    width: 34px;
    position: relative;
    display: flex;
    justify-content: flex-start;
  }

  button:hover:enabled,
  button:active:enabled {
    background-color: transparent !important;
  }

  button:hover:enabled > wui-icon,
  button:active:enabled > wui-icon {
    transition: all var(--wui-ease-out-power-1) var(--wui-duration-lg);
    color: var(--wui-color-fg-125);
  }

  button:hover:enabled > wui-text,
  button:active:enabled > wui-text {
    transition: all var(--wui-ease-out-power-1) var(--wui-duration-lg);
    color: var(--wui-color-fg-125);
  }

  button {
    border-radius: var(--wui-border-radius-3xl);
  }
`;var me=function(a,e,t,n){var o=arguments.length,i=o<3?e:n===null?n=Object.getOwnPropertyDescriptor(e,t):n,r;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")i=Reflect.decorate(a,e,t,n);else for(var s=a.length-1;s>=0;s--)(r=a[s])&&(i=(o<3?r(i):o>3?r(e,t,i):r(e,t))||i);return o>3&&i&&Object.defineProperty(e,t,i),i};let te=class extends w{constructor(){super(...arguments),this.tabs=[],this.onTabChange=()=>null,this.buttons=[],this.disabled=!1,this.localTabWidth="100px",this.activeTab=0,this.isDense=!1}render(){return this.isDense=this.tabs.length>3,this.style.cssText=`
      --local-tab: ${this.activeTab};
      --local-tab-width: ${this.localTabWidth};
    `,this.dataset.type=this.isDense?"flex":"block",this.tabs.map((e,t)=>{var o;const n=t===this.activeTab;return l`
        <button
          ?disabled=${this.disabled}
          @click=${()=>this.onTabClick(t)}
          data-active=${n}
          data-testid="tab-${(o=e.label)==null?void 0:o.toLowerCase()}"
        >
          ${this.iconTemplate(e)}
          <wui-text variant="small-600" color="inherit"> ${e.label} </wui-text>
        </button>
      `})}firstUpdated(){this.shadowRoot&&this.isDense&&(this.buttons=[...this.shadowRoot.querySelectorAll("button")],setTimeout(()=>{this.animateTabs(0,!0)},0))}iconTemplate(e){return e.icon?l`<wui-icon size="xs" color="inherit" name=${e.icon}></wui-icon>`:null}onTabClick(e){this.buttons&&this.animateTabs(e,!1),this.activeTab=e,this.onTabChange(e)}animateTabs(e,t){const n=this.buttons[this.activeTab],o=this.buttons[e],i=n==null?void 0:n.querySelector("wui-text"),r=o==null?void 0:o.querySelector("wui-text"),s=o==null?void 0:o.getBoundingClientRect(),y=r==null?void 0:r.getBoundingClientRect();n&&i&&!t&&e!==this.activeTab&&(i.animate([{opacity:0}],{duration:50,easing:"ease",fill:"forwards"}),n.animate([{width:"34px"}],{duration:500,easing:"ease",fill:"forwards"})),o&&s&&y&&r&&(e!==this.activeTab||t)&&(this.localTabWidth=`${Math.round(s.width+y.width)+6}px`,o.animate([{width:`${s.width+y.width}px`}],{duration:t?0:500,fill:"forwards",easing:"ease"}),r.animate([{opacity:1}],{duration:t?0:125,delay:t?0:200,fill:"forwards",easing:"ease"}))}};te.styles=[I,T,Tn];me([c({type:Array})],te.prototype,"tabs",void 0);me([c()],te.prototype,"onTabChange",void 0);me([c({type:Array})],te.prototype,"buttons",void 0);me([c({type:Boolean})],te.prototype,"disabled",void 0);me([c()],te.prototype,"localTabWidth",void 0);me([u()],te.prototype,"activeTab",void 0);me([u()],te.prototype,"isDense",void 0);te=me([h("wui-tabs")],te);const An=x`
  wui-flex {
    width: 100%;
  }

  :host > wui-flex:first-child {
    transform: translateY(calc(var(--wui-spacing-xxs) * -1));
  }

  wui-icon-link {
    margin-right: calc(var(--wui-icon-box-size-md) * -1);
  }

  wui-notice-card {
    margin-bottom: var(--wui-spacing-3xs);
  }

  wui-list-item > wui-text {
    flex: 1;
  }

  w3m-transactions-view {
    max-height: 200px;
  }

  .tab-content-container {
    height: 300px;
    overflow-y: auto;
    overflow-x: hidden;
    scrollbar-width: none;
  }

  .tab-content-container::-webkit-scrollbar {
    display: none;
  }

  .account-button {
    width: auto;
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--wui-spacing-s);
    height: 48px;
    padding: var(--wui-spacing-xs);
    padding-right: var(--wui-spacing-s);
    box-shadow: inset 0 0 0 1px var(--wui-color-gray-glass-002);
    background-color: var(--wui-color-gray-glass-002);
    border-radius: 24px;
    transition: background-color 0.2s linear;
  }

  .account-button:hover {
    background-color: var(--wui-color-gray-glass-005);
  }

  .avatar-container {
    position: relative;
  }

  wui-avatar.avatar {
    width: 32px;
    height: 32px;
    box-shadow: 0 0 0 2px var(--wui-color-gray-glass-005);
  }

  wui-avatar.network-avatar {
    width: 16px;
    height: 16px;
    position: absolute;
    left: 100%;
    top: 100%;
    transform: translate(-75%, -75%);
    box-shadow: 0 0 0 2px var(--wui-color-gray-glass-005);
  }

  .account-links {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .account-links wui-flex {
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    flex: 1;
    background: red;
    align-items: center;
    justify-content: center;
    height: 48px;
    padding: 10px;
    flex: 1 0 0;
    border-radius: var(--XS, 16px);
    border: 1px solid var(--dark-accent-glass-010, rgba(71, 161, 255, 0.1));
    background: var(--dark-accent-glass-010, rgba(71, 161, 255, 0.1));
    transition:
      background-color var(--wui-ease-out-power-1) var(--wui-duration-md),
      opacity var(--wui-ease-out-power-1) var(--wui-duration-md);
    will-change: background-color, opacity;
  }

  .account-links wui-flex:hover {
    background: var(--dark-accent-glass-015, rgba(71, 161, 255, 0.15));
  }

  .account-links wui-flex wui-icon {
    width: var(--S, 20px);
    height: var(--S, 20px);
  }

  .account-links wui-flex wui-icon svg path {
    stroke: #667dff;
  }
`;var q=function(a,e,t,n){var o=arguments.length,i=o<3?e:n===null?n=Object.getOwnPropertyDescriptor(e,t):n,r;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")i=Reflect.decorate(a,e,t,n);else for(var s=a.length-1;s>=0;s--)(r=a[s])&&(i=(o<3?r(i):o>3?r(e,t,i):r(e,t))||i);return o>3&&i&&Object.defineProperty(e,t,i),i};let j=class extends w{constructor(){var e;super(),this.unsubscribe=[],this.caipAddress=m.state.caipAddress,this.address=f.getPlainAddress(m.state.caipAddress),this.allAccounts=m.state.allAccounts,this.profileImage=m.state.profileImage,this.profileName=m.state.profileName,this.disconnecting=!1,this.balance=m.state.balance,this.balanceSymbol=m.state.balanceSymbol,this.features=v.state.features,this.remoteFeatures=v.state.remoteFeatures,this.namespace=d.state.activeChain,this.chainId=(e=d.state.activeCaipNetwork)==null?void 0:e.id,this.unsubscribe.push(m.subscribeKey("caipAddress",t=>{this.address=f.getPlainAddress(t),this.caipAddress=t}),m.subscribeKey("balance",t=>this.balance=t),m.subscribeKey("balanceSymbol",t=>this.balanceSymbol=t),m.subscribeKey("profileName",t=>this.profileName=t),m.subscribeKey("profileImage",t=>this.profileImage=t),v.subscribeKey("features",t=>this.features=t),v.subscribeKey("remoteFeatures",t=>this.remoteFeatures=t),m.subscribeKey("allAccounts",t=>{this.allAccounts=t}),v.subscribeKey("remoteFeatures",t=>this.remoteFeatures=t),d.subscribeKey("activeChain",t=>this.namespace=t),d.subscribeKey("activeCaipNetwork",t=>{var n;if(t){const[o,i]=((n=t==null?void 0:t.caipNetworkId)==null?void 0:n.split(":"))||[];o&&i&&(this.namespace=o,this.chainId=i)}}))}disconnectedCallback(){this.unsubscribe.forEach(e=>e())}render(){if(!this.caipAddress)return null;const e=d.state.activeChain!==_.CHAIN.SOLANA&&this.allAccounts.length>1;return l`<wui-flex
        flexDirection="column"
        .padding=${["0","xl","m","xl"]}
        alignItems="center"
        gap="l"
      >
        ${e?this.multiAccountTemplate():this.singleAccountTemplate()}
        <wui-flex flexDirection="column" alignItems="center">
          <wui-text variant="paragraph-500" color="fg-200">
            ${f.formatBalance(this.balance,this.balanceSymbol)}
          </wui-text>
        </wui-flex>
        ${this.explorerBtnTemplate()}
      </wui-flex>

      <wui-flex flexDirection="column" gap="xs" .padding=${["0","s","s","s"]}>
        ${this.authCardTemplate()} <w3m-account-auth-button></w3m-account-auth-button>
        ${this.orderedFeaturesTemplate()} ${this.activityTemplate()}
        <wui-list-item
          variant="icon"
          iconVariant="overlay"
          icon="disconnect"
          ?chevron=${!1}
          .loading=${this.disconnecting}
          @click=${this.onDisconnect.bind(this)}
          data-testid="disconnect-button"
        >
          <wui-text variant="paragraph-500" color="fg-200">Disconnect</wui-text>
        </wui-list-item>
      </wui-flex>`}onrampTemplate(){var n;if(!this.namespace)return null;const e=(n=this.remoteFeatures)==null?void 0:n.onramp,t=U.ONRAMP_SUPPORTED_CHAIN_NAMESPACES.includes(this.namespace);return!e||!t?null:l`
      <wui-list-item
        data-testid="w3m-account-default-onramp-button"
        iconVariant="blue"
        icon="card"
        ?chevron=${!0}
        @click=${this.handleClickPay.bind(this)}
      >
        <wui-text variant="paragraph-500" color="fg-100">Buy crypto</wui-text>
      </wui-list-item>
    `}orderedFeaturesTemplate(){var t;return(((t=this.features)==null?void 0:t.walletFeaturesOrder)||U.DEFAULT_FEATURES.walletFeaturesOrder).map(n=>{switch(n){case"onramp":return this.onrampTemplate();case"swaps":return this.swapsTemplate();case"send":return this.sendTemplate();default:return null}})}activityTemplate(){var t;return this.namespace&&((t=this.remoteFeatures)==null?void 0:t.activity)&&U.ACTIVITY_ENABLED_CHAIN_NAMESPACES.includes(this.namespace)?l` <wui-list-item
          iconVariant="blue"
          icon="clock"
          iconSize="sm"
          ?chevron=${!0}
          @click=${this.onTransactions.bind(this)}
          data-testid="w3m-account-default-activity-button"
        >
          <wui-text variant="paragraph-500" color="fg-100">Activity</wui-text>
        </wui-list-item>`:null}swapsTemplate(){var n;const e=(n=this.remoteFeatures)==null?void 0:n.swaps,t=d.state.activeChain===_.CHAIN.EVM;return!e||!t?null:l`
      <wui-list-item
        iconVariant="blue"
        icon="recycleHorizontal"
        ?chevron=${!0}
        @click=${this.handleClickSwap.bind(this)}
        data-testid="w3m-account-default-swaps-button"
      >
        <wui-text variant="paragraph-500" color="fg-100">Swap</wui-text>
      </wui-list-item>
    `}sendTemplate(){var o;const e=(o=this.features)==null?void 0:o.send,t=d.state.activeChain,n=U.SEND_SUPPORTED_NAMESPACES.includes(t);return!e||!n?null:l`
      <wui-list-item
        iconVariant="blue"
        icon="send"
        ?chevron=${!0}
        @click=${this.handleClickSend.bind(this)}
        data-testid="w3m-account-default-send-button"
      >
        <wui-text variant="paragraph-500" color="fg-100">Send</wui-text>
      </wui-list-item>
    `}authCardTemplate(){const e=d.state.activeChain,t=b.getConnectorId(e),n=b.getAuthConnector(),{origin:o}=location;return!n||t!==_.CONNECTOR_ID.AUTH||o.includes(U.SECURE_SITE)?null:l`
      <wui-notice-card
        @click=${this.onGoToUpgradeView.bind(this)}
        label="Upgrade your wallet"
        description="Transition to a self-custodial wallet"
        icon="wallet"
        data-testid="w3m-wallet-upgrade-card"
      ></wui-notice-card>
    `}handleSwitchAccountsView(){g.push("SwitchAddress")}handleClickPay(){g.push("OnRampProviders")}handleClickSwap(){g.push("Swap")}handleClickSend(){g.push("WalletSend")}explorerBtnTemplate(){return m.state.addressExplorerUrl?l`
      <wui-button size="md" variant="neutral" @click=${this.onExplorer.bind(this)}>
        <wui-icon size="sm" color="inherit" slot="iconLeft" name="compass"></wui-icon>
        Block Explorer
        <wui-icon size="sm" color="inherit" slot="iconRight" name="externalLink"></wui-icon>
      </wui-button>
    `:null}singleAccountTemplate(){return l`
      <wui-avatar
        alt=${p(this.caipAddress)}
        address=${p(f.getPlainAddress(this.caipAddress))}
        imageSrc=${p(this.profileImage===null?void 0:this.profileImage)}
        data-testid="single-account-avatar"
      ></wui-avatar>
      <wui-flex flexDirection="column" alignItems="center">
        <wui-flex gap="3xs" alignItems="center" justifyContent="center">
          <wui-text variant="large-600" color="fg-100">
            ${this.profileName?A.getTruncateString({string:this.profileName,charsStart:20,charsEnd:0,truncate:"end"}):A.getTruncateString({string:this.address||"",charsStart:4,charsEnd:4,truncate:"middle"})}
          </wui-text>
          <wui-icon-link
            size="md"
            icon="copy"
            iconColor="fg-200"
            @click=${this.onCopyAddress}
          ></wui-icon-link> </wui-flex
      ></wui-flex>
    `}multiAccountTemplate(){if(!this.address)throw new Error("w3m-account-view: No account provided");const e=this.allAccounts.find(n=>n.address===this.address),t=m.state.addressLabels.get(this.address);return this.namespace==="bip122"?this.btcAccountsTemplate():l`
      <wui-profile-button-v2
        .onProfileClick=${this.handleSwitchAccountsView.bind(this)}
        address=${p(this.address)}
        icon="${(e==null?void 0:e.type)===F.ACCOUNT_TYPES.SMART_ACCOUNT&&d.state.activeChain===_.CHAIN.EVM?"lightbulb":"mail"}"
        avatarSrc=${p(this.profileImage?this.profileImage:void 0)}
        profileName=${p(t||this.profileName)}
        .onCopyClick=${this.onCopyAddress.bind(this)}
      ></wui-profile-button-v2>
    `}btcAccountsTemplate(){return l`<wui-flex gap="m" alignItems="center" flexDirection="column">
      <wui-avatar
        .imageSrc=${p(this.profileImage?this.profileImage:void 0)}
        alt=${this.address}
        address=${this.address}
      ></wui-avatar>
      <wui-tabs
        .tabs=${[{label:"Payment"},{label:"Ordinals"}]}
        .onTabChange=${e=>{var t;return m.setCaipAddress(`bip122:${this.chainId}:${((t=this.allAccounts[e])==null?void 0:t.address)||""}`,this.namespace)}}
      ></wui-tabs>
      <wui-flex gap="xs" alignItems="center" justifyContent="center">
        <wui-text variant="large-600" color="fg-100">
          ${A.getTruncateString({string:this.profileName||this.address||"",charsStart:this.profileName?18:4,charsEnd:this.profileName?0:4,truncate:this.profileName?"end":"middle"})}
        </wui-text>
        <wui-icon-link
          size="md"
          icon="copy"
          iconColor="fg-200"
          @click=${this.onCopyAddress}
        ></wui-icon-link>
      </wui-flex>
    </wui-flex>`}onCopyAddress(){try{this.address&&(f.copyToClopboard(this.address),P.showSuccess("Address copied"))}catch{P.showError("Failed to copy")}}onTransactions(){var t;const e=d.state.activeChain;k.sendEvent({type:"track",event:"CLICK_TRANSACTIONS",properties:{isSmartAccount:((t=m.state.preferredAccountTypes)==null?void 0:t[e])===F.ACCOUNT_TYPES.SMART_ACCOUNT}}),g.push("Transactions")}async onDisconnect(){try{this.disconnecting=!0,await C.disconnect(),W.close()}catch{k.sendEvent({type:"track",event:"DISCONNECT_ERROR"}),P.showError("Failed to disconnect")}finally{this.disconnecting=!1}}onExplorer(){const e=m.state.addressExplorerUrl;e&&f.openHref(e,"_blank")}onGoToUpgradeView(){k.sendEvent({type:"track",event:"EMAIL_UPGRADE_FROM_MODAL"}),g.push("UpgradeEmailWallet")}};j.styles=An;q([u()],j.prototype,"caipAddress",void 0);q([u()],j.prototype,"address",void 0);q([u()],j.prototype,"allAccounts",void 0);q([u()],j.prototype,"profileImage",void 0);q([u()],j.prototype,"profileName",void 0);q([u()],j.prototype,"disconnecting",void 0);q([u()],j.prototype,"balance",void 0);q([u()],j.prototype,"balanceSymbol",void 0);q([u()],j.prototype,"features",void 0);q([u()],j.prototype,"remoteFeatures",void 0);q([u()],j.prototype,"namespace",void 0);q([u()],j.prototype,"chainId",void 0);j=q([h("w3m-account-default-widget")],j);const Wn=x`
  span {
    font-weight: 500;
    font-size: 40px;
    color: var(--wui-color-fg-100);
    line-height: 130%; /* 52px */
    letter-spacing: -1.6px;
    text-align: center;
  }

  .pennies {
    color: var(--wui-color-fg-200);
  }
`;var si=function(a,e,t,n){var o=arguments.length,i=o<3?e:n===null?n=Object.getOwnPropertyDescriptor(e,t):n,r;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")i=Reflect.decorate(a,e,t,n);else for(var s=a.length-1;s>=0;s--)(r=a[s])&&(i=(o<3?r(i):o>3?r(e,t,i):r(e,t))||i);return o>3&&i&&Object.defineProperty(e,t,i),i};let Ge=class extends w{constructor(){super(...arguments),this.dollars="0",this.pennies="00"}render(){return l`<span>$${this.dollars}<span class="pennies">.${this.pennies}</span></span>`}};Ge.styles=[I,Wn];si([c()],Ge.prototype,"dollars",void 0);si([c()],Ge.prototype,"pennies",void 0);Ge=si([h("wui-balance")],Ge);const Rn=x`
  button {
    background-color: var(--wui-color-gray-glass-002);
    border-radius: var(--wui-border-radius-3xl);
    border: 1px solid var(--wui-color-gray-glass-002);
    padding: var(--wui-spacing-xs) var(--wui-spacing-s) var(--wui-spacing-xs) var(--wui-spacing-xs);
    position: relative;
  }

  wui-avatar {
    width: 32px;
    height: 32px;
    box-shadow: 0 0 0 0;
    outline: 3px solid var(--wui-color-gray-glass-005);
  }

  wui-icon-box,
  wui-image {
    width: 16px;
    height: 16px;
    border-radius: var(--wui-border-radius-3xl);
    position: absolute;
    left: 26px;
    top: 24px;
  }

  wui-image {
    outline: 2px solid var(--wui-color-bg-125);
  }

  wui-icon-box {
    outline: 2px solid var(--wui-color-bg-200);
    background-color: var(--wui-color-bg-250);
  }
`;var Ue=function(a,e,t,n){var o=arguments.length,i=o<3?e:n===null?n=Object.getOwnPropertyDescriptor(e,t):n,r;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")i=Reflect.decorate(a,e,t,n);else for(var s=a.length-1;s>=0;s--)(r=a[s])&&(i=(o<3?r(i):o>3?r(e,t,i):r(e,t))||i);return o>3&&i&&Object.defineProperty(e,t,i),i};let ue=class extends w{constructor(){super(...arguments),this.networkSrc=void 0,this.avatarSrc=void 0,this.profileName="",this.address="",this.icon="chevronBottom"}render(){return l`<button data-testid="wui-profile-button">
      <wui-flex gap="xs" alignItems="center">
        <wui-avatar
          .imageSrc=${this.avatarSrc}
          alt=${this.address}
          address=${this.address}
        ></wui-avatar>
        ${this.networkImageTemplate()}
        <wui-flex gap="xs" alignItems="center">
          <wui-text variant="large-600" color="fg-100">
            ${A.getTruncateString({string:this.profileName||this.address,charsStart:this.profileName?18:4,charsEnd:this.profileName?0:4,truncate:this.profileName?"end":"middle"})}
          </wui-text>
          <wui-icon size="sm" color="fg-200" name=${this.icon}></wui-icon>
        </wui-flex>
      </wui-flex>
    </button>`}networkImageTemplate(){return this.networkSrc?l`<wui-image src=${this.networkSrc}></wui-image>`:l`
      <wui-icon-box
        size="xxs"
        iconColor="fg-200"
        backgroundColor="bg-100"
        icon="networkPlaceholder"
      ></wui-icon-box>
    `}};ue.styles=[I,T,Rn];Ue([c()],ue.prototype,"networkSrc",void 0);Ue([c()],ue.prototype,"avatarSrc",void 0);Ue([c()],ue.prototype,"profileName",void 0);Ue([c()],ue.prototype,"address",void 0);Ue([c()],ue.prototype,"icon",void 0);ue=Ue([h("wui-profile-button")],ue);const En=x`
  :host {
    display: block;
    padding: 9px var(--wui-spacing-s) 10px var(--wui-spacing-s);
    border-radius: var(--wui-border-radius-xxs);

    color: var(--wui-color-bg-100);
    position: relative;
  }

  :host([data-variant='shade']) {
    background-color: var(--wui-color-bg-150);
    border: 1px solid var(--wui-color-gray-glass-005);
  }

  :host([data-variant='shade']) > wui-text {
    color: var(--wui-color-fg-150);
  }

  :host([data-variant='fill']) {
    background-color: var(--wui-color-fg-100);
    border: none;
  }

  wui-icon {
    position: absolute;
    width: 12px !important;
    height: 4px !important;
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
`;var Nt=function(a,e,t,n){var o=arguments.length,i=o<3?e:n===null?n=Object.getOwnPropertyDescriptor(e,t):n,r;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")i=Reflect.decorate(a,e,t,n);else for(var s=a.length-1;s>=0;s--)(r=a[s])&&(i=(o<3?r(i):o>3?r(e,t,i):r(e,t))||i);return o>3&&i&&Object.defineProperty(e,t,i),i};let Re=class extends w{constructor(){super(...arguments),this.placement="top",this.variant="fill",this.message=""}render(){return this.dataset.variant=this.variant,l`<wui-icon
        data-placement=${this.placement}
        color="fg-100"
        size="inherit"
        name=${this.variant==="fill"?"cursor":"cursorTransparent"}
      ></wui-icon>
      <wui-text color="inherit" variant="small-500">${this.message}</wui-text>`}};Re.styles=[I,T,En];Nt([c()],Re.prototype,"placement",void 0);Nt([c()],Re.prototype,"variant",void 0);Nt([c()],Re.prototype,"message",void 0);Re=Nt([h("wui-tooltip")],Re);const Nn={getTabsByNamespace(a){var t;return!!a&&a===_.CHAIN.EVM?((t=v.state.remoteFeatures)==null?void 0:t.activity)===!1?yi.ACCOUNT_TABS.filter(n=>n.label!=="Activity"):yi.ACCOUNT_TABS:[]}},On=x`
  :host {
    width: 100%;
    max-height: 280px;
    overflow: scroll;
    scrollbar-width: none;
  }

  :host::-webkit-scrollbar {
    display: none;
  }
`;var Pn=function(a,e,t,n){var o=arguments.length,i=o<3?e:n===null?n=Object.getOwnPropertyDescriptor(e,t):n,r;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")i=Reflect.decorate(a,e,t,n);else for(var s=a.length-1;s>=0;s--)(r=a[s])&&(i=(o<3?r(i):o>3?r(e,t,i):r(e,t))||i);return o>3&&i&&Object.defineProperty(e,t,i),i};let qt=class extends w{render(){return l`<w3m-activity-list page="account"></w3m-activity-list>`}};qt.styles=On;qt=Pn([h("w3m-account-activity-widget")],qt);const jn=x`
  .contentContainer {
    height: 280px;
  }

  .contentContainer > wui-icon-box {
    width: 40px;
    height: 40px;
    border-radius: var(--wui-border-radius-xxs);
  }

  .contentContainer > .textContent {
    width: 65%;
  }
`;var Dn=function(a,e,t,n){var o=arguments.length,i=o<3?e:n===null?n=Object.getOwnPropertyDescriptor(e,t):n,r;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")i=Reflect.decorate(a,e,t,n);else for(var s=a.length-1;s>=0;s--)(r=a[s])&&(i=(o<3?r(i):o>3?r(e,t,i):r(e,t))||i);return o>3&&i&&Object.defineProperty(e,t,i),i};let Gt=class extends w{render(){return l`${this.nftTemplate()}`}nftTemplate(){return l` <wui-flex
      class="contentContainer"
      alignItems="center"
      justifyContent="center"
      flexDirection="column"
      gap="l"
    >
      <wui-icon-box
        icon="wallet"
        size="inherit"
        iconColor="fg-200"
        backgroundColor="fg-200"
        iconSize="lg"
      ></wui-icon-box>
      <wui-flex
        class="textContent"
        gap="xs"
        flexDirection="column"
        justifyContent="center"
        flexDirection="column"
      >
        <wui-text
          variant="paragraph-500"
          align="center"
          color="fg-100"
          data-testid="nft-template-title"
          >Coming soon</wui-text
        >
        <wui-text
          variant="small-400"
          align="center"
          color="fg-200"
          data-testid="nft-template-description"
          >Stay tuned for our upcoming NFT feature</wui-text
        >
      </wui-flex>
      <wui-link @click=${this.onReceiveClick.bind(this)} data-testid="link-receive-funds"
        >Receive funds</wui-link
      >
    </wui-flex>`}onReceiveClick(){g.push("WalletReceive")}};Gt.styles=jn;Gt=Dn([h("w3m-account-nfts-widget")],Gt);const Ln=x`
  button {
    width: 100%;
    display: flex;
    gap: var(--wui-spacing-s);
    align-items: center;
    justify-content: flex-start;
    padding: var(--wui-spacing-s) var(--wui-spacing-m) var(--wui-spacing-s) var(--wui-spacing-s);
    background-color: var(--wui-color-gray-glass-002);
    border-radius: var(--wui-border-radius-xs);
  }

  wui-icon-box {
    width: var(--wui-spacing-2xl);
    height: var(--wui-spacing-2xl);
  }

  wui-flex {
    width: auto;
  }
`;var ge=function(a,e,t,n){var o=arguments.length,i=o<3?e:n===null?n=Object.getOwnPropertyDescriptor(e,t):n,r;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")i=Reflect.decorate(a,e,t,n);else for(var s=a.length-1;s>=0;s--)(r=a[s])&&(i=(o<3?r(i):o>3?r(e,t,i):r(e,t))||i);return o>3&&i&&Object.defineProperty(e,t,i),i};let ie=class extends w{constructor(){super(...arguments),this.icon="card",this.text="",this.description="",this.tag=void 0,this.iconBackgroundColor="accent-100",this.iconColor="accent-100",this.disabled=!1}render(){return l`
      <button ?disabled=${this.disabled}>
        <wui-icon-box
          iconColor=${this.iconColor}
          backgroundColor=${this.iconBackgroundColor}
          size="inherit"
          icon=${this.icon}
          iconSize="md"
        ></wui-icon-box>
        <wui-flex flexDirection="column" justifyContent="spaceBetween">
          ${this.titleTemplate()}
          <wui-text variant="small-400" color="fg-200"> ${this.description}</wui-text></wui-flex
        >
      </button>
    `}titleTemplate(){return this.tag?l` <wui-flex alignItems="center" gap="xxs"
        ><wui-text variant="paragraph-500" color="fg-100">${this.text}</wui-text
        ><wui-tag tagType="main" size="md">${this.tag}</wui-tag>
      </wui-flex>`:l`<wui-text variant="paragraph-500" color="fg-100">${this.text}</wui-text>`}};ie.styles=[I,T,Ln];ge([c()],ie.prototype,"icon",void 0);ge([c()],ie.prototype,"text",void 0);ge([c()],ie.prototype,"description",void 0);ge([c()],ie.prototype,"tag",void 0);ge([c()],ie.prototype,"iconBackgroundColor",void 0);ge([c()],ie.prototype,"iconColor",void 0);ge([c({type:Boolean})],ie.prototype,"disabled",void 0);ie=ge([h("wui-list-description")],ie);const Un=x`
  :host {
    width: 100%;
  }

  wui-flex {
    width: 100%;
  }

  .contentContainer {
    max-height: 280px;
    overflow: scroll;
    scrollbar-width: none;
  }

  .contentContainer::-webkit-scrollbar {
    display: none;
  }
`;var li=function(a,e,t,n){var o=arguments.length,i=o<3?e:n===null?n=Object.getOwnPropertyDescriptor(e,t):n,r;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")i=Reflect.decorate(a,e,t,n);else for(var s=a.length-1;s>=0;s--)(r=a[s])&&(i=(o<3?r(i):o>3?r(e,t,i):r(e,t))||i);return o>3&&i&&Object.defineProperty(e,t,i),i};let Xe=class extends w{constructor(){super(),this.unsubscribe=[],this.tokenBalance=m.state.tokenBalance,this.remoteFeatures=v.state.remoteFeatures,this.unsubscribe.push(m.subscribe(e=>{this.tokenBalance=e.tokenBalance}),v.subscribeKey("remoteFeatures",e=>{this.remoteFeatures=e}))}disconnectedCallback(){this.unsubscribe.forEach(e=>e())}render(){return l`${this.tokenTemplate()}`}tokenTemplate(){var e;return this.tokenBalance&&((e=this.tokenBalance)==null?void 0:e.length)>0?l`<wui-flex class="contentContainer" flexDirection="column" gap="xs">
        ${this.tokenItemTemplate()}
      </wui-flex>`:l` <wui-flex flexDirection="column" gap="xs"
      >${this.onRampTemplate()}
      <wui-list-description
        @click=${this.onReceiveClick.bind(this)}
        text="Receive funds"
        description="Transfer tokens on your wallet"
        icon="arrowBottomCircle"
        iconColor="fg-200"
        iconBackgroundColor="fg-200"
        data-testid="receive-funds"
      ></wui-list-description
    ></wui-flex>`}onRampTemplate(){var e;return(e=this.remoteFeatures)!=null&&e.onramp?l`<wui-list-description
        @click=${this.onBuyClick.bind(this)}
        text="Buy Crypto"
        description="Easy with card or bank account"
        icon="card"
        iconColor="success-100"
        iconBackgroundColor="success-100"
        tag="popular"
        data-testid="buy-crypto"
      ></wui-list-description>`:l``}tokenItemTemplate(){var e;return(e=this.tokenBalance)==null?void 0:e.map(t=>l`<wui-list-token
          tokenName=${t.name}
          tokenImageUrl=${t.iconUrl}
          tokenAmount=${t.quantity.numeric}
          tokenValue=${t.value}
          tokenCurrency=${t.symbol}
        ></wui-list-token>`)}onReceiveClick(){g.push("WalletReceive")}onBuyClick(){var t;const e=d.state.activeChain;k.sendEvent({type:"track",event:"SELECT_BUY_CRYPTO",properties:{isSmartAccount:((t=m.state.preferredAccountTypes)==null?void 0:t[e])===F.ACCOUNT_TYPES.SMART_ACCOUNT}}),g.push("OnRampProviders")}};Xe.styles=Un;li([u()],Xe.prototype,"tokenBalance",void 0);li([u()],Xe.prototype,"remoteFeatures",void 0);Xe=li([h("w3m-account-tokens-widget")],Xe);const Bn=x`
  wui-flex {
    width: 100%;
  }

  wui-promo {
    position: absolute;
    top: -32px;
  }

  wui-profile-button {
    margin-top: calc(-1 * var(--wui-spacing-2l));
  }

  wui-promo + wui-profile-button {
    margin-top: var(--wui-spacing-2l);
  }

  wui-tabs {
    width: 100%;
  }

  .contentContainer {
    height: 280px;
  }

  .contentContainer > wui-icon-box {
    width: 40px;
    height: 40px;
    border-radius: var(--wui-border-radius-xxs);
  }

  .contentContainer > .textContent {
    width: 65%;
  }
`;var ee=function(a,e,t,n){var o=arguments.length,i=o<3?e:n===null?n=Object.getOwnPropertyDescriptor(e,t):n,r;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")i=Reflect.decorate(a,e,t,n);else for(var s=a.length-1;s>=0;s--)(r=a[s])&&(i=(o<3?r(i):o>3?r(e,t,i):r(e,t))||i);return o>3&&i&&Object.defineProperty(e,t,i),i};const zn=48,Mn=430;let H=class extends w{constructor(){super(),this.unsubscribe=[],this.address=m.state.address,this.profileImage=m.state.profileImage,this.profileName=m.state.profileName,this.network=d.state.activeCaipNetwork,this.currentTab=m.state.currentTab,this.tokenBalance=m.state.tokenBalance,this.features=v.state.features,this.remoteFeatures=v.state.remoteFeatures,this.networkImage=$.getNetworkImage(this.network),this.unsubscribe.push(ce.subscribeNetworkImages(()=>{this.networkImage=$.getNetworkImage(this.network)}),m.subscribe(e=>{e.address?(this.address=e.address,this.profileImage=e.profileImage,this.profileName=e.profileName,this.currentTab=e.currentTab,this.tokenBalance=e.tokenBalance):W.close()}),d.subscribeKey("activeCaipNetwork",e=>{this.network=e,this.networkImage=$.getNetworkImage(this.network)}),v.subscribeKey("features",e=>this.features=e),v.subscribeKey("remoteFeatures",e=>this.remoteFeatures=e)),this.watchSwapValues()}disconnectedCallback(){this.unsubscribe.forEach(e=>e()),clearInterval(this.watchTokenBalance)}firstUpdated(){m.fetchTokenBalance()}render(){if(!this.address)throw new Error("w3m-account-view: No account provided");return l`<wui-flex
      flexDirection="column"
      .padding=${["0","xl","m","xl"]}
      alignItems="center"
      gap="m"
      data-testid="w3m-account-wallet-features-widget"
    >
      <wui-profile-button
        @click=${this.onProfileButtonClick.bind(this)}
        address=${p(this.address)}
        networkSrc=${p(this.networkImage)}
        icon="chevronBottom"
        avatarSrc=${p(this.profileImage?this.profileImage:void 0)}
        profileName=${p(this.profileName??void 0)}
        data-testid="w3m-profile-button"
      ></wui-profile-button>

      ${this.tokenBalanceTemplate()} ${this.orderedWalletFeatures()} ${this.tabsTemplate()}
      ${this.listContentTemplate()}
    </wui-flex>`}orderedWalletFeatures(){var n;const e=((n=this.features)==null?void 0:n.walletFeaturesOrder)||U.DEFAULT_FEATURES.walletFeaturesOrder;return e.every(o=>{var i,r;return o==="send"||o==="receive"?!((i=this.features)!=null&&i[o]):o==="swaps"||o==="onramp"?!((r=this.remoteFeatures)!=null&&r[o]):!0})?null:l`<wui-flex gap="s">
      ${e.map(o=>{switch(o){case"onramp":return this.onrampTemplate();case"swaps":return this.swapsTemplate();case"receive":return this.receiveTemplate();case"send":return this.sendTemplate();default:return null}})}
    </wui-flex>`}onrampTemplate(){var t;return((t=this.remoteFeatures)==null?void 0:t.onramp)?l`
      <w3m-tooltip-trigger text="Buy">
        <wui-icon-button
          data-testid="wallet-features-onramp-button"
          @click=${this.onBuyClick.bind(this)}
          icon="card"
        ></wui-icon-button>
      </w3m-tooltip-trigger>
    `:null}swapsTemplate(){var n;const e=(n=this.remoteFeatures)==null?void 0:n.swaps,t=d.state.activeChain===_.CHAIN.EVM;return!e||!t?null:l`
      <w3m-tooltip-trigger text="Swap">
        <wui-icon-button
          data-testid="wallet-features-swaps-button"
          @click=${this.onSwapClick.bind(this)}
          icon="recycleHorizontal"
        >
        </wui-icon-button>
      </w3m-tooltip-trigger>
    `}receiveTemplate(){var t;return((t=this.features)==null?void 0:t.receive)?l`
      <w3m-tooltip-trigger text="Receive">
        <wui-icon-button
          data-testid="wallet-features-receive-button"
          @click=${this.onReceiveClick.bind(this)}
          icon="arrowBottomCircle"
        >
        </wui-icon-button>
      </w3m-tooltip-trigger>
    `:null}sendTemplate(){var o;const e=(o=this.features)==null?void 0:o.send,t=d.state.activeChain,n=U.SEND_SUPPORTED_NAMESPACES.includes(t);return!e||!n?null:l`
      <w3m-tooltip-trigger text="Send">
        <wui-icon-button
          data-testid="wallet-features-send-button"
          @click=${this.onSendClick.bind(this)}
          icon="send"
        ></wui-icon-button>
      </w3m-tooltip-trigger>
    `}watchSwapValues(){this.watchTokenBalance=setInterval(()=>m.fetchTokenBalance(e=>this.onTokenBalanceError(e)),1e4)}onTokenBalanceError(e){e instanceof Error&&e.cause instanceof Response&&e.cause.status===_.HTTP_STATUS_CODES.SERVICE_UNAVAILABLE&&clearInterval(this.watchTokenBalance)}listContentTemplate(){return this.currentTab===0?l`<w3m-account-tokens-widget></w3m-account-tokens-widget>`:this.currentTab===1?l`<w3m-account-nfts-widget></w3m-account-nfts-widget>`:this.currentTab===2?l`<w3m-account-activity-widget></w3m-account-activity-widget>`:l`<w3m-account-tokens-widget></w3m-account-tokens-widget>`}tokenBalanceTemplate(){var e;if(this.tokenBalance&&((e=this.tokenBalance)==null?void 0:e.length)>=0){const t=f.calculateBalance(this.tokenBalance),{dollars:n="0",pennies:o="00"}=f.formatTokenBalance(t);return l`<wui-balance dollars=${n} pennies=${o}></wui-balance>`}return l`<wui-balance dollars="0" pennies="00"></wui-balance>`}tabsTemplate(){const e=Nn.getTabsByNamespace(d.state.activeChain);if(e.length===0)return null;const t=f.isMobile()&&window.innerWidth<Mn;let n="104px";return t?n=`${(window.innerWidth-zn)/e.length}px`:e.length===2?n="156px":n="104px",l`<wui-tabs
      .onTabChange=${this.onTabChange.bind(this)}
      .activeTab=${this.currentTab}
      localTabWidth=${n}
      .tabs=${e}
    ></wui-tabs>`}onTabChange(e){m.setCurrentTab(e)}onProfileButtonClick(){const{allAccounts:e}=m.state;e.length>1?g.push("Profile"):g.push("AccountSettings")}onBuyClick(){g.push("OnRampProviders")}onSwapClick(){var t,n,o,i;const e=d.state.activeChain;(t=this.network)!=null&&t.caipNetworkId&&!U.SWAP_SUPPORTED_NETWORKS.includes((n=this.network)==null?void 0:n.caipNetworkId)?g.push("UnsupportedChain",{swapUnsupportedChain:!0}):(k.sendEvent({type:"track",event:"OPEN_SWAP",properties:{network:((o=this.network)==null?void 0:o.caipNetworkId)||"",isSmartAccount:((i=m.state.preferredAccountTypes)==null?void 0:i[e])===F.ACCOUNT_TYPES.SMART_ACCOUNT}}),g.push("Swap"))}onReceiveClick(){g.push("WalletReceive")}onSendClick(){var t,n;const e=d.state.activeChain;k.sendEvent({type:"track",event:"OPEN_SEND",properties:{network:((t=this.network)==null?void 0:t.caipNetworkId)||"",isSmartAccount:((n=m.state.preferredAccountTypes)==null?void 0:n[e])===F.ACCOUNT_TYPES.SMART_ACCOUNT}}),g.push("WalletSend")}};H.styles=Bn;ee([u()],H.prototype,"watchTokenBalance",void 0);ee([u()],H.prototype,"address",void 0);ee([u()],H.prototype,"profileImage",void 0);ee([u()],H.prototype,"profileName",void 0);ee([u()],H.prototype,"network",void 0);ee([u()],H.prototype,"currentTab",void 0);ee([u()],H.prototype,"tokenBalance",void 0);ee([u()],H.prototype,"features",void 0);ee([u()],H.prototype,"remoteFeatures",void 0);ee([u()],H.prototype,"networkImage",void 0);H=ee([h("w3m-account-wallet-features-widget")],H);var Hi=function(a,e,t,n){var o=arguments.length,i=o<3?e:n===null?n=Object.getOwnPropertyDescriptor(e,t):n,r;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")i=Reflect.decorate(a,e,t,n);else for(var s=a.length-1;s>=0;s--)(r=a[s])&&(i=(o<3?r(i):o>3?r(e,t,i):r(e,t))||i);return o>3&&i&&Object.defineProperty(e,t,i),i};let Xt=class extends w{constructor(){super(),this.unsubscribe=[],this.namespace=d.state.activeChain,this.unsubscribe.push(d.subscribeKey("activeChain",e=>{this.namespace=e}))}render(){if(!this.namespace)return null;const e=b.getConnectorId(this.namespace),t=b.getAuthConnector();return l`
      ${t&&e===_.CONNECTOR_ID.AUTH?this.walletFeaturesTemplate():this.defaultTemplate()}
    `}walletFeaturesTemplate(){return l`<w3m-account-wallet-features-widget></w3m-account-wallet-features-widget>`}defaultTemplate(){return l`<w3m-account-default-widget></w3m-account-default-widget>`}};Hi([u()],Xt.prototype,"namespace",void 0);Xt=Hi([h("w3m-account-view")],Xt);const Vn=x`
  button {
    padding: 6.5px var(--wui-spacing-l) 6.5px var(--wui-spacing-xs);
    display: flex;
    justify-content: space-between;
    width: 100%;
    border-radius: var(--wui-border-radius-xs);
    background-color: var(--wui-color-gray-glass-002);
  }

  button[data-clickable='false'] {
    pointer-events: none;
    background-color: transparent;
  }

  wui-image {
    width: var(--wui-spacing-3xl);
    height: var(--wui-spacing-3xl);
    border-radius: var(--wui-border-radius-3xl);
  }

  wui-avatar {
    width: var(--wui-spacing-3xl);
    height: var(--wui-spacing-3xl);
    box-shadow: 0 0 0 0;
  }
  .address {
    color: var(--wui-color-fg-base-100);
  }
  .address-description {
    text-transform: capitalize;
    color: var(--wui-color-fg-base-200);
  }

  wui-icon-box {
    position: relative;
    right: 15px;
    top: 15px;
    border: 2px solid var(--wui-color-bg-150);
    background-color: var(--wui-color-bg-125);
  }
`;var ot=function(a,e,t,n){var o=arguments.length,i=o<3?e:n===null?n=Object.getOwnPropertyDescriptor(e,t):n,r;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")i=Reflect.decorate(a,e,t,n);else for(var s=a.length-1;s>=0;s--)(r=a[s])&&(i=(o<3?r(i):o>3?r(e,t,i):r(e,t))||i);return o>3&&i&&Object.defineProperty(e,t,i),i};let xe=class extends w{constructor(){super(...arguments),this.accountAddress="",this.accountType="",this.labels=m.state.addressLabels,this.caipNetwork=d.state.activeCaipNetwork,this.socialProvider=be.getConnectedSocialProvider(),this.balance=0,this.fetchingBalance=!0,this.shouldShowIcon=!1,this.selected=!1}connectedCallback(){var e;super.connectedCallback(),Fi.getBalance(this.accountAddress,(e=this.caipNetwork)==null?void 0:e.caipNetworkId).then(t=>{let n=this.balance;t.balances.length>0&&(n=t.balances.reduce((o,i)=>o+((i==null?void 0:i.value)||0),0)),this.balance=n,this.fetchingBalance=!1,this.requestUpdate()}).catch(()=>{this.fetchingBalance=!1,this.requestUpdate()})}render(){const e=this.getLabel(),t=d.state.activeChain,n=b.getConnectorId(t);return this.shouldShowIcon=n===_.CONNECTOR_ID.AUTH,l`
      <wui-flex
        flexDirection="row"
        justifyContent="space-between"
        .padding=${["0","0","s","1xs"]}
      >
        <wui-flex gap="md" alignItems="center">
          <wui-avatar address=${this.accountAddress}></wui-avatar>
          ${this.shouldShowIcon?l`<wui-icon-box
                size="sm"
                iconcolor="fg-200"
                backgroundcolor="fg-300"
                icon=${this.accountType===F.ACCOUNT_TYPES.EOA?this.socialProvider??"mail":"lightbulb"}
                background="fg-300"
              ></wui-icon-box>`:l`<wui-flex .padding="${["0","0","0","s"]}"></wui-flex>`}
          <wui-flex flexDirection="column">
            <wui-text class="address" variant="paragraph-500" color="fg-100"
              >${A.getTruncateString({string:this.accountAddress,charsStart:4,charsEnd:6,truncate:"middle"})}</wui-text
            >
            <wui-text class="address-description" variant="small-400">${e}</wui-text></wui-flex
          >
        </wui-flex>
        <wui-flex gap="s" alignItems="center">
          <slot name="action"></slot>
          ${this.fetchingBalance?l`<wui-loading-spinner size="sm" color="accent-100"></wui-loading-spinner>`:l` <wui-text variant="small-400">$${this.balance.toFixed(2)}</wui-text>`}
        </wui-flex>
      </wui-flex>
    `}getLabel(){var o;let e=(o=this.labels)==null?void 0:o.get(this.accountAddress);const t=d.state.activeChain,n=b.getConnectorId(t);return!e&&n===_.CONNECTOR_ID.AUTH?e=`${this.accountType==="eoa"?this.socialProvider??"Email":"Smart"} Account`:e||(e="EOA"),e}};xe.styles=[I,T,Vn];ot([c()],xe.prototype,"accountAddress",void 0);ot([c()],xe.prototype,"accountType",void 0);ot([c({type:Boolean})],xe.prototype,"selected",void 0);ot([c({type:Function})],xe.prototype,"onSelect",void 0);xe=ot([h("wui-list-account")],xe);const Fn=x`
  wui-flex {
    width: 100%;
  }

  wui-icon-link {
    margin-right: calc(var(--wui-icon-box-size-md) * -1);
  }

  .account-links {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .account-links wui-flex {
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    flex: 1;
    background: red;
    align-items: center;
    justify-content: center;
    height: 48px;
    padding: 10px;
    flex: 1 0 0;

    border-radius: var(--XS, 16px);
    border: 1px solid var(--dark-accent-glass-010, rgba(71, 161, 255, 0.1));
    background: var(--dark-accent-glass-010, rgba(71, 161, 255, 0.1));
    transition: background-color var(--wui-ease-out-power-1) var(--wui-duration-md);
    will-change: background-color;
  }

  .account-links wui-flex:hover {
    background: var(--dark-accent-glass-015, rgba(71, 161, 255, 0.15));
  }

  .account-links wui-flex wui-icon {
    width: var(--S, 20px);
    height: var(--S, 20px);
  }

  .account-links wui-flex wui-icon svg path {
    stroke: #47a1ff;
  }

  .account-settings-button {
    padding: calc(var(--wui-spacing-m) - 1px) var(--wui-spacing-2l);
    height: 40px;
    border-radius: var(--wui-border-radius-xxs);
    border: 1px solid var(--wui-color-gray-glass-002);
    background: var(--wui-color-gray-glass-002);
    cursor: pointer;
  }

  .account-settings-button:hover {
    background: var(--wui-color-gray-glass-005);
  }
`;var Be=function(a,e,t,n){var o=arguments.length,i=o<3?e:n===null?n=Object.getOwnPropertyDescriptor(e,t):n,r;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")i=Reflect.decorate(a,e,t,n);else for(var s=a.length-1;s>=0;s--)(r=a[s])&&(i=(o<3?r(i):o>3?r(e,t,i):r(e,t))||i);return o>3&&i&&Object.defineProperty(e,t,i),i};let de=class extends w{constructor(){super(),this.usubscribe=[],this.address=m.state.address,this.profileImage=m.state.profileImage,this.profileName=m.state.profileName,this.accounts=m.state.allAccounts,this.loading=!1,this.usubscribe.push(m.subscribeKey("address",e=>{e?this.address=e:W.close()})),this.usubscribe.push(m.subscribeKey("profileImage",e=>{this.profileImage=e})),this.usubscribe.push(m.subscribeKey("profileName",e=>{this.profileName=e}))}disconnectedCallback(){this.usubscribe.forEach(e=>e())}render(){if(!this.address)throw new Error("w3m-profile-view: No account provided");return l`
      <wui-flex flexDirection="column" gap="l" .padding=${["0","xl","m","xl"]}>
        <wui-flex flexDirection="column" alignItems="center" gap="l">
          <wui-avatar
            alt=${this.address}
            address=${this.address}
            imageSrc=${p(this.profileImage)}
            size="2lg"
          ></wui-avatar>
          <wui-flex flexDirection="column" alignItems="center">
            <wui-flex gap="3xs" alignItems="center" justifyContent="center">
              <wui-text variant="title-6-600" color="fg-100" data-testid="account-settings-address">
                ${this.profileName?A.getTruncateString({string:this.profileName,charsStart:20,charsEnd:0,truncate:"end"}):A.getTruncateString({string:this.address,charsStart:4,charsEnd:6,truncate:"middle"})}
              </wui-text>
              <wui-icon-link
                size="md"
                icon="copy"
                iconColor="fg-200"
                @click=${this.onCopyAddress}
              ></wui-icon-link>
            </wui-flex>
          </wui-flex>
        </wui-flex>
        <wui-flex
          data-testid="account-settings-button"
          justifyContent="center"
          alignItems="center"
          class="account-settings-button"
          @click=${()=>g.push("AccountSettings")}
        >
          <wui-text variant="paragraph-500" color="fg-100">Account Settings</wui-text>
        </wui-flex>
        ${this.accountsTemplate()}
      </wui-flex>
    `}accountsTemplate(){return l`<wui-flex flexDirection="column">
      <wui-flex .padding=${["3xs","m","s","s"]}>
        <wui-text color="fg-200" variant="paragraph-400">Your accounts</wui-text>
      </wui-flex>
      <wui-flex flexDirection="column" gap="xxs">
        ${this.accounts.map(e=>this.accountTemplate(e))}
      </wui-flex>
    </wui-flex>`}async onSwitchAccount(e){var o;const t=(o=d.state.activeCaipNetwork)==null?void 0:o.chainNamespace;if(this.loading=!0,b.getAuthConnector()){const i=e.type;await C.setPreferredAccountType(i,t)}m.setShouldUpdateToAddress(e.address,t),this.loading=!1}accountTemplate(e){return l`<wui-list-account accountAddress=${e.address} accountType=${e.type}>
      ${e.address===this.address?"":l`<wui-button
            slot="action"
            textVariant="small-600"
            size="md"
            variant="accent"
            @click=${()=>this.onSwitchAccount(e)}
            .loading=${this.loading}
            >Switch</wui-button
          >`}
    </wui-list-account>`}onCopyAddress(){try{this.address&&(f.copyToClopboard(this.address),P.showSuccess("Address copied"))}catch{P.showError("Failed to copy")}}};de.styles=Fn;Be([u()],de.prototype,"address",void 0);Be([u()],de.prototype,"profileImage",void 0);Be([u()],de.prototype,"profileName",void 0);Be([u()],de.prototype,"accounts",void 0);Be([u()],de.prototype,"loading",void 0);de=Be([h("w3m-profile-view")],de);const Kn=x`
  wui-flex {
    width: 100%;
    background-color: var(--wui-color-gray-glass-005);
    border-radius: var(--wui-border-radius-m);
    padding: var(--wui-spacing-1xs) var(--wui-spacing-s) var(--wui-spacing-1xs)
      var(--wui-spacing-1xs);
  }
`;var Ot=function(a,e,t,n){var o=arguments.length,i=o<3?e:n===null?n=Object.getOwnPropertyDescriptor(e,t):n,r;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")i=Reflect.decorate(a,e,t,n);else for(var s=a.length-1;s>=0;s--)(r=a[s])&&(i=(o<3?r(i):o>3?r(e,t,i):r(e,t))||i);return o>3&&i&&Object.defineProperty(e,t,i),i};let Ee=class extends w{constructor(){super(...arguments),this.imageSrc="",this.text="",this.size=""}render(){return l`
      <wui-flex gap="1xs" alignItems="center">
        <wui-avatar size=${this.size} imageSrc=${this.imageSrc}></wui-avatar>
        <wui-text variant="small-400" color="fg-200">${this.text}</wui-text>
      </wui-flex>
    `}};Ee.styles=[I,T,Kn];Ot([c()],Ee.prototype,"imageSrc",void 0);Ot([c()],Ee.prototype,"text",void 0);Ot([c()],Ee.prototype,"size",void 0);Ee=Ot([h("wui-banner-img")],Ee);const Hn=x`
  wui-avatar {
    width: var(--wui-spacing-3xl);
    height: var(--wui-spacing-3xl);
    box-shadow: 0 0 0 0;
  }

  wui-icon-box {
    position: relative;
    right: 15px;
    top: 15px;
    border: 2px solid var(--wui-color-bg-150);
    background-color: var(--wui-color-bg-125);
  }
`;var ci=function(a,e,t,n){var o=arguments.length,i=o<3?e:n===null?n=Object.getOwnPropertyDescriptor(e,t):n,r;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")i=Reflect.decorate(a,e,t,n);else for(var s=a.length-1;s>=0;s--)(r=a[s])&&(i=(o<3?r(i):o>3?r(e,t,i):r(e,t))||i);return o>3&&i&&Object.defineProperty(e,t,i),i};let Ye=class extends w{constructor(){super(),this.metadata=v.state.metadata,this.allAccounts=m.state.allAccounts||[],this.balances={},this.labels=m.state.addressLabels,this.currentAddress=m.state.address||"",this.caipNetwork=d.state.activeCaipNetwork,m.subscribeKey("allAccounts",e=>{this.allAccounts=e})}connectedCallback(){super.connectedCallback(),this.allAccounts.forEach(e=>{var t;Fi.getBalance(e.address,(t=this.caipNetwork)==null?void 0:t.caipNetworkId).then(n=>{let o=this.balances[e.address]||0;n.balances.length>0&&(o=n.balances.reduce((i,r)=>i+((r==null?void 0:r.value)||0),0)),this.balances[e.address]=o,this.requestUpdate()})})}getAddressIcon(e){return e==="smartAccount"?"lightbulb":"mail"}render(){var e,t;return l`
      <wui-flex justifyContent="center" .padding=${["xl","0","xl","0"]}>
        <wui-banner-img
          imageSrc=${p((e=this.metadata)==null?void 0:e.icons[0])}
          text=${p((t=this.metadata)==null?void 0:t.url)}
          size="sm"
        ></wui-banner-img>
      </wui-flex>
      <wui-flex flexDirection="column" gap="xxl" .padding=${["l","xl","xl","xl"]}>
        ${this.allAccounts.map((n,o)=>this.getAddressTemplate(n,o))}
      </wui-flex>
    `}getAddressTemplate(e,t){var s,y,V,R;const n=(s=this.labels)==null?void 0:s.get(e.address),o=d.state.activeChain,r=b.getConnectorId(o)===_.CONNECTOR_ID.AUTH;return l`
      <wui-flex
        flexDirection="row"
        justifyContent="space-between"
        data-testid="switch-address-item"
      >
        <wui-flex alignItems="center">
          <wui-avatar address=${e.address}></wui-avatar>
          ${r?l`<wui-icon-box
                size="sm"
                iconcolor="fg-200"
                backgroundcolor="glass-002"
                background="gray"
                icon="${this.getAddressIcon(e.type)}"
                ?border=${!0}
              ></wui-icon-box>`:l`<wui-flex .padding="${["0","0","0","s"]}"></wui-flex>`}
          <wui-flex flexDirection="column">
            <wui-text class="address" variant="paragraph-500" color="fg-100"
              >${n||A.getTruncateString({string:e.address,charsStart:4,charsEnd:6,truncate:"middle"})}</wui-text
            >
            <wui-text class="address-description" variant="small-400">
              ${typeof this.balances[e.address]=="number"?`$${(y=this.balances[e.address])==null?void 0:y.toFixed(2)}`:l`<wui-loading-spinner size="sm" color="accent-100"></wui-loading-spinner>`}
            </wui-text>
          </wui-flex>
        </wui-flex>
        <wui-flex gap="s" alignItems="center">
          ${((V=e.address)==null?void 0:V.toLowerCase())===((R=this.currentAddress)==null?void 0:R.toLowerCase())?"":l`
                <wui-button
                  data-testid=${`w3m-switch-address-button-${t}`}
                  textVariant="small-600"
                  size="md"
                  variant="accent"
                  @click=${()=>this.onSwitchAddress(e.address)}
                  >Switch to</wui-button
                >
              `}
        </wui-flex>
      </wui-flex>
    `}onSwitchAddress(e){const t=d.state.activeCaipNetwork,n=t==null?void 0:t.chainNamespace,o=`${n}:${t==null?void 0:t.id}:${e}`;m.setCaipAddress(o,n),W.close()}};Ye.styles=Hn;ci([u()],Ye.prototype,"allAccounts",void 0);ci([u()],Ye.prototype,"balances",void 0);Ye=ci([h("w3m-switch-address-view")],Ye);const qn=x`
  :host {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  label {
    position: relative;
    display: inline-block;
    width: 32px;
    height: 22px;
  }

  input {
    width: 0;
    height: 0;
    opacity: 0;
  }

  span {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: var(--wui-color-blue-100);
    border-width: 1px;
    border-style: solid;
    border-color: var(--wui-color-gray-glass-002);
    border-radius: 999px;
    transition:
      background-color var(--wui-ease-inout-power-1) var(--wui-duration-md),
      border-color var(--wui-ease-inout-power-1) var(--wui-duration-md);
    will-change: background-color, border-color;
  }

  span:before {
    position: absolute;
    content: '';
    height: 16px;
    width: 16px;
    left: 3px;
    top: 2px;
    background-color: var(--wui-color-inverse-100);
    transition: transform var(--wui-ease-inout-power-1) var(--wui-duration-lg);
    will-change: transform;
    border-radius: 50%;
  }

  input:checked + span {
    border-color: var(--wui-color-gray-glass-005);
    background-color: var(--wui-color-blue-100);
  }

  input:not(:checked) + span {
    background-color: var(--wui-color-gray-glass-010);
  }

  input:checked + span:before {
    transform: translateX(calc(100% - 7px));
  }
`;var qi=function(a,e,t,n){var o=arguments.length,i=o<3?e:n===null?n=Object.getOwnPropertyDescriptor(e,t):n,r;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")i=Reflect.decorate(a,e,t,n);else for(var s=a.length-1;s>=0;s--)(r=a[s])&&(i=(o<3?r(i):o>3?r(e,t,i):r(e,t))||i);return o>3&&i&&Object.defineProperty(e,t,i),i};let dt=class extends w{constructor(){super(...arguments),this.inputElementRef=oi(),this.checked=void 0}render(){return l`
      <label>
        <input
          ${ri(this.inputElementRef)}
          type="checkbox"
          ?checked=${p(this.checked)}
          @change=${this.dispatchChangeEvent.bind(this)}
        />
        <span></span>
      </label>
    `}dispatchChangeEvent(){var e;this.dispatchEvent(new CustomEvent("switchChange",{detail:(e=this.inputElementRef.value)==null?void 0:e.checked,bubbles:!0,composed:!0}))}};dt.styles=[I,T,hn,qn];qi([c({type:Boolean})],dt.prototype,"checked",void 0);dt=qi([h("wui-switch")],dt);const Gn=x`
  :host {
    height: 100%;
  }

  button {
    display: flex;
    align-items: center;
    justify-content: center;
    column-gap: var(--wui-spacing-1xs);
    padding: var(--wui-spacing-xs) var(--wui-spacing-s);
    background-color: var(--wui-color-gray-glass-002);
    border-radius: var(--wui-border-radius-xs);
    box-shadow: inset 0 0 0 1px var(--wui-color-gray-glass-002);
    transition: background-color var(--wui-ease-out-power-1) var(--wui-duration-md);
    will-change: background-color;
    cursor: pointer;
  }

  wui-switch {
    pointer-events: none;
  }
`;var Gi=function(a,e,t,n){var o=arguments.length,i=o<3?e:n===null?n=Object.getOwnPropertyDescriptor(e,t):n,r;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")i=Reflect.decorate(a,e,t,n);else for(var s=a.length-1;s>=0;s--)(r=a[s])&&(i=(o<3?r(i):o>3?r(e,t,i):r(e,t))||i);return o>3&&i&&Object.defineProperty(e,t,i),i};let pt=class extends w{constructor(){super(...arguments),this.checked=void 0}render(){return l`
      <button>
        <wui-icon size="xl" name="walletConnectBrown"></wui-icon>
        <wui-switch ?checked=${p(this.checked)}></wui-switch>
      </button>
    `}};pt.styles=[I,T,Gn];Gi([c({type:Boolean})],pt.prototype,"checked",void 0);pt=Gi([h("wui-certified-switch")],pt);const Xn=x`
  button {
    background-color: var(--wui-color-fg-300);
    border-radius: var(--wui-border-radius-4xs);
    width: 16px;
    height: 16px;
  }

  button:disabled {
    background-color: var(--wui-color-bg-300);
  }

  wui-icon {
    color: var(--wui-color-bg-200) !important;
  }

  button:focus-visible {
    background-color: var(--wui-color-fg-250);
    border: 1px solid var(--wui-color-accent-100);
  }

  @media (hover: hover) and (pointer: fine) {
    button:hover:enabled {
      background-color: var(--wui-color-fg-250);
    }

    button:active:enabled {
      background-color: var(--wui-color-fg-225);
    }
  }
`;var Xi=function(a,e,t,n){var o=arguments.length,i=o<3?e:n===null?n=Object.getOwnPropertyDescriptor(e,t):n,r;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")i=Reflect.decorate(a,e,t,n);else for(var s=a.length-1;s>=0;s--)(r=a[s])&&(i=(o<3?r(i):o>3?r(e,t,i):r(e,t))||i);return o>3&&i&&Object.defineProperty(e,t,i),i};let ht=class extends w{constructor(){super(...arguments),this.icon="copy"}render(){return l`
      <button>
        <wui-icon color="inherit" size="xxs" name=${this.icon}></wui-icon>
      </button>
    `}};ht.styles=[I,T,Xn];Xi([c()],ht.prototype,"icon",void 0);ht=Xi([h("wui-input-element")],ht);const Yn=x`
  :host {
    position: relative;
    display: inline-block;
    width: 100%;
  }
`;var Qn=function(a,e,t,n){var o=arguments.length,i=o<3?e:n===null?n=Object.getOwnPropertyDescriptor(e,t):n,r;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")i=Reflect.decorate(a,e,t,n);else for(var s=a.length-1;s>=0;s--)(r=a[s])&&(i=(o<3?r(i):o>3?r(e,t,i):r(e,t))||i);return o>3&&i&&Object.defineProperty(e,t,i),i};let Yt=class extends w{constructor(){super(...arguments),this.inputComponentRef=oi()}render(){return l`
      <wui-input-text
        ${ri(this.inputComponentRef)}
        placeholder="Search wallet"
        icon="search"
        type="search"
        enterKeyHint="search"
        size="sm"
      >
        <wui-input-element @click=${this.clearValue} icon="close"></wui-input-element>
      </wui-input-text>
    `}clearValue(){const e=this.inputComponentRef.value,t=e==null?void 0:e.inputElementRef.value;t&&(t.value="",t.focus(),t.dispatchEvent(new Event("input")))}};Yt.styles=[I,Yn];Yt=Qn([h("wui-search-bar")],Yt);const Jn=x`
  :host {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 104px;
    row-gap: var(--wui-spacing-xs);
    padding: var(--wui-spacing-xs) 10px;
    background-color: var(--wui-color-gray-glass-002);
    border-radius: clamp(0px, var(--wui-border-radius-xs), 20px);
    position: relative;
  }

  wui-shimmer[data-type='network'] {
    border: none;
    -webkit-clip-path: var(--wui-path-network);
    clip-path: var(--wui-path-network);
  }

  svg {
    position: absolute;
    width: 48px;
    height: 54px;
    z-index: 1;
  }

  svg > path {
    stroke: var(--wui-color-gray-glass-010);
    stroke-width: 1px;
  }

  @media (max-width: 350px) {
    :host {
      width: 100%;
    }
  }
`;var Yi=function(a,e,t,n){var o=arguments.length,i=o<3?e:n===null?n=Object.getOwnPropertyDescriptor(e,t):n,r;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")i=Reflect.decorate(a,e,t,n);else for(var s=a.length-1;s>=0;s--)(r=a[s])&&(i=(o<3?r(i):o>3?r(e,t,i):r(e,t))||i);return o>3&&i&&Object.defineProperty(e,t,i),i};let wt=class extends w{constructor(){super(...arguments),this.type="wallet"}render(){return l`
      ${this.shimmerTemplate()}
      <wui-shimmer width="56px" height="20px" borderRadius="xs"></wui-shimmer>
    `}shimmerTemplate(){return this.type==="network"?l` <wui-shimmer
          data-type=${this.type}
          width="48px"
          height="54px"
          borderRadius="xs"
        ></wui-shimmer>
        ${bn}`:l`<wui-shimmer width="56px" height="56px" borderRadius="xs"></wui-shimmer>`}};wt.styles=[I,T,Jn];Yi([c()],wt.prototype,"type",void 0);wt=Yi([h("wui-card-select-loader")],wt);const Zn=x`
  :host {
    display: grid;
    width: inherit;
    height: inherit;
  }
`;var X=function(a,e,t,n){var o=arguments.length,i=o<3?e:n===null?n=Object.getOwnPropertyDescriptor(e,t):n,r;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")i=Reflect.decorate(a,e,t,n);else for(var s=a.length-1;s>=0;s--)(r=a[s])&&(i=(o<3?r(i):o>3?r(e,t,i):r(e,t))||i);return o>3&&i&&Object.defineProperty(e,t,i),i};let B=class extends w{render(){return this.style.cssText=`
      grid-template-rows: ${this.gridTemplateRows};
      grid-template-columns: ${this.gridTemplateColumns};
      justify-items: ${this.justifyItems};
      align-items: ${this.alignItems};
      justify-content: ${this.justifyContent};
      align-content: ${this.alignContent};
      column-gap: ${this.columnGap&&`var(--wui-spacing-${this.columnGap})`};
      row-gap: ${this.rowGap&&`var(--wui-spacing-${this.rowGap})`};
      gap: ${this.gap&&`var(--wui-spacing-${this.gap})`};
      padding-top: ${this.padding&&A.getSpacingStyles(this.padding,0)};
      padding-right: ${this.padding&&A.getSpacingStyles(this.padding,1)};
      padding-bottom: ${this.padding&&A.getSpacingStyles(this.padding,2)};
      padding-left: ${this.padding&&A.getSpacingStyles(this.padding,3)};
      margin-top: ${this.margin&&A.getSpacingStyles(this.margin,0)};
      margin-right: ${this.margin&&A.getSpacingStyles(this.margin,1)};
      margin-bottom: ${this.margin&&A.getSpacingStyles(this.margin,2)};
      margin-left: ${this.margin&&A.getSpacingStyles(this.margin,3)};
    `,l`<slot></slot>`}};B.styles=[I,Zn];X([c()],B.prototype,"gridTemplateRows",void 0);X([c()],B.prototype,"gridTemplateColumns",void 0);X([c()],B.prototype,"justifyItems",void 0);X([c()],B.prototype,"alignItems",void 0);X([c()],B.prototype,"justifyContent",void 0);X([c()],B.prototype,"alignContent",void 0);X([c()],B.prototype,"columnGap",void 0);X([c()],B.prototype,"rowGap",void 0);X([c()],B.prototype,"gap",void 0);X([c()],B.prototype,"padding",void 0);X([c()],B.prototype,"margin",void 0);B=X([h("wui-grid")],B);const eo=x`
  button {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    width: 104px;
    row-gap: var(--wui-spacing-xs);
    padding: var(--wui-spacing-s) var(--wui-spacing-0);
    background-color: var(--wui-color-gray-glass-002);
    border-radius: clamp(0px, var(--wui-border-radius-xs), 20px);
    transition:
      color var(--wui-duration-lg) var(--wui-ease-out-power-1),
      background-color var(--wui-duration-lg) var(--wui-ease-out-power-1),
      border-radius var(--wui-duration-lg) var(--wui-ease-out-power-1);
    will-change: background-color, color, border-radius;
    outline: none;
    border: none;
  }

  button > wui-flex > wui-text {
    color: var(--wui-color-fg-100);
    max-width: 86px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    justify-content: center;
  }

  button > wui-flex > wui-text.certified {
    max-width: 66px;
  }

  button:hover:enabled {
    background-color: var(--wui-color-gray-glass-005);
  }

  button:disabled > wui-flex > wui-text {
    color: var(--wui-color-gray-glass-015);
  }

  [data-selected='true'] {
    background-color: var(--wui-color-accent-glass-020);
  }

  @media (hover: hover) and (pointer: fine) {
    [data-selected='true']:hover:enabled {
      background-color: var(--wui-color-accent-glass-015);
    }
  }

  [data-selected='true']:active:enabled {
    background-color: var(--wui-color-accent-glass-010);
  }

  @media (max-width: 350px) {
    button {
      width: 100%;
    }
  }
`;var rt=function(a,e,t,n){var o=arguments.length,i=o<3?e:n===null?n=Object.getOwnPropertyDescriptor(e,t):n,r;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")i=Reflect.decorate(a,e,t,n);else for(var s=a.length-1;s>=0;s--)(r=a[s])&&(i=(o<3?r(i):o>3?r(e,t,i):r(e,t))||i);return o>3&&i&&Object.defineProperty(e,t,i),i};let ve=class extends w{constructor(){super(),this.observer=new IntersectionObserver(()=>{}),this.visible=!1,this.imageSrc=void 0,this.imageLoading=!1,this.wallet=void 0,this.observer=new IntersectionObserver(e=>{e.forEach(t=>{t.isIntersecting?(this.visible=!0,this.fetchImageSrc()):this.visible=!1})},{threshold:.01})}firstUpdated(){this.observer.observe(this)}disconnectedCallback(){this.observer.disconnect()}render(){var t,n;const e=((t=this.wallet)==null?void 0:t.badge_type)==="certified";return l`
      <button>
        ${this.imageTemplate()}
        <wui-flex flexDirection="row" alignItems="center" justifyContent="center" gap="3xs">
          <wui-text
            variant="tiny-500"
            color="inherit"
            class=${p(e?"certified":void 0)}
            >${(n=this.wallet)==null?void 0:n.name}</wui-text
          >
          ${e?l`<wui-icon size="sm" name="walletConnectBrown"></wui-icon>`:null}
        </wui-flex>
      </button>
    `}imageTemplate(){var e,t;return!this.visible&&!this.imageSrc||this.imageLoading?this.shimmerTemplate():l`
      <wui-wallet-image
        size="md"
        imageSrc=${p(this.imageSrc)}
        name=${(e=this.wallet)==null?void 0:e.name}
        .installed=${(t=this.wallet)==null?void 0:t.installed}
        badgeSize="sm"
      >
      </wui-wallet-image>
    `}shimmerTemplate(){return l`<wui-shimmer width="56px" height="56px" borderRadius="xs"></wui-shimmer>`}async fetchImageSrc(){this.wallet&&(this.imageSrc=$.getWalletImage(this.wallet),!this.imageSrc&&(this.imageLoading=!0,this.imageSrc=await $.fetchWalletImage(this.wallet.image_id),this.imageLoading=!1))}};ve.styles=eo;rt([u()],ve.prototype,"visible",void 0);rt([u()],ve.prototype,"imageSrc",void 0);rt([u()],ve.prototype,"imageLoading",void 0);rt([c()],ve.prototype,"wallet",void 0);ve=rt([h("w3m-all-wallets-list-item")],ve);const to=x`
  wui-grid {
    max-height: clamp(360px, 400px, 80vh);
    overflow: scroll;
    scrollbar-width: none;
    grid-auto-rows: min-content;
    grid-template-columns: repeat(auto-fill, 104px);
  }

  @media (max-width: 350px) {
    wui-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  wui-grid[data-scroll='false'] {
    overflow: hidden;
  }

  wui-grid::-webkit-scrollbar {
    display: none;
  }

  wui-loading-spinner {
    padding-top: var(--wui-spacing-l);
    padding-bottom: var(--wui-spacing-l);
    justify-content: center;
    grid-column: 1 / span 4;
  }
`;var ze=function(a,e,t,n){var o=arguments.length,i=o<3?e:n===null?n=Object.getOwnPropertyDescriptor(e,t):n,r;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")i=Reflect.decorate(a,e,t,n);else for(var s=a.length-1;s>=0;s--)(r=a[s])&&(i=(o<3?r(i):o>3?r(e,t,i):r(e,t))||i);return o>3&&i&&Object.defineProperty(e,t,i),i};const Ni="local-paginator";let pe=class extends w{constructor(){super(),this.unsubscribe=[],this.paginationObserver=void 0,this.loading=!S.state.wallets.length,this.wallets=S.state.wallets,this.recommended=S.state.recommended,this.featured=S.state.featured,this.filteredWallets=S.state.filteredWallets,this.unsubscribe.push(S.subscribeKey("wallets",e=>this.wallets=e),S.subscribeKey("recommended",e=>this.recommended=e),S.subscribeKey("featured",e=>this.featured=e),S.subscribeKey("filteredWallets",e=>this.filteredWallets=e))}firstUpdated(){this.initialFetch(),this.createPaginationObserver()}disconnectedCallback(){var e;this.unsubscribe.forEach(t=>t()),(e=this.paginationObserver)==null||e.disconnect()}render(){return l`
      <wui-grid
        data-scroll=${!this.loading}
        .padding=${["0","s","s","s"]}
        columnGap="xxs"
        rowGap="l"
        justifyContent="space-between"
      >
        ${this.loading?this.shimmerTemplate(16):this.walletsTemplate()}
        ${this.paginationLoaderTemplate()}
      </wui-grid>
    `}async initialFetch(){var t;this.loading=!0;const e=(t=this.shadowRoot)==null?void 0:t.querySelector("wui-grid");e&&(await S.fetchWalletsByPage({page:1}),await e.animate([{opacity:1},{opacity:0}],{duration:200,fill:"forwards",easing:"ease"}).finished,this.loading=!1,e.animate([{opacity:0},{opacity:1}],{duration:200,fill:"forwards",easing:"ease"}))}shimmerTemplate(e,t){return[...Array(e)].map(()=>l`
        <wui-card-select-loader type="wallet" id=${p(t)}></wui-card-select-loader>
      `)}walletsTemplate(){var n;const e=((n=this.filteredWallets)==null?void 0:n.length)>0?f.uniqueBy([...this.featured,...this.recommended,...this.filteredWallets],"id"):f.uniqueBy([...this.featured,...this.recommended,...this.wallets],"id");return Te.markWalletsAsInstalled(e).map(o=>l`
        <w3m-all-wallets-list-item
          @click=${()=>this.onConnectWallet(o)}
          .wallet=${o}
        ></w3m-all-wallets-list-item>
      `)}paginationLoaderTemplate(){const{wallets:e,recommended:t,featured:n,count:o}=S.state,i=window.innerWidth<352?3:4,r=e.length+t.length;let y=Math.ceil(r/i)*i-r+i;return y-=e.length?n.length%i:0,o===0&&n.length>0?null:o===0||[...n,...e,...t].length<o?this.shimmerTemplate(y,Ni):null}createPaginationObserver(){var t;const e=(t=this.shadowRoot)==null?void 0:t.querySelector(`#${Ni}`);e&&(this.paginationObserver=new IntersectionObserver(([n])=>{if(n!=null&&n.isIntersecting&&!this.loading){const{page:o,count:i,wallets:r}=S.state;r.length<i&&S.fetchWalletsByPage({page:o+1})}}),this.paginationObserver.observe(e))}onConnectWallet(e){b.selectWalletConnector(e)}};pe.styles=to;ze([u()],pe.prototype,"loading",void 0);ze([u()],pe.prototype,"wallets",void 0);ze([u()],pe.prototype,"recommended",void 0);ze([u()],pe.prototype,"featured",void 0);ze([u()],pe.prototype,"filteredWallets",void 0);pe=ze([h("w3m-all-wallets-list")],pe);const io=x`
  wui-grid,
  wui-loading-spinner,
  wui-flex {
    height: 360px;
  }

  wui-grid {
    overflow: scroll;
    scrollbar-width: none;
    grid-auto-rows: min-content;
    grid-template-columns: repeat(auto-fill, 104px);
  }

  wui-grid[data-scroll='false'] {
    overflow: hidden;
  }

  wui-grid::-webkit-scrollbar {
    display: none;
  }

  wui-loading-spinner {
    justify-content: center;
    align-items: center;
  }

  @media (max-width: 350px) {
    wui-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }
`;var Pt=function(a,e,t,n){var o=arguments.length,i=o<3?e:n===null?n=Object.getOwnPropertyDescriptor(e,t):n,r;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")i=Reflect.decorate(a,e,t,n);else for(var s=a.length-1;s>=0;s--)(r=a[s])&&(i=(o<3?r(i):o>3?r(e,t,i):r(e,t))||i);return o>3&&i&&Object.defineProperty(e,t,i),i};let Ne=class extends w{constructor(){super(...arguments),this.prevQuery="",this.prevBadge=void 0,this.loading=!0,this.query=""}render(){return this.onSearch(),this.loading?l`<wui-loading-spinner color="accent-100"></wui-loading-spinner>`:this.walletsTemplate()}async onSearch(){(this.query.trim()!==this.prevQuery.trim()||this.badge!==this.prevBadge)&&(this.prevQuery=this.query,this.prevBadge=this.badge,this.loading=!0,await S.searchWallet({search:this.query,badge:this.badge}),this.loading=!1)}walletsTemplate(){const{search:e}=S.state,t=Te.markWalletsAsInstalled(e);return e.length?l`
      <wui-grid
        data-testid="wallet-list"
        .padding=${["0","s","s","s"]}
        rowGap="l"
        columnGap="xs"
        justifyContent="space-between"
      >
        ${t.map(n=>l`
            <w3m-all-wallets-list-item
              @click=${()=>this.onConnectWallet(n)}
              .wallet=${n}
              data-testid="wallet-search-item-${n.id}"
            ></w3m-all-wallets-list-item>
          `)}
      </wui-grid>
    `:l`
        <wui-flex
          data-testid="no-wallet-found"
          justifyContent="center"
          alignItems="center"
          gap="s"
          flexDirection="column"
        >
          <wui-icon-box
            size="lg"
            iconColor="fg-200"
            backgroundColor="fg-300"
            icon="wallet"
            background="transparent"
          ></wui-icon-box>
          <wui-text data-testid="no-wallet-found-text" color="fg-200" variant="paragraph-500">
            No Wallet found
          </wui-text>
        </wui-flex>
      `}onConnectWallet(e){b.selectWalletConnector(e)}};Ne.styles=io;Pt([u()],Ne.prototype,"loading",void 0);Pt([c()],Ne.prototype,"query",void 0);Pt([c()],Ne.prototype,"badge",void 0);Ne=Pt([h("w3m-all-wallets-search")],Ne);var ui=function(a,e,t,n){var o=arguments.length,i=o<3?e:n===null?n=Object.getOwnPropertyDescriptor(e,t):n,r;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")i=Reflect.decorate(a,e,t,n);else for(var s=a.length-1;s>=0;s--)(r=a[s])&&(i=(o<3?r(i):o>3?r(e,t,i):r(e,t))||i);return o>3&&i&&Object.defineProperty(e,t,i),i};let ft=class extends w{constructor(){super(...arguments),this.search="",this.onDebouncedSearch=f.debounce(e=>{this.search=e})}render(){const e=this.search.length>=2;return l`
      <wui-flex .padding=${["0","s","s","s"]} gap="xs">
        <wui-search-bar @inputChange=${this.onInputChange.bind(this)}></wui-search-bar>
        <wui-certified-switch
          ?checked=${this.badge}
          @click=${this.onClick.bind(this)}
          data-testid="wui-certified-switch"
        ></wui-certified-switch>
        ${this.qrButtonTemplate()}
      </wui-flex>
      ${e||this.badge?l`<w3m-all-wallets-search
            query=${this.search}
            badge=${p(this.badge)}
          ></w3m-all-wallets-search>`:l`<w3m-all-wallets-list badge=${p(this.badge)}></w3m-all-wallets-list>`}
    `}onInputChange(e){this.onDebouncedSearch(e.detail)}onClick(){if(this.badge==="certified"){this.badge=void 0;return}this.badge="certified",P.showSvg("Only WalletConnect certified",{icon:"walletConnectBrown",iconColor:"accent-100"})}qrButtonTemplate(){return f.isMobile()?l`
        <wui-icon-box
          size="lg"
          iconSize="xl"
          iconColor="accent-100"
          backgroundColor="accent-100"
          icon="qrCode"
          background="transparent"
          border
          borderColor="wui-accent-glass-010"
          @click=${this.onWalletConnectQr.bind(this)}
        ></wui-icon-box>
      `:null}onWalletConnectQr(){g.push("ConnectingWalletConnect")}};ui([u()],ft.prototype,"search",void 0);ui([u()],ft.prototype,"badge",void 0);ft=ui([h("w3m-all-wallets-view")],ft);const no=x`
  button {
    column-gap: var(--wui-spacing-s);
    padding: 16.5px var(--wui-spacing-l) 16.5px var(--wui-spacing-xs);
    width: 100%;
    background-color: var(--wui-color-gray-glass-002);
    border-radius: var(--wui-border-radius-xs);
    color: var(--wui-color-fg-100);
    justify-content: center;
    align-items: center;
  }

  button:disabled {
    background-color: var(--wui-color-gray-glass-015);
    color: var(--wui-color-gray-glass-015);
  }
`;var jt=function(a,e,t,n){var o=arguments.length,i=o<3?e:n===null?n=Object.getOwnPropertyDescriptor(e,t):n,r;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")i=Reflect.decorate(a,e,t,n);else for(var s=a.length-1;s>=0;s--)(r=a[s])&&(i=(o<3?r(i):o>3?r(e,t,i):r(e,t))||i);return o>3&&i&&Object.defineProperty(e,t,i),i};let Oe=class extends w{constructor(){super(...arguments),this.text="",this.disabled=!1,this.tabIdx=void 0}render(){return l`
      <button ?disabled=${this.disabled} tabindex=${p(this.tabIdx)}>
        <wui-text align="center" variant="paragraph-500" color="inherit">${this.text}</wui-text>
      </button>
    `}};Oe.styles=[I,T,no];jt([c()],Oe.prototype,"text",void 0);jt([c({type:Boolean})],Oe.prototype,"disabled",void 0);jt([c()],Oe.prototype,"tabIdx",void 0);Oe=jt([h("wui-list-button")],Oe);const oo=x`
  wui-separator {
    margin: var(--wui-spacing-s) calc(var(--wui-spacing-s) * -1);
    width: calc(100% + var(--wui-spacing-s) * 2);
  }

  wui-email-input {
    width: 100%;
  }

  form {
    width: 100%;
    display: block;
    position: relative;
  }

  wui-icon-link,
  wui-loading-spinner {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
  }

  wui-icon-link {
    right: var(--wui-spacing-xs);
  }

  wui-loading-spinner {
    right: var(--wui-spacing-m);
  }

  wui-text {
    margin: var(--wui-spacing-xxs) var(--wui-spacing-m) var(--wui-spacing-0) var(--wui-spacing-m);
  }
`;var at=function(a,e,t,n){var o=arguments.length,i=o<3?e:n===null?n=Object.getOwnPropertyDescriptor(e,t):n,r;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")i=Reflect.decorate(a,e,t,n);else for(var s=a.length-1;s>=0;s--)(r=a[s])&&(i=(o<3?r(i):o>3?r(e,t,i):r(e,t))||i);return o>3&&i&&Object.defineProperty(e,t,i),i};let ye=class extends w{constructor(){super(...arguments),this.unsubscribe=[],this.formRef=oi(),this.email="",this.loading=!1,this.error=""}disconnectedCallback(){this.unsubscribe.forEach(e=>e())}firstUpdated(){var e;(e=this.formRef.value)==null||e.addEventListener("keydown",t=>{t.key==="Enter"&&this.onSubmitEmail(t)})}render(){return l`
      <form ${ri(this.formRef)} @submit=${this.onSubmitEmail.bind(this)}>
        <wui-email-input
          @focus=${this.onFocusEvent.bind(this)}
          .disabled=${this.loading}
          @inputChange=${this.onEmailInputChange.bind(this)}
          tabIdx=${p(this.tabIdx)}
        >
        </wui-email-input>

        ${this.submitButtonTemplate()}${this.loadingTemplate()}
        <input type="submit" hidden />
      </form>
      ${this.templateError()}
    `}submitButtonTemplate(){return!this.loading&&this.email.length>3?l`
          <wui-icon-link
            size="sm"
            icon="chevronRight"
            iconcolor="accent-100"
            @click=${this.onSubmitEmail.bind(this)}
          >
          </wui-icon-link>
        `:null}loadingTemplate(){return this.loading?l`<wui-loading-spinner size="md" color="accent-100"></wui-loading-spinner>`:null}templateError(){return this.error?l`<wui-text variant="tiny-500" color="error-100">${this.error}</wui-text>`:null}onEmailInputChange(e){this.email=e.detail.trim(),this.error=""}async onSubmitEmail(e){if(!_.AUTH_CONNECTOR_SUPPORTED_CHAINS.find(n=>n===d.state.activeChain)){const n=d.getFirstCaipNetworkSupportsAuthConnector();if(n){g.push("SwitchNetwork",{network:n});return}}try{if(this.loading)return;this.loading=!0,e.preventDefault();const n=b.getAuthConnector();if(!n)throw new Error("w3m-email-login-widget: Auth connector not found");const{action:o}=await n.provider.connectEmail({email:this.email});k.sendEvent({type:"track",event:"EMAIL_SUBMITTED"}),o==="VERIFY_OTP"?(k.sendEvent({type:"track",event:"EMAIL_VERIFICATION_CODE_SENT"}),g.push("EmailVerifyOtp",{email:this.email})):o==="VERIFY_DEVICE"?g.push("EmailVerifyDevice",{email:this.email}):o==="CONNECT"&&(await C.connectExternal(n,d.state.activeChain),g.replace("Account"))}catch(n){const o=f.parseError(n);o!=null&&o.includes("Invalid email")?this.error="Invalid email. Try again.":P.showError(n)}finally{this.loading=!1}}onFocusEvent(){k.sendEvent({type:"track",event:"EMAIL_LOGIN_SELECTED"})}};ye.styles=oo;at([c()],ye.prototype,"tabIdx",void 0);at([u()],ye.prototype,"email",void 0);at([u()],ye.prototype,"loading",void 0);at([u()],ye.prototype,"error",void 0);ye=at([h("w3m-email-login-widget")],ye);const ro=x`
  :host {
    display: block;
    width: 100%;
  }

  button {
    width: 100%;
    height: 56px;
    background: var(--wui-color-gray-glass-002);
    border-radius: var(--wui-border-radius-xs);
  }
`;var Dt=function(a,e,t,n){var o=arguments.length,i=o<3?e:n===null?n=Object.getOwnPropertyDescriptor(e,t):n,r;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")i=Reflect.decorate(a,e,t,n);else for(var s=a.length-1;s>=0;s--)(r=a[s])&&(i=(o<3?r(i):o>3?r(e,t,i):r(e,t))||i);return o>3&&i&&Object.defineProperty(e,t,i),i};let Pe=class extends w{constructor(){super(...arguments),this.logo="google",this.disabled=!1,this.tabIdx=void 0}render(){return l`
      <button ?disabled=${this.disabled} tabindex=${p(this.tabIdx)}>
        <wui-logo logo=${this.logo}></wui-logo>
      </button>
    `}};Pe.styles=[I,T,ro];Dt([c()],Pe.prototype,"logo",void 0);Dt([c({type:Boolean})],Pe.prototype,"disabled",void 0);Dt([c()],Pe.prototype,"tabIdx",void 0);Pe=Dt([h("wui-logo-select")],Pe);const ao=x`
  wui-separator {
    margin: var(--wui-spacing-m) calc(var(--wui-spacing-m) * -1) var(--wui-spacing-m)
      calc(var(--wui-spacing-m) * -1);
    width: calc(100% + var(--wui-spacing-s) * 2);
  }
`;var Ie=function(a,e,t,n){var o=arguments.length,i=o<3?e:n===null?n=Object.getOwnPropertyDescriptor(e,t):n,r;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")i=Reflect.decorate(a,e,t,n);else for(var s=a.length-1;s>=0;s--)(r=a[s])&&(i=(o<3?r(i):o>3?r(e,t,i):r(e,t))||i);return o>3&&i&&Object.defineProperty(e,t,i),i};const Oi=2,Pi=6;let se=class extends w{constructor(){super(),this.unsubscribe=[],this.walletGuide="get-started",this.tabIdx=void 0,this.connectors=b.state.connectors,this.remoteFeatures=v.state.remoteFeatures,this.authConnector=this.connectors.find(e=>e.type==="AUTH"),this.isPwaLoading=!1,this.unsubscribe.push(b.subscribeKey("connectors",e=>{this.connectors=e,this.authConnector=this.connectors.find(t=>t.type==="AUTH")}),v.subscribeKey("remoteFeatures",e=>this.remoteFeatures=e))}connectedCallback(){super.connectedCallback(),this.handlePwaFrameLoad()}disconnectedCallback(){this.unsubscribe.forEach(e=>e())}render(){return l`
      <wui-flex
        class="container"
        flexDirection="column"
        gap="xs"
        data-testid="w3m-social-login-widget"
      >
        ${this.topViewTemplate()}${this.bottomViewTemplate()}
      </wui-flex>
    `}topViewTemplate(){var n;const e=this.walletGuide==="explore";let t=(n=this.remoteFeatures)==null?void 0:n.socials;return!t&&e?(t=U.DEFAULT_SOCIALS,this.renderTopViewContent(t)):t?this.renderTopViewContent(t):null}renderTopViewContent(e){return e.length===2?l` <wui-flex gap="xs">
        ${e.slice(0,Oi).map(t=>l`<wui-logo-select
              data-testid=${`social-selector-${t}`}
              @click=${()=>{this.onSocialClick(t)}}
              logo=${t}
              tabIdx=${p(this.tabIdx)}
              ?disabled=${this.isPwaLoading}
            ></wui-logo-select>`)}
      </wui-flex>`:l` <wui-list-social
      data-testid=${`social-selector-${e[0]}`}
      @click=${()=>{this.onSocialClick(e[0])}}
      logo=${p(e[0])}
      align="center"
      name=${`Continue with ${e[0]}`}
      tabIdx=${p(this.tabIdx)}
      ?disabled=${this.isPwaLoading}
    ></wui-list-social>`}bottomViewTemplate(){var o;let e=(o=this.remoteFeatures)==null?void 0:o.socials;const t=this.walletGuide==="explore";return(!this.authConnector||!e||e.length===0)&&t&&(e=U.DEFAULT_SOCIALS),!e||e.length<=Oi?null:e&&e.length>Pi?l`<wui-flex gap="xs">
        ${e.slice(1,Pi-1).map(i=>l`<wui-logo-select
              data-testid=${`social-selector-${i}`}
              @click=${()=>{this.onSocialClick(i)}}
              logo=${i}
              tabIdx=${p(this.tabIdx)}
              ?focusable=${this.tabIdx!==void 0&&this.tabIdx>=0}
              ?disabled=${this.isPwaLoading}
            ></wui-logo-select>`)}
        <wui-logo-select
          logo="more"
          tabIdx=${p(this.tabIdx)}
          @click=${this.onMoreSocialsClick.bind(this)}
          ?disabled=${this.isPwaLoading}
          data-testid="social-selector-more"
        ></wui-logo-select>
      </wui-flex>`:e?l`<wui-flex gap="xs">
      ${e.slice(1,e.length).map(i=>l`<wui-logo-select
            data-testid=${`social-selector-${i}`}
            @click=${()=>{this.onSocialClick(i)}}
            logo=${i}
            tabIdx=${p(this.tabIdx)}
            ?focusable=${this.tabIdx!==void 0&&this.tabIdx>=0}
            ?disabled=${this.isPwaLoading}
          ></wui-logo-select>`)}
    </wui-flex>`:null}onMoreSocialsClick(){g.push("ConnectSocials")}async onSocialClick(e){if(!_.AUTH_CONNECTOR_SUPPORTED_CHAINS.find(n=>n===d.state.activeChain)){const n=d.getFirstCaipNetworkSupportsAuthConnector();if(n){g.push("SwitchNetwork",{network:n});return}}e&&await xn(e)}async handlePwaFrameLoad(){var e;if(f.isPWA()){this.isPwaLoading=!0;try{((e=this.authConnector)==null?void 0:e.provider)instanceof wn&&await this.authConnector.provider.init()}catch(t){fn.open({shortMessage:"Error loading embedded wallet in PWA",longMessage:t.message},"error")}finally{this.isPwaLoading=!1}}}};se.styles=ao;Ie([c()],se.prototype,"walletGuide",void 0);Ie([c()],se.prototype,"tabIdx",void 0);Ie([u()],se.prototype,"connectors",void 0);Ie([u()],se.prototype,"remoteFeatures",void 0);Ie([u()],se.prototype,"authConnector",void 0);Ie([u()],se.prototype,"isPwaLoading",void 0);se=Ie([h("w3m-social-login-widget")],se);const so=x`
  wui-flex {
    width: 100%;
  }

  .wallet-guide {
    width: 100%;
  }

  .chip-box {
    width: fit-content;
    background-color: var(--wui-color-gray-glass-005);
    border-radius: var(--wui-border-radius-3xl);
  }
`;var di=function(a,e,t,n){var o=arguments.length,i=o<3?e:n===null?n=Object.getOwnPropertyDescriptor(e,t):n,r;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")i=Reflect.decorate(a,e,t,n);else for(var s=a.length-1;s>=0;s--)(r=a[s])&&(i=(o<3?r(i):o>3?r(e,t,i):r(e,t))||i);return o>3&&i&&Object.defineProperty(e,t,i),i};let Qe=class extends w{constructor(){super(...arguments),this.walletGuide="get-started"}render(){return this.walletGuide==="explore"?l`<wui-flex
          class="wallet-guide"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          rowGap="xs"
          data-testid="w3m-wallet-guide-explore"
        >
          <wui-text variant="small-400" color="fg-200" align="center">
            Looking for a self-custody wallet?
          </wui-text>

          <wui-flex class="chip-box">
            <wui-chip
              imageIcon="walletConnectLightBrown"
              icon="externalLink"
              variant="transparent"
              href="https://walletguide.walletconnect.network"
              title="Find one on WalletGuide"
            ></wui-chip>
          </wui-flex>
        </wui-flex>`:l`<wui-flex
          columnGap="4xs"
          flexDirection="row"
          alignItems="center"
          justifyContent="center"
          .padding=${["s","0","s","0"]}
        >
          <wui-text variant="small-400" class="title" color="fg-200"
            >Haven't got a wallet?</wui-text
          >
          <wui-link
            data-testid="w3m-wallet-guide-get-started"
            color="blue-100"
            class="get-started-link"
            @click=${this.onGetStarted}
            tabIdx=${p(this.tabIdx)}
          >
            Get started
          </wui-link>
        </wui-flex>`}onGetStarted(){g.push("Create")}};Qe.styles=so;di([c()],Qe.prototype,"tabIdx",void 0);di([c()],Qe.prototype,"walletGuide",void 0);Qe=di([h("w3m-wallet-guide")],Qe);const lo=x`
  :host {
    position: relative;
    border-radius: var(--wui-border-radius-xxs);
    width: 40px;
    height: 40px;
    overflow: hidden;
    background: var(--wui-color-gray-glass-002);
    display: flex;
    justify-content: center;
    align-items: center;
    flex-wrap: wrap;
    gap: var(--wui-spacing-4xs);
    padding: 3.75px !important;
  }

  :host::after {
    content: '';
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    border-radius: inherit;
    border: 1px solid var(--wui-color-gray-glass-010);
    pointer-events: none;
  }

  :host > wui-wallet-image {
    width: 14px;
    height: 14px;
    border-radius: var(--wui-border-radius-5xs);
  }

  :host > wui-flex {
    padding: 2px;
    position: fixed;
    overflow: hidden;
    left: 34px;
    bottom: 8px;
    background: var(--dark-background-150, #1e1f1f);
    border-radius: 50%;
    z-index: 2;
    display: flex;
  }
`;var Qi=function(a,e,t,n){var o=arguments.length,i=o<3?e:n===null?n=Object.getOwnPropertyDescriptor(e,t):n,r;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")i=Reflect.decorate(a,e,t,n);else for(var s=a.length-1;s>=0;s--)(r=a[s])&&(i=(o<3?r(i):o>3?r(e,t,i):r(e,t))||i);return o>3&&i&&Object.defineProperty(e,t,i),i};const Ft=4;let mt=class extends w{constructor(){super(...arguments),this.walletImages=[]}render(){const e=this.walletImages.length<Ft;return l`${this.walletImages.slice(0,Ft).map(({src:t,walletName:n})=>l`
            <wui-wallet-image
              size="inherit"
              imageSrc=${t}
              name=${p(n)}
            ></wui-wallet-image>
          `)}
      ${e?[...Array(Ft-this.walletImages.length)].map(()=>l` <wui-wallet-image size="inherit" name=""></wui-wallet-image>`):null}
      <wui-flex>
        <wui-icon-box
          size="xxs"
          iconSize="xxs"
          iconcolor="success-100"
          backgroundcolor="success-100"
          icon="checkmark"
          background="opaque"
        ></wui-icon-box>
      </wui-flex>`}};mt.styles=[I,lo];Qi([c({type:Array})],mt.prototype,"walletImages",void 0);mt=Qi([h("wui-all-wallets-image")],mt);const co=x`
  button {
    column-gap: var(--wui-spacing-s);
    padding: 7px var(--wui-spacing-l) 7px var(--wui-spacing-xs);
    width: 100%;
    background-color: var(--wui-color-gray-glass-002);
    border-radius: var(--wui-border-radius-xs);
    color: var(--wui-color-fg-100);
  }

  button > wui-text:nth-child(2) {
    display: flex;
    flex: 1;
  }

  button:disabled {
    background-color: var(--wui-color-gray-glass-015);
    color: var(--wui-color-gray-glass-015);
  }

  button:disabled > wui-tag {
    background-color: var(--wui-color-gray-glass-010);
    color: var(--wui-color-fg-300);
  }

  wui-icon {
    color: var(--wui-color-fg-200) !important;
  }
`;var M=function(a,e,t,n){var o=arguments.length,i=o<3?e:n===null?n=Object.getOwnPropertyDescriptor(e,t):n,r;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")i=Reflect.decorate(a,e,t,n);else for(var s=a.length-1;s>=0;s--)(r=a[s])&&(i=(o<3?r(i):o>3?r(e,t,i):r(e,t))||i);return o>3&&i&&Object.defineProperty(e,t,i),i};let O=class extends w{constructor(){super(...arguments),this.walletImages=[],this.imageSrc="",this.name="",this.tabIdx=void 0,this.installed=!1,this.disabled=!1,this.showAllWallets=!1,this.loading=!1,this.loadingSpinnerColor="accent-100"}render(){return l`
      <button ?disabled=${this.disabled} tabindex=${p(this.tabIdx)}>
        ${this.templateAllWallets()} ${this.templateWalletImage()}
        <wui-text variant="paragraph-500" color="inherit">${this.name}</wui-text>
        ${this.templateStatus()}
      </button>
    `}templateAllWallets(){return this.showAllWallets&&this.imageSrc?l` <wui-all-wallets-image .imageeSrc=${this.imageSrc}> </wui-all-wallets-image> `:this.showAllWallets&&this.walletIcon?l` <wui-wallet-image .walletIcon=${this.walletIcon} size="sm"> </wui-wallet-image> `:null}templateWalletImage(){return!this.showAllWallets&&this.imageSrc?l`<wui-wallet-image
        size="sm"
        imageSrc=${this.imageSrc}
        name=${this.name}
        .installed=${this.installed}
      ></wui-wallet-image>`:!this.showAllWallets&&!this.imageSrc?l`<wui-wallet-image size="sm" name=${this.name}></wui-wallet-image>`:null}templateStatus(){return this.loading?l`<wui-loading-spinner
        size="lg"
        color=${this.loadingSpinnerColor}
      ></wui-loading-spinner>`:this.tagLabel&&this.tagVariant?l`<wui-tag variant=${this.tagVariant}>${this.tagLabel}</wui-tag>`:this.icon?l`<wui-icon color="inherit" size="sm" name=${this.icon}></wui-icon>`:null}};O.styles=[I,T,co];M([c({type:Array})],O.prototype,"walletImages",void 0);M([c()],O.prototype,"imageSrc",void 0);M([c()],O.prototype,"name",void 0);M([c()],O.prototype,"tagLabel",void 0);M([c()],O.prototype,"tagVariant",void 0);M([c()],O.prototype,"icon",void 0);M([c()],O.prototype,"walletIcon",void 0);M([c()],O.prototype,"tabIdx",void 0);M([c({type:Boolean})],O.prototype,"installed",void 0);M([c({type:Boolean})],O.prototype,"disabled",void 0);M([c({type:Boolean})],O.prototype,"showAllWallets",void 0);M([c({type:Boolean})],O.prototype,"loading",void 0);M([c({type:String})],O.prototype,"loadingSpinnerColor",void 0);O=M([h("wui-list-wallet")],O);var Me=function(a,e,t,n){var o=arguments.length,i=o<3?e:n===null?n=Object.getOwnPropertyDescriptor(e,t):n,r;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")i=Reflect.decorate(a,e,t,n);else for(var s=a.length-1;s>=0;s--)(r=a[s])&&(i=(o<3?r(i):o>3?r(e,t,i):r(e,t))||i);return o>3&&i&&Object.defineProperty(e,t,i),i};let Ce=class extends w{constructor(){super(),this.unsubscribe=[],this.tabIdx=void 0,this.connectors=b.state.connectors,this.count=S.state.count,this.filteredCount=S.state.filteredWallets.length,this.isFetchingRecommendedWallets=S.state.isFetchingRecommendedWallets,this.unsubscribe.push(b.subscribeKey("connectors",e=>this.connectors=e),S.subscribeKey("count",e=>this.count=e),S.subscribeKey("filteredWallets",e=>this.filteredCount=e.length),S.subscribeKey("isFetchingRecommendedWallets",e=>this.isFetchingRecommendedWallets=e))}disconnectedCallback(){this.unsubscribe.forEach(e=>e())}render(){const e=this.connectors.find(y=>y.id==="walletConnect"),{allWallets:t}=v.state;if(!e||t==="HIDE"||t==="ONLY_MOBILE"&&!f.isMobile())return null;const n=S.state.featured.length,o=this.count+n,i=o<10?o:Math.floor(o/10)*10,r=this.filteredCount>0?this.filteredCount:i;let s=`${r}`;return this.filteredCount>0?s=`${this.filteredCount}`:r<o&&(s=`${r}+`),l`
      <wui-list-wallet
        name="All Wallets"
        walletIcon="allWallets"
        showAllWallets
        @click=${this.onAllWallets.bind(this)}
        tagLabel=${s}
        tagVariant="shade"
        data-testid="all-wallets"
        tabIdx=${p(this.tabIdx)}
        .loading=${this.isFetchingRecommendedWallets}
        loadingSpinnerColor=${this.isFetchingRecommendedWallets?"fg-300":"accent-100"}
      ></wui-list-wallet>
    `}onAllWallets(){k.sendEvent({type:"track",event:"CLICK_ALL_WALLETS"}),g.push("AllWallets")}};Me([c()],Ce.prototype,"tabIdx",void 0);Me([u()],Ce.prototype,"connectors",void 0);Me([u()],Ce.prototype,"count",void 0);Me([u()],Ce.prototype,"filteredCount",void 0);Me([u()],Ce.prototype,"isFetchingRecommendedWallets",void 0);Ce=Me([h("w3m-all-wallets-widget")],Ce);var pi=function(a,e,t,n){var o=arguments.length,i=o<3?e:n===null?n=Object.getOwnPropertyDescriptor(e,t):n,r;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")i=Reflect.decorate(a,e,t,n);else for(var s=a.length-1;s>=0;s--)(r=a[s])&&(i=(o<3?r(i):o>3?r(e,t,i):r(e,t))||i);return o>3&&i&&Object.defineProperty(e,t,i),i};let gt=class extends w{constructor(){super(),this.unsubscribe=[],this.tabIdx=void 0,this.connectors=b.state.connectors,this.unsubscribe.push(b.subscribeKey("connectors",e=>this.connectors=e))}disconnectedCallback(){this.unsubscribe.forEach(e=>e())}render(){const e=this.connectors.filter(t=>t.type==="ANNOUNCED");return e!=null&&e.length?l`
      <wui-flex flexDirection="column" gap="xs">
        ${e.filter(He.showConnector).map(t=>l`
              <wui-list-wallet
                imageSrc=${p($.getConnectorImage(t))}
                name=${t.name??"Unknown"}
                @click=${()=>this.onConnector(t)}
                tagVariant="success"
                tagLabel="installed"
                data-testid=${`wallet-selector-${t.id}`}
                .installed=${!0}
                tabIdx=${p(this.tabIdx)}
              >
              </wui-list-wallet>
            `)}
      </wui-flex>
    `:(this.style.cssText="display: none",null)}onConnector(e){e.id==="walletConnect"?f.isMobile()?g.push("AllWallets"):g.push("ConnectingWalletConnect"):g.push("ConnectingExternal",{connector:e})}};pi([c()],gt.prototype,"tabIdx",void 0);pi([u()],gt.prototype,"connectors",void 0);gt=pi([h("w3m-connect-announced-widget")],gt);var Lt=function(a,e,t,n){var o=arguments.length,i=o<3?e:n===null?n=Object.getOwnPropertyDescriptor(e,t):n,r;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")i=Reflect.decorate(a,e,t,n);else for(var s=a.length-1;s>=0;s--)(r=a[s])&&(i=(o<3?r(i):o>3?r(e,t,i):r(e,t))||i);return o>3&&i&&Object.defineProperty(e,t,i),i};let Je=class extends w{constructor(){super(),this.unsubscribe=[],this.tabIdx=void 0,this.connectors=b.state.connectors,this.loading=!1,this.unsubscribe.push(b.subscribeKey("connectors",e=>this.connectors=e)),f.isTelegram()&&f.isIos()&&(this.loading=!C.state.wcUri,this.unsubscribe.push(C.subscribeKey("wcUri",e=>this.loading=!e)))}disconnectedCallback(){this.unsubscribe.forEach(e=>e())}render(){const{customWallets:e}=v.state;if(!(e!=null&&e.length))return this.style.cssText="display: none",null;const t=this.filterOutDuplicateWallets(e);return l`<wui-flex flexDirection="column" gap="xs">
      ${t.map(n=>l`
          <wui-list-wallet
            imageSrc=${p($.getWalletImage(n))}
            name=${n.name??"Unknown"}
            @click=${()=>this.onConnectWallet(n)}
            data-testid=${`wallet-selector-${n.id}`}
            tabIdx=${p(this.tabIdx)}
            ?loading=${this.loading}
          >
          </wui-list-wallet>
        `)}
    </wui-flex>`}filterOutDuplicateWallets(e){const t=be.getRecentWallets(),n=this.connectors.map(s=>{var y;return(y=s.info)==null?void 0:y.rdns}).filter(Boolean),o=t.map(s=>s.rdns).filter(Boolean),i=n.concat(o);if(i.includes("io.metamask.mobile")&&f.isMobile()){const s=i.indexOf("io.metamask.mobile");i[s]="io.metamask"}return e.filter(s=>!i.includes(String(s==null?void 0:s.rdns)))}onConnectWallet(e){this.loading||g.push("ConnectingWalletConnect",{wallet:e})}};Lt([c()],Je.prototype,"tabIdx",void 0);Lt([u()],Je.prototype,"connectors",void 0);Lt([u()],Je.prototype,"loading",void 0);Je=Lt([h("w3m-connect-custom-widget")],Je);var hi=function(a,e,t,n){var o=arguments.length,i=o<3?e:n===null?n=Object.getOwnPropertyDescriptor(e,t):n,r;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")i=Reflect.decorate(a,e,t,n);else for(var s=a.length-1;s>=0;s--)(r=a[s])&&(i=(o<3?r(i):o>3?r(e,t,i):r(e,t))||i);return o>3&&i&&Object.defineProperty(e,t,i),i};let bt=class extends w{constructor(){super(),this.unsubscribe=[],this.tabIdx=void 0,this.connectors=b.state.connectors,this.unsubscribe.push(b.subscribeKey("connectors",e=>this.connectors=e))}disconnectedCallback(){this.unsubscribe.forEach(e=>e())}render(){const n=this.connectors.filter(o=>o.type==="EXTERNAL").filter(He.showConnector).filter(o=>o.id!==_.CONNECTOR_ID.COINBASE_SDK);return n!=null&&n.length?l`
      <wui-flex flexDirection="column" gap="xs">
        ${n.map(o=>l`
            <wui-list-wallet
              imageSrc=${p($.getConnectorImage(o))}
              .installed=${!0}
              name=${o.name??"Unknown"}
              data-testid=${`wallet-selector-external-${o.id}`}
              @click=${()=>this.onConnector(o)}
              tabIdx=${p(this.tabIdx)}
            >
            </wui-list-wallet>
          `)}
      </wui-flex>
    `:(this.style.cssText="display: none",null)}onConnector(e){g.push("ConnectingExternal",{connector:e})}};hi([c()],bt.prototype,"tabIdx",void 0);hi([u()],bt.prototype,"connectors",void 0);bt=hi([h("w3m-connect-external-widget")],bt);var wi=function(a,e,t,n){var o=arguments.length,i=o<3?e:n===null?n=Object.getOwnPropertyDescriptor(e,t):n,r;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")i=Reflect.decorate(a,e,t,n);else for(var s=a.length-1;s>=0;s--)(r=a[s])&&(i=(o<3?r(i):o>3?r(e,t,i):r(e,t))||i);return o>3&&i&&Object.defineProperty(e,t,i),i};let xt=class extends w{constructor(){super(...arguments),this.tabIdx=void 0,this.wallets=[]}render(){return this.wallets.length?l`
      <wui-flex flexDirection="column" gap="xs">
        ${this.wallets.map(e=>l`
            <wui-list-wallet
              data-testid=${`wallet-selector-featured-${e.id}`}
              imageSrc=${p($.getWalletImage(e))}
              name=${e.name??"Unknown"}
              @click=${()=>this.onConnectWallet(e)}
              tabIdx=${p(this.tabIdx)}
            >
            </wui-list-wallet>
          `)}
      </wui-flex>
    `:(this.style.cssText="display: none",null)}onConnectWallet(e){b.selectWalletConnector(e)}};wi([c()],xt.prototype,"tabIdx",void 0);wi([c()],xt.prototype,"wallets",void 0);xt=wi([h("w3m-connect-featured-widget")],xt);var fi=function(a,e,t,n){var o=arguments.length,i=o<3?e:n===null?n=Object.getOwnPropertyDescriptor(e,t):n,r;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")i=Reflect.decorate(a,e,t,n);else for(var s=a.length-1;s>=0;s--)(r=a[s])&&(i=(o<3?r(i):o>3?r(e,t,i):r(e,t))||i);return o>3&&i&&Object.defineProperty(e,t,i),i};let vt=class extends w{constructor(){super(...arguments),this.tabIdx=void 0,this.connectors=[]}render(){const e=this.connectors.filter(He.showConnector);return e.length===0?(this.style.cssText="display: none",null):l`
      <wui-flex flexDirection="column" gap="xs">
        ${e.map(t=>l`
            <wui-list-wallet
              imageSrc=${p($.getConnectorImage(t))}
              .installed=${!0}
              name=${t.name??"Unknown"}
              tagVariant="success"
              tagLabel="installed"
              data-testid=${`wallet-selector-${t.id}`}
              @click=${()=>this.onConnector(t)}
              tabIdx=${p(this.tabIdx)}
            >
            </wui-list-wallet>
          `)}
      </wui-flex>
    `}onConnector(e){b.setActiveConnector(e),g.push("ConnectingExternal",{connector:e})}};fi([c()],vt.prototype,"tabIdx",void 0);fi([c()],vt.prototype,"connectors",void 0);vt=fi([h("w3m-connect-injected-widget")],vt);var mi=function(a,e,t,n){var o=arguments.length,i=o<3?e:n===null?n=Object.getOwnPropertyDescriptor(e,t):n,r;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")i=Reflect.decorate(a,e,t,n);else for(var s=a.length-1;s>=0;s--)(r=a[s])&&(i=(o<3?r(i):o>3?r(e,t,i):r(e,t))||i);return o>3&&i&&Object.defineProperty(e,t,i),i};let yt=class extends w{constructor(){super(),this.unsubscribe=[],this.tabIdx=void 0,this.connectors=b.state.connectors,this.unsubscribe.push(b.subscribeKey("connectors",e=>this.connectors=e))}disconnectedCallback(){this.unsubscribe.forEach(e=>e())}render(){const e=this.connectors.filter(t=>t.type==="MULTI_CHAIN"&&t.name!=="WalletConnect");return e!=null&&e.length?l`
      <wui-flex flexDirection="column" gap="xs">
        ${e.map(t=>l`
            <wui-list-wallet
              imageSrc=${p($.getConnectorImage(t))}
              .installed=${!0}
              name=${t.name??"Unknown"}
              tagVariant="shade"
              tagLabel="multichain"
              data-testid=${`wallet-selector-${t.id}`}
              @click=${()=>this.onConnector(t)}
              tabIdx=${p(this.tabIdx)}
            >
            </wui-list-wallet>
          `)}
      </wui-flex>
    `:(this.style.cssText="display: none",null)}onConnector(e){b.setActiveConnector(e),g.push("ConnectingMultiChain")}};mi([c()],yt.prototype,"tabIdx",void 0);mi([u()],yt.prototype,"connectors",void 0);yt=mi([h("w3m-connect-multi-chain-widget")],yt);var Ut=function(a,e,t,n){var o=arguments.length,i=o<3?e:n===null?n=Object.getOwnPropertyDescriptor(e,t):n,r;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")i=Reflect.decorate(a,e,t,n);else for(var s=a.length-1;s>=0;s--)(r=a[s])&&(i=(o<3?r(i):o>3?r(e,t,i):r(e,t))||i);return o>3&&i&&Object.defineProperty(e,t,i),i};let Ze=class extends w{constructor(){super(),this.unsubscribe=[],this.tabIdx=void 0,this.connectors=b.state.connectors,this.loading=!1,this.unsubscribe.push(b.subscribeKey("connectors",e=>this.connectors=e)),f.isTelegram()&&f.isIos()&&(this.loading=!C.state.wcUri,this.unsubscribe.push(C.subscribeKey("wcUri",e=>this.loading=!e)))}render(){const t=be.getRecentWallets().filter(n=>!Te.isExcluded(n)).filter(n=>!this.hasWalletConnector(n)).filter(n=>this.isWalletCompatibleWithCurrentChain(n));return t.length?l`
      <wui-flex flexDirection="column" gap="xs">
        ${t.map(n=>l`
            <wui-list-wallet
              imageSrc=${p($.getWalletImage(n))}
              name=${n.name??"Unknown"}
              @click=${()=>this.onConnectWallet(n)}
              tagLabel="recent"
              tagVariant="shade"
              tabIdx=${p(this.tabIdx)}
              ?loading=${this.loading}
            >
            </wui-list-wallet>
          `)}
      </wui-flex>
    `:(this.style.cssText="display: none",null)}onConnectWallet(e){this.loading||b.selectWalletConnector(e)}hasWalletConnector(e){return this.connectors.some(t=>t.id===e.id||t.name===e.name)}isWalletCompatibleWithCurrentChain(e){const t=d.state.activeChain;return t&&e.chains?e.chains.some(n=>{const o=n.split(":")[0];return t===o}):!0}};Ut([c()],Ze.prototype,"tabIdx",void 0);Ut([u()],Ze.prototype,"connectors",void 0);Ut([u()],Ze.prototype,"loading",void 0);Ze=Ut([h("w3m-connect-recent-widget")],Ze);var Bt=function(a,e,t,n){var o=arguments.length,i=o<3?e:n===null?n=Object.getOwnPropertyDescriptor(e,t):n,r;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")i=Reflect.decorate(a,e,t,n);else for(var s=a.length-1;s>=0;s--)(r=a[s])&&(i=(o<3?r(i):o>3?r(e,t,i):r(e,t))||i);return o>3&&i&&Object.defineProperty(e,t,i),i};let et=class extends w{constructor(){super(),this.unsubscribe=[],this.tabIdx=void 0,this.wallets=[],this.loading=!1,f.isTelegram()&&f.isIos()&&(this.loading=!C.state.wcUri,this.unsubscribe.push(C.subscribeKey("wcUri",e=>this.loading=!e)))}render(){const{connectors:e}=b.state,{customWallets:t,featuredWalletIds:n}=v.state,o=be.getRecentWallets(),i=e.find(E=>E.id==="walletConnect"),s=e.filter(E=>E.type==="INJECTED"||E.type==="ANNOUNCED"||E.type==="MULTI_CHAIN").filter(E=>E.name!=="Browser Wallet");if(!i)return null;if(n||t||!this.wallets.length)return this.style.cssText="display: none",null;const y=s.length+o.length,V=Math.max(0,2-y),R=Te.filterOutDuplicateWallets(this.wallets).slice(0,V);return R.length?l`
      <wui-flex flexDirection="column" gap="xs">
        ${R.map(E=>l`
            <wui-list-wallet
              imageSrc=${p($.getWalletImage(E))}
              name=${(E==null?void 0:E.name)??"Unknown"}
              @click=${()=>this.onConnectWallet(E)}
              tabIdx=${p(this.tabIdx)}
              ?loading=${this.loading}
            >
            </wui-list-wallet>
          `)}
      </wui-flex>
    `:(this.style.cssText="display: none",null)}onConnectWallet(e){if(this.loading)return;const t=b.getConnector(e.id,e.rdns);t?g.push("ConnectingExternal",{connector:t}):g.push("ConnectingWalletConnect",{wallet:e})}};Bt([c()],et.prototype,"tabIdx",void 0);Bt([c()],et.prototype,"wallets",void 0);Bt([u()],et.prototype,"loading",void 0);et=Bt([h("w3m-connect-recommended-widget")],et);var zt=function(a,e,t,n){var o=arguments.length,i=o<3?e:n===null?n=Object.getOwnPropertyDescriptor(e,t):n,r;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")i=Reflect.decorate(a,e,t,n);else for(var s=a.length-1;s>=0;s--)(r=a[s])&&(i=(o<3?r(i):o>3?r(e,t,i):r(e,t))||i);return o>3&&i&&Object.defineProperty(e,t,i),i};let tt=class extends w{constructor(){super(),this.unsubscribe=[],this.tabIdx=void 0,this.connectors=b.state.connectors,this.connectorImages=ce.state.connectorImages,this.unsubscribe.push(b.subscribeKey("connectors",e=>this.connectors=e),ce.subscribeKey("connectorImages",e=>this.connectorImages=e))}disconnectedCallback(){this.unsubscribe.forEach(e=>e())}render(){if(f.isMobile())return this.style.cssText="display: none",null;const e=this.connectors.find(n=>n.id==="walletConnect");if(!e)return this.style.cssText="display: none",null;const t=e.imageUrl||this.connectorImages[(e==null?void 0:e.imageId)??""];return l`
      <wui-list-wallet
        imageSrc=${p(t)}
        name=${e.name??"Unknown"}
        @click=${()=>this.onConnector(e)}
        tagLabel="qr code"
        tagVariant="main"
        tabIdx=${p(this.tabIdx)}
        data-testid="wallet-selector-walletconnect"
      >
      </wui-list-wallet>
    `}onConnector(e){b.setActiveConnector(e),g.push("ConnectingWalletConnect")}};zt([c()],tt.prototype,"tabIdx",void 0);zt([u()],tt.prototype,"connectors",void 0);zt([u()],tt.prototype,"connectorImages",void 0);tt=zt([h("w3m-connect-walletconnect-widget")],tt);const uo=x`
  :host {
    margin-top: var(--wui-spacing-3xs);
  }
  wui-separator {
    margin: var(--wui-spacing-m) calc(var(--wui-spacing-m) * -1) var(--wui-spacing-xs)
      calc(var(--wui-spacing-m) * -1);
    width: calc(100% + var(--wui-spacing-s) * 2);
  }
`;var st=function(a,e,t,n){var o=arguments.length,i=o<3?e:n===null?n=Object.getOwnPropertyDescriptor(e,t):n,r;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")i=Reflect.decorate(a,e,t,n);else for(var s=a.length-1;s>=0;s--)(r=a[s])&&(i=(o<3?r(i):o>3?r(e,t,i):r(e,t))||i);return o>3&&i&&Object.defineProperty(e,t,i),i};let $e=class extends w{constructor(){super(),this.unsubscribe=[],this.tabIdx=void 0,this.connectors=b.state.connectors,this.recommended=S.state.recommended,this.featured=S.state.featured,this.unsubscribe.push(b.subscribeKey("connectors",e=>this.connectors=e),S.subscribeKey("recommended",e=>this.recommended=e),S.subscribeKey("featured",e=>this.featured=e))}disconnectedCallback(){this.unsubscribe.forEach(e=>e())}render(){return l`
      <wui-flex flexDirection="column" gap="xs"> ${this.connectorListTemplate()} </wui-flex>
    `}connectorListTemplate(){const{custom:e,recent:t,announced:n,injected:o,multiChain:i,recommended:r,featured:s,external:y}=He.getConnectorsByType(this.connectors,this.recommended,this.featured);return He.getConnectorTypeOrder({custom:e,recent:t,announced:n,injected:o,multiChain:i,recommended:r,featured:s,external:y}).map(R=>{switch(R){case"injected":return l`
            ${i.length?l`<w3m-connect-multi-chain-widget
                  tabIdx=${p(this.tabIdx)}
                ></w3m-connect-multi-chain-widget>`:null}
            ${n.length?l`<w3m-connect-announced-widget
                  tabIdx=${p(this.tabIdx)}
                ></w3m-connect-announced-widget>`:null}
            ${o.length?l`<w3m-connect-injected-widget
                  .connectors=${o}
                  tabIdx=${p(this.tabIdx)}
                ></w3m-connect-injected-widget>`:null}
          `;case"walletConnect":return l`<w3m-connect-walletconnect-widget
            tabIdx=${p(this.tabIdx)}
          ></w3m-connect-walletconnect-widget>`;case"recent":return l`<w3m-connect-recent-widget
            tabIdx=${p(this.tabIdx)}
          ></w3m-connect-recent-widget>`;case"featured":return l`<w3m-connect-featured-widget
            .wallets=${s}
            tabIdx=${p(this.tabIdx)}
          ></w3m-connect-featured-widget>`;case"custom":return l`<w3m-connect-custom-widget
            tabIdx=${p(this.tabIdx)}
          ></w3m-connect-custom-widget>`;case"external":return l`<w3m-connect-external-widget
            tabIdx=${p(this.tabIdx)}
          ></w3m-connect-external-widget>`;case"recommended":return l`<w3m-connect-recommended-widget
            .wallets=${r}
            tabIdx=${p(this.tabIdx)}
          ></w3m-connect-recommended-widget>`;default:return console.warn(`Unknown connector type: ${R}`),null}})}};$e.styles=uo;st([c()],$e.prototype,"tabIdx",void 0);st([u()],$e.prototype,"connectors",void 0);st([u()],$e.prototype,"recommended",void 0);st([u()],$e.prototype,"featured",void 0);$e=st([h("w3m-connector-list")],$e);var Ji=function(a,e,t,n){var o=arguments.length,i=o<3?e:n===null?n=Object.getOwnPropertyDescriptor(e,t):n,r;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")i=Reflect.decorate(a,e,t,n);else for(var s=a.length-1;s>=0;s--)(r=a[s])&&(i=(o<3?r(i):o>3?r(e,t,i):r(e,t))||i);return o>3&&i&&Object.defineProperty(e,t,i),i};let Qt=class extends w{constructor(){super(...arguments),this.tabIdx=void 0}render(){return l`
      <wui-flex flexDirection="column" gap="xs">
        <w3m-connector-list tabIdx=${p(this.tabIdx)}></w3m-connector-list>
        <w3m-all-wallets-widget tabIdx=${p(this.tabIdx)}></w3m-all-wallets-widget>
      </wui-flex>
    `}};Ji([c()],Qt.prototype,"tabIdx",void 0);Qt=Ji([h("w3m-wallet-login-list")],Qt);const po=x`
  :host {
    --connect-scroll--top-opacity: 0;
    --connect-scroll--bottom-opacity: 0;
    --connect-mask-image: none;
  }

  .connect {
    max-height: clamp(360px, 470px, 80vh);
    scrollbar-width: none;
    overflow-y: scroll;
    overflow-x: hidden;
    transition: opacity var(--wui-ease-out-power-1) var(--wui-duration-md);
    will-change: opacity;
    mask-image: var(--connect-mask-image);
  }

  .guide {
    transition: opacity var(--wui-ease-out-power-1) var(--wui-duration-md);
    will-change: opacity;
  }

  .connect::-webkit-scrollbar {
    display: none;
  }

  .all-wallets {
    flex-flow: column;
  }

  .connect.disabled,
  .guide.disabled {
    opacity: 0.3;
    pointer-events: none;
    user-select: none;
  }

  wui-separator {
    margin: var(--wui-spacing-s) calc(var(--wui-spacing-s) * -1);
    width: calc(100% + var(--wui-spacing-s) * 2);
  }
`;var Y=function(a,e,t,n){var o=arguments.length,i=o<3?e:n===null?n=Object.getOwnPropertyDescriptor(e,t):n,r;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")i=Reflect.decorate(a,e,t,n);else for(var s=a.length-1;s>=0;s--)(r=a[s])&&(i=(o<3?r(i):o>3?r(e,t,i):r(e,t))||i);return o>3&&i&&Object.defineProperty(e,t,i),i};const ho=470;let z=class extends w{constructor(){var e,t;super(),this.unsubscribe=[],this.connectors=b.state.connectors,this.authConnector=this.connectors.find(n=>n.type==="AUTH"),this.features=v.state.features,this.remoteFeatures=v.state.remoteFeatures,this.enableWallets=v.state.enableWallets,this.noAdapters=d.state.noAdapters,this.walletGuide="get-started",this.checked=ut.state.isLegalCheckboxChecked,this.isEmailEnabled=((e=this.remoteFeatures)==null?void 0:e.email)&&!d.state.noAdapters,this.isSocialEnabled=((t=this.remoteFeatures)==null?void 0:t.socials)&&this.remoteFeatures.socials.length>0&&!d.state.noAdapters,this.isAuthEnabled=this.checkIfAuthEnabled(this.connectors),this.unsubscribe.push(b.subscribeKey("connectors",n=>{this.connectors=n,this.authConnector=this.connectors.find(o=>o.type==="AUTH"),this.isAuthEnabled=this.checkIfAuthEnabled(this.connectors)}),v.subscribeKey("features",n=>{this.features=n}),v.subscribeKey("remoteFeatures",n=>{this.remoteFeatures=n,this.setEmailAndSocialEnableCheck(this.noAdapters,this.remoteFeatures)}),v.subscribeKey("enableWallets",n=>this.enableWallets=n),d.subscribeKey("noAdapters",n=>this.setEmailAndSocialEnableCheck(n,this.remoteFeatures)),ut.subscribeKey("isLegalCheckboxChecked",n=>this.checked=n))}disconnectedCallback(){var t,n;this.unsubscribe.forEach(o=>o()),(t=this.resizeObserver)==null||t.disconnect();const e=(n=this.shadowRoot)==null?void 0:n.querySelector(".connect");e==null||e.removeEventListener("scroll",this.handleConnectListScroll.bind(this))}firstUpdated(){var t,n;const e=(t=this.shadowRoot)==null?void 0:t.querySelector(".connect");e&&(requestAnimationFrame(this.handleConnectListScroll.bind(this)),e==null||e.addEventListener("scroll",this.handleConnectListScroll.bind(this)),this.resizeObserver=new ResizeObserver(()=>{this.handleConnectListScroll()}),(n=this.resizeObserver)==null||n.observe(e),this.handleConnectListScroll())}render(){var Ke;const{termsConditionsUrl:e,privacyPolicyUrl:t}=v.state,n=(Ke=v.state.features)==null?void 0:Ke.legalCheckbox,r=!!(e||t)&&!!n&&this.walletGuide==="get-started"&&!this.checked,s={connect:!0,disabled:r},y=v.state.enableWalletGuide,V=this.enableWallets,R=this.isSocialEnabled||this.authConnector,E=r?-1:void 0;return l`
      <wui-flex flexDirection="column">
        ${this.legalCheckboxTemplate()}
        <wui-flex
          data-testid="w3m-connect-scroll-view"
          flexDirection="column"
          class=${$i(s)}
        >
          <wui-flex
            class="connect-methods"
            flexDirection="column"
            gap="s"
            .padding=${R&&V&&y&&this.walletGuide==="get-started"?["3xs","s","0","s"]:["3xs","s","s","s"]}
          >
            ${this.renderConnectMethod(E)}
          </wui-flex>
        </wui-flex>
        ${this.guideTemplate(r)}
        <w3m-legal-footer></w3m-legal-footer>
      </wui-flex>
    `}setEmailAndSocialEnableCheck(e,t){this.isEmailEnabled=(t==null?void 0:t.email)&&!e,this.isSocialEnabled=(t==null?void 0:t.socials)&&t.socials.length>0&&!e,this.remoteFeatures=t,this.noAdapters=e}checkIfAuthEnabled(e){const t=e.filter(o=>o.type===mn.CONNECTOR_TYPE_AUTH).map(o=>o.chain);return _.AUTH_CONNECTOR_SUPPORTED_CHAINS.some(o=>t.includes(o))}renderConnectMethod(e){const t=Te.getConnectOrderMethod(this.features,this.connectors);return l`${t.map((n,o)=>{switch(n){case"email":return l`${this.emailTemplate(e)} ${this.separatorTemplate(o,"email")}`;case"social":return l`${this.socialListTemplate(e)}
          ${this.separatorTemplate(o,"social")}`;case"wallet":return l`${this.walletListTemplate(e)}
          ${this.separatorTemplate(o,"wallet")}`;default:return null}})}`}checkMethodEnabled(e){switch(e){case"wallet":return this.enableWallets;case"social":return this.isSocialEnabled&&this.isAuthEnabled;case"email":return this.isEmailEnabled&&this.isAuthEnabled;default:return null}}checkIsThereNextMethod(e){const n=Te.getConnectOrderMethod(this.features,this.connectors)[e+1];return n?this.checkMethodEnabled(n)?n:this.checkIsThereNextMethod(e+1):void 0}separatorTemplate(e,t){const n=this.checkIsThereNextMethod(e),o=this.walletGuide==="explore";switch(t){case"wallet":return this.enableWallets&&n&&!o?l`<wui-separator data-testid="wui-separator" text="or"></wui-separator>`:null;case"email":{const i=n==="social";return this.isAuthEnabled&&this.isEmailEnabled&&!i&&n?l`<wui-separator
              data-testid="w3m-email-login-or-separator"
              text="or"
            ></wui-separator>`:null}case"social":{const i=n==="email";return this.isAuthEnabled&&this.isSocialEnabled&&!i&&n?l`<wui-separator data-testid="wui-separator" text="or"></wui-separator>`:null}default:return null}}emailTemplate(e){return!this.isEmailEnabled||!this.isAuthEnabled?null:l`<w3m-email-login-widget
      walletGuide=${this.walletGuide}
      tabIdx=${p(e)}
    ></w3m-email-login-widget>`}socialListTemplate(e){return!this.isSocialEnabled||!this.isAuthEnabled?null:l`<w3m-social-login-widget
      walletGuide=${this.walletGuide}
      tabIdx=${p(e)}
    ></w3m-social-login-widget>`}walletListTemplate(e){var s,y;const t=this.enableWallets,n=((s=this.features)==null?void 0:s.emailShowWallets)===!1,o=(y=this.features)==null?void 0:y.collapseWallets,i=n||o;return!t||(f.isTelegram()&&(f.isSafari()||f.isIos())&&C.connectWalletConnect().catch(V=>({})),this.walletGuide==="explore")?null:this.isAuthEnabled&&(this.isEmailEnabled||this.isSocialEnabled)&&i?l`<wui-list-button
        data-testid="w3m-collapse-wallets-button"
        tabIdx=${p(e)}
        @click=${this.onContinueWalletClick.bind(this)}
        text="Continue with a wallet"
      ></wui-list-button>`:l`<w3m-wallet-login-list tabIdx=${p(e)}></w3m-wallet-login-list>`}guideTemplate(e=!1){if(!v.state.enableWalletGuide)return null;const n={guide:!0,disabled:e},o=e?-1:void 0;return!this.authConnector&&!this.isSocialEnabled?null:l`
      ${this.walletGuide==="explore"&&!d.state.noAdapters?l`<wui-separator data-testid="wui-separator" id="explore" text="or"></wui-separator>`:null}
      <w3m-wallet-guide
        class=${$i(n)}
        tabIdx=${p(o)}
        walletGuide=${this.walletGuide}
      ></w3m-wallet-guide>
    `}legalCheckboxTemplate(){return this.walletGuide==="explore"?null:l`<w3m-legal-checkbox data-testid="w3m-legal-checkbox"></w3m-legal-checkbox>`}handleConnectListScroll(){var n;const e=(n=this.shadowRoot)==null?void 0:n.querySelector(".connect");if(!e)return;e.scrollHeight>ho?(e.style.setProperty("--connect-mask-image",`linear-gradient(
          to bottom,
          rgba(0, 0, 0, calc(1 - var(--connect-scroll--top-opacity))) 0px,
          rgba(200, 200, 200, calc(1 - var(--connect-scroll--top-opacity))) 1px,
          black 40px,
          black calc(100% - 40px),
          rgba(155, 155, 155, calc(1 - var(--connect-scroll--bottom-opacity))) calc(100% - 1px),
          rgba(0, 0, 0, calc(1 - var(--connect-scroll--bottom-opacity))) 100%
        )`),e.style.setProperty("--connect-scroll--top-opacity",ki.interpolate([0,50],[0,1],e.scrollTop).toString()),e.style.setProperty("--connect-scroll--bottom-opacity",ki.interpolate([0,50],[0,1],e.scrollHeight-e.scrollTop-e.offsetHeight).toString())):(e.style.setProperty("--connect-mask-image","none"),e.style.setProperty("--connect-scroll--top-opacity","0"),e.style.setProperty("--connect-scroll--bottom-opacity","0"))}onContinueWalletClick(){g.push("ConnectWallets")}};z.styles=po;Y([u()],z.prototype,"connectors",void 0);Y([u()],z.prototype,"authConnector",void 0);Y([u()],z.prototype,"features",void 0);Y([u()],z.prototype,"remoteFeatures",void 0);Y([u()],z.prototype,"enableWallets",void 0);Y([u()],z.prototype,"noAdapters",void 0);Y([c()],z.prototype,"walletGuide",void 0);Y([u()],z.prototype,"checked",void 0);Y([u()],z.prototype,"isEmailEnabled",void 0);Y([u()],z.prototype,"isSocialEnabled",void 0);Y([u()],z.prototype,"isAuthEnabled",void 0);z=Y([h("w3m-connect-view")],z);const wo=x`
  wui-flex {
    width: 100%;
    background-color: var(--wui-color-gray-glass-002);
    border-radius: var(--wui-border-radius-xs);
  }
`;var Mt=function(a,e,t,n){var o=arguments.length,i=o<3?e:n===null?n=Object.getOwnPropertyDescriptor(e,t):n,r;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")i=Reflect.decorate(a,e,t,n);else for(var s=a.length-1;s>=0;s--)(r=a[s])&&(i=(o<3?r(i):o>3?r(e,t,i):r(e,t))||i);return o>3&&i&&Object.defineProperty(e,t,i),i};let je=class extends w{constructor(){super(...arguments),this.disabled=!1,this.label="",this.buttonLabel=""}render(){return l`
      <wui-flex
        justifyContent="space-between"
        alignItems="center"
        .padding=${["1xs","2l","1xs","2l"]}
      >
        <wui-text variant="paragraph-500" color="fg-200">${this.label}</wui-text>
        <wui-chip-button size="sm" variant="shade" text=${this.buttonLabel} icon="chevronRight">
        </wui-chip-button>
      </wui-flex>
    `}};je.styles=[I,T,wo];Mt([c({type:Boolean})],je.prototype,"disabled",void 0);Mt([c()],je.prototype,"label",void 0);Mt([c()],je.prototype,"buttonLabel",void 0);je=Mt([h("wui-cta-button")],je);const fo=x`
  :host {
    display: block;
    padding: 0 var(--wui-spacing-xl) var(--wui-spacing-xl);
  }
`;var Zi=function(a,e,t,n){var o=arguments.length,i=o<3?e:n===null?n=Object.getOwnPropertyDescriptor(e,t):n,r;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")i=Reflect.decorate(a,e,t,n);else for(var s=a.length-1;s>=0;s--)(r=a[s])&&(i=(o<3?r(i):o>3?r(e,t,i):r(e,t))||i);return o>3&&i&&Object.defineProperty(e,t,i),i};let Ct=class extends w{constructor(){super(...arguments),this.wallet=void 0}render(){if(!this.wallet)return this.style.display="none",null;const{name:e,app_store:t,play_store:n,chrome_store:o,homepage:i}=this.wallet,r=f.isMobile(),s=f.isIos(),y=f.isAndroid(),V=[t,n,i,o].filter(Boolean).length>1,R=A.getTruncateString({string:e,charsStart:12,charsEnd:0,truncate:"end"});return V&&!r?l`
        <wui-cta-button
          label=${`Don't have ${R}?`}
          buttonLabel="Get"
          @click=${()=>g.push("Downloads",{wallet:this.wallet})}
        ></wui-cta-button>
      `:!V&&i?l`
        <wui-cta-button
          label=${`Don't have ${R}?`}
          buttonLabel="Get"
          @click=${this.onHomePage.bind(this)}
        ></wui-cta-button>
      `:t&&s?l`
        <wui-cta-button
          label=${`Don't have ${R}?`}
          buttonLabel="Get"
          @click=${this.onAppStore.bind(this)}
        ></wui-cta-button>
      `:n&&y?l`
        <wui-cta-button
          label=${`Don't have ${R}?`}
          buttonLabel="Get"
          @click=${this.onPlayStore.bind(this)}
        ></wui-cta-button>
      `:(this.style.display="none",null)}onAppStore(){var e;(e=this.wallet)!=null&&e.app_store&&f.openHref(this.wallet.app_store,"_blank")}onPlayStore(){var e;(e=this.wallet)!=null&&e.play_store&&f.openHref(this.wallet.play_store,"_blank")}onHomePage(){var e;(e=this.wallet)!=null&&e.homepage&&f.openHref(this.wallet.homepage,"_blank")}};Ct.styles=[fo];Zi([c({type:Object})],Ct.prototype,"wallet",void 0);Ct=Zi([h("w3m-mobile-download-links")],Ct);const mo=x`
  @keyframes shake {
    0% {
      transform: translateX(0);
    }
    25% {
      transform: translateX(3px);
    }
    50% {
      transform: translateX(-3px);
    }
    75% {
      transform: translateX(3px);
    }
    100% {
      transform: translateX(0);
    }
  }

  wui-flex:first-child:not(:only-child) {
    position: relative;
  }

  wui-loading-thumbnail {
    position: absolute;
  }

  wui-icon-box {
    position: absolute;
    right: calc(var(--wui-spacing-3xs) * -1);
    bottom: calc(var(--wui-spacing-3xs) * -1);
    opacity: 0;
    transform: scale(0.5);
    transition-property: opacity, transform;
    transition-duration: var(--wui-duration-lg);
    transition-timing-function: var(--wui-ease-out-power-2);
    will-change: opacity, transform;
  }

  wui-text[align='center'] {
    width: 100%;
    padding: 0px var(--wui-spacing-l);
  }

  [data-error='true'] wui-icon-box {
    opacity: 1;
    transform: scale(1);
  }

  [data-error='true'] > wui-flex:first-child {
    animation: shake 250ms cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
  }

  [data-retry='false'] wui-link {
    display: none;
  }

  [data-retry='true'] wui-link {
    display: block;
    opacity: 1;
  }
`;var re=function(a,e,t,n){var o=arguments.length,i=o<3?e:n===null?n=Object.getOwnPropertyDescriptor(e,t):n,r;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")i=Reflect.decorate(a,e,t,n);else for(var s=a.length-1;s>=0;s--)(r=a[s])&&(i=(o<3?r(i):o>3?r(e,t,i):r(e,t))||i);return o>3&&i&&Object.defineProperty(e,t,i),i};class N extends w{constructor(){var e,t,n,o,i;super(),this.wallet=(e=g.state.data)==null?void 0:e.wallet,this.connector=(t=g.state.data)==null?void 0:t.connector,this.timeout=void 0,this.secondaryBtnIcon="refresh",this.onConnect=void 0,this.onRender=void 0,this.onAutoConnect=void 0,this.isWalletConnect=!0,this.unsubscribe=[],this.imageSrc=$.getWalletImage(this.wallet)??$.getConnectorImage(this.connector),this.name=((n=this.wallet)==null?void 0:n.name)??((o=this.connector)==null?void 0:o.name)??"Wallet",this.isRetrying=!1,this.uri=C.state.wcUri,this.error=C.state.wcError,this.ready=!1,this.showRetry=!1,this.secondaryBtnLabel="Try again",this.secondaryLabel="Accept connection request in the wallet",this.isLoading=!1,this.isMobile=!1,this.onRetry=void 0,this.unsubscribe.push(C.subscribeKey("wcUri",r=>{var s;this.uri=r,this.isRetrying&&this.onRetry&&(this.isRetrying=!1,(s=this.onConnect)==null||s.call(this))}),C.subscribeKey("wcError",r=>this.error=r)),(f.isTelegram()||f.isSafari())&&f.isIos()&&C.state.wcUri&&((i=this.onConnect)==null||i.call(this))}firstUpdated(){var e;(e=this.onAutoConnect)==null||e.call(this),this.showRetry=!this.onAutoConnect}disconnectedCallback(){this.unsubscribe.forEach(e=>e()),C.setWcError(!1),clearTimeout(this.timeout)}render(){var n;(n=this.onRender)==null||n.call(this),this.onShowRetry();const e=this.error?"Connection can be declined if a previous request is still active":this.secondaryLabel;let t=`Continue in ${this.name}`;return this.error&&(t="Connection declined"),l`
      <wui-flex
        data-error=${p(this.error)}
        data-retry=${this.showRetry}
        flexDirection="column"
        alignItems="center"
        .padding=${["3xl","xl","xl","xl"]}
        gap="xl"
      >
        <wui-flex justifyContent="center" alignItems="center">
          <wui-wallet-image size="lg" imageSrc=${p(this.imageSrc)}></wui-wallet-image>

          ${this.error?null:this.loaderTemplate()}

          <wui-icon-box
            backgroundColor="error-100"
            background="opaque"
            iconColor="error-100"
            icon="close"
            size="sm"
            border
            borderColor="wui-color-bg-125"
          ></wui-icon-box>
        </wui-flex>

        <wui-flex flexDirection="column" alignItems="center" gap="xs">
          <wui-text variant="paragraph-500" color=${this.error?"error-100":"fg-100"}>
            ${t}
          </wui-text>
          <wui-text align="center" variant="small-500" color="fg-200">${e}</wui-text>
        </wui-flex>

        ${this.secondaryBtnLabel?l`
              <wui-button
                variant="accent"
                size="md"
                ?disabled=${this.isRetrying||this.isLoading}
                @click=${this.onTryAgain.bind(this)}
                data-testid="w3m-connecting-widget-secondary-button"
              >
                <wui-icon color="inherit" slot="iconLeft" name=${this.secondaryBtnIcon}></wui-icon>
                ${this.secondaryBtnLabel}
              </wui-button>
            `:null}
      </wui-flex>

      ${this.isWalletConnect?l`
            <wui-flex .padding=${["0","xl","xl","xl"]} justifyContent="center">
              <wui-link @click=${this.onCopyUri} color="fg-200" data-testid="wui-link-copy">
                <wui-icon size="xs" color="fg-200" slot="iconLeft" name="copy"></wui-icon>
                Copy link
              </wui-link>
            </wui-flex>
          `:null}

      <w3m-mobile-download-links .wallet=${this.wallet}></w3m-mobile-download-links>
    `}onShowRetry(){var e;if(this.error&&!this.showRetry){this.showRetry=!0;const t=(e=this.shadowRoot)==null?void 0:e.querySelector("wui-button");t==null||t.animate([{opacity:0},{opacity:1}],{fill:"forwards",easing:"ease"})}}onTryAgain(){var e,t;C.setWcError(!1),this.onRetry?(this.isRetrying=!0,(e=this.onRetry)==null||e.call(this)):(t=this.onConnect)==null||t.call(this)}loaderTemplate(){const e=Kt.state.themeVariables["--w3m-border-radius-master"],t=e?parseInt(e.replace("px",""),10):4;return l`<wui-loading-thumbnail radius=${t*9}></wui-loading-thumbnail>`}onCopyUri(){try{this.uri&&(f.copyToClopboard(this.uri),P.showSuccess("Link copied"))}catch{P.showError("Failed to copy")}}}N.styles=mo;re([u()],N.prototype,"isRetrying",void 0);re([u()],N.prototype,"uri",void 0);re([u()],N.prototype,"error",void 0);re([u()],N.prototype,"ready",void 0);re([u()],N.prototype,"showRetry",void 0);re([u()],N.prototype,"secondaryBtnLabel",void 0);re([u()],N.prototype,"secondaryLabel",void 0);re([u()],N.prototype,"isLoading",void 0);re([c({type:Boolean})],N.prototype,"isMobile",void 0);re([c()],N.prototype,"onRetry",void 0);var go=function(a,e,t,n){var o=arguments.length,i=o<3?e:n===null?n=Object.getOwnPropertyDescriptor(e,t):n,r;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")i=Reflect.decorate(a,e,t,n);else for(var s=a.length-1;s>=0;s--)(r=a[s])&&(i=(o<3?r(i):o>3?r(e,t,i):r(e,t))||i);return o>3&&i&&Object.defineProperty(e,t,i),i};let ji=class extends N{constructor(){if(super(),this.externalViewUnsubscribe=[],!this.connector)throw new Error("w3m-connecting-view: No connector provided");k.sendEvent({type:"track",event:"SELECT_WALLET",properties:{name:this.connector.name??"Unknown",platform:"browser"}}),this.onConnect=this.onConnectProxy.bind(this),this.onAutoConnect=this.onConnectProxy.bind(this),this.isWalletConnect=!1,this.externalViewUnsubscribe.push(d.subscribeKey("activeCaipAddress",e=>{e&&W.close()}))}disconnectedCallback(){this.externalViewUnsubscribe.forEach(e=>e())}async onConnectProxy(){try{this.error=!1,this.connector&&(this.connector.id!==_.CONNECTOR_ID.COINBASE_SDK||!this.error)&&(await C.connectExternal(this.connector,this.connector.chain),k.sendEvent({type:"track",event:"CONNECT_SUCCESS",properties:{method:"browser",name:this.connector.name||"Unknown"}}))}catch(e){k.sendEvent({type:"track",event:"CONNECT_ERROR",properties:{message:(e==null?void 0:e.message)??"Unknown"}}),this.error=!0}}};ji=go([h("w3m-connecting-external-view")],ji);const bo=x`
  wui-flex,
  wui-list-wallet {
    width: 100%;
  }
`;var en=function(a,e,t,n){var o=arguments.length,i=o<3?e:n===null?n=Object.getOwnPropertyDescriptor(e,t):n,r;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")i=Reflect.decorate(a,e,t,n);else for(var s=a.length-1;s>=0;s--)(r=a[s])&&(i=(o<3?r(i):o>3?r(e,t,i):r(e,t))||i);return o>3&&i&&Object.defineProperty(e,t,i),i};let $t=class extends w{constructor(){super(),this.unsubscribe=[],this.activeConnector=b.state.activeConnector,this.unsubscribe.push(b.subscribeKey("activeConnector",e=>this.activeConnector=e))}disconnectedCallback(){this.unsubscribe.forEach(e=>e())}render(){var e;return l`
      <wui-flex
        flexDirection="column"
        alignItems="center"
        .padding=${["m","xl","xl","xl"]}
        gap="xl"
      >
        <wui-flex justifyContent="center" alignItems="center">
          <wui-wallet-image
            size="lg"
            imageSrc=${p($.getConnectorImage(this.activeConnector))}
          ></wui-wallet-image>
        </wui-flex>
        <wui-flex
          flexDirection="column"
          alignItems="center"
          gap="xs"
          .padding=${["0","s","0","s"]}
        >
          <wui-text variant="paragraph-500" color="fg-100">
            Select Chain for ${(e=this.activeConnector)==null?void 0:e.name}
          </wui-text>
          <wui-text align="center" variant="small-500" color="fg-200"
            >Select which chain to connect to your multi chain wallet</wui-text
          >
        </wui-flex>
        <wui-flex
          flexGrow="1"
          flexDirection="column"
          alignItems="center"
          gap="xs"
          .padding=${["xs","0","xs","0"]}
        >
          ${this.networksTemplate()}
        </wui-flex>
      </wui-flex>
    `}networksTemplate(){var e,t;return(t=(e=this.activeConnector)==null?void 0:e.connectors)==null?void 0:t.map(n=>n.name?l`
            <wui-list-wallet
              imageSrc=${p($.getChainImage(n.chain))}
              name=${_.CHAIN_NAME_MAP[n.chain]}
              @click=${()=>this.onConnector(n)}
              data-testid="wui-list-chain-${n.chain}"
            ></wui-list-wallet>
          `:null)}onConnector(e){var n,o;const t=(o=(n=this.activeConnector)==null?void 0:n.connectors)==null?void 0:o.find(i=>i.chain===e.chain);if(!t){P.showError("Failed to find connector");return}t.id==="walletConnect"?f.isMobile()?g.push("AllWallets"):g.push("ConnectingWalletConnect"):g.push("ConnectingExternal",{connector:t})}};$t.styles=bo;en([u()],$t.prototype,"activeConnector",void 0);$t=en([h("w3m-connecting-multi-chain-view")],$t);var gi=function(a,e,t,n){var o=arguments.length,i=o<3?e:n===null?n=Object.getOwnPropertyDescriptor(e,t):n,r;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")i=Reflect.decorate(a,e,t,n);else for(var s=a.length-1;s>=0;s--)(r=a[s])&&(i=(o<3?r(i):o>3?r(e,t,i):r(e,t))||i);return o>3&&i&&Object.defineProperty(e,t,i),i};let kt=class extends w{constructor(){super(...arguments),this.platformTabs=[],this.unsubscribe=[],this.platforms=[],this.onSelectPlatfrom=void 0}disconnectCallback(){this.unsubscribe.forEach(e=>e())}render(){const e=this.generateTabs();return l`
      <wui-flex justifyContent="center" .padding=${["0","0","l","0"]}>
        <wui-tabs .tabs=${e} .onTabChange=${this.onTabChange.bind(this)}></wui-tabs>
      </wui-flex>
    `}generateTabs(){const e=this.platforms.map(t=>t==="browser"?{label:"Browser",icon:"extension",platform:"browser"}:t==="mobile"?{label:"Mobile",icon:"mobile",platform:"mobile"}:t==="qrcode"?{label:"Mobile",icon:"mobile",platform:"qrcode"}:t==="web"?{label:"Webapp",icon:"browser",platform:"web"}:t==="desktop"?{label:"Desktop",icon:"desktop",platform:"desktop"}:{label:"Browser",icon:"extension",platform:"unsupported"});return this.platformTabs=e.map(({platform:t})=>t),e}onTabChange(e){var n;const t=this.platformTabs[e];t&&((n=this.onSelectPlatfrom)==null||n.call(this,t))}};gi([c({type:Array})],kt.prototype,"platforms",void 0);gi([c()],kt.prototype,"onSelectPlatfrom",void 0);kt=gi([h("w3m-connecting-header")],kt);var xo=function(a,e,t,n){var o=arguments.length,i=o<3?e:n===null?n=Object.getOwnPropertyDescriptor(e,t):n,r;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")i=Reflect.decorate(a,e,t,n);else for(var s=a.length-1;s>=0;s--)(r=a[s])&&(i=(o<3?r(i):o>3?r(e,t,i):r(e,t))||i);return o>3&&i&&Object.defineProperty(e,t,i),i};let Di=class extends N{constructor(){if(super(),!this.wallet)throw new Error("w3m-connecting-wc-browser: No wallet provided");this.onConnect=this.onConnectProxy.bind(this),this.onAutoConnect=this.onConnectProxy.bind(this),k.sendEvent({type:"track",event:"SELECT_WALLET",properties:{name:this.wallet.name,platform:"browser"}})}async onConnectProxy(){var e;try{this.error=!1;const{connectors:t}=b.state,n=t.find(o=>{var i,r,s;return o.type==="ANNOUNCED"&&((i=o.info)==null?void 0:i.rdns)===((r=this.wallet)==null?void 0:r.rdns)||o.type==="INJECTED"||o.name===((s=this.wallet)==null?void 0:s.name)});if(n)await C.connectExternal(n,n.chain);else throw new Error("w3m-connecting-wc-browser: No connector found");W.close(),k.sendEvent({type:"track",event:"CONNECT_SUCCESS",properties:{method:"browser",name:((e=this.wallet)==null?void 0:e.name)||"Unknown"}})}catch(t){k.sendEvent({type:"track",event:"CONNECT_ERROR",properties:{message:(t==null?void 0:t.message)??"Unknown"}}),this.error=!0}}};Di=xo([h("w3m-connecting-wc-browser")],Di);var vo=function(a,e,t,n){var o=arguments.length,i=o<3?e:n===null?n=Object.getOwnPropertyDescriptor(e,t):n,r;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")i=Reflect.decorate(a,e,t,n);else for(var s=a.length-1;s>=0;s--)(r=a[s])&&(i=(o<3?r(i):o>3?r(e,t,i):r(e,t))||i);return o>3&&i&&Object.defineProperty(e,t,i),i};let Li=class extends N{constructor(){if(super(),!this.wallet)throw new Error("w3m-connecting-wc-desktop: No wallet provided");this.onConnect=this.onConnectProxy.bind(this),this.onRender=this.onRenderProxy.bind(this),k.sendEvent({type:"track",event:"SELECT_WALLET",properties:{name:this.wallet.name,platform:"desktop"}})}onRenderProxy(){var e;!this.ready&&this.uri&&(this.ready=!0,(e=this.onConnect)==null||e.call(this))}onConnectProxy(){var e;if((e=this.wallet)!=null&&e.desktop_link&&this.uri)try{this.error=!1;const{desktop_link:t,name:n}=this.wallet,{redirect:o,href:i}=f.formatNativeUrl(t,this.uri);C.setWcLinking({name:n,href:i}),C.setRecentWallet(this.wallet),f.openHref(o,"_blank")}catch{this.error=!0}}};Li=vo([h("w3m-connecting-wc-desktop")],Li);var Ve=function(a,e,t,n){var o=arguments.length,i=o<3?e:n===null?n=Object.getOwnPropertyDescriptor(e,t):n,r;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")i=Reflect.decorate(a,e,t,n);else for(var s=a.length-1;s>=0;s--)(r=a[s])&&(i=(o<3?r(i):o>3?r(e,t,i):r(e,t))||i);return o>3&&i&&Object.defineProperty(e,t,i),i};let ke=class extends N{constructor(){if(super(),this.btnLabelTimeout=void 0,this.redirectDeeplink=void 0,this.redirectUniversalLink=void 0,this.target=void 0,this.preferUniversalLinks=v.state.experimental_preferUniversalLinks,this.isLoading=!0,this.onConnect=()=>{var e;if((e=this.wallet)!=null&&e.mobile_link&&this.uri)try{this.error=!1;const{mobile_link:t,link_mode:n,name:o}=this.wallet,{redirect:i,redirectUniversalLink:r,href:s}=f.formatNativeUrl(t,this.uri,n);this.redirectDeeplink=i,this.redirectUniversalLink=r,this.target=f.isIframe()?"_top":"_self",C.setWcLinking({name:o,href:s}),C.setRecentWallet(this.wallet),this.preferUniversalLinks&&this.redirectUniversalLink?f.openHref(this.redirectUniversalLink,this.target):f.openHref(this.redirectDeeplink,this.target)}catch(t){k.sendEvent({type:"track",event:"CONNECT_PROXY_ERROR",properties:{message:t instanceof Error?t.message:"Error parsing the deeplink",uri:this.uri,mobile_link:this.wallet.mobile_link,name:this.wallet.name}}),this.error=!0}},!this.wallet)throw new Error("w3m-connecting-wc-mobile: No wallet provided");this.secondaryBtnLabel="Open",this.secondaryLabel=U.CONNECT_LABELS.MOBILE,this.secondaryBtnIcon="externalLink",this.onHandleURI(),this.unsubscribe.push(C.subscribeKey("wcUri",()=>{this.onHandleURI()})),k.sendEvent({type:"track",event:"SELECT_WALLET",properties:{name:this.wallet.name,platform:"mobile"}})}disconnectedCallback(){super.disconnectedCallback(),clearTimeout(this.btnLabelTimeout)}onHandleURI(){var e;this.isLoading=!this.uri,!this.ready&&this.uri&&(this.ready=!0,(e=this.onConnect)==null||e.call(this))}onTryAgain(){var e;C.setWcError(!1),(e=this.onConnect)==null||e.call(this)}};Ve([u()],ke.prototype,"redirectDeeplink",void 0);Ve([u()],ke.prototype,"redirectUniversalLink",void 0);Ve([u()],ke.prototype,"target",void 0);Ve([u()],ke.prototype,"preferUniversalLinks",void 0);Ve([u()],ke.prototype,"isLoading",void 0);ke=Ve([h("w3m-connecting-wc-mobile")],ke);const yo=x`
  @keyframes fadein {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  wui-shimmer {
    width: 100%;
    aspect-ratio: 1 / 1;
    border-radius: clamp(0px, var(--wui-border-radius-l), 40px) !important;
  }

  wui-qr-code {
    opacity: 0;
    animation-duration: 200ms;
    animation-timing-function: ease;
    animation-name: fadein;
    animation-fill-mode: forwards;
  }
`;var Co=function(a,e,t,n){var o=arguments.length,i=o<3?e:n===null?n=Object.getOwnPropertyDescriptor(e,t):n,r;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")i=Reflect.decorate(a,e,t,n);else for(var s=a.length-1;s>=0;s--)(r=a[s])&&(i=(o<3?r(i):o>3?r(e,t,i):r(e,t))||i);return o>3&&i&&Object.defineProperty(e,t,i),i};let Jt=class extends N{constructor(){var e;super(),this.forceUpdate=()=>{this.requestUpdate()},window.addEventListener("resize",this.forceUpdate),k.sendEvent({type:"track",event:"SELECT_WALLET",properties:{name:((e=this.wallet)==null?void 0:e.name)??"WalletConnect",platform:"qrcode"}})}disconnectedCallback(){var e;super.disconnectedCallback(),(e=this.unsubscribe)==null||e.forEach(t=>t()),window.removeEventListener("resize",this.forceUpdate)}render(){return this.onRenderProxy(),l`
      <wui-flex
        flexDirection="column"
        alignItems="center"
        .padding=${["0","xl","xl","xl"]}
        gap="xl"
      >
        <wui-shimmer borderRadius="l" width="100%"> ${this.qrCodeTemplate()} </wui-shimmer>

        <wui-text variant="paragraph-500" color="fg-100">
          Scan this QR Code with your phone
        </wui-text>
        ${this.copyTemplate()}
      </wui-flex>
      <w3m-mobile-download-links .wallet=${this.wallet}></w3m-mobile-download-links>
    `}onRenderProxy(){!this.ready&&this.uri&&(this.timeout=setTimeout(()=>{this.ready=!0},200))}qrCodeTemplate(){if(!this.uri||!this.ready)return null;const e=this.getBoundingClientRect().width-40,t=this.wallet?this.wallet.name:void 0;return C.setWcLinking(void 0),C.setRecentWallet(this.wallet),l` <wui-qr-code
      size=${e}
      theme=${Kt.state.themeMode}
      uri=${this.uri}
      imageSrc=${p($.getWalletImage(this.wallet))}
      color=${p(Kt.state.themeVariables["--w3m-qr-color"])}
      alt=${p(t)}
      data-testid="wui-qr-code"
    ></wui-qr-code>`}copyTemplate(){const e=!this.uri||!this.ready;return l`<wui-link
      .disabled=${e}
      @click=${this.onCopyUri}
      color="fg-200"
      data-testid="copy-wc2-uri"
    >
      <wui-icon size="xs" color="fg-200" slot="iconLeft" name="copy"></wui-icon>
      Copy link
    </wui-link>`}};Jt.styles=yo;Jt=Co([h("w3m-connecting-wc-qrcode")],Jt);var $o=function(a,e,t,n){var o=arguments.length,i=o<3?e:n===null?n=Object.getOwnPropertyDescriptor(e,t):n,r;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")i=Reflect.decorate(a,e,t,n);else for(var s=a.length-1;s>=0;s--)(r=a[s])&&(i=(o<3?r(i):o>3?r(e,t,i):r(e,t))||i);return o>3&&i&&Object.defineProperty(e,t,i),i};let Ui=class extends w{constructor(){var e;if(super(),this.wallet=(e=g.state.data)==null?void 0:e.wallet,!this.wallet)throw new Error("w3m-connecting-wc-unsupported: No wallet provided");k.sendEvent({type:"track",event:"SELECT_WALLET",properties:{name:this.wallet.name,platform:"browser"}})}render(){return l`
      <wui-flex
        flexDirection="column"
        alignItems="center"
        .padding=${["3xl","xl","xl","xl"]}
        gap="xl"
      >
        <wui-wallet-image
          size="lg"
          imageSrc=${p($.getWalletImage(this.wallet))}
        ></wui-wallet-image>

        <wui-text variant="paragraph-500" color="fg-100">Not Detected</wui-text>
      </wui-flex>

      <w3m-mobile-download-links .wallet=${this.wallet}></w3m-mobile-download-links>
    `}};Ui=$o([h("w3m-connecting-wc-unsupported")],Ui);var tn=function(a,e,t,n){var o=arguments.length,i=o<3?e:n===null?n=Object.getOwnPropertyDescriptor(e,t):n,r;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")i=Reflect.decorate(a,e,t,n);else for(var s=a.length-1;s>=0;s--)(r=a[s])&&(i=(o<3?r(i):o>3?r(e,t,i):r(e,t))||i);return o>3&&i&&Object.defineProperty(e,t,i),i};let Zt=class extends N{constructor(){if(super(),this.isLoading=!0,!this.wallet)throw new Error("w3m-connecting-wc-web: No wallet provided");this.onConnect=this.onConnectProxy.bind(this),this.secondaryBtnLabel="Open",this.secondaryLabel=U.CONNECT_LABELS.MOBILE,this.secondaryBtnIcon="externalLink",this.updateLoadingState(),this.unsubscribe.push(C.subscribeKey("wcUri",()=>{this.updateLoadingState()})),k.sendEvent({type:"track",event:"SELECT_WALLET",properties:{name:this.wallet.name,platform:"web"}})}updateLoadingState(){this.isLoading=!this.uri}onConnectProxy(){var e;if((e=this.wallet)!=null&&e.webapp_link&&this.uri)try{this.error=!1;const{webapp_link:t,name:n}=this.wallet,{redirect:o,href:i}=f.formatUniversalUrl(t,this.uri);C.setWcLinking({name:n,href:i}),C.setRecentWallet(this.wallet),f.openHref(o,"_blank")}catch{this.error=!0}}};tn([u()],Zt.prototype,"isLoading",void 0);Zt=tn([h("w3m-connecting-wc-web")],Zt);var lt=function(a,e,t,n){var o=arguments.length,i=o<3?e:n===null?n=Object.getOwnPropertyDescriptor(e,t):n,r;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")i=Reflect.decorate(a,e,t,n);else for(var s=a.length-1;s>=0;s--)(r=a[s])&&(i=(o<3?r(i):o>3?r(e,t,i):r(e,t))||i);return o>3&&i&&Object.defineProperty(e,t,i),i};let De=class extends w{constructor(){var e;super(),this.wallet=(e=g.state.data)==null?void 0:e.wallet,this.unsubscribe=[],this.platform=void 0,this.platforms=[],this.isSiwxEnabled=!!v.state.siwx,this.remoteFeatures=v.state.remoteFeatures,this.determinePlatforms(),this.initializeConnection(),this.unsubscribe.push(v.subscribeKey("remoteFeatures",t=>this.remoteFeatures=t))}disconnectedCallback(){this.unsubscribe.forEach(e=>e())}render(){return l`
      ${this.headerTemplate()}
      <div>${this.platformTemplate()}</div>
      ${this.reownBrandingTemplate()}
    `}reownBrandingTemplate(){var e;return(e=this.remoteFeatures)!=null&&e.reownBranding?l`<wui-ux-by-reown></wui-ux-by-reown>`:null}async initializeConnection(e=!1){if(!(this.platform==="browser"||v.state.manualWCControl&&!e))try{const{wcPairingExpiry:t,status:n}=C.state;(e||v.state.enableEmbedded||f.isPairingExpired(t)||n==="connecting")&&(await C.connectWalletConnect(),this.isSiwxEnabled||W.close())}catch(t){k.sendEvent({type:"track",event:"CONNECT_ERROR",properties:{message:(t==null?void 0:t.message)??"Unknown"}}),C.setWcError(!0),P.showError(t.message??"Connection error"),C.resetWcConnection(),g.goBack()}}determinePlatforms(){if(!this.wallet){this.platforms.push("qrcode"),this.platform="qrcode";return}if(this.platform)return;const{mobile_link:e,desktop_link:t,webapp_link:n,injected:o,rdns:i}=this.wallet,r=o==null?void 0:o.map(({injected_id:dn})=>dn).filter(Boolean),s=[...i?[i]:r??[]],y=v.state.isUniversalProvider?!1:s.length,V=e,R=n,E=C.checkInstalled(s),Ke=y&&E,un=t&&!f.isMobile();Ke&&!d.state.noAdapters&&this.platforms.push("browser"),V&&this.platforms.push(f.isMobile()?"mobile":"qrcode"),R&&this.platforms.push("web"),un&&this.platforms.push("desktop"),!Ke&&y&&!d.state.noAdapters&&this.platforms.push("unsupported"),this.platform=this.platforms[0]}platformTemplate(){switch(this.platform){case"browser":return l`<w3m-connecting-wc-browser></w3m-connecting-wc-browser>`;case"web":return l`<w3m-connecting-wc-web></w3m-connecting-wc-web>`;case"desktop":return l`
          <w3m-connecting-wc-desktop .onRetry=${()=>this.initializeConnection(!0)}>
          </w3m-connecting-wc-desktop>
        `;case"mobile":return l`
          <w3m-connecting-wc-mobile isMobile .onRetry=${()=>this.initializeConnection(!0)}>
          </w3m-connecting-wc-mobile>
        `;case"qrcode":return l`<w3m-connecting-wc-qrcode></w3m-connecting-wc-qrcode>`;default:return l`<w3m-connecting-wc-unsupported></w3m-connecting-wc-unsupported>`}}headerTemplate(){return this.platforms.length>1?l`
      <w3m-connecting-header
        .platforms=${this.platforms}
        .onSelectPlatfrom=${this.onSelectPlatform.bind(this)}
      >
      </w3m-connecting-header>
    `:null}async onSelectPlatform(e){var n;const t=(n=this.shadowRoot)==null?void 0:n.querySelector("div");t&&(await t.animate([{opacity:1},{opacity:0}],{duration:200,fill:"forwards",easing:"ease"}).finished,this.platform=e,t.animate([{opacity:0},{opacity:1}],{duration:200,fill:"forwards",easing:"ease"}))}};lt([u()],De.prototype,"platform",void 0);lt([u()],De.prototype,"platforms",void 0);lt([u()],De.prototype,"isSiwxEnabled",void 0);lt([u()],De.prototype,"remoteFeatures",void 0);De=lt([h("w3m-connecting-wc-view")],De);var nn=function(a,e,t,n){var o=arguments.length,i=o<3?e:n===null?n=Object.getOwnPropertyDescriptor(e,t):n,r;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")i=Reflect.decorate(a,e,t,n);else for(var s=a.length-1;s>=0;s--)(r=a[s])&&(i=(o<3?r(i):o>3?r(e,t,i):r(e,t))||i);return o>3&&i&&Object.defineProperty(e,t,i),i};let ei=class extends w{constructor(){super(...arguments),this.isMobile=f.isMobile()}render(){if(this.isMobile){const{featured:e,recommended:t}=S.state,{customWallets:n}=v.state,o=be.getRecentWallets(),i=e.length||t.length||(n==null?void 0:n.length)||o.length;return l`<wui-flex
        flexDirection="column"
        gap="xs"
        .margin=${["3xs","s","s","s"]}
      >
        ${i?l`<w3m-connector-list></w3m-connector-list>`:null}
        <w3m-all-wallets-widget></w3m-all-wallets-widget>
      </wui-flex>`}return l`<wui-flex flexDirection="column" .padding=${["0","0","l","0"]}>
      <w3m-connecting-wc-view></w3m-connecting-wc-view>
      <wui-flex flexDirection="column" .padding=${["0","m","0","m"]}>
        <w3m-all-wallets-widget></w3m-all-wallets-widget> </wui-flex
    ></wui-flex>`}};nn([u()],ei.prototype,"isMobile",void 0);ei=nn([h("w3m-connecting-wc-basic-view")],ei);const ko=x`
  .continue-button-container {
    width: 100%;
  }
`;var on=function(a,e,t,n){var o=arguments.length,i=o<3?e:n===null?n=Object.getOwnPropertyDescriptor(e,t):n,r;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")i=Reflect.decorate(a,e,t,n);else for(var s=a.length-1;s>=0;s--)(r=a[s])&&(i=(o<3?r(i):o>3?r(e,t,i):r(e,t))||i);return o>3&&i&&Object.defineProperty(e,t,i),i};let St=class extends w{constructor(){super(...arguments),this.loading=!1}render(){return l`
      <wui-flex
        flexDirection="column"
        alignItems="center"
        gap="xxl"
        .padding=${["0","0","l","0"]}
      >
        ${this.onboardingTemplate()} ${this.buttonsTemplate()}
        <wui-link
          @click=${()=>{f.openHref(vn.URLS.FAQ,"_blank")}}
        >
          Learn more about names
          <wui-icon color="inherit" slot="iconRight" name="externalLink"></wui-icon>
        </wui-link>
      </wui-flex>
    `}onboardingTemplate(){return l` <wui-flex
      flexDirection="column"
      gap="xxl"
      alignItems="center"
      .padding=${["0","xxl","0","xxl"]}
    >
      <wui-flex gap="s" alignItems="center" justifyContent="center">
        <wui-icon-box
          icon="id"
          size="xl"
          iconSize="xxl"
          iconColor="fg-200"
          backgroundColor="fg-200"
        ></wui-icon-box>
      </wui-flex>
      <wui-flex flexDirection="column" alignItems="center" gap="s">
        <wui-text align="center" variant="medium-600" color="fg-100">
          Choose your account name
        </wui-text>
        <wui-text align="center" variant="paragraph-400" color="fg-100">
          Finally say goodbye to 0x addresses, name your account to make it easier to exchange
          assets
        </wui-text>
      </wui-flex>
    </wui-flex>`}buttonsTemplate(){return l`<wui-flex
      .padding=${["0","2l","0","2l"]}
      gap="s"
      class="continue-button-container"
    >
      <wui-button
        fullWidth
        .loading=${this.loading}
        size="lg"
        borderRadius="xs"
        @click=${this.handleContinue.bind(this)}
        >Choose name
      </wui-button>
    </wui-flex>`}handleContinue(){var t;const e=d.state.activeChain;g.push("RegisterAccountName"),k.sendEvent({type:"track",event:"OPEN_ENS_FLOW",properties:{isSmartAccount:((t=m.state.preferredAccountTypes)==null?void 0:t[e])===F.ACCOUNT_TYPES.SMART_ACCOUNT}})}};St.styles=ko;on([u()],St.prototype,"loading",void 0);St=on([h("w3m-choose-account-name-view")],St);var So=function(a,e,t,n){var o=arguments.length,i=o<3?e:n===null?n=Object.getOwnPropertyDescriptor(e,t):n,r;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")i=Reflect.decorate(a,e,t,n);else for(var s=a.length-1;s>=0;s--)(r=a[s])&&(i=(o<3?r(i):o>3?r(e,t,i):r(e,t))||i);return o>3&&i&&Object.defineProperty(e,t,i),i};let Bi=class extends w{constructor(){var e;super(...arguments),this.wallet=(e=g.state.data)==null?void 0:e.wallet}render(){if(!this.wallet)throw new Error("w3m-downloads-view");return l`
      <wui-flex gap="xs" flexDirection="column" .padding=${["s","s","l","s"]}>
        ${this.chromeTemplate()} ${this.iosTemplate()} ${this.androidTemplate()}
        ${this.homepageTemplate()}
      </wui-flex>
    `}chromeTemplate(){var e;return(e=this.wallet)!=null&&e.chrome_store?l`<wui-list-item
      variant="icon"
      icon="chromeStore"
      iconVariant="square"
      @click=${this.onChromeStore.bind(this)}
      chevron
    >
      <wui-text variant="paragraph-500" color="fg-100">Chrome Extension</wui-text>
    </wui-list-item>`:null}iosTemplate(){var e;return(e=this.wallet)!=null&&e.app_store?l`<wui-list-item
      variant="icon"
      icon="appStore"
      iconVariant="square"
      @click=${this.onAppStore.bind(this)}
      chevron
    >
      <wui-text variant="paragraph-500" color="fg-100">iOS App</wui-text>
    </wui-list-item>`:null}androidTemplate(){var e;return(e=this.wallet)!=null&&e.play_store?l`<wui-list-item
      variant="icon"
      icon="playStore"
      iconVariant="square"
      @click=${this.onPlayStore.bind(this)}
      chevron
    >
      <wui-text variant="paragraph-500" color="fg-100">Android App</wui-text>
    </wui-list-item>`:null}homepageTemplate(){var e;return(e=this.wallet)!=null&&e.homepage?l`
      <wui-list-item
        variant="icon"
        icon="browser"
        iconVariant="square-blue"
        @click=${this.onHomePage.bind(this)}
        chevron
      >
        <wui-text variant="paragraph-500" color="fg-100">Website</wui-text>
      </wui-list-item>
    `:null}onChromeStore(){var e;(e=this.wallet)!=null&&e.chrome_store&&f.openHref(this.wallet.chrome_store,"_blank")}onAppStore(){var e;(e=this.wallet)!=null&&e.app_store&&f.openHref(this.wallet.app_store,"_blank")}onPlayStore(){var e;(e=this.wallet)!=null&&e.play_store&&f.openHref(this.wallet.play_store,"_blank")}onHomePage(){var e;(e=this.wallet)!=null&&e.homepage&&f.openHref(this.wallet.homepage,"_blank")}};Bi=So([h("w3m-downloads-view")],Bi);var _o=function(a,e,t,n){var o=arguments.length,i=o<3?e:n===null?n=Object.getOwnPropertyDescriptor(e,t):n,r;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")i=Reflect.decorate(a,e,t,n);else for(var s=a.length-1;s>=0;s--)(r=a[s])&&(i=(o<3?r(i):o>3?r(e,t,i):r(e,t))||i);return o>3&&i&&Object.defineProperty(e,t,i),i};const Io="https://walletconnect.com/explorer";let zi=class extends w{render(){return l`
      <wui-flex flexDirection="column" .padding=${["0","s","s","s"]} gap="xs">
        ${this.recommendedWalletsTemplate()}
        <wui-list-wallet
          name="Explore all"
          showAllWallets
          walletIcon="allWallets"
          icon="externalLink"
          @click=${()=>{f.openHref("https://walletconnect.com/explorer?type=wallet","_blank")}}
        ></wui-list-wallet>
      </wui-flex>
    `}recommendedWalletsTemplate(){const{recommended:e,featured:t}=S.state,{customWallets:n}=v.state;return[...t,...n??[],...e].slice(0,4).map(i=>l`
        <wui-list-wallet
          name=${i.name??"Unknown"}
          tagVariant="main"
          imageSrc=${p($.getWalletImage(i))}
          @click=${()=>{f.openHref(i.homepage??Io,"_blank")}}
        ></wui-list-wallet>
      `)}};zi=_o([h("w3m-get-wallet-view")],zi);var rn=function(a,e,t,n){var o=arguments.length,i=o<3?e:n===null?n=Object.getOwnPropertyDescriptor(e,t):n,r;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")i=Reflect.decorate(a,e,t,n);else for(var s=a.length-1;s>=0;s--)(r=a[s])&&(i=(o<3?r(i):o>3?r(e,t,i):r(e,t))||i);return o>3&&i&&Object.defineProperty(e,t,i),i};let ti=class extends w{constructor(){super(...arguments),this.data=[]}render(){return l`
      <wui-flex flexDirection="column" alignItems="center" gap="l">
        ${this.data.map(e=>l`
            <wui-flex flexDirection="column" alignItems="center" gap="xl">
              <wui-flex flexDirection="row" justifyContent="center" gap="1xs">
                ${e.images.map(t=>l`<wui-visual name=${t}></wui-visual>`)}
              </wui-flex>
            </wui-flex>
            <wui-flex flexDirection="column" alignItems="center" gap="xxs">
              <wui-text variant="paragraph-500" color="fg-100" align="center">
                ${e.title}
              </wui-text>
              <wui-text variant="small-500" color="fg-200" align="center">${e.text}</wui-text>
            </wui-flex>
          `)}
      </wui-flex>
    `}};rn([c({type:Array})],ti.prototype,"data",void 0);ti=rn([h("w3m-help-widget")],ti);var To=function(a,e,t,n){var o=arguments.length,i=o<3?e:n===null?n=Object.getOwnPropertyDescriptor(e,t):n,r;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")i=Reflect.decorate(a,e,t,n);else for(var s=a.length-1;s>=0;s--)(r=a[s])&&(i=(o<3?r(i):o>3?r(e,t,i):r(e,t))||i);return o>3&&i&&Object.defineProperty(e,t,i),i};const Ao=[{images:["login","profile","lock"],title:"One login for all of web3",text:"Log in to any app by connecting your wallet. Say goodbye to countless passwords!"},{images:["defi","nft","eth"],title:"A home for your digital assets",text:"A wallet lets you store, send and receive digital assets like cryptocurrencies and NFTs."},{images:["browser","noun","dao"],title:"Your gateway to a new web",text:"With your wallet, you can explore and interact with DeFi, NFTs, DAOs, and much more."}];let Mi=class extends w{render(){return l`
      <wui-flex
        flexDirection="column"
        .padding=${["xxl","xl","xl","xl"]}
        alignItems="center"
        gap="xl"
      >
        <w3m-help-widget .data=${Ao}></w3m-help-widget>
        <wui-button variant="main" size="md" @click=${this.onGetWallet.bind(this)}>
          <wui-icon color="inherit" slot="iconLeft" name="wallet"></wui-icon>
          Get a wallet
        </wui-button>
      </wui-flex>
    `}onGetWallet(){k.sendEvent({type:"track",event:"CLICK_GET_WALLET"}),g.push("GetWallet")}};Mi=To([h("w3m-what-is-a-wallet-view")],Mi);const Wo=x`
  wui-flex {
    max-height: clamp(360px, 540px, 80vh);
    overflow: scroll;
    scrollbar-width: none;
    transition: opacity var(--wui-ease-out-power-1) var(--wui-duration-md);
    will-change: opacity;
  }
  wui-flex::-webkit-scrollbar {
    display: none;
  }
  wui-flex.disabled {
    opacity: 0.3;
    pointer-events: none;
    user-select: none;
  }
`;var an=function(a,e,t,n){var o=arguments.length,i=o<3?e:n===null?n=Object.getOwnPropertyDescriptor(e,t):n,r;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")i=Reflect.decorate(a,e,t,n);else for(var s=a.length-1;s>=0;s--)(r=a[s])&&(i=(o<3?r(i):o>3?r(e,t,i):r(e,t))||i);return o>3&&i&&Object.defineProperty(e,t,i),i};let _t=class extends w{constructor(){super(),this.unsubscribe=[],this.checked=ut.state.isLegalCheckboxChecked,this.unsubscribe.push(ut.subscribeKey("isLegalCheckboxChecked",e=>{this.checked=e}))}disconnectedCallback(){this.unsubscribe.forEach(e=>e())}render(){var y;const{termsConditionsUrl:e,privacyPolicyUrl:t}=v.state,n=(y=v.state.features)==null?void 0:y.legalCheckbox,i=!!(e||t)&&!!n,r=i&&!this.checked,s=r?-1:void 0;return l`
      <w3m-legal-checkbox></w3m-legal-checkbox>
      <wui-flex
        flexDirection="column"
        .padding=${i?["0","s","s","s"]:"s"}
        gap="xs"
        class=${p(r?"disabled":void 0)}
      >
        <w3m-wallet-login-list tabIdx=${p(s)}></w3m-wallet-login-list>
      </wui-flex>
      <w3m-legal-footer></w3m-legal-footer>
    `}};_t.styles=Wo;an([u()],_t.prototype,"checked",void 0);_t=an([h("w3m-connect-wallets-view")],_t);const Ro=x`
  :host {
    display: block;
    width: var(--wui-box-size-lg);
    height: var(--wui-box-size-lg);
  }

  svg {
    width: var(--wui-box-size-lg);
    height: var(--wui-box-size-lg);
    fill: none;
    stroke: transparent;
    stroke-linecap: round;
  }

  use {
    stroke: var(--wui-color-accent-100);
    stroke-width: 2px;
    stroke-dasharray: 54, 118;
    stroke-dashoffset: 172;
    animation: dash 1s linear infinite;
  }

  @keyframes dash {
    to {
      stroke-dashoffset: 0px;
    }
  }
`;var Eo=function(a,e,t,n){var o=arguments.length,i=o<3?e:n===null?n=Object.getOwnPropertyDescriptor(e,t):n,r;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")i=Reflect.decorate(a,e,t,n);else for(var s=a.length-1;s>=0;s--)(r=a[s])&&(i=(o<3?r(i):o>3?r(e,t,i):r(e,t))||i);return o>3&&i&&Object.defineProperty(e,t,i),i};let ii=class extends w{render(){return l`
      <svg viewBox="0 0 54 59">
        <path
          id="wui-loader-path"
          d="M17.22 5.295c3.877-2.277 5.737-3.363 7.72-3.726a11.44 11.44 0 0 1 4.12 0c1.983.363 3.844 1.45 7.72 3.726l6.065 3.562c3.876 2.276 5.731 3.372 7.032 4.938a11.896 11.896 0 0 1 2.06 3.63c.683 1.928.688 4.11.688 8.663v7.124c0 4.553-.005 6.735-.688 8.664a11.896 11.896 0 0 1-2.06 3.63c-1.3 1.565-3.156 2.66-7.032 4.937l-6.065 3.563c-3.877 2.276-5.737 3.362-7.72 3.725a11.46 11.46 0 0 1-4.12 0c-1.983-.363-3.844-1.449-7.72-3.726l-6.065-3.562c-3.876-2.276-5.731-3.372-7.032-4.938a11.885 11.885 0 0 1-2.06-3.63c-.682-1.928-.688-4.11-.688-8.663v-7.124c0-4.553.006-6.735.688-8.664a11.885 11.885 0 0 1 2.06-3.63c1.3-1.565 3.156-2.66 7.032-4.937l6.065-3.562Z"
        />
        <use xlink:href="#wui-loader-path"></use>
      </svg>
    `}};ii.styles=[I,Ro];ii=Eo([h("wui-loading-hexagon")],ii);const No=x`
  @keyframes shake {
    0% {
      transform: translateX(0);
    }
    25% {
      transform: translateX(3px);
    }
    50% {
      transform: translateX(-3px);
    }
    75% {
      transform: translateX(3px);
    }
    100% {
      transform: translateX(0);
    }
  }

  wui-flex:first-child:not(:only-child) {
    position: relative;
  }

  wui-loading-hexagon {
    position: absolute;
  }

  wui-icon-box {
    position: absolute;
    right: 4px;
    bottom: 0;
    opacity: 0;
    transform: scale(0.5);
    z-index: 1;
  }

  wui-button {
    display: none;
  }

  [data-error='true'] wui-icon-box {
    opacity: 1;
    transform: scale(1);
  }

  [data-error='true'] > wui-flex:first-child {
    animation: shake 250ms cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
  }

  wui-button[data-retry='true'] {
    display: block;
    opacity: 1;
  }
`;var bi=function(a,e,t,n){var o=arguments.length,i=o<3?e:n===null?n=Object.getOwnPropertyDescriptor(e,t):n,r;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")i=Reflect.decorate(a,e,t,n);else for(var s=a.length-1;s>=0;s--)(r=a[s])&&(i=(o<3?r(i):o>3?r(e,t,i):r(e,t))||i);return o>3&&i&&Object.defineProperty(e,t,i),i};let it=class extends w{constructor(){var e;super(),this.network=(e=g.state.data)==null?void 0:e.network,this.unsubscribe=[],this.showRetry=!1,this.error=!1}disconnectedCallback(){this.unsubscribe.forEach(e=>e())}firstUpdated(){this.onSwitchNetwork()}render(){if(!this.network)throw new Error("w3m-network-switch-view: No network provided");this.onShowRetry();const e=this.getLabel(),t=this.getSubLabel();return l`
      <wui-flex
        data-error=${this.error}
        flexDirection="column"
        alignItems="center"
        .padding=${["3xl","xl","3xl","xl"]}
        gap="xl"
      >
        <wui-flex justifyContent="center" alignItems="center">
          <wui-network-image
            size="lg"
            imageSrc=${p($.getNetworkImage(this.network))}
          ></wui-network-image>

          ${this.error?null:l`<wui-loading-hexagon></wui-loading-hexagon>`}

          <wui-icon-box
            backgroundColor="error-100"
            background="opaque"
            iconColor="error-100"
            icon="close"
            size="sm"
            ?border=${!0}
            borderColor="wui-color-bg-125"
          ></wui-icon-box>
        </wui-flex>

        <wui-flex flexDirection="column" alignItems="center" gap="xs">
          <wui-text align="center" variant="paragraph-500" color="fg-100">${e}</wui-text>
          <wui-text align="center" variant="small-500" color="fg-200">${t}</wui-text>
        </wui-flex>

        <wui-button
          data-retry=${this.showRetry}
          variant="accent"
          size="md"
          .disabled=${!this.error}
          @click=${this.onSwitchNetwork.bind(this)}
        >
          <wui-icon color="inherit" slot="iconLeft" name="refresh"></wui-icon>
          Try again
        </wui-button>
      </wui-flex>
    `}getSubLabel(){const e=d.state.activeChain,t=b.getConnectorId(e);return b.getAuthConnector()&&t===_.CONNECTOR_ID.AUTH?"":this.error?"Switch can be declined if chain is not supported by a wallet or previous request is still active":"Accept connection request in your wallet"}getLabel(){var o;const e=d.state.activeChain,t=b.getConnectorId(e);return b.getAuthConnector()&&t===_.CONNECTOR_ID.AUTH?`Switching to ${((o=this.network)==null?void 0:o.name)??"Unknown"} network...`:this.error?"Switch declined":"Approve in wallet"}onShowRetry(){var e;if(this.error&&!this.showRetry){this.showRetry=!0;const t=(e=this.shadowRoot)==null?void 0:e.querySelector("wui-button");t==null||t.animate([{opacity:0},{opacity:1}],{fill:"forwards",easing:"ease"})}}onSwitchNetwork(){var e;try{this.error=!1,d.state.activeChain!==((e=this.network)==null?void 0:e.chainNamespace)&&d.setIsSwitchingNamespace(!0),this.network&&d.switchActiveNetwork(this.network)}catch{this.error=!0}}};it.styles=No;bi([u()],it.prototype,"showRetry",void 0);bi([u()],it.prototype,"error",void 0);it=bi([h("w3m-network-switch-view")],it);const Oo=x`
  button {
    column-gap: var(--wui-spacing-s);
    padding: 7px var(--wui-spacing-l) 7px var(--wui-spacing-xs);
    width: 100%;
    transition: all var(--wui-ease-out-power-1) var(--wui-duration-md);
    border-radius: var(--wui-border-radius-xs);
    color: var(--wui-color-fg-100);
  }

  button > wui-text:nth-child(2) {
    display: flex;
    flex: 1;
  }

  button[data-transparent='true'] {
    pointer-events: none;
    background-color: transparent;
  }

  button:hover {
    background-color: var(--wui-color-gray-glass-002);
  }

  button:active {
    background-color: var(--wui-color-gray-glass-005);
  }

  wui-image {
    width: var(--wui-spacing-3xl);
    height: var(--wui-spacing-3xl);
    border-radius: 100%;
  }

  button:disabled {
    background-color: var(--wui-color-gray-glass-002);
    opacity: 0.5;
    cursor: not-allowed;
  }

  button:disabled > wui-tag {
    background-color: var(--wui-color-gray-glass-010);
    color: var(--wui-color-fg-300);
  }
`;var Fe=function(a,e,t,n){var o=arguments.length,i=o<3?e:n===null?n=Object.getOwnPropertyDescriptor(e,t):n,r;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")i=Reflect.decorate(a,e,t,n);else for(var s=a.length-1;s>=0;s--)(r=a[s])&&(i=(o<3?r(i):o>3?r(e,t,i):r(e,t))||i);return o>3&&i&&Object.defineProperty(e,t,i),i};let he=class extends w{constructor(){super(...arguments),this.imageSrc="",this.name="",this.disabled=!1,this.selected=!1,this.transparent=!1}render(){return l`
      <button data-transparent=${this.transparent} ?disabled=${this.disabled}>
        <wui-flex gap="s" alignItems="center">
          ${this.templateNetworkImage()}
          <wui-text variant="paragraph-500" color="inherit">${this.name}</wui-text></wui-flex
        >
        ${this.checkmarkTemplate()}
      </button>
    `}checkmarkTemplate(){return this.selected?l`<wui-icon size="sm" color="accent-100" name="checkmarkBold"></wui-icon>`:null}templateNetworkImage(){return this.imageSrc?l`<wui-image size="sm" src=${this.imageSrc} name=${this.name}></wui-image>`:this.imageSrc?null:l`<wui-network-image
        ?round=${!0}
        size="md"
        name=${this.name}
      ></wui-network-image>`}};he.styles=[I,T,Oo];Fe([c()],he.prototype,"imageSrc",void 0);Fe([c()],he.prototype,"name",void 0);Fe([c({type:Boolean})],he.prototype,"disabled",void 0);Fe([c({type:Boolean})],he.prototype,"selected",void 0);Fe([c({type:Boolean})],he.prototype,"transparent",void 0);he=Fe([h("wui-list-network")],he);const Po=x`
  .container {
    max-height: 360px;
    overflow: auto;
  }

  .container::-webkit-scrollbar {
    display: none;
  }
`;var ct=function(a,e,t,n){var o=arguments.length,i=o<3?e:n===null?n=Object.getOwnPropertyDescriptor(e,t):n,r;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")i=Reflect.decorate(a,e,t,n);else for(var s=a.length-1;s>=0;s--)(r=a[s])&&(i=(o<3?r(i):o>3?r(e,t,i):r(e,t))||i);return o>3&&i&&Object.defineProperty(e,t,i),i};let Se=class extends w{constructor(){super(),this.unsubscribe=[],this.network=d.state.activeCaipNetwork,this.requestedCaipNetworks=d.getCaipNetworks(),this.search="",this.onDebouncedSearch=f.debounce(e=>{this.search=e},100),this.unsubscribe.push(ce.subscribeNetworkImages(()=>this.requestUpdate()),d.subscribeKey("activeCaipNetwork",e=>this.network=e),d.subscribe(()=>{this.requestedCaipNetworks=d.getAllRequestedCaipNetworks()}))}disconnectedCallback(){this.unsubscribe.forEach(e=>e())}render(){return l`
      ${this.templateSearchInput()}
      <wui-flex
        class="container"
        .padding=${["0","s","s","s"]}
        flexDirection="column"
        gap="xs"
      >
        ${this.networksTemplate()}
      </wui-flex>

      <wui-separator></wui-separator>

      <wui-flex padding="s" flexDirection="column" gap="m" alignItems="center">
        <wui-text variant="small-400" color="fg-300" align="center">
          Your connected wallet may not support some of the networks available for this dApp
        </wui-text>
        <wui-link @click=${this.onNetworkHelp.bind(this)}>
          <wui-icon size="xs" color="accent-100" slot="iconLeft" name="helpCircle"></wui-icon>
          What is a network
        </wui-link>
      </wui-flex>
    `}templateSearchInput(){return l`
      <wui-flex gap="xs" .padding=${["0","s","s","s"]}>
        <wui-input-text
          @inputChange=${this.onInputChange.bind(this)}
          class="network-search-input"
          size="md"
          placeholder="Search network"
          icon="search"
        ></wui-input-text>
      </wui-flex>
    `}onInputChange(e){this.onDebouncedSearch(e.detail)}onNetworkHelp(){k.sendEvent({type:"track",event:"CLICK_NETWORK_HELP"}),g.push("WhatIsANetwork")}networksTemplate(){var n;const e=d.getAllApprovedCaipNetworkIds(),t=f.sortRequestedNetworks(e,this.requestedCaipNetworks);return this.search?this.filteredNetworks=t==null?void 0:t.filter(o=>{var i;return(i=o==null?void 0:o.name)==null?void 0:i.toLowerCase().includes(this.search.toLowerCase())}):this.filteredNetworks=t,(n=this.filteredNetworks)==null?void 0:n.map(o=>{var i;return l`
        <wui-list-network
          .selected=${((i=this.network)==null?void 0:i.id)===o.id}
          imageSrc=${p($.getNetworkImage(o))}
          type="network"
          name=${o.name??o.id}
          @click=${()=>this.onSwitchNetwork(o)}
          .disabled=${this.getNetworkDisabled(o)}
          data-testid=${`w3m-network-switch-${o.name??o.id}`}
        ></wui-list-network>
      `})}getNetworkDisabled(e){const t=e.chainNamespace,n=m.getCaipAddress(t),o=d.getAllApprovedCaipNetworkIds(),i=d.getNetworkProp("supportsAllNetworks",t)!==!1,r=b.getConnectorId(t),s=b.getAuthConnector(),y=r===_.CONNECTOR_ID.AUTH&&s;return!n||i||y?!1:!(o!=null&&o.includes(e.caipNetworkId))}onSwitchNetwork(e){gn.onSwitchNetwork({network:e})}};Se.styles=Po;ct([u()],Se.prototype,"network",void 0);ct([u()],Se.prototype,"requestedCaipNetworks",void 0);ct([u()],Se.prototype,"filteredNetworks",void 0);ct([u()],Se.prototype,"search",void 0);Se=ct([h("w3m-networks-view")],Se);const jo=x`
  @keyframes shake {
    0% {
      transform: translateX(0);
    }
    25% {
      transform: translateX(3px);
    }
    50% {
      transform: translateX(-3px);
    }
    75% {
      transform: translateX(3px);
    }
    100% {
      transform: translateX(0);
    }
  }

  wui-flex:first-child:not(:only-child) {
    position: relative;
  }

  wui-loading-thumbnail {
    position: absolute;
  }

  wui-visual {
    width: var(--wui-wallet-image-size-lg);
    height: var(--wui-wallet-image-size-lg);
    border-radius: calc(var(--wui-border-radius-5xs) * 9 - var(--wui-border-radius-xxs));
    position: relative;
    overflow: hidden;
  }

  wui-visual::after {
    content: '';
    display: block;
    width: 100%;
    height: 100%;
    position: absolute;
    inset: 0;
    border-radius: calc(var(--wui-border-radius-5xs) * 9 - var(--wui-border-radius-xxs));
    box-shadow: inset 0 0 0 1px var(--wui-color-gray-glass-005);
  }

  wui-icon-box {
    position: absolute;
    right: calc(var(--wui-spacing-3xs) * -1);
    bottom: calc(var(--wui-spacing-3xs) * -1);
    opacity: 0;
    transform: scale(0.5);
    transition:
      opacity var(--wui-ease-out-power-2) var(--wui-duration-lg),
      transform var(--wui-ease-out-power-2) var(--wui-duration-lg);
    will-change: opacity, transform;
  }

  wui-text[align='center'] {
    width: 100%;
    padding: 0px var(--wui-spacing-l);
  }

  [data-error='true'] wui-icon-box {
    opacity: 1;
    transform: scale(1);
  }

  [data-error='true'] > wui-flex:first-child {
    animation: shake 250ms cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
  }

  [data-retry='false'] wui-link {
    display: none;
  }

  [data-retry='true'] wui-link {
    display: block;
    opacity: 1;
  }

  wui-link {
    padding: var(--wui-spacing-4xs) var(--wui-spacing-xxs);
  }

  .capitalize {
    text-transform: capitalize;
  }
`;var sn=function(a,e,t,n){var o=arguments.length,i=o<3?e:n===null?n=Object.getOwnPropertyDescriptor(e,t):n,r;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")i=Reflect.decorate(a,e,t,n);else for(var s=a.length-1;s>=0;s--)(r=a[s])&&(i=(o<3?r(i):o>3?r(e,t,i):r(e,t))||i);return o>3&&i&&Object.defineProperty(e,t,i),i};const Do={eip155:"eth",solana:"solana",bip122:"bitcoin",polkadot:void 0};let It=class extends w{constructor(){var e,t;super(...arguments),this.unsubscribe=[],this.switchToChain=(e=g.state.data)==null?void 0:e.switchToChain,this.caipNetwork=(t=g.state.data)==null?void 0:t.network,this.activeChain=d.state.activeChain}firstUpdated(){this.unsubscribe.push(d.subscribeKey("activeChain",e=>this.activeChain=e))}disconnectedCallback(){this.unsubscribe.forEach(e=>e())}render(){const e=this.switchToChain?_.CHAIN_NAME_MAP[this.switchToChain]:"supported";if(!this.switchToChain)return null;const t=_.CHAIN_NAME_MAP[this.switchToChain];return l`
      <wui-flex
        flexDirection="column"
        alignItems="center"
        .padding=${["3xl","xl","xl","xl"]}
        gap="xl"
      >
        <wui-flex justifyContent="center" flexDirection="column" alignItems="center" gap="xl">
          <wui-visual name=${p(Do[this.switchToChain])}></wui-visual>
          <wui-text
            data-testid=${`w3m-switch-active-chain-to-${t}`}
            variant="paragraph-500"
            color="fg-100"
            align="center"
            >Switch to <span class="capitalize">${t}</span></wui-text
          >
          <wui-text variant="small-400" color="fg-200" align="center">
            Connected wallet doesn't support connecting to ${e} chain. You
            need to connect with a different wallet.
          </wui-text>
          <wui-button
            data-testid="w3m-switch-active-chain-button"
            size="md"
            @click=${this.switchActiveChain.bind(this)}
            >Switch</wui-button
          >
        </wui-flex>
      </wui-flex>
    `}async switchActiveChain(){this.switchToChain&&(d.setIsSwitchingNamespace(!0),b.setFilterByNamespace(this.switchToChain),this.caipNetwork?await d.switchActiveNetwork(this.caipNetwork):d.setActiveNamespace(this.switchToChain),g.reset("Connect"))}};It.styles=jo;sn([c()],It.prototype,"activeChain",void 0);It=sn([h("w3m-switch-active-chain-view")],It);var Lo=function(a,e,t,n){var o=arguments.length,i=o<3?e:n===null?n=Object.getOwnPropertyDescriptor(e,t):n,r;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")i=Reflect.decorate(a,e,t,n);else for(var s=a.length-1;s>=0;s--)(r=a[s])&&(i=(o<3?r(i):o>3?r(e,t,i):r(e,t))||i);return o>3&&i&&Object.defineProperty(e,t,i),i};const Uo=[{images:["network","layers","system"],title:"The system’s nuts and bolts",text:"A network is what brings the blockchain to life, as this technical infrastructure allows apps to access the ledger and smart contract services."},{images:["noun","defiAlt","dao"],title:"Designed for different uses",text:"Each network is designed differently, and may therefore suit certain apps and experiences."}];let Vi=class extends w{render(){return l`
      <wui-flex
        flexDirection="column"
        .padding=${["xxl","xl","xl","xl"]}
        alignItems="center"
        gap="xl"
      >
        <w3m-help-widget .data=${Uo}></w3m-help-widget>
        <wui-button
          variant="main"
          size="md"
          @click=${()=>{f.openHref("https://ethereum.org/en/developers/docs/networks/","_blank")}}
        >
          Learn more
          <wui-icon color="inherit" slot="iconRight" name="externalLink"></wui-icon>
        </wui-button>
      </wui-flex>
    `}};Vi=Lo([h("w3m-what-is-a-network-view")],Vi);const Bo=x`
  :host > wui-flex {
    max-height: clamp(360px, 540px, 80vh);
    overflow: scroll;
    scrollbar-width: none;
  }

  :host > wui-flex::-webkit-scrollbar {
    display: none;
  }
`;var ln=function(a,e,t,n){var o=arguments.length,i=o<3?e:n===null?n=Object.getOwnPropertyDescriptor(e,t):n,r;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")i=Reflect.decorate(a,e,t,n);else for(var s=a.length-1;s>=0;s--)(r=a[s])&&(i=(o<3?r(i):o>3?r(e,t,i):r(e,t))||i);return o>3&&i&&Object.defineProperty(e,t,i),i};let Tt=class extends w{constructor(){var e;super(),this.swapUnsupportedChain=(e=g.state.data)==null?void 0:e.swapUnsupportedChain,this.unsubscribe=[],this.disconecting=!1,this.unsubscribe.push(ce.subscribeNetworkImages(()=>this.requestUpdate()))}disconnectedCallback(){this.unsubscribe.forEach(e=>e())}render(){return l`
      <wui-flex class="container" flexDirection="column" gap="0">
        <wui-flex
          class="container"
          flexDirection="column"
          .padding=${["m","xl","xs","xl"]}
          alignItems="center"
          gap="xl"
        >
          ${this.descriptionTemplate()}
        </wui-flex>

        <wui-flex flexDirection="column" padding="s" gap="xs">
          ${this.networksTemplate()}
        </wui-flex>

        <wui-separator text="or"></wui-separator>
        <wui-flex flexDirection="column" padding="s" gap="xs">
          <wui-list-item
            variant="icon"
            iconVariant="overlay"
            icon="disconnect"
            ?chevron=${!1}
            .loading=${this.disconecting}
            @click=${this.onDisconnect.bind(this)}
            data-testid="disconnect-button"
          >
            <wui-text variant="paragraph-500" color="fg-200">Disconnect</wui-text>
          </wui-list-item>
        </wui-flex>
      </wui-flex>
    `}descriptionTemplate(){return this.swapUnsupportedChain?l`
        <wui-text variant="small-400" color="fg-200" align="center">
          The swap feature doesn’t support your current network. Switch to an available option to
          continue.
        </wui-text>
      `:l`
      <wui-text variant="small-400" color="fg-200" align="center">
        This app doesn’t support your current network. Switch to an available option to continue.
      </wui-text>
    `}networksTemplate(){const e=d.getAllRequestedCaipNetworks(),t=d.getAllApprovedCaipNetworkIds(),n=f.sortRequestedNetworks(t,e);return(this.swapUnsupportedChain?n.filter(i=>U.SWAP_SUPPORTED_NETWORKS.includes(i.caipNetworkId)):n).map(i=>l`
        <wui-list-network
          imageSrc=${p($.getNetworkImage(i))}
          name=${i.name??"Unknown"}
          @click=${()=>this.onSwitchNetwork(i)}
        >
        </wui-list-network>
      `)}async onDisconnect(){try{this.disconecting=!0,await C.disconnect(),W.close()}catch{k.sendEvent({type:"track",event:"DISCONNECT_ERROR"}),P.showError("Failed to disconnect")}finally{this.disconecting=!1}}async onSwitchNetwork(e){const t=m.state.caipAddress,n=d.getAllApprovedCaipNetworkIds(),o=d.getNetworkProp("supportsAllNetworks",e.chainNamespace),i=g.state.data;t?n!=null&&n.includes(e.caipNetworkId)?await d.switchActiveNetwork(e):o?g.push("SwitchNetwork",{...i,network:e}):g.push("SwitchNetwork",{...i,network:e}):t||(d.setActiveCaipNetwork(e),g.push("Connect"))}};Tt.styles=Bo;ln([u()],Tt.prototype,"disconecting",void 0);Tt=ln([h("w3m-unsupported-chain-view")],Tt);const zo=x`
  wui-flex {
    width: 100%;
    background-color: var(--wui-color-gray-glass-005);
    border-radius: var(--wui-border-radius-s);
    padding: var(--wui-spacing-1xs) var(--wui-spacing-s) var(--wui-spacing-1xs)
      var(--wui-spacing-1xs);
  }
`;var xi=function(a,e,t,n){var o=arguments.length,i=o<3?e:n===null?n=Object.getOwnPropertyDescriptor(e,t):n,r;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")i=Reflect.decorate(a,e,t,n);else for(var s=a.length-1;s>=0;s--)(r=a[s])&&(i=(o<3?r(i):o>3?r(e,t,i):r(e,t))||i);return o>3&&i&&Object.defineProperty(e,t,i),i};let nt=class extends w{constructor(){super(...arguments),this.icon="externalLink",this.text=""}render(){return l`
      <wui-flex gap="1xs" alignItems="center">
        <wui-icon-box
          size="sm"
          iconcolor="fg-200"
          backgroundcolor="fg-200"
          icon=${this.icon}
          background="transparent"
        ></wui-icon-box>
        <wui-text variant="small-400" color="fg-200">${this.text}</wui-text>
      </wui-flex>
    `}};nt.styles=[I,T,zo];xi([c()],nt.prototype,"icon",void 0);xi([c()],nt.prototype,"text",void 0);nt=xi([h("wui-banner")],nt);const Mo=x`
  :host > wui-flex {
    max-height: clamp(360px, 540px, 80vh);
    overflow: scroll;
    scrollbar-width: none;
  }

  :host > wui-flex::-webkit-scrollbar {
    display: none;
  }
`;var cn=function(a,e,t,n){var o=arguments.length,i=o<3?e:n===null?n=Object.getOwnPropertyDescriptor(e,t):n,r;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")i=Reflect.decorate(a,e,t,n);else for(var s=a.length-1;s>=0;s--)(r=a[s])&&(i=(o<3?r(i):o>3?r(e,t,i):r(e,t))||i);return o>3&&i&&Object.defineProperty(e,t,i),i};let At=class extends w{constructor(){super(),this.unsubscribe=[],this.preferredAccountTypes=m.state.preferredAccountTypes,this.unsubscribe.push(m.subscribeKey("preferredAccountTypes",e=>{this.preferredAccountTypes=e}))}disconnectedCallback(){this.unsubscribe.forEach(e=>e())}render(){return l` <wui-flex
      flexDirection="column"
      .padding=${["xs","s","m","s"]}
      gap="xs"
    >
      <wui-banner
        icon="warningCircle"
        text="You can only receive assets on these networks"
      ></wui-banner>
      ${this.networkTemplate()}
    </wui-flex>`}networkTemplate(){var s;const e=d.getAllRequestedCaipNetworks(),t=d.getAllApprovedCaipNetworkIds(),n=d.state.activeCaipNetwork,o=d.checkIfSmartAccountEnabled();let i=f.sortRequestedNetworks(t,e);if(o&&((s=this.preferredAccountTypes)==null?void 0:s[n==null?void 0:n.chainNamespace])===F.ACCOUNT_TYPES.SMART_ACCOUNT){if(!n)return null;i=[n]}return i.filter(y=>y.chainNamespace===(n==null?void 0:n.chainNamespace)).map(y=>l`
        <wui-list-network
          imageSrc=${p($.getNetworkImage(y))}
          name=${y.name??"Unknown"}
          ?transparent=${!0}
        >
        </wui-list-network>
      `)}};At.styles=Mo;cn([u()],At.prototype,"preferredAccountTypes",void 0);At=cn([h("w3m-wallet-compatible-networks-view")],At);const Vo=x`
  :host {
    display: flex;
    justify-content: center;
    align-items: center;
    width: var(--wui-icon-box-size-xl);
    height: var(--wui-icon-box-size-xl);
    box-shadow: 0 0 0 8px var(--wui-thumbnail-border);
    border-radius: var(--local-border-radius);
    overflow: hidden;
  }

  wui-icon {
    width: 32px;
    height: 32px;
  }
`;var Vt=function(a,e,t,n){var o=arguments.length,i=o<3?e:n===null?n=Object.getOwnPropertyDescriptor(e,t):n,r;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")i=Reflect.decorate(a,e,t,n);else for(var s=a.length-1;s>=0;s--)(r=a[s])&&(i=(o<3?r(i):o>3?r(e,t,i):r(e,t))||i);return o>3&&i&&Object.defineProperty(e,t,i),i};let Le=class extends w{render(){return this.style.cssText=`--local-border-radius: ${this.borderRadiusFull?"1000px":"20px"}; background-color: var(--wui-color-modal-bg);`,l`${this.templateVisual()}`}templateVisual(){return this.imageSrc?l`<wui-image src=${this.imageSrc} alt=${this.alt??""}></wui-image>`:l`<wui-icon
      data-parent-size="md"
      size="inherit"
      color="inherit"
      name="walletPlaceholder"
    ></wui-icon>`}};Le.styles=[I,Vo];Vt([c()],Le.prototype,"imageSrc",void 0);Vt([c()],Le.prototype,"alt",void 0);Vt([c({type:Boolean})],Le.prototype,"borderRadiusFull",void 0);Le=Vt([h("wui-visual-thumbnail")],Le);const Fo=x`
  :host {
    display: flex;
    justify-content: center;
    gap: var(--wui-spacing-2xl);
  }

  wui-visual-thumbnail:nth-child(1) {
    z-index: 1;
  }
`;var Ko=function(a,e,t,n){var o=arguments.length,i=o<3?e:n===null?n=Object.getOwnPropertyDescriptor(e,t):n,r;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")i=Reflect.decorate(a,e,t,n);else for(var s=a.length-1;s>=0;s--)(r=a[s])&&(i=(o<3?r(i):o>3?r(e,t,i):r(e,t))||i);return o>3&&i&&Object.defineProperty(e,t,i),i};let ni=class extends w{constructor(){var e,t;super(...arguments),this.dappImageUrl=(e=v.state.metadata)==null?void 0:e.icons,this.walletImageUrl=(t=m.state.connectedWalletInfo)==null?void 0:t.icon}firstUpdated(){var t;const e=(t=this.shadowRoot)==null?void 0:t.querySelectorAll("wui-visual-thumbnail");e!=null&&e[0]&&this.createAnimation(e[0],"translate(18px)"),e!=null&&e[1]&&this.createAnimation(e[1],"translate(-18px)")}render(){var e;return l`
      <wui-visual-thumbnail
        ?borderRadiusFull=${!0}
        .imageSrc=${(e=this.dappImageUrl)==null?void 0:e[0]}
      ></wui-visual-thumbnail>
      <wui-visual-thumbnail .imageSrc=${this.walletImageUrl}></wui-visual-thumbnail>
    `}createAnimation(e,t){e.animate([{transform:"translateX(0px)"},{transform:t}],{duration:1600,easing:"cubic-bezier(0.56, 0, 0.48, 1)",direction:"alternate",iterations:1/0})}};ni.styles=Fo;ni=Ko([h("w3m-siwx-sign-message-thumbnails")],ni);var vi=function(a,e,t,n){var o=arguments.length,i=o<3?e:n===null?n=Object.getOwnPropertyDescriptor(e,t):n,r;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")i=Reflect.decorate(a,e,t,n);else for(var s=a.length-1;s>=0;s--)(r=a[s])&&(i=(o<3?r(i):o>3?r(e,t,i):r(e,t))||i);return o>3&&i&&Object.defineProperty(e,t,i),i};let Wt=class extends w{constructor(){var e;super(...arguments),this.dappName=(e=v.state.metadata)==null?void 0:e.name,this.isCancelling=!1,this.isSigning=!1}render(){return l`
      <wui-flex justifyContent="center" .padding=${["2xl","0","xxl","0"]}>
        <w3m-siwx-sign-message-thumbnails></w3m-siwx-sign-message-thumbnails>
      </wui-flex>
      <wui-flex
        .padding=${["0","4xl","l","4xl"]}
        gap="s"
        justifyContent="space-between"
      >
        <wui-text variant="paragraph-500" align="center" color="fg-100"
          >${this.dappName??"Dapp"} needs to connect to your wallet</wui-text
        >
      </wui-flex>
      <wui-flex
        .padding=${["0","3xl","l","3xl"]}
        gap="s"
        justifyContent="space-between"
      >
        <wui-text variant="small-400" align="center" color="fg-200"
          >Sign this message to prove you own this wallet and proceed. Canceling will disconnect
          you.</wui-text
        >
      </wui-flex>
      <wui-flex .padding=${["l","xl","xl","xl"]} gap="s" justifyContent="space-between">
        <wui-button
          size="lg"
          borderRadius="xs"
          fullWidth
          variant="neutral"
          ?loading=${this.isCancelling}
          @click=${this.onCancel.bind(this)}
          data-testid="w3m-connecting-siwe-cancel"
        >
          ${this.isCancelling?"Cancelling...":"Cancel"}
        </wui-button>
        <wui-button
          size="lg"
          borderRadius="xs"
          fullWidth
          variant="main"
          @click=${this.onSign.bind(this)}
          ?loading=${this.isSigning}
          data-testid="w3m-connecting-siwe-sign"
        >
          ${this.isSigning?"Signing...":"Sign"}
        </wui-button>
      </wui-flex>
    `}async onSign(){this.isSigning=!0,await Ci.requestSignMessage().finally(()=>this.isSigning=!1)}async onCancel(){this.isCancelling=!0,await Ci.cancelSignMessage().finally(()=>this.isCancelling=!1)}};vi([u()],Wt.prototype,"isCancelling",void 0);vi([u()],Wt.prototype,"isSigning",void 0);Wt=vi([h("w3m-siwx-sign-message-view")],Wt);export{_i as AppKitAccountButton,Ti as AppKitButton,Wi as AppKitConnectButton,Ei as AppKitNetworkButton,Si as W3mAccountButton,Q as W3mAccountSettingsView,Xt as W3mAccountView,ft as W3mAllWalletsView,Ii as W3mButton,St as W3mChooseAccountNameView,Ai as W3mConnectButton,z as W3mConnectView,_t as W3mConnectWalletsView,ji as W3mConnectingExternalView,$t as W3mConnectingMultiChainView,ei as W3mConnectingWcBasicView,De as W3mConnectingWcView,Bi as W3mDownloadsView,zi as W3mGetWalletView,Ri as W3mNetworkButton,it as W3mNetworkSwitchView,Se as W3mNetworksView,de as W3mProfileView,as as W3mRouter,Wt as W3mSIWXSignMessageView,It as W3mSwitchActiveChainView,Ye as W3mSwitchAddressView,Tt as W3mUnsupportedChainView,At as W3mWalletCompatibleNetworksView,Vi as W3mWhatIsANetworkView,Mi as W3mWhatIsAWalletView};
