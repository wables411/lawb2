import{i as t,r,e,n as o,c as i,a,x as s}from"./appkit-vendor-pQ-e_G2v.js";const n=t`
  :host {
    display: block;
  }

  :host > button {
    gap: var(--wui-spacing-xxs);
    padding: var(--wui-spacing-xs);
    padding-right: var(--wui-spacing-1xs);
    height: 40px;
    border-radius: var(--wui-border-radius-l);
    background: var(--wui-color-gray-glass-002);
    border-width: 0px;
    box-shadow: inset 0 0 0 1px var(--wui-color-gray-glass-002);
  }

  :host > button wui-image {
    width: 24px;
    height: 24px;
    border-radius: var(--wui-border-radius-s);
    box-shadow: inset 0 0 0 1px var(--wui-color-gray-glass-010);
  }
`;var c=function(t,r,e,o){var i,a=arguments.length,s=a<3?r:null===o?o=Object.getOwnPropertyDescriptor(r,e):o;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)s=Reflect.decorate(t,r,e,o);else for(var n=t.length-1;n>=0;n--)(i=t[n])&&(s=(a<3?i(s):a>3?i(r,e,s):i(r,e))||s);return a>3&&s&&Object.defineProperty(r,e,s),s};let u=class extends a{constructor(){super(...arguments),this.text=""}render(){return s`
      <button>
        ${this.tokenTemplate()}
        <wui-text variant="paragraph-600" color="fg-100">${this.text}</wui-text>
      </button>
    `}tokenTemplate(){return this.imageSrc?s`<wui-image src=${this.imageSrc}></wui-image>`:s`
      <wui-icon-box
        size="sm"
        iconColor="fg-200"
        backgroundColor="fg-300"
        icon="networkPlaceholder"
      ></wui-icon-box>
    `}};u.styles=[r,e,n],c([o()],u.prototype,"imageSrc",void 0),c([o()],u.prototype,"text",void 0),u=c([i("wui-token-button")],u);
