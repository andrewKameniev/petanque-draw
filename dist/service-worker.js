if(!self.define){let e,i={};const s=(s,n)=>(s=new URL(s+".js",n).href,i[s]||new Promise((i=>{if("document"in self){const e=document.createElement("script");e.src=s,e.onload=i,document.head.appendChild(e)}else e=s,importScripts(s),i()})).then((()=>{let e=i[s];if(!e)throw new Error(`Module ${s} didn’t register its module`);return e})));self.define=(n,r)=>{const t=e||("document"in self?document.currentScript.src:"")||location.href;if(i[t])return;let a={};const l=e=>s(e,t),d={module:{uri:t},exports:a,require:l};i[t]=Promise.all(n.map((e=>d[e]||l(e)))).then((e=>(r(...e),a)))}}define(["./workbox-db5fc017"],(function(e){"use strict";e.setCacheNameDetails({prefix:"petanque-draw"}),self.addEventListener("message",(e=>{e.data&&"SKIP_WAITING"===e.data.type&&self.skipWaiting()})),e.precacheAndRoute([{url:"/petanque-draw/dist/css/app.2ce45d56.css",revision:null},{url:"/petanque-draw/dist/firebase-messaging-sw.js",revision:"82928d6e915e15c10e2908031a574c54"},{url:"/petanque-draw/dist/img/bg.ec634baf.jpg",revision:null},{url:"/petanque-draw/dist/img/girl.5c1e06cd.jpg",revision:null},{url:"/petanque-draw/dist/img/login-desktop.70f80e89.jpg",revision:null},{url:"/petanque-draw/dist/img/login-mobile.03a9c97e.jpg",revision:null},{url:"/petanque-draw/dist/img/logo.6a11ce3e.webp",revision:null},{url:"/petanque-draw/dist/img/logo.74972a48.png",revision:null},{url:"/petanque-draw/dist/index.html",revision:"3814663883595a1a173c1e117dddaa58"},{url:"/petanque-draw/dist/js/app.1ef88ea3.js",revision:null},{url:"/petanque-draw/dist/js/chunk-vendors.879837d1.js",revision:null},{url:"/petanque-draw/dist/manifest.json",revision:"aa7682708a7f641ef8a7eb9eb0aed300"},{url:"/petanque-draw/dist/robots.txt",revision:"735ab4f94fbcd57074377afca324c813"}],{})}));
//# sourceMappingURL=service-worker.js.map
