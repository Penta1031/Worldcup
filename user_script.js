const GAS_URL = "https://script.google.com/macros/s/AKfycbzUIg2yG1Ivg7Vbi5eLxI0o9H_ehJKnFmYKNjkdqX__h3wfkJyPFF1BZHZLGJjEVnofNQ/exec";

// 1. 목록 불러오기
document.addEventListener('DOMContentLoaded', async () => {
    const grid = document.getElementById('title-grid');
    try {
        const response = await fetch(`${GAS_URL}?type=list`);
        const data = await response.json();
        
        grid.innerHTML = "";
        data.titles.forEach(title => {
            const card = document.createElement('div');
            card.className = 'worldcup-card';
            card.innerText = title;
            card.onclick = () => loadAndStart(title);
            grid.appendChild(card);
        });
    } catch (e) {
        grid.innerHTML = "<p>목록 로드 실패: " + e.message + "</p>";
    }
});

// 2. 데이터 로드 및 게임 시작
async function loadAndStart(title) {
    try {
        const response = await fetch(`${GAS_URL}?type=data&title=${encodeURIComponent(title)}`);
        const data = await response.json();
        
        document.getElementById('game-title').innerText = data.mainTitle;
        setupGame(data.items);
        
        document.getElementById('selection-screen').classList.add('hidden');
        document.getElementById('game-container').classList.remove('hidden');
    } catch (e) {
        alert("데이터 로드 실패");
    }
}

let candidates = [];
let winners = [];
let currentMatchIdx = 0;

function setupGame(items) {
    candidates = items.map(item => {
        const cleanUrl = item.link.replace('x.com', 'twitter.com').split('?')[0];
        return {
            name: item.name,
            html: `<blockquote class="twitter-tweet" data-theme="dark" data-media-max-width="560"><a href="${cleanUrl}"></a></blockquote>`
        };
    });
    candidates.sort(() => Math.random() - 0.5);
    renderMatch();
}

function renderMatch() {
    const total = candidates.length;
    const roundName = total === 2 ? "결승전" : `${total}강`;
    document.getElementById('round-text').innerText = `${roundName} (${(currentMatchIdx/2)+1} / ${total/2})`;

    document.getElementById('left-name').innerText = candidates[currentMatchIdx].name;
    document.getElementById('left-video').innerHTML = candidates[currentMatchIdx].html;
    
    document.getElementById('right-name').innerText = candidates[currentMatchIdx+1].name;
    document.getElementById('right-video').innerHTML = candidates[currentMatchIdx+1].html;

    if (window.twttr?.widgets) {
        window.twttr.widgets.load(document.getElementById('game-container'));
    }
}

function selectWinner(index) {
    winners.push(candidates[currentMatchIdx + index]);
    currentMatchIdx += 2;

    if (currentMatchIdx >= candidates.length) {
        if (winners.length === 1) {
            showWinner(winners[0]);
        } else {
            candidates = [...winners];
            winners = [];
            currentMatchIdx = 0;
            renderMatch();
        }
    } else {
        renderMatch();
    }
}

function showWinner(winner) {
    document.getElementById('game-container').classList.add('hidden');
    document.getElementById('result-container').classList.remove('hidden');
    document.getElementById('winner-display').innerHTML = `<h2 style="font-size:30px;">${winner.name}</h2>` + winner.html;
    if (window.twttr?.widgets) window.twttr.widgets.load();
}