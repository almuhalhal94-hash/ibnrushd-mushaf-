/* مصحف ابن رشد — قسم التربية الإسلامية، مدرسة ابن رشد الإعدادية للبنين
   إعداد: أ. طلال سعود المهلهل · © 2026 جميع الحقوق محفوظة */
(function(){
'use strict';
var D=null,AUDIO={},APP=document.getElementById('app'),ROOT=document.documentElement;
var SITE='https://almuhalhal94-hash.github.io/ibnrushd-mushaf-/';

/* ---------- تخزين آمن ---------- */
function load(k,d){try{var v=localStorage.getItem('mr_'+k);return v?JSON.parse(v):d}catch(e){return d}}
function save(k,v){try{localStorage.setItem('mr_'+k,JSON.stringify(v))}catch(e){}}
var P=load('prefs',{}),DONE=load('done',{}),FAV=load('fav',[]),LAST=load('last',null);
function setPref(k,v){P[k]=v;save('prefs',P)}

/* ---------- أدوات ---------- */
function $(s,r){return (r||document).querySelector(s)}
function $$(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))}
function esc(s){return String(s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function ar(n){return String(n).replace(/\d/g,function(d){return '٠١٢٣٤٥٦٧٨٩'[d]})}
var tt;function toast(m){var t=$('#toast');t.textContent=m;t.classList.add('on');clearTimeout(tt);tt=setTimeout(function(){t.classList.remove('on')},2400)}
function star(){return '<svg viewBox="0 0 48 48" aria-hidden="true"><use href="#star8"/></svg>'}
function sname(s){return D.suras[s].name}

/* ---------- أحكام التجويد ---------- */
var GROUPS=['المدود','النون الساكنة والتنوين والميم','القلقلة','حروف تُكتب ولا تُنطق'];
var RULES={
 madda_necessary:['مدّ لازم','--t-necessary',0,'حرف مدّ بعده سكون أصلي أو حرف مشدّد في نفس الكلمة. نمدّه <b>6 حركات</b> دائمًا، يعني تقريبًا قدر ما تثني ستّة أصابع بهدوء.'],
 madda_obligatory:['مدّ واجب متّصل','--t-obligatory',0,'حرف مدّ بعده همزة <b>في نفس الكلمة</b>. نمدّه <b>4 أو 5 حركات</b> وجوبًا، ولا يجوز قصره.'],
 madda_permissible:['مدّ جائز','--t-permissible',0,'حرف مدّ بعده همزة في <b>الكلمة التالية</b> (مدّ منفصل)، أو سكون عارض عند الوقف على آخر الكلمة. يجوز مدّه <b>2 أو 4 أو 6 حركات</b>، والمهم أن تلتزم بمقدار واحد في التلاوة كلها.'],
 madda_normal:['مدّ طبيعي','--t-normal',0,'حرف مدّ (ا، و، ي) أو ألف صغيرة أو واو وياء صغيرتان، وليس بعده همزة ولا سكون. نمدّه <b>حركتين</b> فقط، بلا زيادة ولا نقصان.'],
 ghunnah:['غُنّة','--t-ghunnah',1,'النون أو الميم <b>المشدّدة</b>. نُخرج صوتًا جميلًا من الأنف بمقدار <b>حركتين</b>.'],
 ikhafa:['إخفاء','--t-ikhfa',1,'نون ساكنة أو تنوين بعدها حرف من حروف الإخفاء الخمسة عشر. ننطق النون بين الإظهار والإدغام مع <b>غنّة حركتين</b>.'],
 ikhafa_shafawi:['إخفاء شفوي','--t-ikhfa-sh',1,'ميم ساكنة بعدها <b>باء</b>. نخفي الميم عند الباء مع غنّة، والشفتان تنطبقان بلطف.'],
 iqlab:['إقلاب','--t-iqlab',1,'نون ساكنة أو تنوين بعدها <b>باء</b>. نقلب النون <b>ميمًا</b> مخفاة مع غنّة.'],
 idgham_ghunnah:['إدغام بغنّة','--t-idg-gh',1,'نون ساكنة أو تنوين بعدها حرف من حروف <b>«ينمو»</b> (ي، ن، م، و). ندخل النون في الحرف التالي مع <b>غنّة</b>.'],
 idgham_wo_ghunnah:['إدغام بلا غنّة','--t-idg-wo',1,'نون ساكنة أو تنوين بعدها <b>لام أو راء</b>. ندخل النون في الحرف التالي <b>بلا غنّة</b>، فلا تُنطق النون.'],
 idgham_shafawi:['إدغام شفوي','--t-idg-sh',1,'ميم ساكنة بعدها <b>ميم</b>. ندغم الميمين في ميم واحدة مشدّدة مع غنّة.'],
 idgham_mutajanisayn:['إدغام متجانسين','--t-idg-mj',1,'حرفان <b>مخرجهما واحد</b> وصفاتهما مختلفة، الأول ساكن. ندغم الأول في الثاني فلا يظهر الأول.'],
 idgham_mutaqaribayn:['إدغام متقاربين','--t-idg-mq',1,'حرفان <b>متقاربان</b> في المخرج والصفة، الأول ساكن. ندغم الأول في الثاني.'],
 qalaqah:['قلقلة','--t-qalqala',2,'أحد حروف <b>«قُطْبُ جَدٍ»</b> (ق، ط، ب، ج، د) إذا كان ساكنًا. ننطقه بنبرة واهتزاز خفيف حتى يُسمع واضحًا.'],
 ham_wasl:['همزة الوصل','--t-silent',3,'همزة تُنطق إذا بدأنا بها، و<b>تسقط</b> في وصل الكلام فلا تُنطق.'],
 laam_shamsiyah:['اللام الشمسية','--t-silent',3,'لام «ال» تُكتب و<b>لا تُنطق</b>، ويُشدَّد الحرف الذي بعدها.'],
 slnt:['حرف لا يُنطق','--t-silent',3,'حرف مكتوب في رسم المصحف، لكنه <b>لا يُنطق</b> في الوصل.']
};
var RORDER=Object.keys(RULES);

/* ---------- البيانات ---------- */
function lessonOf(g,id){var G=D.grades[g];if(!G)return null;for(var i=0;i<G.lessons.length;i++)if(G.lessons[i].id===id)return G.lessons[i];return null}
function keys(L){var o=[];for(var a=L.from;a<=L.to;a++)o.push(L.sura+':'+a);return o}
function doneCount(L){return keys(L).filter(function(k){return DONE[k]}).length}
function total(L){return L.to-L.from+1}
function wordHTML(w,only){return w.map(function(p){var c=p[1]&&(!only||p[1]===only)?p[1]:'';return c?'<span class="'+c+'">'+p[0]+'</span>':p[0]}).join('')}
function plain(k){return D.ayat[k].w.map(function(w){return w.map(function(p){return p[0]}).join('')}).join(' ')}
function audioEntry(g,L){var A=AUDIO[g]||{};var e=A[L.id]||(L.ref&&A[L.ref]);if(!e)return null;var id=A[L.id]?L.id:L.ref;return {reader:e.reader,id:id,ayat:e.ayat}}
function audioURL(g,e,k){var p=k.split(':');return 'audio/'+g+'/'+e.id+'/'+p[0]+'_'+p[1]+'.mp3'}
function hasAudio(e,k){if(!e)return false;if(!e.ayat)return true;return e.ayat.indexOf(+k.split(':')[1])>=0}

/* ---------- الإعدادات العامة ---------- */
function applyPrefs(){
  ROOT.dataset.skin=P.skin||'brand';
  if(P.dark!=null)ROOT.dataset.dark=P.dark?'1':'0';else delete ROOT.dataset.dark;
  ROOT.style.setProperty('--qs',(P.qs||30)+'px');
  var dark=P.dark!=null?P.dark:matchMedia('(prefers-color-scheme: dark)').matches;
  $('meta[name=theme-color]').content=dark?(P.skin==='paper'?'#2a1f12':'#073d2b'):(P.skin==='paper'?'#f5ead0':'#0a6e4b');
}
$('#btnSkin').onclick=function(){setPref('skin',P.skin==='paper'?'brand':'paper');applyPrefs();toast(P.skin==='paper'?'تصميم ورق المصحف الكلاسيكي':'تصميم هوية القسم')};
$('#btnDark').onclick=function(){var cur=P.dark!=null?P.dark:matchMedia('(prefers-color-scheme: dark)').matches;setPref('dark',!cur);applyPrefs()};

/* ---------- النافذة السفلية ---------- */
var SH=$('#sheet'),lastFocus=null;
function openSheet(html,after){lastFocus=document.activeElement;$('.body',SH).innerHTML=html;SH.hidden=false;document.body.style.overflow='hidden';$('.panel',SH).scrollTop=0;if(after)after($('.body',SH));setTimeout(function(){$('.x',SH).focus()},50)}
function closeSheet(){if(SH.hidden)return;SH.hidden=true;document.body.style.overflow='';$$('.w.sel').forEach(function(e){e.classList.remove('sel')});if(lastFocus&&lastFocus.focus)lastFocus.focus()}
SH.addEventListener('click',function(e){if(e.target.closest('[data-close]'))closeSheet()});
document.addEventListener('keydown',function(e){if(e.key==='Escape')closeSheet()});

/* ---------- الرئيسية ---------- */
function curriculumKeys(){var out=[],seen={};['6','7','8','9'].forEach(function(g){D.grades[g].lessons.forEach(function(L){if(L.kind!=='t')return;keys(L).forEach(function(k){if(!seen[k]){seen[k]=1;out.push([k,g,L.id])}})})});return out}
function ayahOfDay(){var all=curriculumKeys();var d=new Date();var n=Math.floor(Date.UTC(d.getFullYear(),d.getMonth(),d.getDate())/864e5);return all[(n*7919)%all.length]}
function gradeSuras(g){var s=[];D.grades[g].lessons.forEach(function(L){if(L.kind==='t'&&s.indexOf(L.sura)<0)s.push(L.sura)});return s}
function gradeProg(g){var d=0,t=0,seen={};D.grades[g].lessons.forEach(function(L){keys(L).forEach(function(k){if(seen[k])return;seen[k]=1;t++;if(DONE[k])d++})});return [d,t]}

function home(){
  var A=ayahOfDay(),k=A[0],s=k.split(':');
  var h='<section class="view">';
  h+='<div class="hero"><div class="medal">'+star()+'<span>📖</span></div><h1>مصحف ابن رشد</h1><p>آيات منهج التلاوة والحفظ · الفصل الدراسي الأول</p><p class="sch">قسم التربية الإسلامية · مدرسة ابن رشد الإعدادية للبنين</p></div>';
  h+='<div class="card aotd"><span class="lbl">✦ آية اليوم</span><div class="q tj">'+D.ayat[k].w.map(function(w){return wordHTML(w)}).join(' ')+' '+ar(s[1])+'</div><div class="src">'+esc(sname(s[0]))+' · الآية '+ar(s[1])+' · '+esc(D.grades[A[1]].name)+'</div><div class="row"><a class="btn pri sm" href="#/g/'+A[1]+'/'+A[2]+'?a='+k+'">افتح في الدرس</a><button class="btn sm" data-share="'+k+'">🖼️ شاركها صورة</button></div></div>';
  if(LAST&&lessonOf(LAST.g,LAST.l)){var L=lessonOf(LAST.g,LAST.l),ls=LAST.k.split(':');
    h+='<a class="card cont" href="#/g/'+LAST.g+'/'+LAST.l+'?a='+LAST.k+'"><span class="ico">🔖</span><span><b>تابع من حيث توقفت</b><small>'+esc(L.title)+' · الآية '+ar(ls[1])+' · '+esc(D.grades[LAST.g].name)+'</small></span><span class="go">‹</span></a>'}
  h+='<h2 class="h2"><i>✦</i> اختر صفّك <i>✦</i></h2><div class="grades">';
  ['6','7','8','9'].forEach(function(g){var pr=gradeProg(g);
    h+='<a class="card gcard" href="#/g/'+g+'"><span class="st">'+star()+'</span><span class="n">'+esc(D.grades[g].name)+'</span><small>'+gradeSuras(g).map(function(x){return esc(sname(x))}).join(' · ')+'</small><div class="meter" title="المحفوظ"><i style="width:'+(pr[0]/pr[1]*100)+'%"></i></div><small>حفظت '+ar(pr[0])+' من '+ar(pr[1])+' آية</small></a>'});
  h+='</div><div class="quick"><a class="card" href="#/fav"><span>⭐</span>آياتي المفضّلة ('+ar(FAV.length)+')</a><a class="card" href="#/about"><span>📲</span>ثبّت المصحف على جوالك</a></div></section>';
  APP.innerHTML=h;
}

/* ---------- صفحة الصف ---------- */
function grade(g,tab){
  var G=D.grades[g];if(!G)return go('#/');
  tab=tab||P['tab'+g]||'t';
  var h='<section class="view"><div class="crumb"><a href="#/">الرئيسية</a> ‹ <span>'+esc(G.name)+'</span></div><h1 class="ttl">'+esc(G.name)+'</h1>';
  h+='<div class="seg" role="tablist"><button role="tab" data-tab="t" class="'+(tab==='t'?'on':'')+'" aria-selected="'+(tab==='t')+'">📖 دروس التلاوة</button><button role="tab" data-tab="h" class="'+(tab==='h'?'on':'')+'" aria-selected="'+(tab==='h')+'">🧠 آيات الحفظ</button></div>';
  if(tab==='h')h+='<p class="crumb">الآيات المطلوب حفظها هذا الفصل'+(g==='6'?' (من خطة التلاوة).':' (من دروس التربية الإسلامية).')+'</p>';
  h+='<div class="lessons">';
  var n=0;
  G.lessons.forEach(function(L){if(L.kind!==tab)return;n++;var d=doneCount(L),t=total(L),full=d===t;
    h+='<a class="card lcard" href="#/g/'+g+'/'+L.id+'"><span class="num'+(full?' done':'')+'">'+star()+'<b>'+(full?'✓':ar(n))+'</b></span><span class="t"><b>'+esc(L.title)+(L.hifz&&L.kind==='t'?'<span class="tag">حفظ</span>':'')+'</b><small>'+esc(sname(L.sura))+' · الآيات '+ar(L.from)+'–'+ar(L.to)+' · الأسبوع '+ar(L.week)+(L.unit?' · '+esc(L.unit):'')+'</small><div class="meter"><i style="width:'+(d/t*100)+'%"></i></div></span></a>'});
  h+='</div></section>';
  APP.innerHTML=h;
  $$('[data-tab]').forEach(function(b){b.onclick=function(){setPref('tab'+g,b.dataset.tab);grade(g,b.dataset.tab)}});
}

/* ---------- صفحة الدرس ---------- */
var ST={};
function corner(){return '<svg viewBox="0 0 30 30"><path fill="currentColor" d="M15 1l3.5 7.2L26 6l-2.2 7.5L29 15l-5.2 1.5L26 24l-7.5-2.2L15 29l-3.5-7.2L4 24l2.2-7.5L1 15l5.2-1.5L4 6l7.5 2.2z"/><circle cx="15" cy="15" r="4" fill="var(--page)"/></svg>'}
function shead(s){return '<div class="shead"><svg viewBox="0 0 600 64" preserveAspectRatio="none"><g fill="none" stroke="currentColor"><rect x="3" y="6" width="594" height="52" rx="12" stroke-width="2.2"/><rect x="10" y="12" width="580" height="40" rx="8" stroke-width="1" opacity=".7"/><path d="M60 12v40M540 12v40" stroke-width="1"/></g><g fill="currentColor" opacity=".9"><path d="M35 32l9-9 9 9-9 9zM547 32l9-9 9 9-9 9z"/></g><g fill="none" stroke="currentColor" stroke-width="1" opacity=".55"><path d="M60 32h40M500 32h40"/></g></svg><b>'+esc(sname(s))+'</b></div>'}
function lesson(g,id,q){
  var L=lessonOf(g,id);if(!L)return go('#/g/'+g);
  var G=D.grades[g],ks=keys(L),AE=audioEntry(g,L);
  ST={g:g,L:L,ks:ks,ae:AE,memo:false,mode:P.mode||'all',rev:{},cur:ks[0],rep:P.rep||3};
  var h='<section class="view"><div class="crumb"><a href="#/">الرئيسية</a> ‹ <a href="#/g/'+g+'">'+esc(G.name)+'</a> ‹ <span>'+(L.kind==='h'?'آيات الحفظ':'التلاوة')+'</span></div>';
  h+='<h1 class="ttl">'+esc(L.title)+'</h1><p class="crumb">الآيات '+ar(L.from)+'–'+ar(L.to)+' · الأسبوع '+ar(L.week)+'</p>';
  h+='<div class="tbar" role="toolbar" aria-label="أدوات الدرس"><button class="btn sm" data-a="fs-" aria-label="تصغير الخط">ا−</button><button class="btn sm" data-a="fs+" aria-label="تكبير الخط">ا+</button><button class="btn sm '+(P.tj===false?'':'on')+'" data-a="tj">🎨 التجويد</button><button class="btn sm" data-a="leg">🎓 دليل الألوان</button><button class="btn sm" data-a="memo">🧠 التسميع</button>'+(AE?'<button class="btn sm gold" data-a="play">▶ الدرس كامل</button>':'')+'</div>';
  if(AE)h+='<div class="voice"><span class="mic">🎙️</span><span><small>تلاوة الدرس</small><b>بصوت الطالب: '+esc(AE.reader||'')+'</b></span><button class="btn sm pri" data-a="play">▶ استمع</button></div>';
  else h+='<div class="voice soon"><span class="mic">🎙️</span><span><b>التلاوة بصوت طلابنا – قريبًا</b><small>نجهّز تسجيلات طلاب القسم لهذا الدرس بإذن الله</small></span></div>';
  h+='<button class="vrbig" data-a="vr"><span class="vi">🎙️</span><span><b>سمّع الآيات بصوتك</b><small>افتح المايك واقرأ من حفظك، والآيات تظهر كلما قرأت صح</small></span></button>';
  h+='<div id="memo" class="card memo" hidden></div><div id="vr" class="card memo vr" hidden></div>';
  h+='<div class="mushaf"><span class="cn a">'+corner()+'</span><span class="cn b">'+corner()+'</span><span class="cn c">'+corner()+'</span><span class="cn d">'+corner()+'</span><div class="inner">'+shead(L.sura);
  if(L.from===1&&L.sura!==9)h+='<div class="bism tjx">'+D.bismillah.map(function(w){return w.map(function(p){return p[0]}).join('')}).join(' ')+'</div><div class="bism-orn">'+star()+'</div>';
  h+='<div class="legend" id="leg"'+(P.leg===false?' hidden':'')+'></div>';
  h+='<div class="q'+(P.tj===false?'':' tj')+'" id="q">';
  ks.forEach(function(k){var a=k.split(':')[1],A=D.ayat[k];
    h+='<span class="ay'+(DONE[k]?' done':'')+(FAV.indexOf(k)>=0?' fav':'')+(LAST&&LAST.k===k&&LAST.l===id&&LAST.g===g?' mark':'')+'" id="a'+k.replace(':','-')+'" data-k="'+k+'">'+A.w.map(function(w,i){return '<span class="w" data-i="'+i+'">'+wordHTML(w)+'</span>'}).join(' ')+' <span class="n" role="button" tabindex="0" aria-label="الآية '+a+'">'+ar(a)+'</span></span> '});
  h+='</div></div></div>';
  var d=doneCount(L),t=total(L);
  h+='<div class="lprog"><span>المحفوظ</span><div class="meter"><i id="lpm" style="width:'+(d/t*100)+'%"></i></div><b id="lpt">'+ar(d)+'/'+ar(t)+'</b></div>';
  var Ls=G.lessons.filter(function(x){return x.kind===L.kind}),ix=Ls.indexOf(L);
  h+='<div class="nav2">'+(ix>0?'<a class="btn" href="#/g/'+g+'/'+Ls[ix-1].id+'">→ السابق</a>':'<span></span>')+(ix<Ls.length-1?'<a class="btn pri" href="#/g/'+g+'/'+Ls[ix+1].id+'">التالي ←</a>':'<span></span>')+'</div>';
  h+='</section>';
  APP.innerHTML=h;
  buildLegend();
  $$('[data-a]').forEach(function(b){b.onclick=function(){tool(b.dataset.a,b)}});
  var Q=$('#q');
  Q.addEventListener('click',function(e){var w=e.target.closest('.w'),n=e.target.closest('.n'),ay=e.target.closest('.ay');if(!ay)return;
    var k=ay.dataset.k;ST.cur=k;
    if(VR){if(w&&w.classList.contains('err'))vrAccept();else vrJump(k);return}
    if(ST.memo&&!ay.classList.contains('shown')&&w){revealNext(k);return}
    setLast(k,false);
    if(n)return ayahSheet(k);
    if(w){$$('.w.sel').forEach(function(x){x.classList.remove('sel')});w.classList.add('sel');wordSheet(k,+w.dataset.i)}});
  Q.addEventListener('keydown',function(e){if((e.key==='Enter'||e.key===' ')&&e.target.classList.contains('n')){e.preventDefault();ayahSheet(e.target.closest('.ay').dataset.k)}});
  var jump=q&&q.a;
  if(jump&&D.ayat[jump]){setTimeout(function(){var el=document.getElementById('a'+jump.replace(':','-'));if(el){el.scrollIntoView({block:'center'});el.classList.add('flash');setTimeout(function(){el.classList.remove('flash')},2200)}},120)}
  else scrollTo(0,0);
}
function buildLegend(){
  var used={};ST.ks.forEach(function(k){D.ayat[k].w.forEach(function(w){w.forEach(function(p){if(p[1])used[p[1]]=1})})});
  var h='',g=-1;
  RORDER.forEach(function(r){if(!used[r])return;var R=RULES[r];if(R[2]!==g){if(g>=0)h+='<span class="sep"></span>';g=R[2]}
    h+='<button data-rule="'+r+'" style="--c:var('+R[1]+')"><i></i>'+R[0]+'</button>'});
  var el=$('#leg');el.innerHTML=h||'<h4>لا توجد أحكام ملوّنة في هذا الدرس</h4>';
  $$('[data-rule]',el).forEach(function(b){b.onclick=function(){ruleSheet(b.dataset.rule)}});
}
function tool(a,b){
  if(a==='fs+'||a==='fs-'){var v=Math.max(20,Math.min(56,(P.qs||30)+(a==='fs+'?3:-3)));setPref('qs',v);applyPrefs();toast('حجم الخط '+ar(v))}
  else if(a==='tj'){setPref('tj',P.tj===false);$('#q').classList.toggle('tj',P.tj!==false);$$('[data-a=tj]').forEach(function(x){x.classList.toggle('on',P.tj!==false)});toast(P.tj===false?'أُلغي تلوين التجويد':'تلوين التجويد مفعّل')}
  else if(a==='leg'){var l=$('#leg');l.hidden=!l.hidden;setPref('leg',!l.hidden);if(!l.hidden)l.scrollIntoView({block:'nearest',behavior:'smooth'})}
  else if(a==='vr')vrOpen(b);
  else if(a==='memo'){if(VR)vrClose();ST.memo=!ST.memo;b.classList.toggle('on',ST.memo);memoUI()}
  else if(a==='play'){playLesson()}
}
function setLast(k,explicit){LAST={g:ST.g,l:ST.L.id,k:k,t:Date.now()};save('last',LAST);$$('.ay.mark').forEach(function(e){e.classList.remove('mark')});var el=document.getElementById('a'+k.replace(':','-'));if(el)el.classList.add('mark');if(explicit)toast('🔖 حُفظ موضع القراءة')}
function updProg(){var d=doneCount(ST.L),t=total(ST.L);var m=$('#lpm');if(m){m.style.width=(d/t*100)+'%';$('#lpt').textContent=ar(d)+'/'+ar(t)}}
function toggleDone(k){if(DONE[k])delete DONE[k];else DONE[k]=1;save('done',DONE);var el=document.getElementById('a'+k.replace(':','-'));if(el)el.classList.toggle('done',!!DONE[k]);updProg();toast(DONE[k]?'✓ ما شاء الله! سُجّلت الآية محفوظة':'أُلغي تسجيل الحفظ');if(DONE[k]&&ST.L&&doneCount(ST.L)===total(ST.L))setTimeout(function(){toast('🎉 أتممت حفظ الدرس كاملًا، بارك الله فيك')},1600)}
function toggleFav(k){var i=FAV.indexOf(k);if(i>=0)FAV.splice(i,1);else FAV.unshift(k);save('fav',FAV);var el=document.getElementById('a'+k.replace(':','-'));if(el)el.classList.toggle('fav',i<0);toast(i<0?'⭐ أُضيفت إلى المفضّلة':'أُزيلت من المفضّلة')}

/* ---------- نوافذ الكلمة والآية والحكم ---------- */
function meaningsHTML(A){var all=A.m.map(function(m){return [m[2],m[3]]}).concat(A.u);if(!all.length)return '';
  return '<details class="box"><summary class="k">معاني كلمات الآية ('+ar(all.length)+')</summary>'+all.map(function(m){return '<p style="margin:8px 0"><b>'+esc(m[0])+'</b>: '+esc(m[1])+'</p>'}).join('')+'</details>'}
function actsHTML(k){var e=ST.ae,s=k.split(':');
  return '<div class="acts"><button data-x="done" class="'+(DONE[k]?'on':'')+'"><span>✓</span>'+(DONE[k]?'محفوظة':'حفظتها')+'</button><button data-x="fav" class="'+(FAV.indexOf(k)>=0?'on':'')+'"><span>⭐</span>مفضّلة</button><button data-x="mark"><span>🔖</span>علّم موضعي</button><button data-x="share"><span>🖼️</span>صورة</button>'+(hasAudio(e,k)?'<button data-x="play"><span>▶</span>استمع</button>':'')+'<button data-x="rep"><span>🔁</span>كرّرها</button><button data-x="copy"><span>📋</span>نسخ</button></div>'}
function bindActs(b,k){$$('[data-x]',b).forEach(function(x){x.onclick=function(){var a=x.dataset.x;
  if(a==='done'){toggleDone(k);x.classList.toggle('on',!!DONE[k]);x.lastChild.textContent=DONE[k]?'محفوظة':'حفظتها'}
  else if(a==='fav'){toggleFav(k);x.classList.toggle('on',FAV.indexOf(k)>=0)}
  else if(a==='mark'){setLast(k,true)}
  else if(a==='share'){shareAyah(k)}
  else if(a==='play'){closeSheet();playKeys([k],1)}
  else if(a==='rep'){closeSheet();ST.cur=k;startRepeat()}
  else if(a==='copy'){var s=k.split(':');copy('﴿'+plain(k)+'﴾ ['+D.suras[s[0]].name+': '+s[1]+']')}}})}
function copy(t){(navigator.clipboard?navigator.clipboard.writeText(t):Promise.reject()).then(function(){toast('📋 نُسخ')},function(){toast('تعذّر النسخ')})}
var SRC=function(){return '<p class="srcs">المصادر: '+esc(D.sources.meanings)+' · '+esc(D.sources.tafsir)+'</p>'};
function wordSheet(k,i){var A=D.ayat[k],w=A.w[i],s=k.split(':');
  var ms=A.m.filter(function(m){return i>=m[0]&&i<=m[1]});
  var rs={};w.forEach(function(p){if(p[1])rs[p[1]]=1});
  var h='<h3>معنى الكلمة</h3><div class="word tj">'+wordHTML(w)+'</div>';
  if(ms.length)ms.forEach(function(m){h+='<div class="box"><div class="k">المعنى · '+esc(m[2])+'</div><p>'+esc(m[3])+'</p></div>'});
  else h+='<div class="box"><div class="k">المعنى</div><p>كلمة واضحة المعنى، ليس لها شرح خاص في «السراج». اقرأ معنى الآية تحت.</p></div>';
  if(Object.keys(rs).length)h+='<div class="box"><div class="k">أحكام التجويد في الكلمة</div><div class="chips">'+Object.keys(rs).map(function(r){return '<button data-rule="'+r+'" style="--c:var('+RULES[r][1]+')"><i></i>'+RULES[r][0]+'</button>'}).join('')+'</div></div>';
  h+='<div class="box"><div class="k">معنى الآية '+ar(s[1])+' (التفسير الميسر)</div><p>'+esc(A.y)+'</p></div>'+meaningsHTML(A)+actsHTML(k)+SRC();
  openSheet(h,function(b){bindActs(b,k);$$('[data-rule]',b).forEach(function(x){x.onclick=function(){ruleSheet(x.dataset.rule)}})});
}
function ayahSheet(k){var A=D.ayat[k],s=k.split(':');
  var h='<h3>'+esc(sname(s[0]))+' · الآية '+ar(s[1])+'</h3><div class="word tj" style="font-size:calc(var(--qs) * .95);padding:4px 10px">'+A.w.map(function(w){return wordHTML(w)}).join(' ')+' '+ar(s[1])+'</div><div class="box"><div class="k">التفسير الميسر</div><p>'+esc(A.y)+'</p></div>'+meaningsHTML(A)+actsHTML(k)+SRC();
  openSheet(h,function(b){bindActs(b,k)});
}
function ruleSheet(r){var R=RULES[r],ex=null,cnt=0;
  (ST.ks||[]).forEach(function(k){D.ayat[k].w.forEach(function(w,i){w.forEach(function(p){if(p[1]===r){cnt++;if(!ex)ex=[k,i]}})})});
  var h='<div class="rule" style="--c:var('+R[1]+')"><div class="sw"><i></i><h3>'+R[0]+'</h3></div><div class="box"><div class="k">'+GROUPS[R[2]]+'</div><p>'+R[3]+'</p></div>';
  if(ex)h+='<div class="box"><div class="k">مثال من درسك (تكرّر '+ar(cnt)+' مرّة في الدرس)</div><div class="ex tj">'+wordHTML(D.ayat[ex[0]].w[ex[1]],r)+'</div><div class="row"><button class="btn sm pri" data-goex>اذهب إليه في الآية '+ar(ex[0].split(':')[1])+'</button></div></div>';
  h+='<p class="srcs">لاحظ: الحرف الملوّن هو موضع الحكم. اسأل معلمك إذا احتجت توضيحًا أكثر.</p></div>';
  openSheet(h,function(b){var x=$('[data-goex]',b);if(x)x.onclick=function(){closeSheet();var el=document.getElementById('a'+ex[0].replace(':','-'));if(!el)return;var w=$('.w[data-i="'+ex[1]+'"]',el);el.scrollIntoView({block:'center',behavior:'smooth'});if(w){w.classList.add('sel');setTimeout(function(){w.classList.remove('sel')},2500)}}});
}

/* ---------- التسميع والحفظ ---------- */
function memoUI(){var M=$('#memo'),Q=$('#q');
  if(!ST.memo){M.hidden=true;Q.classList.remove('hide');$$('.ay',Q).forEach(function(a){a.classList.remove('shown','cur')});$$('.w.h',Q).forEach(function(w){w.classList.remove('h')});return}
  M.hidden=false;Q.classList.add('hide');ST.rev={};
  M.innerHTML='<div class="r"><span>الإخفاء</span><button class="btn sm" data-m="all">الآيات كاملة</button><button class="btn sm" data-m="first">إظهار أول كلمة</button></div>'+
   '<div class="r"><span>الكشف</span><button class="btn sm" data-r="w">👁️ كلمة</button><button class="btn sm" data-r="a">📖 الآية</button><button class="btn sm" data-r="hide">🙈 أخفِ الكل</button><button class="btn sm" data-r="show">إظهار الكل</button></div>'+
   '<div class="r"><span>التكرار</span>'+[1,3,5,7,10].map(function(n){return '<button class="btn sm" data-n="'+n+'">'+ar(n)+'</button>'}).join('')+'<button class="btn sm gold" data-r="rep">🔁 كرّر الآية</button></div>'+
   '<p class="srcs" style="margin:0">اضغط على الآية المخفية لتكشف كلمة كلمة، واضغط رقم الآية لتسجيلها «حفظتها».</p>';
  $$('[data-m]',M).forEach(function(b){b.onclick=function(){ST.mode=b.dataset.m;setPref('mode',ST.mode);ST.rev={};paintMemo()}});
  $$('[data-n]',M).forEach(function(b){b.onclick=function(){ST.rep=+b.dataset.n;setPref('rep',ST.rep);paintMemo()}});
  $$('[data-r]',M).forEach(function(b){b.onclick=function(){var r=b.dataset.r,k=ST.cur;
    if(r==='w')revealNext(k);else if(r==='a'){ST.rev[k]=999;paintMemo();nextCur(k)}
    else if(r==='hide'){ST.rev={};paintMemo()}else if(r==='show'){ST.ks.forEach(function(x){ST.rev[x]=999});paintMemo()}
    else if(r==='rep')startRepeat()}});
  ST.cur=ST.ks.filter(function(k){return !DONE[k]})[0]||ST.ks[0];
  paintMemo();M.scrollIntoView({block:'nearest',behavior:'smooth'});
}
function paintMemo(){var M=$('#memo');
  $$('[data-m]',M).forEach(function(b){b.classList.toggle('on',b.dataset.m===ST.mode)});
  $$('[data-n]',M).forEach(function(b){b.classList.toggle('on',+b.dataset.n===ST.rep)});
  var base=ST.mode==='first'?1:0;
  $$('#q .ay').forEach(function(a){var k=a.dataset.k,r=Math.max(base,ST.rev[k]||0),ws=$$('.w',a);
    ws.forEach(function(w,i){w.classList.toggle('h',i>=r)});a.classList.toggle('shown',r>=ws.length);a.classList.toggle('cur',k===ST.cur)});
}
function revealNext(k){var base=ST.mode==='first'?1:0;ST.rev[k]=Math.max(base,ST.rev[k]||0)+1;ST.cur=k;paintMemo();if(ST.rev[k]>=D.ayat[k].w.length)nextCur(k)}
function nextCur(k){var i=ST.ks.indexOf(k);if(i<ST.ks.length-1){ST.cur=ST.ks[i+1];paintMemo()}}
var REP=null;
function startRepeat(){if(VR)vrClose();var k=ST.cur||ST.ks[0],n=ST.rep||P.rep||3;stopRepeat();
  var el=document.getElementById('a'+k.replace(':','-'));if(el)el.scrollIntoView({block:'center',behavior:'smooth'});
  if(hasAudio(ST.ae,k)){playKeys([k],n);return}
  REP={k:k,n:n,i:0};var d=document.createElement('div');d.className='rep';d.id='rep';document.body.appendChild(d);paintRep();
}
function paintRep(){var d=$('#rep');if(!d||!REP)return;var s=REP.k.split(':');
  d.innerHTML='<div class="cnt">'+ar(REP.i)+'/'+ar(REP.n)+'</div><div style="flex:1"><b style="font-size:14px">كرّر الآية '+ar(s[1])+' بصوتك</b><div class="dots">'+Array.apply(null,Array(REP.n)).map(function(_,i){return '<i class="'+(i<REP.i?'on':'')+'"></i>'}).join('')+'</div></div><button class="btn sm pri" id="repGo">قرأتها</button><button class="btn sm" id="repX" aria-label="إنهاء">✕</button>';
  $('#repGo').onclick=function(){REP.i++;if(REP.i>=REP.n){var k=REP.k,n=REP.n;stopRepeat();toast('🌟 أحسنت! كرّرتها '+ar(n)+' مرات');if(!DONE[k])setTimeout(function(){ayahSheet(k)},700);return}paintRep()};
  $('#repX').onclick=stopRepeat;
}
function stopRepeat(){var d=$('#rep');if(d)d.remove();REP=null}

/* ---------- التسميع بالمايك: تظهر الكلمات كلما قرأها الطالب صحيحة، وتتوقف عند الخطأ ---------- */
var SR=window.SpeechRecognition||window.webkitSpeechRecognition,VR=null;
var FILL={};'اعوذ بالله من الشيطان الرجيم بسم الله الرحمن الرحيم صدق العظيم'.split(' ').forEach(function(t){FILL[skel(t)]=1});
function skel(t){return t.replace(/[ٱٰ]/g,'ا').replace(/ى/g,'ي').replace(/ة/g,'ه').replace(/[^ء-ي]/g,'').replace(/[ـءأإآؤئا]/g,'')}
/* أحرف يخلط بينها التعرّف على الصوت، فاستبدالها نصف خطأ فقط */
var NEAR={};['ضظد','ذزظ','ثسص','طت','قك','حه','هة','يى','تة'].forEach(function(g){for(var i=0;i<g.length;i++)for(var j=0;j<g.length;j++)if(i!==j)NEAR[g[i]+g[j]]=1});
function lev(a,b){function c(x){return x==='ي'||x==='و'?.5:1}var m=a.length,n=b.length,d=[0],i,j;for(j=1;j<=n;j++)d[j]=d[j-1]+c(b[j-1]);
  for(i=1;i<=m;i++){var p=d[0];d[0]+=c(a[i-1]);for(j=1;j<=n;j++){var t=d[j],x=a[i-1],y=b[j-1];d[j]=Math.min(d[j]+c(x),d[j-1]+c(y),p+(x===y?0:NEAR[x+y]?.5:1));p=t}}return d[n]}
function sim(a,b){if(a===b)return true;var L=Math.max(a.length,b.length);if(L<=2)return false;return lev(a,b)<=(L===3?.5:L<=5?1:L<=8?2:3)}
function loose(a,b){var L=Math.max(a.length,b.length);return L>=3&&lev(a,b)<=Math.max(1,Math.floor(L*.35))}
function vrOpen(b){
  if(VR){vrClose();return}
  if(!SR)return openSheet('<h3>🎙️ التسميع بالمايك</h3><p>متصفحك الحالي لا يدعم التعرّف على الصوت.</p><p>'+(INAPP?'افتح الرابط في <b>Safari</b> أو <b>Chrome</b> (من زر ⋯ ← فتح في المتصفح).':'استخدم <b>Chrome</b> على أندرويد أو الكمبيوتر، أو <b>Safari</b> على آيفون.')+'</p>');
  if(ST.memo){ST.memo=false;$$('[data-a=memo]').forEach(function(x){x.classList.remove('on')});memoUI()}
  stopRepeat();stopAudio();
  var E=[];ST.ks.forEach(function(k){$$('#a'+k.replace(':','-')+' .w').forEach(function(el,i){E.push({k:k,i:i,el:el,n:skel(el.textContent)})})});
  VR={E:E,pos:0,on:false,errs:0,hints:0,bad:{},seg:null,rs:[]};
  b.classList.add('on');$('#q').classList.add('hide');
  var M=$('#vr');M.hidden=false;
  M.innerHTML='<div class="vrh"><button class="vmic" id="vrMic" aria-label="تشغيل المايك">🎙️</button><div><b id="vrSt">اضغط المايك وابدأ القراءة من حفظك</b><small id="vrHeard">'+(navigator.onLine===false?'⚠️ التعرّف على الصوت يحتاج إنترنت':'')+'</small></div></div>'+
   '<div class="r"><button class="btn sm" data-v="hint">💡 ساعدني بكلمة</button><button class="btn sm" data-v="ayah">↩ أعد الآية</button><button class="btn sm" data-v="reset">⟲ من البداية</button><span class="vrc">الأخطاء: <b id="vrE">٠</b></span></div>'+
   '<p class="srcs" style="margin:0">اقرأ بصوت واضح، وتظهر الكلمات كلما قرأتها صحيحة. إذا أخطأت يتوقف ويظهر مكان الخطأ بالأحمر، فأعد قراءة الكلمة. وإذا متأكد إنك قلتها صح اضغط على الكلمة الحمراء. اضغط على أي آية لتبدأ منها.</p>';
  $('#vrMic').addEventListener('click',function(e){e.preventDefault();e.stopPropagation();VR.on?vrStop():vrStart()});
  $$('[data-v]',M).forEach(function(x){x.onclick=function(){var v=x.dataset.v;
    if(v==='hint'){if(VR.pos<VR.E.length){VR.hints++;vrBad(VR.E[VR.pos].k);VR.E[VR.pos].hint=1;vrSet(VR.pos+1)}}
    else if(v==='ayah')vrJump((VR.E[Math.min(VR.pos,VR.E.length-1)]||{}).k);
    else if(v==='reset'){VR.E.forEach(function(e){e.hint=0});VR.errs=VR.hints=0;VR.bad={};vrSet(0,1)}}});
  ST.cur=ST.ks.filter(function(k){return !DONE[k]})[0]||ST.ks[0];
  vrJump(ST.cur);M.scrollIntoView({block:'nearest',behavior:'smooth'});
  vrStart();
}
document.addEventListener('visibilitychange',function(){if(document.hidden&&VR&&VR.on)vrStop()});
function vrClose(){vrStop();VR=null;var M=$('#vr');if(M)M.hidden=true;$$('[data-a=vr]').forEach(function(x){x.classList.remove('on')});
  var Q=$('#q');if(Q){Q.classList.remove('hide');$$('.ay',Q).forEach(function(a){a.classList.remove('shown','cur')});$$('.w',Q).forEach(function(w){w.classList.remove('h','err','hint')})}}
function vrAccept(){var e=VR.E[VR.pos];if(!e)return;VR.errs=Math.max(0,VR.errs-1);if(VR.bad[e.k])VR.bad[e.k]--;e.el.classList.remove('err');vrStatus('👍 اعتمدناها، كمّل');vrSet(VR.pos+1)}
function vrFirst(k){for(var i=0;i<VR.E.length;i++)if(VR.E[i].k===k)return i;return 0}
function vrJump(k){if(!k)return;vrSet(vrFirst(k),1)}
function vrSet(p,back){VR.pos=back?p:Math.max(VR.pos,p);if(VR.seg){VR.seg.base=VR.pos;VR.seg.off=VR.seg.len}vrPaint();if(VR.pos>=VR.E.length)vrDone()}
function vrPaint(v){var E=VR.E,P=Math.max(VR.pos,v||0),cur=E[P]&&E[P].k;
  E.forEach(function(e,x){e.el.classList.toggle('h',x>=P);e.el.classList.toggle('nx',x===P);e.el.classList.toggle('hint',!!e.hint&&x<P);if(x!==P)e.el.classList.remove('err')});
  $$('#q .ay').forEach(function(a){var k=a.dataset.k;a.classList.toggle('cur',k===cur);a.classList.toggle('shown',!$('.w.h',a))});
  var e=$('#vrE');if(e)e.textContent=ar(VR.errs);
  if(cur&&cur!==VR.lastK){VR.lastK=cur;ST.cur=cur;var el=document.getElementById('a'+cur.replace(':','-'));if(el)el.scrollIntoView({block:'center',behavior:'smooth'})}
}
function vrBad(k){VR.bad[k]=(VR.bad[k]||0)+1}
function vrStatus(t,h){var s=$('#vrSt');if(s)s.textContent=t;if(h!=null){var x=$('#vrHeard');if(x)x.textContent=h}}
function vrStart(){if(!VR||VR.on)return;try{vrStatus('⏳ جارٍ تشغيل المايك…','');if(VR.pos>=VR.E.length)vrSet(0,1);VR.on=true;$('#vrMic').classList.add('live');vrRec()}catch(e){VR.on=false;vrStatus('⚠️ تعذّر تشغيل المايك: '+(e&&e.message||e))}}
function vrStop(){if(!VR)return;VR.on=false;var R=VR.R;VR.R=null;if(R){R.onend=R.onresult=R.onerror=null;try{R.abort()}catch(e){}}var m=$('#vrMic');if(m)m.classList.remove('live');vrStatus('⏸ متوقف – اضغط المايك للمتابعة')}
addEventListener('error',function(e){if(VR)vrStatus('⚠️ خطأ: '+e.message)});
function vrRec(){var R=new SR();VR.R=R;R.lang='ar-SA';R.continuous=!AND;R.interimResults=true;R.maxAlternatives=1;
  VR.seg={base:VR.pos,off:0,len:0,F:[]};
  R.onstart=function(){if(VR&&VR.R===R&&!VR.seg.len)vrStatus('🔴 أسمعك… ابدأ القراءة')};
  R.onresult=function(ev){if(!VR||VR.R!==R)return;var F=[],I=[],txt='';
    // أندرويد يكرّر النتائج النهائية أحيانًا، فنأخذ منها الجديد فقط
    for(var i=ev.resultIndex||0;i<ev.results.length;i++){var r=ev.results[i],t=r[0].transcript;txt=t;if(r.isFinal)VR.seg.F.push(t);else I.push(t)}
    F=VR.seg.F.join(' ').split(/\s+/).map(skel).filter(Boolean);I=I.join(' ').split(/\s+/).map(skel).filter(Boolean);
    vrStatus('🔴 أسمعك…','سمعت: '+txt);vrHear(F,I,false);
    clearTimeout(VR.pt);VR.pt=setTimeout(function(){if(VR&&VR.R===R)vrHear(F,I,true)},1400)};
  R.onerror=function(e){if(!VR||VR.R!==R)return;var m={'not-allowed':'المايك مقفول: اسمح للمتصفح باستخدام المايك من الإعدادات ثم حاول مرة ثانية','service-not-allowed':'الجهاز منع التعرّف على الصوت. في الآيفون: الإعدادات ← عام ← لوحة المفاتيح ← فعّل «الإملاء»','network':'التعرّف على الصوت يحتاج إنترنت','language-not-supported':'المتصفح لا يدعم العربية في التعرّف على الصوت','audio-capture':'ما لقينا مايك في الجهاز، أو تطبيق ثاني يستخدمه'}[e.error];
    if(m){vrStop();vrStatus('⚠️ '+m)}};
  R.onend=function(){if(!VR||VR.R!==R||!VR.on)return;clearTimeout(VR.pt);var S=VR.seg;if(S.Fl)vrHear(S.Fl,S.Il||[],true);
    var t=Date.now();VR.rs=VR.rs.filter(function(x){return t-x<4000});if(!S.len)VR.rs.push(t);
    if(VR.rs.length>5){vrStop();vrStatus('⚠️ المايك ما يسمع شي، تأكد من إذن المايك واضغطه مرة ثانية');return}setTimeout(function(){if(VR&&VR.on&&VR.R===R)vrRec()},120)};
  try{R.start()}catch(e){vrStop();vrStatus('⚠️ تعذّر تشغيل المايك')}
}
/* مطابقة كل ما سمعناه في الجلسة من جديد في كل مرة (لأن المتصفح يعدّل كلامه)؛
   الخطأ يوقف التقدّم حتى تُقال الكلمة الصحيحة، ويُسمح بالرجوع لأول الآية */
function vrRun(s,T,force,deep){var E=VR.E,j=s,i=0;
  function ok(x,y){return x<T.length&&y<E.length&&sim(T[x],E[y].n)}
  function short(y){return y<E.length&&E[y].n.length<=2}
  while(i<T.length&&j<E.length){var t=T[i],w=E[j].n,nx=i+1<T.length;
    if(!w){j++;continue}
    if(sim(t,w)){i++;j++;continue}
    if(nx&&sim(t+T[i+1],w)){i+=2;j++;continue}
    if(j+1<E.length&&sim(t,w+E[j+1].n)){i++;j+=2;continue}
    // التعرّف أسقط كلمة أو كلمتين قصيرتين (من، في، لا، كان…)
    if(short(j)&&ok(i,j+1)){i++;j+=2;continue}
    if(short(j)&&short(j+1)&&ok(i,j+2)){i++;j+=3;continue}
    // كلمة زائدة أو تصحيح الطالب لنفسه: التي بعدها هي المطلوبة
    if(ok(i+1,j)){i++;continue}
    // سُمعت الكلمة ناقصة أو مشوّهة قليلًا لكن الكلمة التي بعدها صحيحة (يا أيها…)
    if((loose(t,w)||w.indexOf(t)===0)&&ok(i+1,j+1)){i++;j++;continue}
    if(FILL[t]){i++;continue}
    // الرجوع للقراءة من أول الآية، أو إعادة كلام سابق (المتصفح يكرّر الكلام أحيانًا)
    // نجرّب كل نقطة رجوع ممكنة ونختار التي تمشي أبعد
    var st=vrFirst(E[j].k),C=[],x,y;
    if(!deep){if(t.length>=3&&i+1<T.length)for(x=st;x<j;x++)if(sim(t,E[x].n)&&ok(i+1,x+1))C.push([x+1,i+1]);
      for(y=i;y<=i+3;y++)for(x=Math.max(0,j-80);x<j;x++)if(ok(y,x)&&(ok(y+1,x+1)||ok(y+1,x+2)||(short(x+1)&&ok(y+2,x+2))))C.push([x+1,y+1])}
    if(C.length){var best=null;C.forEach(function(c){var q=vrRun(c[0],T.slice(c[1]),force,1);if(!best||(!q.err&&best.r.err)||(q.err===best.r.err&&q.j>best.r.j))best={c:c,r:q}});
      if(!best.r.err||best.r.j>j)return {j:Math.max(best.r.j,j),err:best.r.err,i:best.c[1]+best.r.i}}
    if(!nx&&(!force||w.indexOf(t)===0))break; // آخر كلمة سُمعت: ننتظر ما بعدها قبل الحكم بالخطأ
    return {j:j,err:1,i:i+1}}
  return {j:j,err:0,i:i}}
function vrHear(F,I,force){var S=VR.seg,all=F.concat(I).slice(S.off),n=force?all.length:Math.max(0,F.length-S.off);S.len=S.off+all.length;S.Fl=F;S.Il=I;
  var c=vrRun(S.base,all.slice(0,n),force);if(c.j>VR.pos)VR.pos=c.j;
  if(!c.err&&!force&&c.i>0){S.base=c.j;S.off+=c.i;all=all.slice(c.i)} // النتائج النهائية لا تتغير، فنعتمدها ونكمل بعدها
  if(c.err&&c.j<VR.E.length){
    // نوقف عند الخطأ وننسى ما سُمع، فيعيد الطالب الكلمة أو الآية
    S.base=c.j;S.off+=all.length;VR.errs++;vrBad(VR.E[c.j].k);vrPaint();var w=VR.E[c.j].el;w.classList.remove('err');void w.offsetWidth;w.classList.add('err');
    if(navigator.vibrate)navigator.vibrate(120);vrStatus('✋ توقف! راجع الكلمة المعلَّمة بالأحمر وأعدها');return}
  var v=vrRun(S.base,all,false).j;vrPaint(v);
  if(VR.pos>=VR.E.length||v>=VR.E.length){VR.pos=VR.E.length;vrDone()}}
function vrDone(){if(!VR||VR.fin)return;VR.fin=1;vrStop();vrPaint();vrStatus('🌟 أتممت التسميع');
  var good=ST.ks.filter(function(k){return !VR.bad[k]&&!DONE[k]}),E=VR.errs,H=VR.hints;
  setTimeout(function(){openSheet('<h3>'+(E+H?'👏 أحسنت المحاولة':'🌟 ما شاء الله! تسميع بلا أخطاء')+'</h3><p>الأخطاء: <b>'+ar(E)+'</b> · المساعدات: <b>'+ar(H)+'</b></p>'+
    (good.length?'<p>الآيات التي قرأتها بلا خطأ: '+good.map(function(k){return ar(k.split(':')[1])}).join('، ')+'</p><button class="btn pri" id="vrSave">✓ سجّلها محفوظة</button> ':'')+'<button class="btn" id="vrAgain">⟲ أعد التسميع</button>',
    function(b){var s=$('#vrSave',b);if(s)s.onclick=function(){good.forEach(function(k){DONE[k]=1;var el=document.getElementById('a'+k.replace(':','-'));if(el)el.classList.add('done')});save('done',DONE);updProg();closeSheet();toast('✓ سُجّلت '+ar(good.length)+' آيات محفوظة')};
      $('#vrAgain',b).onclick=function(){closeSheet();if(VR){VR.fin=0;VR.errs=VR.hints=0;VR.bad={};VR.E.forEach(function(e){e.hint=0});vrSet(0,1)}}})},500)}

/* ---------- الصوت ---------- */
var AU=null,PL=null;
function playLesson(){var e=ST.ae;if(!e)return;var ks=ST.ks.filter(function(k){return hasAudio(e,k)});var st=ks.indexOf(ST.cur);playKeys(st>0?ks.slice(st):ks,1)}
function playKeys(ks,times){stopAudio();if(!ks.length)return;PL={ks:ks,i:0,times:times,t:0,g:ST.g,e:ST.ae};AU=new Audio();AU.preload='auto';
  AU.onended=function(){PL.t++;if(PL.t<PL.times){AU.currentTime=0;AU.play();paintPlayer();return}PL.t=0;PL.i++;if(PL.i<PL.ks.length)playCur();else{stopAudio();toast('انتهت التلاوة، بارك الله في القارئ')}};
  AU.onerror=function(){toast('تعذّر تشغيل التسجيل');stopAudio()};
  playCur()}
function playCur(){var k=PL.ks[PL.i];AU.src=audioURL(PL.g,PL.e,k);var p=AU.play();if(p&&p.catch)p.catch(function(){});
  $$('.ay.play').forEach(function(x){x.classList.remove('play')});var el=document.getElementById('a'+k.replace(':','-'));if(el){el.classList.add('play');el.scrollIntoView({block:'center',behavior:'smooth'})}paintPlayer()}
function paintPlayer(){var b=$('#player'),k=PL.ks[PL.i],s=k.split(':');b.hidden=false;
  b.innerHTML='<button id="plP" aria-label="إيقاف مؤقت">'+(AU&&AU.paused?'▶':'❚❚')+'</button><div class="t">الآية '+ar(s[1])+(PL.times>1?' · التكرار '+ar(PL.t+1)+'/'+ar(PL.times):'')+'<br><b>بصوت الطالب: '+esc(PL.e.reader||'')+'</b></div><button id="plX" aria-label="إيقاف">■</button>';
  $('#plP').onclick=function(){if(AU.paused)AU.play();else AU.pause();paintPlayer()};$('#plX').onclick=stopAudio}
function stopAudio(){if(AU){AU.pause();AU.onended=AU.onerror=null;AU=null}PL=null;$('#player').hidden=true;$$('.ay.play').forEach(function(x){x.classList.remove('play')})}

/* ---------- آخر موضع أثناء التمرير ---------- */
var scT;addEventListener('scroll',function(){if(!ST.L||!$('#q'))return;clearTimeout(scT);scT=setTimeout(function(){var ays=$$('#q .ay');for(var i=0;i<ays.length;i++){var r=ays[i].getBoundingClientRect();if(r.bottom>140){if(scrollY>200)setLast(ays[i].dataset.k,false);break}}},600)},{passive:true});

/* ---------- مشاركة الآية صورة ---------- */
function wrap(ctx,words,maxW){var lines=[],cur='';words.forEach(function(w){var t=cur?cur+' '+w:w;if(ctx.measureText(t).width>maxW&&cur){lines.push(cur);cur=w}else cur=t});if(cur)lines.push(cur);return lines}
function starPath(c,x,y,r){c.beginPath();for(var i=0;i<16;i++){var a=Math.PI/8*i-Math.PI/2,rr=i%2?r*.72:r;c.lineTo(x+rr*Math.cos(a),y+rr*Math.sin(a))}c.closePath()}
function ayahImage(k){var s=k.split(':');
  return Promise.all([document.fonts.load('60px Hafs'),document.fonts.load('40px Ruqaa'),document.fonts.load('700 30px Tajawal')]).then(function(){
  var W=1080,H=1350,c=document.createElement('canvas');c.width=W;c.height=H;var x=c.getContext('2d');x.direction='rtl';
  var g=x.createRadialGradient(W/2,0,100,W/2,H*.4,H);g.addColorStop(0,'#0f9064');g.addColorStop(.5,'#0a6e4b');g.addColorStop(1,'#053b28');x.fillStyle=g;x.fillRect(0,0,W,H);
  x.strokeStyle='rgba(240,213,138,.12)';x.lineWidth=1.5;for(var yy=0;yy<H+90;yy+=90)for(var xx=(yy/90%2)*45;xx<W+90;xx+=90){starPath(x,xx,yy,30);x.stroke()}
  x.strokeStyle='#e6c97a';x.lineWidth=4;rr(x,36,36,W-72,H-72,30);x.stroke();x.lineWidth=1.5;rr(x,50,50,W-100,H-100,22);x.stroke();
  [[50,50],[W-50,50],[50,H-50],[W-50,H-50]].forEach(function(p){x.fillStyle='#e6c97a';starPath(x,p[0],p[1],22);x.fill();x.fillStyle='#0a6e4b';x.beginPath();x.arc(p[0],p[1],7,0,7);x.fill()});
  x.textAlign='center';x.fillStyle='#f3dc97';x.font='70px Ruqaa';x.fillText('مصحف ابن رشد',W/2,150);
  x.font='700 28px Tajawal';x.fillStyle='rgba(255,255,255,.85)';x.fillText('قسم التربية الإسلامية',W/2,196);
  var px=95,py=285,pw=W-190,ph=H-285-235;var pg=x.createLinearGradient(0,py,0,py+ph);pg.addColorStop(0,'#fffaf0');pg.addColorStop(1,'#f6ecd2');x.fillStyle=pg;rr(x,px,py,pw,ph,26);x.fill();
  x.strokeStyle='#c9a24a';x.lineWidth=3;rr(x,px,py,pw,ph,26);x.stroke();x.lineWidth=1;rr(x,px+10,py+10,pw-20,ph-20,18);x.stroke();
  var cw=520,cx=W/2-cw/2,cy=py-34;x.fillStyle='#0a6e4b';rr(x,cx,cy,cw,68,34);x.fill();x.strokeStyle='#e6c97a';x.lineWidth=3;rr(x,cx,cy,cw,68,34);x.stroke();
  x.fillStyle='#f3dc97';x.font='40px Ruqaa';x.fillText(D.suras[s[0]].name,W/2,cy+48);
  var words=plain(k).split(' ');words.push(words.pop()+' '+ar(s[1]));var fs=96,lines,lh;
  do{x.font=fs+'px Hafs';lines=wrap(x,words,pw-120);lh=fs*1.95;fs-=2}while(lines.length*lh>ph-130&&fs>30);
  x.fillStyle='#1b1a14';var ty=py+ph/2-(lines.length*lh)/2+lh*.62+10;lines.forEach(function(l,i){x.fillText(l,W/2,ty+i*lh)});
  x.fillStyle='#f3dc97';x.font='700 31px Tajawal';x.fillText('مدرسة ابن رشد الإعدادية للبنين · مملكة البحرين',W/2,H-150);
  x.fillStyle='rgba(255,255,255,.8)';x.font='24px Tajawal';x.fillText('إعداد: أ. طلال سعود المهلهل',W/2,H-108);
  return new Promise(function(res){c.toBlob(res,'image/png')})})}
function rr(x,a,b,w,h,r){x.beginPath();x.moveTo(a+r,b);x.arcTo(a+w,b,a+w,b+h,r);x.arcTo(a+w,b+h,a,b+h,r);x.arcTo(a,b+h,a,b,r);x.arcTo(a,b,a+w,b,r);x.closePath()}
function shareAyah(k){toast('جارٍ تجهيز الصورة…');ayahImage(k).then(function(blob){var s=k.split(':'),name='ayah-'+s[0]+'-'+s[1]+'.png';
  var f;try{f=new File([blob],name,{type:'image/png'})}catch(e){}
  if(f&&navigator.canShare&&navigator.canShare({files:[f]})){navigator.share({files:[f],title:'مصحف ابن رشد',text:D.suras[s[0]].name+' – الآية '+s[1]+'\n'+SITE}).catch(function(){})}
  else{var u=URL.createObjectURL(blob);openSheet('<h3>صورة الآية</h3><img src="'+u+'" alt="صورة الآية" style="width:100%;border-radius:14px;box-shadow:var(--sh)"><div class="row"><a class="btn pri" href="'+u+'" download="'+name+'">⤓ حفظ الصورة</a></div><p class="srcs">على الآيفون: اضغط مطوّلًا على الصورة ثم «حفظ الصورة».</p>')}
 }).catch(function(){toast('تعذّر تجهيز الصورة')})}

/* ---------- المفضلة ---------- */
function findLesson(k){var s=+k.split(':')[0],a=+k.split(':')[1],r=null;['6','7','8','9'].some(function(g){return D.grades[g].lessons.some(function(L){if(L.sura===s&&a>=L.from&&a<=L.to){r=[g,L.id];return true}})});return r}
function favs(){var h='<section class="view"><div class="crumb"><a href="#/">الرئيسية</a> ‹ <span>المفضّلة</span></div><h1 class="ttl">⭐ آياتي المفضّلة</h1><div class="favs" style="margin-top:12px">';
  if(!FAV.length)h+='<div class="card empty">ما أضفت آيات بعد. افتح أي درس، واضغط على رقم الآية ثم ⭐.</div>';
  FAV.forEach(function(k){if(!D.ayat[k])return;var f=findLesson(k),s=k.split(':');h+='<a class="card" href="#/g/'+f[0]+'/'+f[1]+'?a='+k+'"><div class="q tj">'+D.ayat[k].w.map(function(w){return wordHTML(w)}).join(' ')+' '+ar(s[1])+'</div><small>'+esc(sname(s[0]))+' · الآية '+ar(s[1])+'</small></a>'});
  APP.innerHTML=h+'</div></section>';scrollTo(0,0)}

/* ---------- عن المصحف والتثبيت ---------- */
var UA=navigator.userAgent,IOS=/iphone|ipad|ipod/i.test(UA)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1),AND=/android/i.test(UA);
var STANDALONE=matchMedia('(display-mode: standalone)').matches||navigator.standalone;
var INAPP=/FBAN|FBAV|FB_IAB|Instagram|WhatsApp|Snapchat|Line\/|TikTok|musical_ly|Twitter/i.test(UA);
function installSteps(){return '<h3>📲 ثبّت المصحف على جوالك</h3><p>بعد التثبيت يفتح مثل التطبيق، ويشتغل <b>بدون إنترنت</b> بعد أول فتح.</p>'+
 '<div class="box"><div class="k">الآيفون (Safari)</div><ol class="steps"><li>افتح الرابط في <b>Safari</b>.</li><li>اضغط زر المشاركة <b>⬆︎</b> أسفل الشاشة.</li><li>اختر <b>«إضافة إلى الشاشة الرئيسية»</b> ثم «إضافة».</li></ol></div>'+
 '<div class="box"><div class="k">الأندرويد (Chrome)</div><ol class="steps"><li>افتح الرابط في <b>Chrome</b>.</li><li>اضغط زر <b>«تثبيت»</b> في أعلى المصحف، أو القائمة <b>⋮</b> ثم <b>«تثبيت التطبيق»</b>.</li></ol></div>'+
 '<div class="box"><div class="k">فتحت الرابط من واتساب أو انستقرام؟</div><p>اضغط <b>⋮</b> أو <b>⋯</b> أعلى الشاشة واختر <b>«فتح في المتصفح»</b> (Chrome أو Safari)، ثم ثبّت المصحف.</p></div>'}
function about(){var h='<section class="view about"><div class="crumb"><a href="#/">الرئيسية</a> ‹ <span>عن المصحف</span></div><h1 class="ttl">عن مصحف ابن رشد</h1>';
  h+='<div class="card" style="padding:14px 16px;margin-top:12px">'+installSteps()+(DEFER?'<div class="row"><button class="btn pri" id="inst2">⤓ ثبّت الآن</button></div>':'')+'</div>';
  h+='<div class="card" style="padding:4px 16px 14px;margin-top:12px"><h3>طريقة الاستخدام</h3><ul class="steps"><li>اختر صفّك، ثم الدرس.</li><li>اضغط على أي <b>كلمة</b> لتعرف معناها وأحكام التجويد فيها.</li><li>اضغط على <b>رقم الآية</b> للتفسير الميسر والمفضّلة وتسجيل الحفظ ومشاركة الآية صورة.</li><li>اضغط على أي <b>لون</b> في دليل الألوان لتعرف الحكم.</li><li><b>🧠 التسميع</b>: أخفِ الآيات وتدرّب على الحفظ، واكشف كلمة كلمة، وكرّر الآية بالعدد الذي تختاره.</li></ul>';
  h+='<h3>المصادر</h3><ul class="steps"><li>'+esc(D.sources.text)+'.</li><li>'+esc(D.sources.meanings)+'.</li><li>'+esc(D.sources.tafsir)+'.</li><li>الخط: خط مصحف المدينة KFGQPC Uthmanic Script HAFS – مجمع الملك فهد لطباعة المصحف الشريف.</li><li>المنهج: خطة التلاوة ودروس التربية الإسلامية للفصل الأول من موقع القسم.</li></ul><p class="srcs">آخر بناء للبيانات: '+esc(D.built)+'</p></div></section>';
  APP.innerHTML=h;scrollTo(0,0);var b=$('#inst2');if(b)b.onclick=doInstall}
var DEFER=null;
addEventListener('beforeinstallprompt',function(e){e.preventDefault();DEFER=e;$('#btnInstall').hidden=false});
addEventListener('appinstalled',function(){DEFER=null;$('#btnInstall').hidden=true;toast('✓ ثُبّت المصحف، تجده في شاشتك الرئيسية')});
function doInstall(){if(DEFER){DEFER.prompt();DEFER.userChoice.then(function(){DEFER=null})}else openSheet(installSteps())}
$('#btnInstall').onclick=doInstall;
if(!STANDALONE&&IOS)$('#btnInstall').hidden=false;
function inAppBanner(){if(!INAPP||STANDALONE)return;var b=$('#inapp'),url=location.href;
  var h='<b>أنت داخل '+(/Instagram/i.test(UA)?'انستقرام':/WhatsApp/i.test(UA)?'واتساب':'تطبيق آخر')+'</b> · افتح المصحف في المتصفح ليشتغل بدون نت وتقدر تثبّته.<div class="row">';
  if(AND)h+='<a class="btn sm" href="intent://'+url.replace(/^https?:\/\//,'')+'#Intent;scheme=https;package=com.android.chrome;end">افتح في Chrome</a>';
  else h+='<span style="font-size:13px">اضغط ⋯ ثم «فتح في Safari» أو «فتح في المتصفح»</span>';
  h+='<button class="btn sm" id="cpy">📋 انسخ الرابط</button><button class="btn sm" id="iaX" aria-label="إغلاق">✕</button></div>';
  b.innerHTML=h;b.hidden=false;$('#cpy').onclick=function(){copy(SITE)};$('#iaX').onclick=function(){b.hidden=true}}

/* ---------- التوجيه ---------- */
function go(h){location.hash=h}
function route(){closeSheet();stopRepeat();stopAudio();if(VR)vrClose();var h=location.hash.slice(1)||'/',q={};
  var qi=h.indexOf('?');if(qi>=0){h.slice(qi+1).split('&').forEach(function(p){var kv=p.split('=');q[kv[0]]=decodeURIComponent(kv[1]||'')});h=h.slice(0,qi)}
  var p=h.split('/').filter(Boolean);ST={};
  if(p[0]==='g'&&p[2])lesson(p[1],p[2],q);else if(p[0]==='g')grade(p[1]);else if(p[0]==='fav')favs();else if(p[0]==='about')about();else{home();if(!q.keep)scrollTo(0,0)}
  APP.focus({preventScroll:true});
}
APP.addEventListener('click',function(e){var b=e.target.closest('[data-share]');if(b){e.preventDefault();shareAyah(b.dataset.share)}});

/* ---------- البدء ---------- */
applyPrefs();inAppBanner();
matchMedia('(prefers-color-scheme: dark)').addEventListener&&matchMedia('(prefers-color-scheme: dark)').addEventListener('change',applyPrefs);
Promise.all([fetch('data/mushaf.json').then(function(r){return r.json()}),fetch('audio/audio.json',{cache:'no-cache'}).then(function(r){return r.ok?r.json():{}}).catch(function(){return {}})]).then(function(r){
  D=r[0];AUDIO=r[1]||{};delete AUDIO._readme;addEventListener('hashchange',route);route()}).catch(function(){APP.innerHTML='<div class="card empty">تعذّر تحميل المصحف. تأكد من الاتصال بالإنترنت أول مرة، ثم يشتغل بدون نت.</div>'});
if('serviceWorker' in navigator){var hadSW=!!navigator.serviceWorker.controller,reloaded=false;
  // إذا نزل تحديث جديد للمصحف تنفتح النسخة الجديدة تلقائيًا
  navigator.serviceWorker.addEventListener('controllerchange',function(){if(hadSW&&!reloaded){reloaded=true;location.reload()}});
  addEventListener('load',function(){navigator.serviceWorker.register('sw.js',{updateViaCache:'none'}).then(function(r){r.update()}).catch(function(){})})}
})();
