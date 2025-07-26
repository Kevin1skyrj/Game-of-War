let deckId;
let computerScore = 0;
let myScore = 0;
let history = [];
let leaderboard = [];
let playerName = "Player";
const cardsContainer = document.getElementById("cards");
const newDeckBtn = document.getElementById("new-deck");
const drawCardBtn = document.getElementById("draw-cards");
const header = document.getElementById("header");
const remainingText = document.getElementById("remaining");
const computerScoreEl = document.getElementById("computer-score");
const myScoreEl = document.getElementById("my-score");
const historyList = document.getElementById("history-list");
const leaderboardList = document.getElementById("leaderboard-list");
const restartBtn = document.getElementById("restart-btn");
const muteBtn = document.getElementById("mute-btn");
const themeSwitcher = document.getElementById("theme-switcher");
const playerNameInput = document.getElementById("player-name");
const scoreAnimation = document.getElementById("score-animation");
const drawSound = document.getElementById("draw-sound");
const winSound = document.getElementById("win-sound");
const lossSound = document.getElementById("loss-sound");
const warSound = document.getElementById("war-sound");
const endSound = document.getElementById("end-sound");

// Sound settings
let soundEnabled = true;
drawSound.volume = 0.6;   // Card draw sound
winSound.volume = 0.8;    // Player wins - celebratory
lossSound.volume = 0.6;   // Player loses - noticeable but not harsh
warSound.volume = 0.7;    // War/Draw - dramatic
endSound.volume = 0.9;    // Game end - celebratory


function handleClick() {
    fetch("https://apis.scrimba.com/deckofcards/api/deck/new/shuffle/")
        .then(res => res.json())
        .then(data => {
            remainingText.textContent = `Remaining cards: ${data.remaining}`;
            deckId = data.deck_id;
            computerScore = 0;
            myScore = 0;
            history = [];
            updateHistory();
            updateScores();
            drawCardBtn.disabled = false;
            header.textContent = "Game of War";
            cardsContainer.children[0].innerHTML = "";
            cardsContainer.children[1].innerHTML = "";
            scoreAnimation.style.opacity = 0;
        });
}

function updateScores() {
    computerScoreEl.textContent = `Computer score: ${computerScore}`;
    myScoreEl.textContent = `${playerName} score: ${myScore}`;
}

function updateHistory() {
    historyList.innerHTML = "";
    history.forEach((item, idx) => {
        const li = document.createElement("li");
        li.textContent = `Round ${idx + 1}: ${item}`;
        historyList.appendChild(li);
    });
}

function updateLeaderboard() {
    leaderboardList.innerHTML = "";
    leaderboard.slice(0, 5).forEach((entry, idx) => {
        const li = document.createElement("li");
        li.textContent = `${idx + 1}. ${entry.name}: ${entry.score}`;
        leaderboardList.appendChild(li);
    });
}

function playSound(sound) {
    if (sound && sound.readyState >= 2 && soundEnabled) { // Check if audio is loaded and sound is enabled
        try {
            sound.currentTime = 0; // Reset to beginning
            const playPromise = sound.play();
            
            // Handle browsers that return a promise
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    console.log("Audio playback failed:", error);
                });
            }
        } catch (error) {
            console.log("Audio play error:", error);
        }
    } else if (sound && soundEnabled) {
        // If audio isn't ready, wait a bit and try again
        setTimeout(() => playSound(sound), 100);
    }
}

function animateScore(text) {
    scoreAnimation.textContent = text;
    scoreAnimation.style.opacity = 1;
    setTimeout(() => {
        scoreAnimation.style.opacity = 0;
    }, 800);
}

function flipCards() {
    cardsContainer.children[0].classList.add("flipping");
    cardsContainer.children[1].classList.add("flipping");
    setTimeout(() => {
        cardsContainer.children[0].classList.remove("flipping");
        cardsContainer.children[1].classList.remove("flipping");
    }, 600);
}

function highlightWinner(winnerIdx) {
    cardsContainer.children[0].classList.remove("winner");
    cardsContainer.children[1].classList.remove("winner");
    if (winnerIdx !== null) {
        cardsContainer.children[winnerIdx].classList.add("winner");
        setTimeout(() => {
            cardsContainer.children[winnerIdx].classList.remove("winner");
        }, 1200);
    }
}

newDeckBtn.addEventListener("click", () => {
    playSound(drawSound); // Play sound when getting new deck
    handleClick();
});

drawCardBtn.addEventListener("click", () => {
    if (!deckId) return;
    playSound(drawSound);
    fetch(`https://apis.scrimba.com/deckofcards/api/deck/${deckId}/draw/?count=2`)
        .then(res => res.json())
        .then(data => {
            remainingText.textContent = `Remaining cards: ${data.remaining}`;
            // Preload both card images before flipping
            const img1 = new Image();
            const img2 = new Image();
            let loaded = 0;
            function onLoad() {
                loaded++;
                if (loaded === 2) {
                    // Both images loaded, now update DOM and animate
                    flipCards();
                    cardsContainer.children[0].innerHTML = `
                        <img src="${data.cards[0].image}" class="card" />
                        <div class="card-label">Computer</div>
                    `;
                    cardsContainer.children[1].innerHTML = `
                        <img src="${data.cards[1].image}" class="card" />
                        <div class="card-label">${playerName}</div>
                    `;
                    const winnerText = determineCardWinner(data.cards[0], data.cards[1]);
                    header.textContent = winnerText;
                    updateScores();
                    let roundResult = "War!";
                    let winnerIdx = null;
                    if (winnerText === "Computer wins!") {
                        roundResult = "Computer wins!";
                        winnerIdx = 0;
                        playSound(lossSound); // Player loses - play loss sound
                        animateScore("+1 Computer");
                    } else if (winnerText === "You win!" || winnerText === `${playerName} wins!`) {
                        roundResult = `${playerName} wins!`;
                        winnerIdx = 1;
                        playSound(winSound); // Player wins - play win sound
                        animateScore(`+1 ${playerName}`);
                    } else {
                        playSound(warSound); // War/Draw - play war sound
                        animateScore("War!");
                    }
                    highlightWinner(winnerIdx);
                    history.push(roundResult);
                    updateHistory();
                    if (data.remaining === 0) {
                        drawCardBtn.disabled = true;
                        let finalText = "It's a tie game!";
                        let score = myScore;
                        if (computerScore > myScore) {
                            finalText = "The computer won the game!";
                            score = computerScore;
                            playSound(lossSound); // Player lost the overall game
                        } else if (myScore > computerScore) {
                            finalText = `${playerName} won the game!`;
                            score = myScore;
                            playSound(endSound); // Player won the overall game - celebration!
                        } else {
                            playSound(warSound); // Tie game - neutral sound
                        }
                        header.textContent = finalText;
                        leaderboard.push({ name: playerName, score });
                        leaderboard.sort((a, b) => b.score - a.score);
                        updateLeaderboard();
                    }
                }
            }
            img1.onload = onLoad;
            img2.onload = onLoad;
            img1.src = data.cards[0].image;
            img2.src = data.cards[1].image;
        });
});

restartBtn.addEventListener("click", () => {
    handleClick();
});

// Mute/Unmute toggle
muteBtn.addEventListener("click", () => {
    soundEnabled = !soundEnabled;
    muteBtn.textContent = soundEnabled ? "♪" : "♫";
    muteBtn.title = soundEnabled ? "Mute Sound" : "Unmute Sound";
    muteBtn.style.opacity = soundEnabled ? "1" : "0.6";
});

themeSwitcher.addEventListener("change", (e) => {
    const theme = e.target.value;
    let bg = "";
    if (theme === "green") {
        bg = "linear-gradient(135deg, #2e8b57 0%, #006400 100%), url('img/table.png')";
    } else if (theme === "blue") {
        bg = "linear-gradient(135deg, #1e90ff 0%, #4682b4 100%), url('img/blue-table.jpg')";
        
    } else if (theme === "wood") {
        bg = "url('img/wood-table.jpg')";
    }
    document.body.style.background = bg;
    document.body.style.backgroundBlendMode = theme === "wood" ? "normal" : "multiply";
});

playerNameInput.addEventListener("input", (e) => {
    playerName = e.target.value || "Player";
    updateScores();
});

// Keyboard controls
document.addEventListener("keydown", (e) => {
    if (e.key === "d") {
        drawCardBtn.click();
    } else if (e.key === "r") {
        restartBtn.click();
    }
});


function determineCardWinner(card1, card2) {
    const valueOptions = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "JACK", "QUEEN", "KING", "ACE"];
    const card1ValueIndex = valueOptions.indexOf(card1.value);
    const card2ValueIndex = valueOptions.indexOf(card2.value);
    if (card1ValueIndex > card2ValueIndex) {
        computerScore++;
        return "Computer wins!";
    } else if (card1ValueIndex < card2ValueIndex) {
        myScore++;
        return `${playerName} wins!`;
    } else {
        return "War!";
    }
}

