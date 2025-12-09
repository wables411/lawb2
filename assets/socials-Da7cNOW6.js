import{o as e,q as t,a8 as i,s as o,t as r,T as s,ab as a,ah as n,R as c,P as l,x as d,ai as u,K as h,aj as p,M as m,ak as g,Y as w,I as v,E as f,al as b,G as y,am as x,S as C,an as $,af as P,a7 as E}from"./index-CLL-s_yf.js";import"./wagmi-vendor-BlnX2Ri9.js";import"./react-vendor-ZyuiJZO_.js";import"./chess-vendor-JTxzwGi1.js";import"./ui-vendor-BgPmeekb.js";const S=e`
  :host {
    margin-top: ${({spacing:e})=>e[1]};
  }
  wui-separator {
    margin: ${({spacing:e})=>e[3]} calc(${({spacing:e})=>e[3]} * -1)
      ${({spacing:e})=>e[2]} calc(${({spacing:e})=>e[3]} * -1);
    width: calc(100% + ${({spacing:e})=>e[3]} * 2);
  }
`;var L=function(e,t,i,o){var r,s=arguments.length,a=s<3?t:null===o?o=Object.getOwnPropertyDescriptor(t,i):o;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)a=Reflect.decorate(e,t,i,o);else for(var n=e.length-1;n>=0;n--)(r=e[n])&&(a=(s<3?r(a):s>3?r(t,i,a):r(t,i))||a);return s>3&&a&&Object.defineProperty(t,i,a),a};let k=class extends r{constructor(){super(),this.unsubscribe=[],this.tabIdx=void 0,this.connectors=s.state.connectors,this.authConnector=this.connectors.find(e=>"AUTH"===e.type),this.remoteFeatures=a.state.remoteFeatures,this.isPwaLoading=!1,this.hasExceededUsageLimit=n.state.plan.hasExceededUsageLimit,this.unsubscribe.push(s.subscribeKey("connectors",e=>{this.connectors=e,this.authConnector=this.connectors.find(e=>"AUTH"===e.type)}),a.subscribeKey("remoteFeatures",e=>this.remoteFeatures=e))}connectedCallback(){super.connectedCallback(),this.handlePwaFrameLoad()}disconnectedCallback(){this.unsubscribe.forEach(e=>e())}render(){var e;let t=(null==(e=this.remoteFeatures)?void 0:e.socials)||[];const i=Boolean(this.authConnector),o=null==t?void 0:t.length,r="ConnectSocials"===c.state.view;return i&&o||r?(r&&!o&&(t=l.DEFAULT_SOCIALS),d` <wui-flex flexDirection="column" gap="2">
      ${t.map(e=>d`<wui-list-social
            @click=${()=>{this.onSocialClick(e)}}
            data-testid=${`social-selector-${e}`}
            name=${e}
            logo=${e}
            ?disabled=${this.isPwaLoading}
          ></wui-list-social>`)}
    </wui-flex>`):null}async onSocialClick(e){this.hasExceededUsageLimit?c.push("UsageExceeded"):e&&await u(e)}async handlePwaFrameLoad(){var e;if(h.isPWA()){this.isPwaLoading=!0;try{(null==(e=this.authConnector)?void 0:e.provider)instanceof p&&await this.authConnector.provider.init()}catch(t){m.open({displayMessage:"Error loading embedded wallet in PWA",debugMessage:t.message},"error")}finally{this.isPwaLoading=!1}}}};k.styles=S,L([t()],k.prototype,"tabIdx",void 0),L([i()],k.prototype,"connectors",void 0),L([i()],k.prototype,"authConnector",void 0),L([i()],k.prototype,"remoteFeatures",void 0),L([i()],k.prototype,"isPwaLoading",void 0),L([i()],k.prototype,"hasExceededUsageLimit",void 0),k=L([o("w3m-social-login-list")],k);const I=e`
  wui-flex {
    max-height: clamp(360px, 540px, 80vh);
    overflow: scroll;
    scrollbar-width: none;
    transition: opacity ${({durations:e})=>e.md}
      ${({easings:e})=>e["ease-out-power-1"]};
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
`;var O=function(e,t,i,o){var r,s=arguments.length,a=s<3?t:null===o?o=Object.getOwnPropertyDescriptor(t,i):o;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)a=Reflect.decorate(e,t,i,o);else for(var n=e.length-1;n>=0;n--)(r=e[n])&&(a=(s<3?r(a):s>3?r(t,i,a):r(t,i))||a);return s>3&&a&&Object.defineProperty(t,i,a),a};let R=class extends r{constructor(){super(),this.unsubscribe=[],this.checked=g.state.isLegalCheckboxChecked,this.unsubscribe.push(g.subscribeKey("isLegalCheckboxChecked",e=>{this.checked=e}))}disconnectedCallback(){this.unsubscribe.forEach(e=>e())}render(){var e;const{termsConditionsUrl:t,privacyPolicyUrl:i}=a.state,o=null==(e=a.state.features)?void 0:e.legalCheckbox,r=Boolean(t||i)&&Boolean(o)&&!this.checked,s=r?-1:void 0;return d`
      <w3m-legal-checkbox></w3m-legal-checkbox>
      <wui-flex
        flexDirection="column"
        .padding=${["0","3","3","3"]}
        gap="01"
        class=${w(r?"disabled":void 0)}
      >
        <w3m-social-login-list tabIdx=${w(s)}></w3m-social-login-list>
      </wui-flex>
    `}};R.styles=I,O([i()],R.prototype,"checked",void 0),R=O([o("w3m-connect-socials-view")],R);const A=e`
  wui-logo {
    width: 80px;
    height: 80px;
    border-radius: ${({borderRadius:e})=>e[8]};
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
    right: calc(${({spacing:e})=>e[1]} * -1);
    bottom: calc(${({spacing:e})=>e[1]} * -1);
    opacity: 0;
    transform: scale(0.5);
    transition: all ${({easings:e})=>e["ease-out-power-2"]}
      ${({durations:e})=>e.lg};
  }
  wui-text[align='center'] {
    width: 100%;
    padding: 0px ${({spacing:e})=>e[4]};
  }
  [data-error='true'] wui-icon-box {
    opacity: 1;
    transform: scale(1);
  }
  [data-error='true'] > wui-flex:first-child {
    animation: shake 250ms ${({easings:e})=>e["ease-out-power-2"]} both;
  }
  .capitalize {
    text-transform: capitalize;
  }
`;var T=function(e,t,i,o){var r,s=arguments.length,a=s<3?t:null===o?o=Object.getOwnPropertyDescriptor(t,i):o;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)a=Reflect.decorate(e,t,i,o);else for(var n=e.length-1;n>=0;n--)(r=e[n])&&(a=(s<3?r(a):s>3?r(t,i,a):r(t,i))||a);return s>3&&a&&Object.defineProperty(t,i,a),a};let U=class extends r{constructor(){var e,t,i;super(),this.unsubscribe=[],this.socialProvider=null==(e=v.getAccountData())?void 0:e.socialProvider,this.socialWindow=null==(t=v.getAccountData())?void 0:t.socialWindow,this.error=!1,this.connecting=!1,this.message="Connect in the provider window",this.remoteFeatures=a.state.remoteFeatures,this.address=null==(i=v.getAccountData())?void 0:i.address,this.connectionsByNamespace=f.getConnections(v.state.activeChain),this.hasMultipleConnections=this.connectionsByNamespace.length>0,this.authConnector=s.getAuthConnector(),this.handleSocialConnection=async e=>{var t;if(null==(t=e.data)?void 0:t.resultUri)if(e.origin===b.SECURE_SITE_ORIGIN){window.removeEventListener("message",this.handleSocialConnection,!1);try{if(this.authConnector&&!this.connecting){this.connecting=!0;const t=this.parseURLError(e.data.resultUri);if(t)return void this.handleSocialError(t);this.closeSocialWindow(),this.updateMessage();const i=e.data.resultUri;this.socialProvider&&y.sendEvent({type:"track",event:"SOCIAL_LOGIN_REQUEST_USER_DATA",properties:{provider:this.socialProvider}}),await f.connectExternal({id:this.authConnector.id,type:this.authConnector.type,socialUri:i},this.authConnector.chain),this.socialProvider&&(x.setConnectedSocialProvider(this.socialProvider),y.sendEvent({type:"track",event:"SOCIAL_LOGIN_SUCCESS",properties:{provider:this.socialProvider}}))}}catch(i){this.error=!0,this.updateMessage(),this.socialProvider&&y.sendEvent({type:"track",event:"SOCIAL_LOGIN_ERROR",properties:{provider:this.socialProvider,message:h.parseError(i)}})}}else c.goBack(),C.showError("Untrusted Origin"),this.socialProvider&&y.sendEvent({type:"track",event:"SOCIAL_LOGIN_ERROR",properties:{provider:this.socialProvider,message:"Untrusted Origin"}})};$.EmbeddedWalletAbortController.signal.addEventListener("abort",()=>{this.closeSocialWindow()}),this.unsubscribe.push(v.subscribeChainProp("accountState",e=>{var t;if(e&&(this.socialProvider=e.socialProvider,e.socialWindow&&(this.socialWindow=e.socialWindow),e.address)){const i=null==(t=this.remoteFeatures)?void 0:t.multiWallet;e.address!==this.address&&(this.hasMultipleConnections&&i?(c.replace("ProfileWallets"),C.showSuccess("New Wallet Added"),this.address=e.address):(P.state.open||a.state.enableEmbedded)&&P.close())}}),a.subscribeKey("remoteFeatures",e=>{this.remoteFeatures=e})),this.authConnector&&this.connectSocial()}disconnectedCallback(){this.unsubscribe.forEach(e=>e()),window.removeEventListener("message",this.handleSocialConnection,!1);v.state.activeCaipAddress||!this.socialProvider||this.connecting||y.sendEvent({type:"track",event:"SOCIAL_LOGIN_CANCELED",properties:{provider:this.socialProvider}}),this.closeSocialWindow()}render(){return d`
      <wui-flex
        data-error=${w(this.error)}
        flexDirection="column"
        alignItems="center"
        .padding=${["10","5","5","5"]}
        gap="6"
      >
        <wui-flex justifyContent="center" alignItems="center">
          <wui-logo logo=${w(this.socialProvider)}></wui-logo>
          ${this.error?null:this.loaderTemplate()}
          <wui-icon-box color="error" icon="close" size="sm"></wui-icon-box>
        </wui-flex>
        <wui-flex flexDirection="column" alignItems="center" gap="2">
          <wui-text align="center" variant="lg-medium" color="primary"
            >Log in with
            <span class="capitalize">${this.socialProvider??"Social"}</span></wui-text
          >
          <wui-text align="center" variant="lg-regular" color=${this.error?"error":"secondary"}
            >${this.message}</wui-text
          ></wui-flex
        >
      </wui-flex>
    `}loaderTemplate(){const e=E.state.themeVariables["--w3m-border-radius-master"],t=e?parseInt(e.replace("px",""),10):4;return d`<wui-loading-thumbnail radius=${9*t}></wui-loading-thumbnail>`}parseURLError(e){try{const t="error=",i=e.indexOf(t);if(-1===i)return null;return e.substring(i+t.length)}catch{return null}}connectSocial(){const e=setInterval(()=>{var t;(null==(t=this.socialWindow)?void 0:t.closed)&&(this.connecting||"ConnectingSocial"!==c.state.view||c.goBack(),clearInterval(e))},1e3);window.addEventListener("message",this.handleSocialConnection,!1)}updateMessage(){this.error?this.message="Something went wrong":this.connecting?this.message="Retrieving user data":this.message="Connect in the provider window"}handleSocialError(e){this.error=!0,this.updateMessage(),this.socialProvider&&y.sendEvent({type:"track",event:"SOCIAL_LOGIN_ERROR",properties:{provider:this.socialProvider,message:e}}),this.closeSocialWindow()}closeSocialWindow(){this.socialWindow&&(this.socialWindow.close(),v.setAccountProp("socialWindow",void 0,v.state.activeChain))}};U.styles=A,T([i()],U.prototype,"socialProvider",void 0),T([i()],U.prototype,"socialWindow",void 0),T([i()],U.prototype,"error",void 0),T([i()],U.prototype,"connecting",void 0),T([i()],U.prototype,"message",void 0),T([i()],U.prototype,"remoteFeatures",void 0),U=T([o("w3m-connecting-social-view")],U);const _=e`
  wui-shimmer {
    width: 100%;
    aspect-ratio: 1 / 1;
    border-radius: ${({borderRadius:e})=>e[4]};
  }

  wui-qr-code {
    opacity: 0;
    animation-duration: ${({durations:e})=>e.xl};
    animation-timing-function: ${({easings:e})=>e["ease-out-power-2"]};
    animation-name: fade-in;
    animation-fill-mode: forwards;
  }

  wui-logo {
    width: 80px;
    height: 80px;
    border-radius: ${({borderRadius:e})=>e[8]};
  }

  wui-flex:first-child:not(:only-child) {
    position: relative;
  }

  wui-loading-thumbnail {
    position: absolute;
  }

  wui-icon-box {
    position: absolute;
    right: calc(${({spacing:e})=>e[1]} * -1);
    bottom: calc(${({spacing:e})=>e[1]} * -1);
    opacity: 0;
    transform: scale(0.5);
    transition:
      opacity ${({durations:e})=>e.lg} ${({easings:e})=>e["ease-out-power-2"]},
      transform ${({durations:e})=>e.lg}
        ${({easings:e})=>e["ease-out-power-2"]};
    will-change: opacity, transform;
  }

  @keyframes fade-in {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
`;var F=function(e,t,i,o){var r,s=arguments.length,a=s<3?t:null===o?o=Object.getOwnPropertyDescriptor(t,i):o;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)a=Reflect.decorate(e,t,i,o);else for(var n=e.length-1;n>=0;n--)(r=e[n])&&(a=(s<3?r(a):s>3?r(t,i,a):r(t,i))||a);return s>3&&a&&Object.defineProperty(t,i,a),a};let W=class extends r{constructor(){var e,t;super(),this.unsubscribe=[],this.timeout=void 0,this.socialProvider=null==(e=v.getAccountData())?void 0:e.socialProvider,this.uri=null==(t=v.getAccountData())?void 0:t.farcasterUrl,this.ready=!1,this.loading=!1,this.remoteFeatures=a.state.remoteFeatures,this.authConnector=s.getAuthConnector(),this.forceUpdate=()=>{this.requestUpdate()},this.unsubscribe.push(v.subscribeChainProp("accountState",e=>{this.socialProvider=null==e?void 0:e.socialProvider,this.uri=null==e?void 0:e.farcasterUrl,this.connectFarcaster()}),a.subscribeKey("remoteFeatures",e=>{this.remoteFeatures=e})),window.addEventListener("resize",this.forceUpdate)}disconnectedCallback(){super.disconnectedCallback(),clearTimeout(this.timeout),window.removeEventListener("resize",this.forceUpdate);!v.state.activeCaipAddress&&this.socialProvider&&(this.uri||this.loading)&&y.sendEvent({type:"track",event:"SOCIAL_LOGIN_CANCELED",properties:{provider:this.socialProvider}})}render(){return this.onRenderProxy(),d`${this.platformTemplate()}`}platformTemplate(){return h.isMobile()?d`${this.mobileTemplate()}`:d`${this.desktopTemplate()}`}desktopTemplate(){return this.loading?d`${this.loadingTemplate()}`:d`${this.qrTemplate()}`}qrTemplate(){return d` <wui-flex
      flexDirection="column"
      alignItems="center"
      .padding=${["0","5","5","5"]}
      gap="5"
    >
      <wui-shimmer width="100%"> ${this.qrCodeTemplate()} </wui-shimmer>

      <wui-text variant="lg-medium" color="primary"> Scan this QR Code with your phone </wui-text>
      ${this.copyTemplate()}
    </wui-flex>`}loadingTemplate(){return d`
      <wui-flex
        flexDirection="column"
        alignItems="center"
        .padding=${["5","5","5","5"]}
        gap="5"
      >
        <wui-flex justifyContent="center" alignItems="center">
          <wui-logo logo="farcaster"></wui-logo>
          ${this.loaderTemplate()}
          <wui-icon-box color="error" icon="close" size="sm"></wui-icon-box>
        </wui-flex>
        <wui-flex flexDirection="column" alignItems="center" gap="2">
          <wui-text align="center" variant="md-medium" color="primary">
            Loading user data
          </wui-text>
          <wui-text align="center" variant="sm-regular" color="secondary">
            Please wait a moment while we load your data.
          </wui-text>
        </wui-flex>
      </wui-flex>
    `}mobileTemplate(){return d` <wui-flex
      flexDirection="column"
      alignItems="center"
      .padding=${["10","5","5","5"]}
      gap="5"
    >
      <wui-flex justifyContent="center" alignItems="center">
        <wui-logo logo="farcaster"></wui-logo>
        ${this.loaderTemplate()}
        <wui-icon-box
          color="error"
          icon="close"
          size="sm"
        ></wui-icon-box>
      </wui-flex>
      <wui-flex flexDirection="column" alignItems="center" gap="2">
        <wui-text align="center" variant="md-medium" color="primary"
          >Continue in Farcaster</span></wui-text
        >
        <wui-text align="center" variant="sm-regular" color="secondary"
          >Accept connection request in the app</wui-text
        ></wui-flex
      >
      ${this.mobileLinkTemplate()}
    </wui-flex>`}loaderTemplate(){const e=E.state.themeVariables["--w3m-border-radius-master"],t=e?parseInt(e.replace("px",""),10):4;return d`<wui-loading-thumbnail radius=${9*t}></wui-loading-thumbnail>`}async connectFarcaster(){var e,t;if(this.authConnector)try{await(null==(e=this.authConnector)?void 0:e.provider.connectFarcaster()),this.socialProvider&&(x.setConnectedSocialProvider(this.socialProvider),y.sendEvent({type:"track",event:"SOCIAL_LOGIN_REQUEST_USER_DATA",properties:{provider:this.socialProvider}})),this.loading=!0;const i=f.getConnections(this.authConnector.chain).length>0;await f.connectExternal(this.authConnector,this.authConnector.chain);const o=null==(t=this.remoteFeatures)?void 0:t.multiWallet;this.socialProvider&&y.sendEvent({type:"track",event:"SOCIAL_LOGIN_SUCCESS",properties:{provider:this.socialProvider}}),this.loading=!1,i&&o?(c.replace("ProfileWallets"),C.showSuccess("New Wallet Added")):P.close()}catch(i){this.socialProvider&&y.sendEvent({type:"track",event:"SOCIAL_LOGIN_ERROR",properties:{provider:this.socialProvider,message:h.parseError(i)}}),c.goBack(),C.showError(i)}}mobileLinkTemplate(){return d`<wui-button
      size="md"
      ?loading=${this.loading}
      ?disabled=${!this.uri||this.loading}
      @click=${()=>{this.uri&&h.openHref(this.uri,"_blank")}}
    >
      Open farcaster</wui-button
    >`}onRenderProxy(){!this.ready&&this.uri&&(this.timeout=setTimeout(()=>{this.ready=!0},200))}qrCodeTemplate(){if(!this.uri||!this.ready)return null;const e=this.getBoundingClientRect().width-40;return d` <wui-qr-code
      size=${e}
      theme=${E.state.themeMode}
      uri=${this.uri}
      ?farcaster=${!0}
      data-testid="wui-qr-code"
      color=${w(E.state.themeVariables["--w3m-qr-color"])}
    ></wui-qr-code>`}copyTemplate(){const e=!this.uri||!this.ready;return d`<wui-button
      .disabled=${e}
      @click=${this.onCopyUri}
      variant="neutral-secondary"
      size="sm"
      data-testid="copy-wc2-uri"
    >
      <wui-icon size="sm" color="default" slot="iconRight" name="copy"></wui-icon>
      Copy link
    </wui-button>`}onCopyUri(){try{this.uri&&(h.copyToClopboard(this.uri),C.showSuccess("Link copied"))}catch{C.showError("Failed to copy")}}};W.styles=_,F([i()],W.prototype,"socialProvider",void 0),F([i()],W.prototype,"uri",void 0),F([i()],W.prototype,"ready",void 0),F([i()],W.prototype,"loading",void 0),F([i()],W.prototype,"remoteFeatures",void 0),W=F([o("w3m-connecting-farcaster-view")],W);export{R as W3mConnectSocialsView,W as W3mConnectingFarcasterView,U as W3mConnectingSocialView};
