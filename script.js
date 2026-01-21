// GAS URL 설정
const GAS_URL = "https://script.google.com/macros/s/AKfycbzUIg2yG1Ivg7Vbi5eLxI0o9H_ehJKnFmYKNjkdqX__h3wfkJyPFF1BZHZLGJjEVnofNQ/exec";

// 1. 모달 닫기 함수 (가장 먼저 정의)
function closeModal() {
    const modal = document.getElementById('list-modal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

// 2. 목록 불러오기 함수
async function openTitleList() {
    const container = document.getElementById('title-list-container');
    const modal = document.getElementById('list-modal');
    
    container.innerHTML = "<p>목록을 불러오는 중...</p>";
    modal.classList.remove('hidden'); // 모달 먼저 보여주기

    try {
        const response = await fetch(`${GAS_URL}?type=list`);
        const data = await response.json();
        
        container.innerHTML = "";
        if (!data.titles || data.titles.length === 0) {
            container.innerHTML = "<p style='color:red;'>저장된 데이터가 없습니다.</p>";
            return;
        }

        data.titles.forEach(title => {
            const div = document.createElement('div');
            div.className = 'list-item';
            div.innerText = title;
            div.onclick = () => loadSpecificWorldCup(title);
            container.appendChild(div);
        });
    } catch (e) {
        container.innerHTML = "<p>오류 발생: " + e.message + "</p>";
    }
}

// 3. 특정 월드컵 데이터 가져오기
async function loadSpecificWorldCup(title) {
    closeModal();
    try {
        const response = await fetch(`${GAS_URL}?type=data&title=${encodeURIComponent(title)}`);
        const data = await response.json();
        
        document.getElementById('main-title').value = data.mainTitle;
        document.getElementById('links-input').value = data.items.map(i => `${i.name}\n${i.link}`).join('\n');
    } catch (e) {
        alert("데이터 로드 실패");
    }
}

// 4. 시트에 저장하기
async function saveToSheet() {
    const mainTitle = document.getElementById('main-title').value;
    const rawInput = document.getElementById('links-input').value.split('\n').map(l => l.trim()).filter(l => l !== "");
    
    if(!mainTitle || rawInput.length < 2) return alert("데이터를 입력하세요.");

    const items = [];
    for (let i = 0; i < rawInput.length; i += 2) {
        if(rawInput[i] && rawInput[i+1]) items.push({ name: rawInput[i], link: rawInput[i+1] });
    }

    try {
        const response = await fetch(GAS_URL, {
            method: 'POST',
            body: JSON.stringify({ mainTitle, items })
        });
        const res = await response.json();
        alert(res.message);
    } catch (e) { alert("저장 실패"); }
}

// 5. 월드컵 게임 로직
let candidates = [];
let winners = [];
let currentMatchIdx = 0;

// script.js의 startWorldCup 함수 내부를 수정하세요.
function startWorldCup() {
    const mainTitle = document.getElementById('main-title').value; // 타이틀 가져오기
    const lines = document.getElementById('links-input').value.split('\n').map(l => l.trim()).filter(l => l !== "");
    
    candidates = [];
    for (let i = 0; i < lines.length; i += 2) {
        if (lines[i] && lines[i+1]) {
            const cleanUrl = lines[i+1].replace('x.com', 'twitter.com').split('?')[0];
            candidates.push({ 
                name: lines[i], 
                html: `<blockquote class="twitter-tweet" data-media-max-width="560"><a href="${cleanUrl}"></a></blockquote>` 
            });
        }
    }
    if (candidates.length < 2) return alert("후보가 부족합니다.");
    
    // 게임 화면에 타이틀 세팅
    document.getElementById('game-title').innerText = mainTitle;
    
    candidates.sort(() => Math.random() - 0.5);
    document.getElementById('setup-container').classList.add('hidden');
    document.getElementById('game-container').classList.remove('hidden');
    renderMatch();
}

// script.js 파일의 renderMatch 함수 전체를 아래 코드로 교체하세요.

function renderMatch() {
    const total = candidates.length;
    const roundName = total === 2 ? "결승전" : `${total}강`;
    document.getElementById('round-text').innerText = `${roundName} (${(currentMatchIdx/2)+1} / ${total/2})`;

    const left = candidates[currentMatchIdx];
    const right = candidates[currentMatchIdx+1];

    // 왼쪽 후보 데이터 주입
    document.getElementById('left-video').innerHTML = left.html;
    document.getElementById('left-name').innerText = left.name;

    // 오른쪽 후보 데이터 주입
    document.getElementById('right-video').innerHTML = right.html;
    document.getElementById('right-name').innerText = right.name;

    // 트위터 위젯 다시 로드
    if (window.twttr?.widgets) {
        window.twttr.widgets.load(document.getElementById('game-container'));
    }
}

function selectWinner(index) {
    winners.push(candidates[currentMatchIdx + index]);
    currentMatchIdx += 2;
    if (currentMatchIdx >= candidates.length) {
        if (winners.length === 1) {
            document.getElementById('game-container').classList.add('hidden');
            document.getElementById('result-container').classList.remove('hidden');
            document.getElementById('winner-display').innerHTML = `<h2>${winners[0].name}</h2>` + winners[0].html;
            if (window.twttr?.widgets) window.twttr.widgets.load();
        } else {
            candidates = [...winners]; winners = []; currentMatchIdx = 0; renderMatch();
        }
    } else { renderMatch(); }
}