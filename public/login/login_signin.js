import axios from 'https://cdn.jsdelivr.net/npm/axios@1.3.5/+esm';

const signInButton = document.getElementById('signIn');

const signIn_email = document.getElementById('signIn_email');
const signIn_password = document.getElementById('signIn_password');

import {seterrorMessage} from '../public.function.js';
  
signInButton.addEventListener('click', async () => {
    const emailValue=signIn_email.value;
    const passwordValue=signIn_password.value;

    signIn_email.value='';
    signIn_password.value='';

    try{
        const res = await axios.post('/email/verification', {
            email: emailValue
        });
        if(res.data.duplicate){
            if(res.data.type === "google"){
                seterrorMessage("errormessage-signin", "Registered with a Google account");
                return;
            }
        }
        else{
            seterrorMessage("errormessage-signin", `Not registered email: ${emailValue}`);
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

    try{
        const res = await axios.post('/user/signin', {
            email: emailValue,
            password: passwordValue,
        });

        if(res.data.success){
            window.location.href = '/howserver';
        }
        else{
            seterrorMessage("errormessage-signin", res.data.message);
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
});