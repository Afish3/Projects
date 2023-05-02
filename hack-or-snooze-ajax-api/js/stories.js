"use strict";

// This is the global list of the stories, an instance of StoryList
let storyList;

/** Get and show stories when site first loads. */

async function getAndShowStoriesOnStart() {
  storyList = await StoryList.getStories();
  $storiesLoadingMsg.remove();

  putStoriesOnPage();
}

/**
 * A render method to render HTML for an individual Story instance
 * - story: an instance of Story
 *
 * Returns the markup for the story.
 */

function generateStoryMarkup(story) {
  // console.debug("generateStoryMarkup", story);

  const hostName = story.getHostName();

  let favoriteStatus;
  if(favorites.includes(story.storyId)){
    favoriteStatus = 'solid'
  } else if(!favorites.includes(story.storyId)){
    favoriteStatus = 'regular'
  }

  return $(`
      <li id="${story.storyId}">
      <div class='star'>
      <i class="fa-${favoriteStatus} fa-star"></i>
      </div>
        <a href="${story.url}" target="a_blank" class="story-link">
          ${story.title}
        </a>
        <small class="story-hostname">(${hostName})</small>
        <small class="story-author">by ${story.author}</small>
        <small class="story-user">posted by ${story.username}</small>
      </li>
    `);
}

/** Gets list of stories from server, generates their HTML, and puts on page. */

function putStoriesOnPage() {
  console.debug("putStoriesOnPage");

  $allStoriesList.empty();

  // loop through all of our stories and generate HTML for them
  for (let story of storyList.stories) {
    const $story = generateStoryMarkup(story);
    $allStoriesList.append($story);
  }

  $allStoriesList.show();
}

async function addNewStory(evt) {
  evt.preventDefault();
  let newStory = await storyList.addStory(currentUser, {
    title: $titleName.val(),
    author: $authorName.val(),
    url: $storyUrl.val()
  });
  const $newStory = generateStoryMarkup(newStory);
  $allStoriesList.prepend($newStory);
  hidePageComponents();
  getAndShowStoriesOnStart();
}

$body.on('click', '#story-submit', addNewStory);

async function favorite(evt) {
  let storyID = evt.target.parentElement.parentElement.getAttribute('id');
  let addedFavorite = await User.addToFavorites(currentUser.loginToken, currentUser.username, storyID);
  let solidStar = document.createElement('div');
  solidStar.setAttribute('class', 'star')
  solidStar.innerHTML = '<i class="fa-solid fa-star"></i>';
  evt.target.parentElement.parentElement.prepend(solidStar);
  favorites.push(storyID);
  localStorage.setItem('favorites', JSON.stringify(favorites))
  evt.target.parentElement.remove();
}

$body.on('click', '.fa-regular', favorite);

async function unfavorite(evt) {
  let storyID = evt.target.parentElement.parentElement.getAttribute('id');
  let removedFavorite = await User.removeFromFavorites(currentUser.loginToken, currentUser.username, storyID);
  let emptyStar = document.createElement('div');
  emptyStar.setAttribute('class', 'star')
  emptyStar.innerHTML = '<i class="fa-regular fa-star"></i>';
  evt.target.parentElement.parentElement.prepend(emptyStar);
  favorites = favorites.filter(item => item !== storyID);
  localStorage.setItem('favorites', JSON.stringify(favorites))
  evt.target.parentElement.remove();
}

$body.on('click', '.fa-solid', unfavorite);

async function deleteStory(storyId, token) {
  let deletedStory = await axios.delete(`https://hack-or-snooze-v3.herokuapp.com/stories/${storyId}`, {
    params: {
      token
    }
  });
  return deletedStory;
}