import{q as e,x as t,al as i,am as r,aa as o,V as s,M as a,y as n,a4 as c,O as l,v as u,u as d,e as p,L as h,E as m,d as w,W as g,R as y,f as v,C as f,T as b,S as x,k as C}from"./index-rJTEhX-0.js";import"./wagmi-vendor-O52zNBec.js";import"./react-vendor-ZyuiJZO_.js";import"./chess-vendor-JTxzwGi1.js";import"./ui-vendor-BgPmeekb.js";const k=e`
  :host > wui-grid {
    max-height: 360px;
    overflow: auto;
  }

  wui-flex {
    transition: opacity var(--wui-ease-out-power-1) var(--wui-duration-md);
    will-change: opacity;
  }

  wui-grid::-webkit-scrollbar {
    display: none;
  }

  wui-flex.disabled {
    opacity: 0.3;
    pointer-events: none;
    user-select: none;
  }
`;var $=function(e,t,i,r){var o,s=arguments.length,a=s<3?t:null===r?r=Object.getOwnPropertyDescriptor(t,i):r;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)a=Reflect.decorate(e,t,i,r);else for(var n=e.length-1;n>=0;n--)(o=e[n])&&(a=(s<3?o(a):s>3?o(t,i,a):o(t,i))||a);return s>3&&a&&Object.defineProperty(t,i,a),a};let R=class extends t{constructor(){super(),this.unsubscribe=[],this.selectedCurrency=i.state.paymentCurrency,this.currencies=i.state.paymentCurrencies,this.currencyImages=r.state.currencyImages,this.checked=o.state.isLegalCheckboxChecked,this.unsubscribe.push(i.subscribe(e=>{this.selectedCurrency=e.paymentCurrency,this.currencies=e.paymentCurrencies}),r.subscribeKey("currencyImages",e=>this.currencyImages=e),o.subscribeKey("isLegalCheckboxChecked",e=>{this.checked=e}))}disconnectedCallback(){this.unsubscribe.forEach(e=>e())}render(){var e;const{termsConditionsUrl:t,privacyPolicyUrl:i}=s.state,r=null==(e=s.state.features)?void 0:e.legalCheckbox,o=Boolean(t||i)&&Boolean(r)&&!this.checked;return n`
      <w3m-legal-checkbox></w3m-legal-checkbox>
      <wui-flex
        flexDirection="column"
        .padding=${["0","s","s","s"]}
        gap="xs"
        class=${a(o?"disabled":void 0)}
      >
        ${this.currenciesTemplate(o)}
      </wui-flex>
      <w3m-legal-footer></w3m-legal-footer>
    `}currenciesTemplate(e=!1){return this.currencies.map(t=>{var i;return n`
        <wui-list-item
          imageSrc=${a(null==(i=this.currencyImages)?void 0:i[t.id])}
          @click=${()=>this.selectCurrency(t)}
          variant="image"
          tabIdx=${a(e?-1:void 0)}
        >
          <wui-text variant="paragraph-500" color="fg-100">${t.id}</wui-text>
        </wui-list-item>
      `})}selectCurrency(e){e&&(i.setPaymentCurrency(e),c.close())}};R.styles=k,$([l()],R.prototype,"selectedCurrency",void 0),$([l()],R.prototype,"currencies",void 0),$([l()],R.prototype,"currencyImages",void 0),$([l()],R.prototype,"checked",void 0),R=$([u("w3m-onramp-fiat-select-view")],R);const P=e`
  button {
    padding: var(--wui-spacing-s);
    border-radius: var(--wui-border-radius-xs);
    border: none;
    outline: none;
    background-color: var(--wui-color-gray-glass-002);
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: flex-start;
    gap: var(--wui-spacing-s);
    transition: background-color var(--wui-ease-out-power-1) var(--wui-duration-md);
    will-change: background-color;
  }

  button:hover {
    background-color: var(--wui-color-gray-glass-005);
  }

  .provider-image {
    width: var(--wui-spacing-3xl);
    min-width: var(--wui-spacing-3xl);
    height: var(--wui-spacing-3xl);
    border-radius: calc(var(--wui-border-radius-xs) - calc(var(--wui-spacing-s) / 2));
    position: relative;
    overflow: hidden;
  }

  .provider-image::after {
    content: '';
    display: block;
    width: 100%;
    height: 100%;
    position: absolute;
    inset: 0;
    border-radius: calc(var(--wui-border-radius-xs) - calc(var(--wui-spacing-s) / 2));
    box-shadow: inset 0 0 0 1px var(--wui-color-gray-glass-005);
  }

  .network-icon {
    width: var(--wui-spacing-m);
    height: var(--wui-spacing-m);
    border-radius: calc(var(--wui-spacing-m) / 2);
    overflow: hidden;
    box-shadow:
      0 0 0 3px var(--wui-color-gray-glass-002),
      0 0 0 3px var(--wui-color-modal-bg);
    transition: box-shadow var(--wui-ease-out-power-1) var(--wui-duration-md);
    will-change: box-shadow;
  }

  button:hover .network-icon {
    box-shadow:
      0 0 0 3px var(--wui-color-gray-glass-005),
      0 0 0 3px var(--wui-color-modal-bg);
  }
`;var I=function(e,t,i,r){var o,s=arguments.length,a=s<3?t:null===r?r=Object.getOwnPropertyDescriptor(t,i):r;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)a=Reflect.decorate(e,t,i,r);else for(var n=e.length-1;n>=0;n--)(o=e[n])&&(a=(s<3?o(a):s>3?o(t,i,a):o(t,i))||a);return s>3&&a&&Object.defineProperty(t,i,a),a};let O=class extends t{constructor(){super(...arguments),this.disabled=!1,this.color="inherit",this.label="",this.feeRange="",this.loading=!1,this.onClick=null}render(){return n`
      <button ?disabled=${this.disabled} @click=${this.onClick} ontouchstart>
        <wui-visual name=${a(this.name)} class="provider-image"></wui-visual>
        <wui-flex flexDirection="column" gap="4xs">
          <wui-text variant="paragraph-500" color="fg-100">${this.label}</wui-text>
          <wui-flex alignItems="center" justifyContent="flex-start" gap="l">
            <wui-text variant="tiny-500" color="fg-100">
              <wui-text variant="tiny-400" color="fg-200">Fees</wui-text>
              ${this.feeRange}
            </wui-text>
            <wui-flex gap="xxs">
              <wui-icon name="bank" size="xs" color="fg-150"></wui-icon>
              <wui-icon name="card" size="xs" color="fg-150"></wui-icon>
            </wui-flex>
            ${this.networksTemplate()}
          </wui-flex>
        </wui-flex>
        ${this.loading?n`<wui-loading-spinner color="fg-200" size="md"></wui-loading-spinner>`:n`<wui-icon name="chevronRight" color="fg-200" size="sm"></wui-icon>`}
      </button>
    `}networksTemplate(){var e;const t=p.getAllRequestedCaipNetworks(),i=null==(e=null==t?void 0:t.filter(e=>{var t;return null==(t=null==e?void 0:e.assets)?void 0:t.imageId}))?void 0:e.slice(0,5);return n`
      <wui-flex class="networks">
        ${null==i?void 0:i.map(e=>n`
            <wui-flex class="network-icon">
              <wui-image src=${a(h.getNetworkImage(e))}></wui-image>
            </wui-flex>
          `)}
      </wui-flex>
    `}};O.styles=[P],I([d({type:Boolean})],O.prototype,"disabled",void 0),I([d()],O.prototype,"color",void 0),I([d()],O.prototype,"name",void 0),I([d()],O.prototype,"label",void 0),I([d()],O.prototype,"feeRange",void 0),I([d({type:Boolean})],O.prototype,"loading",void 0),I([d()],O.prototype,"onClick",void 0),O=I([u("w3m-onramp-provider-item")],O);const A=e`
  wui-flex {
    border-top: 1px solid var(--wui-color-gray-glass-005);
  }

  a {
    text-decoration: none;
    color: var(--wui-color-fg-175);
    font-weight: 500;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--wui-spacing-3xs);
  }
`;let j=class extends t{render(){const{termsConditionsUrl:e,privacyPolicyUrl:t}=s.state;return e||t?n`
      <wui-flex
        .padding=${["m","s","s","s"]}
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        gap="s"
      >
        <wui-text color="fg-250" variant="small-400" align="center">
          We work with the best providers to give you the lowest fees and best support. More options
          coming soon!
        </wui-text>

        ${this.howDoesItWorkTemplate()}
      </wui-flex>
    `:null}howDoesItWorkTemplate(){return n` <wui-link @click=${this.onWhatIsBuy.bind(this)}>
      <wui-icon size="xs" color="accent-100" slot="iconLeft" name="helpCircle"></wui-icon>
      How does it work?
    </wui-link>`}onWhatIsBuy(){m.sendEvent({type:"track",event:"SELECT_WHAT_IS_A_BUY",properties:{isSmartAccount:w(p.state.activeChain)===g.ACCOUNT_TYPES.SMART_ACCOUNT}}),y.push("WhatIsABuy")}};j.styles=[A],j=function(e,t,i,r){var o,s=arguments.length,a=s<3?t:null===r?r=Object.getOwnPropertyDescriptor(t,i):r;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)a=Reflect.decorate(e,t,i,r);else for(var n=e.length-1;n>=0;n--)(o=e[n])&&(a=(s<3?o(a):s>3?o(t,i,a):o(t,i))||a);return s>3&&a&&Object.defineProperty(t,i,a),a}([u("w3m-onramp-providers-footer")],j);var T=function(e,t,i,r){var o,s=arguments.length,a=s<3?t:null===r?r=Object.getOwnPropertyDescriptor(t,i):r;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)a=Reflect.decorate(e,t,i,r);else for(var n=e.length-1;n>=0;n--)(o=e[n])&&(a=(s<3?o(a):s>3?o(t,i,a):o(t,i))||a);return s>3&&a&&Object.defineProperty(t,i,a),a};let B=class extends t{constructor(){super(),this.unsubscribe=[],this.providers=i.state.providers,this.unsubscribe.push(i.subscribeKey("providers",e=>{this.providers=e}))}render(){return n`
      <wui-flex flexDirection="column" .padding=${["0","s","s","s"]} gap="xs">
        ${this.onRampProvidersTemplate()}
      </wui-flex>
      <w3m-onramp-providers-footer></w3m-onramp-providers-footer>
    `}onRampProvidersTemplate(){return this.providers.filter(e=>e.supportedChains.includes(p.state.activeChain??"eip155")).map(e=>n`
          <w3m-onramp-provider-item
            label=${e.label}
            name=${e.name}
            feeRange=${e.feeRange}
            @click=${()=>{this.onClickProvider(e)}}
            ?disabled=${!e.url}
            data-testid=${`onramp-provider-${e.name}`}
          ></w3m-onramp-provider-item>
        `)}onClickProvider(e){var t;i.setSelectedProvider(e),y.push("BuyInProgress"),v.openHref((null==(t=i.state.selectedProvider)?void 0:t.url)||e.url,"popupWindow","width=600,height=800,scrollbars=yes"),m.sendEvent({type:"track",event:"SELECT_BUY_PROVIDER",properties:{provider:e.name,isSmartAccount:w(p.state.activeChain)===g.ACCOUNT_TYPES.SMART_ACCOUNT}})}};T([l()],B.prototype,"providers",void 0),B=T([u("w3m-onramp-providers-view")],B);const D=e`
  :host > wui-grid {
    max-height: 360px;
    overflow: auto;
  }

  wui-flex {
    transition: opacity var(--wui-ease-out-power-1) var(--wui-duration-md);
    will-change: opacity;
  }

  wui-grid::-webkit-scrollbar {
    display: none;
  }

  wui-flex.disabled {
    opacity: 0.3;
    pointer-events: none;
    user-select: none;
  }
`;var E=function(e,t,i,r){var o,s=arguments.length,a=s<3?t:null===r?r=Object.getOwnPropertyDescriptor(t,i):r;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)a=Reflect.decorate(e,t,i,r);else for(var n=e.length-1;n>=0;n--)(o=e[n])&&(a=(s<3?o(a):s>3?o(t,i,a):o(t,i))||a);return s>3&&a&&Object.defineProperty(t,i,a),a};let S=class extends t{constructor(){super(),this.unsubscribe=[],this.selectedCurrency=i.state.purchaseCurrencies,this.tokens=i.state.purchaseCurrencies,this.tokenImages=r.state.tokenImages,this.checked=o.state.isLegalCheckboxChecked,this.unsubscribe.push(i.subscribe(e=>{this.selectedCurrency=e.purchaseCurrencies,this.tokens=e.purchaseCurrencies}),r.subscribeKey("tokenImages",e=>this.tokenImages=e),o.subscribeKey("isLegalCheckboxChecked",e=>{this.checked=e}))}disconnectedCallback(){this.unsubscribe.forEach(e=>e())}render(){var e;const{termsConditionsUrl:t,privacyPolicyUrl:i}=s.state,r=null==(e=s.state.features)?void 0:e.legalCheckbox,o=Boolean(t||i)&&Boolean(r)&&!this.checked;return n`
      <w3m-legal-checkbox></w3m-legal-checkbox>
      <wui-flex
        flexDirection="column"
        .padding=${["0","s","s","s"]}
        gap="xs"
        class=${a(o?"disabled":void 0)}
      >
        ${this.currenciesTemplate(o)}
      </wui-flex>
      <w3m-legal-footer></w3m-legal-footer>
    `}currenciesTemplate(e=!1){return this.tokens.map(t=>{var i;return n`
        <wui-list-item
          imageSrc=${a(null==(i=this.tokenImages)?void 0:i[t.symbol])}
          @click=${()=>this.selectToken(t)}
          variant="image"
          tabIdx=${a(e?-1:void 0)}
        >
          <wui-flex gap="3xs" alignItems="center">
            <wui-text variant="paragraph-500" color="fg-100">${t.name}</wui-text>
            <wui-text variant="small-400" color="fg-200">${t.symbol}</wui-text>
          </wui-flex>
        </wui-list-item>
      `})}selectToken(e){e&&(i.setPurchaseCurrency(e),c.close())}};S.styles=D,E([l()],S.prototype,"selectedCurrency",void 0),E([l()],S.prototype,"tokens",void 0),E([l()],S.prototype,"tokenImages",void 0),E([l()],S.prototype,"checked",void 0),S=E([u("w3m-onramp-token-select-view")],S);const U=e`
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
`;var L=function(e,t,i,r){var o,s=arguments.length,a=s<3?t:null===r?r=Object.getOwnPropertyDescriptor(t,i):r;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)a=Reflect.decorate(e,t,i,r);else for(var n=e.length-1;n>=0;n--)(o=e[n])&&(a=(s<3?o(a):s>3?o(t,i,a):o(t,i))||a);return s>3&&a&&Object.defineProperty(t,i,a),a};let z=class extends t{constructor(){super(),this.unsubscribe=[],this.selectedOnRampProvider=i.state.selectedProvider,this.uri=f.state.wcUri,this.ready=!1,this.showRetry=!1,this.buffering=!1,this.error=!1,this.isMobile=!1,this.onRetry=void 0,this.unsubscribe.push(i.subscribeKey("selectedProvider",e=>{this.selectedOnRampProvider=e}))}disconnectedCallback(){this.intervalId&&clearInterval(this.intervalId)}render(){var e,t;let i="Continue in external window";this.error?i="Buy failed":this.selectedOnRampProvider&&(i=`Buy in ${null==(e=this.selectedOnRampProvider)?void 0:e.label}`);const r=this.error?"Buy can be declined from your side or due to and error on the provider app":"We’ll notify you once your Buy is processed";return n`
      <wui-flex
        data-error=${a(this.error)}
        data-retry=${this.showRetry}
        flexDirection="column"
        alignItems="center"
        .padding=${["3xl","xl","xl","xl"]}
        gap="xl"
      >
        <wui-flex justifyContent="center" alignItems="center">
          <wui-visual
            name=${a(null==(t=this.selectedOnRampProvider)?void 0:t.name)}
            size="lg"
            class="provider-image"
          >
          </wui-visual>

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
            ${i}
          </wui-text>
          <wui-text align="center" variant="small-500" color="fg-200">${r}</wui-text>
        </wui-flex>

        ${this.error?this.tryAgainTemplate():null}
      </wui-flex>

      <wui-flex .padding=${["0","xl","xl","xl"]} justifyContent="center">
        <wui-link @click=${this.onCopyUri} color="fg-200">
          <wui-icon size="xs" color="fg-200" slot="iconLeft" name="copy"></wui-icon>
          Copy link
        </wui-link>
      </wui-flex>
    `}onTryAgain(){this.selectedOnRampProvider&&(this.error=!1,v.openHref(this.selectedOnRampProvider.url,"popupWindow","width=600,height=800,scrollbars=yes"))}tryAgainTemplate(){var e;return(null==(e=this.selectedOnRampProvider)?void 0:e.url)?n`<wui-button size="md" variant="accent" @click=${this.onTryAgain.bind(this)}>
      <wui-icon color="inherit" slot="iconLeft" name="refresh"></wui-icon>
      Try again
    </wui-button>`:null}loaderTemplate(){const e=b.state.themeVariables["--w3m-border-radius-master"],t=e?parseInt(e.replace("px",""),10):4;return n`<wui-loading-thumbnail radius=${9*t}></wui-loading-thumbnail>`}onCopyUri(){var e;if(!(null==(e=this.selectedOnRampProvider)?void 0:e.url))return x.showError("No link found"),void y.goBack();try{v.copyToClopboard(this.selectedOnRampProvider.url),x.showSuccess("Link copied")}catch{x.showError("Failed to copy")}}};z.styles=U,L([l()],z.prototype,"intervalId",void 0),L([l()],z.prototype,"selectedOnRampProvider",void 0),L([l()],z.prototype,"uri",void 0),L([l()],z.prototype,"ready",void 0),L([l()],z.prototype,"showRetry",void 0),L([l()],z.prototype,"buffering",void 0),L([l()],z.prototype,"error",void 0),L([d({type:Boolean})],z.prototype,"isMobile",void 0),L([d()],z.prototype,"onRetry",void 0),z=L([u("w3m-buy-in-progress-view")],z);let F=class extends t{render(){return n`
      <wui-flex
        flexDirection="column"
        .padding=${["xxl","3xl","xl","3xl"]}
        alignItems="center"
        gap="xl"
      >
        <wui-visual name="onrampCard"></wui-visual>
        <wui-flex flexDirection="column" gap="xs" alignItems="center">
          <wui-text align="center" variant="paragraph-500" color="fg-100">
            Quickly and easily buy digital assets!
          </wui-text>
          <wui-text align="center" variant="small-400" color="fg-200">
            Simply select your preferred onramp provider and add digital assets to your account
            using your credit card or bank transfer
          </wui-text>
        </wui-flex>
        <wui-button @click=${y.goBack}>
          <wui-icon size="sm" color="inherit" name="add" slot="iconLeft"></wui-icon>
          Buy
        </wui-button>
      </wui-flex>
    `}};F=function(e,t,i,r){var o,s=arguments.length,a=s<3?t:null===r?r=Object.getOwnPropertyDescriptor(t,i):r;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)a=Reflect.decorate(e,t,i,r);else for(var n=e.length-1;n>=0;n--)(o=e[n])&&(a=(s<3?o(a):s>3?o(t,i,a):o(t,i))||a);return s>3&&a&&Object.defineProperty(t,i,a),a}([u("w3m-what-is-a-buy-view")],F);var W=function(e,t,i,r){var o,s=arguments.length,a=s<3?t:null===r?r=Object.getOwnPropertyDescriptor(t,i):r;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)a=Reflect.decorate(e,t,i,r);else for(var n=e.length-1;n>=0;n--)(o=e[n])&&(a=(s<3?o(a):s>3?o(t,i,a):o(t,i))||a);return s>3&&a&&Object.defineProperty(t,i,a),a};let N=class extends t{constructor(){super(),this.unsubscribe=[],this.namespace=p.state.activeChain,this.features=s.state.features,this.remoteFeatures=s.state.remoteFeatures,this.unsubscribe.push(s.subscribeKey("features",e=>this.features=e),s.subscribeKey("remoteFeatures",e=>this.remoteFeatures=e),p.subscribeKey("activeChain",e=>this.namespace=e),p.subscribeKey("activeCaipNetwork",e=>{(null==e?void 0:e.chainNamespace)&&(this.namespace=null==e?void 0:e.chainNamespace)}))}disconnectedCallback(){this.unsubscribe.forEach(e=>e())}render(){return n`
      <wui-flex flexDirection="column" .padding=${["0","s","xl","s"]} gap="xs">
        ${this.onrampTemplate()} ${this.receiveTemplate()} ${this.depositFromExchangeTemplate()}
      </wui-flex>
    `}onrampTemplate(){var e;if(!this.namespace)return null;const t=null==(e=this.remoteFeatures)?void 0:e.onramp,i=C.ONRAMP_SUPPORTED_CHAIN_NAMESPACES.includes(this.namespace);return t&&i?n`
      <wui-list-description
        @click=${this.onBuyCrypto.bind(this)}
        text="Buy crypto"
        icon="card"
        iconColor="success-100"
        iconBackgroundColor="success-100"
        data-testid="wallet-features-onramp-button"
      ></wui-list-description>
    `:null}depositFromExchangeTemplate(){var e;return(null==(e=this.remoteFeatures)?void 0:e.payWithExchange)?n`
      <wui-list-description
        @click=${this.onDepositFromExchange.bind(this)}
        text="Deposit from exchange"
        icon="download"
        iconColor="fg-200"
        iconBackgroundColor="fg-200"
        data-testid="wallet-features-deposit-from-exchange-button"
      ></wui-list-description>
    `:null}receiveTemplate(){var e;return Boolean(null==(e=this.features)?void 0:e.receive)?n`
      <wui-list-description
        @click=${this.onReceive.bind(this)}
        text="Receive funds"
        icon="qrCode"
        iconColor="fg-200"
        iconBackgroundColor="fg-200"
        data-testid="wallet-features-receive-button"
      ></wui-list-description>
    `:null}onBuyCrypto(){y.push("OnRampProviders")}onReceive(){y.push("WalletReceive")}onDepositFromExchange(){y.push("PayWithExchange")}};W([l()],N.prototype,"namespace",void 0),W([l()],N.prototype,"features",void 0),W([l()],N.prototype,"remoteFeatures",void 0),N=W([u("w3m-fund-wallet-view")],N);const K=e`
  :host {
    width: 100%;
  }

  wui-loading-spinner {
    position: absolute;
    top: 50%;
    right: 20px;
    transform: translateY(-50%);
  }

  .currency-container {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    right: var(--wui-spacing-1xs);
    height: 40px;
    padding: var(--wui-spacing-xs) var(--wui-spacing-1xs) var(--wui-spacing-xs)
      var(--wui-spacing-xs);
    min-width: 95px;
    border-radius: var(--FULL, 1000px);
    border: 1px solid var(--wui-color-gray-glass-002);
    background: var(--wui-color-gray-glass-002);
    cursor: pointer;
  }

  .currency-container > wui-image {
    height: 24px;
    width: 24px;
    border-radius: 50%;
  }
`;var _=function(e,t,i,r){var o,s=arguments.length,a=s<3?t:null===r?r=Object.getOwnPropertyDescriptor(t,i):r;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)a=Reflect.decorate(e,t,i,r);else for(var n=e.length-1;n>=0;n--)(o=e[n])&&(a=(s<3?o(a):s>3?o(t,i,a):o(t,i))||a);return s>3&&a&&Object.defineProperty(t,i,a),a};let q=class extends t{constructor(){var e;super(),this.unsubscribe=[],this.type="Token",this.value=0,this.currencies=[],this.selectedCurrency=null==(e=this.currencies)?void 0:e[0],this.currencyImages=r.state.currencyImages,this.tokenImages=r.state.tokenImages,this.unsubscribe.push(i.subscribeKey("purchaseCurrency",e=>{e&&"Fiat"!==this.type&&(this.selectedCurrency=this.formatPurchaseCurrency(e))}),i.subscribeKey("paymentCurrency",e=>{e&&"Token"!==this.type&&(this.selectedCurrency=this.formatPaymentCurrency(e))}),i.subscribe(e=>{"Fiat"===this.type?this.currencies=e.purchaseCurrencies.map(this.formatPurchaseCurrency):this.currencies=e.paymentCurrencies.map(this.formatPaymentCurrency)}),r.subscribe(e=>{this.currencyImages={...e.currencyImages},this.tokenImages={...e.tokenImages}}))}firstUpdated(){i.getAvailableCurrencies()}disconnectedCallback(){this.unsubscribe.forEach(e=>e())}render(){var e;const t=(null==(e=this.selectedCurrency)?void 0:e.symbol)||"",i=this.currencyImages[t]||this.tokenImages[t];return n`<wui-input-text type="number" size="lg" value=${this.value}>
      ${this.selectedCurrency?n` <wui-flex
            class="currency-container"
            justifyContent="space-between"
            alignItems="center"
            gap="xxs"
            @click=${()=>c.open({view:`OnRamp${this.type}Select`})}
          >
            <wui-image src=${a(i)}></wui-image>
            <wui-text color="fg-100">${this.selectedCurrency.symbol}</wui-text>
          </wui-flex>`:n`<wui-loading-spinner></wui-loading-spinner>`}
    </wui-input-text>`}formatPaymentCurrency(e){return{name:e.id,symbol:e.id}}formatPurchaseCurrency(e){return{name:e.name,symbol:e.symbol}}};q.styles=K,_([d({type:String})],q.prototype,"type",void 0),_([d({type:Number})],q.prototype,"value",void 0),_([l()],q.prototype,"currencies",void 0),_([l()],q.prototype,"selectedCurrency",void 0),_([l()],q.prototype,"currencyImages",void 0),_([l()],q.prototype,"tokenImages",void 0),q=_([u("w3m-onramp-input")],q);const M=e`
  :host > wui-flex {
    width: 100%;
    max-width: 360px;
  }

  :host > wui-flex > wui-flex {
    border-radius: var(--wui-border-radius-l);
    width: 100%;
  }

  .amounts-container {
    width: 100%;
  }
`;var Y=function(e,t,i,r){var o,s=arguments.length,a=s<3?t:null===r?r=Object.getOwnPropertyDescriptor(t,i):r;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)a=Reflect.decorate(e,t,i,r);else for(var n=e.length-1;n>=0;n--)(o=e[n])&&(a=(s<3?o(a):s>3?o(t,i,a):o(t,i))||a);return s>3&&a&&Object.defineProperty(t,i,a),a};const H={USD:"$",EUR:"€",GBP:"£"},Q=[100,250,500,1e3];let X=class extends t{constructor(){super(),this.unsubscribe=[],this.disabled=!1,this.caipAddress=p.state.activeCaipAddress,this.loading=c.state.loading,this.paymentCurrency=i.state.paymentCurrency,this.paymentAmount=i.state.paymentAmount,this.purchaseAmount=i.state.purchaseAmount,this.quoteLoading=i.state.quotesLoading,this.unsubscribe.push(p.subscribeKey("activeCaipAddress",e=>this.caipAddress=e),c.subscribeKey("loading",e=>{this.loading=e}),i.subscribe(e=>{this.paymentCurrency=e.paymentCurrency,this.paymentAmount=e.paymentAmount,this.purchaseAmount=e.purchaseAmount,this.quoteLoading=e.quotesLoading}))}disconnectedCallback(){this.unsubscribe.forEach(e=>e())}render(){return n`
      <wui-flex flexDirection="column" justifyContent="center" alignItems="center">
        <wui-flex flexDirection="column" alignItems="center" gap="xs">
          <w3m-onramp-input
            type="Fiat"
            @inputChange=${this.onPaymentAmountChange.bind(this)}
            .value=${this.paymentAmount||0}
          ></w3m-onramp-input>
          <w3m-onramp-input
            type="Token"
            .value=${this.purchaseAmount||0}
            .loading=${this.quoteLoading}
          ></w3m-onramp-input>
          <wui-flex justifyContent="space-evenly" class="amounts-container" gap="xs">
            ${Q.map(e=>{var t;return n`<wui-button
                  variant=${this.paymentAmount===e?"accent":"neutral"}
                  size="md"
                  textVariant="paragraph-600"
                  fullWidth
                  @click=${()=>this.selectPresetAmount(e)}
                  >${`${H[(null==(t=this.paymentCurrency)?void 0:t.id)||"USD"]} ${e}`}</wui-button
                >`})}
          </wui-flex>
          ${this.templateButton()}
        </wui-flex>
      </wui-flex>
    `}templateButton(){return this.caipAddress?n`<wui-button
          @click=${this.getQuotes.bind(this)}
          variant="main"
          fullWidth
          size="lg"
          borderRadius="xs"
        >
          Get quotes
        </wui-button>`:n`<wui-button
          @click=${this.openModal.bind(this)}
          variant="accent"
          fullWidth
          size="lg"
          borderRadius="xs"
        >
          Connect wallet
        </wui-button>`}getQuotes(){this.loading||c.open({view:"OnRampProviders"})}openModal(){c.open({view:"Connect"})}async onPaymentAmountChange(e){i.setPaymentAmount(Number(e.detail)),await i.getQuote()}async selectPresetAmount(e){i.setPaymentAmount(e),await i.getQuote()}};X.styles=M,Y([d({type:Boolean})],X.prototype,"disabled",void 0),Y([l()],X.prototype,"caipAddress",void 0),Y([l()],X.prototype,"loading",void 0),Y([l()],X.prototype,"paymentCurrency",void 0),Y([l()],X.prototype,"paymentAmount",void 0),Y([l()],X.prototype,"purchaseAmount",void 0),Y([l()],X.prototype,"quoteLoading",void 0),X=Y([u("w3m-onramp-widget")],X);export{z as W3mBuyInProgressView,N as W3mFundWalletView,B as W3mOnRampProvidersView,R as W3mOnrampFiatSelectView,S as W3mOnrampTokensView,X as W3mOnrampWidget,F as W3mWhatIsABuyView};
