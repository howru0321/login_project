export function seterrorMessage(containerId, errorMessagetext){
    const existingErrorMessage = document.getElementById('errorMessage');
    if (existingErrorMessage) {
        existingErrorMessage.remove();
    }

    const errorMessage = document.createElement('span');
    errorMessage.style.color = 'red';
    errorMessage.id='errorMessage';
    errorMessage.textContent = errorMessagetext;

    const errormessageContainer = document.getElementById(containerId);
    errormessageContainer.appendChild(errorMessage);
}