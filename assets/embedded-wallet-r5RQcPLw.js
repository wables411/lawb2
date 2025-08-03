import{i as e,a as t,M as i,x as s,k as r,T as a,K as n,h as o,c as l,l as c,r as u,n as d,o as m,F as h,L as p,P as g,A as f,f as w,Q as b,E as y,g as v,C as x,W as S,S as T,V as R,R as N}from"./appkit-vendor-C7zlPPaF.js";import"./wagmi-vendor-dPYIeXYB.js";import"./react-vendor-CFG7hIzY.js";const $=e`
  div {
    width: 100%;
  }

  [data-ready='false'] {
    transform: scale(1.05);
  }

  @media (max-width: 430px) {
    [data-ready='false'] {
      transform: translateY(-50px);
    }
  }
`;var E=function(e,t,i,s){var r,a=arguments.length,n=a<3?t:null===s?s=Object.getOwnPropertyDescriptor(t,i):s;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)n=Reflect.decorate(e,t,i,s);else for(var o=e.length-1;o>=0;o--)(r=e[o])&&(n=(a<3?r(n):a>3?r(t,i,n):r(t,i))||n);return a>3&&n&&Object.defineProperty(t,i,n),n};let C=class extends t{constructor(){super(),this.bodyObserver=void 0,this.unsubscribe=[],this.iframe=document.getElementById("w3m-iframe"),this.ready=!1,this.unsubscribe.push(i.subscribeKey("open",e=>{e||this.onHideIframe()}),i.subscribeKey("shake",e=>{this.iframe.style.animation=e?"w3m-shake 500ms var(--wui-ease-out-power-2)":"none"}))}disconnectedCallback(){this.onHideIframe(),this.unsubscribe.forEach(e=>e()),this.bodyObserver?.unobserve(window.document.body)}async firstUpdated(){await this.syncTheme(),this.iframe.style.display="block";const e=this?.renderRoot?.querySelector("div");this.bodyObserver=new ResizeObserver(t=>{const i=t?.[0]?.contentBoxSize,s=i?.[0]?.inlineSize;this.iframe.style.height="600px",e.style.height="600px",s&&s<=430?(this.iframe.style.width="100%",this.iframe.style.left="0px",this.iframe.style.bottom="0px",this.iframe.style.top="unset"):(this.iframe.style.width="360px",this.iframe.style.left="calc(50% - 180px)",this.iframe.style.top="calc(50% - 300px + 32px)",this.iframe.style.bottom="unset"),this.ready=!0,this.onShowIframe()}),this.bodyObserver.observe(window.document.body)}render(){return s`<div data-ready=${this.ready} id="w3m-frame-container"></div>`}onShowIframe(){const e=window.innerWidth<=430;this.iframe.style.animation=e?"w3m-iframe-zoom-in-mobile 200ms var(--wui-ease-out-power-2)":"w3m-iframe-zoom-in 200ms var(--wui-ease-out-power-2)"}onHideIframe(){this.iframe.style.display="none",this.iframe.style.animation="w3m-iframe-fade-out 200ms var(--wui-ease-out-power-2)"}async syncTheme(){const e=r.getAuthConnector();if(e){const t=a.getSnapshot().themeMode,i=a.getSnapshot().themeVariables;await e.provider.syncTheme({themeVariables:i,w3mThemeVariables:n(i,t)})}}};C.styles=$,E([o()],C.prototype,"ready",void 0),C=E([l("w3m-approve-transaction-view")],C);let k=class extends t{render(){return s`
      <wui-flex flexDirection="column" alignItems="center" gap="xl" padding="xl">
        <wui-text variant="paragraph-400" color="fg-100">Follow the instructions on</wui-text>
        <wui-chip
          icon="externalLink"
          variant="fill"
          href=${c.SECURE_SITE_DASHBOARD}
          imageSrc=${c.SECURE_SITE_FAVICON}
          data-testid="w3m-secure-website-button"
        >
        </wui-chip>
        <wui-text variant="small-400" color="fg-200">
          You will have to reconnect for security reasons
        </wui-text>
      </wui-flex>
    `}};k=function(e,t,i,s){var r,a=arguments.length,n=a<3?t:null===s?s=Object.getOwnPropertyDescriptor(t,i):s;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)n=Reflect.decorate(e,t,i,s);else for(var o=e.length-1;o>=0;o--)(r=e[o])&&(n=(a<3?r(n):a>3?r(t,i,n):r(t,i))||n);return a>3&&n&&Object.defineProperty(t,i,n),n}([l("w3m-upgrade-wallet-view")],k);const A=e`
  :host {
    position: relative;
    width: 100%;
    display: inline-block;
    color: var(--wui-color-fg-275);
  }

  .error {
    margin: var(--wui-spacing-xxs) var(--wui-spacing-m) var(--wui-spacing-0) var(--wui-spacing-m);
  }

  .base-name {
    position: absolute;
    right: 45px;
    top: 15px;
    text-align: right;
  }
`;var I=function(e,t,i,s){var r,a=arguments.length,n=a<3?t:null===s?s=Object.getOwnPropertyDescriptor(t,i):s;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)n=Reflect.decorate(e,t,i,s);else for(var o=e.length-1;o>=0;o--)(r=e[o])&&(n=(a<3?r(n):a>3?r(t,i,n):r(t,i))||n);return a>3&&n&&Object.defineProperty(t,i,n),n};let O=class extends t{constructor(){super(...arguments),this.disabled=!1,this.loading=!1}render(){return s`
      <wui-input-text
        value=${m(this.value)}
        ?disabled=${this.disabled}
        .value=${this.value||""}
        data-testid="wui-ens-input"
        inputRightPadding="5xl"
      >
        ${this.baseNameTemplate()} ${this.errorTemplate()}${this.loadingTemplate()}
      </wui-input-text>
    `}baseNameTemplate(){return s`<wui-text variant="paragraph-400" color="fg-200" class="base-name">
      ${h.WC_NAME_SUFFIX}
    </wui-text>`}loadingTemplate(){return this.loading?s`<wui-loading-spinner size="md" color="accent-100"></wui-loading-spinner>`:null}errorTemplate(){return this.errorMessage?s`<wui-text variant="tiny-500" color="error-100" class="error"
        >${this.errorMessage}</wui-text
      >`:null}};O.styles=[u,A],I([d()],O.prototype,"errorMessage",void 0),I([d({type:Boolean})],O.prototype,"disabled",void 0),I([d()],O.prototype,"value",void 0),I([d({type:Boolean})],O.prototype,"loading",void 0),O=I([l("wui-ens-input")],O);const _=e`
  wui-flex {
    width: 100%;
  }

  .suggestion {
    background: var(--wui-color-gray-glass-002);
    border-radius: var(--wui-border-radius-xs);
  }

  .suggestion:hover {
    background-color: var(--wui-color-gray-glass-005);
    cursor: pointer;
  }

  .suggested-name {
    max-width: 75%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  form {
    width: 100%;
  }

  wui-icon-link {
    position: absolute;
    right: 20px;
    transform: translateY(11px);
  }
`;var j=function(e,t,i,s){var r,a=arguments.length,n=a<3?t:null===s?s=Object.getOwnPropertyDescriptor(t,i):s;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)n=Reflect.decorate(e,t,i,s);else for(var o=e.length-1;o>=0;o--)(r=e[o])&&(n=(a<3?r(n):a>3?r(t,i,n):r(t,i))||n);return a>3&&n&&Object.defineProperty(t,i,n),n};let U=class extends t{constructor(){super(),this.formRef=p(),this.usubscribe=[],this.name="",this.error="",this.loading=g.state.loading,this.suggestions=g.state.suggestions,this.registered=!1,this.profileName=f.state.profileName,this.onDebouncedNameInputChange=w.debounce(e=>{g.validateName(e)?(this.error="",this.name=e,g.getSuggestions(e),g.isNameRegistered(e).then(e=>{this.registered=e})):e.length<4?this.error="Name must be at least 4 characters long":this.error="Can only contain letters, numbers and - characters"}),this.usubscribe.push(g.subscribe(e=>{this.suggestions=e.suggestions,this.loading=e.loading}),f.subscribeKey("profileName",e=>{this.profileName=e,e&&(this.error="You already own a name")}))}firstUpdated(){this.formRef.value?.addEventListener("keydown",this.onEnterKey.bind(this))}disconnectedCallback(){super.disconnectedCallback(),this.usubscribe.forEach(e=>e()),this.formRef.value?.removeEventListener("keydown",this.onEnterKey.bind(this))}render(){return s`
      <wui-flex
        flexDirection="column"
        alignItems="center"
        gap="m"
        .padding=${["0","s","m","s"]}
      >
        <form ${b(this.formRef)} @submit=${this.onSubmitName.bind(this)}>
          <wui-ens-input
            @inputChange=${this.onNameInputChange.bind(this)}
            .errorMessage=${this.error}
            .value=${this.name}
          >
          </wui-ens-input>
          ${this.submitButtonTemplate()}
          <input type="submit" hidden />
        </form>
        ${this.templateSuggestions()}
      </wui-flex>
    `}submitButtonTemplate(){return this.isAllowedToSubmit()?s`
          <wui-icon-link
            size="sm"
            icon="chevronRight"
            iconcolor="accent-100"
            @click=${this.onSubmitName.bind(this)}
          >
          </wui-icon-link>
        `:null}onSelectSuggestion(e){return()=>{this.name=e,this.registered=!1,this.requestUpdate()}}onNameInputChange(e){this.onDebouncedNameInputChange(e.detail)}nameSuggestionTagTemplate(){return this.loading?s`<wui-loading-spinner size="lg" color="fg-100"></wui-loading-spinner>`:this.registered?s`<wui-tag variant="shade" size="lg">Registered</wui-tag>`:s`<wui-tag variant="success" size="lg">Available</wui-tag>`}templateSuggestions(){if(!this.name||this.name.length<4||this.error)return null;const e=this.registered?this.suggestions.filter(e=>e.name!==this.name):[];return s`<wui-flex flexDirection="column" gap="xxs" alignItems="center">
      <wui-flex
        data-testid="account-name-suggestion"
        .padding=${["m","m","m","m"]}
        justifyContent="space-between"
        class="suggestion"
        @click=${this.onSubmitName.bind(this)}
      >
        <wui-text color="fg-100" variant="paragraph-400" class="suggested-name">
          ${this.name}</wui-text
        >${this.nameSuggestionTagTemplate()}
      </wui-flex>
      ${e.map(e=>this.availableNameTemplate(e.name))}
    </wui-flex>`}availableNameTemplate(e){return s` <wui-flex
      data-testid="account-name-suggestion"
      .padding=${["m","m","m","m"]}
      justifyContent="space-between"
      class="suggestion"
      @click=${this.onSelectSuggestion(e)}
    >
      <wui-text color="fg-100" variant="paragraph-400" class="suggested-name">
        ${e}
      </wui-text>
      <wui-tag variant="success" size="lg">Available</wui-tag>
    </wui-flex>`}isAllowedToSubmit(){return!this.loading&&!this.registered&&!this.error&&!this.profileName&&g.validateName(this.name)}async onSubmitName(){try{if(!this.isAllowedToSubmit())return;const e=`${this.name}${h.WC_NAME_SUFFIX}`;y.sendEvent({type:"track",event:"REGISTER_NAME_INITIATED",properties:{isSmartAccount:v(x.state.activeChain)===S.ACCOUNT_TYPES.SMART_ACCOUNT,ensName:e}}),await g.registerName(e),y.sendEvent({type:"track",event:"REGISTER_NAME_SUCCESS",properties:{isSmartAccount:v(x.state.activeChain)===S.ACCOUNT_TYPES.SMART_ACCOUNT,ensName:e}})}catch(e){T.showError(e.message),y.sendEvent({type:"track",event:"REGISTER_NAME_ERROR",properties:{isSmartAccount:v(x.state.activeChain)===S.ACCOUNT_TYPES.SMART_ACCOUNT,ensName:`${this.name}${h.WC_NAME_SUFFIX}`,error:e?.message||"Unknown error"}})}}onEnterKey(e){"Enter"===e.key&&this.isAllowedToSubmit()&&this.onSubmitName()}};U.styles=_,j([d()],U.prototype,"errorMessage",void 0),j([o()],U.prototype,"name",void 0),j([o()],U.prototype,"error",void 0),j([o()],U.prototype,"loading",void 0),j([o()],U.prototype,"suggestions",void 0),j([o()],U.prototype,"registered",void 0),j([o()],U.prototype,"profileName",void 0),U=j([l("w3m-register-account-name-view")],U);const D=e`
  .continue-button-container {
    width: 100%;
  }
`;let M=class extends t{render(){return s`
      <wui-flex
        flexDirection="column"
        alignItems="center"
        gap="xxl"
        .padding=${["0","0","l","0"]}
      >
        ${this.onboardingTemplate()} ${this.buttonsTemplate()}
        <wui-link
          @click=${()=>{w.openHref(R.URLS.FAQ,"_blank")}}
        >
          Learn more
          <wui-icon color="inherit" slot="iconRight" name="externalLink"></wui-icon>
        </wui-link>
      </wui-flex>
    `}onboardingTemplate(){return s` <wui-flex
      flexDirection="column"
      gap="xxl"
      alignItems="center"
      .padding=${["0","xxl","0","xxl"]}
    >
      <wui-flex gap="s" alignItems="center" justifyContent="center">
        <wui-icon-box
          size="xl"
          iconcolor="success-100"
          backgroundcolor="success-100"
          icon="checkmark"
          background="opaque"
        ></wui-icon-box>
      </wui-flex>
      <wui-flex flexDirection="column" alignItems="center" gap="s">
        <wui-text align="center" variant="medium-600" color="fg-100">
          Account name chosen successfully
        </wui-text>
        <wui-text align="center" variant="paragraph-400" color="fg-100">
          You can now fund your account and trade crypto
        </wui-text>
      </wui-flex>
    </wui-flex>`}buttonsTemplate(){return s`<wui-flex
      .padding=${["0","2l","0","2l"]}
      gap="s"
      class="continue-button-container"
    >
      <wui-button fullWidth size="lg" borderRadius="xs" @click=${this.redirectToAccount.bind(this)}
        >Let's Go!
      </wui-button>
    </wui-flex>`}redirectToAccount(){N.replace("Account")}};M.styles=D,M=function(e,t,i,s){var r,a=arguments.length,n=a<3?t:null===s?s=Object.getOwnPropertyDescriptor(t,i):s;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)n=Reflect.decorate(e,t,i,s);else for(var o=e.length-1;o>=0;o--)(r=e[o])&&(n=(a<3?r(n):a>3?r(t,i,n):r(t,i))||n);return a>3&&n&&Object.defineProperty(t,i,n),n}([l("w3m-register-account-name-success-view")],M);export{C as W3mApproveTransactionView,M as W3mRegisterAccountNameSuccess,U as W3mRegisterAccountNameView,k as W3mUpgradeWalletView};
