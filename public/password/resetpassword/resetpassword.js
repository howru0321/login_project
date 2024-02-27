import axios from 'https://cdn.jsdelivr.net/npm/axios@1.3.5/+esm';

const password = document.getElementById('password');
const resetButton = document.getElementById('reset');
  
resetButton.addEventListener('click', async (event) => {
    event.preventDefault();

    const passwordValue=password.value;

    try{
        const res = await axios.post('/password/reset', {
            password: passwordValue
        });
        if(res.data.success){
            window.location.href = '/password/passwordchanged/passwordchanged.html';
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
});