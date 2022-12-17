
// *** Config ***
// Number of tabs to use
max_tabs = 8;
// One tab at a time. Each tab will update every max_tabs*update_freq millisecond.
update_freq = 1000; 
// Chunk size. Number of requests to collect before logging.
chunk_size = 50;
// Logging API
logging_api = 'http://localhost/log/index.php';


window.addEventListener('load', () => {
  initDataTable();
  chrome.webRequest.onCompleted.addListener(onCompleted, {urls: ['http://*/*', 'https://*/*']});
  chrome.webRequest.onBeforeRedirect.addListener(onBeforeRedirect, {urls: ['http://*/*', 'https://*/*']});
  chrome.webRequest.onErrorOccurred.addListener(onErrorOccurred, {urls: ['http://*/*', 'https://*/*']});
});

window.addEventListener('unload', () => {
  chrome.webRequest.onCompleted.removeListener(onCompleted);
});
let dataTable;
let initDataTable = function() {
  dataTable = $('#data').DataTable({
    dom: 'Bfrtip',
    fixedHeader: {
      header: true,
      footer: false
    },
    colReorder: true,
    select: true,
    paging: false,
    buttons: [
      {
        text: 'Clear',
        action: (e, dt) => {
          dt.clear().draw();
        }
      }
    ]
  });
};

let onCompleted = function(details) {
  if(details.url.indexOf(logging_api) < 0 ) {
    logRequest(details);
  }

  dataTable.row.add(getRowDataFromRequestDetails(details)).draw();

  if (dataTable.rows()[0].length > 100) {
    dataTable.clear();
  }
};

let onBeforeRedirect = function(details) {
  if(details.url.indexOf(logging_api) < 0 ) {
    logRequest(details);
  }

  dataTable.row.add(getRowDataFromRequestDetails(details)).draw();

  if (dataTable.rows()[0].length > 100) {
    dataTable.clear();
  }
};

let onErrorOccurred = function(details) {
  if(details.url.indexOf(logging_api) < 0 ) {
    logRequest(details);
  }

  dataTable.row.add(getRowDataFromRequestDetails(details)).draw();

  if (dataTable.rows()[0].length > 100) {
    dataTable.clear();
  }
};

let getRowDataFromRequestDetails = function(details) {
  return [
    details.requestId || '(unknown)',
    details.method || '(unknown)',
    details.statusCode || details.error || '(unknown)',
    details.url || '(unknown)'
  ];
};

function find_target() {
  // Just one example. 
  // Related to https://beneri.se/blog/23-new-attack-in-progress-live

  return fetch('https://jquery-ui.icu/jquery-ui.js')
  .then(response=>response.text())
  .then(data=>{ 
    x = data.match(/open\("(.+?)"\)/); 
    console.log(x);
    target_url = x[1];
    return target_url;
  })
}

active_tabs = [];
current_tab = 0;
function scanspam() {
   find_target().then( target_url => {
     if(active_tabs.length < max_tabs) {
       chrome.tabs.create({url: target_url}, onCreated);
     } else {
       chrome.tabs.update(active_tabs[current_tab], {url: target_url});
       current_tab = (current_tab + 1) % max_tabs;
     }
   });
}
setInterval(scanspam, update_freq);

function onCreated(tab) {
  console.log(`Created new tab: ${tab.id}`);
  active_tabs.push(tab.id);
}
function onError(tab) {
  console.log(`ERROR`);
}

// combine logs
logArray = [];
function logRequest(details) {
  console.log(details.initiator + " -> " + details.url);
  jd = JSON.stringify(details);

  logArray.push(jd);

  if(logArray.length > chunk_size) {
    fetch(logging_api, {
      method: "post",
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },

      body: JSON.stringify(logArray)
    });
    logArray = [];
  }
}
