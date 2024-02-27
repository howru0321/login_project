import axios from 'https://cdn.jsdelivr.net/npm/axios@1.3.5/+esm';

const signUpButton = document.getElementById('signUp');

const signUp_email = document.getElementById('signUp_email');
const signUp_password = document.getElementById('signUp_password');
const signUp_confirm_password = document.getElementById('signUp_confirm_password');

import {seterrorMessage} from '../public.function.js';

function emailValidChk(email) {
    const pattern = /^[A-Za-z0-9_\.\-]+@[A-Za-z0-9\-]+\.[A-za-z0-9\-]+/;
    if(pattern.test(email) === false) { return false; }
    else { return true; }
}

signUpButton.addEventListener('click', async () => {
    const emailValue=signUp_email.value;
    const passwordValue=signUp_password.value;
    const confirm_passwordValue=signUp_confirm_password.value;

    signUp_email.value='';
    signUp_password.value='';
    signUp_confirm_password.value='';

    if(!emailValidChk(emailValue)){
        seterrorMessage("errormessage-signup", "Invalid Email format");
        return;
    }

    try{
        const res = await axios.post('/email/verification', {
            email: emailValue
        });
        if(res.data.duplicate){
            if(res.data.type === "general"){
                seterrorMessage("errormessage-signup", "Duplicate Email");
            }
            else if(res.data.type === "google"){
                seterrorMessage("errormessage-signup", "Registered with a Google account");
            }
            return;
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

    if(passwordValue !== confirm_passwordValue){
        seterrorMessage("errormessage-signup", "Password do not match");
        return;
    }

    try{
        const res = await axios.post('/user/signup', {
            email: emailValue,
            password: passwordValue,
        });
        window.location.href = '/welcome/welcome.html';
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
});