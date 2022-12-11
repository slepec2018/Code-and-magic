import startGame from './game.js';

const FIREBALL_SIZE = 22;
const WIZARD_WIDTH = 70;
const WIZARD_SPEED = 3;

// Fireball speed function
function getFireballSpeed(isMovingLeft) {
	return isMovingLeft ? 2 : 5;
}

// Function to set the wizard's height
function getWizardHeight() {
	return 1.337 * WIZARD_WIDTH;
}

// The function of setting the start of the wizard on the field along the X axis
function getWizardX(gameFieldWidth) {
	return (gameFieldWidth - WIZARD_WIDTH) / 2;
}

// The function of setting the start of the wizard on the field along the Y axis
function getWizardY(gameFieldHeight) {
	return gameFieldHeight / 3;
}

startGame(
	FIREBALL_SIZE,
	getFireballSpeed,
	WIZARD_WIDTH,
	WIZARD_SPEED,
	getWizardHeight,
	getWizardX,
	getWizardY
);
