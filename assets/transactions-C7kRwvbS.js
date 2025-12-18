import{f as e,i as t,x as i,a as r}from"./react-Brplheuo.js";import"./react-vendor-BlDtUSDV.js";import"./W3MFrameProviderSingleton-EqOK3Yp_.js";import"./NetworkUtil-8PBlJxlj.js";import"./wagmi-vendor-CZVdyBCS.js";import"./index-CFYEtFbK.js";const o=e`
  :host > wui-flex:first-child {
    height: 500px;
    overflow-y: auto;
    overflow-x: hidden;
    scrollbar-width: none;
  }

  :host > wui-flex:first-child::-webkit-scrollbar {
    display: none;
  }
`;let l=class extends t{render(){return i`
      <wui-flex flexDirection="column" .padding=${["0","3","3","3"]} gap="3">
        <w3m-activity-list page="activity"></w3m-activity-list>
      </wui-flex>
    `}};l.styles=o,l=function(e,t,i,r){var o,l=arguments.length,n=l<3?t:null===r?r=Object.getOwnPropertyDescriptor(t,i):r;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)n=Reflect.decorate(e,t,i,r);else for(var s=e.length-1;s>=0;s--)(o=e[s])&&(n=(l<3?o(n):l>3?o(t,i,n):o(t,i))||n);return l>3&&n&&Object.defineProperty(t,i,n),n}([r("w3m-transactions-view")],l);export{l as W3mTransactionsView};
