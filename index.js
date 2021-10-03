var twitchappclientid = 'j81s5u7uwb27foxrx21jza7osx1vc8'
var oath = '72l08msbk4e17i6m0p7vs664co6dbb'
//Added a lot of checks to see if sessionStorage is allowed
//Removed checks for sessionStorage, they were cluttering the code 9/30/2021
//Pagination is not fun with the twitch api. too many errors with the cursor
//Need to add try and catches for failures
//Need to ask for feedback on the pagination as it seems finicky to pull different amount of results at random times 10/1/2021

function fetchApi (url) {
  return new Promise(async function (resolve, reject) {
    let xhr = new XMLHttpRequest()
    xhr.open('GET', url, true)
    // xhr.setRequestHeader('Access-Control-Allow-Origin', '*')
    // xhr.setRequestHeader('Access-Control-Allow-Methods', 'GET')
    // xhr.setRequestHeader('Access-Control-Max-Age', '86400')
    // xhr.setRequestHeader('Access-Control-Allow-Credentials', 'true')
    xhr.setRequestHeader('Client-ID', twitchappclientid)
    xhr.setRequestHeader('Authorization', 'Bearer ' + oath)
    // xhr.setRequestHeader('Cache-Control', 'public')
    // xhr.setRequestHeader('Cache-Control', 'max-age=10000')

    xhr.onload = function (e) {
      if (xhr.status === 200 && xhr.status < 300) {
        let data = JSON.parse(xhr.responseText)
        if (data == []) {
          resolve([])
        } else {
          resolve(data)
        }
      } else {
        console.log('No records found')
        alert(
          'Network Issue. No More Streams Available. Status Code: ' + xhr.status
        )
        reject({
          status: xhr.status,
          statusText: xhr.statusText
        })
      }
    }

    xhr.onerror = function () {
      console.log('Network error occurred')
      reject({
        status: xhr.status,
        statusText: xhr.statusText
      })
    }

    xhr.onprogress = function (e) {
      if (e.lengthComputable) {
        console.log(`${e.loaded} B of ${e.total} B loaded!`)
      } else {
        console.log(`${e.loaded} B loaded!`)
      }
    }

    xhr.send()
  })
}

async function getStreamsData () {
  let gamename = document.getElementById('game-name')
  if (gamename.value != '') {
    //Twitch Api URLS
    let gamesInfoURL = 'https://api.twitch.tv/helix/games'
    let streamsGrabURL = 'https://api.twitch.tv/helix/streams?game_id='
    let newGameInfoURL = encodeURI(
      gamesInfoURL + '?name=' + gamename.value.trim()
    )

    //HTML Items that need to be appended to
    let streamsDiv = document.getElementById('streams_section')
    let streamsContainer = document.getElementById('streamcontainer')
    let totals = document.getElementById('totalresults')
    let pages = document.getElementById('pagination')
    let errorText = document.getElementById('errorText')
    let btn_next = document.getElementById('btn_next')
    let btn_prev = document.getElementById('btn_prev')

    totals.innerHTML = ''
    pages.innerHTML = ''
    streamsDiv.innerHTML = ''

    //this is to save information to session storage so that it can be accessed anywhere (But it will be cleared if user closes tab/application)
    sessionStorage.setItem('records_per_page', 5)
    sessionStorage.setItem('current_page', 1)
    sessionStorage.setItem('previous_page', null)
    sessionStorage.setItem('old_cursor', null)

    //xhr requests
    let gameData = await fetchApi(newGameInfoURL)
    if (gameData.data.length == 0) {
      btn_prev.style.visibility = 'hidden'
      btn_next.style.visibility = 'hidden'
      errorText.style.visibility = 'visible'
      return
    } else {
      errorText.style.visibility = 'hidden'
      streamsContainer.style.visibility = 'visible'

      let newStreamURL =
        streamsGrabURL +
        gameData.data[0].id +
        '&first=' +
        sessionStorage.getItem('records_per_page')
      let streamData = await fetchApi(newStreamURL)

      sessionStorage.setItem('cursor', streamData.pagination.cursor)
      sessionStorage.setItem('gameid', gameData.data[0].id)

      var total = await fetchApi(
        streamsGrabURL + gameData.data[0].id + '&first=100'
      )
      total = total.data.length
      sessionStorage.setItem('total', total)
      // console.log(streamData) // This works now as of 9/29/2021
      // document.getElementById('btn_prev').style.visibility = 'visible'
      if (streamData.data.length !== 0) {
        document.getElementById('btn_next').style.visibility = 'visible'
      } else {
        btn_prev.style.visibility = 'hidden'
        btn_next.style.visibility = 'hidden'
      }

      totals.innerHTML +=
        '<p>Total Results: ' +
        parseInt(sessionStorage.getItem('total')) +
        '</p>'

      numofPages().then(function (res) {
        pages.innerHTML += '<span id="page"> 1 / ' + res + '</span>'
        sessionStorage.setItem('page_total', res)
      })

      //Below is for displaying the streams
      for (let item of streamData.data) {
        let thumbnailURL = item.thumbnail_url
          .replace('{width}', '250')
          .replace('{height}', '250')
        streamsDiv.innerHTML +=
          '<div class="individual_stream">' +
          '<img src="' +
          thumbnailURL +
          '" alt="Stream Thumbnail" />' +
          '<div class="stream_info">' +
          '<h3>' +
          item.title +
          '</h3>' +
          '<p class="username">' +
          item.user_name +
          '</p>' +
          '<p>' +
          item.game_name +
          ' - ' +
          item.viewer_count +
          ' Viewers </p>' +
          '<a class="visit_stream" href="https://www.twitch.tv/' +
          item.user_login +
          '" target="_blank">Visit Stream</a>' +
          '</div>'
      }
    }
  }
  //Just used to blank out search for testing
  // gamename.value = ''
}

//use localStorage to save and access the data and cursor
async function numofPages () {
  return Math.ceil(
    parseInt(sessionStorage.getItem('total')) /
      parseInt(sessionStorage.getItem('records_per_page'))
  )
  // return Math.ceil(
  //   (parseInt(sessionStorage.getItem('total')) +
  //     parseInt(sessionStorage.getItem('records_per_page')) -
  //     1) /
  //     parseInt(sessionStorage.getItem('records_per_page'))
  // )
  // return (
  //   (parseInt(sessionStorage.getItem('total')) +
  //     parseInt(sessionStorage.getItem('records_per_page')) -
  //     1) /
  //   parseInt(sessionStorage.getItem('records_per_page'))
  // )
}

async function prevPage () {
  if (parseInt(sessionStorage.getItem('current_page')) >= 1) {
    console.log('does this work prev')
    sessionStorage.setItem(
      'previous_page',
      sessionStorage.getItem('current_page')
    )
    sessionStorage.setItem(
      'current_page',
      parseInt(sessionStorage.getItem('current_page')) - 1
    )
    changePage(parseInt(sessionStorage.getItem('current_page')), 'prev')
  }
}

async function nextPage () {
  if (parseInt(sessionStorage.getItem('current_page')) >= 1) {
    console.log('does this work next')
    sessionStorage.setItem(
      'previous_page',
      sessionStorage.getItem('current_page')
    )
    sessionStorage.setItem(
      'current_page',
      parseInt(sessionStorage.getItem('current_page')) + 1
    )
    changePage(parseInt(sessionStorage.getItem('current_page')), 'next')
  }
}

async function changePage (page, type = null) {
  console.log('does it get here?', page)
  console.log('does it get here? type', type)
  let btn_next = document.getElementById('btn_next')
  let btn_prev = document.getElementById('btn_prev')
  let streams = document.getElementById('streams_section')
  let page_span = document.getElementById('page')
  let totals = document.getElementById('totalresults')

  let gameid = parseInt(sessionStorage.getItem('gameid'))
  let streamsGrabURL = 'https://api.twitch.tv/helix/streams?game_id=' + gameid
  let page_total
  numofPages().then(function (res) {
    page_total = res
  })
  // let page_total = parseInt(sessionStorage.getItem('page_total'))

  let newStreamURL
  if (type == 'prev') {
    if (sessionStorage.getItem('cursor') !== null) {
      newStreamURL =
        streamsGrabURL +
        '&first=5' +
        '&before=' +
        sessionStorage.getItem('cursor')
    } else {
      newStreamURL =
        streamsGrabURL +
        '&first=5' +
        '&before=' +
        sessionStorage.getItem('old_cursor')
    }
  } else if (type == 'next') {
    if (sessionStorage.getItem('cursor') !== null) {
      newStreamURL =
        streamsGrabURL +
        '&first=5' +
        '&after=' +
        sessionStorage.getItem('cursor')
    } else {
      newStreamURL =
        streamsGrabURL +
        '&first=5' +
        '&after=' +
        sessionStorage.getItem('old_cursor')
    }
  }
  console.log('what is the newurl', newStreamURL)
  let streamData = await fetchApi(newStreamURL)
  if (streamData.pagination.cursor)
    console.log('cursor new check', streamData.pagination.cursor)

  if (streamData.data !== [] || streamData.pagination !== {}) {
    // console.log('data is not empty yet')
    // Validate page
    if (page < 1) page = 1
    if (page > page_total) page = page_total

    console.log('cursor old check', sessionStorage.getItem('cursor'))
    if (type == 'next') {
      sessionStorage.setItem('old_cursor', sessionStorage.getItem('cursor'))
      sessionStorage.setItem('cursor', streamData.pagination.cursor)
    } else {
      sessionStorage.setItem('cursor', sessionStorage.getItem('old_cursor'))
      sessionStorage.setItem(
        'old_cursor',
        streamData.pagination !== {} ? streamData.pagination.cursor : {}
      )
    }
    console.log('cursor new check', streamData.pagination.cursor)

    streams.innerHTML = ''
    totals.innerHTML = ''

    // var i =
    //   (page - 1) *
    //   (typeof Storage !== 'undefined'
    //     ? parseInt(sessionStorage.getItem('records_per_page'))
    //     : records_per_page);
    // i <
    // page *
    //   (typeof Storage !== 'undefined'
    //     ? parseInt(sessionStorage.getItem('records_per_page'))
    //     : records_per_page);
    // i++
    console.log('streamData.data[i]', streamData)
    totals.innerHTML +=
      '<p>Total Results: ' + parseInt(sessionStorage.getItem('total')) + '</p>'
    for (let item of streamData.data) {
      //this is to update the streams on the page after change of page
      // console.log('streamData.data[i]', streamData.data)
      // console.log('streamData.data[i]', i)
      let thumbnailURL = item.thumbnail_url
        .replace('{width}', '250')
        .replace('{height}', '250')
      streams.innerHTML +=
        '<div class="individual_stream">' +
        '<img src="' +
        thumbnailURL +
        '" alt="Stream Thumbnail" />' +
        '<div class="stream_info">' +
        '<h3>' +
        item.title +
        '</h3>' +
        '<p class="username">' +
        item.user_name +
        '</p>' +
        '<p>' +
        item.game_name +
        ' - ' +
        item.viewer_count +
        ' Viewers </p>' +
        '<a class="visit_stream" href="https://www.twitch.tv/' +
        item.user_login +
        '" target="_blank">Visit Stream</a>' +
        '</div>'
    }
    page_span.innerHTML = page + ' / ' + page_total
  } else {
    sessionStorage.setItem('old_cursor', sessionStorage.getItem('cursor'))
    sessionStorage.setItem('cursor', null)
  }

  if (page == 1) {
    btn_prev.style.visibility = 'hidden'
  } else {
    btn_prev.style.visibility = 'visible'
  }

  if (page == page_total) {
    btn_next.style.visibility = 'hidden'
  } else {
    btn_next.style.visibility = 'visible'
  }
}
