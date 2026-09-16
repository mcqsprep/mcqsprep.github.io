// 1. Your Organized Quiz Database
const quizDatabase = {
    "NEET": {
        "Biology": {
            "Zoology": [
                {
                    question: "According to NCERT excretory physiology, which of the following statements is true?",
                    options: ["Urea transport is closely related to the vasa recta", "Urea transport is NOT related to the vasa recta", "The vasa recta secretes urea", "Urea is completely reabsorbed"],
                    correct: 1
                }
            ],
            "Botany": [
                {
                    question: "Which of the following is a characteristic of dicot stems?",
                    options: ["Scattered vascular bundles", "Ring arrangement of vascular bundles", "Lack of cambium", "Parallel venation"],
                    correct: 1
                }
            ]
        },
        "Chemistry": {
            "Organic": [
                {
                    question: "Which of the following has the highest boiling point?",
                    options: ["Methane", "Ethane", "Propane", "Butane"],
                    correct: 3
                }
            ]
        }
    },
    "General Knowledge": {
        "Current Affairs": {
            "June 2026": [
                {
                    question: "Which portal is utilized for undergraduate B.Sc. degree applications in Assam?",
                    options: ["Assam Samarth", "OASIS", "NEET UG", "CUET"],
                    correct: 0
                }
            ]
        }
    }
};

// 2. Logic Variables
let currentPath = []; // Tracks where the user clicked (e.g., ["NEET", "Biology", "Zoology"])
let currentQuizData = [];
let questionIndex = 0;
let score = 0;

// 3. Menu Navigation Logic
function renderMenu() {
    const grid = document.getElementById("category-grid");
    const backBtn = document.getElementById("back-btn");
    const subtitle = document.getElementById("subtitle");
    const menuTitle = document.getElementById("menu-title");
    
    grid.innerHTML = ""; // Clear old buttons

    // Figure out what level of the menu we are currently on
    let currentObj = quizDatabase;
    for (let key of currentPath) {
        currentObj = currentObj[key];
    }

    // If the current object is an array, it means we hit a quiz!
    if (Array.isArray(currentObj)) {
        startQuiz(currentObj, currentPath[currentPath.length - 1]);
        return;
    }

    // Otherwise, show the menu options
    document.getElementById("category-screen").classList.remove("hidden");
    document.getElementById("quiz-screen").classList.add("hidden");

    if (currentPath.length > 0) {
        backBtn.classList.remove("hidden");
        menuTitle.innerText = currentPath[currentPath.length - 1];
        subtitle.innerText = "Select a sub-topic";
    } else {
        backBtn.classList.add("hidden");
        menuTitle.innerText = "Select Your Exam";
        subtitle.innerText = "Choose a category to start practicing.";
    }

    // Create buttons for the current menu level
    for (let key in currentObj) {
        const btn = document.createElement("button");
        btn.className = "category-card";
        btn.innerText = key;
        btn.onclick = () => {
            currentPath.push(key);
            renderMenu();
        };
        grid.appendChild(btn);
    }
}

function goBack() {
    currentPath.pop(); // Remove the last clicked category
    renderMenu();
}

function returnToHome() {
    currentPath = [];
    document.getElementById("result-screen").classList.add("hidden");
    renderMenu();
}

// 4. Quiz Logic
function startQuiz(quizArray, title) {
    document.getElementById("category-screen").classList.add("hidden");
    document.getElementById("quiz-screen").classList.remove("hidden");
    document.getElementById("exam-title").innerText = title;
    
    currentQuizData = quizArray;
    questionIndex = 0;
    score = 0;
    document.getElementById("score").innerText = score;
    
    loadQuestion();
}

function loadQuestion() {
    document.getElementById("next-btn").classList.add("hidden");
    const optionsEl = document.getElementById("options");
    optionsEl.innerHTML = ""; // Clear old options
    
    const currentQuestion = currentQuizData[questionIndex];
    document.getElementById("question").innerText = currentQuestion.question;

    currentQuestion.options.forEach((option, index) => {
        const button = document.createElement("button");
        button.innerText = option;
        button.classList.add("option-btn");
        button.onclick = () => selectAnswer(index, button);
        optionsEl.appendChild(button);
    });
}

function selectAnswer(selectedIndex, selectedButton) {
    const currentQuestion = currentQuizData[questionIndex];
    const buttons = document.querySelectorAll(".option-btn");

    // Lock all buttons
    buttons.forEach(btn => btn.disabled = true);

    // Check if correct
    if (selectedIndex === currentQuestion.correct) {
        selectedButton.classList.add("correct");
        score++;
        document.getElementById("score").innerText = score;
    } else {
        selectedButton.classList.add("incorrect");
        buttons[currentQuestion.correct].classList.add("correct"); // Show right answer
    }

    document.getElementById("next-btn").classList.remove("hidden");
}

function nextQuestion() {
    questionIndex++;
    if (questionIndex < currentQuizData.length) {
        loadQuestion();
    } else {
        document.getElementById("quiz-content").classList.add("hidden");
        document.getElementById("result-screen").classList.remove("hidden");
        document.getElementById("final-score").innerText = score;
        document.getElementById("total-questions").innerText = currentQuizData.length;
    }
}

// Start the app
renderMenu();
