const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/wagmi-vendor-B2woDmio.js","assets/react-vendor-ZyuiJZO_.js","assets/PhArrowCircleDown-BHFEsZAX.js","assets/property-Dy6jfSJI.js","assets/PhArrowClockwise-DZ2jXHvb.js","assets/PhArrowDown-D1IiB5MQ.js","assets/PhArrowLeft-CRQRDGCD.js","assets/PhArrowRight-1IDUoSKU.js","assets/PhArrowSquareOut-D19qXR1o.js","assets/PhArrowsDownUp-BaBQzBn9.js","assets/PhArrowsLeftRight-BwnhGUvR.js","assets/PhArrowUp-CMu5E6zc.js","assets/PhArrowUpRight-C58hTV5n.js","assets/PhArrowsClockwise-BULxaeJX.js","assets/PhBank-CF4zkpu1.js","assets/PhBrowser-CWlfJgJ-.js","assets/PhCaretDown-BPdGuAEc.js","assets/PhCaretLeft-BCjyxXTx.js","assets/PhCaretRight-Wsn-_IBZ.js","assets/PhCaretUp-DBjQZR6a.js","assets/PhCheck-DevzVtf6.js","assets/PhCircleHalf-uVdqP6zU.js","assets/PhClock-Dho-z7DV.js","assets/PhCompass-Dh-CTKne.js","assets/PhCopy-BQwOOilH.js","assets/PhCreditCard-BGIZwSXe.js","assets/PhCurrencyDollar-ll94BNrv.js","assets/PhDesktop-BAtpnE8f.js","assets/PhDeviceMobile-BFv8EE9Z.js","assets/PhDotsThree-DiZyYPmV.js","assets/PhVault-BivOP0rg.js","assets/PhEnvelope-BU_kOvrQ.js","assets/PhFunnelSimple-CspP1t4_.js","assets/PhGlobe-Dr85upUT.js","assets/PhIdentificationCard-DwOpnkTK.js","assets/PhImage-Dblk3O_S.js","assets/PhInfo-DDaGlW_1.js","assets/PhLightbulb-CjVZAMSW.js","assets/PhMagnifyingGlass-BNdiuzr7.js","assets/PhPaperPlaneRight-DNyzrr8z.js","assets/PhPlus-DGJtltg4.js","assets/PhPower-DCLUBW82.js","assets/PhPuzzlePiece-WBf9aVfF.js","assets/PhQrCode-C_Aocgv6.js","assets/PhQuestion-CKUx1xT3.js","assets/PhQuestionMark-CwoJL2MQ.js","assets/PhSealCheck-3i7bCEVz.js","assets/PhSignOut-BR4WKJuV.js","assets/PhSpinner-CVnl1RzK.js","assets/PhTrash-DV-Dm9M7.js","assets/PhUser-Cvn-5n3K.js","assets/PhWarning-Cn8KVd7I.js","assets/PhWarningCircle-BQ7Czj7y.js","assets/PhX-CG-DWSsH.js"])))=>i.map(i=>d[i]);
import{bm as e,bn as t,bk as a,k as n,bl as r,b as o,n as i,i as s,bo as c,bp as l,x as d,an as p,P as u,Q as h}from"./index-BdU8lHE1.js";import{o as g,_ as m,r as f}from"./wagmi-vendor-B2woDmio.js";import"./react-vendor-ZyuiJZO_.js";import"./chess-vendor-JTxzwGi1.js";import"./ui-vendor-BgPmeekb.js";const w={},v=e=>"object"==typeof e&&null!==e,y=(e,a)=>{const n=k.get(e);if((null==n?void 0:n[0])===a)return n[1];const r=Array.isArray(e)?[]:Object.create(Object.getPrototypeOf(e));return t(r,!0),k.set(e,[a,r]),Reflect.ownKeys(e).forEach(a=>{if(Object.getOwnPropertyDescriptor(r,a))return;const n=Reflect.get(e,a),{enumerable:o}=Reflect.getOwnPropertyDescriptor(e,a),i={value:n,enumerable:o,configurable:!0};if(b.has(n))t(n,!1);else if(C.has(n)){const[e,t]=C.get(n);i.value=y(e,t())}Object.defineProperty(r,a,i)}),Object.preventExtensions(r)},C=new WeakMap,b=new WeakSet,k=new WeakMap,E=[1],I=new WeakMap;let A=Object.is,S=(e,t)=>new Proxy(e,t),x=e=>v(e)&&!b.has(e)&&(Array.isArray(e)||!(Symbol.iterator in e))&&!(e instanceof WeakMap)&&!(e instanceof WeakSet)&&!(e instanceof Error)&&!(e instanceof Number)&&!(e instanceof Date)&&!(e instanceof String)&&!(e instanceof RegExp)&&!(e instanceof ArrayBuffer)&&!(e instanceof Promise),N=y,_=(t,a,n,r)=>({deleteProperty(e,t){const a=Reflect.get(e,t);n(t);const o=Reflect.deleteProperty(e,t);return o&&r(["delete",[t],a]),o},set(o,i,s,c){const l=!t()&&Reflect.has(o,i),d=Reflect.get(o,i,c);if(l&&(A(d,s)||I.has(s)&&A(d,I.get(s))))return!0;n(i),v(s)&&(s=e(s)||s);const p=!C.has(s)&&x(s)?P(s):s;return a(i,p),Reflect.set(o,i,p,c),r(["set",[i],s,d]),!0}});function P(e={}){if(!v(e))throw new Error("object required");const t=I.get(e);if(t)return t;let a=E[0];const n=new Set,r=(e,t=++E[0])=>{a!==t&&(o=a=t,n.forEach(a=>a(e,t)))};let o=a;const i=e=>(t,a)=>{const n=[...t];n[1]=[e,...n[1]],r(n,a)},s=new Map;let c=!0;const l=_(()=>c,(e,t)=>{const a=!b.has(t)&&C.get(t);if(a){if("production"!==(w?"production":void 0)&&s.has(e))throw new Error("prop listener already exists");if(n.size){const t=a[2](i(e));s.set(e,[a,t])}else s.set(e,[a])}},e=>{var t;const a=s.get(e);a&&(s.delete(e),null==(t=a[1])||t.call(a))},r),d=S(e,l);I.set(e,d);const p=[e,(e=E[0])=>(o!==e&&(o=e,s.forEach(([t])=>{const n=t[1](e);n>a&&(a=n)})),a),e=>{n.add(e),1===n.size&&s.forEach(([e,t],a)=>{if("production"!==(w?"production":void 0)&&t)throw new Error("remove already exists");const n=e[2](i(a));s.set(a,[e,n])});return()=>{n.delete(e),0===n.size&&s.forEach(([e,t],a)=>{t&&(t(),s.set(a,[e]))})}}];return C.set(d,p),Reflect.ownKeys(e).forEach(t=>{const a=Object.getOwnPropertyDescriptor(e,t);"value"in a&&a.writable&&(d[t]=e[t])}),c=!1,d}function T(e,t,a){const n=C.get(e);let r;const o=[],i=n[2];let s=!1;const c=i(e=>{o.push(e),r||(r=Promise.resolve().then(()=>{r=void 0,s&&t(o.splice(0))}))});return s=!0,()=>{s=!1,c()}}function R(e){const t=C.get(e),[a,n]=t;return N(a,n())}function $(e){return b.add(e),e}function O(e,t,a,n){let r=e[t];return T(e,()=>{const n=e[t];Object.is(r,n)||a(r=n)})}const{proxyStateMap:L,snapCache:D}={proxyStateMap:C,refSet:b,snapCache:k,versionHolder:E,proxyCache:I},U=e=>L.has(e);var M={};const B={WC_NAME_SUFFIX:".reown.id",WC_NAME_SUFFIX_LEGACY:".wcn.id",BLOCKCHAIN_API_RPC_URL:"https://rpc.walletconnect.org",PULSE_API_URL:"https://pulse.walletconnect.org",W3M_API_URL:"https://api.web3modal.org",CONNECTOR_ID:{WALLET_CONNECT:"walletConnect",INJECTED:"injected",WALLET_STANDARD:"announced",COINBASE:"coinbaseWallet",COINBASE_SDK:"coinbaseWalletSDK",SAFE:"safe",LEDGER:"ledger",OKX:"okx",EIP6963:"eip6963",AUTH:"AUTH"},CONNECTOR_NAMES:{AUTH:"Auth"},AUTH_CONNECTOR_SUPPORTED_CHAINS:["eip155","solana"],LIMITS:{PENDING_TRANSACTIONS:99},CHAIN:{EVM:"eip155",SOLANA:"solana",POLKADOT:"polkadot",BITCOIN:"bip122"},CHAIN_NAME_MAP:{eip155:"EVM Networks",solana:"Solana",polkadot:"Polkadot",bip122:"Bitcoin",cosmos:"Cosmos",sui:"Sui",stacks:"Stacks"},ADAPTER_TYPES:{BITCOIN:"bitcoin",SOLANA:"solana",WAGMI:"wagmi",ETHERS:"ethers",ETHERS5:"ethers5"},USDT_CONTRACT_ADDRESSES:["0xdac17f958d2ee523a2206206994597c13d831ec7","0xc2132d05d31c914a87c6611c10748aeb04b58e8f","0x9702230a8ea53601f5cd2dc00fdbc13d4df4a8c7","0x919C1c267BC06a7039e03fcc2eF738525769109c","0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e","0x55d398326f99059fF775485246999027B3197955","0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9"],SOLANA_SPL_TOKEN_ADDRESSES:{SOL:"So11111111111111111111111111111111111111112"},HTTP_STATUS_CODES:{SERVER_ERROR:500,TOO_MANY_REQUESTS:429,SERVICE_UNAVAILABLE:503,FORBIDDEN:403},UNSUPPORTED_NETWORK_NAME:"Unknown Network",SECURE_SITE_SDK_ORIGIN:("undefined"!=typeof process?M.NEXT_PUBLIC_SECURE_SITE_ORIGIN:void 0)||"https://secure.walletconnect.org",REMOTE_FEATURES_ALERTS:{MULTI_WALLET_NOT_ENABLED:{DEFAULT:{displayMessage:"Multi-Wallet Not Enabled",debugMessage:"Multi-wallet support is not enabled. Please enable it in your AppKit configuration at cloud.reown.com."},CONNECTIONS_HOOK:{displayMessage:"Multi-Wallet Not Enabled",debugMessage:"Multi-wallet support is not enabled. Please enable it in your AppKit configuration at cloud.reown.com to use the useAppKitConnections hook."},CONNECTION_HOOK:{displayMessage:"Multi-Wallet Not Enabled",debugMessage:"Multi-wallet support is not enabled. Please enable it in your AppKit configuration at cloud.reown.com to use the useAppKitConnection hook."}}},IS_DEVELOPMENT:"undefined"!=typeof process&&!1,DEFAULT_ALLOWED_ANCESTORS:["http://localhost:*","https://localhost:*","http://127.0.0.1:*","https://127.0.0.1:*","https://*.pages.dev","https://*.vercel.app","https://*.ngrok-free.app","https://secure-mobile.walletconnect.com","https://secure-mobile.walletconnect.org"]},F={caipNetworkIdToNumber:e=>e?Number(e.split(":")[1]):void 0,parseEvmChainId(e){return"string"==typeof e?this.caipNetworkIdToNumber(e):e},getNetworksByNamespace:(e,t)=>(null==e?void 0:e.filter(e=>e.chainNamespace===t))||[],getFirstNetworkByNamespace(e,t){return this.getNetworksByNamespace(e,t)[0]},getNetworkNameByCaipNetworkId(e,t){var a;if(!t)return;const n=e.find(e=>e.caipNetworkId===t);if(n)return n.name;const[r]=t.split(":");return(null==(a=B.CHAIN_NAME_MAP)?void 0:a[r])||void 0}},W=["eip155","solana","polkadot","bip122","cosmos","sui","stacks"],z={bigNumber:e=>new a(e||0),multiply(e,t){if(void 0===e||void 0===t)return new a(0);const n=new a(e),r=new a(t);return n.times(r)},toFixed:(e,t=2)=>void 0===e||""===e?new a(0).toFixed(t):new a(e).toFixed(t),formatNumberToLocalString:(e,t=2)=>void 0===e||""===e?"0.00":"number"==typeof e?e.toLocaleString("en-US",{maximumFractionDigits:t,minimumFractionDigits:t,roundingMode:"floor"}):parseFloat(e).toLocaleString("en-US",{maximumFractionDigits:t,minimumFractionDigits:t,roundingMode:"floor"}),parseLocalStringToNumber(e){if(void 0===e||""===e)return 0;const t=e.replace(/,/gu,"");return new a(t).toNumber()}},j=[{type:"function",name:"transfer",stateMutability:"nonpayable",inputs:[{name:"_to",type:"address"},{name:"_value",type:"uint256"}],outputs:[{name:"",type:"bool"}]},{type:"function",name:"transferFrom",stateMutability:"nonpayable",inputs:[{name:"_from",type:"address"},{name:"_to",type:"address"},{name:"_value",type:"uint256"}],outputs:[{name:"",type:"bool"}]}],V=[{type:"function",name:"transfer",stateMutability:"nonpayable",inputs:[{name:"recipient",type:"address"},{name:"amount",type:"uint256"}],outputs:[]},{type:"function",name:"transferFrom",stateMutability:"nonpayable",inputs:[{name:"sender",type:"address"},{name:"recipient",type:"address"},{name:"amount",type:"uint256"}],outputs:[{name:"",type:"bool"}]}],H=e=>B.USDT_CONTRACT_ADDRESSES.includes(e)?V:j,Z={validateCaipAddress(e){var t;if(3!==(null==(t=e.split(":"))?void 0:t.length))throw new Error("Invalid CAIP Address");return e},parseCaipAddress(e){const t=e.split(":");if(3!==t.length)throw new Error(`Invalid CAIP-10 address: ${e}`);const[a,n,r]=t;if(!a||!n||!r)throw new Error(`Invalid CAIP-10 address: ${e}`);return{chainNamespace:a,chainId:n,address:r}},parseCaipNetworkId(e){const t=e.split(":");if(2!==t.length)throw new Error(`Invalid CAIP-2 network id: ${e}`);const[a,n]=t;if(!a||!n)throw new Error(`Invalid CAIP-2 network id: ${e}`);return{chainNamespace:a,chainId:n}}},K={RPC_ERROR_CODE:{USER_REJECTED_REQUEST:4001,USER_REJECTED_METHODS:5002,USER_REJECTED:5e3},PROVIDER_RPC_ERROR_NAME:{PROVIDER_RPC:"ProviderRpcError",USER_REJECTED_REQUEST:"UserRejectedRequestError"},isRpcProviderError(e){try{if("object"==typeof e&&null!==e){const t=e,a="string"==typeof t.message,n="number"==typeof t.code;return a&&n}return!1}catch{return!1}},isUserRejectedMessage:e=>e.toLowerCase().includes("user rejected")||e.toLowerCase().includes("user cancelled")||e.toLowerCase().includes("user canceled"),isUserRejectedRequestError(e){if(K.isRpcProviderError(e)){const t=e.code===K.RPC_ERROR_CODE.USER_REJECTED_REQUEST,a=e.code===K.RPC_ERROR_CODE.USER_REJECTED_METHODS;return t||a||K.isUserRejectedMessage(e.message)}return e instanceof Error&&K.isUserRejectedMessage(e.message)}};class q extends Error{constructor(e,t){super(t.message,{cause:e}),this.name=K.PROVIDER_RPC_ERROR_NAME.PROVIDER_RPC,this.code=t.code}}class G extends q{constructor(e){super(e,{code:K.RPC_ERROR_CODE.USER_REJECTED_REQUEST,message:"User rejected the request"}),this.name=K.PROVIDER_RPC_ERROR_NAME.USER_REJECTED_REQUEST}}const J="@appkit/active_caip_network_id",Y="@appkit/connected_social",Q="@appkit-wallet/SOCIAL_USERNAME",X="@appkit/recent_wallets",ee="@appkit/recent_wallet",te="WALLETCONNECT_DEEPLINK_CHOICE",ae="@appkit/active_namespace",ne="@appkit/connected_namespaces",re="@appkit/connection_status",oe="@appkit/social_provider",ie="@appkit/native_balance_cache",se="@appkit/portfolio_cache",ce="@appkit/ens_cache",le="@appkit/identity_cache",de="@appkit/preferred_account_types",pe="@appkit/connections",ue="@appkit/disconnected_connector_ids",he="@appkit/history_transactions_cache",ge="@appkit/token_price_cache",me="@appkit/latest_version";function fe(e){if(!e)throw new Error("Namespace is required for CONNECTED_CONNECTOR_ID");return`@appkit/${e}:connected_connector_id`}const we={setItem(e,t){ve()&&void 0!==t&&localStorage.setItem(e,t)},getItem(e){if(ve())return localStorage.getItem(e)||void 0},removeItem(e){ve()&&localStorage.removeItem(e)},clear(){ve()&&localStorage.clear()}};function ve(){return"undefined"!=typeof window&&"undefined"!=typeof localStorage}function ye(e,t){return"light"===t?{"--w3m-accent":(null==e?void 0:e["--w3m-accent"])||"hsla(231, 100%, 70%, 1)","--w3m-background":"#fff"}:{"--w3m-accent":(null==e?void 0:e["--w3m-accent"])||"hsla(230, 100%, 67%, 1)","--w3m-background":"#202020"}}const Ce={FOUR_MINUTES_MS:24e4,TEN_SEC_MS:1e4,ONE_SEC_MS:1e3,SOLANA_NATIVE_TOKEN_ADDRESS:"So11111111111111111111111111111111111111111",NAMES_SUPPORTED_CHAIN_NAMESPACES:[B.CHAIN.EVM],NATIVE_TOKEN_ADDRESS:{eip155:"0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",solana:"So11111111111111111111111111111111111111111",polkadot:"0x",bip122:"0x",cosmos:"0x",sui:"0x",stacks:"0x"},CONVERT_SLIPPAGE_TOLERANCE:1,DEFAULT_REMOTE_FEATURES:{socials:["google","x","discord","farcaster","github","apple","facebook"]},DEFAULT_FEATURES:{receive:!0,send:!0,emailShowWallets:!0,connectorTypeOrder:["walletConnect","recent","injected","featured","custom","external","recommended"],analytics:!0,allWallets:!0,legalCheckbox:!1,smartSessions:!1,collapseWallets:!1,walletFeaturesOrder:["onramp","swaps","receive","send"],connectMethodsOrder:void 0,pay:!1,reownAuthentication:!1},DEFAULT_ACCOUNT_TYPES:{bip122:"payment",eip155:"smartAccount",polkadot:"eoa",solana:"eoa"},ADAPTER_TYPES:{UNIVERSAL:"universal"},SIWX_DEFAULTS:{signOutOnDisconnect:!0}},be={cacheExpiry:{portfolio:3e4,nativeBalance:3e4,ens:3e5,identity:3e5,transactionsHistory:15e3,tokenPrice:15e3,latestAppKitVersion:6048e5},isCacheExpired:(e,t)=>Date.now()-e>t,getActiveNetworkProps(){const e=be.getActiveNamespace(),t=be.getActiveCaipNetworkId(),a=t?t.split(":")[1]:void 0;return{namespace:e,caipNetworkId:t,chainId:a?isNaN(Number(a))?a:Number(a):void 0}},setWalletConnectDeepLink({name:e,href:t}){try{we.setItem(te,JSON.stringify({href:t,name:e}))}catch{}},getWalletConnectDeepLink(){try{const e=we.getItem(te);if(e)return JSON.parse(e)}catch{}},deleteWalletConnectDeepLink(){try{we.removeItem(te)}catch{}},setActiveNamespace(e){try{we.setItem(ae,e)}catch{}},setActiveCaipNetworkId(e){try{we.setItem(J,e),be.setActiveNamespace(e.split(":")[0])}catch{}},getActiveCaipNetworkId(){try{return we.getItem(J)}catch{return}},deleteActiveCaipNetworkId(){try{we.removeItem(J)}catch{}},deleteConnectedConnectorId(e){try{const t=fe(e);we.removeItem(t)}catch{}},setAppKitRecent(e){try{const t=be.getRecentWallets();t.find(t=>t.id===e.id)||(t.unshift(e),t.length>2&&t.pop(),we.setItem(X,JSON.stringify(t)),we.setItem(ee,JSON.stringify(e)))}catch{}},getRecentWallets(){try{const e=we.getItem(X);return e?JSON.parse(e):[]}catch{}return[]},getRecentWallet(){try{const e=we.getItem(ee);return e?JSON.parse(e):null}catch{}return null},deleteRecentWallet(){try{we.removeItem(ee)}catch{}},setConnectedConnectorId(e,t){try{const a=fe(e);we.setItem(a,t)}catch{}},getActiveNamespace(){try{return we.getItem(ae)}catch{}},getConnectedConnectorId(e){if(e)try{const t=fe(e);return we.getItem(t)}catch(t){}},setConnectedSocialProvider(e){try{we.setItem(Y,e)}catch{}},getConnectedSocialProvider(){try{return we.getItem(Y)}catch{}},deleteConnectedSocialProvider(){try{we.removeItem(Y)}catch{}},getConnectedSocialUsername(){try{return we.getItem(Q)}catch{}},getStoredActiveCaipNetworkId(){var e;const t=we.getItem(J);return null==(e=null==t?void 0:t.split(":"))?void 0:e[1]},setConnectionStatus(e){try{we.setItem(re,e)}catch{}},getConnectionStatus(){try{return we.getItem(re)}catch{return}},getConnectedNamespaces(){try{const e=we.getItem(ne);return(null==e?void 0:e.length)?e.split(","):[]}catch{return[]}},setConnectedNamespaces(e){try{const t=Array.from(new Set(e));we.setItem(ne,t.join(","))}catch{}},addConnectedNamespace(e){try{const t=be.getConnectedNamespaces();t.includes(e)||(t.push(e),be.setConnectedNamespaces(t))}catch{}},removeConnectedNamespace(e){try{const t=be.getConnectedNamespaces(),a=t.indexOf(e);a>-1&&(t.splice(a,1),be.setConnectedNamespaces(t))}catch{}},getTelegramSocialProvider(){try{return we.getItem(oe)}catch{return null}},setTelegramSocialProvider(e){try{we.setItem(oe,e)}catch{}},removeTelegramSocialProvider(){try{we.removeItem(oe)}catch{}},getBalanceCache(){let e={};try{const t=we.getItem(se);e=t?JSON.parse(t):{}}catch{}return e},removeAddressFromBalanceCache(e){try{const t=be.getBalanceCache();we.setItem(se,JSON.stringify({...t,[e]:void 0}))}catch{}},getBalanceCacheForCaipAddress(e){try{const t=be.getBalanceCache()[e];if(t&&!this.isCacheExpired(t.timestamp,this.cacheExpiry.portfolio))return t.balance;be.removeAddressFromBalanceCache(e)}catch{}},updateBalanceCache(e){try{const t=be.getBalanceCache();t[e.caipAddress]=e,we.setItem(se,JSON.stringify(t))}catch{}},getNativeBalanceCache(){let e={};try{const t=we.getItem(ie);e=t?JSON.parse(t):{}}catch{}return e},removeAddressFromNativeBalanceCache(e){try{const t=be.getBalanceCache();we.setItem(ie,JSON.stringify({...t,[e]:void 0}))}catch{}},getNativeBalanceCacheForCaipAddress(e){try{const t=be.getNativeBalanceCache()[e];if(t&&!this.isCacheExpired(t.timestamp,this.cacheExpiry.nativeBalance))return t;be.removeAddressFromBalanceCache(e)}catch{}},updateNativeBalanceCache(e){try{const t=be.getNativeBalanceCache();t[e.caipAddress]=e,we.setItem(ie,JSON.stringify(t))}catch{}},getEnsCache(){let e={};try{const t=we.getItem(ce);e=t?JSON.parse(t):{}}catch{}return e},getEnsFromCacheForAddress(e){try{const t=be.getEnsCache()[e];if(t&&!this.isCacheExpired(t.timestamp,this.cacheExpiry.ens))return t.ens;be.removeEnsFromCache(e)}catch{}},updateEnsCache(e){try{const t=be.getEnsCache();t[e.address]=e,we.setItem(ce,JSON.stringify(t))}catch{}},removeEnsFromCache(e){try{const t=be.getEnsCache();we.setItem(ce,JSON.stringify({...t,[e]:void 0}))}catch{}},getIdentityCache(){let e={};try{const t=we.getItem(le);e=t?JSON.parse(t):{}}catch{}return e},getIdentityFromCacheForAddress(e){try{const t=be.getIdentityCache()[e];if(t&&!this.isCacheExpired(t.timestamp,this.cacheExpiry.identity))return t.identity;be.removeIdentityFromCache(e)}catch{}},updateIdentityCache(e){try{const t=be.getIdentityCache();t[e.address]={identity:e.identity,timestamp:e.timestamp},we.setItem(le,JSON.stringify(t))}catch{}},removeIdentityFromCache(e){try{const t=be.getIdentityCache();we.setItem(le,JSON.stringify({...t,[e]:void 0}))}catch{}},clearAddressCache(){try{we.removeItem(se),we.removeItem(ie),we.removeItem(ce),we.removeItem(le),we.removeItem(he)}catch{}},setPreferredAccountTypes(e){try{we.setItem(de,JSON.stringify(e))}catch{}},getPreferredAccountTypes(){try{const e=we.getItem(de);return e?JSON.parse(e):{}}catch{}return{}},setConnections(e,t){try{const a=be.getConnections(),n=a[t]??[],r=new Map;for(const e of n)r.set(e.connectorId,{...e});for(const t of e){const e=r.get(t.connectorId),a=t.connectorId===B.CONNECTOR_ID.AUTH;if(e&&!a){const a=new Set(e.accounts.map(e=>e.address.toLowerCase())),n=t.accounts.filter(e=>!a.has(e.address.toLowerCase()));e.accounts.push(...n)}else r.set(t.connectorId,{...t})}const o={...a,[t]:Array.from(r.values())};we.setItem(pe,JSON.stringify(o))}catch(a){}},getConnections(){try{const e=we.getItem(pe);return e?JSON.parse(e):{}}catch(e){return{}}},deleteAddressFromConnection({connectorId:e,address:t,namespace:a}){try{const n=be.getConnections(),r=n[a]??[],o=new Map(r.map(e=>[e.connectorId,e])),i=o.get(e);if(i){0===i.accounts.filter(e=>e.address.toLowerCase()!==t.toLowerCase()).length?o.delete(e):o.set(e,{...i,accounts:i.accounts.filter(e=>e.address.toLowerCase()!==t.toLowerCase())})}we.setItem(pe,JSON.stringify({...n,[a]:Array.from(o.values())}))}catch{}},getDisconnectedConnectorIds(){try{const e=we.getItem(ue);return e?JSON.parse(e):{}}catch{}return{}},addDisconnectedConnectorId(e,t){try{const a=be.getDisconnectedConnectorIds(),n=a[t]??[];n.push(e),we.setItem(ue,JSON.stringify({...a,[t]:Array.from(new Set(n))}))}catch{}},removeDisconnectedConnectorId(e,t){try{const a=be.getDisconnectedConnectorIds();let n=a[t]??[];n=n.filter(t=>t.toLowerCase()!==e.toLowerCase()),we.setItem(ue,JSON.stringify({...a,[t]:Array.from(new Set(n))}))}catch{}},isConnectorDisconnected(e,t){try{const a=be.getDisconnectedConnectorIds();return(a[t]??[]).some(t=>t.toLowerCase()===e.toLowerCase())}catch{}return!1},getTransactionsCache(){try{const e=we.getItem(he);return e?JSON.parse(e):{}}catch{}return{}},getTransactionsCacheForAddress({address:e,chainId:t=""}){var a;try{const n=null==(a=be.getTransactionsCache()[e])?void 0:a[t];if(n&&!this.isCacheExpired(n.timestamp,this.cacheExpiry.transactionsHistory))return n.transactions;be.removeTransactionsCache({address:e,chainId:t})}catch{}},updateTransactionsCache({address:e,chainId:t="",timestamp:a,transactions:n}){try{const r=be.getTransactionsCache();r[e]={...r[e],[t]:{timestamp:a,transactions:n}},we.setItem(he,JSON.stringify(r))}catch{}},removeTransactionsCache({address:e,chainId:t}){try{const a=be.getTransactionsCache(),n=(null==a?void 0:a[e])||{},{[t]:r,...o}=n;we.setItem(he,JSON.stringify({...a,[e]:o}))}catch{}},getTokenPriceCache(){try{const e=we.getItem(ge);return e?JSON.parse(e):{}}catch{}return{}},getTokenPriceCacheForAddresses(e){try{const t=be.getTokenPriceCache()[e.join(",")];if(t&&!this.isCacheExpired(t.timestamp,this.cacheExpiry.tokenPrice))return t.tokenPrice;be.removeTokenPriceCache(e)}catch{}},updateTokenPriceCache(e){try{const t=be.getTokenPriceCache();t[e.addresses.join(",")]={timestamp:e.timestamp,tokenPrice:e.tokenPrice},we.setItem(ge,JSON.stringify(t))}catch{}},removeTokenPriceCache(e){try{const t=be.getTokenPriceCache();we.setItem(ge,JSON.stringify({...t,[e.join(",")]:void 0}))}catch{}},getLatestAppKitVersion(){try{const e=this.getLatestAppKitVersionCache(),t=null==e?void 0:e.version;return t&&!this.isCacheExpired(e.timestamp,this.cacheExpiry.latestAppKitVersion)?t:void 0}catch{}},getLatestAppKitVersionCache(){try{const e=we.getItem(me);return e?JSON.parse(e):{}}catch{}return{}},updateLatestAppKitVersion(e){try{const t=be.getLatestAppKitVersionCache();t.timestamp=e.timestamp,t.version=e.version,we.setItem(me,JSON.stringify(t))}catch{}}},ke={isMobile(){var e;return!!this.isClient()&&Boolean((null==window?void 0:window.matchMedia)&&"function"==typeof window.matchMedia&&(null==(e=window.matchMedia("(pointer:coarse)"))?void 0:e.matches)||/Android|webOS|iPhone|iPad|iPod|BlackBerry|Opera Mini/u.test(navigator.userAgent))},checkCaipNetwork:(e,t="")=>null==e?void 0:e.caipNetworkId.toLocaleLowerCase().includes(t.toLowerCase()),isAndroid(){if(!this.isMobile())return!1;const e=null==window?void 0:window.navigator.userAgent.toLowerCase();return ke.isMobile()&&e.includes("android")},isIos(){if(!this.isMobile())return!1;const e=null==window?void 0:window.navigator.userAgent.toLowerCase();return e.includes("iphone")||e.includes("ipad")},isSafari(){if(!this.isClient())return!1;return(null==window?void 0:window.navigator.userAgent.toLowerCase()).includes("safari")},isClient:()=>"undefined"!=typeof window,isPairingExpired:e=>!e||e-Date.now()<=Ce.TEN_SEC_MS,isAllowedRetry:(e,t=Ce.ONE_SEC_MS)=>Date.now()-e>=t,copyToClopboard(e){navigator.clipboard.writeText(e)},isIframe(){try{return(null==window?void 0:window.self)!==(null==window?void 0:window.top)}catch(e){return!1}},isSafeApp(){var e,t;if(ke.isClient()&&window.self!==window.top)try{const a=null==(t=null==(e=null==window?void 0:window.location)?void 0:e.ancestorOrigins)?void 0:t[0],n="https://app.safe.global";if(a){const e=new URL(a),t=new URL(n);return e.hostname===t.hostname}}catch{return!1}return!1},getPairingExpiry:()=>Date.now()+Ce.FOUR_MINUTES_MS,getNetworkId:e=>null==e?void 0:e.split(":")[1],getPlainAddress:e=>null==e?void 0:e.split(":")[2],wait:async e=>new Promise(t=>{setTimeout(t,e)}),debounce(e,t=500){let a;return(...n)=>{a&&clearTimeout(a),a=setTimeout(function(){e(...n)},t)}},isHttpUrl:e=>e.startsWith("http://")||e.startsWith("https://"),formatNativeUrl(e,t,a=null){if(ke.isHttpUrl(e))return this.formatUniversalUrl(e,t);let n=e,r=a;n.includes("://")||(n=e.replaceAll("/","").replaceAll(":",""),n=`${n}://`),n.endsWith("/")||(n=`${n}/`),r&&!(null==r?void 0:r.endsWith("/"))&&(r=`${r}/`),this.isTelegram()&&this.isAndroid()&&(t=encodeURIComponent(t));const o=encodeURIComponent(t);return{redirect:`${n}wc?uri=${o}`,redirectUniversalLink:r?`${r}wc?uri=${o}`:void 0,href:n}},formatUniversalUrl(e,t){if(!ke.isHttpUrl(e))return this.formatNativeUrl(e,t);let a=e;a.endsWith("/")||(a=`${a}/`);return{redirect:`${a}wc?uri=${encodeURIComponent(t)}`,href:a}},getOpenTargetForPlatform(e){return"popupWindow"===e?e:this.isTelegram()?be.getTelegramSocialProvider()?"_top":"_blank":e},openHref(e,t,a){null==window||window.open(e,this.getOpenTargetForPlatform(t),a||"noreferrer noopener")},returnOpenHref(e,t,a){return null==window?void 0:window.open(e,this.getOpenTargetForPlatform(t),a||"noreferrer noopener")},isTelegram:()=>"undefined"!=typeof window&&(Boolean(window.TelegramWebviewProxy)||Boolean(window.Telegram)||Boolean(window.TelegramWebviewProxyProto)),isPWA(){var e,t;if("undefined"==typeof window)return!1;const a=!(!(null==window?void 0:window.matchMedia)||"function"!=typeof window.matchMedia)&&(null==(e=window.matchMedia("(display-mode: standalone)"))?void 0:e.matches),n=null==(t=null==window?void 0:window.navigator)?void 0:t.standalone;return Boolean(a||n)},async preloadImage(e){const t=new Promise((t,a)=>{const n=new Image;n.onload=t,n.onerror=a,n.crossOrigin="anonymous",n.src=e});return Promise.race([t,ke.wait(2e3)])},parseBalance(e,t){let a="0.000";if("string"==typeof e){const t=Number(e);if(!isNaN(t)){const e=(Math.floor(1e3*t)/1e3).toFixed(3);e&&(a=e)}}const[n,r]=a.split("."),o=n||"0",i=r||"000";return{formattedText:`${o}.${i}${t?` ${t}`:""}`,value:o,decimals:i,symbol:t}},getApiUrl:()=>B.W3M_API_URL,getBlockchainApiUrl:()=>B.BLOCKCHAIN_API_RPC_URL,getAnalyticsUrl:()=>B.PULSE_API_URL,getUUID:()=>(null==crypto?void 0:crypto.randomUUID)?crypto.randomUUID():"xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/gu,e=>{const t=16*Math.random()|0;return("x"===e?t:3&t|8).toString(16)}),parseError(e){var t,a;return"string"==typeof e?e:"string"==typeof(null==(a=null==(t=null==e?void 0:e.issues)?void 0:t[0])?void 0:a.message)?e.issues[0].message:e instanceof Error?e.message:"Unknown error"},sortRequestedNetworks(e,t=[]){const a={};return t&&e&&(e.forEach((e,t)=>{a[e]=t}),t.sort((e,t)=>{const n=a[e.id],r=a[t.id];return void 0!==n&&void 0!==r?n-r:void 0!==n?-1:void 0!==r?1:0})),t},calculateBalance(e){let t=0;for(const a of e)t+=a.value??0;return t},formatTokenBalance(e){const t=e.toFixed(2),[a,n]=t.split(".");return{dollars:a,pennies:n}},isAddress(e,t="eip155"){switch(t){case"eip155":return!!/^(?:0x)?[0-9a-f]{40}$/iu.test(e)&&!(!/^(?:0x)?[0-9a-f]{40}$/iu.test(e)&&!/^(?:0x)?[0-9A-F]{40}$/iu.test(e));case"solana":return/[1-9A-HJ-NP-Za-km-z]{32,44}$/iu.test(e);default:return!1}},uniqueBy(e,t){const a=new Set;return e.filter(e=>{const n=e[t];return!a.has(n)&&(a.add(n),!0)})},generateSdkVersion:(e,t,a)=>`${t}-${0===e.length?Ce.ADAPTER_TYPES.UNIVERSAL:e.map(e=>e.adapterType).join(",")}-${a}`,createAccount:(e,t,a,n,r)=>({namespace:e,address:t,type:a,publicKey:n,path:r}),isCaipAddress(e){if("string"!=typeof e)return!1;const t=e.split(":"),a=t[0];return 3===t.filter(Boolean).length&&a in B.CHAIN_NAME_MAP},getAccount:e=>e?"string"==typeof e?{address:e,chainId:void 0}:{address:e.address,chainId:e.chainId}:{address:void 0,chainId:void 0},isMac(){const e=null==window?void 0:window.navigator.userAgent.toLowerCase();return e.includes("macintosh")&&!e.includes("safari")},formatTelegramSocialLoginUrl(e){const t=`--${encodeURIComponent(null==window?void 0:window.location.href)}`,a="state=";if("auth.magic.link"===new URL(e).host){const n="provider_authorization_url=",r=e.substring(e.indexOf(n)+n.length),o=this.injectIntoUrl(decodeURIComponent(r),a,t);return e.replace(r,encodeURIComponent(o))}return this.injectIntoUrl(e,a,t)},injectIntoUrl(e,t,a){const n=e.indexOf(t);if(-1===n)throw new Error(`${t} parameter not found in the URL: ${e}`);const r=e.indexOf("&",n),o=t.length,i=-1!==r?r:e.length;return e.substring(0,n+o)+(e.substring(n+o,i)+a)+e.substring(r)}},Ee="@appkit-wallet/",Ie="SMART_ACCOUNT_ENABLED_NETWORKS",Ae={EOA:"eoa",SMART_ACCOUNT:"smartAccount"},Se={set(e,t){xe.isClient&&localStorage.setItem(`${Ee}${e}`,t)},get:e=>xe.isClient?localStorage.getItem(`${Ee}${e}`):null,delete(e,t){xe.isClient&&(t?localStorage.removeItem(e):localStorage.removeItem(`${Ee}${e}`))}},xe={isClient:"undefined"!=typeof window};async function Ne(...e){const t=await fetch(...e);if(!t.ok){throw new Error(`HTTP status code: ${t.status}`,{cause:t})}return t}class _e{constructor({baseUrl:e,clientId:t}){this.baseUrl=e,this.clientId=t}async get({headers:e,signal:t,cache:a,...n}){const r=this.createUrl(n);return(await Ne(r,{method:"GET",headers:e,signal:t,cache:a})).json()}async getBlob({headers:e,signal:t,...a}){const n=this.createUrl(a);return(await Ne(n,{method:"GET",headers:e,signal:t})).blob()}async post({body:e,headers:t,signal:a,...n}){const r=this.createUrl(n);return(await Ne(r,{method:"POST",headers:t,body:e?JSON.stringify(e):void 0,signal:a})).json()}async put({body:e,headers:t,signal:a,...n}){const r=this.createUrl(n);return(await Ne(r,{method:"PUT",headers:t,body:e?JSON.stringify(e):void 0,signal:a})).json()}async delete({body:e,headers:t,signal:a,...n}){const r=this.createUrl(n);return(await Ne(r,{method:"DELETE",headers:t,body:e?JSON.stringify(e):void 0,signal:a})).json()}createUrl({path:e,params:t}){const a=new URL(e,this.baseUrl);return t&&Object.entries(t).forEach(([e,t])=>{t&&a.searchParams.append(e,t)}),this.clientId&&a.searchParams.append("clientId",this.clientId),a}sendBeacon({body:e,...t}){const a=this.createUrl(t);return navigator.sendBeacon(a.toString(),e?JSON.stringify(e):void 0)}}const Pe={getFeatureValue(e,t){const a=null==t?void 0:t[e];return void 0===a?Ce.DEFAULT_FEATURES[e]:a},filterSocialsByPlatform(e){if(!e||!e.length)return e;let t=e;return ke.isTelegram()&&(ke.isIos()&&(t=t.filter(e=>"google"!==e)),ke.isMac()&&(t=t.filter(e=>"x"!==e)),ke.isAndroid()&&(t=t.filter(e=>!["facebook","x"].includes(e)))),ke.isMobile()&&(t=t.filter(e=>"facebook"!==e)),t},isSocialsEnabled(){var e,t,a,n;return Array.isArray(null==(e=Re.state.features)?void 0:e.socials)&&(null==(t=Re.state.features)?void 0:t.socials.length)>0||Array.isArray(null==(a=Re.state.remoteFeatures)?void 0:a.socials)&&(null==(n=Re.state.remoteFeatures)?void 0:n.socials.length)>0},isEmailEnabled(){var e,t;return Boolean((null==(e=Re.state.features)?void 0:e.email)||(null==(t=Re.state.remoteFeatures)?void 0:t.email))}},Te=P({features:Ce.DEFAULT_FEATURES,projectId:"",sdkType:"appkit",sdkVersion:"html-wagmi-undefined",defaultAccountTypes:Ce.DEFAULT_ACCOUNT_TYPES,enableNetworkSwitch:!0,experimental_preferUniversalLinks:!1,remoteFeatures:{},enableMobileFullScreen:!1,coinbasePreference:"all"}),Re={state:Te,subscribeKey:(e,t)=>O(Te,e,t),setOptions(e){Object.assign(Te,e)},setRemoteFeatures(e){var t,a;if(!e)return;const n={...Te.remoteFeatures,...e};Te.remoteFeatures=n,(null==(t=Te.remoteFeatures)?void 0:t.socials)&&(Te.remoteFeatures.socials=Pe.filterSocialsByPlatform(Te.remoteFeatures.socials)),(null==(a=Te.features)?void 0:a.pay)&&(Te.remoteFeatures.email=!1,Te.remoteFeatures.socials=!1)},setFeatures(e){var t;if(!e)return;Te.features||(Te.features=Ce.DEFAULT_FEATURES);const a={...Te.features,...e};Te.features=a,(null==(t=Te.features)?void 0:t.pay)&&Te.remoteFeatures&&(Te.remoteFeatures.email=!1,Te.remoteFeatures.socials=!1)},setProjectId(e){Te.projectId=e},setCustomRpcUrls(e){Te.customRpcUrls=e},setAllWallets(e){Te.allWallets=e},setIncludeWalletIds(e){Te.includeWalletIds=e},setExcludeWalletIds(e){Te.excludeWalletIds=e},setFeaturedWalletIds(e){Te.featuredWalletIds=e},setTokens(e){Te.tokens=e},setTermsConditionsUrl(e){Te.termsConditionsUrl=e},setPrivacyPolicyUrl(e){Te.privacyPolicyUrl=e},setCustomWallets(e){Te.customWallets=e},setIsSiweEnabled(e){Te.isSiweEnabled=e},setIsUniversalProvider(e){Te.isUniversalProvider=e},setSdkVersion(e){Te.sdkVersion=e},setMetadata(e){Te.metadata=e},setDisableAppend(e){Te.disableAppend=e},setEIP6963Enabled(e){Te.enableEIP6963=e},setDebug(e){Te.debug=e},setEnableWalletGuide(e){Te.enableWalletGuide=e},setEnableAuthLogger(e){Te.enableAuthLogger=e},setEnableWallets(e){Te.enableWallets=e},setPreferUniversalLinks(e){Te.experimental_preferUniversalLinks=e},setSIWX(e){if(e)for(const[t,a]of Object.entries(Ce.SIWX_DEFAULTS))e[t]??(e[t]=a);Te.siwx=e},setConnectMethodsOrder(e){Te.features={...Te.features,connectMethodsOrder:e}},setWalletFeaturesOrder(e){Te.features={...Te.features,walletFeaturesOrder:e}},setSocialsOrder(e){Te.remoteFeatures={...Te.remoteFeatures,socials:e}},setCollapseWallets(e){Te.features={...Te.features,collapseWallets:e}},setEnableEmbedded(e){Te.enableEmbedded=e},setAllowUnsupportedChain(e){Te.allowUnsupportedChain=e},setManualWCControl(e){Te.manualWCControl=e},setEnableNetworkSwitch(e){Te.enableNetworkSwitch=e},setEnableMobileFullScreen(e){Te.enableMobileFullScreen=ke.isMobile()&&e},setEnableReconnect(e){Te.enableReconnect=e},setCoinbasePreference(e){Te.coinbasePreference=e},setDefaultAccountTypes(e={}){Object.entries(e).forEach(([e,t])=>{t&&(Te.defaultAccountTypes[e]=t)})},setUniversalProviderConfigOverride(e){Te.universalProviderConfigOverride=e},getUniversalProviderConfigOverride:()=>Te.universalProviderConfigOverride,getSnapshot:()=>R(Te)},$e=Object.freeze({message:"",variant:"success",svg:void 0,open:!1,autoClose:!0}),Oe=P({...$e}),Le={state:Oe,subscribeKey:(e,t)=>O(Oe,e,t),showLoading(e,t={}){this._showMessage({message:e,variant:"loading",...t})},showSuccess(e){this._showMessage({message:e,variant:"success"})},showSvg(e,t){this._showMessage({message:e,svg:t})},showError(e){const t=ke.parseError(e);this._showMessage({message:t,variant:"error"})},hide(){Oe.message=$e.message,Oe.variant=$e.variant,Oe.svg=$e.svg,Oe.open=$e.open,Oe.autoClose=$e.autoClose},_showMessage({message:e,svg:t,variant:a="success",autoClose:n=$e.autoClose}){Oe.open?(Oe.open=!1,setTimeout(()=>{Oe.message=e,Oe.variant=a,Oe.svg=t,Oe.open=!0,Oe.autoClose=n},150)):(Oe.message=e,Oe.variant=a,Oe.svg=t,Oe.open=!0,Oe.autoClose=n)}},De={purchaseCurrencies:[{id:"2b92315d-eab7-5bef-84fa-089a131333f5",name:"USD Coin",symbol:"USDC",networks:[{name:"ethereum-mainnet",display_name:"Ethereum",chain_id:"1",contract_address:"0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"},{name:"polygon-mainnet",display_name:"Polygon",chain_id:"137",contract_address:"0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174"}]},{id:"2b92315d-eab7-5bef-84fa-089a131333f5",name:"Ether",symbol:"ETH",networks:[{name:"ethereum-mainnet",display_name:"Ethereum",chain_id:"1",contract_address:"0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"},{name:"polygon-mainnet",display_name:"Polygon",chain_id:"137",contract_address:"0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174"}]}],paymentCurrencies:[{id:"USD",payment_method_limits:[{id:"card",min:"10.00",max:"7500.00"},{id:"ach_bank_account",min:"10.00",max:"25000.00"}]},{id:"EUR",payment_method_limits:[{id:"card",min:"10.00",max:"7500.00"},{id:"ach_bank_account",min:"10.00",max:"25000.00"}]}]},Ue=ke.getBlockchainApiUrl(),Me=P({clientId:null,api:new _e({baseUrl:Ue,clientId:null}),supportedChains:{http:[],ws:[]}}),Be={state:Me,async get(e){const{st:t,sv:a}=Be.getSdkProperties(),n=Re.state.projectId,r={...e.params||{},st:t,sv:a,projectId:n};return Me.api.get({...e,params:r})},getSdkProperties(){const{sdkType:e,sdkVersion:t}=Re.state;return{st:e||"unknown",sv:t||"unknown"}},async isNetworkSupported(e){if(!e)return!1;try{Me.supportedChains.http.length||await Be.getSupportedNetworks()}catch(t){return!1}return Me.supportedChains.http.includes(e)},async getSupportedNetworks(){try{const e=await Be.get({path:"v1/supported-chains"});return Me.supportedChains=e,e}catch{return Me.supportedChains}},async fetchIdentity({address:e}){const t=be.getIdentityFromCacheForAddress(e);if(t)return t;const a=await Be.get({path:`/v1/identity/${e}`,params:{sender:Kt.state.activeCaipAddress?ke.getPlainAddress(Kt.state.activeCaipAddress):void 0}});return be.updateIdentityCache({address:e,identity:a,timestamp:Date.now()}),a},async fetchTransactions({account:e,cursor:t,signal:a,cache:n,chainId:r}){var o;if(!(await Be.isNetworkSupported(null==(o=Kt.state.activeCaipNetwork)?void 0:o.caipNetworkId)))return{data:[],next:void 0};const i=be.getTransactionsCacheForAddress({address:e,chainId:r});if(i)return i;const s=await Be.get({path:`/v1/account/${e}/history`,params:{cursor:t,chainId:r},signal:a,cache:n});return be.updateTransactionsCache({address:e,chainId:r,timestamp:Date.now(),transactions:s}),s},async fetchSwapQuote({amount:e,userAddress:t,from:a,to:n,gasPrice:r}){var o;return await Be.isNetworkSupported(null==(o=Kt.state.activeCaipNetwork)?void 0:o.caipNetworkId)?Be.get({path:"/v1/convert/quotes",headers:{"Content-Type":"application/json"},params:{amount:e,userAddress:t,from:a,to:n,gasPrice:r}}):{quotes:[]}},async fetchSwapTokens({chainId:e}){var t;return await Be.isNetworkSupported(null==(t=Kt.state.activeCaipNetwork)?void 0:t.caipNetworkId)?Be.get({path:"/v1/convert/tokens",params:{chainId:e}}):{tokens:[]}},async fetchTokenPrice({addresses:e}){var t;if(!(await Be.isNetworkSupported(null==(t=Kt.state.activeCaipNetwork)?void 0:t.caipNetworkId)))return{fungibles:[]};const a=be.getTokenPriceCacheForAddresses(e);if(a)return a;const n=await Me.api.post({path:"/v1/fungible/price",body:{currency:"usd",addresses:e,projectId:Re.state.projectId},headers:{"Content-Type":"application/json"}});return be.updateTokenPriceCache({addresses:e,timestamp:Date.now(),tokenPrice:n}),n},async fetchSwapAllowance({tokenAddress:e,userAddress:t}){var a;return await Be.isNetworkSupported(null==(a=Kt.state.activeCaipNetwork)?void 0:a.caipNetworkId)?Be.get({path:"/v1/convert/allowance",params:{tokenAddress:e,userAddress:t},headers:{"Content-Type":"application/json"}}):{allowance:"0"}},async fetchGasPrice({chainId:e}){var t;const{st:a,sv:n}=Be.getSdkProperties();if(!(await Be.isNetworkSupported(null==(t=Kt.state.activeCaipNetwork)?void 0:t.caipNetworkId)))throw new Error("Network not supported for Gas Price");return Be.get({path:"/v1/convert/gas-price",headers:{"Content-Type":"application/json"},params:{chainId:e,st:a,sv:n}})},async generateSwapCalldata({amount:e,from:t,to:a,userAddress:n,disableEstimate:r}){var o;if(!(await Be.isNetworkSupported(null==(o=Kt.state.activeCaipNetwork)?void 0:o.caipNetworkId)))throw new Error("Network not supported for Swaps");return Me.api.post({path:"/v1/convert/build-transaction",headers:{"Content-Type":"application/json"},body:{amount:e,eip155:{slippage:Ce.CONVERT_SLIPPAGE_TOLERANCE},projectId:Re.state.projectId,from:t,to:a,userAddress:n,disableEstimate:r}})},async generateApproveCalldata({from:e,to:t,userAddress:a}){var n;const{st:r,sv:o}=Be.getSdkProperties();if(!(await Be.isNetworkSupported(null==(n=Kt.state.activeCaipNetwork)?void 0:n.caipNetworkId)))throw new Error("Network not supported for Swaps");return Be.get({path:"/v1/convert/build-approve",headers:{"Content-Type":"application/json"},params:{userAddress:a,from:e,to:t,st:r,sv:o}})},async getBalance(e,t,a){var n;const{st:r,sv:o}=Be.getSdkProperties();if(!(await Be.isNetworkSupported(null==(n=Kt.state.activeCaipNetwork)?void 0:n.caipNetworkId)))return Le.showError("Token Balance Unavailable"),{balances:[]};const i=`${t}:${e}`,s=be.getBalanceCacheForCaipAddress(i);if(s)return s;const c=await Be.get({path:`/v1/account/${e}/balance`,params:{currency:"usd",chainId:t,forceUpdate:a,st:r,sv:o}});return be.updateBalanceCache({caipAddress:i,balance:c,timestamp:Date.now()}),c},async lookupEnsName(e){var t;return await Be.isNetworkSupported(null==(t=Kt.state.activeCaipNetwork)?void 0:t.caipNetworkId)?Be.get({path:`/v1/profile/account/${e}`,params:{apiVersion:"2"}}):{addresses:{},attributes:[]}},async reverseLookupEnsName({address:e}){var t,a;if(!(await Be.isNetworkSupported(null==(t=Kt.state.activeCaipNetwork)?void 0:t.caipNetworkId)))return[];const n=null==(a=Kt.getAccountData())?void 0:a.address;return Be.get({path:`/v1/profile/reverse/${e}`,params:{sender:n,apiVersion:"2"}})},async getEnsNameSuggestions(e){var t;return await Be.isNetworkSupported(null==(t=Kt.state.activeCaipNetwork)?void 0:t.caipNetworkId)?Be.get({path:`/v1/profile/suggestions/${e}`,params:{zone:"reown.id"}}):{suggestions:[]}},async registerEnsName({coinType:e,address:t,message:a,signature:n}){var r;return await Be.isNetworkSupported(null==(r=Kt.state.activeCaipNetwork)?void 0:r.caipNetworkId)?Me.api.post({path:"/v1/profile/account",body:{coin_type:e,address:t,message:a,signature:n},headers:{"Content-Type":"application/json"}}):{success:!1}},async generateOnRampURL({destinationWallets:e,partnerUserId:t,defaultNetwork:a,purchaseAmount:n,paymentAmount:r}){var o;if(!(await Be.isNetworkSupported(null==(o=Kt.state.activeCaipNetwork)?void 0:o.caipNetworkId)))return"";return(await Me.api.post({path:"/v1/generators/onrampurl",params:{projectId:Re.state.projectId},body:{destinationWallets:e,defaultNetwork:a,partnerUserId:t,defaultExperience:"buy",presetCryptoAmount:n,presetFiatAmount:r}})).url},async getOnrampOptions(){var e;if(!(await Be.isNetworkSupported(null==(e=Kt.state.activeCaipNetwork)?void 0:e.caipNetworkId)))return{paymentCurrencies:[],purchaseCurrencies:[]};try{return await Be.get({path:"/v1/onramp/options"})}catch(t){return De}},async getOnrampQuote({purchaseCurrency:e,paymentCurrency:t,amount:a,network:n}){var r;try{if(!(await Be.isNetworkSupported(null==(r=Kt.state.activeCaipNetwork)?void 0:r.caipNetworkId)))return null;return await Me.api.post({path:"/v1/onramp/quote",params:{projectId:Re.state.projectId},body:{purchaseCurrency:e,paymentCurrency:t,amount:a,network:n}})}catch(o){return{networkFee:{amount:a,currency:t.id},paymentSubtotal:{amount:a,currency:t.id},paymentTotal:{amount:a,currency:t.id},purchaseAmount:{amount:a,currency:t.id},quoteId:"mocked-quote-id"}}},async getSmartSessions(e){var t;return await Be.isNetworkSupported(null==(t=Kt.state.activeCaipNetwork)?void 0:t.caipNetworkId)?Be.get({path:`/v1/sessions/${e}`}):[]},async revokeSmartSession(e,t,a){var n;return await Be.isNetworkSupported(null==(n=Kt.state.activeCaipNetwork)?void 0:n.caipNetworkId)?Me.api.post({path:`/v1/sessions/${e}/revoke`,params:{projectId:Re.state.projectId},body:{pci:t,signature:a}}):{success:!1}},setClientId(e){Me.clientId=e,Me.api=new _e({baseUrl:Ue,clientId:e})}},Fe={PHANTOM:{id:"a797aa35c0fadbfc1a53e7f675162ed5226968b44a19ee3d24385c64d1d3c393",url:"https://phantom.app"},SOLFLARE:{id:"1ca0bdd4747578705b1939af023d120677c64fe6ca76add81fda36e350605e79",url:"https://solflare.com"},COINBASE:{id:"fd20dc426fb37566d803205b19bbc1d4096b248ac04548e3cfb6b3a38bd033aa",url:"https://go.cb-w.com"},BINANCE:{id:"2fafea35bb471d22889ccb49c08d99dd0a18a37982602c33f696a5723934ba25",appId:"yFK5FCqYprrXDiVFbhyRx7",deeplink:"bnc://app.binance.com/mp/app",url:"https://app.binance.com/en/download"}},We={handleMobileDeeplinkRedirect(e,t){const a=window.location.href,n=encodeURIComponent(a);if(e===Fe.PHANTOM.id&&!("phantom"in window)){const e=a.startsWith("https")?"https":"http",t=a.split("/")[2],r=encodeURIComponent(`${e}://${t}`);window.location.href=`${Fe.PHANTOM.url}/ul/browse/${n}?ref=${r}`}if(e!==Fe.SOLFLARE.id||"solflare"in window||(window.location.href=`${Fe.SOLFLARE.url}/ul/v1/browse/${n}?ref=${n}`),t===B.CHAIN.SOLANA&&(e!==Fe.COINBASE.id||"coinbaseSolana"in window||(window.location.href=`${Fe.COINBASE.url}/dapp?cb_url=${n}`)),t===B.CHAIN.BITCOIN&&e===Fe.BINANCE.id&&!("binancew3w"in window)){const e=Kt.state.activeCaipNetwork,t=window.btoa("/pages/browser/index"),a=window.btoa(`url=${n}&defaultChainId=${(null==e?void 0:e.id)??1}`),r=new URL(Fe.BINANCE.deeplink);r.searchParams.set("appId",Fe.BINANCE.appId),r.searchParams.set("startPagePath",t),r.searchParams.set("startPageQuery",a);const o=new URL(Fe.BINANCE.url);o.searchParams.set("_dp",window.btoa(r.toString())),window.location.href=o.toString()}}},ze=Object.freeze({enabled:!0,events:[]}),je=new _e({baseUrl:ke.getAnalyticsUrl(),clientId:null}),Ve=P({...ze}),He={state:Ve,subscribeKey:(e,t)=>O(Ve,e,t),async sendError(e,t){if(!Ve.enabled)return;const a=Date.now();if(Ve.events.filter(e=>{const t=new Date(e.properties.timestamp||"").getTime();return a-t<6e4}).length>=5)return;const n={type:"error",event:t,properties:{errorType:e.name,errorMessage:e.message,stackTrace:e.stack,timestamp:(new Date).toISOString()}};Ve.events.push(n);try{if("undefined"==typeof window)return;const{projectId:a,sdkType:n,sdkVersion:r}=Re.state;await je.post({path:"/e",params:{projectId:a,st:n,sv:r||"html-wagmi-4.2.2"},body:{eventId:ke.getUUID(),url:window.location.href,domain:window.location.hostname,timestamp:(new Date).toISOString(),props:{type:"error",event:t,errorType:e.name,errorMessage:e.message,stackTrace:e.stack}}})}catch{}},enable(){Ve.enabled=!0},disable(){Ve.enabled=!1},clearEvents(){Ve.events=[]}};class Ze extends Error{constructor(e,t,a){super(e),this.originalName="AppKitError",this.name="AppKitError",this.category=t,this.originalError=a,a&&a instanceof Error&&(this.originalName=a.name),Object.setPrototypeOf(this,Ze.prototype);let n=!1;if(a instanceof Error&&"string"==typeof a.stack&&a.stack){const e=a.stack,t=e.indexOf("\n");if(t>-1){const a=e.substring(t+1);this.stack=`${this.name}: ${this.message}\n${a}`,n=!0}}n||(Error.captureStackTrace?Error.captureStackTrace(this,Ze):this.stack||(this.stack=`${this.name}: ${this.message}`))}}function Ke(e,t){let a="";try{a=e instanceof Error?e.message:"string"==typeof e?e:"object"==typeof e&&null!==e?0===Object.keys(e).length?"Unknown error":(null==e?void 0:e.message)||JSON.stringify(e):String(e)}catch(r){a="Unknown error"}const n=e instanceof Ze?e:new Ze(a,t,e);throw He.sendError(n,n.category),n}function qe(e,t="INTERNAL_SDK_ERROR"){const a={};return Object.keys(e).forEach(n=>{const r=e[n];if("function"==typeof r){let e=r;e="AsyncFunction"===r.constructor.name?async(...e)=>{try{return await r(...e)}catch(a){return Ke(a,t)}}:(...e)=>{try{return r(...e)}catch(a){return Ke(a,t)}},a[n]=e}else a[n]=r}),a}const Ge=P({walletImages:{},networkImages:{},chainImages:{},connectorImages:{},tokenImages:{},currencyImages:{}}),Je=qe({state:Ge,subscribeNetworkImages:e=>T(Ge.networkImages,()=>e(Ge.networkImages)),subscribeKey:(e,t)=>O(Ge,e,t),subscribe:e=>T(Ge,()=>e(Ge)),setWalletImage(e,t){Ge.walletImages[e]=t},setNetworkImage(e,t){Ge.networkImages[e]=t},setChainImage(e,t){Ge.chainImages[e]=t},setConnectorImage(e,t){Ge.connectorImages={...Ge.connectorImages,[e]:t}},setTokenImage(e,t){Ge.tokenImages[e]=t},setCurrencyImage(e,t){Ge.currencyImages[e]=t}}),Ye={eip155:"ba0ba0cd-17c6-4806-ad93-f9d174f17900",solana:"a1b58899-f671-4276-6a5e-56ca5bd59700",polkadot:"",bip122:"0b4838db-0161-4ffe-022d-532bf03dba00",cosmos:"",sui:"",stacks:""},Qe=P({networkImagePromises:{}}),Xe={async fetchWalletImage(e){if(e)return await ct._fetchWalletImage(e),this.getWalletImageById(e)},async fetchNetworkImage(e){if(!e)return;const t=this.getNetworkImageById(e);return t||(Qe.networkImagePromises[e]||(Qe.networkImagePromises[e]=ct._fetchNetworkImage(e)),await Qe.networkImagePromises[e],this.getNetworkImageById(e))},getWalletImageById(e){if(e)return Je.state.walletImages[e]},getWalletImage:e=>(null==e?void 0:e.image_url)?null==e?void 0:e.image_url:(null==e?void 0:e.image_id)?Je.state.walletImages[e.image_id]:void 0,getNetworkImage(e){var t,a,n;return(null==(t=null==e?void 0:e.assets)?void 0:t.imageUrl)?null==(a=null==e?void 0:e.assets)?void 0:a.imageUrl:(null==(n=null==e?void 0:e.assets)?void 0:n.imageId)?Je.state.networkImages[e.assets.imageId]:void 0},getNetworkImageById(e){if(e)return Je.state.networkImages[e]},getConnectorImage(e){var t;return(null==e?void 0:e.imageUrl)?e.imageUrl:(null==(t=null==e?void 0:e.info)?void 0:t.icon)?e.info.icon:(null==e?void 0:e.imageId)?Je.state.connectorImages[e.imageId]:void 0},getChainImage:e=>Je.state.networkImages[Ye[e]],getTokenImage(e){if(e)return Je.state.tokenImages[e]}},et=ke.getAnalyticsUrl(),tt=new _e({baseUrl:et,clientId:null}),at=["MODAL_CREATED"],nt=P({timestamp:Date.now(),lastFlush:Date.now(),reportedErrors:{},data:{type:"track",event:"MODAL_CREATED"},pendingEvents:[],subscribedToVisibilityChange:!1,walletImpressions:[]}),rt={state:nt,subscribe:e=>T(nt,()=>e(nt)),getSdkProperties(){const{projectId:e,sdkType:t,sdkVersion:a}=Re.state;return{projectId:e,st:t,sv:a||"html-wagmi-4.2.2"}},shouldFlushEvents(){const e=JSON.stringify(nt.pendingEvents).length/1024>45,t=nt.lastFlush+1e4<Date.now();return e||t},_setPendingEvent(e){var t,a;try{let n=null==(t=Kt.getAccountData())?void 0:t.address;if("address"in e.data&&e.data.address&&(n=e.data.address),at.includes(e.data.event)||"undefined"==typeof window)return;const r=null==(a=Kt.getActiveCaipNetwork())?void 0:a.caipNetworkId;this.state.pendingEvents.push({eventId:ke.getUUID(),url:window.location.href,domain:window.location.hostname,timestamp:e.timestamp,props:{...e.data,address:n,properties:{..."properties"in e.data?e.data.properties:{},caipNetworkId:r}}}),nt.reportedErrors.FORBIDDEN=!1;rt.shouldFlushEvents()&&rt._submitPendingEvents()}catch(n){}},sendEvent(e){var t;nt.timestamp=Date.now(),nt.data=e;((null==(t=Re.state.features)?void 0:t.analytics)||["INITIALIZE","CONNECT_SUCCESS","SOCIAL_LOGIN_SUCCESS"].includes(e.event))&&rt._setPendingEvent(nt),this.subscribeToFlushTriggers()},sendWalletImpressionEvent(e){nt.walletImpressions.push(e)},_transformPendingEventsForBatch(e){try{return e.filter(e=>"WALLET_IMPRESSION_V2"!==e.props.event)}catch{return e}},_submitPendingEvents(){if(nt.lastFlush=Date.now(),0!==nt.pendingEvents.length||0!==nt.walletImpressions.length)try{const e=rt._transformPendingEventsForBatch(nt.pendingEvents);nt.walletImpressions.length&&e.push({eventId:ke.getUUID(),url:window.location.href,domain:window.location.hostname,timestamp:Date.now(),props:{type:"track",event:"WALLET_IMPRESSION_V2",items:[...nt.walletImpressions]}}),tt.sendBeacon({path:"/batch",params:rt.getSdkProperties(),body:e}),nt.reportedErrors.FORBIDDEN=!1,nt.pendingEvents=[],nt.walletImpressions=[]}catch(e){nt.reportedErrors.FORBIDDEN=!0}},subscribeToFlushTriggers(){var e,t,a;nt.subscribedToVisibilityChange||"undefined"!=typeof document&&(nt.subscribedToVisibilityChange=!0,null==(e=null==document?void 0:document.addEventListener)||e.call(document,"visibilitychange",()=>{"hidden"===document.visibilityState&&rt._submitPendingEvents()}),null==(t=null==document?void 0:document.addEventListener)||t.call(document,"freeze",()=>{rt._submitPendingEvents()}),null==(a=null==window?void 0:window.addEventListener)||a.call(window,"pagehide",()=>{rt._submitPendingEvents()}),setInterval(()=>{rt._submitPendingEvents()},1e4))}},ot=ke.getApiUrl(),it=new _e({baseUrl:ot,clientId:null}),st=P({promises:{},page:1,count:0,featured:[],allFeatured:[],recommended:[],allRecommended:[],wallets:[],filteredWallets:[],search:[],isAnalyticsEnabled:!1,excludedWallets:[],isFetchingRecommendedWallets:!1,explorerWallets:[],explorerFilteredWallets:[],plan:{tier:"none",hasExceededUsageLimit:!1,limits:{isAboveRpcLimit:!1,isAboveMauLimit:!1}}}),ct={state:st,subscribeKey:(e,t)=>O(st,e,t),_getSdkProperties(){const{projectId:e,sdkType:t,sdkVersion:a}=Re.state;return{projectId:e,st:t||"appkit",sv:a||"html-wagmi-4.2.2"}},_filterOutExtensions:e=>Re.state.isUniversalProvider?e.filter(e=>Boolean(e.mobile_link||e.desktop_link||e.webapp_link)):e,async _fetchWalletImage(e){const t=`${it.baseUrl}/getWalletImage/${e}`,a=await it.getBlob({path:t,params:ct._getSdkProperties()});Je.setWalletImage(e,URL.createObjectURL(a))},async _fetchNetworkImage(e){const t=`${it.baseUrl}/public/getAssetImage/${e}`,a=await it.getBlob({path:t,params:ct._getSdkProperties()});Je.setNetworkImage(e,URL.createObjectURL(a))},async _fetchConnectorImage(e){const t=`${it.baseUrl}/public/getAssetImage/${e}`,a=await it.getBlob({path:t,params:ct._getSdkProperties()});Je.setConnectorImage(e,URL.createObjectURL(a))},async _fetchCurrencyImage(e){const t=`${it.baseUrl}/public/getCurrencyImage/${e}`,a=await it.getBlob({path:t,params:ct._getSdkProperties()});Je.setCurrencyImage(e,URL.createObjectURL(a))},async _fetchTokenImage(e){const t=`${it.baseUrl}/public/getTokenImage/${e}`,a=await it.getBlob({path:t,params:ct._getSdkProperties()});Je.setTokenImage(e,URL.createObjectURL(a))},_filterWalletsByPlatform(e){const t=e.length,a=ke.isMobile()?null==e?void 0:e.filter(e=>{if(e.mobile_link||e.webapp_link)return!0;return Object.values(Fe).map(e=>e.id).includes(e.id)}):e;return{filteredWallets:a,mobileFilteredOutWalletsLength:t-a.length}},fetchProjectConfig:async()=>(await it.get({path:"/appkit/v1/config",params:ct._getSdkProperties()})).features,async fetchUsage(){try{const e=await it.get({path:"/appkit/v1/project-limits",params:ct._getSdkProperties()}),{tier:t,isAboveMauLimit:a,isAboveRpcLimit:n}=e.planLimits,r="starter"===t,o=a||n;ct.state.plan={tier:t,hasExceededUsageLimit:r&&o,limits:{isAboveRpcLimit:n,isAboveMauLimit:a}}}catch(e){}},async fetchAllowedOrigins(){try{const{allowedOrigins:e}=await it.get({path:"/projects/v1/origins",params:ct._getSdkProperties()});return e}catch(e){if(e instanceof Error&&e.cause instanceof Response){const t=e.cause.status;if(t===B.HTTP_STATUS_CODES.TOO_MANY_REQUESTS)throw new Error("RATE_LIMITED",{cause:e});if(t>=B.HTTP_STATUS_CODES.SERVER_ERROR&&t<600)throw new Error("SERVER_ERROR",{cause:e});return[]}return[]}},async fetchNetworkImages(){const e=Kt.getAllRequestedCaipNetworks(),t=null==e?void 0:e.map(({assets:e})=>null==e?void 0:e.imageId).filter(Boolean).filter(e=>!Xe.getNetworkImageById(e));t&&await Promise.allSettled(t.map(e=>ct._fetchNetworkImage(e)))},async fetchConnectorImages(){const{connectors:e}=vt.state,t=e.map(({imageId:e})=>e).filter(Boolean);await Promise.allSettled(t.map(e=>ct._fetchConnectorImage(e)))},async fetchCurrencyImages(e=[]){await Promise.allSettled(e.map(e=>ct._fetchCurrencyImage(e)))},async fetchTokenImages(e=[]){await Promise.allSettled(e.map(e=>ct._fetchTokenImage(e)))},async fetchWallets(e){var t;const a=e.exclude??[];ct._getSdkProperties().sv.startsWith("html-core-")&&a.push(...Object.values(Fe).map(e=>e.id));const n=await it.get({path:"/getWallets",params:{...ct._getSdkProperties(),...e,page:String(e.page),entries:String(e.entries),include:null==(t=e.include)?void 0:t.join(","),exclude:a.join(",")}}),{filteredWallets:r,mobileFilteredOutWalletsLength:o}=ct._filterWalletsByPlatform(null==n?void 0:n.data);return{data:r||[],count:null==n?void 0:n.count,mobileFilteredOutWalletsLength:o}},async prefetchWalletRanks(){const e=vt.state.connectors;if(!(null==e?void 0:e.length))return;const t={page:1,entries:20,badge:"certified"};if(t.names=e.map(e=>e.name).join(","),Kt.state.activeChain===B.CHAIN.EVM){const a=[...e.flatMap(e=>{var t;return(null==(t=e.connectors)?void 0:t.map(e=>{var t;return null==(t=e.info)?void 0:t.rdns}))||[]}),...e.map(e=>{var t;return null==(t=e.info)?void 0:t.rdns})].filter(e=>"string"==typeof e&&e.length>0);a.length&&(t.rdns=a.join(","))}const{data:a}=await ct.fetchWallets(t);st.explorerWallets=a;const n=Kt.getRequestedCaipNetworkIds().join(",");st.explorerFilteredWallets=a.filter(e=>{var t;return null==(t=e.chains)?void 0:t.some(e=>n.includes(e))})},async fetchFeaturedWallets(){const{featuredWalletIds:e}=Re.state;if(null==e?void 0:e.length){const t={...ct._getSdkProperties(),page:1,entries:(null==e?void 0:e.length)??4,include:e},{data:a}=await ct.fetchWallets(t),n=[...a].sort((t,a)=>e.indexOf(t.id)-e.indexOf(a.id)),r=n.map(e=>e.image_id).filter(Boolean);await Promise.allSettled(r.map(e=>ct._fetchWalletImage(e))),st.featured=n,st.allFeatured=n}},async fetchRecommendedWallets(){try{st.isFetchingRecommendedWallets=!0;const{includeWalletIds:e,excludeWalletIds:t,featuredWalletIds:a}=Re.state,n=[...t??[],...a??[]].filter(Boolean),r={page:1,entries:4,include:e,exclude:n,chains:Kt.getRequestedCaipNetworkIds().join(",")},{data:o,count:i}=await ct.fetchWallets(r),s=be.getRecentWallets(),c=o.map(e=>e.image_id).filter(Boolean),l=s.map(e=>e.image_id).filter(Boolean);await Promise.allSettled([...c,...l].map(e=>ct._fetchWalletImage(e))),st.recommended=o,st.allRecommended=o,st.count=i??0}catch{}finally{st.isFetchingRecommendedWallets=!1}},async fetchWalletsByPage({page:e}){const{includeWalletIds:t,excludeWalletIds:a,featuredWalletIds:n}=Re.state,r=Kt.getRequestedCaipNetworkIds().join(","),o={page:e,entries:40,include:t,exclude:[...st.recommended.map(({id:e})=>e),...a??[],...n??[]].filter(Boolean),chains:r},{data:i,count:s,mobileFilteredOutWalletsLength:c}=await ct.fetchWallets(o);st.mobileFilteredOutWalletsLength=c+(st.mobileFilteredOutWalletsLength??0);const l=i.slice(0,20).map(e=>e.image_id).filter(Boolean);await Promise.allSettled(l.map(e=>ct._fetchWalletImage(e))),st.wallets=ke.uniqueBy([...st.wallets,...ct._filterOutExtensions(i)],"id").filter(e=>{var t;return null==(t=e.chains)?void 0:t.some(e=>r.includes(e))}),st.count=s>st.count?s:st.count,st.page=e},async initializeExcludedWallets({ids:e}){const t={page:1,entries:e.length,include:e},{data:a}=await ct.fetchWallets(t);a&&a.forEach(e=>{st.excludedWallets.push({rdns:e.rdns,name:e.name})})},async searchWallet({search:e,badge:t}){const{includeWalletIds:a,excludeWalletIds:n}=Re.state,r=Kt.getRequestedCaipNetworkIds().join(",");st.search=[];const o={page:1,entries:100,search:null==e?void 0:e.trim(),badge_type:t,include:a,exclude:n,chains:r},{data:i}=await ct.fetchWallets(o);rt.sendEvent({type:"track",event:"SEARCH_WALLET",properties:{badge:t??"",search:e??""}});const s=i.map(e=>e.image_id).filter(Boolean);await Promise.allSettled([...s.map(e=>ct._fetchWalletImage(e)),ke.wait(300)]),st.search=ct._filterOutExtensions(i)},initPromise(e,t){const a=st.promises[e];return a||(st.promises[e]=t())},prefetch({fetchConnectorImages:e=!0,fetchFeaturedWallets:t=!0,fetchRecommendedWallets:a=!0,fetchNetworkImages:n=!0,fetchWalletRanks:r=!0}={}){const o=[e&&ct.initPromise("connectorImages",ct.fetchConnectorImages),t&&ct.initPromise("featuredWallets",ct.fetchFeaturedWallets),a&&ct.initPromise("recommendedWallets",ct.fetchRecommendedWallets),n&&ct.initPromise("networkImages",ct.fetchNetworkImages),r&&ct.initPromise("walletRanks",ct.prefetchWalletRanks)].filter(Boolean);return Promise.allSettled(o)},prefetchAnalyticsConfig(){var e;(null==(e=Re.state.features)?void 0:e.analytics)&&ct.fetchAnalyticsConfig()},async fetchAnalyticsConfig(){try{const{isAnalyticsEnabled:e}=await it.get({path:"/getAnalyticsConfig",params:ct._getSdkProperties()});Re.setFeatures({analytics:e})}catch(e){Re.setFeatures({analytics:!1})}},filterByNamespaces(e){if(!(null==e?void 0:e.length))return st.featured=st.allFeatured,void(st.recommended=st.allRecommended);const t=Kt.getRequestedCaipNetworkIds().join(",");st.featured=st.allFeatured.filter(e=>{var a;return null==(a=e.chains)?void 0:a.some(e=>t.includes(e))}),st.recommended=st.allRecommended.filter(e=>{var a;return null==(a=e.chains)?void 0:a.some(e=>t.includes(e))}),st.filteredWallets=st.wallets.filter(e=>{var a;return null==(a=e.chains)?void 0:a.some(e=>t.includes(e))})},clearFilterByNamespaces(){st.filteredWallets=[]},setFilterByNamespace(e){if(!e)return st.featured=st.allFeatured,void(st.recommended=st.allRecommended);const t=Kt.getRequestedCaipNetworkIds().join(",");st.featured=st.allFeatured.filter(e=>{var a;return null==(a=e.chains)?void 0:a.some(e=>t.includes(e))}),st.recommended=st.allRecommended.filter(e=>{var a;return null==(a=e.chains)?void 0:a.some(e=>t.includes(e))}),st.filteredWallets=st.wallets.filter(e=>{var a;return null==(a=e.chains)?void 0:a.some(e=>t.includes(e))})}},lt=["ConnectingExternal","ConnectingMultiChain","ConnectingSocial","ConnectingFarcaster"],dt=P({view:"Connect",history:["Connect"],transactionStack:[]}),pt=qe({state:dt,subscribeKey:(e,t)=>O(dt,e,t),pushTransactionStack(e){dt.transactionStack.push(e)},popTransactionStack(e){const t=dt.transactionStack.pop();if(!t)return;const{onSuccess:a,onError:n,onCancel:r}=t;switch(e){case"success":null==a||a();break;case"error":null==n||n(),pt.goBack();break;case"cancel":null==r||r(),pt.goBack()}},push(e,t){let a=e,n=t;ct.state.plan.hasExceededUsageLimit&&lt.includes(e)&&(a="UsageExceeded",n=void 0),a!==dt.view&&(dt.view=a,dt.history.push(a),dt.data=n)},reset(e,t){dt.view=e,dt.history=[e],dt.data=t},replace(e,t){dt.history.at(-1)===e||(dt.view=e,dt.history[dt.history.length-1]=e,dt.data=t)},goBack(){var e,t;const a=Kt.state.activeCaipAddress,n="ConnectingFarcaster"===pt.state.view,r=!a&&n;if(dt.history.length>1){dt.history.pop();const[e]=dt.history.slice(-1);if(e){const t="Connect"===e;dt.view=a&&t?"Account":e}}else Jt.close();(null==(e=dt.data)?void 0:e.wallet)&&(dt.data.wallet=void 0),(null==(t=dt.data)?void 0:t.redirectView)&&(dt.data.redirectView=void 0),setTimeout(()=>{var e,t,a;if(r){Kt.setAccountProp("farcasterUrl",void 0,Kt.state.activeChain);const n=vt.getAuthConnector();null==(e=null==n?void 0:n.provider)||e.reload();const r=R(Re.state);null==(a=null==(t=null==n?void 0:n.provider)?void 0:t.syncDappData)||a.call(t,{metadata:r.metadata,sdkVersion:r.sdkVersion,projectId:r.projectId,sdkType:r.sdkType})}},100)},goBackToIndex(e){if(dt.history.length>1){dt.history=dt.history.slice(0,e+1);const[t]=dt.history.slice(-1);t&&(dt.view=t)}},goBackOrCloseModal(){pt.state.history.length>1?pt.goBack():Jt.close()}}),ut=P({themeMode:"dark",themeVariables:{},w3mThemeVariables:void 0}),ht={state:ut,subscribe:e=>T(ut,()=>e(ut)),setThemeMode(e){ut.themeMode=e;try{const t=vt.getAuthConnector();if(t){const a=ht.getSnapshot().themeVariables;t.provider.syncTheme({themeMode:e,themeVariables:a,w3mThemeVariables:ye(a,e)})}}catch{}},setThemeVariables(e){ut.themeVariables={...ut.themeVariables,...e};try{const e=vt.getAuthConnector();if(e){const t=ht.getSnapshot().themeVariables;e.provider.syncTheme({themeVariables:t,w3mThemeVariables:ye(ut.themeVariables,ut.themeMode)})}}catch{}},getSnapshot:()=>R(ut)},gt=qe(ht),mt=Object.fromEntries(W.map(e=>[e,void 0])),ft=Object.fromEntries(W.map(e=>[e,!0])),wt=P({allConnectors:[],connectors:[],activeConnector:void 0,filterByNamespace:void 0,activeConnectorIds:mt,filterByNamespaceMap:ft}),vt=qe({state:wt,subscribe:e=>T(wt,()=>{e(wt)}),subscribeKey:(e,t)=>O(wt,e,t),initialize(e){e.forEach(e=>{const t=be.getConnectedConnectorId(e);t&&vt.setConnectorId(t,e)})},setActiveConnector(e){e&&(wt.activeConnector=$(e))},setConnectors(e){e.filter(e=>!wt.allConnectors.some(t=>t.id===e.id&&vt.getConnectorName(t.name)===vt.getConnectorName(e.name)&&t.chain===e.chain)).forEach(e=>{"MULTI_CHAIN"!==e.type&&wt.allConnectors.push($(e))});const t=vt.getEnabledNamespaces(),a=vt.getEnabledConnectors(t);wt.connectors=vt.mergeMultiChainConnectors(a)},filterByNamespaces(e){Object.keys(wt.filterByNamespaceMap).forEach(e=>{wt.filterByNamespaceMap[e]=!1}),e.forEach(e=>{wt.filterByNamespaceMap[e]=!0}),vt.updateConnectorsForEnabledNamespaces()},filterByNamespace(e,t){wt.filterByNamespaceMap[e]=t,vt.updateConnectorsForEnabledNamespaces()},updateConnectorsForEnabledNamespaces(){const e=vt.getEnabledNamespaces(),t=vt.getEnabledConnectors(e),a=vt.areAllNamespacesEnabled();wt.connectors=vt.mergeMultiChainConnectors(t),a?ct.clearFilterByNamespaces():ct.filterByNamespaces(e)},getEnabledNamespaces:()=>Object.entries(wt.filterByNamespaceMap).filter(([e,t])=>t).map(([e])=>e),getEnabledConnectors:e=>wt.allConnectors.filter(t=>e.includes(t.chain)),areAllNamespacesEnabled:()=>Object.values(wt.filterByNamespaceMap).every(e=>e),mergeMultiChainConnectors(e){const t=vt.generateConnectorMapByName(e),a=[];return t.forEach(e=>{const t=e[0],n=(null==t?void 0:t.id)===B.CONNECTOR_ID.AUTH;e.length>1&&t?a.push({name:t.name,imageUrl:t.imageUrl,imageId:t.imageId,connectors:[...e],type:n?"AUTH":"MULTI_CHAIN",chain:"eip155",id:(null==t?void 0:t.id)||""}):t&&a.push(t)}),a},generateConnectorMapByName(e){const t=new Map;return e.forEach(e=>{const{name:a}=e,n=vt.getConnectorName(a);if(!n)return;const r=t.get(n)||[];r.find(t=>t.chain===e.chain)||r.push(e),t.set(n,r)}),t},getConnectorName(e){if(!e)return e;return{"Trust Wallet":"Trust"}[e]||e},getUniqueConnectorsByName(e){const t=[];return e.forEach(e=>{t.find(t=>t.chain===e.chain)||t.push(e)}),t},addConnector(e){var t,a,n;if(e.id===B.CONNECTOR_ID.AUTH){const r=e,o=R(Re.state),i=gt.getSnapshot().themeMode,s=gt.getSnapshot().themeVariables;null==(a=null==(t=null==r?void 0:r.provider)?void 0:t.syncDappData)||a.call(t,{metadata:o.metadata,sdkVersion:o.sdkVersion,projectId:o.projectId,sdkType:o.sdkType}),null==(n=null==r?void 0:r.provider)||n.syncTheme({themeMode:i,themeVariables:s,w3mThemeVariables:ye(s,i)}),vt.setConnectors([e])}else vt.setConnectors([e])},getAuthConnector(e){var t;const a=e||Kt.state.activeChain,n=wt.connectors.find(e=>e.id===B.CONNECTOR_ID.AUTH);if(n){if(null==(t=null==n?void 0:n.connectors)?void 0:t.length){return n.connectors.find(e=>e.chain===a)}return n}},getAnnouncedConnectorRdns:()=>wt.connectors.filter(e=>"ANNOUNCED"===e.type).map(e=>{var t;return null==(t=e.info)?void 0:t.rdns}),getConnectorById:e=>wt.allConnectors.find(t=>t.id===e),getConnector({id:e,rdns:t,namespace:a}){const n=a||Kt.state.activeChain;return wt.allConnectors.filter(e=>e.chain===n).find(a=>{var n;return a.explorerId===e||(null==(n=a.info)?void 0:n.rdns)===t})},syncIfAuthConnector(e){var t,a;if("AUTH"!==e.id)return;const n=e,r=R(Re.state),o=gt.getSnapshot().themeMode,i=gt.getSnapshot().themeVariables;null==(a=null==(t=null==n?void 0:n.provider)?void 0:t.syncDappData)||a.call(t,{metadata:r.metadata,sdkVersion:r.sdkVersion,sdkType:r.sdkType,projectId:r.projectId}),n.provider.syncTheme({themeMode:o,themeVariables:i,w3mThemeVariables:ye(i,o)})},getConnectorsByNamespace(e){const t=wt.allConnectors.filter(t=>t.chain===e);return vt.mergeMultiChainConnectors(t)},canSwitchToSmartAccount:e=>Kt.checkIfSmartAccountEnabled()&&bt(e)===Ae.EOA,selectWalletConnector(e){var t;const a=null==(t=pt.state.data)?void 0:t.redirectView,n=vt.getConnector({id:e.id,rdns:e.rdns});We.handleMobileDeeplinkRedirect((null==n?void 0:n.explorerId)||e.id,Kt.state.activeChain),n?pt.push("ConnectingExternal",{connector:n,wallet:e,redirectView:a}):pt.push("ConnectingWalletConnect",{wallet:e,redirectView:a})},getConnectors:e=>e?vt.getConnectorsByNamespace(e):vt.mergeMultiChainConnectors(wt.allConnectors),setFilterByNamespace(e){wt.filterByNamespace=e,wt.connectors=vt.getConnectors(e),ct.setFilterByNamespace(e)},setConnectorId(e,t){e&&(wt.activeConnectorIds={...wt.activeConnectorIds,[t]:e},be.setConnectedConnectorId(t,e))},removeConnectorId(e){wt.activeConnectorIds={...wt.activeConnectorIds,[e]:void 0},be.deleteConnectedConnectorId(e)},getConnectorId(e){if(e)return wt.activeConnectorIds[e]},isConnected:e=>e?Boolean(wt.activeConnectorIds[e]):Object.values(wt.activeConnectorIds).some(e=>Boolean(e)),resetConnectorIds(){wt.activeConnectorIds={...mt}}}),yt={checkNamespaceConnectorId:(e,t)=>vt.getConnectorId(e)===t,isSocialProvider:e=>Ce.DEFAULT_REMOTE_FEATURES.socials.includes(e),connectWalletConnect:({walletConnect:e,connector:t,closeModalOnConnect:a=!0,redirectViewOnModalClose:n="Connect",onOpen:r,onConnect:o})=>new Promise((i,s)=>{if(e&&vt.setActiveConnector(t),null==r||r(ke.isMobile()&&e),n){const e=Jt.subscribeKey("open",t=>{t||(pt.state.view!==n&&pt.replace(n),e(),s(new Error("Modal closed")))})}const c=Kt.subscribeKey("activeCaipAddress",e=>{e&&(null==o||o(),a&&Jt.close(),c(),i(Z.parseCaipAddress(e)))})}),connectExternal:e=>new Promise((t,a)=>{const n=Kt.subscribeKey("activeCaipAddress",e=>{e&&(Jt.close(),n(),t(Z.parseCaipAddress(e)))});xt.connectExternal(e,e.chain).catch(()=>{n(),a(new Error("Connection rejected"))})}),connectSocial({social:e,namespace:t,closeModalOnConnect:a=!0,onOpenFarcaster:n,onConnect:r}){let o,i=!1,s=null;const c=t||Kt.state.activeChain,l=Kt.subscribeKey("activeCaipAddress",e=>{e&&(a&&Jt.close(),l())});return new Promise((t,a)=>{async function l(n){var r;if(null==(r=n.data)?void 0:r.resultUri)if(n.origin===B.SECURE_SITE_SDK_ORIGIN){window.removeEventListener("message",l,!1);try{const r=vt.getAuthConnector(c);if(r&&!i){o&&o.close(),i=!0;const s=n.data.resultUri;rt.sendEvent({type:"track",event:"SOCIAL_LOGIN_REQUEST_USER_DATA",properties:{provider:e}}),be.setConnectedSocialProvider(e),await xt.connectExternal({id:r.id,type:r.type,socialUri:s},r.chain);const c=Kt.state.activeCaipAddress;if(!c)return void a(new Error("Failed to connect"));t(Z.parseCaipAddress(c)),rt.sendEvent({type:"track",event:"SOCIAL_LOGIN_SUCCESS",properties:{provider:e}})}}catch(s){rt.sendEvent({type:"track",event:"SOCIAL_LOGIN_ERROR",properties:{provider:e,message:ke.parseError(s)}}),a(new Error("Failed to connect"))}}else rt.sendEvent({type:"track",event:"SOCIAL_LOGIN_ERROR",properties:{provider:e,message:"Untrusted Origin"}})}!async function(){if(rt.sendEvent({type:"track",event:"SOCIAL_LOGIN_STARTED",properties:{provider:e}}),"farcaster"===e){null==n||n();const t=Jt.subscribeKey("open",n=>{n||"farcaster"!==e||(a(new Error("Popup closed")),null==r||r(),t())}),o=vt.getAuthConnector();if(o){const e=Kt.getAccountData(c);if(!(null==e?void 0:e.farcasterUrl))try{const{url:e}=await o.provider.getFarcasterUri();Kt.setAccountProp("farcasterUrl",e,c)}catch{a(new Error("Failed to connect to farcaster"))}}}else{const t=vt.getAuthConnector();s=ke.returnOpenHref(`${B.SECURE_SITE_SDK_ORIGIN}/loading`,"popupWindow","width=600,height=800,scrollbars=yes");try{if(t){const{uri:n}=await t.provider.getSocialRedirectUri({provider:e});if(s&&n){s.location.href=n,o=s;const e=setInterval(()=>{(null==o?void 0:o.closed)&&!i&&(a(new Error("Popup closed")),clearInterval(e))},1e3);window.addEventListener("message",l,!1)}else null==s||s.close(),a(new Error("Failed to initiate social connection"))}}catch{a(new Error("Failed to initiate social connection")),null==s||s.close()}}}()})},connectEmail:({closeModalOnConnect:e=!0,redirectViewOnModalClose:t="Connect",onOpen:a,onConnect:n})=>new Promise((r,o)=>{if(null==a||a(),t){const e=Jt.subscribeKey("open",a=>{a||(pt.state.view!==t&&pt.replace(t),e(),o(new Error("Modal closed")))})}const i=Kt.subscribeKey("activeCaipAddress",t=>{t&&(null==n||n(),e&&Jt.close(),i(),r(Z.parseCaipAddress(t)))})}),async updateEmail(){const e=be.getConnectedConnectorId(Kt.state.activeChain),t=vt.getAuthConnector();if(!t)throw new Error("No auth connector found");if(e!==B.CONNECTOR_ID.AUTH)throw new Error("Not connected to email or social");const a=t.provider.getEmail()??"";return await Jt.open({view:"UpdateEmailWallet",data:{email:a,redirectView:void 0}}),new Promise((e,n)=>{const r=setInterval(()=>{const n=t.provider.getEmail()??"";n!==a&&(Jt.close(),clearInterval(r),o(),e({email:n}))},1e3),o=Jt.subscribeKey("open",e=>{e||("Connect"!==pt.state.view&&pt.push("Connect"),clearInterval(r),o(),n(new Error("Modal closed")))})})},canSwitchToSmartAccount:e=>Kt.checkIfSmartAccountEnabled()&&bt(e)===Ae.EOA};function Ct(){var e,t;const a=(null==(e=Kt.state.activeCaipNetwork)?void 0:e.chainNamespace)||"eip155";return`${a}:${(null==(t=Kt.state.activeCaipNetwork)?void 0:t.id)||1}:${Ce.NATIVE_TOKEN_ADDRESS[a]}`}function bt(e){var t;return null==(t=Kt.getAccountData(e))?void 0:t.preferredAccountType}const kt={getConnectionStatus(e,t){const a=vt.state.activeConnectorIds[t],n=xt.getConnections(t);if(Boolean(a)&&e.connectorId===a)return"connected";return n.some(t=>t.connectorId.toLowerCase()===e.connectorId.toLowerCase())?"active":"disconnected"},excludeConnectorAddressFromConnections:({connections:e,connectorId:t,addresses:a})=>e.map(e=>{if(!!t&&e.connectorId.toLowerCase()===t.toLowerCase()&&a){const t=e.accounts.filter(e=>!a.some(t=>t.toLowerCase()===e.address.toLowerCase()));return{...e,accounts:t}}return e}),excludeExistingConnections(e,t){const a=new Set(e);return t.filter(e=>!a.has(e.connectorId))},getConnectionsByConnectorId:(e,t)=>e.filter(e=>e.connectorId.toLowerCase()===t.toLowerCase()),getConnectionsData(e){var t;const a=Boolean(null==(t=Re.state.remoteFeatures)?void 0:t.multiWallet),n=vt.state.activeConnectorIds[e],r=xt.getConnections(e),o=(xt.state.recentConnections.get(e)??[]).filter(e=>vt.getConnectorById(e.connectorId)),i=kt.excludeExistingConnections([...r.map(e=>e.connectorId),...n?[n]:[]],o);return a?{connections:r,recentConnections:i}:{connections:r.filter(e=>e.connectorId.toLowerCase()===(null==n?void 0:n.toLowerCase())),recentConnections:[]}}},Et=P({transactions:[],transactionsByYear:{},lastNetworkInView:void 0,loading:!1,empty:!1,next:void 0}),It=qe({state:Et,subscribe:e=>T(Et,()=>e(Et)),setLastNetworkInView(e){Et.lastNetworkInView=e},async fetchTransactions(e){var t;if(!e)throw new Error("Transactions can't be fetched without an accountAddress");Et.loading=!0;try{const a=await Be.fetchTransactions({account:e,cursor:Et.next,chainId:null==(t=Kt.state.activeCaipNetwork)?void 0:t.caipNetworkId}),n=It.filterSpamTransactions(a.data),r=It.filterByConnectedChain(n),o=[...Et.transactions,...r];Et.loading=!1,Et.transactions=o,Et.transactionsByYear=It.groupTransactionsByYearAndMonth(Et.transactionsByYear,r),Et.empty=0===o.length,Et.next=a.next?a.next:void 0}catch(a){const t=Kt.state.activeChain;rt.sendEvent({type:"track",event:"ERROR_FETCH_TRANSACTIONS",properties:{address:e,projectId:Re.state.projectId,cursor:Et.next,isSmartAccount:bt(t)===Ae.SMART_ACCOUNT}}),Le.showError("Failed to fetch transactions"),Et.loading=!1,Et.empty=!0,Et.next=void 0}},groupTransactionsByYearAndMonth(e={},t=[]){const a=e;return t.forEach(e=>{const t=new Date(e.metadata.minedAt).getFullYear(),n=new Date(e.metadata.minedAt).getMonth(),r=a[t]??{},o=(r[n]??[]).filter(t=>t.id!==e.id);a[t]={...r,[n]:[...o,e].sort((e,t)=>new Date(t.metadata.minedAt).getTime()-new Date(e.metadata.minedAt).getTime())}}),a},filterSpamTransactions:e=>e.filter(e=>!e.transfers.every(e=>{var t;return!0===(null==(t=e.nft_info)?void 0:t.flags.is_spam)})),filterByConnectedChain(e){var t;const a=null==(t=Kt.state.activeCaipNetwork)?void 0:t.caipNetworkId;return e.filter(e=>e.metadata.chain===a)},clearCursor(){Et.next=void 0},resetTransactions(){Et.transactions=[],Et.transactionsByYear={},Et.lastNetworkInView=void 0,Et.loading=!1,Et.empty=!1,Et.next=void 0}},"API_ERROR"),At=P({connections:new Map,recentConnections:new Map,isSwitchingConnection:!1,wcError:!1,buffering:!1,status:"disconnected"});let St;const xt=qe({state:At,subscribe:e=>T(At,()=>e(At)),subscribeKey:(e,t)=>O(At,e,t),_getClient:()=>At._client,setClient(e){At._client=$(e)},initialize(e){const t=e.filter(e=>Boolean(e.namespace)).map(e=>e.namespace);xt.syncStorageConnections(t)},syncStorageConnections(e){const t=be.getConnections(),a=e??Array.from(Kt.state.chains.keys());for(const n of a){const e=t[n]??[],a=new Map(At.recentConnections);a.set(n,e),At.recentConnections=a}},getConnections:e=>e?At.connections.get(e)??[]:[],hasAnyConnection(e){const t=xt.state.connections;return Array.from(t.values()).flatMap(e=>e).some(({connectorId:t})=>t===e)},async connectWalletConnect({cache:e="auto"}={}){var t,a,n,r;const o=ke.isTelegram()||ke.isSafari()&&ke.isIos();if("always"===e||"auto"===e&&o){if(St)return await St,void(St=void 0);if(!ke.isPairingExpired(null==At?void 0:At.wcPairingExpiry)){const e=At.wcUri;return void(At.wcUri=e)}St=null==(a=null==(t=xt._getClient())?void 0:t.connectWalletConnect)?void 0:a.call(t).catch(()=>{}),xt.state.status="connecting",await St,St=void 0,At.wcPairingExpiry=void 0,xt.state.status="connected"}else await(null==(r=null==(n=xt._getClient())?void 0:n.connectWalletConnect)?void 0:r.call(n))},async connectExternal(e,t,a=!0){var n,r;const o=await(null==(r=null==(n=xt._getClient())?void 0:n.connectExternal)?void 0:r.call(n,e));return a&&Kt.setActiveNamespace(t),o},async reconnectExternal(e){var t,a;await(null==(a=null==(t=xt._getClient())?void 0:t.reconnectExternal)?void 0:a.call(t,e));const n=e.chain||Kt.state.activeChain;n&&vt.setConnectorId(e.id,n)},async setPreferredAccountType(e,t){var a;if(!t)return;Jt.setLoading(!0,Kt.state.activeChain);const n=vt.getAuthConnector();n&&(Kt.setAccountProp("preferredAccountType",e,t),await n.provider.setPreferredAccount(e),be.setPreferredAccountTypes(Object.entries(Kt.state.chains).reduce((e,[t,a])=>{const n=t,r=bt(n);return void 0!==r&&(e[n]=r),e},{})),await xt.reconnectExternal(n),Jt.setLoading(!1,Kt.state.activeChain),rt.sendEvent({type:"track",event:"SET_PREFERRED_ACCOUNT_TYPE",properties:{accountType:e,network:(null==(a=Kt.state.activeCaipNetwork)?void 0:a.caipNetworkId)||""}}))},async signMessage(e){var t;return null==(t=xt._getClient())?void 0:t.signMessage(e)},parseUnits(e,t){var a;return null==(a=xt._getClient())?void 0:a.parseUnits(e,t)},formatUnits(e,t){var a;return null==(a=xt._getClient())?void 0:a.formatUnits(e,t)},updateBalance(e){var t;return null==(t=xt._getClient())?void 0:t.updateBalance(e)},async sendTransaction(e){var t;return null==(t=xt._getClient())?void 0:t.sendTransaction(e)},async getCapabilities(e){var t;return null==(t=xt._getClient())?void 0:t.getCapabilities(e)},async grantPermissions(e){var t;return null==(t=xt._getClient())?void 0:t.grantPermissions(e)},async walletGetAssets(e){var t;return(null==(t=xt._getClient())?void 0:t.walletGetAssets(e))??{}},async estimateGas(e){var t;return null==(t=xt._getClient())?void 0:t.estimateGas(e)},async writeContract(e){var t;return null==(t=xt._getClient())?void 0:t.writeContract(e)},async getEnsAddress(e){var t;return null==(t=xt._getClient())?void 0:t.getEnsAddress(e)},async getEnsAvatar(e){var t;return null==(t=xt._getClient())?void 0:t.getEnsAvatar(e)},checkInstalled(e){var t,a;return(null==(a=null==(t=xt._getClient())?void 0:t.checkInstalled)?void 0:a.call(t,e))||!1},resetWcConnection(){At.wcUri=void 0,At.wcPairingExpiry=void 0,At.wcLinking=void 0,At.recentWallet=void 0,At.status="disconnected",It.resetTransactions(),be.deleteWalletConnectDeepLink(),be.deleteRecentWallet()},resetUri(){At.wcUri=void 0,At.wcPairingExpiry=void 0,St=void 0},finalizeWcConnection(e){var t,a;const{wcLinking:n,recentWallet:r}=xt.state;n&&be.setWalletConnectDeepLink(n),r&&be.setAppKitRecent(r),e&&rt.sendEvent({type:"track",event:"CONNECT_SUCCESS",address:e,properties:{method:n?"mobile":"qrcode",name:(null==(a=null==(t=pt.state.data)?void 0:t.wallet)?void 0:a.name)||"Unknown",view:pt.state.view,walletRank:null==r?void 0:r.order}})},setWcBasic(e){At.wcBasic=e},setUri(e){At.wcUri=e,At.wcPairingExpiry=ke.getPairingExpiry()},setWcLinking(e){At.wcLinking=e},setWcError(e){At.wcError=e,At.buffering=!1},setRecentWallet(e){At.recentWallet=e},setBuffering(e){At.buffering=e},setStatus(e){At.status=e},setIsSwitchingConnection(e){At.isSwitchingConnection=e},async disconnect({id:e,namespace:t,initialDisconnect:a}={}){var n;try{await(null==(n=xt._getClient())?void 0:n.disconnect({id:e,chainNamespace:t,initialDisconnect:a}))}catch(r){throw new Ze("Failed to disconnect","INTERNAL_SDK_ERROR",r)}},async disconnectConnector({id:e,namespace:t}){var a;try{await(null==(a=xt._getClient())?void 0:a.disconnectConnector({id:e,namespace:t}))}catch(n){throw new Ze("Failed to disconnect connector","INTERNAL_SDK_ERROR",n)}},setConnections(e,t){const a=new Map(At.connections);a.set(t,e),At.connections=a},async handleAuthAccountSwitch({address:e,namespace:t}){var a,n;const r=Kt.getAccountData(t),o=null==(n=null==(a=null==r?void 0:r.user)?void 0:a.accounts)?void 0:n.find(e=>"smartAccount"===e.type),i=o&&o.address.toLowerCase()===e.toLowerCase()&&yt.canSwitchToSmartAccount(t)?"smartAccount":"eoa";await xt.setPreferredAccountType(i,t)},async handleActiveConnection({connection:e,namespace:t,address:a}){const n=vt.getConnectorById(e.connectorId),r=e.connectorId===B.CONNECTOR_ID.AUTH;if(!n)throw new Error(`No connector found for connection: ${e.connectorId}`);if(!r){const e=await xt.connectExternal({id:n.id,type:n.type,provider:n.provider,address:a,chain:t},t);return null==e?void 0:e.address}return a&&await xt.handleAuthAccountSwitch({address:a,namespace:t}),a},async handleDisconnectedConnection({connection:e,namespace:t,address:a,closeModalOnConnect:n}){var r,o;const i=vt.getConnectorById(e.connectorId),s=null==(o=null==(r=e.auth)?void 0:r.name)?void 0:o.toLowerCase(),c=e.connectorId===B.CONNECTOR_ID.AUTH,l=e.connectorId===B.CONNECTOR_ID.WALLET_CONNECT;if(!i)throw new Error(`No connector found for connection: ${e.connectorId}`);let d;if(c)if(s&&yt.isSocialProvider(s)){const{address:e}=await yt.connectSocial({social:s,closeModalOnConnect:n,onOpenFarcaster(){Jt.open({view:"ConnectingFarcaster"})},onConnect(){pt.replace("ProfileWallets")}});d=e}else{const{address:e}=await yt.connectEmail({closeModalOnConnect:n,onOpen(){Jt.open({view:"EmailLogin"})},onConnect(){pt.replace("ProfileWallets")}});d=e}else if(l){const{address:e}=await yt.connectWalletConnect({walletConnect:!0,connector:i,closeModalOnConnect:n,onOpen(e){const t=e?"AllWallets":"ConnectingWalletConnect";Jt.state.open?pt.push(t):Jt.open({view:t})},onConnect(){pt.replace("ProfileWallets")}});d=e}else{const e=await xt.connectExternal({id:i.id,type:i.type,provider:i.provider,chain:t},t);e&&(d=e.address)}return c&&a&&await xt.handleAuthAccountSwitch({address:a,namespace:t}),d},async switchConnection({connection:e,address:t,namespace:a,closeModalOnConnect:n,onChange:r}){var o;let i;const s=null==(o=Kt.getAccountData(a))?void 0:o.caipAddress;if(s){const{address:e}=Z.parseCaipAddress(s);i=e}const c=kt.getConnectionStatus(e,a);switch(c){case"connected":case"active":{const n=await xt.handleActiveConnection({connection:e,namespace:a,address:t});if(i&&n){const e=n.toLowerCase()!==i.toLowerCase();null==r||r({address:n,namespace:a,hasSwitchedAccount:e,hasSwitchedWallet:"active"===c})}break}case"disconnected":{const o=await xt.handleDisconnectedConnection({connection:e,namespace:a,address:t,closeModalOnConnect:n});o&&(null==r||r({address:o,namespace:a,hasSwitchedAccount:!0,hasSwitchedWallet:!0}));break}default:throw new Error(`Invalid connection status: ${c}`)}}}),Nt={createBalance(e,t){const a={name:e.metadata.name||"",symbol:e.metadata.symbol||"",decimals:e.metadata.decimals||0,value:e.metadata.value||0,price:e.metadata.price||0,iconUrl:e.metadata.iconUrl||""};return{name:a.name,symbol:a.symbol,chainId:t,address:"native"===e.address?void 0:this.convertAddressToCAIP10Address(e.address,t),value:a.value,price:a.price,quantity:{decimals:a.decimals.toString(),numeric:this.convertHexToBalance({hex:e.balance,decimals:a.decimals})},iconUrl:a.iconUrl}},convertHexToBalance:({hex:e,decimals:t})=>g(BigInt(e),t),convertAddressToCAIP10Address:(e,t)=>`${t}:${e}`,createCAIP2ChainId:(e,t)=>`${t}:${parseInt(e,16)}`,getChainIdHexFromCAIP2ChainId(e){const t=e.split(":");if(t.length<2||!t[1])return"0x0";const a=t[1],n=parseInt(a,10);return isNaN(n)?"0x0":`0x${n.toString(16)}`},isWalletGetAssetsResponse(e){return"object"==typeof e&&null!==e&&Object.values(e).every(e=>Array.isArray(e)&&e.every(e=>this.isValidAsset(e)))},isValidAsset:e=>"object"==typeof e&&null!==e&&"string"==typeof e.address&&"string"==typeof e.balance&&("ERC20"===e.type||"NATIVE"===e.type)&&"object"==typeof e.metadata&&null!==e.metadata&&"string"==typeof e.metadata.name&&"string"==typeof e.metadata.symbol&&"number"==typeof e.metadata.decimals&&"number"==typeof e.metadata.price&&"string"==typeof e.metadata.iconUrl};let _t;async function Pt(){if(!_t){const{createPublicClient:e,http:t,defineChain:a}=await m(async()=>{const{createPublicClient:e,http:t,defineChain:a}=await import("./wagmi-vendor-B2woDmio.js").then(e=>e.b0);return{createPublicClient:e,http:t,defineChain:a}},__vite__mapDeps([0,1]));_t={createPublicClient:e,http:t,defineChain:a}}return _t}const Tt={getBlockchainApiRpcUrl(e,t){const a=new URL("https://rpc.walletconnect.org/v1/");return a.searchParams.set("chainId",e),a.searchParams.set("projectId",t),a.toString()},async getViemChain(e){const{defineChain:t}=await Pt(),{chainId:a}=Z.parseCaipNetworkId(e.caipNetworkId);return t({...e,id:Number(a)})},async createViemPublicClient(e){const{createPublicClient:t,http:a}=await Pt(),n=Re.state.projectId,r=await Tt.getViemChain(e);if(!r)throw new Error(`Chain ${e.caipNetworkId} not found in viem/chains`);return t({chain:r,transport:a(Tt.getBlockchainApiRpcUrl(e.caipNetworkId,n))})}},Rt={async getMyTokensWithBalance(e){var t;const a=null==(t=Kt.getAccountData())?void 0:t.address,n=Kt.state.activeCaipNetwork,r=vt.getConnectorId("eip155")===B.CONNECTOR_ID.AUTH;if(!a||!n)return[];const o=`${n.caipNetworkId}:${a}`,i=be.getBalanceCacheForCaipAddress(o);if(i)return i.balances;if(n.chainNamespace===B.CHAIN.EVM&&r){const e=await this.getEIP155Balances(a,n);if(e)return this.filterLowQualityTokens(e)}const s=await Be.getBalance(a,n.caipNetworkId,e);return this.filterLowQualityTokens(s.balances)},async getEIP155Balances(e,t){var a,n;try{const r=Nt.getChainIdHexFromCAIP2ChainId(t.caipNetworkId),o=await xt.getCapabilities(e);if(!(null==(n=null==(a=null==o?void 0:o[r])?void 0:a.assetDiscovery)?void 0:n.supported))return null;const i=await xt.walletGetAssets({account:e,chainFilter:[r]});if(!Nt.isWalletGetAssetsResponse(i))return null;const s=(i[r]||[]).map(e=>Nt.createBalance(e,t.caipNetworkId));return be.updateBalanceCache({caipAddress:`${t.caipNetworkId}:${e}`,balance:{balances:s},timestamp:Date.now()}),s}catch(r){return null}},filterLowQualityTokens:e=>e.filter(e=>"0"!==e.quantity.decimals),async fetchERC20Balance({caipAddress:e,assetAddress:t,caipNetwork:a}){const n=await Tt.createViemPublicClient(a),{address:r}=Z.parseCaipAddress(e),[{result:o},{result:i},{result:s},{result:c}]=await n.multicall({contracts:[{address:t,functionName:"name",args:[],abi:f},{address:t,functionName:"symbol",args:[],abi:f},{address:t,functionName:"balanceOf",args:[r],abi:f},{address:t,functionName:"decimals",args:[],abi:f}]});return{name:o,symbol:i,decimals:c,balance:s&&c?g(s,c):"0"}}},$t={adapters:{}},Ot={state:$t,initialize(e){$t.adapters={...e}},get:e=>$t.adapters[e]},Lt={eip155:void 0,solana:void 0,polkadot:void 0,bip122:void 0,cosmos:void 0,sui:void 0,stacks:void 0},Dt=P({providers:{...Lt},providerIds:{...Lt}}),Ut={state:Dt,subscribeKey:(e,t)=>O(Dt,e,t),subscribe:e=>T(Dt,()=>{e(Dt)}),subscribeProviders:e=>T(Dt.providers,()=>e(Dt.providers)),setProvider(e,t){e&&t&&(Dt.providers[e]=$(t))},getProvider(e){if(e)return Dt.providers[e]},setProviderId(e,t){t&&(Dt.providerIds[e]=t)},getProviderId(e){if(e)return Dt.providerIds[e]},reset(){Dt.providers={...Lt},Dt.providerIds={...Lt}},resetChain(e){Dt.providers[e]=void 0,Dt.providerIds[e]=void 0}},Mt=P({loading:!1,open:!1,selectedNetworkId:void 0,activeChain:void 0,initialized:!1}),Bt={state:Mt,subscribe:e=>T(Mt,()=>e(Mt)),subscribeOpen:e=>O(Mt,"open",e),set(e){Object.assign(Mt,{...Mt,...e})}},Ft={async getTokenList(e){var t;const a=await Be.fetchSwapTokens({chainId:e});return(null==(t=null==a?void 0:a.tokens)?void 0:t.map(e=>({...e,eip2612:!1,quantity:{decimals:"0",numeric:"0"},price:0,value:0})))||[]},async fetchGasPrice(){var e;const t=Kt.state.activeCaipNetwork;if(!t)return null;try{if("solana"===t.chainNamespace){const t=null==(e=await(null==xt?void 0:xt.estimateGas({chainNamespace:"solana"})))?void 0:e.toString();return{standard:t,fast:t,instant:t}}return await Be.fetchGasPrice({chainId:t.caipNetworkId})}catch{return null}},async fetchSwapAllowance({tokenAddress:e,userAddress:t,sourceTokenAmount:a,sourceTokenDecimals:n}){const r=await Be.fetchSwapAllowance({tokenAddress:e,userAddress:t});if((null==r?void 0:r.allowance)&&a&&n){const e=xt.parseUnits(a,n)||0;return BigInt(r.allowance)>=e}return!1},async getMyTokensWithBalance(e){const t=await Rt.getMyTokensWithBalance(e);return Kt.setAccountProp("tokenBalance",t,Kt.state.activeChain),this.mapBalancesToSwapTokens(t)},mapBalancesToSwapTokens:e=>(null==e?void 0:e.map(e=>({...e,address:(null==e?void 0:e.address)?e.address:Ct(),decimals:parseInt(e.quantity.decimals,10),logoUri:e.iconUrl,eip2612:!1})))||[],async handleSwapError(e){var t,a;try{const n=null==e?void 0:e.cause;if(!(null==n?void 0:n.json))return;const r=await n.json(),o=null==(a=null==(t=null==r?void 0:r.reasons)?void 0:t[0])?void 0:a.description;return(null==o?void 0:o.includes("insufficient liquidity"))?"Insufficient liquidity":void 0}catch{return}}},Wt=P({tokenBalances:[],loading:!1}),zt=qe({state:Wt,subscribe:e=>T(Wt,()=>e(Wt)),subscribeKey:(e,t)=>O(Wt,e,t),setToken(e){e&&(Wt.token=$(e))},setTokenAmount(e){Wt.sendTokenAmount=e},setReceiverAddress(e){Wt.receiverAddress=e},setReceiverProfileImageUrl(e){Wt.receiverProfileImageUrl=e},setReceiverProfileName(e){Wt.receiverProfileName=e},setNetworkBalanceInUsd(e){Wt.networkBalanceInUSD=e},setLoading(e){Wt.loading=e},getSdkEventProperties(e){var t,a;return{message:ke.parseError(e),isSmartAccount:bt(Kt.state.activeChain)===Ae.SMART_ACCOUNT,token:(null==(t=Wt.token)?void 0:t.symbol)||"",amount:Wt.sendTokenAmount??0,network:(null==(a=Kt.state.activeCaipNetwork)?void 0:a.caipNetworkId)||""}},async sendToken(){var e;try{switch(zt.setLoading(!0),null==(e=Kt.state.activeCaipNetwork)?void 0:e.chainNamespace){case"eip155":return void(await zt.sendEvmToken());case"solana":return void(await zt.sendSolanaToken());default:throw new Error("Unsupported chain")}}catch(t){if(K.isUserRejectedRequestError(t))throw new G(t);throw t}finally{zt.setLoading(!1)}},async sendEvmToken(){var e,t,a;const n=Kt.state.activeChain;if(!n)throw new Error("SendController:sendEvmToken - activeChainNamespace is required");const r=bt(n);if(!zt.state.sendTokenAmount||!zt.state.receiverAddress)throw new Error("An amount and receiver address are required");if(!zt.state.token)throw new Error("A token is required");if(null==(e=zt.state.token)?void 0:e.address){rt.sendEvent({type:"track",event:"SEND_INITIATED",properties:{isSmartAccount:r===Ae.SMART_ACCOUNT,token:zt.state.token.address,amount:zt.state.sendTokenAmount,network:(null==(t=Kt.state.activeCaipNetwork)?void 0:t.caipNetworkId)||""}});const{hash:e}=await zt.sendERC20Token({receiverAddress:zt.state.receiverAddress,tokenAddress:zt.state.token.address,sendTokenAmount:zt.state.sendTokenAmount,decimals:zt.state.token.quantity.decimals});e&&(Wt.hash=e)}else{rt.sendEvent({type:"track",event:"SEND_INITIATED",properties:{isSmartAccount:r===Ae.SMART_ACCOUNT,token:zt.state.token.symbol||"",amount:zt.state.sendTokenAmount,network:(null==(a=Kt.state.activeCaipNetwork)?void 0:a.caipNetworkId)||""}});const{hash:e}=await zt.sendNativeToken({receiverAddress:zt.state.receiverAddress,sendTokenAmount:zt.state.sendTokenAmount,decimals:zt.state.token.quantity.decimals});e&&(Wt.hash=e)}},async fetchTokenBalance(e){var t,a,n;Wt.loading=!0;const r=Kt.state.activeChain,o=null==(t=Kt.state.activeCaipNetwork)?void 0:t.caipNetworkId,i=null==(a=Kt.state.activeCaipNetwork)?void 0:a.chainNamespace,s=(null==(n=Kt.getAccountData(r))?void 0:n.caipAddress)??Kt.state.activeCaipAddress,c=s?ke.getPlainAddress(s):void 0;if(Wt.lastRetry&&!ke.isAllowedRetry(Wt.lastRetry,30*Ce.ONE_SEC_MS))return Wt.loading=!1,[];try{if(c&&o&&i){const e=await Rt.getMyTokensWithBalance();return Wt.tokenBalances=e,Wt.lastRetry=void 0,e}}catch(l){Wt.lastRetry=Date.now(),null==e||e(l),Le.showError("Token Balance Unavailable")}finally{Wt.loading=!1}return[]},fetchNetworkBalance(){if(0===Wt.tokenBalances.length)return;const e=Ft.mapBalancesToSwapTokens(Wt.tokenBalances);if(!e)return;const t=e.find(e=>e.address===Ct());t&&(Wt.networkBalanceInUSD=t?z.multiply(t.quantity.numeric,t.price).toString():"0")},async sendNativeToken(e){var t,a,n,r;pt.pushTransactionStack({});const o=e.receiverAddress,i=null==(t=Kt.getAccountData())?void 0:t.address,s=xt.parseUnits(e.sendTokenAmount.toString(),Number(e.decimals)),c=await xt.sendTransaction({chainNamespace:B.CHAIN.EVM,to:o,address:i,data:"0x",value:s??BigInt(0)});return rt.sendEvent({type:"track",event:"SEND_SUCCESS",properties:{isSmartAccount:bt("eip155")===Ae.SMART_ACCOUNT,token:(null==(a=zt.state.token)?void 0:a.symbol)||"",amount:e.sendTokenAmount,network:(null==(n=Kt.state.activeCaipNetwork)?void 0:n.caipNetworkId)||"",hash:c||""}}),null==(r=xt._getClient())||r.updateBalance("eip155"),zt.resetSend(),{hash:c}},async sendERC20Token(e){var t,a,n;pt.pushTransactionStack({onSuccess(){pt.replace("Account")}});const r=xt.parseUnits(e.sendTokenAmount.toString(),Number(e.decimals)),o=null==(t=Kt.getAccountData())?void 0:t.address;if(o&&e.sendTokenAmount&&e.receiverAddress&&e.tokenAddress){const t=ke.getPlainAddress(e.tokenAddress);if(!t)throw new Error("SendController:sendERC20Token - tokenAddress is required");const i=await xt.writeContract({fromAddress:o,tokenAddress:t,args:[e.receiverAddress,r??BigInt(0)],method:"transfer",abi:H(t),chainNamespace:B.CHAIN.EVM});return rt.sendEvent({type:"track",event:"SEND_SUCCESS",properties:{isSmartAccount:bt("eip155")===Ae.SMART_ACCOUNT,token:(null==(a=zt.state.token)?void 0:a.symbol)||"",amount:e.sendTokenAmount,network:(null==(n=Kt.state.activeCaipNetwork)?void 0:n.caipNetworkId)||"",hash:i||""}}),zt.resetSend(),{hash:i}}return{hash:void 0}},async sendSolanaToken(){var e,t,a;if(!zt.state.sendTokenAmount||!zt.state.receiverAddress)throw new Error("An amount and receiver address are required");let n;pt.pushTransactionStack({onSuccess(){pt.replace("Account")}}),zt.state.token&&zt.state.token.address!==Ce.SOLANA_NATIVE_TOKEN_ADDRESS&&(n=ke.isCaipAddress(zt.state.token.address)?ke.getPlainAddress(zt.state.token.address):zt.state.token.address);const r=await xt.sendTransaction({chainNamespace:"solana",tokenMint:n,to:zt.state.receiverAddress,value:zt.state.sendTokenAmount});r&&(Wt.hash=r),null==(e=xt._getClient())||e.updateBalance("solana"),rt.sendEvent({type:"track",event:"SEND_SUCCESS",properties:{isSmartAccount:!1,token:(null==(t=zt.state.token)?void 0:t.symbol)||"",amount:zt.state.sendTokenAmount,network:(null==(a=Kt.state.activeCaipNetwork)?void 0:a.caipNetworkId)||"",hash:r||""}}),zt.resetSend()},resetSend(){Wt.token=void 0,Wt.sendTokenAmount=void 0,Wt.receiverAddress=void 0,Wt.receiverProfileImageUrl=void 0,Wt.receiverProfileName=void 0,Wt.loading=!1,Wt.tokenBalances=[]}}),jt={currentTab:0,tokenBalance:[],smartAccountDeployed:!1,addressLabels:new Map,user:void 0,preferredAccountType:void 0},Vt={caipNetwork:void 0,supportsAllNetworks:!0,smartAccountEnabledNetworks:[]},Ht=P({chains:function(){const e=new Map,t=new WeakMap,a=a=>t.get(a)||e,n={data:[],index:0,epoch:0,get size(){U(this)||(()=>{const a=D.get(n),r=null==a?void 0:a[1];if(r&&!t.has(r)){const a=new Map(e);t.set(r,a)}})();return a(this).size},get(e){const t=a(this).get(e);if(void 0!==t)return this.data[t];this.epoch},has(e){const t=a(this);return this.epoch,t.has(e)},set(t,a){if(!U(this))throw new Error("Cannot perform mutations on a snapshot");const n=e.get(t);return void 0===n?(e.set(t,this.index),this.data[this.index++]=a):this.data[n]=a,this.epoch++,this},delete(t){if(!U(this))throw new Error("Cannot perform mutations on a snapshot");const a=e.get(t);return void 0!==a&&(delete this.data[a],e.delete(t),this.epoch++,!0)},clear(){if(!U(this))throw new Error("Cannot perform mutations on a snapshot");this.data.length=0,this.index=0,this.epoch++,e.clear()},forEach(e){this.epoch;a(this).forEach((t,a)=>{e(this.data[t],a,this)})},*entries(){this.epoch;const e=a(this);for(const[t,a]of e)yield[t,this.data[a]]},*keys(){this.epoch;const e=a(this);for(const t of e.keys())yield t},*values(){this.epoch;const e=a(this);for(const t of e.values())yield this.data[t]},[Symbol.iterator](){return this.entries()},get[Symbol.toStringTag](){return"Map"},toJSON(){return new Map(this.entries())}},r=P(n);return Object.defineProperties(r,{size:{enumerable:!1},index:{enumerable:!1},epoch:{enumerable:!1},data:{enumerable:!1},toJSON:{enumerable:!1}}),Object.seal(r),r}(),activeCaipAddress:void 0,activeChain:void 0,activeCaipNetwork:void 0,noAdapters:!1,universalAdapter:{connectionControllerClient:void 0},isSwitchingNamespace:!1}),Zt={state:Ht,subscribe:e=>T(Ht,()=>{e(Ht)}),subscribeKey:(e,t)=>O(Ht,e,t),subscribeAccountStateProp(e,t,a){var n;const r=a||Ht.activeChain;return r?O((null==(n=Ht.chains.get(r))?void 0:n.accountState)||{},e,t):()=>{}},subscribeChainProp(e,t,a){let n;return T(Ht.chains,()=>{var r;const o=a||Ht.activeChain;if(o){const a=null==(r=Ht.chains.get(o))?void 0:r[e];n!==a&&(n=a,t(a))}})},initialize(e,t,a){const{chainId:n,namespace:r}=be.getActiveNetworkProps(),o=null==t?void 0:t.find(e=>e.id.toString()===(null==n?void 0:n.toString())),i=e.find(e=>(null==e?void 0:e.namespace)===r)||(null==e?void 0:e[0]),s=e.map(e=>e.namespace).filter(e=>void 0!==e),c=Re.state.enableEmbedded?new Set([...s]):new Set([...(null==t?void 0:t.map(e=>e.chainNamespace))??[]]);0!==(null==e?void 0:e.length)&&i||(Ht.noAdapters=!0),Ht.noAdapters||(Ht.activeChain=null==i?void 0:i.namespace,Ht.activeCaipNetwork=o,Kt.setChainNetworkData(null==i?void 0:i.namespace,{caipNetwork:o}),Ht.activeChain&&Bt.set({activeChain:null==i?void 0:i.namespace})),c.forEach(e=>{const n=null==t?void 0:t.filter(t=>t.chainNamespace===e),r=be.getPreferredAccountTypes()||{},o={...Re.state.defaultAccountTypes,...r};Kt.state.chains.set(e,{namespace:e,networkState:P({...Vt,caipNetwork:null==n?void 0:n[0]}),accountState:P({...jt,preferredAccountType:o[e]}),caipNetworks:n??[],...a}),Kt.setRequestedCaipNetworks(n??[],e)})},removeAdapter(e){var t,a;if(Ht.activeChain===e){const n=Array.from(Ht.chains.entries()).find(([t])=>t!==e);if(n){const e=null==(a=null==(t=n[1])?void 0:t.caipNetworks)?void 0:a[0];e&&Kt.setActiveCaipNetwork(e)}}Ht.chains.delete(e)},addAdapter(e,{connectionControllerClient:t},a){if(!e.namespace)throw new Error("ChainController:addAdapter - adapter must have a namespace");Ht.chains.set(e.namespace,{namespace:e.namespace,networkState:{...Vt,caipNetwork:a[0]},accountState:{...jt},caipNetworks:a,connectionControllerClient:t}),Kt.setRequestedCaipNetworks((null==a?void 0:a.filter(t=>t.chainNamespace===e.namespace))??[],e.namespace)},addNetwork(e){var t;const a=Ht.chains.get(e.chainNamespace);if(a){const n=[...a.caipNetworks||[]];(null==(t=a.caipNetworks)?void 0:t.find(t=>t.id===e.id))||n.push(e),Ht.chains.set(e.chainNamespace,{...a,caipNetworks:n}),Kt.setRequestedCaipNetworks(n,e.chainNamespace),vt.filterByNamespace(e.chainNamespace,!0)}},removeNetwork(e,t){var a,n,r;const o=Ht.chains.get(e);if(o){const i=(null==(a=Ht.activeCaipNetwork)?void 0:a.id)===t,s=[...(null==(n=o.caipNetworks)?void 0:n.filter(e=>e.id!==t))||[]];i&&(null==(r=null==o?void 0:o.caipNetworks)?void 0:r[0])&&Kt.setActiveCaipNetwork(o.caipNetworks[0]),Ht.chains.set(e,{...o,caipNetworks:s}),Kt.setRequestedCaipNetworks(s||[],e),0===s.length&&vt.filterByNamespace(e,!1)}},setAdapterNetworkState(e,t){const a=Ht.chains.get(e);a&&(a.networkState={...a.networkState||Vt,...t},Ht.chains.set(e,a))},setChainAccountData(e,t,a=!0){if(!e)throw new Error("Chain is required to update chain account data");const n=Ht.chains.get(e);if(n){const a={...n.accountState||jt,...t};Ht.chains.set(e,{...n,accountState:a}),1!==Ht.chains.size&&Ht.activeChain!==e||t.caipAddress&&(Ht.activeCaipAddress=t.caipAddress)}},setChainNetworkData(e,t){if(!e)return;const a=Ht.chains.get(e);if(a){const n={...a.networkState||Vt,...t};Ht.chains.set(e,{...a,networkState:n})}},setAccountProp(e,t,a,n=!0){Kt.setChainAccountData(a,{[e]:t},n)},setActiveNamespace(e){var t,a;Ht.activeChain=e;const n=e?Ht.chains.get(e):void 0,r=null==(t=null==n?void 0:n.networkState)?void 0:t.caipNetwork;(null==r?void 0:r.id)&&e&&(Ht.activeCaipAddress=null==(a=null==n?void 0:n.accountState)?void 0:a.caipAddress,Ht.activeCaipNetwork=r,Kt.setChainNetworkData(e,{caipNetwork:r}),be.setActiveCaipNetworkId(null==r?void 0:r.caipNetworkId),Bt.set({activeChain:e,selectedNetworkId:null==r?void 0:r.caipNetworkId}))},setActiveCaipNetwork(e){var t,a;if(!e)return;const n=Ht.activeChain===e.chainNamespace;n||Kt.setIsSwitchingNamespace(!0);const r=Ht.chains.get(e.chainNamespace);Ht.activeChain=e.chainNamespace,Ht.activeCaipNetwork=e,Kt.setChainNetworkData(e.chainNamespace,{caipNetwork:e});let o=null==(t=null==r?void 0:r.accountState)?void 0:t.address;if(o)Ht.activeCaipAddress=`${e.chainNamespace}:${e.id}:${o}`;else if(n&&Ht.activeCaipAddress){const{address:t}=Z.parseCaipAddress(Ht.activeCaipAddress);o=t,Ht.activeCaipAddress=`${e.caipNetworkId}:${o}`}else Ht.activeCaipAddress=void 0;Kt.setChainAccountData(e.chainNamespace,{address:o,caipAddress:Ht.activeCaipAddress}),zt.resetSend(),Bt.set({activeChain:Ht.activeChain,selectedNetworkId:null==(a=Ht.activeCaipNetwork)?void 0:a.caipNetworkId}),be.setActiveCaipNetworkId(e.caipNetworkId);Kt.checkIfSupportedNetwork(e.chainNamespace)||!Re.state.enableNetworkSwitch||Re.state.allowUnsupportedChain||xt.state.wcBasic||Kt.showUnsupportedChainUI()},addCaipNetwork(e){var t;if(!e)return;const a=Ht.chains.get(e.chainNamespace);a&&(null==(t=null==a?void 0:a.caipNetworks)||t.push(e))},async switchActiveNamespace(e){var t;if(!e)return;const a=e!==Kt.state.activeChain,n=null==(t=Kt.getNetworkData(e))?void 0:t.caipNetwork,r=Kt.getCaipNetworkByNamespace(e,null==n?void 0:n.id);a&&r&&await Kt.switchActiveNetwork(r)},async switchActiveNetwork(e,{throwOnFailure:t=!1}={}){var a;const n=Kt.state.activeChain;if(!n)throw new Error("ChainController:switchActiveNetwork - namespace is required");const r="AUTH"===Ut.getProviderId(Ht.activeChain),o=null==(a=Kt.getAccountData(n))?void 0:a.address,i=B.AUTH_CONNECTOR_SUPPORTED_CHAINS.includes(e.chainNamespace);try{if(o&&e.chainNamespace===n||r&&i){const t=Ot.get(e.chainNamespace);if(!t)throw new Error("Adapter not found");await t.switchNetwork({caipNetwork:e})}Kt.setActiveCaipNetwork(e)}catch(s){if(t)throw s}rt.sendEvent({type:"track",event:"SWITCH_NETWORK",properties:{network:e.caipNetworkId}})},getConnectionControllerClient(e){const t=e||Ht.activeChain;if(!t)throw new Error("Chain is required to get connection controller client");const a=Ht.chains.get(t);if(!(null==a?void 0:a.connectionControllerClient))throw new Error("ConnectionController client not set");return a.connectionControllerClient},getNetworkProp(e,t){var a;const n=null==(a=Ht.chains.get(t))?void 0:a.networkState;if(n)return n[e]},getRequestedCaipNetworks(e){const t=Ht.chains.get(e),{approvedCaipNetworkIds:a=[],requestedCaipNetworks:n=[]}=(null==t?void 0:t.networkState)||{};return ke.sortRequestedNetworks(a,n).filter(e=>null==e?void 0:e.id)},getAllRequestedCaipNetworks(){const e=[];return Ht.chains.forEach(t=>{if(!t.namespace)throw new Error("ChainController:getAllRequestedCaipNetworks - chainAdapter must have a namespace");const a=Kt.getRequestedCaipNetworks(t.namespace);e.push(...a)}),e},setRequestedCaipNetworks(e,t){Kt.setAdapterNetworkState(t,{requestedCaipNetworks:e});const a=Kt.getAllRequestedCaipNetworks().map(e=>e.chainNamespace),n=Array.from(new Set(a));vt.filterByNamespaces(n)},getAllApprovedCaipNetworkIds(){const e=[];return Ht.chains.forEach(t=>{if(!t.namespace)throw new Error("ChainController:getAllApprovedCaipNetworkIds - chainAdapter must have a namespace");const a=Kt.getApprovedCaipNetworkIds(t.namespace);e.push(...a)}),e},getActiveCaipNetwork(e){var t,a;return e?null==(a=null==(t=Ht.chains.get(e))?void 0:t.networkState)?void 0:a.caipNetwork:Ht.activeCaipNetwork},getActiveCaipAddress:()=>Ht.activeCaipAddress,getApprovedCaipNetworkIds(e){var t;const a=Ht.chains.get(e);return(null==(t=null==a?void 0:a.networkState)?void 0:t.approvedCaipNetworkIds)||[]},setApprovedCaipNetworksData(e,t){Kt.setAdapterNetworkState(e,t)},checkIfSupportedNetwork(e,t){var a;const n=t||(null==(a=Ht.activeCaipNetwork)?void 0:a.caipNetworkId),r=Kt.getRequestedCaipNetworks(e);return!r.length||(null==r?void 0:r.some(e=>e.caipNetworkId===n))},checkIfSupportedChainId(e){if(!Ht.activeChain)return!0;const t=Kt.getRequestedCaipNetworks(Ht.activeChain);return null==t?void 0:t.some(t=>t.id===e)},checkIfSmartAccountEnabled(){var e,t;const a=F.caipNetworkIdToNumber(null==(e=Ht.activeCaipNetwork)?void 0:e.caipNetworkId);if(!Ht.activeChain||!a)return!1;const n=(null==(t=Se.get(Ie))?void 0:t.split(","))||[];return Boolean(null==n?void 0:n.includes(a.toString()))},showUnsupportedChainUI(){Jt.open({view:"UnsupportedChain"})},checkIfNamesSupported(){const e=Ht.activeCaipNetwork;return Boolean((null==e?void 0:e.chainNamespace)&&Ce.NAMES_SUPPORTED_CHAIN_NAMESPACES.includes(e.chainNamespace))},resetNetwork(e){Kt.setAdapterNetworkState(e,{approvedCaipNetworkIds:void 0,supportsAllNetworks:!0})},resetAccount(e){var t,a;const n=e;if(!n)throw new Error("Chain is required to set account prop");const r=null==(a=null==(t=Kt.state.chains.get(n))?void 0:t.accountState)?void 0:a.preferredAccountType,o=Re.state.defaultAccountTypes[n];Ht.activeCaipAddress=void 0,Kt.setChainAccountData(n,{smartAccountDeployed:!1,currentTab:0,caipAddress:void 0,address:void 0,balance:void 0,balanceSymbol:void 0,profileName:void 0,profileImage:void 0,addressExplorerUrl:void 0,tokenBalance:[],connectedWalletInfo:void 0,preferredAccountType:o||r,socialProvider:void 0,socialWindow:void 0,farcasterUrl:void 0,user:void 0,status:"disconnected"}),vt.removeConnectorId(n)},setIsSwitchingNamespace(e){Ht.isSwitchingNamespace=e},getFirstCaipNetworkSupportsAuthConnector(){var e,t;const a=[];let n;if(Ht.chains.forEach(e=>{B.AUTH_CONNECTOR_SUPPORTED_CHAINS.find(t=>t===e.namespace)&&e.namespace&&a.push(e.namespace)}),a.length>0){const r=a[0];return n=r?null==(t=null==(e=Ht.chains.get(r))?void 0:e.caipNetworks)?void 0:t[0]:void 0,n}},getAccountData(e){var t;const a=e||Ht.activeChain;if(a)return null==(t=Kt.state.chains.get(a))?void 0:t.accountState},getNetworkData(e){var t;const a=e||Ht.activeChain;if(a)return null==(t=Kt.state.chains.get(a))?void 0:t.networkState},getCaipNetworkByNamespace(e,t){var a,n,r;if(!e)return;const o=Kt.state.chains.get(e),i=null==(a=null==o?void 0:o.caipNetworks)?void 0:a.find(e=>e.id.toString()===(null==t?void 0:t.toString()));return i||((null==(n=null==o?void 0:o.networkState)?void 0:n.caipNetwork)||(null==(r=null==o?void 0:o.caipNetworks)?void 0:r[0]))},getRequestedCaipNetworkIds(){const e=vt.state.filterByNamespace;return(e?[Ht.chains.get(e)]:Array.from(Ht.chains.values())).flatMap(e=>(null==e?void 0:e.caipNetworks)||[]).map(e=>e.caipNetworkId)},getCaipNetworks:e=>e?Kt.getRequestedCaipNetworks(e):Kt.getAllRequestedCaipNetworks(),getCaipNetworkById:(e,t)=>Zt.getCaipNetworks(t).find(t=>t.id.toString()===e.toString()||t.caipNetworkId.toString()===e.toString()),setLastConnectedSIWECaipNetwork(e){Ht.lastConnectedSIWECaipNetwork=e},getLastConnectedSIWECaipNetwork:()=>Ht.lastConnectedSIWECaipNetwork,async fetchTokenBalance(e){var t,a;const n=Kt.getAccountData();if(!n)return[];const r=null==(t=Kt.state.activeCaipNetwork)?void 0:t.caipNetworkId,o=null==(a=Kt.state.activeCaipNetwork)?void 0:a.chainNamespace,i=Kt.state.activeCaipAddress,s=i?ke.getPlainAddress(i):void 0;if(Kt.setAccountProp("balanceLoading",!0,o),n.lastRetry&&!ke.isAllowedRetry(n.lastRetry,30*Ce.ONE_SEC_MS))return Kt.setAccountProp("balanceLoading",!1,o),[];try{if(s&&r&&o){const e=await Rt.getMyTokensWithBalance();return Kt.setAccountProp("tokenBalance",e,o),Kt.setAccountProp("lastRetry",void 0,o),Kt.setAccountProp("balanceLoading",!1,o),e}}catch(c){Kt.setAccountProp("lastRetry",Date.now(),o),null==e||e(c),Le.showError("Token Balance Unavailable")}finally{Kt.setAccountProp("balanceLoading",!1,o)}return[]},isCaipNetworkDisabled(e){var t;const a=e.chainNamespace,n=Boolean(null==(t=Kt.getAccountData(a))?void 0:t.caipAddress),r=Kt.getAllApprovedCaipNetworkIds(),o=!1!==Kt.getNetworkProp("supportsAllNetworks",a),i=vt.getConnectorId(a),s=vt.getAuthConnector(),c=i===B.CONNECTOR_ID.AUTH&&s;return!(!n||o||c)&&!(null==r?void 0:r.includes(e.caipNetworkId))}},Kt=qe(Zt),qt={onSwitchNetwork({network:e,ignoreSwitchConfirmation:t=!1}){var a,n;const r=Kt.state.activeCaipNetwork,o=Kt.state.activeChain,i=pt.state.data;if(e.id===(null==r?void 0:r.id))return;const s=Boolean(null==(a=Kt.getAccountData(o))?void 0:a.address),c=Boolean(null==(n=Kt.getAccountData(e.chainNamespace))?void 0:n.address),l=e.chainNamespace!==o,d=vt.getConnectorId(o)===B.CONNECTOR_ID.AUTH,p=B.AUTH_CONNECTOR_SUPPORTED_CHAINS.find(t=>t===e.chainNamespace);t||d&&p?pt.push("SwitchNetwork",{...i,network:e}):s&&l&&!c?pt.push("SwitchActiveChain",{switchToChain:e.chainNamespace,navigateTo:"Connect",navigateWithReplace:!0,network:e}):pt.push("SwitchNetwork",{...i,network:e})}},Gt=P({loading:!1,loadingNamespaceMap:new Map,open:!1,shake:!1,namespace:void 0}),Jt=qe({state:Gt,subscribe:e=>T(Gt,()=>e(Gt)),subscribeKey:(e,t)=>O(Gt,e,t),async open(e){var t,a;const n=null==e?void 0:e.namespace,r=Kt.state.activeChain,o=n&&n!==r,i=null==(t=Kt.getAccountData(null==e?void 0:e.namespace))?void 0:t.caipAddress,s=Kt.state.noAdapters;if(xt.state.wcBasic?ct.prefetch({fetchNetworkImages:!1,fetchConnectorImages:!1,fetchWalletRanks:!1}):await ct.prefetch(),vt.setFilterByNamespace(null==e?void 0:e.namespace),Jt.setLoading(!0,n),n&&o){const e=(null==(a=Kt.getNetworkData(n))?void 0:a.caipNetwork)||Kt.getRequestedCaipNetworks(n)[0];e&&(s?(await Kt.switchActiveNetwork(e),pt.push("ConnectingWalletConnectBasic")):qt.onSwitchNetwork({network:e,ignoreSwitchConfirmation:!0}))}else Re.state.manualWCControl||s&&!i?ke.isMobile()?pt.reset("AllWallets"):pt.reset("ConnectingWalletConnectBasic"):(null==e?void 0:e.view)?pt.reset(e.view,e.data):i?pt.reset("Account"):pt.reset("Connect");Gt.open=!0,Bt.set({open:!0}),rt.sendEvent({type:"track",event:"MODAL_OPEN",properties:{connected:Boolean(i)}})},close(){const e=Re.state.enableEmbedded,t=Boolean(Kt.state.activeCaipAddress);Gt.open&&rt.sendEvent({type:"track",event:"MODAL_CLOSE",properties:{connected:t}}),Gt.open=!1,pt.reset("Connect"),Jt.clearLoading(),e?t?pt.replace("Account"):pt.push("Connect"):Bt.set({open:!1}),xt.resetUri()},setLoading(e,t){t&&Gt.loadingNamespaceMap.set(t,e),Gt.loading=e,Bt.set({loading:e})},clearLoading(){Gt.loadingNamespaceMap.clear(),Gt.loading=!1,Bt.set({loading:!1})},shake(){Gt.shake||(Gt.shake=!0,setTimeout(()=>{Gt.shake=!1},500))}}),Yt={core:{backgroundAccentPrimary:"#0988F0",backgroundAccentCertified:"#C7B994",backgroundWalletKit:"#FFB800",backgroundAppKit:"#FF573B",backgroundCloud:"#0988F0",backgroundDocumentation:"#008847",backgroundSuccess:"rgba(48, 164, 107, 0.20)",backgroundError:"rgba(223, 74, 52, 0.20)",backgroundWarning:"rgba(243, 161, 63, 0.20)",textAccentPrimary:"#0988F0",textAccentCertified:"#C7B994",textWalletKit:"#FFB800",textAppKit:"#FF573B",textCloud:"#0988F0",textDocumentation:"#008847",textSuccess:"#30A46B",textError:"#DF4A34",textWarning:"#F3A13F",borderAccentPrimary:"#0988F0",borderSecondary:"#C7B994",borderSuccess:"#30A46B",borderError:"#DF4A34",borderWarning:"#F3A13F",foregroundAccent010:"rgba(9, 136, 240, 0.1)",foregroundAccent020:"rgba(9, 136, 240, 0.2)",foregroundAccent040:"rgba(9, 136, 240, 0.4)",foregroundAccent060:"rgba(9, 136, 240, 0.6)",foregroundSecondary020:"rgba(199, 185, 148, 0.2)",foregroundSecondary040:"rgba(199, 185, 148, 0.4)",foregroundSecondary060:"rgba(199, 185, 148, 0.6)",iconAccentPrimary:"#0988F0",iconAccentCertified:"#C7B994",iconSuccess:"#30A46B",iconError:"#DF4A34",iconWarning:"#F3A13F",glass010:"rgba(255, 255, 255, 0.1)",zIndex:"9999"},dark:{overlay:"rgba(0, 0, 0, 0.50)",backgroundPrimary:"#202020",backgroundInvert:"#FFFFFF",textPrimary:"#FFFFFF",textSecondary:"#9A9A9A",textTertiary:"#BBBBBB",textInvert:"#202020",borderPrimary:"#2A2A2A",borderPrimaryDark:"#363636",borderSecondary:"#4F4F4F",foregroundPrimary:"#252525",foregroundSecondary:"#2A2A2A",foregroundTertiary:"#363636",iconDefault:"#9A9A9A",iconInverse:"#FFFFFF"},light:{overlay:"rgba(230 , 230, 230, 0.5)",backgroundPrimary:"#FFFFFF",borderPrimaryDark:"#E9E9E9",backgroundInvert:"#202020",textPrimary:"#202020",textSecondary:"#9A9A9A",textTertiary:"#6C6C6C",textInvert:"#FFFFFF",borderPrimary:"#E9E9E9",borderSecondary:"#D0D0D0",foregroundPrimary:"#F3F3F3",foregroundSecondary:"#E9E9E9",foregroundTertiary:"#D0D0D0",iconDefault:"#9A9A9A",iconInverse:"#202020"}},Qt={colors:{black:"#202020",white:"#FFFFFF",white010:"rgba(255, 255, 255, 0.1)",accent010:"rgba(9, 136, 240, 0.1)",accent020:"rgba(9, 136, 240, 0.2)",accent030:"rgba(9, 136, 240, 0.3)",accent040:"rgba(9, 136, 240, 0.4)",accent050:"rgba(9, 136, 240, 0.5)",accent060:"rgba(9, 136, 240, 0.6)",accent070:"rgba(9, 136, 240, 0.7)",accent080:"rgba(9, 136, 240, 0.8)",accent090:"rgba(9, 136, 240, 0.9)",accent100:"rgba(9, 136, 240, 1.0)",accentSecondary010:"rgba(199, 185, 148, 0.1)",accentSecondary020:"rgba(199, 185, 148, 0.2)",accentSecondary030:"rgba(199, 185, 148, 0.3)",accentSecondary040:"rgba(199, 185, 148, 0.4)",accentSecondary050:"rgba(199, 185, 148, 0.5)",accentSecondary060:"rgba(199, 185, 148, 0.6)",accentSecondary070:"rgba(199, 185, 148, 0.7)",accentSecondary080:"rgba(199, 185, 148, 0.8)",accentSecondary090:"rgba(199, 185, 148, 0.9)",accentSecondary100:"rgba(199, 185, 148, 1.0)",productWalletKit:"#FFB800",productAppKit:"#FF573B",productCloud:"#0988F0",productDocumentation:"#008847",neutrals050:"#F6F6F6",neutrals100:"#F3F3F3",neutrals200:"#E9E9E9",neutrals300:"#D0D0D0",neutrals400:"#BBB",neutrals500:"#9A9A9A",neutrals600:"#6C6C6C",neutrals700:"#4F4F4F",neutrals800:"#363636",neutrals900:"#2A2A2A",neutrals1000:"#252525",semanticSuccess010:"rgba(48, 164, 107, 0.1)",semanticSuccess020:"rgba(48, 164, 107, 0.2)",semanticSuccess030:"rgba(48, 164, 107, 0.3)",semanticSuccess040:"rgba(48, 164, 107, 0.4)",semanticSuccess050:"rgba(48, 164, 107, 0.5)",semanticSuccess060:"rgba(48, 164, 107, 0.6)",semanticSuccess070:"rgba(48, 164, 107, 0.7)",semanticSuccess080:"rgba(48, 164, 107, 0.8)",semanticSuccess090:"rgba(48, 164, 107, 0.9)",semanticSuccess100:"rgba(48, 164, 107, 1.0)",semanticError010:"rgba(223, 74, 52, 0.1)",semanticError020:"rgba(223, 74, 52, 0.2)",semanticError030:"rgba(223, 74, 52, 0.3)",semanticError040:"rgba(223, 74, 52, 0.4)",semanticError050:"rgba(223, 74, 52, 0.5)",semanticError060:"rgba(223, 74, 52, 0.6)",semanticError070:"rgba(223, 74, 52, 0.7)",semanticError080:"rgba(223, 74, 52, 0.8)",semanticError090:"rgba(223, 74, 52, 0.9)",semanticError100:"rgba(223, 74, 52, 1.0)",semanticWarning010:"rgba(243, 161, 63, 0.1)",semanticWarning020:"rgba(243, 161, 63, 0.2)",semanticWarning030:"rgba(243, 161, 63, 0.3)",semanticWarning040:"rgba(243, 161, 63, 0.4)",semanticWarning050:"rgba(243, 161, 63, 0.5)",semanticWarning060:"rgba(243, 161, 63, 0.6)",semanticWarning070:"rgba(243, 161, 63, 0.7)",semanticWarning080:"rgba(243, 161, 63, 0.8)",semanticWarning090:"rgba(243, 161, 63, 0.9)",semanticWarning100:"rgba(243, 161, 63, 1.0)"},fontFamily:{regular:"KHTeka",mono:"KHTekaMono"},fontWeight:{regular:"400",medium:"500"},textSize:{h1:"50px",h2:"44px",h3:"38px",h4:"32px",h5:"26px",h6:"20px",large:"16px",medium:"14px",small:"12px"},typography:{"h1-regular-mono":{lineHeight:"50px",letterSpacing:"-3px"},"h1-regular":{lineHeight:"50px",letterSpacing:"-1px"},"h1-medium":{lineHeight:"50px",letterSpacing:"-0.84px"},"h2-regular-mono":{lineHeight:"44px",letterSpacing:"-2.64px"},"h2-regular":{lineHeight:"44px",letterSpacing:"-0.88px"},"h2-medium":{lineHeight:"44px",letterSpacing:"-0.88px"},"h3-regular-mono":{lineHeight:"38px",letterSpacing:"-2.28px"},"h3-regular":{lineHeight:"38px",letterSpacing:"-0.76px"},"h3-medium":{lineHeight:"38px",letterSpacing:"-0.76px"},"h4-regular-mono":{lineHeight:"32px",letterSpacing:"-1.92px"},"h4-regular":{lineHeight:"32px",letterSpacing:"-0.32px"},"h4-medium":{lineHeight:"32px",letterSpacing:"-0.32px"},"h5-regular-mono":{lineHeight:"26px",letterSpacing:"-1.56px"},"h5-regular":{lineHeight:"26px",letterSpacing:"-0.26px"},"h5-medium":{lineHeight:"26px",letterSpacing:"-0.26px"},"h6-regular-mono":{lineHeight:"20px",letterSpacing:"-1.2px"},"h6-regular":{lineHeight:"20px",letterSpacing:"-0.6px"},"h6-medium":{lineHeight:"20px",letterSpacing:"-0.6px"},"lg-regular-mono":{lineHeight:"16px",letterSpacing:"-0.96px"},"lg-regular":{lineHeight:"18px",letterSpacing:"-0.16px"},"lg-medium":{lineHeight:"18px",letterSpacing:"-0.16px"},"md-regular-mono":{lineHeight:"14px",letterSpacing:"-0.84px"},"md-regular":{lineHeight:"16px",letterSpacing:"-0.14px"},"md-medium":{lineHeight:"16px",letterSpacing:"-0.14px"},"sm-regular-mono":{lineHeight:"12px",letterSpacing:"-0.72px"},"sm-regular":{lineHeight:"14px",letterSpacing:"-0.12px"},"sm-medium":{lineHeight:"14px",letterSpacing:"-0.12px"}},tokens:{core:Yt.core,theme:Yt.dark},borderRadius:{1:"4px",2:"8px",10:"10px",3:"12px",4:"16px",6:"24px",5:"20px",8:"32px",16:"64px",20:"80px",32:"128px",64:"256px",128:"512px",round:"9999px"},spacing:{0:"0px","01":"2px",1:"4px",2:"8px",3:"12px",4:"16px",5:"20px",6:"24px",7:"28px",8:"32px",9:"36px",10:"40px",12:"48px",14:"56px",16:"64px",20:"80px",32:"128px",64:"256px"},durations:{xl:"400ms",lg:"200ms",md:"125ms",sm:"75ms"},easings:{"ease-out-power-2":"cubic-bezier(0.23, 0.09, 0.08, 1.13)","ease-out-power-1":"cubic-bezier(0.12, 0.04, 0.2, 1.06)","ease-in-power-2":"cubic-bezier(0.92, -0.13, 0.77, 0.91)","ease-in-power-1":"cubic-bezier(0.88, -0.06, 0.8, 0.96)","ease-inout-power-2":"cubic-bezier(0.77, 0.09, 0.23, 1.13)","ease-inout-power-1":"cubic-bezier(0.88, 0.04, 0.12, 1.06)"}},Xt="--apkt",ea={createCSSVariables(e){const t={},a={};return function e(t,a,n=""){for(const[r,o]of Object.entries(t)){const t=n?`${n}-${r}`:r;o&&"object"==typeof o&&Object.keys(o).length?(a[r]={},e(o,a[r],t)):"string"==typeof o&&(a[r]=`${Xt}-${t}`)}}(e,t),function e(t,a){for(const[n,r]of Object.entries(t))r&&"object"==typeof r?(a[n]={},e(r,a[n])):"string"==typeof r&&(a[n]=`var(${r})`)}(t,a),{cssVariables:t,cssVariablesVarPrefix:a}},assignCSSVariables(e,t){const a={};return function e(t,n,r){for(const[o,i]of Object.entries(t)){const t=r?`${r}-${o}`:o,s=n[o];i&&"object"==typeof i?e(i,s,t):"string"==typeof s&&(a[`${Xt}-${t}`]=s)}}(e,t),a},createRootStyles(e,t){const a={...Qt,tokens:{...Qt.tokens,theme:"light"===e?Yt.light:Yt.dark}},{cssVariables:n}=ea.createCSSVariables(a),r=ea.assignCSSVariables(n,a),o=ea.generateW3MVariables(t),i=ea.generateW3MOverrides(t),s=ea.generateScaledVariables(t),c=ea.generateBaseVariables(r),l={...r,...c,...o,...i,...s},d=ea.applyColorMixToVariables(t,l),p={...l,...d};return`:root {${Object.entries(p).map(([e,t])=>`${e}:${t.replace("/[:;{}</>]/g","")};`).join("")}}`},generateW3MVariables(e){if(!e)return{};const t={};return t["--w3m-font-family"]=e["--w3m-font-family"]||"KHTeka",t["--w3m-accent"]=e["--w3m-accent"]||"#0988F0",t["--w3m-color-mix"]=e["--w3m-color-mix"]||"#000",t["--w3m-color-mix-strength"]=`${e["--w3m-color-mix-strength"]||0}%`,t["--w3m-font-size-master"]=e["--w3m-font-size-master"]||"10px",t["--w3m-border-radius-master"]=e["--w3m-border-radius-master"]||"4px",t},generateW3MOverrides(e){if(!e)return{};const t={};if(e["--w3m-accent"]){const a=e["--w3m-accent"];t["--apkt-tokens-core-iconAccentPrimary"]=a,t["--apkt-tokens-core-borderAccentPrimary"]=a,t["--apkt-tokens-core-textAccentPrimary"]=a,t["--apkt-tokens-core-backgroundAccentPrimary"]=a}return e["--w3m-font-family"]&&(t["--apkt-fontFamily-regular"]=e["--w3m-font-family"]),e["--w3m-z-index"]&&(t["--apkt-tokens-core-zIndex"]=`${e["--w3m-z-index"]}`),t},generateScaledVariables(e){if(!e)return{};const t={};if(e["--w3m-font-size-master"]){const a=parseFloat(e["--w3m-font-size-master"].replace("px",""));t["--apkt-textSize-h1"]=5*Number(a)+"px",t["--apkt-textSize-h2"]=4.4*Number(a)+"px",t["--apkt-textSize-h3"]=3.8*Number(a)+"px",t["--apkt-textSize-h4"]=3.2*Number(a)+"px",t["--apkt-textSize-h5"]=2.6*Number(a)+"px",t["--apkt-textSize-h6"]=2*Number(a)+"px",t["--apkt-textSize-large"]=1.6*Number(a)+"px",t["--apkt-textSize-medium"]=1.4*Number(a)+"px",t["--apkt-textSize-small"]=1.2*Number(a)+"px"}if(e["--w3m-border-radius-master"]){const a=parseFloat(e["--w3m-border-radius-master"].replace("px",""));t["--apkt-borderRadius-1"]=`${Number(a)}px`,t["--apkt-borderRadius-2"]=2*Number(a)+"px",t["--apkt-borderRadius-3"]=3*Number(a)+"px",t["--apkt-borderRadius-4"]=4*Number(a)+"px",t["--apkt-borderRadius-5"]=5*Number(a)+"px",t["--apkt-borderRadius-6"]=6*Number(a)+"px",t["--apkt-borderRadius-8"]=8*Number(a)+"px",t["--apkt-borderRadius-16"]=16*Number(a)+"px",t["--apkt-borderRadius-20"]=20*Number(a)+"px",t["--apkt-borderRadius-32"]=32*Number(a)+"px",t["--apkt-borderRadius-64"]=64*Number(a)+"px",t["--apkt-borderRadius-128"]=128*Number(a)+"px"}return t},generateColorMixCSS(e,t){if(!(null==e?void 0:e["--w3m-color-mix"])||!e["--w3m-color-mix-strength"])return"";const a=e["--w3m-color-mix"],n=e["--w3m-color-mix-strength"];if(!n||0===n)return"";const r=Object.keys(t||{}).filter(e=>{const t=e.includes("-tokens-core-background")||e.includes("-tokens-core-text")||e.includes("-tokens-core-border")||e.includes("-tokens-core-foreground")||e.includes("-tokens-core-icon")||e.includes("-tokens-theme-background")||e.includes("-tokens-theme-text")||e.includes("-tokens-theme-border")||e.includes("-tokens-theme-foreground")||e.includes("-tokens-theme-icon"),a=e.includes("-borderRadius-")||e.includes("-spacing-")||e.includes("-textSize-")||e.includes("-fontFamily-")||e.includes("-fontWeight-")||e.includes("-typography-")||e.includes("-duration-")||e.includes("-ease-")||e.includes("-path-")||e.includes("-width-")||e.includes("-height-")||e.includes("-visual-size-")||e.includes("-modal-width")||e.includes("-cover");return t&&!a});if(0===r.length)return"";return` @supports (background: color-mix(in srgb, white 50%, black)) {\n      :root {\n        ${r.map(e=>{const r=(null==t?void 0:t[e])||"";return r.includes("color-mix")||r.startsWith("#")||r.startsWith("rgb")?`${e}: color-mix(in srgb, ${a} ${n}%, ${r});`:`${e}: color-mix(in srgb, ${a} ${n}%, var(${e}-base, ${r}));`}).join("")}\n      }\n    }`},generateBaseVariables(e){const t={},a=e["--apkt-tokens-theme-backgroundPrimary"];a&&(t["--apkt-tokens-theme-backgroundPrimary-base"]=a);const n=e["--apkt-tokens-core-backgroundAccentPrimary"];return n&&(t["--apkt-tokens-core-backgroundAccentPrimary-base"]=n),t},applyColorMixToVariables(e,t){const a={};if((null==t?void 0:t["--apkt-tokens-theme-backgroundPrimary"])&&(a["--apkt-tokens-theme-backgroundPrimary"]="var(--apkt-tokens-theme-backgroundPrimary-base)"),(null==t?void 0:t["--apkt-tokens-core-backgroundAccentPrimary"])&&(a["--apkt-tokens-core-backgroundAccentPrimary"]="var(--apkt-tokens-core-backgroundAccentPrimary-base)"),!(null==e?void 0:e["--w3m-color-mix"])||!e["--w3m-color-mix-strength"])return a;const n=e["--w3m-color-mix"],r=e["--w3m-color-mix-strength"];if(!r||0===r)return a;const o=Object.keys(t||{}).filter(e=>{const t=e.includes("-tokens-core-background")||e.includes("-tokens-core-text")||e.includes("-tokens-core-border")||e.includes("-tokens-core-foreground")||e.includes("-tokens-core-icon")||e.includes("-tokens-theme-background")||e.includes("-tokens-theme-text")||e.includes("-tokens-theme-border")||e.includes("-tokens-theme-foreground")||e.includes("-tokens-theme-icon")||e.includes("-tokens-theme-overlay"),a=e.includes("-borderRadius-")||e.includes("-spacing-")||e.includes("-textSize-")||e.includes("-fontFamily-")||e.includes("-fontWeight-")||e.includes("-typography-")||e.includes("-duration-")||e.includes("-ease-")||e.includes("-path-")||e.includes("-width-")||e.includes("-height-")||e.includes("-visual-size-")||e.includes("-modal-width")||e.includes("-cover");return t&&!a});return 0===o.length||o.forEach(e=>{const o=(null==t?void 0:t[e])||"";e.endsWith("-base")||("--apkt-tokens-theme-backgroundPrimary"===e||"--apkt-tokens-core-backgroundAccentPrimary"===e?a[e]=`color-mix(in srgb, ${n} ${r}%, var(${e}-base))`:o.includes("color-mix")||o.startsWith("#")||o.startsWith("rgb")?a[e]=`color-mix(in srgb, ${n} ${r}%, ${o})`:a[e]=`color-mix(in srgb, ${n} ${r}%, var(${e}-base, ${o}))`)}),a}},{cssVariablesVarPrefix:ta}=ea.createCSSVariables(Qt);function aa(e,...t){return n(e,...t.map(e=>r("function"==typeof e?e(ta):e)))}const na=n`
  div,
  span,
  iframe,
  a,
  img,
  form,
  button,
  label,
  *::after,
  *::before {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    font-style: normal;
    text-rendering: optimizeSpeed;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    -webkit-tap-highlight-color: transparent;
    backface-visibility: hidden;
  }

  :host {
    font-family: var(--apkt-fontFamily-regular);
  }
`,ra=n`
  button,
  a {
    cursor: pointer;
    display: flex;
    justify-content: center;
    align-items: center;
    position: relative;

    will-change: background-color, color, border, box-shadow, width, height, transform, opacity;
    outline: none;
    border: none;
    text-decoration: none;
    transition:
      background-color var(--apkt-durations-lg) var(--apkt-easings-ease-out-power-2),
      color var(--apkt-durations-lg) var(--apkt-easings-ease-out-power-2),
      border var(--apkt-durations-lg) var(--apkt-easings-ease-out-power-2),
      box-shadow var(--apkt-durations-lg) var(--apkt-easings-ease-out-power-2),
      width var(--apkt-durations-lg) var(--apkt-easings-ease-out-power-2),
      height var(--apkt-durations-lg) var(--apkt-easings-ease-out-power-2),
      transform var(--apkt-durations-lg) var(--apkt-easings-ease-out-power-2),
      opacity var(--apkt-durations-lg) var(--apkt-easings-ease-out-power-2),
      scale var(--apkt-durations-lg) var(--apkt-easings-ease-out-power-2),
      border-radius var(--apkt-durations-lg) var(--apkt-easings-ease-out-power-2);
    will-change:
      background-color, color, border, box-shadow, width, height, transform, opacity, scale,
      border-radius;
  }

  a:active:not([disabled]),
  button:active:not([disabled]) {
    scale: 0.975;
    transform-origin: center;
  }

  button:disabled {
    cursor: default;
  }

  input {
    border: none;
    outline: none;
    appearance: none;
  }
`,oa=".",ia={getSpacingStyles:(e,t)=>Array.isArray(e)?e[t]?`var(--apkt-spacing-${e[t]})`:void 0:"string"==typeof e?`var(--apkt-spacing-${e})`:void 0,getFormattedDate:e=>new Intl.DateTimeFormat("en-US",{month:"short",day:"numeric"}).format(e),formatCurrency(e=0,t={}){const a=Number(e);if(isNaN(a))return"$0.00";return new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",minimumFractionDigits:2,maximumFractionDigits:2,...t}).format(a)},getHostName(e){try{return new URL(e).hostname}catch(t){return""}},getTruncateString:({string:e,charsStart:t,charsEnd:a,truncate:n})=>e.length<=t+a?e:"end"===n?`${e.substring(0,t)}...`:"start"===n?`...${e.substring(e.length-a)}`:`${e.substring(0,Math.floor(t))}...${e.substring(e.length-Math.floor(a))}`,generateAvatarColors(e){const t=e.toLowerCase().replace(/^0x/iu,"").replace(/[^a-f0-9]/gu,"").substring(0,6).padEnd(6,"0"),a=this.hexToRgb(t),n=getComputedStyle(document.documentElement).getPropertyValue("--w3m-border-radius-master"),r=100-3*Number(null==n?void 0:n.replace("px","")),o=`${r}% ${r}% at 65% 40%`,i=[];for(let s=0;s<5;s+=1){const e=this.tintColor(a,.15*s);i.push(`rgb(${e[0]}, ${e[1]}, ${e[2]})`)}return`\n    --local-color-1: ${i[0]};\n    --local-color-2: ${i[1]};\n    --local-color-3: ${i[2]};\n    --local-color-4: ${i[3]};\n    --local-color-5: ${i[4]};\n    --local-radial-circle: ${o}\n   `},hexToRgb(e){const t=parseInt(e,16);return[t>>16&255,t>>8&255,255&t]},tintColor(e,t){const[a,n,r]=e;return[Math.round(a+(255-a)*t),Math.round(n+(255-n)*t),Math.round(r+(255-r)*t)]},isNumber:e=>/^[0-9]+$/u.test(e),getColorTheme(e){var t;return e||("undefined"!=typeof window&&window.matchMedia&&"function"==typeof window.matchMedia?(null==(t=window.matchMedia("(prefers-color-scheme: dark)"))?void 0:t.matches)?"dark":"light":"dark")},splitBalance(e){const t=e.split(".");return 2===t.length?[t[0],t[1]]:["0","00"]},roundNumber:(e,t,a)=>e.toString().length>=t?Number(e).toFixed(a):e,cssDurationToNumber:e=>e.endsWith("s")?1e3*Number(e.replace("s","")):e.endsWith("ms")?Number(e.replace("ms","")):0,maskInput({value:e,decimals:t,integers:a}){if((e=e.replace(",","."))===oa)return`0${oa}`;const[n="",r]=e.split(oa).map(e=>e.replace(/[^0-9]/gu,"")),o=a?n.substring(0,a):n,i=2===o.length?String(Number(o)):o,s="number"==typeof t?null==r?void 0:r.substring(0,t):r;return("string"==typeof s&&("number"!=typeof t||t>0)?[i,s].join(oa):i)??""},capitalize:e=>e?e.charAt(0).toUpperCase()+e.slice(1):""};function sa(e){return function(t){return"function"==typeof t?function(e,t){return customElements.get(e)||customElements.define(e,t),t}(e,t):function(e,t){const{kind:a,elements:n}=t;return{kind:a,elements:n,finisher(t){customElements.get(e)||customElements.define(e,t)}}}(e,t)}}const ca=o`<svg width="30" height="30" viewBox="0 0 30 30" fill="none">
  <g clip-path="url(#clip0_87_33)">
    <path d="M23.9367 2.29447e-07H6.05917C5.26333 -0.000218805 4.47526 0.156384 3.73997 0.46086C3.00469 0.765337 2.33661 1.21172 1.77391 1.7745C1.21121 2.33727 0.764917 3.00542 0.460542 3.74074C0.156167 4.47607 -0.000327963 5.26417 5.16031e-07 6.06V23.9433C4.48257e-07 24.7389 0.156744 25.5267 0.461276 26.2617C0.765808 26.9967 1.21216 27.6645 1.77484 28.2269C2.33752 28.7894 3.0055 29.2355 3.74061 29.5397C4.47573 29.8439 5.26358 30.0003 6.05917 30H23.9417C25.5486 29.9996 27.0895 29.3609 28.2257 28.2245C29.3618 27.0881 30 25.5469 30 23.94V6.06C29.9993 4.45241 29.3602 2.91091 28.2232 1.77449C27.0861 0.638064 25.5443 -0.000220881 23.9367 2.29447e-07Z" fill="url(#paint0_linear_87_33)"/>
    <path d="M14.8708 6.89259L15.4783 5.84259C15.5679 5.68703 15.6873 5.55064 15.8296 5.44122C15.9719 5.3318 16.1344 5.25148 16.3078 5.20486C16.4812 5.15824 16.662 5.14622 16.8401 5.1695C17.0181 5.19277 17.1898 5.25088 17.3453 5.34051C17.5009 5.43013 17.6373 5.54952 17.7467 5.69186C17.8561 5.83419 17.9364 5.99669 17.9831 6.17006C18.0297 6.34344 18.0417 6.5243 18.0184 6.70232C17.9952 6.88034 17.9371 7.05203 17.8474 7.20759L11.9949 17.3401H16.2283C17.5999 17.3401 18.3691 18.9526 17.7724 20.0701H5.36159C5.18215 20.0707 5.00436 20.0359 4.83845 19.9675C4.67254 19.8992 4.5218 19.7986 4.39492 19.6718C4.26803 19.5449 4.16751 19.3941 4.09915 19.2282C4.03079 19.0623 3.99593 18.8845 3.99659 18.7051C3.99659 17.9476 4.60492 17.3401 5.36159 17.3401H8.84159L13.2958 9.61926L11.9041 7.20426C11.738 6.89096 11.7 6.52543 11.7982 6.18469C11.8963 5.84395 12.1229 5.5546 12.4301 5.37763C12.7374 5.20065 13.1014 5.14987 13.4454 5.23599C13.7893 5.3221 14.0864 5.53838 14.2741 5.83926L14.8708 6.89259ZM9.60659 21.4759L8.29409 23.7526C8.20446 23.9082 8.08506 24.0446 7.94271 24.1541C7.80035 24.2636 7.63783 24.344 7.46441 24.3906C7.291 24.4373 7.11009 24.4493 6.93202 24.4261C6.75395 24.4028 6.58221 24.3447 6.42659 24.2551C6.27097 24.1655 6.13454 24.0461 6.02506 23.9037C5.91559 23.7613 5.83523 23.5988 5.78857 23.4254C5.74191 23.252 5.72986 23.0711 5.75311 22.893C5.77637 22.715 5.83446 22.5432 5.92409 22.3876L6.89909 20.7001C8.00159 20.3584 8.89742 20.6209 9.60659 21.4759ZM20.9066 17.3476H24.4583C25.2158 17.3476 25.8233 17.9551 25.8233 18.7126C25.8233 19.4701 25.2149 20.0776 24.4583 20.0776H22.4858L23.8166 22.3876C24.1916 23.0443 23.9708 23.8726 23.3149 24.2551C23.0006 24.4359 22.6274 24.4845 22.2772 24.3903C21.927 24.2961 21.6286 24.0667 21.4474 23.7526C19.2058 19.8643 17.5216 16.9534 16.4041 15.0151C15.2608 13.0426 16.0783 11.0626 16.8841 10.3909C17.7799 11.9293 19.1191 14.2501 20.9074 17.3476H20.9066Z" fill="white"/>
  </g>
  <defs>
    <linearGradient id="paint0_linear_87_33" x1="15" y1="2.29447e-07" x2="15" y2="30" gradientUnits="userSpaceOnUse">
      <stop stop-color="#18BFFB"/>
      <stop offset="1" stop-color="#2072F3"/>
    </linearGradient>
    <clipPath id="clip0_87_33">
      <rect width="30" height="30" fill="white"/>
    </clipPath>
  </defs>
</svg>`,la=o`<svg fill="none" viewBox="0 0 40 40">
  <g clip-path="url(#a)">
    <g clip-path="url(#b)">
      <circle cx="20" cy="19.89" r="20" fill="#000" />
      <g clip-path="url(#c)">
        <path
          fill="#fff"
          d="M28.77 23.3c-.69 1.99-2.75 5.52-4.87 5.56-1.4.03-1.86-.84-3.46-.84-1.61 0-2.12.81-3.45.86-2.25.1-5.72-5.1-5.72-9.62 0-4.15 2.9-6.2 5.42-6.25 1.36-.02 2.64.92 3.47.92.83 0 2.38-1.13 4.02-.97.68.03 2.6.28 3.84 2.08-3.27 2.14-2.76 6.61.75 8.25ZM24.2 7.88c-2.47.1-4.49 2.69-4.2 4.84 2.28.17 4.47-2.39 4.2-4.84Z"
        />
      </g>
    </g>
  </g>
  <defs>
    <clipPath id="a"><rect width="40" height="40" fill="#fff" rx="20" /></clipPath>
    <clipPath id="b"><path fill="#fff" d="M0 0h40v40H0z" /></clipPath>
    <clipPath id="c"><path fill="#fff" d="M8 7.89h24v24H8z" /></clipPath>
  </defs>
</svg>`,da=o`
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 8 11">
    <path
      fill="var(--apkt-tokens-theme-textPrimary)"
      d="M7.862 4.86c.159-1.064-.652-1.637-1.76-2.018l.36-1.443-.879-.218-.35 1.404c-.23-.058-.468-.112-.703-.166l.352-1.413-.877-.219-.36 1.442a29.02 29.02 0 0 1-.56-.132v-.005l-1.21-.302-.234.938s.652.15.638.158c.356.089.42.324.41.51l-.41 1.644a.715.715 0 0 1 .09.03l-.092-.024-.574 2.302c-.044.108-.154.27-.402.208.008.013-.639-.16-.639-.16L.227 8.403l1.142.285c.213.053.42.109.626.161l-.363 1.459.877.218.36-1.443c.239.065.472.125.7.182l-.36 1.436.879.219.363-1.456c1.497.283 2.623.17 3.097-1.185.381-1.09-.02-1.719-.807-2.129.574-.132 1.006-.51 1.12-1.289ZM5.856 7.673c-.272 1.09-2.107.5-2.702.353l.482-1.933c.595.149 2.503.443 2.22 1.58Zm.271-2.829c-.247.992-1.775.488-2.27.365l.436-1.753c.496.124 2.092.354 1.834 1.388Z"
    />
  </svg>
`,pa=o`<svg width="30" height="30" viewBox="0 0 30 30" fill="none">
<path d="M14.9978 7.80003H27.4668C26.2032 5.61107 24.3857 3.79333 22.1968 2.52955C20.008 1.26577 17.525 0.600485 14.9975 0.600586C12.47 0.600687 9.98712 1.26617 7.79838 2.53012C5.60964 3.79408 3.79221 5.61197 2.52881 7.80103L8.76281 18.599L8.76881 18.598C8.13412 17.5044 7.79906 16.2628 7.79743 14.9983C7.79579 13.7339 8.12764 12.4914 8.7595 11.3961C9.39136 10.3008 10.3009 9.39159 11.3963 8.76005C12.4918 8.12851 13.7344 7.79702 14.9988 7.79903L14.9978 7.80003Z" fill="url(#paint0_linear_87_32)"/>
<path d="M21.237 18.5981L15.003 29.3961C17.5305 29.3961 20.0134 28.7308 22.2022 27.467C24.391 26.2032 26.2086 24.3854 27.4721 22.1965C28.7356 20.0075 29.4006 17.5245 29.4003 14.997C29.3999 12.4695 28.7342 9.9867 27.47 7.7981H15.002L15 7.8041C16.2642 7.80168 17.5067 8.13257 18.6022 8.76342C19.6977 9.39428 20.6076 10.3028 21.2401 11.3974C21.8726 12.492 22.2053 13.734 22.2048 14.9982C22.2042 16.2623 21.8704 17.504 21.237 18.5981Z" fill="url(#paint1_linear_87_32)"/>
<path d="M8.76502 18.601L2.53102 7.80298C1.26664 9.99172 0.600848 12.4748 0.600586 15.0025C0.600324 17.5302 1.2656 20.0134 2.52953 22.2024C3.79345 24.3914 5.61145 26.209 7.80071 27.4725C9.98998 28.736 12.4733 29.4008 15.001 29.4L21.236 18.602L21.232 18.598C20.6022 19.6941 19.6944 20.6049 18.6003 21.2383C17.5062 21.8717 16.2644 22.2055 15.0002 22.2059C13.7359 22.2063 12.4939 21.8733 11.3994 21.2406C10.3049 20.6079 9.39657 19.6977 8.76602 18.602L8.76502 18.601Z" fill="url(#paint2_linear_87_32)"/>
<path d="M14.9998 22.2C16.9094 22.2 18.7407 21.4415 20.091 20.0912C21.4412 18.741 22.1998 16.9096 22.1998 15C22.1998 13.0905 21.4412 11.2591 20.091 9.90888C18.7407 8.55862 16.9094 7.80005 14.9998 7.80005C13.0902 7.80005 11.2589 8.55862 9.90864 9.90888C8.55837 11.2591 7.7998 13.0905 7.7998 15C7.7998 16.9096 8.55837 18.741 9.90864 20.0912C11.2589 21.4415 13.0902 22.2 14.9998 22.2Z" fill="white"/>
<path d="M14.9998 20.7C16.5115 20.7 17.9614 20.0995 19.0303 19.0306C20.0993 17.9616 20.6998 16.5118 20.6998 15C20.6998 13.4883 20.0993 12.0385 19.0303 10.9695C17.9614 9.90058 16.5115 9.30005 14.9998 9.30005C13.4881 9.30005 12.0383 9.90058 10.9693 10.9695C9.90034 12.0385 9.2998 13.4883 9.2998 15C9.2998 16.5118 9.90034 17.9616 10.9693 19.0306C12.0383 20.0995 13.4881 20.7 14.9998 20.7Z" fill="#1A73E8"/>
<defs>
  <linearGradient id="paint0_linear_87_32" x1="3.29381" y1="2.99503" x2="38.0998" y2="2.99503" gradientUnits="userSpaceOnUse">
    <stop stop-color="#D93025"/>
    <stop offset="1" stop-color="#EA4335"/>
  </linearGradient>
  <linearGradient id="paint1_linear_87_32" x1="17.953" y1="29.1431" x2="34.194" y2="-0.298904" gradientUnits="userSpaceOnUse">
    <stop stop-color="#FCC934"/>
    <stop offset="1" stop-color="#FBBC04"/>
  </linearGradient>
  <linearGradient id="paint2_linear_87_32" x1="22.873" y1="28.2" x2="6.63202" y2="-1.24102" gradientUnits="userSpaceOnUse">
    <stop stop-color="#1E8E3E"/>
    <stop offset="1" stop-color="#34A853"/>
  </linearGradient>
</defs>
</svg>`,ua=o` <svg fill="none" viewBox="0 0 13 4">
  <path fill="currentColor" d="M.5 0h12L8.9 3.13a3.76 3.76 0 0 1-4.8 0L.5 0Z" />
</svg>`,ha=o`<svg fill="none" viewBox="0 0 40 40">
  <g clip-path="url(#a)">
    <g clip-path="url(#b)">
      <circle cx="20" cy="19.89" r="20" fill="#5865F2" />
      <path
        fill="#fff"
        fill-rule="evenodd"
        d="M25.71 28.15C30.25 28 32 25.02 32 25.02c0-6.61-2.96-11.98-2.96-11.98-2.96-2.22-5.77-2.15-5.77-2.15l-.29.32c3.5 1.07 5.12 2.61 5.12 2.61a16.75 16.75 0 0 0-10.34-1.93l-.35.04a15.43 15.43 0 0 0-5.88 1.9s1.71-1.63 5.4-2.7l-.2-.24s-2.81-.07-5.77 2.15c0 0-2.96 5.37-2.96 11.98 0 0 1.73 2.98 6.27 3.13l1.37-1.7c-2.6-.79-3.6-2.43-3.6-2.43l.58.35.09.06.08.04.02.01.08.05a17.25 17.25 0 0 0 4.52 1.58 14.4 14.4 0 0 0 8.3-.86c.72-.27 1.52-.66 2.37-1.21 0 0-1.03 1.68-3.72 2.44.61.78 1.35 1.67 1.35 1.67Zm-9.55-9.6c-1.17 0-2.1 1.03-2.1 2.28 0 1.25.95 2.28 2.1 2.28 1.17 0 2.1-1.03 2.1-2.28.01-1.25-.93-2.28-2.1-2.28Zm7.5 0c-1.17 0-2.1 1.03-2.1 2.28 0 1.25.95 2.28 2.1 2.28 1.17 0 2.1-1.03 2.1-2.28 0-1.25-.93-2.28-2.1-2.28Z"
        clip-rule="evenodd"
      />
    </g>
  </g>
  <defs>
    <clipPath id="a"><rect width="40" height="40" fill="#fff" rx="20" /></clipPath>
    <clipPath id="b"><path fill="#fff" d="M0 0h40v40H0z" /></clipPath>
  </defs>
</svg>`,ga=o`<svg
  xmlns="http://www.w3.org/2000/svg"
  fill="none"
  viewBox="0 0 9 12"
>
  <path
    fill="var(--apkt-tokens-theme-textPrimary)"
    d="M4.666.001v4.435l3.748 1.675L4.666.001Zm0 0L.917 6.111l3.749-1.675V.001Zm0 8.984V12l3.75-5.19-3.75 2.176Zm0 3.014V8.985L.917 6.81 4.666 12Zm0-3.712 3.748-2.176-3.748-1.675v3.851Z"
  />
  <path fill="var(--apkt-tokens-theme-textPrimary)" d="m.917 6.111 3.749 2.176v-3.85L.917 6.11Z" />
</svg>`,ma=o`<svg fill="none" viewBox="0 0 16 16">
  <path
    fill="currentColor"
    d="M4.25 7a.63.63 0 0 0-.63.63v3.97c0 .28-.2.51-.47.54l-.75.07a.93.93 0 0 1-.9-.47A7.51 7.51 0 0 1 5.54.92a7.5 7.5 0 0 1 9.54 4.62c.12.35.06.72-.16 1-.74.97-1.68 1.78-2.6 2.44V4.44a.64.64 0 0 0-.63-.64h-1.06c-.35 0-.63.3-.63.64v5.5c0 .23-.12.42-.32.5l-.52.23V6.05c0-.36-.3-.64-.64-.64H7.45c-.35 0-.64.3-.64.64v4.97c0 .25-.17.46-.4.52a5.8 5.8 0 0 0-.45.11v-4c0-.36-.3-.65-.64-.65H4.25ZM14.07 12.4A7.49 7.49 0 0 1 3.6 14.08c4.09-.58 9.14-2.5 11.87-6.6v.03a7.56 7.56 0 0 1-1.41 4.91Z"
  />
</svg>`,fa=o`<svg fill="none" viewBox="0 0 40 40">
  <g clip-path="url(#a)">
    <g clip-path="url(#b)">
      <circle cx="20" cy="19.89" r="20" fill="#1877F2" />
      <g clip-path="url(#c)">
        <path
          fill="#fff"
          d="M26 12.38h-2.89c-.92 0-1.61.38-1.61 1.34v1.66H26l-.36 4.5H21.5v12H17v-12h-3v-4.5h3V12.5c0-3.03 1.6-4.62 5.2-4.62H26v4.5Z"
        />
      </g>
    </g>
    <path
      fill="#1877F2"
      d="M40 20a20 20 0 1 0-23.13 19.76V25.78H11.8V20h5.07v-4.4c0-5.02 3-7.79 7.56-7.79 2.19 0 4.48.4 4.48.4v4.91h-2.53c-2.48 0-3.25 1.55-3.25 3.13V20h5.54l-.88 5.78h-4.66v13.98A20 20 0 0 0 40 20Z"
    />
    <path
      fill="#fff"
      d="m27.79 25.78.88-5.78h-5.55v-3.75c0-1.58.78-3.13 3.26-3.13h2.53V8.2s-2.3-.39-4.48-.39c-4.57 0-7.55 2.77-7.55 7.78V20H11.8v5.78h5.07v13.98a20.15 20.15 0 0 0 6.25 0V25.78h4.67Z"
    />
  </g>
  <defs>
    <clipPath id="a"><rect width="40" height="40" fill="#fff" rx="20" /></clipPath>
    <clipPath id="b"><path fill="#fff" d="M0 0h40v40H0z" /></clipPath>
    <clipPath id="c"><path fill="#fff" d="M8 7.89h24v24H8z" /></clipPath>
  </defs>
</svg>`,wa=o`<svg style="border-radius: 9999px; overflow: hidden;"  fill="none" viewBox="0 0 1000 1000">
  <rect width="1000" height="1000" rx="9999" ry="9999" fill="#855DCD"/>
  <path fill="#855DCD" d="M0 0h1000v1000H0V0Z" />
  <path
    fill="#fff"
    d="M320 248h354v504h-51.96V521.13h-.5c-5.76-63.8-59.31-113.81-124.54-113.81s-118.78 50-124.53 113.81h-.5V752H320V248Z"
  />
  <path
    fill="#fff"
    d="m225 320 21.16 71.46h17.9v289.09a16.29 16.29 0 0 0-16.28 16.24v19.49h-3.25a16.3 16.3 0 0 0-16.28 16.24V752h182.26v-19.48a16.22 16.22 0 0 0-16.28-16.24h-3.25v-19.5a16.22 16.22 0 0 0-16.28-16.23h-19.52V320H225Zm400.3 360.55a16.3 16.3 0 0 0-15.04 10.02 16.2 16.2 0 0 0-1.24 6.22v19.49h-3.25a16.29 16.29 0 0 0-16.27 16.24V752h182.24v-19.48a16.23 16.23 0 0 0-16.27-16.24h-3.25v-19.5a16.2 16.2 0 0 0-10.04-15 16.3 16.3 0 0 0-6.23-1.23v-289.1h17.9L775 320H644.82v360.55H625.3Z"
  />
</svg>`,va=o`<svg fill="none" viewBox="0 0 40 40">
  <g clip-path="url(#a)">
    <g clip-path="url(#b)">
      <circle cx="20" cy="19.89" r="20" fill="#1B1F23" />
      <g clip-path="url(#c)">
        <path
          fill="#fff"
          d="M8 19.89a12 12 0 1 1 15.8 11.38c-.6.12-.8-.26-.8-.57v-3.3c0-1.12-.4-1.85-.82-2.22 2.67-.3 5.48-1.31 5.48-5.92 0-1.31-.47-2.38-1.24-3.22.13-.3.54-1.52-.12-3.18 0 0-1-.32-3.3 1.23a11.54 11.54 0 0 0-6 0c-2.3-1.55-3.3-1.23-3.3-1.23a4.32 4.32 0 0 0-.12 3.18 4.64 4.64 0 0 0-1.24 3.22c0 4.6 2.8 5.63 5.47 5.93-.34.3-.65.83-.76 1.6-.69.31-2.42.84-3.5-1 0 0-.63-1.15-1.83-1.23 0 0-1.18-.02-.09.73 0 0 .8.37 1.34 1.76 0 0 .7 2.14 4.03 1.41v2.24c0 .31-.2.68-.8.57A12 12 0 0 1 8 19.9Z"
        />
      </g>
    </g>
  </g>
  <defs>
    <clipPath id="a"><rect width="40" height="40" fill="#fff" rx="20" /></clipPath>
    <clipPath id="b"><path fill="#fff" d="M0 0h40v40H0z" /></clipPath>
    <clipPath id="c"><path fill="#fff" d="M8 7.89h24v24H8z" /></clipPath>
  </defs>
</svg>`,ya=o`<svg fill="none" viewBox="0 0 40 40">
  <path
    fill="#4285F4"
    d="M32.74 20.3c0-.93-.08-1.81-.24-2.66H20.26v5.03h7a6 6 0 0 1-2.62 3.91v3.28h4.22c2.46-2.27 3.88-5.6 3.88-9.56Z"
  />
  <path
    fill="#34A853"
    d="M20.26 33a12.4 12.4 0 0 0 8.6-3.14l-4.22-3.28a7.74 7.74 0 0 1-4.38 1.26 7.76 7.76 0 0 1-7.28-5.36H8.65v3.36A12.99 12.99 0 0 0 20.26 33Z"
  />
  <path
    fill="#FBBC05"
    d="M12.98 22.47a7.79 7.79 0 0 1 0-4.94v-3.36H8.65a12.84 12.84 0 0 0 0 11.66l3.37-2.63.96-.73Z"
  />
  <path
    fill="#EA4335"
    d="M20.26 12.18a7.1 7.1 0 0 1 4.98 1.93l3.72-3.72A12.47 12.47 0 0 0 20.26 7c-5.08 0-9.47 2.92-11.6 7.17l4.32 3.36a7.76 7.76 0 0 1 7.28-5.35Z"
  />
</svg>`,Ca=o` <svg width="27" height="30" viewBox="0 0 27 30" fill="none">
  <path d="M12.5395 14.3237L0.116699 27.5049V27.5188C0.251527 28.0177 0.49972 28.4788 0.841941 28.866C1.18416 29.2533 1.61117 29.5563 2.0897 29.7515C2.56823 29.9467 3.08536 30.0287 3.60081 29.9913C4.11625 29.9538 4.61609 29.7979 5.06139 29.5356L5.0975 29.512L19.0718 21.4519L12.5395 14.3237Z" fill="#EA4335"/>
  <path d="M25.103 12.0833L25.0919 12.0722L19.0611 8.57202L12.2607 14.6279L19.0847 21.4504L25.0919 17.9864C25.6229 17.6983 26.0665 17.2725 26.376 16.7537C26.6854 16.2349 26.8493 15.6422 26.8505 15.0381C26.8516 14.434 26.6899 13.8408 26.3824 13.3208C26.0749 12.8008 25.633 12.3734 25.103 12.0833Z" fill="#FBBC04"/>
  <path d="M0.116672 2.49553C0.047224 2.7761 0 3.05528 0 3.35946V26.6537C0 26.9565 0.0347234 27.237 0.116672 27.5162L12.959 14.6725L0.116672 2.49553Z" fill="#4285F4"/>
  <path d="M12.634 15.0001L19.0607 8.57198L5.0975 0.477133C4.65115 0.210463 4.14916 0.0506574 3.63079 0.0102139C3.11242 -0.0302296 2.59172 0.0497852 2.10941 0.244001C1.6271 0.438216 1.19625 0.741368 0.850556 1.12975C0.504864 1.51813 0.253698 1.98121 0.116699 2.48279L12.634 15.0001Z" fill="#34A853"/>
</svg>`,ba=o`<svg width="75" height="20" viewBox="0 0 75 20" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M11.6666 5.83334C11.6666 2.61168 14.2783 0 17.5 0H25.8334C29.055 0 31.6666 2.61168 31.6666 5.83334V14.1666C31.6666 17.3883 29.055 20 25.8334 20H17.5C14.2783 20 11.6666 17.3883 11.6666 14.1666V5.83334Z" fill="var(--apkt-tokens-theme-foregroundTertiary)"/>
<path d="M19.5068 13.7499L22.4309 5.83331H23.2895L20.3654 13.7499H19.5068Z" fill="var(--apkt-tokens-theme-textPrimary)"/>
<path d="M0 5.41666C0 2.42513 2.42513 0 5.41666 0C8.40821 0 10.8334 2.42513 10.8334 5.41666V14.5833C10.8334 17.5748 8.40821 20 5.41666 20C2.42513 20 0 17.5748 0 14.5833V5.41666Z" fill="var(--apkt-tokens-theme-foregroundTertiary)"/>
<path d="M4.89581 12.4997V11.458H5.93747V12.4997H4.89581Z" fill="var(--apkt-tokens-theme-textPrimary)"/>
<path d="M32.5 10C32.5 4.47715 36.6896 0 41.8578 0H65.6422C70.8104 0 75 4.47715 75 10C75 15.5229 70.8104 20 65.6422 20H41.8578C36.6896 20 32.5 15.5229 32.5 10Z" fill="var(--apkt-tokens-theme-foregroundTertiary)"/>
<path d="M61.7108 12.4475V7.82751H62.5266V8.52418C62.8199 8.01084 63.4157 7.70834 64.0757 7.70834C65.0749 7.70834 65.7715 8.34084 65.7715 9.56918V12.4475H64.9649V9.61503C64.9649 8.80831 64.5066 8.38668 63.8374 8.38668C63.1132 8.38668 62.5266 8.9642 62.5266 9.78001V12.4475H61.7108Z" fill="var(--apkt-tokens-theme-textPrimary)"/>
<path d="M56.5671 12.4475L55.7147 7.82748H56.4846L57.0896 11.6409L57.8871 9.12916H58.6479L59.4363 11.6134L60.0505 7.82748H60.8204L59.9679 12.4475H59.0513L58.2721 10.0458L57.4838 12.4475H56.5671Z" fill="var(--apkt-tokens-theme-textPrimary)"/>
<path d="M52.9636 12.5666C51.5611 12.5666 50.7361 11.5217 50.7361 10.1375C50.7361 8.76254 51.5611 7.70834 52.9636 7.70834C54.3661 7.70834 55.1911 8.76254 55.1911 10.1375C55.1911 11.5217 54.3661 12.5666 52.9636 12.5666ZM52.9636 11.8883C53.9719 11.8883 54.357 11.0266 54.357 10.1283C54.357 9.23914 53.9719 8.38668 52.9636 8.38668C51.9552 8.38668 51.5702 9.23914 51.5702 10.1283C51.5702 11.0266 51.9552 11.8883 52.9636 11.8883Z" fill="var(--apkt-tokens-theme-textPrimary)"/>
<path d="M47.8507 12.5666C46.494 12.5666 45.6415 11.5308 45.6415 10.1375C45.6415 8.75337 46.494 7.70834 47.8507 7.70834C48.9965 7.70834 50.0048 8.35917 49.8948 10.3483H46.4756C46.5398 11.2009 46.934 11.8975 47.8507 11.8975C48.4648 11.8975 48.8681 11.5217 49.0057 11.0908H49.8123C49.684 11.8609 48.9598 12.5666 47.8507 12.5666ZM46.494 9.73416H49.1065C49.0423 8.80831 48.6114 8.37751 47.8507 8.37751C47.0165 8.37751 46.604 8.98254 46.494 9.73416Z" fill="var(--apkt-tokens-theme-textPrimary)"/>
<path d="M41.7284 12.4475V7.82748H42.5625V8.60665C42.8559 8.09332 43.3601 7.82748 43.8825 7.82748H44.9917V8.60665H43.8184C43.0851 8.60665 42.5625 9.08331 42.5625 10.0092V12.4475H41.7284Z" fill="var(--apkt-tokens-theme-textPrimary)"/>
</svg>

`,ka=o`
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 8">
    <path
      fill="var(--apkt-tokens-theme-textPrimary)"
      d="m9.524 6.307-1.51 1.584A.35.35 0 0 1 7.76 8H.604a.178.178 0 0 1-.161-.103.168.168 0 0 1 .033-.186l1.51-1.583a.35.35 0 0 1 .256-.11h7.154c.034 0 .068.01.096.029a.168.168 0 0 1 .032.26Zm-1.51-3.189a.35.35 0 0 0-.255-.109H.604a.178.178 0 0 0-.161.103.168.168 0 0 0 .033.186l1.51 1.583a.35.35 0 0 0 .256.11h7.154a.178.178 0 0 0 .16-.104.168.168 0 0 0-.032-.185l-1.51-1.584ZM.605 1.981H7.76a.357.357 0 0 0 .256-.11L9.525.289a.17.17 0 0 0 .032-.185.173.173 0 0 0-.16-.103H2.241a.357.357 0 0 0-.256.109L.476 1.692a.17.17 0 0 0-.033.185.178.178 0 0 0 .16.103Z"
    />
  </svg>
`,Ea=o`<svg width="32" height="32" fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <g clip-path="url(#a)">
    <path fill="url(#b)" d="M0 0h32v32H0z"/>
    <path fill-rule="evenodd" clip-rule="evenodd" d="M7.034 15.252c4.975-2.167 8.293-3.596 9.953-4.287 4.74-1.971 5.725-2.314 6.366-2.325.142-.002.457.033.662.198.172.14.22.33.243.463.022.132.05.435.028.671-.257 2.7-1.368 9.248-1.933 12.27-.24 1.28-.71 1.708-1.167 1.75-.99.091-1.743-.655-2.703-1.284-1.502-.985-2.351-1.598-3.81-2.558-1.684-1.11-.592-1.721.368-2.718.252-.261 4.619-4.233 4.703-4.594.01-.045.02-.213-.08-.301-.1-.09-.246-.059-.353-.035-.15.034-2.55 1.62-7.198 4.758-.682.468-1.298.696-1.851.684-.61-.013-1.782-.344-2.653-.628-1.069-.347-1.918-.53-1.845-1.12.039-.308.462-.623 1.27-.944Z" fill="#fff"/>
  </g>
  <path d="M.5 16C.5 7.44 7.44.5 16 .5 24.56.5 31.5 7.44 31.5 16c0 8.56-6.94 15.5-15.5 15.5C7.44 31.5.5 24.56.5 16Z" stroke="#141414" stroke-opacity=".05"/>
  <defs>
    <linearGradient id="b" x1="1600" y1="0" x2="1600" y2="3176.27" gradientUnits="userSpaceOnUse">
      <stop stop-color="#2AABEE"/>
      <stop offset="1" stop-color="#229ED9"/>
    </linearGradient>
    <clipPath id="a">
      <path d="M0 16C0 7.163 7.163 0 16 0s16 7.163 16 16-7.163 16-16 16S0 24.837 0 16Z" fill="#fff"/>
    </clipPath>
  </defs>
</svg>`,Ia=o`<svg fill="none" viewBox="0 0 40 40">
  <g clip-path="url(#a)">
    <g clip-path="url(#b)">
      <circle cx="20" cy="19.89" r="20" fill="#5A3E85" />
      <g clip-path="url(#c)">
        <path
          fill="#fff"
          d="M18.22 25.7 20 23.91h3.34l2.1-2.1v-6.68H15.4v8.78h2.82v1.77Zm3.87-8.16h1.25v3.66H22.1v-3.66Zm-3.34 0H20v3.66h-1.25v-3.66ZM20 7.9a12 12 0 1 0 0 24 12 12 0 0 0 0-24Zm6.69 14.56-3.66 3.66h-2.72l-1.77 1.78h-1.88V26.1H13.3v-9.82l.94-2.4H26.7v8.56Z"
        />
      </g>
    </g>
  </g>
  <defs>
    <clipPath id="a"><rect width="40" height="40" fill="#fff" rx="20" /></clipPath>
    <clipPath id="b"><path fill="#fff" d="M0 0h40v40H0z" /></clipPath>
    <clipPath id="c"><path fill="#fff" d="M8 7.89h24v24H8z" /></clipPath>
  </defs>
</svg>`,Aa=o`<svg fill="none" viewBox="0 0 16 16">
  <path
    fill="currentColor"
    d="m14.36 4.74.01.42c0 4.34-3.3 9.34-9.34 9.34A9.3 9.3 0 0 1 0 13.03a6.6 6.6 0 0 0 4.86-1.36 3.29 3.29 0 0 1-3.07-2.28c.5.1 1 .07 1.48-.06A3.28 3.28 0 0 1 .64 6.11v-.04c.46.26.97.4 1.49.41A3.29 3.29 0 0 1 1.11 2.1a9.32 9.32 0 0 0 6.77 3.43 3.28 3.28 0 0 1 5.6-3 6.59 6.59 0 0 0 2.08-.8 3.3 3.3 0 0 1-1.45 1.82A6.53 6.53 0 0 0 16 3.04c-.44.66-1 1.23-1.64 1.7Z"
  />
</svg>`,Sa=o`<svg fill="none" viewBox="0 0 20 20">
  <path
    fill="currentColor"
    fill-rule="evenodd"
    d="M0 5.5c0-1.8 1.46-3.25 3.25-3.25H14.5c1.8 0 3.25 1.46 3.25 3.25v.28A3.25 3.25 0 0 1 20 8.88v2.24c0 1.45-.94 2.68-2.25 3.1v.28c0 1.8-1.46 3.25-3.25 3.25H3.25A3.25 3.25 0 0 1 0 14.5v-9Zm15.75 8.88h-2.38a4.38 4.38 0 0 1 0-8.76h2.38V5.5c0-.69-.56-1.25-1.25-1.25H3.25C2.56 4.25 2 4.81 2 5.5v9c0 .69.56 1.25 1.25 1.25H14.5c.69 0 1.25-.56 1.25-1.25v-.13Zm-2.38-6.76a2.37 2.37 0 1 0 0 4.75h3.38c.69 0 1.25-.55 1.25-1.24V8.87c0-.69-.56-1.24-1.25-1.24h-3.38Z"
    clip-rule="evenodd"
  />
</svg>`,xa=o`
<svg xmlns="http://www.w3.org/2000/svg" width="89" height="89" viewBox="0 0 89 89" fill="none">
<path d="M60.0468 39.2502L65.9116 33.3854C52.6562 20.13 36.1858 20.13 22.9304 33.3854L28.7952 39.2502C38.8764 29.169 49.9725 29.169 60.0536 39.2502H60.0468Z" fill="var(--apkt-tokens-theme-textPrimary)"/>
<path d="M58.0927 52.9146L44.415 39.2369L30.7373 52.9146L17.0596 39.2369L11.2017 45.0949L30.7373 64.6374L44.415 50.9597L58.0927 64.6374L77.6284 45.0949L71.7704 39.2369L58.0927 52.9146Z" fill="var(--apkt-tokens-theme-textPrimary)"/>
</svg>`,Na=o`
<svg xmlns="http://www.w3.org/2000/svg" width="89" height="89" viewBox="0 0 89 89" fill="none">
<path d="M60.0468 39.2502L65.9116 33.3854C52.6562 20.13 36.1858 20.13 22.9304 33.3854L28.7952 39.2502C38.8764 29.169 49.9725 29.169 60.0536 39.2502H60.0468Z" fill="var(--apkt-tokens-theme-textInvert)"/>
<path d="M58.0927 52.9146L44.415 39.2369L30.7373 52.9146L17.0596 39.2369L11.2017 45.0949L30.7373 64.6374L44.415 50.9597L58.0927 64.6374L77.6284 45.0949L71.7704 39.2369L58.0927 52.9146Z" fill="var(--apkt-tokens-theme-textInvert)"/>
</svg>`,_a=o`
<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
<g clip-path="url(#clip0_22274_4692)">
<path d="M0 6.64C0 4.17295 0 2.93942 0.525474 2.01817C0.880399 1.39592 1.39592 0.880399 2.01817 0.525474C2.93942 0 4.17295 0 6.64 0H9.36C11.8271 0 13.0606 0 13.9818 0.525474C14.6041 0.880399 15.1196 1.39592 15.4745 2.01817C16 2.93942 16 4.17295 16 6.64V9.36C16 11.8271 16 13.0606 15.4745 13.9818C15.1196 14.6041 14.6041 15.1196 13.9818 15.4745C13.0606 16 11.8271 16 9.36 16H6.64C4.17295 16 2.93942 16 2.01817 15.4745C1.39592 15.1196 0.880399 14.6041 0.525474 13.9818C0 13.0606 0 11.8271 0 9.36V6.64Z" fill="#C7B994"/>
<path d="M4.49038 5.76609C6.42869 3.86833 9.5713 3.86833 11.5096 5.76609L11.7429 5.99449C11.8398 6.08938 11.8398 6.24323 11.7429 6.33811L10.9449 7.11942C10.8964 7.16686 10.8179 7.16686 10.7694 7.11942L10.4484 6.80512C9.09617 5.48119 6.90381 5.48119 5.5516 6.80512L5.20782 7.14171C5.15936 7.18915 5.08079 7.18915 5.03234 7.14171L4.23434 6.3604C4.13742 6.26552 4.13742 6.11167 4.23434 6.01678L4.49038 5.76609ZM13.1599 7.38192L13.8702 8.07729C13.9671 8.17217 13.9671 8.32602 13.8702 8.4209L10.6677 11.5564C10.5708 11.6513 10.4137 11.6513 10.3168 11.5564L8.04388 9.33105C8.01965 9.30733 7.98037 9.30733 7.95614 9.33105L5.6833 11.5564C5.58638 11.6513 5.42925 11.6513 5.33234 11.5564L2.12982 8.42087C2.0329 8.32598 2.0329 8.17213 2.12982 8.07724L2.84004 7.38188C2.93695 7.28699 3.09408 7.28699 3.191 7.38188L5.46392 9.60726C5.48815 9.63098 5.52743 9.63098 5.55166 9.60726L7.82447 7.38188C7.92138 7.28699 8.07851 7.28699 8.17543 7.38187L10.4484 9.60726C10.4726 9.63098 10.5119 9.63098 10.5361 9.60726L12.809 7.38192C12.9059 7.28703 13.063 7.28703 13.1599 7.38192Z" fill="currentColor"/>
</g>
<defs>
<clipPath id="clip0_22274_4692">
<path d="M0 8C0 3.58172 3.58172 0 8 0C12.4183 0 16 3.58172 16 8C16 12.4183 12.4183 16 8 16C3.58172 16 0 12.4183 0 8Z" fill="white"/>
</clipPath>
</defs>
</svg>
`,Pa=o`
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<circle cx="11" cy="11" r="11" transform="matrix(-1 0 0 1 23 1)" fill="#202020"/>
<circle cx="11" cy="11" r="11.5" transform="matrix(-1 0 0 1 23 1)" stroke="#C7B994" stroke-opacity="0.7"/>
<path d="M15.4523 11.0686L16.7472 9.78167C13.8205 6.87297 10.1838 6.87297 7.25708 9.78167L8.55201 11.0686C10.7779 8.85645 13.2279 8.85645 15.4538 11.0686H15.4523Z" fill="#C7B994"/>
<path d="M15.0199 14.067L12 11.0656L8.98 14.067L5.96004 11.0656L4.66663 12.3511L8.98 16.6393L12 13.638L15.0199 16.6393L19.3333 12.3511L18.0399 11.0656L15.0199 14.067Z" fill="#C7B994"/>
</svg>
`,Ta=o`<svg fill="none" viewBox="0 0 41 40">
  <g clip-path="url(#a)">
    <path fill="#000" d="M.8 0h40v40H.8z" />
    <path
      fill="#fff"
      d="m22.63 18.46 7.14-8.3h-1.69l-6.2 7.2-4.96-7.2H11.2l7.5 10.9-7.5 8.71h1.7l6.55-7.61 5.23 7.61h5.72l-7.77-11.31Zm-9.13-7.03h2.6l11.98 17.13h-2.6L13.5 11.43Z"
    />
  </g>
  <defs>
    <clipPath id="a"><path fill="#fff" d="M.8 20a20 20 0 1 1 40 0 20 20 0 0 1-40 0Z" /></clipPath>
  </defs>
</svg>`,Ra=n`
  :host {
    display: flex;
    justify-content: center;
    align-items: center;
    aspect-ratio: 1 / 1;
    color: var(--local-color);
    width: var(--local-width);
  }

  svg {
    height: inherit;
    width: inherit;
    object-fit: contain;
    object-position: center;
  }
`;var $a=function(e,t,a,n){var r,o=arguments.length,i=o<3?t:null===n?n=Object.getOwnPropertyDescriptor(t,a):n;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)i=Reflect.decorate(e,t,a,n);else for(var s=e.length-1;s>=0;s--)(r=e[s])&&(i=(o<3?r(i):o>3?r(t,a,i):r(t,a))||i);return o>3&&i&&Object.defineProperty(t,a,i),i};const Oa={add:"ph-plus",allWallets:"ph-dots-three",arrowBottom:"ph-arrow-down",arrowBottomCircle:"ph-arrow-circle-down",arrowClockWise:"ph-arrow-clockwise",arrowLeft:"ph-arrow-left",arrowRight:"ph-arrow-right",arrowTop:"ph-arrow-up",arrowTopRight:"ph-arrow-up-right",bank:"ph-bank",bin:"ph-trash",browser:"ph-browser",card:"ph-credit-card",checkmark:"ph-check",checkmarkBold:"ph-check",chevronBottom:"ph-caret-down",chevronLeft:"ph-caret-left",chevronRight:"ph-caret-right",chevronTop:"ph-caret-up",clock:"ph-clock",close:"ph-x",coinPlaceholder:"ph-circle-half",compass:"ph-compass",copy:"ph-copy",desktop:"ph-desktop",dollar:"ph-currency-dollar",download:"ph-vault",exclamationCircle:"ph-warning-circle",extension:"ph-puzzle-piece",externalLink:"ph-arrow-square-out",filters:"ph-funnel-simple",helpCircle:"ph-question",id:"ph-identification-card",image:"ph-image",info:"ph-info",lightbulb:"ph-lightbulb",mail:"ph-envelope",mobile:"ph-device-mobile",more:"ph-dots-three",networkPlaceholder:"ph-globe",nftPlaceholder:"ph-image",plus:"ph-plus",power:"ph-power",qrCode:"ph-qr-code",questionMark:"ph-question",refresh:"ph-arrow-clockwise",recycleHorizontal:"ph-arrows-clockwise",search:"ph-magnifying-glass",sealCheck:"ph-seal-check",send:"ph-paper-plane-right",signOut:"ph-sign-out",spinner:"ph-spinner",swapHorizontal:"ph-arrows-left-right",swapVertical:"ph-arrows-down-up",threeDots:"ph-dots-three",user:"ph-user",verify:"ph-seal-check",verifyFilled:"ph-seal-check",warning:"ph-warning",warningCircle:"ph-warning-circle",appStore:"",apple:"",bitcoin:"",chromeStore:"",cursor:"",discord:"",ethereum:"",etherscan:"",facebook:"",farcaster:"",github:"",google:"",playStore:"",reown:"",solana:"",telegram:"",twitch:"",twitterIcon:"",twitter:"",walletConnect:"",walletConnectBrown:"",walletConnectLightBrown:"",x:"",wallet:""},La={"ph-arrow-circle-down":()=>m(()=>import("./PhArrowCircleDown-BHFEsZAX.js"),__vite__mapDeps([2,3])),"ph-arrow-clockwise":()=>m(()=>import("./PhArrowClockwise-DZ2jXHvb.js"),__vite__mapDeps([4,3])),"ph-arrow-down":()=>m(()=>import("./PhArrowDown-D1IiB5MQ.js"),__vite__mapDeps([5,3])),"ph-arrow-left":()=>m(()=>import("./PhArrowLeft-CRQRDGCD.js"),__vite__mapDeps([6,3])),"ph-arrow-right":()=>m(()=>import("./PhArrowRight-1IDUoSKU.js"),__vite__mapDeps([7,3])),"ph-arrow-square-out":()=>m(()=>import("./PhArrowSquareOut-D19qXR1o.js"),__vite__mapDeps([8,3])),"ph-arrows-down-up":()=>m(()=>import("./PhArrowsDownUp-BaBQzBn9.js"),__vite__mapDeps([9,3])),"ph-arrows-left-right":()=>m(()=>import("./PhArrowsLeftRight-BwnhGUvR.js"),__vite__mapDeps([10,3])),"ph-arrow-up":()=>m(()=>import("./PhArrowUp-CMu5E6zc.js"),__vite__mapDeps([11,3])),"ph-arrow-up-right":()=>m(()=>import("./PhArrowUpRight-C58hTV5n.js"),__vite__mapDeps([12,3])),"ph-arrows-clockwise":()=>m(()=>import("./PhArrowsClockwise-BULxaeJX.js"),__vite__mapDeps([13,3])),"ph-bank":()=>m(()=>import("./PhBank-CF4zkpu1.js"),__vite__mapDeps([14,3])),"ph-browser":()=>m(()=>import("./PhBrowser-CWlfJgJ-.js"),__vite__mapDeps([15,3])),"ph-caret-down":()=>m(()=>import("./PhCaretDown-BPdGuAEc.js"),__vite__mapDeps([16,3])),"ph-caret-left":()=>m(()=>import("./PhCaretLeft-BCjyxXTx.js"),__vite__mapDeps([17,3])),"ph-caret-right":()=>m(()=>import("./PhCaretRight-Wsn-_IBZ.js"),__vite__mapDeps([18,3])),"ph-caret-up":()=>m(()=>import("./PhCaretUp-DBjQZR6a.js"),__vite__mapDeps([19,3])),"ph-check":()=>m(()=>import("./PhCheck-DevzVtf6.js"),__vite__mapDeps([20,3])),"ph-circle-half":()=>m(()=>import("./PhCircleHalf-uVdqP6zU.js"),__vite__mapDeps([21,3])),"ph-clock":()=>m(()=>import("./PhClock-Dho-z7DV.js"),__vite__mapDeps([22,3])),"ph-compass":()=>m(()=>import("./PhCompass-Dh-CTKne.js"),__vite__mapDeps([23,3])),"ph-copy":()=>m(()=>import("./PhCopy-BQwOOilH.js"),__vite__mapDeps([24,3])),"ph-credit-card":()=>m(()=>import("./PhCreditCard-BGIZwSXe.js"),__vite__mapDeps([25,3])),"ph-currency-dollar":()=>m(()=>import("./PhCurrencyDollar-ll94BNrv.js"),__vite__mapDeps([26,3])),"ph-desktop":()=>m(()=>import("./PhDesktop-BAtpnE8f.js"),__vite__mapDeps([27,3])),"ph-device-mobile":()=>m(()=>import("./PhDeviceMobile-BFv8EE9Z.js"),__vite__mapDeps([28,3])),"ph-dots-three":()=>m(()=>import("./PhDotsThree-DiZyYPmV.js"),__vite__mapDeps([29,3])),"ph-vault":()=>m(()=>import("./PhVault-BivOP0rg.js"),__vite__mapDeps([30,3])),"ph-envelope":()=>m(()=>import("./PhEnvelope-BU_kOvrQ.js"),__vite__mapDeps([31,3])),"ph-funnel-simple":()=>m(()=>import("./PhFunnelSimple-CspP1t4_.js"),__vite__mapDeps([32,3])),"ph-globe":()=>m(()=>import("./PhGlobe-Dr85upUT.js"),__vite__mapDeps([33,3])),"ph-identification-card":()=>m(()=>import("./PhIdentificationCard-DwOpnkTK.js"),__vite__mapDeps([34,3])),"ph-image":()=>m(()=>import("./PhImage-Dblk3O_S.js"),__vite__mapDeps([35,3])),"ph-info":()=>m(()=>import("./PhInfo-DDaGlW_1.js"),__vite__mapDeps([36,3])),"ph-lightbulb":()=>m(()=>import("./PhLightbulb-CjVZAMSW.js"),__vite__mapDeps([37,3])),"ph-magnifying-glass":()=>m(()=>import("./PhMagnifyingGlass-BNdiuzr7.js"),__vite__mapDeps([38,3])),"ph-paper-plane-right":()=>m(()=>import("./PhPaperPlaneRight-DNyzrr8z.js"),__vite__mapDeps([39,3])),"ph-plus":()=>m(()=>import("./PhPlus-DGJtltg4.js"),__vite__mapDeps([40,3])),"ph-power":()=>m(()=>import("./PhPower-DCLUBW82.js"),__vite__mapDeps([41,3])),"ph-puzzle-piece":()=>m(()=>import("./PhPuzzlePiece-WBf9aVfF.js"),__vite__mapDeps([42,3])),"ph-qr-code":()=>m(()=>import("./PhQrCode-C_Aocgv6.js"),__vite__mapDeps([43,3])),"ph-question":()=>m(()=>import("./PhQuestion-CKUx1xT3.js"),__vite__mapDeps([44,3])),"ph-question-circle":()=>m(()=>import("./PhQuestionMark-CwoJL2MQ.js"),__vite__mapDeps([45,3])),"ph-seal-check":()=>m(()=>import("./PhSealCheck-3i7bCEVz.js"),__vite__mapDeps([46,3])),"ph-sign-out":()=>m(()=>import("./PhSignOut-BR4WKJuV.js"),__vite__mapDeps([47,3])),"ph-spinner":()=>m(()=>import("./PhSpinner-CVnl1RzK.js"),__vite__mapDeps([48,3])),"ph-trash":()=>m(()=>import("./PhTrash-DV-Dm9M7.js"),__vite__mapDeps([49,3])),"ph-user":()=>m(()=>import("./PhUser-Cvn-5n3K.js"),__vite__mapDeps([50,3])),"ph-warning":()=>m(()=>import("./PhWarning-Cn8KVd7I.js"),__vite__mapDeps([51,3])),"ph-warning-circle":()=>m(()=>import("./PhWarningCircle-BQ7Czj7y.js"),__vite__mapDeps([52,3])),"ph-x":()=>m(()=>import("./PhX-CG-DWSsH.js"),__vite__mapDeps([53,3]))},Da={appStore:ca,apple:la,bitcoin:da,chromeStore:pa,cursor:ua,discord:ha,ethereum:ga,etherscan:ma,facebook:fa,farcaster:wa,github:va,google:ya,playStore:Ca,reown:ba,solana:ka,telegram:Ea,twitch:Ia,twitter:Ta,twitterIcon:Aa,walletConnect:xa,walletConnectInvert:Na,walletConnectBrown:Pa,walletConnectLightBrown:_a,x:Ta,wallet:Sa},Ua={"accent-primary":ta.tokens.core.iconAccentPrimary,"accent-certified":ta.tokens.core.iconAccentCertified,default:ta.tokens.theme.iconDefault,success:ta.tokens.core.iconSuccess,error:ta.tokens.core.iconError,warning:ta.tokens.core.iconWarning,inverse:ta.tokens.theme.iconInverse};let Ma=class extends s{constructor(){super(...arguments),this.size="md",this.name="copy",this.weight="bold",this.color="inherit"}render(){this.style.cssText=`\n      --local-width: ${"inherit"===this.size?"inherit":`var(--apkt-spacing-${{xxs:"2",xs:"3",sm:"3",md:"4",mdl:"5",lg:"5",xl:"6",xxl:"7",inherit:"inherit"}[this.size]})`};\n      --local-color: ${"inherit"===this.color?"inherit":Ua[this.color]}\n    `;const e=Oa[this.name];if(e&&""!==e){const t=La[e];t&&t();const a=c(e);return l`<${a} size=${{xxs:"0.5em",xs:"0.75em",sm:"0.75em",md:"1em",mdl:"1.25em",lg:"1.25em",xl:"1.5em",xxl:"1.75em"}[this.size]} weight="${this.weight}"></${a}>`}return Da[this.name]||l``}};Ma.styles=[na,Ra],$a([i()],Ma.prototype,"size",void 0),$a([i()],Ma.prototype,"name",void 0),$a([i()],Ma.prototype,"weight",void 0),$a([i()],Ma.prototype,"color",void 0),Ma=$a([sa("wui-icon")],Ma);const Ba=n`
  :host {
    display: flex;
  }

  :host([data-size='sm']) > svg {
    width: 12px;
    height: 12px;
  }

  :host([data-size='md']) > svg {
    width: 16px;
    height: 16px;
  }

  :host([data-size='lg']) > svg {
    width: 24px;
    height: 24px;
  }

  :host([data-size='xl']) > svg {
    width: 32px;
    height: 32px;
  }

  svg {
    animation: rotate 1.4s linear infinite;
    color: var(--local-color);
  }

  :host([data-size='md']) > svg > circle {
    stroke-width: 6px;
  }

  :host([data-size='sm']) > svg > circle {
    stroke-width: 8px;
  }

  @keyframes rotate {
    100% {
      transform: rotate(360deg);
    }
  }
`;var Fa=function(e,t,a,n){var r,o=arguments.length,i=o<3?t:null===n?n=Object.getOwnPropertyDescriptor(t,a):n;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)i=Reflect.decorate(e,t,a,n);else for(var s=e.length-1;s>=0;s--)(r=e[s])&&(i=(o<3?r(i):o>3?r(t,a,i):r(t,a))||i);return o>3&&i&&Object.defineProperty(t,a,i),i};let Wa=class extends s{constructor(){super(...arguments),this.color="primary",this.size="lg"}render(){const e={primary:ta.tokens.theme.textPrimary,secondary:ta.tokens.theme.textSecondary,tertiary:ta.tokens.theme.textTertiary,invert:ta.tokens.theme.textInvert,error:ta.tokens.core.textError,warning:ta.tokens.core.textWarning,"accent-primary":ta.tokens.core.textAccentPrimary};return this.style.cssText=`\n      --local-color: ${"inherit"===this.color?"inherit":e[this.color]};\n      `,this.dataset.size=this.size,d`<svg viewBox="0 0 16 17" fill="none">
      <path
        d="M8.75 2.65625V4.65625C8.75 4.85516 8.67098 5.04593 8.53033 5.18658C8.38968 5.32723 8.19891 5.40625 8 5.40625C7.80109 5.40625 7.61032 5.32723 7.46967 5.18658C7.32902 5.04593 7.25 4.85516 7.25 4.65625V2.65625C7.25 2.45734 7.32902 2.26657 7.46967 2.12592C7.61032 1.98527 7.80109 1.90625 8 1.90625C8.19891 1.90625 8.38968 1.98527 8.53033 2.12592C8.67098 2.26657 8.75 2.45734 8.75 2.65625ZM14 7.90625H12C11.8011 7.90625 11.6103 7.98527 11.4697 8.12592C11.329 8.26657 11.25 8.45734 11.25 8.65625C11.25 8.85516 11.329 9.04593 11.4697 9.18658C11.6103 9.32723 11.8011 9.40625 12 9.40625H14C14.1989 9.40625 14.3897 9.32723 14.5303 9.18658C14.671 9.04593 14.75 8.85516 14.75 8.65625C14.75 8.45734 14.671 8.26657 14.5303 8.12592C14.3897 7.98527 14.1989 7.90625 14 7.90625ZM11.3588 10.9544C11.289 10.8846 11.2062 10.8293 11.115 10.7915C11.0239 10.7538 10.9262 10.7343 10.8275 10.7343C10.7288 10.7343 10.6311 10.7538 10.54 10.7915C10.4488 10.8293 10.366 10.8846 10.2963 10.9544C10.2265 11.0241 10.1711 11.107 10.1334 11.1981C10.0956 11.2893 10.0762 11.387 10.0762 11.4856C10.0762 11.5843 10.0956 11.682 10.1334 11.7731C10.1711 11.8643 10.2265 11.9471 10.2963 12.0169L11.7106 13.4312C11.8515 13.5721 12.0426 13.6513 12.2419 13.6513C12.4411 13.6513 12.6322 13.5721 12.7731 13.4312C12.914 13.2904 12.9932 13.0993 12.9932 12.9C12.9932 12.7007 12.914 12.5096 12.7731 12.3687L11.3588 10.9544ZM8 11.9062C7.80109 11.9062 7.61032 11.9853 7.46967 12.1259C7.32902 12.2666 7.25 12.4573 7.25 12.6562V14.6562C7.25 14.8552 7.32902 15.0459 7.46967 15.1866C7.61032 15.3272 7.80109 15.4062 8 15.4062C8.19891 15.4062 8.38968 15.3272 8.53033 15.1866C8.67098 15.0459 8.75 14.8552 8.75 14.6562V12.6562C8.75 12.4573 8.67098 12.2666 8.53033 12.1259C8.38968 11.9853 8.19891 11.9062 8 11.9062ZM4.64125 10.9544L3.22688 12.3687C3.08598 12.5096 3.00682 12.7007 3.00682 12.9C3.00682 13.0993 3.08598 13.2904 3.22688 13.4312C3.36777 13.5721 3.55887 13.6513 3.75813 13.6513C3.95738 13.6513 4.14848 13.5721 4.28937 13.4312L5.70375 12.0169C5.84465 11.876 5.9238 11.6849 5.9238 11.4856C5.9238 11.2864 5.84465 11.0953 5.70375 10.9544C5.56285 10.8135 5.37176 10.7343 5.1725 10.7343C4.97324 10.7343 4.78215 10.8135 4.64125 10.9544ZM4.75 8.65625C4.75 8.45734 4.67098 8.26657 4.53033 8.12592C4.38968 7.98527 4.19891 7.90625 4 7.90625H2C1.80109 7.90625 1.61032 7.98527 1.46967 8.12592C1.32902 8.26657 1.25 8.45734 1.25 8.65625C1.25 8.85516 1.32902 9.04593 1.46967 9.18658C1.61032 9.32723 1.80109 9.40625 2 9.40625H4C4.19891 9.40625 4.38968 9.32723 4.53033 9.18658C4.67098 9.04593 4.75 8.85516 4.75 8.65625ZM4.2875 3.88313C4.1466 3.74223 3.95551 3.66307 3.75625 3.66307C3.55699 3.66307 3.3659 3.74223 3.225 3.88313C3.0841 4.02402 3.00495 4.21512 3.00495 4.41438C3.00495 4.61363 3.0841 4.80473 3.225 4.94562L4.64125 6.35813C4.78215 6.49902 4.97324 6.57818 5.1725 6.57818C5.37176 6.57818 5.56285 6.49902 5.70375 6.35813C5.84465 6.21723 5.9238 6.02613 5.9238 5.82688C5.9238 5.62762 5.84465 5.43652 5.70375 5.29563L4.2875 3.88313Z"
        fill="currentColor"
      />
    </svg>`}};Wa.styles=[na,Ba],Fa([i()],Wa.prototype,"color",void 0),Fa([i()],Wa.prototype,"size",void 0),Wa=Fa([sa("wui-loading-spinner")],Wa);const za=aa`
  slot {
    width: 100%;
    display: inline-block;
    font-style: normal;
    overflow: inherit;
    text-overflow: inherit;
    text-align: var(--local-align);
    color: var(--local-color);
  }

  .wui-line-clamp-1 {
    overflow: hidden;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 1;
  }

  .wui-line-clamp-2 {
    overflow: hidden;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
  }

  /* -- Headings --------------------------------------------------- */
  .wui-font-h1-regular-mono {
    font-size: ${({textSize:e})=>e.h1};
    line-height: ${({typography:e})=>e["h1-regular-mono"].lineHeight};
    letter-spacing: ${({typography:e})=>e["h1-regular-mono"].letterSpacing};
    font-weight: ${({fontWeight:e})=>e.regular};
    font-family: ${({fontFamily:e})=>e.mono};
  }

  .wui-font-h1-regular {
    font-size: ${({textSize:e})=>e.h1};
    line-height: ${({typography:e})=>e["h1-regular"].lineHeight};
    letter-spacing: ${({typography:e})=>e["h1-regular"].letterSpacing};
    font-weight: ${({fontWeight:e})=>e.regular};
    font-family: ${({fontFamily:e})=>e.regular};
    font-feature-settings:
      'liga' off,
      'clig' off;
  }

  .wui-font-h1-medium {
    font-size: ${({textSize:e})=>e.h1};
    line-height: ${({typography:e})=>e["h1-medium"].lineHeight};
    letter-spacing: ${({typography:e})=>e["h1-medium"].letterSpacing};
    font-weight: ${({fontWeight:e})=>e.medium};
    font-family: ${({fontFamily:e})=>e.regular};
    font-feature-settings:
      'liga' off,
      'clig' off;
  }

  .wui-font-h2-regular-mono {
    font-size: ${({textSize:e})=>e.h2};
    line-height: ${({typography:e})=>e["h2-regular-mono"].lineHeight};
    letter-spacing: ${({typography:e})=>e["h2-regular-mono"].letterSpacing};
    font-weight: ${({fontWeight:e})=>e.regular};
    font-family: ${({fontFamily:e})=>e.mono};
  }

  .wui-font-h2-regular {
    font-size: ${({textSize:e})=>e.h2};
    line-height: ${({typography:e})=>e["h2-regular"].lineHeight};
    letter-spacing: ${({typography:e})=>e["h2-regular"].letterSpacing};
    font-weight: ${({fontWeight:e})=>e.regular};
    font-family: ${({fontFamily:e})=>e.regular};
    font-feature-settings:
      'liga' off,
      'clig' off;
  }

  .wui-font-h2-medium {
    font-size: ${({textSize:e})=>e.h2};
    line-height: ${({typography:e})=>e["h2-medium"].lineHeight};
    letter-spacing: ${({typography:e})=>e["h2-medium"].letterSpacing};
    font-weight: ${({fontWeight:e})=>e.medium};
    font-family: ${({fontFamily:e})=>e.regular};
    font-feature-settings:
      'liga' off,
      'clig' off;
  }

  .wui-font-h3-regular-mono {
    font-size: ${({textSize:e})=>e.h3};
    line-height: ${({typography:e})=>e["h3-regular-mono"].lineHeight};
    letter-spacing: ${({typography:e})=>e["h3-regular-mono"].letterSpacing};
    font-weight: ${({fontWeight:e})=>e.regular};
    font-family: ${({fontFamily:e})=>e.mono};
  }

  .wui-font-h3-regular {
    font-size: ${({textSize:e})=>e.h3};
    line-height: ${({typography:e})=>e["h3-regular"].lineHeight};
    letter-spacing: ${({typography:e})=>e["h3-regular"].letterSpacing};
    font-weight: ${({fontWeight:e})=>e.regular};
    font-family: ${({fontFamily:e})=>e.regular};
    font-feature-settings:
      'liga' off,
      'clig' off;
  }

  .wui-font-h3-medium {
    font-size: ${({textSize:e})=>e.h3};
    line-height: ${({typography:e})=>e["h3-medium"].lineHeight};
    letter-spacing: ${({typography:e})=>e["h3-medium"].letterSpacing};
    font-weight: ${({fontWeight:e})=>e.medium};
    font-family: ${({fontFamily:e})=>e.regular};
    font-feature-settings:
      'liga' off,
      'clig' off;
  }

  .wui-font-h4-regular-mono {
    font-size: ${({textSize:e})=>e.h4};
    line-height: ${({typography:e})=>e["h4-regular-mono"].lineHeight};
    letter-spacing: ${({typography:e})=>e["h4-regular-mono"].letterSpacing};
    font-weight: ${({fontWeight:e})=>e.regular};
    font-family: ${({fontFamily:e})=>e.mono};
  }

  .wui-font-h4-regular {
    font-size: ${({textSize:e})=>e.h4};
    line-height: ${({typography:e})=>e["h4-regular"].lineHeight};
    letter-spacing: ${({typography:e})=>e["h4-regular"].letterSpacing};
    font-weight: ${({fontWeight:e})=>e.regular};
    font-family: ${({fontFamily:e})=>e.regular};
    font-feature-settings:
      'liga' off,
      'clig' off;
  }

  .wui-font-h4-medium {
    font-size: ${({textSize:e})=>e.h4};
    line-height: ${({typography:e})=>e["h4-medium"].lineHeight};
    letter-spacing: ${({typography:e})=>e["h4-medium"].letterSpacing};
    font-weight: ${({fontWeight:e})=>e.medium};
    font-family: ${({fontFamily:e})=>e.regular};
    font-feature-settings:
      'liga' off,
      'clig' off;
  }

  .wui-font-h5-regular-mono {
    font-size: ${({textSize:e})=>e.h5};
    line-height: ${({typography:e})=>e["h5-regular-mono"].lineHeight};
    letter-spacing: ${({typography:e})=>e["h5-regular-mono"].letterSpacing};
    font-weight: ${({fontWeight:e})=>e.regular};
    font-family: ${({fontFamily:e})=>e.mono};
  }

  .wui-font-h5-regular {
    font-size: ${({textSize:e})=>e.h5};
    line-height: ${({typography:e})=>e["h5-regular"].lineHeight};
    letter-spacing: ${({typography:e})=>e["h5-regular"].letterSpacing};
    font-weight: ${({fontWeight:e})=>e.regular};
    font-family: ${({fontFamily:e})=>e.regular};
    font-feature-settings:
      'liga' off,
      'clig' off;
  }

  .wui-font-h5-medium {
    font-size: ${({textSize:e})=>e.h5};
    line-height: ${({typography:e})=>e["h5-medium"].lineHeight};
    letter-spacing: ${({typography:e})=>e["h5-medium"].letterSpacing};
    font-weight: ${({fontWeight:e})=>e.medium};
    font-family: ${({fontFamily:e})=>e.regular};
    font-feature-settings:
      'liga' off,
      'clig' off;
  }

  .wui-font-h6-regular-mono {
    font-size: ${({textSize:e})=>e.h6};
    line-height: ${({typography:e})=>e["h6-regular-mono"].lineHeight};
    letter-spacing: ${({typography:e})=>e["h6-regular-mono"].letterSpacing};
    font-weight: ${({fontWeight:e})=>e.regular};
    font-family: ${({fontFamily:e})=>e.mono};
  }

  .wui-font-h6-regular {
    font-size: ${({textSize:e})=>e.h6};
    line-height: ${({typography:e})=>e["h6-regular"].lineHeight};
    letter-spacing: ${({typography:e})=>e["h6-regular"].letterSpacing};
    font-weight: ${({fontWeight:e})=>e.regular};
    font-family: ${({fontFamily:e})=>e.regular};
    font-feature-settings:
      'liga' off,
      'clig' off;
  }

  .wui-font-h6-medium {
    font-size: ${({textSize:e})=>e.h6};
    line-height: ${({typography:e})=>e["h6-medium"].lineHeight};
    letter-spacing: ${({typography:e})=>e["h6-medium"].letterSpacing};
    font-weight: ${({fontWeight:e})=>e.medium};
    font-family: ${({fontFamily:e})=>e.regular};
    font-feature-settings:
      'liga' off,
      'clig' off;
  }

  .wui-font-lg-regular-mono {
    font-size: ${({textSize:e})=>e.large};
    line-height: ${({typography:e})=>e["lg-regular-mono"].lineHeight};
    letter-spacing: ${({typography:e})=>e["lg-regular-mono"].letterSpacing};
    font-weight: ${({fontWeight:e})=>e.regular};
    font-family: ${({fontFamily:e})=>e.mono};
  }

  .wui-font-lg-regular {
    font-size: ${({textSize:e})=>e.large};
    line-height: ${({typography:e})=>e["lg-regular"].lineHeight};
    letter-spacing: ${({typography:e})=>e["lg-regular"].letterSpacing};
    font-weight: ${({fontWeight:e})=>e.regular};
    font-family: ${({fontFamily:e})=>e.regular};
    font-feature-settings:
      'liga' off,
      'clig' off;
  }

  .wui-font-lg-medium {
    font-size: ${({textSize:e})=>e.large};
    line-height: ${({typography:e})=>e["lg-medium"].lineHeight};
    letter-spacing: ${({typography:e})=>e["lg-medium"].letterSpacing};
    font-weight: ${({fontWeight:e})=>e.medium};
    font-family: ${({fontFamily:e})=>e.regular};
    font-feature-settings:
      'liga' off,
      'clig' off;
  }

  .wui-font-md-regular-mono {
    font-size: ${({textSize:e})=>e.medium};
    line-height: ${({typography:e})=>e["md-regular-mono"].lineHeight};
    letter-spacing: ${({typography:e})=>e["md-regular-mono"].letterSpacing};
    font-weight: ${({fontWeight:e})=>e.regular};
    font-family: ${({fontFamily:e})=>e.mono};
  }

  .wui-font-md-regular {
    font-size: ${({textSize:e})=>e.medium};
    line-height: ${({typography:e})=>e["md-regular"].lineHeight};
    letter-spacing: ${({typography:e})=>e["md-regular"].letterSpacing};
    font-weight: ${({fontWeight:e})=>e.regular};
    font-family: ${({fontFamily:e})=>e.regular};
    font-feature-settings:
      'liga' off,
      'clig' off;
  }

  .wui-font-md-medium {
    font-size: ${({textSize:e})=>e.medium};
    line-height: ${({typography:e})=>e["md-medium"].lineHeight};
    letter-spacing: ${({typography:e})=>e["md-medium"].letterSpacing};
    font-weight: ${({fontWeight:e})=>e.medium};
    font-family: ${({fontFamily:e})=>e.regular};
    font-feature-settings:
      'liga' off,
      'clig' off;
  }

  .wui-font-sm-regular-mono {
    font-size: ${({textSize:e})=>e.small};
    line-height: ${({typography:e})=>e["sm-regular-mono"].lineHeight};
    letter-spacing: ${({typography:e})=>e["sm-regular-mono"].letterSpacing};
    font-weight: ${({fontWeight:e})=>e.regular};
    font-family: ${({fontFamily:e})=>e.mono};
  }

  .wui-font-sm-regular {
    font-size: ${({textSize:e})=>e.small};
    line-height: ${({typography:e})=>e["sm-regular"].lineHeight};
    letter-spacing: ${({typography:e})=>e["sm-regular"].letterSpacing};
    font-weight: ${({fontWeight:e})=>e.regular};
    font-family: ${({fontFamily:e})=>e.regular};
    font-feature-settings:
      'liga' off,
      'clig' off;
  }

  .wui-font-sm-medium {
    font-size: ${({textSize:e})=>e.small};
    line-height: ${({typography:e})=>e["sm-medium"].lineHeight};
    letter-spacing: ${({typography:e})=>e["sm-medium"].letterSpacing};
    font-weight: ${({fontWeight:e})=>e.medium};
    font-family: ${({fontFamily:e})=>e.regular};
    font-feature-settings:
      'liga' off,
      'clig' off;
  }
`;var ja=function(e,t,a,n){var r,o=arguments.length,i=o<3?t:null===n?n=Object.getOwnPropertyDescriptor(t,a):n;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)i=Reflect.decorate(e,t,a,n);else for(var s=e.length-1;s>=0;s--)(r=e[s])&&(i=(o<3?r(i):o>3?r(t,a,i):r(t,a))||i);return o>3&&i&&Object.defineProperty(t,a,i),i};const Va={primary:ta.tokens.theme.textPrimary,secondary:ta.tokens.theme.textSecondary,tertiary:ta.tokens.theme.textTertiary,invert:ta.tokens.theme.textInvert,error:ta.tokens.core.textError,warning:ta.tokens.core.textWarning,"accent-primary":ta.tokens.core.textAccentPrimary};let Ha=class extends s{constructor(){super(...arguments),this.variant="md-regular",this.color="inherit",this.align="left",this.lineClamp=void 0,this.display="inline-flex"}render(){const e={[`wui-font-${this.variant}`]:!0,[`wui-line-clamp-${this.lineClamp}`]:!!this.lineClamp};return this.style.cssText=`\n      display: ${this.display};\n      --local-align: ${this.align};\n      --local-color: ${"inherit"===this.color?"inherit":Va[this.color??"primary"]};\n      `,d`<slot class=${p(e)}></slot>`}};Ha.styles=[na,za],ja([i()],Ha.prototype,"variant",void 0),ja([i()],Ha.prototype,"color",void 0),ja([i()],Ha.prototype,"align",void 0),ja([i()],Ha.prototype,"lineClamp",void 0),ja([i()],Ha.prototype,"display",void 0),Ha=ja([sa("wui-text")],Ha);const Za=aa`
  :host {
    width: var(--local-width);
  }

  button {
    width: var(--local-width);
    white-space: nowrap;
    column-gap: ${({spacing:e})=>e[2]};
    transition:
      scale ${({durations:e})=>e.lg} ${({easings:e})=>e["ease-out-power-1"]},
      background-color ${({durations:e})=>e.lg}
        ${({easings:e})=>e["ease-out-power-2"]},
      border-radius ${({durations:e})=>e.lg}
        ${({easings:e})=>e["ease-out-power-1"]};
    will-change: scale, background-color, border-radius;
    cursor: pointer;
  }

  /* -- Sizes --------------------------------------------------- */
  button[data-size='sm'] {
    border-radius: ${({borderRadius:e})=>e[2]};
    padding: 0 ${({spacing:e})=>e[2]};
    height: 28px;
  }

  button[data-size='md'] {
    border-radius: ${({borderRadius:e})=>e[3]};
    padding: 0 ${({spacing:e})=>e[4]};
    height: 38px;
  }

  button[data-size='lg'] {
    border-radius: ${({borderRadius:e})=>e[4]};
    padding: 0 ${({spacing:e})=>e[5]};
    height: 48px;
  }

  /* -- Variants --------------------------------------------------------- */
  button[data-variant='accent-primary'] {
    background-color: ${({tokens:e})=>e.core.backgroundAccentPrimary};
    color: ${({tokens:e})=>e.theme.textInvert};
  }

  button[data-variant='accent-secondary'] {
    background-color: ${({tokens:e})=>e.core.foregroundAccent010};
    color: ${({tokens:e})=>e.core.textAccentPrimary};
  }

  button[data-variant='neutral-primary'] {
    background-color: ${({tokens:e})=>e.theme.backgroundInvert};
    color: ${({tokens:e})=>e.theme.textInvert};
  }

  button[data-variant='neutral-secondary'] {
    background-color: transparent;
    border: 1px solid ${({tokens:e})=>e.theme.borderSecondary};
    color: ${({tokens:e})=>e.theme.textPrimary};
  }

  button[data-variant='neutral-tertiary'] {
    background-color: ${({tokens:e})=>e.theme.foregroundPrimary};
    color: ${({tokens:e})=>e.theme.textPrimary};
  }

  button[data-variant='error-primary'] {
    background-color: ${({tokens:e})=>e.core.textError};
    color: ${({tokens:e})=>e.theme.textInvert};
  }

  button[data-variant='error-secondary'] {
    background-color: ${({tokens:e})=>e.core.backgroundError};
    color: ${({tokens:e})=>e.core.textError};
  }

  button[data-variant='shade'] {
    background: var(--wui-color-gray-glass-002);
    color: var(--wui-color-fg-200);
    border: none;
    box-shadow: inset 0 0 0 1px var(--wui-color-gray-glass-005);
  }

  /* -- Focus states --------------------------------------------------- */
  button[data-size='sm']:focus-visible:enabled {
    border-radius: 28px;
  }

  button[data-size='md']:focus-visible:enabled {
    border-radius: 38px;
  }

  button[data-size='lg']:focus-visible:enabled {
    border-radius: 48px;
  }
  button[data-variant='shade']:focus-visible:enabled {
    background: var(--wui-color-gray-glass-005);
    box-shadow:
      inset 0 0 0 1px var(--wui-color-gray-glass-010),
      0 0 0 4px var(--wui-color-gray-glass-002);
  }

  /* -- Hover & Active states ----------------------------------------------------------- */
  @media (hover: hover) {
    button[data-size='sm']:hover:enabled {
      border-radius: 28px;
    }

    button[data-size='md']:hover:enabled {
      border-radius: 38px;
    }

    button[data-size='lg']:hover:enabled {
      border-radius: 48px;
    }

    button[data-variant='shade']:hover:enabled {
      background: var(--wui-color-gray-glass-002);
    }

    button[data-variant='shade']:active:enabled {
      background: var(--wui-color-gray-glass-005);
    }
  }

  button[data-size='sm']:active:enabled {
    border-radius: 28px;
  }

  button[data-size='md']:active:enabled {
    border-radius: 38px;
  }

  button[data-size='lg']:active:enabled {
    border-radius: 48px;
  }

  /* -- Disabled states --------------------------------------------------- */
  button:disabled {
    opacity: 0.3;
  }
`;var Ka=function(e,t,a,n){var r,o=arguments.length,i=o<3?t:null===n?n=Object.getOwnPropertyDescriptor(t,a):n;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)i=Reflect.decorate(e,t,a,n);else for(var s=e.length-1;s>=0;s--)(r=e[s])&&(i=(o<3?r(i):o>3?r(t,a,i):r(t,a))||i);return o>3&&i&&Object.defineProperty(t,a,i),i};const qa={lg:"lg-regular-mono",md:"md-regular-mono",sm:"sm-regular-mono"},Ga={lg:"md",md:"md",sm:"sm"};let Ja=class extends s{constructor(){super(...arguments),this.size="lg",this.disabled=!1,this.fullWidth=!1,this.loading=!1,this.variant="accent-primary"}render(){this.style.cssText=`\n    --local-width: ${this.fullWidth?"100%":"auto"};\n     `;const e=this.textVariant??qa[this.size];return d`
      <button data-variant=${this.variant} data-size=${this.size} ?disabled=${this.disabled}>
        ${this.loadingTemplate()}
        <slot name="iconLeft"></slot>
        <wui-text variant=${e} color="inherit">
          <slot></slot>
        </wui-text>
        <slot name="iconRight"></slot>
      </button>
    `}loadingTemplate(){if(this.loading){const e=Ga[this.size],t="neutral-primary"===this.variant||"accent-primary"===this.variant?"invert":"primary";return d`<wui-loading-spinner color=${t} size=${e}></wui-loading-spinner>`}return null}};Ja.styles=[na,ra,Za],Ka([i()],Ja.prototype,"size",void 0),Ka([i({type:Boolean})],Ja.prototype,"disabled",void 0),Ka([i({type:Boolean})],Ja.prototype,"fullWidth",void 0),Ka([i({type:Boolean})],Ja.prototype,"loading",void 0),Ka([i()],Ja.prototype,"variant",void 0),Ka([i()],Ja.prototype,"textVariant",void 0),Ja=Ka([sa("wui-button")],Ja);const Ya=n`
  :host {
    display: flex;
    width: inherit;
    height: inherit;
    box-sizing: border-box;
  }
`;var Qa=function(e,t,a,n){var r,o=arguments.length,i=o<3?t:null===n?n=Object.getOwnPropertyDescriptor(t,a):n;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)i=Reflect.decorate(e,t,a,n);else for(var s=e.length-1;s>=0;s--)(r=e[s])&&(i=(o<3?r(i):o>3?r(t,a,i):r(t,a))||i);return o>3&&i&&Object.defineProperty(t,a,i),i};let Xa=class extends s{render(){return this.style.cssText=`\n      flex-direction: ${this.flexDirection};\n      flex-wrap: ${this.flexWrap};\n      flex-basis: ${this.flexBasis};\n      flex-grow: ${this.flexGrow};\n      flex-shrink: ${this.flexShrink};\n      align-items: ${this.alignItems};\n      justify-content: ${this.justifyContent};\n      column-gap: ${this.columnGap&&`var(--apkt-spacing-${this.columnGap})`};\n      row-gap: ${this.rowGap&&`var(--apkt-spacing-${this.rowGap})`};\n      gap: ${this.gap&&`var(--apkt-spacing-${this.gap})`};\n      padding-top: ${this.padding&&ia.getSpacingStyles(this.padding,0)};\n      padding-right: ${this.padding&&ia.getSpacingStyles(this.padding,1)};\n      padding-bottom: ${this.padding&&ia.getSpacingStyles(this.padding,2)};\n      padding-left: ${this.padding&&ia.getSpacingStyles(this.padding,3)};\n      margin-top: ${this.margin&&ia.getSpacingStyles(this.margin,0)};\n      margin-right: ${this.margin&&ia.getSpacingStyles(this.margin,1)};\n      margin-bottom: ${this.margin&&ia.getSpacingStyles(this.margin,2)};\n      margin-left: ${this.margin&&ia.getSpacingStyles(this.margin,3)};\n      width: ${this.width};\n    `,d`<slot></slot>`}};Xa.styles=[na,Ya],Qa([i()],Xa.prototype,"flexDirection",void 0),Qa([i()],Xa.prototype,"flexWrap",void 0),Qa([i()],Xa.prototype,"flexBasis",void 0),Qa([i()],Xa.prototype,"flexGrow",void 0),Qa([i()],Xa.prototype,"flexShrink",void 0),Qa([i()],Xa.prototype,"alignItems",void 0),Qa([i()],Xa.prototype,"justifyContent",void 0),Qa([i()],Xa.prototype,"columnGap",void 0),Qa([i()],Xa.prototype,"rowGap",void 0),Qa([i()],Xa.prototype,"gap",void 0),Qa([i()],Xa.prototype,"padding",void 0),Qa([i()],Xa.prototype,"margin",void 0),Qa([i()],Xa.prototype,"width",void 0),Xa=Qa([sa("wui-flex")],Xa);const en=aa`
  :host {
    position: relative;
  }

  button {
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: transparent;
    padding: ${({spacing:e})=>e[1]};
  }

  /* -- Colors --------------------------------------------------- */
  button[data-type='accent'] wui-icon {
    color: ${({tokens:e})=>e.core.iconAccentPrimary};
  }

  button[data-type='neutral'][data-variant='primary'] wui-icon {
    color: ${({tokens:e})=>e.theme.iconInverse};
  }

  button[data-type='neutral'][data-variant='secondary'] wui-icon {
    color: ${({tokens:e})=>e.theme.iconDefault};
  }

  button[data-type='success'] wui-icon {
    color: ${({tokens:e})=>e.core.iconSuccess};
  }

  button[data-type='error'] wui-icon {
    color: ${({tokens:e})=>e.core.iconError};
  }

  /* -- Sizes --------------------------------------------------- */
  button[data-size='xs'] {
    width: 16px;
    height: 16px;

    border-radius: ${({borderRadius:e})=>e[1]};
  }

  button[data-size='sm'] {
    width: 20px;
    height: 20px;
    border-radius: ${({borderRadius:e})=>e[1]};
  }

  button[data-size='md'] {
    width: 24px;
    height: 24px;
    border-radius: ${({borderRadius:e})=>e[2]};
  }

  button[data-size='lg'] {
    width: 28px;
    height: 28px;
    border-radius: ${({borderRadius:e})=>e[2]};
  }

  button[data-size='xs'] wui-icon {
    width: 8px;
    height: 8px;
  }

  button[data-size='sm'] wui-icon {
    width: 12px;
    height: 12px;
  }

  button[data-size='md'] wui-icon {
    width: 16px;
    height: 16px;
  }

  button[data-size='lg'] wui-icon {
    width: 20px;
    height: 20px;
  }

  /* -- Hover --------------------------------------------------- */
  @media (hover: hover) {
    button[data-type='accent']:hover:enabled {
      background-color: ${({tokens:e})=>e.core.foregroundAccent010};
    }

    button[data-variant='primary'][data-type='neutral']:hover:enabled {
      background-color: ${({tokens:e})=>e.theme.foregroundSecondary};
    }

    button[data-variant='secondary'][data-type='neutral']:hover:enabled {
      background-color: ${({tokens:e})=>e.theme.foregroundSecondary};
    }

    button[data-type='success']:hover:enabled {
      background-color: ${({tokens:e})=>e.core.backgroundSuccess};
    }

    button[data-type='error']:hover:enabled {
      background-color: ${({tokens:e})=>e.core.backgroundError};
    }
  }

  /* -- Focus --------------------------------------------------- */
  button:focus-visible {
    box-shadow: 0 0 0 4px ${({tokens:e})=>e.core.foregroundAccent020};
  }

  /* -- Properties --------------------------------------------------- */
  button[data-full-width='true'] {
    width: 100%;
  }

  :host([fullWidth]) {
    width: 100%;
  }

  button[disabled] {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;var tn=function(e,t,a,n){var r,o=arguments.length,i=o<3?t:null===n?n=Object.getOwnPropertyDescriptor(t,a):n;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)i=Reflect.decorate(e,t,a,n);else for(var s=e.length-1;s>=0;s--)(r=e[s])&&(i=(o<3?r(i):o>3?r(t,a,i):r(t,a))||i);return o>3&&i&&Object.defineProperty(t,a,i),i};let an=class extends s{constructor(){super(...arguments),this.icon="card",this.variant="primary",this.type="accent",this.size="md",this.iconSize=void 0,this.fullWidth=!1,this.disabled=!1}render(){return d`<button
      data-variant=${this.variant}
      data-type=${this.type}
      data-size=${this.size}
      data-full-width=${this.fullWidth}
      ?disabled=${this.disabled}
    >
      <wui-icon color="inherit" name=${this.icon} size=${u(this.iconSize)}></wui-icon>
    </button>`}};an.styles=[na,ra,en],tn([i()],an.prototype,"icon",void 0),tn([i()],an.prototype,"variant",void 0),tn([i()],an.prototype,"type",void 0),tn([i()],an.prototype,"size",void 0),tn([i()],an.prototype,"iconSize",void 0),tn([i({type:Boolean})],an.prototype,"fullWidth",void 0),tn([i({type:Boolean})],an.prototype,"disabled",void 0),an=tn([sa("wui-icon-button")],an);const nn=aa`
  button {
    background-color: transparent;
    padding: ${({spacing:e})=>e[1]};
  }

  button:focus-visible {
    box-shadow: 0 0 0 4px ${({tokens:e})=>e.core.foregroundAccent020};
  }

  button[data-variant='accent']:hover:enabled,
  button[data-variant='accent']:focus-visible {
    background-color: ${({tokens:e})=>e.core.foregroundAccent010};
  }

  button[data-variant='primary']:hover:enabled,
  button[data-variant='primary']:focus-visible,
  button[data-variant='secondary']:hover:enabled,
  button[data-variant='secondary']:focus-visible {
    background-color: ${({tokens:e})=>e.theme.foregroundSecondary};
  }

  button[data-size='xs'] > wui-icon {
    width: 8px;
    height: 8px;
  }

  button[data-size='sm'] > wui-icon {
    width: 12px;
    height: 12px;
  }

  button[data-size='xs'],
  button[data-size='sm'] {
    border-radius: ${({borderRadius:e})=>e[1]};
  }

  button[data-size='md'],
  button[data-size='lg'] {
    border-radius: ${({borderRadius:e})=>e[2]};
  }

  button[data-size='md'] > wui-icon {
    width: 16px;
    height: 16px;
  }

  button[data-size='lg'] > wui-icon {
    width: 20px;
    height: 20px;
  }

  button:disabled {
    background-color: transparent;
    cursor: not-allowed;
    opacity: 0.5;
  }

  button:hover:not(:disabled) {
    background-color: var(--wui-color-accent-glass-015);
  }

  button:focus-visible:not(:disabled) {
    background-color: var(--wui-color-accent-glass-015);
    box-shadow:
      inset 0 0 0 1px var(--wui-color-accent-100),
      0 0 0 4px var(--wui-color-accent-glass-020);
  }
`;var rn=function(e,t,a,n){var r,o=arguments.length,i=o<3?t:null===n?n=Object.getOwnPropertyDescriptor(t,a):n;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)i=Reflect.decorate(e,t,a,n);else for(var s=e.length-1;s>=0;s--)(r=e[s])&&(i=(o<3?r(i):o>3?r(t,a,i):r(t,a))||i);return o>3&&i&&Object.defineProperty(t,a,i),i};let on=class extends s{constructor(){super(...arguments),this.size="md",this.disabled=!1,this.icon="copy",this.iconColor="default",this.variant="accent"}render(){return d`
      <button data-variant=${this.variant} ?disabled=${this.disabled} data-size=${this.size}>
        <wui-icon
          color=${{accent:"accent-primary",primary:"inverse",secondary:"default"}[this.variant]||this.iconColor}
          size=${this.size}
          name=${this.icon}
        ></wui-icon>
      </button>
    `}};on.styles=[na,ra,nn],rn([i()],on.prototype,"size",void 0),rn([i({type:Boolean})],on.prototype,"disabled",void 0),rn([i()],on.prototype,"icon",void 0),rn([i()],on.prototype,"iconColor",void 0),rn([i()],on.prototype,"variant",void 0),on=rn([sa("wui-icon-link")],on);const sn=aa`
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
    user-select: none;
    user-drag: none;
    -webkit-user-drag: none;
    -khtml-user-drag: none;
    -moz-user-drag: none;
    -o-user-drag: none;
  }

  :host([data-boxed='true']) {
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: ${({tokens:e})=>e.theme.foregroundPrimary};
    border-radius: ${({borderRadius:e})=>e[2]};
  }

  :host([data-boxed='true']) img {
    width: 20px;
    height: 20px;
    border-radius: ${({borderRadius:e})=>e[16]};
  }

  :host([data-full='true']) img {
    width: 100%;
    height: 100%;
  }

  :host([data-boxed='true']) wui-icon {
    width: 20px;
    height: 20px;
  }

  :host([data-icon='error']) {
    background-color: ${({tokens:e})=>e.core.backgroundError};
  }

  :host([data-rounded='true']) {
    border-radius: ${({borderRadius:e})=>e[16]};
  }
`;var cn=function(e,t,a,n){var r,o=arguments.length,i=o<3?t:null===n?n=Object.getOwnPropertyDescriptor(t,a):n;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)i=Reflect.decorate(e,t,a,n);else for(var s=e.length-1;s>=0;s--)(r=e[s])&&(i=(o<3?r(i):o>3?r(t,a,i):r(t,a))||i);return o>3&&i&&Object.defineProperty(t,a,i),i};let ln=class extends s{constructor(){super(...arguments),this.src="./path/to/image.jpg",this.alt="Image",this.size=void 0,this.boxed=!1,this.rounded=!1,this.fullSize=!1}render(){const e={inherit:"inherit",xxs:"2",xs:"3",sm:"4",md:"4",mdl:"5",lg:"5",xl:"6",xxl:"7","3xl":"8","4xl":"9","5xl":"10"};return this.style.cssText=`\n      --local-width: ${this.size?`var(--apkt-spacing-${e[this.size]});`:"100%"};\n      --local-height: ${this.size?`var(--apkt-spacing-${e[this.size]});`:"100%"};\n      `,this.dataset.boxed=this.boxed?"true":"false",this.dataset.rounded=this.rounded?"true":"false",this.dataset.full=this.fullSize?"true":"false",this.dataset.icon=this.iconColor||"inherit",this.icon?d`<wui-icon
        color=${this.iconColor||"inherit"}
        name=${this.icon}
        size="lg"
      ></wui-icon> `:this.logo?d`<wui-icon size="lg" color="inherit" name=${this.logo}></wui-icon> `:d`<img src=${u(this.src)} alt=${this.alt} @error=${this.handleImageError} />`}handleImageError(){this.dispatchEvent(new CustomEvent("onLoadError",{bubbles:!0,composed:!0}))}};ln.styles=[na,sn],cn([i()],ln.prototype,"src",void 0),cn([i()],ln.prototype,"logo",void 0),cn([i()],ln.prototype,"icon",void 0),cn([i()],ln.prototype,"iconColor",void 0),cn([i()],ln.prototype,"alt",void 0),cn([i()],ln.prototype,"size",void 0),cn([i({type:Boolean})],ln.prototype,"boxed",void 0),cn([i({type:Boolean})],ln.prototype,"rounded",void 0),cn([i({type:Boolean})],ln.prototype,"fullSize",void 0),ln=cn([sa("wui-image")],ln);const dn=aa`
  :host {
    width: 100%;
  }

  button {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: ${({spacing:e})=>e[3]};
    width: 100%;
    background-color: ${({tokens:e})=>e.theme.backgroundPrimary};
    border-radius: ${({borderRadius:e})=>e[4]};
    transition:
      background-color ${({durations:e})=>e.lg}
        ${({easings:e})=>e["ease-out-power-2"]},
      scale ${({durations:e})=>e.lg} ${({easings:e})=>e["ease-out-power-2"]};
    will-change: background-color, scale;
  }

  wui-text {
    text-transform: capitalize;
  }

  wui-image {
    color: ${({tokens:e})=>e.theme.textPrimary};
  }

  @media (hover: hover) {
    button:hover:enabled {
      background-color: ${({tokens:e})=>e.theme.foregroundPrimary};
    }
  }

  button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;var pn=function(e,t,a,n){var r,o=arguments.length,i=o<3?t:null===n?n=Object.getOwnPropertyDescriptor(t,a):n;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)i=Reflect.decorate(e,t,a,n);else for(var s=e.length-1;s>=0;s--)(r=e[s])&&(i=(o<3?r(i):o>3?r(t,a,i):r(t,a))||i);return o>3&&i&&Object.defineProperty(t,a,i),i};let un=class extends s{constructor(){super(...arguments),this.imageSrc="google",this.loading=!1,this.disabled=!1,this.rightIcon=!0,this.rounded=!1,this.fullSize=!1}render(){return this.dataset.rounded=this.rounded?"true":"false",d`
      <button
        ?disabled=${!!this.loading||Boolean(this.disabled)}
        data-loading=${this.loading}
        tabindex=${u(this.tabIdx)}
      >
        <wui-flex gap="2" alignItems="center">
          ${this.templateLeftIcon()}
          <wui-flex gap="1">
            <slot></slot>
          </wui-flex>
        </wui-flex>
        ${this.templateRightIcon()}
      </button>
    `}templateLeftIcon(){return this.icon?d`<wui-image
        icon=${this.icon}
        iconColor=${u(this.iconColor)}
        ?boxed=${!0}
        ?rounded=${this.rounded}
      ></wui-image>`:d`<wui-image
      ?boxed=${!0}
      ?rounded=${this.rounded}
      ?fullSize=${this.fullSize}
      src=${this.imageSrc}
    ></wui-image>`}templateRightIcon(){return this.rightIcon?this.loading?d`<wui-loading-spinner size="md" color="accent-primary"></wui-loading-spinner>`:d`<wui-icon name="chevronRight" size="lg" color="default"></wui-icon>`:null}};un.styles=[na,ra,dn],pn([i()],un.prototype,"imageSrc",void 0),pn([i()],un.prototype,"icon",void 0),pn([i()],un.prototype,"iconColor",void 0),pn([i({type:Boolean})],un.prototype,"loading",void 0),pn([i()],un.prototype,"tabIdx",void 0),pn([i({type:Boolean})],un.prototype,"disabled",void 0),pn([i({type:Boolean})],un.prototype,"rightIcon",void 0),pn([i({type:Boolean})],un.prototype,"rounded",void 0),pn([i({type:Boolean})],un.prototype,"fullSize",void 0),un=pn([sa("wui-list-item")],un);const hn=o`<svg width="86" height="96" fill="none">
  <path
    d="M78.3244 18.926L50.1808 2.45078C45.7376 -0.150261 40.2624 -0.150262 35.8192 2.45078L7.6756 18.926C3.23322 21.5266 0.5 26.3301 0.5 31.5248V64.4752C0.5 69.6699 3.23322 74.4734 7.6756 77.074L35.8192 93.5492C40.2624 96.1503 45.7376 96.1503 50.1808 93.5492L78.3244 77.074C82.7668 74.4734 85.5 69.6699 85.5 64.4752V31.5248C85.5 26.3301 82.7668 21.5266 78.3244 18.926Z"
  />
</svg>`,gn=o`<svg  viewBox="0 0 48 54" fill="none">
  <path
    d="M43.4605 10.7248L28.0485 1.61089C25.5438 0.129705 22.4562 0.129705 19.9515 1.61088L4.53951 10.7248C2.03626 12.2051 0.5 14.9365 0.5 17.886V36.1139C0.5 39.0635 2.03626 41.7949 4.53951 43.2752L19.9515 52.3891C22.4562 53.8703 25.5438 53.8703 28.0485 52.3891L43.4605 43.2752C45.9637 41.7949 47.5 39.0635 47.5 36.114V17.8861C47.5 14.9365 45.9637 12.2051 43.4605 10.7248Z"
  />
</svg>`,mn=o`
  <svg fill="none" viewBox="0 0 36 40">
    <path
      d="M15.4 2.1a5.21 5.21 0 0 1 5.2 0l11.61 6.7a5.21 5.21 0 0 1 2.61 4.52v13.4c0 1.87-1 3.59-2.6 4.52l-11.61 6.7c-1.62.93-3.6.93-5.22 0l-11.6-6.7a5.21 5.21 0 0 1-2.61-4.51v-13.4c0-1.87 1-3.6 2.6-4.52L15.4 2.1Z"
    />
  </svg>
`,fn=aa`
  :host {
    position: relative;
    border-radius: inherit;
    display: flex;
    justify-content: center;
    align-items: center;
    width: var(--local-width);
    height: var(--local-height);
  }

  :host([data-round='true']) {
    background: ${({tokens:e})=>e.theme.foregroundPrimary};
    border-radius: 100%;
    outline: 1px solid ${({tokens:e})=>e.core.glass010};
  }

  svg {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 1;
  }

  svg > path {
    stroke: var(--local-stroke);
  }

  wui-image {
    width: 100%;
    height: 100%;
    -webkit-clip-path: var(--local-path);
    clip-path: var(--local-path);
    background: ${({tokens:e})=>e.theme.foregroundPrimary};
  }

  wui-icon {
    transform: translateY(-5%);
    width: var(--local-icon-size);
    height: var(--local-icon-size);
  }
`;var wn=function(e,t,a,n){var r,o=arguments.length,i=o<3?t:null===n?n=Object.getOwnPropertyDescriptor(t,a):n;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)i=Reflect.decorate(e,t,a,n);else for(var s=e.length-1;s>=0;s--)(r=e[s])&&(i=(o<3?r(i):o>3?r(t,a,i):r(t,a))||i);return o>3&&i&&Object.defineProperty(t,a,i),i};let vn=class extends s{constructor(){super(...arguments),this.size="md",this.name="uknown",this.networkImagesBySize={sm:mn,md:gn,lg:hn},this.selected=!1,this.round=!1}render(){const e={sm:"4",md:"6",lg:"10"};return this.round?(this.dataset.round="true",this.style.cssText="\n      --local-width: var(--apkt-spacing-10);\n      --local-height: var(--apkt-spacing-10);\n      --local-icon-size: var(--apkt-spacing-4);\n    "):this.style.cssText=`\n\n      --local-path: var(--apkt-path-network-${this.size});\n      --local-width:  var(--apkt-width-network-${this.size});\n      --local-height:  var(--apkt-height-network-${this.size});\n      --local-icon-size:  var(--apkt-spacing-${e[this.size]});\n    `,d`${this.templateVisual()} ${this.svgTemplate()} `}svgTemplate(){return this.round?null:this.networkImagesBySize[this.size]}templateVisual(){return this.imageSrc?d`<wui-image src=${this.imageSrc} alt=${this.name}></wui-image>`:d`<wui-icon size="inherit" color="default" name="networkPlaceholder"></wui-icon>`}};vn.styles=[na,fn],wn([i()],vn.prototype,"size",void 0),wn([i()],vn.prototype,"name",void 0),wn([i({type:Object})],vn.prototype,"networkImagesBySize",void 0),wn([i()],vn.prototype,"imageSrc",void 0),wn([i({type:Boolean})],vn.prototype,"selected",void 0),wn([i({type:Boolean})],vn.prototype,"round",void 0),vn=wn([sa("wui-network-image")],vn);const yn=aa`
  :host {
    position: relative;
    display: flex;
    width: 100%;
    height: 1px;
    background-color: ${({tokens:e})=>e.theme.borderPrimary};
    justify-content: center;
    align-items: center;
  }

  :host > wui-text {
    position: absolute;
    padding: 0px 8px;
    background-color: ${({tokens:e})=>e.theme.backgroundPrimary};
    transition: background-color ${({durations:e})=>e.lg}
      ${({easings:e})=>e["ease-out-power-2"]};
    will-change: background-color;
  }
`;var Cn=function(e,t,a,n){var r,o=arguments.length,i=o<3?t:null===n?n=Object.getOwnPropertyDescriptor(t,a):n;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)i=Reflect.decorate(e,t,a,n);else for(var s=e.length-1;s>=0;s--)(r=e[s])&&(i=(o<3?r(i):o>3?r(t,a,i):r(t,a))||i);return o>3&&i&&Object.defineProperty(t,a,i),i};let bn=class extends s{constructor(){super(...arguments),this.text=""}render(){return d`${this.template()}`}template(){return this.text?d`<wui-text variant="md-regular" color="secondary">${this.text}</wui-text>`:null}};bn.styles=[na,yn],Cn([i()],bn.prototype,"text",void 0),bn=Cn([sa("wui-separator")],bn);const kn=aa`
  :host {
    display: inline-flex;
    justify-content: center;
    align-items: center;
    border-radius: ${({borderRadius:e})=>e[2]};
    padding: ${({spacing:e})=>e[1]} !important;
    background-color: ${({tokens:e})=>e.theme.backgroundPrimary};
    position: relative;
  }

  :host([data-padding='2']) {
    padding: ${({spacing:e})=>e[2]} !important;
  }

  :host:after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    border-radius: ${({borderRadius:e})=>e[2]};
  }

  :host > wui-icon {
    z-index: 10;
  }

  /* -- Colors --------------------------------------------------- */
  :host([data-color='accent-primary']) {
    color: ${({tokens:e})=>e.core.iconAccentPrimary};
  }

  :host([data-color='accent-primary']):after {
    background-color: ${({tokens:e})=>e.core.foregroundAccent010};
  }

  :host([data-color='default']),
  :host([data-color='secondary']) {
    color: ${({tokens:e})=>e.theme.iconDefault};
  }

  :host([data-color='default']):after {
    background-color: ${({tokens:e})=>e.theme.foregroundPrimary};
  }

  :host([data-color='secondary']):after {
    background-color: ${({tokens:e})=>e.theme.foregroundSecondary};
  }

  :host([data-color='success']) {
    color: ${({tokens:e})=>e.core.iconSuccess};
  }

  :host([data-color='success']):after {
    background-color: ${({tokens:e})=>e.core.backgroundSuccess};
  }

  :host([data-color='error']) {
    color: ${({tokens:e})=>e.core.iconError};
  }

  :host([data-color='error']):after {
    background-color: ${({tokens:e})=>e.core.backgroundError};
  }

  :host([data-color='warning']) {
    color: ${({tokens:e})=>e.core.iconWarning};
  }

  :host([data-color='warning']):after {
    background-color: ${({tokens:e})=>e.core.backgroundWarning};
  }

  :host([data-color='inverse']) {
    color: ${({tokens:e})=>e.theme.iconInverse};
  }

  :host([data-color='inverse']):after {
    background-color: transparent;
  }
`;var En=function(e,t,a,n){var r,o=arguments.length,i=o<3?t:null===n?n=Object.getOwnPropertyDescriptor(t,a):n;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)i=Reflect.decorate(e,t,a,n);else for(var s=e.length-1;s>=0;s--)(r=e[s])&&(i=(o<3?r(i):o>3?r(t,a,i):r(t,a))||i);return o>3&&i&&Object.defineProperty(t,a,i),i};let In=class extends s{constructor(){super(...arguments),this.icon="copy",this.size="md",this.padding="1",this.color="default"}render(){return this.dataset.padding=this.padding,this.dataset.color=this.color,d`
      <wui-icon size=${u(this.size)} name=${this.icon} color="inherit"></wui-icon>
    `}};In.styles=[na,ra,kn],En([i()],In.prototype,"icon",void 0),En([i()],In.prototype,"size",void 0),En([i()],In.prototype,"padding",void 0),En([i()],In.prototype,"color",void 0),In=En([sa("wui-icon-box")],In);const An=aa`
  :host {
    position: relative;
    background-color: ${({tokens:e})=>e.theme.foregroundTertiary};
    display: flex;
    justify-content: center;
    align-items: center;
    border-radius: inherit;
    border-radius: var(--local-border-radius);
  }

  :host([data-image='true']) {
    background-color: transparent;
  }

  :host > wui-flex {
    overflow: hidden;
    border-radius: inherit;
    border-radius: var(--local-border-radius);
  }

  :host([data-size='sm']) {
    width: 32px;
    height: 32px;
  }

  :host([data-size='md']) {
    width: 40px;
    height: 40px;
  }

  :host([data-size='lg']) {
    width: 56px;
    height: 56px;
  }

  :host([name='Extension'])::after {
    border: 1px solid ${({colors:e})=>e.accent010};
  }

  :host([data-wallet-icon='allWallets'])::after {
    border: 1px solid ${({colors:e})=>e.accent010};
  }

  wui-icon[data-parent-size='inherit'] {
    width: 75%;
    height: 75%;
    align-items: center;
  }

  wui-icon[data-parent-size='sm'] {
    width: 32px;
    height: 32px;
  }

  wui-icon[data-parent-size='md'] {
    width: 40px;
    height: 40px;
  }

  :host > wui-icon-box {
    position: absolute;
    overflow: hidden;
    right: -1px;
    bottom: -2px;
    z-index: 1;
    border: 2px solid ${({tokens:e})=>e.theme.backgroundPrimary};
    padding: 1px;
  }
`;var Sn=function(e,t,a,n){var r,o=arguments.length,i=o<3?t:null===n?n=Object.getOwnPropertyDescriptor(t,a):n;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)i=Reflect.decorate(e,t,a,n);else for(var s=e.length-1;s>=0;s--)(r=e[s])&&(i=(o<3?r(i):o>3?r(t,a,i):r(t,a))||i);return o>3&&i&&Object.defineProperty(t,a,i),i};let xn=class extends s{constructor(){super(...arguments),this.size="md",this.name="",this.installed=!1,this.badgeSize="xs"}render(){let e="1";return"lg"===this.size?e="4":"md"===this.size?e="2":"sm"===this.size&&(e="1"),this.style.cssText=`\n       --local-border-radius: var(--apkt-borderRadius-${e});\n   `,this.dataset.size=this.size,this.imageSrc&&(this.dataset.image="true"),this.walletIcon&&(this.dataset.walletIcon=this.walletIcon),d`
      <wui-flex justifyContent="center" alignItems="center"> ${this.templateVisual()} </wui-flex>
    `}templateVisual(){return this.imageSrc?d`<wui-image src=${this.imageSrc} alt=${this.name}></wui-image>`:this.walletIcon?d`<wui-icon size="md" color="default" name=${this.walletIcon}></wui-icon>`:d`<wui-icon
      data-parent-size=${this.size}
      size="inherit"
      color="inherit"
      name="wallet"
    ></wui-icon>`}};xn.styles=[na,An],Sn([i()],xn.prototype,"size",void 0),Sn([i()],xn.prototype,"name",void 0),Sn([i()],xn.prototype,"imageSrc",void 0),Sn([i()],xn.prototype,"walletIcon",void 0),Sn([i({type:Boolean})],xn.prototype,"installed",void 0),Sn([i()],xn.prototype,"badgeSize",void 0),xn=Sn([sa("wui-wallet-image")],xn);const Nn="INVALID_PAYMENT_CONFIG",_n="INVALID_RECIPIENT",Pn="INVALID_ASSET",Tn="INVALID_AMOUNT",Rn="UNKNOWN_ERROR",$n="UNABLE_TO_INITIATE_PAYMENT",On="INVALID_CHAIN_NAMESPACE",Ln="GENERIC_PAYMENT_ERROR",Dn="UNABLE_TO_GET_EXCHANGES",Un="ASSET_NOT_SUPPORTED",Mn="UNABLE_TO_GET_PAY_URL",Bn="UNABLE_TO_GET_BUY_STATUS",Fn={[Nn]:"Invalid payment configuration",[_n]:"Invalid recipient address",[Pn]:"Invalid asset specified",[Tn]:"Invalid payment amount",[Rn]:"Unknown payment error occurred",[$n]:"Unable to initiate payment",[On]:"Invalid chain namespace",[Ln]:"Unable to process payment",[Dn]:"Unable to get exchanges",[Un]:"Asset not supported by the selected exchange",[Mn]:"Unable to get payment URL",[Bn]:"Unable to get buy status"};class Wn extends Error{get message(){return Fn[this.code]}constructor(e,t){super(Fn[e]),this.name="AppKitPayError",this.code=e,this.details=t,Error.captureStackTrace&&Error.captureStackTrace(this,Wn)}}class zn extends Error{}async function jn(e,t){const a=`https://rpc.walletconnect.org/v1/json-rpc?projectId=${Re.getSnapshot().projectId}`,{sdkType:n,sdkVersion:r,projectId:o}=Re.getSnapshot(),i={jsonrpc:"2.0",id:1,method:e,params:{...t||{},st:n,sv:r,projectId:o}},s=await fetch(a,{method:"POST",body:JSON.stringify(i),headers:{"Content-Type":"application/json"}}),c=await s.json();if(c.error)throw new zn(c.error.message);return c}async function Vn(e){return(await jn("reown_getExchanges",e)).result}const Hn=["eip155","solana"],Zn={eip155:{native:{assetNamespace:"slip44",assetReference:"60"},defaultTokenNamespace:"erc20"},solana:{native:{assetNamespace:"slip44",assetReference:"501"},defaultTokenNamespace:"token"}};function Kn(e,t){const{chainNamespace:a,chainId:n}=Z.parseCaipNetworkId(e),r=Zn[a];if(!r)throw new Error(`Unsupported chain namespace for CAIP-19 formatting: ${a}`);let o=r.native.assetNamespace,i=r.native.assetReference;"native"!==t&&(o=r.defaultTokenNamespace,i=t);return`${`${a}:${n}`}/${o}:${i}`}const qn="unknown",Gn=P({paymentAsset:{network:"eip155:1",asset:"0x0",metadata:{name:"0x0",symbol:"0x0",decimals:0}},recipient:"0x0",amount:0,isConfigured:!1,error:null,isPaymentInProgress:!1,exchanges:[],isLoading:!1,openInNewTab:!0,redirectUrl:void 0,payWithExchange:void 0,currentPayment:void 0,analyticsSet:!1,paymentId:void 0}),Jn={state:Gn,subscribe:e=>T(Gn,()=>e(Gn)),subscribeKey:(e,t)=>O(Gn,e,t),async handleOpenPay(e){this.resetState(),this.setPaymentConfig(e),this.subscribeEvents(),this.initializeAnalytics(),Gn.isConfigured=!0,rt.sendEvent({type:"track",event:"PAY_MODAL_OPEN",properties:{exchanges:Gn.exchanges,configuration:{network:Gn.paymentAsset.network,asset:Gn.paymentAsset.asset,recipient:Gn.recipient,amount:Gn.amount}}}),await Jt.open({view:"Pay"})},resetState(){Gn.paymentAsset={network:"eip155:1",asset:"0x0",metadata:{name:"0x0",symbol:"0x0",decimals:0}},Gn.recipient="0x0",Gn.amount=0,Gn.isConfigured=!1,Gn.error=null,Gn.isPaymentInProgress=!1,Gn.isLoading=!1,Gn.currentPayment=void 0},setPaymentConfig(e){if(!e.paymentAsset)throw new Wn(Nn);try{Gn.paymentAsset=e.paymentAsset,Gn.recipient=e.recipient,Gn.amount=e.amount,Gn.openInNewTab=e.openInNewTab??!0,Gn.redirectUrl=e.redirectUrl,Gn.payWithExchange=e.payWithExchange,Gn.error=null}catch(t){throw new Wn(Nn,t.message)}},getPaymentAsset:()=>Gn.paymentAsset,getExchanges:()=>Gn.exchanges,async fetchExchanges(){try{Gn.isLoading=!0;const e=await Vn({page:0,asset:Kn(Gn.paymentAsset.network,Gn.paymentAsset.asset),amount:Gn.amount.toString()});Gn.exchanges=e.exchanges.slice(0,2)}catch(e){throw Le.showError(Fn.UNABLE_TO_GET_EXCHANGES),new Wn(Dn)}finally{Gn.isLoading=!1}},async getAvailableExchanges(e){var t;try{const a=(null==e?void 0:e.asset)&&(null==e?void 0:e.network)?Kn(e.network,e.asset):void 0;return await Vn({page:(null==e?void 0:e.page)??0,asset:a,amount:null==(t=null==e?void 0:e.amount)?void 0:t.toString()})}catch(a){throw new Wn(Dn)}},async getPayUrl(e,t,a=!1){try{const n=Number(t.amount),r=await async function(e){return(await jn("reown_getExchangePayUrl",e)).result}({exchangeId:e,asset:Kn(t.network,t.asset),amount:n.toString(),recipient:`${t.network}:${t.recipient}`});return rt.sendEvent({type:"track",event:"PAY_EXCHANGE_SELECTED",properties:{source:"pay",exchange:{id:e},configuration:{network:t.network,asset:t.asset,recipient:t.recipient,amount:n},currentPayment:{type:"exchange",exchangeId:e},headless:a}}),a&&(this.initiatePayment(),rt.sendEvent({type:"track",event:"PAY_INITIATED",properties:{source:"pay",paymentId:Gn.paymentId||qn,configuration:{network:t.network,asset:t.asset,recipient:t.recipient,amount:n},currentPayment:{type:"exchange",exchangeId:e}}})),r}catch(n){if(n instanceof Error&&n.message.includes("is not supported"))throw new Wn(Un);throw new Error(n.message)}},async openPayUrl(e,t,a=!1){try{const n=await this.getPayUrl(e.exchangeId,t,a);if(!n)throw new Wn(Mn);const r=e.openInNewTab??!0?"_blank":"_self";return ke.openHref(n.url,r),n}catch(n){throw Gn.error=n instanceof Wn?n.message:Fn.GENERIC_PAYMENT_ERROR,new Wn(Mn)}},subscribeEvents(){Gn.isConfigured||(xt.subscribeKey("connections",e=>{e.size>0&&this.handlePayment()}),Kt.subscribeChainProp("accountState",e=>{const t=xt.hasAnyConnection(B.CONNECTOR_ID.WALLET_CONNECT);(null==e?void 0:e.caipAddress)&&(t?setTimeout(()=>{this.handlePayment()},100):this.handlePayment())}))},async handlePayment(){Gn.currentPayment={type:"wallet",status:"IN_PROGRESS"};const e=Kt.getActiveCaipAddress();if(!e)return;const{chainId:t,address:a}=Z.parseCaipAddress(e),n=Kt.state.activeChain;if(!a||!t||!n)return;if(!Ut.getProvider(n))return;const r=Kt.state.activeCaipNetwork;if(r&&!Gn.isPaymentInProgress)try{this.initiatePayment();const e=Kt.getAllRequestedCaipNetworks(),t=Kt.getAllApprovedCaipNetworkIds();switch(await async function(e){const{paymentAssetNetwork:t,activeCaipNetwork:a,approvedCaipNetworkIds:n,requestedCaipNetworks:r}=e,o=ke.sortRequestedNetworks(n,r).find(e=>e.caipNetworkId===t);if(!o)throw new Wn(Nn);if(o.caipNetworkId===a.caipNetworkId)return;const i=Kt.getNetworkProp("supportsAllNetworks",o.chainNamespace);if(!(null==n?void 0:n.includes(o.caipNetworkId))&&!i)throw new Wn(Nn);try{await Kt.switchActiveNetwork(o)}catch(s){throw new Wn(Ln,s)}}({paymentAssetNetwork:Gn.paymentAsset.network,activeCaipNetwork:r,approvedCaipNetworkIds:t,requestedCaipNetworks:e}),await Jt.open({view:"PayLoading"}),n){case B.CHAIN.EVM:"native"===Gn.paymentAsset.asset&&(Gn.currentPayment.result=await async function(e,t,a){var n;if(t!==B.CHAIN.EVM)throw new Wn(On);if(!a.fromAddress)throw new Wn(Nn,"fromAddress is required for native EVM payments.");const r="string"==typeof a.amount?parseFloat(a.amount):a.amount;if(isNaN(r))throw new Wn(Nn);const o=(null==(n=e.metadata)?void 0:n.decimals)??18,i=xt.parseUnits(r.toString(),o);if("bigint"!=typeof i)throw new Wn(Ln);return await xt.sendTransaction({chainNamespace:t,to:a.recipient,address:a.fromAddress,value:i,data:"0x"})??void 0}(Gn.paymentAsset,n,{recipient:Gn.recipient,amount:Gn.amount,fromAddress:a})),Gn.paymentAsset.asset.startsWith("0x")&&(Gn.currentPayment.result=await async function(e,t){if(!t.fromAddress)throw new Wn(Nn,"fromAddress is required for ERC20 EVM payments.");const a=e.asset,n=t.recipient,r=Number(e.metadata.decimals),o=xt.parseUnits(t.amount.toString(),r);if(void 0===o)throw new Wn(Ln);return await xt.writeContract({fromAddress:t.fromAddress,tokenAddress:a,args:[n,o],method:"transfer",abi:H(a),chainNamespace:B.CHAIN.EVM})??void 0}(Gn.paymentAsset,{recipient:Gn.recipient,amount:Gn.amount,fromAddress:a})),Gn.currentPayment.status="SUCCESS";break;case B.CHAIN.SOLANA:Gn.currentPayment.result=await async function(e,t){if(e!==B.CHAIN.SOLANA)throw new Wn(On);if(!t.fromAddress)throw new Wn(Nn,"fromAddress is required for Solana payments.");const a="string"==typeof t.amount?parseFloat(t.amount):t.amount;if(isNaN(a)||a<=0)throw new Wn(Nn,"Invalid payment amount.");try{if(!Ut.getProvider(e))throw new Wn(Ln,"No Solana provider available.");const n=await xt.sendTransaction({chainNamespace:B.CHAIN.SOLANA,to:t.recipient,value:a,tokenMint:t.tokenMint});if(!n)throw new Wn(Ln,"Transaction failed.");return n}catch(n){if(n instanceof Wn)throw n;throw new Wn(Ln,`Solana payment failed: ${n}`)}}(n,{recipient:Gn.recipient,amount:Gn.amount,fromAddress:a,tokenMint:"native"===Gn.paymentAsset.asset?void 0:Gn.paymentAsset.asset}),Gn.currentPayment.status="SUCCESS";break;default:throw new Wn(On)}}catch(o){Gn.error=o instanceof Wn?o.message:Fn.GENERIC_PAYMENT_ERROR,Gn.currentPayment.status="FAILED",Le.showError(Gn.error)}finally{Gn.isPaymentInProgress=!1}},getExchangeById:e=>Gn.exchanges.find(t=>t.id===e),validatePayConfig(e){const{paymentAsset:t,recipient:a,amount:n}=e;if(!t)throw new Wn(Nn);if(!a)throw new Wn(_n);if(!t.asset)throw new Wn(Pn);if(null==n||n<=0)throw new Wn(Tn)},handlePayWithWallet(){const e=Kt.getActiveCaipAddress();if(!e)return void pt.push("Connect");const{chainId:t,address:a}=Z.parseCaipAddress(e),n=Kt.state.activeChain;a&&t&&n?this.handlePayment():pt.push("Connect")},async handlePayWithExchange(e){try{Gn.currentPayment={type:"exchange",exchangeId:e};const{network:t,asset:a}=Gn.paymentAsset,n={network:t,asset:a,amount:Gn.amount,recipient:Gn.recipient},r=await this.getPayUrl(e,n);if(!r)throw new Wn($n);return Gn.currentPayment.sessionId=r.sessionId,Gn.currentPayment.status="IN_PROGRESS",Gn.currentPayment.exchangeId=e,this.initiatePayment(),{url:r.url,openInNewTab:Gn.openInNewTab}}catch(t){return Gn.error=t instanceof Wn?t.message:Fn.GENERIC_PAYMENT_ERROR,Gn.isPaymentInProgress=!1,Le.showError(Gn.error),null}},async getBuyStatus(e,t){var a,n;try{const r=await async function(e){return(await jn("reown_getExchangeBuyStatus",e)).result}({sessionId:t,exchangeId:e});return"SUCCESS"!==r.status&&"FAILED"!==r.status||rt.sendEvent({type:"track",event:"SUCCESS"===r.status?"PAY_SUCCESS":"PAY_ERROR",properties:{message:"FAILED"===r.status?ke.parseError(Gn.error):void 0,source:"pay",paymentId:Gn.paymentId||qn,configuration:{network:Gn.paymentAsset.network,asset:Gn.paymentAsset.asset,recipient:Gn.recipient,amount:Gn.amount},currentPayment:{type:"exchange",exchangeId:null==(a=Gn.currentPayment)?void 0:a.exchangeId,sessionId:null==(n=Gn.currentPayment)?void 0:n.sessionId,result:r.txHash}}}),r}catch(r){throw new Wn(Bn)}},async updateBuyStatus(e,t){try{const a=await this.getBuyStatus(e,t);Gn.currentPayment&&(Gn.currentPayment.status=a.status,Gn.currentPayment.result=a.txHash),"SUCCESS"!==a.status&&"FAILED"!==a.status||(Gn.isPaymentInProgress=!1)}catch(a){throw new Wn(Bn)}},initiatePayment(){Gn.isPaymentInProgress=!0,Gn.paymentId=crypto.randomUUID()},initializeAnalytics(){Gn.analyticsSet||(Gn.analyticsSet=!0,this.subscribeKey("isPaymentInProgress",e=>{var t;if((null==(t=Gn.currentPayment)?void 0:t.status)&&"UNKNOWN"!==Gn.currentPayment.status){const e={IN_PROGRESS:"PAY_INITIATED",SUCCESS:"PAY_SUCCESS",FAILED:"PAY_ERROR"}[Gn.currentPayment.status];rt.sendEvent({type:"track",event:e,properties:{message:"FAILED"===Gn.currentPayment.status?ke.parseError(Gn.error):void 0,source:"pay",paymentId:Gn.paymentId||qn,configuration:{network:Gn.paymentAsset.network,asset:Gn.paymentAsset.asset,recipient:Gn.recipient,amount:Gn.amount},currentPayment:{type:Gn.currentPayment.type,exchangeId:Gn.currentPayment.exchangeId,sessionId:Gn.currentPayment.sessionId,result:Gn.currentPayment.result}}})}}))}},Yn=n`
  wui-separator {
    margin: var(--apkt-spacing-3) calc(var(--apkt-spacing-3) * -1) var(--apkt-spacing-2)
      calc(var(--apkt-spacing-3) * -1);
    width: calc(100% + var(--apkt-spacing-3) * 2);
  }

  .token-display {
    padding: var(--apkt-spacing-3) var(--apkt-spacing-3);
    border-radius: var(--apkt-borderRadius-5);
    background-color: var(--apkt-tokens-theme-backgroundPrimary);
    margin-top: var(--apkt-spacing-3);
    margin-bottom: var(--apkt-spacing-3);
  }

  .token-display wui-text {
    text-transform: none;
  }

  wui-loading-spinner {
    padding: var(--apkt-spacing-2);
  }
`;var Qn=function(e,t,a,n){var r,o=arguments.length,i=o<3?t:null===n?n=Object.getOwnPropertyDescriptor(t,a):n;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)i=Reflect.decorate(e,t,a,n);else for(var s=e.length-1;s>=0;s--)(r=e[s])&&(i=(o<3?r(i):o>3?r(t,a,i):r(t,a))||i);return o>3&&i&&Object.defineProperty(t,a,i),i};let Xn=class extends s{constructor(){var e;super(),this.unsubscribe=[],this.amount="",this.tokenSymbol="",this.networkName="",this.exchanges=Jn.state.exchanges,this.isLoading=Jn.state.isLoading,this.loadingExchangeId=null,this.connectedWalletInfo=null==(e=Kt.getAccountData())?void 0:e.connectedWalletInfo,this.initializePaymentDetails(),this.unsubscribe.push(Jn.subscribeKey("exchanges",e=>this.exchanges=e)),this.unsubscribe.push(Jn.subscribeKey("isLoading",e=>this.isLoading=e)),this.unsubscribe.push(Kt.subscribeChainProp("accountState",e=>{this.connectedWalletInfo=null==e?void 0:e.connectedWalletInfo})),Jn.fetchExchanges()}get isWalletConnected(){const e=Kt.getAccountData();return"connected"===(null==e?void 0:e.status)}render(){return d`
      <wui-flex flexDirection="column">
        <wui-flex flexDirection="column" .padding=${["0","4","4","4"]} gap="3">
          ${this.renderPaymentHeader()}

          <wui-flex flexDirection="column" gap="3">
            ${this.renderPayWithWallet()} ${this.renderExchangeOptions()}
          </wui-flex>
        </wui-flex>
      </wui-flex>
    `}initializePaymentDetails(){const e=Jn.getPaymentAsset();this.networkName=e.network,this.tokenSymbol=e.metadata.symbol,this.amount=Jn.state.amount.toString()}renderPayWithWallet(){return function(e){const{chainNamespace:t}=Z.parseCaipNetworkId(e);return Hn.includes(t)}(this.networkName)?d`<wui-flex flexDirection="column" gap="3">
        ${this.isWalletConnected?this.renderConnectedView():this.renderDisconnectedView()}
      </wui-flex>
      <wui-separator text="or"></wui-separator>`:d``}renderPaymentHeader(){let e=this.networkName;if(this.networkName){const t=Kt.getAllRequestedCaipNetworks().find(e=>e.caipNetworkId===this.networkName);t&&(e=t.name)}return d`
      <wui-flex flexDirection="column" alignItems="center">
        <wui-flex alignItems="center" gap="2">
          <wui-text variant="h1-regular" color="primary">${this.amount||"0.0000"}</wui-text>
          <wui-flex class="token-display" alignItems="center" gap="1">
            <wui-text variant="md-medium" color="primary">
              ${this.tokenSymbol||"Unknown Asset"}
            </wui-text>
            ${e?d`
                  <wui-text variant="sm-medium" color="secondary">
                    on ${e}
                  </wui-text>
                `:""}
          </wui-flex>
        </wui-flex>
      </wui-flex>
    `}renderConnectedView(){var e,t;const a=(null==(e=this.connectedWalletInfo)?void 0:e.name)||"connected wallet";return d`
      <wui-list-item
        @click=${this.onWalletPayment}
        ?chevron=${!0}
        ?fullSize=${!0}
        ?rounded=${!0}
        data-testid="wallet-payment-option"
        imageSrc=${u(null==(t=this.connectedWalletInfo)?void 0:t.icon)}
      >
        <wui-text variant="lg-regular" color="primary">Pay with ${a}</wui-text>
      </wui-list-item>

      <wui-list-item
        icon="power"
        ?rounded=${!0}
        iconColor="error"
        @click=${this.onDisconnect}
        data-testid="disconnect-button"
        ?chevron=${!1}
      >
        <wui-text variant="lg-regular" color="secondary">Disconnect</wui-text>
      </wui-list-item>
    `}renderDisconnectedView(){return d`<wui-list-item
      variant="icon"
      iconVariant="overlay"
      icon="wallet"
      ?rounded=${!0}
      @click=${this.onWalletPayment}
      ?chevron=${!0}
      data-testid="wallet-payment-option"
    >
      <wui-text variant="lg-regular" color="primary">Pay from wallet</wui-text>
    </wui-list-item>`}renderExchangeOptions(){return this.isLoading?d`<wui-flex justifyContent="center" alignItems="center">
        <wui-spinner size="md"></wui-spinner>
      </wui-flex>`:0===this.exchanges.length?d`<wui-flex justifyContent="center" alignItems="center">
        <wui-text variant="md-medium" color="primary">No exchanges available</wui-text>
      </wui-flex>`:this.exchanges.map(e=>d`
        <wui-list-item
          @click=${()=>this.onExchangePayment(e.id)}
          data-testid="exchange-option-${e.id}"
          ?chevron=${!0}
          ?disabled=${null!==this.loadingExchangeId}
          ?loading=${this.loadingExchangeId===e.id}
          imageSrc=${u(e.imageUrl)}
        >
          <wui-flex alignItems="center" gap="3">
            <wui-text flexGrow="1" variant="md-medium" color="primary"
              >Pay with ${e.name} <wui-spinner size="sm" color="secondary"></wui-spinner
            ></wui-text>
          </wui-flex>
        </wui-list-item>
      `)}onWalletPayment(){Jn.handlePayWithWallet()}async onExchangePayment(e){try{this.loadingExchangeId=e;const t=await Jn.handlePayWithExchange(e);t&&(await Jt.open({view:"PayLoading"}),ke.openHref(t.url,t.openInNewTab?"_blank":"_self"))}catch(t){Le.showError("Failed to pay with exchange")}finally{this.loadingExchangeId=null}}async onDisconnect(e){e.stopPropagation();try{await xt.disconnect()}catch{Le.showError("Failed to disconnect")}}disconnectedCallback(){this.unsubscribe.forEach(e=>e())}};Xn.styles=Yn,Qn([h()],Xn.prototype,"amount",void 0),Qn([h()],Xn.prototype,"tokenSymbol",void 0),Qn([h()],Xn.prototype,"networkName",void 0),Qn([h()],Xn.prototype,"exchanges",void 0),Qn([h()],Xn.prototype,"isLoading",void 0),Qn([h()],Xn.prototype,"loadingExchangeId",void 0),Qn([h()],Xn.prototype,"connectedWalletInfo",void 0),Xn=Qn([sa("w3m-pay-view")],Xn);const er=aa`
  :host {
    display: block;
    width: 100px;
    height: 100px;
  }

  svg {
    width: 100px;
    height: 100px;
  }

  rect {
    fill: none;
    stroke: ${e=>e.colors.accent100};
    stroke-width: 3px;
    stroke-linecap: round;
    animation: dash 1s linear infinite;
  }

  @keyframes dash {
    to {
      stroke-dashoffset: 0px;
    }
  }
`;var tr=function(e,t,a,n){var r,o=arguments.length,i=o<3?t:null===n?n=Object.getOwnPropertyDescriptor(t,a):n;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)i=Reflect.decorate(e,t,a,n);else for(var s=e.length-1;s>=0;s--)(r=e[s])&&(i=(o<3?r(i):o>3?r(t,a,i):r(t,a))||i);return o>3&&i&&Object.defineProperty(t,a,i),i};let ar=class extends s{constructor(){super(...arguments),this.radius=36}render(){return this.svgLoaderTemplate()}svgLoaderTemplate(){const e=this.radius>50?50:this.radius,t=36-e;return d`
      <svg viewBox="0 0 110 110" width="110" height="110">
        <rect
          x="2"
          y="2"
          width="106"
          height="106"
          rx=${e}
          stroke-dasharray="${116+t} ${245+t}"
          stroke-dashoffset=${360+1.75*t}
        />
      </svg>
    `}};ar.styles=[na,er],tr([i({type:Number})],ar.prototype,"radius",void 0),ar=tr([sa("wui-loading-thumbnail")],ar);const nr=n`
  :host {
    display: block;
    height: 100%;
    width: 100%;
  }

  wui-flex:first-child:not(:only-child) {
    position: relative;
  }

  wui-loading-thumbnail {
    position: absolute;
  }
`;var rr=function(e,t,a,n){var r,o=arguments.length,i=o<3?t:null===n?n=Object.getOwnPropertyDescriptor(t,a):n;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)i=Reflect.decorate(e,t,a,n);else for(var s=e.length-1;s>=0;s--)(r=e[s])&&(i=(o<3?r(i):o>3?r(t,a,i):r(t,a))||i);return o>3&&i&&Object.defineProperty(t,a,i),i};let or=class extends s{constructor(){super(),this.loadingMessage="",this.subMessage="",this.paymentState="in-progress",this.paymentState=Jn.state.isPaymentInProgress?"in-progress":"completed",this.updateMessages(),this.setupSubscription(),this.setupExchangeSubscription()}disconnectedCallback(){clearInterval(this.exchangeSubscription)}render(){return d`
      <wui-flex
        flexDirection="column"
        alignItems="center"
        .padding=${["7","5","5","5"]}
        gap="9"
      >
        <wui-flex justifyContent="center" alignItems="center"> ${this.getStateIcon()} </wui-flex>
        <wui-flex flexDirection="column" alignItems="center" gap="2">
          <wui-text align="center" variant="lg-medium" color="primary">
            ${this.loadingMessage}
          </wui-text>
          <wui-text align="center" variant="lg-regular" color="secondary">
            ${this.subMessage}
          </wui-text>
        </wui-flex>
      </wui-flex>
    `}updateMessages(){var e;switch(this.paymentState){case"completed":this.loadingMessage="Payment completed",this.subMessage="Your transaction has been successfully processed";break;case"error":this.loadingMessage="Payment failed",this.subMessage="There was an error processing your transaction";break;default:"exchange"===(null==(e=Jn.state.currentPayment)?void 0:e.type)?(this.loadingMessage="Payment initiated",this.subMessage="Please complete the payment on the exchange"):(this.loadingMessage="Awaiting payment confirmation",this.subMessage="Please confirm the payment transaction in your wallet")}}getStateIcon(){switch(this.paymentState){case"completed":return this.successTemplate();case"error":return this.errorTemplate();default:return this.loaderTemplate()}}setupExchangeSubscription(){var e;"exchange"===(null==(e=Jn.state.currentPayment)?void 0:e.type)&&(this.exchangeSubscription=setInterval(async()=>{var e,t,a;const n=null==(e=Jn.state.currentPayment)?void 0:e.exchangeId,r=null==(t=Jn.state.currentPayment)?void 0:t.sessionId;n&&r&&(await Jn.updateBuyStatus(n,r),"SUCCESS"===(null==(a=Jn.state.currentPayment)?void 0:a.status)&&clearInterval(this.exchangeSubscription))},4e3))}setupSubscription(){Jn.subscribeKey("isPaymentInProgress",e=>{var t;e||"in-progress"!==this.paymentState||(Jn.state.error||!(null==(t=Jn.state.currentPayment)?void 0:t.result)?this.paymentState="error":this.paymentState="completed",this.updateMessages(),setTimeout(()=>{"disconnected"!==xt.state.status&&Jt.close()},3e3))}),Jn.subscribeKey("error",e=>{e&&"in-progress"===this.paymentState&&(this.paymentState="error",this.updateMessages())})}loaderTemplate(){const e=gt.state.themeVariables["--w3m-border-radius-master"],t=e?parseInt(e.replace("px",""),10):4,a=this.getPaymentIcon();return d`
      <wui-flex justifyContent="center" alignItems="center" style="position: relative;">
        ${a?d`<wui-wallet-image size="lg" imageSrc=${a}></wui-wallet-image>`:null}
        <wui-loading-thumbnail radius=${9*t}></wui-loading-thumbnail>
      </wui-flex>
    `}getPaymentIcon(){var e,t;const a=Jn.state.currentPayment;if(a){if("exchange"===a.type){const e=a.exchangeId;if(e){const t=Jn.getExchangeById(e);return null==t?void 0:t.imageUrl}}if("wallet"===a.type){const a=null==(t=null==(e=Kt.getAccountData())?void 0:e.connectedWalletInfo)?void 0:t.icon;if(a)return a;const n=Kt.state.activeChain;if(!n)return;const r=vt.getConnectorId(n);if(!r)return;const o=vt.getConnectorById(r);if(!o)return;return Xe.getConnectorImage(o)}}}successTemplate(){return d`<wui-icon size="xl" color="success" name="checkmark"></wui-icon>`}errorTemplate(){return d`<wui-icon size="xl" color="error" name="close"></wui-icon>`}};or.styles=nr,rr([h()],or.prototype,"loadingMessage",void 0),rr([h()],or.prototype,"subMessage",void 0),rr([h()],or.prototype,"paymentState",void 0),or=rr([sa("w3m-pay-loading-view")],or);async function ir(e){return Jn.handleOpenPay(e)}async function sr(e,t=3e5){if(t<=0)throw new Wn(Nn,"Timeout must be greater than 0");try{await ir(e)}catch(a){if(a instanceof Wn)throw a;throw new Wn($n,a.message)}return new Promise((e,a)=>{let n=!1;const r=setTimeout(()=>{n||(n=!0,l(),a(new Wn(Ln,"Payment timeout")))},t);function o(){if(n)return;const t=Jn.state.currentPayment,a=Jn.state.error,o=Jn.state.isPaymentInProgress;return"SUCCESS"===(null==t?void 0:t.status)?(n=!0,l(),clearTimeout(r),void e({success:!0,result:t.result})):"FAILED"===(null==t?void 0:t.status)?(n=!0,l(),clearTimeout(r),void e({success:!1,error:a||"Payment failed"})):void(!a||o||t||(n=!0,l(),clearTimeout(r),e({success:!1,error:a})))}const i=ur("currentPayment",o),s=ur("error",o),c=ur("isPaymentInProgress",o),l=(d=[i,s,c],()=>{d.forEach(e=>{try{e()}catch{}})});var d;o()})}function cr(){return Jn.getExchanges()}function lr(){var e;return null==(e=Jn.state.currentPayment)?void 0:e.result}function dr(){return Jn.state.error}function pr(){return Jn.state.isPaymentInProgress}function ur(e,t){return Jn.subscribeKey(e,t)}const hr={network:"eip155:8453",asset:"native",metadata:{name:"Ethereum",symbol:"ETH",decimals:18}},gr={network:"eip155:8453",asset:"0x833589fcd6edb6e08f4c7c32d4f71b54bda02913",metadata:{name:"USD Coin",symbol:"USDC",decimals:6}},mr={network:"eip155:84532",asset:"native",metadata:{name:"Ethereum",symbol:"ETH",decimals:18}},fr={network:"eip155:1",asset:"0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",metadata:{name:"USD Coin",symbol:"USDC",decimals:6}},wr={network:"eip155:10",asset:"0x0b2c639c533813f4aa9d7837caf62653d097ff85",metadata:{name:"USD Coin",symbol:"USDC",decimals:6}},vr={network:"eip155:42161",asset:"0xaf88d065e77c8cC2239327C5EDb3A432268e5831",metadata:{name:"USD Coin",symbol:"USDC",decimals:6}},yr={network:"eip155:137",asset:"0x3c499c542cef5e3811e1192ce70d8cc03d5c3359",metadata:{name:"USD Coin",symbol:"USDC",decimals:6}},Cr={network:"solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp",asset:"EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",metadata:{name:"USD Coin",symbol:"USDC",decimals:6}},br={network:"eip155:1",asset:"0xdAC17F958D2ee523a2206206994597C13D831ec7",metadata:{name:"Tether USD",symbol:"USDT",decimals:6}},kr={network:"eip155:10",asset:"0x94b008aA00579c1307B0EF2c499aD98a8ce58e58",metadata:{name:"Tether USD",symbol:"USDT",decimals:6}},Er={network:"eip155:42161",asset:"0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9",metadata:{name:"Tether USD",symbol:"USDT",decimals:6}},Ir={network:"eip155:137",asset:"0xc2132d05d31c914a87c6611c10748aeb04b58e8f",metadata:{name:"Tether USD",symbol:"USDT",decimals:6}},Ar={network:"solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp",asset:"Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",metadata:{name:"Tether USD",symbol:"USDT",decimals:6}},Sr={network:"solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp",asset:"native",metadata:{name:"Solana",symbol:"SOL",decimals:9}};export{or as W3mPayLoadingView,Xn as W3mPayView,vr as arbitrumUSDC,Er as arbitrumUSDT,hr as baseETH,mr as baseSepoliaETH,gr as baseUSDC,fr as ethereumUSDC,br as ethereumUSDT,cr as getExchanges,pr as getIsPaymentInProgress,dr as getPayError,lr as getPayResult,ir as openPay,wr as optimismUSDC,kr as optimismUSDT,sr as pay,yr as polygonUSDC,Ir as polygonUSDT,Sr as solanaSOL,Cr as solanaUSDC,Ar as solanaUSDT};
