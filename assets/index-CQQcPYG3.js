import{i as d,r as u,Z as p,c as m,x as f}from"./index-BO93Lj1w.js";import{n as h,c as g}from"./if-defined-BvDQp8Yv.js";const v=d`
  :host {
    display: block;
    width: var(--local-width);
    height: var(--local-height);
  }

  img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center center;
    border-radius: inherit;
  }
`;var l=function(o,t,r,s){var c=arguments.length,e=c<3?t:s===null?s=Object.getOwnPropertyDescriptor(t,r):s,n;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")e=Reflect.decorate(o,t,r,s);else for(var a=o.length-1;a>=0;a--)(n=o[a])&&(e=(c<3?n(e):c>3?n(t,r,e):n(t,r))||e);return c>3&&e&&Object.defineProperty(t,r,e),e};let i=class extends m{constructor(){super(...arguments),this.src="./path/to/image.jpg",this.alt="Image",this.size=void 0}render(){return this.style.cssText=`
      --local-width: ${this.size?`var(--wui-icon-size-${this.size});`:"100%"};
      --local-height: ${this.size?`var(--wui-icon-size-${this.size});`:"100%"};
      `,f`<img src=${this.src} alt=${this.alt} @error=${this.handleImageError} />`}handleImageError(){this.dispatchEvent(new CustomEvent("onLoadError",{bubbles:!0,composed:!0}))}};i.styles=[u,p,v];l([h()],i.prototype,"src",void 0);l([h()],i.prototype,"alt",void 0);l([h()],i.prototype,"size",void 0);i=l([g("wui-image")],i);
