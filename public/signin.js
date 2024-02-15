import axios from 'https://cdn.jsdelivr.net/npm/axios@1.3.5/+esm';

const signInButton = document.getElementById('signIn');

const signIn_email = document.getElementById('signIn_email');
const signIn_password = document.getElementById('signIn_password');

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
        const res = await axios.post('http://localhost:3000/signin', {
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