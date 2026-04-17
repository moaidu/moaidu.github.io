"use strict";
const svgNS = "http://www.w3.org/2000/svg";

// =====================================================================
// 공통 기하 데이터
// =====================================================================
const pieceDefs = [
    { id: 't1',   color: '#ff6b6b', pts: '-100,-50 100,-50 0,50' },
    { id: 't2',   color: '#4ecdc4', pts: '-100,-50 100,-50 0,50' },
    { id: 't3',   color: '#ffe66d', pts: '25,-50 25,50 -25,0' },
    { id: 't4',   color: '#1a535c', pts: '50,-50 50,50 -50,50' },
    { id: 'sq',   color: '#ffb8d1', pts: '-50,0 0,-50 50,0 0,50' },
    { id: 't5',   color: '#88d49e', pts: '25,-50 25,50 -25,0' },
    { id: 'para', color: '#118ab2', pts: '-75,25 -25,-25 75,-25 25,25' }
];

const baseLayout = [
    { id: 't1',   dx: 100, dy: 50,  a: 0   },
    { id: 't2',   dx: 50,  dy: 100, a: 270 },
    { id: 't3',   dx: 175, dy: 50,  a: 0   },
    { id: 't4',   dx: 150, dy: 150, a: 0   },
    { id: 'sq',   dx: 150, dy: 100, a: 0   },
    { id: 't5',   dx: 100, dy: 125, a: 90  },
    { id: 'para', dx: 75,  dy: 175, a: 0   }
];

const puzzles = {
    easy: [
        { id: 't1', dx: 100, dy: 50, a: 0 },
        { id: 't2', dx: 50, dy: 100, a: 270 },
        { id: 't3', dx: 175, dy: 50, a: 0 },
        { id: 't4', dx: 150, dy: 150, a: 0 },
        { id: 'sq', dx: 150, dy: 100, a: 0 },
        { id: 't5', dx: 100, dy: 125, a: 90 },
        { id: 'para', dx: 75, dy: 175, a: 0 }
    ],
    medium: [
        { id: 't1', dx: 0, dy: 150, a: 90 },
        { id: 't2', dx: 150, dy: 0, a: 360 },
        { id: 't3', dx: 75, dy: 200, a: 180 },
        { id: 't4', dx: 100, dy: 100, a: 180 },
        { id: 'sq', dx: 100, dy: 150, a: 180 },
        { id: 't5', dx: 150, dy: 125, a: 270 },
        { id: 'para', dx: 175, dy: 75, a: 180 }
    ],
    hard: []
};

const tutorialPuzzles = {
    tut_move: [{ id: 't1', dx: 50, dy: 50, a: 0, msg: "자, '빨간색' 조각을 잡아보세요. 꾹 누른 채로 중앙으로 옮겨볼까요?" }],
    tut_rotate: [{ id: 't4', dx: 50, dy: 50, a: 180, msg: "조각의 방향이 안 맞네요! 조각을 가볍게 '톡!' 클릭해서 회전시켜보세요." }],
    tut_square: [
        { id: 't1', dx: 0, dy: -50, a: 0, msg: "마지막 단계! 7개 조각을 모두 써서 커다란 정사각형을 만들어봐요." },
        { id: 't2', dx: -50, dy: 0, a: 270 },
        { id: 'sq', dx: 50, dy: 0, a: 45 },
        { id: 't4', dx: 50, dy: 50, a: 180 },
        { id: 't3', dx: 0, dy: 25, a: 180 },
        { id: 't5', dx: -25, dy: 50, a: 90 },
        { id: 'para', dx: -50, dy: 75, a: 0 }
    ]
};

const communityFavorites = {
    "Swan":  [
        {id:"t1",dx:43,dy:52,a:135},{id:"t2",dx:113,dy:123,a:135},{id:"t3",dx:-2,dy:-13,a:225},
        {id:"t4",dx:0,dy:148,a:180},{id:"sq",dx:43,dy:-7,a:225},{id:"t5",dx:113,dy:202,a:90},
        {id:"para",dx:169,dy:202,a:180}
    ],
    "Cat":   [
        {id:"t1",dx:75,dy:125,a:180},{id:"t2",dx:175,dy:125,a:180},{id:"t3",dx:100,dy:0,a:135},
        {id:"t4",dx:125,dy:200,a:90},{id:"sq",dx:125,dy:75,a:0},{id:"t5",dx:150,dy:0,a:225},
        {id:"para",dx:200,dy:200,a:135}
    ],
    "Boat":  [
        {id:"t1",dx:50,dy:100,a:90},{id:"t2",dx:150,dy:100,a:90},{id:"t3",dx:150,dy:0,a:90},
        {id:"t4",dx:100,dy:150,a:180},{id:"sq",dx:100,dy:200,a:0},{id:"t5",dx:175,dy:175,a:270},
        {id:"para",dx:75,dy:175,a:270}
    ],
    "Heart": [
        {id:"t1",dx:50,dy:75,a:45},{id:"t2",dx:150,dy:75,a:315},{id:"t3",dx:100,dy:0,a:180},
        {id:"t4",dx:100,dy:125,a:180},{id:"sq",dx:100,dy:75,a:45},{id:"t5",dx:75,dy:25,a:45},
        {id:"para",dx:125,dy:25,a:315}
    ]
};

let customPuzzles = {};
let currentPlayerName = "게스트";

// =====================================================================
// AnalyticsEngine — TangramEngine 보다 먼저 선언 필수
// =====================================================================
class AnalyticsEngine {
    constructor(engine) {
        this.engine = engine;
        this.sessionStart = 0;
        this.history = [];
        this.pieceStats = {};
    }
    startLevel(level) {
        this.sessionStart = Date.now();
        this.history = [];
        this.pieceStats = {};
        pieceDefs.forEach(d => {
            this.pieceStats[d.id] = { moves: 0, rotations: 0, failedSnaps: 0, firstTouched: false };
        });
    }
    logFirstTouch(id) {
        if (this.pieceStats[id] && !this.pieceStats[id].firstTouched) {
            this.pieceStats[id].firstTouched = true;
            this.history.push({ timeMs: this.getT(), action: 'FIRST_TOUCH', piece: id });
        }
    }
    logMove(id)         { if (this.pieceStats[id]) this.pieceStats[id].moves++; }
    logRotate(id)       {
        if (!this.pieceStats[id]) return;
        this.pieceStats[id].rotations++;
        this.history.push({ timeMs: this.getT(), action: 'ROTATE', piece: id });
    }
    logFailedSnap(id, dist) {
        if (!this.pieceStats[id]) return;
        this.pieceStats[id].failedSnaps++;
        this.history.push({ timeMs: this.getT(), action: 'FAILED_SNAP', piece: id, distance: Math.round(dist) });
    }
    logSnap(id) { this.history.push({ timeMs: this.getT(), action: 'SNAPPED', piece: id }); }
    getT()      { return Date.now() - this.sessionStart; }
    finish()    {
        return {
            level: this.engine.currentLevel,
            totalTimeSeconds: (this.getT() / 1000).toFixed(1),
            pieceData: this.pieceStats,
            timeline: this.history
        };
    }
}

// =====================================================================
// TangramEngine — 독립적인 게임 캔버스 인스턴스
// =====================================================================
class TangramEngine {
    constructor(config) {
        this.id               = config.id || 'main';
        this.canvas           = document.getElementById(config.canvasId);
        this.piecesGroup      = document.getElementById(config.piecesGroupId);
        this.silhouetteGroup  = document.getElementById(config.silhouetteGroupId);
        this.guidePanel       = config.guidePanelId ? document.getElementById(config.guidePanelId) : null;
        this.fogLayer         = config.fogLayerId   ? document.getElementById(config.fogLayerId)   : null;

        this.pieces          = [];
        this.selectedPiece   = null;
        this.isDragging      = false;
        this.currentLevel    = 'easy';
        this.dragObj         = { startX:0, startY:0, initTx:0, initTy:0, moved:false };
        this.puzzleCompleted = false;
        this.isCreatorMode   = false;
        this.lastTouchTime   = 0;
        this.silOffsetX = 0; this.silOffsetY = 0;
        this.palOffsetX = 0; this.palOffsetY = 0;
        this.isBattle        = config.isBattle || false;
        this.items           = { peek: 3, hint: 1 };
        this.analytics       = new AnalyticsEngine(this);
        this.audioCtx        = null;

        this._init();
    }

    _init() {
        this._updateLayout();
        this._createPieces();
        this._setupEvents();
    }

    _updateLayout() {
        if (!this.canvas) return;
        if (this.isBattle) {
            this.canvas.setAttribute('viewBox', '0 0 600 800');
            this.silOffsetX = 200; this.silOffsetY = 150;
            this.palOffsetX = 200; this.palOffsetY = 500;
        } else {
            const w = window.innerWidth, h = window.innerHeight;
            if (w > h * 1.1) {
                this.canvas.setAttribute('viewBox', '0 0 1200 600');
                this.silOffsetX = 200; this.silOffsetY = 200;
                this.palOffsetX = 800; this.palOffsetY = 200;
            } else {
                this.canvas.setAttribute('viewBox', '0 0 600 800');
                this.silOffsetX = 200; this.silOffsetY = 150;
                this.palOffsetX = 200; this.palOffsetY = 500;
            }
        }
    }

    _createPieces() {
        if (!this.piecesGroup) return;
        this.piecesGroup.innerHTML = '';
        this.pieces = [];
        baseLayout.forEach(base => {
            const def = pieceDefs.find(p => p.id === base.id);
            const g   = document.createElementNS(svgNS, 'g');
            g.classList.add('tangram-piece');

            const poly = document.createElementNS(svgNS, 'polygon');
            poly.setAttribute('points', def.pts);
            poly.setAttribute('fill', def.color);
            poly.setAttribute('stroke', def.color);
            poly.setAttribute('stroke-width', '2.5');
            poly.setAttribute('stroke-linejoin', 'round');

            g.appendChild(poly);
            this.piecesGroup.appendChild(g);
            this.pieces.push({ el: g, id: base.id, def, x: 0, y: 0, angle: 0 });
        });
    }

    updateLayout() { this._updateLayout(); }

    loadSilhouette(level) {
        this.currentLevel = level;
        if (!this.silhouetteGroup) return;
        this.silhouetteGroup.innerHTML = '';

        if (this.isCreatorMode) {
            this.silhouetteGroup.removeAttribute('transform');
            return;
        }

        const layout =
            tutorialPuzzles[level] ||
            (level === 'hard' ? puzzles.easy : puzzles[level]) ||
            customPuzzles[level] ||
            communityFavorites[level] ||
            [];

        this._updateGuideText(level);

        layout.forEach(pData => {
            const def  = pieceDefs.find(p => p.id === pData.id);
            if (!def) return;
            const g    = document.createElementNS(svgNS, 'g');
            const poly = document.createElementNS(svgNS, 'polygon');
            poly.setAttribute('points', def.pts);
            poly.setAttribute('fill', '#dcdde1');
            poly.setAttribute('stroke-linejoin', 'round');
            poly.setAttribute('stroke-width', '2');
            poly.setAttribute('stroke', level === 'easy' ? '#718093' : '#dcdde1');
            g.appendChild(poly);
            g.setAttribute('transform',
                `translate(${pData.dx + this.silOffsetX}, ${pData.dy + this.silOffsetY}) rotate(${pData.a})`);
            this.silhouetteGroup.appendChild(g);
        });

        if (level === 'hard') {
            const cx = this.silOffsetX + 100, cy = this.silOffsetY + 100;
            this.silhouetteGroup.setAttribute('transform', `rotate(45,${cx},${cy})`);
        } else {
            this.silhouetteGroup.removeAttribute('transform');
        }
    }

    resetPositions() {
        this.pieces.forEach(p => {
            const base = baseLayout.find(b => b.id === p.id);
            p.x = base.dx + this.palOffsetX;
            p.y = base.dy + this.palOffsetY;
            p.angle = base.a;
            this._applyTransform(p);
        });
        this.selectPiece(null);
        this.puzzleCompleted = false;
        this.analytics.startLevel(this.currentLevel);
    }

    _applyTransform(p) {
        p.el.setAttribute('transform', `translate(${p.x},${p.y}) rotate(${p.angle})`);
    }

    selectPiece(pieceObj) {
        this.pieces.forEach(p => p.el.classList.remove('selected'));
        this.selectedPiece = pieceObj;
        if (this.selectedPiece) {
            this.selectedPiece.el.classList.add('selected');
            this.piecesGroup.appendChild(this.selectedPiece.el);
        }
    }

    _getPointerPos(e) {
        if (!this.canvas) return { x: 0, y: 0 };
        const pt = this.canvas.createSVGPoint();
        if (e.touches && e.touches.length > 0) {
            pt.x = e.touches[0].clientX; pt.y = e.touches[0].clientY;
        } else {
            pt.x = e.clientX; pt.y = e.clientY;
        }
        return pt.matrixTransform(this.canvas.getScreenCTM().inverse());
    }

    _setupEvents() {
        this.pieces.forEach(p => {
            const onStart = e => {
                if (e.type === 'touchstart') this.lastTouchTime = Date.now();
                else if (e.type === 'mousedown' && Date.now() - this.lastTouchTime < 500) return;
                e.preventDefault();
                this.selectPiece(p);
                this.isDragging = true;
                const pos = this._getPointerPos(e);
                this.dragObj = { startX: pos.x, startY: pos.y, initTx: p.x, initTy: p.y, moved: false };
                this.analytics.logFirstTouch(p.id);
                this.analytics.logMove(p.id);
            };
            p.el.addEventListener('mousedown',  onStart, { passive: false });
            p.el.addEventListener('touchstart', onStart, { passive: false });
        });

        const onMove = e => {
            if (!this.isDragging || !this.selectedPiece) return;
            e.preventDefault();
            const pos = this._getPointerPos(e);
            const dx  = pos.x - this.dragObj.startX;
            const dy  = pos.y - this.dragObj.startY;
            if (Math.abs(dx) > 5 || Math.abs(dy) > 5) this.dragObj.moved = true;
            this.selectedPiece.x = this.dragObj.initTx + dx;
            this.selectedPiece.y = this.dragObj.initTy + dy;
            this._applyTransform(this.selectedPiece);
        };

        const onEnd = e => {
            if (!this.isDragging) return;
            if (e.type === 'mouseup' && Date.now() - this.lastTouchTime < 500) { this.isDragging = false; return; }
            e.preventDefault();
            this.isDragging = false;
            if (!this.dragObj.moved && this.selectedPiece) {
                this.selectedPiece.angle = (this.selectedPiece.angle + 45) % 360;
                this._applyTransform(this.selectedPiece);
                this.analytics.logRotate(this.selectedPiece.id);
            }
            if (this.selectedPiece && !this.isCreatorMode) this._evaluateSnap(this.selectedPiece);
        };

        window.addEventListener('mousemove', onMove, { passive: false });
        window.addEventListener('touchmove', onMove, { passive: false });
        window.addEventListener('mouseup',   onEnd);
        window.addEventListener('touchend',  onEnd);
    }

    _updateGuideText(level) {
        if (!this.guidePanel) return;
        this.guidePanel.classList.add('hidden');
        const msg = tutorialPuzzles[level] ? tutorialPuzzles[level][0].msg : '';
        if (msg) {
            this.guidePanel.querySelector('.guide-text').textContent = msg;
            this.guidePanel.classList.remove('hidden');
        }
    }

    _evaluateSnap(piece) {
        const effectiveLevel = this.currentLevel === 'hard' ? 'easy' : this.currentLevel;
        const layout =
            puzzles[effectiveLevel] ||
            customPuzzles[effectiveLevel] ||
            communityFavorites[effectiveLevel];
        if (!layout) return;

        const eqIds = this._getEquivalentIds(piece.id);
        const targets = layout.filter(pd => eqIds.includes(pd.id));
        const cx = this.silOffsetX + 100, cy = this.silOffsetY + 100;
        const validTargets = [];

        targets.forEach(tp => {
            if (this.currentLevel === 'hard') {
                for (let i = 0; i < 4; i++) {
                    const rad = (45 + i * 90) * Math.PI / 180;
                    const ox = tp.dx + this.silOffsetX - cx;
                    const oy = tp.dy + this.silOffsetY - cy;
                    validTargets.push({
                        tX: ox * Math.cos(rad) - oy * Math.sin(rad) + cx,
                        tY: ox * Math.sin(rad) + oy * Math.cos(rad) + cy,
                        tA: tp.a + 45 + i * 90
                    });
                }
            } else {
                validTargets.push({
                    tX: tp.dx + this.silOffsetX,
                    tY: tp.dy + this.silOffsetY,
                    tA: tp.a
                });
            }
        });

        for (const t of validTargets) {
            const normA  = (piece.angle % 360 + 360) % 360;
            const normTA = (t.tA % 360 + 360) % 360;
            const diff   = Math.abs(normA - normTA);
            let angleOk  = false;
            if      (piece.id === 'sq')   angleOk = diff % 90  < 3 || diff % 90  > 87;
            else if (piece.id === 'para') angleOk = diff % 180 < 3 || diff % 180 > 177;
            else                          angleOk = diff < 3 || diff > 357;

            const dist = Math.hypot(piece.x - t.tX, piece.y - t.tY);
            if (dist < 60 && angleOk) {
                piece.x = t.tX; piece.y = t.tY;
                this._applyTransform(piece);
                this._playSnap(piece);
                this.analytics.logSnap(piece.id);
                this._checkCompletion();
                return;
            } else if (dist < 85) {
                this.analytics.logFailedSnap(piece.id, dist);
            }
        }
    }

    _getEquivalentIds(id) {
        const groups = [['t1','t2'], ['t3','t5']];
        const g = groups.find(gr => gr.includes(id));
        return g || [id];
    }

    _playSnap(piece) {
        if (navigator.vibrate) navigator.vibrate(25);
        piece.el.classList.add('snap-flash');
        setTimeout(() => piece.el.classList.remove('snap-flash'), 250);
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        if (!this.audioCtx) this.audioCtx = new AC();
        if (this.audioCtx.state === 'suspended') this.audioCtx.resume();
        const now = this.audioCtx.currentTime;
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(1200, now + 0.1);
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.4, now + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        osc.connect(gain); gain.connect(this.audioCtx.destination);
        osc.start(); osc.stop(now + 0.1);
    }

    _checkCompletion() {
        if (this.isCreatorMode || this.puzzleCompleted) return;
        const cx = this.silOffsetX + 100, cy = this.silOffsetY + 100;
        const effectiveLevel = this.currentLevel === 'hard' ? 'easy' : this.currentLevel;
        const layout =
            puzzles[effectiveLevel] ||
            customPuzzles[effectiveLevel] ||
            communityFavorites[effectiveLevel] ||
            tutorialPuzzles[this.currentLevel];
        if (!layout) return;

        const rotOffsets = this.currentLevel === 'hard' ? [45,135,225,315] : [0];

        for (const angleOff of rotOffsets) {
            const remaining = layout.map(pd => ({...pd}));
            let matched = 0;
            this.pieces.forEach(p => {
                const eqIds = this._getEquivalentIds(p.id);
                for (let j = 0; j < remaining.length; j++) {
                    const tp = remaining[j];
                    if (!eqIds.includes(tp.id)) continue;
                    const rad = angleOff * Math.PI / 180;
                    const ox  = tp.dx + this.silOffsetX - cx;
                    const oy  = tp.dy + this.silOffsetY - cy;
                    const tX  = ox * Math.cos(rad) - oy * Math.sin(rad) + cx;
                    const tY  = ox * Math.sin(rad) + oy * Math.cos(rad) + cy;
                    const tA  = tp.a + angleOff;
                    const diff = Math.abs((p.angle%360+360)%360 - (tA%360+360)%360);
                    let aOk = false;
                    if      (p.id==='sq')   aOk = diff%90  < 6 || diff%90  > 84;
                    else if (p.id==='para') aOk = diff%180 < 6 || diff%180 > 174;
                    else                    aOk = diff < 6 || diff > 354;
                    if (Math.hypot(p.x-tX, p.y-tY) < 45 && aOk) {
                        matched++;
                        remaining.splice(j, 1);
                        break;
                    }
                }
            });
            if (matched === 7) {
                this.puzzleCompleted = true;
                if (this.isBattle) BattleManager.onPlayerWin(this.id);
                else               triggerSuccessFeedback();
                return;
            }
        }
    }

    useItem(type) {
        if (type === 'peek' && this.items.peek > 0) {
            this.items.peek--;
            if (this.fogLayer) {
                this.fogLayer.classList.add('revealed');
                setTimeout(() => this.fogLayer.classList.remove('revealed'), 1500);
            }
            return this.items.peek;
        }
        if (type === 'hint' && this.items.hint > 0) {
            this.items.hint--;
            this.silhouetteGroup.querySelectorAll('g').forEach(g => {
                g.classList.add('hint-flash');
                setTimeout(() => g.classList.remove('hint-flash'), 3000);
            });
            return this.items.hint;
        }
        return -1;
    }
}

// =====================================================================
// BattleManager
// =====================================================================
const BattleManager = {
    p1: null, p2: null, timerInterval: null, isActive: false,

    startBattle() {
        this.isActive = true;
        document.getElementById('battle-view').classList.remove('hidden');
        const lvls = ['easy','medium'];
        const lv   = lvls[Math.floor(Math.random() * lvls.length)];

        this.p1 = new TangramEngine({ id:'p1', canvasId:'canvas-p1', piecesGroupId:'pieces-p1', silhouetteGroupId:'sil-p1', fogLayerId:'fog-p1', isBattle:true });
        this.p2 = new TangramEngine({ id:'p2', canvasId:'canvas-p2', piecesGroupId:'pieces-p2', silhouetteGroupId:'sil-p2', fogLayerId:'fog-p2', isBattle:true });
        this.p1.loadSilhouette(lv); this.p2.loadSilhouette(lv);
        this.p1.resetPositions();   this.p2.resetPositions();
        this._countdown();
    },

    _countdown() {
        let n = 3;
        const el = document.getElementById('battle-countdown');
        el.textContent = n;
        document.getElementById('fog-p1').classList.add('revealed');
        document.getElementById('fog-p2').classList.add('revealed');
        this.timerInterval = setInterval(() => {
            n--;
            if (n <= 0) {
                clearInterval(this.timerInterval);
                el.textContent = 'GO!';
                document.getElementById('fog-p1').classList.remove('revealed');
                document.getElementById('fog-p2').classList.remove('revealed');
            } else {
                el.textContent = n;
            }
        }, 1000);
    },

    onPlayerWin(playerId) {
        if (!this.isActive) return;
        this.isActive = false;
        clearInterval(this.timerInterval);
        document.getElementById('winner-text').textContent = `${playerId.toUpperCase()} WIN! 🎉`;
        document.getElementById('battle-result-modal').classList.remove('hidden');
        const engine = playerId === 'p1' ? this.p1 : this.p2;
        if (engine) engine.pieces.forEach(p => p.el.classList.add('success-glow'));
        _playFanfare(engine ? engine.audioCtx : null);
    },

    useItem(playerId, type) {
        if (!this.isActive) return;
        const player   = playerId === 'p1' ? this.p1 : this.p2;
        const remaining = player.useItem(type);
        if (remaining >= 0) {
            const btn = document.querySelector(`.item-btn.${type}-btn[data-player="${playerId}"]`);
            if (btn) { btn.textContent = `${type==='peek'?'👁️':'🔍'} (${remaining})`; if (remaining===0) btn.disabled=true; }
        }
    },

    closeBattle() {
        this.isActive = false;
        clearInterval(this.timerInterval);
        document.getElementById('battle-view').classList.add('hidden');
        document.getElementById('battle-result-modal').classList.add('hidden');
    }
};

// =====================================================================
// 전역 헬퍼 함수
// =====================================================================
function _playFanfare(existingCtx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    const ctx = existingCtx || new AC();
    if (ctx.state === 'suspended') ctx.resume();
    const now = ctx.currentTime;
    const play = (f, t) => {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = 'triangle'; o.frequency.value = f;
        o.connect(g); g.connect(ctx.destination);
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(0.5, t+0.05);
        g.gain.exponentialRampToValueAtTime(0.001, t+0.6);
        o.start(t); o.stop(t+1);
    };
    play(523.25, now); play(659.25, now+0.1); play(783.99, now+0.2); play(1046.5, now+0.35);
}

function triggerSuccessFeedback() {
    mainEngine.selectPiece(null);
    mainEngine.pieces.forEach(p => p.el.classList.add('success-glow'));
    setTimeout(() => {
        mainEngine.pieces.forEach(p => p.el.classList.remove('success-glow'));
        saveToDashboard(mainEngine.analytics.finish());
    }, 2000);
    if (navigator.vibrate) navigator.vibrate([50,50,50,50,150]);
    _playFanfare(mainEngine.audioCtx);
}

function saveToDashboard(report) {
    const db = JSON.parse(localStorage.getItem('tangramDashboardData') || '{}');
    if (!db[currentPlayerName]) db[currentPlayerName] = [];
    db[currentPlayerName].push({
        level: report.level,
        totalTimeSeconds: report.totalTimeSeconds,
        date: new Date().toLocaleString(),
        actions: {
            moves:    Object.values(report.pieceData).reduce((s,p) => s+p.moves,    0),
            rotations:Object.values(report.pieceData).reduce((s,p) => s+p.rotations,0),
            failures: Object.values(report.pieceData).reduce((s,p) => s+p.failedSnaps,0)
        }
    });
    localStorage.setItem('tangramDashboardData', JSON.stringify(db));
}

function renderRankingBoard(level) {
    const db  = JSON.parse(localStorage.getItem('tangramDashboardData') || '{}');
    const el  = document.getElementById('dashboard-data-container');
    const rl  = [];
    Object.keys(db).forEach(name => {
        const best = db[name].filter(r => r.level === level)
            .sort((a,b) => parseFloat(a.totalTimeSeconds) - parseFloat(b.totalTimeSeconds))[0];
        if (best) rl.push({ name, ...best });
    });
    rl.sort((a,b) => parseFloat(a.totalTimeSeconds) - parseFloat(b.totalTimeSeconds));

    if (rl.length === 0) {
        el.innerHTML = '<p style="text-align:center;color:#747d8c;margin-top:30px;">아직 도전 기록이 없어요!</p>';
        return;
    }
    let html = '';
    rl.slice(0,10).forEach((r,i) => {
        const isMe = r.name === currentPlayerName;
        const cls  = i===0?'top1':i===1?'top2':i===2?'top3':'';
        html += `<div class="rank-card ${cls}">
            <div class="rank-num">${i+1}</div>
            <div class="rank-info">
                <div class="rank-name">${r.name}${isMe?' (나)':''}</div>
                <div class="rank-details">조작 ${r.actions.moves+r.actions.rotations}회 | ${r.date.split(',')[0]}</div>
            </div>
            <div class="rank-time">${r.totalTimeSeconds}초</div>
        </div>`;
    });
    const myIdx = rl.findIndex(r => r.name === currentPlayerName);
    if (myIdx >= 10) {
        const m = rl[myIdx];
        html += `<div class="my-rank-label">— 나의 최고 기록 —</div>
        <div class="rank-card my-rank">
            <div class="rank-num">${myIdx+1}</div>
            <div class="rank-info"><div class="rank-name">${m.name} (나)</div><div class="rank-details">조작 ${m.actions.moves+m.actions.rotations}회</div></div>
            <div class="rank-time">${m.totalTimeSeconds}초</div>
        </div>`;
    }
    el.innerHTML = html;
}

function renderCustomPuzzles() {
    const list = document.getElementById('custom-list-container');
    list.innerHTML = '';
    Object.keys(customPuzzles).forEach(name => {
        const wrap = document.createElement('div');
        wrap.style.cssText = 'display:inline-flex;align-items:center;margin:3px;';

        const btn = document.createElement('button');
        btn.className   = 'level-btn';
        btn.textContent = name;
        btn.onclick = () => { mainEngine.loadSilhouette(name); mainEngine.resetPositions(); };

        const del = document.createElement('button');
        del.innerHTML   = '×';
        del.style.cssText = 'margin-left:4px;border:none;border-radius:50%;background:#ff4757;color:#fff;cursor:pointer;width:20px;height:20px;font-size:14px;line-height:1;';
        del.onclick = ev => {
            ev.stopPropagation();
            if (confirm(`'${name}' 문제를 삭제할까요?`)) {
                delete customPuzzles[name];
                localStorage.setItem('tangramCustomPuzzles', JSON.stringify(customPuzzles));
                renderCustomPuzzles();
            }
        };

        wrap.appendChild(btn); wrap.appendChild(del);
        list.appendChild(wrap);
    });
}

function renderPlaza() {
    const gallery = document.getElementById('plaza-gallery');
    gallery.innerHTML = '';
    const all = { ...communityFavorites, ...customPuzzles };
    Object.keys(all).forEach(name => {
        const layout = all[name];
        const card   = document.createElement('div');
        card.className = 'plaza-card';

        let svg = `<svg viewBox="0 0 350 350" style="width:110px;height:110px;background:#f1f2f6;border-radius:10px;margin-bottom:8px;">`;
        layout.forEach(p => {
            const def = pieceDefs.find(pd => pd.id === p.id);
            if (def) svg += `<polygon points="${def.pts}" fill="#dcdde1" stroke="#bbb" transform="translate(${p.dx+75},${p.dy+75}) rotate(${p.a}) scale(0.65)"/>`;
        });
        svg += `</svg>`;

        card.innerHTML = `${svg}<div class="plaza-name" style="font-weight:bold;font-size:13px;text-align:center;">${name}</div>`;
        card.onclick = () => {
            mainEngine.isCreatorMode = false;
            mainEngine.loadSilhouette(name);
            mainEngine.resetPositions();
            document.getElementById('plaza-modal').classList.add('hidden');
        };
        gallery.appendChild(card);
    });
}

function closeAllNavs() {
    document.querySelectorAll('.custom-nav-panel, .guide-panel, .toolbar').forEach(el => el.classList.add('hidden'));
}

// =====================================================================
// 초기화
// =====================================================================
let mainEngine = null;

function init() {
    mainEngine = new TangramEngine({
        id: 'main',
        canvasId:         'tangram-canvas',
        piecesGroupId:    'pieces-group',
        silhouetteGroupId:'silhouette-group',
        guidePanelId:     'tutorial-guide'
    });

    const saved = localStorage.getItem('tangramCustomPuzzles');
    if (saved) try { customPuzzles = JSON.parse(saved); } catch(e) {}

    // URL 공유 파라미터 처리
    const urlP = new URLSearchParams(window.location.search).get('p');
    if (urlP) {
        try {
            const d = JSON.parse(atob(urlP));
            const layout = Array.isArray(d[0]) ? d.map(x=>({id:x[0],dx:x[1],dy:x[2],a:x[3]})) : d;
            customPuzzles['💡 공유받은 문제'] = layout;
            window.history.replaceState({}, '', window.location.pathname);
        } catch(e) {}
    }

    renderCustomPuzzles();
    _bindEvents();
}

function _bindEvents() {
    // 배틀
    document.getElementById('nav-btn-battle').addEventListener('click', () => BattleManager.startBattle());
    document.getElementById('close-battle-btn').addEventListener('click', () => BattleManager.closeBattle());
    document.getElementById('exit-battle-btn').addEventListener('click', () => BattleManager.closeBattle());
    document.getElementById('rematch-btn').addEventListener('click', () => {
        document.getElementById('battle-result-modal').classList.add('hidden');
        BattleManager.startBattle();
    });
    document.getElementById('force-start-battle').addEventListener('click', () =>
        document.getElementById('orientation-warning').classList.add('hidden'));
    document.querySelectorAll('.item-btn').forEach(btn =>
        btn.addEventListener('click', () =>
            BattleManager.useItem(btn.getAttribute('data-player'), btn.classList.contains('peek-btn') ? 'peek' : 'hint')));

    // 배우기
    document.getElementById('nav-btn-learning').addEventListener('click', () => {
        closeAllNavs();
        document.getElementById('learning-nav-panel').classList.remove('hidden');
        mainEngine.loadSilhouette('tut_move');
        mainEngine.resetPositions();
    });

    // 도전하기
    document.getElementById('nav-btn-challenge').addEventListener('click', () => {
        closeAllNavs();
        document.getElementById('challenge-nav-panel').classList.remove('hidden');
        mainEngine.loadSilhouette('easy');
        mainEngine.resetPositions();
    });

    // 광장
    document.getElementById('show-plaza-btn').addEventListener('click', () => {
        renderPlaza();
        document.getElementById('plaza-modal').classList.remove('hidden');
    });
    document.getElementById('close-plaza-btn').addEventListener('click', () =>
        document.getElementById('plaza-modal').classList.add('hidden'));

    // 리셋
    document.getElementById('reset-btn').addEventListener('click', () => mainEngine.resetPositions());

    // 레벨 버튼 (data-level)
    document.body.addEventListener('click', e => {
        const btn = e.target.closest('.level-btn[data-level]');
        if (!btn) return;
        mainEngine.loadSilhouette(btn.getAttribute('data-level'));
        mainEngine.resetPositions();
    });

    // 만들기 모드
    document.getElementById('creator-mode-btn').addEventListener('click', () => {
        closeAllNavs();
        mainEngine.isCreatorMode = true;
        mainEngine.silhouetteGroup.innerHTML = '';
        mainEngine.resetPositions();
        document.getElementById('creator-toolbar').classList.remove('hidden');
        document.getElementById('custom-puzzles-nav').classList.remove('hidden');
    });
    document.getElementById('cancel-creator-btn').addEventListener('click', () => {
        mainEngine.isCreatorMode = false;
        document.getElementById('creator-toolbar').classList.add('hidden');
        mainEngine.loadSilhouette('easy');
        mainEngine.resetPositions();
    });
    document.getElementById('save-puzzle-btn').addEventListener('click', () => {
        const name = prompt('이름을 정해주세요', '');
        if (!name) return;
        customPuzzles[name] = mainEngine.pieces.map(p => ({
            id: p.id,
            dx: p.x - mainEngine.silOffsetX,
            dy: p.y - mainEngine.silOffsetY,
            a:  p.angle
        }));
        localStorage.setItem('tangramCustomPuzzles', JSON.stringify(customPuzzles));
        mainEngine.isCreatorMode = false;
        document.getElementById('creator-toolbar').classList.add('hidden');
        renderCustomPuzzles();
    });
    document.getElementById('share-plaza-btn').addEventListener('click', () => {
        const layout  = mainEngine.pieces.map(p => [p.id, p.x-mainEngine.silOffsetX, p.y-mainEngine.silOffsetY, p.angle]);
        const encoded = btoa(JSON.stringify(layout));
        const link    = `${location.origin}${location.pathname}?p=${encoded}`;
        document.getElementById('share-link-input').value = link;
        document.getElementById('share-link-modal').classList.remove('hidden');
    });
    document.getElementById('copy-link-btn').addEventListener('click', () => {
        navigator.clipboard.writeText(document.getElementById('share-link-input').value)
            .then(() => alert('링크가 복사되었습니다!'));
    });
    document.getElementById('close-share-modal').addEventListener('click', () =>
        document.getElementById('share-link-modal').classList.add('hidden'));

    // 랭킹
    document.getElementById('show-dashboard-btn').addEventListener('click', () => {
        renderRankingBoard('easy');
        document.getElementById('dashboard-modal').classList.remove('hidden');
    });
    document.getElementById('close-dashboard-btn').addEventListener('click', () =>
        document.getElementById('dashboard-modal').classList.add('hidden'));
    document.querySelectorAll('.rank-tab-btn').forEach(btn =>
        btn.addEventListener('click', () => {
            document.querySelectorAll('.rank-tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderRankingBoard(btn.getAttribute('data-rank-level'));
        }));

    // 시작 모달
    document.getElementById('start-game-btn').addEventListener('click', () => {
        const name = document.getElementById('player-name-input').value.trim();
        if (name) currentPlayerName = name;
        document.getElementById('app-title').textContent = `👤 ${currentPlayerName}의 칠교`;
        document.getElementById('welcome-modal').classList.add('hidden');
    });

    // 리사이즈
    window.addEventListener('resize', () => { if (mainEngine) mainEngine.updateLayout(); });
}

// 실행
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
