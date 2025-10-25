import{n as t,Y as e,t as r,p as a,O as l,s as o}from"./property-Dy6jfSJI.js";var i=Object.defineProperty,s=Object.getOwnPropertyDescriptor,p=(t,e,r,a)=>{for(var l,o=a>1?void 0:a?s(e,r):e,p=t.length-1;p>=0;p--)(l=t[p])&&(o=(a?l(e,r,o):l(o))||o);return a&&o&&i(e,r,o),o};let h=class extends t{constructor(){super(...arguments),this.size="1em",this.weight="regular",this.color="currentColor",this.mirrored=!1}render(){var t;return e`<svg
      xmlns="http://www.w3.org/2000/svg"
      width="${this.size}"
      height="${this.size}"
      fill="${this.color}"
      viewBox="0 0 256 256"
      transform=${this.mirrored?"scale(-1, 1)":null}
    >
      ${h.weightsMap.get(null!=(t=this.weight)?t:"regular")}
    </svg>`}};h.weightsMap=new Map([["thin",r`<path d="M162.83,205.17a4,4,0,0,1-5.66,5.66l-80-80a4,4,0,0,1,0-5.66l80-80a4,4,0,1,1,5.66,5.66L85.66,128Z"/>`],["light",r`<path d="M164.24,203.76a6,6,0,1,1-8.48,8.48l-80-80a6,6,0,0,1,0-8.48l80-80a6,6,0,0,1,8.48,8.48L88.49,128Z"/>`],["regular",r`<path d="M165.66,202.34a8,8,0,0,1-11.32,11.32l-80-80a8,8,0,0,1,0-11.32l80-80a8,8,0,0,1,11.32,11.32L91.31,128Z"/>`],["bold",r`<path d="M168.49,199.51a12,12,0,0,1-17,17l-80-80a12,12,0,0,1,0-17l80-80a12,12,0,0,1,17,17L97,128Z"/>`],["fill",r`<path d="M168,48V208a8,8,0,0,1-13.66,5.66l-80-80a8,8,0,0,1,0-11.32l80-80A8,8,0,0,1,168,48Z"/>`],["duotone",r`<path d="M160,48V208L80,128Z" opacity="0.2"/><path d="M163.06,40.61a8,8,0,0,0-8.72,1.73l-80,80a8,8,0,0,0,0,11.32l80,80A8,8,0,0,0,168,208V48A8,8,0,0,0,163.06,40.61ZM152,188.69,91.31,128,152,67.31Z"/>`]]),h.styles=a`
    :host {
      display: contents;
    }
  `,p([l({type:String,reflect:!0})],h.prototype,"size",2),p([l({type:String,reflect:!0})],h.prototype,"weight",2),p([l({type:String,reflect:!0})],h.prototype,"color",2),p([l({type:Boolean,reflect:!0})],h.prototype,"mirrored",2),h=p([o("ph-caret-left")],h);export{h as PhCaretLeft};
