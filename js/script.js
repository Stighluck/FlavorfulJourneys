function toggleAnswer(element) {


    let arrow = element;
    let answer = element.nextElementSibling;

    let currentRotation = arrow.style.transform;
    if (currentRotation === "rotate(90deg)") {
        arrow.style.transform = "rotate(0deg)";
        arrow.style.color = "#1b1b1b";
    } else {
        arrow.style.transform = "rotate(90deg)";
        arrow.style.color = "#77dd76";
    }
    arrow.style.transition = "transform 0.3s ease";

    answer.classList.toggle('expanded');
}

function openLogin() {
    const overlay = document.getElementById("overlaylogin");
    const form = document.getElementById("loginform");
    overlay.style.display = "block";
    form.style.display = "block";
    requestAnimationFrame(() => {
        overlay.classList.add('activated');
        form.classList.add('activated');
    });
}

function exitLogin() {
    const overlay = document.getElementById("overlaylogin");
    const form = document.getElementById("loginform");
    overlay.classList.remove('activated');
    overlay.addEventListener('transitionend', handleTransitionEnd);
    form.classList.remove('activated');
    form.addEventListener('transitionend', handleTransitionEnd);

    function handleTransitionEnd() {
        overlay.style.display = 'none';
        overlay.removeEventListener('transitionend', handleTransitionEnd);
        form.style.display = 'none';
        form.removeEventListener('transitionend', handleTransitionEnd);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const ctadetails = document.querySelector('.ctadetails');
    const img = document.querySelector('.translucentctr img');

    function addHoverClass() {
        img.classList.add('img-hover');
    }
    function removeHoverClass() {
        img.classList.remove('img-hover');
    }

    ctadetails.addEventListener('mouseover', addHoverClass);
    ctadetails.addEventListener('mouseout', removeHoverClass);
    img.addEventListener('mouseover', addHoverClass);
    img.addEventListener('mouseout', removeHoverClass);
});

function openDropdown() {
    const dropdown = document.querySelector('.mobiledropdown');
    if (dropdown.style.display === "flex") {
        dropdown.style.display = "none";
    } else {
        dropdown.style.display = "flex";
    }
}

