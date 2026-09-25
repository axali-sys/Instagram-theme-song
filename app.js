const handle=document.querySelector('#handle');
const track=document.querySelector('#track');
const genre=document.querySelector('#genre');
const profileName=document.querySelector('#profileName');
const trackTitle=document.querySelector('#trackTitle');
const saved=document.querySelector('#saved');

function sync(){
  const username=handle.value.trim().replace(/^@/,'')||'yourprofile';
  profileName.textContent='@'+username;
  trackTitle.textContent=track.value;
}
handle.addEventListener('input',sync);
track.addEventListener('change',sync);

async function api(path, options={}){
  const response=await fetch(path,{headers:{'Content-Type':'application/json',...(options.headers||{})},...options});
  const data=await response.json().catch(()=>({}));
  if(!response.ok) throw new Error(data.error||`Request failed: ${response.status}`);
  return data;
}

async function loadLiveV1(){
  try{
    const [health,profile]=await Promise.all([api('/api/health'),api('/api/profile')]);
    if(profile?.data){
      handle.value=profile.data.username||handle.value;
      track.value=profile.data.themeSong||track.value;
      genre.value=profile.data.primarySound||genre.value;
      sync();
    }
    saved.textContent=`Music Pro ${health.version.toUpperCase()} API connected.`;
  }catch(error){
    console.warn('Live V1 API unavailable; using local prototype mode.',error);
  }
}

document.querySelector('#playBtn').addEventListener('click',e=>{
  e.currentTarget.textContent=e.currentTarget.textContent==='▶'?'Ⅱ':'▶';
  saved.textContent=e.currentTarget.textContent==='Ⅱ'?'Theme Song preview playing.':'Theme Song preview paused.';
});
document.querySelector('#followBtn').addEventListener('click',e=>{e.currentTarget.textContent=e.currentTarget.textContent==='Follow'?'Following':'Follow'});

document.querySelectorAll('.engage').forEach(button=>{
  button.addEventListener('click',()=>{
    const action=button.dataset.action;
    if(action==='Like'||action==='Save'){
      button.classList.toggle('active');
      button.querySelector('span').textContent=button.classList.contains('active')?(action==='Like'?'Liked':'Saved'):action;
    }else{navigator.clipboard?.writeText(window.location.href);saved.textContent='Music Profile link copied.';}
  });
});

document.querySelectorAll('.mini-follow').forEach(button=>button.addEventListener('click',()=>{button.textContent=button.textContent==='Follow'?'Following':'Follow'}));
document.querySelector('#momentBtn').addEventListener('click',()=>{saved.textContent='Music Moment creator is ready for the next V1 step.'});
document.querySelectorAll('.mini-play').forEach(button=>button.addEventListener('click',()=>{button.textContent=button.textContent.includes('Listen')?'Ⅱ Playing their Theme Song':'▶ Listen to their Theme Song'}));

const projects={
  album:{title:'New Album',subtitle:'Album · Artist 01 · Expected October',progress:68,following:'1,842',expecting:'742',timeline:['✓ Announced','✓ Cover revealed','✓ Preview released','● Final production','○ Release','○ Post-release evaluation']},
  episode:{title:'Episode 12',subtitle:'Episode · Artist 02 · Preview available',progress:84,following:'906',expecting:'401',timeline:['✓ Recorded','✓ Edited','● Preview','○ Release','○ Post-release evaluation']},
  song:{title:'New Sound',subtitle:'Song · Artist 03 · Release soon',progress:96,following:'2,104',expecting:'1,120',timeline:['✓ Announced','✓ Preview','✓ Final production','● Release','○ Post-release evaluation']}
};
const projectDetail=document.querySelector('#projectDetail');
async function loadProjectActivity(projectId){
  const timeline=document.querySelector('#detailTimeline');
  const updates=document.querySelector('#projectUpdates');
  const milestones=document.querySelector('#projectMilestones');
  if(!projectId) return;
  try{
    const [m,u]=await Promise.all([api('/api/projects/'+projectId+'/milestones'),api('/api/projects/'+projectId+'/updates')]);
    if(milestones) milestones.innerHTML=(m.data||[]).map(x=>'<article class="activity-item"><b>'+x.title+'</b><span>'+x.status.replace('_',' ')+'</span>'+(x.description?'<p>'+x.description+'</p>':'')+'</article>').join('')||'<p>No milestones yet.</p>';
    if(updates) updates.innerHTML=(u.data||[]).map(x=>'<article class="activity-item"><b>@'+x.author+'</b><p>'+x.body+'</p><small>'+new Date(x.created_at).toLocaleDateString()+'</small></article>').join('')||'<p>No updates yet.</p>';
    if(timeline && (m.data||[]).length) timeline.innerHTML=m.data.map(x=>'<span class="'+(x.status==='completed'?'done':x.status==='in_progress'?'current':'')+'">'+(x.status==='completed'?'✓':x.status==='in_progress'?'●':'○')+' '+x.title+'</span>').join('');
  }catch(error){ if(milestones) milestones.innerHTML='<p>Project activity unavailable.</p>'; if(updates) updates.innerHTML=''; }
}
function openProject(key){
  const p=projects[key];
  document.querySelector('#detailTitle').textContent=p.title;
  document.querySelector('#detailSubtitle').textContent=p.subtitle;
  document.querySelector('#detailProgress').textContent=p.progress+'%';
  document.querySelector('#detailBar').style.width=p.progress+'%';
  document.querySelector('#signalFollowing').textContent=p.following;
  document.querySelector('#signalExpecting').textContent=p.expecting;
  document.querySelector('#detailTimeline').innerHTML=p.timeline.map(x=>`<span class="${x.startsWith('✓')?'done':x.startsWith('●')?'current':''}">${x}</span>`).join('');
  projectDetail.hidden=false;
  const match=Object.values(projects).find(x=>x.title===p.title);
  api('/api/projects?limit=100').then(r=>{const live=(r.data||[]).find(x=>x.title===p.title); if(live) loadProjectActivity(live.id);}).catch(()=>{});
  projectDetail.scrollIntoView({behavior:'smooth',block:'start'});
}
document.querySelectorAll('.open-project').forEach(button=>button.addEventListener('click',()=>openProject(button.dataset.target)));
document.querySelector('#closeProject').addEventListener('click',()=>{projectDetail.hidden=true});

document.querySelectorAll('.track-btn,.expect-btn').forEach(button=>button.addEventListener('click',()=>{
  const tracking=button.classList.contains('track-btn');
  button.classList.toggle('active');
  if(tracking){button.textContent=button.classList.contains('active')?'Following':'Follow';}
  else{button.textContent=button.classList.contains('active')?'★ Expecting':'☆ Expect';}
}));

document.querySelector('#submitEvaluation').addEventListener('click',async()=>{
  const projectKey=document.querySelector('#detailTitle').textContent;
  const key=Object.keys(projects).find(k=>projects[k].title===projectKey);
  const projectIds={album:null,episode:null,song:null};
  if(!key){saved.textContent='Open a project before saving an evaluation.';return;}
  saved.textContent='Sign in and open a persisted project to save an evaluation.';
  try{
    const detail=await api('/api/projects?limit=100');
    const match=(detail.data||[]).find(p=>p.title===projects[key].title);
    if(!match) return;
    const selects=[...document.querySelectorAll('.evaluation select')].map(s=>s.value);
    await api('/api/projects/'+match.id+'/evaluate',{method:'POST',body:JSON.stringify({
      overall:selects[0],connection:selects[1],replay:selects[2],expectation:selects[3]
    })});
    saved.textContent='Your audience evaluation has been saved to this project.';
  }catch(error){saved.textContent=error.message;}
});

function startBuilder(){document.querySelector('#settings').scrollIntoView({behavior:'smooth'});setTimeout(()=>handle.focus(),450)}
document.querySelector('#createBtn').addEventListener('click',startBuilder);
document.querySelector('#createHero').addEventListener('click',startBuilder);

document.querySelector('#saveBtn').addEventListener('click',async()=>{
  sync();
  const profile={username:handle.value.trim().replace(/^@/,''),themeSong:track.value,primarySound:genre.value};
  try{
    await api('/api/profile',{method:'POST',body:JSON.stringify(profile)});
    localStorage.setItem('musicProfileV1',JSON.stringify(profile));
    saved.textContent='My Music Pro Profile sent to the V1 API.';
  }catch(error){
    localStorage.setItem('musicProfileV1',JSON.stringify(profile));
    saved.textContent='API unavailable — profile saved locally until live persistence is connected.';
  }
});

const stored=localStorage.getItem('musicProfileV1');
if(stored){try{const s=JSON.parse(stored);handle.value=s.username||handle.value;track.value=s.themeSong||track.value;genre.value=s.primarySound||s.genre||genre.value;sync()}catch{}}

loadLiveV1();


async function refreshAccount(){
  const state=document.querySelector('#accountState');
  const forms=document.querySelector('#authForms');
  const actions=document.querySelector('#accountActions');
  try{
    const data=await api('/api/auth/me');
    state.textContent='Signed in';
    document.querySelector('#accountTitle').textContent='My Music Pro account';
    document.querySelector('#accountUser').textContent='Signed in as @'+data.user.username+' · '+data.user.email;
    forms.hidden=true; actions.hidden=false;
  }catch{
    state.textContent='Guest';
    forms.hidden=false; actions.hidden=true;
  }
}
async function authAction(path){
  const email=document.querySelector('#authEmail').value.trim();
  const password=document.querySelector('#authPassword').value;
  const username=document.querySelector('#authUsername')?.value.trim();
  const message=document.querySelector('#authMessage');
  try{
    const body=path.endsWith('register')?{email,password,username}:{email,password};
    const data=await api(path,{method:'POST',body:JSON.stringify(body)});
    message.textContent='Welcome to Music Pro, @'+data.user.username+'. Your session is active.';
    await refreshAccount();
    await loadLiveV1();
  }catch(error){ message.textContent=error.message; }
}
document.querySelector('#registerBtn')?.addEventListener('click',()=>authAction('/api/auth/register'));
document.querySelector('#loginBtn')?.addEventListener('click',()=>authAction('/api/auth/login'));
document.querySelector('#logoutBtn')?.addEventListener('click',async()=>{
  await api('/api/auth/logout',{method:'POST'}).catch(()=>{});
  document.querySelector('#authMessage').textContent='Signed out. Your local preview remains available.';
  await refreshAccount();
});
refreshAccount();


async function loadNotifications(){
  const list=document.querySelector('#notificationList');
  const count=document.querySelector('#notificationCount');
  if(!list||!count) return;
  try{
    const data=await api('/api/notifications');
    count.textContent=(data.unreadCount ?? data.unread ?? 0)+' unread';
    list.innerHTML=(data.data||[]).map(n=>'<article class="notification-item '+(n.read_at?'read':'unread')+'"><div><strong>'+n.title+'</strong><p>'+((n.body||'').replace(/</g,'&lt;'))+'</p></div><time>'+new Date(n.created_at).toLocaleString()+'</time></article>').join('')||'<p class="saved">No notifications yet.</p>';
  }catch{ list.innerHTML='<p class="saved">Sign in to see your notifications.</p>'; count.textContent='0 unread'; }
}
document.querySelector('#markNotificationsRead')?.addEventListener('click',async()=>{
  try{await api('/api/notifications',{method:'POST',body:JSON.stringify({all:true})});await loadNotifications();}catch(error){saved.textContent=error.message;}
});
document.querySelector('#openNotificationSettings')?.addEventListener('click',()=>document.querySelector('#settings')?.scrollIntoView({behavior:'smooth'}));
setInterval(loadNotifications,30000);
loadNotifications();

document.querySelector('#createProjectBtn')?.addEventListener('click',async()=>{
  const msg=document.querySelector('#creatorMessage');
  try{
    const data=await api('/api/projects',{method:'POST',body:JSON.stringify({
      title:document.querySelector('#creatorProjectTitle').value.trim(),
      type:document.querySelector('#creatorProjectType').value,
      status:document.querySelector('#creatorProjectStatus').value,
      progress:Number(document.querySelector('#creatorProjectProgress').value)||0,
      description:document.querySelector('#creatorProjectDescription').value.trim()
    })});
    msg.textContent='Project created and persisted. Project ID: '+data.data.id;
    document.querySelector('#creatorProjectTitle').value='';
    document.querySelector('#creatorProjectDescription').value='';
  }catch(error){msg.textContent=error.message;}
});


// Listener-first V1 home experience.
const listenerTabs=[...document.querySelectorAll('.listener-tab')];
const listenerViews=[...document.querySelectorAll('.listener-view')];
function activateListenerTab(name){listenerTabs.forEach(tab=>tab.classList.toggle('active',tab.dataset.listenerTab===name));listenerViews.forEach(view=>view.classList.toggle('active',view.dataset.listenerView===name));}
listenerTabs.forEach(tab=>tab.addEventListener('click',()=>activateListenerTab(tab.dataset.listenerTab)));
document.querySelectorAll('[data-feed-action]').forEach(button=>button.addEventListener('click',()=>{const action=button.dataset.feedAction;if(action==='discover'||action==='people')document.querySelector('#discover')?.scrollIntoView({behavior:'smooth'});else if(action==='moment')document.querySelector('#momentBtn')?.click();else{const key=action.replace('open-','');document.querySelector('.open-project[data-target="'+key+'"]')?.click();}}));
