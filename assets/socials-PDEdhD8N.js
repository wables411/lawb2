import{i as e,n as t,O as i,c as o,d as r,u as a,V as s,R as n,s as c,x as l,a8 as d,k as u,a9 as h,o as p,aa as w,M as m,A as g,C as v,j as f,ab as b,E as x,ac as y,S as C,ad as P,a4 as k,T as S}from"./index-B8RsvFHB.js";import"./wagmi-vendor-B_qL9Hk_.js";import"./react-vendor-ZyuiJZO_.js";import"./chess-vendor-JTxzwGi1.js";import"./ui-vendor-BgPmeekb.js";const E=e`
  :host {
    margin-top: var(--wui-spacing-3xs);
  }
  wui-separator {
    margin: var(--wui-spacing-m) calc(var(--wui-spacing-m) * -1) var(--wui-spacing-xs)
      calc(var(--wui-spacing-m) * -1);
    width: calc(100% + var(--wui-spacing-s) * 2);
  }
`;var $=function(e,t,i,o){var r,a=arguments.length,s=a<3?t:null===o?o=Object.getOwnPropertyDescriptor(t,i):o;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)s=Reflect.decorate(e,t,i,o);else for(var n=e.length-1;n>=0;n--)(r=e[n])&&(s=(a<3?r(s):a>3?r(t,i,s):r(t,i))||s);return a>3&&s&&Object.defineProperty(t,i,s),s};let L=class extends r{constructor(){super(),this.unsubscribe=[],this.tabIdx=void 0,this.connectors=a.state.connectors,this.authConnector=this.connectors.find(e=>"AUTH"===e.type),this.remoteFeatures=s.state.remoteFeatures,this.isPwaLoading=!1,this.unsubscribe.push(a.subscribeKey("connectors",e=>{this.connectors=e,this.authConnector=this.connectors.find(e=>"AUTH"===e.type)}),s.subscribeKey("remoteFeatures",e=>this.remoteFeatures=e))}connectedCallback(){super.connectedCallback(),this.handlePwaFrameLoad()}disconnectedCallback(){this.unsubscribe.forEach(e=>e())}render(){var e;let t=(null==(e=this.remoteFeatures)?void 0:e.socials)||[];const i=Boolean(this.authConnector),o=null==t?void 0:t.length,r="ConnectSocials"===n.state.view;return i&&o||r?(r&&!o&&(t=c.DEFAULT_SOCIALS),l` <wui-flex flexDirection="column" gap="xs">
      ${t.map(e=>l`<wui-list-social
            @click=${()=>{this.onSocialClick(e)}}
            data-testid=${`social-selector-${e}`}
            name=${e}
            logo=${e}
            ?disabled=${this.isPwaLoading}
          ></wui-list-social>`)}
    </wui-flex>`):null}async onSocialClick(e){e&&await d(e)}async handlePwaFrameLoad(){var e;if(u.isPWA()){this.isPwaLoading=!0;try{(null==(e=this.authConnector)?void 0:e.provider)instanceof h&&await this.authConnector.provider.init()}catch(t){p.open({displayMessage:"Error loading embedded wallet in PWA",debugMessage:t.message},"error")}finally{this.isPwaLoading=!1}}}};L.styles=E,$([t()],L.prototype,"tabIdx",void 0),$([i()],L.prototype,"connectors",void 0),$([i()],L.prototype,"authConnector",void 0),$([i()],L.prototype,"remoteFeatures",void 0),$([i()],L.prototype,"isPwaLoading",void 0),L=$([o("w3m-social-login-list")],L);const I=e`
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
`;var O=function(e,t,i,o){var r,a=arguments.length,s=a<3?t:null===o?o=Object.getOwnPropertyDescriptor(t,i):o;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)s=Reflect.decorate(e,t,i,o);else for(var n=e.length-1;n>=0;n--)(r=e[n])&&(s=(a<3?r(s):a>3?r(t,i,s):r(t,i))||s);return a>3&&s&&Object.defineProperty(t,i,s),s};let R=class extends r{constructor(){super(),this.unsubscribe=[],this.checked=w.state.isLegalCheckboxChecked,this.unsubscribe.push(w.subscribeKey("isLegalCheckboxChecked",e=>{this.checked=e}))}disconnectedCallback(){this.unsubscribe.forEach(e=>e())}render(){var e;const{termsConditionsUrl:t,privacyPolicyUrl:i}=s.state,o=null==(e=s.state.features)?void 0:e.legalCheckbox,r=Boolean(t||i)&&Boolean(o),a=r&&!this.checked,n=a?-1:void 0;return l`
      <w3m-legal-checkbox></w3m-legal-checkbox>
      <wui-flex
        flexDirection="column"
        .padding=${r?["0","s","s","s"]:"s"}
        gap="xs"
        class=${m(a?"disabled":void 0)}
      >
        <w3m-social-login-list tabIdx=${m(n)}></w3m-social-login-list>
      </wui-flex>
      <w3m-legal-footer></w3m-legal-footer>
    `}};R.styles=I,O([i()],R.prototype,"checked",void 0),R=O([o("w3m-connect-socials-view")],R);const T=e`
  wui-logo {
    width: 80px;
    height: 80px;
    border-radius: var(--wui-border-radius-m);
  }
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
    transition: all var(--wui-ease-out-power-2) var(--wui-duration-lg);
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
  .capitalize {
    text-transform: capitalize;
  }
`;var A=function(e,t,i,o){var r,a=arguments.length,s=a<3?t:null===o?o=Object.getOwnPropertyDescriptor(t,i):o;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)s=Reflect.decorate(e,t,i,o);else for(var n=e.length-1;n>=0;n--)(r=e[n])&&(s=(a<3?r(s):a>3?r(t,i,s):r(t,i))||s);return a>3&&s&&Object.defineProperty(t,i,s),s};let F=class extends r{constructor(){super(),this.unsubscribe=[],this.socialProvider=g.state.socialProvider,this.socialWindow=g.state.socialWindow,this.error=!1,this.connecting=!1,this.message="Connect in the provider window",this.remoteFeatures=s.state.remoteFeatures,this.address=g.state.address,this.connectionsByNamespace=v.getConnections(f.state.activeChain),this.hasMultipleConnections=this.connectionsByNamespace.length>0,this.authConnector=a.getAuthConnector(),this.handleSocialConnection=async e=>{var t;if(null==(t=e.data)?void 0:t.resultUri)if(e.origin===b.SECURE_SITE_ORIGIN){window.removeEventListener("message",this.handleSocialConnection,!1);try{if(this.authConnector&&!this.connecting){this.socialWindow&&(this.socialWindow.close(),g.setSocialWindow(void 0,f.state.activeChain)),this.connecting=!0,this.updateMessage();const t=e.data.resultUri;this.socialProvider&&x.sendEvent({type:"track",event:"SOCIAL_LOGIN_REQUEST_USER_DATA",properties:{provider:this.socialProvider}}),await v.connectExternal({id:this.authConnector.id,type:this.authConnector.type,socialUri:t},this.authConnector.chain),this.socialProvider&&(y.setConnectedSocialProvider(this.socialProvider),x.sendEvent({type:"track",event:"SOCIAL_LOGIN_SUCCESS",properties:{provider:this.socialProvider}}))}}catch(i){this.error=!0,this.updateMessage(),this.socialProvider&&x.sendEvent({type:"track",event:"SOCIAL_LOGIN_ERROR",properties:{provider:this.socialProvider}})}}else n.goBack(),C.showError("Untrusted Origin"),this.socialProvider&&x.sendEvent({type:"track",event:"SOCIAL_LOGIN_ERROR",properties:{provider:this.socialProvider}})};P.EmbeddedWalletAbortController.signal.addEventListener("abort",()=>{this.socialWindow&&(this.socialWindow.close(),g.setSocialWindow(void 0,f.state.activeChain))}),this.unsubscribe.push(g.subscribe(e=>{e.socialProvider&&(this.socialProvider=e.socialProvider),e.socialWindow&&(this.socialWindow=e.socialWindow)}),s.subscribeKey("remoteFeatures",e=>{this.remoteFeatures=e}),g.subscribeKey("address",e=>{var t;const i=null==(t=this.remoteFeatures)?void 0:t.multiWallet;e&&e!==this.address&&(this.hasMultipleConnections&&i?(n.replace("ProfileWallets"),C.showSuccess("New Wallet Added")):(k.state.open||s.state.enableEmbedded)&&k.close())})),this.authConnector&&this.connectSocial()}disconnectedCallback(){var e;this.unsubscribe.forEach(e=>e()),window.removeEventListener("message",this.handleSocialConnection,!1),null==(e=this.socialWindow)||e.close(),g.setSocialWindow(void 0,f.state.activeChain)}render(){return l`
      <wui-flex
        data-error=${m(this.error)}
        flexDirection="column"
        alignItems="center"
        .padding=${["3xl","xl","xl","xl"]}
        gap="xl"
      >
        <wui-flex justifyContent="center" alignItems="center">
          <wui-logo logo=${m(this.socialProvider)}></wui-logo>
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
          <wui-text align="center" variant="paragraph-500" color="fg-100"
            >Log in with
            <span class="capitalize">${this.socialProvider??"Social"}</span></wui-text
          >
          <wui-text align="center" variant="small-400" color=${this.error?"error-100":"fg-200"}
            >${this.message}</wui-text
          ></wui-flex
        >
      </wui-flex>
    `}loaderTemplate(){const e=S.state.themeVariables["--w3m-border-radius-master"],t=e?parseInt(e.replace("px",""),10):4;return l`<wui-loading-thumbnail radius=${9*t}></wui-loading-thumbnail>`}connectSocial(){const e=setInterval(()=>{var t;(null==(t=this.socialWindow)?void 0:t.closed)&&(this.connecting||"ConnectingSocial"!==n.state.view||(this.socialProvider&&x.sendEvent({type:"track",event:"SOCIAL_LOGIN_CANCELED",properties:{provider:this.socialProvider}}),n.goBack()),clearInterval(e))},1e3);window.addEventListener("message",this.handleSocialConnection,!1)}updateMessage(){this.error?this.message="Something went wrong":this.connecting?this.message="Retrieving user data":this.message="Connect in the provider window"}};F.styles=T,A([i()],F.prototype,"socialProvider",void 0),A([i()],F.prototype,"socialWindow",void 0),A([i()],F.prototype,"error",void 0),A([i()],F.prototype,"connecting",void 0),A([i()],F.prototype,"message",void 0),A([i()],F.prototype,"remoteFeatures",void 0),F=A([o("w3m-connecting-social-view")],F);const U=e`
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

  wui-logo {
    width: 80px;
    height: 80px;
    border-radius: var(--wui-border-radius-m);
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
    transition: all var(--wui-ease-out-power-2) var(--wui-duration-lg);
  }
`;var W=function(e,t,i,o){var r,a=arguments.length,s=a<3?t:null===o?o=Object.getOwnPropertyDescriptor(t,i):o;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)s=Reflect.decorate(e,t,i,o);else for(var n=e.length-1;n>=0;n--)(r=e[n])&&(s=(a<3?r(s):a>3?r(t,i,s):r(t,i))||s);return a>3&&s&&Object.defineProperty(t,i,s),s};let _=class extends r{constructor(){super(),this.unsubscribe=[],this.timeout=void 0,this.socialProvider=g.state.socialProvider,this.uri=g.state.farcasterUrl,this.ready=!1,this.loading=!1,this.remoteFeatures=s.state.remoteFeatures,this.authConnector=a.getAuthConnector(),this.forceUpdate=()=>{this.requestUpdate()},this.unsubscribe.push(g.subscribeKey("farcasterUrl",e=>{e&&(this.uri=e,this.connectFarcaster())}),g.subscribeKey("socialProvider",e=>{e&&(this.socialProvider=e)}),s.subscribeKey("remoteFeatures",e=>{this.remoteFeatures=e})),window.addEventListener("resize",this.forceUpdate)}disconnectedCallback(){super.disconnectedCallback(),clearTimeout(this.timeout),window.removeEventListener("resize",this.forceUpdate)}render(){return this.onRenderProxy(),l`${this.platformTemplate()}`}platformTemplate(){return u.isMobile()?l`${this.mobileTemplate()}`:l`${this.desktopTemplate()}`}desktopTemplate(){return this.loading?l`${this.loadingTemplate()}`:l`${this.qrTemplate()}`}qrTemplate(){return l` <wui-flex
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
    </wui-flex>`}loadingTemplate(){return l`
      <wui-flex
        flexDirection="column"
        alignItems="center"
        .padding=${["xl","xl","xl","xl"]}
        gap="xl"
      >
        <wui-flex justifyContent="center" alignItems="center">
          <wui-logo logo="farcaster"></wui-logo>
          ${this.loaderTemplate()}
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
          <wui-text align="center" variant="paragraph-500" color="fg-100">
            Loading user data
          </wui-text>
          <wui-text align="center" variant="small-400" color="fg-200">
            Please wait a moment while we load your data.
          </wui-text>
        </wui-flex>
      </wui-flex>
    `}mobileTemplate(){return l` <wui-flex
      flexDirection="column"
      alignItems="center"
      .padding=${["3xl","xl","xl","xl"]}
      gap="xl"
    >
      <wui-flex justifyContent="center" alignItems="center">
        <wui-logo logo="farcaster"></wui-logo>
        ${this.loaderTemplate()}
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
        <wui-text align="center" variant="paragraph-500" color="fg-100"
          >Continue in Farcaster</span></wui-text
        >
        <wui-text align="center" variant="small-400" color="fg-200"
          >Accept connection request in the app</wui-text
        ></wui-flex
      >
      ${this.mobileLinkTemplate()}
    </wui-flex>`}loaderTemplate(){const e=S.state.themeVariables["--w3m-border-radius-master"],t=e?parseInt(e.replace("px",""),10):4;return l`<wui-loading-thumbnail radius=${9*t}></wui-loading-thumbnail>`}async connectFarcaster(){var e,t;if(this.authConnector)try{await(null==(e=this.authConnector)?void 0:e.provider.connectFarcaster()),this.socialProvider&&(y.setConnectedSocialProvider(this.socialProvider),x.sendEvent({type:"track",event:"SOCIAL_LOGIN_REQUEST_USER_DATA",properties:{provider:this.socialProvider}})),this.loading=!0;const i=v.getConnections(this.authConnector.chain).length>0;await v.connectExternal(this.authConnector,this.authConnector.chain);const o=null==(t=this.remoteFeatures)?void 0:t.multiWallet;this.socialProvider&&x.sendEvent({type:"track",event:"SOCIAL_LOGIN_SUCCESS",properties:{provider:this.socialProvider}}),this.loading=!1,i&&o?(n.replace("ProfileWallets"),C.showSuccess("New Wallet Added")):k.close()}catch(i){this.socialProvider&&x.sendEvent({type:"track",event:"SOCIAL_LOGIN_ERROR",properties:{provider:this.socialProvider}}),n.goBack(),C.showError(i)}}mobileLinkTemplate(){return l`<wui-button
      size="md"
      ?loading=${this.loading}
      ?disabled=${!this.uri||this.loading}
      @click=${()=>{this.uri&&u.openHref(this.uri,"_blank")}}
    >
      Open farcaster</wui-button
    >`}onRenderProxy(){!this.ready&&this.uri&&(this.timeout=setTimeout(()=>{this.ready=!0},200))}qrCodeTemplate(){if(!this.uri||!this.ready)return null;const e=this.getBoundingClientRect().width-40;return l` <wui-qr-code
      size=${e}
      theme=${S.state.themeMode}
      uri=${this.uri}
      ?farcaster=${!0}
      data-testid="wui-qr-code"
      color=${m(S.state.themeVariables["--w3m-qr-color"])}
    ></wui-qr-code>`}copyTemplate(){const e=!this.uri||!this.ready;return l`<wui-link
      .disabled=${e}
      @click=${this.onCopyUri}
      color="fg-200"
      data-testid="copy-wc2-uri"
    >
      <wui-icon size="xs" color="fg-200" slot="iconLeft" name="copy"></wui-icon>
      Copy link
    </wui-link>`}onCopyUri(){try{this.uri&&(u.copyToClopboard(this.uri),C.showSuccess("Link copied"))}catch{C.showError("Failed to copy")}}};_.styles=U,W([i()],_.prototype,"socialProvider",void 0),W([i()],_.prototype,"uri",void 0),W([i()],_.prototype,"ready",void 0),W([i()],_.prototype,"loading",void 0),W([i()],_.prototype,"remoteFeatures",void 0),_=W([o("w3m-connecting-farcaster-view")],_);export{R as W3mConnectSocialsView,_ as W3mConnectingFarcasterView,F as W3mConnectingSocialView};
