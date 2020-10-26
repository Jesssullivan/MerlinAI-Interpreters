
// misc clientside functions.

export function MuiButton(titleName: string, holderName: string) {

    // MuiButton uses material-ui bootstrap:
    const MuiHolder = document.getElementById(holderName);
    const MuiBtn = document.createElement("button");

    MuiBtn.classList.add("mui-btn");
    MuiBtn.classList.add("mui-btn--raised");
    MuiBtn.textContent = titleName;

    // make sure all is updated in DOM
    while (MuiHolder!.firstChild) {
            MuiHolder!.removeChild(MuiHolder!.firstChild);
    }

    MuiHolder!.appendChild(MuiBtn);
    return(MuiBtn);

}
