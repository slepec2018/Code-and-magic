import { createWizards } from './data.js';
const { error } = console;
// Getting data from the server
const getData = (onSuccess, onFail = error ) => {
	fetch('https://raw.githubusercontent.com/slepec2018/Code-and-magic/master/data.json')
		.then((response) => response.json())
		.then((wizards) => {
			console.log(createWizards());
			onSuccess(wizards);
		})
		.catch((err) => {
			onFail(err);
			onSuccess(createWizards());
		});
};

// Sending data to the server
const sendData = (onSuccess, onFail, body) => {
	fetch(
		'https://27.javascript.pages.academy/code-and-magick',
		{
			method: 'POST',
			body,
		},
	)
		.then((response) => {
			if (response.ok) {
				onSuccess();
			} else {
				onFail('Failed to submit form. Try again');
			}
		})
		.catch(() => {
			onFail('Failed to submit form. Try again');
		});
};

export {getData, sendData};
