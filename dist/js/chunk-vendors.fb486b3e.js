(self["webpackChunkpetanque_draw"]=self["webpackChunkpetanque_draw"]||[]).push([[998],{444:function(e,t,n){"use strict";n.d(t,{BH:function(){return k},DV:function(){return W},GJ:function(){return U},L:function(){return l},LL:function(){return O},P0:function(){return b},Sg:function(){return E},UI:function(){return V},US:function(){return c},Wl:function(){return q},Yr:function(){return P},ZR:function(){return D},aH:function(){return C},b$:function(){return S},cI:function(){return F},dS:function(){return X},eu:function(){return x},g5:function(){return o},gK:function(){return J},gQ:function(){return Y},h$:function(){return u},hl:function(){return N},hu:function(){return i},m9:function(){return Z},p$:function(){return d},r3:function(){return H},uI:function(){return T},ug:function(){return Q},vZ:function(){return K},w9:function(){return j},xO:function(){return G},xb:function(){return $},zI:function(){return R}});
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
const r={NODE_CLIENT:!1,NODE_ADMIN:!1,SDK_VERSION:"${JSCORE_VERSION}"},i=function(e,t){if(!e)throw o(t)},o=function(e){return new Error("Firebase Database ("+r.SDK_VERSION+") INTERNAL ASSERT FAILED: "+e)},s=function(e){const t=[];let n=0;for(let r=0;r<e.length;r++){let i=e.charCodeAt(r);i<128?t[n++]=i:i<2048?(t[n++]=i>>6|192,t[n++]=63&i|128):55296===(64512&i)&&r+1<e.length&&56320===(64512&e.charCodeAt(r+1))?(i=65536+((1023&i)<<10)+(1023&e.charCodeAt(++r)),t[n++]=i>>18|240,t[n++]=i>>12&63|128,t[n++]=i>>6&63|128,t[n++]=63&i|128):(t[n++]=i>>12|224,t[n++]=i>>6&63|128,t[n++]=63&i|128)}return t},a=function(e){const t=[];let n=0,r=0;while(n<e.length){const i=e[n++];if(i<128)t[r++]=String.fromCharCode(i);else if(i>191&&i<224){const o=e[n++];t[r++]=String.fromCharCode((31&i)<<6|63&o)}else if(i>239&&i<365){const o=e[n++],s=e[n++],a=e[n++],c=((7&i)<<18|(63&o)<<12|(63&s)<<6|63&a)-65536;t[r++]=String.fromCharCode(55296+(c>>10)),t[r++]=String.fromCharCode(56320+(1023&c))}else{const o=e[n++],s=e[n++];t[r++]=String.fromCharCode((15&i)<<12|(63&o)<<6|63&s)}}return t.join("")},c={byteToCharMap_:null,charToByteMap_:null,byteToCharMapWebSafe_:null,charToByteMapWebSafe_:null,ENCODED_VALS_BASE:"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",get ENCODED_VALS(){return this.ENCODED_VALS_BASE+"+/="},get ENCODED_VALS_WEBSAFE(){return this.ENCODED_VALS_BASE+"-_."},HAS_NATIVE_SUPPORT:"function"===typeof atob,encodeByteArray(e,t){if(!Array.isArray(e))throw Error("encodeByteArray takes an array as a parameter");this.init_();const n=t?this.byteToCharMapWebSafe_:this.byteToCharMap_,r=[];for(let i=0;i<e.length;i+=3){const t=e[i],o=i+1<e.length,s=o?e[i+1]:0,a=i+2<e.length,c=a?e[i+2]:0,u=t>>2,l=(3&t)<<4|s>>4;let h=(15&s)<<2|c>>6,d=63&c;a||(d=64,o||(h=64)),r.push(n[u],n[l],n[h],n[d])}return r.join("")},encodeString(e,t){return this.HAS_NATIVE_SUPPORT&&!t?btoa(e):this.encodeByteArray(s(e),t)},decodeString(e,t){return this.HAS_NATIVE_SUPPORT&&!t?atob(e):a(this.decodeStringToByteArray(e,t))},decodeStringToByteArray(e,t){this.init_();const n=t?this.charToByteMapWebSafe_:this.charToByteMap_,r=[];for(let i=0;i<e.length;){const t=n[e.charAt(i++)],o=i<e.length,s=o?n[e.charAt(i)]:0;++i;const a=i<e.length,c=a?n[e.charAt(i)]:64;++i;const u=i<e.length,l=u?n[e.charAt(i)]:64;if(++i,null==t||null==s||null==c||null==l)throw Error();const h=t<<2|s>>4;if(r.push(h),64!==c){const e=s<<4&240|c>>2;if(r.push(e),64!==l){const e=c<<6&192|l;r.push(e)}}}return r},init_(){if(!this.byteToCharMap_){this.byteToCharMap_={},this.charToByteMap_={},this.byteToCharMapWebSafe_={},this.charToByteMapWebSafe_={};for(let e=0;e<this.ENCODED_VALS.length;e++)this.byteToCharMap_[e]=this.ENCODED_VALS.charAt(e),this.charToByteMap_[this.byteToCharMap_[e]]=e,this.byteToCharMapWebSafe_[e]=this.ENCODED_VALS_WEBSAFE.charAt(e),this.charToByteMapWebSafe_[this.byteToCharMapWebSafe_[e]]=e,e>=this.ENCODED_VALS_BASE.length&&(this.charToByteMap_[this.ENCODED_VALS_WEBSAFE.charAt(e)]=e,this.charToByteMapWebSafe_[this.ENCODED_VALS.charAt(e)]=e)}}},u=function(e){const t=s(e);return c.encodeByteArray(t,!0)},l=function(e){return u(e).replace(/\./g,"")},h=function(e){try{return c.decodeString(e,!0)}catch(t){console.error("base64Decode failed: ",t)}return null};
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
function d(e){return f(void 0,e)}function f(e,t){if(!(t instanceof Object))return t;switch(t.constructor){case Date:const n=t;return new Date(n.getTime());case Object:void 0===e&&(e={});break;case Array:e=[];break;default:return t}for(const n in t)t.hasOwnProperty(n)&&p(n)&&(e[n]=f(e[n],t[n]));return e}function p(e){return"__proto__"!==e}
/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function g(){if("undefined"!==typeof self)return self;if("undefined"!==typeof window)return window;if("undefined"!==typeof n.g)return n.g;throw new Error("Unable to locate global object.")}
/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const m=()=>g().__FIREBASE_DEFAULTS__,_=()=>{if("undefined"===typeof process)return;const e={NODE_ENV:"production",BASE_URL:"/petanque-swiss-vue/dist/"}.__FIREBASE_DEFAULTS__;return e?JSON.parse(e):void 0},v=()=>{if("undefined"===typeof document)return;let e;try{e=document.cookie.match(/__FIREBASE_DEFAULTS__=([^;]+)/)}catch(n){return}const t=e&&h(e[1]);return t&&JSON.parse(t)},y=()=>{try{return m()||_()||v()}catch(e){return void console.info(`Unable to get __FIREBASE_DEFAULTS__ due to: ${e}`)}},w=e=>{var t,n;return null===(n=null===(t=y())||void 0===t?void 0:t.emulatorHosts)||void 0===n?void 0:n[e]},b=e=>{const t=w(e);if(!t)return;const n=t.lastIndexOf(":");if(n<=0||n+1===t.length)throw new Error(`Invalid host ${t} with no separate hostname and port!`);const r=parseInt(t.substring(n+1),10);return"["===t[0]?[t.substring(1,n-1),r]:[t.substring(0,n),r]},C=()=>{var e;return null===(e=y())||void 0===e?void 0:e.config};
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
class k{constructor(){this.reject=()=>{},this.resolve=()=>{},this.promise=new Promise(((e,t)=>{this.resolve=e,this.reject=t}))}wrapCallback(e){return(t,n)=>{t?this.reject(t):this.resolve(n),"function"===typeof e&&(this.promise.catch((()=>{})),1===e.length?e(t):e(t,n))}}}
/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function E(e,t){if(e.uid)throw new Error('The "uid" field is no longer supported by mockUserToken. Please use "sub" instead for Firebase Auth User ID.');const n={alg:"none",type:"JWT"},r=t||"demo-project",i=e.iat||0,o=e.sub||e.user_id;if(!o)throw new Error("mockUserToken must contain 'sub' or 'user_id' field!");const s=Object.assign({iss:`https://securetoken.google.com/${r}`,aud:r,iat:i,exp:i+3600,auth_time:i,sub:o,user_id:o,firebase:{sign_in_provider:"custom",identities:{}}},e),a="";return[l(JSON.stringify(n)),l(JSON.stringify(s)),a].join(".")}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function I(){return"undefined"!==typeof navigator&&"string"===typeof navigator["userAgent"]?navigator["userAgent"]:""}function T(){return"undefined"!==typeof window&&!!(window["cordova"]||window["phonegap"]||window["PhoneGap"])&&/ios|iphone|ipod|ipad|android|blackberry|iemobile/i.test(I())}function S(){return"object"===typeof navigator&&"ReactNative"===navigator["product"]}function P(){return!0===r.NODE_CLIENT||!0===r.NODE_ADMIN}function N(){try{return"object"===typeof indexedDB}catch(e){return!1}}function x(){return new Promise(((e,t)=>{try{let n=!0;const r="validate-browser-context-for-indexeddb-analytics-module",i=self.indexedDB.open(r);i.onsuccess=()=>{i.result.close(),n||self.indexedDB.deleteDatabase(r),e(!0)},i.onupgradeneeded=()=>{n=!1},i.onerror=()=>{var e;t((null===(e=i.error)||void 0===e?void 0:e.message)||"")}}catch(n){t(n)}}))}function R(){return!("undefined"===typeof navigator||!navigator.cookieEnabled)}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const A="FirebaseError";class D extends Error{constructor(e,t,n){super(t),this.code=e,this.customData=n,this.name=A,Object.setPrototypeOf(this,D.prototype),Error.captureStackTrace&&Error.captureStackTrace(this,O.prototype.create)}}class O{constructor(e,t,n){this.service=e,this.serviceName=t,this.errors=n}create(e,...t){const n=t[0]||{},r=`${this.service}/${e}`,i=this.errors[e],o=i?M(i,n):"Error",s=`${this.serviceName}: ${o} (${r}).`,a=new D(r,s,n);return a}}function M(e,t){return e.replace(L,((e,n)=>{const r=t[n];return null!=r?String(r):`<${n}?>`}))}const L=/\{\$([^}]+)}/g;
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function F(e){return JSON.parse(e)}function q(e){return JSON.stringify(e)}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const B=function(e){let t={},n={},r={},i="";try{const o=e.split(".");t=F(h(o[0])||""),n=F(h(o[1])||""),i=o[2],r=n["d"]||{},delete n["d"]}catch(o){}return{header:t,claims:n,data:r,signature:i}},j=function(e){const t=B(e),n=t.claims;return!!n&&"object"===typeof n&&n.hasOwnProperty("iat")},U=function(e){const t=B(e).claims;return"object"===typeof t&&!0===t["admin"]};
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
function H(e,t){return Object.prototype.hasOwnProperty.call(e,t)}function W(e,t){return Object.prototype.hasOwnProperty.call(e,t)?e[t]:void 0}function $(e){for(const t in e)if(Object.prototype.hasOwnProperty.call(e,t))return!1;return!0}function V(e,t,n){const r={};for(const i in e)Object.prototype.hasOwnProperty.call(e,i)&&(r[i]=t.call(n,e[i],i,e));return r}function K(e,t){if(e===t)return!0;const n=Object.keys(e),r=Object.keys(t);for(const i of n){if(!r.includes(i))return!1;const n=e[i],o=t[i];if(z(n)&&z(o)){if(!K(n,o))return!1}else if(n!==o)return!1}for(const i of r)if(!n.includes(i))return!1;return!0}function z(e){return null!==e&&"object"===typeof e}
/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
function G(e){const t=[];for(const[n,r]of Object.entries(e))Array.isArray(r)?r.forEach((e=>{t.push(encodeURIComponent(n)+"="+encodeURIComponent(e))})):t.push(encodeURIComponent(n)+"="+encodeURIComponent(r));return t.length?"&"+t.join("&"):""}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
class Y{constructor(){this.chain_=[],this.buf_=[],this.W_=[],this.pad_=[],this.inbuf_=0,this.total_=0,this.blockSize=64,this.pad_[0]=128;for(let e=1;e<this.blockSize;++e)this.pad_[e]=0;this.reset()}reset(){this.chain_[0]=1732584193,this.chain_[1]=4023233417,this.chain_[2]=2562383102,this.chain_[3]=271733878,this.chain_[4]=3285377520,this.inbuf_=0,this.total_=0}compress_(e,t){t||(t=0);const n=this.W_;if("string"===typeof e)for(let l=0;l<16;l++)n[l]=e.charCodeAt(t)<<24|e.charCodeAt(t+1)<<16|e.charCodeAt(t+2)<<8|e.charCodeAt(t+3),t+=4;else for(let l=0;l<16;l++)n[l]=e[t]<<24|e[t+1]<<16|e[t+2]<<8|e[t+3],t+=4;for(let l=16;l<80;l++){const e=n[l-3]^n[l-8]^n[l-14]^n[l-16];n[l]=4294967295&(e<<1|e>>>31)}let r,i,o=this.chain_[0],s=this.chain_[1],a=this.chain_[2],c=this.chain_[3],u=this.chain_[4];for(let l=0;l<80;l++){l<40?l<20?(r=c^s&(a^c),i=1518500249):(r=s^a^c,i=1859775393):l<60?(r=s&a|c&(s|a),i=2400959708):(r=s^a^c,i=3395469782);const e=(o<<5|o>>>27)+r+u+i+n[l]&4294967295;u=c,c=a,a=4294967295&(s<<30|s>>>2),s=o,o=e}this.chain_[0]=this.chain_[0]+o&4294967295,this.chain_[1]=this.chain_[1]+s&4294967295,this.chain_[2]=this.chain_[2]+a&4294967295,this.chain_[3]=this.chain_[3]+c&4294967295,this.chain_[4]=this.chain_[4]+u&4294967295}update(e,t){if(null==e)return;void 0===t&&(t=e.length);const n=t-this.blockSize;let r=0;const i=this.buf_;let o=this.inbuf_;while(r<t){if(0===o)while(r<=n)this.compress_(e,r),r+=this.blockSize;if("string"===typeof e){while(r<t)if(i[o]=e.charCodeAt(r),++o,++r,o===this.blockSize){this.compress_(i),o=0;break}}else while(r<t)if(i[o]=e[r],++o,++r,o===this.blockSize){this.compress_(i),o=0;break}}this.inbuf_=o,this.total_+=t}digest(){const e=[];let t=8*this.total_;this.inbuf_<56?this.update(this.pad_,56-this.inbuf_):this.update(this.pad_,this.blockSize-(this.inbuf_-56));for(let r=this.blockSize-1;r>=56;r--)this.buf_[r]=255&t,t/=256;this.compress_(this.buf_);let n=0;for(let r=0;r<5;r++)for(let t=24;t>=0;t-=8)e[n]=this.chain_[r]>>t&255,++n;return e}}function J(e,t){return`${e} failed: ${t} argument `}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
const X=function(e){const t=[];let n=0;for(let r=0;r<e.length;r++){let o=e.charCodeAt(r);if(o>=55296&&o<=56319){const t=o-55296;r++,i(r<e.length,"Surrogate pair missing trail surrogate.");const n=e.charCodeAt(r)-56320;o=65536+(t<<10)+n}o<128?t[n++]=o:o<2048?(t[n++]=o>>6|192,t[n++]=63&o|128):o<65536?(t[n++]=o>>12|224,t[n++]=o>>6&63|128,t[n++]=63&o|128):(t[n++]=o>>18|240,t[n++]=o>>12&63|128,t[n++]=o>>6&63|128,t[n++]=63&o|128)}return t},Q=function(e){let t=0;for(let n=0;n<e.length;n++){const r=e.charCodeAt(n);r<128?t++:r<2048?t+=2:r>=55296&&r<=56319?(t+=4,n++):t+=3}return t};
/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
function Z(e){return e&&e._delegate?e._delegate:e}},262:function(e,t,n){"use strict";n.d(t,{$y:function(){return Fe},B:function(){return a},BK:function(){return nt},Bj:function(){return s},EB:function(){return l},Fl:function(){return st},IU:function(){return Be},Jd:function(){return x},OT:function(){return De},PG:function(){return Le},SU:function(){return Xe},Um:function(){return Ae},Vh:function(){return it},WL:function(){return Ze},X$:function(){return L},X3:function(){return qe},XI:function(){return ze},Xl:function(){return je},YS:function(){return Oe},ZM:function(){return tt},cE:function(){return T},dq:function(){return Ve},iH:function(){return Ke},j:function(){return D},lk:function(){return A},nZ:function(){return u},oR:function(){return Je},qj:function(){return Re},qq:function(){return E},sT:function(){return S}});var r=n(577);let i;const o=[];class s{constructor(e=!1){this.active=!0,this.effects=[],this.cleanups=[],!e&&i&&(this.parent=i,this.index=(i.scopes||(i.scopes=[])).push(this)-1)}run(e){if(this.active)try{return this.on(),e()}finally{this.off()}else 0}on(){this.active&&(o.push(this),i=this)}off(){this.active&&(o.pop(),i=o[o.length-1])}stop(e){if(this.active){if(this.effects.forEach((e=>e.stop())),this.cleanups.forEach((e=>e())),this.scopes&&this.scopes.forEach((e=>e.stop(!0))),this.parent&&!e){const e=this.parent.scopes.pop();e&&e!==this&&(this.parent.scopes[this.index]=e,e.index=this.index)}this.active=!1}}}function a(e){return new s(e)}function c(e,t){t=t||i,t&&t.active&&t.effects.push(e)}function u(){return i}function l(e){i&&i.cleanups.push(e)}const h=e=>{const t=new Set(e);return t.w=0,t.n=0,t},d=e=>(e.w&v)>0,f=e=>(e.n&v)>0,p=({deps:e})=>{if(e.length)for(let t=0;t<e.length;t++)e[t].w|=v},g=e=>{const{deps:t}=e;if(t.length){let n=0;for(let r=0;r<t.length;r++){const i=t[r];d(i)&&!f(i)?i.delete(e):t[n++]=i,i.w&=~v,i.n&=~v}t.length=n}},m=new WeakMap;let _=0,v=1;const y=30,w=[];let b;const C=Symbol(""),k=Symbol("");class E{constructor(e,t=null,n){this.fn=e,this.scheduler=t,this.active=!0,this.deps=[],c(this,n)}run(){if(!this.active)return this.fn();if(!w.includes(this))try{return w.push(b=this),R(),v=1<<++_,_<=y?p(this):I(this),this.fn()}finally{_<=y&&g(this),v=1<<--_,A(),w.pop();const e=w.length;b=e>0?w[e-1]:void 0}}stop(){this.active&&(I(this),this.onStop&&this.onStop(),this.active=!1)}}function I(e){const{deps:t}=e;if(t.length){for(let n=0;n<t.length;n++)t[n].delete(e);t.length=0}}function T(e,t){e.effect&&(e=e.effect.fn);const n=new E(e);t&&((0,r.l7)(n,t),t.scope&&c(n,t.scope)),t&&t.lazy||n.run();const i=n.run.bind(n);return i.effect=n,i}function S(e){e.effect.stop()}let P=!0;const N=[];function x(){N.push(P),P=!1}function R(){N.push(P),P=!0}function A(){const e=N.pop();P=void 0===e||e}function D(e,t,n){if(!O())return;let r=m.get(e);r||m.set(e,r=new Map);let i=r.get(n);i||r.set(n,i=h());const o=void 0;M(i,o)}function O(){return P&&void 0!==b}function M(e,t){let n=!1;_<=y?f(e)||(e.n|=v,n=!d(e)):n=!e.has(b),n&&(e.add(b),b.deps.push(e))}function L(e,t,n,i,o,s){const a=m.get(e);if(!a)return;let c=[];if("clear"===t)c=[...a.values()];else if("length"===n&&(0,r.kJ)(e))a.forEach(((e,t)=>{("length"===t||t>=i)&&c.push(e)}));else switch(void 0!==n&&c.push(a.get(n)),t){case"add":(0,r.kJ)(e)?(0,r.S0)(n)&&c.push(a.get("length")):(c.push(a.get(C)),(0,r._N)(e)&&c.push(a.get(k)));break;case"delete":(0,r.kJ)(e)||(c.push(a.get(C)),(0,r._N)(e)&&c.push(a.get(k)));break;case"set":(0,r._N)(e)&&c.push(a.get(C));break}if(1===c.length)c[0]&&F(c[0]);else{const e=[];for(const t of c)t&&e.push(...t);F(h(e))}}function F(e,t){for(const n of(0,r.kJ)(e)?e:[...e])(n!==b||n.allowRecurse)&&(n.scheduler?n.scheduler():n.run())}const q=(0,r.fY)("__proto__,__v_isRef,__isVue"),B=new Set(Object.getOwnPropertyNames(Symbol).map((e=>Symbol[e])).filter(r.yk)),j=K(),U=K(!1,!0),H=K(!0),W=K(!0,!0),$=V();function V(){const e={};return["includes","indexOf","lastIndexOf"].forEach((t=>{e[t]=function(...e){const n=Be(this);for(let t=0,i=this.length;t<i;t++)D(n,"get",t+"");const r=n[t](...e);return-1===r||!1===r?n[t](...e.map(Be)):r}})),["push","pop","shift","unshift","splice"].forEach((t=>{e[t]=function(...e){x();const n=Be(this)[t].apply(this,e);return A(),n}})),e}function K(e=!1,t=!1){return function(n,i,o){if("__v_isReactive"===i)return!e;if("__v_isReadonly"===i)return e;if("__v_raw"===i&&o===(e?t?Pe:Se:t?Te:Ie).get(n))return n;const s=(0,r.kJ)(n);if(!e&&s&&(0,r.RI)($,i))return Reflect.get($,i,o);const a=Reflect.get(n,i,o);if((0,r.yk)(i)?B.has(i):q(i))return a;if(e||D(n,"get",i),t)return a;if(Ve(a)){const e=!s||!(0,r.S0)(i);return e?a.value:a}return(0,r.Kn)(a)?e?De(a):Re(a):a}}const z=Y(),G=Y(!0);function Y(e=!1){return function(t,n,i,o){let s=t[n];if(!e&&!Fe(i)&&(i=Be(i),s=Be(s),!(0,r.kJ)(t)&&Ve(s)&&!Ve(i)))return s.value=i,!0;const a=(0,r.kJ)(t)&&(0,r.S0)(n)?Number(n)<t.length:(0,r.RI)(t,n),c=Reflect.set(t,n,i,o);return t===Be(o)&&(a?(0,r.aU)(i,s)&&L(t,"set",n,i,s):L(t,"add",n,i)),c}}function J(e,t){const n=(0,r.RI)(e,t),i=e[t],o=Reflect.deleteProperty(e,t);return o&&n&&L(e,"delete",t,void 0,i),o}function X(e,t){const n=Reflect.has(e,t);return(0,r.yk)(t)&&B.has(t)||D(e,"has",t),n}function Q(e){return D(e,"iterate",(0,r.kJ)(e)?"length":C),Reflect.ownKeys(e)}const Z={get:j,set:z,deleteProperty:J,has:X,ownKeys:Q},ee={get:H,set(e,t){return!0},deleteProperty(e,t){return!0}},te=(0,r.l7)({},Z,{get:U,set:G}),ne=(0,r.l7)({},ee,{get:W}),re=e=>e,ie=e=>Reflect.getPrototypeOf(e);function oe(e,t,n=!1,r=!1){e=e["__v_raw"];const i=Be(e),o=Be(t);t!==o&&!n&&D(i,"get",t),!n&&D(i,"get",o);const{has:s}=ie(i),a=r?re:n?He:Ue;return s.call(i,t)?a(e.get(t)):s.call(i,o)?a(e.get(o)):void(e!==i&&e.get(t))}function se(e,t=!1){const n=this["__v_raw"],r=Be(n),i=Be(e);return e!==i&&!t&&D(r,"has",e),!t&&D(r,"has",i),e===i?n.has(e):n.has(e)||n.has(i)}function ae(e,t=!1){return e=e["__v_raw"],!t&&D(Be(e),"iterate",C),Reflect.get(e,"size",e)}function ce(e){e=Be(e);const t=Be(this),n=ie(t),r=n.has.call(t,e);return r||(t.add(e),L(t,"add",e,e)),this}function ue(e,t){t=Be(t);const n=Be(this),{has:i,get:o}=ie(n);let s=i.call(n,e);s||(e=Be(e),s=i.call(n,e));const a=o.call(n,e);return n.set(e,t),s?(0,r.aU)(t,a)&&L(n,"set",e,t,a):L(n,"add",e,t),this}function le(e){const t=Be(this),{has:n,get:r}=ie(t);let i=n.call(t,e);i||(e=Be(e),i=n.call(t,e));const o=r?r.call(t,e):void 0,s=t.delete(e);return i&&L(t,"delete",e,void 0,o),s}function he(){const e=Be(this),t=0!==e.size,n=void 0,r=e.clear();return t&&L(e,"clear",void 0,void 0,n),r}function de(e,t){return function(n,r){const i=this,o=i["__v_raw"],s=Be(o),a=t?re:e?He:Ue;return!e&&D(s,"iterate",C),o.forEach(((e,t)=>n.call(r,a(e),a(t),i)))}}function fe(e,t,n){return function(...i){const o=this["__v_raw"],s=Be(o),a=(0,r._N)(s),c="entries"===e||e===Symbol.iterator&&a,u="keys"===e&&a,l=o[e](...i),h=n?re:t?He:Ue;return!t&&D(s,"iterate",u?k:C),{next(){const{value:e,done:t}=l.next();return t?{value:e,done:t}:{value:c?[h(e[0]),h(e[1])]:h(e),done:t}},[Symbol.iterator](){return this}}}}function pe(e){return function(...t){return"delete"!==e&&this}}function ge(){const e={get(e){return oe(this,e)},get size(){return ae(this)},has:se,add:ce,set:ue,delete:le,clear:he,forEach:de(!1,!1)},t={get(e){return oe(this,e,!1,!0)},get size(){return ae(this)},has:se,add:ce,set:ue,delete:le,clear:he,forEach:de(!1,!0)},n={get(e){return oe(this,e,!0)},get size(){return ae(this,!0)},has(e){return se.call(this,e,!0)},add:pe("add"),set:pe("set"),delete:pe("delete"),clear:pe("clear"),forEach:de(!0,!1)},r={get(e){return oe(this,e,!0,!0)},get size(){return ae(this,!0)},has(e){return se.call(this,e,!0)},add:pe("add"),set:pe("set"),delete:pe("delete"),clear:pe("clear"),forEach:de(!0,!0)},i=["keys","values","entries",Symbol.iterator];return i.forEach((i=>{e[i]=fe(i,!1,!1),n[i]=fe(i,!0,!1),t[i]=fe(i,!1,!0),r[i]=fe(i,!0,!0)})),[e,n,t,r]}const[me,_e,ve,ye]=ge();function we(e,t){const n=t?e?ye:ve:e?_e:me;return(t,i,o)=>"__v_isReactive"===i?!e:"__v_isReadonly"===i?e:"__v_raw"===i?t:Reflect.get((0,r.RI)(n,i)&&i in t?n:t,i,o)}const be={get:we(!1,!1)},Ce={get:we(!1,!0)},ke={get:we(!0,!1)},Ee={get:we(!0,!0)};const Ie=new WeakMap,Te=new WeakMap,Se=new WeakMap,Pe=new WeakMap;function Ne(e){switch(e){case"Object":case"Array":return 1;case"Map":case"Set":case"WeakMap":case"WeakSet":return 2;default:return 0}}function xe(e){return e["__v_skip"]||!Object.isExtensible(e)?0:Ne((0,r.W7)(e))}function Re(e){return e&&e["__v_isReadonly"]?e:Me(e,!1,Z,be,Ie)}function Ae(e){return Me(e,!1,te,Ce,Te)}function De(e){return Me(e,!0,ee,ke,Se)}function Oe(e){return Me(e,!0,ne,Ee,Pe)}function Me(e,t,n,i,o){if(!(0,r.Kn)(e))return e;if(e["__v_raw"]&&(!t||!e["__v_isReactive"]))return e;const s=o.get(e);if(s)return s;const a=xe(e);if(0===a)return e;const c=new Proxy(e,2===a?i:n);return o.set(e,c),c}function Le(e){return Fe(e)?Le(e["__v_raw"]):!(!e||!e["__v_isReactive"])}function Fe(e){return!(!e||!e["__v_isReadonly"])}function qe(e){return Le(e)||Fe(e)}function Be(e){const t=e&&e["__v_raw"];return t?Be(t):e}function je(e){return(0,r.Nj)(e,"__v_skip",!0),e}const Ue=e=>(0,r.Kn)(e)?Re(e):e,He=e=>(0,r.Kn)(e)?De(e):e;function We(e){O()&&(e=Be(e),e.dep||(e.dep=h()),M(e.dep))}function $e(e,t){e=Be(e),e.dep&&F(e.dep)}function Ve(e){return Boolean(e&&!0===e.__v_isRef)}function Ke(e){return Ge(e,!1)}function ze(e){return Ge(e,!0)}function Ge(e,t){return Ve(e)?e:new Ye(e,t)}class Ye{constructor(e,t){this._shallow=t,this.dep=void 0,this.__v_isRef=!0,this._rawValue=t?e:Be(e),this._value=t?e:Ue(e)}get value(){return We(this),this._value}set value(e){e=this._shallow?e:Be(e),(0,r.aU)(e,this._rawValue)&&(this._rawValue=e,this._value=this._shallow?e:Ue(e),$e(this,e))}}function Je(e){$e(e,void 0)}function Xe(e){return Ve(e)?e.value:e}const Qe={get:(e,t,n)=>Xe(Reflect.get(e,t,n)),set:(e,t,n,r)=>{const i=e[t];return Ve(i)&&!Ve(n)?(i.value=n,!0):Reflect.set(e,t,n,r)}};function Ze(e){return Le(e)?e:new Proxy(e,Qe)}class et{constructor(e){this.dep=void 0,this.__v_isRef=!0;const{get:t,set:n}=e((()=>We(this)),(()=>$e(this)));this._get=t,this._set=n}get value(){return this._get()}set value(e){this._set(e)}}function tt(e){return new et(e)}function nt(e){const t=(0,r.kJ)(e)?new Array(e.length):{};for(const n in e)t[n]=it(e,n);return t}class rt{constructor(e,t,n){this._object=e,this._key=t,this._defaultValue=n,this.__v_isRef=!0}get value(){const e=this._object[this._key];return void 0===e?this._defaultValue:e}set value(e){this._object[this._key]=e}}function it(e,t,n){const r=e[t];return Ve(r)?r:new rt(e,t,n)}class ot{constructor(e,t,n){this._setter=t,this.dep=void 0,this._dirty=!0,this.__v_isRef=!0,this.effect=new E(e,(()=>{this._dirty||(this._dirty=!0,$e(this))})),this["__v_isReadonly"]=n}get value(){const e=Be(this);return We(e),e._dirty&&(e._dirty=!1,e._value=e.effect.run()),e._value}set value(e){this._setter(e)}}function st(e,t){let n,i;const o=(0,r.mf)(e);o?(n=e,i=r.dG):(n=e.get,i=e.set);const s=new ot(n,i,o||!i);return s}Promise.resolve()},252:function(e,t,n){"use strict";n.d(t,{$d:function(){return er},$y:function(){return r.$y},Ah:function(){return _e},B:function(){return r.B},BK:function(){return r.BK},Bj:function(){return r.Bj},Bz:function(){return qr},C3:function(){return Gt},C_:function(){return i.C_},Cn:function(){return m},EB:function(){return r.EB},Eo:function(){return ht},F4:function(){return tn},FN:function(){return In},Fl:function(){return r.Fl},G:function(){return ti},HX:function(){return _},HY:function(){return At},Ho:function(){return nn},IU:function(){return r.IU},JJ:function(){return q},Jd:function(){return me},KU:function(){return Zn},Ko:function(){return dn},LL:function(){return Pt},MW:function(){return Fr},MX:function(){return Xr},Mr:function(){return Jr},Nv:function(){return fn},OT:function(){return r.OT},Ob:function(){return ne},P$:function(){return W},PG:function(){return r.PG},Q2:function(){return Nt},Q6:function(){return Y},RC:function(){return Q},Rh:function(){return Nr},Rr:function(){return Ur},S3:function(){return tr},SU:function(){return r.SU},U2:function(){return V},Uc:function(){return Gr},Uk:function(){return rn},Um:function(){return r.Um},Us:function(){return lt},Vh:function(){return r.Vh},WI:function(){return pn},WL:function(){return r.WL},WY:function(){return Br},Wm:function(){return Zt},X3:function(){return r.X3},XI:function(){return r.XI},Xl:function(){return r.Xl},Xn:function(){return pe},Y1:function(){return Mn},Y3:function(){return mr},Y8:function(){return j},YP:function(){return Ar},YS:function(){return r.YS},Yq:function(){return ye},ZK:function(){return zn},ZM:function(){return r.ZM},Zq:function(){return Yr},_:function(){return Qt},_A:function(){return i._A},aZ:function(){return J},b9:function(){return jr},bT:function(){return we},bv:function(){return fe},cE:function(){return r.cE},d1:function(){return be},dD:function(){return g},dG:function(){return ln},dl:function(){return ie},dq:function(){return r.dq},ec:function(){return c},eq:function(){return ni},f3:function(){return B},h:function(){return zr},hR:function(){return i.hR},i8:function(){return Zr},iD:function(){return $t},iH:function(){return r.iH},ic:function(){return ge},j4:function(){return Vt},j5:function(){return i.j5},kC:function(){return i.kC},kq:function(){return sn},l1:function(){return Hr},lA:function(){return Kt},lR:function(){return kt},m0:function(){return Pr},mW:function(){return o},mv:function(){return Kr},mx:function(){return mn},n4:function(){return P},nK:function(){return G},nQ:function(){return Qr},nZ:function(){return r.nZ},oR:function(){return r.oR},of:function(){return Ln},p1:function(){return Vr},qG:function(){return Mt},qZ:function(){return Ht},qb:function(){return kr},qj:function(){return r.qj},qq:function(){return r.qq},ry:function(){return ri},sT:function(){return r.sT},se:function(){return oe},sv:function(){return Ot},uE:function(){return on},u_:function(){return $r},up:function(){return Tt},vl:function(){return ve},vs:function(){return i.vs},w5:function(){return v},wF:function(){return de},wg:function(){return qt},wy:function(){return Qe},xv:function(){return Dt},yX:function(){return xr},zw:function(){return i.zw}});var r=n(262),i=n(577);new Set;new Map;let o,s=[],a=!1;function c(e,t){var n,r;if(o=e,o)o.enabled=!0,s.forEach((({event:e,args:t})=>o.emit(e,...t))),s=[];else if("undefined"!==typeof window&&window.HTMLElement&&!(null===(r=null===(n=window.navigator)||void 0===n?void 0:n.userAgent)||void 0===r?void 0:r.includes("jsdom"))){const e=t.__VUE_DEVTOOLS_HOOK_REPLAY__=t.__VUE_DEVTOOLS_HOOK_REPLAY__||[];e.push((e=>{c(e,t)})),setTimeout((()=>{o||(t.__VUE_DEVTOOLS_HOOK_REPLAY__=null,a=!0,s=[])}),3e3)}else a=!0,s=[]}function u(e,t,...n){const r=e.vnode.props||i.kT;let o=n;const s=t.startsWith("update:"),a=s&&t.slice(7);if(a&&a in r){const e=`${"modelValue"===a?"model":a}Modifiers`,{number:t,trim:s}=r[e]||i.kT;s?o=n.map((e=>e.trim())):t&&(o=n.map(i.He))}let c;let u=r[c=(0,i.hR)(t)]||r[c=(0,i.hR)((0,i._A)(t))];!u&&s&&(u=r[c=(0,i.hR)((0,i.rs)(t))]),u&&er(u,e,6,o);const l=r[c+"Once"];if(l){if(e.emitted){if(e.emitted[c])return}else e.emitted={};e.emitted[c]=!0,er(l,e,6,o)}}function l(e,t,n=!1){const r=t.emitsCache,o=r.get(e);if(void 0!==o)return o;const s=e.emits;let a={},c=!1;if(!(0,i.mf)(e)){const r=e=>{const n=l(e,t,!0);n&&(c=!0,(0,i.l7)(a,n))};!n&&t.mixins.length&&t.mixins.forEach(r),e.extends&&r(e.extends),e.mixins&&e.mixins.forEach(r)}return s||c?((0,i.kJ)(s)?s.forEach((e=>a[e]=null)):(0,i.l7)(a,s),r.set(e,a),a):(r.set(e,null),null)}function h(e,t){return!(!e||!(0,i.F7)(t))&&(t=t.slice(2).replace(/Once$/,""),(0,i.RI)(e,t[0].toLowerCase()+t.slice(1))||(0,i.RI)(e,(0,i.rs)(t))||(0,i.RI)(e,t))}let d=null,f=null;function p(e){const t=d;return d=e,f=e&&e.type.__scopeId||null,t}function g(e){f=e}function m(){f=null}const _=e=>v;function v(e,t=d,n){if(!t)return e;if(e._n)return e;const r=(...n)=>{r._d&&Ht(-1);const i=p(t),o=e(...n);return p(i),r._d&&Ht(1),o};return r._n=!0,r._c=!0,r._d=!0,r}function y(e){const{type:t,vnode:n,proxy:r,withProxy:o,props:s,propsOptions:[a],slots:c,attrs:u,emit:l,render:h,renderCache:d,data:f,setupState:g,ctx:m,inheritAttrs:_}=e;let v,y;const w=p(e);try{if(4&n.shapeFlag){const e=o||r;v=an(h.call(e,e,d,s,g,f,m)),y=u}else{const e=t;0,v=an(e.length>1?e(s,{attrs:u,slots:c,emit:l}):e(s,null)),y=t.props?u:b(u)}}catch(E){Lt.length=0,tr(E,e,1),v=Zt(Ot)}let k=v;if(y&&!1!==_){const e=Object.keys(y),{shapeFlag:t}=k;e.length&&7&t&&(a&&e.some(i.tR)&&(y=C(y,a)),k=nn(k,y))}return n.dirs&&(k.dirs=k.dirs?k.dirs.concat(n.dirs):n.dirs),n.transition&&(k.transition=n.transition),v=k,p(w),v}function w(e){let t;for(let n=0;n<e.length;n++){const r=e[n];if(!Kt(r))return;if(r.type!==Ot||"v-if"===r.children){if(t)return;t=r}}return t}const b=e=>{let t;for(const n in e)("class"===n||"style"===n||(0,i.F7)(n))&&((t||(t={}))[n]=e[n]);return t},C=(e,t)=>{const n={};for(const r in e)(0,i.tR)(r)&&r.slice(9)in t||(n[r]=e[r]);return n};function k(e,t,n){const{props:r,children:i,component:o}=e,{props:s,children:a,patchFlag:c}=t,u=o.emitsOptions;if(t.dirs||t.transition)return!0;if(!(n&&c>=0))return!(!i&&!a||a&&a.$stable)||r!==s&&(r?!s||E(r,s,u):!!s);if(1024&c)return!0;if(16&c)return r?E(r,s,u):!!s;if(8&c){const e=t.dynamicProps;for(let t=0;t<e.length;t++){const n=e[t];if(s[n]!==r[n]&&!h(u,n))return!0}}return!1}function E(e,t,n){const r=Object.keys(t);if(r.length!==Object.keys(e).length)return!0;for(let i=0;i<r.length;i++){const o=r[i];if(t[o]!==e[o]&&!h(n,o))return!0}return!1}function I({vnode:e,parent:t},n){while(t&&t.subTree===e)(e=t.vnode).el=n,t=t.parent}const T=e=>e.__isSuspense,S={name:"Suspense",__isSuspense:!0,process(e,t,n,r,i,o,s,a,c,u){null==e?x(t,n,r,i,o,s,a,c,u):R(e,t,n,r,i,s,a,c,u)},hydrate:D,create:A,normalize:O},P=S;function N(e,t){const n=e.props&&e.props[t];(0,i.mf)(n)&&n()}function x(e,t,n,r,i,o,s,a,c){const{p:u,o:{createElement:l}}=c,h=l("div"),d=e.suspense=A(e,i,r,t,h,n,o,s,a,c);u(null,d.pendingBranch=e.ssContent,h,null,r,d,o,s),d.deps>0?(N(e,"onPending"),N(e,"onFallback"),u(null,e.ssFallback,t,n,r,null,o,s),F(d,e.ssFallback)):d.resolve()}function R(e,t,n,r,i,o,s,a,{p:c,um:u,o:{createElement:l}}){const h=t.suspense=e.suspense;h.vnode=t,t.el=e.el;const d=t.ssContent,f=t.ssFallback,{activeBranch:p,pendingBranch:g,isInFallback:m,isHydrating:_}=h;if(g)h.pendingBranch=d,zt(d,g)?(c(g,d,h.hiddenContainer,null,i,h,o,s,a),h.deps<=0?h.resolve():m&&(c(p,f,n,r,i,null,o,s,a),F(h,f))):(h.pendingId++,_?(h.isHydrating=!1,h.activeBranch=g):u(g,i,h),h.deps=0,h.effects.length=0,h.hiddenContainer=l("div"),m?(c(null,d,h.hiddenContainer,null,i,h,o,s,a),h.deps<=0?h.resolve():(c(p,f,n,r,i,null,o,s,a),F(h,f))):p&&zt(d,p)?(c(p,d,n,r,i,h,o,s,a),h.resolve(!0)):(c(null,d,h.hiddenContainer,null,i,h,o,s,a),h.deps<=0&&h.resolve()));else if(p&&zt(d,p))c(p,d,n,r,i,h,o,s,a),F(h,d);else if(N(t,"onPending"),h.pendingBranch=d,h.pendingId++,c(null,d,h.hiddenContainer,null,i,h,o,s,a),h.deps<=0)h.resolve();else{const{timeout:e,pendingId:t}=h;e>0?setTimeout((()=>{h.pendingId===t&&h.fallback(f)}),e):0===e&&h.fallback(f)}}function A(e,t,n,r,o,s,a,c,u,l,h=!1){const{p:d,m:f,um:p,n:g,o:{parentNode:m,remove:_}}=l,v=(0,i.He)(e.props&&e.props.timeout),y={vnode:e,parent:t,parentComponent:n,isSVG:a,container:r,hiddenContainer:o,anchor:s,deps:0,pendingId:0,timeout:"number"===typeof v?v:-1,activeBranch:null,pendingBranch:null,isInFallback:!0,isHydrating:h,isUnmounted:!1,effects:[],resolve(e=!1){const{vnode:t,activeBranch:n,pendingBranch:r,pendingId:i,effects:o,parentComponent:s,container:a}=y;if(y.isHydrating)y.isHydrating=!1;else if(!e){const e=n&&r.transition&&"out-in"===r.transition.mode;e&&(n.transition.afterLeave=()=>{i===y.pendingId&&f(r,a,t,0)});let{anchor:t}=y;n&&(t=g(n),p(n,s,y,!0)),e||f(r,a,t,0)}F(y,r),y.pendingBranch=null,y.isInFallback=!1;let c=y.parent,u=!1;while(c){if(c.pendingBranch){c.effects.push(...o),u=!0;break}c=c.parent}u||kr(o),y.effects=[],N(t,"onResolve")},fallback(e){if(!y.pendingBranch)return;const{vnode:t,activeBranch:n,parentComponent:r,container:i,isSVG:o}=y;N(t,"onFallback");const s=g(n),a=()=>{y.isInFallback&&(d(null,e,i,s,r,null,o,c,u),F(y,e))},l=e.transition&&"out-in"===e.transition.mode;l&&(n.transition.afterLeave=a),y.isInFallback=!0,p(n,r,null,!0),l||a()},move(e,t,n){y.activeBranch&&f(y.activeBranch,e,t,n),y.container=e},next(){return y.activeBranch&&g(y.activeBranch)},registerDep(e,t){const n=!!y.pendingBranch;n&&y.deps++;const r=e.vnode.el;e.asyncDep.catch((t=>{tr(t,e,0)})).then((i=>{if(e.isUnmounted||y.isUnmounted||y.pendingId!==e.suspenseId)return;e.asyncResolved=!0;const{vnode:o}=e;On(e,i,!1),r&&(o.el=r);const s=!r&&e.subTree.el;t(e,o,m(r||e.subTree.el),r?null:g(e.subTree),y,a,u),s&&_(s),I(e,o.el),n&&0===--y.deps&&y.resolve()}))},unmount(e,t){y.isUnmounted=!0,y.activeBranch&&p(y.activeBranch,n,e,t),y.pendingBranch&&p(y.pendingBranch,n,e,t)}};return y}function D(e,t,n,r,i,o,s,a,c){const u=t.suspense=A(t,r,n,e.parentNode,document.createElement("div"),null,i,o,s,a,!0),l=c(e,u.pendingBranch=t.ssContent,n,u,o,s);return 0===u.deps&&u.resolve(),l}function O(e){const{shapeFlag:t,children:n}=e,r=32&t;e.ssContent=M(r?n.default:n),e.ssFallback=r?M(n.fallback):Zt(Ot)}function M(e){let t;if((0,i.mf)(e)){const n=Ut&&e._c;n&&(e._d=!1,qt()),e=e(),n&&(e._d=!0,t=Ft,Bt())}if((0,i.kJ)(e)){const t=w(e);0,e=t}return e=an(e),t&&!e.dynamicChildren&&(e.dynamicChildren=t.filter((t=>t!==e))),e}function L(e,t){t&&t.pendingBranch?(0,i.kJ)(e)?t.effects.push(...e):t.effects.push(e):kr(e)}function F(e,t){e.activeBranch=t;const{vnode:n,parentComponent:r}=e,i=n.el=t.el;r&&r.subTree===n&&(r.vnode.el=i,I(r,i))}function q(e,t){if(En){let n=En.provides;const r=En.parent&&En.parent.provides;r===n&&(n=En.provides=Object.create(r)),n[e]=t}else 0}function B(e,t,n=!1){const r=En||d;if(r){const o=null==r.parent?r.vnode.appContext&&r.vnode.appContext.provides:r.parent.provides;if(o&&e in o)return o[e];if(arguments.length>1)return n&&(0,i.mf)(t)?t.call(r.proxy):t}else 0}function j(){const e={isMounted:!1,isLeaving:!1,isUnmounting:!1,leavingVNodes:new Map};return fe((()=>{e.isMounted=!0})),me((()=>{e.isUnmounting=!0})),e}const U=[Function,Array],H={name:"BaseTransition",props:{mode:String,appear:Boolean,persisted:Boolean,onBeforeEnter:U,onEnter:U,onAfterEnter:U,onEnterCancelled:U,onBeforeLeave:U,onLeave:U,onAfterLeave:U,onLeaveCancelled:U,onBeforeAppear:U,onAppear:U,onAfterAppear:U,onAppearCancelled:U},setup(e,{slots:t}){const n=In(),i=j();let o;return()=>{const s=t.default&&Y(t.default(),!0);if(!s||!s.length)return;const a=(0,r.IU)(e),{mode:c}=a;const u=s[0];if(i.isLeaving)return K(u);const l=z(u);if(!l)return K(u);const h=V(l,a,i,n);G(l,h);const d=n.subTree,f=d&&z(d);let p=!1;const{getTransitionKey:g}=l.type;if(g){const e=g();void 0===o?o=e:e!==o&&(o=e,p=!0)}if(f&&f.type!==Ot&&(!zt(l,f)||p)){const e=V(f,a,i,n);if(G(f,e),"out-in"===c)return i.isLeaving=!0,e.afterLeave=()=>{i.isLeaving=!1,n.update()},K(u);"in-out"===c&&l.type!==Ot&&(e.delayLeave=(e,t,n)=>{const r=$(i,f);r[String(f.key)]=f,e._leaveCb=()=>{t(),e._leaveCb=void 0,delete h.delayedLeave},h.delayedLeave=n})}return u}}},W=H;function $(e,t){const{leavingVNodes:n}=e;let r=n.get(t.type);return r||(r=Object.create(null),n.set(t.type,r)),r}function V(e,t,n,r){const{appear:i,mode:o,persisted:s=!1,onBeforeEnter:a,onEnter:c,onAfterEnter:u,onEnterCancelled:l,onBeforeLeave:h,onLeave:d,onAfterLeave:f,onLeaveCancelled:p,onBeforeAppear:g,onAppear:m,onAfterAppear:_,onAppearCancelled:v}=t,y=String(e.key),w=$(n,e),b=(e,t)=>{e&&er(e,r,9,t)},C={mode:o,persisted:s,beforeEnter(t){let r=a;if(!n.isMounted){if(!i)return;r=g||a}t._leaveCb&&t._leaveCb(!0);const o=w[y];o&&zt(e,o)&&o.el._leaveCb&&o.el._leaveCb(),b(r,[t])},enter(e){let t=c,r=u,o=l;if(!n.isMounted){if(!i)return;t=m||c,r=_||u,o=v||l}let s=!1;const a=e._enterCb=t=>{s||(s=!0,b(t?o:r,[e]),C.delayedLeave&&C.delayedLeave(),e._enterCb=void 0)};t?(t(e,a),t.length<=1&&a()):a()},leave(t,r){const i=String(e.key);if(t._enterCb&&t._enterCb(!0),n.isUnmounting)return r();b(h,[t]);let o=!1;const s=t._leaveCb=n=>{o||(o=!0,r(),b(n?p:f,[t]),t._leaveCb=void 0,w[i]===e&&delete w[i])};w[i]=e,d?(d(t,s),d.length<=1&&s()):s()},clone(e){return V(e,t,n,r)}};return C}function K(e){if(ee(e))return e=nn(e),e.children=null,e}function z(e){return ee(e)?e.children?e.children[0]:void 0:e}function G(e,t){6&e.shapeFlag&&e.component?G(e.component.subTree,t):128&e.shapeFlag?(e.ssContent.transition=t.clone(e.ssContent),e.ssFallback.transition=t.clone(e.ssFallback)):e.transition=t}function Y(e,t=!1){let n=[],r=0;for(let i=0;i<e.length;i++){const o=e[i];o.type===At?(128&o.patchFlag&&r++,n=n.concat(Y(o.children,t))):(t||o.type!==Ot)&&n.push(o)}if(r>1)for(let i=0;i<n.length;i++)n[i].patchFlag=-2;return n}function J(e){return(0,i.mf)(e)?{setup:e,name:e.name}:e}const X=e=>!!e.type.__asyncLoader;function Q(e){(0,i.mf)(e)&&(e={loader:e});const{loader:t,loadingComponent:n,errorComponent:o,delay:s=200,timeout:a,suspensible:c=!0,onError:u}=e;let l,h=null,d=0;const f=()=>(d++,h=null,p()),p=()=>{let e;return h||(e=h=t().catch((e=>{if(e=e instanceof Error?e:new Error(String(e)),u)return new Promise(((t,n)=>{const r=()=>t(f()),i=()=>n(e);u(e,r,i,d+1)}));throw e})).then((t=>e!==h&&h?h:(t&&(t.__esModule||"Module"===t[Symbol.toStringTag])&&(t=t.default),l=t,t))))};return J({name:"AsyncComponentWrapper",__asyncLoader:p,get __asyncResolved(){return l},setup(){const e=En;if(l)return()=>Z(l,e);const t=t=>{h=null,tr(t,e,13,!o)};if(c&&e.suspense||Rn)return p().then((t=>()=>Z(t,e))).catch((e=>(t(e),()=>o?Zt(o,{error:e}):null)));const i=(0,r.iH)(!1),u=(0,r.iH)(),d=(0,r.iH)(!!s);return s&&setTimeout((()=>{d.value=!1}),s),null!=a&&setTimeout((()=>{if(!i.value&&!u.value){const e=new Error(`Async component timed out after ${a}ms.`);t(e),u.value=e}}),a),p().then((()=>{i.value=!0,e.parent&&ee(e.parent.vnode)&&vr(e.parent.update)})).catch((e=>{t(e),u.value=e})),()=>i.value&&l?Z(l,e):u.value&&o?Zt(o,{error:u.value}):n&&!d.value?Zt(n):void 0}})}function Z(e,{vnode:{ref:t,props:n,children:r}}){const i=Zt(e,n,r);return i.ref=t,i}const ee=e=>e.type.__isKeepAlive,te={name:"KeepAlive",__isKeepAlive:!0,props:{include:[String,RegExp,Array],exclude:[String,RegExp,Array],max:[String,Number]},setup(e,{slots:t}){const n=In(),r=n.ctx;if(!r.renderer)return t.default;const o=new Map,s=new Set;let a=null;const c=n.suspense,{renderer:{p:u,m:l,um:h,o:{createElement:d}}}=r,f=d("div");function p(e){ce(e),h(e,n,c)}function g(e){o.forEach(((t,n)=>{const r=Wn(t.type);!r||e&&e(r)||m(n)}))}function m(e){const t=o.get(e);a&&t.type===a.type?a&&ce(a):p(t),o.delete(e),s.delete(e)}r.activate=(e,t,n,r,o)=>{const s=e.component;l(e,t,n,0,c),u(s.vnode,e,t,n,s,c,r,e.slotScopeIds,o),ut((()=>{s.isDeactivated=!1,s.a&&(0,i.ir)(s.a);const t=e.props&&e.props.onVnodeMounted;t&&hn(t,s.parent,e)}),c)},r.deactivate=e=>{const t=e.component;l(e,f,null,1,c),ut((()=>{t.da&&(0,i.ir)(t.da);const n=e.props&&e.props.onVnodeUnmounted;n&&hn(n,t.parent,e),t.isDeactivated=!0}),c)},Ar((()=>[e.include,e.exclude]),(([e,t])=>{e&&g((t=>re(e,t))),t&&g((e=>!re(t,e)))}),{flush:"post",deep:!0});let _=null;const v=()=>{null!=_&&o.set(_,ue(n.subTree))};return fe(v),ge(v),me((()=>{o.forEach((e=>{const{subTree:t,suspense:r}=n,i=ue(t);if(e.type!==i.type)p(e);else{ce(i);const e=i.component.da;e&&ut(e,r)}}))})),()=>{if(_=null,!t.default)return null;const n=t.default(),r=n[0];if(n.length>1)return a=null,n;if(!Kt(r)||!(4&r.shapeFlag)&&!(128&r.shapeFlag))return a=null,r;let i=ue(r);const c=i.type,u=Wn(X(i)?i.type.__asyncResolved||{}:c),{include:l,exclude:h,max:d}=e;if(l&&(!u||!re(l,u))||h&&u&&re(h,u))return a=i,r;const f=null==i.key?c:i.key,p=o.get(f);return i.el&&(i=nn(i),128&r.shapeFlag&&(r.ssContent=i)),_=f,p?(i.el=p.el,i.component=p.component,i.transition&&G(i,i.transition),i.shapeFlag|=512,s.delete(f),s.add(f)):(s.add(f),d&&s.size>parseInt(d,10)&&m(s.values().next().value)),i.shapeFlag|=256,a=i,r}}},ne=te;function re(e,t){return(0,i.kJ)(e)?e.some((e=>re(e,t))):(0,i.HD)(e)?e.split(",").indexOf(t)>-1:!!e.test&&e.test(t)}function ie(e,t){se(e,"a",t)}function oe(e,t){se(e,"da",t)}function se(e,t,n=En){const r=e.__wdc||(e.__wdc=()=>{let t=n;while(t){if(t.isDeactivated)return;t=t.parent}return e()});if(le(t,r,n),n){let e=n.parent;while(e&&e.parent)ee(e.parent.vnode)&&ae(r,t,n,e),e=e.parent}}function ae(e,t,n,r){const o=le(t,e,r,!0);_e((()=>{(0,i.Od)(r[t],o)}),n)}function ce(e){let t=e.shapeFlag;256&t&&(t-=256),512&t&&(t-=512),e.shapeFlag=t}function ue(e){return 128&e.shapeFlag?e.ssContent:e}function le(e,t,n=En,i=!1){if(n){const o=n[e]||(n[e]=[]),s=t.__weh||(t.__weh=(...i)=>{if(n.isUnmounted)return;(0,r.Jd)(),Tn(n);const o=er(t,n,e,i);return Sn(),(0,r.lk)(),o});return i?o.unshift(s):o.push(s),s}}const he=e=>(t,n=En)=>(!Rn||"sp"===e)&&le(e,t,n),de=he("bm"),fe=he("m"),pe=he("bu"),ge=he("u"),me=he("bum"),_e=he("um"),ve=he("sp"),ye=he("rtg"),we=he("rtc");function be(e,t=En){le("ec",e,t)}let Ce=!0;function ke(e){const t=Se(e),n=e.proxy,o=e.ctx;Ce=!1,t.beforeCreate&&Ie(t.beforeCreate,e,"bc");const{data:s,computed:a,methods:c,watch:u,provide:l,inject:h,created:d,beforeMount:f,mounted:p,beforeUpdate:g,updated:m,activated:_,deactivated:v,beforeDestroy:y,beforeUnmount:w,destroyed:b,unmounted:C,render:k,renderTracked:E,renderTriggered:I,errorCaptured:T,serverPrefetch:S,expose:P,inheritAttrs:N,components:x,directives:R,filters:A}=t,D=null;if(h&&Ee(h,o,D,e.appContext.config.unwrapInjectedRef),c)for(const r in c){const e=c[r];(0,i.mf)(e)&&(o[r]=e.bind(n))}if(s){0;const t=s.call(n,n);0,(0,i.Kn)(t)&&(e.data=(0,r.qj)(t))}if(Ce=!0,a)for(const M in a){const e=a[M],t=(0,i.mf)(e)?e.bind(n,n):(0,i.mf)(e.get)?e.get.bind(n,n):i.dG;0;const s=!(0,i.mf)(e)&&(0,i.mf)(e.set)?e.set.bind(n):i.dG,c=(0,r.Fl)({get:t,set:s});Object.defineProperty(o,M,{enumerable:!0,configurable:!0,get:()=>c.value,set:e=>c.value=e})}if(u)for(const r in u)Te(u[r],o,n,r);if(l){const e=(0,i.mf)(l)?l.call(n):l;Reflect.ownKeys(e).forEach((t=>{q(t,e[t])}))}function O(e,t){(0,i.kJ)(t)?t.forEach((t=>e(t.bind(n)))):t&&e(t.bind(n))}if(d&&Ie(d,e,"c"),O(de,f),O(fe,p),O(pe,g),O(ge,m),O(ie,_),O(oe,v),O(be,T),O(we,E),O(ye,I),O(me,w),O(_e,C),O(ve,S),(0,i.kJ)(P))if(P.length){const t=e.exposed||(e.exposed={});P.forEach((e=>{Object.defineProperty(t,e,{get:()=>n[e],set:t=>n[e]=t})}))}else e.exposed||(e.exposed={});k&&e.render===i.dG&&(e.render=k),null!=N&&(e.inheritAttrs=N),x&&(e.components=x),R&&(e.directives=R)}function Ee(e,t,n=i.dG,o=!1){(0,i.kJ)(e)&&(e=Ae(e));for(const s in e){const n=e[s];let a;a=(0,i.Kn)(n)?"default"in n?B(n.from||s,n.default,!0):B(n.from||s):B(n),(0,r.dq)(a)&&o?Object.defineProperty(t,s,{enumerable:!0,configurable:!0,get:()=>a.value,set:e=>a.value=e}):t[s]=a}}function Ie(e,t,n){er((0,i.kJ)(e)?e.map((e=>e.bind(t.proxy))):e.bind(t.proxy),t,n)}function Te(e,t,n,r){const o=r.includes(".")?Mr(n,r):()=>n[r];if((0,i.HD)(e)){const n=t[e];(0,i.mf)(n)&&Ar(o,n)}else if((0,i.mf)(e))Ar(o,e.bind(n));else if((0,i.Kn)(e))if((0,i.kJ)(e))e.forEach((e=>Te(e,t,n,r)));else{const r=(0,i.mf)(e.handler)?e.handler.bind(n):t[e.handler];(0,i.mf)(r)&&Ar(o,r,e)}else 0}function Se(e){const t=e.type,{mixins:n,extends:r}=t,{mixins:i,optionsCache:o,config:{optionMergeStrategies:s}}=e.appContext,a=o.get(t);let c;return a?c=a:i.length||n||r?(c={},i.length&&i.forEach((e=>Pe(c,e,s,!0))),Pe(c,t,s)):c=t,o.set(t,c),c}function Pe(e,t,n,r=!1){const{mixins:i,extends:o}=t;o&&Pe(e,o,n,!0),i&&i.forEach((t=>Pe(e,t,n,!0)));for(const s in t)if(r&&"expose"===s);else{const r=Ne[s]||n&&n[s];e[s]=r?r(e[s],t[s]):t[s]}return e}const Ne={data:xe,props:Oe,emits:Oe,methods:Oe,computed:Oe,beforeCreate:De,created:De,beforeMount:De,mounted:De,beforeUpdate:De,updated:De,beforeDestroy:De,beforeUnmount:De,destroyed:De,unmounted:De,activated:De,deactivated:De,errorCaptured:De,serverPrefetch:De,components:Oe,directives:Oe,watch:Me,provide:xe,inject:Re};function xe(e,t){return t?e?function(){return(0,i.l7)((0,i.mf)(e)?e.call(this,this):e,(0,i.mf)(t)?t.call(this,this):t)}:t:e}function Re(e,t){return Oe(Ae(e),Ae(t))}function Ae(e){if((0,i.kJ)(e)){const t={};for(let n=0;n<e.length;n++)t[e[n]]=e[n];return t}return e}function De(e,t){return e?[...new Set([].concat(e,t))]:t}function Oe(e,t){return e?(0,i.l7)((0,i.l7)(Object.create(null),e),t):t}function Me(e,t){if(!e)return t;if(!t)return e;const n=(0,i.l7)(Object.create(null),e);for(const r in t)n[r]=De(e[r],t[r]);return n}function Le(e,t,n,o=!1){const s={},a={};(0,i.Nj)(a,Yt,1),e.propsDefaults=Object.create(null),qe(e,t,s,a);for(const r in e.propsOptions[0])r in s||(s[r]=void 0);n?e.props=o?s:(0,r.Um)(s):e.type.props?e.props=s:e.props=a,e.attrs=a}function Fe(e,t,n,o){const{props:s,attrs:a,vnode:{patchFlag:c}}=e,u=(0,r.IU)(s),[l]=e.propsOptions;let h=!1;if(!(o||c>0)||16&c){let r;qe(e,t,s,a)&&(h=!0);for(const o in u)t&&((0,i.RI)(t,o)||(r=(0,i.rs)(o))!==o&&(0,i.RI)(t,r))||(l?!n||void 0===n[o]&&void 0===n[r]||(s[o]=Be(l,u,o,void 0,e,!0)):delete s[o]);if(a!==u)for(const e in a)t&&(0,i.RI)(t,e)||(delete a[e],h=!0)}else if(8&c){const n=e.vnode.dynamicProps;for(let r=0;r<n.length;r++){let o=n[r];const c=t[o];if(l)if((0,i.RI)(a,o))c!==a[o]&&(a[o]=c,h=!0);else{const t=(0,i._A)(o);s[t]=Be(l,u,t,c,e,!1)}else c!==a[o]&&(a[o]=c,h=!0)}}h&&(0,r.X$)(e,"set","$attrs")}function qe(e,t,n,o){const[s,a]=e.propsOptions;let c,u=!1;if(t)for(let r in t){if((0,i.Gg)(r))continue;const l=t[r];let d;s&&(0,i.RI)(s,d=(0,i._A)(r))?a&&a.includes(d)?(c||(c={}))[d]=l:n[d]=l:h(e.emitsOptions,r)||r in o&&l===o[r]||(o[r]=l,u=!0)}if(a){const t=(0,r.IU)(n),o=c||i.kT;for(let r=0;r<a.length;r++){const c=a[r];n[c]=Be(s,t,c,o[c],e,!(0,i.RI)(o,c))}}return u}function Be(e,t,n,r,o,s){const a=e[n];if(null!=a){const e=(0,i.RI)(a,"default");if(e&&void 0===r){const e=a.default;if(a.type!==Function&&(0,i.mf)(e)){const{propsDefaults:i}=o;n in i?r=i[n]:(Tn(o),r=i[n]=e.call(null,t),Sn())}else r=e}a[0]&&(s&&!e?r=!1:!a[1]||""!==r&&r!==(0,i.rs)(n)||(r=!0))}return r}function je(e,t,n=!1){const r=t.propsCache,o=r.get(e);if(o)return o;const s=e.props,a={},c=[];let u=!1;if(!(0,i.mf)(e)){const r=e=>{u=!0;const[n,r]=je(e,t,!0);(0,i.l7)(a,n),r&&c.push(...r)};!n&&t.mixins.length&&t.mixins.forEach(r),e.extends&&r(e.extends),e.mixins&&e.mixins.forEach(r)}if(!s&&!u)return r.set(e,i.Z6),i.Z6;if((0,i.kJ)(s))for(let h=0;h<s.length;h++){0;const e=(0,i._A)(s[h]);Ue(e)&&(a[e]=i.kT)}else if(s){0;for(const e in s){const t=(0,i._A)(e);if(Ue(t)){const n=s[e],r=a[t]=(0,i.kJ)(n)||(0,i.mf)(n)?{type:n}:n;if(r){const e=$e(Boolean,r.type),n=$e(String,r.type);r[0]=e>-1,r[1]=n<0||e<n,(e>-1||(0,i.RI)(r,"default"))&&c.push(t)}}}}const l=[a,c];return r.set(e,l),l}function Ue(e){return"$"!==e[0]}function He(e){const t=e&&e.toString().match(/^\s*function (\w+)/);return t?t[1]:null===e?"null":""}function We(e,t){return He(e)===He(t)}function $e(e,t){return(0,i.kJ)(t)?t.findIndex((t=>We(t,e))):(0,i.mf)(t)&&We(t,e)?0:-1}const Ve=e=>"_"===e[0]||"$stable"===e,Ke=e=>(0,i.kJ)(e)?e.map(an):[an(e)],ze=(e,t,n)=>{const r=v(((...e)=>Ke(t(...e))),n);return r._c=!1,r},Ge=(e,t,n)=>{const r=e._ctx;for(const o in e){if(Ve(o))continue;const n=e[o];if((0,i.mf)(n))t[o]=ze(o,n,r);else if(null!=n){0;const e=Ke(n);t[o]=()=>e}}},Ye=(e,t)=>{const n=Ke(t);e.slots.default=()=>n},Je=(e,t)=>{if(32&e.vnode.shapeFlag){const n=t._;n?(e.slots=(0,r.IU)(t),(0,i.Nj)(t,"_",n)):Ge(t,e.slots={})}else e.slots={},t&&Ye(e,t);(0,i.Nj)(e.slots,Yt,1)},Xe=(e,t,n)=>{const{vnode:r,slots:o}=e;let s=!0,a=i.kT;if(32&r.shapeFlag){const e=t._;e?n&&1===e?s=!1:((0,i.l7)(o,t),n||1!==e||delete o._):(s=!t.$stable,Ge(t,o)),a=t}else t&&(Ye(e,t),a={default:1});if(s)for(const i in o)Ve(i)||i in a||delete o[i]};function Qe(e,t){const n=d;if(null===n)return e;const r=n.proxy,o=e.dirs||(e.dirs=[]);for(let s=0;s<t.length;s++){let[e,n,a,c=i.kT]=t[s];(0,i.mf)(e)&&(e={mounted:e,updated:e}),e.deep&&Lr(n),o.push({dir:e,instance:r,value:n,oldValue:void 0,arg:a,modifiers:c})}return e}function Ze(e,t,n,i){const o=e.dirs,s=t&&t.dirs;for(let a=0;a<o.length;a++){const c=o[a];s&&(c.oldValue=s[a].value);let u=c.dir[i];u&&((0,r.Jd)(),er(u,n,8,[e.el,c,e,t]),(0,r.lk)())}}function et(){return{app:null,config:{isNativeTag:i.NO,performance:!1,globalProperties:{},optionMergeStrategies:{},errorHandler:void 0,warnHandler:void 0,compilerOptions:{}},mixins:[],components:{},directives:{},provides:Object.create(null),optionsCache:new WeakMap,propsCache:new WeakMap,emitsCache:new WeakMap}}let tt=0;function nt(e,t){return function(n,r=null){null==r||(0,i.Kn)(r)||(r=null);const o=et(),s=new Set;let a=!1;const c=o.app={_uid:tt++,_component:n,_props:r,_container:null,_context:o,_instance:null,version:Zr,get config(){return o.config},set config(e){0},use(e,...t){return s.has(e)||(e&&(0,i.mf)(e.install)?(s.add(e),e.install(c,...t)):(0,i.mf)(e)&&(s.add(e),e(c,...t))),c},mixin(e){return o.mixins.includes(e)||o.mixins.push(e),c},component(e,t){return t?(o.components[e]=t,c):o.components[e]},directive(e,t){return t?(o.directives[e]=t,c):o.directives[e]},mount(i,s,u){if(!a){const l=Zt(n,r);return l.appContext=o,s&&t?t(l,i):e(l,i,u),a=!0,c._container=i,i.__vue_app__=c,jn(l.component)||l.component.proxy}},unmount(){a&&(e(null,c._container),delete c._container.__vue_app__)},provide(e,t){return o.provides[e]=t,c}};return c}}function rt(e,t,n,o,s=!1){if((0,i.kJ)(e))return void e.forEach(((e,r)=>rt(e,t&&((0,i.kJ)(t)?t[r]:t),n,o,s)));if(X(o)&&!s)return;const a=4&o.shapeFlag?jn(o.component)||o.component.proxy:o.el,c=s?null:a,{i:u,r:l}=e;const h=t&&t.r,d=u.refs===i.kT?u.refs={}:u.refs,f=u.setupState;if(null!=h&&h!==l&&((0,i.HD)(h)?(d[h]=null,(0,i.RI)(f,h)&&(f[h]=null)):(0,r.dq)(h)&&(h.value=null)),(0,i.mf)(l))Zn(l,u,12,[c,d]);else{const t=(0,i.HD)(l),o=(0,r.dq)(l);if(t||o){const o=()=>{if(e.f){const n=t?d[l]:l.value;s?(0,i.kJ)(n)&&(0,i.Od)(n,a):(0,i.kJ)(n)?n.includes(a)||n.push(a):t?d[l]=[a]:(l.value=[a],e.k&&(d[e.k]=l.value))}else t?(d[l]=c,(0,i.RI)(f,l)&&(f[l]=c)):(0,r.dq)(l)&&(l.value=c,e.k&&(d[e.k]=c))};c?(o.id=-1,ut(o,n)):o()}else 0}}let it=!1;const ot=e=>/svg/.test(e.namespaceURI)&&"foreignObject"!==e.tagName,st=e=>8===e.nodeType;function at(e){const{mt:t,p:n,o:{patchProp:r,nextSibling:o,parentNode:s,remove:a,insert:c,createComment:u}}=e,l=(e,t)=>{if(!t.hasChildNodes())return n(null,e,t),void Ir();it=!1,h(t.firstChild,e,null,null,null),Ir(),it&&console.error("Hydration completed but contains mismatches.")},h=(n,r,i,a,c,u=!1)=>{const l=st(n)&&"["===n.data,_=()=>g(n,r,i,a,c,l),{type:v,ref:y,shapeFlag:w}=r,b=n.nodeType;r.el=n;let C=null;switch(v){case Dt:3!==b?C=_():(n.data!==r.children&&(it=!0,n.data=r.children),C=o(n));break;case Ot:C=8!==b||l?_():o(n);break;case Mt:if(1===b){C=n;const e=!r.children.length;for(let t=0;t<r.staticCount;t++)e&&(r.children+=C.outerHTML),t===r.staticCount-1&&(r.anchor=C),C=o(C);return C}C=_();break;case At:C=l?p(n,r,i,a,c,u):_();break;default:if(1&w)C=1!==b||r.type.toLowerCase()!==n.tagName.toLowerCase()?_():d(n,r,i,a,c,u);else if(6&w){r.slotScopeIds=c;const e=s(n);if(t(r,e,null,i,a,ot(e),u),C=l?m(n):o(n),X(r)){let t;l?(t=Zt(At),t.anchor=C?C.previousSibling:e.lastChild):t=3===n.nodeType?rn(""):Zt("div"),t.el=n,r.component.subTree=t}}else 64&w?C=8!==b?_():r.type.hydrate(n,r,i,a,c,u,e,f):128&w&&(C=r.type.hydrate(n,r,i,a,ot(s(n)),c,u,e,h))}return null!=y&&rt(y,null,a,r),C},d=(e,t,n,o,s,c)=>{c=c||!!t.dynamicChildren;const{type:u,props:l,patchFlag:h,shapeFlag:d,dirs:p}=t,g="input"===u&&p||"option"===u;if(g||-1!==h){if(p&&Ze(t,null,n,"created"),l)if(g||!c||48&h)for(const t in l)(g&&t.endsWith("value")||(0,i.F7)(t)&&!(0,i.Gg)(t))&&r(e,t,null,l[t],!1,void 0,n);else l.onClick&&r(e,"onClick",null,l.onClick,!1,void 0,n);let u;if((u=l&&l.onVnodeBeforeMount)&&hn(u,n,t),p&&Ze(t,null,n,"beforeMount"),((u=l&&l.onVnodeMounted)||p)&&L((()=>{u&&hn(u,n,t),p&&Ze(t,null,n,"mounted")}),o),16&d&&(!l||!l.innerHTML&&!l.textContent)){let r=f(e.firstChild,t,e,n,o,s,c);while(r){it=!0;const e=r;r=r.nextSibling,a(e)}}else 8&d&&e.textContent!==t.children&&(it=!0,e.textContent=t.children)}return e.nextSibling},f=(e,t,r,i,o,s,a)=>{a=a||!!t.dynamicChildren;const c=t.children,u=c.length;for(let l=0;l<u;l++){const t=a?c[l]:c[l]=an(c[l]);if(e)e=h(e,t,i,o,s,a);else{if(t.type===Dt&&!t.children)continue;it=!0,n(null,t,r,null,i,o,ot(r),s)}}return e},p=(e,t,n,r,i,a)=>{const{slotScopeIds:l}=t;l&&(i=i?i.concat(l):l);const h=s(e),d=f(o(e),t,h,n,r,i,a);return d&&st(d)&&"]"===d.data?o(t.anchor=d):(it=!0,c(t.anchor=u("]"),h,d),d)},g=(e,t,r,i,c,u)=>{if(it=!0,t.el=null,u){const t=m(e);while(1){const n=o(e);if(!n||n===t)break;a(n)}}const l=o(e),h=s(e);return a(e),n(null,t,h,l,r,i,ot(h),c),l},m=e=>{let t=0;while(e)if(e=o(e),e&&st(e)&&("["===e.data&&t++,"]"===e.data)){if(0===t)return o(e);t--}return e};return[l,h]}function ct(){}const ut=L;function lt(e){return dt(e)}function ht(e){return dt(e,at)}function dt(e,t){ct();const n=(0,i.E9)();n.__VUE__=!0;const{insert:o,remove:s,patchProp:a,createElement:c,createText:u,createComment:l,setText:h,setElementText:d,parentNode:f,nextSibling:p,setScopeId:g=i.dG,cloneNode:m,insertStaticContent:_}=e,v=(e,t,n,r=null,i=null,o=null,s=!1,a=null,c=!!t.dynamicChildren)=>{if(e===t)return;e&&!zt(e,t)&&(r=Y(e),$(e,i,o,!0),e=null),-2===t.patchFlag&&(c=!1,t.dynamicChildren=null);const{type:u,ref:l,shapeFlag:h}=t;switch(u){case Dt:w(e,t,n,r);break;case Ot:b(e,t,n,r);break;case Mt:null==e&&C(t,n,r,s);break;case At:O(e,t,n,r,i,o,s,a,c);break;default:1&h?S(e,t,n,r,i,o,s,a,c):6&h?M(e,t,n,r,i,o,s,a,c):(64&h||128&h)&&u.process(e,t,n,r,i,o,s,a,c,Q)}null!=l&&i&&rt(l,e&&e.ref,o,t||e,!t)},w=(e,t,n,r)=>{if(null==e)o(t.el=u(t.children),n,r);else{const n=t.el=e.el;t.children!==e.children&&h(n,t.children)}},b=(e,t,n,r)=>{null==e?o(t.el=l(t.children||""),n,r):t.el=e.el},C=(e,t,n,r)=>{[e.el,e.anchor]=_(e.children,t,n,r)},E=({el:e,anchor:t},n,r)=>{let i;while(e&&e!==t)i=p(e),o(e,n,r),e=i;o(t,n,r)},T=({el:e,anchor:t})=>{let n;while(e&&e!==t)n=p(e),s(e),e=n;s(t)},S=(e,t,n,r,i,o,s,a,c)=>{s=s||"svg"===t.type,null==e?P(t,n,r,i,o,s,a,c):R(e,t,i,o,s,a,c)},P=(e,t,n,r,s,u,l,h)=>{let f,p;const{type:g,props:_,shapeFlag:v,transition:y,patchFlag:w,dirs:b}=e;if(e.el&&void 0!==m&&-1===w)f=e.el=m(e.el);else{if(f=e.el=c(e.type,u,_&&_.is,_),8&v?d(f,e.children):16&v&&x(e.children,f,null,r,s,u&&"foreignObject"!==g,l,h),b&&Ze(e,null,r,"created"),_){for(const t in _)"value"===t||(0,i.Gg)(t)||a(f,t,null,_[t],u,e.children,r,s,G);"value"in _&&a(f,"value",null,_.value),(p=_.onVnodeBeforeMount)&&hn(p,r,e)}N(f,e,e.scopeId,l,r)}b&&Ze(e,null,r,"beforeMount");const C=(!s||s&&!s.pendingBranch)&&y&&!y.persisted;C&&y.beforeEnter(f),o(f,t,n),((p=_&&_.onVnodeMounted)||C||b)&&ut((()=>{p&&hn(p,r,e),C&&y.enter(f),b&&Ze(e,null,r,"mounted")}),s)},N=(e,t,n,r,i)=>{if(n&&g(e,n),r)for(let o=0;o<r.length;o++)g(e,r[o]);if(i){let n=i.subTree;if(t===n){const t=i.vnode;N(e,t,t.scopeId,t.slotScopeIds,i.parent)}}},x=(e,t,n,r,i,o,s,a,c=0)=>{for(let u=c;u<e.length;u++){const c=e[u]=a?cn(e[u]):an(e[u]);v(null,c,t,n,r,i,o,s,a)}},R=(e,t,n,r,o,s,c)=>{const u=t.el=e.el;let{patchFlag:l,dynamicChildren:h,dirs:f}=t;l|=16&e.patchFlag;const p=e.props||i.kT,g=t.props||i.kT;let m;n&&ft(n,!1),(m=g.onVnodeBeforeUpdate)&&hn(m,n,t,e),f&&Ze(t,e,n,"beforeUpdate"),n&&ft(n,!0);const _=o&&"foreignObject"!==t.type;if(h?A(e.dynamicChildren,h,u,n,r,_,s):c||j(e,t,u,null,n,r,_,s,!1),l>0){if(16&l)D(u,t,p,g,n,r,o);else if(2&l&&p.class!==g.class&&a(u,"class",null,g.class,o),4&l&&a(u,"style",p.style,g.style,o),8&l){const i=t.dynamicProps;for(let t=0;t<i.length;t++){const s=i[t],c=p[s],l=g[s];l===c&&"value"!==s||a(u,s,c,l,o,e.children,n,r,G)}}1&l&&e.children!==t.children&&d(u,t.children)}else c||null!=h||D(u,t,p,g,n,r,o);((m=g.onVnodeUpdated)||f)&&ut((()=>{m&&hn(m,n,t,e),f&&Ze(t,e,n,"updated")}),r)},A=(e,t,n,r,i,o,s)=>{for(let a=0;a<t.length;a++){const c=e[a],u=t[a],l=c.el&&(c.type===At||!zt(c,u)||70&c.shapeFlag)?f(c.el):n;v(c,u,l,null,r,i,o,s,!0)}},D=(e,t,n,r,o,s,c)=>{if(n!==r){for(const u in r){if((0,i.Gg)(u))continue;const l=r[u],h=n[u];l!==h&&"value"!==u&&a(e,u,h,l,c,t.children,o,s,G)}if(n!==i.kT)for(const u in n)(0,i.Gg)(u)||u in r||a(e,u,n[u],null,c,t.children,o,s,G);"value"in r&&a(e,"value",n.value,r.value)}},O=(e,t,n,r,i,s,a,c,l)=>{const h=t.el=e?e.el:u(""),d=t.anchor=e?e.anchor:u("");let{patchFlag:f,dynamicChildren:p,slotScopeIds:g}=t;g&&(c=c?c.concat(g):g),null==e?(o(h,n,r),o(d,n,r),x(t.children,n,d,i,s,a,c,l)):f>0&&64&f&&p&&e.dynamicChildren?(A(e.dynamicChildren,p,n,i,s,a,c),(null!=t.key||i&&t===i.subTree)&&pt(e,t,!0)):j(e,t,n,d,i,s,a,c,l)},M=(e,t,n,r,i,o,s,a,c)=>{t.slotScopeIds=a,null==e?512&t.shapeFlag?i.ctx.activate(t,n,r,s,c):L(t,n,r,i,o,s,c):F(e,t,c)},L=(e,t,n,r,i,o,s)=>{const a=e.component=kn(e,r,i);if(ee(e)&&(a.ctx.renderer=Q),An(a),a.asyncDep){if(i&&i.registerDep(a,q),!e.el){const e=a.subTree=Zt(Ot);b(null,e,t,n)}}else q(a,e,t,n,i,o,s)},F=(e,t,n)=>{const r=t.component=e.component;if(k(e,t,n)){if(r.asyncDep&&!r.asyncResolved)return void B(r,t,n);r.next=t,wr(r.update),r.update()}else t.component=e.component,t.el=e.el,r.vnode=t},q=(e,t,n,o,s,a,c)=>{const u=()=>{if(e.isMounted){let t,{next:n,bu:r,u:o,parent:u,vnode:l}=e,h=n;0,ft(e,!1),n?(n.el=l.el,B(e,n,c)):n=l,r&&(0,i.ir)(r),(t=n.props&&n.props.onVnodeBeforeUpdate)&&hn(t,u,n,l),ft(e,!0);const d=y(e);0;const p=e.subTree;e.subTree=d,v(p,d,f(p.el),Y(p),e,s,a),n.el=d.el,null===h&&I(e,d.el),o&&ut(o,s),(t=n.props&&n.props.onVnodeUpdated)&&ut((()=>hn(t,u,n,l)),s)}else{let r;const{el:c,props:u}=t,{bm:l,m:h,parent:d}=e,f=X(t);if(ft(e,!1),l&&(0,i.ir)(l),!f&&(r=u&&u.onVnodeBeforeMount)&&hn(r,d,t),ft(e,!0),c&&te){const n=()=>{e.subTree=y(e),te(c,e.subTree,e,s,null)};f?t.type.__asyncLoader().then((()=>!e.isUnmounted&&n())):n()}else{0;const r=e.subTree=y(e);0,v(null,r,n,o,e,s,a),t.el=r.el}if(h&&ut(h,s),!f&&(r=u&&u.onVnodeMounted)){const e=t;ut((()=>hn(r,d,e)),s)}256&t.shapeFlag&&e.a&&ut(e.a,s),e.isMounted=!0,t=n=o=null}},l=e.effect=new r.qq(u,(()=>vr(e.update)),e.scope),h=e.update=l.run.bind(l);h.id=e.uid,ft(e,!0),h()},B=(e,t,n)=>{t.component=e;const i=e.vnode.props;e.vnode=t,e.next=null,Fe(e,t.props,i,n),Xe(e,t.children,n),(0,r.Jd)(),Er(void 0,e.update),(0,r.lk)()},j=(e,t,n,r,i,o,s,a,c=!1)=>{const u=e&&e.children,l=e?e.shapeFlag:0,h=t.children,{patchFlag:f,shapeFlag:p}=t;if(f>0){if(128&f)return void H(u,h,n,r,i,o,s,a,c);if(256&f)return void U(u,h,n,r,i,o,s,a,c)}8&p?(16&l&&G(u,i,o),h!==u&&d(n,h)):16&l?16&p?H(u,h,n,r,i,o,s,a,c):G(u,i,o,!0):(8&l&&d(n,""),16&p&&x(h,n,r,i,o,s,a,c))},U=(e,t,n,r,o,s,a,c,u)=>{e=e||i.Z6,t=t||i.Z6;const l=e.length,h=t.length,d=Math.min(l,h);let f;for(f=0;f<d;f++){const r=t[f]=u?cn(t[f]):an(t[f]);v(e[f],r,n,null,o,s,a,c,u)}l>h?G(e,o,s,!0,!1,d):x(t,n,r,o,s,a,c,u,d)},H=(e,t,n,r,o,s,a,c,u)=>{let l=0;const h=t.length;let d=e.length-1,f=h-1;while(l<=d&&l<=f){const r=e[l],i=t[l]=u?cn(t[l]):an(t[l]);if(!zt(r,i))break;v(r,i,n,null,o,s,a,c,u),l++}while(l<=d&&l<=f){const r=e[d],i=t[f]=u?cn(t[f]):an(t[f]);if(!zt(r,i))break;v(r,i,n,null,o,s,a,c,u),d--,f--}if(l>d){if(l<=f){const e=f+1,i=e<h?t[e].el:r;while(l<=f)v(null,t[l]=u?cn(t[l]):an(t[l]),n,i,o,s,a,c,u),l++}}else if(l>f)while(l<=d)$(e[l],o,s,!0),l++;else{const p=l,g=l,m=new Map;for(l=g;l<=f;l++){const e=t[l]=u?cn(t[l]):an(t[l]);null!=e.key&&m.set(e.key,l)}let _,y=0;const w=f-g+1;let b=!1,C=0;const k=new Array(w);for(l=0;l<w;l++)k[l]=0;for(l=p;l<=d;l++){const r=e[l];if(y>=w){$(r,o,s,!0);continue}let i;if(null!=r.key)i=m.get(r.key);else for(_=g;_<=f;_++)if(0===k[_-g]&&zt(r,t[_])){i=_;break}void 0===i?$(r,o,s,!0):(k[i-g]=l+1,i>=C?C=i:b=!0,v(r,t[i],n,null,o,s,a,c,u),y++)}const E=b?gt(k):i.Z6;for(_=E.length-1,l=w-1;l>=0;l--){const e=g+l,i=t[e],d=e+1<h?t[e+1].el:r;0===k[l]?v(null,i,n,d,o,s,a,c,u):b&&(_<0||l!==E[_]?W(i,n,d,2):_--)}}},W=(e,t,n,r,i=null)=>{const{el:s,type:a,transition:c,children:u,shapeFlag:l}=e;if(6&l)return void W(e.component.subTree,t,n,r);if(128&l)return void e.suspense.move(t,n,r);if(64&l)return void a.move(e,t,n,Q);if(a===At){o(s,t,n);for(let e=0;e<u.length;e++)W(u[e],t,n,r);return void o(e.anchor,t,n)}if(a===Mt)return void E(e,t,n);const h=2!==r&&1&l&&c;if(h)if(0===r)c.beforeEnter(s),o(s,t,n),ut((()=>c.enter(s)),i);else{const{leave:e,delayLeave:r,afterLeave:i}=c,a=()=>o(s,t,n),u=()=>{e(s,(()=>{a(),i&&i()}))};r?r(s,a,u):u()}else o(s,t,n)},$=(e,t,n,r=!1,i=!1)=>{const{type:o,props:s,ref:a,children:c,dynamicChildren:u,shapeFlag:l,patchFlag:h,dirs:d}=e;if(null!=a&&rt(a,null,n,e,!0),256&l)return void t.ctx.deactivate(e);const f=1&l&&d,p=!X(e);let g;if(p&&(g=s&&s.onVnodeBeforeUnmount)&&hn(g,t,e),6&l)z(e.component,n,r);else{if(128&l)return void e.suspense.unmount(n,r);f&&Ze(e,null,t,"beforeUnmount"),64&l?e.type.remove(e,t,n,i,Q,r):u&&(o!==At||h>0&&64&h)?G(u,t,n,!1,!0):(o===At&&384&h||!i&&16&l)&&G(c,t,n),r&&V(e)}(p&&(g=s&&s.onVnodeUnmounted)||f)&&ut((()=>{g&&hn(g,t,e),f&&Ze(e,null,t,"unmounted")}),n)},V=e=>{const{type:t,el:n,anchor:r,transition:i}=e;if(t===At)return void K(n,r);if(t===Mt)return void T(e);const o=()=>{s(n),i&&!i.persisted&&i.afterLeave&&i.afterLeave()};if(1&e.shapeFlag&&i&&!i.persisted){const{leave:t,delayLeave:r}=i,s=()=>t(n,o);r?r(e.el,o,s):s()}else o()},K=(e,t)=>{let n;while(e!==t)n=p(e),s(e),e=n;s(t)},z=(e,t,n)=>{const{bum:r,scope:o,update:s,subTree:a,um:c}=e;r&&(0,i.ir)(r),o.stop(),s&&(s.active=!1,$(a,e,t,n)),c&&ut(c,t),ut((()=>{e.isUnmounted=!0}),t),t&&t.pendingBranch&&!t.isUnmounted&&e.asyncDep&&!e.asyncResolved&&e.suspenseId===t.pendingId&&(t.deps--,0===t.deps&&t.resolve())},G=(e,t,n,r=!1,i=!1,o=0)=>{for(let s=o;s<e.length;s++)$(e[s],t,n,r,i)},Y=e=>6&e.shapeFlag?Y(e.component.subTree):128&e.shapeFlag?e.suspense.next():p(e.anchor||e.el),J=(e,t,n)=>{null==e?t._vnode&&$(t._vnode,null,null,!0):v(t._vnode||null,e,t,null,null,null,n),Ir(),t._vnode=e},Q={p:v,um:$,m:W,r:V,mt:L,mc:x,pc:j,pbc:A,n:Y,o:e};let Z,te;return t&&([Z,te]=t(Q)),{render:J,hydrate:Z,createApp:nt(J,Z)}}function ft({effect:e,update:t},n){e.allowRecurse=t.allowRecurse=n}function pt(e,t,n=!1){const r=e.children,o=t.children;if((0,i.kJ)(r)&&(0,i.kJ)(o))for(let i=0;i<r.length;i++){const e=r[i];let t=o[i];1&t.shapeFlag&&!t.dynamicChildren&&((t.patchFlag<=0||32===t.patchFlag)&&(t=o[i]=cn(o[i]),t.el=e.el),n||pt(e,t))}}function gt(e){const t=e.slice(),n=[0];let r,i,o,s,a;const c=e.length;for(r=0;r<c;r++){const c=e[r];if(0!==c){if(i=n[n.length-1],e[i]<c){t[r]=i,n.push(r);continue}o=0,s=n.length-1;while(o<s)a=o+s>>1,e[n[a]]<c?o=a+1:s=a;c<e[n[o]]&&(o>0&&(t[r]=n[o-1]),n[o]=r)}}o=n.length,s=n[o-1];while(o-- >0)n[o]=s,s=t[s];return n}const mt=e=>e.__isTeleport,_t=e=>e&&(e.disabled||""===e.disabled),vt=e=>"undefined"!==typeof SVGElement&&e instanceof SVGElement,yt=(e,t)=>{const n=e&&e.to;if((0,i.HD)(n)){if(t){const e=t(n);return e}return null}return n},wt={__isTeleport:!0,process(e,t,n,r,i,o,s,a,c,u){const{mc:l,pc:h,pbc:d,o:{insert:f,querySelector:p,createText:g,createComment:m}}=u,_=_t(t.props);let{shapeFlag:v,children:y,dynamicChildren:w}=t;if(null==e){const e=t.el=g(""),u=t.anchor=g("");f(e,n,r),f(u,n,r);const h=t.target=yt(t.props,p),d=t.targetAnchor=g("");h&&(f(d,h),s=s||vt(h));const m=(e,t)=>{16&v&&l(y,e,t,i,o,s,a,c)};_?m(n,u):h&&m(h,d)}else{t.el=e.el;const r=t.anchor=e.anchor,l=t.target=e.target,f=t.targetAnchor=e.targetAnchor,g=_t(e.props),m=g?n:l,v=g?r:f;if(s=s||vt(l),w?(d(e.dynamicChildren,w,m,i,o,s,a),pt(e,t,!0)):c||h(e,t,m,v,i,o,s,a,!1),_)g||bt(t,n,r,u,1);else if((t.props&&t.props.to)!==(e.props&&e.props.to)){const e=t.target=yt(t.props,p);e&&bt(t,e,null,u,0)}else g&&bt(t,l,f,u,1)}},remove(e,t,n,r,{um:i,o:{remove:o}},s){const{shapeFlag:a,children:c,anchor:u,targetAnchor:l,target:h,props:d}=e;if(h&&o(l),(s||!_t(d))&&(o(u),16&a))for(let f=0;f<c.length;f++){const e=c[f];i(e,t,n,!0,!!e.dynamicChildren)}},move:bt,hydrate:Ct};function bt(e,t,n,{o:{insert:r},m:i},o=2){0===o&&r(e.targetAnchor,t,n);const{el:s,anchor:a,shapeFlag:c,children:u,props:l}=e,h=2===o;if(h&&r(s,t,n),(!h||_t(l))&&16&c)for(let d=0;d<u.length;d++)i(u[d],t,n,2);h&&r(a,t,n)}function Ct(e,t,n,r,i,o,{o:{nextSibling:s,parentNode:a,querySelector:c}},u){const l=t.target=yt(t.props,c);if(l){const c=l._lpa||l.firstChild;16&t.shapeFlag&&(_t(t.props)?(t.anchor=u(s(e),t,a(e),n,r,i,o),t.targetAnchor=c):(t.anchor=s(e),t.targetAnchor=u(c,t,l,n,r,i,o)),l._lpa=t.targetAnchor&&s(t.targetAnchor))}return t.anchor&&s(t.anchor)}const kt=wt,Et="components",It="directives";function Tt(e,t){return xt(Et,e,!0,t)||e}const St=Symbol();function Pt(e){return(0,i.HD)(e)?xt(Et,e,!1)||e:e||St}function Nt(e){return xt(It,e)}function xt(e,t,n=!0,r=!1){const o=d||En;if(o){const n=o.type;if(e===Et){const e=Wn(n);if(e&&(e===t||e===(0,i._A)(t)||e===(0,i.kC)((0,i._A)(t))))return n}const s=Rt(o[e]||n[e],t)||Rt(o.appContext[e],t);return!s&&r?n:s}}function Rt(e,t){return e&&(e[t]||e[(0,i._A)(t)]||e[(0,i.kC)((0,i._A)(t))])}const At=Symbol(void 0),Dt=Symbol(void 0),Ot=Symbol(void 0),Mt=Symbol(void 0),Lt=[];let Ft=null;function qt(e=!1){Lt.push(Ft=e?null:[])}function Bt(){Lt.pop(),Ft=Lt[Lt.length-1]||null}let jt,Ut=1;function Ht(e){Ut+=e}function Wt(e){return e.dynamicChildren=Ut>0?Ft||i.Z6:null,Bt(),Ut>0&&Ft&&Ft.push(e),e}function $t(e,t,n,r,i,o){return Wt(Qt(e,t,n,r,i,o,!0))}function Vt(e,t,n,r,i){return Wt(Zt(e,t,n,r,i,!0))}function Kt(e){return!!e&&!0===e.__v_isVNode}function zt(e,t){return e.type===t.type&&e.key===t.key}function Gt(e){jt=e}const Yt="__vInternal",Jt=({key:e})=>null!=e?e:null,Xt=({ref:e,ref_key:t,ref_for:n})=>null!=e?(0,i.HD)(e)||(0,r.dq)(e)||(0,i.mf)(e)?{i:d,r:e,k:t,f:!!n}:e:null;function Qt(e,t=null,n=null,r=0,o=null,s=(e===At?0:1),a=!1,c=!1){const u={__v_isVNode:!0,__v_skip:!0,type:e,props:t,key:t&&Jt(t),ref:t&&Xt(t),scopeId:f,slotScopeIds:null,children:n,component:null,suspense:null,ssContent:null,ssFallback:null,dirs:null,transition:null,el:null,anchor:null,target:null,targetAnchor:null,staticCount:0,shapeFlag:s,patchFlag:r,dynamicProps:o,dynamicChildren:null,appContext:null};return c?(un(u,n),128&s&&e.normalize(u)):n&&(u.shapeFlag|=(0,i.HD)(n)?8:16),Ut>0&&!a&&Ft&&(u.patchFlag>0||6&s)&&32!==u.patchFlag&&Ft.push(u),u}const Zt=en;function en(e,t=null,n=null,o=0,s=null,a=!1){if(e&&e!==St||(e=Ot),Kt(e)){const r=nn(e,t,!0);return n&&un(r,n),r}if(Vn(e)&&(e=e.__vccOpts),t){t=tn(t);let{class:e,style:n}=t;e&&!(0,i.HD)(e)&&(t.class=(0,i.C_)(e)),(0,i.Kn)(n)&&((0,r.X3)(n)&&!(0,i.kJ)(n)&&(n=(0,i.l7)({},n)),t.style=(0,i.j5)(n))}const c=(0,i.HD)(e)?1:T(e)?128:mt(e)?64:(0,i.Kn)(e)?4:(0,i.mf)(e)?2:0;return Qt(e,t,n,o,s,c,a,!0)}function tn(e){return e?(0,r.X3)(e)||Yt in e?(0,i.l7)({},e):e:null}function nn(e,t,n=!1){const{props:r,ref:o,patchFlag:s,children:a}=e,c=t?ln(r||{},t):r,u={__v_isVNode:!0,__v_skip:!0,type:e.type,props:c,key:c&&Jt(c),ref:t&&t.ref?n&&o?(0,i.kJ)(o)?o.concat(Xt(t)):[o,Xt(t)]:Xt(t):o,scopeId:e.scopeId,slotScopeIds:e.slotScopeIds,children:a,target:e.target,targetAnchor:e.targetAnchor,staticCount:e.staticCount,shapeFlag:e.shapeFlag,patchFlag:t&&e.type!==At?-1===s?16:16|s:s,dynamicProps:e.dynamicProps,dynamicChildren:e.dynamicChildren,appContext:e.appContext,dirs:e.dirs,transition:e.transition,component:e.component,suspense:e.suspense,ssContent:e.ssContent&&nn(e.ssContent),ssFallback:e.ssFallback&&nn(e.ssFallback),el:e.el,anchor:e.anchor};return u}function rn(e=" ",t=0){return Zt(Dt,null,e,t)}function on(e,t){const n=Zt(Mt,null,e);return n.staticCount=t,n}function sn(e="",t=!1){return t?(qt(),Vt(Ot,null,e)):Zt(Ot,null,e)}function an(e){return null==e||"boolean"===typeof e?Zt(Ot):(0,i.kJ)(e)?Zt(At,null,e.slice()):"object"===typeof e?cn(e):Zt(Dt,null,String(e))}function cn(e){return null===e.el||e.memo?e:nn(e)}function un(e,t){let n=0;const{shapeFlag:r}=e;if(null==t)t=null;else if((0,i.kJ)(t))n=16;else if("object"===typeof t){if(65&r){const n=t.default;return void(n&&(n._c&&(n._d=!1),un(e,n()),n._c&&(n._d=!0)))}{n=32;const r=t._;r||Yt in t?3===r&&d&&(1===d.slots._?t._=1:(t._=2,e.patchFlag|=1024)):t._ctx=d}}else(0,i.mf)(t)?(t={default:t,_ctx:d},n=32):(t=String(t),64&r?(n=16,t=[rn(t)]):n=8);e.children=t,e.shapeFlag|=n}function ln(...e){const t={};for(let n=0;n<e.length;n++){const r=e[n];for(const e in r)if("class"===e)t.class!==r.class&&(t.class=(0,i.C_)([t.class,r.class]));else if("style"===e)t.style=(0,i.j5)([t.style,r.style]);else if((0,i.F7)(e)){const n=t[e],o=r[e];n===o||(0,i.kJ)(n)&&n.includes(o)||(t[e]=n?[].concat(n,o):o)}else""!==e&&(t[e]=r[e])}return t}function hn(e,t,n,r=null){er(e,t,7,[n,r])}function dn(e,t,n,r){let o;const s=n&&n[r];if((0,i.kJ)(e)||(0,i.HD)(e)){o=new Array(e.length);for(let n=0,r=e.length;n<r;n++)o[n]=t(e[n],n,void 0,s&&s[n])}else if("number"===typeof e){0,o=new Array(e);for(let n=0;n<e;n++)o[n]=t(n+1,n,void 0,s&&s[n])}else if((0,i.Kn)(e))if(e[Symbol.iterator])o=Array.from(e,((e,n)=>t(e,n,void 0,s&&s[n])));else{const n=Object.keys(e);o=new Array(n.length);for(let r=0,i=n.length;r<i;r++){const i=n[r];o[r]=t(e[i],i,r,s&&s[r])}}else o=[];return n&&(n[r]=o),o}function fn(e,t){for(let n=0;n<t.length;n++){const r=t[n];if((0,i.kJ)(r))for(let t=0;t<r.length;t++)e[r[t].name]=r[t].fn;else r&&(e[r.name]=r.fn)}return e}function pn(e,t,n={},r,i){if(d.isCE)return Zt("slot","default"===t?null:{name:t},r&&r());let o=e[t];o&&o._c&&(o._d=!1),qt();const s=o&&gn(o(n)),a=Vt(At,{key:n.key||`_${t}`},s||(r?r():[]),s&&1===e._?64:-2);return!i&&a.scopeId&&(a.slotScopeIds=[a.scopeId+"-s"]),o&&o._c&&(o._d=!0),a}function gn(e){return e.some((e=>!Kt(e)||e.type!==Ot&&!(e.type===At&&!gn(e.children))))?e:null}function mn(e){const t={};for(const n in e)t[(0,i.hR)(n)]=e[n];return t}const _n=e=>e?Pn(e)?jn(e)||e.proxy:_n(e.parent):null,vn=(0,i.l7)(Object.create(null),{$:e=>e,$el:e=>e.vnode.el,$data:e=>e.data,$props:e=>e.props,$attrs:e=>e.attrs,$slots:e=>e.slots,$refs:e=>e.refs,$parent:e=>_n(e.parent),$root:e=>_n(e.root),$emit:e=>e.emit,$options:e=>Se(e),$forceUpdate:e=>()=>vr(e.update),$nextTick:e=>mr.bind(e.proxy),$watch:e=>Or.bind(e)}),yn={get({_:e},t){const{ctx:n,setupState:o,data:s,props:a,accessCache:c,type:u,appContext:l}=e;let h;if("$"!==t[0]){const r=c[t];if(void 0!==r)switch(r){case 1:return o[t];case 2:return s[t];case 4:return n[t];case 3:return a[t]}else{if(o!==i.kT&&(0,i.RI)(o,t))return c[t]=1,o[t];if(s!==i.kT&&(0,i.RI)(s,t))return c[t]=2,s[t];if((h=e.propsOptions[0])&&(0,i.RI)(h,t))return c[t]=3,a[t];if(n!==i.kT&&(0,i.RI)(n,t))return c[t]=4,n[t];Ce&&(c[t]=0)}}const d=vn[t];let f,p;return d?("$attrs"===t&&(0,r.j)(e,"get",t),d(e)):(f=u.__cssModules)&&(f=f[t])?f:n!==i.kT&&(0,i.RI)(n,t)?(c[t]=4,n[t]):(p=l.config.globalProperties,(0,i.RI)(p,t)?p[t]:void 0)},set({_:e},t,n){const{data:r,setupState:o,ctx:s}=e;if(o!==i.kT&&(0,i.RI)(o,t))o[t]=n;else if(r!==i.kT&&(0,i.RI)(r,t))r[t]=n;else if((0,i.RI)(e.props,t))return!1;return("$"!==t[0]||!(t.slice(1)in e))&&(s[t]=n,!0)},has({_:{data:e,setupState:t,accessCache:n,ctx:r,appContext:o,propsOptions:s}},a){let c;return!!n[a]||e!==i.kT&&(0,i.RI)(e,a)||t!==i.kT&&(0,i.RI)(t,a)||(c=s[0])&&(0,i.RI)(c,a)||(0,i.RI)(r,a)||(0,i.RI)(vn,a)||(0,i.RI)(o.config.globalProperties,a)}};const wn=(0,i.l7)({},yn,{get(e,t){if(t!==Symbol.unscopables)return yn.get(e,t,e)},has(e,t){const n="_"!==t[0]&&!(0,i.e1)(t);return n}});const bn=et();let Cn=0;function kn(e,t,n){const o=e.type,s=(t?t.appContext:e.appContext)||bn,a={uid:Cn++,vnode:e,type:o,parent:t,appContext:s,root:null,next:null,subTree:null,effect:null,update:null,scope:new r.Bj(!0),render:null,proxy:null,exposed:null,exposeProxy:null,withProxy:null,provides:t?t.provides:Object.create(s.provides),accessCache:null,renderCache:[],components:null,directives:null,propsOptions:je(o,s),emitsOptions:l(o,s),emit:null,emitted:null,propsDefaults:i.kT,inheritAttrs:o.inheritAttrs,ctx:i.kT,data:i.kT,props:i.kT,attrs:i.kT,slots:i.kT,refs:i.kT,setupState:i.kT,setupContext:null,suspense:n,suspenseId:n?n.pendingId:0,asyncDep:null,asyncResolved:!1,isMounted:!1,isUnmounted:!1,isDeactivated:!1,bc:null,c:null,bm:null,m:null,bu:null,u:null,um:null,bum:null,da:null,a:null,rtg:null,rtc:null,ec:null,sp:null};return a.ctx={_:a},a.root=t?t.root:a,a.emit=u.bind(null,a),e.ce&&e.ce(a),a}let En=null;const In=()=>En||d,Tn=e=>{En=e,e.scope.on()},Sn=()=>{En&&En.scope.off(),En=null};function Pn(e){return 4&e.vnode.shapeFlag}let Nn,xn,Rn=!1;function An(e,t=!1){Rn=t;const{props:n,children:r}=e.vnode,i=Pn(e);Le(e,n,i,t),Je(e,r);const o=i?Dn(e,t):void 0;return Rn=!1,o}function Dn(e,t){const n=e.type;e.accessCache=Object.create(null),e.proxy=(0,r.Xl)(new Proxy(e.ctx,yn));const{setup:o}=n;if(o){const n=e.setupContext=o.length>1?Bn(e):null;Tn(e),(0,r.Jd)();const s=Zn(o,e,0,[e.props,n]);if((0,r.lk)(),Sn(),(0,i.tI)(s)){if(s.then(Sn,Sn),t)return s.then((n=>{On(e,n,t)})).catch((t=>{tr(t,e,0)}));e.asyncDep=s}else On(e,s,t)}else Fn(e,t)}function On(e,t,n){(0,i.mf)(t)?e.type.__ssrInlineRender?e.ssrRender=t:e.render=t:(0,i.Kn)(t)&&(e.setupState=(0,r.WL)(t)),Fn(e,n)}function Mn(e){Nn=e,xn=e=>{e.render._rc&&(e.withProxy=new Proxy(e.ctx,wn))}}const Ln=()=>!Nn;function Fn(e,t,n){const o=e.type;if(!e.render){if(!t&&Nn&&!o.render){const t=o.template;if(t){0;const{isCustomElement:n,compilerOptions:r}=e.appContext.config,{delimiters:s,compilerOptions:a}=o,c=(0,i.l7)((0,i.l7)({isCustomElement:n,delimiters:s},r),a);o.render=Nn(t,c)}}e.render=o.render||i.dG,xn&&xn(e)}Tn(e),(0,r.Jd)(),ke(e),(0,r.lk)(),Sn()}function qn(e){return new Proxy(e.attrs,{get(t,n){return(0,r.j)(e,"get","$attrs"),t[n]}})}function Bn(e){const t=t=>{e.exposed=t||{}};let n;return{get attrs(){return n||(n=qn(e))},slots:e.slots,emit:e.emit,expose:t}}function jn(e){if(e.exposed)return e.exposeProxy||(e.exposeProxy=new Proxy((0,r.WL)((0,r.Xl)(e.exposed)),{get(t,n){return n in t?t[n]:n in vn?vn[n](e):void 0}}))}const Un=/(?:^|[-_])(\w)/g,Hn=e=>e.replace(Un,(e=>e.toUpperCase())).replace(/[-_]/g,"");function Wn(e){return(0,i.mf)(e)&&e.displayName||e.name}function $n(e,t,n=!1){let r=Wn(t);if(!r&&t.__file){const e=t.__file.match(/([^/\\]+)\.\w+$/);e&&(r=e[1])}if(!r&&e&&e.parent){const n=e=>{for(const n in e)if(e[n]===t)return n};r=n(e.components||e.parent.type.components)||n(e.appContext.components)}return r?Hn(r):n?"App":"Anonymous"}function Vn(e){return(0,i.mf)(e)&&"__vccOpts"in e}const Kn=[];function zn(e,...t){(0,r.Jd)();const n=Kn.length?Kn[Kn.length-1].component:null,i=n&&n.appContext.config.warnHandler,o=Gn();if(i)Zn(i,n,11,[e+t.join(""),n&&n.proxy,o.map((({vnode:e})=>`at <${$n(n,e.type)}>`)).join("\n"),o]);else{const n=[`[Vue warn]: ${e}`,...t];o.length&&n.push("\n",...Yn(o)),console.warn(...n)}(0,r.lk)()}function Gn(){let e=Kn[Kn.length-1];if(!e)return[];const t=[];while(e){const n=t[0];n&&n.vnode===e?n.recurseCount++:t.push({vnode:e,recurseCount:0});const r=e.component&&e.component.parent;e=r&&r.vnode}return t}function Yn(e){const t=[];return e.forEach(((e,n)=>{t.push(...0===n?[]:["\n"],...Jn(e))})),t}function Jn({vnode:e,recurseCount:t}){const n=t>0?`... (${t} recursive calls)`:"",r=!!e.component&&null==e.component.parent,i=` at <${$n(e.component,e.type,r)}`,o=">"+n;return e.props?[i,...Xn(e.props),o]:[i+o]}function Xn(e){const t=[],n=Object.keys(e);return n.slice(0,3).forEach((n=>{t.push(...Qn(n,e[n]))})),n.length>3&&t.push(" ..."),t}function Qn(e,t,n){return(0,i.HD)(t)?(t=JSON.stringify(t),n?t:[`${e}=${t}`]):"number"===typeof t||"boolean"===typeof t||null==t?n?t:[`${e}=${t}`]:(0,r.dq)(t)?(t=Qn(e,(0,r.IU)(t.value),!0),n?t:[`${e}=Ref<`,t,">"]):(0,i.mf)(t)?[`${e}=fn${t.name?`<${t.name}>`:""}`]:(t=(0,r.IU)(t),n?t:[`${e}=`,t])}function Zn(e,t,n,r){let i;try{i=r?e(...r):e()}catch(o){tr(o,t,n)}return i}function er(e,t,n,r){if((0,i.mf)(e)){const o=Zn(e,t,n,r);return o&&(0,i.tI)(o)&&o.catch((e=>{tr(e,t,n)})),o}const o=[];for(let i=0;i<e.length;i++)o.push(er(e[i],t,n,r));return o}function tr(e,t,n,r=!0){const i=t?t.vnode:null;if(t){let r=t.parent;const i=t.proxy,o=n;while(r){const t=r.ec;if(t)for(let n=0;n<t.length;n++)if(!1===t[n](e,i,o))return;r=r.parent}const s=t.appContext.config.errorHandler;if(s)return void Zn(s,null,10,[e,i,o])}nr(e,n,i,r)}function nr(e,t,n,r=!0){console.error(e)}let rr=!1,ir=!1;const or=[];let sr=0;const ar=[];let cr=null,ur=0;const lr=[];let hr=null,dr=0;const fr=Promise.resolve();let pr=null,gr=null;function mr(e){const t=pr||fr;return e?t.then(this?e.bind(this):e):t}function _r(e){let t=sr+1,n=or.length;while(t<n){const r=t+n>>>1,i=Tr(or[r]);i<e?t=r+1:n=r}return t}function vr(e){or.length&&or.includes(e,rr&&e.allowRecurse?sr+1:sr)||e===gr||(null==e.id?or.push(e):or.splice(_r(e.id),0,e),yr())}function yr(){rr||ir||(ir=!0,pr=fr.then(Sr))}function wr(e){const t=or.indexOf(e);t>sr&&or.splice(t,1)}function br(e,t,n,r){(0,i.kJ)(e)?n.push(...e):t&&t.includes(e,e.allowRecurse?r+1:r)||n.push(e),yr()}function Cr(e){br(e,cr,ar,ur)}function kr(e){br(e,hr,lr,dr)}function Er(e,t=null){if(ar.length){for(gr=t,cr=[...new Set(ar)],ar.length=0,ur=0;ur<cr.length;ur++)cr[ur]();cr=null,ur=0,gr=null,Er(e,t)}}function Ir(e){if(lr.length){const e=[...new Set(lr)];if(lr.length=0,hr)return void hr.push(...e);for(hr=e,hr.sort(((e,t)=>Tr(e)-Tr(t))),dr=0;dr<hr.length;dr++)hr[dr]();hr=null,dr=0}}const Tr=e=>null==e.id?1/0:e.id;function Sr(e){ir=!1,rr=!0,Er(e),or.sort(((e,t)=>Tr(e)-Tr(t)));i.dG;try{for(sr=0;sr<or.length;sr++){const e=or[sr];e&&!1!==e.active&&Zn(e,null,14)}}finally{sr=0,or.length=0,Ir(e),rr=!1,pr=null,(or.length||ar.length||lr.length)&&Sr(e)}}function Pr(e,t){return Dr(e,null,t)}function Nr(e,t){return Dr(e,null,{flush:"post"})}function xr(e,t){return Dr(e,null,{flush:"sync"})}const Rr={};function Ar(e,t,n){return Dr(e,t,n)}function Dr(e,t,{immediate:n,deep:o,flush:s,onTrack:a,onTrigger:c}=i.kT){const u=En;let l,h,d=!1,f=!1;if((0,r.dq)(e)?(l=()=>e.value,d=!!e._shallow):(0,r.PG)(e)?(l=()=>e,o=!0):(0,i.kJ)(e)?(f=!0,d=e.some(r.PG),l=()=>e.map((e=>(0,r.dq)(e)?e.value:(0,r.PG)(e)?Lr(e):(0,i.mf)(e)?Zn(e,u,2):void 0))):l=(0,i.mf)(e)?t?()=>Zn(e,u,2):()=>{if(!u||!u.isUnmounted)return h&&h(),er(e,u,3,[p])}:i.dG,t&&o){const e=l;l=()=>Lr(e())}let p=e=>{h=v.onStop=()=>{Zn(e,u,4)}};if(Rn)return p=i.dG,t?n&&er(t,u,3,[l(),f?[]:void 0,p]):l(),i.dG;let g=f?[]:Rr;const m=()=>{if(v.active)if(t){const e=v.run();(o||d||(f?e.some(((e,t)=>(0,i.aU)(e,g[t]))):(0,i.aU)(e,g)))&&(h&&h(),er(t,u,3,[e,g===Rr?void 0:g,p]),g=e)}else v.run()};let _;m.allowRecurse=!!t,_="sync"===s?m:"post"===s?()=>ut(m,u&&u.suspense):()=>{!u||u.isMounted?Cr(m):m()};const v=new r.qq(l,_);return t?n?m():g=v.run():"post"===s?ut(v.run.bind(v),u&&u.suspense):v.run(),()=>{v.stop(),u&&u.scope&&(0,i.Od)(u.scope.effects,v)}}function Or(e,t,n){const r=this.proxy,o=(0,i.HD)(e)?e.includes(".")?Mr(r,e):()=>r[e]:e.bind(r,r);let s;(0,i.mf)(t)?s=t:(s=t.handler,n=t);const a=En;Tn(this);const c=Dr(o,s.bind(r),n);return a?Tn(a):Sn(),c}function Mr(e,t){const n=t.split(".");return()=>{let t=e;for(let e=0;e<n.length&&t;e++)t=t[n[e]];return t}}function Lr(e,t){if(!(0,i.Kn)(e)||e["__v_skip"])return e;if(t=t||new Set,t.has(e))return e;if(t.add(e),(0,r.dq)(e))Lr(e.value,t);else if((0,i.kJ)(e))for(let n=0;n<e.length;n++)Lr(e[n],t);else if((0,i.DM)(e)||(0,i._N)(e))e.forEach((e=>{Lr(e,t)}));else if((0,i.PO)(e))for(const n in e)Lr(e[n],t);return e}function Fr(){return null}function qr(){return null}function Br(e){0}function jr(e,t){return null}function Ur(){return Wr().slots}function Hr(){return Wr().attrs}function Wr(){const e=In();return e.setupContext||(e.setupContext=Bn(e))}function $r(e,t){const n=(0,i.kJ)(e)?e.reduce(((e,t)=>(e[t]={},e)),{}):e;for(const r in t){const e=n[r];e?(0,i.kJ)(e)||(0,i.mf)(e)?n[r]={type:e,default:t[r]}:e.default=t[r]:null===e&&(n[r]={default:t[r]})}return n}function Vr(e,t){const n={};for(const r in e)t.includes(r)||Object.defineProperty(n,r,{enumerable:!0,get:()=>e[r]});return n}function Kr(e){const t=In();let n=e();return Sn(),(0,i.tI)(n)&&(n=n.catch((e=>{throw Tn(t),e}))),[n,()=>Tn(t)]}function zr(e,t,n){const r=arguments.length;return 2===r?(0,i.Kn)(t)&&!(0,i.kJ)(t)?Kt(t)?Zt(e,null,[t]):Zt(e,t):Zt(e,null,t):(r>3?n=Array.prototype.slice.call(arguments,2):3===r&&Kt(n)&&(n=[n]),Zt(e,t,n))}const Gr=Symbol(""),Yr=()=>{{const e=B(Gr);return e||zn("Server rendering context not provided. Make sure to only call useSSRContext() conditionally in the server build."),e}};function Jr(){return void 0}function Xr(e,t,n,r){const i=n[r];if(i&&Qr(i,e))return i;const o=t();return o.memo=e.slice(),n[r]=o}function Qr(e,t){const n=e.memo;if(n.length!=t.length)return!1;for(let r=0;r<n.length;r++)if(n[r]!==t[r])return!1;return Ut>0&&Ft&&Ft.push(e),!0}const Zr="3.2.26",ei={createComponentInstance:kn,setupComponent:An,renderComponentRoot:y,setCurrentRenderingInstance:p,isVNode:Kt,normalizeVNode:an},ti=ei,ni=null,ri=null},963:function(e,t,n){"use strict";n.d(t,{$d:function(){return i.$d},$y:function(){return i.$y},Ah:function(){return F},B:function(){return i.B},BK:function(){return i.BK},Bj:function(){return i.Bj},Bz:function(){return i.Bz},C3:function(){return i.C3},C_:function(){return i.C_},Cn:function(){return i.Cn},D2:function(){return Le},EB:function(){return i.EB},Eo:function(){return i.Eo},F4:function(){return i.F4},F8:function(){return Fe},FN:function(){return i.FN},Fl:function(){return i.Fl},G:function(){return i.G},G2:function(){return Ee},HX:function(){return i.HX},HY:function(){return i.HY},Ho:function(){return i.Ho},IU:function(){return i.IU},JJ:function(){return i.JJ},Jd:function(){return i.Jd},KU:function(){return i.KU},Ko:function(){return i.Ko},LL:function(){return i.LL},MW:function(){return L},MX:function(){return i.MX},Mr:function(){return i.Mr},Nd:function(){return Xe},Nv:function(){return i.Nv},OT:function(){return i.OT},Ob:function(){return i.Ob},P$:function(){return i.P$},PG:function(){return i.PG},Q2:function(){return i.Q2},Q6:function(){return i.Q6},RC:function(){return i.RC},Rh:function(){return i.Rh},Rr:function(){return i.Rr},S3:function(){return i.S3},SK:function(){return i.Ah},SU:function(){return i.SU},U2:function(){return i.U2},Uc:function(){return i.Uc},Uk:function(){return i.Uk},Um:function(){return i.Um},Us:function(){return i.Us},Vh:function(){return i.Vh},W3:function(){return de},WI:function(){return i.WI},WL:function(){return i.WL},WY:function(){return i.WY},Wm:function(){return i.Wm},X3:function(){return i.X3},XI:function(){return i.XI},Xl:function(){return i.Xl},Xn:function(){return i.Xn},Y1:function(){return i.Y1},Y3:function(){return i.Y3},Y8:function(){return i.Y8},YP:function(){return i.YP},YS:function(){return i.YS},YZ:function(){return Ne},Yq:function(){return i.Yq},ZB:function(){return Ke},ZK:function(){return i.ZK},ZM:function(){return i.ZM},Zq:function(){return i.Zq},_:function(){return i._},_A:function(){return i._A},a2:function(){return B},aZ:function(){return i.aZ},b9:function(){return i.b9},bM:function(){return Ie},bT:function(){return i.bT},bv:function(){return i.bv},cE:function(){return i.cE},d1:function(){return i.d1},dD:function(){return i.dD},dG:function(){return i.dG},dl:function(){return i.dl},dq:function(){return i.dq},e8:function(){return Ce},ec:function(){return i.ec},eq:function(){return i.eq},f3:function(){return i.f3},fb:function(){return j},h:function(){return i.h},hR:function(){return i.hR},i8:function(){return i.i8},iD:function(){return i.iD},iH:function(){return i.iH},iM:function(){return Oe},ic:function(){return i.ic},j4:function(){return i.j4},j5:function(){return i.j5},kC:function(){return i.kC},kq:function(){return i.kq},l1:function(){return i.l1},lA:function(){return i.lA},lR:function(){return i.lR},m0:function(){return i.m0},mW:function(){return i.mW},mv:function(){return i.mv},mx:function(){return i.mx},n4:function(){return i.n4},nK:function(){return i.nK},nQ:function(){return i.nQ},nZ:function(){return i.nZ},nr:function(){return be},oR:function(){return i.oR},of:function(){return i.of},p1:function(){return i.p1},qG:function(){return i.qG},qZ:function(){return i.qZ},qb:function(){return i.qb},qj:function(){return i.qj},qq:function(){return i.qq},ri:function(){return ze},ry:function(){return i.ry},sT:function(){return i.sT},sY:function(){return Ve},se:function(){return i.se},sj:function(){return U},sv:function(){return i.sv},uE:function(){return i.uE},uT:function(){return K},u_:function(){return i.u_},up:function(){return i.up},vl:function(){return i.vl},vr:function(){return Ge},vs:function(){return i.vs},w5:function(){return i.w5},wF:function(){return i.wF},wg:function(){return i.wg},wy:function(){return i.wy},xv:function(){return i.xv},yX:function(){return i.yX},yb:function(){return i.MW},zw:function(){return i.zw}});var r=n(577),i=n(252),o=n(262);const s="http://www.w3.org/2000/svg",a="undefined"!==typeof document?document:null,c=new Map,u={insert:(e,t,n)=>{t.insertBefore(e,n||null)},remove:e=>{const t=e.parentNode;t&&t.removeChild(e)},createElement:(e,t,n,r)=>{const i=t?a.createElementNS(s,e):a.createElement(e,n?{is:n}:void 0);return"select"===e&&r&&null!=r.multiple&&i.setAttribute("multiple",r.multiple),i},createText:e=>a.createTextNode(e),createComment:e=>a.createComment(e),setText:(e,t)=>{e.nodeValue=t},setElementText:(e,t)=>{e.textContent=t},parentNode:e=>e.parentNode,nextSibling:e=>e.nextSibling,querySelector:e=>a.querySelector(e),setScopeId(e,t){e.setAttribute(t,"")},cloneNode(e){const t=e.cloneNode(!0);return"_value"in e&&(t._value=e._value),t},insertStaticContent(e,t,n,r){const i=n?n.previousSibling:t.lastChild;let o=c.get(e);if(!o){const t=a.createElement("template");if(t.innerHTML=r?`<svg>${e}</svg>`:e,o=t.content,r){const e=o.firstChild;while(e.firstChild)o.appendChild(e.firstChild);o.removeChild(e)}c.set(e,o)}return t.insertBefore(o.cloneNode(!0),n),[i?i.nextSibling:t.firstChild,n?n.previousSibling:t.lastChild]}};function l(e,t,n){const r=e._vtc;r&&(t=(t?[t,...r]:[...r]).join(" ")),null==t?e.removeAttribute("class"):n?e.setAttribute("class",t):e.className=t}function h(e,t,n){const i=e.style,o=(0,r.HD)(n);if(n&&!o){for(const e in n)f(i,e,n[e]);if(t&&!(0,r.HD)(t))for(const e in t)null==n[e]&&f(i,e,"")}else{const r=i.display;o?t!==n&&(i.cssText=n):t&&e.removeAttribute("style"),"_vod"in e&&(i.display=r)}}const d=/\s*!important$/;function f(e,t,n){if((0,r.kJ)(n))n.forEach((n=>f(e,t,n)));else if(t.startsWith("--"))e.setProperty(t,n);else{const i=m(e,t);d.test(n)?e.setProperty((0,r.rs)(i),n.replace(d,""),"important"):e[i]=n}}const p=["Webkit","Moz","ms"],g={};function m(e,t){const n=g[t];if(n)return n;let i=(0,r._A)(t);if("filter"!==i&&i in e)return g[t]=i;i=(0,r.kC)(i);for(let r=0;r<p.length;r++){const n=p[r]+i;if(n in e)return g[t]=n}return t}const _="http://www.w3.org/1999/xlink";function v(e,t,n,i,o){if(i&&t.startsWith("xlink:"))null==n?e.removeAttributeNS(_,t.slice(6,t.length)):e.setAttributeNS(_,t,n);else{const i=(0,r.Pq)(t);null==n||i&&!(0,r.yA)(n)?e.removeAttribute(t):e.setAttribute(t,i?"":n)}}function y(e,t,n,i,o,s,a){if("innerHTML"===t||"textContent"===t)return i&&a(i,o,s),void(e[t]=null==n?"":n);if("value"===t&&"PROGRESS"!==e.tagName&&!e.tagName.includes("-")){e._value=n;const r=null==n?"":n;return e.value===r&&"OPTION"!==e.tagName||(e.value=r),void(null==n&&e.removeAttribute(t))}if(""===n||null==n){const i=typeof e[t];if("boolean"===i)return void(e[t]=(0,r.yA)(n));if(null==n&&"string"===i)return e[t]="",void e.removeAttribute(t);if("number"===i){try{e[t]=0}catch(c){}return void e.removeAttribute(t)}}try{e[t]=n}catch(u){0}}let w=Date.now,b=!1;if("undefined"!==typeof window){w()>document.createEvent("Event").timeStamp&&(w=()=>performance.now());const e=navigator.userAgent.match(/firefox\/(\d+)/i);b=!!(e&&Number(e[1])<=53)}let C=0;const k=Promise.resolve(),E=()=>{C=0},I=()=>C||(k.then(E),C=w());function T(e,t,n,r){e.addEventListener(t,n,r)}function S(e,t,n,r){e.removeEventListener(t,n,r)}function P(e,t,n,r,i=null){const o=e._vei||(e._vei={}),s=o[t];if(r&&s)s.value=r;else{const[n,a]=x(t);if(r){const s=o[t]=R(r,i);T(e,n,s,a)}else s&&(S(e,n,s,a),o[t]=void 0)}}const N=/(?:Once|Passive|Capture)$/;function x(e){let t;if(N.test(e)){let n;t={};while(n=e.match(N))e=e.slice(0,e.length-n[0].length),t[n[0].toLowerCase()]=!0}return[(0,r.rs)(e.slice(2)),t]}function R(e,t){const n=e=>{const r=e.timeStamp||w();(b||r>=n.attached-1)&&(0,i.$d)(A(e,n.value),t,5,[e])};return n.value=e,n.attached=I(),n}function A(e,t){if((0,r.kJ)(t)){const n=e.stopImmediatePropagation;return e.stopImmediatePropagation=()=>{n.call(e),e._stopped=!0},t.map((e=>t=>!t._stopped&&e(t)))}return t}const D=/^on[a-z]/,O=(e,t,n,i,o=!1,s,a,c,u)=>{"class"===t?l(e,i,o):"style"===t?h(e,n,i):(0,r.F7)(t)?(0,r.tR)(t)||P(e,t,n,i,a):("."===t[0]?(t=t.slice(1),1):"^"===t[0]?(t=t.slice(1),0):M(e,t,i,o))?y(e,t,i,s,a,c,u):("true-value"===t?e._trueValue=i:"false-value"===t&&(e._falseValue=i),v(e,t,i,o))};function M(e,t,n,i){return i?"innerHTML"===t||"textContent"===t||!!(t in e&&D.test(t)&&(0,r.mf)(n)):"spellcheck"!==t&&"draggable"!==t&&("form"!==t&&(("list"!==t||"INPUT"!==e.tagName)&&(("type"!==t||"TEXTAREA"!==e.tagName)&&((!D.test(t)||!(0,r.HD)(n))&&t in e))))}function L(e,t){const n=(0,i.aZ)(e);class r extends B{constructor(e){super(n,e,t)}}return r.def=n,r}const F=e=>L(e,Ke),q="undefined"!==typeof HTMLElement?HTMLElement:class{};class B extends q{constructor(e,t={},n){super(),this._def=e,this._props=t,this._instance=null,this._connected=!1,this._resolved=!1,this._numberProps=null,this.shadowRoot&&n?n(this._createVNode(),this.shadowRoot):this.attachShadow({mode:"open"})}connectedCallback(){this._connected=!0,this._instance||this._resolveDef()}disconnectedCallback(){this._connected=!1,(0,i.Y3)((()=>{this._connected||(Ve(null,this.shadowRoot),this._instance=null)}))}_resolveDef(){if(this._resolved)return;this._resolved=!0;for(let n=0;n<this.attributes.length;n++)this._setAttr(this.attributes[n].name);new MutationObserver((e=>{for(const t of e)this._setAttr(t.attributeName)})).observe(this,{attributes:!0});const e=e=>{const{props:t,styles:n}=e,i=!(0,r.kJ)(t),o=t?i?Object.keys(t):t:[];let s;if(i)for(const a in this._props){const e=t[a];(e===Number||e&&e.type===Number)&&(this._props[a]=(0,r.He)(this._props[a]),(s||(s=Object.create(null)))[a]=!0)}this._numberProps=s;for(const r of Object.keys(this))"_"!==r[0]&&this._setProp(r,this[r],!0,!1);for(const a of o.map(r._A))Object.defineProperty(this,a,{get(){return this._getProp(a)},set(e){this._setProp(a,e)}});this._applyStyles(n),this._update()},t=this._def.__asyncLoader;t?t().then(e):e(this._def)}_setAttr(e){let t=this.getAttribute(e);this._numberProps&&this._numberProps[e]&&(t=(0,r.He)(t)),this._setProp((0,r._A)(e),t,!1)}_getProp(e){return this._props[e]}_setProp(e,t,n=!0,i=!0){t!==this._props[e]&&(this._props[e]=t,i&&this._instance&&this._update(),n&&(!0===t?this.setAttribute((0,r.rs)(e),""):"string"===typeof t||"number"===typeof t?this.setAttribute((0,r.rs)(e),t+""):t||this.removeAttribute((0,r.rs)(e))))}_update(){Ve(this._createVNode(),this.shadowRoot)}_createVNode(){const e=(0,i.Wm)(this._def,(0,r.l7)({},this._props));return this._instance||(e.ce=e=>{this._instance=e,e.isCE=!0,e.emit=(e,...t)=>{this.dispatchEvent(new CustomEvent(e,{detail:t}))};let t=this;while(t=t&&(t.parentNode||t.host))if(t instanceof B){e.parent=t._instance;break}}),e}_applyStyles(e){e&&e.forEach((e=>{const t=document.createElement("style");t.textContent=e,this.shadowRoot.appendChild(t)}))}}function j(e="$style"){{const t=(0,i.FN)();if(!t)return r.kT;const n=t.type.__cssModules;if(!n)return r.kT;const o=n[e];return o||r.kT}}function U(e){const t=(0,i.FN)();if(!t)return;const n=()=>H(t.subTree,e(t.proxy));(0,i.Rh)(n),(0,i.bv)((()=>{const e=new MutationObserver(n);e.observe(t.subTree.el.parentNode,{childList:!0}),(0,i.Ah)((()=>e.disconnect()))}))}function H(e,t){if(128&e.shapeFlag){const n=e.suspense;e=n.activeBranch,n.pendingBranch&&!n.isHydrating&&n.effects.push((()=>{H(n.activeBranch,t)}))}while(e.component)e=e.component.subTree;if(1&e.shapeFlag&&e.el)W(e.el,t);else if(e.type===i.HY)e.children.forEach((e=>H(e,t)));else if(e.type===i.qG){let{el:n,anchor:r}=e;while(n){if(W(n,t),n===r)break;n=n.nextSibling}}}function W(e,t){if(1===e.nodeType){const n=e.style;for(const e in t)n.setProperty(`--${e}`,t[e])}}const $="transition",V="animation",K=(e,{slots:t})=>(0,i.h)(i.P$,X(e),t);K.displayName="Transition";const z={name:String,type:String,css:{type:Boolean,default:!0},duration:[String,Number,Object],enterFromClass:String,enterActiveClass:String,enterToClass:String,appearFromClass:String,appearActiveClass:String,appearToClass:String,leaveFromClass:String,leaveActiveClass:String,leaveToClass:String},G=K.props=(0,r.l7)({},i.P$.props,z),Y=(e,t=[])=>{(0,r.kJ)(e)?e.forEach((e=>e(...t))):e&&e(...t)},J=e=>!!e&&((0,r.kJ)(e)?e.some((e=>e.length>1)):e.length>1);function X(e){const t={};for(const r in e)r in z||(t[r]=e[r]);if(!1===e.css)return t;const{name:n="v",type:i,duration:o,enterFromClass:s=`${n}-enter-from`,enterActiveClass:a=`${n}-enter-active`,enterToClass:c=`${n}-enter-to`,appearFromClass:u=s,appearActiveClass:l=a,appearToClass:h=c,leaveFromClass:d=`${n}-leave-from`,leaveActiveClass:f=`${n}-leave-active`,leaveToClass:p=`${n}-leave-to`}=e,g=Q(o),m=g&&g[0],_=g&&g[1],{onBeforeEnter:v,onEnter:y,onEnterCancelled:w,onLeave:b,onLeaveCancelled:C,onBeforeAppear:k=v,onAppear:E=y,onAppearCancelled:I=w}=t,T=(e,t,n)=>{te(e,t?h:c),te(e,t?l:a),n&&n()},S=(e,t)=>{te(e,p),te(e,f),t&&t()},P=e=>(t,n)=>{const r=e?E:y,o=()=>T(t,e,n);Y(r,[t,o]),ne((()=>{te(t,e?u:s),ee(t,e?h:c),J(r)||ie(t,i,m,o)}))};return(0,r.l7)(t,{onBeforeEnter(e){Y(v,[e]),ee(e,s),ee(e,a)},onBeforeAppear(e){Y(k,[e]),ee(e,u),ee(e,l)},onEnter:P(!1),onAppear:P(!0),onLeave(e,t){const n=()=>S(e,t);ee(e,d),ce(),ee(e,f),ne((()=>{te(e,d),ee(e,p),J(b)||ie(e,i,_,n)})),Y(b,[e,n])},onEnterCancelled(e){T(e,!1),Y(w,[e])},onAppearCancelled(e){T(e,!0),Y(I,[e])},onLeaveCancelled(e){S(e),Y(C,[e])}})}function Q(e){if(null==e)return null;if((0,r.Kn)(e))return[Z(e.enter),Z(e.leave)];{const t=Z(e);return[t,t]}}function Z(e){const t=(0,r.He)(e);return t}function ee(e,t){t.split(/\s+/).forEach((t=>t&&e.classList.add(t))),(e._vtc||(e._vtc=new Set)).add(t)}function te(e,t){t.split(/\s+/).forEach((t=>t&&e.classList.remove(t)));const{_vtc:n}=e;n&&(n.delete(t),n.size||(e._vtc=void 0))}function ne(e){requestAnimationFrame((()=>{requestAnimationFrame(e)}))}let re=0;function ie(e,t,n,r){const i=e._endId=++re,o=()=>{i===e._endId&&r()};if(n)return setTimeout(o,n);const{type:s,timeout:a,propCount:c}=oe(e,t);if(!s)return r();const u=s+"end";let l=0;const h=()=>{e.removeEventListener(u,d),o()},d=t=>{t.target===e&&++l>=c&&h()};setTimeout((()=>{l<c&&h()}),a+1),e.addEventListener(u,d)}function oe(e,t){const n=window.getComputedStyle(e),r=e=>(n[e]||"").split(", "),i=r($+"Delay"),o=r($+"Duration"),s=se(i,o),a=r(V+"Delay"),c=r(V+"Duration"),u=se(a,c);let l=null,h=0,d=0;t===$?s>0&&(l=$,h=s,d=o.length):t===V?u>0&&(l=V,h=u,d=c.length):(h=Math.max(s,u),l=h>0?s>u?$:V:null,d=l?l===$?o.length:c.length:0);const f=l===$&&/\b(transform|all)(,|$)/.test(n[$+"Property"]);return{type:l,timeout:h,propCount:d,hasTransform:f}}function se(e,t){while(e.length<t.length)e=e.concat(e);return Math.max(...t.map(((t,n)=>ae(t)+ae(e[n]))))}function ae(e){return 1e3*Number(e.slice(0,-1).replace(",","."))}function ce(){return document.body.offsetHeight}const ue=new WeakMap,le=new WeakMap,he={name:"TransitionGroup",props:(0,r.l7)({},G,{tag:String,moveClass:String}),setup(e,{slots:t}){const n=(0,i.FN)(),r=(0,i.Y8)();let s,a;return(0,i.ic)((()=>{if(!s.length)return;const t=e.moveClass||`${e.name||"v"}-move`;if(!me(s[0].el,n.vnode.el,t))return;s.forEach(fe),s.forEach(pe);const r=s.filter(ge);ce(),r.forEach((e=>{const n=e.el,r=n.style;ee(n,t),r.transform=r.webkitTransform=r.transitionDuration="";const i=n._moveCb=e=>{e&&e.target!==n||e&&!/transform$/.test(e.propertyName)||(n.removeEventListener("transitionend",i),n._moveCb=null,te(n,t))};n.addEventListener("transitionend",i)}))})),()=>{const c=(0,o.IU)(e),u=X(c);let l=c.tag||i.HY;s=a,a=t.default?(0,i.Q6)(t.default()):[];for(let e=0;e<a.length;e++){const t=a[e];null!=t.key&&(0,i.nK)(t,(0,i.U2)(t,u,r,n))}if(s)for(let e=0;e<s.length;e++){const t=s[e];(0,i.nK)(t,(0,i.U2)(t,u,r,n)),ue.set(t,t.el.getBoundingClientRect())}return(0,i.Wm)(l,null,a)}}},de=he;function fe(e){const t=e.el;t._moveCb&&t._moveCb(),t._enterCb&&t._enterCb()}function pe(e){le.set(e,e.el.getBoundingClientRect())}function ge(e){const t=ue.get(e),n=le.get(e),r=t.left-n.left,i=t.top-n.top;if(r||i){const t=e.el.style;return t.transform=t.webkitTransform=`translate(${r}px,${i}px)`,t.transitionDuration="0s",e}}function me(e,t,n){const r=e.cloneNode();e._vtc&&e._vtc.forEach((e=>{e.split(/\s+/).forEach((e=>e&&r.classList.remove(e)))})),n.split(/\s+/).forEach((e=>e&&r.classList.add(e))),r.style.display="none";const i=1===t.nodeType?t:t.parentNode;i.appendChild(r);const{hasTransform:o}=oe(r);return i.removeChild(r),o}const _e=e=>{const t=e.props["onUpdate:modelValue"];return(0,r.kJ)(t)?e=>(0,r.ir)(t,e):t};function ve(e){e.target.composing=!0}function ye(e){const t=e.target;t.composing&&(t.composing=!1,we(t,"input"))}function we(e,t){const n=document.createEvent("HTMLEvents");n.initEvent(t,!0,!0),e.dispatchEvent(n)}const be={created(e,{modifiers:{lazy:t,trim:n,number:i}},o){e._assign=_e(o);const s=i||o.props&&"number"===o.props.type;T(e,t?"change":"input",(t=>{if(t.target.composing)return;let i=e.value;n?i=i.trim():s&&(i=(0,r.He)(i)),e._assign(i)})),n&&T(e,"change",(()=>{e.value=e.value.trim()})),t||(T(e,"compositionstart",ve),T(e,"compositionend",ye),T(e,"change",ye))},mounted(e,{value:t}){e.value=null==t?"":t},beforeUpdate(e,{value:t,modifiers:{lazy:n,trim:i,number:o}},s){if(e._assign=_e(s),e.composing)return;if(document.activeElement===e){if(n)return;if(i&&e.value.trim()===t)return;if((o||"number"===e.type)&&(0,r.He)(e.value)===t)return}const a=null==t?"":t;e.value!==a&&(e.value=a)}},Ce={deep:!0,created(e,t,n){e._assign=_e(n),T(e,"change",(()=>{const t=e._modelValue,n=Se(e),i=e.checked,o=e._assign;if((0,r.kJ)(t)){const e=(0,r.hq)(t,n),s=-1!==e;if(i&&!s)o(t.concat(n));else if(!i&&s){const n=[...t];n.splice(e,1),o(n)}}else if((0,r.DM)(t)){const e=new Set(t);i?e.add(n):e.delete(n),o(e)}else o(Pe(e,i))}))},mounted:ke,beforeUpdate(e,t,n){e._assign=_e(n),ke(e,t,n)}};function ke(e,{value:t,oldValue:n},i){e._modelValue=t,(0,r.kJ)(t)?e.checked=(0,r.hq)(t,i.props.value)>-1:(0,r.DM)(t)?e.checked=t.has(i.props.value):t!==n&&(e.checked=(0,r.WV)(t,Pe(e,!0)))}const Ee={created(e,{value:t},n){e.checked=(0,r.WV)(t,n.props.value),e._assign=_e(n),T(e,"change",(()=>{e._assign(Se(e))}))},beforeUpdate(e,{value:t,oldValue:n},i){e._assign=_e(i),t!==n&&(e.checked=(0,r.WV)(t,i.props.value))}},Ie={deep:!0,created(e,{value:t,modifiers:{number:n}},i){const o=(0,r.DM)(t);T(e,"change",(()=>{const t=Array.prototype.filter.call(e.options,(e=>e.selected)).map((e=>n?(0,r.He)(Se(e)):Se(e)));e._assign(e.multiple?o?new Set(t):t:t[0])})),e._assign=_e(i)},mounted(e,{value:t}){Te(e,t)},beforeUpdate(e,t,n){e._assign=_e(n)},updated(e,{value:t}){Te(e,t)}};function Te(e,t){const n=e.multiple;if(!n||(0,r.kJ)(t)||(0,r.DM)(t)){for(let i=0,o=e.options.length;i<o;i++){const o=e.options[i],s=Se(o);if(n)(0,r.kJ)(t)?o.selected=(0,r.hq)(t,s)>-1:o.selected=t.has(s);else if((0,r.WV)(Se(o),t))return void(e.selectedIndex!==i&&(e.selectedIndex=i))}n||-1===e.selectedIndex||(e.selectedIndex=-1)}}function Se(e){return"_value"in e?e._value:e.value}function Pe(e,t){const n=t?"_trueValue":"_falseValue";return n in e?e[n]:t}const Ne={created(e,t,n){xe(e,t,n,null,"created")},mounted(e,t,n){xe(e,t,n,null,"mounted")},beforeUpdate(e,t,n,r){xe(e,t,n,r,"beforeUpdate")},updated(e,t,n,r){xe(e,t,n,r,"updated")}};function xe(e,t,n,r,i){let o;switch(e.tagName){case"SELECT":o=Ie;break;case"TEXTAREA":o=be;break;default:switch(n.props&&n.props.type){case"checkbox":o=Ce;break;case"radio":o=Ee;break;default:o=be}}const s=o[i];s&&s(e,t,n,r)}function Re(){be.getSSRProps=({value:e})=>({value:e}),Ee.getSSRProps=({value:e},t)=>{if(t.props&&(0,r.WV)(t.props.value,e))return{checked:!0}},Ce.getSSRProps=({value:e},t)=>{if((0,r.kJ)(e)){if(t.props&&(0,r.hq)(e,t.props.value)>-1)return{checked:!0}}else if((0,r.DM)(e)){if(t.props&&e.has(t.props.value))return{checked:!0}}else if(e)return{checked:!0}}}const Ae=["ctrl","shift","alt","meta"],De={stop:e=>e.stopPropagation(),prevent:e=>e.preventDefault(),self:e=>e.target!==e.currentTarget,ctrl:e=>!e.ctrlKey,shift:e=>!e.shiftKey,alt:e=>!e.altKey,meta:e=>!e.metaKey,left:e=>"button"in e&&0!==e.button,middle:e=>"button"in e&&1!==e.button,right:e=>"button"in e&&2!==e.button,exact:(e,t)=>Ae.some((n=>e[`${n}Key`]&&!t.includes(n)))},Oe=(e,t)=>(n,...r)=>{for(let e=0;e<t.length;e++){const r=De[t[e]];if(r&&r(n,t))return}return e(n,...r)},Me={esc:"escape",space:" ",up:"arrow-up",left:"arrow-left",right:"arrow-right",down:"arrow-down",delete:"backspace"},Le=(e,t)=>n=>{if(!("key"in n))return;const i=(0,r.rs)(n.key);return t.some((e=>e===i||Me[e]===i))?e(n):void 0},Fe={beforeMount(e,{value:t},{transition:n}){e._vod="none"===e.style.display?"":e.style.display,n&&t?n.beforeEnter(e):qe(e,t)},mounted(e,{value:t},{transition:n}){n&&t&&n.enter(e)},updated(e,{value:t,oldValue:n},{transition:r}){!t!==!n&&(r?t?(r.beforeEnter(e),qe(e,!0),r.enter(e)):r.leave(e,(()=>{qe(e,!1)})):qe(e,t))},beforeUnmount(e,{value:t}){qe(e,t)}};function qe(e,t){e.style.display=t?e._vod:"none"}function Be(){Fe.getSSRProps=({value:e})=>{if(!e)return{style:{display:"none"}}}}const je=(0,r.l7)({patchProp:O},u);let Ue,He=!1;function We(){return Ue||(Ue=(0,i.Us)(je))}function $e(){return Ue=He?Ue:(0,i.Eo)(je),He=!0,Ue}const Ve=(...e)=>{We().render(...e)},Ke=(...e)=>{$e().hydrate(...e)},ze=(...e)=>{const t=We().createApp(...e);const{mount:n}=t;return t.mount=e=>{const i=Ye(e);if(!i)return;const o=t._component;(0,r.mf)(o)||o.render||o.template||(o.template=i.innerHTML),i.innerHTML="";const s=n(i,!1,i instanceof SVGElement);return i instanceof Element&&(i.removeAttribute("v-cloak"),i.setAttribute("data-v-app","")),s},t},Ge=(...e)=>{const t=$e().createApp(...e);const{mount:n}=t;return t.mount=e=>{const t=Ye(e);if(t)return n(t,!0,t instanceof SVGElement)},t};function Ye(e){if((0,r.HD)(e)){const t=document.querySelector(e);return t}return e}let Je=!1;const Xe=()=>{Je||(Je=!0,Re(),Be())}},577:function(e,t,n){"use strict";function r(e,t){const n=Object.create(null),r=e.split(",");for(let i=0;i<r.length;i++)n[r[i]]=!0;return t?e=>!!n[e.toLowerCase()]:e=>!!n[e]}n.d(t,{C_:function(){return f},DM:function(){return D},E9:function(){return ie},F7:function(){return I},Gg:function(){return V},HD:function(){return L},He:function(){return ne},Kn:function(){return q},NO:function(){return k},Nj:function(){return te},Od:function(){return P},PO:function(){return W},Pq:function(){return a},RI:function(){return x},S0:function(){return $},W7:function(){return H},WV:function(){return m},Z6:function(){return b},_A:function(){return G},_N:function(){return A},aU:function(){return Z},dG:function(){return C},e1:function(){return o},fY:function(){return r},hR:function(){return Q},hq:function(){return _},ir:function(){return ee},j5:function(){return u},kC:function(){return X},kJ:function(){return R},kT:function(){return w},l7:function(){return S},mf:function(){return M},rs:function(){return J},tI:function(){return B},tR:function(){return T},vs:function(){return p},yA:function(){return c},yk:function(){return F},zw:function(){return v}});const i="Infinity,undefined,NaN,isFinite,isNaN,parseFloat,parseInt,decodeURI,decodeURIComponent,encodeURI,encodeURIComponent,Math,Number,Date,Array,Object,Boolean,String,RegExp,Map,Set,JSON,Intl,BigInt",o=r(i);const s="itemscope,allowfullscreen,formnovalidate,ismap,nomodule,novalidate,readonly",a=r(s);function c(e){return!!e||""===e}function u(e){if(R(e)){const t={};for(let n=0;n<e.length;n++){const r=e[n],i=L(r)?d(r):u(r);if(i)for(const e in i)t[e]=i[e]}return t}return L(e)||q(e)?e:void 0}const l=/;(?![^(]*\))/g,h=/:(.+)/;function d(e){const t={};return e.split(l).forEach((e=>{if(e){const n=e.split(h);n.length>1&&(t[n[0].trim()]=n[1].trim())}})),t}function f(e){let t="";if(L(e))t=e;else if(R(e))for(let n=0;n<e.length;n++){const r=f(e[n]);r&&(t+=r+" ")}else if(q(e))for(const n in e)e[n]&&(t+=n+" ");return t.trim()}function p(e){if(!e)return null;let{class:t,style:n}=e;return t&&!L(t)&&(e.class=f(t)),n&&(e.style=u(n)),e}function g(e,t){if(e.length!==t.length)return!1;let n=!0;for(let r=0;n&&r<e.length;r++)n=m(e[r],t[r]);return n}function m(e,t){if(e===t)return!0;let n=O(e),r=O(t);if(n||r)return!(!n||!r)&&e.getTime()===t.getTime();if(n=R(e),r=R(t),n||r)return!(!n||!r)&&g(e,t);if(n=q(e),r=q(t),n||r){if(!n||!r)return!1;const i=Object.keys(e).length,o=Object.keys(t).length;if(i!==o)return!1;for(const n in e){const r=e.hasOwnProperty(n),i=t.hasOwnProperty(n);if(r&&!i||!r&&i||!m(e[n],t[n]))return!1}}return String(e)===String(t)}function _(e,t){return e.findIndex((e=>m(e,t)))}const v=e=>null==e?"":R(e)||q(e)&&(e.toString===j||!M(e.toString))?JSON.stringify(e,y,2):String(e),y=(e,t)=>t&&t.__v_isRef?y(e,t.value):A(t)?{[`Map(${t.size})`]:[...t.entries()].reduce(((e,[t,n])=>(e[`${t} =>`]=n,e)),{})}:D(t)?{[`Set(${t.size})`]:[...t.values()]}:!q(t)||R(t)||W(t)?t:String(t),w={},b=[],C=()=>{},k=()=>!1,E=/^on[^a-z]/,I=e=>E.test(e),T=e=>e.startsWith("onUpdate:"),S=Object.assign,P=(e,t)=>{const n=e.indexOf(t);n>-1&&e.splice(n,1)},N=Object.prototype.hasOwnProperty,x=(e,t)=>N.call(e,t),R=Array.isArray,A=e=>"[object Map]"===U(e),D=e=>"[object Set]"===U(e),O=e=>e instanceof Date,M=e=>"function"===typeof e,L=e=>"string"===typeof e,F=e=>"symbol"===typeof e,q=e=>null!==e&&"object"===typeof e,B=e=>q(e)&&M(e.then)&&M(e.catch),j=Object.prototype.toString,U=e=>j.call(e),H=e=>U(e).slice(8,-1),W=e=>"[object Object]"===U(e),$=e=>L(e)&&"NaN"!==e&&"-"!==e[0]&&""+parseInt(e,10)===e,V=r(",key,ref,ref_for,ref_key,onVnodeBeforeMount,onVnodeMounted,onVnodeBeforeUpdate,onVnodeUpdated,onVnodeBeforeUnmount,onVnodeUnmounted"),K=e=>{const t=Object.create(null);return n=>{const r=t[n];return r||(t[n]=e(n))}},z=/-(\w)/g,G=K((e=>e.replace(z,((e,t)=>t?t.toUpperCase():"")))),Y=/\B([A-Z])/g,J=K((e=>e.replace(Y,"-$1").toLowerCase())),X=K((e=>e.charAt(0).toUpperCase()+e.slice(1))),Q=K((e=>e?`on${X(e)}`:"")),Z=(e,t)=>!Object.is(e,t),ee=(e,t)=>{for(let n=0;n<e.length;n++)e[n](t)},te=(e,t,n)=>{Object.defineProperty(e,t,{configurable:!0,enumerable:!1,value:n})},ne=e=>{const t=parseFloat(e);return isNaN(t)?e:t};let re;const ie=()=>re||(re="undefined"!==typeof globalThis?globalThis:"undefined"!==typeof self?self:"undefined"!==typeof window?window:"undefined"!==typeof n.g?n.g:{})},976:function(e,t,n){
/*!
 * qrcode.vue v3.3.3
 * A Vue.js component to generate QRCode.
 * © 2017-2021 @scopewu(https://github.com/scopewu)
 * MIT License.
 */
(function(t,r){e.exports=r(n(812))})(0,(function(e){"use strict";
/*! *****************************************************************************
    Copyright (c) Microsoft Corporation.

    Permission to use, copy, modify, and/or distribute this software for any
    purpose with or without fee is hereby granted.

    THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
    REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
    AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
    INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
    LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
    OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
    PERFORMANCE OF THIS SOFTWARE.
    ***************************************************************************** */var t=function(){return t=Object.assign||function(e){for(var t,n=1,r=arguments.length;n<r;n++)for(var i in t=arguments[n],t)Object.prototype.hasOwnProperty.call(t,i)&&(e[i]=t[i]);return e},t.apply(this,arguments)},n={MODE_NUMBER:1,MODE_ALPHA_NUM:2,MODE_8BIT_BYTE:4,MODE_KANJI:8},r=n;function i(e){this.mode=r.MODE_8BIT_BYTE,this.data=e}i.prototype={getLength:function(e){return this.data.length},write:function(e){for(var t=0;t<this.data.length;t++)e.put(this.data.charCodeAt(t),8)}};var o=i,s={L:1,M:0,Q:3,H:2},a=s;function c(e,t){this.totalCount=e,this.dataCount=t}c.RS_BLOCK_TABLE=[[1,26,19],[1,26,16],[1,26,13],[1,26,9],[1,44,34],[1,44,28],[1,44,22],[1,44,16],[1,70,55],[1,70,44],[2,35,17],[2,35,13],[1,100,80],[2,50,32],[2,50,24],[4,25,9],[1,134,108],[2,67,43],[2,33,15,2,34,16],[2,33,11,2,34,12],[2,86,68],[4,43,27],[4,43,19],[4,43,15],[2,98,78],[4,49,31],[2,32,14,4,33,15],[4,39,13,1,40,14],[2,121,97],[2,60,38,2,61,39],[4,40,18,2,41,19],[4,40,14,2,41,15],[2,146,116],[3,58,36,2,59,37],[4,36,16,4,37,17],[4,36,12,4,37,13],[2,86,68,2,87,69],[4,69,43,1,70,44],[6,43,19,2,44,20],[6,43,15,2,44,16],[4,101,81],[1,80,50,4,81,51],[4,50,22,4,51,23],[3,36,12,8,37,13],[2,116,92,2,117,93],[6,58,36,2,59,37],[4,46,20,6,47,21],[7,42,14,4,43,15],[4,133,107],[8,59,37,1,60,38],[8,44,20,4,45,21],[12,33,11,4,34,12],[3,145,115,1,146,116],[4,64,40,5,65,41],[11,36,16,5,37,17],[11,36,12,5,37,13],[5,109,87,1,110,88],[5,65,41,5,66,42],[5,54,24,7,55,25],[11,36,12],[5,122,98,1,123,99],[7,73,45,3,74,46],[15,43,19,2,44,20],[3,45,15,13,46,16],[1,135,107,5,136,108],[10,74,46,1,75,47],[1,50,22,15,51,23],[2,42,14,17,43,15],[5,150,120,1,151,121],[9,69,43,4,70,44],[17,50,22,1,51,23],[2,42,14,19,43,15],[3,141,113,4,142,114],[3,70,44,11,71,45],[17,47,21,4,48,22],[9,39,13,16,40,14],[3,135,107,5,136,108],[3,67,41,13,68,42],[15,54,24,5,55,25],[15,43,15,10,44,16],[4,144,116,4,145,117],[17,68,42],[17,50,22,6,51,23],[19,46,16,6,47,17],[2,139,111,7,140,112],[17,74,46],[7,54,24,16,55,25],[34,37,13],[4,151,121,5,152,122],[4,75,47,14,76,48],[11,54,24,14,55,25],[16,45,15,14,46,16],[6,147,117,4,148,118],[6,73,45,14,74,46],[11,54,24,16,55,25],[30,46,16,2,47,17],[8,132,106,4,133,107],[8,75,47,13,76,48],[7,54,24,22,55,25],[22,45,15,13,46,16],[10,142,114,2,143,115],[19,74,46,4,75,47],[28,50,22,6,51,23],[33,46,16,4,47,17],[8,152,122,4,153,123],[22,73,45,3,74,46],[8,53,23,26,54,24],[12,45,15,28,46,16],[3,147,117,10,148,118],[3,73,45,23,74,46],[4,54,24,31,55,25],[11,45,15,31,46,16],[7,146,116,7,147,117],[21,73,45,7,74,46],[1,53,23,37,54,24],[19,45,15,26,46,16],[5,145,115,10,146,116],[19,75,47,10,76,48],[15,54,24,25,55,25],[23,45,15,25,46,16],[13,145,115,3,146,116],[2,74,46,29,75,47],[42,54,24,1,55,25],[23,45,15,28,46,16],[17,145,115],[10,74,46,23,75,47],[10,54,24,35,55,25],[19,45,15,35,46,16],[17,145,115,1,146,116],[14,74,46,21,75,47],[29,54,24,19,55,25],[11,45,15,46,46,16],[13,145,115,6,146,116],[14,74,46,23,75,47],[44,54,24,7,55,25],[59,46,16,1,47,17],[12,151,121,7,152,122],[12,75,47,26,76,48],[39,54,24,14,55,25],[22,45,15,41,46,16],[6,151,121,14,152,122],[6,75,47,34,76,48],[46,54,24,10,55,25],[2,45,15,64,46,16],[17,152,122,4,153,123],[29,74,46,14,75,47],[49,54,24,10,55,25],[24,45,15,46,46,16],[4,152,122,18,153,123],[13,74,46,32,75,47],[48,54,24,14,55,25],[42,45,15,32,46,16],[20,147,117,4,148,118],[40,75,47,7,76,48],[43,54,24,22,55,25],[10,45,15,67,46,16],[19,148,118,6,149,119],[18,75,47,31,76,48],[34,54,24,34,55,25],[20,45,15,61,46,16]],c.getRSBlocks=function(e,t){var n=c.getRsBlockTable(e,t);if(void 0==n)throw new Error("bad rs block @ typeNumber:"+e+"/errorCorrectLevel:"+t);for(var r=n.length/3,i=new Array,o=0;o<r;o++)for(var s=n[3*o+0],a=n[3*o+1],u=n[3*o+2],l=0;l<s;l++)i.push(new c(a,u));return i},c.getRsBlockTable=function(e,t){switch(t){case a.L:return c.RS_BLOCK_TABLE[4*(e-1)+0];case a.M:return c.RS_BLOCK_TABLE[4*(e-1)+1];case a.Q:return c.RS_BLOCK_TABLE[4*(e-1)+2];case a.H:return c.RS_BLOCK_TABLE[4*(e-1)+3];default:return}};var u=c;function l(){this.buffer=new Array,this.length=0}l.prototype={get:function(e){var t=Math.floor(e/8);return 1==(this.buffer[t]>>>7-e%8&1)},put:function(e,t){for(var n=0;n<t;n++)this.putBit(1==(e>>>t-n-1&1))},getLengthInBits:function(){return this.length},putBit:function(e){var t=Math.floor(this.length/8);this.buffer.length<=t&&this.buffer.push(0),e&&(this.buffer[t]|=128>>>this.length%8),this.length++}};for(var h=l,d={glog:function(e){if(e<1)throw new Error("glog("+e+")");return d.LOG_TABLE[e]},gexp:function(e){while(e<0)e+=255;while(e>=256)e-=255;return d.EXP_TABLE[e]},EXP_TABLE:new Array(256),LOG_TABLE:new Array(256)},f=0;f<8;f++)d.EXP_TABLE[f]=1<<f;for(f=8;f<256;f++)d.EXP_TABLE[f]=d.EXP_TABLE[f-4]^d.EXP_TABLE[f-5]^d.EXP_TABLE[f-6]^d.EXP_TABLE[f-8];for(f=0;f<255;f++)d.LOG_TABLE[d.EXP_TABLE[f]]=f;var p=d,g=p;function m(e,t){if(void 0==e.length)throw new Error(e.length+"/"+t);var n=0;while(n<e.length&&0==e[n])n++;this.num=new Array(e.length-n+t);for(var r=0;r<e.length-n;r++)this.num[r]=e[r+n]}m.prototype={get:function(e){return this.num[e]},getLength:function(){return this.num.length},multiply:function(e){for(var t=new Array(this.getLength()+e.getLength()-1),n=0;n<this.getLength();n++)for(var r=0;r<e.getLength();r++)t[n+r]^=g.gexp(g.glog(this.get(n))+g.glog(e.get(r)));return new m(t,0)},mod:function(e){if(this.getLength()-e.getLength()<0)return this;for(var t=g.glog(this.get(0))-g.glog(e.get(0)),n=new Array(this.getLength()),r=0;r<this.getLength();r++)n[r]=this.get(r);for(r=0;r<e.getLength();r++)n[r]^=g.gexp(g.glog(e.get(r))+t);return new m(n,0).mod(e)}};var _=m,v=n,y=_,w=p,b={PATTERN000:0,PATTERN001:1,PATTERN010:2,PATTERN011:3,PATTERN100:4,PATTERN101:5,PATTERN110:6,PATTERN111:7},C={PATTERN_POSITION_TABLE:[[],[6,18],[6,22],[6,26],[6,30],[6,34],[6,22,38],[6,24,42],[6,26,46],[6,28,50],[6,30,54],[6,32,58],[6,34,62],[6,26,46,66],[6,26,48,70],[6,26,50,74],[6,30,54,78],[6,30,56,82],[6,30,58,86],[6,34,62,90],[6,28,50,72,94],[6,26,50,74,98],[6,30,54,78,102],[6,28,54,80,106],[6,32,58,84,110],[6,30,58,86,114],[6,34,62,90,118],[6,26,50,74,98,122],[6,30,54,78,102,126],[6,26,52,78,104,130],[6,30,56,82,108,134],[6,34,60,86,112,138],[6,30,58,86,114,142],[6,34,62,90,118,146],[6,30,54,78,102,126,150],[6,24,50,76,102,128,154],[6,28,54,80,106,132,158],[6,32,58,84,110,136,162],[6,26,54,82,110,138,166],[6,30,58,86,114,142,170]],G15:1335,G18:7973,G15_MASK:21522,getBCHTypeInfo:function(e){var t=e<<10;while(C.getBCHDigit(t)-C.getBCHDigit(C.G15)>=0)t^=C.G15<<C.getBCHDigit(t)-C.getBCHDigit(C.G15);return(e<<10|t)^C.G15_MASK},getBCHTypeNumber:function(e){var t=e<<12;while(C.getBCHDigit(t)-C.getBCHDigit(C.G18)>=0)t^=C.G18<<C.getBCHDigit(t)-C.getBCHDigit(C.G18);return e<<12|t},getBCHDigit:function(e){var t=0;while(0!=e)t++,e>>>=1;return t},getPatternPosition:function(e){return C.PATTERN_POSITION_TABLE[e-1]},getMask:function(e,t,n){switch(e){case b.PATTERN000:return(t+n)%2==0;case b.PATTERN001:return t%2==0;case b.PATTERN010:return n%3==0;case b.PATTERN011:return(t+n)%3==0;case b.PATTERN100:return(Math.floor(t/2)+Math.floor(n/3))%2==0;case b.PATTERN101:return t*n%2+t*n%3==0;case b.PATTERN110:return(t*n%2+t*n%3)%2==0;case b.PATTERN111:return(t*n%3+(t+n)%2)%2==0;default:throw new Error("bad maskPattern:"+e)}},getErrorCorrectPolynomial:function(e){for(var t=new y([1],0),n=0;n<e;n++)t=t.multiply(new y([1,w.gexp(n)],0));return t},getLengthInBits:function(e,t){if(1<=t&&t<10)switch(e){case v.MODE_NUMBER:return 10;case v.MODE_ALPHA_NUM:return 9;case v.MODE_8BIT_BYTE:return 8;case v.MODE_KANJI:return 8;default:throw new Error("mode:"+e)}else if(t<27)switch(e){case v.MODE_NUMBER:return 12;case v.MODE_ALPHA_NUM:return 11;case v.MODE_8BIT_BYTE:return 16;case v.MODE_KANJI:return 10;default:throw new Error("mode:"+e)}else{if(!(t<41))throw new Error("type:"+t);switch(e){case v.MODE_NUMBER:return 14;case v.MODE_ALPHA_NUM:return 13;case v.MODE_8BIT_BYTE:return 16;case v.MODE_KANJI:return 12;default:throw new Error("mode:"+e)}}},getLostPoint:function(e){for(var t=e.getModuleCount(),n=0,r=0;r<t;r++)for(var i=0;i<t;i++){for(var o=0,s=e.isDark(r,i),a=-1;a<=1;a++)if(!(r+a<0||t<=r+a))for(var c=-1;c<=1;c++)i+c<0||t<=i+c||0==a&&0==c||s==e.isDark(r+a,i+c)&&o++;o>5&&(n+=3+o-5)}for(r=0;r<t-1;r++)for(i=0;i<t-1;i++){var u=0;e.isDark(r,i)&&u++,e.isDark(r+1,i)&&u++,e.isDark(r,i+1)&&u++,e.isDark(r+1,i+1)&&u++,0!=u&&4!=u||(n+=3)}for(r=0;r<t;r++)for(i=0;i<t-6;i++)e.isDark(r,i)&&!e.isDark(r,i+1)&&e.isDark(r,i+2)&&e.isDark(r,i+3)&&e.isDark(r,i+4)&&!e.isDark(r,i+5)&&e.isDark(r,i+6)&&(n+=40);for(i=0;i<t;i++)for(r=0;r<t-6;r++)e.isDark(r,i)&&!e.isDark(r+1,i)&&e.isDark(r+2,i)&&e.isDark(r+3,i)&&e.isDark(r+4,i)&&!e.isDark(r+5,i)&&e.isDark(r+6,i)&&(n+=40);var l=0;for(i=0;i<t;i++)for(r=0;r<t;r++)e.isDark(r,i)&&l++;var h=Math.abs(100*l/t/t-50)/5;return n+=10*h,n}},k=C,E=o,I=u,T=h,S=k,P=_;function N(e,t){this.typeNumber=e,this.errorCorrectLevel=t,this.modules=null,this.moduleCount=0,this.dataCache=null,this.dataList=[]}var x=N.prototype;x.addData=function(e){var t=new E(e);this.dataList.push(t),this.dataCache=null},x.isDark=function(e,t){if(e<0||this.moduleCount<=e||t<0||this.moduleCount<=t)throw new Error(e+","+t);return this.modules[e][t]},x.getModuleCount=function(){return this.moduleCount},x.make=function(){if(this.typeNumber<1){var e=1;for(e=1;e<40;e++){for(var t=I.getRSBlocks(e,this.errorCorrectLevel),n=new T,r=0,i=0;i<t.length;i++)r+=t[i].dataCount;for(i=0;i<this.dataList.length;i++){var o=this.dataList[i];n.put(o.mode,4),n.put(o.getLength(),S.getLengthInBits(o.mode,e)),o.write(n)}if(n.getLengthInBits()<=8*r)break}this.typeNumber=e}this.makeImpl(!1,this.getBestMaskPattern())},x.makeImpl=function(e,t){this.moduleCount=4*this.typeNumber+17,this.modules=new Array(this.moduleCount);for(var n=0;n<this.moduleCount;n++){this.modules[n]=new Array(this.moduleCount);for(var r=0;r<this.moduleCount;r++)this.modules[n][r]=null}this.setupPositionProbePattern(0,0),this.setupPositionProbePattern(this.moduleCount-7,0),this.setupPositionProbePattern(0,this.moduleCount-7),this.setupPositionAdjustPattern(),this.setupTimingPattern(),this.setupTypeInfo(e,t),this.typeNumber>=7&&this.setupTypeNumber(e),null==this.dataCache&&(this.dataCache=N.createData(this.typeNumber,this.errorCorrectLevel,this.dataList)),this.mapData(this.dataCache,t)},x.setupPositionProbePattern=function(e,t){for(var n=-1;n<=7;n++)if(!(e+n<=-1||this.moduleCount<=e+n))for(var r=-1;r<=7;r++)t+r<=-1||this.moduleCount<=t+r||(this.modules[e+n][t+r]=0<=n&&n<=6&&(0==r||6==r)||0<=r&&r<=6&&(0==n||6==n)||2<=n&&n<=4&&2<=r&&r<=4)},x.getBestMaskPattern=function(){for(var e=0,t=0,n=0;n<8;n++){this.makeImpl(!0,n);var r=S.getLostPoint(this);(0==n||e>r)&&(e=r,t=n)}return t},x.createMovieClip=function(e,t,n){var r=e.createEmptyMovieClip(t,n),i=1;this.make();for(var o=0;o<this.modules.length;o++)for(var s=o*i,a=0;a<this.modules[o].length;a++){var c=a*i,u=this.modules[o][a];u&&(r.beginFill(0,100),r.moveTo(c,s),r.lineTo(c+i,s),r.lineTo(c+i,s+i),r.lineTo(c,s+i),r.endFill())}return r},x.setupTimingPattern=function(){for(var e=8;e<this.moduleCount-8;e++)null==this.modules[e][6]&&(this.modules[e][6]=e%2==0);for(var t=8;t<this.moduleCount-8;t++)null==this.modules[6][t]&&(this.modules[6][t]=t%2==0)},x.setupPositionAdjustPattern=function(){for(var e=S.getPatternPosition(this.typeNumber),t=0;t<e.length;t++)for(var n=0;n<e.length;n++){var r=e[t],i=e[n];if(null==this.modules[r][i])for(var o=-2;o<=2;o++)for(var s=-2;s<=2;s++)this.modules[r+o][i+s]=-2==o||2==o||-2==s||2==s||0==o&&0==s}},x.setupTypeNumber=function(e){for(var t=S.getBCHTypeNumber(this.typeNumber),n=0;n<18;n++){var r=!e&&1==(t>>n&1);this.modules[Math.floor(n/3)][n%3+this.moduleCount-8-3]=r}for(n=0;n<18;n++){r=!e&&1==(t>>n&1);this.modules[n%3+this.moduleCount-8-3][Math.floor(n/3)]=r}},x.setupTypeInfo=function(e,t){for(var n=this.errorCorrectLevel<<3|t,r=S.getBCHTypeInfo(n),i=0;i<15;i++){var o=!e&&1==(r>>i&1);i<6?this.modules[i][8]=o:i<8?this.modules[i+1][8]=o:this.modules[this.moduleCount-15+i][8]=o}for(i=0;i<15;i++){o=!e&&1==(r>>i&1);i<8?this.modules[8][this.moduleCount-i-1]=o:i<9?this.modules[8][15-i-1+1]=o:this.modules[8][15-i-1]=o}this.modules[this.moduleCount-8][8]=!e},x.mapData=function(e,t){for(var n=-1,r=this.moduleCount-1,i=7,o=0,s=this.moduleCount-1;s>0;s-=2){6==s&&s--;while(1){for(var a=0;a<2;a++)if(null==this.modules[r][s-a]){var c=!1;o<e.length&&(c=1==(e[o]>>>i&1));var u=S.getMask(t,r,s-a);u&&(c=!c),this.modules[r][s-a]=c,i--,-1==i&&(o++,i=7)}if(r+=n,r<0||this.moduleCount<=r){r-=n,n=-n;break}}}},N.PAD0=236,N.PAD1=17,N.createData=function(e,t,n){for(var r=I.getRSBlocks(e,t),i=new T,o=0;o<n.length;o++){var s=n[o];i.put(s.mode,4),i.put(s.getLength(),S.getLengthInBits(s.mode,e)),s.write(i)}var a=0;for(o=0;o<r.length;o++)a+=r[o].dataCount;if(i.getLengthInBits()>8*a)throw new Error("code length overflow. ("+i.getLengthInBits()+">"+8*a+")");i.getLengthInBits()+4<=8*a&&i.put(0,4);while(i.getLengthInBits()%8!=0)i.putBit(!1);while(1){if(i.getLengthInBits()>=8*a)break;if(i.put(N.PAD0,8),i.getLengthInBits()>=8*a)break;i.put(N.PAD1,8)}return N.createBytes(i,r)},N.createBytes=function(e,t){for(var n=0,r=0,i=0,o=new Array(t.length),s=new Array(t.length),a=0;a<t.length;a++){var c=t[a].dataCount,u=t[a].totalCount-c;r=Math.max(r,c),i=Math.max(i,u),o[a]=new Array(c);for(var l=0;l<o[a].length;l++)o[a][l]=255&e.buffer[l+n];n+=c;var h=S.getErrorCorrectPolynomial(u),d=new P(o[a],h.getLength()-1),f=d.mod(h);s[a]=new Array(h.getLength()-1);for(l=0;l<s[a].length;l++){var p=l+f.getLength()-s[a].length;s[a][l]=p>=0?f.get(p):0}}var g=0;for(l=0;l<t.length;l++)g+=t[l].totalCount;var m=new Array(g),_=0;for(l=0;l<r;l++)for(a=0;a<t.length;a++)l<o[a].length&&(m[_++]=o[a][l]);for(l=0;l<i;l++)for(a=0;a<t.length;a++)l<s[a].length&&(m[_++]=s[a][l]);return m};var R=N,A="H",D=function(){try{(new Path2D).addPath(new Path2D)}catch(e){return!1}return!0}();function O(e,t){var n=s[t],r=new R(-1,n);return r.addData(L(e)),r.make(),r}function M(e){return e in s}function L(e){for(var t="",n=0;n<e.length;n++){var r=e.charCodeAt(n);r<128?t+=String.fromCharCode(r):r<2048?(t+=String.fromCharCode(192|r>>6),t+=String.fromCharCode(128|63&r)):r<55296||r>=57344?(t+=String.fromCharCode(224|r>>12),t+=String.fromCharCode(128|r>>6&63),t+=String.fromCharCode(128|63&r)):(n++,r=65536+((1023&r)<<10|1023&e.charCodeAt(n)),t+=String.fromCharCode(240|r>>18),t+=String.fromCharCode(128|r>>12&63),t+=String.fromCharCode(128|r>>6&63),t+=String.fromCharCode(128|63&r))}return t}function F(e,t){void 0===t&&(t=0);var n=[];return e.forEach((function(e,r){var i=null;e.forEach((function(o,s){if(!o&&null!==i)return n.push("M"+(i+t)+" "+(r+t)+"h"+(s-i)+"v1H"+(i+t)+"z"),void(i=null);if(s!==e.length-1)o&&null===i&&(i=s);else{if(!o)return;null===i?n.push("M"+(s+t)+","+(r+t)+" h1v1H"+(s+t)+"z"):n.push("M"+(i+t)+","+(r+t)+" h"+(s+1-i)+"v1H"+(i+t)+"z")}}))})),n.join("")}var q={value:{type:String,required:!0,default:""},size:{type:Number,default:100},level:{type:String,default:A,validator:function(e){return M(e)}},background:{type:String,default:"#fff"},foreground:{type:String,default:"#000"},margin:{type:Number,required:!1,default:0}},B=t(t({},q),{renderAs:{type:String,required:!1,default:"canvas",validator:function(e){return["canvas","svg"].indexOf(e)>-1}}}),j=e.defineComponent({name:"QRCodeSvg",props:q,setup:function(t){var n=e.ref(0),r=e.ref(""),i=function(){var e=t.value,i=t.level,o=t.margin,s=O(e,i).modules;n.value=s.length+2*o,r.value=F(s,o)};return i(),e.onUpdated(i),function(){return e.h("svg",{width:t.size,height:t.size,"shape-rendering":"crispEdges",xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 "+n.value+" "+n.value},[e.h("path",{fill:t.background,d:"M0,0 h"+n.value+"v"+n.value+"H0z"}),e.h("path",{fill:t.foreground,d:r.value})])}}}),U=e.defineComponent({name:"QRCodeCanvas",props:q,setup:function(t){var n=e.ref(null),r=function(){var e=t.value,r=t.level,i=t.size,o=t.margin,s=t.background,a=t.foreground,c=O(e,r).modules,u=c.length+2*o,l=n.value;if(l){var h=l.getContext("2d");if(h){var d=window.devicePixelRatio||1,f=i/u*d;l.height=l.width=i*d,h.scale(f,f),h.fillStyle=s,h.fillRect(0,0,u,u),h.fillStyle=a,D?h.fill(new Path2D(F(c,o))):c.forEach((function(e,t){e.forEach((function(e,n){e&&h.fillRect(n+o,t+o,1,1)}))}))}}};return e.onMounted(r),e.onUpdated(r),function(){return e.h("canvas",{ref:n,style:{width:t.size+"px",height:t.size+"px"}})}}}),H=e.defineComponent({name:"Qrcode",render:function(){var t=this.$props,n=t.renderAs,r=t.value,i=t.size,o=t.margin,s=t.level,a=t.background,c=t.foreground,u=i>>>0,l=o>>>0,h=M(s)?s:A;return e.h("svg"===n?j:U,{value:r,size:u,margin:l,level:h,background:a,foreground:c})},props:B});return H}))},744:function(e,t){"use strict";t.Z=(e,t)=>{const n=e.__vccOpts||e;for(const[r,i]of t)n[r]=i;return n}},812:function(e,t,n){"use strict";n.r(t),n.d(t,{BaseTransition:function(){return r.P$},Comment:function(){return r.sv},EffectScope:function(){return r.Bj},Fragment:function(){return r.HY},KeepAlive:function(){return r.Ob},ReactiveEffect:function(){return r.qq},Static:function(){return r.qG},Suspense:function(){return r.n4},Teleport:function(){return r.lR},Text:function(){return r.xv},Transition:function(){return r.uT},TransitionGroup:function(){return r.W3},VueElement:function(){return r.a2},callWithAsyncErrorHandling:function(){return r.$d},callWithErrorHandling:function(){return r.KU},camelize:function(){return r._A},capitalize:function(){return r.kC},cloneVNode:function(){return r.Ho},compatUtils:function(){return r.ry},compile:function(){return i},computed:function(){return r.Fl},createApp:function(){return r.ri},createBlock:function(){return r.j4},createCommentVNode:function(){return r.kq},createElementBlock:function(){return r.iD},createElementVNode:function(){return r._},createHydrationRenderer:function(){return r.Eo},createPropsRestProxy:function(){return r.p1},createRenderer:function(){return r.Us},createSSRApp:function(){return r.vr},createSlots:function(){return r.Nv},createStaticVNode:function(){return r.uE},createTextVNode:function(){return r.Uk},createVNode:function(){return r.Wm},customRef:function(){return r.ZM},defineAsyncComponent:function(){return r.RC},defineComponent:function(){return r.aZ},defineCustomElement:function(){return r.MW},defineEmits:function(){return r.Bz},defineExpose:function(){return r.WY},defineProps:function(){return r.yb},defineSSRCustomElement:function(){return r.Ah},devtools:function(){return r.mW},effect:function(){return r.cE},effectScope:function(){return r.B},getCurrentInstance:function(){return r.FN},getCurrentScope:function(){return r.nZ},getTransitionRawChildren:function(){return r.Q6},guardReactiveProps:function(){return r.F4},h:function(){return r.h},handleError:function(){return r.S3},hydrate:function(){return r.ZB},initCustomFormatter:function(){return r.Mr},initDirectivesForSSR:function(){return r.Nd},inject:function(){return r.f3},isMemoSame:function(){return r.nQ},isProxy:function(){return r.X3},isReactive:function(){return r.PG},isReadonly:function(){return r.$y},isRef:function(){return r.dq},isRuntimeOnly:function(){return r.of},isVNode:function(){return r.lA},markRaw:function(){return r.Xl},mergeDefaults:function(){return r.u_},mergeProps:function(){return r.dG},nextTick:function(){return r.Y3},normalizeClass:function(){return r.C_},normalizeProps:function(){return r.vs},normalizeStyle:function(){return r.j5},onActivated:function(){return r.dl},onBeforeMount:function(){return r.wF},onBeforeUnmount:function(){return r.Jd},onBeforeUpdate:function(){return r.Xn},onDeactivated:function(){return r.se},onErrorCaptured:function(){return r.d1},onMounted:function(){return r.bv},onRenderTracked:function(){return r.bT},onRenderTriggered:function(){return r.Yq},onScopeDispose:function(){return r.EB},onServerPrefetch:function(){return r.vl},onUnmounted:function(){return r.SK},onUpdated:function(){return r.ic},openBlock:function(){return r.wg},popScopeId:function(){return r.Cn},provide:function(){return r.JJ},proxyRefs:function(){return r.WL},pushScopeId:function(){return r.dD},queuePostFlushCb:function(){return r.qb},reactive:function(){return r.qj},readonly:function(){return r.OT},ref:function(){return r.iH},registerRuntimeCompiler:function(){return r.Y1},render:function(){return r.sY},renderList:function(){return r.Ko},renderSlot:function(){return r.WI},resolveComponent:function(){return r.up},resolveDirective:function(){return r.Q2},resolveDynamicComponent:function(){return r.LL},resolveFilter:function(){return r.eq},resolveTransitionHooks:function(){return r.U2},setBlockTracking:function(){return r.qZ},setDevtoolsHook:function(){return r.ec},setTransitionHooks:function(){return r.nK},shallowReactive:function(){return r.Um},shallowReadonly:function(){return r.YS},shallowRef:function(){return r.XI},ssrContextKey:function(){return r.Uc},ssrUtils:function(){return r.G},stop:function(){return r.sT},toDisplayString:function(){return r.zw},toHandlerKey:function(){return r.hR},toHandlers:function(){return r.mx},toRaw:function(){return r.IU},toRef:function(){return r.Vh},toRefs:function(){return r.BK},transformVNodeArgs:function(){return r.C3},triggerRef:function(){return r.oR},unref:function(){return r.SU},useAttrs:function(){return r.l1},useCssModule:function(){return r.fb},useCssVars:function(){return r.sj},useSSRContext:function(){return r.Zq},useSlots:function(){return r.Rr},useTransitionState:function(){return r.Y8},vModelCheckbox:function(){return r.e8},vModelDynamic:function(){return r.YZ},vModelRadio:function(){return r.G2},vModelSelect:function(){return r.bM},vModelText:function(){return r.nr},vShow:function(){return r.F8},version:function(){return r.i8},warn:function(){return r.ZK},watch:function(){return r.YP},watchEffect:function(){return r.m0},watchPostEffect:function(){return r.Rh},watchSyncEffect:function(){return r.yX},withAsyncContext:function(){return r.mv},withCtx:function(){return r.w5},withDefaults:function(){return r.b9},withDirectives:function(){return r.wy},withKeys:function(){return r.D2},withMemo:function(){return r.MX},withModifiers:function(){return r.iM},withScopeId:function(){return r.HX}});var r=n(963);const i=()=>{0}},907:function(e,t,n){"use strict";n.d(t,{MT:function(){return ee},OI:function(){return ie},rn:function(){return re}});var r=n(252),i=n(262);function o(){return s().__VUE_DEVTOOLS_GLOBAL_HOOK__}function s(){return"undefined"!==typeof navigator&&"undefined"!==typeof window?window:"undefined"!==typeof n.g?n.g:{}}const a="function"===typeof Proxy,c="devtools-plugin:setup",u="plugin:settings:set";let l,h;function d(){var e;return void 0!==l||("undefined"!==typeof window&&window.performance?(l=!0,h=window.performance):"undefined"!==typeof n.g&&(null===(e=n.g.perf_hooks)||void 0===e?void 0:e.performance)?(l=!0,h=n.g.perf_hooks.performance):l=!1),l}function f(){return d()?h.now():Date.now()}class p{constructor(e,t){this.target=null,this.targetQueue=[],this.onQueue=[],this.plugin=e,this.hook=t;const n={};if(e.settings)for(const s in e.settings){const t=e.settings[s];n[s]=t.defaultValue}const r=`__vue-devtools-plugin-settings__${e.id}`;let i=Object.assign({},n);try{const e=localStorage.getItem(r),t=JSON.parse(e);Object.assign(i,t)}catch(o){}this.fallbacks={getSettings(){return i},setSettings(e){try{localStorage.setItem(r,JSON.stringify(e))}catch(o){}i=e},now(){return f()}},t&&t.on(u,((e,t)=>{e===this.plugin.id&&this.fallbacks.setSettings(t)})),this.proxiedOn=new Proxy({},{get:(e,t)=>this.target?this.target.on[t]:(...e)=>{this.onQueue.push({method:t,args:e})}}),this.proxiedTarget=new Proxy({},{get:(e,t)=>this.target?this.target[t]:"on"===t?this.proxiedOn:Object.keys(this.fallbacks).includes(t)?(...e)=>(this.targetQueue.push({method:t,args:e,resolve:()=>{}}),this.fallbacks[t](...e)):(...e)=>new Promise((n=>{this.targetQueue.push({method:t,args:e,resolve:n})}))})}async setRealTarget(e){this.target=e;for(const t of this.onQueue)this.target.on[t.method](...t.args);for(const t of this.targetQueue)t.resolve(await this.target[t.method](...t.args))}}function g(e,t){const n=e,r=s(),i=o(),u=a&&n.enableEarlyProxy;if(!i||!r.__VUE_DEVTOOLS_PLUGIN_API_AVAILABLE__&&u){const e=u?new p(n,i):null,o=r.__VUE_DEVTOOLS_PLUGINS__=r.__VUE_DEVTOOLS_PLUGINS__||[];o.push({pluginDescriptor:n,setupFn:t,proxy:e}),e&&t(e.proxiedTarget)}else i.emit(c,e,t)}
/*!
 * vuex v4.0.2
 * (c) 2021 Evan You
 * @license MIT
 */
var m="store";function _(e,t){Object.keys(e).forEach((function(n){return t(e[n],n)}))}function v(e){return null!==e&&"object"===typeof e}function y(e){return e&&"function"===typeof e.then}function w(e,t){return function(){return e(t)}}function b(e,t,n){return t.indexOf(e)<0&&(n&&n.prepend?t.unshift(e):t.push(e)),function(){var n=t.indexOf(e);n>-1&&t.splice(n,1)}}function C(e,t){e._actions=Object.create(null),e._mutations=Object.create(null),e._wrappedGetters=Object.create(null),e._modulesNamespaceMap=Object.create(null);var n=e.state;E(e,n,[],e._modules.root,!0),k(e,n,t)}function k(e,t,n){var r=e._state;e.getters={},e._makeLocalGettersCache=Object.create(null);var o=e._wrappedGetters,s={};_(o,(function(t,n){s[n]=w(t,e),Object.defineProperty(e.getters,n,{get:function(){return s[n]()},enumerable:!0})})),e._state=(0,i.qj)({data:t}),e.strict&&x(e),r&&n&&e._withCommit((function(){r.data=null}))}function E(e,t,n,r,i){var o=!n.length,s=e._modules.getNamespace(n);if(r.namespaced&&(e._modulesNamespaceMap[s],e._modulesNamespaceMap[s]=r),!o&&!i){var a=R(t,n.slice(0,-1)),c=n[n.length-1];e._withCommit((function(){a[c]=r.state}))}var u=r.context=I(e,s,n);r.forEachMutation((function(t,n){var r=s+n;S(e,r,t,u)})),r.forEachAction((function(t,n){var r=t.root?n:s+n,i=t.handler||t;P(e,r,i,u)})),r.forEachGetter((function(t,n){var r=s+n;N(e,r,t,u)})),r.forEachChild((function(r,o){E(e,t,n.concat(o),r,i)}))}function I(e,t,n){var r=""===t,i={dispatch:r?e.dispatch:function(n,r,i){var o=A(n,r,i),s=o.payload,a=o.options,c=o.type;return a&&a.root||(c=t+c),e.dispatch(c,s)},commit:r?e.commit:function(n,r,i){var o=A(n,r,i),s=o.payload,a=o.options,c=o.type;a&&a.root||(c=t+c),e.commit(c,s,a)}};return Object.defineProperties(i,{getters:{get:r?function(){return e.getters}:function(){return T(e,t)}},state:{get:function(){return R(e.state,n)}}}),i}function T(e,t){if(!e._makeLocalGettersCache[t]){var n={},r=t.length;Object.keys(e.getters).forEach((function(i){if(i.slice(0,r)===t){var o=i.slice(r);Object.defineProperty(n,o,{get:function(){return e.getters[i]},enumerable:!0})}})),e._makeLocalGettersCache[t]=n}return e._makeLocalGettersCache[t]}function S(e,t,n,r){var i=e._mutations[t]||(e._mutations[t]=[]);i.push((function(t){n.call(e,r.state,t)}))}function P(e,t,n,r){var i=e._actions[t]||(e._actions[t]=[]);i.push((function(t){var i=n.call(e,{dispatch:r.dispatch,commit:r.commit,getters:r.getters,state:r.state,rootGetters:e.getters,rootState:e.state},t);return y(i)||(i=Promise.resolve(i)),e._devtoolHook?i.catch((function(t){throw e._devtoolHook.emit("vuex:error",t),t})):i}))}function N(e,t,n,r){e._wrappedGetters[t]||(e._wrappedGetters[t]=function(e){return n(r.state,r.getters,e.state,e.getters)})}function x(e){(0,r.YP)((function(){return e._state.data}),(function(){0}),{deep:!0,flush:"sync"})}function R(e,t){return t.reduce((function(e,t){return e[t]}),e)}function A(e,t,n){return v(e)&&e.type&&(n=t,t=e,e=e.type),{type:e,payload:t,options:n}}var D="vuex bindings",O="vuex:mutations",M="vuex:actions",L="vuex",F=0;function q(e,t){g({id:"org.vuejs.vuex",app:e,label:"Vuex",homepage:"https://next.vuex.vuejs.org/",logo:"https://vuejs.org/images/icons/favicon-96x96.png",packageName:"vuex",componentStateTypes:[D]},(function(n){n.addTimelineLayer({id:O,label:"Vuex Mutations",color:B}),n.addTimelineLayer({id:M,label:"Vuex Actions",color:B}),n.addInspector({id:L,label:"Vuex",icon:"storage",treeFilterPlaceholder:"Filter stores..."}),n.on.getInspectorTree((function(n){if(n.app===e&&n.inspectorId===L)if(n.filter){var r=[];V(r,t._modules.root,n.filter,""),n.rootNodes=r}else n.rootNodes=[$(t._modules.root,"")]})),n.on.getInspectorState((function(n){if(n.app===e&&n.inspectorId===L){var r=n.nodeId;T(t,r),n.state=K(G(t._modules,r),"root"===r?t.getters:t._makeLocalGettersCache,r)}})),n.on.editInspectorState((function(n){if(n.app===e&&n.inspectorId===L){var r=n.nodeId,i=n.path;"root"!==r&&(i=r.split("/").filter(Boolean).concat(i)),t._withCommit((function(){n.set(t._state.data,i,n.state.value)}))}})),t.subscribe((function(e,t){var r={};e.payload&&(r.payload=e.payload),r.state=t,n.notifyComponentUpdate(),n.sendInspectorTree(L),n.sendInspectorState(L),n.addTimelineEvent({layerId:O,event:{time:Date.now(),title:e.type,data:r}})})),t.subscribeAction({before:function(e,t){var r={};e.payload&&(r.payload=e.payload),e._id=F++,e._time=Date.now(),r.state=t,n.addTimelineEvent({layerId:M,event:{time:e._time,title:e.type,groupId:e._id,subtitle:"start",data:r}})},after:function(e,t){var r={},i=Date.now()-e._time;r.duration={_custom:{type:"duration",display:i+"ms",tooltip:"Action duration",value:i}},e.payload&&(r.payload=e.payload),r.state=t,n.addTimelineEvent({layerId:M,event:{time:Date.now(),title:e.type,groupId:e._id,subtitle:"end",data:r}})}})}))}var B=8702998,j=6710886,U=16777215,H={label:"namespaced",textColor:U,backgroundColor:j};function W(e){return e&&"root"!==e?e.split("/").slice(-2,-1)[0]:"Root"}function $(e,t){return{id:t||"root",label:W(t),tags:e.namespaced?[H]:[],children:Object.keys(e._children).map((function(n){return $(e._children[n],t+n+"/")}))}}function V(e,t,n,r){r.includes(n)&&e.push({id:r||"root",label:r.endsWith("/")?r.slice(0,r.length-1):r||"Root",tags:t.namespaced?[H]:[]}),Object.keys(t._children).forEach((function(i){V(e,t._children[i],n,r+i+"/")}))}function K(e,t,n){t="root"===n?t:t[n];var r=Object.keys(t),i={state:Object.keys(e.state).map((function(t){return{key:t,editable:!0,value:e.state[t]}}))};if(r.length){var o=z(t);i.getters=Object.keys(o).map((function(e){return{key:e.endsWith("/")?W(e):e,editable:!1,value:Y((function(){return o[e]}))}}))}return i}function z(e){var t={};return Object.keys(e).forEach((function(n){var r=n.split("/");if(r.length>1){var i=t,o=r.pop();r.forEach((function(e){i[e]||(i[e]={_custom:{value:{},display:e,tooltip:"Module",abstract:!0}}),i=i[e]._custom.value})),i[o]=Y((function(){return e[n]}))}else t[n]=Y((function(){return e[n]}))})),t}function G(e,t){var n=t.split("/").filter((function(e){return e}));return n.reduce((function(e,r,i){var o=e[r];if(!o)throw new Error('Missing module "'+r+'" for path "'+t+'".');return i===n.length-1?o:o._children}),"root"===t?e:e.root._children)}function Y(e){try{return e()}catch(t){return t}}var J=function(e,t){this.runtime=t,this._children=Object.create(null),this._rawModule=e;var n=e.state;this.state=("function"===typeof n?n():n)||{}},X={namespaced:{configurable:!0}};X.namespaced.get=function(){return!!this._rawModule.namespaced},J.prototype.addChild=function(e,t){this._children[e]=t},J.prototype.removeChild=function(e){delete this._children[e]},J.prototype.getChild=function(e){return this._children[e]},J.prototype.hasChild=function(e){return e in this._children},J.prototype.update=function(e){this._rawModule.namespaced=e.namespaced,e.actions&&(this._rawModule.actions=e.actions),e.mutations&&(this._rawModule.mutations=e.mutations),e.getters&&(this._rawModule.getters=e.getters)},J.prototype.forEachChild=function(e){_(this._children,e)},J.prototype.forEachGetter=function(e){this._rawModule.getters&&_(this._rawModule.getters,e)},J.prototype.forEachAction=function(e){this._rawModule.actions&&_(this._rawModule.actions,e)},J.prototype.forEachMutation=function(e){this._rawModule.mutations&&_(this._rawModule.mutations,e)},Object.defineProperties(J.prototype,X);var Q=function(e){this.register([],e,!1)};function Z(e,t,n){if(t.update(n),n.modules)for(var r in n.modules){if(!t.getChild(r))return void 0;Z(e.concat(r),t.getChild(r),n.modules[r])}}Q.prototype.get=function(e){return e.reduce((function(e,t){return e.getChild(t)}),this.root)},Q.prototype.getNamespace=function(e){var t=this.root;return e.reduce((function(e,n){return t=t.getChild(n),e+(t.namespaced?n+"/":"")}),"")},Q.prototype.update=function(e){Z([],this.root,e)},Q.prototype.register=function(e,t,n){var r=this;void 0===n&&(n=!0);var i=new J(t,n);if(0===e.length)this.root=i;else{var o=this.get(e.slice(0,-1));o.addChild(e[e.length-1],i)}t.modules&&_(t.modules,(function(t,i){r.register(e.concat(i),t,n)}))},Q.prototype.unregister=function(e){var t=this.get(e.slice(0,-1)),n=e[e.length-1],r=t.getChild(n);r&&r.runtime&&t.removeChild(n)},Q.prototype.isRegistered=function(e){var t=this.get(e.slice(0,-1)),n=e[e.length-1];return!!t&&t.hasChild(n)};function ee(e){return new te(e)}var te=function(e){var t=this;void 0===e&&(e={});var n=e.plugins;void 0===n&&(n=[]);var r=e.strict;void 0===r&&(r=!1);var i=e.devtools;this._committing=!1,this._actions=Object.create(null),this._actionSubscribers=[],this._mutations=Object.create(null),this._wrappedGetters=Object.create(null),this._modules=new Q(e),this._modulesNamespaceMap=Object.create(null),this._subscribers=[],this._makeLocalGettersCache=Object.create(null),this._devtools=i;var o=this,s=this,a=s.dispatch,c=s.commit;this.dispatch=function(e,t){return a.call(o,e,t)},this.commit=function(e,t,n){return c.call(o,e,t,n)},this.strict=r;var u=this._modules.root.state;E(this,u,[],this._modules.root),k(this,u),n.forEach((function(e){return e(t)}))},ne={state:{configurable:!0}};te.prototype.install=function(e,t){e.provide(t||m,this),e.config.globalProperties.$store=this;var n=void 0!==this._devtools&&this._devtools;n&&q(e,this)},ne.state.get=function(){return this._state.data},ne.state.set=function(e){0},te.prototype.commit=function(e,t,n){var r=this,i=A(e,t,n),o=i.type,s=i.payload,a=(i.options,{type:o,payload:s}),c=this._mutations[o];c&&(this._withCommit((function(){c.forEach((function(e){e(s)}))})),this._subscribers.slice().forEach((function(e){return e(a,r.state)})))},te.prototype.dispatch=function(e,t){var n=this,r=A(e,t),i=r.type,o=r.payload,s={type:i,payload:o},a=this._actions[i];if(a){try{this._actionSubscribers.slice().filter((function(e){return e.before})).forEach((function(e){return e.before(s,n.state)}))}catch(u){0}var c=a.length>1?Promise.all(a.map((function(e){return e(o)}))):a[0](o);return new Promise((function(e,t){c.then((function(t){try{n._actionSubscribers.filter((function(e){return e.after})).forEach((function(e){return e.after(s,n.state)}))}catch(u){0}e(t)}),(function(e){try{n._actionSubscribers.filter((function(e){return e.error})).forEach((function(t){return t.error(s,n.state,e)}))}catch(u){0}t(e)}))}))}},te.prototype.subscribe=function(e,t){return b(e,this._subscribers,t)},te.prototype.subscribeAction=function(e,t){var n="function"===typeof e?{before:e}:e;return b(n,this._actionSubscribers,t)},te.prototype.watch=function(e,t,n){var i=this;return(0,r.YP)((function(){return e(i.state,i.getters)}),t,Object.assign({},n))},te.prototype.replaceState=function(e){var t=this;this._withCommit((function(){t._state.data=e}))},te.prototype.registerModule=function(e,t,n){void 0===n&&(n={}),"string"===typeof e&&(e=[e]),this._modules.register(e,t),E(this,this.state,e,this._modules.get(e),n.preserveState),k(this,this.state)},te.prototype.unregisterModule=function(e){var t=this;"string"===typeof e&&(e=[e]),this._modules.unregister(e),this._withCommit((function(){var n=R(t.state,e.slice(0,-1));delete n[e[e.length-1]]})),C(this)},te.prototype.hasModule=function(e){return"string"===typeof e&&(e=[e]),this._modules.isRegistered(e)},te.prototype.hotUpdate=function(e){this._modules.update(e),C(this,!0)},te.prototype._withCommit=function(e){var t=this._committing;this._committing=!0,e(),this._committing=t},Object.defineProperties(te.prototype,ne);var re=ae((function(e,t){var n={};return oe(t).forEach((function(t){var r=t.key,i=t.val;n[r]=function(){var t=this.$store.state,n=this.$store.getters;if(e){var r=ce(this.$store,"mapState",e);if(!r)return;t=r.context.state,n=r.context.getters}return"function"===typeof i?i.call(this,t,n):t[i]},n[r].vuex=!0})),n})),ie=ae((function(e,t){var n={};return oe(t).forEach((function(t){var r=t.key,i=t.val;n[r]=function(){var t=[],n=arguments.length;while(n--)t[n]=arguments[n];var r=this.$store.commit;if(e){var o=ce(this.$store,"mapMutations",e);if(!o)return;r=o.context.commit}return"function"===typeof i?i.apply(this,[r].concat(t)):r.apply(this.$store,[i].concat(t))}})),n}));ae((function(e,t){var n={};return oe(t).forEach((function(t){var r=t.key,i=t.val;i=e+i,n[r]=function(){if(!e||ce(this.$store,"mapGetters",e))return this.$store.getters[i]},n[r].vuex=!0})),n})),ae((function(e,t){var n={};return oe(t).forEach((function(t){var r=t.key,i=t.val;n[r]=function(){var t=[],n=arguments.length;while(n--)t[n]=arguments[n];var r=this.$store.dispatch;if(e){var o=ce(this.$store,"mapActions",e);if(!o)return;r=o.context.dispatch}return"function"===typeof i?i.apply(this,[r].concat(t)):r.apply(this.$store,[i].concat(t))}})),n}));function oe(e){return se(e)?Array.isArray(e)?e.map((function(e){return{key:e,val:e}})):Object.keys(e).map((function(t){return{key:t,val:e[t]}})):[]}function se(e){return Array.isArray(e)||v(e)}function ae(e){return function(t,n){return"string"!==typeof t?(n=t,t=""):"/"!==t.charAt(t.length-1)&&(t+="/"),e(t,n)}}function ce(e,t,n){var r=e._modulesNamespaceMap[n];return r}},238:function(e,t,n){"use strict";n.d(t,{Jn:function(){return z},KN:function(){return J},Mq:function(){return Y},Xd:function(){return H},ZF:function(){return G},qX:function(){return W}});var r=n(463),i=n(333),o=n(444),s=n(531);
/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
class a{constructor(e){this.container=e}getPlatformInfoString(){const e=this.container.getProviders();return e.map((e=>{if(c(e)){const t=e.getImmediate();return`${t.library}/${t.version}`}return null})).filter((e=>e)).join(" ")}}function c(e){const t=e.getComponent();return"VERSION"===(null===t||void 0===t?void 0:t.type)}const u="@firebase/app",l="0.9.1",h=new i.Yd("@firebase/app"),d="@firebase/app-compat",f="@firebase/analytics-compat",p="@firebase/analytics",g="@firebase/app-check-compat",m="@firebase/app-check",_="@firebase/auth",v="@firebase/auth-compat",y="@firebase/database",w="@firebase/database-compat",b="@firebase/functions",C="@firebase/functions-compat",k="@firebase/installations",E="@firebase/installations-compat",I="@firebase/messaging",T="@firebase/messaging-compat",S="@firebase/performance",P="@firebase/performance-compat",N="@firebase/remote-config",x="@firebase/remote-config-compat",R="@firebase/storage",A="@firebase/storage-compat",D="@firebase/firestore",O="@firebase/firestore-compat",M="firebase",L="9.16.0",F="[DEFAULT]",q={[u]:"fire-core",[d]:"fire-core-compat",[p]:"fire-analytics",[f]:"fire-analytics-compat",[m]:"fire-app-check",[g]:"fire-app-check-compat",[_]:"fire-auth",[v]:"fire-auth-compat",[y]:"fire-rtdb",[w]:"fire-rtdb-compat",[b]:"fire-fn",[C]:"fire-fn-compat",[k]:"fire-iid",[E]:"fire-iid-compat",[I]:"fire-fcm",[T]:"fire-fcm-compat",[S]:"fire-perf",[P]:"fire-perf-compat",[N]:"fire-rc",[x]:"fire-rc-compat",[R]:"fire-gcs",[A]:"fire-gcs-compat",[D]:"fire-fst",[O]:"fire-fst-compat","fire-js":"fire-js",[M]:"fire-js-all"},B=new Map,j=new Map;function U(e,t){try{e.container.addComponent(t)}catch(n){h.debug(`Component ${t.name} failed to register with FirebaseApp ${e.name}`,n)}}function H(e){const t=e.name;if(j.has(t))return h.debug(`There were multiple attempts to register component ${t}.`),!1;j.set(t,e);for(const n of B.values())U(n,e);return!0}function W(e,t){const n=e.container.getProvider("heartbeat").getImmediate({optional:!0});return n&&n.triggerHeartbeat(),e.container.getProvider(t)}
/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
const $={["no-app"]:"No Firebase App '{$appName}' has been created - call Firebase App.initializeApp()",["bad-app-name"]:"Illegal App name: '{$appName}",["duplicate-app"]:"Firebase App named '{$appName}' already exists with different options or config",["app-deleted"]:"Firebase App named '{$appName}' already deleted",["no-options"]:"Need to provide options, when not being deployed to hosting via source.",["invalid-app-argument"]:"firebase.{$appName}() takes either no argument or a Firebase App instance.",["invalid-log-argument"]:"First argument to `onLog` must be null or a function.",["idb-open"]:"Error thrown when opening IndexedDB. Original error: {$originalErrorMessage}.",["idb-get"]:"Error thrown when reading from IndexedDB. Original error: {$originalErrorMessage}.",["idb-set"]:"Error thrown when writing to IndexedDB. Original error: {$originalErrorMessage}.",["idb-delete"]:"Error thrown when deleting from IndexedDB. Original error: {$originalErrorMessage}."},V=new o.LL("app","Firebase",$);
/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
class K{constructor(e,t,n){this._isDeleted=!1,this._options=Object.assign({},e),this._config=Object.assign({},t),this._name=t.name,this._automaticDataCollectionEnabled=t.automaticDataCollectionEnabled,this._container=n,this.container.addComponent(new r.wA("app",(()=>this),"PUBLIC"))}get automaticDataCollectionEnabled(){return this.checkDestroyed(),this._automaticDataCollectionEnabled}set automaticDataCollectionEnabled(e){this.checkDestroyed(),this._automaticDataCollectionEnabled=e}get name(){return this.checkDestroyed(),this._name}get options(){return this.checkDestroyed(),this._options}get config(){return this.checkDestroyed(),this._config}get container(){return this._container}get isDeleted(){return this._isDeleted}set isDeleted(e){this._isDeleted=e}checkDestroyed(){if(this.isDeleted)throw V.create("app-deleted",{appName:this._name})}}
/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const z=L;function G(e,t={}){let n=e;if("object"!==typeof t){const e=t;t={name:e}}const i=Object.assign({name:F,automaticDataCollectionEnabled:!1},t),s=i.name;if("string"!==typeof s||!s)throw V.create("bad-app-name",{appName:String(s)});if(n||(n=(0,o.aH)()),!n)throw V.create("no-options");const a=B.get(s);if(a){if((0,o.vZ)(n,a.options)&&(0,o.vZ)(i,a.config))return a;throw V.create("duplicate-app",{appName:s})}const c=new r.H0(s);for(const r of j.values())c.addComponent(r);const u=new K(n,i,c);return B.set(s,u),u}function Y(e=F){const t=B.get(e);if(!t&&e===F)return G();if(!t)throw V.create("no-app",{appName:e});return t}function J(e,t,n){var i;let o=null!==(i=q[e])&&void 0!==i?i:e;n&&(o+=`-${n}`);const s=o.match(/\s|\//),a=t.match(/\s|\//);if(s||a){const e=[`Unable to register library "${o}" with version "${t}":`];return s&&e.push(`library name "${o}" contains illegal characters (whitespace or "/")`),s&&a&&e.push("and"),a&&e.push(`version name "${t}" contains illegal characters (whitespace or "/")`),void h.warn(e.join(" "))}H(new r.wA(`${o}-version`,(()=>({library:o,version:t})),"VERSION"))}
/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
const X="firebase-heartbeat-database",Q=1,Z="firebase-heartbeat-store";let ee=null;function te(){return ee||(ee=(0,s.X3)(X,Q,{upgrade:(e,t)=>{switch(t){case 0:e.createObjectStore(Z)}}}).catch((e=>{throw V.create("idb-open",{originalErrorMessage:e.message})}))),ee}async function ne(e){try{const t=await te();return t.transaction(Z).objectStore(Z).get(ie(e))}catch(t){if(t instanceof o.ZR)h.warn(t.message);else{const e=V.create("idb-get",{originalErrorMessage:null===t||void 0===t?void 0:t.message});h.warn(e.message)}}}async function re(e,t){try{const n=await te(),r=n.transaction(Z,"readwrite"),i=r.objectStore(Z);return await i.put(t,ie(e)),r.done}catch(n){if(n instanceof o.ZR)h.warn(n.message);else{const e=V.create("idb-set",{originalErrorMessage:null===n||void 0===n?void 0:n.message});h.warn(e.message)}}}function ie(e){return`${e.name}!${e.options.appId}`}
/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const oe=1024,se=2592e6;class ae{constructor(e){this.container=e,this._heartbeatsCache=null;const t=this.container.getProvider("app").getImmediate();this._storage=new le(t),this._heartbeatsCachePromise=this._storage.read().then((e=>(this._heartbeatsCache=e,e)))}async triggerHeartbeat(){const e=this.container.getProvider("platform-logger").getImmediate(),t=e.getPlatformInfoString(),n=ce();if(null===this._heartbeatsCache&&(this._heartbeatsCache=await this._heartbeatsCachePromise),this._heartbeatsCache.lastSentHeartbeatDate!==n&&!this._heartbeatsCache.heartbeats.some((e=>e.date===n)))return this._heartbeatsCache.heartbeats.push({date:n,agent:t}),this._heartbeatsCache.heartbeats=this._heartbeatsCache.heartbeats.filter((e=>{const t=new Date(e.date).valueOf(),n=Date.now();return n-t<=se})),this._storage.overwrite(this._heartbeatsCache)}async getHeartbeatsHeader(){if(null===this._heartbeatsCache&&await this._heartbeatsCachePromise,null===this._heartbeatsCache||0===this._heartbeatsCache.heartbeats.length)return"";const e=ce(),{heartbeatsToSend:t,unsentEntries:n}=ue(this._heartbeatsCache.heartbeats),r=(0,o.L)(JSON.stringify({version:2,heartbeats:t}));return this._heartbeatsCache.lastSentHeartbeatDate=e,n.length>0?(this._heartbeatsCache.heartbeats=n,await this._storage.overwrite(this._heartbeatsCache)):(this._heartbeatsCache.heartbeats=[],this._storage.overwrite(this._heartbeatsCache)),r}}function ce(){const e=new Date;return e.toISOString().substring(0,10)}function ue(e,t=oe){const n=[];let r=e.slice();for(const i of e){const e=n.find((e=>e.agent===i.agent));if(e){if(e.dates.push(i.date),he(n)>t){e.dates.pop();break}}else if(n.push({agent:i.agent,dates:[i.date]}),he(n)>t){n.pop();break}r=r.slice(1)}return{heartbeatsToSend:n,unsentEntries:r}}class le{constructor(e){this.app=e,this._canUseIndexedDBPromise=this.runIndexedDBEnvironmentCheck()}async runIndexedDBEnvironmentCheck(){return!!(0,o.hl)()&&(0,o.eu)().then((()=>!0)).catch((()=>!1))}async read(){const e=await this._canUseIndexedDBPromise;if(e){const e=await ne(this.app);return e||{heartbeats:[]}}return{heartbeats:[]}}async overwrite(e){var t;const n=await this._canUseIndexedDBPromise;if(n){const n=await this.read();return re(this.app,{lastSentHeartbeatDate:null!==(t=e.lastSentHeartbeatDate)&&void 0!==t?t:n.lastSentHeartbeatDate,heartbeats:e.heartbeats})}}async add(e){var t;const n=await this._canUseIndexedDBPromise;if(n){const n=await this.read();return re(this.app,{lastSentHeartbeatDate:null!==(t=e.lastSentHeartbeatDate)&&void 0!==t?t:n.lastSentHeartbeatDate,heartbeats:[...n.heartbeats,...e.heartbeats]})}}}function he(e){return(0,o.L)(JSON.stringify({version:2,heartbeats:e})).length}
/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function de(e){H(new r.wA("platform-logger",(e=>new a(e)),"PRIVATE")),H(new r.wA("heartbeat",(e=>new ae(e)),"PRIVATE")),J(u,l,e),J(u,l,"esm2017"),J("fire-js","")}de("")},463:function(e,t,n){"use strict";n.d(t,{H0:function(){return u},wA:function(){return i}});var r=n(444);class i{constructor(e,t,n){this.name=e,this.instanceFactory=t,this.type=n,this.multipleInstances=!1,this.serviceProps={},this.instantiationMode="LAZY",this.onInstanceCreated=null}setInstantiationMode(e){return this.instantiationMode=e,this}setMultipleInstances(e){return this.multipleInstances=e,this}setServiceProps(e){return this.serviceProps=e,this}setInstanceCreatedCallback(e){return this.onInstanceCreated=e,this}}
/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const o="[DEFAULT]";
/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class s{constructor(e,t){this.name=e,this.container=t,this.component=null,this.instances=new Map,this.instancesDeferred=new Map,this.instancesOptions=new Map,this.onInitCallbacks=new Map}get(e){const t=this.normalizeInstanceIdentifier(e);if(!this.instancesDeferred.has(t)){const e=new r.BH;if(this.instancesDeferred.set(t,e),this.isInitialized(t)||this.shouldAutoInitialize())try{const n=this.getOrInitializeService({instanceIdentifier:t});n&&e.resolve(n)}catch(n){}}return this.instancesDeferred.get(t).promise}getImmediate(e){var t;const n=this.normalizeInstanceIdentifier(null===e||void 0===e?void 0:e.identifier),r=null!==(t=null===e||void 0===e?void 0:e.optional)&&void 0!==t&&t;if(!this.isInitialized(n)&&!this.shouldAutoInitialize()){if(r)return null;throw Error(`Service ${this.name} is not available`)}try{return this.getOrInitializeService({instanceIdentifier:n})}catch(i){if(r)return null;throw i}}getComponent(){return this.component}setComponent(e){if(e.name!==this.name)throw Error(`Mismatching Component ${e.name} for Provider ${this.name}.`);if(this.component)throw Error(`Component for ${this.name} has already been provided`);if(this.component=e,this.shouldAutoInitialize()){if(c(e))try{this.getOrInitializeService({instanceIdentifier:o})}catch(t){}for(const[e,n]of this.instancesDeferred.entries()){const r=this.normalizeInstanceIdentifier(e);try{const e=this.getOrInitializeService({instanceIdentifier:r});n.resolve(e)}catch(t){}}}}clearInstance(e=o){this.instancesDeferred.delete(e),this.instancesOptions.delete(e),this.instances.delete(e)}async delete(){const e=Array.from(this.instances.values());await Promise.all([...e.filter((e=>"INTERNAL"in e)).map((e=>e.INTERNAL.delete())),...e.filter((e=>"_delete"in e)).map((e=>e._delete()))])}isComponentSet(){return null!=this.component}isInitialized(e=o){return this.instances.has(e)}getOptions(e=o){return this.instancesOptions.get(e)||{}}initialize(e={}){const{options:t={}}=e,n=this.normalizeInstanceIdentifier(e.instanceIdentifier);if(this.isInitialized(n))throw Error(`${this.name}(${n}) has already been initialized`);if(!this.isComponentSet())throw Error(`Component ${this.name} has not been registered yet`);const r=this.getOrInitializeService({instanceIdentifier:n,options:t});for(const[i,o]of this.instancesDeferred.entries()){const e=this.normalizeInstanceIdentifier(i);n===e&&o.resolve(r)}return r}onInit(e,t){var n;const r=this.normalizeInstanceIdentifier(t),i=null!==(n=this.onInitCallbacks.get(r))&&void 0!==n?n:new Set;i.add(e),this.onInitCallbacks.set(r,i);const o=this.instances.get(r);return o&&e(o,r),()=>{i.delete(e)}}invokeOnInitCallbacks(e,t){const n=this.onInitCallbacks.get(t);if(n)for(const i of n)try{i(e,t)}catch(r){}}getOrInitializeService({instanceIdentifier:e,options:t={}}){let n=this.instances.get(e);if(!n&&this.component&&(n=this.component.instanceFactory(this.container,{instanceIdentifier:a(e),options:t}),this.instances.set(e,n),this.instancesOptions.set(e,t),this.invokeOnInitCallbacks(n,e),this.component.onInstanceCreated))try{this.component.onInstanceCreated(this.container,e,n)}catch(r){}return n||null}normalizeInstanceIdentifier(e=o){return this.component?this.component.multipleInstances?e:o:e}shouldAutoInitialize(){return!!this.component&&"EXPLICIT"!==this.component.instantiationMode}}function a(e){return e===o?void 0:e}function c(e){return"EAGER"===e.instantiationMode}
/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class u{constructor(e){this.name=e,this.providers=new Map}addComponent(e){const t=this.getProvider(e.name);if(t.isComponentSet())throw new Error(`Component ${e.name} has already been registered with ${this.name}`);t.setComponent(e)}addOrOverwriteComponent(e){const t=this.getProvider(e.name);t.isComponentSet()&&this.providers.delete(e.name),this.addComponent(e)}getProvider(e){if(this.providers.has(e))return this.providers.get(e);const t=new s(e,this);return this.providers.set(e,t),t}getProviders(){return Array.from(this.providers.values())}}},333:function(e,t,n){"use strict";n.d(t,{Yd:function(){return u},in:function(){return i}});
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
const r=[];var i;(function(e){e[e["DEBUG"]=0]="DEBUG",e[e["VERBOSE"]=1]="VERBOSE",e[e["INFO"]=2]="INFO",e[e["WARN"]=3]="WARN",e[e["ERROR"]=4]="ERROR",e[e["SILENT"]=5]="SILENT"})(i||(i={}));const o={debug:i.DEBUG,verbose:i.VERBOSE,info:i.INFO,warn:i.WARN,error:i.ERROR,silent:i.SILENT},s=i.INFO,a={[i.DEBUG]:"log",[i.VERBOSE]:"log",[i.INFO]:"info",[i.WARN]:"warn",[i.ERROR]:"error"},c=(e,t,...n)=>{if(t<e.logLevel)return;const r=(new Date).toISOString(),i=a[t];if(!i)throw new Error(`Attempted to log a message with an invalid logType (value: ${t})`);console[i](`[${r}]  ${e.name}:`,...n)};class u{constructor(e){this.name=e,this._logLevel=s,this._logHandler=c,this._userLogHandler=null,r.push(this)}get logLevel(){return this._logLevel}set logLevel(e){if(!(e in i))throw new TypeError(`Invalid value "${e}" assigned to \`logLevel\``);this._logLevel=e}setLogLevel(e){this._logLevel="string"===typeof e?o[e]:e}get logHandler(){return this._logHandler}set logHandler(e){if("function"!==typeof e)throw new TypeError("Value assigned to `logHandler` must be a function");this._logHandler=e}get userLogHandler(){return this._userLogHandler}set userLogHandler(e){this._userLogHandler=e}debug(...e){this._userLogHandler&&this._userLogHandler(this,i.DEBUG,...e),this._logHandler(this,i.DEBUG,...e)}log(...e){this._userLogHandler&&this._userLogHandler(this,i.VERBOSE,...e),this._logHandler(this,i.VERBOSE,...e)}info(...e){this._userLogHandler&&this._userLogHandler(this,i.INFO,...e),this._logHandler(this,i.INFO,...e)}warn(...e){this._userLogHandler&&this._userLogHandler(this,i.WARN,...e),this._logHandler(this,i.WARN,...e)}error(...e){this._userLogHandler&&this._userLogHandler(this,i.ERROR,...e),this._logHandler(this,i.ERROR,...e)}}},977:function(e,t,n){"use strict";n.d(t,{ZF:function(){return r.ZF}});var r=n(238),i="firebase",o="9.16.0";
/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
(0,r.KN)(i,o,"app")},355:function(e,t,n){"use strict";n.d(t,{iU:function(){return Bs},U2:function(){return Hs},N8:function(){return Qs},VF:function(){return js},iH:function(){return qs},t8:function(){return Us}});var r=n(238),i=n(463),o=n(444),s=n(333);const a="@firebase/database",c="0.14.1";
/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
let u="";function l(e){u=e}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class h{constructor(e){this.domStorage_=e,this.prefix_="firebase:"}set(e,t){null==t?this.domStorage_.removeItem(this.prefixedName_(e)):this.domStorage_.setItem(this.prefixedName_(e),(0,o.Wl)(t))}get(e){const t=this.domStorage_.getItem(this.prefixedName_(e));return null==t?null:(0,o.cI)(t)}remove(e){this.domStorage_.removeItem(this.prefixedName_(e))}prefixedName_(e){return this.prefix_+e}toString(){return this.domStorage_.toString()}}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class d{constructor(){this.cache_={},this.isInMemoryStorage=!0}set(e,t){null==t?delete this.cache_[e]:this.cache_[e]=t}get(e){return(0,o.r3)(this.cache_,e)?this.cache_[e]:null}remove(e){delete this.cache_[e]}}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const f=function(e){try{if("undefined"!==typeof window&&"undefined"!==typeof window[e]){const t=window[e];return t.setItem("firebase:sentinel","cache"),t.removeItem("firebase:sentinel"),new h(t)}}catch(t){}return new d},p=f("localStorage"),g=f("sessionStorage"),m=new s.Yd("@firebase/database"),_=function(){let e=1;return function(){return e++}}(),v=function(e){const t=(0,o.dS)(e),n=new o.gQ;n.update(t);const r=n.digest();return o.US.encodeByteArray(r)},y=function(...e){let t="";for(let n=0;n<e.length;n++){const r=e[n];Array.isArray(r)||r&&"object"===typeof r&&"number"===typeof r.length?t+=y.apply(null,r):t+="object"===typeof r?(0,o.Wl)(r):r,t+=" "}return t};let w=null,b=!0;const C=function(e,t){(0,o.hu)(!t||!0===e||!1===e,"Can't turn on custom loggers persistently."),!0===e?(m.logLevel=s["in"].VERBOSE,w=m.log.bind(m),t&&g.set("logging_enabled",!0)):"function"===typeof e?w=e:(w=null,g.remove("logging_enabled"))},k=function(...e){if(!0===b&&(b=!1,null===w&&!0===g.get("logging_enabled")&&C(!0)),w){const t=y.apply(null,e);w(t)}},E=function(e){return function(...t){k(e,...t)}},I=function(...e){const t="FIREBASE INTERNAL ERROR: "+y(...e);m.error(t)},T=function(...e){const t=`FIREBASE FATAL ERROR: ${y(...e)}`;throw m.error(t),new Error(t)},S=function(...e){const t="FIREBASE WARNING: "+y(...e);m.warn(t)},P=function(){"undefined"!==typeof window&&window.location&&window.location.protocol&&-1!==window.location.protocol.indexOf("https:")&&S("Insecure Firebase access from a secure page. Please use https in calls to new Firebase().")},N=function(e){return"number"===typeof e&&(e!==e||e===Number.POSITIVE_INFINITY||e===Number.NEGATIVE_INFINITY)},x=function(e){if((0,o.Yr)()||"complete"===document.readyState)e();else{let t=!1;const n=function(){document.body?t||(t=!0,e()):setTimeout(n,Math.floor(10))};document.addEventListener?(document.addEventListener("DOMContentLoaded",n,!1),window.addEventListener("load",n,!1)):document.attachEvent&&(document.attachEvent("onreadystatechange",(()=>{"complete"===document.readyState&&n()})),window.attachEvent("onload",n))}},R="[MIN_NAME]",A="[MAX_NAME]",D=function(e,t){if(e===t)return 0;if(e===R||t===A)return-1;if(t===R||e===A)return 1;{const n=K(e),r=K(t);return null!==n?null!==r?n-r===0?e.length-t.length:n-r:-1:null!==r?1:e<t?-1:1}},O=function(e,t){return e===t?0:e<t?-1:1},M=function(e,t){if(t&&e in t)return t[e];throw new Error("Missing required key ("+e+") in object: "+(0,o.Wl)(t))},L=function(e){if("object"!==typeof e||null===e)return(0,o.Wl)(e);const t=[];for(const r in e)t.push(r);t.sort();let n="{";for(let r=0;r<t.length;r++)0!==r&&(n+=","),n+=(0,o.Wl)(t[r]),n+=":",n+=L(e[t[r]]);return n+="}",n},F=function(e,t){const n=e.length;if(n<=t)return[e];const r=[];for(let i=0;i<n;i+=t)i+t>n?r.push(e.substring(i,n)):r.push(e.substring(i,i+t));return r};function q(e,t){for(const n in e)e.hasOwnProperty(n)&&t(n,e[n])}const B=function(e){(0,o.hu)(!N(e),"Invalid JSON number");const t=11,n=52,r=(1<<t-1)-1;let i,s,a,c,u;0===e?(s=0,a=0,i=1/e===-1/0?1:0):(i=e<0,e=Math.abs(e),e>=Math.pow(2,1-r)?(c=Math.min(Math.floor(Math.log(e)/Math.LN2),r),s=c+r,a=Math.round(e*Math.pow(2,n-c)-Math.pow(2,n))):(s=0,a=Math.round(e/Math.pow(2,1-r-n))));const l=[];for(u=n;u;u-=1)l.push(a%2?1:0),a=Math.floor(a/2);for(u=t;u;u-=1)l.push(s%2?1:0),s=Math.floor(s/2);l.push(i?1:0),l.reverse();const h=l.join("");let d="";for(u=0;u<64;u+=8){let e=parseInt(h.substr(u,8),2).toString(16);1===e.length&&(e="0"+e),d+=e}return d.toLowerCase()},j=function(){return!("object"!==typeof window||!window["chrome"]||!window["chrome"]["extension"]||/^chrome/.test(window.location.href))},U=function(){return"object"===typeof Windows&&"object"===typeof Windows.UI};function H(e,t){let n="Unknown Error";"too_big"===e?n="The data requested exceeds the maximum size that can be accessed with a single request.":"permission_denied"===e?n="Client doesn't have permission to access the desired data.":"unavailable"===e&&(n="The service is unavailable");const r=new Error(e+" at "+t._path.toString()+": "+n);return r.code=e.toUpperCase(),r}const W=new RegExp("^-?(0*)\\d{1,10}$"),$=-2147483648,V=2147483647,K=function(e){if(W.test(e)){const t=Number(e);if(t>=$&&t<=V)return t}return null},z=function(e){try{e()}catch(t){setTimeout((()=>{const e=t.stack||"";throw S("Exception was thrown by user callback.",e),t}),Math.floor(0))}},G=function(){const e="object"===typeof window&&window["navigator"]&&window["navigator"]["userAgent"]||"";return e.search(/googlebot|google webmaster tools|bingbot|yahoo! slurp|baiduspider|yandexbot|duckduckbot/i)>=0},Y=function(e,t){const n=setTimeout(e,t);return"number"===typeof n&&"undefined"!==typeof Deno&&Deno["unrefTimer"]?Deno.unrefTimer(n):"object"===typeof n&&n["unref"]&&n["unref"](),n};
/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
class J{constructor(e,t){this.appName_=e,this.appCheckProvider=t,this.appCheck=null===t||void 0===t?void 0:t.getImmediate({optional:!0}),this.appCheck||null===t||void 0===t||t.get().then((e=>this.appCheck=e))}getToken(e){return this.appCheck?this.appCheck.getToken(e):new Promise(((t,n)=>{setTimeout((()=>{this.appCheck?this.getToken(e).then(t,n):t(null)}),0)}))}addTokenChangeListener(e){var t;null===(t=this.appCheckProvider)||void 0===t||t.get().then((t=>t.addTokenListener(e)))}notifyForInvalidToken(){S(`Provided AppCheck credentials for the app named "${this.appName_}" are invalid. This usually indicates your app was not initialized correctly.`)}}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class X{constructor(e,t,n){this.appName_=e,this.firebaseOptions_=t,this.authProvider_=n,this.auth_=null,this.auth_=n.getImmediate({optional:!0}),this.auth_||n.onInit((e=>this.auth_=e))}getToken(e){return this.auth_?this.auth_.getToken(e).catch((e=>e&&"auth/token-not-initialized"===e.code?(k("Got auth/token-not-initialized error.  Treating as null token."),null):Promise.reject(e))):new Promise(((t,n)=>{setTimeout((()=>{this.auth_?this.getToken(e).then(t,n):t(null)}),0)}))}addTokenChangeListener(e){this.auth_?this.auth_.addAuthTokenListener(e):this.authProvider_.get().then((t=>t.addAuthTokenListener(e)))}removeTokenChangeListener(e){this.authProvider_.get().then((t=>t.removeAuthTokenListener(e)))}notifyForInvalidToken(){let e='Provided authentication credentials for the app named "'+this.appName_+'" are invalid. This usually indicates your app was not initialized correctly. ';"credential"in this.firebaseOptions_?e+='Make sure the "credential" property provided to initializeApp() is authorized to access the specified "databaseURL" and is from the correct project.':"serviceAccount"in this.firebaseOptions_?e+='Make sure the "serviceAccount" property provided to initializeApp() is authorized to access the specified "databaseURL" and is from the correct project.':e+='Make sure the "apiKey" and "databaseURL" properties provided to initializeApp() match the values provided for your app at https://console.firebase.google.com/.',S(e)}}class Q{constructor(e){this.accessToken=e}getToken(e){return Promise.resolve({accessToken:this.accessToken})}addTokenChangeListener(e){e(this.accessToken)}removeTokenChangeListener(e){}notifyForInvalidToken(){}}Q.OWNER="owner";
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
const Z="5",ee="v",te="s",ne="r",re="f",ie=/(console\.firebase|firebase-console-\w+\.corp|firebase\.corp)\.google\.com/,oe="ls",se="p",ae="ac",ce="websocket",ue="long_polling";
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
class le{constructor(e,t,n,r,i=!1,o="",s=!1){this.secure=t,this.namespace=n,this.webSocketOnly=r,this.nodeAdmin=i,this.persistenceKey=o,this.includeNamespaceInQueryParams=s,this._host=e.toLowerCase(),this._domain=this._host.substr(this._host.indexOf(".")+1),this.internalHost=p.get("host:"+e)||this._host}isCacheableHost(){return"s-"===this.internalHost.substr(0,2)}isCustomHost(){return"firebaseio.com"!==this._domain&&"firebaseio-demo.com"!==this._domain}get host(){return this._host}set host(e){e!==this.internalHost&&(this.internalHost=e,this.isCacheableHost()&&p.set("host:"+this._host,this.internalHost))}toString(){let e=this.toURLString();return this.persistenceKey&&(e+="<"+this.persistenceKey+">"),e}toURLString(){const e=this.secure?"https://":"http://",t=this.includeNamespaceInQueryParams?`?ns=${this.namespace}`:"";return`${e}${this.host}/${t}`}}function he(e){return e.host!==e.internalHost||e.isCustomHost()||e.includeNamespaceInQueryParams}function de(e,t,n){let r;if((0,o.hu)("string"===typeof t,"typeof type must == string"),(0,o.hu)("object"===typeof n,"typeof params must == object"),t===ce)r=(e.secure?"wss://":"ws://")+e.internalHost+"/.ws?";else{if(t!==ue)throw new Error("Unknown connection type: "+t);r=(e.secure?"https://":"http://")+e.internalHost+"/.lp?"}he(e)&&(n["ns"]=e.namespace);const i=[];return q(n,((e,t)=>{i.push(e+"="+t)})),r+i.join("&")}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class fe{constructor(){this.counters_={}}incrementCounter(e,t=1){(0,o.r3)(this.counters_,e)||(this.counters_[e]=0),this.counters_[e]+=t}get(){return(0,o.p$)(this.counters_)}}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const pe={},ge={};function me(e){const t=e.toString();return pe[t]||(pe[t]=new fe),pe[t]}function _e(e,t){const n=e.toString();return ge[n]||(ge[n]=t()),ge[n]}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class ve{constructor(e){this.onMessage_=e,this.pendingResponses=[],this.currentResponseNum=0,this.closeAfterResponse=-1,this.onClose=null}closeAfter(e,t){this.closeAfterResponse=e,this.onClose=t,this.closeAfterResponse<this.currentResponseNum&&(this.onClose(),this.onClose=null)}handleResponse(e,t){this.pendingResponses[e]=t;while(this.pendingResponses[this.currentResponseNum]){const e=this.pendingResponses[this.currentResponseNum];delete this.pendingResponses[this.currentResponseNum];for(let t=0;t<e.length;++t)e[t]&&z((()=>{this.onMessage_(e[t])}));if(this.currentResponseNum===this.closeAfterResponse){this.onClose&&(this.onClose(),this.onClose=null);break}this.currentResponseNum++}}}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const ye="start",we="close",be="pLPCommand",Ce="pRTLPCB",ke="id",Ee="pw",Ie="ser",Te="cb",Se="seg",Pe="ts",Ne="d",xe="dframe",Re=1870,Ae=30,De=Re-Ae,Oe=25e3,Me=3e4;class Le{constructor(e,t,n,r,i,o,s){this.connId=e,this.repoInfo=t,this.applicationId=n,this.appCheckToken=r,this.authToken=i,this.transportSessionId=o,this.lastSessionId=s,this.bytesSent=0,this.bytesReceived=0,this.everConnected_=!1,this.log_=E(e),this.stats_=me(t),this.urlFn=e=>(this.appCheckToken&&(e[ae]=this.appCheckToken),de(t,ue,e))}open(e,t){this.curSegmentNum=0,this.onDisconnect_=t,this.myPacketOrderer=new ve(e),this.isClosed_=!1,this.connectTimeoutTimer_=setTimeout((()=>{this.log_("Timed out trying to connect."),this.onClosed_(),this.connectTimeoutTimer_=null}),Math.floor(Me)),x((()=>{if(this.isClosed_)return;this.scriptTagHolder=new Fe(((...e)=>{const[t,n,r,i,o]=e;if(this.incrementIncomingBytes_(e),this.scriptTagHolder)if(this.connectTimeoutTimer_&&(clearTimeout(this.connectTimeoutTimer_),this.connectTimeoutTimer_=null),this.everConnected_=!0,t===ye)this.id=n,this.password=r;else{if(t!==we)throw new Error("Unrecognized command received: "+t);n?(this.scriptTagHolder.sendNewPolls=!1,this.myPacketOrderer.closeAfter(n,(()=>{this.onClosed_()}))):this.onClosed_()}}),((...e)=>{const[t,n]=e;this.incrementIncomingBytes_(e),this.myPacketOrderer.handleResponse(t,n)}),(()=>{this.onClosed_()}),this.urlFn);const e={};e[ye]="t",e[Ie]=Math.floor(1e8*Math.random()),this.scriptTagHolder.uniqueCallbackIdentifier&&(e[Te]=this.scriptTagHolder.uniqueCallbackIdentifier),e[ee]=Z,this.transportSessionId&&(e[te]=this.transportSessionId),this.lastSessionId&&(e[oe]=this.lastSessionId),this.applicationId&&(e[se]=this.applicationId),this.appCheckToken&&(e[ae]=this.appCheckToken),"undefined"!==typeof location&&location.hostname&&ie.test(location.hostname)&&(e[ne]=re);const t=this.urlFn(e);this.log_("Connecting via long-poll to "+t),this.scriptTagHolder.addTag(t,(()=>{}))}))}start(){this.scriptTagHolder.startLongPoll(this.id,this.password),this.addDisconnectPingFrame(this.id,this.password)}static forceAllow(){Le.forceAllow_=!0}static forceDisallow(){Le.forceDisallow_=!0}static isAvailable(){return!(0,o.Yr)()&&(!!Le.forceAllow_||!Le.forceDisallow_&&"undefined"!==typeof document&&null!=document.createElement&&!j()&&!U())}markConnectionHealthy(){}shutdown_(){this.isClosed_=!0,this.scriptTagHolder&&(this.scriptTagHolder.close(),this.scriptTagHolder=null),this.myDisconnFrame&&(document.body.removeChild(this.myDisconnFrame),this.myDisconnFrame=null),this.connectTimeoutTimer_&&(clearTimeout(this.connectTimeoutTimer_),this.connectTimeoutTimer_=null)}onClosed_(){this.isClosed_||(this.log_("Longpoll is closing itself"),this.shutdown_(),this.onDisconnect_&&(this.onDisconnect_(this.everConnected_),this.onDisconnect_=null))}close(){this.isClosed_||(this.log_("Longpoll is being closed."),this.shutdown_())}send(e){const t=(0,o.Wl)(e);this.bytesSent+=t.length,this.stats_.incrementCounter("bytes_sent",t.length);const n=(0,o.h$)(t),r=F(n,De);for(let i=0;i<r.length;i++)this.scriptTagHolder.enqueueSegment(this.curSegmentNum,r.length,r[i]),this.curSegmentNum++}addDisconnectPingFrame(e,t){if((0,o.Yr)())return;this.myDisconnFrame=document.createElement("iframe");const n={};n[xe]="t",n[ke]=e,n[Ee]=t,this.myDisconnFrame.src=this.urlFn(n),this.myDisconnFrame.style.display="none",document.body.appendChild(this.myDisconnFrame)}incrementIncomingBytes_(e){const t=(0,o.Wl)(e).length;this.bytesReceived+=t,this.stats_.incrementCounter("bytes_received",t)}}class Fe{constructor(e,t,n,r){if(this.onDisconnect=n,this.urlFn=r,this.outstandingRequests=new Set,this.pendingSegs=[],this.currentSerial=Math.floor(1e8*Math.random()),this.sendNewPolls=!0,(0,o.Yr)())this.commandCB=e,this.onMessageCB=t;else{this.uniqueCallbackIdentifier=_(),window[be+this.uniqueCallbackIdentifier]=e,window[Ce+this.uniqueCallbackIdentifier]=t,this.myIFrame=Fe.createIFrame_();let n="";if(this.myIFrame.src&&"javascript:"===this.myIFrame.src.substr(0,"javascript:".length)){const e=document.domain;n='<script>document.domain="'+e+'";<\/script>'}const r="<html><body>"+n+"</body></html>";try{this.myIFrame.doc.open(),this.myIFrame.doc.write(r),this.myIFrame.doc.close()}catch(i){k("frame writing exception"),i.stack&&k(i.stack),k(i)}}}static createIFrame_(){const e=document.createElement("iframe");if(e.style.display="none",!document.body)throw"Document body has not initialized. Wait to initialize Firebase until after the document is ready.";document.body.appendChild(e);try{const t=e.contentWindow.document;t||k("No IE domain setting required")}catch(t){const n=document.domain;e.src="javascript:void((function(){document.open();document.domain='"+n+"';document.close();})())"}return e.contentDocument?e.doc=e.contentDocument:e.contentWindow?e.doc=e.contentWindow.document:e.document&&(e.doc=e.document),e}close(){this.alive=!1,this.myIFrame&&(this.myIFrame.doc.body.textContent="",setTimeout((()=>{null!==this.myIFrame&&(document.body.removeChild(this.myIFrame),this.myIFrame=null)}),Math.floor(0)));const e=this.onDisconnect;e&&(this.onDisconnect=null,e())}startLongPoll(e,t){this.myID=e,this.myPW=t,this.alive=!0;while(this.newRequest_());}newRequest_(){if(this.alive&&this.sendNewPolls&&this.outstandingRequests.size<(this.pendingSegs.length>0?2:1)){this.currentSerial++;const e={};e[ke]=this.myID,e[Ee]=this.myPW,e[Ie]=this.currentSerial;let t=this.urlFn(e),n="",r=0;while(this.pendingSegs.length>0){const e=this.pendingSegs[0];if(!(e.d.length+Ae+n.length<=Re))break;{const e=this.pendingSegs.shift();n=n+"&"+Se+r+"="+e.seg+"&"+Pe+r+"="+e.ts+"&"+Ne+r+"="+e.d,r++}}return t+=n,this.addLongPollTag_(t,this.currentSerial),!0}return!1}enqueueSegment(e,t,n){this.pendingSegs.push({seg:e,ts:t,d:n}),this.alive&&this.newRequest_()}addLongPollTag_(e,t){this.outstandingRequests.add(t);const n=()=>{this.outstandingRequests.delete(t),this.newRequest_()},r=setTimeout(n,Math.floor(Oe)),i=()=>{clearTimeout(r),n()};this.addTag(e,i)}addTag(e,t){(0,o.Yr)()?this.doNodeLongPoll(e,t):setTimeout((()=>{try{if(!this.sendNewPolls)return;const n=this.myIFrame.doc.createElement("script");n.type="text/javascript",n.async=!0,n.src=e,n.onload=n.onreadystatechange=function(){const e=n.readyState;e&&"loaded"!==e&&"complete"!==e||(n.onload=n.onreadystatechange=null,n.parentNode&&n.parentNode.removeChild(n),t())},n.onerror=()=>{k("Long-poll script failed to load: "+e),this.sendNewPolls=!1,this.close()},this.myIFrame.doc.body.appendChild(n)}catch(n){}}),Math.floor(1))}}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const qe=16384,Be=45e3;let je=null;"undefined"!==typeof MozWebSocket?je=MozWebSocket:"undefined"!==typeof WebSocket&&(je=WebSocket);class Ue{constructor(e,t,n,r,i,o,s){this.connId=e,this.applicationId=n,this.appCheckToken=r,this.authToken=i,this.keepaliveTimer=null,this.frames=null,this.totalFrames=0,this.bytesSent=0,this.bytesReceived=0,this.log_=E(this.connId),this.stats_=me(t),this.connURL=Ue.connectionURL_(t,o,s,r,n),this.nodeAdmin=t.nodeAdmin}static connectionURL_(e,t,n,r,i){const s={};return s[ee]=Z,!(0,o.Yr)()&&"undefined"!==typeof location&&location.hostname&&ie.test(location.hostname)&&(s[ne]=re),t&&(s[te]=t),n&&(s[oe]=n),r&&(s[ae]=r),i&&(s[se]=i),de(e,ce,s)}open(e,t){this.onDisconnect=t,this.onMessage=e,this.log_("Websocket connecting to "+this.connURL),this.everConnected_=!1,p.set("previous_websocket_failure",!0);try{let e;if((0,o.Yr)()){const t=this.nodeAdmin?"AdminNode":"Node";e={headers:{"User-Agent":`Firebase/${Z}/${u}/${process.platform}/${t}`,"X-Firebase-GMPID":this.applicationId||""}},this.authToken&&(e.headers["Authorization"]=`Bearer ${this.authToken}`),this.appCheckToken&&(e.headers["X-Firebase-AppCheck"]=this.appCheckToken);const n={NODE_ENV:"production",BASE_URL:"/petanque-swiss-vue/dist/"},r=0===this.connURL.indexOf("wss://")?n["HTTPS_PROXY"]||n["https_proxy"]:n["HTTP_PROXY"]||n["http_proxy"];r&&(e["proxy"]={origin:r})}this.mySock=new je(this.connURL,[],e)}catch(n){this.log_("Error instantiating WebSocket.");const e=n.message||n.data;return e&&this.log_(e),void this.onClosed_()}this.mySock.onopen=()=>{this.log_("Websocket connected."),this.everConnected_=!0},this.mySock.onclose=()=>{this.log_("Websocket connection was disconnected."),this.mySock=null,this.onClosed_()},this.mySock.onmessage=e=>{this.handleIncomingFrame(e)},this.mySock.onerror=e=>{this.log_("WebSocket error.  Closing connection.");const t=e.message||e.data;t&&this.log_(t),this.onClosed_()}}start(){}static forceDisallow(){Ue.forceDisallow_=!0}static isAvailable(){let e=!1;if("undefined"!==typeof navigator&&navigator.userAgent){const t=/Android ([0-9]{0,}\.[0-9]{0,})/,n=navigator.userAgent.match(t);n&&n.length>1&&parseFloat(n[1])<4.4&&(e=!0)}return!e&&null!==je&&!Ue.forceDisallow_}static previouslyFailed(){return p.isInMemoryStorage||!0===p.get("previous_websocket_failure")}markConnectionHealthy(){p.remove("previous_websocket_failure")}appendFrame_(e){if(this.frames.push(e),this.frames.length===this.totalFrames){const e=this.frames.join("");this.frames=null;const t=(0,o.cI)(e);this.onMessage(t)}}handleNewFrameCount_(e){this.totalFrames=e,this.frames=[]}extractFrameCount_(e){if((0,o.hu)(null===this.frames,"We already have a frame buffer"),e.length<=6){const t=Number(e);if(!isNaN(t))return this.handleNewFrameCount_(t),null}return this.handleNewFrameCount_(1),e}handleIncomingFrame(e){if(null===this.mySock)return;const t=e["data"];if(this.bytesReceived+=t.length,this.stats_.incrementCounter("bytes_received",t.length),this.resetKeepAlive(),null!==this.frames)this.appendFrame_(t);else{const e=this.extractFrameCount_(t);null!==e&&this.appendFrame_(e)}}send(e){this.resetKeepAlive();const t=(0,o.Wl)(e);this.bytesSent+=t.length,this.stats_.incrementCounter("bytes_sent",t.length);const n=F(t,qe);n.length>1&&this.sendString_(String(n.length));for(let r=0;r<n.length;r++)this.sendString_(n[r])}shutdown_(){this.isClosed_=!0,this.keepaliveTimer&&(clearInterval(this.keepaliveTimer),this.keepaliveTimer=null),this.mySock&&(this.mySock.close(),this.mySock=null)}onClosed_(){this.isClosed_||(this.log_("WebSocket is closing itself"),this.shutdown_(),this.onDisconnect&&(this.onDisconnect(this.everConnected_),this.onDisconnect=null))}close(){this.isClosed_||(this.log_("WebSocket is being closed"),this.shutdown_())}resetKeepAlive(){clearInterval(this.keepaliveTimer),this.keepaliveTimer=setInterval((()=>{this.mySock&&this.sendString_("0"),this.resetKeepAlive()}),Math.floor(Be))}sendString_(e){try{this.mySock.send(e)}catch(t){this.log_("Exception thrown from WebSocket.send():",t.message||t.data,"Closing connection."),setTimeout(this.onClosed_.bind(this),0)}}}Ue.responsesRequiredToBeHealthy=2,Ue.healthyTimeout=3e4;
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
class He{constructor(e){this.initTransports_(e)}static get ALL_TRANSPORTS(){return[Le,Ue]}static get IS_TRANSPORT_INITIALIZED(){return this.globalTransportInitialized_}initTransports_(e){const t=Ue&&Ue["isAvailable"]();let n=t&&!Ue.previouslyFailed();if(e.webSocketOnly&&(t||S("wss:// URL used, but browser isn't known to support websockets.  Trying anyway."),n=!0),n)this.transports_=[Ue];else{const e=this.transports_=[];for(const t of He.ALL_TRANSPORTS)t&&t["isAvailable"]()&&e.push(t);He.globalTransportInitialized_=!0}}initialTransport(){if(this.transports_.length>0)return this.transports_[0];throw new Error("No transports available")}upgradeTransport(){return this.transports_.length>1?this.transports_[1]:null}}He.globalTransportInitialized_=!1;
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
const We=6e4,$e=5e3,Ve=10240,Ke=102400,ze="t",Ge="d",Ye="s",Je="r",Xe="e",Qe="o",Ze="a",et="n",tt="p",nt="h";class rt{constructor(e,t,n,r,i,o,s,a,c,u){this.id=e,this.repoInfo_=t,this.applicationId_=n,this.appCheckToken_=r,this.authToken_=i,this.onMessage_=o,this.onReady_=s,this.onDisconnect_=a,this.onKill_=c,this.lastSessionId=u,this.connectionCount=0,this.pendingDataMessages=[],this.state_=0,this.log_=E("c:"+this.id+":"),this.transportManager_=new He(t),this.log_("Connection created"),this.start_()}start_(){const e=this.transportManager_.initialTransport();this.conn_=new e(this.nextTransportId_(),this.repoInfo_,this.applicationId_,this.appCheckToken_,this.authToken_,null,this.lastSessionId),this.primaryResponsesRequired_=e["responsesRequiredToBeHealthy"]||0;const t=this.connReceiver_(this.conn_),n=this.disconnReceiver_(this.conn_);this.tx_=this.conn_,this.rx_=this.conn_,this.secondaryConn_=null,this.isHealthy_=!1,setTimeout((()=>{this.conn_&&this.conn_.open(t,n)}),Math.floor(0));const r=e["healthyTimeout"]||0;r>0&&(this.healthyTimeout_=Y((()=>{this.healthyTimeout_=null,this.isHealthy_||(this.conn_&&this.conn_.bytesReceived>Ke?(this.log_("Connection exceeded healthy timeout but has received "+this.conn_.bytesReceived+" bytes.  Marking connection healthy."),this.isHealthy_=!0,this.conn_.markConnectionHealthy()):this.conn_&&this.conn_.bytesSent>Ve?this.log_("Connection exceeded healthy timeout but has sent "+this.conn_.bytesSent+" bytes.  Leaving connection alive."):(this.log_("Closing unhealthy connection after timeout."),this.close()))}),Math.floor(r)))}nextTransportId_(){return"c:"+this.id+":"+this.connectionCount++}disconnReceiver_(e){return t=>{e===this.conn_?this.onConnectionLost_(t):e===this.secondaryConn_?(this.log_("Secondary connection lost."),this.onSecondaryConnectionLost_()):this.log_("closing an old connection")}}connReceiver_(e){return t=>{2!==this.state_&&(e===this.rx_?this.onPrimaryMessageReceived_(t):e===this.secondaryConn_?this.onSecondaryMessageReceived_(t):this.log_("message on old connection"))}}sendRequest(e){const t={t:"d",d:e};this.sendData_(t)}tryCleanupConnection(){this.tx_===this.secondaryConn_&&this.rx_===this.secondaryConn_&&(this.log_("cleaning up and promoting a connection: "+this.secondaryConn_.connId),this.conn_=this.secondaryConn_,this.secondaryConn_=null)}onSecondaryControl_(e){if(ze in e){const t=e[ze];t===Ze?this.upgradeIfSecondaryHealthy_():t===Je?(this.log_("Got a reset on secondary, closing it"),this.secondaryConn_.close(),this.tx_!==this.secondaryConn_&&this.rx_!==this.secondaryConn_||this.close()):t===Qe&&(this.log_("got pong on secondary."),this.secondaryResponsesRequired_--,this.upgradeIfSecondaryHealthy_())}}onSecondaryMessageReceived_(e){const t=M("t",e),n=M("d",e);if("c"===t)this.onSecondaryControl_(n);else{if("d"!==t)throw new Error("Unknown protocol layer: "+t);this.pendingDataMessages.push(n)}}upgradeIfSecondaryHealthy_(){this.secondaryResponsesRequired_<=0?(this.log_("Secondary connection is healthy."),this.isHealthy_=!0,this.secondaryConn_.markConnectionHealthy(),this.proceedWithUpgrade_()):(this.log_("sending ping on secondary."),this.secondaryConn_.send({t:"c",d:{t:tt,d:{}}}))}proceedWithUpgrade_(){this.secondaryConn_.start(),this.log_("sending client ack on secondary"),this.secondaryConn_.send({t:"c",d:{t:Ze,d:{}}}),this.log_("Ending transmission on primary"),this.conn_.send({t:"c",d:{t:et,d:{}}}),this.tx_=this.secondaryConn_,this.tryCleanupConnection()}onPrimaryMessageReceived_(e){const t=M("t",e),n=M("d",e);"c"===t?this.onControl_(n):"d"===t&&this.onDataMessage_(n)}onDataMessage_(e){this.onPrimaryResponse_(),this.onMessage_(e)}onPrimaryResponse_(){this.isHealthy_||(this.primaryResponsesRequired_--,this.primaryResponsesRequired_<=0&&(this.log_("Primary connection is healthy."),this.isHealthy_=!0,this.conn_.markConnectionHealthy()))}onControl_(e){const t=M(ze,e);if(Ge in e){const n=e[Ge];if(t===nt)this.onHandshake_(n);else if(t===et){this.log_("recvd end transmission on primary"),this.rx_=this.secondaryConn_;for(let e=0;e<this.pendingDataMessages.length;++e)this.onDataMessage_(this.pendingDataMessages[e]);this.pendingDataMessages=[],this.tryCleanupConnection()}else t===Ye?this.onConnectionShutdown_(n):t===Je?this.onReset_(n):t===Xe?I("Server Error: "+n):t===Qe?(this.log_("got pong on primary."),this.onPrimaryResponse_(),this.sendPingOnPrimaryIfNecessary_()):I("Unknown control packet command: "+t)}}onHandshake_(e){const t=e.ts,n=e.v,r=e.h;this.sessionId=e.s,this.repoInfo_.host=r,0===this.state_&&(this.conn_.start(),this.onConnectionEstablished_(this.conn_,t),Z!==n&&S("Protocol version mismatch detected"),this.tryStartUpgrade_())}tryStartUpgrade_(){const e=this.transportManager_.upgradeTransport();e&&this.startUpgrade_(e)}startUpgrade_(e){this.secondaryConn_=new e(this.nextTransportId_(),this.repoInfo_,this.applicationId_,this.appCheckToken_,this.authToken_,this.sessionId),this.secondaryResponsesRequired_=e["responsesRequiredToBeHealthy"]||0;const t=this.connReceiver_(this.secondaryConn_),n=this.disconnReceiver_(this.secondaryConn_);this.secondaryConn_.open(t,n),Y((()=>{this.secondaryConn_&&(this.log_("Timed out trying to upgrade."),this.secondaryConn_.close())}),Math.floor(We))}onReset_(e){this.log_("Reset packet received.  New host: "+e),this.repoInfo_.host=e,1===this.state_?this.close():(this.closeConnections_(),this.start_())}onConnectionEstablished_(e,t){this.log_("Realtime connection established."),this.conn_=e,this.state_=1,this.onReady_&&(this.onReady_(t,this.sessionId),this.onReady_=null),0===this.primaryResponsesRequired_?(this.log_("Primary connection is healthy."),this.isHealthy_=!0):Y((()=>{this.sendPingOnPrimaryIfNecessary_()}),Math.floor($e))}sendPingOnPrimaryIfNecessary_(){this.isHealthy_||1!==this.state_||(this.log_("sending ping on primary."),this.sendData_({t:"c",d:{t:tt,d:{}}}))}onSecondaryConnectionLost_(){const e=this.secondaryConn_;this.secondaryConn_=null,this.tx_!==e&&this.rx_!==e||this.close()}onConnectionLost_(e){this.conn_=null,e||0!==this.state_?1===this.state_&&this.log_("Realtime connection lost."):(this.log_("Realtime connection failed."),this.repoInfo_.isCacheableHost()&&(p.remove("host:"+this.repoInfo_.host),this.repoInfo_.internalHost=this.repoInfo_.host)),this.close()}onConnectionShutdown_(e){this.log_("Connection shutdown command received. Shutting down..."),this.onKill_&&(this.onKill_(e),this.onKill_=null),this.onDisconnect_=null,this.close()}sendData_(e){if(1!==this.state_)throw"Connection is not connected";this.tx_.send(e)}close(){2!==this.state_&&(this.log_("Closing realtime connection."),this.state_=2,this.closeConnections_(),this.onDisconnect_&&(this.onDisconnect_(),this.onDisconnect_=null))}closeConnections_(){this.log_("Shutting down all connections"),this.conn_&&(this.conn_.close(),this.conn_=null),this.secondaryConn_&&(this.secondaryConn_.close(),this.secondaryConn_=null),this.healthyTimeout_&&(clearTimeout(this.healthyTimeout_),this.healthyTimeout_=null)}}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class it{put(e,t,n,r){}merge(e,t,n,r){}refreshAuthToken(e){}refreshAppCheckToken(e){}onDisconnectPut(e,t,n){}onDisconnectMerge(e,t,n){}onDisconnectCancel(e,t){}reportStats(e){}}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class ot{constructor(e){this.allowedEvents_=e,this.listeners_={},(0,o.hu)(Array.isArray(e)&&e.length>0,"Requires a non-empty array")}trigger(e,...t){if(Array.isArray(this.listeners_[e])){const n=[...this.listeners_[e]];for(let e=0;e<n.length;e++)n[e].callback.apply(n[e].context,t)}}on(e,t,n){this.validateEventType_(e),this.listeners_[e]=this.listeners_[e]||[],this.listeners_[e].push({callback:t,context:n});const r=this.getInitialEvent(e);r&&t.apply(n,r)}off(e,t,n){this.validateEventType_(e);const r=this.listeners_[e]||[];for(let i=0;i<r.length;i++)if(r[i].callback===t&&(!n||n===r[i].context))return void r.splice(i,1)}validateEventType_(e){(0,o.hu)(this.allowedEvents_.find((t=>t===e)),"Unknown event: "+e)}}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class st extends ot{constructor(){super(["online"]),this.online_=!0,"undefined"===typeof window||"undefined"===typeof window.addEventListener||(0,o.uI)()||(window.addEventListener("online",(()=>{this.online_||(this.online_=!0,this.trigger("online",!0))}),!1),window.addEventListener("offline",(()=>{this.online_&&(this.online_=!1,this.trigger("online",!1))}),!1))}static getInstance(){return new st}getInitialEvent(e){return(0,o.hu)("online"===e,"Unknown event type: "+e),[this.online_]}currentlyOnline(){return this.online_}}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const at=32,ct=768;class ut{constructor(e,t){if(void 0===t){this.pieces_=e.split("/");let t=0;for(let e=0;e<this.pieces_.length;e++)this.pieces_[e].length>0&&(this.pieces_[t]=this.pieces_[e],t++);this.pieces_.length=t,this.pieceNum_=0}else this.pieces_=e,this.pieceNum_=t}toString(){let e="";for(let t=this.pieceNum_;t<this.pieces_.length;t++)""!==this.pieces_[t]&&(e+="/"+this.pieces_[t]);return e||"/"}}function lt(){return new ut("")}function ht(e){return e.pieceNum_>=e.pieces_.length?null:e.pieces_[e.pieceNum_]}function dt(e){return e.pieces_.length-e.pieceNum_}function ft(e){let t=e.pieceNum_;return t<e.pieces_.length&&t++,new ut(e.pieces_,t)}function pt(e){return e.pieceNum_<e.pieces_.length?e.pieces_[e.pieces_.length-1]:null}function gt(e){let t="";for(let n=e.pieceNum_;n<e.pieces_.length;n++)""!==e.pieces_[n]&&(t+="/"+encodeURIComponent(String(e.pieces_[n])));return t||"/"}function mt(e,t=0){return e.pieces_.slice(e.pieceNum_+t)}function _t(e){if(e.pieceNum_>=e.pieces_.length)return null;const t=[];for(let n=e.pieceNum_;n<e.pieces_.length-1;n++)t.push(e.pieces_[n]);return new ut(t,0)}function vt(e,t){const n=[];for(let r=e.pieceNum_;r<e.pieces_.length;r++)n.push(e.pieces_[r]);if(t instanceof ut)for(let r=t.pieceNum_;r<t.pieces_.length;r++)n.push(t.pieces_[r]);else{const e=t.split("/");for(let t=0;t<e.length;t++)e[t].length>0&&n.push(e[t])}return new ut(n,0)}function yt(e){return e.pieceNum_>=e.pieces_.length}function wt(e,t){const n=ht(e),r=ht(t);if(null===n)return t;if(n===r)return wt(ft(e),ft(t));throw new Error("INTERNAL ERROR: innerPath ("+t+") is not within outerPath ("+e+")")}function bt(e,t){if(dt(e)!==dt(t))return!1;for(let n=e.pieceNum_,r=t.pieceNum_;n<=e.pieces_.length;n++,r++)if(e.pieces_[n]!==t.pieces_[r])return!1;return!0}function Ct(e,t){let n=e.pieceNum_,r=t.pieceNum_;if(dt(e)>dt(t))return!1;while(n<e.pieces_.length){if(e.pieces_[n]!==t.pieces_[r])return!1;++n,++r}return!0}class kt{constructor(e,t){this.errorPrefix_=t,this.parts_=mt(e,0),this.byteLength_=Math.max(1,this.parts_.length);for(let n=0;n<this.parts_.length;n++)this.byteLength_+=(0,o.ug)(this.parts_[n]);Tt(this)}}function Et(e,t){e.parts_.length>0&&(e.byteLength_+=1),e.parts_.push(t),e.byteLength_+=(0,o.ug)(t),Tt(e)}function It(e){const t=e.parts_.pop();e.byteLength_-=(0,o.ug)(t),e.parts_.length>0&&(e.byteLength_-=1)}function Tt(e){if(e.byteLength_>ct)throw new Error(e.errorPrefix_+"has a key path longer than "+ct+" bytes ("+e.byteLength_+").");if(e.parts_.length>at)throw new Error(e.errorPrefix_+"path specified exceeds the maximum depth that can be written ("+at+") or object contains a cycle "+St(e))}function St(e){return 0===e.parts_.length?"":"in property '"+e.parts_.join(".")+"'"}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Pt extends ot{constructor(){let e,t;super(["visible"]),"undefined"!==typeof document&&"undefined"!==typeof document.addEventListener&&("undefined"!==typeof document["hidden"]?(t="visibilitychange",e="hidden"):"undefined"!==typeof document["mozHidden"]?(t="mozvisibilitychange",e="mozHidden"):"undefined"!==typeof document["msHidden"]?(t="msvisibilitychange",e="msHidden"):"undefined"!==typeof document["webkitHidden"]&&(t="webkitvisibilitychange",e="webkitHidden")),this.visible_=!0,t&&document.addEventListener(t,(()=>{const t=!document[e];t!==this.visible_&&(this.visible_=t,this.trigger("visible",t))}),!1)}static getInstance(){return new Pt}getInitialEvent(e){return(0,o.hu)("visible"===e,"Unknown event type: "+e),[this.visible_]}}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Nt=1e3,xt=3e5,Rt=3e4,At=1.3,Dt=3e4,Ot="server_kill",Mt=3;class Lt extends it{constructor(e,t,n,r,i,s,a,c){if(super(),this.repoInfo_=e,this.applicationId_=t,this.onDataUpdate_=n,this.onConnectStatus_=r,this.onServerInfoUpdate_=i,this.authTokenProvider_=s,this.appCheckTokenProvider_=a,this.authOverride_=c,this.id=Lt.nextPersistentConnectionId_++,this.log_=E("p:"+this.id+":"),this.interruptReasons_={},this.listens=new Map,this.outstandingPuts_=[],this.outstandingGets_=[],this.outstandingPutCount_=0,this.outstandingGetCount_=0,this.onDisconnectRequestQueue_=[],this.connected_=!1,this.reconnectDelay_=Nt,this.maxReconnectDelay_=xt,this.securityDebugCallback_=null,this.lastSessionId=null,this.establishConnectionTimer_=null,this.visible_=!1,this.requestCBHash_={},this.requestNumber_=0,this.realtime_=null,this.authToken_=null,this.appCheckToken_=null,this.forceTokenRefresh_=!1,this.invalidAuthTokenCount_=0,this.invalidAppCheckTokenCount_=0,this.firstConnection_=!0,this.lastConnectionAttemptTime_=null,this.lastConnectionEstablishedTime_=null,c&&!(0,o.Yr)())throw new Error("Auth override specified in options, but not supported on non Node.js platforms");Pt.getInstance().on("visible",this.onVisible_,this),-1===e.host.indexOf("fblocal")&&st.getInstance().on("online",this.onOnline_,this)}sendRequest(e,t,n){const r=++this.requestNumber_,i={r:r,a:e,b:t};this.log_((0,o.Wl)(i)),(0,o.hu)(this.connected_,"sendRequest call when we're not connected not allowed."),this.realtime_.sendRequest(i),n&&(this.requestCBHash_[r]=n)}get(e){this.initConnection_();const t=new o.BH,n={p:e._path.toString(),q:e._queryObject},r={action:"g",request:n,onComplete:e=>{const n=e["d"];"ok"===e["s"]?t.resolve(n):t.reject(n)}};this.outstandingGets_.push(r),this.outstandingGetCount_++;const i=this.outstandingGets_.length-1;return this.connected_&&this.sendGet_(i),t.promise}listen(e,t,n,r){this.initConnection_();const i=e._queryIdentifier,s=e._path.toString();this.log_("Listen called for "+s+" "+i),this.listens.has(s)||this.listens.set(s,new Map),(0,o.hu)(e._queryParams.isDefault()||!e._queryParams.loadsAllData(),"listen() called for non-default but complete query"),(0,o.hu)(!this.listens.get(s).has(i),"listen() called twice for same path/queryId.");const a={onComplete:r,hashFn:t,query:e,tag:n};this.listens.get(s).set(i,a),this.connected_&&this.sendListen_(a)}sendGet_(e){const t=this.outstandingGets_[e];this.sendRequest("g",t.request,(n=>{delete this.outstandingGets_[e],this.outstandingGetCount_--,0===this.outstandingGetCount_&&(this.outstandingGets_=[]),t.onComplete&&t.onComplete(n)}))}sendListen_(e){const t=e.query,n=t._path.toString(),r=t._queryIdentifier;this.log_("Listen on "+n+" for "+r);const i={p:n},o="q";e.tag&&(i["q"]=t._queryObject,i["t"]=e.tag),i["h"]=e.hashFn(),this.sendRequest(o,i,(i=>{const o=i["d"],s=i["s"];Lt.warnOnListenWarnings_(o,t);const a=this.listens.get(n)&&this.listens.get(n).get(r);a===e&&(this.log_("listen response",i),"ok"!==s&&this.removeListen_(n,r),e.onComplete&&e.onComplete(s,o))}))}static warnOnListenWarnings_(e,t){if(e&&"object"===typeof e&&(0,o.r3)(e,"w")){const n=(0,o.DV)(e,"w");if(Array.isArray(n)&&~n.indexOf("no_index")){const e='".indexOn": "'+t._queryParams.getIndex().toString()+'"',n=t._path.toString();S(`Using an unspecified index. Your data will be downloaded and filtered on the client. Consider adding ${e} at ${n} to your security rules for better performance.`)}}}refreshAuthToken(e){this.authToken_=e,this.log_("Auth token refreshed"),this.authToken_?this.tryAuth():this.connected_&&this.sendRequest("unauth",{},(()=>{})),this.reduceReconnectDelayIfAdminCredential_(e)}reduceReconnectDelayIfAdminCredential_(e){const t=e&&40===e.length;(t||(0,o.GJ)(e))&&(this.log_("Admin auth credential detected.  Reducing max reconnect time."),this.maxReconnectDelay_=Rt)}refreshAppCheckToken(e){this.appCheckToken_=e,this.log_("App check token refreshed"),this.appCheckToken_?this.tryAppCheck():this.connected_&&this.sendRequest("unappeck",{},(()=>{}))}tryAuth(){if(this.connected_&&this.authToken_){const e=this.authToken_,t=(0,o.w9)(e)?"auth":"gauth",n={cred:e};null===this.authOverride_?n["noauth"]=!0:"object"===typeof this.authOverride_&&(n["authvar"]=this.authOverride_),this.sendRequest(t,n,(t=>{const n=t["s"],r=t["d"]||"error";this.authToken_===e&&("ok"===n?this.invalidAuthTokenCount_=0:this.onAuthRevoked_(n,r))}))}}tryAppCheck(){this.connected_&&this.appCheckToken_&&this.sendRequest("appcheck",{token:this.appCheckToken_},(e=>{const t=e["s"],n=e["d"]||"error";"ok"===t?this.invalidAppCheckTokenCount_=0:this.onAppCheckRevoked_(t,n)}))}unlisten(e,t){const n=e._path.toString(),r=e._queryIdentifier;this.log_("Unlisten called for "+n+" "+r),(0,o.hu)(e._queryParams.isDefault()||!e._queryParams.loadsAllData(),"unlisten() called for non-default but complete query");const i=this.removeListen_(n,r);i&&this.connected_&&this.sendUnlisten_(n,r,e._queryObject,t)}sendUnlisten_(e,t,n,r){this.log_("Unlisten on "+e+" for "+t);const i={p:e},o="n";r&&(i["q"]=n,i["t"]=r),this.sendRequest(o,i)}onDisconnectPut(e,t,n){this.initConnection_(),this.connected_?this.sendOnDisconnect_("o",e,t,n):this.onDisconnectRequestQueue_.push({pathString:e,action:"o",data:t,onComplete:n})}onDisconnectMerge(e,t,n){this.initConnection_(),this.connected_?this.sendOnDisconnect_("om",e,t,n):this.onDisconnectRequestQueue_.push({pathString:e,action:"om",data:t,onComplete:n})}onDisconnectCancel(e,t){this.initConnection_(),this.connected_?this.sendOnDisconnect_("oc",e,null,t):this.onDisconnectRequestQueue_.push({pathString:e,action:"oc",data:null,onComplete:t})}sendOnDisconnect_(e,t,n,r){const i={p:t,d:n};this.log_("onDisconnect "+e,i),this.sendRequest(e,i,(e=>{r&&setTimeout((()=>{r(e["s"],e["d"])}),Math.floor(0))}))}put(e,t,n,r){this.putInternal("p",e,t,n,r)}merge(e,t,n,r){this.putInternal("m",e,t,n,r)}putInternal(e,t,n,r,i){this.initConnection_();const o={p:t,d:n};void 0!==i&&(o["h"]=i),this.outstandingPuts_.push({action:e,request:o,onComplete:r}),this.outstandingPutCount_++;const s=this.outstandingPuts_.length-1;this.connected_?this.sendPut_(s):this.log_("Buffering put: "+t)}sendPut_(e){const t=this.outstandingPuts_[e].action,n=this.outstandingPuts_[e].request,r=this.outstandingPuts_[e].onComplete;this.outstandingPuts_[e].queued=this.connected_,this.sendRequest(t,n,(n=>{this.log_(t+" response",n),delete this.outstandingPuts_[e],this.outstandingPutCount_--,0===this.outstandingPutCount_&&(this.outstandingPuts_=[]),r&&r(n["s"],n["d"])}))}reportStats(e){if(this.connected_){const t={c:e};this.log_("reportStats",t),this.sendRequest("s",t,(e=>{const t=e["s"];if("ok"!==t){const t=e["d"];this.log_("reportStats","Error sending stats: "+t)}}))}}onDataMessage_(e){if("r"in e){this.log_("from server: "+(0,o.Wl)(e));const t=e["r"],n=this.requestCBHash_[t];n&&(delete this.requestCBHash_[t],n(e["b"]))}else{if("error"in e)throw"A server-side error has occurred: "+e["error"];"a"in e&&this.onDataPush_(e["a"],e["b"])}}onDataPush_(e,t){this.log_("handleServerMessage",e,t),"d"===e?this.onDataUpdate_(t["p"],t["d"],!1,t["t"]):"m"===e?this.onDataUpdate_(t["p"],t["d"],!0,t["t"]):"c"===e?this.onListenRevoked_(t["p"],t["q"]):"ac"===e?this.onAuthRevoked_(t["s"],t["d"]):"apc"===e?this.onAppCheckRevoked_(t["s"],t["d"]):"sd"===e?this.onSecurityDebugPacket_(t):I("Unrecognized action received from server: "+(0,o.Wl)(e)+"\nAre you using the latest client?")}onReady_(e,t){this.log_("connection ready"),this.connected_=!0,this.lastConnectionEstablishedTime_=(new Date).getTime(),this.handleTimestamp_(e),this.lastSessionId=t,this.firstConnection_&&this.sendConnectStats_(),this.restoreState_(),this.firstConnection_=!1,this.onConnectStatus_(!0)}scheduleConnect_(e){(0,o.hu)(!this.realtime_,"Scheduling a connect when we're already connected/ing?"),this.establishConnectionTimer_&&clearTimeout(this.establishConnectionTimer_),this.establishConnectionTimer_=setTimeout((()=>{this.establishConnectionTimer_=null,this.establishConnection_()}),Math.floor(e))}initConnection_(){!this.realtime_&&this.firstConnection_&&this.scheduleConnect_(0)}onVisible_(e){e&&!this.visible_&&this.reconnectDelay_===this.maxReconnectDelay_&&(this.log_("Window became visible.  Reducing delay."),this.reconnectDelay_=Nt,this.realtime_||this.scheduleConnect_(0)),this.visible_=e}onOnline_(e){e?(this.log_("Browser went online."),this.reconnectDelay_=Nt,this.realtime_||this.scheduleConnect_(0)):(this.log_("Browser went offline.  Killing connection."),this.realtime_&&this.realtime_.close())}onRealtimeDisconnect_(){if(this.log_("data client disconnected"),this.connected_=!1,this.realtime_=null,this.cancelSentTransactions_(),this.requestCBHash_={},this.shouldReconnect_()){if(this.visible_){if(this.lastConnectionEstablishedTime_){const e=(new Date).getTime()-this.lastConnectionEstablishedTime_;e>Dt&&(this.reconnectDelay_=Nt),this.lastConnectionEstablishedTime_=null}}else this.log_("Window isn't visible.  Delaying reconnect."),this.reconnectDelay_=this.maxReconnectDelay_,this.lastConnectionAttemptTime_=(new Date).getTime();const e=(new Date).getTime()-this.lastConnectionAttemptTime_;let t=Math.max(0,this.reconnectDelay_-e);t=Math.random()*t,this.log_("Trying to reconnect in "+t+"ms"),this.scheduleConnect_(t),this.reconnectDelay_=Math.min(this.maxReconnectDelay_,this.reconnectDelay_*At)}this.onConnectStatus_(!1)}async establishConnection_(){if(this.shouldReconnect_()){this.log_("Making a connection attempt"),this.lastConnectionAttemptTime_=(new Date).getTime(),this.lastConnectionEstablishedTime_=null;const e=this.onDataMessage_.bind(this),t=this.onReady_.bind(this),n=this.onRealtimeDisconnect_.bind(this),r=this.id+":"+Lt.nextConnectionId_++,i=this.lastSessionId;let s=!1,a=null;const c=function(){a?a.close():(s=!0,n())},u=function(e){(0,o.hu)(a,"sendRequest call when we're not connected not allowed."),a.sendRequest(e)};this.realtime_={close:c,sendRequest:u};const l=this.forceTokenRefresh_;this.forceTokenRefresh_=!1;try{const[o,c]=await Promise.all([this.authTokenProvider_.getToken(l),this.appCheckTokenProvider_.getToken(l)]);s?k("getToken() completed but was canceled"):(k("getToken() completed. Creating connection."),this.authToken_=o&&o.accessToken,this.appCheckToken_=c&&c.token,a=new rt(r,this.repoInfo_,this.applicationId_,this.appCheckToken_,this.authToken_,e,t,n,(e=>{S(e+" ("+this.repoInfo_.toString()+")"),this.interrupt(Ot)}),i))}catch(I){this.log_("Failed to get token: "+I),s||(this.repoInfo_.nodeAdmin&&S(I),c())}}}interrupt(e){k("Interrupting connection for reason: "+e),this.interruptReasons_[e]=!0,this.realtime_?this.realtime_.close():(this.establishConnectionTimer_&&(clearTimeout(this.establishConnectionTimer_),this.establishConnectionTimer_=null),this.connected_&&this.onRealtimeDisconnect_())}resume(e){k("Resuming connection for reason: "+e),delete this.interruptReasons_[e],(0,o.xb)(this.interruptReasons_)&&(this.reconnectDelay_=Nt,this.realtime_||this.scheduleConnect_(0))}handleTimestamp_(e){const t=e-(new Date).getTime();this.onServerInfoUpdate_({serverTimeOffset:t})}cancelSentTransactions_(){for(let e=0;e<this.outstandingPuts_.length;e++){const t=this.outstandingPuts_[e];t&&"h"in t.request&&t.queued&&(t.onComplete&&t.onComplete("disconnect"),delete this.outstandingPuts_[e],this.outstandingPutCount_--)}0===this.outstandingPutCount_&&(this.outstandingPuts_=[])}onListenRevoked_(e,t){let n;n=t?t.map((e=>L(e))).join("$"):"default";const r=this.removeListen_(e,n);r&&r.onComplete&&r.onComplete("permission_denied")}removeListen_(e,t){const n=new ut(e).toString();let r;if(this.listens.has(n)){const e=this.listens.get(n);r=e.get(t),e.delete(t),0===e.size&&this.listens.delete(n)}else r=void 0;return r}onAuthRevoked_(e,t){k("Auth token revoked: "+e+"/"+t),this.authToken_=null,this.forceTokenRefresh_=!0,this.realtime_.close(),"invalid_token"!==e&&"permission_denied"!==e||(this.invalidAuthTokenCount_++,this.invalidAuthTokenCount_>=Mt&&(this.reconnectDelay_=Rt,this.authTokenProvider_.notifyForInvalidToken()))}onAppCheckRevoked_(e,t){k("App check token revoked: "+e+"/"+t),this.appCheckToken_=null,this.forceTokenRefresh_=!0,"invalid_token"!==e&&"permission_denied"!==e||(this.invalidAppCheckTokenCount_++,this.invalidAppCheckTokenCount_>=Mt&&this.appCheckTokenProvider_.notifyForInvalidToken())}onSecurityDebugPacket_(e){this.securityDebugCallback_?this.securityDebugCallback_(e):"msg"in e&&console.log("FIREBASE: "+e["msg"].replace("\n","\nFIREBASE: "))}restoreState_(){this.tryAuth(),this.tryAppCheck();for(const e of this.listens.values())for(const t of e.values())this.sendListen_(t);for(let e=0;e<this.outstandingPuts_.length;e++)this.outstandingPuts_[e]&&this.sendPut_(e);while(this.onDisconnectRequestQueue_.length){const e=this.onDisconnectRequestQueue_.shift();this.sendOnDisconnect_(e.action,e.pathString,e.data,e.onComplete)}for(let e=0;e<this.outstandingGets_.length;e++)this.outstandingGets_[e]&&this.sendGet_(e)}sendConnectStats_(){const e={};let t="js";(0,o.Yr)()&&(t=this.repoInfo_.nodeAdmin?"admin_node":"node"),e["sdk."+t+"."+u.replace(/\./g,"-")]=1,(0,o.uI)()?e["framework.cordova"]=1:(0,o.b$)()&&(e["framework.reactnative"]=1),this.reportStats(e)}shouldReconnect_(){const e=st.getInstance().currentlyOnline();return(0,o.xb)(this.interruptReasons_)&&e}}Lt.nextPersistentConnectionId_=0,Lt.nextConnectionId_=0;
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
class Ft{constructor(e,t){this.name=e,this.node=t}static Wrap(e,t){return new Ft(e,t)}}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class qt{getCompare(){return this.compare.bind(this)}indexedValueChanged(e,t){const n=new Ft(R,e),r=new Ft(R,t);return 0!==this.compare(n,r)}minPost(){return Ft.MIN}}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */let Bt;class jt extends qt{static get __EMPTY_NODE(){return Bt}static set __EMPTY_NODE(e){Bt=e}compare(e,t){return D(e.name,t.name)}isDefinedOn(e){throw(0,o.g5)("KeyIndex.isDefinedOn not expected to be called.")}indexedValueChanged(e,t){return!1}minPost(){return Ft.MIN}maxPost(){return new Ft(A,Bt)}makePost(e,t){return(0,o.hu)("string"===typeof e,"KeyIndex indexValue must always be a string."),new Ft(e,Bt)}toString(){return".key"}}const Ut=new jt;
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ht{constructor(e,t,n,r,i=null){this.isReverse_=r,this.resultGenerator_=i,this.nodeStack_=[];let o=1;while(!e.isEmpty())if(o=t?n(e.key,t):1,r&&(o*=-1),o<0)e=this.isReverse_?e.left:e.right;else{if(0===o){this.nodeStack_.push(e);break}this.nodeStack_.push(e),e=this.isReverse_?e.right:e.left}}getNext(){if(0===this.nodeStack_.length)return null;let e,t=this.nodeStack_.pop();if(e=this.resultGenerator_?this.resultGenerator_(t.key,t.value):{key:t.key,value:t.value},this.isReverse_){t=t.left;while(!t.isEmpty())this.nodeStack_.push(t),t=t.right}else{t=t.right;while(!t.isEmpty())this.nodeStack_.push(t),t=t.left}return e}hasNext(){return this.nodeStack_.length>0}peek(){if(0===this.nodeStack_.length)return null;const e=this.nodeStack_[this.nodeStack_.length-1];return this.resultGenerator_?this.resultGenerator_(e.key,e.value):{key:e.key,value:e.value}}}class Wt{constructor(e,t,n,r,i){this.key=e,this.value=t,this.color=null!=n?n:Wt.RED,this.left=null!=r?r:Vt.EMPTY_NODE,this.right=null!=i?i:Vt.EMPTY_NODE}copy(e,t,n,r,i){return new Wt(null!=e?e:this.key,null!=t?t:this.value,null!=n?n:this.color,null!=r?r:this.left,null!=i?i:this.right)}count(){return this.left.count()+1+this.right.count()}isEmpty(){return!1}inorderTraversal(e){return this.left.inorderTraversal(e)||!!e(this.key,this.value)||this.right.inorderTraversal(e)}reverseTraversal(e){return this.right.reverseTraversal(e)||e(this.key,this.value)||this.left.reverseTraversal(e)}min_(){return this.left.isEmpty()?this:this.left.min_()}minKey(){return this.min_().key}maxKey(){return this.right.isEmpty()?this.key:this.right.maxKey()}insert(e,t,n){let r=this;const i=n(e,r.key);return r=i<0?r.copy(null,null,null,r.left.insert(e,t,n),null):0===i?r.copy(null,t,null,null,null):r.copy(null,null,null,null,r.right.insert(e,t,n)),r.fixUp_()}removeMin_(){if(this.left.isEmpty())return Vt.EMPTY_NODE;let e=this;return e.left.isRed_()||e.left.left.isRed_()||(e=e.moveRedLeft_()),e=e.copy(null,null,null,e.left.removeMin_(),null),e.fixUp_()}remove(e,t){let n,r;if(n=this,t(e,n.key)<0)n.left.isEmpty()||n.left.isRed_()||n.left.left.isRed_()||(n=n.moveRedLeft_()),n=n.copy(null,null,null,n.left.remove(e,t),null);else{if(n.left.isRed_()&&(n=n.rotateRight_()),n.right.isEmpty()||n.right.isRed_()||n.right.left.isRed_()||(n=n.moveRedRight_()),0===t(e,n.key)){if(n.right.isEmpty())return Vt.EMPTY_NODE;r=n.right.min_(),n=n.copy(r.key,r.value,null,null,n.right.removeMin_())}n=n.copy(null,null,null,null,n.right.remove(e,t))}return n.fixUp_()}isRed_(){return this.color}fixUp_(){let e=this;return e.right.isRed_()&&!e.left.isRed_()&&(e=e.rotateLeft_()),e.left.isRed_()&&e.left.left.isRed_()&&(e=e.rotateRight_()),e.left.isRed_()&&e.right.isRed_()&&(e=e.colorFlip_()),e}moveRedLeft_(){let e=this.colorFlip_();return e.right.left.isRed_()&&(e=e.copy(null,null,null,null,e.right.rotateRight_()),e=e.rotateLeft_(),e=e.colorFlip_()),e}moveRedRight_(){let e=this.colorFlip_();return e.left.left.isRed_()&&(e=e.rotateRight_(),e=e.colorFlip_()),e}rotateLeft_(){const e=this.copy(null,null,Wt.RED,null,this.right.left);return this.right.copy(null,null,this.color,e,null)}rotateRight_(){const e=this.copy(null,null,Wt.RED,this.left.right,null);return this.left.copy(null,null,this.color,null,e)}colorFlip_(){const e=this.left.copy(null,null,!this.left.color,null,null),t=this.right.copy(null,null,!this.right.color,null,null);return this.copy(null,null,!this.color,e,t)}checkMaxDepth_(){const e=this.check_();return Math.pow(2,e)<=this.count()+1}check_(){if(this.isRed_()&&this.left.isRed_())throw new Error("Red node has red child("+this.key+","+this.value+")");if(this.right.isRed_())throw new Error("Right child of ("+this.key+","+this.value+") is red");const e=this.left.check_();if(e!==this.right.check_())throw new Error("Black depths differ");return e+(this.isRed_()?0:1)}}Wt.RED=!0,Wt.BLACK=!1;class $t{copy(e,t,n,r,i){return this}insert(e,t,n){return new Wt(e,t,null)}remove(e,t){return this}count(){return 0}isEmpty(){return!0}inorderTraversal(e){return!1}reverseTraversal(e){return!1}minKey(){return null}maxKey(){return null}check_(){return 0}isRed_(){return!1}}class Vt{constructor(e,t=Vt.EMPTY_NODE){this.comparator_=e,this.root_=t}insert(e,t){return new Vt(this.comparator_,this.root_.insert(e,t,this.comparator_).copy(null,null,Wt.BLACK,null,null))}remove(e){return new Vt(this.comparator_,this.root_.remove(e,this.comparator_).copy(null,null,Wt.BLACK,null,null))}get(e){let t,n=this.root_;while(!n.isEmpty()){if(t=this.comparator_(e,n.key),0===t)return n.value;t<0?n=n.left:t>0&&(n=n.right)}return null}getPredecessorKey(e){let t,n=this.root_,r=null;while(!n.isEmpty()){if(t=this.comparator_(e,n.key),0===t){if(n.left.isEmpty())return r?r.key:null;n=n.left;while(!n.right.isEmpty())n=n.right;return n.key}t<0?n=n.left:t>0&&(r=n,n=n.right)}throw new Error("Attempted to find predecessor key for a nonexistent key.  What gives?")}isEmpty(){return this.root_.isEmpty()}count(){return this.root_.count()}minKey(){return this.root_.minKey()}maxKey(){return this.root_.maxKey()}inorderTraversal(e){return this.root_.inorderTraversal(e)}reverseTraversal(e){return this.root_.reverseTraversal(e)}getIterator(e){return new Ht(this.root_,null,this.comparator_,!1,e)}getIteratorFrom(e,t){return new Ht(this.root_,e,this.comparator_,!1,t)}getReverseIteratorFrom(e,t){return new Ht(this.root_,e,this.comparator_,!0,t)}getReverseIterator(e){return new Ht(this.root_,null,this.comparator_,!0,e)}}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
function Kt(e,t){return D(e.name,t.name)}function zt(e,t){return D(e,t)}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */let Gt;function Yt(e){Gt=e}Vt.EMPTY_NODE=new $t;const Jt=function(e){return"number"===typeof e?"number:"+B(e):"string:"+e},Xt=function(e){if(e.isLeafNode()){const t=e.val();(0,o.hu)("string"===typeof t||"number"===typeof t||"object"===typeof t&&(0,o.r3)(t,".sv"),"Priority must be a string or number.")}else(0,o.hu)(e===Gt||e.isEmpty(),"priority of unexpected type.");(0,o.hu)(e===Gt||e.getPriority().isEmpty(),"Priority nodes can't have a priority of their own.")};
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
let Qt,Zt,en;class tn{constructor(e,t=tn.__childrenNodeConstructor.EMPTY_NODE){this.value_=e,this.priorityNode_=t,this.lazyHash_=null,(0,o.hu)(void 0!==this.value_&&null!==this.value_,"LeafNode shouldn't be created with null/undefined value."),Xt(this.priorityNode_)}static set __childrenNodeConstructor(e){Qt=e}static get __childrenNodeConstructor(){return Qt}isLeafNode(){return!0}getPriority(){return this.priorityNode_}updatePriority(e){return new tn(this.value_,e)}getImmediateChild(e){return".priority"===e?this.priorityNode_:tn.__childrenNodeConstructor.EMPTY_NODE}getChild(e){return yt(e)?this:".priority"===ht(e)?this.priorityNode_:tn.__childrenNodeConstructor.EMPTY_NODE}hasChild(){return!1}getPredecessorChildName(e,t){return null}updateImmediateChild(e,t){return".priority"===e?this.updatePriority(t):t.isEmpty()&&".priority"!==e?this:tn.__childrenNodeConstructor.EMPTY_NODE.updateImmediateChild(e,t).updatePriority(this.priorityNode_)}updateChild(e,t){const n=ht(e);return null===n?t:t.isEmpty()&&".priority"!==n?this:((0,o.hu)(".priority"!==n||1===dt(e),".priority must be the last token in a path"),this.updateImmediateChild(n,tn.__childrenNodeConstructor.EMPTY_NODE.updateChild(ft(e),t)))}isEmpty(){return!1}numChildren(){return 0}forEachChild(e,t){return!1}val(e){return e&&!this.getPriority().isEmpty()?{".value":this.getValue(),".priority":this.getPriority().val()}:this.getValue()}hash(){if(null===this.lazyHash_){let e="";this.priorityNode_.isEmpty()||(e+="priority:"+Jt(this.priorityNode_.val())+":");const t=typeof this.value_;e+=t+":",e+="number"===t?B(this.value_):this.value_,this.lazyHash_=v(e)}return this.lazyHash_}getValue(){return this.value_}compareTo(e){return e===tn.__childrenNodeConstructor.EMPTY_NODE?1:e instanceof tn.__childrenNodeConstructor?-1:((0,o.hu)(e.isLeafNode(),"Unknown node type"),this.compareToLeafNode_(e))}compareToLeafNode_(e){const t=typeof e.value_,n=typeof this.value_,r=tn.VALUE_TYPE_ORDER.indexOf(t),i=tn.VALUE_TYPE_ORDER.indexOf(n);return(0,o.hu)(r>=0,"Unknown leaf type: "+t),(0,o.hu)(i>=0,"Unknown leaf type: "+n),r===i?"object"===n?0:this.value_<e.value_?-1:this.value_===e.value_?0:1:i-r}withIndex(){return this}isIndexed(){return!0}equals(e){if(e===this)return!0;if(e.isLeafNode()){const t=e;return this.value_===t.value_&&this.priorityNode_.equals(t.priorityNode_)}return!1}}function nn(e){Zt=e}function rn(e){en=e}tn.VALUE_TYPE_ORDER=["object","boolean","number","string"];class on extends qt{compare(e,t){const n=e.node.getPriority(),r=t.node.getPriority(),i=n.compareTo(r);return 0===i?D(e.name,t.name):i}isDefinedOn(e){return!e.getPriority().isEmpty()}indexedValueChanged(e,t){return!e.getPriority().equals(t.getPriority())}minPost(){return Ft.MIN}maxPost(){return new Ft(A,new tn("[PRIORITY-POST]",en))}makePost(e,t){const n=Zt(e);return new Ft(t,new tn("[PRIORITY-POST]",n))}toString(){return".priority"}}const sn=new on,an=Math.log(2);
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class cn{constructor(e){const t=e=>parseInt(Math.log(e)/an,10),n=e=>parseInt(Array(e+1).join("1"),2);this.count=t(e+1),this.current_=this.count-1;const r=n(this.count);this.bits_=e+1&r}nextBitIsOne(){const e=!(this.bits_&1<<this.current_);return this.current_--,e}}const un=function(e,t,n,r){e.sort(t);const i=function(t,r){const o=r-t;let s,a;if(0===o)return null;if(1===o)return s=e[t],a=n?n(s):s,new Wt(a,s.node,Wt.BLACK,null,null);{const c=parseInt(o/2,10)+t,u=i(t,c),l=i(c+1,r);return s=e[c],a=n?n(s):s,new Wt(a,s.node,Wt.BLACK,u,l)}},o=function(t){let r=null,o=null,s=e.length;const a=function(t,r){const o=s-t,a=s;s-=t;const u=i(o+1,a),l=e[o],h=n?n(l):l;c(new Wt(h,l.node,r,null,u))},c=function(e){r?(r.left=e,r=e):(o=e,r=e)};for(let e=0;e<t.count;++e){const n=t.nextBitIsOne(),r=Math.pow(2,t.count-(e+1));n?a(r,Wt.BLACK):(a(r,Wt.BLACK),a(r,Wt.RED))}return o},s=new cn(e.length),a=o(s);return new Vt(r||t,a)};
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */let ln;const hn={};class dn{constructor(e,t){this.indexes_=e,this.indexSet_=t}static get Default(){return(0,o.hu)(hn&&sn,"ChildrenNode.ts has not been loaded"),ln=ln||new dn({".priority":hn},{".priority":sn}),ln}get(e){const t=(0,o.DV)(this.indexes_,e);if(!t)throw new Error("No index defined for "+e);return t instanceof Vt?t:null}hasIndex(e){return(0,o.r3)(this.indexSet_,e.toString())}addIndex(e,t){(0,o.hu)(e!==Ut,"KeyIndex always exists and isn't meant to be added to the IndexMap.");const n=[];let r=!1;const i=t.getIterator(Ft.Wrap);let s,a=i.getNext();while(a)r=r||e.isDefinedOn(a.node),n.push(a),a=i.getNext();s=r?un(n,e.getCompare()):hn;const c=e.toString(),u=Object.assign({},this.indexSet_);u[c]=e;const l=Object.assign({},this.indexes_);return l[c]=s,new dn(l,u)}addToIndexes(e,t){const n=(0,o.UI)(this.indexes_,((n,r)=>{const i=(0,o.DV)(this.indexSet_,r);if((0,o.hu)(i,"Missing index implementation for "+r),n===hn){if(i.isDefinedOn(e.node)){const n=[],r=t.getIterator(Ft.Wrap);let o=r.getNext();while(o)o.name!==e.name&&n.push(o),o=r.getNext();return n.push(e),un(n,i.getCompare())}return hn}{const r=t.get(e.name);let i=n;return r&&(i=i.remove(new Ft(e.name,r))),i.insert(e,e.node)}}));return new dn(n,this.indexSet_)}removeFromIndexes(e,t){const n=(0,o.UI)(this.indexes_,(n=>{if(n===hn)return n;{const r=t.get(e.name);return r?n.remove(new Ft(e.name,r)):n}}));return new dn(n,this.indexSet_)}}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */let fn;class pn{constructor(e,t,n){this.children_=e,this.priorityNode_=t,this.indexMap_=n,this.lazyHash_=null,this.priorityNode_&&Xt(this.priorityNode_),this.children_.isEmpty()&&(0,o.hu)(!this.priorityNode_||this.priorityNode_.isEmpty(),"An empty node cannot have a priority")}static get EMPTY_NODE(){return fn||(fn=new pn(new Vt(zt),null,dn.Default))}isLeafNode(){return!1}getPriority(){return this.priorityNode_||fn}updatePriority(e){return this.children_.isEmpty()?this:new pn(this.children_,e,this.indexMap_)}getImmediateChild(e){if(".priority"===e)return this.getPriority();{const t=this.children_.get(e);return null===t?fn:t}}getChild(e){const t=ht(e);return null===t?this:this.getImmediateChild(t).getChild(ft(e))}hasChild(e){return null!==this.children_.get(e)}updateImmediateChild(e,t){if((0,o.hu)(t,"We should always be passing snapshot nodes"),".priority"===e)return this.updatePriority(t);{const n=new Ft(e,t);let r,i;t.isEmpty()?(r=this.children_.remove(e),i=this.indexMap_.removeFromIndexes(n,this.children_)):(r=this.children_.insert(e,t),i=this.indexMap_.addToIndexes(n,this.children_));const o=r.isEmpty()?fn:this.priorityNode_;return new pn(r,o,i)}}updateChild(e,t){const n=ht(e);if(null===n)return t;{(0,o.hu)(".priority"!==ht(e)||1===dt(e),".priority must be the last token in a path");const r=this.getImmediateChild(n).updateChild(ft(e),t);return this.updateImmediateChild(n,r)}}isEmpty(){return this.children_.isEmpty()}numChildren(){return this.children_.count()}val(e){if(this.isEmpty())return null;const t={};let n=0,r=0,i=!0;if(this.forEachChild(sn,((o,s)=>{t[o]=s.val(e),n++,i&&pn.INTEGER_REGEXP_.test(o)?r=Math.max(r,Number(o)):i=!1})),!e&&i&&r<2*n){const e=[];for(const n in t)e[n]=t[n];return e}return e&&!this.getPriority().isEmpty()&&(t[".priority"]=this.getPriority().val()),t}hash(){if(null===this.lazyHash_){let e="";this.getPriority().isEmpty()||(e+="priority:"+Jt(this.getPriority().val())+":"),this.forEachChild(sn,((t,n)=>{const r=n.hash();""!==r&&(e+=":"+t+":"+r)})),this.lazyHash_=""===e?"":v(e)}return this.lazyHash_}getPredecessorChildName(e,t,n){const r=this.resolveIndex_(n);if(r){const n=r.getPredecessorKey(new Ft(e,t));return n?n.name:null}return this.children_.getPredecessorKey(e)}getFirstChildName(e){const t=this.resolveIndex_(e);if(t){const e=t.minKey();return e&&e.name}return this.children_.minKey()}getFirstChild(e){const t=this.getFirstChildName(e);return t?new Ft(t,this.children_.get(t)):null}getLastChildName(e){const t=this.resolveIndex_(e);if(t){const e=t.maxKey();return e&&e.name}return this.children_.maxKey()}getLastChild(e){const t=this.getLastChildName(e);return t?new Ft(t,this.children_.get(t)):null}forEachChild(e,t){const n=this.resolveIndex_(e);return n?n.inorderTraversal((e=>t(e.name,e.node))):this.children_.inorderTraversal(t)}getIterator(e){return this.getIteratorFrom(e.minPost(),e)}getIteratorFrom(e,t){const n=this.resolveIndex_(t);if(n)return n.getIteratorFrom(e,(e=>e));{const n=this.children_.getIteratorFrom(e.name,Ft.Wrap);let r=n.peek();while(null!=r&&t.compare(r,e)<0)n.getNext(),r=n.peek();return n}}getReverseIterator(e){return this.getReverseIteratorFrom(e.maxPost(),e)}getReverseIteratorFrom(e,t){const n=this.resolveIndex_(t);if(n)return n.getReverseIteratorFrom(e,(e=>e));{const n=this.children_.getReverseIteratorFrom(e.name,Ft.Wrap);let r=n.peek();while(null!=r&&t.compare(r,e)>0)n.getNext(),r=n.peek();return n}}compareTo(e){return this.isEmpty()?e.isEmpty()?0:-1:e.isLeafNode()||e.isEmpty()?1:e===mn?-1:0}withIndex(e){if(e===Ut||this.indexMap_.hasIndex(e))return this;{const t=this.indexMap_.addIndex(e,this.children_);return new pn(this.children_,this.priorityNode_,t)}}isIndexed(e){return e===Ut||this.indexMap_.hasIndex(e)}equals(e){if(e===this)return!0;if(e.isLeafNode())return!1;{const t=e;if(this.getPriority().equals(t.getPriority())){if(this.children_.count()===t.children_.count()){const e=this.getIterator(sn),n=t.getIterator(sn);let r=e.getNext(),i=n.getNext();while(r&&i){if(r.name!==i.name||!r.node.equals(i.node))return!1;r=e.getNext(),i=n.getNext()}return null===r&&null===i}return!1}return!1}}resolveIndex_(e){return e===Ut?null:this.indexMap_.get(e.toString())}}pn.INTEGER_REGEXP_=/^(0|[1-9]\d*)$/;class gn extends pn{constructor(){super(new Vt(zt),pn.EMPTY_NODE,dn.Default)}compareTo(e){return e===this?0:1}equals(e){return e===this}getPriority(){return this}getImmediateChild(e){return pn.EMPTY_NODE}isEmpty(){return!1}}const mn=new gn;Object.defineProperties(Ft,{MIN:{value:new Ft(R,pn.EMPTY_NODE)},MAX:{value:new Ft(A,mn)}}),jt.__EMPTY_NODE=pn.EMPTY_NODE,tn.__childrenNodeConstructor=pn,Yt(mn),rn(mn);
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
const _n=!0;function vn(e,t=null){if(null===e)return pn.EMPTY_NODE;if("object"===typeof e&&".priority"in e&&(t=e[".priority"]),(0,o.hu)(null===t||"string"===typeof t||"number"===typeof t||"object"===typeof t&&".sv"in t,"Invalid priority type found: "+typeof t),"object"===typeof e&&".value"in e&&null!==e[".value"]&&(e=e[".value"]),"object"!==typeof e||".sv"in e){const n=e;return new tn(n,vn(t))}if(e instanceof Array||!_n){let n=pn.EMPTY_NODE;return q(e,((t,r)=>{if((0,o.r3)(e,t)&&"."!==t.substring(0,1)){const e=vn(r);!e.isLeafNode()&&e.isEmpty()||(n=n.updateImmediateChild(t,e))}})),n.updatePriority(vn(t))}{const n=[];let r=!1;const i=e;if(q(i,((e,t)=>{if("."!==e.substring(0,1)){const i=vn(t);i.isEmpty()||(r=r||!i.getPriority().isEmpty(),n.push(new Ft(e,i)))}})),0===n.length)return pn.EMPTY_NODE;const o=un(n,Kt,(e=>e.name),zt);if(r){const e=un(n,sn.getCompare());return new pn(o,vn(t),new dn({".priority":e},{".priority":sn}))}return new pn(o,vn(t),dn.Default)}}nn(vn);
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
class yn extends qt{constructor(e){super(),this.indexPath_=e,(0,o.hu)(!yt(e)&&".priority"!==ht(e),"Can't create PathIndex with empty path or .priority key")}extractChild(e){return e.getChild(this.indexPath_)}isDefinedOn(e){return!e.getChild(this.indexPath_).isEmpty()}compare(e,t){const n=this.extractChild(e.node),r=this.extractChild(t.node),i=n.compareTo(r);return 0===i?D(e.name,t.name):i}makePost(e,t){const n=vn(e),r=pn.EMPTY_NODE.updateChild(this.indexPath_,n);return new Ft(t,r)}maxPost(){const e=pn.EMPTY_NODE.updateChild(this.indexPath_,mn);return new Ft(A,e)}toString(){return mt(this.indexPath_,0).join("/")}}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class wn extends qt{compare(e,t){const n=e.node.compareTo(t.node);return 0===n?D(e.name,t.name):n}isDefinedOn(e){return!0}indexedValueChanged(e,t){return!e.equals(t)}minPost(){return Ft.MIN}maxPost(){return Ft.MAX}makePost(e,t){const n=vn(e);return new Ft(t,n)}toString(){return".value"}}const bn=new wn;
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Cn(e){return{type:"value",snapshotNode:e}}function kn(e,t){return{type:"child_added",snapshotNode:t,childName:e}}function En(e,t){return{type:"child_removed",snapshotNode:t,childName:e}}function In(e,t,n){return{type:"child_changed",snapshotNode:t,childName:e,oldSnap:n}}function Tn(e,t){return{type:"child_moved",snapshotNode:t,childName:e}}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Sn{constructor(e){this.index_=e}updateChild(e,t,n,r,i,s){(0,o.hu)(e.isIndexed(this.index_),"A node must be indexed if only a child is updated");const a=e.getImmediateChild(t);return a.getChild(r).equals(n.getChild(r))&&a.isEmpty()===n.isEmpty()?e:(null!=s&&(n.isEmpty()?e.hasChild(t)?s.trackChildChange(En(t,a)):(0,o.hu)(e.isLeafNode(),"A child remove without an old child only makes sense on a leaf node"):a.isEmpty()?s.trackChildChange(kn(t,n)):s.trackChildChange(In(t,n,a))),e.isLeafNode()&&n.isEmpty()?e:e.updateImmediateChild(t,n).withIndex(this.index_))}updateFullNode(e,t,n){return null!=n&&(e.isLeafNode()||e.forEachChild(sn,((e,r)=>{t.hasChild(e)||n.trackChildChange(En(e,r))})),t.isLeafNode()||t.forEachChild(sn,((t,r)=>{if(e.hasChild(t)){const i=e.getImmediateChild(t);i.equals(r)||n.trackChildChange(In(t,r,i))}else n.trackChildChange(kn(t,r))}))),t.withIndex(this.index_)}updatePriority(e,t){return e.isEmpty()?pn.EMPTY_NODE:e.updatePriority(t)}filtersNodes(){return!1}getIndexedFilter(){return this}getIndex(){return this.index_}}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Pn{constructor(e){this.indexedFilter_=new Sn(e.getIndex()),this.index_=e.getIndex(),this.startPost_=Pn.getStartPost_(e),this.endPost_=Pn.getEndPost_(e),this.startIsInclusive_=!e.startAfterSet_,this.endIsInclusive_=!e.endBeforeSet_}getStartPost(){return this.startPost_}getEndPost(){return this.endPost_}matches(e){const t=this.startIsInclusive_?this.index_.compare(this.getStartPost(),e)<=0:this.index_.compare(this.getStartPost(),e)<0,n=this.endIsInclusive_?this.index_.compare(e,this.getEndPost())<=0:this.index_.compare(e,this.getEndPost())<0;return t&&n}updateChild(e,t,n,r,i,o){return this.matches(new Ft(t,n))||(n=pn.EMPTY_NODE),this.indexedFilter_.updateChild(e,t,n,r,i,o)}updateFullNode(e,t,n){t.isLeafNode()&&(t=pn.EMPTY_NODE);let r=t.withIndex(this.index_);r=r.updatePriority(pn.EMPTY_NODE);const i=this;return t.forEachChild(sn,((e,t)=>{i.matches(new Ft(e,t))||(r=r.updateImmediateChild(e,pn.EMPTY_NODE))})),this.indexedFilter_.updateFullNode(e,r,n)}updatePriority(e,t){return e}filtersNodes(){return!0}getIndexedFilter(){return this.indexedFilter_}getIndex(){return this.index_}static getStartPost_(e){if(e.hasStart()){const t=e.getIndexStartName();return e.getIndex().makePost(e.getIndexStartValue(),t)}return e.getIndex().minPost()}static getEndPost_(e){if(e.hasEnd()){const t=e.getIndexEndName();return e.getIndex().makePost(e.getIndexEndValue(),t)}return e.getIndex().maxPost()}}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Nn{constructor(e){this.withinDirectionalStart=e=>this.reverse_?this.withinEndPost(e):this.withinStartPost(e),this.withinDirectionalEnd=e=>this.reverse_?this.withinStartPost(e):this.withinEndPost(e),this.withinStartPost=e=>{const t=this.index_.compare(this.rangedFilter_.getStartPost(),e);return this.startIsInclusive_?t<=0:t<0},this.withinEndPost=e=>{const t=this.index_.compare(e,this.rangedFilter_.getEndPost());return this.endIsInclusive_?t<=0:t<0},this.rangedFilter_=new Pn(e),this.index_=e.getIndex(),this.limit_=e.getLimit(),this.reverse_=!e.isViewFromLeft(),this.startIsInclusive_=!e.startAfterSet_,this.endIsInclusive_=!e.endBeforeSet_}updateChild(e,t,n,r,i,o){return this.rangedFilter_.matches(new Ft(t,n))||(n=pn.EMPTY_NODE),e.getImmediateChild(t).equals(n)?e:e.numChildren()<this.limit_?this.rangedFilter_.getIndexedFilter().updateChild(e,t,n,r,i,o):this.fullLimitUpdateChild_(e,t,n,i,o)}updateFullNode(e,t,n){let r;if(t.isLeafNode()||t.isEmpty())r=pn.EMPTY_NODE.withIndex(this.index_);else if(2*this.limit_<t.numChildren()&&t.isIndexed(this.index_)){let e;r=pn.EMPTY_NODE.withIndex(this.index_),e=this.reverse_?t.getReverseIteratorFrom(this.rangedFilter_.getEndPost(),this.index_):t.getIteratorFrom(this.rangedFilter_.getStartPost(),this.index_);let n=0;while(e.hasNext()&&n<this.limit_){const t=e.getNext();if(this.withinDirectionalStart(t)){if(!this.withinDirectionalEnd(t))break;r=r.updateImmediateChild(t.name,t.node),n++}}}else{let e;r=t.withIndex(this.index_),r=r.updatePriority(pn.EMPTY_NODE),e=this.reverse_?r.getReverseIterator(this.index_):r.getIterator(this.index_);let n=0;while(e.hasNext()){const t=e.getNext(),i=n<this.limit_&&this.withinDirectionalStart(t)&&this.withinDirectionalEnd(t);i?n++:r=r.updateImmediateChild(t.name,pn.EMPTY_NODE)}}return this.rangedFilter_.getIndexedFilter().updateFullNode(e,r,n)}updatePriority(e,t){return e}filtersNodes(){return!0}getIndexedFilter(){return this.rangedFilter_.getIndexedFilter()}getIndex(){return this.index_}fullLimitUpdateChild_(e,t,n,r,i){let s;if(this.reverse_){const e=this.index_.getCompare();s=(t,n)=>e(n,t)}else s=this.index_.getCompare();const a=e;(0,o.hu)(a.numChildren()===this.limit_,"");const c=new Ft(t,n),u=this.reverse_?a.getFirstChild(this.index_):a.getLastChild(this.index_),l=this.rangedFilter_.matches(c);if(a.hasChild(t)){const e=a.getImmediateChild(t);let o=r.getChildAfterChild(this.index_,u,this.reverse_);while(null!=o&&(o.name===t||a.hasChild(o.name)))o=r.getChildAfterChild(this.index_,o,this.reverse_);const h=null==o?1:s(o,c),d=l&&!n.isEmpty()&&h>=0;if(d)return null!=i&&i.trackChildChange(In(t,n,e)),a.updateImmediateChild(t,n);{null!=i&&i.trackChildChange(En(t,e));const n=a.updateImmediateChild(t,pn.EMPTY_NODE),r=null!=o&&this.rangedFilter_.matches(o);return r?(null!=i&&i.trackChildChange(kn(o.name,o.node)),n.updateImmediateChild(o.name,o.node)):n}}return n.isEmpty()?e:l&&s(u,c)>=0?(null!=i&&(i.trackChildChange(En(u.name,u.node)),i.trackChildChange(kn(t,n))),a.updateImmediateChild(t,n).updateImmediateChild(u.name,pn.EMPTY_NODE)):e}}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class xn{constructor(){this.limitSet_=!1,this.startSet_=!1,this.startNameSet_=!1,this.startAfterSet_=!1,this.endSet_=!1,this.endNameSet_=!1,this.endBeforeSet_=!1,this.limit_=0,this.viewFrom_="",this.indexStartValue_=null,this.indexStartName_="",this.indexEndValue_=null,this.indexEndName_="",this.index_=sn}hasStart(){return this.startSet_}isViewFromLeft(){return""===this.viewFrom_?this.startSet_:"l"===this.viewFrom_}getIndexStartValue(){return(0,o.hu)(this.startSet_,"Only valid if start has been set"),this.indexStartValue_}getIndexStartName(){return(0,o.hu)(this.startSet_,"Only valid if start has been set"),this.startNameSet_?this.indexStartName_:R}hasEnd(){return this.endSet_}getIndexEndValue(){return(0,o.hu)(this.endSet_,"Only valid if end has been set"),this.indexEndValue_}getIndexEndName(){return(0,o.hu)(this.endSet_,"Only valid if end has been set"),this.endNameSet_?this.indexEndName_:A}hasLimit(){return this.limitSet_}hasAnchoredLimit(){return this.limitSet_&&""!==this.viewFrom_}getLimit(){return(0,o.hu)(this.limitSet_,"Only valid if limit has been set"),this.limit_}getIndex(){return this.index_}loadsAllData(){return!(this.startSet_||this.endSet_||this.limitSet_)}isDefault(){return this.loadsAllData()&&this.index_===sn}copy(){const e=new xn;return e.limitSet_=this.limitSet_,e.limit_=this.limit_,e.startSet_=this.startSet_,e.startAfterSet_=this.startAfterSet_,e.indexStartValue_=this.indexStartValue_,e.startNameSet_=this.startNameSet_,e.indexStartName_=this.indexStartName_,e.endSet_=this.endSet_,e.endBeforeSet_=this.endBeforeSet_,e.indexEndValue_=this.indexEndValue_,e.endNameSet_=this.endNameSet_,e.indexEndName_=this.indexEndName_,e.index_=this.index_,e.viewFrom_=this.viewFrom_,e}}function Rn(e){return e.loadsAllData()?new Sn(e.getIndex()):e.hasLimit()?new Nn(e):new Pn(e)}function An(e){const t={};if(e.isDefault())return t;let n;if(e.index_===sn?n="$priority":e.index_===bn?n="$value":e.index_===Ut?n="$key":((0,o.hu)(e.index_ instanceof yn,"Unrecognized index type!"),n=e.index_.toString()),t["orderBy"]=(0,o.Wl)(n),e.startSet_){const n=e.startAfterSet_?"startAfter":"startAt";t[n]=(0,o.Wl)(e.indexStartValue_),e.startNameSet_&&(t[n]+=","+(0,o.Wl)(e.indexStartName_))}if(e.endSet_){const n=e.endBeforeSet_?"endBefore":"endAt";t[n]=(0,o.Wl)(e.indexEndValue_),e.endNameSet_&&(t[n]+=","+(0,o.Wl)(e.indexEndName_))}return e.limitSet_&&(e.isViewFromLeft()?t["limitToFirst"]=e.limit_:t["limitToLast"]=e.limit_),t}function Dn(e){const t={};if(e.startSet_&&(t["sp"]=e.indexStartValue_,e.startNameSet_&&(t["sn"]=e.indexStartName_),t["sin"]=!e.startAfterSet_),e.endSet_&&(t["ep"]=e.indexEndValue_,e.endNameSet_&&(t["en"]=e.indexEndName_),t["ein"]=!e.endBeforeSet_),e.limitSet_){t["l"]=e.limit_;let n=e.viewFrom_;""===n&&(n=e.isViewFromLeft()?"l":"r"),t["vf"]=n}return e.index_!==sn&&(t["i"]=e.index_.toString()),t}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class On extends it{constructor(e,t,n,r){super(),this.repoInfo_=e,this.onDataUpdate_=t,this.authTokenProvider_=n,this.appCheckTokenProvider_=r,this.log_=E("p:rest:"),this.listens_={}}reportStats(e){throw new Error("Method not implemented.")}static getListenId_(e,t){return void 0!==t?"tag$"+t:((0,o.hu)(e._queryParams.isDefault(),"should have a tag if it's not a default query."),e._path.toString())}listen(e,t,n,r){const i=e._path.toString();this.log_("Listen called for "+i+" "+e._queryIdentifier);const s=On.getListenId_(e,n),a={};this.listens_[s]=a;const c=An(e._queryParams);this.restRequest_(i+".json",c,((e,t)=>{let c=t;if(404===e&&(c=null,e=null),null===e&&this.onDataUpdate_(i,c,!1,n),(0,o.DV)(this.listens_,s)===a){let t;t=e?401===e?"permission_denied":"rest_error:"+e:"ok",r(t,null)}}))}unlisten(e,t){const n=On.getListenId_(e,t);delete this.listens_[n]}get(e){const t=An(e._queryParams),n=e._path.toString(),r=new o.BH;return this.restRequest_(n+".json",t,((e,t)=>{let i=t;404===e&&(i=null,e=null),null===e?(this.onDataUpdate_(n,i,!1,null),r.resolve(i)):r.reject(new Error(i))})),r.promise}refreshAuthToken(e){}restRequest_(e,t={},n){return t["format"]="export",Promise.all([this.authTokenProvider_.getToken(!1),this.appCheckTokenProvider_.getToken(!1)]).then((([r,i])=>{r&&r.accessToken&&(t["auth"]=r.accessToken),i&&i.token&&(t["ac"]=i.token);const s=(this.repoInfo_.secure?"https://":"http://")+this.repoInfo_.host+e+"?ns="+this.repoInfo_.namespace+(0,o.xO)(t);this.log_("Sending REST request for "+s);const a=new XMLHttpRequest;a.onreadystatechange=()=>{if(n&&4===a.readyState){this.log_("REST Response for "+s+" received. status:",a.status,"response:",a.responseText);let t=null;if(a.status>=200&&a.status<300){try{t=(0,o.cI)(a.responseText)}catch(e){S("Failed to parse JSON response for "+s+": "+a.responseText)}n(null,t)}else 401!==a.status&&404!==a.status&&S("Got unsuccessful REST response for "+s+" Status: "+a.status),n(a.status);n=null}},a.open("GET",s,!0),a.send()}))}}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Mn{constructor(){this.rootNode_=pn.EMPTY_NODE}getNode(e){return this.rootNode_.getChild(e)}updateSnapshot(e,t){this.rootNode_=this.rootNode_.updateChild(e,t)}}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Ln(){return{value:null,children:new Map}}function Fn(e,t,n){if(yt(t))e.value=n,e.children.clear();else if(null!==e.value)e.value=e.value.updateChild(t,n);else{const r=ht(t);e.children.has(r)||e.children.set(r,Ln());const i=e.children.get(r);t=ft(t),Fn(i,t,n)}}function qn(e,t,n){null!==e.value?n(t,e.value):Bn(e,((e,r)=>{const i=new ut(t.toString()+"/"+e);qn(r,i,n)}))}function Bn(e,t){e.children.forEach(((e,n)=>{t(n,e)}))}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class jn{constructor(e){this.collection_=e,this.last_=null}get(){const e=this.collection_.get(),t=Object.assign({},e);return this.last_&&q(this.last_,((e,n)=>{t[e]=t[e]-n})),this.last_=e,t}}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Un=1e4,Hn=3e4,Wn=3e5;class $n{constructor(e,t){this.server_=t,this.statsToReport_={},this.statsListener_=new jn(e);const n=Un+(Hn-Un)*Math.random();Y(this.reportStats_.bind(this),Math.floor(n))}reportStats_(){const e=this.statsListener_.get(),t={};let n=!1;q(e,((e,r)=>{r>0&&(0,o.r3)(this.statsToReport_,e)&&(t[e]=r,n=!0)})),n&&this.server_.reportStats(t),Y(this.reportStats_.bind(this),Math.floor(2*Math.random()*Wn))}}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var Vn;function Kn(){return{fromUser:!0,fromServer:!1,queryId:null,tagged:!1}}function zn(){return{fromUser:!1,fromServer:!0,queryId:null,tagged:!1}}function Gn(e){return{fromUser:!1,fromServer:!0,queryId:e,tagged:!0}}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */(function(e){e[e["OVERWRITE"]=0]="OVERWRITE",e[e["MERGE"]=1]="MERGE",e[e["ACK_USER_WRITE"]=2]="ACK_USER_WRITE",e[e["LISTEN_COMPLETE"]=3]="LISTEN_COMPLETE"})(Vn||(Vn={}));class Yn{constructor(e,t,n){this.path=e,this.affectedTree=t,this.revert=n,this.type=Vn.ACK_USER_WRITE,this.source=Kn()}operationForChild(e){if(yt(this.path)){if(null!=this.affectedTree.value)return(0,o.hu)(this.affectedTree.children.isEmpty(),"affectedTree should not have overlapping affected paths."),this;{const t=this.affectedTree.subtree(new ut(e));return new Yn(lt(),t,this.revert)}}return(0,o.hu)(ht(this.path)===e,"operationForChild called for unrelated child."),new Yn(ft(this.path),this.affectedTree,this.revert)}}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Jn{constructor(e,t){this.source=e,this.path=t,this.type=Vn.LISTEN_COMPLETE}operationForChild(e){return yt(this.path)?new Jn(this.source,lt()):new Jn(this.source,ft(this.path))}}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Xn{constructor(e,t,n){this.source=e,this.path=t,this.snap=n,this.type=Vn.OVERWRITE}operationForChild(e){return yt(this.path)?new Xn(this.source,lt(),this.snap.getImmediateChild(e)):new Xn(this.source,ft(this.path),this.snap)}}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Qn{constructor(e,t,n){this.source=e,this.path=t,this.children=n,this.type=Vn.MERGE}operationForChild(e){if(yt(this.path)){const t=this.children.subtree(new ut(e));return t.isEmpty()?null:t.value?new Xn(this.source,lt(),t.value):new Qn(this.source,lt(),t)}return(0,o.hu)(ht(this.path)===e,"Can't get a merge for a child not on the path of the operation"),new Qn(this.source,ft(this.path),this.children)}toString(){return"Operation("+this.path+": "+this.source.toString()+" merge: "+this.children.toString()+")"}}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Zn{constructor(e,t,n){this.node_=e,this.fullyInitialized_=t,this.filtered_=n}isFullyInitialized(){return this.fullyInitialized_}isFiltered(){return this.filtered_}isCompleteForPath(e){if(yt(e))return this.isFullyInitialized()&&!this.filtered_;const t=ht(e);return this.isCompleteForChild(t)}isCompleteForChild(e){return this.isFullyInitialized()&&!this.filtered_||this.node_.hasChild(e)}getNode(){return this.node_}}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class er{constructor(e){this.query_=e,this.index_=this.query_._queryParams.getIndex()}}function tr(e,t,n,r){const i=[],o=[];return t.forEach((t=>{"child_changed"===t.type&&e.index_.indexedValueChanged(t.oldSnap,t.snapshotNode)&&o.push(Tn(t.childName,t.snapshotNode))})),nr(e,i,"child_removed",t,r,n),nr(e,i,"child_added",t,r,n),nr(e,i,"child_moved",o,r,n),nr(e,i,"child_changed",t,r,n),nr(e,i,"value",t,r,n),i}function nr(e,t,n,r,i,o){const s=r.filter((e=>e.type===n));s.sort(((t,n)=>ir(e,t,n))),s.forEach((n=>{const r=rr(e,n,o);i.forEach((i=>{i.respondsTo(n.type)&&t.push(i.createEvent(r,e.query_))}))}))}function rr(e,t,n){return"value"===t.type||"child_removed"===t.type||(t.prevName=n.getPredecessorChildName(t.childName,t.snapshotNode,e.index_)),t}function ir(e,t,n){if(null==t.childName||null==n.childName)throw(0,o.g5)("Should only compare child_ events.");const r=new Ft(t.childName,t.snapshotNode),i=new Ft(n.childName,n.snapshotNode);return e.index_.compare(r,i)}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function or(e,t){return{eventCache:e,serverCache:t}}function sr(e,t,n,r){return or(new Zn(t,n,r),e.serverCache)}function ar(e,t,n,r){return or(e.eventCache,new Zn(t,n,r))}function cr(e){return e.eventCache.isFullyInitialized()?e.eventCache.getNode():null}function ur(e){return e.serverCache.isFullyInitialized()?e.serverCache.getNode():null}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */let lr;const hr=()=>(lr||(lr=new Vt(O)),lr);class dr{constructor(e,t=hr()){this.value=e,this.children=t}static fromObject(e){let t=new dr(null);return q(e,((e,n)=>{t=t.set(new ut(e),n)})),t}isEmpty(){return null===this.value&&this.children.isEmpty()}findRootMostMatchingPathAndValue(e,t){if(null!=this.value&&t(this.value))return{path:lt(),value:this.value};if(yt(e))return null;{const n=ht(e),r=this.children.get(n);if(null!==r){const i=r.findRootMostMatchingPathAndValue(ft(e),t);if(null!=i){const e=vt(new ut(n),i.path);return{path:e,value:i.value}}return null}return null}}findRootMostValueAndPath(e){return this.findRootMostMatchingPathAndValue(e,(()=>!0))}subtree(e){if(yt(e))return this;{const t=ht(e),n=this.children.get(t);return null!==n?n.subtree(ft(e)):new dr(null)}}set(e,t){if(yt(e))return new dr(t,this.children);{const n=ht(e),r=this.children.get(n)||new dr(null),i=r.set(ft(e),t),o=this.children.insert(n,i);return new dr(this.value,o)}}remove(e){if(yt(e))return this.children.isEmpty()?new dr(null):new dr(null,this.children);{const t=ht(e),n=this.children.get(t);if(n){const r=n.remove(ft(e));let i;return i=r.isEmpty()?this.children.remove(t):this.children.insert(t,r),null===this.value&&i.isEmpty()?new dr(null):new dr(this.value,i)}return this}}get(e){if(yt(e))return this.value;{const t=ht(e),n=this.children.get(t);return n?n.get(ft(e)):null}}setTree(e,t){if(yt(e))return t;{const n=ht(e),r=this.children.get(n)||new dr(null),i=r.setTree(ft(e),t);let o;return o=i.isEmpty()?this.children.remove(n):this.children.insert(n,i),new dr(this.value,o)}}fold(e){return this.fold_(lt(),e)}fold_(e,t){const n={};return this.children.inorderTraversal(((r,i)=>{n[r]=i.fold_(vt(e,r),t)})),t(e,this.value,n)}findOnPath(e,t){return this.findOnPath_(e,lt(),t)}findOnPath_(e,t,n){const r=!!this.value&&n(t,this.value);if(r)return r;if(yt(e))return null;{const r=ht(e),i=this.children.get(r);return i?i.findOnPath_(ft(e),vt(t,r),n):null}}foreachOnPath(e,t){return this.foreachOnPath_(e,lt(),t)}foreachOnPath_(e,t,n){if(yt(e))return this;{this.value&&n(t,this.value);const r=ht(e),i=this.children.get(r);return i?i.foreachOnPath_(ft(e),vt(t,r),n):new dr(null)}}foreach(e){this.foreach_(lt(),e)}foreach_(e,t){this.children.inorderTraversal(((n,r)=>{r.foreach_(vt(e,n),t)})),this.value&&t(e,this.value)}foreachChild(e){this.children.inorderTraversal(((t,n)=>{n.value&&e(t,n.value)}))}}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class fr{constructor(e){this.writeTree_=e}static empty(){return new fr(new dr(null))}}function pr(e,t,n){if(yt(t))return new fr(new dr(n));{const r=e.writeTree_.findRootMostValueAndPath(t);if(null!=r){const i=r.path;let o=r.value;const s=wt(i,t);return o=o.updateChild(s,n),new fr(e.writeTree_.set(i,o))}{const r=new dr(n),i=e.writeTree_.setTree(t,r);return new fr(i)}}}function gr(e,t,n){let r=e;return q(n,((e,n)=>{r=pr(r,vt(t,e),n)})),r}function mr(e,t){if(yt(t))return fr.empty();{const n=e.writeTree_.setTree(t,new dr(null));return new fr(n)}}function _r(e,t){return null!=vr(e,t)}function vr(e,t){const n=e.writeTree_.findRootMostValueAndPath(t);return null!=n?e.writeTree_.get(n.path).getChild(wt(n.path,t)):null}function yr(e){const t=[],n=e.writeTree_.value;return null!=n?n.isLeafNode()||n.forEachChild(sn,((e,n)=>{t.push(new Ft(e,n))})):e.writeTree_.children.inorderTraversal(((e,n)=>{null!=n.value&&t.push(new Ft(e,n.value))})),t}function wr(e,t){if(yt(t))return e;{const n=vr(e,t);return new fr(null!=n?new dr(n):e.writeTree_.subtree(t))}}function br(e){return e.writeTree_.isEmpty()}function Cr(e,t){return kr(lt(),e.writeTree_,t)}function kr(e,t,n){if(null!=t.value)return n.updateChild(e,t.value);{let r=null;return t.children.inorderTraversal(((t,i)=>{".priority"===t?((0,o.hu)(null!==i.value,"Priority writes must always be leaf nodes"),r=i.value):n=kr(vt(e,t),i,n)})),n.getChild(e).isEmpty()||null===r||(n=n.updateChild(vt(e,".priority"),r)),n}}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Er(e,t){return Kr(t,e)}function Ir(e,t,n,r,i){(0,o.hu)(r>e.lastWriteId,"Stacking an older write on top of newer ones"),void 0===i&&(i=!0),e.allWrites.push({path:t,snap:n,writeId:r,visible:i}),i&&(e.visibleWrites=pr(e.visibleWrites,t,n)),e.lastWriteId=r}function Tr(e,t){for(let n=0;n<e.allWrites.length;n++){const r=e.allWrites[n];if(r.writeId===t)return r}return null}function Sr(e,t){const n=e.allWrites.findIndex((e=>e.writeId===t));(0,o.hu)(n>=0,"removeWrite called with nonexistent writeId.");const r=e.allWrites[n];e.allWrites.splice(n,1);let i=r.visible,s=!1,a=e.allWrites.length-1;while(i&&a>=0){const t=e.allWrites[a];t.visible&&(a>=n&&Pr(t,r.path)?i=!1:Ct(r.path,t.path)&&(s=!0)),a--}if(i){if(s)return Nr(e),!0;if(r.snap)e.visibleWrites=mr(e.visibleWrites,r.path);else{const t=r.children;q(t,(t=>{e.visibleWrites=mr(e.visibleWrites,vt(r.path,t))}))}return!0}return!1}function Pr(e,t){if(e.snap)return Ct(e.path,t);for(const n in e.children)if(e.children.hasOwnProperty(n)&&Ct(vt(e.path,n),t))return!0;return!1}function Nr(e){e.visibleWrites=Rr(e.allWrites,xr,lt()),e.allWrites.length>0?e.lastWriteId=e.allWrites[e.allWrites.length-1].writeId:e.lastWriteId=-1}function xr(e){return e.visible}function Rr(e,t,n){let r=fr.empty();for(let i=0;i<e.length;++i){const s=e[i];if(t(s)){const e=s.path;let t;if(s.snap)Ct(n,e)?(t=wt(n,e),r=pr(r,t,s.snap)):Ct(e,n)&&(t=wt(e,n),r=pr(r,lt(),s.snap.getChild(t)));else{if(!s.children)throw(0,o.g5)("WriteRecord should have .snap or .children");if(Ct(n,e))t=wt(n,e),r=gr(r,t,s.children);else if(Ct(e,n))if(t=wt(e,n),yt(t))r=gr(r,lt(),s.children);else{const e=(0,o.DV)(s.children,ht(t));if(e){const n=e.getChild(ft(t));r=pr(r,lt(),n)}}}}}return r}function Ar(e,t,n,r,i){if(r||i){const o=wr(e.visibleWrites,t);if(!i&&br(o))return n;if(i||null!=n||_r(o,lt())){const o=function(e){return(e.visible||i)&&(!r||!~r.indexOf(e.writeId))&&(Ct(e.path,t)||Ct(t,e.path))},s=Rr(e.allWrites,o,t),a=n||pn.EMPTY_NODE;return Cr(s,a)}return null}{const r=vr(e.visibleWrites,t);if(null!=r)return r;{const r=wr(e.visibleWrites,t);if(br(r))return n;if(null!=n||_r(r,lt())){const e=n||pn.EMPTY_NODE;return Cr(r,e)}return null}}}function Dr(e,t,n){let r=pn.EMPTY_NODE;const i=vr(e.visibleWrites,t);if(i)return i.isLeafNode()||i.forEachChild(sn,((e,t)=>{r=r.updateImmediateChild(e,t)})),r;if(n){const i=wr(e.visibleWrites,t);return n.forEachChild(sn,((e,t)=>{const n=Cr(wr(i,new ut(e)),t);r=r.updateImmediateChild(e,n)})),yr(i).forEach((e=>{r=r.updateImmediateChild(e.name,e.node)})),r}{const n=wr(e.visibleWrites,t);return yr(n).forEach((e=>{r=r.updateImmediateChild(e.name,e.node)})),r}}function Or(e,t,n,r,i){(0,o.hu)(r||i,"Either existingEventSnap or existingServerSnap must exist");const s=vt(t,n);if(_r(e.visibleWrites,s))return null;{const t=wr(e.visibleWrites,s);return br(t)?i.getChild(n):Cr(t,i.getChild(n))}}function Mr(e,t,n,r){const i=vt(t,n),o=vr(e.visibleWrites,i);if(null!=o)return o;if(r.isCompleteForChild(n)){const t=wr(e.visibleWrites,i);return Cr(t,r.getNode().getImmediateChild(n))}return null}function Lr(e,t){return vr(e.visibleWrites,t)}function Fr(e,t,n,r,i,o,s){let a;const c=wr(e.visibleWrites,t),u=vr(c,lt());if(null!=u)a=u;else{if(null==n)return[];a=Cr(c,n)}if(a=a.withIndex(s),a.isEmpty()||a.isLeafNode())return[];{const e=[],t=s.getCompare(),n=o?a.getReverseIteratorFrom(r,s):a.getIteratorFrom(r,s);let c=n.getNext();while(c&&e.length<i)0!==t(c,r)&&e.push(c),c=n.getNext();return e}}function qr(){return{visibleWrites:fr.empty(),allWrites:[],lastWriteId:-1}}function Br(e,t,n,r){return Ar(e.writeTree,e.treePath,t,n,r)}function jr(e,t){return Dr(e.writeTree,e.treePath,t)}function Ur(e,t,n,r){return Or(e.writeTree,e.treePath,t,n,r)}function Hr(e,t){return Lr(e.writeTree,vt(e.treePath,t))}function Wr(e,t,n,r,i,o){return Fr(e.writeTree,e.treePath,t,n,r,i,o)}function $r(e,t,n){return Mr(e.writeTree,e.treePath,t,n)}function Vr(e,t){return Kr(vt(e.treePath,t),e.writeTree)}function Kr(e,t){return{treePath:e,writeTree:t}}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class zr{constructor(){this.changeMap=new Map}trackChildChange(e){const t=e.type,n=e.childName;(0,o.hu)("child_added"===t||"child_changed"===t||"child_removed"===t,"Only child changes supported for tracking"),(0,o.hu)(".priority"!==n,"Only non-priority child changes can be tracked.");const r=this.changeMap.get(n);if(r){const i=r.type;if("child_added"===t&&"child_removed"===i)this.changeMap.set(n,In(n,e.snapshotNode,r.snapshotNode));else if("child_removed"===t&&"child_added"===i)this.changeMap.delete(n);else if("child_removed"===t&&"child_changed"===i)this.changeMap.set(n,En(n,r.oldSnap));else if("child_changed"===t&&"child_added"===i)this.changeMap.set(n,kn(n,e.snapshotNode));else{if("child_changed"!==t||"child_changed"!==i)throw(0,o.g5)("Illegal combination of changes: "+e+" occurred after "+r);this.changeMap.set(n,In(n,e.snapshotNode,r.oldSnap))}}else this.changeMap.set(n,e)}getChanges(){return Array.from(this.changeMap.values())}}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Gr{getCompleteChild(e){return null}getChildAfterChild(e,t,n){return null}}const Yr=new Gr;class Jr{constructor(e,t,n=null){this.writes_=e,this.viewCache_=t,this.optCompleteServerCache_=n}getCompleteChild(e){const t=this.viewCache_.eventCache;if(t.isCompleteForChild(e))return t.getNode().getImmediateChild(e);{const t=null!=this.optCompleteServerCache_?new Zn(this.optCompleteServerCache_,!0,!1):this.viewCache_.serverCache;return $r(this.writes_,e,t)}}getChildAfterChild(e,t,n){const r=null!=this.optCompleteServerCache_?this.optCompleteServerCache_:ur(this.viewCache_),i=Wr(this.writes_,r,t,1,n,e);return 0===i.length?null:i[0]}}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Xr(e){return{filter:e}}function Qr(e,t){(0,o.hu)(t.eventCache.getNode().isIndexed(e.filter.getIndex()),"Event snap not indexed"),(0,o.hu)(t.serverCache.getNode().isIndexed(e.filter.getIndex()),"Server snap not indexed")}function Zr(e,t,n,r,i){const s=new zr;let a,c;if(n.type===Vn.OVERWRITE){const u=n;u.source.fromUser?a=ri(e,t,u.path,u.snap,r,i,s):((0,o.hu)(u.source.fromServer,"Unknown source."),c=u.source.tagged||t.serverCache.isFiltered()&&!yt(u.path),a=ni(e,t,u.path,u.snap,r,i,c,s))}else if(n.type===Vn.MERGE){const u=n;u.source.fromUser?a=oi(e,t,u.path,u.children,r,i,s):((0,o.hu)(u.source.fromServer,"Unknown source."),c=u.source.tagged||t.serverCache.isFiltered(),a=ai(e,t,u.path,u.children,r,i,c,s))}else if(n.type===Vn.ACK_USER_WRITE){const o=n;a=o.revert?li(e,t,o.path,r,i,s):ci(e,t,o.path,o.affectedTree,r,i,s)}else{if(n.type!==Vn.LISTEN_COMPLETE)throw(0,o.g5)("Unknown operation type: "+n.type);a=ui(e,t,n.path,r,s)}const u=s.getChanges();return ei(t,a,u),{viewCache:a,changes:u}}function ei(e,t,n){const r=t.eventCache;if(r.isFullyInitialized()){const i=r.getNode().isLeafNode()||r.getNode().isEmpty(),o=cr(e);(n.length>0||!e.eventCache.isFullyInitialized()||i&&!r.getNode().equals(o)||!r.getNode().getPriority().equals(o.getPriority()))&&n.push(Cn(cr(t)))}}function ti(e,t,n,r,i,s){const a=t.eventCache;if(null!=Hr(r,n))return t;{let c,u;if(yt(n))if((0,o.hu)(t.serverCache.isFullyInitialized(),"If change path is empty, we must have complete server data"),t.serverCache.isFiltered()){const n=ur(t),i=n instanceof pn?n:pn.EMPTY_NODE,o=jr(r,i);c=e.filter.updateFullNode(t.eventCache.getNode(),o,s)}else{const n=Br(r,ur(t));c=e.filter.updateFullNode(t.eventCache.getNode(),n,s)}else{const l=ht(n);if(".priority"===l){(0,o.hu)(1===dt(n),"Can't have a priority with additional path components");const i=a.getNode();u=t.serverCache.getNode();const s=Ur(r,n,i,u);c=null!=s?e.filter.updatePriority(i,s):a.getNode()}else{const o=ft(n);let h;if(a.isCompleteForChild(l)){u=t.serverCache.getNode();const e=Ur(r,n,a.getNode(),u);h=null!=e?a.getNode().getImmediateChild(l).updateChild(o,e):a.getNode().getImmediateChild(l)}else h=$r(r,l,t.serverCache);c=null!=h?e.filter.updateChild(a.getNode(),l,h,o,i,s):a.getNode()}}return sr(t,c,a.isFullyInitialized()||yt(n),e.filter.filtersNodes())}}function ni(e,t,n,r,i,o,s,a){const c=t.serverCache;let u;const l=s?e.filter:e.filter.getIndexedFilter();if(yt(n))u=l.updateFullNode(c.getNode(),r,null);else if(l.filtersNodes()&&!c.isFiltered()){const e=c.getNode().updateChild(n,r);u=l.updateFullNode(c.getNode(),e,null)}else{const e=ht(n);if(!c.isCompleteForPath(n)&&dt(n)>1)return t;const i=ft(n),o=c.getNode().getImmediateChild(e),s=o.updateChild(i,r);u=".priority"===e?l.updatePriority(c.getNode(),s):l.updateChild(c.getNode(),e,s,i,Yr,null)}const h=ar(t,u,c.isFullyInitialized()||yt(n),l.filtersNodes()),d=new Jr(i,h,o);return ti(e,h,n,i,d,a)}function ri(e,t,n,r,i,o,s){const a=t.eventCache;let c,u;const l=new Jr(i,t,o);if(yt(n))u=e.filter.updateFullNode(t.eventCache.getNode(),r,s),c=sr(t,u,!0,e.filter.filtersNodes());else{const i=ht(n);if(".priority"===i)u=e.filter.updatePriority(t.eventCache.getNode(),r),c=sr(t,u,a.isFullyInitialized(),a.isFiltered());else{const o=ft(n),u=a.getNode().getImmediateChild(i);let h;if(yt(o))h=r;else{const e=l.getCompleteChild(i);h=null!=e?".priority"===pt(o)&&e.getChild(_t(o)).isEmpty()?e:e.updateChild(o,r):pn.EMPTY_NODE}if(u.equals(h))c=t;else{const n=e.filter.updateChild(a.getNode(),i,h,o,l,s);c=sr(t,n,a.isFullyInitialized(),e.filter.filtersNodes())}}}return c}function ii(e,t){return e.eventCache.isCompleteForChild(t)}function oi(e,t,n,r,i,o,s){let a=t;return r.foreach(((r,c)=>{const u=vt(n,r);ii(t,ht(u))&&(a=ri(e,a,u,c,i,o,s))})),r.foreach(((r,c)=>{const u=vt(n,r);ii(t,ht(u))||(a=ri(e,a,u,c,i,o,s))})),a}function si(e,t,n){return n.foreach(((e,n)=>{t=t.updateChild(e,n)})),t}function ai(e,t,n,r,i,o,s,a){if(t.serverCache.getNode().isEmpty()&&!t.serverCache.isFullyInitialized())return t;let c,u=t;c=yt(n)?r:new dr(null).setTree(n,r);const l=t.serverCache.getNode();return c.children.inorderTraversal(((n,r)=>{if(l.hasChild(n)){const c=t.serverCache.getNode().getImmediateChild(n),l=si(e,c,r);u=ni(e,u,new ut(n),l,i,o,s,a)}})),c.children.inorderTraversal(((n,r)=>{const c=!t.serverCache.isCompleteForChild(n)&&null===r.value;if(!l.hasChild(n)&&!c){const c=t.serverCache.getNode().getImmediateChild(n),l=si(e,c,r);u=ni(e,u,new ut(n),l,i,o,s,a)}})),u}function ci(e,t,n,r,i,o,s){if(null!=Hr(i,n))return t;const a=t.serverCache.isFiltered(),c=t.serverCache;if(null!=r.value){if(yt(n)&&c.isFullyInitialized()||c.isCompleteForPath(n))return ni(e,t,n,c.getNode().getChild(n),i,o,a,s);if(yt(n)){let r=new dr(null);return c.getNode().forEachChild(Ut,((e,t)=>{r=r.set(new ut(e),t)})),ai(e,t,n,r,i,o,a,s)}return t}{let u=new dr(null);return r.foreach(((e,t)=>{const r=vt(n,e);c.isCompleteForPath(r)&&(u=u.set(e,c.getNode().getChild(r)))})),ai(e,t,n,u,i,o,a,s)}}function ui(e,t,n,r,i){const o=t.serverCache,s=ar(t,o.getNode(),o.isFullyInitialized()||yt(n),o.isFiltered());return ti(e,s,n,r,Yr,i)}function li(e,t,n,r,i,s){let a;if(null!=Hr(r,n))return t;{const c=new Jr(r,t,i),u=t.eventCache.getNode();let l;if(yt(n)||".priority"===ht(n)){let n;if(t.serverCache.isFullyInitialized())n=Br(r,ur(t));else{const e=t.serverCache.getNode();(0,o.hu)(e instanceof pn,"serverChildren would be complete if leaf node"),n=jr(r,e)}l=e.filter.updateFullNode(u,n,s)}else{const i=ht(n);let o=$r(r,i,t.serverCache);null==o&&t.serverCache.isCompleteForChild(i)&&(o=u.getImmediateChild(i)),l=null!=o?e.filter.updateChild(u,i,o,ft(n),c,s):t.eventCache.getNode().hasChild(i)?e.filter.updateChild(u,i,pn.EMPTY_NODE,ft(n),c,s):u,l.isEmpty()&&t.serverCache.isFullyInitialized()&&(a=Br(r,ur(t)),a.isLeafNode()&&(l=e.filter.updateFullNode(l,a,s)))}return a=t.serverCache.isFullyInitialized()||null!=Hr(r,lt()),sr(t,l,a,e.filter.filtersNodes())}}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class hi{constructor(e,t){this.query_=e,this.eventRegistrations_=[];const n=this.query_._queryParams,r=new Sn(n.getIndex()),i=Rn(n);this.processor_=Xr(i);const o=t.serverCache,s=t.eventCache,a=r.updateFullNode(pn.EMPTY_NODE,o.getNode(),null),c=i.updateFullNode(pn.EMPTY_NODE,s.getNode(),null),u=new Zn(a,o.isFullyInitialized(),r.filtersNodes()),l=new Zn(c,s.isFullyInitialized(),i.filtersNodes());this.viewCache_=or(l,u),this.eventGenerator_=new er(this.query_)}get query(){return this.query_}}function di(e){return e.viewCache_.serverCache.getNode()}function fi(e){return cr(e.viewCache_)}function pi(e,t){const n=ur(e.viewCache_);return n&&(e.query._queryParams.loadsAllData()||!yt(t)&&!n.getImmediateChild(ht(t)).isEmpty())?n.getChild(t):null}function gi(e){return 0===e.eventRegistrations_.length}function mi(e,t){e.eventRegistrations_.push(t)}function _i(e,t,n){const r=[];if(n){(0,o.hu)(null==t,"A cancel should cancel all event registrations.");const i=e.query._path;e.eventRegistrations_.forEach((e=>{const t=e.createCancelEvent(n,i);t&&r.push(t)}))}if(t){let n=[];for(let r=0;r<e.eventRegistrations_.length;++r){const i=e.eventRegistrations_[r];if(i.matches(t)){if(t.hasAnyCallback()){n=n.concat(e.eventRegistrations_.slice(r+1));break}}else n.push(i)}e.eventRegistrations_=n}else e.eventRegistrations_=[];return r}function vi(e,t,n,r){t.type===Vn.MERGE&&null!==t.source.queryId&&((0,o.hu)(ur(e.viewCache_),"We should always have a full cache before handling merges"),(0,o.hu)(cr(e.viewCache_),"Missing event cache, even though we have a server cache"));const i=e.viewCache_,s=Zr(e.processor_,i,t,n,r);return Qr(e.processor_,s.viewCache),(0,o.hu)(s.viewCache.serverCache.isFullyInitialized()||!i.serverCache.isFullyInitialized(),"Once a server snap is complete, it should never go back"),e.viewCache_=s.viewCache,wi(e,s.changes,s.viewCache.eventCache.getNode(),null)}function yi(e,t){const n=e.viewCache_.eventCache,r=[];if(!n.getNode().isLeafNode()){const e=n.getNode();e.forEachChild(sn,((e,t)=>{r.push(kn(e,t))}))}return n.isFullyInitialized()&&r.push(Cn(n.getNode())),wi(e,r,n.getNode(),t)}function wi(e,t,n,r){const i=r?[r]:e.eventRegistrations_;return tr(e.eventGenerator_,t,n,i)}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */let bi,Ci;class ki{constructor(){this.views=new Map}}function Ei(e){(0,o.hu)(!bi,"__referenceConstructor has already been defined"),bi=e}function Ii(){return(0,o.hu)(bi,"Reference.ts has not been loaded"),bi}function Ti(e){return 0===e.views.size}function Si(e,t,n,r){const i=t.source.queryId;if(null!==i){const s=e.views.get(i);return(0,o.hu)(null!=s,"SyncTree gave us an op for an invalid query."),vi(s,t,n,r)}{let i=[];for(const o of e.views.values())i=i.concat(vi(o,t,n,r));return i}}function Pi(e,t,n,r,i){const o=t._queryIdentifier,s=e.views.get(o);if(!s){let e=Br(n,i?r:null),o=!1;e?o=!0:r instanceof pn?(e=jr(n,r),o=!1):(e=pn.EMPTY_NODE,o=!1);const s=or(new Zn(e,o,!1),new Zn(r,i,!1));return new hi(t,s)}return s}function Ni(e,t,n,r,i,o){const s=Pi(e,t,r,i,o);return e.views.has(t._queryIdentifier)||e.views.set(t._queryIdentifier,s),mi(s,n),yi(s,n)}function xi(e,t,n,r){const i=t._queryIdentifier,o=[];let s=[];const a=Mi(e);if("default"===i)for(const[c,u]of e.views.entries())s=s.concat(_i(u,n,r)),gi(u)&&(e.views.delete(c),u.query._queryParams.loadsAllData()||o.push(u.query));else{const t=e.views.get(i);t&&(s=s.concat(_i(t,n,r)),gi(t)&&(e.views.delete(i),t.query._queryParams.loadsAllData()||o.push(t.query)))}return a&&!Mi(e)&&o.push(new(Ii())(t._repo,t._path)),{removed:o,events:s}}function Ri(e){const t=[];for(const n of e.views.values())n.query._queryParams.loadsAllData()||t.push(n);return t}function Ai(e,t){let n=null;for(const r of e.views.values())n=n||pi(r,t);return n}function Di(e,t){const n=t._queryParams;if(n.loadsAllData())return Li(e);{const n=t._queryIdentifier;return e.views.get(n)}}function Oi(e,t){return null!=Di(e,t)}function Mi(e){return null!=Li(e)}function Li(e){for(const t of e.views.values())if(t.query._queryParams.loadsAllData())return t;return null}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Fi(e){(0,o.hu)(!Ci,"__referenceConstructor has already been defined"),Ci=e}function qi(){return(0,o.hu)(Ci,"Reference.ts has not been loaded"),Ci}let Bi=1;class ji{constructor(e){this.listenProvider_=e,this.syncPointTree_=new dr(null),this.pendingWriteTree_=qr(),this.tagToQueryMap=new Map,this.queryToTagMap=new Map}}function Ui(e,t,n,r,i){return Ir(e.pendingWriteTree_,t,n,r,i),i?Zi(e,new Xn(Kn(),t,n)):[]}function Hi(e,t,n=!1){const r=Tr(e.pendingWriteTree_,t),i=Sr(e.pendingWriteTree_,t);if(i){let t=new dr(null);return null!=r.snap?t=t.set(lt(),!0):q(r.children,(e=>{t=t.set(new ut(e),!0)})),Zi(e,new Yn(r.path,t,n))}return[]}function Wi(e,t,n){return Zi(e,new Xn(zn(),t,n))}function $i(e,t,n){const r=dr.fromObject(n);return Zi(e,new Qn(zn(),t,r))}function Vi(e,t){return Zi(e,new Jn(zn(),t))}function Ki(e,t,n){const r=oo(e,n);if(r){const n=so(r),i=n.path,o=n.queryId,s=wt(i,t),a=new Jn(Gn(o),s);return ao(e,i,a)}return[]}function zi(e,t,n,r,i=!1){const o=t._path,s=e.syncPointTree_.get(o);let a=[];if(s&&("default"===t._queryIdentifier||Oi(s,t))){const c=xi(s,t,n,r);Ti(s)&&(e.syncPointTree_=e.syncPointTree_.remove(o));const u=c.removed;if(a=c.events,!i){const n=-1!==u.findIndex((e=>e._queryParams.loadsAllData())),i=e.syncPointTree_.findOnPath(o,((e,t)=>Mi(t)));if(n&&!i){const t=e.syncPointTree_.subtree(o);if(!t.isEmpty()){const n=co(t);for(let t=0;t<n.length;++t){const r=n[t],i=r.query,o=no(e,r);e.listenProvider_.startListening(uo(i),ro(e,i),o.hashFn,o.onComplete)}}}if(!i&&u.length>0&&!r)if(n){const n=null;e.listenProvider_.stopListening(uo(t),n)}else u.forEach((t=>{const n=e.queryToTagMap.get(io(t));e.listenProvider_.stopListening(uo(t),n)}))}lo(e,u)}return a}function Gi(e,t,n,r){const i=oo(e,r);if(null!=i){const r=so(i),o=r.path,s=r.queryId,a=wt(o,t),c=new Xn(Gn(s),a,n);return ao(e,o,c)}return[]}function Yi(e,t,n,r){const i=oo(e,r);if(i){const r=so(i),o=r.path,s=r.queryId,a=wt(o,t),c=dr.fromObject(n),u=new Qn(Gn(s),a,c);return ao(e,o,u)}return[]}function Ji(e,t,n,r=!1){const i=t._path;let s=null,a=!1;e.syncPointTree_.foreachOnPath(i,((e,t)=>{const n=wt(e,i);s=s||Ai(t,n),a=a||Mi(t)}));let c,u=e.syncPointTree_.get(i);if(u?(a=a||Mi(u),s=s||Ai(u,lt())):(u=new ki,e.syncPointTree_=e.syncPointTree_.set(i,u)),null!=s)c=!0;else{c=!1,s=pn.EMPTY_NODE;const t=e.syncPointTree_.subtree(i);t.foreachChild(((e,t)=>{const n=Ai(t,lt());n&&(s=s.updateImmediateChild(e,n))}))}const l=Oi(u,t);if(!l&&!t._queryParams.loadsAllData()){const n=io(t);(0,o.hu)(!e.queryToTagMap.has(n),"View does not exist, but we have a tag");const r=ho();e.queryToTagMap.set(n,r),e.tagToQueryMap.set(r,n)}const h=Er(e.pendingWriteTree_,i);let d=Ni(u,t,n,h,s,c);if(!l&&!a&&!r){const n=Di(u,t);d=d.concat(fo(e,t,n))}return d}function Xi(e,t,n){const r=!0,i=e.pendingWriteTree_,o=e.syncPointTree_.findOnPath(t,((e,n)=>{const r=wt(e,t),i=Ai(n,r);if(i)return i}));return Ar(i,t,o,n,r)}function Qi(e,t){const n=t._path;let r=null;e.syncPointTree_.foreachOnPath(n,((e,t)=>{const i=wt(e,n);r=r||Ai(t,i)}));let i=e.syncPointTree_.get(n);i?r=r||Ai(i,lt()):(i=new ki,e.syncPointTree_=e.syncPointTree_.set(n,i));const o=null!=r,s=o?new Zn(r,!0,!1):null,a=Er(e.pendingWriteTree_,t._path),c=Pi(i,t,a,o?s.getNode():pn.EMPTY_NODE,o);return fi(c)}function Zi(e,t){return eo(t,e.syncPointTree_,null,Er(e.pendingWriteTree_,lt()))}function eo(e,t,n,r){if(yt(e.path))return to(e,t,n,r);{const i=t.get(lt());null==n&&null!=i&&(n=Ai(i,lt()));let o=[];const s=ht(e.path),a=e.operationForChild(s),c=t.children.get(s);if(c&&a){const e=n?n.getImmediateChild(s):null,t=Vr(r,s);o=o.concat(eo(a,c,e,t))}return i&&(o=o.concat(Si(i,e,r,n))),o}}function to(e,t,n,r){const i=t.get(lt());null==n&&null!=i&&(n=Ai(i,lt()));let o=[];return t.children.inorderTraversal(((t,i)=>{const s=n?n.getImmediateChild(t):null,a=Vr(r,t),c=e.operationForChild(t);c&&(o=o.concat(to(c,i,s,a)))})),i&&(o=o.concat(Si(i,e,r,n))),o}function no(e,t){const n=t.query,r=ro(e,n);return{hashFn:()=>{const e=di(t)||pn.EMPTY_NODE;return e.hash()},onComplete:t=>{if("ok"===t)return r?Ki(e,n._path,r):Vi(e,n._path);{const r=H(t,n);return zi(e,n,null,r)}}}}function ro(e,t){const n=io(t);return e.queryToTagMap.get(n)}function io(e){return e._path.toString()+"$"+e._queryIdentifier}function oo(e,t){return e.tagToQueryMap.get(t)}function so(e){const t=e.indexOf("$");return(0,o.hu)(-1!==t&&t<e.length-1,"Bad queryKey."),{queryId:e.substr(t+1),path:new ut(e.substr(0,t))}}function ao(e,t,n){const r=e.syncPointTree_.get(t);(0,o.hu)(r,"Missing sync point for query tag that we're tracking");const i=Er(e.pendingWriteTree_,t);return Si(r,n,i,null)}function co(e){return e.fold(((e,t,n)=>{if(t&&Mi(t)){const e=Li(t);return[e]}{let e=[];return t&&(e=Ri(t)),q(n,((t,n)=>{e=e.concat(n)})),e}}))}function uo(e){return e._queryParams.loadsAllData()&&!e._queryParams.isDefault()?new(qi())(e._repo,e._path):e}function lo(e,t){for(let n=0;n<t.length;++n){const r=t[n];if(!r._queryParams.loadsAllData()){const t=io(r),n=e.queryToTagMap.get(t);e.queryToTagMap.delete(t),e.tagToQueryMap.delete(n)}}}function ho(){return Bi++}function fo(e,t,n){const r=t._path,i=ro(e,t),s=no(e,n),a=e.listenProvider_.startListening(uo(t),i,s.hashFn,s.onComplete),c=e.syncPointTree_.subtree(r);if(i)(0,o.hu)(!Mi(c.value),"If we're adding a query, it shouldn't be shadowed");else{const t=c.fold(((e,t,n)=>{if(!yt(e)&&t&&Mi(t))return[Li(t).query];{let e=[];return t&&(e=e.concat(Ri(t).map((e=>e.query)))),q(n,((t,n)=>{e=e.concat(n)})),e}}));for(let n=0;n<t.length;++n){const r=t[n];e.listenProvider_.stopListening(uo(r),ro(e,r))}}return a}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class po{constructor(e){this.node_=e}getImmediateChild(e){const t=this.node_.getImmediateChild(e);return new po(t)}node(){return this.node_}}class go{constructor(e,t){this.syncTree_=e,this.path_=t}getImmediateChild(e){const t=vt(this.path_,e);return new go(this.syncTree_,t)}node(){return Xi(this.syncTree_,this.path_)}}const mo=function(e){return e=e||{},e["timestamp"]=e["timestamp"]||(new Date).getTime(),e},_o=function(e,t,n){return e&&"object"===typeof e?((0,o.hu)(".sv"in e,"Unexpected leaf node or priority contents"),"string"===typeof e[".sv"]?vo(e[".sv"],t,n):"object"===typeof e[".sv"]?yo(e[".sv"],t):void(0,o.hu)(!1,"Unexpected server value: "+JSON.stringify(e,null,2))):e},vo=function(e,t,n){switch(e){case"timestamp":return n["timestamp"];default:(0,o.hu)(!1,"Unexpected server value: "+e)}},yo=function(e,t,n){e.hasOwnProperty("increment")||(0,o.hu)(!1,"Unexpected server value: "+JSON.stringify(e,null,2));const r=e["increment"];"number"!==typeof r&&(0,o.hu)(!1,"Unexpected increment value: "+r);const i=t.node();if((0,o.hu)(null!==i&&"undefined"!==typeof i,"Expected ChildrenNode.EMPTY_NODE for nulls"),!i.isLeafNode())return r;const s=i,a=s.getValue();return"number"!==typeof a?r:a+r},wo=function(e,t,n,r){return Co(t,new go(n,e),r)},bo=function(e,t,n){return Co(e,new po(t),n)};function Co(e,t,n){const r=e.getPriority().val(),i=_o(r,t.getImmediateChild(".priority"),n);let o;if(e.isLeafNode()){const r=e,o=_o(r.getValue(),t,n);return o!==r.getValue()||i!==r.getPriority().val()?new tn(o,vn(i)):e}{const r=e;return o=r,i!==r.getPriority().val()&&(o=o.updatePriority(new tn(i))),r.forEachChild(sn,((e,r)=>{const i=Co(r,t.getImmediateChild(e),n);i!==r&&(o=o.updateImmediateChild(e,i))})),o}}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class ko{constructor(e="",t=null,n={children:{},childCount:0}){this.name=e,this.parent=t,this.node=n}}function Eo(e,t){let n=t instanceof ut?t:new ut(t),r=e,i=ht(n);while(null!==i){const e=(0,o.DV)(r.node.children,i)||{children:{},childCount:0};r=new ko(i,r,e),n=ft(n),i=ht(n)}return r}function Io(e){return e.node.value}function To(e,t){e.node.value=t,Do(e)}function So(e){return e.node.childCount>0}function Po(e){return void 0===Io(e)&&!So(e)}function No(e,t){q(e.node.children,((n,r)=>{t(new ko(n,e,r))}))}function xo(e,t,n,r){n&&!r&&t(e),No(e,(e=>{xo(e,t,!0,r)})),n&&r&&t(e)}function Ro(e,t,n){let r=n?e:e.parent;while(null!==r){if(t(r))return!0;r=r.parent}return!1}function Ao(e){return new ut(null===e.parent?e.name:Ao(e.parent)+"/"+e.name)}function Do(e){null!==e.parent&&Oo(e.parent,e.name,e)}function Oo(e,t,n){const r=Po(n),i=(0,o.r3)(e.node.children,t);r&&i?(delete e.node.children[t],e.node.childCount--,Do(e)):r||i||(e.node.children[t]=n.node,e.node.childCount++,Do(e))}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Mo=/[\[\].#$\/\u0000-\u001F\u007F]/,Lo=/[\[\].#$\u0000-\u001F\u007F]/,Fo=10485760,qo=function(e){return"string"===typeof e&&0!==e.length&&!Mo.test(e)},Bo=function(e){return"string"===typeof e&&0!==e.length&&!Lo.test(e)},jo=function(e){return e&&(e=e.replace(/^\/*\.info(\/|$)/,"/")),Bo(e)},Uo=function(e,t,n,r){r&&void 0===t||Ho((0,o.gK)(e,"value"),t,n)},Ho=function(e,t,n){const r=n instanceof ut?new kt(n,e):n;if(void 0===t)throw new Error(e+"contains undefined "+St(r));if("function"===typeof t)throw new Error(e+"contains a function "+St(r)+" with contents = "+t.toString());if(N(t))throw new Error(e+"contains "+t.toString()+" "+St(r));if("string"===typeof t&&t.length>Fo/3&&(0,o.ug)(t)>Fo)throw new Error(e+"contains a string greater than "+Fo+" utf8 bytes "+St(r)+" ('"+t.substring(0,50)+"...')");if(t&&"object"===typeof t){let n=!1,i=!1;if(q(t,((t,o)=>{if(".value"===t)n=!0;else if(".priority"!==t&&".sv"!==t&&(i=!0,!qo(t)))throw new Error(e+" contains an invalid key ("+t+") "+St(r)+'.  Keys must be non-empty strings and can\'t contain ".", "#", "$", "/", "[", or "]"');Et(r,t),Ho(e,o,r),It(r)})),n&&i)throw new Error(e+' contains ".value" child '+St(r)+" in addition to actual children.")}},Wo=function(e,t,n,r){if((!r||void 0!==n)&&!Bo(n))throw new Error((0,o.gK)(e,t)+'was an invalid path = "'+n+'". Paths must be non-empty strings and can\'t contain ".", "#", "$", "[", or "]"')},$o=function(e,t,n,r){n&&(n=n.replace(/^\/*\.info(\/|$)/,"/")),Wo(e,t,n,r)},Vo=function(e,t){if(".info"===ht(t))throw new Error(e+" failed = Can't modify data under /.info/")},Ko=function(e,t){const n=t.path.toString();if("string"!==typeof t.repoInfo.host||0===t.repoInfo.host.length||!qo(t.repoInfo.namespace)&&"localhost"!==t.repoInfo.host.split(":")[0]||0!==n.length&&!jo(n))throw new Error((0,o.gK)(e,"url")+'must be a valid firebase URL and the path can\'t contain ".", "#", "$", "[", or "]".')};
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
class zo{constructor(){this.eventLists_=[],this.recursionDepth_=0}}function Go(e,t){let n=null;for(let r=0;r<t.length;r++){const i=t[r],o=i.getPath();null===n||bt(o,n.path)||(e.eventLists_.push(n),n=null),null===n&&(n={events:[],path:o}),n.events.push(i)}n&&e.eventLists_.push(n)}function Yo(e,t,n){Go(e,n),Jo(e,(e=>Ct(e,t)||Ct(t,e)))}function Jo(e,t){e.recursionDepth_++;let n=!0;for(let r=0;r<e.eventLists_.length;r++){const i=e.eventLists_[r];if(i){const o=i.path;t(o)?(Xo(e.eventLists_[r]),e.eventLists_[r]=null):n=!1}}n&&(e.eventLists_=[]),e.recursionDepth_--}function Xo(e){for(let t=0;t<e.events.length;t++){const n=e.events[t];if(null!==n){e.events[t]=null;const r=n.getEventRunner();w&&k("event: "+n.toString()),z(r)}}}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Qo="repo_interrupt",Zo=25;class es{constructor(e,t,n,r){this.repoInfo_=e,this.forceRestClient_=t,this.authTokenProvider_=n,this.appCheckProvider_=r,this.dataUpdateCount=0,this.statsListener_=null,this.eventQueue_=new zo,this.nextWriteId_=1,this.interceptServerDataCallback_=null,this.onDisconnect_=Ln(),this.transactionQueueTree_=new ko,this.persistentConnection_=null,this.key=this.repoInfo_.toURLString()}toString(){return(this.repoInfo_.secure?"https://":"http://")+this.repoInfo_.host}}function ts(e,t,n){if(e.stats_=me(e.repoInfo_),e.forceRestClient_||G())e.server_=new On(e.repoInfo_,((t,n,r,i)=>{is(e,t,n,r,i)}),e.authTokenProvider_,e.appCheckProvider_),setTimeout((()=>os(e,!0)),0);else{if("undefined"!==typeof n&&null!==n){if("object"!==typeof n)throw new Error("Only objects are supported for option databaseAuthVariableOverride");try{(0,o.Wl)(n)}catch(r){throw new Error("Invalid authOverride provided: "+r)}}e.persistentConnection_=new Lt(e.repoInfo_,t,((t,n,r,i)=>{is(e,t,n,r,i)}),(t=>{os(e,t)}),(t=>{ss(e,t)}),e.authTokenProvider_,e.appCheckProvider_,n),e.server_=e.persistentConnection_}e.authTokenProvider_.addTokenChangeListener((t=>{e.server_.refreshAuthToken(t)})),e.appCheckProvider_.addTokenChangeListener((t=>{e.server_.refreshAppCheckToken(t.token)})),e.statsReporter_=_e(e.repoInfo_,(()=>new $n(e.stats_,e.server_))),e.infoData_=new Mn,e.infoSyncTree_=new ji({startListening:(t,n,r,i)=>{let o=[];const s=e.infoData_.getNode(t._path);return s.isEmpty()||(o=Wi(e.infoSyncTree_,t._path,s),setTimeout((()=>{i("ok")}),0)),o},stopListening:()=>{}}),as(e,"connected",!1),e.serverSyncTree_=new ji({startListening:(t,n,r,i)=>(e.server_.listen(t,r,n,((n,r)=>{const o=i(n,r);Yo(e.eventQueue_,t._path,o)})),[]),stopListening:(t,n)=>{e.server_.unlisten(t,n)}})}function ns(e){const t=e.infoData_.getNode(new ut(".info/serverTimeOffset")),n=t.val()||0;return(new Date).getTime()+n}function rs(e){return mo({timestamp:ns(e)})}function is(e,t,n,r,i){e.dataUpdateCount++;const s=new ut(t);n=e.interceptServerDataCallback_?e.interceptServerDataCallback_(t,n):n;let a=[];if(i)if(r){const t=(0,o.UI)(n,(e=>vn(e)));a=Yi(e.serverSyncTree_,s,t,i)}else{const t=vn(n);a=Gi(e.serverSyncTree_,s,t,i)}else if(r){const t=(0,o.UI)(n,(e=>vn(e)));a=$i(e.serverSyncTree_,s,t)}else{const t=vn(n);a=Wi(e.serverSyncTree_,s,t)}let c=s;a.length>0&&(c=vs(e,s)),Yo(e.eventQueue_,c,a)}function os(e,t){as(e,"connected",t),!1===t&&hs(e)}function ss(e,t){q(t,((t,n)=>{as(e,t,n)}))}function as(e,t,n){const r=new ut("/.info/"+t),i=vn(n);e.infoData_.updateSnapshot(r,i);const o=Wi(e.infoSyncTree_,r,i);Yo(e.eventQueue_,r,o)}function cs(e){return e.nextWriteId_++}function us(e,t,n){const r=Qi(e.serverSyncTree_,t);return null!=r?Promise.resolve(r):e.server_.get(t).then((r=>{const i=vn(r).withIndex(t._queryParams.getIndex());let o;if(Ji(e.serverSyncTree_,t,n,!0),t._queryParams.loadsAllData())o=Wi(e.serverSyncTree_,t._path,i);else{const n=ro(e.serverSyncTree_,t);o=Gi(e.serverSyncTree_,t._path,i,n)}return Yo(e.eventQueue_,t._path,o),zi(e.serverSyncTree_,t,n,null,!0),i}),(n=>(fs(e,"get for query "+(0,o.Wl)(t)+" failed: "+n),Promise.reject(new Error(n)))))}function ls(e,t,n,r,i){fs(e,"set",{path:t.toString(),value:n,priority:r});const o=rs(e),s=vn(n,r),a=Xi(e.serverSyncTree_,t),c=bo(s,a,o),u=cs(e),l=Ui(e.serverSyncTree_,t,c,u,!0);Go(e.eventQueue_,l),e.server_.put(t.toString(),s.val(!0),((n,r)=>{const o="ok"===n;o||S("set at "+t+" failed: "+n);const s=Hi(e.serverSyncTree_,u,!o);Yo(e.eventQueue_,t,s),ps(e,i,n,r)}));const h=Es(e,t);vs(e,h),Yo(e.eventQueue_,h,[])}function hs(e){fs(e,"onDisconnectEvents");const t=rs(e),n=Ln();qn(e.onDisconnect_,lt(),((r,i)=>{const o=wo(r,i,e.serverSyncTree_,t);Fn(n,r,o)}));let r=[];qn(n,lt(),((t,n)=>{r=r.concat(Wi(e.serverSyncTree_,t,n));const i=Es(e,t);vs(e,i)})),e.onDisconnect_=Ln(),Yo(e.eventQueue_,lt(),r)}function ds(e){e.persistentConnection_&&e.persistentConnection_.interrupt(Qo)}function fs(e,...t){let n="";e.persistentConnection_&&(n=e.persistentConnection_.id+":"),k(n,...t)}function ps(e,t,n,r){t&&z((()=>{if("ok"===n)t(null);else{const e=(n||"error").toUpperCase();let i=e;r&&(i+=": "+r);const o=new Error(i);o.code=e,t(o)}}))}function gs(e,t,n){return Xi(e.serverSyncTree_,t,n)||pn.EMPTY_NODE}function ms(e,t=e.transactionQueueTree_){if(t||ks(e,t),Io(t)){const n=bs(e,t);(0,o.hu)(n.length>0,"Sending zero length transaction queue");const r=n.every((e=>0===e.status));r&&_s(e,Ao(t),n)}else So(t)&&No(t,(t=>{ms(e,t)}))}function _s(e,t,n){const r=n.map((e=>e.currentWriteId)),i=gs(e,t,r);let s=i;const a=i.hash();for(let l=0;l<n.length;l++){const e=n[l];(0,o.hu)(0===e.status,"tryToSendTransactionQueue_: items in queue should all be run."),e.status=1,e.retryCount++;const r=wt(t,e.path);s=s.updateChild(r,e.currentOutputSnapshotRaw)}const c=s.val(!0),u=t;e.server_.put(u.toString(),c,(r=>{fs(e,"transaction put response",{path:u.toString(),status:r});let i=[];if("ok"===r){const r=[];for(let t=0;t<n.length;t++)n[t].status=2,i=i.concat(Hi(e.serverSyncTree_,n[t].currentWriteId)),n[t].onComplete&&r.push((()=>n[t].onComplete(null,!0,n[t].currentOutputSnapshotResolved))),n[t].unwatcher();ks(e,Eo(e.transactionQueueTree_,t)),ms(e,e.transactionQueueTree_),Yo(e.eventQueue_,t,i);for(let e=0;e<r.length;e++)z(r[e])}else{if("datastale"===r)for(let e=0;e<n.length;e++)3===n[e].status?n[e].status=4:n[e].status=0;else{S("transaction at "+u.toString()+" failed: "+r);for(let e=0;e<n.length;e++)n[e].status=4,n[e].abortReason=r}vs(e,t)}}),a)}function vs(e,t){const n=ws(e,t),r=Ao(n),i=bs(e,n);return ys(e,i,r),r}function ys(e,t,n){if(0===t.length)return;const r=[];let i=[];const s=t.filter((e=>0===e.status)),a=s.map((e=>e.currentWriteId));for(let c=0;c<t.length;c++){const s=t[c],u=wt(n,s.path);let l,h=!1;if((0,o.hu)(null!==u,"rerunTransactionsUnderNode_: relativePath should not be null."),4===s.status)h=!0,l=s.abortReason,i=i.concat(Hi(e.serverSyncTree_,s.currentWriteId,!0));else if(0===s.status)if(s.retryCount>=Zo)h=!0,l="maxretry",i=i.concat(Hi(e.serverSyncTree_,s.currentWriteId,!0));else{const n=gs(e,s.path,a);s.currentInputSnapshot=n;const r=t[c].update(n.val());if(void 0!==r){Ho("transaction failed: Data returned ",r,s.path);let t=vn(r);const c="object"===typeof r&&null!=r&&(0,o.r3)(r,".priority");c||(t=t.updatePriority(n.getPriority()));const u=s.currentWriteId,l=rs(e),h=bo(t,n,l);s.currentOutputSnapshotRaw=t,s.currentOutputSnapshotResolved=h,s.currentWriteId=cs(e),a.splice(a.indexOf(u),1),i=i.concat(Ui(e.serverSyncTree_,s.path,h,s.currentWriteId,s.applyLocally)),i=i.concat(Hi(e.serverSyncTree_,u,!0))}else h=!0,l="nodata",i=i.concat(Hi(e.serverSyncTree_,s.currentWriteId,!0))}Yo(e.eventQueue_,n,i),i=[],h&&(t[c].status=2,function(e){setTimeout(e,Math.floor(0))}(t[c].unwatcher),t[c].onComplete&&("nodata"===l?r.push((()=>t[c].onComplete(null,!1,t[c].currentInputSnapshot))):r.push((()=>t[c].onComplete(new Error(l),!1,null)))))}ks(e,e.transactionQueueTree_);for(let o=0;o<r.length;o++)z(r[o]);ms(e,e.transactionQueueTree_)}function ws(e,t){let n,r=e.transactionQueueTree_;n=ht(t);while(null!==n&&void 0===Io(r))r=Eo(r,n),t=ft(t),n=ht(t);return r}function bs(e,t){const n=[];return Cs(e,t,n),n.sort(((e,t)=>e.order-t.order)),n}function Cs(e,t,n){const r=Io(t);if(r)for(let i=0;i<r.length;i++)n.push(r[i]);No(t,(t=>{Cs(e,t,n)}))}function ks(e,t){const n=Io(t);if(n){let e=0;for(let t=0;t<n.length;t++)2!==n[t].status&&(n[e]=n[t],e++);n.length=e,To(t,n.length>0?n:void 0)}No(t,(t=>{ks(e,t)}))}function Es(e,t){const n=Ao(ws(e,t)),r=Eo(e.transactionQueueTree_,t);return Ro(r,(t=>{Is(e,t)})),Is(e,r),xo(r,(t=>{Is(e,t)})),n}function Is(e,t){const n=Io(t);if(n){const r=[];let i=[],s=-1;for(let t=0;t<n.length;t++)3===n[t].status||(1===n[t].status?((0,o.hu)(s===t-1,"All SENT items should be at beginning of queue."),s=t,n[t].status=3,n[t].abortReason="set"):((0,o.hu)(0===n[t].status,"Unexpected transaction status in abort"),n[t].unwatcher(),i=i.concat(Hi(e.serverSyncTree_,n[t].currentWriteId,!0)),n[t].onComplete&&r.push(n[t].onComplete.bind(null,new Error("set"),!1,null))));-1===s?To(t,void 0):n.length=s+1,Yo(e.eventQueue_,Ao(t),i);for(let e=0;e<r.length;e++)z(r[e])}}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Ts(e){let t="";const n=e.split("/");for(let i=0;i<n.length;i++)if(n[i].length>0){let e=n[i];try{e=decodeURIComponent(e.replace(/\+/g," "))}catch(r){}t+="/"+e}return t}function Ss(e){const t={};"?"===e.charAt(0)&&(e=e.substring(1));for(const n of e.split("&")){if(0===n.length)continue;const r=n.split("=");2===r.length?t[decodeURIComponent(r[0])]=decodeURIComponent(r[1]):S(`Invalid query segment '${n}' in query '${e}'`)}return t}const Ps=function(e,t){const n=Ns(e),r=n.namespace;"firebase.com"===n.domain&&T(n.host+" is no longer supported. Please use <YOUR FIREBASE>.firebaseio.com instead"),r&&"undefined"!==r||"localhost"===n.domain||T("Cannot parse Firebase url. Please use https://<YOUR FIREBASE>.firebaseio.com"),n.secure||P();const i="ws"===n.scheme||"wss"===n.scheme;return{repoInfo:new le(n.host,n.secure,r,i,t,"",r!==n.subdomain),path:new ut(n.pathString)}},Ns=function(e){let t="",n="",r="",i="",o="",s=!0,a="https",c=443;if("string"===typeof e){let u=e.indexOf("//");u>=0&&(a=e.substring(0,u-1),e=e.substring(u+2));let l=e.indexOf("/");-1===l&&(l=e.length);let h=e.indexOf("?");-1===h&&(h=e.length),t=e.substring(0,Math.min(l,h)),l<h&&(i=Ts(e.substring(l,h)));const d=Ss(e.substring(Math.min(e.length,h)));u=t.indexOf(":"),u>=0?(s="https"===a||"wss"===a,c=parseInt(t.substring(u+1),10)):u=t.length;const f=t.slice(0,u);if("localhost"===f.toLowerCase())n="localhost";else if(f.split(".").length<=2)n=f;else{const e=t.indexOf(".");r=t.substring(0,e).toLowerCase(),n=t.substring(e+1),o=r}"ns"in d&&(o=d["ns"])}return{host:t,port:c,domain:n,subdomain:r,secure:s,scheme:a,pathString:i,namespace:o}},xs="-0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz",Rs=function(){let e=0;const t=[];return function(n){const r=n===e;let i;e=n;const s=new Array(8);for(i=7;i>=0;i--)s[i]=xs.charAt(n%64),n=Math.floor(n/64);(0,o.hu)(0===n,"Cannot push at time == 0");let a=s.join("");if(r){for(i=11;i>=0&&63===t[i];i--)t[i]=0;t[i]++}else for(i=0;i<12;i++)t[i]=Math.floor(64*Math.random());for(i=0;i<12;i++)a+=xs.charAt(t[i]);return(0,o.hu)(20===a.length,"nextPushId: Length should be 20."),a}}();
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
class As{constructor(e,t,n,r){this.eventType=e,this.eventRegistration=t,this.snapshot=n,this.prevName=r}getPath(){const e=this.snapshot.ref;return"value"===this.eventType?e._path:e.parent._path}getEventType(){return this.eventType}getEventRunner(){return this.eventRegistration.getEventRunner(this)}toString(){return this.getPath().toString()+":"+this.eventType+":"+(0,o.Wl)(this.snapshot.exportVal())}}class Ds{constructor(e,t,n){this.eventRegistration=e,this.error=t,this.path=n}getPath(){return this.path}getEventType(){return"cancel"}getEventRunner(){return this.eventRegistration.getEventRunner(this)}toString(){return this.path.toString()+":cancel"}}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Os{constructor(e,t){this.snapshotCallback=e,this.cancelCallback=t}onValue(e,t){this.snapshotCallback.call(null,e,t)}onCancel(e){return(0,o.hu)(this.hasCancelCallback,"Raising a cancel event on a listener with no cancel callback"),this.cancelCallback.call(null,e)}get hasCancelCallback(){return!!this.cancelCallback}matches(e){return this.snapshotCallback===e.snapshotCallback||void 0!==this.snapshotCallback.userCallback&&this.snapshotCallback.userCallback===e.snapshotCallback.userCallback&&this.snapshotCallback.context===e.snapshotCallback.context}}
/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
class Ms{constructor(e,t,n,r){this._repo=e,this._path=t,this._queryParams=n,this._orderByCalled=r}get key(){return yt(this._path)?null:pt(this._path)}get ref(){return new Ls(this._repo,this._path)}get _queryIdentifier(){const e=Dn(this._queryParams),t=L(e);return"{}"===t?"default":t}get _queryObject(){return Dn(this._queryParams)}isEqual(e){if(e=(0,o.m9)(e),!(e instanceof Ms))return!1;const t=this._repo===e._repo,n=bt(this._path,e._path),r=this._queryIdentifier===e._queryIdentifier;return t&&n&&r}toJSON(){return this.toString()}toString(){return this._repo.toString()+gt(this._path)}}class Ls extends Ms{constructor(e,t){super(e,t,new xn,!1)}get parent(){const e=_t(this._path);return null===e?null:new Ls(this._repo,e)}get root(){let e=this;while(null!==e.parent)e=e.parent;return e}}class Fs{constructor(e,t,n){this._node=e,this.ref=t,this._index=n}get priority(){return this._node.getPriority().val()}get key(){return this.ref.key}get size(){return this._node.numChildren()}child(e){const t=new ut(e),n=Bs(this.ref,e);return new Fs(this._node.getChild(t),n,sn)}exists(){return!this._node.isEmpty()}exportVal(){return this._node.val(!0)}forEach(e){if(this._node.isLeafNode())return!1;const t=this._node;return!!t.forEachChild(this._index,((t,n)=>e(new Fs(n,Bs(this.ref,t),sn))))}hasChild(e){const t=new ut(e);return!this._node.getChild(t).isEmpty()}hasChildren(){return!this._node.isLeafNode()&&!this._node.isEmpty()}toJSON(){return this.exportVal()}val(){return this._node.val()}}function qs(e,t){return e=(0,o.m9)(e),e._checkNotDeleted("ref"),void 0!==t?Bs(e._root,t):e._root}function Bs(e,t){return e=(0,o.m9)(e),null===ht(e._path)?$o("child","path",t,!1):Wo("child","path",t,!1),new Ls(e._repo,vt(e._path,t))}function js(e,t){e=(0,o.m9)(e),Vo("push",e._path),Uo("push",t,e._path,!0);const n=ns(e._repo),r=Rs(n),i=Bs(e,r),s=Bs(e,r);let a;return a=null!=t?Us(s,t).then((()=>s)):Promise.resolve(s),i.then=a.then.bind(a),i.catch=a.then.bind(a,void 0),i}function Us(e,t){e=(0,o.m9)(e),Vo("set",e._path),Uo("set",t,e._path,!1);const n=new o.BH;return ls(e._repo,e._path,t,null,n.wrapCallback((()=>{}))),n.promise}function Hs(e){e=(0,o.m9)(e);const t=new Os((()=>{})),n=new Ws(t);return us(e._repo,e,n).then((t=>new Fs(t,new Ls(e._repo,e._path),e._queryParams.getIndex())))}class Ws{constructor(e){this.callbackContext=e}respondsTo(e){return"value"===e}createEvent(e,t){const n=t._queryParams.getIndex();return new As("value",this,new Fs(e.snapshotNode,new Ls(t._repo,t._path),n))}getEventRunner(e){return"cancel"===e.getEventType()?()=>this.callbackContext.onCancel(e.error):()=>this.callbackContext.onValue(e.snapshot,null)}createCancelEvent(e,t){return this.callbackContext.hasCancelCallback?new Ds(this,e,t):null}matches(e){return e instanceof Ws&&(!e.callbackContext||!this.callbackContext||e.callbackContext.matches(this.callbackContext))}hasAnyCallback(){return null!==this.callbackContext}}Ei(Ls),Fi(Ls);
/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
const $s="FIREBASE_DATABASE_EMULATOR_HOST",Vs={};let Ks=!1;function zs(e,t,n,r){e.repoInfo_=new le(`${t}:${n}`,!1,e.repoInfo_.namespace,e.repoInfo_.webSocketOnly,e.repoInfo_.nodeAdmin,e.repoInfo_.persistenceKey,e.repoInfo_.includeNamespaceInQueryParams),r&&(e.authTokenProvider_=r)}function Gs(e,t,n,r,i){let o=r||e.options.databaseURL;void 0===o&&(e.options.projectId||T("Can't determine Firebase Database URL. Be sure to include  a Project ID when calling firebase.initializeApp()."),k("Using default host for project ",e.options.projectId),o=`${e.options.projectId}-default-rtdb.firebaseio.com`);let s,a,c=Ps(o,i),u=c.repoInfo;"undefined"!==typeof process&&(a={NODE_ENV:"production",BASE_URL:"/petanque-swiss-vue/dist/"}[$s]),a?(s=!0,o=`http://${a}?ns=${u.namespace}`,c=Ps(o,i),u=c.repoInfo):s=!c.repoInfo.secure;const l=i&&s?new Q(Q.OWNER):new X(e.name,e.options,t);Ko("Invalid Firebase Database URL",c),yt(c.path)||T("Database URL must point to the root of a Firebase Database (not including a child path).");const h=Js(u,e,l,new J(e.name,n));return new Xs(h,e)}function Ys(e,t){const n=Vs[t];n&&n[e.key]===e||T(`Database ${t}(${e.repoInfo_}) has already been deleted.`),ds(e),delete n[e.key]}function Js(e,t,n,r){let i=Vs[t.name];i||(i={},Vs[t.name]=i);let o=i[e.toURLString()];return o&&T("Database initialized multiple times. Please make sure the format of the database URL matches with each database() call."),o=new es(e,Ks,n,r),i[e.toURLString()]=o,o}class Xs{constructor(e,t){this._repoInternal=e,this.app=t,this["type"]="database",this._instanceStarted=!1}get _repo(){return this._instanceStarted||(ts(this._repoInternal,this.app.options.appId,this.app.options["databaseAuthVariableOverride"]),this._instanceStarted=!0),this._repoInternal}get _root(){return this._rootInternal||(this._rootInternal=new Ls(this._repo,lt())),this._rootInternal}_delete(){return null!==this._rootInternal&&(Ys(this._repo,this.app.name),this._repoInternal=null,this._rootInternal=null),Promise.resolve()}_checkNotDeleted(e){null===this._rootInternal&&T("Cannot call "+e+" on a deleted database.")}}function Qs(e=(0,r.Mq)(),t){const n=(0,r.qX)(e,"database").getImmediate({identifier:t});if(!n._instanceStarted){const e=(0,o.P0)("database");e&&Zs(n,...e)}return n}function Zs(e,t,n,r={}){e=(0,o.m9)(e),e._checkNotDeleted("useEmulator"),e._instanceStarted&&T("Cannot call useEmulator() after instance has already been initialized.");const i=e._repoInternal;let s;if(i.repoInfo_.nodeAdmin)r.mockUserToken&&T('mockUserToken is not supported by the Admin SDK. For client access with mock users, please use the "firebase" package instead of "firebase-admin".'),s=new Q(Q.OWNER);else if(r.mockUserToken){const t="string"===typeof r.mockUserToken?r.mockUserToken:(0,o.Sg)(r.mockUserToken,e.app.options.projectId);s=new Q(t)}zs(i,t,n,s)}
/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
function ea(e){l(r.Jn),(0,r.Xd)(new i.wA("database",((e,{instanceIdentifier:t})=>{const n=e.getProvider("app").getImmediate(),r=e.getProvider("auth-internal"),i=e.getProvider("app-check-internal");return Gs(n,r,i,t)}),"PUBLIC").setMultipleInstances(!0)),(0,r.KN)(a,c,e),(0,r.KN)(a,c,"esm2017")}
/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */Lt.prototype.simpleListen=function(e,t){this.sendRequest("q",{p:e},t)},Lt.prototype.echo=function(e,t){this.sendRequest("echo",{d:e},t)};ea()},61:function(e,t,n){"use strict";n.d(t,{KL:function(){return Mt},LP:function(){return Lt},ps:function(){return Ft}});var r=n(238),i=n(463),o=n(444),s=n(531);const a="@firebase/installations",c="0.6.1",u=1e4,l=`w:${c}`,h="FIS_v2",d="https://firebaseinstallations.googleapis.com/v1",f=36e5,p="installations",g="Installations",m={["missing-app-config-values"]:'Missing App configuration value: "{$valueName}"',["not-registered"]:"Firebase Installation is not registered.",["installation-not-found"]:"Firebase Installation not found.",["request-failed"]:'{$requestName} request failed with error "{$serverCode} {$serverStatus}: {$serverMessage}"',["app-offline"]:"Could not process request. Application offline.",["delete-pending-registration"]:"Can't delete installation while there is a pending registration request."},_=new o.LL(p,g,m);function v(e){return e instanceof o.ZR&&e.code.includes("request-failed")}
/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function y({projectId:e}){return`${d}/projects/${e}/installations`}function w(e){return{token:e.token,requestStatus:2,expiresIn:I(e.expiresIn),creationTime:Date.now()}}async function b(e,t){const n=await t.json(),r=n.error;return _.create("request-failed",{requestName:e,serverCode:r.code,serverMessage:r.message,serverStatus:r.status})}function C({apiKey:e}){return new Headers({"Content-Type":"application/json",Accept:"application/json","x-goog-api-key":e})}function k(e,{refreshToken:t}){const n=C(e);return n.append("Authorization",T(t)),n}async function E(e){const t=await e();return t.status>=500&&t.status<600?e():t}function I(e){return Number(e.replace("s","000"))}function T(e){return`${h} ${e}`}
/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function S({appConfig:e,heartbeatServiceProvider:t},{fid:n}){const r=y(e),i=C(e),o=t.getImmediate({optional:!0});if(o){const e=await o.getHeartbeatsHeader();e&&i.append("x-firebase-client",e)}const s={fid:n,authVersion:h,appId:e.appId,sdkVersion:l},a={method:"POST",headers:i,body:JSON.stringify(s)},c=await E((()=>fetch(r,a)));if(c.ok){const e=await c.json(),t={fid:e.fid||n,registrationStatus:2,refreshToken:e.refreshToken,authToken:w(e.authToken)};return t}throw await b("Create Installation",c)}
/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function P(e){return new Promise((t=>{setTimeout(t,e)}))}
/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function N(e){const t=btoa(String.fromCharCode(...e));return t.replace(/\+/g,"-").replace(/\//g,"_")}
/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const x=/^[cdef][\w-]{21}$/,R="";function A(){try{const e=new Uint8Array(17),t=self.crypto||self.msCrypto;t.getRandomValues(e),e[0]=112+e[0]%16;const n=D(e);return x.test(n)?n:R}catch(e){return R}}function D(e){const t=N(e);return t.substr(0,22)}
/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function O(e){return`${e.appName}!${e.appId}`}
/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const M=new Map;function L(e,t){const n=O(e);F(n,t),q(n,t)}function F(e,t){const n=M.get(e);if(n)for(const r of n)r(t)}function q(e,t){const n=j();n&&n.postMessage({key:e,fid:t}),U()}let B=null;function j(){return!B&&"BroadcastChannel"in self&&(B=new BroadcastChannel("[Firebase] FID Change"),B.onmessage=e=>{F(e.data.key,e.data.fid)}),B}function U(){0===M.size&&B&&(B.close(),B=null)}
/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const H="firebase-installations-database",W=1,$="firebase-installations-store";let V=null;function K(){return V||(V=(0,s.X3)(H,W,{upgrade:(e,t)=>{switch(t){case 0:e.createObjectStore($)}}})),V}async function z(e,t){const n=O(e),r=await K(),i=r.transaction($,"readwrite"),o=i.objectStore($),s=await o.get(n);return await o.put(t,n),await i.done,s&&s.fid===t.fid||L(e,t.fid),t}async function G(e){const t=O(e),n=await K(),r=n.transaction($,"readwrite");await r.objectStore($).delete(t),await r.done}async function Y(e,t){const n=O(e),r=await K(),i=r.transaction($,"readwrite"),o=i.objectStore($),s=await o.get(n),a=t(s);return void 0===a?await o.delete(n):await o.put(a,n),await i.done,!a||s&&s.fid===a.fid||L(e,a.fid),a}
/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function J(e){let t;const n=await Y(e.appConfig,(n=>{const r=X(n),i=Q(e,r);return t=i.registrationPromise,i.installationEntry}));return n.fid===R?{installationEntry:await t}:{installationEntry:n,registrationPromise:t}}function X(e){const t=e||{fid:A(),registrationStatus:0};return ne(t)}function Q(e,t){if(0===t.registrationStatus){if(!navigator.onLine){const e=Promise.reject(_.create("app-offline"));return{installationEntry:t,registrationPromise:e}}const n={fid:t.fid,registrationStatus:1,registrationTime:Date.now()},r=Z(e,n);return{installationEntry:n,registrationPromise:r}}return 1===t.registrationStatus?{installationEntry:t,registrationPromise:ee(e)}:{installationEntry:t}}async function Z(e,t){try{const n=await S(e,t);return z(e.appConfig,n)}catch(n){throw v(n)&&409===n.customData.serverCode?await G(e.appConfig):await z(e.appConfig,{fid:t.fid,registrationStatus:0}),n}}async function ee(e){let t=await te(e.appConfig);while(1===t.registrationStatus)await P(100),t=await te(e.appConfig);if(0===t.registrationStatus){const{installationEntry:t,registrationPromise:n}=await J(e);return n||t}return t}function te(e){return Y(e,(e=>{if(!e)throw _.create("installation-not-found");return ne(e)}))}function ne(e){return re(e)?{fid:e.fid,registrationStatus:0}:e}function re(e){return 1===e.registrationStatus&&e.registrationTime+u<Date.now()}
/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function ie({appConfig:e,heartbeatServiceProvider:t},n){const r=oe(e,n),i=k(e,n),o=t.getImmediate({optional:!0});if(o){const e=await o.getHeartbeatsHeader();e&&i.append("x-firebase-client",e)}const s={installation:{sdkVersion:l,appId:e.appId}},a={method:"POST",headers:i,body:JSON.stringify(s)},c=await E((()=>fetch(r,a)));if(c.ok){const e=await c.json(),t=w(e);return t}throw await b("Generate Auth Token",c)}function oe(e,{fid:t}){return`${y(e)}/${t}/authTokens:generate`}
/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function se(e,t=!1){let n;const r=await Y(e.appConfig,(r=>{if(!le(r))throw _.create("not-registered");const i=r.authToken;if(!t&&he(i))return r;if(1===i.requestStatus)return n=ae(e,t),r;{if(!navigator.onLine)throw _.create("app-offline");const t=fe(r);return n=ue(e,t),t}})),i=n?await n:r.authToken;return i}async function ae(e,t){let n=await ce(e.appConfig);while(1===n.authToken.requestStatus)await P(100),n=await ce(e.appConfig);const r=n.authToken;return 0===r.requestStatus?se(e,t):r}function ce(e){return Y(e,(e=>{if(!le(e))throw _.create("not-registered");const t=e.authToken;return pe(t)?Object.assign(Object.assign({},e),{authToken:{requestStatus:0}}):e}))}async function ue(e,t){try{const n=await ie(e,t),r=Object.assign(Object.assign({},t),{authToken:n});return await z(e.appConfig,r),n}catch(n){if(!v(n)||401!==n.customData.serverCode&&404!==n.customData.serverCode){const n=Object.assign(Object.assign({},t),{authToken:{requestStatus:0}});await z(e.appConfig,n)}else await G(e.appConfig);throw n}}function le(e){return void 0!==e&&2===e.registrationStatus}function he(e){return 2===e.requestStatus&&!de(e)}function de(e){const t=Date.now();return t<e.creationTime||e.creationTime+e.expiresIn<t+f}function fe(e){const t={requestStatus:1,requestTime:Date.now()};return Object.assign(Object.assign({},e),{authToken:t})}function pe(e){return 1===e.requestStatus&&e.requestTime+u<Date.now()}
/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function ge(e){const t=e,{installationEntry:n,registrationPromise:r}=await J(t);return r?r.catch(console.error):se(t).catch(console.error),n.fid}
/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function me(e,t=!1){const n=e;await _e(n);const r=await se(n,t);return r.token}async function _e(e){const{registrationPromise:t}=await J(e);t&&await t}
/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
function ve(e){if(!e||!e.options)throw ye("App Configuration");if(!e.name)throw ye("App Name");const t=["projectId","apiKey","appId"];for(const n of t)if(!e.options[n])throw ye(n);return{appName:e.name,projectId:e.options.projectId,apiKey:e.options.apiKey,appId:e.options.appId}}function ye(e){return _.create("missing-app-config-values",{valueName:e})}
/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const we="installations",be="installations-internal",Ce=e=>{const t=e.getProvider("app").getImmediate(),n=ve(t),i=(0,r.qX)(t,"heartbeat"),o={app:t,appConfig:n,heartbeatServiceProvider:i,_delete:()=>Promise.resolve()};return o},ke=e=>{const t=e.getProvider("app").getImmediate(),n=(0,r.qX)(t,we).getImmediate(),i={getId:()=>ge(n),getToken:e=>me(n,e)};return i};function Ee(){(0,r.Xd)(new i.wA(we,Ce,"PUBLIC")),(0,r.Xd)(new i.wA(be,ke,"PRIVATE"))}Ee(),(0,r.KN)(a,c),(0,r.KN)(a,c,"esm2017");
/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
const Ie="/firebase-messaging-sw.js",Te="/firebase-cloud-messaging-push-scope",Se="BDOU99-h67HcA6JeFXHbSNMu7e2yNNu3RzoMj8TM4W88jITfq7ZmPvIM1Iv-4_l2LxQcYwhqby2xGpWwzjfAnG4",Pe="https://fcmregistrations.googleapis.com/v1",Ne="google.c.a.c_id",xe="google.c.a.c_l",Re="google.c.a.ts",Ae="google.c.a.e";var De,Oe;
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
function Me(e){const t=new Uint8Array(e),n=btoa(String.fromCharCode(...t));return n.replace(/=/g,"").replace(/\+/g,"-").replace(/\//g,"_")}function Le(e){const t="=".repeat((4-e.length%4)%4),n=(e+t).replace(/\-/g,"+").replace(/_/g,"/"),r=atob(n),i=new Uint8Array(r.length);for(let o=0;o<r.length;++o)i[o]=r.charCodeAt(o);return i}
/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */(function(e){e[e["DATA_MESSAGE"]=1]="DATA_MESSAGE",e[e["DISPLAY_NOTIFICATION"]=3]="DISPLAY_NOTIFICATION"})(De||(De={})),function(e){e["PUSH_RECEIVED"]="push-received",e["NOTIFICATION_CLICKED"]="notification-clicked"}(Oe||(Oe={}));const Fe="fcm_token_details_db",qe=5,Be="fcm_token_object_Store";async function je(e){if("databases"in indexedDB){const e=await indexedDB.databases(),t=e.map((e=>e.name));if(!t.includes(Fe))return null}let t=null;const n=await(0,s.X3)(Fe,qe,{upgrade:async(n,r,i,o)=>{var s;if(r<2)return;if(!n.objectStoreNames.contains(Be))return;const a=o.objectStore(Be),c=await a.index("fcmSenderId").get(e);if(await a.clear(),c)if(2===r){const e=c;if(!e.auth||!e.p256dh||!e.endpoint)return;t={token:e.fcmToken,createTime:null!==(s=e.createTime)&&void 0!==s?s:Date.now(),subscriptionOptions:{auth:e.auth,p256dh:e.p256dh,endpoint:e.endpoint,swScope:e.swScope,vapidKey:"string"===typeof e.vapidKey?e.vapidKey:Me(e.vapidKey)}}}else if(3===r){const e=c;t={token:e.fcmToken,createTime:e.createTime,subscriptionOptions:{auth:Me(e.auth),p256dh:Me(e.p256dh),endpoint:e.endpoint,swScope:e.swScope,vapidKey:Me(e.vapidKey)}}}else if(4===r){const e=c;t={token:e.fcmToken,createTime:e.createTime,subscriptionOptions:{auth:Me(e.auth),p256dh:Me(e.p256dh),endpoint:e.endpoint,swScope:e.swScope,vapidKey:Me(e.vapidKey)}}}}});return n.close(),await(0,s.Lj)(Fe),await(0,s.Lj)("fcm_vapid_details_db"),await(0,s.Lj)("undefined"),Ue(t)?t:null}function Ue(e){if(!e||!e.subscriptionOptions)return!1;const{subscriptionOptions:t}=e;return"number"===typeof e.createTime&&e.createTime>0&&"string"===typeof e.token&&e.token.length>0&&"string"===typeof t.auth&&t.auth.length>0&&"string"===typeof t.p256dh&&t.p256dh.length>0&&"string"===typeof t.endpoint&&t.endpoint.length>0&&"string"===typeof t.swScope&&t.swScope.length>0&&"string"===typeof t.vapidKey&&t.vapidKey.length>0}
/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const He="firebase-messaging-database",We=1,$e="firebase-messaging-store";let Ve=null;function Ke(){return Ve||(Ve=(0,s.X3)(He,We,{upgrade:(e,t)=>{switch(t){case 0:e.createObjectStore($e)}}})),Ve}async function ze(e){const t=Je(e),n=await Ke(),r=await n.transaction($e).objectStore($e).get(t);if(r)return r;{const t=await je(e.appConfig.senderId);if(t)return await Ge(e,t),t}}async function Ge(e,t){const n=Je(e),r=await Ke(),i=r.transaction($e,"readwrite");return await i.objectStore($e).put(t,n),await i.done,t}async function Ye(e){const t=Je(e),n=await Ke(),r=n.transaction($e,"readwrite");await r.objectStore($e).delete(t),await r.done}function Je({appConfig:e}){return e.appId}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Xe={["missing-app-config-values"]:'Missing App configuration value: "{$valueName}"',["only-available-in-window"]:"This method is available in a Window context.",["only-available-in-sw"]:"This method is available in a service worker context.",["permission-default"]:"The notification permission was not granted and dismissed instead.",["permission-blocked"]:"The notification permission was not granted and blocked instead.",["unsupported-browser"]:"This browser doesn't support the API's required to use the Firebase SDK.",["indexed-db-unsupported"]:"This browser doesn't support indexedDb.open() (ex. Safari iFrame, Firefox Private Browsing, etc)",["failed-service-worker-registration"]:"We are unable to register the default service worker. {$browserErrorMessage}",["token-subscribe-failed"]:"A problem occurred while subscribing the user to FCM: {$errorInfo}",["token-subscribe-no-token"]:"FCM returned no token when subscribing the user to push.",["token-unsubscribe-failed"]:"A problem occurred while unsubscribing the user from FCM: {$errorInfo}",["token-update-failed"]:"A problem occurred while updating the user from FCM: {$errorInfo}",["token-update-no-token"]:"FCM returned no token when updating the user to push.",["use-sw-after-get-token"]:"The useServiceWorker() method may only be called once and must be called before calling getToken() to ensure your service worker is used.",["invalid-sw-registration"]:"The input to useServiceWorker() must be a ServiceWorkerRegistration.",["invalid-bg-handler"]:"The input to setBackgroundMessageHandler() must be a function.",["invalid-vapid-key"]:"The public VAPID key must be a string.",["use-vapid-key-after-get-token"]:"The usePublicVapidKey() method may only be called once and must be called before calling getToken() to ensure your VAPID key is used."},Qe=new o.LL("messaging","Messaging",Xe);
/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
async function Ze(e,t){const n=await rt(e),r=it(t),i={method:"POST",headers:n,body:JSON.stringify(r)};let o;try{const t=await fetch(nt(e.appConfig),i);o=await t.json()}catch(s){throw Qe.create("token-subscribe-failed",{errorInfo:null===s||void 0===s?void 0:s.toString()})}if(o.error){const e=o.error.message;throw Qe.create("token-subscribe-failed",{errorInfo:e})}if(!o.token)throw Qe.create("token-subscribe-no-token");return o.token}async function et(e,t){const n=await rt(e),r=it(t.subscriptionOptions),i={method:"PATCH",headers:n,body:JSON.stringify(r)};let o;try{const n=await fetch(`${nt(e.appConfig)}/${t.token}`,i);o=await n.json()}catch(s){throw Qe.create("token-update-failed",{errorInfo:null===s||void 0===s?void 0:s.toString()})}if(o.error){const e=o.error.message;throw Qe.create("token-update-failed",{errorInfo:e})}if(!o.token)throw Qe.create("token-update-no-token");return o.token}async function tt(e,t){const n=await rt(e),r={method:"DELETE",headers:n};try{const n=await fetch(`${nt(e.appConfig)}/${t}`,r),i=await n.json();if(i.error){const e=i.error.message;throw Qe.create("token-unsubscribe-failed",{errorInfo:e})}}catch(i){throw Qe.create("token-unsubscribe-failed",{errorInfo:null===i||void 0===i?void 0:i.toString()})}}function nt({projectId:e}){return`${Pe}/projects/${e}/registrations`}async function rt({appConfig:e,installations:t}){const n=await t.getToken();return new Headers({"Content-Type":"application/json",Accept:"application/json","x-goog-api-key":e.apiKey,"x-goog-firebase-installations-auth":`FIS ${n}`})}function it({p256dh:e,auth:t,endpoint:n,vapidKey:r}){const i={web:{endpoint:n,auth:t,p256dh:e}};return r!==Se&&(i.web.applicationPubKey=r),i}
/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const ot=6048e5;async function st(e){const t=await lt(e.swRegistration,e.vapidKey),n={vapidKey:e.vapidKey,swScope:e.swRegistration.scope,endpoint:t.endpoint,auth:Me(t.getKey("auth")),p256dh:Me(t.getKey("p256dh"))},r=await ze(e.firebaseDependencies);if(r){if(ht(r.subscriptionOptions,n))return Date.now()>=r.createTime+ot?ct(e,{token:r.token,createTime:Date.now(),subscriptionOptions:n}):r.token;try{await tt(e.firebaseDependencies,r.token)}catch(i){console.warn(i)}return ut(e.firebaseDependencies,n)}return ut(e.firebaseDependencies,n)}async function at(e){const t=await ze(e.firebaseDependencies);t&&(await tt(e.firebaseDependencies,t.token),await Ye(e.firebaseDependencies));const n=await e.swRegistration.pushManager.getSubscription();return!n||n.unsubscribe()}async function ct(e,t){try{const n=await et(e.firebaseDependencies,t),r=Object.assign(Object.assign({},t),{token:n,createTime:Date.now()});return await Ge(e.firebaseDependencies,r),n}catch(n){throw await at(e),n}}async function ut(e,t){const n=await Ze(e,t),r={token:n,createTime:Date.now(),subscriptionOptions:t};return await Ge(e,r),r.token}async function lt(e,t){const n=await e.pushManager.getSubscription();return n||e.pushManager.subscribe({userVisibleOnly:!0,applicationServerKey:Le(t)})}function ht(e,t){const n=t.vapidKey===e.vapidKey,r=t.endpoint===e.endpoint,i=t.auth===e.auth,o=t.p256dh===e.p256dh;return n&&r&&i&&o}
/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function dt(e){const t={from:e.from,collapseKey:e.collapse_key,messageId:e.fcmMessageId};return ft(t,e),pt(t,e),gt(t,e),t}function ft(e,t){if(!t.notification)return;e.notification={};const n=t.notification.title;n&&(e.notification.title=n);const r=t.notification.body;r&&(e.notification.body=r);const i=t.notification.image;i&&(e.notification.image=i);const o=t.notification.icon;o&&(e.notification.icon=o)}function pt(e,t){t.data&&(e.data=t.data)}function gt(e,t){var n,r,i,o,s;if(!t.fcmOptions&&!(null===(n=t.notification)||void 0===n?void 0:n.click_action))return;e.fcmOptions={};const a=null!==(i=null===(r=t.fcmOptions)||void 0===r?void 0:r.link)&&void 0!==i?i:null===(o=t.notification)||void 0===o?void 0:o.click_action;a&&(e.fcmOptions.link=a);const c=null===(s=t.fcmOptions)||void 0===s?void 0:s.analytics_label;c&&(e.fcmOptions.analyticsLabel=c)}
/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function mt(e){return"object"===typeof e&&!!e&&Ne in e}
/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function _t(e,t){const n=[];for(let r=0;r<e.length;r++)n.push(e.charAt(r)),r<t.length&&n.push(t.charAt(r));return n.join("")}
/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function vt(e){if(!e||!e.options)throw yt("App Configuration Object");if(!e.name)throw yt("App Name");const t=["projectId","apiKey","appId","messagingSenderId"],{options:n}=e;for(const r of t)if(!n[r])throw yt(r);return{appName:e.name,projectId:n.projectId,apiKey:n.apiKey,appId:n.appId,senderId:n.messagingSenderId}}function yt(e){return Qe.create("missing-app-config-values",{valueName:e})}
/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */_t("hts/frbslgigp.ogepscmv/ieo/eaylg","tp:/ieaeogn-agolai.o/1frlglgc/o"),_t("AzSCbw63g1R0nCw85jG8","Iaya3yLKwmgvh7cF0q4");class wt{constructor(e,t,n){this.deliveryMetricsExportedToBigQueryEnabled=!1,this.onBackgroundMessageHandler=null,this.onMessageHandler=null,this.logEvents=[],this.isLogServiceStarted=!1;const r=vt(e);this.firebaseDependencies={app:e,appConfig:r,installations:t,analyticsProvider:n}}_delete(){return Promise.resolve()}}
/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function bt(e){try{e.swRegistration=await navigator.serviceWorker.register(Ie,{scope:Te}),e.swRegistration.update().catch((()=>{}))}catch(t){throw Qe.create("failed-service-worker-registration",{browserErrorMessage:null===t||void 0===t?void 0:t.message})}}
/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function Ct(e,t){if(t||e.swRegistration||await bt(e),t||!e.swRegistration){if(!(t instanceof ServiceWorkerRegistration))throw Qe.create("invalid-sw-registration");e.swRegistration=t}}
/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function kt(e,t){t?e.vapidKey=t:e.vapidKey||(e.vapidKey=Se)}
/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function Et(e,t){if(!navigator)throw Qe.create("only-available-in-window");if("default"===Notification.permission&&await Notification.requestPermission(),"granted"!==Notification.permission)throw Qe.create("permission-blocked");return await kt(e,null===t||void 0===t?void 0:t.vapidKey),await Ct(e,null===t||void 0===t?void 0:t.serviceWorkerRegistration),st(e)}
/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function It(e,t,n){const r=Tt(t),i=await e.firebaseDependencies.analyticsProvider.get();i.logEvent(r,{message_id:n[Ne],message_name:n[xe],message_time:n[Re],message_device_time:Math.floor(Date.now()/1e3)})}function Tt(e){switch(e){case Oe.NOTIFICATION_CLICKED:return"notification_open";case Oe.PUSH_RECEIVED:return"notification_foreground";default:throw new Error}}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function St(e,t){const n=t.data;if(!n.isFirebaseMessaging)return;e.onMessageHandler&&n.messageType===Oe.PUSH_RECEIVED&&("function"===typeof e.onMessageHandler?e.onMessageHandler(dt(n)):e.onMessageHandler.next(dt(n)));const r=n.data;mt(r)&&"1"===r[Ae]&&await It(e,n.messageType,r)}const Pt="@firebase/messaging",Nt="0.12.1",xt=e=>{const t=new wt(e.getProvider("app").getImmediate(),e.getProvider("installations-internal").getImmediate(),e.getProvider("analytics-internal"));return navigator.serviceWorker.addEventListener("message",(e=>St(t,e))),t},Rt=e=>{const t=e.getProvider("messaging").getImmediate(),n={getToken:e=>Et(t,e)};return n};function At(){(0,r.Xd)(new i.wA("messaging",xt,"PUBLIC")),(0,r.Xd)(new i.wA("messaging-internal",Rt,"PRIVATE")),(0,r.KN)(Pt,Nt),(0,r.KN)(Pt,Nt,"esm2017")}
/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function Dt(){try{await(0,o.eu)()}catch(e){return!1}return"undefined"!==typeof window&&(0,o.hl)()&&(0,o.zI)()&&"serviceWorker"in navigator&&"PushManager"in window&&"Notification"in window&&"fetch"in window&&ServiceWorkerRegistration.prototype.hasOwnProperty("showNotification")&&PushSubscription.prototype.hasOwnProperty("getKey")}
/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
function Ot(e,t){if(!navigator)throw Qe.create("only-available-in-window");return e.onMessageHandler=t,()=>{e.onMessageHandler=null}}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Mt(e=(0,r.Mq)()){return Dt().then((e=>{if(!e)throw Qe.create("unsupported-browser")}),(e=>{throw Qe.create("indexed-db-unsupported")})),(0,r.qX)((0,o.m9)(e),"messaging").getImmediate()}async function Lt(e,t){return e=(0,o.m9)(e),Et(e,t)}function Ft(e,t){return e=(0,o.m9)(e),Ot(e,t)}At()},531:function(e,t,n){"use strict";n.d(t,{Lj:function(){return C},X3:function(){return b}});const r=(e,t)=>t.some((t=>e instanceof t));let i,o;function s(){return i||(i=[IDBDatabase,IDBObjectStore,IDBIndex,IDBCursor,IDBTransaction])}function a(){return o||(o=[IDBCursor.prototype.advance,IDBCursor.prototype.continue,IDBCursor.prototype.continuePrimaryKey])}const c=new WeakMap,u=new WeakMap,l=new WeakMap,h=new WeakMap,d=new WeakMap;function f(e){const t=new Promise(((t,n)=>{const r=()=>{e.removeEventListener("success",i),e.removeEventListener("error",o)},i=()=>{t(y(e.result)),r()},o=()=>{n(e.error),r()};e.addEventListener("success",i),e.addEventListener("error",o)}));return t.then((t=>{t instanceof IDBCursor&&c.set(t,e)})).catch((()=>{})),d.set(t,e),t}function p(e){if(u.has(e))return;const t=new Promise(((t,n)=>{const r=()=>{e.removeEventListener("complete",i),e.removeEventListener("error",o),e.removeEventListener("abort",o)},i=()=>{t(),r()},o=()=>{n(e.error||new DOMException("AbortError","AbortError")),r()};e.addEventListener("complete",i),e.addEventListener("error",o),e.addEventListener("abort",o)}));u.set(e,t)}let g={get(e,t,n){if(e instanceof IDBTransaction){if("done"===t)return u.get(e);if("objectStoreNames"===t)return e.objectStoreNames||l.get(e);if("store"===t)return n.objectStoreNames[1]?void 0:n.objectStore(n.objectStoreNames[0])}return y(e[t])},set(e,t,n){return e[t]=n,!0},has(e,t){return e instanceof IDBTransaction&&("done"===t||"store"===t)||t in e}};function m(e){g=e(g)}function _(e){return e!==IDBDatabase.prototype.transaction||"objectStoreNames"in IDBTransaction.prototype?a().includes(e)?function(...t){return e.apply(w(this),t),y(c.get(this))}:function(...t){return y(e.apply(w(this),t))}:function(t,...n){const r=e.call(w(this),t,...n);return l.set(r,t.sort?t.sort():[t]),y(r)}}function v(e){return"function"===typeof e?_(e):(e instanceof IDBTransaction&&p(e),r(e,s())?new Proxy(e,g):e)}function y(e){if(e instanceof IDBRequest)return f(e);if(h.has(e))return h.get(e);const t=v(e);return t!==e&&(h.set(e,t),d.set(t,e)),t}const w=e=>d.get(e);function b(e,t,{blocked:n,upgrade:r,blocking:i,terminated:o}={}){const s=indexedDB.open(e,t),a=y(s);return r&&s.addEventListener("upgradeneeded",(e=>{r(y(s.result),e.oldVersion,e.newVersion,y(s.transaction))})),n&&s.addEventListener("blocked",(()=>n())),a.then((e=>{o&&e.addEventListener("close",(()=>o())),i&&e.addEventListener("versionchange",(()=>i()))})).catch((()=>{})),a}function C(e,{blocked:t}={}){const n=indexedDB.deleteDatabase(e);return t&&n.addEventListener("blocked",(()=>t())),y(n).then((()=>{}))}const k=["get","getKey","getAll","getAllKeys","count"],E=["put","add","delete","clear"],I=new Map;function T(e,t){if(!(e instanceof IDBDatabase)||t in e||"string"!==typeof t)return;if(I.get(t))return I.get(t);const n=t.replace(/FromIndex$/,""),r=t!==n,i=E.includes(n);if(!(n in(r?IDBIndex:IDBObjectStore).prototype)||!i&&!k.includes(n))return;const o=async function(e,...t){const o=this.transaction(e,i?"readwrite":"readonly");let s=o.store;return r&&(s=s.index(t.shift())),(await Promise.all([s[n](...t),i&&o.done]))[0]};return I.set(t,o),o}m((e=>({...e,get:(t,n,r)=>T(t,n)||e.get(t,n,r),has:(t,n)=>!!T(t,n)||e.has(t,n)})))},201:function(e,t,n){"use strict";n.d(t,{p7:function(){return nt},r5:function(){return j}});var r=n(252),i=n(262);
/*!
  * vue-router v4.1.6
  * (c) 2022 Eduardo San Martin Morote
  * @license MIT
  */
const o="undefined"!==typeof window;function s(e){return e.__esModule||"Module"===e[Symbol.toStringTag]}const a=Object.assign;function c(e,t){const n={};for(const r in t){const i=t[r];n[r]=l(i)?i.map(e):e(i)}return n}const u=()=>{},l=Array.isArray;const h=/\/$/,d=e=>e.replace(h,"");function f(e,t,n="/"){let r,i={},o="",s="";const a=t.indexOf("#");let c=t.indexOf("?");return a<c&&a>=0&&(c=-1),c>-1&&(r=t.slice(0,c),o=t.slice(c+1,a>-1?a:t.length),i=e(o)),a>-1&&(r=r||t.slice(0,a),s=t.slice(a,t.length)),r=b(null!=r?r:t,n),{fullPath:r+(o&&"?")+o+s,path:r,query:i,hash:s}}function p(e,t){const n=t.query?e(t.query):"";return t.path+(n&&"?")+n+(t.hash||"")}function g(e,t){return t&&e.toLowerCase().startsWith(t.toLowerCase())?e.slice(t.length)||"/":e}function m(e,t,n){const r=t.matched.length-1,i=n.matched.length-1;return r>-1&&r===i&&_(t.matched[r],n.matched[i])&&v(t.params,n.params)&&e(t.query)===e(n.query)&&t.hash===n.hash}function _(e,t){return(e.aliasOf||e)===(t.aliasOf||t)}function v(e,t){if(Object.keys(e).length!==Object.keys(t).length)return!1;for(const n in e)if(!y(e[n],t[n]))return!1;return!0}function y(e,t){return l(e)?w(e,t):l(t)?w(t,e):e===t}function w(e,t){return l(t)?e.length===t.length&&e.every(((e,n)=>e===t[n])):1===e.length&&e[0]===t}function b(e,t){if(e.startsWith("/"))return e;if(!e)return t;const n=t.split("/"),r=e.split("/");let i,o,s=n.length-1;for(i=0;i<r.length;i++)if(o=r[i],"."!==o){if(".."!==o)break;s>1&&s--}return n.slice(0,s).join("/")+"/"+r.slice(i-(i===r.length?1:0)).join("/")}var C,k;(function(e){e["pop"]="pop",e["push"]="push"})(C||(C={})),function(e){e["back"]="back",e["forward"]="forward",e["unknown"]=""}(k||(k={}));function E(e){if(!e)if(o){const t=document.querySelector("base");e=t&&t.getAttribute("href")||"/",e=e.replace(/^\w+:\/\/[^\/]+/,"")}else e="/";return"/"!==e[0]&&"#"!==e[0]&&(e="/"+e),d(e)}const I=/^[^#]+#/;function T(e,t){return e.replace(I,"#")+t}function S(e,t){const n=document.documentElement.getBoundingClientRect(),r=e.getBoundingClientRect();return{behavior:t.behavior,left:r.left-n.left-(t.left||0),top:r.top-n.top-(t.top||0)}}const P=()=>({left:window.pageXOffset,top:window.pageYOffset});function N(e){let t;if("el"in e){const n=e.el,r="string"===typeof n&&n.startsWith("#");0;const i="string"===typeof n?r?document.getElementById(n.slice(1)):document.querySelector(n):n;if(!i)return;t=S(i,e)}else t=e;"scrollBehavior"in document.documentElement.style?window.scrollTo(t):window.scrollTo(null!=t.left?t.left:window.pageXOffset,null!=t.top?t.top:window.pageYOffset)}function x(e,t){const n=history.state?history.state.position-t:-1;return n+e}const R=new Map;function A(e,t){R.set(e,t)}function D(e){const t=R.get(e);return R.delete(e),t}let O=()=>location.protocol+"//"+location.host;function M(e,t){const{pathname:n,search:r,hash:i}=t,o=e.indexOf("#");if(o>-1){let t=i.includes(e.slice(o))?e.slice(o).length:1,n=i.slice(t);return"/"!==n[0]&&(n="/"+n),g(n,"")}const s=g(n,e);return s+r+i}function L(e,t,n,r){let i=[],o=[],s=null;const c=({state:o})=>{const a=M(e,location),c=n.value,u=t.value;let l=0;if(o){if(n.value=a,t.value=o,s&&s===c)return void(s=null);l=u?o.position-u.position:0}else r(a);i.forEach((e=>{e(n.value,c,{delta:l,type:C.pop,direction:l?l>0?k.forward:k.back:k.unknown})}))};function u(){s=n.value}function l(e){i.push(e);const t=()=>{const t=i.indexOf(e);t>-1&&i.splice(t,1)};return o.push(t),t}function h(){const{history:e}=window;e.state&&e.replaceState(a({},e.state,{scroll:P()}),"")}function d(){for(const e of o)e();o=[],window.removeEventListener("popstate",c),window.removeEventListener("beforeunload",h)}return window.addEventListener("popstate",c),window.addEventListener("beforeunload",h),{pauseListeners:u,listen:l,destroy:d}}function F(e,t,n,r=!1,i=!1){return{back:e,current:t,forward:n,replaced:r,position:window.history.length,scroll:i?P():null}}function q(e){const{history:t,location:n}=window,r={value:M(e,n)},i={value:t.state};function o(r,o,s){const a=e.indexOf("#"),c=a>-1?(n.host&&document.querySelector("base")?e:e.slice(a))+r:O()+e+r;try{t[s?"replaceState":"pushState"](o,"",c),i.value=o}catch(u){console.error(u),n[s?"replace":"assign"](c)}}function s(e,n){const s=a({},t.state,F(i.value.back,e,i.value.forward,!0),n,{position:i.value.position});o(e,s,!0),r.value=e}function c(e,n){const s=a({},i.value,t.state,{forward:e,scroll:P()});o(s.current,s,!0);const c=a({},F(r.value,e,null),{position:s.position+1},n);o(e,c,!1),r.value=e}return i.value||o(r.value,{back:null,current:r.value,forward:null,position:t.length-1,replaced:!0,scroll:null},!0),{location:r,state:i,push:c,replace:s}}function B(e){e=E(e);const t=q(e),n=L(e,t.state,t.location,t.replace);function r(e,t=!0){t||n.pauseListeners(),history.go(e)}const i=a({location:"",base:e,go:r,createHref:T.bind(null,e)},t,n);return Object.defineProperty(i,"location",{enumerable:!0,get:()=>t.location.value}),Object.defineProperty(i,"state",{enumerable:!0,get:()=>t.state.value}),i}function j(e){return e=location.host?e||location.pathname+location.search:"",e.includes("#")||(e+="#"),B(e)}function U(e){return"string"===typeof e||e&&"object"===typeof e}function H(e){return"string"===typeof e||"symbol"===typeof e}const W={path:"/",name:void 0,params:{},query:{},hash:"",fullPath:"/",matched:[],meta:{},redirectedFrom:void 0},$=Symbol("");var V;(function(e){e[e["aborted"]=4]="aborted",e[e["cancelled"]=8]="cancelled",e[e["duplicated"]=16]="duplicated"})(V||(V={}));function K(e,t){return a(new Error,{type:e,[$]:!0},t)}function z(e,t){return e instanceof Error&&$ in e&&(null==t||!!(e.type&t))}const G="[^/]+?",Y={sensitive:!1,strict:!1,start:!0,end:!0},J=/[.+*?^${}()[\]/\\]/g;function X(e,t){const n=a({},Y,t),r=[];let i=n.start?"^":"";const o=[];for(const a of e){const e=a.length?[]:[90];n.strict&&!a.length&&(i+="/");for(let t=0;t<a.length;t++){const r=a[t];let s=40+(n.sensitive?.25:0);if(0===r.type)t||(i+="/"),i+=r.value.replace(J,"\\$&"),s+=40;else if(1===r.type){const{value:e,repeatable:n,optional:c,regexp:u}=r;o.push({name:e,repeatable:n,optional:c});const l=u||G;if(l!==G){s+=10;try{new RegExp(`(${l})`)}catch(h){throw new Error(`Invalid custom RegExp for param "${e}" (${l}): `+h.message)}}let d=n?`((?:${l})(?:/(?:${l}))*)`:`(${l})`;t||(d=c&&a.length<2?`(?:/${d})`:"/"+d),c&&(d+="?"),i+=d,s+=20,c&&(s+=-8),n&&(s+=-20),".*"===l&&(s+=-50)}e.push(s)}r.push(e)}if(n.strict&&n.end){const e=r.length-1;r[e][r[e].length-1]+=.7000000000000001}n.strict||(i+="/?"),n.end?i+="$":n.strict&&(i+="(?:/|$)");const s=new RegExp(i,n.sensitive?"":"i");function c(e){const t=e.match(s),n={};if(!t)return null;for(let r=1;r<t.length;r++){const e=t[r]||"",i=o[r-1];n[i.name]=e&&i.repeatable?e.split("/"):e}return n}function u(t){let n="",r=!1;for(const i of e){r&&n.endsWith("/")||(n+="/"),r=!1;for(const e of i)if(0===e.type)n+=e.value;else if(1===e.type){const{value:o,repeatable:s,optional:a}=e,c=o in t?t[o]:"";if(l(c)&&!s)throw new Error(`Provided param "${o}" is an array but it is not repeatable (* or + modifiers)`);const u=l(c)?c.join("/"):c;if(!u){if(!a)throw new Error(`Missing required param "${o}"`);i.length<2&&(n.endsWith("/")?n=n.slice(0,-1):r=!0)}n+=u}}return n||"/"}return{re:s,score:r,keys:o,parse:c,stringify:u}}function Q(e,t){let n=0;while(n<e.length&&n<t.length){const r=t[n]-e[n];if(r)return r;n++}return e.length<t.length?1===e.length&&80===e[0]?-1:1:e.length>t.length?1===t.length&&80===t[0]?1:-1:0}function Z(e,t){let n=0;const r=e.score,i=t.score;while(n<r.length&&n<i.length){const e=Q(r[n],i[n]);if(e)return e;n++}if(1===Math.abs(i.length-r.length)){if(ee(r))return 1;if(ee(i))return-1}return i.length-r.length}function ee(e){const t=e[e.length-1];return e.length>0&&t[t.length-1]<0}const te={type:0,value:""},ne=/[a-zA-Z0-9_]/;function re(e){if(!e)return[[]];if("/"===e)return[[te]];if(!e.startsWith("/"))throw new Error(`Invalid path "${e}"`);function t(e){throw new Error(`ERR (${n})/"${u}": ${e}`)}let n=0,r=n;const i=[];let o;function s(){o&&i.push(o),o=[]}let a,c=0,u="",l="";function h(){u&&(0===n?o.push({type:0,value:u}):1===n||2===n||3===n?(o.length>1&&("*"===a||"+"===a)&&t(`A repeatable param (${u}) must be alone in its segment. eg: '/:ids+.`),o.push({type:1,value:u,regexp:l,repeatable:"*"===a||"+"===a,optional:"*"===a||"?"===a})):t("Invalid state to consume buffer"),u="")}function d(){u+=a}while(c<e.length)if(a=e[c++],"\\"!==a||2===n)switch(n){case 0:"/"===a?(u&&h(),s()):":"===a?(h(),n=1):d();break;case 4:d(),n=r;break;case 1:"("===a?n=2:ne.test(a)?d():(h(),n=0,"*"!==a&&"?"!==a&&"+"!==a&&c--);break;case 2:")"===a?"\\"==l[l.length-1]?l=l.slice(0,-1)+a:n=3:l+=a;break;case 3:h(),n=0,"*"!==a&&"?"!==a&&"+"!==a&&c--,l="";break;default:t("Unknown state");break}else r=n,n=4;return 2===n&&t(`Unfinished custom RegExp for param "${u}"`),h(),s(),i}function ie(e,t,n){const r=X(re(e.path),n);const i=a(r,{record:e,parent:t,children:[],alias:[]});return t&&!i.record.aliasOf===!t.record.aliasOf&&t.children.push(i),i}function oe(e,t){const n=[],r=new Map;function i(e){return r.get(e)}function o(e,n,r){const i=!r,c=ae(e);c.aliasOf=r&&r.record;const h=he(t,e),d=[c];if("alias"in e){const t="string"===typeof e.alias?[e.alias]:e.alias;for(const e of t)d.push(a({},c,{components:r?r.record.components:c.components,path:e,aliasOf:r?r.record:c}))}let f,p;for(const t of d){const{path:a}=t;if(n&&"/"!==a[0]){const e=n.record.path,r="/"===e[e.length-1]?"":"/";t.path=n.record.path+(a&&r+a)}if(f=ie(t,n,h),r?r.alias.push(f):(p=p||f,p!==f&&p.alias.push(f),i&&e.name&&!ue(f)&&s(e.name)),c.children){const e=c.children;for(let t=0;t<e.length;t++)o(e[t],f,r&&r.children[t])}r=r||f,(f.record.components&&Object.keys(f.record.components).length||f.record.name||f.record.redirect)&&l(f)}return p?()=>{s(p)}:u}function s(e){if(H(e)){const t=r.get(e);t&&(r.delete(e),n.splice(n.indexOf(t),1),t.children.forEach(s),t.alias.forEach(s))}else{const t=n.indexOf(e);t>-1&&(n.splice(t,1),e.record.name&&r.delete(e.record.name),e.children.forEach(s),e.alias.forEach(s))}}function c(){return n}function l(e){let t=0;while(t<n.length&&Z(e,n[t])>=0&&(e.record.path!==n[t].record.path||!de(e,n[t])))t++;n.splice(t,0,e),e.record.name&&!ue(e)&&r.set(e.record.name,e)}function h(e,t){let i,o,s,c={};if("name"in e&&e.name){if(i=r.get(e.name),!i)throw K(1,{location:e});0,s=i.record.name,c=a(se(t.params,i.keys.filter((e=>!e.optional)).map((e=>e.name))),e.params&&se(e.params,i.keys.map((e=>e.name)))),o=i.stringify(c)}else if("path"in e)o=e.path,i=n.find((e=>e.re.test(o))),i&&(c=i.parse(o),s=i.record.name);else{if(i=t.name?r.get(t.name):n.find((e=>e.re.test(t.path))),!i)throw K(1,{location:e,currentLocation:t});s=i.record.name,c=a({},t.params,e.params),o=i.stringify(c)}const u=[];let l=i;while(l)u.unshift(l.record),l=l.parent;return{name:s,path:o,params:c,matched:u,meta:le(u)}}return t=he({strict:!1,end:!0,sensitive:!1},t),e.forEach((e=>o(e))),{addRoute:o,resolve:h,removeRoute:s,getRoutes:c,getRecordMatcher:i}}function se(e,t){const n={};for(const r of t)r in e&&(n[r]=e[r]);return n}function ae(e){return{path:e.path,redirect:e.redirect,name:e.name,meta:e.meta||{},aliasOf:void 0,beforeEnter:e.beforeEnter,props:ce(e),children:e.children||[],instances:{},leaveGuards:new Set,updateGuards:new Set,enterCallbacks:{},components:"components"in e?e.components||null:e.component&&{default:e.component}}}function ce(e){const t={},n=e.props||!1;if("component"in e)t.default=n;else for(const r in e.components)t[r]="boolean"===typeof n?n:n[r];return t}function ue(e){while(e){if(e.record.aliasOf)return!0;e=e.parent}return!1}function le(e){return e.reduce(((e,t)=>a(e,t.meta)),{})}function he(e,t){const n={};for(const r in e)n[r]=r in t?t[r]:e[r];return n}function de(e,t){return t.children.some((t=>t===e||de(e,t)))}const fe=/#/g,pe=/&/g,ge=/\//g,me=/=/g,_e=/\?/g,ve=/\+/g,ye=/%5B/g,we=/%5D/g,be=/%5E/g,Ce=/%60/g,ke=/%7B/g,Ee=/%7C/g,Ie=/%7D/g,Te=/%20/g;function Se(e){return encodeURI(""+e).replace(Ee,"|").replace(ye,"[").replace(we,"]")}function Pe(e){return Se(e).replace(ke,"{").replace(Ie,"}").replace(be,"^")}function Ne(e){return Se(e).replace(ve,"%2B").replace(Te,"+").replace(fe,"%23").replace(pe,"%26").replace(Ce,"`").replace(ke,"{").replace(Ie,"}").replace(be,"^")}function xe(e){return Ne(e).replace(me,"%3D")}function Re(e){return Se(e).replace(fe,"%23").replace(_e,"%3F")}function Ae(e){return null==e?"":Re(e).replace(ge,"%2F")}function De(e){try{return decodeURIComponent(""+e)}catch(t){}return""+e}function Oe(e){const t={};if(""===e||"?"===e)return t;const n="?"===e[0],r=(n?e.slice(1):e).split("&");for(let i=0;i<r.length;++i){const e=r[i].replace(ve," "),n=e.indexOf("="),o=De(n<0?e:e.slice(0,n)),s=n<0?null:De(e.slice(n+1));if(o in t){let e=t[o];l(e)||(e=t[o]=[e]),e.push(s)}else t[o]=s}return t}function Me(e){let t="";for(let n in e){const r=e[n];if(n=xe(n),null==r){void 0!==r&&(t+=(t.length?"&":"")+n);continue}const i=l(r)?r.map((e=>e&&Ne(e))):[r&&Ne(r)];i.forEach((e=>{void 0!==e&&(t+=(t.length?"&":"")+n,null!=e&&(t+="="+e))}))}return t}function Le(e){const t={};for(const n in e){const r=e[n];void 0!==r&&(t[n]=l(r)?r.map((e=>null==e?null:""+e)):null==r?r:""+r)}return t}const Fe=Symbol(""),qe=Symbol(""),Be=Symbol(""),je=Symbol(""),Ue=Symbol("");function He(){let e=[];function t(t){return e.push(t),()=>{const n=e.indexOf(t);n>-1&&e.splice(n,1)}}function n(){e=[]}return{add:t,list:()=>e,reset:n}}function We(e,t,n,r,i){const o=r&&(r.enterCallbacks[i]=r.enterCallbacks[i]||[]);return()=>new Promise(((s,a)=>{const c=e=>{!1===e?a(K(4,{from:n,to:t})):e instanceof Error?a(e):U(e)?a(K(2,{from:t,to:e})):(o&&r.enterCallbacks[i]===o&&"function"===typeof e&&o.push(e),s())},u=e.call(r&&r.instances[i],t,n,c);let l=Promise.resolve(u);e.length<3&&(l=l.then(c)),l.catch((e=>a(e)))}))}function $e(e,t,n,r){const i=[];for(const o of e){0;for(const e in o.components){let a=o.components[e];if("beforeRouteEnter"===t||o.instances[e])if(Ve(a)){const s=a.__vccOpts||a,c=s[t];c&&i.push(We(c,n,r,o,e))}else{let c=a();0,i.push((()=>c.then((i=>{if(!i)return Promise.reject(new Error(`Couldn't resolve component "${e}" at "${o.path}"`));const a=s(i)?i.default:i;o.components[e]=a;const c=a.__vccOpts||a,u=c[t];return u&&We(u,n,r,o,e)()}))))}}}return i}function Ve(e){return"object"===typeof e||"displayName"in e||"props"in e||"__vccOpts"in e}function Ke(e){const t=(0,r.f3)(Be),n=(0,r.f3)(je),o=(0,i.Fl)((()=>t.resolve((0,i.SU)(e.to)))),s=(0,i.Fl)((()=>{const{matched:e}=o.value,{length:t}=e,r=e[t-1],i=n.matched;if(!r||!i.length)return-1;const s=i.findIndex(_.bind(null,r));if(s>-1)return s;const a=Xe(e[t-2]);return t>1&&Xe(r)===a&&i[i.length-1].path!==a?i.findIndex(_.bind(null,e[t-2])):s})),a=(0,i.Fl)((()=>s.value>-1&&Je(n.params,o.value.params))),c=(0,i.Fl)((()=>s.value>-1&&s.value===n.matched.length-1&&v(n.params,o.value.params)));function l(n={}){return Ye(n)?t[(0,i.SU)(e.replace)?"replace":"push"]((0,i.SU)(e.to)).catch(u):Promise.resolve()}return{route:o,href:(0,i.Fl)((()=>o.value.href)),isActive:a,isExactActive:c,navigate:l}}const ze=(0,r.aZ)({name:"RouterLink",compatConfig:{MODE:3},props:{to:{type:[String,Object],required:!0},replace:Boolean,activeClass:String,exactActiveClass:String,custom:Boolean,ariaCurrentValue:{type:String,default:"page"}},useLink:Ke,setup(e,{slots:t}){const n=(0,i.qj)(Ke(e)),{options:o}=(0,r.f3)(Be),s=(0,i.Fl)((()=>({[Qe(e.activeClass,o.linkActiveClass,"router-link-active")]:n.isActive,[Qe(e.exactActiveClass,o.linkExactActiveClass,"router-link-exact-active")]:n.isExactActive})));return()=>{const i=t.default&&t.default(n);return e.custom?i:(0,r.h)("a",{"aria-current":n.isExactActive?e.ariaCurrentValue:null,href:n.href,onClick:n.navigate,class:s.value},i)}}}),Ge=ze;function Ye(e){if(!(e.metaKey||e.altKey||e.ctrlKey||e.shiftKey)&&!e.defaultPrevented&&(void 0===e.button||0===e.button)){if(e.currentTarget&&e.currentTarget.getAttribute){const t=e.currentTarget.getAttribute("target");if(/\b_blank\b/i.test(t))return}return e.preventDefault&&e.preventDefault(),!0}}function Je(e,t){for(const n in t){const r=t[n],i=e[n];if("string"===typeof r){if(r!==i)return!1}else if(!l(i)||i.length!==r.length||r.some(((e,t)=>e!==i[t])))return!1}return!0}function Xe(e){return e?e.aliasOf?e.aliasOf.path:e.path:""}const Qe=(e,t,n)=>null!=e?e:null!=t?t:n,Ze=(0,r.aZ)({name:"RouterView",inheritAttrs:!1,props:{name:{type:String,default:"default"},route:Object},compatConfig:{MODE:3},setup(e,{attrs:t,slots:n}){const o=(0,r.f3)(Ue),s=(0,i.Fl)((()=>e.route||o.value)),c=(0,r.f3)(qe,0),u=(0,i.Fl)((()=>{let e=(0,i.SU)(c);const{matched:t}=s.value;let n;while((n=t[e])&&!n.components)e++;return e})),l=(0,i.Fl)((()=>s.value.matched[u.value]));(0,r.JJ)(qe,(0,i.Fl)((()=>u.value+1))),(0,r.JJ)(Fe,l),(0,r.JJ)(Ue,s);const h=(0,i.iH)();return(0,r.YP)((()=>[h.value,l.value,e.name]),(([e,t,n],[r,i,o])=>{t&&(t.instances[n]=e,i&&i!==t&&e&&e===r&&(t.leaveGuards.size||(t.leaveGuards=i.leaveGuards),t.updateGuards.size||(t.updateGuards=i.updateGuards))),!e||!t||i&&_(t,i)&&r||(t.enterCallbacks[n]||[]).forEach((t=>t(e)))}),{flush:"post"}),()=>{const i=s.value,o=e.name,c=l.value,u=c&&c.components[o];if(!u)return et(n.default,{Component:u,route:i});const d=c.props[o],f=d?!0===d?i.params:"function"===typeof d?d(i):d:null,p=e=>{e.component.isUnmounted&&(c.instances[o]=null)},g=(0,r.h)(u,a({},f,t,{onVnodeUnmounted:p,ref:h}));return et(n.default,{Component:g,route:i})||g}}});function et(e,t){if(!e)return null;const n=e(t);return 1===n.length?n[0]:n}const tt=Ze;function nt(e){const t=oe(e.routes,e),n=e.parseQuery||Oe,s=e.stringifyQuery||Me,h=e.history;const d=He(),g=He(),_=He(),v=(0,i.XI)(W);let y=W;o&&e.scrollBehavior&&"scrollRestoration"in history&&(history.scrollRestoration="manual");const w=c.bind(null,(e=>""+e)),b=c.bind(null,Ae),k=c.bind(null,De);function E(e,n){let r,i;return H(e)?(r=t.getRecordMatcher(e),i=n):i=e,t.addRoute(i,r)}function I(e){const n=t.getRecordMatcher(e);n&&t.removeRoute(n)}function T(){return t.getRoutes().map((e=>e.record))}function S(e){return!!t.getRecordMatcher(e)}function R(e,r){if(r=a({},r||v.value),"string"===typeof e){const i=f(n,e,r.path),o=t.resolve({path:i.path},r),s=h.createHref(i.fullPath);return a(i,o,{params:k(o.params),hash:De(i.hash),redirectedFrom:void 0,href:s})}let i;if("path"in e)i=a({},e,{path:f(n,e.path,r.path).path});else{const t=a({},e.params);for(const e in t)null==t[e]&&delete t[e];i=a({},e,{params:b(e.params)}),r.params=b(r.params)}const o=t.resolve(i,r),c=e.hash||"";o.params=w(k(o.params));const u=p(s,a({},e,{hash:Pe(c),path:o.path})),l=h.createHref(u);return a({fullPath:u,hash:c,query:s===Me?Le(e.query):e.query||{}},o,{redirectedFrom:void 0,href:l})}function O(e){return"string"===typeof e?f(n,e,v.value.path):a({},e)}function M(e,t){if(y!==e)return K(8,{from:t,to:e})}function L(e){return B(e)}function F(e){return L(a(O(e),{replace:!0}))}function q(e){const t=e.matched[e.matched.length-1];if(t&&t.redirect){const{redirect:n}=t;let r="function"===typeof n?n(e):n;return"string"===typeof r&&(r=r.includes("?")||r.includes("#")?r=O(r):{path:r},r.params={}),a({query:e.query,hash:e.hash,params:"path"in r?{}:e.params},r)}}function B(e,t){const n=y=R(e),r=v.value,i=e.state,o=e.force,c=!0===e.replace,u=q(n);if(u)return B(a(O(u),{state:"object"===typeof u?a({},i,u.state):i,force:o,replace:c}),t||n);const l=n;let h;return l.redirectedFrom=t,!o&&m(s,r,n)&&(h=K(16,{to:l,from:r}),ne(r,r,!0,!1)),(h?Promise.resolve(h):U(l,r)).catch((e=>z(e)?z(e,2)?e:te(e):Z(e,l,r))).then((e=>{if(e){if(z(e,2))return B(a({replace:c},O(e.to),{state:"object"===typeof e.to?a({},i,e.to.state):i,force:o}),t||l)}else e=V(l,r,!0,c,i);return $(l,r,e),e}))}function j(e,t){const n=M(e,t);return n?Promise.reject(n):Promise.resolve()}function U(e,t){let n;const[r,i,o]=it(e,t);n=$e(r.reverse(),"beforeRouteLeave",e,t);for(const a of r)a.leaveGuards.forEach((r=>{n.push(We(r,e,t))}));const s=j.bind(null,e,t);return n.push(s),rt(n).then((()=>{n=[];for(const r of d.list())n.push(We(r,e,t));return n.push(s),rt(n)})).then((()=>{n=$e(i,"beforeRouteUpdate",e,t);for(const r of i)r.updateGuards.forEach((r=>{n.push(We(r,e,t))}));return n.push(s),rt(n)})).then((()=>{n=[];for(const r of e.matched)if(r.beforeEnter&&!t.matched.includes(r))if(l(r.beforeEnter))for(const i of r.beforeEnter)n.push(We(i,e,t));else n.push(We(r.beforeEnter,e,t));return n.push(s),rt(n)})).then((()=>(e.matched.forEach((e=>e.enterCallbacks={})),n=$e(o,"beforeRouteEnter",e,t),n.push(s),rt(n)))).then((()=>{n=[];for(const r of g.list())n.push(We(r,e,t));return n.push(s),rt(n)})).catch((e=>z(e,8)?e:Promise.reject(e)))}function $(e,t,n){for(const r of _.list())r(e,t,n)}function V(e,t,n,r,i){const s=M(e,t);if(s)return s;const c=t===W,u=o?history.state:{};n&&(r||c?h.replace(e.fullPath,a({scroll:c&&u&&u.scroll},i)):h.push(e.fullPath,i)),v.value=e,ne(e,t,n,c),te()}let G;function Y(){G||(G=h.listen(((e,t,n)=>{if(!ae.listening)return;const r=R(e),i=q(r);if(i)return void B(a(i,{replace:!0}),r).catch(u);y=r;const s=v.value;o&&A(x(s.fullPath,n.delta),P()),U(r,s).catch((e=>z(e,12)?e:z(e,2)?(B(e.to,r).then((e=>{z(e,20)&&!n.delta&&n.type===C.pop&&h.go(-1,!1)})).catch(u),Promise.reject()):(n.delta&&h.go(-n.delta,!1),Z(e,r,s)))).then((e=>{e=e||V(r,s,!1),e&&(n.delta&&!z(e,8)?h.go(-n.delta,!1):n.type===C.pop&&z(e,20)&&h.go(-1,!1)),$(r,s,e)})).catch(u)})))}let J,X=He(),Q=He();function Z(e,t,n){te(e);const r=Q.list();return r.length?r.forEach((r=>r(e,t,n))):console.error(e),Promise.reject(e)}function ee(){return J&&v.value!==W?Promise.resolve():new Promise(((e,t)=>{X.add([e,t])}))}function te(e){return J||(J=!e,Y(),X.list().forEach((([t,n])=>e?n(e):t())),X.reset()),e}function ne(t,n,i,s){const{scrollBehavior:a}=e;if(!o||!a)return Promise.resolve();const c=!i&&D(x(t.fullPath,0))||(s||!i)&&history.state&&history.state.scroll||null;return(0,r.Y3)().then((()=>a(t,n,c))).then((e=>e&&N(e))).catch((e=>Z(e,t,n)))}const re=e=>h.go(e);let ie;const se=new Set,ae={currentRoute:v,listening:!0,addRoute:E,removeRoute:I,hasRoute:S,getRoutes:T,resolve:R,options:e,push:L,replace:F,go:re,back:()=>re(-1),forward:()=>re(1),beforeEach:d.add,beforeResolve:g.add,afterEach:_.add,onError:Q.add,isReady:ee,install(e){const t=this;e.component("RouterLink",Ge),e.component("RouterView",tt),e.config.globalProperties.$router=t,Object.defineProperty(e.config.globalProperties,"$route",{enumerable:!0,get:()=>(0,i.SU)(v)}),o&&!ie&&v.value===W&&(ie=!0,L(h.location).catch((e=>{0})));const n={};for(const o in W)n[o]=(0,i.Fl)((()=>v.value[o]));e.provide(Be,t),e.provide(je,(0,i.qj)(n)),e.provide(Ue,v);const r=e.unmount;se.add(e),e.unmount=function(){se.delete(e),se.size<1&&(y=W,G&&G(),G=null,v.value=W,ie=!1,J=!1),r()}}};return ae}function rt(e){return e.reduce(((e,t)=>e.then((()=>t()))),Promise.resolve())}function it(e,t){const n=[],r=[],i=[],o=Math.max(t.matched.length,e.matched.length);for(let s=0;s<o;s++){const o=t.matched[s];o&&(e.matched.find((e=>_(e,o)))?r.push(o):n.push(o));const a=e.matched[s];a&&(t.matched.find((e=>_(e,a)))||i.push(a))}return[n,r,i]}}}]);
//# sourceMappingURL=chunk-vendors.fb486b3e.js.map