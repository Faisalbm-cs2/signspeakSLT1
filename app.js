// Application State
const AppState = {
  currentUser: null,
  activeLanguage: 'english',
  activeMode: 'textToAnim',
  cameraStream: null,
  speechSynthesis: null,
  isAnimationPlaying: false
};

// DOM Elements - Login Screen
const loginScreen = document.getElementById('loginScreen');
const hubScreen = document.getElementById('hubScreen');
const loginNameInput = document.getElementById('loginNameInput');
const loginContinueByNameBtn = document.getElementById('loginContinueByNameBtn');
const loginContinueAsGuestBtn = document.getElementById('loginContinueAsGuestBtn');
const loginForm = document.getElementById('loginForm');

// DOM Elements - Hub Screen
const welcomeName = document.getElementById('welcomeName');
const directionIndicator = document.getElementById('directionIndicator');

// Language Cards
const langArabicCard = document.getElementById('langArabicCard');
const langEnglishCard = document.getElementById('langEnglishCard');
const langUrduCard = document.getElementById('langUrduCard');

// Mode Cards
const modeTextToAnimCard = document.getElementById('modeTextToAnimCard');
const modeSignToTextCard = document.getElementById('modeSignToTextCard');

// Panels
const cameraPanel = document.getElementById('cameraPanel');
const animationPanel = document.getElementById('animationPanel');
const textPanel = document.getElementById('textPanel');

// Camera Controls
const cameraVideo = document.getElementById('cameraVideo');
const cameraStartBtn = document.getElementById('cameraStartBtn');
const cameraStopBtn = document.getElementById('cameraStopBtn');

// Animation Controls
const animationViewport = document.getElementById('animationViewport');
const animPlayBtn = document.getElementById('animPlayBtn');
const animPauseBtn = document.getElementById('animPauseBtn');
const animResetBtn = document.getElementById('animResetBtn');
const animationDemo = document.querySelector('.animation-demo');

// Text Controls
const textArea = document.getElementById('textArea');
const textStatus = document.getElementById('textStatus');
const ttsToggle = document.getElementById('ttsToggle');
const speakBtn = document.getElementById('speakBtn');

function setActiveCard(cards, activeCard) {
  cards.forEach(card => { card.classList.remove('is-active'); card.setAttribute('aria-checked','false'); });
  activeCard.classList.add('is-active');
  activeCard.setAttribute('aria-checked','true');
}

function updateDirection(isRTL) {
  const direction = isRTL ? 'rtl' : 'ltr';
  document.body.setAttribute('data-dir', direction);
  document.body.dir = direction;
  directionIndicator.textContent = direction.toUpperCase();
}

function showNotification(msg, type='info'){ console.log(`${type.toUpperCase()}: ${msg}`); }

function navigateToHub(){
  loginScreen.classList.remove('active'); hubScreen.classList.add('active'); location.hash = '#hub';
  setTimeout(()=>langEnglishCard.focus(),100);
}
function navigateToLogin(){
  hubScreen.classList.remove('active'); loginScreen.classList.add('active'); location.hash = '#login';
  setTimeout(()=>loginNameInput.focus(),100);
}

function handleLogin(userName){
  if(!userName || userName.trim()==='') userName='Guest';
  localStorage.setItem('sl_userName', userName.trim());
  AppState.currentUser = userName.trim();
  welcomeName.textContent = AppState.currentUser;
  navigateToHub();
  showNotification(`Welcome, ${AppState.currentUser}!`,'success');
}

function selectLanguage(language){
  AppState.activeLanguage = language;
  const languageCards = [langArabicCard, langEnglishCard, langUrduCard];
  switch(language){
    case 'arabic': setActiveCard(languageCards, langArabicCard); updateDirection(true); break;
    case 'english': setActiveCard(languageCards, langEnglishCard); updateDirection(false); break;
    case 'urdu': setActiveCard(languageCards, langUrduCard); updateDirection(true); break;
  }
  showNotification(`Language changed to ${language}`);
}

function selectMode(mode){
  AppState.activeMode = mode;
  const modeCards = [modeTextToAnimCard, modeSignToTextCard];
  switch(mode){
    case 'textToAnim':
      setActiveCard(modeCards, modeTextToAnimCard);
      animationPanel.classList.remove('disabled');
      cameraPanel.classList.add('disabled');
      textArea.readOnly = false;
      textArea.placeholder = 'Type your text here to see sign language animation...';
      textStatus.textContent = 'Input';
      textStatus.className = 'status-badge status-active';
      break;
    case 'signToText':
      setActiveCard(modeCards, modeSignToTextCard);
      cameraPanel.classList.remove('disabled');
      animationPanel.classList.add('disabled');
      textArea.readOnly = true;
      textArea.placeholder = 'Translated text will appear here...';
      textStatus.textContent = 'Output';
      textStatus.className = 'status-badge status-inactive';
      break;
  }
  showNotification(`Mode changed to ${mode}`);
}

async function startCamera(){
  try{
    AppState.cameraStream = await navigator.mediaDevices.getUserMedia({ video: { width:{ideal:640}, height:{ideal:480} } });
    cameraVideo.srcObject = AppState.cameraStream;
    document.querySelector('.camera-placeholder').style.display='none';
    cameraStartBtn.disabled = true; cameraStopBtn.disabled = false;
    showNotification('Camera started','success');
    setTimeout(()=>{
      if(AppState.cameraStream && AppState.activeMode==='signToText'){
        textArea.value = 'Hello! (Detected from sign language - placeholder)';
        showNotification('Sign language detected (placeholder)'); updateTTSControls();
      }
    },3000);
  }catch(e){ console.error(e); showNotification('Camera access denied or not available','error'); }
}
function stopCamera(){
  if(AppState.cameraStream){
    AppState.cameraStream.getTracks().forEach(t=>t.stop());
    AppState.cameraStream=null; cameraVideo.srcObject=null;
    document.querySelector('.camera-placeholder').style.display='flex';
    cameraStartBtn.disabled=false; cameraStopBtn.disabled=true;
    showNotification('Camera stopped');
  }
}

function playAnimation(){ AppState.isAnimationPlaying=true; animationDemo.classList.remove('paused'); animPlayBtn.disabled=true; animPauseBtn.disabled=false; showNotification('Animation playing (placeholder)'); }
function pauseAnimation(){ AppState.isAnimationPlaying=false; animationDemo.classList.add('paused'); animPlayBtn.disabled=false; animPauseBtn.disabled=true; showNotification('Animation paused'); }
function resetAnimation(){ pauseAnimation(); animationDemo.style.animation='none'; setTimeout(()=>{ animationDemo.style.animation=''; animationDemo.classList.add('paused'); },10); showNotification('Animation reset'); }

function updateTTSControls(){ const hasText = textArea.value.trim().length>0; const ttsEnabled = ttsToggle.checked; speakBtn.disabled = !hasText || !ttsEnabled; }
function speakText(){
  if(!('speechSynthesis' in window)) return showNotification('Text-to-speech not supported','error');
  const text = textArea.value.trim(); if(!text) return;
  speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  switch(AppState.activeLanguage){ case 'arabic': utter.lang='ar-SA'; break; case 'urdu': utter.lang='ur-PK'; break; default: utter.lang='en-US'; }
  utter.rate=.8; utter.pitch=1; utter.volume=1;
  utter.onstart=()=>{ speakBtn.textContent='Speaking...'; speakBtn.disabled=true; };
  utter.onend=()=>{ speakBtn.textContent='Speak'; updateTTSControls(); };
  utter.onerror=()=>{ speakBtn.textContent='Speak'; updateTTSControls(); showNotification('Text-to-speech not available','error'); };
  speechSynthesis.speak(utter); showNotification('Speaking text...');
}

loginForm.addEventListener('submit', e=>{ e.preventDefault(); const userName = loginNameInput.value.trim(); handleLogin(userName || 'User'); });
loginContinueAsGuestBtn.addEventListener('click', ()=>handleLogin('Guest'));
langArabicCard.addEventListener('click', ()=>selectLanguage('arabic'));
langEnglishCard.addEventListener('click', ()=>selectLanguage('english'));
langUrduCard.addEventListener('click', ()=>selectLanguage('urdu'));
[langArabicCard,langEnglishCard,langUrduCard].forEach(card=>card.addEventListener('keydown', e=>{ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); card.click(); } }));
modeTextToAnimCard.addEventListener('click', ()=>selectMode('textToAnim'));
modeSignToTextCard.addEventListener('click', ()=>selectMode('signToText'));
[modeTextToAnimCard,modeSignToTextCard].forEach(card=>card.addEventListener('keydown', e=>{ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); card.click(); } }));
cameraStartBtn.addEventListener('click', startCamera);
cameraStopBtn.addEventListener('click', stopCamera);
animPlayBtn.addEventListener('click', playAnimation);
animPauseBtn.addEventListener('click', pauseAnimation);
animResetBtn.addEventListener('click', resetAnimation);
textArea.addEventListener('input', updateTTSControls);
ttsToggle.addEventListener('change', updateTTSControls);
speakBtn.addEventListener('click', speakText);
window.addEventListener('hashchange', ()=>{ const h=location.hash; if(h==='#login') navigateToLogin(); else if(h==='#hub') navigateToHub(); });
window.addEventListener('beforeunload', ()=>{ if(AppState.cameraStream) stopCamera(); if(window.speechSynthesis) window.speechSynthesis.cancel(); });

function initializeApp(){
  const savedUser = localStorage.getItem('sl_userName');
  if(savedUser){ AppState.currentUser = savedUser; welcomeName.textContent = savedUser; }
  updateTTSControls();
  selectMode('textToAnim');
  const hash = location.hash;
  if(hash==='#hub' && AppState.currentUser) navigateToHub(); else location.hash='#login';
  console.log('Sign Language Translator initialized');
}
document.addEventListener('DOMContentLoaded', initializeApp);
