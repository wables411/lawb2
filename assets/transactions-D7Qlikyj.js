import{ba as f,bb as a,bd as m}from"./index-D9KCE1j5.js";import{c as p}from"./if-defined-DQAiGHWw.js";import"./index-DtZwUe8P.js";import"./index-Cy4tRR0v.js";import"./index-Br4NnAqs.js";import"./index-DwSlRQuN.js";import"./index-CJbnWkNz.js";import"./index-BYzdtPNL.js";const d=f`
  :host > wui-flex:first-child {
    height: 500px;
    overflow-y: auto;
    overflow-x: hidden;
    scrollbar-width: none;
  }

  :host > wui-flex:first-child::-webkit-scrollbar {
    display: none;
  }
`;var u=function(o,t,i,r){var n=arguments.length,e=n<3?t:r===null?r=Object.getOwnPropertyDescriptor(t,i):r,l;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")e=Reflect.decorate(o,t,i,r);else for(var s=o.length-1;s>=0;s--)(l=o[s])&&(e=(n<3?l(e):n>3?l(t,i,e):l(t,i))||e);return n>3&&e&&Object.defineProperty(t,i,e),e};let c=class extends a{render(){return m`
      <wui-flex flexDirection="column" .padding=${["0","m","m","m"]} gap="s">
        <w3m-activity-list page="activity"></w3m-activity-list>
      </wui-flex>
    `}};c.styles=d;c=u([p("w3m-transactions-view")],c);export{c as W3mTransactionsView};
