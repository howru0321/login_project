import axios from 'https://cdn.jsdelivr.net/npm/axios@1.3.5/+esm';

const signUpButton = document.getElementById('signUp');

const signUp_email = document.getElementById('signUp_email');
const signUp_password = document.getElementById('signUp_password');
const signUp_confirm_password = document.getElementById('signUp_confirm_password');

function seterrorMessage(errorMessagetext){
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

signUpButton.addEventListener('click', async () => {
    const emailValue=signUp_email.value;
    const passwordValue=signUp_password.value;
    const confirm_passwordValue=signUp_confirm_password.value;

    signUp_email.value='';
    signUp_password.value='';
    signUp_confirm_password.value='';

    try{
        const res = await axios.post('/email/verification', {
            email: emailValue
        });
        if(res.data.duplicate){
            if(res.data.type === "general"){
                seterrorMessage("Duplicate Email");
            }
            else if(res.data.type === "google"){
                seterrorMessage("Registered with a Google account");
            }
            return;
        }
    }
    catch(error){
        console.error(`HTTP error! Status: ${error.status}`);
    }

    if(passwordValue !== confirm_passwordValue){
        seterrorMessage("Password do not match");
        return;
    }

    try{
        const res = await axios.post('/user/signup', {
            email: emailValue,
            password: passwordValue,
        });
        window.location.href = '/welcome.html';
    }
    catch(error){
        console.error(`HTTP error! Status: ${error.status}`);
    }
});