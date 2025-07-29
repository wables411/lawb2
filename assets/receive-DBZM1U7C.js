import{ba as C,bi as A,bs as R,bb as k,bd as u,bl as m,bn as d,bq as h,bE as b,bf as x,bp as T,br as I,bm as S}from"./index-CGmOcmEc.js";import{n as N,c as $,U as E,o as O,r as f}from"./if-defined-CT0IUcjt.js";import"./index-CYHF7PAA.js";import"./index-BM-kMNf7.js";import"./index-YlVoan1n.js";const _=C`
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
`;var g=function(n,e,i,t){var s=arguments.length,r=s<3?e:t===null?t=Object.getOwnPropertyDescriptor(e,i):t,o;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")r=Reflect.decorate(n,e,i,t);else for(var a=n.length-1;a>=0;a--)(o=n[a])&&(r=(s<3?o(r):s>3?o(e,i,r):o(e,i))||r);return s>3&&r&&Object.defineProperty(e,i,r),r};let p=class extends k{constructor(){super(...arguments),this.networkImages=[""],this.text=""}render(){return u`
      <button>
        <wui-text variant="small-400" color="fg-200">${this.text}</wui-text>
        <wui-flex gap="3xs" alignItems="center">
          ${this.networksTemplate()}
          <wui-icon name="chevronRight" size="sm" color="fg-200"></wui-icon>
        </wui-flex>
      </button>
    `}networksTemplate(){const e=this.networkImages.slice(0,5);return u` <wui-flex class="networks">
      ${e==null?void 0:e.map(i=>u` <wui-flex class="network-icon"> <wui-image src=${i}></wui-image> </wui-flex>`)}
    </wui-flex>`}};p.styles=[A,R,_];g([N({type:Array})],p.prototype,"networkImages",void 0);g([N()],p.prototype,"text",void 0);p=g([$("wui-compatible-network")],p);const W=C`
  wui-compatible-network {
    margin-top: var(--wui-spacing-l);
  }
`;var w=function(n,e,i,t){var s=arguments.length,r=s<3?e:t===null?t=Object.getOwnPropertyDescriptor(e,i):t,o;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")r=Reflect.decorate(n,e,i,t);else for(var a=n.length-1;a>=0;a--)(o=n[a])&&(r=(s<3?o(r):s>3?o(e,i,r):o(e,i))||r);return s>3&&r&&Object.defineProperty(e,i,r),r};let l=class extends k{constructor(){super(),this.unsubscribe=[],this.address=m.state.address,this.profileName=m.state.profileName,this.network=d.state.activeCaipNetwork,this.preferredAccountTypes=m.state.preferredAccountTypes,this.unsubscribe.push(m.subscribe(e=>{e.address?(this.address=e.address,this.profileName=e.profileName,this.preferredAccountTypes=e.preferredAccountTypes):h.showError("Account not found")}),d.subscribeKey("activeCaipNetwork",e=>{e!=null&&e.id&&(this.network=e)}))}disconnectedCallback(){this.unsubscribe.forEach(e=>e())}render(){if(!this.address)throw new Error("w3m-wallet-receive-view: No account provided");const e=b.getNetworkImage(this.network);return u` <wui-flex
      flexDirection="column"
      .padding=${["0","l","l","l"]}
      alignItems="center"
    >
      <wui-chip-button
        data-testid="receive-address-copy-button"
        @click=${this.onCopyClick.bind(this)}
        text=${E.getTruncateString({string:this.profileName||this.address||"",charsStart:this.profileName?18:4,charsEnd:this.profileName?0:4,truncate:this.profileName?"end":"middle"})}
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
          theme=${x.state.themeMode}
          uri=${this.address}
          ?arenaClear=${!0}
          color=${O(x.state.themeVariables["--w3m-qr-color"])}
          data-testid="wui-qr-code"
        ></wui-qr-code>
        <wui-text variant="paragraph-500" color="fg-100" align="center">
          Copy your address or scan this QR code
        </wui-text>
      </wui-flex>
      ${this.networkTemplate()}
    </wui-flex>`}networkTemplate(){var a,y;const e=d.getAllRequestedCaipNetworks(),i=d.checkIfSmartAccountEnabled(),t=d.state.activeCaipNetwork,s=e.filter(c=>(c==null?void 0:c.chainNamespace)===(t==null?void 0:t.chainNamespace));if(((a=this.preferredAccountTypes)==null?void 0:a[t==null?void 0:t.chainNamespace])===T.ACCOUNT_TYPES.SMART_ACCOUNT&&i)return t?u`<wui-compatible-network
        @click=${this.onReceiveClick.bind(this)}
        text="Only receive assets on this network"
        .networkImages=${[b.getNetworkImage(t)??""]}
      ></wui-compatible-network>`:null;const o=((y=s==null?void 0:s.filter(c=>{var v;return(v=c==null?void 0:c.assets)==null?void 0:v.imageId}))==null?void 0:y.slice(0,5)).map(b.getNetworkImage).filter(Boolean);return u`<wui-compatible-network
      @click=${this.onReceiveClick.bind(this)}
      text="Only receive assets on these networks"
      .networkImages=${o}
    ></wui-compatible-network>`}onReceiveClick(){I.push("WalletCompatibleNetworks")}onCopyClick(){try{this.address&&(S.copyToClopboard(this.address),h.showSuccess("Address copied"))}catch{h.showError("Failed to copy")}}};l.styles=W;w([f()],l.prototype,"address",void 0);w([f()],l.prototype,"profileName",void 0);w([f()],l.prototype,"network",void 0);w([f()],l.prototype,"preferredAccountTypes",void 0);l=w([$("w3m-wallet-receive-view")],l);export{l as W3mWalletReceiveView};
