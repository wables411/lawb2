import{i as e,a as t,x as i,c as r}from"./appkit-vendor-BbIUcG7D.js";import"./wagmi-vendor-jzbp9y6O.js";import"./react-vendor-CFG7hIzY.js";const o=e`
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
      <wui-flex flexDirection="column" .padding=${["0","m","m","m"]} gap="s">
        <w3m-activity-list page="activity"></w3m-activity-list>
      </wui-flex>
    `}};l.styles=o,l=function(e,t,i,r){var o,l=arguments.length,n=l<3?t:null===r?r=Object.getOwnPropertyDescriptor(t,i):r;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)n=Reflect.decorate(e,t,i,r);else for(var c=e.length-1;c>=0;c--)(o=e[c])&&(n=(l<3?o(n):l>3?o(t,i,n):o(t,i))||n);return l>3&&n&&Object.defineProperty(t,i,n),n}([r("w3m-transactions-view")],l);export{l as W3mTransactionsView};
