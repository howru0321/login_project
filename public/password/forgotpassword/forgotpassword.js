import axios from 'https://cdn.jsdelivr.net/npm/axios@1.3.5/+esm';

const email = document.getElementById('email');
const sendCodeButton = document.getElementById('sendCode');
const Instruction = document.getElementById('instruction');
const input_container = document.getElementById("input_container");

import {seterrorMessage} from '../../public.function.js';

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
            if(error.response){
                console.log(error.response.data);
                console.log(error.response.status);
                console.log(error.response.headers);
            }else if(error.request){
                console.log(error.request);
            }else{
                console.log('Error', error.message);
            }
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
    const existingErrorMessage = document.getElementById('errorMessage');
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
                seterrorMessage("errormessage-forgotpassword", "Account not found");
                return;
            }
            else{
                if(res.data.type === "google"){
                    seterrorMessage("errormessage-forgotpassword", "Registered with a Google account");
                    return;
                }
            }
        }
        catch(error){
            if(error.response){
                console.log(error.response.data);
                console.log(error.response.status);
                console.log(error.response.headers);
            }else if(error.request){
                console.log(error.request);
            }else{
                console.log('Error', error.message);
            }
        }

        transScreen(emailValue);
    
        try{
            const res = await axios.post('/password/recovery', {
                email: emailValue,
            });
        }
        catch(error){
            if(error.response){
                console.log(error.response.data);
                console.log(error.response.status);
                console.log(error.response.headers);
            }else if(error.request){
                console.log(error.request);
            }else{
                console.log('Error', error.message);
            }
            console.log(error.config);
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
            if(res.data.success){
                window.location.href = '/password/resetpassword/resetpassword.html';
            }
            else{
                seterrorMessage("errormessage-forgotpassword", res.data.message);
            }
        }
        catch(error){
            if(error.response){
                console.log(error.response.data);
                console.log(error.response.status);
                console.log(error.response.headers);
            }else if(error.request){
                console.log(error.request);
            }else{
                console.log('Error', error.message);
            }
            console.log(error.config);
        }
    }
});