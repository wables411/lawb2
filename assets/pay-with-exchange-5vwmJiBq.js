import{Q as e,V as t,p as n,E as s,A as a,f as r,S as o,l as i,B as c,s as u,o as m,q as p,x as d,e as h,y as l,L as g,R as y,O as w,v as x}from"./index-rJTEhX-0.js";import"./wagmi-vendor-O52zNBec.js";import"./react-vendor-ZyuiJZO_.js";import"./chess-vendor-JTxzwGi1.js";import"./ui-vendor-BgPmeekb.js";const f={eip155:{native:{assetNamespace:"slip44",assetReference:"60"},defaultTokenNamespace:"erc20"},solana:{native:{assetNamespace:"slip44",assetReference:"501"},defaultTokenNamespace:"token"}};class P extends Error{}async function I(e,n){const s=`https://rpc.walletconnect.org/v1/json-rpc?projectId=${t.getSnapshot().projectId}&source=fund-wallet`,{sdkType:a,sdkVersion:r,projectId:o}=t.getSnapshot(),i={jsonrpc:"2.0",id:1,method:e,params:{...n||{},st:a,sv:r,projectId:o}},c=await fetch(s,{method:"POST",body:JSON.stringify(i),headers:{"Content-Type":"application/json"}}),u=await c.json();if(u.error)throw new P(u.error.message);return u}function v(t,n){const{chainNamespace:s,chainId:a}=e.parseCaipNetworkId(t),r=f[s];if(!r)throw new Error(`Unsupported chain namespace for CAIP-19 formatting: ${s}`);let o=r.native.assetNamespace,i=r.native.assetReference;"native"!==n&&(o=r.defaultTokenNamespace,i=n);return`${`${s}:${a}`}/${o}:${i}`}const k={paymentAsset:{network:"eip155:1",asset:"native",metadata:{name:"Ethereum",symbol:"ETH",decimals:0}},amount:0,tokenAmount:0,tokenPrice:null,priceLoading:!1,error:null,exchanges:[],isLoading:!1,currentPayment:void 0,isPaymentInProgress:!1,paymentId:""},b=n(k),E={state:b,subscribe:e=>m(b,()=>e(b)),subscribeKey:(e,t)=>u(b,e,t),resetState(){Object.assign(b,{...k})},async fetchTokenPrice(){var e,t;b.priceLoading=!0;const n=i(),s=await c.fetchTokenPrice({addresses:[n]});b.tokenPrice=(null==(t=null==(e=s.fungibles)?void 0:e[0])?void 0:t.price)||null,b.priceLoading=!1},getTokenAmount(){if(!b.tokenPrice)throw new Error("Cannot get token price");const e=new Intl.NumberFormat("en-US",{minimumFractionDigits:0,maximumFractionDigits:4}).format(b.amount/b.tokenPrice);return Number(e)},setAmount(e){b.amount=e,b.tokenPrice&&(b.tokenAmount=this.getTokenAmount())},setPaymentAsset(e){b.paymentAsset=e},async fetchExchanges(){try{b.isLoading=!0;const e=await async function(e){return(await I("reown_getExchanges",e)).result}({page:0,asset:v(b.paymentAsset.network,b.paymentAsset.asset),amount:b.amount.toString()});b.exchanges=e.exchanges.slice(0,2)}catch(e){throw o.showError("Unable to get exchanges"),new Error("Unable to get exchanges")}finally{b.isLoading=!1}},async getPayUrl(e,t){try{const n=Number(t.amount),a=await async function(e){return(await I("reown_getExchangePayUrl",e)).result}({exchangeId:e,asset:v(t.network,t.asset),amount:n.toString(),recipient:`${t.network}:${t.recipient}`});return s.sendEvent({type:"track",event:"PAY_EXCHANGE_SELECTED",properties:{exchange:{id:e},configuration:{network:t.network,asset:t.asset,recipient:t.recipient,amount:n},currentPayment:{type:"exchange",exchangeId:e},source:"fund-from-exchange",headless:!1}}),a}catch(n){if(n instanceof Error&&n.message.includes("is not supported"))throw new Error("Asset not supported");throw new Error(n.message)}},async handlePayWithExchange(e){try{if(!a.state.address)throw new Error("No account connected");b.isPaymentInProgress=!0,b.paymentId=crypto.randomUUID(),b.currentPayment={type:"exchange",exchangeId:e};const{network:t,asset:n}=b.paymentAsset,s={network:t,asset:n,amount:b.tokenAmount,recipient:a.state.address},o=await this.getPayUrl(e,s);if(!o)throw new Error("Unable to initiate payment");b.currentPayment.sessionId=o.sessionId,b.currentPayment.status="IN_PROGRESS",b.currentPayment.exchangeId=e,r.openHref(o.url,"_blank","popup=yes,width=480,height=720,noopener,noreferrer")}catch(t){b.error="Unable to initiate payment",o.showError(b.error)}},async waitUntilComplete({exchangeId:e,sessionId:t,paymentId:n,retries:s=20}){const a=await this.getBuyStatus(e,t,n);if("SUCCESS"===a.status||"FAILED"===a.status)return a;if(0===s)throw new Error("Unable to get deposit status");return await new Promise(e=>{setTimeout(e,5e3)}),this.waitUntilComplete({exchangeId:e,sessionId:t,paymentId:n,retries:s-1})},async getBuyStatus(e,t,n){var r,o;try{if(!b.currentPayment)throw new Error("No current payment");const i=await async function(e){return(await I("reown_getExchangeBuyStatus",e)).result}({sessionId:t,exchangeId:e});return b.currentPayment.status=i.status,"SUCCESS"!==i.status&&"FAILED"!==i.status||(b.currentPayment.result=i.txHash,b.isPaymentInProgress=!1,s.sendEvent({type:"track",event:"SUCCESS"===i.status?"PAY_SUCCESS":"PAY_ERROR",properties:{source:"fund-from-exchange",paymentId:n,configuration:{network:b.paymentAsset.network,asset:b.paymentAsset.asset,recipient:a.state.address||"",amount:b.amount},currentPayment:{type:"exchange",exchangeId:null==(r=b.currentPayment)?void 0:r.exchangeId,sessionId:null==(o=b.currentPayment)?void 0:o.sessionId,result:i.txHash}}})),i}catch(i){return{status:"UNKNOWN",txHash:""}}},reset(){b.currentPayment=void 0,b.isPaymentInProgress=!1,b.paymentId="",b.paymentAsset={network:"eip155:1",asset:"native",metadata:{name:"Ethereum",symbol:"ETH",decimals:0}},b.amount=0,b.tokenAmount=0,b.tokenPrice=null,b.priceLoading=!1,b.error=null,b.exchanges=[],b.isLoading=!1}},A=p`
  .amount-input-container {
    border-radius: var(--wui-border-radius-m);
    border-top-right-radius: 0;
    border-top-left-radius: 0;
    border-bottom: 1px solid var(--wui-color-gray-glass-010);
    background-color: var(--wui-color-bg-100);
  }

  .container {
    background-color: var(--wui-color-bg-125);
  }
`;var S=function(e,t,n,s){var a,r=arguments.length,o=r<3?t:null===s?s=Object.getOwnPropertyDescriptor(t,n):s;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)o=Reflect.decorate(e,t,n,s);else for(var i=e.length-1;i>=0;i--)(a=e[i])&&(o=(r<3?a(o):r>3?a(t,n,o):a(t,n))||o);return r>3&&o&&Object.defineProperty(t,n,o),o};const $=[10,50,100];let C=class extends d{constructor(){super(),this.unsubscribe=[],this.network=h.state.activeCaipNetwork,this.exchanges=E.state.exchanges,this.isLoading=E.state.isLoading,this.amount=E.state.amount,this.tokenAmount=E.state.tokenAmount,this.priceLoading=E.state.priceLoading,this.isPaymentInProgress=E.state.isPaymentInProgress,this.currentPayment=E.state.currentPayment,this.paymentId=E.state.paymentId,this.unsubscribe.push(E.subscribe(e=>{var t,n;this.exchanges=e.exchanges,this.isLoading=e.isLoading,this.amount=e.amount,this.tokenAmount=e.tokenAmount,this.priceLoading=e.priceLoading,this.paymentId=e.paymentId,this.isPaymentInProgress=e.isPaymentInProgress,this.currentPayment=e.currentPayment;e.isPaymentInProgress&&(null==(t=e.currentPayment)?void 0:t.exchangeId)&&(null==(n=e.currentPayment)?void 0:n.sessionId)&&e.paymentId&&this.handlePaymentInProgress()}))}disconnectedCallback(){this.unsubscribe.forEach(e=>e()),E.reset()}firstUpdated(){E.fetchExchanges(),E.fetchTokenPrice()}render(){return l`
      <wui-flex flexDirection="column" gap="xs" class="container">
        ${this.amountInputTemplate()} ${this.exchangesTemplate()}
      </wui-flex>
    `}exchangesTemplate(){return l`
      <wui-flex
        flexDirection="column"
        gap="xs"
        .padding=${["xs","s","s","s"]}
        class="exchanges-container"
      >
        ${this.exchanges.map(e=>l`<wui-list-item
              @click=${()=>this.onExchangeClick(e)}
              chevron
              variant="image"
              imageSrc=${e.imageUrl}
              ?loading=${this.isLoading}
              ?disabled=${!this.amount}
            >
              <wui-text variant="paragraph-500" color="fg-200">
                Deposit from ${e.name}
              </wui-text>
            </wui-list-item>`)}
      </wui-flex>
    `}amountInputTemplate(){var e;return l`
      <wui-flex flexDirection="column" gap="s" .padding=${["0","s","s","s"]} class="amount-input-container">
        <wui-flex justifyContent="space-between">
          <wui-text variant="paragraph-500" color="fg-200">Asset</wui-text>
          <wui-chip-button
            data-testid="deposit-from-exchange-asset-button"
            text=${(null==(e=this.network)?void 0:e.nativeCurrency.symbol)||""}
            imageSrc=${g.getNetworkImage(this.network)}
            size="sm"
            variant="gray"
            icon=${null}
          ></wui-chip-button>
        </wui-flex>
        <wui-flex flexDirection="column" alignItems="center" justifyContent="center">
          <wui-flex alignItems="center" gap="4xs">
            <wui-text variant="2xl-500" color="fg-200">${this.amount}</wui-text>
            <wui-text variant="paragraph-500" color="fg-200">USD</wui-text>
          </wui-flex>
          ${this.tokenAmountTemplate()}
          </wui-flex>
          <wui-flex justifyContent="space-between" gap="xs">
            ${$.map(e=>l`<wui-button @click=${()=>this.onPresetAmountClick(e)} variant=${this.amount===e?"accent":"shade"} size="sm" fullWidth>$${e}</wui-button>`)}
          </wui-flex>
        </wui-flex>
      </wui-flex>
    `}tokenAmountTemplate(){var e;return this.priceLoading?l`<wui-shimmer
        width="65px"
        height="20px"
        borderRadius="xxs"
        variant="light"
      ></wui-shimmer>`:l`
      <wui-text variant="paragraph-500" color="fg-200">
        ${this.tokenAmount} ${null==(e=this.network)?void 0:e.nativeCurrency.symbol}
      </wui-text>
    `}async onExchangeClick(e){this.amount&&await E.handlePayWithExchange(e.id)}handlePaymentInProgress(){var e,t;this.isPaymentInProgress&&(null==(e=this.currentPayment)?void 0:e.exchangeId)&&(null==(t=this.currentPayment)?void 0:t.sessionId)&&this.paymentId&&(o.showLoading("Deposit in progress..."),y.replace("Account"),E.waitUntilComplete({exchangeId:this.currentPayment.exchangeId,sessionId:this.currentPayment.sessionId,paymentId:this.paymentId}).then(e=>{"SUCCESS"===e.status?o.showSuccess("Deposit completed"):"FAILED"===e.status&&o.showError("Deposit failed")}))}onPresetAmountClick(e){E.setAmount(e)}};C.styles=A,S([w()],C.prototype,"network",void 0),S([w()],C.prototype,"exchanges",void 0),S([w()],C.prototype,"isLoading",void 0),S([w()],C.prototype,"amount",void 0),S([w()],C.prototype,"tokenAmount",void 0),S([w()],C.prototype,"priceLoading",void 0),S([w()],C.prototype,"isPaymentInProgress",void 0),S([w()],C.prototype,"currentPayment",void 0),S([w()],C.prototype,"paymentId",void 0),C=S([x("w3m-deposit-from-exchange-view")],C);export{C as W3mDepositFromExchangeView};
