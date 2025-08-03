import{i as e,r as t,e as r,n as i,c as s,a as o,x as a,A as c,C as n,S as l,d,U as w,T as u,o as p,g as h,W as m,R as g,f,h as k}from"./appkit-vendor-pQ-e_G2v.js";import"./wagmi-vendor-dPYIeXYB.js";import"./react-vendor-CFG7hIzY.js";const v=e`
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
`;var b=function(e,t,r,i){var s,o=arguments.length,a=o<3?t:null===i?i=Object.getOwnPropertyDescriptor(t,r):i;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)a=Reflect.decorate(e,t,r,i);else for(var c=e.length-1;c>=0;c--)(s=e[c])&&(a=(o<3?s(a):o>3?s(t,r,a):s(t,r))||a);return o>3&&a&&Object.defineProperty(t,r,a),a};let x=class extends o{constructor(){super(...arguments),this.networkImages=[""],this.text=""}render(){return a`
      <button>
        <wui-text variant="small-400" color="fg-200">${this.text}</wui-text>
        <wui-flex gap="3xs" alignItems="center">
          ${this.networksTemplate()}
          <wui-icon name="chevronRight" size="sm" color="fg-200"></wui-icon>
        </wui-flex>
      </button>
    `}networksTemplate(){const e=this.networkImages.slice(0,5);return a` <wui-flex class="networks">
      ${e?.map(e=>a` <wui-flex class="network-icon"> <wui-image src=${e}></wui-image> </wui-flex>`)}
    </wui-flex>`}};x.styles=[t,r,v],b([i({type:Array})],x.prototype,"networkImages",void 0),b([i()],x.prototype,"text",void 0),x=b([s("wui-compatible-network")],x);const y=e`
  wui-compatible-network {
    margin-top: var(--wui-spacing-l);
  }
`;var N=function(e,t,r,i){var s,o=arguments.length,a=o<3?t:null===i?i=Object.getOwnPropertyDescriptor(t,r):i;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)a=Reflect.decorate(e,t,r,i);else for(var c=e.length-1;c>=0;c--)(s=e[c])&&(a=(o<3?s(a):o>3?s(t,r,a):s(t,r))||a);return o>3&&a&&Object.defineProperty(t,r,a),a};let C=class extends o{constructor(){super(),this.unsubscribe=[],this.address=c.state.address,this.profileName=c.state.profileName,this.network=n.state.activeCaipNetwork,this.unsubscribe.push(c.subscribe(e=>{e.address?(this.address=e.address,this.profileName=e.profileName):l.showError("Account not found")}),n.subscribeKey("activeCaipNetwork",e=>{e?.id&&(this.network=e)}))}disconnectedCallback(){this.unsubscribe.forEach(e=>e())}render(){if(!this.address)throw new Error("w3m-wallet-receive-view: No account provided");const e=d.getNetworkImage(this.network);return a` <wui-flex
      flexDirection="column"
      .padding=${["0","l","l","l"]}
      alignItems="center"
    >
      <wui-chip-button
        data-testid="receive-address-copy-button"
        @click=${this.onCopyClick.bind(this)}
        text=${w.getTruncateString({string:this.profileName||this.address||"",charsStart:this.profileName?18:4,charsEnd:this.profileName?0:4,truncate:this.profileName?"end":"middle"})}
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
          theme=${u.state.themeMode}
          uri=${this.address}
          ?arenaClear=${!0}
          color=${p(u.state.themeVariables["--w3m-qr-color"])}
          data-testid="wui-qr-code"
        ></wui-qr-code>
        <wui-text variant="paragraph-500" color="fg-100" align="center">
          Copy your address or scan this QR code
        </wui-text>
      </wui-flex>
      ${this.networkTemplate()}
    </wui-flex>`}networkTemplate(){const e=n.getAllRequestedCaipNetworks(),t=n.checkIfSmartAccountEnabled(),r=n.state.activeCaipNetwork,i=e.filter(e=>e?.chainNamespace===r?.chainNamespace);if(h(r?.chainNamespace)===m.ACCOUNT_TYPES.SMART_ACCOUNT&&t)return r?a`<wui-compatible-network
        @click=${this.onReceiveClick.bind(this)}
        text="Only receive assets on this network"
        .networkImages=${[d.getNetworkImage(r)??""]}
      ></wui-compatible-network>`:null;const s=i?.filter(e=>e?.assets?.imageId)?.slice(0,5),o=s.map(d.getNetworkImage).filter(Boolean);return a`<wui-compatible-network
      @click=${this.onReceiveClick.bind(this)}
      text="Only receive assets on these networks"
      .networkImages=${o}
    ></wui-compatible-network>`}onReceiveClick(){g.push("WalletCompatibleNetworks")}onCopyClick(){try{this.address&&(f.copyToClopboard(this.address),l.showSuccess("Address copied"))}catch{l.showError("Failed to copy")}}};C.styles=y,N([k()],C.prototype,"address",void 0),N([k()],C.prototype,"profileName",void 0),N([k()],C.prototype,"network",void 0),C=N([s("w3m-wallet-receive-view")],C);export{C as W3mWalletReceiveView};
