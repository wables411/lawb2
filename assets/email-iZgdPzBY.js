import{z as e,C as t,ab as i,E as r,aq as a,R as n,S as o,D as l,V as s,P as c,X as d,K as u,Y as h,a5 as p,a1 as m,Z as w,$ as f,ar as v,x as E}from"./index-OpbypVz_.js";import{W as g}from"./index-DGpolAkb.js";import"./wagmi-vendor-Sv5HvNCH.js";import"./ui-vendor-GwtnLNQ7.js";import"./chess-vendor-C25K65co.js";let y=class extends g{constructor(){super(...arguments),this.onOtpSubmit=async s=>{var c,d;try{if(this.authConnector){const l=e.state.activeChain,u=t.getConnections(l),h=null==(c=i.state.remoteFeatures)?void 0:c.multiWallet,p=u.length>0;if(await this.authConnector.provider.connectOtp({otp:s}),r.sendEvent({type:"track",event:"EMAIL_VERIFICATION_CODE_PASS"}),!l)throw new Error("Active chain is not set on ChainController");if(await t.connectExternal(this.authConnector,l),null==(d=i.state.remoteFeatures)?void 0:d.emailCapture)return;if(i.state.siwx)return void a.close();if(p&&h)return n.replace("ProfileWallets"),void o.showSuccess("New Wallet Added");a.close()}}catch(u){throw r.sendEvent({type:"track",event:"EMAIL_VERIFICATION_CODE_FAIL",properties:{message:l.parseError(u)}}),u}},this.onOtpResend=async e=>{this.authConnector&&(await this.authConnector.provider.connectEmail({email:e}),r.sendEvent({type:"track",event:"EMAIL_VERIFICATION_CODE_SENT"}))}}};y=function(e,t,i,r){var a,n=arguments.length,o=n<3?t:null===r?r=Object.getOwnPropertyDescriptor(t,i):r;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)o=Reflect.decorate(e,t,i,r);else for(var l=e.length-1;l>=0;l--)(a=e[l])&&(o=(n<3?a(o):n>3?a(t,i,o):a(t,i))||o);return n>3&&o&&Object.defineProperty(t,i,o),o}([s("w3m-email-verify-otp-view")],y);const b=c`
  wui-icon-box {
    height: ${({spacing:e})=>e[16]};
    width: ${({spacing:e})=>e[16]};
  }
`;var C=function(e,t,i,r){var a,n=arguments.length,o=n<3?t:null===r?r=Object.getOwnPropertyDescriptor(t,i):r;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)o=Reflect.decorate(e,t,i,r);else for(var l=e.length-1;l>=0;l--)(a=e[l])&&(o=(n<3?a(o):n>3?a(t,i,o):a(t,i))||o);return n>3&&o&&Object.defineProperty(t,i,o),o};let O=class extends d{constructor(){var e;super(),this.email=null==(e=n.state.data)?void 0:e.email,this.authConnector=u.getAuthConnector(),this.loading=!1,this.listenForDeviceApproval()}render(){if(!this.email)throw new Error("w3m-email-verify-device-view: No email provided");if(!this.authConnector)throw new Error("w3m-email-verify-device-view: No auth connector provided");return h`
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
    `}async listenForDeviceApproval(){if(this.authConnector)try{await this.authConnector.provider.connectDevice(),r.sendEvent({type:"track",event:"DEVICE_REGISTERED_FOR_EMAIL"}),r.sendEvent({type:"track",event:"EMAIL_VERIFICATION_CODE_SENT"}),n.replace("EmailVerifyOtp",{email:this.email})}catch(e){n.goBack()}}async onResendCode(){try{if(!this.loading){if(!this.authConnector||!this.email)throw new Error("w3m-email-login-widget: Unable to resend email");this.loading=!0,await this.authConnector.provider.connectEmail({email:this.email}),this.listenForDeviceApproval(),o.showSuccess("Code email resent")}}catch(e){o.showError(e)}finally{this.loading=!1}}};O.styles=b,C([p()],O.prototype,"loading",void 0),O=C([s("w3m-email-verify-device-view")],O);const I=m`
  wui-email-input {
    width: 100%;
  }

  form {
    width: 100%;
    display: block;
    position: relative;
  }
`;var x=function(e,t,i,r){var a,n=arguments.length,o=n<3?t:null===r?r=Object.getOwnPropertyDescriptor(t,i):r;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)o=Reflect.decorate(e,t,i,r);else for(var l=e.length-1;l>=0;l--)(a=e[l])&&(o=(n<3?a(o):n>3?a(t,i,o):a(t,i))||o);return n>3&&o&&Object.defineProperty(t,i,o),o};let A=class extends d{constructor(){var e,t;super(...arguments),this.formRef=w(),this.initialEmail=(null==(e=n.state.data)?void 0:e.email)??"",this.redirectView=null==(t=n.state.data)?void 0:t.redirectView,this.email="",this.loading=!1}firstUpdated(){var e;null==(e=this.formRef.value)||e.addEventListener("keydown",e=>{"Enter"===e.key&&this.onSubmitEmail(e)})}render(){return h`
      <wui-flex flexDirection="column" padding="4" gap="4">
        <form ${f(this.formRef)} @submit=${this.onSubmitEmail.bind(this)}>
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
    `}onEmailInputChange(e){this.email=e.detail}async onSubmitEmail(e){try{if(this.loading)return;this.loading=!0,e.preventDefault();const t=u.getAuthConnector();if(!t)throw new Error("w3m-update-email-wallet: Auth connector not found");const i=await t.provider.updateEmail({email:this.email});r.sendEvent({type:"track",event:"EMAIL_EDIT"}),"VERIFY_SECONDARY_OTP"===i.action?n.push("UpdateEmailSecondaryOtp",{email:this.initialEmail,newEmail:this.email,redirectView:this.redirectView}):n.push("UpdateEmailPrimaryOtp",{email:this.initialEmail,newEmail:this.email,redirectView:this.redirectView})}catch(t){o.showError(t),this.loading=!1}}buttonsTemplate(){const e=!this.loading&&this.email.length>3&&this.email!==this.initialEmail;return this.redirectView?h`
      <wui-flex gap="3">
        <wui-button size="md" variant="neutral" fullWidth @click=${n.goBack}>
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
    `:h`
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
      `}};A.styles=I,x([p()],A.prototype,"email",void 0),x([p()],A.prototype,"loading",void 0),A=x([s("w3m-update-email-wallet-view")],A);let R=class extends g{constructor(){var e;super(),this.email=null==(e=n.state.data)?void 0:e.email,this.onOtpSubmit=async e=>{try{this.authConnector&&(await this.authConnector.provider.updateEmailPrimaryOtp({otp:e}),r.sendEvent({type:"track",event:"EMAIL_VERIFICATION_CODE_PASS"}),n.replace("UpdateEmailSecondaryOtp",n.state.data))}catch(t){throw r.sendEvent({type:"track",event:"EMAIL_VERIFICATION_CODE_FAIL",properties:{message:l.parseError(t)}}),t}},this.onStartOver=()=>{n.replace("UpdateEmailWallet",n.state.data)}}};R=function(e,t,i,r){var a,n=arguments.length,o=n<3?t:null===r?r=Object.getOwnPropertyDescriptor(t,i):r;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)o=Reflect.decorate(e,t,i,r);else for(var l=e.length-1;l>=0;l--)(a=e[l])&&(o=(n<3?a(o):n>3?a(t,i,o):a(t,i))||o);return n>3&&o&&Object.defineProperty(t,i,o),o}([s("w3m-update-email-primary-otp-view")],R);let _=class extends g{constructor(){var e,t;super(),this.email=null==(e=n.state.data)?void 0:e.newEmail,this.redirectView=null==(t=n.state.data)?void 0:t.redirectView,this.onOtpSubmit=async e=>{try{this.authConnector&&(await this.authConnector.provider.updateEmailSecondaryOtp({otp:e}),r.sendEvent({type:"track",event:"EMAIL_VERIFICATION_CODE_PASS"}),this.redirectView&&n.reset(this.redirectView))}catch(t){throw r.sendEvent({type:"track",event:"EMAIL_VERIFICATION_CODE_FAIL",properties:{message:l.parseError(t)}}),t}},this.onStartOver=()=>{n.replace("UpdateEmailWallet",n.state.data)}}};_=function(e,t,i,r){var a,n=arguments.length,o=n<3?t:null===r?r=Object.getOwnPropertyDescriptor(t,i):r;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)o=Reflect.decorate(e,t,i,r);else for(var l=e.length-1;l>=0;l--)(a=e[l])&&(o=(n<3?a(o):n>3?a(t,i,o):a(t,i))||o);return n>3&&o&&Object.defineProperty(t,i,o),o}([s("w3m-update-email-secondary-otp-view")],_);var D=function(e,t,i,r){var a,n=arguments.length,o=n<3?t:null===r?r=Object.getOwnPropertyDescriptor(t,i):r;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)o=Reflect.decorate(e,t,i,r);else for(var l=e.length-1;l>=0;l--)(a=e[l])&&(o=(n<3?a(o):n>3?a(t,i,o):a(t,i))||o);return n>3&&o&&Object.defineProperty(t,i,o),o};let S=class extends d{constructor(){var e;super(),this.authConnector=u.getAuthConnector(),this.isEmailEnabled=null==(e=i.state.remoteFeatures)?void 0:e.email,this.isAuthEnabled=this.checkIfAuthEnabled(u.state.connectors),this.connectors=u.state.connectors,u.subscribeKey("connectors",e=>{this.connectors=e,this.isAuthEnabled=this.checkIfAuthEnabled(this.connectors)})}render(){if(!this.isEmailEnabled)throw new Error("w3m-email-login-view: Email is not enabled");if(!this.isAuthEnabled)throw new Error("w3m-email-login-view: No auth connector provided");return h`<wui-flex flexDirection="column" .padding=${["1","3","3","3"]} gap="4">
      <w3m-email-login-widget></w3m-email-login-widget>
    </wui-flex> `}checkIfAuthEnabled(e){const t=e.filter(e=>e.type===v.CONNECTOR_TYPE_AUTH).map(e=>e.chain);return E.AUTH_CONNECTOR_SUPPORTED_CHAINS.some(e=>t.includes(e))}};D([p()],S.prototype,"connectors",void 0),S=D([s("w3m-email-login-view")],S);export{S as W3mEmailLoginView,g as W3mEmailOtpWidget,O as W3mEmailVerifyDeviceView,y as W3mEmailVerifyOtpView,R as W3mUpdateEmailPrimaryOtpView,_ as W3mUpdateEmailSecondaryOtpView,A as W3mUpdateEmailWalletView};
