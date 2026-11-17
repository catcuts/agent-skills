/* ============ 架构图节点信息 ============ */
var ARCH_INFO={
 human:{t:'👤 人类（你）',d:'决策者与验收者。批复方案与决策（DC）、复验证据、外部协调、按总控给的时机表往各线发消息。你不写代码、不盯过程——只出现在决策层。'},
 ctrl:{t:'🧭 管控会话（总控）',d:'一个专门的 AI 会话：拆活派活、核验各线回执（不听一面之词）、跨线分流缺陷、维护管控台账。它不参与任何一条线的开发本体。每次回复末尾带「各线指令」区和发送时机表。'},
 lineA:{t:'线A·开发（批工作会话）',d:'守着项目1的责任域；干活的是按批分配的临时 AI 会话（v1 由你手动开批贴任务卡）：读线档案→干活→批毕交付即终。线按"仓库×依赖边界×职能内聚"划分，前后端常归同一条线。'},
 lineB:{t:'线B·开发（批工作会话）',d:'与线A同构，守项目2。多线并行消解单人串行切换——这是整套规程生产力的主要来源。'},
 lineE:{t:'线E·联调（批工作会话）',d:'集成验证专门线：等所有开发线"契约自测通过+部署物齐备"才开联调批；联调期间其它线代码冻结，防脏读互踩。联调发现的缺陷回流对应线修复。'},
 sub:{t:'一次性子代理',d:'环境部署、批量构建这类跑完即弃的辅助任务才用子代理；不可向人类提问，失败即返回问题报告。它不能替代多线形态——批工作会话才有仓库上下文、人类可直连、状态可外置。'},
 board:{t:'留言板 ×N',d:'每线一块 markdown 文件，三区：管控指令（执行后标[已执行]）/线反馈（一轮只写一次）/待确认（QA自答、QB升级人类）。跨会话唯一通信通道——消息不会丢只会慢。'},
 ledger:{t:'管控台账（管控.md）',d:'总控的状态外置文档：各线状态与在途指令、监控配置、人类任务清单、待确认汇总、日志。上下文重续从这里恢复，是规程的生命线。'},
 watch:{t:'守望 + 定时兜底',d:'守望=盯留言板的后台脚本，板一变就唤醒所属会话；兜底=定时任务检查心跳，守望死了自动重启（不删基线，漏掉的板变化立即报出）。'},
 contract:{t:'契约文档',d:'拆线批准后、开工前先定：协议（认证/时序/码表）+接口（按交互形态分型）。完备性判据=可 mock 三条件：能造样例、能校验、能处理异常。各线基于契约隔离开发。'}
};
(function(){var cur=null;document.querySelectorAll('#archSvg .node').forEach(function(n){
 n.addEventListener('click',function(){document.querySelectorAll('#archSvg .node').forEach(function(m){m.classList.remove('sel')});
 n.classList.add('sel');var k=n.getAttribute('data-k'),i=ARCH_INFO[k];if(!i)return;
 document.getElementById('archInfo').innerHTML='<h4>'+i.t+'</h4><p>'+i.d+'</p>';});});})();

/* ============ 机制1：留言板一轮 ============ */
var MB=[{z:1,cls:'hl',txt:'#1 修复登录页错字：docs/usage.md 第14行"环镜"→"环境"，完成后标已执行',hint:'① 管控把指令写进「管控指令」区（带序号，自包含：文件、位置、改法都写全）'},
{z:2,cls:'hl',txt:'开始 #1，11:02',hint:'② 线会话接受指令，先在「线反馈」区登记"开始"——执行中状态必须板上有痕，否则管控无从得知你已开工'},
{z:1,cls:'',id:0,st:'on',hint:'③ 执行完毕，指令原地标记 [已执行]'},
{z:2,cls:'hl',txt:'#1 已完成：usage.md 改好，diff 一行',hint:'④ 轮末在「线反馈」区写反馈（一条消息只写一次），描述与实测证据一致——不美化'},
{z:0,cls:'',hint:'⑤ 收尾：一句话汇报本轮结束（守望由总控常驻部署，批会话无需理会）'},
{z:0,cls:'',hint:'⑥ 一句话汇报后本轮结束，会话回到空闲。板上的痕迹留档，谁随时来查都看得懂'}];
var mbI=-1;
function mbRender(){['mbz1','mbz2','mbz3'].forEach(function(id){document.getElementById(id).innerHTML='<div class="zi">（空）</div>'});
 var zs={1:'mbz1',2:'mbz2',3:'mbz3'};for(var j=0;j<=mbI&&j<MB.length;j++){var s=MB[j];if(!s.z)continue;
  var el=document.getElementById(zs[s.z]);if(el.firstChild&&el.firstChild.textContent==='（空）')el.innerHTML='';
  var d=document.createElement('div');d.className='zi '+(j===mbI?s.cls:'');
  d.innerHTML=(s.st?'#1 修复登录页错字…<span class="st on">已执行</span>':s.txt);el.appendChild(d);}}
document.getElementById('mbNext').addEventListener('click',function(){mbI++;
 if(mbI>=MB.length){mbI=-1;mbRender();document.getElementById('mbHint').textContent='已重置，再点重放。';document.getElementById('mbNext').textContent='▶ 推进（第 0/6 步）';return;}
 mbRender();document.getElementById('mbHint').innerHTML=MB[mbI].hint;
 document.getElementById('mbNext').textContent='▶ 推进（第 '+(mbI+1)+'/6 步）';});

/* ============ 机制2：基线双场景 ============ */
function blDraw(alive,write,restarted){var h='';for(var i=0;i<10;i++){var cls='dot'+((i>=6&&!alive)?' dead':'');if(i>=6&&alive)cls='dot';h+='<span class="'+cls+'"></span>';}
 h+='<span style="font-size:12px;color:#6b7280">　心跳…</span>';if(!alive)h+='<span class="ev">💀 守望死亡</span>';
 if(write)h+='<span class="ev">✍️ 有人写板</span>';if(restarted)h+='<span class="ev">🔄 重启守望</span>';
 document.getElementById('blTl').innerHTML=h;}
blDraw(true,false,false);
function blA(){blDraw(false,true,true);document.getElementById('blHint').innerHTML='<span class="err">❌ 场景A做法（删基线）：重启时基线被删重建，死亡窗口里那条写入被"烘进"新基线——<b>守望永远不会再报它，这条消息等于丢了</b>。</span> 场景A只适用于"自己刚写完板"的轮末重部署。';}
function blB(){blDraw(false,true,true);document.getElementById('blHint').innerHTML='<span class="ok">✅ 场景B做法（不删基线）：守望启动自检与旧基线比对，发现死亡窗口的差异——立即报告并退出，唤醒所属会话补处理。<b>消息不会丢</b>。</span> 兜底重启/疑似漏报一律用场景B。';}
document.getElementById('blBtnA').addEventListener('click',blA);
document.getElementById('blBtnB').addEventListener('click',blB);

/* ============ 机制3：好/坏回复 ============ */
var cqGood=true;
document.getElementById('cqToggle').addEventListener('click',function(){cqGood=!cqGood;
 document.getElementById('cqGood').style.display=cqGood?'':'none';
 document.getElementById('cqBad').style.display=cqGood?'none':'';
 document.getElementById('cqToggle').textContent='🔄 切换：当前显示——'+(cqGood?'好回复':'坏回复');
 document.getElementById('cqHint').textContent=cqGood?'左边：每线独立块、指令自包含、时机按发送顺序。右边：要回翻拼接、多线挤一块、时机含糊——坏回复的三宗罪。':'右边的问题：①多线挤一块没法单独复制 ②"沿用上一条"要人类回翻拼接 ③时机含糊。点切换看好回复长什么样。';});

/* ============ 机制4：联调冻结 ============ */
var fzBad=false;
document.getElementById('fzToggle').addEventListener('click',function(){fzBad=!fzBad;var b=document.getElementById('fzBox');
 if(fzBad){b.setAttribute('fill','#fee2e2');b.setAttribute('stroke','#fca5a5');
  document.getElementById('fzT1').textContent='⚠ 提前开联调：B 还在改代码';document.getElementById('fzT1').setAttribute('fill','#991b1b');
  document.getElementById('fzT2').textContent='E 读到半成品代码（脏读）、环境被两线同时踩，联调结论全部作废';document.getElementById('fzT2').setAttribute('fill','#991b1b');
  document.getElementById('fzHint').innerHTML='<span class="err">提前开的代价：脏读+互踩+返工。</span> 正确姿势：条件清单全绿才开线E，开了就冻结其它线。';}
 else{b.setAttribute('fill','#dcfce7');b.setAttribute('stroke','#86efac');
  document.getElementById('fzT1').textContent='线E·联调（冻结窗口）';document.getElementById('fzT1').setAttribute('fill','#166534');
  document.getElementById('fzT2').textContent='其它线代码冻结——联调独占环境，防脏读互踩';document.getElementById('fzT2').setAttribute('fill','#166534');
  document.getElementById('fzHint').textContent='契约先行＝先定协议/接口（能 mock、能校验、能处理异常）再开发；联调条件不齐→回流对应线补齐；联调期间其它线冻结。';}});

/* ============ 机制5：等待比赛 ============ */
var racing=false;
document.getElementById('raceBtn').addEventListener('click',function(){if(racing)return;racing=true;
 var s=document.querySelector('#pbarSleep>i'),w=document.querySelector('#pbarWait>i');
 s.style.width='0';w.style.width='0';document.getElementById('raceHint').textContent='比赛开始…（时间按比例压缩：10分钟≈6秒）';
 var st=setInterval(function(){var v=parseFloat(s.style.width||'0');s.style.width=Math.min(100,v+1.7)+'%';},100);
 setTimeout(function(){w.style.width='100%';document.getElementById('raceHint').innerHTML='<span class="ok">✅ wait_for 在第 1.5 秒命中结束标志"BUILD OK"，立即放行继续干活。</span> <span class="err">傻等的还在睡…</span>';},1500);
 setTimeout(function(){clearInterval(st);s.style.width='100%';document.getElementById('raceHint').innerHTML='<span class="ok">✅ 标志轮询：1.5 秒完成。</span> <span class="err">❌ 固定等待：600 秒才去看——白等 398 秒，期间 AI 和你都在干等。</span>';},6000);});

/* ============ 机制6：报到 ============ */
document.getElementById('gBtn').addEventListener('click',function(){var e=document.getElementById('gEv1');e.style.opacity=1;
 document.getElementById('gHint').innerHTML='<span class="ok">"开始 #1，11:02"一行登记，管控台账立即显示"在途"，兜底巡检也能对超时报警。</span> 谁也没瞎等谁。';});

/* ============ 目录导览 ============ */
var FM={'.':['workteam/','技能根目录：随仓库分发，npx skills add 即装','—','—'],
'SKILL.md':['AI 的作业手册（薄入口）','触发后 AI 读它：定档→冷启动→运行循环→异常路由→收尾。人可以不读','AI 读','多会话协作规范 全部'],
'README.md':['给人的说明书（文字版）','30 秒故事、安装、第一次对话','人读','—'],
'README.html':['给人的图解与演练场（本页）','架构图、机制演示、目录导览、通关演练；纯模拟零文件副作用','人读/人玩','—'],
'LICENSE':['MIT 许可证','开源协议','—','—'],
'package.json':['npm 包元数据','版本号在此维护；files 列表决定发布内容','维护者','—'],
'scripts/':['安装脚本目录','npm 安装/卸载时复制技能到本机技能目录','npm 生命周期','—'],
'references/':['规程权威源（10 份）','规则的唯一权威；改规程=改这里+提交','各会话读；修订走 git','—'],
'references/README措辞标准.md':['README 措辞标准','两份 README（给人看的说明文档）的十条措辞依据：场景开篇、术语首现解释、前提完整、章节过渡等','写/改 README 时','—'],
'references/项目协作约定.md':['总纲','编号体系（R/F/Q/DC/CC/RB…）、术语表（项目/仓库/线/协议/接口/契约）、状态块、验收即清零','所有会话','—'],
'references/多会话协作规范.md':['核心运行规则（13 节）','形态铁律、留言板、轮纪律、基线双场景、长命令、输出契约、契约先行、联调冻结、临时文件纪律','所有会话','—'],
'references/决策与台账规范.md':['决策流转','DC/CC 编号、撞号顺延、台账字段、攒批批复','总控','—'],
'references/规模适配规范.md':['定档','单点/批量/迭代三档判据与构件表、升降档','AI 开工时','—'],
'references/沟通规范.md':['说人话','默认人类可读原则、编号+人话并排、摘要开头、叙事过渡','所有会话对人的输出','—'],
'references/验收报告规范.md':['验收报告怎么写','13 条措辞+证据+问题清单+版本目录制','线/总控 产验收报告时','—'],
'references/报告修订规范.md':['排查报告怎么写','.docs/ 命名、代码副本、修订历史（单点档产物）','线 产排查报告时','—'],
'references/信息记录规范.md':['三表台账','logs/assets/flows CSV：留痕、资产登记、可复用流程','总控写','—'],
'references/ZCode多会话自驱动工作方案_调研验证与踩坑全记录_2026-10-16.md':['v2 技术储备','自动唤醒会话的实测记录：cron/CLI/app-server 协议与 14 条踩坑','做自动化时','—'],
'assets/':['模板与脚本（13 件）','冷启动时复制到迭代目录使用','AI 复制使用','—'],
'pages/':['演练场脚本与样式（外置）','wizard.js=演练场引擎、mechanisms.js=规则演示、styles.css=样式——README.html 引用','维护者','—'],
'assets/指令台账模板.md':['指令台账骨架','两类来源统一留痕（总控/用户直连）：总控发出即登记、用户直连对账后入账','总控发出即登记','规范§16'],
'assets/环境与工具链记录模板.md':['环境与工具链记录骨架','线级 T0 的产出模板：工具链/运行方式/冒烟验证/踩坑——即本线的"项目记忆"，续接换会话直接读','线 T0 时产出','规范§11'],
'assets/watch_board.py':['守望脚本','盯留言板，一变就退出唤醒会话；带心跳与平安超时','AI 后台运行','规范§5'],
'assets/wait_for.py':['结束标志轮询器','长命令后台跑+轮询标志（文件/日志/HTTP），命中即继续','线 执行长命令时','规范§6'],
'assets/留言板模板.md':['留言板骨架','三区结构+使用说明','总控建板时','规范§3'],
'assets/管控台账模板.md':['管控台账骨架','六节：状态/监控/人类任务/待确认/基线/日志','总控','—'],
'assets/启动卡模板.md':['三档任务卡','批量档卡/迭代档批工作会话卡/管控卡——每批任务一张，批毕即终','总控渲染→人按批粘贴','规范 全部'],
'assets/续接提示词模板.md':['续接提示词','上下文耗尽重开会话用，从实施记录恢复','人 粘贴','规范§4'],
'assets/实施记录模板.md':['实施记录骨架','任务表+完成标准+状态机——中断续接的凭据','线','—'],
'assets/复盘报告模板.md':['复盘骨架','四元口径对照+教训+沉淀检查（收最终态规则）','总控 收尾时','—'],
'assets/预估模板.md':['四元口径预估','日历周/决策点/外部等待/复验轮次+存量缺陷预算','总控 规划时','—'],
'assets/兜底心跳提示词模板.md':['定时兜底提示词','心跳判活→不删基线重启守望→超时提醒','总控 建 cron 时','规范§5'],
'assets/契约文档模板.md':['契约文档骨架','协议+接口分型明细（HTTP/消息主题/长连接/回调）+可mock三条件','总控 契约先行时','规范§9']};
(function(){var t=document.getElementById('fileTree');var html='<ul>';
html+='<li><span class="dir">📁 workteam/</span><ul>';
['SKILL.md','README.md','README.html','LICENSE','package.json'].forEach(function(f){html+='<li><span class="f" data-f="'+f+'">'+f+'</span></li>';});
html+='<li><span class="dir">📁 scripts/</span><ul><li><span class="f" data-f="scripts/">install / uninstall 脚本</span></li></ul></li>';
html+='<li><span class="dir">📁 references/（规程权威源）</span><ul>';
['项目协作约定.md','多会话协作规范.md','决策与台账规范.md','规模适配规范.md','沟通规范.md','README措辞标准.md','验收报告规范.md','报告修订规范.md','信息记录规范.md','ZCode多会话自驱动工作方案_调研验证与踩坑全记录_2026-10-16.md'].forEach(function(f){html+='<li><span class="f" data-f="'+f+'">'+f+'</span></li>';});
html+='</ul></li><li><span class="dir">📁 assets/（模板与脚本）</span><ul>';
['watch_board.py','wait_for.py','留言板模板.md','管控台账模板.md','启动卡模板.md','续接提示词模板.md','实施记录模板.md','复盘报告模板.md','预估模板.md','兜底心跳提示词模板.md','契约文档模板.md','环境与工具链记录模板.md','指令台账模板.md'].forEach(function(f){html+='<li><span class="f" data-f="'+f+'">'+f+'</span></li>';});
html+='</ul></li></ul></li></ul>';t.innerHTML=html;
t.addEventListener('click',function(e){var f=e.target.closest('.f');if(!f)return;
 t.querySelectorAll('.f').forEach(function(x){x.classList.remove('sel')});f.classList.add('sel');
 var k=f.getAttribute('data-f'),i=FM[k]||FM['scripts/'];
 document.getElementById('fileInfo').innerHTML='<h4>📄 '+k+'</h4><p>'+i[0]+'</p><p style="margin-top:8px">'+i[1]+'</p><div class="who"><span class="tag">谁写谁读</span>'+i[2]+'</div><div class="who"><span class="tag">对应规范</span>'+i[3]+'</div>';});})();
