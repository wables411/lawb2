import{c as e,r as t,e as i,n as o,a as r,i as n,x as s,U as a,o as c,g as l}from"./react-DIiIfL9I.js";import{a as d,S as u,j as p,T as w,g as h,W as m,R as g,b as f}from"./W3MFrameProviderSingleton-CqxSc5tp.js";import"./react-vendor-BlDtUSDV.js";import"./NetworkUtil-8PBlJxlj.js";import"./wagmi-vendor-CiBmrtm3.js";import"./index-CFYEtFbK.js";const b=e`
  button {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: ${({spacing:e})=>e[4]};
    background-color: ${({tokens:e})=>e.theme.foregroundPrimary};
    border-radius: ${({borderRadius:e})=>e[3]};
    border: none;
    padding: ${({spacing:e})=>e[3]};
    transition: background-color ${({durations:e})=>e.lg}
      ${({easings:e})=>e["ease-out-power-2"]};
    will-change: background-color;
  }

  /* -- Hover & Active states ----------------------------------------------------------- */
  button:hover:enabled,
  button:active:enabled {
    background-color: ${({tokens:e})=>e.theme.foregroundSecondary};
  }

  wui-text {
    flex: 1;
    color: ${({tokens:e})=>e.theme.textSecondary};
  }

  wui-flex {
    width: auto;
    display: flex;
    align-items: center;
    gap: ${({spacing:e})=>e["01"]};
  }

  wui-icon {
    color: ${({tokens:e})=>e.theme.iconDefault};
  }

  .network-icon {
    position: relative;
    width: 20px;
    height: 20px;
    border-radius: ${({borderRadius:e})=>e[4]};
    overflow: hidden;
    margin-left: -8px;
  }

  .network-icon:first-child {
    margin-left: 0px;
  }

  .network-icon:after {
    position: absolute;
    inset: 0;
    content: '';
    display: block;
    height: 100%;
    width: 100%;
    border-radius: ${({borderRadius:e})=>e[4]};
    box-shadow: inset 0 0 0 1px ${({tokens:e})=>e.core.glass010};
  }
`;var k=function(e,t,i,o){var r,n=arguments.length,s=n<3?t:null===o?o=Object.getOwnPropertyDescriptor(t,i):o;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)s=Reflect.decorate(e,t,i,o);else for(var a=e.length-1;a>=0;a--)(r=e[a])&&(s=(n<3?r(s):n>3?r(t,i,s):r(t,i))||s);return n>3&&s&&Object.defineProperty(t,i,s),s};let v=class extends n{constructor(){super(...arguments),this.networkImages=[""],this.text=""}render(){return s`
      <button>
        <wui-text variant="md-regular" color="inherit">${this.text}</wui-text>
        <wui-flex>
          ${this.networksTemplate()}
          <wui-icon name="chevronRight" size="sm" color="inherit"></wui-icon>
        </wui-flex>
      </button>
    `}networksTemplate(){const e=this.networkImages.slice(0,5);return s` <wui-flex class="networks">
      ${null==e?void 0:e.map(e=>s` <wui-flex class="network-icon"> <wui-image src=${e}></wui-image> </wui-flex>`)}
    </wui-flex>`}};v.styles=[t,i,b],k([o({type:Array})],v.prototype,"networkImages",void 0),k([o()],v.prototype,"text",void 0),v=k([r("wui-compatible-network")],v);const y=e`
  wui-compatible-network {
    margin-top: ${({spacing:e})=>e[4]};
    width: 100%;
  }

  wui-qr-code {
    width: unset !important;
    height: unset !important;
  }

  wui-icon {
    align-items: normal;
  }
`;var x=function(e,t,i,o){var r,n=arguments.length,s=n<3?t:null===o?o=Object.getOwnPropertyDescriptor(t,i):o;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)s=Reflect.decorate(e,t,i,o);else for(var a=e.length-1;a>=0;a--)(r=e[a])&&(s=(n<3?r(s):n>3?r(t,i,s):r(t,i))||s);return n>3&&s&&Object.defineProperty(t,i,s),s};let $=class extends n{constructor(){var e,t;super(),this.unsubscribe=[],this.address=null==(e=d.getAccountData())?void 0:e.address,this.profileName=null==(t=d.getAccountData())?void 0:t.profileName,this.network=d.state.activeCaipNetwork,this.unsubscribe.push(d.subscribeChainProp("accountState",e=>{e?(this.address=e.address,this.profileName=e.profileName):u.showError("Account not found")}),d.subscribeKey("activeCaipNetwork",e=>{(null==e?void 0:e.id)&&(this.network=e)}))}disconnectedCallback(){this.unsubscribe.forEach(e=>e())}render(){if(!this.address)throw new Error("w3m-wallet-receive-view: No account provided");const e=p.getNetworkImage(this.network);return s` <wui-flex
      flexDirection="column"
      .padding=${["0","4","4","4"]}
      alignItems="center"
    >
      <wui-chip-button
        data-testid="receive-address-copy-button"
        @click=${this.onCopyClick.bind(this)}
        text=${a.getTruncateString({string:this.profileName||this.address||"",charsStart:this.profileName?18:4,charsEnd:this.profileName?0:4,truncate:this.profileName?"end":"middle"})}
        icon="copy"
        size="sm"
        imageSrc=${e||""}
        variant="gray"
      ></wui-chip-button>
      <wui-flex
        flexDirection="column"
        .padding=${["4","0","0","0"]}
        alignItems="center"
        gap="4"
      >
        <wui-qr-code
          size=${232}
          theme=${w.state.themeMode}
          uri=${this.address}
          ?arenaClear=${!0}
          color=${c(w.state.themeVariables["--w3m-qr-color"])}
          data-testid="wui-qr-code"
        ></wui-qr-code>
        <wui-text variant="lg-regular" color="primary" align="center">
          Copy your address or scan this QR code
        </wui-text>
        <wui-button @click=${this.onCopyClick.bind(this)} size="sm" variant="neutral-secondary">
          <wui-icon slot="iconLeft" size="sm" color="inherit" name="copy"></wui-icon>
          <wui-text variant="md-regular" color="inherit">Copy address</wui-text>
        </wui-button>
      </wui-flex>
      ${this.networkTemplate()}
    </wui-flex>`}networkTemplate(){var e;const t=d.getAllRequestedCaipNetworks(),i=d.checkIfSmartAccountEnabled(),o=d.state.activeCaipNetwork,r=t.filter(e=>(null==e?void 0:e.chainNamespace)===(null==o?void 0:o.chainNamespace));if(h(null==o?void 0:o.chainNamespace)===m.ACCOUNT_TYPES.SMART_ACCOUNT&&i)return o?s`<wui-compatible-network
        @click=${this.onReceiveClick.bind(this)}
        text="Only receive assets on this network"
        .networkImages=${[p.getNetworkImage(o)??""]}
      ></wui-compatible-network>`:null;const n=(null==(e=null==r?void 0:r.filter(e=>{var t;return null==(t=null==e?void 0:e.assets)?void 0:t.imageId}))?void 0:e.slice(0,5)).map(p.getNetworkImage).filter(Boolean);return s`<wui-compatible-network
      @click=${this.onReceiveClick.bind(this)}
      text="Only receive assets on these networks"
      .networkImages=${n}
    ></wui-compatible-network>`}onReceiveClick(){g.push("WalletCompatibleNetworks")}onCopyClick(){try{this.address&&(f.copyToClopboard(this.address),u.showSuccess("Address copied"))}catch{u.showError("Failed to copy")}}};$.styles=y,x([l()],$.prototype,"address",void 0),x([l()],$.prototype,"profileName",void 0),x([l()],$.prototype,"network",void 0),$=x([r("w3m-wallet-receive-view")],$);export{$ as W3mWalletReceiveView};
