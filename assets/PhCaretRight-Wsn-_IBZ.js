import{n as t,Y as e,t as r,p as l,O as o,s as i}from"./property-Dy6jfSJI.js";var a=Object.defineProperty,s=Object.getOwnPropertyDescriptor,p=(t,e,r,l)=>{for(var o,i=l>1?void 0:l?s(e,r):e,p=t.length-1;p>=0;p--)(o=t[p])&&(i=(l?o(e,r,i):o(i))||i);return l&&i&&a(e,r,i),i};let h=class extends t{constructor(){super(...arguments),this.size="1em",this.weight="regular",this.color="currentColor",this.mirrored=!1}render(){var t;return e`<svg
      xmlns="http://www.w3.org/2000/svg"
      width="${this.size}"
      height="${this.size}"
      fill="${this.color}"
      viewBox="0 0 256 256"
      transform=${this.mirrored?"scale(-1, 1)":null}
    >
      ${h.weightsMap.get(null!=(t=this.weight)?t:"regular")}
    </svg>`}};h.weightsMap=new Map([["thin",r`<path d="M178.83,130.83l-80,80a4,4,0,0,1-5.66-5.66L170.34,128,93.17,50.83a4,4,0,0,1,5.66-5.66l80,80A4,4,0,0,1,178.83,130.83Z"/>`],["light",r`<path d="M180.24,132.24l-80,80a6,6,0,0,1-8.48-8.48L167.51,128,91.76,52.24a6,6,0,0,1,8.48-8.48l80,80A6,6,0,0,1,180.24,132.24Z"/>`],["regular",r`<path d="M181.66,133.66l-80,80a8,8,0,0,1-11.32-11.32L164.69,128,90.34,53.66a8,8,0,0,1,11.32-11.32l80,80A8,8,0,0,1,181.66,133.66Z"/>`],["bold",r`<path d="M184.49,136.49l-80,80a12,12,0,0,1-17-17L159,128,87.51,56.49a12,12,0,1,1,17-17l80,80A12,12,0,0,1,184.49,136.49Z"/>`],["fill",r`<path d="M181.66,133.66l-80,80A8,8,0,0,1,88,208V48a8,8,0,0,1,13.66-5.66l80,80A8,8,0,0,1,181.66,133.66Z"/>`],["duotone",r`<path d="M176,128,96,208V48Z" opacity="0.2"/><path d="M181.66,122.34l-80-80A8,8,0,0,0,88,48V208a8,8,0,0,0,13.66,5.66l80-80A8,8,0,0,0,181.66,122.34ZM104,188.69V67.31L164.69,128Z"/>`]]),h.styles=l`
    :host {
      display: contents;
    }
  `,p([o({type:String,reflect:!0})],h.prototype,"size",2),p([o({type:String,reflect:!0})],h.prototype,"weight",2),p([o({type:String,reflect:!0})],h.prototype,"color",2),p([o({type:Boolean,reflect:!0})],h.prototype,"mirrored",2),h=p([i("ph-caret-right")],h);export{h as PhCaretRight};
