import{a as e,c as t,i,x as n,g as r,f as a,b as o,d as l}from"./react-CJFWHICN.js";import{W as s}from"./index-DdQ-eExi.js";import{a as c,C as d,O as u,E as h,R as p,M as m,S as w,b as f,h as v,G as E}from"./W3MFrameProviderSingleton-CzpTE7Ae.js";import{C as g}from"./NetworkUtil-8PBlJxlj.js";import"./react-vendor-BlDtUSDV.js";import"./wagmi-vendor-BS3qzBkV.js";import"./index-CFYEtFbK.js";let y=class extends s{constructor(){super(...arguments),this.onOtpSubmit=async e=>{var t,i;try{if(this.authConnector){const n=c.state.activeChain,r=d.getConnections(n),a=null==(t=u.state.remoteFeatures)?void 0:t.multiWallet,o=r.length>0;if(await this.authConnector.provider.connectOtp({otp:e}),h.sendEvent({type:"track",event:"EMAIL_VERIFICATION_CODE_PASS"}),!n)throw new Error("Active chain is not set on ChainControll");if(await d.connectExternal(this.authConnector,n),h.sendEvent({type:"track",event:"CONNECT_SUCCESS",properties:{method:"email",name:this.authConnector.name||"Unknown",view:p.state.view,walletRank:void 0}}),null==(i=u.state.remoteFeatures)?void 0:i.emailCapture)return;if(u.state.siwx)return void m.close();if(o&&a)return p.replace("ProfileWallets"),void w.showSuccess("New Wallet Added");m.close()}}catch(n){throw h.sendEvent({type:"track",event:"EMAIL_VERIFICATION_CODE_FAIL",properties:{message:f.parseError(n)}}),n}},this.onOtpResend=async e=>{this.authConnector&&(await this.authConnector.provider.connectEmail({email:e}),h.sendEvent({type:"track",event:"EMAIL_VERIFICATION_CODE_SENT"}))}}};y=function(e,t,i,n){var r,a=arguments.length,o=a<3?t:null===n?n=Object.getOwnPropertyDescriptor(t,i):n;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)o=Reflect.decorate(e,t,i,n);else for(var l=e.length-1;l>=0;l--)(r=e[l])&&(o=(a<3?r(o):a>3?r(t,i,o):r(t,i))||o);return a>3&&o&&Object.defineProperty(t,i,o),o}([e("w3m-email-verify-otp-view")],y);const b=t`
  wui-icon-box {
    height: ${({spacing:e})=>e[16]};
    width: ${({spacing:e})=>e[16]};
  }
`;var C=function(e,t,i,n){var r,a=arguments.length,o=a<3?t:null===n?n=Object.getOwnPropertyDescriptor(t,i):n;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)o=Reflect.decorate(e,t,i,n);else for(var l=e.length-1;l>=0;l--)(r=e[l])&&(o=(a<3?r(o):a>3?r(t,i,o):r(t,i))||o);return a>3&&o&&Object.defineProperty(t,i,o),o};let O=class extends i{constructor(){var e;super(),this.email=null==(e=p.state.data)?void 0:e.email,this.authConnector=v.getAuthConnector(),this.loading=!1,this.listenForDeviceApproval()}render(){if(!this.email)throw new Error("w3m-email-verify-device-view: No email provided");if(!this.authConnector)throw new Error("w3m-email-verify-device-view: No auth connector provided");return n`
      <wui-flex
        flexDirection="column"
        alignItems="center"
        .padding=${["6","3","6","3"]}
        gap="4"
      >
        <wui-icon-box size="xl" color="accent-primary" icon="sealCheck"></wui-icon-box>

        <wui-flex flexDirection="column" alignItems="center" gap="3">
          <wui-flex flexDirection="column" alignItems="center">
            <wui-text variant="md-regular" color="primary">
              Approve the login link we sent to
            </wui-text>
            <wui-text variant="md-regular" color="primary"><b>${this.email}</b></wui-text>
          </wui-flex>

          <wui-text variant="sm-regular" color="secondary" align="center">
            The code expires in 20 minutes
          </wui-text>

          <wui-flex alignItems="center" id="w3m-resend-section" gap="2">
            <wui-text variant="sm-regular" color="primary" align="center">
              Didn't receive it?
            </wui-text>
            <wui-link @click=${this.onResendCode.bind(this)} .disabled=${this.loading}>
              Resend email
            </wui-link>
          </wui-flex>
        </wui-flex>
      </wui-flex>
    `}async listenForDeviceApproval(){if(this.authConnector)try{await this.authConnector.provider.connectDevice(),h.sendEvent({type:"track",event:"DEVICE_REGISTERED_FOR_EMAIL"}),h.sendEvent({type:"track",event:"EMAIL_VERIFICATION_CODE_SENT"}),p.replace("EmailVerifyOtp",{email:this.email})}catch(e){p.goBack()}}async onResendCode(){try{if(!this.loading){if(!this.authConnector||!this.email)throw new Error("w3m-email-login-widget: Unable to resend email");this.loading=!0,await this.authConnector.provider.connectEmail({email:this.email}),this.listenForDeviceApproval(),w.showSuccess("Code email resent")}}catch(e){w.showError(e)}finally{this.loading=!1}}};O.styles=b,C([r()],O.prototype,"loading",void 0),O=C([e("w3m-email-verify-device-view")],O);const I=a`
  wui-email-input {
    width: 100%;
  }

  form {
    width: 100%;
    display: block;
    position: relative;
  }
`;var A=function(e,t,i,n){var r,a=arguments.length,o=a<3?t:null===n?n=Object.getOwnPropertyDescriptor(t,i):n;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)o=Reflect.decorate(e,t,i,n);else for(var l=e.length-1;l>=0;l--)(r=e[l])&&(o=(a<3?r(o):a>3?r(t,i,o):r(t,i))||o);return a>3&&o&&Object.defineProperty(t,i,o),o};let x=class extends i{constructor(){var e,t;super(...arguments),this.formRef=o(),this.initialEmail=(null==(e=p.state.data)?void 0:e.email)??"",this.redirectView=null==(t=p.state.data)?void 0:t.redirectView,this.email="",this.loading=!1}firstUpdated(){var e;null==(e=this.formRef.value)||e.addEventListener("keydown",e=>{"Enter"===e.key&&this.onSubmitEmail(e)})}render(){return n`
      <wui-flex flexDirection="column" padding="4" gap="4">
        <form ${l(this.formRef)} @submit=${this.onSubmitEmail.bind(this)}>
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
    `}onEmailInputChange(e){this.email=e.detail}async onSubmitEmail(e){try{if(this.loading)return;this.loading=!0,e.preventDefault();const t=v.getAuthConnector();if(!t)throw new Error("w3m-update-email-wallet: Auth connector not found");const i=await t.provider.updateEmail({email:this.email});h.sendEvent({type:"track",event:"EMAIL_EDIT"}),"VERIFY_SECONDARY_OTP"===i.action?p.push("UpdateEmailSecondaryOtp",{email:this.initialEmail,newEmail:this.email,redirectView:this.redirectView}):p.push("UpdateEmailPrimaryOtp",{email:this.initialEmail,newEmail:this.email,redirectView:this.redirectView})}catch(t){w.showError(t),this.loading=!1}}buttonsTemplate(){const e=!this.loading&&this.email.length>3&&this.email!==this.initialEmail;return this.redirectView?n`
      <wui-flex gap="3">
        <wui-button size="md" variant="neutral" fullWidth @click=${p.goBack}>
          Cancel
        </wui-button>

        <wui-button
          size="md"
          variant="accent-primary"
          fullWidth
          @click=${this.onSubmitEmail.bind(this)}
          .disabled=${!e}
          .loading=${this.loading}
        >
          Save
        </wui-button>
      </wui-flex>
    `:n`
        <wui-button
          size="md"
          variant="accent-primary"
          fullWidth
          @click=${this.onSubmitEmail.bind(this)}
          .disabled=${!e}
          .loading=${this.loading}
        >
          Save
        </wui-button>
      `}};x.styles=I,A([r()],x.prototype,"email",void 0),A([r()],x.prototype,"loading",void 0),x=A([e("w3m-update-email-wallet-view")],x);let R=class extends s{constructor(){var e;super(),this.email=null==(e=p.state.data)?void 0:e.email,this.onOtpSubmit=async e=>{try{this.authConnector&&(await this.authConnector.provider.updateEmailPrimaryOtp({otp:e}),h.sendEvent({type:"track",event:"EMAIL_VERIFICATION_CODE_PASS"}),p.replace("UpdateEmailSecondaryOtp",p.state.data))}catch(t){throw h.sendEvent({type:"track",event:"EMAIL_VERIFICATION_CODE_FAIL",properties:{message:f.parseError(t)}}),t}},this.onStartOver=()=>{p.replace("UpdateEmailWallet",p.state.data)}}};R=function(e,t,i,n){var r,a=arguments.length,o=a<3?t:null===n?n=Object.getOwnPropertyDescriptor(t,i):n;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)o=Reflect.decorate(e,t,i,n);else for(var l=e.length-1;l>=0;l--)(r=e[l])&&(o=(a<3?r(o):a>3?r(t,i,o):r(t,i))||o);return a>3&&o&&Object.defineProperty(t,i,o),o}([e("w3m-update-email-primary-otp-view")],R);let _=class extends s{constructor(){var e,t;super(),this.email=null==(e=p.state.data)?void 0:e.newEmail,this.redirectView=null==(t=p.state.data)?void 0:t.redirectView,this.onOtpSubmit=async e=>{try{this.authConnector&&(await this.authConnector.provider.updateEmailSecondaryOtp({otp:e}),h.sendEvent({type:"track",event:"EMAIL_VERIFICATION_CODE_PASS"}),this.redirectView&&p.reset(this.redirectView))}catch(t){throw h.sendEvent({type:"track",event:"EMAIL_VERIFICATION_CODE_FAIL",properties:{message:f.parseError(t)}}),t}},this.onStartOver=()=>{p.replace("UpdateEmailWallet",p.state.data)}}};_=function(e,t,i,n){var r,a=arguments.length,o=a<3?t:null===n?n=Object.getOwnPropertyDescriptor(t,i):n;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)o=Reflect.decorate(e,t,i,n);else for(var l=e.length-1;l>=0;l--)(r=e[l])&&(o=(a<3?r(o):a>3?r(t,i,o):r(t,i))||o);return a>3&&o&&Object.defineProperty(t,i,o),o}([e("w3m-update-email-secondary-otp-view")],_);var S=function(e,t,i,n){var r,a=arguments.length,o=a<3?t:null===n?n=Object.getOwnPropertyDescriptor(t,i):n;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)o=Reflect.decorate(e,t,i,n);else for(var l=e.length-1;l>=0;l--)(r=e[l])&&(o=(a<3?r(o):a>3?r(t,i,o):r(t,i))||o);return a>3&&o&&Object.defineProperty(t,i,o),o};let k=class extends i{constructor(){var e;super(),this.authConnector=v.getAuthConnector(),this.isEmailEnabled=null==(e=u.state.remoteFeatures)?void 0:e.email,this.isAuthEnabled=this.checkIfAuthEnabled(v.state.connectors),this.connectors=v.state.connectors,v.subscribeKey("connectors",e=>{this.connectors=e,this.isAuthEnabled=this.checkIfAuthEnabled(this.connectors)})}render(){if(!this.isEmailEnabled)throw new Error("w3m-email-login-view: Email is not enabled");if(!this.isAuthEnabled)throw new Error("w3m-email-login-view: No auth connector provided");return n`<wui-flex flexDirection="column" .padding=${["1","3","3","3"]} gap="4">
      <w3m-email-login-widget></w3m-email-login-widget>
    </wui-flex> `}checkIfAuthEnabled(e){const t=e.filter(e=>e.type===E.CONNECTOR_TYPE_AUTH).map(e=>e.chain);return g.AUTH_CONNECTOR_SUPPORTED_CHAINS.some(e=>t.includes(e))}};S([r()],k.prototype,"connectors",void 0),k=S([e("w3m-email-login-view")],k);export{k as W3mEmailLoginView,s as W3mEmailOtpWidget,O as W3mEmailVerifyDeviceView,y as W3mEmailVerifyOtpView,R as W3mUpdateEmailPrimaryOtpView,_ as W3mUpdateEmailSecondaryOtpView,x as W3mUpdateEmailWalletView};
