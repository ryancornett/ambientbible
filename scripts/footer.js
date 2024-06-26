export default function Footer() {
    const app = document.querySelector('.app');
    const infoModal = document.getElementById('info-modal');
    const infoClickable = document.getElementById('info-clickable');
    const closeInfo = document.getElementById('close-info');
    
    infoClickable.addEventListener('click', function () {
        infoModal.showModal();
        closeInfo.focus();
        app.classList.add('dialog-opened');
    });
    closeInfo.addEventListener('click', function () {
        infoModal.close();
        app.classList.remove('dialog-opened');
    });

    const lightDismiss = ({target:infoModal}) => {
        if (infoModal.nodeName === 'DIALOG') {
            infoModal.close('dismiss');
            app.classList.remove('dialog-opened');
        }
    };
    infoModal.addEventListener('click', lightDismiss);
}