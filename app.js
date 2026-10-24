
const categoryScreen = document.getElementById("category-screen");
const gameScreen = document.getElementById("game-screen");

const categoryCards = document.querySelectorAll(".category-card");
const backButton = document.getElementById("back-button");
const guessForm = document.getElementById("guess-form");
const guessInput = document.getElementById("guess-input");
const submitButton = document.getElementById("submit-button");
const feedback = document.getElementById("feedback");
const guessHistory = document.getElementById("guess-history");
const guessCount = document.getElementById("guess-count");

const gameCategory = document.getElementById("game-category");
const gameCategoryIcon = document.getElementById("game-category-icon");
const winPanel = document.getElementById("win-panel");
const winMessage = document.getElementById("win-message");
const playAgainButton = document.getElementById("play-again");
const changeCategoryButton = document.getElementById("change-category");

const categoryIcons = {
    animals: "🐘",
    birds: "🦜",
    fruits: "🍓",
    flowers: "🌻"
};

let wordData = {};
let currentCategory = "";
let secretWord = "";
let guesses = [];
let gameOver = false;

// Load words.json
async function loadWords() {
    try {
        const response = await fetch("./words.json");

        if (!response.ok) {
            throw new Error("Could not load words.json");
        }

        const data = await response.json();

        for (const [category, words] of Object.entries(data)) {
            if (
                !Array.isArray(words) ||
                words.length === 0 ||
                words.some(
                    word =>
                        typeof word !== "string" ||
                        word.trim() === ""
                )
            ) {
                throw new Error(`Invalid word list: ${category}`);
            }
        }

        wordData = data;

        categoryCards.forEach(card => {
            card.disabled = !wordData[card.dataset.category];
        });
    } catch (error) {
        console.error(error);

        categoryCards.forEach(card => {
            card.disabled = true;
        });

        document.querySelector(".how-to").textContent =
            "Could not load words.json. Check the file name and location.";
    }
}

// Compare words alphabetically, ignoring capitalization.
function compareWords(a, b) {
    return a.toLowerCase().localeCompare(
        b.toLowerCase(),
        "en",
        { sensitivity: "base" }
    );
}

// Choose a random secret word.
function chooseSecret(previousWord = "") {
    const words = wordData[currentCategory];

    const availableWords = words.filter(
        word => word.toLowerCase() !== previousWord.toLowerCase()
    );

    const pool = availableWords.length > 0 ? availableWords : words;

    return pool[Math.floor(Math.random() * pool.length)];
}

// Start a new game.
function startGame(category, previousWord = "") {
    if (!Array.isArray(wordData[category]) || !wordData[category].length) {
        return;
    }

    currentCategory = category;
    secretWord = chooseSecret(previousWord);
    guesses = [];
    gameOver = false;

    gameCategory.textContent =
        category.charAt(0).toUpperCase() + category.slice(1);

    gameCategoryIcon.textContent = categoryIcons[category] || "🧩";

    guessHistory.replaceChildren();

    feedback.textContent = "Make your first guess!";
    feedback.className = "feedback";

    guessCount.textContent = "0 guesses";

    winPanel.classList.add("hidden");
    guessForm.classList.remove("hidden");

    guessInput.disabled = false;
    submitButton.disabled = false;
    guessInput.value = "";

    categoryScreen.classList.add("hidden");
    gameScreen.classList.remove("hidden");

    guessInput.focus();
}

// Update the feedback message.
function setFeedback(message, type = "") {
    feedback.textContent = message;
    feedback.className = type ? `feedback ${type}` : "feedback";
}

// Add a guess to the history.
function addGuessRow(word, direction) {
    const row = document.createElement("div");
    row.className = `guess-row ${direction}`;

    const guessWord = document.createElement("span");
    guessWord.className = "guess-word";
    guessWord.textContent = word;

    const result = document.createElement("span");
    result.className = "guess-result";

    const arrow = document.createElement("span");
    arrow.className = "arrow";

    const message = document.createElement("span");

    if (direction === "higher") {
        arrow.textContent = "↑";
        message.textContent = "Later alphabetically";
    } else if (direction === "lower") {
        arrow.textContent = "↓";
        message.textContent = "Earlier alphabetically";
    } else {
        arrow.textContent = "✓";
        message.textContent = "Correct!";
    }

    result.append(arrow, message);
    row.append(guessWord, result);

    // Show the newest guess at the top.
    guessHistory.prepend(row);
}

// Process the player's guess.
function handleGuess(event) {
    event.preventDefault();

    if (gameOver || !currentCategory) {
        return;
    }

    const guess = guessInput.value.trim();

    if (!guess) {
        setFeedback("Enter a word first.", "error");
        return;
    }

    // Accept ANY non-empty word, not just words in words.json.
    const normalizedGuess = guess.toLowerCase();

    // Prevent duplicate guesses.
    if (guesses.some(word => word.toLowerCase() === normalizedGuess)) {
        setFeedback("You've already guessed that word!", "error");
        return;
    }

    guesses.push(guess);

    // Compare the guess directly with the secret word.
    const comparison = compareWords(guess, secretWord);

    if (comparison === 0) {
        addGuessRow(guess, "correct");

        setFeedback("You found the secret word! 🎉", "success");

        gameOver = true;
        guessForm.classList.add("hidden");
        winPanel.classList.remove("hidden");

        winMessage.textContent =
            `You guessed ${secretWord} in ${guesses.length} ` +
            `${guesses.length === 1 ? "guess" : "guesses"}!`;

        guessInput.disabled = true;
        submitButton.disabled = true;
    } else if (comparison < 0) {
        // The secret word comes later alphabetically.
        addGuessRow(guess, "higher");

        setFeedback(
            "↑ The answer comes later in the alphabet. Try again!"
        );
    } else {
        // The secret word comes earlier alphabetically.
        addGuessRow(guess, "lower");

        setFeedback(
            "↓ The answer comes earlier in the alphabet. Try again!"
        );
    }

    guessCount.textContent =
        `${guesses.length} ${guesses.length === 1 ? "guess" : "guesses"}`;

    guessHistory.querySelector(".empty-state")?.remove();

    guessInput.value = "";

    if (!gameOver) {
        guessInput.focus();
    }
}

// Category selection.
categoryCards.forEach(card => {
    card.addEventListener("click", () => {
        startGame(card.dataset.category);
    });
});

// Submit a guess.
guessForm.addEventListener("submit", handleGuess);

// Return to category selection.
backButton.addEventListener("click", () => {
    gameScreen.classList.add("hidden");
    categoryScreen.classList.remove("hidden");
});

// Play again with the same category but a different secret when possible.
playAgainButton.addEventListener("click", () => {
    startGame(currentCategory, secretWord);
});

// Choose a different category.
changeCategoryButton.addEventListener("click", () => {
    gameScreen.classList.add("hidden");
    categoryScreen.classList.remove("hidden");
});

// Initialize the game.
loadWords();
