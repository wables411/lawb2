import{o as e,t,av as r,aw as i,ak as o,ab as n,Y as s,x as a,af as c,a8 as u,s as l,q as d,I as p,a6 as m,R as h,K as y,G as g,H as w,W as f,E as b,a7 as v,S as x}from"./index-Dl1D8E1B.js";import"./wagmi-vendor-DSN9CS_k.js";import"./react-vendor-ZyuiJZO_.js";import"./chess-vendor-JTxzwGi1.js";import"./ui-vendor-BgPmeekb.js";const $=e`
  :host > wui-grid {
    max-height: 360px;
    overflow: auto;
  }

  wui-flex {
    transition: opacity ${({easings:e})=>e["ease-out-power-1"]}
      ${({durations:e})=>e.md};
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
`;var k=function(e,t,r,i){var o,n=arguments.length,s=n<3?t:null===i?i=Object.getOwnPropertyDescriptor(t,r):i;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)s=Reflect.decorate(e,t,r,i);else for(var a=e.length-1;a>=0;a--)(o=e[a])&&(s=(n<3?o(s):n>3?o(t,r,s):o(t,r))||s);return n>3&&s&&Object.defineProperty(t,r,s),s};let C=class extends t{constructor(){super(),this.unsubscribe=[],this.selectedCurrency=r.state.paymentCurrency,this.currencies=r.state.paymentCurrencies,this.currencyImages=i.state.currencyImages,this.checked=o.state.isLegalCheckboxChecked,this.unsubscribe.push(r.subscribe(e=>{this.selectedCurrency=e.paymentCurrency,this.currencies=e.paymentCurrencies}),i.subscribeKey("currencyImages",e=>this.currencyImages=e),o.subscribeKey("isLegalCheckboxChecked",e=>{this.checked=e}))}disconnectedCallback(){this.unsubscribe.forEach(e=>e())}render(){var e;const{termsConditionsUrl:t,privacyPolicyUrl:r}=n.state,i=null==(e=n.state.features)?void 0:e.legalCheckbox,o=Boolean(t||r)&&Boolean(i)&&!this.checked;return a`
      <w3m-legal-checkbox></w3m-legal-checkbox>
      <wui-flex
        flexDirection="column"
        .padding=${["0","3","3","3"]}
        gap="2"
        class=${s(o?"disabled":void 0)}
      >
        ${this.currenciesTemplate(o)}
      </wui-flex>
    `}currenciesTemplate(e=!1){return this.currencies.map(t=>{var r;return a`
        <wui-list-item
          imageSrc=${s(null==(r=this.currencyImages)?void 0:r[t.id])}
          @click=${()=>this.selectCurrency(t)}
          variant="image"
          tabIdx=${s(e?-1:void 0)}
        >
          <wui-text variant="md-medium" color="primary">${t.id}</wui-text>
        </wui-list-item>
      `})}selectCurrency(e){e&&(r.setPaymentCurrency(e),c.close())}};C.styles=$,k([u()],C.prototype,"selectedCurrency",void 0),k([u()],C.prototype,"currencies",void 0),k([u()],C.prototype,"currencyImages",void 0),k([u()],C.prototype,"checked",void 0),C=k([l("w3m-onramp-fiat-select-view")],C);const R=e`
  button {
    padding: ${({spacing:e})=>e[3]};
    border-radius: ${({borderRadius:e})=>e[4]};
    border: none;
    outline: none;
    background-color: ${({tokens:e})=>e.core.glass010};
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: flex-start;
    gap: ${({spacing:e})=>e[3]};
    transition: background-color ${({easings:e})=>e["ease-out-power-1"]}
      ${({durations:e})=>e.md};
    will-change: background-color;
    cursor: pointer;
  }

  button:hover {
    background-color: ${({tokens:e})=>e.theme.foregroundPrimary};
  }

  .provider-image {
    width: ${({spacing:e})=>e[10]};
    min-width: ${({spacing:e})=>e[10]};
    height: ${({spacing:e})=>e[10]};
    border-radius: calc(
      ${({borderRadius:e})=>e[4]} - calc(${({spacing:e})=>e[3]} / 2)
    );
    position: relative;
    overflow: hidden;
  }

  .network-icon {
    width: ${({spacing:e})=>e[3]};
    height: ${({spacing:e})=>e[3]};
    border-radius: calc(${({spacing:e})=>e[3]} / 2);
    overflow: hidden;
    box-shadow:
      0 0 0 3px ${({tokens:e})=>e.theme.foregroundPrimary},
      0 0 0 3px ${({tokens:e})=>e.theme.backgroundPrimary};
    transition: box-shadow ${({easings:e})=>e["ease-out-power-1"]}
      ${({durations:e})=>e.md};
    will-change: box-shadow;
  }

  button:hover .network-icon {
    box-shadow:
      0 0 0 3px ${({tokens:e})=>e.core.glass010},
      0 0 0 3px ${({tokens:e})=>e.theme.backgroundPrimary};
  }
`;var P=function(e,t,r,i){var o,n=arguments.length,s=n<3?t:null===i?i=Object.getOwnPropertyDescriptor(t,r):i;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)s=Reflect.decorate(e,t,r,i);else for(var a=e.length-1;a>=0;a--)(o=e[a])&&(s=(n<3?o(s):n>3?o(t,r,s):o(t,r))||s);return n>3&&s&&Object.defineProperty(t,r,s),s};let I=class extends t{constructor(){super(...arguments),this.disabled=!1,this.color="inherit",this.label="",this.feeRange="",this.loading=!1,this.onClick=null}render(){return a`
      <button ?disabled=${this.disabled} @click=${this.onClick} ontouchstart>
        <wui-visual name=${s(this.name)} class="provider-image"></wui-visual>
        <wui-flex flexDirection="column" gap="01">
          <wui-text variant="md-regular" color="primary">${this.label}</wui-text>
          <wui-flex alignItems="center" justifyContent="flex-start" gap="4">
            <wui-text variant="sm-medium" color="primary">
              <wui-text variant="sm-regular" color="secondary">Fees</wui-text>
              ${this.feeRange}
            </wui-text>
            <wui-flex gap="2">
              <wui-icon name="bank" size="sm" color="default"></wui-icon>
              <wui-icon name="card" size="sm" color="default"></wui-icon>
            </wui-flex>
            ${this.networksTemplate()}
          </wui-flex>
        </wui-flex>
        ${this.loading?a`<wui-loading-spinner color="secondary" size="md"></wui-loading-spinner>`:a`<wui-icon name="chevronRight" color="default" size="sm"></wui-icon>`}
      </button>
    `}networksTemplate(){var e;const t=p.getAllRequestedCaipNetworks(),r=null==(e=null==t?void 0:t.filter(e=>{var t;return null==(t=null==e?void 0:e.assets)?void 0:t.imageId}))?void 0:e.slice(0,5);return a`
      <wui-flex class="networks">
        ${null==r?void 0:r.map(e=>a`
            <wui-flex class="network-icon">
              <wui-image src=${s(m.getNetworkImage(e))}></wui-image>
            </wui-flex>
          `)}
      </wui-flex>
    `}};I.styles=[R],P([d({type:Boolean})],I.prototype,"disabled",void 0),P([d()],I.prototype,"color",void 0),P([d()],I.prototype,"name",void 0),P([d()],I.prototype,"label",void 0),P([d()],I.prototype,"feeRange",void 0),P([d({type:Boolean})],I.prototype,"loading",void 0),P([d()],I.prototype,"onClick",void 0),I=P([l("w3m-onramp-provider-item")],I);var O=function(e,t,r,i){var o,n=arguments.length,s=n<3?t:null===i?i=Object.getOwnPropertyDescriptor(t,r):i;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)s=Reflect.decorate(e,t,r,i);else for(var a=e.length-1;a>=0;a--)(o=e[a])&&(s=(n<3?o(s):n>3?o(t,r,s):o(t,r))||s);return n>3&&s&&Object.defineProperty(t,r,s),s};let j=class extends t{constructor(){super(),this.unsubscribe=[],this.providers=r.state.providers,this.unsubscribe.push(r.subscribeKey("providers",e=>{this.providers=e}))}render(){return a`
      <wui-flex flexDirection="column" .padding=${["0","3","3","3"]} gap="2">
        ${this.onRampProvidersTemplate()}
      </wui-flex>
    `}onRampProvidersTemplate(){return this.providers.filter(e=>e.supportedChains.includes(p.state.activeChain??"eip155")).map(e=>a`
          <w3m-onramp-provider-item
            label=${e.label}
            name=${e.name}
            feeRange=${e.feeRange}
            @click=${()=>{this.onClickProvider(e)}}
            ?disabled=${!e.url}
            data-testid=${`onramp-provider-${e.name}`}
          ></w3m-onramp-provider-item>
        `)}onClickProvider(e){var t;r.setSelectedProvider(e),h.push("BuyInProgress"),y.openHref((null==(t=r.state.selectedProvider)?void 0:t.url)||e.url,"popupWindow","width=600,height=800,scrollbars=yes"),g.sendEvent({type:"track",event:"SELECT_BUY_PROVIDER",properties:{provider:e.name,isSmartAccount:w(p.state.activeChain)===f.ACCOUNT_TYPES.SMART_ACCOUNT}})}};O([u()],j.prototype,"providers",void 0),j=O([l("w3m-onramp-providers-view")],j);const A=e`
  :host > wui-grid {
    max-height: 360px;
    overflow: auto;
  }

  wui-flex {
    transition: opacity ${({easings:e})=>e["ease-out-power-1"]}
      ${({durations:e})=>e.md};
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
`;var T=function(e,t,r,i){var o,n=arguments.length,s=n<3?t:null===i?i=Object.getOwnPropertyDescriptor(t,r):i;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)s=Reflect.decorate(e,t,r,i);else for(var a=e.length-1;a>=0;a--)(o=e[a])&&(s=(n<3?o(s):n>3?o(t,r,s):o(t,r))||s);return n>3&&s&&Object.defineProperty(t,r,s),s};let D=class extends t{constructor(){super(),this.unsubscribe=[],this.selectedCurrency=r.state.purchaseCurrencies,this.tokens=r.state.purchaseCurrencies,this.tokenImages=i.state.tokenImages,this.checked=o.state.isLegalCheckboxChecked,this.unsubscribe.push(r.subscribe(e=>{this.selectedCurrency=e.purchaseCurrencies,this.tokens=e.purchaseCurrencies}),i.subscribeKey("tokenImages",e=>this.tokenImages=e),o.subscribeKey("isLegalCheckboxChecked",e=>{this.checked=e}))}disconnectedCallback(){this.unsubscribe.forEach(e=>e())}render(){var e;const{termsConditionsUrl:t,privacyPolicyUrl:r}=n.state,i=null==(e=n.state.features)?void 0:e.legalCheckbox,o=Boolean(t||r)&&Boolean(i)&&!this.checked;return a`
      <w3m-legal-checkbox></w3m-legal-checkbox>
      <wui-flex
        flexDirection="column"
        .padding=${["0","3","3","3"]}
        gap="2"
        class=${s(o?"disabled":void 0)}
      >
        ${this.currenciesTemplate(o)}
      </wui-flex>
    `}currenciesTemplate(e=!1){return this.tokens.map(t=>{var r;return a`
        <wui-list-item
          imageSrc=${s(null==(r=this.tokenImages)?void 0:r[t.symbol])}
          @click=${()=>this.selectToken(t)}
          variant="image"
          tabIdx=${s(e?-1:void 0)}
        >
          <wui-flex gap="1" alignItems="center">
            <wui-text variant="md-medium" color="primary">${t.name}</wui-text>
            <wui-text variant="sm-regular" color="secondary">${t.symbol}</wui-text>
          </wui-flex>
        </wui-list-item>
      `})}selectToken(e){e&&(r.setPurchaseCurrency(e),c.close())}};D.styles=A,T([u()],D.prototype,"selectedCurrency",void 0),T([u()],D.prototype,"tokens",void 0),T([u()],D.prototype,"tokenImages",void 0),T([u()],D.prototype,"checked",void 0),D=T([l("w3m-onramp-token-select-view")],D);const B=e`
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
    border-radius: calc(
      ${({borderRadius:e})=>e[1]} * 9 - ${({borderRadius:e})=>e[3]}
    );
    position: relative;
    overflow: hidden;
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

  [data-retry='false'] wui-link {
    display: none;
  }

  [data-retry='true'] wui-link {
    display: block;
    opacity: 1;
  }

  wui-link {
    padding: ${({spacing:e})=>e["01"]} ${({spacing:e})=>e[2]};
  }
`;var L=function(e,t,r,i){var o,n=arguments.length,s=n<3?t:null===i?i=Object.getOwnPropertyDescriptor(t,r):i;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)s=Reflect.decorate(e,t,r,i);else for(var a=e.length-1;a>=0;a--)(o=e[a])&&(s=(n<3?o(s):n>3?o(t,r,s):o(t,r))||s);return n>3&&s&&Object.defineProperty(t,r,s),s};let S=class extends t{constructor(){super(),this.unsubscribe=[],this.selectedOnRampProvider=r.state.selectedProvider,this.uri=b.state.wcUri,this.ready=!1,this.showRetry=!1,this.buffering=!1,this.error=!1,this.isMobile=!1,this.onRetry=void 0,this.unsubscribe.push(r.subscribeKey("selectedProvider",e=>{this.selectedOnRampProvider=e}))}disconnectedCallback(){this.intervalId&&clearInterval(this.intervalId)}render(){var e,t;let r="Continue in external window";this.error?r="Buy failed":this.selectedOnRampProvider&&(r=`Buy in ${null==(e=this.selectedOnRampProvider)?void 0:e.label}`);const i=this.error?"Buy can be declined from your side or due to and error on the provider app":"We’ll notify you once your Buy is processed";return a`
      <wui-flex
        data-error=${s(this.error)}
        data-retry=${this.showRetry}
        flexDirection="column"
        alignItems="center"
        .padding=${["10","5","5","5"]}
        gap="5"
      >
        <wui-flex justifyContent="center" alignItems="center">
          <wui-visual
            name=${s(null==(t=this.selectedOnRampProvider)?void 0:t.name)}
            size="lg"
            class="provider-image"
          >
          </wui-visual>

          ${this.error?null:this.loaderTemplate()}

          <wui-icon-box
            color="error"
            icon="close"
            size="sm"
            border
            borderColor="wui-color-bg-125"
          ></wui-icon-box>
        </wui-flex>

        <wui-flex
          flexDirection="column"
          alignItems="center"
          gap="2"
          .padding=${["4","0","0","0"]}
        >
          <wui-text variant="md-medium" color=${this.error?"error":"primary"}>
            ${r}
          </wui-text>
          <wui-text align="center" variant="sm-medium" color="secondary">${i}</wui-text>
        </wui-flex>

        ${this.error?this.tryAgainTemplate():null}
      </wui-flex>

      <wui-flex .padding=${["0","5","5","5"]} justifyContent="center">
        <wui-link @click=${this.onCopyUri} color="secondary">
          <wui-icon size="sm" color="default" slot="iconLeft" name="copy"></wui-icon>
          Copy link
        </wui-link>
      </wui-flex>
    `}onTryAgain(){this.selectedOnRampProvider&&(this.error=!1,y.openHref(this.selectedOnRampProvider.url,"popupWindow","width=600,height=800,scrollbars=yes"))}tryAgainTemplate(){var e;return(null==(e=this.selectedOnRampProvider)?void 0:e.url)?a`<wui-button size="md" variant="accent" @click=${this.onTryAgain.bind(this)}>
      <wui-icon color="inherit" slot="iconLeft" name="refresh"></wui-icon>
      Try again
    </wui-button>`:null}loaderTemplate(){const e=v.state.themeVariables["--w3m-border-radius-master"],t=e?parseInt(e.replace("px",""),10):4;return a`<wui-loading-thumbnail radius=${9*t}></wui-loading-thumbnail>`}onCopyUri(){var e;if(!(null==(e=this.selectedOnRampProvider)?void 0:e.url))return x.showError("No link found"),void h.goBack();try{y.copyToClopboard(this.selectedOnRampProvider.url),x.showSuccess("Link copied")}catch{x.showError("Failed to copy")}}};S.styles=B,L([u()],S.prototype,"intervalId",void 0),L([u()],S.prototype,"selectedOnRampProvider",void 0),L([u()],S.prototype,"uri",void 0),L([u()],S.prototype,"ready",void 0),L([u()],S.prototype,"showRetry",void 0),L([u()],S.prototype,"buffering",void 0),L([u()],S.prototype,"error",void 0),L([d({type:Boolean})],S.prototype,"isMobile",void 0),L([d()],S.prototype,"onRetry",void 0),S=L([l("w3m-buy-in-progress-view")],S);let U=class extends t{render(){return a`
      <wui-flex
        flexDirection="column"
        .padding=${["6","10","5","10"]}
        alignItems="center"
        gap="5"
      >
        <wui-visual name="onrampCard"></wui-visual>
        <wui-flex flexDirection="column" gap="2" alignItems="center">
          <wui-text align="center" variant="md-medium" color="primary">
            Quickly and easily buy digital assets!
          </wui-text>
          <wui-text align="center" variant="sm-regular" color="secondary">
            Simply select your preferred onramp provider and add digital assets to your account
            using your credit card or bank transfer
          </wui-text>
        </wui-flex>
        <wui-button @click=${h.goBack}>
          <wui-icon size="sm" color="inherit" name="add" slot="iconLeft"></wui-icon>
          Buy
        </wui-button>
      </wui-flex>
    `}};U=function(e,t,r,i){var o,n=arguments.length,s=n<3?t:null===i?i=Object.getOwnPropertyDescriptor(t,r):i;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)s=Reflect.decorate(e,t,r,i);else for(var a=e.length-1;a>=0;a--)(o=e[a])&&(s=(n<3?o(s):n>3?o(t,r,s):o(t,r))||s);return n>3&&s&&Object.defineProperty(t,r,s),s}([l("w3m-what-is-a-buy-view")],U);const z=e`
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
    right: ${({spacing:e})=>e[2]};
    height: 40px;
    padding: ${({spacing:e})=>e[2]} ${({spacing:e})=>e[2]}
      ${({spacing:e})=>e[2]} ${({spacing:e})=>e[2]};
    min-width: 95px;
    border-radius: ${({borderRadius:e})=>e.round};
    border: 1px solid ${({tokens:e})=>e.theme.foregroundPrimary};
    background: ${({tokens:e})=>e.theme.foregroundPrimary};
    cursor: pointer;
  }

  .currency-container > wui-image {
    height: 24px;
    width: 24px;
    border-radius: 50%;
  }
`;var E=function(e,t,r,i){var o,n=arguments.length,s=n<3?t:null===i?i=Object.getOwnPropertyDescriptor(t,r):i;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)s=Reflect.decorate(e,t,r,i);else for(var a=e.length-1;a>=0;a--)(o=e[a])&&(s=(n<3?o(s):n>3?o(t,r,s):o(t,r))||s);return n>3&&s&&Object.defineProperty(t,r,s),s};let K=class extends t{constructor(){var e;super(),this.unsubscribe=[],this.type="Token",this.value=0,this.currencies=[],this.selectedCurrency=null==(e=this.currencies)?void 0:e[0],this.currencyImages=i.state.currencyImages,this.tokenImages=i.state.tokenImages,this.unsubscribe.push(r.subscribeKey("purchaseCurrency",e=>{e&&"Fiat"!==this.type&&(this.selectedCurrency=this.formatPurchaseCurrency(e))}),r.subscribeKey("paymentCurrency",e=>{e&&"Token"!==this.type&&(this.selectedCurrency=this.formatPaymentCurrency(e))}),r.subscribe(e=>{"Fiat"===this.type?this.currencies=e.purchaseCurrencies.map(this.formatPurchaseCurrency):this.currencies=e.paymentCurrencies.map(this.formatPaymentCurrency)}),i.subscribe(e=>{this.currencyImages={...e.currencyImages},this.tokenImages={...e.tokenImages}}))}firstUpdated(){r.getAvailableCurrencies()}disconnectedCallback(){this.unsubscribe.forEach(e=>e())}render(){var e;const t=(null==(e=this.selectedCurrency)?void 0:e.symbol)||"",r=this.currencyImages[t]||this.tokenImages[t];return a`<wui-input-text type="number" size="lg" value=${this.value}>
      ${this.selectedCurrency?a` <wui-flex
            class="currency-container"
            justifyContent="space-between"
            alignItems="center"
            gap="1"
            @click=${()=>c.open({view:`OnRamp${this.type}Select`})}
          >
            <wui-image src=${s(r)}></wui-image>
            <wui-text color="primary">${this.selectedCurrency.symbol}</wui-text>
          </wui-flex>`:a`<wui-loading-spinner></wui-loading-spinner>`}
    </wui-input-text>`}formatPaymentCurrency(e){return{name:e.id,symbol:e.id}}formatPurchaseCurrency(e){return{name:e.name,symbol:e.symbol}}};K.styles=z,E([d({type:String})],K.prototype,"type",void 0),E([d({type:Number})],K.prototype,"value",void 0),E([u()],K.prototype,"currencies",void 0),E([u()],K.prototype,"selectedCurrency",void 0),E([u()],K.prototype,"currencyImages",void 0),E([u()],K.prototype,"tokenImages",void 0),K=E([l("w3m-onramp-input")],K);const q=e`
  :host > wui-flex {
    width: 100%;
    max-width: 360px;
  }

  :host > wui-flex > wui-flex {
    border-radius: ${({borderRadius:e})=>e[8]};
    width: 100%;
  }

  .amounts-container {
    width: 100%;
  }
`;var N=function(e,t,r,i){var o,n=arguments.length,s=n<3?t:null===i?i=Object.getOwnPropertyDescriptor(t,r):i;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)s=Reflect.decorate(e,t,r,i);else for(var a=e.length-1;a>=0;a--)(o=e[a])&&(s=(n<3?o(s):n>3?o(t,r,s):o(t,r))||s);return n>3&&s&&Object.defineProperty(t,r,s),s};const W={USD:"$",EUR:"€",GBP:"£"},F=[100,250,500,1e3];let M=class extends t{constructor(){super(),this.unsubscribe=[],this.disabled=!1,this.caipAddress=p.state.activeCaipAddress,this.loading=c.state.loading,this.paymentCurrency=r.state.paymentCurrency,this.paymentAmount=r.state.paymentAmount,this.purchaseAmount=r.state.purchaseAmount,this.quoteLoading=r.state.quotesLoading,this.unsubscribe.push(p.subscribeKey("activeCaipAddress",e=>this.caipAddress=e),c.subscribeKey("loading",e=>{this.loading=e}),r.subscribe(e=>{this.paymentCurrency=e.paymentCurrency,this.paymentAmount=e.paymentAmount,this.purchaseAmount=e.purchaseAmount,this.quoteLoading=e.quotesLoading}))}disconnectedCallback(){this.unsubscribe.forEach(e=>e())}render(){return a`
      <wui-flex flexDirection="column" justifyContent="center" alignItems="center">
        <wui-flex flexDirection="column" alignItems="center" gap="2">
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
          <wui-flex justifyContent="space-evenly" class="amounts-container" gap="2">
            ${F.map(e=>{var t;return a`<wui-button
                  variant=${this.paymentAmount===e?"accent-secondary":"neutral-secondary"}
                  size="md"
                  textVariant="md-medium"
                  fullWidth
                  @click=${()=>this.selectPresetAmount(e)}
                  >${`${W[(null==(t=this.paymentCurrency)?void 0:t.id)||"USD"]} ${e}`}</wui-button
                >`})}
          </wui-flex>
          ${this.templateButton()}
        </wui-flex>
      </wui-flex>
    `}templateButton(){return this.caipAddress?a`<wui-button
          @click=${this.getQuotes.bind(this)}
          variant="accent-primary"
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
        </wui-button>`}getQuotes(){this.loading||c.open({view:"OnRampProviders"})}openModal(){c.open({view:"Connect"})}async onPaymentAmountChange(e){r.setPaymentAmount(Number(e.detail)),await r.getQuote()}async selectPresetAmount(e){r.setPaymentAmount(e),await r.getQuote()}};M.styles=q,N([d({type:Boolean})],M.prototype,"disabled",void 0),N([u()],M.prototype,"caipAddress",void 0),N([u()],M.prototype,"loading",void 0),N([u()],M.prototype,"paymentCurrency",void 0),N([u()],M.prototype,"paymentAmount",void 0),N([u()],M.prototype,"purchaseAmount",void 0),N([u()],M.prototype,"quoteLoading",void 0),M=N([l("w3m-onramp-widget")],M);export{S as W3mBuyInProgressView,j as W3mOnRampProvidersView,C as W3mOnrampFiatSelectView,D as W3mOnrampTokensView,M as W3mOnrampWidget,U as W3mWhatIsABuyView};
