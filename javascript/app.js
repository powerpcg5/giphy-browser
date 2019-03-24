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
 //   1836 Sunday, 24 March 2019 (EDT) [17979]
 //////////////////////////////////////////////////////////////////////////////

 // Giphy API key
const api_key = 'kPYfzciWv3mNaxBUymuXQMjS1RAwgB2B'

 // User settings
var limit = 10                           // Number of images per page
var rating = 'G'                         // Image rating
var lang = 'en'                          // Language/locale
var size = 200                           // Image size (square root of area)
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
    div.addClass('btn-group m-1')
  button = $('<button>')
    button.addClass('btn btn-primary btn-sm topic')
    button.attr('type', 'button')
    button.attr('data-id', '0')
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
      div.addClass('btn-group m-1')
    button = $('<button>')
      button.addClass('btn btn-primary btn-sm topic')
      button.attr('type', 'button')
      button.attr('data-id', i.toString())
      button.text(topics[i])
    div.append(button)
    dropdown = $('<button>')
      dropdown.addClass('btn btn-primary btn-sm dropdown-toggle')
      dropdown.addClass('dropdown-toggle-split')
      dropdown.attr('type', 'button')
      dropdown.attr('data-toggle', 'dropdown')
      dropdown.attr('aria-haspopup', 'true')
      dropdown.attr('aria-expanded', 'false')
    span = $('<span>')
      span.addClass('sr-only')
      span.text('Toggle Dropdown')
    dropdown.append(span)
    div.append(dropdown)
    menu = $('<div>')
      menu.addClass('dropdown-menu')
    button = $('<button>')
      button.addClass('dropdown-item')
      button.attr('type', 'button')
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
function pullGiphy(query, offset) {
  var q = query.trim().toLowerCase()     // Local query
  var o                                  // Local offset
  if (q === prevQuery && q !== 'trending') o = offset
    else o = count = 0                   // Reset _count_ and offset
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
      var card, img, div, p, s, cont, row, button, a // jQuery temporary var's
      $('#images').empty()
      for (var i = 0; i !== length; ++i) {
     // Create an info object for each image = same format used in _favorites_
        image = {}
          image.id = data[i].id          // Unique 18-character image ID
          image.rating = data[i].rating  // Image rating
          image.import_datetime = data[i].import_datetime
          image.width = parseInt(data[i].images.original.width)
          image.height = parseInt(data[i].images.original.height)
          if (data[i].images.original.url)
            image.animURL = data[i].images.original.url
            else {
              console.log(`No original URL for image ${image.id}`)
              image.animURL = 'images/Poweredby_640px-White_VertLogo.png'
              image.width = 640
              image.height = 225}
          if (data[i].images.original_still.url)
            image.stillURL = data[i].images.original_still.url
            else {
              console.log(`No still URL for image ${image.id}`)
              image.stillURL = image.animURL}
          image.title = data[i].title    // Image title
        images[image.id] = image         // Add image to image array
   // Create a card for each image in the following format:
   // <div class='card text-center' data-id='ID'>
   //   <img src='URL' class='card-img-top' data-id='ID' data-status='still'/>
   //   <div class='card-body'>
   //     <p>class='card-text'>Rating: RATING(<br/>
   //       TITLE<br/>
   //       Date: DATE)</p>
   //     <div class='container'>
   //       <div class='row justify-content-between'>
   //         <button type='button' class='btn btn-primary btn-sm save'
   //           data-id='ID'>Save</button>
   //         <a href='URL' download='FILE'>
   //           <button type='button' class='btn btn-secondary btn-sm download'
   //             data-id='ID'>Download</button>
   //         </a>
   //       </div>
   //     </div>
   //   </div>
   // </div>
        card = $('<div>')
          card.addClass('card text-center')
          card.attr('data-id', image.id)
        img = $('<img>')
          img.addClass('card-img-top')
          img.attr('src', image.stillURL)
          img.attr('data-id', image.id)
          img.attr('data-status', 'still')
          img.css('width', computeWidth(image.width, image.height))
          img.css('height', computeHeight(image.width, image.height))
        card.append(img)
        div = $('<div>')
          div.addClass('card-body')
        p = $('<p>')
          p.addClass('card-text')
          s = `Rating: ${image.rating}`
          if (info === 'full')
            s += `<br/>${image.title}<br/>Date: ${image.import_datetime}`
          p.html(s)
        div.append(p)
        cont = $('<div>')
          cont.addClass('container')
        row = $('<div>')
          row.addClass('row justify-content-between')
     // Create _Save_ button
        button = $('<button>')
          button.addClass('btn btn-primary btn-sm save')
          button.attr('type', 'button')
          button.attr('data-id', image.id)
          button.text('Save')
        row.append(button)
     // Create _Download_ button
        a = $('<a>')
          a.attr('href', image.animURL)
          a.attr('download',
            image.animURL.substring(image.animURL.lastIndexOf('/') + 1,
              image.animURL.lastIndexOf('.')) + '.html')
        button = $('<button>')
          button.addClass('btn btn-secondary btn-sm download')
          button.attr('type', 'button')
          button.attr('data-id', image.id)
          button.text('Download')
        a.append(button)
        row.append(a)
        cont.append(row)
        div.append(cont)
     // Append card to images
        card.append(div)
        $('#images').append(card)}
   // Attach handler for toggling image playback
      $('.card-img-top').click(function() {
        var id = $(this).attr('data-id')
        if ($(this).attr('data-status') === 'still') {
          $(this).attr('src', images[id].animURL)
          $(this).attr('data-status', 'anim')}
          else {
            $(this).attr('src', images[id].stillURL)
            $(this).attr('data-status', 'still')}
        return}
        )
   // Attach handlers for _Save_ button
      $('.save').click(function() {
        var id = $(this).attr('data-id')
        var inFavorites = false
        for (var i = 0; !inFavorites && i !== favorites.length; ++i)
          if (favorites[i].id === id) inFavorites = true
        if (!inFavorites) favorites[i] = images[id]
     // Also save to localStorage
        if (localStorageAvailable || storageAvailable('localStorage')) {
          localStorageAvailable = true
          localStorage.setItem('favorites', JSON.stringify(favorites))}
     // Make button inactive
        $('.save').each(function() {
          if ($(this).attr('data-id') === id) {
            $(this).attr('disabled', 'disabled')
            $(this).off('click')}
          return}
          )
        return}
        )
   // Update count of images pulled so far for current query
      count = Math.max(count, o + length)
   // Display pagination
      $('#pagination').empty()
      var nav, ul, li                    // jQuery variables to build pagination
   // Build Bootstrap pagination along the lines of the following:
   // <nav aria-label='Image navigation bar' class='mt-3'>
   //   <ul class='pagination justify-content-center'>
   //     <li class='page-item page' data-offset='OFFSET'>
   //       <a class='page-link' href='#'>0&ndash;9</a>
   //     </li>
   //     <li class='page-item page (active)' data-offset='OFFSET'>
   //       <a class='page-link' href='#'>10&ndash;19</a>
   //     </li>
   //     <li class='page-item (disabled)' data-offset='OFFSET'>
   //       <a class='page-link' href='#' (tabindex='-1')>More</a>
   //     </li>
   //   </ul>
   // </nav>
      nav = $('<nav>')
        nav.addClass('mt-3')
        nav.attr('aria-label', 'Image navigation bar')
      ul = $('<ul>')
        ul.addClass('pagination justify-content-center')
      var first = 0, next
      while (first < count) {
        next = Math.min(first + limit, count)
        li = $('<li>')
          li.addClass('page-item page')
          if (o >= first && o < next) li.addClass('active')
          li.attr('data-offset', `${first}`)
        a = $('<a>')
          a.addClass('page-link')
          a.attr('href', '#')
          a.html(`${first}&ndash;${next - 1}`)
        li.append(a)
        ul.append(li)
        first = next}
   // Now add pagination button for `More' images
   //   (except for _trending_, which does not allow specifying an _offset_)
      li = $('<li>')
        li.addClass('page-item')
        if (length === limit && q !== 'trending') li.addClass('page')
          else li.addClass('disabled')
        li.attr('data-offset', `${count}`)
      a = $('<a>')
        a.addClass('page-link')
        a.attr('href', '#')
        if (length < limit || q === 'trending') li.attr('tabindex', '-1')
        a.text('More')
      li.append(a)
      ul.append(li)
      nav.append(ul)
      $('#pagination').append(nav)
   // Now add handlers for pagination buttons
      $('.page').click(function() {
        var offset = parseInt($(this).attr('data-offset'))
        pullGiphy(prevQuery, offset)
        return}
        )
   // Update prevQuery and prevOffset
      prevQuery = q
      prevOffset = o}
      else {                             // API call failed
        $('#images').empty()
        $('#images').text(`Error:  ${JSON.stringify(response)}`)
        $('#pagination').empty()}
    })
  return}

 // pullFavorites(offset):  Pull images from favorites
 //   If _query_ === _prevQuery_, attempt to pull _limit_ images from favorites
 //   Otherwise, pull the first _limit_ images from favorites
function pullFavorites(offset) {
  var o                                  // Local offset
  if (prevQuery === 'favorites')
    if (o < favorites.length) o = offset
      else {                             // Floor offset down to next multiple
        o = Math.floor((favorites.length - 1) / limit)
        o = o < 0 ? 0 : limit * o}
    else o = count = 0                   // Reset _count_ and offset
  var images = {}                        // Reset image object
  var image                              // Temporary object for each image
  var card, img, div, p, s, cont, row, button, a // jQuery temporary var's
  $('#images').empty()
  var length = Math.min(limit, favorites.length - o)
  for (var i = 0; i !== length; ++i) {
    image = favorites[o + i]
 // FYI the above info object has the following structure built by pullGiphy():
   // image.id = data[i].id              // Unique 18-character image ID
   // image.rating = data[i].rating      // Image rating
   // image.import_datetime = data[i].import_datetime
   // image.width = parseInt(data[i].images.original.width)
   // image.height = parseInt(data[i].images.original.height)
   // image.animURL = data[i].images.original.url
   // image.stillURL = data[i].images.original_still.url
   // image.title = data[i].title        // Image title
    images[image.id] = image         // Add image to image array
   // Create a card for each image in the following format:
   // <div class='card text-center' data-id='ID'>
   //   <img src='URL' class='card-img-top' data-id='ID' data-status='still'/>
   //   <div class='card-body'>
   //     <p>class='card-text'>Rating: RATING(<br/>
   //       TITLE<br/>
   //       Date: DATE)</p>
   //     <div class='container'>
   //       <div class='row justify-content-between'>
   //         <button type='button' class='btn btn-danger btn-sm delete'
   //           data-id='ID'>Delete</button>
   //         <a href='URL' download='FILE'>
   //           <button type='button' class='btn btn-secondary btn-sm download'
   //             data-id='ID'>Download</button>
   //         </a>
   //       </div>
   //     </div>
   //   </div>
   // </div>
    card = $('<div>')
      card.addClass('card text-center')
      card.attr('data-id', image.id)
    img = $('<img>')
      img.addClass('card-img-top')
      img.attr('src', image.stillURL)
      img.attr('data-id', image.id)
      img.attr('data-status', 'still')
      img.css('width', computeWidth(image.width, image.height))
      img.css('height', computeHeight(image.width, image.height))
    card.append(img)
    div = $('<div>')
      div.addClass('card-body')
    p = $('<p>')
      p.addClass('card-text')
      s = `Rating: ${image.rating}`
      if (info === 'full')
        s += `<br/>${image.title}<br/>Date: ${image.import_datetime}`
      p.html(s)
    div.append(p)
    cont = $('<div>')
      cont.addClass('container')
    row = $('<div>')
      row.addClass('row justify-content-between')
   // Create _Delete_ button
    button = $('<button>')
      button.addClass('btn btn-danger btn-sm delete')
      button.attr('type', 'button')
      button.attr('data-id', image.id)
      button.text('Delete')
    row.append(button)
   // Create _Download_ button
    a = $('<a>')
      a.attr('href', image.animURL)
      a.attr('download',
        image.animURL.substring(image.animURL.lastIndexOf('/') + 1,
          image.animURL.lastIndexOf('.')) + '.html')
    button = $('<button>')
      button.addClass('btn btn-secondary btn-sm download')
      button.attr('type', 'button')
      button.attr('data-id', image.id)
      button.text('Download')
    a.append(button)
    row.append(a)
    cont.append(row)
    div.append(cont)
   // Append card to images
    card.append(div)
    $('#images').append(card)}
 // Attach handler for toggling image playback
  $('.card-img-top').click(function() {
    var id = $(this).attr('data-id')
    if ($(this).attr('data-status') === 'still') {
      $(this).attr('src', images[id].animURL)
      $(this).attr('data-status', 'anim')}
      else {
        $(this).attr('src', images[id].stillURL)
        $(this).attr('data-status', 'still')}
    return}
    )
 // Attach handlers for _Delete_ button
  $('.delete').click(function() {
    var id = $(this).attr('data-id')
    var index = -1
    for (i = 0; index < 0 && i !== favorites.length; ++i)
      if (favorites[i].id === id) index = i
    if (index >= 0) {
      favorites.splice(index, 1)
     // Also remove from localStorage
      if (localStorageAvailable || storageAvailable('localStorage')) {
        localStorageAvailable = true
        localStorage.setItem('favorites', JSON.stringify(favorites))}
      }
     // Now delete image from page
    $('.card').each(function() {
      if ($(this).attr('data-id') === id) $(this).remove()
      if (count >= 0) --count
      return}
      )
    return}
    )
 // Update count of images pulled so far for current query
  count = Math.max(count, o + length)
 // Display pagination
  $('#pagination').empty()
  var nav, ul, li                    // jQuery variables to build pagination
 // Build Bootstrap pagination along the lines of the following:
 // <nav aria-label='Image navigation bar' class='mt-3'>
 //   <ul class='pagination justify-content-center'>
 //     <li class='page-item page' data-offset='OFFSET'>
 //       <a class='page-link' href='#'>0&ndash;9</a>
 //     </li>
 //     <li class='page-item page (active)' data-offset='OFFSET'>
 //       <a class='page-link' href='#'>10&ndash;19</a>
 //     </li>
 //   </ul>
 // </nav>
  nav = $('<nav>')
    nav.addClass('mt-3')
    nav.attr('aria-label', 'Image navigation bar')
  ul = $('<ul>')
    ul.addClass('pagination justify-content-center')
  var first = 0, next
  while (first < favorites.length) {
    next = Math.min(first + limit, favorites.length)
    li = $('<li>')
      li.addClass('page-item page')
      if (o >= first && o < next) li.addClass('active')
      li.attr('data-offset', `${first}`)
    a = $('<a>')
      a.addClass('page-link')
      a.attr('href', '#')
      a.html(`${first}&ndash;${next - 1}`)
    li.append(a)
    ul.append(li)
    first = next}
  nav.append(ul)
  $('#pagination').append(nav)
 // Now add handlers for pagination buttons
  $('.page').click(function() {
    var offset = parseInt($(this).attr('data-offset'))
    pullFavorites(offset)
    return}
    )
 // Update prevQuery and prevOffset
  prevQuery = 'favorites'
  prevOffset = o
  return}

 // computeWidth(width, height):  Compute width to scale image to area size^2
function computeWidth(width, height) {
  var scaleFactor = Math.sqrt(width * height / size / size)
  return Math.round(width / scaleFactor) + 'px'}

 // computeHeight(width, height):  Compute height to scale image to area size^2
function computeHeight(width, height) {
  var scaleFactor = Math.sqrt(width * height / size / size)
  return Math.round(height / scaleFactor) + 'px'}

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
