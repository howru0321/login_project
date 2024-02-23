import axios from 'https://cdn.jsdelivr.net/npm/axios@1.3.5/+esm';

const email = document.getElementById('email');
const sendCodeButton = document.getElementById('sendCode');
const Instruction = document.getElementById('instruction');
const input_container = document.getElementById("input_container");

function seterrorMessage(errorMessagetext){
    const existingErrorMessage = document.getElementById('errorMessage_forgotpassword');
    if (existingErrorMessage) {
        existingErrorMessage.remove();
    }

    const errorMessage = document.createElement('span');
    errorMessage.style.color = 'red';
    errorMessage.id='errorMessage_forgotpassword';
    errorMessage.textContent = errorMessagetext;

    const nodesWithType = document.querySelectorAll('input');
    const lastNodeWithType = nodesWithType[nodesWithType.length - 1];
    lastNodeWithType.insertAdjacentElement('afterend', errorMessage);
}

function addcodeInput(){
    const codeInput = document.createElement('input');
    codeInput.type = 'code';
    codeInput.placeholder = 'Enter Code';
    codeInput.name = 'code';
    codeInput.id = 'code';
    input_container.insertAdjacentElement('afterend', codeInput);
}

function addresendButton(emailValue) {
    const button = document.createElement("button");

    button.textContent = "ReSend";

    button.onclick = async function() {
        try{
            const res = await axios.post('/password/recovery', {
                email: emailValue,
            });
        }
        catch(error){
            console.error(`HTTP error! Status: ${error.status}`);
        }
    };

    email.insertAdjacentElement('afterend', button);
}

function transScreen(emailValue){
    addcodeInput();
    email.style.width="75%";
    addresendButton(emailValue);

    Instruction.innerHTML = 'Enter you code in 5 miniutes'
    sendCodeButton.innerHTML = 'Continue';
    const existingErrorMessage = document.getElementById('errorMessage_forgotpassword');
    if (existingErrorMessage) {
        existingErrorMessage.remove();
    }
    email.disabled = true;
}

sendCodeButton.addEventListener('click', async () => {
    const emailValue=email.value;

    const existingCode = document.getElementById('code');
    if (!existingCode) {
        try{
            const res = await axios.post('/email/verification', {
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

        transScreen(emailValue);
    
        try{
            const res = await axios.post('/password/recovery', {
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
        existingCode.value='';

        try{
            const res = await axios.post('/password/verification', {
                email: emailValue,
                code: code
            });
            if(res){
                window.location.href = '/password/resetpassword/resetpassword.html';
            }
        }
        catch(error){
            if(error.response.status === 401){
                seterrorMessage("Incorrect Code");
            }
        }
    }
});