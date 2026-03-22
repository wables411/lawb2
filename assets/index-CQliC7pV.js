import{P as e,Q as t,T as i,U as n,V as s,X as a,a4 as r,Y as o,x as c,aj as u,C as l,aL as d,ai as p,D as h,aM as m,af as g,ab as w,t as y,aN as f,z as b,a2 as x,E as v,S as A,H as I,aq as E,L as k,M as N,O as P,K as T,R as S,a5 as C,_ as $,a0 as _,aI as R,a1 as O,aC as U}from"./index-OpbypVz_.js";const L=e`
  :host {
    position: relative;
  }

  button {
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: transparent;
    padding: ${({spacing:e})=>e[1]};
  }

  /* -- Colors --------------------------------------------------- */
  button[data-type='accent'] wui-icon {
    color: ${({tokens:e})=>e.core.iconAccentPrimary};
  }

  button[data-type='neutral'][data-variant='primary'] wui-icon {
    color: ${({tokens:e})=>e.theme.iconInverse};
  }

  button[data-type='neutral'][data-variant='secondary'] wui-icon {
    color: ${({tokens:e})=>e.theme.iconDefault};
  }

  button[data-type='success'] wui-icon {
    color: ${({tokens:e})=>e.core.iconSuccess};
  }

  button[data-type='error'] wui-icon {
    color: ${({tokens:e})=>e.core.iconError};
  }

  /* -- Sizes --------------------------------------------------- */
  button[data-size='xs'] {
    width: 16px;
    height: 16px;

    border-radius: ${({borderRadius:e})=>e[1]};
  }

  button[data-size='sm'] {
    width: 20px;
    height: 20px;
    border-radius: ${({borderRadius:e})=>e[1]};
  }

  button[data-size='md'] {
    width: 24px;
    height: 24px;
    border-radius: ${({borderRadius:e})=>e[2]};
  }

  button[data-size='lg'] {
    width: 28px;
    height: 28px;
    border-radius: ${({borderRadius:e})=>e[2]};
  }

  button[data-size='xs'] wui-icon {
    width: 8px;
    height: 8px;
  }

  button[data-size='sm'] wui-icon {
    width: 12px;
    height: 12px;
  }

  button[data-size='md'] wui-icon {
    width: 16px;
    height: 16px;
  }

  button[data-size='lg'] wui-icon {
    width: 20px;
    height: 20px;
  }

  /* -- Hover --------------------------------------------------- */
  @media (hover: hover) {
    button[data-type='accent']:hover:enabled {
      background-color: ${({tokens:e})=>e.core.foregroundAccent010};
    }

    button[data-variant='primary'][data-type='neutral']:hover:enabled {
      background-color: ${({tokens:e})=>e.theme.foregroundSecondary};
    }

    button[data-variant='secondary'][data-type='neutral']:hover:enabled {
      background-color: ${({tokens:e})=>e.theme.foregroundSecondary};
    }

    button[data-type='success']:hover:enabled {
      background-color: ${({tokens:e})=>e.core.backgroundSuccess};
    }

    button[data-type='error']:hover:enabled {
      background-color: ${({tokens:e})=>e.core.backgroundError};
    }
  }

  /* -- Focus --------------------------------------------------- */
  button:focus-visible {
    box-shadow: 0 0 0 4px ${({tokens:e})=>e.core.foregroundAccent020};
  }

  /* -- Properties --------------------------------------------------- */
  button[data-full-width='true'] {
    width: 100%;
  }

  :host([fullWidth]) {
    width: 100%;
  }

  button[disabled] {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;var q=function(e,t,i,n){var s,a=arguments.length,r=a<3?t:null===n?n=Object.getOwnPropertyDescriptor(t,i):n;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)r=Reflect.decorate(e,t,i,n);else for(var o=e.length-1;o>=0;o--)(s=e[o])&&(r=(a<3?s(r):a>3?s(t,i,r):s(t,i))||r);return a>3&&r&&Object.defineProperty(t,i,r),r};let D=class extends a{constructor(){super(...arguments),this.icon="card",this.variant="primary",this.type="accent",this.size="md",this.iconSize=void 0,this.fullWidth=!1,this.disabled=!1}render(){return o`<button
      data-variant=${this.variant}
      data-type=${this.type}
      data-size=${this.size}
      data-full-width=${this.fullWidth}
      ?disabled=${this.disabled}
    >
      <wui-icon color="inherit" name=${this.icon} size=${r(this.iconSize)}></wui-icon>
    </button>`}};D.styles=[t,i,L],q([n()],D.prototype,"icon",void 0),q([n()],D.prototype,"variant",void 0),q([n()],D.prototype,"type",void 0),q([n()],D.prototype,"size",void 0),q([n()],D.prototype,"iconSize",void 0),q([n({type:Boolean})],D.prototype,"fullWidth",void 0),q([n({type:Boolean})],D.prototype,"disabled",void 0),D=q([s("wui-icon-button")],D);const j={INVALID_PAYMENT_CONFIG:"INVALID_PAYMENT_CONFIG",INVALID_RECIPIENT:"INVALID_RECIPIENT",INVALID_ASSET:"INVALID_ASSET",INVALID_AMOUNT:"INVALID_AMOUNT",UNKNOWN_ERROR:"UNKNOWN_ERROR",UNABLE_TO_INITIATE_PAYMENT:"UNABLE_TO_INITIATE_PAYMENT",INVALID_CHAIN_NAMESPACE:"INVALID_CHAIN_NAMESPACE",GENERIC_PAYMENT_ERROR:"GENERIC_PAYMENT_ERROR",UNABLE_TO_GET_EXCHANGES:"UNABLE_TO_GET_EXCHANGES",ASSET_NOT_SUPPORTED:"ASSET_NOT_SUPPORTED",UNABLE_TO_GET_PAY_URL:"UNABLE_TO_GET_PAY_URL",UNABLE_TO_GET_BUY_STATUS:"UNABLE_TO_GET_BUY_STATUS",UNABLE_TO_GET_TOKEN_BALANCES:"UNABLE_TO_GET_TOKEN_BALANCES",UNABLE_TO_GET_QUOTE:"UNABLE_TO_GET_QUOTE",UNABLE_TO_GET_QUOTE_STATUS:"UNABLE_TO_GET_QUOTE_STATUS",INVALID_RECIPIENT_ADDRESS_FOR_ASSET:"INVALID_RECIPIENT_ADDRESS_FOR_ASSET"},B={[j.INVALID_PAYMENT_CONFIG]:"Invalid payment configuration",[j.INVALID_RECIPIENT]:"Invalid recipient address",[j.INVALID_ASSET]:"Invalid asset specified",[j.INVALID_AMOUNT]:"Invalid payment amount",[j.INVALID_RECIPIENT_ADDRESS_FOR_ASSET]:"Invalid recipient address for the asset selected",[j.UNKNOWN_ERROR]:"Unknown payment error occurred",[j.UNABLE_TO_INITIATE_PAYMENT]:"Unable to initiate payment",[j.INVALID_CHAIN_NAMESPACE]:"Invalid chain namespace",[j.GENERIC_PAYMENT_ERROR]:"Unable to process payment",[j.UNABLE_TO_GET_EXCHANGES]:"Unable to get exchanges",[j.ASSET_NOT_SUPPORTED]:"Asset not supported by the selected exchange",[j.UNABLE_TO_GET_PAY_URL]:"Unable to get payment URL",[j.UNABLE_TO_GET_BUY_STATUS]:"Unable to get buy status",[j.UNABLE_TO_GET_TOKEN_BALANCES]:"Unable to get token balances",[j.UNABLE_TO_GET_QUOTE]:"Unable to get quote. Please choose a different token",[j.UNABLE_TO_GET_QUOTE_STATUS]:"Unable to get quote status"};class F extends Error{get message(){return B[this.code]}constructor(e,t){super(B[e]),this.name="AppKitPayError",this.code=e,this.details=t,Error.captureStackTrace&&Error.captureStackTrace(this,F)}}const z="reown_test";function M(e){if(!e)return null;const t=e.steps[0];return t&&t.type===ae?t:null}function G(e,t=0){if(!e)return[];const i=e.steps.filter(e=>e.type===re),n=i.filter((e,i)=>i+1>t);return i.length>0&&i.length<3?n:[]}const Q=new m({baseUrl:h.getApiUrl(),clientId:null});class W extends Error{}function Y(){const{projectId:e,sdkType:t,sdkVersion:i}=w.state;return{projectId:e,st:t||"appkit",sv:i||"html-wagmi-4.2.2"}}async function V(e,t){const i=`https://rpc.walletconnect.org/v1/json-rpc?projectId=${w.getSnapshot().projectId}`,{sdkType:n,sdkVersion:s,projectId:a}=w.getSnapshot(),r={jsonrpc:"2.0",id:1,method:e,params:{...t||{},st:n,sv:s,projectId:a}},o=await fetch(i,{method:"POST",body:JSON.stringify(r),headers:{"Content-Type":"application/json"}}),c=await o.json();if(c.error)throw new W(c.error.message);return c}async function K(e){return(await V("reown_getExchanges",e)).result}async function H(e){return(await V("reown_getExchangePayUrl",e)).result}async function X(e){const t=g.isLowerCaseMatch(e.sourceToken.network,e.toToken.network),i=g.isLowerCaseMatch(e.sourceToken.asset,e.toToken.asset);return t&&i?async function({sourceToken:e,toToken:t,amount:i,recipient:n}){const s=l.parseUnits(i,e.metadata.decimals),a=l.parseUnits(i,t.metadata.decimals);return Promise.resolve({type:se,origin:{amount:(null==s?void 0:s.toString())??"0",currency:e},destination:{amount:(null==a?void 0:a.toString())??"0",currency:t},fees:[{id:"service",label:"Service Fee",amount:"0",currency:t}],steps:[{requestId:se,type:"deposit",deposit:{amount:(null==s?void 0:s.toString())??"0",currency:e.asset,receiver:n}}],timeInSeconds:6})}(e):async function(e){const t=y.bigNumber(e.amount).times(10**e.toToken.metadata.decimals).toString(),{chainId:i,chainNamespace:n}=p.parseCaipNetworkId(e.sourceToken.network),{chainId:s,chainNamespace:a}=p.parseCaipNetworkId(e.toToken.network),r="native"===e.sourceToken.asset?f(n):e.sourceToken.asset,o="native"===e.toToken.asset?f(a):e.toToken.asset;return await Q.post({path:"/appkit/v1/transfers/quote",body:{user:e.address,originChainId:i.toString(),originCurrency:r,destinationChainId:s.toString(),destinationCurrency:o,recipient:e.recipient,amount:t},params:Y()})}(e)}const J=["eip155","solana"],Z={eip155:{native:{assetNamespace:"slip44",assetReference:"60"},defaultTokenNamespace:"erc20"},solana:{native:{assetNamespace:"slip44",assetReference:"501"},defaultTokenNamespace:"token"}},ee={56:"714",204:"714"};function te(e,t){const{chainNamespace:i,chainId:n}=p.parseCaipNetworkId(e),s=Z[i];if(!s)throw new Error(`Unsupported chain namespace for CAIP-19 formatting: ${i}`);let a=s.native.assetNamespace,r=s.native.assetReference;"native"!==t?(a=s.defaultTokenNamespace,r=t):"eip155"===i&&ee[n]&&(r=ee[n]);return`${`${i}:${n}`}/${a}:${r}`}function ie(e){const t=y.bigNumber(e,{safe:!0});return t.lt(.001)?"<0.001":t.round(4).toString()}const ne="unknown",se="direct-transfer",ae="deposit",re="transaction",oe=P({paymentAsset:{network:"eip155:1",asset:"0x0",metadata:{name:"0x0",symbol:"0x0",decimals:0}},recipient:"0x0",amount:0,isConfigured:!1,error:null,isPaymentInProgress:!1,exchanges:[],isLoading:!1,openInNewTab:!0,redirectUrl:void 0,payWithExchange:void 0,currentPayment:void 0,analyticsSet:!1,paymentId:void 0,choice:"pay",tokenBalances:{[c.CHAIN.EVM]:[],[c.CHAIN.SOLANA]:[]},isFetchingTokenBalances:!1,selectedPaymentAsset:null,quote:void 0,quoteStatus:"waiting",quoteError:null,isFetchingQuote:!1,selectedExchange:void 0,exchangeUrlForQuote:void 0,requestId:void 0}),ce={state:oe,subscribe:e=>N(oe,()=>e(oe)),subscribeKey:(e,t)=>k(oe,e,t),async handleOpenPay(e){this.resetState(),this.setPaymentConfig(e),this.initializeAnalytics(),function(){const{chainNamespace:e}=p.parseCaipNetworkId(ce.state.paymentAsset.network);if(!h.isAddress(ce.state.recipient,e))throw new F(j.INVALID_RECIPIENT_ADDRESS_FOR_ASSET,`Provide valid recipient address for namespace "${e}"`)}(),await this.prepareTokenLogo(),oe.isConfigured=!0,v.sendEvent({type:"track",event:"PAY_MODAL_OPEN",properties:{exchanges:oe.exchanges,configuration:{network:oe.paymentAsset.network,asset:oe.paymentAsset.asset,recipient:oe.recipient,amount:oe.amount}}}),await E.open({view:"Pay"})},resetState(){oe.paymentAsset={network:"eip155:1",asset:"0x0",metadata:{name:"0x0",symbol:"0x0",decimals:0}},oe.recipient="0x0",oe.amount=0,oe.isConfigured=!1,oe.error=null,oe.isPaymentInProgress=!1,oe.isLoading=!1,oe.currentPayment=void 0,oe.selectedExchange=void 0,oe.exchangeUrlForQuote=void 0,oe.requestId=void 0},resetQuoteState(){oe.quote=void 0,oe.quoteStatus="waiting",oe.quoteError=null,oe.isFetchingQuote=!1,oe.requestId=void 0},setPaymentConfig(e){if(!e.paymentAsset)throw new F(j.INVALID_PAYMENT_CONFIG);try{oe.choice=e.choice??"pay",oe.paymentAsset=e.paymentAsset,oe.recipient=e.recipient,oe.amount=e.amount,oe.openInNewTab=e.openInNewTab??!0,oe.redirectUrl=e.redirectUrl,oe.payWithExchange=e.payWithExchange,oe.error=null}catch(t){throw new F(j.INVALID_PAYMENT_CONFIG,t.message)}},setSelectedPaymentAsset(e){oe.selectedPaymentAsset=e},setSelectedExchange(e){oe.selectedExchange=e},setRequestId(e){oe.requestId=e},setPaymentInProgress(e){oe.isPaymentInProgress=e},getPaymentAsset:()=>oe.paymentAsset,getExchanges:()=>oe.exchanges,async fetchExchanges(){try{oe.isLoading=!0;const e=await K({page:0});oe.exchanges=e.exchanges.slice(0,2)}catch(e){throw A.showError(B.UNABLE_TO_GET_EXCHANGES),new F(j.UNABLE_TO_GET_EXCHANGES)}finally{oe.isLoading=!1}},async getAvailableExchanges(e){var t;try{const i=(null==e?void 0:e.asset)&&(null==e?void 0:e.network)?te(e.network,e.asset):void 0;return await K({page:(null==e?void 0:e.page)??0,asset:i,amount:null==(t=null==e?void 0:e.amount)?void 0:t.toString()})}catch(i){throw new F(j.UNABLE_TO_GET_EXCHANGES)}},async getPayUrl(e,t,i=!1){try{const n=Number(t.amount),s=await H({exchangeId:e,asset:te(t.network,t.asset),amount:n.toString(),recipient:`${t.network}:${t.recipient}`});return v.sendEvent({type:"track",event:"PAY_EXCHANGE_SELECTED",properties:{source:"pay",exchange:{id:e},configuration:{network:t.network,asset:t.asset,recipient:t.recipient,amount:n},currentPayment:{type:"exchange",exchangeId:e},headless:i}}),i&&(this.initiatePayment(),v.sendEvent({type:"track",event:"PAY_INITIATED",properties:{source:"pay",paymentId:oe.paymentId||ne,configuration:{network:t.network,asset:t.asset,recipient:t.recipient,amount:n},currentPayment:{type:"exchange",exchangeId:e}}})),s}catch(n){if(n instanceof Error&&n.message.includes("is not supported"))throw new F(j.ASSET_NOT_SUPPORTED);throw new Error(n.message)}},async generateExchangeUrlForQuote({exchangeId:e,paymentAsset:t,amount:i,recipient:n}){const s=await H({exchangeId:e,asset:te(t.network,t.asset),amount:i.toString(),recipient:n});oe.exchangeSessionId=s.sessionId,oe.exchangeUrlForQuote=s.url},async openPayUrl(e,t,i=!1){try{const n=await this.getPayUrl(e.exchangeId,t,i);if(!n)throw new F(j.UNABLE_TO_GET_PAY_URL);const s=e.openInNewTab??!0?"_blank":"_self";return h.openHref(n.url,s),n}catch(n){throw oe.error=n instanceof F?n.message:B.GENERIC_PAYMENT_ERROR,new F(j.UNABLE_TO_GET_PAY_URL)}},async onTransfer({chainNamespace:e,fromAddress:t,toAddress:i,amount:n,paymentAsset:s}){if(oe.currentPayment={type:"wallet",status:"IN_PROGRESS"},!oe.isPaymentInProgress)try{this.initiatePayment();const a=b.getAllRequestedCaipNetworks().find(e=>e.caipNetworkId===s.network);if(!a)throw new Error("Target network not found");const r=b.state.activeCaipNetwork;switch(g.isLowerCaseMatch(null==r?void 0:r.caipNetworkId,a.caipNetworkId)||await b.switchActiveNetwork(a),e){case c.CHAIN.EVM:"native"===s.asset&&(oe.currentPayment.result=await async function(e,t,i){var n;if(t!==c.CHAIN.EVM)throw new F(j.INVALID_CHAIN_NAMESPACE);if(!i.fromAddress)throw new F(j.INVALID_PAYMENT_CONFIG,"fromAddress is required for native EVM payments.");const s="string"==typeof i.amount?parseFloat(i.amount):i.amount;if(isNaN(s))throw new F(j.INVALID_PAYMENT_CONFIG);const a=(null==(n=e.metadata)?void 0:n.decimals)??18,r=l.parseUnits(s.toString(),a);if("bigint"!=typeof r)throw new F(j.GENERIC_PAYMENT_ERROR);return await l.sendTransaction({chainNamespace:t,to:i.recipient,address:i.fromAddress,value:r,data:"0x"})??void 0}(s,e,{recipient:i,amount:n,fromAddress:t})),s.asset.startsWith("0x")&&(oe.currentPayment.result=await async function(e,t){if(!t.fromAddress)throw new F(j.INVALID_PAYMENT_CONFIG,"fromAddress is required for ERC20 EVM payments.");const i=e.asset,n=t.recipient,s=Number(e.metadata.decimals),a=l.parseUnits(t.amount.toString(),s);if(void 0===a)throw new F(j.GENERIC_PAYMENT_ERROR);return await l.writeContract({fromAddress:t.fromAddress,tokenAddress:i,args:[n,a],method:"transfer",abi:d.getERC20Abi(i),chainNamespace:c.CHAIN.EVM})??void 0}(s,{recipient:i,amount:n,fromAddress:t})),oe.currentPayment.status="SUCCESS";break;case c.CHAIN.SOLANA:oe.currentPayment.result=await async function(e,t){if(e!==c.CHAIN.SOLANA)throw new F(j.INVALID_CHAIN_NAMESPACE);if(!t.fromAddress)throw new F(j.INVALID_PAYMENT_CONFIG,"fromAddress is required for Solana payments.");const i="string"==typeof t.amount?parseFloat(t.amount):t.amount;if(isNaN(i)||i<=0)throw new F(j.INVALID_PAYMENT_CONFIG,"Invalid payment amount.");try{if(!u.getProvider(e))throw new F(j.GENERIC_PAYMENT_ERROR,"No Solana provider available.");const n=await l.sendTransaction({chainNamespace:c.CHAIN.SOLANA,to:t.recipient,value:i,tokenMint:t.tokenMint});if(!n)throw new F(j.GENERIC_PAYMENT_ERROR,"Transaction failed.");return n}catch(n){if(n instanceof F)throw n;throw new F(j.GENERIC_PAYMENT_ERROR,`Solana payment failed: ${n}`)}}(e,{recipient:i,amount:n,fromAddress:t,tokenMint:"native"===s.asset?void 0:s.asset}),oe.currentPayment.status="SUCCESS";break;default:throw new F(j.INVALID_CHAIN_NAMESPACE)}}catch(a){throw oe.error=a instanceof F?a.message:B.GENERIC_PAYMENT_ERROR,oe.currentPayment.status="FAILED",A.showError(oe.error),a}finally{oe.isPaymentInProgress=!1}},async onSendTransaction(e){try{const{namespace:t,transactionStep:i}=e;ce.initiatePayment();const n=b.getAllRequestedCaipNetworks().find(e=>{var t;return e.caipNetworkId===(null==(t=oe.paymentAsset)?void 0:t.network)});if(!n)throw new Error("Target network not found");const s=b.state.activeCaipNetwork;if(g.isLowerCaseMatch(null==s?void 0:s.caipNetworkId,n.caipNetworkId)||await b.switchActiveNetwork(n),t===c.CHAIN.EVM){const{from:e,to:n,data:s,value:a}=i.transaction;await l.sendTransaction({address:e,to:n,data:s,value:BigInt(a),chainNamespace:t})}else if(t===c.CHAIN.SOLANA){const{instructions:e}=i.transaction;await l.writeSolanaTransaction({instructions:e})}}catch(t){throw oe.error=t instanceof F?t.message:B.GENERIC_PAYMENT_ERROR,A.showError(oe.error),t}finally{oe.isPaymentInProgress=!1}},getExchangeById:e=>oe.exchanges.find(t=>t.id===e),validatePayConfig(e){const{paymentAsset:t,recipient:i,amount:n}=e;if(!t)throw new F(j.INVALID_PAYMENT_CONFIG);if(!i)throw new F(j.INVALID_RECIPIENT);if(!t.asset)throw new F(j.INVALID_ASSET);if(null==n||n<=0)throw new F(j.INVALID_AMOUNT)},async handlePayWithExchange(e){try{oe.currentPayment={type:"exchange",exchangeId:e};const{network:t,asset:i}=oe.paymentAsset,n={network:t,asset:i,amount:oe.amount,recipient:oe.recipient},s=await this.getPayUrl(e,n);if(!s)throw new F(j.UNABLE_TO_INITIATE_PAYMENT);return oe.currentPayment.sessionId=s.sessionId,oe.currentPayment.status="IN_PROGRESS",oe.currentPayment.exchangeId=e,this.initiatePayment(),{url:s.url,openInNewTab:oe.openInNewTab}}catch(t){return oe.error=t instanceof F?t.message:B.GENERIC_PAYMENT_ERROR,oe.isPaymentInProgress=!1,A.showError(oe.error),null}},async getBuyStatus(e,t){var i,n;try{const s=await async function(e){return(await V("reown_getExchangeBuyStatus",e)).result}({sessionId:t,exchangeId:e});return"SUCCESS"!==s.status&&"FAILED"!==s.status||v.sendEvent({type:"track",event:"SUCCESS"===s.status?"PAY_SUCCESS":"PAY_ERROR",properties:{message:"FAILED"===s.status?h.parseError(oe.error):void 0,source:"pay",paymentId:oe.paymentId||ne,configuration:{network:oe.paymentAsset.network,asset:oe.paymentAsset.asset,recipient:oe.recipient,amount:oe.amount},currentPayment:{type:"exchange",exchangeId:null==(i=oe.currentPayment)?void 0:i.exchangeId,sessionId:null==(n=oe.currentPayment)?void 0:n.sessionId,result:s.txHash}}}),s}catch(s){throw new F(j.UNABLE_TO_GET_BUY_STATUS)}},async fetchTokensFromEOA({caipAddress:e,caipNetwork:t,namespace:i}){if(!e)return[];const{address:n}=p.parseCaipAddress(e);let s=t;i===c.CHAIN.EVM&&(s=void 0);return await I.getMyTokensWithBalance({address:n,caipNetwork:s})},async fetchTokensFromExchange(){if(!oe.selectedExchange)return[];const e=await async function(e){return await Q.get({path:`/appkit/v1/transfers/assets/exchanges/${e}`,params:Y()})}(oe.selectedExchange.id),t=Object.values(e.assets).flat();return await Promise.all(t.map(async e=>{const t={chainId:(i=e).network,address:`${i.network}:${i.asset}`,symbol:i.metadata.symbol,name:i.metadata.name,iconUrl:i.metadata.logoURI||"",price:0,quantity:{numeric:"0",decimals:i.metadata.decimals.toString()}};var i;const{chainNamespace:n}=p.parseCaipNetworkId(t.chainId);let s=t.address;if(h.isCaipAddress(s)){const{address:e}=p.parseCaipAddress(s);s=e}const a=await x.getImageByToken(s??"",n).catch(()=>{});return t.iconUrl=a??"",t}))},async fetchTokens({caipAddress:e,caipNetwork:t,namespace:i}){try{oe.isFetchingTokenBalances=!0;const n=Boolean(oe.selectedExchange)?this.fetchTokensFromExchange():this.fetchTokensFromEOA({caipAddress:e,caipNetwork:t,namespace:i}),s=await n;oe.tokenBalances={...oe.tokenBalances,[i]:s}}catch(n){const e=n instanceof Error?n.message:"Unable to get token balances";A.showError(e)}finally{oe.isFetchingTokenBalances=!1}},async fetchQuote({amount:e,address:t,sourceToken:i,toToken:n,recipient:s}){try{ce.resetQuoteState(),oe.isFetchingQuote=!0;const a=await X({amount:e,address:oe.selectedExchange?void 0:t,sourceToken:i,toToken:n,recipient:s});if(oe.selectedExchange){const e=M(a);if(e){const t=`${i.network}:${e.deposit.receiver}`,n=y.formatNumber(e.deposit.amount,{decimals:i.metadata.decimals??0,round:8});await ce.generateExchangeUrlForQuote({exchangeId:oe.selectedExchange.id,paymentAsset:i,amount:n.toString(),recipient:t})}}oe.quote=a}catch(a){let e=B.UNABLE_TO_GET_QUOTE;if(a instanceof Error&&a.cause&&a.cause instanceof Response)try{const t=await a.cause.json();t.error&&"string"==typeof t.error&&(e=t.error)}catch{}throw oe.quoteError=e,A.showError(e),new F(j.UNABLE_TO_GET_QUOTE)}finally{oe.isFetchingQuote=!1}},async fetchQuoteStatus({requestId:e}){try{if(e===se){const e=oe.selectedExchange,t=oe.exchangeSessionId;if(e&&t){switch((await this.getBuyStatus(e.id,t)).status){case"IN_PROGRESS":case"UNKNOWN":default:oe.quoteStatus="waiting";break;case"SUCCESS":oe.quoteStatus="success",oe.isPaymentInProgress=!1;break;case"FAILED":oe.quoteStatus="failure",oe.isPaymentInProgress=!1}return}return void(oe.quoteStatus="success")}const{status:t}=await async function(e){return await Q.get({path:"/appkit/v1/transfers/status",params:{requestId:e.requestId,...Y()}})}({requestId:e});oe.quoteStatus=t}catch{throw oe.quoteStatus="failure",new F(j.UNABLE_TO_GET_QUOTE_STATUS)}},initiatePayment(){oe.isPaymentInProgress=!0,oe.paymentId=crypto.randomUUID()},initializeAnalytics(){oe.analyticsSet||(oe.analyticsSet=!0,this.subscribeKey("isPaymentInProgress",e=>{var t;if((null==(t=oe.currentPayment)?void 0:t.status)&&"UNKNOWN"!==oe.currentPayment.status){const e={IN_PROGRESS:"PAY_INITIATED",SUCCESS:"PAY_SUCCESS",FAILED:"PAY_ERROR"}[oe.currentPayment.status];v.sendEvent({type:"track",event:e,properties:{message:"FAILED"===oe.currentPayment.status?h.parseError(oe.error):void 0,source:"pay",paymentId:oe.paymentId||ne,configuration:{network:oe.paymentAsset.network,asset:oe.paymentAsset.asset,recipient:oe.recipient,amount:oe.amount},currentPayment:{type:oe.currentPayment.type,exchangeId:oe.currentPayment.exchangeId,sessionId:oe.currentPayment.sessionId,result:oe.currentPayment.result}}})}}))},async prepareTokenLogo(){if(!oe.paymentAsset.metadata.logoURI)try{const{chainNamespace:e}=p.parseCaipNetworkId(oe.paymentAsset.network),t=await x.getImageByToken(oe.paymentAsset.asset,e);oe.paymentAsset.metadata.logoURI=t}catch{}}},ue=e`
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

  .left-image-container {
    position: relative;
    justify-content: center;
    align-items: center;
  }

  .token-image {
    border-radius: ${({borderRadius:e})=>e.round};
    width: 40px;
    height: 40px;
  }

  .chain-image {
    position: absolute;
    width: 20px;
    height: 20px;
    bottom: -3px;
    right: -5px;
    border-radius: ${({borderRadius:e})=>e.round};
    border: 2px solid ${({tokens:e})=>e.theme.backgroundPrimary};
  }

  .payment-methods-container {
    background-color: ${({tokens:e})=>e.theme.foregroundPrimary};
    border-top-right-radius: ${({borderRadius:e})=>e[8]};
    border-top-left-radius: ${({borderRadius:e})=>e[8]};
  }
`;var le=function(e,t,i,n){var s,a=arguments.length,r=a<3?t:null===n?n=Object.getOwnPropertyDescriptor(t,i):n;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)r=Reflect.decorate(e,t,i,n);else for(var o=e.length-1;o>=0;o--)(s=e[o])&&(r=(a<3?s(r):a>3?s(t,i,r):s(t,i))||r);return a>3&&r&&Object.defineProperty(t,i,r),r};let de=class extends a{constructor(){super(),this.unsubscribe=[],this.amount=ce.state.amount,this.namespace=void 0,this.paymentAsset=ce.state.paymentAsset,this.activeConnectorIds=T.state.activeConnectorIds,this.caipAddress=void 0,this.exchanges=ce.state.exchanges,this.isLoading=ce.state.isLoading,this.initializeNamespace(),this.unsubscribe.push(ce.subscribeKey("amount",e=>this.amount=e)),this.unsubscribe.push(T.subscribeKey("activeConnectorIds",e=>this.activeConnectorIds=e)),this.unsubscribe.push(ce.subscribeKey("exchanges",e=>this.exchanges=e)),this.unsubscribe.push(ce.subscribeKey("isLoading",e=>this.isLoading=e)),ce.fetchExchanges(),ce.setSelectedExchange(void 0)}disconnectedCallback(){this.unsubscribe.forEach(e=>e())}render(){return o`
      <wui-flex flexDirection="column">
        ${this.paymentDetailsTemplate()} ${this.paymentMethodsTemplate()}
      </wui-flex>
    `}paymentMethodsTemplate(){return o`
      <wui-flex flexDirection="column" padding="3" gap="2" class="payment-methods-container">
        ${this.payWithWalletTemplate()} ${this.templateSeparator()}
        ${this.templateExchangeOptions()}
      </wui-flex>
    `}initializeNamespace(){var e;const t=b.state.activeChain;this.namespace=t,this.caipAddress=null==(e=b.getAccountData(t))?void 0:e.caipAddress,this.unsubscribe.push(b.subscribeChainProp("accountState",e=>{this.caipAddress=null==e?void 0:e.caipAddress},t))}paymentDetailsTemplate(){const e=b.getAllRequestedCaipNetworks().find(e=>e.caipNetworkId===this.paymentAsset.network);return o`
      <wui-flex
        alignItems="center"
        justifyContent="space-between"
        .padding=${["6","8","6","8"]}
        gap="2"
      >
        <wui-flex alignItems="center" gap="1">
          <wui-text variant="h1-regular" color="primary">
            ${ie(this.amount||"0")}
          </wui-text>

          <wui-flex flexDirection="column">
            <wui-text variant="h6-regular" color="secondary">
              ${this.paymentAsset.metadata.symbol||"Unknown"}
            </wui-text>
            <wui-text variant="md-medium" color="secondary"
              >on ${(null==e?void 0:e.name)||"Unknown"}</wui-text
            >
          </wui-flex>
        </wui-flex>

        <wui-flex class="left-image-container">
          <wui-image
            src=${r(this.paymentAsset.metadata.logoURI)}
            class="token-image"
          ></wui-image>
          <wui-image
            src=${r(x.getNetworkImage(e))}
            class="chain-image"
          ></wui-image>
        </wui-flex>
      </wui-flex>
    `}payWithWalletTemplate(){return function(e){const{chainNamespace:t}=p.parseCaipNetworkId(e);return J.includes(t)}(this.paymentAsset.network)?this.caipAddress?this.connectedWalletTemplate():this.disconnectedWalletTemplate():o``}connectedWalletTemplate(){const{name:e,image:t}=this.getWalletProperties({namespace:this.namespace});return o`
      <wui-flex flexDirection="column" gap="3">
        <wui-list-item
          type="secondary"
          boxColor="foregroundSecondary"
          @click=${this.onWalletPayment}
          .boxed=${!1}
          ?chevron=${!0}
          ?fullSize=${!1}
          ?rounded=${!0}
          data-testid="wallet-payment-option"
          imageSrc=${r(t)}
          imageSize="3xl"
        >
          <wui-text variant="lg-regular" color="primary">Pay with ${e}</wui-text>
        </wui-list-item>

        <wui-list-item
          type="secondary"
          icon="power"
          iconColor="error"
          @click=${this.onDisconnect}
          data-testid="disconnect-button"
          ?chevron=${!1}
          boxColor="foregroundSecondary"
        >
          <wui-text variant="lg-regular" color="secondary">Disconnect</wui-text>
        </wui-list-item>
      </wui-flex>
    `}disconnectedWalletTemplate(){return o`<wui-list-item
      type="secondary"
      boxColor="foregroundSecondary"
      variant="icon"
      iconColor="default"
      iconVariant="overlay"
      icon="wallet"
      @click=${this.onWalletPayment}
      ?chevron=${!0}
      data-testid="wallet-payment-option"
    >
      <wui-text variant="lg-regular" color="primary">Pay with wallet</wui-text>
    </wui-list-item>`}templateExchangeOptions(){if(this.isLoading)return o`<wui-flex justifyContent="center" alignItems="center">
        <wui-loading-spinner size="md"></wui-loading-spinner>
      </wui-flex>`;const e=this.exchanges.filter(e=>function(e){const t=b.getAllRequestedCaipNetworks().find(t=>t.caipNetworkId===e.network);return!!t&&Boolean(t.testnet)}(this.paymentAsset)?e.id===z:e.id!==z);return 0===e.length?o`<wui-flex justifyContent="center" alignItems="center">
        <wui-text variant="md-medium" color="primary">No exchanges available</wui-text>
      </wui-flex>`:e.map(e=>o`
        <wui-list-item
          type="secondary"
          boxColor="foregroundSecondary"
          @click=${()=>this.onExchangePayment(e)}
          data-testid="exchange-option-${e.id}"
          ?chevron=${!0}
          imageSrc=${r(e.imageUrl)}
        >
          <wui-text flexGrow="1" variant="lg-regular" color="primary">
            Pay with ${e.name}
          </wui-text>
        </wui-list-item>
      `)}templateSeparator(){return o`<wui-separator text="or" bgColor="secondary"></wui-separator>`}async onWalletPayment(){if(!this.namespace)throw new Error("Namespace not found");this.caipAddress?S.push("PayQuote"):(await T.connect(),await E.open({view:"PayQuote"}))}onExchangePayment(e){ce.setSelectedExchange(e),S.push("PayQuote")}async onDisconnect(){try{await l.disconnect(),await E.open({view:"Pay"})}catch{console.error("Failed to disconnect"),A.showError("Failed to disconnect")}}getWalletProperties({namespace:e}){if(!e)return{name:void 0,image:void 0};const t=this.activeConnectorIds[e];if(!t)return{name:void 0,image:void 0};const i=T.getConnector({id:t,namespace:e});if(!i)return{name:void 0,image:void 0};const n=x.getConnectorImage(i);return{name:i.name,image:n}}};de.styles=ue,le([C()],de.prototype,"amount",void 0),le([C()],de.prototype,"namespace",void 0),le([C()],de.prototype,"paymentAsset",void 0),le([C()],de.prototype,"activeConnectorIds",void 0),le([C()],de.prototype,"caipAddress",void 0),le([C()],de.prototype,"exchanges",void 0),le([C()],de.prototype,"isLoading",void 0),de=le([s("w3m-pay-view")],de);const pe=e`
  :host {
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .pulse-container {
    position: relative;
    width: var(--pulse-size);
    height: var(--pulse-size);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .pulse-rings {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }

  .pulse-ring {
    position: absolute;
    inset: 0;
    border-radius: 50%;
    border: 2px solid var(--pulse-color);
    opacity: 0;
    animation: pulse var(--pulse-duration, 2s) ease-out infinite;
  }

  .pulse-content {
    position: relative;
    z-index: 1;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  @keyframes pulse {
    0% {
      transform: scale(0.5);
      opacity: var(--pulse-opacity, 0.3);
    }
    50% {
      opacity: calc(var(--pulse-opacity, 0.3) * 0.5);
    }
    100% {
      transform: scale(1.2);
      opacity: 0;
    }
  }
`;var he=function(e,t,i,n){var s,a=arguments.length,r=a<3?t:null===n?n=Object.getOwnPropertyDescriptor(t,i):n;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)r=Reflect.decorate(e,t,i,n);else for(var o=e.length-1;o>=0;o--)(s=e[o])&&(r=(a<3?s(r):a>3?s(t,i,r):s(t,i))||r);return a>3&&r&&Object.defineProperty(t,i,r),r};const me={"accent-primary":$.tokens.core.backgroundAccentPrimary};let ge=class extends a{constructor(){super(...arguments),this.rings=3,this.duration=2,this.opacity=.3,this.size="200px",this.variant="accent-primary"}render(){const e=me[this.variant];this.style.cssText=`\n      --pulse-size: ${this.size};\n      --pulse-duration: ${this.duration}s;\n      --pulse-color: ${e};\n      --pulse-opacity: ${this.opacity};\n    `;const t=Array.from({length:this.rings},(e,t)=>this.renderRing(t,this.rings));return o`
      <div class="pulse-container">
        <div class="pulse-rings">${t}</div>
        <div class="pulse-content">
          <slot></slot>
        </div>
      </div>
    `}renderRing(e,t){const i=e/t*this.duration;return o`<div class="pulse-ring" style=${`animation-delay: ${i}s;`}></div>`}};ge.styles=[t,pe],he([n({type:Number})],ge.prototype,"rings",void 0),he([n({type:Number})],ge.prototype,"duration",void 0),he([n({type:Number})],ge.prototype,"opacity",void 0),he([n()],ge.prototype,"size",void 0),he([n()],ge.prototype,"variant",void 0),ge=he([s("wui-pulse")],ge);const we=[{id:"received",title:"Receiving funds",icon:"dollar"},{id:"processing",title:"Swapping asset",icon:"recycleHorizontal"},{id:"sending",title:"Sending asset to the recipient address",icon:"send"}],ye=["success","submitted","failure","timeout","refund"],fe=e`
  :host {
    display: block;
    height: 100%;
    width: 100%;
  }

  wui-image {
    border-radius: ${({borderRadius:e})=>e.round};
  }

  .token-badge-container {
    position: absolute;
    bottom: 6px;
    left: 50%;
    transform: translateX(-50%);
    border-radius: ${({borderRadius:e})=>e[4]};
    z-index: 3;
    min-width: 105px;
  }

  .token-badge-container.loading {
    background-color: ${({tokens:e})=>e.theme.backgroundPrimary};
    border: 3px solid ${({tokens:e})=>e.theme.backgroundPrimary};
  }

  .token-badge-container.success {
    background-color: ${({tokens:e})=>e.theme.backgroundPrimary};
    border: 3px solid ${({tokens:e})=>e.theme.backgroundPrimary};
  }

  .token-image-container {
    position: relative;
  }

  .token-image {
    border-radius: ${({borderRadius:e})=>e.round};
    width: 64px;
    height: 64px;
  }

  .token-image.success {
    background-color: ${({tokens:e})=>e.theme.foregroundPrimary};
  }

  .token-image.error {
    background-color: ${({tokens:e})=>e.theme.foregroundPrimary};
  }

  .token-image.loading {
    background: ${({colors:e})=>e.accent010};
  }

  .token-image wui-icon {
    width: 32px;
    height: 32px;
  }

  .token-badge {
    background-color: ${({tokens:e})=>e.theme.foregroundPrimary};
    border: 1px solid ${({tokens:e})=>e.theme.foregroundSecondary};
    border-radius: ${({borderRadius:e})=>e[4]};
  }

  .token-badge wui-text {
    white-space: nowrap;
  }

  .payment-lifecycle-container {
    background-color: ${({tokens:e})=>e.theme.foregroundPrimary};
    border-top-right-radius: ${({borderRadius:e})=>e[6]};
    border-top-left-radius: ${({borderRadius:e})=>e[6]};
  }

  .payment-step-badge {
    padding: ${({spacing:e})=>e[1]} ${({spacing:e})=>e[2]};
    border-radius: ${({borderRadius:e})=>e[1]};
  }

  .payment-step-badge.loading {
    background-color: ${({tokens:e})=>e.theme.foregroundSecondary};
  }

  .payment-step-badge.error {
    background-color: ${({tokens:e})=>e.core.backgroundError};
  }

  .payment-step-badge.success {
    background-color: ${({tokens:e})=>e.core.backgroundSuccess};
  }

  .step-icon-container {
    position: relative;
    height: 40px;
    width: 40px;
    border-radius: ${({borderRadius:e})=>e.round};
    background-color: ${({tokens:e})=>e.theme.foregroundSecondary};
  }

  .step-icon-box {
    position: absolute;
    right: -4px;
    bottom: -1px;
    padding: 2px;
    border-radius: ${({borderRadius:e})=>e.round};
    border: 2px solid ${({tokens:e})=>e.theme.backgroundPrimary};
    background-color: ${({tokens:e})=>e.theme.foregroundPrimary};
  }

  .step-icon-box.success {
    background-color: ${({tokens:e})=>e.core.backgroundSuccess};
  }
`;var be=function(e,t,i,n){var s,a=arguments.length,r=a<3?t:null===n?n=Object.getOwnPropertyDescriptor(t,i):n;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)r=Reflect.decorate(e,t,i,n);else for(var o=e.length-1;o>=0;o--)(s=e[o])&&(r=(a<3?s(r):a>3?s(t,i,r):s(t,i))||r);return a>3&&r&&Object.defineProperty(t,i,r),r};const xe={received:["pending","success","submitted"],processing:["success","submitted"],sending:["success","submitted"]};let ve=class extends a{constructor(){super(),this.unsubscribe=[],this.pollingInterval=null,this.paymentAsset=ce.state.paymentAsset,this.quoteStatus=ce.state.quoteStatus,this.quote=ce.state.quote,this.amount=ce.state.amount,this.namespace=void 0,this.caipAddress=void 0,this.profileName=null,this.activeConnectorIds=T.state.activeConnectorIds,this.selectedExchange=ce.state.selectedExchange,this.initializeNamespace(),this.unsubscribe.push(ce.subscribeKey("quoteStatus",e=>this.quoteStatus=e),ce.subscribeKey("quote",e=>this.quote=e),T.subscribeKey("activeConnectorIds",e=>this.activeConnectorIds=e),ce.subscribeKey("selectedExchange",e=>this.selectedExchange=e))}connectedCallback(){super.connectedCallback(),this.startPolling()}disconnectedCallback(){super.disconnectedCallback(),this.stopPolling(),this.unsubscribe.forEach(e=>e())}render(){return o`
      <wui-flex flexDirection="column" .padding=${["3","0","0","0"]} gap="2">
        ${this.tokenTemplate()} ${this.paymentTemplate()} ${this.paymentLifecycleTemplate()}
      </wui-flex>
    `}tokenTemplate(){const e=ie(this.amount||"0"),t=this.paymentAsset.metadata.symbol??"Unknown",i=b.getAllRequestedCaipNetworks().find(e=>e.caipNetworkId===this.paymentAsset.network),n="failure"===this.quoteStatus||"timeout"===this.quoteStatus||"refund"===this.quoteStatus;return"success"===this.quoteStatus||"submitted"===this.quoteStatus?o`<wui-flex alignItems="center" justifyContent="center">
        <wui-flex justifyContent="center" alignItems="center" class="token-image success">
          <wui-icon name="checkmark" color="success" size="inherit"></wui-icon>
        </wui-flex>
      </wui-flex>`:n?o`<wui-flex alignItems="center" justifyContent="center">
        <wui-flex justifyContent="center" alignItems="center" class="token-image error">
          <wui-icon name="close" color="error" size="inherit"></wui-icon>
        </wui-flex>
      </wui-flex>`:o`
      <wui-flex alignItems="center" justifyContent="center">
        <wui-flex class="token-image-container">
          <wui-pulse size="125px" rings="3" duration="4" opacity="0.5" variant="accent-primary">
            <wui-flex justifyContent="center" alignItems="center" class="token-image loading">
              <wui-icon name="paperPlaneTitle" color="accent-primary" size="inherit"></wui-icon>
            </wui-flex>
          </wui-pulse>

          <wui-flex
            justifyContent="center"
            alignItems="center"
            class="token-badge-container loading"
          >
            <wui-flex
              alignItems="center"
              justifyContent="center"
              gap="01"
              padding="1"
              class="token-badge"
            >
              <wui-image
                src=${r(x.getNetworkImage(i))}
                class="chain-image"
                size="mdl"
              ></wui-image>

              <wui-text variant="lg-regular" color="primary">${e} ${t}</wui-text>
            </wui-flex>
          </wui-flex>
        </wui-flex>
      </wui-flex>
    `}paymentTemplate(){return o`
      <wui-flex flexDirection="column" gap="2" .padding=${["0","6","0","6"]}>
        ${this.renderPayment()}
        <wui-separator></wui-separator>
        ${this.renderWallet()}
      </wui-flex>
    `}paymentLifecycleTemplate(){const e=this.getStepsWithStatus();return o`
      <wui-flex flexDirection="column" padding="4" gap="2" class="payment-lifecycle-container">
        <wui-flex alignItems="center" justifyContent="space-between">
          <wui-text variant="md-regular" color="secondary">PAYMENT CYCLE</wui-text>

          ${this.renderPaymentCycleBadge()}
        </wui-flex>

        <wui-flex flexDirection="column" gap="5" .padding=${["2","0","2","0"]}>
          ${e.map(e=>this.renderStep(e))}
        </wui-flex>
      </wui-flex>
    `}renderPaymentCycleBadge(){var e;const t="failure"===this.quoteStatus||"timeout"===this.quoteStatus||"refund"===this.quoteStatus,i="success"===this.quoteStatus||"submitted"===this.quoteStatus;if(t)return o`
        <wui-flex
          justifyContent="center"
          alignItems="center"
          class="payment-step-badge error"
          gap="1"
        >
          <wui-icon name="close" color="error" size="xs"></wui-icon>
          <wui-text variant="sm-regular" color="error">Failed</wui-text>
        </wui-flex>
      `;if(i)return o`
        <wui-flex
          justifyContent="center"
          alignItems="center"
          class="payment-step-badge success"
          gap="1"
        >
          <wui-icon name="checkmark" color="success" size="xs"></wui-icon>
          <wui-text variant="sm-regular" color="success">Completed</wui-text>
        </wui-flex>
      `;const n=(null==(e=this.quote)?void 0:e.timeInSeconds)??0;return o`
      <wui-flex alignItems="center" justifyContent="space-between" gap="3">
        <wui-flex
          justifyContent="center"
          alignItems="center"
          class="payment-step-badge loading"
          gap="1"
        >
          <wui-icon name="clock" color="default" size="xs"></wui-icon>
          <wui-text variant="sm-regular" color="primary">Est. ${n} sec</wui-text>
        </wui-flex>

        <wui-icon name="chevronBottom" color="default" size="xxs"></wui-icon>
      </wui-flex>
    `}renderPayment(){var e,t,i;const n=b.getAllRequestedCaipNetworks().find(e=>{var t;const i=null==(t=this.quote)?void 0:t.origin.currency.network;if(!i)return!1;const{chainId:n}=p.parseCaipNetworkId(i);return g.isLowerCaseMatch(e.id.toString(),n.toString())}),s=ie(y.formatNumber((null==(e=this.quote)?void 0:e.origin.amount)||"0",{decimals:(null==(t=this.quote)?void 0:t.origin.currency.metadata.decimals)??0}).toString()),a=(null==(i=this.quote)?void 0:i.origin.currency.metadata.symbol)??"Unknown";return o`
      <wui-flex
        alignItems="flex-start"
        justifyContent="space-between"
        .padding=${["3","0","3","0"]}
      >
        <wui-text variant="lg-regular" color="secondary">Payment Method</wui-text>

        <wui-flex flexDirection="column" alignItems="flex-end" gap="1">
          <wui-flex alignItems="center" gap="01">
            <wui-text variant="lg-regular" color="primary">${s}</wui-text>
            <wui-text variant="lg-regular" color="secondary">${a}</wui-text>
          </wui-flex>

          <wui-flex alignItems="center" gap="1">
            <wui-text variant="md-regular" color="secondary">on</wui-text>
            <wui-image
              src=${r(x.getNetworkImage(n))}
              size="xs"
            ></wui-image>
            <wui-text variant="md-regular" color="secondary">${null==n?void 0:n.name}</wui-text>
          </wui-flex>
        </wui-flex>
      </wui-flex>
    `}renderWallet(){return o`
      <wui-flex
        alignItems="flex-start"
        justifyContent="space-between"
        .padding=${["3","0","3","0"]}
      >
        <wui-text variant="lg-regular" color="secondary"
          >${this.selectedExchange?"Exchange":"Wallet"}</wui-text
        >

        ${this.renderWalletText()}
      </wui-flex>
    `}renderWalletText(){var e;const{image:t}=this.getWalletProperties({namespace:this.namespace}),{address:i}=this.caipAddress?p.parseCaipAddress(this.caipAddress):{},n=null==(e=this.selectedExchange)?void 0:e.name;return this.selectedExchange?o`
        <wui-flex alignItems="center" justifyContent="flex-end" gap="1">
          <wui-text variant="lg-regular" color="primary">${n}</wui-text>
          <wui-image src=${r(this.selectedExchange.imageUrl)} size="mdl"></wui-image>
        </wui-flex>
      `:o`
      <wui-flex alignItems="center" justifyContent="flex-end" gap="1">
        <wui-text variant="lg-regular" color="primary">
          ${_.getTruncateString({string:this.profileName||i||n||"",charsStart:this.profileName?16:4,charsEnd:this.profileName?0:6,truncate:this.profileName?"end":"middle"})}
        </wui-text>

        <wui-image src=${r(t)} size="mdl"></wui-image>
      </wui-flex>
    `}getStepsWithStatus(){return"failure"===this.quoteStatus||"timeout"===this.quoteStatus||"refund"===this.quoteStatus?we.map(e=>({...e,status:"failed"})):we.map(e=>{const t=(xe[e.id]??[]).includes(this.quoteStatus)?"completed":"pending";return{...e,status:t}})}renderStep({title:e,icon:t,status:i}){return o`
      <wui-flex alignItems="center" gap="3">
        <wui-flex justifyContent="center" alignItems="center" class="step-icon-container">
          <wui-icon name=${t} color="default" size="mdl"></wui-icon>

          <wui-flex alignItems="center" justifyContent="center" class=${R({"step-icon-box":!0,success:"completed"===i})}>
            ${this.renderStatusIndicator(i)}
          </wui-flex>
        </wui-flex>

        <wui-text variant="md-regular" color="primary">${e}</wui-text>
      </wui-flex>
    `}renderStatusIndicator(e){return"completed"===e?o`<wui-icon size="sm" color="success" name="checkmark"></wui-icon>`:"failed"===e?o`<wui-icon size="sm" color="error" name="close"></wui-icon>`:"pending"===e?o`<wui-loading-spinner color="accent-primary" size="sm"></wui-loading-spinner>`:null}startPolling(){this.pollingInterval||(this.fetchQuoteStatus(),this.pollingInterval=setInterval(()=>{this.fetchQuoteStatus()},3e3))}stopPolling(){this.pollingInterval&&(clearInterval(this.pollingInterval),this.pollingInterval=null)}async fetchQuoteStatus(){const e=ce.state.requestId;if(!e||ye.includes(this.quoteStatus))this.stopPolling();else try{await ce.fetchQuoteStatus({requestId:e}),ye.includes(this.quoteStatus)&&this.stopPolling()}catch{this.stopPolling()}}initializeNamespace(){var e,t;const i=b.state.activeChain;this.namespace=i,this.caipAddress=null==(e=b.getAccountData(i))?void 0:e.caipAddress,this.profileName=(null==(t=b.getAccountData(i))?void 0:t.profileName)??null,this.unsubscribe.push(b.subscribeChainProp("accountState",e=>{this.caipAddress=null==e?void 0:e.caipAddress,this.profileName=(null==e?void 0:e.profileName)??null},i))}getWalletProperties({namespace:e}){if(!e)return{name:void 0,image:void 0};const t=this.activeConnectorIds[e];if(!t)return{name:void 0,image:void 0};const i=T.getConnector({id:t,namespace:e});if(!i)return{name:void 0,image:void 0};const n=x.getConnectorImage(i);return{name:i.name,image:n}}};ve.styles=fe,be([C()],ve.prototype,"paymentAsset",void 0),be([C()],ve.prototype,"quoteStatus",void 0),be([C()],ve.prototype,"quote",void 0),be([C()],ve.prototype,"amount",void 0),be([C()],ve.prototype,"namespace",void 0),be([C()],ve.prototype,"caipAddress",void 0),be([C()],ve.prototype,"profileName",void 0),be([C()],ve.prototype,"activeConnectorIds",void 0),be([C()],ve.prototype,"selectedExchange",void 0),ve=be([s("w3m-pay-loading-view")],ve);const Ae=O`
  :host {
    display: block;
  }
`;let Ie=class extends a{render(){return o`
      <wui-flex flexDirection="column" gap="4">
        <wui-flex alignItems="center" justifyContent="space-between">
          <wui-text variant="md-regular" color="secondary">Pay</wui-text>
          <wui-shimmer width="60px" height="16px" borderRadius="4xs" variant="light"></wui-shimmer>
        </wui-flex>

        <wui-flex alignItems="center" justifyContent="space-between">
          <wui-text variant="md-regular" color="secondary">Network Fee</wui-text>

          <wui-flex flexDirection="column" alignItems="flex-end" gap="2">
            <wui-shimmer
              width="75px"
              height="16px"
              borderRadius="4xs"
              variant="light"
            ></wui-shimmer>

            <wui-flex alignItems="center" gap="01">
              <wui-shimmer width="14px" height="14px" rounded variant="light"></wui-shimmer>
              <wui-shimmer
                width="49px"
                height="14px"
                borderRadius="4xs"
                variant="light"
              ></wui-shimmer>
            </wui-flex>
          </wui-flex>
        </wui-flex>

        <wui-flex alignItems="center" justifyContent="space-between">
          <wui-text variant="md-regular" color="secondary">Service Fee</wui-text>
          <wui-shimmer width="75px" height="16px" borderRadius="4xs" variant="light"></wui-shimmer>
        </wui-flex>
      </wui-flex>
    `}};Ie.styles=[Ae],Ie=function(e,t,i,n){var s,a=arguments.length,r=a<3?t:null===n?n=Object.getOwnPropertyDescriptor(t,i):n;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)r=Reflect.decorate(e,t,i,n);else for(var o=e.length-1;o>=0;o--)(s=e[o])&&(r=(a<3?s(r):a>3?s(t,i,r):s(t,i))||r);return a>3&&r&&Object.defineProperty(t,i,r),r}([s("w3m-pay-fees-skeleton")],Ie);const Ee=e`
  :host {
    display: block;
  }

  wui-image {
    border-radius: ${({borderRadius:e})=>e.round};
  }
`;var ke=function(e,t,i,n){var s,a=arguments.length,r=a<3?t:null===n?n=Object.getOwnPropertyDescriptor(t,i):n;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)r=Reflect.decorate(e,t,i,n);else for(var o=e.length-1;o>=0;o--)(s=e[o])&&(r=(a<3?s(r):a>3?s(t,i,r):s(t,i))||r);return a>3&&r&&Object.defineProperty(t,i,r),r};let Ne=class extends a{constructor(){super(),this.unsubscribe=[],this.quote=ce.state.quote,this.unsubscribe.push(ce.subscribeKey("quote",e=>this.quote=e))}disconnectedCallback(){this.unsubscribe.forEach(e=>e())}render(){var e,t,i;const n=y.formatNumber((null==(e=this.quote)?void 0:e.origin.amount)||"0",{decimals:(null==(t=this.quote)?void 0:t.origin.currency.metadata.decimals)??0,round:6}).toString();return o`
      <wui-flex flexDirection="column" gap="4">
        <wui-flex alignItems="center" justifyContent="space-between">
          <wui-text variant="md-regular" color="secondary">Pay</wui-text>
          <wui-text variant="md-regular" color="primary">
            ${n} ${(null==(i=this.quote)?void 0:i.origin.currency.metadata.symbol)||"Unknown"}
          </wui-text>
        </wui-flex>

        ${this.quote&&this.quote.fees.length>0?this.quote.fees.map(e=>this.renderFee(e)):null}
      </wui-flex>
    `}renderFee(e){const t="network"===e.id,i=y.formatNumber(e.amount||"0",{decimals:e.currency.metadata.decimals??0,round:6}).toString();if(t){const t=b.getAllRequestedCaipNetworks().find(t=>g.isLowerCaseMatch(t.caipNetworkId,e.currency.network));return o`
        <wui-flex alignItems="center" justifyContent="space-between">
          <wui-text variant="md-regular" color="secondary">${e.label}</wui-text>

          <wui-flex flexDirection="column" alignItems="flex-end" gap="2">
            <wui-text variant="md-regular" color="primary">
              ${i} ${e.currency.metadata.symbol||"Unknown"}
            </wui-text>

            <wui-flex alignItems="center" gap="01">
              <wui-image
                src=${r(x.getNetworkImage(t))}
                size="xs"
              ></wui-image>
              <wui-text variant="sm-regular" color="secondary">
                ${(null==t?void 0:t.name)||"Unknown"}
              </wui-text>
            </wui-flex>
          </wui-flex>
        </wui-flex>
      `}return o`
      <wui-flex alignItems="center" justifyContent="space-between">
        <wui-text variant="md-regular" color="secondary">${e.label}</wui-text>
        <wui-text variant="md-regular" color="primary">
          ${i} ${e.currency.metadata.symbol||"Unknown"}
        </wui-text>
      </wui-flex>
    `}};Ne.styles=[Ee],ke([C()],Ne.prototype,"quote",void 0),Ne=ke([s("w3m-pay-fees")],Ne);const Pe=e`
  :host {
    display: block;
    width: 100%;
  }

  .disabled-container {
    padding: ${({spacing:e})=>e[2]};
    min-height: 168px;
  }

  wui-icon {
    width: ${({spacing:e})=>e[8]};
    height: ${({spacing:e})=>e[8]};
  }

  wui-flex > wui-text {
    max-width: 273px;
  }
`;var Te=function(e,t,i,n){var s,a=arguments.length,r=a<3?t:null===n?n=Object.getOwnPropertyDescriptor(t,i):n;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)r=Reflect.decorate(e,t,i,n);else for(var o=e.length-1;o>=0;o--)(s=e[o])&&(r=(a<3?s(r):a>3?s(t,i,r):s(t,i))||r);return a>3&&r&&Object.defineProperty(t,i,r),r};let Se=class extends a{constructor(){super(),this.unsubscribe=[],this.selectedExchange=ce.state.selectedExchange,this.unsubscribe.push(ce.subscribeKey("selectedExchange",e=>this.selectedExchange=e))}disconnectedCallback(){this.unsubscribe.forEach(e=>e())}render(){const e=Boolean(this.selectedExchange);return o`
      <wui-flex
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        gap="3"
        class="disabled-container"
      >
        <wui-icon name="coins" color="default" size="inherit"></wui-icon>

        <wui-text variant="md-regular" color="primary" align="center">
          You don't have enough funds to complete this transaction
        </wui-text>

        ${e?null:o`<wui-button
              size="md"
              variant="neutral-secondary"
              @click=${this.dispatchConnectOtherWalletEvent.bind(this)}
              >Connect other wallet</wui-button
            >`}
      </wui-flex>
    `}dispatchConnectOtherWalletEvent(){this.dispatchEvent(new CustomEvent("connectOtherWallet",{detail:!0,bubbles:!0,composed:!0}))}};Se.styles=[Pe],Te([n({type:Array})],Se.prototype,"selectedExchange",void 0),Se=Te([s("w3m-pay-options-empty")],Se);const Ce=e`
  :host {
    display: block;
    width: 100%;
  }

  .pay-options-container {
    max-height: 196px;
    overflow-y: auto;
    overflow-x: hidden;
    scrollbar-width: none;
  }

  .pay-options-container::-webkit-scrollbar {
    display: none;
  }

  .pay-option-container {
    border-radius: ${({borderRadius:e})=>e[4]};
    padding: ${({spacing:e})=>e[3]};
    min-height: 60px;
  }

  .token-images-container {
    position: relative;
    justify-content: center;
    align-items: center;
  }

  .chain-image {
    position: absolute;
    bottom: -3px;
    right: -5px;
    border: 2px solid ${({tokens:e})=>e.theme.foregroundSecondary};
  }
`;let $e=class extends a{render(){return o`
      <wui-flex flexDirection="column" gap="2" class="pay-options-container">
        ${this.renderOptionEntry()} ${this.renderOptionEntry()} ${this.renderOptionEntry()}
      </wui-flex>
    `}renderOptionEntry(){return o`
      <wui-flex
        alignItems="center"
        justifyContent="space-between"
        gap="2"
        class="pay-option-container"
      >
        <wui-flex alignItems="center" gap="2">
          <wui-flex class="token-images-container">
            <wui-shimmer
              width="32px"
              height="32px"
              rounded
              variant="light"
              class="token-image"
            ></wui-shimmer>
            <wui-shimmer
              width="16px"
              height="16px"
              rounded
              variant="light"
              class="chain-image"
            ></wui-shimmer>
          </wui-flex>

          <wui-flex flexDirection="column" gap="1">
            <wui-shimmer
              width="74px"
              height="16px"
              borderRadius="4xs"
              variant="light"
            ></wui-shimmer>
            <wui-shimmer
              width="46px"
              height="14px"
              borderRadius="4xs"
              variant="light"
            ></wui-shimmer>
          </wui-flex>
        </wui-flex>
      </wui-flex>
    `}};$e.styles=[Ce],$e=function(e,t,i,n){var s,a=arguments.length,r=a<3?t:null===n?n=Object.getOwnPropertyDescriptor(t,i):n;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)r=Reflect.decorate(e,t,i,n);else for(var o=e.length-1;o>=0;o--)(s=e[o])&&(r=(a<3?s(r):a>3?s(t,i,r):s(t,i))||r);return a>3&&r&&Object.defineProperty(t,i,r),r}([s("w3m-pay-options-skeleton")],$e);const _e=e`
  :host {
    display: block;
    width: 100%;
  }

  .pay-options-container {
    max-height: 196px;
    overflow-y: auto;
    overflow-x: hidden;
    scrollbar-width: none;
    mask-image: var(--options-mask-image);
    -webkit-mask-image: var(--options-mask-image);
  }

  .pay-options-container::-webkit-scrollbar {
    display: none;
  }

  .pay-option-container {
    cursor: pointer;
    border-radius: ${({borderRadius:e})=>e[4]};
    padding: ${({spacing:e})=>e[3]};
    transition: background-color ${({durations:e})=>e.lg}
      ${({easings:e})=>e["ease-out-power-1"]};
    will-change: background-color;
  }

  .token-images-container {
    position: relative;
    justify-content: center;
    align-items: center;
  }

  .token-image {
    border-radius: ${({borderRadius:e})=>e.round};
    width: 32px;
    height: 32px;
  }

  .chain-image {
    position: absolute;
    width: 16px;
    height: 16px;
    bottom: -3px;
    right: -5px;
    border-radius: ${({borderRadius:e})=>e.round};
    border: 2px solid ${({tokens:e})=>e.theme.backgroundPrimary};
  }

  @media (hover: hover) and (pointer: fine) {
    .pay-option-container:hover {
      background-color: ${({tokens:e})=>e.theme.foregroundPrimary};
    }
  }
`;var Re=function(e,t,i,n){var s,a=arguments.length,r=a<3?t:null===n?n=Object.getOwnPropertyDescriptor(t,i):n;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)r=Reflect.decorate(e,t,i,n);else for(var o=e.length-1;o>=0;o--)(s=e[o])&&(r=(a<3?s(r):a>3?s(t,i,r):s(t,i))||r);return a>3&&r&&Object.defineProperty(t,i,r),r};let Oe=class extends a{constructor(){super(),this.unsubscribe=[],this.options=[],this.selectedPaymentAsset=null}disconnectedCallback(){var e,t;this.unsubscribe.forEach(e=>e()),null==(e=this.resizeObserver)||e.disconnect();const i=null==(t=this.shadowRoot)?void 0:t.querySelector(".pay-options-container");null==i||i.removeEventListener("scroll",this.handleOptionsListScroll.bind(this))}firstUpdated(){var e,t;const i=null==(e=this.shadowRoot)?void 0:e.querySelector(".pay-options-container");i&&(requestAnimationFrame(this.handleOptionsListScroll.bind(this)),null==i||i.addEventListener("scroll",this.handleOptionsListScroll.bind(this)),this.resizeObserver=new ResizeObserver(()=>{this.handleOptionsListScroll()}),null==(t=this.resizeObserver)||t.observe(i),this.handleOptionsListScroll())}render(){return o`
      <wui-flex flexDirection="column" gap="2" class="pay-options-container">
        ${this.options.map(e=>this.payOptionTemplate(e))}
      </wui-flex>
    `}payOptionTemplate(e){var t,i;const{network:n,metadata:s,asset:a,amount:c="0"}=e,u=b.getAllRequestedCaipNetworks().find(e=>e.caipNetworkId===n),l=`${n}:${a}`===`${null==(t=this.selectedPaymentAsset)?void 0:t.network}:${null==(i=this.selectedPaymentAsset)?void 0:i.asset}`,d=y.bigNumber(c,{safe:!0}),p=d.gt(0);return o`
      <wui-flex
        alignItems="center"
        justifyContent="space-between"
        gap="2"
        @click=${()=>{var t;return null==(t=this.onSelect)?void 0:t.call(this,e)}}
        class="pay-option-container"
      >
        <wui-flex alignItems="center" gap="2">
          <wui-flex class="token-images-container">
            <wui-image
              src=${r(s.logoURI)}
              class="token-image"
              size="3xl"
            ></wui-image>
            <wui-image
              src=${r(x.getNetworkImage(u))}
              class="chain-image"
              size="md"
            ></wui-image>
          </wui-flex>

          <wui-flex flexDirection="column" gap="1">
            <wui-text variant="lg-regular" color="primary">${s.symbol}</wui-text>
            ${p?o`<wui-text variant="sm-regular" color="secondary">
                  ${d.round(6).toString()} ${s.symbol}
                </wui-text>`:null}
          </wui-flex>
        </wui-flex>

        ${l?o`<wui-icon name="checkmark" size="md" color="success"></wui-icon>`:null}
      </wui-flex>
    `}handleOptionsListScroll(){var e;const t=null==(e=this.shadowRoot)?void 0:e.querySelector(".pay-options-container");if(!t)return;t.scrollHeight>300?(t.style.setProperty("--options-mask-image","linear-gradient(\n          to bottom,\n          rgba(0, 0, 0, calc(1 - var(--options-scroll--top-opacity))) 0px,\n          rgba(200, 200, 200, calc(1 - var(--options-scroll--top-opacity))) 1px,\n          black 50px,\n          black calc(100% - 50px),\n          rgba(155, 155, 155, calc(1 - var(--options-scroll--bottom-opacity))) calc(100% - 1px),\n          rgba(0, 0, 0, calc(1 - var(--options-scroll--bottom-opacity))) 100%\n        )"),t.style.setProperty("--options-scroll--top-opacity",U.interpolate([0,50],[0,1],t.scrollTop).toString()),t.style.setProperty("--options-scroll--bottom-opacity",U.interpolate([0,50],[0,1],t.scrollHeight-t.scrollTop-t.offsetHeight).toString())):(t.style.setProperty("--options-mask-image","none"),t.style.setProperty("--options-scroll--top-opacity","0"),t.style.setProperty("--options-scroll--bottom-opacity","0"))}};Oe.styles=[_e],Re([n({type:Array})],Oe.prototype,"options",void 0),Re([n()],Oe.prototype,"selectedPaymentAsset",void 0),Re([n()],Oe.prototype,"onSelect",void 0),Oe=Re([s("w3m-pay-options")],Oe);const Ue=e`
  .payment-methods-container {
    background-color: ${({tokens:e})=>e.theme.foregroundPrimary};
    border-top-right-radius: ${({borderRadius:e})=>e[5]};
    border-top-left-radius: ${({borderRadius:e})=>e[5]};
  }

  .pay-options-container {
    background-color: ${({tokens:e})=>e.theme.foregroundSecondary};
    border-radius: ${({borderRadius:e})=>e[5]};
    padding: ${({spacing:e})=>e[1]};
  }

  w3m-tooltip-trigger {
    display: flex;
    align-items: center;
    justify-content: center;
    max-width: fit-content;
  }

  wui-image {
    border-radius: ${({borderRadius:e})=>e.round};
  }

  w3m-pay-options.disabled {
    opacity: 0.5;
    pointer-events: none;
  }
`;var Le=function(e,t,i,n){var s,a=arguments.length,r=a<3?t:null===n?n=Object.getOwnPropertyDescriptor(t,i):n;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)r=Reflect.decorate(e,t,i,n);else for(var o=e.length-1;o>=0;o--)(s=e[o])&&(r=(a<3?s(r):a>3?s(t,i,r):s(t,i))||r);return a>3&&r&&Object.defineProperty(t,i,r),r};const qe={eip155:{icon:"ethereum",label:"EVM"},solana:{icon:"solana",label:"Solana"},bip122:{icon:"bitcoin",label:"Bitcoin"},ton:{icon:"ton",label:"Ton"}};let De=class extends a{constructor(){super(),this.unsubscribe=[],this.profileName=null,this.paymentAsset=ce.state.paymentAsset,this.namespace=void 0,this.caipAddress=void 0,this.amount=ce.state.amount,this.recipient=ce.state.recipient,this.activeConnectorIds=T.state.activeConnectorIds,this.selectedPaymentAsset=ce.state.selectedPaymentAsset,this.selectedExchange=ce.state.selectedExchange,this.isFetchingQuote=ce.state.isFetchingQuote,this.quoteError=ce.state.quoteError,this.quote=ce.state.quote,this.isFetchingTokenBalances=ce.state.isFetchingTokenBalances,this.tokenBalances=ce.state.tokenBalances,this.isPaymentInProgress=ce.state.isPaymentInProgress,this.exchangeUrlForQuote=ce.state.exchangeUrlForQuote,this.completedTransactionsCount=0,this.unsubscribe.push(ce.subscribeKey("paymentAsset",e=>this.paymentAsset=e)),this.unsubscribe.push(ce.subscribeKey("tokenBalances",e=>this.onTokenBalancesChanged(e))),this.unsubscribe.push(ce.subscribeKey("isFetchingTokenBalances",e=>this.isFetchingTokenBalances=e)),this.unsubscribe.push(T.subscribeKey("activeConnectorIds",e=>this.activeConnectorIds=e)),this.unsubscribe.push(ce.subscribeKey("selectedPaymentAsset",e=>this.selectedPaymentAsset=e)),this.unsubscribe.push(ce.subscribeKey("isFetchingQuote",e=>this.isFetchingQuote=e)),this.unsubscribe.push(ce.subscribeKey("quoteError",e=>this.quoteError=e)),this.unsubscribe.push(ce.subscribeKey("quote",e=>this.quote=e)),this.unsubscribe.push(ce.subscribeKey("amount",e=>this.amount=e)),this.unsubscribe.push(ce.subscribeKey("recipient",e=>this.recipient=e)),this.unsubscribe.push(ce.subscribeKey("isPaymentInProgress",e=>this.isPaymentInProgress=e)),this.unsubscribe.push(ce.subscribeKey("selectedExchange",e=>this.selectedExchange=e)),this.unsubscribe.push(ce.subscribeKey("exchangeUrlForQuote",e=>this.exchangeUrlForQuote=e)),this.resetQuoteState(),this.initializeNamespace(),this.fetchTokens()}disconnectedCallback(){super.disconnectedCallback(),this.resetAssetsState(),this.unsubscribe.forEach(e=>e())}updated(e){super.updated(e);e.has("selectedPaymentAsset")&&this.fetchQuote()}render(){return o`
      <wui-flex flexDirection="column">
        ${this.profileTemplate()}

        <wui-flex
          flexDirection="column"
          gap="4"
          class="payment-methods-container"
          .padding=${["4","4","5","4"]}
        >
          ${this.paymentOptionsViewTemplate()} ${this.amountWithFeeTemplate()}

          <wui-flex
            alignItems="center"
            justifyContent="space-between"
            .padding=${["1","0","1","0"]}
          >
            <wui-separator></wui-separator>
          </wui-flex>

          ${this.paymentActionsTemplate()}
        </wui-flex>
      </wui-flex>
    `}profileTemplate(){var e,t;if(this.selectedExchange){const i=y.formatNumber(null==(e=this.quote)?void 0:e.origin.amount,{decimals:(null==(t=this.quote)?void 0:t.origin.currency.metadata.decimals)??0}).toString();return o`
        <wui-flex
          .padding=${["4","3","4","3"]}
          alignItems="center"
          justifyContent="space-between"
          gap="2"
        >
          <wui-text variant="lg-regular" color="secondary">Paying with</wui-text>

          ${this.quote?o`<wui-text variant="lg-regular" color="primary">
                ${y.bigNumber(i,{safe:!0}).round(6).toString()}
                ${this.quote.origin.currency.metadata.symbol}
              </wui-text>`:o`<wui-shimmer width="80px" height="18px" variant="light"></wui-shimmer>`}
        </wui-flex>
      `}const i=h.getPlainAddress(this.caipAddress)??"",{name:n,image:s}=this.getWalletProperties({namespace:this.namespace}),{icon:a,label:c}=qe[this.namespace]??{};return o`
      <wui-flex
        .padding=${["4","3","4","3"]}
        alignItems="center"
        justifyContent="space-between"
        gap="2"
      >
        <wui-wallet-switch
          profileName=${r(this.profileName)}
          address=${r(i)}
          imageSrc=${r(s)}
          alt=${r(n)}
          @click=${this.onConnectOtherWallet.bind(this)}
          data-testid="wui-wallet-switch"
        ></wui-wallet-switch>

        <wui-wallet-switch
          profileName=${r(c)}
          address=${r(i)}
          icon=${r(a)}
          iconSize="xs"
          .enableGreenCircle=${!1}
          alt=${r(c)}
          @click=${this.onConnectOtherWallet.bind(this)}
          data-testid="wui-wallet-switch"
        ></wui-wallet-switch>
      </wui-flex>
    `}initializeNamespace(){var e,t;const i=b.state.activeChain;this.namespace=i,this.caipAddress=null==(e=b.getAccountData(i))?void 0:e.caipAddress,this.profileName=(null==(t=b.getAccountData(i))?void 0:t.profileName)??null,this.unsubscribe.push(b.subscribeChainProp("accountState",e=>this.onAccountStateChanged(e),i))}async fetchTokens(){if(this.namespace){let e;if(this.caipAddress){const{chainId:t,chainNamespace:i}=p.parseCaipAddress(this.caipAddress),n=`${i}:${t}`;e=b.getAllRequestedCaipNetworks().find(e=>e.caipNetworkId===n)}await ce.fetchTokens({caipAddress:this.caipAddress,caipNetwork:e,namespace:this.namespace})}}fetchQuote(){if(this.amount&&this.recipient&&this.selectedPaymentAsset&&this.paymentAsset){const{address:e}=this.caipAddress?p.parseCaipAddress(this.caipAddress):{};ce.fetchQuote({amount:this.amount.toString(),address:e,sourceToken:this.selectedPaymentAsset,toToken:this.paymentAsset,recipient:this.recipient})}}getWalletProperties({namespace:e}){if(!e)return{name:void 0,image:void 0};const t=this.activeConnectorIds[e];if(!t)return{name:void 0,image:void 0};const i=T.getConnector({id:t,namespace:e});if(!i)return{name:void 0,image:void 0};const n=x.getConnectorImage(i);return{name:i.name,image:n}}paymentOptionsViewTemplate(){return o`
      <wui-flex flexDirection="column" gap="2">
        <wui-text variant="sm-regular" color="secondary">CHOOSE PAYMENT OPTION</wui-text>
        <wui-flex class="pay-options-container">${this.paymentOptionsTemplate()}</wui-flex>
      </wui-flex>
    `}paymentOptionsTemplate(){const e=this.getPaymentAssetFromTokenBalances();if(this.isFetchingTokenBalances)return o`<w3m-pay-options-skeleton></w3m-pay-options-skeleton>`;if(0===e.length)return o`<w3m-pay-options-empty
        @connectOtherWallet=${this.onConnectOtherWallet.bind(this)}
      ></w3m-pay-options-empty>`;const t={disabled:this.isFetchingQuote};return o`<w3m-pay-options
      class=${R(t)}
      .options=${e}
      .selectedPaymentAsset=${r(this.selectedPaymentAsset)}
      .onSelect=${this.onSelectedPaymentAssetChanged.bind(this)}
    ></w3m-pay-options>`}amountWithFeeTemplate(){return this.isFetchingQuote||!this.selectedPaymentAsset||this.quoteError?o`<w3m-pay-fees-skeleton></w3m-pay-fees-skeleton>`:o`<w3m-pay-fees></w3m-pay-fees>`}paymentActionsTemplate(){var e,t,i;const n=this.isFetchingQuote||this.isFetchingTokenBalances,s=this.isFetchingQuote||this.isFetchingTokenBalances||!this.selectedPaymentAsset||Boolean(this.quoteError),a=y.formatNumber((null==(e=this.quote)?void 0:e.origin.amount)??0,{decimals:(null==(t=this.quote)?void 0:t.origin.currency.metadata.decimals)??0}).toString();return this.selectedExchange?n||s?o`
          <wui-shimmer width="100%" height="48px" variant="light" ?rounded=${!0}></wui-shimmer>
        `:o`<wui-button
        size="lg"
        fullWidth
        variant="accent-secondary"
        @click=${this.onPayWithExchange.bind(this)}
      >
        ${`Continue in ${this.selectedExchange.name}`}

        <wui-icon name="arrowRight" color="inherit" size="sm" slot="iconRight"></wui-icon>
      </wui-button>`:o`
      <wui-flex alignItems="center" justifyContent="space-between">
        <wui-flex flexDirection="column" gap="1">
          <wui-text variant="md-regular" color="secondary">Order Total</wui-text>

          ${n||s?o`<wui-shimmer width="58px" height="32px" variant="light"></wui-shimmer>`:o`<wui-flex alignItems="center" gap="01">
                <wui-text variant="h4-regular" color="primary">${ie(a)}</wui-text>

                <wui-text variant="lg-regular" color="secondary">
                  ${(null==(i=this.quote)?void 0:i.origin.currency.metadata.symbol)||"Unknown"}
                </wui-text>
              </wui-flex>`}
        </wui-flex>

        ${this.actionButtonTemplate({isLoading:n,isDisabled:s})}
      </wui-flex>
    `}actionButtonTemplate(e){const t=G(this.quote),{isLoading:i,isDisabled:n}=e;let s="Pay";return t.length>1&&0===this.completedTransactionsCount&&(s="Approve"),o`
      <wui-button
        size="lg"
        variant="accent-primary"
        ?loading=${i||this.isPaymentInProgress}
        ?disabled=${n||this.isPaymentInProgress}
        @click=${()=>{t.length>0?this.onSendTransactions():this.onTransfer()}}
      >
        ${s}
        ${i?null:o`<wui-icon
              name="arrowRight"
              color="inherit"
              size="sm"
              slot="iconRight"
            ></wui-icon>`}
      </wui-button>
    `}getPaymentAssetFromTokenBalances(){if(!this.namespace)return[];return(this.tokenBalances[this.namespace]??[]).map(e=>{try{return function(e){const t=b.getAllRequestedCaipNetworks().find(t=>t.caipNetworkId===e.chainId);let i=e.address;if(!t)throw new Error(`Target network not found for balance chainId "${e.chainId}"`);if(g.isLowerCaseMatch(e.symbol,t.nativeCurrency.symbol))i="native";else if(h.isCaipAddress(i)){const{address:e}=p.parseCaipAddress(i);i=e}else if(!i)throw new Error(`Balance address not found for balance symbol "${e.symbol}"`);return{network:t.caipNetworkId,asset:i,metadata:{name:e.name,symbol:e.symbol,decimals:Number(e.quantity.decimals),logoURI:e.iconUrl},amount:e.quantity.numeric}}(e)}catch(t){return null}}).filter(e=>Boolean(e)).filter(e=>{const{chainId:t}=p.parseCaipNetworkId(e.network),{chainId:i}=p.parseCaipNetworkId(this.paymentAsset.network);return!!g.isLowerCaseMatch(e.asset,this.paymentAsset.asset)||(!this.selectedExchange||!g.isLowerCaseMatch(t.toString(),i.toString()))})}onTokenBalancesChanged(e){this.tokenBalances=e;const[t]=this.getPaymentAssetFromTokenBalances();t&&ce.setSelectedPaymentAsset(t)}async onConnectOtherWallet(){await T.connect(),await E.open({view:"PayQuote"})}onAccountStateChanged(e){const{address:t}=this.caipAddress?p.parseCaipAddress(this.caipAddress):{};if(this.caipAddress=null==e?void 0:e.caipAddress,this.profileName=(null==e?void 0:e.profileName)??null,t){const{address:e}=this.caipAddress?p.parseCaipAddress(this.caipAddress):{};e?g.isLowerCaseMatch(e,t)||(this.resetAssetsState(),this.resetQuoteState(),this.fetchTokens()):E.close()}}onSelectedPaymentAssetChanged(e){this.isFetchingQuote||ce.setSelectedPaymentAsset(e)}async onTransfer(){var e,t,i;const n=M(this.quote);if(n){if(!g.isLowerCaseMatch(null==(e=this.selectedPaymentAsset)?void 0:e.asset,n.deposit.currency))throw new Error("Quote asset is not the same as the selected payment asset");const s=(null==(t=this.selectedPaymentAsset)?void 0:t.amount)??"0",a=y.formatNumber(n.deposit.amount,{decimals:(null==(i=this.selectedPaymentAsset)?void 0:i.metadata.decimals)??0}).toString();if(!y.bigNumber(s).gte(a))return void A.showError("Insufficient funds");if(this.quote&&this.selectedPaymentAsset&&this.caipAddress&&this.namespace){const{address:e}=p.parseCaipAddress(this.caipAddress);await ce.onTransfer({chainNamespace:this.namespace,fromAddress:e,toAddress:n.deposit.receiver,amount:a,paymentAsset:this.selectedPaymentAsset}),ce.setRequestId(n.requestId),S.push("PayLoading")}}}async onSendTransactions(){var e,t,i;const n=(null==(e=this.selectedPaymentAsset)?void 0:e.amount)??"0",s=y.formatNumber((null==(t=this.quote)?void 0:t.origin.amount)??0,{decimals:(null==(i=this.selectedPaymentAsset)?void 0:i.metadata.decimals)??0}).toString();if(!y.bigNumber(n).gte(s))return void A.showError("Insufficient funds");const a=G(this.quote),[r]=G(this.quote,this.completedTransactionsCount);if(r&&this.namespace){await ce.onSendTransaction({namespace:this.namespace,transactionStep:r}),this.completedTransactionsCount+=1;this.completedTransactionsCount===a.length&&(ce.setRequestId(r.requestId),S.push("PayLoading"))}}onPayWithExchange(){if(this.exchangeUrlForQuote){const e=h.returnOpenHref("","popupWindow","scrollbar=yes,width=480,height=720");if(!e)throw new Error("Could not create popup window");e.location.href=this.exchangeUrlForQuote;const t=M(this.quote);t&&ce.setRequestId(t.requestId),ce.initiatePayment(),S.push("PayLoading")}}resetAssetsState(){ce.setSelectedPaymentAsset(null)}resetQuoteState(){ce.resetQuoteState()}};De.styles=Ue,Le([C()],De.prototype,"profileName",void 0),Le([C()],De.prototype,"paymentAsset",void 0),Le([C()],De.prototype,"namespace",void 0),Le([C()],De.prototype,"caipAddress",void 0),Le([C()],De.prototype,"amount",void 0),Le([C()],De.prototype,"recipient",void 0),Le([C()],De.prototype,"activeConnectorIds",void 0),Le([C()],De.prototype,"selectedPaymentAsset",void 0),Le([C()],De.prototype,"selectedExchange",void 0),Le([C()],De.prototype,"isFetchingQuote",void 0),Le([C()],De.prototype,"quoteError",void 0),Le([C()],De.prototype,"quote",void 0),Le([C()],De.prototype,"isFetchingTokenBalances",void 0),Le([C()],De.prototype,"tokenBalances",void 0),Le([C()],De.prototype,"isPaymentInProgress",void 0),Le([C()],De.prototype,"exchangeUrlForQuote",void 0),Le([C()],De.prototype,"completedTransactionsCount",void 0),De=Le([s("w3m-pay-quote-view")],De);export{F as A,ce as P,ve as W,j as a,De as b,de as c};
