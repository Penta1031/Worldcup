const GAS_URL = "https://script.google.com/macros/s/AKfycbzhka5kDERhT7SEUHsnnTS0uz50dL75zvWQUp7dXOzapcNplSEHLun_wcTqqtCxN9GS8Q/exec";

let inputMode = 'links'; 
let items = [];
let winners = [];
let currentIndex = 0;
let roundCount = 1;
let lastLoadedData = null;

window.onload = loadSavedList;

function setMode(mode) {
    inputMode = mode;
    document.getElementById('mode-links-btn').classList.toggle('active', mode === 'links');
    document.getElementById('mode-pairs-btn').classList.toggle('active', mode === 'pairs');
}

async function loadSavedList() {
    const listDiv = document.getElementById('saved-list');
    listDiv.innerHTML = "로딩 중...";
    try {
        const response = await fetch(GAS_URL);
        const data = await response.json();
        listDiv.innerHTML = data.length ? "" : "저장된 데이터가 없습니다.";
        data.forEach(item => {
            const div = document.createElement('div');
            div.className = "saved-item";
            div.innerHTML = `<span>${item.title}</span> <span style="color:#555;">${new Date(item.date).toLocaleDateString()}</span>`;
            div.onclick = () => {
                document.getElementById('wc-title').value = item.title;
                document.getElementById('data-input').value = item.raw;
                setMode(item.mode);
                lastLoadedData = { title: item.title, mode: item.mode, raw: item.raw };
                alert("불러오기 완료!");
            };
            listDiv.appendChild(div);
        });
    } catch (e) { listDiv.innerHTML = "불러오기 실패"; }
}

async function uploadToSheet(title, mode, raw) {
    try {
        await fetch(GAS_URL, { method: "POST", body: JSON.stringify({ title, mode, raw }), mode: 'no-cors' });
    } catch (e) { console.error("저장 실패", e); }
}

function extractTweetId(url) {
    const match = url.match(/status\/(\d+)/);
    return match ? match[1] : null;
}

function startGame() {
    const title = document.getElementById('wc-title').value || "이상형 월드컵";
    const rawText = document.getElementById('data-input').value.trim();
    const lines = rawText.split('\n').map(l => l.trim()).filter(l => l !== "");
    
    items = [];
    if (inputMode === 'links') {
        lines.forEach(l => { const id = extractTweetId(l); if(id) items.push({ id, name: "" }); });
    } else {
        for (let i = 0; i < lines.length; i += 2) {
            if (lines[i] && lines[i+1]) {
                const id = extractTweetId(lines[i+1]);
                if (id) items.push({ id, name: lines[i] });
            }
        }
    }

    if (items.length < 2) return alert("데이터가 부족합니다.");

    const isModified = !lastLoadedData || title !== lastLoadedData.title || inputMode !== lastLoadedData.mode || rawText !== lastLoadedData.raw;
    if (isModified) uploadToSheet(title, inputMode, rawText);

    items.sort(() => Math.random() - 0.5);
    document.getElementById('display-title').innerText = title;
    document.getElementById('setup-ui').style.display = 'none';
    document.getElementById('game-ui').style.display = 'block';
    document.getElementById('top-bar').style.display = 'flex';
    
    renderRound();
}

async function renderRound() {
    const leftBox = document.getElementById('left-tweet-container');
    const rightBox = document.getElementById('right-tweet-container');
    leftBox.innerHTML = ""; rightBox.innerHTML = "";
    
    document.getElementById('left-name').innerText = items[currentIndex].name;
    document.getElementById('right-name').innerText = items[currentIndex+1].name;

    const opt = { theme: 'dark', align: 'center', conversation: 'none', lang: 'ko', dnt: true };
    twttr.widgets.createTweet(items[currentIndex].id, leftBox, opt);
    twttr.widgets.createTweet(items[currentIndex+1].id, rightBox, opt);
    
    updateRoundTitle();
}

function updateRoundTitle() {
    const total = items.length;
    const matchInfo = document.getElementById('display-match');
    let roundName = "";

    if (total === 2) {
        roundName = "결승전";
        matchInfo.innerText = ""; 
    } else {
        const rounds = { 4: "4강", 8: "8강", 16: "16강", 32: "32강", 64: "64강" };
        roundName = rounds[total] || total + "강";
        matchInfo.innerText = `${roundCount}/${total / 2}`;
    }
    document.getElementById('display-round').innerText = roundName;
}

function selectWinner(idx) {
    winners.push(items[currentIndex + idx]);
    currentIndex += 2;
    if (currentIndex >= items.length) {
        items = [...winners]; winners = []; currentIndex = 0; roundCount = 1;
        if (items.length === 1) return showWinner(items[0]);
    } else { roundCount++; }
    renderRound();
}

function showWinner(item) {
    document.getElementById('game-ui').style.display = 'none';
    document.getElementById('top-bar').style.display = 'none';
    document.getElementById('winner-display').style.display = 'block';
    document.getElementById('winner-name').innerText = item.name;
    twttr.widgets.createTweet(item.id, document.getElementById('winner-tweet'), { theme: 'dark', align: 'center', conversation: 'none' });
}