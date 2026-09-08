const handle=document.querySelector('#handle');
const track=document.querySelector('#track');
const profileName=document.querySelector('#profileName');
const trackTitle=document.querySelector('#trackTitle');
const connectState=document.querySelector('#connectState');
const saved=document.querySelector('#saved');
function sync(){profileName.textContent='@'+(handle.value.trim().replace(/^@/,'')||'yourprofile');trackTitle.textContent=track.value}
handle.addEventListener('input',sync);track.addEventListener('change',sync);
document.querySelector('#connectBtn').addEventListener('click',()=>{connectState.textContent='Prototype connection ready. Meta OAuth/API integration is intentionally isolated for the next phase.'});
document.querySelector('#previewBtn').addEventListener('click',()=>document.querySelector('#settings').scrollIntoView({behavior:'smooth'}));
document.querySelector('#playBtn').addEventListener('click',e=>{e.currentTarget.textContent=e.currentTarget.textContent==='▶'?'Ⅱ':'▶';saved.textContent=e.currentTarget.textContent==='Ⅱ'?'Theme preview playing. Replace with an authorized audio source in the integration phase.':''});
document.querySelector('#saveBtn').addEventListener('click',()=>{sync();localStorage.setItem('themeSongPrototype',JSON.stringify({handle:handle.value,track:track.value,behavior:document.querySelector('#behavior').value}));saved.textContent='Saved locally for this prototype.'});
const stored=localStorage.getItem('themeSongPrototype');if(stored){try{const s=JSON.parse(stored);handle.value=s.handle||handle.value;track.value=s.track||track.value;document.querySelector('#behavior').value=s.behavior||document.querySelector('#behavior').value;sync()}catch{}}
