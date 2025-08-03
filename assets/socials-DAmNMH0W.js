import{i as e,n as t,h as i,c as o,a as r,k as s,O as a,R as n,l as c,x as l,p as d,f as u,q as h,s as p,t as w,o as g,A as m,v,C as f,w as b,E as x,y,S as C,z as k,M as P,T as S}from"./appkit-vendor-C7zlPPaF.js";import"./wagmi-vendor-dPYIeXYB.js";import"./react-vendor-CFG7hIzY.js";const E=e`
  :host {
    margin-top: var(--wui-spacing-3xs);
  }
  wui-separator {
    margin: var(--wui-spacing-m) calc(var(--wui-spacing-m) * -1) var(--wui-spacing-xs)
      calc(var(--wui-spacing-m) * -1);
    width: calc(100% + var(--wui-spacing-s) * 2);
  }
`;var $=function(e,t,i,o){var r,s=arguments.length,a=s<3?t:null===o?o=Object.getOwnPropertyDescriptor(t,i):o;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)a=Reflect.decorate(e,t,i,o);else for(var n=e.length-1;n>=0;n--)(r=e[n])&&(a=(s<3?r(a):s>3?r(t,i,a):r(t,i))||a);return s>3&&a&&Object.defineProperty(t,i,a),a};let I=class extends r{constructor(){super(),this.unsubscribe=[],this.tabIdx=void 0,this.connectors=s.state.connectors,this.authConnector=this.connectors.find(e=>"AUTH"===e.type),this.remoteFeatures=a.state.remoteFeatures,this.isPwaLoading=!1,this.unsubscribe.push(s.subscribeKey("connectors",e=>{this.connectors=e,this.authConnector=this.connectors.find(e=>"AUTH"===e.type)}),a.subscribeKey("remoteFeatures",e=>this.remoteFeatures=e))}connectedCallback(){super.connectedCallback(),this.handlePwaFrameLoad()}disconnectedCallback(){this.unsubscribe.forEach(e=>e())}render(){let e=this.remoteFeatures?.socials||[];const t=Boolean(this.authConnector),i=e?.length,o="ConnectSocials"===n.state.view;return t&&i||o?(o&&!i&&(e=c.DEFAULT_SOCIALS),l` <wui-flex flexDirection="column" gap="xs">
      ${e.map(e=>l`<wui-list-social
            @click=${()=>{this.onSocialClick(e)}}
            data-testid=${`social-selector-${e}`}
            name=${e}
            logo=${e}
            ?disabled=${this.isPwaLoading}
          ></wui-list-social>`)}
    </wui-flex>`):null}async onSocialClick(e){e&&await d(e)}async handlePwaFrameLoad(){if(u.isPWA()){this.isPwaLoading=!0;try{this.authConnector?.provider instanceof h&&await this.authConnector.provider.init()}catch(e){p.open({displayMessage:"Error loading embedded wallet in PWA",debugMessage:e.message},"error")}finally{this.isPwaLoading=!1}}}};I.styles=E,$([t()],I.prototype,"tabIdx",void 0),$([i()],I.prototype,"connectors",void 0),$([i()],I.prototype,"authConnector",void 0),$([i()],I.prototype,"remoteFeatures",void 0),$([i()],I.prototype,"isPwaLoading",void 0),I=$([o("w3m-social-login-list")],I);const L=e`
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
`;var O=function(e,t,i,o){var r,s=arguments.length,a=s<3?t:null===o?o=Object.getOwnPropertyDescriptor(t,i):o;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)a=Reflect.decorate(e,t,i,o);else for(var n=e.length-1;n>=0;n--)(r=e[n])&&(a=(s<3?r(a):s>3?r(t,i,a):r(t,i))||a);return s>3&&a&&Object.defineProperty(t,i,a),a};let R=class extends r{constructor(){super(),this.unsubscribe=[],this.checked=w.state.isLegalCheckboxChecked,this.unsubscribe.push(w.subscribeKey("isLegalCheckboxChecked",e=>{this.checked=e}))}disconnectedCallback(){this.unsubscribe.forEach(e=>e())}render(){const{termsConditionsUrl:e,privacyPolicyUrl:t}=a.state,i=a.state.features?.legalCheckbox,o=Boolean(e||t)&&Boolean(i),r=o&&!this.checked,s=r?-1:void 0;return l`
      <w3m-legal-checkbox></w3m-legal-checkbox>
      <wui-flex
        flexDirection="column"
        .padding=${o?["0","s","s","s"]:"s"}
        gap="xs"
        class=${g(r?"disabled":void 0)}
      >
        <w3m-social-login-list tabIdx=${g(s)}></w3m-social-login-list>
      </wui-flex>
      <w3m-legal-footer></w3m-legal-footer>
    `}};R.styles=L,O([i()],R.prototype,"checked",void 0),R=O([o("w3m-connect-socials-view")],R);const T=e`
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
`;var A=function(e,t,i,o){var r,s=arguments.length,a=s<3?t:null===o?o=Object.getOwnPropertyDescriptor(t,i):o;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)a=Reflect.decorate(e,t,i,o);else for(var n=e.length-1;n>=0;n--)(r=e[n])&&(a=(s<3?r(a):s>3?r(t,i,a):r(t,i))||a);return s>3&&a&&Object.defineProperty(t,i,a),a};let F=class extends r{constructor(){super(),this.unsubscribe=[],this.socialProvider=m.state.socialProvider,this.socialWindow=m.state.socialWindow,this.error=!1,this.connecting=!1,this.message="Connect in the provider window",this.remoteFeatures=a.state.remoteFeatures,this.address=m.state.address,this.connectionsByNamespace=v.getConnections(f.state.activeChain),this.hasMultipleConnections=this.connectionsByNamespace.length>0,this.authConnector=s.getAuthConnector(),this.handleSocialConnection=async e=>{if(e.data?.resultUri)if(e.origin===b.SECURE_SITE_ORIGIN){window.removeEventListener("message",this.handleSocialConnection,!1);try{if(this.authConnector&&!this.connecting){this.socialWindow&&(this.socialWindow.close(),m.setSocialWindow(void 0,f.state.activeChain)),this.connecting=!0,this.updateMessage();const t=e.data.resultUri;this.socialProvider&&x.sendEvent({type:"track",event:"SOCIAL_LOGIN_REQUEST_USER_DATA",properties:{provider:this.socialProvider}}),await v.connectExternal({id:this.authConnector.id,type:this.authConnector.type,socialUri:t},this.authConnector.chain),this.socialProvider&&(y.setConnectedSocialProvider(this.socialProvider),x.sendEvent({type:"track",event:"SOCIAL_LOGIN_SUCCESS",properties:{provider:this.socialProvider,caipNetworkId:f.getActiveCaipNetwork()?.caipNetworkId}}))}}catch(t){this.error=!0,this.updateMessage(),this.socialProvider&&x.sendEvent({type:"track",event:"SOCIAL_LOGIN_ERROR",properties:{provider:this.socialProvider}})}}else n.goBack(),C.showError("Untrusted Origin"),this.socialProvider&&x.sendEvent({type:"track",event:"SOCIAL_LOGIN_ERROR",properties:{provider:this.socialProvider}})};k.EmbeddedWalletAbortController.signal.addEventListener("abort",()=>{this.socialWindow&&(this.socialWindow.close(),m.setSocialWindow(void 0,f.state.activeChain))}),this.unsubscribe.push(m.subscribe(e=>{e.socialProvider&&(this.socialProvider=e.socialProvider),e.socialWindow&&(this.socialWindow=e.socialWindow)}),a.subscribeKey("remoteFeatures",e=>{this.remoteFeatures=e}),m.subscribeKey("address",e=>{const t=this.remoteFeatures?.multiWallet;e&&e!==this.address&&(this.hasMultipleConnections&&t?(n.replace("ProfileWallets"),C.showSuccess("New Wallet Added")):(P.state.open||a.state.enableEmbedded)&&P.close())})),this.authConnector&&this.connectSocial()}disconnectedCallback(){this.unsubscribe.forEach(e=>e()),window.removeEventListener("message",this.handleSocialConnection,!1),this.socialWindow?.close(),m.setSocialWindow(void 0,f.state.activeChain)}render(){return l`
      <wui-flex
        data-error=${g(this.error)}
        flexDirection="column"
        alignItems="center"
        .padding=${["3xl","xl","xl","xl"]}
        gap="xl"
      >
        <wui-flex justifyContent="center" alignItems="center">
          <wui-logo logo=${g(this.socialProvider)}></wui-logo>
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
    `}loaderTemplate(){const e=S.state.themeVariables["--w3m-border-radius-master"],t=e?parseInt(e.replace("px",""),10):4;return l`<wui-loading-thumbnail radius=${9*t}></wui-loading-thumbnail>`}connectSocial(){const e=setInterval(()=>{this.socialWindow?.closed&&(this.connecting||"ConnectingSocial"!==n.state.view||(this.socialProvider&&x.sendEvent({type:"track",event:"SOCIAL_LOGIN_CANCELED",properties:{provider:this.socialProvider}}),n.goBack()),clearInterval(e))},1e3);window.addEventListener("message",this.handleSocialConnection,!1)}updateMessage(){this.error?this.message="Something went wrong":this.connecting?this.message="Retrieving user data":this.message="Connect in the provider window"}};F.styles=T,A([i()],F.prototype,"socialProvider",void 0),A([i()],F.prototype,"socialWindow",void 0),A([i()],F.prototype,"error",void 0),A([i()],F.prototype,"connecting",void 0),A([i()],F.prototype,"message",void 0),A([i()],F.prototype,"remoteFeatures",void 0),F=A([o("w3m-connecting-social-view")],F);const U=e`
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
`;var W=function(e,t,i,o){var r,s=arguments.length,a=s<3?t:null===o?o=Object.getOwnPropertyDescriptor(t,i):o;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)a=Reflect.decorate(e,t,i,o);else for(var n=e.length-1;n>=0;n--)(r=e[n])&&(a=(s<3?r(a):s>3?r(t,i,a):r(t,i))||a);return s>3&&a&&Object.defineProperty(t,i,a),a};let _=class extends r{constructor(){super(),this.unsubscribe=[],this.timeout=void 0,this.socialProvider=m.state.socialProvider,this.uri=m.state.farcasterUrl,this.ready=!1,this.loading=!1,this.remoteFeatures=a.state.remoteFeatures,this.authConnector=s.getAuthConnector(),this.forceUpdate=()=>{this.requestUpdate()},this.unsubscribe.push(m.subscribeKey("farcasterUrl",e=>{e&&(this.uri=e,this.connectFarcaster())}),m.subscribeKey("socialProvider",e=>{e&&(this.socialProvider=e)}),a.subscribeKey("remoteFeatures",e=>{this.remoteFeatures=e})),window.addEventListener("resize",this.forceUpdate)}disconnectedCallback(){super.disconnectedCallback(),clearTimeout(this.timeout),window.removeEventListener("resize",this.forceUpdate)}render(){return this.onRenderProxy(),l`${this.platformTemplate()}`}platformTemplate(){return u.isMobile()?l`${this.mobileTemplate()}`:l`${this.desktopTemplate()}`}desktopTemplate(){return this.loading?l`${this.loadingTemplate()}`:l`${this.qrTemplate()}`}qrTemplate(){return l` <wui-flex
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
    </wui-flex>`}loaderTemplate(){const e=S.state.themeVariables["--w3m-border-radius-master"],t=e?parseInt(e.replace("px",""),10):4;return l`<wui-loading-thumbnail radius=${9*t}></wui-loading-thumbnail>`}async connectFarcaster(){if(this.authConnector)try{await(this.authConnector?.provider.connectFarcaster()),this.socialProvider&&(y.setConnectedSocialProvider(this.socialProvider),x.sendEvent({type:"track",event:"SOCIAL_LOGIN_REQUEST_USER_DATA",properties:{provider:this.socialProvider}})),this.loading=!0;const e=v.getConnections(this.authConnector.chain).length>0;await v.connectExternal(this.authConnector,this.authConnector.chain);const t=this.remoteFeatures?.multiWallet;this.socialProvider&&x.sendEvent({type:"track",event:"SOCIAL_LOGIN_SUCCESS",properties:{provider:this.socialProvider,caipNetworkId:f.getActiveCaipNetwork()?.caipNetworkId}}),this.loading=!1,e&&t?(n.replace("ProfileWallets"),C.showSuccess("New Wallet Added")):P.close()}catch(e){this.socialProvider&&x.sendEvent({type:"track",event:"SOCIAL_LOGIN_ERROR",properties:{provider:this.socialProvider}}),n.goBack(),C.showError(e)}}mobileLinkTemplate(){return l`<wui-button
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
      color=${g(S.state.themeVariables["--w3m-qr-color"])}
    ></wui-qr-code>`}copyTemplate(){const e=!this.uri||!this.ready;return l`<wui-link
      .disabled=${e}
      @click=${this.onCopyUri}
      color="fg-200"
      data-testid="copy-wc2-uri"
    >
      <wui-icon size="xs" color="fg-200" slot="iconLeft" name="copy"></wui-icon>
      Copy link
    </wui-link>`}onCopyUri(){try{this.uri&&(u.copyToClopboard(this.uri),C.showSuccess("Link copied"))}catch{C.showError("Failed to copy")}}};_.styles=U,W([i()],_.prototype,"socialProvider",void 0),W([i()],_.prototype,"uri",void 0),W([i()],_.prototype,"ready",void 0),W([i()],_.prototype,"loading",void 0),W([i()],_.prototype,"remoteFeatures",void 0),_=W([o("w3m-connecting-farcaster-view")],_);export{R as W3mConnectSocialsView,_ as W3mConnectingFarcasterView,F as W3mConnectingSocialView};
