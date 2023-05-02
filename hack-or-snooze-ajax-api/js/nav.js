"use strict";

/******************************************************************************
 * Handling navbar clicks and updating navbar
 */

/** Show main list of all stories when click site name */

function navAllStories(evt) {
  console.debug("navAllStories", evt);
  hidePageComponents();
  getAndShowStoriesOnStart();
}

$body.on("click", "#nav-all", navAllStories);

/** Show login/signup on click on "login" */

function navLoginClick(evt) {
  console.debug("navLoginClick", evt);
  hidePageComponents();
  $loginForm.show();
  $signupForm.show();
}

$navLogin.on("click", navLoginClick);

/** When a user first logins in, update the navbar to reflect that. */

function updateNavOnLogin() {
  console.debug("updateNavOnLogin");
  $(".main-nav-links").show();
  $navLogin.hide();
  $navLogOut.show();
  $navUserProfile.text(`${currentUser.username}`).show();
  $('.nav-left').show();
  getAndShowStoriesOnStart();
}

function navAddStoryClick() {
  hidePageComponents();
  $addStoryForm.show();
}

$body.on("click", "#nav-submit", navAddStoryClick);

function showFavorites() {
  hidePageComponents();
  $listOfFavorites.empty();
  for (const story of storyList.stories) {
    if(favorites.includes(story.storyId)){
      const $story = generateStoryMarkup(story);
      $listOfFavorites.append($story);
    }
  }
  $listOfFavorites.show();
}

$body.on('click', '#nav-favorites', showFavorites);

function showUserStories(){
  hidePageComponents();
  $('#user-stories-list').empty();
  for (const story of storyList.stories) {
    if(story.username === currentUser.username){
      const $story = generateStoryMarkup(story);
      let trashCan = document.createElement('div');
      trashCan.innerHTML = '<i class="fa-regular fa-trash-can"></i>';
      trashCan.setAttribute('class', 'trash');
      $userStoriesList.append(trashCan);
      $('#user-stories-list').append($story);
      trashCan.addEventListener('click', function(){
        deleteStory(trashCan.nextElementSibling.getAttribute('id'), currentUser.loginToken);
        trashCan.nextElementSibling.remove();
        trashCan.remove();
      })
    }
  }
  $('#user-stories-list').show();
}

$body.on('click', '#nav-my-stories', showUserStories);
