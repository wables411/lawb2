import{f as e,i as t,x as a,o as n,g as s,a as r}from"./react-B_KiSx6v.js";import"./index-BIPnDyZT.js";import{O as i,K as o,b as c,a as l,L as u,C as d,Q as m,p,E as y,S as h,R as w,M as g,s as f,i as v,T as x,h as P,j as I}from"./W3MFrameProviderSingleton-CqxSc5tp.js";import{C as E}from"./NetworkUtil-8PBlJxlj.js";import"./react-vendor-BlDtUSDV.js";import"./wagmi-vendor-CiBmrtm3.js";import"./index-CFYEtFbK.js";const b="INVALID_PAYMENT_CONFIG",S="INVALID_RECIPIENT",A="INVALID_ASSET",k="INVALID_AMOUNT",C="UNKNOWN_ERROR",N="UNABLE_TO_INITIATE_PAYMENT",T="INVALID_CHAIN_NAMESPACE",U="GENERIC_PAYMENT_ERROR",D="UNABLE_TO_GET_EXCHANGES",_="ASSET_NOT_SUPPORTED",R="UNABLE_TO_GET_PAY_URL",$="UNABLE_TO_GET_BUY_STATUS",O={[b]:"Invalid payment configuration",[S]:"Invalid recipient address",[A]:"Invalid asset specified",[k]:"Invalid payment amount",[C]:"Unknown payment error occurred",[N]:"Unable to initiate payment",[T]:"Invalid chain namespace",[U]:"Unable to process payment",[D]:"Unable to get exchanges",[_]:"Asset not supported by the selected exchange",[R]:"Unable to get payment URL",[$]:"Unable to get buy status"};class L extends Error{get message(){return O[this.code]}constructor(e,t){super(O[e]),this.name="AppKitPayError",this.code=e,this.details=t,Error.captureStackTrace&&Error.captureStackTrace(this,L)}}class M extends Error{}async function W(e,t){const a=`https://rpc.walletconnect.org/v1/json-rpc?projectId=${i.getSnapshot().projectId}`,{sdkType:n,sdkVersion:s,projectId:r}=i.getSnapshot(),o={jsonrpc:"2.0",id:1,method:e,params:{...t||{},st:n,sv:s,projectId:r}},c=await fetch(a,{method:"POST",body:JSON.stringify(o),headers:{"Content-Type":"application/json"}}),l=await c.json();if(l.error)throw new M(l.error.message);return l}async function j(e){return(await W("reown_getExchanges",e)).result}const F=["eip155","solana"],Y={eip155:{native:{assetNamespace:"slip44",assetReference:"60"},defaultTokenNamespace:"erc20"},solana:{native:{assetNamespace:"slip44",assetReference:"501"},defaultTokenNamespace:"token"}};function G(e,t){const{chainNamespace:a,chainId:n}=o.parseCaipNetworkId(e),s=Y[a];if(!s)throw new Error(`Unsupported chain namespace for CAIP-19 formatting: ${a}`);let r=s.native.assetNamespace,i=s.native.assetReference;"native"!==t&&(r=s.defaultTokenNamespace,i=t);return`${`${a}:${n}`}/${r}:${i}`}const H="unknown",K=p({paymentAsset:{network:"eip155:1",asset:"0x0",metadata:{name:"0x0",symbol:"0x0",decimals:0}},recipient:"0x0",amount:0,isConfigured:!1,error:null,isPaymentInProgress:!1,exchanges:[],isLoading:!1,openInNewTab:!0,redirectUrl:void 0,payWithExchange:void 0,currentPayment:void 0,analyticsSet:!1,paymentId:void 0}),B={state:K,subscribe:e=>v(K,()=>e(K)),subscribeKey:(e,t)=>f(K,e,t),async handleOpenPay(e){this.resetState(),this.setPaymentConfig(e),this.subscribeEvents(),this.initializeAnalytics(),K.isConfigured=!0,y.sendEvent({type:"track",event:"PAY_MODAL_OPEN",properties:{exchanges:K.exchanges,configuration:{network:K.paymentAsset.network,asset:K.paymentAsset.asset,recipient:K.recipient,amount:K.amount}}}),await g.open({view:"Pay"})},resetState(){K.paymentAsset={network:"eip155:1",asset:"0x0",metadata:{name:"0x0",symbol:"0x0",decimals:0}},K.recipient="0x0",K.amount=0,K.isConfigured=!1,K.error=null,K.isPaymentInProgress=!1,K.isLoading=!1,K.currentPayment=void 0},setPaymentConfig(e){if(!e.paymentAsset)throw new L(b);try{K.paymentAsset=e.paymentAsset,K.recipient=e.recipient,K.amount=e.amount,K.openInNewTab=e.openInNewTab??!0,K.redirectUrl=e.redirectUrl,K.payWithExchange=e.payWithExchange,K.error=null}catch(t){throw new L(b,t.message)}},getPaymentAsset:()=>K.paymentAsset,getExchanges:()=>K.exchanges,async fetchExchanges(){try{K.isLoading=!0;const e=await j({page:0,asset:G(K.paymentAsset.network,K.paymentAsset.asset),amount:K.amount.toString()});K.exchanges=e.exchanges.slice(0,2)}catch(e){throw h.showError(O.UNABLE_TO_GET_EXCHANGES),new L(D)}finally{K.isLoading=!1}},async getAvailableExchanges(e){var t;try{const a=(null==e?void 0:e.asset)&&(null==e?void 0:e.network)?G(e.network,e.asset):void 0;return await j({page:(null==e?void 0:e.page)??0,asset:a,amount:null==(t=null==e?void 0:e.amount)?void 0:t.toString()})}catch(a){throw new L(D)}},async getPayUrl(e,t,a=!1){try{const n=Number(t.amount),s=await async function(e){return(await W("reown_getExchangePayUrl",e)).result}({exchangeId:e,asset:G(t.network,t.asset),amount:n.toString(),recipient:`${t.network}:${t.recipient}`});return y.sendEvent({type:"track",event:"PAY_EXCHANGE_SELECTED",properties:{source:"pay",exchange:{id:e},configuration:{network:t.network,asset:t.asset,recipient:t.recipient,amount:n},currentPayment:{type:"exchange",exchangeId:e},headless:a}}),a&&(this.initiatePayment(),y.sendEvent({type:"track",event:"PAY_INITIATED",properties:{source:"pay",paymentId:K.paymentId||H,configuration:{network:t.network,asset:t.asset,recipient:t.recipient,amount:n},currentPayment:{type:"exchange",exchangeId:e}}})),s}catch(n){if(n instanceof Error&&n.message.includes("is not supported"))throw new L(_);throw new Error(n.message)}},async openPayUrl(e,t,a=!1){try{const n=await this.getPayUrl(e.exchangeId,t,a);if(!n)throw new L(R);const s=e.openInNewTab??!0?"_blank":"_self";return c.openHref(n.url,s),n}catch(n){throw K.error=n instanceof L?n.message:O.GENERIC_PAYMENT_ERROR,new L(R)}},subscribeEvents(){K.isConfigured||(d.subscribeKey("connections",e=>{e.size>0&&this.handlePayment()}),l.subscribeChainProp("accountState",e=>{const t=d.hasAnyConnection(E.CONNECTOR_ID.WALLET_CONNECT);(null==e?void 0:e.caipAddress)&&(t?setTimeout(()=>{this.handlePayment()},100):this.handlePayment())}))},async handlePayment(){K.currentPayment={type:"wallet",status:"IN_PROGRESS"};const e=l.getActiveCaipAddress();if(!e)return;const{chainId:t,address:a}=o.parseCaipAddress(e),n=l.state.activeChain;if(!a||!t||!n)return;if(!u.getProvider(n))return;const s=l.state.activeCaipNetwork;if(s&&!K.isPaymentInProgress)try{this.initiatePayment();const e=l.getAllRequestedCaipNetworks(),t=l.getAllApprovedCaipNetworkIds();switch(await async function(e){const{paymentAssetNetwork:t,activeCaipNetwork:a,approvedCaipNetworkIds:n,requestedCaipNetworks:s}=e,r=c.sortRequestedNetworks(n,s).find(e=>e.caipNetworkId===t);if(!r)throw new L(b);if(r.caipNetworkId===a.caipNetworkId)return;const i=l.getNetworkProp("supportsAllNetworks",r.chainNamespace);if(!(null==n?void 0:n.includes(r.caipNetworkId))&&!i)throw new L(b);try{await l.switchActiveNetwork(r)}catch(o){throw new L(U,o)}}({paymentAssetNetwork:K.paymentAsset.network,activeCaipNetwork:s,approvedCaipNetworkIds:t,requestedCaipNetworks:e}),await g.open({view:"PayLoading"}),n){case E.CHAIN.EVM:"native"===K.paymentAsset.asset&&(K.currentPayment.result=await async function(e,t,a){var n;if(t!==E.CHAIN.EVM)throw new L(T);if(!a.fromAddress)throw new L(b,"fromAddress is required for native EVM payments.");const s="string"==typeof a.amount?parseFloat(a.amount):a.amount;if(isNaN(s))throw new L(b);const r=(null==(n=e.metadata)?void 0:n.decimals)??18,i=d.parseUnits(s.toString(),r);if("bigint"!=typeof i)throw new L(U);return await d.sendTransaction({chainNamespace:t,to:a.recipient,address:a.fromAddress,value:i,data:"0x"})??void 0}(K.paymentAsset,n,{recipient:K.recipient,amount:K.amount,fromAddress:a})),K.paymentAsset.asset.startsWith("0x")&&(K.currentPayment.result=await async function(e,t){if(!t.fromAddress)throw new L(b,"fromAddress is required for ERC20 EVM payments.");const a=e.asset,n=t.recipient,s=Number(e.metadata.decimals),r=d.parseUnits(t.amount.toString(),s);if(void 0===r)throw new L(U);return await d.writeContract({fromAddress:t.fromAddress,tokenAddress:a,args:[n,r],method:"transfer",abi:m.getERC20Abi(a),chainNamespace:E.CHAIN.EVM})??void 0}(K.paymentAsset,{recipient:K.recipient,amount:K.amount,fromAddress:a})),K.currentPayment.status="SUCCESS";break;case E.CHAIN.SOLANA:K.currentPayment.result=await async function(e,t){if(e!==E.CHAIN.SOLANA)throw new L(T);if(!t.fromAddress)throw new L(b,"fromAddress is required for Solana payments.");const a="string"==typeof t.amount?parseFloat(t.amount):t.amount;if(isNaN(a)||a<=0)throw new L(b,"Invalid payment amount.");try{if(!u.getProvider(e))throw new L(U,"No Solana provider available.");const n=await d.sendTransaction({chainNamespace:E.CHAIN.SOLANA,to:t.recipient,value:a,tokenMint:t.tokenMint});if(!n)throw new L(U,"Transaction failed.");return n}catch(n){if(n instanceof L)throw n;throw new L(U,`Solana payment failed: ${n}`)}}(n,{recipient:K.recipient,amount:K.amount,fromAddress:a,tokenMint:"native"===K.paymentAsset.asset?void 0:K.paymentAsset.asset}),K.currentPayment.status="SUCCESS";break;default:throw new L(T)}}catch(r){K.error=r instanceof L?r.message:O.GENERIC_PAYMENT_ERROR,K.currentPayment.status="FAILED",h.showError(K.error)}finally{K.isPaymentInProgress=!1}},getExchangeById:e=>K.exchanges.find(t=>t.id===e),validatePayConfig(e){const{paymentAsset:t,recipient:a,amount:n}=e;if(!t)throw new L(b);if(!a)throw new L(S);if(!t.asset)throw new L(A);if(null==n||n<=0)throw new L(k)},handlePayWithWallet(){const e=l.getActiveCaipAddress();if(!e)return void w.push("Connect");const{chainId:t,address:a}=o.parseCaipAddress(e),n=l.state.activeChain;a&&t&&n?this.handlePayment():w.push("Connect")},async handlePayWithExchange(e){try{K.currentPayment={type:"exchange",exchangeId:e};const{network:t,asset:a}=K.paymentAsset,n={network:t,asset:a,amount:K.amount,recipient:K.recipient},s=await this.getPayUrl(e,n);if(!s)throw new L(N);return K.currentPayment.sessionId=s.sessionId,K.currentPayment.status="IN_PROGRESS",K.currentPayment.exchangeId=e,this.initiatePayment(),{url:s.url,openInNewTab:K.openInNewTab}}catch(t){return K.error=t instanceof L?t.message:O.GENERIC_PAYMENT_ERROR,K.isPaymentInProgress=!1,h.showError(K.error),null}},async getBuyStatus(e,t){var a,n;try{const s=await async function(e){return(await W("reown_getExchangeBuyStatus",e)).result}({sessionId:t,exchangeId:e});return"SUCCESS"!==s.status&&"FAILED"!==s.status||y.sendEvent({type:"track",event:"SUCCESS"===s.status?"PAY_SUCCESS":"PAY_ERROR",properties:{message:"FAILED"===s.status?c.parseError(K.error):void 0,source:"pay",paymentId:K.paymentId||H,configuration:{network:K.paymentAsset.network,asset:K.paymentAsset.asset,recipient:K.recipient,amount:K.amount},currentPayment:{type:"exchange",exchangeId:null==(a=K.currentPayment)?void 0:a.exchangeId,sessionId:null==(n=K.currentPayment)?void 0:n.sessionId,result:s.txHash}}}),s}catch(s){throw new L($)}},async updateBuyStatus(e,t){try{const a=await this.getBuyStatus(e,t);K.currentPayment&&(K.currentPayment.status=a.status,K.currentPayment.result=a.txHash),"SUCCESS"!==a.status&&"FAILED"!==a.status||(K.isPaymentInProgress=!1)}catch(a){throw new L($)}},initiatePayment(){K.isPaymentInProgress=!0,K.paymentId=crypto.randomUUID()},initializeAnalytics(){K.analyticsSet||(K.analyticsSet=!0,this.subscribeKey("isPaymentInProgress",e=>{var t;if((null==(t=K.currentPayment)?void 0:t.status)&&"UNKNOWN"!==K.currentPayment.status){const e={IN_PROGRESS:"PAY_INITIATED",SUCCESS:"PAY_SUCCESS",FAILED:"PAY_ERROR"}[K.currentPayment.status];y.sendEvent({type:"track",event:e,properties:{message:"FAILED"===K.currentPayment.status?c.parseError(K.error):void 0,source:"pay",paymentId:K.paymentId||H,configuration:{network:K.paymentAsset.network,asset:K.paymentAsset.asset,recipient:K.recipient,amount:K.amount},currentPayment:{type:K.currentPayment.type,exchangeId:K.currentPayment.exchangeId,sessionId:K.currentPayment.sessionId,result:K.currentPayment.result}}})}}))}},q=e`
  wui-separator {
    margin: var(--apkt-spacing-3) calc(var(--apkt-spacing-3) * -1) var(--apkt-spacing-2)
      calc(var(--apkt-spacing-3) * -1);
    width: calc(100% + var(--apkt-spacing-3) * 2);
  }

  .token-display {
    padding: var(--apkt-spacing-3) var(--apkt-spacing-3);
    border-radius: var(--apkt-borderRadius-5);
    background-color: var(--apkt-tokens-theme-backgroundPrimary);
    margin-top: var(--apkt-spacing-3);
    margin-bottom: var(--apkt-spacing-3);
  }

  .token-display wui-text {
    text-transform: none;
  }

  wui-loading-spinner {
    padding: var(--apkt-spacing-2);
  }
`;var V=function(e,t,a,n){var s,r=arguments.length,i=r<3?t:null===n?n=Object.getOwnPropertyDescriptor(t,a):n;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)i=Reflect.decorate(e,t,a,n);else for(var o=e.length-1;o>=0;o--)(s=e[o])&&(i=(r<3?s(i):r>3?s(t,a,i):s(t,a))||i);return r>3&&i&&Object.defineProperty(t,a,i),i};let z=class extends t{constructor(){var e;super(),this.unsubscribe=[],this.amount="",this.tokenSymbol="",this.networkName="",this.exchanges=B.state.exchanges,this.isLoading=B.state.isLoading,this.loadingExchangeId=null,this.connectedWalletInfo=null==(e=l.getAccountData())?void 0:e.connectedWalletInfo,this.initializePaymentDetails(),this.unsubscribe.push(B.subscribeKey("exchanges",e=>this.exchanges=e)),this.unsubscribe.push(B.subscribeKey("isLoading",e=>this.isLoading=e)),this.unsubscribe.push(l.subscribeChainProp("accountState",e=>{this.connectedWalletInfo=null==e?void 0:e.connectedWalletInfo})),B.fetchExchanges()}get isWalletConnected(){const e=l.getAccountData();return"connected"===(null==e?void 0:e.status)}render(){return a`
      <wui-flex flexDirection="column">
        <wui-flex flexDirection="column" .padding=${["0","4","4","4"]} gap="3">
          ${this.renderPaymentHeader()}

          <wui-flex flexDirection="column" gap="3">
            ${this.renderPayWithWallet()} ${this.renderExchangeOptions()}
          </wui-flex>
        </wui-flex>
      </wui-flex>
    `}initializePaymentDetails(){const e=B.getPaymentAsset();this.networkName=e.network,this.tokenSymbol=e.metadata.symbol,this.amount=B.state.amount.toString()}renderPayWithWallet(){return function(e){const{chainNamespace:t}=o.parseCaipNetworkId(e);return F.includes(t)}(this.networkName)?a`<wui-flex flexDirection="column" gap="3">
        ${this.isWalletConnected?this.renderConnectedView():this.renderDisconnectedView()}
      </wui-flex>
      <wui-separator text="or"></wui-separator>`:a``}renderPaymentHeader(){let e=this.networkName;if(this.networkName){const t=l.getAllRequestedCaipNetworks().find(e=>e.caipNetworkId===this.networkName);t&&(e=t.name)}return a`
      <wui-flex flexDirection="column" alignItems="center">
        <wui-flex alignItems="center" gap="2">
          <wui-text variant="h1-regular" color="primary">${this.amount||"0.0000"}</wui-text>
          <wui-flex class="token-display" alignItems="center" gap="1">
            <wui-text variant="md-medium" color="primary">
              ${this.tokenSymbol||"Unknown Asset"}
            </wui-text>
            ${e?a`
                  <wui-text variant="sm-medium" color="secondary">
                    on ${e}
                  </wui-text>
                `:""}
          </wui-flex>
        </wui-flex>
      </wui-flex>
    `}renderConnectedView(){var e,t;const s=(null==(e=this.connectedWalletInfo)?void 0:e.name)||"connected wallet";return a`
      <wui-list-item
        @click=${this.onWalletPayment}
        ?chevron=${!0}
        ?fullSize=${!0}
        ?rounded=${!0}
        data-testid="wallet-payment-option"
        imageSrc=${n(null==(t=this.connectedWalletInfo)?void 0:t.icon)}
      >
        <wui-text variant="lg-regular" color="primary">Pay with ${s}</wui-text>
      </wui-list-item>

      <wui-list-item
        icon="power"
        ?rounded=${!0}
        iconColor="error"
        @click=${this.onDisconnect}
        data-testid="disconnect-button"
        ?chevron=${!1}
      >
        <wui-text variant="lg-regular" color="secondary">Disconnect</wui-text>
      </wui-list-item>
    `}renderDisconnectedView(){return a`<wui-list-item
      variant="icon"
      iconVariant="overlay"
      icon="wallet"
      ?rounded=${!0}
      @click=${this.onWalletPayment}
      ?chevron=${!0}
      data-testid="wallet-payment-option"
    >
      <wui-text variant="lg-regular" color="primary">Pay from wallet</wui-text>
    </wui-list-item>`}renderExchangeOptions(){return this.isLoading?a`<wui-flex justifyContent="center" alignItems="center">
        <wui-spinner size="md"></wui-spinner>
      </wui-flex>`:0===this.exchanges.length?a`<wui-flex justifyContent="center" alignItems="center">
        <wui-text variant="md-medium" color="primary">No exchanges available</wui-text>
      </wui-flex>`:this.exchanges.map(e=>a`
        <wui-list-item
          @click=${()=>this.onExchangePayment(e.id)}
          data-testid="exchange-option-${e.id}"
          ?chevron=${!0}
          ?disabled=${null!==this.loadingExchangeId}
          ?loading=${this.loadingExchangeId===e.id}
          imageSrc=${n(e.imageUrl)}
        >
          <wui-flex alignItems="center" gap="3">
            <wui-text flexGrow="1" variant="md-medium" color="primary"
              >Pay with ${e.name} <wui-spinner size="sm" color="secondary"></wui-spinner
            ></wui-text>
          </wui-flex>
        </wui-list-item>
      `)}onWalletPayment(){B.handlePayWithWallet()}async onExchangePayment(e){try{this.loadingExchangeId=e;const t=await B.handlePayWithExchange(e);t&&(await g.open({view:"PayLoading"}),c.openHref(t.url,t.openInNewTab?"_blank":"_self"))}catch(t){console.error("Failed to pay with exchange",t),h.showError("Failed to pay with exchange")}finally{this.loadingExchangeId=null}}async onDisconnect(e){e.stopPropagation();try{await d.disconnect()}catch{console.error("Failed to disconnect"),h.showError("Failed to disconnect")}}disconnectedCallback(){this.unsubscribe.forEach(e=>e())}};z.styles=q,V([s()],z.prototype,"amount",void 0),V([s()],z.prototype,"tokenSymbol",void 0),V([s()],z.prototype,"networkName",void 0),V([s()],z.prototype,"exchanges",void 0),V([s()],z.prototype,"isLoading",void 0),V([s()],z.prototype,"loadingExchangeId",void 0),V([s()],z.prototype,"connectedWalletInfo",void 0),z=V([r("w3m-pay-view")],z);const J=e`
  :host {
    display: block;
    height: 100%;
    width: 100%;
  }

  wui-flex:first-child:not(:only-child) {
    position: relative;
  }

  wui-loading-thumbnail {
    position: absolute;
  }
`;var Z=function(e,t,a,n){var s,r=arguments.length,i=r<3?t:null===n?n=Object.getOwnPropertyDescriptor(t,a):n;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)i=Reflect.decorate(e,t,a,n);else for(var o=e.length-1;o>=0;o--)(s=e[o])&&(i=(r<3?s(i):r>3?s(t,a,i):s(t,a))||i);return r>3&&i&&Object.defineProperty(t,a,i),i};let X=class extends t{constructor(){super(),this.loadingMessage="",this.subMessage="",this.paymentState="in-progress",this.paymentState=B.state.isPaymentInProgress?"in-progress":"completed",this.updateMessages(),this.setupSubscription(),this.setupExchangeSubscription()}disconnectedCallback(){clearInterval(this.exchangeSubscription)}render(){return a`
      <wui-flex
        flexDirection="column"
        alignItems="center"
        .padding=${["7","5","5","5"]}
        gap="9"
      >
        <wui-flex justifyContent="center" alignItems="center"> ${this.getStateIcon()} </wui-flex>
        <wui-flex flexDirection="column" alignItems="center" gap="2">
          <wui-text align="center" variant="lg-medium" color="primary">
            ${this.loadingMessage}
          </wui-text>
          <wui-text align="center" variant="lg-regular" color="secondary">
            ${this.subMessage}
          </wui-text>
        </wui-flex>
      </wui-flex>
    `}updateMessages(){var e;switch(this.paymentState){case"completed":this.loadingMessage="Payment completed",this.subMessage="Your transaction has been successfully processed";break;case"error":this.loadingMessage="Payment failed",this.subMessage="There was an error processing your transaction";break;default:"exchange"===(null==(e=B.state.currentPayment)?void 0:e.type)?(this.loadingMessage="Payment initiated",this.subMessage="Please complete the payment on the exchange"):(this.loadingMessage="Awaiting payment confirmation",this.subMessage="Please confirm the payment transaction in your wallet")}}getStateIcon(){switch(this.paymentState){case"completed":return this.successTemplate();case"error":return this.errorTemplate();default:return this.loaderTemplate()}}setupExchangeSubscription(){var e;"exchange"===(null==(e=B.state.currentPayment)?void 0:e.type)&&(this.exchangeSubscription=setInterval(async()=>{var e,t,a;const n=null==(e=B.state.currentPayment)?void 0:e.exchangeId,s=null==(t=B.state.currentPayment)?void 0:t.sessionId;n&&s&&(await B.updateBuyStatus(n,s),"SUCCESS"===(null==(a=B.state.currentPayment)?void 0:a.status)&&clearInterval(this.exchangeSubscription))},4e3))}setupSubscription(){B.subscribeKey("isPaymentInProgress",e=>{var t;e||"in-progress"!==this.paymentState||(B.state.error||!(null==(t=B.state.currentPayment)?void 0:t.result)?this.paymentState="error":this.paymentState="completed",this.updateMessages(),setTimeout(()=>{"disconnected"!==d.state.status&&g.close()},3e3))}),B.subscribeKey("error",e=>{e&&"in-progress"===this.paymentState&&(this.paymentState="error",this.updateMessages())})}loaderTemplate(){const e=x.state.themeVariables["--w3m-border-radius-master"],t=e?parseInt(e.replace("px",""),10):4,n=this.getPaymentIcon();return a`
      <wui-flex justifyContent="center" alignItems="center" style="position: relative;">
        ${n?a`<wui-wallet-image size="lg" imageSrc=${n}></wui-wallet-image>`:null}
        <wui-loading-thumbnail radius=${9*t}></wui-loading-thumbnail>
      </wui-flex>
    `}getPaymentIcon(){var e,t;const a=B.state.currentPayment;if(a){if("exchange"===a.type){const e=a.exchangeId;if(e){const t=B.getExchangeById(e);return null==t?void 0:t.imageUrl}}if("wallet"===a.type){const a=null==(t=null==(e=l.getAccountData())?void 0:e.connectedWalletInfo)?void 0:t.icon;if(a)return a;const n=l.state.activeChain;if(!n)return;const s=P.getConnectorId(n);if(!s)return;const r=P.getConnectorById(s);if(!r)return;return I.getConnectorImage(r)}}}successTemplate(){return a`<wui-icon size="xl" color="success" name="checkmark"></wui-icon>`}errorTemplate(){return a`<wui-icon size="xl" color="error" name="close"></wui-icon>`}};X.styles=J,Z([s()],X.prototype,"loadingMessage",void 0),Z([s()],X.prototype,"subMessage",void 0),Z([s()],X.prototype,"paymentState",void 0),X=Z([r("w3m-pay-loading-view")],X);async function Q(e){return B.handleOpenPay(e)}async function ee(e,t=3e5){if(t<=0)throw new L(b,"Timeout must be greater than 0");try{await Q(e)}catch(a){if(a instanceof L)throw a;throw new L(N,a.message)}return new Promise((e,a)=>{let n=!1;const s=setTimeout(()=>{n||(n=!0,l(),a(new L(U,"Payment timeout")))},t);function r(){if(n)return;const t=B.state.currentPayment,a=B.state.error,r=B.state.isPaymentInProgress;return"SUCCESS"===(null==t?void 0:t.status)?(n=!0,l(),clearTimeout(s),void e({success:!0,result:t.result})):"FAILED"===(null==t?void 0:t.status)?(n=!0,l(),clearTimeout(s),void e({success:!1,error:a||"Payment failed"})):void(!a||r||t||(n=!0,l(),clearTimeout(s),e({success:!1,error:a})))}const i=re("currentPayment",r),o=re("error",r),c=re("isPaymentInProgress",r),l=(u=[i,o,c],()=>{u.forEach(e=>{try{e()}catch{}})});var u;r()})}function te(){return B.getExchanges()}function ae(){var e;return null==(e=B.state.currentPayment)?void 0:e.result}function ne(){return B.state.error}function se(){return B.state.isPaymentInProgress}function re(e,t){return B.subscribeKey(e,t)}const ie={network:"eip155:8453",asset:"native",metadata:{name:"Ethereum",symbol:"ETH",decimals:18}},oe={network:"eip155:8453",asset:"0x833589fcd6edb6e08f4c7c32d4f71b54bda02913",metadata:{name:"USD Coin",symbol:"USDC",decimals:6}},ce={network:"eip155:84532",asset:"native",metadata:{name:"Ethereum",symbol:"ETH",decimals:18}},le={network:"eip155:1",asset:"0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",metadata:{name:"USD Coin",symbol:"USDC",decimals:6}},ue={network:"eip155:10",asset:"0x0b2c639c533813f4aa9d7837caf62653d097ff85",metadata:{name:"USD Coin",symbol:"USDC",decimals:6}},de={network:"eip155:42161",asset:"0xaf88d065e77c8cC2239327C5EDb3A432268e5831",metadata:{name:"USD Coin",symbol:"USDC",decimals:6}},me={network:"eip155:137",asset:"0x3c499c542cef5e3811e1192ce70d8cc03d5c3359",metadata:{name:"USD Coin",symbol:"USDC",decimals:6}},pe={network:"solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp",asset:"EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",metadata:{name:"USD Coin",symbol:"USDC",decimals:6}},ye={network:"eip155:1",asset:"0xdAC17F958D2ee523a2206206994597C13D831ec7",metadata:{name:"Tether USD",symbol:"USDT",decimals:6}},he={network:"eip155:10",asset:"0x94b008aA00579c1307B0EF2c499aD98a8ce58e58",metadata:{name:"Tether USD",symbol:"USDT",decimals:6}},we={network:"eip155:42161",asset:"0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9",metadata:{name:"Tether USD",symbol:"USDT",decimals:6}},ge={network:"eip155:137",asset:"0xc2132d05d31c914a87c6611c10748aeb04b58e8f",metadata:{name:"Tether USD",symbol:"USDT",decimals:6}},fe={network:"solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp",asset:"Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",metadata:{name:"Tether USD",symbol:"USDT",decimals:6}},ve={network:"solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp",asset:"native",metadata:{name:"Solana",symbol:"SOL",decimals:9}};export{X as W3mPayLoadingView,z as W3mPayView,de as arbitrumUSDC,we as arbitrumUSDT,ie as baseETH,ce as baseSepoliaETH,oe as baseUSDC,le as ethereumUSDC,ye as ethereumUSDT,te as getExchanges,se as getIsPaymentInProgress,ne as getPayError,ae as getPayResult,Q as openPay,ue as optimismUSDC,he as optimismUSDT,ee as pay,me as polygonUSDC,ge as polygonUSDT,ve as solanaSOL,pe as solanaUSDC,fe as solanaUSDT};
