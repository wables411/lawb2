import{ba as c,bi as m,bb as f,bd as d}from"./index-D9KCE1j5.js";import{n as u,c as b,o as v}from"./if-defined-DQAiGHWw.js";import"./index-DotAa_rI.js";const w=c`
  :host {
    position: relative;
    display: inline-block;
  }

  wui-text {
    margin: var(--wui-spacing-xxs) var(--wui-spacing-m) var(--wui-spacing-0) var(--wui-spacing-m);
  }
`;var a=function(o,i,r,s){var n=arguments.length,e=n<3?i:s===null?s=Object.getOwnPropertyDescriptor(i,r):s,l;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")e=Reflect.decorate(o,i,r,s);else for(var p=o.length-1;p>=0;p--)(l=o[p])&&(e=(n<3?l(e):n>3?l(i,r,e):l(i,r))||e);return n>3&&e&&Object.defineProperty(i,r,e),e};let t=class extends f{constructor(){super(...arguments),this.disabled=!1}render(){return d`
      <wui-input-text
        type="email"
        placeholder="Email"
        icon="mail"
        size="mdl"
        .disabled=${this.disabled}
        .value=${this.value}
        data-testid="wui-email-input"
        tabIdx=${v(this.tabIdx)}
      ></wui-input-text>
      ${this.templateError()}
    `}templateError(){return this.errorMessage?d`<wui-text variant="tiny-500" color="error-100">${this.errorMessage}</wui-text>`:null}};t.styles=[m,w];a([u()],t.prototype,"errorMessage",void 0);a([u({type:Boolean})],t.prototype,"disabled",void 0);a([u()],t.prototype,"value",void 0);a([u()],t.prototype,"tabIdx",void 0);t=a([b("wui-email-input")],t);
