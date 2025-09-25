// ===================== Utils =====================
const $  = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);

// ===================== Áudio =====================
// Música de fundo (continua igual)
const bgMusic = $("#bgMusic");
let musicStarted = false;
function startMusic(){
  if (!musicStarted && bgMusic){
    bgMusic.volume = 0.40;
    bgMusic.play().catch(()=>{});
    musicStarted = true;
  }
}

// ---- WebAudio para o "typewriter" ----
let audioCtx = null;        // AudioContext
let typeBuf  = null;        // AudioBuffer (som carregado)
let typeGain = null;        // GainNode (volume)
let typeSrc  = null;        // BufferSource atual (tocando)
const TYPE_VOL = 0.4;       // volume do typewriter

async function initTypewriterAudio(){
  if (audioCtx) return; // já inicializado
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  typeGain = audioCtx.createGain();
  typeGain.gain.value = TYPE_VOL;
  typeGain.connect(audioCtx.destination);

  // carrega o ficheiro (da pasta public/assets)
  const resp = await fetch("/assets/typewriter-loop.mp3");
  const arr  = await resp.arrayBuffer();
  typeBuf    = await audioCtx.decodeAudioData(arr);
}

function startTypeLoop(){
  if (!audioCtx || !typeBuf) return;
  // por política de autoplay, garantir que o contexto está "running"
  if (audioCtx.state !== "running") {
    audioCtx.resume().catch(()=>{});
  }
  // cria nova source a cada arranque
  stopTypeLoop();
  typeSrc = audioCtx.createBufferSource();
  typeSrc.buffer = typeBuf;
  typeSrc.loop   = true;
  typeSrc.connect(typeGain);
  try { typeSrc.start(0); } catch {}
}

function stopTypeLoop(){
  if (typeSrc){
    try { typeSrc.stop(0); } catch {}
    try { typeSrc.disconnect(); } catch {}
    typeSrc = null;
  }
}

// ===================== Gate (bloqueio) =====================
const GATE_KEY = "escape_milao_unlocked";
const PERSIST_UNLOCK = false;
let isUnlocked = PERSIST_UNLOCK && sessionStorage.getItem(GATE_KEY) === "1";

// ===================== Navegação =====================
let currentId = "#gate";
const navStack = [];
function updateBackButtons(){ $$(".btn-back").forEach(b => b.disabled = navStack.length === 0); }

function show(id, { push = true } = {}){
  if (!isUnlocked && id !== "#gate") id = "#gate";

  // lifecycle (antes de sair do ecrã atual)
  if (currentId === "#pista3" && id !== "#pista3") stopPista3();
  if (currentId === "#intro"  && id !== "#intro")  stopIntro();

  let target = document.querySelector(id);
  if (!target) { id = "#gate"; target = document.querySelector(id); }
  if (!target) {
    const first = document.querySelector(".screen");
    if (first){ first.classList.add("active"); currentId = "#"+(first.id||""); return; }
    return;
  }

  document.querySelectorAll(".screen").forEach(sc => sc.classList.remove("active"));
  target.classList.add("active");

  if (push && currentId && currentId !== id) navStack.push(currentId);
  currentId = id;
  updateBackButtons();

  // lifecycle (depois de entrar no novo ecrã)
  if (id === "#intro") startIntroText();
}
show(currentId, { push:false });

// Voltar
document.addEventListener("click",(e)=>{
  const btn = e.target.closest(".btn-back");
  if(!btn || !navStack.length) return;
  const prev = navStack.pop();
  show(prev, { push:false });
});

// ===================== Gate: código 1511 + numpad =====================
const gateInput = $("#gateCode");
const gateBtn   = $("#gateBtn");
const gateErr   = $("#gateErr");

function wrongShake(){
  $("#gate .wrap")?.animate(
    [{transform:"translateX(0)"},{transform:"translateX(-6px)"},{transform:"translateX(6px)"},{transform:"translateX(0)"}],
    {duration:280, easing:"ease-in-out"}
  );
}

// ===================== Intro (typewriter + som) =====================
function stopIntro(){
  // pára o som quando saímos do ecrã
  stopTypeLoop();
}

function startIntroText(){
  const el  = $("#typewriter");
  if (!el) return;

  const txt = el.getAttribute("data-text") || "";
  // reset sempre que a intro aparece
  el.textContent = "";
  let i = 0;

  function tick(){
    if (i <= txt.length){
      el.textContent = txt.slice(0, i);
      if (i === 0) startTypeLoop(); // começa o som no 1º carácter
      i++;
      setTimeout(tick, 60);
    } else {
      stopTypeLoop();               // pára assim que termina
    }
  }
  tick();
}

// ===== Desbloqueio =====
async function tryUnlock(){
  const code = (gateInput?.value || "").trim();
  if (code !== "1511"){
    gateErr?.classList.remove("hidden");
    wrongShake();
    gateInput?.select();
    return;
  }

  isUnlocked = true;
  if (PERSIST_UNLOCK) sessionStorage.setItem(GATE_KEY, "1");
  gateErr?.classList.add("hidden");
  if (gateInput) gateInput.value = "";

  // Tudo que precisa de gesto humano:
  startMusic();                               // música de fundo só agora
  await initTypewriterAudio().catch(()=>{});  // cria AudioContext e carrega o som
  if (audioCtx && audioCtx.state !== "running"){
    // garantir estado "running" imediatamente após gesto humano
    try { await audioCtx.resume(); } catch {}
  }

  show("#intro", { push:false }); // isto chama startIntroText() via show()
  $("#startBtn")?.focus();
}
gateBtn?.addEventListener("click", tryUnlock);
gateInput?.addEventListener("keydown",(e)=>{ if (e.key === "Enter") tryUnlock(); });
$(".numpad")?.addEventListener("click",(e)=>{
  const btn = e.target.closest(".np"); if(!btn) return;
  const k = btn.getAttribute("data-k"); if (!gateInput) return;

  if (/^\d$/.test(k)){ if (gateInput.value.length < 4) gateInput.value += k; }
  else if (k === "del"){ gateInput.value = gateInput.value.slice(0, -1); }
  else if (k === "ok"){ tryUnlock(); return; }

  gateInput.animate([{transform:"scale(1.0)"},{transform:"scale(1.02)"},{transform:"scale(1.0)"}], {duration:120});
});

// ===================== Intro → Pista 1 =====================
$("#startBtn")?.addEventListener("click", ()=>{
  navStack.length = 0;
  show("#pista1");
});

// ===================== Pista 1: CHIAVE =====================
const seqTarget = "CHIAVE"; let seq = "";
$("#pista1").addEventListener("click",(e)=>{
  const el = e.target.closest("[data-letter]"); if(!el) return;
  seq += el.getAttribute("data-letter");
  el.classList.add("selected");
  $("#seq1").textContent = seq;
  if (seq === seqTarget){ $("#toPista2").disabled = false; }
  else if (!seqTarget.startsWith(seq)){
    seq = ""; $("#seq1").textContent = "—";
    $$("#pista1 [data-letter]").forEach(n=>n.classList.remove("selected"));
  }
});
$("#toPista2").addEventListener("click", ()=> show("#pista2"));

// ===================== Pista 2: espelho + vídeo local =====================
$("#espelhoFrase").addEventListener("click",(e)=>{
  if (!e.target.classList.contains("gatilho")) return;
  const faixa = $(".espelho-linha");
  const inv   = $("#palavraEspelhoMirror");
  const norm  = $("#palavraEspelho");
  const btn   = $("#toPista3");

  faixa?.classList.add("fade-out","pointer-off");
  inv?.classList.add("hide","pointer-off");
  setTimeout(()=>{
    faixa?.classList.add("gone");
    inv?.classList.add("gone");
    norm.classList.remove("hidden");
    norm.style.opacity = "1";
  },470);

  if (btn) btn.disabled = false;
});
$("#toPista3").addEventListener("click", ()=>{
  show("#pista3");
  startPista3();
});

// vídeo local fullscreen (imagem 3)
const videoModal = $("#videoModal");
const localVideo = $("#localVideo");
const closeVideo = $("#closeVideo");
const localVideoURL = "/assets/video.mp4";
document.querySelector('img[src="/assets/esp3.jpg"]')?.addEventListener("click", ()=>{
  localVideo.src = localVideoURL;
  videoModal.classList.remove("hidden");
  localVideo.play();
  if (localVideo.requestFullscreen) localVideo.requestFullscreen();
});
closeVideo?.addEventListener("click", ()=>{
  localVideo.pause(); localVideo.src = ""; videoModal.classList.add("hidden");
});
videoModal?.addEventListener("click",(e)=>{
  if (e.target === videoModal){
    localVideo.pause(); localVideo.src = ""; videoModal.classList.add("hidden");
  }
});

// ===================== Pista 3: timer + 11:05 =====================
let p3TimerId=null, p3MsgId=null, p3Seconds=120;
function startPista3(){
  stopPista3(); p3Seconds = 120; updateTimerUI(p3Seconds);
  const timerBox = $(".timer");
  p3TimerId = setInterval(()=>{
    p3Seconds = Math.max(0, p3Seconds-1);
    updateTimerUI(p3Seconds);
    if (timerBox){ (p3Seconds<=30)? timerBox.classList.add("warning") : timerBox.classList.remove("warning"); }
    if (p3Seconds===0){ pushP3Message("O tempo acabou… ou será que o relógio mente?"); clearInterval(p3TimerId); p3TimerId=null; }
  },1000);

  const msgs = [
    "O TEMPO NÃO ESPERA POR TI…",
    "TIC-TAC. TIC-TAC.",
    "1105 NÃO É SÓ UM NÚMERO.",
    "A PRESSA NEM SEMPRE AJUDA.",
    "RESPIRA. ALINHA OS PONTEIROS."
  ];
  let i=0;
  pushP3Message("O TEMPO SÓ ANDA PARA A FRENTE…");
  p3MsgId = setInterval(()=>{ pushP3Message(msgs[i%msgs.length]); i++; },18000);
}
function stopPista3(){ if(p3TimerId){clearInterval(p3TimerId); p3TimerId=null;} if(p3MsgId){clearInterval(p3MsgId); p3MsgId=null;} }
function updateTimerUI(s){ const out=$("#timerValue"); if(!out)return; const m=Math.floor(s/60), r=s%60; out.textContent=`${String(m).padStart(2,"0")}:${String(r).padStart(2,"0")}`; }
function pushP3Message(text){ const box=$("#p3Msgs"); if(!box)return; const el=document.createElement("span"); el.className="msg"; el.textContent=text; box.innerHTML=""; box.appendChild(el); }
function checkClock(){ const h=$("#horaSel").value, m=$("#minSel").value; if(h==="11" && m==="05"){ $("#p3ok").classList.remove("hidden"); $("#toPista4").disabled=false; } else { $("#p3ok").classList.add("hidden"); $("#toPista4").disabled=true; } }
$("#horaSel").addEventListener("change",checkClock);
$("#minSel").addEventListener("change",checkClock);
$("#toPista4").addEventListener("click", ()=> show("#pista4"));

// ===================== Pista 4: Puzzle 3×3 =====================
(function initPuzzle(){
  const board = $("#puzzle");
  if(!board) return;

  const imgUrl = board.getAttribute("data-img");
  const N = 3;
  const total = N*N;

  let order = Array.from({length: total}, (_,i)=>i);
  do { shuffle(order); } while (isSolved(order));

  board.innerHTML = "";
  order.forEach((idx, pos)=>{
    const piece = document.createElement("div");
    piece.className = "piece";
    piece.dataset.pos = String(pos);
    piece.dataset.idx = String(idx);
    piece.style.backgroundImage = `url(${imgUrl})`;
    piece.style.backgroundSize  = `${N*100}% ${N*100}%`;
    const x = idx % N, y = Math.floor(idx / N);
    const px = (x/(N-1))*100, py = (y/(N-1))*100;
    piece.style.backgroundPosition = `${px}% ${py}%`;
    board.appendChild(piece);
  });
  updateCorrectStyles();

  let first = null;
  board.addEventListener("click",(e)=>{
    const tile = e.target.closest(".piece");
    if(!tile) return;

    if(!first){
      first = tile;
      first.classList.add("selected");
      return;
    }
    if(tile === first){
      first.classList.remove("selected");
      first = null;
      return;
    }
    swapTiles(first, tile);
    first.classList.remove("selected");
    first = null;

    updateCorrectStyles();
    if (isSolved([...board.children].map(el => +el.dataset.idx))){
      $("#p4ok").classList.remove("hidden");
      $("#toFinal").disabled = false;
    }
  });

  function swapTiles(a,b){
    const tmp = a.dataset.idx;
    a.dataset.idx = b.dataset.idx;
    b.dataset.idx = tmp;
    [a,b].forEach(el=>{
      const idx = +el.dataset.idx;
      const x = idx % N, y = Math.floor(idx / N);
      const px = (x/(N-1))*100, py = (y/(N-1))*100;
      el.style.backgroundPosition = `${px}% ${py}%`;
      el.style.backgroundSize     = `${N*100}% ${N*100}%`;
    });
  }

  function updateCorrectStyles(){
    [...board.children].forEach((el, pos)=>{
      const correct = (+el.dataset.idx === pos);
      el.classList.toggle("correct", correct);
    });
  }

  function isSolved(arr){ return arr.every((v,i)=> v===i); }
  function shuffle(arr){
    for(let i=arr.length-1;i>0;i--){
      const j = Math.floor(Math.random()*(i+1));
      [arr[i],arr[j]] = [arr[j],arr[i]];
    }
    return arr;
  }
})();

// ===================== Final =====================
// ===================== Final =====================
$("#toFinal").addEventListener("click", () => {
  // Preenche só se existirem (para quem ainda usa o cartão de texto)
  const bilhete = window.BILHETE || {};
  const n = document.querySelector("#tkNome");
  const t = document.querySelector("#tkTrip");
  const d = document.querySelector("#tkData");
  if (n) n.textContent = bilhete.nome || "Joana";
  if (t) t.textContent = bilhete.trip || "Tu, a Carlota e a Guida";
  if (d) d.textContent = bilhete.data || "[dd/mm/aaaa]";

  // contador continua a funcionar normalmente
  startCountdown(bilhete.dataISO);

  // agora avança SEM ERROS mesmo sem esses elementos
  show("#final");
});


// abrir a imagem do boarding pass em nova tab / fullscreen simples
$("#openFull")?.addEventListener("click", () => {
  const url = "/assets/boarding-pass.png";
  // tentar fullscreen básico num overlay simples
  const w = window.open(url, "_blank", "noopener");
  if (!w) {
    // se o browser bloquear, faz fallback para mudar a localização
    window.location.href = url;
  }
});


function startCountdown(iso){
  const out = $("#count");
  if(!iso){ out.textContent = "Define a data em window.BILHETE.dataISO"; return; }
  function tick(){
    const t = new Date(iso+"T00:00:00");
    const now = new Date();
    const diff = t - now;
    if (diff <= 0){ out.textContent = "É hoje! 🎉"; return; }
    const d = Math.floor(diff/86400000);
    const h = Math.floor((diff%86400000)/3600000);
    const m = Math.floor((diff%3600000)/60000);
    const s = Math.floor((diff%60000)/1000);
    out.textContent = `${d} dias, ${h} horas, ${m} minutos, ${s} segundos`;
    setTimeout(tick, 1000);
  }
  tick();
}

// ===== Bilhete =====
window.BILHETE = {
  nome: "Joana",
  trip: "Tu, a Carlota e a Guida",
  data: "15/11/2025",
  dataISO: "2025-11-15"
};
