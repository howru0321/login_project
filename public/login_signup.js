import axios from 'https://cdn.jsdelivr.net/npm/axios@1.3.5/+esm';


const signUpButton = document.getElementById('signUp');
const signInButton = document.getElementById('signIn');
const real_signUpButton = document.getElementById('real_signUp');
const real_signInButton = document.getElementById('real_signIn');

const email = document.getElementById('email');
const password = document.getElementById('password');
const confirm_password = document.getElementById('confirm_password');
const container = document.getElementById('container');

function seterrorMessage(errorMessagetext){
    const existingErrorMessage = document.getElementById('errorMessage');
    if (existingErrorMessage) {
        existingErrorMessage.remove();
    }

    const errorMessage = document.createElement('span');
    errorMessage.style.color = 'red';
    errorMessage.id='errorMessage';
    errorMessage.textContent = errorMessagetext;
    confirm_password.insertAdjacentElement('afterend', errorMessage);
}

signUpButton.addEventListener('click', () => {
  container.classList.add("right-panel-active");
});

signInButton.addEventListener('click', () => {
  container.classList.remove("right-panel-active");
});

real_signUpButton.addEventListener('click', async (event) => {
    event.preventDefault();

    const emailValue=email.value;
    const passwordValue=password.value;
    const confirm_passwordValue=confirm_password.value;

    email.value='';
    password.value='';
    confirm_password.value='';

    try{
        const res = await axios.post('http://localhost:3000/vertify_email', {
            email: emailValue
        });
        if(!res.data.success){
            seterrorMessage(res.data.message);
            return;
        }
    }
    catch(error){
        console.error(`HTTP error! Status: ${error.status}`);
    }

    try{
        const res = await axios.post('http://localhost:3000/signup', {
            email: emailValue,
            password: passwordValue,
            confirm_password: confirm_passwordValue
        });
        window.location.href = 'http://localhost:3000/welcome.html';
    }
    catch{
        console.error(`HTTP error! Status: ${error.status}`);
    }
});
  
real_signInButton.addEventListener('click', () => {
    //container.classList.remove("right-panel-active");
});