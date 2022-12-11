const FILE_TYPES = ['jpg', 'jpeg', 'png'];

const fileChooser = document.querySelector('.upload input[type=file]');
const preview = document.querySelector('.setup-user-pic');

// Creating an event for uploading an avatar to the site
fileChooser.addEventListener('change', () => {
	const file = fileChooser.files[0];
	const fileName = file.name.toLowerCase();

	const matches = FILE_TYPES.some((it) => fileName.endsWith(it));

	if (matches) {
		preview.src = URL.createObjectURL(file);
	}
});
