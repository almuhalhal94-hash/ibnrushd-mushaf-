/* مصحف ابن رشد — يعمل بدون إنترنت بعد أول فتح */
var V='mushaf-v19';
var SHELL=['./','index.html','style.css','app.js','data/mushaf.json','manifest.webmanifest',
  'fonts/UthmanicHafs.woff2','fonts/ArefRuqaa-Bold.woff2','fonts/Tajawal-Regular.woff2','fonts/Tajawal-Bold.woff2','fonts/Tajawal-ExtraBold.woff2',
  'icons/icon-192.png','icons/icon-512.png','icons/apple-touch-icon.png'];
self.addEventListener('install',function(e){e.waitUntil(caches.open(V).then(function(c){return c.addAll(SHELL.map(function(u){return new Request(u,{cache:'reload'})}))}).then(function(){return self.skipWaiting()}))});
self.addEventListener('activate',function(e){e.waitUntil(caches.keys().then(function(ks){// نفس النطاق فيه موقع القسم وتطبيقاته: نحذف ذاكرة المصحف القديمة فقط
    return Promise.all(ks.filter(function(k){return k.indexOf('mushaf-v')===0&&k!==V}).map(function(k){return caches.delete(k)}))}).then(function(){return self.clients.claim()}))});
self.addEventListener('fetch',function(e){
  var r=e.request,u=new URL(r.url);
  if(r.method!=='GET'||u.origin!==location.origin)return;
  // قائمة التسجيلات: من الشبكة أولًا عشان التسجيلات الجديدة تظهر مباشرة
  if(u.pathname.endsWith('/audio/audio.json')){e.respondWith(fetch(r).then(function(res){var cp=res.clone();caches.open(V).then(function(c){c.put(r,cp)});return res}).catch(function(){return caches.match(r)}));return}
  // التسجيلات: تُحفظ بعد أول تشغيل
  if(u.pathname.indexOf('/audio/')>=0&&u.pathname.endsWith('.mp3')){e.respondWith(caches.open('mushaf-audio').then(function(c){return c.match(r.url).then(function(hit){return hit||fetch(r.url).then(function(res){if(res.ok)c.put(r.url,res.clone());return res})})}));return}
  // الصفحة والبيانات: من الذاكرة فورًا، وتتحدّث في الخلفية
  e.respondWith(caches.match(r,{ignoreSearch:true}).then(function(hit){
    var net=fetch(r).then(function(res){if(res.ok){var cp=res.clone();caches.open(V).then(function(c){c.put(r,cp)})}return res}).catch(function(){return hit||caches.match('index.html')});
    return hit||net}));
});
