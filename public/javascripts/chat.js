(async () => {
    const token = localStorage.getItem("token");

    if (!token) {
        alert('No token found. Please try again.');
        location.href = '/users/login';
        return;
    }

    const response = await axios.get('users/list', {
        headers: {
            Authorization: token,
        }
    })

    console.log(response.data);

    let socket = io.connect('localhost:3000', {
        extraHeaders: {
            Authorization: `${token}`
        }
    });

    const form = document.getElementById('form');
    const input = document.getElementById('input');
    const messages = document.getElementById('messages');

    form.addEventListener('submit', (e) => {
            e.preventDefault();
            if (input.value) {
                socket.emit('newMessage', {
                    message: input.value,
                    userId: 'userId'
                });
                input.value = '';
            }
        });

    socket.on('newMessage', (msg) => {
        const item = document.createElement('li');
        item.textContent = msg.message;
        messages.appendChild(item);
        window.scrollTo(0, document.body.scrollHeight);
    });
})();