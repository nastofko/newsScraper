// // Grab the articles as a json
// $.getJSON("/articles", function(data) {
//     // For each one
//     for (var i = 0; i < data.length; i++) {
//       // Display the apropos information on the page
//       $("#articles").append("<p data-id='" + data[i]._id + "'>" + data[i].title + "<br />" + data[i].link + "</p>");
//     }
//   });
  
  
//   // Whenever someone clicks a p tag
//   $(document).on("click", "p", function() {
//     // Empty the notes from the note section
//     $("#notes").empty();
//     // Save the id from the p tag
//     var thisId = $(this).attr("data-id");
  
//     // Now make an ajax call for the Article
//     $.ajax({
//       method: "GET",
//       url: "/articles/" + thisId
//     })
//       // With that done, add the note information to the page
//       .then(function(data) {
//         console.log(data);
//         // The title of the article
//         $("#notes").append("<h2>" + data.title + "</h2>");
//         // An input to enter a new title
//         $("#notes").append("<input id='titleinput' name='title' >");
//         // A textarea to add a new note body
//         $("#notes").append("<textarea id='bodyinput' name='body'></textarea>");
//         // A button to submit a new note, with the id of the article saved to it
//         $("#notes").append("<button data-id='" + data._id + "' id='savenote'>Save Note</button>");
  
//         // If there's a note in the article
//         if (data.note) {
//           // Place the title of the note in the title input
//           $("#titleinput").val(data.note.title);
//           // Place the body of the note in the body textarea
//           $("#bodyinput").val(data.note.body);
//         }
//       });
//   });
  
//   // When you click the savenote button
//   $(document).on("click", "#savenote", function() {
//     // Grab the id associated with the article from the submit button
//     var thisId = $(this).attr("data-id");
  
//     // Run a POST request to change the note, using what's entered in the inputs
//     $.ajax({
//       method: "POST",
//       url: "/articles/" + thisId,
//       data: {
//         // Value taken from title input
//         title: $("#titleinput").val(),
//         // Value taken from note textarea
//         body: $("#bodyinput").val()
//       }
//     })
//       // With that done
//       .then(function(data) {
//         // Log the response
//         console.log(data);
//         // Empty the notes section
//         $("#notes").empty();
//       });
  
//     // Also, remove the values entered in the input and textarea for note entry
//     $("#titleinput").val("");
//     $("#bodyinput").val("");
//   });
  

$(document).ready(function () {

    //function to post a note to server
    function sendNote(element) {
      let note = {};
      note.articleId = $(element).attr('data-id'),
      note.title = $('#noteTitleEntry').val().trim();
      note.body = $('#noteBodyEntry').val().trim();
      if (note.title && note.body){
        $.ajax({
          url: '/notes/createNote',
          type: 'POST',
          data: note,
          success: function (response){
            showNote(response, note.articleId);
            $('#noteBodyEntry, #noteTitleEntry').val('');
          },
          error: function (error) {
            showErrorModal(error);
          }
        });
      }
    }//end of sendNote function
  
  
    //function to display error modal on ajax error
    function showErrorModal(error) {
      $('#error').modal('show');
    }
  
  
    //function to display notes in notemodal
    function showNote(element, articleId){
      let $title = $('<p>')
        .text(element.title)
        .addClass('noteTitle');
      let $deleteButton = $('<button>')
        .text('X')
        .addClass('deleteNote');
      let $note = $('<div>')
        .append($deleteButton, $title)
        .attr('data-note-id', element._id)
        .attr('data-article-id', articleId)
        .addClass('note')
        .appendTo('#noteArea');
    }//end of showNote function
  
    //event listener to reload root when user closes modal showing
    //number of scraped articles
    $('#alertModal').on('hide.bs.modal', function (e) {
      window.location.href = '/';
    });
  
    //click event to scrape new articles
    $('#scrape').on('click', function (e){
      e.preventDefault();
      $.ajax({
        url: '/scrape/newArticles',
        type: 'GET',
        success: function (response) {
          $('#numArticles').text(response.count);
        },
        error: function (error) {
          showErrorModal(error);
        },
        complete: function (result){
          $('#alertModal').modal('show');
        }
      });
    });//end of #scrape click event
  
    //click event to save an article
    $(document).on('click', '#saveArticle', function (e) {
      let articleId = $(this).data('id');
      $.ajax({
        url: '/articles/save/'+articleId,
        type: 'GET',
        success: function (response) {
          window.location.href = '/';
        },
        error: function (error) {
          showErrorModal(error);
        }
      });
    });//end of #saveArticle click event
  
    //click event to open note modal and populate with notes
    $('.addNote').on('click', function (e){
      $('#noteArea').empty();
      $('#noteTitleEntry, #noteBodyEntry').val('');
      let id = $(this).data('id');
      $('#submitNote, #noteBodyEntry').attr('data-id', id);
      $.ajax({
        url: '/notes/getNotes/'+id,
        type: 'GET',
        success: function (data){
          $.each(data.notes, function (i, item){
            showNote(item, id);
          });
          $('#noteModal').modal('show');
        },
        error: function (error) {
          showErrorModal(error);
        }
      });
    });//end of .addNote click event
  
    //click event to create a note
    $('#submitNote').on('click', function (e) {
      e.preventDefault();
      sendNote($(this));
    });//end of #submitNote click event
  
    //keypress event to allow user to submit note with enter key
    $('#noteBodyEntry').on('keypress', function (e) {
      if(e.keyCode === 13){
        sendNote($(this));
      }
    });//end of #noteBodyEntry keypress(enter) event
  
    //click event to delete an article from savedArticles
    $('.deleteArticle').on('click', function (e){
      e.preventDefault();
      let id = $(this).data('id');
      $.ajax({
        url: '/articles/deleteArticle/'+id,
        type: 'DELETE',
        success: function (response) {
          window.location.href = '/articles/viewSaved';
        },
        error: function (error) {
          showErrorModal(error);
        }
      });
    });//end of .deleteArticle click event
  
    //click event to delete a note from a saved article
    $(document).on('click', '.deleteNote', function (e){
      e.stopPropagation();
      let thisItem = $(this);
      let ids= {
        noteId: $(this).parent().data('note-id'),
        articleId: $(this).parent().data('article-id')
      };
  
      $.ajax({
        url: '/notes/deleteNote',
        type: 'POST',
        data: ids,
        success: function (response) {
          thisItem.parent().remove();
        },
        error: function (error) {
          showErrorModal(error);
        }
      });
    });//end of .deleteNote click event
  
    //click event to retrieve the title and body of a single note
    //and populate the note modal inputs with it
    $(document).on('click', '.note', function (e){
      e.stopPropagation();
      let id = $(this).data('note-id');
      $.ajax({
        url: '/notes/getSingleNote/'+id,
        type: 'GET',
        success: function (note) {
          $('#noteTitleEntry').val(note.title);
          $('#noteBodyEntry').val(note.body);
        },
        error: function (error) {
          console.log(error);
          showErrorModal(error);
        }
      });
    }); //end of .note click event
  
  });//end of document ready function