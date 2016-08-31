(function(){
  gaEventTracking();
})();

//Google Analytics Event Tracking
function gaEventTracking(){
  //Example click listener
  document.getElementById("outside").addEventListener("click", function(){ //Change the ID 
    ga('send', 'event', 'Category Name', 'Action', 'Label Goes Here'); //Send an event to Google Analytics
  });
}
