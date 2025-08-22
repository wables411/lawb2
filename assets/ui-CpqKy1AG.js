import{n as e,_ as t,$ as i,a0 as a,k as s,a1 as n,B as r,A as o,a2 as c,a3 as l,i as u,c as d,x as h,H as m,d as g,R as p,O as w,S as f,U as y,K as v}from"./index-DEYm9Gfl.js";import{W3mEmailOtpWidget as x}from"./email-C8STp8Y9.js";import"./wagmi-vendor-D3Lspqub.js";import"./react-vendor-ZyuiJZO_.js";import"./chess-vendor-JTxzwGi1.js";import"./ui-vendor-BgPmeekb.js";class b{constructor(e){this.expiration=e.expiration,this.getNonce=e.getNonce,this.getRequestId=e.getRequestId,this.domain=e.domain,this.uri=e.uri,this.statement=e.statement,this.resources=e.resources}async createMessage(e){var t;const i={accountAddress:e.accountAddress,chainId:e.chainId,version:this.version,domain:this.domain,uri:this.uri,statement:this.statement,resources:this.resources,nonce:await this.getNonce(e),requestId:await(null==(t=this.getRequestId)?void 0:t.call(this)),expirationTime:this.getExpirationTime(e),issuedAt:this.getIssuedAt(),notBefore:this.getNotBefore(e)},a={toString:()=>this.stringify(i)};return Object.assign(i,a)}getExpirationTime({notBefore:e}){if(void 0===this.expiration)return;const t=e?new Date(e).getTime():Date.now();return this.stringifyDate(new Date(t+this.expiration))}getNotBefore({notBefore:e}){return e?this.stringifyDate(new Date(e)):void 0}getIssuedAt(){return this.stringifyDate(new Date)}stringifyDate(e){return e.toISOString()}}class E extends b{constructor({clearChainIdNamespace:e,...t}){super(t),this.version="1",this.clearChainIdNamespace=e||!1}getNetworkName(i){const a=e.getAllRequestedCaipNetworks();return t.getNetworkNameByCaipNetworkId(a,i)}stringify(e){var t;const i=this.clearChainIdNamespace?e.chainId.split(":")[1]:e.chainId,a=this.getNetworkName(e.chainId);return[`${e.domain} wants you to sign in with your ${a} account:`,e.accountAddress,e.statement?`\n${e.statement}\n`:"",`URI: ${e.uri}`,`Version: ${e.version}`,`Chain ID: ${i}`,`Nonce: ${e.nonce}`,e.issuedAt&&`Issued At: ${e.issuedAt}`,e.expirationTime&&`Expiration Time: ${e.expirationTime}`,e.notBefore&&`Not Before: ${e.notBefore}`,e.requestId&&`Request ID: ${e.requestId}`,(null==(t=e.resources)?void 0:t.length)&&e.resources.reduce((e,t)=>`${e}\n- ${t}`,"Resources:")].filter(e=>"string"==typeof e).join("\n").trim()}}class S{constructor(e={}){this.otpUuid=null,this.listeners={sessionChanged:[]},this.localAuthStorageKey=e.localAuthStorageKey||i.SIWX_AUTH_TOKEN,this.localNonceStorageKey=e.localNonceStorageKey||i.SIWX_NONCE_TOKEN,this.required=e.required??!0,this.messenger=new E({domain:"undefined"==typeof document?"Unknown Domain":document.location.host,uri:"undefined"==typeof document?"Unknown URI":document.location.href,getNonce:this.getNonce.bind(this),clearChainIdNamespace:!1})}async createMessage(e){return this.messenger.createMessage(e)}async addSession(e){const t=await this.request({method:"POST",key:"authenticate",body:{data:e.data,message:e.message,signature:e.signature,clientId:this.getClientId(),walletInfo:this.getWalletInfo()},headers:["nonce","otp"]});this.setStorageToken(t.token,this.localAuthStorageKey),this.emit("sessionChanged",e),this.setAppKitAccountUser(function(e){const t=e.split(".");if(3!==t.length)throw new Error("Invalid token");const i=t[1];if("string"!=typeof i)throw new Error("Invalid token");const a=i.replace(/-/gu,"+").replace(/_/gu,"/"),s=a.padEnd(a.length+(4-a.length%4)%4,"=");return JSON.parse(atob(s))}(t.token)),this.otpUuid=null}async getSessions(e,t){try{if(!this.getStorageToken(this.localAuthStorageKey))return[];const i=await this.request({method:"GET",key:"me",query:{},headers:["auth"]});if(!i)return[];const a=i.address.toLowerCase()===t.toLowerCase(),s=i.caip2Network===e;if(!a||!s)return[];const n={data:{accountAddress:i.address,chainId:i.caip2Network},message:"",signature:""};return this.emit("sessionChanged",n),this.setAppKitAccountUser(i),[n]}catch{return[]}}async revokeSession(e,t){return Promise.resolve(this.clearStorageTokens())}async setSessions(e){if(0===e.length)this.clearStorageTokens();else{const t=e.find(e=>{var t;return e.data.chainId===(null==(t=a())?void 0:t.caipNetworkId)})||e[0];await this.addSession(t)}}getRequired(){return this.required}async getSessionAccount(){if(!this.getStorageToken(this.localAuthStorageKey))throw new Error("Not authenticated");return this.request({method:"GET",key:"me",body:void 0,query:{includeAppKitAccount:!0},headers:["auth"]})}async setSessionAccountMetadata(e=null){if(!this.getStorageToken(this.localAuthStorageKey))throw new Error("Not authenticated");return this.request({method:"PUT",key:"account-metadata",body:{metadata:e},headers:["auth"]})}on(e,t){return this.listeners[e].push(t),()=>{this.listeners[e]=this.listeners[e].filter(e=>e!==t)}}removeAllListeners(){Object.keys(this.listeners).forEach(e=>{this.listeners[e]=[]})}async requestEmailOtp({email:e,account:t}){const i=await this.request({method:"POST",key:"otp",body:{email:e,account:t}});return this.otpUuid=i.uuid,this.messenger.resources=[`email:${e}`],i}confirmEmailOtp({code:e}){return this.request({method:"PUT",key:"otp",body:{code:e},headers:["otp"]})}async request({method:e,key:t,query:i,body:a,headers:n}){var r;const{projectId:o,st:c,sv:l}=this.getSDKProperties(),u=new URL(`${s.W3M_API_URL}/auth/v1/${String(t)}`);u.searchParams.set("projectId",o),u.searchParams.set("st",c),u.searchParams.set("sv",l),i&&Object.entries(i).forEach(([e,t])=>u.searchParams.set(e,String(t)));const d=await fetch(u,{method:e,body:a?JSON.stringify(a):void 0,headers:Array.isArray(n)?n.reduce((e,t)=>{switch(t){case"nonce":e["x-nonce-jwt"]=`Bearer ${this.getStorageToken(this.localNonceStorageKey)}`;break;case"auth":e.Authorization=`Bearer ${this.getStorageToken(this.localAuthStorageKey)}`;break;case"otp":this.otpUuid&&(e["x-otp"]=this.otpUuid)}return e},{}):void 0});if(!d.ok)throw new Error(await d.text());return(null==(r=d.headers.get("content-type"))?void 0:r.includes("application/json"))?d.json():null}getStorageToken(e){return n.getItem(e)}setStorageToken(e,t){n.setItem(t,e)}clearStorageTokens(){this.otpUuid=null,n.removeItem(this.localAuthStorageKey),n.removeItem(this.localNonceStorageKey),this.emit("sessionChanged",void 0)}async getNonce(){const{nonce:e,token:t}=await this.request({method:"GET",key:"nonce"});return this.setStorageToken(t,this.localNonceStorageKey),e}getClientId(){return r.state.clientId}getWalletInfo(){const{connectedWalletInfo:e}=o.state;if(!e)return;if("social"in e){return{type:"social",social:e.social,identifier:e.identifier}}const{name:t,icon:i}=e;let a="unknown";switch(e.type){case l.CONNECTOR_TYPE_EXTERNAL:case l.CONNECTOR_TYPE_INJECTED:case l.CONNECTOR_TYPE_ANNOUNCED:a="extension";break;case l.CONNECTOR_TYPE_WALLET_CONNECT:a="walletconnect";break;default:a="unknown"}return{type:a,name:t,icon:i}}getSDKProperties(){return c._getSdkProperties()}emit(e,t){this.listeners[e].forEach(e=>e(t))}setAppKitAccountUser(t){const{email:i}=t;i&&Object.values(s.CHAIN).forEach(t=>{e.setAccountProp("user",{email:i},t)})}}const k=u`
  .hero {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--wui-spacing-3xs);

    transition-property: margin, height;
    transition-duration: var(--wui-duration-md);
    transition-timing-function: var(--wui-ease-out-power-1);
    margin-top: -100px;

    &[data-state='loading'] {
      margin-top: 0px;
    }

    position: relative;
    &:after {
      content: '';
      position: absolute;
      bottom: 0;
      height: 252px;
      width: 360px;
      background: radial-gradient(
        96.11% 53.95% at 50% 51.28%,
        transparent 0%,
        color-mix(in srgb, var(--wui-color-bg-100) 5%, transparent) 49%,
        color-mix(in srgb, var(--wui-color-bg-100) 65%, transparent) 99.43%
      );
    }
  }

  .hero-main-icon {
    width: 176px;
    transition-property: background-color;
    transition-duration: var(--wui-duration-lg);
    transition-timing-function: var(--wui-ease-out-power-1);

    &[data-state='loading'] {
      width: 56px;
    }
  }

  .hero-row {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    gap: var(--wui-spacing-3xs);
    flex-wrap: nowrap;
    min-width: fit-content;

    &:nth-child(1) {
      transform: translateX(-30px);
    }

    &:nth-child(2) {
      transform: translateX(30px);
    }

    &:nth-child(4) {
      transform: translateX(40px);
    }

    transition-property: height;
    transition-duration: var(--wui-duration-md);
    transition-timing-function: var(--wui-ease-out-power-1);
    height: 68px;

    &[data-state='loading'] {
      height: 0px;
    }
  }

  .hero-row-icon {
    opacity: 0.1;
    transition-property: opacity;
    transition-duration: var(--wui-duration-md);
    transition-timing-function: var(--wui-ease-out-power-1);

    &[data-state='loading'] {
      opacity: 0;
    }
  }

  .email-sufixes {
    display: flex;
    flex-direction: row;
    gap: var(--wui-spacing-3xs);
    overflow-x: auto;
    max-width: 100%;
    margin-top: var(--wui-spacing-s);
    margin-bottom: calc(-1 * var(--wui-spacing-m));
    padding-bottom: var(--wui-spacing-m);
    margin-left: calc(-1 * var(--wui-spacing-m));
    margin-right: calc(-1 * var(--wui-spacing-m));
    padding-left: var(--wui-spacing-m);
    padding-right: var(--wui-spacing-m);

    &::-webkit-scrollbar {
      display: none;
    }
  }

  .recent-emails {
    display: flex;
    flex-direction: column;
    padding: var(--wui-spacing-s) 0;
    border-top: 1px solid var(--wui-color-gray-glass-005);
    border-bottom: 1px solid var(--wui-color-gray-glass-005);
  }

  .recent-emails-heading {
    margin-bottom: var(--wui-spacing-s);
  }

  .recent-emails-list-item {
    --wui-color-gray-glass-002: transparent;
  }
`;var $=function(e,t,i,a){var s,n=arguments.length,r=n<3?t:null===a?a=Object.getOwnPropertyDescriptor(t,i):a;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)r=Reflect.decorate(e,t,i,a);else for(var o=e.length-1;o>=0;o--)(s=e[o])&&(r=(n<3?s(r):n>3?s(t,i,r):s(t,i))||r);return n>3&&r&&Object.defineProperty(t,i,r),r};const I=["@gmail.com","@outlook.com","@yahoo.com","@hotmail.com","@aol.com","@icloud.com","@zoho.com"];let N=class extends d{constructor(){super(...arguments),this.email=""}render(){const e=I.filter(this.filter.bind(this)).map(this.item.bind(this));return 0===e.length?null:h`<div class="email-sufixes">${e}</div>`}filter(e){if(!this.email)return!1;const t=this.email.split("@");if(t.length<2)return!0;const i=t.pop();return e.includes(i)&&e!==`@${i}`}item(e){return h`<wui-button variant="neutral" size="sm" @click=${()=>{const t=this.email.split("@");t.length>1&&t.pop();const i=t[0]+e;this.dispatchEvent(new CustomEvent("change",{detail:i,bubbles:!0,composed:!0}))}}
      >${e}</wui-button
    >`}};N.styles=[k],$([m()],N.prototype,"email",void 0),N=$([g("w3m-email-suffixes-widget")],N);var A=function(e,t,i,a){var s,n=arguments.length,r=n<3?t:null===a?a=Object.getOwnPropertyDescriptor(t,i):a;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)r=Reflect.decorate(e,t,i,a);else for(var o=e.length-1;o>=0;o--)(s=e[o])&&(r=(n<3?s(r):n>3?s(t,i,r):s(t,i))||r);return n>3&&r&&Object.defineProperty(t,i,r),r};let C=class extends d{constructor(){super(...arguments),this.emails=[]}render(){return 0===this.emails.length?null:h`<div class="recent-emails">
      <wui-text variant="micro-600" color="fg-200" class="recent-emails-heading"
        >Recently used emails</wui-text
      >
      ${this.emails.map(this.item.bind(this))}
    </div>`}item(e){return h`<wui-list-item
      @click=${()=>{this.dispatchEvent(new CustomEvent("select",{detail:e,bubbles:!0,composed:!0}))}}
      ?chevron=${!0}
      icon="mail"
      iconVariant="overlay"
      class="recent-emails-list-item"
    >
      <wui-text variant="paragraph-500" color="fg-100">${e}</wui-text>
    </wui-list-item>`}};C.styles=[k],A([m()],C.prototype,"emails",void 0),C=A([g("w3m-recent-emails-widget")],C);var O=function(e,t,i,a){var s,n=arguments.length,r=n<3?t:null===a?a=Object.getOwnPropertyDescriptor(t,i):a;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)r=Reflect.decorate(e,t,i,a);else for(var o=e.length-1;o>=0;o--)(s=e[o])&&(r=(n<3?s(r):n>3?s(t,i,r):s(t,i))||r);return n>3&&r&&Object.defineProperty(t,i,r),r};let R=class extends d{constructor(){var t,i,a,s,n,r,o;super(...arguments),this.email=(null==(t=p.state.data)?void 0:t.email)??(null==(a=null==(i=e.getAccountData())?void 0:i.user)?void 0:a.email)??"",this.address=(null==(s=e.getAccountData())?void 0:s.address)??"",this.loading=!1,this.appName=(null==(n=w.state.metadata)?void 0:n.name)??"AppKit",this.siwx=w.state.siwx,this.isRequired=Array.isArray(null==(r=w.state.remoteFeatures)?void 0:r.emailCapture)&&(null==(o=w.state.remoteFeatures)?void 0:o.emailCapture.includes("required")),this.recentEmails=this.getRecentEmails()}connectedCallback(){this.siwx&&this.siwx instanceof S||f.showError("ReownAuthentication is not initialized."),super.connectedCallback()}firstUpdated(){this.loading=!1,this.recentEmails=this.getRecentEmails(),this.email&&this.onSubmit()}render(){return h`
      <wui-flex flexDirection="column" .padding=${["3xs","m","m","m"]} gap="l">
        ${this.hero()} ${this.paragraph()} ${this.emailInput()} ${this.recentEmailsWidget()}
        ${this.footerActions()}
      </wui-flex>
    `}hero(){return h`
      <div class="hero" data-state=${this.loading?"loading":"default"}>
        ${this.heroRow(["id","mail","wallet","x","solana","qrCode"])}
        ${this.heroRow(["mail","farcaster","wallet","discord","mobile","qrCode"])}
        <div class="hero-row">
          ${this.heroIcon("github")} ${this.heroIcon("bank")}
          <wui-icon-box
            size="xl"
            iconSize="xxl"
            iconColor=${this.loading?"fg-100":"accent-100"}
            backgroundColor=${this.loading?"fg-100":"accent-100"}
            icon=${this.loading?"id":"user"}
            isOpaque
            class="hero-main-icon"
            data-state=${this.loading?"loading":"default"}
          >
          </wui-icon-box>
          ${this.heroIcon("id")} ${this.heroIcon("card")}
        </div>
        ${this.heroRow(["google","id","github","verify","apple","mobile"])}
      </div>
    `}heroRow(e){return h`
      <div class="hero-row" data-state=${this.loading?"loading":"default"}>
        ${e.map(this.heroIcon.bind(this))}
      </div>
    `}heroIcon(e){return h`
      <wui-icon-box
        size="xl"
        iconSize="xxl"
        iconColor="fg-100"
        backgroundColor="fg-100"
        icon=${e}
        data-state=${this.loading?"loading":"default"}
        isOpaque
        class="hero-row-icon"
      >
      </wui-icon-box>
    `}paragraph(){return this.loading?h`
        <wui-text variant="paragraph-400" color="fg-200" align="center"
          >We are verifying your account with email
          <wui-text variant="paragraph-600" color="accent-100">${this.email}</wui-text> and address
          <wui-text variant="paragraph-600" color="fg-100">
            ${y.getTruncateString({string:this.address,charsEnd:4,charsStart:4,truncate:"middle"})} </wui-text
          >, please wait a moment.</wui-text
        >
      `:this.isRequired?h`
        <wui-text variant="paragraph-600" color="fg-100" align="center">
          ${this.appName} requires your email for authentication.
        </wui-text>
      `:h`
      <wui-flex flexDirection="column" gap="xs" alignItems="center">
        <wui-text variant="paragraph-600" color="fg-100" align="center" size>
          ${this.appName} would like to collect your email.
        </wui-text>

        <wui-text variant="small-400" color="fg-200" align="center">
          Don't worry, it's optional&mdash;you can skip this step.
        </wui-text>
      </wui-flex>
    `}emailInput(){if(this.loading)return null;const e=e=>{this.email=e.detail};return h`
      <wui-flex flexDirection="column">
        <wui-email-input
          .value=${this.email}
          .disabled=${this.loading}
          @inputChange=${e}
          @keydown=${e=>{"Enter"===e.key&&this.onSubmit()}}
        ></wui-email-input>

        <w3m-email-suffixes-widget
          .email=${this.email}
          @change=${e}
        ></w3m-email-suffixes-widget>
      </wui-flex>
    `}recentEmailsWidget(){if(0===this.recentEmails.length||this.loading)return null;return h`
      <w3m-recent-emails-widget
        .emails=${this.recentEmails}
        @select=${e=>{this.email=e.detail,this.onSubmit()}}
      ></w3m-recent-emails-widget>
    `}footerActions(){return h`
      <wui-flex flexDirection="row" fullWidth gap="s">
        ${this.isRequired?null:h`<wui-button
              size="lg"
              variant="neutral"
              fullWidth
              .disabled=${this.loading}
              @click=${this.onSkip.bind(this)}
              >Skip this step</wui-button
            >`}

        <wui-button
          size="lg"
          variant="main"
          type="submit"
          fullWidth
          .disabled=${!this.email||!this.isValidEmail(this.email)}
          .loading=${this.loading}
          @click=${this.onSubmit.bind(this)}
        >
          Continue
        </wui-button>
      </wui-flex>
    `}async onSubmit(){const t=e.getActiveCaipAddress();if(!t)throw new Error("Account is not connected.");if(this.isValidEmail(this.email))try{this.loading=!0;const e=await this.siwx.requestEmailOtp({email:this.email,account:t});this.pushRecentEmail(this.email),null===e.uuid?p.replace("SIWXSignMessage"):p.replace("DataCaptureOtpConfirm",{email:this.email})}catch(i){f.showError("Failed to send email OTP"),this.loading=!1}else f.showError("Please provide a valid email.")}onSkip(){p.replace("SIWXSignMessage")}getRecentEmails(){const e=n.getItem(i.RECENT_EMAILS);return(e?e.split(","):[]).filter(this.isValidEmail.bind(this)).slice(0,3)}pushRecentEmail(e){const t=this.getRecentEmails(),a=Array.from(new Set([e,...t])).slice(0,3);n.setItem(i.RECENT_EMAILS,a.join(","))}isValidEmail(e){return/^\S+@\S+\.\S+$/u.test(e)}};R.styles=[k],O([v()],R.prototype,"email",void 0),O([v()],R.prototype,"address",void 0),O([v()],R.prototype,"loading",void 0),O([v()],R.prototype,"appName",void 0),O([v()],R.prototype,"siwx",void 0),O([v()],R.prototype,"isRequired",void 0),O([v()],R.prototype,"recentEmails",void 0),R=O([g("w3m-data-capture-view")],R);var T=function(e,t,i,a){var s,n=arguments.length,r=n<3?t:null===a?a=Object.getOwnPropertyDescriptor(t,i):a;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)r=Reflect.decorate(e,t,i,a);else for(var o=e.length-1;o>=0;o--)(s=e[o])&&(r=(n<3?s(r):n>3?s(t,i,r):s(t,i))||r);return n>3&&r&&Object.defineProperty(t,i,r),r};let q=class extends x{constructor(){super(...arguments),this.siwx=w.state.siwx,this.onOtpSubmit=async e=>{await this.siwx.confirmEmailOtp({code:e}),p.replace("SIWXSignMessage")},this.onOtpResend=async t=>{const i=e.getAccountData();if(!(null==i?void 0:i.caipAddress))throw new Error("No account data found");await this.siwx.requestEmailOtp({email:t,account:i.caipAddress})}}connectedCallback(){this.siwx&&this.siwx instanceof S||f.showError("ReownAuthentication is not initialized."),super.connectedCallback()}shouldSubmitOnOtpChange(){return this.otp.length===x.OTP_LENGTH}};T([v()],q.prototype,"siwx",void 0),q=T([g("w3m-data-capture-otp-confirm-view")],q);export{q as W3mDataCaptureOtpConfirmView,R as W3mDataCaptureView,N as W3mEmailSuffixesWidget,C as W3mRecentEmailsWidget};
