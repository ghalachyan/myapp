const form = document.querySelector('#login-form');

form.addEventListener('submit', async event => {
	event.preventDefault()

	const data = {
		email: document.getElementById('email').value,
		password: document.getElementById('password').value,
	}
	const error = document.querySelectorAll('.error')
	error.forEach(span => {
		span.textContent = ''
	})

	try {
		const response = await axios.post('/users/login', data)
		const token = response.data.token		
		
		if (token) {
			localStorage.setItem('token', token);
			location.href = '/chat'
		} else {
			console.log('Login failed, no token received.')
		}
	} catch (error) {
		if (error.response.data) {
            const fields = error.response.data.fields;
            if (fields) {
                Object.keys(fields).forEach(key => {
                    const messages = fields[key];
                    const errorSpan = document.querySelector(`#${key}-error`);
                    if (errorSpan) {
                        errorSpan.textContent = messages;
                    }
                });
            } else if (error.response.data.message) {
                const messageElement = document.querySelector('#general-error');
                if (messageElement) {
                    messageElement.textContent = error.response.data.message;
                }
            }
		} else {
			console.error('Error without response:', error.message)
		}
	}
})
