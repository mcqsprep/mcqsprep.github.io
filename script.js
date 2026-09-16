// 1. Your Organized Quiz Database
const quizDatabase = {
    "NEET": {
        "Biology": {
            "Zoology": [
                {
                    question: "Q1: According to NCERT excretory physiology, which of the following statements is true?",
                    options: ["(1) Urea transport is closely related to the vasa recta", "(2) Urea transport is NOT related to the vasa recta", "(3) The vasa recta secretes urea", "(4) Urea is completely reabsorbed"],
                    correct: 1
                }
            ],
            "Botany": [
                {
                    question: "Q1: Which of the following is a characteristic of dicot stems?",
                    options: ["(1) Scattered vascular bundles", "(2) Ring arrangement of vascular bundles", "(3) Lack of cambium", "(4) Parallel venation"],
                    correct: 1
                }
            ]
        },
        "Chemistry": {
            "Organic": [
                {
                    question: "Q1: Which of the following has the highest boiling point?",
                    options: ["(1) Methane", "(2) Ethane", "(3) Propane", "(4) Butane"],
                    correct: 3
                }
            ]
        }
    },
    "General Knowledge": {
        "Current Affairs": {
            "June 2026": [
                {
                    question: "Q1: Which portal is utilized for undergraduate B.Sc. degree applications in Assam?",
                    options: ["(1) Assam Samarth", "(2) OASIS", "(3) NEET UG", "(4) CUET"],
                    correct: 0
                }
            ]
        }
    }
};

// 2. Logic Variables
let currentPath = []; 
let currentQuizData = [];
let questionIndex = 0;
let score = 0;

// 3. Menu Navigation Logic
function renderMenu() {
    const grid = document.getElementById("category-grid");
    const backBtn = document.getElementById("back-btn");
    const menuTitle = document.getElementById("menu-title");
    const breadcrumb = document.getElementById("breadcrumb");
    
    grid.innerHTML = ""; 

    let currentObj = quizDatabase;
    for (let key of currentPath) {
        currentObj = currentObj[key];
    }

    if (Array.isArray(currentObj)) {
        startQuiz(currentObj, currentPath[currentPath.length - 1]);
        return;
    }

    document.getElementById("category-screen").classList.remove("hidden");
    document.getElementById("quiz-screen").classList.add("hidden");

    // Update Breadcrumbs
    if (currentPath.length > 0) {
        backBtn.classList.remove("hidden");
        menuTitle.innerText = "Select Subject:";
        breadcrumb.innerText = "Home / " + currentPath.join(" / ");
    } else {
        backBtn.classList.add("hidden");
        menuTitle.innerText = "Select Exam:";
        breadcrumb.innerText = "Home / Select Exam";
    }

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
    currentPath.pop(); 
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
    document.getElementById("exam-title").innerText = title + " Questions";
    
    // Update Breadcrumb for Quiz
    document.getElementById("breadcrumb").innerText = "Home / " + currentPath.join(" / ") + " / Test";
    
    currentQuizData = quizArray;
    questionIndex = 0;
    score = 0;
    document.getElementById("score").innerText = score;
    
    loadQuestion();
}

function loadQuestion() {
    document.getElementById("next-btn").classList.add("hidden");
    const optionsEl = document.getElementById("options");
    optionsEl.innerHTML = ""; 
    
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

    buttons.forEach(btn => btn.disabled = true);

    if (selectedIndex === currentQuestion.correct) {
        selectedButton.classList.add("correct");
        score++;
        document.getElementById("score").innerText = score;
    } else {
        selectedButton.classList.add("incorrect");
        buttons[currentQuestion.correct].classList.add("correct"); 
    }

    document.getElementById("next-btn").classList.remove("hidden");
}

function nextQuestion() {
    questionIndex++;
    if (questionIndex < currentQuizData.length) {
        loadQuestion();
    } else {
        document.getElementById("quiz-screen").querySelector(".question-card").classList.add("hidden");
        document.getElementById("quiz-screen").querySelector(".action-bar").classList.add("hidden");
        document.getElementById("result-screen").classList.remove("hidden");
        document.getElementById("final-score").innerText = score;
        document.getElementById("total-questions").innerText = currentQuizData.length;
    }
}

// Start the app
renderMenu();
