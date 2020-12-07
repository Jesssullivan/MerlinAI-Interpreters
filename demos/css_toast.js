const toasts = document.querySelectorAll(".toast");
const toastTriggers = document.querySelectorAll(".toast__trigger");

clicked = false;
text = document.getElementById('recordBtnText')

toastTriggers.forEach((trigger, index) => {
  let toastTimeout;

  trigger.addEventListener("click", () => {
    if (clicked === true) {
      toasts[index].classList.add("toast--active");
      toastTimeout = setTimeout(() => {
        toasts[index].classList.remove("toast--active");
      }, 3500);
    }
  });

  toasts[index].addEventListener("click", () => {
    toasts[index].classList.remove("toast--active");
    clearTimeout(toastTimeout);
  });
});

function setCoral(btn) {
  var property = document.getElementById(btn);
  if (clicked === false) {
    text = document.getElementById('recordBtnText')
    property.style.backgroundColor = "lightcoral"
    clicked = true;
  }
  else {
    text = document.getElementById('recordBtnText')
    property.style.backgroundColor = "#7FAF41"
    clicked = false;
  }
}
