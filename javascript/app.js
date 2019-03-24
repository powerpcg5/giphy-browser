 //////////////////////////////////////////////////////////////////////////////
 // giphy-browser/javascript/app.js
 // Giphy Browser with persistent local storage
 //
 // 0056 Saturday, 23 March 2019 (EDT) [17978]
 //
 // University of Richmond Coding Boot Camp run by Trilogy Education Services
 // Austin Kim
 //
 // Modified:
 //////////////////////////////////////////////////////////////////////////////

 // Giphy API key
const api_key = 'kPYfzciWv3mNaxBUymuXQMjS1RAwgB2B'

 // User settings
var limit = 10                           // Number of images per page
var rating = 'G'                         // Image rating
var lang = 'en'                          // Language/locale
var size = 50                            // Image size (square root of area)
var info = 'rating'                      // Image info detail level

 // Global variables
var localStorageAvailable = false        // Local storage available

 // Persistent arrays
var topics                               // Array of topics (persistent)
var favorites                            // Array of favorite images (persist.)

 // Most-recent search variables
var prevQuery = ''                       // Previous search query
var prevOffset                           // Results offset for next pull for q.
var count                                // Count of images so far for query

 // Image object (to hold information on all images currently displayed on page)
var images

 //////////////////////////////////////////////////////////////////////////////
 // Functions and callbacks:
 //   storageAvailable(type)            Return true if Web storage be enabled
 //   loadTopics()                      Load topics from local storage
 //   resetTopics()                     Reset topics in local storage & on page
 //   displayButtons()                  Display topic buttons
 //   deleteTopic(index)                Delete topic corresponding to button
 //   pullImages(query, offset)         Pull (another) limit images for query
 //   pullGiphy(query, offset)          Pull images from Giphy
 //   pullFavorites(offset)             Pull images from favorites
 //   computeWidth(width, height)       Compute width to scale image to size^2
 //   computeHeight(width, height)      Compute height to scale image to size^2
 //   imageToggle()                     Toggle image playback
 //////////////////////////////////////////////////////////////////////////////

 // storageAvailable(type):  Return true if Web storage of _type_ be enabled
 // Based on code from:
 //   https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API/Using_the_Web_Storage_API
function storageAvailable(type) {
  var storage
  try {
    storage = window[type]
    var x = '_storage_test_'
    storage.setItem(x, x)
    storage.removeItem(x)
    return true}
    catch(e) {
      return e instanceof DOMException}
  }

 // loadTopics():  Load topics array from localStorage; otherwise initialize
function loadTopics() {
  var objString, obj
  if (localStorageAvailable || storageAvailable('localStorage')) {
    localStorageAvailable = true
    if (objString = localStorage.getItem('topics')) topics =
      JSON.parse(objString)
      else {
        localStorage.clear()
        topics = ['favorites', 'trending']
        localStorage.setItem('topics', JSON.stringify(topics))}
    if (objString = localStorage.getItem('favorites'))
      favorites = JSON.parse(objString)
      else {
        favorites = []
        localStorage.setItem('favorites', JSON.stringify(favorites))}
    }
    else {
      topics = ['favorites', 'trending']
      favorites = []}
  displayButtons()
  return}

 // resetTopics():  Clear topics array in localStorage, and initialize
function resetTopics() {
  var objString, obj
  if (localStorageAvailable || storageAvailable('localStorage')) {
    localStorageAvailable = true
    localStorage.clear()
    topics = ['favorites', 'trending']
    localStorage.setItem('topics', JSON.stringify(topics))
    favorites = []
    localStorage.setItem('favorites', JSON.stringify(favorites))}
    else {
      topics = ['favorites', 'trending']
      favorites = []}
  displayButtons()
  return}

 // displayButtons():  Display topic buttons
function displayButtons() {
  var div, button, dropdown, span, menu
  $('#buttons').empty()
 // Create persistent _favorites_ button
  div = $('<div>')
    div.attr('class', 'btn-group m-1')
  button = $('<button>')
    button.attr('type', 'button')
    button.attr('class', 'btn btn-primary btn-sm')
    button.attr('id', 'button-0')
    button.text('favorites')
  div.append(button)
  $('#buttons').append(div)
 // Create all other buttons as:
 //   <div class='btn-group'>
 //     <button type='button' class='btn btn-primary btn-sm topic' data-id='i'>
 //       topics[i]
 //     </button>
 //     <button type='button'
 //       class='btn btn-primary btn-sm dropdown-toggle dropdown-toggle-split'
 //       data-toggle='dropdown' aria-haspopup='true' aria-expanded='false'>
 //       <span class='sr-only'>Toggle Dropdown</span>
 //     </button>
 //     <div class='dropdown-menu'>
 //       <button type='button' class='dropdown-item' data-id='i'>
 //         Delete
 //       </button>
 //     </div>
 //   </div>
  for (var i = 1; i != topics.length; ++i) {
    div = $('<div>')
      div.attr('class', 'btn-group m-1')
    button = $('<button>')
      button.attr('type', 'button')
      button.attr('class', 'btn btn-primary btn-sm topic')
      button.attr('data-id', i.toString())
      button.text(topics[i])
    div.append(button)
    dropdown = $('<button>')
      dropdown.attr('type', 'button')
      dropdown.attr('class',
        'btn btn-primary btn-sm dropdown-toggle dropdown-toggle-split')
      dropdown.attr('data-toggle', 'dropdown')
      dropdown.attr('aria-haspopup', 'true')
      dropdown.attr('aria-expanded', 'false')
    span = $('<span>')
      span.attr('class', 'sr-only')
      span.text('Toggle Dropdown')
    dropdown.append(span)
    div.append(dropdown)
    menu = $('<div>')
      menu.attr('class', 'dropdown-menu')
    button = $('<button>')
      button.attr('type', 'button')
      button.attr('class', 'dropdown-item')
      button.attr('data-id', i.toString())
      button.text('Delete')
    menu.append(button)
    div.append(menu)
    $('#buttons').append(div)}
 // Bind handler to load (more) images
  $('.topic').click(function() {
    var i = $(this).attr('data-id')
    if (topics[i] === prevQuery) pullImages(topics[i], prevOffset + limit)
      else pullImages(topics[i], 0)
    return}
    )
 // Bind handler to delete buttons
  $('.dropdown-item').click(function() {
    deleteTopic(parseInt($(this).attr('data-id')))
    return}
    )
  return}

 // deleteTopic(i):  Delete topic corresponding to numbered button
function deleteTopic(i) {
  topics.splice(i, 1)
 // Update localStorage
  if (localStorageAvailable || storageAvailable('localStorage')) {
    localStorageAvailable = true
    localStorage.setItem('topics', JSON.stringify(topics))}
 // Re-create buttons
   displayButtons()
  return}

 // pullImages(query, offset):  Pull _limit_ images for _query_ at _offset_
function pullImages(query, offset) {
  if (query === 'favorites') pullFavorites(offset)
    else pullGiphy(query, offset)
  return}

 // pullGiphy(query, offset):  Pull _limit_ images for _query_ at _offset_
 //   If _query_ === _prevQuery_, attempt to pull _limit_ images from _offset_
 //   Otherwise, pull the first _limit_ images for the new _query_
function pullImages(query, offset) {
  var q = query.trim().toLowerCase()     // Local query
  var o = query === prevQuery ?offset :0 // Local offset
  var qplus = ''
  for (var i = 0; i !== q.length; ++i)
    qplus += q.charAt(i) === ' ' ? '+' : q.charAt(i)
  var queryURL
  if (query === 'trending')
    queryURL = 'https://api.giphy.com/v1/gifs/trending?api_key=' + api_key
    else {                               // !== 'trending'
      queryURL = 'https://api.giphy.com/v1/gifs/search?api_key=' + api_key
      queryURL += '&q=' + qplus
      queryURL += '&offset=' + o
      queryURL += '&lang=' + lang}
  queryURL += '&limit=' + limit
  queryURL += '&rating=' + rating
 // Debug
  console.log(`queryURL:  ${queryURL}`)
 // API call
  $.ajax({url: queryURL, method: 'GET'}).then(function(response) {
    if (response.meta && response.meta.status === 200) {
      var length = response.data.length
      var data = response.data
      images = {}                        // Reset image object
      var image                          // Temporary object for each image
      var card, img, div, h5, p, button  // jQuery variables to build card
      $('#images').empty()
      for (var i = 0; i != length; ++i) {
     // Create an info object for each image = same format used in favorites
        image = {}
          image.id = data[i].id          // Unique 18-character image ID
          image.rating = data[i].rating  // Image rating
          image.import_datetime = data[i].import_datetime
          image.stillURL = data[i].images.original_still.url
          image.animURL = data[i].images.original.url
          image.width = parseInt(data[i].images.original.width)
          image.height = parseInt(data[i].images.oiginal.height)
          image.title = data[i].title    // Image title
        images[image.id] = image         // Add image to imageArray
   // Create a card for each image in the following format:
   // <div class='card' style='width: 18rem'>
   //   <img src='URL' class='card-img-top' data-id='ID' data-status='still'/>
   //   <div class='card-body'>
   //     <h5 class='card-title'>Rating: RATING</h5>
   //     <p class='card-text'>TITLE</p>
   //     <p class='card-text'>Date: DATE</p>
   //     <button type='button' class='btn btn-primary btn-xsm save'
   //       data-id='ID'>Save</button>
   //     <a href='URL'<button type='button' class='btn btn-secondary btn-xsm download'
   //       data-id='ID'>Download</button>
   //   </div>
   // </div>
        card = $('<div>')
          card.css('width', '18rem')
        img = $('<img>')
          img.attr('src', image.stillURL)
          img.attr('class', 'card-img-top')
          img.attr('data-id', image.id)
          img.attr('data-status', 'still')
          img.css('width', computeWidth(image.width, image.height))
          img.css('height', computeHeight(image.width, image.height))
        card.append(img)
        div = $('<div>')
          div.attr('class', 'card-body')
        h5 = $('<h5>')
          h5.attr('class', 'card-title')
          h5.text(`Rating: ${image.rating}`)
        div.append(h5)
        if (info === 'full') {
          p = $('<p>')
            p.attr('class', 'card-text')
            p.text(image.title)
          div.append(p)
          p = $('<p>')
            p.attr('class', 'card-text')
            p.text(`Date: ${image.import_datetime}`)
          div.append(p)}
        button = $('<button>')
          button.attr('type', 'button')
          button.attr('class', 'btn btn-primary btn-xsm save')
          button.attr('data-id', image.id)
          button.text('Save')
        div.append(button)
        button = $('<button>')
          button.attr('type', 'button')
          button.attr('class', 'btn btn-secondary btn-xsm download')
          button.attr('data-id', image.id)
          button.text('Download')
        div.append(button)
        card.append(div)
        $('#images').append(card)}
     // Attach handler for toggling image playback
      $('.card-img-top').click(function() {
        imageToggle()
        return}
        )
     // Now attach handlers for _Save_ and _Download_ buttons
      $('.save').click(function() {

////GOT HERE
        return}
        )

  $('#pagination').empty()
      }

///careful with prevquery and offset calculations
  if (q === prevQuery) prevOffset = offset
    else {
      prevOffset
  prevQuery = q
    if (response.response_code !== 0) {
      $('#images').empty()
      $('#images').text(`Error: response_code = ${response.response_code}`)
      }

      else {                             // Error
        }
        })

  return}

 //   pullFavorites(offset)             Pull images from favorites

 //   If _query_ === _prevQuery_, attempt to pull _limit_ images from _offset_
 //   Otherwise, pull the first _limit_ images for the new _query_

//FAVORITES:
//download button
//delete button

 // computeWidth(width, height):  Compute width to scale image to area size^2
function computeWidth(width, height) {
  var scaleFactor = Math.sqrt(width * height / size / size)
  return Math.round(width / scaleFactor) + 'px'}

 // computeHeight(width, height):  Compute height to scale image to area size^2
function computeHeight(width, height) {
  var scaleFactor = Math.sqrt(width * height / size / size)
  return Math.round(height / scaleFactor) + 'px'}

 // imageToggle():  Toggle image playback
function imageToggle() {
  var id = $(this).attr('data-id')
  if ($(this).attr('data-status') === 'still') {
    $(this).attr('src', images[id].animURL)
    $(this).attr('data-status', 'anim')}
    else {
      $(this).attr('src', images[id].stillURL)
      $(this).attr('data-status', 'still')}
  return}

 // EVENT CALLBACK FUNCTIONS

 // If _Reset Topics_ be clicked, reset topics from localStorage and on page
$('#resetTopics').click(function() {
  resetTopics()
  return}
  )

 // If _Clear Images_ be clicked, remove images from page
$('#clearImages').click(function() {
  $('#images').empty()
  $('#pagination').empty()
  prevQuery = ''
  return}
  )

 // When the settings modal is activated, autofocus on the first input field
$('#settingsModal').on('shown.bs.modal', function() {
  $('#limit').trigger('focus')
  return}
  )

 // This function is called when a user clicks on _OK_ in the settings modal
$('#settingsModalOK').click(function() {
   // String and number variables for validation
  var value, number
   // Get number of results per page
  value = $('#limit').val()
  if (value.length === 0) number = limit
    else number = parseInt(value)
   // Validate number of results per page
  if (isNaN(number)) $('#invalidSettingsModal').modal('show')
    else if (number < 1 || number > 100)
      $('#invalidSettingsModal').modal('show')
      else {
        limit = number
   // Get rating
        value = $('#rating').val()
        if (value.length !== 0) rating = value.trim()
   // Get lang
        value = $('#lang').val()
        if (value.length !== 0) lang = value.trim()
   // Get image size
        value = $('#size').val()
        if (value.length !== 0) size = parseInt(value)
   // Get info level
        value = $('#info').val()
        if (value.length !== 0) info = value.trim()}
  return}
  )

 // This function is called when a user clicks on _OK_ in the invalid settings
 //   modal
$('#invalidSettingsOK').click(function() {
   // Return to settings modal
  $('#settingsModal').modal('show')
  return}
  )

 // This function is called when a user clicks on _Submit_ in the search query
$('#submit').click(function(event) {
  event.preventDefault()
  var query = $('#query').val().trim().toLowerCase()
  if (query.length !== 0 && topics.indexOf(query) < 0) {
    var temp = [query]
    for (var i = 1; i !== topics.length; ++i) temp.push(topics[i])
    temp.sort()
    for (var i = 1; i !== temp.length + 1; ++i) topics[i] = temp[i - 1]
   // Update localStorage
    if (localStorageAvailable || storageAvailable('localStorage')) {
      localStorageAvailable = true
      localStorage.setItem('topics', JSON.stringify(topics))}
   // Display buttons, and pull images
    displayButtons()
    pullImages(query, 0)}
  return}
  )

 // Initialize by loading topics from localStorage
$(document).ready(loadTopics())
