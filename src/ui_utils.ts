
export function MuiButton(titleName: string, holderName: string) {

    const MuiHolder = document.getElementById(holderName);
    const MuiBtn = document.createElement("button");

    MuiBtn.classList.add("mui-btn");
    MuiBtn.classList.add("mui-btn--raised");
    MuiBtn.textContent = titleName;

    while (MuiHolder!.firstChild) {
            MuiHolder!.removeChild(MuiHolder!.firstChild);
        }

    MuiHolder!.appendChild(MuiBtn);
    return(MuiBtn);

}

