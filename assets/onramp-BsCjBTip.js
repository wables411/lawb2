import{i as e,c as t,ad as r,ae as i,Q as o,O as s,J as n,x as a,Z as c,K as l,d as u,H as d,n as p,I as h,E as w,l as m,W as g,R as y,o as v,C as f,T as b,S as x}from"./index-CNA1hu79.js";import"./wagmi-vendor-D3Lspqub.js";import"./react-vendor-ZyuiJZO_.js";import"./chess-vendor-JTxzwGi1.js";import"./ui-vendor-BgPmeekb.js";const k=e`
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
`;var C=function(e,t,r,i){var o,s=arguments.length,n=s<3?t:null===i?i=Object.getOwnPropertyDescriptor(t,r):i;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)n=Reflect.decorate(e,t,r,i);else for(var a=e.length-1;a>=0;a--)(o=e[a])&&(n=(s<3?o(n):s>3?o(t,r,n):o(t,r))||n);return s>3&&n&&Object.defineProperty(t,r,n),n};let $=class extends t{constructor(){super(),this.unsubscribe=[],this.selectedCurrency=r.state.paymentCurrency,this.currencies=r.state.paymentCurrencies,this.currencyImages=i.state.currencyImages,this.checked=o.state.isLegalCheckboxChecked,this.unsubscribe.push(r.subscribe(e=>{this.selectedCurrency=e.paymentCurrency,this.currencies=e.paymentCurrencies}),i.subscribeKey("currencyImages",e=>this.currencyImages=e),o.subscribeKey("isLegalCheckboxChecked",e=>{this.checked=e}))}disconnectedCallback(){this.unsubscribe.forEach(e=>e())}render(){var e;const{termsConditionsUrl:t,privacyPolicyUrl:r}=s.state,i=null==(e=s.state.features)?void 0:e.legalCheckbox,o=Boolean(t||r)&&Boolean(i)&&!this.checked;return a`
      <w3m-legal-checkbox></w3m-legal-checkbox>
      <wui-flex
        flexDirection="column"
        .padding=${["0","s","s","s"]}
        gap="xs"
        class=${n(o?"disabled":void 0)}
      >
        ${this.currenciesTemplate(o)}
      </wui-flex>
      <w3m-legal-footer></w3m-legal-footer>
    `}currenciesTemplate(e=!1){return this.currencies.map(t=>{var r;return a`
        <wui-list-item
          imageSrc=${n(null==(r=this.currencyImages)?void 0:r[t.id])}
          @click=${()=>this.selectCurrency(t)}
          variant="image"
          tabIdx=${n(e?-1:void 0)}
        >
          <wui-text variant="paragraph-500" color="fg-100">${t.id}</wui-text>
        </wui-list-item>
      `})}selectCurrency(e){e&&(r.setPaymentCurrency(e),c.close())}};$.styles=k,C([l()],$.prototype,"selectedCurrency",void 0),C([l()],$.prototype,"currencies",void 0),C([l()],$.prototype,"currencyImages",void 0),C([l()],$.prototype,"checked",void 0),$=C([u("w3m-onramp-fiat-select-view")],$);const R=e`
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
`;var P=function(e,t,r,i){var o,s=arguments.length,n=s<3?t:null===i?i=Object.getOwnPropertyDescriptor(t,r):i;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)n=Reflect.decorate(e,t,r,i);else for(var a=e.length-1;a>=0;a--)(o=e[a])&&(n=(s<3?o(n):s>3?o(t,r,n):o(t,r))||n);return s>3&&n&&Object.defineProperty(t,r,n),n};let I=class extends t{constructor(){super(...arguments),this.disabled=!1,this.color="inherit",this.label="",this.feeRange="",this.loading=!1,this.onClick=null}render(){return a`
      <button ?disabled=${this.disabled} @click=${this.onClick} ontouchstart>
        <wui-visual name=${n(this.name)} class="provider-image"></wui-visual>
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
        ${this.loading?a`<wui-loading-spinner color="fg-200" size="md"></wui-loading-spinner>`:a`<wui-icon name="chevronRight" color="fg-200" size="sm"></wui-icon>`}
      </button>
    `}networksTemplate(){var e;const t=p.getAllRequestedCaipNetworks(),r=null==(e=null==t?void 0:t.filter(e=>{var t;return null==(t=null==e?void 0:e.assets)?void 0:t.imageId}))?void 0:e.slice(0,5);return a`
      <wui-flex class="networks">
        ${null==r?void 0:r.map(e=>a`
            <wui-flex class="network-icon">
              <wui-image src=${n(h.getNetworkImage(e))}></wui-image>
            </wui-flex>
          `)}
      </wui-flex>
    `}};I.styles=[R],P([d({type:Boolean})],I.prototype,"disabled",void 0),P([d()],I.prototype,"color",void 0),P([d()],I.prototype,"name",void 0),P([d()],I.prototype,"label",void 0),P([d()],I.prototype,"feeRange",void 0),P([d({type:Boolean})],I.prototype,"loading",void 0),P([d()],I.prototype,"onClick",void 0),I=P([u("w3m-onramp-provider-item")],I);const O=e`
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
`;let A=class extends t{render(){const{termsConditionsUrl:e,privacyPolicyUrl:t}=s.state;return e||t?a`
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
    `:null}howDoesItWorkTemplate(){return a` <wui-link @click=${this.onWhatIsBuy.bind(this)}>
      <wui-icon size="xs" color="accent-100" slot="iconLeft" name="helpCircle"></wui-icon>
      How does it work?
    </wui-link>`}onWhatIsBuy(){w.sendEvent({type:"track",event:"SELECT_WHAT_IS_A_BUY",properties:{isSmartAccount:m(p.state.activeChain)===g.ACCOUNT_TYPES.SMART_ACCOUNT}}),y.push("WhatIsABuy")}};A.styles=[O],A=function(e,t,r,i){var o,s=arguments.length,n=s<3?t:null===i?i=Object.getOwnPropertyDescriptor(t,r):i;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)n=Reflect.decorate(e,t,r,i);else for(var a=e.length-1;a>=0;a--)(o=e[a])&&(n=(s<3?o(n):s>3?o(t,r,n):o(t,r))||n);return s>3&&n&&Object.defineProperty(t,r,n),n}([u("w3m-onramp-providers-footer")],A);var j=function(e,t,r,i){var o,s=arguments.length,n=s<3?t:null===i?i=Object.getOwnPropertyDescriptor(t,r):i;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)n=Reflect.decorate(e,t,r,i);else for(var a=e.length-1;a>=0;a--)(o=e[a])&&(n=(s<3?o(n):s>3?o(t,r,n):o(t,r))||n);return s>3&&n&&Object.defineProperty(t,r,n),n};let T=class extends t{constructor(){super(),this.unsubscribe=[],this.providers=r.state.providers,this.unsubscribe.push(r.subscribeKey("providers",e=>{this.providers=e}))}render(){return a`
      <wui-flex flexDirection="column" .padding=${["0","s","s","s"]} gap="xs">
        ${this.onRampProvidersTemplate()}
      </wui-flex>
      <w3m-onramp-providers-footer></w3m-onramp-providers-footer>
    `}onRampProvidersTemplate(){return this.providers.filter(e=>e.supportedChains.includes(p.state.activeChain??"eip155")).map(e=>a`
          <w3m-onramp-provider-item
            label=${e.label}
            name=${e.name}
            feeRange=${e.feeRange}
            @click=${()=>{this.onClickProvider(e)}}
            ?disabled=${!e.url}
            data-testid=${`onramp-provider-${e.name}`}
          ></w3m-onramp-provider-item>
        `)}onClickProvider(e){var t;r.setSelectedProvider(e),y.push("BuyInProgress"),v.openHref((null==(t=r.state.selectedProvider)?void 0:t.url)||e.url,"popupWindow","width=600,height=800,scrollbars=yes"),w.sendEvent({type:"track",event:"SELECT_BUY_PROVIDER",properties:{provider:e.name,isSmartAccount:m(p.state.activeChain)===g.ACCOUNT_TYPES.SMART_ACCOUNT}})}};j([l()],T.prototype,"providers",void 0),T=j([u("w3m-onramp-providers-view")],T);const D=e`
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
`;var B=function(e,t,r,i){var o,s=arguments.length,n=s<3?t:null===i?i=Object.getOwnPropertyDescriptor(t,r):i;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)n=Reflect.decorate(e,t,r,i);else for(var a=e.length-1;a>=0;a--)(o=e[a])&&(n=(s<3?o(n):s>3?o(t,r,n):o(t,r))||n);return s>3&&n&&Object.defineProperty(t,r,n),n};let U=class extends t{constructor(){super(),this.unsubscribe=[],this.selectedCurrency=r.state.purchaseCurrencies,this.tokens=r.state.purchaseCurrencies,this.tokenImages=i.state.tokenImages,this.checked=o.state.isLegalCheckboxChecked,this.unsubscribe.push(r.subscribe(e=>{this.selectedCurrency=e.purchaseCurrencies,this.tokens=e.purchaseCurrencies}),i.subscribeKey("tokenImages",e=>this.tokenImages=e),o.subscribeKey("isLegalCheckboxChecked",e=>{this.checked=e}))}disconnectedCallback(){this.unsubscribe.forEach(e=>e())}render(){var e;const{termsConditionsUrl:t,privacyPolicyUrl:r}=s.state,i=null==(e=s.state.features)?void 0:e.legalCheckbox,o=Boolean(t||r)&&Boolean(i)&&!this.checked;return a`
      <w3m-legal-checkbox></w3m-legal-checkbox>
      <wui-flex
        flexDirection="column"
        .padding=${["0","s","s","s"]}
        gap="xs"
        class=${n(o?"disabled":void 0)}
      >
        ${this.currenciesTemplate(o)}
      </wui-flex>
      <w3m-legal-footer></w3m-legal-footer>
    `}currenciesTemplate(e=!1){return this.tokens.map(t=>{var r;return a`
        <wui-list-item
          imageSrc=${n(null==(r=this.tokenImages)?void 0:r[t.symbol])}
          @click=${()=>this.selectToken(t)}
          variant="image"
          tabIdx=${n(e?-1:void 0)}
        >
          <wui-flex gap="3xs" alignItems="center">
            <wui-text variant="paragraph-500" color="fg-100">${t.name}</wui-text>
            <wui-text variant="small-400" color="fg-200">${t.symbol}</wui-text>
          </wui-flex>
        </wui-list-item>
      `})}selectToken(e){e&&(r.setPurchaseCurrency(e),c.close())}};U.styles=D,B([l()],U.prototype,"selectedCurrency",void 0),B([l()],U.prototype,"tokens",void 0),B([l()],U.prototype,"tokenImages",void 0),B([l()],U.prototype,"checked",void 0),U=B([u("w3m-onramp-token-select-view")],U);const L=e`
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
`;var S=function(e,t,r,i){var o,s=arguments.length,n=s<3?t:null===i?i=Object.getOwnPropertyDescriptor(t,r):i;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)n=Reflect.decorate(e,t,r,i);else for(var a=e.length-1;a>=0;a--)(o=e[a])&&(n=(s<3?o(n):s>3?o(t,r,n):o(t,r))||n);return s>3&&n&&Object.defineProperty(t,r,n),n};let z=class extends t{constructor(){super(),this.unsubscribe=[],this.selectedOnRampProvider=r.state.selectedProvider,this.uri=f.state.wcUri,this.ready=!1,this.showRetry=!1,this.buffering=!1,this.error=!1,this.isMobile=!1,this.onRetry=void 0,this.unsubscribe.push(r.subscribeKey("selectedProvider",e=>{this.selectedOnRampProvider=e}))}disconnectedCallback(){this.intervalId&&clearInterval(this.intervalId)}render(){var e,t;let r="Continue in external window";this.error?r="Buy failed":this.selectedOnRampProvider&&(r=`Buy in ${null==(e=this.selectedOnRampProvider)?void 0:e.label}`);const i=this.error?"Buy can be declined from your side or due to and error on the provider app":"We’ll notify you once your Buy is processed";return a`
      <wui-flex
        data-error=${n(this.error)}
        data-retry=${this.showRetry}
        flexDirection="column"
        alignItems="center"
        .padding=${["3xl","xl","xl","xl"]}
        gap="xl"
      >
        <wui-flex justifyContent="center" alignItems="center">
          <wui-visual
            name=${n(null==(t=this.selectedOnRampProvider)?void 0:t.name)}
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
            ${r}
          </wui-text>
          <wui-text align="center" variant="small-500" color="fg-200">${i}</wui-text>
        </wui-flex>

        ${this.error?this.tryAgainTemplate():null}
      </wui-flex>

      <wui-flex .padding=${["0","xl","xl","xl"]} justifyContent="center">
        <wui-link @click=${this.onCopyUri} color="fg-200">
          <wui-icon size="xs" color="fg-200" slot="iconLeft" name="copy"></wui-icon>
          Copy link
        </wui-link>
      </wui-flex>
    `}onTryAgain(){this.selectedOnRampProvider&&(this.error=!1,v.openHref(this.selectedOnRampProvider.url,"popupWindow","width=600,height=800,scrollbars=yes"))}tryAgainTemplate(){var e;return(null==(e=this.selectedOnRampProvider)?void 0:e.url)?a`<wui-button size="md" variant="accent" @click=${this.onTryAgain.bind(this)}>
      <wui-icon color="inherit" slot="iconLeft" name="refresh"></wui-icon>
      Try again
    </wui-button>`:null}loaderTemplate(){const e=b.state.themeVariables["--w3m-border-radius-master"],t=e?parseInt(e.replace("px",""),10):4;return a`<wui-loading-thumbnail radius=${9*t}></wui-loading-thumbnail>`}onCopyUri(){var e;if(!(null==(e=this.selectedOnRampProvider)?void 0:e.url))return x.showError("No link found"),void y.goBack();try{v.copyToClopboard(this.selectedOnRampProvider.url),x.showSuccess("Link copied")}catch{x.showError("Failed to copy")}}};z.styles=L,S([l()],z.prototype,"intervalId",void 0),S([l()],z.prototype,"selectedOnRampProvider",void 0),S([l()],z.prototype,"uri",void 0),S([l()],z.prototype,"ready",void 0),S([l()],z.prototype,"showRetry",void 0),S([l()],z.prototype,"buffering",void 0),S([l()],z.prototype,"error",void 0),S([d({type:Boolean})],z.prototype,"isMobile",void 0),S([d()],z.prototype,"onRetry",void 0),z=S([u("w3m-buy-in-progress-view")],z);let E=class extends t{render(){return a`
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
    `}};E=function(e,t,r,i){var o,s=arguments.length,n=s<3?t:null===i?i=Object.getOwnPropertyDescriptor(t,r):i;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)n=Reflect.decorate(e,t,r,i);else for(var a=e.length-1;a>=0;a--)(o=e[a])&&(n=(s<3?o(n):s>3?o(t,r,n):o(t,r))||n);return s>3&&n&&Object.defineProperty(t,r,n),n}([u("w3m-what-is-a-buy-view")],E);const W=e`
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
`;var K=function(e,t,r,i){var o,s=arguments.length,n=s<3?t:null===i?i=Object.getOwnPropertyDescriptor(t,r):i;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)n=Reflect.decorate(e,t,r,i);else for(var a=e.length-1;a>=0;a--)(o=e[a])&&(n=(s<3?o(n):s>3?o(t,r,n):o(t,r))||n);return s>3&&n&&Object.defineProperty(t,r,n),n};let _=class extends t{constructor(){var e;super(),this.unsubscribe=[],this.type="Token",this.value=0,this.currencies=[],this.selectedCurrency=null==(e=this.currencies)?void 0:e[0],this.currencyImages=i.state.currencyImages,this.tokenImages=i.state.tokenImages,this.unsubscribe.push(r.subscribeKey("purchaseCurrency",e=>{e&&"Fiat"!==this.type&&(this.selectedCurrency=this.formatPurchaseCurrency(e))}),r.subscribeKey("paymentCurrency",e=>{e&&"Token"!==this.type&&(this.selectedCurrency=this.formatPaymentCurrency(e))}),r.subscribe(e=>{"Fiat"===this.type?this.currencies=e.purchaseCurrencies.map(this.formatPurchaseCurrency):this.currencies=e.paymentCurrencies.map(this.formatPaymentCurrency)}),i.subscribe(e=>{this.currencyImages={...e.currencyImages},this.tokenImages={...e.tokenImages}}))}firstUpdated(){r.getAvailableCurrencies()}disconnectedCallback(){this.unsubscribe.forEach(e=>e())}render(){var e;const t=(null==(e=this.selectedCurrency)?void 0:e.symbol)||"",r=this.currencyImages[t]||this.tokenImages[t];return a`<wui-input-text type="number" size="lg" value=${this.value}>
      ${this.selectedCurrency?a` <wui-flex
            class="currency-container"
            justifyContent="space-between"
            alignItems="center"
            gap="xxs"
            @click=${()=>c.open({view:`OnRamp${this.type}Select`})}
          >
            <wui-image src=${n(r)}></wui-image>
            <wui-text color="fg-100">${this.selectedCurrency.symbol}</wui-text>
          </wui-flex>`:a`<wui-loading-spinner></wui-loading-spinner>`}
    </wui-input-text>`}formatPaymentCurrency(e){return{name:e.id,symbol:e.id}}formatPurchaseCurrency(e){return{name:e.name,symbol:e.symbol}}};_.styles=W,K([d({type:String})],_.prototype,"type",void 0),K([d({type:Number})],_.prototype,"value",void 0),K([l()],_.prototype,"currencies",void 0),K([l()],_.prototype,"selectedCurrency",void 0),K([l()],_.prototype,"currencyImages",void 0),K([l()],_.prototype,"tokenImages",void 0),_=K([u("w3m-onramp-input")],_);const q=e`
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
`;var N=function(e,t,r,i){var o,s=arguments.length,n=s<3?t:null===i?i=Object.getOwnPropertyDescriptor(t,r):i;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)n=Reflect.decorate(e,t,r,i);else for(var a=e.length-1;a>=0;a--)(o=e[a])&&(n=(s<3?o(n):s>3?o(t,r,n):o(t,r))||n);return s>3&&n&&Object.defineProperty(t,r,n),n};const M={USD:"$",EUR:"€",GBP:"£"},F=[100,250,500,1e3];let Q=class extends t{constructor(){super(),this.unsubscribe=[],this.disabled=!1,this.caipAddress=p.state.activeCaipAddress,this.loading=c.state.loading,this.paymentCurrency=r.state.paymentCurrency,this.paymentAmount=r.state.paymentAmount,this.purchaseAmount=r.state.purchaseAmount,this.quoteLoading=r.state.quotesLoading,this.unsubscribe.push(p.subscribeKey("activeCaipAddress",e=>this.caipAddress=e),c.subscribeKey("loading",e=>{this.loading=e}),r.subscribe(e=>{this.paymentCurrency=e.paymentCurrency,this.paymentAmount=e.paymentAmount,this.purchaseAmount=e.purchaseAmount,this.quoteLoading=e.quotesLoading}))}disconnectedCallback(){this.unsubscribe.forEach(e=>e())}render(){return a`
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
            ${F.map(e=>{var t;return a`<wui-button
                  variant=${this.paymentAmount===e?"accent":"neutral"}
                  size="md"
                  textVariant="paragraph-600"
                  fullWidth
                  @click=${()=>this.selectPresetAmount(e)}
                  >${`${M[(null==(t=this.paymentCurrency)?void 0:t.id)||"USD"]} ${e}`}</wui-button
                >`})}
          </wui-flex>
          ${this.templateButton()}
        </wui-flex>
      </wui-flex>
    `}templateButton(){return this.caipAddress?a`<wui-button
          @click=${this.getQuotes.bind(this)}
          variant="main"
          fullWidth
          size="lg"
          borderRadius="xs"
        >
          Get quotes
        </wui-button>`:a`<wui-button
          @click=${this.openModal.bind(this)}
          variant="accent"
          fullWidth
          size="lg"
          borderRadius="xs"
        >
          Connect wallet
        </wui-button>`}getQuotes(){this.loading||c.open({view:"OnRampProviders"})}openModal(){c.open({view:"Connect"})}async onPaymentAmountChange(e){r.setPaymentAmount(Number(e.detail)),await r.getQuote()}async selectPresetAmount(e){r.setPaymentAmount(e),await r.getQuote()}};Q.styles=q,N([d({type:Boolean})],Q.prototype,"disabled",void 0),N([l()],Q.prototype,"caipAddress",void 0),N([l()],Q.prototype,"loading",void 0),N([l()],Q.prototype,"paymentCurrency",void 0),N([l()],Q.prototype,"paymentAmount",void 0),N([l()],Q.prototype,"purchaseAmount",void 0),N([l()],Q.prototype,"quoteLoading",void 0),Q=N([u("w3m-onramp-widget")],Q);export{z as W3mBuyInProgressView,T as W3mOnRampProvidersView,$ as W3mOnrampFiatSelectView,U as W3mOnrampTokensView,Q as W3mOnrampWidget,E as W3mWhatIsABuyView};
