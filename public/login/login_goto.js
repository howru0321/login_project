const GoTosignUpButton = document.getElementById('GoTosignUp');
const GoTosignInButton = document.getElementById('GoTosignIn');

const container = document.getElementById('container');

GoTosignUpButton.addEventListener('click', () => {
  container.classList.add("right-panel-active");
});

GoTosignInButton.addEventListener('click', () => {
  container.classList.remove("right-panel-active");
});