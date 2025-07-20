import{i as u,r as p,n as b,Z as f,c as h,x as v}from"./index-B_DY_Lri.js";import{n as c,c as m}from"./if-defined-62Gt0pMX.js";const w=u`
  button {
    border-radius: var(--local-border-radius);
    color: var(--wui-color-fg-100);
    padding: var(--local-padding);
  }

  @media (max-width: 700px) {
    button {
      padding: var(--wui-spacing-s);
    }
  }

  button > wui-icon {
    pointer-events: none;
  }

  button:disabled > wui-icon {
    color: var(--wui-color-bg-300) !important;
  }

  button:disabled {
    background-color: transparent;
  }
`;var n=function(r,o,e,s){var d=arguments.length,i=d<3?o:s===null?s=Object.getOwnPropertyDescriptor(o,e):s,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")i=Reflect.decorate(r,o,e,s);else for(var l=r.length-1;l>=0;l--)(a=r[l])&&(i=(d<3?a(i):d>3?a(o,e,i):a(o,e))||i);return d>3&&i&&Object.defineProperty(o,e,i),i};let t=class extends h{constructor(){super(...arguments),this.size="md",this.disabled=!1,this.icon="copy",this.iconColor="inherit"}render(){const o=this.size==="lg"?"--wui-border-radius-xs":"--wui-border-radius-xxs",e=this.size==="lg"?"--wui-spacing-1xs":"--wui-spacing-2xs";return this.style.cssText=`
    --local-border-radius: var(${o});
    --local-padding: var(${e});
`,v`
      <button ?disabled=${this.disabled}>
        <wui-icon color=${this.iconColor} size=${this.size} name=${this.icon}></wui-icon>
      </button>
    `}};t.styles=[p,b,f,w];n([c()],t.prototype,"size",void 0);n([c({type:Boolean})],t.prototype,"disabled",void 0);n([c()],t.prototype,"icon",void 0);n([c()],t.prototype,"iconColor",void 0);t=n([m("wui-icon-link")],t);
