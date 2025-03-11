// Game constants and configurations
const SIGN_MESSAGE = "Welcome to Crypto Bull Runner! Please sign this message to verify your wallet.";

let gameSpeed = 5;
let board;
const MAX_GAME_SPEED = 8; 
let boardWidth = 750;
let boardHeight = 250;
let context;

let dinoWidth=48;
let dinoHeight=51;
let duckedDinoWidth = 55;
let duckedDinoHeight = 30;
let dinoX=50;
let dinoY=boardHeight-dinoHeight-5;
let dinoImage1;
let dinoImage2;
let dinoDuck1;
let dinoDuck2;
let currentImage = 0;

let dino={
    x:dinoX,
    y:dinoY,
    width:dinoWidth,
    height:dinoHeight,
    velocityY: 0,
    isJumping: false,
    isDucking: false
}

// Add these physics constants
const GRAVITY = 0.4;
const JUMP_FORCE = -10;

// Add keyboard event listener
document.addEventListener('keydown', function(event) {
    if (event.code == "Space") {
        if (gameOver) {
            // Reset game
            gameOver = false;
            scoreSaveAttempted = false;  // Reset the flag
            playerScore = 0;
            gameSpeed = 5;
            cacti = [];
            ptero = [];
            dino.y = dinoY;
            dino.velocityY = 0;
            dino.isJumping = false;
        } else if (!dino.isJumping) {
            dino.velocityY = JUMP_FORCE;
            dino.isJumping = true;
        }
    }
    if ((event.code == "Space" || event.code == "ArrowUp") && !dino.isJumping) {
        dino.velocityY = JUMP_FORCE;
        dino.isJumping = true;
    }
    if (event.code == "ArrowDown") {
        dino.isDucking = true;
        dino.width = duckedDinoWidth;
        dino.height = duckedDinoHeight;
        dino.y = boardHeight - duckedDinoHeight - 30;
    }
});

// Add keyup listener to stop ducking
document.addEventListener('keyup', function(event) {
    if (event.code == "ArrowDown") {
        dino.isDucking = false;
        dino.width = dinoWidth;
        dino.height = dinoHeight;
        dino.y = boardHeight - dinoHeight - 30;
    }
});

// Add these variables at the top with other globals
let lastObstacleTime = 0;

let cacti = [];  // Array to store active cacti
const OBSTACLE_COOLDOWN = 1320;  // Increased from 1100 to reduce spawn rate by 20%
const CACTUS_WIDTH = 60;
const CACTUS_HEIGHT = 60;
let cactusImages = [];  // Array to store cactus images

let ptero=[];
let pteroImage1;
let pteroImage2;
let currentPteroImage = 0;
const PTERO_WIDTH = 42;
const PTERO_HEIGHT = 31;

// Add with other global variables
let groundImage;
let groundY = boardHeight - 30;  // 30 units up from bottom
let groundX = 0;  // Track ground position

let playerScore = 0;
let gameOver = false;
let gameFont;  // We'll use a custom font

// Add these variables at the top with other globals
let walletConnected = false;
let playerAddress = "Guest";
let gameStarted = false;

// Add this with other global variables
let isConnecting = false;

// Add these with other global variables at the top
let bitcoins = [];
const BITCOIN_WIDTH = 60;
const BITCOIN_HEIGHT = 60;
let bitcoinImage;
let gamePaused = false;
let questionStartTime;

// Add these with other global variables at the top
let lastBitcoinTime = 0;
const BITCOIN_SPAWN_INTERVAL = 7000; // 10 seconds in milliseconds

// Add this with other global variables at the top
let scoreSaveAttempted = false;

let questions = [];

// Add at the top with other imports
let correctAnimation;

// Add this at the top of your file with your other event listeners
window.addEventListener('keydown', function(e) {
    if((e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'ArrowDown') && e.target === document.body) {
        e.preventDefault();
        return false;
    }
});

// Update the connectWallet function
async function connectWallet() {
    if (isConnecting) {
        alert("Connection already in progress. Please check MetaMask popup.");
        return;
    }

    if (typeof window.ethereum !== 'undefined') {
        try {
            isConnecting = true;
            
            const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
            const account = accounts[0];
            
            try {
                const signature = await ethereum.request({
                    method: 'personal_sign',
                    params: [SIGN_MESSAGE, account, 'Example password'],
                });
                
                // Send signature to backend for verification
                const response = await fetch('https://dino-hbc0huehbcczfxbt.israelcentral-01.azurewebsites.net/api/verify-signature', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        message: SIGN_MESSAGE,
                        signature: signature,
                        address: account
                    })
                });

                const data = await response.json();
                
                if (data.verified) {
                    walletConnected = true;
                    playerAddress = account;
                    startGame();
                } else {
                    alert("Signature verification failed. Please try again.");
                    fallbackToGuest();
                }
            } catch (signError) {
                console.error('Signature error:', signError);
                if (signError.code === 4001) {
                    alert("You need to sign the message to verify your wallet ownership.");
                } else {
                    alert("Error during signature verification. Playing as guest.");
                }
                fallbackToGuest();
            }
            
        } catch (error) {
            console.error(error);
            if (error.code === -32002) {
                alert("Please check MetaMask. Connection request already pending.");
            }
            fallbackToGuest();
        } finally {
            isConnecting = false;
        }
    } else {
        if (confirm('MetaMask is required to connect wallet. Would you like to install it now?')) {
            window.open('https://metamask.io/download/', '_blank');
        } else {
            fallbackToGuest();
        }
    }
}

// Update the fallbackToGuest function to be more informative
function fallbackToGuest() {
    playerAddress = "Guest";
    walletConnected = false;
    console.log("Falling back to guest mode");
    startGame();
}

// Update window.onload function
window.onload = async function() {
    try {
        // Fetch questions
        const response = await fetch('assets/questions.json');
        const data = await response.json();
        questions = data.questions;
        
        setupCanvas();

        // Load ground image as background
        groundImage = new Image();
        groundImage.src = "assets/ground.png";

        // Preload all images
        dinoImage1 = new Image();
        dinoImage2 = new Image();

        dinoDuck1 = new Image();
        dinoDuck2 = new Image();

        pteroImage1 = new Image();
        pteroImage2 = new Image();

        dinoImage1.src = "assets/Bull1.png";
        dinoImage2.src = "assets/Bull1.png";

        dinoDuck1.src = "assets/GoatDucking.png";
        dinoDuck2.src = "assets/GoatDucking.png";

        pteroImage1.src = "assets/Ptero1.png";
        pteroImage2.src = "assets/Ptero2.png";

        // Load cactus images
        for (let i = 1; i <= 7; i++) {
            let cactusImg = new Image();
            cactusImg.src = `assets/cacti/cactus${i}.png`;
            cactusImages.push(cactusImg);
        }

        // Load bitcoin image
        bitcoinImage = new Image();
        bitcoinImage.src = "assets/bitcoin.png";
        
        // Load the animation
        correctAnimation = bodymovin.loadAnimation({
            container: document.createElement('div'), // Create a container
            renderer: 'svg',
            loop: false,
            autoplay: false,
            path: 'assets/correctAnswerAnimation.json'
        });
        
        // Wait for all images to load
        await Promise.all([
            new Promise(resolve => dinoImage1.onload = resolve),
            new Promise(resolve => dinoImage2.onload = resolve),
            new Promise(resolve => dinoDuck1.onload = resolve),
            new Promise(resolve => dinoDuck2.onload = resolve),
            new Promise(resolve => pteroImage1.onload = resolve),
            new Promise(resolve => pteroImage2.onload = resolve),
            new Promise(resolve => groundImage.onload = resolve),
            new Promise(resolve => bitcoinImage.onload = resolve),
            // Load all cactus images
            ...cactusImages.map(img => new Promise(resolve => img.onload = resolve))
        ]);

        // Load initial leaderboard data
        updateLeaderboard();
        // Then show connection options
        showConnectionOptions();
    } catch (error) {
        console.error('Error loading questions:', error);
    }
}

function setupCanvas() {
    board = document.getElementById("board");
    context = board.getContext("2d");
    
    // Get device pixel ratio
    const dpr = window.devicePixelRatio || 1;
    
    // Set actual size in memory (scaled for retina)
    board.width = 750 * dpr;
    board.height = 250 * dpr;
    
    // Set display size
    board.style.width = '750px';
    board.style.height = '250px';
    
    // Scale for retina display
    context.scale(dpr, dpr);
    
    // Enable better image rendering
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';
}

function showConnectionOptions() {
    context.fillStyle = "white";
    context.fillRect(0, 0, boardWidth, boardHeight);
    
    context.fillStyle = "black";
    context.textAlign = "center";
    
    // Welcome and description - positioned higher up
    context.font = "bold 16px PressStart2P";
    context.fillText("Welcome to Crypto Bull Runner!", boardWidth/2, 50);
    
    context.font = "bold 12px PressStart2P";
    context.fillText("Dodge obstacles, collect bitcoins, answer questions!", boardWidth/2, 80);
    
    // Instructions - more compact
    context.font = "bold 12px PressStart2P";
    context.fillText("Controls:", boardWidth/2, 120);
    context.fillText("Up - Jump | Down - Duck", boardWidth/2, 145);
    
    // Draw buttons with adjusted positioning
    drawButton("Play as Guest", boardWidth/2 - 150, 200, () => {
        playerAddress = "Guest";
        startGame();
    });
    
    drawButton("Connect Wallet", boardWidth/2 + 150, 200, connectWallet);
}

function drawButton(text, x, y, callback) {
    const buttonWidth = 180;  // Slightly smaller buttons
    const buttonHeight = 40;  // Slightly smaller height
    
    // Draw button background
    context.fillStyle = "#ff8c00";
    context.fillRect(x - buttonWidth/2, y - buttonHeight/2, buttonWidth, buttonHeight);
    
    // Draw button text
    context.fillStyle = "white";
    context.font = "bold 14px PressStart2P";
    context.fillText(text, x, y + 5);
    
    // Add click handler
    board.addEventListener("click", function handleClick(event) {
        const rect = board.getBoundingClientRect();
        const clickX = event.clientX - rect.left;
        const clickY = event.clientY - rect.top;
        
        if (clickX >= x - buttonWidth/2 && 
            clickX <= x + buttonWidth/2 && 
            clickY >= y - buttonHeight/2 && 
            clickY <= y + buttonHeight/2) {
            board.removeEventListener("click", handleClick);
            callback();
        }
    });
}

function startGame() {
    gameStarted = true;
    updateLeaderboard();
    requestAnimationFrame(update);
}

// Update the update function to be async
async function update() {
    if (gamePaused) return;
    
    context.clearRect(0, 0, boardWidth, boardHeight);
    
    // Update ground position for scrolling background
    groundX -= gameSpeed;
    if (groundX <= -boardWidth) {
        groundX = 0;
    }
    
    // Draw ground as full background with two images for seamless scrolling
    context.drawImage(groundImage, groundX, 0, boardWidth, boardHeight);
    context.drawImage(groundImage, groundX + boardWidth, 0, boardWidth, boardHeight);
    
    // Spawn new cactus
    const currentTime = Date.now();
    if (currentTime - lastObstacleTime >= OBSTACLE_COOLDOWN) {
        const spawnChance = Math.random();
        if (spawnChance < 0.16 && spawnChance > 0.08) {  // Reduced from 0.2-0.1 to 0.16-0.08
            ptero.push(spawnPtero());
            lastObstacleTime = currentTime;
        } else if (spawnChance >= 0.68) {  // Increased from 0.6 to 0.68 to reduce spawn rate
            cacti.push(spawnCactus());
            lastObstacleTime = currentTime;
        }
    }
    
    // Update and draw cacti
    cacti = cacti.filter(cactus => {
        cactus.speed = gameSpeed;  // Update cactus speed to match current gameSpeed
        cactus.x -= cactus.speed;
        context.drawImage(cactus.image, cactus.x, cactus.y, cactus.width, cactus.height);
        
        // Draw hitbox for cacti (optional, for debugging)
        // context.strokeStyle = "red";
        // context.strokeRect(cactus.x, cactus.y, cactus.width, cactus.height);

        return cactus.x > -CACTUS_WIDTH;  // Keep if still on screen
    });
    
    // Apply gravity and update position
    dino.velocityY += GRAVITY;
    dino.y += dino.velocityY;
    
    // Prevent dino from falling through the ground
    if (dino.y > boardHeight - dino.height - 30) {
        dino.y = boardHeight - dino.height - 30;
        dino.velocityY = 0;
        dino.isJumping = false;
    }
    
    // Animation logic
    currentImage += 0.15;
    if (currentImage >= 2) {
        currentImage = 0;
    }

    currentPteroImage += 0.15;
    if (currentPteroImage >= 2) {
        currentPteroImage = 0;
    }
    
    // Choose the appropriate image based on ducking state
    let currentDino;
    if (dino.isDucking) {
        currentDino = Math.floor(currentImage) === 0 ? dinoDuck1 : dinoDuck2;
    } else {
        currentDino = Math.floor(currentImage) === 0 ? dinoImage1 : dinoImage2;
    }
    
    // Draw the dino sprite
    context.drawImage(currentDino, dino.x, dino.y, dino.width, dino.height);
    
    if (gameOver) {
        // Game over screen
        context.font = "bold 24px PressStart2P";
        context.fillStyle = "black";
        context.textAlign = "center";
        
        // Draw "Game Over"
        context.fillText("Game Over", boardWidth/2, boardHeight/2 - 40);
        
        // Draw final score
        context.fillText(`Score: ${Math.floor(playerScore)}`, boardWidth/2, boardHeight/2);
        
        // Save score only once
        if (!scoreSaveAttempted) {
            await saveScore(playerAddress, playerScore);
            scoreSaveAttempted = true;
        }
        
        // Draw "Press Space to Restart"
        context.font = "bold 16px PressStart2P";
        context.fillText("Press Space to Restart", boardWidth/2, boardHeight/2 + 40);
    } else {
        // Increment score
        playerScore += 0.1;
        
        // Increase game speed over time
        if (gameSpeed < MAX_GAME_SPEED) {
            gameSpeed += 0.004;
        }
        
        // Draw score
        context.font = "bold 24px PressStart2P";
        context.fillStyle = "black";
        context.textAlign = "right";
        context.fillText(Math.floor(playerScore), boardWidth - 30, 50);
    }
    
    // Update ptero animation
    
    // Update and draw pteros
    ptero = ptero.filter(p => {
        p.speed = gameSpeed;  // Update ptero speed to match current gameSpeed
        p.x -= p.speed;
        const currentPteroSprite = Math.floor(currentPteroImage) === 0 ? pteroImage1 : pteroImage2;
        context.drawImage(currentPteroSprite, p.x, p.y, p.width, p.height);
        
        // Draw hitbox for debugging
        // context.strokeStyle = "red";
        // context.strokeRect(p.x, p.y, p.width, p.height);
        
        return p.x > -PTERO_WIDTH;
    });
    
    // Check for collisions
    cacti.forEach(cactus => {
        if (detectCollision(dino, cactus)) {
            gameOver = true;
            gameSpeed = 0;
            cacti = [];
            ptero = [];
        }
    });
    
    ptero.forEach(p => {
        if (detectCollision(dino, p)) {
            gameOver = true;
            gameSpeed = 0;
            cacti = [];
            ptero = [];
        }
    });
    
    // Draw player address in top left corner
    context.font = "bold 16px PressStart2P";
    context.fillStyle = "black";
    context.textAlign = "left";
    context.fillText(playerAddress.substring(0, 10) + (playerAddress.length > 10 ? "..." : ""), 10, 30);
    
    // Spawn bitcoin every 10 seconds
    if (currentTime - lastBitcoinTime >= BITCOIN_SPAWN_INTERVAL) {
        bitcoins.push(spawnBitcoin());
        lastBitcoinTime = currentTime;
    }
    
    // Update and draw bitcoins
    bitcoins = bitcoins.filter(bitcoin => {
        bitcoin.x -= bitcoin.speed;
        context.drawImage(bitcoinImage, bitcoin.x, bitcoin.y, bitcoin.width, bitcoin.height);
        
        // Check collision with dino
        if (detectCollision(dino, bitcoin)) {
            showQuizPopup();
            return false; // Remove bitcoin after collision
        }
        
        return bitcoin.x > -bitcoin.width;
    });
    
    if (!gamePaused) {
        requestAnimationFrame(update);
    }
}

// Add this function to create new cactus objects
function spawnCactus() {
    return {
        x: boardWidth,  // Start at the right edge
        y: boardHeight - CACTUS_HEIGHT - 17,  // Move cactus up 5 pixels
        width: CACTUS_WIDTH,
        height: CACTUS_HEIGHT,
        image: cactusImages[Math.floor(Math.random() * 6)],  // Random cactus type
        speed: gameSpeed  // Pixels per frame
    };
}

// Add collision detection function
function detectCollision(dino, cactus) {
    return !(
        dino.x + dino.width < cactus.x ||
        dino.x > cactus.x + cactus.width ||
        dino.y + dino.height < cactus.y ||
        dino.y > cactus.y + cactus.height
    );
}

function spawnPtero() {
    return {
        x: boardWidth,
        y: [150, 180 , 200][Math.floor(Math.random() * 3)], // Random height
        width: PTERO_WIDTH,
        height: PTERO_HEIGHT,
        speed: gameSpeed
    };
}

// Add bitcoin spawning function
function spawnBitcoin() {
    return {
        x: boardWidth,
        y: [70, 180 , 100][Math.floor(Math.random() * 3)], // Random height
        width: BITCOIN_WIDTH,
        height: BITCOIN_HEIGHT,
        speed: gameSpeed
    };
}

// Update your showQuizPopup function to use the new questions array
function showQuizPopup() {
    if (questions.length > 0) {
        gamePaused = true;
        let randomIndex = Math.floor(Math.random() * questions.length);
        let selectedQuestion = questions[randomIndex];
        
        // Create popup div if it doesn't exist
        let quizPopup = document.getElementById('quizPopup');
        if (!quizPopup) {
            quizPopup = document.createElement('div');
            quizPopup.id = 'quizPopup';
            quizPopup.style.position = 'absolute';
            quizPopup.style.top = '50%';
            quizPopup.style.left = '50%';
            quizPopup.style.transform = 'translate(-50%, -50%)';
            quizPopup.style.background = '#f8f9fa';
            quizPopup.style.padding = '20px';
            quizPopup.style.borderRadius = '10px';
            quizPopup.style.zIndex = '1000';
            document.body.appendChild(quizPopup);
        }

        let choicesHTML = '';
        if (selectedQuestion.choices) {
            choicesHTML = selectedQuestion.choices.map((choice, index) => 
                `<p>Choice ${index + 1}: ${choice}</p>`
            ).join('');
        } else {
            choicesHTML = `
                <p>Choice 1: True</p>
                <p>Choice 2: False</p>
            `;
        }

        quizPopup.innerHTML = `
            <h3 style="color: #333; margin-bottom: 15px;">${selectedQuestion.question}</h3>
            <div style="color: #555;">
                ${choicesHTML}
            </div>
            <p style="color: #666; margin-top: 10px;">Press 1, 2${selectedQuestion.choices ? ` or 3` : ''} to answer</p>
        `;
        
        quizPopup.style.display = 'block';
        questionStartTime = Date.now();

        const handleKeyPress = function(e) {
            const key = e.key;
            if ((key >= "1" && key <= "3") || key === "1" || key === "2") {
                handleAnswer(key, selectedQuestion.answer);
                document.removeEventListener('keydown', handleKeyPress);
            }
        };

        document.addEventListener('keydown', handleKeyPress);
    }
}

function handleAnswer(userAnswer, correctAnswer) {
    const responseTime = (Date.now() - questionStartTime) / 1000;
    const isCorrect = userAnswer === correctAnswer;
    const points = calculateScore(responseTime, isCorrect);
    
    let quizPopup = document.getElementById('quizPopup');
    if (quizPopup) {
        quizPopup.style.display = 'none';
    }
    
    if (isCorrect) {
        // Play the animation
        const animContainer = document.createElement('div');
        animContainer.style.position = 'fixed';
        animContainer.style.top = '17%';
        animContainer.style.left = '50%';
        animContainer.style.transform = 'translate(-50%, -50%)';
        animContainer.style.zIndex = '1000';
        animContainer.style.pointerEvents = 'none';
        // Use viewport units instead of pixels to maintain proportions
        animContainer.style.width = '8vw';  
        animContainer.style.height = '8vw';
        document.body.appendChild(animContainer);

        const anim = bodymovin.loadAnimation({
            container: animContainer,
            renderer: 'svg',
            loop: false,
            autoplay: true,
            path: 'assets/correctAnswerAnimation.json'
        });

        // Remove the animation container after it's done
        anim.addEventListener('complete', () => {
            document.body.removeChild(animContainer);
        });

        playerScore += points;
    }else{
        const animContainer = document.createElement('div');
        animContainer.style.position = 'fixed';
        animContainer.style.top = '17%';
        animContainer.style.left = '50%';
        animContainer.style.transform = 'translate(-50%, -50%)';
        animContainer.style.zIndex = '1000';
        animContainer.style.pointerEvents = 'none';
        // Use viewport units instead of pixels to maintain proportions
        animContainer.style.width = '8vw';  
        animContainer.style.height = '8vw';
        document.body.appendChild(animContainer);

        const anim = bodymovin.loadAnimation({
            container: animContainer,
            renderer: 'svg',
            loop: false,
            autoplay: true,
            path: 'assets/incorrectAnswerAnimation.json'
        });

        // Remove the animation container after it's done
        anim.addEventListener('complete', () => {
            document.body.removeChild(animContainer);
        });
    }
    
    gamePaused = false;
    requestAnimationFrame(update);
}

function calculateScore(responseTime, isCorrect) {
    if (!isCorrect) return 0;
    
    if (responseTime <= 1) {
        return 100;
    } else if (responseTime >= 5) {
        return 10;
    } else {
        return Math.round(100 - ((responseTime - 1) * (90/4)));
    }
}

// Add this function to save score to MongoDB
async function saveScore(address, score) {
    try {
        const playerIdentifier = (address === "Guest" || !address) ? "Guest" : address;
        
        const response = await fetch('https://dino-hbc0huehbcczfxbt.israelcentral-01.azurewebsites.net/api/scores', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                address: playerIdentifier,
                score: Math.floor(score)
            })
        });
        
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        
        const data = await response.json();
        console.log('Score saved:', data);
        
        // Update the leaderboard after saving a new score
        await updateLeaderboard();
    } catch (error) {
        console.error('Error saving score:', error);
    }
}

// Add this function to fetch top scores
async function getTopScores() {
    try {
        const response = await fetch('https://dino-hbc0huehbcczfxbt.israelcentral-01.azurewebsites.net/api/scores');
        const scores = await response.json();
        return scores;
    } catch (error) {
        console.error('Error fetching scores:', error);
        return [];
    }
}

// Add this function to update the leaderboard display
async function updateLeaderboard() {
    try {
        const scores = await getTopScores();
        const leaderboardBody = document.getElementById('leaderboard-body');
        
        if (!leaderboardBody) return;
        
        leaderboardBody.innerHTML = '';
        
        scores.forEach((score, index) => {
            const row = document.createElement('tr');
            const displayAddress = score.address === 'Guest' ? 
                'Guest' : 
                `${score.address.substring(0, 6)}...${score.address.substring(score.address.length - 4)}`;
            
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${displayAddress}</td>
                <td>${score.score}</td>
            `;
            
            leaderboardBody.appendChild(row);
        });
    } catch (error) {
        console.error('Error updating leaderboard:', error);
    }
}