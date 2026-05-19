// === Audio System ===
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playTone(freq, type, dur, vol=0.1) {
  if(audioCtx.state === 'suspended') audioCtx.resume();
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type; osc.frequency.value = freq;
  osc.connect(gain); gain.connect(audioCtx.destination);
  osc.start(); gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + dur);
  osc.stop(audioCtx.currentTime + dur);
}
function playSuccess() { playTone(1200, 'square', 0.1, 0.1); setTimeout(()=>playTone(1600, 'square', 0.2, 0.1), 100); }
function playReject() { 
  playTone(200, 'sawtooth', 0.1, 0.2); 
  setTimeout(()=> {
    if(audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine'; osc.frequency.setValueAtTime(300, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(50, audioCtx.currentTime + 0.6);
    osc.connect(gain); gain.connect(audioCtx.destination);
    osc.start(); gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.6);
    osc.stop(audioCtx.currentTime + 0.6);
  }, 100);
}
function playAlarm() {
  let i = 0;
  const intv = setInterval(()=>{
    playTone(i%2===0?600:400, 'square', 0.15, 0.2);
    i++; if(i>15) clearInterval(intv);
  }, 150);
}

// === Navigation Logic ===
const stepTitles = [
  "2-1. 比較演算子 == と !=", "2-2. インデント（Tab）", "2-3. 真偽値 True / False",
  "2-4. 大小比較 <, >, <=, >=", "2-5. そうでなければ else", "2-6. さらに条件分岐 elif",
  "2-7. 条件の組み合わせ and, or", "2-8. 入力値を受け取る input", "2-9. 偶奇判定",
  "2-10. 残金計算", "2-11. 2つの整数の和", "2-12. 3の倍数判定"
];
let currentStep = 1;
function updateStep() {
  document.querySelectorAll('.step-panel').forEach(p => p.classList.remove('active'));
  document.getElementById('step-' + currentStep).classList.add('active');
  document.getElementById('step-display').innerText = stepTitles[currentStep - 1];
  playTone(1800, 'sine', 0.1);
  clearWorld();
  setupCodeForStep(currentStep);
}
function nextStep() { if(currentStep < 12) { currentStep++; updateStep(); } }
function prevStep() { if(currentStep > 1) { currentStep--; updateStep(); } }

// === UI Logic (Code & Memory) ===
function setCodeMonitor(codeStr) {
  const lines = codeStr.trim().split('\n');
  const html = lines.map((l, i) => `<span class="code-line" id="line-${i}">${l.replace(/ /g, '&nbsp;')}</span>`).join('\n');
  document.getElementById('code-content').innerHTML = html;
}
function highlightLine(lineNums) {
  document.querySelectorAll('.code-line').forEach(el => el.classList.remove('active'));
  if(!Array.isArray(lineNums)) lineNums = [lineNums];
  lineNums.forEach(num => {
    if(num !== undefined && num !== null) {
      const el = document.getElementById(`line-${num}`);
      if(el) el.classList.add('active');
    }
  });
}
function updateMemoryHUD(text) {
  document.getElementById('mem-content').innerHTML = text;
}

function setupCodeForStep(step) {
  highlightLine(null);
  switch(step) {
    case 1:
      setCodeMonitor(`if score == 100:\n  print("Very good!")\nelse:\n  print("Bad!")`);
      updateMemoryHUD(`score = ?`); break;
    case 2:
      setCodeMonitor(`x = 10\nif x == 10:\n  print("Yes!")`);
      updateMemoryHUD(`x = 10`); break;
    case 3:
      setCodeMonitor(`x = 10\nprint(x == 10)\nprint(x == 5)`);
      updateMemoryHUD(`x = 10`); break;
    case 4:
      setCodeMonitor(`if x > 5:\n  print("xは5より大きい")`);
      updateMemoryHUD(`x = ?`); break;
    case 5:
      setCodeMonitor(`if score > 80:\n  print("よくできました")\nelse:\n  print("残念でした")`);
      updateMemoryHUD(`score = ?`); break;
    case 6:
      setCodeMonitor(`if score > 80:\n  print("よくできました")\nelif score > 50:\n  print("まずまずです")\nelse:\n  print("残念でした")`);
      updateMemoryHUD(`score = ?`); break;
    case 7:
      setCodeMonitor(`if time > 9 and time < 17:\n  print("就業時間です")\nif time == 10 or time == 15:\n  print("おやつ")`);
      updateMemoryHUD(`time = ?`); break;
    case 8:
      setCodeMonitor(`apple_price = 100\ncount = int(input())\ntotal = apple_price * count\nprint(total)`);
      updateMemoryHUD(`apple_price = 100<br>count = ?`); break;
    case 9:
      setCodeMonitor(`if x % 2 == 0:\n  print("偶数です")\nelse:\n  print("奇数です")`);
      updateMemoryHUD(`x = ?`); break;
    case 10:
      setCodeMonitor(`money = 1000\ncost = 100 * input_count\nif money >= cost:\n  print("買えました")\nelse:\n  print("お金が足りません")`);
      updateMemoryHUD(`money = 1000`); break;
    case 11:
      setCodeMonitor(`x = input()\ny = input()\nprint(int(x) + int(y))`);
      updateMemoryHUD(`x = ?, y = ?`); break;
    case 12:
      setCodeMonitor(`if x % 3 == 0:\n  print("3の倍数です")\nelse:\n  print("3の倍数ではありません")`);
      updateMemoryHUD(`x = ?`); break;
  }
}

// === Matter.js Physics ===
const Engine = Matter.Engine, Render = Matter.Render, Runner = Matter.Runner,
      World = Matter.World, Bodies = Matter.Bodies, Body = Matter.Body;

const engine = Engine.create();
const world = engine.world;
world.gravity.y = 0.2;

let w = window.innerWidth, h = window.innerHeight;
const ground = Bodies.rectangle(w/2, h+50, w*2, 100, { isStatic: true });
const leftWall = Bodies.rectangle(-50, h/2, 100, h*2, { isStatic: true });
const rightWall = Bodies.rectangle(w+50, h/2, 100, h*2, { isStatic: true });
World.add(world, [ground, leftWall, rightWall]);

window.addEventListener('resize', () => {
  w = window.innerWidth;
  h = window.innerHeight;
  Body.setPosition(ground, {x: w/2, y: h+50});
  Body.setPosition(leftWall, {x: -50, y: h/2});
  Body.setPosition(rightWall, {x: w+50, y: h/2});
});

Runner.run(Runner.create(), engine);

let domBodies = [];
Matter.Events.on(engine, 'afterUpdate', () => {
  domBodies.forEach(obj => {
    obj.elem.style.transform = `translate(${obj.body.position.x - obj.w/2}px, ${obj.body.position.y - obj.h/2}px) rotate(${obj.body.angle}rad)`;
  });
});

// Collision Gimmicks
Matter.Events.on(engine, 'collisionStart', (event) => {
  event.pairs.forEach(pair => {
    const a = pair.bodyA.label, b = pair.bodyB.label;
    if(a === 'falseWall' || b === 'falseWall') {
      playReject();
      const char = a === 'falseWall' ? pair.bodyB : pair.bodyA;
      if(char.label === 'oddChar') {
        const pos = { ...char.position };
        removeBody(char.id);
        for(let i=0; i<6; i++) {
          const shard = spawnDOM('💥', pos.x, pos.y, {isEmoji: true});
          Body.setVelocity(shard.body, {x: (Math.random()-0.5)*30, y: (Math.random()-0.5)*30});
        }
      } else {
        Body.setVelocity(char, {x: (Math.random()>0.5?20:-20), y: -15});
      }
    }
    if(a === 'trueWallSolid' || b === 'trueWallSolid') {
      playTone(1000, 'sine', 0.1); 
    }
  });
});

function spawnDOM(text, x, y, opts = {}) {
  const div = document.createElement('div');
  div.className = 'phys-obj ' + (opts.classes || '');
  if(opts.isEmoji) div.classList.add('emoji');
  if(opts.color && !opts.isEmoji) {
    div.style.borderColor = opts.color; div.style.color = opts.color; div.style.boxShadow = `0 0 20px ${opts.color}aa`;
  }
  div.innerHTML = text;
  document.getElementById('world').appendChild(div);
  
  div.style.transform = 'translate(-1000px, -1000px)';
  const rect = div.getBoundingClientRect();
  const width = opts.w || rect.width;
  const height = opts.h || rect.height;
  if(opts.w) div.style.width = width+'px';
  if(opts.h) div.style.height = height+'px';
  
  const body = Bodies.rectangle(x, y, width, height, {
    isStatic: opts.isStatic || false,
    isSensor: opts.isSensor || false,
    restitution: opts.restitution || 0.8,
    label: opts.label || 'box',
    density: opts.isEmoji ? 0.001 : 0.005
  });
  if(opts.angle) Body.setAngle(body, opts.angle);
  
  World.add(world, body);
  domBodies.push({ id: body.id, body, elem: div, w: width, h: height });
  gsap.from(div, { opacity: 0, scale: 0.5, duration: 0.4, ease: 'back.out(2)' });
  return { body, elem: div };
}

function spawnWall(x, y, isTrue, isSolid=false) {
  return spawnDOM('', x, y, {
    w: 20, h: 250, isStatic: true, isSensor: isTrue && !isSolid,
    classes: 'laser-wall ' + (isTrue ? 'true-wall' : 'false-wall'),
    label: isTrue ? (isSolid ? 'trueWallSolid' : 'trueWall') : 'falseWall'
  });
}

function removeBody(id) {
  const idx = domBodies.findIndex(b => b.id === id);
  if(idx > -1) {
    World.remove(world, domBodies[idx].body);
    domBodies[idx].elem.remove();
    domBodies.splice(idx, 1);
  }
}

function clearWorld() {
  domBodies.forEach(b => { World.remove(world, b.body); b.elem.remove(); });
  domBodies = [];
  if(window.mergeUpdate) Matter.Events.off(engine, 'beforeUpdate', window.mergeUpdate);
  world.gravity.y = 0.2;
}

// === Step Logic ===

function runStep1(score) {
  clearWorld();
  updateMemoryHUD(`score = ${score}`);
  highlightLine(0);
  const isTrue = score === 100;
  spawnWall(w/2, h/2 + 50, isTrue);
  const char = spawnDOM('👨‍🚀', w/2, -50, {isEmoji: true});
  
  setTimeout(() => {
    if(isTrue) {
      highlightLine(1); playSuccess();
      const txt = spawnDOM('print("Very good!")', w/2, h/2 - 100, {color: '#8be9fd', classes: 'code-obj'});
    } else {
      highlightLine(3);
      // Wait for bounce
      setTimeout(() => spawnDOM('print("Bad!")', char.body.position.x, char.body.position.y-50, {color: '#ff5555', classes: 'code-obj'}), 500);
    }
  }, 800);
}

function runStep2(correct) {
  clearWorld();
  updateMemoryHUD(`x = 10`);
  if(correct) {
    setCodeMonitor(`x = 10\nif x == 10:\n  print("Yes!")`);
    highlightLine([1]);
    setTimeout(()=>{
      highlightLine(2); playSuccess(); 
      spawnDOM('print("Yes!")', w/2, h/2-100, {color: '#8be9fd', classes: 'code-obj'});
    }, 800);
  } else {
    setCodeMonitor(`x = 10\nif x == 10:\nprint("Yes!")`);
    highlightLine([1]);
    setTimeout(()=>{
      highlightLine(2); playAlarm();
      const err = spawnDOM('IndentationError', w/2, h/2, {color: '#ff5555', classes: 'code-obj'});
      const robo = spawnDOM('🤖', w+100, h/2, {isEmoji: true, isStatic: true});
      gsap.to(robo.body.position, {x: w/2 + 100, duration: 0.4, onComplete: () => {
        Body.setStatic(err.body, false); Body.setStatic(robo.body, false);
        Body.setVelocity(err.body, {x: -30, y: -10}); Body.setVelocity(robo.body, {x: -30, y: -10});
      }});
    }, 800);
  }
}

function runStep3(val) {
  clearWorld();
  highlightLine(val===10 ? 1 : 2);
  if(val === 10) {
    playSuccess();
    spawnDOM('print(True)', w/2, -100, {color: '#8be9fd', w: 300, h: 100, classes: 'code-obj'});
  } else {
    playReject();
    spawnDOM('print(False)', w/2, -100, {color: '#ff5555', w: 300, h: 100, classes: 'code-obj'});
  }
}

function runStep4() {
  clearWorld();
  const val = parseInt(document.getElementById('s4-in').value);
  updateMemoryHUD(`x = ${val}`);
  highlightLine(0);
  const isTrue = val > 5;
  spawnWall(w/2, h/2, isTrue);
  spawnDOM('🍎', w/2, -50, {isEmoji: true});
  
  setTimeout(() => {
    if(isTrue) {
      highlightLine(1); playSuccess();
      spawnDOM('print("xは5より大きい")', w/2, h/2-100, {color: '#8be9fd', classes: 'code-obj'});
    }
  }, 800);
}

function runStep5() {
  clearWorld();
  const val = parseInt(document.getElementById('s5-in').value);
  updateMemoryHUD(`score = ${val}`);
  highlightLine(0);
  spawnDOM('True Route', w/2 - 200, h/2, {isStatic: true, color: '#8be9fd', angle: 0.4, w: 300});
  spawnDOM('False Route', w/2 + 200, h/2, {isStatic: true, color: '#ff5555', angle: -0.4, w: 300});
  spawnDOM('👨‍🚀', w/2 + (val > 80 ? -50 : 50), -50, {isEmoji: true});
  
  setTimeout(() => {
    if(val > 80) {
      highlightLine(1); playSuccess();
      spawnDOM('print("よくできました")', w/4, h/2+100, {color: '#8be9fd', classes: 'code-obj'});
    } else {
      highlightLine(3); playReject();
      spawnDOM('print("残念でした")', 3*w/4, h/2+100, {color: '#ff5555', classes: 'code-obj'});
    }
  }, 800);
}

function runStep6() {
  clearWorld();
  const val = parseInt(document.getElementById('s6-in').value);
  updateMemoryHUD(`score = ${val}`);
  
  spawnDOM('> 80', w/4, h-100, {isStatic: true, color: '#8be9fd'});
  spawnDOM('elif > 50', w/2, h-100, {isStatic: true, color: '#f1fa8c'});
  spawnDOM('else', 3*w/4, h-100, {isStatic: true, color: '#ff5555'});
  const posX = val > 80 ? w/4 : (val > 50 ? w/2 : 3*w/4);
  spawnDOM('👨‍🚀', posX, -50, {isEmoji: true});
  
  if(val > 80) highlightLine(0);
  else if(val > 50) highlightLine(2);
  else highlightLine(4);
  
  setTimeout(() => {
    playSuccess();
    if(val > 80) { highlightLine(1); spawnDOM('print("よくできました")', w/4, h/2, {color: '#8be9fd', classes: 'code-obj'}); }
    else if(val > 50) { highlightLine(3); spawnDOM('print("まずまずです")', w/2, h/2, {color: '#f1fa8c', classes: 'code-obj'}); }
    else { highlightLine(5); spawnDOM('print("残念でした")', 3*w/4, h/2, {color: '#ff5555', classes: 'code-obj'}); }
  }, 600);
}

function runStep7(type) {
  clearWorld();
  const val = parseInt(document.getElementById('s7-in').value);
  updateMemoryHUD(`time = ${val}`);
  let op1 = false, op2 = false;
  if(type === 'and') { op1 = val > 9; op2 = val < 17; highlightLine(1); }
  else { op1 = val === 10; op2 = val === 15; highlightLine(3); }
  
  spawnWall(w/2, 250, op1);
  spawnWall(w/2, 600, op2);
  spawnDOM('👨‍🚀', w/2, -50, {isEmoji: true});
  
  setTimeout(() => {
    if(op1 && op2 && type==='and') { highlightLine(2); playSuccess(); spawnDOM('print("就業時間です")', w/2, h-100, {color:'#8be9fd', classes:'code-obj'}); }
    if((op1 || op2) && type==='or') { highlightLine(4); playSuccess(); spawnDOM('print("おやつ")', w/2, h-100, {color:'#8be9fd', classes:'code-obj'}); }
  }, 1000);
}

function runStep8() {
  clearWorld();
  const count = parseInt(document.getElementById('s8-in').value);
  updateMemoryHUD(`apple_price = 100<br>count = ${count}`);
  highlightLine(1);
  for(let i=0; i<count; i++) {
    setTimeout(() => spawnDOM('🍎', w/2 + (Math.random()*200-100), -50, {isEmoji: true}), i*150);
  }
  setTimeout(() => {
    highlightLine([2,3]);
    spawnDOM(`print(${count*100})`, w/2, h-150, {color: '#8be9fd', classes: 'code-obj'});
    playSuccess();
  }, count*150 + 500);
}

function runStep9() {
  clearWorld();
  const val = parseInt(document.getElementById('s9-in').value);
  updateMemoryHUD(`x = ${val}`);
  highlightLine(0);
  const isEven = val % 2 === 0;
  spawnWall(w/2, h/2 + 100, isEven, true); 
  const char = spawnDOM('🍎', w/2, -50, {isEmoji: true, label: isEven ? 'char' : 'oddChar'});
  
  setTimeout(() => {
    if(isEven) {
      highlightLine(1);
      spawnDOM('print("偶数です")', w/2, h/2-100, {color: '#8be9fd', classes: 'code-obj'});
    } else {
      highlightLine(3);
      spawnDOM('print("奇数です")', w/2, h/2-100, {color: '#ff5555', classes: 'code-obj'});
    }
  }, 800);
}

function runStep10() {
  clearWorld();
  const count = parseInt(document.getElementById('s10-in').value);
  updateMemoryHUD(`money = 1000<br>cost = ${count * 100}`);
  highlightLine([1, 2]);
  if (count * 100 <= 1000) {
    setTimeout(() => {
      highlightLine(3); playSuccess();
      const purse = spawnDOM('👛', w/2, h/2+100, {isEmoji: true, isStatic: true});
      gsap.to(purse.elem, {scale: 3, duration: 0.5, yoyo: true, repeat: 1});
      spawnDOM('print("買えました")', w/2, h/2-100, {color: '#8be9fd', classes: 'code-obj'});
    }, 500);
  } else {
    setTimeout(() => {
      highlightLine(5); playAlarm();
      world.gravity.y = -0.3;
      document.getElementById('s10-recover').style.display = 'inline-block';
      spawnDOM('print("お金が足りません")', w/2, h/2-100, {color: '#ff5555', classes: 'code-obj', w:350});
      for(let i=0; i<25; i++) {
        spawnDOM('💸', w/2 + (Math.random()-0.5)*300, h/2 + (Math.random()-0.5)*300, {isEmoji: true});
      }
    }, 500);
  }
}

function recoverAntiGravity() {
  document.getElementById('s10-recover').style.display = 'none';
  clearWorld();
  playTone(1800, 'sine', 0.1);
  setupCodeForStep(currentStep);
}

function runStep11() {
  clearWorld();
  if(window.mergeUpdate) Matter.Events.off(engine, 'beforeUpdate', window.mergeUpdate);
  const vx = parseInt(document.getElementById('s11-x').value);
  const vy = parseInt(document.getElementById('s11-y').value);
  updateMemoryHUD(`x = ${vx}, y = ${vy}`);
  highlightLine([0, 1]);
  
  const b1 = spawnDOM(vx, w/4, h/2, {color: '#0ff'});
  const b2 = spawnDOM(vy, 3*w/4, h/2, {color: '#f0f'});
  b1.body.gravityScale = 0; b2.body.gravityScale = 0; world.gravity.y = 0;
  
  window.mergeUpdate = () => {
    Body.applyForce(b1.body, b1.body.position, {x: ((w/2)-b1.body.position.x)*0.00005, y: ((h/2)-b1.body.position.y)*0.00005});
    Body.applyForce(b2.body, b2.body.position, {x: ((w/2)-b2.body.position.x)*0.00005, y: ((h/2)-b2.body.position.y)*0.00005});
    if(Matter.Vector.magnitude(Matter.Vector.sub(b1.body.position, b2.body.position)) < 60) {
       Matter.Events.off(engine, 'beforeUpdate', window.mergeUpdate);
       removeBody(b1.id); removeBody(b2.id);
       highlightLine(2);
       const sum = spawnDOM(`print(${vx+vy})`, w/2, h/2, {color: '#8be9fd', classes: 'code-obj'});
       gsap.from(sum.elem, {scale: 4, duration: 1, ease: 'elastic.out(1, 0.3)'});
       playSuccess(); world.gravity.y = 0.2;
    }
  };
  Matter.Events.on(engine, 'beforeUpdate', window.mergeUpdate);
}

function runStep12() {
  clearWorld();
  const val = parseInt(document.getElementById('s12-in').value);
  updateMemoryHUD(`x = ${val}`);
  highlightLine(0);
  if (val % 3 === 0) {
    setTimeout(() => {
      highlightLine(1); playSuccess();
      spawnDOM('print("3の倍数です")', w/2, h/2, {color: '#8be9fd', classes: 'code-obj'});
      let i = 0;
      const intv = setInterval(() => {
        document.body.style.backgroundColor = `hsl(${Math.random()*360}, 100%, 30%)`;
        if(i++ > 15) { clearInterval(intv); document.body.style.backgroundColor = '#050510'; }
      }, 100);
    }, 500);
  } else {
    setTimeout(() => {
      highlightLine(3); playReject();
      spawnDOM('print("3の倍数ではありません")', w/2, h/2, {color: '#ff5555', classes: 'code-obj'});
      document.body.style.transition = 'background-color 1s';
      document.body.style.backgroundColor = '#000';
      setTimeout(() => {
        document.body.style.transition = 'none';
        document.body.style.backgroundColor = '#050510';
      }, 1500);
    }, 500);
  }
}

updateStep();
