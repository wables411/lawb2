import{n as t,Y as e,t as r,p as a,O as o,s as i}from"./property-Dy6jfSJI.js";var s=Object.defineProperty,h=Object.getOwnPropertyDescriptor,p=(t,e,r,a)=>{for(var o,i=a>1?void 0:a?h(e,r):e,p=t.length-1;p>=0;p--)(o=t[p])&&(i=(a?o(e,r,i):o(i))||i);return a&&i&&s(e,r,i),i};let l=class extends t{constructor(){super(...arguments),this.size="1em",this.weight="regular",this.color="currentColor",this.mirrored=!1}render(){var t;return e`<svg
      xmlns="http://www.w3.org/2000/svg"
      width="${this.size}"
      height="${this.size}"
      fill="${this.color}"
      viewBox="0 0 256 256"
      transform=${this.mirrored?"scale(-1, 1)":null}
    >
      ${l.weightsMap.get(null!=(t=this.weight)?t:"regular")}
    </svg>`}};l.weightsMap=new Map([["thin",r`<path d="M136,128a8,8,0,1,1-8-8A8,8,0,0,1,136,128Zm-76-8a8,8,0,1,0,8,8A8,8,0,0,0,60,120Zm136,0a8,8,0,1,0,8,8A8,8,0,0,0,196,120Z"/>`],["light",r`<path d="M138,128a10,10,0,1,1-10-10A10,10,0,0,1,138,128ZM60,118a10,10,0,1,0,10,10A10,10,0,0,0,60,118Zm136,0a10,10,0,1,0,10,10A10,10,0,0,0,196,118Z"/>`],["regular",r`<path d="M140,128a12,12,0,1,1-12-12A12,12,0,0,1,140,128Zm56-12a12,12,0,1,0,12,12A12,12,0,0,0,196,116ZM60,116a12,12,0,1,0,12,12A12,12,0,0,0,60,116Z"/>`],["bold",r`<path d="M144,128a16,16,0,1,1-16-16A16,16,0,0,1,144,128ZM60,112a16,16,0,1,0,16,16A16,16,0,0,0,60,112Zm136,0a16,16,0,1,0,16,16A16,16,0,0,0,196,112Z"/>`],["fill",r`<path d="M224,80H32A16,16,0,0,0,16,96v64a16,16,0,0,0,16,16H224a16,16,0,0,0,16-16V96A16,16,0,0,0,224,80ZM60,140a12,12,0,1,1,12-12A12,12,0,0,1,60,140Zm68,0a12,12,0,1,1,12-12A12,12,0,0,1,128,140Zm68,0a12,12,0,1,1,12-12A12,12,0,0,1,196,140Z"/>`],["duotone",r`<path d="M240,96v64a16,16,0,0,1-16,16H32a16,16,0,0,1-16-16V96A16,16,0,0,1,32,80H224A16,16,0,0,1,240,96Z" opacity="0.2"/><path d="M140,128a12,12,0,1,1-12-12A12,12,0,0,1,140,128Zm56-12a12,12,0,1,0,12,12A12,12,0,0,0,196,116ZM60,116a12,12,0,1,0,12,12A12,12,0,0,0,60,116Z"/>`]]),l.styles=a`
    :host {
      display: contents;
    }
  `,p([o({type:String,reflect:!0})],l.prototype,"size",2),p([o({type:String,reflect:!0})],l.prototype,"weight",2),p([o({type:String,reflect:!0})],l.prototype,"color",2),p([o({type:Boolean,reflect:!0})],l.prototype,"mirrored",2),l=p([i("ph-dots-three")],l);export{l as PhDotsThree};
