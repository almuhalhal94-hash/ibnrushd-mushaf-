// محاكاة التسميع بالمايك: تلاوة العفاسي (نص whisper small بتوقيت الكلمات) تمرّ على كود المطابقة نفسه في app.js
// node tools/vr_sim.js app.js tools/afasy_whisper_small.jsonl desk|and   (INJ=sub|skip أخطاء متعمّدة، V=1 تفاصيل، ONLY=7/t1 درس واحد، DBG=1)
const fs=require('fs');
const [,,APP,TR,MODE]=process.argv; // MODE: desk | and
const src=fs.readFileSync(APP,'utf8');
const cut=(a,b)=>{const i=src.indexOf(a),j=src.indexOf(b,i);return src.slice(i,j)};
const D=JSON.parse(fs.readFileSync(require('path').dirname(APP)+'/data/mushaf.json','utf8'));
const TRS={};fs.readFileSync(TR,'utf8').trim().split('\n').forEach(l=>{const o=JSON.parse(l);TRS[o.k]=o.w});
let VR,LOG,CX=0;
const navigator={};
function vrFirst(k){for(var i=0;i<VR.E.length;i++)if(VR.E[i].k===k)return i;return 0}
function vrSet(p,back){if(VR.errJ!=null&&p!==VR.errJ)VR.errJ=null;VR.pos=back?p:Math.max(VR.pos,p);if(VR.seg){VR.seg.base=VR.pos;VR.seg.off=VR.seg.len}if(VR.pos>=VR.E.length)vrDone()}
function vrPaint(){} function vrBad(){} function vrStatus(t){} function vrDone(){VR.fin=1}
eval(cut('var FILL=','function vrOpen')+cut('function vrRun','function vrDone'));
const ACC=process.env.ACC==='1'; // الطالب يعيد/يعتمد الكلمة بعد الخطأ
function run(lesson){
  const ks=[];for(let a=lesson.from;a<=lesson.to;a++)ks.push(lesson.sura+':'+a);
  const E=[];ks.forEach(k=>D.ayat[k].w.forEach((w,i)=>{const t=w.map(p=>p[0]).join('');E.push({k,i,t,n:(typeof vrKey!=='undefined'?vrKey(t,k,i):skel(t)),el:{textContent:t,classList:{remove(){},add(){}}}})}));
  VR={E,pos:0,on:true,errs:0,hints:0,bad:{},seg:null,rs:[],errJ:null,tries:0,miss:[],fresh:1};
  // خط زمني للكلمات
  let T0=0;const W=[];
  ks.forEach(k=>{const [s,a]=k.split(':').map(Number);const id=String(s).padStart(3,'0')+String(a).padStart(3,'0');
    const w=TRS[id]||[];w.forEach(x=>W.push({t:x[0],s:T0+x[1],e:T0+x[2],k}));T0+=(w.length?w[w.length-1][2]:3)+0.8});
  // أخطاء متعمّدة: INJ=sub (كلمة غلط) أو INJ=skip (نط آية كاملة)
  const POOL=['السماوات','الكتاب','يومئذ','المؤمنين','فاصبر','الحمد','رسولا','الصلاة','جهنم','الشمس','قريش','الفيل'];
  const inj=[];
  if(process.env.INJ==='sub'){for(let x=7;x<W.length-4;x+=17){const vk=W[x].k,vw=E.filter(e=>e.k===vk).map(e=>e.n);
      const p=POOL.find(q=>!vw.some(n=>sim(skel(q),n)||lax(skel(q),n)));if(!p)continue;W[x]={...W[x],t:p,orig:W[x].t,inj:1};inj.push(x)}}
  if(process.env.INJ==='skip'){const vs=[...new Set(W.map(w=>w.k))];for(let v=2;v<vs.length-1;v+=4){if(W.filter(w=>w.k===vs[v]).length<3)continue;
      const f=W.findIndex(w=>w.k===vs[v]);W.forEach(w=>{if(w.k===vs[v])w.drop=1});inj.push(f)}}
  const det=[];
  // أحداث المتصفح
  const errs=[];let seg,timer=null,now=0;
  function newSeg(){VR.seg=seg={base:VR.pos,off:0,len:0,F:[]};seg.cur=[];seg.final=[]}
  function emit(force){const F=seg.F.join(' ').split(/\s+/).map(skel).filter(Boolean),I=seg.cur.join(' ').split(/\s+/).map(skel).filter(Boolean);
    VR.txt=seg.F.concat(seg.cur).join(' ');const m0=VR.miss.length;vrHear(F,I,force);
    if(VR.miss.length>m0){const m=VR.miss[VR.miss.length-1];errs.push({x:CX,at:m[0],heard:m[1].split(' ').slice(-5).join(' ')});if(process.env.DBG)console.log('STOP x',CX,VR.pos,m[0],'| exp:',VR.E.slice(VR.pos,VR.pos+4).map(e=>e.n).join(' '),'| F:',F.join(' '),'| I:',I.join(' '),'| off',seg.off,'force',force);
      }
    return [F,I]}
  newSeg();let last=null,off=0,lastS=0,lastE=0,stopAt=-1,rew=0;
  const GAP=0.55, GAPA=1.0, RESTART=MODE==='and'?0.45:0; // أندرويد: الجلسة تنقطع عند السكتة وتبدأ من جديد وتضيع بداية الكلام
  let deadUntil=-1;
  const vstart={};W.forEach((w,ix)=>{if(vstart[w.k]==null)vstart[w.k]=ix});
  for(let x=0;x<W.length;x++){const w=W[x];CX=x;const ws=w.s+off,we=w.e+off;
    if(last&&timer!=null&&ws>timer){emit(true);timer=null}
    if(last&&ws-lastE>GAP){if(seg.cur.length){seg.F.push(seg.cur.join(' '));seg.cur=[];emit(false)}}
    if(MODE==='and'&&last&&ws-lastE>GAPA){emit(true);newSeg();deadUntil=lastE+GAPA+RESTART}
    if(inj.includes(x)&&!w.done){det.push([x,errs.length]);w.done=1}
    if(w.drop&&!w.undrop){continue}
    if(ws<deadUntil){last=w;lastE=we;continue}
    seg.cur.push(w.t);emit(false);timer=we+1.4;last=w;lastE=we;
    // الطالب وقف عند الخطأ: يرجع يقرأ من الكلمة المعلّمة (صح هالمرة)
    if(VR.errJ!=null&&errs.length>stopAt&&rew<60){stopAt=errs.length;rew++;
      const e=VR.E[VR.errJ],v0=vstart[e.k];if(v0==null){continue}
      let nx=v0+Math.min(e.i,W.filter(q=>q.k===e.k).length-1);
      for(let z=nx;z<W.length&&z<=x+1;z++){if(W[z].orig)W[z].t=W[z].orig;if(W[z].drop)W[z].undrop=1}
      // للآية المتروكة: نرجّعها
      off=we+1.2-W[nx].s;x=nx-1;seg.cur.length&&(seg.F.push(seg.cur.join(' ')),seg.cur=[]);emit(true);newSeg();deadUntil=-1;timer=null;last=null;continue}
    if(VR.fin)break}
  if(!VR.fin){seg.F.push(seg.cur.join(' '));seg.cur=[];emit(true)}
  // مسك الخطأ: وقفة خلال ٥ كلمات بعد مكانه (أو نهاية الدرس)
  const caught=det.filter(([x,e0])=>{return errs.some((er,ii)=>ii>=e0&&er.x!=null&&er.x<=x+30)}).length;
  return {n:E.length,pos:VR.pos,errs,fin:!!VR.fin,inj:det.length,caught}}
let tot=0,te=0,fin=0,out=[],TI=0,TC=0;
for(const g in D.grades)for(const L of D.grades[g].lessons){if(!L.from)continue;if(process.env.ONLY&&process.env.ONLY!==g+'/'+L.id)continue;const r=run(L);tot++;TI+=r.inj;TC+=r.caught;te+=r.errs.length;fin+=r.fin;
  out.push(`${g}/${L.id} ${L.title}: ${r.errs.length} وقفات${r.fin?'':' (ما كمّل '+r.pos+'/'+r.n+')'}`+r.errs.slice(0,4).map(e=>`\n    «${e.at}» ← سمع: ${e.heard}`).join(''))}
if(process.env.V)console.log(out.join('\n'));
console.log((process.env.INJ?`INJ=${process.env.INJ} مسك ${TC}/${TI} · `:'')+`MODE=${MODE} دروس=${tot} وقفات_خاطئة=${te} دروس_بلا_وقفة=${out.filter(o=>/: 0 /.test(o)).length} اكتملت=${fin}`);
