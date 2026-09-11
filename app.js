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

document.querySelector('#submitEvaluation').addEventListener('click',()=>{saved.textContent='Your audience evaluation has been saved to this project. Professional/critic evaluation remains separate.'});

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
