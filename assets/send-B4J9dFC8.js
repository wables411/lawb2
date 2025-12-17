import{c as e,n as t,g as i,a as n,i as r,b as o,x as s,d as a,U as l,r as c,e as u,o as d}from"./react-Cq2T3XCZ.js";import{b as h,a as p,C as f,Y as m,R as g,N as w,M as k,S as v,e as b,d as x,j as y,Z as $,v as A,E as T}from"./W3MFrameProviderSingleton-Cckh9zXZ.js";import"./index-Cy7KOe8I.js";import"./index-jdOIHI52.js";import{S as C}from"./SwapController-CwGI_FsT.js";import{C as R}from"./NetworkUtil-8PBlJxlj.js";import"./react-vendor-BlDtUSDV.js";import"./wagmi-vendor-Cdr5VkDk.js";import"./index-CFYEtFbK.js";const P=e`
  :host {
    width: 100%;
    height: 100px;
    border-radius: ${({borderRadius:e})=>e[5]};
    border: 1px solid ${({tokens:e})=>e.theme.foregroundPrimary};
    background-color: ${({tokens:e})=>e.theme.foregroundPrimary};
    transition: background-color ${({durations:e})=>e.lg}
      ${({easings:e})=>e["ease-out-power-1"]};
    will-change: background-color;
    position: relative;
  }

  :host(:hover) {
    background-color: ${({tokens:e})=>e.theme.foregroundSecondary};
  }

  wui-flex {
    width: 100%;
    height: fit-content;
  }

  wui-button {
    display: ruby;
    color: ${({tokens:e})=>e.theme.textPrimary};
    margin: 0 ${({spacing:e})=>e[2]};
  }

  .instruction {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    z-index: 2;
  }

  .paste {
    display: inline-flex;
  }

  textarea {
    background: transparent;
    width: 100%;
    font-family: ${({fontFamily:e})=>e.regular};
    font-style: normal;
    font-size: ${({textSize:e})=>e.large};
    font-weight: ${({fontWeight:e})=>e.regular};
    line-height: ${({typography:e})=>e["lg-regular"].lineHeight};
    letter-spacing: ${({typography:e})=>e["lg-regular"].letterSpacing};
    color: ${({tokens:e})=>e.theme.textSecondary};
    caret-color: ${({tokens:e})=>e.core.backgroundAccentPrimary};
    box-sizing: border-box;
    -webkit-appearance: none;
    -moz-appearance: textfield;
    padding: 0px;
    border: none;
    outline: none;
    appearance: none;
    resize: none;
    overflow: hidden;
  }
`;var S=function(e,t,i,n){var r,o=arguments.length,s=o<3?t:null===n?n=Object.getOwnPropertyDescriptor(t,i):n;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)s=Reflect.decorate(e,t,i,n);else for(var a=e.length-1;a>=0;a--)(r=e[a])&&(s=(o<3?r(s):o>3?r(t,i,s):r(t,i))||s);return o>3&&s&&Object.defineProperty(t,i,s),s};let N=class extends r{constructor(){super(...arguments),this.inputElementRef=o(),this.instructionElementRef=o(),this.readOnly=!1,this.instructionHidden=Boolean(this.value),this.pasting=!1,this.onDebouncedSearch=h.debounce(async e=>{if(!e.length)return void this.setReceiverAddress("");const t=p.state.activeChain;if(h.isAddress(e,t))this.setReceiverAddress(e);else try{const t=await f.getEnsAddress(e);if(t){m.setReceiverProfileName(e),m.setReceiverAddress(t);const i=await f.getEnsAvatar(e);m.setReceiverProfileImageUrl(i||void 0)}}catch(i){this.setReceiverAddress(e)}finally{m.setLoading(!1)}})}firstUpdated(){this.value&&(this.instructionHidden=!0),this.checkHidden()}render(){return this.readOnly?s` <wui-flex
        flexDirection="column"
        justifyContent="center"
        gap="01"
        .padding=${["8","4","5","4"]}
      >
        <textarea
          spellcheck="false"
          ?disabled=${!0}
          autocomplete="off"
          .value=${this.value??""}
        >
           ${this.value??""}</textarea
        >
      </wui-flex>`:s` <wui-flex
      @click=${this.onBoxClick.bind(this)}
      flexDirection="column"
      justifyContent="center"
      gap="01"
      .padding=${["8","4","5","4"]}
    >
      <wui-text
        ${a(this.instructionElementRef)}
        class="instruction"
        color="secondary"
        variant="md-medium"
      >
        Type or
        <wui-button
          class="paste"
          size="md"
          variant="neutral-secondary"
          iconLeft="copy"
          @click=${this.onPasteClick.bind(this)}
        >
          <wui-icon size="sm" color="inherit" slot="iconLeft" name="copy"></wui-icon>
          Paste
        </wui-button>
        address
      </wui-text>
      <textarea
        spellcheck="false"
        ?disabled=${!this.instructionHidden}
        ${a(this.inputElementRef)}
        @input=${this.onInputChange.bind(this)}
        @blur=${this.onBlur.bind(this)}
        .value=${this.value??""}
        autocomplete="off"
      >
${this.value??""}</textarea
      >
    </wui-flex>`}async focusInput(){var e;this.instructionElementRef.value&&(this.instructionHidden=!0,await this.toggleInstructionFocus(!1),this.instructionElementRef.value.style.pointerEvents="none",null==(e=this.inputElementRef.value)||e.focus(),this.inputElementRef.value&&(this.inputElementRef.value.selectionStart=this.inputElementRef.value.selectionEnd=this.inputElementRef.value.value.length))}async focusInstruction(){var e;this.instructionElementRef.value&&(this.instructionHidden=!1,await this.toggleInstructionFocus(!0),this.instructionElementRef.value.style.pointerEvents="auto",null==(e=this.inputElementRef.value)||e.blur())}async toggleInstructionFocus(e){this.instructionElementRef.value&&await this.instructionElementRef.value.animate([{opacity:e?0:1},{opacity:e?1:0}],{duration:100,easing:"ease",fill:"forwards"}).finished}onBoxClick(){this.value||this.instructionHidden||this.focusInput()}onBlur(){this.value||!this.instructionHidden||this.pasting||this.focusInstruction()}checkHidden(){this.instructionHidden&&this.focusInput()}async onPasteClick(){this.pasting=!0;const e=await navigator.clipboard.readText();m.setReceiverAddress(e),this.focusInput()}onInputChange(e){var t;const i=e.target;this.pasting=!1,this.value=null==(t=e.target)?void 0:t.value,i.value&&!this.instructionHidden&&this.focusInput(),m.setLoading(!0),this.onDebouncedSearch(i.value)}setReceiverAddress(e){m.setReceiverAddress(e),m.setReceiverProfileName(void 0),m.setReceiverProfileImageUrl(void 0),m.setLoading(!1)}};N.styles=P,S([t()],N.prototype,"value",void 0),S([t({type:Boolean})],N.prototype,"readOnly",void 0),S([i()],N.prototype,"instructionHidden",void 0),S([i()],N.prototype,"pasting",void 0),N=S([n("w3m-input-address")],N);const E=e`
  :host {
    width: 100%;
    height: 100px;
    border-radius: ${({borderRadius:e})=>e[5]};
    border: 1px solid ${({tokens:e})=>e.theme.foregroundPrimary};
    background-color: ${({tokens:e})=>e.theme.foregroundPrimary};
    transition: background-color ${({durations:e})=>e.lg}
      ${({easings:e})=>e["ease-out-power-1"]};
    will-change: background-color;
    transition: all ${({easings:e})=>e["ease-out-power-1"]}
      ${({durations:e})=>e.lg};
  }

  :host(:hover) {
    background-color: ${({tokens:e})=>e.theme.foregroundSecondary};
  }

  wui-flex {
    width: 100%;
    height: fit-content;
  }

  wui-button {
    width: 100%;
    display: flex;
    justify-content: flex-end;
  }

  wui-input-amount {
    mask-image: linear-gradient(
      270deg,
      transparent 0px,
      transparent 8px,
      black 24px,
      black 25px,
      black 32px,
      black 100%
    );
  }

  .totalValue {
    width: 100%;
  }
`;var I=function(e,t,i,n){var r,o=arguments.length,s=o<3?t:null===n?n=Object.getOwnPropertyDescriptor(t,i):n;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)s=Reflect.decorate(e,t,i,n);else for(var a=e.length-1;a>=0;a--)(r=e[a])&&(s=(o<3?r(s):o>3?r(t,i,s):r(t,i))||s);return o>3&&s&&Object.defineProperty(t,i,s),s};let j=class extends r{constructor(){super(...arguments),this.readOnly=!1,this.isInsufficientBalance=!1}render(){const e=this.readOnly||!this.token;return s` <wui-flex
      flexDirection="column"
      gap="01"
      .padding=${["5","3","4","3"]}
    >
      <wui-flex alignItems="center">
        <wui-input-amount
          @inputChange=${this.onInputChange.bind(this)}
          ?disabled=${e}
          .value=${this.sendTokenAmount?String(this.sendTokenAmount):""}
          ?error=${Boolean(this.isInsufficientBalance)}
        ></wui-input-amount>
        ${this.buttonTemplate()}
      </wui-flex>
      ${this.bottomTemplate()}
    </wui-flex>`}buttonTemplate(){return this.token?s`<wui-token-button
        text=${this.token.symbol}
        imageSrc=${this.token.iconUrl}
        @click=${this.handleSelectButtonClick.bind(this)}
      >
      </wui-token-button>`:s`<wui-button
      size="md"
      variant="neutral-secondary"
      @click=${this.handleSelectButtonClick.bind(this)}
      >Select token</wui-button
    >`}handleSelectButtonClick(){this.readOnly||g.push("WalletSendSelectToken")}sendValueTemplate(){if(!this.readOnly&&this.token&&this.sendTokenAmount){const e=this.token.price*this.sendTokenAmount;return s`<wui-text class="totalValue" variant="sm-regular" color="secondary"
        >${e?`$${w.formatNumberToLocalString(e,2)}`:"Incorrect value"}</wui-text
      >`}return null}maxAmountTemplate(){return this.token?s` <wui-text variant="sm-regular" color="secondary">
        ${l.roundNumber(Number(this.token.quantity.numeric),6,5)}
      </wui-text>`:null}actionTemplate(){return this.token?s`<wui-link @click=${this.onMaxClick.bind(this)}>Max</wui-link>`:null}bottomTemplate(){return this.readOnly?null:s`<wui-flex alignItems="center" justifyContent="space-between">
      ${this.sendValueTemplate()}
      <wui-flex alignItems="center" gap="01" justifyContent="flex-end">
        ${this.maxAmountTemplate()} ${this.actionTemplate()}
      </wui-flex>
    </wui-flex>`}onInputChange(e){m.setTokenAmount(e.detail)}onMaxClick(){if(this.token){const e=w.bigNumber(this.token.quantity.numeric);m.setTokenAmount(Number(e.toFixed(20)))}}};j.styles=E,I([t({type:Object})],j.prototype,"token",void 0),I([t({type:Boolean})],j.prototype,"readOnly",void 0),I([t({type:Number})],j.prototype,"sendTokenAmount",void 0),I([t({type:Boolean})],j.prototype,"isInsufficientBalance",void 0),j=I([n("w3m-input-token")],j);const B=e`
  :host {
    display: block;
  }

  wui-flex {
    position: relative;
  }

  wui-icon-box {
    width: 32px;
    height: 32px;
    border-radius: ${({borderRadius:e})=>e[10]} !important;
    border: 4px solid ${({tokens:e})=>e.theme.backgroundPrimary};
    background: ${({tokens:e})=>e.theme.foregroundPrimary};
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 3;
  }

  wui-button {
    --local-border-radius: ${({borderRadius:e})=>e[4]} !important;
  }

  .inputContainer {
    height: fit-content;
  }
`;var D=function(e,t,i,n){var r,o=arguments.length,s=o<3?t:null===n?n=Object.getOwnPropertyDescriptor(t,i):n;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)s=Reflect.decorate(e,t,i,n);else for(var a=e.length-1;a>=0;a--)(r=e[a])&&(s=(o<3?r(s):o>3?r(t,i,s):r(t,i))||s);return o>3&&s&&Object.defineProperty(t,i,s),s};const O="Insufficient Funds",z="Incorrect Value",W="Invalid Address",U="Add Address",V="Add Amount",F="Select Token",H="Preview Send";let _=class extends r{constructor(){var e,t;super(),this.unsubscribe=[],this.isTryingToChooseDifferentWallet=!1,this.token=m.state.token,this.sendTokenAmount=m.state.sendTokenAmount,this.receiverAddress=m.state.receiverAddress,this.receiverProfileName=m.state.receiverProfileName,this.loading=m.state.loading,this.params=null==(e=g.state.data)?void 0:e.send,this.caipAddress=null==(t=p.getAccountData())?void 0:t.caipAddress,this.message=H,this.disconnecting=!1,this.token&&!this.params&&(this.fetchBalances(),this.fetchNetworkPrice());const i=p.subscribeKey("activeCaipAddress",e=>{!e&&this.isTryingToChooseDifferentWallet&&(this.isTryingToChooseDifferentWallet=!1,k.open({view:"Connect",data:{redirectView:"WalletSend"}}).catch(()=>null),i())});this.unsubscribe.push(p.subscribeAccountStateProp("caipAddress",e=>{this.caipAddress=e}),m.subscribe(e=>{this.token=e.token,this.sendTokenAmount=e.sendTokenAmount,this.receiverAddress=e.receiverAddress,this.receiverProfileName=e.receiverProfileName,this.loading=e.loading}))}disconnectedCallback(){this.unsubscribe.forEach(e=>e())}async firstUpdated(){await this.handleSendParameters()}render(){this.getMessage();const e=Boolean(this.params);return s` <wui-flex flexDirection="column" .padding=${["0","4","4","4"]}>
      <wui-flex class="inputContainer" gap="2" flexDirection="column">
        <w3m-input-token
          .token=${this.token}
          .sendTokenAmount=${this.sendTokenAmount}
          ?readOnly=${e}
          ?isInsufficientBalance=${this.message===O}
        ></w3m-input-token>
        <wui-icon-box size="md" variant="secondary" icon="arrowBottom"></wui-icon-box>
        <w3m-input-address
          ?readOnly=${e}
          .value=${this.receiverProfileName?this.receiverProfileName:this.receiverAddress}
        ></w3m-input-address>
      </wui-flex>
      ${this.buttonTemplate()}
    </wui-flex>`}async fetchBalances(){await m.fetchTokenBalance(),m.fetchNetworkBalance()}async fetchNetworkPrice(){await C.getNetworkTokenPrice()}onButtonClick(){g.push("WalletSendPreview",{send:this.params})}onFundWalletClick(){g.push("FundWallet",{redirectView:"WalletSend"})}async onConnectDifferentWalletClick(){try{this.isTryingToChooseDifferentWallet=!0,this.disconnecting=!0,await f.disconnect()}finally{this.disconnecting=!1}}getMessage(){var e;if(this.message=H,this.receiverAddress&&!h.isAddress(this.receiverAddress,p.state.activeChain)&&(this.message=W),this.receiverAddress||(this.message=U),this.sendTokenAmount&&this.token&&this.sendTokenAmount>Number(this.token.quantity.numeric)&&(this.message=O),this.sendTokenAmount||(this.message=V),this.sendTokenAmount&&(null==(e=this.token)?void 0:e.price)){this.sendTokenAmount*this.token.price||(this.message=z)}this.token||(this.message=F)}buttonTemplate(){const e=!this.message.startsWith(H),t=this.message===O,i=Boolean(this.params);return t&&!i?s`
        <wui-flex .margin=${["4","0","0","0"]} flexDirection="column" gap="4">
          <wui-button
            @click=${this.onFundWalletClick.bind(this)}
            size="lg"
            variant="accent-secondary"
            fullWidth
          >
            Fund Wallet
          </wui-button>

          <wui-separator data-testid="wui-separator" text="or"></wui-separator>

          <wui-button
            @click=${this.onConnectDifferentWalletClick.bind(this)}
            size="lg"
            variant="neutral-secondary"
            fullWidth
            ?loading=${this.disconnecting}
          >
            Connect a different wallet
          </wui-button>
        </wui-flex>
      `:s`<wui-flex .margin=${["4","0","0","0"]}>
      <wui-button
        @click=${this.onButtonClick.bind(this)}
        ?disabled=${e}
        size="lg"
        variant="accent-primary"
        ?loading=${this.loading}
        fullWidth
      >
        ${this.message}
      </wui-button>
    </wui-flex>`}async handleSendParameters(){if(this.loading=!0,!this.params)return void(this.loading=!1);const e=Number(this.params.amount);if(isNaN(e))return v.showError("Invalid amount"),void(this.loading=!1);const{namespace:t,chainId:i,assetAddress:n}=this.params;if(!b.SEND_PARAMS_SUPPORTED_CHAINS.includes(t))return v.showError(`Chain "${t}" is not supported for send parameters`),void(this.loading=!1);const r=p.getCaipNetworkById(i,t);if(!r)return v.showError(`Network with id "${i}" not found`),void(this.loading=!1);try{const{balance:t,name:i,symbol:o,decimals:s}=await x.fetchERC20Balance({caipAddress:this.caipAddress,assetAddress:n,caipNetwork:r});if(!(i&&o&&s&&t))return void v.showError("Token not found");m.setToken({name:i,symbol:o,chainId:r.id.toString(),address:`${r.chainNamespace}:${r.id}:${n}`,value:0,price:0,quantity:{decimals:s.toString(),numeric:t.toString()},iconUrl:y.getTokenImage(o)??""}),m.setTokenAmount(e),m.setReceiverAddress(this.params.to)}catch(o){console.error("Failed to load token information:",o),v.showError("Failed to load token information")}finally{this.loading=!1}}};_.styles=B,D([i()],_.prototype,"token",void 0),D([i()],_.prototype,"sendTokenAmount",void 0),D([i()],_.prototype,"receiverAddress",void 0),D([i()],_.prototype,"receiverProfileName",void 0),D([i()],_.prototype,"loading",void 0),D([i()],_.prototype,"params",void 0),D([i()],_.prototype,"caipAddress",void 0),D([i()],_.prototype,"message",void 0),D([i()],_.prototype,"disconnecting",void 0),_=D([n("w3m-wallet-send-view")],_);const L=e`
  .contentContainer {
    height: 440px;
    overflow: scroll;
    scrollbar-width: none;
  }

  .contentContainer::-webkit-scrollbar {
    display: none;
  }

  wui-icon-box {
    width: 40px;
    height: 40px;
    border-radius: ${({borderRadius:e})=>e[3]};
  }
`;var M=function(e,t,i,n){var r,o=arguments.length,s=o<3?t:null===n?n=Object.getOwnPropertyDescriptor(t,i):n;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)s=Reflect.decorate(e,t,i,n);else for(var a=e.length-1;a>=0;a--)(r=e[a])&&(s=(o<3?r(s):o>3?r(t,i,s):r(t,i))||s);return o>3&&s&&Object.defineProperty(t,i,s),s};let q=class extends r{constructor(){super(),this.unsubscribe=[],this.tokenBalances=m.state.tokenBalances,this.search="",this.onDebouncedSearch=h.debounce(e=>{this.search=e}),this.fetchBalancesAndNetworkPrice(),this.unsubscribe.push(m.subscribe(e=>{this.tokenBalances=e.tokenBalances}))}disconnectedCallback(){this.unsubscribe.forEach(e=>e())}render(){return s`
      <wui-flex flexDirection="column">
        ${this.templateSearchInput()} <wui-separator></wui-separator> ${this.templateTokens()}
      </wui-flex>
    `}async fetchBalancesAndNetworkPrice(){var e;this.tokenBalances&&0!==(null==(e=this.tokenBalances)?void 0:e.length)||(await this.fetchBalances(),await this.fetchNetworkPrice())}async fetchBalances(){await m.fetchTokenBalance(),m.fetchNetworkBalance()}async fetchNetworkPrice(){await C.getNetworkTokenPrice()}templateSearchInput(){return s`
      <wui-flex gap="2" padding="3">
        <wui-input-text
          @inputChange=${this.onInputChange.bind(this)}
          class="network-search-input"
          size="sm"
          placeholder="Search token"
          icon="search"
        ></wui-input-text>
      </wui-flex>
    `}templateTokens(){var e,t;return this.tokens=null==(e=this.tokenBalances)?void 0:e.filter(e=>{var t;return e.chainId===(null==(t=p.state.activeCaipNetwork)?void 0:t.caipNetworkId)}),this.search?this.filteredTokens=null==(t=this.tokenBalances)?void 0:t.filter(e=>e.name.toLowerCase().includes(this.search.toLowerCase())):this.filteredTokens=this.tokens,s`
      <wui-flex
        class="contentContainer"
        flexDirection="column"
        .padding=${["0","3","0","3"]}
      >
        <wui-flex justifyContent="flex-start" .padding=${["4","3","3","3"]}>
          <wui-text variant="md-medium" color="secondary">Your tokens</wui-text>
        </wui-flex>
        <wui-flex flexDirection="column" gap="2">
          ${this.filteredTokens&&this.filteredTokens.length>0?this.filteredTokens.map(e=>s`<wui-list-token
                    @click=${this.handleTokenClick.bind(this,e)}
                    ?clickable=${!0}
                    tokenName=${e.name}
                    tokenImageUrl=${e.iconUrl}
                    tokenAmount=${e.quantity.numeric}
                    tokenValue=${e.value}
                    tokenCurrency=${e.symbol}
                  ></wui-list-token>`):s`<wui-flex
                .padding=${["20","0","0","0"]}
                alignItems="center"
                flexDirection="column"
                gap="4"
              >
                <wui-icon-box icon="coinPlaceholder" color="default" size="lg"></wui-icon-box>
                <wui-flex
                  class="textContent"
                  gap="2"
                  flexDirection="column"
                  justifyContent="center"
                  flexDirection="column"
                >
                  <wui-text variant="lg-medium" align="center" color="primary">
                    No tokens found
                  </wui-text>
                  <wui-text variant="lg-regular" align="center" color="secondary">
                    Your tokens will appear here
                  </wui-text>
                </wui-flex>
                <wui-link @click=${this.onBuyClick.bind(this)}>Buy</wui-link>
              </wui-flex>`}
        </wui-flex>
      </wui-flex>
    `}onBuyClick(){g.push("OnRampProviders")}onInputChange(e){this.onDebouncedSearch(e.detail)}handleTokenClick(e){m.setToken(e),m.setTokenAmount(void 0),g.goBack()}};q.styles=L,M([i()],q.prototype,"tokenBalances",void 0),M([i()],q.prototype,"tokens",void 0),M([i()],q.prototype,"filteredTokens",void 0),M([i()],q.prototype,"search",void 0),q=M([n("w3m-wallet-send-select-token-view")],q);const Y=e`
  :host {
    height: 32px;
    display: flex;
    align-items: center;
    gap: ${({spacing:e})=>e[1]};
    border-radius: ${({borderRadius:e})=>e[32]};
    background-color: ${({tokens:e})=>e.theme.foregroundPrimary};
    padding: ${({spacing:e})=>e[1]};
    padding-left: ${({spacing:e})=>e[2]};
  }

  wui-avatar,
  wui-image {
    width: 24px;
    height: 24px;
    border-radius: ${({borderRadius:e})=>e[16]};
  }

  wui-icon {
    border-radius: ${({borderRadius:e})=>e[16]};
  }
`;var J=function(e,t,i,n){var r,o=arguments.length,s=o<3?t:null===n?n=Object.getOwnPropertyDescriptor(t,i):n;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)s=Reflect.decorate(e,t,i,n);else for(var a=e.length-1;a>=0;a--)(r=e[a])&&(s=(o<3?r(s):o>3?r(t,i,s):r(t,i))||s);return o>3&&s&&Object.defineProperty(t,i,s),s};let K=class extends r{constructor(){super(...arguments),this.text=""}render(){return s`<wui-text variant="lg-regular" color="primary">${this.text}</wui-text>
      ${this.imageTemplate()}`}imageTemplate(){return this.address?s`<wui-avatar address=${this.address} .imageSrc=${this.imageSrc}></wui-avatar>`:this.imageSrc?s`<wui-image src=${this.imageSrc}></wui-image>`:s`<wui-icon size="lg" color="inverse" name="networkPlaceholder"></wui-icon>`}};K.styles=[c,u,Y],J([t({type:String})],K.prototype,"text",void 0),J([t({type:String})],K.prototype,"address",void 0),J([t({type:String})],K.prototype,"imageSrc",void 0),K=J([n("wui-preview-item")],K);const Q=e`
  :host {
    display: flex;
    padding: ${({spacing:e})=>e[4]} ${({spacing:e})=>e[3]};
    width: 100%;
    background-color: ${({tokens:e})=>e.theme.foregroundPrimary};
    border-radius: ${({borderRadius:e})=>e[4]};
  }

  wui-image {
    width: 20px;
    height: 20px;
    border-radius: ${({borderRadius:e})=>e[16]};
  }

  wui-icon {
    width: 20px;
    height: 20px;
  }
`;var Z=function(e,t,i,n){var r,o=arguments.length,s=o<3?t:null===n?n=Object.getOwnPropertyDescriptor(t,i):n;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)s=Reflect.decorate(e,t,i,n);else for(var a=e.length-1;a>=0;a--)(r=e[a])&&(s=(o<3?r(s):o>3?r(t,i,s):r(t,i))||s);return o>3&&s&&Object.defineProperty(t,i,s),s};let G=class extends r{constructor(){super(...arguments),this.imageSrc=void 0,this.textTitle="",this.textValue=void 0}render(){return s`
      <wui-flex justifyContent="space-between" alignItems="center">
        <wui-text variant="lg-regular" color="primary"> ${this.textTitle} </wui-text>
        ${this.templateContent()}
      </wui-flex>
    `}templateContent(){return this.imageSrc?s`<wui-image src=${this.imageSrc} alt=${this.textTitle}></wui-image>`:this.textValue?s` <wui-text variant="md-regular" color="secondary"> ${this.textValue} </wui-text>`:s`<wui-icon size="inherit" color="default" name="networkPlaceholder"></wui-icon>`}};G.styles=[c,u,Q],Z([t()],G.prototype,"imageSrc",void 0),Z([t()],G.prototype,"textTitle",void 0),Z([t()],G.prototype,"textValue",void 0),G=Z([n("wui-list-content")],G);const X=e`
  :host {
    display: flex;
    width: auto;
    flex-direction: column;
    gap: ${({spacing:e})=>e[1]};
    border-radius: ${({borderRadius:e})=>e[5]};
    background: ${({tokens:e})=>e.theme.foregroundPrimary};
    padding: ${({spacing:e})=>e[3]} ${({spacing:e})=>e[2]}
      ${({spacing:e})=>e[2]} ${({spacing:e})=>e[2]};
  }

  wui-list-content {
    width: -webkit-fill-available !important;
  }

  wui-text {
    padding: 0 ${({spacing:e})=>e[2]};
  }

  wui-flex {
    margin-top: ${({spacing:e})=>e[2]};
  }

  .network {
    cursor: pointer;
    transition: background-color ${({durations:e})=>e.lg}
      ${({easings:e})=>e["ease-out-power-1"]};
    will-change: background-color;
  }

  .network:focus-visible {
    border: 1px solid ${({tokens:e})=>e.core.textAccentPrimary};
    background-color: ${({tokens:e})=>e.core.glass010};
    -webkit-box-shadow: 0px 0px 0px 4px ${({tokens:e})=>e.core.foregroundAccent010};
    -moz-box-shadow: 0px 0px 0px 4px ${({tokens:e})=>e.core.foregroundAccent010};
    box-shadow: 0px 0px 0px 4px ${({tokens:e})=>e.core.foregroundAccent010};
  }

  .network:hover {
    background-color: ${({tokens:e})=>e.core.glass010};
  }

  .network:active {
    background-color: ${({tokens:e})=>e.core.glass010};
  }
`;var ee=function(e,t,i,n){var r,o=arguments.length,s=o<3?t:null===n?n=Object.getOwnPropertyDescriptor(t,i):n;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)s=Reflect.decorate(e,t,i,n);else for(var a=e.length-1;a>=0;a--)(r=e[a])&&(s=(o<3?r(s):o>3?r(t,i,s):r(t,i))||s);return o>3&&s&&Object.defineProperty(t,i,s),s};let te=class extends r{constructor(){var e;super(...arguments),this.params=null==(e=g.state.data)?void 0:e.send}render(){return s` <wui-text variant="sm-regular" color="secondary">Details</wui-text>
      <wui-flex flexDirection="column" gap="1">
        <wui-list-content
          textTitle="Address"
          textValue=${l.getTruncateString({string:this.receiverAddress??"",charsStart:4,charsEnd:4,truncate:"middle"})}
        >
        </wui-list-content>
        ${this.networkTemplate()}
      </wui-flex>`}networkTemplate(){var e;return(null==(e=this.caipNetwork)?void 0:e.name)?s` <wui-list-content
        @click=${()=>this.onNetworkClick(this.caipNetwork)}
        class="network"
        textTitle="Network"
        imageSrc=${d(y.getNetworkImage(this.caipNetwork))}
      ></wui-list-content>`:null}onNetworkClick(e){e&&!this.params&&g.push("Networks",{network:e})}};te.styles=X,ee([t()],te.prototype,"receiverAddress",void 0),ee([t({type:Object})],te.prototype,"caipNetwork",void 0),ee([i()],te.prototype,"params",void 0),te=ee([n("w3m-wallet-send-details")],te);const ie=e`
  wui-avatar,
  wui-image {
    display: ruby;
    width: 32px;
    height: 32px;
    border-radius: ${({borderRadius:e})=>e[20]};
  }

  .sendButton {
    width: 70%;
    --local-width: 100% !important;
    --local-border-radius: ${({borderRadius:e})=>e[4]} !important;
  }

  .cancelButton {
    width: 30%;
    --local-width: 100% !important;
    --local-border-radius: ${({borderRadius:e})=>e[4]} !important;
  }
`;var ne=function(e,t,i,n){var r,o=arguments.length,s=o<3?t:null===n?n=Object.getOwnPropertyDescriptor(t,i):n;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)s=Reflect.decorate(e,t,i,n);else for(var a=e.length-1;a>=0;a--)(r=e[a])&&(s=(o<3?r(s):o>3?r(t,i,s):r(t,i))||s);return o>3&&s&&Object.defineProperty(t,i,s),s};let re=class extends r{constructor(){var e;super(),this.unsubscribe=[],this.token=m.state.token,this.sendTokenAmount=m.state.sendTokenAmount,this.receiverAddress=m.state.receiverAddress,this.receiverProfileName=m.state.receiverProfileName,this.receiverProfileImageUrl=m.state.receiverProfileImageUrl,this.caipNetwork=p.state.activeCaipNetwork,this.loading=m.state.loading,this.params=null==(e=g.state.data)?void 0:e.send,this.unsubscribe.push(m.subscribe(e=>{this.token=e.token,this.sendTokenAmount=e.sendTokenAmount,this.receiverAddress=e.receiverAddress,this.receiverProfileName=e.receiverProfileName,this.receiverProfileImageUrl=e.receiverProfileImageUrl,this.loading=e.loading}),p.subscribeKey("activeCaipNetwork",e=>this.caipNetwork=e))}disconnectedCallback(){this.unsubscribe.forEach(e=>e())}render(){var e,t;return s` <wui-flex flexDirection="column" .padding=${["0","4","4","4"]}>
      <wui-flex gap="2" flexDirection="column" .padding=${["0","2","0","2"]}>
        <wui-flex alignItems="center" justifyContent="space-between">
          <wui-flex flexDirection="column" gap="01">
            <wui-text variant="sm-regular" color="secondary">Send</wui-text>
            ${this.sendValueTemplate()}
          </wui-flex>
          <wui-preview-item
            text="${this.sendTokenAmount?l.roundNumber(this.sendTokenAmount,6,5):"unknown"} ${null==(e=this.token)?void 0:e.symbol}"
            .imageSrc=${null==(t=this.token)?void 0:t.iconUrl}
          ></wui-preview-item>
        </wui-flex>
        <wui-flex>
          <wui-icon color="default" size="md" name="arrowBottom"></wui-icon>
        </wui-flex>
        <wui-flex alignItems="center" justifyContent="space-between">
          <wui-text variant="sm-regular" color="secondary">To</wui-text>
          <wui-preview-item
            text="${this.receiverProfileName?l.getTruncateString({string:this.receiverProfileName,charsStart:20,charsEnd:0,truncate:"end"}):l.getTruncateString({string:this.receiverAddress?this.receiverAddress:"",charsStart:4,charsEnd:4,truncate:"middle"})}"
            address=${this.receiverAddress??""}
            .imageSrc=${this.receiverProfileImageUrl??void 0}
            .isAddress=${!0}
          ></wui-preview-item>
        </wui-flex>
      </wui-flex>
      <wui-flex flexDirection="column" .padding=${["6","0","0","0"]}>
        <w3m-wallet-send-details
          .caipNetwork=${this.caipNetwork}
          .receiverAddress=${this.receiverAddress}
        ></w3m-wallet-send-details>
        <wui-flex justifyContent="center" gap="1" .padding=${["3","0","0","0"]}>
          <wui-icon size="sm" color="default" name="warningCircle"></wui-icon>
          <wui-text variant="sm-regular" color="secondary">Review transaction carefully</wui-text>
        </wui-flex>
        <wui-flex justifyContent="center" gap="3" .padding=${["4","0","0","0"]}>
          <wui-button
            class="cancelButton"
            @click=${this.onCancelClick.bind(this)}
            size="lg"
            variant="neutral-secondary"
          >
            Cancel
          </wui-button>
          <wui-button
            class="sendButton"
            @click=${this.onSendClick.bind(this)}
            size="lg"
            variant="accent-primary"
            .loading=${this.loading}
          >
            Send
          </wui-button>
        </wui-flex>
      </wui-flex></wui-flex
    >`}sendValueTemplate(){if(!this.params&&this.token&&this.sendTokenAmount){const e=this.token.price*this.sendTokenAmount;return s`<wui-text variant="md-regular" color="primary"
        >$${e.toFixed(2)}</wui-text
      >`}return null}async onSendClick(){if(this.sendTokenAmount&&this.receiverAddress)try{await m.sendToken(),this.params?g.reset("WalletSendConfirmed"):(v.showSuccess("Transaction started"),g.replace("Account"))}catch(e){let t="Failed to send transaction. Please try again.";const i=e instanceof $&&e.originalName===A.PROVIDER_RPC_ERROR_NAME.USER_REJECTED_REQUEST;(p.state.activeChain===R.CHAIN.SOLANA||i)&&e instanceof Error&&(t=e.message),T.sendEvent({type:"track",event:i?"SEND_REJECTED":"SEND_ERROR",properties:m.getSdkEventProperties(e)}),v.showError(t)}else v.showError("Please enter a valid amount and receiver address")}onCancelClick(){g.goBack()}};re.styles=ie,ne([i()],re.prototype,"token",void 0),ne([i()],re.prototype,"sendTokenAmount",void 0),ne([i()],re.prototype,"receiverAddress",void 0),ne([i()],re.prototype,"receiverProfileName",void 0),ne([i()],re.prototype,"receiverProfileImageUrl",void 0),ne([i()],re.prototype,"caipNetwork",void 0),ne([i()],re.prototype,"loading",void 0),ne([i()],re.prototype,"params",void 0),re=ne([n("w3m-wallet-send-preview-view")],re);const oe=e`
  .icon-box {
    width: 64px;
    height: 64px;
    border-radius: 16px;
    background-color: ${({spacing:e})=>e[16]};
    border: 8px solid ${({tokens:e})=>e.theme.borderPrimary};
    border-radius: ${({borderRadius:e})=>e.round};
  }
`;let se=class extends r{constructor(){super(),this.unsubscribe=[],this.unsubscribe.push()}render(){return s`
      <wui-flex
        flexDirection="column"
        alignItems="center"
        gap="4"
        .padding="${["1","3","4","3"]}"
      >
        <wui-flex justifyContent="center" alignItems="center" class="icon-box">
          <wui-icon size="xxl" color="success" name="checkmark"></wui-icon>
        </wui-flex>

        <wui-text variant="h6-medium" color="primary">You successfully sent asset</wui-text>

        <wui-button
          fullWidth
          @click=${this.onCloseClick.bind(this)}
          size="lg"
          variant="neutral-secondary"
        >
          Close
        </wui-button>
      </wui-flex>
    `}onCloseClick(){k.close()}};se.styles=oe,se=function(e,t,i,n){var r,o=arguments.length,s=o<3?t:null===n?n=Object.getOwnPropertyDescriptor(t,i):n;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)s=Reflect.decorate(e,t,i,n);else for(var a=e.length-1;a>=0;a--)(r=e[a])&&(s=(o<3?r(s):o>3?r(t,i,s):r(t,i))||s);return o>3&&s&&Object.defineProperty(t,i,s),s}([n("w3m-send-confirmed-view")],se);export{se as W3mSendConfirmedView,q as W3mSendSelectTokenView,re as W3mWalletSendPreviewView,_ as W3mWalletSendView};
