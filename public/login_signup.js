import axios from 'https://cdn.jsdelivr.net/npm/axios@1.3.5/+esm';


const GoTosignUpButton = document.getElementById('GoTosignUp');
const GoTosignInButton = document.getElementById('GoTosignIn');
const signUpButton = document.getElementById('signUp');
const signInButton = document.getElementById('signIn');

const signUp_email = document.getElementById('signUp_email');
const signUp_password = document.getElementById('signUp_password');
const signUp_confirm_password = document.getElementById('signUp_confirm_password');

const signIn_email = document.getElementById('signIn_email');
const signIn_password = document.getElementById('signIn_password');

const container = document.getElementById('container');

function seterrorMessage_signUp(errorMessagetext){
    const existingErrorMessage = document.getElementById('errorMessage_signUp');
    if (existingErrorMessage) {
        existingErrorMessage.remove();
    }

    const errorMessage = document.createElement('span');
    errorMessage.style.color = 'red';
    errorMessage.id='errorMessage_signUp';
    errorMessage.textContent = errorMessagetext;
    signUp_confirm_password.insertAdjacentElement('afterend', errorMessage);
}

function seterrorMessage_signIn(errorMessagetext){
    const existingErrorMessage = document.getElementById('errorMessage_signIn');
    if (existingErrorMessage) {
        existingErrorMessage.remove();
    }

    const errorMessage = document.createElement('span');
    errorMessage.style.color = 'red';
    errorMessage.id='errorMessage_signIn';
    errorMessage.textContent = errorMessagetext;
    signIn_password.insertAdjacentElement('afterend', errorMessage);
}

GoTosignUpButton.addEventListener('click', () => {
  container.classList.add("right-panel-active");
});

GoTosignInButton.addEventListener('click', () => {
  container.classList.remove("right-panel-active");
});

signUpButton.addEventListener('click', async (event) => {
    event.preventDefault();

    const emailValue=signUp_email.value;
    const passwordValue=signUp_password.value;
    const confirm_passwordValue=signUp_confirm_password.value;

    signUp_email.value='';
    signUp_password.value='';
    signUp_confirm_password.value='';

    try{
        const res = await axios.post('http://localhost:3000/vertify_email', {
            email: emailValue
        });
        if(res.data.duplicate){
            if(res.data.type === "general"){
                seterrorMessage_signUp("Duplicate Email");
            }
            else if(res.data.type === "google"){
                seterrorMessage_signUp("Registered with a Google account");
            }
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
    catch(error){
        console.error(`HTTP error! Status: ${error.status}`);
    }
});
  
signInButton.addEventListener('click', async (event) => {
    event.preventDefault();

    const emailValue=signIn_email.value;
    const passwordValue=signIn_password.value;

    signIn_email.value='';
    signIn_password.value='';

    try{
        const res = await axios.post('http://localhost:3000/vertify_email', {
            email: emailValue
        });
        if(res.data.duplicate){
            if(res.data.type === "google"){
                seterrorMessage_signIn("Registered with a Google account");
                return;
            }
        }
        else{
            seterrorMessage_signIn(`Not registered email: ${emailValue}`);
            return;
        }
    }
    catch(error){
        console.error(`HTTP error! Status: ${error.status}`);
    }

    try{
        const res = await axios.post('http://localhost:3000/login', {
            email: emailValue,
            password: passwordValue,
        });
        window.location.href = 'http://localhost:3000/';
    }
    catch(error){
        if(error.response.status === 401){
            seterrorMessage_signIn("Incorrect Password");
        }
        console.error(error);
    }
});