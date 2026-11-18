/* ============ 文件块弹窗（工作流程图 + 演练场共用） ============ */
var fpop=null;
document.addEventListener('click',function(e){
 var c=e.target.closest('.fchip');
 if(c){var k=c.getAttribute('data-f'),i=FM[k];
  if(fpop)fpop.remove();
  fpop=document.createElement('div');fpop.className='fpop';
  fpop.innerHTML=i?('<b>📄 '+k+'</b><br><b>'+i[0]+'</b><br>'+i[1]+(i[2]?'<br><span style="color:#6b7280">谁写谁读：'+i[2]+'</span>':'')):('<b>📄 '+c.textContent+'</b><br>规程章节——权威原文见 references/ 对应规范文件。');
  document.body.appendChild(fpop);
  var r=c.getBoundingClientRect();
  fpop.style.left=Math.min(window.innerWidth-300,Math.max(8,r.left))+'px';
  fpop.style.top=(r.bottom+8+window.scrollY)+'px';
  e.stopPropagation();return;}
 if(fpop&&!e.target.closest('.fpop')){fpop.remove();fpop=null;}});

/* ====== 演练场 v3：总控记录（指令台账·总控日志）/ 线进度（线进度文件）/ 线记录（交接与沉淀）/ 迭代目录（实时生长） ====== */
var WZ_KEY='workteam_wizard_v08';
var W,SNAPS,BUSY=false,AW='ctrl',AB='A',FC={};
var Q=[],ONSEND=null;
var WINNAME={ctrl:'总控',A:'线A · 批会话',B:'线B · 批会话',E:'线E · 联调会话'};
var cmpLock=null,composerOn=false;
function maxSolved(){var m=-1;for(var k in W.solved){if(W.solved[k]&&+k>m)m=+k;}return m;}
function syncCmp(){var c=el('wzCmp');c.classList.remove('lock-ask','lock-done','lock-watch','lock-idle');if(cmpLock)c.classList.add('lock-'+cmpLock);}
function el(id){return document.getElementById(id)}
function freshW(){return {i:0,wrong:[],solved:{},chat:{ctrl:[],A:[],B:[],E:[]},
 boards:{A:{z1:[],z2:[],z3:[]},B:{z1:[],z2:[],z3:[]},E:{z1:[],z2:[],z3:[]}},
 ledger:[],prog:{A:{batch:'—',st:'未开批'},B:{batch:'—',st:'未开批'},E:{batch:'—',st:'未开批'}},rec:[],log:[],flags:{},tree:[]};}
W=freshW();SNAPS=[];
function persist(){try{localStorage.setItem(WZ_KEY,JSON.stringify({W:{i:W.i,wrong:W.wrong,solved:W.solved},SNAPS:SNAPS}));}catch(e){}}
function snapNow(){return JSON.stringify({chat:W.chat,boards:W.boards,ledger:W.ledger,prog:W.prog,rec:W.rec,log:W.log,flags:W.flags,tree:W.tree});}
function applySnap(s){var o=JSON.parse(s);W.chat=o.chat;W.boards=o.boards;W.ledger=o.ledger||[];W.prog=o.prog||{A:{batch:'—',st:'未开批'},B:{batch:'—',st:'未开批'},E:{batch:'—',st:'未开批'}};W.rec=o.rec||[];W.log=o.log;W.flags=o.flags||{};W.tree=o.tree||[];}
function cnt(k,n){var old=(FC[k]===undefined)?n:FC[k];FC[k]=n;return old;}
function lock(v){BUSY=v;el('wzWin').classList.toggle('busy',v);el('wzPrev').disabled=v||W.i===0;el('wzNext').disabled=v||!W.solved[W.i];el('wzReset').disabled=v;}
function solve(){W.solved[W.i]=true;replaying=false;cmpLock='done';composerOn=false;syncCmp();SNAPS[W.i]=snapNow();persist();if(!BUSY)el('wzNext').disabled=false;render();
 el('wzCmp').classList.remove('off');el('wzCmp').classList.add('done');}
function miss(){if(W.wrong.indexOf(W.i)<0)W.wrong.push(W.i);persist();}
function switchTab(w){AW=w;document.querySelectorAll('#wzTabs .wtab').forEach(function(b){b.classList.toggle('on',b.getAttribute('data-w')===w)});renderChat();}
function switchBoard(b){AB=b;document.querySelectorAll('#wzBTabs .btab').forEach(function(x){x.classList.toggle('on',x.getAttribute('data-b')===b)});renderSide();}
function renderChat(){var arr=W.chat[AW],base=cnt('c'+AW,arr.length),h='';
 for(var i=0;i<arr.length;i++){var m=arr[i];
  var who=m.who==='u'?'你':(m.who==='n'?'总控 · 自动通报':WINNAME[AW]);
  h+='<div class="msg '+m.who+(i>=base?' flash':'')+'"><div class="who">'+who+'</div>'+m.txt;
  if(m.opts){h+='<div class="optwrap">';
   m.opts.forEach(function(o,ci){var dis=(m.decided||(m.tried.indexOf(o.k)>=0))?' dim':'';
    h+='<button class="optcard'+(m.decided===o.k?' picked':'')+dis+'" data-mi="'+i+'" data-ci="'+ci+'"><span class="tt">'+o.t+'</span>　<span class="stars">'+o.s+'</span><br><span class="why">'+o.why+'</span></button>';});
   if(m.tried.length&&!m.decided){h+='<div class="optres no">❌ '+m.lastNo+'（换一个再试）</div>';}
   if(m.decided){h+='<div class="optres ok">✅ '+m.lastOk+'</div>';}
   h+='</div>';}
  h+='</div>';}
 if(frontierDone)h+='<div class="optdone">已完成本步骤操作，请点击下一步。如需回看之前步骤，请点击上一步（可重做）。</div>';
 el('wzChat').innerHTML=h||'<div style="color:#9ca3af;font-size:13px;padding:20px;text-align:center">（此窗口暂无消息）</div>';
 el('wzChat').scrollTop=1000000;}
function say(w,who,txt){W.chat[w].push({who:who,txt:txt});if(AW===w)renderChat();}
function ask(w,txt,opts,okKey){cmpLock='ask';composerOn=false;syncCmp();var m={who:'a',txt:txt,opts:opts,ok:okKey,decided:null,tried:[],lastNo:'',lastOk:''};W.chat[w].push(m);if(AW===w)renderChat();}
el('wzChat').addEventListener('click',function(e){var b=e.target.closest('.optcard');if(!b)return;
 var mi=+b.getAttribute('data-mi'),ci=+b.getAttribute('data-ci');var m=W.chat[AW][mi];if(!m||!m.opts||m.decided)return;
 var o=m.opts[ci];if(m.tried.indexOf(o.k)>=0)return;
 if(o.k===m.ok){m.decided=o.k;m.lastOk=o.okMsg;renderChat();solve();if(o.follow)seq(o.follow);}
 else{m.tried.push(o.k);m.lastNo=o.noMsg;renderChat();miss();}});
function renderSide(){renderIL();renderRec();renderTree();
 var b=W.boards[AB],P=W.prog[AB],zs=[['z1','wzZ1'],['z2','wzZ2'],['z3','wzZ3']];
 zs.forEach(function(zp){var arr=b[zp[0]],base=cnt('b'+AB+zp[0],arr.length),h='';
  if(zp[0]==='z1')h='<div class="zi"><b>当前批：</b>'+P.batch+'　·　<b>状态：</b>'+P.st+'</div>';
  for(var i=0;i<arr.length;i++){var it=arr[i];
   h+='<div class="zi'+(i>=base?' flash':'')+'">'+(zp[0]==='z1'?((it.d?'✅ ':'▶ ')+it.t):it)+'</div>';}
  el(zp[1]).innerHTML=h||'<div class="zi">（空）</div>';});}
function bAdd(L,zone,t){W.boards[L][zone].push(zone==='z1'?{t:t,d:false}:t);if(AB===L)renderSide();}
function bDone(L,i){if(W.boards[L].z1[i])W.boards[L].z1[i].d=true;if(AB===L)renderSide();}
function renderIL(){var h='';for(var i=0;i<W.ledger.length;i++){var r=W.ledger[i];
  var sc=r.st==='完成'?'#166534':(r.st==='执行中'?'#92400e':'#374151');
  h+='<tr><td>'+r.n+'</td><td>'+r.line+'</td><td>'+r.src+'</td><td>'+r.t+'</td><td style="color:'+sc+'">'+r.st+'</td></tr>';}
 el('wzIL').innerHTML=h||'<tr><td colspan="5" style="color:#9ca3af">（暂无指令）</td></tr>';}
function ilAdd(n,line,src,t){W.ledger.push({n:n,line:line,src:src,t:t,st:'已下发'});renderIL();}
function ilSt(n,st){for(var i=0;i<W.ledger.length;i++){if(W.ledger[i].n===n)W.ledger[i].st=st;}renderIL();}
function renderRec(){var h='';for(var i=0;i<W.rec.length;i++){h+='<div class="zi'+(i===0?' flash':'')+'">📌 '+W.rec[i]+'</div>';}
 el('wzRec').innerHTML=h||'<div class="zi">（空）</div>';}
function recAdd(t){W.rec.unshift(t);renderRec();}
function pSt(L,batch,st){W.prog[L].batch=batch;W.prog[L].st=st;if(AB===L)renderSide();}
function renderTree(){var h='';for(var i=0;i<W.tree.length;i++){h+='<div class="zi'+(i===W.tree.length-1?' flash':'')+'">'+W.tree[i]+'</div>';}
 el('wzTree').innerHTML=h||'<div class="zi">（DC-1 批准后生长）</div>';}
function treeAdd(t){W.tree.push(t);renderTree();}
function logAdd(t){W.log.unshift(t);var h='';for(var i=0;i<W.log.length;i++){h+='<div>· '+W.log[i]+'</div>';}el('wzLog').innerHTML=h;}
function setNote(html){el('wzNote').innerHTML=html;}
function seq(steps,done){lock(true);cmpLock='watch';composerOn=false;syncCmp();var i=0;(function nx(){if(i>=steps.length){lock(false);if(done)done();return;}
 var d=steps[i][0],f=steps[i][1];i++;setTimeout(function(){try{f();}catch(e){console.error("[seq step error]",e&&e.message);} nx();},d);})();}
function setComposer(queue,onDone,ph){Q=queue.slice();ONSEND=onDone||null;cmpLock=null;composerOn=true;syncCmp();
 el('wzInput').value=Q.length?Q[0]:'';el('wzInput').placeholder=ph||'输入后点发送（可先编辑）';
 el('wzCmp').classList.remove('off');}
function fillInput(t){el('wzInput').value=t;el('wzInput').focus();}
function sendCurrent(){var t=el('wzInput').value.replace(/^\s+|\s+$/g,'');if(!t)return;
 say(AW,'u',t.replace(/</g,'&lt;'));
 Q.shift();
 if(Q.length){el('wzInput').value=Q[0];}
 else{el('wzInput').value='';var f=ONSEND;ONSEND=null;if(f)f(t);}}
function mkBtn(lab,fn,cls){var b=document.createElement('button');b.className='btn '+(cls||'btn-p');b.innerHTML=lab;b.addEventListener('click',function(){try{fn();}catch(e){console.error(e);}b.disabled=true;b.style.opacity=.5;var r=b.innerHTML.replace(/（已执行）$/,'');b.innerHTML=r+'（已执行）';});return b;}
function mkLab(t){var d=document.createElement('div');d.className='lab';d.innerHTML=t;return d;}

var FILES_BY_STEP=[
['SKILL.md'],
['references/规模适配规范.md'],
['references/项目协作约定.md','references/决策与台账规范.md'],
['assets/契约文档模板.md','references/多会话协作规范.md'],
['assets/启动卡模板.md','assets/环境与工具链记录模板.md'],
['assets/启动卡模板.md','assets/指令台账模板.md'],
['references/多会话协作规范.md','assets/环境与工具链记录模板.md'],
['assets/兜底心跳提示词模板.md','assets/watch_board.py'],
['references/决策与台账规范.md'],
['references/多会话协作规范.md'],
['references/验收报告规范.md'],
['assets/复盘报告模板.md','references/信息记录规范.md']];

var STEPS=[
{t:'第 1 步 · 开工',sub:'点一个模板填入输入框（可编辑），点"发送"',note:'第一句话只说"做什么"（现象、范围、期望）——怎么组织流程由规程引导，第 2 步你会看到它如何接手。',
 enter:function(){switchTab('ctrl');if(!W.chat.ctrl.length)W.chat.ctrl.push({who:'a',txt:'（workteam 技能已加载）我是总控。说说你要做什么——一句话就行，不用背流程。'});renderChat();},
 act:function(box){
  var T1='demo 系统有几处要修：后端 greet 接口跑起来不对，小程序页面和两边文档也有些小毛病，修完给我列个清单，然后整体联调一下。';
  function judge(t){var f=el('s1fb');
   if(t.indexOf('弄好一点')>=0){f.className='fb show no';f.innerHTML='❌ 太含糊：没法验收，AI 只能反问十几轮或自作主张。试试推荐模板。';miss();}
   else if(t.indexOf('按迭代档开工')>=0){f.className='fb show no';f.innerHTML='❌ 把流程喂给它了：你替它做了定档决策。需求只说做什么。';miss();}
   else{seq([[500,function(){say('ctrl','a','收到。先问四件事：<br>① 验收标准是什么？② 涉及哪些项目/仓库？③ 有外部依赖吗（设备/账号）？④ 期望时间窗？')}],[500,function(){solve()}]]);}}
  box.appendChild(mkLab('点一个模板填入输入框（可编辑），再点"发送"：'));
  [[T1,'✅ 推荐写法'],['帮我把 demo 系统弄好一点。','含糊'],['按迭代档开工：开三条线，先建留言板和台账，然后给我启动卡……','把流程喂给它']].forEach(function(c){
   var b=document.createElement('button');b.className='qchip';b.innerHTML=c[1];b.title=c[0];
   b.addEventListener('click',function(){fillInput(c[0]);var f=el('s1fb');f.className='fb';});box.appendChild(b);});
  var fb=document.createElement('div');fb.id='s1fb';fb.className='fb';box.appendChild(fb);
  setComposer([T1],judge);}},
{t:'第 2 步 · 四问与定档',sub:'一次性答复四问（模板已预置），再从定档提案中选一档',note:'决策的标准形态：总控给选项＋理由＋推荐强度，你只做选择（《决策与台账规范》）。',
 enter:function(){switchTab('ctrl');},
 act:function(box){box.appendChild(mkLab('一次性答复四问（输入框已预置合并模板，可编辑后发送）：'));
  setComposer(['四件事一并答复：① 验收＝命令输出正确＋文档逐项修复＋给我改动清单；② 涉及＝后端 app 项目＋小程序前端项目两个仓库；③ 外部依赖＝无；④ 时间窗＝本周内。'],function(){
   seq([[400,function(){say('ctrl','a','四问已收齐。按当前事实给出三档——<b>请点选</b>：')}],[500,function(){
    ask('ctrl','',[
     {t:'单点档',s:'★ 不推荐',k:'1',why:'单一会话串行——跨两项目＋联调＋你不想盯细节，全不满足',noMsg:'单点档=不开第二个会话。这里的诉求（并行、联调、代盯）一条都不满足。'},
     {t:'批量档',s:'★★ 备选',k:'2',why:'能排队干活，但没有总控——多线协调要你亲自盯',noMsg:'批量档适合单仓一批小活、人自己盯。这里需要总控代盯，就高不就低。'},
     {t:'迭代档',s:'★★★ 推荐',k:'3',why:'两项目并行＋联调单开一线＋总控代盯，匹配全部事实',okMsg:'选定迭代档。总控接着出拆线方案（下一步）。',follow:[[400,function(){say('ctrl','a','<b>定档：迭代档</b>。接下来出拆线方案。')}]]}],'3');}]]);});}},
{t:'第 3 步 · 拆线方案',sub:'总控在对话里呈两案（含推荐强度），你点选一个＝DC-1',note:'拆线=总控提案＋你的批准关卡；批准记 DC 编号入台账，未批准不动手。批准后右侧「迭代目录」实时生长——这就是总控 T0 的产出。',
 enter:function(){switchTab('ctrl');if(!W.flags.s3){W.flags.s3=1;ask('ctrl','<b>拆线方案（DC-1 待批）</b>——请点选一个方案：',[
   {t:'方案一 · 按仓库机械切 4 线',s:'★',k:'A',why:'线A后端码/线B前端码/线C文档/线D联调（各线各联调各的）',noMsg:'文档独立成线缺上下文；"各联调各的"会抢环境互相踩——真实项目踩过的坑。'},
   {t:'方案二 · 职能内聚 3 线',s:'★★★ 推荐',k:'B',why:'线A后端(含后端文档)/线B前端(含前端文档)/线E联调（条件齐备再开）',okMsg:'DC-1 已批准，开始脚手架（见右侧「迭代目录」生长）。',
    follow:[[400,function(){say('ctrl','a','开始脚手架（总控 T0）——右侧「迭代目录」实时生长：')}],
     [400,function(){treeAdd('📁 .sprints/demo_修复/（迭代目录）')}],
     [300,function(){treeAdd('　├─ 需求说明.md（阶段一·已验收）')}],
     [300,function(){treeAdd('　├─ 线框图.html（阶段一·已验收）')}],
     [300,function(){treeAdd('　├─ 技术方案.md（阶段二·已验收）')}],
     [300,function(){treeAdd('　├─ 实施计划.md（总控 T0 产出）')}],
     [300,function(){treeAdd('　├─ 实施记录.md（总控 T0 产出·总控独写）')}],
     [300,function(){treeAdd('　├─ 项目协作约定.md（总控 T0 产出）')}],
     [300,function(){treeAdd('　├─ 指令台账.md（总控 T0 产出·追加式）')}],
     [300,function(){treeAdd('　├─ 总控-心跳日志.md（兜底心跳流水·追加式·总控专属）')}],
     [300,function(){treeAdd('　├─ tmp/（守望基线/判活心跳·总控专属）')}],
     [300,function(){treeAdd('　├─ 📁 lines/')}],
     [300,function(){treeAdd('　│　├─ 初始提示词-线A.md（总控 T0 产出）')}],
     [300,function(){treeAdd('　│　├─ 初始提示词-线B.md（总控 T0 产出）')}],
     [300,function(){treeAdd('　│　├─ 线A-server.md（线A 进度文件·线独写）')}],
     [300,function(){treeAdd('　│　├─ 线B-web.md（线B 进度文件·线独写）')}],
     [300,function(){treeAdd('　│　└─ 交接-线Ato全线.md（跨线共享·线A独写）')}],
     [400,function(){say('ctrl','n','脚手架完成：迭代目录、各线进度文件、指令台账、管控台账已就绪（见右侧面板）')}],
     [400,function(){logAdd('守望已部署（总控常驻盯全部留言板）');recAdd('[总控] 脚手架 T0 完成：迭代目录/各线进度文件/指令台账/管控台账就绪')}],
     [400,function(){pSt('A','—','待开批')}],[300,function(){pSt('B','—','待开批')}],[300,function(){pSt('E','—','等联调条件')}],
     [300,function(){logAdd('DC-1：拆线方案二批准；脚手架 T0 完成')}]]}],'B');}},
 act:function(box){box.appendChild(mkLab('在上方对话气泡中点选方案（选错会说明原因，可换一个再选）'));}},
{t:'第 4 步 · 契约先行',sub:'产出与自检由总控自动完成，你只在冻结点批准',note:'可 mock 三条件：能造样例、能校验、能处理异常；消息型接口的码表＝它的"出入参＋错误码"，缺了就是没契约——这层把关是总控自检，不考你。',
 enter:function(){switchTab('ctrl');if(!W.flags.s4){W.flags.s4=1;}},
 act:function(box){
  box.appendChild(mkLab('总控将产出跨线契约并自检：'));
  box.appendChild(mkBtn('▶ 快进：总控产出契约并自检',function(){
   cmpLock='watch';composerOn=false;syncCmp();
   seq([
    [500,function(){say('ctrl','n','契约草稿 v1 已产出（greet 接口：路径/出入参/错误码/示例…逐项检查中）')}],
    [800,function(){say('ctrl','n','⚠ 自检发现：事件消息型接口缺<b>码表/字段字典</b>——不满足可 mock 三条件，已打回补齐')}],
    [700,function(){say('ctrl','a','契约 v2 已补码表（事件类型 80009=跌倒 等）。<b>申请冻结基线版（DC-2）</b>。')}],
    [400,function(){var b2=mkBtn('✅ 批准冻结（DC-2）',function(){b2.remove();seq([
     [400,function(){say('ctrl','n','契约已冻结（DC-2），已下发两线作为开发与 mock 自测依据')}],
     [300,function(){logAdd('DC-2：契约 v2 冻结');recAdd('[总控] DC-2：契约 v2 冻结（下发两线为开发与 mock 自测依据）')}],
     [300,function(){solve()}]]);});el('wzAct').appendChild(b2);}]]
   );
  }));
 }
},
{t:'第 5 步 · 开批线A（T0 环境就绪批）',sub:'复制任务卡→发送给线A→批准计划→完整走一遍 T0',note:'v1 开批贴卡由你手动完成；线级 T0＝环境就绪（工具链＋项目跑通＋《环境与工具链.md》＝本线的项目记忆），完成前不写功能代码——几乎每个迭代必做，所以完整演练。',
 enter:function(){switchTab('ctrl');if(!W.flags.s5){W.flags.s5=1;ilAdd('I-1','线A','总控','T0 环境就绪批（装依赖→构建→冒烟→产出《环境与工具链.md》）');say('ctrl','a','<b>时机表</b>：<table><tr><th>顺序</th><th>批</th><th>时机</th></tr><tr><td>1</td><td>线A · 环境就绪批</td><td><b>现在开</b></td></tr><tr><td>2</td><td>线B · 环境就绪批</td><td>现在开（可并行）</td></tr><tr><td>3</td><td>线E · 联调批</td><td>暂不发（等就绪清单全绿）</td></tr></table>任务卡已生成，点"复制"填入输入框，切到对应窗口发送即开批。');}},
 cardMsg:function(){say('ctrl','a','<b>各线指令</b>：<pre class="cardblk">线A 批#1 环境就绪任务卡：装依赖 → 构建通过 → 冒烟（node scripts/greet.js 张三 输出正确）→ 产出 环境与工具链.md；完成前不做功能开发，批毕按交付清单收口。</pre>（下方按钮可一键填入线A窗口输入框）');},
 act:function(box){
  box.appendChild(mkLab('开线A批（复制 → 在线A窗口的输入框点发送）：'));
  box.appendChild(mkBtn('📋 复制线A任务卡 → 切到线A窗口',function(){
   switchTab('A');
   setComposer(['【任务卡】迭代=demo_修复；线A 批#1 环境就绪：装依赖→构建通过→冒烟（node scripts/greet.js 张三 输出正确）→产出 环境与工具链.md；完成前不做功能开发，批毕按交付清单收口。'],function(){
    seq([
     [600,function(){say('A','a','已读线档案（新线，档案为空）。<b>本批计划</b>：T0-1 装依赖；T0-2 构建；T0-3 冒烟验证；T0-4 产出《环境与工具链.md》。请批准。')}],
     [400,function(){var b2=mkBtn('✅ 批准本批计划',function(){b2.remove();seq([
      [400,function(){say('A','a','开始 T0。先在「线反馈」报到：')}],
      [400,function(){bAdd('A','z2','开始 批#1（T0 环境就绪），15:02');ilSt('I-1','执行中');pSt('A','批#1 环境就绪（会话#1）','执行中')}],
      [500,function(){say('A','a','装依赖（后台执行＋wait_for 轮询结束标志，不傻等）…')}],
      [600,function(){say('A','a','依赖装毕、构建通过；冒烟 node scripts/greet.js 张三 → 输出 你好, 张三！ ✓')}],
      [500,function(){bAdd('A','z2','批#1 回执：T0 完成，已产出《环境与工具链.md》（工具链/运行命令/冒烟/踩坑）');treeAdd('　├─ lines/线A-环境与工具链.md（线A 项目记忆）')}],
      [600,function(){say('ctrl','n','线A T0 三对齐核验通过——环境记录归档为<b>项目记忆</b>，后续每批新会话直接读它')}],
      [400,function(){pSt('A','批#1 环境就绪（会话#1）','已完成·环境就绪✓');ilSt('I-1','完成')}],
      [300,function(){logAdd('线A T0 完成，环境记录归档')}],
      [300,function(){solve()}]]);});el('wzAct').appendChild(b2);}]]
    );
   });
  }));
 }
},
{t:'第 6 步 · 开批线B（并行）',sub:'同样操作开线B——此刻线A正在执行，多线并行',note:'批生命期＝会话生命期；两条线的会话与板完全独立互不干扰——线＝责任域＋档案，会话＝临时工，这就是"线≠会话"。',
 enter:function(){switchTab('ctrl');if(!W.flags.s6){W.flags.s6=1;ilAdd('I-2','线B','总控','T0 环境就绪＋前端工程装载');}},
 act:function(box){
  box.appendChild(mkLab('开线B批（注意台账里线A仍为执行中）：'));
  box.appendChild(mkBtn('📋 复制线B任务卡 → 切到线B窗口',function(){
   switchTab('B');
   setComposer(['【任务卡】迭代=demo_修复；线B 批#1 环境就绪＋前端工程装载：装依赖→构建通过→冒烟验证→产出 环境与工具链.md；完成前不做功能开发。'],function(){
    say('ctrl','a','<b>各线指令</b>：<pre class="cardblk">线B 批#1 环境就绪＋前端工程装载任务卡：装依赖→构建通过→冒烟验证→产出 环境与工具链.md；完成前不做功能开发。</pre>');
    seq([
     [600,function(){say('B','a','<b>本批计划</b>：T0 环境＋依赖装载＋冒烟验证＋环境记录。请批准。')}],
     [400,function(){var b2=mkBtn('✅ 批准本批计划',function(){b2.remove();seq([
      [400,function(){say('B','a','开始 T0（过程与线A 同构，后台执行）。')}],
      [400,function(){bAdd('B','z2','开始 批#1（T0），15:05');ilSt('I-2','执行中');pSt('B','批#1 环境就绪＋前端工程装载（会话#1）','执行中')}],
      [700,function(){bAdd('B','z2','批#1 回执：T0 完成，环境记录已产出');treeAdd('　├─ lines/线B-环境与工具链.md（线B 项目记忆）')}],
      [500,function(){say('ctrl','n','线B T0 核验通过——两线环境就绪，功能批待时机表派发')}],
      [400,function(){pSt('B','批#1 环境就绪＋前端工程装载（会话#1）','已完成·环境就绪✓');ilSt('I-2','完成')}],
      [300,function(){logAdd('线B T0 完成（与线A并行）')}],
      [300,function(){solve()}]]);});el('wzAct').appendChild(b2);}]]
    );
   });
  }));
 }
},
{t:'第 7 步 · 执行与回执核验（功能批）',sub:'总控自动核验回执，你旁观播报即可',note:'回执核验是总控分内的事：逐条对实测证据；"应该没问题"式美化回执会被打回。人类的质量动作只在第 11 步复验交付。',
 enter:function(){switchTab('ctrl');},
 act:function(box){box.appendChild(mkLab('快进两线功能批执行与总控核验：'));
  box.appendChild(mkBtn('▶ 快进执行与核验',function(){
   ilAdd('I-3','线A','总控','功能批：greet 参数错位修复');ilAdd('I-4','线B','总控','功能批：页面文案修复');pSt('A','功能批（新会话）','执行中');pSt('B','功能批（新会话）','执行中');
   seq([
   [400,function(){say('ctrl','n','两线功能批（greet 修复/页面文案）已按环境记录开批——贴卡流程同第 5/6 步，略。快进：')}],
   [400,function(){switchTab('A')}],[300,function(){bAdd('A','z1','（批内任务）修复 greet 参数错位并自测')}],
   [500,function(){bDone('A',0)}],[300,function(){bAdd('A','z2','#1 回执：实测输出 你好, 张三！（附完整输出与 diff）')}],
   [500,function(){say('A','a','#1 完成：实测输出正确，证据已附。')}],
   [500,function(){switchTab('B')}],[300,function(){bAdd('B','z2','开始 #3（页面文案批内任务），15:40')}],
   [600,function(){say('B','a','#3 完成，应该没问题了，我看着输出是正常的。')}],
   [600,function(){switchTab('ctrl')}],[300,function(){say('ctrl','n','核验：线A 回执证据齐备 → <b>通过</b>。')}],
   [600,function(){say('ctrl','n','⚠ 线B 回执"应该没问题"无实测证据——<b>打回重交</b>。')}],
   [500,function(){switchTab('B');say('B','a','重交：实测输出＋diff＋截图；遗留：深色模式图标未适配（已登记待确认#1）。');bAdd('B','z3','待确认#1：深色模式图标未适配（等 QB 流程）')}],
   [700,function(){switchTab('ctrl');say('ctrl','n','线B 重交合格 → 通过（待确认#1 转 QB 流程，见第 9 步）。')}],
   [300,function(){ilSt('I-3','完成');ilSt('I-4','完成');logAdd('两线首批执行完毕；线B 回执曾被打回重交')}],[300,function(){solve()}]]);}));}},
{t:'第 8 步 · 异常事件',sub:'守望死亡→兜底自动重启→漏写补处理，全程自动',note:'兜底重启<b>不删基线</b>：守望启动自检要与旧基线比对，才能把死亡窗口漏掉的写入报出来；删了就把漏报烘进新基线。详见附录一·规则演示。',
 enter:function(){switchTab('ctrl');},
 act:function(box){box.appendChild(mkLab('快进异常事件（全自动，你只收通报）：'));
  box.appendChild(mkBtn('▶ 快进异常',function(){seq([
   [400,function(){say('ctrl','n','⚠ 守望心跳停止（模拟：本机休眠 40 分钟）')}],
   [700,function(){say('ctrl','n','兜底任务已自动重启守望（<b>未删基线</b>）')}],
   [700,function(){say('ctrl','n','守望自检发现休眠期间板上新增 1 条写入（#2 文档批量修复）→ 已唤醒相应会话补处理')}],
   [500,function(){bAdd('A','z1','（休眠期写入）#2 文档批量修复：README+docs 共 6 处')}],
   [400,function(){bAdd('A','z2','开始 #2，16:20')}],
   [500,function(){say('A','a','#2 回执：6 处文档修复完成（附 diff 清单）。')}],
   [500,function(){say('ctrl','n','#2 核验通过。')}],
   [300,function(){logAdd('兜底自愈一次；漏写 #2 已补处理')}],[300,function(){solve()}]]);}));}},
{t:'第 9 步 · QB 决策',sub:'待确认到你这里——在对话气泡中点选，总控已备好选项＋理由＋推荐强度',note:'QA（查得到依据）总控自答；QB（需要拍板）才升级到你；决策落台账成 DC 编号。',
 enter:function(){switchTab('ctrl');if(!W.flags.s9){W.flags.s9=1;bAdd('B','z3','QB-1：greet 返回结构二选一（等人类批复）');ask('ctrl','<b>待确认 QB-1（来自线B）</b>：greet 返回结构二选一——请点选：',[
  {t:'A · 对象式 {code, data, msg}',s:'★★★ 推荐',k:'A',why:'与平台其余接口一致，前端可统一处理',okMsg:'已按 DC-3 下发线B。',
   follow:[[400,function(){say('ctrl','a','已按 <b>DC-3</b> 批复并下发线B。')}],[400,function(){bAdd('B','z1','（DC-3）#4 返回结构改对象式');bAdd('B','z3','QB-1 已批复（DC-3）✓')}],[300,function(){logAdd('DC-3：QB-1 批复（对象式）');recAdd('[线B] DC-3：QB-1 批复（返回结构＝对象式）')}]]},
  {t:'B · 平铺式',s:'★',k:'B',why:'少一层嵌套，但破坏全站一致性',noMsg:'省一层嵌套的代价是全站两套解析——总控不推荐即有理由。'}],'A');}},
 act:function(box){box.appendChild(mkLab('在上方对话气泡中点选批复（选错会说明原因，可换）'));}},
{t:'第 10 步 · 联调批',sub:'总控自动核就绪清单；你开线E批；联调期间其它线冻结',note:'联调条件＝契约自测通过＋部署物齐备；冻结窗口＝联调批独占环境，防脏读互踩；联调缺陷回流对应线修复。',
 enter:function(){switchTab('ctrl');},
 act:function(box){box.appendChild(mkLab('① 让总控核对就绪清单：'));
  box.appendChild(mkBtn('▶ 总控核对联调就绪清单',function(){seq([
   [500,function(){say('ctrl','n','就绪清单核对：契约自测 线A✓ 线B✓；部署包 A✓ B✓；部署/安装脚本 ✓ —— <b>全绿</b>')}],
   [400,function(){ilAdd('I-5','线E','总控','联调批：按契约 6 场景逐一验证')}],
   [600,function(){say('ctrl','a','时机表更新：<b>线E 联调批【现在开】</b>；联调期间线A/B 冻结（缺陷回流除外）。<b>各线指令</b>：<pre class="cardblk">线E 批#1 整体联调任务卡：按契约对 6 个场景逐一验证；缺陷按归属回流；期间其它线冻结。</pre>')}],
   [400,function(){var b2=mkBtn('📋 复制线E任务卡 → 切到线E窗口',function(){b2.remove();switchTab('E');
     setComposer(['【任务卡】迭代=demo_修复；线E 批#1 整体联调：按契约对 6 个场景逐一验证；缺陷按归属回流；期间其它线冻结。'],function(){
      seq([[600,function(){say('E','a','<b>联调计划</b>：场景1-6 逐项执行＋记录。请批准。')}],[400,function(){var b3=mkBtn('✅ 批准联调计划',function(){b3.remove();seq([
       [400,function(){say('E','a','联调中…场景 1-3 通过。')}],
       [600,function(){switchTab('ctrl');say('ctrl','n','联调发现 1 缺陷：欢迎页时区显示（归属线B）→ 已回流')}],
       [600,function(){say('ctrl','n','线B 修复批（新会话）完成——冻结期内仅放行该缺陷修复')}],
       [500,function(){pSt('E','批#1 整体联调（会话#1）','执行中·A/B 冻结');recAdd('[线E] 联调批开启（线A/B 冻结）');treeAdd('　├─ lines/线E-联调.md（线E 进度文件·线独写）')}],
       [500,function(){switchTab('E');say('E','a','场景 4-6 复验通过。<b>联调结论：全部绿。</b>')}],
       [300,function(){ilSt('I-5','完成');logAdd('线E 联调通过；期间 A/B 冻结一次')}],[300,function(){solve()}]]);});el('wzAct').appendChild(b3);}]]);});});el('wzAct').appendChild(b2);}]]);}));}},
{t:'第 11 步 · 复验交付',sub:'总控呈交付清单，你查验后通过——人类唯一的质量动作',note:'复验看交付物本身；三对齐与证据核验总控已做（第 7/12 步）。',
 enter:function(){switchTab('ctrl');if(!W.flags.s11){W.flags.s11=1;treeAdd('　├─ .docs/greet参数错位排查报告_2026xxxx.md（线A·单点档产物）');say('ctrl','a','<b>交付清单</b>：① greet 修复（实测输出＋diff）② 6 处文档修复 ③ 排查报告（.docs/）④ 契约 v2 冻结版 ⑤ 环境与工具链.md（两线）。请复验。');}},
 act:function(box){box.appendChild(mkLab('复验：'));
  var ok=mkBtn('✅ 复验通过',function(){seq([[300,function(){say('ctrl','a','收到。进入收尾（下一步）。')}],[300,function(){solve()}]]);});
  var no=mkBtn('↩ 打回',function(){var f=el('s11fb');f.className='fb show no';f.innerHTML='❌ 本清单已三对齐且证据齐备——真实场景发现问题当然打回，此处预置通过。';miss();},'btn-o');
  box.appendChild(ok);box.appendChild(no);box.appendChild(document.createTextNode(' '));
  var f=document.createElement('div');f.id='s11fb';f.className='fb';box.appendChild(f);}},
{t:'第 12 步 · 收尾',sub:'停守望/删兜底/tmp清点/复盘——总控自动执行',note:'收尾序列：一致性核对→验收→复盘（沉淀最终态规则）→销毁监控→tmp 清点→台账归档。',
 enter:function(){switchTab('ctrl');},
 act:function(box){box.appendChild(mkLab('快进收尾（总控自动）：'));
  box.appendChild(mkBtn('▶ 快进收尾',function(){seq([
   [400,function(){say('ctrl','n','一致性核对：代码/文档/台账/板 双向一致 ✓（含报告头部日期）')}],
   [500,function(){say('ctrl','n','停守望后台任务 ✓；删除定时兜底 ✓')}],
   [500,function(){treeAdd('　├─ 验收报告/验收报告_{{时间戳}}/');treeAdd('　└─ 复盘报告/复盘报告_{{时间戳}}/')}],
   [500,function(){say('ctrl','n','tmp 清点：留档 2 项已挪移，其余删除 ✓')}],
   [500,function(){say('ctrl','n','复盘已存：复盘报告（含最终态规则沉淀检查）✓')}],
   [400,function(){recAdd('[总控] 终态：收尾完成（监控清零/tmp 清点/复盘交付）')}],
   [300,function(){logAdd('收尾完成：监控清零、tmp 清点、复盘交付')}],[300,function(){solve()}]]);}));}},
{t:'通关！',sub:'你完成了人类角色的全部动作',note:'回顾：你只做了四类事——说话、决策（DC/QB）、开批贴卡、复验；其余（指令生成、核验、自愈、收尾）全部由总控承担。真实开工：对会话说 /workteam。',
 enter:function(){switchTab('ctrl');},
 act:function(box){var right=12-W.wrong.length;
  var rec='';for(var i=0;i<12;i++){rec+='<li>'+(W.wrong.indexOf(i)<0?'<span class="ok">✓</span> ':'<span class="err">✗</span> ')+STEPS[i].t+'</li>';}
  box.innerHTML='<div style="text-align:center"><div style="font-size:46px">🏅</div><b style="font-size:17px">你完成了人类角色的全部动作</b><br><span style="font-size:13px;color:var(--mut)">首次正确 '+right+'/12 ——答错不是失败，是那一步的后果你已亲眼见过。</span></div><ul style="font-size:13px;margin:10px 0 0 18px;line-height:1.9">'+rec+'</ul>';
  box.appendChild(mkBtn('↺ 再来一轮',function(){if(confirm('清空进度重新开始？')){localStorage.removeItem(WZ_KEY);W=freshW();SNAPS=[];FC={};render();}},'btn-o'));
  el('wzNext').style.display='none';}}
];
var replaying=false,frontierDone=false,INIT=null;
function maxSolved(){var m=-1;for(var k in W.solved){if(W.solved[k]&&+k>m)m=+k;}return m;}
function render(){var s=STEPS[W.i];
 el('wzBar').style.width=(W.i/(STEPS.length-1)*100)+'%';
 el('wzLab').textContent=(W.i>=12?'通关':'第 '+(W.i+1)+' / 12 步');
 el('wzPrev').disabled=W.i===0;
 el('wzNext').style.display='';
 el('wzNext').disabled=!W.solved[W.i];
 setNote(s.note);
 BUSY=false;
 composerOn=false;
 frontierDone=W.solved[W.i]&&!replaying&&W.i===maxSolved();
 var box=el('wzAct');box.innerHTML='';
 cmpLock=null;
 var isFrontier=W.i<12&&W.solved[W.i]&&!replaying&&W.i===maxSolved();
 if(isFrontier){el('wzCmp').classList.remove('off');el('wzCmp').classList.add('done');
  box.innerHTML='<div class="lab">✓ 本步已完成（可"下一步"，或"上一步"回看状态）</div>';}
 else{el('wzCmp').classList.remove('done');if(!W.solved[W.i]&&!composerOn&&!cmpLock){cmpLock='idle';syncCmp();}s.act(box);}
 if(!W.solved[W.i]&&!composerOn&&!cmpLock){cmpLock='idle';syncCmp();}
 var fs=FILES_BY_STEP[W.i];
 if(fs){var fd=document.createElement('div');fd.className='wz-files';
  fd.innerHTML='📁 本环节用到（点击查看作用）：'+fs.map(function(f){return '<span class="fchip" data-f="'+f+'">'+f+'</span>';}).join('');box.appendChild(fd);}
 s.enter();if(INIT===null)INIT=snapNow();renderChat();renderSide();syncCmp();
 var h='';for(var i=0;i<W.log.length;i++){h+='<div>· '+W.log[i]+'</div>';}el('wzLog').innerHTML=h||'<div style="color:#9ca3af">（暂无日志）</div>';}
el('wzTabs').addEventListener('click',function(e){var b=e.target.closest('.wtab');if(b)switchTab(b.getAttribute('data-w'));});
el('wzBTabs').addEventListener('click',function(e){var b=e.target.closest('.btab');if(b)switchBoard(b.getAttribute('data-b'));});
el('wzSend').addEventListener('click',sendCurrent);
el('wzInput').addEventListener('keydown',function(e){if((e.ctrlKey||e.altKey)&&e.key==='Enter'){e.preventDefault();sendCurrent();}});
function scrollWin(){el('wzWin').scrollIntoView({block:'start'});}
el('wzPrev').addEventListener('click',function(){if(W.i>0&&!BUSY){W.i--;replaying=true;var s=SNAPS[W.i-1]||INIT;if(s)applySnap(s);FC={};persist();render();scrollWin();}});
el('wzNext').addEventListener('click',function(){if(!W.solved[W.i]||BUSY)return;if(W.i<STEPS.length-1){W.i++;replaying=false;FC={};persist();render();scrollWin();}});
el('wzReset').addEventListener('click',function(){if(!BUSY&&confirm('清空进度重新开始？')){localStorage.removeItem(WZ_KEY);W=freshW();SNAPS=[];FC={};render();}});
(function(){try{var o=JSON.parse(localStorage.getItem(WZ_KEY));if(o&&o.W){W=freshW();W.i=o.W.i;W.wrong=o.W.wrong;W.solved=o.W.solved;SNAPS=o.SNAPS||[];if(SNAPS[W.i-1])applySnap(SNAPS[W.i-1]);}}catch(e){}render();})();

/* ============ 工作流程·档位切换 ============ */
var TIER_DESC={1:'单点档——不用开第二个会话：问四句、直接干、出一份排查报告收尾。流程只涉环节 0 与 7。',
2:'批量档——一个工作会话加留言板排队，你自己盯：涉及环节 0、2（简化：工作目录＋留言板，无管控台账）、4、5、7。',
3:'迭代档——总控替你盯、多线并行、联调单开一条线：全部八个环节（本页主线）。'};
document.querySelectorAll('.tsel').forEach(function(b){b.addEventListener('click',function(){
 document.querySelectorAll('.tsel').forEach(function(x){x.classList.remove('on')});b.classList.add('on');
 var t=b.getAttribute('data-t');
 document.querySelectorAll('#flow .fi').forEach(function(it){it.style.display=(it.getAttribute('data-t').indexOf(t)>=0)?'':'none';});
 document.getElementById('tierDesc').textContent=TIER_DESC[t];});});

/* 锚点导航高亮 */
var secs=[].slice.call(document.querySelectorAll('section[id]'));
window.addEventListener('scroll',function(){var y=scrollY+80,cur='';secs.forEach(function(s){if(s.offsetTop<=y)cur=s.id;});
 document.querySelectorAll('nav a.nl').forEach(function(a){a.classList.toggle('cur',a.getAttribute('href')==='#'+cur);});});
