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

document.querySelector('#playBtn').addEventListener('click',e=>{
  e.currentTarget.textContent=e.currentTarget.textContent==='▶'?'Ⅱ':'▶';
  saved.textContent=e.currentTarget.textContent==='Ⅱ'?'Theme Song preview playing.':'Theme Song preview paused.';
});

document.querySelector('#followBtn').addEventListener('click',e=>{
  e.currentTarget.textContent=e.currentTarget.textContent==='Follow'?'Following':'Follow';
});

function startBuilder(){document.querySelector('#settings').scrollIntoView({behavior:'smooth'});setTimeout(()=>handle.focus(),450)}
document.querySelector('#createBtn').addEventListener('click',startBuilder);
document.querySelector('#createHero').addEventListener('click',startBuilder);

document.querySelector('#saveBtn').addEventListener('click',()=>{
  sync();
  const profile={username:handle.value.trim().replace(/^@/,''),themeSong:track.value,genre:genre.value};
  localStorage.setItem('musicProfileV1',JSON.stringify(profile));
  saved.textContent='Music Profile saved on this device.';
});

const stored=localStorage.getItem('musicProfileV1');
if(stored){
  try{
    const s=JSON.parse(stored);
    handle.value=s.username||handle.value;
    track.value=s.themeSong||track.value;
    genre.value=s.genre||genre.value;
    sync();
  }catch{}
}
