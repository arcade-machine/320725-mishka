var navMain = document.querySelector('.main-navigation');
var navOpen = document.querySelector('.main-navigation__toggle');
var navClose = document.querySelector('.main-navigation__close');
var open = document.querySelector('.modal');
var popup = document.querySelector('.modal-cart');
var close = document.querySelector('.modal-cart__close');


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

open.addEventListener('click', function (evt) {
  evt.preventDefault();
  popup.classList.add('modal-cart__show');
});
close.addEventListener('click', function (evt) {
  evt.preventDefault();
  popup.classList.remove('modal-cart__show')
});
