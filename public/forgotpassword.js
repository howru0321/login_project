import axios from 'https://cdn.jsdelivr.net/npm/axios@1.3.5/+esm';

const email = document.getElementById('email');
const sendCodeButton = document.getElementById('sendCode');

function seterrorMessage(errorMessagetext){
    const existingErrorMessage = document.getElementById('errorMessage_forgotpassword');
    if (existingErrorMessage) {
        existingErrorMessage.remove();
    }

    const errorMessage = document.createElement('span');
    errorMessage.style.color = 'red';
    errorMessage.id='errorMessage_forgotpassword';
    errorMessage.textContent = errorMessagetext;
    sendCodeButton.insertAdjacentElement('afterend', errorMessage);
}

function addcodeInput(){
    const codeInput = document.createElement('input');
    codeInput.type = 'code';
    codeInput.placeholder = 'Enter Code';
    codeInput.name = 'code';
    codeInput.id = 'code';
    email.insertAdjacentElement('afterend', codeInput);
}
  
sendCodeButton.addEventListener('click', async (event) => {
    event.preventDefault();

    const emailValue=email.value;

    const existingCode = document.getElementById('code');
    if (!existingCode) {
        try{
            const res = await axios.post('/verify_email', {
                email: emailValue
            });
            if(!res.data.duplicate){
                seterrorMessage("Account not found");
                return;
            }
            else{
                if(res.data.type === "google"){
                    seterrorMessage("Registered with a Google account");
                    return;
                }
            }
        }
        catch(error){
            console.error(`HTTP error! Status: ${error}`);
        }

        addcodeInput();
        sendCodeButton.innerHTML = 'Continue';
    
        try{
            const res = await axios.post('/send_code', {
                email: emailValue,
            });
        }
        catch(error){
            console.error(`HTTP error! Status: ${error.status}`);
        }
        return;
    }
    else{
        const code = existingCode.value;

        email.disabled = true;
        existingCode.value='';

        try{
            const res = await axios.post('/verify_code', {
                email: emailValue,
                code: code
            });
            if(res){
                window.location.href = '/resetpassword.html';
            }
        }
        catch(error){
            if(error.response.status === 401){
                seterrorMessage("Incorrect Code");
            }
        }
    }
});