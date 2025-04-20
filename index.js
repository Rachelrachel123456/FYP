import dataset from "./data/data.json" with { type: "json" };

// Utility functions for local storage
function loadProgress() {
	const stored = localStorage.getItem("flashcardProgress");
	return stored ? JSON.parse(stored) : {};
}

function saveProgress(progress) {
	localStorage.setItem("flashcardProgress", JSON.stringify(progress));
}

// Add money tracking to local storage
function loadMoney() {
    const stored = localStorage.getItem("userMoney");
    return stored ? parseInt(stored) : 0;
}

function saveMoney(amount) {
    localStorage.setItem("userMoney", amount.toString());
}

// Add bag tracking to local storage
function loadBag() {
    const stored = localStorage.getItem("userBag");
    return stored ? JSON.parse(stored) : [];
}

function saveBag(items) {
    localStorage.setItem("userBag", JSON.stringify(items));
}

// Utility function to shuffle an array
function shuffleArray(array) {
	for (let i = array.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[array[i], array[j]] = [array[j], array[i]];
	}
	return array;
}

// Sort flashcards by due date and limit to 20 cards
const progressData = loadProgress();
const introCards = Array.from(document.getElementsByClassName("intro"), el => ({
	type: "intro",
	content: el,
})).filter((_, index) => index !== 0); // Exclude the first intro card (p1)

const cards = introCards.concat(dataset
	.sort((a, b) => {
		const dateA = progressData[a.id]?.dueDate ? new Date(progressData[a.id].dueDate) : Infinity;
		const dateB = progressData[b.id]?.dueDate ? new Date(progressData[b.id].dueDate) : Infinity;
		return dateA - dateB;
	})
	.slice(0, 20) // Limit to 20 cards
);

let currentIndex = 0;
const posMapping = { n: "noun", v: "verb", adj: "adjective" };

// DOM element references
const elements = {
	frontWord: document.getElementById("front-word"),
	frontImage: document.getElementById("front-image"),
	definition: document.getElementById("definition"),
	question: document.getElementById("question"),
	presentC: document.getElementById("presentC"),
	introContent: document.getElementById("intro_content"),
	answerInput: document.getElementById("answer-input"),
	submitAnswerButton: document.getElementById("submit-answer"),
	feedbackMessage: document.getElementById("feedback-message"),
	flipCardCheckbox: document.getElementById("flip-card-checkbox"),
	cardInner: document.getElementById("card-inner"),
	btnBack: document.getElementById("btn-back"),
	btnContinue: document.getElementById("btn-continue"),

	Presentense: document.getElementById("Present_Tense"),
	Presentontinuous_Tense: document.getElementById("Present_Continuous_Tense"),
	Chinese_Meaning: document.getElementById("Chinese_Meaning"),
	Present_S: document.getElementById("Present_Tense_Sentence"),
	Present_Continuous_Tense_Sentence: document.getElementById("Present_Continuous_Tense_Sentence"),
	PresentImage: document.getElementById("Present_Tense_Image"),
	wordcardcontent: document.getElementById("wordcard-content"),
	bagMenu: document.getElementById("bag-menu"),
	bagItems: document.getElementById("bag-items"),
	closeBag: document.getElementById("close-bag"),
};
const transitionHalfDuration = parseFloat(getComputedStyle(elements.cardInner).transitionDuration) * 1000 / 2;

let isExerciseOne = false;
let isExerciseTwo = false;
let isExerciseThree = false;
let isExerciseFour = false;
let isExerciseFive = false;
let isExerciseSix = false;
let isExerciseSeven = false;
let isExamMode = false;
let selectedImageIndices = [];
const animationEffects = ['bounce-effect', 'shake-effect', 'pulse-effect'];

let wrongAnswers = 0;
let totalAnswered = 0;
const questionsPerExercise = 10;

// Update the function to handle both exercises
function selectAnimatedImageIndices(questions, questionCount, exerciseNumber) {
    const continuousIndices = [];
    questions.forEach((q, index) => {
        if (index < questionCount && q.Present_Continuous_Tense_Sentence) {
            continuousIndices.push(index);
        }
    });
    return shuffleArray(continuousIndices).slice(0, 3);
}

// Add event listeners for sentences
function addSentenceClickListeners() {
    const currentQuestionIndex = currentIndex - introCards.length;
    const isAnimated = selectedImageIndices.indexOf(currentQuestionIndex) !== -1;
    
    if (elements.Present_S) {
        elements.Present_S.onclick = () => handleSentenceClick('present', isAnimated);
    }
    if (elements.Present_Continuous_Tense_Sentence) {
        elements.Present_Continuous_Tense_Sentence.onclick = () => handleSentenceClick('continuous', isAnimated);
    }
}

// Handle sentence click
function handleSentenceClick(type, isAnimated) {
    const audio = new Audio();
    const feedbackMessage = document.getElementById('feedback-message');
    const isCorrect = (type === 'present' && !isAnimated) || (type === 'continuous' && isAnimated);
    
    totalAnswered++;
    
    if (isCorrect) {
        feedbackMessage.textContent = "Correct!! Smart!!🎊🤩";
        feedbackMessage.style.color = "green";
        audio.src = "https://pfst.cf2.poecdn.net/base/audio/43afac63f214b828ab56fc9f045f0e9d2e04ece6341025cf72752f63d837aa47";
    } else {
        wrongAnswers++;
        feedbackMessage.textContent = "Try again! 😟";
        feedbackMessage.style.color = "red";
        audio.src = "https://pfst.cf2.poecdn.net/base/audio/9aba513528729557cad1665da2c6417e2cb43d8b02764efc9475573d02e4d3b6";
    }
    
    // Check if exercise is complete
    if (totalAnswered === questionsPerExercise) {
        checkExerciseCompletion();
    }
    
    feedbackMessage.style.display = "block";
    audio.play().catch(error => console.error("Audio playback failed:", error));
}

// Add function to check exercise completion
function checkExerciseCompletion() {
    const rewardMessage = document.getElementById('reward-message');
    
    if (wrongAnswers <= 3) {
        // Add money reward
        const currentMoney = loadMoney();
        saveMoney(currentMoney + 10);
        
        // Update reward message to include money
        rewardMessage.innerHTML = `
            <h3>Congratulations! 🎉</h3>
            <p>You've completed the exercise successfully!</p>
            <p>You earned $10!</p>
            <p>Total money: $${currentMoney + 10}</p>
            <img src="./res/trophy.png" alt="Trophy">
        `;
        
        // Show reward
        rewardMessage.style.display = 'block';
        // Hide reward after 5 seconds
        setTimeout(() => {
            rewardMessage.style.display = 'none';
        }, 5000);
    }
    
    // Reset counters for next exercise
    wrongAnswers = 0;
    totalAnswered = 0;
}

// Render the current card
function renderCard() {
    // Add money display at the start of renderCard
    const currentMoney = loadMoney();
    const moneyDisplay = document.getElementById('money-display');
    if (moneyDisplay) {
        moneyDisplay.textContent = `Money: $${currentMoney}`;
    }

	// Reset to front side
	elements.flipCardCheckbox.checked = false;

	const currentCard = cards[currentIndex];
	
	// Handle exercise page (p16) specially
	if (currentCard?.type === "intro" && currentCard.content?.id === "p16") {
		document.getElementById("welcome-message").style.display = "none";
		elements.cardInner.style.display = "block";
		elements.btnBack.style.display = "inline-block";
		elements.btnContinue.style.display = "none";
		elements.wordcardcontent.style.display = "none";
		elements.introContent.innerHTML = currentCard.content.innerHTML;

		// Directly attach click handlers to exercise buttons
		document.querySelectorAll('.exercise-button').forEach(button => {
			button.onclick = (e) => {
				e.preventDefault();
				console.log('Button clicked:', button.id);
				startExercise(button.id);
			};
		});
	} else {
		if (currentIndex === 0) {
			// Show welcome message and buttons for the first page
			document.getElementById("welcome-message").style.display = "block";
			elements.cardInner.style.display = "none";
			elements.btnBack.style.display = "none"; // Hide "Review" button
			elements.btnContinue.style.display = "none"; // Hide "Continue" button
		} else if (currentIndex >= introCards.length) {
			// Show flashcard content
			document.getElementById("welcome-message").style.display = "none";
			elements.cardInner.style.display = "block";
			elements.btnBack.style.display = "inline-block";
			elements.btnContinue.style.display = "inline-block";
			elements.wordcardcontent.style.display = "block";
			elements.introContent.innerHTML = "";

			const currentCard = cards[currentIndex];
			if (currentCard && !currentCard.type) {  // Check if it's a flashcard
				// Display flashcard content
				if (elements.Presentense) {
					elements.Presentense.textContent = currentCard.Present_Tense || "";
				}
				if (elements.Presentontinuous_Tense) {
					elements.Presentontinuous_Tense.textContent = currentCard.Present_Continuous_Tense || "";
				}
				if (elements.Present_S) {
					elements.Present_S.textContent = currentCard.Present_Tense_Sentence || "";
				}
				if (elements.Present_Continuous_Tense_Sentence) {
					elements.Present_Continuous_Tense_Sentence.textContent = currentCard.Present_Continuous_Tense_Sentence || "";
				}
				if (elements.Chinese_Meaning) {
					elements.Chinese_Meaning.textContent = currentCard.Chinese_Meaning || "";
				}
				if (currentCard.Present_Tense_Image) {
					elements.PresentImage.src = `./res/${currentCard.Present_Tense_Image}`;
					elements.PresentImage.style.width = "400px";
					elements.PresentImage.style.height = "300px";

					// Add animation effect if this is any exercise and image is selected
					if (isExerciseOne || isExerciseTwo || isExerciseThree || isExerciseFour || 
						isExerciseFive || isExerciseSix || isExerciseSeven || isExamMode) {
						const currentQuestionIndex = currentIndex - introCards.length;
						const effectIndex = selectedImageIndices.indexOf(currentQuestionIndex);
						
						// Remove any existing animation classes
						elements.PresentImage.className = '';
						
						// Add animation effect if this image was selected
						if (effectIndex !== -1) {
							elements.PresentImage.classList.add(animationEffects[effectIndex]);
						}
						
						// Add click listeners for sentences
						addSentenceClickListeners();
					}
				}
			}
		} else {
			// Hide welcome message and show card content for other pages
			document.getElementById("welcome-message").style.display = "none";
			elements.cardInner.style.display = "block";
			elements.btnBack.style.display = "inline-block"; // Show "Review" button
			
			// Hide continue button when on the exercise button page (p16)
			const isExercisePage = cards[currentIndex]?.content?.id === "p16";
			elements.btnContinue.style.display = isExercisePage ? "none" : "inline-block";

			elements.introContent.innerHTML = "";
			elements.feedbackMessage.innerHTML = "";
			const currentCard = cards[currentIndex];
			if (currentCard.type === "intro") {
				elements.wordcardcontent.style.display = "none";
				const introContent = currentCard.content.cloneNode(true);
				answer_clicked(introContent);
				elements.introContent.append(...(introContent.childNodes));
			} else {
				elements.wordcardcontent.style.display = "block";

				// Set properties for current card
				// Add null checks before setting properties
				if (elements.Presentense) {
					elements.Presentense.textContent = currentCard.Present_Tense || "";
				}
				if (elements.Presentontinuous_Tense) {
					elements.Presentontinuous_Tense.textContent = currentCard.Present_Continuous_Tense || "";
				}
				if (elements.Present_S) {
					elements.Present_S.textContent = currentCard.Present_Tense_Sentence || "";
				}
				if (elements.Present_Continuous_Tense_Sentence) {
					elements.Present_Continuous_Tense_Sentence.textContent = currentCard.Present_Continuous_Tense_Sentence || "";
				}
				if (elements.Chinese_Meaning) {
					elements.Chinese_Meaning.textContent = currentCard.Chinese_Meaning || "";
				}

				if (currentCard.Present_Tense_Image) {
					elements.PresentImage.src = `./res/${currentCard.Present_Tense_Image}`;
					elements.PresentImage.style.width = "400px"; // Set width to 300px
					elements.PresentImage.style.height = "300px"; // Set height to 300px
					elements.PresentImage.onerror = () => console.error(`Image not found: ./res/${currentCard.Present_Tense_Image}`);
					
					// Add animation effect if this is any exercise and image is selected
					if (isExerciseOne || isExerciseTwo || isExerciseThree || isExerciseFour || 
						isExerciseFive || isExerciseSix || isExerciseSeven || isExamMode) {
						const currentQuestionIndex = currentIndex - introCards.length;
						const effectIndex = selectedImageIndices.indexOf(currentQuestionIndex);
						
						// Remove any existing animation classes
						elements.PresentImage.className = '';
						
						// Add animation effect if this image was selected
						if (effectIndex !== -1) {
							elements.PresentImage.classList.add(animationEffects[effectIndex]);
						}
						
						// Add click listeners for sentences
						addSentenceClickListeners();
					}
				} else if (elements.PresentImage) {
					elements.PresentImage.src = "";
					elements.PresentImage.style.width = ""; // Reset width
					elements.PresentImage.style.height = ""; // Reset height
				}
			}
		}    
	}
}

// New function to handle exercise start
function startExercise(buttonId) {
	// Reset counters
	wrongAnswers = 0;
	totalAnswered = 0;

	// Reset all exercise flags
	isExerciseOne = buttonId === 'exercise-1';
	isExerciseTwo = buttonId === 'exercise-2';
	isExerciseThree = buttonId === 'exercise-3';
	isExerciseFour = buttonId === 'exercise-4';
	isExerciseFive = buttonId === 'exercise-5';
	isExerciseSix = buttonId === 'exercise-6';
	isExerciseSeven = buttonId === 'exercise-7';
	isExamMode = buttonId === 'exam';
	currentIndex = introCards.length;
	
	// Create a new shuffled copy of the dataset
	const shuffledQuestions = shuffleArray([...dataset]);
	
	// Determine number of questions based on mode
	const questionCount = buttonId === 'exam' ? 25 : 10;
	
	// Select animated images for all exercises
	if (isExerciseOne || isExerciseTwo || isExerciseThree || isExerciseFour || 
		isExerciseFive || isExerciseSix || isExerciseSeven || isExamMode) {
		selectedImageIndices = selectAnimatedImageIndices(shuffledQuestions, questionCount);
	}
	
	// Select questions for this exercise
	const selectedQuestions = shuffledQuestions.slice(0, questionCount);
	
	// Update cards array with selected questions
	cards.splice(introCards.length, cards.length - introCards.length, ...selectedQuestions);
	
	// Show content and buttons
	if (elements.wordcardcontent) {
		elements.wordcardcontent.style.display = "block";
	}
	if (elements.introContent) {
		elements.introContent.innerHTML = "";
	}
	if (elements.btnBack) {
		elements.btnBack.style.display = "inline-block";
	}
	if (elements.btnContinue) {
		elements.btnContinue.style.display = "inline-block";
	}
	
	// Force render update
	renderCard();
}

// Navigation functions
function previousCard() {
	currentIndex = (currentIndex - 1 + cards.length) % cards.length;
}

function nextCard() {
	currentIndex = (currentIndex + 1) % cards.length;
}

// Add bag button dynamically
function addBagButton() {
    const bagButton = document.createElement("div");
    bagButton.className = "bag-button";
    bagButton.textContent = "My Bag";
    bagButton.onclick = () => {
        elements.bagMenu.style.display = "flex";
        renderBagItems();
    };
    document.querySelector("main").appendChild(bagButton);
}

// Render bag items
function renderBagItems() {
    const bagItems = loadBag();
    elements.bagItems.innerHTML = bagItems.length === 0 
        ? '<p>Your bag is empty</p>'
        : bagItems.map(item => `
            <div class="bag-item">
                <img src="./res/${item.image}" alt="${item.name}">
                <h3>${item.name}</h3>
            </div>
        `).join('');
}

// Modify the DOMContentLoaded event listener
document.addEventListener("DOMContentLoaded", () => {
	// Setup buttons
	setupButtons();
	// Initial render
	currentIndex = 0;
	renderCard();
});

// Add this new function to handle all button setup
function setupButtons() {
	// Start Game button handler
	const startGameButton = document.getElementById("start-game-button");
	if (startGameButton) {
		startGameButton.addEventListener("click", () => {
			currentIndex = 1;
			renderCard();
			const gameAudio = document.getElementById("game-audio");
			if (gameAudio) {
				gameAudio.play().catch(error => console.error("Audio playback failed:", error));
			}
		});
	}

	// Add Exercise section button handler
	const exerciseSectionButton = document.getElementById("exercise-section-button");
	if (exerciseSectionButton) {
		exerciseSectionButton.addEventListener("click", () => {
			// Find the index of section p16 in the cards array
			const exerciseIndex = introCards.findIndex(card => card.content.id === "p16");
			if (exerciseIndex !== -1) {
				currentIndex = exerciseIndex;
				renderCard();
			}
		});
	}

	// Navigation buttons
	const btnBack = document.getElementById("btn-back");
	const btnContinue = document.getElementById("btn-continue");
	
	if (btnBack) {
		btnBack.addEventListener("click", () => {
			previousCard();
			renderCard();
		});
	}
	
	if (btnContinue) {
		btnContinue.addEventListener("click", () => {
			// Clear feedback message for all exercises and exam
			if (isExerciseTwo || isExerciseThree || isExerciseFour || isExerciseFive || 
				isExerciseSix || isExerciseSeven || isExamMode) {
				const feedbackMessage = document.getElementById('feedback-message');
				if (feedbackMessage) {
					feedbackMessage.textContent = '';
					feedbackMessage.style.display = 'none';
				}
			}
			
			nextCard();
			renderCard();
		});
	}

	// Add shop functionality
    const moneyDisplay = document.getElementById('money-display');
    const shopMenu = document.getElementById('shop-menu');
    const closeShop = document.getElementById('close-shop');

    // Open shop when clicking money display
    if (moneyDisplay) {
        moneyDisplay.addEventListener('click', () => {
            shopMenu.style.display = 'flex';
        });
    }

    // Close shop when clicking close button
    if (closeShop) {
        closeShop.addEventListener('click', () => {
            shopMenu.style.display = 'none';
        });
    }

    // Handle buying items
    document.querySelectorAll('.buy-button').forEach(button => {
        button.addEventListener('click', () => {
            const price = parseInt(button.parentElement.querySelector('p').textContent.match(/\d+/)[0]);
            const currentMoney = loadMoney();
            const item = button.dataset.item;
            const itemName = button.parentElement.querySelector('h3').textContent;
            const itemImage = button.parentElement.querySelector('img').getAttribute('src').split('/').pop();

            if (currentMoney >= price) {
                // Deduct money and save
                const newBalance = currentMoney - price;
                saveMoney(newBalance);
                
                // Add item to bag
                const bagItems = loadBag();
                bagItems.push({ name: itemName, image: itemImage });
                saveBag(bagItems);
                
                // Update displays
                document.getElementById('money-display').textContent = `Money: $${newBalance}`;
                alert(`Successfully purchased ${itemName}!`);
            } else {
                alert('Not enough money! Complete more exercises to earn money.');
            }
        });
    });

    // Add error handling for shop item images
    document.querySelectorAll('.shop-item img').forEach(img => {
        img.onerror = () => {
            console.error(`Failed to load image: ${img.src}`);
            // Optionally show a placeholder or error message
            img.src = './res/placeholder.png'; // Add a placeholder image
        };
    });

    // Add bag functionality
    addBagButton();
    if (elements.closeBag) {
        elements.closeBag.addEventListener('click', () => {
            elements.bagMenu.style.display = 'none';
        });
    }
}

// Update due date based on user selection
const dayOffset = { again: 1, good: 3, easy: 7 };
function updateDueDate(type) {
	const card = cards[currentIndex];
	const today = new Date();
	const dueDate = new Date(today.setDate(today.getDate() + dayOffset[type]) - today.getTimezoneOffset() * 60 * 1000);
	(progressData[card.id] ||= {}).dueDate = dueDate.toISOString().split("T")[0];
	saveProgress(progressData);
}

// Handle answer submission
let attempts = 0;
elements.submitAnswerButton.addEventListener("click", () => {
	const currentCard = cards[currentIndex];
	const userAnswer = elements.answerInput.value.trim().toLowerCase();

	if (currentCard.type !== "intro" && currentCard.answer) {
		const correctAnswer = currentCard.answer.toLowerCase();
		attempts++;

		if (userAnswer === correctAnswer) {
			elements.feedbackMessage.textContent = "Correct! Well done!";
			elements.feedbackMessage.style.color = "green";
			elements.answerInput.disabled = true;
			elements.submitAnswerButton.disabled = true;
		} else if (attempts < 3) {
			elements.feedbackMessage.textContent = "Incorrect. Try again!";
			elements.feedbackMessage.style.color = "red";
		} else {
			elements.feedbackMessage.innerHTML = `The correct answer is: <b>${correctAnswer}</b>`;
			elements.feedbackMessage.style.color = "blue";
			elements.answerInput.disabled = true;
			elements.submitAnswerButton.disabled = true;
		}
	}
});
function setupQuestionHandlers() {
	// No questions require typing boxes or answers anymore, so this function can be left empty or removed.
}

// Add event listeners for answer rectangles in section p9
function answer_clicked(element) {
	if (!element) return;
	
	// Answer rectangles
	element.querySelectorAll(".answer-rectangle").forEach(rectangle => {
		rectangle.addEventListener("click", handleAnswerClick);
	});

	// Remove the old exercise button logic since we're handling it separately
	// in setupExerciseButtons()
}

// Separate function for handling answer clicks
function handleAnswerClick(event) {
	const selectedAnswer = event.target.dataset.answer;
	const feedbackMessage = document.querySelector("#flashcard #feedback-message");
	const audio = new Audio();

	if (selectedAnswer === "A") {
		feedbackMessage.textContent = "Correct!! Smart!!🎊🤩";
		feedbackMessage.style.color = "green";
		audio.src = "https://pfst.cf2.poecdn.net/base/audio/43afac63f214b828ab56fc9f045f0e9d2e04ece6341025cf72752f63d837aa47";
	} else {
		feedbackMessage.textContent = 'Oh no!! 😟🫂 The correct answer is "A".';
		feedbackMessage.style.color = "red";
		audio.src = "https://pfst.cf2.poecdn.net/base/audio/9aba513528729557cad1665da2c6417e2cb43d8b02764efc9475573d02e4d3b6";
	}
	
	feedbackMessage.style.display = "block";
	audio.play().catch(error => console.error("Audio playback failed:", error));
}

// Call the setup function after DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
	setupButtons();
	renderCard();
});

// Ensure the first page is blank when the webpage loads
currentIndex = 0;
renderCard();


