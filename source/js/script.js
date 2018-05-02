var navMain = document.querySelector('.main-navigation');
var navOpen = document.querySelector('.main-navigation__toggle');
var navClose = document.querySelector('.main-navigation__close');

navMain.classList.remove('main-navigation--nojs');

navOpen.addEventListener('click', function(evt) {
  evt.preventDefault();
  if (navMain.classList.contains('main-navigation--closed')) {
    navMain.classList.remove('main-navigation--closed');
    navMain.classList.add('main-navigation--opened');
  } else {
    navMain.classList.add('main-navigation--closed');
    navMain.classList.remove('main-navigation--opened');
  }
});

navClose.addEventListener('click', function(evt) {
  evt.preventDefault();
  if (navMain.classList.contains('main-navigation--closed')) {
    navMain.classList.remove('main-navigation--closed');
    navMain.classList.add('main-navigation--opened');
  } else {
    navMain.classList.add('main-navigation--closed');
    navMain.classList.remove('main-navigation--opened');
  }
});
