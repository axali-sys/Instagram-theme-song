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

document.querySelectorAll('.engage').forEach(button=>{
  button.addEventListener('click',()=>{
    const action=button.dataset.action;
    if(action==='Like'){
      button.classList.toggle('active');
      button.querySelector('span').textContent=button.classList.contains('active')?'Liked':'Like';
    }else if(action==='Save'){
      button.classList.toggle('active');
      button.querySelector('span').textContent=button.classList.contains('active')?'Saved':'Save';
    }else{
      navigator.clipboard?.writeText(window.location.href);
      saved.textContent='Music Profile link copied.';
    }
  });
});

document.querySelectorAll('.mini-follow').forEach(button=>{
  button.addEventListener('click',()=>{
    button.textContent=button.textContent==='Follow'?'Following':'Follow';
  });
});

document.querySelector('#momentBtn').addEventListener('click',()=>{
  saved.textContent='Music Moment creator is ready for the next V1 step.';
});

document.querySelectorAll('.mini-play').forEach(button=>{
  button.addEventListener('click',()=>{
    button.textContent=button.textContent.includes('Listen')?'Ⅱ Playing their Theme Song':'▶ Listen to their Theme Song';
  });
});

function startBuilder(){document.querySelector('#settings').scrollIntoView({behavior:'smooth'});setTimeout(()=>handle.focus(),450)}
document.querySelector('#createBtn').addEventListener('click',startBuilder);
document.querySelector('#createHero').addEventListener('click',startBuilder);

document.querySelector('#saveBtn').addEventListener('click',()=>{
  sync();
  const profile={username:handle.value.trim().replace(/^@/,''),themeSong:track.value,genre:genre.value};
  localStorage.setItem('musicProfileV1',JSON.stringify(profile));
  saved.textContent='My Music Pro Profile saved on this device.';
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
