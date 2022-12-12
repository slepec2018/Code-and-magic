import { getRandomArrayElement } from './util.js';

const NAMES = [
	'Ivan',
	'Juan Sebastian',
	'Maria',
	'Christoph',
	'Victor',
	'Julia',
	'Lupita',
	'Washington',
];
const SURNAMES = [
	'and Marya',
	'Veron',
	'Mirabella',
	'Waltz',
	'Onopko',
	'Topolnitskaya',
	'Nyongo',
	'Irving',
];
const COAT_COLORS = [
	'rgb(101, 137, 164)',
	'rgb(241, 43, 107)',
	'rgb(146, 100, 161)',
	'rgb(56, 159, 117)',
	'rgb(215, 210, 55)',
	'rgb(0, 0, 0)',
];
const EYES_COLORS = [
	'black',
	'red',
	'blue',
	'yellow',
	'green',
];
const SIMILAR_WIZARD_COUNT = 17;

// Mage Card Creation Function
const createWizard = () => ({
	name: `${getRandomArrayElement(NAMES)} ${getRandomArrayElement(SURNAMES)}`,
	colorCoat: getRandomArrayElement(COAT_COLORS),
	colorEyes: getRandomArrayElement(EYES_COLORS),
});

// The function of creating an array of cards of magicians
const createWizards = () => Array.from({ length: SIMILAR_WIZARD_COUNT }, createWizard);

export { createWizards };
