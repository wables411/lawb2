import{i as e,F as t,G as i,H as n,d as o,c as r,x as a,K as s,U as l,ax as c,R as u,y as d,o as h,S as p,n as m,C as w,O as f,E as v,Z as g,a5 as b,a7 as y,a3 as E,k as x}from"./index-D-RHGdN-.js";import"./wagmi-vendor-D-kpDhCQ.js";import"./react-vendor-ZyuiJZO_.js";import"./chess-vendor-JTxzwGi1.js";import"./ui-vendor-BgPmeekb.js";const I=e`
  :host {
    position: relative;
    display: inline-block;
  }

  input {
    width: 50px;
    height: 50px;
    background: var(--wui-color-gray-glass-010);
    border-radius: var(--wui-border-radius-xs);
    border: 1px solid var(--wui-color-gray-glass-005);
    font-family: var(--wui-font-family);
    font-size: var(--wui-font-size-large);
    font-weight: var(--wui-font-weight-regular);
    letter-spacing: var(--wui-letter-spacing-large);
    text-align: center;
    color: var(--wui-color-fg-100);
    caret-color: var(--wui-color-accent-100);
    transition:
      background-color var(--wui-ease-inout-power-1) var(--wui-duration-md),
      border-color var(--wui-ease-inout-power-1) var(--wui-duration-md),
      box-shadow var(--wui-ease-inout-power-1) var(--wui-duration-md);
    will-change: background-color, border-color, box-shadow;
    box-sizing: border-box;
    -webkit-appearance: none;
    -moz-appearance: textfield;
    padding: 0px;
  }

  input::-webkit-outer-spin-button,
  input::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  input[type='number'] {
    -moz-appearance: textfield;
  }

  input:disabled {
    cursor: not-allowed;
    border: 1px solid var(--wui-color-gray-glass-010);
    background: var(--wui-color-gray-glass-005);
  }

  input:focus:enabled {
    background-color: var(--wui-color-gray-glass-015);
    border: 1px solid var(--wui-color-accent-100);
    -webkit-box-shadow: 0px 0px 0px 4px var(--wui-box-shadow-blue);
    -moz-box-shadow: 0px 0px 0px 4px var(--wui-box-shadow-blue);
    box-shadow: 0px 0px 0px 4px var(--wui-box-shadow-blue);
  }

  @media (hover: hover) and (pointer: fine) {
    input:hover:enabled {
      background-color: var(--wui-color-gray-glass-015);
    }
  }
`;var O=function(e,t,i,n){var o,r=arguments.length,a=r<3?t:null===n?n=Object.getOwnPropertyDescriptor(t,i):n;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)a=Reflect.decorate(e,t,i,n);else for(var s=e.length-1;s>=0;s--)(o=e[s])&&(a=(r<3?o(a):r>3?o(t,i,a):o(t,i))||a);return r>3&&a&&Object.defineProperty(t,i,a),a};let C=class extends r{constructor(){super(...arguments),this.disabled=!1,this.value=""}render(){return a`<input
      type="number"
      maxlength="1"
      inputmode="numeric"
      autofocus
      ?disabled=${this.disabled}
      value=${this.value}
    /> `}};C.styles=[t,i,I],O([n({type:Boolean})],C.prototype,"disabled",void 0),O([n({type:String})],C.prototype,"value",void 0),C=O([o("wui-input-numeric")],C);const R=e`
  :host {
    position: relative;
    display: block;
  }
`;var T=function(e,t,i,n){var o,r=arguments.length,a=r<3?t:null===n?n=Object.getOwnPropertyDescriptor(t,i):n;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)a=Reflect.decorate(e,t,i,n);else for(var s=e.length-1;s>=0;s--)(o=e[s])&&(a=(r<3?o(a):r>3?o(t,i,a):o(t,i))||a);return r>3&&a&&Object.defineProperty(t,i,a),a};let k=class extends r{constructor(){super(...arguments),this.length=6,this.otp="",this.values=Array.from({length:this.length}).map(()=>""),this.numerics=[],this.shouldInputBeEnabled=e=>this.values.slice(0,e).every(e=>""!==e),this.handleKeyDown=(e,t)=>{const i=e.target,n=this.getInputElement(i);if(!n)return;["ArrowLeft","ArrowRight","Shift","Delete"].includes(e.key)&&e.preventDefault();const o=n.selectionStart;switch(e.key){case"ArrowLeft":o&&n.setSelectionRange(o+1,o+1),this.focusInputField("prev",t);break;case"ArrowRight":case"Shift":this.focusInputField("next",t);break;case"Delete":case"Backspace":""===n.value?this.focusInputField("prev",t):this.updateInput(n,t,"")}},this.focusInputField=(e,t)=>{if("next"===e){const e=t+1;if(!this.shouldInputBeEnabled(e))return;const i=this.numerics[e<this.length?e:t],n=i?this.getInputElement(i):void 0;n&&(n.disabled=!1,n.focus())}if("prev"===e){const e=t-1,i=this.numerics[e>-1?e:t],n=i?this.getInputElement(i):void 0;n&&n.focus()}}}firstUpdated(){var e,t;this.otp&&(this.values=this.otp.split(""));const i=null==(e=this.shadowRoot)?void 0:e.querySelectorAll("wui-input-numeric");i&&(this.numerics=Array.from(i)),null==(t=this.numerics[0])||t.focus()}render(){return a`
      <wui-flex gap="xxs" data-testid="wui-otp-input">
        ${Array.from({length:this.length}).map((e,t)=>a`
            <wui-input-numeric
              @input=${e=>this.handleInput(e,t)}
              @click=${e=>this.selectInput(e)}
              @keydown=${e=>this.handleKeyDown(e,t)}
              .disabled=${!this.shouldInputBeEnabled(t)}
              .value=${this.values[t]||""}
            >
            </wui-input-numeric>
          `)}
      </wui-flex>
    `}updateInput(e,t,i){const n=this.numerics[t],o=e||(n?this.getInputElement(n):void 0);o&&(o.value=i,this.values=this.values.map((e,n)=>n===t?i:e))}selectInput(e){const t=e.target;if(t){const e=this.getInputElement(t);null==e||e.select()}}handleInput(e,t){const i=e.target,n=this.getInputElement(i);if(n){const i=n.value;if("insertFromPaste"===e.inputType)this.handlePaste(n,i,t);else{l.isNumber(i)&&e.data?(this.updateInput(n,t,e.data),this.focusInputField("next",t)):this.updateInput(n,t,"")}}this.dispatchInputChangeEvent()}handlePaste(e,t,i){const n=t[0];if(n&&l.isNumber(n)){this.updateInput(e,i,n);const o=t.substring(1);if(i+1<this.length&&o.length){const e=this.numerics[i+1],t=e?this.getInputElement(e):void 0;t&&this.handlePaste(t,o,i+1)}else this.focusInputField("next",i)}else this.updateInput(e,i,"")}getInputElement(e){var t;return(null==(t=e.shadowRoot)?void 0:t.querySelector("input"))?e.shadowRoot.querySelector("input"):null}dispatchInputChangeEvent(){const e=this.values.join("");this.dispatchEvent(new CustomEvent("inputChange",{detail:e,bubbles:!0,composed:!0}))}};k.styles=[t,R],T([n({type:Number})],k.prototype,"length",void 0),T([n({type:String})],k.prototype,"otp",void 0),T([s()],k.prototype,"values",void 0),k=T([o("wui-otp")],k);const A=e`
  wui-loading-spinner {
    margin: 9px auto;
  }

  .email-display,
  .email-display wui-text {
    max-width: 100%;
  }
`;var S,D=function(e,t,i,n){var o,r=arguments.length,a=r<3?t:null===n?n=Object.getOwnPropertyDescriptor(t,i):n;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)a=Reflect.decorate(e,t,i,n);else for(var s=e.length-1;s>=0;s--)(o=e[s])&&(a=(r<3?o(a):r>3?o(t,i,a):o(t,i))||a);return r>3&&a&&Object.defineProperty(t,i,a),a};let P=S=class extends r{firstUpdated(){this.startOTPTimeout()}disconnectedCallback(){clearTimeout(this.OTPTimeout)}constructor(){var e;super(),this.loading=!1,this.timeoutTimeLeft=c.getTimeToNextEmailLogin(),this.error="",this.otp="",this.email=null==(e=u.state.data)?void 0:e.email,this.authConnector=d.getAuthConnector()}render(){if(!this.email)throw new Error("w3m-email-otp-widget: No email provided");const e=Boolean(this.timeoutTimeLeft),t=this.getFooterLabels(e);return a`
      <wui-flex
        flexDirection="column"
        alignItems="center"
        .padding=${["l","0","l","0"]}
        gap="l"
      >
        <wui-flex
          class="email-display"
          flexDirection="column"
          alignItems="center"
          .padding=${["0","xl","0","xl"]}
        >
          <wui-text variant="paragraph-400" color="fg-100" align="center">
            Enter the code we sent to
          </wui-text>
          <wui-text variant="paragraph-500" color="fg-100" lineClamp="1" align="center">
            ${this.email}
          </wui-text>
        </wui-flex>

        <wui-text variant="small-400" color="fg-200">The code expires in 20 minutes</wui-text>

        ${this.loading?a`<wui-loading-spinner size="xl" color="accent-100"></wui-loading-spinner>`:a` <wui-flex flexDirection="column" alignItems="center" gap="xs">
              <wui-otp
                dissabled
                length="6"
                @inputChange=${this.onOtpInputChange.bind(this)}
                .otp=${this.otp}
              ></wui-otp>
              ${this.error?a`
                    <wui-text variant="small-400" align="center" color="error-100">
                      ${this.error}. Try Again
                    </wui-text>
                  `:null}
            </wui-flex>`}

        <wui-flex alignItems="center" gap="xs">
          <wui-text variant="small-400" color="fg-200">${t.title}</wui-text>
          <wui-link @click=${this.onResendCode.bind(this)} .disabled=${e}>
            ${t.action}
          </wui-link>
        </wui-flex>
      </wui-flex>
    `}startOTPTimeout(){this.timeoutTimeLeft=c.getTimeToNextEmailLogin(),this.OTPTimeout=setInterval(()=>{this.timeoutTimeLeft>0?this.timeoutTimeLeft=c.getTimeToNextEmailLogin():clearInterval(this.OTPTimeout)},1e3)}async onOtpInputChange(e){var t;try{this.loading||(this.otp=e.detail,this.shouldSubmitOnOtpChange()&&(this.loading=!0,await(null==(t=this.onOtpSubmit)?void 0:t.call(this,this.otp))))}catch(i){this.error=h.parseError(i),this.loading=!1}}async onResendCode(){try{if(this.onOtpResend){if(!this.loading&&!this.timeoutTimeLeft){this.error="",this.otp="";if(!d.getAuthConnector()||!this.email)throw new Error("w3m-email-otp-widget: Unable to resend email");this.loading=!0,await this.onOtpResend(this.email),this.startOTPTimeout(),p.showSuccess("Code email resent")}}else this.onStartOver&&this.onStartOver()}catch(e){p.showError(e)}finally{this.loading=!1}}getFooterLabels(e){return this.onStartOver?{title:"Something wrong?",action:"Try again "+(e?`in ${this.timeoutTimeLeft}s`:"")}:{title:"Didn't receive it?",action:"Resend "+(e?`in ${this.timeoutTimeLeft}s`:"Code")}}shouldSubmitOnOtpChange(){return this.authConnector&&this.otp.length===S.OTP_LENGTH}};P.OTP_LENGTH=6,P.styles=A,D([s()],P.prototype,"loading",void 0),D([s()],P.prototype,"timeoutTimeLeft",void 0),D([s()],P.prototype,"error",void 0),P=S=D([o("w3m-email-otp-widget")],P);let $=class extends P{constructor(){super(...arguments),this.onOtpSubmit=async e=>{var t,i,n;try{if(this.authConnector){const o=m.state.activeChain,r=w.getConnections(o),a=null==(t=f.state.remoteFeatures)?void 0:t.multiWallet,s=r.length>0;if(await this.authConnector.provider.connectOtp({otp:e}),v.sendEvent({type:"track",event:"EMAIL_VERIFICATION_CODE_PASS"}),!o)throw new Error("Active chain is not set on ChainControll");if(await w.connectExternal(this.authConnector,o),v.sendEvent({type:"track",event:"CONNECT_SUCCESS",properties:{method:"email",name:this.authConnector.name||"Unknown",caipNetworkId:null==(i=m.getActiveCaipNetwork())?void 0:i.caipNetworkId}}),null==(n=f.state.remoteFeatures)?void 0:n.emailCapture)return;if(f.state.siwx)return void g.close();if(s&&a)return u.replace("ProfileWallets"),void p.showSuccess("New Wallet Added");g.close()}}catch(o){throw v.sendEvent({type:"track",event:"EMAIL_VERIFICATION_CODE_FAIL",properties:{message:h.parseError(o)}}),o}},this.onOtpResend=async e=>{this.authConnector&&(await this.authConnector.provider.connectEmail({email:e}),v.sendEvent({type:"track",event:"EMAIL_VERIFICATION_CODE_SENT"}))}}};$=function(e,t,i,n){var o,r=arguments.length,a=r<3?t:null===n?n=Object.getOwnPropertyDescriptor(t,i):n;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)a=Reflect.decorate(e,t,i,n);else for(var s=e.length-1;s>=0;s--)(o=e[s])&&(a=(r<3?o(a):r>3?o(t,i,a):o(t,i))||a);return r>3&&a&&Object.defineProperty(t,i,a),a}([o("w3m-email-verify-otp-view")],$);const _=e`
  wui-icon-box {
    height: var(--wui-icon-box-size-xl);
    width: var(--wui-icon-box-size-xl);
  }
`;var N=function(e,t,i,n){var o,r=arguments.length,a=r<3?t:null===n?n=Object.getOwnPropertyDescriptor(t,i):n;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)a=Reflect.decorate(e,t,i,n);else for(var s=e.length-1;s>=0;s--)(o=e[s])&&(a=(r<3?o(a):r>3?o(t,i,a):o(t,i))||a);return r>3&&a&&Object.defineProperty(t,i,a),a};let j=class extends r{constructor(){var e;super(),this.email=null==(e=u.state.data)?void 0:e.email,this.authConnector=d.getAuthConnector(),this.loading=!1,this.listenForDeviceApproval()}render(){if(!this.email)throw new Error("w3m-email-verify-device-view: No email provided");if(!this.authConnector)throw new Error("w3m-email-verify-device-view: No auth connector provided");return a`
      <wui-flex
        flexDirection="column"
        alignItems="center"
        .padding=${["xxl","s","xxl","s"]}
        gap="l"
      >
        <wui-icon-box
          size="xl"
          iconcolor="accent-100"
          backgroundcolor="accent-100"
          icon="verify"
          background="opaque"
        ></wui-icon-box>

        <wui-flex flexDirection="column" alignItems="center" gap="s">
          <wui-flex flexDirection="column" alignItems="center">
            <wui-text variant="paragraph-400" color="fg-100">
              Approve the login link we sent to
            </wui-text>
            <wui-text variant="paragraph-400" color="fg-100"><b>${this.email}</b></wui-text>
          </wui-flex>

          <wui-text variant="small-400" color="fg-200" align="center">
            The code expires in 20 minutes
          </wui-text>

          <wui-flex alignItems="center" id="w3m-resend-section" gap="xs">
            <wui-text variant="small-400" color="fg-100" align="center">
              Didn't receive it?
            </wui-text>
            <wui-link @click=${this.onResendCode.bind(this)} .disabled=${this.loading}>
              Resend email
            </wui-link>
          </wui-flex>
        </wui-flex>
      </wui-flex>
    `}async listenForDeviceApproval(){if(this.authConnector)try{await this.authConnector.provider.connectDevice(),v.sendEvent({type:"track",event:"DEVICE_REGISTERED_FOR_EMAIL"}),v.sendEvent({type:"track",event:"EMAIL_VERIFICATION_CODE_SENT"}),u.replace("EmailVerifyOtp",{email:this.email})}catch(e){u.goBack()}}async onResendCode(){try{if(!this.loading){if(!this.authConnector||!this.email)throw new Error("w3m-email-login-widget: Unable to resend email");this.loading=!0,await this.authConnector.provider.connectEmail({email:this.email}),this.listenForDeviceApproval(),p.showSuccess("Code email resent")}}catch(e){p.showError(e)}finally{this.loading=!1}}};j.styles=_,N([s()],j.prototype,"loading",void 0),j=N([o("w3m-email-verify-device-view")],j);const L=e`
  wui-email-input {
    width: 100%;
  }

  form {
    width: 100%;
    display: block;
    position: relative;
  }
`;var F=function(e,t,i,n){var o,r=arguments.length,a=r<3?t:null===n?n=Object.getOwnPropertyDescriptor(t,i):n;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)a=Reflect.decorate(e,t,i,n);else for(var s=e.length-1;s>=0;s--)(o=e[s])&&(a=(r<3?o(a):r>3?o(t,i,a):o(t,i))||a);return r>3&&a&&Object.defineProperty(t,i,a),a};let V=class extends r{constructor(){var e,t;super(...arguments),this.formRef=b(),this.initialEmail=(null==(e=u.state.data)?void 0:e.email)??"",this.redirectView=null==(t=u.state.data)?void 0:t.redirectView,this.email="",this.loading=!1}firstUpdated(){var e;null==(e=this.formRef.value)||e.addEventListener("keydown",e=>{"Enter"===e.key&&this.onSubmitEmail(e)})}render(){return a`
      <wui-flex flexDirection="column" padding="m" gap="m">
        <form ${y(this.formRef)} @submit=${this.onSubmitEmail.bind(this)}>
          <wui-email-input
            value=${this.initialEmail}
            .disabled=${this.loading}
            @inputChange=${this.onEmailInputChange.bind(this)}
          >
          </wui-email-input>
          <input type="submit" hidden />
        </form>
        ${this.buttonsTemplate()}
      </wui-flex>
    `}onEmailInputChange(e){this.email=e.detail}async onSubmitEmail(e){try{if(this.loading)return;this.loading=!0,e.preventDefault();const t=d.getAuthConnector();if(!t)throw new Error("w3m-update-email-wallet: Auth connector not found");const i=await t.provider.updateEmail({email:this.email});v.sendEvent({type:"track",event:"EMAIL_EDIT"}),"VERIFY_SECONDARY_OTP"===i.action?u.push("UpdateEmailSecondaryOtp",{email:this.initialEmail,newEmail:this.email,redirectView:this.redirectView}):u.push("UpdateEmailPrimaryOtp",{email:this.initialEmail,newEmail:this.email,redirectView:this.redirectView})}catch(t){p.showError(t),this.loading=!1}}buttonsTemplate(){const e=!this.loading&&this.email.length>3&&this.email!==this.initialEmail;return this.redirectView?a`
      <wui-flex gap="s">
        <wui-button size="md" variant="neutral" fullWidth @click=${u.goBack}>
          Cancel
        </wui-button>

        <wui-button
          size="md"
          variant="main"
          fullWidth
          @click=${this.onSubmitEmail.bind(this)}
          .disabled=${!e}
          .loading=${this.loading}
        >
          Save
        </wui-button>
      </wui-flex>
    `:a`
        <wui-button
          size="md"
          variant="main"
          fullWidth
          @click=${this.onSubmitEmail.bind(this)}
          .disabled=${!e}
          .loading=${this.loading}
        >
          Save
        </wui-button>
      `}};V.styles=L,F([s()],V.prototype,"email",void 0),F([s()],V.prototype,"loading",void 0),V=F([o("w3m-update-email-wallet-view")],V);let U=class extends P{constructor(){var e;super(),this.email=null==(e=u.state.data)?void 0:e.email,this.onOtpSubmit=async e=>{try{this.authConnector&&(await this.authConnector.provider.updateEmailPrimaryOtp({otp:e}),v.sendEvent({type:"track",event:"EMAIL_VERIFICATION_CODE_PASS"}),u.replace("UpdateEmailSecondaryOtp",u.state.data))}catch(t){throw v.sendEvent({type:"track",event:"EMAIL_VERIFICATION_CODE_FAIL",properties:{message:h.parseError(t)}}),t}},this.onStartOver=()=>{u.replace("UpdateEmailWallet",u.state.data)}}};U=function(e,t,i,n){var o,r=arguments.length,a=r<3?t:null===n?n=Object.getOwnPropertyDescriptor(t,i):n;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)a=Reflect.decorate(e,t,i,n);else for(var s=e.length-1;s>=0;s--)(o=e[s])&&(a=(r<3?o(a):r>3?o(t,i,a):o(t,i))||a);return r>3&&a&&Object.defineProperty(t,i,a),a}([o("w3m-update-email-primary-otp-view")],U);let z=class extends P{constructor(){var e,t;super(),this.email=null==(e=u.state.data)?void 0:e.newEmail,this.redirectView=null==(t=u.state.data)?void 0:t.redirectView,this.onOtpSubmit=async e=>{try{this.authConnector&&(await this.authConnector.provider.updateEmailSecondaryOtp({otp:e}),v.sendEvent({type:"track",event:"EMAIL_VERIFICATION_CODE_PASS"}),this.redirectView&&u.reset(this.redirectView))}catch(t){throw v.sendEvent({type:"track",event:"EMAIL_VERIFICATION_CODE_FAIL",properties:{message:h.parseError(t)}}),t}},this.onStartOver=()=>{u.replace("UpdateEmailWallet",u.state.data)}}};z=function(e,t,i,n){var o,r=arguments.length,a=r<3?t:null===n?n=Object.getOwnPropertyDescriptor(t,i):n;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)a=Reflect.decorate(e,t,i,n);else for(var s=e.length-1;s>=0;s--)(o=e[s])&&(a=(r<3?o(a):r>3?o(t,i,a):o(t,i))||a);return r>3&&a&&Object.defineProperty(t,i,a),a}([o("w3m-update-email-secondary-otp-view")],z);var M=function(e,t,i,n){var o,r=arguments.length,a=r<3?t:null===n?n=Object.getOwnPropertyDescriptor(t,i):n;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)a=Reflect.decorate(e,t,i,n);else for(var s=e.length-1;s>=0;s--)(o=e[s])&&(a=(r<3?o(a):r>3?o(t,i,a):o(t,i))||a);return r>3&&a&&Object.defineProperty(t,i,a),a};let B=class extends r{constructor(){var e;super(),this.authConnector=d.getAuthConnector(),this.isEmailEnabled=null==(e=f.state.remoteFeatures)?void 0:e.email,this.isAuthEnabled=this.checkIfAuthEnabled(d.state.connectors),this.connectors=d.state.connectors,d.subscribeKey("connectors",e=>{this.connectors=e,this.isAuthEnabled=this.checkIfAuthEnabled(this.connectors)})}render(){if(!this.isEmailEnabled)throw new Error("w3m-email-login-view: Email is not enabled");if(!this.isAuthEnabled)throw new Error("w3m-email-login-view: No auth connector provided");return a`<wui-flex
      flexDirection="column"
      .padding=${["3xs","m","m","m"]}
      gap="l"
    >
      <w3m-email-login-widget></w3m-email-login-widget>
    </wui-flex> `}checkIfAuthEnabled(e){const t=e.filter(e=>e.type===E.CONNECTOR_TYPE_AUTH).map(e=>e.chain);return x.AUTH_CONNECTOR_SUPPORTED_CHAINS.some(e=>t.includes(e))}};M([s()],B.prototype,"connectors",void 0),B=M([o("w3m-email-login-view")],B);export{B as W3mEmailLoginView,P as W3mEmailOtpWidget,j as W3mEmailVerifyDeviceView,$ as W3mEmailVerifyOtpView,U as W3mUpdateEmailPrimaryOtpView,z as W3mUpdateEmailSecondaryOtpView,V as W3mUpdateEmailWalletView};
