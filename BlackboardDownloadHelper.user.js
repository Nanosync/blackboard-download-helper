// ==UserScript==
// @name         Blackboard Download Helper
// @namespace    https://github.com/nanosync
// @version      1.0
// @description  Adds a Download Files button to the Course Documents page in Blackboard Learn.
// @author       Nanosync
// @license      GPLv3 - http://www.gnu.org/licenses/gpl-3.0.txt
// @copyright    Copyright (C) 2019, by Nanosync
// @updateURL    https://github.com/nanosync/blackboard-download-helper/raw/master/BlackboardDownloadHelper.user.js
// @downloadURL  https://github.com/nanosync/blackboad-download-helper/raw/master/BlackboardDownloadHelper.user.js
// @require      http://code.jquery.com/jquery-3.4.1.min.js
// @match        https://ntulearn.ntu.edu.sg/webapps/blackboard/content/listContent.jsp*
// @match        https://*
// @run-at       document-idle
// @grant        GM_setValue
// @grant        GM_getValue
// ==/UserScript==

this.$ = this.jQuery = jQuery.noConflict(true);

function checkBlackboard() {
  let metaKeyword = $('meta[name=keywords]').attr("content");

  if (metaKeyword === 'Blackboard') {
    return true;
  } else {
    return false;
  }
}

// Halt execution of script
if (!checkBlackboard()) {
  return;
}

let attachments = [];
let $downloadList = null;
let $fileListButton = null;

const PREFERENCE_SHOWBOX = 'blackboard_showBox';
let prefShowBox = GM_getValue(PREFERENCE_SHOWBOX, true);

// HTML Section
const HTML_DOWNLOAD = '<input type="button" id="downloadAllExt" value="Download All Files" class="button-3" />';
const HTML_EXPAND_FILELIST = '<input type="button" id="expandFileList" value="File List" class="button-1" />';
const HTML_CHECKBOX_ZIP = '<input type="checkbox" id="excludeZip" name="excludeZip" checked>';
const HTML_LABEL_ZIP = '<label for="excludeZip">Exclude ZIP</label>';
const HTML_BOX = '<ul id="box" class="container clearfix" style="min-height: 25px"></ul>';
const HTML_INNER_BOX = '<li class="clearfix read"></li>';
const HTML_NOTIFICATION = '<div class="vtbegenerated" id="notification"><span style="font-weight: bold; color: red;">Please ensure you disable your browser\'s popup blocker and set PDFs to Download when opened!</span><br><br><strong>The following files are ready to download:</strong></div>';
const HTML_ORDEREDLIST = '<ol id="box-list" style="list-style: square; margin-left: 1.8em; max-height:180px; overflow:auto;"></ol>';

function resetDownloadList(list) {
  list.empty();
  attachments = [];
  $('#expandFileList').attr("value", "File List");
}

function populateBox(list, excludeZip) {
  resetDownloadList(list);

  let index = 1;
  $('.attachments li a').each(function() {
    let name = $(this).text().trim();
    let link = $(this).attr('href');

    // not a url
    if (link.indexOf('/') === -1) {
      return;
    }

    // exclude zip file
    if (excludeZip && name.indexOf('.zip') !== -1) {
      return;
    }

    attachments.push({ file: name, url: link });
    let listItem = "<li id=\"dl-item-" + index + "\">" + name + "</li>";
    list.append(listItem);
    index++;
  });

  $('#expandFileList').attr("value", "File List (" + attachments.length + ")");
}

function addButton() {
  let $btnDownload = $(HTML_DOWNLOAD);
  let $btnExpand = $(HTML_EXPAND_FILELIST);
  let $checkbox = $(HTML_CHECKBOX_ZIP);
  let $label = $(HTML_LABEL_ZIP);
  $('#_titlebarExtraContent').append($btnExpand);

  let $box = $(HTML_BOX);
  let $innerBox = $(HTML_INNER_BOX);

  let $notification = $(HTML_NOTIFICATION);
  let $orderedList = $(HTML_ORDEREDLIST);

  $box.append($innerBox);
  $innerBox.append($notification);
  $notification.after($orderedList);

  $('#pageTitleDiv').append($box);

  $downloadList = $orderedList;
  $fileListButton = $btnExpand;
  populateBox($orderedList, true);

  $orderedList.after("<br>");
  $orderedList.next().after($checkbox);
  $checkbox.after($label);
  $label.after("<br><br>");
  $label.next().next().after($btnDownload);

  // Hide the box
  if (attachments.length === 0 || !prefShowBox) {
    $box.toggle();
    console.log('hiding box');
  }

  // Add event handlers
  $btnDownload.on('click', function() {
    attachments.each(function(item) {
      var win = window.open(item.url, '_blank');
      if (win) {
          console.log('Opening ' + item.name + ' (' + item.url + ')');
      } else {
          console.log('Browser is blocking popups.');
      }
      });
  });

  $btnExpand.on('click', function(event) {
    $box.toggle();
    let visible = $box.is(':visible');
    prefShowBox = GM_setValue(PREFERENCE_SHOWBOX, visible);
  });

  $checkbox.on('change', function(event) {
    populateBox($downloadList, this.checked);
  });
}

setTimeout(addButton, 300);