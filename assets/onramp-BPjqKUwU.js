import{X as e,a0 as t,al as r,aD as i,ai as o,a7 as n,a1 as s,ay as a,ac as c,$ as u,_ as l,I as d,aa as p,R as m,K as h,G as y,H as g,W as w,E as f,ab as b,S as v}from"./index-DTsKxQcn.js";import{O as x}from"./react-xd0L6egP.js";import"./wagmi-vendor-cal8GwT5.js";import"./react-vendor-BlDtUSDV.js";import"./chess-vendor-BKDUb1NN.js";import"./ui-vendor-BJIjw2Nx.js";import"./index-C1sWaD68.js";import"./index-CFYEtFbK.js";import"./WalletConnectConnector-DevzJji-.js";const $=e`
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
`;var k=function(e,t,r,i){var o,n=arguments.length,s=n<3?t:null===i?i=Object.getOwnPropertyDescriptor(t,r):i;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)s=Reflect.decorate(e,t,r,i);else for(var a=e.length-1;a>=0;a--)(o=e[a])&&(s=(n<3?o(s):n>3?o(t,r,s):o(t,r))||s);return n>3&&s&&Object.defineProperty(t,r,s),s};let C=class extends t{constructor(){super(),this.unsubscribe=[],this.selectedCurrency=x.state.paymentCurrency,this.currencies=x.state.paymentCurrencies,this.currencyImages=r.state.currencyImages,this.checked=i.state.isLegalCheckboxChecked,this.unsubscribe.push(x.subscribe(e=>{this.selectedCurrency=e.paymentCurrency,this.currencies=e.paymentCurrencies}),r.subscribeKey("currencyImages",e=>this.currencyImages=e),i.subscribeKey("isLegalCheckboxChecked",e=>{this.checked=e}))}disconnectedCallback(){this.unsubscribe.forEach(e=>e())}render(){var e;const{termsConditionsUrl:t,privacyPolicyUrl:r}=o.state,i=null==(e=o.state.features)?void 0:e.legalCheckbox,a=Boolean(t||r)&&Boolean(i)&&!this.checked;return s`
      <w3m-legal-checkbox></w3m-legal-checkbox>
      <wui-flex
        flexDirection="column"
        .padding=${["0","3","3","3"]}
        gap="2"
        class=${n(a?"disabled":void 0)}
      >
        ${this.currenciesTemplate(a)}
      </wui-flex>
    `}currenciesTemplate(e=!1){return this.currencies.map(t=>{var r;return s`
        <wui-list-item
          imageSrc=${n(null==(r=this.currencyImages)?void 0:r[t.id])}
          @click=${()=>this.selectCurrency(t)}
          variant="image"
          tabIdx=${n(e?-1:void 0)}
        >
          <wui-text variant="md-medium" color="primary">${t.id}</wui-text>
        </wui-list-item>
      `})}selectCurrency(e){e&&(x.setPaymentCurrency(e),a.close())}};C.styles=$,k([c()],C.prototype,"selectedCurrency",void 0),k([c()],C.prototype,"currencies",void 0),k([c()],C.prototype,"currencyImages",void 0),k([c()],C.prototype,"checked",void 0),C=k([u("w3m-onramp-fiat-select-view")],C);const R=e`
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
`;var P=function(e,t,r,i){var o,n=arguments.length,s=n<3?t:null===i?i=Object.getOwnPropertyDescriptor(t,r):i;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)s=Reflect.decorate(e,t,r,i);else for(var a=e.length-1;a>=0;a--)(o=e[a])&&(s=(n<3?o(s):n>3?o(t,r,s):o(t,r))||s);return n>3&&s&&Object.defineProperty(t,r,s),s};let I=class extends t{constructor(){super(...arguments),this.disabled=!1,this.color="inherit",this.label="",this.feeRange="",this.loading=!1,this.onClick=null}render(){return s`
      <button ?disabled=${this.disabled} @click=${this.onClick} ontouchstart>
        <wui-visual name=${n(this.name)} class="provider-image"></wui-visual>
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
        ${this.loading?s`<wui-loading-spinner color="secondary" size="md"></wui-loading-spinner>`:s`<wui-icon name="chevronRight" color="default" size="sm"></wui-icon>`}
      </button>
    `}networksTemplate(){var e;const t=d.getAllRequestedCaipNetworks(),r=null==(e=null==t?void 0:t.filter(e=>{var t;return null==(t=null==e?void 0:e.assets)?void 0:t.imageId}))?void 0:e.slice(0,5);return s`
      <wui-flex class="networks">
        ${null==r?void 0:r.map(e=>s`
            <wui-flex class="network-icon">
              <wui-image src=${n(p.getNetworkImage(e))}></wui-image>
            </wui-flex>
          `)}
      </wui-flex>
    `}};I.styles=[R],P([l({type:Boolean})],I.prototype,"disabled",void 0),P([l()],I.prototype,"color",void 0),P([l()],I.prototype,"name",void 0),P([l()],I.prototype,"label",void 0),P([l()],I.prototype,"feeRange",void 0),P([l({type:Boolean})],I.prototype,"loading",void 0),P([l()],I.prototype,"onClick",void 0),I=P([u("w3m-onramp-provider-item")],I);var O=function(e,t,r,i){var o,n=arguments.length,s=n<3?t:null===i?i=Object.getOwnPropertyDescriptor(t,r):i;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)s=Reflect.decorate(e,t,r,i);else for(var a=e.length-1;a>=0;a--)(o=e[a])&&(s=(n<3?o(s):n>3?o(t,r,s):o(t,r))||s);return n>3&&s&&Object.defineProperty(t,r,s),s};let j=class extends t{constructor(){super(),this.unsubscribe=[],this.providers=x.state.providers,this.unsubscribe.push(x.subscribeKey("providers",e=>{this.providers=e}))}render(){return s`
      <wui-flex flexDirection="column" .padding=${["0","3","3","3"]} gap="2">
        ${this.onRampProvidersTemplate()}
      </wui-flex>
    `}onRampProvidersTemplate(){return this.providers.filter(e=>e.supportedChains.includes(d.state.activeChain??"eip155")).map(e=>s`
          <w3m-onramp-provider-item
            label=${e.label}
            name=${e.name}
            feeRange=${e.feeRange}
            @click=${()=>{this.onClickProvider(e)}}
            ?disabled=${!e.url}
            data-testid=${`onramp-provider-${e.name}`}
          ></w3m-onramp-provider-item>
        `)}onClickProvider(e){var t;x.setSelectedProvider(e),m.push("BuyInProgress"),h.openHref((null==(t=x.state.selectedProvider)?void 0:t.url)||e.url,"popupWindow","width=600,height=800,scrollbars=yes"),y.sendEvent({type:"track",event:"SELECT_BUY_PROVIDER",properties:{provider:e.name,isSmartAccount:g(d.state.activeChain)===w.ACCOUNT_TYPES.SMART_ACCOUNT}})}};O([c()],j.prototype,"providers",void 0),j=O([u("w3m-onramp-providers-view")],j);const A=e`
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
`;var T=function(e,t,r,i){var o,n=arguments.length,s=n<3?t:null===i?i=Object.getOwnPropertyDescriptor(t,r):i;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)s=Reflect.decorate(e,t,r,i);else for(var a=e.length-1;a>=0;a--)(o=e[a])&&(s=(n<3?o(s):n>3?o(t,r,s):o(t,r))||s);return n>3&&s&&Object.defineProperty(t,r,s),s};let D=class extends t{constructor(){super(),this.unsubscribe=[],this.selectedCurrency=x.state.purchaseCurrencies,this.tokens=x.state.purchaseCurrencies,this.tokenImages=r.state.tokenImages,this.checked=i.state.isLegalCheckboxChecked,this.unsubscribe.push(x.subscribe(e=>{this.selectedCurrency=e.purchaseCurrencies,this.tokens=e.purchaseCurrencies}),r.subscribeKey("tokenImages",e=>this.tokenImages=e),i.subscribeKey("isLegalCheckboxChecked",e=>{this.checked=e}))}disconnectedCallback(){this.unsubscribe.forEach(e=>e())}render(){var e;const{termsConditionsUrl:t,privacyPolicyUrl:r}=o.state,i=null==(e=o.state.features)?void 0:e.legalCheckbox,a=Boolean(t||r)&&Boolean(i)&&!this.checked;return s`
      <w3m-legal-checkbox></w3m-legal-checkbox>
      <wui-flex
        flexDirection="column"
        .padding=${["0","3","3","3"]}
        gap="2"
        class=${n(a?"disabled":void 0)}
      >
        ${this.currenciesTemplate(a)}
      </wui-flex>
    `}currenciesTemplate(e=!1){return this.tokens.map(t=>{var r;return s`
        <wui-list-item
          imageSrc=${n(null==(r=this.tokenImages)?void 0:r[t.symbol])}
          @click=${()=>this.selectToken(t)}
          variant="image"
          tabIdx=${n(e?-1:void 0)}
        >
          <wui-flex gap="1" alignItems="center">
            <wui-text variant="md-medium" color="primary">${t.name}</wui-text>
            <wui-text variant="sm-regular" color="secondary">${t.symbol}</wui-text>
          </wui-flex>
        </wui-list-item>
      `})}selectToken(e){e&&(x.setPurchaseCurrency(e),a.close())}};D.styles=A,T([c()],D.prototype,"selectedCurrency",void 0),T([c()],D.prototype,"tokens",void 0),T([c()],D.prototype,"tokenImages",void 0),T([c()],D.prototype,"checked",void 0),D=T([u("w3m-onramp-token-select-view")],D);const B=e`
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
`;var L=function(e,t,r,i){var o,n=arguments.length,s=n<3?t:null===i?i=Object.getOwnPropertyDescriptor(t,r):i;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)s=Reflect.decorate(e,t,r,i);else for(var a=e.length-1;a>=0;a--)(o=e[a])&&(s=(n<3?o(s):n>3?o(t,r,s):o(t,r))||s);return n>3&&s&&Object.defineProperty(t,r,s),s};let S=class extends t{constructor(){super(),this.unsubscribe=[],this.selectedOnRampProvider=x.state.selectedProvider,this.uri=f.state.wcUri,this.ready=!1,this.showRetry=!1,this.buffering=!1,this.error=!1,this.isMobile=!1,this.onRetry=void 0,this.unsubscribe.push(x.subscribeKey("selectedProvider",e=>{this.selectedOnRampProvider=e}))}disconnectedCallback(){this.intervalId&&clearInterval(this.intervalId)}render(){var e,t;let r="Continue in external window";this.error?r="Buy failed":this.selectedOnRampProvider&&(r=`Buy in ${null==(e=this.selectedOnRampProvider)?void 0:e.label}`);const i=this.error?"Buy can be declined from your side or due to and error on the provider app":"We’ll notify you once your Buy is processed";return s`
      <wui-flex
        data-error=${n(this.error)}
        data-retry=${this.showRetry}
        flexDirection="column"
        alignItems="center"
        .padding=${["10","5","5","5"]}
        gap="5"
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
    `}onTryAgain(){this.selectedOnRampProvider&&(this.error=!1,h.openHref(this.selectedOnRampProvider.url,"popupWindow","width=600,height=800,scrollbars=yes"))}tryAgainTemplate(){var e;return(null==(e=this.selectedOnRampProvider)?void 0:e.url)?s`<wui-button size="md" variant="accent" @click=${this.onTryAgain.bind(this)}>
      <wui-icon color="inherit" slot="iconLeft" name="refresh"></wui-icon>
      Try again
    </wui-button>`:null}loaderTemplate(){const e=b.state.themeVariables["--w3m-border-radius-master"],t=e?parseInt(e.replace("px",""),10):4;return s`<wui-loading-thumbnail radius=${9*t}></wui-loading-thumbnail>`}onCopyUri(){var e;if(!(null==(e=this.selectedOnRampProvider)?void 0:e.url))return v.showError("No link found"),void m.goBack();try{h.copyToClopboard(this.selectedOnRampProvider.url),v.showSuccess("Link copied")}catch{v.showError("Failed to copy")}}};S.styles=B,L([c()],S.prototype,"intervalId",void 0),L([c()],S.prototype,"selectedOnRampProvider",void 0),L([c()],S.prototype,"uri",void 0),L([c()],S.prototype,"ready",void 0),L([c()],S.prototype,"showRetry",void 0),L([c()],S.prototype,"buffering",void 0),L([c()],S.prototype,"error",void 0),L([l({type:Boolean})],S.prototype,"isMobile",void 0),L([l()],S.prototype,"onRetry",void 0),S=L([u("w3m-buy-in-progress-view")],S);let U=class extends t{render(){return s`
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
        <wui-button @click=${m.goBack}>
          <wui-icon size="sm" color="inherit" name="add" slot="iconLeft"></wui-icon>
          Buy
        </wui-button>
      </wui-flex>
    `}};U=function(e,t,r,i){var o,n=arguments.length,s=n<3?t:null===i?i=Object.getOwnPropertyDescriptor(t,r):i;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)s=Reflect.decorate(e,t,r,i);else for(var a=e.length-1;a>=0;a--)(o=e[a])&&(s=(n<3?o(s):n>3?o(t,r,s):o(t,r))||s);return n>3&&s&&Object.defineProperty(t,r,s),s}([u("w3m-what-is-a-buy-view")],U);const z=e`
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
`;var E=function(e,t,r,i){var o,n=arguments.length,s=n<3?t:null===i?i=Object.getOwnPropertyDescriptor(t,r):i;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)s=Reflect.decorate(e,t,r,i);else for(var a=e.length-1;a>=0;a--)(o=e[a])&&(s=(n<3?o(s):n>3?o(t,r,s):o(t,r))||s);return n>3&&s&&Object.defineProperty(t,r,s),s};let K=class extends t{constructor(){var e;super(),this.unsubscribe=[],this.type="Token",this.value=0,this.currencies=[],this.selectedCurrency=null==(e=this.currencies)?void 0:e[0],this.currencyImages=r.state.currencyImages,this.tokenImages=r.state.tokenImages,this.unsubscribe.push(x.subscribeKey("purchaseCurrency",e=>{e&&"Fiat"!==this.type&&(this.selectedCurrency=this.formatPurchaseCurrency(e))}),x.subscribeKey("paymentCurrency",e=>{e&&"Token"!==this.type&&(this.selectedCurrency=this.formatPaymentCurrency(e))}),x.subscribe(e=>{"Fiat"===this.type?this.currencies=e.purchaseCurrencies.map(this.formatPurchaseCurrency):this.currencies=e.paymentCurrencies.map(this.formatPaymentCurrency)}),r.subscribe(e=>{this.currencyImages={...e.currencyImages},this.tokenImages={...e.tokenImages}}))}firstUpdated(){x.getAvailableCurrencies()}disconnectedCallback(){this.unsubscribe.forEach(e=>e())}render(){var e;const t=(null==(e=this.selectedCurrency)?void 0:e.symbol)||"",r=this.currencyImages[t]||this.tokenImages[t];return s`<wui-input-text type="number" size="lg" value=${this.value}>
      ${this.selectedCurrency?s` <wui-flex
            class="currency-container"
            justifyContent="space-between"
            alignItems="center"
            gap="1"
            @click=${()=>a.open({view:`OnRamp${this.type}Select`})}
          >
            <wui-image src=${n(r)}></wui-image>
            <wui-text color="primary">${this.selectedCurrency.symbol}</wui-text>
          </wui-flex>`:s`<wui-loading-spinner></wui-loading-spinner>`}
    </wui-input-text>`}formatPaymentCurrency(e){return{name:e.id,symbol:e.id}}formatPurchaseCurrency(e){return{name:e.name,symbol:e.symbol}}};K.styles=z,E([l({type:String})],K.prototype,"type",void 0),E([l({type:Number})],K.prototype,"value",void 0),E([c()],K.prototype,"currencies",void 0),E([c()],K.prototype,"selectedCurrency",void 0),E([c()],K.prototype,"currencyImages",void 0),E([c()],K.prototype,"tokenImages",void 0),K=E([u("w3m-onramp-input")],K);const q=e`
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
`;var W=function(e,t,r,i){var o,n=arguments.length,s=n<3?t:null===i?i=Object.getOwnPropertyDescriptor(t,r):i;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)s=Reflect.decorate(e,t,r,i);else for(var a=e.length-1;a>=0;a--)(o=e[a])&&(s=(n<3?o(s):n>3?o(t,r,s):o(t,r))||s);return n>3&&s&&Object.defineProperty(t,r,s),s};const N={USD:"$",EUR:"€",GBP:"£"},X=[100,250,500,1e3];let F=class extends t{constructor(){super(),this.unsubscribe=[],this.disabled=!1,this.caipAddress=d.state.activeCaipAddress,this.loading=a.state.loading,this.paymentCurrency=x.state.paymentCurrency,this.paymentAmount=x.state.paymentAmount,this.purchaseAmount=x.state.purchaseAmount,this.quoteLoading=x.state.quotesLoading,this.unsubscribe.push(d.subscribeKey("activeCaipAddress",e=>this.caipAddress=e),a.subscribeKey("loading",e=>{this.loading=e}),x.subscribe(e=>{this.paymentCurrency=e.paymentCurrency,this.paymentAmount=e.paymentAmount,this.purchaseAmount=e.purchaseAmount,this.quoteLoading=e.quotesLoading}))}disconnectedCallback(){this.unsubscribe.forEach(e=>e())}render(){return s`
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
            ${X.map(e=>{var t;return s`<wui-button
                  variant=${this.paymentAmount===e?"accent-secondary":"neutral-secondary"}
                  size="md"
                  textVariant="md-medium"
                  fullWidth
                  @click=${()=>this.selectPresetAmount(e)}
                  >${`${N[(null==(t=this.paymentCurrency)?void 0:t.id)||"USD"]} ${e}`}</wui-button
                >`})}
          </wui-flex>
          ${this.templateButton()}
        </wui-flex>
      </wui-flex>
    `}templateButton(){return this.caipAddress?s`<wui-button
          @click=${this.getQuotes.bind(this)}
          variant="accent-primary"
          fullWidth
          size="lg"
          borderRadius="xs"
        >
          Get quotes
        </wui-button>`:s`<wui-button
          @click=${this.openModal.bind(this)}
          variant="accent"
          fullWidth
          size="lg"
          borderRadius="xs"
        >
          Connect wallet
        </wui-button>`}getQuotes(){this.loading||a.open({view:"OnRampProviders"})}openModal(){a.open({view:"Connect"})}async onPaymentAmountChange(e){x.setPaymentAmount(Number(e.detail)),await x.getQuote()}async selectPresetAmount(e){x.setPaymentAmount(e),await x.getQuote()}};F.styles=q,W([l({type:Boolean})],F.prototype,"disabled",void 0),W([c()],F.prototype,"caipAddress",void 0),W([c()],F.prototype,"loading",void 0),W([c()],F.prototype,"paymentCurrency",void 0),W([c()],F.prototype,"paymentAmount",void 0),W([c()],F.prototype,"purchaseAmount",void 0),W([c()],F.prototype,"quoteLoading",void 0),F=W([u("w3m-onramp-widget")],F);export{S as W3mBuyInProgressView,j as W3mOnRampProvidersView,C as W3mOnrampFiatSelectView,D as W3mOnrampTokensView,F as W3mOnrampWidget,U as W3mWhatIsABuyView};
