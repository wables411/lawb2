import{a6 as t,a0 as i,a1 as e,_ as a,$ as o,ai as r,R as n,I as s,S as l,ac as c,a5 as u,au as d,av as p}from"./index-s5jH-mwH.js";import{W as h}from"./index-CTE_RCoR.js";import{ReownAuthentication as m}from"./features-DVFtzyG-.js";import"./wagmi-vendor-cal8GwT5.js";import"./react-vendor-BlDtUSDV.js";import"./chess-vendor-BKDUb1NN.js";import"./ui-vendor-BJIjw2Nx.js";const g=t`
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
`;var w=function(t,i,e,a){var o,r=arguments.length,n=r<3?i:null===a?a=Object.getOwnPropertyDescriptor(i,e):a;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)n=Reflect.decorate(t,i,e,a);else for(var s=t.length-1;s>=0;s--)(o=t[s])&&(n=(r<3?o(n):r>3?o(i,e,n):o(i,e))||n);return r>3&&n&&Object.defineProperty(i,e,n),n};const f=["@gmail.com","@outlook.com","@yahoo.com","@hotmail.com","@aol.com","@icloud.com","@zoho.com"];let v=class extends i{constructor(){super(...arguments),this.email=""}render(){const t=f.filter(this.filter.bind(this)).map(this.item.bind(this));return 0===t.length?null:e`<div class="email-sufixes">${t}</div>`}filter(t){if(!this.email)return!1;const i=this.email.split("@");if(i.length<2)return!0;const e=i.pop();return t.includes(e)&&t!==`@${e}`}item(t){return e`<wui-button variant="neutral" size="sm" @click=${()=>{const i=this.email.split("@");i.length>1&&i.pop();const e=i[0]+t;this.dispatchEvent(new CustomEvent("change",{detail:e,bubbles:!0,composed:!0}))}}
      >${t}</wui-button
    >`}};v.styles=[g],w([a()],v.prototype,"email",void 0),v=w([o("w3m-email-suffixes-widget")],v);const x=t`
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
`;var b=function(t,i,e,a){var o,r=arguments.length,n=r<3?i:null===a?a=Object.getOwnPropertyDescriptor(i,e):a;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)n=Reflect.decorate(t,i,e,a);else for(var s=t.length-1;s>=0;s--)(o=t[s])&&(n=(r<3?o(n):r>3?o(i,e,n):o(i,e))||n);return r>3&&n&&Object.defineProperty(i,e,n),n};let y=class extends i{constructor(){super(...arguments),this.emails=[]}render(){return 0===this.emails.length?null:e`<div class="recent-emails">
      <wui-text variant="micro-600" color="fg-200" class="recent-emails-heading"
        >Recently used emails</wui-text
      >
      ${this.emails.map(this.item.bind(this))}
    </div>`}item(t){return e`<wui-list-item
      @click=${()=>{this.dispatchEvent(new CustomEvent("select",{detail:t,bubbles:!0,composed:!0}))}}
      ?chevron=${!0}
      icon="mail"
      iconVariant="overlay"
      class="recent-emails-list-item"
    >
      <wui-text variant="paragraph-500" color="fg-100">${t}</wui-text>
    </wui-list-item>`}};y.styles=[x],b([a()],y.prototype,"emails",void 0),y=b([o("w3m-recent-emails-widget")],y);var $=function(t,i,e,a){var o,r=arguments.length,n=r<3?i:null===a?a=Object.getOwnPropertyDescriptor(i,e):a;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)n=Reflect.decorate(t,i,e,a);else for(var s=t.length-1;s>=0;s--)(o=t[s])&&(n=(r<3?o(n):r>3?o(i,e,n):o(i,e))||n);return r>3&&n&&Object.defineProperty(i,e,n),n};let E=class extends h{constructor(){super(...arguments),this.siwx=r.state.siwx,this.onOtpSubmit=async t=>{await this.siwx.confirmEmailOtp({code:t}),n.replace("SIWXSignMessage")},this.onOtpResend=async t=>{const i=s.getAccountData();if(!(null==i?void 0:i.caipAddress))throw new Error("No account data found");await this.siwx.requestEmailOtp({email:t,account:i.caipAddress})}}connectedCallback(){this.siwx&&this.siwx instanceof m||l.showError("ReownAuthentication is not initialized."),super.connectedCallback()}shouldSubmitOnOtpChange(){return this.otp.length===h.OTP_LENGTH}};$([c()],E.prototype,"siwx",void 0),E=$([o("w3m-data-capture-otp-confirm-view")],E);const R=t`
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
`;var S=function(t,i,e,a){var o,r=arguments.length,n=r<3?i:null===a?a=Object.getOwnPropertyDescriptor(i,e):a;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)n=Reflect.decorate(t,i,e,a);else for(var s=t.length-1;s>=0;s--)(o=t[s])&&(n=(r<3?o(n):r>3?o(i,e,n):o(i,e))||n);return r>3&&n&&Object.defineProperty(i,e,n),n};let O=class extends i{constructor(){var t,i,e,a,o,l,c;super(...arguments),this.email=(null==(t=n.state.data)?void 0:t.email)??(null==(e=null==(i=s.getAccountData())?void 0:i.user)?void 0:e.email)??"",this.address=(null==(a=s.getAccountData())?void 0:a.address)??"",this.loading=!1,this.appName=(null==(o=r.state.metadata)?void 0:o.name)??"AppKit",this.siwx=r.state.siwx,this.isRequired=Array.isArray(null==(l=r.state.remoteFeatures)?void 0:l.emailCapture)&&(null==(c=r.state.remoteFeatures)?void 0:c.emailCapture.includes("required")),this.recentEmails=this.getRecentEmails()}connectedCallback(){this.siwx&&this.siwx instanceof m||l.showError("ReownAuthentication is not initialized. Please contact support."),super.connectedCallback()}firstUpdated(){this.loading=!1,this.recentEmails=this.getRecentEmails(),this.email&&this.onSubmit()}render(){return e`
      <wui-flex flexDirection="column" .padding=${["3xs","m","m","m"]} gap="l">
        ${this.hero()} ${this.paragraph()} ${this.emailInput()} ${this.recentEmailsWidget()}
        ${this.footerActions()}
      </wui-flex>
    `}hero(){return e`
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
    `}heroRow(t){return e`
      <div class="hero-row" data-state=${this.loading?"loading":"default"}>
        ${t.map(this.heroIcon.bind(this))}
      </div>
    `}heroIcon(t){return e`
      <wui-icon-box
        size="xl"
        iconSize="xxl"
        iconColor="fg-100"
        backgroundColor="fg-100"
        icon=${t}
        data-state=${this.loading?"loading":"default"}
        isOpaque
        class="hero-row-icon"
      >
      </wui-icon-box>
    `}paragraph(){return this.loading?e`
        <wui-text variant="paragraph-400" color="fg-200" align="center"
          >We are verifying your account with email
          <wui-text variant="paragraph-600" color="accent-100">${this.email}</wui-text> and address
          <wui-text variant="paragraph-600" color="fg-100">
            ${u.getTruncateString({string:this.address,charsEnd:4,charsStart:4,truncate:"middle"})} </wui-text
          >, please wait a moment.</wui-text
        >
      `:this.isRequired?e`
        <wui-text variant="paragraph-600" color="fg-100" align="center">
          ${this.appName} requires your email for authentication.
        </wui-text>
      `:e`
      <wui-flex flexDirection="column" gap="xs" alignItems="center">
        <wui-text variant="paragraph-600" color="fg-100" align="center" size>
          ${this.appName} would like to collect your email.
        </wui-text>

        <wui-text variant="small-400" color="fg-200" align="center">
          Don't worry, it's optional&mdash;you can skip this step.
        </wui-text>
      </wui-flex>
    `}emailInput(){if(this.loading)return null;const t=t=>{this.email=t.detail};return e`
      <wui-flex flexDirection="column">
        <wui-email-input
          .value=${this.email}
          .disabled=${this.loading}
          @inputChange=${t}
          @keydown=${t=>{"Enter"===t.key&&this.onSubmit()}}
        ></wui-email-input>

        <w3m-email-suffixes-widget
          .email=${this.email}
          @change=${t}
        ></w3m-email-suffixes-widget>
      </wui-flex>
    `}recentEmailsWidget(){if(0===this.recentEmails.length||this.loading)return null;return e`
      <w3m-recent-emails-widget
        .emails=${this.recentEmails}
        @select=${t=>{this.email=t.detail,this.onSubmit()}}
      ></w3m-recent-emails-widget>
    `}footerActions(){return e`
      <wui-flex flexDirection="row" fullWidth gap="s">
        ${this.isRequired?null:e`<wui-button
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
    `}async onSubmit(){if(!(this.siwx instanceof m))return void l.showError("ReownAuthentication is not initialized. Please contact support.");const t=s.getActiveCaipAddress();if(!t)throw new Error("Account is not connected.");if(this.isValidEmail(this.email))try{this.loading=!0;const i=await this.siwx.requestEmailOtp({email:this.email,account:t});this.pushRecentEmail(this.email),null===i.uuid?n.replace("SIWXSignMessage"):n.replace("DataCaptureOtpConfirm",{email:this.email})}catch(i){l.showError("Failed to send email OTP"),this.loading=!1}else l.showError("Please provide a valid email.")}onSkip(){n.replace("SIWXSignMessage")}getRecentEmails(){const t=d.getItem(p.RECENT_EMAILS);return(t?t.split(","):[]).filter(this.isValidEmail.bind(this)).slice(0,3)}pushRecentEmail(t){const i=this.getRecentEmails(),e=Array.from(new Set([t,...i])).slice(0,3);d.setItem(p.RECENT_EMAILS,e.join(","))}isValidEmail(t){return/^\S+@\S+\.\S+$/u.test(t)}};O.styles=[R],S([c()],O.prototype,"email",void 0),S([c()],O.prototype,"address",void 0),S([c()],O.prototype,"loading",void 0),S([c()],O.prototype,"appName",void 0),S([c()],O.prototype,"siwx",void 0),S([c()],O.prototype,"isRequired",void 0),S([c()],O.prototype,"recentEmails",void 0),O=S([o("w3m-data-capture-view")],O);export{E as W3mDataCaptureOtpConfirmView,O as W3mDataCaptureView,v as W3mEmailSuffixesWidget,y as W3mRecentEmailsWidget};
