import{i as e,F as t,G as i,H as r,d as o,c as s,x as a,A as n,n as c,S as l,I as d,U as u,T as w,J as p,l as h,W as m,R as g,o as f,K as v}from"./index-BfeUJwwo.js";import"./wagmi-vendor-D-kpDhCQ.js";import"./react-vendor-ZyuiJZO_.js";import"./chess-vendor-JTxzwGi1.js";import"./ui-vendor-BgPmeekb.js";const k=e`
  button {
    display: flex;
    gap: var(--wui-spacing-xl);
    width: 100%;
    background-color: var(--wui-color-gray-glass-002);
    border-radius: var(--wui-border-radius-xxs);
    padding: var(--wui-spacing-m) var(--wui-spacing-s);
  }

  wui-text {
    width: 100%;
  }

  wui-flex {
    width: auto;
  }

  .network-icon {
    width: var(--wui-spacing-2l);
    height: var(--wui-spacing-2l);
    border-radius: calc(var(--wui-spacing-2l) / 2);
    overflow: hidden;
    box-shadow:
      0 0 0 3px var(--wui-color-gray-glass-002),
      0 0 0 3px var(--wui-color-modal-bg);
  }
`;var b=function(e,t,i,r){var o,s=arguments.length,a=s<3?t:null===r?r=Object.getOwnPropertyDescriptor(t,i):r;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)a=Reflect.decorate(e,t,i,r);else for(var n=e.length-1;n>=0;n--)(o=e[n])&&(a=(s<3?o(a):s>3?o(t,i,a):o(t,i))||a);return s>3&&a&&Object.defineProperty(t,i,a),a};let x=class extends s{constructor(){super(...arguments),this.networkImages=[""],this.text=""}render(){return a`
      <button>
        <wui-text variant="small-400" color="fg-200">${this.text}</wui-text>
        <wui-flex gap="3xs" alignItems="center">
          ${this.networksTemplate()}
          <wui-icon name="chevronRight" size="sm" color="fg-200"></wui-icon>
        </wui-flex>
      </button>
    `}networksTemplate(){const e=this.networkImages.slice(0,5);return a` <wui-flex class="networks">
      ${null==e?void 0:e.map(e=>a` <wui-flex class="network-icon"> <wui-image src=${e}></wui-image> </wui-flex>`)}
    </wui-flex>`}};x.styles=[t,i,k],b([r({type:Array})],x.prototype,"networkImages",void 0),b([r()],x.prototype,"text",void 0),x=b([o("wui-compatible-network")],x);const y=e`
  wui-compatible-network {
    margin-top: var(--wui-spacing-l);
  }
`;var N=function(e,t,i,r){var o,s=arguments.length,a=s<3?t:null===r?r=Object.getOwnPropertyDescriptor(t,i):r;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)a=Reflect.decorate(e,t,i,r);else for(var n=e.length-1;n>=0;n--)(o=e[n])&&(a=(s<3?o(a):s>3?o(t,i,a):o(t,i))||a);return s>3&&a&&Object.defineProperty(t,i,a),a};let C=class extends s{constructor(){super(),this.unsubscribe=[],this.address=n.state.address,this.profileName=n.state.profileName,this.network=c.state.activeCaipNetwork,this.unsubscribe.push(n.subscribe(e=>{e.address?(this.address=e.address,this.profileName=e.profileName):l.showError("Account not found")}),c.subscribeKey("activeCaipNetwork",e=>{(null==e?void 0:e.id)&&(this.network=e)}))}disconnectedCallback(){this.unsubscribe.forEach(e=>e())}render(){if(!this.address)throw new Error("w3m-wallet-receive-view: No account provided");const e=d.getNetworkImage(this.network);return a` <wui-flex
      flexDirection="column"
      .padding=${["0","l","l","l"]}
      alignItems="center"
    >
      <wui-chip-button
        data-testid="receive-address-copy-button"
        @click=${this.onCopyClick.bind(this)}
        text=${u.getTruncateString({string:this.profileName||this.address||"",charsStart:this.profileName?18:4,charsEnd:this.profileName?0:4,truncate:this.profileName?"end":"middle"})}
        icon="copy"
        size="sm"
        imageSrc=${e||""}
        variant="gray"
      ></wui-chip-button>
      <wui-flex
        flexDirection="column"
        .padding=${["l","0","0","0"]}
        alignItems="center"
        gap="s"
      >
        <wui-qr-code
          size=${232}
          theme=${w.state.themeMode}
          uri=${this.address}
          ?arenaClear=${!0}
          color=${p(w.state.themeVariables["--w3m-qr-color"])}
          data-testid="wui-qr-code"
        ></wui-qr-code>
        <wui-text variant="paragraph-500" color="fg-100" align="center">
          Copy your address or scan this QR code
        </wui-text>
      </wui-flex>
      ${this.networkTemplate()}
    </wui-flex>`}networkTemplate(){var e;const t=c.getAllRequestedCaipNetworks(),i=c.checkIfSmartAccountEnabled(),r=c.state.activeCaipNetwork,o=t.filter(e=>(null==e?void 0:e.chainNamespace)===(null==r?void 0:r.chainNamespace));if(h(null==r?void 0:r.chainNamespace)===m.ACCOUNT_TYPES.SMART_ACCOUNT&&i)return r?a`<wui-compatible-network
        @click=${this.onReceiveClick.bind(this)}
        text="Only receive assets on this network"
        .networkImages=${[d.getNetworkImage(r)??""]}
      ></wui-compatible-network>`:null;const s=(null==(e=null==o?void 0:o.filter(e=>{var t;return null==(t=null==e?void 0:e.assets)?void 0:t.imageId}))?void 0:e.slice(0,5)).map(d.getNetworkImage).filter(Boolean);return a`<wui-compatible-network
      @click=${this.onReceiveClick.bind(this)}
      text="Only receive assets on these networks"
      .networkImages=${s}
    ></wui-compatible-network>`}onReceiveClick(){g.push("WalletCompatibleNetworks")}onCopyClick(){try{this.address&&(f.copyToClopboard(this.address),l.showSuccess("Address copied"))}catch{l.showError("Failed to copy")}}};C.styles=y,N([v()],C.prototype,"address",void 0),N([v()],C.prototype,"profileName",void 0),N([v()],C.prototype,"network",void 0),C=N([o("w3m-wallet-receive-view")],C);export{C as W3mWalletReceiveView};
