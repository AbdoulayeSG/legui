/* Service audio centralisé : une seule sonnerie à la fois.
   États : idle -> ringing -> stopping -> ending -> idle */
(function(){
const SND={ring:'sonds/ringing.mp3',end:'sonds/end_ringing.mp3'};
class AudioReminderService{
  constructor(){this.state='idle';this.task=null;this.error='';this.volume=1;this.ring=null;this.end=null;this.subs=new Set();this._onEnded=this._onEnded.bind(this)}
  _init(){if(this.ring)return;
    this.ring=new Audio(SND.ring);this.ring.loop=true;this.ring.preload='auto';
    this.end=new Audio(SND.end);this.end.loop=false;this.end.preload='auto';
    this.end.addEventListener('ended',this._onEnded);this.end.addEventListener('error',this._onEnded)}
  /* iOS/Safari : un élément audio n'est autorisé à jouer plus tard (minuteur) que s'il a déjà
     été lancé une fois pendant un geste de l'utilisateur. On le « déverrouille » au premier toucher. */
  unlock(){this._init();
    try{if(navigator.audioSession)navigator.audioSession.type='playback'}catch(e){}
    if(this._unlocked)return;this._unlocked=true;
    [this.ring,this.end].forEach(a=>{a.muted=true;const p=a.play();
      const done=()=>{a.pause();a.currentTime=0;a.muted=false};
      if(p&&p.then)p.then(done,()=>{a.muted=false;this._unlocked=false});else done()})}
  async retry(){if(this.state!=='ringing'||!this.ring)return;
    try{await this.ring.play();this.error='';this._set('ringing')}catch(e){}}
  subscribe(f){this.subs.add(f);return()=>this.subs.delete(f)}
  _set(s){this.state=s;this.subs.forEach(f=>f(this))}
  setVolume(v){this.volume=Math.min(1,Math.max(0,v));if(this.ring)this.ring.volume=this.volume;if(this.end)this.end.volume=this.volume}
  _silence(){if(!this.ring)return;this.ring.pause();this.ring.currentTime=0;this.end.pause();this.end.currentTime=0}
  async start(task){
    if(this.state!=='idle')return false;
    this._init();try{if(navigator.audioSession)navigator.audioSession.type='playback'}catch(e){}this.setVolume(this.volume);this.task=task;this.error='';this._set('ringing');
    try{await this.ring.play();
      if(this.state!=='ringing'){this.ring.pause();this.ring.currentTime=0}
      return true}
    catch(e){if(this.state==='ringing'){this.error=e.name==='NotAllowedError'?'Lecture bloquée par le navigateur. Touchez l’écran pour activer le son.':'Impossible de lire la sonnerie.';this._set('ringing')}return false}}
  stop(){
    if(this.state!=='ringing')return;
    this._set('stopping');this._silence();this._set('ending');
    this.end.play().catch(()=>this._onEnded())}
  snooze(){
    if(this.state!=='ringing')return null;
    const t=this.task;this._silence();this.task=null;this.error='';this._set('idle');return t}
  _onEnded(){if(this.state!=='ending')return;this.end.pause();this.end.currentTime=0;this.task=null;this._set('idle')}
  cancel(id){if(this.task&&this.task.id===id&&this.state==='ringing'){this._silence();this.task=null;this._set('idle')}}
  destroy(){if(this.ring){this._silence();this.end.removeEventListener('ended',this._onEnded);this.end.removeEventListener('error',this._onEnded)}this.subs.clear();this.ring=this.end=null;this.state='idle'}
}
window.audioReminder=new AudioReminderService();
})();
