import axios from 'https://cdn.jsdelivr.net/npm/axios@1.3.5/+esm';

const password = document.getElementById('password');
const resetButton = document.getElementById('reset');

function seterrorMessage(errorMessagetext){
    const existingErrorMessage = document.getElementById('errorMessage_signIn');
    if (existingErrorMessage) {
        existingErrorMessage.remove();
    }

    const errorMessage = document.createElement('span');
    errorMessage.style.color = 'red';
    errorMessage.id='errorMessage_signIn';
    errorMessage.textContent = errorMessagetext;
    password.insertAdjacentElement('afterend', errorMessage);
}

  
resetButton.addEventListener('click', async (event) => {
    event.preventDefault();

    const passwordValue=password.value;

    try{
        const res = await axios.post('/password/reset', {
            password: passwordValue
        });
        window.location.href = '/password/passwordchanged/passwordchanged.html';
    }
    catch(error){
        console.error(`HTTP error! Status: ${error.status}`);
    }
});