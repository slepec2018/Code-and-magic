import {isEscapeKey, isEnterKey} from './util.js';

const userModalElement = document.querySelector('.setup');
const userModalOpenElement = document.querySelector('.setup-open');
const userModalCloseElement = userModalElement.querySelector('.setup-close');

// The function of closing the popup by pressing the ESC button
const onPopupEscKeydown = (evt) => {
	if (isEscapeKey(evt)) {
		evt.preventDefault();
		closeUserModal();
	}
};

// Popup opening function
function openUserModal () {
	userModalElement.classList.remove('hidden');

	document.addEventListener('keydown', onPopupEscKeydown);
}

// Popup closing function
function closeUserModal () {
	userModalElement.classList.add('hidden');

	document.removeEventListener('keydown', onPopupEscKeydown);
}

userModalOpenElement.addEventListener('click', () => {
	openUserModal();
});

userModalOpenElement.addEventListener('keydown', (evt) => {
	if (isEnterKey(evt)) {
		openUserModal();
	}
});

// Hanging a popup close event on button click
userModalCloseElement.addEventListener('click', () => {
	closeUserModal();
});

userModalCloseElement.addEventListener('keydown', (evt) => {
	if (isEnterKey(evt)) {
		closeUserModal();
	}
});

export {openUserModal, closeUserModal};
