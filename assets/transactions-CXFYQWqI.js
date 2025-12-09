import{s as e,o as t,x as i,l as r}from"./index-B6zQmBZv.js";import"./wagmi-vendor-BlnX2Ri9.js";import"./react-vendor-ZyuiJZO_.js";import"./chess-vendor-JTxzwGi1.js";import"./ui-vendor-BgPmeekb.js";const o=e`
  :host > wui-flex:first-child {
    height: 500px;
    overflow-y: auto;
    overflow-x: hidden;
    scrollbar-width: none;
  }

  :host > wui-flex:first-child::-webkit-scrollbar {
    display: none;
  }
`;let s=class extends t{render(){return i`
      <wui-flex flexDirection="column" .padding=${["0","3","3","3"]} gap="3">
        <w3m-activity-list page="activity"></w3m-activity-list>
      </wui-flex>
    `}};s.styles=o,s=function(e,t,i,r){var o,s=arguments.length,l=s<3?t:null===r?r=Object.getOwnPropertyDescriptor(t,i):r;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)l=Reflect.decorate(e,t,i,r);else for(var n=e.length-1;n>=0;n--)(o=e[n])&&(l=(s<3?o(l):s>3?o(t,i,l):o(t,i))||l);return s>3&&l&&Object.defineProperty(t,i,l),l}([r("w3m-transactions-view")],s);export{s as W3mTransactionsView};
